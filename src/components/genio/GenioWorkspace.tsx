'use client';

import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  Crown,
  FileText,
  Lock,
  ShieldCheck,
  Sparkles,
  User,
  WandSparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Profile, UserTier } from '@/types/profile';
import type { Concorso } from '@/types/concorso';
import { createClient } from '@/lib/supabase/client';
import { ConcorsoCard } from '@/components/concorsi/ConcorsoCard';

type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  content: string;
  linkedConcorsi?: Concorso[];
}

interface GenioWorkspaceProps {
  tier: UserTier;
  profile: Partial<Profile> | null;
  userName?: string | null;
  userAvatarUrl?: string | null;
}

const quickActions = [
  {
    icon: Sparkles,
    label: 'Esito idoneità + gap da colmare',
    text: 'Analizza questo bando e rispondi in 4 blocchi: 1) Esito idoneita (Idoneo/Da verificare/Non idoneo) con motivazione, 2) Requisiti mancanti, 3) Documenti da preparare, 4) Piano di candidatura in 7 giorni.',
  },
  {
    icon: FileText,
    label: 'Sintesi bando in formato decisionale',
    text: 'Riassumi questo bando in formato decisionale: obiettivo del ruolo, requisiti, prove, scadenze, rischi principali, poi chiudi con "Cosa fare oggi" in 5 punti.',
  },
  {
    icon: BookOpen,
    label: 'Piano studio 4 settimane (10h/settimana)',
    text: 'Crea un piano studio di 4 settimane da 10 ore/settimana: argomenti prioritari, esercitazioni, simulazioni e checkpoint di verifica ogni domenica.',
  },
  {
    icon: WandSparkles,
    label: 'PEC completa con campi da compilare',
    text: 'Scrivi una PEC formale per richiesta chiarimenti all\'ente con: oggetto, testo pronto, elenco allegati, campi da personalizzare e tono istituzionale.',
  },
];

const initialMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Ciao, sono **Genio Pro**. Ti aiuto a capire rapidamente se un bando fa per te e cosa fare subito per candidarti al meglio. Scrivi il tuo obiettivo o incolla il testo del bando.',
};

const loadingMessages = [
  'Sto leggendo il bando e i requisiti principali...',
  'Verifico vincoli, scadenze e punti critici...',
  'Preparo un output operativo, pronto da usare...',
  'Analizzo riferimenti normativi e dettagli utili...',
  'Incrocio il tuo profilo con le priorita del bando...',
];

const CONCORSI_CHAT_SELECT = `
  concorso_id, status, status_label, slug, titolo, titolo_breve,
  num_posti, tipo_procedura, is_remote, data_pubblicazione, data_scadenza,
  ente_nome, ente_slug, favicon_url, regioni_array, province_array, sedi,
  categorie, settori, link_sito_pa, link_reindirizzamento, link_allegati,
  "allegatoCount", "allegatoMediaIds", is_active, created_at
`;

const CONCORSI_MAX_CARDS = 6;

function extractConcorsoIds(content: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const push = (candidate: string) => {
    const normalized = candidate.trim().toLowerCase();
    if (!normalized) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    ids.push(candidate.trim());
  };

  const labeledRegex = /concorso[_\s-]*id\s*[:=]\s*([a-z0-9-]{16,64})/gi;
  let labeledMatch: RegExpExecArray | null;
  while ((labeledMatch = labeledRegex.exec(content)) !== null) {
    if (labeledMatch[1]) push(labeledMatch[1]);
  }

  const hexRegex = /\b[a-f0-9]{32}\b/gi;
  let hexMatch: RegExpExecArray | null;
  while ((hexMatch = hexRegex.exec(content)) !== null) {
    if (hexMatch[0]) push(hexMatch[0]);
  }

  return ids;
}

