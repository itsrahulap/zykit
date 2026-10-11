// QR Code decoder for clean, roughly axis-aligned images (ISO/IEC 18004 model 2). Pure functions
// on a luminance array, no DOM. Reuses the generator's tables for capacity, masks and format bits.

import { ECC_LEVELS, MASKS, dataCodewords, formatBits, functionMask, rawDataModules, type Ecc } from '../../qr-code-generator/features/qr';

export class DecodeError extends Error {}

export interface Decoded {
  text: string;
  version: number;
  ecc: Ecc;
  mask: number;
  /** Codewords the Reed–Solomon step had to repair. */
  corrected: number;
}

// Blocks per version, index [ecc L,M,Q,H][version]. Same standard table the encoder holds privately.
const BLOCKS: number[][] = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

// ---- GF(256) and Reed–Solomon correction ------------------------------------------------------

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
const div = (a: number, b: number) => (a ? EXP[(LOG[a] + 255 - LOG[b]) % 255] : 0);

/** Corrects `block` (data then ECC bytes) in place; returns the number of repaired bytes or null if unrecoverable. */
export function rsCorrect(block: number[], eccLen: number): number | null {
  const n = block.length;
  // Syndromes S_i = r(alpha^i); the encoder's generator has roots alpha^0 … alpha^(eccLen-1).
  const synd: number[] = [];
  let clean = true;
  for (let i = 0; i < eccLen; i++) {
    let s = 0;
    for (const b of block) s = mul(s, EXP[i]) ^ b;
    synd.push(s);
    if (s) clean = false;
  }
  if (clean) return 0;
  // Berlekamp–Massey for the error locator polynomial (coefficients low to high).
  let loc = [1];
  let old = [1];
  let L = 0;
  let m = 1;
  let b = 1;
  for (let i = 0; i < eccLen; i++) {
    let d = synd[i];
    for (let j = 1; j <= L; j++) d ^= mul(loc[j] ?? 0, synd[i - j]);
    if (d === 0) {
      m++;
    } else if (2 * L <= i) {
      const t = loc.slice();
      const coef = div(d, b);
      while (loc.length < old.length + m) loc.push(0);
      old.forEach((o, k) => (loc[k + m] ^= mul(coef, o)));
      L = i + 1 - L;
      old = t;
      b = d;
      m = 1;
    } else {
      const coef = div(d, b);
      while (loc.length < old.length + m) loc.push(0);
      old.forEach((o, k) => (loc[k + m] ^= mul(coef, o)));
      m++;
    }
  }
  if (L * 2 > eccLen) return null;
  // Chien search: position p (from the end of the block) is bad when loc(alpha^-p) = 0.
  const positions: number[] = [];
  for (let p = 0; p < n; p++) {
    let v = 0;
    for (let k = 0; k < loc.length; k++) v ^= mul(loc[k], EXP[(255 - ((p * k) % 255)) % 255]);
    if (v === 0) positions.push(p);
  }
  if (positions.length !== L) return null;
  // Forney: error magnitudes from the evaluator omega = S(x)·loc(x) mod x^eccLen.
  const omega: number[] = new Array<number>(eccLen).fill(0);
  for (let i = 0; i < eccLen; i++) for (let j = 0; j < loc.length && i + j < eccLen; j++) omega[i + j] ^= mul(synd[i], loc[j]);
  for (const p of positions) {
    const xInv = EXP[(255 - (p % 255)) % 255];
    let num = 0;
    for (let k = omega.length - 1; k >= 0; k--) num = mul(num, xInv) ^ omega[k];
    let den = 0; // formal derivative of loc evaluated at xInv (odd terms only)
    for (let k = 1; k < loc.length; k += 2) den ^= mul(loc[k], EXP[(LOG[xInv] * (k - 1)) % 255]);
    if (!den) return null;
    // Syndromes start at alpha^0, so the magnitude is X^1 · omega / loc'.
    block[n - 1 - p] ^= mul(EXP[p % 255], div(num, den));
  }
  // Verify: all syndromes must now vanish.
  for (let i = 0; i < eccLen; i++) {
    let s = 0;
    for (const x of block) s = mul(s, EXP[i]) ^ x;
    if (s) return null;
  }
  return positions.length;
}

