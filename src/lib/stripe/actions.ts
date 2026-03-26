'use server';

import { stripe } from './client';
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

export async function getBillingDataAction() {
    try {
        if (!stripe) {
            throw new Error('Stripe not configured');
        }

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('Unauthorized');
        }

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

        if (!customerId) {
            return { invoices: [] };
        }

        let invoices: Stripe.ApiList<Stripe.Invoice>;
        try {
            invoices = await stripe.invoices.list({
                customer: customerId,
                limit: 12,
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
                        invoices = await stripe.invoices.list({
                            customer: recoveredCustomerId,
                            limit: 12,
                        });
                    } else {
                        return { invoices: [] };
                    }
                } else {
                    return { invoices: [] };
                }
            }
            else {
                throw error;
            }
        }

        return {
            invoices: invoices.data.map((invoice) => ({
                id: invoice.id,
                amount_paid: invoice.amount_paid,
                currency: invoice.currency,
                status: invoice.status ?? 'unknown',
                created: invoice.created,
                pdf_url: invoice.invoice_pdf ?? null,
            })),
        };
    } catch (error) {
        console.error('[STRIPE_GET_BILLING_DATA]', error);
        throw error;
    }
}
