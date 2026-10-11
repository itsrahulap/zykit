# Excel to CSV / JSON

## Purpose

Reads `.xlsx`/`.xlsm` workbooks in the browser and exports any sheet (or all sheets as a ZIP) as CSV, TSV or JSON.

## File Structure

```text
src/tools/excel-to-csv/
├── index.ts                 tool definition
├── ExcelToCsvPage.tsx       file picker, sheet select, preview, downloads
├── docs.ts                  user guide shown on the page
└── features/excel-to-csv.ts readWorkbook(), toObjects(), cellRef(), isDateFormat(), serialToIso() (pure)
tests/tools/excel-to-csv/excel-to-csv.test.ts
e2e/excel-to-csv.spec.ts
```

Reuses `openZip`/`readText` from `office-metadata-cleaner/features/zip-archive.ts`, `parseXml` from `xml-json/features/xml.ts`, `writeCsv` from `shared/lib/csv.ts` and `createZip` from `shared/lib/zip.ts`.

## Core Logic

`readWorkbook()` checks for the legacy OLE signature (`.xls` / encrypted), opens the ZIP, resolves sheets through `workbook.xml` + its rels, decodes shared strings (rich-text runs joined), inline strings, booleans and errors, and converts numbers whose style uses a built-in (14–22, 45–47) or custom date format to ISO dates (1900 or 1904 date system). Merged ranges are filled and trailing empty rows/columns removed.

## Limits

- 100 MB per file, 5 million cells; parsing runs on the main thread.
- Values only: no number formatting, formulas give their cached value.

## Tests

Unit tests build small workbooks with the shared ZIP writer: strings, rich text, inline strings, booleans, dates (custom and built-in formats, with time), hidden sheets, absolute rel targets, merged cells, trailing empties, and errors for `.xls`/non-ZIP input. The e2e spec converts a generated workbook and checks the CSV download.

## Known Gaps

- No Web Worker, so very large sheets block the page while parsing.
- Preview shows the first 200 rows.
