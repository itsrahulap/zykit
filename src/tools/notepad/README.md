# Notepad

## Purpose

Multiple notes saved automatically in the browser, with search, Markdown preview, import and export. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`, notes are private) |
| `NotepadPage.tsx` | Page: note list, editor, autosave, cross-tab sync, import/export |
| `features/store.ts` | Pure reducer, search/sort, storage (de)serialisation, file names |

## Core Logic

State is one `{ notes, activeId }` object handled by `reducer`. The page serialises it to `localStorage['zykit-notepad']` 400 ms after the last change (try/catch; quota errors show a message), skipping writes that equal the last value saved or received. A `storage` event from another tab is parsed with `parseStored` (defensive, never throws) and replaces the state. Preview reuses `loadRenderer` from `../markdown-editor/features/sanitize` (marked + DOMPurify), loaded on first use. Export uses `downloadText` and `createZip` from `shared/lib/zip`; import uses `readTextFile`.

## Limits

500 notes, 1,000,000 characters per note, 200-character titles, 10 MB per imported file, about 5 MB browser storage. A .zip is refused above the writer's non-ZIP64 size limit.

## Tests

- Unit: `tests/tools/notepad/notepad.test.ts`. `npm test -- notepad`
- E2E: `e2e/notepad.spec.ts`. `npm run test:e2e -- notepad`

## Known Gaps

Last write wins between tabs (no merge). Import does not restore pinning or timestamps. No folders, tags or version history.
