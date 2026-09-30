## Accessibility Audit: Zykit
**Standard:** WCAG 2.1 AA | **Date:** 2026-09-30

**Scope and method.** Production build (`vite build`), served by `vite preview`, driven by Playwright (Chromium) and `@axe-core/playwright` 4.13 with the tags `wcag2a, wcag2aa, wcag21a, wcag21aa`. The harness is `e2e/a11y.spec.ts`. It writes the machine-readable summary to `/private/tmp/claude-501/a11y-results.json`.

- **Routes (61):** home, all 46 built tools in `src/tools/registry.ts`, `/learn`, `/learn/javascript`, `/learn/javascript/what-is-javascript`, problems home, category and problem pages, case studies home and `url-shortener`, progress, bookmarks, `/blog`, `/blog/claude-code-plugins-explained`, and the 404 page. Six batch-5 tools still have the scaffold placeholder (`accent="TODO"`) and were skipped: color-converter, ip-cidr-calculator, json-schema, jsonpath-query, number-base-converter and semver-checker. The spec skips these automatically.
- **States (7):** the open command palette, an open Select listbox, the Learn mobile drawer, the shortcuts dialog, the JSON Formatter and Regex Tester in error states, and a lesson with its DOM playground running (sandbox iframe).
- **Matrix:** every route and state in light and dark themes (`localStorage['zykit-theme']`), at 1280 px and 375 px. That is **270 axe scans**.
- **Other checks:**
  - Tab walks with before/after focus-style comparison on home, JSON Formatter, Regex Tester, Image Compressor, Cron Builder, CSV Viewer and a Learn topic.
  - Widget key handling: palette, Select, segmented controls, drawer, shortcuts dialog, `<details>` and code editors.
  - Contrast of design tokens, resolved in the browser from `src/styles/index.css` and Tailwind defaults.
  - Reflow at 320×256 and 640×512 on every route, plus a text-spacing override on 7 pages at 2 widths.
  - Touch targets with `hasTouch`/`isMobile` (`pointer: coarse` confirmed) on 13 pages.
  - Structure on every route: titles, headings, landmarks, lang, live regions, images, iframes, `target=_blank`.
  - Reduced motion, `prefers-color-scheme`, and error association on JSON, Regex and Cron.

### Summary (Issues found / Critical / Major / Minor)

| Issues found | 🔴 Critical | 🟡 Major | 🟢 Minor |
|---|---|---|---|
| **24** | **0** | **11** | **13** |

axe violations (270 scans, deduplicated by rule):

| axe rule | Impact | WCAG | Nodes | Routes/states |
|---|---|---|---|---|
| `color-contrast` | serious | 1.4.3 | 1,919 (1,706 light / 213 dark) | 68 / 68 |
| `scrollable-region-focusable` | serious | 2.1.1, 2.1.3 | 24 | 4 |
| `aria-prohibited-attr` | serious | 4.1.2 | 8 | 2 |
| `label` | critical | 4.1.2 | 4 | 1 |

axe also left items for manual review (not counted as violations):
- `color-contrast` ×162: text over gradients, images and translucent layers.
- `aria-valid-attr-value` ×170: Select's `aria-controls` points to a `hidden` listbox.
- `aria-prohibited-attr` ×40.
- `link-in-text-block` ×2.

