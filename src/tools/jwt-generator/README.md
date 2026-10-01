# JWT Generator

## Purpose

Builds a JWS-signed JSON Web Token from header and payload JSON, signing with HMAC, RSA, RSA-PSS, ECDSA or Ed25519 via Web Crypto, and can generate test key pairs. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`produces: ['jwt']`, not shareable) |
| `JwtGeneratorPage.tsx` | Algorithm select, header/payload editors, claim helpers, secret / private key input, key pair generation, signed-token output, handoff to `jwt-decoder` |
| `features/sign.ts` | `ALGORITHMS`, `algInfo`, `importPrivateKey` (PKCS#8 PEM / JWK, with targeted errors), `generateKeyPair`, `supportsEd25519`, `signJwt`, claim helpers (`setClaims`, `secondsFromNow`, `randomJti`), `parseJsonObject` |

Reuses `ColouredToken` from `src/tools/jwt-decoder/components/`.

## Core Logic

The page re-signs 150 ms after any input changes. `signJwt` forces `header.alg`, Base64URL-encodes `JSON.stringify` of header and payload, and signs with `crypto.subtle.sign` (PSS salt = hash length; ECDSA output is already raw `r||s`). Imported keys are non-extractable; generated pairs are extractable so they can be exported as PKCS#8/SPKI PEM and JWK. Changing to an algorithm with a different key type clears the key.

## Limits

- JWS only; no JWE, no `none`.
- Private keys: PKCS#8 PEM or JWK only. RSA generation is fixed at 2048 bits (`rsaBits` default).
- EdDSA is listed only when `supportsEd25519()` resolves true.

## Tests

- Unit: `tests/tools/jwt-generator/sign.test.ts` (every algorithm verifies with the JWT Decoder's `verifyJwt`, text and Base64 secrets, PEM and JWK keys, EdDSA when supported, alg override and short-secret warnings, key error messages, claim helpers). `npm test -- jwt-generator`
- E2E: `e2e/jwt-generator.spec.ts` (default HS256 signing, ES256 token handed to the decoder, invalid JSON and bad key messages, 320 px layout). `npm run test:e2e -- jwt-generator`

## Known Gaps

- No RSA key size choice, no `kid` helper, no JWE.
- The page's "About" panel (`JwtGeneratorPage.tsx`) overlaps with `docs.ts`.
- **Set exp** says "Enter a positive number" but accepts 0.
