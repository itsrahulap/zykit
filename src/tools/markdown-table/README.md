# Markdown Table Generator

## Purpose

Builds GFM tables from CSV/TSV, JSON, a grid editor, or reformats an existing table. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `MarkdownTablePage.tsx` | Page: options, input, output, share state |
| `features/markdown-table.ts` | Pure logic |

## Core Logic

`features/markdown-table.ts`: `cellWidth` (wide-character aware), `escapeCell`, `formatTable(rows, aligns, {padded, escaped})`, `rowsFromJson`, `parseMarkdownTable`. CSV uses `src/shared/lib/csv.ts`. Per-column alignment overrides the alignment detected from an existing table.

## Limits

Input 5 MB, 20,000 CSV rows; first row is always the header; padding is exact only in monospace fonts.

## Tests

- Unit: `tests/tools/markdown-table/markdown-table.test.ts`. `npm test -- markdown-table`
- E2E: `e2e/markdown-table.spec.ts`. `npm run test:e2e -- markdown-table`

## Known Gaps

No spreadsheet-style paste into the grid, no multi-table formatting, emoji sequences may measure wrong.
