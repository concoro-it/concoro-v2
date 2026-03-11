import type { SupabaseClient } from '@supabase/supabase-js';
import type { Concorso, ConcorsoFilters } from '@/types/concorso';
import type { Ente } from '@/types/ente';
import type { Profile } from '@/types/profile';
import type { Articolo } from '@/types/articolo';
import { toUrlSlug } from '@/lib/utils/regioni';

const CONCORSI_COLS = `
  concorso_id, status, status_label, slug, titolo, titolo_breve,
  num_posti, tipo_procedura, is_remote, data_pubblicazione, data_scadenza,
  ente_nome, ente_slug, favicon_url, regioni_array, province_array, sedi,
  categorie, settori, link_sito_pa, link_reindirizzamento, link_allegati,
  "allegatoCount", "allegatoMediaIds", is_active, created_at
`;

const CONCORSO_DETAIL_COLS = `
  concorso_id, status, status_label, slug, titolo, titolo_breve, descrizione, riassunto,
  figura_ricercata, num_posti, tipo_procedura, is_remote, salary_min, salary_max,
  data_pubblicazione, data_scadenza, data_visibilita,
  ente_nome, ente_id, ente_slug, favicon_url, latitudine, longitudine,
  sedi, regioni_array, province_array, categorie, settori, allegati,
  link_sito_pa, link_reindirizzamento, link_allegati, "allegatoCount", "allegatoMediaIds",
  tipologia_mobilita, settore_professionale, regime_impegno, contatti,
  requisiti_generali, programma_di_esame, ambito_lavorativo,
  capacita_richieste, collocazione_organizzativa, conoscenze_tecnico_specialistiche,
  annuncio_enrichment, ux_highlights,
  is_active, created_at, updated_at
`;

