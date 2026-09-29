// Myers O(ND) difference algorithm over integer sequences, linear-space variant
// (divide and conquer on the "middle snake"). Work is capped by a cost budget so
// pathological inputs can't hang the page: when the budget runs out, the remaining
// region is reported as a plain delete + insert and the result is marked inexact.

/** 0 = equal, -1 = delete (only in A), 1 = insert (only in B). */
export type Op = 0 | -1 | 1;

export interface Run {
  op: Op;
  count: number;
}

export interface SequenceDiff {
  runs: Run[];
  /** False when the cost budget ran out and part of the diff is not minimal. */
  exact: boolean;
}

/** Roughly the number of inner-loop steps allowed (well under a second in a browser). */
export const DEFAULT_MAX_COST = 100_000_000;

type Seq = ArrayLike<number>;

class Builder {
  runs: Run[] = [];
  push(op: Op, count: number) {
    if (count <= 0) return;
    const last = this.runs[this.runs.length - 1];
    if (last && last.op === op) last.count += count;
    else this.runs.push({ op, count });
  }
}

interface Budget {
  left: number;
  exhausted: boolean;
}

/**
 * Finds the middle snake of a[aLo..aHi) vs b[bLo..bHi). Returns the split point, 'disjoint' when the
 * ranges share nothing, or null if the budget ran out.
 */
function bisect(a: Seq, aLo: number, aHi: number, b: Seq, bLo: number, bHi: number, budget: Budget): [number, number] | 'disjoint' | null {
  const n = aHi - aLo;
  const m = bHi - bLo;
  const maxD = Math.ceil((n + m) / 2);
  const vOffset = maxD;
  const vLength = 2 * maxD + 2;
  const v1 = new Int32Array(vLength).fill(-1);
  const v2 = new Int32Array(vLength).fill(-1);
  v1[vOffset + 1] = 0;
  v2[vOffset + 1] = 0;
  const delta = n - m;
  const front = delta % 2 !== 0;
  let k1start = 0;
  let k1end = 0;
  let k2start = 0;
  let k2end = 0;

  for (let d = 0; d < maxD; d++) {
    if (budget.left <= 0) return null;
    budget.left -= 2 * d + 2;

    for (let k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
      const k1Offset = vOffset + k1;
      let x1 = k1 === -d || (k1 !== d && v1[k1Offset - 1] < v1[k1Offset + 1]) ? v1[k1Offset + 1] : v1[k1Offset - 1] + 1;
      let y1 = x1 - k1;
      const start = x1;
      while (x1 < n && y1 < m && a[aLo + x1] === b[bLo + y1]) {
        x1++;
        y1++;
      }
      budget.left -= x1 - start;
      v1[k1Offset] = x1;
      if (x1 > n) k1end += 2;
      else if (y1 > m) k1start += 2;
      else if (front) {
        const k2Offset = vOffset + delta - k1;
        if (k2Offset >= 0 && k2Offset < vLength && v2[k2Offset] !== -1) {
          if (x1 >= n - v2[k2Offset]) return [x1, y1];
        }
      }
    }

    for (let k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
      const k2Offset = vOffset + k2;
      let x2 = k2 === -d || (k2 !== d && v2[k2Offset - 1] < v2[k2Offset + 1]) ? v2[k2Offset + 1] : v2[k2Offset - 1] + 1;
      let y2 = x2 - k2;
      const start = x2;
      while (x2 < n && y2 < m && a[aHi - x2 - 1] === b[bHi - y2 - 1]) {
        x2++;
        y2++;
      }
      budget.left -= x2 - start;
      v2[k2Offset] = x2;
      if (x2 > n) k2end += 2;
      else if (y2 > m) k2start += 2;
      else if (!front) {
        const k1Offset = vOffset + delta - k2;
        if (k1Offset >= 0 && k1Offset < vLength && v1[k1Offset] !== -1) {
          const x1 = v1[k1Offset];
          const y1 = vOffset + x1 - k1Offset;
          if (x1 >= n - x2) return [x1, y1];
        }
      }
    }
  }
  // The paths never met, so the shortest edit is D = n + m: nothing in common.
  return 'disjoint';
}

function compute(a: Seq, aLo: number, aHi: number, b: Seq, bLo: number, bHi: number, out: Builder, budget: Budget) {
  // Common prefix
  let prefix = 0;
  while (aLo + prefix < aHi && bLo + prefix < bHi && a[aLo + prefix] === b[bLo + prefix]) prefix++;
  out.push(0, prefix);
  aLo += prefix;
  bLo += prefix;
  // Common suffix (emitted after the middle)
  let suffix = 0;
  while (aHi - suffix > aLo && bHi - suffix > bLo && a[aHi - suffix - 1] === b[bHi - suffix - 1]) suffix++;
  aHi -= suffix;
  bHi -= suffix;

  if (aLo === aHi) out.push(1, bHi - bLo);
  else if (bLo === bHi) out.push(-1, aHi - aLo);
  else {
    const split = budget.exhausted ? null : bisect(a, aLo, aHi, b, bLo, bHi, budget);
    const n = aHi - aLo;
    const m = bHi - bLo;
    if (!split || split === 'disjoint' || (split[0] === 0 && split[1] === 0) || (split[0] === n && split[1] === m)) {
      if (!split) budget.exhausted = true;
      out.push(-1, n);
      out.push(1, m);
    } else {
      compute(a, aLo, aLo + split[0], b, bLo, bLo + split[1], out, budget);
      compute(a, aLo + split[0], aHi, b, bLo + split[1], bHi, out, budget);
    }
  }
  out.push(0, suffix);
}

/** Shortest edit script turning `a` into `b`, as run-length encoded operations. */
export function diffSequences(a: Seq, b: Seq, maxCost = DEFAULT_MAX_COST): SequenceDiff {
  const out = new Builder();
  const budget: Budget = { left: maxCost, exhausted: false };
  compute(a, 0, a.length, b, 0, b.length, out, budget);
  return { runs: out.runs, exact: !budget.exhausted };
}

/** Maps strings to small integers so sequences can be compared with `===` cheaply. */
export class Interner {
  private ids = new Map<string, number>();
  id(s: string): number {
    let v = this.ids.get(s);
    if (v === undefined) {
      v = this.ids.size;
      this.ids.set(s, v);
    }
    return v;
  }
}
