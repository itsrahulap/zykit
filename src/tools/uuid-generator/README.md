# UUID Generator

## Purpose

Generates batches of RFC 9562 version 4 (random) and version 7 (time-ordered) UUIDs, formats them, and inspects any pasted UUID. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (no `accepts` / `produces`, not shareable) |
| `UuidGeneratorPage.tsx` | Version switch, count, format checkboxes, output with **Copy all** / **Send to…** / **Download .txt**, inspector panel |
| `features/uuid.ts` | `uuidV4`, `createV7Generator`, `generate`, `clampCount`, `formatUuid`, `inspectUuid`, `MIN_COUNT` / `MAX_COUNT` |

Shared code: `bytesToHex` from `src/shared/lib/bytes.ts`; `SendToMenu`, `downloadText`.

## Core Logic

`uuidV4` uses `crypto.randomUUID` unless a fill function is injected (tests). `createV7Generator` keeps `lastMs` / `counter` in a closure; one module-level `sharedV7` instance is used by the page so ordering holds across batches. The counter is seeded with 11 random bits (top bit clear) and on overflow past `0xfff` advances `lastMs` by 1. Formatting is applied on render to the stored canonical list, so toggling options doesn't regenerate. `inspectUuid` strips `urn:uuid:` and braces, checks hyphen positions, and uses `BigInt` for the v1/v6 Gregorian timestamp.

## Limits

- `MAX_COUNT` 1,000; changing the count alone doesn't regenerate (needs **Generate** or Enter).
- Generation of v4 and v7 only.

## Tests

- Unit: `tests/tools/uuid-generator/uuid.test.ts` (v4 shape and version/variant bits, v7 timestamp, strict ordering within a millisecond and across counter overflow, backwards clock, count clamping, formatting, inspection of v1/v6/v7 incl. the RFC v7 example, urn / no-hyphen input, nil / max, invalid input). `npm test -- uuid-generator`
- E2E: `e2e/uuid-generator.spec.ts` (v7 batch sorted, format toggles, **Copy all**, download filename, inspector date and error, no off-origin or non-GET requests, 320 px layout). `npm run test:e2e -- uuid-generator`

## Known Gaps

- No v1/v3/v5/v6/v8 generation (no name-based UUIDs).
- The inspector shows a version number even for non-RFC variants, where that nibble has no defined meaning.
- The page footer about Web Crypto and v7 ordering overlaps with `docs.ts`.
