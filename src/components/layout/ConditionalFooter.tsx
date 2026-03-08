'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';

export function ConditionalFooter() {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/hub');

    if (isDashboard) {
        return null;
    }

    return <Footer />;
}
