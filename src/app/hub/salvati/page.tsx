import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, BookmarkIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSavedConcorsi } from '@/lib/supabase/queries';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';

export const metadata: Metadata = { title: 'Concorsi Salvati | Dashboard' };

export default async function SalvatiPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const savedConcorsi = await getSavedConcorsi(supabase, user.id);

    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
                <Link href="/hub/bacheca" className="hover:text-foreground">Dashboard</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">Concorsi salvati</span>
            </nav>

            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <BookmarkIcon className="w-6 h-6 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">
                        Concorsi salvati
                    </h1>
                </div>
                <p className="text-muted-foreground">
                    Hai {savedConcorsi.length} {savedConcorsi.length === 1 ? 'concorso salvato' : 'concorsi salvati'}.
                </p>
            </div>

            {savedConcorsi.length > 0 ? (
                <ConcorsoList
                    concorsi={savedConcorsi}
                    savedIds={savedConcorsi.map((concorso) => concorso.concorso_id)}
                    detailBasePath="/hub/concorsi"
                />
            ) : (
                <div className="text-center py-16 border border-dashed border-border rounded-xl bg-surface">
                    <BookmarkIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-lg font-medium">Nessun concorso salvato</p>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">
                        Clicca sull'icona del segnalibro nei risultati per salvarli qui.
                    </p>
                    <Link href="/concorsi" className="px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity">
                        Esplora i concorsi
                    </Link>
                </div>
            )}
        </div>
    );
}
