// Colour parsing, conversion, contrast and palettes. Pure maths, no DOM, so it's unit-testable in Node.
// Matrices and constants follow CSS Color 4 (https://www.w3.org/TR/css-color-4/#color-conversion-code).

import { NAMED_COLORS, nameForHex } from './named';

/** A colour as gamma-encoded sRGB channels (0–1, may fall outside for wide-gamut input) plus alpha. */
export interface Color {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

type Vec3 = [number, number, number];
type Mat3 = [Vec3, Vec3, Vec3];

const mul = (m: Mat3, v: Vec3): Vec3 => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];

const SRGB_TO_XYZ: Mat3 = [
  [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
  [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
  [0.01933081871559182, 0.11919477979462598, 0.9505321522496607],
];
const XYZ_TO_SRGB: Mat3 = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
];
const P3_TO_XYZ: Mat3 = [
  [0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
  [0.2289745640697488, 0.6917385218365064, 0.079286914093745],
  [0, 0.04511338185890264, 1.043944368900976],
];
const XYZ_TO_P3: Mat3 = [
  [2.493496911941425, -0.9313836179191239, -0.40271078445071684],
  [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577],
  [0.03584583024378447, -0.07617238926804182, 0.9568845240076872],
];
const D65_TO_D50: Mat3 = [
  [1.0479298208405488, 0.022946793341019088, -0.05019222954313557],
  [0.029627815688159344, 0.990434484573249, -0.01707382502938514],
  [-0.009243058152591178, 0.015055144896577895, 0.7518742899580008],
];
const D50_TO_D65: Mat3 = [
  [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
  [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
  [0.012314001688319899, -0.020507696433477912, 1.3303659366080753],
];
const XYZ_TO_LMS: Mat3 = [
  [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
  [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
  [0.0481771893596242, 0.2642395317527308, 0.6335478284694309],
];
const LMS_TO_OKLAB: Mat3 = [
  [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
  [1.9779985324311684, -2.42859224204858, 0.450593709617411],
  [0.0259040424655478, 0.7827717124575296, -0.8086757549230774],
];
const OKLAB_TO_LMS: Mat3 = [
  [1, 0.3963377773761749, 0.2158037573099136],
  [1, -0.1055613458156586, -0.0638541728258133],
  [1, -0.0894841775298119, -1.2914855480194092],
];
const LMS_TO_XYZ: Mat3 = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
];
const D50_WHITE: Vec3 = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585];

// --- transfer functions -------------------------------------------------------------------------

const toLinear = (c: number) => {
  const a = Math.abs(c);
  return a <= 0.04045 ? c / 12.92 : Math.sign(c) * ((a + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (c: number) => {
  const a = Math.abs(c);
  return a <= 0.0031308 ? c * 12.92 : Math.sign(c) * (1.055 * a ** (1 / 2.4) - 0.055);
};

export const linearRgb = (c: Color): Vec3 => [toLinear(c.r), toLinear(c.g), toLinear(c.b)];
const fromLinearRgb = (v: Vec3, alpha: number): Color => ({ r: fromLinear(v[0]), g: fromLinear(v[1]), b: fromLinear(v[2]), alpha });

export const toXyz = (c: Color): Vec3 => mul(SRGB_TO_XYZ, linearRgb(c));
const fromXyz = (xyz: Vec3, alpha: number): Color => fromLinearRgb(mul(XYZ_TO_SRGB, xyz), alpha);

export function toOklab(c: Color): Vec3 {
  const lms = mul(XYZ_TO_LMS, toXyz(c)).map(Math.cbrt) as Vec3;
  return mul(LMS_TO_OKLAB, lms);
}
export function fromOklab(lab: Vec3, alpha = 1): Color {
  const lms = mul(OKLAB_TO_LMS, lab).map((x) => x ** 3) as Vec3;
  return fromXyz(mul(LMS_TO_XYZ, lms), alpha);
}

const EPS = 216 / 24389;
const KAPPA = 24389 / 27;
export function toLab(c: Color): Vec3 {
  const xyz = mul(D65_TO_D50, toXyz(c));
  const f = xyz.map((v, i) => {
    const t = v / D50_WHITE[i];
    return t > EPS ? Math.cbrt(t) : (KAPPA * t + 16) / 116;
  });
  return [116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])];
}
export function fromLab([L, a, b]: Vec3, alpha = 1): Color {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const x = fx ** 3 > EPS ? fx ** 3 : (116 * fx - 16) / KAPPA;
  const y = L > KAPPA * EPS ? fy ** 3 : L / KAPPA;
  const z = fz ** 3 > EPS ? fz ** 3 : (116 * fz - 16) / KAPPA;
  const xyz: Vec3 = [x * D50_WHITE[0], y * D50_WHITE[1], z * D50_WHITE[2]];
  return fromXyz(mul(D50_TO_D65, xyz), alpha);
}

const toPolar = ([l, a, b]: Vec3): Vec3 => {
  const c = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return [l, c, c < 1e-7 ? 0 : h];
};
const fromPolar = ([l, c, h]: Vec3): Vec3 => [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)];

export const toOklch = (c: Color): Vec3 => toPolar(toOklab(c));
export const fromOklch = (lch: Vec3, alpha = 1): Color => fromOklab(fromPolar(lch), alpha);
export const toLch = (c: Color): Vec3 => toPolar(toLab(c));
export const fromLch = (lch: Vec3, alpha = 1): Color => fromLab(fromPolar(lch), alpha);

export function toP3(c: Color): Vec3 {
  return mul(XYZ_TO_P3, toXyz(c)).map(fromLinear) as Vec3;
}
function fromP3(v: Vec3, alpha: number): Color {
  return fromXyz(mul(P3_TO_XYZ, v.map(toLinear) as Vec3), alpha);
}

export function toHsl(c: Color): Vec3 {
  const { r, g, b } = clampColor(c);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l * 100];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return [h, s * 100, l * 100];
}
export function fromHsl([h, s, l]: Vec3, alpha = 1): Color {
  const sat = Math.min(Math.max(s, 0), 100) / 100;
  const lig = Math.min(Math.max(l, 0), 100) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const a = sat * Math.min(lig, 1 - lig);
    return lig - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: f(0), g: f(8), b: f(4), alpha };
}
export function toHwb(c: Color): Vec3 {
  const { r, g, b } = clampColor(c);
  return [toHsl(c)[0], Math.min(r, g, b) * 100, (1 - Math.max(r, g, b)) * 100];
}
export function fromHwb([h, w, bl]: Vec3, alpha = 1): Color {
  const white = Math.max(w, 0) / 100;
  const black = Math.max(bl, 0) / 100;
  if (white + black >= 1) {
    const grey = white / (white + black);
    return { r: grey, g: grey, b: grey, alpha };
  }
  const base = fromHsl([h, 100, 50]);
  const k = 1 - white - black;
  return { r: base.r * k + white, g: base.g * k + white, b: base.b * k + white, alpha };
}

// --- gamut --------------------------------------------------------------------------------------

const GAMUT_EPS = 1e-4;
export function inSrgbGamut(c: Color): boolean {
  return [c.r, c.g, c.b].every((v) => v >= -GAMUT_EPS && v <= 1 + GAMUT_EPS);
}
export function inP3Gamut(c: Color): boolean {
  return toP3(c).every((v) => v >= -GAMUT_EPS && v <= 1 + GAMUT_EPS);
}
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export function clampColor(c: Color): Color {
  return { r: clamp01(c.r), g: clamp01(c.g), b: clamp01(c.b), alpha: clamp01(c.alpha) };
}
/** Brings a colour into sRGB by reducing OKLCH chroma (keeping lightness and hue), as CSS does. */
export function toSrgbGamut(c: Color): Color {
  if (inSrgbGamut(c)) return clampColor(c);
  const [l, ch, h] = toOklch(c);
  if (l >= 1) return { r: 1, g: 1, b: 1, alpha: c.alpha };
  if (l <= 0) return { r: 0, g: 0, b: 0, alpha: c.alpha };
  let lo = 0;
  let hi = ch;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (inSrgbGamut(fromOklch([l, mid, h]))) lo = mid;
    else hi = mid;
  }
  return clampColor(fromOklch([l, lo, h], c.alpha));
}

// --- parsing ------------------------------------------------------------------------------------

export type ParseResult = { ok: true; color: Color; format: string } | { ok: false; error: string };

interface Token {
  value: number;
  unit: '' | '%' | 'deg' | 'rad' | 'grad' | 'turn';
  none: boolean;
}

const NUM = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg|rad|grad|turn)?$/i;

function token(s: string): Token | null {
  if (s.toLowerCase() === 'none') return { value: 0, unit: '', none: true };
  const m = NUM.exec(s);
  if (!m) return null;
  return { value: Number(m[1]), unit: (m[2]?.toLowerCase() ?? '') as Token['unit'], none: false };
}

function hue(t: Token): number {
  const v = { '': t.value, deg: t.value, '%': NaN, rad: (t.value * 180) / Math.PI, grad: t.value * 0.9, turn: t.value * 360 }[t.unit];
  return ((v % 360) + 360) % 360;
}
/** A channel where `100%` means `full`. */
const pct = (t: Token, full: number) => (t.unit === '%' ? (t.value / 100) * full : t.value);
const alphaOf = (t?: Token) => (t ? clamp01(t.unit === '%' ? t.value / 100 : t.value) : 1);

function parseHex(hex: string): Color | null {
  if (!/^[0-9a-f]+$/i.test(hex) || ![3, 4, 6, 8].includes(hex.length)) return null;
  const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
  const n = (i: number) => parseInt(full.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), alpha: full.length === 8 ? n(6) : 1 };
}

