import { brevoRequest } from '@/lib/brevo/client';

export type BrevoEventIdentifiers = {
    email_id?: string;
    ext_id?: string;
    phone_id?: string;
    whatsapp_id?: string;
};

export async function createEvent(
    eventName: string,
    identifiers: BrevoEventIdentifiers,
    contactProperties: Record<string, unknown> = {},
    eventProperties: Record<string, unknown> = {}
): Promise<{ ok: boolean; status: number; error?: string }> {
    if (!eventName) {
        return { ok: false, status: 400, error: 'eventName required' };
    }

    if (!identifiers || Object.keys(identifiers).length === 0) {
        return { ok: false, status: 400, error: 'identifiers required' };
    }

    const result = await brevoRequest({
        path: '/events',
        method: 'POST',
        body: {
            eventName,
            identifiers,
            contactProperties,
            eventProperties,
        },
    });

    if (!result.ok) {
        return { ok: false, status: result.status, error: result.error };
    }

    return { ok: true, status: result.status };
}
