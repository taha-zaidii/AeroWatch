import { describe, expect, it } from 'vitest';
import { fuzzyMatch, fuzzyRank } from '../fuzzy';

describe('fuzzyMatch', () => {
  it('matches subsequences', () => {
    expect(fuzzyMatch('dash', 'Dashboard')).not.toBeNull();
    expect(fuzzyMatch('wnd', 'Wind & Weather')).not.toBeNull();
  });

  it('rejects non-subsequences', () => {
    expect(fuzzyMatch('xyz', 'Dashboard')).toBeNull();
  });

  it('returns match indices for highlighting', () => {
    const m = fuzzyMatch('db', 'Dashboard')!;
    expect(m.indices).toEqual([0, 4]);
  });

  it('scores consecutive runs above scattered matches', () => {
    const consecutive = fuzzyMatch('dash', 'Dashboard')!;
    const scattered = fuzzyMatch('dsbd', 'Dashboard')!;
    expect(consecutive.score).toBeGreaterThan(scattered.score);
  });

  it('empty needle matches everything with zero score', () => {
    expect(fuzzyMatch('', 'anything')).toEqual({ score: 0, indices: [] });
  });
});

describe('fuzzyRank', () => {
  const items = ['Dashboard', 'Wind & Weather', 'Control Panel', 'Reports'];

  it('ranks the best match first', () => {
    expect(fuzzyRank('dash', items, s => s)[0]).toBe('Dashboard');
    expect(fuzzyRank('wind', items, s => s)[0]).toBe('Wind & Weather');
  });

  it('filters out non-matches', () => {
    expect(fuzzyRank('zzz', items, s => s)).toEqual([]);
  });

  it('returns all items unchanged for an empty query', () => {
    expect(fuzzyRank('', items, s => s)).toEqual(items);
  });
});
