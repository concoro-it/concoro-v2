import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getConcorsi } from '@/lib/supabase/queries';
import type { Concorso } from '@/types/concorso';
import type { Profile } from '@/types/profile';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DEFAULT_MATCHING_WEBHOOK_URL = 'https://n8n.concoro.it/webhook/concoro-matching-v2';
const WEBHOOK_TIMEOUT_MS = 4500;
const RECOMMENDATION_LIMIT = 5;

const CONCORSI_MATCH_SELECT = `
  concorso_id, status, status_label, slug, titolo, titolo_breve,
  descrizione, riassunto, num_posti, data_scadenza, data_pubblicazione,
  ente_nome, ente_slug, regioni_array, province_array,
  link_sito_pa, link_reindirizzamento, is_active, created_at
`;

type JsonObject = Record<string, unknown>;

interface RecommendationRequest {
    profile?: Partial<Profile> | null;
}

interface ParsedMatch {
    concorsoId: string | null;
    score: number | null;
    reason: string | null;
}

function isObject(value: unknown): value is JsonObject {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function getStringValue(source: JsonObject, keys: string[]): string | null {
    for (const key of keys) {
        const value = source[key];
        if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    }
    return null;
}

function parseScore(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        if (value <= 1) return Math.round(value * 100);
        return Math.round(Math.max(0, Math.min(100, value)));
    }
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value.replace(',', '.'));
        if (Number.isFinite(parsed)) return parseScore(parsed);
    }
    return null;
}

function tryArrayFromContainer(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (!isObject(value)) return [];

    for (const candidate of [value.matches, value.concorsi, value.results, value.items, value.data, value.recommendations]) {
        if (Array.isArray(candidate)) return candidate;
        if (isObject(candidate) && Array.isArray(candidate.items)) return candidate.items;
    }

    return [];
}

function parseMatches(payload: unknown): ParsedMatch[] {
    return tryArrayFromContainer(payload)
        .map((entry) => {
            if (!isObject(entry)) return null;
            return {
                concorsoId: getStringValue(entry, ['concorso_id', 'concorsoId', 'id']),
                score: parseScore(entry.match_score) ?? parseScore(entry.score) ?? parseScore(entry.compatibility) ?? parseScore(entry.fit),
                reason: getStringValue(entry, ['motivo', 'reason', 'why', 'summary', 'note', 'comment']),
            };
        })
        .filter((item): item is ParsedMatch => Boolean(item?.concorsoId))
        .slice(0, RECOMMENDATION_LIMIT);
}

async function fetchWebhookMatches(userId: string, profile: Partial<Profile>): Promise<ParsedMatch[]> {
    const webhookUrl = process.env.N8N_MATCHING_WEBHOOK_URL || DEFAULT_MATCHING_WEBHOOK_URL;
    if (!webhookUrl) return [];

    console.info('[onboarding/recommendations] forwarding to n8n', {
        userId,
        webhookHost: (() => {
            try {
                return new URL(webhookUrl).host;
            } catch {
                return 'invalid-url';
            }
        })(),
        hasRegion: Boolean(profile.regione_interesse || profile.preferred_regioni?.[0]),
        hasSector: Boolean(profile.settori_interesse?.[0] || profile.preferred_settori?.[0]),
        hasRole: Boolean(profile.profilo_professionale),
    });

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('request_id', crypto.randomUUID());
    formData.append('profile_json', JSON.stringify(profile));
    formData.append('cv_text', '');

    const headers: Record<string, string> = {};
    if (process.env.N8N_MATCHING_WEBHOOK_SECRET) {
        headers['x-matching-secret'] = process.env.N8N_MATCHING_WEBHOOK_SECRET;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) return [];

    const bodyController = new AbortController();
    const bodyTimeout = setTimeout(() => bodyController.abort(), WEBHOOK_TIMEOUT_MS);
    const text = await Promise.race([
        response.text(),
        new Promise<string>((_, reject) => {
            bodyController.signal.addEventListener('abort', () => reject(new Error('Matching webhook body timeout')), {
                once: true,
            });
        }),
    ]).finally(() => clearTimeout(bodyTimeout));
    const payload = (() => {
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    })();

    const matches = parseMatches(payload);
    console.info('[onboarding/recommendations] n8n response parsed', {
        userId,
        matchCount: matches.length,
    });
    return matches;
}

async function getConcorsiByMatchIds(
    supabase: SupabaseClient,
    matches: ParsedMatch[]
): Promise<Array<{ concorso: Concorso; score: number | null; reason: string | null }>> {
    const ids = Array.from(new Set(matches.map((item) => item.concorsoId).filter((id): id is string => Boolean(id))));
    if (!ids.length) return [];

    const { data, error } = await supabase
        .from('concorsi')
        .select(CONCORSI_MATCH_SELECT)
        .in('concorso_id', ids)
        .eq('is_active', true);

    if (error || !data) return [];

    const concorsiById = new Map((data as Concorso[]).map((item) => [item.concorso_id, item]));
    return matches
        .map((match) => {
            if (!match.concorsoId) return null;
            const concorso = concorsiById.get(match.concorsoId);
            if (!concorso) return null;
            return { concorso, score: match.score, reason: match.reason };
        })
        .filter((item): item is { concorso: Concorso; score: number | null; reason: string | null } => item !== null);
}

async function getFallbackRecommendations(supabase: SupabaseClient, profile: Partial<Profile>) {
    const settore = profile.settori_interesse?.[0] ?? profile.preferred_settori?.[0] ?? undefined;
    const result = await getConcorsi(
        supabase,
        {
            regione: profile.regione_interesse ?? profile.preferred_regioni?.[0] ?? undefined,
            provincia: profile.provincia_interesse ?? undefined,
            settore,
            query: profile.profilo_professionale ?? undefined,
            sort: 'scadenza',
            stato: 'aperti',
            solo_attivi: true,
        },
        1,
        RECOMMENDATION_LIMIT
    );

    if (result.data.length > 0) return result.data;

    const broadResult = await getConcorsi(
        supabase,
        {
            regione: profile.regione_interesse ?? profile.preferred_regioni?.[0] ?? undefined,
            provincia: profile.provincia_interesse ?? undefined,
            settore,
            sort: 'scadenza',
            stato: 'aperti',
            solo_attivi: true,
        },
        1,
        RECOMMENDATION_LIMIT
    );

    if (broadResult.data.length > 0) return broadResult.data;

    return (await getConcorsi(supabase, { sort: 'scadenza', stato: 'aperti', solo_attivi: true }, 1, RECOMMENDATION_LIMIT)).data;
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as RecommendationRequest;
    const { data: storedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle<Partial<Profile>>();

    const profile = {
        ...(storedProfile ?? {}),
        ...(body.profile ?? {}),
        id: user.id,
        email: user.email ?? storedProfile?.email ?? null,
    } as Partial<Profile>;

    try {
        const matches = await fetchWebhookMatches(user.id, profile);
        const webhookRecommendations = await getConcorsiByMatchIds(supabase, matches);
        if (webhookRecommendations.length > 0) {
            return NextResponse.json({
                source: 'webhook',
                recommendations: webhookRecommendations,
            });
        }
    } catch (error) {
        console.warn('[onboarding/recommendations] webhook fallback used', error);
    }

    const fallbackConcorsi = await getFallbackRecommendations(supabase, profile);
    console.info('[onboarding/recommendations] returning fallback', {
        userId: user.id,
        count: fallbackConcorsi.length,
    });
    return NextResponse.json({
        source: 'fallback',
        recommendations: fallbackConcorsi.map((concorso) => ({ concorso, score: null, reason: null })),
    });
}
