# JSON-LD Generator

## Purpose

Form-driven builders for 14 schema.org type families with Google rich-result required / recommended markers and validation, a copy-ready `<script type="application/ld+json">` snippet, and a "Validate existing" mode for pasted JSON-LD. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable`, `produces: json`) |
| `JsonLdGeneratorPage.tsx` | Build / Validate existing modes, form, output, share state |
| `components/FormFields.tsx` | `FieldInput` (level badge, inline format error) and `ListEditor` (repeating items) |
| `components/ReportView.tsx` | Missing required / recommended / invalid lists |
| `features/schemas.ts` | `TYPES`: field, list, nested-`@type`, `anyOf` and example definitions per type; `typeForName` |
| `features/validate.ts` | URL, ISO date / date-time / duration, price, currency, time, day validators; `splitValues` |
| `features/jsonld.ts` | `buildJsonLd`, `check` (shared by both modes through an `Access` abstraction), `toScript`, `validateExisting`, `extractJsonBlocks` |
| `features/state.ts` | `restoreForm`: strictly shaped, size-limited share-link state |

## Core Logic

Field keys are dotted paths; `nested` maps a path prefix to the `@type` given to the object created there. `check` takes an `Access` (form values or a parsed JSON node) so the same required / recommended / format rules serve both modes. `when` makes a field required only once its group is used; `anyOf` encodes "at least one of offers, rating, review" style rules. The snippet escapes every `<` as `\u003c`.

## Limits

- Only the listed types; others are reported as "not checked". Rules follow Google's docs, not all of schema.org.
- No URL fetching, no image-size checks. 50 list items, 5,000 characters per field in share links.

## Tests

- Unit: `tests/tools/json-ld-generator/json-ld-generator.test.ts` (validators, every type's example and empty form, per-type structures and requirements, script escaping, Validate existing). `npm test -- json-ld-generator`
- E2E: `e2e/json-ld-generator.spec.ts`. `npm run test:e2e -- json-ld-generator`

## Known Gaps

- No `@graph` output (one block per type), no `@id` linking between entities.
- Google's deprecations (FAQ, HowTo, sitelinks search box) are noted in the UI but time-sensitive.
