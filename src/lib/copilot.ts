/**
 * AeroPilot — the on-board flight assistant.
 *
 * Two engines:
 *  1. Local engine (this file): deterministic intent matching + template
 *     generation over the live weather feed and the risk engine. Always
 *     available, zero network, fully explainable.
 *  2. Claude engine (/api/copilot): a Vercel serverless function that
 *     proxies to the Claude API when an ANTHROPIC_API_KEY is configured.
 *     The client tries it first and falls back to the local engine.
 */
import { assessRisk, bestLaunchWindows, type RiskAssessment } from './risk';
import { degToCompass, estimateCloudBase, weatherCodeInfo, type WeatherBundle } from './weather';
import type { GeoLocation } from '../store/app';

export interface CopilotContext {
  wx: WeatherBundle;
  location: GeoLocation;
}

export interface CopilotReply {
  text: string;
  engine: 'local' | 'claude';
}

function currentAssessment(wx: WeatherBundle): RiskAssessment {
  const now = wx.hourly[0];
  return assessRisk({
    windSpeed: wx.current.windSpeed,
    windGust: wx.current.windGust,
    precip: wx.current.precipitation,
    precipProb: now?.precipProb ?? 0,
    visibility: now?.visibility ?? 10,
    temperature: wx.current.temperature,
    cloudBase: estimateCloudBase(wx.current.temperature, wx.current.dewPoint),
    cloudCover: wx.current.cloudCover,
  });
}

const r0 = (n: number) => Math.round(n);

/** Full mission briefing generated from live data. */
export function generateBriefing(ctx: CopilotContext): string {
  const { wx, location } = ctx;
  const a = currentAssessment(wx);
  const windows = bestLaunchWindows(wx.hourly, 2, 2, 24);
  const cond = weatherCodeInfo(wx.current.weatherCode).label.toLowerCase();
  const rain = wx.hourly.find(h => h.precipProb >= 50);

  const lines = [
    `**Flight briefing — ${location.name}**`,
    ``,
    `Currently ${cond}, ${r0(wx.current.temperature)}°C (feels like ${r0(wx.current.apparentTemperature)}°). ` +
    `Wind ${r0(wx.current.windSpeed)} km/h from ${degToCompass(wx.current.windDirection)}, gusting ${r0(wx.current.windGust)} km/h. ` +
    `Visibility ${wx.hourly[0] ? wx.hourly[0].visibility.toFixed(1) : '—'} km, cloud cover ${r0(wx.current.cloudCover)}%.`,
    ``,
    `**Risk index: ${a.score}/100 — ${a.headline}**`,
    a.gate ? `⚠ ${a.gate}` : '',
    ``,
    `Top factors: ${[...a.factors].sort((x, y) => y.score - x.score).slice(0, 3).map(f => `${f.label.toLowerCase()} (${r0(f.score)})`).join(', ')}.`,
    rain ? `Rain signal around ${rain.hour} local (${r0(rain.precipProb)}% probability).` : `No significant rain signal in the next 48 h.`,
    windows.length
      ? `Best launch windows (next 24 h): ${windows.map(w => `${w.start}–${w.end} (risk ${w.avgScore})`).join(' · ')}.`
      : '',
  ];
  return lines.filter(Boolean).join('\n');
}

interface Intent {
  match: RegExp;
  answer: (ctx: CopilotContext) => string;
}

