import { NextRequest, NextResponse } from 'next/server';
import { createStaticAdminClient } from '@/lib/supabase/server';
import {
    dispatchBrevoEventOnce,
    getProfileWithCounts,
    isAuthorizedCronRequest,
    toBrevoContactAttributes,
    upsertContact,
} from '@/lib/brevo';
import { resolveEffectiveAlertPreferences } from '@/lib/alerts/preferences';
import type { UserTier } from '@/types/profile';

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
        .select('id, email, notification_email, tier')
        .eq('notification_email', true)
        .not('email', 'is', null);

    if (usersError) {
        console.error('[cron][deadline-reminders] failed to load users', usersError);
        return NextResponse.json({ ok: false, error: 'Failed to load users' }, { status: 500 });
    }

    const usersList = (users ?? []) as Array<{
        id: string;
        email: string | null;
        notification_email: boolean;
        tier: UserTier | null;
    }>;
    const userIds = usersList.map((u) => u.id);
    const proUserIds = usersList
        .filter((u) => u.tier === 'pro' || u.tier === 'admin')
        .map((u) => u.id);

    const { data: preferencesRows, error: preferencesError } = await supabaseAdmin
        .from('user_alert_preferences')
        .select('user_id, deadline_enabled, deadline_offsets')
        .in('user_id', proUserIds);

    if (preferencesError) {
        console.error('[cron][deadline-reminders] failed to load alert preferences', preferencesError);
        return NextResponse.json({ ok: false, error: 'Failed to load alert preferences' }, { status: 500 });
    }

    const preferencesByUser = new Map<string, { deadline_enabled: boolean | null; deadline_offsets: number[] | null }>();
    for (const row of preferencesRows ?? []) {
        preferencesByUser.set(row.user_id as string, {
            deadline_enabled: (row.deadline_enabled as boolean | null) ?? null,
            deadline_offsets: (row.deadline_offsets as number[] | null) ?? null,
        });
    }

    const effectiveByUser = new Map<string, { enabled: boolean; offsets: number[] }>();
    const offsetToUserIds = new Map<number, string[]>();

    for (const user of usersList) {
        const effective = resolveEffectiveAlertPreferences(user.tier ?? 'free', preferencesByUser.get(user.id) ?? null);
        effectiveByUser.set(user.id, { enabled: effective.deadlineEnabled, offsets: effective.deadlineOffsets });

        if (!effective.deadlineEnabled) continue;
        for (const offset of effective.deadlineOffsets) {
            const current = offsetToUserIds.get(offset) ?? [];
            current.push(user.id);
            offsetToUserIds.set(offset, current);
        }
    }

    const offsetsToQuery = [1, 3, 7].filter((offset) => (offsetToUserIds.get(offset)?.length ?? 0) > 0);
    const rowsByOffset = new Map<number, SavedConcorsoRow[]>();

    await Promise.all(offsetsToQuery.map(async (offset) => {
        const window = toIsoWindow(offset);
        const rows = await getSavedConcorsiInWindow(offsetToUserIds.get(offset) ?? userIds, window.start, window.end);
        rowsByOffset.set(offset, rows);
    }));

    const grouped = new Map<string, { day1: SavedConcorsoItem[]; day3: SavedConcorsoItem[]; day7: SavedConcorsoItem[] }>();

    const ensureGrouped = (userId: string) => {
        if (!grouped.has(userId)) {
            grouped.set(userId, { day1: [], day3: [], day7: [] });
        }
    };

    for (const row of rowsByOffset.get(1) ?? []) {
        ensureGrouped(row.user_id);
        const item = normalizeConcorso(row.concorsi);
        if (item) grouped.get(row.user_id)!.day1.push(item);
    }

    for (const row of rowsByOffset.get(3) ?? []) {
        ensureGrouped(row.user_id);
        const item = normalizeConcorso(row.concorsi);
        if (item) grouped.get(row.user_id)!.day3.push(item);
    }

    for (const row of rowsByOffset.get(7) ?? []) {
        ensureGrouped(row.user_id);
        const item = normalizeConcorso(row.concorsi);
        if (item) grouped.get(row.user_id)!.day7.push(item);
    }

    let dispatched = 0;
    let deduped = 0;

    for (const user of usersList) {
        const email = user.email as string | null;
        if (!email) continue;

        const effective = effectiveByUser.get(user.id);
        if (!effective || !effective.enabled) continue;

        const groupedUser = grouped.get(user.id as string);
        if (!groupedUser) continue;

        const day1 = groupedUser.day1;
        const day3 = groupedUser.day3;
        const day7 = groupedUser.day7;

        if (day1.length === 0 && day3.length === 0 && day7.length === 0) {
            continue;
        }

        const profileWithCounts = await getProfileWithCounts(supabaseAdmin, user.id as string);
        if (!profileWithCounts) continue;

        const attributes = toBrevoContactAttributes(profileWithCounts);
        await upsertContact(email, attributes, profileWithCounts.profile.id);

        const dateKey = new Date().toISOString().slice(0, 10);

        const result = await dispatchBrevoEventOnce({
            supabase: supabaseAdmin,
            eventName: 'saved_concorsi_deadline_digest',
            eventKey: `${profileWithCounts.profile.id}:${dateKey}:deadline_digest_v2`,
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
                enabled_offsets: effective.offsets.join(','),
                due_in_1d_count: day1.length,
                due_in_3d_count: day3.length,
                due_in_7d_count: day7.length,
                due_in_1d_titles: day1.map((item) => item?.titolo).filter(Boolean).join(' | '),
                due_in_3d_titles: day3.map((item) => item?.titolo).filter(Boolean).join(' | '),
                due_in_7d_titles: day7.map((item) => item?.titolo).filter(Boolean).join(' | '),
                due_in_1d_items_json: JSON.stringify(day1),
                due_in_3d_items_json: JSON.stringify(day3),
                due_in_7d_items_json: JSON.stringify(day7),
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
