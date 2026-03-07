import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = { title: 'Registrati' };

export default function SignupPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface">
            <SignupForm />
        </div>
    );
}
