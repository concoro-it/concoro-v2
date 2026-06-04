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
    if (hasItems(profile.settori_interesse) || hasItems(profile.preferred_settori)) score += 20;
    if (hasText(profile.profilo_professionale)) score += 15;
    if (hasText(profile.titolo_studio)) score += 15;
    if (profile.anni_esperienza !== null && profile.anni_esperienza !== undefined) score += 10;
    if (hasItems(profile.skills)) score += 10;
    if (hasItems(profile.languages) || hasItems(profile.driving_licenses)) score += 5;

    return Math.min(score, 100);
}
