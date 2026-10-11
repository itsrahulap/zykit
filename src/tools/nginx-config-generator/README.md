# nginx Config Generator

## Purpose

Builds an nginx server block (with comments) for static sites, SPAs, reverse proxies with load balancing, PHP-FPM and redirects. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `NginxConfigGeneratorPage.tsx` | Page: preset, options, certificate fields, output, warnings, share state |
| `features/nginx-config-generator.ts` | `generate(options)`: pure text builder with input validation |

## Core Logic

`generate` validates each user value against an allow-list pattern (no spaces, quotes, `;`, braces, `$`), falls back to a safe default with a warning, then appends lines per preset: optional `upstream`, `map` and `limit_req_zone` first, an HTTP to HTTPS server when TLS is on, and the main `server` with TLS, HSTS, security headers, gzip, logs and the preset's `location` blocks. The redirect preset emits only small 301 servers.

## Limits

- Output is not validated by nginx; `nginx -t` is the check. One server block per run. No Brotli directives (module needed), no CSP (see CSP Builder).

## Tests

- Unit: `tests/tools/nginx-config-generator/nginx-config-generator.test.ts` (each preset, TLS, proxy options, redirects, input rejection). `npm test -- nginx-config-generator`
- E2E: `e2e/nginx-config-generator.spec.ts`. `npm run test:e2e -- nginx-config-generator`

## Known Gaps

- No multiple locations, auth, caching of proxied responses, or `ssl_stapling`. Cipher suites are left to nginx defaults.
