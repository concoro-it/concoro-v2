'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    Briefcase,
    Check,
    ChevronRight,
    Clock3,
    Mail,
    MapPin,
    Sparkles,
    Target,
    User,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAllRegioni } from '@/lib/utils/regioni';
import type { Profile, ProfileFormValues } from '@/types/profile';
import { mapProfileToFormValues } from '@/types/profile';

interface ProfileSettingsProps {
    user: {
        id: string;
        email?: string | null;
    };
    profile: Profile | null;
}

interface Option {
    label: string;
    value: string;
}

const SUGGESTED_SETTORI = [
    'Amministrativo',
    'Sanitario',
    'IT e Digitale',
    'Istruzione',
    'Forze dell\'ordine',
    'Tecnico',
    'Giuridico',
    'Finanza e Contabilita',
] as const;

const OBIETTIVI_CONCORSO = [
    'Entrare nella PA entro 6 mesi',
    'Preparare il prossimo concorso compatibile',
    'Cambio settore professionale',
    'Migliorare inquadramento e stabilita',
    'Valutare opportunita locali',
] as const;

function parseSettoriInput(raw: string): string[] {
    return raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function toSettoriInput(settori: string[]): string {
    return settori.join(', ');
}

export function ProfileSettings({ user, profile }: ProfileSettingsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingProvince, setIsLoadingProvince] = useState(false);
    const [provinceOptions, setProvinceOptions] = useState<Option[]>([]);
    const [formData, setFormData] = useState<ProfileFormValues>(() => mapProfileToFormValues(profile));

    const regionOptions = useMemo(() => getAllRegioni().sort((a, b) => a.localeCompare(b, 'it')), []);

    const selectedSettori = useMemo(() => parseSettoriInput(formData.settori_interesse), [formData.settori_interesse]);

    const fullNamePreview = useMemo(() => {
        const name = [formData.first_name.trim(), formData.last_name.trim()].filter(Boolean).join(' ');
        return name || profile?.full_name || 'Profilo utente';
    }, [formData.first_name, formData.last_name, profile?.full_name]);

    const completionItems = useMemo(
        () => [
            { label: 'Nome e cognome', done: Boolean(formData.first_name.trim() && formData.last_name.trim()) },
            { label: 'Regione di interesse', done: Boolean(formData.regione_interesse.trim()) },
            { label: 'Provincia o sede preferita', done: Boolean(formData.provincia_interesse.trim() || formData.sede_preferita.trim()) },
            { label: 'Profilo professionale', done: Boolean(formData.profilo_professionale.trim()) },
            { label: 'Settori prioritari', done: selectedSettori.length > 0 },
            { label: 'Obiettivo concorso', done: Boolean(formData.obiettivo_concorso.trim()) },
        ],
        [
            formData.first_name,
            formData.last_name,
            formData.regione_interesse,
            formData.provincia_interesse,
            formData.sede_preferita,
            formData.profilo_professionale,
            formData.obiettivo_concorso,
            selectedSettori.length,
        ]
    );

    const completionRate = Math.round((completionItems.filter((item) => item.done).length / completionItems.length) * 100);

    useEffect(() => {
        if (!formData.regione_interesse.trim()) {
            setProvinceOptions([]);
            return;
        }

        const controller = new AbortController();

        const loadProvince = async () => {
            setIsLoadingProvince(true);
            try {
                const params = new URLSearchParams({ regione: formData.regione_interesse });
                const response = await fetch(`/api/concorsi/province?${params.toString()}`, {
                    signal: controller.signal,
                });
                const payload = (await response.json()) as { data?: Option[]; error?: string };

                if (!response.ok) {
                    throw new Error(payload.error || 'Errore durante il caricamento province');
                }

                const options = payload.data ?? [];
                if (
                    formData.provincia_interesse &&
                    !options.some((option) => option.value === formData.provincia_interesse)
                ) {
                    options.unshift({
                        value: formData.provincia_interesse,
                        label: `${formData.provincia_interesse} (profilo)`,
                    });
                }
                setProvinceOptions(options);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('[profile] province load failed', error);
                setProvinceOptions([]);
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingProvince(false);
                }
            }
        };

        void loadProvince();
        return () => controller.abort();
    }, [formData.regione_interesse, formData.provincia_interesse]);

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = event.target;
        setFormData((prev) => {
            if (name === 'regione_interesse') {
                return {
                    ...prev,
                    regione_interesse: value,
                    provincia_interesse: '',
                };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleToggleChange = (
        name: 'remote_preferito' | 'notification_email' | 'disponibilita_mobilita',
        checked: boolean
    ) => {
        setFormData((prev) => ({ ...prev, [name]: checked }));
    };

    const handleSettoreToggle = (settore: string) => {
        setFormData((prev) => {
            const current = new Set(parseSettoriInput(prev.settori_interesse));
            if (current.has(settore)) {
                current.delete(settore);
            } else {
                current.add(settore);
            }

            return {
                ...prev,
                settori_interesse: toSettoriInput(Array.from(current)),
            };
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData }),
            });
            const payload = (await response.json()) as { error?: string; details?: string | null };

            if (!response.ok) {
                throw new Error(payload.details || payload.error || 'Errore durante il salvataggio');
            }

            toast.success('Profilo aggiornato con successo');
            router.refresh();
        } catch (error) {
            console.error('Error updating profile:', error);
            const message = error instanceof Error
                ? error.message
                : 'Si e verificato un errore durante il salvataggio del profilo';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="dashboard-shell">
            <div className="dashboard-shell-overlay" />

            <div className="relative mx-auto max-w-[78rem] px-4 py-8 sm:px-6 sm:py-10">
                <section className="mb-6 grid gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/82 p-5 backdrop-blur-sm sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6 lg:p-7">
                    <div className="space-y-4">
                        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Link href="/hub/bacheca" className="hover:text-slate-900">
                                Dashboard
                            </Link>
                            <ChevronRight className="h-4 w-4" />
                            <span className="text-slate-900">Profilo</span>
                        </nav>

                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-slate-50/90 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-slate-700">
                            <Sparkles className="h-3.5 w-3.5" />
                            Profilo strategico Concoro
                        </span>

                        <div className="space-y-2">
                            <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.8rem]">
                                Ottimizza il profilo per ricevere
                                <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                    suggerimenti piu rilevanti
                                </span>
                                sui bandi.
                            </h1>
                            <p className="max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
                                Ogni campo che completi migliora matching, filtri consigliati e priorita dei concorsi nel tuo hub.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/75 p-4 sm:p-5">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Identita profilo</p>
                        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{fullNamePreview}</h2>
                        <p className="mt-1 text-sm text-slate-600">{user.email ?? 'Email non disponibile'}</p>

                        <div className="mt-4 space-y-2">
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#1272c5] transition-all duration-500"
                                    style={{ width: `${completionRate}%` }}
                                />
                            </div>
                            <p className="text-xs font-medium text-slate-600">Profilo completato al {completionRate}%</p>
                        </div>
                    </div>
                </section>

                <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
                    <div className="space-y-5">
                        <section className="dashboard-section-frame p-5 sm:p-6">
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Sezione 1</p>
                                    <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Identita e background</h3>
                                </div>
                                <User className="h-5 w-5 text-[#0A4E88]" />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="space-y-1.5 text-sm">
                                    <span className="font-medium text-slate-700">Nome</span>
                                    <input
                                        id="first_name"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        placeholder="Es. Giulia"
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
                                    />
                                </label>

                                <label className="space-y-1.5 text-sm">
                                    <span className="font-medium text-slate-700">Cognome</span>
                                    <input
                                        id="last_name"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        placeholder="Es. Bianchi"
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
                                    />
                                </label>
                            </div>

                            <label className="mt-4 block space-y-1.5 text-sm">
                                <span className="font-medium text-slate-700">Email account</span>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        value={user.email ?? ''}
                                        disabled
                                        className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-9 pr-3 text-sm text-slate-600"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">L\'email di login viene gestita da autenticazione account.</p>
                            </label>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <label className="space-y-1.5 text-sm">
                                    <span className="font-medium text-slate-700">Titolo di studio</span>
                                    <input
                                        id="titolo_studio"
                                        name="titolo_studio"
                                        value={formData.titolo_studio}
                                        onChange={handleChange}
                                        placeholder="Es. Laurea magistrale"
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
                                    />
                                </label>

                                <label className="space-y-1.5 text-sm">
                                    <span className="font-medium text-slate-700">Anni di esperienza</span>
                                    <input
                                        id="anni_esperienza"
                                        name="anni_esperienza"
                                        type="number"
                                        min={0}
                                        value={formData.anni_esperienza}
                                        onChange={handleChange}
                                        placeholder="Es. 4"
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
                                    />
                                </label>
                            </div>
                        </section>

                        <section className="dashboard-section-frame p-5 sm:p-6">
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Sezione 2</p>
                                    <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Target concorso e posizionamento</h3>
                                </div>
                                <Target className="h-5 w-5 text-[#0A4E88]" />
                            </div>

                            <label className="space-y-1.5 text-sm">
                                <span className="font-medium text-slate-700">Obiettivo principale</span>
                                <select
                                    id="obiettivo_concorso"
                                    name="obiettivo_concorso"
                                    value={formData.obiettivo_concorso}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
                                >
                                    <option value="">Seleziona obiettivo</option>
                                    {OBIETTIVI_CONCORSO.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="mt-4 block space-y-1.5 text-sm">
                                <span className="font-medium text-slate-700">Profilo professionale</span>
                                <textarea
                                    id="profilo_professionale"
                                    name="profilo_professionale"
                                    value={formData.profilo_professionale}
                                    onChange={handleChange}
                                    placeholder="Descrivi ruolo attuale, competenze forti e tipo di concorso su cui vuoi puntare."
                                    rows={5}
                                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
                                />
                            </label>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <label className="space-y-1.5 text-sm">
                                    <span className="font-medium text-slate-700">Tempo studio settimanale (ore)</span>
                                    <input
                                        id="tempo_studio_settimanale"
                                        name="tempo_studio_settimanale"
                                        type="number"
                                        min={0}
                                        value={formData.tempo_studio_settimanale}
                                        onChange={handleChange}
                                        placeholder="Es. 8"
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
                                    />
                                </label>

                                <label className="space-y-1.5 text-sm">
                                    <span className="font-medium text-slate-700">Sede preferita</span>
                                    <input
                                        id="sede_preferita"
                                        name="sede_preferita"
                                        value={formData.sede_preferita}
                                        onChange={handleChange}
                                        placeholder="Es. Milano, Roma o remoto"
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
                                    />
                                </label>
                            </div>
                        </section>

                        <section className="dashboard-section-frame p-5 sm:p-6">
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Sezione 3</p>
                                    <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Area geografica e settori</h3>
                                </div>
                                <MapPin className="h-5 w-5 text-[#0A4E88]" />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="space-y-1.5 text-sm">
                                    <span className="font-medium text-slate-700">Regione prioritaria</span>
                                    <select
                                        id="regione_interesse"
                                        name="regione_interesse"
                                        value={formData.regione_interesse}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
                                    >
                                        <option value="">Tutte le regioni</option>
                                        {regionOptions.map((regione) => (
                                            <option key={regione} value={regione}>
                                                {regione}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-1.5 text-sm">
                                    <span className="font-medium text-slate-700">Provincia prioritaria</span>
                                    <select
                                        id="provincia_interesse"
                                        name="provincia_interesse"
                                        value={formData.provincia_interesse}
                                        onChange={handleChange}
                                        disabled={!formData.regione_interesse || isLoadingProvince}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
                                    >
                                        <option value="">{isLoadingProvince ? 'Caricamento province...' : 'Tutte le province'}</option>
                                        {provinceOptions.map((province) => (
                                            <option key={province.value} value={province.value}>
                                                {province.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-medium text-slate-700">Settori di interesse</p>
                                <div className="flex flex-wrap gap-2">
                                    {SUGGESTED_SETTORI.map((settore) => {
                                        const isActive = selectedSettori.includes(settore);
                                        return (
                                            <button
                                                key={settore}
                                                type="button"
                                                onClick={() => handleSettoreToggle(settore)}
                                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                                    isActive
                                                        ? 'border-[#0A4E88]/35 bg-[#0A4E88]/12 text-[#083861]'
                                                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                                                }`}
                                            >
                                                {settore}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <label className="mt-4 block space-y-1.5 text-sm">
                                <span className="font-medium text-slate-700">Altri settori (separati da virgola)</span>
                                <input
                                    id="settori_interesse"
                                    name="settori_interesse"
                                    value={formData.settori_interesse}
                                    onChange={handleChange}
                                    placeholder="Es. Urbanistica, Cultura, Ambiente"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
                                />
                            </label>
                        </section>
                    </div>

                    <aside className="space-y-4 lg:sticky lg:top-6">
                        <article className="dashboard-section-frame p-5 sm:p-6">
                            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Stato profilo</p>
                            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Checklist completamento</h3>

                            <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                                {completionItems.map((item) => (
                                    <li key={item.label} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                        <span
                                            className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                                                item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                                            }`}
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                        </span>
                                        <span>{item.label}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-sm text-slate-700">
                                <label className="flex items-start gap-2.5">
                                    <input
                                        type="checkbox"
                                        checked={formData.remote_preferito}
                                        onChange={(event) => handleToggleChange('remote_preferito', event.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-400 text-[#0A4E88] focus:ring-[#0A4E88]/25"
                                    />
                                    Preferisco posizioni remote quando disponibili
                                </label>

                                <label className="flex items-start gap-2.5">
                                    <input
                                        type="checkbox"
                                        checked={formData.notification_email}
                                        onChange={(event) => handleToggleChange('notification_email', event.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-400 text-[#0A4E88] focus:ring-[#0A4E88]/25"
                                    />
                                    Ricevo notifiche email su bandi e aggiornamenti
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isLoading ? 'Salvataggio in corso...' : 'Salva profilo'}
                                {!isLoading && <ArrowRight className="h-4 w-4" />}
                            </button>
                        </article>

                        <article className="rounded-[1.45rem] border border-[#0A4E88]/20 bg-[linear-gradient(155deg,#f6fbff_0%,#e6f1ff_100%)] p-5 shadow-[0_18px_38px_-30px_rgba(10,78,136,0.45)] sm:p-6">
                            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.11em] text-[#0A4E88]">Consiglio operativo</p>
                            <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">Massimizza il matching</h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-700">
                                Aggiorna almeno regione, obiettivo e profilo professionale: sono i segnali piu utili per ranking e suggerimenti nell\'hub.
                            </p>
                            <div className="mt-4 space-y-2 text-sm text-slate-700">
                                <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#0A4E88]" /> Tempo medio aggiornamento: 2 minuti</p>
                                <Link href="/hub/concorsi" className="inline-flex items-center gap-1 font-semibold text-[#0A4E88] hover:text-[#083861]">
                                    Vai ai concorsi
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </article>

                        <article className="dashboard-section-frame p-5">
                            <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.11em] text-slate-500">
                                <Briefcase className="h-4 w-4 text-[#0A4E88]" />
                                Collegamenti utili
                            </h4>
                            <div className="mt-3 space-y-2.5 text-sm">
                                <Link
                                    href="/hub/matching"
                                    className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-medium text-slate-700 transition hover:border-slate-400"
                                >
                                    Matching intelligente
                                    <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
                                </Link>
                                <Link
                                    href="/hub/salvati"
                                    className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-medium text-slate-700 transition hover:border-slate-400"
                                >
                                    Bandi salvati
                                    <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
                                </Link>
                            </div>
                        </article>
                    </aside>
                </form>
            </div>
        </div>
    );
}
