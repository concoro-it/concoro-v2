import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { concorso_id } = await req.json();
    if (!concorso_id) return NextResponse.json({ error: 'concorso_id required' }, { status: 400 });

    const tier = await getUserTier(supabase);
    if (tier === 'free') {
        const { count } = await supabase
            .from('saved_concorsi')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if ((count ?? 0) >= 1) {
            return NextResponse.json(
                { error: 'Il piano Free consente di salvare solo 1 concorso. Passa a Pro per salvaggi illimitati.' },
                { status: 403 }
            );
        }
    }

    const { error } = await supabase.from('saved_concorsi').insert({
        user_id: user.id,
        concorso_id,
    });

    if (error?.code === '23505') {
        return NextResponse.json({ saved: true, message: 'Already saved' });
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ saved: true });
}

export async function DELETE(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { concorso_id } = await req.json();
    const { error } = await supabase
        .from('saved_concorsi')
        .delete()
        .eq('user_id', user.id)
        .eq('concorso_id', concorso_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ saved: false });
}
