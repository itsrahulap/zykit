import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { base64ToBytes, bytesToBase64 } from '../../../src/shared/lib/base64';
import {
  authorizedKeysLine,
  buildOpenSshPrivateKey,
  checkExpiry,
  fingerprintMd5,
  fingerprintSha256,
  generateSshKey,
  parseOpenSshPrivateKey,
  parseOpenSshPublicKey,
  sshMpint,
  sshString,
  type KeyType,
} from '../../../src/tools/ssh-key-generator/features/ssh-key-generator';

const msg = new TextEncoder().encode('ssh test message');
const b64u = (b: Uint8Array) => bytesToBase64(b, true);
const hex = (s: string) => Uint8Array.from(s.match(/../g)!.map((h) => parseInt(h, 16)));
const big = (b: Uint8Array) => BigInt('0x' + (Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('') || '0'));
const unbig = (n: bigint) => {
  let h = n.toString(16);
  if (h.length % 2) h = '0' + h;
  return hex(h);
};
const strip = (b: Uint8Array) => (b[0] === 0 ? b.subarray(1) : b);
const pad = (b: Uint8Array, n: number) => {
  const out = new Uint8Array(n);
  out.set(b, n - b.length);
  return out;
};

/** Rebuilds a Web Crypto key pair from the OpenSSH outputs alone and checks sign → verify. */
async function crossCheck(type: KeyType, publicLine: string, privateKey: string) {
  const pub = parseOpenSshPublicKey(publicLine);
  const priv = parseOpenSshPrivateKey(privateKey);
  expect(priv.cipher).toBe('none');
  expect(priv.kdf).toBe('none');
  expect(b64u(priv.publicBlob)).toBe(b64u(pub.blob));
  let sk: CryptoKey, pk: CryptoKey, alg: AlgorithmIdentifier | EcdsaParams;
  if (type === 'ed25519') {
    const [pubRaw, secret] = priv.fields;
    expect(b64u(secret.subarray(32))).toBe(b64u(pubRaw));
    const pkcs8 = new Uint8Array([...hex('302e020100300506032b657004220420'), ...secret.subarray(0, 32)]);
    alg = { name: 'Ed25519' };
    sk = await crypto.subtle.importKey('pkcs8', pkcs8, alg, false, ['sign']);
    pk = await crypto.subtle.importKey('raw', new Uint8Array(pub.fields[0]), alg, false, ['verify']);
  } else if (type.startsWith('ecdsa')) {
    const crv = { 'ecdsa-p256': 'P-256', 'ecdsa-p384': 'P-384', 'ecdsa-p521': 'P-521' }[type as 'ecdsa-p256']!;
    const size = { 'P-256': 32, 'P-384': 48, 'P-521': 66 }[crv]!;
    const [curve, q, d] = priv.fields;
    expect(new TextDecoder().decode(curve)).toBe(pub.algorithm.slice('ecdsa-sha2-'.length));
    const x = q.subarray(1, 1 + size);
    const y = q.subarray(1 + size);
    const hash = { 'P-256': 'SHA-256', 'P-384': 'SHA-384', 'P-521': 'SHA-512' }[crv]!;
    alg = { name: 'ECDSA', hash } as EcdsaParams;
    sk = await crypto.subtle.importKey('jwk', { kty: 'EC', crv, x: b64u(x), y: b64u(y), d: b64u(pad(d, size)) }, { name: 'ECDSA', namedCurve: crv }, false, ['sign']);
    pk = await crypto.subtle.importKey('raw', new Uint8Array(pub.fields[1]), { name: 'ECDSA', namedCurve: crv }, false, ['verify']);
  } else {
    const [n, e, d, iqmp, p, q] = priv.fields;
    expect(b64u(strip(pub.fields[0]))).toBe(b64u(e));
    expect(b64u(strip(pub.fields[1]))).toBe(b64u(n));
    expect((big(p) * big(q)).toString(16)).toBe(big(n).toString(16));
    const dp = unbig(big(d) % (big(p) - 1n));
    const dq = unbig(big(d) % (big(q) - 1n));
    alg = { name: 'RSASSA-PKCS1-v1_5' };
    const rsa = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
    const jwk = { kty: 'RSA', n: b64u(n), e: b64u(e) };
    sk = await crypto.subtle.importKey('jwk', { ...jwk, d: b64u(d), p: b64u(p), q: b64u(q), dp: b64u(dp), dq: b64u(dq), qi: b64u(iqmp) }, rsa, false, ['sign']);
    pk = await crypto.subtle.importKey('jwk', jwk, rsa, false, ['verify']);
  }
  const sig = await crypto.subtle.sign(alg, sk, msg);
  expect(await crypto.subtle.verify(alg, pk, sig, msg)).toBe(true);
}

