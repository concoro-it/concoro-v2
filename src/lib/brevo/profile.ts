import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '@/types/profile';
import type { BrevoContactAttributes } from '@/lib/brevo/contacts';

export type ProfileWithCounts = {
    profile: Pick<
        Profile,
        | 'id'
        | 'email'
        | 'tier'
        | 'notification_email'
        | 'regione_interesse'
        | 'provincia_interesse'
        | 'subscription_status'
        | 'subscription_period_end'
    >;
    savedConcorsiCount: number;
    savedSearchesCount: number;
};

export function toBrevoContactAttributes(input: ProfileWithCounts): BrevoContactAttributes {
    const { profile, savedConcorsiCount, savedSearchesCount } = input;

    return {
        USER_ID: profile.id,
        TIER: profile.tier,
        NOTIFICATION_EMAIL: Boolean(profile.notification_email),
        SAVED_CONCORSI_COUNT: savedConcorsiCount,
        SAVED_SEARCHES_COUNT: savedSearchesCount,
        REGIONE_INTERESSE: profile.regione_interesse,
        PROVINCIA_INTERESSE: profile.provincia_interesse,
        SUBSCRIPTION_STATUS: profile.subscription_status,
        SUBSCRIPTION_PERIOD_END: profile.subscription_period_end,
    };
}

export async function getProfileWithCounts(
    supabase: SupabaseClient,
    userId: string
): Promise<ProfileWithCounts | null> {
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
      id,
      email,
      tier,
      notification_email,
      regione_interesse,
      provincia_interesse,
      subscription_status,
      subscription_period_end
    `)
        .eq('id', userId)
        .maybeSingle();

    if (profileError || !profile) {
        if (profileError) {
            console.error('[brevo-profile] profile query failed', { userId, profileError });
        }
        return null;
    }

    const [{ count: savedConcorsiCount }, { count: savedSearchesCount }] = await Promise.all([
        supabase
            .from('saved_concorsi')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
        supabase
            .from('saved_searches')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
    ]);

    return {
        profile: profile as ProfileWithCounts['profile'],
        savedConcorsiCount: savedConcorsiCount ?? 0,
        savedSearchesCount: savedSearchesCount ?? 0,
    };
}
