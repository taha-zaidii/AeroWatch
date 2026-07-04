/**
 * A* pathfinding on a weighted grid, with a binary min-heap frontier.
 *
 * 8-connected movement, octile-distance heuristic (admissible for
 * diagonal cost √2), and per-cell traversal costs so "soft" hazards
 * (storm fringes) are penalised while hard obstacles are impassable.
 */

export interface Point { x: number; y: number }

export interface GridSpec {
  width: number;
  height: number;
  /** Traversal cost multiplier for a cell: 1 = free, Infinity = blocked. */
  cost: (x: number, y: number) => number;
}

class MinHeap {
  private heap: { idx: number; f: number }[] = [];

  get size(): number { return this.heap.length; }

  push(idx: number, f: number): void {
    this.heap.push({ idx, f });
    let i = this.heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent].f <= this.heap[i].f) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  pop(): { idx: number; f: number } | undefined {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last) {
      this.heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let smallest = i;
        if (l < this.heap.length && this.heap[l].f < this.heap[smallest].f) smallest = l;
        if (r < this.heap.length && this.heap[r].f < this.heap[smallest].f) smallest = r;
        if (smallest === i) break;
        [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
        i = smallest;
      }
    }
    return top;
  }
}

const SQRT2 = Math.SQRT2;

function octile(ax: number, ay: number, bx: number, by: number): number {
  const dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
  return Math.max(dx, dy) + (SQRT2 - 1) * Math.min(dx, dy);
}

const NEIGHBORS: [number, number, number][] = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, SQRT2], [1, -1, SQRT2], [-1, 1, SQRT2], [-1, -1, SQRT2],
];

/**
 * Returns the lowest-cost path from start to goal (inclusive),
 * or null when the goal is unreachable.
 */
export function aStar(start: Point, goal: Point, grid: GridSpec): Point[] | null {
  const { width, height, cost } = grid;
  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height;
  if (!inBounds(start.x, start.y) || !inBounds(goal.x, goal.y)) return null;
  if (cost(goal.x, goal.y) === Infinity) return null;

  const id = (x: number, y: number) => y * width + x;
  const g = new Float64Array(width * height).fill(Infinity);
  const cameFrom = new Int32Array(width * height).fill(-1);
  const closed = new Uint8Array(width * height);

  const open = new MinHeap();
  g[id(start.x, start.y)] = 0;
  open.push(id(start.x, start.y), octile(start.x, start.y, goal.x, goal.y));

  while (open.size > 0) {
    const current = open.pop()!;
    const cx = current.idx % width;
    const cy = Math.floor(current.idx / width);
    if (closed[current.idx]) continue;
    closed[current.idx] = 1;

    if (cx === goal.x && cy === goal.y) {
      const path: Point[] = [];
      let node = current.idx;
      while (node !== -1) {
        path.push({ x: node % width, y: Math.floor(node / width) });
        node = cameFrom[node];
      }
      return path.reverse();
    }

    for (const [dx, dy, stepCost] of NEIGHBORS) {
      const nx = cx + dx, ny = cy + dy;
      if (!inBounds(nx, ny)) continue;
      const nid = id(nx, ny);
      if (closed[nid]) continue;
      const cellCost = cost(nx, ny);
      if (cellCost === Infinity) continue;
      // Prevent diagonal corner-cutting through blocked cells
      if (dx !== 0 && dy !== 0 && (cost(cx + dx, cy) === Infinity || cost(cx, cy + dy) === Infinity)) continue;

      const tentative = g[current.idx] + stepCost * cellCost;
      if (tentative < g[nid]) {
        g[nid] = tentative;
        cameFrom[nid] = current.idx;
        open.push(nid, tentative + octile(nx, ny, goal.x, goal.y));
      }
    }
  }
  return null;
}

/** Haversine great-circle distance in meters. */
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
