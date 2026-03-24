'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Concorso } from '@/types/concorso';
import {
    formatConcorsoTitle,
    getFirstProvincia,
    getFirstRegione,
    getUrgencyLabel,
    getUrgencyLevel,
    normaliseLink,
} from '@/lib/utils/concorso';
import { toUrlSlug } from '@/lib/utils/regioni';
import { cn } from '@/lib/utils/cn';
import { SaveButton } from '@/components/concorsi/SaveButton';

interface Props {
    concorso: Concorso;
    saved?: boolean;
    detailBasePath?: string;
    matchScore?: number | null;
    descriptionOverride?: string | null;
}

function stripAllHtml(html: string): string {
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function PlainTextWithLinks({ text, className }: { text: string; className?: string }) {
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
                className="underline decoration-slate-300 hover:text-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                {url}
            </a>
        );

        lastIndex = match.index + url.length;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return <p className={className}>{parts}</p>;
}

function getUrgencyClass(level: number): string {
    if (level === 0) return 'border-slate-300 bg-slate-100 text-slate-600';
    if (level <= 2) return 'border-amber-300 bg-amber-50 text-amber-800';
    return 'border-emerald-300 bg-emerald-50 text-emerald-800';
}

function getScorePalette(score: number): { ring: string; text: string; glow: string } {
    if (score >= 85) return { ring: '#0A4E88', text: 'text-[#0A4E88]', glow: 'shadow-[0_8px_20px_-12px_rgba(10,78,136,0.55)]' };
    if (score >= 70) return { ring: '#65A30D', text: 'text-[#4D7C0F]', glow: 'shadow-[0_8px_20px_-12px_rgba(101,163,13,0.55)]' };
    return { ring: '#CA8A04', text: 'text-[#A16207]', glow: 'shadow-[0_8px_20px_-12px_rgba(202,138,4,0.58)]' };
}

