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
import { createServiceClient, createStaticAdminClient } from '@/lib/supabase/server';
import { getAllEnti, getConcorsiByEnte, getEnteBySlug, getEntiWithCount } from '@/lib/supabase/queries';
import { formatDateIT } from '@/lib/utils/date';
import { toUrlSlug } from '@/lib/utils/regioni';
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
    const supabase = createStaticAdminClient();
    const { data: enti, error } = await supabase
        .from('enti')
        .select('ente_slug')
        .not('ente_slug', 'is', null);

    if (error || !enti) return [];

    return enti.map(ente => ({ 'ente-slug': ente.ente_slug }));
}

async function getEntePageData(slug: string) {
    const supabase = createStaticAdminClient();
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

    if (!data) {
        return { title: 'Ente non trovato' };
    }

    const seo = parseJson<EnteMetadataSeo>(data.ente.metadata_seo ?? null, {});
    const title = seo.og_title || seo.h1_title || `Concorsi pubblici ${data.ente.ente_nome}`;
    const description =
        seo.meta_description ||
        `Scopri tutti i concorsi pubblici aperti per ${data.ente.ente_nome}.`;
    const image = data.ente.cover_image_url || data.ente.logo_url || undefined;

    return {
        title,
        description,
        alternates: {
            canonical: `https://www.concoro.it/ente/${slug}`,
        },
        openGraph: {
            title,
            description,
            url: `https://www.concoro.it/ente/${slug}`,
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
    const supabase = createStaticAdminClient();

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

    const website = normaliseWebsite(ente?.sito_istituzionale ?? null);
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
        `Lavorare nel ${ente.ente_nome}: sede, territorio e opportunità`;
    const comuneOrProvincia = ente?.comune || ente?.provincia || 'Italia';
    const regioneSlug = ente?.regione ? toUrlSlug(ente.regione) : null;
    const provinciaSlug = ente?.provincia ? toUrlSlug(ente.provincia) : null;
    const cacheDeadlineLabel = formatDateIT(ente?.data_scadenza_cache ?? null);

    const socialLinks = [
        { label: 'Facebook', href: social.facebook },
        { label: 'Instagram', href: social.instagram },
        { label: 'LinkedIn', href: social.linkedin },
        { label: 'Twitter', href: social.twitter },
        { label: 'YouTube', href: social.youtube },
    ].filter((item): item is { label: string; href: string } => Boolean(item.href));

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

    return (
        <div className="bg-white text-slate-900">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
            />
            {faqJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
                />
            )}
            <div className="border-b border-slate-200 bg-slate-50">
                <div className="container mx-auto max-w-6xl px-6 py-3 text-sm text-slate-500">
                    <nav className="flex flex-wrap items-center gap-2">
                        <Link href="/" className="hover:text-slate-900">Home</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span>Enti Pubblici</span>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-slate-900">{ente.ente_nome}</span>
                    </nav>
                </div>
            </div>

            <header
                className="relative overflow-hidden bg-slate-950"
                style={
                    ente?.cover_image_url
                        ? {
                            backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.86), rgba(15, 23, 42, 0.92)), url(${ente.cover_image_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }
                        : undefined
                }
            >
                <div className="container mx-auto max-w-6xl px-6 py-16 md:py-20">
                    <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_320px] md:items-end">
                        <div>
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">
                                <span className="h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.9)]" />
                                {'Ente pubblico'}
                            </div>

                            {ente?.logo_url && (
                                <div className="mb-5">
                                    <img
                                        src={ente.logo_url}
                                        alt={`Logo ${ente.ente_nome}`}
                                        className="h-16 w-auto rounded-xl bg-white/95 p-2 shadow-lg"
                                    />
                                </div>
                            )}

                            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                                {heroTitle}
                            </h1>

                            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-200/85">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-sky-300" />
                                    <span>
                                        {ente?.indirizzo || 'Sede istituzionale'}{ente?.comune ? `, ${ente.comune}` : ''}
                                        {ente?.regione ? `, ${ente.regione}` : ''}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Landmark className="h-4 w-4 text-sky-300" />
                                    <span>CCNL: <strong className="text-white">{ccnlLabel}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-sky-300" />
                                    <span>Stabilità: <strong className="text-white">{valore.stabilita_lavorativa || 'N/D'}</strong></span>
                                </div>
                            </div>

                            <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl border border-sky-300/25 bg-sky-400/15 p-2.5 text-sky-200">
                                        <Bell className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-200/85">
                                            <strong className="text-white">Concorsi attivi</strong> presso questo ente.
                                            {concorsi.length > 0 ? ` Attualmente ne risultano ${concorsi.length}.` : ' Nessun bando attivo in questo momento.'}
                                            {' '}
                                            <a href="#concorsi" className="font-semibold text-sky-300 hover:text-sky-200">
                                                Vai alla sezione bandi
                                            </a>
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                                            {ente?.data_scadenza_cache && (
                                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                                    Ultima scadenza nota: {cacheDeadlineLabel}
                                                </span>
                                            )}


                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hidden rounded-3xl border border-white/15 bg-white/10 p-6 text-sm text-slate-200 backdrop-blur-sm md:block">
                            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-300/70">
                                Profilo ente
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                                    <span className="text-slate-300/75">Prestigio</span>
                                    <span className="font-semibold text-white">{identita.prestigio || 'N/D'}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                                    <span className="text-slate-300/75">Regione</span>
                                    <span className="font-semibold text-white">{ente?.regione || 'N/D'}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                                    <span className="text-slate-300/75">Provincia</span>
                                    <span className="font-semibold text-white">{ente?.provincia || 'N/D'}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                                    <span className="text-slate-300/75">Costo della vita</span>
                                    <span className="font-semibold text-white">{territorio.costo_vita || 'N/D'}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                                    <span className="text-slate-300/75">Qualità della vita</span>
                                    <span className="rounded-full bg-sky-500 px-3 py-1 text-xs font-bold text-white">{scoreLabel}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-slate-300/75">Accessibilità mezzi</span>
                                    <span className="font-semibold text-white">{logistica.accessibilita_mezzi || 'N/D'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <section id="concorsi" className="bg-slate-100 py-16">
                <div className="container mx-auto max-w-6xl px-6">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Opportunità aperte</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Concorsi Pubblici</h2>
                    <p className="mt-3 max-w-2xl text-sm text-slate-600">
                        Bandi attivi, in scadenza e opportunità pubbliche collegate a {ente.ente_nome}.
                    </p>

                    <div className="mt-8">
                        <ConcorsoList concorsi={concorsi} />
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto max-w-6xl px-6">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Chi è l&apos;ente</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Identità Istituzionale</h2>

                    <div className="mt-8 grid gap-6 lg:grid-cols-2">
                        <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 to-blue-950 p-8 text-white shadow-xl">
                            <h3 className="text-2xl font-semibold tracking-tight">{ente.ente_nome}</h3>
                            <p className="mt-4 text-sm leading-7 text-slate-200/85">
                                {identita.descrizione || 'Profilo istituzionale non ancora disponibile per questo ente.'}
                            </p>
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">


                            <dl className="space-y-4 text-sm">
                                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                    <dt className="text-slate-500">Indirizzo</dt>
                                    <dd className="text-right font-medium text-slate-900">{ente?.indirizzo || 'N/D'}</dd>
                                </div>
                                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                    <dt className="text-slate-500">CAP / Comune</dt>
                                    <dd className="text-right font-medium text-slate-900">
                                        {[ente?.cap, ente?.comune || ente?.provincia].filter(Boolean).join(' - ') || 'N/D'}
                                    </dd>
                                </div>
                                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                    <dt className="text-slate-500">Regione</dt>
                                    <dd className="text-right font-medium text-slate-900">{ente?.regione || 'N/D'}</dd>
                                </div>
                                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                    <dt className="text-slate-500">PEC</dt>
                                    <dd className="text-right font-medium text-slate-900 break-all">
                                        {ente?.pec ? <a href={`mailto:${ente.pec}`} className="text-blue-700 hover:underline">{ente.pec}</a> : 'N/D'}
                                    </dd>
                                </div>
                                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                    <dt className="text-slate-500">Telefono</dt>
                                    <dd className="text-right font-medium text-slate-900">
                                        {phoneHref ? (
                                            <a href={`tel:${phoneHref}`} className="hover:underline">
                                                {ente?.telefono}
                                            </a>
                                        ) : (ente?.telefono || 'N/D')}
                                    </dd>
                                </div>
                                <div className="flex items-start justify-between gap-4">
                                    <dt className="text-slate-500">Sito istituzionale</dt>
                                    <dd className="text-right font-medium text-slate-900">
                                        {website ? (
                                            <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                                                {ente?.sito_istituzionale}
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        ) : 'N/D'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-8">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Ruolo nel territorio</p>
                        <p className="mt-3 text-sm leading-7 text-slate-700">
                            {identita.ruolo_territoriale || 'Informazioni sul ruolo territoriale non ancora disponibili.'}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            {ente?.comune && (
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                    Comune: {ente.comune}
                                </span>
                            )}
                            {ente?.provincia && (
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                    Provincia: {ente.provincia}
                                </span>
                            )}
                            {ente?.regione && (
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                    Regione: {ente.regione}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto max-w-6xl px-6">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Dove lavorerai</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Logistica e Qualità della Vita</h2>
                    <p className="mt-3 max-w-2xl text-sm text-slate-600">
                        Informazioni pratiche su mobilità, territorio e valore professionale collegato a questa sede.
                    </p>

                    <div className="mt-8 grid gap-6 lg:grid-cols-3">
                        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-950">Pendolarismo</h3>
                                    <p className="text-sm text-slate-500">Accessibilità e collegamenti</p>
                                </div>
                                <Train className="h-8 w-8 text-blue-300" />
                            </div>
                            <dl className="space-y-4 text-sm">
                                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                                    <dt className="text-slate-500">Pendolarismo</dt>
                                    <dd className="text-right font-medium text-slate-900">{logistica.pendolarismo || 'N/D'}</dd>
                                </div>
                                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                                    <dt className="text-slate-500">Stazione vicina</dt>
                                    <dd className="text-right font-medium text-slate-900">{logistica.stazione_vicina || 'N/D'}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-slate-500">Accessibilità mezzi</dt>
                                    <dd className="text-right font-medium text-slate-900">{logistica.accessibilita_mezzi || 'N/D'}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-950">Vivere il territorio</h3>
                                    <p className="text-sm text-slate-500">Servizi, ambiente sociale e contesto</p>
                                </div>
                                <MapPin className="h-8 w-8 text-blue-300" />
                            </div>
                            <dl className="space-y-4 text-sm">
                                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                                    <dt className="text-slate-500">Costo della vita</dt>
                                    <dd className="text-right font-medium text-slate-900">{territorio.costo_vita || 'N/D'}</dd>
                                </div>
                                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                                    <dt className="text-slate-500">Ambiente sociale</dt>
                                    <dd className="text-right font-medium text-slate-900">{territorio.ambiente_sociale || 'N/D'}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-slate-500">Qualità della vita</dt>
                                    <dd className="rounded-full bg-blue-700 px-3 py-1 text-xs font-bold text-white">{scoreLabel}</dd>
                                </div>
                            </dl>
                            {territorio.servizi_vicini && (
                                <p className="mt-5 text-sm leading-7 text-slate-600">{territorio.servizi_vicini}</p>
                            )}
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-950">Valore professionale</h3>
                                    <p className="text-sm text-slate-500">Contratto, stabilità e welfare</p>
                                </div>
                                <BriefcaseBusiness className="h-8 w-8 text-blue-300" />
                            </div>
                            <dl className="space-y-4 text-sm">
                                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                                    <dt className="text-slate-500">CCNL</dt>
                                    <dd className="text-right font-medium text-slate-900">{ccnlLabel}</dd>
                                </div>
                                <div className="flex justify-between gap-4 pb-1">
                                    <dt className="text-slate-500">Stabilità</dt>
                                    <dd className="text-right font-medium text-slate-900">{valore.stabilita_lavorativa || 'N/D'}</dd>
                                </div>
                            </dl>

                            {welfareItems.length > 0 && (
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {welfareItems.map(item => (
                                        <span
                                            key={item}
                                            className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-slate-800"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-8 text-center">
                        <MapPin className="mx-auto h-6 w-6 text-blue-700" />
                        <p className="mt-3 text-sm font-medium text-slate-900">
                            {[ente?.indirizzo, ente?.cap, comuneOrProvincia, ente?.regione].filter(Boolean).join(' - ')}
                        </p>
                        {ente?.latitudine !== null && ente?.latitudine !== undefined && ente?.longitudine !== null && ente?.longitudine !== undefined && (
                            <p className="mt-2 text-xs text-slate-500">
                                Coordinate: {ente.latitudine}, {ente.longitudine}
                            </p>
                        )}
                        {mapsHref && (
                            <a
                                href={mapsHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline"
                            >
                                Apri in Google Maps
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        )}
                        {ente?.updated_at && (
                            <p className="mt-3 text-xs text-slate-500">
                                Record aggiornato il {formatDateIT(ente.updated_at)}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto max-w-6xl px-6">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Lo sapevi?</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Curiosità sull&apos;ente</h2>
                    <div className="mt-8 grid gap-6 lg:grid-cols-3">
                        {[curiosita.fatto1, curiosita.fatto2, curiosita.fatto3].map((fatto, index) => (
                            <div key={index} className="rounded-[24px] border border-slate-200 bg-white p-7 shadow-sm">
                                <div className="text-4xl font-semibold tracking-tight text-slate-200">
                                    {String(index + 1).padStart(2, '0')}
                                </div>
                                <p className="mt-3 text-sm leading-7 text-slate-700">
                                    {fatto || 'Curiosità non ancora disponibile.'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-slate-100 py-16">
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="grid gap-10 lg:grid-cols-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Hai domande?</p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Domande frequenti</h2>
                            <p className="mt-3 text-sm text-slate-600">
                                Risposte rapide per orientarti su sede, territorio e contratto applicato.
                            </p>
                        </div>
                        <div className="space-y-4">
                            {faq.length > 0 ? faq.map(item => (
                                <div key={item.question} className="border-b border-slate-200 pb-4">
                                    <div className="flex items-start gap-3 text-sm font-semibold text-slate-950">
                                        <span className="rounded bg-blue-700 px-2 py-0.5 text-xs font-bold text-white">Q</span>
                                        <span>{item.question}</span>
                                    </div>
                                    <p className="pl-9 pt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
                                </div>
                            )) : (
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                                    FAQ non ancora disponibili per questo ente.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-slate-950 py-16">
                <div className="container mx-auto max-w-4xl px-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Non perderti nulla</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                        Ricevi gli aggiornamenti sui concorsi di {ente.ente_nome}
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                        Segui i nuovi bandi, controlla la scheda ente e accedi rapidamente alle opportunità pubbliche collegate.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href={`/signup?ente=${slug}`}
                            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
                        >
                            Attiva notifiche
                            <Bell className="h-4 w-4" />
                        </Link>
                        <Link
                            href={`/concorsi?ente=${slug}`}
                            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
                        >
                            Tutti i concorsi
                        </Link>
                    </div>

                    {(website || mapsHref || socialLinks.length > 0 || regioneSlug || provinciaSlug) && (
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-300">
                            {website && (
                                <a href={website} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                                    Sito istituzionale
                                </a>
                            )}
                            {mapsHref && (
                                <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                                    Mappa
                                </a>
                            )}
                            {regioneSlug && (
                                <Link href={`/regione/${regioneSlug}`} className="hover:text-white">
                                    Concorsi in {ente?.regione}
                                </Link>
                            )}
                            {provinciaSlug && (
                                <Link href={`/provincia/${provinciaSlug}`} className="hover:text-white">
                                    Concorsi a {ente?.provincia}
                                </Link>
                            )}
                            {socialLinks.map(link => (
                                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    )}

                    {ente?.last_enriched_at && (
                        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">
                            <CircleAlert className="h-4 w-4" />
                            Scheda aggiornata il {formatDateIT(ente.last_enriched_at)}
                        </div>
                    )}
                    {ente?.created_at && (
                        <p className="mt-4 text-xs text-slate-400">
                            Scheda creata il {formatDateIT(ente.created_at)}
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}
