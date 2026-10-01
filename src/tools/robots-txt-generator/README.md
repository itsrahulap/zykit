# Robots.txt Generator

## Purpose

Builds a robots.txt from groups of user agents and rules, and tests URLs against the generated or a pasted file with RFC 9309 matching and a linter. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (not `shareable`) |
| `RobotsTxtGeneratorPage.tsx` | Group editor, presets, sitemaps, output with copy / Send to… / download, URL tester, lint list |
| `features/robots.ts` | Pure logic: `generate`, `parse` (doc + lint issues), `normalizePath`, `matches`, `selectGroups`, `toPath`, `testUrl`, `PRESETS`, `AI_CRAWLERS` |

## Core Logic

`generate` skips groups with no user agents and emits an empty `Disallow:` for rule-less groups. `parse` starts a new group on a `User-agent` line that doesn't follow another one, and collects issues with severities (`error` / `warning` / `info`). `testUrl` normalises percent-escapes (`normalizePath`), picks groups with `selectGroups` (longest product-token match, prefix fallback via `token-…`, duplicates merged, else `*`), then takes the longest matching pattern with Allow winning ties. `matches` is a linear-time wildcard matcher supporting `*` and a trailing `$`.

## Limits

- `MAX_ROBOTS_BYTES` = 500 KiB is only a lint warning; the whole text is still parsed.
- Only RFC 9309 directives plus `Sitemap` and `Crawl-delay` are modelled; other known extensions are flagged as non-standard.
- The tester always parses the text, so in "Generated file" mode it tests `generate()` output round-tripped through `parse`.

## Tests

- Unit: `tests/tools/robots-txt-generator/robots.test.ts` (generation and preset round-trips, `*`/`$` matching, longest match and tie-breaks, empty Disallow, percent-encoding, group selection and merging, full-URL paths, lint messages, grouping and comments). `npm test -- robots-txt-generator`
- E2E: `e2e/robots-txt-generator.spec.ts` (presets, URL tests and download, pasted file test + lint, 320 px layout). `npm run test:e2e -- robots-txt-generator`

## Known Gaps

- The generated output isn't linted; only pasted files show lint notes.
- `AI_CRAWLERS` is a hand-maintained list and goes stale.
- The page ends with its own paragraph explaining RFC 9309 matching, which now overlaps with `docs.ts`.
