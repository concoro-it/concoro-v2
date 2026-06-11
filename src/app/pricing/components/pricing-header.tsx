import Image from 'next/image';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { buildAuthQueryParams } from '@/lib/auth/redirect';
import { cn } from '@/lib/utils';
import { PricingAccountMenu, type PricingHeaderUser } from './pricing-account-menu';

const links = [
    { label: 'Concorsi', href: '/concorsi' },
    { label: 'Regione', href: '/regione' },
    { label: 'Settore', href: '/settore' },
];

export function PricingHeader({
    user,
    checkoutRedirectPath,
    showLinks = true,
}: {
    user: PricingHeaderUser | null;
    checkoutRedirectPath: string;
    showLinks?: boolean;
}) {
    const authQuery = buildAuthQueryParams({
        redirectTo: checkoutRedirectPath,
        source: 'pricing-header',
        intent: 'pro',
    });

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-[hsl(210,55%,98%)]/90 backdrop-blur-md">
            <nav className="mx-auto flex h-14 max-w-[78rem] items-center justify-between px-4">
                <Link href="/" aria-label="Concoro home" className="inline-flex items-center">
                    <Image
                        src="/concoro-logo-light.png"
                        alt="Concoro"
                        width={120}
                        height={32}
                        className="h-[25.6px] w-auto object-contain"
                        priority
                    />
                </Link>

                {showLinks && (
                    <div className="hidden items-center gap-2 md:flex">
                        {links.map((link) => (
                            <Link key={link.href} className={buttonVariants({ variant: 'ghost' })} href={link.href}>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {user ? (
                        <PricingAccountMenu user={user} />
                    ) : (
                        <>
                            <Button variant="outline" asChild>
                                <Link href={`/login?${authQuery}`}>Accedi</Link>
                            </Button>
                            <Button asChild className="hidden sm:inline-flex">
                                <Link href={`/signup?${authQuery}`}>Registrati</Link>
                            </Button>
                        </>
                    )}
                </div>
            </nav>

            {showLinks && (
                <div className={cn('mx-auto flex max-w-[78rem] gap-1 overflow-x-auto px-4 pb-2 md:hidden')}>
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
                        >
                            {link.label}
                        </Link>
                    ))}
                    {user && (
                        <Link
                            href="/hub/bacheca"
                            className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
                        >
                            Hub
                        </Link>
                    )}
                </div>
            )}
        </header>
    );
}
