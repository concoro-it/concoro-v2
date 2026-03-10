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

function getDaysUntil(dateValue: string | Date | null | undefined): number | null {
    if (!dateValue) return null;
    const target = new Date(dateValue);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function ConcorsoCard({ concorso, saved, detailBasePath }: Props) {
    const pathname = usePathname();

    const regione = getFirstRegione(concorso);
    const provincia = getFirstProvincia(concorso);

    const cityLabel = provincia || regione || 'Italia';
    const regionLabel = provincia && regione ? regione : null;
    const provinciaSlug = provincia ? toUrlSlug(provincia) : null;
    const regioneSlug = regione ? toUrlSlug(regione) : null;

    const numPosti = concorso.num_posti ?? 1;
    const title = formatConcorsoTitle(concorso.titolo_breve ?? concorso.titolo);

    const rawDescription = concorso.riassunto ?? concorso.descrizione ?? null;
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
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {urgencyBadgeLabel && (
                        <span className={cn(
                            'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                            getUrgencyClass(urgencyLevel)
                        )}>
                            {urgencyBadgeLabel}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
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
                </div>
            </div>

            <Link href={ctaHref} className="group/title mt-3 block">
                <h2 className={cn(
                    'line-clamp-2 text-[20px] font-semibold leading-tight text-slate-900 transition-colors sm:text-[22px]',
                    !isExpired && 'group-hover/title:text-slate-700'
                )}>
                    {title}
                </h2>
            </Link>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
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
                </div>

                <Link
                    href={ctaHref}
                    className={cn(
                        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-colors',
                        isExpired
                            ? 'bg-slate-300 text-slate-600'
                            : 'bg-primary text-primary-foreground hover:opacity-90'
                    )}
                >
                    Vai al bando
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 2.5H9.5V9.5M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
            </div>

            {description && (
                <PlainTextWithLinks
                    text={description}
                    className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-slate-600"
                />
            )}
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
