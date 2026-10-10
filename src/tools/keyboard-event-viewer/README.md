# Keyboard Event Viewer

## Purpose

Shows the properties of every `keydown` / `keyup` event in a focusable capture box (or page-wide). User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`) |
| `KeyboardEventViewerPage.tsx` | Capture box, window-level toggle, preventDefault toggle, latest-event list, history table, aria-live announcements |
| `features/keyboard.ts` | Pure: `toRecord` (event to record), history cap, `announcement`, `toJson`, `toMarkdown` |

## Core Logic

Handlers are on the box (or on `window` when the toggle is on). The React event's `nativeEvent` is used for `isComposing`. `preventDefault` is applied except for Tab. The aria-live region only gets text for non-repeat keydowns.

## Limits

- 50 events kept; OS/browser-reserved shortcuts never reach the page.
- `keyCode` / `which` are deprecated and shown for legacy debugging only.

## Tests

- Unit: `tests/tools/keyboard-event-viewer/keyboard-event-viewer.test.ts`. `npm test -- keyboard-event-viewer`
- E2E: `e2e/keyboard-event-viewer.spec.ts` (capture, modifiers, history, phone layout).

## Known Gaps

- No IME composition event log (`compositionstart` etc.).
- No export to file; copy only.
