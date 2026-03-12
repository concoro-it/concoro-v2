import { stripe } from '@/lib/stripe/client';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createStaticAdminClient } from '@/lib/supabase/server';
import { deleteUserSubscription, updateUserSubscription } from '@/lib/supabase/subscriptions';
import {
    acquireDispatchLock,
    dispatchBrevoEventOnce,
    getProfileWithCounts,
    toBrevoContactAttributes,
    upsertContact,
} from '@/lib/brevo';

const supabaseAdmin = createStaticAdminClient();

function getStripeCustomerId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
    if (!value) return null;
    return typeof value === 'string' ? value : value.id;
}

async function getProfileByStripeCustomerId(customerId: string) {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();

    if (error) {
        console.error('[stripe-webhook] failed to resolve user by stripe_customer_id', { customerId, error });
        return null;
    }

    return data;
}

async function syncContactAndPublishPaymentEvent(
    paymentEventName: 'payment_received' | 'payment_upcoming_7d' | 'payment_failed',
    stripeEvent: Stripe.Event,
    invoice: Stripe.Invoice
) {
    const customerId = getStripeCustomerId(invoice.customer as string | Stripe.Customer | Stripe.DeletedCustomer | null);
    if (!customerId) {
        console.warn('[stripe-webhook] invoice without customer id', { stripeEventId: stripeEvent.id, type: stripeEvent.type });
        return;
    }

    const profile = await getProfileByStripeCustomerId(customerId);
    if (!profile?.id || !profile.email) {
        console.warn('[stripe-webhook] no profile linked to stripe customer', { customerId, stripeEventId: stripeEvent.id });
        return;
    }

    const profileWithCounts = await getProfileWithCounts(supabaseAdmin, profile.id);
    if (!profileWithCounts) {
        return;
    }

    const attributes = toBrevoContactAttributes(profileWithCounts);
    await upsertContact(profile.email, attributes, profile.id);

    await dispatchBrevoEventOnce({
        supabase: supabaseAdmin,
        eventName: paymentEventName,
        eventKey: stripeEvent.id,
        email: profile.email,
        userId: profile.id,
        source: 'stripe_webhook',
        identifiers: {
            email_id: profile.email,
            ext_id: profile.id,
        },
        contactProperties: attributes,
        eventProperties: {
            stripe_event_id: stripeEvent.id,
            stripe_event_type: stripeEvent.type,
            stripe_invoice_id: invoice.id,
            stripe_customer_id: customerId,
            amount_due: invoice.amount_due,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
            invoice_status: invoice.status,
            billing_reason: invoice.billing_reason,
            period_end:
                invoice.lines.data[0]?.period?.end != null
                    ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
                    : null,
            hosted_invoice_url: invoice.hosted_invoice_url,
        },
    });
}

export async function POST(req: Request) {
    const rawBody = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!stripe) {
            return new NextResponse('Stripe not configured', { status: 500 });
        }
        event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (error: any) {
        console.error(`Webhook Error: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const lock = await acquireDispatchLock({
        supabase: supabaseAdmin,
        eventName: 'stripe_webhook',
        eventKey: event.id,
        source: 'stripe_webhook',
        payload: {
            stripe_event_type: event.type,
        },
    });

    if (lock.deduped) {
        return new NextResponse('Webhook already processed', { status: 200 });
    }

    if (!lock.acquired) {
        return new NextResponse('Failed to acquire webhook lock', { status: 500 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                if (session.mode === 'subscription' && session.client_reference_id) {
                    const subscriptionId = session.subscription as string;
                    const stripeSubscription = await stripe!.subscriptions.retrieve(subscriptionId);
                    const priceId = stripeSubscription.items.data[0].price.id;

                    await updateUserSubscription(
                        supabaseAdmin,
                        session.client_reference_id,
                        priceId,
                        stripeSubscription.status,
                        session.customer as string,
                        subscriptionId,
                        new Date((stripeSubscription as any).current_period_end * 1000)
                    );
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const priceId = subscription.items.data[0].price.id;

                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', subscription.customer as string)
                    .maybeSingle();

                if (profile?.id) {
                    await updateUserSubscription(
                        supabaseAdmin,
                        profile.id,
                        priceId,
                        subscription.status,
                        subscription.customer as string,
                        subscription.id,
                        new Date((subscription as any).current_period_end * 1000)
                    );
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await deleteUserSubscription(supabaseAdmin, subscription.id);
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice;
                await syncContactAndPublishPaymentEvent('payment_received', event, invoice);
                break;
            }

            case 'invoice.upcoming': {
                const invoice = event.data.object as Stripe.Invoice;
                await syncContactAndPublishPaymentEvent('payment_upcoming_7d', event, invoice);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await syncContactAndPublishPaymentEvent('payment_failed', event, invoice);
                break;
            }

            default:
                console.warn(`[stripe-webhook] Unhandled event type: ${event.type}`);
        }
    } catch (error) {
        console.error('[stripe-webhook] handler failed:', error);

        await supabaseAdmin
            .from('brevo_event_dispatches')
            .delete()
            .eq('event_name', 'stripe_webhook')
            .eq('event_key', event.id);

        return new NextResponse('Webhook handler failed', { status: 500 });
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
}
