'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useScroll } from '@/components/ui/use-scroll';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

interface NavbarProps {
    user: User;
}

export function Navbar({ user }: NavbarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const scrolled = useScroll(10);
    const profileImage =
        typeof user.user_metadata?.avatar_url === 'string' && user.user_metadata.avatar_url.trim().length > 0
            ? user.user_metadata.avatar_url
            : '/fav.png';
    const profileLabel = typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim().length > 0
        ? user.user_metadata.full_name
        : (user.email ?? 'Profilo');
    const profileInitial = (profileLabel.charAt(0) || 'P').toUpperCase();

    return (
        <nav className={cn(
            "sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm transition-all duration-300 ease-out",
            scrolled ? "md:top-4 md:max-w-[72rem] md:rounded-2xl md:border md:shadow-lg md:mx-auto" : "w-full"
        )}>
            <div className={cn(
                "container mx-auto px-4 h-14 flex items-center justify-between transition-all duration-300",
                scrolled ? "max-w-[72rem]" : "max-w-[80rem]"
            )}>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/concoro-logo-light.png"
                        alt="Concoro Logo"
                        width={120}
                        height={32}
                        className="h-8 w-auto object-contain"
                        priority
                    />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium text-muted-foreground">
                    <Link href="/concorsi" className="hover:text-foreground transition-colors">Concorsi</Link>
                    <Link href="/regione" className="hover:text-foreground transition-colors">Regioni</Link>
                    <Link href="/provincia" className="hover:text-foreground transition-colors">Province</Link>
                    <Link href="/settore" className="hover:text-foreground transition-colors">Settori</Link>
                    <Link href="/scadenza" className="hover:text-foreground transition-colors">Scadenze</Link>
                    <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
                    <Link href="/pricing" className="hover:text-foreground transition-colors">Prezzi</Link>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center h-10 w-10 rounded-full ring-1 ring-border overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                        aria-label="Vai al profilo"
                        title={profileLabel}
                    >
                        {profileImage === '/fav.png' ? (
                            <span className="text-sm font-semibold text-foreground">{profileInitial}</span>
                        ) : (
                            <img
                                src={profileImage}
                                alt={profileLabel}
                                className="h-full w-full object-cover"
                            />
                        )}
                    </Link>
                </div>

                {/* Mobile menu toggle */}
                <button
                    className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-2">
                    <Link href="/concorsi" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Concorsi</Link>
                    <Link href="/regione" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Regioni</Link>
                    <Link href="/provincia" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Province</Link>
                    <Link href="/settore" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Settori</Link>
                    <Link href="/scadenza" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Scadenze</Link>
                    <Link href="/blog" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Blog</Link>
                    <Link href="/pricing" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Prezzi</Link>
                    <div className="pt-2 border-t border-border flex flex-col gap-2">
                        <Link href="/dashboard" className="block py-2 text-sm font-medium text-center border border-border rounded-lg" onClick={() => setMobileOpen(false)}>
                            Profilo
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
