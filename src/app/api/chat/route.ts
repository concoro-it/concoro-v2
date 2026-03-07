import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/auth/getUserTier';
import { openai } from '@/lib/openai/client';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const tier = await getUserTier(supabase);

    if (tier !== 'pro' && tier !== 'admin') {
        return NextResponse.json(
            { error: 'Questa funzionalità è disponibile solo per gli utenti Pro.' },
            { status: 403 }
        );
    }

    if (!openai) {
        return NextResponse.json({ error: 'AI non configurata' }, { status: 503 });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
        return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: `Sei Genio, l'assistente AI di Concoro. Aiuti gli utenti a trovare concorsi pubblici in Italia adatti al loro profilo. 
Sei esperto di concorsi pubblici italiani, requisiti, procedure di selezione e carriere nella pubblica amministrazione.
Rispondi sempre in italiano in modo chiaro, professionale e amichevole.`,
            },
            ...messages,
        ],
        stream: true,
        max_tokens: 1000,
        temperature: 0.7,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of stream) {
                    const text = chunk.choices[0]?.delta?.content ?? '';
                    if (text) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                    }
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            } catch (err) {
                console.error('[chat stream]', err);
            } finally {
                controller.close();
            }
        },
    });

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
