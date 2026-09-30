// Pure logic for Query CSV with SQL: table/column naming, type inference, value coercion,
// example queries and result export. No DOM and no sql.js, so it's unit-testable in Node.

import { writeCsv } from '../../../shared/lib/csv';

export type SqlType = 'INTEGER' | 'REAL' | 'TEXT';
export type SqlValue = string | number | null;

export interface ColumnSchema {
  name: string;
  type: SqlType;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  rowCount: number;
  /** Where it came from (file name or "pasted"). Empty for tables made by a query. */
  source: string;
}

/** Total CSV/TSV text the tool accepts across all tables. */
export const MAX_TOTAL_BYTES = 200 * 1024 * 1024;
/** Rows sent to the page for display. */
export const MAX_DISPLAY_ROWS = 1000;
/** Rows kept in the worker for export. */
export const MAX_EXPORT_ROWS = 500_000;
/** Values sampled per column to pick its type. */
export const TYPE_SAMPLE = 1000;
/** Default query time limit. */
export const QUERY_TIMEOUT_MS = 30_000;

/** Quote an SQLite identifier: "name", with inner quotes doubled. */
export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** Table name from a file name: `Sales 2024.csv` → `sales_2024`. Unique (case-insensitive) among `taken`. */
export function tableNameFromFile(fileName: string, taken: Iterable<string> = []): string {
  const base = fileName.replace(/\.(csv|tsv|tab|txt)$/i, '');
  let name = base
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  if (!name) name = 'data';
  if (/^\d/.test(name) || name.startsWith('sqlite_')) name = `t_${name}`;
  return uniqueName(name, taken);
}

function uniqueName(name: string, taken: Iterable<string>): string {
  const seen = new Set(Array.from(taken, (t) => t.toLowerCase()));
  let candidate = name;
  for (let n = 2; seen.has(candidate.toLowerCase()); n++) candidate = `${name}_${n}`;
  return candidate;
}

/** Column names from a header row: trimmed, blanks named column_N, duplicates suffixed _2, _3… */
export function columnNames(header: readonly string[]): string[] {
  const out: string[] = [];
  header.forEach((raw, i) => {
    const name = raw.trim().replace(/[\u0000-\u001f]/g, '') || `column_${i + 1}`;
    out.push(uniqueName(name, out));
  });
  return out;
}

const INT_RE = /^[-+]?\d+$/;
const REAL_RE = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;

/** Pick a column type from up to TYPE_SAMPLE non-empty values. Empty columns are TEXT. */
export function inferType(values: Iterable<string>, sample = TYPE_SAMPLE): SqlType {
  let seen = 0;
  let type: SqlType = 'INTEGER';
  for (const raw of values) {
    const v = raw.trim();
    if (!v) continue;
    seen++;
    if (type === 'INTEGER' && !(INT_RE.test(v) && Number.isSafeInteger(Number(v)))) type = 'REAL';
    if (type === 'REAL' && !REAL_RE.test(v)) return 'TEXT';
    if (seen >= sample) break;
  }
  return seen ? type : 'TEXT';
}

/** Column types for `rows` (data rows, no header). */
export function inferTypes(rows: readonly (readonly string[])[], columnCount: number, allText = false): SqlType[] {
  const types: SqlType[] = [];
  for (let c = 0; c < columnCount; c++) {
    if (allText) {
      types.push('TEXT');
      continue;
    }
    function* column() {
      for (const r of rows) yield r[c] ?? '';
    }
    types.push(inferType(column()));
  }
  return types;
}

/** The value to insert: numbers for numeric columns (NULL when empty), text otherwise. */
export function coerce(raw: string | undefined, type: SqlType): SqlValue {
  if (raw === undefined) return null;
  if (type === 'TEXT') return raw;
  const v = raw.trim();
  if (!v) return null;
  if (type === 'INTEGER' ? INT_RE.test(v) : REAL_RE.test(v)) {
    const n = Number(v);
    if (Number.isFinite(n) && (type === 'REAL' || Number.isSafeInteger(n))) return n;
  }
  return raw; // a value the sample didn't see; SQLite stores it as text
}

/** `CREATE TABLE` for a schema. */
export function createTableSql(name: string, columns: readonly ColumnSchema[]): string {
  return `CREATE TABLE ${quoteIdent(name)} (${columns.map((c) => `${quoteIdent(c.name)} ${c.type}`).join(', ')})`;
}

/** A bare identifier when it's safe to type unquoted, else a quoted one. */
export function ident(name: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && !RESERVED.has(name.toUpperCase()) ? name : quoteIdent(name);
}
const RESERVED = new Set(
  'ADD ALL ALTER AND AS ASC BETWEEN BY CASE CHECK COLUMN CREATE CROSS DEFAULT DELETE DESC DISTINCT DROP ELSE END EXISTS FROM FULL GROUP HAVING IN INDEX INNER INSERT INTO IS JOIN KEY LEFT LIKE LIMIT NOT NULL ON OR ORDER OUTER PRIMARY REFERENCES RIGHT SELECT SET TABLE THEN TO UNION UNIQUE UPDATE USING VALUES WHEN WHERE WITH'.split(' '),
);

