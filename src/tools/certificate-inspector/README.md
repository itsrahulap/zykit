# Certificate Inspector

## Purpose

Decodes PEM or DER X.509 certificates, PKCS#10 CSRs, public keys and private-key containers (metadata only), orders pasted chains and checks their signatures with Web Crypto. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (no `accepts` / `produces`, not shareable) |
| `CertificateInspectorPage.tsx` | PEM textarea + drop zone, **Open file**, sample / clear, notices, `ChainView` (order + async signature checks), "What you can paste" panel |
| `components/ItemCard.tsx` | Per-block card for certificates, CSRs, public keys, private keys and errors; extension rendering, `ValidityBadge`, async `Fingerprints` |
| `features/asn1.ts` | Strict DER reader (`parseDer`, `parseInner`, typed readers; `MAX_DEPTH` 32, 100,000 node cap) |
| `features/x509.ts` | `decodeCertificate`, `decodeCsr`, `decodePublicKey`, `decodeRsaPublicKey`, `decodePrivateKey`, `readPublicKeyInfo`, extension decoders, `sniffDer`, `bytesEqual` |
| `features/inspect.ts` | PEM block scan, `decodeDer` (label → decoder), `inspectText` / `inspectBytes`, `validity`, `issuedBy`, `buildChain`, `fingerprint`, `verifySignature` |
| `features/oids.ts` | OID → name table, `CURVE_BITS` |
| `features/sample.ts` | `SAMPLE_PEM` test chain (leaf → intermediate → root) |

Shared code: `tryBase64ToBytes` from `src/shared/lib/base64.ts`; `DropZone`, `OpenFileButton`, `Notices`.

## Core Logic

`inspectText` matches `-----BEGIN X----- … -----END X-----`, short-circuits mismatched labels, OpenSSH keys and `Proc-Type` encrypted PEM, then Base64-decodes and dispatches on the label; with no PEM it tries bare Base64 starting with `0x30`. `inspectBytes` tries binary DER first, then falls back to text. `buildChain` picks a leaf (a cert that issued none of the others, preferring non-self-issued), walks issuers via `issuedBy` (issuer DER == subject DER, and AKI == SKI when both exist), and reports `inOrder` / `unrelated`. `verifySignature` maps the outer signature OID to Web Crypto (RSASSA-PKCS1-v1_5, ECDSA P-256/384/521 with DER→raw conversion, Ed25519) and returns `null` when unsupported. Private key decoders return only format, type, bits and curve.

## Limits

- `MAX_INPUT_BYTES` 5 MB (files only; pasted text isn't capped), `MAX_BLOCKS` 50.
- No RSA-PSS, DSA, Ed448 or non-NIST curve signature checks; CSR self-signatures aren't verified.
- `now` is captured once at mount, so validity badges don't update while the page is open.

## Tests

- Unit: `tests/tools/certificate-inspector/certificate.test.ts` with `fixtures/` (ASN.1 parsing, strictness, depth cap, time formats, fuzzed input only throws `Asn1Error`; RSA and EC certificates from PEM, DER and bare Base64; validity; out-of-order chain ordering and signature verification; missing issuer; bundled sample; CSR extensions; SPKI / PKCS#1 public keys; private-key metadata only; error messages). `npm test -- certificate-inspector`
- E2E: `e2e/certificate-inspector.spec.ts` (sample chain ordered and verified, DER file upload, private-key warning without showing key material, 320 px layout). `npm run test:e2e -- certificate-inspector`

## Known Gaps

- The inner TBS signature algorithm is read but not compared with the outer one, despite the comment in `decodeCertificate`.
- No PKCS#7 / PKCS#12, no CRL decoding, no revocation, trust-store or hostname checks.
- The page footer ("Everything is decoded in your browser…"), the "What you can paste" panel and the chain panel's note overlap with `docs.ts`.
