// Table model for the CSV viewer: column type detection, stats, filtering and sorting.
// Pure functions over string[][]; parsing happens in the worker with src/shared/lib/csv.ts.

import { parseCsv, type CsvDelimiter, type CsvIssue } from '../../../shared/lib/csv';

export type ColumnType = 'number' | 'boolean' | 'date' | 'text' | 'empty';

export interface ColumnInfo {
  name: string;
  type: ColumnType;
  count: number;
  empty: number;
  unique: number;
  /** For number columns. */
  min?: number;
  max?: number;
  mean?: number;
  /** For text and date columns: shortest/longest values by sort order. */
  minText?: string;
  maxText?: string;
  /** A width hint in characters, from the header and a sample of values. */
  width: number;
}

export interface Table {
  headers: string[];
  rows: string[][];
  columns: ColumnInfo[];
  delimiter: CsvDelimiter;
  issues: CsvIssue[];
  truncated: boolean;
}

export const MAX_ROWS = 1_000_000;

const NUM = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;
const DATE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
const BOOL = /^(?:true|false|yes|no)$/i;

export function toNumber(s: string): number | null {
  const t = s.trim();
  if (!NUM.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function detectType(values: Iterable<string>): ColumnType {
  let num = true;
  let bool = true;
  let date = true;
  let any = false;
  for (const raw of values) {
    const v = raw.trim();
    if (v === '') continue;
    any = true;
    if (num && !NUM.test(v)) num = false;
    if (bool && !BOOL.test(v)) bool = false;
    if (date && !DATE.test(v)) date = false;
    if (!num && !bool && !date) return 'text';
  }
  if (!any) return 'empty';
  return num ? 'number' : bool ? 'boolean' : date ? 'date' : 'text';
}

export function columnInfo(name: string, rows: readonly string[][], index: number): ColumnInfo {
  const values: string[] = new Array(rows.length);
  for (let r = 0; r < rows.length; r++) values[r] = rows[r][index] ?? '';
  const type = detectType(values);
  const uniq = new Set<string>();
  let empty = 0;
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let nums = 0;
  let minText: string | undefined;
  let maxText: string | undefined;
  let width = name.length;
  for (let r = 0; r < values.length; r++) {
    const v = values[r];
    if (r < 200 && v.length > width) width = v.length;
    if (v.trim() === '') {
      empty++;
      continue;
    }
    uniq.add(v);
    if (type === 'number') {
      const n = Number(v.trim());
      if (n < min) min = n;
      if (n > max) max = n;
      sum += n;
      nums++;
    } else if (type === 'date' || type === 'text') {
      if (minText === undefined || v < minText) minText = v;
      if (maxText === undefined || v > maxText) maxText = v;
    }
  }
  const info: ColumnInfo = { name, type, count: values.length, empty, unique: uniq.size, width: Math.max(6, Math.min(40, width)) };
  if (type === 'number' && nums) Object.assign(info, { min, max, mean: sum / nums });
  if (type === 'date' || type === 'text') Object.assign(info, { minText, maxText });
  return info;
}

/** Column names with blanks filled in and duplicates numbered, so each is distinct. */
export function headerNames(raw: readonly string[], width: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (let i = 0; i < width; i++) {
    const base = (raw[i] ?? '').trim() || `Column ${i + 1}`;
    let name = base;
    for (let n = 2; seen.has(name); n++) name = `${base} (${n})`;
    seen.add(name);
    out.push(name);
  }
  return out;
}

export function buildTable(text: string, options: { delimiter: CsvDelimiter | 'auto'; header: boolean }): Table {
  const parsed = parseCsv(text, { delimiter: options.delimiter, skipEmptyLines: true, maxRows: MAX_ROWS + 1 });
  const all = parsed.rows;
  const width = all.reduce((m, r) => Math.max(m, r.length), 0);
  const headers = headerNames(options.header && all.length ? all[0] : [], width);
  let rows = options.header ? all.slice(1) : all;
  let truncated = parsed.truncated;
  if (rows.length > MAX_ROWS) {
    rows = rows.slice(0, MAX_ROWS);
    truncated = true;
  }
  // Pad short rows so every row has a cell per column.
  for (const r of rows) while (r.length < width) r.push('');
  const columns = headers.map((h, i) => columnInfo(h, rows, i));
  return { headers, rows, columns, delimiter: parsed.delimiter, issues: parsed.issues, truncated };
}

export interface ViewOptions {
  /** Case-insensitive text that must appear in some visible cell. */
  global: string;
  /** Per-column case-insensitive "contains" filters, by column index. */
  columnFilters: Record<number, string>;
  /** Columns the global filter searches (the visible ones). */
  searchColumns: number[];
  sort: { column: number; dir: 'asc' | 'desc' } | null;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** Indices of the rows that pass the filters, in display order. */
export function viewRows(rows: readonly string[][], columns: readonly ColumnInfo[], o: ViewOptions): number[] {
  const g = o.global.trim().toLowerCase();
  const filters = Object.entries(o.columnFilters)
    .map(([c, f]) => [Number(c), f.trim().toLowerCase()] as const)
    .filter(([, f]) => f !== '');
  let idx: number[] = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    let pass = true;
    for (const [c, f] of filters) {
      if (!(row[c] ?? '').toLowerCase().includes(f)) {
        pass = false;
        break;
      }
    }
    if (pass && g) {
      pass = false;
      for (const c of o.searchColumns) {
        if ((row[c] ?? '').toLowerCase().includes(g)) {
          pass = true;
          break;
        }
      }
    }
    if (pass) idx.push(r);
  }
  if (o.sort) {
    const { column, dir } = o.sort;
    const sign = dir === 'asc' ? 1 : -1;
    const numeric = columns[column]?.type === 'number';
    if (numeric) {
      const keys = new Float64Array(rows.length);
      for (const r of idx) {
        const n = toNumber(rows[r][column] ?? '');
        keys[r] = n === null ? NaN : n;
      }
      idx = idx.sort((a, b) => {
        const x = keys[a];
        const y = keys[b];
        // Empty cells always go last.
        if (Number.isNaN(x)) return Number.isNaN(y) ? a - b : 1;
        if (Number.isNaN(y)) return -1;
        return (x - y) * sign || a - b;
      });
    } else {
      idx = idx.sort((a, b) => {
        const x = rows[a][column] ?? '';
        const y = rows[b][column] ?? '';
        if (x === '') return y === '' ? a - b : 1;
        if (y === '') return -1;
        return collator.compare(x, y) * sign || a - b;
      });
    }
  }
  return idx;
}
