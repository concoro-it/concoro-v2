import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSettoriWithCount } from '@/lib/supabase/queries';
import { toUrlSlug } from '@/lib/utils/regioni';

export const metadata: Metadata = {
    title: 'Settori | Hub',
    description: 'Esplora i concorsi per settore dalla bacheca.',
};

export const revalidate = 3600;

type Props = {
    searchParams?: Promise<{
        page?: string;
    }>;
};

function parsePage(raw: string | undefined): number {
    const parsed = Number.parseInt(raw ?? '1', 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return parsed;
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

export default async function HubSettoreIndexPage({ searchParams }: Props) {
    const paramsObj = await searchParams;
    const page = parsePage(paramsObj?.page);

    const supabase = await createClient();
    const settori = await getSettoriWithCount(supabase);

    const ordered = [...settori]
        .sort((a, b) => b.count - a.count || a.settore.localeCompare(b.settore, 'it'))
        .map((item) => ({
            ...item,
            slug: toUrlSlug(item.settore),
        }));

    const perPage = 16;
    const totalPages = Math.max(1, Math.ceil(ordered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * perPage;
    const pageItems = ordered.slice(start, start + perPage);
    const fromCount = ordered.length === 0 ? 0 : start + 1;
    const toCount = Math.min(start + perPage, ordered.length);
    const paginationItems = getPaginationItems(currentPage, totalPages);

    return (
        <div className="dashboard-shell">
            <div className="dashboard-shell-overlay" />
            <div className="relative container mx-auto max-w-[78rem] px-4 py-8 sm:px-6 sm:py-10">
                <div className="mb-6">
                    <nav className="mb-4 text-sm text-slate-500">
                        <Link href="/hub/bacheca" className="hover:text-slate-900">Bacheca</Link>
                        {' › '}
                        <span className="text-slate-900">Settori</span>
                    </nav>

                    <div className="rounded-3xl border border-slate-200/90 bg-[linear-gradient(145deg,#ffffff_0%,#edf4ff_65%,#deecff_100%)] p-6 shadow-[0_26px_60px_-46px_rgba(10,78,136,0.5)] md:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="max-w-2xl">
                                <p className="mb-2 inline-flex items-center rounded-full border border-[#0A4E88]/20 bg-[#0A4E88]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-[#0A4E88]">
                                    Directory settori
                                </p>
                                <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl tracking-tight text-slate-900 md:text-4xl">
                                    Tutti i settori in una vista semplice
                                </h1>
                                <p className="mt-3 text-sm text-slate-600 md:text-base">
                                    {fromCount}-{toCount} di {ordered.length} settori. Ogni card porta direttamente ai concorsi del settore.
                                </p>
                            </div>

                            <Link
                                href="/hub/concorsi"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
                            >
                                Vai ai concorsi
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {ordered.length === 0 ? (
                    <section className="dashboard-section-frame border-dashed p-10 text-center">
                        <p className="text-lg font-semibold text-slate-900">Nessun settore disponibile</p>
                        <p className="mt-2 text-sm text-slate-600">Riprova tra poco: i dati vengono aggiornati in automatico.</p>
                    </section>
                ) : (
                    <>
                        <section className="dashboard-section-frame p-5 sm:p-6 lg:p-7">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {pageItems.map((item) => (
                                <Link
                                    key={item.slug}
                                    href={`/hub/settore/${item.slug}`}
                                    className="group rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#0A4E88]/35 hover:shadow-[0_20px_35px_-28px_rgba(15,23,42,0.6)]"
                                >
                                    <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-[#0A4E88]/20 bg-[#0A4E88]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#0A4E88]">
                                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                                        Settore
                                    </div>

                                    <h2 className="line-clamp-2 min-h-[2.8rem] text-sm font-semibold text-slate-900">
                                        {item.settore}
                                    </h2>

                                    <div className="mt-4 flex items-end justify-between gap-2">
                                        <div>
                                            <p className="text-xl font-semibold text-slate-900">{item.count}</p>
                                            <p className="text-xs text-slate-500">bandi attivi</p>
                                        </div>
                                        <span className="text-xs font-semibold text-[#0A4E88] transition group-hover:text-[#083861]">
                                            Apri
                                        </span>
                                    </div>
                                </Link>
                            ))}
                            </div>
                        </section>

                        {totalPages > 1 && (
                            <section className="mt-8 flex items-center justify-center gap-2">
                                {paginationItems.map((item, idx) => {
                                    if (item === 'ellipsis') {
                                        return (
                                            <span key={`ellipsis-${idx}`} className="inline-flex h-9 min-w-9 items-center justify-center text-sm font-semibold text-slate-500">
                                                ...
                                            </span>
                                        );
                                    }

                                    const targetPage = item;
                                    const href = targetPage === 1 ? '/hub/settore' : `/hub/settore?page=${targetPage}`;

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
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
