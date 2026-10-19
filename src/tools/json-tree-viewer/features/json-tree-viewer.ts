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

function keys(f: Frame): (string | number)[] {
  const out: (string | number)[] = [];
  for (let c: Frame | null = f; c && c.parent; c = c.parent) out.push(c.key!);
  return out.reverse();
}

/** RFC 6901 JSON Pointer such as `/a/0/b` (`~` → `~0`, `/` → `~1`); the root is the empty string. */
export function jsonPointer(f: Frame): string {
  return keys(f)
    .map((k) => '/' + String(k).replace(/~/g, '~0').replace(/\//g, '~1'))
    .join('');
}

/** JavaScript optional chaining such as `data?.a?.[0]?.["b c"]`. */
export function jsAccess(f: Frame, root = 'data'): string {
  return root + keys(f).map((k) => (typeof k === 'number' ? `?.[${k}]` : IDENT.test(k) ? `?.${k}` : `?.[${JSON.stringify(k)}]`)).join('');
}

/** Reads one quoted key starting at s[i] (a quote); returns the key and the index after the closing quote. */
function quoted(s: string, i: number): [string, number] {
  const q = s[i];
  let out = '';
  for (let j = i + 1; j < s.length; j++) {
    if (s[j] === '\\') {
      if (q === '"') {
        // Double-quoted: full JSON string escapes.
        const m = /^\\(u[0-9a-fA-F]{4}|.)/.exec(s.slice(j));
        if (!m) break;
        out += JSON.parse(`"${m[0]}"`) as string;
        j += m[0].length - 1;
      } else out += s[++j] ?? '';
    } else if (s[j] === q) return [out, j + 1];
    else out += s[j];
  }
  throw new Error('A quoted key is never closed.');
}

/**
 * Parses a JSONPath (`$.a[0]['b c']`), JSON Pointer (`/a/0/b c`) or JavaScript accessor
 * (`data?.a?.[0]?.["b c"]`) into keys. Pointer segments stay strings; `findPath` matches them to array indexes.
 */
export function parsePath(input: string): (string | number)[] {
  const s = input.trim();
  if (!s) throw new Error('Type a path.');
  if (s.startsWith('/')) return s.slice(1).split('/').map((seg) => seg.replace(/~1/g, '/').replace(/~0/g, '~'));
  const head = /^(\$|[A-Za-z_$][\w$]*)/.exec(s);
  if (!head) throw new Error('Start with $ (JSONPath), / (JSON Pointer) or a variable name.');
  const out: (string | number)[] = [];
  let i = head[0].length;
  while (i < s.length) {
    if (s.startsWith('?.', i)) i += 2;
    else if (s[i] === '.') i++;
    else if (s[i] !== '[') throw new Error(`Unexpected “${s[i]}” at position ${i + 1}.`);
    if (s[i] === '[') {
      const n = /^\[\s*(\d+)\s*\]/.exec(s.slice(i));
      if (n) {
        out.push(Number(n[1]));
        i += n[0].length;
        continue;
      }
      if (s[i + 1] !== '"' && s[i + 1] !== "'") throw new Error(`Expected a number or a quoted key at position ${i + 2}.`);
      const [key, end] = quoted(s, i + 1);
      if (s[end] !== ']') throw new Error(`Expected “]” at position ${end + 1}.`);
      out.push(key);
      i = end + 1;
    } else {
      const id = /^[A-Za-z_$][\w$]*/.exec(s.slice(i));
      if (!id) throw new Error(`Expected a property name at position ${i + 1}.`);
      out.push(id[0]);
      i += id[0].length;
    }
  }
  return out;
}

/** The frame at `path`, or the error describing the first key that doesn't exist. Duplicate keys resolve to the last one, as JSON.parse does. */
export function findPath(root: JsonNode, path: (string | number)[]): Frame | string {
  let f: Frame = { node: root, key: null, depth: 0, parent: null };
  for (const k of path) {
    const n = f.node;
    let next: Frame | null = null;
    if (n.type === 'array') {
      const idx = typeof k === 'number' ? k : /^(0|[1-9]\d*)$/.test(k) ? Number(k) : -1;
      if (idx >= 0 && idx < n.items.length) next = { node: n.items[idx], key: idx, depth: f.depth + 1, parent: f };
    } else if (n.type === 'object') {
      const e = n.entries.findLast((x) => x.key === String(k));
      if (e) next = { node: e.value, key: e.key, depth: f.depth + 1, parent: f };
    }
    if (!next) return `${jsonPath(f)} has no ${typeof k === 'number' ? `item [${k}]` : `key “${k}”`}.`;
    f = next;
  }
  return f;
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

/** Text of a scalar as shown (decoded string, raw number or literal); empty for containers. */
export function scalarText(n: JsonNode): string {
  return n.type === 'string' ? decodeString(n.raw) : isContainer(n) ? '' : n.raw;
}

/** Truncates to `max` UTF-16 units without splitting a surrogate pair. */
export function truncate(s: string, max: number): { text: string; cut: boolean } {
  if (s.length <= max) return { text: s, cut: false };
  let end = max;
  const c = s.charCodeAt(end - 1);
  if (c >= 0xd800 && c <= 0xdbff) end--;
  return { text: s.slice(0, end), cut: true };
}

export type SearchIn = 'both' | 'keys' | 'values';

/** Case-insensitive search of keys and/or scalar values, in document order. */
export function searchTree(root: JsonNode, query: string, max = MAX_MATCHES, scope: SearchIn = 'both'): { matches: Frame[]; truncated: boolean } {
  const q = query.toLowerCase();
  const matches: Frame[] = [];
  if (!q) return { matches, truncated: false };
  const stack: Frame[] = [{ node: root, key: null, depth: 0, parent: null }];
  while (stack.length) {
    const f = stack.pop()!;
    const n = f.node;
    const keyHit = scope !== 'values' && typeof f.key === 'string' && f.key.toLowerCase().includes(q);
    const valHit = scope !== 'keys' && !isContainer(n) && scalarText(n).toLowerCase().includes(q);
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
