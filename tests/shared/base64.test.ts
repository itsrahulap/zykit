import { describe, expect, it } from 'vitest';
import { base64ToBytes, Base64Error, bytesToBase64, textToBase64, tryBase64ToBytes } from '../../src/shared/lib/base64';
import { bytesToHex, toHex } from '../../src/shared/lib/bytes';

describe('base64', () => {
  it('matches btoa for all byte values', () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(bytesToBase64(bytes)).toBe(btoa(String.fromCharCode(...bytes)));
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });

  it('encodes Base64URL without padding and round-trips it', () => {
    const bytes = Uint8Array.from([0xfb, 0xff, 0xfe]);
    expect(bytesToBase64(bytes)).toBe('+//+');
    expect(bytesToBase64(bytes, true)).toBe('-__-');
    expect(bytesToBase64(Uint8Array.of(0x66), true)).toBe('Zg');
    expect(base64ToBytes('-__-', true)).toEqual(bytes);
  });

  it('encodes text as UTF-8', () => {
    expect(textToBase64('✓ 👋')).toBe('4pyTIPCfkYs=');
    expect(textToBase64('✓ 👋', true)).toBe('4pyTIPCfkYs');
  });

  it('throws Base64Error with helpful messages', () => {
    expect(() => base64ToBytes('ab-c')).toThrow(Base64Error);
    expect(() => base64ToBytes('ab-c')).toThrow('Invalid Base64 character "-" at position 3. That character belongs to Base64URL');
    expect(() => base64ToBytes('Zg=')).toThrow('Invalid Base64 padding.');
    expect(() => base64ToBytes('Zm9vY')).toThrow('Invalid Base64 length');
  });

  it('tryBase64ToBytes returns null instead of throwing', () => {
    expect(tryBase64ToBytes('Zm9v')).toEqual(new TextEncoder().encode('foo'));
    expect(tryBase64ToBytes('Zm9vY')).toBeNull();
  });
});

describe('hex', () => {
  it('formats bytes as lowercase hex with an optional separator', () => {
    expect(bytesToHex(Uint8Array.of(0, 15, 255))).toBe('000fff');
    expect(bytesToHex(Uint8Array.of(0, 15, 255), ':')).toBe('00:0f:ff');
  });

  it('toHex truncates with an ellipsis', () => {
    expect(toHex(Uint8Array.of(1, 2, 3), 2)).toBe('01 02 …');
    expect(toHex(Uint8Array.of(1, 2))).toBe('01 02');
  });
});
