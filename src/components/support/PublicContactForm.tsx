'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Loader2, MailCheck } from 'lucide-react';

type SubmitState =
  | { status: 'idle'; message: '' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

type ContactFormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
  companyWebsite: string;
};

const DEFAULT_VALUES: ContactFormValues = {
  name: '',
  email: '',
  subject: '',
  message: '',
  companyWebsite: '',
};

const MAX_MESSAGE_LENGTH = 2200;

export function PublicContactForm() {
  const [values, setValues] = useState<ContactFormValues>(DEFAULT_VALUES);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle', message: '' });
  const [startedAt] = useState<number>(() => Date.now());
  const [websiteTrap, setWebsiteTrap] = useState('');

  const remainingChars = useMemo(() => MAX_MESSAGE_LENGTH - values.message.length, [values.message.length]);

  const onFieldChange =
    (field: keyof ContactFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      if (field === 'message' && nextValue.length > MAX_MESSAGE_LENGTH) {
        return;
      }
      setValues((previous) => ({ ...previous, [field]: nextValue }));
    };

  const resetForm = () => {
    setValues(DEFAULT_VALUES);
    setConsent(false);
    setWebsiteTrap('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!consent) {
      setSubmitState({
        status: 'error',
        message: 'Per inviare il messaggio devi autorizzare il trattamento dei dati.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitState({ status: 'idle', message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          websiteTrap,
          startedAt,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Invio non riuscito. Riprova tra qualche minuto.');
      }

      setSubmitState({
        status: 'success',
        message: payload.message || 'Messaggio inviato. Ti risponderemo il prima possibile.',
      });
      resetForm();
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Errore inatteso durante l invio.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-[1.5rem] border border-slate-200/90 bg-white/92 p-5 shadow-[0_24px_42px_-34px_rgba(2,6,23,0.45)] sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Scrivici</h2>
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-600">
          <MailCheck className="h-3.5 w-3.5" />
          Contatto diretto
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
          <span className="font-medium text-slate-700">Email</span>
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

      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-slate-700">Oggetto</span>
        <input
          required
          type="text"
          name="subject"
          value={values.subject}
          onChange={onFieldChange('subject')}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
          placeholder="Es. Richiesta partnership / Informazioni piattaforma"
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
          placeholder="Raccontaci come possiamo aiutarti. Ti risponderemo su questa email."
        />
      </label>

      <label className="space-y-1.5 text-sm">
        <span className="font-medium text-slate-700">Sito aziendale (opzionale)</span>
        <input
          type="url"
          name="companyWebsite"
          value={values.companyWebsite}
          onChange={onFieldChange('companyWebsite')}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0A4E88] focus:ring-2 focus:ring-[#0A4E88]/20"
          placeholder="https://..."
        />
      </label>

      <div className="hidden" aria-hidden="true">
        <label>
          Lascia vuoto questo campo
          <input
            tabIndex={-1}
            autoComplete="off"
            name="website"
            value={websiteTrap}
            onChange={(event) => setWebsiteTrap(event.target.value)}
          />
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-400 text-[#0A4E88] focus:ring-[#0A4E88]/25"
        />
        <span>Autorizzo il trattamento dei dati forniti per ricevere risposta a questa richiesta.</span>
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
        <p className="text-xs text-slate-500">Canale monitorato ogni giorno lavorativo.</p>
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
              Invia messaggio
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
