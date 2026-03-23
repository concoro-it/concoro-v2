import { brevoRequest } from '@/lib/brevo/client';

export type BrevoContactAttributes = Record<string, string | number | boolean | null>;

function parseBrevoListIds(rawValue: string | undefined): number[] {
    if (!rawValue) return [];

    const unique = new Set<number>();
    for (const chunk of rawValue.split(',')) {
        const trimmed = chunk.trim();
        if (!trimmed) continue;

        const parsed = Number.parseInt(trimmed, 10);
        if (Number.isNaN(parsed) || parsed <= 0) {
            console.warn('[brevo] Ignoring invalid list id value', { value: trimmed });
            continue;
        }
        unique.add(parsed);
    }

    return Array.from(unique);
}

const REGISTERED_USER_LIST_IDS = parseBrevoListIds(
    process.env.BREVO_REGISTERED_USERS_LIST_IDS
    ?? process.env.BREVO_REGISTERED_USERS_LIST_ID
    ?? process.env.BREVO_CONTACT_LIST_IDS
);
const DEFAULT_REGISTERED_USER_LIST_ID = 5;

if (REGISTERED_USER_LIST_IDS.length === 0) {
    console.warn('[brevo] Registered users list ids not configured; defaulting to list #5');
}

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

    payload.listIds = REGISTERED_USER_LIST_IDS.length > 0
        ? REGISTERED_USER_LIST_IDS
        : [DEFAULT_REGISTERED_USER_LIST_ID];

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
