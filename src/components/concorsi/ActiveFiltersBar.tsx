'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FilterChip = {
    key: string;
    label: string;
    value: string;
};

function formatPublishedLabel(iso: string): string {
    const parsed = Date.parse(iso);
    if (Number.isNaN(parsed)) return 'Personalizzato';
    const diffHours = Math.round((Date.now() - parsed) / (1000 * 60 * 60));
    if (diffHours <= 24) return 'Ultime 24h';
    if (diffHours <= 72) return 'Ultimi 3 giorni';
    if (diffHours <= 24 * 7) return 'Ultima settimana';
    if (diffHours <= 24 * 30) return 'Ultimo mese';
    return 'Personalizzato';
}

export function ActiveFiltersBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const params = new URLSearchParams(searchParams.toString());

    const chips: FilterChip[] = [
        { key: 'regione', label: 'Regione', value: params.get('regione') ?? '' },
        { key: 'provincia', label: 'Provincia', value: params.get('provincia') ?? '' },
        { key: 'settore', label: 'Settore', value: params.get('settore') ?? '' },
        { key: 'tipo_procedura', label: 'Tipo', value: params.get('tipo_procedura') ?? '' },
        { key: 'ente_slug', label: 'Ente', value: params.get('ente_slug') ?? '' },
        { key: 'stato', label: 'Stato', value: params.get('stato') ?? '' },
        { key: 'sort', label: 'Ordina', value: params.get('sort') ?? '' },
        {
            key: 'published_from',
            label: 'Pubblicati',
            value: params.get('published_from') ? formatPublishedLabel(params.get('published_from') as string) : '',
        },
    ].filter((chip) => chip.value);

    if (chips.length === 0) return null;

    const removeFilter = (key: string) => {
        const next = new URLSearchParams(params.toString());
        next.delete(key);
        next.delete('page');
        router.push(`${pathname}?${next.toString()}`);
    };

    const clearAll = () => {
        const next = new URLSearchParams(params.toString());
        ['regione', 'provincia', 'settore', 'tipo_procedura', 'ente_slug', 'stato', 'sort', 'published_from', 'published_to']
            .forEach((key) => next.delete(key));
        next.delete('page');
        router.push(next.toString() ? `${pathname}?${next.toString()}` : pathname);
    };

    return (
        <div className="mb-4 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
                <button
                    key={chip.key}
                    type="button"
                    onClick={() => removeFilter(chip.key)}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground hover:bg-secondary/80"
                    title="Rimuovi filtro"
                >
                    <span className="truncate">{chip.label}: {chip.value}</span>
                    <X className="h-3 w-3 flex-shrink-0" />
                </button>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
                Azzera filtri
            </Button>
        </div>
    );
}
