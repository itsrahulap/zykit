import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Asn1Error, MAX_DEPTH, parseDer, readOid, readTime } from '../../../src/tools/certificate-inspector/features/asn1';
import { buildChain, decodeBase64, fingerprint, inspectBytes, inspectText, validity, verifySignature } from '../../../src/tools/certificate-inspector/features/inspect';
import type { Certificate, CertificateRequest, PrivateKeyBlock, PublicKeyBlock } from '../../../src/tools/certificate-inspector/features/x509';
import { SAMPLE_PEM } from '../../../src/tools/certificate-inspector/features/sample';

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const fixtureBytes = (name: string) => new Uint8Array(readFileSync(join(__dirname, 'fixtures', name)));
const first = <T>(text: string) => {
  const r = inspectText(text);
  expect(r.items[0].error).toBeUndefined();
  return r.items[0].result as T;
};
const ext = (c: Certificate | CertificateRequest, name: string) => c.extensions.find((e) => e.name === name);

describe('ASN.1 parser', () => {
  it('parses nested structures and OIDs', () => {
    const der = new Uint8Array([0x30, 0x0b, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0b]);
    const n = parseDer(der);
    expect(n.children).toHaveLength(1);
    expect(readOid(n.children[0])).toBe('1.2.840.113549.1.1.11');
  });

  it('rejects truncated, indefinite, non-minimal and trailing data', () => {
    expect(() => parseDer(new Uint8Array([0x30, 0x05, 0x02, 0x01]))).toThrow(Asn1Error);
    expect(() => parseDer(new Uint8Array([0x30, 0x80, 0x00, 0x00]))).toThrow(/Indefinite/);
    expect(() => parseDer(new Uint8Array([0x04, 0x81, 0x01, 0x00]))).toThrow(/Non-minimal/);
    expect(() => parseDer(new Uint8Array([0x05, 0x00, 0x05, 0x00]))).toThrow(/unexpected bytes/);
    expect(() => parseDer(new Uint8Array([0x04, 0x85, 1, 0, 0, 0, 0]))).toThrow(/too large/);
    expect(() => parseDer(new Uint8Array([]))).toThrow(Asn1Error);
  });

  it('caps nesting depth', () => {
    const depth = MAX_DEPTH + 5;
    const bytes: number[] = [];
    for (let i = 0; i < depth; i++) bytes.push(0x30, 2 * (depth - i - 1));
    expect(() => parseDer(new Uint8Array(bytes))).toThrow(/deeper/);
  });

  it('reads UTCTime and GeneralizedTime', () => {
    const utc = parseDer(new Uint8Array([0x17, 0x0d, ...new TextEncoder().encode('490101000000Z')]));
    expect(readTime(utc).toISOString()).toBe('2049-01-01T00:00:00.000Z');
    const utc2 = parseDer(new Uint8Array([0x17, 0x0d, ...new TextEncoder().encode('500101000000Z')]));
    expect(readTime(utc2).getUTCFullYear()).toBe(1950);
    const gen = parseDer(new Uint8Array([0x18, 0x0f, ...new TextEncoder().encode('20991231235959Z')]));
    expect(readTime(gen).toISOString()).toBe('2099-12-31T23:59:59.000Z');
  });

  it('never throws anything but Asn1Error on random input', () => {
    let seed = 42;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed & 0xff);
    const der = fixtureBytes('rsa-selfsigned.der');
    for (let i = 0; i < 300; i++) {
      const copy = der.slice();
      for (let k = 0; k < 4; k++) copy[rnd() * 4 + rnd()] = rnd();
      const r = inspectBytes(copy);
      for (const it of r.items) if (!it.result) expect(typeof it.error).toBe('string');
    }
  });
});

