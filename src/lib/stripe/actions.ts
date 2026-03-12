'use server';

import { stripe } from './client';
import { createClient } from '@/lib/supabase/server';

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
            .single();

        if (!profile?.stripe_customer_id) {
            return { invoices: [] };
        }

        const invoices = await stripe.invoices.list({
            customer: profile.stripe_customer_id,
            limit: 12,
        });

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
