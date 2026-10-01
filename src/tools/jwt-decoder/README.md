# JWT Decoder

## Purpose

Decodes a JWS-signed JSON Web Token, explains its registered claims and verifies its signature locally with Web Crypto. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['jwt']` for Send to…) |
| `JwtDecoderPage.tsx` | Page: input, decoded panels, warnings, example token |
| `features/jwt.ts` | `cleanToken`, strict base64url → UTF-8 → JSON decoding, `decodeJwt`, header warnings |
| `features/claims.ts` | RFC 7519 registered claims, NumericDate handling, `tokenStatus` (expired / not yet valid) |
| `features/verify.ts` | `verifyJwt`: HMAC / RSASSA-PKCS1-v1_5 / RSA-PSS / ECDSA via `crypto.subtle`, PEM (SPKI) and JWK / JWK Set import |
| `components/` | `ColouredToken`, `ClaimsPanel`, `VerifyPanel` |

## Core Logic

`decodeJwt` rejects anything that isn't three segments (and names five-segment JWEs), decodes header and payload with a strict base64url decoder (whitespace is rejected, trailing `=` tolerated) and a fatal UTF-8 decoder, and requires both to be JSON objects. `verifyJwt` picks the algorithm from `header.alg` only (`parseAlg`), imports the key for exactly that algorithm, and verifies over `header.payload`. ES signatures are raw `r||s`, which Web Crypto accepts directly. For JWKs only public fields are imported.

## Limits

- Algorithms: HS/RS/PS/ES with 256/384/512. EdDSA and others decode but can't be verified.
- No JWE, no PKCS#1 or certificate PEMs, no `crit` processing, no `iss`/`aud` validation, no clock-skew leeway.
- Not `shareable`: tokens and keys never go into share links.

## Tests

- Unit: `tests/tools/jwt-decoder/jwt.test.ts` (decoding errors, claims; verification with HS256/512, RS256, PS256 and ES256/384/512). `npm test -- jwt-decoder`
- E2E: `e2e/jwt-decoder.spec.ts` (example token decodes and verifies with only same-origin GETs, malformed and JWE errors, phone layout). `npm run test:e2e -- jwt-decoder`

## Known Gaps

- No EdDSA (Ed25519) verification, although newer browsers support it in Web Crypto.
- Can't fetch a JWKS from a URL by design (the CSP blocks third-party requests); keys must be pasted.
