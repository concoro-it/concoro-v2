import type { Metadata } from 'next';
import { createCachedPublicClient } from '@/lib/supabase/server';
import { getScadenzaQuestoMese } from '@/lib/supabase/queries';
import { ScadenzaCollectionPage } from '@/components/scadenza/ScadenzaCollectionPage';

export const metadata: Metadata = {
    title: 'Concorsi in Scadenza Questo Mese',
    description: 'Tutti i concorsi pubblici in scadenza questo mese. Organizza le tue candidature.',
};
const FREE_VISIBLE = 5;
export const revalidate = 3600;

export default async function QuestoMesePage() {
    const supabase = createCachedPublicClient({ revalidate, tags: ['public:scadenza-mese'] });
    const tier = 'anon' as const;
    const resultsLimit = FREE_VISIBLE;
    const { data: concorsi, count } = await getScadenzaQuestoMese(supabase, 1, resultsLimit);

    const isLocked = true;
    const showPaywall = isLocked && count > FREE_VISIBLE;
    const visible = concorsi.slice(0, FREE_VISIBLE);
    const locked = concorsi.slice(FREE_VISIBLE);

    return (
        <ScadenzaCollectionPage
            bucketKey="questo-mese"
            count={count ?? 0}
            visible={visible}
            locked={locked}
            isLocked={isLocked}
            showPaywall={showPaywall}
            tier={tier}
        />
    );
}
