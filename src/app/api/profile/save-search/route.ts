import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { getConcorsi } from '@/lib/supabase/queries';
import { mapSavedSearchToConcorsoFilters } from '@/lib/saved-search-alerts';
import type { SavedSearch } from '@/types/profile';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    // Saved searches are a Pro-only feature
    const tier = await getUserTier(supabase);
    if (tier !== 'pro' && tier !== 'admin') {
        return NextResponse.json(
            { error: 'Le ricerche salvate sono disponibili solo per gli utenti Pro.' },
            { status: 403 }
        );
    }

    const { query, filters, name } = await req.json();
    if (!query && !filters) {
        return NextResponse.json({ error: 'query o filters richiesti' }, { status: 400 });
    }

    const normalizedFilters = {
        ...(filters && typeof filters === 'object' ? filters : {}),
        ...(query ? { query } : {}),
    };

    const { data, error } = await supabase.from('saved_searches').insert({
        user_id: user.id,
        filters: Object.keys(normalizedFilters).length > 0 ? normalizedFilters : null,
        name: name ?? query ?? 'Ricerca salvata',
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Best-effort: wire the new preset into Alert Center immediately.
    // If this fails we keep preset save successful and the cron will still process later.
    try {
        const savedSearch = data as SavedSearch;

        await supabase
            .from('saved_search_alert_subscriptions')
            .upsert(
                {
                    user_id: user.id,
                    saved_search_id: savedSearch.id,
                    enabled: true,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,saved_search_id' }
            );

        const filtersForQuery = mapSavedSearchToConcorsoFilters(savedSearch);
        const result = await getConcorsi(supabase, filtersForQuery, 1, 10);
        const nowIso = new Date().toISOString();

        const seedRows = (result.data ?? [])
            .filter((item) => Boolean(item.concorso_id))
            .map((item) => ({
                user_id: user.id,
                saved_search_id: savedSearch.id,
                concorso_id: item.concorso_id,
                first_seen_at: nowIso,
                updated_at: nowIso,
            }));

        if (seedRows.length > 0) {
            await supabase
                .from('saved_search_alert_matches')
                .upsert(seedRows, { onConflict: 'user_id,saved_search_id,concorso_id' });
        }
    } catch (seedError) {
        console.error('[save-search] alert seed failed', seedError);
    }

    return NextResponse.json({ saved: true, search: data });
}

export async function DELETE(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { search_id } = await req.json();
    if (!search_id) return NextResponse.json({ error: 'search_id richiesto' }, { status: 400 });

    const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', search_id)
        .eq('user_id', user.id); // RLS-safe: user can only delete their own

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
}
