import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SintesiItem {
    id: string;
    type: 'Punto di forza' | 'Importante';
    description: string;
    colorClass: string;
    locked?: boolean;
    primaryCtaLabel?: string;
    primaryCtaHref?: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
}

interface SintesiSectionProps {
    items: SintesiItem[];
}

function SummaryCard({
    type,
    description,
    colorClass,
    primaryCtaLabel,
    primaryCtaHref,
    secondaryCtaLabel,
    secondaryCtaHref
}: Omit<SintesiItem, 'id'>) {
    if (!description && type) {
        const isStrength = type === 'Punto di forza';
        return (
            <figure className={cn(
                "relative overflow-hidden rounded-xl border p-4 shadow-sm",
                isStrength
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-amber-200 bg-amber-50/70"
            )}>
                <div className={cn(
                    "pointer-events-none absolute inset-0",
                    isStrength
                        ? "bg-[radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.12),transparent_45%),linear-gradient(120deg,rgba(209,250,229,0.65)_0%,rgba(255,255,255,0.35)_100%)]"
                        : "bg-[radial-gradient(circle_at_80%_10%,rgba(245,158,11,0.12),transparent_45%),linear-gradient(120deg,rgba(254,243,199,0.7)_0%,rgba(255,255,255,0.35)_100%)]"
                )} />
                <div className="relative">
                    <span className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        isStrength ? "text-emerald-700" : "text-amber-700"
                    )}>
                        {type}
                    </span>
                    <div className="mt-3 space-y-2">
                        <div className={cn(
                            "h-3 w-11/12 rounded-full blur-[1px]",
                            isStrength ? "bg-emerald-200/90" : "bg-amber-200/90"
                        )} />
                        <div className={cn(
                            "h-3 w-10/12 rounded-full blur-[1px]",
                            isStrength ? "bg-emerald-200/90" : "bg-amber-200/90"
                        )} />
                    </div>
                    <p className={cn(
                        "mt-3 text-xs font-semibold uppercase tracking-[0.11em]",
                        isStrength ? "text-emerald-800/80" : "text-amber-800/80"
                    )}>
                        Sblocca la sintesi completa con un account gratuito
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {primaryCtaLabel && primaryCtaHref && (
                            <a
                                href={primaryCtaHref}
                                className={cn(
                                    "inline-flex items-center rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white transition",
                                    isStrength ? "bg-emerald-700 hover:bg-emerald-600" : "bg-amber-700 hover:bg-amber-600"
                                )}
                            >
                                {primaryCtaLabel}
                            </a>
                        )}
                        {secondaryCtaLabel && secondaryCtaHref && (
                            <a
                                href={secondaryCtaHref}
                                className={cn(
                                    "text-[11px] font-semibold underline underline-offset-2",
                                    isStrength ? "text-emerald-800 decoration-emerald-300" : "text-amber-800 decoration-amber-300"
                                )}
                            >
                                {secondaryCtaLabel}
                            </a>
                        )}
                    </div>
                </div>
            </figure>
        );
    }

    return (
        <figure
            className={cn(
                "relative w-full overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm",
                "transition-colors hover:bg-gray-50 cursor-default",
                "dark:border-slate-700 dark:bg-slate-800/80 dark:backdrop-blur-md dark:hover:bg-slate-800/50"
            )}
        >
            <div className="flex flex-col gap-1.5">
                <span className={cn("text-xs font-bold uppercase tracking-wider", colorClass)}>
                    {type}
                </span>
                <p className="text-sm font-medium leading-snug text-slate-700 dark:text-slate-200">
                    {description}
                </p>
            </div>
        </figure>
    );
}

export function SintesiSection({ items }: SintesiSectionProps) {
    if (!items.length) return null;

    return (
        <div className="w-full rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm backdrop-blur-xl sm:p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    In sintesi
                </h2>
            </div>

            <div className="flex flex-col gap-3">
                {items.map((item, idx) => (
                    <div
                        key={item.id}
                        className="opacity-0 animate-fade-in-up"
                        style={{
                            animationDelay: `${idx * 0.12}s`,
                            animationFillMode: 'forwards'
                        }}
                    >
                        <SummaryCard
                            type={item.type}
                            description={item.locked ? '' : item.description}
                            colorClass={item.colorClass}
                            primaryCtaLabel={item.primaryCtaLabel}
                            primaryCtaHref={item.primaryCtaHref}
                            secondaryCtaLabel={item.secondaryCtaLabel}
                            secondaryCtaHref={item.secondaryCtaHref}
                        />
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
