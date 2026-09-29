// JSON rows → CREATE TABLE + INSERT statements. Every value becomes a literal built here
// (never string-concatenated from raw input): identifiers are always quoted with the quote
// character doubled, strings are escaped per dialect, numbers come from validated JSON number
// text only.

import { decodeString, formatJson, type JsonNode } from '../../json-formatter/features/json';

export type Dialect = 'postgres' | 'mysql' | 'sqlite' | 'sqlserver';

export const DIALECTS: { value: Dialect; label: string }[] = [
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'sqlserver', label: 'SQL Server' },
];

export interface SqlOptions {
  dialect: Dialect;
  tableName: string;
  /** Rows per INSERT statement (1 = one statement per row). */
  batchSize: number;
  includeCreate: boolean;
  /** Column to mark PRIMARY KEY, or '' for none. */
  primaryKey: string;
}

export type Kind = 'null' | 'boolean' | 'integer' | 'decimal' | 'float' | 'date' | 'timestamp' | 'string' | 'json' | 'mixed';

export interface Column {
  name: string;
  kind: Kind;
  sqlType: string;
  nullable: boolean;
}

export type SqlResult =
  | { ok: true; sql: string; columns: Column[]; rows: number; statements: number; warnings: string[] }
  | { ok: false; error: string };

/** Largest multi-row VALUES list each engine accepts. */
const MAX_BATCH: Record<Dialect, number> = { postgres: 10_000, mysql: 10_000, sqlite: 500, sqlserver: 1000 };
const DATE_ONLY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const DATE_TIME = /^(\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))[T ]([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(\.\d{1,9})?)?(Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)?$/i;
const INT32 = [-(2n ** 31n), 2n ** 31n - 1n];
const INT64 = [-(2n ** 63n), 2n ** 63n - 1n];

// ---------- identifiers & literals ----------

/** Quotes one identifier, doubling the closing quote character so any name is safe. */
export function quoteIdent(name: string, dialect: Dialect): string {
  if (dialect === 'mysql') return `\`${name.replace(/`/g, '``')}\``;
  if (dialect === 'sqlserver') return `[${name.replace(/]/g, ']]')}]`;
  return `"${name.replace(/"/g, '""')}"`;
}

/** `schema.table` → each part quoted. */
export function quoteTable(name: string, dialect: Dialect): string {
  const parts = name.split('.').map((p) => p.trim());
  if (parts.some((p) => !p)) return quoteIdent(name, dialect);
  return parts.map((p) => quoteIdent(p, dialect)).join('.');
}

/** Replaces unpaired UTF-16 surrogates (invalid in any SQL text encoding) with U+FFFD. */
function wellFormed(s: string): string {
  return s.replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, '�');
}

/**
 * String literal for `dialect`.
 * - PostgreSQL (standard_conforming_strings, the default since 9.1) and SQLite: only `'` is special.
 * - MySQL (default sql_mode): backslash escapes are active, so `\` and control characters are escaped too.
 * - SQL Server: N'' literal; a backslash right before a line break is a line continuation, so the literal is split there.
 * NUL can't be stored in PostgreSQL text and ends SQLite/SQL Server statements early, so it's written as a function call
 * (SQLite, SQL Server) or dropped (PostgreSQL, reported via `onNul`).
 */
export function quoteString(value: string, dialect: Dialect, onNul?: () => void): string {
  const s = wellFormed(value);
  switch (dialect) {
    case 'mysql':
      // oxlint-disable-next-line no-control-regex -- escaping control characters is the point
      return `'${s.replace(/[\0\n\r\x1a\\']/g, (c) => MYSQL_ESCAPES[c])}'`;
    case 'postgres':
      if (s.includes('\0')) onNul?.();
      return `'${s.replace(/\0/g, '').replace(/'/g, "''")}'`;
    case 'sqlite':
      return s
        .split('\0')
        .map((part) => `'${part.replace(/'/g, "''")}'`)
        .join(' || char(0) || ');
    case 'sqlserver':
      return s
        .split('\0')
        .map((part) => `N'${part.replace(/'/g, "''").replace(/\\(?=\r?\n)/g, "\\' + N'")}'`)
        .join(' + NCHAR(0) + ');
  }
}

const MYSQL_ESCAPES: Record<string, string> = { '\0': '\\0', '\n': '\\n', '\r': '\\r', '\x1a': '\\Z', '\\': '\\\\', "'": "\\'" };

