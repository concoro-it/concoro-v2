import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserTier } from '@/types/profile';

/**
 * @deprecated Prefer getUserContext() to avoid duplicate auth/profile queries.
 */
export async function getUserTier(supabase: SupabaseClient, userId?: string | null): Promise<UserTier> {
    let resolvedUserId = userId ?? null;
    if (!resolvedUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 'anon';
        resolvedUserId = user.id;
    }
    const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', resolvedUserId)
        .single();
    return ((profile?.tier as UserTier) ?? 'free');
}
