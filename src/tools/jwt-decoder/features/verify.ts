// Local JWS signature verification with WebCrypto. Keys never leave the device.

import { base64UrlToBytes, JwtError, type DecodedJwt } from './jwt';

type Family = 'HS' | 'RS' | 'PS' | 'ES';
type Hash = 'SHA-256' | 'SHA-384' | 'SHA-512';

export type VerifyKey = { kind: 'secret'; secret: string; base64: boolean } | { kind: 'public'; text: string };

const CURVES: Record<string, string> = { '256': 'P-256', '384': 'P-384', '512': 'P-521' };

/** Parses "RS256" etc. Returns null for unsupported algorithms (including "none"). */
export function parseAlg(alg: string | undefined): { family: Family; bits: '256' | '384' | '512'; hash: Hash } | null {
  const m = alg?.match(/^(HS|RS|PS|ES)(256|384|512)$/);
  if (!m) return null;
  return { family: m[1] as Family, bits: m[2] as '256' | '384' | '512', hash: `SHA-${m[2]}` as Hash };
}

export const keyKindFor = (alg: string | undefined): 'secret' | 'public' | null => {
  const p = parseAlg(alg);
  return p ? (p.family === 'HS' ? 'secret' : 'public') : null;
};

/** Accepts standard or URL-safe Base64, with or without padding. */
function decodeAnyBase64(s: string): Uint8Array | null {
  return base64UrlToBytes(s.replace(/\s+/g, '').replace(/\+/g, '-').replace(/\//g, '_'));
}

const PEM = /-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/;

function importParams(p: NonNullable<ReturnType<typeof parseAlg>>): RsaHashedImportParams | EcKeyImportParams {
  if (p.family === 'ES') return { name: 'ECDSA', namedCurve: CURVES[p.bits] };
  return { name: p.family === 'RS' ? 'RSASSA-PKCS1-v1_5' : 'RSA-PSS', hash: p.hash };
}

async function importPublicKey(text: string, alg: string, p: NonNullable<ReturnType<typeof parseAlg>>, kid: unknown): Promise<CryptoKey> {
  const t = text.trim();
  if (!t) throw new JwtError('Paste a public key (PEM or JWK) to verify the signature.');
  const params = importParams(p);

  if (t.startsWith('{')) {
    let jwk: JsonWebKey & { keys?: (JsonWebKey & { kid?: string })[]; kid?: string };
    try {
      jwk = JSON.parse(t);
    } catch {
      throw new JwtError('The key looks like JSON but could not be parsed.');
    }
    // A JWK Set: pick the key matching the token's "kid", or the only key.
    if (Array.isArray(jwk.keys)) {
      const match = jwk.keys.find((k) => k.kid !== undefined && k.kid === kid) ?? (jwk.keys.length === 1 ? jwk.keys[0] : undefined);
      if (!match) throw new JwtError('No key in this JWK Set matches the token\'s "kid".');
      jwk = match;
    }
    if (jwk.alg && jwk.alg !== alg) throw new JwtError(`This key is for ${jwk.alg}, but the token uses ${alg}.`);
    const expectedKty = p.family === 'ES' ? 'EC' : 'RSA';
    if (jwk.kty !== expectedKty) throw new JwtError(`${alg} needs an ${expectedKty} key, but this JWK is "${jwk.kty ?? 'unknown'}".`);
    // Keep only public fields, so a pasted private JWK still works for verification.
    const pub: JsonWebKey = p.family === 'ES' ? { kty: 'EC', crv: jwk.crv, x: jwk.x, y: jwk.y } : { kty: 'RSA', n: jwk.n, e: jwk.e };
    try {
      return await crypto.subtle.importKey('jwk', pub, params, false, ['verify']);
    } catch {
      throw new JwtError(`Could not import this JWK as a ${alg} public key${p.family === 'ES' ? ` (expected curve ${CURVES[p.bits]})` : ''}.`);
    }
  }

  const m = t.match(PEM);
  if (!m) throw new JwtError('Paste the public key as PEM ("-----BEGIN PUBLIC KEY-----") or as JWK JSON.');
  const label = m[1];
  if (label === 'RSA PUBLIC KEY') throw new JwtError('This is a PKCS#1 RSA key. Convert it to SPKI ("BEGIN PUBLIC KEY"), e.g. with: openssl rsa -RSAPublicKey_in -pubout');
  if (label === 'CERTIFICATE') throw new JwtError('Certificates are not supported. Paste the public key ("BEGIN PUBLIC KEY") instead.');
  if (label.includes('PRIVATE')) throw new JwtError('This is a private key. Paste the matching public key ("BEGIN PUBLIC KEY") instead.');
  if (label !== 'PUBLIC KEY') throw new JwtError(`Unsupported PEM type "${label}". Use "BEGIN PUBLIC KEY".`);
  const der = decodeAnyBase64(m[2]);
  if (!der) throw new JwtError('The PEM body is not valid Base64.');
  try {
    return await crypto.subtle.importKey('spki', der as Uint8Array<ArrayBuffer>, params, false, ['verify']);
  } catch {
    throw new JwtError(`Could not import this PEM as a ${alg} public key${p.family === 'ES' ? ` (expected curve ${CURVES[p.bits]})` : ''}.`);
  }
}

/** Verifies the token's signature with its header "alg". Throws JwtError for unusable keys or algorithms. */
export async function verifyJwt(jwt: DecodedJwt, key: VerifyKey): Promise<boolean> {
  const alg = jwt.alg;
  const p = parseAlg(alg);
  if (!p || !alg) {
    throw new JwtError(alg?.toLowerCase() === 'none' ? 'Unsigned tokens ("alg": "none") have no signature to verify.' : `Unsupported algorithm "${alg ?? 'missing'}".`);
  }
  const data = new TextEncoder().encode(jwt.signingInput);
  const sig = jwt.signature as Uint8Array<ArrayBuffer>;

  if (p.family === 'HS') {
    if (key.kind !== 'secret') throw new JwtError(`${alg} needs a shared secret.`);
    if (!key.secret) throw new JwtError('Enter the secret to verify the signature.');
    const raw = key.base64 ? decodeAnyBase64(key.secret) : new TextEncoder().encode(key.secret);
    if (!raw) throw new JwtError('The secret is not valid Base64. Turn off "Secret is Base64" if it is plain text.');
    if (!raw.length) throw new JwtError('The secret decodes to zero bytes.');
    const k = await crypto.subtle.importKey('raw', raw as Uint8Array<ArrayBuffer>, { name: 'HMAC', hash: p.hash }, false, ['verify']);
    return crypto.subtle.verify('HMAC', k, sig, data);
  }

  if (key.kind !== 'public') throw new JwtError(`${alg} needs a public key.`);
  const k = await importPublicKey(key.text, alg, p, jwt.header.kid);
  const bytes = Number(p.bits) / 8;
  const params: AlgorithmIdentifier | RsaPssParams | EcdsaParams =
    p.family === 'RS' ? 'RSASSA-PKCS1-v1_5' : p.family === 'PS' ? { name: 'RSA-PSS', saltLength: bytes } : { name: 'ECDSA', hash: p.hash };
  // JWS ES signatures are raw r||s, which is exactly what WebCrypto expects.
  return crypto.subtle.verify(params, k, sig, data);
}
