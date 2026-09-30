// Schema-driven fake data. Every value comes from a seeded PRNG, so the same schema, row count
// and seed always produce the same data. Emails and URLs use reserved domains only.

import { writeCsv, type CsvDelimiter } from '../../../shared/lib/csv';
import type { JsonNode } from '../../json-formatter/features/json';
import { generateSql, type Dialect } from '../../json-to-sql/features/sql';
import { LOREM_WORDS, pick, randInt, seededRng, type Rng } from '../../lorem-ipsum/features/lorem-ipsum';
import {
  CITIES,
  COMPANY_SUFFIXES,
  COMPANY_WORDS,
  EMAIL_DOMAINS,
  FIRST_NAMES,
  JOB_AREAS,
  JOB_LEVELS,
  JOB_ROLES,
  LAST_NAMES,
  STREET_NAMES,
  STREET_SUFFIXES,
  URL_DOMAINS,
  URL_PATHS,
} from './data';

export type FieldType =
  | 'sequence'
  | 'uuid'
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'username'
  | 'phone'
  | 'company'
  | 'jobTitle'
  | 'street'
  | 'city'
  | 'country'
  | 'postcode'
  | 'url'
  | 'ipv4'
  | 'ipv6'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'sentence'
  | 'enum'
  | 'pattern';

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'sequence', label: 'Sequence ID' },
  { value: 'uuid', label: 'UUID v4' },
  { value: 'firstName', label: 'First name' },
  { value: 'lastName', label: 'Last name' },
  { value: 'fullName', label: 'Full name' },
  { value: 'email', label: 'Email' },
  { value: 'username', label: 'Username' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'jobTitle', label: 'Job title' },
  { value: 'street', label: 'Street address' },
  { value: 'city', label: 'City' },
  { value: 'country', label: 'Country' },
  { value: 'postcode', label: 'Postcode' },
  { value: 'url', label: 'URL' },
  { value: 'ipv4', label: 'IPv4 address' },
  { value: 'ipv6', label: 'IPv6 address' },
  { value: 'integer', label: 'Integer (range)' },
  { value: 'float', label: 'Decimal (range)' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date (range)' },
  { value: 'datetime', label: 'ISO date-time (range)' },
  { value: 'sentence', label: 'Lorem sentence' },
  { value: 'enum', label: 'One of a list' },
  { value: 'pattern', label: 'Custom pattern' },
];

export interface Field {
  name: string;
  type: FieldType;
  /** integer / float range, sequence start. */
  min?: number;
  max?: number;
  /** float decimals, sequence step. */
  decimals?: number;
  step?: number;
  /** date / datetime range, YYYY-MM-DD. */
  from?: string;
  to?: string;
  /** enum values, comma or newline separated. */
  values?: string;
  /** pattern: # digit, ? letter, * letter or digit, \ escapes the next character. */
  pattern?: string;
}

export const DEFAULT_FIELDS: Record<FieldType, Partial<Field>> = {
  sequence: { min: 1, step: 1 },
  integer: { min: 1, max: 100 },
  float: { min: 0, max: 1000, decimals: 2 },
  date: { from: '2020-01-01', to: '2025-12-31' },
  datetime: { from: '2024-01-01', to: '2024-12-31' },
  enum: { values: 'active, pending, disabled' },
  pattern: { pattern: 'ORD-####-??' },
  uuid: {},
  firstName: {},
  lastName: {},
  fullName: {},
  email: {},
  username: {},
  phone: {},
  company: {},
  jobTitle: {},
  street: {},
  city: {},
  country: {},
  postcode: {},
  url: {},
  ipv4: {},
  ipv6: {},
  boolean: {},
  sentence: {},
};

export const DEFAULT_SCHEMA: Field[] = [
  { name: 'id', type: 'sequence', min: 1, step: 1 },
  { name: 'first_name', type: 'firstName' },
  { name: 'last_name', type: 'lastName' },
  { name: 'email', type: 'email' },
  { name: 'city', type: 'city' },
  { name: 'status', type: 'enum', values: 'active, pending, disabled' },
  { name: 'created_at', type: 'datetime', from: '2024-01-01', to: '2024-12-31' },
];

export const MAX_ROWS = 10_000;

