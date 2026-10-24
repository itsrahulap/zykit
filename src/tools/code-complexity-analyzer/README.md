# Code Complexity Analyzer

## Purpose

Measures every JavaScript/TypeScript function's cyclomatic complexity, nesting depth and length, flags those over configurable thresholds, lists the top 10 and marks the decision points in the selected function's source. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `CodeComplexityAnalyzerPage.tsx` | Code input (drop / open file sets the language), Language `Select`, threshold inputs, syntax errors, Top 10 and All functions tables |
| `components/MarkedSource.tsx` | Selected function's lines with decision points in `<mark>` (text only) |
| `features/code-complexity-analyzer.ts` | `analyze(ts, code, language)`, `exceeds`, `topFunctions`, `markedSource`, `languageFromFileName`, limits |
| `hooks/useComplexity.ts` | Debounced (250 ms) worker requests, load/analysis time limits, terminate on timeout, supersede or unmount |
| `workers/complexity.worker.ts`, `complexity.protocol.ts` | Lazily `import('typescript')` and run `analyze` off the main thread |

## Core Logic

`analyze` takes the compiler module as a parameter so the feature file only imports types; the worker passes the lazily imported `typescript` package and tests import it directly. `ts.createSourceFile(…, ScriptTarget.Latest, true, ScriptKind)` builds the AST; a walk starts a new measurement at every function-like node with a body (declaration, expression, arrow, method, get/set accessor, constructor) and doesn't descend into nested ones from the parent. Decision points (each +1): `IfStatement`, `ConditionalExpression`, `CaseClause`, `For`/`ForIn`/`ForOf`/`While`/`Do`, `CatchClause`, and `BinaryExpression` with `&&`, `||`, `??`, `&&=`, `||=`, `??=`. Each records the keyword/operator range for highlighting. Nesting follows ESLint `max-depth` (`if` except an `else if`, loops, `switch`, `try`). Names come from the declaration, or the binding (`const f =`, object/class property, `a.b =`), prefixed with the class name. Syntax errors come from the source file's internal `parseDiagnostics`.

The worker replies `started` once the compiler is loaded; the hook allows `LOAD_TIMEOUT_MS` (30 s) before that and `ANALYZE_TIMEOUT_MS` (5 s) after. A superseded run is only terminated while parsing, so typing during the first load doesn't restart the download.

## Limits

- `MAX_INPUT` = 500,000 characters (checked on the page; nothing is sent when over).
- `MAX_SYNTAX_ERRORS` = 50 listed, the rest counted.
- Top-level code, static blocks and non-function field initializers aren't attributed to any function.

## Tests

- Unit: `tests/tools/code-complexity-analyzer/code-complexity-analyzer.test.ts` (if/else if, all loops, `switch` without `default`, `&&`/`||`/`??`/logical assignment vs `?.`, ternaries and `catch`, keywords in comments/strings/regexes, decision ranges and marked source, nested/arrow/anonymous functions, class members and naming, overloads, line counts, nesting, JSX/TSX, syntax errors with line:column, garbage input, thresholds and ranking). `npx vitest run tests/tools/code-complexity-analyzer`
- E2E: `e2e/code-complexity-analyzer.spec.ts` (example flow through the worker, marked source, threshold change, syntax error, same-origin GETs only, no console errors, 320 px layout).

## Known Gaps

- The `typescript` chunk is large (about 3.5 MB minified, about 0.96 MB gzip in a production build), loaded only by the worker on first analysis; a smaller parser would load faster but would be a new dependency.
- No cognitive complexity, Halstead metrics or per-file totals; top-level code isn't measured.
- `parseDiagnostics` is an internal compiler field; a TypeScript upgrade could rename it (the unit test would catch it).
