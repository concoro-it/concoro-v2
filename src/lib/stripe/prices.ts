export const PLANS = {
    pro: {
        name: 'Concoro Pro',
        price_monthly: 9.90,
        price_yearly: 99.00,
        price_id_monthly: process.env.STRIPE_PRO_PRICE_ID_MONTHLY ?? 'price_1T7tMsHUT08hMn2WM7DbU9oQ',
        price_id_yearly: process.env.STRIPE_PRO_PRICE_ID_YEARLY ?? 'price_1T7tMtHUT08hMn2WWw9Yyx0Z',
        features: [
            'Tutti i concorsi senza limiti',
            'Ricerche salvate illimitate',
            'AI Assistant Genio',
            'Notifiche email personalizzate',
            'Accesso anticipato a nuove funzionalità',
        ],
    },
} as const;