describe('certificates', () => {
  it('decodes a self-signed RSA certificate', async () => {
    const c = first<Certificate>(fixture('rsa-selfsigned.pem'));
    expect(c.kind).toBe('certificate');
    expect(c.version).toBe(3);
    expect(c.serialHex.replace(/:/g, '').toUpperCase()).toBe('254DEFD9E5FF6F856720A975CF9C292CC97B42B2');
    expect(c.signatureAlgorithm.name).toBe('sha256WithRSAEncryption');
    expect(c.subject.text).toBe('CN=rsa.example.test, O=Zykit Test, C=GB');
    expect(c.selfIssued).toBe(true);
    expect(c.publicKey).toMatchObject({ type: 'RSA', bits: 2048, exponent: 65537 });
    const san = ext(c, 'Subject Alternative Name')!.decoded;
    expect(san).toEqual({
      kind: 'names',
      names: [
        { type: 'DNS', value: 'rsa.example.test' },
        { type: 'DNS', value: '*.example.test' },
        { type: 'IP', value: '192.0.2.10' },
        { type: 'IP', value: '2001:db8::1' },
        { type: 'email', value: 'admin@example.test' },
        { type: 'URI', value: 'https://example.test/id' },
      ],
    });
    const ku = ext(c, 'Key Usage')!;
    expect(ku.critical).toBe(true);
    expect(ku.decoded).toEqual({ kind: 'keyUsage', usages: ['Digital signature', 'Key encipherment'] });
    expect(ext(c, 'Extended Key Usage')!.decoded).toMatchObject({ purposes: [{ name: 'TLS server authentication' }, { name: 'TLS client authentication' }] });
    expect(await fingerprint(c.der, 'SHA-256')).toBe('8E:79:40:14:18:EE:CC:6A:C4:FC:2F:6C:CD:00:17:50:0C:18:0A:33:7C:3A:29:0D:8D:DB:01:B8:E3:18:BC:4C');
    expect(await fingerprint(c.der, 'SHA-1')).toBe('18:96:21:4D:07:4E:AA:9F:47:E4:38:23:86:D7:28:29:7A:FE:01:92');
    expect(await verifySignature(c, c)).toBe(true);
  });

  it('decodes the same certificate from a DER file', () => {
    const r = inspectBytes(fixtureBytes('rsa-selfsigned.der'));
    expect(r.items).toHaveLength(1);
    expect((r.items[0].result as Certificate).subject.text).toContain('rsa.example.test');
  });

  it('accepts bare Base64 without PEM armour', () => {
    const body = fixture('rsa-selfsigned.pem').replace(/-----[A-Z ]+-----/g, '');
    expect((inspectText(body).items[0].result as Certificate).kind).toBe('certificate');
  });

  it('decodes an EC P-256 certificate and its validity', async () => {
    const c = first<Certificate>(fixture('ec-selfsigned.pem'));
    expect(c.publicKey).toMatchObject({ type: 'EC', curve: 'P-256', bits: 256 });
    expect(c.signatureAlgorithm.name).toBe('ecdsa-with-SHA256');
    expect(validity(c, c.notBefore.getTime() + 86_400_000)).toEqual({ state: 'valid', days: 29 });
    expect(validity(c, c.notAfter.getTime() + 3 * 86_400_000).state).toBe('expired');
    expect(validity(c, c.notBefore.getTime() - 1000).state).toBe('not-yet-valid');
    expect(await verifySignature(c, c)).toBe(true);
  });

  it('orders and verifies a chain pasted out of order', async () => {
    const blocks = fixture('chain.pem').match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g)!;
    const shuffled = [blocks[2], blocks[0], blocks[1]].join('\n');
    const certs = inspectText(shuffled).items.map((i) => i.result as Certificate);
    const chain = buildChain(certs);
    expect(chain.inOrder).toBe(false);
    expect(chain.ordered.map((l) => l.cert.subject.attributes.find((a) => a.name === 'CN')?.value)).toEqual([
      'leaf.example.test',
      'Zykit Test Intermediate CA',
      'Zykit Test Root CA',
    ]);
    expect(chain.ordered.map((l) => l.link)).toEqual(['issued-by-next', 'issued-by-next', 'self-signed']);
    expect(await verifySignature(chain.ordered[0].cert, chain.ordered[1].cert)).toBe(true); // RSA leaf signed by EC P-384
    expect(await verifySignature(chain.ordered[1].cert, chain.ordered[2].cert)).toBe(true);
    expect(await verifySignature(chain.ordered[0].cert, chain.ordered[2].cert)).toBe(false);

    const leaf = chain.ordered[0].cert;
    expect(ext(leaf, 'Basic Constraints')!.decoded).toEqual({ kind: 'basicConstraints', ca: false, pathLen: undefined });
    expect(ext(chain.ordered[1].cert, 'Basic Constraints')!.decoded).toEqual({ kind: 'basicConstraints', ca: true, pathLen: 0 });
    expect(ext(leaf, 'CRL Distribution Points')!.decoded).toEqual({ kind: 'crlDp', urls: [{ type: 'URI', value: 'http://crl.example.test/int.crl' }] });
    expect(ext(leaf, 'Authority Information Access')!.decoded).toEqual({
      kind: 'aia',
      entries: [
        { method: 'OCSP', location: { type: 'URI', value: 'http://ocsp.example.test' } },
        { method: 'CA Issuers', location: { type: 'URI', value: 'http://ca.example.test/int.crt' } },
      ],
    });
    expect(ext(leaf, 'Certificate Policies')!.decoded).toMatchObject({ policies: [{ name: 'Domain Validated (DV)' }, { oid: '1.3.6.1.4.1.99999.1' }] });
    const aki = ext(leaf, 'Authority Key Identifier')!.decoded as { keyId: string };
    const ski = ext(chain.ordered[1].cert, 'Subject Key Identifier')!.decoded as { hex: string };
    expect(aki.keyId).toBe(ski.hex);
  });

  it('reports a missing issuer', () => {
    const leaf = fixture('chain.pem').match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/)![0];
    const chain = buildChain(inspectText(leaf).items.map((i) => i.result as Certificate));
    expect(chain.ordered[0].link).toBe('issuer-missing');
  });

  it('decodes the bundled sample', () => {
    const r = inspectText(SAMPLE_PEM);
    expect(r.items.length).toBeGreaterThan(1);
    expect(r.items.every((i) => i.result?.kind === 'certificate')).toBe(true);
  });
});

