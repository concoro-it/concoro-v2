'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Concorso } from '@/types/concorso';
import {
    getFirstRegione, getFirstProvincia, parseSettori,
    getUrgencyLevel, getUrgencyLabel, normaliseLink,
    formatConcorsoTitle
} from '@/lib/utils/concorso';
import { formatDateIT } from '@/lib/utils/date';
import { toUrlSlug } from '@/lib/utils/regioni';
import { cn } from '@/lib/utils/cn';
import { SaveButton } from '@/components/concorsi/SaveButton';

interface Props {
    concorso: Concorso;
    saved?: boolean;
    detailBasePath?: string;
}

/** Strip ALL html tags and decode common entities to plain text. */
function stripAllHtml(html: string): string {
    return html
        .replace(/<[^>]+>/g, ' ')          // remove tags
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s{2,}/g, ' ')           // collapse whitespace
        .trim();
}

/** Render plain text with detected URLs turned into <a> links. */
function PlainTextWithLinks({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
    const urlRegex = /https?:\/\/[^\s<>"']+/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = urlRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        const url = match[0];
        parts.push(
            <a
                key={match.index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80 transition-opacity"
                onClick={e => e.stopPropagation()}
            >
                {url}
            </a>
        );
        lastIndex = match.index + url.length;
    }
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return (
        <p className={className} style={style}>
            {parts}
        </p>
    );
}

export function ConcorsoCard({ concorso, saved, detailBasePath }: Props) {
    const [ctaHovered, setCtaHovered] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [showExpand, setShowExpand] = useState(false);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const pathname = usePathname();

    const regione = getFirstRegione(concorso);
    const provincia = getFirstProvincia(concorso);
    const settori = parseSettori(concorso);
    const urgencyLevel = getUrgencyLevel(concorso.data_scadenza, concorso.status);
    const isExpired = urgencyLevel === 0;

    const title = formatConcorsoTitle(concorso.titolo_breve ?? concorso.titolo);

    // Location
    const cityLabel = provincia || regione || 'Italia';
    const regionLabel = provincia && regione ? regione : null;
    const provinciaSlug = provincia ? toUrlSlug(provincia) : null;
    const regioneSlug = regione ? toUrlSlug(regione) : null;

    // Num posti
    const numPosti = concorso.num_posti ?? 1;

    // Mobilità label
    const mobilitaLabel = concorso.tipologia_mobilita ?? null;

    // ── TAGS ──
    // 1. Categorie (from `categorie` text[])
    const categorieTags: string[] = [];
    if (concorso.categorie && concorso.categorie.length > 0) {
        concorso.categorie.slice(0, 2).forEach(c => {
            try {
                const parsed = JSON.parse(c);
                const label = parsed.descrizione || parsed.nome || c;
                if (label) categorieTags.push(label);
            } catch {
                if (c) categorieTags.push(c);
            }
        });
    }

    // 2. Tipo procedura
    const proceduraTag = concorso.tipo_procedura ?? null;

    // 3. Regime impegno
    const regimeTag = concorso.regime_impegno ?? null;

    // 4. Remote / Presenza
    const presenzaTag = concorso.is_remote ? 'Da remoto' : 'In presenza';

    // 5. Settori (up to 2)
    const settoriTags = settori.slice(0, 2);

    // Combine all tags, filtering nulls/empties
    const allTags: string[] = [
        ...categorieTags,
        proceduraTag,
        regimeTag,
        presenzaTag,
        ...settoriTags,
    ].filter((t): t is string => Boolean(t));

    // Description — strip HTML to plain text
    const rawDescription = concorso.riassunto ?? concorso.descrizione ?? null;
    const description = rawDescription ? stripAllHtml(rawDescription) : null;

    // Deadline
    const deadlineLabel = concorso.data_scadenza ? `Scade ${formatDateIT(concorso.data_scadenza)}` : null;

    // CTA link always goes to the detail page
    const isHubContext = pathname?.startsWith('/hub') ?? false;
    const hubPrefix = isHubContext ? '/hub' : '';
    const resolvedDetailBasePath = detailBasePath ?? (isHubContext ? '/hub/concorsi' : '/concorsi');
    const detailHrefBase = resolvedDetailBasePath.replace(/\/$/, '');
    const ctaHref = concorso.slug
        ? `${detailHrefBase}/${concorso.slug}`
        : normaliseLink(concorso.link_reindirizzamento ?? concorso.link_sito_pa);

    // Status
    const isOpen = concorso.status === 'OPEN';

    // Detect title overflow
    useEffect(() => {
        const el = titleRef.current;
        if (!el) return;
        el.style.webkitLineClamp = 'unset';
        el.style.display = 'block';
        const fullHeight = el.scrollHeight;
        el.style.webkitLineClamp = '';
        el.style.display = '';
        const clampedHeight = el.clientHeight;
        if (fullHeight > clampedHeight + 2) {
            setShowExpand(true);
        }
    }, [title]);

    return (
        <article
            className={cn(
                'relative w-full rounded-[18px] overflow-hidden flex',
                'transition-all duration-200',
                isExpired && 'opacity-60'
            )}
            style={{
                background: 'linear-gradient(174deg, #FFFFFF 0%, #F4F7FB 60%, #EEF3FA 100%)',
                boxShadow: '0px 1px 4px rgba(30,60,100,0.06), 0px 2px 24px rgba(30,60,100,0.10)',
            }}
        >
            {/* Border overlay */}
            <div
                className="absolute inset-[1px] rounded-[17px] pointer-events-none"
                style={{ outline: '1px solid rgba(30,60,120,0.09)' }}
            />

            {/* ── SIDEBAR ── */}
            <div
                className="relative flex-shrink-0 flex flex-col items-center justify-between py-5"
                style={{
                    width: 89,
                    background: 'rgba(30,70,140,0.04)',
                    borderRight: '1px solid rgba(30,70,140,0.08)',
                }}
            >
                {/* Sidebar glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse 130% 45% at 25% 0%, rgba(59,130,246,0.08) 0%, transparent 60%)',
                    }}
                />

                {/* Status badge */}
                <div className="relative z-10 flex items-center gap-1.5">
                    <div
                        className="w-[5px] h-[5px] rounded-full"
                        style={{ background: isOpen ? '#16A34A' : '#9CA3AF' }}
                    />
                    <span
                        className="text-[10px] font-extrabold uppercase"
                        style={{ color: isOpen ? '#16A34A' : '#9CA3AF', letterSpacing: '1px' }}
                    >
                        {isOpen ? 'Aperto' : (concorso.status_label ?? 'Chiuso')}
                    </span>
                </div>

                {/* Divider */}
                <div style={{ width: 28, height: 1, background: 'rgba(30,70,140,0.12)' }} />

                {/* Posti */}
                <div className="relative z-10 flex flex-col items-center gap-1">
                    <span
                        className="text-[38px] leading-none text-center"
                        style={{ fontWeight: 600, letterSpacing: '-0.03em', color: '#1E3A6E' }}
                    >
                        {numPosti}
                    </span>
                    <span
                        className="text-[9px] font-extrabold uppercase text-center"
                        style={{ letterSpacing: '1.25px', color: 'rgba(30,58,110,0.35)' }}
                    >
                        {numPosti === 1 ? 'posto' : 'posti'}
                    </span>
                </div>

                {/* Divider */}
                <div style={{ width: 28, height: 1, background: 'rgba(30,70,140,0.12)' }} />

                {/* Location — clickable */}
                <div className="relative z-10 flex flex-col items-center gap-0.5 px-2">
                    <svg width="11" height="14" viewBox="0 0 11 14" fill="none">
                        <path
                            d="M5.5 0C3.01 0 1 2.01 1 4.5C1 7.88 5.5 13 5.5 13C5.5 13 10 7.88 10 4.5C10 2.01 7.99 0 5.5 0ZM5.5 6C4.67 6 4 5.33 4 4.5C4 3.67 4.67 3 5.5 3C6.33 3 7 3.67 7 4.5C7 5.33 6.33 6 5.5 6Z"
                            fill="rgba(30,70,140,0.25)"
                        />
                    </svg>

                    {/* City / Provincia */}
                    {provinciaSlug ? (
                        <Link
                            href={`${hubPrefix}/provincia/${provinciaSlug}`}
                            className="text-center text-[9.6px] font-semibold leading-tight hover:underline"
                            style={{ color: 'rgba(30,70,140,0.60)', letterSpacing: '0.38px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {cityLabel}
                        </Link>
                    ) : (
                        <span
                            className="text-center text-[9.6px] font-semibold leading-tight"
                            style={{ color: 'rgba(30,70,140,0.50)', letterSpacing: '0.38px' }}
                        >
                            {cityLabel}
                        </span>
                    )}

                    {/* Region */}
                    {regionLabel && regioneSlug && (
                        <Link
                            href={`${hubPrefix}/regione/${regioneSlug}`}
                            className="text-center text-[8.8px] font-medium leading-tight hover:underline"
                            style={{ color: 'rgba(30,70,140,0.40)', letterSpacing: '0.26px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {regionLabel}
                        </Link>
                    )}
                    {regionLabel && !regioneSlug && (
                        <span
                            className="text-center text-[8.8px] font-medium leading-tight"
                            style={{ color: 'rgba(30,70,140,0.30)', letterSpacing: '0.26px' }}
                        >
                            {regionLabel}
                        </span>
                    )}
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 min-w-0 flex flex-col gap-2 px-[22px] py-5">

                {/* Top row: Ente (link) + mobilità + icons */}
                <div className="flex justify-between items-start">
                    {/* Ente — link to /ente/[slug] */}
                    {concorso.ente_slug ? (
                        <Link
                            href={`${hubPrefix}/ente/${concorso.ente_slug}`}
                            className="text-[10.9px] font-bold uppercase truncate hover:underline"
                            style={{ color: 'rgba(30,58,110,0.55)', letterSpacing: '0.54px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {concorso.ente_nome ?? 'Ente pubblico'}
                        </Link>
                    ) : (
                        <span
                            className="text-[10.9px] font-bold uppercase truncate"
                            style={{ color: 'rgba(30,58,110,0.45)', letterSpacing: '0.54px' }}
                        >
                            {concorso.ente_nome ?? 'Ente pubblico'}
                        </span>
                    )}

                    <div className="flex items-center gap-4 flex-shrink-0 ml-3">
                        {mobilitaLabel && (
                            <span
                                className="text-[10.1px] font-semibold whitespace-nowrap"
                                style={{ color: 'rgba(30,58,110,0.30)', letterSpacing: '0.40px' }}
                            >
                                {mobilitaLabel}
                            </span>
                        )}
                        <div style={{ width: 1, height: 12, background: 'rgba(30,70,140,0.30)' }} />
                        <div className="flex items-center gap-2">
                            {/* Bookmark */}
                            <SaveButton
                                concorsoId={concorso.concorso_id}
                                initialSaved={Boolean(saved)}
                                iconOnly
                                className="opacity-50 hover:opacity-100"
                            />
                            {/* Share */}
                            <button
                                onClick={e => {
                                    e.preventDefault();
                                    const shareUrl = window.location.origin + ctaHref;
                                    if (navigator.share) {
                                        navigator.share({ title, url: shareUrl });
                                    } else {
                                        navigator.clipboard.writeText(shareUrl);
                                    }
                                }}
                                className="transition-opacity hover:opacity-100"
                                style={{ opacity: 0.5 }}
                                title="Condividi"
                                aria-label="Condividi concorso"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="12" cy="4" r="1.5" stroke="rgba(30,70,140,0.70)" strokeWidth="1" />
                                    <circle cx="4" cy="8" r="1.5" stroke="rgba(30,70,140,0.70)" strokeWidth="1" />
                                    <circle cx="12" cy="12" r="1.5" stroke="rgba(30,70,140,0.70)" strokeWidth="1" />
                                    <line x1="5.3" y1="7.3" x2="10.7" y2="4.7" stroke="rgba(30,70,140,0.70)" strokeWidth="1" />
                                    <line x1="5.3" y1="8.7" x2="10.7" y2="11.3" stroke="rgba(30,70,140,0.70)" strokeWidth="1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Title block */}
                <div className="flex flex-col">
                    <h2
                        ref={titleRef}
                        className={cn('transition-all duration-300', !expanded && 'line-clamp-2')}
                        style={{
                            fontSize: '23.2px',
                            fontWeight: 600,
                            letterSpacing: '-0.03em',
                            lineHeight: '27.84px',
                            color: '#1E3A6E',
                        }}
                    >
                        {title}
                    </h2>

                    {showExpand && (
                        <button
                            onClick={() => setExpanded(prev => !prev)}
                            className="mt-1.5 flex items-center gap-1 self-start transition-colors duration-200 hover:opacity-100"
                            style={{
                                color: 'rgba(30,70,140,0.38)',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                letterSpacing: '0.2px',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                fontFamily: 'var(--font-sans), sans-serif',
                            }}
                        >
                            {expanded ? 'Mostra meno' : 'Mostra tutto'}
                            <svg
                                width="10" height="10" viewBox="0 0 10 10" fill="none"
                                className="transition-transform duration-300 flex-shrink-0"
                                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            >
                                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Tags — categorie, procedura, regime, presenza, settori */}
                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {allTags.map((tag, i) => (
                            <span
                                key={`${tag}-${i}`}
                                className="px-2.5 py-0.5 rounded-full text-[10.9px] font-medium"
                                style={{
                                    background: 'rgba(30,70,140,0.05)',
                                    outline: '1px solid rgba(30,70,140,0.10)',
                                    outlineOffset: '-1px',
                                    color: 'rgba(30,58,110,0.55)',
                                    letterSpacing: '0.22px',
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Description — plain text, URLs clickable */}
                {description && (
                    <PlainTextWithLinks
                        text={description}
                        className="text-[11.8px] font-normal"
                        style={{ color: 'rgba(30,58,110,0.42)', lineHeight: '18.94px' }}
                    />
                )}

                {/* Footer */}
                <div
                    className="flex justify-between items-center flex-wrap gap-2 pt-2.5 mt-auto"
                    style={{ borderTop: '1px solid rgba(30,70,140,0.08)' }}
                >
                    {deadlineLabel && (
                        <div
                            className="flex items-center gap-1.5 text-[10.9px] font-bold"
                            style={{ color: 'rgba(30,70,140,0.50)' }}
                        >
                            <svg width="11" height="12" viewBox="0 0 11 12" fill="none">
                                <rect x="0.5" y="1.5" width="10" height="10" rx="1.5" stroke="rgba(30,70,140,0.50)" strokeWidth="1" />
                                <line x1="3" y1="0.5" x2="3" y2="2.5" stroke="rgba(30,70,140,0.50)" strokeWidth="1" strokeLinecap="round" />
                                <line x1="8" y1="0.5" x2="8" y2="2.5" stroke="rgba(30,70,140,0.50)" strokeWidth="1" strokeLinecap="round" />
                                <line x1="0.5" y1="4.5" x2="10.5" y2="4.5" stroke="rgba(30,70,140,0.50)" strokeWidth="1" />
                            </svg>
                            {deadlineLabel}
                        </div>
                    )}

                    {/* CTA */}
                    <Link
                        href={ctaHref}
                        className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-white no-underline transition-all duration-200"
                        onMouseEnter={() => setCtaHovered(true)}
                        onMouseLeave={() => setCtaHovered(false)}
                        style={{
                            background: ctaHovered ? '#162D56' : '#1E3A6E',
                            boxShadow: ctaHovered ? '0 4px 14px rgba(30,58,110,0.28)' : '0px 2px 8px rgba(30,58,110,0.18)',
                            fontSize: '12.5px',
                            letterSpacing: '0.25px',
                            fontFamily: 'var(--font-sans), sans-serif',
                        }}
                    >
                        Vai al bando
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 2.5H9.5V9.5M9.5 2.5L2.5 9.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                </div>
            </div>
        </article>
    );
}

export function ConcorsoCardSkeleton() {
    return (
        <div
            className="relative w-full rounded-[18px] overflow-hidden flex animate-pulse"
            style={{
                background: 'linear-gradient(174deg, #FFFFFF 0%, #F4F7FB 60%, #EEF3FA 100%)',
                boxShadow: '0px 1px 4px rgba(30,60,100,0.06), 0px 2px 24px rgba(30,60,100,0.10)',
            }}
        >
            {/* Sidebar skeleton */}
            <div
                className="flex-shrink-0 flex flex-col items-center justify-between py-5 gap-4"
                style={{
                    width: 89,
                    background: 'rgba(30,70,140,0.04)',
                    borderRight: '1px solid rgba(30,70,140,0.08)',
                }}
            >
                <div className="h-3 w-12 rounded-full bg-gray-200" />
                <div className="h-px w-7 bg-gray-200" />
                <div className="h-9 w-8 rounded bg-gray-200" />
                <div className="h-px w-7 bg-gray-200" />
                <div className="flex flex-col items-center gap-1">
                    <div className="h-3 w-14 rounded bg-gray-200" />
                    <div className="h-2.5 w-10 rounded bg-gray-200" />
                </div>
            </div>

            {/* Content skeleton */}
            <div className="flex-1 min-w-0 flex flex-col gap-3 px-[22px] py-5">
                <div className="flex justify-between items-center">
                    <div className="h-3 w-32 rounded bg-gray-200" />
                    <div className="h-3 w-20 rounded bg-gray-200" />
                </div>
                <div className="space-y-2">
                    <div className="h-6 w-full rounded bg-gray-200" />
                    <div className="h-6 w-4/5 rounded bg-gray-200" />
                </div>
                <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full bg-gray-200" />
                    <div className="h-5 w-20 rounded-full bg-gray-200" />
                    <div className="h-5 w-14 rounded-full bg-gray-200" />
                </div>
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="h-3 w-4/5 rounded bg-gray-200" />
                <div className="flex justify-between items-center pt-2 mt-auto border-t border-gray-100">
                    <div className="h-3 w-24 rounded bg-gray-200" />
                    <div className="h-8 w-24 rounded-full bg-gray-200" />
                </div>
            </div>
        </div>
    );
}
