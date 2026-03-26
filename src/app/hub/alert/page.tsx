import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { SavedSearchAlertCenter } from '@/components/alert/SavedSearchAlertCenter';

export const metadata: Metadata = { title: 'Alert | Dashboard' };

export default async function AlertPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const tier = await getUserTier(supabase);

    return <SavedSearchAlertCenter tier={tier} />;
}
