import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getScadenzaQuestaSettimana } from '@/lib/supabase/queries';
import { getUserTier } from '@/lib/auth/getUserTier';
import { ScadenzaCollectionPage } from '@/components/scadenza/ScadenzaCollectionPage';

export const metadata: Metadata = {
    title: 'Concorsi in Scadenza Questa Settimana',
    description: 'Concorsi pubblici in scadenza nei prossimi 7 giorni. Non perdere le opportunità della settimana.',
};
const FREE_VISIBLE = 5;
export const revalidate = 3600;

export default async function QuestaSettimanaPage() {
    const supabase = await createClient();
    const tier = await getUserTier(supabase);
    const resultsLimit = tier === 'anon' ? FREE_VISIBLE : 50;
    const { data: concorsi, count } = await getScadenzaQuestaSettimana(supabase, 1, resultsLimit);

    const isLocked = tier !== 'pro' && tier !== 'admin';
    const showPaywall = isLocked && count > FREE_VISIBLE;
    const visible = concorsi.slice(0, FREE_VISIBLE);
    const locked = concorsi.slice(FREE_VISIBLE);

    return (
        <ScadenzaCollectionPage
            bucketKey="questa-settimana"
            count={count ?? 0}
            visible={visible}
            locked={locked}
            isLocked={isLocked}
            showPaywall={showPaywall}
            tier={tier}
        />
    );
}
