import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Sparkline } from '@/components/charts/Sparkline';
import { toneClasses } from '@/components/admin/admin-utils';
import type { Delta, KpiMetric } from '@/lib/dashboard/types';

function DeltaPill({ delta }: { delta: Delta }) {
    const Icon = delta.direction === 'up' ? ArrowUpRight : delta.direction === 'down' ? ArrowDownRight : ArrowRight;
    return (
        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.65rem] font-semibold ${toneClasses[delta.tone]}`}>
            <Icon className="h-3 w-3" />
            {delta.label} {delta.value}
        </span>
    );
}

export function MetricCard({ metric }: { metric: KpiMetric }) {
    return (
        <article className="group rounded-lg border border-slate-200/85 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{metric.value}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{metric.helper}</p>
                </div>
                <div className="h-14 w-24 shrink-0">
                    <Sparkline data={metric.trend} tone={metric.tone} />
                </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
                <DeltaPill delta={metric.dailyDelta} />
                <DeltaPill delta={metric.weeklyDelta} />
                <DeltaPill delta={metric.monthlyDelta} />
            </div>
        </article>
    );
}
