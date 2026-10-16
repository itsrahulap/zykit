# .gitignore Generator

## Purpose

Builds a `.gitignore` from ~75 bundled templates (languages, frameworks, editors, operating systems, tools) plus custom lines, and tests paths against the result or your own rules with git's matching semantics. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (accepts/produces `text`, shareable) |
| `GitignoreGeneratorPage.tsx` | Page: template picker, output, path tester |
| `features/templates.ts` | Template data |
| `features/gitignore-generator.ts` | Search, merge/dedupe, rule parser and matcher |

## Core Logic

`merge` joins sections under `# === Name ===` headers and drops repeated pattern lines. `parseRules` turns each line into a rule (negated, dirOnly, anchored, regex built by `globToRegex`). `testPath` checks each parent directory first (an excluded parent wins), then the path itself; the last matching rule decides. `STARTERS` lists one-click template combinations. The page keeps hand edits as `{ text, base }`: `text` replaces the generated output everywhere (copy, download, tester), and `base` is the generated text the edits started from, so a template change shows a notice instead of overwriting them. `OutputPanel` takes the editor as `children`.

## Limits

Single root rule list only: no nested `.gitignore`, `.git/info/exclude` or global excludes; 2,000 paths, 20,000 rule lines.

## Tests

- Unit: `tests/tools/gitignore-generator/gitignore-generator.test.ts`. `npm test -- gitignore-generator`
- E2E: `e2e/gitignore-generator.spec.ts`. `npm run test:e2e -- gitignore-generator`

## Known Gaps

No directory detection from disk, no case-folding for non-ASCII, templates are hand-curated rather than synced from an upstream list. Hand edits are not merged with later template changes (keep or reset) and are not included in share links.
