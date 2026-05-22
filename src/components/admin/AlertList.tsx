import { AlertTriangle, Info, Siren } from 'lucide-react';
import { formatTime } from '@/components/admin/admin-utils';
import type { OperationalAlert } from '@/lib/dashboard/types';

export function AlertList({ alerts }: { alerts: OperationalAlert[] }) {
    return (
        <div className="space-y-2">
            {alerts.map((alert) => {
                const Icon = alert.severity === 'critical' ? Siren : alert.severity === 'warning' ? AlertTriangle : Info;
                const colors = alert.severity === 'critical'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : alert.severity === 'warning'
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-sky-200 bg-sky-50 text-sky-700';
                return (
                    <article key={alert.id} className={`rounded-lg border p-3 ${colors}`}>
                        <div className="flex items-start gap-3">
                            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-semibold">{alert.title}</h3>
                                    <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.1em] opacity-70">{alert.source}</span>
                                </div>
                                <p className="mt-1 text-xs leading-relaxed opacity-85">{alert.description}</p>
                                <p className="mt-2 text-[0.65rem] font-medium opacity-70">{formatTime(alert.timestamp)}</p>
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
