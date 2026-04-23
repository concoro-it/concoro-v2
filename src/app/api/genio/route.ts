import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';

const GENIO_WEBHOOK_URL =
  process.env.GENIO_WEBHOOK_URL ||
  'http://n8n-xx2fcgp7yy3d2ctibu3hgywo.31.97.47.35.sslip.io/webhook/733dace6-bb4e-4dab-997b-66a780681163';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const tier = await getUserTier(supabase);

  if (tier !== 'pro' && tier !== 'admin') {
    return NextResponse.json(
      { error: 'Questa funzionalita e disponibile solo per gli utenti Pro.' },
      { status: 403 }
    );
  }

  try {
    const inputForm = await req.formData();
    const outboundForm = new FormData();

    const chatInput = String(inputForm.get('chatInput') || '').trim();
    const sessionId = String(inputForm.get('sessionId') || 'concoro_genio');
    const file = inputForm.get('data0');

    outboundForm.append('chatInput', chatInput || 'Analizza questo documento.');
    outboundForm.append('sessionId', sessionId);

    if (file instanceof File) {
      outboundForm.append('data0', file, file.name);
    }

    let webhookRes = await fetch(GENIO_WEBHOOK_URL, {
      method: 'POST',
      body: outboundForm,
      cache: 'no-store',
    });

    // n8n'de workflow aktif degilse production webhook 404 doner;
    // bu durumda test endpoint'ini otomatik deneriz.
    if (!webhookRes.ok && webhookRes.status === 404 && GENIO_WEBHOOK_URL.includes('/webhook/')) {
      const testUrl = GENIO_WEBHOOK_URL.replace('/webhook/', '/webhook-test/');
      webhookRes = await fetch(testUrl, {
        method: 'POST',
        body: outboundForm,
        cache: 'no-store',
      });
    }

    if (!webhookRes.ok) {
      const errorBody = (await webhookRes.text()).slice(0, 300);
      return NextResponse.json(
        { error: `Webhook HTTP Error: ${webhookRes.status}. ${errorBody}`.trim() },
        { status: 502 }
      );
    }

    const contentType = webhookRes.headers.get('content-type') || '';
    let reply = "Ho completato l'analisi.";

    if (contentType.includes('application/json')) {
      const result = await webhookRes.json();
      if (Array.isArray(result) && result.length > 0) {
        reply = result[0]?.output || result[0]?.text || result[0]?.response || reply;
      } else {
        reply = result?.output || result?.text || result?.response || reply;
      }
    } else {
      const text = await webhookRes.text();
      if (text?.trim()) {
        reply = text;
      }
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[genio webhook]', error);
    return NextResponse.json(
      { error: 'Si e verificato un errore durante la comunicazione con Genio.' },
      { status: 500 }
    );
  }
}
