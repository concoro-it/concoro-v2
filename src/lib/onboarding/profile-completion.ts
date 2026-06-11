export interface ProfileCompletionInput {
    regione_interesse?: string | null;
    provincia_interesse?: string | null;
    preferred_regioni?: string[] | null;
    sede_preferita?: string | null;
    settori_interesse?: string[] | null;
    preferred_settori?: string[] | null;
    profilo_professionale?: string | null;
    titolo_studio?: string | null;
    anni_esperienza?: number | null;
    skills?: string[] | null;
    languages?: string[] | null;
    driving_licenses?: string[] | null;
    public_admin_experience?: boolean | null;
    contract_type?: string | null;
    current_sector?: string | null;
    preferred_job_families?: string[] | null;
    exclude_mobility?: boolean | null;
}

function hasText(value?: string | null) {
    return Boolean(value && value.trim().length > 0);
}

function hasItems(value?: string[] | null) {
    return Array.isArray(value) && value.some((item) => item.trim().length > 0);
}

export function calculateProfileCompletionScore(profile: ProfileCompletionInput) {
    let score = 0;

    if (hasText(profile.regione_interesse) || hasItems(profile.preferred_regioni)) score += 15;
    if (hasText(profile.provincia_interesse) || hasText(profile.sede_preferita)) score += 10;
    if (hasItems(profile.settori_interesse) || hasItems(profile.preferred_settori) || hasText(profile.current_sector)) score += 20;
    if (hasText(profile.profilo_professionale)) score += 15;
    if (hasText(profile.titolo_studio)) score += 15;
    if (profile.anni_esperienza !== null && profile.anni_esperienza !== undefined) score += 8;
    if (hasItems(profile.skills)) score += 10;
    if (profile.public_admin_experience !== null && profile.public_admin_experience !== undefined) score += 4;
    if (hasText(profile.contract_type)) score += 4;
    if (hasItems(profile.preferred_job_families)) score += 4;
    if (hasItems(profile.languages) || hasItems(profile.driving_licenses)) score += 4;

    return Math.min(score, 100);
}
