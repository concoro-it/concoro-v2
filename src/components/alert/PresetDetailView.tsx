'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Crown, Lock, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { UpgradeProModal } from '@/components/paywall/UpgradeProModal';
import { ConcorsoCard } from '@/components/concorsi/ConcorsoCard';
import { FREE_FEED_PREVIEW_LIMIT, type NormalizedSavedSearchFilters } from '@/lib/saved-search-alerts';
import type { UserTier } from '@/types/profile';
import type { Concorso } from '@/types/concorso';

type PresetDetailViewProps = {
    presetId: string;
    tier: UserTier;
};

type PresetResponse = {
    is_pro: boolean;
    preset: {
        id: string;
        name: string;
        enabled: boolean;
        filters: NormalizedSavedSearchFilters;
        created_at: string;
        match_count: number;
        last_match_at: string | null;
    };
    segments: {
        cutoff_at: string;
        new_count: number;
        existing_count: number;
    };
    current: {
        page: number;
        per_page: number;
        total: number;
        has_more: boolean;
        locked_count: number;
        items: Array<{
            saved_search_id: string;
            concorso_id: string;
            bucket: 'new' | 'existing';
            concorso: Concorso | null;
        }>;
    };
};

type FilterChip = {
    label: string;
    tone: 'slate' | 'blue' | 'emerald' | 'amber';
};

const EMPTY_FILTERS: NormalizedSavedSearchFilters = {
    query: null,
    regioni: [],
    province: [],
    settori: [],
    tipo_procedura: null,
    ente_slug: null,
    stato: null,
    sort: null,
    published_from: null,
    date_from: null,
    date_to: null,
};

function toDateLabel(value: string | null | undefined): string {
    if (!value) return 'N/D';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/D';
    return date.toLocaleDateString('it-IT');
}

function buildPresetChips(filters: NormalizedSavedSearchFilters): FilterChip[] {
    const chips: FilterChip[] = [];

    if (filters.query) chips.push({ label: `Ricerca: ${filters.query}`, tone: 'blue' });
    filters.regioni.forEach((item) => chips.push({ label: item, tone: 'blue' }));
    filters.province.forEach((item) => chips.push({ label: item, tone: 'slate' }));
    filters.settori.forEach((item) => chips.push({ label: item, tone: 'emerald' }));
    if (filters.tipo_procedura) chips.push({ label: filters.tipo_procedura, tone: 'slate' });
    if (filters.ente_slug) chips.push({ label: `Ente: ${filters.ente_slug}`, tone: 'slate' });
    if (filters.stato) chips.push({ label: `Stato: ${filters.stato}`, tone: 'amber' });
    if (filters.sort) chips.push({ label: `Ordina: ${filters.sort}`, tone: 'amber' });

    if (chips.length === 0) {
        chips.push({ label: 'Tutti i concorsi', tone: 'slate' });
    }

    return chips;
}

function chipToneClass(tone: FilterChip['tone']): string {
    if (tone === 'blue') return 'border-sky-200 bg-sky-50 text-sky-800';
    if (tone === 'emerald') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    if (tone === 'amber') return 'border-amber-200 bg-amber-50 text-amber-800';
    return 'border-slate-200 bg-slate-50 text-slate-700';
}

