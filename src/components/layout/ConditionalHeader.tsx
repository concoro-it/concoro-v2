'use client';

import { usePathname } from 'next/navigation';
import { Header as GuestHeader } from '@/components/ui/header-2';

export function ConditionalHeader() {
    const pathname = usePathname();
    const isPrivateArea = pathname?.startsWith('/hub') || pathname?.startsWith('/dashboard');
    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/reset-password';

    // Keep private shells clean. Hub/Dashboard layouts manage their own navigation.
    if (isPrivateArea || isAuthPage) {
        return null;
    }

    return <GuestHeader />;
}
