import type { Metadata } from 'next';
import { createCachedPublicClient } from '@/lib/supabase/server';
import { getScadenzaQuestaSettimana } from '@/lib/supabase/queries';
import { ScadenzaCollectionPage } from '@/components/scadenza/ScadenzaCollectionPage';

export const metadata: Metadata = {
    title: 'Concorsi in Scadenza Questa Settimana',
    description: 'Concorsi pubblici in scadenza nei prossimi 7 giorni. Non perdere le opportunità della settimana.',
};
const FREE_VISIBLE = 5;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function QuestaSettimanaPage() {
    const supabase = createCachedPublicClient({ revalidate, tags: ['public:scadenza-settimana'] });
    const tier = 'anon' as const;
    const resultsLimit = FREE_VISIBLE;
    const { data: concorsi, count } = await getScadenzaQuestaSettimana(supabase, 1, resultsLimit);

    const isLocked = true;
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
