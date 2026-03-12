import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, Instagram, Linkedin, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { PublicContactForm } from '@/components/support/PublicContactForm';

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/concoro/',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/concoro_it/',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/concoro/',
  },
];

export const metadata: Metadata = {
  title: 'Contatti | Concoro',
  description: 'Contatta il team Concoro per informazioni, collaborazioni e richieste operative.',
  alternates: { canonical: '/contatti' },
};

export default function ContattiPage() {
  return (
    <div className="relative overflow-hidden bg-[hsl(210,55%,98%)] text-slate-900 [font-family:'Avenir_Next',Avenir,'Segoe_UI',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 8% 10%, rgba(14,78,136,0.16), transparent 35%), radial-gradient(circle at 92% 14%, rgba(244,63,94,0.1), transparent 31%), repeating-linear-gradient(90deg, rgba(12,56,97,0.035) 0 1px, transparent 1px 84px)',
        }}
      />

      <section className="relative border-b border-slate-200/80 px-4 pb-12 pt-12 md:pt-16">
        <div className="container mx-auto grid max-w-[78rem] grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-slate-700 backdrop-blur-sm">
              <Mail className="h-3.5 w-3.5" />
              Contatti
            </span>

            <h1 className="[font-family:'Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Palatino,serif] max-w-3xl text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-slate-900 md:text-6xl">
              Parliamo.
              <span className="mx-2 bg-gradient-to-r from-[#0E2F50] via-[#0A4E88] to-[#0E2F50] bg-clip-text text-transparent">
                Senza attrito.
              </span>
            </h1>

            <p className="max-w-2xl text-pretty text-base leading-relaxed text-slate-700 md:text-lg">
              Per informazioni, collaborazioni o richieste operative puoi scriverci qui. Abbiamo anche attivato un sistema
              anti-spam dedicato per mantenere il canale pulito e rispondere piu rapidamente ai messaggi reali.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:info@concoro.it"
                className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                info@concoro.it
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </a>
              <Link
                href="/chi-siamo"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Scopri chi siamo
              </Link>
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_14px_46px_-28px_rgba(15,23,42,0.35)]">
            <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-[#0A4E88] via-white to-emerald-500" />
            <div className="space-y-4 pl-3 text-sm text-slate-700">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                Informazioni societarie
              </p>
              <div className="space-y-1.5">
                <p className="text-base font-semibold text-slate-900">Concoro.it</p>
                <p className="text-slate-700">SIPAL Bora</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/85 p-3">
                <p className="inline-flex items-center gap-2 font-medium text-slate-900">
                  <MapPin className="h-4 w-4 text-[#0A4E88]" />
                  Sede
                </p>
                <p className="mt-1 text-slate-700">Via Gioacchino di Marzo, 27 Palermo, Italia</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/85 p-3">
                <p className="inline-flex items-center gap-2 font-medium text-slate-900">
                  <Building2 className="h-4 w-4 text-[#0A4E88]" />
                  Dati fiscali
                </p>
                <p className="mt-1 text-slate-700">P.IVA: IT07070220822</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="relative px-4 py-12 md:py-14">
        <div className="container mx-auto grid max-w-[78rem] grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
          <PublicContactForm />

          <div className="space-y-4">
            <article className="rounded-[1.5rem] border border-slate-200 bg-white/92 p-5 shadow-[0_20px_35px_-34px_rgba(2,6,23,0.55)] sm:p-6">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-500">Canali social</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Seguici su</h2>

              <div className="mt-4 space-y-2.5 text-sm">
                <a
                  href={SOCIAL_LINKS[0].href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-medium text-slate-700 transition hover:border-slate-400"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[#0A4E88]">
                      f
                    </span>
                    {SOCIAL_LINKS[0].label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
                </a>
                <a
                  href={SOCIAL_LINKS[1].href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-medium text-slate-700 transition hover:border-slate-400"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[#0A4E88]">
                      <Instagram className="h-4 w-4" />
                    </span>
                    {SOCIAL_LINKS[1].label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
                </a>
                <a
                  href={SOCIAL_LINKS[2].href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-medium text-slate-700 transition hover:border-slate-400"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[#0A4E88]">
                      <Linkedin className="h-4 w-4" />
                    </span>
                    {SOCIAL_LINKS[2].label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
                </a>
              </div>
            </article>

            <article className="rounded-[1.45rem] border border-[#0A4E88]/20 bg-[linear-gradient(155deg,#f6fbff_0%,#e6f1ff_100%)] p-5 shadow-[0_18px_38px_-30px_rgba(10,78,136,0.45)] sm:p-6">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.11em] text-[#0A4E88]">Filtro anti-spam attivo</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>1. Blocco bot automatici (honeypot + tempo minimo di compilazione).</li>
                <li>2. Limite richieste per IP su finestra temporale.</li>
                <li>3. Filtro contenuti sospetti e invii duplicati.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
