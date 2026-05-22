import { DonutGauge } from '@/components/charts/DonutGauge';
import type { ProviderStatus } from '@/lib/dashboard/types';
import { dotClasses } from '@/components/admin/admin-utils';

export function HealthScoreCard({
    score,
    providers,
}: {
    score: number;
    providers: ProviderStatus[];
}) {
    const tone = score >= 90 ? 'success' : score >= 75 ? 'warning' : 'critical';

    return (
        <section className="rounded-lg border border-slate-200/80 bg-slate-950 p-5 text-white shadow-[0_28px_80px_-42px_rgba(15,23,42,0.9)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Platform health</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Concoro Control Center</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                        Operational intelligence for scraping, indexing, revenue, email, cron integrity, and AI processing.
                    </p>
                </div>
                <DonutGauge value={score} tone={tone} label="Overall platform health" className="[&_*]:text-white" />
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {providers.map((provider) => (
                    <div key={provider.id} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-sm font-medium text-slate-100">
                                <span className={`h-2 w-2 rounded-full ${dotClasses[provider.tone]}`} />
                                {provider.name}
                            </span>
                            <span className="text-xs font-semibold text-slate-300">{provider.score}%</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{provider.status} · {provider.detail}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
