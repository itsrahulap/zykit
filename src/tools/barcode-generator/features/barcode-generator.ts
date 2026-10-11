// Linear barcode encoders (Code 128 A/B/C, Code 39, EAN-13, EAN-8, UPC-A, ITF-14) and a layout
// that both the SVG output and the canvas PNG draw from. Pure functions, no DOM.

export type BarcodeType = 'code128' | 'code39' | 'ean13' | 'ean8' | 'upca' | 'itf14';
export type Code128Set = 'auto' | 'A' | 'B' | 'C';

export class BarcodeError extends Error {}

/** Encoded symbol: `bits` is one char per module ('1' bar, '0' space); `label` the human-readable parts. */
export interface Encoded {
  bits: string;
  /** Text under the bars, as [text, startModule, widthInModules] groups. */
  label: { text: string; start: number; width: number }[];
  /** Text drawn in the left quiet zone (first digit of EAN-13 / UPC-A) and right (UPC-A check digit). */
  outer?: { left?: string; right?: string };
  /** The full data including any check digit. */
  data: string;
  checkDigit?: string;
}

// ---- Code 128 ---------------------------------------------------------------------------------

// Bar/space widths for symbol values 0–106 (106 = stop, 7 elements). Starts: 103 A, 104 B, 105 C.
const C128 =
  '212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112'.split(' ');
export const CODE128_PATTERNS = C128;

const START = { A: 103, B: 104, C: 105 } as const;
const CODE = { A: 101, B: 100, C: 99 } as const; // "switch to set" symbols

const isDigit = (c: string) => c >= '0' && c <= '9';

/** Cheapest symbol sequence for `text` (dynamic programming over code sets), or one forced set. */
export function code128Values(text: string, set: Code128Set = 'auto'): number[] {
  if (!text) throw new BarcodeError('Enter some text to encode.');
  for (const ch of text) if (ch.charCodeAt(0) > 127) throw new BarcodeError(`Code 128 only encodes ASCII characters; “${ch}” is not supported.`);
  const n = text.length;
  const sets = ['B', 'A', 'C'] as const; // order breaks ties: prefer B
  const can = (s: 'A' | 'B' | 'C', i: number): number => {
    const code = text.charCodeAt(i);
    if (s === 'A') return code < 96 ? 1 : 0;
    if (s === 'B') return code >= 32 ? 1 : 0;
    return isDigit(text[i]) && i + 1 < n && isDigit(text[i + 1]) ? 2 : 0;
  };
  const value = (s: 'A' | 'B' | 'C', i: number) => {
    const code = text.charCodeAt(i);
    if (s === 'C') return Number(text.slice(i, i + 2));
    return s === 'A' ? (code < 32 ? code + 64 : code - 32) : code - 32;
  };
  const allowed = set === 'auto' ? sets : [set];
  if (set === 'C' && (n % 2 || !/^\d+$/.test(text))) throw new BarcodeError('Code set C needs an even number of digits only.');
  if (set === 'A' || set === 'B') for (let i = 0; i < n; i++) if (!can(set, i)) throw new BarcodeError(`Character “${text[i]}” cannot be encoded in code set ${set}.`);
  // best[i][s] = fewest symbols to encode text[0..i) ending in set s (start symbol counted).
  const INF = 1e9;
  const best = Array.from({ length: n + 1 }, () => ({ A: INF, B: INF, C: INF }));
  const from = Array.from({ length: n + 1 }, () => ({ A: '', B: '', C: '' }) as Record<'A' | 'B' | 'C', string>);
  for (const s of allowed) best[0][s] = 1;
  for (let i = 0; i < n; i++)
    for (const s of allowed) {
      const cur = best[i][s];
      if (cur >= INF) continue;
      for (const t of allowed) {
        const step = can(t, i);
        if (!step) continue;
        const cost = cur + (t === s ? 0 : 1) + 1;
        if (cost < best[i + step][t]) {
          best[i + step][t] = cost;
          from[i + step][t] = `${s}${i}`;
        }
      }
    }
  const end = allowed.filter((s) => best[n][s] < INF).sort((a, b) => best[n][a] - best[n][b])[0];
  if (!end) throw new BarcodeError('This text cannot be encoded as Code 128.');
  const rev: { s: 'A' | 'B' | 'C'; i: number; prev: 'A' | 'B' | 'C' }[] = [];
  for (let i = n, s: 'A' | 'B' | 'C' = end; i > 0; ) {
    const f = from[i][s];
    const prev = f[0] as 'A' | 'B' | 'C';
    const j = Number(f.slice(1));
    rev.push({ s, i: j, prev });
    i = j;
    s = prev;
  }
  rev.reverse();
  // The start set is the set the first step came from; later switches add a CODE symbol.
  const out: number[] = [START[rev[0].prev]];
  for (const st of rev) {
    if (st.prev !== st.s) out.push(CODE[st.s]);
    out.push(value(st.s, st.i));
  }
  return out;
}

