import { describe, expect, it } from 'vitest';
import { decodeJwt } from '../../../src/tools/jwt-decoder/features/jwt';
import { verifyJwt } from '../../../src/tools/jwt-decoder/features/verify';
import {
  ALGORITHMS,
  base64ToBytes,
  generateKeyPair,
  importPrivateKey,
  parseJsonObject,
  secondsFromNow,
  setClaims,
  signJwt,
  SignError,
  supportsEd25519,
} from '../../../src/tools/jwt-generator/features/sign';

const payload = { sub: '42', name: 'Ada', iat: 1_700_000_000 };

describe('signJwt', () => {
  for (const alg of ALGORITHMS.filter((a) => a.startsWith('HS'))) {
    it(`${alg} tokens verify in the JWT Decoder (text and Base64 secrets)`, async () => {
      const { token } = await signJwt({ typ: 'JWT' }, payload, alg, { kind: 'secret', secret: 'a-very-long-test-secret-that-is-at-least-64-bytes-long-for-hs512!', base64: false });
      const jwt = decodeJwt(token);
      expect(jwt.header).toEqual({ typ: 'JWT', alg });
      expect(jwt.payload).toEqual(payload);
      expect(await verifyJwt(jwt, { kind: 'secret', secret: 'a-very-long-test-secret-that-is-at-least-64-bytes-long-for-hs512!', base64: false })).toBe(true);
      expect(await verifyJwt(jwt, { kind: 'secret', secret: 'wrong', base64: false })).toBe(false);

      const b64 = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef').toString('base64');
      const t2 = await signJwt({}, payload, alg, { kind: 'secret', secret: b64, base64: true });
      expect(await verifyJwt(decodeJwt(t2.token), { kind: 'secret', secret: b64, base64: true })).toBe(true);
    });
  }

  for (const alg of ALGORITHMS.filter((a) => !a.startsWith('HS') && a !== 'EdDSA')) {
    it(`${alg} tokens verify in the JWT Decoder with PEM and JWK keys`, async () => {
      const pair = await generateKeyPair(alg);
      expect(pair.privatePem).toMatch(/^-----BEGIN PRIVATE KEY-----\n/);
      expect(pair.publicPem).toMatch(/^-----BEGIN PUBLIC KEY-----\n/);
      const { token } = await signJwt({ typ: 'JWT', kid: 'k1' }, payload, alg, { kind: 'private', text: pair.privatePem });
      const jwt = decodeJwt(token);
      expect(jwt.alg).toBe(alg);
      if (alg.startsWith('ES')) expect(jwt.signature.length).toBe({ ES256: 64, ES384: 96, ES512: 132 }[alg as 'ES256']);
      expect(await verifyJwt(jwt, { kind: 'public', text: pair.publicPem })).toBe(true);
      expect(await verifyJwt(jwt, { kind: 'public', text: pair.publicJwk })).toBe(true);

      const viaJwk = await signJwt({}, payload, alg, { kind: 'private', text: pair.privateJwk });
      expect(await verifyJwt(decodeJwt(viaJwk.token), { kind: 'public', text: pair.publicPem })).toBe(true);

      const other = await generateKeyPair(alg);
      expect(await verifyJwt(jwt, { kind: 'public', text: other.publicPem })).toBe(false);
    }, 30_000);
  }

  it('signs EdDSA when WebCrypto supports Ed25519', async () => {
    if (!(await supportsEd25519())) return;
    const pair = await generateKeyPair('EdDSA');
    const { token } = await signJwt({}, payload, 'EdDSA', { kind: 'private', text: pair.privatePem });
    const jwt = decodeJwt(token);
    expect(jwt.alg).toBe('EdDSA');
    const pub = await crypto.subtle.importKey('spki', base64ToBytes(pair.publicPem.replace(/-----[A-Z ]+-----/g, ''))! as Uint8Array<ArrayBuffer>, { name: 'Ed25519' }, false, ['verify']);
    expect(await crypto.subtle.verify({ name: 'Ed25519' }, pub, jwt.signature as Uint8Array<ArrayBuffer>, new TextEncoder().encode(jwt.signingInput))).toBe(true);
    expect(JSON.parse(pair.publicJwk)).toMatchObject({ kty: 'OKP', crv: 'Ed25519', alg: 'EdDSA' });
  });

  it('overrides a mismatched header alg and warns about short secrets', async () => {
    const r = await signJwt({ alg: 'none' }, {}, 'HS256', { kind: 'secret', secret: 'short', base64: false });
    expect(decodeJwt(r.token).alg).toBe('HS256');
    expect(r.warnings.join(' ')).toMatch(/set to "HS256"/);
    expect(r.warnings.join(' ')).toMatch(/at least 32 bytes/);
  });

  it('explains unusable keys', async () => {
    await expect(signJwt({}, {}, 'HS256', { kind: 'secret', secret: '', base64: false })).rejects.toThrow(/Enter a secret/);
    await expect(signJwt({}, {}, 'HS256', { kind: 'secret', secret: '***', base64: true })).rejects.toThrow(/not valid Base64/);
    await expect(importPrivateKey('', 'RS256')).rejects.toThrow(SignError);
    await expect(importPrivateKey('-----BEGIN RSA PRIVATE KEY-----\nAAAA\n-----END RSA PRIVATE KEY-----', 'RS256')).rejects.toThrow(/PKCS#8/);
    await expect(importPrivateKey('-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----', 'RS256')).rejects.toThrow(/private key/);
    const ec = await generateKeyPair('ES256');
    await expect(importPrivateKey(ec.privatePem, 'ES384')).rejects.toThrow(/P-384/);
    await expect(importPrivateKey(ec.publicJwk, 'ES256')).rejects.toThrow(/no private part/);
    await expect(importPrivateKey(ec.privateJwk, 'RS256')).rejects.toThrow(/"RSA" key/);
    await expect(importPrivateKey('{nope', 'RS256')).rejects.toThrow(/could not be parsed/);
  });
});

describe('claim helpers', () => {
  it('sets claims and validates JSON', () => {
    const now = Date.UTC(2026, 0, 1);
    expect(secondsFromNow(15, 'minutes', now)).toBe(now / 1000 + 900);
    expect(secondsFromNow(2, 'days', now)).toBe(now / 1000 + 172800);
    expect(JSON.parse(setClaims('{"a":1}', { exp: 5 }))).toEqual({ a: 1, exp: 5 });
    expect(() => parseJsonObject('[1]', 'Payload')).toThrow(/JSON object/);
    expect(() => parseJsonObject('{', 'Header')).toThrow(/Header is not valid JSON/);
  });
});
