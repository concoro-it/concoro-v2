import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConcorsoFilters } from '@/types/concorso';
import type { SavedSearch, UserTier } from '@/types/profile';

export const FREE_FEED_PREVIEW_LIMIT = 5;
export const FREE_EMAIL_VISIBLE_LIMIT = 1;
export const PRO_EMAIL_VISIBLE_LIMIT = 3;

export function isProTier(tier: UserTier): boolean {
    return tier === 'pro' || tier === 'admin';
}

export function buildSearchHrefFromFilters(filters: SavedSearch['filters'] | null | undefined): string {
    const safeFilters = filters ?? {};
    const params = new URLSearchParams();

    if (safeFilters.query) params.set('q', safeFilters.query);
    if (safeFilters.regioni?.length) params.set('regione', safeFilters.regioni[0]);
    if (safeFilters.province?.length) params.set('provincia', safeFilters.province[0]);
    if (safeFilters.settori?.length) params.set('settore', safeFilters.settori[0]);
    if (safeFilters.tipo_procedura) params.set('tipo_procedura', safeFilters.tipo_procedura);
    if (safeFilters.ente_slug) params.set('ente_slug', safeFilters.ente_slug);
    if (safeFilters.stato) params.set('stato', safeFilters.stato);
    if (safeFilters.sort) params.set('sort', safeFilters.sort);
    if (safeFilters.published_from) params.set('published_from', safeFilters.published_from);
    if (safeFilters.date_from) params.set('date_from', safeFilters.date_from);
    if (safeFilters.date_to) params.set('date_to', safeFilters.date_to);

    const query = params.toString();
    return `/hub/concorsi${query ? `?${query}` : ''}`;
}

export type NormalizedSavedSearchFilters = {
    query: string | null;
    regioni: string[];
    province: string[];
    settori: string[];
    tipo_procedura: string | null;
    ente_slug: string | null;
    stato: 'aperti' | 'scaduti' | null;
    sort: 'scadenza' | 'recenti' | 'posti' | null;
    published_from: string | null;
    date_from: string | null;
    date_to: string | null;
};

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export function normalizeSavedSearchFilters(input: unknown): NormalizedSavedSearchFilters {
    const value = (input && typeof input === 'object') ? (input as Record<string, unknown>) : {};
    const query = typeof value.query === 'string' && value.query.trim().length > 0 ? value.query : null;
    const tipoProcedura = typeof value.tipo_procedura === 'string' && value.tipo_procedura.trim().length > 0
        ? value.tipo_procedura
        : null;
    const enteSlug = typeof value.ente_slug === 'string' && value.ente_slug.trim().length > 0 ? value.ente_slug : null;
    const stato = value.stato === 'aperti' || value.stato === 'scaduti' ? value.stato : null;
    const sort = value.sort === 'scadenza' || value.sort === 'recenti' || value.sort === 'posti' ? value.sort : null;
    const publishedFrom = typeof value.published_from === 'string' && value.published_from.trim().length > 0
        ? value.published_from
        : null;
    const dateFrom = typeof value.date_from === 'string' && value.date_from.trim().length > 0 ? value.date_from : null;
    const dateTo = typeof value.date_to === 'string' && value.date_to.trim().length > 0 ? value.date_to : null;

    return {
        query,
        regioni: asStringArray(value.regioni),
        province: asStringArray(value.province),
        settori: asStringArray(value.settori),
        tipo_procedura: tipoProcedura,
        ente_slug: enteSlug,
        stato,
        sort,
        published_from: publishedFrom,
        date_from: dateFrom,
        date_to: dateTo,
    };
}

export function mapSavedSearchToConcorsoFilters(search: SavedSearch): ConcorsoFilters {
    const filters = normalizeSavedSearchFilters(search.filters);

    return {
        query: filters.query,
        regione: filters.regioni[0],
        provincia: filters.province[0],
        settore: filters.settori[0],
        tipo_procedura: filters.tipo_procedura,
        ente_slug: filters.ente_slug,
        stato: filters.stato ?? 'aperti',
        sort: filters.sort ?? 'recenti',
        published_from: filters.published_from,
        date_from: filters.date_from,
        date_to: filters.date_to,
    };
}

export type SavedSearchAlertMatchItem = {
    saved_search_id: string;
    concorso_id: string;
    first_seen_at: string;
    last_notified_at: string | null;
    saved_search_name: string | null;
    concorso: {
        concorso_id: string;
        slug: string | null;
        titolo: string | null;
        ente_nome: string | null;
        data_pubblicazione: string | null;
        data_scadenza: string | null;
        created_at: string | null;
    } | null;
};

export async function getSavedSearchAlertFeed(
    supabase: SupabaseClient,
    userId: string,
    page: number,
    perPage: number,
    options?: { presetId?: string }
): Promise<{ items: SavedSearchAlertMatchItem[]; total: number }> {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePerPage = Number.isFinite(perPage) && perPage > 0 ? Math.min(Math.floor(perPage), 100) : 20;
    const start = (safePage - 1) * safePerPage;
    const end = start + safePerPage - 1;

    let query = supabase
        .from('saved_search_alert_matches')
        .select(
            `
            saved_search_id,
            concorso_id,
            first_seen_at,
            last_notified_at,
            saved_searches(name),
            concorsi(
                concorso_id,
                slug,
                titolo,
                ente_nome,
                data_pubblicazione,
                data_scadenza,
                created_at
            )
        `,
            { count: 'exact' }
        )
        .eq('user_id', userId);

    if (options?.presetId) {
        query = query.eq('saved_search_id', options.presetId);
    }

    const { data, error, count } = await query
        .order('first_seen_at', { ascending: false })
        .range(start, end);

    if (error) {
        console.error('[saved-search-alerts] feed query error', error);
        return { items: [], total: 0 };
    }

    const items: SavedSearchAlertMatchItem[] = ((data ?? []) as Array<{
        saved_search_id: string;
        concorso_id: string;
        first_seen_at: string;
        last_notified_at: string | null;
        saved_searches: { name: string | null } | { name: string | null }[] | null;
        concorsi:
        | {
            concorso_id: string;
            slug: string | null;
            titolo: string | null;
            ente_nome: string | null;
            data_pubblicazione: string | null;
            data_scadenza: string | null;
            created_at: string | null;
        }
        | {
            concorso_id: string;
            slug: string | null;
            titolo: string | null;
            ente_nome: string | null;
            data_pubblicazione: string | null;
            data_scadenza: string | null;
            created_at: string | null;
        }[]
        | null;
    }>).map((row) => ({
        saved_search_id: row.saved_search_id,
        concorso_id: row.concorso_id,
        first_seen_at: row.first_seen_at,
        last_notified_at: row.last_notified_at,
        saved_search_name: Array.isArray(row.saved_searches)
            ? (row.saved_searches[0]?.name ?? null)
            : (row.saved_searches?.name ?? null),
        concorso: Array.isArray(row.concorsi) ? (row.concorsi[0] ?? null) : row.concorsi,
    }));

    return { items, total: count ?? 0 };
}
