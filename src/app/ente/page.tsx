import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, Lock } from 'lucide-react';
import { createCachedPublicClient } from '@/lib/supabase/server';
import { getEntiWithCount } from '@/lib/supabase/queries';

export const metadata: Metadata = {
    title: 'Concorsi Pubblici per Ente | Cerca bandi per amministrazione | Concoro',
    description: 'Cerca i concorsi pubblici per ente e consulta i bandi delle singole amministrazioni. Utile se sai gia quali enti vuoi monitorare.',
};

export const revalidate = 3600;
const FREE_VISIBLE_ENTI = 20;

export default async function EnteIndexPage() {
    const supabase = createCachedPublicClient({ revalidate, tags: ['public:ente-index'] });
    const enti = await getEntiWithCount(supabase);
    const isLocked = true;
    const showPaywall = isLocked && enti.length > FREE_VISIBLE_ENTI;
    const visibleEnti = showPaywall ? enti.slice(0, FREE_VISIBLE_ENTI) : enti;
    const lockedEnti = showPaywall ? enti.slice(FREE_VISIBLE_ENTI, FREE_VISIBLE_ENTI + 6) : [];
    const lockedCount = Math.max(0, enti.length - FREE_VISIBLE_ENTI);

    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            <div className="mb-8">
                <nav className="text-sm text-muted-foreground mb-4">
                    <Link href="/" className="hover:text-foreground">Home</Link>
                    {' › '}
                    <span className="text-foreground">Enti</span>
                </nav>
                <h1 className="text-3xl font-bold tracking-tight">Concorsi pubblici per ente</h1>
                <p className="text-muted-foreground mt-1">Seleziona un ente per vedere i bandi attivi e capire subito quali amministrazioni pubblicano di piu</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {visibleEnti.map(({ ente_nome, ente_slug, count }) => (
                    <Link
                        key={ente_slug}
                        href={`/ente/${ente_slug}`}
                        className="flex flex-col items-start p-4 rounded-xl border border-border bg-white hover:shadow-md hover:border-primary/20 transition-all group"
                    >
                        <Building2 className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold leading-tight line-clamp-2">{ente_nome || ente_slug}</span>
                        <span className="text-xs text-muted-foreground mt-1">{count} aperti</span>
                    </Link>
                ))}
            </div>

            {showPaywall && (
                <section className="mt-8 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-sky-50 via-white to-primary/10 p-5">
                    <div className="rounded-2xl border border-primary/15 bg-white/90 p-5">
                        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                            <Lock className="h-3.5 w-3.5" />
                            Accesso Pro
                        </p>
                        <h2 className="mt-3 text-xl font-semibold text-slate-900">
                            Altri {lockedCount} enti sono disponibili nel piano Pro
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Sblocca la directory completa degli enti e monitora piu amministrazioni senza limiti.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                                href="/pricing?billing=yearly&source=ente-index-paywall"
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                            >
                                Sblocca tutti gli enti
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/signup?source=ente-index-paywall"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Crea account gratuito
                            </Link>
                        </div>
                    </div>

                    {lockedEnti.length > 0 && (
                        <div className="pointer-events-none mt-4 grid grid-cols-1 gap-3 opacity-60 blur-[2.4px] sm:grid-cols-2 md:grid-cols-3">
                            {lockedEnti.map(({ ente_nome, ente_slug, count }) => (
                                <div
                                    key={ente_slug}
                                    className="flex flex-col items-start rounded-xl border border-border bg-white p-4"
                                >
                                    <Building2 className="mb-2 h-5 w-5 text-primary" />
                                    <span className="line-clamp-2 text-sm font-semibold leading-tight">{ente_nome || ente_slug}</span>
                                    <span className="mt-1 text-xs text-muted-foreground">{count} aperti</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
