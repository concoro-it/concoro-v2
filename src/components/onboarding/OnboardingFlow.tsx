'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    ArrowRight,
    Bell,
    Bookmark,
    Bot,
    Check,
    CheckCircle2,
    Loader2,
    MapPin,
    Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAllRegioni } from '@/lib/utils/regioni';
import { cn } from '@/lib/utils';

interface OnboardingProfile {
    regione_interesse?: string | null;
    provincia_interesse?: string | null;
    preferred_regioni?: string[] | null;
    sede_preferita?: string | null;
    remote_preferito?: boolean | null;
    settori_interesse?: string[] | null;
    preferred_settori?: string[] | null;
    profilo_professionale?: string | null;
    titolo_studio?: string | null;
    anni_esperienza?: number | null;
    education_history?: Array<Record<string, unknown>> | null;
    experience_history?: Array<Record<string, unknown>> | null;
    obiettivo_concorso?: string | null;
    disponibilita_mobilita?: boolean | null;
    tempo_studio_settimanale?: number | null;
    disponibilita_trasferimento?: string | null;
    livello_preparazione?: string | null;
    public_admin_experience?: boolean | null;
    skills?: string[] | null;
    languages?: string[] | null;
    driving_licenses?: string[] | null;
    notification_email?: boolean | null;
}

interface OnboardingFlowProps {
    profile: OnboardingProfile | null;
    redirectTo?: string;
}

interface Option {
    label: string;
    value: string;
}

type SedePreferita = 'tutta_italia' | 'regione' | 'provincia' | 'remoto' | 'nessuna_preferenza';

const TOTAL_STEPS = 5;

const STEP_IMAGES = [
    {
        src: '/images/onboarding/onboarding-discovery.png',
        alt: 'Illustrazione di un megafono con notifiche',
    },
    {
        src: '/images/onboarding/onboarding-location.png',
        alt: 'Illustrazione di una persona che consulta enti pubblici',
    },
    {
        src: '/images/onboarding/onboarding-search.png',
        alt: 'Illustrazione di una persona che cerca opportunita',
    },
    {
        src: '/images/onboarding/onboarding-profile.png',
        alt: 'Illustrazione di un profilo digitale',
    },
    {
        src: '/images/onboarding/onboarding-ready.png',
        alt: 'Illustrazione di una configurazione completata',
    },
];

const LOCATION_OPTIONS: Array<{ label: string; value: SedePreferita; description: string }> = [
    { label: 'Tutta Italia', value: 'tutta_italia', description: 'Mostra opportunita in tutte le regioni.' },
    { label: 'La mia regione', value: 'regione', description: 'Dai priorita ai concorsi nella regione scelta.' },
    { label: 'Province specifiche', value: 'provincia', description: 'Filtra meglio in base alla provincia.' },
    { label: 'Anche da remoto', value: 'remoto', description: 'Includi opportunita con lavoro da remoto.' },
    { label: 'Non ho preferenze', value: 'nessuna_preferenza', description: 'Lascia i risultati piu ampi.' },
];

const SECTOR_OPTIONS = [
    'Amministrazione',
    'Contabilita e finanza',
    'Tecnico / ingegneria',
    'Sanita',
    'Istruzione',
    'Polizia locale / sicurezza',
    'Informatica / digitale',
    'Legale',
    'Ambiente e territorio',
    'Cultura / comunicazione',
    'Altro',
    'Non lo so ancora',
];

const STUDY_OPTIONS = [
    { value: 'licenza_media', label: 'Licenza media' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'laurea_triennale', label: 'Laurea triennale' },
    { value: 'laurea_magistrale', label: 'Laurea magistrale' },
    { value: 'master', label: 'Master' },
    { value: 'dottorato', label: 'Dottorato' },
    { value: 'altro', label: 'Altro' },
];

const EXPERIENCE_OPTIONS = [
    { value: '0', label: 'Nessuna o meno di 1 anno', numeric: 0 },
    { value: '1_2', label: '1-2 anni', numeric: 1 },
    { value: '3_5', label: '3-5 anni', numeric: 3 },
    { value: '6_10', label: '6-10 anni', numeric: 6 },
    { value: '10_plus', label: 'Oltre 10 anni', numeric: 10 },
];

