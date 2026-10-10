# HTML to Markdown

## Purpose

Converts HTML (typed, opened or pasted as rich text) to Markdown in the browser. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `HtmlToMarkdownPage.tsx` | Page: options, input, output, share state |
| `features/html-to-markdown.ts` | Pure logic |

## Core Logic

`features/html-to-markdown.ts` is pure over a minimal node interface (`HNode`): `htmlToMarkdown(root, options)` walks a DOMParser document. Block elements are collected by `blocks()`, inline runs by `inline()`; lists, tables and `pre` have their own functions. `<br>` is a private-use marker until a paragraph is tidied. The page parses with `DOMParser` (inert) and captures the clipboard's `text/html` in a paste area.

## Limits

Input 5 MB. No colspan/rowspan, no block content in table cells, tight lists only, setext headings for levels 1 and 2 only.

## Tests

- Unit: `tests/tools/html-to-markdown/html-to-markdown.test.ts`. `npm test -- html-to-markdown`
- E2E: `e2e/html-to-markdown.spec.ts`. `npm run test:e2e -- html-to-markdown`

## Known Gaps

Reference-style links, definition lists, footnotes and HTML left as-is for unsupported elements.
