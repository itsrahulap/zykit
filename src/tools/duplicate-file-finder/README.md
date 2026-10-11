# Duplicate File Finder

## Purpose

Finds files with identical content among files, a folder or dropped items: group by size, then SHA-256. Reports duplicate groups and wasted space, exports CSV/JSON. It cannot delete files (browser). User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`) |
| `DuplicateFileFinderPage.tsx` | Page: pickers, folder drop walk, scan with progress and cancel, results, reports |
| `features/duplicate-file-finder.ts` | Pure logic: `pickCandidates`, `groupDuplicates`, `toCsv`, `toJson`, limits |
| `workers/hash.worker.ts`, `workers/hash.protocol.ts` | SHA-256 in a worker, one file at a time, with progress messages |

## Core Logic

`pickCandidates` drops empty files, groups by size and keeps groups of 2+ that fit `MAX_FILE_BYTES` (2 GB) and, smallest first, `MAX_TOTAL_BYTES` (8 GB); the rest are reported. The worker reads each `File` fully and hashes it with `crypto.subtle`; each result also reports its byte count for the progress bar. Cancel terminates the worker. `groupDuplicates` keys by `size:hash` and sorts by wasted bytes. CSV cells starting with `= + - @` are prefixed with `'` to defeat spreadsheet formula injection.

## Limits

- 20,000 files, 2 GB per file, 8 GB total hashed, whole-file reads (no streaming in `crypto.subtle`). Files are not deleted.

## Tests

- Unit: `tests/tools/duplicate-file-finder/duplicate-file-finder.test.ts` (size grouping, limits, duplicate groups, CSV/JSON). `npm test -- duplicate-file-finder`
- E2E: `e2e/duplicate-file-finder.spec.ts`. `npm run test:e2e -- duplicate-file-finder`

## Known Gaps

- No byte-by-byte verification, near-duplicate (similar image) detection, or keep-one selection helpers.
