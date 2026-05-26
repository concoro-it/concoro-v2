import { NextResponse } from 'next/server';
import { createCachedPublicClient } from '@/lib/supabase/server';
import { getCanonicalSiteUrl } from '@/lib/auth/url';

export function legacyGoneResponse() {
    return new NextResponse('Gone', {
        status: 410,
        headers: {
            'X-Robots-Tag': 'noindex, nofollow',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}

export function looksLikeLegacyConcorsoId(value: string | undefined) {
    return typeof value === 'string' && /^[a-f0-9]{24,40}$/i.test(value);
}

export async function getCanonicalConcorsoSlugByLegacyId(legacyId: string | undefined) {
    if (!looksLikeLegacyConcorsoId(legacyId)) {
        return null;
    }

    const supabase = createCachedPublicClient({
        revalidate: 3600,
        tags: ['public:legacy-concorsi-redirect'],
    });
    const { data, error } = await supabase
        .from('concorsi')
        .select('slug')
        .eq('concorso_id', legacyId)
        .maybeSingle();

    if (error || !data?.slug) {
        return null;
    }

    return data.slug as string;
}

export async function redirectLegacyConcorsoId(legacyId: string | undefined) {
    const slug = await getCanonicalConcorsoSlugByLegacyId(legacyId);

    if (!slug) {
        return legacyGoneResponse();
    }

    const target = new URL(`/concorsi/${slug}`, getCanonicalSiteUrl());
    return NextResponse.redirect(target, 301);
}
