import { describe, expect, it } from 'vitest';
import { b64Decode, b64Encode, bcryptHash, bcryptVerify, constantTimeEqual, parseHash, passwordBytes } from '../../../src/tools/bcrypt-generator/features/bcrypt';

const long = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789chars after 72 are ignored';
const vectors: [string, string][] = [
  ['', '$2a$05$CCCCCCCCCCCCCCCCCCCCC.7uG0VCzI2bS7j6ymqJi9CdcdxiRTWNy'],
  ['', '$2a$06$DCq7YPn5Rq63x1Lad4cll.TV4S6ytwfsfvkgY8jIucDrjc8deX1s.'],
  ['U*U', '$2a$05$CCCCCCCCCCCCCCCCCCCCC.E5YPO9kmyuRGyh0XouQYb4YMJKvyOeW'],
  ['U*U*', '$2a$05$CCCCCCCCCCCCCCCCCCCCC.VGOzA784oUp/Z0DY336zx7pLYAy0lwK'],
  ['U*U*U', '$2a$05$XXXXXXXXXXXXXXXXXXXXXOAcXxm9kjPGEMsLznoKqmqw7tc8WCx4a'],
  [long, '$2a$05$abcdefghijklmnopqrstuu5s2v8.iXieOjg/.AySBTTZIIVFJeBui'],
];

describe('bcrypt known vectors', () => {
  it.each(vectors)('verifies %j', (pw, hash) => {
    const p = parseHash(hash)!;
    expect(bcryptHash(pw, p.cost, p.salt, '2a')).toBe(hash);
  });
  it('$2y$ and $2b$ match $2a$ apart from the prefix', () => {
    const p = parseHash('$2a$05$CCCCCCCCCCCCCCCCCCCCC.VGOzA784oUp/Z0DY336zx7pLYAy0lwK')!;
    expect(bcryptHash('U*U*', 5, p.salt, '2y')).toBe('$2y$05$CCCCCCCCCCCCCCCCCCCCC.VGOzA784oUp/Z0DY336zx7pLYAy0lwK');
    expect(bcryptVerify('U*U*', '$2b$05$CCCCCCCCCCCCCCCCCCCCC.VGOzA784oUp/Z0DY336zx7pLYAy0lwK')).toBe(true);
  });
  it('ignores bytes past 72', () => {
    const salt = new Uint8Array(16).fill(7);
    expect(bcryptHash('a'.repeat(72), 4, salt)).toBe(bcryptHash('a'.repeat(80), 4, salt));
    expect(passwordBytes('é'.repeat(40))).toBe(80);
  });
});

describe('helpers', () => {
  it('verify true/false/invalid', () => {
    const h = '$2a$05$CCCCCCCCCCCCCCCCCCCCC.VGOzA784oUp/Z0DY336zx7pLYAy0lwK';
    expect(bcryptVerify('U*U*', h)).toBe(true);
    expect(bcryptVerify('nope', h)).toBe(false);
    expect(bcryptVerify('x', 'not a hash')).toBeNull();
    expect(parseHash('$2a$03$' + 'C'.repeat(53))).toBeNull();
  });
  it('base64 round-trips with the bcrypt alphabet', () => {
    const b = Uint8Array.from({ length: 16 }, (_, i) => i * 17);
    expect(b64Encode(b)).toHaveLength(22);
    expect(b64Decode(b64Encode(b), 16)).toEqual(b);
    expect(b64Encode(new Uint8Array(3))).toBe('....');
  });
  it('constant-time compare', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
    expect(constantTimeEqual('abc', 'ab')).toBe(false);
  });
});
