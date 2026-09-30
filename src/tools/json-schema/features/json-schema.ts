// JSON Schema validator (draft 2020-12 and draft-07: core + validation vocabularies) and a
// schema generator. Pure TypeScript, unit-tested in Node. $ref resolves within the same document
// only; remote schemas are never fetched.

export type Draft = '2020-12' | 'draft-07';

export interface ValidationError {
  /** JSON Pointer into the instance ('' is the root). */
  instancePath: string;
  /** Location of the failing keyword in the schema, e.g. "#/properties/age/minimum". */
  schemaPath: string;
  keyword: string;
  message: string;
}

export interface ValidateOptions {
  /** 'auto' reads $schema (default 2020-12). */
  draft?: Draft | 'auto';
  /** Treat "format" as an assertion (it's only an annotation by default). */
  assertFormat?: boolean;
  maxErrors?: number;
}

export interface ValidateResult {
  valid: boolean;
  errors: ValidationError[];
  /** True when more errors existed than maxErrors. */
  truncated: boolean;
  draft: Draft;
  notices: string[];
}

export const SCHEMA_URIS: Record<Draft, string> = {
  '2020-12': 'https://json-schema.org/draft/2020-12/schema',
  'draft-07': 'http://json-schema.org/draft-07/schema#',
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const hasOwn = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const esc = (k: string) => k.replace(/~/g, '~0').replace(/\//g, '~1');
const DEFAULT_BASE = 'https://zykit.invalid/schema.json';
const MAX_DEPTH = 300;

export function detectDraft(schema: unknown): { draft: Draft; notice?: string } {
  const s = isObj(schema) && typeof schema.$schema === 'string' ? schema.$schema : '';
  if (/draft-0?7/.test(s)) return { draft: 'draft-07' };
  if (/draft-0?[46]/.test(s)) return { draft: 'draft-07', notice: `${s} is validated with draft-07 rules (the closest supported draft).` };
  if (/2019-09/.test(s)) return { draft: '2020-12', notice: 'Draft 2019-09 is validated with 2020-12 rules.' };
  return { draft: '2020-12' };
}

// ---------------------------------------------------------------------------------------------
// Equality and types

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  if (isObj(a)) {
    if (!isObj(b)) return false;
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every((k) => hasOwn(b, k) && deepEqual(a[k], b[k]));
  }
  return false;
}

/** Canonical JSON (sorted keys) for uniqueness checks. */
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (isObj(v)) return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
  return JSON.stringify(v) ?? 'null';
}

export function typeOf(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v;
}

function typeMatches(t: unknown, v: unknown): boolean {
  const actual = typeOf(v);
  return t === actual || (t === 'number' && actual === 'integer');
}

const preview = (v: unknown, max = 60) => {
  const s = JSON.stringify(v) ?? String(v);
  return s.length > max ? `${s.slice(0, max)}…` : s;
};
const plural = (n: number, w: string, many = `${w}s`) => `${n} ${n === 1 ? w : many}`;

// ---------------------------------------------------------------------------------------------
// Formats

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[zZ]|([+-])(\d{2}):(\d{2}))$/;

function validDate(s: string): boolean {
  const m = DATE.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return mo >= 1 && mo <= 12 && d >= 1 && d <= days[mo - 1];
}

function validTime(s: string): boolean {
  const m = TIME.exec(s);
  if (!m) return false;
  const [h, mi, sec] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (m[4] && (Number(m[5]) > 23 || Number(m[6]) > 59)) return false;
  if (h > 23 || mi > 59 || sec > 60) return false;
  if (sec === 60) {
    // Leap seconds happen at 23:59:60 UTC.
    let utc = h * 60 + mi;
    if (m[4]) utc -= (m[4] === '+' ? 1 : -1) * (Number(m[5]) * 60 + Number(m[6]));
    utc = ((utc % 1440) + 1440) % 1440;
    return utc === 23 * 60 + 59;
  }
  return true;
}

