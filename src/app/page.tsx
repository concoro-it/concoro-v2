import type { Metadata } from 'next';
import Link from 'next/link';
import {
    ArrowRight,
    Building2,
    Clock3,
    Compass,
    MapPinned,
    Search,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { createCachedPublicClient } from '@/lib/supabase/server';
import { getActiveConcorsiCount, getFeaturedConcorsi, getProvinceWithCount, getRegioniWithCount, getSettoriWithCount } from '@/lib/supabase/queries';
import { ConcorsoCard } from '@/components/concorsi/ConcorsoCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { getServerAppUrl } from '@/lib/auth/url';
import { toUrlSlug } from '@/lib/utils/regioni';

const REGION_FLAG_BY_SLUG: Record<string, string> = {
    abruzzo: '/Regions/Flag_of_Abruzzo.svg',
    basilicata: '/Regions/Flag_of_Basilicata.svg',
    calabria: '/Regions/Flag_of_Calabria.svg',
    campania: '/Regions/Flag_of_Campania.svg',
    'emilia-romagna': '/Regions/Flag_of_Emilia-Romagna_(de_facto).svg',
    'friuli-venezia-giulia': '/Regions/Flag_of_Friuli-Venezia_Giulia.svg',
    lazio: '/Regions/Flag_of_Lazio.svg',
    liguria: '/Regions/Flag_of_Liguria.svg',
    lombardia: '/Regions/Flag_of_Lombardy.svg',
    marche: '/Regions/Flag_of_Marche.svg',
    molise: '/Regions/Flag_of_Molise.svg',
    piemonte: '/Regions/Flag_of_Piedmont.svg',
    puglia: '/Regions/Flag_of_Apulia.svg',
    sardegna: '/Regions/Flag_of_Sardinia,_Italy.svg',
    sicilia: '/Regions/Sicilian_Flag.svg',
    toscana: '/Regions/Flag_of_Tuscany.svg',
    'trentino-alto-adige': '/Regions/Flag_of_Trentino-South_Tyrol.svg',
    umbria: '/Regions/Flag_of_Umbria.svg',
    'valle-d-aosta': '/Regions/Flag_of_Valle_Aosta.svg',
    'valle-daosta': '/Regions/Flag_of_Valle_Aosta.svg',
    veneto: '/Regions/Flag_of_Veneto.svg',
};

const GEO_SECTIONS = [
    {
        title: 'Concorsi per Regione',
        description: 'Panoramica chiara dei bandi attivi nella tua regione, con scadenze e percorsi locali da aprire subito.',
        href: '/regione',
        icon: MapPinned,
        accent: 'from-slate-300 via-slate-400 to-slate-500',
    },
    {
        title: 'Concorsi per Provincia',
        description: 'Una vista piu vicina al territorio, utile se vuoi capire dove cercare davvero vicino a te.',
        href: '/provincia',
        icon: Compass,
        accent: 'from-emerald-200 via-emerald-300 to-teal-300',
    },
    {
        title: 'Concorsi per Ente',
        description: 'Accesso diretto ai bandi pubblicati dai singoli enti, senza passare da ricerche dispersive.',
        href: '/ente',
        icon: Building2,
        accent: 'from-amber-200 via-amber-300 to-orange-300',
    },
];

const FAQ_ITEMS = [
    {
        q: 'Come trovare concorsi pubblici in Italia senza controllare decine di siti?',
        a: 'Su Concoro puoi partire da una vista unica e poi restringere la ricerca per regione, provincia, ente, settore o scadenza. Cosi passi piu in fretta dai bandi generici a quelli davvero utili per il tuo profilo e la tua zona.',
    },
    {
        q: 'Come cercare concorsi pubblici vicino a me?',
        a: 'Puoi iniziare dalle pagine dedicate a regioni e province italiane. Se la vicinanza geografica conta, questo e il modo piu rapido per vedere prima i bandi del tuo territorio e poi affinare la ricerca.',
    },
    {
        q: 'Posso cercare i bandi anche per ente o settore?',
        a: 'Si. Se sai gia quali amministrazioni vuoi monitorare o in quale ambito vuoi lavorare, puoi usare i percorsi per ente e settore per arrivare piu rapidamente ai concorsi piu pertinenti.',
    },
    {
        q: 'I concorsi su Concoro vengono aggiornati spesso?',
        a: 'Il monitoraggio e quotidiano. La piattaforma segue nuove pubblicazioni e scadenze per aiutarti a tenere sotto controllo le opportunita aperte, fermo restando che prima di candidarti conviene sempre verificare il bando ufficiale.',
    },
];

const HOW_IT_WORKS_STEPS = [
    {
        title: 'Scegli la tua area',
        description: 'Apri le pagine per regione o provincia e identifica i concorsi pubblici rilevanti per il tuo territorio.',
    },
    {
        title: 'Filtra per profilo professionale',
        description: 'Usa settore, ente e finestra temporale di scadenza per ridurre il rumore informativo.',
    },
    {
        title: 'Approfondisci e candidati',
        description: 'Apri la scheda del concorso, verifica requisiti e scadenze, poi passa alla candidatura sui canali ufficiali.',
    },
];

function getRegionFlagPath(regione: string): string | null {
    const slug = toUrlSlug(regione);
    return REGION_FLAG_BY_SLUG[slug] ?? null;
}

export const metadata: Metadata = {
    title: 'Concorsi Pubblici in Italia | Trova bandi per regione, provincia ed ente | Concoro',
    description:
        'Trova concorsi pubblici in Italia per regione, provincia, ente e scadenza. Concoro ti aiuta a cercare bandi vicini, monitorare le uscite e orientarti piu in fretta.',
    alternates: { canonical: '/' },
    keywords: [
        'concorsi pubblici',
        'dove trovare concorsi pubblici',
        'concorsi pubblici per regione',
        'concorsi pubblici per provincia',
        'bandi pubblici in Italia',
        'come candidarsi ai concorsi pubblici',
    ],
};

export const revalidate = 3600;

export default async function HomePage() {
    const supabase = createCachedPublicClient({ revalidate: 3600, tags: ['public:home'] });
    const [featured, activeConcorsiCount, regioni, province, settori] = await Promise.all([
        getFeaturedConcorsi(supabase),
        getActiveConcorsiCount(supabase),
        getRegioniWithCount(supabase),
        getProvinceWithCount(supabase),
        getSettoriWithCount(supabase),
    ]);

    const featuredCount = featured.length;
    const regioniCount = regioni.length;
    const provinceCount = province.length;
    const settoriCount = settori.length;

    const appUrl = getServerAppUrl();
    const todayIso = new Date().toISOString();
    const homeSchema = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebSite',
                name: 'Concoro',
                url: appUrl,
                inLanguage: 'it-IT',
                potentialAction: {
                    '@type': 'SearchAction',
                    target: `${appUrl}/concorsi?query={search_term_string}`,
                    'query-input': 'required name=search_term_string',
                },
            },
            {
                '@type': 'WebPage',
                name: 'Concoro - Concorsi Pubblici in Italia',
                url: appUrl,
                inLanguage: 'it-IT',
                dateModified: todayIso,
                description:
                    'Piattaforma per trovare concorsi pubblici in Italia con percorsi per regione, provincia, ente, settore e scadenza.',
            },
            {
                '@type': 'ItemList',
                name: 'Percorsi principali concorsi pubblici',
                itemListElement: GEO_SECTIONS.map((section, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    name: section.title,
                    url: `${appUrl}${section.href}`,
                })),
            },
            {
                '@type': 'FAQPage',
                mainEntity: FAQ_ITEMS.map((item) => ({
                    '@type': 'Question',
                    name: item.q,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: item.a,
                    },
                })),
            },
        ],
    };

    return (
        <div className="relative overflow-hidden bg-[hsl(210,55%,98%)] text-slate-900 [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
            <JsonLd data={homeSchema} />

            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 8% 10%, rgba(18,65,108,0.16), transparent 36%), radial-gradient(circle at 94% 14%, rgba(220,38,38,0.09), transparent 32%), repeating-linear-gradient(90deg, rgba(10,53,91,0.035) 0 1px, transparent 1px 84px)',
                }}
            />

            <section className="relative border-b border-slate-200/80 px-4 pb-14 pt-12 md:pt-16">
                <div className="container mx-auto grid max-w-[78rem] grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-slate-700 backdrop-blur-sm">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Dati ufficiali aggiornati ogni giorno
                        </div>

                        <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] max-w-3xl text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-slate-900 md:text-6xl">
                            Trova i
                            <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                concorsi pubblici
                            </span>
                            giusti, nel posto giusto.
                        </h1>

                        <p className="max-w-2xl text-pretty text-base leading-relaxed text-slate-700 md:text-lg">
                            Concoro raccoglie e ordina i bandi della Pubblica Amministrazione per regione, provincia, ente e settore,
                            cosi puoi partire dal tuo territorio, filtrare meglio e capire in pochi minuti quali opportunita vale la pena seguire.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/hub"
                                className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Registrati gratis
                                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                            </Link>
                            <Link
                                href="/hub"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                            >
                                <Clock3 className="h-4 w-4" />
                                Vai alla Hub
                            </Link>
                        </div>
                    </div>

                    <aside className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_14px_46px_-28px_rgba(15,23,42,0.35)]">
                        <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-emerald-500 via-white to-rose-500" />
                        <div className="space-y-5 pl-3">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
                                <Sparkles className="h-3.5 w-3.5" />
                                Aggiornato ogni giorno
                            </p>
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-2xl text-slate-900">
                                Tutti i concorsi, ordinati come li cerchi
                            </h2>
                            <p className="text-sm leading-relaxed text-slate-600">
                                Dati da fonti ufficiali (InPA). Nella Hub puoi filtrare per regione, provincia, ente, settore e scadenza,
                                salvare bandi e ricerche, e tornare sempre su cio che conta per te.
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Concorsi attivi</p>
                                    <p className="mt-1 text-xl font-semibold text-slate-900">{activeConcorsiCount}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Regioni coperte</p>
                                    <p className="mt-1 text-xl font-semibold text-slate-900">{regioniCount}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Province monitorate</p>
                                    <p className="mt-1 text-xl font-semibold text-slate-900">{provinceCount}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Settori disponibili</p>
                                    <p className="mt-1 text-xl font-semibold text-slate-900">{settoriCount}</p>
                                </div>
                            </div>
                            <Link
                                href="/hub"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B4B7F] hover:text-[#083861]"
                            >
                                Crea la tua ricerca nella Hub
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </aside>
                </div>
            </section>

            <div className="container mx-auto max-w-[78rem] space-y-14 px-4 py-14">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                    <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        Come trovare un concorso pubblico
                    </div>
                    <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mb-5 text-3xl tracking-tight text-slate-900">
                        Metodo in 3 passaggi
                    </h2>
                         <p className="mt-5 rounded-2xl bg-white px-2 py-2 text-sm leading-relaxed text-slate-700">
                        <strong>Cos&apos;e Concoro:</strong> una piattaforma italiana per cercare concorsi pubblici da fonti ufficiali,
                        confrontare bandi vicini o rilevanti per il tuo profilo e non perdere le scadenze piu importanti.
                    </p>
                    <ol className="grid gap-3 md:grid-cols-3">
                        {HOW_IT_WORKS_STEPS.map((step, index) => (
                            <li key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Passaggio {index + 1}</p>
                                <h3 className="mt-1 text-sm font-semibold text-slate-900">{step.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                            </li>
                        ))}
                    </ol>

                    <p className="mt-5 text-xs text-slate-500">
                        Fonte dati: pubblicazioni ufficiali su InPA. Aggiornamento continuo della piattaforma.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {GEO_SECTIONS.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <Link
                                key={section.href}
                                href={section.href}
                                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_-30px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 hover:border-slate-300"
                            >
                                <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${section.accent}`} aria-hidden />
                                <p className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                                    <Icon className="h-5 w-5" />
                                </p>
                                <h3 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-xl text-slate-900">{section.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{section.description}</p>
                                <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0B4B7F]">
                                    Esplora
                                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                </p>
                                <span className="sr-only">Apri sezione {index + 1}</span>
                            </Link>
                        );
                    })}
                </section>

                <section>
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl tracking-tight text-slate-900">Concorsi in evidenza</h2>
                        <Link href="/concorsi" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0B4B7F] hover:text-[#083861]">
                            Vedi tutti
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {featured.map((concorso) => (
                            <ConcorsoCard key={concorso.concorso_id} concorso={concorso} />
                        ))}
                        {featured.length === 0 && (
                            <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 md:col-span-2">
                                Nessun concorso disponibile al momento.
                            </p>
                        )}
                    </div>
                </section>

                {regioni.length > 0 && (
                    <section>
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl tracking-tight text-slate-900">Mappa regionale dei bandi</h2>
                            <Link href="/regione" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0B4B7F] hover:text-[#083861]">
                                Tutte le regioni
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
                            {regioni.slice(0, 20).map(({ regione, count }) => {
                                const flagPath = getRegionFlagPath(regione);
                                return (
                                    <Link
                                        key={regione}
                                        href={`/regione/${toUrlSlug(regione)}`}
                                        className="group relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(160deg,#f8fbff_0%,#ecf4ff_52%,#dfeefe_100%)] p-4 transition-all hover:-translate-y-0.5 hover:border-[#0A4E88]/30"
                                    >
                                        {flagPath && (
                                            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 overflow-hidden rounded-full opacity-20 transition group-hover:opacity-30">
                                                <img
                                                    src={flagPath}
                                                    alt={`${regione} simbolo`}
                                                    className="h-full w-full object-cover object-center"
                                                />
                                            </div>
                                        )}
                                        <h3 className="relative z-[1] line-clamp-1 text-sm font-semibold text-slate-900">{regione}</h3>
                                        <p className="relative z-[1] mt-1 text-xs text-slate-600">{count} concorsi aperti</p>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                {settori.length > 0 && (
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            <Search className="h-3.5 w-3.5" />
                            Navigazione semantica
                        </div>
                        <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mb-5 text-3xl tracking-tight text-slate-900">Esplora per settore professionale</h2>
                        <div className="flex flex-wrap gap-2.5">
                            {settori.slice(0, 14).map(({ settore, count }) => (
                                <Link
                                    key={settore}
                                    href={`/settore/${toUrlSlug(settore)}`}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                                >
                                    {settore}
                                    <span className="rounded-full bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-600">{count}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                    <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mb-5 text-3xl tracking-tight text-slate-900">Domande frequenti</h2>
                    <div className="grid gap-3 md:grid-cols-2">
                        {FAQ_ITEMS.map((item) => (
                            <article key={item.q} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <h3 className="text-sm font-semibold text-slate-900">{item.q}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
