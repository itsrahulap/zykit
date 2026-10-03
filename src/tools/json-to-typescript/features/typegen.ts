// Infers TypeScript types from a parsed JSON tree (see json-formatter's parser). Array items
// are merged into one shape: keys missing from some items become optional, nulls become
// `| null`, mixed items become union arrays. Identical object shapes share one named type.

import { decodeString, type JsonNode } from '../../json-formatter/features/json';

export interface TypegenOptions {
  rootName: string;
  style: 'interface' | 'type';
  exported: boolean;
  readonly: boolean;
}

export interface TypegenResult {
  code: string;
  /** Number of named declarations emitted. */
  declarations: number;
  /** Some string values look like ISO dates (they're typed as `string`). */
  hasDates: boolean;
}

type Prim = 'string' | 'number' | 'boolean' | 'null';

export interface Field {
  shape: Shape;
  optional: boolean;
}

export interface Shape {
  prims: Set<Prim>;
  /** Merged shape of every object seen at this position. */
  obj: Map<string, Field> | null;
  /** Merged array shape; `item` is null while no item has been seen (empty arrays). */
  arr: { item: Shape | null } | null;
  /** Too deep to describe — rendered as `unknown`. */
  unknown?: boolean;
  /** A number with a fraction or exponent was seen (otherwise numbers here are integers). */
  float?: boolean;
}

/** Nesting deeper than this is typed `unknown` (keeps recursion bounded). */
const MAX_DEPTH = 200;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const PRIM_ORDER: Prim[] = ['string', 'number', 'boolean', 'null'];
/** Global names a generated type shouldn't shadow. */
const RESERVED = new Set([
  'Array', 'Boolean', 'Date', 'Error', 'Function', 'Map', 'Number', 'Object', 'Promise', 'Record', 'RegExp', 'Set', 'String', 'Symbol',
  'Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Element', 'Event', 'Node', 'Response', 'Request', 'Headers', 'File', 'Blob', 'URL',
  'Location', 'Document', 'Window', 'Image', 'Text', 'Comment', 'Range', 'Selection', 'Storage', 'History', 'Screen', 'Navigator',
]);

const empty = (): Shape => ({ prims: new Set(), obj: null, arr: null });

function infer(node: JsonNode, depth: number, dates: { found: boolean }): Shape {
  const s = empty();
  if (depth > MAX_DEPTH) {
    s.unknown = true;
    return s;
  }
  switch (node.type) {
    case 'string':
      if (!dates.found && ISO_DATE.test(decodeString(node.raw))) dates.found = true;
      s.prims.add('string');
      break;
    case 'number':
      s.prims.add('number');
      if (!/^-?\d+$/.test(node.raw)) s.float = true;
      break;
    case 'literal':
      s.prims.add(node.raw === 'null' ? 'null' : 'boolean');
      break;
    case 'object': {
      s.obj = new Map();
      // Duplicate keys: the last one wins, as in JSON.parse.
      for (const e of node.entries) s.obj.set(e.key, { shape: infer(e.value, depth + 1, dates), optional: false });
      break;
    }
    case 'array': {
      let item: Shape | null = null;
      for (const child of node.items) {
        const c = infer(child, depth + 1, dates);
        item = item ? merge(item, c) : c;
      }
      s.arr = { item };
      break;
    }
  }
  return s;
}

/** The merged shape of a parsed JSON tree, for generators targeting other languages. */
export function inferShape(root: JsonNode): Shape {
  return infer(root, 0, { found: false });
}

/** Combines two shapes seen at the same position (mutates and returns `a`). */
function merge(a: Shape, b: Shape): Shape {
  if (b.unknown) a.unknown = true;
  if (b.float) a.float = true;
  for (const p of b.prims) a.prims.add(p);
  if (b.obj) {
    if (!a.obj) a.obj = b.obj;
    else {
      for (const [key, fa] of a.obj) {
        const fb = b.obj.get(key);
        if (!fb) fa.optional = true;
        else {
          fa.shape = merge(fa.shape, fb.shape);
          fa.optional ||= fb.optional;
        }
      }
      for (const [key, fb] of b.obj) if (!a.obj.has(key)) a.obj.set(key, { shape: fb.shape, optional: true });
    }
  }
  if (b.arr) {
    if (!a.arr) a.arr = b.arr;
    else if (b.arr.item) a.arr.item = a.arr.item ? merge(a.arr.item, b.arr.item) : b.arr.item;
  }
  return a;
}

/** "user_profile" / "user-profile" / "userProfile" → "UserProfile"; always a valid identifier. */
export function pascalCase(text: string): string {
  const words = text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  let name = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
  if (!name) name = 'Type';
  if (/^\d/.test(name)) name = `T${name}`;
  return name;
}

const IRREGULAR: Record<string, string> = { people: 'person', children: 'child', men: 'man', women: 'woman', mice: 'mouse', geese: 'goose', feet: 'foot', teeth: 'tooth' };