describe('CSRs and keys', () => {
  it('decodes a CSR with requested extensions', () => {
    const csr = first<CertificateRequest>(fixture('request.csr.pem'));
    expect(csr.kind).toBe('csr');
    expect(csr.subject.text).toBe('CN=csr.example.test, O=Zykit, ST=CA, C=US');
    expect(csr.publicKey).toMatchObject({ type: 'EC', curve: 'P-384', bits: 384 });
    expect(ext(csr, 'Subject Alternative Name')!.decoded).toMatchObject({ names: [{ value: 'csr.example.test' }, { value: 'www.csr.example.test' }] });
  });

  it('decodes public keys', () => {
    expect(first<PublicKeyBlock>(fixture('ec-public.pem')).publicKey).toMatchObject({ type: 'EC', curve: 'P-256' });
    expect(first<PublicKeyBlock>(fixture('ed25519-public.pem')).publicKey).toMatchObject({ type: 'Ed25519', bits: 256 });
  });

  it('reports only metadata for private keys', () => {
    const ec = first<PrivateKeyBlock>(fixture('ec-private-pkcs8.pem'));
    expect(ec).toEqual({ kind: 'private-key', format: 'PKCS#8', type: 'EC', curve: 'P-256', bits: 256, encrypted: false });
    const rsa = first<PrivateKeyBlock>(fixture('rsa-private-pkcs1.pem'));
    expect(rsa).toEqual({ kind: 'private-key', format: 'PKCS#1 RSA', type: 'RSA', bits: 2048, encrypted: false });
  });

  it('explains bad input', () => {
    expect(inspectText('hello').notices[0]).toMatch(/No PEM blocks/);
    expect(inspectText('-----BEGIN CERTIFICATE-----\nAAAA').notices[0]).toMatch(/END/);
    expect(inspectText('-----BEGIN CERTIFICATE-----\n!!!!\n-----END CERTIFICATE-----').items[0].error).toMatch(/Base64/);
    expect(inspectText('-----BEGIN X509 CRL-----\nMAA=\n-----END X509 CRL-----').items[0].error).toMatch(/not supported/);
    expect(inspectText('-----BEGIN CERTIFICATE-----\nMAA=\n-----END CERTIFICATE-----').items[0].error).toBeTruthy();
    expect(decodeBase64('a')).toBeNull();
  });
});
