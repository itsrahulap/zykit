// Text → URL slug. Pure functions, no DOM.

export type Separator = '-' | '_' | '.';

export interface SlugOptions {
  separator: Separator;
  lowercase: boolean;
  /** Replace "&" with "and" instead of dropping it. */
  ampersand: boolean;
  /** 0 = no limit. Cut at a word boundary when possible. */
  maxLength: number;
  removeStopWords: boolean;
}

export const DEFAULT_SLUG_OPTIONS: SlugOptions = {
  separator: '-',
  lowercase: true,
  ampersand: true,
  maxLength: 0,
  removeStopWords: false,
};

/** Letters that NFKD does not decompose into ASCII + combining marks. */
const TRANSLIT: Record<string, string> = {
  ß: 'ss', ẞ: 'SS', æ: 'ae', Æ: 'AE', œ: 'oe', Œ: 'OE', ø: 'o', Ø: 'O', ł: 'l', Ł: 'L', đ: 'd', Đ: 'D',
  ð: 'd', Ð: 'D', þ: 'th', Þ: 'TH', ħ: 'h', Ħ: 'H', ı: 'i', ĸ: 'k', ŋ: 'ng', Ŋ: 'NG', ŧ: 't', Ŧ: 'T',
  ſ: 's', ƒ: 'f', ə: 'e', Ə: 'E',
};

export const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'if', 'in', 'into', 'is', 'it', 'of',
  'on', 'or', 'so', 'than', 'that', 'the', 'then', 'this', 'to', 'was', 'were', 'will', 'with',
]);

/** Remove accents and transliterate common non-decomposable letters. */
export function transliterate(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/[ßẞæÆœŒøØłŁđĐðÐþÞħĦıĸŋŊŧŦſƒəƏ]/g, (c) => TRANSLIT[c] ?? c);
}

export function slugify(text: string, options: Partial<SlugOptions> = {}): string {
  const o = { ...DEFAULT_SLUG_OPTIONS, ...options };
  let s = transliterate(text);
  // Apostrophes join a word ("don't" → "dont") rather than splitting it.
  s = s.replace(/['’‘`]/g, '');
  if (o.ampersand) s = s.replace(/&/g, ' and ');
  if (o.lowercase) s = s.toLowerCase();
  let words = s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (o.removeStopWords) {
    const kept = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()));
    if (kept.length) words = kept;
  }
  let slug = words.join(o.separator);
  if (o.maxLength > 0 && slug.length > o.maxLength) {
    const cut = slug.slice(0, o.maxLength + 1);
    const at = cut.lastIndexOf(o.separator);
    // Cut at the last whole word; if the first word alone is too long, hard-cut it.
    slug = at > 0 ? cut.slice(0, at) : slug.slice(0, o.maxLength);
  }
  return slug;
}

/** One slug per non-empty input line. Empty lines are kept as empty output lines. */
export function slugifyLines(text: string, options: Partial<SlugOptions> = {}): string[] {
  return text.split(/\r?\n/).map((line) => (line.trim() ? slugify(line, options) : ''));
}
