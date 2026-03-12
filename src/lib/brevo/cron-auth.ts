import type { NextRequest } from 'next/server';

export function isAuthorizedCronRequest(req: NextRequest): boolean {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.warn('[brevo-cron] CRON_SECRET not set — endpoint unprotected');
        return true;
    }

    return authHeader === `Bearer ${cronSecret}`;
}
