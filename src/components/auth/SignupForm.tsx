'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { getClientOAuthRedirectUrl } from '@/lib/auth/url';
import { buildAuthQueryParams, sanitizeInternalRedirectPath } from '@/lib/auth/redirect';

interface SignupFormProps {
    redirectTo?: string;
    source?: string | null;
    intent?: string | null;
}

export function SignupForm({ redirectTo = '/hub/bacheca', source, intent }: SignupFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [acceptedPolicy, setAcceptedPolicy] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const supabase = createClient();
    const safeRedirectTo = sanitizeInternalRedirectPath(redirectTo);
    const loginHref = `/login?${buildAuthQueryParams({ redirectTo: safeRedirectTo, source, intent })}`;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
                emailRedirectTo: getClientOAuthRedirectUrl(safeRedirectTo),
            },
        });
        if (error) {
            setError(error.message === 'User already registered'
                ? 'Questo indirizzo email è già registrato.'
                : 'Si è verificato un errore. Riprova.');
        } else {
            setSuccess(true);
        }
        setLoading(false);
    }

    async function handleGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: getClientOAuthRedirectUrl(safeRedirectTo) },
        });
        if (error) setError('Errore con Google OAuth. Riprova.');
    }

    if (success) {
        return (
            <div className="w-full max-w-sm mx-auto text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold">Controlla la tua email</h2>
                <p className="text-sm text-muted-foreground">
                    Abbiamo inviato un link di conferma a <strong>{email}</strong>.
                    Clicca il link per attivare il tuo account.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">Crea il tuo account</h1>
                <p className="text-sm text-muted-foreground mt-1">Inizia a trovare concorsi pubblici</p>
            </div>

            <button onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continua con Google
            </button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs text-muted-foreground">
                    <span className="bg-background px-2">oppure</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
                )}
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium mb-1.5">Nome completo</label>
                    <input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                        placeholder="Mario Rossi" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
                    <input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                        placeholder="nome@esempio.it" />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
                    <div className="relative">
                        <input id="password" type={showPw ? 'text' : 'password'} required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white pr-10"
                            placeholder="Minimo 8 caratteri" />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Registrazione...' : 'Crea account'}
                </button>
                <label
                    htmlFor="signup-policy"
                    className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs leading-relaxed text-slate-600"
                >
                    <input
                        id="signup-policy"
                        type="checkbox"
                        required
                        checked={acceptedPolicy}
                        onChange={(e) => setAcceptedPolicy(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 accent-slate-900"
                    />
                    <span>
                        Confermo di aver letto e accettato{' '}
                        <Link href="/termini" className="font-medium text-slate-800 underline underline-offset-2 hover:text-slate-950">
                            Termini di Servizio
                        </Link>{' '}
                        e{' '}
                        <Link href="/privacy" className="font-medium text-slate-800 underline underline-offset-2 hover:text-slate-950">
                            Privacy Policy
                        </Link>
                        .
                    </span>
                </label>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                Hai già un account?{' '}
                <Link href={loginHref} className="font-medium text-primary hover:underline">Accedi</Link>
            </p>
        </div>
    );
}
