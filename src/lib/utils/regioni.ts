// lib/utils/regioni.ts
export const REGIONE_SLUG_MAP: Record<string, string> = {
    'abruzzo': 'Abruzzo',
    'basilicata': 'Basilicata',
    'calabria': 'Calabria',
    'campania': 'Campania',
    'emilia-romagna': 'Emilia Romagna',
    'friuli-venezia-giulia': 'Friuli Venezia Giulia',
    'lazio': 'Lazio',
    'liguria': 'Liguria',
    'lombardia': 'Lombardia',
    'marche': 'Marche',
    'molise': 'Molise',
    'piemonte': 'Piemonte',
    'puglia': 'Puglia',
    'sardegna': 'Sardegna',
    'sicilia': 'Sicilia',
    'toscana': 'Toscana',
    'trentino-alto-adige': 'Trentino Alto Adige',
    'umbria': 'Umbria',
    'valle-d-aosta': "Valle d'Aosta",
    'veneto': 'Veneto',
};

export function toUrlSlug(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/['']/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

export function getAllRegioni(): string[] {
    return Object.values(REGIONE_SLUG_MAP);
}

export function regioneFromSlug(slug: string): string | null {
    return REGIONE_SLUG_MAP[slug] ?? null;
}
