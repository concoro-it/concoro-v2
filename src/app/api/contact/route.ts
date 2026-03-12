import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { brevoRequest } from '@/lib/brevo/client';

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  companyWebsite?: string;
  websiteTrap?: string;
  startedAt?: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const MAX_MESSAGE_LENGTH = 2200;
const RATE_LIMIT_MAX_REQUESTS = 4;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MIN_SUBMIT_TIME_MS = 4000;
const MAX_SUBMIT_AGE_MS = 2 * 60 * 60 * 1000;

const ipRateLimit = new Map<string, RateLimitEntry>();
const messageFingerprint = new Map<string, number>();

const SPAM_PATTERNS = [
  /(?:\bseo\b|\bbacklink\b|\bguest post\b|\bcasino\b|\bviagra\b|\bcrypto\b|\btelegram\b)/i,
  /(?:whatsapp|t\.me|bit\.ly|tinyurl)/i,
  /(?:buy now|100% guaranteed|quick money|fast ranking)/i,
];

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

function extractIpAddress(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}

function isRateLimited(ip: string, now: number): boolean {
  const previous = ipRateLimit.get(ip);
  if (!previous || previous.resetAt <= now) {
    ipRateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (previous.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  ipRateLimit.set(ip, { ...previous, count: previous.count + 1 });
  return false;
}

function hasTooManyLinks(text: string): boolean {
  const links = text.match(/https?:\/\/|www\./gi);
  return (links?.length ?? 0) >= 3;
}

function looksLikeBotMessage(subject: string, message: string, userAgent: string): boolean {
  const compactText = `${subject}\n${message}`;
  if (hasTooManyLinks(compactText)) {
    return true;
  }

  if (SPAM_PATTERNS.some((pattern) => pattern.test(compactText))) {
    return true;
  }

  if (/(bot|crawler|spider|curl|python|wget)/i.test(userAgent)) {
    return true;
  }

  return false;
}

function isDuplicateSubmission(email: string, subject: string, message: string, now: number): boolean {
  const normalized = `${email.toLowerCase()}|${subject.trim().toLowerCase()}|${message.trim().toLowerCase()}`;
  const fingerprint = crypto.createHash('sha256').update(normalized).digest('hex');
  const previous = messageFingerprint.get(fingerprint);

  if (previous && now - previous < 24 * 60 * 60 * 1000) {
    return true;
  }

  messageFingerprint.set(fingerprint, now);
  return false;
}

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    return true;
  }

  if (origin.includes('concoro.it')) {
    return true;
  }

  if (origin.includes('localhost')) {
    return true;
  }

  return false;
}

function silentSuccess() {
  return NextResponse.json({
    ok: true,
    message: 'Messaggio ricevuto. Ti risponderemo il prima possibile.',
  });
}

export async function POST(request: NextRequest) {
  const now = Date.now();

  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ ok: false, error: 'Origine richiesta non valida.' }, { status: 403 });
    }

    const body = (await request.json()) as ContactPayload;

    const name = sanitizeInput(body.name);
    const email = sanitizeInput(body.email).toLowerCase();
    const subject = sanitizeInput(body.subject);
    const message = sanitizeInput(body.message);
    const companyWebsite = sanitizeInput(body.companyWebsite);
    const websiteTrap = sanitizeInput(body.websiteTrap);
    const startedAt = Number(body.startedAt ?? 0);
    const userAgent = request.headers.get('user-agent') ?? '';
    const ip = extractIpAddress(request);

    if (websiteTrap.length > 0) {
      return silentSuccess();
    }

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ ok: false, error: 'Compila tutti i campi obbligatori.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Inserisci un indirizzo email valido.' }, { status: 400 });
    }

    if (name.length > 120 || subject.length < 6 || subject.length > 180 || message.length < 25 || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ ok: false, error: 'Controlla la lunghezza dei campi e riprova.' }, { status: 400 });
    }

    if (companyWebsite && !/^https?:\/\//i.test(companyWebsite)) {
      return NextResponse.json({ ok: false, error: 'Il sito deve iniziare con http:// o https://.' }, { status: 400 });
    }

    if (!Number.isFinite(startedAt) || startedAt <= 0) {
      return NextResponse.json({ ok: false, error: 'Richiesta non valida. Ricarica la pagina e riprova.' }, { status: 400 });
    }

    const elapsed = now - startedAt;
    if (elapsed < MIN_SUBMIT_TIME_MS || elapsed > MAX_SUBMIT_AGE_MS) {
      return silentSuccess();
    }

    if (isRateLimited(ip, now)) {
      return NextResponse.json(
        { ok: false, error: 'Hai inviato troppi messaggi in poco tempo. Riprova tra qualche minuto.' },
        { status: 429 }
      );
    }

    if (isDuplicateSubmission(email, subject, message, now)) {
      return silentSuccess();
    }

    if (looksLikeBotMessage(subject, message, userAgent)) {
      return silentSuccess();
    }

    const contactReceiver = process.env.CONTACT_FORM_TO_EMAIL || 'info@concoro.it';
    const senderEmail = process.env.CONTACT_FORM_FROM_EMAIL || process.env.BREVO_SENDER_EMAIL || 'info@concoro.it';
    const senderName = process.env.CONTACT_FORM_FROM_NAME || 'Concoro';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      return NextResponse.json({ ok: false, error: 'Configurazione sender non valida.' }, { status: 500 });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeWebsite = escapeHtml(companyWebsite);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');
    const safeIp = escapeHtml(ip);
    const safeUserAgent = escapeHtml(userAgent);

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a;max-width:720px">
        <h2 style="margin:0 0 12px;color:#0a4e88;">Nuovo contatto da pagina /contatti</h2>
        <p style="margin:0 0 16px;">E arrivata una nuova richiesta dal form pubblico di contatto.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr><td style="padding:8px;border:1px solid #e2e8f0;"><strong>Nome</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${safeName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;"><strong>Email</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${safeEmail}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;"><strong>Oggetto</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${safeSubject}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;"><strong>Sito</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${safeWebsite || '-'}</td></tr>
        </table>
        <div style="padding:12px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:10px;">
          <strong>Messaggio</strong>
          <p style="margin:8px 0 0;">${safeMessage}</p>
        </div>
        <p style="margin-top:14px;font-size:12px;color:#64748b;">IP: ${safeIp}<br/>User-Agent: ${safeUserAgent}</p>
      </div>
    `;

    const textContent = [
      'Nuovo contatto da pagina /contatti',
      '',
      `Nome: ${name}`,
      `Email: ${email}`,
      `Oggetto: ${subject}`,
      `Sito: ${companyWebsite || '-'}`,
      '',
      'Messaggio:',
      message,
      '',
      `IP: ${ip}`,
      `User-Agent: ${userAgent}`,
    ].join('\n');

    const result = await brevoRequest({
      path: '/smtp/email',
      method: 'POST',
      body: {
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: contactReceiver }],
        replyTo: {
          email,
          name,
        },
        subject: `[Contatti] ${subject}`,
        htmlContent,
        textContent,
      },
    });

    if (!result.ok) {
      console.error('[contact-form] brevo send failed', result.error);
      return NextResponse.json(
        { ok: false, error: 'Invio non riuscito. Riprova tra qualche minuto.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Messaggio inviato correttamente. Ti risponderemo via email appena possibile.',
    });
  } catch (error) {
    console.error('[contact-form] unexpected error', error);
    return NextResponse.json(
      { ok: false, error: 'Errore inatteso durante l invio del messaggio.' },
      { status: 500 }
    );
  }
}
