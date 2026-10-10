# Bcrypt Generator

## Purpose

Generates and verifies bcrypt hashes in the browser, with a self-written bcrypt (no dependency). User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`: it handles passwords) |
| `BcryptGeneratorPage.tsx` | Generate / Verify UI, hash parts, cost-time estimates |
| `bcrypt.worker.ts` | Runs hash and verify off the main thread |
| `features/bcrypt.ts` | Pure bcrypt: pi-derived Blowfish tables, EksBlowfishSetup, bcrypt Base64, `parseHash`, `bcryptVerify`, constant-time compare |

## Core Logic

The Blowfish P-array and S-boxes are the fractional hex digits of pi, computed once with BigInt (Machin formula) instead of shipping the table. The password is UTF-8 plus a NUL byte, cut to 72 bytes. Salt is 16 bytes from `crypto.getRandomValues`. Time estimates scale a cost-4 benchmark by 2^(cost-4).

## Limits

- Cost 4–15; 72-byte password cut-off (warned in the UI); `$2a$`/`$2b$`/`$2y$` only.
- Pure JS, so much slower than native bcrypt.

## Tests

- Unit: `tests/tools/bcrypt-generator/bcrypt-generator.test.ts` (known OpenBSD-style vectors incl. empty password, 72+ byte, `$2y$`, helpers). `npm test -- bcrypt-generator`
- E2E: `e2e/bcrypt-generator.spec.ts` (generate, verify, no network, phone layout).

## Known Gaps

- No cancel for a running high-cost hash other than leaving the page.
- No `$2x$`.
