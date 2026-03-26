'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Bell,
    Crown,
    Lock,
    Mail,
    RefreshCcw,
    SlidersHorizontal,
    Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { UpgradeProModal } from '@/components/paywall/UpgradeProModal';
import { FREE_FEED_PREVIEW_LIMIT, type NormalizedSavedSearchFilters } from '@/lib/saved-search-alerts';
import type { UserTier } from '@/types/profile';

type AlertCenterProps = {
    tier: UserTier;
};

type SavedSearchSubscription = {
    saved_search_id: string;
    name: string;
    enabled: boolean;
    filters: NormalizedSavedSearchFilters;
    match_count: number;
    current_total_count: number;
    last_match_at: string | null;
};

type SettingsResponse = {
    enabled: boolean;
    is_pro: boolean;
    subscriptions: SavedSearchSubscription[];
};

type FeedResponse = {
    items: Array<{
        saved_search_id: string;
        concorso_id: string;
        first_seen_at: string;
        saved_search_name: string | null;
        concorso: {
            concorso_id: string;
            slug: string | null;
            titolo: string | null;
            ente_nome: string | null;
            data_pubblicazione: string | null;
            data_scadenza: string | null;
        } | null;
    }>;
    page: number;
    per_page: number;
    total: number;
    has_more: boolean;
    is_pro: boolean;
    locked_count: number;
};

type FilterChip = {
    label: string;
    tone: 'slate' | 'blue' | 'emerald' | 'amber';
};

function toDateLabel(value: string | null | undefined): string {
    if (!value) return 'N/D';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/D';
    return date.toLocaleDateString('it-IT');
}

