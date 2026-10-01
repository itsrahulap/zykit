# Semver Checker

## Purpose

Parses SemVer 2.0.0 versions, checks them against npm (node-semver) style ranges with reasons, explains ranges as bounds, sorts by precedence and previews `npm version` bumps. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['text']` for Send to… into **Versions**, `shareable: true`) |
| `SemverCheckerPage.tsx` | Page: range + include-prereleases, bounds list, versions input, check results, summary, sorted list, bump preview, share state (range, versions, prerelease flag), copy shortcut (results or sorted list) |
| `features/semver-checker.ts` | Pure logic, no DOM: `parseVersion` / `formatVersion`, `compare` / `compareMain`, `parseRange` (caret, tilde, x-range, primitive, hyphen desugaring), `explainRange`, `check` / `satisfies`, `sortVersions`, `max/minSatisfying`, `bump` |

## Core Logic

`parseRange` splits on `||`; each part is either a whole hyphen range (`HYPHEN` regex) or whitespace-separated tokens (operators glued to their version first). Each token's partial version (`parsePartial`, `x`/`X`/`*`/missing = null) is desugared into `>=`/`<` comparators with `-0` upper bounds, as node-semver does; `includePrerelease` switches lower bounds of partials to `-0` too. `testSet` requires every comparator to pass, then applies node-semver's prerelease gate (a comparator with a prerelease on the same `[major, minor, patch]`). `bump` mirrors node-semver `inc()`, including `incPre`'s preid handling.

## Limits

- Strict parsing only (`FULL` regex); no `loose` mode or `coerce`. Numbers must be safe integers.
- One hyphen range per `||` alternative, not mixed with other comparators.
- The page splits **Versions** on whitespace and commas.

## Tests

- Unit: `tests/tools/semver-checker/semver-checker.test.ts` (parsing prerelease/build and invalid versions, SemVer §11 precedence chain, build metadata ignored, node-semver README range desugaring, `-0` bounds with includePrerelease, invalid comparators, README `satisfies` examples, reasons, max/min satisfying, `inc` bumps and invalid input). `npm test -- semver-checker`
- E2E: `e2e/semver-checker.spec.ts` (bounds for `^1.2`, match counts and reasons, prerelease gate and toggle, sorted order, bump with preid, invalid range, example button, no off-origin requests, phone layout). `npm run test:e2e -- semver-checker`

## Known Gaps

- When **Version** in Bump preview is empty, the base is `sorted[0]`, which follows the **Order** toggle: the newest version normally, the oldest with **Oldest first**.
- Prerelease identifiers in range comparators aren't checked against the safe-integer limit (versions are).
