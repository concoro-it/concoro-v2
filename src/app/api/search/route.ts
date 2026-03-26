import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { openai } from '@/lib/openai/client';

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();
        if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

        const supabase = await createClient();
        const tier = await getUserTier(supabase);
        const limitMap: Record<string, number> = { anon: 5, free: 10, pro: 20, admin: 20 };
        const limit = limitMap[tier] ?? 5;

        // If OpenAI is not configured, fall back to text search
        if (!openai) {
            const { data } = await supabase
                .from('concorsi')
                .select('concorso_id, status, slug, titolo, titolo_breve, ente_nome, ente_slug, regioni_array, province_array, settori, data_scadenza, num_posti, favicon_url, categorie, link_allegati, "allegatoCount", is_active, created_at, data_pubblicazione')
                .eq('is_active', true)
                .ilike('titolo', `%${query}%`)
                .limit(limit);
            return NextResponse.json({ results: data ?? [], tier, fallback: true });
        }

        // Generate embedding
        const embeddingRes = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: query,
        });
        const embedding = embeddingRes.data[0].embedding;

        // Vector search via RPC
        const { data, error } = await supabase.rpc('match_concorsi', {
            query_embedding: embedding,
            match_count: limit,
            filter_active: true,
        });

        if (error) {
            // Fall back to text search
            const { data: fallbackData } = await supabase
                .from('concorsi')
                .select('concorso_id, status, slug, titolo, titolo_breve, ente_nome, ente_slug, regioni_array, province_array, settori, data_scadenza, num_posti, favicon_url, categorie, link_allegati, "allegatoCount", is_active, created_at, data_pubblicazione')
                .eq('is_active', true)
                .ilike('titolo', `%${query}%`)
                .limit(limit);
            return NextResponse.json({ results: fallbackData ?? [], tier, fallback: true });
        }

        return NextResponse.json({ results: data ?? [], tier });
    } catch (err) {
        console.error('[search]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
