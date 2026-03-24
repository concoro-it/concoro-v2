'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
    className?: string;
    placeholder?: string;
    autoFocus?: boolean;
    basePath?: string;
}

export function SearchBar({
    className,
    placeholder = 'Cerca concorsi (es. "Comune di Roma", "Ingegnere", "Infermiere")...',
    autoFocus = false,
    basePath,
}: SearchBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentQuery = searchParams.get('q') || '';
    const [query, setQuery] = useState(currentQuery);

    useEffect(() => {
        setQuery(currentQuery);
    }, [currentQuery]);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        const nextPath = basePath ?? pathname;
        const trimmed = query.trim();

        if (trimmed) params.set('q', trimmed);
        else params.delete('q');

        params.delete('page');
        const nextQuery = params.toString();
        router.push(nextQuery ? `${nextPath}?${nextQuery}` : nextPath);
    };

    const clearQuery = () => {
        setQuery('');
        const params = new URLSearchParams(searchParams.toString());
        const nextPath = basePath ?? pathname;

        params.delete('q');
        params.delete('page');
        const nextQuery = params.toString();
        router.push(nextQuery ? `${nextPath}?${nextQuery}` : nextPath);
    };

    return (
        <form
            onSubmit={handleSearch}
            className={cn("relative flex w-full items-center", className)}
        >
            <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pt-px pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                </div>

                <Input
                    type="search"
                    name="q"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="pl-10 pr-32 h-12 w-full rounded-full border-border bg-card shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus:border-border transition-all hover:bg-muted/30"
                    autoFocus={autoFocus}
                    autoComplete="off"
                />

                <div className="absolute inset-y-1 right-1 flex items-center gap-1">
                    {query.trim().length > 0 && (
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="Pulisci ricerca"
                            onClick={clearQuery}
                            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        type="submit"
                        size="sm"
                        className="h-10 px-4 rounded-full font-medium"
                    >
                        Cerca
                    </Button>
                </div>
            </div>
        </form>
    );
}
