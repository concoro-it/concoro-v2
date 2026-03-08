import Link from 'next/link';
import { ArrowRight, Sparkles, CalendarDays, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getFeaturedConcorsi, getRegioniWithCount, getSettoriWithCount, getLatestArticoli } from '@/lib/supabase/queries';
import { ConcorsoCard } from '@/components/concorsi/ConcorsoCard';
import { toUrlSlug } from '@/lib/utils/regioni';
import { formatDateIT } from '@/lib/utils/date';

const REGION_FLAG_BY_SLUG: Record<string, string> = {
    abruzzo: '/regions/Flag_of_Abruzzo.svg',
    basilicata: '/regions/Flag_of_Basilicata.svg',
    calabria: '/regions/Flag_of_Calabria.svg',
    campania: '/regions/Flag_of_Campania.svg',
    'emilia-romagna': '/regions/Flag_of_Emilia-Romagna_(de_facto).svg',
    'friuli-venezia-giulia': '/regions/Flag_of_Friuli-Venezia_Giulia.svg',
    lazio: '/regions/Flag_of_Lazio.svg',
    liguria: '/regions/Flag_of_Liguria.svg',
    lombardia: '/regions/Flag_of_Lombardy.svg',
    marche: '/regions/Flag_of_Marche.svg',
    molise: '/regions/Flag_of_Molise.svg',
    piemonte: '/regions/Flag_of_Piedmont.svg',
    puglia: '/regions/Flag_of_Apulia.svg',
    sardegna: '/regions/Flag_of_Sardinia,_Italy.svg',
    sicilia: '/regions/Sicilian_Flag.svg',
    toscana: '/regions/Flag_of_Tuscany.svg',
    'trentino-alto-adige': '/regions/Flag_of_Trentino-South_Tyrol.svg',
    umbria: '/regions/Flag_of_Umbria.svg',
    'valle-d-aosta': "/regions/Flag_of_Valle_d'Aosta.svg",
    veneto: '/regions/Flag_of_Veneto.svg',
};

function    getRegionFlagPath(regione: string): string | null {
    const slug = toUrlSlug(regione);
    return REGION_FLAG_BY_SLUG[slug] ?? null;
}

