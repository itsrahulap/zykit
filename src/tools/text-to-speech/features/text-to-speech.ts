// Pure logic for Text to Speech: no DOM, so it's unit-testable in Node.

export interface Chunk {
  text: string;
  /** Offset of `text` in the original input, for word highlighting. */
  start: number;
}

/** Split into sentence-based chunks of at most `max` characters (long sentences break at spaces, else hard). */
export function chunkText(input: string, max = 200): Chunk[] {
  const chunks: Chunk[] = [];
  const push = (start: number, end: number) => {
    const raw = input.slice(start, end);
    const lead = raw.length - raw.trimStart().length;
    const text = raw.trim();
    if (text) chunks.push({ text, start: start + lead });
  };
  let chunkStart = 0;
  let chunkEnd = 0;
  const flush = () => {
    push(chunkStart, chunkEnd);
    chunkStart = chunkEnd;
  };
  for (const m of input.matchAll(/[^.!?…。！？\n]*[.!?…。！？]+["'”’)\]]*\s*|[^.!?…。！？\n]+\n?|\n+/g)) {
    let pos = m.index;
    const end = pos + m[0].length;
    while (end - pos > max) {
      // Sentence longer than max: cut at the last space within the limit.
      const window = input.slice(pos, pos + max);
      const cut = window.lastIndexOf(' ') > 0 ? pos + window.lastIndexOf(' ') + 1 : pos + max;
      if (chunkEnd > chunkStart) flush();
      chunkStart = pos;
      chunkEnd = cut;
      flush();
      pos = cut;
    }
    if (chunkEnd > chunkStart && end - chunkStart > max) flush();
    if (chunkEnd === chunkStart) chunkStart = pos;
    chunkEnd = end;
    if (/\n\s*$/.test(m[0])) flush();
  }
  flush();
  return chunks;
}

/** [start, end) of the word at `index` (end is clamped to the text). */
export function wordAt(text: string, index: number, charLength?: number): [number, number] {
  if (charLength && charLength > 0) return [index, Math.min(text.length, index + charLength)];
  let end = index;
  while (end < text.length && !/\s/.test(text[end])) end++;
  return [index, Math.max(end, Math.min(text.length, index + 1))];
}

export interface VoiceInfo {
  name: string;
  lang: string;
  voiceURI: string;
  localService: boolean;
  default: boolean;
}

/** Group by language (display name when Intl knows it), languages and voices sorted. */
export function groupVoices<T extends VoiceInfo>(voices: T[], display?: (lang: string) => string): { lang: string; label: string; voices: T[] }[] {
  const by = new Map<string, T[]>();
  for (const v of voices) {
    const key = (v.lang || 'und').replace('_', '-');
    by.set(key, [...(by.get(key) ?? []), v]);
  }
  return [...by.entries()]
    .map(([lang, vs]) => ({ lang, label: display?.(lang) ?? lang, voices: vs.sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function languageLabel(lang: string): string {
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(lang);
    return name && name !== lang ? `${name} (${lang})` : lang;
  } catch {
    return lang;
  }
}
