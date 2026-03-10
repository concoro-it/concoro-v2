import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRequestBaseUrl } from '@/lib/auth/url';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/hub/bacheca';
    const baseUrl = getRequestBaseUrl(request);

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${baseUrl}${next}`);
        }
    }

    return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_error`);
}
