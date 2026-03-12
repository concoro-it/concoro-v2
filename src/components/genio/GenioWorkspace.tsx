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
  Paperclip,
  ShieldCheck,
  Sparkles,
  User,
  WandSparkles,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import type { Profile, UserTier } from '@/types/profile';

type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  content: string;
  isFile?: boolean;
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
    label: 'Valuta la mia idoneita per il concorso selezionato',
    text: 'Valuta la mia idoneita per il concorso selezionato e dimmi cosa devo rafforzare nel profilo.',
  },
  {
    icon: FileText,
    label: 'Riassumi questo bando in 5 punti pratici',
    text: 'Riassumi questo bando in 5 punti pratici e dimmi le priorita operative.',
  },
  {
    icon: BookOpen,
    label: 'Crea un piano studio settimanale',
    text: 'Crea un piano di studio settimanale da 10 ore per prepararmi alla prova scritta.',
  },
  {
    icon: WandSparkles,
    label: 'Bozza email PEC per richiesta chiarimenti',
    text: 'Scrivi una bozza di email PEC elegante per richiedere chiarimenti all\'ente.',
  },
];

const initialMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Ciao, sono **Genio Pro**. Posso aiutarti con analisi di bandi, documenti e strategia di preparazione. Carica un file o scrivi la tua richiesta.',
};

const loadingMessages = [
  'Sto sincronizzando i dettagli del bando...',
  'Controllo requisiti e vincoli in tempo reale...',
  'Sto costruendo una risposta operativa per te...',
  'Analisi normativa in corso, un attimo...',
  'Incrocio contenuto documento e priorita del profilo...',
];

function getRandomLoadingMessage() {
  return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
}

function getTierTone(tier: UserTier): { label: string; hasAccess: boolean } {
  if (tier === 'pro' || tier === 'admin') return { label: tier === 'admin' ? 'Admin' : 'Pro', hasAccess: true };
  if (tier === 'free') return { label: 'Gratuito', hasAccess: false };
  return { label: 'Ospite', hasAccess: false };
}

function getProfileSignals(profile: Partial<Profile> | null): string[] {
  if (!profile) return [];

  const roleSignal = profile.profilo_professionale ?? null;
  const titleSignal = profile.titolo_studio ?? null;
  const locationSignal = profile.provincia_interesse ?? profile.regione_interesse ?? null;
  const sectorSignals = profile.settori_interesse?.slice(0, 2) ?? [];

  return [
    roleSignal,
    titleSignal,
    locationSignal ? `Area: ${locationSignal}` : null,
    ...sectorSignals,
  ].filter((item): item is string => Boolean(item && item.trim().length > 0));
}

