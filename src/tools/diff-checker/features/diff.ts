// Line diff with word-level highlights for modified lines. Pure: no DOM, safe in a worker.

import { diffSequences, Interner, type Run } from './myers';

export interface DiffOptions {
  /** Ignore whitespace at the start and end of each line. */
  trim?: boolean;
  /** Ignore every whitespace character. */
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
  /** Cost budget for the line diff (see myers.ts). */
  maxCost?: number;
}

export type LineKind = 'equal' | 'add' | 'del';

/** A piece of a modified line; `changed` pieces are the exact edits. */
export interface Part {
  text: string;
  changed: boolean;
}

export interface DiffLine {
  kind: LineKind;
  /** 1-based line number in the original (equal and del lines). */
  aNo?: number;
  /** 1-based line number in the changed text (equal and add lines). */
  bNo?: number;
  /** Original text for equal/del lines, changed text for add lines. */
  text: string;
  /** For equal lines only: the changed side's text when it differs (options ignored the difference). */
  textB?: string;
  /** Word-level breakdown when this line is paired with a line on the other side. */
  parts?: Part[];
}

export type LineEnding = 'none' | 'LF' | 'CRLF' | 'CR' | 'Mixed';

export interface SideInfo {
  lines: number;
  eol: LineEnding;
  trailingNewline: boolean;
}

export interface DiffResult {
  lines: DiffLine[];
  additions: number;
  removals: number;
  /** True when nothing differs under the chosen options. */
  identical: boolean;
  /** False when the inputs were too different to diff minimally within the budget. */
  exact: boolean;
  a: SideInfo;
  b: SideInfo;
}

export interface SplitText {
  lines: string[];
  eol: LineEnding;
  trailingNewline: boolean;
}

/** Splits text into lines, normalising CRLF / CR to LF and reporting which endings were used. */
export function splitLines(text: string): SplitText {
  let crlf = 0;
  let lf = 0;
  let cr = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 13) {
      if (text.charCodeAt(i + 1) === 10) {
        crlf++;
        i++;
      } else cr++;
    } else if (c === 10) lf++;
  }
  const kinds = (crlf ? 1 : 0) + (lf ? 1 : 0) + (cr ? 1 : 0);
  const eol: LineEnding = kinds === 0 ? 'none' : kinds > 1 ? 'Mixed' : crlf ? 'CRLF' : lf ? 'LF' : 'CR';
  if (text === '') return { lines: [], eol, trailingNewline: false };
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const trailingNewline = lines[lines.length - 1] === '';
  if (trailingNewline) lines.pop();
  return { lines, eol, trailingNewline };
}

function keyFn(opts: DiffOptions): (s: string) => string {
  return (s) => {
    let k = s;
    if (opts.ignoreWhitespace) k = k.replace(/\s+/g, '');
    else if (opts.trim) k = k.trim();
    if (opts.ignoreCase) k = k.toLowerCase();
    return k;
  };
}

