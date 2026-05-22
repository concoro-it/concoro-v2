import type { ChartPoint } from '@/lib/dashboard/types';

export function StatusHeatmap({ data }: { data: ChartPoint[] }) {
    const max = Math.max(...data.map((point) => point.value), 1);

    return (
        <div className="grid grid-cols-12 gap-1">
            {data.slice(0, 24).map((point, index) => {
                const intensity = point.value / max;
                const className = intensity > 0.75
                    ? 'bg-emerald-600'
                    : intensity > 0.45
                        ? 'bg-emerald-400'
                        : intensity > 0.2
                            ? 'bg-amber-300'
                            : 'bg-slate-200';
                return (
                    <div
                        key={`${point.label}-${index}`}
                        title={`${point.label}: ${point.value}`}
                        className={`h-6 rounded-[0.35rem] ${className}`}
                    />
                );
            })}
        </div>
    );
}
