import type { ChartPoint, DashboardTone } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

const toneFill: Record<DashboardTone, string> = {
    success: '#10b981',
    warning: '#f59e0b',
    critical: '#ef4444',
    info: '#0ea5e9',
    neutral: '#94a3b8',
};

export function MiniBarChart({
    data,
    tone = 'info',
    className,
}: {
    data: ChartPoint[];
    tone?: DashboardTone;
    className?: string;
}) {
    const width = 180;
    const height = 72;
    const gap = 4;
    const barWidth = data.length > 0 ? (width - gap * (data.length - 1)) / data.length : width;
    const max = Math.max(...data.map((point) => point.value), 1);

    return (
        <svg className={cn('h-20 w-full', className)} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bar trend">
            {data.map((point, index) => {
                const barHeight = Math.max(3, (point.value / max) * (height - 4));
                return (
                    <rect
                        key={`${point.label}-${index}`}
                        x={index * (barWidth + gap)}
                        y={height - barHeight}
                        width={Math.max(2, barWidth)}
                        height={barHeight}
                        rx="2"
                        fill={toneFill[tone]}
                        opacity={0.28 + (point.value / max) * 0.62}
                    />
                );
            })}
        </svg>
    );
}
