// RFC 4180 CSV/TSV parser and writer. Pure TypeScript, no DOM, safe to run in a worker.
// Parsing is a single forward scan that slices unquoted fields straight out of the
// input, so a 20 MB file takes well under a second.

export type CsvDelimiter = ',' | ';' | '\t' | '|';
export const CSV_DELIMITERS: CsvDelimiter[] = [',', ';', '\t', '|'];

export interface CsvParseOptions {
  /** A delimiter, or 'auto' (default) to detect one from the first lines. */
  delimiter?: CsvDelimiter | 'auto';
  /** Trim spaces and tabs around every value. */
  trim?: boolean;
  /** Drop records that are completely empty (a blank line). Default true. */
  skipEmptyLines?: boolean;
  /** Stop after this many records (the result is marked truncated). */
  maxRows?: number;
}

export interface CsvIssue {
  message: string;
  /** 1-based line where the problem starts. */
  line: number;
}

export interface CsvParseResult {
  rows: string[][];
  delimiter: CsvDelimiter;
  issues: CsvIssue[];
  truncated: boolean;
}

const QUOTE = 34;
const CR = 13;
const LF = 10;

/** Guess the delimiter by finding the candidate that splits the first lines most consistently. */
export function detectDelimiter(text: string): CsvDelimiter {
  const sample = text.slice(0, 64 * 1024);
  let best: CsvDelimiter = ',';
  let bestScore = 0;
  for (const d of CSV_DELIMITERS) {
    const counts: number[] = [];
    let inQuotes = false;
    let count = 0;
    for (let i = 0; i < sample.length && counts.length < 30; i++) {
      const c = sample[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (!inQuotes && c === d) count++;
      else if (!inQuotes && c === '\n') {
        counts.push(count);
        count = 0;
      }
    }
    if (count > 0 || counts.length === 0) counts.push(count);
    const nonEmpty = counts.filter((n) => n > 0);
    if (!nonEmpty.length) continue;
    // Most common non-zero count, and how many lines agree with it.
    const freq = new Map<number, number>();
    for (const n of nonEmpty) freq.set(n, (freq.get(n) ?? 0) + 1);
    let mode = 0;
    let agree = 0;
    for (const [n, f] of freq) if (f > agree || (f === agree && n > mode)) [mode, agree] = [n, f];
    const score = (agree / counts.length) * 1000 + Math.min(mode, 999);
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function parseCsv(input: string, options: CsvParseOptions = {}): CsvParseResult {
  const text = stripBom(input);
  const delimiter = !options.delimiter || options.delimiter === 'auto' ? detectDelimiter(text) : options.delimiter;
  const trim = options.trim ?? false;
  const skipEmpty = options.skipEmptyLines ?? true;
  const maxRows = options.maxRows ?? Infinity;
  const delim = delimiter.charCodeAt(0);
  const rows: string[][] = [];
  const issues: CsvIssue[] = [];
  const n = text.length;
  let i = 0;
  let line = 1;
  let row: string[] = [];
  let truncated = false;
  const clean = (v: string) => (trim ? v.replace(/^[ \t]+|[ \t]+$/g, '') : v);

  const endRow = () => {
    if (!(skipEmpty && row.length === 1 && row[0] === '')) rows.push(row);
    row = [];
  };

  if (n === 0) return { rows, delimiter, issues, truncated };

  while (i <= n) {
    if (rows.length >= maxRows) {
      truncated = i < n;
      break;
    }
    // Leading spaces before an opening quote are allowed when trimming.
    let j = i;
    if (trim) while (j < n && (text.charCodeAt(j) === 32 || text.charCodeAt(j) === 9)) j++;
    if (j < n && text.charCodeAt(j) === QUOTE) {
      const startLine = line;
      let value = '';
      let k = j + 1;
      let closed = false;
      for (;;) {
        const q = text.indexOf('"', k);
        if (q === -1) {
          value += text.slice(k);
          k = n;
          break;
        }
        value += text.slice(k, q);
        if (text.charCodeAt(q + 1) === QUOTE) {
          value += '"';
          k = q + 2;
        } else {
          k = q + 1;
          closed = true;
          break;
        }
      }
      for (let p = value.indexOf('\n'); p !== -1; p = value.indexOf('\n', p + 1)) line++;
      if (!closed) issues.push({ message: 'A quoted field is never closed; it runs to the end of the input.', line: startLine });
      // Anything between the closing quote and the next delimiter is kept, but reported.
      let e = k;
      while (e < n) {
        const c = text.charCodeAt(e);
        if (c === delim || c === LF || c === CR) break;
        e++;
      }
      if (e > k) {
        const extra = text.slice(k, e);
        if (!(trim && /^[ \t]*$/.test(extra))) {
          issues.push({ message: 'Unexpected characters after a closing quote.', line });
          value += extra;
        }
      }
      row.push(value);
      i = e;
    } else {
      let e = i;
      while (e < n) {
        const c = text.charCodeAt(e);
        if (c === delim || c === LF || c === CR) break;
        e++;
      }
      row.push(clean(text.slice(i, e)));
      i = e;
    }
    // i now points at a delimiter, a line break or the end.
    if (i >= n) {
      endRow();
      break;
    }
    const c = text.charCodeAt(i);
    if (c === delim) {
      i++;
      if (i === n) {
        row.push('');
        endRow();
        break;
      }
      continue;
    }
    // Line break: CRLF, LF or a lone CR.
    i += c === CR && text.charCodeAt(i + 1) === LF ? 2 : 1;
    line++;
    endRow();
    if (i === n) break;
  }
  if (issues.length > 100) issues.length = 100;
  return { rows, delimiter, issues, truncated };
}

export interface CsvWriteOptions {
  delimiter?: CsvDelimiter;
  newline?: '\n' | '\r\n';
  /** Quote every field, not just the ones that need it. */
  quoteAll?: boolean;
}

/** Quote a value if it contains the delimiter, a quote, a line break, or edge whitespace. */
export function quoteField(value: string, delimiter: CsvDelimiter = ',', quoteAll = false): string {
  const needs =
    quoteAll ||
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r') ||
    /^\s|\s$/.test(value);
  return needs ? `"${value.replace(/"/g, '""')}"` : value;
}

export function writeCsv(rows: readonly (readonly string[])[], options: CsvWriteOptions = {}): string {
  const d = options.delimiter ?? ',';
  const nl = options.newline ?? '\n';
  const q = options.quoteAll ?? false;
  const out: string[] = new Array(rows.length);
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const cells: string[] = new Array(row.length);
    for (let c = 0; c < row.length; c++) cells[c] = quoteField(row[c] ?? '', d, q);
    out[r] = cells.join(d);
  }
  return out.join(nl);
}

export const DELIMITER_LABELS: Record<CsvDelimiter, string> = {
  ',': 'Comma',
  ';': 'Semicolon',
  '\t': 'Tab',
  '|': 'Pipe',
};
