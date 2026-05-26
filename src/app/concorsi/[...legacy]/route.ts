import type { NextRequest } from 'next/server';
import { legacyGoneResponse, redirectLegacyConcorsoId } from '@/lib/seo/legacy-concorso';

interface Props {
    params: Promise<{ legacy: string[] }>;
}

function looksLikeLegacyConcorsoPath(segments: string[]) {
    const maybeYear = segments.at(-2);
    const maybeId = segments.at(-1);

    return (
        segments.length >= 4
        && typeof maybeYear === 'string'
        && /^\d{4}$/.test(maybeYear)
        && typeof maybeId === 'string'
        && /^[a-f0-9]{24,40}$/i.test(maybeId)
    );
}

export async function GET(_request: NextRequest, { params }: Props) {
    const { legacy } = await params;
    if (!looksLikeLegacyConcorsoPath(legacy)) {
        return legacyGoneResponse();
    }

    const legacyId = legacy.at(-1);
    return redirectLegacyConcorsoId(legacyId);
}
