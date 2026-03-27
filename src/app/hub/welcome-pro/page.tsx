import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowRight, BadgeCheck, BellRing, BrainCircuit, CheckCircle2, Crown, Search, Sparkles } from 'lucide-react';
import { ProPurchaseTracker } from '@/components/analytics/ProPurchaseTracker';

export const metadata: Metadata = {
    title: 'Benvenuto in Pro | Hub',
    description: 'Il tuo abbonamento Pro e attivo: inizia ora con monitoraggio, ricerche salvate e Genio.',
};

type BillingCycle = 'monthly' | 'yearly';

function normalizeBillingCycle(value?: string): BillingCycle | undefined {
    if (value === 'monthly' || value === 'yearly') return value;
    return undefined;
}

export default async function WelcomeProPage({
    searchParams,
}: {
    searchParams: Promise<{ session_id?: string; billing_cycle?: string; success?: string }>;
}) {
    const { session_id: sessionId, billing_cycle: billingCycleRaw } = await searchParams;

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?redirectTo=/hub/welcome-pro');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

    const firstName = profile?.full_name?.split(' ')[0] ?? 'Pro member';
    const billingCycle = normalizeBillingCycle(billingCycleRaw);

    return (
        <>
            <ProPurchaseTracker sessionId={sessionId} billingCycle={billingCycle} />

            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[hsl(210,55%,98%)] text-slate-900 shadow-[0_32px_70px_-46px_rgba(15,23,42,0.65)] [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 5% 8%, rgba(15,76,129,0.17), transparent 36%), radial-gradient(circle at 94% 12%, rgba(245,158,11,0.14), transparent 33%), repeating-linear-gradient(90deg, rgba(12,56,97,0.035) 0 1px, transparent 1px 84px)',
                    }}
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-white/65 to-transparent" />

                <div className="relative space-y-7 px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
                    <section className="grid gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/82 p-5 backdrop-blur-sm sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6 lg:p-7">
                        <div className="space-y-4">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-emerald-50/90 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-emerald-800">
                                <BadgeCheck className="h-3.5 w-3.5" />
                                Pagamento confermato
                            </span>

                            <div className="space-y-2">
                                <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.85rem]">
                                    Benvenuto in
                                    <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                        Concoro Pro
                                    </span>
                                    {firstName}.
                                </h1>
                                <p className="max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
                                    Il tuo account e ora attivo in Pro. Da questo momento puoi monitorare concorsi con meno rumore, piu precisione e piu velocita.
                                </p>
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 shadow-[0_18px_38px_-30px_rgba(120,53,15,0.5)] sm:p-5">
                            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-300/25 blur-2xl" />
                            <div className="relative space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-amber-700/90">Piano attivo</p>
                                        <p className="mt-1 text-lg font-semibold text-slate-900">Concoro Pro</p>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-amber-200/70 px-2.5 py-1 text-xs font-semibold text-amber-900">
                                        <Crown className="mr-1.5 h-3.5 w-3.5" />
                                        Pro
                                    </span>
                                </div>

                                <div className="rounded-xl border border-amber-200/80 bg-white/75 p-3 text-sm text-slate-700">
                                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-amber-800">Dettaglio acquisto</p>
                                    <p className="mt-2">Fatturazione: <span className="font-semibold">{billingCycle === 'yearly' ? 'Annuale' : billingCycle === 'monthly' ? 'Mensile' : 'Pro'}</span></p>
                                    {sessionId ? <p className="mt-1 truncate">Sessione: <span className="font-medium">{sessionId}</span></p> : null}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <article className="rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm">
                            <span className="inline-flex rounded-xl bg-emerald-600/10 p-2 text-emerald-700"><BellRing className="h-4 w-4" /></span>
                            <h2 className="mt-3 text-lg font-semibold text-slate-900">Avvisi mirati</h2>
                            <p className="mt-1 text-sm text-slate-600">Attiva ricerche monitorate per ricevere solo bandi utili ai tuoi obiettivi.</p>
                        </article>
                        <article className="rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm">
                            <span className="inline-flex rounded-xl bg-[#0E2F50]/10 p-2 text-[#0E2F50]"><Search className="h-4 w-4" /></span>
                            <h2 className="mt-3 text-lg font-semibold text-slate-900">Ricerche avanzate</h2>
                            <p className="mt-1 text-sm text-slate-600">Salva preset avanzati e riparti in un click senza rifare filtri ogni giorno.</p>
                        </article>
                        <article className="rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm sm:col-span-2 lg:col-span-1">
                            <span className="inline-flex rounded-xl bg-amber-500/15 p-2 text-amber-700"><BrainCircuit className="h-4 w-4" /></span>
                            <h2 className="mt-3 text-lg font-semibold text-slate-900">Genio incluso</h2>
                            <p className="mt-1 text-sm text-slate-600">Usa Genio per interpretare requisiti e scegliere su quali concorsi puntare prima.</p>
                        </article>
                    </section>

                    <section className="rounded-[1.55rem] border border-slate-200/85 bg-white/88 p-5 shadow-[0_24px_42px_-34px_rgba(2,6,23,0.45)] sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Prossimi step consigliati</h2>
                                <p className="mt-1 text-sm text-slate-600">Completa questi passaggi e il tuo setup Pro e operativo in pochi minuti.</p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-slate-600">
                                <Sparkles className="h-3.5 w-3.5" />
                                avvio
                            </span>
                        </div>

                        <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                            <li className="flex items-start gap-2 rounded-xl border border-slate-200/85 bg-slate-50/70 px-3 py-2.5">
                                <span className="mt-0.5 inline-flex rounded-full bg-emerald-100 p-0.5 text-emerald-700"><CheckCircle2 className="h-3 w-3" /></span>
                                Apri <strong className="mx-1">Salvati</strong> e crea il primo preset con ente, settore e area geografica.
                            </li>
                            <li className="flex items-start gap-2 rounded-xl border border-slate-200/85 bg-slate-50/70 px-3 py-2.5">
                                <span className="mt-0.5 inline-flex rounded-full bg-emerald-100 p-0.5 text-emerald-700"><CheckCircle2 className="h-3 w-3" /></span>
                                Vai su <strong className="mx-1">Concorsi</strong> e salva i bandi prioritari da monitorare.
                            </li>
                            <li className="flex items-start gap-2 rounded-xl border border-slate-200/85 bg-slate-50/70 px-3 py-2.5">
                                <span className="mt-0.5 inline-flex rounded-full bg-emerald-100 p-0.5 text-emerald-700"><CheckCircle2 className="h-3 w-3" /></span>
                                Testa <strong className="mx-1">Genio</strong> per valutare in pochi secondi l&apos;idoneità e le prossime azioni.
                            </li>
                        </ul>

                        <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                            <Link
                                href="/hub/salvati?tab=ricerche"
                                className="group inline-flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                            >
                                Crea preset
                                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                            </Link>
                            <Link
                                href="/hub/concorsi"
                                className="group inline-flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                            >
                                Esplora concorsi
                                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                            </Link>
                            <Link
                                href="/hub/genio"
                                className="group inline-flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Apri Genio
                                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