export type Value = string | number | boolean;
export interface MockData {
  columns: string[];
  rows: Value[][];
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
function dayMs(s: string | undefined): number | null {
  const m = DATE_RE.exec(s?.trim() ?? '');
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(t);
  return d.getUTCDate() === +m[3] && d.getUTCMonth() === +m[2] - 1 ? t : null;
}

export const enumValues = (s = '') =>
  s
    .split(/[,\n]/)
    .map((v) => v.trim())
    .filter(Boolean);

/** A problem with a field's options, or null when it's usable. */
export function validateField(f: Field): string | null {
  if (!f.name.trim()) return 'Give the field a name.';
  switch (f.type) {
    case 'integer':
    case 'float': {
      const { min = NaN, max = NaN } = f;
      if (!Number.isFinite(min) || !Number.isFinite(max)) return 'Enter a minimum and maximum.';
      if (min > max) return 'The minimum is larger than the maximum.';
      if (f.type === 'integer' && (!Number.isSafeInteger(Math.ceil(min)) || !Number.isSafeInteger(Math.floor(max)))) return 'The range is too large.';
      if (f.type === 'integer' && Math.ceil(min) > Math.floor(max)) return 'No whole number lies in that range.';
      if (f.type === 'float' && !(Number.isInteger(f.decimals ?? 2) && (f.decimals ?? 2) >= 0 && (f.decimals ?? 2) <= 10)) return 'Decimals must be 0–10.';
      return null;
    }
    case 'sequence':
      return Number.isSafeInteger(f.min ?? 1) && Number.isSafeInteger(f.step ?? 1) ? null : 'Start and step must be whole numbers.';
    case 'date':
    case 'datetime': {
      const a = dayMs(f.from);
      const b = dayMs(f.to);
      if (a === null || b === null) return 'Enter dates as YYYY-MM-DD.';
      return a > b ? 'The start date is after the end date.' : null;
    }
    case 'enum':
      return enumValues(f.values).length ? null : 'List at least one value.';
    case 'pattern':
      return f.pattern ? null : 'Enter a pattern.';
    default:
      return null;
  }
}

/** Problems with the schema as a whole (duplicate or missing names, bad options). */
export function validateSchema(fields: Field[]): string[] {
  const out: string[] = [];
  if (!fields.length) out.push('Add at least one field.');
  const seen = new Set<string>();
  fields.forEach((f, i) => {
    const err = validateField(f);
    if (err) out.push(`Field ${i + 1}${f.name.trim() ? ` "${f.name.trim()}"` : ''}: ${err}`);
    const key = f.name.trim();
    if (key && seen.has(key)) out.push(`Duplicate field name "${key}".`);
    seen.add(key);
  });
  return out;
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALNUM = UPPER + '0123456789';

export function fromPattern(rng: Rng, pattern: string): string {
  let out = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '\\' && i + 1 < pattern.length) out += pattern[++i];
    else if (ch === '#') out += String(randInt(rng, 0, 9));
    else if (ch === '?') out += UPPER[randInt(rng, 0, 25)];
    else if (ch === '*') out += ALNUM[randInt(rng, 0, 35)];
    else out += ch;
  }
  return out;
}

