// Structural diff of two parsed JSON trees (json-formatter's parser keeps number text exact).
// Produces a diff tree for the tree view, a flat change list keyed by JSON path, and an
// RFC 6902 JSON Patch that turns the left document into the right one.

import { decodeString, formatJson, parseJson, type JsonNode } from '../../json-formatter/features/json';

export interface DiffOptions {
  /** Match array items by deep equality instead of position. */
  ignoreArrayOrder: boolean;
  /** Compare numbers by value (1 == 1.0 == 1e0) instead of by their text. */
  numericEquality: boolean;
  /** Object keys skipped at any depth. */
  ignoreKeys: string[];
}

export type Segment = string | number;

export type DiffNode =
  | { status: 'same'; a: JsonNode; b: JsonNode }
  | { status: 'added'; b: JsonNode }
  | { status: 'removed'; a: JsonNode }
  | { status: 'changed'; a: JsonNode; b: JsonNode }
  | { status: 'object'; changed: boolean; children: { key: string; node: DiffNode }[] }
  | { status: 'array'; changed: boolean; children: ArrayChild[] };

export interface ArrayChild {
  aIndex: number | null;
  bIndex: number | null;
  node: DiffNode;
}

export type Change =
  | { kind: 'added'; path: Segment[]; value: JsonNode }
  | { kind: 'removed'; path: Segment[]; value: JsonNode }
  | { kind: 'changed'; path: Segment[]; from: JsonNode; to: JsonNode };

export interface DiffResult {
  tree: DiffNode;
  changes: Change[];
  /** Scalar values (and empty containers) that are identical on both sides. */
  unchanged: number;
}

/** LCS table cells above this fall back to position-by-position matching. */
const MAX_LCS_CELLS = 4_000_000;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** Canonical decimal form of a JSON number literal, exact for any size ("1.50e1" → "15"). */
export function canonicalNumber(raw: string): string {
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(raw);
  if (!m) return raw;
  const [, sign, int, frac = '', exp = '0'] = m;
  let digits = int + frac;
  let e = Number(exp) - frac.length;
  const lead = digits.match(/^0*/)![0].length;
  digits = digits.slice(lead);
  if (!digits) return '0';
  const trail = digits.match(/0*$/)![0].length;
  digits = digits.slice(0, digits.length - trail);
  e += trail;
  return `${sign}${digits}e${e}`;
}

