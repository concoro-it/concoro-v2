import Link from 'next/link';
import { CheckCircle2, Crown, Lock, Sparkles } from 'lucide-react';
import { PLANS } from '@/lib/stripe/prices';

interface Props {
    lockedCount: number;
    isLoggedIn: boolean;
}

export function PaywallBanner({ lockedCount, isLoggedIn }: Props) {
    const monthly = PLANS.pro.price_monthly;
    const yearly = PLANS.pro.price_yearly;
    const yearlyMonthlyEquivalent = yearly / 12;
    const yearlySavings = Math.round((1 - yearlyMonthlyEquivalent / monthly) * 100);

    return (
        <div className="relative rounded-xl p-8 text-center z-20">
            <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Upgrade disponibile
            </div>

            <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {isLoggedIn ? <Crown className="w-6 h-6 text-primary" /> : <Lock className="w-6 h-6 text-primary" />}
                </div>
            </div>

            <h3 className="font-semibold text-xl mb-1 tracking-tight">
                {isLoggedIn
                    ? `Hai ancora ${lockedCount} concorsi bloccati`
                    : `Accedi per vedere altri ${lockedCount} concorsi`}
            </h3>

            <p className="text-sm text-muted-foreground mb-5 max-w-xl mx-auto">
                {isLoggedIn
                    ? 'Passa a Pro per monitorare bandi davvero rilevanti, ricevere alert mirati e decidere piu in fretta dove candidarti.'
                    : 'Crea il tuo account gratuito per iniziare a orientarti, poi attiva Pro quando vuoi seguire i bandi senza limiti.'}
            </p>

            {isLoggedIn && (
                <div className="mb-5 mx-auto grid max-w-xl gap-2 text-left">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Accesso completo ai bandi senza fermarti ai primi risultati
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Alert email mirati sui nuovi concorsi utili per te
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        L&apos;annuale ti fa risparmiare circa {yearlySavings}% rispetto al mensile
                    </div>
                </div>
            )}

            {isLoggedIn ? (
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Link
                        href="/pricing?billing=yearly&source=results-paywall"
                        className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Sblocca Pro da €{yearlyMonthlyEquivalent.toFixed(2).replace('.', ',')}/mese
                    </Link>
                    <Link
                        href="/pricing?billing=monthly&source=results-paywall"
                        className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
                    >
                        Vedi piano mensile (€{monthly.toFixed(2).replace('.', ',')})
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Link
                        href="/signup"
                        className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Registrati gratis
                    </Link>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
                    >
                        Accedi
                    </Link>
                </div>
            )}

            {isLoggedIn && (
                <p className="mt-4 text-xs text-muted-foreground">
                    Pagamento sicuro con Stripe. Disdici quando vuoi.
                </p>
            )}
        </div>
    );
}

export function BlurredResultsSection({ concorsi, lockedCount, isLoggedIn }: {
    concorsi: any[]; // Using any to avoid complex circular dependencies for now, or import properly
    lockedCount: number;
    isLoggedIn: boolean;
}) {
    const { ConcorsoList } = require('@/components/concorsi/ConcorsoList');

    return (
        <div className="relative mt-8 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-8 overflow-hidden">
            <PaywallBanner lockedCount={lockedCount} isLoggedIn={isLoggedIn} />

            <div className="pointer-events-none select-none blur-sm opacity-60 -mx-4 sm:-mx-8 -mb-4 sm:-mb-8">
                <div className="p-4 sm:p-8 pt-0">
                    <ConcorsoList concorsi={concorsi.slice(0, 3)} />
                </div>
            </div>
        </div>
    );
}
