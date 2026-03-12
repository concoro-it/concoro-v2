import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
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
