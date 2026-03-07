import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
    console.warn('[OpenAI] OPENAI_API_KEY not set — AI features will be unavailable');
}

export const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;
