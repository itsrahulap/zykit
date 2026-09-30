import { describe, expect, it } from 'vitest';
import {
  base32Decode,
  base32Encode,
  buildOtpauth,
  generateSecret,
  groupSecret,
  hotp,
  parseOtpauth,
  secondsRemaining,
  timeCounter,
  totp,
  verifyCode,
  type Algorithm,
} from '../../../src/tools/totp-generator/features/totp-generator';

const ascii = (s: string) => new TextEncoder().encode(s) as Uint8Array<ArrayBuffer>;

describe('Base32 (RFC 4648 §10 vectors)', () => {
  const vectors: [string, string][] = [
    ['', ''],
    ['f', 'MY======'],
    ['fo', 'MZXQ===='],
    ['foo', 'MZXW6==='],
    ['foob', 'MZXW6YQ='],
    ['fooba', 'MZXW6YTB'],
    ['foobar', 'MZXW6YTBOI======'],
  ];
  it.each(vectors)('encodes and decodes %j', (plain, encoded) => {
    expect(base32Encode(ascii(plain), true)).toBe(encoded);
    expect(new TextDecoder().decode(base32Decode(encoded))).toBe(plain);
  });

  it('tolerates spaces, hyphens, lowercase and missing padding', () => {
    expect(new TextDecoder().decode(base32Decode(' mzxw 6ytb-oi '))).toBe('foobar');
  });

  it('rejects invalid characters and lengths', () => {
    expect(() => base32Decode('MZ1W')).toThrow(/not a Base32/);
    expect(() => base32Decode('MZX')).toThrow(/length/);
    expect(() => base32Decode('M=ZX')).toThrow(/Padding/);
  });

  it('round-trips random bytes', () => {
    for (let n = 0; n < 40; n++) {
      const b = crypto.getRandomValues(new Uint8Array(n));
      expect([...base32Decode(base32Encode(b))]).toEqual([...b]);
    }
  });
});

describe('HOTP (RFC 4226 appendix D)', () => {
  const key = ascii('12345678901234567890');
  const expected = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489'];
  it.each(expected.map((c, i) => [i, c]))('counter %i → %s', async (counter, code) => {
    expect(await hotp(key, counter as number, { algorithm: 'SHA-1', digits: 6 })).toBe(code);
  });
  it('rejects negative counters', async () => {
    await expect(hotp(key, -1, { algorithm: 'SHA-1', digits: 6 })).rejects.toThrow();
  });
});

describe('TOTP (RFC 6238 appendix B)', () => {
  const keys: Record<Algorithm, Uint8Array<ArrayBuffer>> = {
    'SHA-1': ascii('12345678901234567890'),
    'SHA-256': ascii('12345678901234567890123456789012'),
    'SHA-512': ascii('1234567890123456789012345678901234567890123456789012345678901234'),
  };
  const table: [number, string, string, string][] = [
    [59, '94287082', '46119246', '90693936'],
    [1111111109, '07081804', '68084774', '25091201'],
    [1111111111, '14050471', '67062674', '99943326'],
    [1234567890, '89005924', '91819424', '93441116'],
    [2000000000, '69279037', '90698825', '38618901'],
    [20000000000, '65353130', '77737706', '47863826'],
  ];
  it.each(table)('t=%i', async (t, sha1, sha256, sha512) => {
    const p = { digits: 8, period: 30 };
    expect(await totp(keys['SHA-1'], t * 1000, { ...p, algorithm: 'SHA-1' })).toBe(sha1);
    expect(await totp(keys['SHA-256'], t * 1000, { ...p, algorithm: 'SHA-256' })).toBe(sha256);
    expect(await totp(keys['SHA-512'], t * 1000, { ...p, algorithm: 'SHA-512' })).toBe(sha512);
  });

  it('computes steps and remaining seconds', () => {
    expect(timeCounter(59_000, 30)).toBe(1);
    expect(timeCounter(1_111_111_109_000, 30)).toBe(0x23523ec);
    expect(secondsRemaining(59_000, 30)).toBe(1);
    expect(secondsRemaining(60_000, 30)).toBe(30);
    expect(secondsRemaining(61_500, 60)).toBe(59);
  });
});

