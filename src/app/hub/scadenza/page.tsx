import type { Metadata } from 'next';
import Link from 'next/link';
import {
    AlarmClockCheck,
    ArrowRight,
    CalendarClock,
    CalendarRange,
    ChevronRight,
    Flame,
    Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
    getNuoviConcorsi,
    getSavedConcorsiIds,
    getScadenzaOggi,
    getScadenzaQuestaSettimana,
    getScadenzaQuestoMese,
} from '@/lib/supabase/queries';
import { formatDateShort } from '@/lib/utils/date';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';

export const metadata: Metadata = {
    title: 'Scadenze | Dashboard',
    description: 'Trova concorsi in scadenza oggi, questa settimana e questo mese dal dashboard.',
};

const DEADLINE_BUCKETS = [
    {
        key: 'oggi',
        label: 'In scadenza oggi',
        href: '/hub/scadenza/oggi',
        description: 'Priorita assoluta: chiudi prima le candidature urgenti.',
        accentClass: 'border-rose-200 bg-rose-50 text-rose-700',
        icon: AlarmClockCheck,
    },
    {
        key: 'questa-settimana',
        label: 'Questa settimana',
        href: '/hub/scadenza/questa-settimana',
        description: 'Sprint operativo sui prossimi 7 giorni.',
        accentClass: 'border-amber-200 bg-amber-50 text-amber-700',
        icon: CalendarClock,
    },
    {
        key: 'questo-mese',
        label: 'Questo mese',
        href: '/hub/scadenza/questo-mese',
        description: 'Pianificazione completa delle scadenze mensili.',
        accentClass: 'border-blue-200 bg-blue-50 text-blue-700',
        icon: CalendarRange,
    },
    {
        key: 'nuovi',
        label: 'Nuovi arrivi',
        href: '/hub/scadenza/nuovi',
        description: 'Nuove uscite recenti da valutare subito.',
        accentClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        icon: Sparkles,
    },
] as const;

function getDaysLeftLabel(date: string | null): string {
    if (!date) return 'Scadenza non disponibile';
    const target = new Date(date);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Scade oggi';
    if (diff === 1) return 'Scade domani';
    return `Scade tra ${diff} giorni`;
}

