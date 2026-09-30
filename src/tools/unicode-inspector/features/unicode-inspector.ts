// Character-level analysis of text: grapheme clusters, code points, names, categories, scripts,
// encodings and escapes, plus detection of invisible, bidi-control and look-alike characters.

import { charName, INVISIBLE_LABELS } from './names';

export const CATEGORIES: [string, string][] = [
  ['Lu', 'Uppercase letter'],
  ['Ll', 'Lowercase letter'],
  ['Lt', 'Titlecase letter'],
  ['Lm', 'Modifier letter'],
  ['Lo', 'Other letter'],
  ['Mn', 'Nonspacing mark'],
  ['Mc', 'Spacing mark'],
  ['Me', 'Enclosing mark'],
  ['Nd', 'Decimal number'],
  ['Nl', 'Letter number'],
  ['No', 'Other number'],
  ['Pc', 'Connector punctuation'],
  ['Pd', 'Dash punctuation'],
  ['Ps', 'Open punctuation'],
  ['Pe', 'Close punctuation'],
  ['Pi', 'Initial punctuation'],
  ['Pf', 'Final punctuation'],
  ['Po', 'Other punctuation'],
  ['Sm', 'Math symbol'],
  ['Sc', 'Currency symbol'],
  ['Sk', 'Modifier symbol'],
  ['So', 'Other symbol'],
  ['Zs', 'Space separator'],
  ['Zl', 'Line separator'],
  ['Zp', 'Paragraph separator'],
  ['Cc', 'Control'],
  ['Cf', 'Format'],
  ['Cs', 'Surrogate'],
  ['Co', 'Private use'],
];
const CATEGORY_RE = CATEGORIES.map(([c]) => [c, new RegExp(`^\\p{${c}}$`, 'u')] as const);

export function generalCategory(ch: string): [code: string, name: string] {
  for (const [c, re] of CATEGORY_RE) if (re.test(ch)) return [c, CATEGORIES.find(([k]) => k === c)![1]];
  return ['Cn', 'Unassigned'];
}

const SCRIPTS = [
  'Latin',
  'Common',
  'Inherited',
  'Greek',
  'Cyrillic',
  'Han',
  'Hiragana',
  'Katakana',
  'Hangul',
  'Arabic',
  'Hebrew',
  'Devanagari',
  'Bengali',
  'Gurmukhi',
  'Gujarati',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Sinhala',
  'Thai',
  'Lao',
  'Tibetan',
  'Myanmar',
  'Georgian',
  'Armenian',
  'Ethiopic',
  'Cherokee',
  'Khmer',
  'Mongolian',
  'Syriac',
  'Thaana',
  'Bopomofo',
  'Braille',
  'Runic',
  'Ogham',
];
const SCRIPT_RE = SCRIPTS.map((s) => [s, new RegExp(`^\\p{Script=${s}}$`, 'u')] as const);

export function scriptOf(ch: string): string {
  for (const [s, re] of SCRIPT_RE) if (re.test(ch)) return s;
  return 'Other';
}

