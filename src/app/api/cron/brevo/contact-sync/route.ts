import { NextRequest, NextResponse } from 'next/server';
import { createStaticAdminClient } from '@/lib/supabase/server';
import { getProfileWithCounts, isAuthorizedCronRequest, toBrevoContactAttributes, upsertContact } from '@/lib/brevo';

export async function GET(req: NextRequest) {
    if (!isAuthorizedCronRequest(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createStaticAdminClient();

    const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .not('email', 'is', null);

    if (error) {
        console.error('[cron][contact-sync] failed to load profiles', error);
        return NextResponse.json({ ok: false, error: 'Failed to load profiles' }, { status: 500 });
    }

    let synced = 0;
    let failed = 0;

    for (const profile of profiles ?? []) {
        try {
            const profileWithCounts = await getProfileWithCounts(supabaseAdmin, profile.id as string);
            if (!profileWithCounts?.profile.email) {
                continue;
            }

            const attributes = toBrevoContactAttributes(profileWithCounts);
            const result = await upsertContact(profileWithCounts.profile.email, attributes, profileWithCounts.profile.id);

            if (result.ok) {
                synced += 1;
            } else {
                failed += 1;
            }
        } catch (syncError) {
            failed += 1;
            console.error('[cron][contact-sync] single contact sync failed', {
                userId: profile.id,
                syncError,
            });
        }
    }

    return NextResponse.json({
        ok: true,
        total: (profiles ?? []).length,
        synced,
        failed,
        timestamp: new Date().toISOString(),
    });
}
