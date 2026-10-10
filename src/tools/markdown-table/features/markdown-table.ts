// Pure logic for the Markdown table tool: cell width, JSON to rows, existing-table parsing, GFM output.

export type Align = 'none' | 'left' | 'center' | 'right';

/** Display width in terminal columns: CJK and emoji count 2, combining marks and zero-width characters 0. */
export function cellWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (/\p{M}/u.test(ch) || (c >= 0x200b && c <= 0x200f) || c === 0x2060 || (c >= 0xfe00 && c <= 0xfe0f)) continue;
    const wide =
      (c >= 0x1100 && c <= 0x115f) || (c >= 0x2e80 && c <= 0xa4cf) || (c >= 0xac00 && c <= 0xd7a3) || (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xfe30 && c <= 0xfe6f) || (c >= 0xff00 && c <= 0xff60) || (c >= 0xffe0 && c <= 0xffe6) || (c >= 0x1f300 && c <= 0x1f64f) ||
      (c >= 0x1f900 && c <= 0x1f9ff) || (c >= 0x20000 && c <= 0x3fffd);
    w += wide ? 2 : 1;
  }
  return w;
}

/** Make text safe inside a cell: `|` escaped, line breaks as `<br>`. */
export const escapeCell = (s: string) => s.replace(/\\?\|/g, '\\|').replace(/\r\n|\r|\n/g, '<br>').trim();

function pad(s: string, w: number, a: Align): string {
  const gap = w - cellWidth(s);
  if (gap <= 0) return s;
  if (a === 'right') return ' '.repeat(gap) + s;
  if (a === 'center') return ' '.repeat(gap >> 1) + s + ' '.repeat(gap - (gap >> 1));
  return s + ' '.repeat(gap);
}

/** Rows (first row is the header) to a GFM table. Cells are escaped unless `escaped` says they already are. */
export function formatTable(rows: string[][], aligns: Align[] = [], opts: { padded?: boolean; escaped?: boolean } = {}): string {
  const padded = opts.padded ?? true;
  const cols = Math.max(0, ...rows.map((r) => r.length));
  if (!rows.length || !cols) return '';
  const cells = rows.map((r) => Array.from({ length: cols }, (_, i) => (opts.escaped ? (r[i] ?? '').trim() : escapeCell(r[i] ?? ''))));
  const widths = Array.from({ length: cols }, (_, i) => (padded ? Math.max(3, ...cells.map((r) => cellWidth(r[i]))) : 3));
  const line = (r: string[]) => `| ${r.map((c, i) => (padded ? pad(c, widths[i], aligns[i] ?? 'none') : c)).join(' | ')} |`;
  const sep = widths.map((w, i) => {
    const a = aligns[i] ?? 'none';
    return a === 'left' ? ':' + '-'.repeat(w - 1) : a === 'right' ? '-'.repeat(w - 1) + ':' : a === 'center' ? ':' + '-'.repeat(w - 2) + ':' : '-'.repeat(w);
  });
  return [line(cells[0]), `| ${sep.join(' | ')} |`, ...cells.slice(1).map(line)].join('\n') + '\n';
}

export type RowsResult = { rows: string[][] } | { error: string };

const str = (v: unknown) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));

/** A JSON array of objects (keys become the header), of arrays, or of scalars (one column). */
export function rowsFromJson(value: unknown): RowsResult {
  if (!Array.isArray(value)) return { error: 'The JSON must be an array of objects or arrays.' };
  if (!value.length) return { rows: [] };
  if (value.every((v) => Array.isArray(v))) return { rows: value.map((r: unknown[]) => r.map(str)) };
  if (value.every((v) => v && typeof v === 'object' && !Array.isArray(v))) {
    const keys = [...new Set(value.flatMap((o) => Object.keys(o as object)))];
    return { rows: [keys, ...value.map((o) => keys.map((k) => str((o as Record<string, unknown>)[k])))] };
  }
  if (value.every((v) => v === null || typeof v !== 'object')) return { rows: [['value'], ...value.map((v) => [str(v)])] };
  return { error: 'The array mixes objects, arrays and plain values; use one kind.' };
}

const splitRow = (line: string): string[] => {
  let t = line.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1);
  const out: string[] = [];
  let cur = '';
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '\\' && t[i + 1] === '|') {
      cur += '\\|';
      i++;
    } else if (t[i] === '|') {
      out.push(cur.trim());
      cur = '';
    } else cur += t[i];
  }
  out.push(cur.trim());
  return out;
};

const SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

/** Find the first GFM table in `text` (header line followed by a delimiter row). Cells stay escaped. */
export function parseMarkdownTable(text: string): { rows: string[][]; aligns: Align[] } | null {
  const lines = text.split(/\r\n|\r|\n/);
  for (let i = 0; i + 1 < lines.length; i++) {
    if (!lines[i].includes('|') || !SEP.test(lines[i + 1]) || !lines[i + 1].includes('-')) continue;
    const head = splitRow(lines[i]);
    const sep = splitRow(lines[i + 1]);
    if (head.length !== sep.length) continue;
    const aligns = sep.map((s): Align => (s.startsWith(':') ? (s.endsWith(':') ? 'center' : 'left') : s.endsWith(':') ? 'right' : 'none'));
    const rows = [head];
    for (let j = i + 2; j < lines.length && lines[j].trim() && lines[j].includes('|'); j++) rows.push(splitRow(lines[j]));
    return { rows, aligns };
  }
  return null;
}
