# Zykit

A growing collection of file tools that run **entirely in the browser**. Files are never uploaded. The home page (`/`) lists every tool, and each tool lives at `/tools/<tool-id>`.

| Tool | URL | What it does |
|---|---|---|
| **Clean Image** | `/tools/clean-image` | Inspect and remove EXIF, GPS, XMP, IPTC, PNG text, C2PA and AI-generation metadata from JPEG, PNG and WebP without re-encoding. |

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

## Deployment

`npm run build` produces a fully static `dist/`. Tool pages use client-side routes, so the host must serve `index.html` for unknown paths. That's already configured for Netlify/Cloudflare Pages (`public/_redirects`) and Vercel (`vercel.json`). Keep the security headers from the same files.

## Clean Image

- **Inspects** EXIF (GPS, camera, dates, thumbnails), XMP, IPTC, JPEG comments, PNG text chunks, ICC, C2PA and trailing data, plus encoding details, checksums and raw bytes.
- **Labels** AI and provenance metadata (C2PA, IPTC digital source type, "Made with Google AI", generator parameters). These are labels, not a detection verdict.
- **Cleans losslessly** by removing metadata containers and copying image data byte for byte. Two modes are available, and orientation can be preserved.
- **Verifies** the output by re-parsing it, diffing the metadata, checking dimensions and image-data identity, and test-decoding it in the browser.
- **Doesn't touch pixels**, so it doesn't remove invisible watermarks (e.g. SynthID) and doesn't change AI-detector results.

Docs: [architecture](docs/tools/clean-image/architecture.md) · [supported formats](docs/tools/clean-image/supported-formats.md) · [privacy](docs/tools/clean-image/privacy.md)

## License

MIT
