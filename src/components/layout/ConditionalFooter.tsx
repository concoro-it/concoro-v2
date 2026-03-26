'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';

export function ConditionalFooter() {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/hub');
    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/reset-password';

    if (isDashboard || isAuthPage) {
        return null;
    }

    return <Footer />;
}
