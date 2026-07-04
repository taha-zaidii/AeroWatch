/**
 * AeroPilot — Claude-backed copilot endpoint (Vercel serverless function).
 *
 * Optional: activates when ANTHROPIC_API_KEY is set in the Vercel project.
 * Without a key it returns 503 and the client falls back to the local
 * deterministic engine, so the app never depends on this being configured.
 */
import Anthropic from '@anthropic-ai/sdk';

export const config = { maxDuration: 30 };

interface ChatTurn { role: 'user' | 'assistant'; content: string }

const SYSTEM_PROMPT = `You are AeroPilot, the flight assistant inside AeroWatch, a UAV weather-intelligence console. You help drone operators make go/no-go decisions.

You are given a JSON snapshot of live conditions for the operator's active location: current weather (Open-Meteo), a deterministic flight-risk index with per-factor breakdown, the best computed launch windows, and the next 12 forecast hours.

Rules:
- Ground every claim in the snapshot data; never invent readings.
- Be concise and operational — a pilot is reading this between checks.
- Lead with the answer (go/no-go, the number, the time window), then one or two sentences of reasoning.
- Wind limits for this sUAS class: sustained becomes concerning above 15 km/h and prohibitive near 45; gusts above 45 km/h mean do not fly.
- If asked something unrelated to flight operations or weather, redirect briefly to what you can help with.`;

export default async function handler(
  req: { method?: string; body?: { messages?: ChatTurn[]; context?: string } },
  res: {
    status: (code: number) => { json: (body: unknown) => void };
    setHeader: (k: string, v: string) => void;
  },
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'Claude engine not configured', fallback: true });
    return;
  }

  const { messages, context } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0 || typeof context !== 'string') {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  // Basic abuse guards for a public demo endpoint
  if (messages.length > 12 || context.length > 20_000 ||
      messages.some(m => typeof m.content !== 'string' || m.content.length > 2_000)) {
    res.status(413).json({ error: 'Request too large' });
    return;
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: `Live data snapshot:\n${context}` },
      ],
      messages: messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: m.content,
      })),
    });

    const text = response.content
      .filter((b): b is Extract<typeof response.content[number], { type: 'text' }> => b.type === 'text')
      .map(b => b.text)
      .join('\n');
    res.status(200).json({ text, model: response.model });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upstream error';
    res.status(502).json({ error: message, fallback: true });
  }
}
