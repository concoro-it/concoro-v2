import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getScadenzaOggi } from '@/lib/supabase/queries';
import { getUserTier } from '@/lib/auth/getUserTier';
import { ScadenzaCollectionPage } from '@/components/scadenza/ScadenzaCollectionPage';

export const metadata: Metadata = {
    title: 'Concorsi in Scadenza Oggi',
    description: 'Tutti i concorsi pubblici che scadono oggi. Non perdere le ultime opportunità.',
};
const FREE_VISIBLE = 5;
export const revalidate = 3600;

export default async function ScadenzaOggiPage() {
    const supabase = await createClient();
    const tier = await getUserTier(supabase);
    const resultsLimit = tier === 'anon' ? FREE_VISIBLE : 50;
    const { data: concorsi, count } = await getScadenzaOggi(supabase, 1, resultsLimit);

    const isLocked = tier !== 'pro' && tier !== 'admin';
    const showPaywall = isLocked && count > FREE_VISIBLE;
    const visible = concorsi.slice(0, FREE_VISIBLE);
    const locked = concorsi.slice(FREE_VISIBLE);

    return (
        <ScadenzaCollectionPage
            bucketKey="oggi"
            count={count ?? 0}
            visible={visible}
            locked={locked}
            isLocked={isLocked}
            showPaywall={showPaywall}
            tier={tier}
        />
    );
}