**What passed cleanly:**
- **Reflow:** no horizontal page scroll and no clipped content at 320 px or 640 px on any of the 61 routes.
- **Text spacing:** no overflow or clipping with the 1.4.12 override.
- **Page structure:**
  - Every page title is unique and descriptive.
  - Every page has exactly one `<h1>`, except Markdown Editor (see #9).
  - No heading levels are skipped.
  - `lang="en"` is set.
  - Every page has header, named `nav`s, a single `main` and a footer.
- **Media:**
  - Every `<img>` has alt text; empty alt is used only for decorative thumbnails next to filenames.
  - The sandbox iframe is titled ("Sandbox page for this example").
  - No autoplaying media.
- **Reduced motion:** no transform animations or transitions run under `prefers-reduced-motion: reduce`.
- **Keyboard:**
  - No keyboard traps on tool pages.
  - Shift+Tab works.
  - The palette, drawer and shortcuts dialog trap focus, close on Escape and restore focus.

### Findings

Severity key: 🔴 Critical means users cannot complete a task. 🟡 Major means a real barrier or clear AA failure affecting many users or pages. 🟢 Minor means a near miss, low reach, or best practice beyond AA.

#### Perceivable

| # | Issue | WCAG Criterion | Severity | Where (routes/components with file paths) | Recommendation (concrete code-level fix) |
|---|---|---|---|---|---|
| 1 | The muted-text token `slate-500` (#6e7770) is below 4.5:1 on the light surfaces it sits on. Ratios: 4.27 on `slate-50` page, 4.47 on the `bg-white/60` footer, 4.00 on `slate-100`, 4.08 on `primary-soft`, 4.12 on `emerald-50`. Only plain white passes (4.63). This is axe `color-contrast`, about 1,690 light-theme nodes. | 1.4.3 Contrast (Minimum) | 🟡 Major | All 68 routes and states. The main contributors: <br>• header nav links (`navClass` in `src/app/Layout.tsx`), 628 nodes <br>• footer bottom row (`SiteFooter`, `text-slate-500`), 580 nodes <br>• breadcrumb (`src/shared/ui/tool.tsx:16`), 267 nodes <br>• `<kbd>⌘K</kbd>` in `SearchButton` (`src/shared/ui/CommandPaletteProvider.tsx`), 91 nodes <br>• Learn progress "0%" labels (`src/learn/components/LearnNav.tsx`) <br>• `<dt>` labels in Diff Checker, Cron Builder and problem pages <br>• palette option meta (`src/shared/ui/CommandPalette.tsx`) <br>• Regex flag descriptions | Darken the token in `src/styles/index.css`: `--color-slate-500: #636c65;`. That gives 5.44 on white, 5.02 on slate-50, 4.70 on slate-100 and 4.80 on primary-soft. It fixes every light-theme node in one change. Re-check `dark:text-slate-500` users at the same time (see #2), because the darker value drops to 2.99 on slate-900. |
| 2 | Dark theme: text uses `slate-500` on `slate-900` (3.51:1) or `slate-950` (4.01:1). Two causes: `dark:text-slate-500` is set explicitly, or `text-slate-500` has no dark variant. axe reports 213 dark nodes. | 1.4.3 | 🟡 Major | 27+ routes. <br>• LearnNav eyebrows "Subjects / Practice / You" (`src/learn/components/LearnNav.tsx:114,123,130`) <br>• `src/blog/pages/BlogPostPage.tsx:18,51` ("Series", "Next") <br>• `src/blog/components/PostBlocks.tsx:85` <br>• `src/pages/NotFoundPage.tsx:6` <br>• `src/learn/components/PageStates.tsx:17` <br>• lesson numbers in `src/learn/pages/SubjectPage.tsx:103` <br>• `src/learn/pages/ProblemCategoryPage.tsx:142` <br>• `src/learn/pages/TopicPage.tsx:259` <br>• `src/tools/js-runner/components/ConsoleOutput.tsx:59` <br>• `src/tools/meta-tag-inspector/MetaTagInspectorPage.tsx:24` <br>• home "New tools are added here…" | Add `dark:text-slate-400` wherever `text-slate-500` has no dark variant. Replace `dark:text-slate-500` with `dark:text-slate-400`, which gives 6.27 on slate-900 and 7.18 on slate-950. A lint grep for `text-slate-500"` without `dark:` catches regressions. |
| 3 | Light theme: `slate-400` (#9ba39a) is used as a text colour at 2.59:1 on white. This covers lesson and problem numbers ("01", "02"), line-number gutters, and placeholders. `placeholder:text-slate-400` is in 14 files. Placeholders hold instructions such as "Search tools, e.g. JSON, UUID, base64". | 1.4.3 | 🟡 Major | • `/learn/javascript` and other subject pages, 90 nodes (`SubjectPage.tsx:103`) <br>• problem category (`ProblemCategoryPage.tsx:142`) and topic step numbers (`TopicPage.tsx:259`) <br>• line numbers in a tool gutter (`.w-5.text-right.font-mono.text-xs.text-slate-400`) <br>• placeholders in `CodeArea` (`src/shared/ui/tool.tsx`), the home search (`src/pages/HomePage.tsx`), the palette input (`CommandPalette.tsx`) and 11 other files | Use `text-slate-500` (the darker value from #1) for informative numbers and gutters. Change `placeholder:text-slate-400` to `placeholder:text-slate-500` in light mode and keep `dark:placeholder:text-slate-400`. Icons that carry no information can stay `slate-400`. |
| 4 | Dark theme: the skip link is unreadable when focused. `focus:bg-white` keeps the inherited `text-slate-100`, so the text is #eeefe9 on #fff at 1.16:1. This was measured on all 7 keyboard pages. | 1.4.3, 2.4.1 Bypass Blocks | 🟡 Major | Every route in dark theme: `src/app/Layout.tsx`, the `<a href="#main">` skip link | Add explicit colours: `focus:bg-white focus:text-slate-900 dark:focus:bg-slate-900 dark:focus:text-white focus:ring-2 focus:ring-emerald-500`. |
| 5 | Text-field and control boundaries are far below 3:1. Fields use `border-slate-200` on white (1.28:1). In dark they use `dark:border-slate-800` or `-700` on slate-900 (1.68:1). Secondary buttons and checkboxes use `ring-slate-300` (1.55:1). A white field inside a white card is identified only by that border. | 1.4.11 Non-text Contrast | 🟡 Major | • every tool input: `CodeArea` and `CodeBlock` in `src/shared/ui/tool.tsx`, `border-slate-200` in 85 files, `dark:border-slate-800` in 84 files <br>• the Select trigger (`src/shared/ui/Select.tsx`) <br>• home search (`src/pages/HomePage.tsx`) <br>• secondary `Button` (`src/shared/ui/ui.tsx`) | Add a field-edge token in `src/styles/index.css`: `--color-field-edge: #848d85;` gives 3.43 on white and 3.16 on slate-50. For dark, use `slate-500` (3.51 on slate-900). Apply `border-field-edge dark:border-slate-500` to inputs, textareas, the Select trigger and checkboxes. Card borders are decorative and can keep `slate-200`. Text-labelled buttons don't strictly need a 3:1 edge, but a secondary button next to a field reads better with one. |
| 6 | JWT Decoder coloured token segments fall below 4.5:1: header `rose-600` at 4.17 and signature `sky-600` at 3.71 on slate-50. | 1.4.3 | 🟢 Minor | `/tools/jwt-decoder` (`src/tools/jwt-decoder/components/ColouredToken.tsx:2,4`) | Use `text-rose-700` and `text-sky-700` in light mode. Keep the `-400` dark variants. |
| 7 | Text with reduced opacity falls below 4.5:1. Home category chip counts (`opacity-70`) measure 4.24 on primary and 4.15 on white. The Favicon Generator "New tab" mock (`opacity-60`) measures 3.48. | 1.4.3 | 🟢 Minor | • `/` (`src/pages/HomePage.tsx:107`, category chips) <br>• `/tools/favicon-generator` (`src/tools/favicon-generator/FaviconGeneratorPage.tsx`, browser-tab mock) | Replace `opacity-70` and `opacity-60` with a solid colour: `text-slate-600 dark:text-slate-400`. |
| 8 | Cron Builder's pressed value button in dark theme puts slate-950 ink on the emerald fill at 4.03:1. | 1.4.3 | 🟢 Minor | `/tools/cron-builder`, dark (`src/tools/cron-builder/CronBuilderPage.tsx`, the `min-w-10 … font-mono` value buttons) | In dark, use `dark:bg-emerald-600 dark:text-white` (4.61:1) or a lighter fill such as `dark:bg-emerald-400` with slate-950 ink. |
| 9 | Markdown Editor renders a second `<h1>` from the sample document inside the preview, so the page outline has two top-level headings. | 1.3.1 Info and Relationships | 🟢 Minor | `/tools/markdown-editor` (preview `.md-preview`) | Wrap the preview in `<section aria-label="Preview">` or `role="document"`, which already scopes it. Optionally shift user headings down one level in the renderer (`h1`→`h2`) for the in-page preview only, not in the exported HTML. |

#### Operable

| # | Issue | WCAG Criterion | Severity | Where (routes/components with file paths) | Recommendation (concrete code-level fix) |
|---|---|---|---|---|---|
| 10 | Horizontally scrollable code and diagram boxes can't be reached by keyboard, so overflowing content can't be scrolled into view. axe `scrollable-region-focusable`: 24 nodes. | 2.1.1 Keyboard | 🟡 Major | • `CodeBlock` `<pre class="overflow-x-auto">` (`src/shared/ui/tool.tsx:86`) on `/tools/favicon-generator` and `/blog/claude-code-plugins-explained` <br>• `Diagram` `<figure class="overflow-x-auto">` (`src/learn/components/Diagram.tsx:4`) on `/learn/case-studies/url-shortener` <br>• line-by-line `<code class="overflow-x-auto whitespace-pre">` (`src/learn/components/CodeExampleBlock.tsx:86`) on `/learn/problems/arrays-hashing/contains-duplicate` | Make the scroller focusable and named: `tabIndex={0} role="region" aria-label="Code"` (or the diagram's caption). Add a visible `focus-visible:ring-2` style. To avoid extra tab stops, add these only when `el.scrollWidth > el.clientWidth`, using a small `useOverflow` hook in `src/shared/hooks/`. |
| 11 | The lesson code editor captures Tab to indent. Escape releases it, but the page never says so: the hint reads only "Ctrl/⌘ + Enter runs", and the shortcuts dialog doesn't list Esc. A keyboard user who tabs into the editor appears stuck. | 2.1.2 No Keyboard Trap, 3.3.2 Labels or Instructions | 🟡 Major | Every Learn topic with runnable examples (`src/learn/components/CodeExampleBlock.tsx:215-233`, `hint` at line 249) | Change the hint to "Tab indents · Esc then Tab to leave · Ctrl/⌘ + Enter runs" and link it with `aria-describedby`. Add "Esc, Tab: leave the code editor" to `src/shared/ui/ShortcutsHelp.tsx`. |
| 12 | Touch targets are under 44×44 on coarse pointers. There are 8 to 78 offenders per sampled page. **2.1 AA has no target-size rule; 2.5.5 is AAA.** The recommendation is included because the project already uses `pointer-coarse:min-h-11`. <br>• The `Button` primitive is 40 px tall on phones. <br>• Segmented buttons are 40 px. <br>• Header nav links are 33 px, the theme toggle 40×40, Search 42×44, Share 36×44. <br>• Cron value buttons are 40×44 (24 of them). <br>• Breadcrumb links and checkbox labels are only 20 px tall, which would also miss WCAG 2.2's 24 px (2.5.8). | 2.5.5 Target Size (AAA); 2.5.8 in WCAG 2.2 | 🟢 Minor | All 13 sampled pages. <br>• `src/shared/ui/ui.tsx` (`Button`) <br>• `src/shared/ui/tool.tsx` (`Segmented`, breadcrumb) <br>• `src/app/Layout.tsx` (`navClass`) <br>• `src/shared/ui/ThemeToggle.tsx` <br>• `src/shared/ui/ShareButton.tsx` <br>• checkbox labels in Diff Checker and JSON Formatter <br>• the Learn status buttons (`TopicPage.tsx`, 40 px) | Add `pointer-coarse:min-h-11` to `Button` and `Segmented` buttons. Add `pointer-coarse:py-3` to `navClass` and breadcrumb links, and `pointer-coarse:h-11 pointer-coarse:w-11` to ThemeToggle, Search and Share. Wrap checkbox labels in `inline-flex items-center pointer-coarse:min-h-11`. |
| 13 | On Learn pages, "Skip to content" goes to `#main`, but the Learn sidebar (about 40 links) is inside `<main>` before the lesson. Reaching the lesson takes about 58 Tabs: in the walk, the first lesson control (the status buttons) was stop 59. | 2.4.1 Bypass Blocks | 🟢 Minor | `/learn/*` (`src/learn/LearnLayout.tsx`, `src/app/Layout.tsx`) | Put `id="content"` on the lesson `<article>` and add a second skip link, "Skip to lesson", in `LearnLayout`. Alternatively, render the sidebar as an `<aside>`/`<nav>` after the article in DOM order and keep it visually on the left with CSS grid. |
| 14 | Cron Builder's value picker makes all 60 minute (or 24 hour) buttons separate Tab stops. The walk counted 143 stops, and the footer can't be reached quickly. | 2.1.1 (efficiency) | 🟢 Minor | `/tools/cron-builder` (`src/tools/cron-builder/CronBuilderPage.tsx`) | Make the grid one Tab stop with a roving `tabIndex` and arrow, Home and End keys (`role="group"` plus `aria-pressed` buttons). Also offer a text field for "specific" values. |
| 15 | Focus on text fields and the Select trigger relies on a 1 px border change to emerald-500 plus `ring-emerald-500/20`. The 20 % alpha ring is almost invisible. The border change is 4.61:1, so 2.4.7 passes, but the indicator is weak. Every other control gets the global 2 px `#4a8062` outline (4.26 on slate-50, 4.04 on slate-950, 3.53 on slate-900). | 2.4.7 Focus Visible (passes; 2.4.11 in 2.2) | 🟢 Minor | `focus:ring-emerald-500/20` in 27 files: `CodeArea` in `src/shared/ui/tool.tsx`, `src/shared/ui/Select.tsx`, the home search | Use `focus:ring-emerald-500/60` or remove the `outline: none` exemption for text fields in `src/styles/index.css` so they get the 2 px outline too. |
| 16 | 4 external footer links, and more in Markdown and blog content, open in a new tab with no warning. | 3.2.5 (AAA) / G201 | 🟢 Minor | Every route (`src/app/Layout.tsx`, `SiteFooter`) | Append `<span className="sr-only"> (opens in a new tab)</span>` and an external-link icon, or drop `target="_blank"`. |

#### Understandable

| # | Issue | WCAG Criterion | Severity | Where (routes/components with file paths) | Recommendation (concrete code-level fix) |
|---|---|---|---|---|---|
| 17 | Error text isn't linked to the invalid field. JSON Formatter's "Input JSON" and Regex Tester's pattern get `aria-invalid="true"`, but have no `aria-describedby` or `aria-errormessage`. The message ("Invalid JSON: Unexpected '}' — trailing comma? (line 3, column …)") exists only in the polite StatusStrip, so a screen reader that returns to the field hears only "invalid entry". Cron Builder does this correctly: `aria-describedby="cron-description"` plus `role="alert"`. | 3.3.1 Error Identification, 1.3.1 | 🟡 Major | • `/tools/json-formatter` (`src/tools/json-formatter/JsonFormatterPage.tsx`) <br>• `/tools/regex-tester` (`src/tools/regex-tester/RegexTesterPage.tsx`) <br>• likely every converter using `src/shared/ui/convert.tsx` (its error `<p role="alert">` at line 209 has no id) | Give the error element an id (`useId()`) and set `aria-describedby={error ? errId : undefined}` on the field next to `aria-invalid`. In `convert.tsx`, pass the id from the error `<p>` to the input `CodeArea`. |
| 18 | The StatusStrip live region wraps the whole strip, including the "Local processing" badge, so every status change reads extra text. ShareButton's own `aria-live` span also announces "Share". | 4.1.3 Status Messages (noise) | 🟢 Minor | All tools (`src/shared/ui/page.tsx:35`, `src/shared/ui/ShareButton.tsx:52`) | Move `aria-live` or `role="status"` onto the status `<p>` only. In ShareButton, keep the live region for "Link copied" only, in a separate always-mounted `sr-only` span. |
| 19 | The theme ignores `prefers-color-scheme`: with OS dark mode and nothing stored, the site renders light (verified). This isn't a WCAG failure, but it matters for users with light sensitivity. | Advisory (1.4.8 spirit) | 🟢 Minor | `src/shared/utils/theme.ts` (`getStoredTheme`) | When no value is stored, fall back to `matchMedia('(prefers-color-scheme: dark)').matches`. Keep the toggle as an override. |

#### Robust

| # | Issue | WCAG Criterion | Severity | Where (routes/components with file paths) | Recommendation (concrete code-level fix) |
|---|---|---|---|---|---|
| 20 | `aria-label="Highlighted matches"` sits on a `<pre>` with no role. The label is prohibited there, so it's ignored. The `<pre>` is also a scroll container (`overflow-auto`) with no keyboard access. axe `aria-prohibited-attr`: 8 nodes. | 4.1.2 Name, Role, Value | 🟡 Major | `/tools/regex-tester`, default and error states (`src/tools/regex-tester/RegexTesterPage.tsx:60`) | Use `<pre role="region" aria-label="Highlighted matches" tabIndex={0}>`, or wrap it in `<section aria-label="Highlighted matches">` with `tabIndex={0}` on the scroller. |
| 21 | Markdown preview task-list checkboxes (`<input type="checkbox" disabled>`) have no accessible name. axe `label` (critical): 4 nodes. | 4.1.2, 1.3.1 | 🟡 Major | `/tools/markdown-editor` (`src/tools/markdown-editor/features/sanitize.ts:53`) | When the sanitizer keeps a GFM checkbox, set `aria-label` to the list item's text (`el.parentElement.textContent.trim()`), or add an `id` to the item text and `aria-labelledby`. |
| 22 | The favourite star has a fixed `aria-label="Add to favorites"` plus `aria-pressed`. Screen readers therefore hear "Add to favorites, toggle button, pressed" after it's added, and the 46 home cards all share one name. The per-tool `title` is ignored because `aria-label` wins. | 4.1.2, 2.4.6 Headings and Labels | 🟡 Major | Home (46 instances) and every tool page header (`src/shared/ui/FavoriteButton.tsx:24`) | Use `aria-label={`Favorite ${tool.name}`}` with `aria-pressed={on}`, so the state comes from `pressed` and not from the verb. Drop the redundant `title`, or make it match. |
| 23 | Command palette options put the metadata before the name: the accessible name is "Tool · Developer JSON Formatter Format, validate and minify JSON". Every option starts with the same words. | 4.1.2 / 2.4.6 (verbosity) | 🟢 Minor | Palette on every route (`src/shared/ui/CommandPalette.tsx`) | Set `aria-labelledby` on each option to the title span and `aria-describedby` to the meta and summary spans. Alternatively, mark the eyebrow `aria-hidden` and append "(Tool, Developer)" via `sr-only` after the title. |
| 24 | The modals (palette, Learn drawer, shortcuts dialog) set `aria-modal="true"` and trap Tab. The rest of the page isn't `inert`: `main` isn't inert or `aria-hidden` (verified). Some screen reader and browser pairs let the virtual cursor wander behind the dialog. The shortcuts dialog was also slow to report visible (it animates in), although focus was inside it. | 4.1.2 / 2.4.3 | 🟢 Minor | `src/shared/hooks/useModal.ts`, `src/shared/ui/CommandPalette.tsx`, `src/shared/ui/ShortcutsHelp.tsx`, `src/learn/LearnLayout.tsx` | In `useModal`, set `inert` on the app root's other children while open and remove it on close. Alternatively, portal the dialog outside `#root` and set `document.getElementById('root').inert = true`. |

### Color Contrast Check

Tokens resolved in the browser from `src/styles/index.css` and Tailwind v4 defaults, using the WCAG relative-luminance formula.

| Element | Foreground | Background | Ratio | Required | Pass? |
|---|---|---|---|---|---|
| Body text (light) | slate-900 #1a221e | slate-50 #f6f6f2 | 15.01 | 4.5 | ✅ |
| Body text on card | slate-900 #1a221e | white | 16.26 | 4.5 | ✅ |
| Secondary text | slate-600 #535d56 | white / slate-50 | 6.85 / 6.32 | 4.5 | ✅ |
| Muted text | slate-500 #6e7770 | white | 4.63 | 4.5 | ✅ |
| Muted text / eyebrow nav (11.5 px caps) | slate-500 #6e7770 | slate-50 #f6f6f2 | **4.27** | 4.5 | ❌ |
| Muted text on chip / kbd / dt | slate-500 #6e7770 | slate-100 #eeefe9 | **4.00** | 4.5 | ❌ |
| Muted text on footer `bg-white/60` | slate-500 | #fbfbfa | **4.47** | 4.5 | ❌ |
| Hint / number text (light) | slate-400 #9ba39a | white | **2.59** | 4.5 | ❌ |
| Placeholder (light) | slate-400 #9ba39a | white | **2.59** | 4.5 | ❌ |
| Primary button label | primary-ink #1f3a2d | primary #dce3da | 9.43 | 4.5 | ✅ |
| Primary fill vs white card (boundary) | primary #dce3da | white | 1.31 | 3 (text-labelled button: advisory) | ⚠️ |
| Primary edge vs page | primary-edge #c2cebf | slate-50 | 1.51 | 3 (advisory) | ⚠️ |
| Link | emerald-700 #264d3d / emerald-600 #2f5f4b | white | 9.50 / 7.34 | 4.5 | ✅ |
| Accent text | emerald-500 #4a8062 | white | 4.61 | 4.5 | ✅ |
| Focus ring (light) | #4a8062 | slate-50 / white | 4.26 / 4.61 | 3 | ✅ |
| Input border | slate-200 #e2e4dc | white | **1.28** | 3 | ❌ |
| Input border / secondary-button ring / checkbox | slate-300 #cdd1c6 | white | **1.55** | 3 | ❌ |
| Tab underline (active) | slate-900 | white | 16.26 | 3 | ✅ |
| Badge neutral | slate-700 #3d4741 | slate-100 | 8.34 | 4.5 | ✅ |
| Badge green | emerald-800 #1f3e32 | emerald-50 #eef3ee | 10.42 | 4.5 | ✅ |
| Badge amber | amber-800 #973c00 | amber-50 #fffbeb | 6.84 | 4.5 | ✅ |
| Badge red | red-800 #9f0712 | red-50 #fef2f2 | 7.64 | 4.5 | ✅ |
| Badge blue | sky-800 #00598a | sky-50 #f0f9ff | 7.05 | 4.5 | ✅ |
| Badge violet | violet-800 #5d0ec0 | violet-50 #f5f3ff | 8.36 | 4.5 | ✅ |
| Error text | red-700 #c10007 | white | 6.42 | 4.5 | ✅ |
| Alert / warning box | red-900 on red-50 / amber-900 on amber-50 | — | 9.16 / 8.73 | 4.5 | ✅ |
| JWT header / signature segment | rose-600 #ec003f / sky-600 #0084d1 | slate-50 | **4.17 / 3.71** | 4.5 | ❌ |
| Disabled button (light) | slate-500 | slate-200 | 3.61 | exempt | — |
| **Dark:** body | slate-100 #eeefe9 | slate-950 #0f1411 | 16.09 | 4.5 | ✅ |
| **Dark:** secondary | slate-400 #9ba39a | slate-900 / slate-950 / slate-800 | 6.27 / 7.18 / 5.17 | 4.5 | ✅ |
| **Dark:** muted | slate-500 #6e7770 | slate-900 #1a221e | **3.51** | 4.5 | ❌ |
| **Dark:** muted / eyebrow | slate-500 | slate-950 | **4.02** | 4.5 | ❌ |
| **Dark:** link | emerald-400 #74a487 | slate-900 / slate-950 | 5.73 / 6.56 | 4.5 | ✅ |
| **Dark:** primary fill vs card | primary | slate-900 | 12.42 | 3 | ✅ |
| **Dark:** focus ring | #4a8062 | slate-950 / slate-900 | 4.04 / 3.53 | 3 | ✅ |
| **Dark:** input border | slate-700 #3d4741 / slate-800 | slate-900 | **1.68** / lower | 3 | ❌ |
| **Dark:** input border (alt) | slate-600 #535d56 | slate-900 | **2.38** | 3 | ❌ |
| **Dark:** placeholder | slate-400 | slate-900 | 6.27 | 4.5 | ✅ |
| **Dark:** badges (neutral/green/amber/red/blue/violet) | *-300 | *-950 / slate-800 | 8.64 / 7.89 / 10.37 / 8.42 / 8.34 / 8.21 | 4.5 | ✅ |
| **Dark:** error | red-400 #ff6467 | slate-900 | 5.63 | 4.5 | ✅ |
| **Dark:** Cron pressed value | slate-950 | emerald fill #4a8062 | **4.03** | 4.5 | ❌ |
| **Dark:** skip link (focused) | slate-100 #eeefe9 | white | **1.16** | 4.5 | ❌ |
| **Dark:** disabled button | slate-400 | slate-700 | 3.72 | exempt | — |

**Proposed replacement values:**
- `--color-slate-500: #636c65`: 5.44 on white, 5.02 on slate-50, 4.70 on slate-100.
- `--color-field-edge: #848d85`: 3.43 on white, 3.16 on slate-50.
- Dark muted text moves to `slate-400`.

### Keyboard Navigation

Measured with Playwright's keyboard at 1280 px. Every Tab stop in the walks had a visible change on focus (outline, or border plus box-shadow for fields). None was hidden, and no traps were found outside modals.

| Element | Tab Order | Enter/Space | Escape | Arrow Keys |
|---|---|---|---|---|
| Skip link (all pages) | ✅ First stop; visible on focus; Enter then Tab lands on the first control in `main` | ✅ Enter follows | n/a | n/a |
| Header (logo, Tools, Learn, Blog, Search, theme) | ✅ Logical, left to right | ✅ | n/a | n/a |
| Search button → command palette | ✅ Opens with Enter and Ctrl+K; focus goes to the combobox; Tab stays inside the dialog | ✅ Enter opens the active option | ✅ Closes; focus returns to the Search button | ✅ ↑/↓ move `aria-activedescendant` |
| Home search, category chips, cards, favourite stars | ✅ Search, then 7 chips, then card or star pairs in reading order | ✅ | n/a | ⚠️ Chips are separate Tab stops (fine) |
| Tool header (All tools, Share, Favorite) | ✅ | ✅ | n/a | n/a |
| Segmented controls (Format/Minify/Validate, indent, direction) | ✅ Each button is a Tab stop | ✅ Space toggles `aria-pressed` | n/a | — Not used (acceptable for `role="group"` of toggle buttons) |
| Select (`src/shared/ui/Select.tsx`, tested on CSV ↔ JSON) | ✅ | ✅ Space opens; Enter selects and closes | ✅ Closes; focus stays on the trigger | ✅ ↓ opens and moves; Home/End and type-ahead are in code |
| Tabs (`src/shared/ui/Tabs.tsx`: Clean Image, Image to Base64, problems) | ✅ Roving `tabIndex` (only the active tab is tabbable) | ✅ | n/a | ✅ ←/→ from code review; no Home/End (minor). Only shown after a file loads, so not driven live. |
| JSON / CSV input textareas | ✅ Tab leaves the field (no trap) | n/a | n/a | n/a |
| Lesson code editor (`CodeExampleBlock`) | ⚠️ Tab indents; Esc then Tab leaves, but this isn't documented (#11) | ✅ Ctrl/⌘+Enter runs | ⚠️ Releases Tab (undocumented) | n/a |
| Cron Builder value grid | ⚠️ 60 or 24 separate stops (143 in total on the page) | ✅ | n/a | — None (#14) |
| Image Compressor (Choose images, Format select, quality slider, Select images) | ✅ Logical | ✅ The hidden file input is opened by buttons | n/a | ✅ Native range slider |
| Learn mobile drawer | ✅ Focus moves to Close; Tab is trapped | ✅ Enter on Browse opens it | ✅ Closes; focus returns to Browse | n/a |
| Keyboard-shortcuts dialog (`?` or footer button) | ✅ Focus inside | ✅ | ✅ Closes; focus returns to the footer button | n/a |
| `<details>` interview answers | ✅ | ✅ Enter opens; Space toggles | n/a | n/a |
| Learn topic page | ⚠️ About 50 sidebar stops before the lesson (first lesson control at stop 59) (#13) | ✅ | n/a | n/a |
| Footer (multi-column tool lists) | ✅ Column by column (upward jumps between columns are expected) | ✅ | n/a | n/a |
| Scrollable `<pre>`, `<figure>` and code boxes | ❌ Not focusable (#10, #20) | n/a | n/a | ❌ Can't scroll by keyboard |

### Screen Reader

From Playwright `ariaSnapshot()`, which reflects Chromium's accessibility tree.

| Element | Announced As (from accessible name/role via Playwright's accessibility tree) | Issue |
|---|---|---|
| Header | `banner` › link "Zykit", `navigation "Main"` › links "Tools", "Learn", "Blog", button "Search" (with `aria-keyshortcuts`), button "Switch to dark mode" | ✅ The nav text is uppercased with CSS; the DOM text is mixed case |
| Breadcrumb | `navigation "Breadcrumb"` › list › link "All tools", listitem "JSON Formatter" (`aria-current="page"`) | ✅ |
| Tool H1 | heading level 1 "Make JSON readable." (with emphasis) | ✅ One per page |
| Share button | button "Copy share link" (visible "Share") | ✅ Label-in-name holds. The adjacent `aria-live` span announces "Share" (#18) |
| Favorite star | button "Add to favorites" [pressed] | ❌ Same name on every card; the verb contradicts the state (#22) |
| Segmented control | `group "Action"` › button "Format" [pressed], "Minify", "Validate" | ✅ |
| JSON input | textbox "Input JSON", placeholder `{"paste": "your JSON here"}`; in error: `aria-invalid="true"` | ❌ Error not linked with `aria-describedby` (#17) |
| Cron expression | textbox "Cron expression", `aria-describedby="cron-description"`; error in `role="alert"` | ✅ The model pattern for other tools |
| Select | combobox "Presets" / "Format", collapsed, `aria-haspopup=listbox`, `aria-controls` points to a hidden listbox | ✅ (axe flags `aria-controls` to a hidden element for review) |
| Command palette | dialog "Search Zykit" (`aria-modal`) › combobox "Search tools, lessons and posts" [expanded], status "14 results", listbox "Results" › group "Tools" › option "Tool · Developer JSON Formatter …" [selected] | ⚠️ Metadata is read before the name (#23); the background isn't inert (#24) |
| Learn drawer | dialog "Browse Learn" (`aria-modal`), button "Close navigation" | ✅ |
| Lesson example | textbox "JavaScript code: Reacting to a click"; region "Example output"; region "Console output" (focusable); iframe "Sandbox page for this example" | ✅ The Tab behaviour needs a hint (#11) |
| Status strip | `aria-live="polite"` on the whole strip: "Invalid JSON: … LOCAL PROCESSING" | ⚠️ Extra text is announced (#18) |
| Regex matches | `<pre aria-label="Highlighted matches">`, where the label is ignored | ❌ (#20) |
| Markdown preview checkboxes | checkbox (no name), disabled | ❌ (#21) |
| Image previews | img "Before" / "After" labels, "<name> image preview", "Home screen icon preview"; decorative thumbnails `alt=""` | ✅ |

### Priority Fixes

1. **Fix the muted-text token.** Set `--color-slate-500: #636c65` in `src/styles/index.css`, which clears about 1,690 light-theme `color-contrast` nodes on every route. In the same pass, change `dark:text-slate-500` to `dark:text-slate-400` and give bare `text-slate-500` eyebrows a `dark:text-slate-400` variant (#1, #2).
2. **Fix the dark-theme skip link.** Add `focus:text-slate-900 dark:focus:bg-slate-900 dark:focus:text-white` in `src/app/Layout.tsx` (#4).
3. **Make scrollable code and diagram boxes keyboard-reachable.** Add `tabIndex={0}` with a role and label to `CodeBlock`, `Diagram`, `CodeExampleBlock`'s line code and the Regex matches `<pre>` (#10, #20). Doing it in `shared/ui/tool.tsx` fixes it everywhere.
4. **Link error messages to fields.** Add `aria-describedby` to the error on JSON Formatter, Regex Tester and `shared/ui/convert.tsx`, following Cron Builder's pattern (#17).
5. **Add a field-edge token.** Use it for input, textarea, Select and checkbox borders to meet 3:1 (#5). Move placeholders and informative numbers off `slate-400` (#3).
6. **Document the lesson editor's Esc-then-Tab escape** in its hint and in the shortcuts dialog (#11).
7. **Fix the FavoriteButton name.** Use `Favorite <tool>` with `aria-pressed` (#22). Label the Markdown preview checkboxes in `sanitize.ts` (#21).
8. **Minor items:**
   - coarse-pointer target sizes in `Button`, `Segmented`, header nav and breadcrumb (#12)
   - JWT and opacity text colours (#6–8)
   - StatusStrip live-region scope (#18)
   - `inert` background in `useModal` (#24)
   - palette option naming (#23)
   - Learn "Skip to lesson" link (#13)
   - Cron value-grid roving focus (#14)
   - stronger field focus ring (#15)
   - new-tab warnings (#16)
   - `prefers-color-scheme` default (#19)

### What automated testing can't confirm

- **Real screen readers.** The accessibility tree shows names and roles, not how VoiceOver (macOS and iOS Safari), NVDA or JAWS (Windows Chrome and Firefox) and TalkBack actually speak and navigate. Testing on those is still needed for:
  - live-region timing and verbosity (StatusStrip, palette result counts, copy confirmations)
  - `aria-activedescendant` announcements in the palette and Select
  - whether the virtual cursor escapes `aria-modal` dialogs without `inert`
  - reading of the coloured JWT segments and the diff output
  - the sandbox iframe
- **Meaning and quality.** Whether alt text, labels, headings and error messages make sense, including "trailing comma?" hints and cron descriptions, needs human judgement.
- **Contrast over images and gradients.** axe left 162 `color-contrast` nodes as "needs review": text over translucent layers, `backdrop-blur` and images, plus the checkerboard and dotted previews.
- **Real zoom and magnifiers.** Reflow was simulated with small viewports and a text-spacing stylesheet. Real browser zoom (Ctrl + / Cmd +), iOS text-size settings, Windows High Contrast / forced colours (`forced-colors: active`, where Tailwind rings and box-shadows vanish) and screen magnifiers weren't tested.
- **Other input methods.** Voice control (label-in-name for every button), switch access and sticky-keys use of shortcuts such as `?` and Ctrl+K weren't tested.
- **Motion and timing.** Only CSS animations and transitions were sampled under reduced motion. Scroll-into-view behaviour and any JavaScript-driven animation, such as the HTTP Status smooth scroll, which respects `matchMedia` in code, need a manual pass.
- **Tool states not driven here:** image-tool results after a real decode, Clean Image tabs, the before/after slider, the Certificate Inspector with a file, and the JS Runner under load.
- **Unbuilt tools.** The six scaffolded batch-5 tools are excluded. `e2e/a11y.spec.ts` picks them up automatically once their `accent="TODO"` placeholder is gone.

**Re-running the audit.**

1. Build with `npx vite build --outDir /private/tmp/claude-501/a11y-build --emptyOutDir`.
2. Run `e2e/a11y.spec.ts` with a Playwright config that serves that folder, as the temporary `playwright.a11y.config.ts` did. It used `testMatch: /a11y\.spec\.ts/`, `webServer: npx vite preview --outDir … --port 4355`, `actionTimeout: 10_000`, and `outputDir: /private/tmp/claude-501/a11y-results`.
3. Set `A11Y_STRICT=1` to make the axe scans fail on violations.
