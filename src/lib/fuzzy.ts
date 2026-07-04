/**
 * Lightweight fuzzy matcher (subsequence scoring).
 *
 * Scoring favours: consecutive character runs, matches at word
 * boundaries, and earlier matches. Returns null when the needle is
 * not a subsequence of the haystack.
 */
export interface FuzzyResult {
  score: number;
  /** Indices of matched characters in the haystack (for highlighting). */
  indices: number[];
}

export function fuzzyMatch(needle: string, haystack: string): FuzzyResult | null {
  const n = needle.toLowerCase().replace(/\s+/g, '');
  const h = haystack.toLowerCase();
  if (!n) return { score: 0, indices: [] };

  const indices: number[] = [];
  let score = 0;
  let hi = 0;
  let prevMatch = -2;

  for (let ni = 0; ni < n.length; ni++) {
    const ch = n[ni];
    let found = -1;
    for (let j = hi; j < h.length; j++) {
      if (h[j] === ch) { found = j; break; }
    }
    if (found === -1) return null;

    let charScore = 1;
    if (found === prevMatch + 1) charScore += 3;                       // consecutive run
    if (found === 0 || /[\s\-_/]/.test(h[found - 1])) charScore += 2;  // word boundary
    charScore -= Math.min(2, found * 0.02);                            // slight early-match bias

    score += charScore;
    indices.push(found);
    prevMatch = found;
    hi = found + 1;
  }

  // Normalize a little by needle coverage of the haystack
  score += Math.max(0, 2 - (h.length - n.length) * 0.05);
  return { score, indices };
}

/** Rank a list of items by fuzzy score against a query. */
export function fuzzyRank<T>(query: string, items: T[], key: (item: T) => string): T[] {
  if (!query.trim()) return items;
  return items
    .map((item) => ({ item, match: fuzzyMatch(query, key(item)) }))
    .filter((x): x is { item: T; match: FuzzyResult } => x.match !== null)
    .sort((a, b) => b.match.score - a.match.score)
    .map((x) => x.item);
}
