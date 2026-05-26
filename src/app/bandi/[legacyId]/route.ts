import type { NextRequest } from 'next/server';
import { redirectLegacyConcorsoId } from '@/lib/seo/legacy-concorso';

interface Props {
    params: Promise<{ legacyId: string }>;
}

export async function GET(_request: NextRequest, { params }: Props) {
    const { legacyId } = await params;
    return redirectLegacyConcorsoId(legacyId);
}
