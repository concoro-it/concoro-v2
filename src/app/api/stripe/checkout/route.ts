import { stripe } from '@/lib/stripe/client';
import { getProPriceId, type BillingCycle } from '@/lib/stripe/prices';
import { NextResponse } from 'next/server';
import { getServerAppUrl } from '@/lib/auth/url';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

function hasManageableSubscriptionStatus(status: Stripe.Subscription.Status): boolean {
    return status === 'active' || status === 'trialing' || status === 'past_due' || status === 'unpaid';
}

async function recoverStripeCustomerIdByEmail(email: string): Promise<string | null> {
    if (!stripe) return null;

    const customers = await stripe.customers.list({ email, limit: 10 });
    if (customers.data.length === 0) return null;

    for (const customer of customers.data) {
        const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'all',
            limit: 5,
        });
        if (subscriptions.data.some((subscription) => hasManageableSubscriptionStatus(subscription.status))) {
            return customer.id;
        }
    }

    return customers.data[0]?.id ?? null;
}

export async function POST(req: Request) {
    try {
        if (!stripe) {
            return new NextResponse('Stripe not configured', { status: 500 });
        }

        const body = await req.json();
        const { billingCycle } = body as { billingCycle?: BillingCycle };

        if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
            return new NextResponse('Missing or invalid billingCycle', { status: 400 });
        }

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const host = getServerAppUrl();
        const priceId = getProPriceId(billingCycle);
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .maybeSingle();

        let customerId = profile?.stripe_customer_id ?? null;
        if (!customerId && user.email) {
            customerId = await recoverStripeCustomerIdByEmail(user.email);
            if (customerId) {
                await supabase
                    .from('profiles')
                    .update({ stripe_customer_id: customerId })
                    .eq('id', user.id);
            }
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            client_reference_id: user.id,
            ...(customerId ? { customer: customerId } : (user.email ? { customer_email: user.email } : {})),
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${host}/hub/welcome-pro?session_id={CHECKOUT_SESSION_ID}&success=true&billing_cycle=${billingCycle}`,
            cancel_url: `${host}/pricing?canceled=true`,
        });

        if (!checkoutSession.url) {
            return new NextResponse('Could not create checkout session', { status: 500 });
        }

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error('[STRIPE_CHECKOUT]', error);

        if (error instanceof Stripe.errors.StripeError) {
            if (error.code === 'api_key_expired') {
                return new NextResponse('Stripe API key expired. Please update STRIPE_SECRET_KEY.', { status: 500 });
            }

            if (error.type === 'StripeAuthenticationError') {
                return new NextResponse('Stripe authentication failed. Check STRIPE_SECRET_KEY.', { status: 500 });
            }

            if (error.type === 'StripeInvalidRequestError') {
                return new NextResponse(error.message || 'Stripe request is invalid. Check configured price IDs.', { status: 500 });
            }

            return new NextResponse(error.message || 'Stripe error', { status: 500 });
        }

        if (error instanceof Error && error.message.includes('Stripe price ID not configured')) {
            return new NextResponse(error.message, { status: 500 });
        }

        return new NextResponse('Internal Error', { status: 500 });
    }
}
