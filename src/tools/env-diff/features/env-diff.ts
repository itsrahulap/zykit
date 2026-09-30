// .env parsing (dotenv rules), comparison and secret hints. Pure TypeScript: no DOM, unit-tested in Node.
// Nothing here stores or sends the content anywhere.

export type Quote = '"' | "'" | '`';

export interface EnvEntry {
  key: string;
  value: string;
  /** 1-based line where the assignment starts. */
  line: number;
  /** Last line of a multiline quoted value. */
  endLine: number;
  quote: Quote | null;
  exported: boolean;
  /** ${VAR} / $VAR references (shown, not expanded). Single-quoted values have none. */
  refs: string[];
}

export interface EnvIssue {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface EnvDuplicate {
  key: string;
  lines: number[];
}

export interface ParsedEnv {
  /** Every assignment in file order (duplicates included). */
  entries: EnvEntry[];
  /** Final value per key (the last assignment wins, as in dotenv). */
  values: Map<string, EnvEntry>;
  issues: EnvIssue[];
  duplicates: EnvDuplicate[];
}

const KEY = /^[A-Za-z_][A-Za-z0-9_.-]*$/;
const REF = /\$\{([A-Za-z_][A-Za-z0-9_]*)(?:[:-][^}]*)?\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;

function findRefs(value: string): string[] {
  const out = new Set<string>();
  for (const m of value.matchAll(REF)) {
    // An escaped \$ is literal.
    if (m.index > 0 && value[m.index - 1] === '\\') continue;
    out.add(m[1] ?? m[2]);
  }
  return [...out];
}

/** Index of the closing quote in `s` from `from`, skipping backslash-escaped quotes. */
function closingQuote(s: string, from: number, q: Quote): number {
  for (let i = from; i < s.length; i++) {
    if (s[i] === '\\' && q !== "'") {
      i++;
      continue;
    }
    if (s[i] === q) return i;
  }
  return -1;
}

function unescapeDouble(s: string): string {
  return s.replace(/\\([nrt"\\$])/g, (_, c: string) => ({ n: '\n', r: '\r', t: '\t' })[c as 'n'] ?? c);
}

export function parseEnv(text: string): ParsedEnv {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const entries: EnvEntry[] = [];
  const issues: EnvIssue[] = [];
  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    let rest = trimmed;
    let exported = false;
    const exp = /^export\s+/.exec(rest);
    if (exp) {
      exported = true;
      rest = rest.slice(exp[0].length);
    }
    const sep = /^([^=:\s]+)\s*(=|:\s)/.exec(rest) ?? /^([^=\s]+)\s*(=)/.exec(rest);
    if (!sep) {
      const word = rest.split(/\s/)[0];
      issues.push({
        line: lineNo,
        severity: 'error',
        message: KEY.test(word) ? `“${word}” has no “=”: expected KEY=value.` : `This line isn’t a KEY=value assignment.`,
      });
      continue;
    }
    const key = sep[1];
    if (!KEY.test(key)) {
      issues.push({ line: lineNo, severity: 'error', message: `“${key}” isn’t a valid variable name (letters, digits and _ ; not starting with a digit).` });
      continue;
    }
    let value = rest.slice(sep[0].length).replace(/^[ \t]+/, '');
    let quote: Quote | null = null;
    let endLine = lineNo;
    const q = value[0];
    if (q === '"' || q === "'" || q === '`') {
      quote = q;
      let body = value.slice(1);
      let close = closingQuote(body, 0, q);
      let j = i;
      while (close === -1 && j + 1 < lines.length) {
        j++;
        body += `\n${lines[j]}`;
        close = closingQuote(body, 0, q);
      }
      if (close === -1) {
        issues.push({ line: lineNo, severity: 'error', message: `The ${q === '"' ? 'double' : q === "'" ? 'single' : 'backtick'} quote opened here is never closed.` });
        continue;
      }
      i = j;
      endLine = j + 1;
      const after = body.slice(close + 1).trim();
      if (after && !after.startsWith('#')) {
        issues.push({ line: endLine, severity: 'error', message: `Unexpected text after the closing quote: “${after.slice(0, 30)}”.` });
      }
      value = body.slice(0, close);
      if (q === '"') value = unescapeDouble(value);
    } else {
      const hash = value.indexOf('#');
      if (hash !== -1) {
        const kept = value.slice(0, hash).trim();
        if (hash > 0 && !/\s/.test(value[hash - 1])) {
          issues.push({
            line: lineNo,
            severity: 'warning',
            message: `${key}: the unquoted value contains “#”, so dotenv drops everything from it on. Quote the value if the # is part of it.`,
          });
        }
        value = kept;
      } else value = value.trim();
      if (/\s/.test(value)) {
        // Allowed by dotenv, but shells split it; worth a hint.
        issues.push({ line: lineNo, severity: 'warning', message: `${key}: the unquoted value contains spaces; quote it so shells and Docker read it the same way.` });
      }
    }
    entries.push({ key, value, line: lineNo, endLine, quote, exported, refs: quote === "'" ? [] : findRefs(value) });
  }

  const values = new Map<string, EnvEntry>();
  const seen = new Map<string, number[]>();
  for (const e of entries) {
    values.set(e.key, e);
    seen.set(e.key, [...(seen.get(e.key) ?? []), e.line]);
  }
  const duplicates = [...seen].filter(([, l]) => l.length > 1).map(([key, l]) => ({ key, lines: l }));
  return { entries, values, issues, duplicates };
}

// ---------------------------------------------------------------------------------------------
// Secrets

const SECRET_NAME = /SECRET|TOKEN|PASS(WORD|WD|PHRASE)?\b|PWD|API_?KEY|PRIVATE|CREDENTIAL|AUTH|ACCESS_?KEY|SIGNING|SALT|COOKIE|SESSION_KEY|ENCRYPTION|CLIENT_?KEY|DSN|WEBHOOK/i;
const SECRET_VALUE = /^(sk|pk|rk)_(live|test)_|^gh[pousr]_[A-Za-z0-9]{20,}|^github_pat_|^xox[abposr]-|^AKIA[0-9A-Z]{16}$|^AIza[0-9A-Za-z_-]{30,}|^glpat-|^npm_[A-Za-z0-9]{30,}|^eyJ[A-Za-z0-9_-]+\.eyJ|-----BEGIN [A-Z ]*PRIVATE KEY-----/;

/** Shannon entropy in bits per character. */
export function entropy(s: string): number {
  if (!s) return 0;
  const counts = new Map<string, number>();
  for (const c of s) counts.set(c, (counts.get(c) ?? 0) + 1);
  let h = 0;
  const n = [...s].length;
  for (const k of counts.values()) {
    const p = k / n;
    h -= p * Math.log2(p);
  }
  return h;
}

/** Why a value looks secret, or null. */
export function secretHint(key: string, value: string): string | null {
  if (SECRET_NAME.test(key)) return 'name suggests a secret';
  if (SECRET_VALUE.test(value)) return 'looks like an API key or token';
  if (/^[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^/\s@]+@/i.test(value)) return 'URL contains a password';
  if (value.length >= 20 && !/\s/.test(value) && entropy(value) >= 4 && /\d/.test(value) && /[A-Za-z]/.test(value)) return 'random-looking value';
  return null;
}

// ---------------------------------------------------------------------------------------------
// Diff

export type DiffStatus = 'missing' | 'extra' | 'changed' | 'same';

export interface DiffRow {
  key: string;
  status: DiffStatus;
  left?: EnvEntry;
  right?: EnvEntry;
  secret: string | null;
}

/** Compares A (reference, e.g. .env.example) with B: "missing" = in A but not B, "extra" = only in B. */
export function diffEnv(a: ParsedEnv, b: ParsedEnv): DiffRow[] {
  const rows: DiffRow[] = [];
  for (const [key, left] of a.values) {
    const right = b.values.get(key);
    const status: DiffStatus = !right ? 'missing' : right.value === left.value ? 'same' : 'changed';
    rows.push({ key, status, left, right, secret: secretHint(key, right?.value ?? left.value) });
  }
  for (const [key, right] of b.values) {
    if (!a.values.has(key)) rows.push({ key, status: 'extra', right, secret: secretHint(key, right.value) });
  }
  return rows;
}

export function diffCounts(rows: DiffRow[]): Record<DiffStatus, number> {
  const c: Record<DiffStatus, number> = { missing: 0, extra: 0, changed: 0, same: 0 };
  for (const r of rows) c[r.status]++;
  return c;
}

/** Hides a value without revealing its length beyond a rough hint. */
export function maskValue(value: string): string {
  if (!value) return '(empty)';
  return '•'.repeat(Math.min(12, Math.max(4, [...value].length)));
}

/** The same file with every value removed; comments, blank lines and `export` are kept. */
export function toExample(text: string): string {
  const parsed = parseEnv(text);
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const byLine = new Map(parsed.entries.map((e) => [e.line, e]));
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const e = byLine.get(i + 1);
    if (e) {
      out.push(`${e.exported ? 'export ' : ''}${e.key}=`);
      i = e.endLine - 1;
      continue;
    }
    const t = lines[i].trim();
    if (!t || t.startsWith('#')) out.push(lines[i]);
  }
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out.length ? `${out.join('\n')}\n` : '';
}
