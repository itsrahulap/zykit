import { describe, expect, it } from 'vitest';
import * as p from '../../../src/tools/percentage-calculator/features/percentage-calculator';

describe('Percentage Calculator', () => {
  it('rounds half away from zero', () => {
    expect(p.round(1.005)).toBe(1.01);
    expect(p.round(-1.005)).toBe(-1.01);
    expect(p.round(2.5, 0)).toBe(3);
    expect(p.round(-0.001)).toBe(0);
  });
  it('parses numbers', () => {
    expect(p.parseNum(' 1,250.5 ')).toBe(1250.5);
    expect(p.parseNum('.5')).toBe(0.5);
    expect(p.parseNum('')).toBeNull();
    expect(p.parseNum('1e5')).toBeNull();
  });
  it('X% of Y and X is what % of Y', () => {
    expect(p.percentOf(15, 200)).toBe(30);
    expect(p.whatPercent(30, 200)).toBe(15);
    expect(p.whatPercent(1, 0)).toBeNull();
  });
  it('percentage change', () => {
    expect(p.percentChange(50, 75)).toEqual({ pct: 50, direction: 'increase' });
    expect(p.percentChange(80, 60)).toEqual({ pct: -25, direction: 'decrease' });
    expect(p.percentChange(-10, -5)?.pct).toBe(50);
    expect(p.percentChange(0, 5)).toBeNull();
    expect(p.percentChange(4, 4)?.direction).toBe('unchanged');
  });
  it('add / subtract / reverse', () => {
    expect(p.addPercent(200, 10)).toBeCloseTo(220);
    expect(p.subtractPercent(200, 10)).toBe(180);
    expect(p.reversePercent(120, 20, 'increase')).toBe(100);
    expect(p.reversePercent(80, 20, 'decrease')).toBe(100);
    expect(p.reversePercent(5, 100, 'decrease')).toBeNull();
  });
  it('discounts stack multiplicatively', () => {
    const d = p.discount(1000, [20, 10]);
    expect(d.final).toBeCloseTo(720);
    expect(d.savings).toBeCloseTo(280);
    expect(d.effectivePercent).toBeCloseTo(28);
    expect(p.discount(0, [10]).effectivePercent).toBeNull();
  });
  it('margin and markup', () => {
    const m = p.marginMarkup(80, 100);
    expect(m.profit).toBe(20);
    expect(m.margin).toBe(20);
    expect(m.markup).toBe(25);
    expect(p.priceFromMargin(80, 20)).toBe(100);
    expect(p.priceFromMargin(80, 100)).toBeNull();
    expect(p.priceFromMarkup(80, 25)).toBe(100);
    expect(p.marginMarkup(0, 10).markup).toBeNull();
  });
  it('GST both ways with CGST/SGST halves', () => {
    expect(p.tax(1000, 18, true)).toEqual({ net: 1000, tax: 180, gross: 1180, cgst: 90, sgst: 90 });
    expect(p.tax(1180, 18, false)).toEqual({ net: 1000, tax: 180, gross: 1180, cgst: 90, sgst: 90 });
    const odd = p.tax(100.5, 5, true);
    expect(odd.cgst + odd.sgst).toBeCloseTo(odd.tax);
    expect(p.tax(100, 0, true).tax).toBe(0);
  });
  it('points vs percent', () => {
    expect(p.pointsVsPercent(10, 12)).toEqual({ points: 2, relative: 20 });
    expect(p.pointsVsPercent(0, 3).relative).toBeNull();
  });
});
