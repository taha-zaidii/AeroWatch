import { describe, expect, it } from 'vitest';
import { assessRisk, bestLaunchWindows, ramp, type RiskInput } from '../risk';
import type { HourlyPoint } from '../weather';

const calm: RiskInput = {
  windSpeed: 5,
  windGust: 10,
  precip: 0,
  precipProb: 5,
  visibility: 12,
  temperature: 20,
  cloudBase: 1800,
  cloudCover: 30,
};

function hour(overrides: Partial<HourlyPoint>): HourlyPoint {
  return {
    time: '2026-07-05T12:00', hour: '12:00', temp: 20, dewPoint: 10,
    precipProb: 5, precip: 0, code: 1, cloudCover: 30, visibility: 12,
    windSpeed: 8, windGust: 12, windDir: 90, uv: 4, pressure: 1013,
    ...overrides,
  };
}

describe('ramp', () => {
  it('clamps below and above the range', () => {
    expect(ramp(0, 10, 20)).toBe(0);
    expect(ramp(25, 10, 20)).toBe(100);
  });

  it('interpolates linearly inside the range', () => {
    expect(ramp(15, 10, 20)).toBe(50);
  });
});

describe('assessRisk', () => {
  it('scores calm conditions as GO', () => {
    const a = assessRisk(calm);
    expect(a.level).toBe('go');
    expect(a.score).toBeLessThanOrEqual(20);
    expect(a.gate).toBeNull();
  });

  it('fires the gust hard gate regardless of other factors', () => {
    const a = assessRisk({ ...calm, windGust: 70 });
    expect(a.level).toBe('nogo');
    expect(a.gate).toMatch(/gust/i);
    expect(a.score).toBeGreaterThanOrEqual(80);
  });

  it('fires the visibility hard gate below VLOS minimums', () => {
    const a = assessRisk({ ...calm, visibility: 0.5 });
    expect(a.level).toBe('nogo');
    expect(a.gate).toMatch(/visibility/i);
  });

  it('fires the heavy-precipitation gate', () => {
    const a = assessRisk({ ...calm, precip: 6 });
    expect(a.level).toBe('nogo');
  });

  it('escalates with wind but stays gate-free in the caution band', () => {
    const a = assessRisk({ ...calm, windSpeed: 30, windGust: 40 });
    expect(a.gate).toBeNull();
    expect(a.score).toBeGreaterThan(assessRisk(calm).score);
    expect(['caution', 'high']).toContain(a.level);
  });

  it('penalises extreme cold via the temperature factor', () => {
    const cold = assessRisk({ ...calm, temperature: -12 });
    const factor = cold.factors.find(f => f.key === 'temp')!;
    expect(factor.score).toBeGreaterThan(50);
  });

  it('weights sum to 1 so the score is bounded 0-100', () => {
    const total = assessRisk(calm).factors.reduce((s, f) => s + f.weight, 0);
    expect(total).toBeCloseTo(1, 5);
  });
});

describe('bestLaunchWindows', () => {
  it('prefers the calm stretch over the stormy one', () => {
    const hourly = [
      ...Array.from({ length: 6 }, () => hour({ windGust: 55, precipProb: 80 })), // bad morning
      ...Array.from({ length: 6 }, () => hour({ windGust: 10, precipProb: 0 })),  // calm midday
      ...Array.from({ length: 12 }, () => hour({ windGust: 40, precipProb: 40 })), // meh evening
    ];
    const windows = bestLaunchWindows(hourly, 2, 1, 24);
    expect(windows).toHaveLength(1);
    expect(windows[0].startIdx).toBeGreaterThanOrEqual(6);
    expect(windows[0].startIdx).toBeLessThanOrEqual(10);
  });

  it('returns non-overlapping windows', () => {
    const hourly = Array.from({ length: 24 }, () => hour({}));
    const windows = bestLaunchWindows(hourly, 3, 3, 24);
    expect(windows).toHaveLength(3);
    const starts = windows.map(w => w.startIdx).sort((a, b) => a - b);
    for (let i = 1; i < starts.length; i++) {
      expect(starts[i] - starts[i - 1]).toBeGreaterThanOrEqual(3);
    }
  });

  it('handles insufficient data gracefully', () => {
    expect(bestLaunchWindows([hour({})], 2, 3, 24)).toEqual([]);
  });
});
