'use server';

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { getProPriceId, PRO_TRIAL_DAYS } from '@/lib/stripe/prices';
import { redirect } from 'next/navigation';
import { getServerAppUrl } from '@/lib/auth/url';
import type Stripe from 'stripe';

const APP_URL = getServerAppUrl();

export async function createPortalSession() {
    if (!stripe) {
        throw new Error('Stripe is not configured.');
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Non autorizzato');
    }

    // Get the user's stripe customer id
    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

    if (!profile?.stripe_customer_id) {
        throw new Error('Nessun abbonamento attivo trovato.');
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${APP_URL}/abbonamento`,
    });

    redirect(session.url);
}

export async function createCheckoutSession() {
    if (!stripe) {
        throw new Error('Stripe is not configured.');
    }

    const priceId = getProPriceId('monthly');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Non autorizzato');
    }

    // Get the user's stripe customer id, if exists
    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email')
        .eq('id', user.id)
        .single();

    const sessionObj: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        payment_method_types: ['card'],
        payment_method_collection: 'always',
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: `${APP_URL}/abbonamento?success=true`,
        cancel_url: `${APP_URL}/pricing?canceled=true`,
        client_reference_id: user.id,
        subscription_data: {
            trial_period_days: PRO_TRIAL_DAYS,
            trial_settings: {
                end_behavior: {
                    missing_payment_method: 'cancel',
                },
            },
        },
    };

    if (profile?.stripe_customer_id) {
        sessionObj.customer = profile.stripe_customer_id;
    } else {
        sessionObj.customer_email = user.email || profile?.email;
    }

    const session = await stripe.checkout.sessions.create(sessionObj);

    if (session.url) {
        redirect(session.url);
    } else {
        throw new Error('Errore durante la creazione della sessione Stripe');
    }
}
