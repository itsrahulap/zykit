// Text statistics. Pure functions, no DOM.

export const READING_WPM = 238;
export const SPEAKING_WPM = 150;

export const STOP_WORDS = new Set(
  (
    'a about above after again against all am an and any are as at be because been before being below between both but by can ' +
    'could did do does doing down during each few for from further had has have having he her here hers herself him himself his ' +
    'how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves ' +
    'out over own same she should so some such than that the their theirs them themselves then there these they this those through ' +
    'to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves'
  ).split(' '),
);

export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  graphemes: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  bytes: number;
  averageWordLength: number;
  readingSeconds: number;
  speakingSeconds: number;
  longestWord: string;
  topWords: { word: string; count: number }[];
}

type WordSegmenter = { segment: (s: string) => Iterable<{ segment: string; isWordLike?: boolean }> };

function segmenter(granularity: 'word' | 'grapheme' | 'sentence'): WordSegmenter | null {
  const S = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => WordSegmenter }).Segmenter;
  return S ? new S(undefined, { granularity }) : null;
}

const WORD_SEG = segmenter('word');
const GRAPHEME_SEG = segmenter('grapheme');

/** Words in order. Uses Intl.Segmenter when available (handles CJK etc.), else a regex. */
export function words(text: string, seg: WordSegmenter | null = WORD_SEG): string[] {
  if (seg) {
    const out: string[] = [];
    for (const s of seg.segment(text)) if (s.isWordLike) out.push(s.segment);
    return out;
  }
  return text.match(/[\p{L}\p{M}\p{N}]+(?:['’.-][\p{L}\p{M}\p{N}]+)*/gu) ?? [];
}

export function countGraphemes(text: string, seg: WordSegmenter | null = GRAPHEME_SEG): number {
  if (!seg) return Array.from(text).length;
  let n = 0;
  for (const _ of seg.segment(text)) n++;
  return n;
}

export function utf8Bytes(text: string): number {
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length && (text.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
      n += 4;
      i++;
    } else n += 3;
  }
  return n;
}

export function countSentences(text: string): number {
  if (!text.trim()) return 0;
  // A sentence ends at . ! ? … (or CJK 。！？) followed by space/end; trailing text without one still counts.
  const parts = text.split(/(?<=[.!?…。！？])["'”’)\]]*(?:\s+|$)/u);
  return parts.filter((p) => /[\p{L}\p{N}]/u.test(p)).length;
}

export function countParagraphs(text: string): number {
  return text.split(/\n\s*\n/).filter((p) => p.trim()).length;
}

export function countLines(text: string): number {
  return text ? text.split(/\r\n|\r|\n/).length : 0;
}

export function computeStats(text: string, { ignoreStopWords = false, top = 10 } = {}): TextStats {
  const ws = words(text);
  let letters = 0;
  let longestWord = '';
  let longestLen = 0;
  const freq = new Map<string, number>();
  for (const w of ws) {
    const len = Array.from(w).length;
    letters += len;
    if (len > longestLen) {
      longestWord = w;
      longestLen = len;
    }
    const key = w.toLowerCase();
    if (ignoreStopWords && STOP_WORDS.has(key)) continue;
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  const topWords = [...freq]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, top)
    .map(([word, count]) => ({ word, count }));
  const characters = text.length;
  return {
    words: ws.length,
    characters,
    charactersNoSpaces: text.replace(/\s+/g, '').length,
    graphemes: countGraphemes(text),
    sentences: countSentences(text),
    paragraphs: countParagraphs(text),
    lines: countLines(text),
    bytes: utf8Bytes(text),
    averageWordLength: ws.length ? letters / ws.length : 0,
    readingSeconds: Math.ceil((ws.length / READING_WPM) * 60),
    speakingSeconds: Math.ceil((ws.length / SPEAKING_WPM) * 60),
    longestWord,
    topWords,
  };
}

/** "0 sec", "45 sec", "3 min", "1 hr 5 min". */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