const TOKEN = /[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu;
/** Pairs longer than this (combined) are highlighted as whole lines. */
export const MAX_WORD_DIFF_CHARS = 20_000;

export function tokenize(line: string): string[] {
  return line.match(TOKEN) ?? [];
}

function pushPart(parts: Part[], text: string, changed: boolean) {
  if (!text) return;
  const last = parts[parts.length - 1];
  if (last && last.changed === changed) last.text += text;
  else parts.push({ text, changed });
}

/** Word/character-level diff of two lines. Each side gets parts with its changed pieces marked. */
export function diffWords(a: string, b: string, opts: DiffOptions = {}): { a: Part[]; b: Part[] } {
  if (a.length + b.length > MAX_WORD_DIFF_CHARS) {
    return { a: a ? [{ text: a, changed: true }] : [], b: b ? [{ text: b, changed: true }] : [] };
  }
  const ta = tokenize(a);
  const tb = tokenize(b);
  const interner = new Interner();
  const anyWs = opts.trim || opts.ignoreWhitespace;
  const key = (t: string) => (anyWs && /^\s+$/.test(t) ? ' ' : opts.ignoreCase ? t.toLowerCase() : t);
  const { runs } = diffSequences(
    ta.map((t) => interner.id(key(t))),
    tb.map((t) => interner.id(key(t))),
    200_000,
  );
  const pa: Part[] = [];
  const pb: Part[] = [];
  let i = 0;
  let j = 0;
  for (const r of runs) {
    if (r.op === 0) {
      pushPart(pa, ta.slice(i, i + r.count).join(''), false);
      pushPart(pb, tb.slice(j, j + r.count).join(''), false);
      i += r.count;
      j += r.count;
    } else if (r.op === -1) {
      pushPart(pa, ta.slice(i, i + r.count).join(''), true);
      i += r.count;
    } else {
      pushPart(pb, tb.slice(j, j + r.count).join(''), true);
      j += r.count;
    }
  }
  return { a: pa, b: pb };
}

const NO_EOL = '\u0000no-eol';

/** Line diff of two texts. */
export function diffTexts(aText: string, bText: string, opts: DiffOptions = {}): DiffResult {
  const A = splitLines(aText);
  const B = splitLines(bText);
  const key = keyFn(opts);
  const interner = new Interner();
  // A missing final newline is a real difference (as in git), unless whitespace is being ignored.
  const eolMatters = !opts.trim && !opts.ignoreWhitespace && A.trailingNewline !== B.trailingNewline;
  const ids = (s: SplitText) =>
    s.lines.map((l, i) => interner.id(eolMatters && i === s.lines.length - 1 && !s.trailingNewline ? key(l) + NO_EOL : key(l)));
  const { runs, exact } = diffSequences(ids(A), ids(B), opts.maxCost);

  const lines = buildLines(runs, A.lines, B.lines);
  addWordParts(lines, opts);
  let additions = 0;
  let removals = 0;
  for (const l of lines) {
    if (l.kind === 'add') additions++;
    else if (l.kind === 'del') removals++;
  }
  return {
    lines,
    additions,
    removals,
    identical: additions === 0 && removals === 0,
    exact,
    a: { lines: A.lines.length, eol: A.eol, trailingNewline: A.trailingNewline },
    b: { lines: B.lines.length, eol: B.eol, trailingNewline: B.trailingNewline },
  };
}

function buildLines(runs: Run[], a: string[], b: string[]): DiffLine[] {
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let block: { dels: DiffLine[]; adds: DiffLine[] } = { dels: [], adds: [] };
  const flush = () => {
    out.push(...block.dels, ...block.adds);
    block = { dels: [], adds: [] };
  };
  for (const r of runs) {
    if (r.op === 0) {
      flush();
      for (let c = 0; c < r.count; c++, i++, j++) {
        const line: DiffLine = { kind: 'equal', aNo: i + 1, bNo: j + 1, text: a[i] };
        if (a[i] !== b[j]) line.textB = b[j];
        out.push(line);
      }
    } else if (r.op === -1) {
      for (let c = 0; c < r.count; c++, i++) block.dels.push({ kind: 'del', aNo: i + 1, text: a[i] });
    } else {
      for (let c = 0; c < r.count; c++, j++) block.adds.push({ kind: 'add', bNo: j + 1, text: b[j] });
    }
  }
  flush();
  return out;
}

/** Pairs each removed line with the added line at the same position in its change block. */
function addWordParts(lines: DiffLine[], opts: DiffOptions) {
  let k = 0;
  while (k < lines.length) {
    if (lines[k].kind === 'equal') {
      k++;
      continue;
    }
    let d = k;
    while (d < lines.length && lines[d].kind === 'del') d++;
    let e = d;
    while (e < lines.length && lines[e].kind === 'add') e++;
    const pairs = Math.min(d - k, e - d);
    for (let p = 0; p < pairs; p++) {
      const del = lines[k + p];
      const add = lines[d + p];
      const w = diffWords(del.text, add.text, opts);
      del.parts = w.a;
      add.parts = w.b;
    }
    k = e;
  }
}

export interface SideRow {
  left?: DiffLine;
  right?: DiffLine;
}

/** Rows for the side-by-side view: equal lines on both sides, change blocks paired up. */
export function toSideBySide(lines: DiffLine[]): SideRow[] {
  const rows: SideRow[] = [];
  let k = 0;
  while (k < lines.length) {
    const l = lines[k];
    if (l.kind === 'equal') {
      rows.push({ left: l, right: l });
      k++;
      continue;
    }
    const dels: DiffLine[] = [];
    const adds: DiffLine[] = [];
    while (k < lines.length && lines[k].kind === 'del') dels.push(lines[k++]);
    while (k < lines.length && lines[k].kind === 'add') adds.push(lines[k++]);
    for (let p = 0; p < Math.max(dels.length, adds.length); p++) rows.push({ left: dels[p], right: adds[p] });
  }
  return rows;
}

export type Block = { type: 'rows'; start: number; end: number } | { type: 'gap'; start: number; end: number };

/**
 * Splits rows into visible runs and collapsible gaps of unchanged rows, keeping `context`
 * unchanged rows around every change. Gaps shorter than 2 rows are left visible.
 */
export function collapse(changed: boolean[], context: number): Block[] {
  const blocks: Block[] = [];
  const n = changed.length;
  const push = (type: Block['type'], start: number, end: number) => {
    if (end <= start) return;
    const last = blocks[blocks.length - 1];
    if (last && last.type === type) last.end = end;
    else blocks.push({ type, start, end });
  };
  let i = 0;
  while (i < n) {
    if (changed[i]) {
      push('rows', i, i + 1);
      i++;
      continue;
    }
    let e = i;
    while (e < n && !changed[e]) e++;
    const hideStart = i === 0 ? 0 : i + context;
    const hideEnd = e === n ? n : e - context;
    if (hideEnd - hideStart >= 2) {
      push('rows', i, hideStart);
      push('gap', hideStart, hideEnd);
      push('rows', hideEnd, e);
    } else push('rows', i, e);
    i = e;
  }
  return blocks;
}

function range(before: number, count: number): string {
  const start = count === 0 ? before : before + 1;
  return count === 1 ? `${start}` : `${start},${count}`;
}

/** Standard unified diff (`--- / +++ / @@` hunks). Empty string when there are no differences. */
export function unifiedDiff(r: DiffResult, { context = 3, aName = 'original', bName = 'changed' } = {}): string {
  const lines = r.lines;
  if (r.identical) return '';
  // Number of A / B lines before each position.
  const aBefore = new Int32Array(lines.length + 1);
  const bBefore = new Int32Array(lines.length + 1);
  for (let i = 0; i < lines.length; i++) {
    aBefore[i + 1] = aBefore[i] + (lines[i].kind !== 'add' ? 1 : 0);
    bBefore[i + 1] = bBefore[i] + (lines[i].kind !== 'del' ? 1 : 0);
  }
  const hunks: [number, number][] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].kind === 'equal') continue;
    const s = Math.max(0, i - context);
    const e = Math.min(lines.length, i + context + 1);
    const last = hunks[hunks.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else hunks.push([s, e]);
  }
  const out = [`--- ${aName}`, `+++ ${bName}`];
  const noEol = '\\ No newline at end of file';
  for (const [s, e] of hunks) {
    const aCount = aBefore[e] - aBefore[s];
    const bCount = bBefore[e] - bBefore[s];
    out.push(`@@ -${range(aBefore[s], aCount)} +${range(bBefore[s], bCount)} @@`);
    for (let i = s; i < e; i++) {
      const l = lines[i];
      out.push((l.kind === 'equal' ? ' ' : l.kind === 'del' ? '-' : '+') + l.text);
      const lastA = l.kind !== 'add' && l.aNo === r.a.lines && !r.a.trailingNewline;
      const lastB = l.kind !== 'del' && l.bNo === r.b.lines && !r.b.trailingNewline;
      if (lastA || lastB) out.push(noEol);
    }
  }
  return out.join('\n') + '\n';
}
