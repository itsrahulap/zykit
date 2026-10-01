# chmod Calculator

## Purpose

Converts Unix permissions between checkboxes, octal and symbolic / `ls -l` forms, applies chmod(1) symbolic expressions and computes umask defaults. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `ChmodCalculatorPage.tsx` | Page: bit grid and special bits, octal / symbolic fields kept in sync, command rows, presets, expression panel, umask panel, share state, copy shortcut (octal) |
| `features/chmod-calculator.ts` | Pure logic, no DOM: `parseOctal` / `toOctal`, `parseSymbolic` / `toSymbolic` / `lsString`, `applyChmod`, `toChmodSymbolic`, `applyUmask`, `PRESETS`, `warnings`, `describeMode` |

## Core Logic

The page holds one numeric `mode` (12 bits); `setMode(m, from)` refreshes whichever text field didn't cause the change, so a half-typed field isn't overwritten. `applyChmod` matches each clause against `^([ugoa]*)((?:[+=-][rwxXstugo]*)+)$`, computes the rwx bits for the target classes (copying from `u`/`g`/`o` when asked), masks who-less clauses with `umask` and applies `+`, `-` or `=`. `=` clears the class bits plus setuid (for `u`) and setgid (for `g`, files only, matching GNU). An all-digit expression is parsed as octal and replaces the mode.

## Limits

- Octal 1–4 digits (`0o` prefix allowed); symbolic 9 chars, `ls -l` 10 chars (+ optional `.`/`+`/`@`).
- The page calls `applyChmod` without `umask`, so who-less clauses act on all classes unmasked; the umask field only feeds `applyUmask`.

## Tests

- Unit: `tests/tools/chmod-calculator/chmod-calculator.test.ts` (octal ↔ symbolic, `ls -l` parsing, `applyChmod` add/remove/set, `X`/`s`/`t`, umask masking, invalid expressions, symbolic chmod arguments, umask defaults, warnings and descriptions). `npm test -- chmod-calculator`
- E2E: `e2e/chmod-calculator.spec.ts` (octal, checkboxes, special bits and symbolic stay in sync, presets, expression + Use this mode, umask, 777 warning, no off-origin requests, phone layout). `npm run test:e2e -- chmod-calculator`

## Known Gaps

- The umask field isn't applied to who-less expression clauses.
- No modelling of GNU's octal-mode handling of directory setuid/setgid, owners, ACLs or recursive (`-R`) behaviour.
