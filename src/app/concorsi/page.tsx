import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getConcorsi, getRegioniWithCount, getSettoriWithCount, getUserProfile } from '@/lib/supabase/queries';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ConcorsoFilters } from '@/types/concorso';
import { getUserTier } from '@/lib/auth/getUserTier';
import { BlurredResultsSection } from '@/components/paywall/PaywallBanner';
import { PreferencesControl } from '@/components/concorsi/PreferencesControl';
import { ActiveFiltersBar } from '@/components/concorsi/ActiveFiltersBar';

export const metadata: Metadata = {
    title: 'Tutti i Concorsi Pubblici',
    description: 'Esplora tutti i concorsi pubblici italiani. Filtrate per regione, settore, ente, tipo procedura e scadenza.',
};

const FREE_VISIBLE = 5;

interface SearchParams {
    page?: string;
    q?: string;
    regione?: string;
    provincia?: string;
    settore?: string;
    ente_slug?: string;
    tipo_procedura?: string;
    published_from?: string;
    published_to?: string;
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
        provincia: params.provincia,
        settore: params.settore,
        ente_slug: params.ente_slug,
        tipo_procedura: params.tipo_procedura,
        published_from: params.published_from,
        published_to: params.published_to,
        sort: (params.sort as ConcorsoFilters['sort']) ?? 'scadenza',
        stato: (params.stato as ConcorsoFilters['stato']) ?? 'aperti',
        solo_attivi: true,
    };

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const [{ data: concorsi, count }, tier] = await Promise.all([
        getConcorsi(supabase, filters, page, LIMIT),
        getUserTier(supabase),
    ]);
    const [profile, regioniWithCount, settoriWithCount] = await Promise.all([
        user ? getUserProfile(supabase, user.id) : Promise.resolve(null),
        getRegioniWithCount(supabase),
        getSettoriWithCount(supabase),
    ]);
    const totalPages = Math.ceil((count ?? 0) / LIMIT);

    const isLocked = tier !== 'pro' && tier !== 'admin';
    const showPaywall = isLocked && (page > 1 || (concorsi?.length ?? 0) > FREE_VISIBLE);

    function buildPageUrl(p: number): string {
        const sp = new URLSearchParams({
            ...(params.regione && { regione: params.regione }),
            ...(params.provincia && { provincia: params.provincia }),
            ...(params.settore && { settore: params.settore }),
            ...(params.ente_slug && { ente_slug: params.ente_slug }),
            ...(params.tipo_procedura && { tipo_procedura: params.tipo_procedura }),
            ...(params.published_from && { published_from: params.published_from }),
            ...(params.published_to && { published_to: params.published_to }),
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
            <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Concorsi Pubblici</h1>
                    <p className="text-muted-foreground mt-1">
                        {count ?? 0} concorsi disponibili
                    </p>
                </div>
                <div className="ml-3 flex-shrink-0 self-start">
                    <PreferencesControl
                        tier={tier}
                        userId={user?.id}
                        isPublicPage
                        profileDefaults={profile}
                        regioni={regioniWithCount.map((item) => ({ value: item.regione, label: `${item.regione} (${item.count})` }))}
                        settori={settoriWithCount.map((item) => ({ value: item.settore, label: `${item.settore} (${item.count})` }))}
                    />
                </div>
            </div>
            <ActiveFiltersBar />

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
