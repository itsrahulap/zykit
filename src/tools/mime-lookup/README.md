# MIME Type Lookup

## Purpose

Maps file extensions and file names to MIME types and back, from a built-in table, and compares a local file's extension-based type with the browser-reported one. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (not `shareable`) |
| `MimeLookupPage.tsx` | Search box, result list (first 60, then "Show all"), `FileCheck` panel |
| `features/mimeTypes.ts` | The table (`GROUPS` text blocks per category), `MIME_TYPES`, `extensionOf`, `lookupExtension`, `searchMime` |

## Core Logic

`GROUPS` holds one `<mime> <ext>…` line per type per category, with a trailing `~` flipping the category's default compressibility; `parse()` builds `MIME_TYPES` (376 types, first occurrence of a MIME wins). `BY_EXT` maps each extension to the first type that lists it. `extensionOf` handles paths, dotfiles and the `COMPOUND` two-part extensions. `searchMime` ranks: exact extension, listed extension, extension prefix, MIME-part prefix, MIME substring / category; queries with `/` are MIME substring searches.

## Limits

- Static table; no runtime source of truth, so new types need a manual edit.
- Shared extensions resolve to the first listed type (`.ts` → `video/mp2t`).
- `FileCheck` uses `File.name` and `File.type` only; contents are never read.

## Tests

- Unit: `tests/tools/mime-lookup/mimeTypes.test.ts` (table size and uniqueness, modern extensions, compressibility, file-name/extension parsing, search ranking by extension, MIME prefix, file name, no-match). `npm test -- mime-lookup`
- E2E: `e2e/mime-lookup.spec.ts` (extension, MIME, file-name and local-file lookups, 320 px layout). `npm run test:e2e -- mime-lookup`

## Known Gaps

- `COMPOUND` maps `d.ts` to `ts`, which resolves to `video/mp2t` rather than TypeScript.
- No content sniffing (magic bytes).
- The page has its own explanatory paragraph (sources, "compressible") that now overlaps with `docs.ts`.
