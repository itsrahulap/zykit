# Log Viewer

## Purpose

Views NDJSON / JSON Lines and plain-text logs with level, text, field and time filters, and exports the filtered view. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`: logs often hold sensitive data) |
| `LogViewerPage.tsx` | Page: input, level chips, filters, windowed list, entry detail, export |
| `features/log.ts` | `parseLog`, `detectFields`, `levelCounts`, `filterLog`, `toNdjson`, `prettyEntry` |

## Core Logic

`parseLog` splits lines; a line starting with `{` that parses to an object is a JSON entry (level/time/message found via alias key lists, pino numeric levels, epoch times). Other lines match an ISO-timestamp + optional level regex, or a leading level; indented lines without either join the previous text entry. `filterLog` ANDs level, substring over the raw line, `field=value` pairs on flattened paths, and the time range. The list uses absolutely positioned fixed-height rows inside a spacer; the expanded entry renders below the list.

## Limits

- Files up to 50 MB; parsing runs on the main thread. The textarea is hidden for text above 1,000,000 characters.

## Tests

- Unit: `tests/tools/log-viewer/log.test.ts`. `npm test -- log-viewer`
- E2E: `e2e/log-viewer.spec.ts`. `npm run test:e2e -- log-viewer`

## Known Gaps

- No worker, no regex search, no multi-key sort, no field-value autocomplete.
