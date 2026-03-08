'use client';

import React from 'react';
import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { News, type NewsArticle } from '@/components/ui/sidebar-news';
import {
    LayoutDashboard,
    Search,
    MapPin,
    MapPinned,
    Building2,
    Briefcase,
    CalendarDays,
    CreditCard,
    Bookmark,
    Bot,
    HelpCircle,
    LogOut,
    ChevronDown,
    Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type MenuItem = {
    name: string;
    href: string;
    icon?: React.ReactNode;
    pro?: boolean;
};

export function Sidebar({ userProfile }: { userProfile: any }) {
    const router = useRouter();
    const supabase = createClient();

    const navigation: MenuItem[] = [
        {
            href: '/hub/bacheca',
            name: 'Bacheca',
            icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
            href: '/hub/concorsi',
            name: 'Concorsi',
            icon: <Search className="w-5 h-5" />,
        },
        {
            href: '/hub/regione',
            name: 'Regioni',
            icon: <MapPin className="w-5 h-5" />,
        },
        {
            href: '/hub/provincia',
            name: 'Province',
            icon: <MapPinned className="w-5 h-5" />,
        },
        {
            href: '/hub/ente',
            name: 'Ente',
            icon: <Building2 className="w-5 h-5" />,
        },
        {
            href: '/hub/settore',
            name: 'Settori',
            icon: <Briefcase className="w-5 h-5" />,
        },
        {
            href: '/hub/scadenza',
            name: 'Scadenze',
            icon: <CalendarDays className="w-5 h-5" />,
        },
        {
            href: '/hub/matching',
            name: 'Matching',
            icon: <Sparkles className="w-5 h-5" />,
            pro: true,
        },
        {
            href: '/hub/salvati',
            name: 'Salvato',
            icon: <Bookmark className="w-5 h-5" />,
            pro: true,
        },
        {
            href: '/hub/genio',
            name: 'Genio',
            icon: <Bot className="w-5 h-5" />,
            pro: true,
        },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/');
    };

    const sidebarNewsArticles: NewsArticle[] = [
        {
            href: 'https://concoro.it',
            title: 'Guida rapida: prepara il prossimo concorso',
            summary: 'Un piano essenziale per organizzare studio, test e candidatura in modo efficace.',
            image: '/Layer_2-1.svg',
        },
        {
            href: 'https://concoro.it',
            title: 'Aggiornamenti bandi e nuove opportunita',
            summary: 'Le ultime novita sulle posizioni aperte nella PA in tutta Italia.',
            image: '/Layer_2-2.svg',
        },
        {
            href: 'https://concoro.it',
            title: 'Come migliorare i punteggi ai quiz',
            summary: 'Strategie pratiche per aumentare precisione e velocita nelle simulazioni.',
            image: '/Layer_2.svg',
        },
    ];

    return (
        <nav className="fixed top-0 left-0 w-full h-full border-r bg-background sm:w-80 transition-all duration-300 ease-in-out z-40">
            <div className="flex h-full flex-col px-4 py-5">
                <div className="flex justify-start">
                    <img src="/concoro-logo-light.png" alt="Concoro" className="h-7 w-auto opacity-90" />
                </div>

                <div className="flex-1 flex items-center">
                    <ul className="w-full text-sm font-medium space-y-1">
                        {navigation.map((item, idx) => (
                            <li key={idx}>
                                <Link
                                    href={item.href}
                                    className="flex items-center gap-x-2 text-muted-foreground p-2.5 rounded-lg hover:bg-muted/50 active:bg-muted transition-all duration-200 group"
                                >
                                    <div className="text-muted-foreground/60 group-hover:text-primary transition-colors">
                                        {item.icon}
                                    </div>
                                    <span className="group-hover:translate-x-0.5 transition-transform">{item.name}</span>
                                    {item.pro && (
                                        <span className="ml-auto inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-700">
                                            PRO
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="pt-3 border-t border-border">
                    <div className="rounded-xl">
                        <News articles={sidebarNewsArticles} />
                    </div>

                    <Link
                        href="/hub/assistenza"
                        className="mb-3 flex items-center gap-x-2 text-muted-foreground p-2.5 rounded-lg hover:bg-muted/50 active:bg-muted transition-all duration-200 group text-sm font-medium"
                    >
                        <div className="text-muted-foreground/60 group-hover:text-primary transition-colors">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <span className="group-hover:translate-x-0.5 transition-transform">Assistenza</span>
                    </Link>

                    <div className="flex items-center gap-x-2">
                        <Link
                            href="/hub/profile"
                            className="min-w-0 flex-1 flex items-center gap-x-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors"
                        >
                            <Avatar.Root className="inline-flex items-center justify-center align-middle overflow-hidden select-none w-10 h-10 rounded-full ring-2 ring-gray-100 ring-offset-2">
                                <Avatar.Image
                                    className="w-full h-full object-cover"
                                    src={userProfile?.avatar_url || '/fav.png'}
                                    alt={userProfile?.full_name || 'User'}
                                />
                                <Avatar.Fallback className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 font-medium">
                                    {userProfile?.full_name?.charAt(0) || 'U'}
                                </Avatar.Fallback>
                            </Avatar.Root>
                            <div className="min-w-0">
                                <span className="block text-foreground text-sm font-semibold truncate">
                                    {userProfile?.full_name || 'Utente Concoro'}
                                </span>
                                <span className="block text-muted-foreground text-xs truncate">
                                    {userProfile?.email || 'utente@concoro.it'}
                                </span>
                            </div>
                        </Link>

                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <button
                                    className="p-2 rounded-lg text-muted-foreground/70 hover:bg-muted/50 active:bg-muted outline-none transition-colors"
                                    aria-label="Opzioni profilo"
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </button>
                            </DropdownMenu.Trigger>

                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    className="z-50 min-w-[140px] bg-card rounded-xl p-1.5 shadow-xl border border-border animate-in fade-in zoom-in duration-200"
                                    sideOffset={8}
                                    align="end"
                                >
                                    <DropdownMenu.Item className="outline-none">
                                        <Link
                                            href="/hub/billing"
                                            className="w-full flex items-center gap-2 p-2 text-sm text-muted-foreground rounded-md hover:bg-muted/50 transition-colors"
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            Billing
                                        </Link>
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Separator className="h-px bg-border my-1" />
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
        </nav>
    );
}
