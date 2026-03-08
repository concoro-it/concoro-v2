import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { BillingSection } from '@/components/subscription/BillingSection';

export const metadata: Metadata = { title: 'Billing | Dashboard' };

export default async function DashboardBillingPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const [tier, { data: profile }] = await Promise.all([
        getUserTier(supabase),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
    ]);

    const isPro = tier === 'pro' || tier === 'admin';

    return (
        <div className="max-w-4xl mx-auto w-full space-y-10 py-4 sm:py-8">
            <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Il tuo Abbonamento</h1>
                <p className="text-muted-foreground">
                    Gestisci il tuo piano, aggiorna i metodi di pagamento e consulta la cronologia di fatturazione.
                </p>
            </div>

            <BillingSection
                tier={tier}
                isPro={isPro}
                stripeCustomerId={profile?.stripe_customer_id}
            />

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-orange-700 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-orange-500" />
                <p>
                    Tutti i pagamenti sono elaborati in modo sicuro tramite <span className="font-bold">Stripe</span>. I dettagli carta non vengono memorizzati sui server Concoro.
                </p>
            </div>
        </div>
    );
}
