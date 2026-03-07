import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Accedi' };

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface">
            <LoginForm />
        </div>
    );
}
