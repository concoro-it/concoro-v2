import type { Metadata } from 'next';
import Link from 'next/link';
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    Building2,
    GraduationCap,
    Landmark,
    ShieldPlus,
    SlidersHorizontal,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getEntiWithCount } from '@/lib/supabase/queries';

export const metadata: Metadata = {
    title: 'Enti | Dashboard',
    description: 'Esplora i concorsi per ente dal dashboard.',
};

export const revalidate = 3600;

type Props = {
    searchParams?: Promise<{
        q?: string;
        categoria?: string;
        volume?: string;
        sort?: string;
        page?: string;
    }>;
};

type CategoriaKey = 'centrali' | 'territoriali' | 'sanita' | 'istruzione' | 'altri';
type VolumeKey = 'alto' | 'medio' | 'basso';

const CATEGORY_META: Record<CategoriaKey, { label: string; chipClass: string; cardClass: string }> = {
    centrali: {
        label: 'Enti centrali',
        chipClass: 'border-[#0A4E88]/30 bg-[#0A4E88]/10 text-[#0A4E88]',
        cardClass: 'border-[#0A4E88]/25 bg-[linear-gradient(155deg,#f6fbff_0%,#eaf4ff_100%)]',
    },
    territoriali: {
        label: 'Enti territoriali',
        chipClass: 'border-emerald-300/60 bg-emerald-50 text-emerald-700',
        cardClass: 'border-emerald-200/70 bg-[linear-gradient(155deg,#f8fdf9_0%,#e8f7ee_100%)]',
    },
    sanita: {
        label: 'Sanita',
        chipClass: 'border-rose-300/60 bg-rose-50 text-rose-700',
        cardClass: 'border-rose-200/70 bg-[linear-gradient(155deg,#fff8f8_0%,#ffecef_100%)]',
    },
    istruzione: {
        label: 'Istruzione',
        chipClass: 'border-amber-300/60 bg-amber-50 text-amber-700',
        cardClass: 'border-amber-200/70 bg-[linear-gradient(155deg,#fffdf7_0%,#fff2de_100%)]',
    },
    altri: {
        label: 'Altri enti',
        chipClass: 'border-slate-300/80 bg-white text-slate-600',
        cardClass: 'border-slate-200 bg-white',
    },
};

const VOLUME_LABEL: Record<VolumeKey, string> = {
    alto: 'Volume alto',
    medio: 'Volume medio',
    basso: 'Volume basso',
};

