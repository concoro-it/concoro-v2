import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { getAdminDashboardSnapshot } from '@/lib/dashboard/snapshot';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const snapshot = await getAdminDashboardSnapshot();

    return <AdminDashboard snapshot={snapshot} />;
}
