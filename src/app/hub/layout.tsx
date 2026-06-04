import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { HubMobileHeader } from '@/components/layout/HubMobileHeader';
import { InteractiveMenu } from '@/components/ui/modern-mobile-menu';
import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/auth/getUserContext';
import { hasProAccess } from '@/lib/auth/tiers';

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { user, profile, tier } = await getUserContext<{
        avatar_url?: string | null;
        full_name?: string | null;
    }>(supabase, { profileSelect: 'avatar_url, full_name' });

    if (!user) {
        redirect('/login');
    }

    const canAccessBilling = hasProAccess(tier);

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            {/* Sidebar */}
            <aside className="hidden lg:block flex-shrink-0">
                <Sidebar userProfile={{ ...profile, email: user.email }} canAccessBilling={canAccessBilling} />
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <HubMobileHeader canAccessBilling={canAccessBilling} />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>

                <div className="lg:hidden fixed bottom-4 left-1/2 z-40 w-[min(100vw-1rem,680px)] -translate-x-1/2 px-1">
                    <InteractiveMenu />
                </div>
            </div>
        </div>
    );
}
