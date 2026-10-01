# Meta Tag Inspector

## Purpose

Reviews pasted page HTML for SEO and social tags (title, description, canonical, robots, Open Graph, X / Twitter, JSON-LD, headings) and renders approximate preview cards. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (no `accepts`, not `shareable`) |
| `MetaTagInspectorPage.tsx` | Input (paste, drop, Open file, sample, `MAX_CHARS`), checklist, Basics, OG/Twitter, hreflang/icons, JSON-LD and headings panels |
| `features/extract.ts` | `parseHtml` (`DOMParser`, inert) and `extractMeta` → plain `PageMeta` (`MAX_ITEMS` = 500, value clipping) |
| `features/analyze.ts` | `analyze` (all checks and preview data), `analyzeJsonLd`, `resolveUrl`, `truncate`, `TITLE_RANGE`, `DESCRIPTION_RANGE`, `SAMPLE_HTML` |
| `components/Previews.tsx` | Google, Facebook / LinkedIn and X card previews with image placeholders (images never loaded) |

## Core Logic

`parseHtml` is the only DOM-dependent step; everything in `analyze.ts` is pure and works on `PageMeta`. `analyze` emits `Check`s with levels `error` / `warning` / `info` / `good` per area. The base URL for resolving relative links is the first absolute of canonical or `og:url`, adjusted by `<base href>`. Open Graph and Twitter maps keep the first occurrence of each key; Twitter keys are read from `name` or `property`. Preview fields prefer `og:*` / `twitter:*` and fall back to `<title>` and the meta description.

## Limits

- Input truncated to `MAX_CHARS` = 5,000,000 characters (files over 5 MB get a notice).
- No URL fetching (CSP `connect-src 'self'`); images in previews are never requested.
- Not `shareable`; no Send to… input.

## Tests

- Unit: `tests/tools/meta-tag-inspector/analyze.test.ts` (well-tagged page, missing/problematic tags, length boundaries, Twitter → OG fallback, URL resolution and JSON-LD). `npm test -- meta-tag-inspector`
- E2E: `e2e/meta-tag-inspector.spec.ts` (sample with previews and no image loads, pasted HTML never runs or loads, opening a saved file, 320 px layout). `npm run test:e2e -- meta-tag-inspector`

## Known Gaps

- No HTTP-header checks (`X-Robots-Tag`, `Link: rel=canonical`).
- JSON-LD is only checked for JSON validity; no schema.org or rich-result validation.
- Length checks count characters, not rendered pixel width.
