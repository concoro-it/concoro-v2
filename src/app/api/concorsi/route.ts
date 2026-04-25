import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/concorsi
 * Ingest cron endpoint — protected by Authorization: Bearer {CRON_SECRET}
 * Called by an external cron job to trigger data ingestion from INPA.
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.warn('[/api/concorsi] CRON_SECRET not set — endpoint unprotected');
    }

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Trigger ingestion logic here.
        // This is a placeholder — replace with your actual INPA scraper / ingestion pipeline.
        console.log('[/api/concorsi] Cron triggered at', new Date().toISOString());

        // Example: call an external ingestion service or run DB upserts
        // const result = await ingestFromInpa();

        return NextResponse.json({
            ok: true,
            message: 'Ingest cron triggered',
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[/api/concorsi] Cron error:', err);
        return NextResponse.json({ error: 'Ingest failed' }, { status: 500 });
    }
}
