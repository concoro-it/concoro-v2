import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { createCachedPublicClient } from '@/lib/supabase/server';
import { getProvinceWithCount } from '@/lib/supabase/queries';
import { toUrlSlug } from '@/lib/utils/regioni';
import { provinceToRegionSlug } from '@/lib/utils/province-region-map';

export const metadata: Metadata = {
    title: 'Concorsi Pubblici per Provincia | Cerca bandi vicino a te | Concoro',
    description: 'Esplora i concorsi pubblici per provincia e individua i bandi piu vicini a te. Ideale per una ricerca locale piu precisa.',
};

export const revalidate = 3600;

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

const NORMALIZED_REGION_TO_FLAG_SLUG: Record<string, string> = {
    emiliaromagna: 'emilia-romagna',
    friuliveneziagiulia: 'friuli-venezia-giulia',
    trentinoaltoadige: 'trentino-alto-adige',
    valledaosta: 'valle-daosta',
};

function getRegionFlagPath(regione: string | null | undefined, provincia: string): string | null {
    const slug = regione ? toUrlSlug(regione) : null;
    if (slug && REGION_FLAG_BY_SLUG[slug]) return REGION_FLAG_BY_SLUG[slug];

    const normalizedRegionSlug = provinceToRegionSlug(provincia);
    if (!normalizedRegionSlug) return null;
    const canonicalSlug = NORMALIZED_REGION_TO_FLAG_SLUG[normalizedRegionSlug] ?? normalizedRegionSlug;

    return REGION_FLAG_BY_SLUG[canonicalSlug] ?? null;
}

function getRegionLabel(regione: string | null | undefined, provincia: string): string {
    if (regione) return regione;
    const normalizedRegionSlug = provinceToRegionSlug(provincia);
    if (!normalizedRegionSlug) return 'Regione';
    return NORMALIZED_REGION_TO_FLAG_SLUG[normalizedRegionSlug] ?? normalizedRegionSlug;
}

export default async function ProvinciaIndexPage() {
    const supabase = createCachedPublicClient({ revalidate, tags: ['public:provincia-index'] });
    const province = await getProvinceWithCount(supabase);

    return (
        <div className="relative overflow-hidden bg-[hsl(210,55%,98%)] text-slate-900 [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
            <div className="container mx-auto max-w-[78rem] px-4 py-10">
                <div className="mb-8">
                    <nav className="mb-4 text-sm text-slate-500">
                        <Link href="/" className="hover:text-slate-900">Home</Link>
                        {' › '}
                        <span className="text-slate-900">Province</span>
                    </nav>
                </div>

                <section>
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl tracking-tight text-slate-900">
                            Mappa provinciale dei bandi
                        </h1>
                        <Link href="/concorsi" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0B4B7F] hover:text-[#083861]">
                            Tutti i concorsi
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {province.map(({ provincia, sigla, regione, count }) => {
                            const flagPath = getRegionFlagPath(regione, provincia);
                            const regionLabel = getRegionLabel(regione, provincia);
                            return (
                                <Link
                                    key={provincia}
                                    href={`/provincia/${toUrlSlug(provincia)}`}
                                    className="group relative isolate flex min-h-[128px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(160deg,#f8fbff_0%,#ecf4ff_52%,#dfeefe_100%)] p-5 transition-all hover:-translate-y-0.5 hover:border-[#0A4E88]/30"
                                >
                                    {flagPath && (
                                        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 overflow-hidden rounded-full opacity-20 transition group-hover:opacity-30">
                                            <Image
                                                src={flagPath}
                                                alt={`${regionLabel} simbolo`}
                                                fill
                                                sizes="96px"
                                                className="h-full w-full object-cover object-center"
                                            />
                                        </div>
                                    )}
                                    <h2 className="relative z-[1] line-clamp-2 pr-12 text-base font-semibold text-slate-900">
                                        {provincia} {sigla ? `(${sigla})` : ''}
                                    </h2>
                                    <p className="relative z-[1] mt-6 text-sm text-slate-600">{count} concorsi aperti</p>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
