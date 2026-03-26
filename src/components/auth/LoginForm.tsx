'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { getClientOAuthRedirectUrl } from '@/lib/auth/url';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [acceptedPolicy, setAcceptedPolicy] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError('Email o password non corretti. Riprova.');
        } else {
            router.push('/hub/bacheca');
            router.refresh();
        }
        setLoading(false);
    }

    async function handleGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: getClientOAuthRedirectUrl() },
        });
        if (error) setError('Errore con Google OAuth. Riprova.');
    }

    return (
        <div className="w-full max-w-sm mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">Bentornato</h1>
                <p className="text-sm text-muted-foreground mt-1">Accedi al tuo account Concoro</p>
            </div>

            <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continua con Google
            </button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs text-muted-foreground">
                    <span className="bg-background px-2">oppure</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                        {error}
                    </div>
                )}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
                    <input
                        id="email" type="email" required autoComplete="email"
                        value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                        placeholder="nome@esempio.it"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
                    <div className="relative">
                        <input
                            id="password" type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                            value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white pr-10"
                            placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPw(!showPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="text-right mt-1">
                        <Link href="/reset-password" className="text-xs text-muted-foreground hover:text-foreground">
                            Password dimenticata?
                        </Link>
                    </div>
                </div>
                <button
                    type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Accesso in corso...' : 'Accedi'}
                </button>

                <label
                    htmlFor="login-policy"
                    className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs leading-relaxed text-slate-600"
                >
                    <input
                        id="login-policy"
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
                Non hai un account?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">Registrati</Link>
            </p>
        </div>
    );
}
