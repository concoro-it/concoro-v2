import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { BillingSection } from '@/components/subscription/BillingSection';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Gestione Abbonamento | Concoro' };

export default async function AbbonamentoPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const [tier, { data: profile }] = await Promise.all([
        getUserTier(supabase),
        supabase.from('profiles').select('*').eq('id', user.id).single()
    ]);

    const isPro = tier === 'pro' || tier === 'admin';

    return (
        <div className="min-h-[80vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto w-full space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                        Il tuo Abbonamento
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Gestisci il tuo piano, aggiorna i metodi di pagamento e visualizza la tua cronologia di fatturazione in un unico posto sicuro.
                    </p>
                </div>

                <BillingSection
                    tier={tier}
                    isPro={isPro}
                    stripeCustomerId={profile?.stripe_customer_id}
                />

                <div className="flex flex-col items-center gap-8 mt-12 pt-12 border-t border-border/50">
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-orange-700 text-sm max-w-xl">
                        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-orange-500" />
                        <p>
                            La tua sicurezza è la nostra priorità. Tutti i pagamenti sono elaborati in modo sicuro tramite <span className="font-bold">Stripe</span>. Non memorizziamo mai i dettagli della tua carta sui nostri server.
                        </p>
                    </div>

                    <Link
                        href="/dashboard"
                        className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        Torna alla Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
