'use client';

import { usePathname } from 'next/navigation';
import { Header as GuestHeader } from '@/components/ui/header-2';

export function ConditionalHeader() {
    const pathname = usePathname();
    const isPrivateArea = pathname?.startsWith('/hub') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin');
    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/reset-password';
    const hasRouteSpecificHeader = pathname === '/pricing';

    // Keep private shells clean. Hub/Dashboard layouts manage their own navigation.
    if (isPrivateArea || isAuthPage || hasRouteSpecificHeader) {
        return null;
    }

    return <GuestHeader />;
}
