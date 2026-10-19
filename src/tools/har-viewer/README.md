# HAR Viewer

## Purpose

Opens a HAR file and shows requests with filter, sort, a timing waterfall, per-request detail and a summary. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`: HARs can hold secrets) |
| `HarViewerPage.tsx` | Page: open/drop, filter, windowed table with waterfall, detail panel, summary |
| `hooks/useHar.ts` | Owns the worker; `load` replaces the file, `open(i)` asks for one entry's detail |
| `workers/har.worker.ts`, `har.protocol.ts` | Reads the file, parses JSON, keeps raw entries, answers `load` and `detail` |
| `features/har.ts` | `parseHar`, `buildRows`, `summarize`, `entryDetail`, `viewRows` |

## Core Logic

The worker reads the `File` itself (no copy through the main thread), parses it with `parseJsonText` (errors get line/column) and checks `log.entries`. Only lean `HarRow`s and the summary are posted back; headers, post data and body previews are built on demand for the selected entry. The table uses fixed-height rows with spacer rows (the csv-viewer pattern). Waterfall segments are positioned by `start` and phase durations as a percentage of the total span. `isSensitiveHeader` / `isSensitiveParam` decide what the page masks (`Masked`, per-value reveal reset on each selection, or the global switch); `redactUrl` masks sensitive query and fragment parameters and URL passwords, and is used for every URL shown. `redactHar` runs in the worker on a `structuredClone` of the full document (kept as `doc`), replacing sensitive headers, all cookies, sensitive `queryString` items, URLs, `Referer`/`Location`/`Origin`, page titles and request bodies, and optionally deleting response `content.text`. `HarRow.sizeKnown` / `timeKnown` let the UI show “n/a”.

## Limits

- Files up to 200 MB. Response previews are text only, capped at 100,000 characters.

## Tests

- Unit: `tests/tools/har-viewer/har.test.ts`. `npm test -- har-viewer`
- E2E: `e2e/har-viewer.spec.ts`. `npm run test:e2e -- har-viewer`

## Known Gaps

- No `pages` or WebSocket view; single-key sort; filter is a text match only; very large HARs still need memory for the whole parsed JSON in the worker.
