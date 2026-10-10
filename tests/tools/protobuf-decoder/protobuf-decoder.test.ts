import { describe, expect, it } from 'vitest';
import { LIMITS, bytesFromText, decodeGrpc, decodeMessage, fieldsToText } from '../../../src/tools/protobuf-decoder/features/protobuf-decoder';

const hex = (s: string) => bytesFromText(s, 'hex');
const str = (s: string) => Array.from(new TextEncoder().encode(s));

describe('varint fields', () => {
  it('decodes the canonical 150 example with alternatives', () => {
    const r = decodeMessage(hex('08 96 01'));
    expect(r.error).toBeUndefined();
    expect(r.fields).toHaveLength(1);
    expect(r.fields[0]).toMatchObject({ num: 1, wire: 0, offset: 0, end: 3, value: '150' });
    expect(r.fields[0].alts).toContain('sint (zigzag): 75');
  });
  it('shows negative int64 and bool readings', () => {
    const neg = decodeMessage(hex('08 ff ff ff ff ff ff ff ff ff 01')).fields[0];
    expect(neg.value).toBe('18446744073709551615');
    expect(neg.alts).toContain('int64: -1');
    expect(decodeMessage(hex('10 01')).fields[0].alts).toContain('bool: true');
  });
  it('rejects varints over 64 bits or 10 bytes', () => {
    expect(decodeMessage(hex('08 ff ff ff ff ff ff ff ff ff 7f')).error?.message).toMatch(/larger than 64 bits/);
    expect(decodeMessage(hex('08 80 80 80 80 80 80 80 80 80 80 01')).error?.message).toMatch(/longer than 10/);
  });
});

describe('fixed fields', () => {
  it('fixed64 as uint, int and double', () => {
    const f = decodeMessage(hex('09 00 00 00 00 00 00 f0 3f')).fields[0];
    expect(f).toMatchObject({ wire: 1, kind: 'fixed64', value: '4607182418800017408' });
    expect(f.alts).toContain('double: 1');
  });
  it('fixed32 as uint, int and float', () => {
    const f = decodeMessage(hex('15 00 00 20 c1')).fields[0];
    expect(f.alts).toContain('float: -10');
    expect(f.alts).toContain('int32: -1054867456');
  });
});

describe('length-delimited fields', () => {
  it('string', () => {
    const f = decodeMessage(Uint8Array.from([0x12, 7, ...str('testing')])).fields[0];
    expect(f).toMatchObject({ kind: 'string', value: '"testing"' });
  });
  it('nested message with offsets', () => {
    const r = decodeMessage(hex('1a 03 08 96 01'));
    const m = r.fields[0];
    expect(m.kind).toBe('message');
    expect(m.children?.[0]).toMatchObject({ num: 1, value: '150', offset: 2, end: 5 });
    expect(fieldsToText(r.fields)).toBe('3 (len, @0): message\n  1 (varint, @2): 150');
  });
  it('invalid UTF-8 and control bytes become bytes with packed readings', () => {
    expect(decodeMessage(hex('12 03 ff fe fd')).fields[0].kind).toBe('bytes');
    const p = decodeMessage(hex('12 03 01 02 03')).fields[0];
    expect(p.kind).toBe('bytes');
    expect(p.alts).toContain('packed varints: 1, 2, 3');
  });
  it('a string that is not a message stays a string and offers bytes', () => {
    const f = decodeMessage(Uint8Array.from([0x12, 5, ...str('hello')])).fields[0];
    expect(f.kind).toBe('string');
    expect(f.alts[0]).toMatch(/^bytes: 68 65/);
  });
  it('message that is also text lists the string reading', () => {
    const f = decodeMessage(hex('12 02 28 29')).fields[0];
    expect(f.kind).toBe('message');
    expect(f.alts).toContain('string: "()"');
  });
  it('empty payload is an empty string', () => {
    expect(decodeMessage(hex('12 00')).fields[0]).toMatchObject({ kind: 'string', value: '""' });
  });
});

describe('errors and limits', () => {
  it('keeps fields read before a truncation', () => {
    const r = decodeMessage(hex('08 01 12 05 61 62'));
    expect(r.fields).toHaveLength(1);
    expect(r.error).toMatchObject({ offset: 2 });
    expect(r.error?.message).toMatch(/declares 5 bytes but 2 remain/);
  });
  it('truncated varint, fixed32, fixed64 and tag', () => {
    expect(decodeMessage(hex('08 96')).error?.message).toMatch(/Truncated varint at offset 1/);
    expect(decodeMessage(hex('15 00 00')).error?.message).toMatch(/Truncated fixed32/);
    expect(decodeMessage(hex('09 00')).error?.message).toMatch(/Truncated fixed64/);
    expect(decodeMessage(hex('88')).error?.message).toMatch(/Truncated varint/);
  });
  it('invalid tags', () => {
    expect(decodeMessage(hex('00')).error?.message).toMatch(/field number 0/);
    expect(decodeMessage(hex('0e')).error?.message).toMatch(/wire type 6/);
    expect(decodeMessage(hex('0b')).error?.message).toMatch(/group/);
  });
  it('caps nesting depth', () => {
    let inner = [0x08, 0x01];
    for (let i = 0; i < LIMITS.depth + 4; i++) inner = [0x0a, inner.length, ...inner];
    let f = decodeMessage(Uint8Array.from(inner)).fields[0];
    let depth = 0;
    while (f.children) {
      f = f.children[0];
      depth++;
    }
    expect(depth).toBe(LIMITS.depth);
  });
  it('caps the number of fields', () => {
    const r = decodeMessage(new Uint8Array(LIMITS.fields * 2 + 2).map((_, i) => (i % 2 ? 1 : 8)));
    expect(r.error?.message).toMatch(/More than/);
  });
});

describe('gRPC frames and text input', () => {
  it('splits frames', () => {
    const r = decodeGrpc(hex('00 00 00 00 03 08 96 01  00 00 00 00 02 10 01'));
    expect(r.error).toBeUndefined();
    expect(r.frames.map((f) => [f.offset, f.length, f.result.fields[0].value])).toEqual([[0, 3, '150'], [8, 2, '1']]);
  });
  it('flags compressed, truncated and non-gRPC input', () => {
    expect(decodeGrpc(hex('01 00 00 00 01 aa')).frames[0].compressed).toBe(true);
    expect(decodeGrpc(hex('00 00 00 00 09 08')).error?.message).toMatch(/declares 9 bytes but 1 remain/);
    expect(decodeGrpc(hex('00 00 00')).error?.message).toMatch(/header/);
    expect(decodeGrpc(hex('08 96 01 00 00 00')).error?.message).toMatch(/does not look like/);
  });
  it('reads hex, base64 and base64url', () => {
    expect(Array.from(bytesFromText('0x08, 0x96 0x01'))).toEqual([8, 0x96, 1]);
    expect(Array.from(bytesFromText('CJYB'))).toEqual([8, 0x96, 1]);
    expect(Array.from(bytesFromText('-_8', 'base64url'))).toEqual([0xfb, 0xff]);
    expect(() => bytesFromText('abc', 'hex')).toThrow(/even/);
    expect(() => bytesFromText('zz', 'hex')).toThrow(/hex/);
  });
});
