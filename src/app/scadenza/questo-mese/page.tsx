import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getScadenzaQuestoMese } from '@/lib/supabase/queries';
import { getUserTier } from '@/lib/auth/getUserTier';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import { PaywallBanner, BlurredResultsSection } from '@/components/paywall/PaywallBanner';

export const metadata: Metadata = {
    title: 'Concorsi in Scadenza Questo Mese',
    description: 'Tutti i concorsi pubblici in scadenza questo mese. Organizza le tue candidature.',
};
const FREE_VISIBLE = 5;
export const revalidate = 3600;

export default async function QuestoMesePage() {
    const supabase = await createClient();
    const [{ data: concorsi, count }, tier] = await Promise.all([
        getScadenzaQuestoMese(supabase, 1, 50),
        getUserTier(supabase),
    ]);

    const isLocked = tier !== 'pro' && tier !== 'admin';
    const visible = concorsi.slice(0, FREE_VISIBLE);
    const locked = concorsi.slice(FREE_VISIBLE);

    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
                <Link href="/" className="hover:text-foreground">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <Link href="/scadenza" className="hover:text-foreground">Scadenze</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">Questo Mese</span>
            </nav>

            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    🗓 Concorsi in scadenza questo mese
                    <span className="ml-3 text-lg font-normal text-muted-foreground">({count})</span>
                </h1>
                <p className="text-muted-foreground mt-1">
                    {count} concorsi scadono questo mese.
                </p>
            </div>

            <ConcorsoList concorsi={visible} />

            {isLocked && locked.length > 0 && (
                <BlurredResultsSection
                    concorsi={locked}
                    lockedCount={locked.length}
                    isLoggedIn={tier !== 'anon'}
                />
            )}

            {!isLocked && locked.length > 0 && (
                <ConcorsoList concorsi={locked} />
            )}

            {count === 0 && (
                <div className="text-center py-12 border rounded-xl bg-muted/30">
                    <p className="text-muted-foreground">Nessun concorso in scadenza questo mese.</p>
                </div>
            )}
        </div>
    );
}
