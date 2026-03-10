import type { NextRequest } from 'next/server';

function stripTrailingSlash(url: string) {
    return url.replace(/\/+$/, '');
}

function isLocalhostUrl(url: string) {
    try {
        const parsed = new URL(url);
        return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    } catch {
        return false;
    }
}

export function getClientOAuthRedirectUrl() {
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const windowOrigin = stripTrailingSlash(window.location.origin);
    const hasConfiguredSiteUrl = Boolean(configuredSiteUrl && configuredSiteUrl.length > 0);

    const baseUrl = hasConfiguredSiteUrl
        ? stripTrailingSlash(configuredSiteUrl!)
        : windowOrigin;

    // In production, a stale localhost env var should never override the actual domain.
    if (isLocalhostUrl(baseUrl) && !isLocalhostUrl(windowOrigin)) {
        return `${windowOrigin}/api/auth/callback`;
    }

    return `${baseUrl}/api/auth/callback`;
}

export function getRequestBaseUrl(request: NextRequest) {
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (configuredSiteUrl && !isLocalhostUrl(configuredSiteUrl)) {
        return stripTrailingSlash(configuredSiteUrl);
    }

    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    const forwardedHost = request.headers.get('x-forwarded-host');
    if (forwardedHost) return `${proto}://${forwardedHost}`;

    const host = request.headers.get('host');
    if (host) return `${proto}://${host}`;

    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

    return stripTrailingSlash(new URL(request.url).origin);
}
