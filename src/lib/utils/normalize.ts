import { Concorso } from '@/types/concorso';

// This file handles taking raw API objects (like those from an ingestion cron job)
// and normalizing them into the structures expected by our frontend components
// or our Supabase insert queries.

export function normalizeApiConcorso(raw: Record<string, unknown>): Partial<Concorso> {
    const getString = (value: unknown): string | null =>
        typeof value === 'string' && value.trim() ? value : null;
    const getArray = (value: unknown): string[] | null =>
        Array.isArray(value) ? value.map(String) : null;

    // If the raw data is already close to our schema, just pick the fields we need.
    // Add robust default handling for missing or malformed fields.

    return {
        concorso_id: (getString(raw.id) ?? getString(raw.concorso_id) ?? ''),
        slug: getString(raw.slug) ?? '',
        titolo: getString(raw.titolo) ?? getString(raw.title) ?? '',
        titolo_breve: getString(raw.titolo_breve),
        descrizione: getString(raw.descrizione) ?? getString(raw.description),
        riassunto: getString(raw.riassunto) ?? getString(raw.summary),
        ente_nome: getString(raw.ente_nome) ?? getString(raw.ente),
        ente_id: getString(raw.ente_id),
        ente_slug: getString(raw.ente_slug),
        favicon_url: getString(raw.favicon_url), // Ensure we map the favicon
        num_posti: typeof raw.num_posti === 'number' ? raw.num_posti : parseInt(String(raw.num_posti ?? ''), 10) || null,

        // Dates
        data_pubblicazione: getString(raw.data_pubblicazione) ?? getString(raw.published_at),
        data_scadenza: getString(raw.data_scadenza) ?? getString(raw.deadline),

        // Status normalization
        status: getString(raw.status) as Concorso['status'] ?? 'OPEN',
        status_label: getString(raw.status_label) ?? (raw.status === 'CLOSED' ? 'Scaduto' : 'Aperto'),

        // Arrays - be careful to extract from stringified objects or raw text arrays depending on the source format
        regioni_array: getArray(raw.regioni_array) ??
            (typeof raw.regioni === 'string' ? raw.regioni.split(',').map((r: string) => r.trim()) : null),

        province_array: getArray(raw.province_array) ??
            (typeof raw.province === 'string' ? raw.province.split(',').map((p: string) => p.trim()) : null),

        sedi: getArray(raw.sedi),
        categorie: getArray(raw.categorie),
        settori: getArray(raw.settori),

        // Standard links
        link_sito_pa: getString(raw.link_sito_pa) ?? getString(raw.url),
    };
}
