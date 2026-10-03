# Open Graph Image Generator

## Purpose

Canvas designer for social preview images (1200x630, 1200x600, 1080x1080) with theme presets (including the Zykit palette), solid / gradient / pattern backgrounds, system-font stacks, an optional local logo or emoji, safe-area guides, fake Facebook / X / LinkedIn / Slack link cards, PNG and JPEG export and the matching `<meta>` tags. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (not `shareable`: a logo upload can't go in a link) |
| `OgImageGeneratorPage.tsx` | Controls, live canvas, guides overlay, export, meta-tag form |
| `components/Cards.tsx` | Facebook, X, LinkedIn and Slack card approximations (fixed colours) |
| `features/layout.ts` | `wrapText`, `breakWord`, `ellipsize`, `fitText` (injected `Measure`), `contain`, `alignX`, `SIZES`, `safeArea`, `squareCrop` |
| `features/design.ts` | `Design` state, `THEMES`, `FONTS` (system stacks only), `applyTheme`, `clipEmoji` |
| `features/render.ts` | `renderOg`: paints background, pattern, logo / emoji, eyebrow, fitted title and subtitle, site name |
| `features/meta.ts` | `ogMetaTags`, `escapeAttr`, `isAbsoluteHttpUrl`, `hostOf`, `fileName` |

## Core Logic

Layout is computed from measured text: `fitText` steps the font size down by 2 px from the maximum until the wrapped lines fit width, height and line count, and ellipsizes only at the minimum size. `renderOg` stacks icon, eyebrow, title and subtitle, gives the title whatever height remains, and centres the block between the margins. Previews and the final file both come from the same canvas (`toBlob`), and the guides are CSS overlays, not painted.

## Limits

- Three fixed sizes; no custom dimensions.
- System fonts only (CSP blocks remote fonts); the exported look depends on the device.
- Logo decoded with `decodeImage` (50 MB / 100 MP caps).

## Tests

- Unit: `tests/tools/og-image-generator/og-image-generator.test.ts` (wrapping, long words, auto-fit and truncation with a fake measure, geometry, themes and fonts, meta tags). `npm test -- og-image-generator`
- E2E: `e2e/og-image-generator.spec.ts` (edit, previews, meta tags, PNG and JPEG downloads with real dimensions, logo upload, no off-origin requests, 320 px). `npm run test:e2e -- og-image-generator`

## Known Gaps

- No drag-to-position, no multiple text blocks, no letter spacing (canvas support varies).
- Cards are approximate and not updated from the platforms.