const TRANSFER_OPTIONS = [
    { value: 'si', label: 'Si' },
    { value: 'no', label: 'No' },
    { value: 'forse', label: 'Forse' },
    { value: 'solo_regioni_selezionate', label: 'Solo nelle regioni selezionate' },
];

const PREPARATION_OPTIONS = [
    { value: 'inizio_da_zero', label: 'Inizio da zero' },
    { value: 'ho_gia_studiato', label: 'Ho gia studiato' },
    { value: 'ho_gia_partecipato', label: 'Ho gia partecipato' },
    { value: 'sono_avanzato', label: 'Sono avanzato' },
];

const WEEKLY_TIME_OPTIONS = [
    { value: 'meno_3_ore', label: 'Meno di 3 ore', numeric: 2 },
    { value: '3_5_ore', label: '3-5 ore', numeric: 4 },
    { value: '6_10_ore', label: '6-10 ore', numeric: 8 },
    { value: 'oltre_10_ore', label: 'Oltre 10 ore', numeric: 11 },
];

const FEATURE_CARDS = [
    {
        icon: Search,
        title: 'Concorsi consigliati',
        description: 'Vedi bandi ordinati in base alle tue preferenze.',
    },
    {
        icon: Bookmark,
        title: 'Scadenze sotto controllo',
        description: 'Salva i concorsi e tieni traccia delle date importanti.',
    },
    {
        icon: Bot,
        title: 'Genio',
        description: 'Fai domande sui bandi e chiarisci requisiti, prove e documenti richiesti.',
    },
    {
        icon: Bell,
        title: 'Avvisi email',
        description: 'Ricevi aggiornamenti quando ci sono nuove opportunita rilevanti.',
    },
];

function numberToExperienceRange(value?: number | null) {
    if (value == null) return '';
    if (value >= 10) return '10_plus';
    if (value >= 6) return '6_10';
    if (value >= 3) return '3_5';
    if (value >= 1) return '1_2';
    return '0';
}

function numberToWeeklyTime(value?: number | null) {
    if (value == null) return '';
    if (value > 10) return 'oltre_10_ore';
    if (value >= 6) return '6_10_ore';
    if (value >= 3) return '3_5_ore';
    return 'meno_3_ore';
}

