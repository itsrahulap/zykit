// Pure logic for the Number Base Converter: arbitrary-size integers (BigInt), two's complement,
// IEEE-754 bit layouts, bitwise operations and character codes. No DOM, so it's unit-testable in Node.

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

export type ParseInt = { ok: true; value: bigint; base: number } | { ok: false; error: string };

const PREFIXES: Record<string, number> = { '0x': 16, '0b': 2, '0o': 8 };

/**
 * Parses an integer in `base` (2–36). `0x`, `0b` and `0o` prefixes are accepted (and with
 * base 'auto' they pick the base; otherwise it's decimal). Spaces, `_` and `,` group separators are ignored.
 */
export function parseInteger(input: string, base: number | 'auto' = 'auto'): ParseInt {
  let s = input.trim().toLowerCase().replace(/[\s_,']/g, '');
  if (!s) return { ok: false, error: 'Enter a number.' };
  let negative = false;
  if (s[0] === '-' || s[0] === '+') {
    negative = s[0] === '-';
    s = s.slice(1);
  }
  let b = base === 'auto' ? 10 : base;
  const prefix = PREFIXES[s.slice(0, 2)];
  if (prefix && (base === 'auto' || base === prefix)) {
    b = prefix;
    s = s.slice(2);
  } else if (base === 16 && s.startsWith('#')) {
    s = s.slice(1);
  }
  if (b < 2 || b > 36 || !Number.isInteger(b)) return { ok: false, error: 'The base must be between 2 and 36.' };
  if (!s) return { ok: false, error: 'Enter some digits after the prefix.' };
  const big = BigInt(b);
  let value = 0n;
  for (let i = 0; i < s.length; i++) {
    const d = DIGITS.indexOf(s[i]);
    if (d < 0 || d >= b) return { ok: false, error: `“${s[i]}” isn't a base-${b} digit (position ${i + 1}).` };
    value = value * big + BigInt(d);
  }
  return { ok: true, value: negative ? -value : value, base: b };
}

export interface FormatOptions {
  group?: boolean;
  upper?: boolean;
}

/** Group size used for each base when grouping digits. */
export const groupSize = (base: number) => (base === 2 || base === 16 ? 4 : 3);

export function groupDigits(digits: string, size: number, sep: string): string {
  const out: string[] = [];
  for (let end = digits.length; end > 0; end -= size) out.unshift(digits.slice(Math.max(0, end - size), end));
  return out.join(sep);
}

export function toBase(value: bigint, base: number, { group = false, upper = false }: FormatOptions = {}): string {
  const neg = value < 0n;
  let s = (neg ? -value : value).toString(base);
  if (upper) s = s.toUpperCase();
  if (group) s = groupDigits(s, groupSize(base), base === 10 ? ',' : ' ');
  return (neg ? '-' : '') + s;
}

/** Minimum number of bits to hold `value` unsigned (or signed, for negatives). */
export function bitLength(value: bigint): number {
  if (value === 0n) return 1;
  if (value < 0n) return (-value - 1n).toString(2).length + 1;
  return value.toString(2).length;
}

export interface TwosComplement {
  bits: number;
  /** False if the value doesn't fit in this width (as signed or unsigned). */
  fits: boolean;
  unsigned: bigint;
  signed: bigint;
  binary: string;
  hex: string;
}

export function twosComplement(value: bigint, bits: number): TwosComplement {
  const min = -(1n << BigInt(bits - 1));
  const max = (1n << BigInt(bits)) - 1n;
  const unsigned = BigInt.asUintN(bits, value);
  return {
    bits,
    fits: value >= min && value <= max,
    unsigned,
    signed: BigInt.asIntN(bits, value),
    binary: groupDigits(unsigned.toString(2).padStart(bits, '0'), 4, ' '),
    hex: unsigned.toString(16).toUpperCase().padStart(bits / 4, '0'),
  };
}

// --- IEEE-754 ------------------------------------------------------------------------------------

export type FloatKind = 'zero' | 'subnormal' | 'normal' | 'infinity' | 'nan';

export interface FloatBits {
  width: 32 | 64;
  sign: string;
  exponent: string;
  mantissa: string;
  hex: string;
  kind: FloatKind;
  /** Unbiased exponent (null for zero, infinity and NaN). */
  exponentValue: number | null;
  /** The stored value (after rounding to this width). */
  value: number;
  /** Exact decimal expansion of the stored value. */
  exact: string;
}

const LAYOUT = { 32: { exp: 8, man: 23, bias: 127 }, 64: { exp: 11, man: 52, bias: 1023 } } as const;

export function floatBits(value: number, width: 32 | 64): FloatBits {
  const buf = new DataView(new ArrayBuffer(8));
  let bits: bigint;
  if (width === 32) {
    buf.setFloat32(0, value);
    bits = BigInt(buf.getUint32(0));
  } else {
    buf.setFloat64(0, value);
    bits = buf.getBigUint64(0);
  }
  return decodeFloatBits(bits, width);
}

/** Decodes raw bits (e.g. from a hex dump) as an IEEE-754 float. */
export function decodeFloatBits(bits: bigint, width: 32 | 64): FloatBits {
  const { exp, man, bias } = LAYOUT[width];
  const all = BigInt.asUintN(width, bits).toString(2).padStart(width, '0');
  const sign = all[0];
  const exponent = all.slice(1, 1 + exp);
  const mantissa = all.slice(1 + exp);
  const e = parseInt(exponent, 2);
  const m = BigInt('0b' + mantissa);
  const maxE = (1 << exp) - 1;
  const kind: FloatKind = e === maxE ? (m === 0n ? 'infinity' : 'nan') : e === 0 ? (m === 0n ? 'zero' : 'subnormal') : 'normal';
  const buf = new DataView(new ArrayBuffer(8));
  if (width === 32) buf.setUint32(0, Number(BigInt.asUintN(32, bits)));
  else buf.setBigUint64(0, BigInt.asUintN(64, bits));
  const value = width === 32 ? buf.getFloat32(0) : buf.getFloat64(0);
  let exact: string;
  let exponentValue: number | null = null;
  const neg = sign === '1' ? '-' : '';
  if (kind === 'nan') exact = 'NaN';
  else if (kind === 'infinity') exact = `${neg}Infinity`;
  else if (kind === 'zero') exact = `${neg}0`;
  else {
    // value = significand × 2^(e - bias - man)
    const significand = kind === 'normal' ? m | (1n << BigInt(man)) : m;
    const e2 = (kind === 'normal' ? e - bias : 1 - bias) - man;
    exponentValue = kind === 'normal' ? e - bias : 1 - bias;
    exact = neg + exactDecimal(significand, e2);
  }
  return {
    width,
    sign,
    exponent,
    mantissa,
    hex: BigInt.asUintN(width, bits).toString(16).toUpperCase().padStart(width / 4, '0'),
    kind,
    exponentValue,
    value,
    exact,
  };
}

/** Exact decimal of significand × 2^e2 (always terminates). */
export function exactDecimal(significand: bigint, e2: number): string {
  if (e2 >= 0) return (significand << BigInt(e2)).toString();
  // s / 2^k = s × 5^k / 10^k
  const k = -e2;
  const digits = (significand * 5n ** BigInt(k)).toString().padStart(k + 1, '0');
  const int = digits.slice(0, digits.length - k);
  const frac = digits.slice(digits.length - k).replace(/0+$/, '');
  return frac ? `${int}.${frac}` : int;
}

/** Parses a float input: decimal, "inf", "-infinity" or "nan". */
export function parseFloatInput(input: string): number | null {
  const s = input.trim().toLowerCase().replace(/[_\s]/g, '');
  if (/^[+-]?(inf|infinity)$/.test(s)) return s.startsWith('-') ? -Infinity : Infinity;
  if (s === 'nan') return NaN;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(s)) return null;
  return Number(s);
}

// --- bitwise ------------------------------------------------------------------------------------

export type BitOp = 'and' | 'or' | 'xor' | 'nand' | 'nor' | 'not' | 'shl' | 'shr' | 'sar' | 'rol' | 'ror';
export const BIT_OPS: { id: BitOp; label: string; unary?: boolean; shift?: boolean }[] = [
  { id: 'and', label: 'A AND B' },
  { id: 'or', label: 'A OR B' },
  { id: 'xor', label: 'A XOR B' },
  { id: 'nand', label: 'A NAND B' },
  { id: 'nor', label: 'A NOR B' },
  { id: 'not', label: 'NOT A', unary: true },
  { id: 'shl', label: 'A << B', shift: true },
  { id: 'shr', label: 'A >>> B (logical)', shift: true },
  { id: 'sar', label: 'A >> B (arithmetic)', shift: true },
  { id: 'rol', label: 'Rotate A left by B', shift: true },
  { id: 'ror', label: 'Rotate A right by B', shift: true },
];

export type BitResult = { ok: true; unsigned: bigint; signed: bigint } | { ok: false; error: string };

/** Runs a bitwise operation on `bits`-wide two's-complement values; the result wraps to that width. */
export function bitwise(op: BitOp, a: bigint, b: bigint, bits: number): BitResult {
  if (!Number.isInteger(bits) || bits < 1 || bits > 4096) return { ok: false, error: 'Bit width must be 1–4096.' };
  const w = BigInt(bits);
  const ua = BigInt.asUintN(bits, a);
  const ub = BigInt.asUintN(bits, b);
  const mask = (1n << w) - 1n;
  const def = BIT_OPS.find((o) => o.id === op)!;
  if (def.shift && (b < 0n || b > 100_000n)) return { ok: false, error: 'Shift amount must be between 0 and 100000.' };
  let r: bigint;
  switch (op) {
    case 'and': r = ua & ub; break;
    case 'or': r = ua | ub; break;
    case 'xor': r = ua ^ ub; break;
    case 'nand': r = ~(ua & ub) & mask; break;
    case 'nor': r = ~(ua | ub) & mask; break;
    case 'not': r = ~ua & mask; break;
    case 'shl': r = (ua << b) & mask; break;
    case 'shr': r = ua >> b; break;
    case 'sar': r = BigInt.asUintN(bits, BigInt.asIntN(bits, ua) >> b); break;
    case 'rol':
    case 'ror': {
      let n = b % w;
      if (op === 'ror') n = (w - n) % w;
      r = n === 0n ? ua : ((ua << n) | (ua >> (w - n))) & mask;
      break;
    }
  }
  return { ok: true, unsigned: r, signed: BigInt.asIntN(bits, r) };
}

// --- characters ---------------------------------------------------------------------------------

export interface CharInfo {
  char: string;
  codePoint: number;
  unicode: string;
  utf8: string;
  utf16: string;
  ascii: boolean;
}

export function charInfo(text: string): CharInfo[] {
  const enc = new TextEncoder();
  return [...text].map((ch) => {
    const cp = ch.codePointAt(0)!;
    return {
      char: ch,
      codePoint: cp,
      unicode: `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
      utf8: [...enc.encode(ch)].map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' '),
      utf16: [...Array(ch.length).keys()].map((i) => ch.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')).join(' '),
      ascii: cp < 128,
    };
  });
}

export type CodesResult = { ok: true; text: string } | { ok: false; error: string };

/**
 * Turns a list of code points into text. Accepts decimal ("72 105"), hex ("0x48", "48h"),
 * "U+1F600", binary ("0b1001000"), separated by spaces or commas.
 */
export function codesToText(input: string): CodesResult {
  const parts = input.split(/[\s,;]+/).filter(Boolean);
  if (!parts.length) return { ok: true, text: '' };
  const out: string[] = [];
  for (const p of parts) {
    const lower = p.toLowerCase();
    let r: ParseInt;
    if (lower.startsWith('u+')) r = parseInteger(lower.slice(2), 16);
    else if (lower.startsWith('\\u')) r = parseInteger(lower.slice(2).replace(/[{}]/g, ''), 16);
    else if (/^[0-9a-f]+h$/.test(lower)) r = parseInteger(lower.slice(0, -1), 16);
    else r = parseInteger(lower);
    if (!r.ok) return { ok: false, error: `“${p}” isn't a code: ${r.error}` };
    if (r.value < 0n || r.value > 0x10ffffn) return { ok: false, error: `${p} is outside Unicode (0–0x10FFFF).` };
    const cp = Number(r.value);
    if (cp >= 0xd800 && cp <= 0xdfff) return { ok: false, error: `${p} is a lone surrogate, not a character.` };
    out.push(String.fromCodePoint(cp));
  }
  return { ok: true, text: out.join('') };
}
