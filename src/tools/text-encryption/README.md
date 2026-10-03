# Encrypt / Decrypt Text

## Purpose

Encrypts and decrypts text or files (up to 100 MB) with a passphrase, using PBKDF2-SHA-256 + HKDF + AES-256-GCM via Web Crypto. Output is a self-describing `zykit:v1:` string or a `.zyk` file. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts`/`produces: ['text']`, not shareable) |
| `TextEncryptionPage.tsx` | Mode (encrypt/decrypt) and source (text/file) switches, passphrase with strength meter, iteration select, result with copy / Send to / download, format notes |
| `features/text-encryption.ts` | `encryptText`, `decryptText`, `encryptFile`, `decryptFile`, `parseText`, `readEnvelope`, `DecryptError` (`format` / `corrupt` / `passphrase`), `passphraseStrength` |

## Core Logic

Envelope (big-endian): `kind u8 (0 text, 1 file) | iterations u32 | salt 16 | iv 12 | check 8 | ciphertext+tag`. PBKDF2-SHA-256 (default 600,000 iterations) gives a 256-bit master; HKDF-SHA-256 (empty salt) derives the AES-GCM key (`info "zykit v1 aes-256-gcm"`) and an 8-byte check value (`info "zykit v1 passphrase check"`). The 41-byte header is the GCM additional data. Decryption compares the check value first (mismatch → `passphrase`), then GCM (failure → `corrupt`). Text form: `zykit:v1:` + Base64URL(envelope), whitespace ignored. File form: `ZYK1` + envelope; plaintext is `u16 nameLen | name | bytes`.

## Limits

- Files up to `MAX_FILE_BYTES` (100 MB), processed in memory.
- Iterations accepted on decrypt: 100,000 to 10,000,000.
- Not OpenSSL-compatible; OpenSSL `Salted__` input gets a specific error.

## Tests

- Unit: `tests/tools/text-encryption/text-encryption.test.ts` (round trips at 600k iterations, fresh salt/IV, wrong passphrase, tampered ciphertext/tag/IV/salt, truncation, iteration bounds, unknown formats, file round trip, text/file separation, strength grades). `npm test -- text-encryption`
- E2E: `e2e/text-encryption.spec.ts` (encrypt → decrypt round trip, wrong passphrase, file encrypt download, no off-origin requests, 320 px layout). `npm run test:e2e -- text-encryption`

## Known Gaps

- No streaming: large files need roughly three times their size in memory.
- The strength hint is heuristic (no dictionary beyond a short common-password list).
- No passphrase confirmation field when encrypting.