function parseCsv(value: string) {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function getExperienceNumber(value: string) {
    return EXPERIENCE_OPTIONS.find((option) => option.value === value)?.numeric ?? null;
}

function getWeeklyTimeNumber(value: string) {
    return WEEKLY_TIME_OPTIONS.find((option) => option.value === value)?.numeric ?? null;
}

export function OnboardingFlow({ profile, redirectTo = '/hub/bacheca' }: OnboardingFlowProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [provinceOptions, setProvinceOptions] = useState<Option[]>([]);
    const [isLoadingProvince, setIsLoadingProvince] = useState(false);

    const [sedePreferita, setSedePreferita] = useState<SedePreferita>(
        (profile?.sede_preferita as SedePreferita | null) ?? 'nessuna_preferenza'
    );
    const [regione, setRegione] = useState(profile?.regione_interesse ?? profile?.preferred_regioni?.[0] ?? '');
    const [provincia, setProvincia] = useState(profile?.provincia_interesse ?? '');
    const [remotePreferito, setRemotePreferito] = useState(Boolean(profile?.remote_preferito));
    const [settori, setSettori] = useState<string[]>(profile?.settori_interesse ?? profile?.preferred_settori ?? []);
    const [profiloProfessionale, setProfiloProfessionale] = useState(profile?.profilo_professionale ?? '');
    const [titoloStudio, setTitoloStudio] = useState(profile?.titolo_studio ?? '');
    const [areaStudio, setAreaStudio] = useState(
        typeof profile?.education_history?.[0]?.field === 'string' ? String(profile.education_history[0].field) : ''
    );
    const [anniEsperienza, setAnniEsperienza] = useState(numberToExperienceRange(profile?.anni_esperienza));
    const [publicAdminExperience, setPublicAdminExperience] = useState<boolean | null>(
        typeof profile?.public_admin_experience === 'boolean' ? profile.public_admin_experience : null
    );
    const [disponibilitaTrasferimento, setDisponibilitaTrasferimento] = useState(profile?.disponibilita_trasferimento ?? '');
    const [livelloPreparazione, setLivelloPreparazione] = useState(profile?.livello_preparazione ?? '');
    const [tempoStudio, setTempoStudio] = useState(numberToWeeklyTime(profile?.tempo_studio_settimanale));
    const [skillsText, setSkillsText] = useState((profile?.skills ?? []).join(', '));
    const [languagesText, setLanguagesText] = useState((profile?.languages ?? []).join(', '));
    const [drivingLicensesText, setDrivingLicensesText] = useState((profile?.driving_licenses ?? []).join(', '));
    const [notificationEmail, setNotificationEmail] = useState(profile?.notification_email ?? true);

    const regionOptions = useMemo(() => getAllRegioni().sort((a, b) => a.localeCompare(b, 'it')), []);
    const currentImage = STEP_IMAGES[step - 1];
    const progress = (step / TOTAL_STEPS) * 100;

    useEffect(() => {
        if (!regione) {
            setProvinceOptions([]);
            return;
        }

        const controller = new AbortController();
        const loadProvince = async () => {
            setIsLoadingProvince(true);
            try {
                const params = new URLSearchParams({ regione });
                const response = await fetch(`/api/concorsi/province?${params.toString()}`, {
                    signal: controller.signal,
                });
                const payload = (await response.json()) as { data?: Option[]; error?: string };
                if (!response.ok) throw new Error(payload.error || 'Errore durante il caricamento delle province');
                setProvinceOptions(payload.data ?? []);
            } catch (err) {
                if (!controller.signal.aborted) {
                    console.error('[onboarding] province load failed', err);
                    setProvinceOptions([]);
                }
            } finally {
                if (!controller.signal.aborted) setIsLoadingProvince(false);
            }
        };

        void loadProvince();
        return () => controller.abort();
    }, [regione]);

    const save = async (data: Record<string, unknown>, options: { complete?: boolean; redirectTo?: string } = {}) => {
        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch('/api/onboarding/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        ...data,
                        complete: options.complete,
                    },
                }),
            });
            const payload = (await response.json()) as { error?: string; details?: string | null };
            if (!response.ok) {
                throw new Error(payload.error || payload.details || 'Errore durante il salvataggio');
            }

            if (options.complete) {
                router.push(options.redirectTo ?? '/hub/bacheca');
                router.refresh();
                return;
            }

            setStep((current) => Math.min(current + 1, TOTAL_STEPS));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Errore durante il salvataggio. Riprova.';
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const finishOnboarding = () => save({
        notification_email: notificationEmail,
        profile_source: 'manual_onboarding',
    }, { complete: true, redirectTo });

    const saveStep = () => {
        if (step === 1) {
            setStep(2);
            return;
        }

        if (step === 2) {
            const selectedRegions = regione ? [regione] : null;
            void save({
                regione_interesse: regione || null,
                provincia_interesse: provincia || null,
                preferred_regioni: selectedRegions,
                sede_preferita: sedePreferita,
                remote_preferito: remotePreferito || sedePreferita === 'remoto',
                profile_source: 'manual_onboarding',
            });
            return;
        }

        if (step === 3) {
            void save({
                settori_interesse: settori,
                preferred_settori: settori,
                profilo_professionale: profiloProfessionale,
                profile_source: 'manual_onboarding',
            });
            return;
        }

        if (step === 4) {
            const experienceNumber = getExperienceNumber(anniEsperienza);
            const weeklyTimeNumber = getWeeklyTimeNumber(tempoStudio);
            void save({
                titolo_studio: titoloStudio,
                anni_esperienza: experienceNumber,
                education_history: areaStudio
                    ? [{ degree: titoloStudio, field: areaStudio, institution: '', year: '' }]
                    : null,
                experience_history: experienceNumber != null
                    ? [{ role: profiloProfessionale, sector: settori[0] ?? '', years: anniEsperienza }]
                    : null,
                public_admin_experience: publicAdminExperience,
                disponibilita_trasferimento: disponibilitaTrasferimento,
                disponibilita_mobilita: ['si', 'forse', 'solo_regioni_selezionate'].includes(disponibilitaTrasferimento),
                livello_preparazione: livelloPreparazione,
                tempo_studio_settimanale: weeklyTimeNumber,
                skills: parseCsv(skillsText),
                languages: parseCsv(languagesText),
                driving_licenses: parseCsv(drivingLicensesText),
                profile_source: 'manual_onboarding',
            });
            return;
        }

        void finishOnboarding('/hub/bacheca');
    };

    const skipCurrentStep = () => {
        if (step === 1) {
            void finishOnboarding('/hub/bacheca');
            return;
        }

        if (step === 2) {
            void save({
                sede_preferita: 'nessuna_preferenza',
                remote_preferito: false,
                profile_source: 'manual_onboarding',
            });
            return;
        }

        if (step < TOTAL_STEPS) {
            setStep((current) => current + 1);
            return;
        }

        void finishOnboarding('/hub/bacheca');
    };

    const toggleSettore = (settore: string) => {
        setSettori((current) => {
            if (current.includes(settore)) return current.filter((item) => item !== settore);
            return [...current, settore];
        });
    };

    return (
        <main className="min-h-screen bg-[#F6F4EF] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col">
                <header className="flex items-center justify-between gap-4 py-3">
                    <Link href="/" className="text-lg font-semibold tracking-tight text-[#0B2942]">
                        Concoro
                    </Link>
                    <span className="rounded-full border border-slate-300 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600">
                        {step} di {TOTAL_STEPS}
                    </span>
                </header>

                <section className="grid flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[1.04fr_0.96fr]">
                    <div className="flex min-h-[620px] flex-col p-5 sm:p-8 lg:p-10">
                        <div className="mb-8">
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-[#0A4E88] transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex-1">
                            {step === 1 && (
                                <div className="space-y-7">
                                    <div className="space-y-3">
                                        <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">
                                            Trova i concorsi piu adatti al tuo profilo
                                        </h1>
                                        <p className="max-w-2xl text-base leading-relaxed text-slate-600">
                                            Configura Concoro in pochi passaggi: ti mostreremo bandi piu rilevanti, scadenze da seguire e requisiti piu facili da capire.
                                        </p>
                                    </div>

                                    <div className="grid gap-3">
                                        {[
                                            ['Concorsi aggiornati', 'Scopri nuove opportunita senza cercare su decine di siti.'],
                                            ['Requisiti piu chiari', 'Capisci piu velocemente se un bando e adatto a te.'],
                                            ['Suggerimenti personalizzati', 'Usiamo il tuo profilo per ordinare meglio i risultati.'],
                                        ].map(([title, description]) => (
                                            <article key={title} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                                                <div className="flex gap-3">
                                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0A4E88]" />
                                                    <div>
                                                        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
                                                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6">
                                    <StepHeading
                                        title="Dove vuoi candidarti?"
                                        subtitle="Useremo questa informazione per mostrarti concorsi piu vicini alle tue preferenze."
                                    />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {LOCATION_OPTIONS.map((option) => (
                                            <OptionCard
                                                key={option.value}
                                                selected={sedePreferita === option.value}
                                                title={option.label}
                                                description={option.description}
                                                onClick={() => {
                                                    setSedePreferita(option.value);
                                                    if (option.value === 'remoto') setRemotePreferito(true);
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Regione">
                                            <Select value={regione || undefined} onValueChange={(value) => {
                                                setRegione(value);
                                                setProvincia('');
                                            }}>
                                                <SelectTrigger className="h-11 bg-white">
                                                    <SelectValue placeholder="Seleziona una regione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {regionOptions.map((item) => (
                                                        <SelectItem key={item} value={item}>{item}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                        <Field label="Provincia">
                                            <Select value={provincia || undefined} onValueChange={setProvincia} disabled={!regione || isLoadingProvince}>
                                                <SelectTrigger className="h-11 bg-white">
                                                    <SelectValue placeholder={isLoadingProvince ? 'Caricamento...' : 'Seleziona una provincia'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {provinceOptions.map((item) => (
                                                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </div>
                                    <ToggleRow
                                        title="Includi opportunita da remoto"
                                        description="Useremo questa preferenza solo per ordinare meglio i risultati."
                                        checked={remotePreferito}
                                        onChange={setRemotePreferito}
                                    />
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6">
                                    <StepHeading
                                        title="In quale settore vuoi lavorare?"
                                        subtitle="Puoi scegliere piu settori. Concoro usera queste preferenze per ordinare meglio i bandi."
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {SECTOR_OPTIONS.map((settore) => {
                                            const selected = settori.includes(settore);
                                            return (
                                                <button
                                                    key={settore}
                                                    type="button"
                                                    onClick={() => toggleSettore(settore)}
                                                    className={cn(
                                                        'rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4E88]',
                                                        selected
                                                            ? 'border-[#0A4E88] bg-[#0A4E88] text-white'
                                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                                    )}
                                                >
                                                    {settore}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <Field label="Che ruolo stai cercando?">
                                        <Input
                                            value={profiloProfessionale}
                                            onChange={(event) => setProfiloProfessionale(event.target.value)}
                                            placeholder="Es. istruttore amministrativo, funzionario tecnico, assistente contabile..."
                                            className="h-11 bg-white"
                                        />
                                    </Field>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="space-y-5">
                                    <StepHeading
                                        title="Completa il tuo profilo"
                                        subtitle="Queste informazioni aiutano Concoro a capire meglio quali concorsi possono essere adatti a te."
                                    />
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Titolo di studio">
                                            <Select value={titoloStudio || undefined} onValueChange={setTitoloStudio}>
                                                <SelectTrigger className="h-11 bg-white">
                                                    <SelectValue placeholder="Seleziona" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STUDY_OPTIONS.map((item) => (
                                                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                        <Field label="Area di studio / specializzazione">
                                            <Input value={areaStudio} onChange={(event) => setAreaStudio(event.target.value)} placeholder="Es. Economia, Giurisprudenza" className="h-11 bg-white" />
                                        </Field>
                                        <Field label="Anni di esperienza">
                                            <Select value={anniEsperienza || undefined} onValueChange={setAnniEsperienza}>
                                                <SelectTrigger className="h-11 bg-white">
                                                    <SelectValue placeholder="Seleziona" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {EXPERIENCE_OPTIONS.map((item) => (
                                                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                        <Field label="Disponibilita a trasferirti">
                                            <Select value={disponibilitaTrasferimento || undefined} onValueChange={setDisponibilitaTrasferimento}>
                                                <SelectTrigger className="h-11 bg-white">
                                                    <SelectValue placeholder="Seleziona" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TRANSFER_OPTIONS.map((item) => (
                                                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </div>

                                    <SegmentedBoolean
                                        label="Hai gia esperienza nella Pubblica Amministrazione?"
                                        value={publicAdminExperience}
                                        onChange={setPublicAdminExperience}
                                    />

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Livello di preparazione">
                                            <Select value={livelloPreparazione || undefined} onValueChange={setLivelloPreparazione}>
                                                <SelectTrigger className="h-11 bg-white">
                                                    <SelectValue placeholder="Seleziona" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PREPARATION_OPTIONS.map((item) => (
                                                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                        <Field label="Tempo di preparazione settimanale">
                                            <Select value={tempoStudio || undefined} onValueChange={setTempoStudio}>
                                                <SelectTrigger className="h-11 bg-white">
                                                    <SelectValue placeholder="Seleziona" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {WEEKLY_TIME_OPTIONS.map((item) => (
                                                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <Field label="Competenze principali">
                                            <Input value={skillsText} onChange={(event) => setSkillsText(event.target.value)} placeholder="Excel, diritto..." className="h-11 bg-white" />
                                        </Field>
                                        <Field label="Lingue conosciute">
                                            <Input value={languagesText} onChange={(event) => setLanguagesText(event.target.value)} placeholder="Italiano, Inglese" className="h-11 bg-white" />
                                        </Field>
                                        <Field label="Patente">
                                            <Input value={drivingLicensesText} onChange={(event) => setDrivingLicensesText(event.target.value)} placeholder="B" className="h-11 bg-white" />
                                        </Field>
                                    </div>

                                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        Piu avanti potrai caricare il tuo CV per arricchire automaticamente il profilo.
                                    </p>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="space-y-6">
                                    <StepHeading
                                        title="Il tuo spazio e pronto"
                                        subtitle="Da ora puoi cercare concorsi, salvare quelli interessanti e ricevere suggerimenti piu vicini al tuo profilo."
                                    />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {FEATURE_CARDS.map(({ icon: Icon, title, description }) => (
                                            <article key={title} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                                                <Icon className="h-5 w-5 text-[#0A4E88]" />
                                                <h2 className="mt-3 text-sm font-semibold text-slate-950">{title}</h2>
                                                <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
                                            </article>
                                        ))}
                                    </div>
                                    <ToggleRow
                                        title="Ricevi aggiornamenti via email"
                                        description="Puoi modificare questa preferenza piu avanti dal tuo profilo."
                                        checked={notificationEmail}
                                        onChange={setNotificationEmail}
                                    />
                                    <div className="rounded-lg border border-[#0A4E88]/20 bg-[#EAF4FB] p-4">
                                        <h2 className="text-sm font-semibold text-slate-950">Vuoi analisi piu complete?</h2>
                                        <p className="mt-1 text-sm leading-relaxed text-slate-700">
                                            Con Concoro Pro puoi sbloccare suggerimenti avanzati e analisi piu dettagliate dei bandi.
                                        </p>
                                        <Link href="/pricing?source=onboarding" className="mt-3 inline-flex text-sm font-semibold text-[#0A4E88] hover:underline">
                                            Prova Concoro Pro per 7 giorni
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                                {error}
                            </div>
                        )}

                        <footer className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setStep((current) => Math.max(current - 1, 1))}
                                    disabled={step === 1 || isSaving}
                                    className="px-2 text-slate-600"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Indietro
                                </Button>
                                <button
                                    type="button"
                                    onClick={skipCurrentStep}
                                    disabled={isSaving}
                                    className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline disabled:opacity-60"
                                >
                                    {step === 1 ? 'Salta per ora' : step === 2 ? 'Decidero piu tardi' : step === 4 ? 'Completero dopo' : 'Salta'}
                                </button>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                {step === 5 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => void finishOnboarding('/hub/concorsi')}
                                        disabled={isSaving}
                                        className="h-11"
                                    >
                                        Esplora i concorsi
                                    </Button>
                                )}
                                <Button type="button" onClick={saveStep} disabled={isSaving} className="h-11 bg-[#0A4E88] px-5 text-white hover:bg-[#083E6C]">
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : step === TOTAL_STEPS ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                                    {isSaving
                                        ? 'Salvataggio...'
                                        : step === 1
                                            ? 'Inizia'
                                            : step === 4
                                                ? 'Salva e continua'
                                                : step === TOTAL_STEPS
                                                    ? 'Vai alla dashboard'
                                                    : 'Continua'}
                                </Button>
                            </div>
                        </footer>
                    </div>

                    <aside className="hidden border-l border-slate-100 bg-[#F8FAFC] p-8 lg:flex lg:items-center lg:justify-center">
                        <div className="relative w-full max-w-sm">
                            <div className="absolute inset-x-8 bottom-4 h-24 rounded-full bg-[#0A4E88]/10 blur-2xl" />
                            <Image
                                src={currentImage.src}
                                alt={currentImage.alt}
                                width={540}
                                height={420}
                                priority={step === 1}
                                className="relative mx-auto h-auto max-h-[420px] w-full object-contain"
                            />
                            <div className="mt-8 rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-5 w-5 text-[#0A4E88]" />
                                    <p className="text-sm leading-relaxed text-slate-600">
                                        Puoi modificare queste informazioni piu avanti dal tuo profilo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </section>
            </div>
        </main>
    );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{subtitle}</p>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">{label}</span>
            {children}
        </label>
    );
}

function OptionCard({
    selected,
    title,
    description,
    onClick,
}: {
    selected: boolean;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'min-h-28 rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4E88]',
                selected
                    ? 'border-[#0A4E88] bg-[#EAF4FB] shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
                </div>
                <span className={cn('mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border', selected ? 'border-[#0A4E88] bg-[#0A4E88] text-white' : 'border-slate-300')}>
                    {selected && <Check className="h-3.5 w-3.5" />}
                </span>
            </div>
        </button>
    );
}

function ToggleRow({
    title,
    description,
    checked,
    onChange,
}: {
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <span>
                <span className="block text-sm font-semibold text-slate-950">{title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-slate-600">{description}</span>
            </span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 accent-[#0A4E88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4E88]"
            />
        </label>
    );
}

function SegmentedBoolean({
    label,
    value,
    onChange,
}: {
    label: string;
    value: boolean | null;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">{label}</p>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                {[
                    { label: 'Si', value: true },
                    { label: 'No', value: false },
                ].map((option) => (
                    <button
                        key={option.label}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4E88]',
                            value === option.value ? 'bg-white text-[#0A4E88] shadow-sm' : 'text-slate-600 hover:text-slate-950'
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
