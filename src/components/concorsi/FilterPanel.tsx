'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Filter } from 'lucide-react';

interface FilterPanelProps {
    regioni?: { label: string; value: string }[];
    province?: { label: string; value: string }[];
    settori?: { label: string; value: string }[];
    className?: string;
    onClose?: () => void;
}

export function FilterPanel({
    regioni = [],
    province = [],
    settori = [],
    className,
    onClose,
}: FilterPanelProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const handleFilterChange = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        // Reset page when filters change
        params.delete('page');

        router.push(`${pathname}?${params.toString()}`);
    };

    const handleToggle = (key: string, checked: boolean) => {
        const params = new URLSearchParams(searchParams.toString());

        if (checked) {
            params.set(key, 'true');
        } else {
            params.delete(key);
        }

        params.delete('page');
        router.push(`${pathname}?${params.toString()}`);
    };

    const currentRegione = searchParams.get('regione') || '';
    const currentProvincia = searchParams.get('provincia') || '';
    const currentSettore = searchParams.get('settore') || '';
    const isSoloAttivi = searchParams.get('solo_attivi') === 'true';

    const resetFilters = () => {
        // Keep query if present, reset everything else
        const q = searchParams.get('q');
        if (q) {
            router.push(`${pathname}?q=${encodeURIComponent(q)}`);
        } else {
            router.push(pathname);
        }
        if (onClose) onClose();
    };

    return (
        <div className={`space-y-6 ${className || ''}`}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" /> Filtra
                </h3>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3 mr-1" /> Azzera
                </Button>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="regione">Regione</Label>
                    <Select value={currentRegione} onValueChange={(val) => handleFilterChange('regione', val === 'tutte' ? null : val)}>
                        <SelectTrigger id="regione">
                            <SelectValue placeholder="Tutte le regioni" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tutte">Tutte le regioni</SelectItem>
                            {regioni.map((r) => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia</Label>
                    <Select value={currentProvincia} onValueChange={(val) => handleFilterChange('provincia', val === 'tutte' ? null : val)} disabled={province.length === 0}>
                        <SelectTrigger id="provincia">
                            <SelectValue placeholder="Tutte le province" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tutte">Tutte le province</SelectItem>
                            {province.map((p) => (
                                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="settore">Settore</Label>
                    <Select value={currentSettore} onValueChange={(val) => handleFilterChange('settore', val === 'tutti' ? null : val)}>
                        <SelectTrigger id="settore">
                            <SelectValue placeholder="Tutti i settori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tutti">Tutti i settori</SelectItem>
                            {settori.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="pt-4 border-t border-border">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="solo_attivi"
                            checked={isSoloAttivi}
                            onCheckedChange={(checked) => handleToggle('solo_attivi', checked as boolean)}
                        />
                        <label
                            htmlFor="solo_attivi"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Mostra solo attivi
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
