'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Search, BookOpen, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MobileNav() {
    const pathname = usePathname();

    const navItems = [
        {
            label: 'Home',
            href: '/',
            icon: Home,
        },
        {
            label: 'Cerca',
            href: '/concorsi',
            icon: Search,
        },
        {
            label: 'Salvati',
            href: '/salvati',
            icon: BookOpen, // Or BookmarkIcon
        },
        {
            label: 'Profilo',
            href: '/dashboard',
            icon: User,
        },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground transition-colors',
                                isActive && 'text-primary'
                            )}
                        >
                            <item.icon className={cn('w-5 h-5', isActive && 'fill-primary/20')} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