const BLOCKS: [number, number, string][] = [
  [0x0000, 0x007f, 'Basic Latin'],
  [0x0080, 0x00ff, 'Latin-1 Supplement'],
  [0x0100, 0x017f, 'Latin Extended-A'],
  [0x0180, 0x024f, 'Latin Extended-B'],
  [0x0250, 0x02af, 'IPA Extensions'],
  [0x02b0, 0x02ff, 'Spacing Modifier Letters'],
  [0x0300, 0x036f, 'Combining Diacritical Marks'],
  [0x0370, 0x03ff, 'Greek and Coptic'],
  [0x0400, 0x04ff, 'Cyrillic'],
  [0x0500, 0x052f, 'Cyrillic Supplement'],
  [0x0530, 0x058f, 'Armenian'],
  [0x0590, 0x05ff, 'Hebrew'],
  [0x0600, 0x06ff, 'Arabic'],
  [0x0700, 0x074f, 'Syriac'],
  [0x0780, 0x07bf, 'Thaana'],
  [0x0900, 0x097f, 'Devanagari'],
  [0x0980, 0x09ff, 'Bengali'],
  [0x0a00, 0x0a7f, 'Gurmukhi'],
  [0x0a80, 0x0aff, 'Gujarati'],
  [0x0b80, 0x0bff, 'Tamil'],
  [0x0c00, 0x0c7f, 'Telugu'],
  [0x0c80, 0x0cff, 'Kannada'],
  [0x0d00, 0x0d7f, 'Malayalam'],
  [0x0e00, 0x0e7f, 'Thai'],
  [0x0e80, 0x0eff, 'Lao'],
  [0x0f00, 0x0fff, 'Tibetan'],
  [0x1000, 0x109f, 'Myanmar'],
  [0x10a0, 0x10ff, 'Georgian'],
  [0x1100, 0x11ff, 'Hangul Jamo'],
  [0x1200, 0x137f, 'Ethiopic'],
  [0x13a0, 0x13ff, 'Cherokee'],
  [0x1680, 0x169f, 'Ogham'],
  [0x16a0, 0x16ff, 'Runic'],
  [0x1780, 0x17ff, 'Khmer'],
  [0x1800, 0x18af, 'Mongolian'],
  [0x1ab0, 0x1aff, 'Combining Diacritical Marks Extended'],
  [0x1d00, 0x1d7f, 'Phonetic Extensions'],
  [0x1dc0, 0x1dff, 'Combining Diacritical Marks Supplement'],
  [0x1e00, 0x1eff, 'Latin Extended Additional'],
  [0x1f00, 0x1fff, 'Greek Extended'],
  [0x2000, 0x206f, 'General Punctuation'],
  [0x2070, 0x209f, 'Superscripts and Subscripts'],
  [0x20a0, 0x20cf, 'Currency Symbols'],
  [0x20d0, 0x20ff, 'Combining Diacritical Marks for Symbols'],
  [0x2100, 0x214f, 'Letterlike Symbols'],
  [0x2150, 0x218f, 'Number Forms'],
  [0x2190, 0x21ff, 'Arrows'],
  [0x2200, 0x22ff, 'Mathematical Operators'],
  [0x2300, 0x23ff, 'Miscellaneous Technical'],
  [0x2400, 0x243f, 'Control Pictures'],
  [0x2460, 0x24ff, 'Enclosed Alphanumerics'],
  [0x2500, 0x257f, 'Box Drawing'],
  [0x2580, 0x259f, 'Block Elements'],
  [0x25a0, 0x25ff, 'Geometric Shapes'],
  [0x2600, 0x26ff, 'Miscellaneous Symbols'],
  [0x2700, 0x27bf, 'Dingbats'],
  [0x27c0, 0x27ef, 'Miscellaneous Mathematical Symbols-A'],
  [0x27f0, 0x27ff, 'Supplemental Arrows-A'],
  [0x2800, 0x28ff, 'Braille Patterns'],
  [0x2900, 0x297f, 'Supplemental Arrows-B'],
  [0x2980, 0x29ff, 'Miscellaneous Mathematical Symbols-B'],
  [0x2a00, 0x2aff, 'Supplemental Mathematical Operators'],
  [0x2b00, 0x2bff, 'Miscellaneous Symbols and Arrows'],
  [0x2c60, 0x2c7f, 'Latin Extended-C'],
  [0x2e00, 0x2e7f, 'Supplemental Punctuation'],
  [0x3000, 0x303f, 'CJK Symbols and Punctuation'],
  [0x3040, 0x309f, 'Hiragana'],
  [0x30a0, 0x30ff, 'Katakana'],
  [0x3100, 0x312f, 'Bopomofo'],
  [0x3130, 0x318f, 'Hangul Compatibility Jamo'],
  [0x3400, 0x4dbf, 'CJK Unified Ideographs Extension A'],
  [0x4e00, 0x9fff, 'CJK Unified Ideographs'],
  [0xa640, 0xa69f, 'Cyrillic Extended-B'],
  [0xa720, 0xa7ff, 'Latin Extended-D'],
  [0xab30, 0xab6f, 'Latin Extended-E'],
  [0xac00, 0xd7af, 'Hangul Syllables'],
  [0xd800, 0xdbff, 'High Surrogates'],
  [0xdc00, 0xdfff, 'Low Surrogates'],
  [0xe000, 0xf8ff, 'Private Use Area'],
  [0xf900, 0xfaff, 'CJK Compatibility Ideographs'],
  [0xfb00, 0xfb4f, 'Alphabetic Presentation Forms'],
  [0xfb50, 0xfdff, 'Arabic Presentation Forms-A'],
  [0xfe00, 0xfe0f, 'Variation Selectors'],
  [0xfe20, 0xfe2f, 'Combining Half Marks'],
  [0xfe30, 0xfe4f, 'CJK Compatibility Forms'],
  [0xfe50, 0xfe6f, 'Small Form Variants'],
  [0xfe70, 0xfeff, 'Arabic Presentation Forms-B'],
  [0xff00, 0xffef, 'Halfwidth and Fullwidth Forms'],
  [0xfff0, 0xffff, 'Specials'],
  [0x1d400, 0x1d7ff, 'Mathematical Alphanumeric Symbols'],
  [0x1f000, 0x1f02f, 'Mahjong Tiles'],
  [0x1f0a0, 0x1f0ff, 'Playing Cards'],
  [0x1f100, 0x1f1ff, 'Enclosed Alphanumeric Supplement'],
  [0x1f300, 0x1f5ff, 'Miscellaneous Symbols and Pictographs'],
  [0x1f600, 0x1f64f, 'Emoticons'],
  [0x1f680, 0x1f6ff, 'Transport and Map Symbols'],
  [0x1f780, 0x1f7ff, 'Geometric Shapes Extended'],
  [0x1f900, 0x1f9ff, 'Supplemental Symbols and Pictographs'],
  [0x1fa70, 0x1faff, 'Symbols and Pictographs Extended-A'],
  [0x20000, 0x2a6df, 'CJK Unified Ideographs Extension B'],
  [0x2a700, 0x2ebef, 'CJK Unified Ideographs Extensions C–F'],
  [0x30000, 0x323af, 'CJK Unified Ideographs Extensions G–H'],
  [0xe0000, 0xe007f, 'Tags'],
  [0xe0100, 0xe01ef, 'Variation Selectors Supplement'],
  [0xf0000, 0xfffff, 'Supplementary Private Use Area-A'],
  [0x100000, 0x10ffff, 'Supplementary Private Use Area-B'],
];

