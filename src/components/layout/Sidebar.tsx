'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import {
    LayoutDashboard,
    Link2,
    CreditCard,
    History,
    HelpCircle,
    Settings,
    LogOut,
    ChevronDown,
    ChevronUp,
    BadgeCheck
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type MenuItem = {
    name: string;
    href: string;
    icon?: React.ReactNode;
    items?: { name: string; href: string }[];
};

const SubMenu = ({ children, items }: { children: React.ReactNode; items: { name: string; href: string }[] }) => {
    const [isOpened, setIsOpened] = useState(false);

    return (
        <div>
            <button
                className="w-full flex items-center justify-between text-muted-foreground p-2 rounded-lg hover:bg-muted/50 active:bg-muted duration-150 transition-colors"
                onClick={() => setIsOpened((v) => !v)}
                aria-expanded={isOpened}
                aria-controls="submenu"
            >
                <div className="flex items-center gap-x-2">{children}</div>
                {isOpened ? <ChevronUp className="w-4 h-4 text-muted-foreground/50" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/50" />}
            </button>

            {isOpened && (
                <ul id="submenu" className="mx-4 mt-1 px-2 border-l border-gray-100 text-sm font-medium space-y-1">
                    {items.map((item, idx) => (
                        <li key={idx}>
                            <Link
                                href={item.href}
                                className="flex items-center gap-x-2 text-muted-foreground p-2 rounded-lg hover:bg-muted/50 active:bg-muted duration-150 transition-all hover:translate-x-1"
                            >
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export function Sidebar({ userProfile }: { userProfile: any }) {
    const router = useRouter();
    const supabase = createClient();

    const navigation: MenuItem[] = [
        {
            href: '/dashboard',
            name: 'Overview',
            icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
            href: '/dashboard/ricerche',
            name: 'Ricerche',
            icon: <Link2 className="w-5 h-5" />,
        },
        {
            href: '/dashboard/piani',
            name: 'Piani',
            icon: <CreditCard className="w-5 h-5" />,
        },
        {
            href: '/dashboard/transazioni',
            name: 'Transazioni',
            icon: <History className="w-5 h-5" />,
        },
    ];

    const navsFooter: MenuItem[] = [
        {
            href: '/help',
            name: 'Assistenza',
            icon: <HelpCircle className="w-5 h-5" />,
        },
        {
            href: '/settings',
            name: 'Impostazioni',
            icon: <Settings className="w-5 h-5" />,
        },
    ];

    const billingNav = [
        { name: 'Carte', href: '/dashboard/billing/cards' },
        { name: 'Checkout', href: '/dashboard/billing/checkouts' },
        { name: 'Pagamenti', href: '/dashboard/billing/payments' },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/');
    };

    const isPro = userProfile?.tier === 'pro';

    return (
        <nav className="fixed top-0 left-0 w-full h-full border-r bg-background space-y-8 sm:w-80 transition-all duration-300 ease-in-out z-40">
            <div className="flex flex-col h-full px-4">
                {/* User Profile Header */}
                <div className="h-24 flex items-center border-b border-gray-50 -mx-4 px-6 mb-4">
                    <div className="w-full flex items-center gap-x-4">
                        <Avatar.Root className="inline-flex items-center justify-center align-middle overflow-hidden select-none w-12 h-12 rounded-full ring-2 ring-gray-50 ring-offset-2">
                            <Avatar.Image
                                className="w-full h-full object-cover"
                                src={userProfile?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'}
                                alt={userProfile?.full_name || 'User'}
                            />
                            <Avatar.Fallback className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 font-medium">
                                {userProfile?.full_name?.charAt(0) || 'U'}
                            </Avatar.Fallback>
                        </Avatar.Root>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <span className="block text-foreground text-sm font-bold truncate">
                                    {userProfile?.full_name || 'Utente Concoro'}
                                </span>
                                {isPro && (
                                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider">
                                        <BadgeCheck className="w-3 h-3" />
                                        PRO
                                    </span>
                                )}
                            </div>
                            <span className="block mt-px text-muted-foreground text-xs">
                                {isPro ? 'Piano Pro' : 'Piano Free'}
                            </span>
                        </div>

                        <div className="relative">
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                    <button
                                        className="p-2 rounded-lg text-muted-foreground/50 hover:bg-muted/50 active:bg-muted outline-none transition-colors"
                                        aria-label="Opzioni profilo"
                                    >
                                        <ChevronDown className="w-5 h-5" />
                                    </button>
                                </DropdownMenu.Trigger>

                                <DropdownMenu.Portal>
                                    <DropdownMenu.Content
                                        className="z-50 min-w-[200px] bg-card rounded-xl p-1.5 shadow-xl border border-border animate-in fade-in zoom-in duration-200"
                                        sideOffset={8}
                                        align="end"
                                    >
                                        <div className="px-2 py-2 mb-1">
                                            <p className="text-xs font-medium text-gray-400">Account</p>
                                            <p className="text-sm font-semibold text-foreground truncate">{userProfile?.email}</p>
                                        </div>
                                        <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
                                        <DropdownMenu.Item className="outline-none">
                                            <Link
                                                href="/settings"
                                                className="flex items-center gap-2 p-2 text-sm text-muted-foreground rounded-md hover:bg-muted/50 transition-colors"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Impostazioni
                                            </Link>
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item className="outline-none" onSelect={handleLogout}>
                                            <button className="w-full flex items-center gap-2 p-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors">
                                                <LogOut className="w-4 h-4" />
                                                Esci
                                            </button>
                                        </DropdownMenu.Item>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-2">
                    <ul className="text-sm font-medium space-y-1">
                        {navigation.map((item, idx) => (
                            <li key={idx}>
                                <Link
                                    href={item.href}
                                    className="flex items-center gap-x-2 text-muted-foreground p-2.5 rounded-lg hover:bg-muted/50 active:bg-muted transition-all duration-200 group"
                                >
                                    <div className="text-muted-foreground/60 group-hover:text-primary transition-colors">
                                        {item.icon}
                                    </div>
                                    <span className="group-hover:translate-x-0.5 transition-transform">
                                        {item.name}
                                    </span>
                                </Link>
                            </li>
                        ))}

                        <li>
                            <SubMenu items={billingNav}>
                                <CreditCard className="w-5 h-5 text-gray-400" />
                                Fatturazione
                            </SubMenu>
                        </li>
                    </ul>

                    <div className="pt-4 mt-6 border-t border-gray-100">
                        <ul className="text-sm font-medium space-y-1">
                            {navsFooter.map((item, idx) => (
                                <li key={idx}>
                                    <Link
                                        href={item.href}
                                        className="flex items-center gap-x-2 text-gray-600 p-2.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 group"
                                    >
                                        <div className="text-gray-400 group-hover:text-primary transition-colors">
                                            {item.icon}
                                        </div>
                                        <span className="group-hover:translate-x-0.5 transition-transform">
                                            {item.name}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-x-2 text-red-600 p-2.5 rounded-lg hover:bg-red-50 active:bg-red-100 transition-all duration-200 group"
                                >
                                    <LogOut className="w-5 h-5 text-red-500 group-hover:translate-x-0.5 transition-transform" />
                                    <span>Esci</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Optional Footer Branding */}
                <div className="py-6 flex justify-center opacity-30 grayscale hover:grayscale-0 transition-all">
                    <img src="/concoro-logo-light.png" alt="Concoro" className="h-6 w-auto" />
                </div>
            </div>
        </nav>
    );
}
