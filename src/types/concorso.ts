// types/concorso.ts — mirrors the REAL Supabase schema
// NOTE: regioni_array, province_array, categorie, settori are native text[] arrays
// sedi is native jsonb (array of strings or objects)

export interface Concorso {
    concorso_id: string;
    status: 'OPEN' | 'CLOSED' | 'DRAFT' | null;
    status_label: string | null;
    slug: string | null;
    titolo: string;
    titolo_breve: string | null;
    descrizione: string | null;
    riassunto: string | null;
    figura_ricercata: string | null;
    num_posti: number | null;
    tipo_procedura: string | null;
    is_remote: boolean | null;
    salary_min: number | null;
    salary_max: number | null;
    data_pubblicazione: string | null;
    data_scadenza: string | null;
    data_visibilita: string | null;
    ente_nome: string | null;
    ente_id: string | null;
    ente_slug: string | null;
    favicon_url: string | null;
    // Native arrays (not JSON strings)
    sedi: string[] | null;           // jsonb stored as array
    regioni_array: string[] | null;  // text[] of stringified region objects
    province_array: string[] | null; // text[] of stringified province objects
    latitudine: string | null;
    longitudine: string | null;
    categorie: string[] | null;      // text[]
    settori: string[] | null;        // text[]
    allegati: Allegato[] | null;
    link_sito_pa: string | null;
    link_reindirizzamento: string | null;
    allegatoCount: number | null;    // numeric in DB
    allegatoMediaIds: string | null; // JSON string array of UUIDs
    link_allegati: string | null;    // JSON string array of full download URLs
    tipologia_mobilita: string | null;
    settore_professionale: string | null;
    regime_impegno: string | null;
    contatti: string | null;
    requisiti_generali: string[] | null; // jsonb stored as array
    programma_di_esame: string | null;
    ambito_lavorativo: string | null;
    capacita_richieste: string | null;
    collocazione_organizzativa: string | null;
    conoscenze_tecnico_specialistiche: string | null;
    annuncio_enrichment: any;
    ux_highlights: any;
    is_active: boolean | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface Allegato {
    id: string;
    tipo: string;
    label: string;
    mediaId: string;
    sequence?: number;
    concorso?: Record<string, unknown>;
}

export interface ConcorsoFilters {
    query?: string;
    regione?: string;
    provincia?: string;
    settore?: string;
    ente_slug?: string;
    tipo_procedura?: string;
    date_from?: string;
    date_to?: string;
    published_from?: string;
    published_to?: string;
    solo_attivi?: boolean;
    stato?: 'aperti' | 'scaduti' | 'tutti';
    sort?: 'scadenza' | 'recenti' | 'posti';
}
