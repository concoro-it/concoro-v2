import type { ChartPoint, DashboardTone } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

const toneStroke: Record<DashboardTone, string> = {
    success: '#059669',
    warning: '#d97706',
    critical: '#dc2626',
    info: '#0284c7',
    neutral: '#64748b',
};

function buildPath(data: ChartPoint[], width: number, height: number) {
    if (data.length === 0) return '';
    const values = data.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);

    return data
        .map((point, index) => {
            const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
            const y = height - ((point.value - min) / range) * height;
            return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ');
}

export function Sparkline({
    data,
    tone = 'info',
    className,
}: {
    data: ChartPoint[];
    tone?: DashboardTone;
    className?: string;
}) {
    const width = 160;
    const height = 48;
    const path = buildPath(data, width, height);

    return (
        <svg className={cn('h-12 w-full overflow-visible', className)} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Trend sparkline">
            <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill={toneStroke[tone]} opacity="0.08" />
            <path d={path} fill="none" stroke={toneStroke[tone]} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
        </svg>
    );
}