export function code128(text: string, set: Code128Set = 'auto'): Encoded {
  const values = code128Values(text, set);
  const check = values.reduce((sum, v, i) => sum + v * (i === 0 ? 1 : i), 0) % 103;
  const all = [...values, check, 106];
  const bits = all.map(patternBits).join('');
  const shown = [...text].map((c) => (c.charCodeAt(0) < 32 || c === '\x7f' ? ' ' : c)).join('');
  return { bits, label: [{ text: shown, start: 0, width: bits.length }], data: text, checkDigit: String(check) };
}

/** '212222' → '11' + '00' + '1' + '00' + '1'... starting with a bar. */
function patternBits(p: string | number): string {
  const pattern = typeof p === 'number' ? C128[p] : p;
  return [...pattern].map((w, i) => (i % 2 === 0 ? '1' : '0').repeat(Number(w))).join('');
}

// ---- Code 39 ----------------------------------------------------------------------------------

export const CODE39_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
// n = narrow, w = wide; elements alternate bar, space, bar, … (9 per character), same order as CODE39_CHARS then '*'.
const C39 =
  'nnnwwnwnn wnnwnnnnw nnwwnnnnw wnwwnnnnn nnnwwnnnw wnnwwnnnn nnwwwnnnn nnnwnnwnw wnnwnnwnn nnwwnnwnn wnnnnwnnw nnwnnwnnw wnwnnwnnn nnnnwwnnw wnnnwwnnn nnwnwwnnn nnnnnwwnw wnnnnwwnn nnwnnwwnn nnnnwwwnn wnnnnnnww nnwnnnnww wnwnnnnwn nnnnwnnww wnnnwnnwn nnwnwnnwn nnnnnnwww wnnnnnwwn nnwnnnwwn nnnnwnwwn wwnnnnnnw nwwnnnnnw wwwnnnnnn nwnnwnnnw wwnnwnnnn nwwnwnnnn nwnnnnwnw wwnnnnwnn nwwnnnwnn nwnwnwnnn nwnwnnnwn nwnnnwnwn nnnwnwnwn nwnnwnwnn'.split(' ');
export const CODE39_PATTERNS = C39;

export function code39(text: string, checkDigit = false): Encoded {
  const t = text.toUpperCase();
  if (!t) throw new BarcodeError('Enter some text to encode.');
  for (const ch of t) if (!CODE39_CHARS.includes(ch)) throw new BarcodeError(`Code 39 cannot encode “${ch}”. Use A–Z, 0–9, space and - . $ / + %.`);
  let data = t;
  let check: string | undefined;
  if (checkDigit) {
    check = CODE39_CHARS[[...t].reduce((s, c) => s + CODE39_CHARS.indexOf(c), 0) % 43];
    data += check;
  }
  const enc = (ch: string) =>
    [...C39[ch === '*' ? 43 : CODE39_CHARS.indexOf(ch)]].map((w, i) => (i % 2 === 0 ? '1' : '0').repeat(w === 'w' ? 3 : 1)).join('');
  const bits = ['*', ...data, '*'].map(enc).join('0');
  return { bits, label: [{ text: `*${data}*`, start: 0, width: bits.length }], data, checkDigit: check };
}

// ---- EAN / UPC --------------------------------------------------------------------------------

const L_CODES = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const flip = (s: string) => [...s].map((c) => (c === '1' ? '0' : '1')).join('');
const R_CODES = L_CODES.map(flip);
const G_CODES = R_CODES.map((s) => [...s].reverse().join(''));
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

/** GS1 mod-10 check digit for the digits before it (weights 3,1,3,1… from the right). */
export function gs1CheckDigit(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += Number(body[body.length - 1 - i]) * (i % 2 === 0 ? 3 : 1);
  return String((10 - (sum % 10)) % 10);
}