export function blockOf(cp: number): string {
  let lo = 0;
  let hi = BLOCKS.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [a, b, name] = BLOCKS[mid];
    if (cp < a) hi = mid - 1;
    else if (cp > b) lo = mid + 1;
    else return name;
  }
  return 'Other block';
}

// ---- Encodings and escapes -----------------------------------------------------------------

export const hex = (n: number, w = 4) => n.toString(16).toUpperCase().padStart(w, '0');
export const uPlus = (cp: number) => `U+${hex(cp)}`;

const isSurrogate = (cp: number) => cp >= 0xd800 && cp <= 0xdfff;

/** UTF-8 bytes (lone surrogates can't be encoded and give an empty array). */
export function utf8Bytes(cp: number): number[] {
  if (isSurrogate(cp)) return [];
  if (cp < 0x80) return [cp];
  if (cp < 0x800) return [0xc0 | (cp >> 6), 0x80 | (cp & 63)];
  if (cp < 0x10000) return [0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)];
  return [0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)];
}

export function utf16Units(cp: number): number[] {
  if (cp < 0x10000) return [cp];
  const v = cp - 0x10000;
  return [0xd800 | (v >> 10), 0xdc00 | (v & 0x3ff)];
}

const NAMED_HTML: Record<number, string> = { 0x22: '&quot;', 0x26: '&amp;', 0x27: '&apos;', 0x3c: '&lt;', 0x3e: '&gt;', 0xa0: '&nbsp;', 0xad: '&shy;' };

export function escapes(cp: number): { html: string; js: string; css: string; url: string } {
  const js = cp < 0x10000 ? `\\u${hex(cp)}` : `\\u{${hex(cp, 1)}}`;
  let url = '';
  const bytes = utf8Bytes(cp);
  url = bytes.length ? bytes.map((b) => `%${hex(b, 2)}`).join('') : '(not encodable)';
  return { html: NAMED_HTML[cp] ?? `&#x${hex(cp, 1)};`, js, css: `\\${hex(cp, 1)}`, url };
}

// ---- Suspicious characters ---------------------------------------------------------------

export type FlagKind = 'bidi' | 'invisible' | 'space' | 'control' | 'variation' | 'tag' | 'confusable' | 'private' | 'unassigned' | 'surrogate' | 'replacement';
export type Severity = 'danger' | 'warn' | 'info';

