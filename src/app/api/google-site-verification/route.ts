import { NextRequest, NextResponse } from 'next/server';
import {
    getGoogleSiteVerificationDnsToken,
    verifyGoogleSiteOwnershipWithDns,
} from '@/lib/google/indexing';

function isAuthorizedVerificationRequest(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return false;
    return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

function getDomain(request: NextRequest) {
    return request.nextUrl.searchParams.get('domain')?.trim() || 'concoro.it';
}

export async function GET(request: NextRequest) {
    if (!isAuthorizedVerificationRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const domain = getDomain(request);
    const result = await getGoogleSiteVerificationDnsToken(domain);

    return NextResponse.json({
        ok: true,
        domain,
        method: result.method,
        dnsRecord: {
            type: 'TXT',
            name: domain,
            value: result.token,
        },
    });
}

export async function POST(request: NextRequest) {
    if (!isAuthorizedVerificationRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const domain = getDomain(request);
    const result = await verifyGoogleSiteOwnershipWithDns(domain);

    return NextResponse.json({
        ok: true,
        domain,
        result,
    });
}
