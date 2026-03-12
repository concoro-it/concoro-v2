import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';

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
