# CSS Generator

## Purpose

Visual builders for CSS gradients, box and text shadows, border radius, fluid `clamp()` sizes and `cubic-bezier()` easings, each with live preview, copy-ready CSS and a Tailwind arbitrary-value equivalent. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable`, `produces: code`) |
| `CssGeneratorPage.tsx` | Segmented tab switcher, one component per generator, share state |
| `components/controls.tsx` | `Slider`, `NumField`, `ColorField`, `Output` (CSS + Tailwind with copy), `Group` |
| `components/BezierEditor.tsx` | SVG curve with draggable, keyboard-operable handles; `useReducedMotion` |
| `features/css.ts` | Pure string builders (`gradientCss`, `boxShadowValue`, `borderRadiusValue`, `bezierCss`, ...) and `fluid()` clamp maths |
| `features/state.ts` | `restore`: shape-checked merge of shared state over defaults |

## Core Logic

Preview and output come from the same builder functions. `fluid()` fits a line through (minVw, minSize) and (maxVw, maxSize), expresses the intercept in rem and the slope in vw, and returns the explanation steps. Bezier x values are clamped to 0-1 and y to -2..3. Tailwind classes replace spaces with underscores.

## Limits

- 8 shadow layers, 10 gradient stops, hex colours with separate opacity.
- Share links store the whole state as one JSON string in the URL fragment; it is re-validated against defaults on load.

## Tests

- Unit: `tests/tools/css-generator/css-generator.test.ts`. `npm test -- css-generator`
- E2E: `e2e/css-generator.spec.ts`. `npm run test:e2e -- css-generator`

## Known Gaps

- No colour hints, `color-mix()`, multi-layer backgrounds or glassmorphism helper.
- Gradient stops are not draggable on a bar; positions use sliders.
