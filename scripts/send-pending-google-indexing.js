require('@next/env').loadEnvConfig(process.cwd());

const { createSign } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');

const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_INDEXING_PUBLISH_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const GOOGLE_INDEXING_SCOPE = 'https://www.googleapis.com/auth/indexing';
const NOTIFICATION_TYPE = 'URL_UPDATED';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://concoro.it';
const HOURS = Number.parseInt(process.argv[2] || '30', 10);

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function normalizePrivateKey(value) {
  return value.replace(/\\n/g, '\n');
}

function getServiceAccountConfig() {
  const rawJson = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    const parsed = JSON.parse(rawJson);
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

function createJwtAssertion(config) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: config.clientEmail,
    scope: GOOGLE_INDEXING_SCOPE,
    aud: GOOGLE_OAUTH_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const unsignedJwt = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claims))}`;
  const signature = createSign('RSA-SHA256').update(unsignedJwt).sign(config.privateKey);
  return `${unsignedJwt}.${base64UrlEncode(signature)}`;
}

async function getAccessToken() {
  const assertion = createJwtAssertion(getServiceAccountConfig());
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || `Google OAuth token request failed: ${response.status}`);
  }
  return payload.access_token;
}

async function publish(url, accessToken) {
  const response = await fetch(GOOGLE_INDEXING_PUBLISH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, type: NOTIFICATION_TYPE }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload && typeof payload === 'object' && 'error' in payload
      ? JSON.stringify(payload.error)
      : `Google Indexing publish failed: ${response.status}`;
    return { url, type: NOTIFICATION_TYPE, ok: false, status: response.status, response: payload, error };
  }
  return { url, type: NOTIFICATION_TYPE, ok: true, status: response.status, response: payload };
}

function comparableTime(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function isIndexable(row) {
  return Boolean(row.slug && !row.slug.startsWith('-') && row.titolo && row.titolo.trim().length >= 8);
}

async function getPending(supabase) {
  const since = new Date(Date.now() - HOURS * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  const rows = [];

  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('concorsi')
      .select('slug,titolo,updated_at,data_pubblicazione,created_at,data_scadenza,status,is_active')
      .not('slug', 'is', null)
      .eq('is_active', true)
      .gte('data_scadenza', now)
      .or('status.is.null,status.neq.CLOSED')
      .or(`updated_at.gte.${since},data_pubblicazione.gte.${since},created_at.gte.${since}`)
      .order('data_pubblicazione', { ascending: false, nullsFirst: false })
      .range(from, from + 999);

    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data.filter(isIndexable));
    if (data.length < 1000) break;
  }

  const slugs = rows.map((row) => row.slug);
  const existing = new Map();
  for (let index = 0; index < slugs.length; index += 50) {
    const { data, error } = await supabase
      .from('google_indexing_notifications')
      .select('concorso_slug,concorso_last_modified,last_success_at,last_status,last_attempt_at,last_error')
      .eq('notification_type', NOTIFICATION_TYPE)
      .in('concorso_slug', slugs.slice(index, index + 50));

    if (error) throw error;
    for (const row of data || []) {
      if (row.concorso_slug) existing.set(row.concorso_slug, row);
    }
  }

  const pending = rows
    .filter((row) => {
      const existingRow = existing.get(row.slug);
      const lastModified = row.updated_at || row.data_pubblicazione || row.created_at || null;
      return !existingRow?.last_success_at || comparableTime(existingRow.concorso_last_modified) < comparableTime(lastModified);
    })
    .map((row) => ({
      slug: row.slug,
      url: `${BASE_URL}/concorsi/${row.slug}`,
      lastModified: row.updated_at || row.data_pubblicazione || row.created_at || null,
      deadline: row.data_scadenza || null,
    }));

  return {
    since,
    openRecentCandidates: rows.length,
    pending,
    skippedAlreadySubmitted: rows.length - pending.length,
  };
}

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { since, openRecentCandidates, pending, skippedAlreadySubmitted } = await getPending(supabase);
  const accessToken = await getAccessToken();
  const nowIso = new Date().toISOString();
  const results = [];

  for (const notification of pending) {
    const result = await publish(notification.url, accessToken);
    results.push({ ...result, slug: notification.slug, lastModified: notification.lastModified });
    if (result.status === 429) break;
  }

  const rows = results.map((result) => ({
    url: result.url,
    notification_type: NOTIFICATION_TYPE,
    concorso_slug: result.slug,
    concorso_last_modified: result.lastModified,
    last_success_at: result.ok ? nowIso : null,
    last_attempt_at: nowIso,
    last_status: result.status,
    last_error: result.ok ? null : result.error || 'Google Indexing API request failed',
    attempt_count: 1,
    updated_at: nowIso,
  }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from('google_indexing_notifications')
      .upsert(rows, { onConflict: 'url,notification_type' });
    if (error) throw error;
  }

  const summary = {
    ok: results.every((result) => result.ok),
    hours: HOURS,
    since,
    openRecentCandidates,
    initialPendingCount: pending.length,
    skippedAlreadySubmitted,
    submitted: results.length,
    succeeded: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    stoppedOnQuota: results.some((result) => result.status === 429),
    firstError: results.find((result) => !result.ok)?.error || null,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
