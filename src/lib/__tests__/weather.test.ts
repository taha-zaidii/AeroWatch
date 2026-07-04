import { describe, expect, it } from 'vitest';
import { degToCompass, estimateCloudBase, weatherCodeInfo } from '../weather';

describe('degToCompass', () => {
  it('maps cardinal directions', () => {
    expect(degToCompass(0)).toBe('N');
    expect(degToCompass(90)).toBe('E');
    expect(degToCompass(180)).toBe('S');
    expect(degToCompass(270)).toBe('W');
  });

  it('wraps around 360 and handles negatives', () => {
    expect(degToCompass(359)).toBe('N');
    expect(degToCompass(-90)).toBe('W');
    expect(degToCompass(450)).toBe('E');
  });
});

describe('estimateCloudBase', () => {
  it('applies the 125 m/°C lifted-condensation approximation', () => {
    expect(estimateCloudBase(20, 12)).toBe(1000);
  });

  it('never goes negative when saturated', () => {
    expect(estimateCloudBase(10, 15)).toBe(0);
  });
});

describe('weatherCodeInfo', () => {
  it('maps the WMO code families', () => {
    expect(weatherCodeInfo(0).sky).toBe('sun');
    expect(weatherCodeInfo(3).sky).toBe('cloud');
    expect(weatherCodeInfo(45).sky).toBe('fog');
    expect(weatherCodeInfo(63).sky).toBe('rain');
    expect(weatherCodeInfo(75).sky).toBe('snow');
    expect(weatherCodeInfo(95).sky).toBe('storm');
  });

  it('falls back gracefully on unknown codes', () => {
    expect(weatherCodeInfo(999).label).toBe('Unknown');
  });
});
