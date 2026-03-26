import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthSplitShell } from '@/components/auth/AuthSplitShell';

export const metadata: Metadata = {
    title: 'Accedi',
    robots: {
        index: false,
        follow: false,
    },
};

export default function LoginPage() {
    return (
        <AuthSplitShell heroTitle="Concoro ci ha aiutato a ridurre il tempo di ricerca e candidarci prima sui bandi giusti.">
            <LoginForm />
        </AuthSplitShell>
    );
}
