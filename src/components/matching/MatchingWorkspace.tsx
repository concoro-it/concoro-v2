'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Lock,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import type { Profile, UserTier } from '@/types/profile';
import type { Concorso } from '@/types/concorso';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingCircle } from '@/components/ui/loading-circle';
import { ConcorsoCard } from '@/components/concorsi/ConcorsoCard';

interface MatchingWorkspaceProps {
  userId: string;
  tier: UserTier;
  profile: Partial<Profile> | null;
}

type JsonObject = Record<string, unknown>;

interface MatchResult {
  concorsoId: string | null;
  id: string;
  title: string;
  ente: string | null;
  location: string | null;
  deadline: string | null;
  reason: string | null;
  score: number | null;
  href: string | null;
}

interface MatchedConcorsoCard {
  concorso: Concorso;
  score: number | null;
}

const CONCORSI_MATCH_SELECT = `
  concorso_id, status, status_label, slug, titolo, titolo_breve,
  descrizione, riassunto, num_posti, data_scadenza, data_pubblicazione,
  ente_nome, ente_slug, regioni_array, province_array,
  link_sito_pa, link_reindirizzamento, is_active, created_at
`;

function getMatchingSubmitUrl() {
  return '/api/matching/v2';
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
      const concorsoId = getStringValue(entry, ['concorso_id', 'id', 'concorsoId']);

      return {
        concorsoId,
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
    .filter((item): item is MatchResult => item !== null)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

function getTierTone(tier: UserTier): { label: string; hasAccess: boolean } {
  if (tier === 'pro' || tier === 'admin') return { label: tier === 'admin' ? 'Admin' : 'Pro', hasAccess: true };
  if (tier === 'free') return { label: 'Gratuito', hasAccess: false };
  return { label: 'Ospite', hasAccess: false };
}

export function MatchingWorkspace({ userId, tier, profile }: MatchingWorkspaceProps) {
  const { label: tierLabel, hasAccess } = getTierTone(tier);
  const loadingMessages = [
    'Sto leggendo il tuo CV in PDF...',
    'Sto incrociando profilo e preferenze...',
    'Sto calcolando il punteggio di compatibilità...',
    'Sto ordinando i bandi piu rilevanti...',
  ];

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [matchedCards, setMatchedCards] = useState<MatchedConcorsoCard[]>([]);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!isLoading) {
      setLoadingMessageIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);

    return () => window.clearInterval(timer);
  }, [isLoading, loadingMessages.length]);

  async function fetchConcorsiByIds(ids: string[]): Promise<Map<string, Concorso>> {
    const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
    if (!uniqueIds.length) return new Map();

    const { data, error } = await supabase
      .from('concorsi')
      .select(CONCORSI_MATCH_SELECT)
      .in('concorso_id', uniqueIds);

    if (error) {
      throw new Error(error.message || 'Errore nel recupero dei concorsi');
    }

    const map = new Map<string, Concorso>();
    for (const row of (data ?? []) as Concorso[]) {
      if (row?.concorso_id) {
        map.set(String(row.concorso_id), row);
      }
    }
    return map;
  }

  async function submitToN8n(file: File) {
    setIsLoading(true);
    setHasAnalyzed(true);
    setErrorMessage(null);
    setMatchedCards([]);

    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('request_id', crypto.randomUUID());
      formData.append('profile_json', JSON.stringify(profile ?? {}));
      formData.append('cv_pdf', file, file.name || 'cv.pdf');

      const response = await fetch(getMatchingSubmitUrl(), {
        method: 'POST',
        body: formData,
      });

      const rawText = await response.text();
      const parsedPayload: unknown = (() => {
        try {
          return JSON.parse(rawText);
        } catch {
          return rawText;
        }
      })();

      const parsedMatches = parseMatches(parsedPayload);
      const concorsoIds = parsedMatches
        .map((item) => item.concorsoId)
        .filter((id): id is string => Boolean(id));

      const concorsiMap = await fetchConcorsiByIds(concorsoIds);
      const cards: MatchedConcorsoCard[] = parsedMatches
        .map((item) => {
          if (!item.concorsoId) return null;
          const concorso = concorsiMap.get(item.concorsoId);
          if (!concorso) return null;
          return { concorso, score: item.score };
        })
        .filter((item): item is MatchedConcorsoCard => item !== null);

      setMatchedCards(cards);

      if (!response.ok) {
        const serverError =
          isObject(parsedPayload) && 'error' in parsedPayload
            ? String((parsedPayload as { error?: unknown }).error ?? '')
            : '';
        throw new Error(serverError || `HTTP ${response.status}`);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      setErrorMessage(message);
      setMatchedCards([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handlePickedFile(file: File | null) {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setErrorMessage('Formato non valido: carica un file PDF.');
      return;
    }

    setCvFile(file);
    void submitToN8n(file);
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    handlePickedFile(file);
  }

  function openFileDialog() {
    uploadInputRef.current?.click();
  }

  function onDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragActive) setIsDragActive(true);
  }

  function onDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(event.dataTransfer.files ?? []);
    if (!droppedFiles.length) return;
    handlePickedFile(droppedFiles[0] ?? null);
  }

  const hasResults = hasAnalyzed && matchedCards.length > 0;
  const isEmptyState = hasAnalyzed && matchedCards.length === 0;
  const shellAlignment = hasResults ? 'justify-start' : 'justify-center';

  if (!hasAccess) {
    return (
      <div className="dashboard-shell">
        <div className="dashboard-shell-overlay" />
        <div className="relative space-y-6 px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
          <section className="dashboard-section-frame overflow-hidden p-5 sm:p-6 lg:p-7">
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-amber-900">
                  <Lock className="h-3.5 w-3.5" />
                  Funzione Pro
                </span>
                <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl leading-[1.04] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.8rem]">
                  Trova il tuo bando ideale.
                  <br />
                  In pochi secondi.
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
                  Caricamento CV e abbinamento intelligente sono disponibili nel piano Pro.
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
                  <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Abbinamento bloccato</Badge>
                </div>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-[#0A4E88]" />
                    Caricamento CV con parsing automatico del PDF
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-[#0A4E88]" />
                    Abbinamenti ordinati per punteggio di compatibilità
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-[#0A4E88]" />
                    Avvisi radar su nuovi bandi compatibili
                  </li>
                </ul>
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
        <section className="dashboard-section-frame relative h-[92vh] overflow-hidden p-4 sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute -left-24 top-0 h-56 w-56 rounded-full bg-[#0A4E88]/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-10 h-44 w-44 rounded-full bg-cyan-200/40 blur-3xl" />

          <div className={`relative mx-auto flex h-full w-full max-w-4xl flex-col ${shellAlignment}`}>
            {isLoading ? (
              <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Analisi in corso</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 animate-pulse">{loadingMessages[loadingMessageIndex]}</p>
                <div className="mt-8 rounded-full bg-[#0A4E88]/5 p-3 animate-pulse">
                  <LoadingCircle className="h-[118px]" />
                </div>
              </div>
            ) : hasResults ? (
              <div className="mx-auto flex h-full w-full max-w-5xl min-h-0 flex-col overflow-hidden">
                <header className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Risultati abbinamento</h2>
                    <p className="mt-1 text-sm text-slate-600">Lista ordinata per punteggio di compatibilità</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (cvFile) void submitToN8n(cvFile);
                    }}
                    disabled={!cvFile}
                  >
                    Riprova
                  </Button>
                </header>

                <div className="scrollbar-hide mt-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
                  {matchedCards.map((item) => {
                    const baseText = (item.concorso.riassunto ?? item.concorso.descrizione ?? '').trim();
                    const enrichedSuffix = ' Profilo coerente con i requisiti principali e priorità dell\'abbinamento.';
                    const descriptionOverride = `${baseText}${enrichedSuffix}`.trim();

                    return (
                    <ConcorsoCard
                      key={item.concorso.concorso_id}
                      concorso={item.concorso}
                      detailBasePath="/hub/concorsi"
                      matchScore={item.score}
                      descriptionOverride={descriptionOverride}
                    />
                    );
                  })}
                </div>
              </div>
            ) : isEmptyState ? (
              <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)]">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Nessun concorso compatibile</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  Al momento non abbiamo trovato bandi attivi che superino la soglia minima di compatibilità con il tuo profilo.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/hub/scadenza/nuovi"
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Avvisami
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (cvFile) void submitToN8n(cvFile);
                      else openFileDialog();
                    }}
                  >
                    Riprova
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <header className="mx-auto mb-7 max-w-2xl text-center">
                  <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.85rem]">
                    Trova il tuo bando ideale.
                    <span className="mt-1 block bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                      In pochi secondi.
                    </span>
                  </h1>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-700 sm:text-base">
                    Carica il tuo CV. Analizziamo insieme il PDF e le tue preferenze profilo per restituirti una lista ordinata per punteggio di compatibilità
                  </p>
                </header>

                <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200/95 bg-white/90 p-2.5 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] backdrop-blur sm:p-3">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={openFileDialog}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openFileDialog();
                      }
                    }}
                    className={`rounded-2xl border border-dashed p-7 text-center transition ${
                      isDragActive
                        ? 'border-[#0A4E88]/55 bg-[#0A4E88]/10'
                        : 'border-slate-300 bg-white hover:border-[#0A4E88]/45 hover:bg-slate-50'
                    }`}
                  >
                    <Input
                      ref={uploadInputRef}
                      id="cv_pdf"
                      className="sr-only"
                      type="file"
                      accept="application/pdf"
                      onChange={onFileChange}
                      disabled={isLoading}
                    />

                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <span className="rounded-xl bg-[#0A4E88]/10 p-2 text-[#0A4E88]">
                        <UploadCloud className="h-6 w-6" />
                      </span>
                      <p className="mt-3 text-base font-semibold text-slate-900">
                        {cvFile ? cvFile.name : 'Trascina qui il tuo CV in PDF'}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {cvFile ? `${Math.ceil(cvFile.size / 1024)} KB` : 'oppure clicca per selezionare il file'}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={(event) => {
                          event.stopPropagation();
                          openFileDialog();
                        }}
                        disabled={isLoading}
                      >
                        Seleziona PDF
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mx-auto mt-5 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    'Formato consigliato: PDF testuale, non scannerizzato',
                    'Mantieni aggiornate le preferenze nel profilo',
                    'CV completo = ranking piu preciso',
                    'Nel prossimo step vedrai l analisi live',
                  ].map((tip) => (
                    <div
                      key={tip}
                      className="flex min-h-[42px] w-full items-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-2.5 py-2 text-left text-[11px] font-semibold leading-tight text-slate-600"
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#0A4E88]" />
                      <span className="line-clamp-2">{tip}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!isLoading && errorMessage && (
              <div className="mx-auto mt-4 w-full max-w-3xl space-y-2">
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <span className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    {errorMessage}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
