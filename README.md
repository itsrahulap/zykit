# Zykit

A growing collection of file and developer tools that run **entirely in the browser**. Files are never uploaded. The home page (`/`) lists every tool, and each tool lives at `/tools/<tool-id>`.

| Tool | URL | What it does |
|---|---|---|
| **Clean Image** | `/tools/clean-image` | Inspect and remove EXIF, GPS, XMP, IPTC, PNG text, C2PA and AI-generation metadata from JPEG, PNG and WebP without re-encoding. |
| **JWT Decoder** | `/tools/jwt-decoder` | Decode a JWT's header, payload and claims, and verify HMAC, RSA or ECDSA signatures. |
| **Diff Checker** | `/tools/diff-checker` | Compare two texts line by line with word-level highlights, side by side or unified. |
| **JS Runner** | `/tools/js-runner` | Run JavaScript or TypeScript in an isolated worker with console output and a time limit. |
| **JSON Formatter** | `/tools/json-formatter` | Format, minify, sort and validate JSON with exact error positions. |
| **Encode / Decode** | `/tools/encode-decode` | Base64, Base64URL, URL encoding, HTML entities and hex. |
| **Hash Generator** | `/tools/hash-generator` | MD5, SHA-1/256/384/512 and HMAC of text or files. |

More tools will be added. See [docs/adding-a-tool.md](docs/adding-a-tool.md).

## Project structure

```text
src/
├── main.tsx                 entry: theme + router
├── app/                     site shell
│   ├── router.tsx           routes generated from the tool registry (each tool lazy-loaded)
│   ├── Layout.tsx           header, footer, page titles
│   └── RouteStates.tsx      loading and error screens
├── pages/                   site pages (HomePage = tool directory, NotFoundPage)
├── config/site.ts           site name, tagline, description
├── shared/                  code any tool can use
│   ├── ui/                  Button, Card, Badge, Icon, Tabs, Panel, Headline, ThemeToggle…
│   │   └── tool.tsx         Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented (text tools)
│   ├── lib/                 byte readers, CRC-32, bounded inflate, checksums, AppError
│   └── utils/               formatting, theme
├── styles/index.css         design tokens (palette, primary color, fonts)
└── tools/
    ├── types.ts             ToolDefinition
    ├── registry.ts          the list of tools ← register new tools here
    └── clean-image/         everything for the Clean Image tool
        ├── index.ts         tool definition
        ├── CleanImagePage.tsx
        ├── components/  features/  hooks/  workers/  config/  types/  utils/
    └── <tool-id>/           jwt-decoder, diff-checker, js-runner, json-formatter, encode-decode, hash-generator
tests/tools/<tool-id>/       unit tests per tool (Vitest)
e2e/                         browser tests: home.spec.ts + one spec per tool (Playwright)
docs/                        adding-a-tool.md + docs/tools/<tool-id>/
```

## Privacy

- No backend, uploads, database, analytics or telemetry. Every tool processes files locally, heavy work runs in Web Workers.
- A strict Content Security Policy (`connect-src 'self'`) ships for Netlify/Cloudflare (`public/_headers`) and Vercel (`vercel.json`).
- The e2e suite asserts that processing a file makes only same-origin `GET` requests for the app's own assets.

## Development

Requires Node 20.19+ (`nvm use` reads `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests
npm run test:e2e     # browser tests against the production build (first run: npx playwright install chromium)
npm run lint
npm run typecheck
npm run build        # static site in dist/
```

Developed with Claude Code and a set of plugins (superpowers, frontend-design, context7, code-review, code-simplifier, claude-mem, context-mode). See [docs/claude-code-plugins.md](docs/claude-code-plugins.md) for what each one does, how to install it and when to use it. The same guides are on the site's blog (`/blog`); posts live in `src/blog/posts/` and are registered in `src/blog/registry.ts`.

## Deployment

`npm run build` produces a fully static `dist/`. Tool pages use client-side routes, so the host must serve `index.html` for unknown paths. That's already configured for Netlify/Cloudflare Pages (`public/_redirects`) and Vercel (`vercel.json`). Keep the security headers from the same files.

## Learn

`/learn` is a software-engineering course migrated from EngineeringWiki: 8 subjects (JavaScript, TypeScript, DSA, Web Fundamentals, Backend, Databases, System Design, Software Architecture), 150 lessons, 151 solved DSA problems and 9 system design case studies. Progress, bookmarks and solved problems are kept in the browser only.

- **Content** lives in `src/learn/content/` as plain TypeScript data (types in `src/learn/types/`). Edit or add lessons there; pages never hard-code content.
- **Catalog:** `npm run generate:learn` rebuilds `src/learn/data/*.generated.ts` (titles, links, search index, counts). It also runs before every build, and a unit test fails if it's out of date.
- **Loading:** pages list content from the small catalog and load one subject, problem file or case study at a time (`src/learn/data/index.ts`), so the ~3 MB of lessons never ships up front. Never import `src/learn/content/index.ts` from the app.
- **Runnable examples** use the JS Runner's worker. Examples that need a real page (`document`, `alert`, `localStorage`…) run in a sandboxed iframe at `/sandbox/dom`, which has its own CSP (see `vercel.json`) and no network access.
- **SEO:** the build writes a static HTML page with the full text of every lesson, problem and case study, and lists them in `sitemap.xml` (`scripts/learn-pages.ts`, called from `scripts/seo-plugin.ts`).
- **Tests:** `tests/learn/` (content integrity: unique ids, every cross-link resolves, every item loads) and `e2e/learn-*.spec.ts`.

## Clean Image

- **Inspects** EXIF (GPS, camera, dates, thumbnails), XMP, IPTC, JPEG comments, PNG text chunks, ICC, C2PA and trailing data, plus encoding details, checksums and raw bytes.
- **Labels** AI and provenance metadata (C2PA, IPTC digital source type, "Made with Google AI", generator parameters). These are labels, not a detection verdict.
- **Cleans losslessly** by removing metadata containers and copying image data byte for byte. Two modes are available, and orientation can be preserved.
- **Verifies** the output by re-parsing it, diffing the metadata, checking dimensions and image-data identity, and test-decoding it in the browser.
- **Doesn't touch pixels**, so it doesn't remove invisible watermarks (e.g. SynthID) and doesn't change AI-detector results.

Docs: [architecture](docs/tools/clean-image/architecture.md) · [supported formats](docs/tools/clean-image/supported-formats.md) · [privacy](docs/tools/clean-image/privacy.md)

## License

MIT
