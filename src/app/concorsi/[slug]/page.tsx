import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient, createStaticClient } from '@/lib/supabase/server';
import { getConcorsoBySlug, getRelatedConcorsi, getAllConcorsiSlugs } from '@/lib/supabase/queries';
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
    AlertTriangle, CheckCircle, ChevronRight, Download, Globe, Phone
} from 'lucide-react';
import Link from 'next/link';
import { toUrlSlug } from '@/lib/utils/regioni';
import { cn } from '@/lib/utils/cn';
import { CardStack } from '@/components/ui/card-stack';
import { ProAccountCTA } from '@/components/ui/pro-account-cta';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();
    const concorso = await getConcorsoBySlug(supabase, slug);
    if (!concorso) return { title: 'Concorso non trovato' };

    const expired = isExpired(concorso.data_scadenza);
    const title = `${expired ? '[SCADUTO] ' : ''}${concorso.titolo_breve ?? concorso.titolo}`;

    return {
        title,
        description: concorso.riassunto ?? `Concorso pubblico indetto da ${concorso.ente_nome ?? 'ente pubblico'}. Scadenza: ${formatDateIT(concorso.data_scadenza)}.`,
        openGraph: { title, description: concorso.riassunto ?? undefined },
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
    const supabase = await createClient();
    const concorso = await getConcorsoBySlug(supabase, slug);
    if (!concorso) notFound();

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

    // Safety check for CardStack data
    const highlightCards = [
        ...(concorso.ux_highlights?.the_hook?.map((item: string, i: number) => ({
            id: `hook-${i}`,
            title: "Punto di forza",
            description: item,
            badge: "Punto di forza",
            badgeColor: "bg-blue-100 text-blue-700",
            color: "#eff6ff"
        })) || []),
        ...(concorso.ux_highlights?.critical_alert?.map((item: string, i: number) => ({
            id: `alert-${i}`,
            title: "Da non dimenticare",
            description: item,
            badge: "Importante",
            badgeColor: "bg-amber-100 text-amber-700",
            color: "#fffbeb"
        })) || [])
    ];

    const related = await getRelatedConcorsi(supabase, concorso.concorso_id, settori, regioni);

    // JSON-LD
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

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="container max-w-6xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
                    <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href="/concorsi" className="hover:text-foreground transition-colors">Concorsi</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground line-clamp-1">{formatConcorsoTitle(concorso.titolo_breve ?? concorso.titolo)}</span>
                </nav>

                {/* Expired warning */}
                {expired && (
                    <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-sm">Bando scaduto</p>
                            <p className="text-sm mt-0.5">
                                Questo bando è scaduto il {formatDateIT(concorso.data_scadenza)}. Non è più possibile candidarsi.
                            </p>
                        </div>
                    </div>
                )}

                {/* Grid Layout */}
                <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">
                    {/* Main Content Column */}
                    <div className="space-y-8">
                        {/* Main card */}
                        <div className="bg-white rounded-xl border border-border p-6 space-y-6">
                            {/* Header */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    {concorso.favicon_url
                                        ? <img src={concorso.favicon_url} alt="" className="w-6 h-6 rounded object-contain" />
                                        : <Building2 className="w-5 h-5 text-muted-foreground" />
                                    }
                                    {concorso.ente_slug
                                        ? <Link href={`/ente/${concorso.ente_slug}`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                            {concorso.ente_nome}
                                        </Link>
                                        : <span className="text-sm text-muted-foreground">{concorso.ente_nome}</span>
                                    }
                                    {urgencyLabel && (
                                        <div className={cn(
                                            "ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border",
                                            urgencyColor
                                        )}>
                                            <span className={cn(
                                                "w-2 h-2 rounded-full animate-pulse",
                                                urgencyLevel === 0 ? "bg-gray-400" :
                                                    urgencyLevel === 1 ? "bg-red-500" :
                                                        urgencyLevel === 2 ? "bg-orange-500" :
                                                            urgencyLevel === 3 ? "bg-yellow-500" :
                                                                "bg-emerald-500"
                                            )} />
                                            {urgencyLabel}
                                        </div>
                                    )}
                                </div>
                                <h1 className="text-2xl font-semibold tracking-tight">{formatConcorsoTitle(concorso.titolo)}</h1>
                                {concorso.titolo_breve && concorso.titolo_breve !== concorso.titolo && (
                                    <p className="text-muted-foreground mt-1">{formatConcorsoTitle(concorso.titolo_breve)}</p>
                                )}
                                {/* Settori */}
                                {settori.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {settori.map(s => (
                                            <Link key={s} href={`/settore/${encodeURIComponent(s)}`}
                                                className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors">
                                                {s}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Key details */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                                {(province.length > 0 || regioni.length > 0) && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Luogo</p>
                                            <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm font-medium">
                                                {province.map((p, i) => (
                                                    <span key={p}>
                                                        <Link href={`/provincia/${toUrlSlug(p)}`} className="text-primary hover:underline transition-all">
                                                            {p}
                                                        </Link>
                                                        {i < province.length - 1 || regioni.length > 0 ? <span className="text-muted-foreground">, </span> : null}
                                                    </span>
                                                ))}
                                                {regioni.map((r, i) => (
                                                    <span key={r}>
                                                        <Link href={`/regione/${toUrlSlug(r)}`} className="text-primary hover:underline transition-all">
                                                            {r}
                                                        </Link>
                                                        {i < regioni.length - 1 ? <span className="text-muted-foreground">, </span> : null}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {!province.length && !regioni.length && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Luogo</p>
                                            <p className="text-sm font-medium">Italia</p>
                                        </div>
                                    </div>
                                )}
                                {concorso.data_scadenza && (
                                    <div className="flex items-start gap-2">
                                        <CalendarDays className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Scadenza</p>
                                            <p className="text-sm font-medium">{formatDateIT(concorso.data_scadenza)}</p>
                                        </div>
                                    </div>
                                )}
                                {concorso.num_posti && (
                                    <div className="flex items-start gap-2">
                                        <Users className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Posti</p>
                                            <p className="text-sm font-medium">{concorso.num_posti}</p>
                                        </div>
                                    </div>
                                )}
                                {concorso.tipo_procedura && (
                                    <div className="flex items-start gap-2">
                                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tipo</p>
                                            <p className="text-sm font-medium capitalize">{concorso.tipo_procedura.replace('_', ' ').toLowerCase()}</p>
                                        </div>
                                    </div>
                                )}
                                {concorso.data_pubblicazione && (
                                    <div className="flex items-start gap-2">
                                        <CalendarDays className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Pubblicato</p>
                                            <p className="text-sm font-medium">{formatDateIT(concorso.data_pubblicazione)}</p>
                                        </div>
                                    </div>
                                )}
                                {concorso.collocazione_organizzativa && (
                                    <div className="flex items-start gap-2">
                                        <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Collocazione</p>
                                            <p className="text-sm font-medium">{concorso.collocazione_organizzativa}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* AI Summary */}
                            {concorso.riassunto && (
                                <div className="rounded-lg p-5" style={{ backgroundImage: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)' }}>
                                    <p className="text-xs font-semibold text-blue-900/70 mb-2 uppercase tracking-wide">Riepilogo</p>
                                    <p className="text-sm text-blue-900 leading-relaxed">{concorso.riassunto}</p>
                                </div>
                            )}

                            {/* Description */}
                            {concorso.descrizione && (
                                <div>
                                    <h2 className="text-lg font-semibold mb-3">Descrizione</h2>
                                    <div
                                        className="prose prose-sm max-w-none text-sm leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: formatHtmlDescription(concorso.descrizione) }}
                                    />
                                </div>
                            )}

                            {/* Requisiti */}
                            {requisiti.length > 0 && (
                                <div className="border border-border rounded-lg p-5">
                                    <h2 className="text-lg font-semibold mb-4">Requisiti</h2>
                                    <ul className="space-y-2">
                                        {requisiti.map((r, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>{r}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Programma esame */}
                            {concorso.programma_di_esame && (
                                <div className="border border-border rounded-lg p-5">
                                    <h2 className="text-lg font-semibold mb-3">Programma d&apos;Esame</h2>
                                    <p className="text-sm leading-relaxed text-muted-foreground">{concorso.programma_di_esame}</p>
                                </div>
                            )}

                            {/* Capacità */}
                            {capacita.length > 0 && (
                                <div className="border border-border rounded-lg p-5">
                                    <h2 className="text-lg font-semibold mb-3">Capacità Richieste</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {capacita.map((c, i) => (
                                            <span key={i} className="text-xs bg-secondary px-2.5 py-1 rounded-full">{c}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Conoscenze */}
                            {conoscenze.length > 0 && (
                                <div className="border border-border rounded-lg p-5">
                                    <h2 className="text-lg font-semibold mb-3">Conoscenze Tecnico-Specialistiche</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {conoscenze.map((c, i) => (
                                            <span key={i} className="text-xs bg-secondary px-2.5 py-1 rounded-full">{c}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contatti */}
                            {concorso.contatti && (
                                <div className="border border-border rounded-lg p-5">
                                    <h2 className="text-lg font-semibold mb-2">Contatti</h2>
                                    <p className="text-sm flex items-center gap-2 text-muted-foreground">
                                        <Phone className="w-4 h-4" />
                                        {concorso.contatti}
                                    </p>
                                </div>
                            )}

                            {/* Action buttons — hidden for expired */}
                            {!expired && (
                                <div className="space-y-3 pt-2">
                                    {concorso.link_reindirizzamento && (
                                        <a href={concorso.link_reindirizzamento} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity">
                                            Vai al Portale di Candidatura
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                    {normaliseLink(concorso.link_sito_pa) && (
                                        <a href={normaliseLink(concorso.link_sito_pa)!} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-2.5 px-6 border border-border font-medium rounded-xl hover:bg-secondary transition-colors text-sm">
                                            <Globe className="w-4 h-4" />
                                            Sito dell&apos;Ente
                                            <ExternalLink className="w-4 h-4 opacity-50" />
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* PDF Downloads — always visible */}
                            {linkAllegati.length > 0 && (
                                <div>
                                    <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                                        <Download className="w-4 h-4" />
                                        Allegati ({allegatoCount})
                                    </h2>
                                    <div className="space-y-2">
                                        {linkAllegati.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-secondary transition-colors group text-sm">
                                                <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                                <span className="flex-1 truncate">
                                                    {concorso.allegati?.[i]?.label ?? `Allegato ${i + 1}`}
                                                </span>
                                                <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Enrichment Deep Dive */}
                            {concorso.annuncio_enrichment && (
                                <div className="space-y-8 pt-8 border-t border-border mt-8">
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-semibold">Analisi Approfondita</h2>
                                        <div className="bg-white rounded-xl border border-border divide-y divide-border overflow-hidden">
                                            {concorso.annuncio_enrichment.ccnl_focus && (
                                                <div className="p-4">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Inquadramento contrattuale</h3>
                                                    <p className="text-sm leading-relaxed">{concorso.annuncio_enrichment.ccnl_focus}</p>
                                                </div>
                                            )}
                                            {concorso.annuncio_enrichment.graduatoria_insight && (
                                                <div className="p-4">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Suggerimenti sulla graduatoria</h3>
                                                    <p className="text-sm leading-relaxed">{concorso.annuncio_enrichment.graduatoria_insight}</p>
                                                </div>
                                            )}
                                            {(concorso.annuncio_enrichment.livello_concorrenza || concorso.annuncio_enrichment.smart_working_guess) && (
                                                <div className="p-4 grid grid-cols-2 gap-4">
                                                    {concorso.annuncio_enrichment.livello_concorrenza && (
                                                        <div>
                                                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Livello concorrenza</h3>
                                                            <p className="text-sm font-medium">{concorso.annuncio_enrichment.livello_concorrenza}</p>
                                                        </div>
                                                    )}
                                                    {concorso.annuncio_enrichment.smart_working_guess && (
                                                        <div>
                                                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Smart Working</h3>
                                                            <p className="text-sm font-medium">{concorso.annuncio_enrichment.smart_working_guess}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {concorso.annuncio_enrichment.normativa_summary && (
                                                <div className="p-4">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Sintesi normativa</h3>
                                                    <p className="text-sm leading-relaxed">{concorso.annuncio_enrichment.normativa_summary}</p>
                                                </div>
                                            )}
                                            {concorso.annuncio_enrichment.normativa_riferimento && Array.isArray(concorso.annuncio_enrichment.normativa_riferimento) && (
                                                <div className="p-4">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Riferimenti normativi</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {concorso.annuncio_enrichment.normativa_riferimento.map((item: string, i: number) => (
                                                            <span key={i} className="text-[11px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                                                {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Right Sidebar */}
                    <aside className="space-y-6 lg:sticky lg:top-8">
                        {highlightCards.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-primary" />
                                    </div>
                                    In sintesi
                                </h2>
                                <CardStack cards={highlightCards} />
                            </div>
                        )}
                        {highlightCards.length === 0 && (
                            <ProAccountCTA />
                        )}

                        {/* Newsletter or other CTAs can be added here */}
                    </aside>
                </div>

                {/* Related concorsi — full width below grid */}
                {!expired && related.length > 0 && (
                    <div className="mt-12 pt-12 border-t border-border">
                        <h2 className="text-2xl font-semibold mb-6">Concorsi Correlati</h2>
                        <ConcorsoList concorsi={related} />
                    </div>
                )}
            </div>
        </>
    );
}
