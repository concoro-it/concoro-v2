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
import { createClient, createStaticClient } from '@/lib/supabase/server';
import { getConcorsi, getProvinceWithCount } from '@/lib/supabase/queries';
import { getUserTier } from '@/lib/auth/getUserTier';
import { getServerAppUrl } from '@/lib/auth/url';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import { BlurredResultsSection } from '@/components/paywall/PaywallBanner';
import { EnteComboboxFilter } from '@/components/regione/EnteComboboxFilter';
import { toUrlSlug } from '@/lib/utils/regioni';
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
        q: 'Come trovare concorsi pubblici nella mia provincia?',
        a: 'Parti da questa pagina e filtra per stato, settore ed ente. Cosi passi subito dai risultati generici ai bandi davvero utili nella tua zona.',
    },
    {
        q: 'Questa pagina mi aiuta anche a monitorare le opportunita vicine?',
        a: 'Si. Oltre ai concorsi nella provincia, trovi collegamenti rapidi alla regione di riferimento e ad altre province da tenere d\'occhio se vuoi ampliare la ricerca.',
    },
    {
        q: 'Come capire quali enti seguire con piu attenzione?',
        a: 'Guarda quanti bandi risultano attivi, quali enti pubblicano piu spesso e quali settori ricorrono di piu. In questo modo capisci piu in fretta dove conviene concentrare il monitoraggio.',
    },
];

