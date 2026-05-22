import type { DashboardTone } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

const toneStroke: Record<DashboardTone, string> = {
    success: '#059669',
    warning: '#d97706',
    critical: '#dc2626',
    info: '#0284c7',
    neutral: '#64748b',
};

export function DonutGauge({
    value,
    tone = 'success',
    label,
    className,
}: {
    value: number;
    tone?: DashboardTone;
    label: string;
    className?: string;
}) {
    const normalized = Math.max(0, Math.min(100, value));
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (normalized / 100) * circumference;

    return (
        <div className={cn('relative inline-flex h-24 w-24 items-center justify-center', className)}>
            <svg className="-rotate-90" viewBox="0 0 88 88" role="img" aria-label={label}>
                <circle cx="44" cy="44" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle
                    cx="44"
                    cy="44"
                    r={radius}
                    fill="none"
                    stroke={toneStroke[tone]}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    strokeWidth="8"
                />
            </svg>
            <span className="absolute text-xl font-semibold tracking-tight text-slate-950">{normalized}%</span>
        </div>
    );
}
