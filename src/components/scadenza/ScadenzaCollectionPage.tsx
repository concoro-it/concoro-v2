import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import { BlurredResultsSection } from '@/components/paywall/PaywallBanner';
import { SCADENZA_BUCKETS, ScadenzaKey, getScadenzaBucket } from '@/components/scadenza/config';
import type { Concorso } from '@/types/concorso';
import type { UserTier } from '@/types/profile';

interface ScadenzaCollectionPageProps {
    bucketKey: ScadenzaKey;
    count: number;
    visible: Concorso[];
    locked: Concorso[];
    isLocked: boolean;
    showPaywall: boolean;
    tier: UserTier;
}

export function ScadenzaCollectionPage({
    bucketKey,
    count,
    visible,
    locked,
    isLocked,
    showPaywall,
    tier,
}: ScadenzaCollectionPageProps) {
    const current = getScadenzaBucket(bucketKey);
    const Icon = current.icon;

    return (
        <div className="relative overflow-hidden bg-[hsl(210,55%,98%)] text-slate-900 [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 14% 6%, rgba(14,78,136,0.13), transparent 34%), radial-gradient(circle at 83% 11%, rgba(220,38,38,0.09), transparent 30%), repeating-linear-gradient(90deg, rgba(10,53,91,0.04) 0 1px, transparent 1px 90px)',
                }}
            />

            <div className="relative border-b border-slate-200 bg-white/85">
                <div className="container mx-auto max-w-[78rem] px-4 py-3 text-sm text-slate-500">
                    <nav className="flex flex-wrap items-center gap-2">
                        <Link href="/" className="hover:text-slate-900">Home</Link>
                        <ChevronRight className="h-4 w-4" />
                        <Link href="/scadenza" className="hover:text-slate-900">Scadenze</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-slate-900">{current.shortLabel}</span>
                    </nav>
                </div>
            </div>

            <header className="relative px-4 pb-10 pt-10 md:pb-14">
                <div className="container mx-auto grid max-w-[78rem] gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-5">
                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] ${current.accentClass}`}>
                            <Icon className="h-4 w-4" />
                            {current.eyebrow}
                        </div>

                        <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-slate-900 md:text-6xl">
                            {current.label}
                        </h1>

                        <p className="max-w-3xl text-base leading-relaxed text-slate-700 md:text-lg">
                            {current.description}
                        </p>

                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-4 py-2 text-sm text-slate-700 shadow-[0_16px_35px_-28px_rgba(15,23,42,0.6)]">
                            <span className="font-semibold text-slate-900">{count}</span>
                            risultati trovati
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-[0_22px_50px_-35px_rgba(15,23,42,0.55)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Navigazione rapida
                        </p>
                        <div className="mt-4 grid gap-3">
                            {SCADENZA_BUCKETS.map((bucket) => {
                                const BucketIcon = bucket.icon;
                                const active = bucket.key === bucketKey;
                                return (
                                    <Link
                                        key={bucket.key}
                                        href={bucket.href}
                                        className={`group flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
                                            active
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <BucketIcon className={`mt-0.5 h-4 w-4 ${active ? 'text-white' : 'text-slate-500'}`} />
                                            <div>
                                                <p className="text-sm font-semibold leading-tight">{bucket.label}</p>
                                            </div>
                                        </div>
                                        <ArrowRight className={`h-4 w-4 transition group-hover:translate-x-0.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative px-4 pb-14">
                <div className="container mx-auto max-w-[78rem] space-y-6">
                    {count > 0 && <ConcorsoList concorsi={visible} />}

                    {showPaywall && (
                        <BlurredResultsSection
                            concorsi={tier === 'anon' ? [] : locked}
                            lockedCount={locked.length}
                            isLoggedIn={tier !== 'anon'}
                            useMockResults={tier === 'anon'}
                        />
                    )}

                    {!isLocked && locked.length > 0 && (
                        <ConcorsoList concorsi={locked} />
                    )}

                    {count === 0 && (
                        <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-[0_25px_55px_-42px_rgba(15,23,42,0.65)]">
                            <h2 className="text-2xl font-semibold text-slate-900">Nessun risultato in questa finestra</h2>
                            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                                Non ci sono concorsi disponibili per questo intervallo temporale. Puoi ampliare il monitoraggio
                                passando alla vista settimanale o mensile.
                            </p>
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                <Link
                                    href="/scadenza/questa-settimana"
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
                                >
                                    Vai alla settimana
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/concorsi"
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Esplora archivio completo
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
