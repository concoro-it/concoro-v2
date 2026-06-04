'use client';

import Link from 'next/link';
import * as Avatar from '@radix-ui/react-avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ArrowLeft, ChevronDown, LayoutDashboard, LogOut, UserCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export type PricingHeaderUser = {
    email?: string | null;
    fullName?: string | null;
    avatarUrl?: string | null;
};

export function PricingAccountMenu({ user }: { user: PricingHeaderUser }) {
    const router = useRouter();
    const supabase = createClient();
    const displayName = user.fullName?.trim() || user.email || 'Utente Concoro';
    const initial = (displayName.charAt(0) || 'U').toUpperCase();
    const avatarSrc = user.avatarUrl?.trim() || '/fav.png';

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    aria-label="Apri menu account"
                >
                    <Avatar.Root className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                        <Avatar.Image className="h-full w-full object-cover" src={avatarSrc} alt={displayName} />
                        <Avatar.Fallback className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
                            {initial}
                        </Avatar.Fallback>
                    </Avatar.Root>
                    <span className="hidden max-w-[10rem] truncate sm:block">{displayName}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={10}
                    className="z-[60] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10"
                >
                    <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                            <img
                                src={avatarSrc}
                                alt={displayName}
                                className={cn('h-full w-full object-cover', avatarSrc === '/fav.png' && 'p-1')}
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                            {user.email && <p className="truncate text-xs text-slate-500">{user.email}</p>}
                        </div>
                    </div>

                    <DropdownMenu.Item asChild>
                        <Link
                            href="/hub/bacheca"
                            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:bg-slate-50"
                        >
                            <ArrowLeft className="h-4 w-4 text-slate-500" />
                            Torna alla Hub
                        </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                        <Link
                            href="/hub/profile"
                            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:bg-slate-50"
                        >
                            <UserCircle2 className="h-4 w-4 text-slate-500" />
                            Profilo
                        </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                        <Link
                            href="/hub/billing"
                            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:bg-slate-50"
                        >
                            <LayoutDashboard className="h-4 w-4 text-slate-500" />
                            Fatturazione
                        </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />

                    <DropdownMenu.Item asChild>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 outline-none transition hover:bg-red-50 focus:bg-red-50"
                        >
                            <LogOut className="h-4 w-4" />
                            Esci
                        </button>
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
