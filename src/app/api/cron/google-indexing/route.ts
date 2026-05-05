import { NextRequest, NextResponse } from 'next/server';
import { getCanonicalSiteUrl } from '@/lib/auth/url';
import {
    getExpiredConcorsiIndexingCandidates,
    getOpenConcorsiIndexingCandidates,
    type ConcorsoIndexingCandidate,
} from '@/lib/supabase/queries';
import { createStaticAdminClient } from '@/lib/supabase/server';
import {
    publishGoogleIndexingNotifications,
    type GoogleIndexingNotificationType,
} from '@/lib/google/indexing';

const DEFAULT_HOURS = 24;
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

type CronMode = 'updates' | 'deletions' | 'all' | 'expired-backfill';

function parseMode(value: string | null): CronMode {
    if (value === 'deletions' || value === 'all' || value === 'expired-backfill') return value;
    return 'updates';
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

function toNotifications(
    baseUrl: string,
    candidates: ConcorsoIndexingCandidate[],
    type: GoogleIndexingNotificationType
) {
    return candidates.map((candidate) => ({
        url: `${baseUrl}/concorsi/${candidate.slug}`,
        type,
        lastModified: candidate.lastModified,
        deadline: candidate.deadline,
    }));
}

function isAuthorizedIndexingCronRequest(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return false;
    return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
    if (!isAuthorizedIndexingCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mode = parseMode(request.nextUrl.searchParams.get('mode'));
    const limit = parsePositiveInt(request.nextUrl.searchParams.get('limit'), DEFAULT_LIMIT, MAX_LIMIT);
    const hours = parsePositiveInt(request.nextUrl.searchParams.get('hours'), DEFAULT_HOURS, 24 * 30);
    const dryRun = parseDryRun(request.nextUrl.searchParams.get('dryRun'));
    const sinceIso = toSinceIso(hours);
    const baseUrl = getCanonicalSiteUrl();
    const supabase = createStaticAdminClient();

    const notifications: Array<{
        url: string;
        type: GoogleIndexingNotificationType;
        lastModified: string | null;
        deadline: string | null;
    }> = [];

    if (mode === 'updates' || mode === 'all') {
        const updateLimit = mode === 'all' ? Math.max(1, Math.floor(limit / 2)) : limit;
        const updateCandidates = await getOpenConcorsiIndexingCandidates(supabase, sinceIso, updateLimit);
        notifications.push(...toNotifications(baseUrl, updateCandidates, 'URL_UPDATED'));
    }

    if (mode === 'deletions' || mode === 'all' || mode === 'expired-backfill') {
        const deletionLimit = mode === 'all' ? Math.max(1, limit - notifications.length) : limit;
        const deletionCandidates = await getExpiredConcorsiIndexingCandidates(
            supabase,
            mode === 'expired-backfill' ? null : sinceIso,
            deletionLimit
        );
        notifications.push(...toNotifications(baseUrl, deletionCandidates, 'URL_DELETED'));
    }

    const cappedNotifications = notifications.slice(0, limit);
    if (dryRun) {
        return NextResponse.json({
            ok: true,
            dryRun: true,
            mode,
            hours,
            limit,
            candidateCount: cappedNotifications.length,
            notifications: cappedNotifications,
        });
    }

    if (cappedNotifications.length === 0) {
        return NextResponse.json({
            ok: true,
            mode,
            hours,
            submitted: 0,
            timestamp: new Date().toISOString(),
        });
    }

    const results = await publishGoogleIndexingNotifications(cappedNotifications);
    return NextResponse.json({
        ok: results.every((result) => result.ok),
        mode,
        hours,
        submitted: results.length,
        succeeded: results.filter((result) => result.ok).length,
        failed: results.filter((result) => !result.ok).length,
        results,
    }, { status: results.some((result) => !result.ok) ? 207 : 200 });
}