export interface ExampleQuery {
  label: string;
  sql: string;
}

/** Example queries built from the loaded tables. */
export function exampleQueries(tables: readonly TableSchema[]): ExampleQuery[] {
  const out: ExampleQuery[] = [];
  const [a, b] = tables;
  if (!a) return [{ label: 'List tables', sql: "SELECT name FROM sqlite_master WHERE type = 'table';" }];
  const t = ident(a.name);
  out.push({ label: `Preview ${a.name}`, sql: `SELECT *\nFROM ${t}\nLIMIT 100;` });
  out.push({ label: `Count rows in ${a.name}`, sql: `SELECT COUNT(*) AS rows\nFROM ${t};` });
  const text = a.columns.find((c) => c.type === 'TEXT');
  const num = a.columns.find((c) => c.type !== 'TEXT');
  if (text) {
    const g = ident(text.name);
    const agg = num ? `,\n       ROUND(AVG(${ident(num.name)}), 2) AS avg_${num.name.replace(/\W+/g, '_').toLowerCase()}` : '';
    out.push({ label: `Group ${a.name} by ${text.name}`, sql: `SELECT ${g}, COUNT(*) AS n${agg}\nFROM ${t}\nGROUP BY ${g}\nORDER BY n DESC;` });
  }
  if (b) {
    const join = joinColumns(a, b);
    if (join) {
      const u = ident(b.name);
      out.push({
        label: `Join ${a.name} with ${b.name}`,
        sql: `SELECT a.*, b.*\nFROM ${t} AS a\nJOIN ${u} AS b ON b.${ident(join[1])} = a.${ident(join[0])}\nLIMIT 100;`,
      });
    }
  }
  out.push({ label: 'Show the schema', sql: "SELECT name, sql\nFROM sqlite_master\nWHERE type = 'table';" });
  return out;
}

/** A likely join key between two tables: a shared column name, or b.<a>_id = a.id. */
export function joinColumns(a: TableSchema, b: TableSchema): [string, string] | null {
  const lower = (s: string) => s.toLowerCase();
  const bNames = new Map(b.columns.map((c) => [lower(c.name), c.name]));
  const singular = lower(a.name).replace(/s$/, '');
  const aId = a.columns.find((c) => lower(c.name) === 'id');
  if (aId) {
    for (const key of [`${singular}_id`, `${lower(a.name)}_id`]) {
      const hit = bNames.get(key);
      if (hit) return [aId.name, hit];
    }
  }
  const bSingular = lower(b.name).replace(/s$/, '');
  const bId = b.columns.find((c) => lower(c.name) === 'id');
  if (bId) {
    const aNames = new Map(a.columns.map((c) => [lower(c.name), c.name]));
    const hit = aNames.get(`${bSingular}_id`) ?? aNames.get(`${lower(b.name)}_id`);
    if (hit) return [hit, bId.name];
  }
  for (const c of a.columns) {
    const hit = bNames.get(lower(c.name));
    if (hit) return [c.name, hit];
  }
  return null;
}

/** Display text for a result value. */
export function displayValue(v: SqlValue): string {
  return v === null ? 'NULL' : String(v);
}

/** Result as CSV (header row first; NULL becomes an empty field). */
export function resultToCsv(columns: readonly string[], rows: readonly (readonly SqlValue[])[]): string {
  return writeCsv([columns, ...rows.map((r) => r.map((v) => (v === null ? '' : String(v))))]);
}

/** Result as a JSON array of objects (duplicate column names get _2, _3… suffixes). */
export function resultToJson(columns: readonly string[], rows: readonly (readonly SqlValue[])[]): string {
  const keys = columnNames(columns);
  const objects = rows.map((r) => {
    const o: Record<string, SqlValue> = {};
    keys.forEach((k, i) => (o[k] = r[i] ?? null));
    return o;
  });
  return JSON.stringify(objects, null, 2);
}

/** Heuristic: may this SQL change tables (so the schema sidebar needs refreshing)? */
export function mayChangeSchema(sql: string): boolean {
  const stripped = sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .trim();
  return stripped
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .some((s) => !/^(select|with|values|explain)\b/i.test(s) || (/^with\b/i.test(s) && /\b(insert|update|delete|replace)\b/i.test(s)));
}

export const SAMPLE_CUSTOMERS = `id,name,city,signed_up
1,Ana Silva,Lisbon,2023-02-14
2,Ben Okafor,Berlin,2023-05-02
3,Chloé Martin,Paris,2023-07-19
4,Diego Ruiz,Madrid,2024-01-08
5,Eva Novak,Vienna,2024-03-30
6,Farah Khan,Berlin,2024-06-11`;

export const SAMPLE_ORDERS = `order_id,customer_id,product,quantity,price
1001,1,Notebook,3,4.5
1002,2,Pen,10,1.2
1003,1,Backpack,1,39.9
1004,3,Notebook,2,4.5
1005,4,Lamp,1,24
1006,2,Backpack,1,39.9
1007,5,Pen,5,1.2
1008,6,Notebook,4,4.5
1009,3,Lamp,2,24`;
