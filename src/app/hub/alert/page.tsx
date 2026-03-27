import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SavedSearchAlertCenter } from '@/components/alert/SavedSearchAlertCenter';
import { getUserContext } from '@/lib/auth/getUserContext';

export const metadata: Metadata = { title: 'Avvisi | Hub' };

export default async function AlertPage() {
    const supabase = await createClient();
    const { user, tier } = await getUserContext(supabase);

    if (!user) {
        redirect('/login');
    }

    return <SavedSearchAlertCenter tier={tier} />;
}
