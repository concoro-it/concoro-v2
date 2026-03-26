import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/SignupForm';
import { AuthSplitShell } from '@/components/auth/AuthSplitShell';

export const metadata: Metadata = {
    title: 'Registrati',
    robots: {
        index: false,
        follow: false,
    },
};

export default function SignupPage() {
    return (
        <AuthSplitShell heroTitle="Una dashboard pulita, notifiche mirate e meno rumore: finalmente seguiamo solo i concorsi rilevanti.">
            <SignupForm />
        </AuthSplitShell>
    );
}
