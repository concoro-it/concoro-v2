import type { SupabaseClient } from '@supabase/supabase-js';
import { createStaticAdminClient } from '@/lib/supabase/server';
import { ADMIN_EMAIL } from '@/lib/dashboard/constants';

const ADMIN_EMAILS = new Set([ADMIN_EMAIL]);

function normalizeEmail(value: string | null | undefined) {
    return value?.trim().toLowerCase() ?? null;
}

function getIdentityEmails(user: Awaited<ReturnType<SupabaseClient['auth']['getUser']>>['data']['user']) {
    return (user?.identities ?? [])
        .flatMap((identity) => {
            const data = identity.identity_data as Record<string, unknown> | null | undefined;
            return [
                typeof data?.email === 'string' ? data.email : null,
                typeof data?.email_verified === 'string' ? data.email_verified : null,
            ];
        })
        .map(normalizeEmail)
        .filter((email): email is string => Boolean(email));
}

function getAuthEmails(user: Awaited<ReturnType<SupabaseClient['auth']['getUser']>>['data']['user']) {
    return [
        user?.email,
        typeof user?.user_metadata?.email === 'string' ? user.user_metadata.email : null,
        typeof user?.app_metadata?.email === 'string' ? user.app_metadata.email : null,
        ...getIdentityEmails(user),
    ]
        .map(normalizeEmail)
        .filter((email): email is string => Boolean(email));
}

async function getAdminAuthRecordEmails(userId: string) {
    try {
        const adminSupabase = createStaticAdminClient();
        const { data, error } = await adminSupabase.auth.admin.getUserById(userId);

        if (error) {
            console.warn('[admin-auth] failed to load service auth user', {
                userId,
                error: error.message,
            });
            return [];
        }

        return getAuthEmails(data.user);
    } catch (error) {
        console.warn('[admin-auth] service auth lookup unavailable', {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return [];
    }
}

async function getAdminProfileEmails(userId: string) {
    try {
        const adminSupabase = createStaticAdminClient();
        const { data, error } = await adminSupabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.warn('[admin-auth] failed to load service profile', {
                userId,
                error: error.message,
            });
            return [];
        }

        return [normalizeEmail((data as { email?: string | null } | null)?.email)].filter((email): email is string => Boolean(email));
    } catch (error) {
        console.warn('[admin-auth] service profile lookup unavailable', {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return [];
    }
}

export async function getIsAdminUser(supabase: SupabaseClient) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const authEmails = getAuthEmails(user);

    if (authEmails.some((email) => ADMIN_EMAILS.has(email))) {
        return {
            user,
            isAdmin: true,
        };
    }

    if (!user) {
        return {
            user,
            isAdmin: false,
        };
    }

    const [profileEmails, serviceAuthEmails] = await Promise.all([
        getAdminProfileEmails(user.id),
        getAdminAuthRecordEmails(user.id),
    ]);
    const allEmails = Array.from(new Set([...authEmails, ...profileEmails, ...serviceAuthEmails]));
    const isAdmin = allEmails.some((email) => ADMIN_EMAILS.has(email));

    if (!isAdmin) {
        console.warn('[admin-auth] non-admin session denied', {
            userId: user.id,
            emailsSeen: allEmails,
            expected: ADMIN_EMAIL,
        });
    }

    return {
        user,
        isAdmin,
    };
}
