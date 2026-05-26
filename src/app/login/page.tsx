import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthSplitShell } from '@/components/auth/AuthSplitShell';
import { sanitizeInternalRedirectPath } from '@/lib/auth/redirect';

export const metadata: Metadata = {
    title: 'Accedi',
    alternates: {
        canonical: '/login',
    },
    robots: {
        index: false,
        follow: false,
    },
};

interface LoginPageProps {
    searchParams?: Promise<{
        redirectTo?: string;
        source?: string;
        intent?: string;
    }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const resolvedSearchParams = await searchParams;
    const redirectTo = sanitizeInternalRedirectPath(resolvedSearchParams?.redirectTo);
    const source = resolvedSearchParams?.source ?? null;
    const intent = resolvedSearchParams?.intent ?? null;

    return (
        <AuthSplitShell heroTitle="Concoro ci aiuta a trovare prima i concorsi davvero adatti al nostro profilo.">
            <LoginForm redirectTo={redirectTo} source={source} intent={intent} />
        </AuthSplitShell>
    );
}