export interface Flag {
  kind: FlagKind;
  severity: Severity;
  message: string;
}

const BIDI = new Set([0x061c, 0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069]);
const INVISIBLE = new Set([0x00ad, 0x034f, 0x115f, 0x1160, 0x180e, 0x200b, 0x200c, 0x200d, 0x2060, 0x2061, 0x2062, 0x2063, 0x2064, 0x3164, 0xfeff, 0xffa0]);
const ODD_SPACES = new Set([0x00a0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000]);

/** Common look-alikes for Latin letters (a small, hand-picked subset of Unicode's confusables). */
export const HOMOGLYPHS: Record<number, string> = {
  // Cyrillic
  0x0430: 'a', 0x0435: 'e', 0x043e: 'o', 0x0440: 'p', 0x0441: 'c', 0x0445: 'x', 0x0443: 'y', 0x0456: 'i', 0x0458: 'j', 0x0455: 's', 0x0501: 'd', 0x04bb: 'h', 0x051b: 'q', 0x051d: 'w', 0x04cf: 'l',
  0x0410: 'A', 0x0412: 'B', 0x0415: 'E', 0x041a: 'K', 0x041c: 'M', 0x041d: 'H', 0x041e: 'O', 0x0420: 'P', 0x0421: 'C', 0x0422: 'T', 0x0425: 'X', 0x0406: 'I', 0x0408: 'J', 0x0405: 'S', 0x04ae: 'Y',
  // Greek
  0x03bf: 'o', 0x03bd: 'v', 0x03b1: 'a', 0x03b9: 'i', 0x03ba: 'k', 0x03c1: 'p', 0x03c5: 'u', 0x03c7: 'x',
  0x0391: 'A', 0x0392: 'B', 0x0395: 'E', 0x0396: 'Z', 0x0397: 'H', 0x0399: 'I', 0x039a: 'K', 0x039c: 'M', 0x039d: 'N', 0x039f: 'O', 0x03a1: 'P', 0x03a4: 'T', 0x03a5: 'Y', 0x03a7: 'X',
  // Latin look-alikes and letterlike symbols
  0x0131: 'i', 0x0261: 'g', 0x0251: 'a', 0x026a: 'I', 0x01c0: 'l', 0x2113: 'l', 0x212a: 'K', 0x212b: 'A', 0x2126: 'Ω',
};

const EMOJI_BASE = /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u;

function flagsFor(cp: number, ch: string, inEmoji: boolean, category: string): Flag[] {
  const f: Flag[] = [];
  if (BIDI.has(cp))
    f.push({ kind: 'bidi', severity: 'danger', message: 'Bidirectional control: can make text (or source code) display in a different order than it is read — the "Trojan Source" attack.' });
  else if (cp === 0x200d && inEmoji) f.push({ kind: 'invisible', severity: 'info', message: 'Zero width joiner inside an emoji sequence (expected).' });
  else if (INVISIBLE.has(cp)) f.push({ kind: 'invisible', severity: 'warn', message: 'Invisible character: takes no space but changes comparisons, searches and word breaks.' });
  else if (ODD_SPACES.has(cp)) f.push({ kind: 'space', severity: 'warn', message: 'Unusual space: looks like a normal space but isn’t one.' });
  else if ((cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0100 && cp <= 0xe01ef))
    f.push(inEmoji ? { kind: 'variation', severity: 'info', message: 'Variation selector choosing emoji or text style (expected).' } : { kind: 'variation', severity: 'warn', message: 'Variation selector outside an emoji: invisible, and can hide data.' });
  else if (cp >= 0xe0000 && cp <= 0xe007f)
    f.push(inEmoji ? { kind: 'tag', severity: 'info', message: 'Tag character in a flag emoji sequence (expected).' } : { kind: 'tag', severity: 'danger', message: 'Tag character: invisible copy of an ASCII character, used to smuggle hidden text (e.g. into prompts).' });
  else if (category === 'Cc' && cp !== 0x09 && cp !== 0x0a && cp !== 0x0d) f.push({ kind: 'control', severity: 'warn', message: 'Control character: usually invisible and often a sign of corrupted or binary data.' });
  else if (category === 'Co') f.push({ kind: 'private', severity: 'warn', message: 'Private-use character: meaning depends on the font or app.' });
  else if (category === 'Cs') f.push({ kind: 'surrogate', severity: 'warn', message: 'Lone surrogate: invalid on its own and cannot be encoded as UTF-8.' });
  else if (category === 'Cn') f.push({ kind: 'unassigned', severity: 'warn', message: 'Unassigned (or newer than this browser’s Unicode data).' });
  else if (cp === 0xfffd) f.push({ kind: 'replacement', severity: 'info', message: 'Replacement character: something failed to decode here.' });
  const like = HOMOGLYPHS[cp] ?? (cp >= 0xff01 && cp <= 0xff5e ? String.fromCharCode(cp - 0xfee0) : null);
  if (like) f.push({ kind: 'confusable', severity: 'warn', message: `Looks like "${like}" but is ${scriptOf(ch)} ${uPlus(cp)}.` });
  return f;
}

