import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

if (!stripeSecretKey) {
    console.warn('[Stripe] STRIPE_SECRET_KEY not set — Stripe features will be unavailable');
}

if (process.env.NODE_ENV === 'production' && stripeSecretKey?.startsWith('sk_test_')) {
    console.error('[Stripe] STRIPE_SECRET_KEY is a test key in production.');
}

export const stripe = stripeSecretKey
    // @ts-ignore - Ignore exact string literal matching for apiVersion
    ? new Stripe(stripeSecretKey, { apiVersion: '2025-01-27.acacia' })
    : null;