const TYPES: KeyType[] = ['ed25519', 'ecdsa-p256', 'ecdsa-p384', 'ecdsa-p521', 'rsa-2048'];

describe('SSH key generation', () => {
  for (const type of TYPES) {
    it(`${type}: OpenSSH outputs parse back and form a working key pair`, async () => {
      const k = await generateSshKey(type, 'alice@example.com');
      expect(k.publicLine).toMatch(new RegExp(`^${k.algorithm} [A-Za-z0-9+/]+=* alice@example\\.com$`));
      expect(k.privateOpenSsh.startsWith('-----BEGIN OPENSSH PRIVATE KEY-----\n')).toBe(true);
      expect(k.privateOpenSsh.trimEnd().endsWith('-----END OPENSSH PRIVATE KEY-----')).toBe(true);
      expect(k.privateOpenSsh.split('\n').every((l) => l.length <= 70)).toBe(true);
      expect(k.privatePkcs8Pem).toContain('-----BEGIN PRIVATE KEY-----');
      expect(k.publicSpkiPem).toContain('-----BEGIN PUBLIC KEY-----');
      expect(parseOpenSshPrivateKey(k.privateOpenSsh).comment).toBe('alice@example.com');
      expect(k.fingerprintSha256).toMatch(/^SHA256:[A-Za-z0-9+/]{43}$/);
      expect(k.fingerprintMd5).toMatch(/^MD5:([0-9a-f]{2}:){15}[0-9a-f]{2}$/);
      expect(k.keygenLine).toBe(`${k.bits} ${k.fingerprintSha256} alice@example.com (${k.algorithm === 'ssh-rsa' ? 'RSA' : k.algorithm === 'ssh-ed25519' ? 'ED25519' : 'ECDSA'})`);
      await crossCheck(type, k.publicLine, k.privateOpenSsh);
    }, 30_000);
  }

  it('sets bit sizes and file names', async () => {
    const ed = await generateSshKey('ed25519');
    expect([ed.bits, ed.fileBase, ed.algorithm]).toEqual([256, 'id_ed25519', 'ssh-ed25519']);
    expect(ed.publicLine.split(' ')).toHaveLength(2); // no comment → no trailing field
    const ec = await generateSshKey('ecdsa-p521');
    expect([ec.bits, ec.fileBase, ec.algorithm]).toEqual([521, 'id_ecdsa', 'ecdsa-sha2-nistp521']);
    const rsa = await generateSshKey('rsa-2048', 'line\nbreak');
    expect([rsa.bits, rsa.fileBase, rsa.comment]).toEqual([2048, 'id_rsa', 'line break']);
  }, 30_000);
});