const INTENTS: Intent[] = [
  {
    match: /\b(can i fly|should i fly|safe to fly|go.?no.?go|fly now|launch now|is it safe)\b/i,
    answer: (ctx) => {
      const a = currentAssessment(ctx.wx);
      const verdict = a.level === 'go' ? 'Yes — you are clear to fly.'
        : a.level === 'caution' ? 'Flyable, but stay vigilant.'
        : a.level === 'high' ? 'Only if the mission is critical.'
        : 'No — do not fly right now.';
      const worst = [...a.factors].sort((x, y) => y.score - x.score)[0];
      return `${verdict} Risk index is ${a.score}/100 at ${ctx.location.name}. ${a.gate ? `Hard gate: ${a.gate}` : `Biggest concern: ${worst.label.toLowerCase()} — ${worst.detail}`}`;
    },
  },
  {
    match: /\b(best time|when should|launch window|later today|good time)\b/i,
    answer: (ctx) => {
      const windows = bestLaunchWindows(ctx.wx.hourly, 2, 3, 24);
      if (!windows.length) return 'I do not have enough forecast data to compute launch windows yet.';
      const best = windows.reduce((a, b) => (b.avgScore < a.avgScore ? b : a));
      return `Best 2-hour windows in the next 24 h at ${ctx.location.name}: ${windows.map(w => `${w.start}–${w.end} (risk ${w.avgScore})`).join(' · ')}. I would aim for ${best.start}–${best.end}.`;
    },
  },
  {
    match: /\bwind|gust\b/i,
    answer: (ctx) => {
      const { current, hourly } = ctx.wx;
      const peak = hourly.slice(0, 12).reduce((a, b) => (b.windGust > a.windGust ? b : a));
      return `Wind at ${ctx.location.name} is ${r0(current.windSpeed)} km/h from ${degToCompass(current.windDirection)} (${r0(current.windDirection)}°), gusting ${r0(current.windGust)} km/h. Peak gust in the next 12 h: ${r0(peak.windGust)} km/h around ${peak.hour}. Operational gust limit is 45 km/h.`;
    },
  },
  {
    match: /\b(rain|precip|snow|storm|shower)\b/i,
    answer: (ctx) => {
      const rain = ctx.wx.hourly.find(h => h.precipProb >= 50 || h.precip >= 0.2);
      if (!rain) return `No meaningful precipitation signal at ${ctx.location.name} for the next 48 hours. Current precipitation: ${ctx.wx.current.precipitation.toFixed(1)} mm/h.`;
      const idx = ctx.wx.hourly.indexOf(rain);
      return `Precipitation likely around ${rain.hour} local (${r0(rain.precipProb)}% probability${idx === 0 ? ', starting now' : `, ~${idx} h from now`}). Most airframes are not rated for rain — plan to be on the ground before then.`;
    },
  },
  {
    match: /\b(visibility|fog|see|vlos)\b/i,
    answer: (ctx) => {
      const now = ctx.wx.hourly[0];
      if (!now) return 'Visibility data is still loading.';
      const in3 = ctx.wx.hourly[3];
      return `Visibility is ${now.visibility.toFixed(1)} km${in3 ? `, trending to ${in3.visibility.toFixed(1)} km within 3 h` : ''}. VLOS operations want comfortable margins above ~3 km; below 1 km is a hard no-go.`;
    },
  },
  {
    match: /\b(temp|cold|hot|heat|battery)\b/i,
    answer: (ctx) => {
      const t = ctx.wx.current.temperature;
      const note = t < 0 ? 'LiPo packs sag significantly below 0 °C — expect 20–30% less flight time and keep spares warm.'
        : t > 35 ? 'Heat stresses motors and ESCs — watch temperatures and shorten flights.'
        : 'Comfortable range for LiPo performance.';
      return `It is ${t.toFixed(1)} °C (feels like ${r0(ctx.wx.current.apparentTemperature)}°) at ${ctx.location.name}. ${note}`;
    },
  },
  {
    match: /\b(cloud|ceiling|overcast)\b/i,
    answer: (ctx) => {
      const base = estimateCloudBase(ctx.wx.current.temperature, ctx.wx.current.dewPoint);
      return `Cloud cover is ${r0(ctx.wx.current.cloudCover)}% with an estimated cloud base of ${base} m AGL (lifted-condensation-level estimate from the ${ctx.wx.current.temperature.toFixed(0)}°/${ctx.wx.current.dewPoint.toFixed(0)}° temperature/dew-point spread).`;
    },
  },
  {
    match: /\b(brief|summary|report|overview|status)\b/i,
    answer: generateBriefing,
  },
  {
    match: /\b(help|what can you)\b/i,
    answer: () =>
      'I can answer go/no-go calls, wind and gust questions, rain timing, visibility, temperature effects on batteries, cloud ceiling, and best launch windows — all computed from the live Open-Meteo feed for your active location. Try “can I fly?”, “when is the best time today?”, or “full briefing”.',
  },
];

/** Deterministic local answer — always available, no network. */
export function answerLocally(question: string, ctx: CopilotContext): string {
  for (const intent of INTENTS) {
    if (intent.match.test(question)) return intent.answer(ctx);
  }
  const a = currentAssessment(ctx.wx);
  return `Here is the short version for ${ctx.location.name}: risk index ${a.score}/100 (${a.level.toUpperCase()}), wind ${r0(ctx.wx.current.windSpeed)} km/h gusting ${r0(ctx.wx.current.windGust)}, ${weatherCodeInfo(ctx.wx.current.weatherCode).label.toLowerCase()}. Ask me “can I fly?”, “when is the best time?”, or “full briefing” for more.`;
}

/** Serializes live context for the Claude engine's system prompt. */
export function contextForClaude(ctx: CopilotContext): string {
  const { wx, location } = ctx;
  const a = currentAssessment(wx);
  const windows = bestLaunchWindows(wx.hourly, 2, 3, 24);
  return JSON.stringify({
    location: { name: location.name, region: location.region, lat: location.lat, lng: location.lng },
    current: wx.current,
    riskIndex: { score: a.score, level: a.level, gate: a.gate, factors: a.factors.map(f => ({ label: f.label, score: Math.round(f.score), detail: f.detail })) },
    bestLaunchWindows: windows,
    next12h: wx.hourly.slice(0, 12).map(h => ({
      hour: h.hour, temp: h.temp, windSpeed: h.windSpeed, windGust: h.windGust,
      precipProb: h.precipProb, visibility: h.visibility, code: h.code,
    })),
    today: wx.today,
  });
}

export interface ChatTurn { role: 'user' | 'assistant'; content: string }

/**
 * Ask AeroPilot. Tries the Claude-backed serverless endpoint first;
 * falls back to the local engine when the endpoint is absent (no API key
 * configured, local dev server, offline…).
 */
export async function askCopilot(
  question: string,
  history: ChatTurn[],
  ctx: CopilotContext,
): Promise<CopilotReply> {
  try {
    const res = await fetch('/api/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...history.slice(-8), { role: 'user', content: question }],
        context: contextForClaude(ctx),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.text) return { text: data.text, engine: 'claude' };
    }
  } catch {
    // network failure or endpoint absent — fall through to local engine
  }
  return { text: answerLocally(question, ctx), engine: 'local' };
}
