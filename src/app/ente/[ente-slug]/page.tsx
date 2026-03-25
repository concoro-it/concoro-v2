import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    Bell,
    BriefcaseBusiness,
    Building2,
    ChevronRight,
    CircleAlert,
    ExternalLink,
    Landmark,
    MapPin,
    ShieldCheck,
    Train,
} from 'lucide-react';
import { createCachedServiceClient } from '@/lib/supabase/server';
import { getAllEnti, getConcorsiByEnte, getEnteBySlug } from '@/lib/supabase/queries';
import { formatDateIT } from '@/lib/utils/date';
import { toUrlSlug } from '@/lib/utils/regioni';
import { getServerAppUrl } from '@/lib/auth/url';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import type {
    EnteAnalisiLogistica,
    EnteCuriositaStoriche,
    EnteFaqItem,
    EnteIdentitaIstituzionale,
    EnteMetadataSeo,
    EnteSocialMedia,
    EnteValoreProfessionale,
    EnteVivereTerritorio,
    JsonValue,
} from '@/types/ente';

interface Props {
    params: Promise<{ 'ente-slug': string }>;
}

const PAGE_STEPS = [
    {
        title: "Parti dal territorio dell'ente",
        description: "Controlla sede, provincia e contesto locale per capire subito se il bando e compatibile con i tuoi vincoli geografici.",
    },
    {
        title: 'Seleziona i bandi piu rilevanti',
        description: 'Valuta posti, scadenze e requisiti principali per decidere rapidamente quali opportunita meritano approfondimento.',
    },
    {
        title: 'Attiva un monitoraggio continuo',
        description: "Segui le nuove pubblicazioni di questo ente e resta aggiornato anche su provincia e regione senza rifare la ricerca ogni giorno.",
    },
];

function parseJson<T>(value: JsonValue | null | undefined, fallback: T): T {
    if (value === null || value === undefined) return fallback;
    try {
        if (typeof value === 'string') {
            return JSON.parse(value) as T;
        }
        return value as T;
    } catch {
        return fallback;
    }
}

function normaliseWebsite(url: string | null): string | null {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
}

function toScoreLabel(score: string | number | null | undefined): string {
    if (score === null || score === undefined || score === '') return 'N/D';
    return `${score}/10`;
}

function splitWelfare(value: string | null | undefined): string[] {
    if (!value) return [];
    return value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
}

function normalisePhone(phone: string | null): string | null {
    if (!phone) return null;
    return phone.replace(/\s+/g, '');
}

export async function generateStaticParams() {
    const supabase = createCachedServiceClient({ revalidate, tags: ['public:ente-detail'] });
    const { data: enti, error } = await supabase
        .from('enti')
        .select('ente_slug')
        .not('ente_slug', 'is', null);

    if (error || !enti) return [];

    return enti.map(ente => ({ 'ente-slug': ente.ente_slug }));
}

async function getEntePageData(slug: string) {
    const supabase = createCachedServiceClient({ revalidate, tags: ['public:ente-detail'] });
    let ente = await getEnteBySlug(supabase, slug);

    if (!ente) {
        const [enti] = await Promise.all([getAllEnti(supabase)]);
        ente = enti.find(item => toUrlSlug(item.ente_nome) === slug) ?? null;
    }

    if (!ente) return null;

    return {
        ente,
    };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { 'ente-slug': slug } = await params;
    const data = await getEntePageData(slug);
    const appUrl = getServerAppUrl();
    const canonicalUrl = `${appUrl}/ente/${slug}`;

    if (!data) {
        return { title: 'Ente non trovato' };
    }

    const seo = parseJson<EnteMetadataSeo>(data.ente.metadata_seo ?? null, {});
    const title = seo.og_title || seo.h1_title || `Concorsi ${data.ente.ente_nome}: bandi, sede e contesto territoriale`;
    const description =
        seo.meta_description ||
        `Scopri i concorsi di ${data.ente.ente_nome}, con focus su sede, area geografica e riferimenti ufficiali per monitorare nuovi bandi pubblici in modo piu mirato.`;
    const image = data.ente.cover_image_url || data.ente.logo_url || undefined;
    const enteRegione = data.ente.regione ? ` ${data.ente.regione}` : '';
    const enteProvincia = data.ente.provincia ? ` ${data.ente.provincia}` : '';

    return {
        title,
        description,
        keywords: [
            `concorsi ${data.ente.ente_nome}`,
            `concorsi pubblici ${data.ente.ente_nome}`,
            `bandi ${data.ente.ente_nome}`,
            `concorsi pubblici${enteRegione}`,
            `bandi pubblici${enteProvincia}`,
            `lavorare in ${data.ente.ente_nome}`,
            `${data.ente.ente_nome} concorsi ${data.ente.regione ?? 'Italia'}`,
        ],
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            siteName: 'Concoro',
            locale: 'it_IT',
            images: image ? [{ url: image }] : undefined,
        },
        twitter: {
            card: image ? 'summary_large_image' : 'summary',
            title,
            description,
            images: image ? [image] : undefined,
        },
    };
}

