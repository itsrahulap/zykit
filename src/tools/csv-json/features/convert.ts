// CSV rows ↔ JSON values. Parsing and writing CSV text lives in src/shared/lib/csv.ts.

export type Cell = string | number | boolean | null;

export interface ToJsonOptions {
  /** First row holds column names. */
  header: boolean;
  shape: 'objects' | 'arrays';
  /** Turn "42", "true", "null" into numbers, booleans and null. */
  inferTypes: boolean;
  /** Empty cells become null instead of "". */
  emptyAsNull: boolean;
}

const NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

/** A CSV cell as a JSON value. Numbers that can't round-trip exactly (e.g. long IDs) stay strings. */
export function inferCell(raw: string, inferTypes: boolean, emptyAsNull: boolean): Cell {
  if (raw === '') return emptyAsNull ? null : '';
  if (!inferTypes) return raw;
  if (raw === 'true' || raw === 'TRUE' || raw === 'True') return true;
  if (raw === 'false' || raw === 'FALSE' || raw === 'False') return false;
  if (raw === 'null' || raw === 'NULL') return null;
  if (NUMBER.test(raw)) {
    const n = Number(raw);
    if (Number.isFinite(n) && (!/^-?\d+$/.test(raw) || Number.isSafeInteger(n))) return n;
  }
  return raw;
}

/** Column names with blanks filled in and duplicates made unique ("name", "name_2", …). */
export function uniqueHeaders(headers: readonly string[]): string[] {
  const seen = new Set<string>();
  return headers.map((h, i) => {
    const base = h.trim() === '' ? `column_${i + 1}` : h;
    let name = base;
    for (let n = 2; seen.has(name); n++) name = `${base}_${n}`;
    seen.add(name);
    return name;
  });
}

export interface ToJsonResult {
  value: Cell[][] | Record<string, Cell>[];
  columns: string[];
  /** Rows that had a different number of fields than the header. */
  raggedRows: number;
}

export function rowsToJson(rows: readonly string[][], options: ToJsonOptions): ToJsonResult {
  const { inferTypes, emptyAsNull } = options;
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const columns = options.header && rows.length
    ? uniqueHeaders([...rows[0], ...Array.from({ length: Math.max(0, width - rows[0].length) }, () => '')])
    : Array.from({ length: width }, (_, i) => `column_${i + 1}`);
  const body = options.header ? rows.slice(1) : rows;
  const headerWidth = options.header && rows.length ? rows[0].length : width;
  let raggedRows = 0;
  for (const r of body) if (r.length !== headerWidth) raggedRows++;

  if (options.shape === 'arrays') {
    const out: Cell[][] = options.header && rows.length ? [columns.slice()] : [];
    for (const r of body) out.push(r.map((c) => inferCell(c, inferTypes, emptyAsNull)));
    return { value: out, columns, raggedRows };
  }
  const out: Record<string, Cell>[] = [];
  for (const r of body) {
    const obj: Record<string, Cell> = {};
    for (let c = 0; c < columns.length; c++) {
      if (c >= r.length) obj[columns[c]] = emptyAsNull ? null : '';
      else obj[columns[c]] = inferCell(r[c], inferTypes, emptyAsNull);
    }
    out.push(obj);
  }
  return { value: out, columns, raggedRows };
}

export interface ToRowsOptions {
  /** Nested objects become "a.b" columns; otherwise they are JSON-stringified. */
  flatten: boolean;
  header: boolean;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function cellText(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}

function flattenInto(prefix: string, value: Record<string, unknown>, out: Map<string, unknown>, depth: number) {
  for (const [k, v] of Object.entries(value)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isPlainObject(v) && Object.keys(v).length && depth < 50) flattenInto(key, v, out, depth + 1);
    else out.set(key, v);
  }
}

export class JsonShapeError extends Error {}

/**
 * JSON → CSV rows. Accepts an array of objects (columns are the union of keys, in the
 * order first seen), an array of arrays, an array of primitives, or a single object.
 */
export function jsonToRows(value: unknown, options: ToRowsOptions): string[][] {
  const items = Array.isArray(value) ? value : isPlainObject(value) ? [value] : null;
  if (!items) throw new JsonShapeError('Expected a JSON array (of objects or arrays) or a single object.');
  if (!items.length) return [];

  if (items.every((it) => Array.isArray(it))) return (items as unknown[][]).map((r) => r.map(cellText));
  if (!items.some(isPlainObject)) {
    return [...(options.header ? [['value']] : []), ...items.map((v) => [cellText(v)])];
  }

  const records: Map<string, unknown>[] = [];
  const keys = new Map<string, true>();
  for (const it of items) {
    const rec = new Map<string, unknown>();
    if (isPlainObject(it)) {
      if (options.flatten) flattenInto('', it, rec, 0);
      else for (const [k, v] of Object.entries(it)) rec.set(k, v);
    } else rec.set('value', it);
    for (const k of rec.keys()) keys.set(k, true);
    records.push(rec);
  }
  const cols = [...keys.keys()];
  const out: string[][] = options.header ? [cols] : [];
  for (const rec of records) out.push(cols.map((k) => cellText(rec.get(k))));
  return out;
}
