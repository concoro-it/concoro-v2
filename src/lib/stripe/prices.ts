export type BillingCycle = 'monthly' | 'yearly';

export const PLANS = {
    pro: {
        name: 'Concoro Pro',
        price_monthly: 9.90,
        price_yearly: 99.00,
        features: [
            'Tutti i concorsi senza limiti',
            'Ricerche salvate illimitate',
            'AI Assistant Genio',
            'Notifiche email personalizzate',
            'Accesso anticipato a nuove funzionalità',
        ],
    },
} as const;

export function getProPriceId(cycle: BillingCycle): string {
    const priceId =
        cycle === 'yearly'
            ? process.env.STRIPE_PRO_PRICE_ID_YEARLY
            : process.env.STRIPE_PRO_PRICE_ID_MONTHLY;

    if (!priceId) {
        throw new Error(`Stripe price ID not configured for ${cycle} cycle`);
    }

    return priceId;
}
