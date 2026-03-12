import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getConcorsi, getProvinceWithCount, getRegioniWithCount, getSettoriWithCount, getUserProfile } from '@/lib/supabase/queries';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Compass,
    Landmark,
    ListFilter,
    MapPin,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { ConcorsoFilters } from '@/types/concorso';
import { getUserTier } from '@/lib/auth/getUserTier';
import { getServerAppUrl } from '@/lib/auth/url';
import { toUrlSlug } from '@/lib/utils/regioni';
import { BlurredResultsSection } from '@/components/paywall/PaywallBanner';
import { PreferencesControl } from '@/components/concorsi/PreferencesControl';
import { ActiveFiltersBar } from '@/components/concorsi/ActiveFiltersBar';

export const metadata: Metadata = {
    title: 'Tutti i Concorsi Pubblici in Italia | Archivio filtrabile | Concoro',
    description: 'Consulta tutti i concorsi pubblici in Italia e filtra per regione, provincia, ente, settore e scadenza. Una vista unica per partire da una ricerca ampia e poi restringerla bene.',
    alternates: { canonical: '/concorsi' },
    keywords: [
        'concorsi pubblici Italia',
        'tutti i concorsi pubblici',
        'concorsi per regione',
        'concorsi per provincia',
        'concorsi per settore',
        'bandi pubblici nazionali',
    ],
    openGraph: {
        title: 'Concorsi Pubblici in Italia | Archivio Nazionale Concoro',
        description: 'Un archivio unico per trovare bandi pubblici filtrati per territorio, ente, settore e scadenza.',
        locale: 'it_IT',
        siteName: 'Concoro',
        url: '/concorsi',
    },
};

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

