import type { SupabaseClient } from '@supabase/supabase-js';

export async function updateUserSubscription(
    supabase: SupabaseClient,
    userId: string,
    priceId: string,
    status: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    currentPeriodEnd: Date
) {
    const tier = status === 'active' || status === 'trialing' ? 'pro' : 'free';

    const { error } = await supabase
        .from('profiles')
        .update({
            tier,
            stripe_price_id: priceId,
            subscription_status: status,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            subscription_period_end: currentPeriodEnd.toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

    if (error) {
        console.error('Error updating user subscription:', error);
        throw error;
    }
}

export async function deleteUserSubscription(
    supabase: SupabaseClient,
    stripeSubscriptionId: string
) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .single();

    if (!profile) {
        console.warn(`No profile found for subscription ${stripeSubscriptionId}`);
        return;
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            tier: 'free',
            subscription_status: 'canceled',
            stripe_price_id: null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

    if (error) {
        console.error('Error deleting user subscription:', error);
        throw error;
    }
}

export async function getUserByStripeCustomerId(
    supabase: SupabaseClient,
    stripeCustomerId: string
) {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('stripe_customer_id', stripeCustomerId)
        .single();

    if (error) {
        console.error('Error getting user by stripe customer id:', error);
        return null;
    }

    return profile;
}
