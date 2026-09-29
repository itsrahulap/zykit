// Text-cleaning pipeline: a list of toggleable steps applied in order. Pure logic.

export type StepId =
  | 'trim'
  | 'collapse'
  | 'removeEmpty'
  | 'dedupe'
  | 'filter'
  | 'sort'
  | 'reverse'
  | 'tabs'
  | 'strip'
  | 'affix'
  | 'number'
  | 'lineEndings';

export interface StepOptions {
  trim: { mode: 'both' | 'start' | 'end' };
  collapse: Record<string, never>;
  removeEmpty: Record<string, never>;
  dedupe: { ignoreCase: boolean; keep: 'first' | 'last' };
  filter: { mode: 'containing' | 'not-containing'; text: string; ignoreCase: boolean };
  sort: { order: 'az' | 'za' | 'natural' | 'length' | 'random'; ignoreCase: boolean; seed: number };
  reverse: Record<string, never>;
  tabs: { direction: 'tabs-to-spaces' | 'spaces-to-tabs'; width: number };
  strip: Record<string, never>;
  affix: { prefix: string; suffix: string };
  number: { start: number; separator: string; pad: boolean };
  lineEndings: { to: 'lf' | 'crlf' };
}

export type Step = { [K in StepId]: { id: K; enabled: boolean; options: StepOptions[K] } }[StepId];

export const STEP_LABELS: Record<StepId, string> = {
  trim: 'Trim lines',
  collapse: 'Collapse inner whitespace',
  removeEmpty: 'Remove empty lines',
  dedupe: 'Remove duplicate lines',
  filter: 'Keep or remove lines containing text',
  sort: 'Sort lines',
  reverse: 'Reverse line order',
  tabs: 'Convert tabs ↔ spaces',
  strip: 'Strip non-printable and zero-width characters',
  affix: 'Add prefix / suffix',
  number: 'Number lines',
  lineEndings: 'Normalise line endings',
};

export function defaultSteps(): Step[] {
  return [
    { id: 'strip', enabled: false, options: {} },
    { id: 'trim', enabled: true, options: { mode: 'both' } },
    { id: 'collapse', enabled: false, options: {} },
    { id: 'tabs', enabled: false, options: { direction: 'tabs-to-spaces', width: 4 } },
    { id: 'removeEmpty', enabled: true, options: {} },
    { id: 'filter', enabled: false, options: { mode: 'containing', text: '', ignoreCase: true } },
    { id: 'dedupe', enabled: true, options: { ignoreCase: false, keep: 'first' } },
    { id: 'sort', enabled: false, options: { order: 'az', ignoreCase: true, seed: 1 } },
    { id: 'reverse', enabled: false, options: {} },
    { id: 'affix', enabled: false, options: { prefix: '', suffix: '' } },
    { id: 'number', enabled: false, options: { start: 1, separator: '. ', pad: false } },
    { id: 'lineEndings', enabled: false, options: { to: 'lf' } },
  ];
}

// Control characters except tab/LF/CR, DEL, C1 controls, soft hyphen, zero-width and bidi controls, BOM.
// eslint-disable-next-line no-control-regex
const NON_PRINTABLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F­᠎​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;

