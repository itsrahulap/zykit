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
  accepts: ['json'],                  // optional: text "Send to…" can hand this tool (see below)
  produces: ['json'],                 // optional: what its main output is (default "Send to…" kind)
  shareable: true,                    // optional: "Copy share link". Never for tools that handle secrets
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
| `src/shared/ui/convert.tsx` | `Checkbox`, `OptionsCard`, `ErrorPanel` (line/column + caret snippet), `OutputPanel` (copy, Send to…, download, and their shortcuts), `Notices`, `OpenFileButton` (`onText` reads a text file with a size cap) for input → output converters |
| `src/shared/ui/SendToMenu.tsx` | `SendToMenu`: "Send to…" button + menu listing the tools that accept the output's kind |
| `src/shared/ui/DropZone.tsx` | `DropZone`: drop a text file onto any input (`CodeArea` has it built in via `onFileText`) |
| `src/shared/hooks/` | `useMediaQuery`, `useDocumentMeta`, `useIncomingText`, `useFileDrop`, `useToolShortcuts`, `useShareState` |
| `src/shared/lib/` | byte readers, CRC-32, bounded inflate, MD5/SHA/Adler checksums, `AppError`, `csv` (RFC 4180 parse/write), `random` (unbiased sampling from `crypto.getRandomValues`), `textpos` (offset → line/column, error snippets) |
| `src/shared/utils/` | `formatBytes`, `pluralize`, theme helpers, `downloadText`, `selectInTextarea`, tool search |

Existing tools worth copying from: JSON Formatter (input → output with precise errors), Regex Tester and Diff Checker (work in a worker with a time limit), CSV Viewer (large data, windowed rendering), JWT Decoder (WebCrypto).

Start the page with `<Breadcrumb tool={myTool} />` so users can get back to the tool list. It also shows the favorite star and, for `shareable` tools, the share button.

## 5. Work with the other tools

Every text tool plugs into four shared workflows. Most of it is one line each:

```tsx
// "Send to…" target: text sent from another tool lands in the main input (consumed once, on mount).
useIncomingText(myTool.id, (text, handoff) => setInput(text)); // handoff.kind: 'json', 'csv', …

// Files: drop a text file on the input (visible drop state, 10 MB cap, binary refused)…
<CodeArea label="Input JSON" value={input} onChange={…} onFileText={(text) => setInput(text)} />
// …and, for documents and data, an "Open file" button next to "Try an example".
<OpenFileButton accept=".json,application/json" onText={(text) => setInput(text)} />

// Shortcuts: Ctrl/⌘+Enter runs (only tools with an explicit action), Ctrl/⌘+Shift+C copies and
// Ctrl/⌘+S downloads the main output. OutputPanel registers copy/download itself.
useToolShortcuts({ onRun: run, getOutput: () => output, onDownload: download });

// Share links (only with `shareable: true`): input + options go into the URL fragment
// (#s=…, deflate-raw + Base64URL, max ~16 KB), which never reaches a server. On load the page is
// restored from it; only keys you pass, with the same type (and allowed values), are applied.
useShareState({ input, mode }, (s) => { if (s.input !== undefined) setInput(s.input); if (s.mode) setMode(s.mode); }, { mode: ['a', 'b'] });
```

- **`accepts` / `produces`** use the kinds in `DataKind` (`json`, `csv`, `yaml`, `xml`, `text`, `code`, `sql`, `url`, `jwt`, `headers`, `markdown`, `regex`, `curl`). A tool's "Send to…" menu lists every other tool whose `accepts` includes the output's kind. `OutputPanel` shows it automatically (kind guessed from `mime`, or pass `kind`); a custom output puts `<SendToMenu text={output} />` right after its Copy button.
- **`shareable`**: never for tools that handle secrets (tokens, keys, passwords, cookies, certificates) or run code. `tests/shared/share.test.ts` keeps a list of tools that must stay unshareable; add yours if it handles secrets.
- **Keyboard**: plain-key shortcuts ("?" help, "/" search) never fire while typing in a field; the modifier ones do. The "?" dialog lists them (`src/shared/ui/ShortcutsHelp.tsx`).

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
