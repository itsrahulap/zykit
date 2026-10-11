# Text to Speech

## Purpose

Reads text aloud with the browser's Web Speech API: voice picker grouped by language (local vs online marked), rate/pitch/volume, play/pause/resume/stop, and current-word highlighting when boundary events arrive. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`, text only) |
| `TextToSpeechPage.tsx` | Page: support check, voice select with `optgroup`s, sliders, controls, highlight view, share state (text) |
| `features/text-to-speech.ts` | `chunkText`, `wordAt`, `groupVoices`, `languageLabel` |

## Core Logic

`chunkText` splits on sentence enders and newlines, merges sentences up to 200 characters, and cuts overlong sentences at spaces, keeping each chunk's offset. The page queues one utterance at a time (next starts in `onend`); a run counter invalidates callbacks after Stop. Voices load from `getVoices()` and `voiceschanged`. `onboundary` (word events) gives `charIndex` within the chunk, converted to an offset in the full text.

## Limits

- 30,000 characters; chunk size 200.
- Settings apply from the next chunk. No audio export (API limitation).
- Non-local voices may be processed by the browser/OS vendor; the page says so.

## Tests

- Unit: `tests/tools/text-to-speech/text-to-speech.test.ts` (chunker, word lookup, voice grouping). `npm test -- text-to-speech`
- E2E: `e2e/text-to-speech.spec.ts` (UI present, unsupported path). `npm run test:e2e -- text-to-speech`

## Known Gaps

- Actual speech is not covered by automated tests (no audio in CI).
- No SSML, and no per-language auto-detection of the text.
