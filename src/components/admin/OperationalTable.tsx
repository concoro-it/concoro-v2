import type { TableRow } from '@/lib/dashboard/types';
import { dotClasses } from '@/components/admin/admin-utils';

export function OperationalTable({ rows }: { rows: TableRow[] }) {
    return (
        <div className="overflow-hidden rounded-lg border border-slate-200">
            {rows.map((row, index) => (
                <div key={row.id} className={`grid grid-cols-[1fr_auto] gap-3 px-3 py-3 ${index === 0 ? '' : 'border-t border-slate-100'} bg-white/70`}>
                    <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-sm font-medium text-slate-900">
                            <span className={`h-2 w-2 rounded-full ${dotClasses[row.tone]}`} />
                            {row.label}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{row.detail}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-950">{row.value}</span>
                </div>
            ))}
        </div>
    );
}
