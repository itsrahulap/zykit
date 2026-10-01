# CSV Viewer

## Purpose

Shows CSV/TSV as a virtualised table with sorting, global and per-column filtering, column hiding, column stats and export of the current view. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['csv']`, not shareable) |
| `CsvViewerPage.tsx` | Page: input/drop zone, table options, column picker, virtualised `DataTable`, stats panel, export, Send to… intake |
| `features/table.ts` | `buildTable` (parse, pad, header names, `MAX_ROWS`), `detectType`, `columnInfo` stats, `viewRows` (filter + sort) |
| `hooks/useCsvTable.ts` | Debounced (200 ms) worker requests; a newer request terminates a busy worker |
| `workers/csv.worker.ts`, `workers/csv.protocol.ts` | Runs `buildTable` off the main thread |
| `../../shared/lib/csv.ts` | Shared `parseCsv`, `detectDelimiter`, `writeCsv`, `DELIMITER_LABELS` |

## Core Logic

Parsing and stats run in the worker. Filtering and sorting run on the main thread over row indices (`viewRows`), with `useDeferredValue` on the filter inputs. Number sort precomputes keys in a `Float64Array`, and text sort uses `Intl.Collator` (`numeric: true`, `sensitivity: 'base'`). Both keep the original order on ties and put empties last. The table draws only the rows in view plus `OVERSCAN` (10) at `ROW_H` 36 px. Column-dependent state (filters, sort, hidden, stats column) resets whenever a new table arrives.

## Limits

- `MAX_FILE_BYTES` = 200 MB (`OpenFileButton` / `DropZone`); `MAX_TEXTAREA_CHARS` = 1,000,000 (larger sources aren't mirrored into the textarea).
- `MAX_ROWS` = 1,000,000 data rows; column width hint from the first 200 values, clamped to 6–40 ch.

## Tests

- Unit: `tests/tools/csv-viewer/table.test.ts` (type detection and stats, ragged rows and headerless names, distinct header names, 100k-row timing, numeric sort with empties last, case-insensitive text sort, global and column filters). `npm test -- csv-viewer`
- E2E: `e2e/csv-viewer.spec.ts` (sort, search and filter, copy row, export view, hiding columns, stats, same-origin requests only, a 100k-row file with virtualised rendering, 320 px layout). `npm run test:e2e -- csv-viewer`

## Known Gaps

- Opening a `.tsv` sets the delimiter to tab, but opening a `.csv` afterwards doesn't set it back to **Detect**.
- Type detection scans every value, so one stray value turns a column into text; there's no per-column override.
- Filters are plain "contains" matches; no numeric ranges or regex.
