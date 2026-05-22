import { Sparkline } from '@/components/charts/Sparkline';
import { toneClasses } from '@/components/admin/admin-utils';
import type { ProviderStatus } from '@/lib/dashboard/types';

export function ProviderStatusGrid({ providers }: { providers: ProviderStatus[] }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {providers.map((provider) => (
                <article key={provider.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-950">{provider.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{provider.detail}</p>
                        </div>
                        <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${toneClasses[provider.tone]}`}>{provider.score}%</span>
                    </div>
                    <Sparkline data={provider.trend} tone={provider.tone} className="mt-3 h-10" />
                </article>
            ))}
        </div>
    );
}
