import type { GenioProfileInput, NormalizedGenioProfile } from '@/types/genio';

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function cleanString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

function parseBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'si', 'sì', 'yes', 'y'].includes(normalized)) return true;
        if (['false', '0', 'no', 'n'].includes(normalized)) return false;
    }
    return fallback;
}

function toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value
            .map((item) => cleanString(item))
            .filter((item): item is string => Boolean(item));
    }

    if (typeof value === 'string') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
}

function uniqueStrings(items: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const item of items) {
        const key = item.toLocaleLowerCase('it-IT');
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(item);
    }

    return result;
}

function firstString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
        const value = cleanString(source[key]);
        if (value) return value;
    }
    return null;
}

function firstArray(source: Record<string, unknown>, keys: string[]): string[] {
    for (const key of keys) {
        const value = toStringArray(source[key]);
        if (value.length > 0) return value;
    }
    return [];
}

export function normalizeGenioProfile(input: GenioProfileInput | unknown): NormalizedGenioProfile {
    const source = isRecord(input) ? input : {};
    const preferredRegioni = uniqueStrings([
        ...firstArray(source, ['preferred_regioni']),
        ...toStringArray(source.regione_interesse),
    ]);
    const preferredJobFamilies = uniqueStrings([
        ...firstArray(source, ['preferred_job_families']),
        ...toStringArray(source.job_family_normalized),
    ]);
    const skills = uniqueStrings([
        ...firstArray(source, ['skills']),
        ...toStringArray(source.skill_tags),
    ]);

    const relocationFromLegacy = (() => {
        const value = source.disponibilita_trasferimento;
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (['si', 'sì', 'yes', 'true', 'disponibile'].includes(normalized)) return true;
            if (['no', 'false', 'non disponibile'].includes(normalized)) return false;
        }
        return parseBoolean(source.disponibilita_mobilita, false);
    })();

    return {
        is_public_employee: parseBoolean(source.is_public_employee, parseBoolean(source.public_admin_experience, false)),
        contract_type: firstString(source, ['contract_type']),
        current_sector: firstString(source, ['current_sector', 'settore_interesse'])
            ?? firstArray(source, ['settori_interesse'])[0]
            ?? null,
        profile: firstString(source, ['profile', 'profilo_professionale']),
        skills,
        preferred_regioni: preferredRegioni,
        preferred_job_families: preferredJobFamilies,
        willing_to_relocate: parseBoolean(source.willing_to_relocate, relocationFromLegacy),
        exclude_mobility: parseBoolean(source.exclude_mobility, false),
    };
}

export function normalizeMatchCount(value: unknown, fallback = 10): number {
    const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(1, Math.min(25, Math.round(parsed)));
}
