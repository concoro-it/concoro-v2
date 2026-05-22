'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    AlertTriangle,
    Bot,
    CreditCard,
    Database,
    Gauge,
    Mail,
    RadioTower,
    SearchCheck,
    ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/admin#overview', label: 'Overview', icon: Gauge },
    { href: '/admin#supabase', label: 'Supabase', icon: Database },
    { href: '/admin#indexing', label: 'Google Indexing', icon: SearchCheck },
    { href: '/admin#revenue', label: 'Revenue', icon: CreditCard },
    { href: '/admin#sentry', label: 'Sentry', icon: ShieldAlert },
    { href: '/admin#brevo', label: 'Brevo Email', icon: Mail },
    { href: '/admin#alerts', label: 'Alerts', icon: AlertTriangle },
    { href: '/admin#timeline', label: 'Timeline', icon: RadioTower },
];

export function AdminSidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
    const pathname = usePathname();

    return (
        <aside className={cn('flex h-full w-72 flex-col border-r border-slate-200 bg-white/88 backdrop-blur-xl', className)}>
            <div className="flex h-20 items-center border-b border-slate-200 px-5">
                <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3">
                    <Image src="/concoro-logo-light.png" alt="Concoro" width={128} height={32} className="h-8 w-auto object-contain" priority />
                    <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sky-700">Admin</span>
                </Link>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === '/admin' && item.href === '/admin#overview';
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950',
                                active && 'bg-slate-950 text-white hover:bg-slate-900 hover:text-white'
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-slate-200 p-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                        <Bot className="h-4 w-4 text-sky-600" />
                        AI operations
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">Daily control room for ingestion, indexing, enrichments, and monetization.</p>
                </div>
            </div>
        </aside>
    );
}
