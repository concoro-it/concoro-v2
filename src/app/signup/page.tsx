import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/SignupForm';
import { AuthSplitShell } from '@/components/auth/AuthSplitShell';
import { sanitizeInternalRedirectPath } from '@/lib/auth/redirect';

export const metadata: Metadata = {
    title: 'Registrati',
    robots: {
        index: false,
        follow: false,
    },
};

interface SignupPageProps {
    searchParams?: Promise<{
        redirectTo?: string;
        source?: string;
        intent?: string;
    }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
    const resolvedSearchParams = await searchParams;
    const redirectTo = sanitizeInternalRedirectPath(resolvedSearchParams?.redirectTo);
    const source = resolvedSearchParams?.source ?? null;
    const intent = resolvedSearchParams?.intent ?? null;

    return (
        <AuthSplitShell heroTitle="Una dashboard pulita, notifiche mirate e meno rumore: finalmente seguiamo solo i concorsi rilevanti.">
            <SignupForm redirectTo={redirectTo} source={source} intent={intent} />
        </AuthSplitShell>
    );
}