/** Parses any CSS colour: hex, named, rgb(), hsl(), hwb(), lab(), lch(), oklab(), oklch(), color(). */
export function parseColor(input: string): ParseResult {
  const s = input.trim().toLowerCase().replace(/;$/, '').trim();
  if (!s) return { ok: false, error: 'Enter a colour.' };
  if (s === 'transparent') return { ok: true, color: { r: 0, g: 0, b: 0, alpha: 0 }, format: 'named' };
  const named = NAMED_COLORS.get(s);
  if (named) return { ok: true, color: parseHex(named)!, format: 'named' };
  if (s.startsWith('#') || /^[0-9a-f]{3,8}$/.test(s)) {
    const c = parseHex(s.replace(/^#/, ''));
    return c ? { ok: true, color: c, format: 'hex' } : { ok: false, error: 'Hex colours have 3, 4, 6 or 8 digits (0–9, a–f).' };
  }
  const m = /^([a-z-]+)\((.*)\)$/.exec(s);
  if (!m) return { ok: false, error: `“${input.trim()}” isn't a colour this tool recognises.` };
  const fn = m[1] === 'rgba' ? 'rgb' : m[1] === 'hsla' ? 'hsl' : m[1];
  let body = m[2].trim();
  let space = '';
  if (fn === 'color') {
    const sm = /^([a-z0-9-]+)\s+(.*)$/.exec(body);
    if (!sm) return { ok: false, error: 'color() needs a colour space, e.g. color(display-p3 1 0 0).' };
    space = sm[1];
    body = sm[2];
  }
  // Split "a b c / alpha" or legacy "a, b, c, alpha".
  let parts: string[];
  let alphaPart: string | undefined;
  if (body.includes(',')) {
    parts = body.split(',').map((p) => p.trim());
    if (parts.length === 4) alphaPart = parts.pop();
  } else {
    const [main, a, extra] = body.split('/').map((p) => p.trim());
    if (extra !== undefined) return { ok: false, error: 'Only one “/” (before alpha) is allowed.' };
    parts = main.split(/\s+/).filter(Boolean);
    alphaPart = a;
  }
  if (parts.length !== 3) return { ok: false, error: `${fn}() takes three channels${fn === 'color' ? ' after the colour space' : ''} and an optional alpha.` };
  const toks = parts.map(token);
  const alphaTok = alphaPart !== undefined ? token(alphaPart) : undefined;
  if (toks.some((t) => !t) || alphaTok === null) return { ok: false, error: `Couldn't read the numbers in ${fn}().` };
  const [a, b, c] = toks as Token[];
  const alpha = alphaOf(alphaTok);
  const angleOk = (t: Token) => t.unit !== '%';
  const noAngle = (...ts: Token[]) => ts.every((t) => ['', '%'].includes(t.unit));

  switch (fn) {
    case 'rgb': {
      if (!noAngle(a, b, c)) return { ok: false, error: 'rgb() channels are numbers (0–255) or percentages.' };
      const ch = (t: Token) => (t.unit === '%' ? t.value / 100 : t.value / 255);
      return { ok: true, color: clampColor({ r: ch(a), g: ch(b), b: ch(c), alpha }), format: 'rgb' };
    }
    case 'hsl':
    case 'hwb': {
      if (!angleOk(a) || !noAngle(b, c)) return { ok: false, error: `${fn}() is hue, then two percentages.` };
      const v: Vec3 = [hue(a), b.value, c.value];
      return { ok: true, color: fn === 'hsl' ? fromHsl(v, alpha) : fromHwb(v, alpha), format: fn };
    }
    case 'lab':
    case 'oklab': {
      if (!noAngle(a, b, c)) return { ok: false, error: `${fn}() channels are numbers or percentages.` };
      const ok = fn === 'oklab';
      const v: Vec3 = [pct(a, ok ? 1 : 100), pct(b, ok ? 0.4 : 125), pct(c, ok ? 0.4 : 125)];
      v[0] = Math.max(0, v[0]);
      return { ok: true, color: ok ? fromOklab(v, alpha) : fromLab(v, alpha), format: fn };
    }
    case 'lch':
    case 'oklch': {
      if (!noAngle(a, b) || !angleOk(c)) return { ok: false, error: `${fn}() is lightness, chroma, then hue.` };
      const ok = fn === 'oklch';
      const v: Vec3 = [Math.max(0, pct(a, ok ? 1 : 100)), Math.max(0, pct(b, ok ? 0.4 : 150)), hue(c)];
      return { ok: true, color: ok ? fromOklch(v, alpha) : fromLch(v, alpha), format: fn };
    }
    case 'color': {
      if (!noAngle(a, b, c)) return { ok: false, error: 'color() channels are numbers or percentages.' };
      const v: Vec3 = [pct(a, 1), pct(b, 1), pct(c, 1)];
      switch (space) {
        case 'srgb':
          return { ok: true, color: { r: v[0], g: v[1], b: v[2], alpha }, format: 'color' };
        case 'srgb-linear':
          return { ok: true, color: fromLinearRgb(v, alpha), format: 'color' };
        case 'display-p3':
          return { ok: true, color: fromP3(v, alpha), format: 'color' };
        case 'xyz':
        case 'xyz-d65':
          return { ok: true, color: fromXyz(v, alpha), format: 'color' };
        case 'xyz-d50':
          return { ok: true, color: fromXyz(mul(D50_TO_D65, v), alpha), format: 'color' };
        default:
          return { ok: false, error: `Colour space “${space}” isn't supported (try srgb, srgb-linear, display-p3, xyz-d65 or xyz-d50).` };
      }
    }
    default:
      return { ok: false, error: `${m[1]}() isn't a CSS colour function.` };
  }
}

// --- formatting ---------------------------------------------------------------------------------

/** Rounds for display and drops trailing zeros ("-0" becomes "0"). */
export function num(v: number, digits = 2): string {
  const r = Number(v.toFixed(digits));
  return String(Object.is(r, -0) ? 0 : r);
}
const alphaSuffix = (a: number) => (a < 1 ? ` / ${num(a, 3)}` : '');
const byte = (v: number) => Math.round(clamp01(v) * 255);
const hex2 = (v: number) => byte(v).toString(16).padStart(2, '0');

export function toHex(c: Color, withAlpha = c.alpha < 1): string {
  const g = toSrgbGamut(c);
  return `#${hex2(g.r)}${hex2(g.g)}${hex2(g.b)}${withAlpha ? hex2(c.alpha) : ''}`;
}

export interface Formatted {
  id: string;
  label: string;
  value: string;
}

/** Every CSS notation for a colour. sRGB notations are gamut-mapped; the others are exact. */
export function formatAll(c: Color): Formatted[] {
  const g = toSrgbGamut(c);
  const a = c.alpha;
  const [h, s, l] = toHsl(g);
  const [, w, bl] = toHwb(g);
  const [L, A, B] = toLab(c);
  const [, C, H] = toLch(c);
  const [oL, oA, oB] = toOklab(c);
  const [, oC, oH] = toOklch(c);
  const p3 = toP3(c);
  const name = a === 1 ? nameForHex(toHex(g, false).slice(1)) : a === 0 && byte(g.r) + byte(g.g) + byte(g.b) === 0 ? 'transparent' : undefined;
  const list: Formatted[] = [
    { id: 'hex', label: 'HEX', value: toHex(c) },
    { id: 'rgb', label: 'RGB', value: `rgb(${byte(g.r)} ${byte(g.g)} ${byte(g.b)}${alphaSuffix(a)})` },
    { id: 'rgb-legacy', label: 'RGB (legacy)', value: a < 1 ? `rgba(${byte(g.r)}, ${byte(g.g)}, ${byte(g.b)}, ${num(a, 3)})` : `rgb(${byte(g.r)}, ${byte(g.g)}, ${byte(g.b)})` },
    { id: 'hsl', label: 'HSL', value: `hsl(${num(h, 1)} ${num(s, 1)}% ${num(l, 1)}%${alphaSuffix(a)})` },
    { id: 'hwb', label: 'HWB', value: `hwb(${num(h, 1)} ${num(w, 1)}% ${num(bl, 1)}%${alphaSuffix(a)})` },
    { id: 'lab', label: 'CIE Lab', value: `lab(${num(L, 2)}% ${num(A, 2)} ${num(B, 2)}${alphaSuffix(a)})` },
    { id: 'lch', label: 'CIE LCH', value: `lch(${num(L, 2)}% ${num(C, 2)} ${num(H, 2)}${alphaSuffix(a)})` },
    { id: 'oklab', label: 'OKLab', value: `oklab(${num(oL * 100, 2)}% ${num(oA, 4)} ${num(oB, 4)}${alphaSuffix(a)})` },
    { id: 'oklch', label: 'OKLCH', value: `oklch(${num(oL * 100, 2)}% ${num(oC, 4)} ${num(oH, 1)}${alphaSuffix(a)})` },
    { id: 'p3', label: 'Display P3', value: `color(display-p3 ${num(p3[0], 4)} ${num(p3[1], 4)} ${num(p3[2], 4)}${alphaSuffix(a)})` },
  ];
  if (name) list.splice(1, 0, { id: 'named', label: 'Name', value: name });
  return list;
}

/** CSS value for painting a swatch (sRGB, gamut-mapped). */
export const cssColor = (c: Color) => toHex(c);

// --- contrast -----------------------------------------------------------------------------------

/** WCAG 2.1 relative luminance (alpha ignored). */
export function luminance(c: Color): number {
  const g = toSrgbGamut(c);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(g.r) + 0.7152 * lin(g.g) + 0.0722 * lin(g.b);
}

/** Composites a translucent foreground over an opaque background. */
export function over(fg: Color, bg: Color): Color {
  const a = fg.alpha;
  const b = toSrgbGamut({ ...bg, alpha: 1 });
  const f = toSrgbGamut(fg);
  return { r: f.r * a + b.r * (1 - a), g: f.g * a + b.g * (1 - a), b: f.b * a + b.b * (1 - a), alpha: 1 };
}

export function contrastRatio(fg: Color, bg: Color): number {
  const l1 = luminance(over(fg, bg));
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export interface WcagResult {
  ratio: number;
  normalAA: boolean;
  normalAAA: boolean;
  largeAA: boolean;
  largeAAA: boolean;
  ui: boolean;
}

/** WCAG 2.1 thresholds, with the ratio compared unrounded (as the spec requires). */
export function wcag(fg: Color, bg: Color): WcagResult {
  const ratio = contrastRatio(fg, bg);
  return { ratio, normalAA: ratio >= 4.5, normalAAA: ratio >= 7, largeAA: ratio >= 3, largeAAA: ratio >= 4.5, ui: ratio >= 3 };
}

/** Shows a ratio the way WCAG tools do: truncated (not rounded up) to two decimals. */
export const formatRatio = (r: number) => `${(Math.floor(r * 100) / 100).toFixed(2)}:1`;

/** APCA lightness contrast (Lc), APCA-W3 0.0.98G. Positive: dark text on light; negative: light on dark. */
export function apca(text: Color, bg: Color): number {
  const y = (c: Color) => {
    const g = toSrgbGamut(c);
    const v = 0.2126729 * g.r ** 2.4 + 0.7151522 * g.g ** 2.4 + 0.072175 * g.b ** 2.4;
    return v < 0.022 ? v + (0.022 - v) ** 1.414 : v;
  };
  const yt = y(over(text, bg));
  const yb = y(bg);
  if (Math.abs(yb - yt) < 0.0005) return 0;
  if (yb > yt) {
    const s = (yb ** 0.56 - yt ** 0.57) * 1.14;
    return s < 0.1 ? 0 : (s - 0.027) * 100;
  }
  const s = (yb ** 0.65 - yt ** 0.62) * 1.14;
  return s > -0.1 ? 0 : (s + 0.027) * 100;
}

/**
 * The colour nearest to `c` (same OKLCH hue and chroma, lightness moved as little as possible)
 * that reaches `target` contrast against `against`. Returns null if no lightness gets there.
 */
export function nearestPassing(c: Color, against: Color, target: number, adjusting: 'fg' | 'bg' = 'fg'): Color | null {
  const ratio = (x: Color) => (adjusting === 'fg' ? contrastRatio(x, against) : contrastRatio(against, x));
  if (ratio(c) >= target) return c;
  const [l0, ch, h] = toOklch(c);
  const at = (l: number) => toSrgbGamut(fromOklch([l, ch, h], c.alpha));
  let best: { color: Color; dist: number } | null = null;
  for (const dir of [1, -1]) {
    const steps = 400;
    let prev = l0;
    for (let i = 1; i <= steps; i++) {
      const l = Math.min(1, Math.max(0, l0 + (dir * i) / steps));
      if (ratio(at(l)) >= target) {
        // Refine between the last failing and the first passing lightness.
        let lo = prev;
        let hi = l;
        for (let k = 0; k < 25; k++) {
          const mid = (lo + hi) / 2;
          if (ratio(at(mid)) >= target) hi = mid;
          else lo = mid;
        }
        // Rounding to hex can dip just below the target: nudge until the hex itself passes.
        let color = parseHex(toHex(at(hi), false).slice(1))!;
        let l2 = hi;
        for (let k = 0; k < 20 && ratio({ ...color, alpha: c.alpha }) < target; k++) {
          l2 = Math.min(1, Math.max(0, l2 + dir * 0.002));
          color = parseHex(toHex(at(l2), false).slice(1))!;
        }
        color = { ...color, alpha: c.alpha };
        if (ratio(color) >= target) {
          const dist = Math.abs(l2 - l0);
          if (!best || dist < best.dist) best = { color, dist };
        }
        break;
      }
      prev = l;
      if (l === 0 || l === 1) break;
    }
  }
  return best?.color ?? null;
}

// --- palettes -----------------------------------------------------------------------------------

export function mix(a: Color, b: Color, t: number): Color {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t, alpha: a.alpha + (b.alpha - a.alpha) * t };
}

const WHITE: Color = { r: 1, g: 1, b: 1, alpha: 1 };
const BLACK: Color = { r: 0, g: 0, b: 0, alpha: 1 };

export function tints(c: Color, n = 5): Color[] {
  const g = toSrgbGamut({ ...c, alpha: 1 });
  return Array.from({ length: n }, (_, i) => mix(g, WHITE, (i + 1) / (n + 1)));
}
export function shades(c: Color, n = 5): Color[] {
  const g = toSrgbGamut({ ...c, alpha: 1 });
  return Array.from({ length: n }, (_, i) => mix(g, BLACK, (i + 1) / (n + 1)));
}

export type Harmony = 'complementary' | 'analogous' | 'triadic' | 'split' | 'tetradic';
export const HARMONIES: { id: Harmony; label: string; offsets: number[] }[] = [
  { id: 'complementary', label: 'Complementary', offsets: [0, 180] },
  { id: 'analogous', label: 'Analogous', offsets: [-30, 0, 30] },
  { id: 'triadic', label: 'Triadic', offsets: [0, 120, 240] },
  { id: 'split', label: 'Split complementary', offsets: [0, 150, 210] },
  { id: 'tetradic', label: 'Tetradic', offsets: [0, 90, 180, 270] },
];

/** Rotates the HSL hue, keeping saturation and lightness. */
export function rotateHue(c: Color, degrees: number): Color {
  const [h, s, l] = toHsl(c);
  return fromHsl([(((h + degrees) % 360) + 360) % 360, s, l], 1);
}
export function harmony(c: Color, kind: Harmony): Color[] {
  return HARMONIES.find((x) => x.id === kind)!.offsets.map((o) => (o === 0 ? toSrgbGamut({ ...c, alpha: 1 }) : rotateHue(c, o)));
}

// --- colour-vision deficiency simulation ------------------------------------------------------

export type Deficiency = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
export const DEFICIENCIES: { id: Deficiency; label: string; note: string }[] = [
  { id: 'protanopia', label: 'Protanopia', note: 'no red cones (~1% of men)' },
  { id: 'deuteranopia', label: 'Deuteranopia', note: 'no green cones (~1% of men)' },
  { id: 'tritanopia', label: 'Tritanopia', note: 'no blue cones (rare)' },
  { id: 'achromatopsia', label: 'Achromatopsia', note: 'no colour vision (very rare)' },
];

// Machado, Oliveira & Fernandes (2009), severity 1.0, applied to linear sRGB.
const CVD: Record<Exclude<Deficiency, 'achromatopsia'>, Mat3> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

export function simulate(c: Color, kind: Deficiency): Color {
  const lin = linearRgb(toSrgbGamut(c));
  if (kind === 'achromatopsia') {
    const y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
    return clampColor(fromLinearRgb([y, y, y], c.alpha));
  }
  return clampColor(fromLinearRgb(mul(CVD[kind], lin), c.alpha));
}
