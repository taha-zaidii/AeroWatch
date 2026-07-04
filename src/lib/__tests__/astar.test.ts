import { describe, expect, it } from 'vitest';
import { aStar, haversine, type GridSpec } from '../astar';

const open = (width: number, height: number): GridSpec => ({
  width, height, cost: () => 1,
});

describe('aStar', () => {
  it('finds the straight diagonal on an open grid', () => {
    const path = aStar({ x: 0, y: 0 }, { x: 4, y: 4 }, open(5, 5))!;
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 4, y: 4 });
    expect(path).toHaveLength(5); // pure diagonal
  });

  it('routes around a wall', () => {
    // vertical wall at x=2 with a gap at y=4
    const grid: GridSpec = {
      width: 5, height: 5,
      cost: (x, y) => (x === 2 && y !== 4 ? Infinity : 1),
    };
    const path = aStar({ x: 0, y: 0 }, { x: 4, y: 0 }, grid)!;
    expect(path).not.toBeNull();
    expect(path.some(p => p.x === 2 && p.y === 4)).toBe(true);
    expect(path.every(p => grid.cost(p.x, p.y) !== Infinity)).toBe(true);
  });

  it('returns null when the goal is walled off', () => {
    const grid: GridSpec = {
      width: 5, height: 5,
      cost: (x) => (x === 2 ? Infinity : 1),
    };
    expect(aStar({ x: 0, y: 0 }, { x: 4, y: 0 }, grid)).toBeNull();
  });

  it('returns null for out-of-bounds or blocked goals', () => {
    expect(aStar({ x: 0, y: 0 }, { x: 9, y: 9 }, open(5, 5))).toBeNull();
    const blockedGoal: GridSpec = { width: 3, height: 3, cost: (x, y) => (x === 2 && y === 2 ? Infinity : 1) };
    expect(aStar({ x: 0, y: 0 }, { x: 2, y: 2 }, blockedGoal)).toBeNull();
  });

  it('prefers cheap detours over expensive fringes', () => {
    // a soft-cost band at x=2 (cost 10) with a free corridor at y=0
    const grid: GridSpec = {
      width: 5, height: 5,
      cost: (x, y) => (x === 2 && y > 0 ? 10 : 1),
    };
    const path = aStar({ x: 0, y: 4 }, { x: 4, y: 4 }, grid)!;
    const crossing = path.find(p => p.x === 2)!;
    expect(crossing.y).toBe(0); // crossed through the free corridor
  });

  it('does not cut corners through blocked cells diagonally', () => {
    const grid: GridSpec = {
      width: 3, height: 3,
      cost: (x, y) => ((x === 1 && y === 0) || (x === 0 && y === 1) ? Infinity : 1),
    };
    const path = aStar({ x: 0, y: 0 }, { x: 2, y: 2 }, grid);
    // (0,0) -> (1,1) diagonal would cut between two blocked cells
    expect(path).toBeNull();
  });
});

describe('haversine', () => {
  it('measures ~111 km per degree of latitude', () => {
    const d = haversine(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });

  it('is zero for identical points', () => {
    expect(haversine(33.7, 73.0, 33.7, 73.0)).toBe(0);
  });
});