// ---------- type inference ----------

interface Stats {
  kinds: Set<Kind>;
  present: number;
  nulls: number;
  maxLen: number;
  intMin: bigint | null;
  intMax: bigint | null;
  intDigits: number;
  scale: number;
  tz: boolean;
}

function kindOf(n: JsonNode): Kind {
  switch (n.type) {
    case 'object':
    case 'array':
      return 'json';
    case 'literal':
      return n.raw === 'null' ? 'null' : 'boolean';
    case 'number':
      return /[eE]/.test(n.raw) ? 'float' : n.raw.includes('.') ? 'decimal' : 'integer';
    case 'string': {
      const s = decodeString(n.raw);
      return DATE_ONLY.test(s) ? 'date' : DATE_TIME.test(s) ? 'timestamp' : 'string';
    }
  }
}

function merged(kinds: Set<Kind>): Kind {
  const k = new Set(kinds);
  k.delete('null');
  if (k.size === 0) return 'null';
  if (k.size === 1) return [...k][0];
  if ([...k].every((x) => x === 'integer' || x === 'decimal' || x === 'float')) return k.has('float') ? 'float' : 'decimal';
  if ([...k].every((x) => x === 'date' || x === 'timestamp')) return 'timestamp';
  if ([...k].every((x) => x === 'string' || x === 'date' || x === 'timestamp')) return 'string';
  return 'mixed';
}

function varcharSize(maxLen: number): number | null {
  for (const n of [16, 32, 64, 128, 255]) if (maxLen <= n) return n;
  return null;
}

function sqlTypeFor(kind: Kind, st: Stats, dialect: Dialect, isPk: boolean): string {
  const text = () => {
    const size = varcharSize(st.maxLen);
    if (dialect === 'sqlite') return 'TEXT';
    if (dialect === 'sqlserver') return size ? `NVARCHAR(${size})` : isPk ? 'NVARCHAR(450)' : 'NVARCHAR(MAX)';
    if (size) return `VARCHAR(${size})`;
    if (dialect === 'mysql') return isPk ? 'VARCHAR(768)' : st.maxLen > 65535 ? 'MEDIUMTEXT' : 'TEXT';
    return 'TEXT';
  };
  switch (kind) {
    case 'null':
    case 'mixed':
      return dialect === 'sqlserver' ? (isPk ? 'NVARCHAR(450)' : 'NVARCHAR(MAX)') : dialect === 'mysql' && isPk ? 'VARCHAR(255)' : 'TEXT';
    case 'string':
      return text();
    case 'boolean':
      return dialect === 'sqlserver' ? 'BIT' : dialect === 'sqlite' ? 'INTEGER' : 'BOOLEAN';
    case 'integer': {
      if (dialect === 'sqlite') return st.intMin! >= INT64[0] && st.intMax! <= INT64[1] ? 'INTEGER' : 'NUMERIC';
      if (st.intMin! >= INT32[0] && st.intMax! <= INT32[1]) return dialect === 'mysql' ? 'INT' : 'INTEGER';
      if (st.intMin! >= INT64[0] && st.intMax! <= INT64[1]) return 'BIGINT';
      return decimalType(st.intDigits, 0, dialect);
    }
    case 'decimal':
      return dialect === 'sqlite' ? 'REAL' : decimalType(st.intDigits + st.scale, st.scale, dialect);
    case 'float':
      return { postgres: 'DOUBLE PRECISION', mysql: 'DOUBLE', sqlite: 'REAL', sqlserver: 'FLOAT' }[dialect];
    case 'date':
      return dialect === 'sqlite' ? 'TEXT' : 'DATE';
    case 'timestamp':
      if (dialect === 'postgres') return st.tz ? 'TIMESTAMPTZ' : 'TIMESTAMP';
      if (dialect === 'mysql') return st.scale ? `DATETIME(${Math.min(st.scale, 6)})` : 'DATETIME';
      if (dialect === 'sqlserver') return st.tz ? 'DATETIMEOFFSET' : 'DATETIME2';
      return 'TEXT';
    case 'json':
      return { postgres: 'JSONB', mysql: 'JSON', sqlite: 'TEXT', sqlserver: 'NVARCHAR(MAX)' }[dialect];
  }
}

