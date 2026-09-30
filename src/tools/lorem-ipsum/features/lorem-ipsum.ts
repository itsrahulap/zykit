// Placeholder text generator: classic lorem ipsum or plain English, with a seedable PRNG so the
// same seed always gives the same text.

/** Deterministic 32-bit PRNG (sfc32). Returns floats in [0, 1). */
export type Rng = () => number;

/** Hashes a string seed to four 32-bit words (cyrb128). */
function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** Seeded sfc32 generator. Same seed string → same sequence, on every browser. */
export function seededRng(seed: string): Rng {
  let [a, b, c, d] = cyrb128(seed);
  const next = () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  // Discard the first outputs, which are poorly mixed for similar seeds.
  for (let i = 0; i < 12; i++) next();
  return next;
}

/** A random seed string (for "surprise me" runs that can still be reproduced). */
export function randomSeed(): string {
  return crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}

/** Integer in [min, max] inclusive. */
export const randInt = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
export const pick = <T>(rng: Rng, list: readonly T[]): T => list[Math.floor(rng() * list.length)];

export const LOREM_WORDS = (
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ' +
  'enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in ' +
  'reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa ' +
  'qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nunc pulvinar sapien rhoncus mattis ' +
  'vestibulum morbi blandit cursus risus at ultrices mi nibh praesent semper feugiat nam libero justo laoreet donec massa ' +
  'tellus integer quam vulputate dignissim suspendisse egestas pharetra vitae congue mauris aliquam faucibus purus viverra ' +
  'accumsan arcu dui vivamus sagittis eu volutpat odio facilisis porttitor lectus urna condimentum hac habitasse platea ' +
  'dictumst quisque tortor pellentesque elementum ornare fermentum iaculis nisl turpis tristique senectus netus malesuada ' +
  'fames ac eget gravida neque convallis a cras orci porta'
).split(' ');

export const ENGLISH_WORDS = (
  'the quick brown fox jumps over lazy dog every morning people walk along river after breakfast while small birds sing ' +
  'bright songs from tall trees near old stone bridge children laugh and play simple games in green park until evening ' +
  'light fades slowly behind quiet hills where farmers gather fresh bread warm soup sweet apples ripe pears for long ' +
  'winter nights friends share stories about distant cities busy markets narrow streets gentle rain cold wind soft snow ' +
  'kind neighbours bring flowers letters music books coffee tea paper maps clocks lamps chairs tables windows doors garden ' +
  'village ocean island mountain forest valley meadow harbour station library kitchen table window sunlight shadow'
).split(' ');

export type WordList = 'lorem' | 'english';
export type Unit = 'paragraphs' | 'sentences' | 'words' | 'list';
export type Format = 'plain' | 'html' | 'markdown';

export interface LoremOptions {
  words: WordList;
  unit: Unit;
  count: number;
  startWithLorem: boolean;
  format: Format;
  seed: string;
}

export const LIMITS: Record<Unit, number> = { paragraphs: 500, sentences: 5000, words: 50_000, list: 1000 };

const CLASSIC_START = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function words(rng: Rng, list: readonly string[], n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    let w = pick(rng, list);
    if (i > 0 && w === out[i - 1]) w = pick(rng, list); // avoid most immediate repeats
    out.push(w);
  }
  return out;
}

function sentence(rng: Rng, list: readonly string[], min = 6, max = 16): string {
  const ws = words(rng, list, randInt(rng, min, max));
  // An occasional comma after the 3rd…(n-3)th word reads more naturally.
  if (ws.length >= 8 && rng() < 0.5) {
    const at = randInt(rng, 2, ws.length - 4);
    ws[at] += ',';
  }
  return capitalize(ws.join(' ')) + '.';
}

/** The generated pieces (paragraphs, list items, or a single block) before formatting. */
export function generateBlocks(o: Omit<LoremOptions, 'format'>): string[] {
  const rng = seededRng(o.seed);
  const list = o.words === 'english' ? ENGLISH_WORDS : LOREM_WORDS;
  const count = Math.max(0, Math.min(LIMITS[o.unit], Math.floor(o.count) || 0));
  if (count === 0) return [];
  const classic = o.startWithLorem && o.words === 'lorem';

  switch (o.unit) {
    case 'words': {
      const ws = words(rng, list, count);
      if (classic) CLASSIC_START.replace(',', '').toLowerCase().split(' ').slice(0, count).forEach((w, i) => (ws[i] = w));
      return [capitalize(ws.join(' ')) + '.'];
    }
    case 'sentences': {
      const ss = Array.from({ length: count }, () => sentence(rng, list));
      if (classic) ss[0] = CLASSIC_START + '.';
      return [ss.join(' ')];
    }
    case 'list': {
      const items = Array.from({ length: count }, () => capitalize(words(rng, list, randInt(rng, 2, 7)).join(' ')));
      if (classic) items[0] = 'Lorem ipsum dolor sit amet';
      return items;
    }
    case 'paragraphs': {
      const ps = Array.from({ length: count }, () => Array.from({ length: randInt(rng, 3, 7) }, () => sentence(rng, list)));
      if (classic) ps[0][0] = CLASSIC_START + ', sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
      return ps.map((p) => p.join(' '));
    }
  }
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function formatBlocks(blocks: string[], unit: Unit, format: Format): string {
  if (!blocks.length) return '';
  if (unit === 'list') {
    if (format === 'html') return `<ul>\n${blocks.map((b) => `  <li>${escapeHtml(b)}</li>`).join('\n')}\n</ul>`;
    if (format === 'markdown') return blocks.map((b) => `- ${b}`).join('\n');
    return blocks.join('\n');
  }
  if (format === 'html') return blocks.map((b) => `<p>${escapeHtml(b)}</p>`).join('\n');
  return blocks.join('\n\n');
}

export function generateLorem(o: LoremOptions): string {
  return formatBlocks(generateBlocks(o), o.unit, o.format);
}

export function countWords(text: string): number {
  return (text.replace(/<[^>]+>/g, ' ').match(/[A-Za-z]+/g) ?? []).length;
}
