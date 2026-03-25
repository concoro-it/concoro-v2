'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { Profile, UserTier } from '@/types/profile';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UpgradeModal } from '@/components/paywall/UpgradeModal';
import { UpgradeProModal } from '@/components/paywall/UpgradeProModal';

type Option = { label: string; value: string };
type SectionKey = 'basic' | 'company';
type DatePostedPreset = 'any' | '24h' | '3d' | '7d' | '30d';

interface PreferencesControlProps {
    tier: UserTier;
    userId?: string | null;
    isPublicPage?: boolean;
    profileDefaults?: Partial<Profile> | null;
    regioni: Option[];
    settori: Option[];
}

interface PreferencesState {
    regione: string;
    provincia: string;
    settore: string;
    tipo_procedura: string;
    stato: 'aperti' | 'scaduti';
    sort: 'scadenza' | 'recenti' | 'posti';
    ente_slug: string;
    date_posted: DatePostedPreset;
}

const SENTINEL = '__any__';
const PRO_TIERS: UserTier[] = ['pro', 'admin'];
const ENTI_PAGE_SIZE = 10;
const SECTION_ITEMS: Array<{ key: SectionKey; short: string; title: string; description: string }> = [
    {
        key: 'basic',
        short: 'Base',
        title: 'Criteri Base',
        description: 'Territorio, settore, tipologia e ordinamento',
    },
    {
        key: 'company',
        short: 'Ente',
        title: 'Ente',
        description: 'Ricerca diretta ente (senza passaggi intermedi)',
    },
];

function inferDatePreset(value: string | null): DatePostedPreset {
    if (!value) return 'any';
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return 'any';

    const diffHours = (Date.now() - parsed) / (1000 * 60 * 60);
    if (diffHours <= 24) return '24h';
    if (diffHours <= 72) return '3d';
    if (diffHours <= 24 * 7) return '7d';
    if (diffHours <= 24 * 30) return '30d';
    return 'any';
}

function datePresetToIso(preset: DatePostedPreset): string | null {
    const now = Date.now();
    switch (preset) {
        case '24h':
            return new Date(now - 24 * 60 * 60 * 1000).toISOString();
        case '3d':
            return new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
        case '7d':
            return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
        case '30d':
            return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
        default:
            return null;
    }
}

function buildInitialState(searchParams: URLSearchParams, defaults?: Partial<Profile> | null): PreferencesState {
    return {
        regione: searchParams.get('regione') ?? defaults?.regione_interesse ?? '',
        provincia: searchParams.get('provincia') ?? defaults?.provincia_interesse ?? '',
        settore: searchParams.get('settore') ?? '',
        tipo_procedura: searchParams.get('tipo_procedura') ?? '',
        stato: (searchParams.get('stato') as PreferencesState['stato']) ?? 'aperti',
        sort: (searchParams.get('sort') as PreferencesState['sort']) ?? 'scadenza',
        ente_slug: searchParams.get('ente_slug') ?? '',
        date_posted: inferDatePreset(searchParams.get('published_from')),
    };
}

