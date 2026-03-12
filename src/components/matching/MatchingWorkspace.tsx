'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Compass,
    Crown,
    FileText,
    Loader2,
    Lock,
    Radar,
    ShieldCheck,
    Sparkles,
    Target,
    Trophy,
    UploadCloud,
} from 'lucide-react';
import type { Profile, UserTier } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface MatchingWorkspaceProps {
    userId: string;
    tier: UserTier;
    profile: Partial<Profile> | null;
}

type JsonObject = Record<string, unknown>;

interface MatchResult {
    id: string;
    title: string;
    ente: string | null;
    location: string | null;
    deadline: string | null;
    reason: string | null;
    score: number | null;
    href: string | null;
}

function isObject(value: unknown): value is JsonObject {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function getStringValue(source: JsonObject, keys: string[]): string | null {
    for (const key of keys) {
        const value = source[key];
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
    }
    return null;
}

function parseScore(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        if (value <= 1) return Math.round(value * 100);
        return Math.round(Math.max(0, Math.min(100, value)));
    }
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value.replace(',', '.'));
        if (Number.isFinite(parsed)) return parseScore(parsed);
    }
    return null;
}

function tryArrayFromContainer(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (!isObject(value)) return [];

    const possibleArrays = [
        value.matches,
        value.concorsi,
        value.results,
        value.items,
        value.data,
        value.recommendations,
    ];

    for (const candidate of possibleArrays) {
        if (Array.isArray(candidate)) return candidate;
        if (isObject(candidate) && Array.isArray(candidate.items)) return candidate.items;
    }

    return [];
}

