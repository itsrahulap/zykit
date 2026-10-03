# Office Metadata Cleaner

## Purpose

Shows and blanks the metadata of .docx, .xlsx, .pptx (and macro forms) and .odt, .ods, .odp files without changing the document content. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`) |
| `OfficeMetadataCleanerPage.tsx` | Intake, file cards, options, before/after, downloads and ZIP |
| `features/office-metadata-cleaner.ts` | Pure logic: format detection, `inspectOffice`, `cleanOffice`, `editPart`, `leftovers`, field tables |
| `features/zip-archive.ts` | ZIP reader (central directory, stored and deflate, size caps, zip-slip-safe names) and writer that copies untouched entries as stored |
| `features/xml.ts` | Small XML reader: no DTD interpretation, predefined and numeric entities only, depth and node caps |

## Core Logic

`openZip` validates every entry name and reads only the directory; `readEntry` inflates a part with `DecompressionStream('deflate-raw')` under a hard cap and checks size and CRC. `inspectZip` reads core, app and custom properties, counts comments and tracked changes, lists hidden sheets and slides, reviewers and the thumbnail. `cleanOffice` edits metadata XML as text with prefix-agnostic element removal (core and app elements are optional in the OPC schema), anonymises reviewer attributes, removes the thumbnail with its relationship or manifest entry, writes the archive keeping other entries byte for byte (ODF `mimetype` stays first and stored), then re-reads the result.

## Limits

- 200 MB per file, 500 MB total, 50 files, 5000 parts, 64 MB per inflated part.
- No ZIP64, no encrypted ZIP entries, no legacy binary formats.
- Document content, comments, tracked changes, hidden items, macros and printer settings are kept.
- Custom properties are removed whole, including sensitivity-label entries.

## Tests

- Unit: `tests/tools/office-metadata-cleaner/office-metadata-cleaner.test.ts` (ZIP reader limits and unsafe names, XML reader, docx/xlsx/pptx/ODF inspection, cleaning and verification). `npm test -- office-metadata-cleaner`
- E2E: `e2e/office-metadata-cleaner.spec.ts` (pick files, inspect, clean, download, ZIP, no off-origin requests, phone layout). `npm run test:e2e -- office-metadata-cleaner`

## Known Gaps

- ODF hidden sheets are not detected.
- Printer settings and external links are only reported.
- Reviewer anonymisation uses regexes over known parts, not a full OOXML model.
