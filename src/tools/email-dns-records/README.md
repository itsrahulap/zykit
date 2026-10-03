# SPF / DKIM / DMARC Checker

## Purpose

Validates and explains email-related DNS TXT records (SPF, DKIM, DMARC, MTA-STS, TLS-RPT, BIMI) pasted as plain values or zone snippets, and builds DMARC and SPF records. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (shareable) |
| `EmailDnsRecordsPage.tsx` | Check / Build DMARC / Build SPF modes, record cards, issue lists |
| `features/email-dns-records.ts` | Pure logic: extraction, per-record parsers, DER key inspection, analyser, builders |

## Core Logic

`extractRecords` normalises zone/dig/plain input (joining quoted strings and parenthesised lines). `detectKind` picks a parser; each returns `items` (tag meanings), `issues` (error / warning / info) and `meta`. SPF lookups are counted statically. DKIM `p=` is parsed as SubjectPublicKeyInfo, bare PKCS#1 or raw Ed25519. `analyse` adds cross-record issues (duplicates per owner, BIMI without enforcing DMARC). `buildDmarc` / `buildSpf` omit default values; `toZoneTxt` splits into 255-character strings.

## Limits

Static only: no DNS resolution, so include/redirect chains and external DMARC report authorisation are not verified. Input capped at 200,000 characters.

## Tests

- Unit: `tests/tools/email-dns-records/email-dns-records.test.ts`. `npm test -- email-dns-records`
- E2E: `e2e/email-dns-records.spec.ts`. `npm run test:e2e -- email-dns-records`

## Known Gaps

DMARCbis tags are lightly validated; no IDN/punycode checks on domains; MTA-STS policy files are not parsed.
