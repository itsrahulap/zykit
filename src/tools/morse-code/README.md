# Morse Code Translator

## Purpose

Translates text to International Morse and back, and plays it as audio (optionally with a light flash) at a chosen speed, Farnsworth spacing and pitch. Includes a reference table. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `MorseCodePage.tsx` | Page: two linked text areas (last edited side drives the other), separator, WPM / Farnsworth / tone sliders, Web Audio playback, flash indicator, reference tables, share state (src, val, sep) |
| `features/morse-code.ts` | Tables, `encode`, `parseMorse`, `decode`, `unitMs`, `gapUnitMs`, `timeline`, `totalMs` |

## Core Logic

`encode` maps characters and `<PROSIGN>` tokens to patterns. `parseMorse` normalises lookalike dots and dashes and splits words then letters; `decode` and `timeline` both use it. `timeline` yields tone/gap durations (dit = 1200/WPM ms, gaps 1/3/7 units; Farnsworth gap unit = (60c − 37.2s)/(c·s)/19 seconds). The page schedules gain ramps on one oscillator in a Web Audio context and drives the flash with timers.

## Limits

- Playback limited to `MAX_PLAY_CHARS` (2000); WPM 5–40; tone 300–1200 Hz.
- With `prefers-reduced-motion: reduce` the flash option is disabled and only a static status is shown.

## Tests

- Unit: `tests/tools/morse-code/morse-code.test.ts` (encode, decode, tolerance, prosigns, timing, Farnsworth). `npm test -- morse-code`
- E2E: `e2e/morse-code.spec.ts`. `npm run test:e2e -- morse-code`

## Known Gaps

- No non-Latin Morse alphabets and no microphone/audio input decoding.
- Flash timing uses `setTimeout`, so it may drift slightly from the audio.
