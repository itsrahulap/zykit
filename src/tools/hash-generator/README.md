# Hash Generator

## Purpose

Computes MD5, SHA-1, SHA-256, SHA-384 and SHA-512 digests, or SHA-family HMACs, of text or a file. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['text']`) |
| `HashGeneratorPage.tsx` | Text / file source, HMAC toggle and key, output format, results list |
| `features/hash.ts` | `HASH_ALGS`, `HMAC_ALGS`, `MAX_FILE_BYTES`, `digest`, `hmac`, `computeAll`, `formatDigest` |
| `hooks/useHashes.ts` | Debounced `computeAll` (150 ms for text, 0 for files); results tagged with their request so stale ones are dropped |

Shared code: `md5` from `src/shared/lib/hash.ts` (pure JS), `src/shared/lib/base64.ts`, `bytesToHex`.

## Core Logic

The page builds a `HashRequest` (`data` bytes plus optional UTF-8 `hmacKey`) in a `useMemo`; `useHashes` runs `computeAll`, which computes every algorithm in parallel with `crypto.subtle.digest` / `importKey('raw', …HMAC)` + `sign`, or `md5` for MD5. Previous values stay visible (dimmed) while the next set computes. All hashing is on the main thread.

## Limits

- 200 MB per file (`MAX_FILE_BYTES`), read fully into memory with `arrayBuffer()`; text-file drop on the text box uses the shared 10 MB cap.
- No HMAC-MD5; HMAC key is UTF-8 text only and must be non-empty.

## Tests

- Unit: `tests/tools/hash-generator/hash.test.ts` (known vectors for every digest, UTF-8 text, HMAC against RFC 4231 test case 2, MD5 skipped in HMAC mode, hex / HEX / Base64 formatting). `npm test -- hash-generator`
- E2E: `e2e/hash-generator.spec.ts` (text hashing, format switch, HMAC with no off-origin requests; file hashing). `npm run test:e2e -- hash-generator`

## Known Gaps

- No streaming/incremental hashing, so large files block the main thread and use memory equal to their size.
- No SHA-3, BLAKE or CRC algorithms, and no hex/Base64 key input for HMAC.
- The page footer says hashes are computed "with the Web Crypto API", which isn't true for MD5; it also overlaps with `docs.ts`.
