import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MatchingWorkspace } from '@/components/matching/MatchingWorkspace';
import { getUserContext } from '@/lib/auth/getUserContext';

export const metadata: Metadata = { title: 'Abbinamenti | Hub' };

export default async function MatchingPage() {
    const supabase = await createClient();
    const { user, profile, tier } = await getUserContext(supabase);
    if (!user) {
        redirect('/login');
    }

    return <MatchingWorkspace userId={user.id} tier={tier} profile={profile} />;
}
