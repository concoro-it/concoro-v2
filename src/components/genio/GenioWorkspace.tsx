'use client';

import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowUp,
  BookOpen,
  FileText,
  Paperclip,
  Scale,
  User,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  content: string;
  isFile?: boolean;
}

const quickActions = [
  {
    icon: Scale,
    label: 'Quali concorsi posso fare con il mio titolo di studio?',
    text: 'Quali concorsi posso fare con il mio titolo di studio?',
  },
  {
    icon: FileText,
    label: 'Come posso prepararmi per una prova scritta?',
    text: 'Come posso prepararmi per una prova scritta?',
  },
  {
    icon: BookOpen,
    label: "Quali sono i concorsi piu facili da superare quest'anno?",
    text: "Quali sono i concorsi piu facili da superare quest'anno?",
  },
  {
    icon: BookOpen,
    label: 'Dammi un consiglio per organizzare lo studio.',
    text: 'Dammi un consiglio per organizzare lo studio.',
  },
];

const initialMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Ciao, sono **Genio**. Posso aiutarti con analisi documentale, revisione contratti e ricerca normativa. Carica un file o scrivi la tua richiesta per iniziare.',
};

const loadingMessages = [
  'Sto incollando la marca da bollo digitale...',
  'Sfogliando la Gazzetta Ufficiale alla velocita della luce...',
  'Navigando nel labirinto della burocrazia per te...',
  'Niente fila allo sportello: Genio e gia al lavoro!',
  'Verificando i requisiti nel database di Concoro...',
];

function getRandomLoadingMessage() {
  return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
}

interface GenioWorkspaceProps {
  userName?: string | null;
  userAvatarUrl?: string | null;
}

export function GenioWorkspace({ userName, userAvatarUrl }: GenioWorkspaceProps) {
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

  const greetingName = userName?.trim() || 'Avvocato';
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
      pushMessage('assistant', `Si è verificato un errore di connessione. Dettaglio: ${errorMessage}`);
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

  return (
    <div className="container max-w-container">
      <div className="relative overflow-hidden">
        <div className="absolute top-8 left-1/3 h-80 w-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        {!hasStarted ? (
          <section className="relative z-10 flex min-h-[72vh] flex-col items-center justify-center p-6 text-center">
            <div className="mb-10 w-full max-w-3xl">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-muted/40 shadow-sm">
                <GenioBadge />
              </div>
              <h1 className="mb-1 text-3xl sm:text-4xl tracking-tight text-foreground">
                {greeting}, {greetingName}.
              </h1>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                Genio e qui per aiutarti a trovare il concorso giusto per te.
              </h2>
              <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground">
                Sono qui per semplificare il tuo lavoro legale. Analizza documenti, crea bozze o fai una domanda.
              </p>
            </div>

            <div className="w-full max-w-2xl rounded-xl border border-border bg-background p-2 shadow-sm">
              <textarea
                ref={landingTextareaRef}
                rows={1}
                value={landingInput}
                onChange={(e) => {
                  setLandingInput(e.target.value);
                  autoResize(landingTextareaRef.current);
                }}
                onKeyDown={(e) => handleEnter(e, 'landing')}
                className="min-h-[50px] max-h-[150px] w-full resize-none border-0 bg-transparent px-4 py-3 text-base text-foreground placeholder:text-muted-foreground outline-none"
                placeholder="Cosa facciamo oggi?"
                disabled={isLoading}
              />
              <div className="flex items-center justify-between px-2 pb-1 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
                  disabled={isLoading}
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => void submitLanding()}
                  className="rounded-lg bg-primary p-2 text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
                  disabled={isLoading || (!landingInput.trim() && !selectedFile)}
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      setHasStarted(true);
                      void runSubmission(action.text);
                    }}
                    className="flex w-full items-start gap-2 rounded-xl bg-slate-50 p-4 text-left text-sm text-foreground transition-colors hover:bg-slate-100"
                    disabled={isLoading}
                  >
                    <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="relative z-10 flex h-[94vh] flex-col">
            <div ref={messagesRef} className="flex-1 overflow-y-auto p-6 pt-8 space-y-5 pb-36">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      message.role === 'assistant' ? ' text-primary' : 'bg-muted text-muted-foreground'
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
                        ? 'bg-muted/30 border-border text-foreground'
                        : 'bg-background border-border text-foreground'
                    }`}
                  >
                    {message.isFile ? (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-11">
                  <GenioBadge className="h-4 w-4 animate-pulse" />
                  {loadingMessage}
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-card/25 backdrop-blur">
              <div className="mx-auto max-w-3xl">
                {selectedFile && (
                  <div className="mb-3 inline-flex items-center gap-3 rounded-lg border border-border bg-background p-3 shadow-sm">
                    <div className="rounded-md bg-secondary p-2 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="max-w-[240px] truncate text-xs font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="rounded-md bg-secondary p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={submitChat}
                  className="relative rounded-xl border bg-card/95 border-border p-2"
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
                    className="min-h-[50px] max-h-[150px] w-full resize-none border-0 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    placeholder="Scrivi la tua richiesta..."
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between px-2 pb-1 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
                      disabled={isLoading}
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-primary p-2 text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
                      disabled={isLoading || (!chatInput.trim() && !selectedFile)}
                    >
                      <ArrowUp className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
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
