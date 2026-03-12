export type UserTier = 'anon' | 'free' | 'pro' | 'admin';

export interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    tier: UserTier;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    stripe_price_id: string | null;
    subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing' | null;
    subscription_period_end: string | null;
    preferred_regioni: string[] | null;
    preferred_settori: string[] | null;
    regione_interesse: string | null;
    provincia_interesse: string | null;
    profilo_professionale: string | null;
    titolo_studio: string | null;
    anni_esperienza: number | null;
    settori_interesse: string[] | null;
    sede_preferita: string | null;
    remote_preferito: boolean;
    notification_email: boolean;
    obiettivo_concorso: string | null;
    disponibilita_mobilita: boolean;
    tempo_studio_settimanale: number | null;
    created_at: string;
    updated_at: string;
}

export interface ProfileFormValues {
    first_name: string;
    last_name: string;
    regione_interesse: string;
    provincia_interesse: string;
    profilo_professionale: string;
    titolo_studio: string;
    anni_esperienza: string;
    settori_interesse: string;
    sede_preferita: string;
    remote_preferito: boolean;
    notification_email: boolean;
    obiettivo_concorso: string;
    disponibilita_mobilita: boolean;
    tempo_studio_settimanale: string;
}

export type ProfileUpdatePayload = Partial<
    Pick<
        Profile,
        | 'first_name'
        | 'last_name'
        | 'regione_interesse'
        | 'provincia_interesse'
        | 'profilo_professionale'
        | 'titolo_studio'
        | 'anni_esperienza'
        | 'settori_interesse'
        | 'sede_preferita'
        | 'remote_preferito'
        | 'notification_email'
        | 'obiettivo_concorso'
        | 'disponibilita_mobilita'
        | 'tempo_studio_settimanale'
    >
>;

function nullIfEmpty(value: string): string | null {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

function parseSettori(value: string): string[] | null {
    const items = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    return items.length > 0 ? items : null;
}

export function mapProfileToFormValues(profile: Partial<Profile> | null): ProfileFormValues {
    return {
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
        regione_interesse: profile?.regione_interesse ?? '',
        provincia_interesse: profile?.provincia_interesse ?? '',
        profilo_professionale: profile?.profilo_professionale ?? '',
        titolo_studio: profile?.titolo_studio ?? '',
        anni_esperienza: profile?.anni_esperienza != null ? String(profile.anni_esperienza) : '',
        settori_interesse: profile?.settori_interesse?.join(', ') ?? '',
        sede_preferita: profile?.sede_preferita ?? '',
        remote_preferito: profile?.remote_preferito ?? false,
        notification_email: profile?.notification_email ?? true,
        obiettivo_concorso: profile?.obiettivo_concorso ?? '',
        disponibilita_mobilita: profile?.disponibilita_mobilita ?? false,
        tempo_studio_settimanale: profile?.tempo_studio_settimanale != null ? String(profile.tempo_studio_settimanale) : '',
    };
}

export function mapFormValuesToProfileUpdate(values: ProfileFormValues): ProfileUpdatePayload {
    const years = values.anni_esperienza.trim();
    const parsedYears = years === '' ? null : Number.parseInt(years, 10);
    const weeklyHours = values.tempo_studio_settimanale.trim();
    const parsedWeeklyHours = weeklyHours === '' ? null : Number.parseInt(weeklyHours, 10);

    return {
        first_name: nullIfEmpty(values.first_name),
        last_name: nullIfEmpty(values.last_name),
        regione_interesse: nullIfEmpty(values.regione_interesse),
        provincia_interesse: nullIfEmpty(values.provincia_interesse),
        profilo_professionale: nullIfEmpty(values.profilo_professionale),
        titolo_studio: nullIfEmpty(values.titolo_studio),
        anni_esperienza: parsedYears == null || Number.isNaN(parsedYears) ? null : Math.max(parsedYears, 0),
        settori_interesse: parseSettori(values.settori_interesse),
        sede_preferita: nullIfEmpty(values.sede_preferita),
        remote_preferito: values.remote_preferito,
        notification_email: values.notification_email,
        obiettivo_concorso: nullIfEmpty(values.obiettivo_concorso),
        disponibilita_mobilita: values.disponibilita_mobilita,
        tempo_studio_settimanale:
            parsedWeeklyHours == null || Number.isNaN(parsedWeeklyHours)
                ? null
                : Math.max(parsedWeeklyHours, 0),
    };
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
        stato?: 'aperti' | 'scaduti';
        sort?: 'scadenza' | 'recenti' | 'posti';
        published_from?: string;
        date_from?: string;
        date_to?: string;
    };
    created_at: string;
}
