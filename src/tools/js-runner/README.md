# JS Runner

## Purpose

Runs JavaScript or TypeScript in a fresh, disposable Web Worker per run, with a captured console, a time limit and Stop. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['code']`) |
| `JsRunnerPage.tsx` | Editor, language / example / time-limit controls, console panel, compiled-JS preview, localStorage draft (`zykit-js-runner`), "How your code runs" panel |
| `hooks/useJsRunner.ts` | Run lifecycle: compile, module-syntax check, blob-URL classic worker, time limit, message handling, batched console flushes, teardown |
| `features/source.ts` | `buildWorkerSource` (runtime + user code in an async arrow), `mapLocations` / `formatScriptError` (worker → user line numbers), `findModuleSyntax` |
| `features/runtime.ts` | `workerRuntime`, serialised into the worker: console replacement with output caps, error/rejection listeners, timer and `fetch` tracking for `done` / `idle` |
| `features/formatter.ts` | `createFormatter` (small `util.inspect`, serialised into the worker): depth/item limits, circular refs, printf directives |
| `features/compile.ts` | Lazy `sucrase` import, `transform` with `['typescript']` and `disableESTransforms` |
| `features/protocol.ts` | Worker message types, `DEFAULT_RUNTIME_OPTIONS` |
| `features/transcript.ts`, `examples.ts` | Console entry model / text transcript; built-in examples |
| `components/ConsoleOutput.tsx` | Renders entries by level, group indentation, optional timestamps |

## Core Logic

`workerRuntime` and `createFormatter` are stringified with `Function.prototype.toString()` and prepended to the user's code, so both must stay self-contained (no imports, no outer identifiers). The worker is classic (not module) so parse errors surface as `ErrorEvent` with `lineno`; the prefix line count is used to map locations back. The runtime posts `done` when the async body settles and `idle` after `idleGraceMs` with no pending timeouts, intervals or fetches; the hook terminates the worker on `idle`, Stop, timeout or truncation. Isolation from the network and `eval` comes from the site CSP (`connect-src 'self'`, `script-src 'self'`, `worker-src 'self' blob:`), which the blob worker inherits.

## Limits

- `DEFAULT_RUNTIME_OPTIONS`: `maxEntries` 2,000, `maxChars` 1,000,000, `idleGraceMs` 30.
- Time limits `LIMITS` = 5 / 10 / 30 / 60 s (default 10). Formatter defaults: depth 4, 100 items, 5,000 nodes; `console.table` 1,000 rows.
- Not `shareable`. Same-origin `fetch` is still allowed by the CSP.

## Tests

- Unit: `tests/tools/js-runner/` — `runtime.test.ts` (serialised runtime against `fakeWorker.ts`: levels, top-level await, timer/interval tracking, uncaught errors and rejections, console methods, `console.table`, output caps, timestamps), `formatter.test.ts` (inspect and printf formatting, hostile objects), `source.test.ts` (worker source, location mapping, script errors, module-syntax detection), `compile.test.ts` (Sucrase output and syntax errors). `npm test -- js-runner`
- E2E: `e2e/js-runner.spec.ts` (console output, Ctrl+Enter and timers, TypeScript, error lines, infinite loop + Stop, time limit, blocked cross-origin requests, `import` message and persistence, keyboard dropdowns). `npm run test:e2e -- js-runner`

## Known Gaps

- No type-checking for TypeScript (Sucrase only strips types).
- No module support or package imports; no DOM shim.
- The page's "How your code runs" panel overlaps with `docs.ts`.
