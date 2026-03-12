import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileSettings } from '@/components/dashboard/ProfileSettings';
import type { Profile } from '@/types/profile';

export const metadata: Metadata = { title: 'Profilo | Dashboard' };

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

    return (
        <ProfileSettings
            user={{ id: user.id, email: user.email }}
            profile={(profile as Profile | null) ?? null}
        />
    );
}