/** Validates digits-only input of `len` (check digit included) or `len - 1` (added for you). */
function withCheck(text: string, len: number, name: string): { full: string; added: boolean } {
  const t = text.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(t)) throw new BarcodeError(`${name} uses digits only.`);
  if (t.length !== len && t.length !== len - 1) throw new BarcodeError(`${name} needs ${len - 1} digits (the check digit is added) or ${len} (it is verified); you entered ${t.length}.`);
  const expected = gs1CheckDigit(t.slice(0, len - 1));
  if (t.length === len) {
    if (t[len - 1] !== expected) throw new BarcodeError(`The check digit is ${t[len - 1]} but should be ${expected}.`);
    return { full: t, added: false };
  }
  return { full: t + expected, added: true };
}

function ean13Bits(d: string): string {
  const parity = PARITY[Number(d[0])];
  let left = '';
  for (let i = 0; i < 6; i++) left += (parity[i] === 'L' ? L_CODES : G_CODES)[Number(d[i + 1])];
  const right = [...d.slice(7)].map((c) => R_CODES[Number(c)]).join('');
  return `101${left}01010${right}101`;
}

export function ean13(text: string): Encoded {
  const { full } = withCheck(text, 13, 'EAN-13');
  const bits = ean13Bits(full);
  return {
    bits,
    data: full,
    checkDigit: full[12],
    outer: { left: full[0] },
    label: [
      { text: full.slice(1, 7), start: 3, width: 42 },
      { text: full.slice(7), start: 50, width: 42 },
    ],
  };
}

export function ean8(text: string): Encoded {
  const { full } = withCheck(text, 8, 'EAN-8');
  const l = [...full.slice(0, 4)].map((c) => L_CODES[Number(c)]).join('');
  const r = [...full.slice(4)].map((c) => R_CODES[Number(c)]).join('');
  return {
    bits: `101${l}01010${r}101`,
    data: full,
    checkDigit: full[7],
    label: [
      { text: full.slice(0, 4), start: 3, width: 28 },
      { text: full.slice(4), start: 36, width: 28 },
    ],
  };
}

/** UPC-A is EAN-13 with a leading 0; the symbol is identical. */
export function upca(text: string): Encoded {
  const { full } = withCheck(text, 12, 'UPC-A');
  return {
    bits: ean13Bits(`0${full}`),
    data: full,
    checkDigit: full[11],
    outer: { left: full[0], right: full[11] },
    label: [
      { text: full.slice(1, 6), start: 10, width: 35 },
      { text: full.slice(6, 11), start: 50, width: 35 },
    ],
  };
}

// ---- ITF-14 -----------------------------------------------------------------------------------

const ITF = ['nnwwn', 'wnnnw', 'nwnnw', 'wwnnn', 'nnwnw', 'wnwnn', 'nwwnn', 'nnnww', 'wnnwn', 'nwnwn'];

export function itf14(text: string): Encoded {
  const { full } = withCheck(text, 14, 'ITF-14');
  let bits = '1010';
  for (let i = 0; i < 14; i += 2) {
    const bars = ITF[Number(full[i])];
    const spaces = ITF[Number(full[i + 1])];
    for (let k = 0; k < 5; k++) bits += '1'.repeat(bars[k] === 'w' ? 3 : 1) + '0'.repeat(spaces[k] === 'w' ? 3 : 1);
  }
  bits += '11101';
  const text14 = `${full[0]} ${full.slice(1, 3)} ${full.slice(3, 8)} ${full.slice(8, 13)} ${full[13]}`;
  return { bits, data: full, checkDigit: full[13], label: [{ text: text14, start: 0, width: bits.length }] };
}

export const TYPES: { value: BarcodeType; label: string; hint: string }[] = [
  { value: 'code128', label: 'Code 128', hint: 'Any ASCII text. Letters, digits and punctuation; digit runs are packed.' },
  { value: 'code39', label: 'Code 39', hint: 'Upper-case letters, digits, space and - . $ / + %.' },
  { value: 'ean13', label: 'EAN-13', hint: '12 digits (check digit added) or 13 digits (checked).' },
  { value: 'ean8', label: 'EAN-8', hint: '7 digits (check digit added) or 8 digits (checked).' },
  { value: 'upca', label: 'UPC-A', hint: '11 digits (check digit added) or 12 digits (checked).' },
  { value: 'itf14', label: 'ITF-14', hint: '13 digits (check digit added) or 14 digits (checked), for cartons.' },
];

