import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import type { Profile } from '@/types/profile';
import { sanitizeInternalRedirectPath } from '@/lib/auth/redirect';
import { PricingHeader } from '@/app/pricing/components/pricing-header';

export const metadata: Metadata = {
    title: 'Configura il tuo profilo',
    robots: {
        index: false,
        follow: false,
    },
};

export default async function OnboardingPage({
    searchParams,
}: {
    searchParams?: Promise<{ redirectTo?: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    const redirectTo = sanitizeInternalRedirectPath(resolvedSearchParams?.redirectTo, '/hub/bacheca');
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?redirectTo=/onboarding');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select(
            [
                'regione_interesse',
                'provincia_interesse',
                'preferred_regioni',
                'sede_preferita',
                'remote_preferito',
                'settori_interesse',
                'preferred_settori',
                'preferred_job_families',
                'profilo_professionale',
                'current_sector',
                'contract_type',
                'titolo_studio',
                'anni_esperienza',
                'education_history',
                'experience_history',
                'obiettivo_concorso',
                'disponibilita_mobilita',
                'exclude_mobility',
                'tempo_studio_settimanale',
                'disponibilita_trasferimento',
                'livello_preparazione',
                'public_admin_experience',
                'skills',
                'languages',
                'driving_licenses',
                'notification_email',
                'onboarding_completed',
                'avatar_url',
                'full_name',
            ].join(',')
        )
        .eq('id', user.id)
        .maybeSingle<Partial<Profile>>();

    return (
        <>
            <PricingHeader
                user={{
                    email: user.email,
                    fullName: profile?.full_name ?? null,
                    avatarUrl: profile?.avatar_url ?? null,
                }}
                checkoutRedirectPath="/pricing?checkout=pro"
                showLinks={false}
            />
            <OnboardingFlow profile={profile ?? null} redirectTo={redirectTo} />
        </>
    );
}