// ---- Binarising and locating the symbol -------------------------------------------------------

/** Otsu threshold on a 0–255 luminance array. */
export function otsu(lum: ArrayLike<number>): number {
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < lum.length; i++) hist[lum[i]]++;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let wB = 0;
  let sB = 0;
  let best = 0;
  let thr = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = lum.length - wB;
    if (!wF) break;
    sB += t * hist[t];
    const between = wB * wF * (sB / wB - (sum - sB) / wF) ** 2;
    if (between > best) {
      best = between;
      thr = t;
    }
  }
  return thr;
}

interface Finder {
  x: number;
  y: number;
  size: number;
  hits: number;
}

/** Run lengths of a line: [startIndex, length, isDark][] */
function runs(get: (i: number) => boolean, n: number) {
  const out: { start: number; len: number; dark: boolean }[] = [];
  let start = 0;
  for (let i = 1; i <= n; i++) {
    if (i === n || get(i) !== get(start)) {
      out.push({ start, len: i - start, dark: get(start) });
      start = i;
    }
  }
  return out;
}

/** Does a 1:1:3:1:1 pattern fit these five run lengths? Returns the module size or 0. */
function ratioFits(l: number[]): number {
  const total = l.reduce((a, b) => a + b, 0);
  const m = total / 7;
  if (m < 1) return 0;
  const tol = m / 2 + 0.01;
  const want = [1, 1, 3, 1, 1];
  return l.every((v, i) => Math.abs(v - want[i] * m) <= want[i] * tol) ? m : 0;
}

export function findFinders(bin: Uint8Array, w: number, h: number): Finder[] {
  const found: Finder[] = [];
  const add = (x: number, y: number, size: number) => {
    const f = found.find((c) => Math.hypot(c.x - x, c.y - y) < Math.max(size, c.size) * 2);
    if (f) {
      f.x = (f.x * f.hits + x) / (f.hits + 1);
      f.y = (f.y * f.hits + y) / (f.hits + 1);
      f.size = (f.size * f.hits + size) / (f.hits + 1);
      f.hits++;
    } else found.push({ x, y, size, hits: 1 });
  };
  for (let y = 0; y < h; y++) {
    const rs = runs((i) => bin[y * w + i] === 1, w);
    for (let i = 0; i + 4 < rs.length; i++) {
      if (!rs[i].dark) continue;
      const five = rs.slice(i, i + 5);
      const m = ratioFits(five.map((r) => r.len));
      if (!m) continue;
      const cx = five[2].start + five[2].len / 2;
      // Confirm vertically through the centre column.
      const col = runs((j) => bin[j * w + Math.floor(cx)] === 1, h);
      const k = col.findIndex((r) => r.dark && r.start <= y && y < r.start + r.len);
      if (k < 2 || k + 2 >= col.length) continue;
      const vm = ratioFits(col.slice(k - 2, k + 3).map((r) => r.len));
      if (!vm || Math.abs(vm - m) > m) continue;
      add(cx, col[k].start + col[k].len / 2, (m + vm) / 2);
    }
  }
  return found.filter((f) => f.hits >= 2).sort((a, b) => b.hits - a.hits);
}

interface Pt {
  x: number;
  y: number;
}

