'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Header as GuestHeader } from '@/components/ui/header-2';

interface ConditionalHeaderProps {
    user: any; // Ideally this would be typed with Supabase User
}

export function ConditionalHeader({ user }: ConditionalHeaderProps) {
    const pathname = usePathname();

    // Don't show any header on dashboard routes for logged-in users
    if (user && pathname?.startsWith('/hub')) {
        return null;
    }

    // Show new Header for guest users
    if (!user) {
        return <GuestHeader />;
    }

    // Show existing Navbar for logged-in users on other pages
    return <Navbar user={user} />;
}