export default async function HubScadenzePage() {
    const supabase = await createClient();

    const [
        { data: { user } },
        oggi,
        settimana,
        mese,
        nuovi,
    ] = await Promise.all([
        supabase.auth.getUser(),
        getScadenzaOggi(supabase, 1, 5),
        getScadenzaQuestaSettimana(supabase, 1, 6),
        getScadenzaQuestoMese(supabase, 1, 5),
        getNuoviConcorsi(supabase, 1, 5),
    ]);

    const savedIds = user ? await getSavedConcorsiIds(supabase, user.id) : [];

    const statsByKey = {
        oggi: oggi.count ?? 0,
        'questa-settimana': settimana.count ?? 0,
        'questo-mese': mese.count ?? 0,
        nuovi: nuovi.count ?? 0,
    } as const;
    const weekCount = Math.max(1, statsByKey['questa-settimana']);
    const urgencyShare = Math.round((statsByKey.oggi / weekCount) * 100);
    const focusHref = statsByKey.oggi > 0 ? '/hub/scadenza/oggi' : '/hub/scadenza/questa-settimana';
    const focusLabel = statsByKey.oggi > 0 ? 'Focalizzati sulle urgenze di oggi' : 'Parti dalla pianificazione settimanale';
    const recommendedConcorsi = (settimana.data.length > 0 ? settimana.data : mese.data).slice(0, 3);

    return (
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[hsl(210,55%,98%)] text-slate-900 shadow-[0_32px_70px_-46px_rgba(15,23,42,0.65)] [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 8% 8%, rgba(14,78,136,0.16), transparent 35%), radial-gradient(circle at 92% 10%, rgba(244,63,94,0.1), transparent 31%), repeating-linear-gradient(90deg, rgba(12,56,97,0.035) 0 1px, transparent 1px 84px)',
                }}
            />

            <div className="relative space-y-7 px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
                <section className="grid gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/82 p-5 backdrop-blur-sm sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6 lg:p-7">
                    <div className="space-y-4">
                        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Link href="/hub/bacheca" className="hover:text-slate-900">Dashboard</Link>
                            <ChevronRight className="h-4 w-4" />
                            <span className="text-slate-900">Scadenze</span>
                        </nav>
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-slate-50/90 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-slate-700">
                            <Flame className="h-3.5 w-3.5" />
                            Deadline control room
                        </span>
                        <div className="space-y-2">
                            <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.85rem]">
                                Priorita di candidatura
                                <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                    sempre visibili
                                </span>
                            </h1>
                            <p className="max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
                                Vista operativa unica: prima chiudi le urgenze, poi pianifica settimana e mese, infine valida i nuovi bandi.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            <Link
                                href={focusHref}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                {focusLabel}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/hub/concorsi"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
                            >
                                Archivio completo
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Indice pressione giornaliera</p>
                        <p className="mt-2 text-4xl font-semibold text-slate-900">{urgencyShare}%</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            delle scadenze settimanali ricade entro oggi.
                        </p>
                        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200/75">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-blue-500"
                                style={{ width: `${Math.min(100, Math.max(8, urgencyShare))}%` }}
                            />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
                            <article className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-xs uppercase tracking-[0.1em] text-slate-500">Oggi</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-900">{statsByKey.oggi}</p>
                            </article>
                            <article className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-xs uppercase tracking-[0.1em] text-slate-500">Settimana</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-900">{statsByKey['questa-settimana']}</p>
                            </article>
                        </div>
                    </div>
                </section>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {DEADLINE_BUCKETS.map((bucket) => {
                        const Icon = bucket.icon;
                        const count = statsByKey[bucket.key];
                        return (
                            <Link
                                key={bucket.key}
                                href={bucket.href}
                                className="group rounded-2xl border border-slate-200 bg-white/90 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${bucket.accentClass}`}>
                                        {bucket.label}
                                    </span>
                                    <span className={`inline-flex rounded-xl border p-2 ${bucket.accentClass}`}>
                                        <Icon className="h-4 w-4" />
                                    </span>
                                </div>
                                <p className="mt-3 text-3xl font-semibold text-slate-900">{count}</p>
                                <p className="mt-1 min-h-[2.8rem] text-sm text-slate-600">{bucket.description}</p>
                                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0A4E88]">
                                    Apri sezione
                                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                </span>
                            </Link>
                        );
                    })}
                </section>

                <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
                    <div className="rounded-[1.55rem] border border-slate-200/85 bg-white/88 p-5 sm:p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Agenda urgente (7 giorni)</h2>
                            <Link href="/hub/scadenza/questa-settimana" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0A4E88] hover:underline">
                                Vista completa
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {settimana.data.length > 0 ? (
                            <div className="space-y-2.5">
                                {settimana.data.slice(0, 5).map((item) => (
                                    <Link
                                        key={item.concorso_id}
                                        href={item.slug ? `/hub/concorsi/${item.slug}` : '/hub/concorsi'}
                                        className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-400"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {item.titolo_breve || item.titolo}
                                            </p>
                                            <p className="truncate text-xs text-slate-500">
                                                {item.ente_nome || 'Ente pubblico'}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <span className="block rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                {formatDateShort(item.data_scadenza)}
                                            </span>
                                            <span className="mt-1 block text-[11px] font-medium text-slate-500">
                                                {getDaysLeftLabel(item.data_scadenza)}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-10 text-center">
                                <h3 className="text-base font-semibold text-slate-900">Nessuna urgenza rilevata</h3>
                                <p className="mt-1 text-sm text-slate-600">Al momento non ci sono scadenze nei prossimi 7 giorni.</p>
                            </div>
                        )}
                    </div>

                    <aside className="space-y-4">
                        <article className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Nuovi arrivi</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">{statsByKey.nuovi}</p>
                            <p className="mt-1 text-sm text-slate-600">pubblicazioni recenti da valutare.</p>
                            <Link href="/hub/scadenza/nuovi" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0A4E88] hover:underline">
                                Apri nuovi arrivi
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </article>

                        <article className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Orizzonte mensile</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">{statsByKey['questo-mese']}</p>
                            <p className="mt-1 text-sm text-slate-600">scadenze entro fine mese.</p>
                            <Link href="/hub/scadenza/questo-mese" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0A4E88] hover:underline">
                                Pianifica il mese
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </article>
                    </aside>
                </section>

                <section className="rounded-[1.55rem] border border-slate-200/85 bg-white/88 p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Selezione consigliata</h2>
                        <Link href="/hub/scadenza/oggi" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0A4E88] hover:underline">
                            Apri urgenze
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <ConcorsoList
                        concorsi={recommendedConcorsi}
                        savedIds={savedIds}
                        detailBasePath="/hub/concorsi"
                    />
                </section>
            </div>
        </div>
    );
}
