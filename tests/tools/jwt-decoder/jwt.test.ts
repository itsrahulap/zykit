import { describe, expect, it } from 'vitest';
import { decodeJwt, EXAMPLE_SECRET, EXAMPLE_TOKEN, JwtError } from '../../../src/tools/jwt-decoder/features/jwt';
import { describeClaims, relativeTime, tokenStatus } from '../../../src/tools/jwt-decoder/features/claims';
import { verifyJwt } from '../../../src/tools/jwt-decoder/features/verify';

const b64url = (b: Uint8Array | string) =>
  Buffer.from(typeof b === 'string' ? new TextEncoder().encode(b) : b).toString('base64url');
const seg = (o: unknown) => b64url(JSON.stringify(o));

function errorOf(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(JwtError);
    return (e as Error).message;
  }
  throw new Error('expected an error');
}

async function rejection(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(JwtError);
    return (e as Error).message;
  }
  throw new Error('expected a rejection');
}

function toPem(spki: ArrayBuffer): string {
  const body = Buffer.from(spki).toString('base64').match(/.{1,64}/g)!.join('\n');
  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----\n`;
}

async function signToken(alg: string, algo: AlgorithmIdentifier | RsaPssParams | EcdsaParams, privateKey: CryptoKey, payload: object = { sub: 'x' }) {
  const input = `${seg({ alg, typ: 'JWT' })}.${seg(payload)}`;
  const sig = new Uint8Array(await crypto.subtle.sign(algo, privateKey, new TextEncoder().encode(input)));
  return `${input}.${b64url(sig)}`;
}

describe('decodeJwt', () => {
  it('decodes the example token', () => {
    const jwt = decodeJwt(EXAMPLE_TOKEN);
    expect(jwt.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(jwt.payload.name).toBe('Ada Lovelace');
    expect(jwt.alg).toBe('HS256');
    expect(jwt.signature.length).toBe(32);
    expect(jwt.warnings).toEqual([]);
  });

  it('accepts whitespace, line breaks and a Bearer prefix', () => {
    const t = `  Bearer ${EXAMPLE_TOKEN.slice(0, 40)}\n${EXAMPLE_TOKEN.slice(40)}  \n`;
    expect(decodeJwt(t).parts.join('.')).toBe(EXAMPLE_TOKEN);
  });

  it('decodes UTF-8 payloads', () => {
    const jwt = decodeJwt(`${seg({ alg: 'HS256' })}.${seg({ name: 'Zoë 👋' })}.sig`);
    expect(jwt.payload.name).toBe('Zoë 👋');
  });

  it('reports the wrong number of segments', () => {
    expect(errorOf(() => decodeJwt('abc.def'))).toMatch(/three segments.*has 2/);
    expect(errorOf(() => decodeJwt('a.b.c.d'))).toMatch(/has 4/);
    expect(errorOf(() => decodeJwt('   '))).toMatch(/Paste a token/);
  });

  it('explains that JWE tokens cannot be decoded', () => {
    expect(errorOf(() => decodeJwt('a.b.c.d.e'))).toMatch(/encrypted.*decryption key/);
  });

  it('reports bad base64url, invalid UTF-8 and invalid JSON', () => {
    expect(errorOf(() => decodeJwt(`e+J.${seg({})}.x`))).toMatch(/header is not valid base64url/);
    expect(errorOf(() => decodeJwt(`${seg({})}.${b64url(new Uint8Array([0xff, 0xfe]))}.x`))).toMatch(/payload does not decode to UTF-8/);
    expect(errorOf(() => decodeJwt(`${seg({})}.${b64url('{not json')}.x`))).toMatch(/payload is not valid JSON/);
    expect(errorOf(() => decodeJwt(`${b64url('[1]')}.${seg({})}.x`))).toMatch(/header must be a JSON object/);
    expect(errorOf(() => decodeJwt(`${seg({})}.${seg({})}.a!b`))).toMatch(/signature is not valid/);
  });

  it('warns about unsigned tokens', () => {
    const jwt = decodeJwt(`${seg({ alg: 'none' })}.${seg({ sub: 'x' })}.`);
    expect(jwt.warnings[0]).toMatch(/unsigned/);
  });
});

describe('claims', () => {
  const now = Date.UTC(2026, 0, 1, 12, 0, 0);
  const s = now / 1000;

  it('formats relative time', () => {
    expect(relativeTime(now + 3 * 3600_000, now)).toBe('in 3 hours');
    expect(relativeTime(now - 2 * 86400_000, now)).toBe('2 days ago');
    expect(relativeTime(now + 45_000, now)).toBe('in 45 seconds');
    expect(relativeTime(now - 400 * 86400_000, now)).toBe('1 year ago');
    expect(relativeTime(now, now)).toBe('now');
  });

  it('describes known claims with times relative to now', () => {
    const rows = describeClaims({ iss: 'me', aud: ['a', 'b'], exp: s + 3600, iat: s - 86400 * 2, custom: 1 }, now);
    expect(rows.map((r) => r.name)).toEqual(['iss', 'aud', 'exp', 'iat']);
    expect(rows.find((r) => r.name === 'aud')!.value).toBe('["a","b"]');
    expect(rows.find((r) => r.name === 'exp')!.time!.relative).toBe('in 1 hour');
    expect(rows.find((r) => r.name === 'iat')!.time!.relative).toBe('2 days ago');
  });

  it('flags non-numeric and millisecond dates', () => {
    const rows = describeClaims({ exp: '2026-01-01', iat: now }, now);
    expect(rows[0].note).toMatch(/NumericDate/);
    expect(rows[0].time).toBeUndefined();
    expect(rows[1].note).toMatch(/milliseconds/);
  });

  it('computes status', () => {
    expect(tokenStatus({ exp: s + 10 }, now)).toBe('valid');
    expect(tokenStatus({ exp: s }, now)).toBe('expired');
    expect(tokenStatus({ exp: s - 10 }, now)).toBe('expired');
    expect(tokenStatus({ nbf: s + 10, exp: s + 100 }, now)).toBe('not-yet-valid');
    expect(tokenStatus({}, now)).toBe('valid');
  });
});

describe('verifyJwt', () => {
  it('verifies HS256 with the right secret and rejects a wrong one', async () => {
    const jwt = decodeJwt(EXAMPLE_TOKEN);
    expect(await verifyJwt(jwt, { kind: 'secret', secret: EXAMPLE_SECRET, base64: false })).toBe(true);
    expect(await verifyJwt(jwt, { kind: 'secret', secret: 'wrong', base64: false })).toBe(false);
  });

  it('supports Base64-encoded secrets', async () => {
    const jwt = decodeJwt(EXAMPLE_TOKEN);
    const b64 = Buffer.from(EXAMPLE_SECRET).toString('base64');
    expect(await verifyJwt(jwt, { kind: 'secret', secret: b64, base64: true })).toBe(true);
    expect(await rejection(verifyJwt(jwt, { kind: 'secret', secret: 'not base64!', base64: true }))).toMatch(/not valid Base64/);
  });

  it('detects a tampered payload', async () => {
    const [h, , sig] = EXAMPLE_TOKEN.split('.');
    const jwt = decodeJwt(`${h}.${seg({ sub: 'attacker', admin: true })}.${sig}`);
    expect(await verifyJwt(jwt, { kind: 'secret', secret: EXAMPLE_SECRET, base64: false })).toBe(false);
  });

  it('verifies HS512', async () => {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('s3cret'), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
    const jwt = decodeJwt(await signToken('HS512', 'HMAC', key));
    expect(await verifyJwt(jwt, { kind: 'secret', secret: 's3cret', base64: false })).toBe(true);
  });

  it('verifies RS256 with PEM and JWK public keys', async () => {
    const pair = (await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['sign', 'verify'],
    )) as CryptoKeyPair;
    const jwt = decodeJwt(await signToken('RS256', 'RSASSA-PKCS1-v1_5', pair.privateKey));
    const pem = toPem(await crypto.subtle.exportKey('spki', pair.publicKey));
    const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
    expect(await verifyJwt(jwt, { kind: 'public', text: pem })).toBe(true);
    expect(await verifyJwt(jwt, { kind: 'public', text: JSON.stringify(jwk) })).toBe(true);
    expect(await verifyJwt(jwt, { kind: 'public', text: JSON.stringify({ keys: [jwk] }) })).toBe(true);
    // A private JWK is reduced to its public part.
    const priv = await crypto.subtle.exportKey('jwk', pair.privateKey);
    expect(await verifyJwt(jwt, { kind: 'public', text: JSON.stringify(priv) })).toBe(true);

    const other = (await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['sign', 'verify'],
    )) as CryptoKeyPair;
    expect(await verifyJwt(jwt, { kind: 'public', text: toPem(await crypto.subtle.exportKey('spki', other.publicKey)) })).toBe(false);
  });

  it('verifies PS256', async () => {
    const pair = (await crypto.subtle.generateKey(
      { name: 'RSA-PSS', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['sign', 'verify'],
    )) as CryptoKeyPair;
    const jwt = decodeJwt(await signToken('PS256', { name: 'RSA-PSS', saltLength: 32 }, pair.privateKey));
    expect(await verifyJwt(jwt, { kind: 'public', text: toPem(await crypto.subtle.exportKey('spki', pair.publicKey)) })).toBe(true);
  });

  for (const [alg, curve, hash] of [['ES256', 'P-256', 'SHA-256'], ['ES384', 'P-384', 'SHA-384'], ['ES512', 'P-521', 'SHA-512']] as const) {
    it(`verifies ${alg} with PEM and JWK public keys`, async () => {
      const pair = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: curve }, true, ['sign', 'verify'])) as CryptoKeyPair;
      const jwt = decodeJwt(await signToken(alg, { name: 'ECDSA', hash }, pair.privateKey));
      const pem = toPem(await crypto.subtle.exportKey('spki', pair.publicKey));
      const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
      expect(await verifyJwt(jwt, { kind: 'public', text: pem })).toBe(true);
      expect(await verifyJwt(jwt, { kind: 'public', text: JSON.stringify(jwk) })).toBe(true);

      const tampered = decodeJwt(`${jwt.parts[0]}.${seg({ sub: 'y' })}.${jwt.parts[2]}`);
      expect(await verifyJwt(tampered, { kind: 'public', text: pem })).toBe(false);
    });
  }

  it('explains unusable keys and algorithms', async () => {
    const pair = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
    const jwt = decodeJwt(await signToken('ES256', { name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey));
    const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
    expect(await rejection(verifyJwt(jwt, { kind: 'public', text: '' }))).toMatch(/Paste a public key/);
    expect(await rejection(verifyJwt(jwt, { kind: 'public', text: 'hello' }))).toMatch(/PEM/);
    expect(await rejection(verifyJwt(jwt, { kind: 'public', text: '-----BEGIN RSA PUBLIC KEY-----\nAA==\n-----END RSA PUBLIC KEY-----' }))).toMatch(/PKCS#1/);
    expect(await rejection(verifyJwt(jwt, { kind: 'public', text: '-----BEGIN PRIVATE KEY-----\nAA==\n-----END PRIVATE KEY-----' }))).toMatch(/private key/);
    expect(await rejection(verifyJwt(jwt, { kind: 'public', text: '-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----' }))).toMatch(/Could not import/);
    expect(await rejection(verifyJwt(jwt, { kind: 'public', text: JSON.stringify({ ...jwk, alg: 'ES384' }) }))).toMatch(/for ES384/);
    expect(await rejection(verifyJwt(jwt, { kind: 'public', text: JSON.stringify({ kty: 'RSA', n: 'AQAB', e: 'AQAB' }) }))).toMatch(/needs an EC key/);
    expect(await rejection(verifyJwt(jwt, { kind: 'secret', secret: 'x', base64: false }))).toMatch(/needs a public key/);

    const none = decodeJwt(`${seg({ alg: 'none' })}.${seg({})}.`);
    expect(await rejection(verifyJwt(none, { kind: 'secret', secret: 'x', base64: false }))).toMatch(/no signature/);
  });
});
