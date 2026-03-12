import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { getActiveConcorsiCount, getProvinceWithCount, getRegioniWithCount, getSavedConcorsi } from '@/lib/supabase/queries';
import { ConcorsoList } from '@/components/concorsi/ConcorsoList';
import {
    ArrowRight,
    Bookmark,
    BrainCircuit,
    Check,
    Search,
    Settings2,
    Sparkles,
} from 'lucide-react';
import ProvinciaMapExplorer from '@/components/dashboard/ProvinciaMapExplorer';

export const metadata: Metadata = { title: 'Bacheca | Dashboard' };

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const [tier, savedConcorsi, profile, regionCounts, provinceCounts, activeConcorsiCount] = await Promise.all([
        getUserTier(supabase),
        getSavedConcorsi(supabase, user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        getRegioniWithCount(supabase),
        getProvinceWithCount(supabase),
        getActiveConcorsiCount(supabase),
    ]);

    const profileData = profile.data;
    const firstName = profileData?.full_name?.split(' ')[0] ?? 'utente';
    const trackedRegions = regionCounts.filter((item) => item.count > 0).length;
    const topRegion = [...regionCounts].sort((a, b) => b.count - a.count)[0];
    const tierLabel = tier === 'pro' ? 'Pro' : tier === 'admin' ? 'Admin' : 'Gratuito';
    const tierTone = tier === 'pro' || tier === 'admin';

    return (
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[hsl(210,55%,98%)] text-slate-900 shadow-[0_32px_70px_-46px_rgba(15,23,42,0.65)] [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 6% 6%, rgba(15,76,129,0.17), transparent 33%), radial-gradient(circle at 94% 12%, rgba(234,88,12,0.11), transparent 30%), repeating-linear-gradient(90deg, rgba(12,56,97,0.035) 0 1px, transparent 1px 84px)',
                }}
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-white/60 to-transparent" />

            <div className="relative space-y-8 px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
                <section className="grid gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/82 p-5 backdrop-blur-sm sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6 lg:p-7">
                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-slate-50/90 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-slate-700">
                            <Sparkles className="h-3.5 w-3.5" />
                            Bacheca personale Concoro
                        </span>
                        <div className="space-y-2">
                            <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.85rem]">
                                Ciao {firstName}, questa e la tua
                                <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                    centrale operativa
                                </span>
                                per i concorsi.
                            </h1>
                            <p className="max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
                                Monitora i territori con piu opportunita, riprendi i bandi salvati e passa subito alle aree che usi ogni giorno.
                            </p>
                        </div>
                    </div>

                    {tierTone ? (
                        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Piano attivo</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900">{tierLabel}</p>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                    Account premium
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 text-sm">
                                <Link
                                    href="/hub/profile"
                                    className="group inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                >
                                    Profilo
                                    <Settings2 className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
                                </Link>
                                <Link
                                    href="/hub/concorsi"
                                    className="group inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                >
                                    Concorsi
                                    <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 shadow-[0_18px_38px_-30px_rgba(120,53,15,0.5)] sm:p-5">
                            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-300/25 blur-2xl" />
                            <div className="relative space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-amber-700/90">Piano attivo</p>
                                        <p className="mt-1 text-lg font-semibold text-slate-900">{tierLabel}</p>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-amber-200/70 px-2.5 py-1 text-xs font-semibold text-amber-900">
                                        Upgrade ora
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed text-slate-700">
                                    Passa a Pro per alert mirati, monitoraggio continuo e supporto Genio sui bandi prioritari.
                                </p>
                                <div className="rounded-xl border border-amber-200/80 bg-white/75 p-3">
                                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-amber-800">Cosa sblocchi con Pro</p>
                                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                                        <li className="flex items-start gap-2">
                                            <span className="mt-0.5 inline-flex rounded-full bg-emerald-100 p-0.5 text-emerald-700">
                                                <Check className="h-3 w-3" />
                                            </span>
                                            Alert personalizzati su enti e territori prioritari
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="mt-0.5 inline-flex rounded-full bg-emerald-100 p-0.5 text-emerald-700">
                                                <Check className="h-3 w-3" />
                                            </span>
                                            Tracking continuo senza rifare ricerche ogni giorno
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="mt-0.5 inline-flex rounded-full bg-emerald-100 p-0.5 text-emerald-700">
                                                <Check className="h-3 w-3" />
                                            </span>
                                            Supporto Genio per capire su quali bandi puntare
                                        </li>
                                    </ul>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5 text-sm">
                                    <Link
                                        href="/pricing"
                                        className="group inline-flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        Passa a Pro
                                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                    </Link>
                                    <Link
                                        href="/hub/profile"
                                        className="group inline-flex items-center justify-between rounded-xl border border-amber-200 bg-white/90 px-3 py-2 font-medium text-slate-700 transition hover:border-amber-300 hover:bg-white"
                                    >
                                        Profilo
                                        <Settings2 className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Salvati</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">{savedConcorsi.length}</p>
                        <p className="mt-1 text-sm text-slate-600">Concorsi da seguire</p>
                    </article>
                    <article className="rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Copertura</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">{trackedRegions}</p>
                        <p className="mt-1 text-sm text-slate-600">Regioni con bandi attivi</p>
                    </article>
                    <article className="rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Volume totale</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">{activeConcorsiCount}</p>
                        <p className="mt-1 text-sm text-slate-600">Bandi nella mappa</p>
                    </article>
                    <article className="rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Regione top</p>
                        <p className="mt-2 truncate text-xl font-semibold text-slate-900">{topRegion?.regione ?? 'N/D'}</p>
                        <p className="mt-1 text-sm text-slate-600">{topRegion?.count ?? 0} concorsi</p>
                    </article>
                </section>

                <section className="rounded-[1.55rem] border border-slate-200/85 bg-white/88 p-4 shadow-[0_24px_42px_-34px_rgba(2,6,23,0.45)] sm:p-5 lg:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Radar geografico</h2>
                            <p className="text-sm text-slate-600">Controlla subito dove si concentra il maggior numero di opportunita.</p>
                        </div>
                    </div>
                    <ProvinciaMapExplorer regionCounts={regionCounts} provinces={provinceCounts} />
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    <Link
                        href="/hub/salvati"
                        className="group rounded-2xl border border-slate-200 bg-white/90 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >
                        <span className="inline-flex rounded-xl bg-[#0E2F50]/10 p-2 text-[#0E2F50]"><Bookmark className="h-4 w-4" /></span>
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">I tuoi salvati</h3>
                        <p className="mt-1 text-sm text-slate-600">Rivedi i bandi messi in evidenza e riparti da dove eri rimasto.</p>
                        <span className="mt-3 inline-flex items-center text-sm font-semibold text-[#0A4E88]">Vai ai salvati <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" /></span>
                    </Link>

                    <Link
                        href="/hub/ricerche"
                        className="group rounded-2xl border border-slate-200 bg-white/90 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >
                        <span className="inline-flex rounded-xl bg-emerald-600/10 p-2 text-emerald-700"><Search className="h-4 w-4" /></span>
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">Ricerche monitorate</h3>
                        <p className="mt-1 text-sm text-slate-600">Tieni traccia dei criteri ricorrenti e accelera la ricerca quotidiana.</p>
                        <span className="mt-3 inline-flex items-center text-sm font-semibold text-[#0A4E88]">Apri ricerche <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" /></span>
                    </Link>

                    <Link
                        href="/hub/genio"
                        className="group rounded-2xl border border-slate-200 bg-white/90 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >
                        <span className="inline-flex rounded-xl bg-amber-500/15 p-2 text-amber-700"><BrainCircuit className="h-4 w-4" /></span>
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">Genio</h3>
                        <p className="mt-1 text-sm text-slate-600">Ricevi suggerimenti rapidi su bandi, requisiti e prossimi passi operativi.</p>
                        <span className="mt-3 inline-flex items-center text-sm font-semibold text-[#0A4E88]">Apri Genio <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" /></span>
                    </Link>
                </section>

                <section className="rounded-[1.55rem] border border-slate-200/85 bg-white/88 p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">I tuoi concorsi salvati</h2>
                        <Link href="/hub/salvati" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0A4E88] hover:underline">
                            Vedi tutti
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {savedConcorsi.length > 0 ? (
                        <ConcorsoList
                            concorsi={savedConcorsi.slice(0, 3)}
                            savedIds={savedConcorsi.slice(0, 3).map((concorso) => concorso.concorso_id)}
                            detailBasePath="/hub/concorsi"
                        />
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-12 text-center">
                            <span className="inline-flex rounded-xl bg-slate-900/8 p-2 text-slate-600"><Bookmark className="h-5 w-5" /></span>
                            <h3 className="mt-3 text-base font-semibold text-slate-900">Nessun concorso salvato</h3>
                            <p className="mt-1 text-sm text-slate-600">Aggiungi i bandi interessanti alla bacheca per ritrovarli in un click.</p>
                            <Link
                                href="/hub/concorsi"
                                className="mt-4 inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                            >
                                Esplora concorsi
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
