import type { Metadata } from 'next';
import Link from 'next/link';
import {
    ArrowRight,
    Compass,
    DatabaseZap,
    Eye,
    ShieldCheck,
    Sparkles,
    Target,
} from 'lucide-react';

const PRINCIPLES = [
    {
        title: 'Chiarezza operativa',
        description:
            'Riduciamo il rumore: ogni schermata deve aiutare a decidere piu in fretta cosa monitorare, salvare o aprire.',
        icon: Eye,
    },
    {
        title: 'Dati affidabili',
        description:
            'Partiamo da fonti ufficiali e costruiamo filtri utili, perche la fiducia viene prima di qualsiasi effetto visivo.',
        icon: ShieldCheck,
    },
    {
        title: 'Focus territoriale',
        description:
            'Regione, provincia, ente: il contesto locale non e un dettaglio, e il modo piu concreto per orientarsi.',
        icon: Compass,
    },
    {
        title: 'Progresso continuo',
        description:
            'Miglioriamo con costanza la piattaforma: interfaccia, ranking e strumenti evolvono insieme alle esigenze reali degli utenti.',
        icon: Target,
    },
];

const WORKFLOW = [
    {
        title: 'Raccogliamo',
        text: 'Monitoriamo i bandi e strutturiamo le informazioni per renderle leggibili senza passaggi inutili.',
    },
    {
        title: 'Ordinamo',
        text: 'Costruiamo percorsi di esplorazione per area geografica, ente e settore, cosi la ricerca resta concreta.',
    },
    {
        title: 'Accompagniamo',
        text: 'Con Hub e Genio trasformiamo la ricerca in un flusso continuo: scoperta, selezione, azione.',
    },
];

export const metadata: Metadata = {
    title: 'Chi Siamo | Concoro',
    description:
        'Scopri la visione di Concoro: una piattaforma italiana pensata per rendere la ricerca dei concorsi pubblici piu chiara, veloce e concreta.',
    alternates: { canonical: '/chi-siamo' },
};

export default function ChiSiamoPage() {
    return (
        <div className="relative overflow-hidden bg-[hsl(210,55%,98%)] text-slate-900 [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 10% 8%, rgba(14,78,136,0.16), transparent 35%), radial-gradient(circle at 92% 12%, rgba(244,63,94,0.1), transparent 32%), repeating-linear-gradient(90deg, rgba(10,53,91,0.04) 0 1px, transparent 1px 84px)',
                }}
            />

            <section className="relative border-b border-slate-200/80 px-4 pb-14 pt-12 md:pt-16">
                <div className="container mx-auto grid max-w-[78rem] grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
                    <div className="space-y-6">
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-slate-700 backdrop-blur-sm">
                            <Sparkles className="h-3.5 w-3.5" />
                            Chi siamo
                        </span>

                        <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] max-w-3xl text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-slate-900 md:text-6xl">
                            Costruiamo il modo piu
                            <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                chiaro e utile
                            </span>
                            per cercare concorsi pubblici.
                        </h1>

                        <p className="max-w-2xl text-pretty text-base leading-relaxed text-slate-700 md:text-lg">
                            Concoro nasce per trasformare una ricerca dispersiva in un percorso pratico. Usiamo dati ufficiali, design
                            editoriale e strumenti concreti per aiutare ogni persona a trovare opportunita rilevanti con meno fatica e
                            piu controllo.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/hub"
                                className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Entra nella Hub
                                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                            </Link>
                            <Link
                                href="/concorsi"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                            >
                                Esplora i concorsi
                            </Link>
                        </div>
                    </div>

                    <aside className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_14px_46px_-28px_rgba(15,23,42,0.35)]">
                        <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-[#0A4E88] via-white to-rose-500" />
                        <div className="space-y-5 pl-3">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
                                <DatabaseZap className="h-3.5 w-3.5" />
                                Il nostro approccio
                            </p>
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-2xl text-slate-900">
                                Meno caos, piu direzione
                            </h2>
                            <p className="text-sm leading-relaxed text-slate-600">
                                Ogni scelta di prodotto ha un obiettivo semplice: ridurre tempo perso e incertezza nella ricerca. Per
                                questo combiniamo struttura dati, filtri utili e una UX pensata per decidere in pochi minuti.
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Visione</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">Ricerca pubblica piu accessibile</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Metodo</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">Dati ufficiali + design utile</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Focus</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">Territorio, ente, settore</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Obiettivo</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">Decisioni piu veloci</p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            <section className="relative px-4 py-14">
                <div className="container mx-auto max-w-[78rem]">
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">I nostri principi</p>
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl tracking-tight text-slate-900 md:text-4xl">
                                La brand identity e una promessa pratica
                            </h2>
                        </div>
                        <p className="max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
                            Non vogliamo solo essere riconoscibili, vogliamo essere affidabili ogni giorno. Colore, tono e interazione
                            riflettono sempre una stessa idea: orientarti meglio.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {PRINCIPLES.map((item) => {
                            const Icon = item.icon;
                            return (
                                <article
                                    key={item.title}
                                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-[0_22px_35px_-34px_rgba(2,6,23,0.6)] transition hover:-translate-y-0.5 hover:border-[#0A4E88]/30"
                                >
                                    <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[2rem] bg-gradient-to-br from-[#0A4E88]/18 to-transparent" />
                                    <div className="relative flex items-start gap-4">
                                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[#0A4E88]">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold tracking-tight text-slate-900">{item.title}</h3>
                                            <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="relative border-y border-slate-200/80 bg-white/70 px-4 py-14 backdrop-blur-[1px]">
                <div className="container mx-auto grid max-w-[78rem] grid-cols-1 gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Come lavoriamo</p>
                        <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl tracking-tight text-slate-900 md:text-4xl">
                            Un sistema semplice, pensato per essere davvero usato
                        </h2>
                        <p className="text-sm leading-relaxed text-slate-600 md:text-base">
                            La tecnologia conta solo quando alleggerisce il lavoro dell utente. Per questo ogni funzione viene disegnata
                            attorno a scenari reali, non a checklist astratte.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {WORKFLOW.map((step, index) => (
                            <article
                                key={step.title}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_35px_-34px_rgba(2,6,23,0.6)]"
                            >
                                <div className="mb-3 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#0A4E88] px-2 text-xs font-semibold text-white">
                                    {index + 1}
                                </div>
                                <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative px-4 py-16">
                <div className="container mx-auto max-w-[78rem]">
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(128deg,#0B2F50_0%,#0A4E88_55%,#155B96_100%)] p-8 text-white shadow-[0_34px_68px_-40px_rgba(2,6,23,0.85)] md:p-10">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(255,255,255,0.12),transparent_35%)]" />
                        <div className="relative grid gap-6 md:grid-cols-[1.1fr_auto] md:items-end">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-100/90">Concoro oggi</p>
                                <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-2 text-3xl tracking-tight md:text-4xl">
                                    Una piattaforma costruita per chi vuole passare all azione.
                                </h2>
                                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-100/90 md:text-base">
                                    Se condividi questa visione, il posto giusto per iniziare e la Hub: filtri avanzati, salvataggi,
                                    sintesi operative e un percorso piu ordinato verso i bandi che contano.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3 md:justify-end">
                                <Link
                                    href="/hub"
                                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0A4E88] transition hover:bg-slate-100"
                                >
                                    Vai alla Hub
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/55 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                                >
                                    Vedi i piani
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
