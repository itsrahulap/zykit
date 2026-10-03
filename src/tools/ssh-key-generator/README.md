# SSH Key Generator

## Purpose

Generates Ed25519, ECDSA (P-256/384/521) and RSA (2048/3072/4096) key pairs with Web Crypto and encodes them as an OpenSSH public key line, an unencrypted `openssh-key-v1` private key, PKCS#8/SPKI PEM, SHA-256/MD5 fingerprints and an `authorized_keys` line. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`produces: ['text']` for the public key only, not shareable) |
| `SshKeyGeneratorPage.tsx` | Key type / comment form, Ed25519 feature detection, fingerprints, public / private (OpenSSH or PKCS#8) / SPKI blocks with copy and download, authorized_keys option builder |
| `features/ssh-key-generator.ts` | `generateSshKey`, SSH wire helpers (`sshString`, `sshMpint`, `SshReader`), `buildOpenSshPrivateKey`, `parseOpenSshPrivateKey`, `parseOpenSshPublicKey`, fingerprints, `supportsEd25519`, `authorizedKeysLine`, `checkExpiry` |

## Core Logic

Key material comes from `exportKey`: Ed25519 public via `raw`, seed from the last 32 bytes of PKCS#8; ECDSA `Q` via `raw` (uncompressed) and `d` from JWK; RSA `n,e,d,p,q,qi` from JWK. Public blobs follow RFC 4253 / 5656 / 8709. The private file is `"openssh-key-v1\0" | string "none" | string "none" | string "" | uint32 1 | string pubblob | string (check, check, type, fields, comment, pad 1..n to 8)`, Base64 wrapped at 70 columns. Private fields: Ed25519 `pub, seed||pub`; ECDSA `curve, Q, mpint d`; RSA `mpint n, e, d, iqmp, p, q`.

## Limits

- No private-key encryption (bcrypt-pbkdf + aes256-ctr is not implemented); users are told to run `ssh-keygen -p`.
- Ed25519 only where `supportsEd25519()` resolves true.
- No DSA, `-sk` or certificate types.

## Tests

- Unit: `tests/tools/ssh-key-generator/ssh-key-generator.test.ts` (every type except RSA 3072/4096 is parsed back from the OpenSSH outputs and re-imported into Web Crypto for a sign/verify check, mpint encoding, padding/structure checks, a fingerprint verified against `ssh-keygen`, authorized_keys options; when `ssh-keygen` is installed, `-l`, `-y`, `-E md5` and `-i -m PKCS8` are run on generated keys, otherwise those tests are skipped). `npm test -- ssh-key-generator`
- E2E: `e2e/ssh-key-generator.spec.ts` (generate, outputs and download, authorized_keys options, no off-origin requests, 320 px layout). `npm run test:e2e -- ssh-key-generator`

## Known Gaps

- No passphrase-protected OpenSSH output.
- RSA 3072/4096 are not covered by unit tests (slow to generate).
- No import/inspection of existing keys.
