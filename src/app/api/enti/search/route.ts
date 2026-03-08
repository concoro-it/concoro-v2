import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_LIMIT = 20;

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('query') ?? '').trim();
    const offset = Math.max(Number.parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0);
    const requestedLimit = Number.parseInt(searchParams.get('limit') ?? '10', 10) || 10;
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

    let q = supabase
        .from('enti')
        .select('ente_nome, ente_slug')
        .not('ente_slug', 'is', null)
        .order('ente_nome', { ascending: true });

    if (query.length >= 2) {
        q = q.ilike('ente_nome', `%${query}%`);
    }

    const { data, error } = await q.range(offset, offset + limit);
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []).filter((item) => item.ente_slug && item.ente_nome);
    const hasMore = rows.length > limit;
    const visibleRows = hasMore ? rows.slice(0, limit) : rows;
    return NextResponse.json({
        data: visibleRows.map((item) => ({ label: item.ente_nome as string, value: item.ente_slug as string })),
        hasMore,
        nextOffset: offset + visibleRows.length,
    });
}
