import { brevoRequest } from '@/lib/brevo/client';

export type BrevoContactAttributes = Record<string, string | number | boolean | null>;

export async function upsertContact(
    email: string,
    attributes: BrevoContactAttributes = {},
    extId?: string
): Promise<{ ok: boolean; status: number; error?: string }> {
    if (!email) {
        return { ok: false, status: 400, error: 'email required' };
    }

    const payload: Record<string, unknown> = {
        email,
        attributes,
        updateEnabled: true,
    };

    if (extId) {
        payload.ext_id = extId;
    }

    const result = await brevoRequest({
        path: '/contacts',
        method: 'POST',
        body: payload,
    });

    if (!result.ok) {
        return { ok: false, status: result.status, error: result.error };
    }

    return { ok: true, status: result.status };
}
