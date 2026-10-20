# AGENTS.md

Guidance for any LLM agent (Claude Code, Codex, Cursor, …) working in this repository.

## Precedence

- **[CONTRIBUTING.md](CONTRIBUTING.md) is the source of truth.** Its "Rules every change follows", test expectations and PR conventions apply to agents exactly as they do to people. This file only adds agent-specific guidance; it never overrides CONTRIBUTING.md.
- **Topic docs come next.** For a new tool, follow [docs/adding-a-tool.md](docs/adding-a-tool.md) (or `npm run new:tool`). Accessibility work follows [docs/accessibility-audit.md](docs/accessibility-audit.md).
- **Ask before big bets.** A new dependency, a new architectural pattern, a cross-cutting refactor, any CSP change, or an unclear product decision: ask the maintainer instead of guessing.
- **One instructions file.** Don't add a `CLAUDE.md` next to this one; extend this file.

## What this repo is

Zykit: a static React + Vite site of private, in-browser developer tools, a Learn section and a blog. There is **no backend**. Every byte of user input is processed client-side, and the Content Security Policy enforces that.

| Area | Path |
|---|---|
| Tools (one folder each) + registry | `src/tools/<tool-id>/`, `src/tools/registry.ts` |
| Shared UI, hooks, utils | `src/shared/ui/`, `src/shared/hooks/`, `src/shared/lib/`, `src/shared/utils/` |
| Learn content and pages | `src/learn/` |
| Blog | `src/blog/` |
| Unit tests (mirror `src/`) | `tests/` |
| Browser tests | `e2e/` |
| Build scripts (SEO, catalog, README) | `scripts/` |

## Change discipline

- **Minimal diff.** Solve the stated problem with the smallest correct change. Don't refactor, rename or reformat unrelated code.
- **Reuse before adding.** Check `src/shared/` for an existing component, hook or helper before writing a new one. Promote code to `src/shared/` only when a second tool needs it.
- **Match the surrounding code**: naming, types, imports, Tailwind classes and comment density.
- **No new runtime dependency** for something a few lines or an existing dependency can do. Never add one that makes network requests.
- **Generated files**: `README.md`'s tool list comes from `npm run generate:readme`, and the Learn catalog from `npm run generate:learn`. Regenerate them; don't hand-edit them.
- **Verify before claiming done.** Run the checks below that cover your change and report real output. Never say "tests pass" without having run them.
- **Git only when asked.** Don't commit, push or open PRs unless the user requests it. Commit subjects follow the history: `feat: …`, `fix: …`, `refactor: …`, `docs: …`, `test: …`.

## Checks

```bash
npm run lint        # oxlint
npm run typecheck   # tsc -b
npm test            # Vitest, tests/**
npm run test:e2e    # Playwright, e2e/** (needs `npx playwright install chromium` once)
```

Scope runs to what you touched (e.g. `npx vitest run tests/tools/<tool-id>` or `npx playwright test e2e/<spec>`), then run the full suite before a PR.

## Code style

- **Self-explanatory code first.** Names fully describe their purpose; don't abbreviate to save keystrokes (loop indices are fine).
- **Comments explain why, not what**: a non-obvious constraint, browser quirk, spec rule or trade-off. Keep them short and information-dense.
- **Prefer simplicity.** A plain function or data structure beats a pattern. Reach for a named pattern (Strategy, Adapter, Facade, Observer, …) only when the problem clearly has that shape. If several fit, ask.

## Testing

- Test through public interfaces (a tool's pure `lib` functions and its rendered UI), not implementation details.
- New logic → unit test in `tests/`, mirroring the `src/` path. New page or tool → Playwright spec in `e2e/` with a phone-width check.
- Bug fix → a test that fails without the fix.
- One focused test with a meaningful assertion beats several that assert nothing.

## Security and privacy

These are the site's core promise. See [SECURITY.md](SECURITY.md) for scope.

- **Nothing leaves the browser.** No `fetch` or `XMLHttpRequest` to third parties, no analytics, no remote fonts or scripts. Don't touch the CSP in `vercel.json`, `public/_headers` or `vite.config.ts` without an issue first.
- **All input is hostile**, whether files, pasted text, URLs or share-link state. Bounds-check binary reads, cap sizes and decompression, and render untrusted text as text. Any HTML goes through DOMPurify.
- **Never commit secrets**, tokens or personal data, including in test fixtures.
- **Dependency hygiene.** Prefer small, well-maintained packages. Mention any known CVE history when proposing one.

## Error handling

- **Fail fast at the edge.** Validate input where it enters a tool (file drop, textarea, URL param) before it reaches parsing logic.
- **Never fail silently.** No empty `catch` blocks. Either surface the error to the user or rethrow it.
- **Typed errors.** Throw `AppError` with an `AppErrorCode` ([src/shared/lib/errors.ts](src/shared/lib/errors.ts)), or the tool's own error class, instead of bare strings. Catch the narrowest error you can handle.
- **User-facing messages are actionable and free of internals** ("Not a valid PNG: header is truncated", not a stack trace or metadata values).
- **Clean up.** Terminate workers, revoke object URLs and abort pending work when the user cancels or the component unmounts.

## Performance

- **Measure before optimizing.** Profile the real hot path.
- **Heavy work runs in a Web Worker** and can be cancelled. Keep the main thread responsive for large files.
- **Lazy-load tools and big libraries** (pdf.js, sql.js, …) so the home page stays small.