interface Props {
    params: Promise<{ provincia: string }>;
    searchParams: Promise<{
        stato?: string;
        sort?: string;
        settore?: string;
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
    const province = await getProvinceWithCount(supabase);
    return province.map((item) => ({ provincia: toUrlSlug(item.provincia) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { provincia: slug } = await params;
    const supabase = createStaticClient();
    const province = await getProvinceWithCount(supabase);
    const matchedProvincia = province.find((item) => toUrlSlug(item.provincia) === slug);

    if (!matchedProvincia) return { title: 'Provincia non trovata' };

    const canonical = `${getServerAppUrl()}/provincia/${slug}`;

    return {
        title: `Concorsi pubblici in provincia di ${matchedProvincia.provincia} | Concoro`,
        description: `Consulta i concorsi pubblici in provincia di ${matchedProvincia.provincia} (${matchedProvincia.sigla}) e filtra i bandi per ente, settore, scadenza e stato.`,
        keywords: [
            `concorsi ${matchedProvincia.provincia}`,
            `concorsi pubblici ${matchedProvincia.provincia}`,
            `bandi ${matchedProvincia.provincia}`,
            `enti pubblici ${matchedProvincia.provincia}`,
            `concorsi provincia ${matchedProvincia.sigla}`,
        ],
        alternates: {
            canonical,
        },
        openGraph: {
            title: `Concorsi pubblici in provincia di ${matchedProvincia.provincia}`,
            description: `Bandi attivi e scaduti in provincia di ${matchedProvincia.provincia}, organizzati per ente, settore e scadenza.`,
            url: canonical,
            locale: 'it_IT',
            siteName: 'Concoro',
        },
    };
}

export const revalidate = 3600;

export default async function ProvinciaPage({ params, searchParams }: Props) {
    const { provincia: slug } = await params;

    const supabase = await createClient();
    const provinceList = await getProvinceWithCount(supabase);
    const matchedProvincia = provinceList.find((item) => toUrlSlug(item.provincia) === slug);

    if (!matchedProvincia) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <p className="text-lg font-semibold text-slate-900">Provincia non trovata.</p>
                <Link href="/provincia" className="mt-4 inline-flex text-sm font-semibold text-[#0A4E88] hover:underline">
                    Torna alla lista province
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

    const baseProvinciaFilters: ConcorsoFilters = {
        provincia: matchedProvincia.provincia,
        stato,
        sort,
        solo_attivi: stato === 'aperti' ? true : undefined,
    };

    const selectedFilters: ConcorsoFilters = {
        ...baseProvinciaFilters,
        settore: settore || undefined,
        ente_slug: enteSlug || undefined,
    };

    const [provinciaData, baseProvinciaData, openSnapshot, closedSnapshot, tier, entiData] = await Promise.all([
        getConcorsi(supabase, selectedFilters, page, LIMIT),
        getConcorsi(supabase, baseProvinciaFilters, 1, FACET_SCAN_LIMIT),
        getConcorsi(supabase, { provincia: matchedProvincia.provincia, stato: 'aperti', solo_attivi: true }, 1, 1),
        getConcorsi(supabase, { provincia: matchedProvincia.provincia, stato: 'scaduti' }, 1, 1),
        getUserTier(supabase),
        supabase
            .from('enti')
            .select('ente_nome, ente_slug, regione, comune')
            .eq('provincia', matchedProvincia.provincia)
            .not('ente_slug', 'is', null)
            .order('ente_nome', { ascending: true })
            .limit(80),
    ]);

    const concorsi = provinciaData.data ?? [];
    const count = provinciaData.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(count / LIMIT));
    const isLocked = tier !== 'pro' && tier !== 'admin';
    const showPaywall = isLocked && (page > 1 || concorsi.length > FREE_VISIBLE);
    const visibleResults = showPaywall && page === 1 ? concorsi.slice(0, FREE_VISIBLE) : (showPaywall ? [] : concorsi);
    const lockedResults = showPaywall && page === 1 ? concorsi.slice(FREE_VISIBLE) : [];

    const facetSource = baseProvinciaData.data ?? [];
    const settoreCounts = new Map<string, number>();
    const enteCounts = new Map<string, { name: string; count: number }>();
    const regioneCounts = new Map<string, number>();

    for (const concorso of facetSource) {
        for (const item of concorso.settori ?? []) {
            if (!item) continue;
            settoreCounts.set(item, (settoreCounts.get(item) ?? 0) + 1);
        }
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

    const topSettori = Array.from(settoreCounts.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
        .slice(0, 10);

    const topRegioni = Array.from(regioneCounts.entries())
        .map(([label, value]) => ({ label, value, slug: toUrlSlug(label) }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

    const primaryRegione = topRegioni[0]?.label ?? (entiData.data ?? []).find((item) => item.regione)?.regione ?? null;

    const topEnti = Array.from(enteCounts.entries())
        .map(([slugValue, item]) => ({ slug: slugValue, name: item.name, count: item.count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 16);

    const entiFilterOptionsFromEntiTable = (entiData.data ?? [])
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

    const entiFilterOptions = entiFilterOptionsFromEntiTable.length > 0
        ? entiFilterOptionsFromEntiTable
        : topEnti.map((item) => ({ slug: item.slug, name: item.name, count: item.count }));

    const activeCount = openSnapshot.count ?? 0;
    const closedCount = closedSnapshot.count ?? 0;

    const otherProvince = provinceList
        .filter((item) => item.provincia !== matchedProvincia.provincia)
        .sort((a, b) => b.count - a.count || a.provincia.localeCompare(b.provincia))
        .slice(0, 8)
        .map((item) => ({ ...item, slug: toUrlSlug(item.provincia) }));

    const appUrl = getServerAppUrl();
    const pageUrl = `${appUrl}/provincia/${slug}`;

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: appUrl },
            { '@type': 'ListItem', position: 2, name: 'Province', item: `${appUrl}/provincia` },
            { '@type': 'ListItem', position: 3, name: matchedProvincia.provincia, item: pageUrl },
        ],
    };

    const pageJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Concorsi pubblici in provincia di ${matchedProvincia.provincia}`,
        url: pageUrl,
        inLanguage: 'it-IT',
        description: `Elenco dei concorsi pubblici in provincia di ${matchedProvincia.provincia}, con filtri per stato, settore, ente e scadenza.`,
        isPartOf: {
            '@type': 'WebSite',
            name: 'Concoro',
            url: appUrl,
        },
        about: {
            '@type': 'AdministrativeArea',
            name: matchedProvincia.provincia,
        },
    };

    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Bandi in provincia di ${matchedProvincia.provincia}`,
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
        return queryString ? `/provincia/${slug}?${queryString}` : `/provincia/${slug}`;
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
                        'radial-gradient(circle at 10% 9%, rgba(18,65,108,0.16), transparent 36%), radial-gradient(circle at 92% 17%, rgba(220,38,38,0.1), transparent 33%), repeating-linear-gradient(90deg, rgba(10,53,91,0.04) 0 1px, transparent 1px 82px)',
                }}
            />

            <div className="relative border-b border-slate-200 bg-white/85">
                <div className="container mx-auto max-w-[78rem] px-4 py-3 text-sm text-slate-500">
                    <nav className="flex flex-wrap items-center gap-2">
                        <Link href="/" className="hover:text-slate-900">Home</Link>
                        <ChevronRight className="h-4 w-4" />
                        <Link href="/provincia" className="hover:text-slate-900">Province</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-slate-900">{matchedProvincia.provincia}</span>
                    </nav>
                </div>
            </div>

            <header className="relative px-4 pb-12 pt-10 md:pb-16">
                <div className="container mx-auto grid max-w-[78rem] gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-slate-700">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Pagina provinciale Concoro
                        </div>

                        <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] max-w-4xl text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-slate-900 md:text-6xl">
                            Trova i concorsi pubblici in provincia di
                            <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                {matchedProvincia.provincia}
                            </span>
                            senza perdere tempo tra ricerche dispersive.
                        </h1>

                        <p className="max-w-3xl text-base leading-relaxed text-slate-700 md:text-lg">
                            Qui trovi i bandi della provincia di {matchedProvincia.provincia} raccolti in una vista piu chiara:
                            puoi filtrare per ente, settore, stato e scadenza, capire dove ci sono piu opportunita e decidere
                            piu in fretta quali concorsi approfondire.
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
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Orientamento locale</p>
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-2xl text-slate-900">
                                Come muoverti meglio in provincia
                            </h2>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Contesto territoriale</p>
                                <div className="space-y-2 text-sm text-slate-700">
                                    <p className="inline-flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-[#0A4E88]" />
                                        Provincia: {matchedProvincia.provincia} ({matchedProvincia.sigla})
                                    </p>
                                    <p className="inline-flex items-center gap-2">
                                        <Landmark className="h-4 w-4 text-[#0A4E88]" />
                                        Regione: {primaryRegione ?? 'N/D'}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm leading-relaxed text-slate-700">
                                    Se vuoi allargare la ricerca oltre {matchedProvincia.provincia}, queste sono le province piu utili da monitorare adesso:
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {otherProvince.length > 0 ? otherProvince.map((item) => (
                                        <Link
                                            key={item.provincia}
                                            href={`/provincia/${item.slug}`}
                                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                        >
                                            <MapPin className="h-3.5 w-3.5" />
                                            {item.provincia} ({item.count})
                                        </Link>
                                    )) : (
                                        <p className="text-xs text-slate-500">Nessun dato provincia disponibile.</p>
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
                                Filtri provinciali
                            </p>
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl tracking-tight text-slate-900">
                                Bandi e concorsi in provincia di {matchedProvincia.provincia}
                            </h2>
                            <p className="mt-2 text-sm text-slate-600">
                                {count} risultati nella pagina locale
                                {settore ? ` - settore: ${settore}` : ''}
                                {enteSlug ? ' - ente selezionato' : ''}
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
                                concorsi={lockedResults.length > 0 ? lockedResults : concorsi.slice(0, 3)}
                                lockedCount={Math.max(0, count - (page === 1 ? FREE_VISIBLE : 0))}
                                isLoggedIn={tier !== 'anon'}
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
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">Una vista locale che orienta davvero</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                            In una sola pagina capisci dove si concentrano i bandi, quali enti pubblicano di piu e dove vale la pena tornare a controllare.
                        </p>
                    </article>
                    <article className="rounded-3xl border border-slate-200 bg-white p-6">
                        <Compass className="h-5 w-5 text-[#0A4E88]" />
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">Filtri semplici per una ricerca piu precisa</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                            Stato, settore ed ente ti aiutano a passare da una lista ampia ai concorsi piu pertinenti per il tuo profilo e la tua zona.
                        </p>
                    </article>
                    <article className="rounded-3xl border border-slate-200 bg-white p-6">
                        <Building2 className="h-5 w-5 text-[#0A4E88]" />
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">Un punto fermo per il monitoraggio</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                            Torna qui per seguire nuove uscite, ordinare per scadenza e non perdere occasioni interessanti nella provincia di {matchedProvincia.provincia}.
                        </p>
                    </article>
                </div>
            </section>

            <section className="px-4 pb-14">
                <div className="container mx-auto max-w-[78rem] rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                    <div className="m-2 mb-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Domande frequenti</p>
                        <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-2 text-3xl tracking-tight text-slate-900">
                            Domande utili per cercare concorsi in provincia di {matchedProvincia.provincia}
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
                            href="/provincia"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            <MapPin className="h-3.5 w-3.5" />
                            Altre province
                        </Link>
                        <Link
                            href={primaryRegione ? `/regione/${toUrlSlug(primaryRegione)}` : '/regione'}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            <Landmark className="h-3.5 w-3.5" />
                            Esplora regione
                        </Link>
                        <Link
                            href={`/signup?provincia=${slug}`}
                            className="inline-flex items-center gap-2 rounded-full border border-[#0A4E88]/30 bg-[#0A4E88]/5 px-3 py-1.5 text-xs font-semibold text-[#083861] transition hover:bg-[#0A4E88]/10"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Ricevi notifiche per questa provincia
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
