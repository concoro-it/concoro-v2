import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getConcorsi, getRegioniWithCount, getSavedConcorsiIds, getSettoriWithCount, getUserProfile } from '@/lib/supabase/queries';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import { ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import Link from 'next/link';
import type { ConcorsoFilters } from '@/types/concorso';
import { getUserTier } from '@/lib/auth/getUserTier';
import { redirect } from 'next/navigation';
import { PreferencesControl } from '@/components/concorsi/PreferencesControl';
import { ActiveFiltersBar } from '@/components/concorsi/ActiveFiltersBar';
import { SearchBar } from '@/components/concorsi/SearchBar';

export const metadata: Metadata = {
    title: 'Concorsi | Dashboard',
    description: 'Esplora i concorsi dal tuo dashboard.',
};

const REGISTERED_LIMIT = 20;
const PAGE_LIMIT = 20;

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

export default async function DashboardConcorsiPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const requestedPage = parseInt(params.page ?? '1', 10);

    const filters: ConcorsoFilters = {
        query: params.q,
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

    if (!user) {
        redirect('/login');
    }

    const tier = await getUserTier(supabase);
    const isUnlimited = tier === 'pro' || tier === 'admin';
    const page = isUnlimited ? requestedPage : 1;

    const [{ data: concorsi, count }, savedIds, profile, regioniWithCount, settoriWithCount] = await Promise.all([
        getConcorsi(supabase, filters, page, PAGE_LIMIT),
        getSavedConcorsiIds(supabase, user.id),
        getUserProfile(supabase, user.id),
        getRegioniWithCount(supabase),
        getSettoriWithCount(supabase),
    ]);

    const visibleResults = isUnlimited ? concorsi : concorsi.slice(0, REGISTERED_LIMIT);
    const shownCount = isUnlimited ? (count ?? 0) : Math.min(count ?? 0, REGISTERED_LIMIT);
    const totalPages = Math.ceil((count ?? 0) / PAGE_LIMIT);

    function buildPageUrl(nextPage: number): string {
        const sp = new URLSearchParams({
            ...(params.regione && { regione: params.regione }),
            ...(params.provincia && { provincia: params.provincia }),
            ...(params.settore && { settore: params.settore }),
            ...(params.q && { q: params.q }),
            ...(params.ente_slug && { ente_slug: params.ente_slug }),
            ...(params.tipo_procedura && { tipo_procedura: params.tipo_procedura }),
            ...(params.published_from && { published_from: params.published_from }),
            ...(params.published_to && { published_to: params.published_to }),
            ...(params.sort && { sort: params.sort }),
            ...(params.stato && { stato: params.stato }),
            page: String(nextPage),
        });
        return `/hub/concorsi?${sp.toString()}`;
    }

    return (
        <div className="container max-w-container mx-auto px-4 py-8">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Concorsi</h1>
                    <p className="text-muted-foreground mt-1">{shownCount} risultati visibili</p>
                </div>
                <div className="shrink-0 md:hidden">
                    <PreferencesControl
                        tier={tier}
                        userId={user.id}
                        profileDefaults={profile}
                        regioni={regioniWithCount.map((item) => ({ value: item.regione, label: `${item.regione} (${item.count})` }))}
                        settori={settoriWithCount.map((item) => ({ value: item.settore, label: `${item.settore} (${item.count})` }))}
                    />
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
                <SearchBar
                    basePath="/hub/concorsi"
                    className="flex-1"
                    placeholder='Cerca per ente, profilo o titolo (es. "Comune di Milano", "Istruttore", "Infermiere")'
                />
                <div className="hidden self-start md:block md:self-auto">
                    <PreferencesControl
                        tier={tier}
                        userId={user.id}
                        profileDefaults={profile}
                        regioni={regioniWithCount.map((item) => ({ value: item.regione, label: `${item.regione} (${item.count})` }))}
                        settori={settoriWithCount.map((item) => ({ value: item.settore, label: `${item.settore} (${item.count})` }))}
                    />
                </div>
            </div>
            <ActiveFiltersBar />

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