export interface EncodeOptions {
  code128Set: Code128Set;
  code39Check: boolean;
}

export function encode(type: BarcodeType, text: string, o: EncodeOptions = { code128Set: 'auto', code39Check: false }): Encoded {
  switch (type) {
    case 'code128':
      return code128(text, o.code128Set);
    case 'code39':
      return code39(text, o.code39Check);
    case 'ean13':
      return ean13(text);
    case 'ean8':
      return ean8(text);
    case 'upca':
      return upca(text);
    case 'itf14':
      return itf14(text);
  }
}

// ---- Layout and output ------------------------------------------------------------------------

export interface LayoutOptions {
  /** Pixels per module (the narrowest bar). */
  moduleWidth: number;
  /** Bar height in px. */
  height: number;
  /** Quiet zone each side, in modules. */
  quiet: number;
  showText: boolean;
  fontSize: number;
  fg: string;
  bg: string;
}

export const FONT = 'ui-monospace, Menlo, Consolas, "Courier New", monospace';

export interface Layout {
  width: number;
  height: number;
  /** Merged bar runs. */
  bars: { x: number; w: number }[];
  barHeight: number;
  texts: { text: string; x: number; y: number; anchor: 'start' | 'middle' | 'end' }[];
}

export function layout(e: Encoded, o: LayoutOptions): Layout {
  const mw = o.moduleWidth;
  const bars: Layout['bars'] = [];
  for (let i = 0; i < e.bits.length; ) {
    let j = i;
    while (j < e.bits.length && e.bits[j] === e.bits[i]) j++;
    if (e.bits[i] === '1') bars.push({ x: (o.quiet + i) * mw, w: (j - i) * mw });
    i = j;
  }
  const textH = o.showText ? o.fontSize + 6 : 0;
  const width = (e.bits.length + o.quiet * 2) * mw;
  const texts: Layout['texts'] = [];
  if (o.showText) {
    const y = o.height + o.fontSize + 2;
    for (const g of e.label) texts.push({ text: g.text, x: (o.quiet + g.start + g.width / 2) * mw, y, anchor: 'middle' });
    if (e.outer?.left) texts.push({ text: e.outer.left, x: (o.quiet - 1) * mw, y, anchor: 'end' });
    if (e.outer?.right) texts.push({ text: e.outer.right, x: (o.quiet + e.bits.length + 1) * mw, y, anchor: 'start' });
  }
  return { width, height: o.height + textH, bars, barHeight: o.height, texts };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const isHexColor = (s: string) => /^#[0-9a-f]{6}$/i.test(s);

export function toSvg(l: Layout, o: Pick<LayoutOptions, 'fg' | 'bg' | 'fontSize'>): string {
  if (!isHexColor(o.fg) || !isHexColor(o.bg)) throw new BarcodeError('Colours must be #rrggbb.');
  const d = l.bars.map((b) => `M${b.x} 0h${b.w}v${l.barHeight}h-${b.w}z`).join('');
  const text = l.texts
    .map((t) => `<text x="${t.x}" y="${t.y}" text-anchor="${t.anchor}" font-family="${esc(FONT)}" font-size="${o.fontSize}" fill="${o.fg}">${esc(t.text)}</text>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${l.width}" height="${l.height}" viewBox="0 0 ${l.width} ${l.height}"><rect width="${l.width}" height="${l.height}" fill="${o.bg}"/><path d="${d}" fill="${o.fg}" shape-rendering="crispEdges"/>${text}</svg>`;
}

export function drawToCanvas(ctx: CanvasRenderingContext2D, l: Layout, o: Pick<LayoutOptions, 'fg' | 'bg' | 'fontSize'>) {
  ctx.fillStyle = o.bg;
  ctx.fillRect(0, 0, l.width, l.height);
  ctx.fillStyle = o.fg;
  for (const b of l.bars) ctx.fillRect(b.x, 0, b.w, l.barHeight);
  ctx.font = `${o.fontSize}px ${FONT}`;
  for (const t of l.texts) {
    ctx.textAlign = t.anchor === 'middle' ? 'center' : t.anchor === 'end' ? 'right' : 'left';
    ctx.fillText(t.text, t.x, t.y);
  }
}
