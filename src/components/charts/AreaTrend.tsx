import type { ChartPoint, DashboardTone } from '@/lib/dashboard/types';
import { Sparkline } from '@/components/charts/Sparkline';

export function AreaTrend({ data, tone }: { data: ChartPoint[]; tone?: DashboardTone }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
            <Sparkline data={data} tone={tone} className="h-24" />
        </div>
    );
}
