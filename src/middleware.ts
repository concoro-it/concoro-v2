import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { toUrlSlug } from '@/lib/utils/regioni';

const PV_GATE_COOKIE_NAME = 'pv_gate_v1';
const PV_GATE_SOFT_COOKIE_NAME = 'pv_gate_soft';
const PV_GATE_TTL_SECONDS = 60 * 60 * 24;
const PV_GATE_SOFT_TTL_SECONDS = 60 * 10;
const PV_GATE_MAX_SEEN_PATHS = 24;
const SEO_FUNNEL_PREFIXES = ['/concorsi', '/regione', '/provincia', '/ente', '/settore'];
const MAJOR_BOT_PATTERNS = [
    /googlebot/i,
    /bingbot/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /gptbot/i,
    /chatgpt-user/i,
    /perplexitybot/i,
    /claudebot/i,
    /anthropic-ai/i,
    /ccbot/i,
    /applebot/i,
];

type PvGateState = {
    count: number;
    seen: string[];
    startedAt: number;
};

type PvGateDecision = {
    state: PvGateState | null;
    showSoftGate: boolean;
    forceSignup: boolean;
    shouldClearSoftCookie: boolean;
};

function readIntEnv(name: string, fallback: number) {
    const value = Number.parseInt(process.env[name] ?? '', 10);
    return Number.isFinite(value) ? value : fallback;
}

function isPageviewGateEnabled() {
    return process.env.PV_GATE_ENABLED !== 'false';
}

function getSoftThreshold() {
    return readIntEnv('PV_GATE_THRESHOLD_SOFT', 2);
}

function getHardThreshold() {
    return readIntEnv('PV_GATE_THRESHOLD_HARD', 3);
}

function hasSupabaseAuthCookie(request: NextRequest) {
    return request.cookies.getAll().some(({ name }) => name.includes('-auth-token'));
}

