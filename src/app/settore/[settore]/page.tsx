import type { Metadata } from 'next';
import Link from 'next/link';
import {
    BriefcaseBusiness,
    Building2,
    ChevronLeft,
    ChevronRight,
    Compass,
    Filter,
    ListFilter,
    MapPin,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { createCachedPublicClient, createStaticClient } from '@/lib/supabase/server';
import { getConcorsi, getSettoriWithCount } from '@/lib/supabase/queries';
import { getServerAppUrl } from '@/lib/auth/url';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import { BlurredResultsSection } from '@/components/paywall/PaywallBanner';
import { EnteComboboxFilter } from '@/components/regione/EnteComboboxFilter';
import { toUrlSlug } from '@/lib/utils/regioni';
import type { ConcorsoFilters } from '@/types/concorso';

const FREE_VISIBLE = 5;
const LIMIT = 20;
const FACET_SCAN_LIMIT = 260;

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
        q: 'Come trovare velocemente concorsi nel mio settore?',
        a: 'Parti da questa pagina di settore e restringi subito per regione o ente. In questo modo vedi prima i bandi piu vicini al tuo profilo e alle aree in cui vuoi candidarti.',
    },
    {
        q: 'Posso usare questa pagina anche se il settore e molto ampio?',
        a: 'Si. Quando il settore include profili diversi, i filtri per territorio ed ente ti aiutano a separare meglio le opportunita e a leggere solo quelle davvero rilevanti.',
    },
    {
        q: 'I bandi mostrati qui sono adatti al monitoraggio continuo?',
        a: 'Si. Questa pagina ti permette di tornare su uno stesso ambito professionale, controllare nuove uscite, seguire le scadenze e capire quali enti pubblicano piu spesso.',
    },
];

interface Props {
    params: Promise<{ settore: string }>;
    searchParams: Promise<{
        stato?: string;
        sort?: string;
        regione?: string;
        ente_slug?: string;
        page?: string;
    }>;
}

type ParsedRegione = {
    regione?: {
        denominazione?: string;
    };
    denominazione?: string;
    nome?: string;
};

