export type UserTier = 'anon' | 'free' | 'trial' | 'pro' | 'admin';

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
    preferred_job_families: string[] | null;
    regione_interesse: string | null;
    provincia_interesse: string | null;
    profilo_professionale: string | null;
    current_sector: string | null;
    contract_type: string | null;
    titolo_studio: string | null;
    anni_esperienza: number | null;
    settori_interesse: string[] | null;
    sede_preferita: string | null;
    remote_preferito: boolean;
    notification_email: boolean;
    obiettivo_concorso: string | null;
    disponibilita_mobilita: boolean;
    tempo_studio_settimanale: number | null;
    onboarding_completed: boolean;
    onboarding_completed_at: string | null;
    profile_completion_score: number | null;
    disponibilita_trasferimento: string | null;
    exclude_mobility: boolean;
    livello_preparazione: string | null;
    public_admin_experience: boolean | null;
    skills: string[] | null;
    languages: string[] | null;
    driving_licenses: string[] | null;
    profile_source: string | null;
    education_history: Array<Record<string, unknown>> | null;
    experience_history: Array<Record<string, unknown>> | null;
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
    preferred_regioni: string;
    skills: string;
    public_admin_experience: boolean;
    contract_type: string;
    current_sector: string;
    preferred_job_families: string;
    exclude_mobility: boolean;
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
        | 'preferred_regioni'
        | 'skills'
        | 'public_admin_experience'
        | 'contract_type'
        | 'current_sector'
        | 'preferred_job_families'
        | 'exclude_mobility'
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

function parseStringList(value: string): string[] | null {
    const items = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    return items.length > 0 ? Array.from(new Set(items)) : null;
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
        preferred_regioni: profile?.preferred_regioni?.join(', ') ?? '',
        skills: profile?.skills?.join(', ') ?? '',
        public_admin_experience: profile?.public_admin_experience ?? false,
        contract_type: profile?.contract_type ?? '',
        current_sector: profile?.current_sector ?? profile?.settori_interesse?.[0] ?? profile?.preferred_settori?.[0] ?? '',
        preferred_job_families: profile?.preferred_job_families?.join(', ') ?? '',
        exclude_mobility: profile?.exclude_mobility ?? false,
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
        preferred_regioni: parseStringList(values.preferred_regioni),
        skills: parseStringList(values.skills),
        public_admin_experience: values.public_admin_experience,
        contract_type: nullIfEmpty(values.contract_type),
        current_sector: nullIfEmpty(values.current_sector),
        preferred_job_families: parseStringList(values.preferred_job_families),
        exclude_mobility: values.exclude_mobility,
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

export interface UserAlertPreferences {
    user_id: string;
    deadline_enabled: boolean;
    deadline_offsets: number[];
    created_at: string;
    updated_at: string;
}

export interface SavedSearchAlertPreference {
    user_id: string;
    enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface SavedSearchAlertSubscription {
    id: string;
    user_id: string;
    saved_search_id: string;
    enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface SavedSearchAlertMatch {
    id: string;
    user_id: string;
    saved_search_id: string;
    concorso_id: string;
    first_seen_at: string;
    last_notified_at: string | null;
    created_at: string;
    updated_at: string;
}