function isSeoFunnelPath(pathname: string) {
    return SEO_FUNNEL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isMajorBot(userAgent: string) {
    return MAJOR_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function hashPath(pathname: string) {
    let hash = 2166136261;
    for (let i = 0; i < pathname.length; i += 1) {
        hash ^= pathname.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

function parsePvGateState(rawCookieValue: string | undefined): PvGateState | null {
    if (!rawCookieValue) return null;
    try {
        const parsed = JSON.parse(rawCookieValue) as Partial<PvGateState>;
        if (
            typeof parsed !== 'object'
            || parsed === null
            || typeof parsed.count !== 'number'
            || !Array.isArray(parsed.seen)
            || typeof parsed.startedAt !== 'number'
        ) {
            return null;
        }

        const normalizedSeen = parsed.seen
            .filter((item): item is string => typeof item === 'string' && item.length > 0)
            .slice(0, PV_GATE_MAX_SEEN_PATHS);

        return {
            count: Math.max(0, Math.floor(parsed.count)),
            seen: normalizedSeen,
            startedAt: parsed.startedAt,
        };
    } catch {
        return null;
    }
}

function buildInitialPvGateState(): PvGateState {
    return {
        count: 0,
        seen: [],
        startedAt: Date.now(),
    };
}

function evaluatePvGate(request: NextRequest): PvGateDecision {
    if (!isPageviewGateEnabled()) {
        return {
            state: null,
            showSoftGate: false,
            forceSignup: false,
            shouldClearSoftCookie: Boolean(request.cookies.get(PV_GATE_SOFT_COOKIE_NAME)),
        };
    }

    const pathname = request.nextUrl.pathname;
    const userAgent = request.headers.get('user-agent') ?? '';

    if (!isSeoFunnelPath(pathname) || isMajorBot(userAgent) || hasSupabaseAuthCookie(request)) {
        return {
            state: null,
            showSoftGate: false,
            forceSignup: false,
            shouldClearSoftCookie: Boolean(request.cookies.get(PV_GATE_SOFT_COOKIE_NAME)),
        };
    }

    const softThreshold = getSoftThreshold();
    const hardThreshold = Math.max(getHardThreshold(), softThreshold + 1);
    const previousState = parsePvGateState(request.cookies.get(PV_GATE_COOKIE_NAME)?.value) ?? buildInitialPvGateState();
    const currentPathHash = hashPath(pathname);
    const seenSet = new Set(previousState.seen);
    const isNewPath = !seenSet.has(currentPathHash);

    if (isNewPath) seenSet.add(currentPathHash);

    const nextState: PvGateState = {
        count: previousState.count + (isNewPath ? 1 : 0),
        seen: Array.from(seenSet).slice(-PV_GATE_MAX_SEEN_PATHS),
        startedAt: previousState.startedAt || Date.now(),
    };

    const showSoftGate = nextState.count === softThreshold;
    const forceSignup = nextState.count >= hardThreshold;

    return {
        state: nextState,
        showSoftGate,
        forceSignup,
        shouldClearSoftCookie: !showSoftGate,
    };
}

function applyPvGateCookies(response: NextResponse, request: NextRequest, decision: PvGateDecision) {
    const secureCookie = request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production';
    const baseCookieOptions = {
        path: '/',
        sameSite: 'lax' as const,
        secure: secureCookie,
    };

    if (decision.state) {
        response.cookies.set(PV_GATE_COOKIE_NAME, JSON.stringify(decision.state), {
            ...baseCookieOptions,
            maxAge: PV_GATE_TTL_SECONDS,
        });
    }

    if (decision.showSoftGate) {
        response.cookies.set(PV_GATE_SOFT_COOKIE_NAME, '1', {
            ...baseCookieOptions,
            maxAge: PV_GATE_SOFT_TTL_SECONDS,
        });
    } else if (decision.shouldClearSoftCookie) {
        response.cookies.set(PV_GATE_SOFT_COOKIE_NAME, '', {
            ...baseCookieOptions,
            maxAge: 0,
        });
    }

    return response;
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const legacyEnte = request.nextUrl.searchParams.get('ente');
    const legacyLocalita = request.nextUrl.searchParams.get('localita');

    if ((pathname === '/concorsi' || pathname === '/concorsi/') && (legacyEnte || legacyLocalita)) {
        const redirectTarget = request.nextUrl.clone();
        const nextPath = legacyEnte ? '/ente' : '/provincia';
        const nextValue = legacyEnte ?? legacyLocalita ?? '';
        const slug = toUrlSlug(nextValue);

        if (slug) {
            if (redirectTarget.hostname.toLowerCase() === 'www.concoro.it') {
                redirectTarget.hostname = 'concoro.it';
            }
            redirectTarget.pathname = `${nextPath}/${slug}`;
            redirectTarget.searchParams.delete('ente');
            redirectTarget.searchParams.delete('localita');
            return NextResponse.redirect(redirectTarget, 301);
        }
    }

    const hostname = request.nextUrl.hostname.toLowerCase();
    if (hostname === 'www.concoro.it') {
        const canonicalUrl = request.nextUrl.clone();
        canonicalUrl.hostname = 'concoro.it';
        return NextResponse.redirect(canonicalUrl, 301);
    }

    const gateDecision = evaluatePvGate(request);
    if (gateDecision.forceSignup) {
        const signupUrl = request.nextUrl.clone();
        signupUrl.pathname = '/signup';
        signupUrl.search = '';
        signupUrl.searchParams.set('redirectTo', '/hub/bacheca');
        signupUrl.searchParams.set('source', 'pv-gate');
        signupUrl.searchParams.set('intent', 'unlock');

        const redirectResponse = NextResponse.redirect(signupUrl, 302);
        return applyPvGateCookies(redirectResponse, request, gateDecision);
    }

    const response = await updateSession(request);
    return applyPvGateCookies(response, request, gateDecision);
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff|woff2)$).*)',
    ],
};
