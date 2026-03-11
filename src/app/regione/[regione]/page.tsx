import type { Metadata } from 'next';
import Link from 'next/link';
import {
    Building2,
    ChevronLeft,
    ChevronRight,
    Compass,
    Filter,
    Landmark,
    ListFilter,
    MapPin,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getConcorsi } from '@/lib/supabase/queries';
import { getUserTier } from '@/lib/auth/getUserTier';
import { getServerAppUrl } from '@/lib/auth/url';
import { BlurredResultsSection } from '@/components/paywall/PaywallBanner';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import { EnteComboboxFilter } from '@/components/regione/EnteComboboxFilter';
import { REGIONE_SLUG_MAP, regioneFromSlug, toUrlSlug } from '@/lib/utils/regioni';
import type { ConcorsoFilters } from '@/types/concorso';

const FREE_VISIBLE = 5;
const LIMIT = 20;
const FACET_SCAN_LIMIT = 220;
type StatoFilter = NonNullable<ConcorsoFilters['stato']>;
type SortFilter = NonNullable<ConcorsoFilters['sort']>;

const STATO_OPTIONS: Array<{ value: StatoFilter; label: string }> = [
    { value: 'aperti', label: 'Aperti' },
    { value: 'scaduti', label: 'Scaduti' },
    { value: 'tutti', label: 'Tutti' },
];

const SORT_OPTIONS: Array<{ value: SortFilter; label: string }> = [
    { value: 'scadenza', label: 'Scadenza' },
    { value: 'recenti', label: 'Recenti' },
    { value: 'posti', label: 'Posti' },
];

const FAQ_ITEMS = [
    {
        q: 'Come trovare concorsi pubblici in una regione specifica?',
        a: 'Apri la pagina della tua regione e filtra per stato, settore ed ente. In questo modo parti dal territorio e arrivi piu in fretta ai bandi davvero rilevanti per la tua zona.',
    },
    {
        q: 'I concorsi in questa pagina sono aggiornati?',
        a: 'La pagina riflette i bandi organizzati da Concoro per territorio, ente e scadenza. Prima di candidarti conviene comunque verificare sempre i dettagli sul bando ufficiale.',
    },
    {
        q: 'Questa pagina serve anche per capire dove cercare nella regione?',
        a: 'Si. Oltre ai bandi attivi, trovi province ed enti utili per capire dove conviene concentrare la ricerca nella regione selezionata.',
    },
];

interface Props {
    params: Promise<{ regione: string }>;
    searchParams: Promise<{
        stato?: string;
        sort?: string;
        settore?: string;
        ente_slug?: string;
        page?: string;
    }>;
}

type ParsedProvincia = {
    provincia?: {
        denominazione?: string;
        sigla?: string;
    };
    denominazione?: string;
    sigla?: string;
};

function parseProvinciaName(raw: string): string | null {
    try {
        const parsed = JSON.parse(raw) as ParsedProvincia;
        return parsed.provincia?.denominazione ?? parsed.denominazione ?? null;
    } catch {
        return null;
    }
}

