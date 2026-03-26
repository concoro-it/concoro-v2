import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import {
    FREE_FEED_PREVIEW_LIMIT,
    getSavedSearchAlertFeed,
    isProTier,
} from '@/lib/saved-search-alerts';

function toPositiveInt(value: string | null, fallback: number): number {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) return fallback;
    return parsed;
}

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier(supabase);
    const pro = isProTier(tier);

    const { searchParams } = new URL(req.url);
    const requestedPage = toPositiveInt(searchParams.get('page'), 1);
    const requestedPerPage = toPositiveInt(searchParams.get('per_page'), 20);
    const presetId = searchParams.get('preset_id');

    const page = pro ? requestedPage : 1;
    const perPage = pro ? Math.min(requestedPerPage, 50) : FREE_FEED_PREVIEW_LIMIT;

    if (presetId) {
        const { data: ownPreset, error: ownPresetError } = await supabase
            .from('saved_searches')
            .select('id')
            .eq('id', presetId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (ownPresetError) {
            return NextResponse.json({ error: ownPresetError.message }, { status: 500 });
        }

        if (!ownPreset) {
            return NextResponse.json({ error: 'Preset non trovato.' }, { status: 404 });
        }
    }

    const { items, total } = await getSavedSearchAlertFeed(supabase, user.id, page, perPage, {
        presetId: presetId ?? undefined,
    });
    const visibleItems = pro ? items : items.slice(0, FREE_FEED_PREVIEW_LIMIT);
    const hasMore = pro ? page * perPage < total : false;

    return NextResponse.json({
        is_pro: pro,
        page,
        per_page: perPage,
        total,
        has_more: hasMore,
        locked_count: pro ? 0 : Math.max(total - FREE_FEED_PREVIEW_LIMIT, 0),
        preset_id: presetId,
        items: visibleItems,
    });
}