// ---- Analysis ------------------------------------------------------------------------------

export interface CodePointInfo {
  cp: number;
  hex: string;
  char: string;
  /** What to draw for the character (a label for invisible ones). */
  display: string;
  name: string | null;
  category: string;
  categoryName: string;
  script: string;
  block: string;
  utf8: number[];
  utf16: number[];
  escapes: ReturnType<typeof escapes>;
  flags: Flag[];
  /** Index of the grapheme cluster this belongs to. */
  grapheme: number;
}

export function displayFor(cp: number, category: string): string {
  if (cp < 0x20) return String.fromCodePoint(0x2400 + cp);
  if (cp === 0x20) return '␠';
  if (cp === 0x7f) return '␡';
  if (INVISIBLE_LABELS[cp]) return INVISIBLE_LABELS[cp];
  if (cp >= 0xfe00 && cp <= 0xfe0f) return `VS${cp - 0xfe00 + 1}`;
  if (cp >= 0xe0100 && cp <= 0xe01ef) return `VS${cp - 0xe0100 + 17}`;
  if (cp >= 0xe0020 && cp <= 0xe007e) return `TAG ${String.fromCharCode(cp - 0xe0000)}`;
  if (cp >= 0xe0000 && cp <= 0xe007f) return 'TAG';
  if (category === 'Cc' || category === 'Cf' || category === 'Cs' || category === 'Cn') return uPlus(cp);
  if (category.startsWith('M')) return `◌${String.fromCodePoint(cp)}`;
  return String.fromCodePoint(cp);
}

export function describeCodePoint(cp: number, grapheme = 0, inEmoji = false): CodePointInfo {
  const char = String.fromCodePoint(cp);
  const [category, categoryName] = generalCategory(char);
  return {
    cp,
    hex: uPlus(cp),
    char,
    display: displayFor(cp, category),
    name: charName(cp),
    category,
    categoryName,
    script: scriptOf(char),
    block: blockOf(cp),
    utf8: utf8Bytes(cp),
    utf16: utf16Units(cp),
    escapes: escapes(cp),
    flags: flagsFor(cp, char, inEmoji, category),
    grapheme,
  };
}

export function graphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

export interface MixedWord {
  word: string;
  scripts: string[];
  /** The word with look-alikes replaced by the Latin letters they imitate. */
  skeleton: string;
}

export interface NormalForm {
  form: 'NFC' | 'NFD' | 'NFKC' | 'NFKD';
  text: string;
  codePoints: number;
  utf8Bytes: number;
  same: boolean;
}

export interface Analysis {
  graphemeCount: number;
  codePointCount: number;
  utf16Length: number;
  utf8Length: number;
  /** Per code point details, capped at `maxRows`. */
  rows: CodePointInfo[];
  truncated: boolean;
  /** Counts of flagged code points by kind (only warn/danger severities). */
  flagCounts: Partial<Record<FlagKind, number>>;
  flagged: number;
  scripts: { script: string; count: number }[];
  mixedWords: MixedWord[];
  normalization: NormalForm[];
}

export const skeleton = (s: string) => Array.from(s, (c) => HOMOGLYPHS[c.codePointAt(0)!] ?? c).join('');

const WORD_RE = /[\p{L}\p{M}\p{Nd}]+/gu;
const NEUTRAL = new Set(['Common', 'Inherited', 'Other']);

