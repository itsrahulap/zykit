// PostgreSQL identifier quoting and safe literal serialization. Values typed into the builder are
// turned into SQL literals here (never pasted raw); anything that isn't valid for the column's
// type is reported as an error instead.

import type { Column, PgType } from './model';

// Reserved key words from the PostgreSQL manual (Appendix C: "reserved" and "reserved (can be
// function or type)"). Quoting a non-reserved word is harmless, so this errs on the side of quoting.
const RESERVED = new Set(
  `all analyse analyze and any array as asc asymmetric authorization binary both case cast check collate collation column
  concurrently constraint create cross current_catalog current_date current_role current_schema current_time current_timestamp
  current_user default deferrable desc distinct do else end except false fetch for foreign freeze from full grant group having
  ilike in initially inner intersect into is isnull join lateral leading left like limit localtime localtimestamp natural not
  notnull null offset on only or order outer overlaps placing primary references returning right select session_user similar
  some symmetric system_user table tablesample then to trailing true union unique user using variadic verbose when where window with`.split(/\s+/),
);

/** PostgreSQL truncates identifiers longer than 63 bytes (NAMEDATALEN - 1). */
export const MAX_IDENTIFIER_BYTES = 63;

export function identifierError(name: string, what: string): string | null {
  if (!name.trim()) return `${what} needs a name.`;
  if (name.includes('\0')) return `${what} "${name}" contains a NUL character.`;
  if (new TextEncoder().encode(name).length > MAX_IDENTIFIER_BYTES) return `${what} "${name}" is longer than 63 bytes; PostgreSQL would truncate it.`;
  return null;
}

/** Bare when it's a plain lower-case identifier and not reserved; otherwise double-quoted with `"` doubled. */
export function quoteIdent(name: string): string {
  if (/^[a-z_][a-z0-9_$]*$/.test(name) && !RESERVED.has(name)) return name;
  return `"${name.replace(/"/g, '""')}"`;
}

/** Standard SQL string literal: single quotes, embedded quotes doubled (standard_conforming_strings is on by default). */
export const quoteString = (s: string) => `'${s.replace(/'/g, "''")}'`;

export function typeSql(c: Pick<Column, 'type' | 'length' | 'precision' | 'scale'>): string {
  if (c.type === 'VARCHAR' && c.length) return `VARCHAR(${c.length})`;
  if (c.type === 'NUMERIC' && c.precision) return c.scale !== undefined ? `NUMERIC(${c.precision}, ${c.scale})` : `NUMERIC(${c.precision})`;
  return c.type;
}

const INTEGER_TYPES: PgType[] = ['INTEGER', 'BIGINT', 'SERIAL', 'BIGSERIAL'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?)?(Z|[+-]\d{2}(:?\d{2})?)?$/;

export type LiteralResult = { ok: true; sql: string } | { ok: false; error: string };

/**
 * A user-typed value as a SQL literal for a column of `type`. `pattern` is for LIKE/ILIKE, where
 * any text is allowed whatever the column type.
 */
export function literal(raw: string, type: PgType, pattern = false): LiteralResult {
  const v = raw.trim();
  if (pattern) return { ok: true, sql: quoteString(raw) };
  if (INTEGER_TYPES.includes(type)) return /^-?\d+$/.test(v) ? { ok: true, sql: v } : { ok: false, error: `"${raw}" is not a whole number.` };
  if (type === 'NUMERIC') return /^-?(\d+\.?\d*|\.\d+)$/.test(v) ? { ok: true, sql: v } : { ok: false, error: `"${raw}" is not a number.` };
  if (type === 'BOOLEAN') {
    const b = v.toLowerCase();
    return b === 'true' || b === 'false' ? { ok: true, sql: b.toUpperCase() } : { ok: false, error: `"${raw}" must be true or false.` };
  }
  if (type === 'UUID') return UUID_RE.test(v) ? { ok: true, sql: `${quoteString(v)}::uuid` } : { ok: false, error: `"${raw}" is not a UUID.` };
  if (type === 'DATE') return DATE_RE.test(v) ? { ok: true, sql: `DATE ${quoteString(v)}` } : { ok: false, error: `"${raw}" is not a date (YYYY-MM-DD).` };
  if (type === 'TIMESTAMP' || type === 'TIMESTAMPTZ')
    return TIMESTAMP_RE.test(v)
      ? { ok: true, sql: `${type} ${quoteString(v)}` }
      : { ok: false, error: `"${raw}" is not a timestamp (YYYY-MM-DD HH:MM:SS).` };
  if (type === 'JSONB') {
    try {
      JSON.parse(raw);
      return { ok: true, sql: `${quoteString(raw)}::jsonb` };
    } catch {
      return { ok: false, error: `"${raw}" is not valid JSON.` };
    }
  }
  return { ok: true, sql: quoteString(raw) }; // VARCHAR, TEXT
}

/**
 * Light sanity check for hand-written CHECK expressions (they are emitted as written): balanced
 * parentheses and quotes, and no statement separators or comments that could end the statement.
 */
export function expressionError(expr: string): string | null {
  const e = expr.trim();
  if (!e) return 'The CHECK expression is empty.';
  if (/;|--|\/\*/.test(e.replace(/'(?:[^']|'')*'/g, ''))) return `CHECK (${e}) can't contain ";", "--" or "/*".`;
  if ((e.match(/'/g) ?? []).length % 2) return `CHECK (${e}) has an unclosed quote.`;
  let depth = 0;
  for (const ch of e.replace(/'(?:[^']|'')*'/g, '')) {
    if (ch === '(') depth++;
    if (ch === ')' && --depth < 0) return `CHECK (${e}) has an unmatched ")".`;
  }
  return depth ? `CHECK (${e}) has an unclosed "(".` : null;
}

/** The base type a foreign key column must match (SERIAL columns are INTEGER underneath). */
export const keyType = (t: PgType): PgType => (t === 'SERIAL' ? 'INTEGER' : t === 'BIGSERIAL' ? 'BIGINT' : t);
