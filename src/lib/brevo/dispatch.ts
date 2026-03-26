import type { SupabaseClient } from '@supabase/supabase-js';
import { createEvent, type BrevoEventIdentifiers } from '@/lib/brevo/events';

export type DispatchSource =
    | 'auth_callback'
    | 'cron_deadline'
    | 'cron_weekly'
    | 'cron_contact_sync'
    | 'cron_saved_search'
    | 'stripe_webhook';

type DispatchEventInput = {
    supabase: SupabaseClient;
    eventName: string;
    eventKey: string;
    email?: string | null;
    userId?: string | null;
    source: DispatchSource;
    identifiers: BrevoEventIdentifiers;
    contactProperties?: Record<string, unknown>;
    eventProperties?: Record<string, unknown>;
};

type DispatchLockInput = {
    supabase: SupabaseClient;
    eventName: string;
    eventKey: string;
    email?: string | null;
    userId?: string | null;
    source: DispatchSource;
    payload?: Record<string, unknown>;
};

function isUniqueViolation(error: { code?: string } | null): boolean {
    return error?.code === '23505';
}

export async function acquireDispatchLock(input: DispatchLockInput): Promise<{ acquired: boolean; deduped: boolean }> {
    const {
        supabase,
        eventName,
        eventKey,
        email,
        userId,
        source,
        payload = {},
    } = input;

    const { error: lockError } = await supabase
        .from('brevo_event_dispatches')
        .insert({
            event_name: eventName,
            event_key: eventKey,
            email: email ?? null,
            user_id: userId ?? null,
            source,
            payload,
            dispatched_at: new Date().toISOString(),
        });

    if (isUniqueViolation(lockError)) {
        return { acquired: false, deduped: true };
    }

    if (lockError) {
        console.error('[brevo-dispatch] failed to acquire idempotency lock', {
            eventName,
            eventKey,
            source,
            lockError,
        });
        return { acquired: false, deduped: false };
    }

    return { acquired: true, deduped: false };
}

export async function dispatchBrevoEventOnce(input: DispatchEventInput): Promise<{ ok: boolean; deduped: boolean }> {
    const {
        supabase,
        eventName,
        eventKey,
        email,
        userId,
        source,
        identifiers,
        contactProperties = {},
        eventProperties = {},
    } = input;

    const lock = await acquireDispatchLock({
        supabase,
        eventName,
        eventKey,
        email,
        userId,
        source,
        payload: {
            identifiers,
            contactProperties,
            eventProperties,
        },
    });

    if (lock.deduped) {
        return { ok: true, deduped: true };
    }

    if (!lock.acquired) {
        return { ok: false, deduped: false };
    }

    const sendResult = await createEvent(eventName, identifiers, contactProperties, eventProperties);

    if (!sendResult.ok) {
        console.error('[brevo-dispatch] failed to publish event', {
            eventName,
            eventKey,
            source,
            status: sendResult.status,
            error: sendResult.error,
        });

        // Keep the dispatch log row as audit trail/idempotency record.
        // Brevo Automation can be replayed manually if needed.
        return { ok: false, deduped: false };
    }

    return { ok: true, deduped: false };
}
