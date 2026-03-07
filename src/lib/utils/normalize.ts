import { Concorso } from '@/types/concorso';

// This file handles taking raw API objects (like those from an ingestion cron job)
// and normalizing them into the structures expected by our frontend components
// or our Supabase insert queries.

export function normalizeApiConcorso(raw: any): Partial<Concorso> {
    // If the raw data is already close to our schema, just pick the fields we need.
    // Add robust default handling for missing or malformed fields.

    return {
        concorso_id: raw.id || raw.concorso_id || '',
        slug: raw.slug || '',
        titolo: raw.titolo || raw.title || '',
        titolo_breve: raw.titolo_breve || null,
        descrizione: raw.descrizione || raw.description || null,
        riassunto: raw.riassunto || raw.summary || null,
        ente_nome: raw.ente_nome || raw.ente || null,
        ente_id: raw.ente_id || null,
        ente_slug: raw.ente_slug || null,
        favicon_url: raw.favicon_url || null, // Ensure we map the favicon
        num_posti: typeof raw.num_posti === 'number' ? raw.num_posti : parseInt(raw.num_posti) || null,

        // Dates
        data_pubblicazione: raw.data_pubblicazione || raw.published_at || null,
        data_scadenza: raw.data_scadenza || raw.deadline || null,

        // Status normalization
        status: raw.status || 'OPEN',
        status_label: raw.status_label || (raw.status === 'CLOSED' ? 'Scaduto' : 'Aperto'),

        // Arrays - be careful to extract from stringified objects or raw text arrays depending on the source format
        regioni_array: Array.isArray(raw.regioni_array) ? raw.regioni_array :
            (typeof raw.regioni === 'string' ? raw.regioni.split(',').map((r: string) => r.trim()) : null),

        province_array: Array.isArray(raw.province_array) ? raw.province_array :
            (typeof raw.province === 'string' ? raw.province.split(',').map((p: string) => p.trim()) : null),

        sedi: Array.isArray(raw.sedi) ? raw.sedi : null,
        categorie: Array.isArray(raw.categorie) ? raw.categorie : null,
        settori: Array.isArray(raw.settori) ? raw.settori : null,

        // Standard links
        link_sito_pa: raw.link_sito_pa || raw.url || null,
    };
}
