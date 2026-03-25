import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createCachedPublicClient, createStaticClient } from '@/lib/supabase/server';
import { getConcorsoBySlug, getRelatedConcorsi, getAllConcorsiSlugs, getEnteBySlug, getEnteByName } from '@/lib/supabase/queries';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import {
    parseRegioni, parseProvince, parseSettori, parseLinkAllegati,
    parseRequisiti, normaliseLink, getAllegatoCount, getUrgencyLevel,
    getUrgencyLabel, getUrgencyColor,
    parseCapacita, parseConoscenze, stripHtmlStyling, formatConcorsoTitle,
    formatHtmlDescription
} from '@/lib/utils/concorso';
import { formatDateIT, isExpired } from '@/lib/utils/date';
import {
    MapPin, CalendarDays, Users, Building2, FileText, ExternalLink,
    AlertTriangle, CheckCircle, ChevronRight, Download, Globe, Phone, Landmark, Train, BriefcaseBusiness, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { toUrlSlug } from '@/lib/utils/regioni';
import { cn } from '@/lib/utils/cn';
import { ProAccountCTA } from '@/components/ui/pro-account-cta';
import { SaveButton } from '@/components/concorsi/SaveButton';
import { ShareButton } from '@/components/concorsi/ShareButton';
import { SintesiSection, type SintesiItem } from '@/components/concorsi/SintesiSection';
import type {
    EnteAnalisiLogistica,
    EnteFaqItem,
    EnteIdentitaIstituzionale,
    EnteValoreProfessionale,
    EnteVivereTerritorio,
    JsonValue
} from '@/types/ente';
import { getServerAppUrl } from '@/lib/auth/url';

interface Props {
    params: Promise<{ slug: string }>;
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

function toAbsoluteUrl(url: string | null | undefined, baseUrl: string): string | undefined {
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('//')) return `https:${url}`;
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
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

interface ContactField {
    label: string;
    value: string;
}

function parseContactFields(rawContacts: string | null | undefined): ContactField[] {
    if (!rawContacts) return [];
    const raw = rawContacts.trim();
    if (!raw) return [];

    const toFields = (obj: Record<string, unknown>): ContactField[] => (
        Object.entries(obj)
            .map(([label, value]) => ({
                label: label.trim(),
                value: typeof value === 'string' ? value.trim() : String(value ?? '').trim(),
            }))
            .filter((field) => field.label.length > 0 && field.value.length > 0)
    );

    let candidate: unknown = raw;
    for (let i = 0; i < 2; i += 1) {
        if (typeof candidate !== 'string') break;
        try {
            candidate = JSON.parse(candidate);
            if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
                return toFields(candidate as Record<string, unknown>);
            }
        } catch {
            break;
        }
    }
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        return toFields(candidate as Record<string, unknown>);
    }

    const regexPairs = (source: string): ContactField[] => {
        const pairs: ContactField[] = [];
        const matcher = /"([^"]+)"\s*:\s*"([^"]*)"/g;
        let match = matcher.exec(source);
        while (match) {
            const [, key, value] = match;
            const label = key.trim();
            const cleanedValue = value.trim();
            if (label && cleanedValue) {
                pairs.push({ label, value: cleanedValue });
            }
            match = matcher.exec(source);
        }
        return pairs;
    };

    const regexParsed = regexPairs(raw);
    if (regexParsed.length > 0) {
        return regexParsed;
    }
    const regexParsedEscaped = regexPairs(raw.replace(/\\"/g, '"'));
    if (regexParsedEscaped.length > 0) {
        return regexParsedEscaped;
    }

    const fallbackEntries = raw
        .replace(/^\{+|\}+$/g, '')
        .split(/\n|;|\|/)
        .map((item) => item.trim())
        .filter(Boolean);

    if (fallbackEntries.length === 0) return [];

    const parsedEntries = fallbackEntries
        .map((entry) => {
            const [labelPart, ...rest] = entry.split(':');
            const value = rest.join(':').trim();
            const label = labelPart?.trim() || 'Contatti';
            if (!value) return null;
            return { label, value };
        })
        .filter((entry): entry is ContactField => Boolean(entry));

    if (parsedEntries.length > 0) return parsedEntries;

    return [{ label: 'Contatti', value: raw }];
}

function getContactFieldHref(label: string, value: string): string | null {
    const cleanedValue = value.trim();
    const normalizedLabel = label.toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailPattern.test(cleanedValue)) {
        return `mailto:${cleanedValue}`;
    }

    if (
        normalizedLabel.includes('telefono')
        || normalizedLabel.includes('cellulare')
        || normalizedLabel.includes('fax')
        || normalizedLabel.includes('supporto')
    ) {
        const phoneCandidate = cleanedValue.replace(/[^\d+]/g, '');
        if (phoneCandidate.length >= 6) {
            return `tel:${phoneCandidate}`;
        }
    }

    if (/^https?:\/\//i.test(cleanedValue)) {
        return cleanedValue;
    }
    if (/^www\./i.test(cleanedValue)) {
        return `https://${cleanedValue}`;
    }

    return null;
}

function formatTimeIT(value: string | null | undefined): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Rome',
    }).format(date);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const supabase = createStaticClient();
    const concorso = await getConcorsoBySlug(supabase, slug);
    if (!concorso) return { title: 'Concorso non trovato' };

    const expired = isExpired(concorso.data_scadenza);
    const title = `${expired ? '[SCADUTO] ' : ''}${concorso.titolo_breve ?? concorso.titolo}`;

    return {
        title,
        description: concorso.riassunto ?? `Concorso pubblico indetto da ${concorso.ente_nome ?? 'ente pubblico'}. Scadenza: ${formatDateIT(concorso.data_scadenza)}.`,
        openGraph: { title, description: concorso.riassunto ?? undefined },
        alternates: {
            canonical: `/concorsi/${slug}`,
        },
    };
}

