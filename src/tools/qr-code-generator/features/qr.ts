// QR Code encoder (ISO/IEC 18004:2015, model 2): numeric, alphanumeric and byte modes,
// versions 1–40, error correction L/M/Q/H, Reed–Solomon over GF(256), all 8 masks with the
// standard penalty rules, and format/version information. No decoding, no DOM.

export type Ecc = 'L' | 'M' | 'Q' | 'H';
export type Mode = 'numeric' | 'alphanumeric' | 'byte';

export const ECC_LEVELS: Ecc[] = ['L', 'M', 'Q', 'H'];
const ECC_INDEX: Record<Ecc, number> = { L: 0, M: 1, Q: 2, H: 3 };
/** The 2-bit format code for each level (note: not in L/M/Q/H order). */
const ECC_FORMAT_BITS: Record<Ecc, number> = { L: 1, M: 0, Q: 3, H: 2 };

// Index [ecc][version]; version 0 is unused.
const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];
const NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

export const ALPHANUMERIC_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

export class QrError extends Error {}

// ---- Capacity ---------------------------------------------------------------------------

/** Data + ECC modules available in a version, after function patterns (in bits). */
export function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

/** Data codewords (bytes) available for a version and ECC level. */
export function dataCodewords(version: number, ecc: Ecc): number {
  const e = ECC_INDEX[ecc];
  return Math.floor(rawDataModules(version) / 8) - ECC_CODEWORDS_PER_BLOCK[e][version] * NUM_ERROR_CORRECTION_BLOCKS[e][version];
}

export function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const size = version * 4 + 17;
  const numAlign = Math.floor(version / 7) + 2;
  const step = Math.floor((version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
  return result;
}

// ---- Data encoding -------------------------------------------------------------------------

class BitBuffer {
  bits: number[] = [];
  push(value: number, len: number) {
    if (len < 0 || len > 31 || value >>> len !== 0) throw new RangeError('Value out of range');
    for (let i = len - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
  }
}

export function chooseMode(text: string): Mode {
  if (/^\d*$/.test(text)) return 'numeric';
  if ([...text].every((c) => ALPHANUMERIC_CHARSET.includes(c))) return 'alphanumeric';
  return 'byte';
}

const MODE_BITS: Record<Mode, number> = { numeric: 0x1, alphanumeric: 0x2, byte: 0x4 };
function charCountBits(mode: Mode, version: number): number {
  const i = version <= 9 ? 0 : version <= 26 ? 1 : 2;
  return { numeric: [10, 12, 14], alphanumeric: [9, 11, 13], byte: [8, 16, 16] }[mode][i];
}

interface Segment {
  mode: Mode;
  count: number;
  data: BitBuffer;
}

function makeSegment(text: string, mode: Mode): Segment {
  const bb = new BitBuffer();
  if (mode === 'numeric') {
    for (let i = 0; i < text.length; i += 3) {
      const chunk = text.slice(i, i + 3);
      bb.push(Number(chunk), chunk.length * 3 + 1);
    }
    return { mode, count: text.length, data: bb };
  }
  if (mode === 'alphanumeric') {
    let i = 0;
    for (; i + 2 <= text.length; i += 2) bb.push(ALPHANUMERIC_CHARSET.indexOf(text[i]) * 45 + ALPHANUMERIC_CHARSET.indexOf(text[i + 1]), 11);
    if (i < text.length) bb.push(ALPHANUMERIC_CHARSET.indexOf(text[i]), 6);
    return { mode, count: text.length, data: bb };
  }
  const bytes = new TextEncoder().encode(text);
  for (const b of bytes) bb.push(b, 8);
  return { mode, count: bytes.length, data: bb };
}

function segmentBits(seg: Segment, version: number): number | null {
  const ccBits = charCountBits(seg.mode, version);
  if (seg.count >= 1 << ccBits) return null;
  return 4 + ccBits + seg.data.bits.length;
}

/** Data codewords (with mode, count, terminator and padding) for one segment at a version. */
export function encodeData(text: string, version: number, ecc: Ecc, mode: Mode = chooseMode(text)): number[] {
  const seg = makeSegment(text, mode);
  const capacityBits = dataCodewords(version, ecc) * 8;
  const used = segmentBits(seg, version);
  if (used === null || used > capacityBits) throw new QrError('Data too long for this version.');
  const bb = new BitBuffer();
  bb.push(MODE_BITS[seg.mode], 4);
  bb.push(seg.count, charCountBits(seg.mode, version));
  bb.bits.push(...seg.data.bits);
  bb.push(0, Math.min(4, capacityBits - bb.bits.length));
  bb.push(0, (8 - (bb.bits.length % 8)) % 8);
  for (let pad = 0xec; bb.bits.length < capacityBits; pad ^= 0xec ^ 0x11) bb.push(pad, 8);
  const out: number[] = new Array(bb.bits.length / 8).fill(0);
  bb.bits.forEach((b, i) => (out[i >>> 3] |= b << (7 - (i & 7))));
  return out;
}

// ---- Reed–Solomon over GF(2^8) with polynomial x^8 + x^4 + x^3 + x^2 + 1 --------------

function gfMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

export function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

export function rsRemainder(data: readonly number[], divisor: readonly number[]): number[] {
  const result = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => (result[i] ^= gfMultiply(coef, factor)));
  }
  return result;
}

