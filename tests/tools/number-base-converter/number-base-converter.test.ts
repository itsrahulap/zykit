import { describe, expect, it } from 'vitest';
import {
  bitLength,
  bitwise,
  charInfo,
  codesToText,
  decodeFloatBits,
  exactDecimal,
  floatBits,
  parseFloatInput,
  parseInteger,
  toBase,
  twosComplement,
} from '../../../src/tools/number-base-converter/features/number-base-converter';

const val = (s: string, base: number | 'auto' = 'auto') => {
  const r = parseInteger(s, base);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

describe('parseInteger', () => {
  it('reads prefixes and bases', () => {
    expect(val('255')).toBe(255n);
    expect(val('0xff')).toBe(255n);
    expect(val('0XFF')).toBe(255n);
    expect(val('0b1111_1111')).toBe(255n);
    expect(val('0o377')).toBe(255n);
    expect(val('ff', 16)).toBe(255n);
    expect(val('0b1', 16)).toBe(0xb1n);
    expect(val('#ff', 16)).toBe(255n);
    expect(val('zz', 36)).toBe(1295n);
    expect(val('-101', 2)).toBe(-5n);
    expect(val('1,000,000')).toBe(1_000_000n);
  });

  it('keeps arbitrary precision', () => {
    const big = '123456789012345678901234567890123456789';
    expect(val(big).toString()).toBe(big);
    expect(toBase(val('0x' + 'f'.repeat(40)), 16)).toBe('f'.repeat(40));
  });

  it('rejects bad digits with a position', () => {
    const r = parseInteger('12a', 10);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/“a” isn't a base-10 digit \(position 3\)/);
    expect(parseInteger('2', 2).ok).toBe(false);
    expect(parseInteger('', 10).ok).toBe(false);
    expect(parseInteger('0x', 'auto').ok).toBe(false);
    expect(parseInteger('1', 37).ok).toBe(false);
  });
});

describe('toBase', () => {
  it('formats with grouping and case', () => {
    expect(toBase(255n, 2)).toBe('11111111');
    expect(toBase(255n, 2, { group: true })).toBe('1111 1111');
    expect(toBase(0x1abcden, 16, { group: true, upper: true })).toBe('1A BCDE');
    expect(toBase(1234567n, 10, { group: true })).toBe('1,234,567');
    expect(toBase(-255n, 16)).toBe('-ff');
    expect(toBase(8n, 8, { group: true })).toBe('10');
  });

  it('measures bit length', () => {
    expect(bitLength(0n)).toBe(1);
    expect(bitLength(255n)).toBe(8);
    expect(bitLength(256n)).toBe(9);
    expect(bitLength(-128n)).toBe(8);
    expect(bitLength(-129n)).toBe(9);
  });
});

describe('twosComplement', () => {
  it('wraps negatives', () => {
    const t = twosComplement(-1n, 8);
    expect(t.fits).toBe(true);
    expect(t.unsigned).toBe(255n);
    expect(t.binary).toBe('1111 1111');
    expect(t.hex).toBe('FF');
    expect(twosComplement(-128n, 8).fits).toBe(true);
    expect(twosComplement(-129n, 8).fits).toBe(false);
    expect(twosComplement(255n, 8).signed).toBe(-1n);
    expect(twosComplement(256n, 8).fits).toBe(false);
    expect(twosComplement(-1n, 64).hex).toBe('FFFFFFFFFFFFFFFF');
    expect(twosComplement(0x8000n, 16).signed).toBe(-32768n);
  });
});

describe('IEEE-754', () => {
  it('lays out float64 bits', () => {
    const f = floatBits(1, 64);
    expect(f.sign).toBe('0');
    expect(f.exponent).toBe('01111111111');
    expect(f.mantissa).toBe('0'.repeat(52));
    expect(f.hex).toBe('3FF0000000000000');
    expect(f.kind).toBe('normal');
    expect(f.exponentValue).toBe(0);
  });

  it('shows the exact stored value', () => {
    expect(floatBits(0.1, 64).exact).toBe('0.1000000000000000055511151231257827021181583404541015625');
    expect(floatBits(0.1, 32).exact).toBe('0.100000001490116119384765625');
    expect(floatBits(0.1, 32).hex).toBe('3DCCCCCD');
    expect(floatBits(-2.5, 32).exact).toBe('-2.5');
    expect(exactDecimal(3n, 4)).toBe('48');
  });

  it('classifies special values', () => {
    expect(floatBits(0, 32).kind).toBe('zero');
    expect(floatBits(-0, 64).exact).toBe('-0');
    expect(floatBits(-0, 64).sign).toBe('1');
    expect(floatBits(Infinity, 32).kind).toBe('infinity');
    expect(floatBits(-Infinity, 64).exact).toBe('-Infinity');
    expect(floatBits(NaN, 64).kind).toBe('nan');
    expect(floatBits(5e-324, 64).kind).toBe('subnormal');
    expect(floatBits(5e-324, 64).exponentValue).toBe(-1022);
    expect(floatBits(1e-45, 32).kind).toBe('subnormal');
    expect(floatBits(1e40, 32).kind).toBe('infinity'); // overflows float32
  });

  it('decodes raw bits', () => {
    expect(decodeFloatBits(0x40490fdbn, 32).value).toBeCloseTo(Math.PI, 6);
    expect(decodeFloatBits(0x7ff8000000000000n, 64).kind).toBe('nan');
  });

  it('parses float input', () => {
    expect(parseFloatInput('1.5e3')).toBe(1500);
    expect(parseFloatInput('-inf')).toBe(-Infinity);
    expect(parseFloatInput('NaN')).toBeNaN();
    expect(parseFloatInput('.5')).toBe(0.5);
    expect(parseFloatInput('abc')).toBeNull();
  });
});

describe('bitwise', () => {
  const run = (op: Parameters<typeof bitwise>[0], a: bigint, b: bigint, bits = 8) => {
    const r = bitwise(op, a, b, bits);
    if (!r.ok) throw new Error(r.error);
    return r;
  };
  it('does logic ops within a width', () => {
    expect(run('and', 0b1100n, 0b1010n).unsigned).toBe(0b1000n);
    expect(run('or', 0b1100n, 0b1010n).unsigned).toBe(0b1110n);
    expect(run('xor', 0b1100n, 0b1010n).unsigned).toBe(0b0110n);
    expect(run('nand', 0xffn, 0x0fn).unsigned).toBe(0xf0n);
    expect(run('nor', 0n, 0n).unsigned).toBe(0xffn);
    expect(run('not', 0n, 0n).unsigned).toBe(255n);
    expect(run('not', 0n, 0n).signed).toBe(-1n);
    expect(run('and', -1n, 0x0fn).unsigned).toBe(0x0fn);
  });
  it('shifts and rotates', () => {
    expect(run('shl', 0x81n, 1n).unsigned).toBe(0x02n);
    expect(run('shr', 0x80n, 7n).unsigned).toBe(1n);
    expect(run('sar', 0x80n, 7n).unsigned).toBe(0xffn);
    expect(run('rol', 0x81n, 1n).unsigned).toBe(0x03n);
    expect(run('ror', 0x81n, 1n).unsigned).toBe(0xc0n);
    expect(run('rol', 0x81n, 8n).unsigned).toBe(0x81n);
    expect(run('shl', 1n, 100n, 128).unsigned).toBe(1n << 100n);
    expect(bitwise('shl', 1n, -1n, 8).ok).toBe(false);
    expect(bitwise('and', 1n, 1n, 0).ok).toBe(false);
  });
});

describe('characters', () => {
  it('describes code points and UTF-8', () => {
    const [a, e, smile] = charInfo('Aé😀');
    expect(a).toMatchObject({ codePoint: 65, unicode: 'U+0041', utf8: '41', ascii: true });
    expect(e).toMatchObject({ unicode: 'U+00E9', utf8: 'C3 A9', ascii: false });
    expect(smile).toMatchObject({ unicode: 'U+1F600', utf8: 'F0 9F 98 80', utf16: 'D83D DE00' });
  });
  it('turns codes into text', () => {
    expect(codesToText('72 105')).toEqual({ ok: true, text: 'Hi' });
    expect(codesToText('0x48, 0x69')).toEqual({ ok: true, text: 'Hi' });
    expect(codesToText('U+1F600')).toEqual({ ok: true, text: '😀' });
    expect(codesToText('48h 69h')).toEqual({ ok: true, text: 'Hi' });
    expect(codesToText('')).toEqual({ ok: true, text: '' });
    expect(codesToText('0x110000').ok).toBe(false);
    expect(codesToText('0xd800').ok).toBe(false);
    expect(codesToText('zz').ok).toBe(false);
  });
});
