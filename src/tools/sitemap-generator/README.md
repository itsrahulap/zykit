# Sitemap Generator

## Purpose

Generates sitemaps.org XML sitemaps from a URL list, splitting into several files plus an index when limits are exceeded, and validates existing sitemaps. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (not `shareable`) |
| `SitemapGeneratorPage.tsx` | Generate / Validate modes, defaults, notices, single output or file list + index |
| `features/sitemap.ts` | Pure logic: `parseUrlList`, `normalizeUrl`, `isW3cDate`, `escapeXml`, `buildSitemaps`, `parseXml` (minimal XML parser), `validateSitemap` |

## Core Logic

`parseUrlList` splits each line on whitespace/commas: the first token must pass `normalizeUrl` (WHATWG `URL`, http(s) only, hash removed), the rest are classified as lastmod, priority or changefreq; `extract` mode regex-scans free text instead. `buildSitemaps` accumulates `<url>` blocks and starts a new chunk when `MAX_URLS` (50,000) or `MAX_BYTES` (50 MiB, measured with `TextEncoder`) would be exceeded; more than one chunk yields `sitemap-N.xml` files and a `sitemap-index.xml`. `parseXml` is a hand-written well-formedness checker (PIs, comments, CDATA, entities, no DTD) with line numbers; `validateSitemap` works on local names so prefixed roots work.

## Limits

- Limits per file come from `MAX_URLS` and `MAX_BYTES`; the index itself is not split (sitemaps.org caps an index at 50,000 entries too).
- Start tags are matched within a 4,096-character window, so a single enormous tag is reported as malformed.
- Only `<url>`/`<sitemap>` core children are validated; extensions are skipped.

## Tests

- Unit: `tests/tools/sitemap-generator/sitemap.test.ts` (URL parsing, dedupe, columns, text extraction, date checks; escaping, splitting by count and size with an index; malformed XML lines, namespace, duplicates, values, hosts, wrong roots, DOCTYPE, comments/CDATA/entities/prefixed roots). `npm test -- sitemap-generator`
- E2E: `e2e/sitemap-generator.spec.ts` (escaped sitemap + download, validating a pasted sitemap, 320 px layout). `npm run test:e2e -- sitemap-generator`

## Known Gaps

- No image/video/news or hreflang (`xhtml:link`) output.
- No `.xml.gz` input or output.
- The page ends with its own explanatory paragraph (changefreq/priority, hreflang) that now overlaps with `docs.ts`.
