import { stripe } from '@/lib/stripe/client';
import { PLANS } from '@/lib/stripe/prices';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        if (!stripe) {
            return new NextResponse('Stripe not configured', { status: 500 });
        }

        const body = await req.json();
        const { priceId, userId } = body;

        if (!priceId || !userId) {
            return new NextResponse('Missing priceId or userId', { status: 400 });
        }

        // Make sure priceId matches one of our plans
        if (priceId !== PLANS.pro.price_id_monthly && priceId !== PLANS.pro.price_id_yearly) {
            return new NextResponse('Invalid priceId', { status: 400 });
        }

        const host = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            client_reference_id: userId,
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
        return new NextResponse('Internal Error', { status: 500 });
    }
}