/** Samples the module grid with an affine map from the three finder centres. Returns null when they don't form a QR layout. */
export function sampleGrid(bin: Uint8Array, w: number, h: number, f: Finder[]): { modules: boolean[][]; version: number }[] {
  const out: { modules: boolean[][]; version: number }[] = [];
  const top = f.slice(0, 6);
  for (let a = 0; a < top.length; a++)
    for (let b = a + 1; b < top.length; b++)
      for (let c = b + 1; c < top.length; c++) {
        const t = [top[a], top[b], top[c]];
        // The corner finder is opposite the longest side.
        const d = (p: Pt, q: Pt) => Math.hypot(p.x - q.x, p.y - q.y);
        const sides = [d(t[1], t[2]), d(t[0], t[2]), d(t[0], t[1])];
        const tl = t[sides.indexOf(Math.max(...sides))];
        const [p, q] = t.filter((x) => x !== tl);
        const cross = (p.x - tl.x) * (q.y - tl.y) - (p.y - tl.y) * (q.x - tl.x);
        const tr = cross > 0 ? p : q;
        const bl = cross > 0 ? q : p;
        const mod = (tl.size + tr.size + bl.size) / 3;
        const dTr = d(tl, tr);
        const dBl = d(tl, bl);
        if (Math.abs(dTr - dBl) > Math.max(dTr, dBl) * 0.2) continue;
        const dim = Math.round((dTr / mod + dBl / mod) / 2) + 7;
        const version = (dim - 17) / 4;
        if (!Number.isInteger(version) || version < 1 || version > 40) continue;
        const step = (dim - 7) / 1;
        const ux = (tr.x - tl.x) / step;
        const uy = (tr.y - tl.y) / step;
        const vx = (bl.x - tl.x) / step;
        const vy = (bl.y - tl.y) / step;
        const modules: boolean[][] = [];
        for (let my = 0; my < dim; my++) {
          const row: boolean[] = [];
          for (let mx = 0; mx < dim; mx++) {
            const x = Math.round(tl.x + (mx - 3) * ux + (my - 3) * vx);
            const y = Math.round(tl.y + (mx - 3) * uy + (my - 3) * vy);
            row.push(x >= 0 && y >= 0 && x < w && y < h && bin[y * w + x] === 1);
          }
          modules.push(row);
        }
        out.push({ modules, version });
      }
  return out;
}

// ---- Reading the matrix -----------------------------------------------------------------------

const popcount = (x: number) => {
  let n = 0;
  for (; x; x &= x - 1) n++;
  return n;
};

function readFormat(m: boolean[][]): { ecc: Ecc; mask: number } | null {
  const n = m.length;
  const bitAt = (pts: [number, number][]) => pts.reduce((v, [x, y], i) => v | ((m[y][x] ? 1 : 0) << i), 0);
  const a: [number, number][] = [];
  for (let i = 0; i <= 5; i++) a.push([8, i]);
  a.push([8, 7], [8, 8], [7, 8]);
  for (let i = 9; i < 15; i++) a.push([14 - i, 8]);
  const b: [number, number][] = [];
  for (let i = 0; i < 8; i++) b.push([n - 1 - i, 8]);
  for (let i = 8; i < 15; i++) b.push([8, n - 15 + i]);
  const raws = [bitAt(a), bitAt(b)];
  let best: { ecc: Ecc; mask: number; dist: number } | null = null;
  for (const raw of raws)
    for (const ecc of ECC_LEVELS)
      for (let mask = 0; mask < 8; mask++) {
        const dist = popcount(raw ^ formatBits(ecc, mask));
        if (dist <= 3 && (!best || dist < best.dist)) best = { ecc, mask, dist };
      }
  return best;
}

const ALNUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

function parseSegments(data: number[], version: number): string {
  const bits: number[] = [];
  for (const b of data) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  let pos = 0;
  const read = (n: number) => {
    if (pos + n > bits.length) throw new DecodeError('The data ended unexpectedly.');
    let v = 0;
    for (let i = 0; i < n; i++) v = (v << 1) | bits[pos++];
    return v;
  };
  const cc = (a: number, b: number, c: number) => (version < 10 ? a : version < 27 ? b : c);
  let text = '';
  const bytes: number[] = [];
  const flush = () => {
    if (!bytes.length) return;
    const u = Uint8Array.from(bytes);
    try {
      text += new TextDecoder('utf-8', { fatal: true }).decode(u);
    } catch {
      text += new TextDecoder('iso-8859-1').decode(u);
    }
    bytes.length = 0;
  };
  while (bits.length - pos >= 4) {
    const mode = read(4);
    if (mode === 0) break;
    if (mode === 1) {
      flush();
      let n = read(cc(10, 12, 14));
      for (; n >= 3; n -= 3) text += String(read(10)).padStart(3, '0');
      if (n === 2) text += String(read(7)).padStart(2, '0');
      else if (n === 1) text += String(read(4));
    } else if (mode === 2) {
      flush();
      let n = read(cc(9, 11, 13));
      while (n >= 2) {
        const v = read(11);
        text += ALNUM[Math.floor(v / 45)] + ALNUM[v % 45];
        n -= 2;
      }
      if (n === 1) text += ALNUM[read(6)];
    } else if (mode === 4) {
      for (let n = read(cc(8, 16, 16)); n > 0; n--) bytes.push(read(8));
    } else if (mode === 7) {
      // ECI designator: 1–3 bytes, length given by the leading bits. Text is still decoded as UTF-8.
      const lead = read(2); // 0x = 1 byte, 10 = 2 bytes, 11 = 3 bytes (bit counts include the leading bit)
      read(lead < 2 ? 6 : lead === 2 ? 14 : 22);
    } else throw new DecodeError('This QR code uses a data mode (Kanji, structured append or FNC1) that this reader does not support.');
  }
  flush();
  return text;
}

