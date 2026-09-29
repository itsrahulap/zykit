# Adding a new tool

**Quick start:** `npm run new:tool -- my-tool --name "My Tool" --category Developer --icon code` creates the definition, page, feature module, unit test and e2e spec below, registers the tool and updates the README. Then build the page.

Every tool lives in its own folder and registers itself in one place. The home page, routing, page titles and footer links are all generated from the registry.

## 1. Create the folder

```text
src/tools/<tool-id>/
├── index.ts            ToolDefinition (name, tagline, icon, tags, lazy page)  ← required
├── <Name>Page.tsx      default-exported page component                        ← required
├── components/         UI used only by this tool
├── features/           the tool's logic (pure TypeScript, testable without a browser)
├── hooks/              React state for the tool
├── workers/            Web Worker(s) for heavy processing, if needed
├── config/             limits and constants
└── utils/
tests/tools/<tool-id>/  unit tests + fixtures
e2e/<tool-id>.spec.ts   browser tests
docs/tools/<tool-id>/   tool-specific docs
```

Only `index.ts` and the page are required; add the other folders as the tool needs them.

## 2. Describe the tool — `src/tools/<tool-id>/index.ts`

```ts
import type { ToolDefinition } from '../types';

const myTool: ToolDefinition = {
  id: 'my-tool',                      // URL becomes /tools/my-tool
  name: 'My Tool',
  tagline: 'One line for the card',
  description: 'A sentence or two shown on the home page.',
  category: 'Images',                 // tools are grouped by category on the home page
  icon: 'image',                      // any IconName from src/shared/ui/ui.tsx
  tags: ['PNG', 'Privacy'],
  status: 'available',                // 'available' | 'beta' | 'coming-soon' (listed, not routable)
  load: () => import('./MyToolPage'), // lazy: the tool's code is only downloaded when opened
};

export default myTool;
```

## 3. Register it — `src/tools/registry.ts`

```ts
import myTool from './my-tool';
export const TOOLS: ToolDefinition[] = [cleanImage, myTool];
```

The home page groups tools by `category` in registry order and searches `name`, `tagline`, `description` and `tags`. Then run `npm run generate:readme` so the README's tool list includes it (a unit test fails until you do).

## 4. Build the page

The page renders inside the site layout (header, footer, `<main>`), so it only needs its own content. Reuse the shared building blocks:

| Import from | What's there |
|---|---|
| `src/shared/ui/ui.tsx` | `Button`, `Card`, `Badge`, `Icon` |
| `src/shared/ui/page.tsx` | `Headline`, `StatusStrip`, `ErrorAlert`, `IconTile` |
| `src/shared/ui/Panel.tsx` | `Panel`, `DetailRows` |
| `src/shared/ui/Tabs.tsx` | accessible `Tabs` |
| `src/shared/ui/tool.tsx` | `Breadcrumb`, `CodeArea` (monospace textarea), `CodeBlock`, `CopyButton`, `Segmented` |
| `src/shared/ui/Select.tsx` | styled, keyboard-accessible dropdown. Use it instead of a native `<select>`, whose open menu can't be themed |
| `src/shared/ui/convert.tsx` | `Checkbox`, `OptionsCard`, `ErrorPanel` (line/column + caret snippet), `OutputPanel` (copy/download), `Notices`, `OpenFileButton` for input → output converters |
| `src/shared/hooks/` | `useMediaQuery`, `useDocumentMeta` |
| `src/shared/lib/` | byte readers, CRC-32, bounded inflate, MD5/SHA/Adler checksums, `AppError`, `csv` (RFC 4180 parse/write), `random` (unbiased sampling from `crypto.getRandomValues`), `textpos` (offset → line/column, error snippets) |
| `src/shared/utils/` | `formatBytes`, `pluralize`, theme helpers, `downloadText`, `selectInTextarea`, tool search |

Existing tools worth copying from: JSON Formatter (input → output with precise errors), Regex Tester and Diff Checker (work in a worker with a time limit), CSV Viewer (large data, windowed rendering), JWT Decoder (WebCrypto).

Start the page with `<Breadcrumb tool={myTool} />` so users can get back to the tool list.

## Search engines and link previews

Nothing to do: `npm run build` writes `dist/tools/<tool-id>.html` with the tool's own title, description, canonical URL, Open Graph tags and JSON-LD, and adds it to `dist/sitemap.xml` (see `scripts/seo-plugin.ts` and `src/config/seo.ts`). Write `tagline` and `description` with the words people search for, since they become the page title and search snippet.

## Tests

- **Unit tests** for everything in `features/`: `tests/tools/<tool-id>/*.test.ts` (Vitest, Node environment, so keep DOM-free logic in `features/`).
- **A browser test** per tool: `e2e/<tool-id>.spec.ts` (Playwright, against the production build under the real CSP). Copy the checks from an existing spec: the main flow, no console errors, only same-origin `GET` requests, and no sideways scrolling at 320 px.

## Rules every tool follows

- **Local only.** Never send file contents, file names or derived data over the network. The CSP (`connect-src 'self'`) blocks third-party requests, and e2e tests assert that no off-origin or non-GET requests happen.
- **Heavy work in a worker**, with cancellation. Anything user-controlled that can run away (regular expressions, parsers of large input, code) also gets a time limit that terminates the worker.
- **No eval.** The CSP forbids `eval` and `new Function`, so parse things yourself. Code execution uses a fresh blob worker (see the JS Runner).
- **Libraries are the exception, and load lazily.** Prefer writing it yourself; if a library is worth it, check it has no `eval` and few dependencies, and `import()` it inside the tool so it never reaches other pages. List it in the README's "Third-party code" table.
- **Phones first.** No sideways page scrolling at 320 px (wide tables and code scroll inside their own box), and touch targets use `pointer-coarse:min-h-11`.
- **Treat file contents as hostile.** Bounds-check every read, cap decompression, render untrusted text as text.
- **Shared code stays generic.** If something is only useful to one tool, keep it in that tool's folder. Move it to `src/shared/` once a second tool needs it.
