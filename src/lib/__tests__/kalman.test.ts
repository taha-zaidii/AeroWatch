import { describe, expect, it } from 'vitest';
import { Kalman1D } from '../kalman';

describe('Kalman1D', () => {
  it('returns the first measurement unchanged', () => {
    const k = new Kalman1D();
    expect(k.filter(42)).toBe(42);
  });

  it('reduces variance of a noisy constant signal', () => {
    const k = new Kalman1D(0.01, 4);
    const truth = 100;
    let seed = 7;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 - 0.5; };

    const raw: number[] = [];
    const filtered: number[] = [];
    for (let i = 0; i < 200; i++) {
      const measurement = truth + rand() * 20;
      raw.push(measurement);
      filtered.push(k.filter(measurement));
    }
    const variance = (xs: number[]) => {
      const tail = xs.slice(50); // skip convergence
      const mean = tail.reduce((a, b) => a + b, 0) / tail.length;
      return tail.reduce((a, b) => a + (b - mean) ** 2, 0) / tail.length;
    };
    expect(variance(filtered)).toBeLessThan(variance(raw) / 4);
  });

  it('tracks a genuine level change', () => {
    const k = new Kalman1D(0.5, 1);
    for (let i = 0; i < 20; i++) k.filter(10);
    let estimate = 0;
    for (let i = 0; i < 20; i++) estimate = k.filter(50);
    expect(estimate).toBeGreaterThan(45);
  });

  it('reset() forgets prior state', () => {
    const k = new Kalman1D();
    k.filter(10);
    k.filter(12);
    k.reset();
    expect(k.filter(99)).toBe(99);
  });
});
