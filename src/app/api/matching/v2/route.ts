import { NextRequest, NextResponse } from 'next/server';
import type { Profile } from '@/types/profile';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
const WEBHOOK_TIMEOUT_MS = 60000;

class RequestValidationError extends Error {}
class WebhookForwardError extends Error {}

interface ParsedMatchingRequest {
    userId: string;
    requestId: string;
    profileJson: Partial<Profile> | null;
    cvText: string | null;
    cvPdf: File | null;
}

async function tryForwardToN8n(payload: ParsedMatchingRequest): Promise<Response | null> {
    const webhookUrl = process.env.N8N_MATCHING_WEBHOOK_URL;
    if (!webhookUrl) return null;

    const formData = new FormData();
    formData.append('user_id', payload.userId);
    formData.append('request_id', payload.requestId);
    if (payload.profileJson) {
        formData.append('profile_json', JSON.stringify(payload.profileJson));
    }
    if (payload.cvText) {
        formData.append('cv_text', payload.cvText);
    }
    if (payload.cvPdf) {
        formData.append('cv_pdf', payload.cvPdf, payload.cvPdf.name || 'cv.pdf');
    }

    const headers: Record<string, string> = {};
    const n8nSecret = process.env.N8N_MATCHING_WEBHOOK_SECRET;
    if (n8nSecret) {
        headers['x-matching-secret'] = n8nSecret;
    }

    try {
        return await fetch(webhookUrl, {
            method: 'POST',
            headers,
            body: formData,
            signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown webhook error';
        throw new WebhookForwardError(`Failed to forward matching request to n8n: ${message}`);
    }
}

function normalizeString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

function parseUnknownJson(value: unknown): unknown {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }
    return value;
}

function parseProfileJson(value: unknown): Partial<Profile> | null {
    const parsed = parseUnknownJson(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Partial<Profile>;
}

async function parseRequestPayload(req: NextRequest): Promise<ParsedMatchingRequest> {
    const contentType = (req.headers.get('content-type') || '').toLowerCase();

    if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        const userId = normalizeString(formData.get('user_id'));
        if (!userId) {
            throw new RequestValidationError('user_id is required');
        }

        const requestId = normalizeString(formData.get('request_id')) ?? crypto.randomUUID();
        const profileJson = parseProfileJson(formData.get('profile_json'));
        const cvText = normalizeString(formData.get('cv_text'));

        const cvPdfRaw = formData.get('cv_pdf');
        const cvPdf = cvPdfRaw instanceof File && cvPdfRaw.size > 0 ? cvPdfRaw : null;

        return {
            userId,
            requestId,
            profileJson,
            cvText,
            cvPdf,
        };
    }

    const body = await req.json();
    const userId = normalizeString(body?.user_id);
    if (!userId) {
        throw new RequestValidationError('user_id is required');
    }

    return {
        userId,
        requestId: normalizeString(body?.request_id) ?? crypto.randomUUID(),
        profileJson: parseProfileJson(body?.profile_json),
        cvText: normalizeString(body?.cv_text),
        cvPdf: null,
    };
}

export async function POST(req: NextRequest) {
    try {
        const payload = await parseRequestPayload(req);
        const expectedSecret = process.env.MATCHING_WEBHOOK_SECRET;
        const providedSecret = req.headers.get('x-matching-secret')
            ?? req.headers.get('x-webhook-secret');

        const authorizedBySecret = Boolean(expectedSecret && providedSecret === expectedSecret);
        if (!authorizedBySecret) {
            const authSupabase = await createClient();
            const { data: { user } } = await authSupabase.auth.getUser();
            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if (user.id !== payload.userId) {
                return NextResponse.json({ error: 'Forbidden: user_id mismatch' }, { status: 403 });
            }
        }

        const forwardedResponse = await tryForwardToN8n(payload);
        if (!forwardedResponse) {
            return NextResponse.json(
                { error: 'N8N_MATCHING_WEBHOOK_URL is not configured' },
                { status: 500 }
            );
        }

        const bodyText = await forwardedResponse.text();
        const contentType = forwardedResponse.headers.get('content-type') || 'application/json; charset=utf-8';
        return new NextResponse(bodyText, {
            status: forwardedResponse.status,
            headers: {
                'content-type': contentType,
            },
        });
    } catch (error) {
        console.error('[matching-v2] fatal', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        const status = error instanceof RequestValidationError
            ? 400
            : error instanceof WebhookForwardError
                ? 502
                : 500;
        return NextResponse.json(
            {
                error: message,
            },
            { status }
        );
    }
}
