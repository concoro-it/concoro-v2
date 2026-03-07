import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserTier } from '@/types/profile';

export async function getUserTier(supabase: SupabaseClient): Promise<UserTier> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'anon';
    const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single();
    return ((profile?.tier as UserTier) ?? 'free');
}
