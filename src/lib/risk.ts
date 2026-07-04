/**
 * UAV Flight-Risk Engine.
 *
 * Deterministic, explainable go/no-go scoring for small UAS operations.
 * Every factor maps a real observable to a 0–100 risk contribution via
 * piecewise-linear ramps calibrated to typical sUAS operating limits
 * (consumer/prosumer multirotor class), then combines them with weights.
 * Hard gates override the weighted score for unambiguous no-fly signals.
 *
 * Pure functions — no I/O — so the whole engine is unit-testable.
 */
import type { HourlyPoint } from './weather';

export interface RiskInput {
  windSpeed: number;    // km/h sustained
  windGust: number;     // km/h
  precip: number;       // mm/h
  precipProb: number;   // %
  visibility: number;   // km
  temperature: number;  // °C
  cloudBase: number;    // m AGL (estimated LCL)
  cloudCover: number;   // %
}

export type RiskLevel = 'go' | 'caution' | 'high' | 'nogo';

export interface RiskFactor {
  key: string;
  label: string;
  /** 0 (no risk) – 100 (prohibitive) */
  score: number;
  weight: number;
  detail: string;
}

export interface RiskAssessment {
  /** 0 (perfect) – 100 (no-go) */
  score: number;
  level: RiskLevel;
  headline: string;
  factors: RiskFactor[];
  /** Which hard gate fired, if any */
  gate: string | null;
}

/** 0 below lo, 100 above hi, linear in between. */
export function ramp(value: number, lo: number, hi: number): number {
  if (value <= lo) return 0;
  if (value >= hi) return 100;
  return ((value - lo) / (hi - lo)) * 100;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function assessRisk(input: RiskInput): RiskAssessment {
  const wind = ramp(input.windSpeed, 15, 45);
  const gust = ramp(input.windGust, 25, 55);
  const precipRisk = Math.max(
    ramp(input.precip, 0.05, 3),
    ramp(input.precipProb, 30, 85),
  );
  const visRisk = ramp(8 - input.visibility, 0, 7); // 8 km clear → 1 km prohibitive
  const tempRisk = Math.max(
    ramp(-input.temperature, 0, 15),   // cold: battery sag below 0 °C
    ramp(input.temperature - 35, 0, 10), // heat: motor/ESC stress above 35 °C
  );
  const ceilingRisk = Math.max(
    ramp(600 - input.cloudBase, 0, 480), // low cloud base squeezes VLOS altitude
    ramp(input.cloudCover - 85, 0, 15) * 0.5,
  );

  const factors: RiskFactor[] = [
    { key: 'wind', label: 'Sustained wind', score: wind, weight: 0.22,
      detail: `${round1(input.windSpeed)} km/h sustained — sUAS handling degrades above 15, prohibitive near 45.` },
    { key: 'gust', label: 'Gusts', score: gust, weight: 0.26,
      detail: `${round1(input.windGust)} km/h gusting — the single biggest loss-of-control factor.` },
    { key: 'precip', label: 'Precipitation', score: precipRisk, weight: 0.20,
      detail: input.precip > 0.05
        ? `${round1(input.precip)} mm/h falling now — most airframes are not rated for rain.`
        : `${Math.round(input.precipProb)}% probability in this hour.` },
    { key: 'visibility', label: 'Visibility', score: visRisk, weight: 0.16,
      detail: `${round1(input.visibility)} km — visual line of sight requires comfortable margins.` },
    { key: 'temp', label: 'Temperature', score: tempRisk, weight: 0.08,
      detail: `${round1(input.temperature)} °C — LiPo capacity sags in cold, ESCs stress in heat.` },
    { key: 'ceiling', label: 'Cloud ceiling', score: ceilingRisk, weight: 0.08,
      detail: `Estimated cloud base ${Math.round(input.cloudBase)} m AGL, ${Math.round(input.cloudCover)}% cover.` },
  ];

  let gate: string | null = null;
  if (input.windGust >= 60) gate = `Gusts at ${round1(input.windGust)} km/h exceed any safe sUAS envelope.`;
  else if (input.visibility <= 0.9) gate = `Visibility ${round1(input.visibility)} km — below VLOS minimums.`;
  else if (input.precip >= 4) gate = `Heavy precipitation (${round1(input.precip)} mm/h).`;

  const weighted = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const score = gate ? Math.max(80, weighted) : weighted;

  const level: RiskLevel =
    gate ? 'nogo'
    : score <= 20 ? 'go'
    : score <= 45 ? 'caution'
    : score <= 70 ? 'high'
    : 'nogo';

  const headline =
    level === 'go'      ? 'GO — conditions favourable for flight'
    : level === 'caution' ? 'CAUTION — flyable with increased vigilance'
    : level === 'high'  ? 'HIGH RISK — only mission-critical flights'
    : 'NO-GO — do not fly';

  return { score: Math.round(score), level, headline, factors, gate };
}

export function assessHour(h: HourlyPoint): RiskAssessment {
  return assessRisk({
    windSpeed: h.windSpeed,
    windGust: h.windGust,
    precip: h.precip,
    precipProb: h.precipProb,
    visibility: h.visibility,
    temperature: h.temp,
    cloudBase: Math.max(0, 125 * (h.temp - h.dewPoint)),
    cloudCover: h.cloudCover,
  });
}

export interface LaunchWindow {
  startIdx: number;
  start: string;  // "14:00"
  end: string;    // "16:00"
  avgScore: number;
  level: RiskLevel;
}

/**
 * Launch-window optimizer: slides a fixed-duration window across the
 * next `horizonH` forecast hours and returns the lowest-mean-risk,
 * non-overlapping windows (greedy selection over prefix sums — O(n)).
 */
export function bestLaunchWindows(
  hourly: HourlyPoint[],
  durationH = 2,
  count = 3,
  horizonH = 24,
): LaunchWindow[] {
  const hours = hourly.slice(0, horizonH);
  if (hours.length < durationH) return [];

  const scores = hours.map((h) => assessHour(h).score);
  const prefix = [0];
  for (const s of scores) prefix.push(prefix[prefix.length - 1] + s);

  const candidates: { startIdx: number; avg: number }[] = [];
  for (let i = 0; i + durationH <= hours.length; i++) {
    candidates.push({ startIdx: i, avg: (prefix[i + durationH] - prefix[i]) / durationH });
  }
  candidates.sort((a, b) => a.avg - b.avg);

  const chosen: LaunchWindow[] = [];
  const taken: boolean[] = new Array(hours.length).fill(false);
  for (const c of candidates) {
    if (chosen.length >= count) break;
    let overlaps = false;
    for (let i = c.startIdx; i < c.startIdx + durationH; i++) {
      if (taken[i]) { overlaps = true; break; }
    }
    if (overlaps) continue;
    for (let i = c.startIdx; i < c.startIdx + durationH; i++) taken[i] = true;
    const avg = Math.round(c.avg);
    chosen.push({
      startIdx: c.startIdx,
      start: hours[c.startIdx].hour,
      end: hours[Math.min(hours.length - 1, c.startIdx + durationH - 1)].hour,
      avgScore: avg,
      level: avg <= 20 ? 'go' : avg <= 45 ? 'caution' : avg <= 70 ? 'high' : 'nogo',
    });
  }
  return chosen.sort((a, b) => a.startIdx - b.startIdx);
}
