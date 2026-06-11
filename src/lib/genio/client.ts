'use client';

import type { GenioMatchResponse, GenioProfileInput } from '@/types/genio';

interface MatchGenioProfileOptions {
    matchCount?: number;
    signal?: AbortSignal;
}

export async function matchGenioProfile(
    profileInput: GenioProfileInput,
    options: MatchGenioProfileOptions = {}
): Promise<GenioMatchResponse> {
    const response = await fetch('/api/genio/match', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            profile_json: profileInput,
            match_count: options.matchCount ?? 10,
        }),
        signal: options.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            payload && typeof payload === 'object' && 'error' in payload
                ? String((payload as { error?: unknown }).error)
                : 'Non siamo riusciti a completare l’analisi. Riprova tra poco.';
        throw new Error(message);
    }

    return payload as GenioMatchResponse;
}
