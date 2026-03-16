import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { toUrlSlug } from '@/lib/utils/regioni';

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

    return await updateSession(request);
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff|woff2)$).*)',
    ],
};
