export type GenioFitLabel =
    | 'Molto adatto'
    | 'Potenzialmente adatto'
    | 'Compatibilita parziale'
    | 'Compatibilità parziale'
    | 'Probabilmente non adatto';

export interface GenioProfileInput {
    is_public_employee?: unknown;
    public_admin_experience?: unknown;
    contract_type?: unknown;
    current_sector?: unknown;
    settore_interesse?: unknown;
    settori_interesse?: unknown;
    profile?: unknown;
    profilo_professionale?: unknown;
    skills?: unknown;
    skill_tags?: unknown;
    regione_interesse?: unknown;
    preferred_regioni?: unknown;
    job_family_normalized?: unknown;
    preferred_job_families?: unknown;
    willing_to_relocate?: unknown;
    disponibilita_mobilita?: unknown;
    disponibilita_trasferimento?: unknown;
    exclude_mobility?: unknown;
    [key: string]: unknown;
}

export interface NormalizedGenioProfile {
    is_public_employee: boolean;
    contract_type: string | null;
    current_sector: string | null;
    profile: string | null;
    skills: string[];
    preferred_regioni: string[];
    preferred_job_families: string[];
    willing_to_relocate: boolean;
    exclude_mobility: boolean;
}

export interface GenioMatchRequest {
    profile_json: NormalizedGenioProfile;
    match_count: number;
}

export interface GenioScoreBreakdown {
    semantic_score?: number;
    eligibility_score?: number;
    role_score?: number;
    skill_score?: number;
    location_score?: number;
    [key: string]: number | undefined;
}

export interface GenioAiExplanation {
    short_card_summary?: string;
    why_match?: string[];
    what_to_check?: string[];
    next_action?: string;
}

export interface GenioMatchResult {
    rank: number;
    concorso_id: string;
    genio_score: number;
    fit_label: GenioFitLabel | string;
    score_breakdown?: GenioScoreBreakdown;
    best_similarity?: number;
    best_section_type?: string | null;
    matched_sections?: string[];
    titolo_breve?: string | null;
    titolo?: string | null;
    ente_nome?: string | null;
    regione?: string | null;
    data_scadenza?: string | null;
    deadline_days?: number | null;
    num_posti?: number | null;
    figura_ricercata?: string | null;
    procedure_category?: string | null;
    tipo_procedura?: string | null;
    required_profile?: string | null;
    required_sector?: string | null;
    requires_public_employee?: boolean;
    requires_permanent_contract?: boolean;
    reasons?: string[];
    risks?: string[];
    must_verify?: string[];
    candidate_fit_summary?: string | null;
    ai_explanation?: GenioAiExplanation;
    ux_highlights?: {
        the_hook?: string[];
        critical_alert?: string[];
        [key: string]: unknown;
    };
    annuncio_enrichment?: Record<string, unknown>;
    link_reindirizzamento?: string | null;
    link_sito_pa?: string | null;
    preview?: string | null;
    user_profile_used?: NormalizedGenioProfile;
}

export interface GenioMatchResponse {
    query?: string;
    result_count: number;
    results: GenioMatchResult[];
}