export function parseIgnoreKeys(text: string): string[] {
  return text
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

export function diffJson(a: JsonNode, b: JsonNode, options: DiffOptions): DiffResult {
  const ignore = new Set(options.ignoreKeys);
  const hashes = new WeakMap<JsonNode, string>();

  const scalarKey = (n: JsonNode): string => {
    if (n.type === 'string') return `s${decodeString(n.raw)}`;
    if (n.type === 'number') return `n${options.numericEquality ? canonicalNumber(n.raw) : n.raw}`;
    return `l${(n as { raw: string }).raw}`;
  };

  /** Canonical string for deep equality under the current options. */
  const hash = (n: JsonNode): string => {
    const cached = hashes.get(n);
    if (cached !== undefined) return cached;
    let h: string;
    if (n.type === 'object') {
      const map = entriesOf(n);
      const keys = [...map.keys()].sort();
      h = `{${keys.map((k) => `${JSON.stringify(k)}:${hash(map.get(k)!)}`).join(',')}}`;
    } else if (n.type === 'array') {
      const items = n.items.map(hash);
      if (options.ignoreArrayOrder) items.sort();
      h = `[${items.join(',')}]`;
    } else h = JSON.stringify(scalarKey(n));
    hashes.set(n, h);
    return h;
  };

  /** Object entries without ignored keys (last duplicate wins, like JSON.parse). */
  const entriesOf = (n: Extract<JsonNode, { type: 'object' }>) => {
    const map = new Map<string, JsonNode>();
    for (const e of n.entries) if (!ignore.has(e.key)) map.set(e.key, e.value);
    return map;
  };

  const isContainer = (n: JsonNode) => n.type === 'object' || n.type === 'array';

  const diff = (x: JsonNode, y: JsonNode): DiffNode => {
    if (x.type === 'object' && y.type === 'object') {
      const mx = entriesOf(x);
      const my = entriesOf(y);
      const children: { key: string; node: DiffNode }[] = [];
      for (const [k, v] of mx) children.push({ key: k, node: my.has(k) ? diff(v, my.get(k)!) : { status: 'removed', a: v } });
      for (const [k, v] of my) if (!mx.has(k)) children.push({ key: k, node: { status: 'added', b: v } });
      return { status: 'object', changed: children.some((c) => c.node.status !== 'same' && !isSameContainer(c.node)), children };
    }
    if (x.type === 'array' && y.type === 'array') {
      const children = options.ignoreArrayOrder ? alignUnordered(x.items, y.items) : alignOrdered(x.items, y.items);
      return { status: 'array', changed: children.some((c) => c.node.status !== 'same' && !isSameContainer(c.node)), children };
    }
    return hash(x) === hash(y) ? { status: 'same', a: x, b: y } : { status: 'changed', a: x, b: y };
  };

  const isSameContainer = (n: DiffNode) => (n.status === 'object' || n.status === 'array') && !n.changed;

  /** Pairs leftover removed/added items so edits inside an object show up as edits, not remove + add. */
  const pairUp = (removed: number[], added: number[], xs: JsonNode[], ys: JsonNode[]): ArrayChild[] => {
    const out: ArrayChild[] = [];
    const used = new Set<number>();
    if (options.ignoreArrayOrder) {
      // Unordered: pair each leftover object/array with the first unused leftover of the same type.
      for (const i of removed) {
        const xa = xs[i];
        const j = isContainer(xa) ? added.find((k) => !used.has(k) && ys[k].type === xa.type) : undefined;
        if (j === undefined) out.push({ aIndex: i, bIndex: null, node: { status: 'removed', a: xa } });
        else {
          used.add(j);
          out.push({ aIndex: i, bIndex: j, node: diff(xa, ys[j]) });
        }
      }
    } else {
      const n = Math.min(removed.length, added.length);
      for (let k = 0; k < n; k++) {
        used.add(added[k]);
        out.push({ aIndex: removed[k], bIndex: added[k], node: diff(xs[removed[k]], ys[added[k]]) });
      }
      for (let k = n; k < removed.length; k++) out.push({ aIndex: removed[k], bIndex: null, node: { status: 'removed', a: xs[removed[k]] } });
    }
    for (const j of added) if (!used.has(j)) out.push({ aIndex: null, bIndex: j, node: { status: 'added', b: ys[j] } });
    return out;
  };

  const alignOrdered = (xs: JsonNode[], ys: JsonNode[]): ArrayChild[] => {
    const hx = xs.map(hash);
    const hy = ys.map(hash);
    let start = 0;
    while (start < xs.length && start < ys.length && hx[start] === hy[start]) start++;
    let endX = xs.length;
    let endY = ys.length;
    while (endX > start && endY > start && hx[endX - 1] === hy[endY - 1]) {
      endX--;
      endY--;
    }
    const out: ArrayChild[] = [];
    const same = (i: number, j: number) => out.push({ aIndex: i, bIndex: j, node: { status: 'same', a: xs[i], b: ys[j] } });
    for (let i = 0; i < start; i++) same(i, i);

    const n = endX - start;
    const m = endY - start;
    const matches: [number, number][] = [];
    if (n > 0 && m > 0 && n * m <= MAX_LCS_CELLS) {
      // Longest common subsequence of item hashes, then walk it forwards.
      const w = m + 1;
      const table = new Uint32Array((n + 1) * w);
      for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
          table[i * w + j] = hx[start + i] === hy[start + j] ? table[(i + 1) * w + j + 1] + 1 : Math.max(table[(i + 1) * w + j], table[i * w + j + 1]);
        }
      }
      let i = 0;
      let j = 0;
      while (i < n && j < m) {
        if (hx[start + i] === hy[start + j]) {
          matches.push([start + i, start + j]);
          i++;
          j++;
        } else if (table[(i + 1) * w + j] >= table[i * w + j + 1]) i++;
        else j++;
      }
    }
    let pi = start;
    let pj = start;
    for (const [mi, mj] of [...matches, [endX, endY] as [number, number]]) {
      const removed: number[] = [];
      const added: number[] = [];
      for (; pi < mi; pi++) removed.push(pi);
      for (; pj < mj; pj++) added.push(pj);
      out.push(...pairUp(removed, added, xs, ys));
      if (mi < endX) same(mi, mj);
      pi = mi + 1;
      pj = mj + 1;
    }
    for (let k = 0; k < xs.length - endX; k++) same(endX + k, endY + k);
    return out;
  };

  const alignUnordered = (xs: JsonNode[], ys: JsonNode[]): ArrayChild[] => {
    const pool = new Map<string, number[]>();
    ys.forEach((y, j) => {
      const h = hash(y);
      const list = pool.get(h);
      if (list) list.push(j);
      else pool.set(h, [j]);
    });
    const matchedB = new Set<number>();
    const out: ArrayChild[] = [];
    const removed: number[] = [];
    xs.forEach((x, i) => {
      const j = pool.get(hash(x))?.shift();
      if (j === undefined) removed.push(i);
      else {
        matchedB.add(j);
        out.push({ aIndex: i, bIndex: j, node: { status: 'same', a: x, b: ys[j] } });
      }
    });
    const added = ys.map((_, j) => j).filter((j) => !matchedB.has(j));
    // Keep the left side's order for the patch: paired/removed items slot in by left index, additions go last.
    const paired = pairUp(removed, added, xs, ys);
    const all = [...out, ...paired];
    return all.sort((p, q) => (p.aIndex ?? Infinity) - (q.aIndex ?? Infinity) || (p.bIndex ?? 0) - (q.bIndex ?? 0));
  };

  const tree = diff(a, b);
  const changes: Change[] = [];
  let unchanged = 0;
  const countLeaves = (n: JsonNode): number => {
    if (n.type === 'object') {
      const vals = [...entriesOf(n).values()];
      return vals.length ? vals.reduce((s, v) => s + countLeaves(v), 0) : 1;
    }
    if (n.type === 'array') return n.items.length ? n.items.reduce((s, v) => s + countLeaves(v), 0) : 1;
    return 1;
  };
  const walk = (node: DiffNode, path: Segment[]) => {
    switch (node.status) {
      case 'same':
        unchanged += countLeaves(node.a);
        break;
      case 'added':
        changes.push({ kind: 'added', path, value: node.b });
        break;
      case 'removed':
        changes.push({ kind: 'removed', path, value: node.a });
        break;
      case 'changed':
        changes.push({ kind: 'changed', path, from: node.a, to: node.b });
        break;
      case 'object':
        if (!node.children.length) unchanged++;
        for (const c of node.children) walk(c.node, [...path, c.key]);
        break;
      case 'array':
        if (!node.children.length) unchanged++;
        for (const c of node.children) walk(c.node, [...path, (c.bIndex ?? c.aIndex)!]);
        break;
    }
  };
  walk(tree, []);
  return { tree, changes, unchanged };
}