export function PresetDetailView({ presetId, tier }: PresetDetailViewProps) {
    const isPro = tier === 'pro' || tier === 'admin';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [data, setData] = useState<PresetResponse | null>(null);

    const load = useCallback(async (nextPage: number, append = false) => {
        const response = await fetch(`/api/profile/saved-search-alerts/presets/${presetId}?page=${nextPage}&per_page=20`);
        const result = (await response.json().catch(() => null)) as PresetResponse | { error?: string } | null;

        if (!response.ok) {
            throw new Error((result as { error?: string } | null)?.error ?? 'Errore caricamento dettaglio preset.');
        }

        const payload = result as PresetResponse;
        setData((current) => {
            if (!append || !current) return payload;
            return {
                ...payload,
                current: {
                    ...payload.current,
                    items: [...current.current.items, ...payload.current.items],
                },
            };
        });
        setPage(payload.current.page);
    }, [presetId]);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            try {
                await load(1);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Caricamento non riuscito.');
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, [load]);

    const togglePreset = async (checked: boolean) => {
        if (!isPro || !data) return;

        const prev = data;
        const optimistic: PresetResponse = {
            ...data,
            preset: {
                ...data.preset,
                enabled: checked,
            },
        };

        setData(optimistic);
        setSaving(true);

        try {
            const response = await fetch('/api/profile/saved-search-alerts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriptions: [{
                        saved_search_id: presetId,
                        enabled: checked,
                    }],
                }),
            });

            const result = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) {
                throw new Error(result?.error ?? 'Aggiornamento preset non riuscito.');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Aggiornamento preset non riuscito.');
            setData(prev);
        } finally {
            setSaving(false);
        }
    };

    const loadMore = async () => {
        if (!data?.current.has_more || loadingMore) return;
        setLoadingMore(true);
        try {
            await load(page + 1, true);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Caricamento pagina successiva non riuscito.');
        } finally {
            setLoadingMore(false);
        }
    };

    const chips = useMemo(() => buildPresetChips(data?.preset.filters ?? EMPTY_FILTERS), [data?.preset.filters]);

    const grouped = useMemo(() => {
        const items = data?.current.items ?? [];
        return {
            newItems: items.filter((item) => item.bucket === 'new'),
            existingItems: items.filter((item) => item.bucket === 'existing'),
        };
    }, [data]);

    return (
        <div className="dashboard-shell">
            <div className="dashboard-shell-overlay" />
            <div className="relative space-y-6 px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
                <section className="dashboard-section-frame overflow-hidden p-5 sm:p-6 lg:p-7">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(14,47,80,0.14),transparent_35%)]" />
                    <div className="relative">
                        <Link href="/hub/alert" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0A4E88] hover:underline">
                            <ArrowLeft className="h-4 w-4" />
                            Torna agli avvisi
                        </Link>

                        {loading ? (
                            <p className="mt-4 text-sm text-slate-600">Caricamento filtro...</p>
                        ) : data ? (
                            <>
                                <h1 className="mt-4 [font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.7rem]">
                                    {data.preset.name}
                                </h1>
                                <p className="mt-2 text-sm text-slate-700">
                                    Salvato il {toDateLabel(data.preset.created_at)} • Risultati attuali: {data.current.total}
                                </p>
                                <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 w-fit">
                                    <Bell className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">Monitoraggio filtro</span>
                                    <Checkbox
                                        checked={data.preset.enabled}
                                        disabled={!isPro || saving}
                                        onCheckedChange={(checked) => togglePreset(Boolean(checked))}
                                    />
                                </div>
                            </>
                        ) : null}
                    </div>
                </section>

                {!isPro && (
                    <section className="dashboard-section-frame p-4 sm:p-5">
                        <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-amber-900">
                                        <Lock className="h-3.5 w-3.5" />
                                        Anteprima gratuita
                                    </p>
                                    <h2 className="mt-3 text-lg font-semibold text-slate-900">Mostriamo solo i primi {FREE_FEED_PREVIEW_LIMIT} risultati</h2>
                                </div>
                                <UpgradeProModal triggerClassName="inline-block">
                                    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                                        <Crown className="h-4 w-4" />
                                        Passa a Pro
                                    </span>
                                </UpgradeProModal>
                            </div>
                        </div>
                    </section>
                )}

                <section className="dashboard-section-frame p-4 sm:p-5">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">Filtri del preset</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {chips.map((chip) => (
                            <span
                                key={chip.label}
                                className={`rounded-md border px-2 py-1 text-xs font-medium ${chipToneClass(chip.tone)}`}
                            >
                                {chip.label}
                            </span>
                        ))}
                    </div>
                </section>

                <section className="dashboard-section-frame p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-900">Risultati del preset</h2>
                        <Button type="button" variant="outline" onClick={() => void load(1)} disabled={loading}>
                            <RefreshCcw className="h-4 w-4" />
                            Aggiorna
                        </Button>
                    </div>

                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
                        In questa pagina nuovi: <strong>{data?.segments.new_count ?? 0}</strong> • Esistenti: <strong>{data?.segments.existing_count ?? 0}</strong>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <p className="text-sm text-slate-600">Caricamento risultati...</p>
                        ) : (grouped.newItems.length === 0 && grouped.existingItems.length === 0) ? (
                            <p className="text-sm text-slate-600">Nessun risultato disponibile per questo preset.</p>
                        ) : (
                            <>
                                {grouped.existingItems.length > 0 && (
                                    <>
                                        <p className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-600">Risultati esistenti</p>
                                        {grouped.existingItems.map((item) => (
                                            item.concorso ? (
                                                <ConcorsoCard key={`${item.saved_search_id}:${item.concorso_id}`} concorso={item.concorso} detailBasePath="/hub/concorsi" />
                                            ) : null
                                        ))}
                                    </>
                                )}

                                {grouped.newItems.length > 0 && grouped.existingItems.length > 0 && (
                                    <div className="flex items-center gap-3 py-1">
                                        <div className="h-px flex-1 bg-slate-200" />
                                        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Nuovi arrivi</span>
                                        <div className="h-px flex-1 bg-slate-200" />
                                    </div>
                                )}

                                {grouped.newItems.length > 0 && (
                                    <>
                                        {grouped.newItems.length > 0 && grouped.existingItems.length === 0 && (
                                            <p className="text-xs font-semibold uppercase tracking-[0.11em] text-emerald-700">Nuovi arrivi</p>
                                        )}
                                        {grouped.newItems.map((item) => (
                                            item.concorso ? (
                                                <div key={`${item.saved_search_id}:${item.concorso_id}`} className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-1.5">
                                                    <ConcorsoCard concorso={item.concorso} detailBasePath="/hub/concorsi" />
                                                </div>
                                            ) : null
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {isPro && data?.current.has_more && (
                        <div className="mt-4 flex justify-center">
                            <Button type="button" variant="outline" onClick={() => void loadMore()} disabled={loadingMore}>
                                {loadingMore ? 'Caricamento...' : 'Carica altri'}
                            </Button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