function validIpv4(s: string): boolean {
  const parts = s.split('.');
  return parts.length === 4 && parts.every((p) => /^(?:0|[1-9]\d{0,2})$/.test(p) && Number(p) <= 255);
}

function validIpv6(s: string): boolean {
  if (!/^[0-9A-Fa-f:.]+$/.test(s)) return false;
  const halves = s.split('::');
  if (halves.length > 2) return false;
  const groups = (h: string) => (h === '' ? [] : h.split(':'));
  const parts = halves.flatMap(groups);
  let count = 0;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.includes('.')) {
      if (i !== parts.length - 1 || !validIpv4(p)) return false;
      count += 2;
    } else if (/^[0-9A-Fa-f]{1,4}$/.test(p)) count++;
    else return false;
  }
  return halves.length === 2 ? count < 8 : count === 8;
}

const EMAIL = /^(?!\.)(?!.*\.\.)[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*|\[[^\]\s]+\])$/;
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const URI = /^[A-Za-z][A-Za-z0-9+.-]*:(?:[A-Za-z0-9\-._~!$&'()*+,;=:@/?#[\]]|%[0-9A-Fa-f]{2})*$/;

export const FORMATS: Record<string, (s: string) => boolean> = {
  'date-time': (s) => {
    const i = s.search(/[tT]/);
    return i === 10 && validDate(s.slice(0, i)) && validTime(s.slice(i + 1));
  },
  date: validDate,
  time: validTime,
  email: (s) => EMAIL.test(s),
  ipv4: validIpv4,
  ipv6: validIpv6,
  uuid: (s) => UUID.test(s),
  uri: (s) => URI.test(s),
};

// ---------------------------------------------------------------------------------------------
// Schema index: JSON pointers, $id resources and anchors

const SINGLE = ['additionalItems', 'additionalProperties', 'contains', 'propertyNames', 'not', 'if', 'then', 'else', 'unevaluatedItems', 'unevaluatedProperties', 'items'];
const LISTS = ['allOf', 'anyOf', 'oneOf', 'prefixItems', 'items'];
const MAPS = ['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas', 'dependencies'];

class SchemaIndex {
  pointers = new Map<object, string>();
  bases = new Map<object, string>();
  resources = new Map<string, unknown>();
  anchors = new Map<string, unknown>();
  keywords = new Set<string>();

  constructor(root: unknown, readonly draft: Draft) {
    this.walk(root, '#', DEFAULT_BASE, true);
  }

  private walk(s: unknown, ptr: string, base: string, isRoot = false) {
    if (!isObj(s) || this.pointers.has(s)) return;
    this.pointers.set(s, ptr);
    const id = typeof s.$id === 'string' ? s.$id : null;
    let b = base;
    if (id !== null) {
      if (this.draft === 'draft-07' && id.startsWith('#')) this.anchors.set(`${base}${id}`, s);
      else {
        try {
          const u = new URL(id, base);
          u.hash = '';
          b = u.href;
          this.resources.set(b, s);
        } catch {
          /* ignore invalid $id */
        }
      }
    }
    if (isRoot) {
      this.resources.set(b, s);
      this.resources.set(DEFAULT_BASE, s);
    }
    this.bases.set(s, b);
    for (const k of ['$anchor', '$dynamicAnchor']) if (typeof s[k] === 'string') this.anchors.set(`${b}#${s[k] as string}`, s);
    for (const k of Object.keys(s)) this.keywords.add(k);
    for (const k of SINGLE) if (k in s && (isObj(s[k]) || typeof s[k] === 'boolean')) this.walk(s[k], `${ptr}/${k}`, b);
    for (const k of LISTS) if (Array.isArray(s[k])) (s[k] as unknown[]).forEach((x, i) => this.walk(x, `${ptr}/${k}/${i}`, b));
    for (const k of MAPS) {
      const m = s[k];
      if (isObj(m)) for (const [name, sub] of Object.entries(m)) this.walk(sub, `${ptr}/${k}/${esc(name)}`, b);
    }
  }

  resolve(ref: string, from: object): { schema: unknown; ptr: string } | null {
    const base = this.bases.get(from) ?? DEFAULT_BASE;
    let url: URL;
    try {
      url = new URL(ref, base);
    } catch {
      return null;
    }
    let frag: string;
    try {
      frag = decodeURIComponent(url.hash.slice(1));
    } catch {
      return null;
    }
    url.hash = '';
    const resource = this.resources.get(url.href);
    if (resource === undefined) return null;
    let target: unknown;
    if (frag === '') target = resource;
    else if (frag.startsWith('/')) {
      target = resource;
      for (const tok of frag.slice(1).split('/')) {
        const key = tok.replace(/~1/g, '/').replace(/~0/g, '~');
        if (Array.isArray(target) && /^(?:0|[1-9]\d*)$/.test(key)) target = target[Number(key)];
        else if (isObj(target) && hasOwn(target, key)) target = target[key];
        else return null;
      }
    } else target = this.anchors.get(`${url.href}#${frag}`);
    if (target === undefined) return null;
    const known = isObj(target) ? this.pointers.get(target) : undefined;
    return { schema: target, ptr: known ?? `${ref}` };
  }
}

// ---------------------------------------------------------------------------------------------
// Validator

class Validator {
  private regexes = new Map<string, RegExp | null>();
  constructor(
    private readonly index: SchemaIndex,
    private readonly draft: Draft,
    private readonly assertFormat: boolean,
  ) {}

  regex(p: string): RegExp | null {
    if (this.regexes.has(p)) return this.regexes.get(p)!;
    let re: RegExp | null = null;
    try {
      re = new RegExp(p, 'u');
    } catch {
      try {
        re = new RegExp(p);
      } catch {
        re = null;
      }
    }
    this.regexes.set(p, re);
    return re;
  }

  valid(schema: unknown, inst: unknown, sp: string, depth: number): boolean {
    return this.v(schema, inst, '', sp, depth).length === 0;
  }

  v(schema: unknown, inst: unknown, ip: string, sp: string, depth: number): ValidationError[] {
    const errs: ValidationError[] = [];
    const add = (keyword: string, message: string, at = ip) => errs.push({ instancePath: at, schemaPath: `${sp}/${keyword}`, keyword, message });
    if (schema === true) return errs;
    if (schema === false) {
      errs.push({ instancePath: ip, schemaPath: sp, keyword: 'false', message: 'Not allowed here (the schema is false)' });
      return errs;
    }
    if (!isObj(schema)) return errs;
    if (depth > MAX_DEPTH) {
      add('$ref', 'Schema recursion is too deep — is there a $ref loop?');
      return errs;
    }
    const s = schema;

    for (const kw of ['$ref', ...(this.draft === '2020-12' ? ['$dynamicRef', '$recursiveRef'] : [])]) {
      if (typeof s[kw] !== 'string') continue;
      const ref = s[kw] as string;
      const target = this.index.resolve(ref, s);
      if (!target) add(kw, `Can’t resolve ${kw} "${ref}" — only references within this document are supported (remote schemas aren’t fetched)`);
      else errs.push(...this.v(target.schema, inst, ip, target.ptr, depth + 1));
    }
    if (this.draft === 'draft-07' && typeof s.$ref === 'string') return errs; // draft-07: $ref overrides its siblings

    // --- any type ---
    if ('type' in s) {
      const types = Array.isArray(s.type) ? s.type : [s.type];
      if (!types.some((t) => typeMatches(t, inst))) {
        const want = types.map((t) => `"${String(t)}"`).join(' or ');
        add('type', `Expected type ${want} but got ${typeOf(inst)}`);
      }
    }
    if (Array.isArray(s.enum) && !s.enum.some((e) => deepEqual(e, inst))) {
      add('enum', `Must be one of: ${s.enum.slice(0, 10).map((e) => preview(e, 30)).join(', ')}${s.enum.length > 10 ? ', …' : ''}`);
    }
    if ('const' in s && !deepEqual(s.const, inst)) add('const', `Must be exactly ${preview(s.const)}`);

    // --- numbers ---
    if (typeof inst === 'number') {
      if (typeof s.multipleOf === 'number' && s.multipleOf > 0 && !isMultiple(inst, s.multipleOf)) add('multipleOf', `Must be a multiple of ${s.multipleOf}`);
      const exMax = s.exclusiveMaximum === true;
      const exMin = s.exclusiveMinimum === true;
      if (typeof s.maximum === 'number' && (exMax ? inst >= s.maximum : inst > s.maximum)) add('maximum', `Must be ${exMax ? '<' : '≤'} ${s.maximum}`);
      if (typeof s.minimum === 'number' && (exMin ? inst <= s.minimum : inst < s.minimum)) add('minimum', `Must be ${exMin ? '>' : '≥'} ${s.minimum}`);
      if (typeof s.exclusiveMaximum === 'number' && inst >= s.exclusiveMaximum) add('exclusiveMaximum', `Must be < ${s.exclusiveMaximum}`);
      if (typeof s.exclusiveMinimum === 'number' && inst <= s.exclusiveMinimum) add('exclusiveMinimum', `Must be > ${s.exclusiveMinimum}`);
    }

    // --- strings ---
    if (typeof inst === 'string') {
      const len = (s.maxLength !== undefined || s.minLength !== undefined) ? [...inst].length : 0;
      if (typeof s.maxLength === 'number' && len > s.maxLength) add('maxLength', `Must be at most ${plural(s.maxLength, 'character')} long (is ${len})`);
      if (typeof s.minLength === 'number' && len < s.minLength) add('minLength', `Must be at least ${plural(s.minLength, 'character')} long (is ${len})`);
      if (typeof s.pattern === 'string') {
        const re = this.regex(s.pattern);
        if (!re) add('pattern', `The schema’s pattern /${s.pattern}/ isn’t a valid regular expression`);
        else if (!re.test(inst)) add('pattern', `Must match the pattern /${s.pattern}/`);
      }
      if (this.assertFormat && typeof s.format === 'string' && FORMATS[s.format] && !FORMATS[s.format](inst)) add('format', `Must be a valid ${s.format}`);
    }

    // --- arrays ---
    if (Array.isArray(inst)) {
      if (typeof s.maxItems === 'number' && inst.length > s.maxItems) add('maxItems', `Must have at most ${plural(s.maxItems, 'item')} (has ${inst.length})`);
      if (typeof s.minItems === 'number' && inst.length < s.minItems) add('minItems', `Must have at least ${plural(s.minItems, 'item')} (has ${inst.length})`);
      const tuple = this.draft === '2020-12' && Array.isArray(s.prefixItems) ? { list: s.prefixItems as unknown[], kw: 'prefixItems' } : Array.isArray(s.items) ? { list: s.items as unknown[], kw: 'items' } : null;
      let start = 0;
      if (tuple) {
        const n = Math.min(inst.length, tuple.list.length);
        for (let i = 0; i < n; i++) errs.push(...this.v(tuple.list[i], inst[i], `${ip}/${i}`, `${sp}/${tuple.kw}/${i}`, depth + 1));
        start = tuple.list.length;
      }
      const rest = tuple?.kw === 'prefixItems' && 'items' in s && !Array.isArray(s.items) ? { schema: s.items, kw: 'items' }
        : tuple?.kw === 'items' ? ('additionalItems' in s ? { schema: s.additionalItems, kw: 'additionalItems' } : null)
          : 'items' in s && !Array.isArray(s.items) ? { schema: s.items, kw: 'items' } : null;
      if (rest) {
        for (let i = start; i < inst.length; i++) {
          if (rest.schema === false) {
            add(rest.kw, `Item ${i} isn’t allowed: at most ${plural(start, 'item')} ${start === 1 ? 'is' : 'are'} allowed`, `${ip}/${i}`);
            break;
          }
          errs.push(...this.v(rest.schema, inst[i], `${ip}/${i}`, `${sp}/${rest.kw}`, depth + 1));
        }
      }
      if ('contains' in s) {
        let n = 0;
        for (let i = 0; i < inst.length; i++) if (this.valid(s.contains, inst[i], `${sp}/contains`, depth + 1)) n++;
        const minC = this.draft === '2020-12' && typeof s.minContains === 'number' ? s.minContains : 1;
        const maxC = this.draft === '2020-12' && typeof s.maxContains === 'number' ? s.maxContains : Infinity;
        if (n < minC) add(minC === 1 ? 'contains' : 'minContains', `Must contain at least ${plural(minC, 'item')} matching the "contains" schema (found ${n})`);
        if (n > maxC) add('maxContains', `Must contain at most ${plural(maxC, 'item')} matching the "contains" schema (found ${n})`);
      }
      if (s.uniqueItems === true) {
        const seen = new Map<string, number>();
        for (let i = 0; i < inst.length; i++) {
          const key = canonical(inst[i]);
          const prev = seen.get(key);
          if (prev !== undefined) {
            add('uniqueItems', `Items ${prev} and ${i} are equal; items must be unique`);
            break;
          }
          seen.set(key, i);
        }
      }
    }

    // --- objects ---
    if (isObj(inst)) {
      const keys = Object.keys(inst);
      if (typeof s.maxProperties === 'number' && keys.length > s.maxProperties) add('maxProperties', `Must have at most ${plural(s.maxProperties, 'property', 'properties')} (has ${keys.length})`);
      if (typeof s.minProperties === 'number' && keys.length < s.minProperties) add('minProperties', `Must have at least ${plural(s.minProperties, 'property', 'properties')} (has ${keys.length})`);
      if (Array.isArray(s.required)) for (const r of s.required) if (typeof r === 'string' && !hasOwn(inst, r)) add('required', `Missing required property "${r}"`);
      const props = isObj(s.properties) ? s.properties : null;
      const pats = isObj(s.patternProperties) ? Object.entries(s.patternProperties) : [];
      for (const k of keys) {
        const path = `${ip}/${esc(k)}`;
        let matched = false;
        if (props && hasOwn(props, k)) {
          matched = true;
          errs.push(...this.v(props[k], inst[k], path, `${sp}/properties/${esc(k)}`, depth + 1));
        }
        for (const [p, sub] of pats) {
          const re = this.regex(p);
          if (!re) {
            add('patternProperties', `The schema’s pattern /${p}/ isn’t a valid regular expression`);
            continue;
          }
          if (re.test(k)) {
            matched = true;
            errs.push(...this.v(sub, inst[k], path, `${sp}/patternProperties/${esc(p)}`, depth + 1));
          }
        }
        if (!matched && 'additionalProperties' in s) {
          if (s.additionalProperties === false) add('additionalProperties', `Property "${k}" isn’t allowed (additionalProperties is false)`, path);
          else errs.push(...this.v(s.additionalProperties, inst[k], path, `${sp}/additionalProperties`, depth + 1));
        }
        if ('propertyNames' in s) {
          for (const e of this.v(s.propertyNames, k, ip, `${sp}/propertyNames`, depth + 1)) errs.push({ ...e, instancePath: ip, message: `Property name "${k}": ${e.message}` });
        }
      }
      const depReq = isObj(s.dependentRequired) ? s.dependentRequired : {};
      const depSch = isObj(s.dependentSchemas) ? s.dependentSchemas : {};
      const deps = isObj(s.dependencies) ? s.dependencies : {};
      const required: [string, unknown, string][] = [
        ...Object.entries(depReq).map(([k, l]): [string, unknown, string] => [k, l, 'dependentRequired']),
        ...Object.entries(deps).filter(([, d]) => Array.isArray(d)).map(([k, l]): [string, unknown, string] => [k, l, 'dependencies']),
      ];
      for (const [k, list, kw] of required) {
        if (!hasOwn(inst, k) || !Array.isArray(list)) continue;
        for (const r of list) if (typeof r === 'string' && !hasOwn(inst, r)) add(`${kw}/${esc(k)}`, `Property "${r}" is required when "${k}" is present`);
      }
      const schemas: [string, unknown, string][] = [
        ...Object.entries(depSch).map(([k, d]): [string, unknown, string] => [k, d, 'dependentSchemas']),
        ...Object.entries(deps).filter(([, d]) => !Array.isArray(d)).map(([k, d]): [string, unknown, string] => [k, d, 'dependencies']),
      ];
      for (const [k, sub, kw] of schemas) if (hasOwn(inst, k)) errs.push(...this.v(sub, inst, ip, `${sp}/${kw}/${esc(k)}`, depth + 1));
    }

    // --- applicators ---
    if (Array.isArray(s.allOf)) s.allOf.forEach((sub, i) => errs.push(...this.v(sub, inst, ip, `${sp}/allOf/${i}`, depth + 1)));
    if (Array.isArray(s.anyOf) && !s.anyOf.some((sub, i) => this.valid(sub, inst, `${sp}/anyOf/${i}`, depth + 1))) {
      add('anyOf', `Must match at least one of the ${s.anyOf.length} schemas in anyOf`);
    }
    if (Array.isArray(s.oneOf)) {
      const ok = s.oneOf.map((sub, i) => (this.valid(sub, inst, `${sp}/oneOf/${i}`, depth + 1) ? i : -1)).filter((i) => i >= 0);
      if (ok.length === 0) add('oneOf', `Must match exactly one of the ${s.oneOf.length} schemas in oneOf (matched none)`);
      else if (ok.length > 1) add('oneOf', `Must match exactly one schema in oneOf (matched ${ok.length}: ${ok.join(', ')})`);
    }
    if ('not' in s && this.valid(s.not, inst, `${sp}/not`, depth + 1)) add('not', 'Must not match the schema in "not"');
    if ('if' in s) {
      const ok = this.valid(s.if, inst, `${sp}/if`, depth + 1);
      if (ok && 'then' in s) errs.push(...this.v(s.then, inst, ip, `${sp}/then`, depth + 1));
      if (!ok && 'else' in s) errs.push(...this.v(s.else, inst, ip, `${sp}/else`, depth + 1));
    }
    return errs;
  }
}

function decimals(n: number): number {
  const s = String(n);
  const e = /e-(\d+)$/.exec(s);
  const dot = s.indexOf('.');
  const frac = dot === -1 ? 0 : (e ? s.slice(dot + 1, s.indexOf('e')) : s.slice(dot + 1)).length;
  return frac + (e ? Number(e[1]) : 0);
}

export function isMultiple(x: number, m: number): boolean {
  const q = x / m;
  if (!Number.isFinite(q)) return false;
  if (Number.isInteger(q)) return true;
  const d = Math.max(decimals(x), decimals(m));
  if (d <= 15) {
    const scale = 10 ** d;
    const xi = Math.round(x * scale);
    const mi = Math.round(m * scale);
    if (Number.isSafeInteger(xi) && Number.isSafeInteger(mi) && mi !== 0) return xi % mi === 0;
  }
  return Math.abs(q - Math.round(q)) < 1e-9;
}

export function validate(schema: unknown, instance: unknown, opts: ValidateOptions = {}): ValidateResult {
  const notices: string[] = [];
  let draft: Draft;
  if (!opts.draft || opts.draft === 'auto') {
    const d = detectDraft(schema);
    draft = d.draft;
    if (d.notice) notices.push(d.notice);
  } else draft = opts.draft;
  if (!isObj(schema) && typeof schema !== 'boolean') {
    return { valid: false, errors: [{ instancePath: '', schemaPath: '#', keyword: 'schema', message: 'A schema must be an object or a boolean' }], truncated: false, draft, notices };
  }
  const index = new SchemaIndex(schema, draft);
  for (const k of ['unevaluatedProperties', 'unevaluatedItems']) if (index.keywords.has(k)) notices.push(`${k} isn’t supported yet and is ignored.`);
  if (index.keywords.has('$dynamicRef') || index.keywords.has('$recursiveRef')) notices.push('$dynamicRef is resolved like a plain $ref (no dynamic scope).');
  const all = new Validator(index, draft, !!opts.assertFormat).v(schema, instance, '', '#', 0);
  const max = opts.maxErrors ?? 500;
  return { valid: all.length === 0, errors: all.slice(0, max), truncated: all.length > max, draft, notices };
}

// ---------------------------------------------------------------------------------------------
// Schema inference

type Prim = 'null' | 'boolean' | 'integer' | 'number' | 'string' | 'array' | 'object';

interface Shape {
  types: Set<Prim>;
  props: Map<string, Shape>;
  propCount: Map<string, number>;
  objects: number;
  items: Shape | null;
  /** undefined: no strings seen yet; null: strings have mixed or no format. */
  format: string | null | undefined;
}

const newShape = (): Shape => ({ types: new Set(), props: new Map(), propCount: new Map(), objects: 0, items: null, format: undefined });
const DETECT = ['date-time', 'date', 'uuid', 'email', 'ipv4', 'uri'];

function addSample(sh: Shape, v: unknown, depth = 0) {
  if (depth > 200) return;
  const t = typeOf(v) as Prim;
  sh.types.add(t);
  if (t === 'string') {
    const f = DETECT.find((k) => FORMATS[k](v as string)) ?? null;
    sh.format = sh.format === undefined ? f : sh.format === f ? f : null;
  } else if (t === 'array') {
    for (const x of v as unknown[]) addSample((sh.items ??= newShape()), x, depth + 1);
  } else if (t === 'object') {
    sh.objects++;
    for (const [k, x] of Object.entries(v as Obj)) {
      let child = sh.props.get(k);
      if (!child) sh.props.set(k, (child = newShape()));
      sh.propCount.set(k, (sh.propCount.get(k) ?? 0) + 1);
      addSample(child, x, depth + 1);
    }
  }
}

function render(sh: Shape): Obj {
  const types = [...sh.types];
  if (types.includes('integer') && types.includes('number')) types.splice(types.indexOf('integer'), 1);
  const parts: Obj[] = types.map((t) => {
    if (t === 'object') {
      const properties: Obj = {};
      for (const [k, c] of sh.props) properties[k] = render(c);
      const required = [...sh.propCount].filter(([, n]) => n === sh.objects).map(([k]) => k);
      return { type: 'object', properties, ...(required.length ? { required } : {}) };
    }
    if (t === 'array') return sh.items ? { type: 'array', items: render(sh.items) } : { type: 'array' };
    if (t === 'string' && sh.format) return { type: 'string', format: sh.format };
    return { type: t };
  });
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  if (parts.every((p) => Object.keys(p).length === 1)) return { type: parts.map((p) => p.type) };
  return { anyOf: parts };
}

/** A schema that the sample validates against: types, required keys and nested shapes merged across array items. */
export function inferSchema(sample: unknown, draft: Draft = '2020-12'): Obj {
  const sh = newShape();
  addSample(sh, sample);
  return { $schema: SCHEMA_URIS[draft], ...render(sh) };
}