function clampPage(rawPage: string | undefined): number {
    const parsed = Number.parseInt(rawPage ?? '1', 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return parsed;
}

function sanitizeStato(raw: string | undefined): StatoFilter {
    return STATO_OPTIONS.some((item) => item.value === raw) ? (raw as StatoFilter) : 'aperti';
}

function sanitizeSort(raw: string | undefined): SortFilter {
    return SORT_OPTIONS.some((item) => item.value === raw) ? (raw as SortFilter) : 'scadenza';
}

export async function generateStaticParams() {
    return Object.keys(REGIONE_SLUG_MAP).map((regione) => ({ regione }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { regione: slug } = await params;
    const regioneName = regioneFromSlug(slug);
    if (!regioneName) return { title: 'Regione non trovata' };
    const canonical = `${getServerAppUrl()}/regione/${slug}`;

    return {
        title: `Concorsi pubblici in ${regioneName} | Bandi per regione | Concoro`,
        description: `Trova i concorsi pubblici in ${regioneName} e filtra i bandi per ente, settore e scadenza. Una pagina utile per cercare opportunita vicine e orientarti meglio nel territorio.`,
        keywords: [
            `concorsi ${regioneName}`,
            `concorsi pubblici ${regioneName}`,
            `bandi ${regioneName}`,
            `enti pubblici ${regioneName}`,
            `concorsi per settore ${regioneName}`,
        ],
        alternates: {
            canonical,
        },
        openGraph: {
            title: `Concorsi pubblici in ${regioneName}`,
            description: `Bandi pubblici e opportunita locali in ${regioneName}, organizzati per ente, settore e scadenza per una ricerca piu chiara.`,
            url: canonical,
            locale: 'it_IT',
            siteName: 'Concoro',
        },
    };
}

export const revalidate = 3600;

export default async function RegionePage({ params, searchParams }: Props) {
    const { regione: slug } = await params;
    const regioneName = regioneFromSlug(slug);

    if (!regioneName) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <p className="text-lg font-semibold text-slate-900">Regione non trovata.</p>
                <Link href="/regione" className="mt-4 inline-flex text-sm font-semibold text-[#0A4E88] hover:underline">
                    Torna alla lista regioni
                </Link>
            </div>
        );
    }

    const paramsObj = await searchParams;
    const stato = sanitizeStato(paramsObj.stato);
    const sort = sanitizeSort(paramsObj.sort);
    const settore = paramsObj.settore || '';
    const enteSlug = paramsObj.ente_slug || '';
    const page = clampPage(paramsObj.page);

    const supabase = await createClient();

    const baseRegionalFilters: ConcorsoFilters = {
        regione: regioneName,
        stato,
        sort,
        solo_attivi: stato === 'aperti' ? true : undefined,
    };

    const selectedFilters: ConcorsoFilters = {
        ...baseRegionalFilters,
        settore: settore || undefined,
        ente_slug: enteSlug || undefined,
    };

    const tier = await getUserTier(supabase);
    const resultsLimit = tier === 'anon' ? FREE_VISIBLE : LIMIT;

    const [regionalData, baseRegionalData, openSnapshot, closedSnapshot, entiData] = await Promise.all([
        getConcorsi(supabase, selectedFilters, page, resultsLimit),
        getConcorsi(supabase, baseRegionalFilters, 1, FACET_SCAN_LIMIT),
        getConcorsi(supabase, { regione: regioneName, stato: 'aperti', solo_attivi: true }, 1, 1),
        getConcorsi(supabase, { regione: regioneName, stato: 'scaduti' }, 1, 1),
        supabase
            .from('enti')
            .select('ente_nome, ente_slug, provincia, comune')
            .eq('regione', regioneName)
            .not('ente_slug', 'is', null)
            .order('ente_nome', { ascending: true })
            .limit(80),
    ]);

    const concorsi = regionalData.data ?? [];
    const count = regionalData.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(count / LIMIT));
    const isLocked = tier !== 'pro' && tier !== 'admin';
    const showPaywall = isLocked && (page > 1 || count > FREE_VISIBLE);
    const visibleResults = showPaywall && page === 1 ? concorsi.slice(0, FREE_VISIBLE) : (showPaywall ? [] : concorsi);
    const lockedResults = showPaywall && page === 1 ? concorsi.slice(FREE_VISIBLE) : [];

    const facetSource = baseRegionalData.data ?? [];
    const settoreCounts = new Map<string, number>();
    const enteCounts = new Map<string, { name: string; count: number }>();
    const provinciaCounts = new Map<string, number>();

    for (const concorso of facetSource) {
        for (const item of concorso.settori ?? []) {
            if (!item) continue;
            settoreCounts.set(item, (settoreCounts.get(item) ?? 0) + 1);
        }
        if (concorso.ente_slug && concorso.ente_nome) {
            const existing = enteCounts.get(concorso.ente_slug);
            enteCounts.set(concorso.ente_slug, {
                name: concorso.ente_nome,
                count: (existing?.count ?? 0) + 1,
            });
        }
        for (const item of concorso.province_array ?? []) {
            const provinciaName = parseProvinciaName(item);
            if (!provinciaName) continue;
            provinciaCounts.set(provinciaName, (provinciaCounts.get(provinciaName) ?? 0) + 1);
        }
    }

    const topSettori = Array.from(settoreCounts.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
        .slice(0, 10);

    const entiFilterOptions = (entiData.data ?? [])
        .map((ente) => {
            if (!ente.ente_slug) return null;
            const fromConcorso = enteCounts.get(ente.ente_slug);
            return {
                slug: ente.ente_slug,
                name: ente.ente_nome ?? '',
                count: fromConcorso?.count ?? 0,
            };
        })
        .filter((item): item is { slug: string; name: string; count: number } => Boolean(item && item.slug && item.name))
        .sort((a, b) => a.name.localeCompare(b.name));

    const topProvince = Array.from(provinciaCounts.entries())
        .map(([name, value]) => ({ name, value, slug: toUrlSlug(name) }))
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
        .slice(0, 8);

    const activeCount = openSnapshot.count ?? 0;
    const closedCount = closedSnapshot.count ?? 0;
    const entiInRegione = [...(entiData.data ?? [])]
        .sort(() => Math.random() - 0.5)
        .slice(0, 8);

    const appUrl = getServerAppUrl();
    const pageUrl = `${appUrl}/regione/${slug}`;

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: appUrl },
            { '@type': 'ListItem', position: 2, name: 'Regioni', item: `${appUrl}/regione` },
            { '@type': 'ListItem', position: 3, name: regioneName, item: pageUrl },
        ],
    };

    const pageJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Concorsi pubblici in ${regioneName}`,
        url: pageUrl,
        inLanguage: 'it-IT',
        description: `Elenco dei concorsi pubblici in ${regioneName} con filtri per stato, settore ed ente, pensato per chi cerca bandi vicini e vuole orientarsi in fretta.`,
        isPartOf: {
            '@type': 'WebSite',
            name: 'Concoro',
            url: appUrl,
        },
        about: {
            '@type': 'AdministrativeArea',
            name: regioneName,
        },
    };

    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Bandi in ${regioneName}`,
        itemListElement: concorsi.slice(0, 20).map((concorso, index) => ({
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

    function buildUrl(next: Partial<Record<'stato' | 'sort' | 'settore' | 'ente_slug' | 'page', string>>) {
        const query = new URLSearchParams();
        const finalStato = next.stato ?? stato;
        const finalSort = next.sort ?? sort;
        const finalSettore = next.settore ?? settore;
        const finalEnte = next.ente_slug ?? enteSlug;
        const finalPage = next.page ?? '1';

        if (finalStato && finalStato !== 'aperti') query.set('stato', finalStato);
        if (finalSort && finalSort !== 'scadenza') query.set('sort', finalSort);
        if (finalSettore) query.set('settore', finalSettore);
        if (finalEnte) query.set('ente_slug', finalEnte);
        if (finalPage !== '1') query.set('page', finalPage);

        const queryString = query.toString();
        return queryString ? `/regione/${slug}?${queryString}` : `/regione/${slug}`;
    }

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
                        'radial-gradient(circle at 9% 8%, rgba(18,65,108,0.16), transparent 36%), radial-gradient(circle at 92% 16%, rgba(220,38,38,0.1), transparent 34%), repeating-linear-gradient(90deg, rgba(10,53,91,0.04) 0 1px, transparent 1px 82px)',
                }}
            />

            <div className="relative border-b border-slate-200 bg-white/85">
                <div className="container mx-auto max-w-[78rem] px-4 py-3 text-sm text-slate-500">
                    <nav className="flex flex-wrap items-center gap-2">
                        <Link href="/" className="hover:text-slate-900">Home</Link>
                        <ChevronRight className="h-4 w-4" />
                        <Link href="/regione" className="hover:text-slate-900">Regioni</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-slate-900">{regioneName}</span>
                    </nav>
                </div>
            </div>

            <header className="relative px-4 pb-12 pt-10 md:pb-16">
                <div className="container mx-auto grid max-w-[78rem] gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-slate-700">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Pagina regionale Concoro
                        </div>

                        <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] max-w-4xl text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-slate-900 md:text-6xl">
                            Cerca i concorsi pubblici in
                            <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                {regioneName}
                            </span>
                            con un percorso piu chiaro.
                        </h1>

                        <p className="max-w-3xl text-base leading-relaxed text-slate-700 md:text-lg">
                            Se vuoi capire quali bandi seguire in {regioneName}, qui trovi una vista locale piu leggibile:
                            concorsi filtrabili per ente, settore e stato, con accesso rapido alle province e agli enti da monitorare per primi.
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white/85 p-4">
                                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Aperti</p>
                                <p className="mt-1 text-3xl font-semibold text-slate-900">{activeCount}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white/85 p-4">
                                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Scaduti</p>
                                <p className="mt-1 text-3xl font-semibold text-slate-900">{closedCount}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="#risultati"
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Vai ai risultati
                                <ListFilter className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/concorsi"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                            >
                                Tutti i concorsi nazionali
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    <aside className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_14px_44px_-30px_rgba(15,23,42,0.45)]">
                        <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-emerald-500 via-white to-rose-500" />
                        <div className="space-y-5 pl-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Orientamento territoriale</p>
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-2xl text-slate-900">
                                Da dove iniziare in {regioneName}
                            </h2>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm leading-relaxed text-slate-700">
                                    Province da aprire per prime se vuoi restringere la ricerca e capire dove si concentrano piu opportunita nella regione:
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {topProvince.length > 0 ? topProvince.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={`/provincia/${item.slug}`}
                                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                        >
                                            <MapPin className="h-3.5 w-3.5" />
                                            {item.name} ({item.value})
                                        </Link>
                                    )) : (
                                        <p className="text-xs text-slate-500">Dati provincia non disponibili.</p>
                                    )}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Enti da monitorare</p>
                                <ul className="space-y-2 text-sm text-slate-700">
                                    {entiInRegione.length > 0 ? entiInRegione.map((ente) => (
                                        <li key={ente.ente_slug} className="flex items-start justify-between gap-2">
                                            <Link href={`/ente/${ente.ente_slug}`} className="line-clamp-1 font-medium hover:text-[#0A4E88]">
                                                {ente.ente_nome}
                                            </Link>
                                            <span className="text-xs text-slate-500">
                                                {[ente.comune, ente.provincia].filter(Boolean).join(', ') || '-'}
                                            </span>
                                        </li>
                                    )) : (
                                        <li className="text-xs text-slate-500">Nessun ente locale disponibile.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </aside>
                </div>
            </header>

            <section id="risultati" className="px-4 pb-14">
                <div className="container mx-auto max-w-[78rem] rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                    <div className="m-2 mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                                <Filter className="h-3.5 w-3.5" />
                                Filtri regionali
                            </p>
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl tracking-tight text-slate-900">
                                Bandi e opportunita in {regioneName}
                            </h2>
                            <p className="mt-2 text-sm text-slate-600">
                                {count} risultati nella pagina regionale
                                {settore ? ` - settore: ${settore}` : ''}
                                {enteSlug ? ` - ente selezionato` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <details className="group" open={Boolean(stato !== 'aperti' || sort !== 'scadenza' || settore || enteSlug)}>
                            <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                                    <ListFilter className="h-4 w-4 text-[#0A4E88]" />
                                    Filtri avanzati
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 transition group-open:rotate-180">
                                    ⌄
                                </span>
                            </summary>

                            <div className="mt-4 space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="mr-1 text-xs font-semibold uppercase tracking-[0.09em] text-slate-500">Stato</p>
                                    {STATO_OPTIONS.map((item) => (
                                        <Link
                                            key={item.value}
                                            href={buildUrl({ stato: item.value, page: '1' })}
                                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${stato === item.value
                                                ? 'border-[#0A4E88]/40 bg-[#0A4E88] text-white'
                                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                                }`}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>

                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.09em] text-slate-500">Settore</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                href={buildUrl({ settore: '', page: '1' })}
                                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${!settore
                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                                    }`}
                                            >
                                                Tutti i settori
                                            </Link>
                                            {topSettori.map((item) => (
                                                <Link
                                                    key={item.label}
                                                    href={buildUrl({ settore: item.label, page: '1' })}
                                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${settore === item.label
                                                        ? 'border-[#0A4E88]/40 bg-[#0A4E88] text-white'
                                                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    {item.label} ({item.value})
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.09em] text-slate-500">Ordina</p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {SORT_OPTIONS.map((item) => (
                                                    <Link
                                                        key={item.value}
                                                        href={buildUrl({ sort: item.value, page: '1' })}
                                                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${sort === item.value
                                                            ? 'border-slate-900 bg-slate-900 text-white'
                                                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        {item.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                        <EnteComboboxFilter
                                            options={entiFilterOptions}
                                            selectedSlug={enteSlug}
                                        />
                                    </div>
                                </div>
                            </div>
                        </details>
                    </div>

                    <div className="mt-6">
                        <ConcorsoList concorsi={visibleResults} />
                    </div>

                    {showPaywall && (
                        <div className="mt-8">
                            <BlurredResultsSection
                                concorsi={tier === 'anon' ? [] : (lockedResults.length > 0 ? lockedResults : concorsi.slice(0, 3))}
                                lockedCount={Math.max(0, count - (page === 1 ? FREE_VISIBLE : 0))}
                                isLoggedIn={tier !== 'anon'}
                                useMockResults={tier === 'anon'}
                            />
                        </div>
                    )}

                    {!showPaywall && totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            {page > 1 && (
                                <Link
                                    href={buildUrl({ page: String(page - 1) })}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Precedente
                                </Link>
                            )}
                            <span className="px-4 text-sm text-slate-600">
                                Pagina {page} di {totalPages}
                            </span>
                            {page < totalPages && (
                                <Link
                                    href={buildUrl({ page: String(page + 1) })}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    Successiva
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <section className="px-4 pb-14">
                <div className="container mx-auto grid max-w-[78rem] gap-6 lg:grid-cols-3">
                    <article className="rounded-3xl border border-slate-200 bg-white p-6">
                        <Landmark className="h-5 w-5 text-[#0A4E88]" />
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">Cerca per territorio, non solo per titolo</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                            Chi cerca concorsi pubblici in una regione spesso parte dalla vicinanza. Qui puoi usare il territorio
                            come primo filtro e poi restringere il campo in base all&apos;ente o al settore che ti interessa davvero.
                        </p>
                    </article>
                    <article className="rounded-3xl border border-slate-200 bg-white p-6">
                        <Compass className="h-5 w-5 text-[#0A4E88]" />
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">Trova subito l&apos;ente che ti interessa</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                            Se hai gia in mente un comune, un&apos;azienda sanitaria o un altro ente pubblico, ti basta digitare il nome
                            per arrivare subito ai bandi collegati senza scorrere liste inutili.
                        </p>
                    </article>
                    <article className="rounded-3xl border border-slate-200 bg-white p-6">
                        <Building2 className="h-5 w-5 text-[#0A4E88]" />
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">Una vista regionale piu utile da consultare</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                            La pagina non mostra solo un elenco. Ti aiuta a capire dove cercare, quali enti seguire e quali
                            percorsi locali aprire per continuare la ricerca senza ripartire ogni volta da zero.
                        </p>
                    </article>
                </div>
            </section>

            <section className="px-4 pb-14">
                <div className="container mx-auto max-w-[78rem] rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                    <div className="m-2 mb-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Domande frequenti</p>
                        <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-2 text-3xl tracking-tight text-slate-900">
                            Domande utili sui concorsi in {regioneName}
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {FAQ_ITEMS.map((item) => (
                            <article key={item.q} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <h3 className="text-sm font-semibold text-slate-900">{item.q}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
                            </article>
                        ))}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <Link
                            href="/regione"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            <MapPin className="h-3.5 w-3.5" />
                            Altre regioni
                        </Link>
                        <Link
                            href="/ente"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            <Building2 className="h-3.5 w-3.5" />
                            Esplora enti
                        </Link>
                        <Link
                            href={`/signup?regione=${slug}`}
                            className="inline-flex items-center gap-2 rounded-full border border-[#0A4E88]/30 bg-[#0A4E88]/5 px-3 py-1.5 text-xs font-semibold text-[#083861] transition hover:bg-[#0A4E88]/10"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Attiva notifiche regionali
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