function uuid(rng: Rng): string {
  const b = Array.from({ length: 16 }, () => randInt(rng, 0, 255));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Per-row shared facts, so name, email and username (and city and country) agree with each other. */
interface RowCtx {
  rng: Rng;
  index: number;
  person?: { first: string; last: string };
  place?: [string, string];
}
const person = (c: RowCtx) => (c.person ??= { first: pick(c.rng, FIRST_NAMES), last: pick(c.rng, LAST_NAMES) });
const place = (c: RowCtx) => (c.place ??= pick(c.rng, CITIES));

function value(f: Field, c: RowCtx): Value {
  const { rng } = c;
  switch (f.type) {
    case 'sequence':
      return (f.min ?? 1) + c.index * (f.step ?? 1);
    case 'uuid':
      return uuid(rng);
    case 'firstName':
      return person(c).first;
    case 'lastName':
      return person(c).last;
    case 'fullName': {
      const p = person(c);
      return `${p.first} ${p.last}`;
    }
    case 'email': {
      const p = person(c);
      const style = randInt(rng, 0, 3);
      const local =
        style === 0 ? `${slug(p.first)}.${slug(p.last)}` : style === 1 ? `${slug(p.first)[0]}${slug(p.last)}` : style === 2 ? `${slug(p.first)}${randInt(rng, 1, 99)}` : `${slug(p.first)}_${slug(p.last)}${randInt(rng, 1, 9)}`;
      return `${local}@${pick(rng, EMAIL_DOMAINS)}`;
    }
    case 'username': {
      const p = person(c);
      return randInt(rng, 0, 1) ? `${slug(p.first)}${slug(p.last).slice(0, 1)}${randInt(rng, 10, 999)}` : `${slug(p.first)}_${slug(p.last)}`;
    }
    case 'phone':
      // 555-01xx numbers are reserved for fiction in the North American Numbering Plan.
      return `+1-${randInt(rng, 201, 989)}-555-01${pad(randInt(rng, 0, 99))}`;
    case 'company':
      return `${pick(rng, COMPANY_WORDS)} ${pick(rng, COMPANY_SUFFIXES)}`;
    case 'jobTitle':
      return `${pick(rng, JOB_LEVELS)} ${pick(rng, JOB_AREAS)} ${pick(rng, JOB_ROLES)}`;
    case 'street':
      return `${randInt(rng, 1, 9999)} ${pick(rng, STREET_NAMES)} ${pick(rng, STREET_SUFFIXES)}`;
    case 'city':
      return place(c)[0];
    case 'country':
      return place(c)[1];
    case 'postcode':
      return pad(randInt(rng, 1000, 99999), 5);
    case 'url':
      return `https://${pick(rng, ['www.', '', 'app.'])}${pick(rng, URL_DOMAINS)}/${pick(rng, URL_PATHS)}/${randInt(rng, 1, 9999)}`;
    case 'ipv4':
      return `${randInt(rng, 1, 223)}.${randInt(rng, 0, 255)}.${randInt(rng, 0, 255)}.${randInt(rng, 1, 254)}`;
    case 'ipv6':
      // 2001:db8::/32 is the documentation prefix (RFC 3849).
      return `2001:db8:${Array.from({ length: 6 }, () => randInt(rng, 0, 0xffff).toString(16)).join(':')}`;
    case 'integer':
      return randInt(rng, Math.ceil(f.min ?? 0), Math.floor(f.max ?? 100));
    case 'float': {
      const d = f.decimals ?? 2;
      const lo = f.min ?? 0;
      const hi = f.max ?? 1;
      return Math.min(hi, Math.max(lo, Number((lo + rng() * (hi - lo)).toFixed(d))));
    }
    case 'boolean':
      return rng() < 0.5;
    case 'date': {
      const a = dayMs(f.from)!;
      const b = dayMs(f.to)!;
      return new Date(a + randInt(rng, 0, Math.round((b - a) / 86_400_000)) * 86_400_000).toISOString().slice(0, 10);
    }
    case 'datetime': {
      const a = dayMs(f.from)!;
      const b = dayMs(f.to)! + 86_399_000;
      return new Date(a + randInt(rng, 0, Math.round((b - a) / 1000)) * 1000).toISOString().replace('.000Z', 'Z');
    }
    case 'sentence': {
      const n = randInt(rng, 4, 12);
      const ws = Array.from({ length: n }, () => pick(rng, LOREM_WORDS));
      const s = ws.join(' ');
      return s.charAt(0).toUpperCase() + s.slice(1) + '.';
    }
    case 'enum':
      return pick(rng, enumValues(f.values));
    case 'pattern':
      return fromPattern(rng, f.pattern ?? '');
  }
}

/** Generates `rows` rows. Assumes validateSchema(fields) is empty. */
export function generateData(fields: Field[], rows: number, seed: string): MockData {
  const rng = seededRng(seed);
  const n = Math.max(0, Math.min(MAX_ROWS, Math.floor(rows) || 0));
  const out: Value[][] = new Array(n);
  for (let i = 0; i < n; i++) {
    const ctx: RowCtx = { rng, index: i };
    out[i] = fields.map((f) => value(f, ctx));
  }
  return { columns: fields.map((f) => f.name.trim()), rows: out };
}

export type OutputFormat = 'json' | 'jsonl' | 'csv' | 'sql';

function rowObject(columns: string[], row: Value[]): Record<string, Value> {
  const o: Record<string, Value> = {};
  columns.forEach((c, i) => (o[c] = row[i]));
  return o;
}

export function toJson(d: MockData): string {
  return JSON.stringify(
    d.rows.map((r) => rowObject(d.columns, r)),
    null,
    2,
  );
}

export function toJsonLines(d: MockData): string {
  return d.rows.map((r) => JSON.stringify(rowObject(d.columns, r))).join('\n');
}

export function toCsv(d: MockData, delimiter: CsvDelimiter = ','): string {
  return writeCsv([d.columns, ...d.rows.map((r) => r.map(String))], { delimiter });
}

function toNode(d: MockData): JsonNode {
  const lit = (v: Value): JsonNode =>
    typeof v === 'number' ? { type: 'number', raw: String(v) } : typeof v === 'boolean' ? { type: 'literal', raw: v ? 'true' : 'false' } : { type: 'string', raw: JSON.stringify(v) };
  return {
    type: 'array',
    items: d.rows.map((r) => ({ type: 'object', entries: d.columns.map((c, i) => ({ key: c, keyRaw: JSON.stringify(c), value: lit(r[i]) })) })),
  };
}

/** CREATE TABLE + INSERT statements, built by the JSON to SQL tool's generator. */
export function toSql(d: MockData, dialect: Dialect, tableName: string): string {
  const res = generateSql(toNode(d), {
    dialect,
    tableName: tableName.trim() || 'mock_data',
    batchSize: 500,
    includeCreate: true,
    primaryKey: '',
  });
  return res.ok ? res.sql : `-- ${res.error}`;
}

export function formatData(d: MockData, format: OutputFormat, sql: { dialect: Dialect; table: string }): string {
  if (!d.rows.length) return '';
  switch (format) {
    case 'json':
      return toJson(d);
    case 'jsonl':
      return toJsonLines(d);
    case 'csv':
      return toCsv(d);
    case 'sql':
      return toSql(d, sql.dialect, sql.table);
  }
}
