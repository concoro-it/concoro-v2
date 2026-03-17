import { NextRequest, NextResponse } from 'next/server';
import { getCanonicalSiteUrl } from '@/lib/auth/url';

const BING_INDEXNOW_ENDPOINT = 'https://www.bing.com/indexnow';
const MAX_URLS_PER_REQUEST = 100;

function getRequiredEnv(name: 'INDEXNOW_KEY' | 'INDEXNOW_ENDPOINT_TOKEN') {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required env var: ${name}`);
    }

    return value;
}

function parseSubmittedUrls(body: unknown): string[] {
    if (!body || typeof body !== 'object') return [];
    const payload = body as { url?: unknown; urls?: unknown };

    if (typeof payload.url === 'string' && payload.url.trim().length > 0) {
        return [payload.url.trim()];
    }

    if (!Array.isArray(payload.urls)) return [];
    return payload.urls
        .filter((url): url is string => typeof url === 'string')
        .map((url) => url.trim())
        .filter((url) => url.length > 0)
        .slice(0, MAX_URLS_PER_REQUEST);
}

function filterAllowedUrls(urls: string[], allowedHost: string): string[] {
    const unique = new Set<string>();

    for (const candidate of urls) {
        try {
            const parsed = new URL(candidate);
            if (parsed.host !== allowedHost) continue;
            unique.add(parsed.toString());
        } catch {
            // Ignore malformed URLs.
        }
    }

    return Array.from(unique);
}

export async function POST(request: NextRequest) {
    try {
        const endpointToken = getRequiredEnv('INDEXNOW_ENDPOINT_TOKEN');
        const indexNowKey = getRequiredEnv('INDEXNOW_KEY');
        const receivedToken = request.headers.get('x-indexnow-token')?.trim();

        if (!receivedToken || receivedToken !== endpointToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const requestBody = await request.json();
        const submittedUrls = parseSubmittedUrls(requestBody);
        if (submittedUrls.length === 0) {
            return NextResponse.json(
                { error: 'Provide at least one URL in `url` or `urls`.' },
                { status: 400 },
            );
        }

        const baseUrl = getCanonicalSiteUrl();
        const allowedHost = new URL(baseUrl).host;
        const allowedUrls = filterAllowedUrls(submittedUrls, allowedHost);
        if (allowedUrls.length === 0) {
            return NextResponse.json(
                { error: `No valid URLs for host ${allowedHost}.` },
                { status: 400 },
            );
        }

        const bingResponse = await fetch(BING_INDEXNOW_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                host: allowedHost,
                key: indexNowKey,
                keyLocation: `${baseUrl}/${indexNowKey}.txt`,
                urlList: allowedUrls,
            }),
            cache: 'no-store',
        });

        if (!bingResponse.ok) {
            const responseText = await bingResponse.text();
            return NextResponse.json(
                { error: 'IndexNow request failed', details: responseText },
                { status: bingResponse.status },
            );
        }

        return NextResponse.json({
            ok: true,
            submitted: allowedUrls.length,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
