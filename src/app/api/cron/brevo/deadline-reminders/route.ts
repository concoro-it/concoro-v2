import { NextRequest, NextResponse } from 'next/server';
import { createStaticAdminClient } from '@/lib/supabase/server';
import {
    dispatchBrevoEventOnce,
    getProfileWithCounts,
    isAuthorizedCronRequest,
    toBrevoContactAttributes,
    upsertContact,
} from '@/lib/brevo';

function toIsoWindow(daysFromNow: number): { start: string; end: string } {
    const now = new Date();
    const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromNow, 0, 0, 0));
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromNow + 1, 0, 0, 0));
    return {
        start: target.toISOString(),
        end: next.toISOString(),
    };
}

type SavedConcorsoRow = {
    user_id: string;
    concorsi:
    | {
        concorso_id: string;
        titolo: string | null;
        data_scadenza: string | null;
        ente_nome: string | null;
        slug: string | null;
        link_reindirizzamento: string | null;
    }
    | {
        concorso_id: string;
        titolo: string | null;
        data_scadenza: string | null;
        ente_nome: string | null;
        slug: string | null;
        link_reindirizzamento: string | null;
    }[]
    | null;
};

type SavedConcorsoItem = {
    concorso_id: string;
    titolo: string | null;
    data_scadenza: string | null;
    ente_nome: string | null;
    slug: string | null;
    link_reindirizzamento: string | null;
};

function normalizeConcorso(value: SavedConcorsoRow['concorsi']): SavedConcorsoItem | null {
    if (!value) return null;
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return value;
}

async function getSavedConcorsiInWindow(userIds: string[], start: string, end: string): Promise<SavedConcorsoRow[]> {
    if (userIds.length === 0) return [];

    const supabaseAdmin = createStaticAdminClient();
    const { data, error } = await supabaseAdmin
        .from('saved_concorsi')
        .select(`
      user_id,
      concorsi!inner (
        concorso_id,
        titolo,
        data_scadenza,
        ente_nome,
        slug,
        link_reindirizzamento
      )
    `)
        .in('user_id', userIds)
        .gte('concorsi.data_scadenza', start)
        .lt('concorsi.data_scadenza', end);

    if (error) {
        console.error('[cron][deadline-reminders] failed to load saved concorsi window', { start, end, error });
        return [];
    }

    return (data as SavedConcorsoRow[]) ?? [];
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
        console.error('[cron][deadline-reminders] failed to load users', usersError);
        return NextResponse.json({ ok: false, error: 'Failed to load users' }, { status: 500 });
    }

    const userIds = (users ?? []).map((u) => u.id as string);
    const plus1 = toIsoWindow(1);
    const plus3 = toIsoWindow(3);

    const [rows1, rows3] = await Promise.all([
        getSavedConcorsiInWindow(userIds, plus1.start, plus1.end),
        getSavedConcorsiInWindow(userIds, plus3.start, plus3.end),
    ]);

    const grouped = new Map<string, { day1: SavedConcorsoItem[]; day3: SavedConcorsoItem[] }>();

    for (const row of rows1) {
        if (!grouped.has(row.user_id)) {
            grouped.set(row.user_id, { day1: [], day3: [] });
        }
        const item = normalizeConcorso(row.concorsi);
        if (item) {
            grouped.get(row.user_id)!.day1.push(item);
        }
    }

    for (const row of rows3) {
        if (!grouped.has(row.user_id)) {
            grouped.set(row.user_id, { day1: [], day3: [] });
        }
        const item = normalizeConcorso(row.concorsi);
        if (item) {
            grouped.get(row.user_id)!.day3.push(item);
        }
    }

    let dispatched = 0;
    let deduped = 0;

    for (const user of users ?? []) {
        const email = user.email as string | null;
        if (!email) continue;

        const groupedUser = grouped.get(user.id as string);
        if (!groupedUser) continue;

        const profileWithCounts = await getProfileWithCounts(supabaseAdmin, user.id as string);
        if (!profileWithCounts) continue;

        const attributes = toBrevoContactAttributes(profileWithCounts);
        await upsertContact(email, attributes, profileWithCounts.profile.id);

        const day1 = groupedUser.day1;
        const day3 = groupedUser.day3;
        const dateKey = new Date().toISOString().slice(0, 10);

        const result = await dispatchBrevoEventOnce({
            supabase: supabaseAdmin,
            eventName: 'saved_concorsi_deadline_digest',
            eventKey: `${profileWithCounts.profile.id}:${dateKey}`,
            email,
            userId: profileWithCounts.profile.id,
            source: 'cron_deadline',
            identifiers: {
                email_id: email,
                ext_id: profileWithCounts.profile.id,
            },
            contactProperties: attributes,
            eventProperties: {
                digest_date: dateKey,
                due_in_1d_count: day1.length,
                due_in_3d_count: day3.length,
                due_in_1d_titles: day1.map((item) => item?.titolo).filter(Boolean).join(' | '),
                due_in_3d_titles: day3.map((item) => item?.titolo).filter(Boolean).join(' | '),
                due_in_1d_items_json: JSON.stringify(day1),
                due_in_3d_items_json: JSON.stringify(day3),
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
        dispatched,
        deduped,
        timestamp: new Date().toISOString(),
    });
}
