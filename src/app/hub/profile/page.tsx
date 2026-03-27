import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient, createStaticAdminClient } from '@/lib/supabase/server';
import { ProfileSettings } from '@/components/dashboard/ProfileSettings';
import type { Profile } from '@/types/profile';

export const metadata: Metadata = { title: 'Profilo | Hub' };

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    let resolvedProfile = (profile as Profile | null) ?? null;

    // Some environments may have restrictive RLS on read for `profiles`.
    // Fallback to a server-side admin read scoped to the authenticated user.
    if (!resolvedProfile && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createStaticAdminClient();
        const { data: adminProfile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        resolvedProfile = (adminProfile as Profile | null) ?? null;
    }

    return (
        <ProfileSettings
            user={{ id: user.id, email: user.email }}
            profile={resolvedProfile}
        />
    );
}
