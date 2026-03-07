import { stripe } from '@/lib/stripe/client';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { updateUserSubscription, deleteUserSubscription } from '@/lib/supabase/subscriptions';

// We need a server-side Supabase client with admin privileges to handle webhooks
// securely since the user is not authenticated in this context.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const rawBody = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!stripe) {
            return new NextResponse('Stripe not configured', { status: 500 });
        }
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error(`Webhook Error: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const subscription = event.data.object as Stripe.Subscription;

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                if (session.mode === 'subscription' && session.client_reference_id) {
                    const subscriptionId = session.subscription as string;

                    // Retrieve subscription details to get the end period
                    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const priceId = stripeSubscription.items.data[0].price.id;

                    await updateUserSubscription(
                        supabaseAdmin,
                        session.client_reference_id, // This is userId
                        priceId,
                        stripeSubscription.status,
                        session.customer as string,
                        subscriptionId,
                        new Date((stripeSubscription as any).current_period_end * 1000)
                    );
                }
                break;

            case 'customer.subscription.updated':
                // The subscription was updated (e.g., plan changed, renewed)
                const priceId = subscription.items.data[0].price.id;

                // We need to fetch the user id using the customer id
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', subscription.customer as string)
                    .single();

                if (profile) {
                    await updateUserSubscription(
                        supabaseAdmin,
                        profile.id,
                        priceId,
                        subscription.status,
                        subscription.customer as string,
                        subscription.id,
                        new Date((subscription as any).current_period_end * 1000)
                    );
                }
                break;

            case 'customer.subscription.deleted':
                // The subscription was canceled
                await deleteUserSubscription(supabaseAdmin, subscription.id);
                break;

            default:
                console.warn(`Unhandled event type: ${event.type}`);
        }
    } catch (error) {
        console.error('Webhook handler failed:', error);
        return new NextResponse('Webhook handler failed', { status: 500 });
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
}
