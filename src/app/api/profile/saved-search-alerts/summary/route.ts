import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { FREE_FEED_PREVIEW_LIMIT, isProTier } from '@/lib/saved-search-alerts';

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier(supabase);
    const pro = isProTier(tier);

    const [{ count: unreadCount, error: unreadError }, { count: totalCount, error: totalError }] = await Promise.all([
        supabase
            .from('saved_search_alert_matches')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .is('last_notified_at', null),
        supabase
            .from('saved_search_alert_matches')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
    ]);

    if (unreadError || totalError) {
        return NextResponse.json({ error: unreadError?.message ?? totalError?.message ?? 'Summary error' }, { status: 500 });
    }

    const unread = unreadCount ?? 0;

    return NextResponse.json({
        is_pro: pro,
        unread_count: pro ? unread : Math.min(unread, FREE_FEED_PREVIEW_LIMIT),
        total_count: totalCount ?? 0,
        free_preview_limit: FREE_FEED_PREVIEW_LIMIT,
    });
}
