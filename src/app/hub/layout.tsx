import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { InteractiveMenu } from '@/components/ui/modern-mobile-menu';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // Fetch user and profile
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            {/* Sidebar */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
                <Sidebar userProfile={{ ...profile, email: user.email }} />
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Spacing (since Sidebar is fixed) */}
                <header className="lg:hidden h-14 bg-white border-b flex items-center px-4 sticky top-0 z-30">
                    <span className="font-bold text-gray-900">Dashboard</span>
                </header>

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
