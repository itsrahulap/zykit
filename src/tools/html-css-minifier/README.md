# HTML & CSS Minifier

## Purpose

Conservative minifiers and beautifiers for HTML and CSS, with before/after byte and gzip sizes. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `HtmlCssMinifierPage.tsx` | Page: language/action/indent/unquote options, input, output, size card |
| `features/html-css-minifier.ts` | `minifyCss`, `beautifyCss`, `minifyHtml`, `beautifyHtml`, `gzipSize` |

## Core Logic

CSS: `cssLiteral` finds strings, comments and unquoted `url(...)`, which are copied (or dropped, for comments) without further processing. `minifyCss` tracks parenthesis depth: outside parens it drops spaces next to `{ } ; , > ~ !` and after `:`, inside parens only after `(` `,` `:` and before `)` `,`, so `calc()` operators keep their spaces. `beautifyCss` minifies with all comments kept, then splits statements at `{ ; }` and formats selectors and declarations.

HTML: `tokenizeHtml` yields text, comment, declaration, tag and raw tokens; the content of `pre`, `textarea`, `script` and `style` becomes a single raw token. `prepare` drops non-conditional comments, merges text, and collapses whitespace, trimming it only next to `BLOCK` tags. `beautifyHtml` indents `BLOCK` tags (using a stack, with implied end tags for `li`, `p`, `td`…), keeps blocks that hold only inline content on one line, and formats `<style>` with `beautifyCss`. Attribute values are copied verbatim; the unquote option only rewrites values matching a safe pattern.

## Limits

- Page caps input at 5,000,000 characters.
- No colour/unit/selector rewriting, no JS minification, no minification of inline `style` attributes or `<style>` content.
- Beautified HTML with omitted end tags may indent oddly; `gzipSize` returns null without `CompressionStream`.

## Tests

- Unit: `tests/tools/html-css-minifier/html-css-minifier.test.ts` (comments, strings and urls with comment-like text, calc spacing, escaped quotes, `!important`, `pre`/`textarea`/`script`/`style` preserved, conditional comments, attribute handling, idempotence, beautify). `npm test -- html-css-minifier`
- E2E: `e2e/html-css-minifier.spec.ts` (minify/beautify HTML and CSS, sizes, no network, 320px). `npm run test:e2e -- html-css-minifier`

## Known Gaps

- No optional-tag removal, empty-rule removal, or `<script>`/inline-style minification.
- Space before a declaration colon (`color : red`) is left as `color :red`, because a leading space can be a selector combinator.
