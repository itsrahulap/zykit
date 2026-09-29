# Contributing to Zykit

Thanks for helping. Zykit is a set of private, in-browser developer tools, a Learn section and a blog, all shipped as one static site. Contributions of every size are welcome: bug reports, fixes, new tools, lessons, blog posts, docs and accessibility improvements.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug**: open an issue with the *Bug report* template. Include the tool, browser, steps and what you expected.
- **Suggest a tool or feature**: open an issue with the *Tool or feature request* template before writing a lot of code, so we can agree on scope.
- **Fix something**: issues labelled `good first issue` are small and self-contained.
- **Improve content**: fix a lesson in `src/learn/content/` or a post in `src/blog/posts/`.
- **Security problems**: don’t open a public issue. Follow [SECURITY.md](SECURITY.md).

## Development setup

Requires Node 20.19 or newer; `.nvmrc` pins the version CI uses.

```bash
git clone https://github.com/itsrahulap/toolstack.git
cd toolstack
nvm use                      # or install the Node version in .nvmrc
npm ci
npx playwright install chromium   # once, for the browser tests
npm run dev                  # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm test` | Unit tests (Vitest, `tests/**`) |
| `npm run test:e2e` | Browser tests (Playwright, `e2e/**`) against the production build on port 4173 |
| `npm run lint` | oxlint |
| `npm run typecheck` | TypeScript project build |
| `npm run build` | Static site in `dist/`, including the per-page SEO HTML and `sitemap.xml` |

## Where things live

| You want to… | Start here |
|---|---|
| Add or change a tool | [docs/adding-a-tool.md](docs/adding-a-tool.md), `src/tools/<tool-id>/`, `src/tools/registry.ts` |
| Add a blog post | `src/blog/posts/`, then register it in `src/blog/registry.ts` |
| Edit Learn lessons, problems or case studies | `src/learn/content/` |
| Change shared UI | `src/shared/ui/` (reuse these before adding new components) |
| Change page titles, descriptions or the sitemap | `src/config/seo.ts`, `src/learn/seo.ts`, `src/blog/seo.ts`, `scripts/seo-plugin.ts` |

## Rules every change follows

These come from what the site promises its users, so reviews check them:

- **Nothing leaves the browser.** No uploads, analytics, trackers or third-party requests. The Content Security Policy (`connect-src 'self'`) blocks them, and e2e tests assert that processing a file makes only same-origin `GET` requests. Don’t loosen the CSP in `vercel.json`, `public/_headers` or `vite.config.ts` without discussing it in an issue first.
- **Treat input as hostile.** Bounds-check every read, cap decompression and sizes, and render untrusted text as text, never as HTML.
- **Heavy work runs in a Web Worker**, with a way to cancel it.
- **Accessible and responsive.** Keyboard reachable, labelled controls, visible focus, and no horizontal scroll at 320 px wide.
- **Match the surrounding code.** Same naming, comment density and structure. Keep tool-specific code in the tool’s folder; move it to `src/shared/` only when a second tool needs it.

## Tests

- New logic gets unit tests in `tests/`, mirroring the `src/` path.
- New pages or tools get a Playwright spec in `e2e/`, including a phone-width check.
- Bug fixes include a test that fails without the fix.

Before opening a pull request, run:

```bash
npm run lint && npm run typecheck && npm test && npm run test:e2e
```

CI runs the same checks (plus CodeQL) on every pull request.

## Pull requests

1. Fork the repo and create a branch from `main` (`fix/jwt-expiry-timezone`, `feat/yaml-formatter`).
2. Keep the change focused; unrelated clean-ups go in a separate PR.
3. Write commit messages in the style of the history: `feat: …`, `fix: …`, `refactor: …`, `docs: …`, `test: …`.
4. Fill in the pull request template, link the issue, and add screenshots for UI changes (light and dark, desktop and phone).
5. A maintainer will review. Please respond to comments by pushing new commits rather than force-pushing, so the review history stays readable.

## Using AI coding assistants

AI-assisted contributions are fine. You are responsible for the change: read it, run the checks, and make sure it follows the rules above. This repo is set up for Claude Code; see [docs/claude-code-plugins.md](docs/claude-code-plugins.md) for the plugins it suggests.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
