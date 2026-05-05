import { createSign } from 'node:crypto';

const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_INDEXING_PUBLISH_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const GOOGLE_INDEXING_METADATA_URL = 'https://indexing.googleapis.com/v3/urlNotifications/metadata';
const GOOGLE_INDEXING_SCOPE = 'https://www.googleapis.com/auth/indexing';
const GOOGLE_SITE_VERIFICATION_SCOPE = 'https://www.googleapis.com/auth/siteverification';
const GOOGLE_SITE_VERIFICATION_TOKEN_URL = 'https://www.googleapis.com/siteVerification/v1/token';
const GOOGLE_SITE_VERIFICATION_WEB_RESOURCE_URL = 'https://www.googleapis.com/siteVerification/v1/webResource';

export type GoogleIndexingNotificationType = 'URL_UPDATED' | 'URL_DELETED';

export type GoogleIndexingPublishResult = {
    url: string;
    type: GoogleIndexingNotificationType;
    ok: boolean;
    status: number;
    response?: unknown;
    error?: string;
};

type GoogleServiceAccountConfig = {
    clientEmail: string;
    privateKey: string;
};

function base64UrlEncode(input: string | Buffer) {
    return Buffer.from(input)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function normalizePrivateKey(value: string) {
    return value.replace(/\\n/g, '\n');
}

function getServiceAccountConfig(): GoogleServiceAccountConfig {
    const rawJson = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON?.trim();
    if (rawJson) {
        const parsed = JSON.parse(rawJson) as { client_email?: string; private_key?: string };
        if (parsed.client_email && parsed.private_key) {
            return {
                clientEmail: parsed.client_email,
                privateKey: normalizePrivateKey(parsed.private_key),
            };
        }
    }

    const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL?.trim();
    const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.trim();
    if (!clientEmail || !privateKey) {
        throw new Error('Missing Google Indexing API service account env vars');
    }

    return {
        clientEmail,
        privateKey: normalizePrivateKey(privateKey),
    };
}

function createJwtAssertion(config: GoogleServiceAccountConfig, scope: string) {
    const now = Math.floor(Date.now() / 1000);
    const header = {
        alg: 'RS256',
        typ: 'JWT',
    };
    const claims = {
        iss: config.clientEmail,
        scope,
        aud: GOOGLE_OAUTH_TOKEN_URL,
        iat: now,
        exp: now + 3600,
    };
    const unsignedJwt = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claims))}`;
    const signature = createSign('RSA-SHA256')
        .update(unsignedJwt)
        .sign(config.privateKey);

    return `${unsignedJwt}.${base64UrlEncode(signature)}`;
}

async function getAccessToken(scope = GOOGLE_INDEXING_SCOPE) {
    const assertion = createJwtAssertion(getServiceAccountConfig(), scope);
    const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion,
        }),
        cache: 'no-store',
    });

    const payload = await response.json().catch(() => null) as { access_token?: string; error?: string; error_description?: string } | null;
    if (!response.ok || !payload?.access_token) {
        throw new Error(payload?.error_description ?? payload?.error ?? `Google OAuth token request failed: ${response.status}`);
    }

    return payload.access_token;
}

export async function publishGoogleIndexingNotification(
    url: string,
    type: GoogleIndexingNotificationType,
    accessToken?: string
): Promise<GoogleIndexingPublishResult> {
    const token = accessToken ?? await getAccessToken();
    const response = await fetch(GOOGLE_INDEXING_PUBLISH_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, type }),
        cache: 'no-store',
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        const errorMessage = typeof payload === 'object' && payload !== null && 'error' in payload
            ? JSON.stringify(payload.error)
            : `Google Indexing publish failed: ${response.status}`;
        return { url, type, ok: false, status: response.status, response: payload, error: errorMessage };
    }

    return { url, type, ok: true, status: response.status, response: payload };
}

export async function publishGoogleIndexingNotifications(
    notifications: Array<{ url: string; type: GoogleIndexingNotificationType }>
) {
    const accessToken = await getAccessToken();
    const results: GoogleIndexingPublishResult[] = [];

    for (const notification of notifications) {
        results.push(await publishGoogleIndexingNotification(notification.url, notification.type, accessToken));
    }

    return results;
}

export async function getGoogleIndexingMetadata(url: string) {
    const accessToken = await getAccessToken();
    const requestUrl = new URL(GOOGLE_INDEXING_METADATA_URL);
    requestUrl.searchParams.set('url', url);

    const response = await fetch(requestUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(typeof payload === 'object' && payload !== null ? JSON.stringify(payload) : `Google metadata request failed: ${response.status}`);
    }

    return payload;
}

export async function getGoogleSiteVerificationDnsToken(domain: string) {
    const accessToken = await getAccessToken(GOOGLE_SITE_VERIFICATION_SCOPE);
    const response = await fetch(GOOGLE_SITE_VERIFICATION_TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            verificationMethod: 'DNS_TXT',
            site: {
                identifier: domain,
                type: 'INET_DOMAIN',
            },
        }),
        cache: 'no-store',
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(typeof payload === 'object' && payload !== null ? JSON.stringify(payload) : `Google site verification token request failed: ${response.status}`);
    }

    return payload as { token: string; method: 'DNS_TXT' };
}

export async function verifyGoogleSiteOwnershipWithDns(domain: string) {
    const accessToken = await getAccessToken(GOOGLE_SITE_VERIFICATION_SCOPE);
    const requestUrl = new URL(GOOGLE_SITE_VERIFICATION_WEB_RESOURCE_URL);
    requestUrl.searchParams.set('verificationMethod', 'DNS_TXT');

    const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            site: {
                identifier: domain,
                type: 'INET_DOMAIN',
            },
        }),
        cache: 'no-store',
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(typeof payload === 'object' && payload !== null ? JSON.stringify(payload) : `Google site verification insert failed: ${response.status}`);
    }

    return payload;
}
