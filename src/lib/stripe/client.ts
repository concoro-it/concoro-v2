import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[Stripe] STRIPE_SECRET_KEY not set — Stripe features will be unavailable');
}

export const stripe = process.env.STRIPE_SECRET_KEY
    // @ts-ignore - Ignore exact string literal matching for apiVersion
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' })
    : null;
