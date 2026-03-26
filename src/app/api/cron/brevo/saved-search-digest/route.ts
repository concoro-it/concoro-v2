import { NextRequest, NextResponse } from 'next/server';
import { createStaticAdminClient } from '@/lib/supabase/server';
import {
    dispatchBrevoEventOnce,
    getProfileWithCounts,
    isAuthorizedCronRequest,
    toBrevoContactAttributes,
    upsertContact,
} from '@/lib/brevo';
import { getConcorsi } from '@/lib/supabase/queries';
import {
    FREE_EMAIL_VISIBLE_LIMIT,
    PRO_EMAIL_VISIBLE_LIMIT,
    isProTier,
    mapSavedSearchToConcorsoFilters,
} from '@/lib/saved-search-alerts';
import type { Concorso } from '@/types/concorso';
import type { SavedSearch, UserTier } from '@/types/profile';

type DigestUser = {
    id: string;
    email: string | null;
    notification_email: boolean;
    tier: UserTier | null;
};

type SavedSearchDbRow = {
    id: string;
    user_id: string;
    name: string;
    filters: SavedSearch['filters'] | null;
    created_at: string;
};

function toComparableDate(value: string | null | undefined): number {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
}

function sortDigestItems(items: Concorso[]): Concorso[] {
    return [...items].sort((a, b) => {
        const byPublished = toComparableDate(b.data_pubblicazione) - toComparableDate(a.data_pubblicazione);
        if (byPublished !== 0) return byPublished;
        return toComparableDate(b.created_at) - toComparableDate(a.created_at);
    });
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
        console.error('[cron][saved-search-digest] failed to load users', usersError);
        return NextResponse.json({ ok: false, error: 'Failed to load users' }, { status: 500 });
    }

    const usersList = ((users ?? []) as DigestUser[]);
    const userIds = usersList.map((user) => user.id);

    if (userIds.length === 0) {
        return NextResponse.json({ ok: true, users: 0, dispatched: 0, deduped: 0, timestamp: new Date().toISOString() });
    }

    const [searchesResult, preferencesResult, subscriptionsResult] = await Promise.all([
        supabaseAdmin
            .from('saved_searches')
            .select('id, user_id, name, filters, created_at')
            .in('user_id', userIds),
        supabaseAdmin
            .from('saved_search_alert_preferences')
            .select('user_id, enabled')
            .in('user_id', userIds),
        supabaseAdmin
            .from('saved_search_alert_subscriptions')
            .select('user_id, saved_search_id, enabled')
            .in('user_id', userIds),
    ]);

    if (searchesResult.error || preferencesResult.error || subscriptionsResult.error) {
        const message = searchesResult.error?.message
            ?? preferencesResult.error?.message
            ?? subscriptionsResult.error?.message
            ?? 'Failed to load saved search alert inputs';

        console.error('[cron][saved-search-digest] failed to load inputs', {
            searchesError: searchesResult.error,
            preferencesError: preferencesResult.error,
            subscriptionsError: subscriptionsResult.error,
        });

        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }

    const searchesByUser = new Map<string, SavedSearchDbRow[]>();
    for (const row of searchesResult.data ?? []) {
        const userSearches = searchesByUser.get(row.user_id as string) ?? [];
        userSearches.push(row as SavedSearchDbRow);
        searchesByUser.set(row.user_id as string, userSearches);
    }

    const preferencesByUser = new Map<string, boolean>();
    for (const row of preferencesResult.data ?? []) {
        preferencesByUser.set(row.user_id as string, Boolean(row.enabled));
    }

    const subscriptionsByUser = new Map<string, Map<string, boolean>>();
    for (const row of subscriptionsResult.data ?? []) {
        const userId = row.user_id as string;
        const current = subscriptionsByUser.get(userId) ?? new Map<string, boolean>();
        current.set(row.saved_search_id as string, Boolean(row.enabled));
        subscriptionsByUser.set(userId, current);
    }

    let dispatched = 0;
    let deduped = 0;

    const nowIso = new Date().toISOString();
    const dateKey = nowIso.slice(0, 10);
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://concoro.it';

    for (const user of usersList) {
        const email = user.email;
        if (!email) continue;

        const globallyEnabled = preferencesByUser.get(user.id) ?? true;
        if (!globallyEnabled) continue;

        const allSearches = searchesByUser.get(user.id) ?? [];
        if (allSearches.length === 0) continue;

        const subscriptionMap = subscriptionsByUser.get(user.id) ?? new Map<string, boolean>();
        const activeSearches = allSearches.filter((search) => subscriptionMap.get(search.id) ?? true);

        if (activeSearches.length === 0) continue;

        const newRows: Array<{
            user_id: string;
            saved_search_id: string;
            concorso_id: string;
            first_seen_at: string;
            updated_at: string;
        }> = [];

        const pendingDigestByConcorso = new Map<string, Concorso>();

        for (const search of activeSearches) {
            const filters = mapSavedSearchToConcorsoFilters(search as SavedSearch);
            let concorsi: Concorso[] = [];
            try {
                const result = await getConcorsi(supabaseAdmin, filters, 1, 40);
                concorsi = result.data ?? [];
            } catch (error) {
                console.error('[cron][saved-search-digest] search query failed', {
                    userId: user.id,
                    searchId: search.id,
                    error,
                });
                continue;
            }
            const concorsoIds = concorsi.map((item) => item.concorso_id).filter(Boolean);

            if (concorsoIds.length === 0) continue;

            const { data: existingRows, error: existingError } = await supabaseAdmin
                .from('saved_search_alert_matches')
                .select('concorso_id, last_notified_at')
                .eq('user_id', user.id)
                .eq('saved_search_id', search.id)
                .in('concorso_id', concorsoIds);

            if (existingError) {
                console.error('[cron][saved-search-digest] existing matches lookup failed', {
                    userId: user.id,
                    searchId: search.id,
                    error: existingError,
                });
                continue;
            }

            const existingByConcorso = new Map<string, { last_notified_at: string | null }>();
            for (const existing of existingRows ?? []) {
                existingByConcorso.set(existing.concorso_id as string, {
                    last_notified_at: (existing.last_notified_at as string | null) ?? null,
                });
            }

            for (const concorso of concorsi) {
                const concorsoId = concorso.concorso_id;
                if (!concorsoId) continue;

                const existing = existingByConcorso.get(concorsoId);

                if (existing) {
                    if (!existing.last_notified_at && !pendingDigestByConcorso.has(concorsoId)) {
                        pendingDigestByConcorso.set(concorsoId, concorso);
                    }
                    continue;
                }

                newRows.push({
                    user_id: user.id,
                    saved_search_id: search.id,
                    concorso_id: concorsoId,
                    first_seen_at: nowIso,
                    updated_at: nowIso,
                });

                if (!pendingDigestByConcorso.has(concorsoId)) {
                    pendingDigestByConcorso.set(concorsoId, concorso);
                }
            }
        }

        if (newRows.length > 0) {
            const { error: insertError } = await supabaseAdmin
                .from('saved_search_alert_matches')
                .upsert(newRows, { onConflict: 'user_id,saved_search_id,concorso_id' });

            if (insertError) {
                console.error('[cron][saved-search-digest] failed to insert matches', {
                    userId: user.id,
                    error: insertError,
                });
                continue;
            }
        }

        if (pendingDigestByConcorso.size === 0) {
            continue;
        }

        const isProUser = isProTier((user.tier ?? 'free') as UserTier);
        const visibleLimit = isProUser ? PRO_EMAIL_VISIBLE_LIMIT : FREE_EMAIL_VISIBLE_LIMIT;

        const sortedPending = sortDigestItems(Array.from(pendingDigestByConcorso.values()));
        const shown = sortedPending.slice(0, visibleLimit);
        const remainingCount = Math.max(sortedPending.length - shown.length, 0);

        const profileWithCounts = await getProfileWithCounts(supabaseAdmin, user.id);
        if (!profileWithCounts) continue;

        const attributes = toBrevoContactAttributes(profileWithCounts);
        await upsertContact(email, attributes, profileWithCounts.profile.id);

        const result = await dispatchBrevoEventOnce({
            supabase: supabaseAdmin,
            eventName: 'saved_search_new_matches_digest',
            eventKey: `${profileWithCounts.profile.id}:${dateKey}:saved_search_digest_v1`,
            email,
            userId: profileWithCounts.profile.id,
            source: 'cron_saved_search',
            identifiers: {
                email_id: email,
                ext_id: profileWithCounts.profile.id,
            },
            contactProperties: attributes,
            eventProperties: {
                digest_date: dateKey,
                user_tier: user.tier ?? 'free',
                visible_limit: visibleLimit,
                total_new_matches: sortedPending.length,
                shown_matches_count: shown.length,
                remaining_count: remainingCount,
                shown_titles: shown.map((item) => item.titolo).filter(Boolean).join(' | '),
                shown_items_json: JSON.stringify(shown),
                view_all_url: `${appUrl}/hub/alert`,
                upgrade_url: `${appUrl}/pricing?source=saved-search-digest`,
                cta_message: isProUser
                    ? null
                    : remainingCount > 0
                        ? `+${remainingCount} altri concorsi. Passa a Pro per digest completi.`
                        : 'Passa a Pro per digest completi.',
            },
        });

        if (result.deduped) {
            deduped += 1;
        } else if (result.ok) {
            dispatched += 1;
        }

        if (result.ok) {
            const pendingConcorsoIds = Array.from(pendingDigestByConcorso.keys());
            const activeSearchIds = activeSearches.map((search) => search.id);

            if (pendingConcorsoIds.length > 0 && activeSearchIds.length > 0) {
                const { error: markError } = await supabaseAdmin
                    .from('saved_search_alert_matches')
                    .update({
                        last_notified_at: nowIso,
                        updated_at: nowIso,
                    })
                    .eq('user_id', user.id)
                    .in('saved_search_id', activeSearchIds)
                    .in('concorso_id', pendingConcorsoIds)
                    .is('last_notified_at', null);

                if (markError) {
                    console.error('[cron][saved-search-digest] failed to mark notified', {
                        userId: user.id,
                        error: markError,
                    });
                }
            }
        }
    }

    return NextResponse.json({
        ok: true,
        users: usersList.length,
        dispatched,
        deduped,
        timestamp: new Date().toISOString(),
    });
}
