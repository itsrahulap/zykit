import { describe, expect, it } from 'vitest';
import { computeAll, digest, formatDigest, hmac, type HashAlg } from '../../../src/tools/hash-generator/features/hash';

const utf8 = (s: string) => new TextEncoder().encode(s);
const hex = (b: Uint8Array) => formatDigest(b, 'hex');

const VECTORS: Record<HashAlg, { empty: string; abc: string }> = {
  MD5: { empty: 'd41d8cd98f00b204e9800998ecf8427e', abc: '900150983cd24fb0d6963f7d28e17f72' },
  'SHA-1': { empty: 'da39a3ee5e6b4b0d3255bfef95601890afd80709', abc: 'a9993e364706816aba3e25717850c26c9cd0d89d' },
  'SHA-256': {
    empty: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    abc: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  },
  'SHA-384': {
    empty: '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b',
    abc: 'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
  },
  'SHA-512': {
    empty: 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
    abc: 'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
  },
};

describe('digests', () => {
  for (const [alg, v] of Object.entries(VECTORS) as [HashAlg, { empty: string; abc: string }][]) {
    it(`${alg} matches known vectors`, async () => {
      expect(hex(await digest(alg, new Uint8Array()))).toBe(v.empty);
      expect(hex(await digest(alg, utf8('abc')))).toBe(v.abc);
    });
  }

  it('computeAll returns every algorithm', async () => {
    const all = await computeAll({ data: utf8('abc') });
    expect(Object.keys(all)).toEqual(['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']);
    expect(hex(all['SHA-256']!)).toBe(VECTORS['SHA-256'].abc);
  });

  it('hashes UTF-8 text', async () => {
    expect(hex(await digest('SHA-256', utf8('héllo 👋')))).toBe(hex(await digest('SHA-256', Uint8Array.from([0x68, 0xc3, 0xa9, 0x6c, 0x6c, 0x6f, 0x20, 0xf0, 0x9f, 0x91, 0x8b]))));
  });
});

describe('HMAC (RFC 4231 test case 2)', () => {
  const key = utf8('Jefe');
  const data = utf8('what do ya want for nothing?');
  const expected = {
    'SHA-1': 'effcdf6ae5eb2fa2d27416d5f184df9c259a7c79', // RFC 2202
    'SHA-256': '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
    'SHA-384': 'af45d2e376484031617f78d2b58a6b1b9c7ef464f5a01b47e42ec3736322445e8e2240ca5e69e2c78b3239ecfab21649',
    'SHA-512': '164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea2505549758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737',
  } as const;

  for (const [alg, want] of Object.entries(expected) as [keyof typeof expected, string][]) {
    it(`HMAC-${alg}`, async () => {
      expect(hex(await hmac(alg, key, data))).toBe(want);
    });
  }

  it('computeAll in HMAC mode skips MD5', async () => {
    const all = await computeAll({ data, hmacKey: key });
    expect(Object.keys(all)).toEqual(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']);
    expect(hex(all['SHA-256']!)).toBe(expected['SHA-256']);
  });
});

describe('formatting', () => {
  it('formats as hex, HEX and Base64', async () => {
    const d = await digest('MD5', utf8('abc'));
    expect(formatDigest(d, 'hex')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(formatDigest(d, 'HEX')).toBe('900150983CD24FB0D6963F7D28E17F72');
    expect(formatDigest(d, 'base64')).toBe('kAFQmDzST7DWlj99KOF/cg==');
  });
});