function buildPresetChips(filters: NormalizedSavedSearchFilters): FilterChip[] {
    const chips: FilterChip[] = [];

    if (filters.query) chips.push({ label: `Query: ${filters.query}`, tone: 'blue' });
    filters.regioni.forEach((item) => chips.push({ label: item, tone: 'blue' }));
    filters.province.forEach((item) => chips.push({ label: item, tone: 'slate' }));
    filters.settori.forEach((item) => chips.push({ label: item, tone: 'emerald' }));
    if (filters.tipo_procedura) chips.push({ label: filters.tipo_procedura, tone: 'slate' });
    if (filters.ente_slug) chips.push({ label: `Ente: ${filters.ente_slug}`, tone: 'slate' });
    if (filters.stato) chips.push({ label: `Stato: ${filters.stato}`, tone: 'amber' });
    if (filters.sort) chips.push({ label: `Sort: ${filters.sort}`, tone: 'amber' });

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

export function SavedSearchAlertCenter({ tier }: AlertCenterProps) {
    const isPro = tier === 'pro' || tier === 'admin';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<SettingsResponse | null>(null);
    const [feed, setFeed] = useState<FeedResponse | null>(null);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    const loadSettings = useCallback(async () => {
        const response = await fetch('/api/profile/saved-search-alerts', { method: 'GET' });
        const result = (await response.json().catch(() => null)) as SettingsResponse | { error?: string } | null;

        if (!response.ok) {
            throw new Error((result as { error?: string } | null)?.error ?? 'Errore caricamento impostazioni alert.');
        }

        setSettings(result as SettingsResponse);
    }, []);

    const loadFeed = useCallback(async (nextPage: number, append = false) => {
        const response = await fetch(`/api/profile/saved-search-alerts/feed?page=${nextPage}&per_page=20`, { method: 'GET' });
        const result = (await response.json().catch(() => null)) as FeedResponse | { error?: string } | null;

        if (!response.ok) {
            throw new Error((result as { error?: string } | null)?.error ?? 'Errore caricamento feed alert.');
        }

        const payload = result as FeedResponse;
        setFeed((current) => {
            if (!append || !current) return payload;
            return {
                ...payload,
                items: [...current.items, ...payload.items],
            };
        });
        setPage(payload.page);
    }, []);

    const refreshAll = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([loadSettings(), loadFeed(1)]);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Caricamento alert non riuscito.');
        } finally {
            setLoading(false);
        }
    }, [loadFeed, loadSettings]);

    useEffect(() => {
        void refreshAll();
    }, [refreshAll]);

    const save = async (next: { enabled?: boolean; subscriptions?: Array<{ saved_search_id: string; enabled: boolean }> }) => {
        if (!isPro) return;
        setSaving(true);
        try {
            const response = await fetch('/api/profile/saved-search-alerts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(next),
            });

            const result = (await response.json().catch(() => null)) as SettingsResponse | { error?: string } | null;
            if (!response.ok) {
                throw new Error((result as { error?: string } | null)?.error ?? 'Salvataggio non riuscito.');
            }

            const payload = result as SettingsResponse;
            setSettings(payload);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Salvataggio alert non riuscito.');
        } finally {
            setSaving(false);
        }
    };

    const toggleGlobal = (checked: boolean) => {
        if (!settings) return;
        const optimistic = { ...settings, enabled: checked };
        setSettings(optimistic);
        void save({ enabled: checked });
    };

    const toggleSearch = (savedSearchId: string, checked: boolean) => {
        if (!settings) return;

        const optimistic: SettingsResponse = {
            ...settings,
            subscriptions: settings.subscriptions.map((sub) =>
                sub.saved_search_id === savedSearchId ? { ...sub, enabled: checked } : sub
            ),
        };

        setSettings(optimistic);
        void save({ subscriptions: [{ saved_search_id: savedSearchId, enabled: checked }] });
    };

    const loadMore = async () => {
        if (!feed?.has_more || loadingMore) return;
        setLoadingMore(true);
        try {
            await loadFeed(page + 1, true);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Caricamento pagina successiva fallito.');
        } finally {
            setLoadingMore(false);
        }
    };

    const activeSubscriptions = useMemo(
        () => settings?.subscriptions.filter((item) => item.enabled).length ?? 0,
        [settings]
    );

    const totalMatches = useMemo(
        () => settings?.subscriptions.reduce((sum, item) => sum + item.match_count, 0) ?? 0,
        [settings]
    );

    return (
        <div className="dashboard-shell">
            <div className="dashboard-shell-overlay" />
            <div className="relative space-y-6 px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
                <section className="dashboard-section-frame overflow-hidden p-5 sm:p-6 lg:p-7">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_5%_8%,rgba(14,47,80,0.16),transparent_34%),radial-gradient(circle_at_92%_18%,rgba(14,165,233,0.12),transparent_28%)]" />
                    <div className="relative grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
                        <div className="alert-stagger" style={{ ['--d' as string]: '0ms' }}>
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-slate-50/85 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-slate-700">
                                <Bell className="h-3.5 w-3.5" />
                                Alert Center
                            </span>
                            <h1 className="mt-4 [font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.8rem]">
                                Controlla i
                                <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                    preset attivi
                                </span>
                                e i nuovi match in un unico dashboard.
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
                                Ogni preset diventa una vista operativa: filtri chiari, stato digest, cronologia risultati e accesso rapido al dettaglio.
                            </p>
                        </div>

                        <aside className="alert-stagger rounded-2xl border border-slate-200/90 bg-white/90 p-4 sm:p-5" style={{ ['--d' as string]: '120ms' }}>
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Stato operativo</p>
                            <div className="mt-3 grid gap-2 text-sm">
                                <p className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                                    <span>Piano</span>
                                    <span className="font-semibold">{tier === 'admin' ? 'Admin' : tier === 'pro' ? 'Pro' : 'Free'}</span>
                                </p>
                                <p className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                                    <span>Preset attivi</span>
                                    <span className="font-semibold">{activeSubscriptions}</span>
                                </p>
                                <p className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                                    <span>Match tracciati</span>
                                    <span className="font-semibold">{totalMatches}</span>
                                </p>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => void refreshAll()}
                                    disabled={loading}
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Aggiorna
                                </Button>
                                <Button asChild variant="outline" className="flex-1">
                                    <Link href="/hub/concorsi">
                                        <Sparkles className="h-4 w-4" />
                                        Nuova ricerca
                                    </Link>
                                </Button>
                            </div>
                        </aside>
                    </div>
                </section>

                <section className="dashboard-section-frame p-4 sm:p-5 alert-stagger" style={{ ['--d' as string]: '180ms' }}>
                    {!isPro && (
                        <div className="mb-4 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-amber-900">
                                        <Lock className="h-3.5 w-3.5" />
                                        Preview Free
                                    </p>
                                    <h2 className="mt-3 text-lg font-semibold text-slate-900">Vedi i primi 5 match, sblocca il feed completo con Pro</h2>
                                    <p className="mt-1 text-sm text-slate-700">
                                        Free: email con 1 annuncio e “+N altri concorsi”. Pro: digest completo e gestione avanzata preset.
                                    </p>
                                </div>
                                <UpgradeProModal triggerClassName="inline-block">
                                    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                                        <Crown className="h-4 w-4" />
                                        Passa a Pro
                                    </span>
                                </UpgradeProModal>
                            </div>
                        </div>
                    )}

                    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Digest</p>
                                <h3 className="mt-1 text-lg font-semibold text-slate-900">Invio giornaliero via email</h3>
                                <p className="mt-1 text-sm text-slate-600">Un evento per utente, con i risultati piu rilevanti dei preset monitorati.</p>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                <Mail className="h-4 w-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">Digest attivo</span>
                                <Checkbox
                                    checked={Boolean(settings?.enabled)}
                                    disabled={!isPro || saving || loading || !settings}
                                    onCheckedChange={(checked) => toggleGlobal(Boolean(checked))}
                                />
                            </div>
                        </div>
                    </article>
                </section>

                <section className="dashboard-section-frame p-4 sm:p-5 alert-stagger" style={{ ['--d' as string]: '260ms' }}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Preset monitorati</h2>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            {settings?.subscriptions.length ?? 0} preset
                        </span>
                    </div>

                    {settings?.subscriptions?.length ? (
                        <div className="grid gap-3 lg:grid-cols-2">
                            {settings.subscriptions.map((item, index) => {
                                const chips = buildPresetChips(item.filters);

                                return (
                                    <article
                                        key={item.saved_search_id}
                                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                                        style={{ animationDelay: `${80 + index * 40}ms` }}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-base font-semibold text-slate-900">{item.name || 'Preset senza nome'}</h3>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Ultimo risultato: {toDateLabel(item.last_match_at)} • Totale: {item.current_total_count}
                                                </p>
                                            </div>
                                            <Checkbox
                                                checked={item.enabled}
                                                disabled={!isPro || saving || loading}
                                                onCheckedChange={(checked) => toggleSearch(item.saved_search_id, Boolean(checked))}
                                            />
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {chips.slice(0, 8).map((chip) => (
                                                <span
                                                    key={`${item.saved_search_id}-${chip.label}`}
                                                    className={`rounded-md border px-2 py-1 text-xs font-medium ${chipToneClass(chip.tone)}`}
                                                >
                                                    {chip.label}
                                                </span>
                                            ))}
                                            {chips.length > 8 && (
                                                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                                                    +{chips.length - 8} filtri
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                                                {item.enabled ? 'Tracking attivo' : 'Tracking sospeso'}
                                            </span>
                                            <Link
                                                href={`/hub/alert/preset/${item.saved_search_id}`}
                                                className="inline-flex items-center gap-1 text-sm font-semibold text-[#0A4E88] hover:underline"
                                            >
                                                Vedi dettaglio
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-10 text-center">
                            <h3 className="text-base font-semibold text-slate-900">Nessun preset monitorato</h3>
                            <p className="mt-1 text-sm text-slate-600">Salva una ricerca da concorsi per attivare il monitoraggio alert.</p>
                            <Button asChild className="mt-4">
                                <Link href="/hub/concorsi">Apri concorsi</Link>
                            </Button>
                        </div>
                    )}
                </section>

                <section className="dashboard-section-frame p-4 sm:p-5 alert-stagger" style={{ ['--d' as string]: '320ms' }}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-900">Ultime corrispondenze</h2>
                        <p className="text-sm text-slate-500">
                            {feed?.total ?? 0} totali
                            {!isPro && ` • preview ${FREE_FEED_PREVIEW_LIMIT}`}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <p className="text-sm text-slate-600">Caricamento alert...</p>
                        ) : feed?.items?.length ? feed.items.map((item) => {
                            const concorso = item.concorso;
                            const href = concorso?.slug ? `/hub/concorsi/${concorso.slug}` : '/hub/concorsi';

                            return (
                                <article key={`${item.saved_search_id}:${item.concorso_id}`} className="rounded-xl border border-slate-200 bg-white p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                                        {item.saved_search_name ?? 'Preset'}
                                    </p>
                                    <h3 className="mt-2 text-base font-semibold text-slate-900">{concorso?.titolo ?? 'Concorso'}</h3>
                                    <p className="mt-1 text-sm text-slate-600">{concorso?.ente_nome ?? 'Ente non disponibile'}</p>
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                        <span>Pubblicato: {toDateLabel(concorso?.data_pubblicazione)}</span>
                                        <Link href={href} className="font-semibold text-[#0A4E88] hover:underline">
                                            Apri annuncio
                                        </Link>
                                    </div>
                                </article>
                            );
                        }) : (
                            <p className="text-sm text-slate-600">Nessuna nuova corrispondenza al momento.</p>
                        )}
                    </div>

                    {isPro && feed?.has_more && (
                        <div className="mt-4 flex justify-center">
                            <Button type="button" variant="outline" onClick={() => void loadMore()} disabled={loadingMore}>
                                {loadingMore ? 'Caricamento...' : 'Carica altri'}
                            </Button>
                        </div>
                    )}

                    {!isPro && (feed?.locked_count ?? 0) > 0 && (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900">
                            +{feed?.locked_count} altri concorsi disponibili con Pro.
                        </div>
                    )}
                </section>
            </div>

            <style jsx>{`
                .alert-stagger {
                    opacity: 0;
                    transform: translateY(8px);
                    animation: alert-fade-up 440ms ease-out forwards;
                    animation-delay: var(--d, 0ms);
                }

                @keyframes alert-fade-up {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
