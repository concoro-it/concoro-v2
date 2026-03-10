import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getServerAppUrl } from '@/lib/auth/url';

export async function POST(req: Request) {
    try {
        if (!stripe) {
            return new NextResponse('Stripe not configured', { status: 500 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get the user's stripe customer id
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.stripe_customer_id) {
            return NextResponse.json(
                { error: 'No active subscription or customer ID found.' },
                { status: 404 }
            );
        }

        const host = req.headers.get('origin') || getServerAppUrl();

        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: `${host}/abbonamento`,
        });

        if (!session.url) {
            return new NextResponse('Could not create portal session', { status: 500 });
        }

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('[STRIPE_PORTAL_SESSION]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
