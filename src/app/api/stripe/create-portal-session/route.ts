import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getServerAppUrl } from '@/lib/auth/url';
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
            return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the user's stripe customer id
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError) {
            return NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 });
        }

        const host = req.headers.get('origin') || getServerAppUrl();
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

        if (!customerId) {
            return NextResponse.json(
                { error: 'No active subscription or customer ID found.' },
                { status: 404 }
            );
        }

        let session: Stripe.BillingPortal.Session;
        try {
            session = await stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: `${host}/abbonamento`,
            });
        } catch (error) {
            if (
                error instanceof Stripe.errors.StripeInvalidRequestError
                && error.code === 'resource_missing'
            ) {
                if (user.email) {
                    const recoveredCustomerId = await recoverStripeCustomerIdByEmail(user.email);
                    if (recoveredCustomerId) {
                        await supabase
                            .from('profiles')
                            .update({ stripe_customer_id: recoveredCustomerId })
                            .eq('id', user.id);

                        session = await stripe.billingPortal.sessions.create({
                            customer: recoveredCustomerId,
                            return_url: `${host}/abbonamento`,
                        });
                    } else {
                        return NextResponse.json(
                            { error: "Profilo Stripe non trovato. Avvia un nuovo checkout per riallineare l'account." },
                            { status: 404 }
                        );
                    }
                } else {
                    return NextResponse.json(
                        { error: "Profilo Stripe non trovato. Avvia un nuovo checkout per riallineare l'account." },
                        { status: 404 }
                    );
                }
            }
            else {
                throw error;
            }
        }

        if (!session.url) {
            return NextResponse.json({ error: 'Could not create portal session' }, { status: 500 });
        }

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('[STRIPE_PORTAL_SESSION]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
