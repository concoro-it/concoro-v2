import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { getConcorsi } from '@/lib/supabase/queries';
import { isProTier, mapSavedSearchToConcorsoFilters, normalizeSavedSearchFilters } from '@/lib/saved-search-alerts';
import type { SavedSearch } from '@/types/profile';

type SavedSearchRow = {
    id: string;
    name: string;
    filters: Record<string, unknown> | null;
    created_at: string;
};

type SubscriptionUpdate = {
    saved_search_id: string;
    enabled: boolean;
};

async function loadState(userId: string) {
    const supabase = await createClient();
    const tier = await getUserTier(supabase);

    const [{ data: searches, error: searchError }, { data: preference, error: prefError }] = await Promise.all([
        supabase
            .from('saved_searches')
            .select('id, name, filters, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        supabase
            .from('saved_search_alert_preferences')
            .select('enabled')
            .eq('user_id', userId)
            .maybeSingle(),
    ]);

    if (searchError) {
        return { error: searchError.message };
    }

    if (prefError) {
        return { error: prefError.message };
    }

    const savedSearches = (searches ?? []) as SavedSearchRow[];
    const searchIds = savedSearches.map((search) => search.id);

    const { data: subscriptions, error: subscriptionError } = searchIds.length
        ? await supabase
              .from('saved_search_alert_subscriptions')
              .select('saved_search_id, enabled')
              .eq('user_id', userId)
              .in('saved_search_id', searchIds)
        : { data: [], error: null };

    if (subscriptionError) {
        return { error: subscriptionError.message };
    }

    const { data: matches, error: matchesError } = searchIds.length
        ? await supabase
            .from('saved_search_alert_matches')
            .select('saved_search_id, first_seen_at')
            .eq('user_id', userId)
            .in('saved_search_id', searchIds)
        : { data: [], error: null };

    if (matchesError) {
        return { error: matchesError.message };
    }

    const enabledBySearch = new Map<string, boolean>();
    for (const row of subscriptions ?? []) {
        enabledBySearch.set(row.saved_search_id as string, Boolean(row.enabled));
    }

    const matchCountBySearch = new Map<string, number>();
    const lastSeenBySearch = new Map<string, string>();
    for (const row of matches ?? []) {
        const key = row.saved_search_id as string;
        matchCountBySearch.set(key, (matchCountBySearch.get(key) ?? 0) + 1);
        const existing = lastSeenBySearch.get(key);
        const current = row.first_seen_at as string;
        if (!existing || new Date(current).getTime() > new Date(existing).getTime()) {
            lastSeenBySearch.set(key, current);
        }
    }

    const currentStatsBySearch = new Map<string, { total: number; lastResultAt: string | null }>();
    await Promise.all(
        savedSearches.map(async (search) => {
            try {
                const filters = mapSavedSearchToConcorsoFilters({
                    id: search.id,
                    user_id: userId,
                    name: search.name,
                    filters: search.filters,
                    created_at: search.created_at,
                } as SavedSearch);
                const result = await getConcorsi(supabase, filters, 1, 1);
                currentStatsBySearch.set(search.id, {
                    total: result.count ?? 0,
                    lastResultAt: result.data?.[0]?.data_pubblicazione ?? null,
                });
            } catch (error) {
                console.error('[saved-search-alerts] failed to load current preset stats', {
                    userId,
                    savedSearchId: search.id,
                    error,
                });
                currentStatsBySearch.set(search.id, { total: 0, lastResultAt: null });
            }
        })
    );

    return {
        tier,
        is_pro: isProTier(tier),
        enabled: preference?.enabled ?? true,
        subscriptions: savedSearches.map((search) => ({
            saved_search_id: search.id,
            name: search.name,
            filters: normalizeSavedSearchFilters(search.filters),
            created_at: search.created_at,
            enabled: enabledBySearch.get(search.id) ?? true,
            match_count: matchCountBySearch.get(search.id) ?? 0,
            current_total_count: currentStatsBySearch.get(search.id)?.total ?? 0,
            last_match_at: currentStatsBySearch.get(search.id)?.lastResultAt ?? lastSeenBySearch.get(search.id) ?? null,
        })),
    };
}

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const state = await loadState(user.id);
    if ('error' in state) {
        return NextResponse.json({ error: state.error }, { status: 500 });
    }

    return NextResponse.json(state);
}

export async function PUT(req: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier(supabase);
    if (!isProTier(tier)) {
        return NextResponse.json(
            { error: 'Saved search alerts sono disponibili solo per utenti Pro.' },
            { status: 403 }
        );
    }

    const body = (await req.json().catch(() => null)) as
        | {
              enabled?: unknown;
              subscriptions?: unknown;
          }
        | null;

    if (!body || (typeof body.enabled !== 'boolean' && !Array.isArray(body.subscriptions))) {
        return NextResponse.json(
            { error: 'Body non valido. Usa enabled (boolean) e/o subscriptions ([]).' },
            { status: 400 }
        );
    }

    if (typeof body.enabled === 'boolean') {
        const { error } = await supabase
            .from('saved_search_alert_preferences')
            .upsert(
                {
                    user_id: user.id,
                    enabled: body.enabled,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
            );

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    if (Array.isArray(body.subscriptions)) {
        const normalized = (body.subscriptions as SubscriptionUpdate[]).filter((item): item is SubscriptionUpdate => {
            return (
                Boolean(item) &&
                typeof item.saved_search_id === 'string' &&
                item.saved_search_id.length > 0 &&
                typeof item.enabled === 'boolean'
            );
        });

        if (normalized.length > 0) {
            const uniqueIds = Array.from(new Set(normalized.map((item) => item.saved_search_id)));

            const { data: ownSearches, error: ownSearchError } = await supabase
                .from('saved_searches')
                .select('id')
                .eq('user_id', user.id)
                .in('id', uniqueIds);

            if (ownSearchError) {
                return NextResponse.json({ error: ownSearchError.message }, { status: 500 });
            }

            const ownIds = new Set((ownSearches ?? []).map((row) => row.id as string));
            if (ownIds.size !== uniqueIds.length) {
                return NextResponse.json(
                    { error: "Uno o piu saved_search_id non appartengono all'utente." },
                    { status: 400 }
                );
            }

            const nowIso = new Date().toISOString();
            const rows = normalized.map((item) => ({
                user_id: user.id,
                saved_search_id: item.saved_search_id,
                enabled: item.enabled,
                updated_at: nowIso,
            }));

            const { error: subError } = await supabase
                .from('saved_search_alert_subscriptions')
                .upsert(rows, { onConflict: 'user_id,saved_search_id' });

            if (subError) {
                return NextResponse.json({ error: subError.message }, { status: 500 });
            }
        }
    }

    const state = await loadState(user.id);
    if ('error' in state) {
        return NextResponse.json({ error: state.error }, { status: 500 });
    }

    return NextResponse.json({ saved: true, ...state });
}
