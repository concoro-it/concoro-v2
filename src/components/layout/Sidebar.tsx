'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import * as Avatar from '@radix-ui/react-avatar';
import * as Tooltip from '@radix-ui/react-tooltip';
import { News, type NewsArticle } from '@/components/ui/sidebar-news';
import {
    LayoutDashboard,
    Search,
    Bell,
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
    Sparkles,
    ChevronDown,
    PanelLeftClose,
    PanelLeftOpen,
    UserCircle2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type MenuItem = {
    name: string;
    href: string;
    icon?: React.ReactNode;
    pro?: boolean;
    badgeCount?: number;
};

type SidebarUserProfile = {
    avatar_url?: string | null;
    full_name?: string | null;
    email?: string | null;
};

function SidebarTooltip({
    enabled,
    content,
    children,
}: {
    enabled: boolean;
    content: string;
    children: React.ReactNode;
}) {
    if (!enabled) return <>{children}</>;

    return (
        <Tooltip.Root delayDuration={120}>
            <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Content
                    side="right"
                    sideOffset={10}
                    className="z-50 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-lg"
                >
                    {content}
                    <Tooltip.Arrow className="fill-white" />
                </Tooltip.Content>
            </Tooltip.Portal>
        </Tooltip.Root>
    );
}

const CONCORSI_SUBMENU: MenuItem[] = [
    {
        href: '/hub/regione',
        name: 'Regioni',
        icon: <MapPin className="w-4 h-4" />,
    },
    {
        href: '/hub/provincia',
        name: 'Province',
        icon: <MapPinned className="w-4 h-4" />,
    },
    {
        href: '/hub/ente',
        name: 'Ente',
        icon: <Building2 className="w-4 h-4" />,
    },
    {
        href: '/hub/settore',
        name: 'Settori',
        icon: <Briefcase className="w-4 h-4" />,
    },
    {
        href: '/hub/scadenza',
        name: 'Scadenze',
        icon: <CalendarDays className="w-4 h-4" />,
    },
];

export function Sidebar({ userProfile }: { userProfile: SidebarUserProfile | null }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [isConcorsiOpen, setIsConcorsiOpen] = React.useState(false);
    const [alertUnreadCount, setAlertUnreadCount] = React.useState(0);

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
            href: '/hub/salvati',
            name: 'Salvati',
            icon: <Bookmark className="w-5 h-5" />,
        },
        {
            href: '/hub/alert',
            name: 'Avvisi',
            icon: <Bell className="w-5 h-5" />,
            badgeCount: alertUnreadCount,
        },
        {
            href: '/hub/matching',
            name: 'Abbinamenti',
            icon: <Sparkles className="w-5 h-5" />,
            pro: true,
        },
        {
            href: '/hub/genio',
            name: 'Genio',
            icon: <Bot className="w-5 h-5" />,
            pro: true,
        },
        {
            href: '/hub/billing',
            name: 'Fatturazione',
            icon: <CreditCard className="w-5 h-5" />,
        },
        {
            href: '/hub/assistenza',
            name: 'Assistenza',
            icon: <HelpCircle className="w-5 h-5" />,
        },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/');
    };

    const sidebarNewsArticles: NewsArticle[] = [
        {
            id: 'guide-plan',
            href: 'https://concoro.it',
            title: 'Guida rapida: prepara il prossimo concorso',
            summary: 'Un piano essenziale per organizzare studio, test e candidatura in modo efficace.',
            image: '/Layer_2-1.svg',
        },
        {
            id: 'news-bandi',
            href: 'https://concoro.it/concorsi',
            title: 'Aggiornamenti bandi e nuove opportunita',
            summary: 'Le ultime novita sulle posizioni aperte nella PA in tutta Italia.',
            image: '/Layer_2-2.svg',
        },
        {
            id: 'tips-quiz',
            href: 'https://concoro.it/blog',
            title: 'Come migliorare i punteggi ai quiz',
            summary: 'Strategie pratiche per aumentare precisione e velocita nelle simulazioni.',
            image: '/Layer_2.svg',
        },
    ];

    React.useEffect(() => {
        const cached = window.localStorage.getItem('hub-sidebar-collapsed');
        if (cached === '1') setIsCollapsed(true);
    }, []);

    React.useEffect(() => {
        window.localStorage.setItem('hub-sidebar-collapsed', isCollapsed ? '1' : '0');
    }, [isCollapsed]);

    React.useEffect(() => {
        const isConcorsiRoute =
            pathname === '/hub/concorsi' ||
            CONCORSI_SUBMENU.some((item) => pathname?.startsWith(item.href));
        if (isConcorsiRoute) setIsConcorsiOpen(true);
    }, [pathname]);

    React.useEffect(() => {
        let cancelled = false;

        const loadSummary = async () => {
            try {
                const response = await fetch('/api/profile/saved-search-alerts/summary', { method: 'GET' });
                if (!response.ok) return;

                const result = (await response.json().catch(() => null)) as { unread_count?: number } | null;
                if (cancelled) return;

                setAlertUnreadCount(typeof result?.unread_count === 'number' ? result.unread_count : 0);
            } catch {
                // noop: sidebar badge is best-effort
            }
        };

        void loadSummary();
        const interval = window.setInterval(() => {
            void loadSummary();
        }, 120000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, []);

    return (
        <Tooltip.Provider>
            <nav
                className={cn(
                    'sticky top-0 z-40 h-screen border-r bg-background transition-[width] duration-300 ease-in-out',
                    isCollapsed ? 'w-[92px]' : 'w-80'
                )}
            >
            <div className={cn('flex h-full flex-col px-3 py-5', isCollapsed ? 'items-center' : 'px-4')}>
                <div
                    className={cn(
                        'flex w-full',
                        isCollapsed ? 'flex-col items-center gap-3' : 'items-center justify-between'
                    )}
                >
                    {isCollapsed ? (
                        <Image
                            src="/fav.png"
                            alt="Concoro"
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-xl border border-border/60 bg-white p-1 shadow-sm"
                        />
                    ) : (
                        <Image src="/concoro-logo-light.png" alt="Concoro" width={120} height={28} className="h-7 w-auto opacity-90" />
                    )}
                    <SidebarTooltip enabled={isCollapsed} content={isCollapsed ? 'Apri barra laterale' : 'Chiudi barra laterale'}>
                        <button
                            type="button"
                            aria-label={isCollapsed ? 'Apri barra laterale' : 'Chiudi barra laterale'}
                            onClick={() => setIsCollapsed((prev) => !prev)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                        >
                            {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                        </button>
                    </SidebarTooltip>
                </div>

                <div className={cn('mt-4 w-full flex-1', isCollapsed ? 'overflow-visible' : 'overflow-y-auto')}>
                    <ul className="w-full space-y-1 text-sm font-medium">
                        {navigation.map((item, idx) => (
                            <li key={idx} className="w-full">
                                {item.href === '/hub/concorsi' ? (
                                    <>
                                        <div className="flex items-center gap-1">
                                            <SidebarTooltip enabled={isCollapsed} content={item.name}>
                                                <Link
                                                    href={item.href}
                                                    title={item.name}
                                                    className={cn(
                                                        'group flex min-w-0 flex-1 items-center rounded-lg p-2.5 text-muted-foreground transition-all duration-200 hover:bg-muted/50 active:bg-muted',
                                                        pathname?.startsWith('/hub/concorsi') && 'bg-muted/60 text-foreground',
                                                        isCollapsed ? 'justify-center' : 'gap-x-2'
                                                    )}
                                                >
                                                    <div className="text-muted-foreground/70 transition-colors group-hover:text-primary">
                                                        {item.icon}
                                                    </div>
                                                    {!isCollapsed && (
                                                        <span className="truncate transition-transform group-hover:translate-x-0.5">
                                                            {item.name}
                                                        </span>
                                                    )}
                                                </Link>
                                            </SidebarTooltip>
                                            {!isCollapsed && (
                                                <button
                                                    type="button"
                                                    aria-label="Apri o chiudi il sottomenu concorsi"
                                                    onClick={() => setIsConcorsiOpen((prev) => !prev)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                                                >
                                                    <ChevronDown
                                                        className={cn(
                                                            'h-4 w-4 transition-transform duration-200',
                                                            isConcorsiOpen && 'rotate-180'
                                                        )}
                                                    />
                                                </button>
                                            )}
                                        </div>
                                        {!isCollapsed && isConcorsiOpen && (
                                            <ul className="ml-3 mt-1 space-y-0.5 border-l border-border/70 pl-3">
                                                {CONCORSI_SUBMENU.map((submenu) => (
                                                    <li key={submenu.href}>
                                                        <Link
                                                            href={submenu.href}
                                                            className={cn(
                                                                'group flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground',
                                                                pathname?.startsWith(submenu.href) && 'bg-muted/60 text-foreground'
                                                            )}
                                                        >
                                                            <span className="text-muted-foreground/70 transition-colors group-hover:text-primary">
                                                                {submenu.icon}
                                                            </span>
                                                            <span>{submenu.name}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                ) : (
                                    <SidebarTooltip enabled={isCollapsed} content={item.name}>
                                        <Link
                                            href={item.href}
                                            title={item.name}
                                            className={cn(
                                                'group flex items-center rounded-lg p-2.5 text-muted-foreground transition-all duration-200 hover:bg-muted/50 active:bg-muted',
                                                pathname?.startsWith(item.href) && 'bg-muted/60 text-foreground',
                                                isCollapsed ? 'justify-center' : 'gap-x-2'
                                            )}
                                        >
                                            <div className="text-muted-foreground/70 transition-colors group-hover:text-primary">
                                                {item.icon}
                                            </div>
                                            {!isCollapsed && (
                                                <span className="transition-transform group-hover:translate-x-0.5">{item.name}</span>
                                            )}
                                            {!isCollapsed && (item.badgeCount ?? 0) > 0 && (
                                                <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                                    {item.badgeCount! > 99 ? '99+' : item.badgeCount}
                                                </span>
                                            )}
                                            {!isCollapsed && item.pro && (
                                                <span className="ml-auto inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-700">
                                                    PRO
                                                </span>
                                            )}
                                        </Link>
                                    </SidebarTooltip>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="w-full border-t border-border pt-3">
                    {!isCollapsed && (
                        <div className="rounded-xl">
                            <News articles={sidebarNewsArticles} />
                        </div>
                    )}

                    <div className={cn('mt-2 flex items-center gap-2', isCollapsed && 'flex-col items-center')}>
                        <SidebarTooltip enabled={isCollapsed} content="Profilo">
                            <Link
                                href="/hub/profile"
                                title="Profilo"
                                className={cn(
                                    'min-w-0 rounded-lg p-2.5 transition-colors hover:bg-muted/50',
                                    isCollapsed ? 'flex h-11 w-11 items-center justify-center' : 'flex flex-1 items-center gap-3'
                                )}
                            >
                                {isCollapsed ? (
                                    <UserCircle2 className="h-6 w-6 text-muted-foreground" />
                                ) : (
                                    <>
                                        <Avatar.Root className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full align-middle ring-2 ring-gray-100 ring-offset-2 select-none">
                                            <Avatar.Image
                                                className="h-full w-full object-cover"
                                                src={userProfile?.avatar_url || '/fav.png'}
                                                alt={userProfile?.full_name || 'User'}
                                            />
                                            <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-gray-100 font-medium text-gray-500">
                                                {userProfile?.full_name?.charAt(0) || 'U'}
                                            </Avatar.Fallback>
                                        </Avatar.Root>
                                        <div className="min-w-0">
                                            <span className="block truncate text-sm font-semibold text-foreground">
                                                {userProfile?.full_name || 'Utente Concoro'}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {userProfile?.email || 'utente@concoro.it'}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </Link>
                        </SidebarTooltip>

                        <SidebarTooltip enabled={isCollapsed} content="Esci">
                            <button
                                type="button"
                                title="Esci"
                                onClick={handleLogout}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </SidebarTooltip>
                    </div>
                </div>
            </div>
            </nav>
        </Tooltip.Provider>
    );
}
