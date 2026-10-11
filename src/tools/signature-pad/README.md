# Signature Pad

## Purpose

Draw (pointer events, smoothing, pressure) or type a signature and export it as a transparent PNG or SVG. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`) |
| `SignaturePadPage.tsx` | Draw/Type modes, pointer handling with coalesced events, redraw via `Path2D`, undo/clear, trim, PNG export (`toPng`, 2x scale, no background) |
| `features/signature-pad.ts` | `addPoint`, `pressureFactor`, `strokePaths` (midpoint quadratic smoothing, split on width change), `strokeBounds`, `padBounds`, `strokesToSvg`, `FONT_STACKS` (system cursive only), `typedBounds`, `typedToSvg` |

## Core Logic

Strokes live in a fixed 600x240 coordinate space regardless of the CSS size. Each stroke keeps its own colour and width. Canvas and SVG both use the path strings from `strokePaths`. Colours are validated as `#rrggbb` before going into SVG. Typed mode is the keyboard path; its text is measured with canvas `measureText`.

## Limits

- Fixed drawing area; no redo; undo removes whole strokes. Typed SVG depends on installed fonts.

## Tests

- Unit: `tests/tools/signature-pad/signature-pad.test.ts` (point filtering, pressure factor, smoothing output, width splitting, bounds, padding and clipping, SVG output and sanitising, typed bounds). `npm test -- signature-pad`
- E2E: `e2e/signature-pad.spec.ts` (draw, undo and clear, PNG and SVG downloads, typed mode, no off-origin requests; phone layout). `npm run test:e2e -- signature-pad`

## Known Gaps

- No background-colour option or resize of the drawing area; typed text is a single line.
