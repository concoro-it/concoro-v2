import type { DashboardTone } from '@/lib/dashboard/types';

export const toneClasses: Record<DashboardTone, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    critical: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
    neutral: 'border-slate-200 bg-slate-50 text-slate-600',
};

export const dotClasses: Record<DashboardTone, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
};

export function formatTime(value: string) {
    return new Intl.DateTimeFormat('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
    }).format(new Date(value));
}