/** Best-effort English singular ("users" → "user", "categories" → "category"); unchanged when unsure. */
export function singularize(word: string): string {
  const m = /^(.*?)([A-Za-z]+)$/.exec(word);
  if (!m) return word;
  const [, head, last] = m;
  const lower = last.toLowerCase();
  const keepCase = (s: string) => (last[0] === last[0].toUpperCase() ? s[0].toUpperCase() + s.slice(1) : s);
  if (IRREGULAR[lower]) return head + keepCase(IRREGULAR[lower]);
  if (/(ss|us|is|ics|news|series|species|data|status)$/i.test(lower) || lower.length < 3) return word;
  if (/[^aeiou]ies$/.test(lower)) return head + last.slice(0, -3) + 'y';
  if (/(sses|xes|zes|ches|shes)$/.test(lower)) return head + last.slice(0, -2);
  if (lower.endsWith('s')) return head + last.slice(0, -1);
  return word;
}

/** Name hint for the items of an array stored under `key`. */
function itemHint(hint: string): string {
  const single = singularize(hint);
  return single === hint ? `${hint}Item` : single;
}

export function propertyKey(key: string): string {
  return IDENTIFIER.test(key) ? key : JSON.stringify(key);
}

interface Decl {
  name: string;
  body: string[];
}

export function generateTypes(root: JsonNode, options: TypegenOptions): TypegenResult {
  const dates = { found: false };
  const shape = infer(root, 0, dates);
  const rootName = pascalCase(options.rootName.trim() || 'Root');
  const used = new Set<string>([rootName]);
  const bySignature = new Map<string, string>();
  const decls: Decl[] = [];
  const ro = options.readonly ? 'readonly ' : '';

  const uniqueName = (hint: string) => {
    let base = pascalCase(hint);
    if (RESERVED.has(base)) base = `${base}Type`;
    let name = base;
    for (let n = 2; used.has(name); n++) name = `${base}${n}`;
    used.add(name);
    return name;
  };

  const fieldLines = (obj: Map<string, Field>) =>
    [...obj].map(([key, f]) => {
      const t = render(f.shape, key);
      return { key, line: `${ro}${propertyKey(key)}${f.optional ? '?' : ''}: ${t};` };
    });

  /** Registers an object shape as a named type (reusing an identical one) and returns its name. */
  const named = (obj: Map<string, Field>, hint: string, forcedName?: string): string => {
    const fields = fieldLines(obj);
    const signature = [...fields].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)).map((f) => f.line).join('\n');
    if (!forcedName) {
      const existing = bySignature.get(signature);
      if (existing) return existing;
    }
    const name = forcedName ?? uniqueName(hint);
    bySignature.set(signature, name);
    decls.push({ name, body: fields.map((f) => f.line) });
    return name;
  };

  // `hint` names the key this shape sits under, used to name nested object types.
  function render(s: Shape, hint: string): string {
    return renderParts(s, hint).join(' | ');
  }

  function renderParts(s: Shape, hint: string): string[] {
    if (s.unknown) return ['unknown'];
    const parts: string[] = [];
    if (s.obj) parts.push(s.obj.size ? named(s.obj, hint) : 'Record<string, unknown>');
    if (s.arr) {
      const item = s.arr.item ? renderParts(s.arr.item, itemHint(hint)) : ['unknown'];
      const wrapped = item.length > 1 || item[0].startsWith('readonly ') ? `(${item.join(' | ')})` : item[0];
      parts.push(`${ro}${wrapped}[]`);
    }
    for (const p of PRIM_ORDER) if (s.prims.has(p)) parts.push(p);
    return parts.length ? parts : ['unknown'];
  }

  const keyword = options.exported ? 'export ' : '';
  const isPlainObject = shape.obj && shape.obj.size > 0 && !shape.arr && shape.prims.size === 0 && !shape.unknown;
  let rootAlias: string | null = null;
  if (isPlainObject) named(shape.obj!, rootName, rootName);
  else rootAlias = render(shape, rootName);

  const printDecl = (d: Decl) => {
    const inner = d.body.map((l) => `  ${l}`).join('\n');
    const block = d.body.length ? `{\n${inner}\n}` : '{}';
    return options.style === 'interface' ? `${keyword}interface ${d.name} ${block}` : `${keyword}type ${d.name} = ${block};`;
  };

  // Root first, then nested types in the order they were discovered (children before parents).
  const out: string[] = [];
  const rootDecl = decls.find((d) => d.name === rootName);
  if (rootAlias !== null) out.push(`${keyword}type ${rootName} = ${rootAlias};`);
  else if (rootDecl) out.push(printDecl(rootDecl));
  for (const d of [...decls].reverse()) if (d !== rootDecl) out.push(printDecl(d));

  return { code: `${out.join('\n\n')}\n`, declarations: out.length, hasDates: dates.found };
}