export async function generateStaticParams() {
    const supabase = createStaticClient();
    const slugs = await getAllConcorsiSlugs(supabase);
    return slugs.map(slug => ({ slug }));
}

export const revalidate = 3600;

export default async function ConcorsoDetailPage({ params }: Props) {
    const { slug } = await params;
    const supabase = createCachedPublicClient({ revalidate, tags: ['public:concorso-detail'] });
    const concorso = await getConcorsoBySlug(supabase, slug);
    if (!concorso) notFound();
    const isGuestUser = true;

    const expired = isExpired(concorso.data_scadenza) || concorso.status === 'CLOSED';
    const regioni = parseRegioni(concorso);
    const province = parseProvince(concorso);
    const settori = parseSettori(concorso);
    const linkAllegati = parseLinkAllegati(concorso);
    const requisiti = parseRequisiti(concorso);
    const capacita = parseCapacita(concorso);
    const conoscenze = parseConoscenze(concorso);
    const allegatoCount = getAllegatoCount(concorso);
    const urgencyLevel = getUrgencyLevel(concorso.data_scadenza, concorso.status);
    const urgencyLabel = getUrgencyLabel(concorso.data_scadenza, concorso.status);
    const urgencyColor = getUrgencyColor(concorso.data_scadenza, concorso.status);
    const compactUrgencyLabel = urgencyLabel
        ? urgencyLabel.replace(/^Scade (tra|in)\s+/i, '')
        : null;

    const uxHighlights = parseJson<{ the_hook?: unknown; critical_alert?: unknown }>(concorso.ux_highlights, {});
    const hookItems = Array.isArray(uxHighlights.the_hook) ? uxHighlights.the_hook : [];
    const alertItems = Array.isArray(uxHighlights.critical_alert) ? uxHighlights.critical_alert : [];
    const summaryItems: SintesiItem[] = [
        ...hookItems
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .map((item, i) => ({
                id: `hook-${i}`,
                type: 'Punto di forza' as const,
                description: item.trim(),
                colorClass: 'text-emerald-600 dark:text-emerald-400'
            })),
        ...alertItems
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .map((item, i) => ({
                id: `alert-${i}`,
                type: 'Importante' as const,
                description: item.trim(),
                colorClass: 'text-amber-600 dark:text-amber-400'
            }))
    ];

    const related = await getRelatedConcorsi(supabase, concorso.concorso_id, {
        enteSlug: concorso.ente_slug,
        enteNome: concorso.ente_nome,
        province,
        settori,
        limit: 4,
    });
    let ente = concorso.ente_slug ? await getEnteBySlug(supabase, concorso.ente_slug) : null;
    if (!ente && concorso.ente_nome) {
        ente = await getEnteByName(supabase, concorso.ente_nome);
    }

    const identita = parseJson<EnteIdentitaIstituzionale>(ente?.identita_istituzionale, {});
    const logistica = parseJson<EnteAnalisiLogistica>(ente?.analisi_logistica, {});
    const territorio = parseJson<EnteVivereTerritorio>(ente?.vivere_il_territorio, {});
    const valore = parseJson<EnteValoreProfessionale>(ente?.valore_professionale, {});
    const faq = parseJson<EnteFaqItem[]>(ente?.faq_schema, []).slice(0, 4);
    const ccnlLabel = valore.ccnl_standard || 'Non disponibile';
    const scoreLabel = toScoreLabel(territorio.qualita_vita_score);
    const welfareItems = splitWelfare(valore.welfare_tahmini);
    const website = normaliseWebsite(ente?.sito_istituzionale ?? null);
    const phoneHref = normalisePhone(ente?.telefono ?? null);
    const mapsQuery = [ente?.indirizzo, ente?.cap, ente?.comune ?? ente?.provincia, ente?.regione]
        .filter(Boolean)
        .join(', ');
    const mapsHref = mapsQuery
        ? `https://maps.google.com/?q=${encodeURIComponent(mapsQuery)}`
        : null;

    // JSON-LD
    const appUrl = getServerAppUrl();
    const canonicalUrl = `${appUrl}/concorsi/${slug}`;
    const hiringOrgLogoUrl = toAbsoluteUrl(
        ente?.logo_url ?? concorso.favicon_url ?? null,
        appUrl
    );
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: concorso.titolo,
        description: concorso.riassunto ?? concorso.titolo,
        datePosted: concorso.data_pubblicazione,
        validThrough: concorso.data_scadenza,
        hiringOrganization: {
            '@type': 'Organization',
            name: concorso.ente_nome ?? '',
            sameAs: normaliseLink(concorso.link_sito_pa),
            logo: hiringOrgLogoUrl,
        },
        jobLocation: {
            '@type': 'Place',
            address: {
                '@type': 'PostalAddress',
                addressRegion: regioni[0] ?? '',
                addressLocality: province[0] ?? '',
                addressCountry: 'IT',
            },
        },
        totalJobOpenings: concorso.num_posti ?? undefined,
        employmentType: concorso.is_remote ? 'TELECOMMUTE' : 'FULL_TIME',
    };
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: appUrl },
            { '@type': 'ListItem', position: 2, name: 'Concorsi', item: `${appUrl}/concorsi` },
            { '@type': 'ListItem', position: 3, name: formatConcorsoTitle(concorso.titolo_breve ?? concorso.titolo), item: canonicalUrl },
        ],
    };
    const pageJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: formatConcorsoTitle(concorso.titolo_breve ?? concorso.titolo),
        url: canonicalUrl,
        inLanguage: 'it-IT',
        description: concorso.riassunto ?? `Dettagli del concorso ${concorso.titolo}.`,
        isPartOf: {
            '@type': 'WebSite',
            name: 'Concoro',
            url: appUrl,
        },
        about: {
            '@type': 'Organization',
            name: concorso.ente_nome ?? 'Ente pubblico',
        },
    };
    const faqJsonLd = faq.length > 0 ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    } : null;
    const fullTitle = formatConcorsoTitle(concorso.titolo);
    const shortTitle = concorso.titolo_breve ? formatConcorsoTitle(concorso.titolo_breve) : null;
    const useShortHeroTitle = Boolean(shortTitle && fullTitle.length > 110 && shortTitle.length >= 18);
    const heroTitle = useShortHeroTitle ? shortTitle! : fullTitle;
    const breadcrumbTailLabel = concorso.ente_nome ?? formatConcorsoTitle(concorso.titolo_breve ?? concorso.titolo);
    const primaryPlace = province[0] ?? regioni[0] ?? 'Italia';
    const enteHeroImage = ente?.cover_image_url ?? ente?.logo_url ?? null;
    const contactFields = parseContactFields(concorso.contatti);
    const hasContactFields = contactFields.length > 0;
    const hasDescriptionContent = Boolean(
        concorso.descrizione && stripHtmlStyling(concorso.descrizione).trim().length > 0
    );
    const hasMainDetailContent = Boolean(
        concorso.descrizione
        || requisiti.length > 0
        || concorso.programma_di_esame
        || capacita.length > 0
        || conoscenze.length > 0
        || hasContactFields
        || linkAllegati.length > 0
        || concorso.annuncio_enrichment
    );

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
            {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

            <div className="relative overflow-hidden bg-[hsl(210,55%,98%)] text-slate-900 [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 10% 8%, rgba(14,47,80,0.17), transparent 35%), radial-gradient(circle at 90% 10%, rgba(16,185,129,0.12), transparent 34%), repeating-linear-gradient(90deg, rgba(10,53,91,0.035) 0 1px, transparent 1px 84px)',
                    }}
                />

                <div className="relative border-b border-slate-200 bg-white/85">
                    <div className="container mx-auto max-w-[78rem] px-4 py-3 text-sm text-slate-500">
                        <nav className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
                            <Link href="/" className="shrink-0 hover:text-slate-900">Home</Link>
                            <ChevronRight className="h-4 w-4 shrink-0" />
                            <Link href="/concorsi" className="shrink-0 hover:text-slate-900">Concorsi</Link>
                            <ChevronRight className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 truncate font-medium text-slate-900">{breadcrumbTailLabel}</span>
                        </nav>
                    </div>
                </div>

                <header className="relative px-4 pb-12 pt-10 md:pb-16">
                    <div className="container mx-auto grid max-w-[78rem] gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-300/80 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-slate-700 backdrop-blur-sm">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Scheda ufficiale
                                </div>
                                {urgencyLabel && (
                                    <span className={cn(
                                        'ml-auto inline-flex min-w-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em]',
                                        urgencyColor
                                    )}>
                                        <span className={cn(
                                            'h-2 w-2 shrink-0 rounded-full animate-pulse',
                                            urgencyLevel === 0 ? 'bg-gray-400' :
                                                urgencyLevel === 1 ? 'bg-red-500' :
                                                    urgencyLevel === 2 ? 'bg-orange-500' :
                                                        urgencyLevel === 3 ? 'bg-yellow-500' :
                                                            'bg-emerald-500'
                                        )} />
                                        <span className="truncate">{compactUrgencyLabel ?? urgencyLabel}</span>
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {concorso.favicon_url
                                    ? <img src={concorso.favicon_url} alt="" className="h-7 w-7 rounded object-contain" />
                                    : <Building2 className="h-5 w-5 text-slate-500" />
                                }
                            {concorso.ente_slug
                                    ? <Link href={`/ente/${concorso.ente_slug}`} className="text-sm font-semibold text-slate-700 hover:text-[#0A4E88] transition-colors">
                                        {concorso.ente_nome}
                                    </Link>
                                    : <span className="text-sm font-semibold text-slate-700">{concorso.ente_nome}</span>
                                }
                            </div>

                            <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] max-w-3xl break-words text-balance text-[clamp(1.9rem,8vw,2.75rem)] font-semibold leading-[1.08] tracking-tight text-slate-900 [overflow-wrap:anywhere] md:text-5xl">
                                {heroTitle}
                            </h1>

                            {useShortHeroTitle && (
                                <p className="max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
                                    {fullTitle}
                                </p>
                            )}

                            {concorso.riassunto && (
                                <p className="max-w-3xl rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm leading-relaxed text-slate-700">
                                    {concorso.riassunto}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-3">
                                {!expired && concorso.link_reindirizzamento && (
                                    <a
                                        href={concorso.link_reindirizzamento}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        Vai al portale candidatura
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                )}
                                {!expired && normaliseLink(concorso.link_sito_pa) && (
                                    <a
                                        href={normaliseLink(concorso.link_sito_pa)!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                                    >
                                        <Globe className="h-4 w-4" />
                                        Sito dell&apos;ente
                                    </a>
                                )}
                            </div>
                        </div>

                        <aside className="space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_14px_44px_-30px_rgba(15,23,42,0.45)]">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-500">Panoramica rapida</p>
                                    <div className="flex items-center gap-2">
                                        {concorso.slug && (
                                            <ShareButton
                                                title={formatConcorsoTitle(concorso.titolo_breve ?? concorso.titolo)}
                                                slug={concorso.slug}
                                                iconOnly
                                                className="h-9 w-9 rounded-full"
                                            />
                                        )}
                                        <SaveButton concorsoId={concorso.concorso_id} />
                                    </div>
                                </div>
                                <dl className="mt-3 grid gap-2 text-sm">
                                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <dt className="text-slate-500">Scadenza</dt>
                                        <dd className="text-right font-semibold text-slate-900">{concorso.data_scadenza ? formatDateIT(concorso.data_scadenza) : 'N/D'}</dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <dt className="text-slate-500">Posti</dt>
                                        <dd className="text-right font-semibold text-slate-900">{concorso.num_posti ?? 'N/D'}</dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <dt className="text-slate-500">Luogo</dt>
                                        <dd className="text-right font-semibold text-slate-900">{primaryPlace}</dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <dt className="text-slate-500">Tipo procedura</dt>
                                        <dd className="text-right font-semibold text-slate-900">{concorso.tipo_procedura ? concorso.tipo_procedura.replace('_', ' ').toLowerCase() : 'N/D'}</dd>
                                    </div>
                                    {concorso.collocazione_organizzativa && (
                                        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                            <dt className="text-slate-500">Collocazione</dt>
                                            <dd className="text-right font-semibold text-slate-900">{concorso.collocazione_organizzativa}</dd>
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <dt className="text-slate-500">Settore</dt>
                                        <dd className="text-right font-semibold text-slate-900">
                                            {settori.length > 0 ? (
                                                <span className="inline-flex flex-wrap justify-end gap-1">
                                                    {settori.slice(0, 3).map((s) => (
                                                        <Link
                                                            key={s}
                                                            href={`/settore/${encodeURIComponent(s)}`}
                                                            className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] text-slate-700 transition hover:bg-slate-100"
                                                        >
                                                            {s}
                                                        </Link>
                                                    ))}
                                                </span>
                                            ) : 'N/D'}
                                        </dd>
                                    </div>
                                </dl>
                                {(enteHeroImage || (ente?.comune ?? ente?.provincia ?? ente?.regione) || concorso.ente_nome) && (
                                    concorso.ente_slug ? (
                                        <Link
                                            href={`/ente/${concorso.ente_slug}`}
                                            className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 hover:bg-slate-100"
                                        >
                                            {enteHeroImage ? (
                                                <img
                                                    src={enteHeroImage}
                                                    alt={`${concorso.ente_nome ?? 'Ente'} immagine`}
                                                    className="h-14 w-20 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-slate-200 bg-white">
                                                    <Building2 className="h-5 w-5 text-slate-500" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Ente</p>
                                                <p className="line-clamp-1 text-sm font-semibold text-slate-900">{concorso.ente_nome ?? 'Ente pubblico'}</p>
                                                <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
                                                    {[ente?.comune ?? ente?.provincia, ente?.regione].filter(Boolean).join(', ') || 'Italia'}
                                                </p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-400" />
                                        </Link>
                                    ) : (
                                        <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                            {enteHeroImage ? (
                                                <img
                                                    src={enteHeroImage}
                                                    alt={`${concorso.ente_nome ?? 'Ente'} immagine`}
                                                    className="h-14 w-20 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-slate-200 bg-white">
                                                    <Building2 className="h-5 w-5 text-slate-500" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Ente</p>
                                                <p className="line-clamp-1 text-sm font-semibold text-slate-900">{concorso.ente_nome ?? 'Ente pubblico'}</p>
                                                <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
                                                    {[ente?.comune ?? ente?.provincia, ente?.regione].filter(Boolean).join(', ') || 'Italia'}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </aside>
                    </div>
                </header>

                <div className="px-4 pb-14">
                    <div className="container mx-auto max-w-[78rem] space-y-10">
                        {expired && (
                            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold">Bando scaduto</p>
                                        <p className="mt-0.5 text-sm">
                                            Questo bando è scaduto il {formatDateIT(concorso.data_scadenza)}. Non è più possibile candidarsi.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(hasMainDetailContent || hasDescriptionContent) && (
                        <div className={cn(
                            'grid gap-8',
                            hasDescriptionContent ? 'lg:grid-cols-[1fr_320px]' : 'lg:grid-cols-1'
                        )}>
                            {hasMainDetailContent && <article className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                                {concorso.descrizione && (
                                    <section>
                                        <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl tracking-tight text-slate-900">Descrizione</h2>
                                        <div
                                            className="prose prose-slate mt-4 max-w-none text-sm leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: formatHtmlDescription(concorso.descrizione) }}
                                        />
                                    </section>
                                )}

                                {requisiti.length > 0 && (
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h2 className="text-lg font-semibold text-slate-900">Requisiti</h2>
                                        <ul className="mt-3 space-y-2">
                                            {requisiti.map((r, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                                                    <span>{r}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {concorso.programma_di_esame && (
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h2 className="text-lg font-semibold text-slate-900">Programma d&apos;esame</h2>
                                        <p className="mt-3 text-sm leading-relaxed text-slate-700">{concorso.programma_di_esame}</p>
                                    </section>
                                )}

                                {capacita.length > 0 && (
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h2 className="text-lg font-semibold text-slate-900">Capacità richieste</h2>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {capacita.map((c, i) => (
                                                <span key={i} className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">{c}</span>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {conoscenze.length > 0 && (
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h2 className="text-lg font-semibold text-slate-900">Conoscenze tecnico-specialistiche</h2>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {conoscenze.map((c, i) => (
                                                <span key={i} className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">{c}</span>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {hasContactFields && (
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h2 className="text-lg font-semibold text-slate-900">Contatti</h2>
                                        <dl className="mt-3 space-y-2.5 text-sm text-slate-700">
                                            {contactFields.map((field) => {
                                                const href = getContactFieldHref(field.label, field.value);
                                                const external = href ? /^https?:\/\//i.test(href) : false;

                                                return (
                                                    <div key={`${field.label}-${field.value}`} className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                                        <dt className="flex items-center gap-2 text-slate-500">
                                                            <Phone className="h-4 w-4 flex-shrink-0" />
                                                            <span>{field.label}</span>
                                                        </dt>
                                                        <dd className="min-w-0 break-words text-left font-medium text-slate-800 sm:max-w-[65%] sm:text-right">
                                                            {href ? (
                                                                <a
                                                                    href={href}
                                                                    target={external ? '_blank' : undefined}
                                                                    rel={external ? 'noopener noreferrer' : undefined}
                                                                    className="underline decoration-slate-300 underline-offset-2 transition hover:text-[#0A4E88]"
                                                                >
                                                                    {field.value}
                                                                </a>
                                                            ) : field.value}
                                                        </dd>
                                                    </div>
                                                );
                                            })}
                                        </dl>
                                    </section>
                                )}

                                {linkAllegati.length > 0 && (
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h2 className="text-lg font-semibold text-slate-900">Allegati ({allegatoCount})</h2>
                                        <div className="mt-3 space-y-2">
                                            {linkAllegati.map((url, i) => (
                                                <a
                                                    key={i}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm transition hover:border-slate-300 hover:bg-slate-100"
                                                >
                                                    <FileText className="h-4 w-4 flex-shrink-0 text-slate-500 transition group-hover:text-[#0A4E88]" />
                                                    <span className="min-w-0 flex-1 break-all leading-snug text-slate-800">
                                                        {concorso.allegati?.[i]?.label ?? `Allegato ${i + 1}`}
                                                    </span>
                                                    <Download className="h-4 w-4 flex-shrink-0 text-slate-500" />
                                                </a>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {concorso.annuncio_enrichment && (
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-2xl tracking-tight text-slate-900">Analisi approfondita</h2>
                                        <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                            {concorso.annuncio_enrichment.ccnl_focus && (
                                                <div className="p-4">
                                                    <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Inquadramento contrattuale</h3>
                                                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{concorso.annuncio_enrichment.ccnl_focus}</p>
                                                </div>
                                            )}
                                            {concorso.annuncio_enrichment.graduatoria_insight && (
                                                <div className="p-4">
                                                    <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Suggerimenti sulla graduatoria</h3>
                                                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{concorso.annuncio_enrichment.graduatoria_insight}</p>
                                                </div>
                                            )}
                                            {(concorso.annuncio_enrichment.livello_concorrenza || concorso.annuncio_enrichment.smart_working_guess) && (
                                                <div className="grid gap-4 p-4 md:grid-cols-2">
                                                    {concorso.annuncio_enrichment.livello_concorrenza && (
                                                        <div>
                                                            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Livello concorrenza</h3>
                                                            <p className="mt-1 text-sm font-medium text-slate-900">{concorso.annuncio_enrichment.livello_concorrenza}</p>
                                                        </div>
                                                    )}
                                                    {concorso.annuncio_enrichment.smart_working_guess && (
                                                        <div>
                                                            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Smart working</h3>
                                                            <p className="mt-1 text-sm font-medium text-slate-900">{concorso.annuncio_enrichment.smart_working_guess}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {concorso.annuncio_enrichment.normativa_summary && (
                                                <div className="p-4">
                                                    <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Sintesi normativa</h3>
                                                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{concorso.annuncio_enrichment.normativa_summary}</p>
                                                </div>
                                            )}
                                            {concorso.annuncio_enrichment.normativa_riferimento && Array.isArray(concorso.annuncio_enrichment.normativa_riferimento) && (
                                                <div className="p-4">
                                                    <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Riferimenti normativi</h3>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {concorso.annuncio_enrichment.normativa_riferimento.map((item: string, i: number) => (
                                                            <span key={i} className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                                                {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                )}
                            </article>}

                            {hasDescriptionContent && <aside className="space-y-6 lg:sticky lg:top-8">
                                {summaryItems.length > 0 ? (
                                    <SintesiSection items={summaryItems} />
                                ) : (
                                    isGuestUser ? (
                                        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.55)]">
                                            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0A4E88] via-sky-500 to-emerald-500" />
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Account gratuito</p>
                                            <h3 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-2 text-2xl leading-tight text-slate-900">
                                                Prima registrati, poi personalizza la ricerca.
                                            </h3>
                                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                                Inizia gratis: salvi i bandi migliori, imposti preferenze e continui dove avevi lasciato.
                                            </p>
                                            <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                                                    <span>Concorsi salvati e filtri personali sincronizzati</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                                                    <span>Dashboard pronta per monitorare i prossimi bandi</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                                                    <span>Registrazione veloce, meno di un minuto</span>
                                                </li>
                                            </ul>
                                            <Link
                                                href={`/signup?source=concorso-sidebar-register&concorso=${encodeURIComponent(slug)}`}
                                                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                            >
                                                Registrati gratis
                                            </Link>
                                        </div>
                                    ) : (
                                        <ProAccountCTA />
                                    )
                                )}

                                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_-30px_rgba(15,23,42,0.45)]">
                                        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300" />
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Percorsi utili</p>
                                        <h3 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-2 text-xl leading-tight text-slate-900">
                                            Esplora altri territori collegati a questo bando
                                        </h3>
                                        <div className="mt-4 space-y-3">
                                            {province.length > 0 && (
                                                <div>
                                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-500">Province</p>
                                                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                                        {province.slice(0, 4).map((p) => (
                                                            <Link key={p} href={`/provincia/${toUrlSlug(p)}`} className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-slate-700 transition hover:border-slate-400 hover:bg-slate-100">
                                                                {p}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {regioni.length > 0 && (
                                                <div>
                                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-500">Regioni</p>
                                                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                                        {regioni.slice(0, 3).map((r) => (
                                                            <Link key={r} href={`/regione/${toUrlSlug(r)}`} className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-slate-700 transition hover:border-slate-400 hover:bg-slate-100">
                                                                {r}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {concorso.ente_slug && (
                                                <Link href={`/ente/${concorso.ente_slug}`} className="inline-flex items-center gap-2 rounded-full border border-[#0A4E88]/30 bg-[#0A4E88]/5 px-3 py-1.5 text-xs font-semibold text-[#083861] transition hover:bg-[#0A4E88]/10">
                                                    Vai alla pagina ente
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                </Link>
                                            )}
                                        </div>
                                </div>
                            </aside>}
                        </div>
                        )}

                        {ente && (
                            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">Profilo ente</p>
                                        <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-1 text-3xl tracking-tight text-slate-900">Informazioni territoriali e professionali</h2>
                                    </div>
                                    {concorso.ente_slug && (
                                        <Link
                                            href={`/ente/${concorso.ente_slug}`}
                                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                        >
                                            Vai alla scheda ente
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    )}
                                </div>

                                <div className="grid gap-6 lg:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                                            <Landmark className="h-5 w-5 text-[#0A4E88]" />
                                            Identità istituzionale
                                        </h3>
                                        <p className="mt-3 text-sm leading-relaxed text-slate-700">
                                            {identita.descrizione || 'Profilo istituzionale non ancora disponibile per questo ente.'}
                                        </p>
                                        {identita.ruolo_territoriale && (
                                            <p className="mt-3 text-sm leading-relaxed text-slate-700">{identita.ruolo_territoriale}</p>
                                        )}
                                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                                                <p className="text-slate-500">Prestigio</p>
                                                <p className="mt-1 text-sm font-semibold text-slate-900">{identita.prestigio || 'N/D'}</p>
                                            </div>
                                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                                                <p className="text-slate-500">CCNL</p>
                                                <p className="mt-1 text-sm font-semibold text-slate-900">{ccnlLabel}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-lg font-semibold text-slate-900">Contatti e sede</h3>
                                        {(enteHeroImage || (ente?.comune ?? ente?.provincia ?? ente?.regione) || concorso.ente_nome) && (
                                            concorso.ente_slug ? (
                                                <Link
                                                    href={`/ente/${concorso.ente_slug}`}
                                                    className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:bg-slate-100"
                                                >
                                                    {enteHeroImage ? (
                                                        <img
                                                            src={enteHeroImage}
                                                            alt={`${concorso.ente_nome ?? 'Ente'} immagine`}
                                                            className="h-14 w-20 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                                                            <Building2 className="h-5 w-5 text-slate-500" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Ente</p>
                                                        <p className="line-clamp-1 text-sm font-semibold text-slate-900">{concorso.ente_nome ?? 'Ente pubblico'}</p>
                                                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
                                                            {[ente?.comune ?? ente?.provincia, ente?.regione].filter(Boolean).join(', ') || 'Italia'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                                </Link>
                                            ) : (
                                                <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                                    {enteHeroImage ? (
                                                        <img
                                                            src={enteHeroImage}
                                                            alt={`${concorso.ente_nome ?? 'Ente'} immagine`}
                                                            className="h-14 w-20 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                                                            <Building2 className="h-5 w-5 text-slate-500" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Ente</p>
                                                        <p className="line-clamp-1 text-sm font-semibold text-slate-900">{concorso.ente_nome ?? 'Ente pubblico'}</p>
                                                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
                                                            {[ente?.comune ?? ente?.provincia, ente?.regione].filter(Boolean).join(', ') || 'Italia'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                        <dl className="mt-4 space-y-3 text-sm text-slate-700">
                                            <div className="flex items-start justify-between gap-4">
                                                <dt className="text-slate-500">Indirizzo</dt>
                                                <dd className="text-right font-medium">{ente.indirizzo || 'N/D'}</dd>
                                            </div>
                                            <div className="flex items-start justify-between gap-4">
                                                <dt className="text-slate-500">Comune / Provincia</dt>
                                                <dd className="text-right font-medium">{[ente.comune || ente.provincia, ente.regione].filter(Boolean).join(', ') || 'N/D'}</dd>
                                            </div>
                                            <div className="flex items-start justify-between gap-4">
                                                <dt className="text-slate-500">Telefono</dt>
                                                <dd className="text-right font-medium">
                                                    {phoneHref ? <a href={`tel:${phoneHref}`} className="hover:underline">{ente.telefono}</a> : (ente.telefono || 'N/D')}
                                                </dd>
                                            </div>
                                            <div className="flex items-start justify-between gap-4">
                                                <dt className="text-slate-500">PEC</dt>
                                                <dd className="break-all text-right font-medium">
                                                    {ente.pec ? <a href={`mailto:${ente.pec}`} className="text-[#0A4E88] hover:underline">{ente.pec}</a> : 'N/D'}
                                                </dd>
                                            </div>
                                        </dl>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {website && (
                                                <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                                                    Sito istituzionale
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            )}
                                            {mapsHref && (
                                                <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                                                    Google Maps
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6 lg:grid-cols-3">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                                            <Train className="h-5 w-5 text-[#0A4E88]" />
                                            Logistica
                                        </h3>
                                        <p className="mt-3 text-sm text-slate-700"><strong className="text-slate-900">Pendolarismo:</strong> {logistica.pendolarismo || 'N/D'}</p>
                                        <p className="mt-2 text-sm text-slate-700"><strong className="text-slate-900">Stazione vicina:</strong> {logistica.stazione_vicina || 'N/D'}</p>
                                        <p className="mt-2 text-sm text-slate-700"><strong className="text-slate-900">Accessibilità mezzi:</strong> {logistica.accessibilita_mezzi || 'N/D'}</p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                                            <MapPin className="h-5 w-5 text-[#0A4E88]" />
                                            Vivere il territorio
                                        </h3>
                                        <p className="mt-3 text-sm text-slate-700"><strong className="text-slate-900">Costo vita:</strong> {territorio.costo_vita || 'N/D'}</p>
                                        <p className="mt-2 text-sm text-slate-700"><strong className="text-slate-900">Ambiente sociale:</strong> {territorio.ambiente_sociale || 'N/D'}</p>
                                        <p className="mt-2 text-sm text-slate-700"><strong className="text-slate-900">Qualità vita:</strong> {scoreLabel}</p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                                            <BriefcaseBusiness className="h-5 w-5 text-[#0A4E88]" />
                                            Valore professionale
                                        </h3>
                                        <p className="mt-3 text-sm text-slate-700"><strong className="text-slate-900">CCNL:</strong> {ccnlLabel}</p>
                                        <p className="mt-2 text-sm text-slate-700"><strong className="text-slate-900">Stabilità:</strong> {valore.stabilita_lavorativa || 'N/D'}</p>
                                        {welfareItems.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {welfareItems.map((item) => (
                                                    <span key={item} className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {faq.length > 0 && (
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <h3 className="text-lg font-semibold text-slate-900">FAQ sull&apos;ente</h3>
                                        <div className="mt-4 space-y-3">
                                            {faq.map((item) => (
                                                <article key={item.question} className="rounded-xl border border-slate-200 bg-white p-4">
                                                    <h4 className="text-sm font-semibold text-slate-900">{item.question}</h4>
                                                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.answer}</p>
                                                </article>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </section>
                        )}

                        {!expired && related.length > 0 && (
                            <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                                <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl tracking-tight text-slate-900">Concorsi correlati</h2>
                                <div className="mt-5">
                                    <ConcorsoList concorsi={related} />
                                </div>
                            </section>
                        )}

                        {concorso.data_pubblicazione && (
                            <section className="rounded-xl border border-slate-200/80 bg-white/70 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-start gap-2">
                                        <CalendarDays className="mt-0.5 h-3.5 w-3.5 text-slate-500" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Pubblicato</p>
                                            <p className="text-xs font-medium text-slate-700">
                                                {formatDateIT(concorso.data_pubblicazione)}
                                                {formatTimeIT(concorso.data_pubblicazione) ? ` - ${formatTimeIT(concorso.data_pubblicazione)}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                        ID: <span className="font-medium text-slate-700">{concorso.concorso_id}</span>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
