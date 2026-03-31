const DEFAULT_AUTH_REDIRECT = '/hub/bacheca';

function isUnsafeRedirectPath(value: string) {
    return !value.startsWith('/') || value.startsWith('//');
}

export function sanitizeInternalRedirectPath(
    value: string | null | undefined,
    fallback: string = DEFAULT_AUTH_REDIRECT
) {
    if (!value) return fallback;

    const candidate = value.trim();
    if (!candidate || isUnsafeRedirectPath(candidate)) return fallback;

    try {
        const parsed = new URL(candidate, 'https://concoro.it');
        if (parsed.origin !== 'https://concoro.it') return fallback;
        if (!parsed.pathname.startsWith('/')) return fallback;
        if (parsed.pathname.startsWith('//')) return fallback;
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return fallback;
    }
}

export function buildAuthQueryParams(options: {
    redirectTo: string;
    source?: string | null;
    intent?: string | null;
}) {
    const params = new URLSearchParams();
    params.set('redirectTo', sanitizeInternalRedirectPath(options.redirectTo));

    if (options.source) params.set('source', options.source);
    if (options.intent) params.set('intent', options.intent);

    return params.toString();
}
