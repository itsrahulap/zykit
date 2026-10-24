# TypeScript Type Explorer

## Purpose

Guided, editable examples of TypeScript's type operators (keyof, typeof, indexed access, unions and intersections, narrowing, generics, conditional, mapped and template literal types, built-in utility types), checked by the real TypeScript compiler in a Web Worker. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`: the example id and code go in the share link) |
| `TypescriptTypeExplorerPage.tsx` | Example `Select`, explanation, `CodeArea`, diagnostics and resolved-types cards, status strip, share state |
| `features/typescript-type-explorer.ts` | `createTypeAnalyzer(ts, libFiles)`: in-memory `CompilerHost` + `Program`; `collectDiagnostics`, `collectDeclarations`; `LIB_FILE_NAMES`, `MAX_CODE_CHARS`, `TIMEOUT_MS` |
| `features/examples.ts` | The guided examples (`id`, `title`, `explanation`, `lookAt`, `code`) |
| `hooks/useTypeCheck.ts` | Debounced (250 ms) worker requests, "loading" until the worker first answers, terminates the worker after `TIMEOUT_MS` or when superseded |
| `workers/type-explorer.worker.ts`, `type-explorer.protocol.ts` | Lazy `import('typescript')`, lib files via `?raw`, runs the analyzer |

## Core Logic

The analyzer takes the `typescript` module and a map of lib file texts, so the same code runs in the worker and in Vitest. Each call creates a `Program` over one file (`/example.ts`) with `lib: ['lib.es2015.d.ts']`, `strict`, `noEmit` and `skipLibCheck`; the host serves only that file and the 13 lib files of the es2015 `/// <reference lib>` chain, whose `SourceFile`s are parsed once and reused. Diagnostics (options, syntactic, semantic) are mapped to 1-based line:column. For each top-level `type` alias the checker prints `typeToString(type, node, NoTruncation | InTypeAlias)`, which expands the alias one level (`Pick<{a:1;b:2},'a'>` → `{ a: 1; }`); a `keyof X` union is printed member by member because the checker would otherwise print it as `keyof X`. Variables (identifier names) and function declarations get their `typeToString`. Nothing is emitted or executed.

## Limits

- `MAX_CODE_CHARS` = 20,000 (checked on the page and in the analyzer); `TIMEOUT_MS` = 20,000 (includes the first compiler download).
- es2015 lib only, no DOM or `@types`; single file, imports don't resolve.
- Fixed compiler options; no tsconfig UI.

## Tests

- Unit: `tests/tools/typescript-type-explorer/typescript-type-explorer.test.ts` (the lib list covers the whole reference chain, every example compiles with zero diagnostics and lists its `lookAt` names, resolved types for each topic, error line:column, unresolved imports, the size cap). Libs are read from `node_modules/typescript/lib`. `npx vitest run tests/tools/typescript-type-explorer`
- E2E: `e2e/typescript-type-explorer.spec.ts` (compiler loads, a resolved type, an introduced error with its line:column, switching examples, same-origin GETs only, no console errors, 320 px layout). `npx playwright test e2e/typescript-type-explorer.spec.ts`

## Third-party code

| Package | Use | Loaded |
|---|---|---|
| `typescript` (Apache-2.0, no `eval`/`new Function`) | Parser and type checker | Only inside the worker, via `import()` |

## Known Gaps

- Chunk size: the compiler chunk is ~3.5 MB (~0.95 MB gzip) and the worker chunk with the inlined lib files ~315 kB (~34 kB gzip). Vite warns about the compiler chunk's size; it only downloads when this tool runs. Each worker that imports `typescript` gets its own copy of the chunk.
- No hover/"type at cursor"; only top-level declarations are listed. Interfaces and classes are not listed on their own.
- Results are not linked back to the code (clicking a diagnostic doesn't move the caret).
