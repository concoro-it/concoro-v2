export type BillingCycle = 'monthly' | 'yearly';

export const PLANS = {
    pro: {
        name: 'Concoro Pro',
        price_monthly: 9.90,
        price_yearly: 99.00,
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