function sanitizeAssistantContent(content: string, hasLinkedConcorsi: boolean): string {
  const normalizedInput = content
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ');

  // Remove repeated "bando detail" blocks even when they come as markdown bullets/bold labels.
  const withoutRepeatedBlocks = normalizedInput.replace(
    /(?:^|\n)\s*(?:>\s*)?(?:[-*•]\s*)?(?:\*\*)?\s*Titolo del bando\s*(?:\*\*)?\s*:[\s\S]*?(?=(?:\n\s*(?:>\s*)?(?:[-*•]\s*)?(?:\*\*)?\s*Titolo del bando\s*(?:\*\*)?\s*:)|\n\s*(?:Se vuoi|Posso |Scrivi la tua richiesta|$))/gi,
    '\n'
  );

  const rowPrefixes = [
    'titolo del bando',
    'ente',
    'concorso id',
    'stato',
    'posti',
    'sede',
    'scadenza',
    'link diretto',
    'figura ricercata',
    'titolo di studio richiesto',
    'tipo di procedura',
    'requisiti principali',
  ];

  const withoutRows = withoutRepeatedBlocks
    .split('\n')
    .filter((line) => {
      const trimmedLine = line.trim();
      const cleanedForEntityCheck = trimmedLine
        .replace(/^(?:>\s*)?/, '')
        .replace(/^#{1,6}\s*/, '')
        .replace(/^(?:[-*•]\s*|\d+[.)]\s*)\s*/, '')
        .replace(/^\((?:\d+)\)\s*/, '')
        .replace(/\*\*/g, '')
        .trim();
      const normalized = line
        .trim()
        .toLowerCase()
        .replace(/^(?:>\s*)?/, '')
        .replace(/^#{1,6}\s*/, '')
        .replace(/^(?:[-*•]\s*|\d+\.\s*)/, '')
        .replace(/^\d+\)\s*/, '')
        .replace(/\*\*/g, '');
      if (!normalized) return true;
      if (normalized === 'i più pertinenti sono:' || normalized === 'i piu pertinenti sono:') return false;
      // Cleanup leftover list fragments like: "1) Comune di Cordignano"
      const isOrphanEntityListItem =
        /^(?:comune|provincia|regione|ministero|ente|citt[aà]\s+metropolitana|unione\s+dei\s+comuni)\b/i.test(cleanedForEntityCheck) &&
        !cleanedForEntityCheck.includes(':') &&
        cleanedForEntityCheck.split(/\s+/).length <= 10;
      if (isOrphanEntityListItem) return false;
      const isSingleEntityEnumeratedLine =
        /^(?:>\s*)?(?:#{1,6}\s*)?(?:[-*•]\s*|\d+[.)]\s*)\s*(?:\*\*)?\s*(?:comune|provincia|regione|ministero|ente|citt[aà]\s+metropolitana|unione\s+dei\s+comuni)\b/i.test(trimmedLine) &&
        !trimmedLine.includes(':');
      if (isSingleEntityEnumeratedLine) return false;
      return !rowPrefixes.some((prefix) => normalized.startsWith(`${prefix}:`));
    })
    .join('\n');

  const withoutOrphanEntityLines = withoutRows.replace(
    /(?:^|\n)\s*(?:>\s*)?(?:#{1,6}\s*)?(?:[-*•]\s*|\d+[.)]\s*)?\s*(?:\*\*)?\s*(?:comune|provincia|regione|ministero|ente|citt[aà]\s+metropolitana|unione\s+dei\s+comuni)\b[^\n:]*/gi,
    '\n'
  );

  const withoutSections = withoutOrphanEntityLines
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!hasLinkedConcorsi) {
    return withoutSections || content.trim();
  }

  // Cards are rendered by UI; remove any model-generated "Bandi trovati nel contesto" text block.
  const withoutBandiTextBlock = withoutSections.replace(
    /(?:^|\n)\s*(?:#{1,6}\s*)?(?:\*\*)?\s*Bandi trovati nel contesto(?:\*\*)?\s*[\s\S]*?(?=\n\s*(?:Se vuoi|Posso)\b|$)/i,
    '\n'
  );

  // When cards are present, hide raw concorso IDs if the LLM leaks them inline.
  const withoutInlineIds = withoutBandiTextBlock
    .replace(/\b[a-f0-9]{32}\b\*{0,2}/gi, '')
    .replace(/\bconcorso[_\s-]*id\b\s*:?\s*/gi, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/(?:\s*:\s*){2,}/g, ': ')
    .replace(/:\s*(?=$)/gm, '')
    .replace(/\s{2,}/g, ' ');

  const cleanedLines = withoutInlineIds
    .split('\n')
    .filter((line) => {
      const compact = line.trim();
      if (!compact) return false;
      // Drop lines that become only punctuation/separators after ID removal.
      if (/^[:;,\-–—*#|.]+$/.test(compact)) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleanedLines || content.trim();
}

function splitAssistantSections(content: string): { lead: string; followUp: string } {
  const clean = content.trim();
  if (!clean) return { lead: '', followUp: '' };

  const lines = clean.split('\n');
  const followUpStart = lines.findIndex((line) =>
    /^\s*(?:[-*•]\s*)?(?:\*\*)?\s*(se vuoi|posso)\b/i.test(line.trim())
  );

  if (followUpStart === -1) {
    return { lead: clean, followUp: '' };
  }

  const lead = lines.slice(0, followUpStart).join('\n').trim();
  const followUp = lines.slice(followUpStart).join('\n').trim();
  return { lead, followUp };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeLeadEntityFragments(lead: string, linkedConcorsi: Concorso[] | undefined): string {
  if (!lead) return lead;
  if (!linkedConcorsi || linkedConcorsi.length === 0) return lead;

  const entityNames = Array.from(
    new Set(
      linkedConcorsi
        .map((item) => item.ente_nome?.trim())
        .filter((name): name is string => Boolean(name))
    )
  );

  if (entityNames.length === 0) return lead;

  const entityPattern = entityNames.map((name) => escapeRegExp(name)).join('|');
  const looseEntityLine = new RegExp(`\\b(?:${entityPattern})\\b`, 'i');

  const cleaned = lead
    .split('\n')
    .filter((rawLine) => {
      const line = rawLine.trim();
      if (!line) return true;

      const normalized = line
        .replace(/^(?:>\s*)?/, '')
        .replace(/^#{1,6}\s*/, '')
        .replace(/^\*\*(.*)\*\*$/, '$1')
        .replace(/^(?:[-*•]\s*|\d+[.)]\s*)/, '')
        .replace(/^\*\*(.*)\*\*$/, '$1')
        .trim();

      const isEnumerated = /^(?:>\s*)?(?:#{1,6}\s*)?(?:[-*•]\s*|\d+[.)]\s*)/.test(line);
      const looksLikeEntityOnly = !normalized.includes(':') && normalized.split(/\s+/).length <= 12;
      const hasKnownEntityName = looseEntityLine.test(normalized);
      const hasEntityKeyword = /^(?:comune|provincia|regione|ministero|ente|citt[aà]\s+metropolitana|unione\s+dei\s+comuni)\b/i.test(normalized);

      if (isEnumerated && looksLikeEntityOnly && (hasKnownEntityName || hasEntityKeyword)) {
        return false;
      }

      return true;
    })
    .join('\n');

  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

function getRandomLoadingMessage() {
  return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
}

function getTierTone(tier: UserTier): { hasAccess: boolean } {
  if (tier === 'pro' || tier === 'admin') return { hasAccess: true };
  return { hasAccess: false };
}

export function GenioWorkspace({ tier, userName, userAvatarUrl }: GenioWorkspaceProps) {
  const { hasAccess } = getTierTone(tier);

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [landingInput, setLandingInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  const landingTextareaRef = useRef<HTMLTextAreaElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const greeting = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) return 'Buongiorno';
    if (currentHour >= 12 && currentHour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  }, []);

  const greetingName = userName?.trim() || 'Concorsista';
  const supabase = useMemo(() => createClient(), []);

  const GenioBadge = ({ className = 'h-6 w-6' }: { className?: string }) => (
    <Image src="/fav.png" alt="Genio" width={24} height={24} className={className} />
  );

  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 50)}px`;
  };

  const pushMessage = (role: Role, content: string, linkedConcorsi: Concorso[] = []) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        role,
        content,
        linkedConcorsi,
      },
    ]);

    requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    });
  };

  const fetchConcorsiByIds = async (ids: string[]): Promise<Concorso[]> => {
    if (!ids.length) return [];

    const unique = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean))).slice(0, CONCORSI_MAX_CARDS);
    if (!unique.length) return [];

    const { data, error } = await supabase
      .from('concorsi')
      .select(CONCORSI_CHAT_SELECT)
      .in('concorso_id', unique);

    if (error) {
      console.error('[genio workspace] concorso fetch error', error);
      return [];
    }

    const rows = (data as Concorso[]) ?? [];
    const orderMap = new Map(unique.map((id, index) => [id.toLowerCase(), index]));
    return rows.sort((a, b) => {
      const first = orderMap.get(a.concorso_id.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const second = orderMap.get(b.concorso_id.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      return first - second;
    });
  };

  const runSubmission = async (rawText: string) => {
    if (isLoading) return;

    const text = rawText.trim();
    if (!text) return;

    setHasStarted(true);

    if (text) {
      pushMessage('user', text);
    }
    setLoadingMessage(getRandomLoadingMessage());
    setIsLoading(true);

    const formData = new FormData();
    formData.append('chatInput', text);
    formData.append('sessionId', 'concoro_genio');

    try {
      const response = await fetch('/api/genio', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || `Errore HTTP ${response.status}`);
      }

      const assistantReply = result.reply || "Ho completato l'analisi.";
      const linkedConcorsoIds = extractConcorsoIds(assistantReply);
      const linkedConcorsi = linkedConcorsoIds.length > 0 ? await fetchConcorsiByIds(linkedConcorsoIds) : [];
      pushMessage('assistant', assistantReply, linkedConcorsi);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore di connessione.';
      pushMessage('assistant', `Si e verificato un errore di connessione. Dettaglio: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const submitLanding = async () => {
    const text = landingInput.trim();
    await runSubmission(text);
    setLandingInput('');
    autoResize(landingTextareaRef.current);
  };

  const submitChat = async (e: FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    await runSubmission(text);
    setChatInput('');
    autoResize(chatTextareaRef.current);
  };

  const handleEnter = (
    e: KeyboardEvent<HTMLTextAreaElement>,
    source: 'landing' | 'chat'
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (source === 'landing') {
        void submitLanding();
      } else {
        void runSubmission(chatInput);
        setChatInput('');
        autoResize(chatTextareaRef.current);
      }
    }
  };

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
                  Genio trasforma ogni bando in
                  <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                    un piano d&apos;azione chiaro
                  </span>
                  per candidarti con metodo.
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
                  Con Pro ottieni analisi dei requisiti, sintesi operative, bozze pronte all&apos;uso e supporto continuo direttamente nel tuo hub.
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <Link
                    href="/pricing"
                    className="group inline-flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Attiva Pro ora
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/hub/profile"
                    className="group inline-flex items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Completa il tuo profilo
                    <ShieldCheck className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500">Con Genio Pro puoi fare</p>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-[#0A4E88]" />
                    Sintesi immediata di bandi, allegati e PDF complessi
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-[#0A4E88]" />
                    Check idoneita con rischi, priorita e prossime mosse
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-[#0A4E88]" />
                    Bozze guidate per PEC, email e richieste ufficiali
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="dashboard-section-frame overflow-hidden p-5 sm:p-6">
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 z-20 rounded-2xl bg-gradient-to-b from-white/25 via-white/60 to-white/90 backdrop-blur-[2px]" />
              <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 -translate-y-1/2 text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm">
                  <Crown className="h-4 w-4" />
                  Sblocca Genio Pro
                </span>
              </div>
              <div className="space-y-3">
                {['Dammi esito idoneita, requisiti mancanti e piano in 7 giorni', 'Trasforma il bando in checklist con scadenze e rischi', 'Scrivi una PEC pronta da inviare con campi da compilare'].map((item, index) => (
                  <article key={item} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">Esempio {index + 1}</p>
                    <p className="mt-2 text-sm font-medium text-slate-800">{item}</p>
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
        {!hasStarted ? (
          <section className="dashboard-section-frame relative h-[92vh] overflow-hidden p-4 sm:p-6 lg:p-7">
            <div className="pointer-events-none absolute -left-24 top-0 h-56 w-56 rounded-full bg-[#0A4E88]/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 bottom-10 h-44 w-44 rounded-full bg-cyan-200/40 blur-3xl" />

            <div className="relative mx-auto flex h-full w-full max-w-4xl flex-col justify-center">
              <header className="mx-auto mb-7 max-w-2xl text-center">
                <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.85rem]">
                  {greeting}, {greetingName}.
                  <span className="mt-1 block bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                    Cosa vuoi costruire oggi con Genio?
                  </span>
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-700 sm:text-base">
                  Cerca un concorso o descrivi il tuo obiettivo. Genio ti restituisce subito una risposta operativa: idoneita, rischi, checklist documenti e prossime azioni.
                </p>
              </header>

              <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200/95 bg-white/90 p-2.5 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] backdrop-blur sm:p-3">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-1.5 sm:p-2">
                  <textarea
                    ref={landingTextareaRef}
                    rows={1}
                    value={landingInput}
                    onChange={(e) => {
                      setLandingInput(e.target.value);
                      autoResize(landingTextareaRef.current);
                    }}
                    onKeyDown={(e) => handleEnter(e, 'landing')}
                    className="min-h-[56px] max-h-[180px] w-full resize-none border-0 bg-transparent px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 outline-none"
                    placeholder="Cerca un concorso o scrivi il tuo obiettivo: esito idoneita, checklist documenti, piano in 7 giorni"
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-end px-1 pb-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => void submitLanding()}
                      className="rounded-lg bg-slate-900 p-2 text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                      disabled={isLoading || !landingInput.trim()}
                    >
                      <ArrowUp className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mx-auto mt-5 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      setHasStarted(true);
                      void runSubmission(action.text);
                    }}
                    className="flex min-h-[42px] w-full items-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-2.5 py-2 text-left text-[11px] font-semibold leading-tight text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-800"
                    disabled={isLoading}
                  >
                    <action.icon className="h-3.5 w-3.5 shrink-0 text-[#0A4E88]" />
                    <span className="line-clamp-2">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="h-[92vh]">
            <article className="dashboard-section-frame relative h-full overflow-hidden">
              <div
                ref={messagesRef}
                className="h-full overflow-y-auto px-5 py-6 pb-40 sm:px-6"
              >
                <div className="sticky top-0 z-30 -mx-5 mb-5 px-5 pt-1.5 sm:-mx-6 sm:px-6 sm:pt-2">
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white/65 px-3 py-2.5 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.78)] backdrop-blur-xl sm:px-4">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/70 via-white/45 to-sky-100/20" />
                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <GenioBadge className="h-6 w-6" />
                        Sessione attiva
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMessages([initialMessage]);
                          setChatInput('');
                          setLandingInput('');
                          setHasStarted(false);
                        }}
                        className="rounded-lg border border-slate-200/90 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        disabled={isLoading}
                      >
                        Nuova chat
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          message.role === 'assistant' ? 'text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <GenioBadge className="h-8 w-8" />
                        ) : userAvatarUrl ? (
                          <Image
                            src={userAvatarUrl}
                            alt="Foto profilo"
                            width={32}
                            height={32}
                            unoptimized
                            className="h-8 w-8 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>

                      <div
                        className={`rounded-xl border p-4 text-sm leading-relaxed ${
                          message.role === 'assistant'
                            ? 'max-w-[95%] border-slate-200 bg-slate-50/70 text-slate-900 lg:max-w-[92%]'
                            : 'max-w-[88%] border-slate-200 bg-white text-slate-900'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <div className="space-y-4">
                            {(() => {
                              const cleanedContent = sanitizeAssistantContent(
                                message.content,
                                Boolean(message.linkedConcorsi && message.linkedConcorsi.length > 0)
                              );
                              const { lead, followUp } = splitAssistantSections(cleanedContent);
                              const cleanedLead = removeLeadEntityFragments(lead, message.linkedConcorsi);

                              return (
                                <>
                                  {cleanedLead && (
                                    <div className="prose prose-sm prose-slate max-w-none prose-p:mb-3 prose-p:last:mb-0">
                                      <ReactMarkdown>{cleanedLead}</ReactMarkdown>
                                    </div>
                                  )}

                                  {message.linkedConcorsi && message.linkedConcorsi.length > 0 && (
                                    <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-white/80 p-3">
                                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.09em] text-slate-500">
                                        <Sparkles className="h-3.5 w-3.5 text-[#0A4E88]" />
                                        Bandi trovati nel contesto
                                      </div>
                                      <div className="grid grid-cols-1 gap-3">
                                        {message.linkedConcorsi.map((concorso) => (
                                          <ConcorsoCard
                                            key={`chat_concorso_${message.id}_${concorso.concorso_id}`}
                                            concorso={concorso}
                                            detailBasePath="/hub/concorsi"
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {followUp && (
                                    <div className="prose prose-sm prose-slate max-w-none prose-p:mb-3 prose-p:last:mb-0">
                                      <ReactMarkdown>{followUp}</ReactMarkdown>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-2 px-11 text-sm text-slate-500">
                      <GenioBadge className="h-4 w-4 animate-pulse" />
                      {loadingMessage}
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200/90 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
                <form
                  onSubmit={submitChat}
                  className="relative rounded-xl border border-slate-200 bg-white p-2"
                >
                  <textarea
                    ref={chatTextareaRef}
                    rows={1}
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      autoResize(chatTextareaRef.current);
                    }}
                    onKeyDown={(e) => handleEnter(e, 'chat')}
                    className="min-h-[50px] max-h-[150px] w-full resize-none border-0 bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                    placeholder="Scrivi obiettivo, domanda o incolla il testo del bando..."
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-end px-2 pb-1 pt-1">
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 p-2 text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                      disabled={isLoading || !chatInput.trim()}
                    >
                      <ArrowUp className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </div>
            </article>
          </section>
        )}
      </div>
    </div>
  );
}