function formatDate(value: string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function parseMatches(payload: unknown): MatchResult[] {
    const rawItems = tryArrayFromContainer(payload);
    if (!rawItems.length) return [];

    return rawItems
        .map((entry, index) => {
            if (!isObject(entry)) return null;

            const title = getStringValue(entry, ['titolo', 'title', 'name', 'concorso', 'job_title']) ?? `Suggerimento ${index + 1}`;
            const slug = getStringValue(entry, ['slug']);
            const href = getStringValue(entry, ['url', 'link', 'href', 'detail_url']) ?? (slug ? `/hub/concorsi/${slug}` : null);
            const score =
                parseScore(entry.match_score)
                ?? parseScore(entry.score)
                ?? parseScore(entry.compatibility)
                ?? parseScore(entry.fit)
                ?? parseScore(entry.percentuale);

            return {
                id: String(entry.id ?? entry.concorso_id ?? slug ?? `match-${index}`),
                title,
                ente: getStringValue(entry, ['ente', 'organization', 'company', 'amministrazione']),
                location: getStringValue(entry, ['luogo', 'location', 'sede', 'provincia', 'regione']),
                deadline: formatDate(getStringValue(entry, ['deadline', 'scadenza', 'expires_at', 'application_deadline'])),
                reason: getStringValue(entry, ['motivo', 'reason', 'why', 'summary', 'note', 'comment']),
                score,
                href,
            };
        })
        .filter((item): item is MatchResult => item !== null);
}

function getTierTone(tier: UserTier): { label: string; hasAccess: boolean } {
    if (tier === 'pro' || tier === 'admin') return { label: tier === 'admin' ? 'Admin' : 'Pro', hasAccess: true };
    if (tier === 'free') return { label: 'Gratuito', hasAccess: false };
    return { label: 'Ospite', hasAccess: false };
}

function getProfileSignals(profile: Partial<Profile> | null): string[] {
    if (!profile) return [];
    const sectorSignals = profile.settori_interesse?.slice(0, 2) ?? [];
    const locationSignal = profile.provincia_interesse ?? profile.regione_interesse ?? null;
    const roleSignal = profile.profilo_professionale ?? null;

    return [
        roleSignal,
        locationSignal ? `Area: ${locationSignal}` : null,
        ...sectorSignals,
    ].filter((item): item is string => Boolean(item && item.trim().length > 0));
}

export function MatchingWorkspace({ userId, tier, profile }: MatchingWorkspaceProps) {
    const { label: tierLabel, hasAccess } = getTierTone(tier);
    const profileSignals = getProfileSignals(profile);
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [matches, setMatches] = useState<MatchResult[]>([]);

    async function submitToN8n(selectedFile?: File | null) {
        setIsLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        setWaitingMessage('Analisi del CV in corso...');

        try {
            const fileToUse = selectedFile ?? cvFile;
            const formData = new FormData();
            formData.append('user_id', userId);
            formData.append('request_id', crypto.randomUUID());
            formData.append('profile_json', JSON.stringify(profile ?? {}));
            if (note.trim()) {
                formData.append('cv_text', note.trim());
            }
            if (fileToUse) {
                formData.append('cv_pdf', fileToUse, fileToUse.name || 'cv.pdf');
            }

            setWaitingMessage('Stiamo calcolando i concorsi piu adatti al tuo profilo...');
            const response = await fetch('/api/matching/v2', {
                method: 'POST',
                body: formData,
            });

            const text = await response.text();
            const parsed = (() => {
                try {
                    return JSON.parse(text);
                } catch {
                    return text;
                }
            })();

            const parsedMatches = parseMatches(parsed);
            setMatches(parsedMatches);

            if (!response.ok) {
                const error = typeof parsed === 'object' && parsed && 'error' in parsed
                    ? String((parsed as { error?: unknown }).error ?? 'Richiesta non riuscita')
                    : `HTTP ${response.status}`;
                throw new Error(error);
            }

            const matchCount = parsedMatches.length;
            setSuccessMessage(matchCount > 0 ? `Trovati ${matchCount} concorsi in linea con il tuo profilo.` : 'Analisi completata: al momento non ci sono nuovi match rilevanti.');
            setWaitingMessage(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Errore sconosciuto';
            setErrorMessage(message);
            setWaitingMessage(null);
        } finally {
            setIsLoading(false);
        }
    }

    function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        setCvFile(file);
        if (file && !isLoading) {
            void submitToN8n(file);
        }
    }

    if (!hasAccess) {
        return (
            <div className="dashboard-shell">
                <div className="dashboard-shell-overlay" />
                <div className="relative space-y-6 px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
                    <section className="dashboard-section-frame overflow-hidden p-5 sm:p-6 lg:p-7">
                        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="space-y-4">
                                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-amber-900">
                                    <Lock className="h-3.5 w-3.5" />
                                    Funzione Pro
                                </span>
                                <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl leading-[1.04] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.8rem]">
                                    Analizziamo il tuo CV e ti proponiamo
                                    <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                        i concorsi piu adatti
                                    </span>
                                    in ordine di priorita.
                                </h1>
                                <p className="max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
                                    Matching combina contenuto del CV e preferenze del profilo per mostrarti opportunita pertinenti con un punteggio di compatibilita.
                                </p>
                                <div className="grid gap-2.5 sm:grid-cols-2">
                                    <Link
                                        href="/pricing"
                                        className="group inline-flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        Passa a Pro
                                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                    </Link>
                                    <Link
                                        href="/hub/profile"
                                        className="group inline-flex items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                                    >
                                        Completa il profilo
                                        <ShieldCheck className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
                                    </Link>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4">
                                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Piano attivo</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <Badge variant="secondary">Tier: {tierLabel}</Badge>
                                    <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Matching bloccato</Badge>
                                </div>
                                <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                                    <li className="flex items-start gap-2">
                                        <Sparkles className="mt-0.5 h-4 w-4 text-[#0A4E88]" />
                                        Estrazione automatica di competenze ed esperienza dal CV
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Sparkles className="mt-0.5 h-4 w-4 text-[#0A4E88]" />
                                        Ranking dei concorsi in base alla compatibilita
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Sparkles className="mt-0.5 h-4 w-4 text-[#0A4E88]" />
                                        Suggerimenti pratici su dove candidarti prima
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section-frame overflow-hidden p-5 sm:p-6">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-0 z-20 rounded-2xl bg-gradient-to-b from-white/25 via-white/55 to-white/90 backdrop-blur-[2px]" />
                            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 -translate-y-1/2 text-center">
                                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm">
                                    <Crown className="h-4 w-4" />
                                    Sblocca i risultati con Pro
                                </span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {['Istruttore Amministrativo', 'Assistente Tecnico Sanitario', 'Funzionario Contabile'].map((title, index) => (
                                    <article key={title} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">Suggerimento {index + 1}</p>
                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">{88 - index * 6}% fit</span>
                                        </div>
                                        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                                        <p className="mt-1 text-sm text-slate-600">Ente locale • Lazio</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-shell">
            <div className="dashboard-shell-overlay" />
            <div className="relative space-y-6 px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
                <section className="dashboard-section-frame p-5 sm:p-6 lg:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-2xl space-y-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#0A4E88]/20 bg-[#0A4E88]/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#0A4E88]">
                                <Radar className="h-3.5 w-3.5" />
                                Area Matching
                            </span>
                            <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.9rem]">
                                Carica il CV e trova
                                <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                                    i concorsi piu compatibili
                                </span>
                                in pochi secondi.
                            </h1>
                            <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
                                Analizziamo insieme il PDF e le preferenze profilo: ricevi una lista ordinata per punteggio e vai subito al bando piu interessante.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Piano attivo</p>
                            <div className="mt-2 flex items-center gap-2">
                                <Badge variant="secondary">Tier: {tierLabel}</Badge>
                                <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Accesso Pro attivo</Badge>
                            </div>
                            <p className="mt-3 max-w-[16rem] text-sm text-slate-600">
                                Per risultati migliori, usa un CV aggiornato e indica nel campo note il ruolo che stai cercando.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-3">
                    <article className="rounded-2xl border border-slate-200/85 bg-white/90 p-4 shadow-sm">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Stato sessione</p>
                        <p className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-900">
                            <Target className="h-4 w-4 text-[#0A4E88]" />
                            {matches.length > 0 ? 'Risultati aggiornati' : 'In attesa del primo upload'}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">Ultima analisi basata su CV e preferenze profilo.</p>
                    </article>
                    <article className="rounded-2xl border border-slate-200/85 bg-white/90 p-4 shadow-sm">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Concorso top</p>
                        <p className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-900">
                            <Trophy className="h-4 w-4 text-amber-600" />
                            {matches[0]?.score != null ? `${matches[0].score}% compatibile` : 'Nessun punteggio disponibile'}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-600">{matches[0]?.title ?? 'Carica il CV per vedere il primo match'}</p>
                    </article>
                    <article className="rounded-2xl border border-slate-200/85 bg-white/90 p-4 shadow-sm">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Segnali profilo</p>
                        <p className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-900">
                            <Compass className="h-4 w-4 text-emerald-700" />
                            {profileSignals.length > 0 ? `${profileSignals.length} segnali attivi` : 'Profilo da completare'}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">Migliorano precisione e priorita dei suggerimenti.</p>
                    </article>
                </section>

                <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <article className="dashboard-section-frame p-5 sm:p-6">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Analisi CV</h2>
                                <p className="text-sm text-slate-600">Appena scegli il PDF avviamo l'analisi automaticamente. Puoi anche rilanciarla manualmente.</p>
                            </div>

                            <label
                                htmlFor="cv_pdf"
                                className="group block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white p-5 transition hover:border-[#0A4E88]/45 hover:bg-slate-50"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="rounded-xl bg-[#0A4E88]/10 p-2 text-[#0A4E88]">
                                        <UploadCloud className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="font-semibold text-slate-900">Carica CV in PDF</p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {cvFile ? `${cvFile.name} · ${Math.ceil(cvFile.size / 1024)} KB` : 'Formato accettato: solo PDF.'}
                                        </p>
                                    </div>
                                </div>
                                <Input id="cv_pdf" className="sr-only" type="file" accept="application/pdf" onChange={onFileChange} disabled={isLoading} />
                            </label>

                            <Textarea
                                rows={4}
                                placeholder="Facoltativo: indica ruolo desiderato, citta preferite o settori su cui vuoi concentrarti."
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                disabled={isLoading}
                            />

                            <Button className="w-full" onClick={() => void submitToN8n()} disabled={isLoading || !cvFile}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Analisi in corso...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        Ricalcola i match
                                    </>
                                )}
                            </Button>

                            {profileSignals.length > 0 && (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/75 p-3">
                                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Priorita considerate</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {profileSignals.map((signal) => (
                                            <span
                                                key={signal}
                                                className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                                            >
                                                {signal}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {waitingMessage && (
                                <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                                    {waitingMessage}
                                </div>
                            )}

                            {errorMessage && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    <span className="flex items-start gap-2">
                                        <AlertCircle className="mt-0.5 h-4 w-4" />
                                        {errorMessage}
                                    </span>
                                </div>
                            )}

                            {successMessage && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                    <span className="flex items-start gap-2">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4" />
                                        {successMessage}
                                    </span>
                                </div>
                            )}
                        </div>
                    </article>

                    <article className="dashboard-section-frame p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Risultati matching</h2>
                                <p className="text-sm text-slate-600">{matches.length > 0 ? `${matches.length} concorsi consigliati` : 'Nessun risultato disponibile per ora'}</p>
                            </div>
                            <Badge variant="secondary">{matches.length} risultati</Badge>
                        </div>

                        <div className="mt-4 space-y-3">
                            {matches.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-10 text-center">
                                    <FileText className="mx-auto h-8 w-8 text-slate-400" />
                                    <p className="mt-2 text-sm text-slate-600">
                                        Dopo il caricamento vedrai qui i concorsi piu rilevanti con il relativo punteggio di compatibilita.
                                    </p>
                                </div>
                            ) : (
                                matches.map((match) => (
                                    <article
                                        key={match.id}
                                        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#0A4E88]/10 blur-2xl" />
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-base font-semibold text-slate-900">{match.title}</h3>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {[match.ente, match.location].filter(Boolean).join(' • ') || 'Dettagli in aggiornamento'}
                                                </p>
                                            </div>
                                            {match.score != null && (
                                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                                    {match.score}% fit
                                                </span>
                                            )}
                                        </div>

                                        {(match.deadline || match.reason) && (
                                            <div className="mt-2 space-y-1 text-sm text-slate-600">
                                                {match.deadline && <p><span className="font-semibold text-slate-700">Scadenza:</span> {match.deadline}</p>}
                                                {match.reason && <p>{match.reason}</p>}
                                            </div>
                                        )}

                                        {match.href && (
                                            <Link
                                                href={match.href}
                                                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0A4E88] transition hover:text-[#0E2F50]"
                                            >
                                                Apri dettaglio concorso
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        )}
                                    </article>
                                ))
                            )}
                        </div>
                    </article>
                </section>
            </div>
        </div>
    );
}