function getDaysUntil(dateValue: string | Date | null | undefined): number | null {
    if (!dateValue) return null;
    const target = new Date(dateValue);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function ConcorsoCard({ concorso, saved, detailBasePath, matchScore, descriptionOverride }: Props) {
    const pathname = usePathname();

    const regione = getFirstRegione(concorso);
    const provincia = getFirstProvincia(concorso);

    const cityLabel = provincia || regione || 'Italia';
    const regionLabel = provincia && regione ? regione : null;
    const provinciaSlug = provincia ? toUrlSlug(provincia) : null;
    const regioneSlug = regione ? toUrlSlug(regione) : null;

    const numPosti = concorso.num_posti ?? 1;
    const title = formatConcorsoTitle(concorso.titolo_breve ?? concorso.titolo);

    const rawDescription = descriptionOverride ?? concorso.riassunto ?? concorso.descrizione ?? null;
    const description = rawDescription ? stripAllHtml(rawDescription) : null;

    const urgencyLevel = getUrgencyLevel(concorso.data_scadenza, concorso.status);
    const isExpired = urgencyLevel === 0;
    const urgencyLabel = getUrgencyLabel(concorso.data_scadenza, concorso.status);
    const daysUntil = getDaysUntil(concorso.data_scadenza);
    const urgencyBadgeLabel = (() => {
        if (urgencyLevel === 0) return 'Scaduto';
        if (daysUntil === null) return urgencyLabel ?? 'Nessuna scadenza';
        if (daysUntil <= 0) return 'Scade oggi';
        if (daysUntil === 1) return 'Scade tra 1 giorno';
        return `Scade tra ${daysUntil} giorni`;
    })();

    const isHubContext = pathname?.startsWith('/hub') ?? false;
    const hubPrefix = isHubContext ? '/hub' : '';
    const resolvedDetailBasePath = detailBasePath ?? (isHubContext ? '/hub/concorsi' : '/concorsi');
    const detailHrefBase = resolvedDetailBasePath.replace(/\/$/, '');

    const ctaHref = concorso.slug
        ? `${detailHrefBase}/${concorso.slug}`
        : normaliseLink(concorso.link_reindirizzamento ?? concorso.link_sito_pa);
    const roundedScore = typeof matchScore === 'number' && Number.isFinite(matchScore)
        ? Math.max(0, Math.min(100, Math.round(matchScore)))
        : null;
    const scorePalette = roundedScore != null ? getScorePalette(roundedScore) : null;
    const scoreRingStyle = roundedScore != null && scorePalette
        ? {
            background: `conic-gradient(${scorePalette.ring} ${roundedScore * 3.6}deg, rgba(148,163,184,0.28) 0deg)`,
        }
        : null;

    return (
        <article
            className={cn(
                'relative w-full overflow-hidden rounded-xl border p-4 transition-all duration-200',
                isExpired
                    ? 'border-slate-200 bg-slate-50 opacity-60 saturate-50 shadow-none'
                    : 'border-border bg-white shadow-sm hover:border-primary/20 hover:shadow-md'
            )}
        >
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'linear-gradient(145deg, rgba(2,132,199,0.04) 0%, rgba(15,23,42,0.015) 45%, rgba(16,185,129,0.03) 100%)',
                }}
            />
            <div className="relative">
            <div className="relative flex items-start gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                    {roundedScore != null && scorePalette && scoreRingStyle && (
                        <div
                            className={cn(
                                'relative mt-0.5 h-16 w-16 shrink-0 rounded-full p-[4px] transition-transform duration-300',
                                scorePalette.glow
                            )}
                            style={scoreRingStyle}
                            aria-label={`Compatibilita ${roundedScore}%`}
                        >
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-white ring-1 ring-slate-200/70">
                                <span className={cn('text-[1.6rem] font-bold leading-none', scorePalette.text)}>{roundedScore}</span>
                            </div>
                            <span className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 ring-1 ring-slate-200">
                                Fit
                            </span>
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                    <Link href={ctaHref} className="group/title block pr-[8.6rem] sm:pr-[9.4rem]">
                        <h2 className={cn(
                            'line-clamp-2 text-[20px] font-semibold leading-tight text-slate-900 transition-colors sm:text-[22px]',
                            !isExpired && 'group-hover/title:text-slate-700'
                        )}>
                            {title}
                        </h2>
                    </Link>

                    <div className="mt-3">
                        <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-600 sm:text-[13px]">
                    <span className="inline-flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-slate-500">
                            <path d="M2.5 8C2.5 5.24 4.74 3 7.5 3H8.5C11.26 3 13.5 5.24 13.5 8V13H2.5V8Z" stroke="currentColor" strokeWidth="1.2" />
                            <circle cx="8" cy="6" r="1.6" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                        {concorso.ente_slug ? (
                            <Link
                                href={`${hubPrefix}/ente/${concorso.ente_slug}`}
                                className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {concorso.ente_nome ?? 'Ente pubblico'}
                            </Link>
                        ) : (
                            <span className="font-medium text-slate-700">{concorso.ente_nome ?? 'Ente pubblico'}</span>
                        )}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                        <svg width="11" height="13" viewBox="0 0 11 14" fill="none" className="text-slate-500">
                            <path
                                d="M5.5 0C3.01 0 1 2.01 1 4.5C1 7.88 5.5 13 5.5 13C5.5 13 10 7.88 10 4.5C10 2.01 7.99 0 5.5 0ZM5.5 6C4.67 6 4 5.33 4 4.5C4 3.67 4.67 3 5.5 3C6.33 3 7 3.67 7 4.5C7 5.33 6.33 6 5.5 6Z"
                                fill="currentColor"
                            />
                        </svg>
                        {provinciaSlug ? (
                            <Link
                                href={`${hubPrefix}/provincia/${provinciaSlug}`}
                                className="hover:text-slate-900 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {cityLabel}
                            </Link>
                        ) : (
                            <span>{cityLabel}</span>
                        )}
                        {regionLabel && <span>, </span>}
                        {regionLabel && regioneSlug ? (
                            <Link
                                href={`${hubPrefix}/regione/${regioneSlug}`}
                                className="text-slate-500 hover:text-slate-900 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {regionLabel}
                            </Link>
                        ) : null}
                        {regionLabel && !regioneSlug ? <span className="text-slate-500">{regionLabel}</span> : null}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-slate-500">
                            <rect x="2.5" y="3" width="11" height="10" rx="1.8" stroke="currentColor" strokeWidth="1.2" />
                            <path d="M5 6H11M5 8.5H11M5 11H8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                        <span className="font-medium text-slate-700">{numPosti} {numPosti === 1 ? 'posto' : 'posti'}</span>
                    </span>
                        {urgencyBadgeLabel && (
                            <span className={cn(
                                'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ml-1.5',
                                getUrgencyClass(urgencyLevel)
                            )}>
                                {urgencyBadgeLabel}
                            </span>
                        )}
                    </div>
                    </div>

                    {description && (
                        <PlainTextWithLinks
                            text={description}
                            className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-slate-600"
                        />
                    )}
                    </div>
                </div>
                <div className="absolute right-0 top-0 flex items-center gap-1.5">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            const shareUrl = window.location.origin + ctaHref;
                            if (navigator.share) {
                                navigator.share({ title, url: shareUrl });
                            } else {
                                navigator.clipboard.writeText(shareUrl);
                            }
                        }}
                        className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        title="Condividi"
                        aria-label="Condividi concorso"
                    >
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                            <circle cx="12" cy="4" r="1.5" stroke="currentColor" strokeWidth="1" />
                            <circle cx="4" cy="8" r="1.5" stroke="currentColor" strokeWidth="1" />
                            <circle cx="12" cy="12" r="1.5" stroke="currentColor" strokeWidth="1" />
                            <line x1="5.3" y1="7.3" x2="10.7" y2="4.7" stroke="currentColor" strokeWidth="1" />
                            <line x1="5.3" y1="8.7" x2="10.7" y2="11.3" stroke="currentColor" strokeWidth="1" />
                        </svg>
                    </button>
                    <SaveButton
                        concorsoId={concorso.concorso_id}
                        initialSaved={Boolean(saved)}
                        iconOnly
                        className="opacity-70 hover:opacity-100"
                    />
                    <Link
                        href={ctaHref}
                        className={cn(
                            'inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                            isExpired
                                ? 'bg-slate-300 text-slate-600'
                                : 'bg-[#0A4E88] text-white hover:bg-[#0E2F50]'
                        )}
                        aria-label="Vai al bando"
                        title="Vai al bando"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 11L11 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5 3H11V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                </div>
            </div>
            </div>
        </article>
    );
}

export function ConcorsoCardSkeleton() {
    return (
        <div className="w-full animate-pulse rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="h-6 w-40 rounded-full bg-slate-200" />
                <div className="h-7 w-16 rounded-full bg-slate-200" />
            </div>

            <div className="mt-3 space-y-2">
                <div className="h-6 w-full rounded bg-slate-200" />
                <div className="h-6 w-4/5 rounded bg-slate-200" />
            </div>

            <div className="mt-3 h-4 w-3/4 rounded bg-slate-200" />

            <div className="mt-3 flex gap-2">
                <div className="h-6 w-20 rounded-full bg-slate-200" />
                <div className="h-6 w-24 rounded-full bg-slate-200" />
                <div className="h-6 w-16 rounded-full bg-slate-200" />
            </div>

            <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded bg-slate-200" />
                <div className="h-3 w-5/6 rounded bg-slate-200" />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="h-3 w-28 rounded bg-slate-200" />
                <div className="h-8 w-24 rounded-full bg-slate-200" />
            </div>
        </div>
    );
}
