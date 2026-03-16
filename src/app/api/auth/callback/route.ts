import { NextRequest, NextResponse } from 'next/server';
import { createClient, createStaticAdminClient } from '@/lib/supabase/server';
import { getRequestBaseUrl } from '@/lib/auth/url';
import {
    dispatchBrevoEventOnce,
    getProfileWithCounts,
    toBrevoContactAttributes,
    upsertContact,
} from '@/lib/brevo';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/hub/bacheca';
    const baseUrl = getRequestBaseUrl(request);

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (user?.email) {
                    const supabaseAdmin = createStaticAdminClient();
                    const profileWithCounts = await getProfileWithCounts(supabaseAdmin, user.id);
                    const attributes = profileWithCounts
                        ? toBrevoContactAttributes(profileWithCounts)
                        : { USER_ID: user.id };

                    if (!profileWithCounts) {
                        console.warn('[auth-callback] profile not ready during Brevo sync', {
                            userId: user.id,
                            email: user.email,
                        });
                    }

                    const contactResult = await upsertContact(user.email, attributes, user.id);
                    if (!contactResult.ok) {
                        console.error('[auth-callback] Brevo contact upsert failed', {
                            userId: user.id,
                            email: user.email,
                            status: contactResult.status,
                            error: contactResult.error,
                        });
                    }

                    await dispatchBrevoEventOnce({
                        supabase: supabaseAdmin,
                        eventName: 'user_signed_up',
                        eventKey: user.id,
                        email: user.email,
                        userId: user.id,
                        source: 'auth_callback',
                        identifiers: {
                            email_id: user.email,
                            ext_id: user.id,
                        },
                        contactProperties: attributes,
                        eventProperties: {
                            created_at: user.created_at,
                            provider: user.app_metadata?.provider,
                        },
                    });
                }
            } catch (syncError) {
                console.error('[auth-callback] Brevo sync failed', syncError);
            }

            return NextResponse.redirect(`${baseUrl}${next}`);
        }
    }

    return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_error`);
}
