import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Profile, UserTier } from '@/types/profile';

interface GetUserContextOptions {
    profileSelect?: string;
}

interface GetUserContextResult<TProfile> {
    user: User | null;
    profile: TProfile | null;
    tier: UserTier;
}

export async function getUserContext<TProfile = Profile>(
    supabase: SupabaseClient,
    options: GetUserContextOptions = {}
): Promise<GetUserContextResult<TProfile>> {
    const profileSelect = options.profileSelect ?? '*';
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { user: null, profile: null, tier: 'anon' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select(profileSelect)
        .eq('id', user.id)
        .single();

    const resolvedProfile = (profile as TProfile | null) ?? null;
    const resolvedTier = ((profile as { tier?: UserTier } | null)?.tier ?? 'free') as UserTier;

    return {
        user,
        profile: resolvedProfile,
        tier: resolvedTier,
    };
}
