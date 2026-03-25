import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type NextFetchInit = RequestInit & {
    next?: {
        revalidate?: number;
        tags?: string[];
    };
};

interface PublicCacheOptions {
    revalidate?: number;
    tags?: string[];
}

export function createStaticClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export function createCachedPublicClient(options: PublicCacheOptions = {}) {
    const revalidate = options.revalidate ?? 3600;
    const defaultTags = options.tags ?? ['supabase-public'];

    const cacheAwareFetch: typeof fetch = async (input, init) => {
        const nextInit = (init ?? {}) as NextFetchInit;
        const existingTags = nextInit.next?.tags ?? [];
        const tags = Array.from(new Set([...existingTags, ...defaultTags]));

        return fetch(input, {
            ...nextInit,
            next: {
                ...nextInit.next,
                revalidate,
                tags,
            },
        });
    };

    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                fetch: cacheAwareFetch,
            },
        }
    );
}

export function createStaticAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export function createCachedServiceClient(options: PublicCacheOptions = {}) {
    const revalidate = options.revalidate ?? 3600;
    const defaultTags = options.tags ?? ['supabase-service'];

    const cacheAwareFetch: typeof fetch = async (input, init) => {
        const nextInit = (init ?? {}) as NextFetchInit;
        const existingTags = nextInit.next?.tags ?? [];
        const tags = Array.from(new Set([...existingTags, ...defaultTags]));

        return fetch(input, {
            ...nextInit,
            next: {
                ...nextInit.next,
                revalidate,
                tags,
            },
        });
    };

    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            global: {
                fetch: cacheAwareFetch,
            },
        }
    );
}


export async function createClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll(cookiesToSet: { name: string, value: string, options: CookieOptions }[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { /* Server component — read-only cookies ignored */ }
                },
            },
        }
    );
}

export async function createServiceClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll(cookiesToSet: { name: string, value: string, options: CookieOptions }[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { /* ignore */ }
                },
            },
        }
    );
}
