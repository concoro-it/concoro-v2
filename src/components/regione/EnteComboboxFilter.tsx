'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Check, Search, X } from 'lucide-react';

interface EnteOption {
    slug: string;
    name: string;
    count: number;
}

interface EnteComboboxFilterProps {
    options: EnteOption[];
    selectedSlug: string;
}

export function EnteComboboxFilter({ options, selectedSlug }: EnteComboboxFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');

    const selectedEnte = useMemo(
        () => options.find((item) => item.slug === selectedSlug) ?? null,
        [options, selectedSlug]
    );

    useEffect(() => {
        if (selectedEnte) {
            setQuery(selectedEnte.name);
            return;
        }
        setQuery('');
    }, [selectedEnte]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options.slice(0, 10);
        return options
            .filter((item) => item.name.toLowerCase().includes(q))
            .slice(0, 10);
    }, [options, query]);

    const updateEnte = (slug: string) => {
        const nextParams = new URLSearchParams(searchParams.toString());
        if (slug) nextParams.set('ente_slug', slug);
        else nextParams.delete('ente_slug');
        nextParams.delete('page');

        const queryString = nextParams.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
    };

    const handleSelect = (item: EnteOption) => {
        setQuery(item.name);
        setIsOpen(false);
        updateEnte(item.slug);
    };

    const clearEnte = () => {
        setQuery('');
        setIsOpen(false);
        updateEnte('');
    };

    return (
        <div className="space-y-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.09em] text-slate-500">Ente</p>

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={clearEnte}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${!selectedSlug
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                >
                    Tutti gli enti
                </button>
            </div>

            <div ref={containerRef} className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={query}
                    onFocus={() => setIsOpen(true)}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setIsOpen(true);
                    }}
                    placeholder="Cerca ente..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0A4E88]/45 focus:ring-2 focus:ring-[#0A4E88]/15"
                />

                {selectedEnte && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={clearEnte}
                            className="inline-flex items-center gap-1 rounded-full border border-[#0A4E88]/25 bg-[#0A4E88]/10 px-3 py-1 text-xs font-semibold text-[#083861]"
                        >
                            {selectedEnte.name}
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                {isOpen && (
                    <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)]">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((item) => (
                                <button
                                    key={item.slug}
                                    type="button"
                                    onClick={() => handleSelect(item)}
                                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                                >
                                    <span className="line-clamp-1">{item.name}</span>
                                    <span className="ml-3 inline-flex items-center gap-2 text-xs text-slate-500">
                                        {item.count}
                                        {selectedSlug === item.slug && <Check className="h-3.5 w-3.5 text-[#0A4E88]" />}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <p className="px-3 py-2 text-sm text-slate-500">Nessun ente trovato.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