/** Splits data into blocks, adds ECC to each and interleaves them (ISO 18004 §7.6). */
export function addEccAndInterleave(data: readonly number[], version: number, ecc: Ecc): number[] {
  const e = ECC_INDEX[ecc];
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[e][version];
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[e][version];
  const rawCodewords = Math.floor(rawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);
  if (data.length !== dataCodewords(version, ecc)) throw new RangeError('Wrong data length');

  const blocks: number[][] = [];
  const divisor = rsDivisor(blockEccLen);
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
    k += dat.length;
    const eccBytes = rsRemainder(dat, divisor);
    if (i < numShortBlocks) dat.push(0); // placeholder so all blocks have equal length
    blocks.push(dat.concat(eccBytes));
  }
  const result: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
    });
  }
  return result;
}

// ---- Matrix ------------------------------------------------------------------------------

export interface QrCode {
  version: number;
  ecc: Ecc;
  mode: Mode;
  mask: number;
  size: number;
  /** modules[y][x], true = dark. */
  modules: boolean[][];
}

export function formatBits(ecc: Ecc, mask: number): number {
  const data = (ECC_FORMAT_BITS[ecc] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

export function versionBits(version: number): number {
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  return (version << 12) | rem;
}

const bit = (x: number, i: number) => ((x >>> i) & 1) !== 0;

export const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

class Matrix {
  readonly version: number;
  readonly size: number;
  readonly modules: boolean[][];
  readonly isFunction: boolean[][];
  constructor(version: number) {
    this.version = version;
    this.size = version * 4 + 17;
    this.modules = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.isFunction = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
  }
  set(x: number, y: number, dark: boolean) {
    this.modules[y][x] = dark;
    this.isFunction[y][x] = true;
  }

  drawFunctionPatterns() {
    const { size } = this;
    for (let i = 0; i < size; i++) {
      this.set(6, i, i % 2 === 0);
      this.set(i, 6, i % 2 === 0);
    }
    this.drawFinder(3, 3);
    this.drawFinder(size - 4, 3);
    this.drawFinder(3, size - 4);
    const pos = alignmentPositions(this.version);
    const n = pos.length;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) this.set(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    this.drawFormat('L', 0); // reserve the area; real bits are drawn after masking
    this.drawVersion();
  }

  drawFinder(cx: number, cy: number) {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < this.size && y >= 0 && y < this.size) this.set(x, y, d !== 2 && d !== 4);
      }
  }

  drawFormat(ecc: Ecc, mask: number) {
    const bits = formatBits(ecc, mask);
    const { size } = this;
    for (let i = 0; i <= 5; i++) this.set(8, i, bit(bits, i));
    this.set(8, 7, bit(bits, 6));
    this.set(8, 8, bit(bits, 7));
    this.set(7, 8, bit(bits, 8));
    for (let i = 9; i < 15; i++) this.set(14 - i, 8, bit(bits, i));
    for (let i = 0; i < 8; i++) this.set(size - 1 - i, 8, bit(bits, i));
    for (let i = 8; i < 15; i++) this.set(8, size - 15 + i, bit(bits, i));
    this.set(8, size - 8, true); // the "dark module"
  }

  drawVersion() {
    if (this.version < 7) return;
    const bits = versionBits(this.version);
    for (let i = 0; i < 18; i++) {
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.set(a, b, bit(bits, i));
      this.set(b, a, bit(bits, i));
    }
  }

  drawCodewords(data: readonly number[]) {
    const { size } = this;
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++)
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = bit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
          // Remainder bits (0–7) stay light, as initialised.
        }
    }
  }

  applyMask(mask: number) {
    const f = MASKS[mask];
    for (let y = 0; y < this.size; y++)
      for (let x = 0; x < this.size; x++) if (!this.isFunction[y][x] && f(x, y)) this.modules[y][x] = !this.modules[y][x];
  }
}

