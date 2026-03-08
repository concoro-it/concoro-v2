import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getConcorsi, getSavedConcorsiIds } from '@/lib/supabase/queries';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import { ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import Link from 'next/link';
import type { ConcorsoFilters } from '@/types/concorso';
import { getUserTier } from '@/lib/auth/getUserTier';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Concorsi | Dashboard',
    description: 'Esplora i concorsi dal tuo dashboard.',
};

const SORT_OPTIONS = [
    { value: 'scadenza', label: 'Scadenza vicina' },
    { value: 'recenti', label: 'Più recenti' },
    { value: 'posti', label: 'Più posti' },
] as const;

const STATO_OPTIONS = [
    { value: 'aperti', label: 'Aperti' },
    { value: 'scaduti', label: 'Scaduti' },
] as const;

const TIPO_OPTIONS = [
    { value: '', label: 'Tutti' },
    { value: 'ESAMI', label: 'Esami' },
    { value: 'TITOLI', label: 'Titoli' },
    { value: 'TITOLI_COLLOQUIO', label: 'Titoli + Colloquio' },
    { value: 'COLLOQUIO', label: 'Colloquio' },
] as const;

const REGISTERED_LIMIT = 20;
const PAGE_LIMIT = 20;

interface SearchParams {
    page?: string;
    regione?: string;
    settore?: string;
    ente_slug?: string;
    tipo_procedura?: string;
    sort?: string;
    stato?: string;
}

export default async function DashboardConcorsiPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const requestedPage = parseInt(params.page ?? '1', 10);

    const filters: ConcorsoFilters = {
        regione: params.regione,
        settore: params.settore,
        ente_slug: params.ente_slug,
        tipo_procedura: params.tipo_procedura,
        sort: (params.sort as ConcorsoFilters['sort']) ?? 'scadenza',
        stato: (params.stato as ConcorsoFilters['stato']) ?? 'aperti',
        solo_attivi: true,
    };

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const tier = await getUserTier(supabase);
    const isUnlimited = tier === 'pro' || tier === 'admin';
    const page = isUnlimited ? requestedPage : 1;

    const [{ data: concorsi, count }, savedIds] = await Promise.all([
        getConcorsi(supabase, filters, page, PAGE_LIMIT),
        getSavedConcorsiIds(supabase, user.id),
    ]);

    const visibleResults = isUnlimited ? concorsi : concorsi.slice(0, REGISTERED_LIMIT);
    const shownCount = isUnlimited ? (count ?? 0) : Math.min(count ?? 0, REGISTERED_LIMIT);
    const totalPages = Math.ceil((count ?? 0) / PAGE_LIMIT);

    function buildPageUrl(nextPage: number): string {
        const sp = new URLSearchParams({
            ...(params.regione && { regione: params.regione }),
            ...(params.settore && { settore: params.settore }),
            ...(params.ente_slug && { ente_slug: params.ente_slug }),
            ...(params.tipo_procedura && { tipo_procedura: params.tipo_procedura }),
            ...(params.sort && { sort: params.sort }),
            ...(params.stato && { stato: params.stato }),
            page: String(nextPage),
        });
        return `/hub/concorsi?${sp.toString()}`;
    }

    function buildFilterUrl(updates: Partial<SearchParams>): string {
        const sp = new URLSearchParams({
            ...(params.regione && { regione: params.regione }),
            ...(params.settore && { settore: params.settore }),
            ...(params.ente_slug && { ente_slug: params.ente_slug }),
            ...(params.tipo_procedura && { tipo_procedura: params.tipo_procedura }),
            ...(params.sort && { sort: params.sort }),
            ...(params.stato && { stato: params.stato }),
            ...Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined)),
            page: '1',
        });

        if (!sp.get('tipo_procedura')) {
            sp.delete('tipo_procedura');
        }

        return `/hub/concorsi?${sp.toString()}`;
    }

    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-semibold tracking-tight">Concorsi</h1>
                <p className="text-muted-foreground mt-1">{shownCount} risultati visibili</p>
            </div>

            {!isUnlimited && (count ?? 0) > REGISTERED_LIMIT && (
                <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
                    <Crown className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                        <p className="font-semibold">Limite account registrato: 20 risultati</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Passa a Pro per vedere tutti i concorsi senza limiti.
                        </p>
                        <Link href="/pricing" className="inline-block mt-2 text-sm font-medium text-primary hover:underline">
                            Sblocca Pro
                        </Link>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-border">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Ordina:</label>
                    <div className="flex gap-1">
                        {SORT_OPTIONS.map((opt) => (
                            <Link
                                key={opt.value}
                                href={buildFilterUrl({ sort: opt.value })}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${(params.sort ?? 'scadenza') === opt.value
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-white border-border hover:bg-secondary'
                                    }`}
                            >
                                {opt.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Stato:</label>
                    <div className="flex gap-1">
                        {STATO_OPTIONS.map((opt) => {
                            const isActive = (params.stato ?? 'aperti') === opt.value;
                            return (
                                <Link
                                    key={opt.value}
                                    href={buildFilterUrl({ stato: opt.value })}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${isActive
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-white border-border hover:bg-secondary'
                                        }`}
                                >
                                    {opt.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Tipo:</label>
                    <div className="flex gap-1 flex-wrap">
                        {TIPO_OPTIONS.map((opt) => (
                            <Link
                                key={opt.value}
                                href={buildFilterUrl({ tipo_procedura: opt.value || undefined })}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${(params.tipo_procedura ?? '') === opt.value
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-white border-border hover:bg-secondary'
                                    }`}
                            >
                                {opt.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <ConcorsoList
                concorsi={visibleResults}
                savedIds={savedIds}
                detailBasePath="/hub/concorsi"
            />

            {isUnlimited && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    {page > 1 && (
                        <Link
                            href={buildPageUrl(page - 1)}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" /> Precedente
                        </Link>
                    )}
                    <span className="text-sm text-muted-foreground px-4">
                        Pagina {page} di {totalPages}
                    </span>
                    {page < totalPages && (
                        <Link
                            href={buildPageUrl(page + 1)}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
                        >
                            Successiva <ChevronRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
