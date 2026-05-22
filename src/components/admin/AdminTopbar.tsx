import { RefreshCw, ShieldCheck } from 'lucide-react';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { ADMIN_EMAIL } from '@/lib/dashboard/constants';

export function AdminTopbar({ generatedAt }: { generatedAt?: string }) {
    const formatted = generatedAt
        ? new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' }).format(new Date(generatedAt))
        : 'Live snapshot';

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[hsl(210,55%,98%)]/88 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <AdminMobileNav />
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Admin Control Center</p>
                        <p className="mt-0.5 text-sm font-medium text-slate-950">Last snapshot: {formatted}</p>
                    </div>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                        <ShieldCheck className="h-4 w-4" />
                        {ADMIN_EMAIL}
                    </span>
                    <a href="/admin" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </a>
                </div>
            </div>
        </header>
    );
}
