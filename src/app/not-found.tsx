import Link from 'next/link';
import { ArrowLeft, ArrowRight, Compass, Home, MapPinned, Search } from 'lucide-react';

const QUICK_PATHS = [
    {
        title: 'Torna alla home',
        description: 'Riparti dalla panoramica completa dei concorsi attivi.',
        href: '/',
        icon: Home,
    },
    {
        title: 'Esplora i concorsi',
        description: 'Apri subito l elenco completo e applica i filtri principali.',
        href: '/concorsi',
        icon: Search,
    },
    {
        title: 'Vai per regione',
        description: 'Restringi la ricerca in base al territorio che ti interessa.',
        href: '/regione',
        icon: MapPinned,
    },
    {
        title: 'Vai per provincia',
        description: 'Entra nei bandi locali e valuta opportunita vicino a te.',
        href: '/provincia',
        icon: Compass,
    },
];

export default function NotFound() {
    return (
        <div className="relative overflow-hidden bg-[hsl(210,55%,98%)] text-slate-900 [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 6% 14%, rgba(14,78,136,0.16), transparent 34%), radial-gradient(circle at 92% 16%, rgba(244,63,94,0.09), transparent 30%), repeating-linear-gradient(90deg, rgba(10,53,91,0.035) 0 1px, transparent 1px 84px)',
                }}
            />

            <section className="relative px-4 pb-16 pt-14 md:pb-24 md:pt-20">
                <div className="container mx-auto max-w-[78rem]">
                    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/85 bg-white/85 p-6 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur-[2px] md:p-10">
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-b from-emerald-500 via-white to-rose-500" />

                        <div className="space-y-7 pl-3 md:space-y-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                                Percorso non trovato
                            </div>

                            <div className="max-w-3xl space-y-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Errore 404</p>
                                <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-balance text-4xl leading-[1.03] tracking-tight text-slate-900 md:text-6xl">
                                    Questa pagina e uscita dal percorso,
                                    <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                        ma non la tua ricerca.
                                    </span>
                                </h1>
                                <p className="max-w-2xl text-base leading-relaxed text-slate-700 md:text-lg">
                                    Il link potrebbe essere vecchio o non piu disponibile. Qui sotto trovi scorciatoie utili per continuare
                                    subito senza perdere tempo.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/"
                                    className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
                                    Torna alla home
                                </Link>
                                <Link
                                    href="/concorsi"
                                    className="group inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                                >
                                    Apri concorsi attivi
                                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                </Link>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                {QUICK_PATHS.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="group rounded-2xl border border-slate-200/90 bg-slate-50/85 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition group-hover:border-slate-300 group-hover:text-slate-900">
                                                    <Icon className="h-4 w-4" />
                                                </span>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                                    <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
