import type { ChartPoint } from '@/lib/dashboard/types';

export function StackedBars({ data }: { data: ChartPoint[] }) {
    const total = Math.max(data.reduce((sum, point) => sum + point.value, 0), 1);

    return (
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
            {data.map((point, index) => {
                const width = `${Math.max(2, (point.value / total) * 100)}%`;
                const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-slate-400', 'bg-sky-500'];
                return <div key={point.label} className={colors[index % colors.length]} style={{ width }} title={`${point.label}: ${point.value}`} />;
            })}
        </div>
    );
}
