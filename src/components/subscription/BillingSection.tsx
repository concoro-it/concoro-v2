'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, CreditCard, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { getBillingDataAction } from '@/lib/stripe/actions';
import { PaymentMethodCard } from './PaymentMethodCard';
import { BillingAddressCard } from './BillingAddressCard';
import { InvoiceHistory } from './InvoiceHistory';

interface BillingSectionProps {
    tier: string;
    isPro: boolean;
    stripeCustomerId?: string | null;
}

export function BillingSection({ tier, isPro, stripeCustomerId }: BillingSectionProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [billingData, setBillingData] = useState<any>(null);

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

    const handleManageSubscription = async () => {
        setIsLoading(true);
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
        } catch (err: any) {
            console.error('Portal session error:', err);
            setError(err.message || 'An unexpected error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="relative group overflow-hidden bg-white/40 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:shadow-primary/10">
                {/* Background Gradient Orbs */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-colors duration-500" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`p-2 rounded-lg ${isPro ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                {isPro ? <Sparkles className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                {tier === 'admin' ? 'Piano Admin' : isPro ? 'Concoro Pro' : 'Piano Gratuito'}
                            </h2>
                        </div>
                        <p className="text-muted-foreground max-w-md">
                            {isPro
                                ? 'Il tuo abbonamento e attivo. Hai accesso al monitoraggio completo, agli alert e a Genio.'
                                : 'Passa a Pro per seguire i concorsi in modo continuativo, con meno rumore e piu segnali utili.'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[240px]">
                        {isPro && tier !== 'admin' ? (
                            <button
                                onClick={handleManageSubscription}
                                disabled={isLoading}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Gestisci Metodi di Pagamento
                                        <ExternalLink className="w-4 h-4 opacity-70 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                    </>
                                )}
                            </button>
                        ) : tier === 'admin' ? (
                            <div className="px-4 py-2 bg-secondary/10 border border-secondary/20 text-secondary-foreground text-sm font-medium rounded-lg text-center">
                                Accesso illimitato
                            </div>
                        ) : (
                            <a
                                href="/pricing"
                                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all"
                            >
                                Passa a Pro
                            </a>
                        )}

                        {isPro && tier !== 'admin' && (
                            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-medium">
                                Gestito in modo sicuro da Stripe
                            </p>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-lg animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}
            </div>

            {isPro && !isDataLoading && billingData && (
                <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <PaymentMethodCard paymentMethod={billingData.paymentMethod} />
                    <BillingAddressCard address={billingData.address} />
                    <div className="md:col-span-2">
                        <InvoiceHistory invoices={billingData.invoices} />
                    </div>
                </div>
            )}

            {isDataLoading && isPro && (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                </div>
            )}

            {!isPro && (
                <div className="grid sm:grid-cols-3 gap-4">
                    {[
                        'Accesso illimitato ai concorsi',
                        'Ricerche salvate e alert email mirati',
                        'Genio per orientarti piu in fretta'
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-white/50 border border-border rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                            <span className="text-sm font-medium">{feature}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
