import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ShieldAlert, Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { BillingSection } from '@/components/subscription/BillingSection';
import { getUserContext } from '@/lib/auth/getUserContext';

export const metadata: Metadata = { title: 'Fatturazione | Hub' };

export default async function DashboardBillingPage() {
    const supabase = await createClient();
    const { user, profile, tier } = await getUserContext<{
        stripe_customer_id?: string | null;
    }>(supabase, { profileSelect: 'tier, stripe_customer_id' });

    if (!user) {
        redirect('/login');
    }

    const isPro = tier === 'pro' || tier === 'admin';

    return (
        <div className="dashboard-shell">
            <div className="dashboard-shell-overlay" />

            <div className="relative container mx-auto max-w-[78rem] space-y-6 px-4 py-8 sm:px-6 sm:py-10">
                <section className="grid gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/82 p-5 backdrop-blur-sm sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:p-7">
                    <div className="space-y-4">
                        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Link href="/hub/bacheca" className="hover:text-slate-900">
                                Bacheca
                            </Link>
                            <ChevronRight className="h-4 w-4" />
                            <span className="text-slate-900">Fatturazione</span>
                        </nav>

                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-slate-50/90 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-slate-700">
                            <Wallet className="h-3.5 w-3.5" />
                            Centro di fatturazione
                        </span>

                        <div className="space-y-2">
                            <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.85rem]">
                                Fatture sempre
                                <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                    sincronizzate
                                </span>
                                con Stripe.
                            </h1>
                            <p className="max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
                                In questa pagina mostriamo soltanto la cronologia fatture inviata da Stripe.
                                Ogni modifica di abbonamento e pagamento rimane gestita direttamente nel portale Stripe.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                        <div className="flex items-start gap-3 text-sm text-slate-700">
                            <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#0A4E88]" />
                            <p>
                                Tutti i pagamenti sono elaborati in modo sicuro tramite{' '}
                                <span className="font-semibold text-slate-900">Stripe</span>. I dati carta non
                                vengono memorizzati sui server Concoro.
                            </p>
                        </div>
                    </div>
                </section>

                <BillingSection tier={tier} isPro={isPro} stripeCustomerId={profile?.stripe_customer_id} />
            </div>
        </div>
    );
}
