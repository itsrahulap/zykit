# Webhook Payload Builder

## Purpose

Builds test webhook requests: sample events with fictional data, an editable JSON body, extra headers, an HMAC-SHA256 signature in GitHub, Stripe or generic style, plus cURL and Node fetch commands and a fixture download. It never sends anything. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `WebhookPayloadBuilderPage.tsx` | Event, method, URL, header rows, signature options, JSON body with error panel, request card (signature, cURL, fetch, fixture download) |
| `features/webhook-payload-builder.ts` | `samplePayload`, `validate`, `sign`, `eventHeader`, `buildRequest`, `toFetch` |

## Core Logic

`validate` checks the URL (http/https), event name, header names (RFC 9110 tokens) and values (no CR/LF), and parses the body with `parseJsonText` for line/column errors. `sign` uses `hmac` from the Hash Generator (WebCrypto) over the UTF-8 bytes of the body, or of `"<unix>.<body>"` for Stripe style, and formats the header (`X-Hub-Signature-256: sha256=…`, `Stripe-Signature: t=…,v1=…`, `X-Signature: …`). `buildRequest` returns the cURL converter's `HttpRequest`, so `toCurl` produces the command (`--data-raw` with POSIX single quotes keeps the body byte-exact). `toFetch` is local because the converter's generator re-serialises JSON bodies, which would break the signature. Signing is async; the page keys the result by its inputs so a stale signature is never shown.

## Limits

- No request is sent: the CSP's `connect-src 'self'` blocks other origins.
- One signature algorithm (HMAC-SHA256) in three header styles; providers that sign other fields or use asymmetric keys aren't covered.
- Values aren't kept in share links (the secret would end up in the URL).

## Tests

- Unit: `tests/tools/webhook-payload-builder/webhook-payload-builder.test.ts` (sample payloads, validation, GitHub's published test vector, Stripe style against Node `crypto`, unicode bodies, headers, and that both cURL and fetch output carry the exact signed bytes). `npm test -- webhook-payload-builder`
- E2E: `e2e/webhook-payload-builder.spec.ts`. `npm run test:e2e -- webhook-payload-builder`

## Known Gaps

- No Slack, Shopify or Svix signature formats yet.
- Fixtures are downloaded one at a time.