/** Small seeded PRNG so a random sort stays stable while the user keeps typing. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function detabLine(line: string, width: number): string {
  let out = '';
  for (const ch of line) {
    if (ch === '\t') out += ' '.repeat(width - (out.length % width));
    else out += ch;
  }
  return out;
}

function entabLine(line: string, width: number): string {
  // Only leading indentation is converted: tabs inside text would change how it lines up.
  const m = /^ +/.exec(line);
  if (!m) return line;
  const n = m[0].length;
  return '\t'.repeat(Math.floor(n / width)) + ' '.repeat(n % width) + line.slice(n);
}

function applyStep(lines: string[], step: Step): string[] {
  switch (step.id) {
    case 'trim': {
      const f = step.options.mode === 'start' ? (s: string) => s.trimStart() : step.options.mode === 'end' ? (s: string) => s.trimEnd() : (s: string) => s.trim();
      return lines.map(f);
    }
    case 'collapse':
      return lines.map((l) => {
        const lead = /^[ \t]*/.exec(l)![0];
        return lead + l.slice(lead.length).replace(/[ \t ]{2,}/g, ' ');
      });
    case 'removeEmpty':
      return lines.filter((l) => l.trim() !== '');
    case 'dedupe': {
      const key = step.options.ignoreCase ? (s: string) => s.toLocaleLowerCase() : (s: string) => s;
      if (step.options.keep === 'first') {
        const seen = new Set<string>();
        return lines.filter((l) => {
          const k = key(l);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      }
      const last = new Map<string, number>();
      lines.forEach((l, i) => last.set(key(l), i));
      return lines.filter((l, i) => last.get(key(l)) === i);
    }
    case 'filter': {
      const { text, ignoreCase, mode } = step.options;
      if (!text) return lines;
      const needle = ignoreCase ? text.toLocaleLowerCase() : text;
      return lines.filter((l) => (ignoreCase ? l.toLocaleLowerCase() : l).includes(needle) === (mode === 'containing'));
    }
    case 'sort': {
      const { order, ignoreCase, seed } = step.options;
      const out = [...lines];
      if (order === 'random') {
        const rnd = mulberry32(seed);
        for (let i = out.length - 1; i > 0; i--) {
          const j = Math.floor(rnd() * (i + 1));
          [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
      }
      if (order === 'length') return out.sort((a, b) => [...a].length - [...b].length);
      const collator = new Intl.Collator('en', { numeric: order === 'natural', sensitivity: ignoreCase ? 'accent' : 'variant' });
      out.sort((a, b) => collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0));
      return order === 'za' ? out.reverse() : out;
    }
    case 'reverse':
      return [...lines].reverse();
    case 'tabs': {
      const w = Math.max(1, Math.min(16, Math.floor(step.options.width) || 4));
      return lines.map((l) => (step.options.direction === 'tabs-to-spaces' ? detabLine(l, w) : entabLine(l, w)));
    }
    case 'strip':
      return lines.map((l) => l.replace(NON_PRINTABLE, ''));
    case 'affix':
      return lines.map((l) => step.options.prefix + l + step.options.suffix);
    case 'number': {
      const { start, separator, pad } = step.options;
      const first = Number.isFinite(start) ? Math.trunc(start) : 1;
      const width = String(first + lines.length - 1).length;
      return lines.map((l, i) => `${pad ? String(first + i).padStart(width, '0') : first + i}${separator}${l}`);
    }
    case 'lineEndings':
      return lines;
  }
}

export interface CleanResult {
  output: string;
  linesBefore: number;
  linesAfter: number;
  charsBefore: number;
  charsAfter: number;
}

function countLines(text: string): number {
  if (!text) return 0;
  const n = text.split(/\r\n|\r|\n/).length;
  return /(\r\n|\r|\n)$/.test(text) ? n - 1 : n;
}

export function cleanText(input: string, steps: Step[]): CleanResult {
  const trailingNewline = /(\r\n|\r|\n)$/.test(input);
  const lines = input === '' ? [] : input.split(/\r\n|\r|\n/);
  if (trailingNewline) lines.pop();
  const detected = /\r\n/.test(input) ? '\r\n' : /\r(?!\n)/.test(input) && !/\n/.test(input) ? '\r' : '\n';
  let eol = detected;
  let out = lines;
  for (const step of steps) {
    if (!step.enabled) continue;
    if (step.id === 'lineEndings') eol = step.options.to === 'crlf' ? '\r\n' : '\n';
    else out = applyStep(out, step);
  }
  const output = out.join(eol) + (trailingNewline && out.length ? eol : '');
  return { output, linesBefore: countLines(input), linesAfter: countLines(output), charsBefore: input.length, charsAfter: output.length };
}
