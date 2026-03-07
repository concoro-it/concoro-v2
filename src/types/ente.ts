export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
    [key: string]: JsonValue;
}

export interface Ente {
    ente_id: string;
    ente_nome: string;
    indirizzo: string | null;
    comune: string | null;
    cap: string | null;
    provincia: string | null;
    regione: string | null;
    pec: string | null;
    telefono: string | null;
    sito_istituzionale: string | null;
    logo_url: string | null;
    cover_image_url: string | null;
    social_media: JsonValue | null;
    latitudine: number | null;
    longitudine: number | null;
    identita_istituzionale: JsonValue | null;
    analisi_logistica: JsonValue | null;
    vivere_il_territorio: JsonValue | null;
    valore_professionale: JsonValue | null;
    curiosita_storiche: JsonValue | null;
    faq_schema: JsonValue | null;
    metadata_seo: JsonValue | null;
    ai_enrichment_status: string | null;
    last_enriched_at: string | null;
    data_scadenza_cache: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface EnteMetadataSeo {
    h1_title?: string | null;
    og_title?: string | null;
    meta_description?: string | null;
}

export interface EnteIdentitaIstituzionale {
    prestigio?: string | null;
    descrizione?: string | null;
    ruolo_territoriale?: string | null;
}

export interface EnteAnalisiLogistica {
    pendolarismo?: string | null;
    stazione_vicina?: string | null;
    accessibilita_mezzi?: string | null;
}

export interface EnteVivereTerritorio {
    costo_vita?: string | null;
    servizi_vicini?: string | null;
    ambiente_sociale?: string | null;
    qualita_vita_score?: string | number | null;
}

export interface EnteValoreProfessionale {
    ccnl_standard?: string | null;
    welfare_tahmini?: string | null;
    stabilita_lavorativa?: string | null;
}

export interface EnteCuriositaStoriche {
    fatto1?: string | null;
    fatto2?: string | null;
    fatto3?: string | null;
}

export interface EnteFaqItem {
    question: string;
    answer: string;
}

export interface EnteSocialMedia {
    twitter?: string | null;
    youtube?: string | null;
    facebook?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
}
