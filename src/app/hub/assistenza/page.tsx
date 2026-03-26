import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Clock3, LifeBuoy, Mail, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { SupportContactForm } from '@/components/support/SupportContactForm';

export const metadata: Metadata = {
  title: 'Assistenza | Dashboard',
  description: 'Contatta il team Concoro e ricevi supporto operativo dal tuo hub.',
};

export default async function AssistenzaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
    : { data: null };

  const initialName = profile?.full_name ?? '';
  const initialEmail = user?.email ?? '';

  return (
    <div className="dashboard-shell">
      <div className="dashboard-shell-overlay" />

      <div className="relative container mx-auto max-w-[78rem] px-4 py-8 sm:px-6 sm:py-10">
        <section className="mb-6 grid gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/82 p-5 backdrop-blur-sm sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6 lg:p-7">
          <div className="space-y-4">
            <nav className="flex items-center gap-1.5 text-sm text-slate-500">
              <Link href="/hub/bacheca" className="hover:text-slate-900">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-slate-900">Assistenza</span>
            </nav>

            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-slate-50/90 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-slate-700">
              <LifeBuoy className="h-3.5 w-3.5" />
              Help desk Concoro
            </span>

            <div className="space-y-2">
              <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] text-3xl leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.85rem]">
                Ti aiutiamo a
                <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                  ripartire subito
                </span>
                se qualcosa si blocca.
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
                Compila il form con tutti i dettagli utili: il team supporto ricevera la richiesta su
                <span className="mx-1 font-semibold text-slate-900">support@concoro.it</span>
                e ti rispondera nel minor tempo possibile.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <a
                href="mailto:support@concoro.it"
                className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Scrivi via email
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/hub/profile"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
              >
                Vai al profilo
              </Link>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.11em] text-slate-500">Prima di inviare</h2>
            <ul className="space-y-2.5 text-sm text-slate-700">
              <li className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#0A4E88]" />
                <span>Tempo medio di risposta: entro 1 giorno lavorativo.</span>
              </li>
              <li className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0A4E88]" />
                <span>Dettagli completi = diagnosi piu rapida e soluzione piu precisa.</span>
              </li>
              <li className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#0A4E88]" />
                <span>Riceverai aggiornamenti e risposta direttamente all&apos;email indicata.</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <SupportContactForm initialName={initialName} initialEmail={initialEmail} />

          <div className="space-y-4">
            <article className="dashboard-section-frame p-5 sm:p-6">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Canali supporto</p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Rimaniamo allineati</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Per urgenze operative usa il form con categoria corretta. Se preferisci una comunicazione diretta,
                puoi anche scriverci da client mail.
              </p>

              <div className="mt-4 space-y-2.5 text-sm">
                <a
                  href="mailto:support@concoro.it"
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-medium text-slate-700 transition hover:border-slate-400"
                >
                  support@concoro.it
                  <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
                </a>
                <Link
                  href="/hub/billing"
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-medium text-slate-700 transition hover:border-slate-400"
                >
                  Gestione billing e piano
                  <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/hub/profile"
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-medium text-slate-700 transition hover:border-slate-400"
                >
                  Aggiorna i dati account
                  <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </article>

            <article className="rounded-[1.45rem] border border-[#0A4E88]/20 bg-[linear-gradient(155deg,#f6fbff_0%,#e6f1ff_100%)] p-5 shadow-[0_18px_38px_-30px_rgba(10,78,136,0.45)] sm:p-6">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.11em] text-[#0A4E88]">Checklist invio rapido</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>1. Descrivi passo per passo cosa stavi facendo.</li>
                <li>2. Indica la pagina coinvolta, se possibile.</li>
                <li>3. Specifica il risultato atteso e quello ottenuto.</li>
              </ul>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