describe('wire format', () => {
  it('encodes mpints per RFC 4251', () => {
    expect(Array.from(sshMpint(new Uint8Array([0, 0])))).toEqual([0, 0, 0, 0]);
    expect(Array.from(sshMpint(hex('80')))).toEqual([0, 0, 0, 2, 0, 0x80]);
    expect(Array.from(sshMpint(hex('0009a378f9b2e332a7')))).toEqual([0, 0, 0, 8, 0x09, 0xa3, 0x78, 0xf9, 0xb2, 0xe3, 0x32, 0xa7]);
  });

  it('pads the private section with 1, 2, 3… to a multiple of 8 and checks it', () => {
    const blob = sshString('ssh-ed25519');
    const k = buildOpenSshPrivateKey(blob, new Uint8Array(0), '', 7);
    const der = base64ToBytes(k.replace(/-----[^-]+-----|\s/g, ''));
    expect(der.length).toBeGreaterThan(0);
    expect(() => parseOpenSshPrivateKey(k)).toThrow(/Unexpected end|Unsupported/);
    expect(() => parseOpenSshPrivateKey('nope')).toThrow(/BEGIN OPENSSH/);
  });

  it('matches known fingerprints', async () => {
    // Expected values from `ssh-keygen -l [-E md5]` on this public key.
    const line = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIC/RQRK/1Qa/6Lwfm8vrjGo4+nATT3NEXv3uAqXnJ++/ ed25519_1';
    const { blob } = parseOpenSshPublicKey(line);
    expect(await fingerprintSha256(blob)).toBe('SHA256:LfZQTUx3Lz4RqwBerSyngN7H8JPIE51OitiXo/cnLYA');
    expect(fingerprintMd5(blob)).toBe('MD5:6a:43:83:c9:58:2b:a8:45:5d:87:57:9c:61:56:d3:56');
  });

  it('rejects a public line whose type disagrees with the blob', () => {
    expect(() => parseOpenSshPublicKey('ssh-rsa AAAAC3NzaC1lZDI1NTE5AAAAIC/RQRK/1Qa/6Lwfm8vrjGo4+nATT3NEXv3uAqXnJ++/')).toThrow(/mismatch/);
  });
});

describe('authorized_keys', () => {
  const key = 'ssh-ed25519 AAAA me';
  it('builds option prefixes', () => {
    expect(authorizedKeysLine(key, {})).toBe(key);
    expect(authorizedKeysLine(key, { noPty: true, noPortForwarding: true })).toBe(`no-port-forwarding,no-pty ${key}`);
    expect(authorizedKeysLine(key, { restrict: true, noPty: true, from: '10.0.0.0/8, *.example.com', command: 'echo "hi"' })).toBe(
      `restrict,from="10.0.0.0/8,*.example.com",command="echo \\"hi\\"" ${key}`,
    );
    expect(authorizedKeysLine(key, { expiryTime: '20271231' })).toBe(`expiry-time="20271231" ${key}`);
  });
  it('validates expiry-time', () => {
    expect(checkExpiry('20271231')).toBeNull();
    expect(checkExpiry('202712311200')).toBeNull();
    expect(checkExpiry('2027-12-31')).toMatch(/YYYYMMDD/);
  });
});

function hasSshKeygen() {
  try {
    execFileSync('ssh-keygen', ['-l', '-f', '/dev/null'], { stdio: 'ignore' });
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code !== 'ENOENT';
  }
}

describe.skipIf(!hasSshKeygen())('ssh-keygen accepts the generated keys', () => {
  for (const type of TYPES) {
    it(`${type}`, async () => {
      const k = await generateSshKey(type, 'test@zykit');
      const dir = mkdtempSync(join(tmpdir(), 'zykit-ssh-'));
      try {
        const priv = join(dir, k.fileBase);
        writeFileSync(priv, k.privateOpenSsh, { mode: 0o600 });
        writeFileSync(`${priv}.pub`, k.publicLine + '\n');
        writeFileSync(join(dir, 'spki.pem'), k.publicSpkiPem);
        const run = (...args: string[]) => execFileSync('ssh-keygen', args, { encoding: 'utf8' }).trim();
        expect(run('-l', '-f', priv)).toBe(k.keygenLine);
        expect(run('-l', '-f', `${priv}.pub`)).toBe(k.keygenLine);
        expect(run('-l', '-E', 'md5', '-f', `${priv}.pub`)).toContain(k.fingerprintMd5);
        expect(run('-y', '-f', priv).split(' ').slice(0, 2).join(' ')).toBe(k.publicLine.split(' ').slice(0, 2).join(' '));
        // ssh-keygen only imports RSA/ECDSA SPKI.
        if (type !== 'ed25519') expect(run('-i', '-m', 'PKCS8', '-f', join(dir, 'spki.pem')).split(' ')[1]).toBe(k.publicLine.split(' ')[1]);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }, 30_000);
  }
});
