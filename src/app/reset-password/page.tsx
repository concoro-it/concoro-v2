import type { Metadata } from 'next';
import { AuthSplitShell } from '@/components/auth/AuthSplitShell';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
    title: 'Reset password',
    robots: {
        index: false,
        follow: false,
    },
};

export default function ResetPasswordPage() {
    return (
        <AuthSplitShell heroTitle="Aggiorna in sicurezza le credenziali e torna a monitorare i concorsi senza interruzioni.">
            <ResetPasswordForm />
        </AuthSplitShell>
    );
}
