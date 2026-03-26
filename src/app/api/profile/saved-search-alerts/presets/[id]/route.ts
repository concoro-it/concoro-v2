import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { getConcorsi } from '@/lib/supabase/queries';
import {
    FREE_FEED_PREVIEW_LIMIT,
    isProTier,
    mapSavedSearchToConcorsoFilters,
    normalizeSavedSearchFilters,
} from '@/lib/saved-search-alerts';
import type { SavedSearch } from '@/types/profile';
import type { Concorso } from '@/types/concorso';

type RouteContext = {
    params: Promise<{ id: string }>;
};

function toPositiveInt(value: string | null, fallback: number): number {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) return fallback;
    return parsed;
}

export async function GET(req: NextRequest, context: RouteContext) {
    const { id } = await context.params;

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: preset, error: presetError } = await supabase
        .from('saved_searches')
        .select('id, user_id, name, filters, created_at')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

    if (presetError) {
        return NextResponse.json({ error: presetError.message }, { status: 500 });
    }

    if (!preset) {
        return NextResponse.json({ error: 'Preset non trovato.' }, { status: 404 });
    }

    const tier = await getUserTier(supabase);
    const pro = isProTier(tier);

    const { data: subscription } = await supabase
        .from('saved_search_alert_subscriptions')
        .select('enabled')
        .eq('user_id', user.id)
        .eq('saved_search_id', id)
        .maybeSingle();

    const { searchParams } = new URL(req.url);
    const requestedPage = toPositiveInt(searchParams.get('page'), 1);
    const requestedPerPage = toPositiveInt(searchParams.get('per_page'), 20);

    const page = pro ? requestedPage : 1;
    const perPage = pro ? Math.min(requestedPerPage, 30) : FREE_FEED_PREVIEW_LIMIT;

    const normalizedFilters = normalizeSavedSearchFilters(preset.filters);
    const baseFilters = mapSavedSearchToConcorsoFilters({
        id: preset.id,
        user_id: user.id,
        name: preset.name,
        filters: normalizedFilters,
        created_at: preset.created_at,
    } as SavedSearch);

    const currentResults = await getConcorsi(supabase, baseFilters, page, perPage);
    const total = currentResults.count;
    const pageItems = (currentResults.data ?? []).filter((item) => Boolean(item.concorso_id));
    const concorsoIds = pageItems.map((item) => item.concorso_id);

    const { count: seenCount, error: seenCountError } = await supabase
        .from('saved_search_alert_matches')
        .select('concorso_id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('saved_search_id', id);
    if (seenCountError) {
        console.error('[saved-search-alerts][preset-detail] seen count query failed', {
            userId: user.id,
            presetId: id,
            error: seenCountError,
        });
    }

    const hasSeenHistory = !seenCountError && (seenCount ?? 0) > 0;

    let seenIdSet = new Set<string>();
    if (hasSeenHistory && concorsoIds.length > 0) {
        const { data: seenRows, error: seenRowsError } = await supabase
            .from('saved_search_alert_matches')
            .select('concorso_id')
            .eq('user_id', user.id)
            .eq('saved_search_id', id)
            .in('concorso_id', concorsoIds);

        if (seenRowsError) {
            console.error('[saved-search-alerts][preset-detail] seen rows query failed', {
                userId: user.id,
                presetId: id,
                error: seenRowsError,
            });
        } else {
            seenIdSet = new Set(
                (seenRows ?? [])
                    .map((row) => row.concorso_id as string | null)
                    .filter((value): value is string => Boolean(value))
            );
        }
    }

    const items = pageItems.map((item) => ({
        saved_search_id: preset.id,
        concorso_id: item.concorso_id,
        bucket: (hasSeenHistory && !seenIdSet.has(item.concorso_id)) ? 'new' as const : 'existing' as const,
        concorso: item as Concorso,
    }));

    const visibleItems = pro ? items : items.slice(0, FREE_FEED_PREVIEW_LIMIT);
    const newCount = visibleItems.filter((item) => item.bucket === 'new').length;
    const existingCount = visibleItems.filter((item) => item.bucket === 'existing').length;

    if (concorsoIds.length > 0) {
        const nowIso = new Date().toISOString();
        const seenRowsToUpsert = concorsoIds.map((concorsoId) => ({
            user_id: user.id,
            saved_search_id: id,
            concorso_id: concorsoId,
            first_seen_at: nowIso,
            updated_at: nowIso,
        }));

        const { error: upsertSeenError } = await supabase
            .from('saved_search_alert_matches')
            .upsert(seenRowsToUpsert, { onConflict: 'user_id,saved_search_id,concorso_id' });

        if (upsertSeenError) {
            console.error('[saved-search-alerts][preset-detail] seen upsert failed', {
                userId: user.id,
                presetId: id,
                error: upsertSeenError,
            });
        }
    }

    return NextResponse.json({
        is_pro: pro,
        preset: {
            id: preset.id,
            name: preset.name,
            filters: normalizedFilters,
            created_at: preset.created_at,
            enabled: subscription?.enabled ?? true,
            match_count: total,
            last_match_at: visibleItems[0]?.concorso?.data_pubblicazione ?? null,
        },
        segments: {
            cutoff_at: preset.created_at,
            new_count: newCount,
            existing_count: existingCount,
        },
        current: {
            page,
            per_page: perPage,
            total,
            has_more: pro ? page * perPage < total : false,
            locked_count: pro ? 0 : Math.max(total - FREE_FEED_PREVIEW_LIMIT, 0),
            items: visibleItems,
        },
    });
}