export async function getConcorsi(
    supabase: SupabaseClient,
    filters: ConcorsoFilters = {},
    page = 1,
    limit = 20
): Promise<{ data: Concorso[]; count: number }> {
    let query = supabase.from('concorsi_view').select(CONCORSI_COLS, { count: 'exact' });
    const now = new Date().toISOString();

    // Handle 'stato' (aperti, scaduti, tutti)
    // Default to 'aperti' if not specified, unless explicit filters contradict it
    const stato = filters.stato || 'aperti';

    if (stato === 'aperti') {
        query = query.gte('data_scadenza', now);
        if (filters.solo_attivi !== false) {
            query = query.eq('is_active', true);
        }
    } else if (stato === 'scaduti') {
        query = query.lt('data_scadenza', now);
    }
    // if stato === 'tutti', we don't apply date or is_active filters unless specifically asked

    if (filters.regione) {
        query = query.contains('regioni_names', [filters.regione]);
    }
    if (filters.provincia) {
        query = query.contains('province_names', [filters.provincia]);
    }
    if (filters.settore) {
        query = query.contains('settori', [filters.settore]);
    }
    if (filters.ente_slug) {
        query = query.eq('ente_slug', filters.ente_slug);
    }
    if (filters.tipo_procedura) {
        query = query.eq('tipo_procedura', filters.tipo_procedura);
    }
    if (filters.date_from) {
        query = query.gte('data_scadenza', filters.date_from);
    }
    if (filters.date_to) {
        query = query.lte('data_scadenza', filters.date_to);
    }
    if (filters.published_from) {
        query = query.gte('data_pubblicazione', filters.published_from);
    }
    if (filters.published_to) {
        query = query.lte('data_pubblicazione', filters.published_to);
    }

    // Sort
    switch (filters.sort) {
        case 'recenti':
            query = query.order('data_pubblicazione', { ascending: false });
            break;
        case 'posti':
            query = query.order('num_posti', { ascending: false, nullsFirst: false });
            break;
        default: // scadenza
            // If showing expired, the most recently expired should be first (DESC)
            // If showing active, the closest deadline should be first (ASC)
            query = query.order('data_scadenza', {
                ascending: stato !== 'scaduti',
                nullsFirst: false
            });
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    return { data: (data as Concorso[]) ?? [], count: count ?? 0 };
}

export async function getConcorsoBySlug(
    supabase: SupabaseClient,
    slug: string
): Promise<Concorso | null> {
    const { data, error } = await supabase
        .from('concorsi')
        .select(CONCORSO_DETAIL_COLS)
        .eq('slug', slug)
        .single();
    if (error) return null;
    return data as Concorso;
}

export async function getConcorsiByRegione(
    supabase: SupabaseClient,
    regione: string,
    limit = 50
): Promise<Concorso[]> {
    const { data, error } = await supabase
        .rpc('get_concorsi_by_regione', {
            regione_name: regione,
            lim: limit
        });
    if (error) {
        console.error('Error in getConcorsiByRegione:', error);
        return [];
    }
    return (data as Concorso[]) ?? [];
}

export async function getConcorsiByProvincia(
    supabase: SupabaseClient,
    provincia: string,
    limit = 50
): Promise<Concorso[]> {
    const { data, error } = await supabase
        .rpc('get_concorsi_by_provincia', {
            provincia_name: provincia,
            lim: limit
        });
    if (error) {
        console.error('Error in getConcorsiByProvincia:', error);
        return [];
    }
    return (data as Concorso[]) ?? [];
}

export async function getConcorsiBySettore(
    supabase: SupabaseClient,
    settore: string,
    limit = 50
): Promise<Concorso[]> {
    const { data, error } = await supabase
        .from('concorsi')
        .select(CONCORSI_COLS)
        .contains('settori', [settore])
        .eq('is_active', true)
        .order('data_scadenza', { ascending: true, nullsFirst: false })
        .limit(limit);
    if (error) return [];
    return (data as Concorso[]) ?? [];
}

export async function getConcorsiByEnte(
    supabase: SupabaseClient,
    enteSlug: string,
    limit = 50
): Promise<Concorso[]> {
    const { data, error } = await supabase
        .from('concorsi')
        .select(CONCORSI_COLS)
        .eq('ente_slug', enteSlug)
        .eq('is_active', true)
        .order('data_scadenza', { ascending: true, nullsFirst: false })
        .limit(limit);
    if (error) return [];
    return (data as Concorso[]) ?? [];
}

export async function getScadenzaOggi(supabase: SupabaseClient, page = 1, limit = 20): Promise<{ data: Concorso[]; count: number }> {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    return getConcorsi(supabase, { date_from: start, date_to: end, sort: 'scadenza' }, page, limit);
}

export async function getScadenzaQuestaSettimana(supabase: SupabaseClient, page = 1, limit = 20): Promise<{ data: Concorso[]; count: number }> {
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return getConcorsi(supabase, { date_from: now.toISOString(), date_to: end, sort: 'scadenza' }, page, limit);
}

export async function getScadenzaQuestoMese(supabase: SupabaseClient, page = 1, limit = 20): Promise<{ data: Concorso[]; count: number }> {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    return getConcorsi(supabase, { date_from: now.toISOString(), date_to: endOfMonth, sort: 'scadenza' }, page, limit);
}

export async function getNuoviConcorsi(supabase: SupabaseClient, page = 1, limit = 20): Promise<{ data: Concorso[]; count: number }> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return getConcorsi(supabase, { published_from: sevenDaysAgo, sort: 'recenti' }, page, limit);
}

export async function getFeaturedConcorsi(supabase: SupabaseClient): Promise<Concorso[]> {
    const { data } = await supabase
        .from('concorsi')
        .select(CONCORSI_COLS)
        .eq('is_active', true)
        .order('data_pubblicazione', { ascending: false })
        .limit(6);
    return (data as Concorso[]) ?? [];
}

export async function getActiveConcorsiCount(supabase: SupabaseClient): Promise<number> {
    const now = new Date().toISOString();
    const { count, error } = await supabase
        .from('concorsi')
        .select('concorso_id', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('data_scadenza', now);

    if (error) {
        console.error('Error in getActiveConcorsiCount:', error);
        return 0;
    }

    return count ?? 0;
}

export async function getRegioniWithCount(supabase: SupabaseClient): Promise<Array<{ regione: string; count: number }>> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('concorsi')
        .select('regioni_array')
        .eq('is_active', true)
        .gte('data_scadenza', now);

    if (error || !data) {
        console.error('Error in getRegioniWithCount:', error);
        return [];
    }

    const counts: Record<string, number> = {};
    for (const row of data as Array<{ regioni_array: unknown }>) {
        const arr = row.regioni_array as unknown[];
        if (!Array.isArray(arr)) continue;

        for (const raw of arr) {
            try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                const name =
                    (parsed as any)?.regione?.denominazione ||
                    (parsed as any)?.denominazione ||
                    (parsed as any)?.nome;

                if (typeof name === 'string' && name.trim()) {
                    counts[name] = (counts[name] ?? 0) + 1;
                }
            } catch {
                // skip malformed region payload
            }
        }
    }

    return Object.entries(counts)
        .map(([regione, count]) => ({ regione, count }))
        .sort((a, b) => b.count - a.count);
}

