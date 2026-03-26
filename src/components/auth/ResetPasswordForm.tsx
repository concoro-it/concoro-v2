'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'request' | 'update';

export function ResetPasswordForm() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();

    const [mode, setMode] = useState<Mode>('request');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
            setMode('update');
        }

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setMode('update');
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    async function handleRequestReset(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        const redirectTo = `${window.location.origin}/reset-password`;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

        if (resetError) {
            setError('Non siamo riusciti a inviare l’email di reset. Riprova.');
        } else {
            setSuccessMessage('Ti abbiamo inviato un link per reimpostare la password. Controlla la tua casella email.');
        }

        setLoading(false);
    }

    async function handleUpdatePassword(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (password.length < 8) {
            setError('La nuova password deve avere almeno 8 caratteri.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Le password non coincidono.');
            setLoading(false);
            return;
        }

        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
            setError('Impossibile aggiornare la password. Apri di nuovo il link ricevuto via email.');
            setLoading(false);
            return;
        }

        await supabase.auth.signOut();
        setSuccessMessage('Password aggiornata con successo. Ora puoi accedere con la nuova password.');
        setLoading(false);

        setTimeout(() => {
            router.push('/login');
            router.refresh();
        }, 1000);
    }

    if (mode === 'update') {
        return (
            <div className="w-full max-w-sm mx-auto space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Imposta una nuova password</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Scegli una password sicura per il tuo account Concoro.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                    {successMessage && (
                        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    <div>
                        <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium">Nuova password</label>
                        <input
                            id="new-password"
                            type="password"
                            minLength={8}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Minimo 8 caratteri"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium">Conferma password</label>
                        <input
                            id="confirm-password"
                            type="password"
                            minLength={8}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Ripeti la password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Aggiornamento...
                            </span>
                        ) : (
                            'Aggiorna password'
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    Ricordi la password?{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">Torna al login</Link>
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
                <p className="mt-1 text-sm text-muted-foreground">Inserisci la tua email e ti invieremo un link per reimpostarla.</p>
            </div>

            <form onSubmit={handleRequestReset} className="space-y-4">
                {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                {successMessage && (
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                )}

                <div>
                    <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium">Email</label>
                    <input
                        id="reset-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="nome@esempio.it"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                    {loading ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Invio in corso...
                        </span>
                    ) : (
                        'Invia link di reset'
                    )}
                </button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                Torna al{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">login</Link>
            </p>
        </div>
    );
}