export function PreferencesControl({
    tier,
    userId,
    isPublicPage = false,
    profileDefaults,
    regioni,
    settori,
}: PreferencesControlProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [open, setOpen] = useState(false);
    const [isSavingDefaults, setIsSavingDefaults] = useState(false);
    const [isSavingPreset, setIsSavingPreset] = useState(false);
    const [showUpgradeProModal, setShowUpgradeProModal] = useState(false);
    const [section, setSection] = useState<SectionKey>('basic');
    const [enteQuery, setEnteQuery] = useState('');
    const [enteResults, setEnteResults] = useState<Option[]>([]);
    const [enteOffset, setEnteOffset] = useState(0);
    const [enteHasMore, setEnteHasMore] = useState(false);
    const [isLoadingEnti, setIsLoadingEnti] = useState(false);
    const [provinceOptions, setProvinceOptions] = useState<Option[]>([]);
    const [isLoadingProvince, setIsLoadingProvince] = useState(false);

    const searchParamsString = searchParams.toString();
    const initialState = useMemo(
        () => buildInitialState(new URLSearchParams(searchParamsString), profileDefaults),
        [searchParamsString, profileDefaults]
    );
    const [state, setState] = useState<PreferencesState>(initialState);

    useEffect(() => {
        if (open) {
            setState(initialState);
        }
    }, [open, initialState]);

    const loadEnti = async (query: string, offset = 0, append = false) => {
        setIsLoadingEnti(true);
        try {
            const params = new URLSearchParams({
                query,
                offset: String(offset),
                limit: String(ENTI_PAGE_SIZE),
            });
            const response = await fetch(`/api/enti/search?${params.toString()}`);
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error ?? 'Errore caricamento enti');
            }

            const nextItems = (result?.data ?? []) as Option[];
            setEnteResults((prev) => (append ? [...prev, ...nextItems] : nextItems));
            setEnteOffset(result?.nextOffset ?? nextItems.length);
            setEnteHasMore(Boolean(result?.hasMore));
        } catch (error) {
            console.error('Errore caricamento enti', error);
            if (!append) setEnteResults([]);
            setEnteHasMore(false);
        } finally {
            setIsLoadingEnti(false);
        }
    };

    useEffect(() => {
        if (!open || section !== 'company') return;
        const trimmedQuery = enteQuery.trim();
        const timeout = setTimeout(() => {
            if (trimmedQuery.length >= 3) {
                void loadEnti(trimmedQuery, 0, false);
                return;
            }

            // Avoid hitting the API for short/empty input and reset stale results.
            setEnteResults([]);
            setEnteOffset(0);
            setEnteHasMore(false);
        }, 250);

        return () => clearTimeout(timeout);
    }, [open, section, enteQuery]);

    useEffect(() => {
        if (!open || section !== 'basic' || !state.regione) {
            setProvinceOptions([]);
            return;
        }

        let isMounted = true;
        const loadProvince = async () => {
            setIsLoadingProvince(true);
            try {
                const params = new URLSearchParams({ regione: state.regione });
                const response = await fetch(`/api/concorsi/province?${params.toString()}`);
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result?.error ?? 'Errore caricamento province');
                }
                if (isMounted) {
                    setProvinceOptions((result?.data ?? []) as Option[]);
                }
            } catch (error) {
                console.error('Errore caricamento province', error);
                if (isMounted) {
                    setProvinceOptions([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingProvince(false);
                }
            }
        };

        void loadProvince();
        return () => {
            isMounted = false;
        };
    }, [open, section, state.regione]);

    const isPaywalledPublic = isPublicPage && (tier === 'anon' || tier === 'free');
    const canSavePreset = PRO_TIERS.includes(tier);
    const genioHref = isPublicPage ? '/chat' : '/hub/genio';

    const setField = <K extends keyof PreferencesState>(key: K, value: PreferencesState[K]) => {
        setState((prev) => ({ ...prev, [key]: value }));
    };

    const setRegione = (value: string) => {
        setState((prev) => ({
            ...prev,
            regione: value,
            provincia: '',
        }));
    };

    const applyFilters = () => {
        const params = new URLSearchParams(searchParamsString);

        const setOrDelete = (key: string, value?: string) => {
            const trimmed = value?.trim();
            if (trimmed) {
                params.set(key, trimmed);
            } else {
                params.delete(key);
            }
        };

        // If a specific ente is selected, keep the flow deterministic by avoiding location conflicts.
        const hasEnteFilter = state.ente_slug.trim().length > 0;

        if (hasEnteFilter) {
            params.delete('regione');
            params.delete('provincia');
        } else {
            setOrDelete('regione', state.regione);
            if (state.regione) {
                setOrDelete('provincia', state.provincia);
            } else {
                params.delete('provincia');
            }
        }

        setOrDelete('settore', state.settore);
        setOrDelete('tipo_procedura', state.tipo_procedura);
        setOrDelete('ente_slug', state.ente_slug);
        params.delete('titolo_studio');
        params.delete('anni_esperienza');
        params.delete('settori_interesse');
        params.delete('remote');
        params.set('stato', state.stato);
        params.set('sort', state.sort);

        const publishedFrom = datePresetToIso(state.date_posted);
        setOrDelete('published_from', publishedFrom ?? undefined);
        params.delete('published_to');
        params.delete('page');

        router.push(`${pathname}?${params.toString()}`);
        setOpen(false);
    };

    const saveDefaults = async () => {
        if (!userId) {
            toast.error("Per salvare le preferenze devi effettuare l'accesso.");
            return;
        }

        setIsSavingDefaults(true);
        try {
            const payload = {
                regione_interesse: state.regione || null,
                provincia_interesse: state.provincia || null,
                settori_interesse: state.settore ? [state.settore] : null,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .update(payload)
                .eq('id', userId);

            if (error) throw error;
            toast.success('Preferenze predefinite salvate.');
            router.refresh();
        } catch (error) {
            console.error('Error saving defaults', error);
            toast.error('Salvataggio preferenze non riuscito.');
        } finally {
            setIsSavingDefaults(false);
        }
    };

    const savePreset = async () => {
        if (!userId) {
            toast.error("Per salvare un preset devi effettuare l'accesso.");
            return;
        }

        if (!canSavePreset) {
            toast.error('Il salvataggio preset è disponibile solo su Pro.');
            return;
        }

        setIsSavingPreset(true);
        try {
            const presetNameParts = [state.regione, state.provincia, state.settore].filter(Boolean);
            const name = presetNameParts.length > 0 ? `Preset ${presetNameParts.join(' • ')}` : 'Preset preferenze';
            const publishedFrom = datePresetToIso(state.date_posted);
            const query = searchParams.get('q') ?? '';

            const filters = {
                query: query || undefined,
                regioni: state.regione ? [state.regione] : [],
                province: state.provincia ? [state.provincia] : [],
                settori: state.settore ? [state.settore] : [],
                tipo_procedura: state.tipo_procedura || undefined,
                ente_slug: state.ente_slug || undefined,
                stato: state.stato,
                sort: state.sort,
                published_from: publishedFrom || undefined,
            };
            const response = await fetch('/api/profile/save-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, query, filters }),
            });

            const result = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(result?.error ?? 'Errore durante il salvataggio preset');
            }

            toast.success('Preset salvato nelle ricerche.');
        } catch (error) {
            console.error('Error saving preset', error);
            toast.error(error instanceof Error ? error.message : 'Salvataggio preset non riuscito.');
        } finally {
            setIsSavingPreset(false);
        }
    };

    const handleSavePresetClick = () => {
        if (!userId) {
            toast.error("Per salvare un preset devi effettuare l'accesso.");
            return;
        }

        if (tier === 'free') {
            setShowUpgradeProModal(true);
            return;
        }

        if (!canSavePreset) {
            toast.error('Il salvataggio preset è disponibile solo su Pro.');
            return;
        }
        void savePreset();
    };

    if (isPaywalledPublic) {
        return (
            <UpgradeModal>
                <Button type="button" variant="outline" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Preferenze
                </Button>
            </UpgradeModal>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Preferenze
                </Button>
            </DialogTrigger>
            <DialogContent className="left-0 top-0 h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden border-0 bg-white p-0 sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[90vh] sm:w-[96vw] sm:max-w-5xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border sm:border-slate-200/80">
                <DialogHeader className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-sky-50/50 px-4 py-4 pr-12 sm:px-6 sm:py-5 sm:pr-14">
                    <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-sky-100/50 blur-3xl" />
                    <div className="relative">
                        <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Preferenze</DialogTitle>
                        <DialogDescription className="mt-1 text-slate-600">
                        Imposta i filtri che contano davvero per trovare i concorsi in modo più rapido.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="md:hidden border-b border-slate-100 bg-slate-50/70 px-3 py-2.5">
                    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {SECTION_ITEMS.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setSection(item.key)}
                                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${section === item.key
                                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                                    : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                {item.short}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid min-h-0 md:grid-cols-[260px_1fr] md:min-h-[560px] md:max-h-[calc(90vh-180px)]">
                    <aside className="hidden border-r border-slate-100 bg-slate-50/60 p-4 md:block space-y-2">
                        {SECTION_ITEMS.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setSection(item.key)}
                                className={`w-full rounded-xl border px-4 py-3 text-left transition ${section === item.key
                                    ? 'border-slate-200 bg-white shadow-sm'
                                    : 'border-transparent bg-transparent hover:border-slate-200 hover:bg-white/70'}`}
                            >
                                <p className="font-semibold text-slate-900">{item.title}</p>
                                <p className="text-sm text-slate-500">{item.description}</p>
                            </button>
                        ))}
                        <div className="mt-4 rounded-2xl border border-sky-200/80 bg-[linear-gradient(135deg,#ecf6ff_0%,#f7fbff_52%,#fff6ea_100%)] p-4 shadow-[0_18px_30px_-26px_rgba(15,23,42,0.65)]">
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm ring-1 ring-sky-100">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <p className="mt-3 text-sm font-semibold leading-tight text-slate-900">Fai fatica a trovare il concorso giusto?</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                Genio e un assistente AI: descrivi il tuo obiettivo e, quando serve, ti aiuta a trovare i concorsi piu pertinenti.
                            </p>
                            <Link
                                href={genioHref}
                                className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                            >
                                Cerca con Genio
                            </Link>
                        </div>
                    </aside>

                    <div className="space-y-5 overflow-y-auto bg-white p-3 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:p-4 sm:pb-24 md:p-6 md:pb-6">
                        {section === 'basic' && (
                            <section className="dashboard-section-frame space-y-5 p-4 sm:p-5">
                                <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Criteri Base</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Regione</Label>
                                        <Select value={state.regione || SENTINEL} onValueChange={(value) => setRegione(value === SENTINEL ? '' : value)}>
                                            <SelectTrigger><SelectValue placeholder="Tutte le regioni" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={SENTINEL}>Tutte le regioni</SelectItem>
                                                {regioni.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {state.regione ? (
                                        <div className="space-y-2">
                                            <Label>Provincia</Label>
                                            <Select value={state.provincia || SENTINEL} onValueChange={(value) => setField('provincia', value === SENTINEL ? '' : value)}>
                                                <SelectTrigger><SelectValue placeholder={isLoadingProvince ? 'Caricamento province...' : 'Tutte le province'} /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={SENTINEL}>Tutte le province</SelectItem>
                                                    {provinceOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                                            Seleziona prima una regione per vedere le province disponibili.
                                        </div>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Settore</Label>
                                        <Select value={state.settore || SENTINEL} onValueChange={(value) => setField('settore', value === SENTINEL ? '' : value)}>
                                            <SelectTrigger><SelectValue placeholder="Tutti i settori" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={SENTINEL}>Tutti i settori</SelectItem>
                                                {settori.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tipo procedura</Label>
                                        <Select value={state.tipo_procedura || SENTINEL} onValueChange={(value) => setField('tipo_procedura', value === SENTINEL ? '' : value)}>
                                            <SelectTrigger><SelectValue placeholder="Tutti i tipi" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={SENTINEL}>Tutti</SelectItem>
                                                <SelectItem value="ESAMI">Esami</SelectItem>
                                                <SelectItem value="TITOLI">Titoli</SelectItem>
                                                <SelectItem value="TITOLI_COLLOQUIO">Titoli + Colloquio</SelectItem>
                                                <SelectItem value="COLLOQUIO">Colloquio</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Stato</Label>
                                        <Select value={state.stato} onValueChange={(value) => setField('stato', value as PreferencesState['stato'])}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="aperti">Aperti</SelectItem>
                                                <SelectItem value="scaduti">Scaduti</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ordina</Label>
                                        <Select value={state.sort} onValueChange={(value) => setField('sort', value as PreferencesState['sort'])}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="scadenza">Scadenza vicina</SelectItem>
                                                <SelectItem value="recenti">Più recenti</SelectItem>
                                                <SelectItem value="posti">Più posti</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data pubblicazione</Label>
                                        <Select value={state.date_posted} onValueChange={(value) => setField('date_posted', value as DatePostedPreset)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Qualsiasi</SelectItem>
                                                <SelectItem value="24h">Ultime 24h</SelectItem>
                                                <SelectItem value="3d">Ultimi 3 giorni</SelectItem>
                                                <SelectItem value="7d">Ultima settimana</SelectItem>
                                                <SelectItem value="30d">Ultimo mese</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </section>
                        )}

                        {section === 'company' && (
                            <section className="dashboard-section-frame space-y-5 p-4 sm:p-5">
                                <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Ente</h3>
                                <p className="text-sm text-slate-500">
                                    Cerca direttamente l&apos;ente: non è necessario selezionare prima regione o provincia.
                                </p>
                                <p className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                                    Se scegli un ente specifico, i filtri regione/provincia vengono rimossi automaticamente per evitare risultati vuoti.
                                </p>
                                <div className="space-y-2 max-w-md">
                                    <Label htmlFor="ente_ricerca">Cerca ente</Label>
                                    <Input
                                        id="ente_ricerca"
                                        value={enteQuery}
                                        onChange={(event) => setEnteQuery(event.target.value)}
                                        placeholder="Digita almeno 3 caratteri (es. Comune di Roma)"
                                    />
                                    <div className="rounded-md border bg-background">
                                        <button
                                            type="button"
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${state.ente_slug ? '' : 'bg-muted/40'}`}
                                            onClick={() => setField('ente_slug', '')}
                                        >
                                            Tutti gli enti
                                        </button>
                                        {enteResults.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${state.ente_slug === option.value ? 'bg-muted/40 font-medium' : ''}`}
                                                onClick={() => setState((prev) => ({
                                                    ...prev,
                                                    ente_slug: option.value,
                                                    regione: '',
                                                    provincia: '',
                                                }))}
                                                title={option.label}
                                            >
                                                <span className="block truncate">{option.label}</span>
                                            </button>
                                        ))}
                                        {isLoadingEnti && (
                                            <p className="px-3 py-2 text-sm text-muted-foreground">Caricamento enti...</p>
                                        )}
                                        {!isLoadingEnti && enteQuery.trim().length < 3 && (
                                            <p className="px-3 py-2 text-sm text-muted-foreground">Scrivi almeno 3 caratteri per cercare un ente.</p>
                                        )}
                                        {!isLoadingEnti && enteQuery.trim().length >= 3 && enteResults.length === 0 && (
                                            <p className="px-3 py-2 text-sm text-muted-foreground">Nessun ente trovato.</p>
                                        )}
                                        {enteHasMore && (
                                            <button
                                                type="button"
                                                className="w-full border-t px-3 py-2 text-left text-sm font-medium text-primary hover:bg-muted"
                                                onClick={() => void loadEnti(enteQuery.trim(), enteOffset, true)}
                                            >
                                                Altri risultati
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        <div className="md:hidden rounded-2xl border border-sky-200/80 bg-[linear-gradient(128deg,#eff7ff_0%,#f8fbff_55%,#fff7ed_100%)] p-3 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.6)]">
                            <div className="flex items-start gap-2">
                                <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm ring-1 ring-sky-100">
                                    <Sparkles className="h-4 w-4" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold leading-tight text-slate-900">Fai fatica a trovare il concorso giusto?</p>
                                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">Genio e un assistente AI: gli dici cosa cerchi e, quando serve, ti aiuta a trovare i concorsi piu adatti.</p>
                                </div>
                            </div>
                            <Link
                                href={genioHref}
                                className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                            >
                                Cerca con Genio
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 border-t border-slate-100 bg-slate-50/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80 sm:px-6 sm:py-4 md:static md:bg-slate-50/70 md:backdrop-blur-0">
                    <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="w-full rounded-xl sm:w-auto">Annulla</Button>
                            <Button type="button" variant="outline" onClick={saveDefaults} disabled={isSavingDefaults} className="w-full sm:w-auto">
                            {isSavingDefaults ? 'Salvataggio...' : 'Salva come predefinite'}
                        </Button>
                            <div className="relative inline-flex w-full sm:w-auto">
                                {!canSavePreset && (
                                    <span className="absolute -top-2 -right-2 z-10 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                                        Pro
                                    </span>
                                )}
                                <Button type="button" variant="outline" onClick={handleSavePresetClick} disabled={isSavingPreset} className="w-full sm:w-auto">
                                    {isSavingPreset ? 'Salvataggio...' : 'Salva preset'}
                                </Button>
                            </div>
                        </div>
                        <Button type="button" onClick={applyFilters} className="w-full rounded-xl px-6 md:w-auto">Applica filtri</Button>
                    </div>
                </div>
            </DialogContent>
            <UpgradeProModal isOpen={showUpgradeProModal} onOpenChange={setShowUpgradeProModal} />
        </Dialog>
    );
}
