import { describe, expect, it } from 'vitest';
import {
  BEZIER_PRESETS,
  bezierCss,
  bezierTailwind,
  bezierY,
  borderRadiusValue,
  boxShadowDeclaration,
  boxShadowTailwind,
  boxShadowValue,
  fluid,
  fluidTailwind,
  gradientCss,
  gradientTailwind,
  num,
  parseBezier,
  textShadowDeclaration,
  textShadowTailwind,
  withAlpha,
  type Corners,
  type Gradient,
} from '../../../src/tools/css-generator/features/css';
import { restore } from '../../../src/tools/css-generator/features/state';

const grad: Gradient = {
  kind: 'linear',
  angle: 135,
  repeat: false,
  shape: 'circle',
  cx: 50,
  cy: 50,
  stops: [
    { color: '#0000ff', alpha: 1, pos: 100 },
    { color: '#ff0000', alpha: 1, pos: 0 },
  ],
};

describe('helpers', () => {
  it('formats numbers and alpha colours', () => {
    expect(num(0.5)).toBe('0.5');
    expect(num(-0.001)).toBe('0');
    expect(withAlpha('#FF0000', 1)).toBe('#ff0000');
    expect(withAlpha('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    expect(withAlpha('red', 0.5)).toBe('red');
  });
});

describe('gradients', () => {
  it('sorts stops and builds linear', () => {
    expect(gradientCss(grad)).toBe('linear-gradient(135deg, #ff0000 0%, #0000ff 100%)');
  });
  it('builds radial, conic and repeating', () => {
    expect(gradientCss({ ...grad, kind: 'radial', cx: 30, cy: 70 })).toBe('radial-gradient(circle at 30% 70%, #ff0000 0%, #0000ff 100%)');
    expect(gradientCss({ ...grad, kind: 'conic', angle: 90 })).toBe('conic-gradient(from 90deg at 50% 50%, #ff0000 0%, #0000ff 100%)');
    expect(gradientCss({ ...grad, repeat: true })).toMatch(/^repeating-linear-gradient\(/);
  });
  it('keeps alpha and makes a Tailwind class without spaces', () => {
    const g = { ...grad, stops: [{ color: '#000000', alpha: 0.5, pos: 0 }, grad.stops[0]] };
    expect(gradientCss(g)).toContain('rgba(0, 0, 0, 0.5) 0%');
    expect(gradientTailwind(grad)).toBe('bg-[linear-gradient(135deg,_#ff0000_0%,_#0000ff_100%)]');
  });
});

describe('shadows', () => {
  const layer = { x: 0, y: 4, blur: 6, spread: -1, color: '#000000', alpha: 0.2, inset: false };
  it('builds box-shadow layers', () => {
    expect(boxShadowValue([layer])).toBe('0px 4px 6px -1px rgba(0, 0, 0, 0.2)');
    expect(boxShadowValue([{ ...layer, inset: true, alpha: 1 }])).toBe('inset 0px 4px 6px -1px #000000');
    expect(boxShadowValue([])).toBe('none');
    expect(boxShadowDeclaration([layer, layer])).toBe('box-shadow: \n  0px 4px 6px -1px rgba(0, 0, 0, 0.2),\n  0px 4px 6px -1px rgba(0, 0, 0, 0.2);');
    expect(boxShadowTailwind([layer, { ...layer, inset: true }])).toBe('shadow-[0px_4px_6px_-1px_rgba(0,_0,_0,_0.2),inset_0px_4px_6px_-1px_rgba(0,_0,_0,_0.2)]');
  });
  it('builds text-shadow', () => {
    const t = { x: 1, y: 2, blur: -3, color: '#112233', alpha: 1 };
    expect(textShadowDeclaration([t])).toBe('text-shadow: 1px 2px 0px #112233;');
    expect(textShadowTailwind([t])).toBe('[text-shadow:1px_2px_0px_#112233]');
  });
});

describe('border radius', () => {
  const c = (...v: [number, number][]): Corners => v.map(([h, vv]) => ({ h, v: vv })) as Corners;
  it('collapses to the shortest shorthand', () => {
    expect(borderRadiusValue(c([8, 8], [8, 8], [8, 8], [8, 8]), 'px')).toBe('8px');
    expect(borderRadiusValue(c([8, 8], [4, 4], [8, 8], [4, 4]), 'px')).toBe('8px 4px');
    expect(borderRadiusValue(c([8, 8], [4, 4], [6, 6], [4, 4]), 'px')).toBe('8px 4px 6px');
    expect(borderRadiusValue(c([1, 1], [2, 2], [3, 3], [4, 4]), '%')).toBe('1% 2% 3% 4%');
  });
  it('uses a slash for elliptical corners and drops units on 0', () => {
    expect(borderRadiusValue(c([50, 20], [50, 20], [50, 20], [50, 20]), '%')).toBe('50% / 20%');
    expect(borderRadiusValue(c([0, 0], [10, 20], [0, 0], [10, 20]), 'px')).toBe('0 10px / 0 20px');
  });
});

describe('fluid clamp', () => {
  it('computes the standard 16px to 24px example', () => {
    const r = fluid({ minSize: 16, maxSize: 24, minVw: 320, maxVw: 1280, rootPx: 16 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result.css).toBe('clamp(1rem, 0.8333rem + 0.8333vw, 1.5rem)');
    expect(r.result.slope).toBeCloseTo(1 / 120, 8);
    expect(r.result.intercept).toBeCloseTo(40 / 3, 6);
    expect(r.result.valueAt(320)).toBeCloseTo(16, 6);
    expect(r.result.valueAt(1280)).toBeCloseTo(24, 6);
    expect(r.result.valueAt(100)).toBe(16);
    expect(r.result.valueAt(5000)).toBe(24);
    expect(r.result.steps).toHaveLength(4);
  });
  it('handles a negative intercept, a different rem base and shrinking sizes', () => {
    const neg = fluid({ minSize: 16, maxSize: 48, minVw: 400, maxVw: 800, rootPx: 10 });
    expect(neg.ok && neg.result.css).toBe('clamp(1.6rem, 8vw - 1.6rem, 4.8rem)');
    const dec = fluid({ minSize: 24, maxSize: 16, minVw: 320, maxVw: 1280, rootPx: 16 });
    expect(dec.ok && dec.result.css.startsWith('clamp(1rem, ')).toBe(true);
    expect(dec.ok && dec.result.css.endsWith(', 1.5rem)')).toBe(true);
  });
  it('rejects bad input and builds Tailwind classes', () => {
    expect(fluid({ minSize: 16, maxSize: 24, minVw: 800, maxVw: 800, rootPx: 16 }).ok).toBe(false);
    expect(fluid({ minSize: 16, maxSize: 24, minVw: 320, maxVw: 1280, rootPx: 0 }).ok).toBe(false);
    expect(fluid({ minSize: NaN, maxSize: 24, minVw: 320, maxVw: 1280, rootPx: 16 }).ok).toBe(false);
    expect(fluidTailwind('clamp(1rem, 2vw, 2rem)', 'font-size')).toBe('text-[length:clamp(1rem,_2vw,_2rem)]');
    expect(fluidTailwind('clamp(1rem, 2vw, 2rem)', 'padding')).toBe('p-[clamp(1rem,_2vw,_2rem)]');
  });
});

describe('cubic-bezier', () => {
  it('formats and clamps', () => {
    expect(bezierCss([0.25, 0.1, 0.25, 1])).toBe('cubic-bezier(0.25, 0.1, 0.25, 1)');
    expect(bezierCss([1.5, 0.123, -1, 5])).toBe('cubic-bezier(1, 0.12, 0, 3)');
    expect(bezierTailwind([0.4, 0, 0.2, 1])).toBe('ease-[cubic-bezier(0.4,0,0.2,1)]');
  });
  it('parses functions and keywords', () => {
    expect(parseBezier('cubic-bezier(0.1,0.2, 0.3 ,0.4)')).toEqual([0.1, 0.2, 0.3, 0.4]);
    expect(parseBezier('ease-in')).toEqual([0.42, 0, 1, 1]);
    expect(parseBezier('cubic-bezier(2, 0, 0, 1)')).toBeNull();
    expect(parseBezier('cubic-bezier(a,0,0,1)')).toBeNull();
    expect(parseBezier('nope')).toBeNull();
  });
  it('solves y(x): linear is identity, ends are fixed', () => {
    expect(bezierY([0, 0, 1, 1], 0.3)).toBeCloseTo(0.3, 4);
    const b = BEZIER_PRESETS[3].value;
    expect(bezierY(b, 0)).toBeCloseTo(0, 4);
    expect(bezierY(b, 1)).toBeCloseTo(1, 4);
    expect(bezierY(b, 0.5)).toBeCloseTo(0.5, 3);
  });
});

describe('restore', () => {
  it('keeps only values with matching shapes', () => {
    const base = { a: 1, s: 'x', list: [{ n: 1 }], o: { k: true } };
    expect(restore(base, { a: 'bad', s: 'y', list: [{ n: 5 }, { n: 'z' }], o: { k: false }, extra: 1 })).toEqual({ a: 1, s: 'y', list: [{ n: 5 }, { n: 1 }], o: { k: false } });
    expect(restore(base, 'junk')).toEqual(base);
  });
});
