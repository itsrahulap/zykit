# TOTP Generator

## Purpose

Computes and verifies RFC 6238 TOTP and RFC 4226 HOTP codes from a Base32 secret or an otpauth:// URI, and builds otpauth:// URIs, for testing two-factor logins. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`, no `accepts` / `produces`) |
| `TotpGeneratorPage.tsx` | Secret / URI input, type / algorithm / digits / period / counter options, current + previous / next codes with countdown ring, verify panel, URI builder; `useNow` (250 ms tick) |
| `features/totp-generator.ts` | `base32Decode` / `base32Encode`, `hotp`, `totp`, `timeCounter`, `secondsRemaining`, `verifyCode`, `parseOtpauth`, `buildOtpauth`, `generateSecret`, `groupSecret` |

## Core Logic

Input starting with `otpauth:` is parsed and copied into the option state in `onRaw`; anything else is the Base32 secret. Imported HMAC `CryptoKey`s are cached per key bytes and algorithm in a `WeakMap`. Code and verify results are computed in effects and tagged with `secret|algorithm|digits(|code|window)`, so stale async results are never shown. `verifyCode` checks offsets `0, -1, +1, …` up to the window and skips negative counters. Nothing is persisted.

## Limits

- `parseOtpauth`: digits 6–8, period 1–3600, counter a safe non-negative integer; SHA-1/256/512 only.
- `hotp` counters must be safe integers (`counterBytes` splits into two 32-bit halves).
- No QR encode/decode.

## Tests

- Unit: `tests/tools/totp-generator/totp-generator.test.ts` (RFC 4648 Base32 vectors, tolerant input, invalid characters / lengths, round trip; RFC 4226 appendix D HOTP; RFC 6238 appendix B TOTP for SHA-1/256/512; step and remaining seconds; verify window and malformed codes; otpauth parsing, defaults, errors and build/parse round trip; secret generation and grouping). `npm test -- totp-generator`
- E2E: `e2e/totp-generator.spec.ts` (RFC 6238 code at a fixed clock, verify match / no match, HOTP URI import and **Next counter**, generated URI, **New secret**, secret never in the URL, no off-origin or non-GET requests, phone width). `npm run test:e2e -- totp-generator`

## Known Gaps

- A URI with `digits=7` is accepted, but the **Digits** control only has 6 and 8, so neither is shown as selected.
- **Clear** empties the secret but keeps the other options (type, algorithm, digits, issuer, …).
- The comment above the length check in `base32Decode` lists the valid remainders wrongly (says 0, 2, 3, 4, 7; the code correctly rejects 1, 3, 6).
- The page's privacy banner and RFC footer overlap with `docs.ts`.
