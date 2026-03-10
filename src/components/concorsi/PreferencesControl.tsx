'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { Profile, UserTier } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

type Option = { label: string; value: string };
type SectionKey = 'basic' | 'compensation' | 'areas' | 'company';
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
    titolo_studio: string;
    anni_esperienza: string;
    remote_preferito: boolean;
    settori_interesse: string;
}

const SENTINEL = '__any__';
const PRO_TIERS: UserTier[] = ['pro', 'admin'];
const ENTI_PAGE_SIZE = 10;
const SECTION_ITEMS: Array<{ key: SectionKey; short: string; title: string; description: string }> = [
    {
        key: 'basic',
        short: 'Base',
        title: 'Criteri Base',
        description: 'Regione, provincia, settore, tipo, date',
    },
    {
        key: 'compensation',
        short: 'Compensi',
        title: 'Compensi e Requisiti',
        description: 'Dati profilo (v1 non filtra i risultati)',
    },
    {
        key: 'areas',
        short: 'Interessi',
        title: 'Aree di Interesse',
        description: 'Settori preferiti nel profilo',
    },
    {
        key: 'company',
        short: 'Ente',
        title: 'Ente',
        description: 'Filtro ente e metadati',
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
        settore: searchParams.get('settore') ?? defaults?.settori_interesse?.[0] ?? '',
        tipo_procedura: searchParams.get('tipo_procedura') ?? '',
        stato: (searchParams.get('stato') as PreferencesState['stato']) ?? 'aperti',
        sort: (searchParams.get('sort') as PreferencesState['sort']) ?? 'scadenza',
        ente_slug: searchParams.get('ente_slug') ?? '',
        date_posted: inferDatePreset(searchParams.get('published_from')),
        titolo_studio: defaults?.titolo_studio ?? '',
        anni_esperienza: defaults?.anni_esperienza != null ? String(defaults.anni_esperienza) : '',
        remote_preferito: defaults?.remote_preferito ?? false,
        settori_interesse: defaults?.settori_interesse?.join(', ') ?? '',
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
        const timeout = setTimeout(() => {
            void loadEnti(enteQuery.trim(), 0, false);
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

        setOrDelete('regione', state.regione);
        if (state.regione) {
            setOrDelete('provincia', state.provincia);
        } else {
            params.delete('provincia');
        }
        setOrDelete('settore', state.settore);
        setOrDelete('tipo_procedura', state.tipo_procedura);
        setOrDelete('ente_slug', state.ente_slug);
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
            const rawSettori = state.settori_interesse
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);

            const years = state.anni_esperienza.trim();
            const parsedYears = years ? Number.parseInt(years, 10) : null;
            const finalYears = parsedYears == null || Number.isNaN(parsedYears) ? null : Math.max(parsedYears, 0);

            const payload = {
                regione_interesse: state.regione || null,
                provincia_interesse: state.provincia || null,
                settori_interesse: rawSettori.length > 0 ? rawSettori : (state.settore ? [state.settore] : null),
                titolo_studio: state.titolo_studio || null,
                anni_esperienza: finalYears,
                remote_preferito: state.remote_preferito,
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
        if (!canSavePreset) {
            toast.error('Il salvataggio preset è disponibile solo su Pro.');
            return;
        }

        setIsSavingPreset(true);
        try {
            const presetNameParts = [state.regione, state.provincia, state.settore].filter(Boolean);
            const name = presetNameParts.length > 0 ? `Preset ${presetNameParts.join(' • ')}` : 'Preset preferenze';
            const publishedFrom = datePresetToIso(state.date_posted);

            const filters = {
                regioni: state.regione ? [state.regione] : [],
                province: state.provincia ? [state.provincia] : [],
                settori: state.settore ? [state.settore] : [],
                tipo_procedura: state.tipo_procedura || undefined,
                ente_slug: state.ente_slug || undefined,
                stato: state.stato,
                sort: state.sort,
                published_from: publishedFrom || undefined,
            };

            const query = searchParams.get('q') ?? '';
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
            <DialogContent className="w-[96vw] max-w-5xl overflow-hidden border border-slate-200/80 bg-white p-0 max-h-[90vh]">
                <DialogHeader className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-sky-50/50 px-6 py-5">
                    <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-sky-100/50 blur-3xl" />
                    <div className="relative">
                        <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-900">Preferenze</DialogTitle>
                        <DialogDescription className="mt-1 text-slate-600">
                        Imposta i criteri base per filtrare meglio i concorsi.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="md:hidden border-b border-slate-100 bg-slate-50/70 px-3 py-2.5">
                    <div className="flex gap-2 overflow-x-auto">
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

                <div className="grid md:grid-cols-[260px_1fr] min-h-[560px] max-h-[calc(90vh-180px)]">
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
                    </aside>

                    <div className="space-y-5 overflow-y-auto bg-white p-4 md:p-6">
                        {section === 'basic' && (
                            <>
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
                            </>
                        )}

                        {section === 'compensation' && (
                            <>
                                <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Compensi e Requisiti</h3>
                                <p className="text-sm text-slate-500">
                                    Questi campi sono salvati nel profilo ma non filtrano i risultati in v1.
                                </p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="titolo_studio">Titolo di studio</Label>
                                        <Input id="titolo_studio" value={state.titolo_studio} onChange={(event) => setField('titolo_studio', event.target.value)} placeholder="Es. Laurea magistrale" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="anni_esperienza">Anni di esperienza</Label>
                                        <Input id="anni_esperienza" type="number" min={0} value={state.anni_esperienza} onChange={(event) => setField('anni_esperienza', event.target.value)} placeholder="Es. 5" />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 rounded-md border p-3">
                                    <Checkbox id="remote_preferito_modal" checked={state.remote_preferito} onCheckedChange={(checked) => setField('remote_preferito', checked === true)} />
                                    <Label htmlFor="remote_preferito_modal" className="cursor-pointer">Preferisco posizioni remote</Label>
                                </div>
                            </>
                        )}

                        {section === 'areas' && (
                            <>
                                <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Aree di Interesse</h3>
                                <p className="text-sm text-slate-500">
                                    Settori preferiti del profilo. Separali con virgola.
                                </p>
                                <div className="space-y-2">
                                    <Label htmlFor="settori_interesse">Settori di interesse</Label>
                                    <Input id="settori_interesse" value={state.settori_interesse} onChange={(event) => setField('settori_interesse', event.target.value)} placeholder="Es. Amministrativo, Sanitario, IT" />
                                </div>
                            </>
                        )}

                        {section === 'company' && (
                            <>
                                <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Ente</h3>
                                <p className="text-sm text-slate-500">
                                    In v1 è attivo solo il filtro ente.
                                </p>
                                <div className="space-y-2 max-w-md">
                                    <Label htmlFor="ente_ricerca">Cerca ente</Label>
                                    <Input
                                        id="ente_ricerca"
                                        value={enteQuery}
                                        onChange={(event) => setEnteQuery(event.target.value)}
                                        placeholder="Scrivi almeno 2 caratteri"
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
                                                onClick={() => setField('ente_slug', option.value)}
                                                title={option.label}
                                            >
                                                <span className="block truncate">{option.label}</span>
                                            </button>
                                        ))}
                                        {isLoadingEnti && (
                                            <p className="px-3 py-2 text-sm text-muted-foreground">Caricamento enti...</p>
                                        )}
                                        {!isLoadingEnti && enteResults.length === 0 && (
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
                            </>
                        )}
                    </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">Annulla</Button>
                        <Button type="button" variant="outline" onClick={saveDefaults} disabled={isSavingDefaults}>
                            {isSavingDefaults ? 'Salvataggio...' : 'Salva come predefinite'}
                        </Button>
                        <Button type="button" variant="outline" onClick={savePreset} disabled={!canSavePreset || isSavingPreset}>
                            {isSavingPreset ? 'Salvataggio...' : 'Salva preset'}
                        </Button>
                    </div>
                    <Button type="button" onClick={applyFilters} className="rounded-xl px-6">Applica filtri</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
