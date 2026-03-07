'use server';

import { stripe } from './client';
import { createClient } from '@/lib/supabase/server';

export async function getBillingDataAction() {
    try {
        if (!stripe) {
            throw new Error('Stripe not configured');
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('Unauthorized');
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        if (!profile?.stripe_customer_id) {
            return null;
        }

        const customer = (await stripe.customers.retrieve(profile.stripe_customer_id, {
            expand: ['invoice_settings.default_payment_method'],
        })) as any;

        if (customer.deleted) {
            return null;
        }

        const invoices = await stripe.invoices.list({
            customer: profile.stripe_customer_id,
            limit: 5,
        });

        const paymentMethod = customer.invoice_settings?.default_payment_method;

        return {
            email: customer.email,
            address: customer.address,
            paymentMethod: paymentMethod ? {
                brand: paymentMethod.card?.brand,
                last4: paymentMethod.card?.last4,
                exp_month: paymentMethod.card?.exp_month,
                exp_year: paymentMethod.card?.exp_year,
            } : null,
            invoices: invoices.data.map(invoice => ({
                id: invoice.id,
                amount_paid: invoice.amount_paid,
                currency: invoice.currency,
                status: invoice.status,
                created: invoice.created,
                pdf_url: invoice.invoice_pdf,
            })),
        };
    } catch (error) {
        console.error('[STRIPE_GET_BILLING_DATA]', error);
        throw error;
    }
}
