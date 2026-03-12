'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Loader2, Send } from 'lucide-react';

type SupportContactFormProps = {
  initialName?: string;
  initialEmail?: string;
};

type SubmitState =
  | { status: 'idle'; message: '' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

type FormValues = {
  name: string;
  email: string;
  category: string;
  subject: string;
  pageUrl: string;
  message: string;
};

const DEFAULT_VALUES: FormValues = {
  name: '',
  email: '',
  category: 'tecnico',
  subject: '',
  pageUrl: '',
  message: '',
};

const CATEGORY_OPTIONS = [
  { value: 'tecnico', label: 'Problema tecnico' },
  { value: 'abbonamento', label: 'Abbonamento e pagamenti' },
  { value: 'account', label: 'Account e accesso' },
  { value: 'concorsi', label: 'Concorsi e contenuti' },
  { value: 'feedback', label: 'Feedback e suggerimenti' },
  { value: 'altro', label: 'Altro' },
] as const;

const MAX_MESSAGE_LENGTH = 2200;

export function SupportContactForm({ initialName = '', initialEmail = '' }: SupportContactFormProps) {
  const [values, setValues] = useState<FormValues>({
    ...DEFAULT_VALUES,
    name: initialName,
    email: initialEmail,
  });
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle', message: '' });

  const remainingChars = useMemo(
    () => MAX_MESSAGE_LENGTH - values.message.length,
    [values.message.length]
  );

  const onFieldChange =
    (field: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const nextValue = event.target.value;
      if (field === 'message' && nextValue.length > MAX_MESSAGE_LENGTH) {
        return;
      }
      setValues((previous) => ({ ...previous, [field]: nextValue }));
    };

  const resetAfterSuccess = () => {
    setValues((previous) => ({
      ...DEFAULT_VALUES,
      name: previous.name,
      email: previous.email,
    }));
    setConsent(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!consent) {
      setSubmitState({ status: 'error', message: 'Devi autorizzare il trattamento dati per inviare la richiesta.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitState({ status: 'idle', message: '' });

    try {
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Invio non riuscito. Riprova tra qualche minuto.');
      }

      setSubmitState({
        status: 'success',
        message: payload.message || 'Messaggio inviato. Ti risponderemo al piu presto.',
      });
      resetAfterSuccess();
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Errore inatteso durante l\'invio.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.5rem] border border-slate-200/90 bg-white/92 p-5 shadow-[0_24px_42px_-34px_rgba(2,6,23,0.45)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Apri una richiesta</h2>
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-600">
          <Send className="h-3.5 w-3.5" />
          Support ticket
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-slate-700">Nome e cognome</span>
          <input
            required
            type="text"
            name="name"
            value={values.name}
            onChange={onFieldChange('name')}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
            placeholder="Es. Giulia Rossi"
          />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-slate-700">Email di risposta</span>
          <input
            required
            type="email"
            name="email"
            value={values.email}
            onChange={onFieldChange('email')}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
            placeholder="nome@dominio.it"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-[0.85fr_1.15fr]">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-slate-700">Categoria</span>
          <select
            required
            name="category"
            value={values.category}
            onChange={onFieldChange('category')}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-slate-700">Oggetto</span>
          <input
            required
            type="text"
            name="subject"
            value={values.subject}
            onChange={onFieldChange('subject')}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
            placeholder="Es. Errore durante il salvataggio di un concorso"
          />
        </label>
      </div>

      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-slate-700">Link della pagina (opzionale)</span>
        <input
          type="url"
          name="pageUrl"
          value={values.pageUrl}
          onChange={onFieldChange('pageUrl')}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
          placeholder="https://concoro.it/hub/..."
        />
      </label>

      <label className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-slate-700">Messaggio</span>
          <span className={`text-xs ${remainingChars < 180 ? 'text-amber-700' : 'text-slate-500'}`}>
            {remainingChars} caratteri disponibili
          </span>
        </div>
        <textarea
          required
          name="message"
          value={values.message}
          onChange={onFieldChange('message')}
          rows={7}
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
          placeholder="Descrivi il problema in modo dettagliato: cosa stavi facendo, cosa ti aspettavi e cosa e successo."
        />
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-400 text-[#0A4E88] focus:ring-[#0A4E88]/25"
        />
        <span>
          Autorizzo il trattamento dei dati forniti esclusivamente per la gestione di questa richiesta di assistenza.
        </span>
      </label>

      {submitState.status !== 'idle' ? (
        <div
          className={`rounded-xl border px-3.5 py-2.5 text-sm ${
            submitState.status === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {submitState.message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <p className="text-xs text-slate-500">Ti rispondiamo in genere entro 1 giorno lavorativo.</p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Invio in corso...
            </>
          ) : (
            <>
              Invia richiesta
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
