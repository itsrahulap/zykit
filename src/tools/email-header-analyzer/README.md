# Email Header Analyzer

## Purpose

Parses raw email headers into a delivery timeline, SPF/DKIM/DMARC verdicts with domains and alignment, a key-headers table and a list of phishing red flags. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['text']`, not shareable) |
| `EmailHeaderAnalyzerPage.tsx` | Input with samples and file drop; authentication, red flags, key headers, hop timeline, all results and all headers panels |
| `features/email-header-analyzer.ts` | `parseHeaders` (unfolding), `decodeEncodedWords` (RFC 2047), `parseEmailDate`, `parseAddress`, `orgDomain` / `aligned`, `parseReceived` / `buildHops`, `parseAuthResults`, `parseReceivedSpf`, `parseTags`, `analyzeHeaders`, `formatDelay` |
| `features/samples.ts` | Gmail, Microsoft 365 and spoofed sample headers (example domains and IPs) |

## Core Logic

`analyzeHeaders` runs on every (deferred) input change. Received headers are reversed so hop 1 is the origin; clauses are cut at depth-0 keywords, IPs taken from the `from` clause, delays computed between dated hops and skew flagged below −60 s. Authentication data comes from `Authentication-Results` (authserv-id optional, for Microsoft 365), `ARC-Authentication-Results` (with `i=`), `Received-SPF`, `DKIM-Signature` and `ARC-Seal`. Only the topmost Authentication-Results (same authserv-id) and topmost Received-SPF feed the verdicts and alignment; ARC results are a fallback. Alignment is relaxed via an approximate organizational domain. Red flags are sorted high → low.

## Limits

- No DNS lookups or signature verification; results are as reported by the receiving servers.
- Organizational domain is approximated (no Public Suffix List).
- Only the first mailbox in From / Reply-To is used.

## Tests

- Unit: `tests/tools/email-header-analyzer/email-header-analyzer.test.ts` (unfolding, mbox line, body cut-off, RFC 2047 B/Q/adjacent/split multibyte/latin1, date formats, quoted display names, Received variants incl. IPv6 and via, hop ordering and skew, Authentication-Results incl. Microsoft and ARC, Received-SPF, Gmail / Outlook / spoofed samples, punycode and future dates). `npm test -- email-header-analyzer`
- E2E: `e2e/email-header-analyzer.spec.ts` (spoofed sample flags, Gmail sample passes, no off-origin requests, 320 px layout). `npm run test:e2e -- email-header-analyzer`

## Known Gaps

- No BIMI, no per-hop TLS summary, no geolocation of IPs (would need network access).
- Received date parsing ignores timezone abbreviations beyond the US ones defined in RFC 5322.
