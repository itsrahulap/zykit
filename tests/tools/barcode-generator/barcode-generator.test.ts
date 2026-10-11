import { describe, expect, it } from 'vitest';
import {
  BarcodeError,
  CODE128_PATTERNS,
  CODE39_CHARS,
  CODE39_PATTERNS,
  code128,
  code128Values,
  code39,
  drawToCanvas,
  ean13,
  ean8,
  encode,
  gs1CheckDigit,
  itf14,
  layout,
  toSvg,
  upca,
} from '../../../src/tools/barcode-generator/features/barcode-generator';

const opts = { moduleWidth: 2, height: 80, quiet: 10, showText: true, fontSize: 12, fg: '#000000', bg: '#ffffff' };

describe('Code 128', () => {
  it('has a consistent symbol table', () => {
    expect(CODE128_PATTERNS).toHaveLength(107);
    expect(new Set(CODE128_PATTERNS).size).toBe(107);
    CODE128_PATTERNS.slice(0, 106).forEach((p) => {
      const w = [...p].map(Number);
      expect(w).toHaveLength(6);
      expect(w.reduce((a, b) => a + b)).toBe(11);
      expect((w[0] + w[2] + w[4]) % 2).toBe(0); // bar widths sum to an even number
    });
    expect(CODE128_PATTERNS[0]).toBe('212222');
    expect(CODE128_PATTERNS[104]).toBe('211214');
    expect(CODE128_PATTERNS[106]).toBe('2331112');
  });
  it('encodes PJJ123C in set B with check symbol 55', () => {
    const e = code128('PJJ123C');
    expect(code128Values('PJJ123C')).toEqual([104, 48, 42, 42, 17, 18, 19, 35]);
    expect(e.checkDigit).toBe('55');
    expect(e.bits.length).toBe(11 * 9 + 13);
    expect(e.bits.endsWith('1100011101011')).toBe(true); // stop + final bar
  });
  it('chooses sets automatically', () => {
    expect(code128Values('12345678')).toEqual([105, 12, 34, 56, 78]);
    expect(code128Values('ABC')).toEqual([104, 33, 34, 35]);
    // digits in the middle switch to C and back
    expect(code128Values('AB123456CD')).toEqual([104, 33, 34, 99, 12, 34, 56, 100, 35, 36]);
    // odd digit run: C pairs then the lone digit in set B (same length as the alternative)
    expect(code128Values('12345')).toEqual([105, 12, 34, 100, 21]);
    expect(code128Values('\tA')).toEqual([103, 73, 33]);
  });
  it('honours a forced set and validates input', () => {
    expect(code128Values('1234', 'B')).toEqual([104, 17, 18, 19, 20]);
    expect(() => code128('123', 'C')).toThrow(BarcodeError);
    expect(() => code128('abc', 'A')).toThrow(/set A/);
    expect(() => code128('é')).toThrow(/ASCII/);
    expect(() => code128('')).toThrow(BarcodeError);
  });
  it('decodes back to the same symbols', () => {
    const e = code128('Hello, World 12345!');
    const bitsOf = (p: string) => [...p].map((w, k) => (k % 2 ? '0' : '1').repeat(Number(w))).join('');
    const index = new Map(CODE128_PATTERNS.map((p, i) => [bitsOf(p), i]));
    const body = e.bits.slice(0, -13);
    const vals = body.match(/.{11}/g)!.map((c) => index.get(c));
    expect(vals.every((v) => v !== undefined)).toBe(true);
    const v = vals as number[];
    expect(v[0]).toBe(104);
    const check = v.slice(0, -1).reduce((sum, x, i) => sum + x * (i || 1), 0) % 103;
    expect(v.at(-1)).toBe(check);
    expect(e.bits.endsWith(bitsOf('2331112'))).toBe(true);
  });
});

describe('Code 39', () => {
  it('has 44 distinct patterns with three wide elements', () => {
    expect(CODE39_PATTERNS).toHaveLength(44);
    expect(new Set(CODE39_PATTERNS).size).toBe(44);
    CODE39_PATTERNS.forEach((p) => {
      expect(p).toHaveLength(9);
      expect([...p].filter((c) => c === 'w')).toHaveLength(3);
    });
  });
  it('encodes with start/stop stars and 1:3 ratio', () => {
    const bitsOf = (p: string) => [...p].map((w, k) => (k % 2 ? '0' : '1').repeat(w === 'w' ? 3 : 1)).join('');
    const star = bitsOf('nwnnwnwnn');
    expect(code39('A').bits).toBe([star, bitsOf('wnnnnwnnw'), star].join('0'));
    expect(code39('A').label[0].text).toBe('*A*');
  });
  it('adds the mod-43 check character', () => {
    expect(code39('CODE39', true).checkDigit).toBe('W');
    expect(code39('code39', true).data).toBe('CODE39W');
    expect(CODE39_CHARS[42]).toBe('%');
  });
  it('rejects unsupported characters', () => {
    expect(() => code39('a_b')).toThrow(/“_”/);
  });
});

