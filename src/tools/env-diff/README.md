# .env Diff

## Purpose

Parses two `.env` files with dotenv rules, reports syntax problems and duplicates, compares their keys with values masked, flags likely secrets and generates a value-free `.env.example`. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`, deliberately: inputs are secrets) |
| `EnvDiffPage.tsx` | Page: two inputs (paste, open, drop), issue lists, filterable diff table with per-row reveal, `.env.example` output, sample files |
| `features/env-diff.ts` | Pure logic, no DOM: `parseEnv`, `diffEnv` / `diffCounts`, `secretHint` / `entropy`, `maskValue`, `toExample` |

## Core Logic

`parseEnv` walks lines (BOM stripped, CRLF accepted), strips `export `, splits on `=` or `: `, validates the key against `^[A-Za-z_][A-Za-z0-9_.-]*$`, then reads a quoted value (joining following lines until the closing quote; `closingQuote` skips backslash escapes except in single quotes) or an unquoted one (cut at `#`). Every assignment is kept in `entries`; `values` keeps the last per key and `duplicates` collects repeats. `diffEnv` compares final values from A against B. `secretHint` checks key name, known token prefixes, URL credentials, then Shannon entropy (≥ 4 bits/char, ≥ 20 chars, letters and digits). Inputs go through `useDeferredValue` before parsing.

## Limits

- No variable expansion; `refs` are only listed.
- Invalid lines are dropped from `entries`, so they are missing from the diff and from `toExample`.
- `maskValue` emits 4–12 bullets, a coarse length hint.
- Files via `OpenFileButton` / drop: `MAX_TEXT_FILE_BYTES` (10 MB), binary refused.

## Tests

- Unit: `tests/tools/env-diff/env-diff.test.ts` (assignments, comments, `export`, quotes and escapes, inline comments, multiline values, `${VAR}` refs, syntax errors and duplicates, CRLF/BOM, diff classification, secret names/values, entropy, masking, `toExample`). `npm test -- env-diff`
- E2E: `e2e/env-diff.spec.ts` (counts, values masked until **Reveal** / **Hide all**, last duplicate wins, **Missing** filter, duplicate and syntax problems, `.env.example` output, no `#s=` share fragment, no off-origin requests, phone layout). `npm run test:e2e -- env-diff`

## Known Gaps

- The revealed-rows set survives edits to the inputs (it's keyed by name and cleared only by **Try an example**, **Clear** or **Hide all**), so a newly pasted value for a revealed key shows unmasked.
- Backtick-quoted values keep their backslash escapes verbatim; only double quotes are unescaped.
