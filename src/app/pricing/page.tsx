import type { Metadata } from 'next';
import { PricingSection } from './components/pricing-section';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
    title: 'Prezzi — Concoro Pro',
    description: 'Scopri il piano Concoro Pro. Accesso illimitato ai concorsi, ricerche salvate, e AI Assistant.',
};

export default async function PricingPage() {
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

    return <PricingSection userId={user?.id} />;
}