export function mixedScriptWords(text: string, limit = 50): MixedWord[] {
  const out: MixedWord[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(WORD_RE)) {
    const w = m[0];
    if (seen.has(w)) continue;
    seen.add(w);
    const scripts = new Set<string>();
    for (const c of w) {
      const s = scriptOf(c);
      if (!NEUTRAL.has(s)) scripts.add(s);
    }
    if (scripts.size > 1) out.push({ word: w, scripts: [...scripts], skeleton: skeleton(w) });
    if (out.length >= limit) break;
  }
  return out;
}

const utf8Len = (s: string) => {
  let n = 0;
  for (const c of s) n += utf8Bytes(c.codePointAt(0)!).length || 3;
  return n;
};

export function analyze(text: string, maxRows = 2000): Analysis {
  const clusters = graphemes(text);
  const rows: CodePointInfo[] = [];
  const flagCounts: Partial<Record<FlagKind, number>> = {};
  const scriptCounts = new Map<string, number>();
  let flagged = 0;
  let codePointCount = 0;
  clusters.forEach((g, gi) => {
    const inEmoji = EMOJI_BASE.test(g);
    for (const c of g) {
      const cp = c.codePointAt(0)!;
      codePointCount++;
      // Cheap path for plain ASCII letters/digits beyond the row cap.
      const info = rows.length < maxRows || !/[\w .,\n]/.test(c) ? describeCodePoint(cp, gi, inEmoji) : null;
      if (info && rows.length < maxRows) rows.push(info);
      const script = info?.script ?? scriptOf(c);
      scriptCounts.set(script, (scriptCounts.get(script) ?? 0) + 1);
      const serious = info?.flags.filter((f) => f.severity !== 'info') ?? [];
      if (serious.length) flagged++;
      for (const f of serious) flagCounts[f.kind] = (flagCounts[f.kind] ?? 0) + 1;
    }
  });
  const forms: NormalForm['form'][] = ['NFC', 'NFD', 'NFKC', 'NFKD'];
  return {
    graphemeCount: clusters.length,
    codePointCount,
    utf16Length: text.length,
    utf8Length: utf8Len(text),
    rows,
    truncated: codePointCount > rows.length,
    flagCounts,
    flagged,
    scripts: [...scriptCounts].map(([script, count]) => ({ script, count })).sort((a, b) => b.count - a.count),
    mixedWords: mixedScriptWords(text),
    normalization: forms.map((form) => {
      const t = text.normalize(form);
      return { form, text: t, codePoints: Array.from(t).length, utf8Bytes: utf8Len(t), same: t === text };
    }),
  };
}

export interface CleanOptions {
  /** Replace no-break and other unusual spaces with a normal space. */
  normalizeSpaces: boolean;
  /** Replace common look-alikes with the Latin letters they imitate. */
  replaceConfusables: boolean;
}

/**
 * Removes invisible characters, bidi controls, stray variation selectors and tag characters, and
 * control characters other than tab and line breaks. ZWJ, variation selectors and tags inside
 * emoji sequences are kept so emoji stay intact.
 */
export function cleanText(text: string, o: CleanOptions = { normalizeSpaces: true, replaceConfusables: false }): { text: string; removed: number; replaced: number } {
  let out = '';
  let removed = 0;
  let replaced = 0;
  for (const g of graphemes(text)) {
    const inEmoji = EMOJI_BASE.test(g);
    for (const c of g) {
      const cp = c.codePointAt(0)!;
      const [cat] = generalCategory(c);
      const kinds = flagsFor(cp, c, inEmoji, cat).filter((f) => f.severity !== 'info').map((f) => f.kind);
      if (kinds.some((k) => k === 'bidi' || k === 'invisible' || k === 'variation' || k === 'tag' || k === 'control' || k === 'surrogate')) {
        removed++;
        continue;
      }
      if (o.normalizeSpaces && kinds.includes('space')) {
        out += cp === 0x2028 || cp === 0x2029 ? '\n' : ' ';
        replaced++;
        continue;
      }
      if (o.replaceConfusables && kinds.includes('confusable')) {
        out += HOMOGLYPHS[cp] ?? String.fromCharCode(cp - 0xfee0);
        replaced++;
        continue;
      }
      out += c;
    }
  }
  return { text: out, removed, replaced };
}
