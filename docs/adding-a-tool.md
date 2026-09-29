# Adding a new tool

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

## 4. Build the page

The page renders inside the site layout (header, footer, `<main>`), so it only needs its own content. Reuse the shared building blocks:

| Import from | What's there |
|---|---|
| `src/shared/ui/ui.tsx` | `Button`, `Card`, `Badge`, `Icon` |
| `src/shared/ui/page.tsx` | `Headline`, `StatusStrip`, `ErrorAlert`, `IconTile` |
| `src/shared/ui/Panel.tsx` | `Panel`, `DetailRows` |
| `src/shared/ui/Tabs.tsx` | accessible `Tabs` |
| `src/shared/ui/tool.tsx` | `Breadcrumb`, `CodeArea` (monospace textarea), `CodeBlock`, `CopyButton`, `Segmented` |
| `src/shared/lib/` | byte readers, CRC-32, bounded inflate, MD5/SHA/Adler checksums, `AppError` |
| `src/shared/utils/` | `formatBytes`, `pluralize`, theme helpers |

Start the page with `<Breadcrumb tool={myTool} />` so users can get back to the tool list.

## Rules every tool follows

- **Local only.** Never send file contents, file names or derived data over the network. The CSP (`connect-src 'self'`) blocks third-party requests, and e2e tests assert that no off-origin or non-GET requests happen.
- **Heavy work in a worker**, with cancellation.
- **Treat file contents as hostile.** Bounds-check every read, cap decompression, render untrusted text as text.
- **Shared code stays generic.** If something is only useful to one tool, keep it in that tool's folder. Move it to `src/shared/` once a second tool needs it.