export const revalidate = 86400;

export default async function EntePage({ params }: Props) {
    const { 'ente-slug': slug } = await params;
    const supabase = createCachedServiceClient({ revalidate, tags: ['public:ente-detail'] });

    let ente = await getEnteBySlug(supabase, slug);

    // Fallback: if not found by slug, try to find by name-based slug (for backward compatibility or new records)
    if (!ente) {
        const [enti] = await Promise.all([getAllEnti(supabase)]);
        ente = enti.find(item => toUrlSlug(item.ente_nome) === slug) ?? null;
    }

    if (!ente) notFound();

    const concorsi = await getConcorsiByEnte(supabase, slug, 50);

    const identita = parseJson<EnteIdentitaIstituzionale>(ente?.identita_istituzionale, {});
    const logistica = parseJson<EnteAnalisiLogistica>(ente?.analisi_logistica, {});
    const territorio = parseJson<EnteVivereTerritorio>(ente?.vivere_il_territorio, {});
    const valore = parseJson<EnteValoreProfessionale>(ente?.valore_professionale, {});
    const curiosita = parseJson<EnteCuriositaStoriche>(ente?.curiosita_storiche, {});
    const faq = parseJson<EnteFaqItem[]>(ente?.faq_schema, []);
    const seo = parseJson<EnteMetadataSeo>(ente?.metadata_seo, {});
    const social = parseJson<EnteSocialMedia>(ente?.social_media, {});

    const phoneHref = normalisePhone(ente?.telefono ?? null);
    const mapsQuery = [ente?.indirizzo, ente?.cap, ente?.comune ?? ente?.provincia, ente?.regione]
        .filter(Boolean)
        .join(', ');
    const mapsHref = mapsQuery
        ? `https://maps.google.com/?q=${encodeURIComponent(mapsQuery)}`
        : null;
    const welfareItems = splitWelfare(valore.welfare_tahmini);
    const ccnlLabel = valore.ccnl_standard || 'Non disponibile';
    const scoreLabel = toScoreLabel(territorio.qualita_vita_score);
    const heroTitle =
        seo.h1_title ||
        `Concorsi ${ente.ente_nome}: bandi e informazioni locali`;
    const comuneOrProvincia = ente?.comune || ente?.provincia || 'Italia';
    const regioneSlug = ente?.regione ? toUrlSlug(ente.regione) : null;
    const provinciaSlug = ente?.provincia ? toUrlSlug(ente.provincia) : null;
    const cacheDeadlineLabel = formatDateIT(ente?.data_scadenza_cache ?? null);
    const appUrl = getServerAppUrl();
    const pageUrl = `${appUrl}/ente/${slug}`;

    const socialLinks = [
        { label: 'Facebook', href: social.facebook },
        { label: 'Instagram', href: social.instagram },
        { label: 'LinkedIn', href: social.linkedin },
        { label: 'Twitter', href: social.twitter },
        { label: 'YouTube', href: social.youtube },
    ].filter((item): item is { label: string; href: string } => Boolean(item.href));
    const websiteFromConcorsi = concorsi
        .map((concorso) => normaliseWebsite(concorso.link_sito_pa ?? null))
        .find((url): url is string => Boolean(url)) ?? null;
    const website = normaliseWebsite(ente?.sito_istituzionale ?? null) ?? websiteFromConcorsi;

    const organizationJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'GovernmentOrganization',
        name: ente.ente_nome,
        identifier: ente?.ente_id ?? undefined,
        url: website ?? undefined,
        logo: ente?.logo_url ?? undefined,
        image: ente?.cover_image_url ?? ente?.logo_url ?? undefined,
        telephone: ente?.telefono ?? undefined,
        email: ente?.pec ?? undefined,
        address: {
            '@type': 'PostalAddress',
            streetAddress: ente?.indirizzo ?? undefined,
            postalCode: ente?.cap ?? undefined,
            addressLocality: ente?.comune ?? undefined,
            addressRegion: ente?.regione ?? undefined,
            addressCountry: 'IT',
        },
        geo: ente?.latitudine !== null && ente?.latitudine !== undefined && ente?.longitudine !== null && ente?.longitudine !== undefined
            ? {
                '@type': 'GeoCoordinates',
                latitude: ente.latitudine,
                longitude: ente.longitudine,
            }
            : undefined,
        sameAs: socialLinks.map(link => link.href),
        description: identita.descrizione ?? undefined,
    };

    const faqJsonLd = faq.length > 0
        ? {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map(item => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.answer,
                },
            })),
        }
        : null;
    const pageJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: heroTitle,
        url: pageUrl,
        inLanguage: 'it-IT',
        description:
            seo.meta_description ||
            `Scheda di ${ente.ente_nome} con bandi attivi, dati sulla sede e riferimenti utili per chi cerca concorsi pubblici nella stessa area.`,
        about: {
            '@type': 'GovernmentOrganization',
            name: ente.ente_nome,
        },
        isPartOf: {
            '@type': 'WebSite',
            name: 'Concoro',
            url: appUrl,
        },
        dateModified: ente?.updated_at ?? undefined,
    };
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: appUrl,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Enti Pubblici',
                item: `${appUrl}/ente`,
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: ente.ente_nome,
                item: pageUrl,
            },
        ],
    };
    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Concorsi pubblici ${ente.ente_nome}`,
        itemListElement: concorsi.slice(0, 20).map((concorso, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: concorso.titolo_breve || concorso.titolo,
            url: `${appUrl}/concorsi/${concorso.slug}`,
        })),
    };

    return (
        <div className="relative overflow-hidden bg-[hsl(210,55%,98%)] text-slate-900 [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            {concorsi.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
                />
            )}
            {faqJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
                />
            )}

            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 4% 8%, rgba(18,65,108,0.14), transparent 34%), radial-gradient(circle at 93% 7%, rgba(220,38,38,0.1), transparent 30%), repeating-linear-gradient(90deg, rgba(10,53,91,0.04) 0 1px, transparent 1px 88px)',
                }}
            />

            <div className="relative border-b border-slate-200 bg-white/85">
                <div className="container mx-auto max-w-[78rem] px-4 py-3 text-sm text-slate-500">
                    <nav className="flex flex-wrap items-center gap-2">
                        <Link href="/" className="hover:text-slate-900">Home</Link>
                        <ChevronRight className="h-4 w-4" />
                        <Link href="/ente" className="hover:text-slate-900">Enti Pubblici</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-slate-900">{ente.ente_nome}</span>
                    </nav>
                </div>
            </div>

            <header className="relative px-4 pb-14 pt-10">
                <div className="container mx-auto grid max-w-[78rem] gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-slate-700 backdrop-blur-sm">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Scheda Ente PA
                        </div>

                        {ente?.logo_url && (
                            <img
                                src={ente.logo_url}
                                alt={`Logo ${ente.ente_nome}`}
                                className="h-16 w-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.5)]"
                            />
                        )}

                        <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] max-w-4xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-slate-900 md:text-6xl">
                            {heroTitle}
                        </h1>

                        <p className="max-w-3xl text-base leading-relaxed text-slate-700">
                            In questa scheda trovi i concorsi pubblici di {ente.ente_nome}, insieme a sede e contesto territoriale.
                            L&apos;obiettivo e aiutarti a capire in pochi minuti se i bandi di questo ente sono coerenti con il tuo profilo e con la tua area di interesse.
                        </p>

                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm leading-relaxed text-slate-700">
                            <strong>Cosa trovi qui:</strong> bandi aperti, riferimenti ufficiali dell&apos;ente, dettagli sulla sede e percorsi rapidi per continuare la ricerca per regione o provincia.
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="#concorsi"
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Vai ai bandi attivi
                                <Building2 className="h-4 w-4" />
                            </Link>
                            <Link
                                href={`/concorsi?ente=${slug}`}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                            >
                                Cerca altri bandi simili
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href={`/signup?ente=${slug}`}
                                className="inline-flex items-center gap-2 rounded-xl border border-[#0A4E88]/30 bg-[#0A4E88]/5 px-5 py-3 text-sm font-semibold text-[#083861] transition hover:bg-[#0A4E88]/10"
                            >
                                Ricevi nuovi bandi di questo ente
                                <Bell className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    <aside className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_14px_44px_-30px_rgba(15,23,42,0.45)]">
                        <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-emerald-500 via-white to-rose-500" />
                        <div className="space-y-5 pl-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Panoramica locale</p>
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-2xl text-slate-900">
                                Prima lettura dell&apos;ente
                            </h2>
                            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(140deg,#f2f7ff_0%,#e9f2ff_50%,#deedff_100%)] p-3">
                                {ente?.cover_image_url ? (
                                    <img
                                        src={ente.cover_image_url}
                                        alt={`${ente.ente_nome} sede`}
                                        className="h-24 w-full rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="flex h-24 w-full items-center justify-center rounded-xl bg-[radial-gradient(circle_at_20%_20%,rgba(10,78,136,0.26),transparent_60%)] text-xs font-semibold uppercase tracking-[0.1em] text-slate-600">
                                        Contesto territoriale
                                    </div>
                                )}
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <p className="line-clamp-1 text-sm font-semibold text-slate-900">{ente.ente_nome}</p>
                                    {ente?.logo_url && (
                                        <img
                                            src={ente.logo_url}
                                            alt={`Logo ${ente.ente_nome}`}
                                            className="h-8 w-8 rounded-lg border border-slate-200 bg-white p-1 object-contain"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Bandi attivi</p>
                                    <p className="mt-1 text-2xl font-semibold text-slate-900">{concorsi.length}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Qualita vita</p>
                                    <p className="mt-1 text-2xl font-semibold text-slate-900">{scoreLabel}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Regione</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{ente?.regione || 'N/D'}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs uppercase tracking-[0.08em] text-slate-500">CCNL</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{ccnlLabel}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {website ? (
                                    <a
                                        href={website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                                    >
                                        Sito ente
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                ) : (
                                    <span className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400">
                                        Sito non disponibile
                                    </span>
                                )}
                                {mapsHref ? (
                                    <a
                                        href={mapsHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                                    >
                                        Apri mappa
                                        <MapPin className="h-3.5 w-3.5" />
                                    </a>
                                ) : (
                                    <span className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400">
                                        Mappa non disponibile
                                    </span>
                                )}
                            </div>
                            {ente?.data_scadenza_cache && (
                                <p className="flex items-start gap-2 text-sm text-slate-700">
                                    <CircleAlert className="mt-0.5 h-4 w-4 text-[#0A4E88]" />
                                    Ultima scadenza rilevata: {cacheDeadlineLabel}
                                </p>
                            )}
                            {(regioneSlug || provinciaSlug) && (
                                <div className="flex flex-wrap gap-2">
                                    {regioneSlug && (
                                        <Link
                                            href={`/regione/${regioneSlug}`}
                                            className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                        >
                                            Altri bandi in {ente?.regione}
                                        </Link>
                                    )}
                                    {provinciaSlug && (
                                        <Link
                                            href={`/provincia/${provinciaSlug}`}
                                            className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                        >
                                            Bandi in provincia di {ente?.provincia}
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </header>

            <section className="px-4 pb-14">
                <div className="container mx-auto max-w-[78rem] rounded-3xl border border-slate-200 bg-white pt-4 p-2 md:p-8">
                    <div className="m-2 mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        <Landmark className="h-3.5 w-3.5" />
                        Come orientarti
                    </div>
                    <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] m-2 mb-5 text-3xl tracking-tight text-slate-900">
                        Come usare questa pagina per decidere meglio
                    </h2>
                    <ol className="grid gap-3 md:grid-cols-3">
                        {PAGE_STEPS.map((step, index) => (
                            <li key={step.title} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Passaggio {index + 1}</p>
                                <h3 className="mt-1 text-base font-semibold text-slate-900">{step.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section id="concorsi" className="px-4 pb-14">
                <div className="container mx-auto max-w-[78rem] rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                    <div className="m-2 mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                                <Building2 className="h-3.5 w-3.5" />
                                Bandi dell&apos;ente
                            </p>
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl tracking-tight text-slate-900">
                                Concorsi pubblici di {ente.ente_nome}
                            </h2>
                            <p className="mt-2 text-sm text-slate-600">
                                {concorsi.length > 0
                                    ? `Al momento risultano ${concorsi.length} bandi attivi pubblicati da questo ente.`
                                    : 'Al momento non risultano bandi attivi per questo ente.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {regioneSlug && (
                                <Link
                                    href={`/regione/${regioneSlug}`}
                                    className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                    Vedi bandi in {ente?.regione}
                                </Link>
                            )}
                            {provinciaSlug && (
                                <Link
                                    href={`/provincia/${provinciaSlug}`}
                                    className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                    Vedi bandi in provincia di {ente?.provincia}
                                </Link>
                            )}
                        </div>
                    </div>
                    {concorsi.length > 0 ? (
                        <ConcorsoList concorsi={concorsi} />
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-sm leading-relaxed text-slate-700">
                            Nessun bando attivo in questo momento. Per non perdere le prossime uscite, controlla anche regione e provincia oppure attiva le notifiche dedicate a questo ente.
                        </div>
                    )}
                </div>
            </section>

            <section className="px-4 pb-14">
                <div className="container mx-auto grid max-w-[78rem] gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <article className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Identita istituzionale</p>
                        <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-2 text-3xl tracking-tight text-slate-900">
                            {ente.ente_nome}
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-slate-700">
                            {identita.descrizione || 'Descrizione istituzionale non ancora disponibile per questo ente.'}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                            {ente?.comune && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Comune: {ente.comune}</span>}
                            {ente?.provincia && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Provincia: {ente.provincia}</span>}
                            {ente?.regione && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Regione: {ente.regione}</span>}
                            {identita.prestigio && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Prestigio: {identita.prestigio}</span>}
                        </div>
                        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
                            <strong>Ruolo nel territorio:</strong> {identita.ruolo_territoriale || 'Informazioni territoriali non ancora disponibili.'}
                        </div>
                    </article>

                    <aside className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Contatti ufficiali</p>
                        <h3 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-2 text-2xl tracking-tight text-slate-900">
                            Sede e riferimenti ufficiali
                        </h3>
                        <dl className="mt-5 space-y-4 text-sm">
                            <div className="border-b border-slate-100 pb-3">
                                <dt className="text-slate-500">Indirizzo</dt>
                                <dd className="mt-1 font-medium text-slate-900">{ente?.indirizzo || 'N/D'}</dd>
                            </div>
                            <div className="border-b border-slate-100 pb-3">
                                <dt className="text-slate-500">CAP / Comune</dt>
                                <dd className="mt-1 font-medium text-slate-900">{[ente?.cap, comuneOrProvincia].filter(Boolean).join(' - ') || 'N/D'}</dd>
                            </div>
                            <div className="border-b border-slate-100 pb-3">
                                <dt className="text-slate-500">PEC</dt>
                                <dd className="mt-1 break-all font-medium text-slate-900">{ente?.pec ? <a href={`mailto:${ente.pec}`} className="text-[#0B4B7F] hover:underline">{ente.pec}</a> : 'N/D'}</dd>
                            </div>
                            <div className="border-b border-slate-100 pb-3">
                                <dt className="text-slate-500">Telefono</dt>
                                <dd className="mt-1 font-medium text-slate-900">{phoneHref ? <a href={`tel:${phoneHref}`} className="hover:underline">{ente?.telefono}</a> : (ente?.telefono || 'N/D')}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Sito istituzionale</dt>
                                <dd className="mt-1 font-medium text-slate-900">
                                    {website ? (
                                        <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#0B4B7F] hover:underline">
                                            {ente?.sito_istituzionale}
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    ) : 'N/D'}
                                </dd>
                            </div>
                        </dl>
                    </aside>
                </div>
            </section>

            <section className="px-4 pb-14">
                <div className="container mx-auto max-w-[78rem] rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                    <div className="m-2 mb-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Territorio e lavoro pubblico</p>
                        <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-2 text-3xl tracking-tight text-slate-900">
                            Cosa valutare oltre ai requisiti del bando
                        </h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <Train className="h-5 w-5 text-[#0A4E88]" />
                            <h3 className="mt-3 text-base font-semibold text-slate-900">Mobilita</h3>
                            <p className="mt-2 text-sm text-slate-600">Pendolarismo: {logistica.pendolarismo || 'N/D'}</p>
                            <p className="mt-1 text-sm text-slate-600">Stazione vicina: {logistica.stazione_vicina || 'N/D'}</p>
                            <p className="mt-1 text-sm text-slate-600">Accessibilita mezzi: {logistica.accessibilita_mezzi || 'N/D'}</p>
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <MapPin className="h-5 w-5 text-[#0A4E88]" />
                            <h3 className="mt-3 text-base font-semibold text-slate-900">Territorio</h3>
                            <p className="mt-2 text-sm text-slate-600">Costo della vita: {territorio.costo_vita || 'N/D'}</p>
                            <p className="mt-1 text-sm text-slate-600">Ambiente sociale: {territorio.ambiente_sociale || 'N/D'}</p>
                            <p className="mt-1 text-sm text-slate-600">Qualita vita: {scoreLabel}</p>
                            {territorio.servizi_vicini && <p className="mt-3 text-sm leading-relaxed text-slate-600">{territorio.servizi_vicini}</p>}
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <BriefcaseBusiness className="h-5 w-5 text-[#0A4E88]" />
                            <h3 className="mt-3 text-base font-semibold text-slate-900">Professione</h3>
                            <p className="mt-2 text-sm text-slate-600">CCNL: {ccnlLabel}</p>
                            <p className="mt-1 text-sm text-slate-600">Stabilita: {valore.stabilita_lavorativa || 'N/D'}</p>
                            {welfareItems.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {welfareItems.map(item => (
                                        <span key={item} className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </article>
                    </div>
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <p className="font-medium text-slate-900">{[ente?.indirizzo, ente?.cap, comuneOrProvincia, ente?.regione].filter(Boolean).join(' - ')}</p>
                        {mapsHref && (
                            <a
                                href={mapsHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 font-semibold text-[#0B4B7F] hover:underline"
                            >
                                Apri sede in Google Maps
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        )}
                    </div>
                </div>
            </section>

            <section className="px-4 pb-14">
                <div className="container mx-auto max-w-[78rem] rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                    <p className="m-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Contesto ente</p>
                    <h2 className="m-2 [font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-2 text-3xl tracking-tight text-slate-900">
                        Informazioni utili per valutare {ente.ente_nome}
                    </h2>
                    <div className="mt-5 m-2 grid gap-3 md:grid-cols-3">
                        {[curiosita.fatto1, curiosita.fatto2, curiosita.fatto3].map((fatto, index) => (
                            <article key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Nota {index + 1}</p>
                                <p className="mt-2 text-sm leading-relaxed text-slate-700">{fatto || 'Curiosita non ancora disponibile.'}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 pb-14">
                <div className="container mx-auto max-w-[78rem] rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                    <div className="grid gap-8 lg:grid-cols-2">
                        <div>
                            <p className="m-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">FAQ ente</p>
                            <h2 className="m-2 [font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-2 text-3xl tracking-tight text-slate-900">
                                Domande frequenti su bandi e candidatura
                            </h2>
                            <p className="m-2 mt-3 text-sm leading-relaxed text-slate-600">
                                Risposte rapide per chiarire dubbi su candidatura, sede, contesto territoriale e riferimenti operativi dell&apos;ente.
                            </p>
                        </div>
                        <div className="space-y-3">
                            {faq.length > 0 ? faq.map(item => (
                                <article key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <h3 className="text-sm font-semibold text-slate-900">{item.question}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</p>
                                </article>
                            )) : (
                                <div className="m-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                                    FAQ non ancora disponibili per questo ente.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 pb-16">
                <div className="container mx-auto max-w-[78rem] overflow-hidden rounded-3xl border border-slate-300 bg-[linear-gradient(145deg,#0A2E4D_0%,#0E436E_55%,#0A2E4D_100%)] p-8 text-white md:p-10">
                    <p className="m-4 text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">Monitoraggio bandi</p>
                    <h2 className="m-4 [font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-2 text-3xl tracking-tight md:text-4xl">
                        Monitora i prossimi bandi di {ente.ente_nome}
                    </h2>
                    <p className="m-4 mt-3 max-w-3xl text-sm leading-relaxed text-slate-200">
                        Attiva le notifiche su Concoro per seguire le nuove pubblicazioni di {ente.ente_nome} e ricevere aggiornamenti coerenti con la tua ricerca territoriale.
                    </p>
                    <div className="mt-2 flex flex-wrap">
                        <Link
                            href={`/signup?ente=${slug}`}
                            className="m-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                        >
                            Attiva notifiche ente
                            <Bell className="h-4 w-4" />
                        </Link>
                        <Link
                            href={`/concorsi?ente=${slug}`}
                            className="m-4 inline-flex items-center gap-2 rounded-xl border border-white/35 px-5 py-3 text-sm font-semibold text-white transition hover:border-white"
                        >
                            Esplora i bandi attivi
                        </Link>
                    </div>
                    {(website || mapsHref || socialLinks.length > 0 || regioneSlug || provinciaSlug) && (
                        <div className="m-4 mt-2 flex flex-wrap gap-4 text-sm text-slate-200">
                            {website && <a href={website} target="_blank" rel="noopener noreferrer" className="hover:text-white">Sito istituzionale</a>}
                            {mapsHref && <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="hover:text-white">Mappa sede</a>}
                            {regioneSlug && <Link href={`/regione/${regioneSlug}`} className="hover:text-white">Bandi in {ente?.regione}</Link>}
                            {provinciaSlug && <Link href={`/provincia/${provinciaSlug}`} className="hover:text-white">Bandi in provincia di {ente?.provincia}</Link>}
                            {socialLinks.map(link => (
                                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    )}
                    {(ente?.last_enriched_at || ente?.created_at) && (
                        <p className="m-4 mt-5 text-xs text-slate-300">
                            {ente?.last_enriched_at ? `Scheda aggiornata il ${formatDateIT(ente.last_enriched_at)}.` : ''}
                            {ente?.created_at ? ` Pubblicata il ${formatDateIT(ente.created_at)}.` : ''}
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}
