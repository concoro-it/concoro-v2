import type { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';

export function AdminShell({
    children,
    generatedAt,
}: {
    children: ReactNode;
    generatedAt?: string;
}) {
    return (
        <div className="min-h-screen bg-[hsl(210,55%,98%)] text-slate-950">
            <div
                className="pointer-events-none fixed inset-0"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.035) 1px, transparent 1px), radial-gradient(circle at 14% 10%, rgba(14,78,136,0.12), transparent 32%), radial-gradient(circle at 86% 8%, rgba(16,185,129,0.10), transparent 28%)',
                    backgroundSize: '56px 56px, 56px 56px, auto, auto',
                }}
            />
            <div className="relative flex min-h-screen">
                <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0">
                    <AdminSidebar />
                </div>
                <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
                    <AdminTopbar generatedAt={generatedAt} />
                    <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
                        <div className="mx-auto max-w-[96rem]">{children}</div>
                    </main>
                </div>
            </div>
        </div>
    );
}
