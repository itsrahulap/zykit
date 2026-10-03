// Builds JSON-LD from form values and checks it (or pasted JSON-LD) against the field definitions.

import { typeForName, type Access, type Field, type ListDef, type Obj, type TypeDef } from './schemas';
import { splitValues, validateValue } from './validate';

export interface FormValues {
  values: Record<string, string>;
  lists: Record<string, Record<string, string>[]>;
}

export interface Report {
  /** Required properties that are missing (blocks rich results). */
  missingRequired: string[];
  /** Recommended properties that are missing. */
  missingRecommended: string[];
  /** Values that are present but malformed. */
  invalid: string[];
}

const isLocal = (def: TypeDef, sub: string) => !!def.localSubtypes?.includes(sub);
const levelOf = (f: Field | ListDef, def: TypeDef, sub: string) => (isLocal(def, sub) && f.local ? f.local : f.level);

/* ------------------------------------------------------------------ access */

function formAccess(values: Record<string, string>, lists: Record<string, Record<string, string>[]>): Access {
  const keys = Object.keys(values);
  return {
    raw: (f) => splitValues(f.kind, values[f.key] ?? ''),
    lists: (key) => (lists[key] ?? []).filter((it) => Object.values(it).some((v) => v.trim())).map((it) => formAccess(it, {})),
    has: (prefix) =>
      keys.some((k) => (k === prefix || k.startsWith(prefix + '.')) && values[k].trim() !== '') ||
      (lists[prefix] ?? []).some((it) => Object.values(it).some((v) => v.trim())),
  };
}

const OBJECT_SENTINEL = '(object)';

function collect(v: unknown, out: string[] = []): string[] {
  if (v === null || v === undefined) return out;
  if (Array.isArray(v)) v.forEach((x) => collect(x, out));
  else if (typeof v === 'object') {
    const o = v as Obj;
    const pick = o.url ?? o['@id'] ?? o.name;
    out.push(typeof pick === 'string' && pick ? pick : OBJECT_SENTINEL);
  } else if (String(v).trim() !== '') out.push(String(v).trim());
  return out;
}

/** Follows a dotted path through objects and arrays; a string met before the end counts as present. */
function getPath(node: unknown, segs: string[]): unknown[] {
  if (segs.length === 0) return [node];
  if (Array.isArray(node)) return node.flatMap((n) => getPath(n, segs));
  if (node && typeof node === 'object') return getPath((node as Obj)[segs[0]], segs.slice(1));
  return node === undefined || node === null ? [] : typeof node === 'string' && node.trim() ? [node] : [];
}

function nodeAccess(node: unknown): Access {
  return {
    raw: (f) => getPath(node, f.key.split('.')).flatMap((v) => collect(v)),
    lists: (key) => getPath(node, key.split('.')).flatMap((v) => (Array.isArray(v) ? v : [v])).filter((v) => v && typeof v === 'object').map(nodeAccess),
    has: (prefix) => getPath(node, prefix.split('.')).some((v) => collect(v).length > 0),
  };
}

/* ------------------------------------------------------------------- check */

export function check(def: TypeDef, sub: string, a: Access): Report {
  const r: Report = { missingRequired: [], missingRecommended: [], invalid: [] };
  const miss = (level: string, label: string) => {
    if (level === 'required') r.missingRequired.push(label);
    else if (level === 'recommended') r.missingRecommended.push(label);
  };
  const usedPrefix = (prefix: string) => def.fields.some((f) => f.key.startsWith(prefix + '.') && a.raw(f).length > 0);

  for (const f of def.fields) {
    const vals = a.raw(f);
    if (vals.length) {
      for (const v of vals) {
        const msg = v === OBJECT_SENTINEL ? null : validateValue(f.kind, v);
        if (msg) r.invalid.push(`${f.label}: ${msg}`);
      }
      continue;
    }
    if (f.when && !usedPrefix(f.when)) continue;
    miss(levelOf(f, def, sub), f.label);
  }

  for (const l of def.lists) {
    const items = a.lists(l.key);
    const level = levelOf(l, def, sub);
    if (!items.length) miss(level, l.label);
    else if (l.min && items.length < l.min) r.missingRequired.push(`${l.label}: at least ${l.min} needed`);
    items.forEach((it, i) => {
      for (const f of l.fields) {
        const vals = it.raw(f);
        if (vals.length) {
          for (const v of vals) {
            const msg = v === OBJECT_SENTINEL ? null : validateValue(f.kind, v);
            if (msg) r.invalid.push(`${l.itemLabel} ${i + 1}, ${f.label}: ${msg}`);
          }
        } else if (!(f.exceptLast && i === items.length - 1)) miss(f.level, `${l.itemLabel} ${i + 1}: ${f.label}`);
      }
    });
  }

  if (def.anyOf && !def.anyOf.keys.some((k) => a.has(k))) r.missingRequired.push(def.anyOf.message);
  if (def.check) r.invalid.push(...def.check(a));
  return r;
}

/* ------------------------------------------------------------------- build */

