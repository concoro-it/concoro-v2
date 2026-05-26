export type BillingCycle = 'monthly' | 'yearly';

export const PRO_TRIAL_DAYS = 7;

export const PLANS = {
    pro: {
        name: 'Concoro Pro',
        price_monthly: 4.99,
        price_yearly: 49.99,
        trial_days: PRO_TRIAL_DAYS,
        checkout_links: {
            monthly: 'https://buy.stripe.com/6oU3cxeuq4Tma3y6YMdUY01',
            yearly: 'https://buy.stripe.com/fZu00l1HE3Pi3FadnadUY02',
        },
        features: [
            'Tutti i concorsi senza limiti',
            'Ricerche salvate illimitate',
            'Saved search alerts con digest giornaliero',
            'AI Assistant Genio',
            'Notifiche email personalizzate',
            'Accesso anticipato a nuove funzionalità',
        ],
    },
} as const;

export function getProCheckoutLink(cycle: BillingCycle): string {
    return PLANS.pro.checkout_links[cycle];
}

export function buildProCheckoutUrl(
    cycle: BillingCycle,
    params?: {
        clientReferenceId?: string;
        email?: string;
    }
): string {
    const url = new URL(getProCheckoutLink(cycle));

    if (params?.clientReferenceId) {
        url.searchParams.set('client_reference_id', params.clientReferenceId);
    }

    if (params?.email) {
        url.searchParams.set('prefilled_email', params.email);
    }

    return url.toString();
}

export function getProPriceId(cycle: BillingCycle): string {
    const rawPriceId =
        cycle === 'yearly'
            ? process.env.STRIPE_PRO_PRICE_ID_YEARLY
            : process.env.STRIPE_PRO_PRICE_ID_MONTHLY;

    const priceId = rawPriceId?.trim().replace(/^['"]|['"]$/g, '');

    if (!priceId) {
        throw new Error(`Stripe price ID not configured for ${cycle} cycle`);
    }

    return priceId;
}
