import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeGenioProfile, normalizeMatchCount } from '@/lib/genio/normalize';
import type { GenioMatchRequest, GenioMatchResponse, GenioProfileInput } from '@/types/genio';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DEFAULT_GENIO_V2_WEBHOOK_URL = 'https://n8n.concoro.it/webhook/genio-v2-match';
const WEBHOOK_TIMEOUT_MS = 58000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

class RequestValidationError extends Error {}
class WebhookForwardError extends Error {}

interface IncomingMatchBody {
    profile_json?: GenioProfileInput;
    profileInput?: GenioProfileInput;
    profile?: GenioProfileInput;
    match_count?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function getClientIp(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')?.trim()
        || 'unknown';
}

function checkRateLimit(key: string): boolean {
    const now = Date.now();
    const current = rateLimitBuckets.get(key);

    if (!current || current.resetAt <= now) {
        rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }

    current.count += 1;
    return true;
}

async function parseRequest(req: NextRequest): Promise<GenioMatchRequest> {
    let body: IncomingMatchBody;

    try {
        body = await req.json();
    } catch {
        throw new RequestValidationError('Payload JSON non valido');
    }

    if (!isRecord(body)) {
        throw new RequestValidationError('Payload non valido');
    }

    const profileInput = body.profile_json ?? body.profileInput ?? body.profile;
    if (!isRecord(profileInput)) {
        throw new RequestValidationError('profile_json e richiesto');
    }

    return {
        profile_json: normalizeGenioProfile(profileInput),
        match_count: normalizeMatchCount(body.match_count, 10),
    };
}

async function forwardToGenioV2(payload: GenioMatchRequest): Promise<GenioMatchResponse> {
    const webhookUrl = process.env.GENIO_V2_WEBHOOK_URL || DEFAULT_GENIO_V2_WEBHOOK_URL;
    const webhookSecret = process.env.GENIO_V2_WEBHOOK_SECRET;

    if (!webhookSecret) {
        throw new WebhookForwardError('Configurazione Genio V2 incompleta');
    }

    let response: Response;
    try {
        response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-concoro-secret': webhookSecret,
            },
            body: JSON.stringify(payload),
            cache: 'no-store',
            signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
        });
    } catch {
        throw new WebhookForwardError('Genio V2 non e raggiungibile');
    }

    const text = await response.text();
    const parsed = (() => {
        try {
            return JSON.parse(text) as unknown;
        } catch {
            return null;
        }
    })();

    if (!response.ok) {
        throw new WebhookForwardError(`Genio V2 ha risposto con HTTP ${response.status}`);
    }

    if (!isRecord(parsed) || !Array.isArray(parsed.results)) {
        throw new WebhookForwardError('Risposta Genio V2 non valida');
    }

    return {
        query: typeof parsed.query === 'string' ? parsed.query : undefined,
        result_count:
            typeof parsed.result_count === 'number'
                ? parsed.result_count
                : parsed.results.length,
        results: parsed.results as GenioMatchResponse['results'],
    };
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }

        const rateLimitKey = `${user.id}:${getClientIp(req)}`;
        if (!checkRateLimit(rateLimitKey)) {
            return NextResponse.json(
                { error: 'Troppe richieste. Riprova tra poco.' },
                { status: 429 }
            );
        }

        const payload = await parseRequest(req);
        const result = await forwardToGenioV2(payload);

        return NextResponse.json(result);
    } catch (error) {
        const status =
            error instanceof RequestValidationError
                ? 400
                : error instanceof WebhookForwardError
                    ? 502
                    : 500;

        if (!(error instanceof RequestValidationError)) {
            const message = error instanceof Error ? error.message : 'Errore sconosciuto';
            console.error('[genio-match] Genio V2 failed', { message });
        }

        return NextResponse.json(
            { error: 'Non siamo riusciti a completare l’analisi. Riprova tra poco.' },
            { status }
        );
    }
}
