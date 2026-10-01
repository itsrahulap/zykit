# String Escaper

## Purpose

Escapes and unescapes text for 23 quoting contexts: JSON, JavaScript (three quote styles), Python, Java, C/C++, C#, Go, SQL (standard and MySQL), regex, POSIX shell and PowerShell (single and double), CSV, XML/HTML text and attribute, URL component and three Unicode escape styles. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['text', 'code']`, `produces: ['text']`, `shareable: true`) |
| `StringEscaperPage.tsx` | Page: direction, format select, non-ASCII option, input, error panel with position, output, round-trip check, share state, Send to… intake |
| `features/string-escaper.ts` | Pure logic, no DOM: one escaper + unescaper per format in `IMPLS` (`FORMATS`, `FORMAT_IDS` for the page and share sanitising), `escapeText` / `unescapeText` returning `EscapeResult` |

## Core Logic

Escapers walk code points (`mapChars`) and return a replacement or keep the character. Backslash formats unescape through `unescapeBackslash` with a per-language `EscapeHandler`; byte escapes (`\x`, octal) go into `Out`, which flushes them through a fatal UTF-8 `TextDecoder`, and `readU4` joins surrogate pairs. Shell, PowerShell, CSV, XML and URL have dedicated parsers. Errors are `EscapeError` with a character offset, which the page turns into line/column via `textError`. `escapeText` runs `checkWellFormed` (lone surrogates) for all formats except XML, SQL, CSV, shell and PowerShell. The page computes a round trip on every change to show the check message.

## Limits

- Output for literal formats is the body only; shell/PowerShell/CSV include their quotes.
- No raw / verbatim string formats; XML named entities limited to the `ENTITIES` table.
- Files via drop: `MAX_TEXT_FILE_BYTES` (10 MB).

## Tests

- Unit: `tests/tools/string-escaper/string-escaper.test.ts` (round trip for every format, output checked against `JSON.parse`, `RegExp` with and without `u`, and `decodeURIComponent`; specific outputs for JS, Python, Java, C, C#, Go, SQL, shell, PowerShell, CSV, XML and Unicode; positioned errors for bad escapes; lone surrogates refused). `npm test -- string-escaper`
- E2E: `e2e/string-escaper.spec.ts` (JSON escape with round-trip note, POSIX single-quoted shell, **Use output as input**, unknown-escape error with line/column, example button, no off-origin requests, phone layout). `npm run test:e2e -- string-escaper`

## Known Gaps

- Python's unknown escapes (e.g. `\q`) are kept literally, matching Python, but without a warning.
- The `unicode-*` unescaper is lenient (non-strict): unknown sequences and a trailing backslash pass through unchanged.