describe('EAN / UPC / ITF', () => {
  it('computes GS1 check digits', () => {
    expect(gs1CheckDigit('400638133393')).toBe('1');
    expect(gs1CheckDigit('590123412345')).toBe('7');
    expect(gs1CheckDigit('9638507')).toBe('4');
    expect(gs1CheckDigit('03600029145')).toBe('2');
    expect(gs1CheckDigit('0001234560001')).toBe('2');
  });
  it('lays out EAN-13 correctly', () => {
    const e = ean13('590123412345');
    expect(e.data).toBe('5901234123457');
    expect(e.bits).toHaveLength(95);
    expect(e.bits.slice(0, 3)).toBe('101');
    expect(e.bits.slice(45, 50)).toBe('01010');
    expect(e.bits.slice(92)).toBe('101');
    // first digit 5 → parity LGGLLG: 9 is L(9), 0 is G(0)
    expect(e.bits.slice(3, 10)).toBe('0001011');
    expect(e.bits.slice(10, 17)).toBe('0100111');
  });
  it('encodes known EAN-13 digits with the right parity', () => {
    // First digit 0 → all L-codes: L(0)=0001101, L(3)=0111101
    const e = upca('03600029145');
    expect(e.data).toBe('036000291452');
    expect(e.bits.startsWith('101' + '0001101' + '0111101')).toBe(true);
    expect(e.bits).toHaveLength(95);
    expect(e.outer).toEqual({ left: '0', right: '2' });
    // right half uses R-codes: R(2)=1101100 is the last digit
    expect(e.bits.slice(85, 92)).toBe('1101100');
    // first digit 4 → parity LGLLGG: second digit is G(0) = 0100111
    expect(ean13('4006381333931').bits.slice(3 + 7, 3 + 14)).toBe('0100111');
  });
  it('encodes EAN-8', () => {
    const e = ean8('9638507');
    expect(e.data).toBe('96385074');
    expect(e.bits).toHaveLength(67);
    expect(e.bits.slice(3, 10)).toBe('0001011'); // L(9)
    expect(e.bits.slice(31, 36)).toBe('01010');
  });
  it('encodes ITF-14', () => {
    const e = itf14('0001234560001');
    expect(e.data).toBe('00012345600012');
    expect(e.bits.startsWith('1010')).toBe(true);
    expect(e.bits.endsWith('11101')).toBe(true);
    // first pair "00": bars and spaces both nnwwn, interleaved
    expect(e.bits.slice(4, 22)).toBe('10' + '10' + '111000' + '111000' + '10');
  });
  it('verifies supplied check digits and rejects bad input', () => {
    expect(() => ean13('5901234123450')).toThrow(/should be 7/);
    expect(() => ean13('12345')).toThrow(/12 digits/);
    expect(() => upca('12a')).toThrow(/digits only/);
    expect(() => ean8('96385074')).not.toThrow();
  });
});

describe('layout and output', () => {
  it('sizes and merges bars', () => {
    const e = encode('code39', 'A');
    const l = layout(e, opts);
    expect(l.width).toBe((e.bits.length + 20) * 2);
    expect(l.bars[0]).toEqual({ x: 20, w: 2 });
    expect(l.height).toBe(80 + 12 + 6);
    expect(layout(e, { ...opts, showText: false }).height).toBe(80);
  });
  it('places EAN-13 digits outside the bars and in two groups', () => {
    const l = layout(ean13('5901234123457'), opts);
    expect(l.texts.map((t) => t.text)).toEqual(['901234', '123457', '5']);
  });
  it('writes SVG and validates colours', () => {
    const l = layout(encode('code128', 'a<b&c'), opts);
    const svg = toSvg(l, opts);
    expect(svg).toContain('a&lt;b&amp;c');
    expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 \d+ \d+"/);
    expect(() => toSvg(l, { ...opts, fg: 'red' })).toThrow(/#rrggbb/);
  });
  it('draws bars on a canvas context', () => {
    const calls: string[] = [];
    const ctx = { fillRect: (...a: number[]) => calls.push(a.join(',')), fillText: (t: string) => calls.push(t) } as unknown as CanvasRenderingContext2D;
    const l = layout(encode('ean8', '9638507'), opts);
    drawToCanvas(ctx, l, opts);
    expect(calls.filter((c) => c.includes(',')).length).toBe(1 + l.bars.length);
    expect(calls).toContain('9638');
  });
});
