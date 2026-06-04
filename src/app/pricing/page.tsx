import type { Metadata } from 'next';
import { PricingSection } from './components/pricing-section';
import { PricingHeader } from './components/pricing-header';
import { createClient } from '@/lib/supabase/server';
import { buildProCheckoutUrl, getProCheckoutLink } from '@/lib/stripe/prices';
import { buildAuthQueryParams } from '@/lib/auth/redirect';
import { getUserContext } from '@/lib/auth/getUserContext';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Prezzi — Concoro',
    description: 'Confronta Free e Concoro Pro per monitorare i concorsi giusti, ricevere alert mirati e non perdere le scadenze importanti.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PricingPage({
    searchParams,
}: {
    searchParams?: Promise<{ billing?: string; checkout?: string }>;
}) {
    const supabase = await createClient();
    const { user, profile } = await getUserContext<{
        avatar_url?: string | null;
        full_name?: string | null;
    }>(supabase, { profileSelect: 'avatar_url, full_name' });
    const resolvedSearchParams = await searchParams;
    const hasMonthly = Boolean(getProCheckoutLink('monthly') || process.env.STRIPE_PRO_PRICE_ID_MONTHLY);
    const hasYearly = Boolean(getProCheckoutLink('yearly') || process.env.STRIPE_PRO_PRICE_ID_YEARLY);

    const requestedBilling = resolvedSearchParams?.billing === 'yearly' ? 'yearly' : 'monthly';
    const initialBilling =
        requestedBilling === 'yearly'
            ? (hasYearly ? 'yearly' : 'monthly')
            : (hasMonthly ? 'monthly' : 'yearly');
    const checkoutReturnPath = `/pricing?billing=${initialBilling}&checkout=pro`;

    if (resolvedSearchParams?.checkout === 'pro') {
        if (!user) {
            redirect(`/login?${buildAuthQueryParams({
                redirectTo: checkoutReturnPath,
                source: 'pricing',
                intent: 'pro',
            })}`);
        }

        redirect(buildProCheckoutUrl(initialBilling, {
            clientReferenceId: user.id,
            email: user.email ?? undefined,
        }));
    }

    return (
        <>
            <PricingHeader
                user={user ? {
                    email: user.email,
                    fullName: profile?.full_name ?? null,
                    avatarUrl: profile?.avatar_url ?? null,
                } : null}
                checkoutRedirectPath={checkoutReturnPath}
            />
            <PricingSection
                userId={user?.id}
                userEmail={user?.email ?? undefined}
                initialBilling={initialBilling}
                availableBillingCycles={{
                    monthly: hasMonthly,
                    yearly: hasYearly,
                }}
            />
        </>
    );
}
