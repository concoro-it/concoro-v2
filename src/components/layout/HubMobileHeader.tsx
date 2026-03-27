'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, Search, Sparkles, Bookmark, Bell, Bot, CircleHelp, User, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

type MenuItem = {
  label: string;
  href: string;
  icon: React.ElementType<{ className?: string }>;
};

const menuItems: MenuItem[] = [
  { label: 'Bacheca', href: '/hub/bacheca', icon: LayoutDashboard },
  { label: 'Concorsi', href: '/hub/concorsi', icon: Search },
  { label: 'Abbinamenti', href: '/hub/matching', icon: Sparkles },
  { label: 'Salvati', href: '/hub/salvati', icon: Bookmark },
  { label: 'Avvisi', href: '/hub/alert', icon: Bell },
  { label: 'Genio', href: '/hub/genio', icon: Bot },
  { label: 'Profilo', href: '/hub/profile', icon: User },
  { label: 'Fatturazione', href: '/hub/billing', icon: CreditCard },
  { label: 'Assistenza', href: '/hub/assistenza', icon: CircleHelp },
];

export function HubMobileHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="lg:hidden sticky top-0 z-40 px-3 pt-3">
      <div className="rounded-2xl border border-border/70 bg-white/72 shadow-[0_10px_30px_-18px_hsl(var(--foreground)/0.6)] backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="flex h-14 items-center justify-between px-3">
          <Link href="/hub/bacheca" className="flex items-center">
            <Image
              src="/concoro-logo-light.png"
              alt="Concoro"
              width={118}
              height={30}
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>

          <button
            type="button"
            aria-label={open ? 'Chiudi menu' : 'Apri menu'}
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/65 text-foreground/90 transition-colors hover:bg-muted/50"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <nav className="border-t border-border/60 px-2 pb-2 pt-2" aria-label="Menu mobile hub">
            <div className="grid grid-cols-2 gap-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'bg-background/65 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
