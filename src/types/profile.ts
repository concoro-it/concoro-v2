export type UserTier = 'anon' | 'free' | 'pro' | 'admin';

export interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    tier: UserTier;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    stripe_price_id: string | null;
    subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing' | null;
    subscription_period_end: string | null;
    preferred_regioni: string[] | null;
    preferred_settori: string[] | null;
    notification_email: boolean;
    created_at: string;
    updated_at: string;
}

export interface SavedConcorso {
    id: string;
    user_id: string;
    concorso_id: string;
    created_at: string;
    concorso?: import('./concorso').Concorso;
}

export interface SavedSearch {
    id: string;
    user_id: string;
    name: string;
    filters: {
        query?: string;
        regioni?: string[];
        province?: string[];
        settori?: string[];
        tipo_procedura?: string;
        ente_slug?: string;
        date_from?: string;
        date_to?: string;
    };
    created_at: string;
}
