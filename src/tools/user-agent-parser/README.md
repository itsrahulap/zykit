# User-Agent Parser

## Purpose

Parses a User-Agent string into browser, engine, OS, device and bot details with explanatory notes, and shows the current browser's User-Agent Client Hints. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (no `accepts`, not `shareable`) |
| `UserAgentParserPage.tsx` | Input (defaults to `navigator.userAgent`), Samples select, Use my browser, Bot / Parsed / Notes panels, `ClientHints` (`navigator.userAgentData` + `getHighEntropyValues`) |
| `features/ua.ts` | `parseUserAgent`: bot, browser, OS, engine and device detection, ambiguity notes, `BOT_CATEGORY_LABELS`, `SAMPLES` |
| `features/rules.ts` | Ordered rule tables: `BOT_RULES`, `BROWSER_RULES`, `OS_RULES` (with Windows NT version map), `VENDOR_RULES` |

## Core Logic

Each table is first-match-wins, so order is the logic: AI bots before generic tokens, Google's specialised crawlers before `Googlebot`, in-app and branded browsers before Chrome/Safari, iPadOS before iOS, Fire OS before Android. Group 1 of a rule regex is the version (or a separate `ver` regex). `detectEngine` uses browser and OS (iOS/iPadOS → WebKit, Chrome ≥ 28 → Blink). `detectDevice` derives the type from token heuristics (bot > console > TV > tablet > mobile > desktop) and Android models via `androidModel` + `VENDOR_RULES`. Notes are added in `parseUserAgent` for known ambiguities (Windows 10/11, frozen macOS, iPad desktop UA, reduced Chrome UA, Chromium clones, iOS WebKit, in-app, spoofable bots).

## Limits

- Static rule tables; no Client Hints for pasted strings (only for the live browser).
- No bot verification (reverse DNS / IP ranges).
- Not `shareable`; no Send to… input.

## Tests

- Unit: `tests/tools/user-agent-parser/ua.test.ts` (30+ real-world UA cases checked field by field, ambiguity notes, empty/unknown input, every sample parses). `npm test -- user-agent-parser`
- E2E: `e2e/user-agent-parser.spec.ts` (current browser parsed by default, samples, 320 px layout). `npm run test:e2e -- user-agent-parser`

## Known Gaps

- Rule tables need manual updates for new browsers, bots and device prefixes.
- Can't accept pasted `Sec-CH-UA-*` headers to refine a parsed string.
