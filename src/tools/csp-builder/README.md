# CSP Builder

## Purpose

Builds a Content-Security-Policy directive by directive, evaluates it (grade and findings like Google's CSP Evaluator), and outputs it as a header, meta tag or server config. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (shareable) |
| `CspBuilderPage.tsx` | Presets, directive cards with source chips, import, evaluation, output, hash generator |
| `features/csp-builder.ts` | Pure logic: directive catalogue, source validation, parse/serialise, presets, evaluator, formatters, hashes/nonces |

## Core Logic

Policies are `{ name, sources[] }[]`. Parsing reuses `parseCsp` from `src/tools/http-headers/features/values.ts`. `effectiveSources` follows the fallback chain. `evaluate` returns findings (high/medium/low/syntax/info/ok), a 0-100 score and an A-F grade (any High finding caps the grade at C). `formatOutput` emits header, nginx, Apache, Vercel and Netlify; `metaTag` strips directives that meta ignores. `cspHash` uses Web Crypto; `generateNonce` uses `crypto.getRandomValues`.

## Limits

Static analysis only; the bypass-host list (`BYPASS_HOSTS`) is small and hand-maintained. Nonces are examples. Meta delivery cannot be Report-Only.

## Tests

- Unit: `tests/tools/csp-builder/csp-builder.test.ts`. `npm test -- csp-builder`
- E2E: `e2e/csp-builder.spec.ts`. `npm run test:e2e -- csp-builder`

## Known Gaps

No `script-src` checks for Trusted Types policy correctness, no per-directive evaluation of `sandbox` tokens, no fetching of live headers.