export function GenioWorkspace({ tier, profile, userName, userAvatarUrl }: GenioWorkspaceProps) {
  const { label: tierLabel, hasAccess } = getTierTone(tier);
  const profileSignals = getProfileSignals(profile);

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [landingInput, setLandingInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const GenioBadge = ({ className = 'h-6 w-6' }: { className?: string }) => (
    <Image src="/fav.png" alt="Genio" width={24} height={24} className={className} />
  );

  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 50)}px`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const pushMessage = (role: Role, content: string, isFile = false) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        role,
        content,
        isFile,
      },
    ]);

    requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    });
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setHasStarted(true);
    requestAnimationFrame(() => {
      chatTextareaRef.current?.focus();
      autoResize(chatTextareaRef.current);
    });
  };

  const runSubmission = async (rawText: string) => {
    if (isLoading) return;

    const text = rawText.trim();
    if (!text && !selectedFile) return;

    setHasStarted(true);

    if (text) {
      pushMessage('user', text);
    }

    if (selectedFile) {
      pushMessage('user', selectedFile.name, true);
    }

    const fileToSend = selectedFile;
    removeFile();
    setLoadingMessage(getRandomLoadingMessage());
    setIsLoading(true);

    const formData = new FormData();
    formData.append('chatInput', text || 'Analizza questo documento.');
    formData.append('sessionId', 'concoro_genio');
    if (fileToSend) {
      formData.append('data0', fileToSend);
    }

    try {
      const response = await fetch('/api/genio', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || `Errore HTTP ${response.status}`);
      }

      pushMessage('assistant', result.reply || "Ho completato l'analisi.");
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
                    passi chiari e azionabili
                  </span>
                  per candidarti meglio.
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
                  Con Pro ottieni analisi documentale, sintesi operative, bozze testuali e supporto strategico continuo dentro il tuo hub.
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
                  <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Genio bloccato</Badge>
                </div>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-[#0A4E88]" />
                    Riassunti istantanei di bandi, allegati e PDF complessi
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-[#0A4E88]" />
                    Piano operativo personalizzato in base al tuo profilo
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-[#0A4E88]" />
                    Bozze e risposte guidate per comunicazioni ufficiali
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
                  Sblocca Genio con Pro
                </span>
              </div>
              <div className="space-y-3">
                {['Riassumi questo bando e dammi i rischi principali', 'Crea una checklist per candidatura entro la scadenza', 'Scrivi una bozza PEC per richiesta chiarimenti'].map((item, index) => (
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
                <span className="inline-flex items-center gap-2 rounded-full border border-[#0A4E88]/25 bg-[#0A4E88]/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#0A4E88]">
                  <WandSparkles className="h-3.5 w-3.5" />
                  Genio Pro
                </span>
                <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] mt-4 text-3xl leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.85rem]">
                  {greeting}, {greetingName}.
                  <span className="mt-1 block bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                    Cosa vuoi costruire oggi con Genio?
                  </span>
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-700 sm:text-base">
                  Chat-first workspace: scrivi il tuo obiettivo, allega i documenti e ottieni output operativi subito pronti da usare.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Badge variant="secondary">Tier: {tierLabel}</Badge>
                  <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Accesso attivo</Badge>
                </div>
                {profileSignals.length > 0 && (
                  <div className="mx-auto mt-3 flex max-w-xl flex-wrap items-center justify-center gap-2">
                    {profileSignals.map((signal) => (
                      <span
                        key={signal}
                        className="rounded-full border border-slate-300 bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                )}
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
                    placeholder="Scrivi un prompt: analizza un bando, crea una checklist, prepara una strategia..."
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between px-1 pb-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
                      disabled={isLoading}
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void submitLanding()}
                      className="rounded-lg bg-slate-900 p-2 text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                      disabled={isLoading || (!landingInput.trim() && !selectedFile)}
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
                <div className="sticky top-0 z-20 -mx-5 mb-5 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <GenioBadge className="h-6 w-6" />
                    Conversazione attiva
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMessages([initialMessage]);
                      setSelectedFile(null);
                      setChatInput('');
                      setLandingInput('');
                      setHasStarted(false);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    disabled={isLoading}
                  >
                    Nuova sessione
                  </button>
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
                          <img
                            src={userAvatarUrl}
                            alt="Foto profilo"
                            className="h-8 w-8 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>

                      <div
                        className={`max-w-[88%] rounded-xl border p-4 text-sm leading-relaxed ${
                          message.role === 'assistant'
                            ? 'border-slate-200 bg-slate-50/70 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-900'
                        }`}
                      >
                        {message.isFile ? (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[#0A4E88]" />
                            <span className="font-medium">{message.content}</span>
                          </div>
                        ) : message.role === 'assistant' ? (
                          <div className="prose prose-sm prose-slate max-w-none prose-p:mb-3 prose-p:last:mb-0">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
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
                {selectedFile && (
                  <div className="mb-3 inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="rounded-md bg-slate-100 p-2 text-[#0A4E88]">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="max-w-[240px] truncate text-xs font-medium text-slate-900">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="rounded-md bg-slate-100 p-1 text-slate-500 hover:text-slate-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

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
                    placeholder="Scrivi la tua richiesta..."
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between px-2 pb-1 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
                      disabled={isLoading}
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 p-2 text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                      disabled={isLoading || (!chatInput.trim() && !selectedFile)}
                    >
                      <ArrowUp className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </div>
            </article>
          </section>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}