function parsePage(raw: string | undefined): number {
    const parsed = Number.parseInt(raw ?? '1', 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return parsed;
}

function normalize(text: string): string {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function detectCategoria(name: string): CategoriaKey {
    const value = normalize(name);
    if (
        value.includes('ministero') ||
        value.includes('agenzia') ||
        value.includes('autorita') ||
        value.includes('inps') ||
        value.includes('inail') ||
        value.includes('prefettura') ||
        value.includes('questura')
    ) return 'centrali';
    if (
        value.includes('comune') ||
        value.includes('provincia') ||
        value.includes('regione') ||
        value.includes('citta metropolitana') ||
        value.includes('unione dei comuni')
    ) return 'territoriali';
    if (
        value.includes('asl') ||
        value.includes('asst') ||
        value.includes('azienda sanitaria') ||
        value.includes('ospedal') ||
        value.includes('ats') ||
        value.includes('asp')
    ) return 'sanita';
    if (
        value.includes('universita') ||
        value.includes('politecnico') ||
        value.includes('istituto') ||
        value.includes('scuola')
    ) return 'istruzione';
    return 'altri';
}

function detectVolume(count: number): VolumeKey {
    if (count >= 20) return 'alto';
    if (count >= 8) return 'medio';
    return 'basso';
}

function getCategoryIcon(category: CategoriaKey) {
    if (category === 'centrali') return Landmark;
    if (category === 'territoriali') return Building2;
    if (category === 'sanita') return ShieldPlus;
    if (category === 'istruzione') return GraduationCap;
    return Activity;
}

function getVolumeTone(volume: VolumeKey): string {
    if (volume === 'alto') return 'text-emerald-700';
    if (volume === 'medio') return 'text-amber-700';
    return 'text-slate-600';
}

function buildQuery(base: URLSearchParams, key: string, value?: string): string {
    const next = new URLSearchParams(base);
    if (!value || value === 'all') {
        next.delete(key);
    } else {
        next.set(key, value);
    }
    next.delete('page');
    const query = next.toString();
    return query ? `?${query}` : '/hub/ente';
}

function getPaginationItems(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }

    const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    if (currentPage <= 3) {
        pages.add(2);
        pages.add(3);
        pages.add(4);
    }
    if (currentPage >= totalPages - 2) {
        pages.add(totalPages - 1);
        pages.add(totalPages - 2);
        pages.add(totalPages - 3);
    }

    const sorted = Array.from(pages)
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((a, b) => a - b);

    const items: Array<number | 'ellipsis'> = [];
    for (let i = 0; i < sorted.length; i++) {
        const page = sorted[i];
        const prev = sorted[i - 1];
        if (prev && page - prev > 1) items.push('ellipsis');
        items.push(page);
    }

    return items;
}

export default async function HubEnteIndexPage({ searchParams }: Props) {
    const paramsObj = await searchParams;
    const q = (paramsObj?.q ?? '').trim();
    const categoriaFilter = (paramsObj?.categoria ?? 'all') as CategoriaKey | 'all';
    const volumeFilter = (paramsObj?.volume ?? 'all') as VolumeKey | 'all';
    const sort = paramsObj?.sort === 'alfabeto' ? 'alfabeto' : 'impatto';
    const page = parsePage(paramsObj?.page);

    const supabase = await createClient();
    const enti = await getEntiWithCount(supabase);

    const enhanced = enti.map((item) => {
        const name = item.ente_nome || item.ente_slug;
        const categoria = detectCategoria(name);
        const volume = detectVolume(item.count);
        return {
            ...item,
            name,
            categoria,
            volume,
        };
    });

    const queryNormalized = normalize(q);
    const filtered = enhanced
        .filter((item) => {
            if (queryNormalized && !normalize(item.name).includes(queryNormalized)) return false;
            if (categoriaFilter !== 'all' && item.categoria !== categoriaFilter) return false;
            if (volumeFilter !== 'all' && item.volume !== volumeFilter) return false;
            return true;
        })
        .sort((a, b) => {
            if (sort === 'alfabeto') return a.name.localeCompare(b.name, 'it');
            return b.count - a.count || a.name.localeCompare(b.name, 'it');
        });

    const topEntities = [...enhanced]
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'it'))
        .slice(0, 9);

    const perPage = 20;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);
    const baseQuery = new URLSearchParams({
        ...(q ? { q } : {}),
        ...(categoriaFilter !== 'all' ? { categoria: categoriaFilter } : {}),
        ...(volumeFilter !== 'all' ? { volume: volumeFilter } : {}),
        ...(sort !== 'impatto' ? { sort } : {}),
    });
    const fromCount = filtered.length === 0 ? 0 : start + 1;
    const toCount = Math.min(start + perPage, filtered.length);
    const paginationItems = getPaginationItems(currentPage, totalPages);

    return (
        <div className="relative overflow-hidden bg-[hsl(210,55%,98%)] text-slate-900 [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
            <div className="container mx-auto max-w-[78rem] px-4 py-10">
                <div className="mb-6">
                    <nav className="mb-4 text-sm text-slate-500">
                        <Link href="/hub/bacheca" className="hover:text-slate-900">Dashboard</Link>
                        {' › '}
                        <span className="text-slate-900">Enti</span>
                    </nav>
                    <div className="rounded-3xl border border-slate-200/90 bg-[linear-gradient(145deg,#ffffff_0%,#edf4ff_65%,#deecff_100%)] p-6 shadow-[0_26px_60px_-46px_rgba(10,78,136,0.5)] md:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="max-w-2xl">
                                <p className="mb-2 inline-flex items-center rounded-full border border-[#0A4E88]/20 bg-[#0A4E88]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-[#0A4E88]">
                                    Directory enti
                                </p>
                                <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl tracking-tight text-slate-900 md:text-4xl">
                                    Cerca gli enti che pubblicano davvero
                                </h1>
                                <p className="mt-3 text-sm text-slate-600 md:text-base">
                                    Prima mettiamo in evidenza gli enti con maggiore volume, poi puoi scendere nel dettaglio con filtri e ricerca mirata.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-[#0A4E88]/20 bg-white/70 px-4 py-3 text-right">
                                <p className="text-xs uppercase tracking-[0.11em] text-slate-500">Enti con bandi attivi</p>
                                <p className="text-3xl font-semibold text-slate-900">{enhanced.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <section className="mb-10">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-2xl text-slate-900">
                            Enti in evidenza
                        </h2>
                        <Link href="/hub/concorsi" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0B4B7F] hover:text-[#083861]">
                            Vai ai concorsi
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {topEntities.map((ente, index) => {
                            const categoryMeta = CATEGORY_META[ente.categoria];
                            const Icon = getCategoryIcon(ente.categoria);
                            const share = topEntities[0]?.count ? Math.round((ente.count / topEntities[0].count) * 100) : 0;
                            return (
                                <Link
                                    key={ente.ente_slug}
                                    href={`/hub/ente/${ente.ente_slug}`}
                                    className={`group relative overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${categoryMeta.cardClass}`}
                                >
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.09em] ${categoryMeta.chipClass}`}>
                                            <Icon className="h-3.5 w-3.5" />
                                            {categoryMeta.label}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-500">#{index + 1}</span>
                                    </div>
                                    <h3 className="line-clamp-2 min-h-[3rem] text-base font-semibold text-slate-900">{ente.name}</h3>
                                    <div className="mt-4 flex items-end justify-between gap-3">
                                        <div>
                                            <p className="text-2xl font-semibold text-slate-900">{ente.count}</p>
                                            <p className="text-xs text-slate-500">bandi attivi</p>
                                        </div>
                                        <p className={`text-xs font-semibold ${getVolumeTone(ente.volume)}`}>{VOLUME_LABEL[ente.volume]}</p>
                                    </div>
                                    <div className="mt-3 h-1.5 rounded-full bg-white/80">
                                        <div className="h-full rounded-full bg-[#0A4E88] transition-all group-hover:w-full" style={{ width: `${Math.max(16, share)}%` }} />
                                    </div>
                                    <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0A4E88]">
                                        Apri dettaglio ente
                                        <ArrowUpRight className="h-4 w-4" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_24px_52px_-44px_rgba(15,23,42,0.7)] md:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-2xl text-slate-900">Esplora tutti gli enti</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Mostrati {fromCount}-{toCount} di {filtered.length} risultati
                            </p>
                        </div>
                        <form className="flex w-full max-w-md items-center gap-2 md:w-auto" method="get">
                            <label htmlFor="ente-search" className="sr-only">Cerca ente</label>
                            <input
                                id="ente-search"
                                name="q"
                                defaultValue={q}
                                placeholder="Cerca un ente..."
                                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
                            />
                            {categoriaFilter !== 'all' && <input type="hidden" name="categoria" value={categoriaFilter} />}
                            {volumeFilter !== 'all' && <input type="hidden" name="volume" value={volumeFilter} />}
                            {sort !== 'impatto' && <input type="hidden" name="sort" value={sort} />}
                            <button
                                type="submit"
                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                Cerca
                            </button>
                        </form>
                    </div>

                    <div className="mb-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Categoria</p>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={buildQuery(baseQuery, 'categoria', 'all')}
                                scroll={false}
                                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition ${categoriaFilter === 'all' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'}`}
                            >
                                Tutte
                            </Link>
                            {(Object.keys(CATEGORY_META) as CategoriaKey[]).map((key) => (
                                <Link
                                    key={key}
                                    href={buildQuery(baseQuery, 'categoria', key)}
                                    scroll={false}
                                    className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition ${categoriaFilter === key ? 'border-[#0A4E88] bg-[#0A4E88] text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'}`}
                                >
                                    {CATEGORY_META[key].label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="mb-5">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Volume bandi</p>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={buildQuery(baseQuery, 'volume', 'all')}
                                scroll={false}
                                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition ${volumeFilter === 'all' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'}`}
                            >
                                Tutti
                            </Link>
                            {(['alto', 'medio', 'basso'] as VolumeKey[]).map((key) => (
                                <Link
                                    key={key}
                                    href={buildQuery(baseQuery, 'volume', key)}
                                    scroll={false}
                                    className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition ${volumeFilter === key ? 'border-[#0A4E88] bg-[#0A4E88] text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'}`}
                                >
                                    {VOLUME_LABEL[key]}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="mb-5">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Ordina per</p>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={buildQuery(baseQuery, 'sort', 'impatto')}
                                scroll={false}
                                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition ${sort === 'impatto' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'}`}
                            >
                                Impatto
                            </Link>
                            <Link
                                href={buildQuery(baseQuery, 'sort', 'alfabeto')}
                                scroll={false}
                                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition ${sort === 'alfabeto' ? 'border-[#0A4E88] bg-[#0A4E88] text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'}`}
                            >
                                Alfabetico
                            </Link>
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
                            <p className="text-base font-semibold text-slate-900">Nessun ente trovato</p>
                            <p className="mt-1 text-sm text-slate-600">Prova a rimuovere qualche filtro o a usare una ricerca diversa.</p>
                            <Link href="/hub/ente" scroll={false} className="mt-4 inline-flex text-sm font-semibold text-[#0A4E88] hover:underline">
                                Azzera filtri
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {pageItems.map((ente) => {
                                    const categoryMeta = CATEGORY_META[ente.categoria];
                                    const Icon = getCategoryIcon(ente.categoria);
                                    return (
                                        <Link
                                            key={ente.ente_slug}
                                            href={`/hub/ente/${ente.ente_slug}`}
                                            className="group rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#0A4E88]/35 hover:shadow-[0_20px_35px_-28px_rgba(15,23,42,0.6)]"
                                        >
                                            <div className="mb-3 flex items-start justify-between gap-2">
                                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${categoryMeta.chipClass}`}>
                                                    <Icon className="h-3 w-3" />
                                                    {categoryMeta.label}
                                                </span>
                                                <span className="text-[11px] font-semibold text-slate-500">{VOLUME_LABEL[ente.volume]}</span>
                                            </div>
                                            <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold text-slate-900">{ente.name}</h3>
                                            <p className="mt-3 text-sm text-slate-600">{ente.count} bandi attivi</p>
                                        </Link>
                                    );
                                })}
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-center gap-2">
                                    {paginationItems.map((item, idx) => {
                                        if (item === 'ellipsis') {
                                            return (
                                                <span key={`ellipsis-${idx}`} className="inline-flex h-9 min-w-9 items-center justify-center text-sm font-semibold text-slate-500">
                                                    ...
                                                </span>
                                            );
                                        }

                                        const targetPage = item;
                                        const next = new URLSearchParams(baseQuery);
                                        if (targetPage > 1) next.set('page', String(targetPage));
                                        const href = `?${next.toString()}`;

                                        return (
                                            <Link
                                                key={targetPage}
                                                href={href}
                                                scroll={false}
                                                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition ${
                                                    currentPage === targetPage
                                                        ? 'border-slate-900 bg-slate-900 text-white'
                                                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                                                }`}
                                            >
                                                {targetPage}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