function parseRegioneName(raw: string): string | null {
    try {
        const parsed = JSON.parse(raw) as ParsedRegione;
        return parsed.regione?.denominazione ?? parsed.denominazione ?? parsed.nome ?? null;
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
    const supabase = createStaticClient();
    const settori = await getSettoriWithCount(supabase);
    return settori.map(({ settore }) => ({
        settore: toUrlSlug(settore),
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { settore: slug } = await params;
    const supabase = createStaticClient();
    const settori = await getSettoriWithCount(supabase);
    const originalSettore = settori.find((item) => toUrlSlug(item.settore) === slug)?.settore;

    if (!originalSettore) {
        return {
            title: 'Settore non trovato | Concoro',
            description: 'Il settore richiesto non e disponibile su Concoro.',
        };
    }

    const canonical = `${getServerAppUrl()}/settore/${slug}`;

    return {
        title: `Concorsi pubblici nel settore ${originalSettore} | Concoro`,
        description: `Trova concorsi pubblici nel settore ${originalSettore} e restringi la ricerca per regione, ente e stato del bando. Una pagina utile per orientarti meglio tra opportunita nazionali e locali.`,
        keywords: [
            `concorsi settore ${originalSettore}`,
            `bandi ${originalSettore}`,
            `concorsi pubblici ${originalSettore}`,
            `enti ${originalSettore}`,
            `opportunita ${originalSettore}`,
        ],
        alternates: {
            canonical,
        },
        openGraph: {
            title: `Concorsi pubblici nel settore ${originalSettore}`,
            description: `Bandi e opportunita nel settore ${originalSettore}, organizzati per regione, ente e stato per aiutarti a trovare prima i concorsi piu pertinenti.`,
            url: canonical,
            locale: 'it_IT',
            siteName: 'Concoro',
        },
    };
}

export const revalidate = 3600;

export default async function SettorePage({ params, searchParams }: Props) {
    const { settore: slug } = await params;

    const supabase = createCachedPublicClient({ revalidate, tags: ['public:settore-detail'] });
    const settori = await getSettoriWithCount(supabase);
    const originalSettore = settori.find((item) => toUrlSlug(item.settore) === slug)?.settore;

    if (!originalSettore) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <p className="text-lg font-semibold text-slate-900">Settore non trovato.</p>
                <Link href="/settore" className="mt-4 inline-flex text-sm font-semibold text-[#0A4E88] hover:underline">
                    Torna alla lista settori
                </Link>
            </div>
        );
    }

    const paramsObj = await searchParams;
    const stato = sanitizeStato(paramsObj.stato);
    const sort = sanitizeSort(paramsObj.sort);
    const regione = paramsObj.regione || '';
    const enteSlug = paramsObj.ente_slug || '';
    const page = clampPage(paramsObj.page);

    const baseSettoreFilters: ConcorsoFilters = {
        settore: originalSettore,
        stato,
        sort,
        solo_attivi: stato === 'aperti' ? true : undefined,
    };

    const selectedFilters: ConcorsoFilters = {
        ...baseSettoreFilters,
        regione: regione || undefined,
        ente_slug: enteSlug || undefined,
    };

    const tier = 'anon' as const;
    const resultsLimit = FREE_VISIBLE;

    const [sectorData, baseSectorData, openSnapshot, closedSnapshot] = await Promise.all([
        getConcorsi(supabase, selectedFilters, page, resultsLimit),
        getConcorsi(supabase, baseSettoreFilters, 1, FACET_SCAN_LIMIT),
        getConcorsi(supabase, { settore: originalSettore, stato: 'aperti', solo_attivi: true }, 1, 1),
        getConcorsi(supabase, { settore: originalSettore, stato: 'scaduti' }, 1, 1),
    ]);

    const nowTs = Date.now();
    const concorsiRaw = sectorData.data ?? [];
    const concorsi = stato === 'tutti'
        ? [...concorsiRaw].sort((a, b) => {
            const aTs = a.data_scadenza ? Date.parse(a.data_scadenza) : Number.NaN;
            const bTs = b.data_scadenza ? Date.parse(b.data_scadenza) : Number.NaN;
            const aOpen = Number.isFinite(aTs) ? aTs >= nowTs : Boolean(a.is_active);
            const bOpen = Number.isFinite(bTs) ? bTs >= nowTs : Boolean(b.is_active);
            if (aOpen !== bOpen) return aOpen ? -1 : 1;
            if (sort === 'recenti') {
                const aPub = a.data_pubblicazione ? Date.parse(a.data_pubblicazione) : Number.NaN;
                const bPub = b.data_pubblicazione ? Date.parse(b.data_pubblicazione) : Number.NaN;
                if (Number.isFinite(aPub) && Number.isFinite(bPub)) return bPub - aPub;
                if (Number.isFinite(aPub)) return -1;
                if (Number.isFinite(bPub)) return 1;
                return 0;
            }
            if (sort === 'posti') return (b.num_posti ?? -1) - (a.num_posti ?? -1);
            if (Number.isFinite(aTs) && Number.isFinite(bTs)) return aOpen ? (aTs - bTs) : (bTs - aTs);
            if (Number.isFinite(aTs)) return -1;
            if (Number.isFinite(bTs)) return 1;
            return 0;
        })
        : concorsiRaw;
    const count = sectorData.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(count / LIMIT));

    const isLocked = true;
    const showPaywall = isLocked && (page > 1 || count > FREE_VISIBLE);
    const isOpenConcorso = (item: typeof concorsi[number]) => {
        if (!item.data_scadenza) return Boolean(item.is_active);
        const deadline = Date.parse(item.data_scadenza);
        if (!Number.isFinite(deadline)) return Boolean(item.is_active);
        return deadline >= nowTs;
    };
    const openConcorsi = concorsi.filter(isOpenConcorso);
    const visibleResults = showPaywall
        ? (page === 1
            ? (stato === 'tutti' ? openConcorsi.slice(0, FREE_VISIBLE) : concorsi.slice(0, FREE_VISIBLE))
            : [])
        : concorsi;
    const visibleIds = new Set(visibleResults.map((item) => item.concorso_id).filter(Boolean));
    const lockedResults = showPaywall && page === 1
        ? concorsi.filter((item) => !visibleIds.has(item.concorso_id))
        : [];

    const facetSource = baseSectorData.data ?? [];
    const regioneCounts = new Map<string, number>();
    const enteCounts = new Map<string, { name: string; count: number }>();

    for (const concorso of facetSource) {
        for (const item of concorso.regioni_array ?? []) {
            const regioneName = parseRegioneName(item);
            if (!regioneName) continue;
            regioneCounts.set(regioneName, (regioneCounts.get(regioneName) ?? 0) + 1);
        }

        if (concorso.ente_slug && concorso.ente_nome) {
            const existing = enteCounts.get(concorso.ente_slug);
            enteCounts.set(concorso.ente_slug, {
                name: concorso.ente_nome,
                count: (existing?.count ?? 0) + 1,
            });
        }
    }

    const topRegioni = Array.from(regioneCounts.entries())
        .map(([label, value]) => ({ label, value, slug: toUrlSlug(label) }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
        .slice(0, 10);

    const topEnti = Array.from(enteCounts.entries())
        .map(([slugValue, item]) => ({ slug: slugValue, name: item.name, count: item.count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 18);

    const entiFilterOptions = topEnti
        .map((item) => ({ slug: item.slug, name: item.name, count: item.count }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const activeCount = openSnapshot.count ?? 0;
    const closedCount = closedSnapshot.count ?? 0;

    const appUrl = getServerAppUrl();
    const pageUrl = `${appUrl}/settore/${slug}`;

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: appUrl },
            { '@type': 'ListItem', position: 2, name: 'Settori', item: `${appUrl}/settore` },
            { '@type': 'ListItem', position: 3, name: originalSettore, item: pageUrl },
        ],
    };

    const pageJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Concorsi pubblici nel settore ${originalSettore}`,
        url: pageUrl,
        inLanguage: 'it-IT',
        description: `Elenco dei concorsi pubblici nel settore ${originalSettore}, con filtri per regione, ente e stato del bando.`,
        isPartOf: {
            '@type': 'WebSite',
            name: 'Concoro',
            url: appUrl,
        },
        about: {
            '@type': 'DefinedTerm',
            name: originalSettore,
        },
    };

    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Bandi nel settore ${originalSettore}`,
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

    function buildUrl(next: Partial<Record<'stato' | 'sort' | 'regione' | 'ente_slug' | 'page', string>>) {
        const query = new URLSearchParams();
        const finalStato = next.stato ?? stato;
        const finalSort = next.sort ?? sort;
        const finalRegione = next.regione ?? regione;
        const finalEnte = next.ente_slug ?? enteSlug;
        const finalPage = next.page ?? '1';

        if (finalStato && finalStato !== 'aperti') query.set('stato', finalStato);
        if (finalSort && finalSort !== 'scadenza') query.set('sort', finalSort);
        if (finalRegione) query.set('regione', finalRegione);
        if (finalEnte) query.set('ente_slug', finalEnte);
        if (finalPage !== '1') query.set('page', finalPage);

        const queryString = query.toString();
        return queryString ? `/settore/${slug}?${queryString}` : `/settore/${slug}`;
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
                        'radial-gradient(circle at 11% 14%, rgba(18,65,108,0.17), transparent 36%), radial-gradient(circle at 90% 22%, rgba(16,185,129,0.12), transparent 34%), repeating-linear-gradient(90deg, rgba(10,53,91,0.04) 0 1px, transparent 1px 82px)',
                }}
            />

            <div className="relative border-b border-slate-200 bg-white/85">
                <div className="container mx-auto max-w-[78rem] px-4 py-3 text-sm text-slate-500">
                    <nav className="flex flex-wrap items-center gap-2">
                        <Link href="/" className="hover:text-slate-900">Home</Link>
                        <ChevronRight className="h-4 w-4" />
                        <Link href="/settore" className="hover:text-slate-900">Settori</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-slate-900">{originalSettore}</span>
                    </nav>
                </div>
            </div>

            <header className="relative px-4 pb-12 pt-10 md:pb-16">
                <div className="container mx-auto grid max-w-[78rem] gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-slate-700">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Pagina di settore Concoro
                        </div>

                        <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] max-w-4xl text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-slate-900 md:text-6xl">
                            Trova concorsi pubblici nel settore
                            <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                {originalSettore}
                            </span>
                            senza partire da una lista generica.
                        </h1>

                        <p className="max-w-3xl text-base leading-relaxed text-slate-700 md:text-lg">
                            Qui trovi i bandi del settore {originalSettore} raccolti in un unico punto, con filtri per stato,
                            regione ed ente. E un modo piu diretto per capire dove ci sono opportunita attive e quali aree vale la pena monitorare.
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
                        <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-emerald-500 via-white to-[#0A4E88]" />
                        <div className="space-y-5 pl-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Orientamento tematico</p>
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-2xl text-slate-900">
                                Dove guardare per il settore {originalSettore}
                            </h2>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm leading-relaxed text-slate-700">
                                    Se vuoi iniziare dalle aree con piu movimento, queste sono le regioni che oggi concentrano piu bandi nel settore:
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {topRegioni.length > 0 ? topRegioni.slice(0, 8).map((item) => (
                                        <Link
                                            key={item.label}
                                            href={`/regione/${item.slug}`}
                                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                        >
                                            <MapPin className="h-3.5 w-3.5" />
                                            {item.label} ({item.value})
                                        </Link>
                                    )) : (
                                        <p className="text-xs text-slate-500">Dati regionali non disponibili.</p>
                                    )}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Enti da monitorare</p>
                                <ul className="space-y-2 text-sm text-slate-700">
                                    {topEnti.length > 0 ? topEnti.slice(0, 8).map((ente) => (
                                        <li key={ente.slug} className="flex items-start justify-between gap-2">
                                            <Link href={`/ente/${ente.slug}`} className="line-clamp-1 font-medium hover:text-[#0A4E88]">
                                                {ente.name}
                                            </Link>
                                            <span className="text-xs text-slate-500">{ente.count}</span>
                                        </li>
                                    )) : (
                                        <li className="text-xs text-slate-500">Nessun ente disponibile.</li>
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
                                Filtri di settore
                            </p>
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl tracking-tight text-slate-900">
                                Bandi attivi e archiviati nel settore {originalSettore}
                            </h2>
                            <p className="mt-2 text-sm text-slate-600">
                                {count} risultati per questa area professionale
                                {regione ? ` - regione: ${regione}` : ''}
                                {enteSlug ? ' - ente selezionato' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <details className="group" open={Boolean(stato !== 'aperti' || sort !== 'scadenza' || regione || enteSlug)}>
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
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.09em] text-slate-500">Regione</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                href={buildUrl({ regione: '', page: '1' })}
                                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${!regione
                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                                    }`}
                                            >
                                                Tutte le regioni
                                            </Link>
                                            {topRegioni.map((item) => (
                                                <Link
                                                    key={item.label}
                                                    href={buildUrl({ regione: item.label, page: '1' })}
                                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${regione === item.label
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

                                        <EnteComboboxFilter options={entiFilterOptions} selectedSlug={enteSlug} />
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
                                lockedCount={page === 1 ? Math.max(0, count - visibleResults.length) : count}
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
                        <BriefcaseBusiness className="h-5 w-5 text-[#0A4E88]" />
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">Una ricerca gia centrata sul tuo ambito</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                            Invece di scorrere elenchi troppo ampi, qui trovi solo concorsi legati al settore {originalSettore},
                            cosi fai prima a capire quali bandi meritano attenzione.
                        </p>
                    </article>
                    <article className="rounded-3xl border border-slate-200 bg-white p-6">
                        <Compass className="h-5 w-5 text-[#0A4E88]" />
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">Parti dal territorio, poi stringi sugli enti</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                            Se il settore e ampio, conviene prima scegliere la regione in cui vuoi muoverti e poi vedere quali enti pubblicano di piu.
                            La ricerca diventa subito piu leggibile.
                        </p>
                    </article>
                    <article className="rounded-3xl border border-slate-200 bg-white p-6">
                        <Building2 className="h-5 w-5 text-[#0A4E88]" />
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">Una base chiara per monitorare nel tempo</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                            Usa questa pagina come punto di riferimento per controllare nuove uscite, ordinare per scadenza
                            e seguire gli enti che pubblicano con maggiore continuita.
                        </p>
                    </article>
                </div>
            </section>

            <section className="px-4 pb-14">
                <div className="container mx-auto max-w-[78rem] rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                    <div className="m-2 mb-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Domande frequenti</p>
                        <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-2 text-3xl tracking-tight text-slate-900">
                            Domande utili per chi cerca nel settore {originalSettore}
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
                            href="/settore"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            <BriefcaseBusiness className="h-3.5 w-3.5" />
                            Altri settori
                        </Link>
                        <Link
                            href="/regione"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            <MapPin className="h-3.5 w-3.5" />
                            Esplora regioni
                        </Link>
                        <Link
                            href={`/signup?settore=${encodeURIComponent(originalSettore)}`}
                            className="inline-flex items-center gap-2 rounded-full border border-[#0A4E88]/30 bg-[#0A4E88]/5 px-3 py-1.5 text-xs font-semibold text-[#083861] transition hover:bg-[#0A4E88]/10"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Attiva notifiche di settore
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
