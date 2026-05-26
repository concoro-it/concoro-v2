import type { Metadata } from 'next';
import { PricingSection } from './components/pricing-section';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getProCheckoutLink } from '@/lib/stripe/prices';

export const metadata: Metadata = {
    title: 'Prezzi — Concoro',
    description: 'Confronta Free e Concoro Pro per monitorare i concorsi giusti, ricevere alert mirati e non perdere le scadenze importanti.',
};

export default async function PricingPage({
    searchParams,
}: {
    searchParams?: Promise<{ billing?: string }>;
}) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const resolvedSearchParams = await searchParams;
    const hasMonthly = Boolean(getProCheckoutLink('monthly') || process.env.STRIPE_PRO_PRICE_ID_MONTHLY);
    const hasYearly = Boolean(getProCheckoutLink('yearly') || process.env.STRIPE_PRO_PRICE_ID_YEARLY);

    const requestedBilling = resolvedSearchParams?.billing === 'monthly' ? 'monthly' : 'yearly';
    const initialBilling =
        requestedBilling === 'yearly'
            ? (hasYearly ? 'yearly' : 'monthly')
            : (hasMonthly ? 'monthly' : 'yearly');

    return (
        <PricingSection
            userId={user?.id}
            userEmail={user?.email ?? undefined}
            initialBilling={initialBilling}
            availableBillingCycles={{
                monthly: hasMonthly,
                yearly: hasYearly,
            }}
        />
    );
}
