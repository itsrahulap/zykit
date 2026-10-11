// Pure logic for the JSON tree: flattening the visible rows, JSONPath, search and previews.
// Works on json-formatter's raw-text tree, so big numbers and escapes are shown as written.

import { decodeString, formatJson, type JsonNode } from '../../json-formatter/features/json';

export type NodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

/** One visible occurrence of a node, with the way back to the root (for paths and ancestors). */
export interface Frame {
  node: JsonNode;
  /** Property name, array index, or null for the root. */
  key: string | number | null;
  depth: number;
  parent: Frame | null;
}

export const MAX_ROWS = 1_000_000;
export const MAX_MATCHES = 10_000;
export const STRING_PREVIEW = 120;

export function nodeType(n: JsonNode): NodeType {
  if (n.type === 'literal') return n.raw === 'null' ? 'null' : 'boolean';
  return n.type;
}

export function isContainer(n: JsonNode): n is Extract<JsonNode, { type: 'object' | 'array' }> {
  return n.type === 'object' || n.type === 'array';
}

export function childCount(n: JsonNode): number {
  return n.type === 'object' ? n.entries.length : n.type === 'array' ? n.items.length : 0;
}

function children(f: Frame): Frame[] {
  const n = f.node;
  if (n.type === 'object') return n.entries.map((e) => ({ node: e.value, key: e.key, depth: f.depth + 1, parent: f }));
  if (n.type === 'array') return n.items.map((v, i) => ({ node: v, key: i, depth: f.depth + 1, parent: f }));
  return [];
}

/** Rows currently visible: every node whose ancestors are all in `expanded`, in document order. */
export function flatten(root: JsonNode, expanded: ReadonlySet<JsonNode>, maxRows = MAX_ROWS): { rows: Frame[]; truncated: boolean } {
  const rows: Frame[] = [];
  const stack: Frame[] = [{ node: root, key: null, depth: 0, parent: null }];
  while (stack.length) {
    if (rows.length >= maxRows) return { rows, truncated: true };
    const f = stack.pop()!;
    rows.push(f);
    if (isContainer(f.node) && expanded.has(f.node)) {
      const kids = children(f);
      for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
    }
  }
  return { rows, truncated: false };
}

/** Containers shallower than `depth` (the root is depth 0), so depth 1 shows the root's children. */
export function expandToDepth(root: JsonNode, depth: number): Set<JsonNode> {
  const out = new Set<JsonNode>();
  const stack: { n: JsonNode; d: number }[] = [{ n: root, d: 0 }];
  while (stack.length) {
    const { n, d } = stack.pop()!;
    if (!isContainer(n) || d >= depth) continue;
    out.add(n);
    if (n.type === 'object') for (const e of n.entries) stack.push({ n: e.value, d: d + 1 });
    else for (const v of n.items) stack.push({ n: v, d: d + 1 });
  }
  return out;
}

const IDENT = /^[A-Za-z_$][\w$]*$/;

/** JSONPath such as `$.a[0].b`; keys that aren't identifiers use `$['key']`. */
export function jsonPath(f: Frame): string {
  const parts: string[] = [];
  for (let c: Frame | null = f; c && c.parent; c = c.parent) {
    parts.push(
      typeof c.key === 'number' ? `[${c.key}]` : IDENT.test(c.key as string) ? `.${c.key}` : `['${(c.key as string).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}']`,
    );
  }
  return '$' + parts.reverse().join('');
}

export function ancestors(f: Frame): JsonNode[] {
  const out: JsonNode[] = [];
  for (let c = f.parent; c; c = c.parent) out.push(c.node);
  return out;
}

/** The text a user would want when copying a value: decoded strings, raw numbers, formatted containers. */
export function valueText(n: JsonNode): string {
  if (n.type === 'string') return decodeString(n.raw);
  if (n.type === 'number' || n.type === 'literal') return n.raw;
  return formatJson(n, { indent: 2 });
}

export function scalarText(n: Exclude<JsonNode, { type: 'object' | 'array' }>): string {
  return n.type === 'string' ? decodeString(n.raw) : n.raw;
}

/** Truncates to `max` UTF-16 units without splitting a surrogate pair. */
export function truncate(s: string, max: number): { text: string; cut: boolean } {
  if (s.length <= max) return { text: s, cut: false };
  let end = max;
  const c = s.charCodeAt(end - 1);
  if (c >= 0xd800 && c <= 0xdbff) end--;
  return { text: s.slice(0, end), cut: true };
}

/** Case-insensitive search of keys and scalar values, in document order. */
export function searchTree(root: JsonNode, query: string, max = MAX_MATCHES): { matches: Frame[]; truncated: boolean } {
  const q = query.toLowerCase();
  const matches: Frame[] = [];
  if (!q) return { matches, truncated: false };
  const stack: Frame[] = [{ node: root, key: null, depth: 0, parent: null }];
  while (stack.length) {
    const f = stack.pop()!;
    const n = f.node;
    const keyHit = typeof f.key === 'string' && f.key.toLowerCase().includes(q);
    const valHit = !isContainer(n) && scalarText(n).toLowerCase().includes(q);
    if (keyHit || valHit) {
      if (matches.length >= max) return { matches, truncated: true };
      matches.push(f);
    }
    if (isContainer(n)) {
      const kids = children(f);
      for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
    }
  }
  return { matches, truncated: false };
}
