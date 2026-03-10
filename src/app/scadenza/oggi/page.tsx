import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getScadenzaOggi } from '@/lib/supabase/queries';
import { getUserTier } from '@/lib/auth/getUserTier';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import { BlurredResultsSection } from '@/components/paywall/PaywallBanner';

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
        <div className="container max-w-container mx-auto px-4 py-8">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
                <Link href="/" className="hover:text-foreground">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <Link href="/scadenza" className="hover:text-foreground">Scadenze</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">Oggi</span>
            </nav>

            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    ⏳ Concorsi in scadenza oggi
                    <span className="ml-3 text-lg font-normal text-muted-foreground">({count})</span>
                </h1>
                <p className="text-muted-foreground mt-1">
                    {count} concorsi scadono oggi — ultima occasione per candidarsi!
                </p>
            </div>

            <ConcorsoList concorsi={visible} />

            {showPaywall && (
                <BlurredResultsSection
                    concorsi={tier === 'anon' ? [] : locked}
                    lockedCount={Math.max(0, count - FREE_VISIBLE)}
                    isLoggedIn={tier !== 'anon'}
                    useMockResults={tier === 'anon'}
                />
            )}

            {!isLocked && locked.length > 0 && (
                <ConcorsoList concorsi={locked} />
            )}

            {count === 0 && (
                <div className="text-center py-12 border rounded-xl bg-muted/30">
                    <p className="text-muted-foreground">Nessun concorso in scadenza oggi.</p>
                </div>
            )}
        </div>
    );
}
