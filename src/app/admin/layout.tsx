import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { getIsAdminUser } from '@/lib/dashboard/auth';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
    title: 'Admin Control Center | Concoro',
    robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { user, isAdmin } = await getIsAdminUser(supabase);

    if (!user) {
        redirect('/login?redirectTo=/admin');
    }

    if (!isAdmin) {
        redirect('/hub/bacheca');
    }

    return <AdminShell>{children}</AdminShell>;
}
