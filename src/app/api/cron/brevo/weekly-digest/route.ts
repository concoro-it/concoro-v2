import { NextRequest, NextResponse } from 'next/server';
import { createStaticAdminClient } from '@/lib/supabase/server';
import {
    dispatchBrevoEventOnce,
    getProfileWithCounts,
    isAuthorizedCronRequest,
    toBrevoContactAttributes,
    upsertContact,
} from '@/lib/brevo';

type DigestConcorso = {
    concorso_id: string;
    titolo: string | null;
    data_pubblicazione: string | null;
    data_scadenza: string | null;
    ente_nome: string | null;
    slug: string | null;
    link_reindirizzamento: string | null;
};

function getWeekKey(date: Date): string {
    const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() - day + 1);
    return utcDate.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
    if (!isAuthorizedCronRequest(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createStaticAdminClient();

    const { data: users, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, notification_email')
        .eq('notification_email', true)
        .not('email', 'is', null);

    if (usersError) {
        console.error('[cron][weekly-digest] failed to load users', usersError);
        return NextResponse.json({ ok: false, error: 'Failed to load users' }, { status: 500 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: concorsiRows, error: concorsiError } = await supabaseAdmin
        .from('concorsi')
        .select('concorso_id, titolo, data_pubblicazione, data_scadenza, ente_nome, slug, link_reindirizzamento')
        .gte('data_pubblicazione', sevenDaysAgo)
        .lte('data_pubblicazione', now.toISOString())
        .order('data_pubblicazione', { ascending: false })
        .limit(100);

    if (concorsiError) {
        console.error('[cron][weekly-digest] failed to load weekly concorsi', concorsiError);
        return NextResponse.json({ ok: false, error: 'Failed to load concorsi' }, { status: 500 });
    }

    const digestItems = (concorsiRows as DigestConcorso[]) ?? [];
    const weekKey = getWeekKey(now);

    let dispatched = 0;
    let deduped = 0;

    for (const user of users ?? []) {
        const email = user.email as string | null;
        if (!email) continue;

        const profileWithCounts = await getProfileWithCounts(supabaseAdmin, user.id as string);
        if (!profileWithCounts) continue;

        const attributes = toBrevoContactAttributes(profileWithCounts);
        await upsertContact(email, attributes, profileWithCounts.profile.id);

        const result = await dispatchBrevoEventOnce({
            supabase: supabaseAdmin,
            eventName: 'weekly_concorsi_digest',
            eventKey: `${profileWithCounts.profile.id}:${weekKey}`,
            email,
            userId: profileWithCounts.profile.id,
            source: 'cron_weekly',
            identifiers: {
                email_id: email,
                ext_id: profileWithCounts.profile.id,
            },
            contactProperties: attributes,
            eventProperties: {
                week_start: weekKey,
                total_new_concorsi: digestItems.length,
                digest_titles: digestItems.map((item) => item.titolo).filter(Boolean).join(' | '),
                digest_items_json: JSON.stringify(digestItems),
            },
        });

        if (result.deduped) {
            deduped += 1;
        } else if (result.ok) {
            dispatched += 1;
        }
    }

    return NextResponse.json({
        ok: true,
        users: (users ?? []).length,
        weeklyItems: digestItems.length,
        dispatched,
        deduped,
        timestamp: new Date().toISOString(),
    });
}
