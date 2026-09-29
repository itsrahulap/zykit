// Word splitting and case conversions. Pure functions, no DOM.

/**
 * Split text into words: separators (space, _, -, ., /, punctuation), camel humps
 * ("fooBar"), acronym boundaries ("XMLHttp" → XML, Http) and letter/digit runs.
 */
export function splitWords(text: string): string[] {
  const out: string[] = [];
  // Letter-or-digit runs; apostrophes inside words are dropped ("don't" → "dont").
  const chunks = text.replace(/(\p{L})['’](\p{L})/gu, '$1$2').match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
  for (const chunk of chunks) {
    const parts = chunk.match(/\p{Lu}+(?=\p{Lu}\p{Ll})|\p{Lu}?[\p{Ll}\p{Lo}\p{Lt}\p{Lm}\p{M}]+|\p{Lu}+|\p{N}+|[\p{L}\p{M}]+/gu) ?? [chunk];
    out.push(...parts);
  }
  return out;
}

const cap = (w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w);
const lower = (w: string) => w.toLowerCase();
const upper = (w: string) => w.toUpperCase();

const SMALL_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'per', 'so', 'the', 'to', 'up', 'via', 'vs', 'yet',
]);

export type CaseId =
  | 'camel' | 'pascal' | 'snake' | 'constant' | 'kebab' | 'train' | 'dot' | 'path'
  | 'title' | 'sentence' | 'lower' | 'upper' | 'alternating' | 'inverse';

export interface CaseFormat {
  id: CaseId;
  label: string;
  convert: (line: string) => string;
}

const byWords = (fn: (words: string[]) => string) => (line: string) => fn(splitWords(line));

export function titleCase(line: string): string {
  // Keep the original spacing and punctuation; only change letter case per word.
  let index = 0;
  const words = line.match(/[\p{L}\p{M}\p{N}'’]+/gu) ?? [];
  const last = words.length - 1;
  return line.replace(/[\p{L}\p{M}\p{N}'’]+/gu, (w) => {
    const i = index++;
    const l = w.toLowerCase();
    if (i !== 0 && i !== last && SMALL_WORDS.has(l)) return l;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
}

export function sentenceCase(line: string): string {
  const l = line.toLowerCase();
  // Capitalise the first letter and the first letter after . ! ?
  return l.replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, pre: string, c: string) => pre + c.toUpperCase());
}

export function alternatingCase(line: string): string {
  let i = 0;
  return Array.from(line, (c) => {
    if (c.toLowerCase() === c.toUpperCase()) return c;
    return i++ % 2 === 0 ? c.toLowerCase() : c.toUpperCase();
  }).join('');
}

export function inverseCase(line: string): string {
  return Array.from(line, (c) => {
    const u = c.toUpperCase();
    return c === u ? c.toLowerCase() : u;
  }).join('');
}

export const CASE_FORMATS: CaseFormat[] = [
  { id: 'camel', label: 'camelCase', convert: byWords((w) => w.map((x, i) => (i === 0 ? lower(x) : cap(x))).join('')) },
  { id: 'pascal', label: 'PascalCase', convert: byWords((w) => w.map(cap).join('')) },
  { id: 'snake', label: 'snake_case', convert: byWords((w) => w.map(lower).join('_')) },
  { id: 'constant', label: 'CONSTANT_CASE', convert: byWords((w) => w.map(upper).join('_')) },
  { id: 'kebab', label: 'kebab-case', convert: byWords((w) => w.map(lower).join('-')) },
  { id: 'train', label: 'Train-Case', convert: byWords((w) => w.map(cap).join('-')) },
  { id: 'dot', label: 'dot.case', convert: byWords((w) => w.map(lower).join('.')) },
  { id: 'path', label: 'path/case', convert: byWords((w) => w.map(lower).join('/')) },
  { id: 'title', label: 'Title Case', convert: titleCase },
  { id: 'sentence', label: 'Sentence case', convert: sentenceCase },
  { id: 'lower', label: 'lower case', convert: (l) => l.toLowerCase() },
  { id: 'upper', label: 'UPPER CASE', convert: (l) => l.toUpperCase() },
  { id: 'alternating', label: 'aLtErNaTiNg cAsE', convert: alternatingCase },
  { id: 'inverse', label: 'iNVERSE cASE', convert: inverseCase },
];

/** Convert each line separately, so a list of identifiers stays a list. */
export function convertLines(text: string, format: CaseFormat): string {
  return text
    .split(/\r?\n/)
    .map((line) => format.convert(line))
    .join('\n');
}
