import { NextRequest, NextResponse } from 'next/server';
import { getCanonicalSiteUrl } from '@/lib/auth/url';
import {
    publishGoogleIndexingNotificationsUntilQuota,
    type GoogleIndexingNotificationType,
} from '@/lib/google/indexing';
import { getOpenConcorsiIndexingCandidates } from '@/lib/supabase/queries';
import { createStaticAdminClient } from '@/lib/supabase/server';

const DEFAULT_HOURS = 6;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const NOTIFICATION_TYPE: GoogleIndexingNotificationType = 'URL_UPDATED';

type ExistingNotification = {
    url: string;
    concorso_slug: string | null;
    concorso_last_modified: string | null;
    last_success_at: string | null;
};

function isAuthorizedIndexingCronRequest(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return false;
    return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

function parsePositiveInt(value: string | null, fallback: number, max: number) {
    const parsed = Number.parseInt(value ?? '', 10);
    if (!Number.isFinite(parsed) || parsed < 1) return fallback;
    return Math.min(parsed, max);
}

function parseDryRun(value: string | null) {
    return value === '1' || value === 'true';
}

function toSinceIso(hours: number) {
    return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function toComparableTime(value: string | null | undefined) {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
}

export async function GET(request: NextRequest) {
    if (!isAuthorizedIndexingCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hours = parsePositiveInt(request.nextUrl.searchParams.get('hours'), DEFAULT_HOURS, 24 * 7);
    const limit = parsePositiveInt(request.nextUrl.searchParams.get('limit'), DEFAULT_LIMIT, MAX_LIMIT);
    const dryRun = parseDryRun(request.nextUrl.searchParams.get('dryRun'));
    const sinceIso = toSinceIso(hours);
    const baseUrl = getCanonicalSiteUrl();
    const supabase = createStaticAdminClient();

    const candidates = await getOpenConcorsiIndexingCandidates(supabase, sinceIso, limit);
    const notifications = candidates.map((candidate) => ({
        url: `${baseUrl}/concorsi/${candidate.slug}`,
        type: NOTIFICATION_TYPE,
        slug: candidate.slug,
        lastModified: candidate.lastModified,
        deadline: candidate.deadline,
    }));

    if (notifications.length === 0) {
        return NextResponse.json({
            ok: true,
            dryRun,
            hours,
            limit,
            candidateCount: 0,
            submitted: 0,
            timestamp: new Date().toISOString(),
        });
    }

    const slugs = notifications.map((notification) => notification.slug);
    const { data: existingRows, error: existingError } = await supabase
        .from('google_indexing_notifications')
        .select('url, concorso_slug, concorso_last_modified, last_success_at')
        .eq('notification_type', NOTIFICATION_TYPE)
        .in('concorso_slug', slugs);

    if (existingError) {
        return NextResponse.json({
            ok: false,
            error: existingError.message,
            hint: 'Apply supabase/migrations/20260506090000_create_google_indexing_notifications.sql before enabling this cron.',
        }, { status: 500 });
    }

    const existingBySlug = new Map<string, ExistingNotification>();
    for (const row of (existingRows ?? []) as ExistingNotification[]) {
        if (row.concorso_slug) existingBySlug.set(row.concorso_slug, row);
    }

    const pending = notifications.filter((notification) => {
        const existing = existingBySlug.get(notification.slug);
        if (!existing?.last_success_at) return true;
        return toComparableTime(existing.concorso_last_modified) < toComparableTime(notification.lastModified);
    });

    if (dryRun) {
        return NextResponse.json({
            ok: true,
            dryRun: true,
            hours,
            limit,
            candidateCount: notifications.length,
            pendingCount: pending.length,
            skippedAlreadySubmitted: notifications.length - pending.length,
            notifications: pending,
        });
    }

    if (pending.length === 0) {
        return NextResponse.json({
            ok: true,
            hours,
            limit,
            candidateCount: notifications.length,
            submitted: 0,
            skippedAlreadySubmitted: notifications.length,
            timestamp: new Date().toISOString(),
        });
    }

    const nowIso = new Date().toISOString();
    const results = await publishGoogleIndexingNotificationsUntilQuota(
        pending.map((notification) => ({ url: notification.url, type: notification.type }))
    );
    const pendingByUrl = new Map(pending.map((notification) => [notification.url, notification]));

    const rows = results.map((result) => {
        const notification = pendingByUrl.get(result.url);
        return {
            url: result.url,
            notification_type: result.type,
            concorso_slug: notification?.slug ?? null,
            concorso_last_modified: notification?.lastModified ?? null,
            last_success_at: result.ok ? nowIso : null,
            last_attempt_at: nowIso,
            last_status: result.status,
            last_error: result.ok ? null : result.error ?? 'Google Indexing API request failed',
            attempt_count: 1,
            updated_at: nowIso,
        };
    });

    if (rows.length > 0) {
        const { error: upsertError } = await supabase
            .from('google_indexing_notifications')
            .upsert(rows, {
                onConflict: 'url,notification_type',
            });

        if (upsertError) {
            return NextResponse.json({
                ok: false,
                error: upsertError.message,
                submitted: results.length,
                succeeded: results.filter((result) => result.ok).length,
                failed: results.filter((result) => !result.ok).length,
                results,
            }, { status: 500 });
        }
    }

    return NextResponse.json({
        ok: results.every((result) => result.ok),
        hours,
        limit,
        candidateCount: notifications.length,
        pendingCount: pending.length,
        submitted: results.length,
        succeeded: results.filter((result) => result.ok).length,
        failed: results.filter((result) => !result.ok).length,
        stoppedOnQuota: results.some((result) => result.status === 429),
        results,
    }, { status: results.some((result) => !result.ok) ? 207 : 200 });
}
