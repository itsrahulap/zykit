// SQL minifier. A small tokenizer that understands string literals, quoted identifiers
// and comments, so whitespace is only collapsed *between* tokens and never inside them.

export type TokenKind = 'ws' | 'line-comment' | 'block-comment' | 'string' | 'quoted' | 'word' | 'punct';

export interface SqlToken {
  kind: TokenKind;
  text: string;
}

export interface TokenizeOptions {
  /** Dialect name as used by sql-formatter (e.g. "mysql", "postgresql", "transactsql"). */
  dialect?: string;
}

const HASH_COMMENT_DIALECTS = new Set(['mysql', 'mariadb', 'tidb', 'singlestoredb', 'bigquery', 'hive', 'spark']);
const BACKSLASH_STRING_DIALECTS = new Set(['mysql', 'mariadb', 'tidb', 'singlestoredb', 'bigquery', 'hive', 'spark', 'n1ql']);
const BRACKET_DIALECTS = new Set(['transactsql', 'tsql', 'sql', 'sqlite']);
const DOLLAR_QUOTE_DIALECTS = new Set(['postgresql', 'redshift', 'snowflake', 'duckdb', 'sql']);
const NESTED_COMMENT_DIALECTS = new Set(['postgresql', 'duckdb', 'transactsql', 'tsql']);

const isWordChar = (c: string) => /[\p{L}\p{N}_$@#]/u.test(c);
const OPERATOR_CHARS = new Set('-+*/<>=!|&^%~:?'.split(''));

/** Reads a quoted run starting at `i` (which holds the opening quote). Returns the end index (exclusive). */
function readQuoted(s: string, i: number, close: string, backslash: boolean): number {
  let j = i + 1;
  while (j < s.length) {
    const c = s[j];
    if (backslash && c === '\\') {
      j += 2;
      continue;
    }
    if (c === close) {
      // A doubled quote is an escaped quote.
      if (s[j + 1] === close) {
        j += 2;
        continue;
      }
      return j + 1;
    }
    j++;
  }
  return s.length; // unterminated: runs to the end
}

export function tokenizeSql(sql: string, opts: TokenizeOptions = {}): SqlToken[] {
  const d = (opts.dialect ?? 'sql').toLowerCase();
  const tokens: SqlToken[] = [];
  let i = 0;
  const push = (kind: TokenKind, end: number) => {
    tokens.push({ kind, text: sql.slice(i, end) });
    i = end;
  };

  while (i < sql.length) {
    const c = sql[i];
    const next = sql[i + 1];

    if (/\s/.test(c)) {
      let j = i + 1;
      while (j < sql.length && /\s/.test(sql[j])) j++;
      push('ws', j);
    } else if ((c === '-' && next === '-') || (c === '#' && HASH_COMMENT_DIALECTS.has(d) && next !== '{')) {
      let j = i;
      while (j < sql.length && sql[j] !== '\n' && sql[j] !== '\r') j++;
      push('line-comment', j);
    } else if (c === '/' && next === '*') {
      const nested = NESTED_COMMENT_DIALECTS.has(d);
      let depth = 1;
      let j = i + 2;
      while (j < sql.length && depth > 0) {
        if (sql[j] === '*' && sql[j + 1] === '/') {
          depth--;
          j += 2;
        } else if (nested && sql[j] === '/' && sql[j + 1] === '*') {
          depth++;
          j += 2;
        } else j++;
      }
      push('block-comment', j);
    } else if (c === "'") {
      // E'...' strings (PostgreSQL) allow backslash escapes; the prefix is part of the previous word token.
      const prev = tokens[tokens.length - 1];
      const eString = prev?.kind === 'word' && /^[eE]$/.test(prev.text);
      push('string', readQuoted(sql, i, "'", eString || BACKSLASH_STRING_DIALECTS.has(d)));
    } else if (c === '"') {
      push('quoted', readQuoted(sql, i, '"', BACKSLASH_STRING_DIALECTS.has(d)));
    } else if (c === '`') {
      push('quoted', readQuoted(sql, i, '`', false));
    } else if (c === '[' && BRACKET_DIALECTS.has(d)) {
      push('quoted', readQuoted(sql, i, ']', false));
    } else if (c === '$' && DOLLAR_QUOTE_DIALECTS.has(d) && /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.test(sql.slice(i))) {
      const tag = /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i))![0];
      const end = sql.indexOf(tag, i + tag.length);
      push('string', end === -1 ? sql.length : end + tag.length);
    } else if (isWordChar(c) || (c === '.' && /[0-9]/.test(next ?? ''))) {
      let j = i + 1;
      while (j < sql.length && (isWordChar(sql[j]) || (sql[j] === '.' && /[0-9]/.test(sql[j - 1]) && /[0-9]/.test(sql[j + 1] ?? '')))) j++;
      push('word', j);
    } else {
      push('punct', i + 1);
    }
  }
  return tokens;
}

export interface MinifyOptions extends TokenizeOptions {
  /** Remove `--` and block comments. Optimizer hints (`/*+ … *\/`, `/*! … *\/`) are always kept. */
  stripComments?: boolean;
}

const firstChar = (t: SqlToken) => t.text[0] ?? '';
const lastChar = (t: SqlToken) => t.text[t.text.length - 1] ?? '';

/** Does removing the whitespace between `a` and `b` risk changing what the tokens mean? */
function needsSpace(a: SqlToken, b: SqlToken): boolean {
  const x = lastChar(a);
  const y = firstChar(b);
  if (SAFE_PUNCT.has(x) || SAFE_PUNCT.has(y)) return false;
  // "t . col" → "t.col", but never glue a dot to a number ("1 .5" is not "1.5").
  if ((x === '.' && !/[0-9]/.test(y)) || (y === '.' && !/[0-9]/.test(x))) return false;
  if (a.kind.endsWith('comment') || b.kind.endsWith('comment')) return true;
  const xOp = OPERATOR_CHARS.has(x);
  const yOp = OPERATOR_CHARS.has(y);
  // Two operators might merge ("- -" → "--" starts a comment, "< =" → "<=").
  if (xOp && yOp) return true;
  // An operator next to a word or quote is always safe to join.
  if (xOp || yOp) return false;
  return true;
}

const SAFE_PUNCT = new Set('(),;[]{}'.split(''));
const isHint = (t: SqlToken) => t.kind === 'block-comment' && /^\/\*[+!]/.test(t.text);

/** Collapses a query onto as few characters as possible, keeping literals and identifiers byte-for-byte. */
export function minifySql(sql: string, opts: MinifyOptions = {}): string {
  let out = '';
  let prev: SqlToken | null = null;
  let gap = false; // whitespace or a removed comment since `prev`
  for (const t of tokenizeSql(sql, opts)) {
    if (t.kind === 'ws' || (opts.stripComments && (t.kind === 'line-comment' || (t.kind === 'block-comment' && !isHint(t))))) {
      gap = true;
      continue;
    }
    if (prev) {
      // Tokens that touched in the source keep touching (e.g. N'text', E'\\n'); a line comment needs its newline.
      if (prev.kind === 'line-comment') out += '\n';
      else if (gap && needsSpace(prev, t)) out += ' ';
    }
    out += t.text;
    prev = t;
    gap = false;
  }
  return out;
}
