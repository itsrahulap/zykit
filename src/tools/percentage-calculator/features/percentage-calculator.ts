// Pure logic for Percentage Calculator: no DOM, so it's unit-testable in Node.
// Functions return full-precision numbers (or null when undefined); `round` is applied for display.

/** Round half away from zero to `dp` places; the toPrecision step stops 1.005 becoming 1.00. */
export function round(x: number, dp = 2): number {
  const f = 10 ** dp;
  return (Math.sign(x) * Math.round(Number((Math.abs(x) * f).toPrecision(12)))) / f || 0;
}

/** Parse a plain decimal ("12", "-3.5", ".5"); null when empty or not a finite number. */
export function parseNum(s: string): number | null {
  const t = s.trim().replace(/,/g, '');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export const percentOf = (x: number, y: number) => (x * y) / 100;
export const whatPercent = (x: number, y: number) => (y === 0 ? null : (x / y) * 100);

export function percentChange(from: number, to: number) {
  if (from === 0) return null;
  const pct = ((to - from) / Math.abs(from)) * 100;
  return { pct, direction: pct > 0 ? ('increase' as const) : pct < 0 ? ('decrease' as const) : ('unchanged' as const) };
}

export const addPercent = (y: number, x: number) => y * (1 + x / 100);
export const subtractPercent = (y: number, x: number) => y * (1 - x / 100);

/** The original value that became `final` after an increase (or decrease) of x%. */
export function reversePercent(final: number, x: number, direction: 'increase' | 'decrease') {
  const k = 1 + (direction === 'increase' ? x : -x) / 100;
  return k === 0 ? null : final / k;
}

/** Discounts apply one after another, each to the already-reduced price. */
export function discount(price: number, percents: number[]) {
  const final = percents.reduce((p, d) => p * (1 - d / 100), price);
  return { final, savings: price - final, effectivePercent: price === 0 ? null : ((price - final) / price) * 100 };
}

export function marginMarkup(cost: number, price: number) {
  const profit = price - cost;
  return { profit, margin: price === 0 ? null : (profit / price) * 100, markup: cost === 0 ? null : (profit / cost) * 100 };
}
/** Selling price for a target margin (share of the price); null at 100% or more. */
export const priceFromMargin = (cost: number, margin: number) => (margin >= 100 ? null : cost / (1 - margin / 100));
export const priceFromMarkup = (cost: number, markup: number) => cost * (1 + markup / 100);

/** GST/VAT. `exclusive`: amount is before tax; otherwise it already includes tax. Tax is rounded to 2 places, net follows. */
export function tax(amount: number, rate: number, exclusive: boolean) {
  const gross = exclusive ? round(amount * (1 + rate / 100)) : round(amount);
  const net = exclusive ? round(amount) : round(amount / (1 + rate / 100));
  const t = round(gross - net);
  const half = round(t / 2);
  return { net, tax: t, gross, cgst: half, sgst: round(t - half) };
}

export function pointsVsPercent(from: number, to: number) {
  return { points: to - from, relative: from === 0 ? null : ((to - from) / Math.abs(from)) * 100 };
}
