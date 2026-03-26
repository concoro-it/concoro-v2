'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Crown, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { UpgradeProModal } from '@/components/paywall/UpgradeProModal';
import type { UserTier } from '@/types/profile';

type AlertSettingsPanelProps = {
    tier: UserTier;
};

type AlertsResponse = {
    deadline_enabled: boolean;
    deadline_offsets: number[];
    is_pro: boolean;
};

const OFFSET_OPTIONS = [7, 3, 1] as const;

export function AlertSettingsPanel({ tier }: AlertSettingsPanelProps) {
    const isPro = tier === 'pro' || tier === 'admin';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deadlineEnabled, setDeadlineEnabled] = useState(true);
    const [deadlineOffsets, setDeadlineOffsets] = useState<number[]>([7, 3, 1]);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/profile/alerts', { method: 'GET' });
            const result = (await response.json().catch(() => null)) as AlertsResponse | { error?: string } | null;

            if (!response.ok) {
                throw new Error((result as { error?: string } | null)?.error ?? 'Errore durante il caricamento alert');
            }

            const payload = result as AlertsResponse;
            setDeadlineEnabled(Boolean(payload.deadline_enabled));
            setDeadlineOffsets(Array.isArray(payload.deadline_offsets) ? payload.deadline_offsets : [1]);
        } catch (error) {
            console.error('Error loading alert settings:', error);
            toast.error(error instanceof Error ? error.message : 'Caricamento alert non riuscito.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadSettings();
    }, [loadSettings]);

    const toggleOffset = (offset: number, checked: boolean) => {
        setDeadlineOffsets((current) => {
            if (checked) {
                if (current.includes(offset)) return current;
                const next = [...current, offset];
                return OFFSET_OPTIONS.filter((item) => next.includes(item));
            }
            return current.filter((value) => value !== offset);
        });
    };

    const canSave = useMemo(
        () => !saving && !loading && (!deadlineEnabled || deadlineOffsets.length > 0),
        [saving, loading, deadlineEnabled, deadlineOffsets.length]
    );

    const handleSave = async () => {
        if (!canSave || !isPro) return;
        setSaving(true);
        try {
            const response = await fetch('/api/profile/alerts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deadline_enabled: deadlineEnabled,
                    deadline_offsets: deadlineOffsets,
                }),
            });

            const result = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) {
                throw new Error(result?.error ?? 'Salvataggio alert non riuscito.');
            }

            toast.success('Preferenze alert salvate.');
        } catch (error) {
            console.error('Error saving alert settings:', error);
            toast.error(error instanceof Error ? error.message : 'Salvataggio alert non riuscito.');
        } finally {
            setSaving(false);
        }
    };

    if (!isPro) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-5 sm:p-6">
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-300/30 blur-2xl" />
                <div className="relative max-w-2xl space-y-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-amber-900">
                        <Lock className="h-3.5 w-3.5" />
                        Solo Pro
                    </span>
                    <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                        Alert avanzati disponibili solo con Pro.
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
                        Free plan: solo promemoria 1 giorno prima (automatico).
                        Con Pro scegli 7/3/1 giorni e gestisci i reminder dal tuo hub.
                    </p>
                    <UpgradeProModal triggerClassName="inline-block">
                        <span className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                            <Crown className="h-4 w-4" />
                            Sblocca Pro
                        </span>
                    </UpgradeProModal>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-600">
                            <Bell className="h-3.5 w-3.5" />
                            Deadline Alerts
                        </p>
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">Promemoria scadenze concorsi salvati</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Seleziona quando ricevere i reminder per i concorsi salvati.
                        </p>
                    </div>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="deadline_enabled"
                            checked={deadlineEnabled}
                            disabled={loading || saving}
                            onCheckedChange={(checked) => setDeadlineEnabled(Boolean(checked))}
                        />
                        <label htmlFor="deadline_enabled" className="text-sm font-semibold text-slate-800">
                            Attiva deadline alerts
                        </label>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {OFFSET_OPTIONS.map((offset) => {
                            const checked = deadlineOffsets.includes(offset);
                            return (
                                <label
                                    key={offset}
                                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                                        deadlineEnabled ? 'border-slate-200 bg-white text-slate-800' : 'border-slate-200 bg-slate-100 text-slate-400'
                                    }`}
                                >
                                    <Checkbox
                                        checked={checked}
                                        disabled={!deadlineEnabled || loading || saving}
                                        onCheckedChange={(value) => toggleOffset(offset, Boolean(value))}
                                    />
                                    <span>{offset} giorni prima</span>
                                </label>
                            );
                        })}
                    </div>

                    {deadlineEnabled && deadlineOffsets.length === 0 && (
                        <p className="mt-3 text-xs font-semibold text-rose-700">
                            Seleziona almeno un promemoria.
                        </p>
                    )}
                </div>

                <div className="mt-4 flex justify-end">
                    <Button onClick={handleSave} disabled={!canSave}>
                        {saving ? 'Salvataggio...' : 'Salva preferenze'}
                    </Button>
                </div>
            </article>
        </div>
    );
}
