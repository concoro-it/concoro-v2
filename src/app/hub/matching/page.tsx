import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { getUserProfile } from '@/lib/supabase/queries';
import { MatchingWorkspace } from '@/components/matching/MatchingWorkspace';

export const metadata: Metadata = { title: 'Matching | Dashboard' };

export default async function MatchingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    const [tier, profile] = await Promise.all([
        getUserTier(supabase),
        getUserProfile(supabase, user.id),
    ]);

    return <MatchingWorkspace userId={user.id} tier={tier} profile={profile} />;
}
