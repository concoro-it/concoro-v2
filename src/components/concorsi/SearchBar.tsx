'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
    className?: string;
    placeholder?: string;
    autoFocus?: boolean;
}

export function SearchBar({
    className,
    placeholder = 'Cerca concorsi (es. "Comune di Roma", "Ingegnere", "Infermiere")...',
    autoFocus = false,
}: SearchBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [query, setQuery] = useState(searchParams.get('q') || '');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/concorsi?q=${encodeURIComponent(query.trim())}`);
        } else {
            router.push('/concorsi');
        }
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
                    className="pl-10 pr-24 h-12 w-full rounded-full border-border bg-card shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus:border-border transition-all hover:bg-muted/30"
                    autoFocus={autoFocus}
                    autoComplete="off"
                />

                <div className="absolute inset-y-1 right-1">
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
