# Markdown Editor

## Purpose

Markdown editor with a toolbar, a sanitized live GFM preview, a localStorage draft and `.md` / `.html` export. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['markdown']`, `produces: ['markdown']`, `shareable: true`) |
| `MarkdownEditorPage.tsx` | Editor + toolbar and Ctrl/⌘ B/I/K, Edit/Preview tabs below `lg`, draft save (`zykit-markdown`, 300 ms debounce), preview, exports, blocked-image notice, share state |
| `features/markdown.ts` | `createMarkdownRenderer` (`marked` with `gfm: true, breaks: false`, prefixed de-duplicated heading ids, `stripInlineStyles` on raw HTML), `slugify`, `countText`, `documentTitle`, `standaloneHtml`, `previewHtml` (aria-level shift) |
| `features/sanitize.ts` | `PURIFY_CONFIG`, `createSanitizer` (DOMPurify `afterSanitizeAttributes` hook for links, images, task checkboxes, id prefixing), `loadRenderer` (lazy `marked` + `dompurify`) |
| `features/editing.ts` | Pure toolbar edits: `wrap`, `link`, `linePrefix`, `insertTable`, `applyEdit` |

## Core Logic

`marked` output is untrusted: raw HTML passes through (only inline styles are neutralised first, to avoid CSP violation noise), and `loadRenderer` always pipes it through a per-instance DOMPurify with the HTML-only profile, forbidden tags/attributes and no data attributes. The hook strips `javascript:` / `vbscript:` / `data:` / `file:` hrefs, rewrites in-document `#` links and all ids to the `md-` prefix (DOM clobbering), sets `target="_blank" rel="noopener noreferrer"` on other links, and blanks any `img` whose `src` isn't `data:image/…` or `blob:`, counting them for the notice. Toolbar edits go through `execCommand('insertText')` to keep undo history, falling back to a state update.

## Limits

- `MAX_FILE_BYTES` = 5 MB for opened/dropped files. No input cap otherwise; rendering runs on the main thread on a deferred value.
- Copy HTML / `.html` export use the sanitized HTML without the preview's `aria-level` changes.

## Tests

- Unit: `tests/tools/markdown-editor/markdown.test.ts` (heading anchors, GFM tables / task lists / strikethrough / autolinks, inline-style neutralising, raw HTML passthrough, sanitizer config, slugify, counts, title + standalone export, toolbar edits, `previewHtml`). `npm test -- markdown-editor`
- E2E: `e2e/markdown-editor.spec.ts` (XSS payloads sanitized and remote images blocked, GFM features, toolbar and shortcuts, exports, draft persistence, Edit/Preview tabs and 320 px layout). `npm run test:e2e -- markdown-editor`

## Known Gaps

- No footnotes, math, diagrams or code syntax highlighting.
- Same-origin and relative image paths are blocked too, not only remote ones.
- Sanitizer behaviour is only tested in the browser (E2E); unit tests cover the config, not DOMPurify output.
