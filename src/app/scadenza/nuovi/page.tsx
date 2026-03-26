import type { Metadata } from 'next';
import { createCachedPublicClient } from '@/lib/supabase/server';
import { getNuoviConcorsi } from '@/lib/supabase/queries';
import { ScadenzaCollectionPage } from '@/components/scadenza/ScadenzaCollectionPage';

export const metadata: Metadata = {
    title: 'Nuovi Concorsi Pubblici',
    description: 'I concorsi pubblici più recenti, pubblicati negli ultimi 7 giorni.',
};
const FREE_VISIBLE = 5;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NuoviPage() {
    const supabase = createCachedPublicClient({ revalidate, tags: ['public:scadenza-nuovi'] });
    const tier = 'anon' as const;
    const resultsLimit = FREE_VISIBLE;
    const { data: concorsi, count } = await getNuoviConcorsi(supabase, 1, resultsLimit);

    const isLocked = true;
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
