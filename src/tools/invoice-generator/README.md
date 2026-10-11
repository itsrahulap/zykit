# Invoice Generator

## Purpose

Form-based invoice maker: seller/client, line items with tax and discount, live exact totals, PDF via pdf-lib, local draft, JSON export/import and a print preview. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`) |
| `InvoiceGeneratorPage.tsx` | Page: form, live totals, PDF/print/JSON actions, localStorage draft (`zykit-invoice`), preview |
| `features/invoice-generator.ts` | Pure logic: decimal parsing, `computeTotals`, money formatting, WinAnsi check (`unsupportedChars`, `pdfSafe`), `parseDraft` |
| `features/invoice-pdf.ts` | `buildInvoicePdf`: A4 layout with Helvetica via a lazy `pdf-lib` import |

## Core Logic

`parseScaled` converts typed decimals to scaled integers (rejecting extra precision). `lineTotals` multiplies with `BigInt` and rounds half up: gross, discount, net, tax. `computeTotals` sums valid lines and groups tax by rate in basis points. The PDF draws text with `pdfSafe` (unsupported characters become `?`, after the page has warned) and prints money with the currency code so no symbol needs encoding. `parseDraft` rebuilds a draft from untrusted JSON (storage or import) with length caps and a logo data-URL check.

## Limits

- Standard fonts only (Windows-1252). 200 lines, 1 MB logo, A4 only, 20 currencies, per-line discount percent, per-line tax rounding. No worker: PDF generation runs on the main thread.

## Tests

- Unit: `tests/tools/invoice-generator/invoice-generator.test.ts` (parsing, rounding, tax grouping, currencies with 0 and 3 digits, character support, draft parsing, PDF smoke test). `npm test -- invoice-generator`
- E2E: `e2e/invoice-generator.spec.ts`. `npm run test:e2e -- invoice-generator`

## Known Gaps

- No embedded fonts for non-Latin text, no fixed-amount discounts, shipping lines, tax-inclusive prices, recurring invoices or multiple pages of terms layout polish. Print prints the surrounding page chrome too.
