import { NextResponse } from 'next/server';
import { getIsAdminUser } from '@/lib/dashboard/auth';
import { getAdminDashboardSnapshot } from '@/lib/dashboard/snapshot';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();
    const { user, isAdmin } = await getIsAdminUser(supabase);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await getAdminDashboardSnapshot();
    return NextResponse.json(snapshot, {
        headers: {
            'Cache-Control': 'private, max-age=60, stale-while-revalidate=60',
        },
    });
}
