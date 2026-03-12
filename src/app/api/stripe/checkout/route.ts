import { stripe } from '@/lib/stripe/client';
import { getProPriceId, type BillingCycle } from '@/lib/stripe/prices';
import { NextResponse } from 'next/server';
import { getServerAppUrl } from '@/lib/auth/url';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        if (!stripe) {
            return new NextResponse('Stripe not configured', { status: 500 });
        }

        const body = await req.json();
        const { billingCycle } = body as { billingCycle?: BillingCycle };

        if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
            return new NextResponse('Missing or invalid billingCycle', { status: 400 });
        }

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const host = getServerAppUrl();
        const priceId = getProPriceId(billingCycle);

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            client_reference_id: user.id,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${host}/hub/bacheca?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${host}/pricing?canceled=true`,
        });

        if (!checkoutSession.url) {
            return new NextResponse('Could not create checkout session', { status: 500 });
        }

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error('[STRIPE_CHECKOUT]', error);
        if (error instanceof Error && error.message.includes('Stripe price ID not configured')) {
            return new NextResponse(error.message, { status: 500 });
        }
        return new NextResponse('Internal Error', { status: 500 });
    }
}