function decimalType(precision: number, scale: number, dialect: Dialect): string {
  const p = Math.max(precision, 1);
  if (dialect === 'postgres') return p <= 1000 ? `NUMERIC(${p}, ${scale})` : 'NUMERIC';
  if (dialect === 'mysql') return p <= 65 && scale <= 30 ? `DECIMAL(${p}, ${scale})` : 'DOUBLE';
  return p <= 38 ? `DECIMAL(${p}, ${scale})` : 'FLOAT';
}

// ---------- values ----------

/** MySQL DATETIME has no time zone: offsets are converted to UTC. */
function mysqlDateTime(s: string): string {
  const m = DATE_TIME.exec(s)!;
  const [, date, hh, mm, ss = '00', frac = '', zone] = m;
  if (!zone) return `${date} ${hh}:${mm}:${ss}${frac.slice(0, 7)}`;
  const iso = `${date}T${hh}:${mm}:${ss}${zone.toUpperCase() === 'Z' ? 'Z' : zone.length === 5 ? `${zone.slice(0, 3)}:${zone.slice(3)}` : zone}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return s;
  return `${d.toISOString().slice(0, 19).replace('T', ' ')}${frac.slice(0, 7)}`;
}

function literal(n: JsonNode, kind: Kind, dialect: Dialect, onNul: () => void): string {
  if (n.type === 'literal' && n.raw === 'null') return 'NULL';
  if (kind === 'mixed' || kind === 'string') {
    if (n.type === 'string') return quoteString(decodeString(n.raw), dialect, onNul);
    if (n.type === 'number' || n.type === 'literal') return quoteString(n.raw, dialect, onNul);
    return quoteString(formatJson(n, { indent: null }), dialect, onNul);
  }
  switch (n.type) {
    case 'literal':
      return dialect === 'sqlite' || dialect === 'sqlserver' ? (n.raw === 'true' ? '1' : '0') : n.raw.toUpperCase();
    case 'number':
      // Validated JSON number text: only digits, sign, '.', 'e'. Safe to emit as-is.
      return n.raw;
    case 'string': {
      const s = decodeString(n.raw);
      if (kind === 'timestamp' && dialect === 'mysql' && DATE_TIME.test(s)) return quoteString(mysqlDateTime(s), dialect, onNul);
      return quoteString(s, dialect, onNul);
    }
    default:
      return quoteString(formatJson(n, { indent: null }), dialect, onNul);
  }
}

// ---------- main ----------

export function collectColumns(root: JsonNode): { names: string[]; rows: Map<string, JsonNode>[] } | { error: string } {
  const items = root.type === 'array' ? root.items : [root];
  if (root.type !== 'array' && root.type !== 'object') return { error: 'Expected an array of objects or a single object.' };
  const names: string[] = [];
  const seen = new Set<string>();
  const rows: Map<string, JsonNode>[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type !== 'object') return { error: `Item ${i + 1} is ${item.type === 'literal' ? item.raw : `a${item.type === 'array' ? 'n' : ''} ${item.type}`}, not an object.` };
    const row = new Map<string, JsonNode>();
    for (const e of item.entries) {
      const key = e.key === '' ? 'column' : e.key;
      row.set(key, e.value);
      if (!seen.has(key)) {
        seen.add(key);
        names.push(key);
      }
    }
    rows.push(row);
  }
  return { names, rows };
}

export function generateSql(root: JsonNode, options: SqlOptions): SqlResult {
  const collected = collectColumns(root);
  if ('error' in collected) return { ok: false, error: collected.error };
  const { names, rows } = collected;
  if (!names.length) return { ok: false, error: 'No columns: the objects have no keys.' };
  const { dialect } = options;
  const table = quoteTable(options.tableName.trim() || 'my_table', dialect);
  const warnings: string[] = [];

  const columns: Column[] = names.map((name) => {
    const st: Stats = { kinds: new Set(), present: 0, nulls: 0, maxLen: 0, intMin: null, intMax: null, intDigits: 0, scale: 0, tz: false };
    for (const row of rows) {
      const v = row.get(name);
      if (!v) continue;
      st.present++;
      const k = kindOf(v);
      st.kinds.add(k);
      if (k === 'null') st.nulls++;
      if (v.type === 'number') {
        const [int, frac = ''] = v.raw.replace(/^-/, '').replace(/[eE].*$/, '').split('.');
        st.intDigits = Math.max(st.intDigits, int.replace(/^0+(?=\d)/, '').length);
        st.scale = Math.max(st.scale, frac.length);
        if (k === 'integer') {
          const b = BigInt(v.raw);
          st.intMin = st.intMin === null || b < st.intMin ? b : st.intMin;
          st.intMax = st.intMax === null || b > st.intMax ? b : st.intMax;
        }
      } else if (v.type === 'string') {
        const s = decodeString(v.raw);
        st.maxLen = Math.max(st.maxLen, [...s].length);
        const m = DATE_TIME.exec(s);
        if (m) {
          if (m[6]) st.tz = true;
          st.scale = Math.max(st.scale, m[5] ? m[5].length - 1 : 0);
        }
      } else if (v.type === 'literal') st.maxLen = Math.max(st.maxLen, v.raw.length);
      else st.maxLen = Math.max(st.maxLen, 256);
    }
    const kind = merged(st.kinds);
    if (kind === 'mixed' || kind === 'string') {
      // Numbers/booleans stored as text count toward the length too.
      for (const row of rows) {
        const v = row.get(name);
        if (v?.type === 'number') st.maxLen = Math.max(st.maxLen, v.raw.length);
      }
    }
    const isPk = name === options.primaryKey;
    return { name, kind, sqlType: sqlTypeFor(kind, st, dialect, isPk), nullable: st.present < rows.length || st.nulls > 0 };
  });

  if (options.primaryKey) {
    const pk = columns.find((c) => c.name === options.primaryKey);
    if (pk) {
      if (pk.nullable) warnings.push(`Primary key "${pk.name}" is missing or null in some rows.`);
      const values = new Set<string>();
      for (const row of rows) {
        const v = row.get(pk.name);
        if (!v) continue;
        const key = v.type === 'string' ? decodeString(v.raw) : formatJson(v, { indent: null });
        if (values.has(key)) {
          warnings.push(`Primary key "${pk.name}" has duplicate values (e.g. ${key.length > 40 ? `${key.slice(0, 40)}…` : key}).`);
          break;
        }
        values.add(key);
      }
    }
  }

  let droppedNul = false;
  const onNul = () => {
    droppedNul = true;
  };
  const parts: string[] = [];
  if (options.includeCreate) {
    const defs = columns.map((c) => {
      let def = `  ${quoteIdent(c.name, dialect)} ${c.sqlType}`;
      if (c.name === options.primaryKey) def += ' PRIMARY KEY';
      else if (!c.nullable) def += ' NOT NULL';
      return def;
    });
    parts.push(`CREATE TABLE ${table} (\n${defs.join(',\n')}\n);`);
  }

  const batch = Math.max(1, Math.min(Math.floor(options.batchSize) || 1, MAX_BATCH[dialect]));
  if (options.batchSize > MAX_BATCH[dialect]) warnings.push(`${DIALECTS.find((d) => d.value === dialect)!.label} accepts at most ${MAX_BATCH[dialect]} rows per INSERT; batches were capped.`);
  const head = `INSERT INTO ${table} (${columns.map((c) => quoteIdent(c.name, dialect)).join(', ')}) VALUES`;
  let statements = parts.length;
  for (let i = 0; i < rows.length; i += batch) {
    const tuples = rows.slice(i, i + batch).map((row) => {
      const vals = columns.map((c) => {
        const v = row.get(c.name);
        return v ? literal(v, c.kind, dialect, onNul) : 'NULL';
      });
      return `(${vals.join(', ')})`;
    });
    parts.push(batch === 1 ? `${head} ${tuples[0]};` : `${head}\n  ${tuples.join(',\n  ')};`);
    statements++;
  }
  if (droppedNul) warnings.push('PostgreSQL text can’t contain NUL (\\u0000) characters, so they were removed.');
  if (dialect === 'mysql' && columns.some((c) => c.kind === 'string' || c.kind === 'mixed' || c.kind === 'json')) {
    warnings.push('MySQL strings use backslash escapes; run with the default sql_mode (not NO_BACKSLASH_ESCAPES).');
  }
  if (dialect === 'mysql' && columns.some((c) => c.kind === 'timestamp')) {
    // Only mention it when a value actually had an offset.
    const hasTz = rows.some((row) => columns.some((c) => c.kind === 'timestamp' && row.get(c.name)?.type === 'string' && DATE_TIME.exec(decodeString((row.get(c.name) as { raw: string }).raw))?.[6]));
    if (hasTz) warnings.push('MySQL DATETIME has no time zone, so timestamps with an offset were converted to UTC.');
  }

  return { ok: true, sql: `${parts.join('\n\n')}\n`, columns, rows: rows.length, statements, warnings };
}
