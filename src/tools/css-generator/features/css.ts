// Pure CSS string builders and the fluid-type maths. No DOM, no side effects.

/** Rounds to `dp` decimals and drops trailing zeros ("0.50" -> "0.5", "-0" -> "0"). */
export function num(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return '0';
  const s = (+n.toFixed(dp)).toString();
  return s === '-0' ? '0' : s;
}

const HEX = /^#([0-9a-f]{6})$/i;
export const isHex = (s: string) => HEX.test(s);

/** "#rrggbb" + alpha (0-1) -> hex when opaque, otherwise rgba(). Anything else passes through. */
export function withAlpha(hex: string, alpha = 1): string {
  const m = HEX.exec(hex);
  if (!m) return hex;
  if (alpha >= 1) return hex.toLowerCase();
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${num(Math.max(0, alpha), 2)})`;
}

/** Tailwind arbitrary values can't contain spaces: they become underscores. */
export const tw = (v: string) => v.replace(/\s+/g, '_');

/* ---------------------------------------------------------------- gradient */

export type GradientKind = 'linear' | 'radial' | 'conic';
export interface Stop {
  color: string;
  alpha: number;
  pos: number;
}
export interface Gradient {
  kind: GradientKind;
  angle: number;
  repeat: boolean;
  shape: 'circle' | 'ellipse';
  cx: number;
  cy: number;
  stops: Stop[];
}

export const sortedStops = (stops: Stop[]) => [...stops].sort((a, b) => a.pos - b.pos);

export function gradientCss(g: Gradient): string {
  const stops = sortedStops(g.stops)
    .map((s) => `${withAlpha(s.color, s.alpha)} ${num(s.pos)}%`)
    .join(', ');
  const prefix = g.repeat ? 'repeating-' : '';
  const at = `${num(g.cx)}% ${num(g.cy)}%`;
  if (g.kind === 'linear') return `${prefix}linear-gradient(${num(g.angle)}deg, ${stops})`;
  if (g.kind === 'radial') return `${prefix}radial-gradient(${g.shape} at ${at}, ${stops})`;
  return `${prefix}conic-gradient(from ${num(g.angle)}deg at ${at}, ${stops})`;
}

export const gradientDeclaration = (g: Gradient) => `background-image: ${gradientCss(g)};`;
export const gradientTailwind = (g: Gradient) => `bg-[${tw(gradientCss(g))}]`;

/* ------------------------------------------------------------- box shadow */

export interface BoxShadow {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  alpha: number;
  inset: boolean;
}

export function boxShadowLayer(l: BoxShadow): string {
  const parts = [l.inset ? 'inset' : '', `${num(l.x)}px`, `${num(l.y)}px`, `${num(Math.max(0, l.blur))}px`, `${num(l.spread)}px`, withAlpha(l.color, l.alpha)];
  return parts.filter(Boolean).join(' ');
}
export const boxShadowValue = (layers: BoxShadow[]) => (layers.length ? layers.map(boxShadowLayer).join(', ') : 'none');
export const boxShadowDeclaration = (layers: BoxShadow[]) => `box-shadow: ${layers.length > 1 ? '\n  ' + layers.map(boxShadowLayer).join(',\n  ') + ';' : boxShadowValue(layers) + ';'}`;
export const boxShadowTailwind = (layers: BoxShadow[]) => `shadow-[${layers.map((l) => tw(boxShadowLayer(l))).join(',') || 'none'}]`;

/* ------------------------------------------------------------ text shadow */

export interface TextShadow {
  x: number;
  y: number;
  blur: number;
  color: string;
  alpha: number;
}
export const textShadowLayer = (l: TextShadow) => `${num(l.x)}px ${num(l.y)}px ${num(Math.max(0, l.blur))}px ${withAlpha(l.color, l.alpha)}`;
export const textShadowValue = (layers: TextShadow[]) => (layers.length ? layers.map(textShadowLayer).join(', ') : 'none');
export const textShadowDeclaration = (layers: TextShadow[]) => `text-shadow: ${textShadowValue(layers)};`;
export const textShadowTailwind = (layers: TextShadow[]) => `[text-shadow:${layers.map((l) => tw(textShadowLayer(l))).join(',') || 'none'}]`;

/* ----------------------------------------------------------- border radius */

export type RadiusUnit = 'px' | '%';
export interface Corner {
  h: number;
  v: number;
}
/** Corners in CSS order: top-left, top-right, bottom-right, bottom-left. */
export type Corners = [Corner, Corner, Corner, Corner];

/** Shortest 1-4 value form of four values (CSS box shorthand). */
export function collapse4(v: string[]): string[] {
  const [a, b, c, d] = v;
  if (a === b && b === c && c === d) return [a];
  if (a === c && b === d) return [a, b];
  if (b === d) return [a, b, c];
  return [a, b, c, d];
}

export function borderRadiusValue(corners: Corners, unit: RadiusUnit): string {
  const f = (n: number) => `${num(Math.max(0, n))}${n === 0 ? '' : unit}`;
  const h = collapse4(corners.map((c) => f(c.h)));
  const circular = corners.every((c) => c.h === c.v);
  if (circular) return h.join(' ');
  return `${h.join(' ')} / ${collapse4(corners.map((c) => f(c.v))).join(' ')}`;
}
export const borderRadiusDeclaration = (c: Corners, u: RadiusUnit) => `border-radius: ${borderRadiusValue(c, u)};`;
export const borderRadiusTailwind = (c: Corners, u: RadiusUnit) => `rounded-[${tw(borderRadiusValue(c, u))}]`;

/* ------------------------------------------------------------------ clamp */

export interface FluidInput {
  minSize: number;
  maxSize: number;
  minVw: number;
  maxVw: number;
  rootPx: number;
}
export interface FluidResult {
  css: string;
  preferred: string;
  /** px of size per px of viewport width. */
  slope: number;
  /** px, the size at a 0 px viewport on the slope line. */
  intercept: number;
  lo: number;
  hi: number;
  steps: string[];
  valueAt: (vw: number) => number;
}
export type FluidOutcome = { ok: true; result: FluidResult } | { ok: false; error: string };

export function fluid(i: FluidInput): FluidOutcome {
  const vals = [i.minSize, i.maxSize, i.minVw, i.maxVw, i.rootPx];
  if (vals.some((v) => !Number.isFinite(v))) return { ok: false, error: 'Enter numbers in every field.' };
  if (i.rootPx <= 0) return { ok: false, error: 'The rem base must be greater than 0.' };
  if (i.minVw < 0 || i.maxVw <= i.minVw) return { ok: false, error: 'The maximum viewport must be wider than the minimum.' };
  const slope = (i.maxSize - i.minSize) / (i.maxVw - i.minVw);
  const intercept = i.minSize - slope * i.minVw;
  const rem = (px: number) => `${num(px / i.rootPx, 4)}rem`;
  const vw = `${num(slope * 100, 4)}vw`;
  const preferred = intercept === 0 ? vw : intercept > 0 ? `${rem(intercept)} + ${vw}` : `${vw} - ${rem(-intercept)}`;
  const lo = Math.min(i.minSize, i.maxSize);
  const hi = Math.max(i.minSize, i.maxSize);
  const steps = [
    `slope = (${num(i.maxSize, 4)} - ${num(i.minSize, 4)}) / (${num(i.maxVw, 4)} - ${num(i.minVw, 4)}) = ${num(slope, 6)} px per px = ${num(slope * 100, 4)}vw`,
    `intercept = ${num(i.minSize, 4)} - ${num(slope, 6)} x ${num(i.minVw, 4)} = ${num(intercept, 4)}px = ${num(intercept / i.rootPx, 4)}rem (at ${num(i.rootPx, 4)}px per rem)`,
    `preferred = ${preferred}`,
    `bounds = ${rem(lo)} to ${rem(hi)}`,
  ];
  return {
    ok: true,
    result: {
      css: `clamp(${rem(lo)}, ${preferred}, ${rem(hi)})`,
      preferred,
      slope,
      intercept,
      lo,
      hi,
      steps,
      valueAt: (w) => Math.min(hi, Math.max(lo, intercept + slope * w)),
    },
  };
}

export type FluidProp = 'font-size' | 'padding' | 'margin' | 'gap';
export const FLUID_PROPS: { value: FluidProp; label: string; tw: string }[] = [
  { value: 'font-size', label: 'font-size', tw: 'text-[length:' },
  { value: 'padding', label: 'padding', tw: 'p-[' },
  { value: 'margin', label: 'margin', tw: 'm-[' },
  { value: 'gap', label: 'gap', tw: 'gap-[' },
];
export const fluidDeclaration = (css: string, prop: FluidProp) => `${prop}: ${css};`;
export function fluidTailwind(css: string, prop: FluidProp): string {
  const p = FLUID_PROPS.find((x) => x.value === prop)!;
  return `${p.tw}${tw(css)}]`;
}

/* ----------------------------------------------------------- cubic-bezier */

export type Bezier = [number, number, number, number];

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
/** x values must stay in 0-1 for a valid easing; y may overshoot (within a sane range). */
export const normaliseBezier = (b: Bezier): Bezier => [clamp(b[0], 0, 1), clamp(b[1], -2, 3), clamp(b[2], 0, 1), clamp(b[3], -2, 3)];
export const bezierCss = (b: Bezier) => `cubic-bezier(${normaliseBezier(b).map((n) => num(n, 2)).join(', ')})`;
export const bezierTailwind = (b: Bezier) => `ease-[${bezierCss(b).replace(/, /g, ',')}]`;

/** Parses "cubic-bezier(a, b, c, d)" or a keyword; null when it is neither. */
export function parseBezier(s: string): Bezier | null {
  const t = s.trim().toLowerCase();
  const kw = BEZIER_PRESETS.find((p) => p.css === t);
  if (kw) return kw.value;
  const m = /^cubic-bezier\(\s*([^,()]+),([^,()]+),([^,()]+),([^,()]+)\)$/.exec(t);
  if (!m) return null;
  const n = m.slice(1, 5).map((x) => (x.trim() === '' ? NaN : Number(x)));
  if (n.some((x) => !Number.isFinite(x)) || n[0] < 0 || n[0] > 1 || n[2] < 0 || n[2] > 1) return null;
  return n as Bezier;
}

export const BEZIER_PRESETS: { name: string; css: string; value: Bezier }[] = [
  { name: 'ease', css: 'ease', value: [0.25, 0.1, 0.25, 1] },
  { name: 'ease-in', css: 'ease-in', value: [0.42, 0, 1, 1] },
  { name: 'ease-out', css: 'ease-out', value: [0, 0, 0.58, 1] },
  { name: 'ease-in-out', css: 'ease-in-out', value: [0.42, 0, 0.58, 1] },
  { name: 'linear', css: 'linear', value: [0, 0, 1, 1] },
  { name: 'ease-out-cubic', css: 'cubic-bezier(0.215, 0.61, 0.355, 1)', value: [0.215, 0.61, 0.355, 1] },
  { name: 'ease-in-out-cubic', css: 'cubic-bezier(0.645, 0.045, 0.355, 1)', value: [0.645, 0.045, 0.355, 1] },
  { name: 'ease-out-back', css: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', value: [0.175, 0.885, 0.32, 1.275] },
  { name: 'ease-in-back', css: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)', value: [0.6, -0.28, 0.735, 0.045] },
  { name: 'ease-out-expo', css: 'cubic-bezier(0.16, 1, 0.3, 1)', value: [0.16, 1, 0.3, 1] },
];

/** y(x) of the curve, found by solving x(t) = x with bisection. For tests and the curve graph. */
export function bezierY(b: Bezier, x: number): number {
  const [x1, y1, x2, y2] = b;
  const at = (t: number, a: number, c: number) => 3 * a * t * (1 - t) ** 2 + 3 * c * t * t * (1 - t) + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid, x1, x2) < x) lo = mid;
    else hi = mid;
  }
  return at((lo + hi) / 2, y1, y2);
}
