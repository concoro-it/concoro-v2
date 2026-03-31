'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { buildAuthQueryParams } from '@/lib/auth/redirect';

const SEO_FUNNEL_PREFIXES = ['/concorsi', '/regione', '/provincia', '/ente', '/settore'];

function isSeoFunnelPath(pathname: string) {
    return SEO_FUNNEL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function hasSoftGateCookie() {
    if (typeof document === 'undefined') return false;
    return document.cookie.split(';').some((chunk) => chunk.trim() === 'pv_gate_soft=1');
}

export function PublicPageviewGateBanner() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!pathname || !isSeoFunnelPath(pathname)) {
            setIsVisible(false);
            return;
        }
        setIsVisible(hasSoftGateCookie());
    }, [pathname]);

    if (!isVisible) return null;

    const authQuery = buildAuthQueryParams({
        redirectTo: '/hub/bacheca',
        source: 'pv-gate-soft',
        intent: 'unlock-before-hard',
    });

    return (
        <div className="border-y border-amber-300/80 bg-amber-50/90">
            <div className="container mx-auto flex max-w-[78rem] flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="inline-flex items-center gap-2 font-medium text-amber-900">
                    <AlertTriangle className="h-4 w-4" />
                    Hai 1 pagina gratuita rimasta: dalla prossima sara richiesto l&apos;account.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={`/signup?${authQuery}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-700 px-3 py-1.5 font-semibold text-white transition hover:bg-amber-800"
                    >
                        Crea account
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                        href={`/login?${authQuery}`}
                        className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-900 transition hover:bg-amber-100"
                    >
                        Accedi
                    </Link>
                </div>
            </div>
        </div>
    );
}