export default async function HomePage() {
    const supabase = await createClient();
    const [featured, regioni, settori, articoli] = await Promise.all([
        getFeaturedConcorsi(supabase),
        getRegioniWithCount(supabase),
        getSettoriWithCount(supabase),
        getLatestArticoli(supabase, 3),
    ]);

    const timeChips = [
        { label: '⏳ In scadenza oggi', href: '/scadenza/oggi', color: 'bg-red-50 text-red-700 border-red-200' },
        { label: '📅 Questa settimana', href: '/scadenza/questa-settimana', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        { label: '🆕 Nuovi arrivi', href: '/scadenza/nuovi', color: 'bg-green-50 text-green-700 border-green-200' },
        { label: '🗓 Questo mese', href: '/scadenza/questo-mese', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    ];

    return (
        <div>
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#051D32] via-[#0a3055] to-[#1a5480] py-20 px-4">
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 0%, transparent 60%)', backgroundSize: '100% 100%' }} />
                <div className="container max-w-container mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full mb-6 border border-white/20 backdrop-blur-sm animate-appear">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Dati aggiornati ogni giorno dal portale InPA</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-semibold text-white mb-4 tracking-title animate-appear delay-100">
                        Trova il tuo<br />
                        <span className="text-blue-300">concorso pubblico</span>
                    </h1>
                    <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-8 animate-appear delay-300">
                        La piattaforma italiana per scoprire bandi e concorsi pubblici. Cerca per regione, settore, ente e scadenza.
                    </p>

                    {/* Search bar */}
                    <div className="max-w-xl mx-auto animate-appear delay-300">
                        <Link href="/concorsi" className="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 shadow-lg hover:shadow-xl transition-shadow">
                            <Search className="w-5 h-5 text-muted-foreground" />
                            <span className="text-muted-foreground text-sm flex-1 text-left">
                                Cerca concorsi per ruolo, ente o regione...
                            </span>
                            <span className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1 rounded-lg">
                                Cerca
                            </span>
                        </Link>
                    </div>

                    {/* Time chips */}
                    <div className="flex flex-wrap gap-2 justify-center mt-6 animate-appear delay-700">
                        {timeChips.map(chip => (
                            <Link key={chip.href} href={chip.href}
                                className={`text-sm font-medium px-4 py-2 rounded-full border ${chip.color} hover:opacity-80 transition-opacity bg-white/90 backdrop-blur-sm`}>
                                {chip.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <div className="container max-w-container mx-auto px-4 py-12 space-y-16">

                {/* Featured Concorsi */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold tracking-tight">Ultimi concorsi pubblicati</h2>
                        <Link href="/concorsi" className="flex items-center gap-1 text-sm text-primary hover:underline font-medium">
                            Vedi tutti <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        {featured.map(c => <ConcorsoCard key={c.concorso_id} concorso={c} />)}
                        {featured.length === 0 && (
                            <p className="col-span-3 text-center text-muted-foreground py-8">Nessun concorso disponibile al momento.</p>
                        )}
                    </div>
                </section>

                {/* Settori */}
                {settori.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-semibold tracking-tight mb-6">Cerca per settore</h2>
                        <div className="flex flex-wrap gap-2">
                            {settori.slice(0, 12).map(({ settore, count }) => (
                                <Link key={settore} href={`/settore/${toUrlSlug(settore)}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-white hover:bg-secondary hover:border-primary/30 transition-all text-sm font-medium">
                                    {settore}
                                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{count}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Regioni */}
                {regioni.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-semibold tracking-tight mb-6">Cerca per regione</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {regioni.slice(0, 20).map(({ regione, count }) => {
                                const flagPath = getRegionFlagPath(regione);
                                return (
                                    <Link
                                        key={regione}
                                        href={`/regione/${toUrlSlug(regione)}`}
                                        className="group relative w-full aspect-square overflow-hidden rounded-[24px] border border-[rgba(37, 40, 44, 0.18)] bg-[linear-gradient(225deg,rgba(107,114,128,0.80)_1%,rgba(16,38,58,0.80)_0%,rgba(5,29,50,1)_100%)] p-[8%] shadow-[0px_4px_16px_rgba(5,29,50,0.07),0px_1px_4px_rgba(5,29,50,0.06)] transition-all hover:shadow-[0px_10px_24px_rgba(5,29,50,0.16),0px_2px_8px_rgba(5,29,50,0.08)]"
                                    >
                                        {flagPath && (
                                            <img
                                                src={flagPath}
                                                alt={`${regione} simbolo`}
                                                className="pointer-events-none absolute left-3/4 top-1/2 rounded-[24px] h-[200%] w-[200%] -translate-x-1/3 -translate-y-1/2 object-contain opacity-5 transition-transform duration-300 group-hover:scale-105"
                                            />
                                        )}
                                        <div className="relative z-[1] flex h-full flex-col justify-end">
                                            <h3 className="mb-1 line-clamp-1 text-[clamp(16px,4vw,20px)] font-semibold tracking-[-0.02em] text-white">
                                                {regione}
                                            </h3>
                                            <p className="text-[clamp(12px,3vw,15px)] font-normal text-[rgb(140,154,178)]">
                                                {count} apert{count === 1 ? 'o' : 'i'}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Blog */}
                {articoli.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold tracking-tight">Dal blog</h2>
                            <Link href="/blog" className="flex items-center gap-1 text-sm text-primary hover:underline font-medium">
                                Tutti gli articoli <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {articoli.map(a => (
                                <Link key={a.id} href={`/blog/${a.slug}`}
                                    className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow group">
                                    {a.cover_image && (
                                        <img src={a.cover_image} alt={a.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform" />
                                    )}
                                    {!a.cover_image && (
                                        <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                            <CalendarDays className="w-8 h-8 text-primary/30" />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <p className="text-xs text-muted-foreground mb-1">{formatDateIT(a.published_at)}</p>
                                        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{a.title}</h3>
                                        {a.excerpt && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.excerpt}</p>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
