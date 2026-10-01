# UTM Builder

## Purpose

Builds campaign URLs with UTM parameters (single or bulk), normalising values and warning about common tagging mistakes, with a local History of copied links. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`produces: ['url']`, no `accepts`, not `shareable`) |
| `UtmBuilderPage.tsx` | Mode switch, destination and site-domain fields, Campaign fields with Preset select, formatting options, Tagged URL output, History (localStorage load/save) |
| `features/utm.ts` | `UTM_FIELDS`, `PRESETS`, `formatValue`, `parseBase`, `buildUtmUrl`, `buildBulk`, history helpers (`HISTORY_KEY`, `HISTORY_LIMIT`, `addToHistory`, `parseHistory`) |

## Core Logic

`parseBase` adds `https://` when the scheme is missing (treating `host:port` as scheme-less) and requires an http(s) URL with a dotted host, `localhost` or an IP literal. `buildUtmUrl` formats values in `UTM_FIELDS` order, keeps existing raw query pairs except keys being set (reported as replaced), appends `key=encodeURIComponent(value)` and assigns `url.search`, so the fragment survives. Warnings: missing required keys, mixed case, added scheme, replaced keys, internal link (host equals `siteHost` or a subdomain, `www.` ignored). History is written to `localStorage[HISTORY_KEY]` by a `useEffect` (removed when empty) and filled by Copy and Save.

## Limits

- `HISTORY_LIMIT` = 50, deduplicated by URL.
- Only http(s) bases; no whitespace in URLs.
- Not `shareable`; no Send to… input.

## Tests

- Unit: `tests/tools/utm-builder/utm.test.ts` (lowercasing and space modes, existing params and fragment, `%20` mode, added scheme, missing required fields, replacing existing UTM keys, internal-link flag, invalid URLs, bulk mode, history dedupe/cap/junk). `npm test -- utm-builder`
- E2E: `e2e/utm-builder.spec.ts` (tagged URL with params and fragment kept, history persistence, bulk mode, 320 px layout). `npm run test:e2e -- utm-builder`

## Known Gaps

- Copying a link always adds it to History; there's no opt-out other than Clear history.
- Formatting options, site domain and field values aren't remembered between visits.
