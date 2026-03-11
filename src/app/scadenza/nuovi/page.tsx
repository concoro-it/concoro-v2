import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getNuoviConcorsi } from '@/lib/supabase/queries';
import { getUserTier } from '@/lib/auth/getUserTier';
import { ScadenzaCollectionPage } from '@/components/scadenza/ScadenzaCollectionPage';

export const metadata: Metadata = {
    title: 'Nuovi Concorsi Pubblici',
    description: 'I concorsi pubblici più recenti, pubblicati negli ultimi 7 giorni.',
};
const FREE_VISIBLE = 5;
export const revalidate = 3600;

export default async function NuoviPage() {
    const supabase = await createClient();
    const tier = await getUserTier(supabase);
    const resultsLimit = tier === 'anon' ? FREE_VISIBLE : 50;
    const { data: concorsi, count } = await getNuoviConcorsi(supabase, 1, resultsLimit);

    const isLocked = tier !== 'pro' && tier !== 'admin';
    const showPaywall = isLocked && count > FREE_VISIBLE;
    const visible = concorsi.slice(0, FREE_VISIBLE);
    const locked = concorsi.slice(FREE_VISIBLE);

    return (
        <ScadenzaCollectionPage
            bucketKey="nuovi"
            count={count ?? 0}
            visible={visible}
            locked={locked}
            isLocked={isLocked}
            showPaywall={showPaywall}
            tier={tier}
        />
    );
}