export async function getProvinceWithCount(supabase: SupabaseClient): Promise<Array<{ provincia: string; sigla: string; regione: string | null; count: number }>> {
    const { data } = await supabase
        .from('concorsi')
        .select('province_array')
        .eq('is_active', true);
    if (!data) return [];

    const counts: Record<string, { provincia: string; sigla: string; regione: string | null; count: number }> = {};
    for (const row of data) {
        const arr = row.province_array as any[];
        if (!Array.isArray(arr)) continue;
        for (const s of arr) {
            try {
                const parsed = typeof s === 'string' ? JSON.parse(s) : s;
                const name = parsed?.provincia?.denominazione || parsed?.denominazione;
                const sigla = parsed?.provincia?.sigla || parsed?.provincia?.codice || parsed?.sigla || parsed?.codice;
                const regione = parsed?.regione?.denominazione || parsed?.regione || null;
                if (name && sigla) {
                    if (!counts[name]) counts[name] = { provincia: name, sigla, regione: typeof regione === 'string' ? regione : null, count: 0 };
                    if (!counts[name].regione && typeof regione === 'string') counts[name].regione = regione;
                    counts[name].count++;
                }
            } catch { /* skip */ }
        }
    }
    return Object.values(counts).sort((a, b) => b.count - a.count);
}

export async function getSettoriWithCount(supabase: SupabaseClient): Promise<Array<{ settore: string; count: number }>> {
    const { data, error } = await supabase.rpc('get_settori_with_count');
    if (error || !data) {
        console.error('Error in getSettoriWithCount:', error);
        return [];
    }

    return (data as Array<{ settore: string; count: number | string }>)
        .map((row) => ({
            settore: row.settore,
            count: typeof row.count === 'string' ? Number(row.count) : row.count,
        }))
        .filter((row) => row.settore && Number.isFinite(row.count));
}

export async function getEntiWithCount(supabase: SupabaseClient): Promise<Array<{ ente_nome: string; ente_slug: string; count: number }>> {
    const { data } = await supabase
        .from('concorsi')
        .select('ente_nome, ente_slug')
        .eq('is_active', true)
        .not('ente_slug', 'is', null);
    if (!data) return [];

    const counts: Record<string, { ente_nome: string; ente_slug: string; count: number }> = {};
    for (const row of data) {
        const key = row.ente_slug;
        if (!key) continue;
        if (!counts[key]) counts[key] = { ente_nome: row.ente_nome ?? '', ente_slug: key, count: 0 };
        counts[key].count++;
    }
    return Object.values(counts).sort((a, b) => b.count - a.count);
}

export async function getEnteByName(
    supabase: SupabaseClient,
    enteNome: string
): Promise<Ente | null> {
    const { data, error } = await supabase
        .from('enti')
        .select('*')
        .eq('ente_nome', enteNome)
        .maybeSingle();

    if (error) {
        console.error('Error in getEnteByName:', error);
        return null;
    }

    return (data as Ente | null) ?? null;
}

export async function getEnteBySlug(
    supabase: SupabaseClient,
    slug: string
): Promise<Ente | null> {
    const { data, error } = await supabase
        .from('enti')
        .select('*')
        .ilike('ente_slug', slug)
        .maybeSingle();

    if (error) {
        console.error('Error in getEnteBySlug:', error);
        return null;
    }

    return (data as Ente | null) ?? null;
}

export async function getAllEnti(
    supabase: SupabaseClient
): Promise<Ente[]> {
    const { data, error } = await supabase
        .from('enti')
        .select('*')
        .order('ente_nome', { ascending: true });

    if (error) {
        console.error('Error in getAllEnti:', error);
        return [];
    }

    return (data as Ente[]) ?? [];
}