/** `$.users[2].name`, with bracket-quoting for keys that aren't identifiers. */
export function formatPath(path: Segment[]): string {
  let out = '$';
  for (const s of path) {
    if (typeof s === 'number') out += `[${s}]`;
    else out += IDENTIFIER.test(s) ? `.${s}` : `[${JSON.stringify(s)}]`;
  }
  return out;
}

/** RFC 6901 JSON Pointer. */
export function jsonPointer(path: Segment[]): string {
  return path.map((s) => `/${String(s).replace(/~/g, '~0').replace(/\//g, '~1')}`).join('');
}

const compact = (n: JsonNode) => formatJson(n, { indent: null });

/** RFC 6902 patch that turns the left document into the right (array order kept from the left when order is ignored). */
export function toJsonPatch(tree: DiffNode): string {
  const ops: string[] = [];
  const op = (name: string, path: Segment[], value?: JsonNode) =>
    ops.push(`{"op":"${name}","path":${JSON.stringify(jsonPointer(path))}${value ? `,"value":${compact(value)}` : ''}}`);
  const walk = (node: DiffNode, path: Segment[]) => {
    switch (node.status) {
      case 'same':
        break;
      case 'added':
        op('add', path, node.b);
        break;
      case 'removed':
        op('remove', path);
        break;
      case 'changed':
        op('replace', path, node.b);
        break;
      case 'object':
        for (const c of node.children) walk(c.node, [...path, c.key]);
        break;
      case 'array': {
        // Apply left to right, tracking where each item sits in the partly-patched array.
        let k = 0;
        for (const c of node.children) {
          if (c.node.status === 'removed') walk(c.node, [...path, k]);
          else {
            walk(c.node, [...path, k]);
            k++;
          }
        }
        break;
      }
    }
  };
  walk(tree, []);
  const text = `[${ops.join(',')}]`;
  const parsed = parseJson(text);
  return parsed.ok ? formatJson(parsed.value, { indent: 2 }) : text;
}

/** One-line preview of a value, shortened for display. */
export function preview(n: JsonNode, max = 120): string {
  const s = compact(n);
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Plain JSON summary of the changes (for copying). */
export function changesToJson(changes: Change[]): string {
  const items = changes.map((c) => {
    const path = JSON.stringify(formatPath(c.path));
    if (c.kind === 'changed') return `{"type":"changed","path":${path},"from":${compact(c.from)},"to":${compact(c.to)}}`;
    return `{"type":"${c.kind}","path":${path},"value":${compact(c.value)}}`;
  });
  const text = `[${items.join(',')}]`;
  const parsed = parseJson(text);
  return parsed.ok ? formatJson(parsed.value, { indent: 2 }) : text;
}
