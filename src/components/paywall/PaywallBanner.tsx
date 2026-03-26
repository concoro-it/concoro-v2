import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, CalendarClock, CheckCircle2, Crown, Flame, Lock, MapPin, Sparkles, Zap } from 'lucide-react';
import { PLANS } from '@/lib/stripe/prices';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import type { Concorso } from '@/types/concorso';

interface Props {
    lockedCount: number;
    isLoggedIn: boolean;
}

export function PaywallBanner({ lockedCount, isLoggedIn }: Props) {
    const monthly = PLANS.pro.price_monthly;
    const yearly = PLANS.pro.price_yearly;
    const yearlyMonthlyEquivalent = yearly / 12;
    const yearlySavings = Math.round((1 - yearlyMonthlyEquivalent / monthly) * 100);
    const headline = isLoggedIn
        ? `Ti stai perdendo ${lockedCount} concorsi oltre il piano gratuito`
        : `Hai raggiunto il limite gratuito: altri ${lockedCount} concorsi ti aspettano`;
    const description = isLoggedIn
        ? 'Con Pro vedi subito la lista completa, salvi ricerche senza limiti e ricevi alert mirati solo sui bandi davvero rilevanti per te.'
        : 'Crea un account gratuito in 30 secondi per salvare i bandi e monitorare le scadenze. Quando vuoi, attiva Pro e sblocca tutta la lista.';

    return (
        <div className="relative z-20 flex min-h-[208px] flex-col justify-center overflow-hidden rounded-2xl border border-primary/20 bg-white/90 p-4 text-left shadow-[0_24px_70px_-40px_rgba(10,78,136,0.55)] backdrop-blur-sm sm:min-h-[220px] sm:p-5">
            <div className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full bg-gradient-to-br from-cyan-200/70 via-primary/20 to-transparent blur-2xl" />
            <div className="pointer-events-none absolute -bottom-14 -left-8 h-44 w-44 rounded-full bg-gradient-to-tr from-primary/20 via-sky-200/50 to-transparent blur-2xl" />

            <div className="relative flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    Accesso Pro
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200/70">
                    <Flame className="h-3.5 w-3.5" />
                    {lockedCount} bandi oltre il limite
                </div>
            </div>

            <div className="relative mt-3 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#0C66AF] text-primary-foreground shadow-lg shadow-primary/35 ring-2 ring-white">
                    {isLoggedIn ? <Crown className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <div>
                    <h3 className="max-w-2xl text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{headline}</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 p-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Accesso illimitato ai bandi
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Ricerche salvate illimitate
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Alert email sui bandi in linea
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Annuale: risparmi circa {yearlySavings}%
                </div>
            </div>

            {isLoggedIn ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Link
                        href="/pricing?billing=yearly&source=results-paywall"
                        className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/35 transition-all hover:-translate-y-0.5 hover:bg-primary/95"
                    >
                        Attiva Pro da €{yearlyMonthlyEquivalent.toFixed(2).replace('.', ',')}/mese
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                        href="/pricing?billing=monthly&source=results-paywall"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Confronta i piani
                    </Link>
                </div>
            ) : (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Link
                        href="/signup"
                        className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/35 transition-all hover:-translate-y-0.5 hover:bg-primary/95"
                    >
                        Crea account gratuito
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Accedi
                    </Link>
                </div>
            )}

            {isLoggedIn && (
                <p className="mt-2 text-xs text-slate-500">
                    Pagamento sicuro con Stripe. Nessun vincolo: puoi disdire quando vuoi.
                </p>
            )}
        </div>
    );
}

export function BlurredResultsSection({ concorsi, lockedCount, isLoggedIn, useMockResults }: {
    concorsi: Concorso[];
    lockedCount: number;
    isLoggedIn: boolean;
    useMockResults?: boolean;
}) {
    const mockResults = [
        {
            title: 'Istruttore Amministrativo - Categoria C',
            ente: 'Comune capoluogo',
            location: 'Lazio',
            deadline: 'Scade tra 4 giorni',
        },
        {
            title: 'Funzionario Tecnico - Area Ingegneria',
            ente: 'Azienda sanitaria locale',
            location: 'Lombardia',
            deadline: 'Scade tra 6 giorni',
        },
    ];
    const shouldUseMockResults = Boolean(useMockResults) || concorsi.length === 0;

    return (
        <div className="relative mt-8 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-sky-50 via-white to-primary/10 p-4 sm:p-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/90 via-white/45 to-transparent" />
            <PaywallBanner lockedCount={lockedCount} isLoggedIn={isLoggedIn} />

            <div className="pointer-events-none relative mt-4 select-none opacity-60 blur-[2.4px]">
                <div className="absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-white to-transparent" />
                {shouldUseMockResults ? (
                    <div className="grid gap-3 px-1 pb-1 sm:px-2">
                        {mockResults.map((item) => (
                            <div
                                key={item.title}
                                className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_20px_44px_-36px_rgba(15,23,42,0.45)]"
                            >
                                <div className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                                    <Sparkles className="h-3 w-3" />
                                    Pro
                                </div>
                                <h4 className="mt-2 text-sm font-semibold text-slate-900 sm:text-base">{item.title}</h4>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                                        {item.ente}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {item.location}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                                        <CalendarClock className="h-3.5 w-3.5" />
                                        {item.deadline}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="-mx-4 -mb-4 p-4 pt-0 sm:-mx-7 sm:-mb-7 sm:p-7 sm:pt-1">
                        <ConcorsoList concorsi={concorsi.slice(0, 3)} />
                    </div>
                )}
            </div>
        </div>
    );
}
