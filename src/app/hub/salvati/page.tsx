import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowRight,
    Bell,
    Bookmark,
    BookmarkCheck,
    Crown,
    Lock,
    Search,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { getSavedConcorsi, getSavedSearches } from '@/lib/supabase/queries';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import { UpgradeProModal } from '@/components/paywall/UpgradeProModal';
import { AlertSettingsPanel } from '@/components/salvati/AlertSettingsPanel';
import { deleteSearchAction } from '@/app/hub/ricerche/actions';
import type { SavedSearch } from '@/types/profile';

export const metadata: Metadata = { title: 'Salvati | Dashboard' };

interface SalvatiPageProps {
    searchParams?: Promise<{
        tab?: string;
    }>;
}

function buildSearchHref(search: SavedSearch): string {
    const filters = search.filters || {};
    const searchParams = new URLSearchParams();

    if (filters.query) searchParams.set('q', filters.query);
    if (filters.regioni?.length) searchParams.set('regione', filters.regioni[0]);
    if (filters.province?.length) searchParams.set('provincia', filters.province[0]);
    if (filters.settori?.length) searchParams.set('settore', filters.settori[0]);
    if (filters.tipo_procedura) searchParams.set('tipo_procedura', filters.tipo_procedura);
    if (filters.ente_slug) searchParams.set('ente_slug', filters.ente_slug);
    if (filters.stato) searchParams.set('stato', filters.stato);
    if (filters.sort) searchParams.set('sort', filters.sort);
    if (filters.published_from) searchParams.set('published_from', filters.published_from);

    return `/hub/concorsi${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
}

export default async function SalvatiPage({ searchParams }: SalvatiPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const [tier, savedConcorsi, savedSearches, resolvedSearchParams] = await Promise.all([
        getUserTier(supabase),
        getSavedConcorsi(supabase, user.id),
        getSavedSearches(supabase, user.id),
        searchParams,
    ]);

    const requestedTab = resolvedSearchParams?.tab;
    const activeTab = requestedTab === 'ricerche' || requestedTab === 'alert' ? requestedTab : 'concorsi';
    const isProTier = tier === 'pro' || tier === 'admin';
    const savedConcorsiLimit = tier === 'free' ? 1 : null;
    const savedSearchesLimit = isProTier ? null : 0;
    const remainingConcorsiSlots = savedConcorsiLimit == null ? null : Math.max(0, savedConcorsiLimit - savedConcorsi.length);

    const tabBaseClasses = 'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition';
    const tabActiveClasses = 'bg-slate-900 text-white shadow-md shadow-slate-900/20';
    const tabInactiveClasses = 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900';

    return (
        <div className="dashboard-shell">
            <div className="dashboard-shell-overlay" />
            <div className="relative space-y-6 px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
                <section className="dashboard-section-frame overflow-hidden p-5 sm:p-6 lg:p-7">
                    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-4">
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-slate-50/85 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-slate-700">
                                <BookmarkCheck className="h-3.5 w-3.5" />
                                Workspace salvati
                            </span>
                            <div className="space-y-2">
                                <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl leading-[1.06] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.8rem]">
                                    Mantieni in ordine
                                    <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                        concorsi e ricerche
                                    </span>
                                    in un solo spazio.
                                </h1>
                                <p className="max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
                                    Qui trovi tutto cio che vuoi monitorare: i bandi salvati e le ricerche ricorrenti.
                                </p>
                            </div>
                        </div>

                        <aside className="rounded-2xl border border-slate-200/90 bg-white/85 p-4 sm:p-5">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Il tuo piano</p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                                    {tier === 'admin' ? 'Admin' : tier === 'pro' ? 'Pro' : 'Free'}
                                </span>
                                {!isProTier && (
                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                                        Limiti attivi
                                    </span>
                                )}
                            </div>
                            <div className="mt-4 space-y-2.5 text-sm text-slate-700">
                                <p className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/75 px-3 py-2">
                                    <span>Saved concorsi</span>
                                    <span className="font-semibold">
                                        {savedConcorsi.length}/{savedConcorsiLimit ?? '∞'}
                                    </span>
                                </p>
                                <p className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/75 px-3 py-2">
                                    <span>Saved searches</span>
                                    <span className="font-semibold">
                                        {savedSearches.length}/{savedSearchesLimit ?? '∞'}
                                    </span>
                                </p>
                            </div>
                            {!isProTier && (
                                <div className="mt-4 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-3.5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.11em] text-amber-800">Upgrade consigliato</p>
                                    <p className="mt-1 text-sm text-slate-700">
                                        Con Pro salvi concorsi e ricerche senza limiti.
                                    </p>
                                    <UpgradeProModal triggerClassName="mt-3 inline-block">
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                                            Passa a Pro
                                            <ArrowRight className="h-4 w-4" />
                                        </span>
                                    </UpgradeProModal>
                                </div>
                            )}
                        </aside>
                    </div>
                </section>

                <section className="dashboard-section-frame p-4 sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href="/hub/salvati?tab=concorsi"
                                className={`${tabBaseClasses} ${activeTab === 'concorsi' ? tabActiveClasses : tabInactiveClasses}`}
                            >
                                <Bookmark className="h-4 w-4" />
                                Saved concorsi
                                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                                    {savedConcorsi.length}
                                </span>
                            </Link>
                            <Link
                                href="/hub/salvati?tab=ricerche"
                                className={`${tabBaseClasses} ${activeTab === 'ricerche' ? tabActiveClasses : tabInactiveClasses}`}
                            >
                                <Search className="h-4 w-4" />
                                Saved searches
                                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                                    {savedSearches.length}
                                </span>
                            </Link>
                            <Link
                                href="/hub/salvati?tab=alert"
                                className={`${tabBaseClasses} ${activeTab === 'alert' ? tabActiveClasses : tabInactiveClasses}`}
                            >
                                <Bell className="h-4 w-4" />
                                Alert
                            </Link>
                        </div>
                        <Link href="/hub/concorsi" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0A4E88] hover:underline">
                            Vai ai concorsi
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {activeTab === 'concorsi' ? (
                        <div className="space-y-4">
                            {!isProTier && savedConcorsiLimit !== null && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50/75 px-4 py-3 text-sm text-amber-900">
                                    <p className="font-semibold">Limite Free: 1 concorso salvato</p>
                                    <p className="mt-1">
                                        {remainingConcorsiSlots === 0
                                            ? 'Hai raggiunto il limite. Fai upgrade a Pro per salvare altri concorsi.'
                                            : `Ti resta ${remainingConcorsiSlots} slot disponibile.`}
                                    </p>
                                </div>
                            )}

                            {savedConcorsi.length > 0 ? (
                                <ConcorsoList
                                    concorsi={savedConcorsi}
                                    savedIds={savedConcorsi.map((concorso) => concorso.concorso_id)}
                                    detailBasePath="/hub/concorsi"
                                />
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-12 text-center">
                                    <span className="inline-flex rounded-xl bg-slate-900/8 p-2 text-slate-600"><Bookmark className="h-5 w-5" /></span>
                                    <h3 className="mt-3 text-base font-semibold text-slate-900">Nessun concorso salvato</h3>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Aggiungi i bandi interessanti e ritrovali subito qui.
                                    </p>
                                    <Link
                                        href="/hub/concorsi"
                                        className="mt-4 inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                                    >
                                        Esplora concorsi
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'ricerche' ? isProTier ? (
                        <div className="space-y-3">
                            <div className="rounded-xl border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm text-sky-900">
                                Gestisci i digest delle ricerche da{' '}
                                <Link href="/hub/alert" className="font-semibold underline underline-offset-2">
                                    Alert Center
                                </Link>.
                            </div>
                            {savedSearches.length > 0 ? savedSearches.map((search) => {
                                const filters = search.filters || {};
                                const href = buildSearchHref(search);
                                const query = filters.query;

                                return (
                                    <article key={search.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">{search.name || 'Ricerca senza nome'}</h3>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {query && <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">Testo: {query}</span>}
                                                    {filters.regioni?.map((item) => <span key={item} className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">{item}</span>)}
                                                    {filters.province?.map((item) => <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">{item}</span>)}
                                                    {filters.settori?.map((item) => <span key={item} className="rounded-md bg-emerald-100 px-2 py-1 text-xs text-emerald-800">{item}</span>)}
                                                    {filters.tipo_procedura && <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">{filters.tipo_procedura}</span>}
                                                    {filters.ente_slug && <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">Ente: {filters.ente_slug}</span>}
                                                    {filters.stato && <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">Stato: {filters.stato}</span>}
                                                    {filters.sort && <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">Ordina: {filters.sort}</span>}
                                                    {Object.keys(filters).length === 0 && !query && <span className="text-xs text-slate-500">Tutti i concorsi</span>}
                                                </div>
                                                <p className="mt-3 text-xs text-slate-500">
                                                    Salvata il {new Date(search.created_at).toLocaleDateString('it-IT')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={href}
                                                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                                                >
                                                    Vai ai risultati
                                                    <ArrowRight className="ml-1 h-4 w-4" />
                                                </Link>
                                                <form action={deleteSearchAction.bind(null, search.id)}>
                                                    <button
                                                        type="submit"
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    </article>
                                );
                            }) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-12 text-center">
                                    <span className="inline-flex rounded-xl bg-slate-900/8 p-2 text-slate-600"><Search className="h-5 w-5" /></span>
                                    <h3 className="mt-3 text-base font-semibold text-slate-900">Nessuna ricerca salvata</h3>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Salva i filtri piu utili dalla pagina concorsi e ritrovali qui.
                                    </p>
                                    <Link
                                        href="/hub/concorsi"
                                        className="mt-4 inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                                    >
                                        Apri concorsi
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-5 sm:p-6">
                            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-300/30 blur-2xl" />
                            <div className="relative max-w-2xl space-y-3">
                                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-amber-900">
                                    <Lock className="h-3.5 w-3.5" />
                                    Solo Pro
                                </span>
                                <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                                    Saved searches sono disponibili solo con Pro.
                                </h3>
                                <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
                                    Con il piano Free puoi salvare un solo concorso e non puoi salvare ricerche. Passa a Pro per monitoraggio illimitato.
                                </p>
                                <div className="grid gap-2.5 sm:grid-cols-2">
                                    <UpgradeProModal triggerClassName="w-full">
                                        <span className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                                            <Crown className="h-4 w-4" />
                                            Sblocca Pro
                                        </span>
                                    </UpgradeProModal>
                                    <Link
                                        href="/hub/concorsi"
                                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-amber-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-white"
                                    >
                                        Torna ai concorsi
                                        <Sparkles className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <AlertSettingsPanel tier={tier} />
                    )}
                </section>
            </div>
        </div>
    );
}
