import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { PresetDetailView } from '@/components/alert/PresetDetailView';

export const metadata: Metadata = { title: 'Preset Alert | Dashboard' };

type PageProps = {
    params: Promise<{ presetId: string }>;
};

export default async function AlertPresetDetailPage({ params }: PageProps) {
    const { presetId } = await params;

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const tier = await getUserTier(supabase);

    return <PresetDetailView presetId={presetId} tier={tier} />;
}