describe('verifyCode', () => {
  const key = ascii('12345678901234567890');
  const p = { algorithm: 'SHA-1' as const, digits: 6 };
  it('finds codes inside the window and reports the offset', async () => {
    expect(await verifyCode(key, '359152', 2, 0, p)).toBe(0);
    expect(await verifyCode(key, '287082', 2, 1, p)).toBe(-1);
    expect(await verifyCode(key, '969429', 2, 1, p)).toBe(1);
    expect(await verifyCode(key, '969429', 2, 0, p)).toBeNull();
    expect(await verifyCode(key, '755 224', 1, 1, p)).toBe(-1);
  });
  it('rejects malformed codes', async () => {
    expect(await verifyCode(key, '12345', 0, 1, p)).toBeNull();
    expect(await verifyCode(key, 'abcdef', 0, 1, p)).toBeNull();
  });
});

describe('otpauth URIs', () => {
  it('parses the Key Uri Format example', () => {
    const r = parseOtpauth(
      'otpauth://totp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA1&digits=6&period=30',
    );
    expect(r).toEqual({
      ok: true,
      warnings: [],
      value: {
        type: 'totp',
        secret: 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ',
        issuer: 'ACME Co',
        account: 'john.doe@email.com',
        algorithm: 'SHA-1',
        digits: 6,
        period: 30,
        counter: 0,
      },
    });
  });

  it('parses HOTP with counter and SHA-256, applying defaults', () => {
    const r = parseOtpauth('otpauth://hotp/alice?secret=gezdgnbv&counter=42&algorithm=sha256&digits=8');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toMatchObject({ type: 'hotp', account: 'alice', issuer: '', counter: 42, digits: 8, algorithm: 'SHA-256', secret: 'GEZDGNBV' });
    expect(r.warnings.join(' ')).toMatch(/SHA1/);
  });

  it('reports errors', () => {
    expect(parseOtpauth('https://example.com').ok).toBe(false);
    expect(parseOtpauth('otpauth://totp/x').ok).toBe(false);
    expect(parseOtpauth('otpauth://totp/x?secret=111').ok).toBe(false);
    expect(parseOtpauth('otpauth://totp/x?secret=GEZDGNBV&digits=4').ok).toBe(false);
    expect(parseOtpauth('otpauth://totp/x?secret=GEZDGNBV&algorithm=MD5').ok).toBe(false);
    expect(parseOtpauth('otpauth://xotp/x?secret=GEZDGNBV').ok).toBe(false);
  });

  it('builds a URI that parses back to the same values', () => {
    const o = {
      type: 'totp' as const,
      secret: 'JBSW Y3DP EHPK 3PXP',
      issuer: 'Zykit & Co',
      account: 'me@example.com',
      algorithm: 'SHA-256' as const,
      digits: 8,
      period: 60,
      counter: 0,
    };
    const uri = buildOtpauth(o);
    expect(uri).toBe('otpauth://totp/Zykit%20%26%20Co:me%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Zykit%20%26%20Co&algorithm=SHA256&digits=8&period=60');
    const back = parseOtpauth(uri);
    expect(back.ok && back.value).toMatchObject({ ...o, secret: 'JBSWY3DPEHPK3PXP' });
    expect(buildOtpauth({ ...o, type: 'hotp', counter: 7, issuer: '' })).toBe(
      'otpauth://hotp/me%40example.com?secret=JBSWY3DPEHPK3PXP&algorithm=SHA256&digits=8&counter=7',
    );
  });
});

describe('secrets', () => {
  it('generates 160-bit Base32 secrets', () => {
    const s = generateSecret();
    expect(s).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Decode(s).length).toBe(20);
    expect(generateSecret()).not.toBe(s);
  });
  it('groups secrets for display', () => {
    expect(groupSecret('jbswy3dpehpk3pxp')).toBe('JBSW Y3DP EHPK 3PXP');
  });
});