function setPath(root: Obj, key: string, value: unknown, nested: Record<string, string>) {
  const segs = key.split('.');
  let cur = root;
  let prefix = '';
  for (let i = 0; i < segs.length - 1; i++) {
    prefix = prefix ? `${prefix}.${segs[i]}` : segs[i];
    if (typeof cur[segs[i]] !== 'object' || cur[segs[i]] === null) cur[segs[i]] = nested[prefix] ? { '@type': nested[prefix] } : {};
    cur = cur[segs[i]] as Obj;
  }
  cur[segs[segs.length - 1]] = value;
}

function convert(f: Field, parts: string[]): unknown {
  const one = (s: string) => (f.kind === 'number' ? Number(s) : f.kind === 'bool' ? s === 'true' : s);
  const vals = parts.map(one);
  return f.kind === 'urls' || f.kind === 'lines' || f.kind === 'days' ? (vals.length === 1 && f.kind !== 'lines' ? vals[0] : vals) : vals[0];
}

function buildFields(fields: Field[], nested: Record<string, string>, access: Access, into: Obj) {
  for (const f of fields) {
    const parts = access.raw(f);
    if (parts.length) setPath(into, f.key, convert(f, parts), nested);
  }
}

export interface Built {
  data: Obj;
  report: Report;
}

export function buildJsonLd(def: TypeDef, sub: string, form: FormValues): Built {
  const acc = formAccess(form.values, form.lists);
  const data: Obj = { '@context': 'https://schema.org', '@type': sub };
  buildFields(def.fields, def.nested, acc, data);
  for (const l of def.lists) {
    const items = acc.lists(l.key).map((ia, i) => {
      const o: Obj = { '@type': l.itemType };
      if (l.position) o.position = i + 1;
      buildFields(l.fields, l.nested, ia, o);
      return o;
    });
    if (items.length) data[l.key] = items;
  }
  def.post?.(data);
  return { data, report: check(def, sub, acc) };
}

/** Pretty JSON that is safe inside a <script> element: every "<" is written as <. */
export const toJson = (data: unknown) => JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
export const toScript = (data: unknown) => `<script type="application/ld+json">\n${toJson(data)}\n</script>`;

/* --------------------------------------------------------- validate pasted */

export interface NodeReport {
  type: string;
  known: boolean;
  label: string;
  report: Report;
}
export interface ExistingResult {
  error?: string;
  /** Page-level problems (context, empty input). */
  notes: string[];
  nodes: NodeReport[];
}

const SCRIPT_RE = /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;

/** Accepts raw JSON, or HTML containing one or more ld+json script blocks. */
export function extractJsonBlocks(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  const blocks = [...t.matchAll(SCRIPT_RE)].map((m) => m[1].trim()).filter(Boolean);
  return blocks.length ? blocks : [t];
}

const contextOk = (c: unknown) => (typeof c === 'string' ? /^https?:\/\/schema\.org\/?$/i.test(c.trim()) : Array.isArray(c) && c.some(contextOk));

export function validateExisting(text: string): ExistingResult {
  const res: ExistingResult = { notes: [], nodes: [] };
  const blocks = extractJsonBlocks(text);
  if (!blocks.length) return { ...res, error: 'Paste some JSON-LD or an HTML snippet that contains it.' };
  const roots: unknown[] = [];
  for (const [i, b] of blocks.entries()) {
    try {
      roots.push(JSON.parse(b));
    } catch (e) {
      return { ...res, error: `${blocks.length > 1 ? `Block ${i + 1}: ` : ''}Not valid JSON: ${e instanceof Error ? e.message : 'parse error'}` };
    }
  }
  const visit = (node: unknown, inherited: unknown, top: boolean) => {
    if (Array.isArray(node)) return node.forEach((n) => visit(n, inherited, top));
    if (!node || typeof node !== 'object') return;
    const o = node as Obj;
    const ctx = o['@context'] ?? inherited;
    if (Array.isArray(o['@graph'])) return o['@graph'].forEach((n) => visit(n, ctx, top));
    if (top && !contextOk(ctx)) res.notes.push('Missing or unusual @context: use "https://schema.org".');
    const types = ([] as unknown[]).concat(o['@type'] ?? []).filter((t): t is string => typeof t === 'string');
    if (!types.length) return void res.notes.push('An object without @type was skipped.');
    const match = types.map((t) => ({ t, m: typeForName(t) })).find((x) => x.m);
    if (!match?.m) return void res.nodes.push({ type: types.join(', '), known: false, label: types.join(', '), report: { missingRequired: [], missingRecommended: [], invalid: [] } });
    res.nodes.push({ type: match.t, known: true, label: match.m.def.label, report: check(match.m.def, match.t, nodeAccess(o)) });
  };
  roots.forEach((r) => visit(r, undefined, true));
  res.notes = [...new Set(res.notes)];
  if (!res.nodes.length && !res.notes.length) res.notes.push('No typed objects were found.');
  return res;
}

export const SAMPLE_EXISTING = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Trail Runner 2 shoes",
  "image": "https://example.com/shoe.jpg",
  "offers": { "@type": "Offer", "price": "$89.99", "priceCurrency": "usd" }
}
</script>`;
