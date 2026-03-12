import { NextRequest, NextResponse } from 'next/server';
import { brevoRequest } from '@/lib/brevo/client';

type SupportPayload = {
  name?: string;
  email?: string;
  category?: string;
  subject?: string;
  pageUrl?: string;
  message?: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  tecnico: 'Problema tecnico',
  abbonamento: 'Abbonamento e pagamenti',
  account: 'Account e accesso',
  concorsi: 'Concorsi e contenuti',
  feedback: 'Feedback e suggerimenti',
  altro: 'Altro',
};

function sanitizeInput(value: unknown): string {
  return String(value ?? '').trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SupportPayload;

    const name = sanitizeInput(body.name);
    const email = sanitizeInput(body.email).toLowerCase();
    const category = sanitizeInput(body.category);
    const subject = sanitizeInput(body.subject);
    const pageUrl = sanitizeInput(body.pageUrl);
    const message = sanitizeInput(body.message);

    if (!name || !email || !category || !subject || !message) {
      return NextResponse.json({ ok: false, error: 'Compila tutti i campi obbligatori.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Inserisci un indirizzo email valido.' }, { status: 400 });
    }

    if (message.length < 20) {
      return NextResponse.json(
        { ok: false, error: 'Aggiungi piu dettagli (almeno 20 caratteri) per aiutarci a risolverti prima il problema.' },
        { status: 400 }
      );
    }

    if (message.length > 2200 || subject.length > 180 || name.length > 120 || pageUrl.length > 600) {
      return NextResponse.json({ ok: false, error: 'Uno o piu campi superano la lunghezza consentita.' }, { status: 400 });
    }

    if (pageUrl && !/^https?:\/\//i.test(pageUrl)) {
      return NextResponse.json({ ok: false, error: 'Il link pagina deve iniziare con http:// o https://.' }, { status: 400 });
    }

    const supportReceiver = process.env.SUPPORT_CONTACT_TO_EMAIL || 'support@concoro.it';
    const senderEmail =
      process.env.SUPPORT_CONTACT_FROM_EMAIL ||
      process.env.BREVO_SENDER_EMAIL ||
      'info@concoro.it';
    const senderName = process.env.SUPPORT_CONTACT_FROM_NAME || 'Concoro Support';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      return NextResponse.json(
        { ok: false, error: 'Configurazione sender non valida. Contatta il team tecnico.' },
        { status: 500 }
      );
    }

    const categoryLabel = CATEGORY_LABELS[category] || category;
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeCategory = escapeHtml(categoryLabel);
    const safeSubject = escapeHtml(subject);
    const safePageUrl = escapeHtml(pageUrl);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a;max-width:680px">
        <h2 style="margin:0 0 12px;color:#0a4e88;">Nuova richiesta assistenza da Hub Concoro</h2>
        <p style="margin:0 0 18px;">E arrivata una nuova richiesta supporto dal form /hub/assistenza.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr><td style="padding:8px;border:1px solid #e2e8f0;"><strong>Nome</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${safeName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;"><strong>Email</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${safeEmail}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;"><strong>Categoria</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${safeCategory}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;"><strong>Oggetto</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${safeSubject}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;"><strong>Pagina</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${safePageUrl || '-'}</td></tr>
        </table>
        <div style="padding:12px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:10px;">
          <strong>Messaggio</strong>
          <p style="margin:8px 0 0;">${safeMessage}</p>
        </div>
      </div>
    `;

    const textContent = [
      'Nuova richiesta assistenza da Hub Concoro',
      '',
      `Nome: ${name}`,
      `Email: ${email}`,
      `Categoria: ${categoryLabel}`,
      `Oggetto: ${subject}`,
      `Pagina: ${pageUrl || '-'}`,
      '',
      'Messaggio:',
      message,
    ].join('\n');

    const result = await brevoRequest({
      path: '/smtp/email',
      method: 'POST',
      body: {
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: supportReceiver }],
        replyTo: {
          email,
          name,
        },
        subject: `[Hub Assistenza] ${subject}`,
        htmlContent,
        textContent,
      },
    });

    if (!result.ok) {
      console.error('[support-contact] brevo send failed', result.error);
      return NextResponse.json(
        { ok: false, error: 'Invio non riuscito. Riprova tra qualche minuto.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Richiesta inviata correttamente. Il team ti rispondera via email appena possibile.',
    });
  } catch (error) {
    console.error('[support-contact] unexpected error', error);
    return NextResponse.json(
      { ok: false, error: 'Errore inatteso durante l\'invio della richiesta.' },
      { status: 500 }
    );
  }
}
