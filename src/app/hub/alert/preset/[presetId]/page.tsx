import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PresetDetailView } from '@/components/alert/PresetDetailView';
import { getUserContext } from '@/lib/auth/getUserContext';

export const metadata: Metadata = { title: 'Dettaglio avviso | Hub' };

type PageProps = {
    params: Promise<{ presetId: string }>;
};

export default async function AlertPresetDetailPage({ params }: PageProps) {
    const { presetId } = await params;

    const supabase = await createClient();
    const { user, tier } = await getUserContext(supabase);

    if (!user) {
        redirect('/login');
    }

    return <PresetDetailView presetId={presetId} tier={tier} />;
}
