'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    CircleHelp,
    ExternalLink,
    FileText,
    Loader2,
    Sparkles,
} from 'lucide-react';
import { getBillingDataAction } from '@/lib/stripe/actions';

interface BillingSectionProps {
    tier: string;
    isPro: boolean;
    stripeCustomerId?: string | null;
}

interface BillingInvoice {
    id: string;
    amount_paid: number;
    currency: string;
    status: string;
    created: number;
    pdf_url: string | null;
}

interface BillingData {
    invoices: BillingInvoice[];
}

function formatMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100);
}

export function BillingSection({ tier, isPro, stripeCustomerId }: BillingSectionProps) {
    const [isPortalLoading, setIsPortalLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [billingData, setBillingData] = useState<BillingData>({ invoices: [] });

    useEffect(() => {
        async function fetchBillingData() {
            if (!stripeCustomerId) {
                setIsDataLoading(false);
                return;
            }

            try {
                const data = await getBillingDataAction();
                setBillingData(data);
            } catch (err) {
                console.error('Error fetching billing data:', err);
            } finally {
                setIsDataLoading(false);
            }
        }

        fetchBillingData();
    }, [stripeCustomerId]);

    const handleOpenPortal = async () => {
        setIsPortalLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/stripe/create-portal-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create portal session');
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (err: unknown) {
            console.error('Portal session error:', err);
            const message = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
            setError(message);
            setIsPortalLoading(false);
        }
    };

    const invoices = billingData.invoices;
    const planName = useMemo(() => {
        if (tier === 'admin') return 'Concoro Admin';
        return isPro ? 'Concoro Pro' : 'Piano Gratuito';
    }, [isPro, tier]);

    return (
        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <section className="dashboard-section-frame overflow-hidden p-5 sm:p-6 lg:p-7">
                <div className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                Overview piano
                            </p>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                                        isPro ? 'bg-[#0A4E88]/10 text-[#0A4E88]' : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    <Sparkles className="h-4.5 w-4.5" />
                                </div>
                                <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-2xl tracking-tight text-slate-900 sm:text-[1.95rem]">
                                    {planName}
                                </h2>
                            </div>
                            <p className="text-sm text-slate-600">
                                Dati sensibili e metodi di pagamento sono gestiti esclusivamente da Stripe.
                            </p>
                        </div>

                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                            Storico fatture sincronizzato
                        </span>
                    </div>

                    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.85)]">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Azioni rapide
                        </p>
                        <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                            Gestisci su Stripe
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                            Abbonamento, carta e pagamenti sono gestiti interamente nel portale Stripe.
                        </p>

                        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                            <button
                                onClick={handleOpenPortal}
                                disabled={isPortalLoading}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#0A4E88] bg-[#0A4E88] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#083861] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isPortalLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Apri portale Stripe
                                        <ExternalLink className="h-4 w-4" />
                                    </>
                                )}
                            </button>

                            {isPro ? (
                                <button
                                    onClick={handleOpenPortal}
                                    disabled={isPortalLoading}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <AlertTriangle className="h-4 w-4" />
                                    Annulla abbonamento
                                </button>
                            ) : null}
                        </div>

                        {error ? (
                            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                                {error}
                            </p>
                        ) : null}
                    </article>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_32px_-24px_rgba(15,23,42,0.65)]">
                        <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3.5 sm:px-5">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.11em] text-slate-600">
                                Cronologia fatture
                            </h3>
                        </div>

                        {isDataLoading ? (
                            <div className="flex justify-center p-10">
                                <Loader2 className="h-6 w-6 animate-spin text-[#0A4E88]" />
                            </div>
                        ) : invoices.length > 0 ? (
                            <div className="divide-y divide-slate-200">
                                {invoices.map((invoice) => {
                                    const status = invoice.status ?? 'sconosciuto';
                                    const statusClass =
                                        status === 'paid'
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : status === 'open'
                                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                                              : 'border-slate-200 bg-slate-50 text-slate-700';

                                    return (
                                        <div
                                            key={invoice.id}
                                            className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <FileText className="mt-0.5 h-4.5 w-4.5 text-slate-500" />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {formatMoney(invoice.amount_paid, invoice.currency)}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(invoice.created * 1000).toLocaleDateString('it-IT', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2.5">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] ${statusClass}`}
                                                >
                                                    {status}
                                                </span>
                                                {invoice.pdf_url ? (
                                                    <a
                                                        href={invoice.pdf_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                                    >
                                                        PDF
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-sm text-slate-600">
                                Stripe non ha ancora registrato una cronologia fatture.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <aside className="space-y-4">
                <article className="rounded-[1.45rem] border border-[#0A4E88]/20 bg-[linear-gradient(155deg,#f6fbff_0%,#e6f1ff_100%)] p-5 shadow-[0_18px_38px_-30px_rgba(10,78,136,0.45)] sm:p-6">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#0A4E88]">
                        Cosa include il Pro
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {[
                            'Monitoraggio continuo dei concorsi in target',
                            'Ricerche salvate e alert email intelligenti',
                            'Supporto operativo con Genio in hub',
                        ].map((feature) => (
                            <li key={feature} className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </article>

                <article className="rounded-[1.45rem] border border-slate-200 bg-white/88 p-5 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.45)] sm:p-6">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Hai bisogno di aiuto?
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        Se hai dubbi su fatture o pagamenti, il team supporto ti aiuta rapidamente.
                    </p>
                    <a
                        href="/hub/assistenza"
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
                    >
                        <CircleHelp className="h-4 w-4" />
                        Contatta assistenza
                    </a>
                </article>
            </aside>
        </div>
    );
}
