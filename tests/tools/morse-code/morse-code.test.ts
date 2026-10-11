import { describe, expect, it } from 'vitest';
import { decode, encode, gapUnitMs, timeline, totalMs, unitMs } from '../../../src/tools/morse-code/features/morse-code';

describe('Morse Code', () => {
  it('encodes letters, digits, punctuation and separators', () => {
    expect(encode('SOS').morse).toBe('... --- ...');
    expect(encode('a 1?').morse).toBe('.-   .---- ..--..');
    expect(encode('a 1', 'slash').morse).toBe('.- / .----');
  });
  it('encodes prosigns and strips accents, listing skipped characters', () => {
    expect(encode('<SOS> <AR>').morse).toBe('...---...   .-.-.');
    expect(encode('é#').skipped).toEqual(['#']);
    expect(encode('é').morse).toBe('.');
  });
  it('decodes tolerantly', () => {
    expect(decode('... --- ...')).toBe('SOS');
    expect(decode('.-   -...')).toBe('A B');
    expect(decode('.- / -...')).toBe('A B');
    expect(decode('·– | –···')).toBe('A B');
    expect(decode('.-\n-...')).toBe('A B');
    expect(decode('.......... .-')).toBe('�A');
    expect(decode('.-.-.')).toBe('+');
    expect(decode('...---...')).toBe('<SOS>');
  });
  it('round trips', () => {
    const t = 'HELLO, WORLD 123';
    expect(decode(encode(t).morse)).toBe(t);
  });
  it('times by PARIS', () => {
    expect(unitMs(20)).toBe(60);
    const tl = timeline('.-', 20);
    expect(tl).toEqual([{ tone: true, ms: 60 }, { tone: false, ms: 60 }, { tone: true, ms: 180 }]);
    // PARIS is 50 units including the 7-unit word gap after it
    expect(totalMs(timeline('.--. .- .-. .. ...', 20))).toBe(43 * 60);
  });
  it('spaces letters and words, with Farnsworth stretching only the gaps', () => {
    const normal = timeline('. . / .', 20);
    expect(normal.map((x) => x.ms)).toEqual([60, 180, 60, 420, 60]);
    expect(gapUnitMs(20, 20)).toBe(60);
    const slow = timeline('. . / .', 20, 10);
    expect(slow[0].ms).toBe(60);
    expect(slow[1].ms).toBeGreaterThan(180);
    expect(gapUnitMs(20, 10)).toBeCloseTo(((60 * 20 - 37.2 * 10) / 200 / 19) * 1000, 6);
  });
});
