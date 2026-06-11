import Link from 'next/link';
import { AlertTriangle, Building2, CheckCircle2, ExternalLink, Info, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GenioMatchResult } from '@/types/genio';

interface GenioMatchCardProps {
    result: GenioMatchResult;
    className?: string;
}

const fitTone: Record<string, string> = {
    'Molto adatto': 'border-emerald-200 bg-emerald-50 text-emerald-800',
    'Potenzialmente adatto': 'border-sky-200 bg-sky-50 text-sky-800',
    'Compatibilità parziale': 'border-amber-200 bg-amber-50 text-amber-800',
    'Compatibilita parziale': 'border-amber-200 bg-amber-50 text-amber-800',
    'Probabilmente non adatto': 'border-slate-200 bg-slate-100 text-slate-700',
};

function cleanList(items: string[] | undefined): string[] {
    return Array.isArray(items) ? items.filter((item) => item.trim().length > 0) : [];
}

function DetailList({
    title,
    items,
    tone,
}: {
    title: string;
    items: string[];
    tone: 'positive' | 'warning' | 'neutral';
}) {
    if (items.length === 0) return null;

    const Icon = tone === 'warning' ? AlertTriangle : tone === 'positive' ? CheckCircle2 : Info;
    const iconClass = tone === 'warning' ? 'text-amber-600' : tone === 'positive' ? 'text-emerald-600' : 'text-slate-500';

    return (
        <section className="space-y-2">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                <Icon className={cn('h-3.5 w-3.5', iconClass)} />
                {title}
            </h4>
            <ul className="space-y-1.5 text-sm leading-relaxed text-slate-700">
                {items.map((item) => (
                    <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export function GenioMatchCard({ result, className }: GenioMatchCardProps) {
    const title = result.titolo_breve || result.titolo || 'Concorso compatibile';
    const reasons = cleanList(result.reasons ?? result.ai_explanation?.why_match);
    const risks = cleanList(result.risks);
    const mustVerify = cleanList(result.must_verify ?? result.ai_explanation?.what_to_check);
    const score = Number.isFinite(result.genio_score) ? Math.round(result.genio_score) : null;

    return (
        <article className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn('border px-2 py-0.5', fitTone[result.fit_label] ?? fitTone['Probabilmente non adatto'])}>
                            {result.fit_label}
                        </Badge>
                        {typeof result.deadline_days === 'number' && (
                            <span className="text-xs font-medium text-slate-500">
                                {result.deadline_days > 0 ? `${result.deadline_days} giorni alla scadenza` : 'Scadenza imminente'}
                            </span>
                        )}
                    </div>
                    <h3 className="text-base font-semibold leading-snug text-slate-950">{title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        {result.ente_nome && (
                            <span className="inline-flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" />
                                {result.ente_nome}
                            </span>
                        )}
                        {result.regione && (
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {result.regione}
                            </span>
                        )}
                    </div>
                </div>

                {score !== null && (
                    <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                        <div className="text-lg font-semibold tabular-nums text-slate-900">{score}</div>
                        <div className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-slate-500">Score</div>
                    </div>
                )}
            </div>

            {(result.candidate_fit_summary || result.ai_explanation?.short_card_summary) && (
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                    {result.candidate_fit_summary || result.ai_explanation?.short_card_summary}
                </p>
            )}

            <div className="mt-4 grid gap-4">
                <DetailList title="Perche e compatibile" items={reasons} tone="positive" />
                <DetailList title="Rischi" items={risks} tone="warning" />
                <DetailList title="Da verificare" items={mustVerify} tone="neutral" />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                {result.link_reindirizzamento && (
                    <Button asChild size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                        <Link href={result.link_reindirizzamento} target="_blank" rel="noopener noreferrer">
                            Apri candidatura
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                )}
                {result.link_sito_pa && (
                    <Button asChild size="sm" variant="outline">
                        <Link href={result.link_sito_pa} target="_blank" rel="noopener noreferrer">
                            Sito PA
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                )}
            </div>
        </article>
    );
}
