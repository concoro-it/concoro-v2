const BREVO_API_BASE = 'https://api.brevo.com/v3';

type BrevoRequestOptions = {
    path: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
};

export async function brevoRequest<T = unknown>({
    path,
    method = 'POST',
    body,
}: BrevoRequestOptions): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        console.warn('[brevo] BREVO_API_KEY is not configured');
        return { ok: false, status: 500, error: 'BREVO_API_KEY missing' };
    }

    try {
        const response = await fetch(`${BREVO_API_BASE}${path}`, {
            method,
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'api-key': apiKey,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[brevo] Request failed', { path, status: response.status, errorText });
            return { ok: false, status: response.status, error: errorText || 'Brevo request failed' };
        }

        if (response.status === 204) {
            return { ok: true, status: 204 };
        }

        const data = (await response.json()) as T;
        return { ok: true, status: response.status, data };
    } catch (error) {
        console.error('[brevo] Network error', { path, error });
        return { ok: false, status: 500, error: 'Network error' };
    }
}
