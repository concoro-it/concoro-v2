import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getConcorsi } from '@/lib/supabase/queries';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ConcorsoFilters } from '@/types/concorso';
import { getUserTier } from '@/lib/auth/getUserTier';
import { BlurredResultsSection } from '@/components/paywall/PaywallBanner';

export const metadata: Metadata = {
    title: 'Tutti i Concorsi Pubblici',
    description: 'Esplora tutti i concorsi pubblici italiani. Filtrate per regione, settore, ente, tipo procedura e scadenza.',
};

const SORT_OPTIONS = [
    { value: 'scadenza', label: 'Scadenza vicina' },
    { value: 'recenti', label: 'Più recenti' },
    { value: 'posti', label: 'Più posti' },
];

const STATO_OPTIONS = [
    { value: 'aperti', label: 'Aperti' },
    { value: 'scaduti', label: 'Scaduti' },
];

const TIPO_OPTIONS = [
    { value: '', label: 'Tutti' },
    { value: 'ESAMI', label: 'Esami' },
    { value: 'TITOLI', label: 'Titoli' },
    { value: 'TITOLI_COLLOQUIO', label: 'Titoli + Colloquio' },
    { value: 'COLLOQUIO', label: 'Colloquio' },
];

const FREE_VISIBLE = 5;

interface SearchParams {
    page?: string;
    q?: string;
    regione?: string;
    settore?: string;
    ente_slug?: string;
    tipo_procedura?: string;
    sort?: string;
    stato?: string;
}

export default async function ConcorsiPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const page = parseInt(params.page ?? '1', 10);
    const LIMIT = 20;

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
    const [{ data: concorsi, count }, tier] = await Promise.all([
        getConcorsi(supabase, filters, page, LIMIT),
        getUserTier(supabase),
    ]);
    const totalPages = Math.ceil((count ?? 0) / LIMIT);

    const isLocked = tier !== 'pro' && tier !== 'admin';
    const showPaywall = isLocked && (page > 1 || (concorsi?.length ?? 0) > FREE_VISIBLE);

    function buildPageUrl(p: number): string {
        const sp = new URLSearchParams({
            ...(params.regione && { regione: params.regione }),
            ...(params.settore && { settore: params.settore }),
            ...(params.tipo_procedura && { tipo_procedura: params.tipo_procedura }),
            ...(params.sort && { sort: params.sort }),
            ...(params.stato && { stato: params.stato }),
            page: String(p),
        });
        return `/concorsi?${sp.toString()}`;
    }

    const visibleResults = showPaywall && page === 1
        ? concorsi?.slice(0, FREE_VISIBLE) ?? []
        : (showPaywall && page > 1 ? [] : concorsi ?? []);

    const lockedResults = showPaywall && page === 1
        ? concorsi?.slice(FREE_VISIBLE) ?? []
        : [];

    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-semibold tracking-tight">Concorsi Pubblici</h1>
                <p className="text-muted-foreground mt-1">
                    {count ?? 0} concorsi disponibili
                </p>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-border">
                {/* Sort */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Ordina:</label>
                    <div className="flex gap-1">
                        {SORT_OPTIONS.map(opt => (
                            <Link key={opt.value} href={buildPageUrl(1)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${(params.sort ?? 'scadenza') === opt.value
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-white border-border hover:bg-secondary'
                                    }`}>
                                {opt.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Stato */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Stato:</label>
                    <div className="flex gap-1">
                        {STATO_OPTIONS.map(opt => {
                            const sp = new URLSearchParams({
                                ...(params.regione && { regione: params.regione }),
                                ...(params.settore && { settore: params.settore }),
                                ...(params.tipo_procedura && { tipo_procedura: params.tipo_procedura }),
                                ...(params.sort && { sort: params.sort }),
                                stato: opt.value,
                                page: '1'
                            });
                            const isActive = (params.stato ?? 'aperti') === opt.value;
                            return (
                                <Link key={opt.value} href={`/concorsi?${sp.toString()}`}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${isActive
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-white border-border hover:bg-secondary'
                                        }`}>
                                    {opt.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Tipo procedura */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Tipo:</label>
                    <div className="flex gap-1 flex-wrap">
                        {TIPO_OPTIONS.map(opt => (
                            <Link key={opt.value} href={`/concorsi?${new URLSearchParams({ ...(opt.value && { tipo_procedura: opt.value }), ...(params.sort && { sort: params.sort }) })}`}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${(params.tipo_procedura ?? '') === opt.value
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-white border-border hover:bg-secondary'
                                    }`}>
                                {opt.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results */}
            <ConcorsoList concorsi={visibleResults} />

            {showPaywall && (
                <div className="mt-8">
                    <BlurredResultsSection
                        concorsi={lockedResults.length > 0 ? lockedResults : (concorsi?.slice(0, 3) ?? [])}
                        lockedCount={(count ?? 0) - (page === 1 ? FREE_VISIBLE : 0)}
                        isLoggedIn={tier !== 'anon'}
                    />
                </div>
            )}

            {/* Pagination */}
            {!showPaywall && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    {page > 1 && (
                        <Link href={buildPageUrl(page - 1)}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors">
                            <ChevronLeft className="w-4 h-4" /> Precedente
                        </Link>
                    )}
                    <span className="text-sm text-muted-foreground px-4">
                        Pagina {page} di {totalPages}
                    </span>
                    {page < totalPages && (
                        <Link href={buildPageUrl(page + 1)}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors">
                            Successiva <ChevronRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
