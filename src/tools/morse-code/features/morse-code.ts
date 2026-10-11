// Pure logic for the Morse Code Translator: no DOM or audio, so it's unit-testable in Node.

export const LETTERS: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
  N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
};
export const DIGITS: Record<string, string> = {
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};
export const PUNCTUATION: Record<string, string> = {
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...',
  ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', _: '..--.-', '"': '.-..-.', $: '...-..-', '@': '.--.-.',
};
/** Prosigns are sent as one unbroken character and typed as <NAME>. */
export const PROSIGNS: Record<string, string> = {
  AR: '.-.-.', AS: '.-...', BT: '-...-', CT: '-.-.-', KN: '-.--.', SK: '...-.-', SOS: '...---...', HH: '........',
};

const CHARS: Record<string, string> = { ...LETTERS, ...DIGITS, ...PUNCTUATION };
// Several patterns are shared (+ = AR, = = BT, ( = KN): decoding prefers the plain character.
const REVERSE: Record<string, string> = {};
for (const [k, v] of Object.entries(PROSIGNS)) REVERSE[v] = `<${k}>`;
for (const [k, v] of Object.entries(CHARS)) REVERSE[v] = k;

export const UNKNOWN = '�';
export type Separator = 'space' | 'slash';

/** Encode text. Unknown characters are skipped and listed. `<AR>`-style prosigns are recognised. */
export function encode(text: string, sep: Separator = 'space'): { morse: string; skipped: string[] } {
  const skipped: string[] = [];
  const words = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const letters: string[] = [];
      for (const m of word.matchAll(/<([A-Z]+)>|([\s\S])/gu)) {
        const code = m[1] && PROSIGNS[m[1]] ? PROSIGNS[m[1]] : CHARS[m[0]];
        if (code) letters.push(code);
        else for (const ch of m[0]) if (!skipped.includes(ch)) skipped.push(ch);
      }
      return letters.join(' ');
    })
    .filter(Boolean);
  return { morse: words.join(sep === 'slash' ? ' / ' : '   '), skipped };
}

/** Normalise lookalike dots/dashes, then split into words (`/`, `|`, 3+ spaces, newline) and letters (whitespace). */
export function parseMorse(morse: string): string[][] {
  return morse
    .replace(/[·•∙.]/g, '.')
    .replace(/[–—−‒]/g, '-')
    .split(/\s*[/|]\s*|[ \t]{3,}|\r?\n+/)
    .map((w) => w.trim().split(/\s+/).filter(Boolean))
    .filter((w) => w.length);
}

/** Decode Morse tolerantly: unknown groups become �. */
export function decode(morse: string): string {
  return parseMorse(morse)
    .map((w) => w.map((g) => REVERSE[g] ?? UNKNOWN).join(''))
    .join(' ');
}

export interface Tone {
  tone: boolean;
  ms: number;
}

export const WPM_MIN = 5;
export const WPM_MAX = 40;

/** Dit length in ms for the PARIS standard (50 units per word). */
export const unitMs = (wpm: number) => 1200 / wpm;

/** Extra-gap unit in ms with Farnsworth spacing: characters at `wpm`, overall rate `overall` (≤ wpm). */
export function gapUnitMs(wpm: number, overall: number): number {
  const s = Math.min(Math.max(overall, 1), wpm);
  if (s === wpm) return unitMs(wpm);
  const delay = (60 * wpm - 37.2 * s) / (wpm * s); // seconds of extra delay per PARIS word, spread over 19 gap units
  return (delay * 1000) / 19;
}

/** On/off timeline for playback. Letters are 3 gap units apart, words 7 (gap unit > dit under Farnsworth). */
export function timeline(morse: string, wpm: number, overall = wpm): Tone[] {
  const u = unitMs(wpm);
  const g = gapUnitMs(wpm, overall);
  const out: Tone[] = [];
  const gap = (ms: number) => {
    const last = out[out.length - 1];
    if (last && !last.tone) last.ms += ms;
    else out.push({ tone: false, ms });
  };
  parseMorse(morse).forEach((word, wi) => {
    if (wi) gap(7 * g);
    word.forEach((letter, li) => {
      if (li) gap(3 * g);
      [...letter].filter((c) => c === '.' || c === '-').forEach((c, i) => {
        if (i) gap(u);
        out.push({ tone: true, ms: c === '.' ? u : 3 * u });
      });
    });
  });
  return out;
}

export const totalMs = (t: Tone[]) => t.reduce((n, x) => n + x.ms, 0);