export async function getConcorsiByEnteName(
    supabase: SupabaseClient,
    enteNome: string,
    limit = 50
): Promise<Concorso[]> {
    const { data, error } = await supabase
        .from('concorsi')
        .select(CONCORSI_COLS)
        .eq('ente_nome', enteNome)
        .eq('is_active', true)
        .order('data_scadenza', { ascending: true, nullsFirst: false })
        .limit(limit);

    if (error) {
        console.error('Error in getConcorsiByEnteName:', error);
        return [];
    }

    return (data as Concorso[]) ?? [];
}

export async function getRelatedConcorsi(
    supabase: SupabaseClient,
    concorsoId: string,
    options: {
        enteSlug?: string | null;
        enteNome?: string | null;
        province?: string[];
        settori?: string[];
        limit?: number;
    }
): Promise<Concorso[]> {
    const targetLimit = options.limit ?? 4;
    const candidateLimit = Math.max(6, targetLimit * 3);
    const province = (options.province ?? []).filter(Boolean);
    const settori = (options.settori ?? []).filter(Boolean);

    const picked = new Map<string, Concorso>();

    const shuffle = <T>(items: T[]): T[] => {
        const arr = [...items];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    const appendUnique = (rows: Concorso[] | null | undefined) => {
        if (!rows) return;
        for (const row of rows) {
            if (!row?.concorso_id) continue;
            if (row.concorso_id === concorsoId) continue;
            if (!picked.has(row.concorso_id)) {
                picked.set(row.concorso_id, row);
            }
            if (picked.size >= targetLimit) break;
        }
    };

    // 1) Same ente first (strongest intent signal)
    if (options.enteSlug) {
        const { data } = await supabase
            .from('concorsi')
            .select(CONCORSI_COLS)
            .eq('is_active', true)
            .neq('concorso_id', concorsoId)
            .eq('ente_slug', options.enteSlug)
            .order('data_scadenza', { ascending: true, nullsFirst: false })
            .limit(candidateLimit);
        appendUnique(shuffle((data as Concorso[]) ?? []));
    } else if (options.enteNome) {
        const { data } = await supabase
            .from('concorsi')
            .select(CONCORSI_COLS)
            .eq('is_active', true)
            .neq('concorso_id', concorsoId)
            .eq('ente_nome', options.enteNome)
            .order('data_scadenza', { ascending: true, nullsFirst: false })
            .limit(candidateLimit);
        appendUnique(shuffle((data as Concorso[]) ?? []));
    }

    // 2) Same city/province (local relevance)
    if (picked.size < targetLimit && province.length > 0) {
        const { data } = await supabase
            .from('concorsi_view')
            .select(CONCORSI_COLS)
            .eq('is_active', true)
            .neq('concorso_id', concorsoId)
            .overlaps('province_names', province)
            .order('data_scadenza', { ascending: true, nullsFirst: false })
            .limit(candidateLimit);
        appendUnique(shuffle((data as Concorso[]) ?? []));
    }

    // 3) Same sectors even across different cities
    if (picked.size < targetLimit && settori.length > 0) {
        const { data } = await supabase
            .from('concorsi')
            .select(CONCORSI_COLS)
            .eq('is_active', true)
            .neq('concorso_id', concorsoId)
            .overlaps('settori', settori)
            .order('data_scadenza', { ascending: true, nullsFirst: false })
            .limit(candidateLimit);
        appendUnique(shuffle((data as Concorso[]) ?? []));
    }

    // 4) Fallback: active random concorsi
    if (picked.size < targetLimit) {
        const needed = targetLimit - picked.size;
        const { count } = await supabase
            .from('concorsi')
            .select('concorso_id', { count: 'exact', head: true })
            .eq('is_active', true)
            .neq('concorso_id', concorsoId);

        const total = count ?? 0;
        const start = total > needed ? Math.floor(Math.random() * Math.max(1, total - needed)) : 0;
        const end = start + Math.max(needed * 3, needed + 2) - 1;

        const { data } = await supabase
            .from('concorsi')
            .select(CONCORSI_COLS)
            .eq('is_active', true)
            .neq('concorso_id', concorsoId)
            .order('data_pubblicazione', { ascending: false, nullsFirst: false })
            .range(start, end);

        appendUnique(shuffle((data as Concorso[]) ?? []));
    }

    return Array.from(picked.values()).slice(0, targetLimit);
}

export async function getUserProfile(
    supabase: SupabaseClient,
    userId: string
): Promise<Profile | null> {
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return data as Profile | null;
}

export async function getSavedConcorsiIds(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
    const { data } = await supabase
        .from('saved_concorsi')
        .select('concorso_id')
        .eq('user_id', userId);
    return (data ?? []).map((r: { concorso_id: string }) => r.concorso_id);
}

export async function getSavedConcorsi(
    supabase: SupabaseClient,
    userId: string
): Promise<Concorso[]> {
    const { data } = await supabase
        .from('saved_concorsi')
        .select(`concorso_id, concorsi(${CONCORSI_COLS})`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (!data) return [];
    return data.map((r: { concorsi: unknown }) => r.concorsi).filter(Boolean) as Concorso[];
}

export async function getLatestArticoli(supabase: SupabaseClient, limit = 3): Promise<Articolo[]> {
    const { data } = await supabase
        .from('articoli')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(limit);
    return (data as Articolo[]) ?? [];
}

export async function getAllConcorsiSlugs(supabase: SupabaseClient): Promise<string[]> {
    const { data } = await supabase
        .from('concorsi')
        .select('slug')
        .not('slug', 'is', null);
    return (data ?? []).map((r: { slug: string | null }) => r.slug).filter((s): s is string => Boolean(s));
}

export async function getAllRegioniSlugs(supabase: SupabaseClient): Promise<string[]> {
    const { data } = await supabase
        .from('concorsi')
        .select('regioni_array')
        .eq('is_active', true);

    if (!data) return [];

    const slugs = new Set<string>();
    for (const row of data) {
        const arr = row.regioni_array as string[];
        if (!Array.isArray(arr)) continue;
        for (const s of arr) {
            try {
                const parsed = typeof s === 'string' ? JSON.parse(s) : s;
                const name = parsed?.regione?.denominazione || parsed?.denominazione;
                if (name) {
                    slugs.add(toUrlSlug(name));
                }
            } catch { /* skip */ }
        }
    }
    return Array.from(slugs);
}

export async function getAllProvinceSlugs(supabase: SupabaseClient): Promise<string[]> {
    const { data } = await supabase
        .from('concorsi')
        .select('province_array')
        .eq('is_active', true);

    if (!data) return [];

    const slugs = new Set<string>();
    for (const row of data) {
        const arr = row.province_array as string[];
        if (!Array.isArray(arr)) continue;
        for (const s of arr) {
            try {
                const parsed = typeof s === 'string' ? JSON.parse(s) : s;
                const name = parsed?.provincia?.denominazione || parsed?.denominazione;
                if (name) {
                    slugs.add(toUrlSlug(name));
                }
            } catch { /* skip */ }
        }
    }
    return Array.from(slugs);
}

export async function getAllSettoriSlugs(supabase: SupabaseClient): Promise<string[]> {
    const { data } = await supabase
        .from('concorsi')
        .select('settori')
        .eq('is_active', true);

    if (!data) return [];

    const slugs = new Set<string>();
    for (const row of data) {
        const arr = row.settori as string[];
        if (!Array.isArray(arr)) continue;
        for (const s of arr) {
            if (s) {
                slugs.add(toUrlSlug(s));
            }
        }
    }
    return Array.from(slugs);
}

export async function getArticoloBySlug(
    supabase: SupabaseClient,
    slug: string
): Promise<Articolo | null> {
    const { data, error } = await supabase
        .from('articoli')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
    if (error) return null;
    return data as Articolo;
}

export async function getSavedSearches(
    supabase: SupabaseClient,
    userId: string
): Promise<import('@/types/profile').SavedSearch[]> {
    const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) return [];
    return data as import('@/types/profile').SavedSearch[];
}

export async function deleteSavedSearch(
    supabase: SupabaseClient,
    searchId: string
): Promise<boolean> {
    const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId);
    return !error;
}