/** Standard mask penalty (ISO 18004 §7.8.3): runs, 2×2 blocks, finder-like patterns, balance. */
export function penaltyScore(modules: boolean[][]): number {
  const size = modules.length;
  let result = 0;
  const addHistory = (run: number, h: number[]) => {
    if (h[0] === 0) run += size; // light border before the first run
    h.pop();
    h.unshift(run);
  };
  const countPatterns = (h: number[]) => {
    const n = h[1];
    const core = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n;
    return (core && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (core && h[6] >= n * 4 && h[0] >= n ? 1 : 0);
  };
  const terminate = (color: boolean, run: number, h: number[]) => {
    if (color) {
      addHistory(run, h);
      run = 0;
    }
    addHistory(run + size, h);
    return countPatterns(h);
  };
  for (let pass = 0; pass < 2; pass++) {
    for (let a = 0; a < size; a++) {
      let color = false;
      let run = 0;
      const h = [0, 0, 0, 0, 0, 0, 0];
      for (let b = 0; b < size; b++) {
        const m = pass === 0 ? modules[a][b] : modules[b][a];
        if (m === color) {
          run++;
          if (run === 5) result += 3;
          else if (run > 5) result++;
        } else {
          addHistory(run, h);
          if (!color) result += countPatterns(h) * 40;
          color = m;
          run = 1;
        }
      }
      result += terminate(color, run, h) * 40;
    }
  }
  for (let y = 0; y < size - 1; y++)
    for (let x = 0; x < size - 1; x++) {
      const c = modules[y][x];
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) result += 3;
    }
  let dark = 0;
  for (const row of modules) for (const m of row) if (m) dark++;
  const total = size * size;
  const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
  return result + k * 10;
}

export interface EncodeOptions {
  ecc?: Ecc;
  /** Force a version (1–40); by default the smallest that fits. */
  version?: number;
  minVersion?: number;
  /** Force a mask (0–7); by default the one with the lowest penalty. */
  mask?: number;
  mode?: Mode;
}

/** Smallest version (≥ minVersion) that holds the text, or null if it's too long even for 40. */
export function fitVersion(text: string, ecc: Ecc, mode: Mode = chooseMode(text), minVersion = 1): number | null {
  const seg = makeSegment(text, mode);
  for (let v = minVersion; v <= 40; v++) {
    const used = segmentBits(seg, v);
    if (used !== null && used <= dataCodewords(v, ecc) * 8) return v;
  }
  return null;
}

export function encodeQr(text: string, options: EncodeOptions = {}): QrCode {
  const ecc = options.ecc ?? 'M';
  const mode = options.mode ?? chooseMode(text);
  if (mode !== 'byte' && chooseMode(text) === 'byte') throw new QrError(`The text can't be encoded in ${mode} mode.`);
  const version = options.version ?? fitVersion(text, ecc, mode, options.minVersion ?? 1);
  if (version === null) throw new QrError(`Too much data for a QR code at level ${ecc} (max ${maxBytes(ecc)} bytes).`);
  if (!Number.isInteger(version) || version < 1 || version > 40) throw new QrError('Version must be 1–40.');
  const codewords = addEccAndInterleave(encodeData(text, version, ecc, mode), version, ecc);

  const m = new Matrix(version);
  m.drawFunctionPatterns();
  m.drawCodewords(codewords);

  let mask = options.mask ?? -1;
  if (mask < 0) {
    let best = Infinity;
    for (let i = 0; i < 8; i++) {
      m.applyMask(i);
      m.drawFormat(ecc, i);
      const p = penaltyScore(m.modules);
      if (p < best) {
        best = p;
        mask = i;
      }
      m.applyMask(i); // XOR undoes it
    }
  }
  m.applyMask(mask);
  m.drawFormat(ecc, mask);
  return { version, ecc, mode, mask, size: m.size, modules: m.modules };
}

/** Maximum byte-mode payload at version 40 for a level. */
export function maxBytes(ecc: Ecc): number {
  return dataCodewords(40, ecc) - 3; // 4-bit mode + 16-bit count
}

/** Which modules are function patterns (finders, timing, alignment, format/version) for a version. */
export function functionMask(version: number): boolean[][] {
  const m = new Matrix(version);
  m.drawFunctionPatterns();
  return m.isFunction;
}