/** Decodes a sampled module matrix (true = dark). Throws DecodeError. */
export function decodeMatrix(m: boolean[][]): Decoded {
  const n = m.length;
  const version = (n - 17) / 4;
  const fmt = readFormat(m);
  if (!fmt) throw new DecodeError('The format information is unreadable.');
  const isFn = functionMask(version);
  const bits: number[] = [];
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < n; vert++)
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? n - 1 - vert : vert;
        if (!isFn[y][x]) bits.push(m[y][x] !== MASKS[fmt.mask](x, y) ? 1 : 0);
      }
  }
  const raw = Math.floor(rawDataModules(version) / 8);
  const e = ECC_LEVELS.indexOf(fmt.ecc);
  const nb = BLOCKS[e][version];
  const eccLen = (raw - dataCodewords(version, fmt.ecc)) / nb;
  const words: number[] = [];
  for (let i = 0; i < raw; i++) {
    let v = 0;
    for (let k = 0; k < 8; k++) v = (v << 1) | bits[i * 8 + k];
    words.push(v);
  }
  // De-interleave: short blocks have one fewer data byte.
  const short = nb - (raw % nb);
  const shortLen = Math.floor(raw / nb);
  const blocks: number[][] = Array.from({ length: nb }, () => []);
  let k = 0;
  for (let i = 0; i < shortLen - eccLen + 1; i++) for (let j = 0; j < nb; j++) if (i < shortLen - eccLen || j >= short) blocks[j].push(words[k++]);
  for (let i = 0; i < eccLen; i++) for (let j = 0; j < nb; j++) blocks[j].push(words[k++]);
  let corrected = 0;
  const data: number[] = [];
  for (const blk of blocks) {
    const c = rsCorrect(blk, eccLen);
    if (c === null) throw new DecodeError('Too much of the code is damaged to repair.');
    corrected += c;
    data.push(...blk.slice(0, blk.length - eccLen));
  }
  return { text: parseSegments(data, version), version, ecc: fmt.ecc, mask: fmt.mask, corrected };
}

/** Finds and decodes a QR code in RGBA pixels. Tries dark-on-light, then inverted. */
export function decodeQrPixels(rgba: Uint8ClampedArray, w: number, h: number): Decoded {
  const lum = new Uint8Array(w * h);
  for (let i = 0; i < lum.length; i++) lum[i] = (rgba[i * 4] * 77 + rgba[i * 4 + 1] * 150 + rgba[i * 4 + 2] * 29) >> 8;
  const thr = otsu(lum);
  let last: DecodeError = new DecodeError('No QR code found in this image.');
  for (const invert of [false, true]) {
    const bin = new Uint8Array(w * h);
    for (let i = 0; i < bin.length; i++) bin[i] = (lum[i] <= thr) !== invert ? 1 : 0;
    const finders = findFinders(bin, w, h);
    if (finders.length < 3) continue;
    for (const g of sampleGrid(bin, w, h, finders)) {
      try {
        return decodeMatrix(g.modules);
      } catch (e) {
        if (e instanceof DecodeError) last = e;
        else throw e;
      }
    }
  }
  throw last;
}
