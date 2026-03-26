import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATH_PREFIXES = ['/hub', '/dashboard', '/salvati', '/ricerche', '/impostazioni', '/abbonamento'];
const AUTHENTICATED_ALLOWED_PUBLIC_PATH_PREFIXES = [
    '/pricing',
    '/manifest',
    '/manifest.webmanifest',
    '/reset-password',
];

function hasSupabaseAuthCookie(request: NextRequest) {
    return request.cookies.getAll().some(({ name }) => name.includes('-auth-token'));
}

export async function updateSession(request: NextRequest) {
    const isProtected = PROTECTED_PATH_PREFIXES.some((path) => request.nextUrl.pathname.startsWith(path));
    const isAllowedPublicForAuthenticatedUser = AUTHENTICATED_ALLOWED_PUBLIC_PATH_PREFIXES
        .some((path) => request.nextUrl.pathname.startsWith(path));
    const mayHaveSession = hasSupabaseAuthCookie(request);

    // Fast-path anonymous traffic on public pages to keep public responses cache-friendly.
    if (!isProtected && !mayHaveSession) {
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll(cookiesToSet: { name: string, value: string, options: CookieOptions }[]) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                supabaseResponse = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
            },
        },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (isProtected && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirectTo', request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    // Logged-in users should stay in the private app area instead of public pages.
    if (!isProtected && !isAllowedPublicForAuthenticatedUser && user) {
        const url = request.nextUrl.clone();
        url.pathname = '/hub';
        url.search = '';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