export async function generateMetadata({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
    const params = await searchParams;
    const hasSearchVariant = Object.entries(params).some(([key, value]) => {
        if (!value) return false;
        if (key === 'page') return value !== '1';
        if (key === 'sort') return value !== 'scadenza';
        if (key === 'stato') return value !== 'aperti';
        return true;
    });

    if (!hasSearchVariant) {
        return metadata;
    }

    return {
        ...metadata,
        robots: {
            index: false,
            follow: true,
        },
        alternates: {
            canonical: '/concorsi',
        },
    };
}

const FREE_VISIBLE = 5;
const LIMIT = 20;

const FAQ_ITEMS = [
    {
        q: 'Quando conviene usare questa pagina?',
        a: 'Questa pagina ti serve quando vuoi vedere il quadro completo dei concorsi pubblici attivi in Italia. E il punto di partenza giusto se non sai ancora dove concentrarti oppure vuoi confrontare piu territori, enti o settori prima di restringere la ricerca.',
    },
    {
        q: 'Come faccio a restringere i risultati senza perdere tempo?',
        a: 'Parti da stato e scadenza, poi aggiungi regione o provincia se per te conta la zona. Se invece sai gia dove vuoi lavorare, puoi filtrare per ente o per settore e arrivare molto piu in fretta ai bandi davvero pertinenti.',
    },
    {
        q: 'Questa pagina aiuta anche a non perdere nuove opportunita?',
        a: 'Si. Puoi ordinare i risultati per scadenza o per pubblicazione recente, salvare le ricerche piu utili e tornare facilmente sui filtri che usi piu spesso. In questo modo il monitoraggio diventa piu semplice e costante.',
    },
    {
        q: 'Posso fidarmi dei risultati prima di candidarmi?',
        a: 'Concoro ti aiuta a trovare e organizzare i bandi piu velocemente, ma prima di candidarti conviene sempre controllare il testo completo del bando e i dettagli pubblicati sui canali ufficiali dell&apos;ente.',
    },
];

export default async function ConcorsiPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const page = parseInt(params.page ?? '1', 10);

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
    const tier = await getUserTier(supabase);
    const resultsLimit = tier === 'anon' ? FREE_VISIBLE : LIMIT;
    const { data: concorsi, count } = await getConcorsi(supabase, filters, page, resultsLimit);
    const [profile, regioniWithCount, provinceWithCount, settoriWithCount] = await Promise.all([
        user ? getUserProfile(supabase, user.id) : Promise.resolve(null),
        getRegioniWithCount(supabase),
        getProvinceWithCount(supabase),
        getSettoriWithCount(supabase),
    ]);
    const totalPages = Math.ceil((count ?? 0) / LIMIT);

    const isLocked = tier !== 'pro' && tier !== 'admin';
    const showPaywall = isLocked && (page > 1 || (count ?? 0) > FREE_VISIBLE);

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

    const topRegioni = [...regioniWithCount]
        .sort((a, b) => b.count - a.count || a.regione.localeCompare(b.regione))
        .slice(0, 10);
    const topProvince = [...provinceWithCount]
        .sort((a, b) => b.count - a.count || a.provincia.localeCompare(b.provincia))
        .slice(0, 11);
    const topSettori = [...settoriWithCount]
        .sort((a, b) => b.count - a.count || a.settore.localeCompare(b.settore))
        .slice(0, 5);

    const appUrl = getServerAppUrl();
    const pageUrl = `${appUrl}/concorsi`;
    const normalizedCount = count ?? 0;

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: appUrl },
            { '@type': 'ListItem', position: 2, name: 'Concorsi', item: pageUrl },
        ],
    };

    const pageJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Concorsi pubblici in Italia',
        url: pageUrl,
        inLanguage: 'it-IT',
        description: 'Archivio nazionale Concoro per esplorare bandi e concorsi pubblici in Italia con filtri per territorio, settore, ente e scadenza.',
        isPartOf: {
            '@type': 'WebSite',
            name: 'Concoro',
            url: appUrl,
        },
        about: {
            '@type': 'Thing',
            name: 'Concorsi pubblici',
        },
    };

    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Elenco concorsi pubblici nazionali',
        itemListElement: (concorsi ?? []).slice(0, 20).map((concorso, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: concorso.titolo_breve || concorso.titolo,
            url: concorso.slug ? `${appUrl}/concorsi/${concorso.slug}` : pageUrl,
        })),
    };

    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
    };

    return (
        <div className="relative overflow-hidden bg-[hsl(210,55%,98%)] text-slate-900 [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 8% 9%, rgba(18,65,108,0.16), transparent 37%), radial-gradient(circle at 92% 12%, rgba(220,38,38,0.1), transparent 33%), repeating-linear-gradient(90deg, rgba(10,53,91,0.04) 0 1px, transparent 1px 84px)',
                }}
            />

            <div className="relative border-b border-slate-200 bg-white/85">
                <div className="container mx-auto max-w-[78rem] px-4 py-3 text-sm text-slate-500">
                    <nav className="flex flex-wrap items-center gap-2">
                        <Link href="/" className="hover:text-slate-900">Home</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-slate-900">Concorsi</span>
                    </nav>
                </div>
            </div>

            <header className="relative px-4 pb-12 pt-10 md:pb-16">
                <div className="container mx-auto grid max-w-[78rem] gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-slate-700">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Archivio nazionale Concoro
                        </div>

                        <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] max-w-4xl text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-slate-900 md:text-6xl">
                            Tutti i
                            <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                concorsi pubblici
                            </span>
                            in una sola vista, da filtrare come serve a te.
                        </h1>

                        <p className="max-w-3xl text-base leading-relaxed text-slate-700 md:text-lg">
                            Qui trovi un archivio nazionale dei bandi pubblici: utile se vuoi partire largo, confrontare piu aree
                            e poi restringere la ricerca per territorio, ente, settore o scadenza.
                        </p>

                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/regione"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                <MapPin className="h-3.5 w-3.5" />
                                Esplora per regione
                            </Link>
                            <Link
                                href="/provincia"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                <Compass className="h-3.5 w-3.5" />
                                Esplora per provincia
                            </Link>
                            <Link
                                href="/settore"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                <ListFilter className="h-3.5 w-3.5" />
                                Esplora per settore
                            </Link>
                        </div>
                    </div>

                    <aside className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_14px_46px_-28px_rgba(15,23,42,0.35)]">
                        <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-emerald-500 via-white to-rose-500" />
                        <div className="space-y-5 pl-3">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
                                <Sparkles className="h-3.5 w-3.5" />
                                Preferenze intelligenti
                            </p>
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-2xl text-slate-900">
                                Configura una ricerca ricorrente
                            </h2>
                            <p className="text-sm leading-relaxed text-slate-600">
                                Salva combinazioni frequenti e applicale con un click, cosi riduci il tempo necessario per trovare bandi rilevanti.
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Risultati tracciati</p>
                                    <p className="mt-1 text-xl font-semibold text-slate-900">{normalizedCount}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Regioni monitorate</p>
                                    <p className="mt-1 text-xl font-semibold text-slate-900">{regioniWithCount.length}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Province coperte</p>
                                    <p className="mt-1 text-xl font-semibold text-slate-900">{provinceWithCount.length}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Settori attivi</p>
                                    <p className="mt-1 text-xl font-semibold text-slate-900">{settoriWithCount.length}</p>
                                </div>
                            </div>
                            <Link
                                href="/scadenza"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B4B7F] hover:text-[#083861]"
                            >
                                Vai al monitoraggio scadenze
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </aside>
                </div>
            </header>

            <div className="relative container mx-auto max-w-[78rem] space-y-12 px-4 pb-14">
                <section className="grid gap-4 md:grid-cols-3">
                    <article className="rounded-3xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <MapPin className="h-4 w-4 text-[#0A4E88]" />
                                Regioni da esplorare
                            </h2>
                            <Link href="/regione" className="text-xs font-semibold text-[#0A4E88] hover:text-[#07365E]">Vedi tutte</Link>
                        </div>
                        <div className="mt-4 flex max-h-[300px] flex-wrap content-start gap-2 overflow-y-auto pr-1">
                            {topRegioni.map((item) => (
                                <Link
                                    key={item.regione}
                                    href={`/regione/${toUrlSlug(item.regione)}`}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                                >
                                    {item.regione} ({item.count})
                                </Link>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-3xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <Compass className="h-4 w-4 text-[#0A4E88]" />
                                Province attive
                            </h2>
                            <Link href="/provincia" className="text-xs font-semibold text-[#0A4E88] hover:text-[#07365E]">Vedi tutte</Link>
                        </div>
                        <div className="mt-4 flex max-h-[300px] flex-wrap content-start gap-2 overflow-y-auto pr-1">
                            {topProvince.map((item) => (
                                <Link
                                    key={item.provincia}
                                    href={`/provincia/${toUrlSlug(item.provincia)}`}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                                >
                                    {item.provincia} ({item.count})
                                </Link>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-3xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <Landmark className="h-4 w-4 text-[#0A4E88]" />
                                Settori ad alta domanda
                            </h2>
                            <Link href="/settore" className="text-xs font-semibold text-[#0A4E88] hover:text-[#07365E]">Vedi tutte</Link>
                        </div>
                        <div className="mt-4 flex max-h-[300px] flex-wrap content-start gap-2 overflow-y-auto pr-1">
                            {topSettori.map((item) => (
                                <Link
                                    key={item.settore}
                                    href={`/settore/${toUrlSlug(item.settore)}`}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                                >
                                    {item.settore} ({item.count})
                                </Link>
                            ))}
                        </div>
                    </article>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 md:p-7">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Filtri attivi</p>
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-1 text-3xl tracking-tight text-slate-900">
                                Selezione concorsi nazionali
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-sm text-slate-600">
                                {normalizedCount} risultati disponibili
                            </p>
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

                    <div className="mt-6">
                        <ConcorsoList concorsi={visibleResults} />
                    </div>
                </section>

                {showPaywall && (
                    <section className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6">
                        <BlurredResultsSection
                            concorsi={tier === 'anon' ? [] : (lockedResults.length > 0 ? lockedResults : (concorsi?.slice(0, 3) ?? []))}
                            lockedCount={Math.max(0, (count ?? 0) - (page === 1 ? FREE_VISIBLE : 0))}
                            isLoggedIn={tier !== 'anon'}
                            useMockResults={tier === 'anon'}
                        />
                    </section>
                )}

                {!showPaywall && totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {page > 1 && (
                            <Link
                                href={buildPageUrl(page - 1)}
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Precedente
                            </Link>
                        )}
                        <span className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-600">
                            Pagina {page} di {totalPages}
                        </span>
                        {page < totalPages && (
                            <Link
                                href={buildPageUrl(page + 1)}
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                            >
                                Successiva
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                )}

                <section className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 md:grid-cols-[1.25fr_0.75fr] md:p-8">
                    <div>
                        <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-2xl text-slate-900 md:text-3xl">
                            Come usare al meglio l&apos;archivio nazionale
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
                            Questa pagina funziona bene come punto di partenza: ti aiuta a capire dove ci sono piu opportunita,
                            quali enti pubblicano piu spesso e quali settori meritano attenzione. Quando hai individuato una direzione,
                            puoi passare ai percorsi dedicati per lavorare su una ricerca piu precisa e piu facile da seguire nel tempo.
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <Link
                                href="/regione"
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white"
                            >
                                Vai alle regioni
                            </Link>
                            <Link
                                href="/provincia"
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white"
                            >
                                Vai alle province
                            </Link>
                            <Link
                                href="/settore"
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white"
                            >
                                Vai ai settori
                            </Link>
                            <Link
                                href="/ente"
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white"
                            >
                                Vai agli enti
                            </Link>
                        </div>
                    </div>
                    <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.11em] text-slate-500">FAQ</h3>
                        <div className="mt-3 space-y-2">
                            {FAQ_ITEMS.map((item) => (
                                <details key={item.q} className="group rounded-xl border border-slate-200 bg-white p-3">
                                    <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">{item.q}</summary>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
                                </details>
                            ))}
                        </div>
                    </aside>
                </section>
            </div>
        </div>
    );
}
