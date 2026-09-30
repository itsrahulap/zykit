// Exact rational arithmetic on BigInt, so 0.1 + 0.2 is exactly 0.3 and conversions don't drift.

export interface Rational {
  n: bigint;
  d: bigint;
}

const abs = (x: bigint) => (x < 0n ? -x : x);
function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function rat(n: bigint, d = 1n): Rational {
  if (d === 0n) throw new RangeError('Division by zero');
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}

export const ZERO = rat(0n);
export const ONE = rat(1n);
export const add = (a: Rational, b: Rational) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Rational, b: Rational) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Rational, b: Rational) => rat(a.n * b.n, a.d * b.d);
export const div = (a: Rational, b: Rational) => rat(a.n * b.d, a.d * b.n);
export const isZero = (a: Rational) => a.n === 0n;

const DECIMAL = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d{1,4}))?$/i;

/** Parses "1.5", "-2e-3", ".5", or a fraction "5/9" of such numbers. Returns null if not a number. */
export function parseDecimal(input: string): Rational | null {
  const s = input.trim().replace(/[\s_]/g, '');
  const slash = s.indexOf('/');
  if (slash > 0) {
    const a = parseDecimal(s.slice(0, slash));
    const b = parseDecimal(s.slice(slash + 1));
    return a && b && !isZero(b) ? div(a, b) : null;
  }
  // Thousands separators: "1,234,567.8".
  const plain = /^[+-]?\d{1,3}(,\d{3})+(\.\d*)?$/.test(s) ? s.replace(/,/g, '') : s;
  const m = DECIMAL.exec(plain);
  if (!m || (!m[2] && !m[3])) return null;
  const frac = m[3] ?? '';
  const exp = Number(m[4] ?? 0) - frac.length;
  let n = BigInt((m[2] || '0') + frac);
  if (m[1] === '-') n = -n;
  return exp >= 0 ? rat(n * 10n ** BigInt(exp)) : rat(n, 10n ** BigInt(-exp));
}

/** Integer part of log10(|r|) for r ≠ 0. */
function log10floor(r: Rational): number {
  const n = abs(r.n);
  let e = n.toString().length - r.d.toString().length;
  // Adjust so that 10^e <= n/d < 10^(e+1).
  const ten = (k: number) => 10n ** BigInt(Math.abs(k));
  const ge = (k: number) => (k >= 0 ? n >= r.d * ten(k) : n * ten(k) >= r.d);
  while (!ge(e)) e--;
  while (ge(e + 1)) e++;
  return e;
}

/** Rounds half away from zero: n/d → bigint. */
function roundDiv(n: bigint, d: bigint): bigint {
  const q = n / d;
  const r = n % d;
  return 2n * abs(r) >= d ? q + (n < 0n ? -1n : 1n) : q;
}

export interface FormatOptions {
  /** Significant digits (1–30). */
  precision?: number;
  /** Use scientific notation outside 1e-6 … 1e21. */
  scientific?: boolean;
}

/** Formats with at most `precision` significant digits, trailing zeros removed. */
export function formatRational(r: Rational, { precision = 10, scientific = true }: FormatOptions = {}): string {
  if (isZero(r)) return '0';
  const e = log10floor(r);
  const shift = precision - 1 - e;
  let q = shift >= 0 ? roundDiv(r.n * 10n ** BigInt(shift), r.d) : roundDiv(r.n, r.d * 10n ** BigInt(-shift));
  let exp = e;
  // Rounding can carry into a new digit (9.99 → 10.0).
  if (abs(q).toString().length > precision) {
    q /= 10n;
    exp++;
  }
  const neg = q < 0n;
  const digits = abs(q).toString();
  const sign = neg ? '-' : '';
  if (scientific && (exp >= 21 || exp < -6)) {
    const mant = digits.length > 1 ? `${digits[0]}.${digits.slice(1)}`.replace(/\.?0+$/, '') : digits;
    return `${sign}${mant}e${exp >= 0 ? '+' : ''}${exp}`;
  }
  // Place the decimal point: value = digits × 10^(exp - precision + 1)
  const pointPos = exp + 1; // digits before the point
  let str: string;
  if (pointPos <= 0) str = `0.${'0'.repeat(-pointPos)}${digits}`;
  else if (pointPos >= digits.length) str = digits + '0'.repeat(pointPos - digits.length);
  else str = `${digits.slice(0, pointPos)}.${digits.slice(pointPos)}`;
  if (str.includes('.')) str = str.replace(/\.?0+$/, '');
  return sign + str;
}

/** True if the decimal expansion of r terminates within `maxDigits` fraction digits and is shown fully. */
export function isExactWithin(r: Rational, precision: number): boolean {
  const shown = parseDecimal(formatRational(r, { precision, scientific: false }));
  return !!shown && shown.n === r.n && shown.d === r.d;
}
