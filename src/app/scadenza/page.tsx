import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BellRing, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getNuoviConcorsi, getScadenzaOggi, getScadenzaQuestaSettimana, getScadenzaQuestoMese } from '@/lib/supabase/queries';
import { formatDateShort } from '@/lib/utils/date';
import { SCADENZA_BUCKETS } from '@/components/scadenza/config';
import { UpgradeModal } from '@/components/paywall/UpgradeModal';

export const metadata: Metadata = {
    title: 'Concorsi per Scadenza | Concoro',
    description: 'Trova concorsi in scadenza oggi, questa settimana e questo mese.',
};

export const revalidate = 3600;

export default async function ScadenzePage() {
    const supabase = await createClient();
    const [oggi, settimana, mese, nuovi] = await Promise.all([
        getScadenzaOggi(supabase, 1, 1),
        getScadenzaQuestaSettimana(supabase, 1, 6),
        getScadenzaQuestoMese(supabase, 1, 1),
        getNuoviConcorsi(supabase, 1, 1),
    ]);

    const statsByPath = {
        '/scadenza/oggi': oggi.count ?? 0,
        '/scadenza/questa-settimana': settimana.count ?? 0,
        '/scadenza/questo-mese': mese.count ?? 0,
        '/scadenza/nuovi': nuovi.count ?? 0,
    } as const;
    const urgencyShare = statsByPath['/scadenza/questa-settimana'] > 0
        ? Math.round((statsByPath['/scadenza/oggi'] / statsByPath['/scadenza/questa-settimana']) * 100)
        : 0;

    return (
        <div className="relative overflow-hidden bg-[hsl(210,55%,98%)] text-slate-900 [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 10% 8%, rgba(14,78,136,0.15), transparent 38%), radial-gradient(circle at 90% 10%, rgba(220,38,38,0.1), transparent 34%), repeating-linear-gradient(90deg, rgba(10,53,91,0.04) 0 1px, transparent 1px 88px)',
                }}
            />

            <div className="relative border-b border-slate-200 bg-white/85">
                <div className="container mx-auto max-w-[78rem] px-4 py-3 text-sm text-slate-500">
                    <nav className="flex flex-wrap items-center gap-2">
                        <Link href="/" className="hover:text-slate-900">Home</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-slate-900">Scadenze</span>
                    </nav>
                </div>
            </div>

            <header className="relative px-4 pb-12 pt-10 md:pb-14">
                <div className="container mx-auto grid max-w-[78rem] gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-slate-700">
                            <BellRing className="h-3.5 w-3.5" />
                            Deadline radar
                        </div>

                        <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] max-w-4xl text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-slate-900 md:text-6xl">
                            Scadenze concorsi:
                            <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                priorita chiare
                            </span>
                            ogni giorno.
                        </h1>

                        <p className="max-w-3xl text-base leading-relaxed text-slate-700 md:text-lg">
                            Qui trovi una vista operativa unica per chiudere prima i bandi urgenti e non perdere le nuove uscite.
                            Usa i blocchi temporali per organizzare la tua settimana.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/scadenza/oggi"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Vai alle urgenze di oggi
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/concorsi"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
                            >
                                Esplora archivio completo
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-[0_22px_50px_-35px_rgba(15,23,42,0.55)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Nuovo: indice urgenza quotidiana
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">
                            {urgencyShare}%
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            delle scadenze settimanali ricadono entro oggi.
                        </p>
                        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200/75">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-blue-500"
                                style={{ width: `${Math.min(100, Math.max(8, urgencyShare))}%` }}
                            />
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                            Usa questo segnale per capire se concentrare le candidature su urgenze immediate o pianificazione mensile.
                        </p>
                    </div>
                </div>
            </header>

            <main className="relative px-4 pb-14">
                <div className="container mx-auto max-w-[78rem] space-y-8">
                    <section className="grid gap-4 md:grid-cols-2">
                        {SCADENZA_BUCKETS.map((bucket) => {
                            const Icon = bucket.icon;
                            const count = statsByPath[bucket.href as keyof typeof statsByPath];
                            return (
                                <Link
                                    key={bucket.key}
                                    href={bucket.href}
                                    className="group rounded-3xl border border-slate-200 bg-white/85 p-5 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-[0_25px_60px_-42px_rgba(15,23,42,0.7)]"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${bucket.accentClass}`}>
                                                {bucket.eyebrow}
                                            </p>
                                            <h2 className="mt-3 text-xl font-semibold text-slate-900">{bucket.label}</h2>
                                            <p className="mt-1 text-sm leading-relaxed text-slate-600">{bucket.description}</p>
                                        </div>
                                        <div className={`rounded-2xl border p-2.5 ${bucket.accentClass}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="mt-5 flex items-center justify-between">
                                        <p className="text-3xl font-semibold text-slate-900">{count}</p>
                                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 transition group-hover:text-slate-900">
                                            Apri sezione
                                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </section>

                    <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_25px_55px_-42px_rgba(15,23,42,0.65)]">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-xl font-semibold text-slate-900">Prossime scadenze da monitorare</h3>
                                <Link href="/scadenza/questa-settimana" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                                    Vista completa
                                </Link>
                            </div>
                            <div className="mt-5 space-y-3">
                                {settimana.data.length > 0 ? settimana.data.slice(0, 5).map((item) => (
                                    <Link
                                        key={item.concorso_id}
                                        href={item.slug ? `/concorsi/${item.slug}` : '/concorsi'}
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
                                        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                            {formatDateShort(item.data_scadenza)}
                                        </span>
                                    </Link>
                                )) : (
                                    <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        Nessuna scadenza rilevata nei prossimi 7 giorni.
                                    </p>
                                )}
                            </div>
                        </div>

                        <aside>
                            <UpgradeModal triggerClassName="block">
                                <div className="group cursor-pointer rounded-3xl border border-slate-200 bg-white/85 p-6 transition hover:border-slate-400 hover:shadow-[0_25px_55px_-42px_rgba(15,23,42,0.65)]">
                                    <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-sky-700">
                                        Upgrade
                                    </p>
                                    <h3 className="mt-3 text-lg font-semibold text-slate-900">
                                        Sblocca la versione completa di Concoro
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                        Accedi a monitoraggio avanzato, preferenze salvate e un flusso piu rapido per trovare i bandi migliori.
                                    </p>
                                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition group-hover:text-slate-900">
                                        Apri upgrade
                                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                    </span>
                                </div>
                            </UpgradeModal>
                        </aside>
                    </section>
                </div>
            </main>
        </div>
    );
}
