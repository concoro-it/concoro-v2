import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient, createStaticAdminClient } from '@/lib/supabase/server';
import { GenioMatchTestClient } from '@/components/genio/GenioMatchTestClient';
import type { Profile } from '@/types/profile';

export const metadata: Metadata = { title: 'Genio V2 test | Hub' };

export default async function GenioTestPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?redirectTo=/hub/genio-test');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    let resolvedProfile = (profile as Profile | null) ?? null;

    if (!resolvedProfile && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createStaticAdminClient();
        const { data: adminProfile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        resolvedProfile = (adminProfile as Profile | null) ?? null;
    }

    return <GenioMatchTestClient profile={resolvedProfile} />;
}
