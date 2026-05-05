import { NextRequest, NextResponse } from 'next/server';
import { getCanonicalSiteUrl } from '@/lib/auth/url';
import {
    getGoogleIndexingMetadata,
    publishGoogleIndexingNotifications,
    type GoogleIndexingNotificationType,
} from '@/lib/google/indexing';

const MAX_URLS_PER_REQUEST = 200;

function isNotificationType(value: unknown): value is GoogleIndexingNotificationType {
    return value === 'URL_UPDATED' || value === 'URL_DELETED';
}

function parseDryRun(value: string | null | undefined) {
    return value === '1' || value === 'true';
}

function normalizeUrls(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
}

function filterAllowedUrls(urls: string[], allowedHost: string) {
    const unique = new Set<string>();

    for (const candidate of urls) {
        try {
            const parsed = new URL(candidate.trim());
            if (parsed.host !== allowedHost) continue;
            unique.add(parsed.toString());
        } catch {
            // Ignore malformed URLs.
        }
    }

    return Array.from(unique).slice(0, MAX_URLS_PER_REQUEST);
}

function isAuthorizedIndexingRequest(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return false;
    return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
    if (!isAuthorizedIndexingRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json().catch(() => null) as {
        url?: unknown;
        urls?: unknown;
        type?: unknown;
        dryRun?: unknown;
    } | null;
    const type = isNotificationType(payload?.type) ? payload.type : null;
    if (!type) {
        return NextResponse.json({ error: 'type must be URL_UPDATED or URL_DELETED' }, { status: 400 });
    }

    const baseUrl = getCanonicalSiteUrl();
    const allowedHost = new URL(baseUrl).host;
    const submittedUrls = [
        ...normalizeUrls(payload?.url),
        ...normalizeUrls(payload?.urls),
    ];
    const urls = filterAllowedUrls(submittedUrls, allowedHost);
    if (urls.length === 0) {
        return NextResponse.json({ error: `No valid URLs for host ${allowedHost}` }, { status: 400 });
    }

    const dryRun = typeof payload?.dryRun === 'boolean'
        ? payload.dryRun
        : parseDryRun(request.nextUrl.searchParams.get('dryRun'));
    const notifications = urls.map((url) => ({ url, type }));

    if (dryRun) {
        return NextResponse.json({ ok: true, dryRun: true, notifications });
    }

    const results = await publishGoogleIndexingNotifications(notifications);
    return NextResponse.json({
        ok: results.every((result) => result.ok),
        submitted: results.length,
        succeeded: results.filter((result) => result.ok).length,
        failed: results.filter((result) => !result.ok).length,
        results,
    }, { status: results.some((result) => !result.ok) ? 207 : 200 });
}

export async function GET(request: NextRequest) {
    if (!isAuthorizedIndexingRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawUrl = request.nextUrl.searchParams.get('url');
    if (!rawUrl) {
        return NextResponse.json({ error: 'Missing url query param' }, { status: 400 });
    }

    const baseUrl = getCanonicalSiteUrl();
    const allowedHost = new URL(baseUrl).host;
    const [url] = filterAllowedUrls([rawUrl], allowedHost);
    if (!url) {
        return NextResponse.json({ error: `URL must belong to ${allowedHost}` }, { status: 400 });
    }

    const metadata = await getGoogleIndexingMetadata(url);
    return NextResponse.json({ ok: true, metadata });
}
