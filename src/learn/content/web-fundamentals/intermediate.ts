import type { Topic } from "../../types/content";

export const webFundamentalsIntermediateTopics: Topic[] = [
  {
    id: "css-layout",
    title: "CSS Layout (Flexbox & Grid)",
    level: "intermediate",
    description:
      "Two modern CSS tools for arranging elements on a page, without old workarounds like floats.",
    explanation: `
Putting elements side by side, centering something both ways, or making
boxes evenly sized used to be hard in CSS. Developers bent tools that
weren't built for layout, most famously \`float\` (meant for wrapping text
around an image), and got fragile side effects.

CSS now has two tools designed for layout:

- **Flexbox** arranges items in one direction, a row or a column. It's great for nav bars, toolbars, or centering a few items.
- **Grid** arranges items in two dimensions, rows *and* columns at once. It's great for overall page layout, image galleries, or dashboards with defined regions.

Both work the same way. You turn on the layout mode on a **container**,
and its direct children become items arranged by your rules (spacing,
alignment, size, order) instead of pixel positions you calculate by hand.
  `.trim(),
    analogy:
      "Flexbox is like arranging books on one shelf: you can spread them out or squeeze them together, one line at a time. Grid is a bookcase with rows and columns, where one book can even span several slots.",
    examples: [
      {
        title: "Flexbox: a simple row layout",
        code: `.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}`,
        explanation:
          "Flex layout lines up the toolbar's children in a row. justify-content spaces them along the main axis, and align-items centers them on the cross axis. No manual positioning needed.",
        walkthrough: [
          { code: "display: flex;", explanation: "Makes this a flex container. Its direct children become flex items, in a row by default." },
          { code: "justify-content: space-between;", explanation: "Puts the first item at the left edge and the last at the right, with even space between them." },
          { code: "align-items: center;", explanation: "Centers the items on the other axis (vertically, in a row), even if their heights differ." },
        ],
      },
      {
        title: "Grid: a two-dimensional layout",
        code: `.page {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: auto 1fr auto;
}

.sidebar { grid-column: 1; grid-row: 2; }
.content { grid-column: 2; grid-row: 2; }`,
        explanation:
          "This sets up a fixed-width sidebar column and a flexible content column, plus rows for header, body, and footer. Then it places specific elements into specific cells.",
      },
    ],
    howItWorks: `
Setting \`display: flex\` or \`display: grid\` switches that element's
children from normal block-by-block flow to a dedicated layout algorithm.

Flexbox works out how much space each item needs along one axis, then
shares out any extra or missing space by your rules. Grid first builds an
explicit grid of rows and columns, then places each child into a cell or
a span of cells.
  `.trim(),
    whyItExists: `
Older layout tools weren't designed for general page content. Using them
meant workarounds (clearing floats, fixed pixel widths, absolute
positioning tricks) that broke easily when content changed. Flexbox and
Grid were built for layout, so patterns like equal-height columns or
centered content can be written directly.
  `.trim(),
    whenToUse: `
Use Flexbox for items in one row or column: a nav bar, a button group,
centering one thing inside another. Use Grid when you need rows and
columns at once: a page layout, a photo gallery, or anything that must
line up in both directions.
  `.trim(),
    whenNotToUse: `
Simple inline text flow (a paragraph, a sentence with a link) needs
neither; normal document flow handles it. Using Grid for something that's
only ever one row or column adds complexity where Flexbox is simpler.
  `.trim(),
    commonMistakes: [
      "Using float-based layout out of habit for new work instead of Flexbox or Grid.",
      "Mixing up Flexbox's one-axis model with Grid's two-axis model, and forcing complex two-dimensional layouts out of Flexbox alone.",
      "Forgetting that container properties (like justify-content) go on the container, while item sizing properties (like flex-grow) go on the children.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use Flexbox to center three boxes horizontally in a container, with even spacing between them." },
      { difficulty: "Medium", prompt: "Use CSS Grid to build a page layout with a header, a fixed-width sidebar, and a flexible main content area." },
      { difficulty: "Hard", prompt: "Rebuild a float-based layout with Flexbox or Grid, and explain which workarounds you could remove." },
    ],
    interviewQuestions: [
      { question: "What's the core difference between Flexbox and Grid?", answer: "Flexbox arranges items along a single axis (a row or a column). Grid arranges items across two axes (rows and columns) at once." },
      { question: "What CSS property turns an element into a flex or grid container?", answer: "display: flex for Flexbox, or display: grid for Grid, set on the parent whose children should be arranged." },
      { question: "Why were floats historically used for layout, and what was the problem?", answer: "Floats were designed for wrapping text around images, not page layout. Using them for layout needed workarounds like manually clearing floats so containers didn't collapse." },
      { question: "In Flexbox, what are the 'main axis' and 'cross axis', and how do justify-content and align-items relate to them?", answer: "The main axis follows flex-direction (row by default); the cross axis is perpendicular to it. justify-content aligns items along the main axis, and align-items along the cross axis." },
      { question: "If you switch `flex-direction` from `row` to `column`, what happens to the meaning of `justify-content` and `align-items`?", answer: "The main axis becomes vertical, so justify-content now controls vertical spacing and align-items controls horizontal alignment. They're defined relative to the main and cross axes, not to horizontal and vertical." },
      { question: "What does the shorthand `flex: 1` expand to, and what does each part control?", answer: "`flex-grow: 1; flex-shrink: 1; flex-basis: 0%`. flex-grow lets the item grow into free space, flex-shrink lets it shrink when space is tight, and a flex-basis of 0% treats its starting size as zero, so space is shared purely by the grow ratio." },
      { question: "What's the difference between `align-items` and `align-content` in Flexbox?", answer: "align-items aligns items along the cross axis within their line. align-content aligns whole lines along the cross axis when there's extra space and multiple lines (via flex-wrap: wrap). It has no visible effect on a single-line container." },
      { question: "Why might `justify-content: center` appear to do nothing on a flex container?", answer: "If the items grow to fill all the space (e.g. flex: 1 on every item), there's no leftover space on the main axis for justify-content to distribute." },
      { question: "What's the difference between the `fr` unit in Grid and using percentages for column widths?", answer: "`fr` shares out the space left *after* fixed-size tracks (px values or content-sized tracks) are taken. Percentages are always a fraction of the container's full size, so mixing fixed columns and percentages can overflow if they add up to more than 100%." },
      { question: "Given `grid-template-columns: repeat(3, 1fr);` and one item with `grid-column: span 2`, what happens?", answer: "That item takes two of the three equal columns in its row. The other items flow into the remaining space, wrapping to new rows as needed through auto-placement." },
      { question: "What does `grid-template-areas` do, and why is it useful?", answer: "It lets you name grid regions with a visual, ASCII-like map of strings, then place children into them with `grid-area` instead of tracking line numbers. The layout becomes much easier to read at a glance." },
      { question: "What's the difference between `justify-content` and `justify-items`/`justify-self` in Grid?", answer: "justify-content positions the grid's tracks as a whole within the container (when they don't fill it). justify-items/justify-self align one item *within its own cell* along the inline (row) axis, regardless of how the tracks are positioned." },
      { question: "How are absolutely positioned children treated inside a flex or grid container?", answer: "They're taken out of normal flow. They don't take part in the flex or grid algorithm, get no cell or main-axis space, and are positioned relative to their containing block as usual." },
      { question: "You set `align-items: center` on an outer flex container, but its content still isn't vertically centered — what's a likely cause?", answer: "align-items centers within the height the container *actually has*. If the container is only as tall as its content (no explicit height, and no parent stretching it), there's no extra space to center within." },
      { question: "What is `flex-basis`, and how does it interact with `flex-grow` and `flex-shrink`?", answer: "flex-basis sets an item's starting size along the main axis. flex-grow and flex-shrink then share out any extra or missing space (compared to that basis) by each item's factor." },
      { question: "When would you use `flex-shrink: 0` on a flex item?", answer: "When the item should keep its natural size even if the container runs out of space, for example so an icon or fixed-width sidebar isn't squeezed by other flexible items." },
      { question: "Given `.item1 { flex: 1 }` and `.item2 { flex: 2 }` inside the same flex container, how is extra space divided between them?", answer: "In proportion to the grow factors: item2 gets twice as much of the extra space as item1. With equal starting sizes, item2 ends up about twice as wide (or tall, in a column)." },
      { question: "Why does adding `min-width: 0` (or `min-height: 0`) to a flex item sometimes fix an overflow or truncation bug?", answer: "Flex items default to `min-width: auto`, so they won't shrink below their content's min-content size. Long unbroken text or a wide child can then overflow the container even with flex-shrink set. min-width: 0 removes that floor, so the item can shrink and text-overflow/ellipsis and wrapping can work." },
      { question: "What's the difference between the explicit and implicit grid in CSS Grid?", answer: "The explicit grid is the tracks you define with grid-template-columns/grid-template-rows. If items land outside it (through auto-placement or line numbers beyond it), the browser creates implicit tracks for them, sized by grid-auto-rows/grid-auto-columns (auto by default)." },
      { question: "What does `grid-auto-flow: dense` change about item placement?", answer: "By default, auto-placement never goes back: a gap too small for the current item stays empty. `dense` lets later items fill earlier gaps, packing the grid tighter but possibly showing items out of source order." },
      { question: "When would you use `repeat(auto-fit, minmax(200px, 1fr))` instead of a fixed `repeat(4, 1fr)`?", answer: "When the column count should adapt to the space. It creates as many columns of 200px or wider as fit, then stretches them to fill leftover space, giving a responsive grid with no media queries." },
      { question: "In a 900px-wide container with `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));`, how many columns are created?", answer: "Four columns of 225px each. Four 200px tracks fit in 900px (a fifth would need 1000px), and the fr unit stretches them equally to fill the rest." },
      { question: "What does the `order` property do, and what's an important limitation of it?", answer: "It changes the *visual* order of flex or grid items without changing the HTML. The DOM order stays the same, so tab order and screen reader order still follow the markup and may no longer match what's on screen." },
      { question: "What's the difference between `gap` and using margins to space out flex or grid items?", answer: "gap adds space only *between* items, not at the container's outer edges. Margins need overrides like :first-child/:last-child to avoid extra space at the edges; gap needs none." },
      { question: "Why can a flex or grid item respond to `z-index` even without `position: relative` or `position: absolute` set on it?", answer: "Flex and grid items honor z-index (and order) for stacking even with `position: static`. Ordinary block elements ignore z-index unless their position is something other than static." },
      { question: "Why do flex items with different content heights end up the same height inside a row by default?", answer: "align-items defaults to `stretch`, which stretches each item to the container's cross-axis size unless it has an explicit height or an align-self override. You get equal-height columns for free, which float layouts needed hacks for." },
      { question: "What happens to flex items when the container has `flex-wrap: nowrap` (the default) and they don't all fit on one line?", answer: "They shrink (by their flex-shrink factor) to fit the one line. If they can't shrink enough, they overflow the container, because wrapping is off." },
      { question: "What problem does CSS Grid's `subgrid` value solve?", answer: "A nested grid normally has its own tracks, so its rows and columns don't line up with the parent's. `subgrid` lets the nested grid use its parent's track sizes, so its content aligns with the outer grid without manually matching sizes." },
      { question: "Why can forcing a two-dimensional layout out of Flexbox alone become awkward?", answer: "Flexbox handles one axis at a time. Wrapped items form new lines, but items in different lines don't align with each other the way Grid's rows and columns do. Getting true row/column alignment (a calendar, a dashboard) needs extra wrappers or fixed widths that Grid doesn't." },
      { question: "In Grid, what determines which cell an item lands in if you don't set `grid-column`/`grid-row` on it?", answer: "Auto-placement puts it in the next free cell, following `grid-auto-flow` (row by row by default, or column by column with `grid-auto-flow: column`). It creates implicit tracks if the defined ones run out." },
    ],
    prerequisites: ["css-basics"],
    relatedTopics: ["css-basics", "responsive-design"],
    keywords: ["flexbox", "css grid", "layout", "css layout", "justify-content", "align-items"],
  },
  {
    id: "responsive-design",
    title: "Responsive Design",
    level: "intermediate",
    description:
      "Build one page that looks and works well on every screen size, from phones to large monitors.",
    explanation: `
A page built for a large desktop monitor often breaks on a phone: text
too small to read, content spilling off the screen, layouts that assume
far more width than exists. The same page gets viewed on everything from
small phones to wide displays, so it has to adapt.

**Responsive design** means building a page whose layout and styling
adjust to the screen's size (and other traits) instead of assuming one
fixed size. The main CSS tool is the **media query**: a rule that says
"only apply these styles when the screen matches a condition," usually a
minimum or maximum width.

A related idea is **mobile-first**: write base styles for the smallest
screen, then use media queries to *add* complexity as more space becomes
available. The opposite, designing for desktop and patching things down
for small screens later, tends to produce messier CSS. Starting small
gives simpler, sturdier CSS.
  `.trim(),
    analogy:
      "It's like a letter that reformats itself for the paper it's printed on: one column and large text on a small card, several columns and smaller text on a full sheet, with the same words either way.",
    examples: [
      {
        title: "A basic media query",
        code: `.container {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .container {
    flex-direction: row;
  }
}`,
        explanation:
          "On small screens, items stack vertically by default. Once the screen is at least 768px wide, the media query switches the layout to a row.",
        walkthrough: [
          { code: "flex-direction: column;", explanation: "The mobile-first default: items stack in one column, which fits a narrow screen." },
          { code: "@media (min-width: 768px) {", explanation: "These styles only apply when the viewport is at least 768 pixels wide." },
          { code: "flex-direction: row;", explanation: "On wider screens, the same items sit in a row to use the extra space." },
        ],
      },
      {
        title: "A responsive viewport setup",
        code: `<meta name="viewport" content="width=device-width, initial-scale=1">`,
        explanation:
          "Without this tag in the HTML head, mobile browsers often render the page at desktop width and shrink it to fit, making text tiny. The tag tells the browser to use the device's real width from the start.",
      },
    ],
    howItWorks: `
The browser always knows the width (and other traits) of its viewport,
the visible area of the page. Media queries are checked against it, and
rules inside a matching query apply on top of, or instead of, the base
styles.

When the window or device orientation changes, the browser re-checks the
queries and updates the styles immediately, with no reload.
  `.trim(),
    whyItExists: `
People browse on devices with wildly different screen sizes, not mostly
one kind of desktop monitor. Building and maintaining separate "mobile"
and "desktop" pages was expensive and error-prone. One page that adapts
through CSS is far easier to maintain and keeps content consistent.
  `.trim(),
    whenToUse: `
Use responsive techniques for almost any public page, since you rarely
control the device or window size. Mobile-first helps most when content
and priorities really change with available space, not just visual size.
  `.trim(),
    whenNotToUse: `
An internal tool used only on one known, fixed-size screen (like a kiosk)
may not need full responsive treatment. Even then it rarely hurts, so
responsive design is close to a default for anything opened in a regular
browser.
  `.trim(),
    commonMistakes: [
      "Forgetting the viewport meta tag, so mobile browsers render the page at a shrunk-down desktop width.",
      "Designing desktop-first and patching for mobile afterward, which bloats the CSS with overrides.",
      "Testing only by resizing a desktop browser window, without checking real or emulated mobile devices.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Add a media query that changes a page's background color when the screen is narrower than 500px." },
      { difficulty: "Medium", prompt: "Build a mobile-first navigation bar that stacks links vertically by default and switches to a row above 768px." },
      { difficulty: "Hard", prompt: "Convert a desktop-only layout to mobile-first responsive CSS. List each media query you added and why." },
    ],
    interviewQuestions: [
      { question: "What is a media query?", answer: "A CSS rule that applies a block of styles only when the viewport matches some condition, most commonly a minimum or maximum width." },
      { question: "What does 'mobile-first' mean in responsive design?", answer: "Writing base CSS for the smallest screen, then using media queries to add complexity and rearrange the layout as space grows, instead of starting from desktop and shrinking down." },
      { question: "Why is the viewport meta tag important for responsive design?", answer: "Without it, many mobile browsers render the page at a wide, desktop-like width and scale it down, so text and layout look too small. The tag makes the browser use the device's real width." },
      { question: "What's the difference between a `min-width` and a `max-width` media query, and which fits a mobile-first approach?", answer: "A min-width query applies once the viewport is at least that wide, layering enhancements on base styles. That fits mobile-first: unqueried styles target the smallest screens and min-width queries add to them. A max-width query applies when the viewport is at most that wide, the usual desktop-first pattern for shrinking things down." },
      { question: "If two media queries both match the current viewport and set different values for the same property, which one wins?", answer: "Normal cascade rules apply: with equal specificity, the later rule in the source wins. Which query's range is narrower doesn't matter, so the order of queries in the stylesheet does." },
      { question: "Why are relative units like `rem`, `em`, `%`, and `vw`/`vh` generally preferred over fixed `px` in responsive design?", answer: "They scale with something else (the root font size, a parent's size, or the viewport), so text and spacing adjust when the user's font-size setting or screen size changes. px values stay fixed." },
      { question: "What's the difference between `rem` and `em`, and what's a common gotcha with `em`?", answer: "rem is relative to the root (`html`) font size, so it's the same everywhere. em is relative to the *current* element's font size, so nested elements using em for font-size compound, each level multiplying the last. Deeply nested text can end up much larger or smaller than expected." },
      { question: "What is a 'breakpoint' in responsive design, and how should you choose one?", answer: "It's the viewport width where a media query changes the layout. Choose breakpoints where your content starts to look cramped or awkward, not at popular device widths. Device sizes keep changing; content-based breakpoints stay useful." },
      { question: "What do `max-width: 100%` and `height: auto` do for images in a responsive layout?", answer: "max-width: 100% stops an image from getting wider than its container, so it shrinks on narrow screens instead of overflowing. height: auto keeps the aspect ratio as the width changes, so it isn't stretched or squashed." },
      { question: "An image has `width: 100%` but still overflows its container on a narrow screen — what's a likely cause?", answer: "The container itself may be too wide, for example because of a fixed min-width, or because `box-sizing` isn't border-box and padding pushes it wider. The image is correctly filling 100% of a container that's already too wide." },
      { question: "What's the practical difference between using `srcset`/`sizes` versus just scaling one large image down with CSS?", answer: "srcset lets the browser pick and download an image file sized for the actual display size and device pixel ratio, so a phone downloads a smaller file. CSS-only scaling always downloads the full-size image, wasting bandwidth on small devices." },
      { question: "What's the difference between 'responsive' (fluid) design and 'adaptive' design?", answer: "Responsive design uses fluid, relative-unit layouts and media queries that adjust continuously across sizes. Adaptive design serves a few fixed layouts for specific breakpoints and switches between them." },
      { question: "How does `box-sizing: border-box` help make responsive layouts more predictable?", answer: "By default, padding and border are added *on top of* the width, so a `width: 50%` element with padding ends up wider than 50%. border-box includes padding and border in width/height, so percentage and fluid widths behave as they look." },
      { question: "If content is hidden at a certain breakpoint with `display: none`, does that mean its resources (like an image) were never downloaded?", answer: "Not necessarily. CSS display rules don't stop the parser from requesting resources, so an `<img>` inside a hidden element may still be fetched. It's only skipped if loading is conditional, for example a `<picture>` element with media conditions, or lazy loading." },
      { question: "What's the difference between a media query and a container query?", answer: "A media query responds to the whole viewport's size. A container query (`@container`, with `container-type` set on an ancestor) responds to the size of a specific containing element. A component can then adapt to the space it's given, whatever the screen size, which helps when it's reused in places of different widths." },
      { question: "Given `.card-wrapper { container-type: inline-size; }` and a container query targeting it, what does the query actually measure?", answer: "The inline size (the width, in a normal horizontal writing mode) of `.card-wrapper` itself, not the viewport. A `.card` in a narrow sidebar and the same `.card` in a wide main column can render differently in the same browser window." },
      { question: "Why can testing responsiveness only by resizing a desktop browser window miss real problems?", answer: "It misses real mobile conditions: touch targets fine for a mouse but too small for a finger, device pixel ratios that affect image sharpness, slower networks, and mobile browser chrome or viewport quirks." },
      { question: "What does the CSS `clamp()` function do, and how is it commonly used in responsive typography?", answer: "clamp(min, preferred, max) uses the preferred value but never goes below min or above max. For type, something like `font-size: clamp(1rem, 2vw + 0.5rem, 2rem)` scales with the viewport while never getting unreadably small or too large." },
      { question: "A fixed-position header overlaps the top of the page content differently across screen sizes — how would you handle this responsively?", answer: "Reserve the header's height with padding or margin on the content below it (adjusted per breakpoint if the header's height changes). Or use `scroll-margin-top` on anchor targets so jumping to an anchor doesn't hide content under the header." },
      { question: "Even with relative units, media queries, and container queries in place, why is testing on real or emulated mobile devices still worth doing?", answer: "Those tools handle layout sizing, but real devices reveal what CSS can't reliably simulate: real touch interaction and target sizes, real network latency, on-screen keyboard behavior, and browser-specific rendering quirks that differ from a desktop dev tools simulation." },
    ],
    prerequisites: ["css-basics", "css-layout"],
    relatedTopics: ["css-layout", "web-performance-basics"],
    keywords: ["responsive design", "media queries", "mobile-first", "viewport", "breakpoints"],
  },
  {
    id: "browser-storage",
    title: "Browser Storage",
    level: "intermediate",
    description:
      "Ways a website can save small pieces of data in your browser so they're still there next visit.",
    explanation: `
Normally, everything a page holds in memory (JavaScript variables,
unsubmitted form input) disappears when you close the tab or navigate
away. Sometimes a site needs to remember things *across* visits: that
you're logged in, that you prefer dark mode, that you had three items in
a cart.

Browsers offer a few tools for this. The choice depends on how long the
data should last and who needs to see it:

- **Cookies** are sent automatically with every request to the server. That makes them the classic way to track a logged-in session.
- **localStorage** keeps data only in the browser, never sent to the server automatically. It lasts until something clears it.
- **sessionStorage** works like localStorage but is wiped when that tab is closed.

None of these is a full database. They're for small amounts of data,
stored on one device and browser.
  `.trim(),
    analogy:
      "A cookie is like a stamped hand at a venue: you show it at every counter (the server) so they recognize you. localStorage is a locker at home that stays packed until you empty it. sessionStorage is a locker at the venue, cleared out when you leave for the night.",
    examples: [
      {
        title: "localStorage vs. sessionStorage",
        code: `// Persists even after closing and reopening the browser
localStorage.setItem("theme", "dark");

// Cleared automatically once this tab is closed
sessionStorage.setItem("draftText", "Hello, world");

// Reading values back later
const theme = localStorage.getItem("theme");`,
        explanation:
          "Both use the same key-value API. localStorage data survives closing the browser; sessionStorage data disappears when the tab closes.",
        walkthrough: [
          { code: 'localStorage.setItem("theme", "dark");', explanation: "Saves a value under the key 'theme'. It's still there tomorrow, even after a browser restart." },
          { code: 'sessionStorage.setItem("draftText", "Hello, world");', explanation: "Saves a value for this tab's session only. Closing the tab erases it." },
          { code: 'localStorage.getItem("theme")', explanation: "Reads a stored value back, or returns null if the key was never set." },
        ],
      },
      {
        title: "A basic cookie",
        code: `document.cookie = "sessionId=abc123; max-age=3600";`,
        explanation:
          "Unlike localStorage or sessionStorage, this cookie is attached automatically to every later request this browser makes to the same site. That's how a server recognizes a returning user without any extra code.",
      },
    ],
    howItWorks: `
The browser stores cookies and adds them to the headers of every request
to the domain that set them. That's how a server recognizes the same
visitor across requests.

localStorage and sessionStorage stay in the browser. Nothing is sent to a
server automatically; JavaScript has to read and send the data if the
server needs it.

All three are scoped per origin, so one website generally can't read
another's stored data.
  `.trim(),
    whyItExists: `
Different problems need different lifetimes and visibility. A login
session needs the server to recognize you on every request, which is what
cookies were built for. A saved preference or draft only needs to live in
the browser, without adding data to every network request; that's what
localStorage and sessionStorage are for.
  `.trim(),
    whenToUse: `
- Cookies: the server needs the value on every request, like an authentication session.
- localStorage: data that should last across visits but only matters to the browser, like a saved theme.
- sessionStorage: short-lived, per-tab data that shouldn't outlive the visit, like a multi-step form in progress.
  `.trim(),
    whenNotToUse: `
None of these suit large amounts of data or anything sensitive that needs
strong protection. Anyone with access to the device can read them in the
browser's dev tools. Sensitive data, or data that must be shared reliably
across devices, belongs on the server in a real database.
  `.trim(),
    commonMistakes: [
      "Storing sensitive data like passwords in localStorage, where anyone with device or script access can read it.",
      "Expecting sessionStorage data to survive closing the tab, when it's designed not to.",
      "Putting lots of data in cookies, which slows down every request since cookies are sent with each one.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use localStorage to save a user's chosen theme, and load it back when the page reopens." },
      { difficulty: "Medium", prompt: "Build a simple multi-step form that saves progress in sessionStorage. Confirm the progress disappears after closing the tab." },
      { difficulty: "Hard", prompt: "Using a concrete scenario, explain why authentication sessions usually use cookies rather than localStorage." },
    ],
    interviewQuestions: [
      { question: "What's the key difference between cookies and localStorage?", answer: "Cookies are sent automatically with every request to the server that set them, which suits server-side session tracking. localStorage stays in the browser and is never sent automatically." },
      { question: "What's the difference between localStorage and sessionStorage?", answer: "Same API. localStorage lasts until explicitly cleared; sessionStorage is cleared when its tab closes." },
      { question: "Why shouldn't sensitive data be stored in localStorage?", answer: "It's plain, unencrypted storage that any script on the page, or anyone with the browser's dev tools, can read. It gives no real protection." },
      { question: "What are the typical size limits for localStorage/sessionStorage versus a single cookie?", answer: "localStorage and sessionStorage usually allow about 5-10MB per origin (it varies by browser). A single cookie is limited to about 4KB, and browsers also cap the number of cookies per domain." },
      { question: "Is the localStorage/sessionStorage API synchronous or asynchronous, and why does that matter?", answer: "Synchronous: every read and write blocks the JavaScript thread until it finishes. With small data you won't notice, but large values can briefly block the main thread and make the page feel unresponsive. That's one reason it's meant for small data." },
      { question: "When would you reach for IndexedDB instead of localStorage?", answer: "When you need much more data, structured or queryable data (not just string key-value pairs), or async access that doesn't block the main thread. IndexedDB has indexes, transactions, and much larger quotas, but a far more complex API." },
      { question: "If a site is open in two different browser tabs, do they share the same localStorage data? What about sessionStorage?", answer: "localStorage is shared by every tab and window of the same origin; a write in one is visible in the others right away. sessionStorage belongs to one tab/window, so each tab has its own, even for the same site." },
      { question: "Does duplicating an existing browser tab preserve its sessionStorage, and does opening a fresh tab to the same URL do the same?", answer: "Duplicating a tab copies its sessionStorage, because browsers treat it as continuing the same browsing context. A new tab opened to the same URL starts empty, since it's a new top-level browsing context." },
      { question: "If a user clears their browser's cookies, does that also clear localStorage?", answer: "Not necessarily. They're separate mechanisms, and whether 'clear cookies' also clears other site data depends on the setting chosen ('cookies only' versus 'all site data'). Don't assume clearing one cleared the other." },
      { question: "What does the `HttpOnly` flag on a cookie do, and why does it matter for security?", answer: "It stops JavaScript from reading or writing the cookie via `document.cookie`; only the browser's HTTP layer can use it. That blocks a common XSS attack where injected script tries to steal a session cookie, because the script can't see it." },
      { question: "What do the `Secure` and `SameSite` cookie attributes protect against?", answer: "Secure sends the cookie only over HTTPS, so it isn't exposed on unencrypted networks. SameSite limits whether the cookie is sent with cross-site requests, which helps block CSRF attacks that rely on the browser attaching cookies to requests from another site." },
      { question: "Why is an auth token often stored in a cookie rather than localStorage, from a security standpoint?", answer: "A cookie can be HttpOnly, so JavaScript can't see it and an XSS attack can't steal it. Anything in localStorage is readable by any script on the page, so one XSS hole anywhere on the site can leak the token." },
      { question: "What does 'same-origin' mean in the context of storage scoping?", answer: "Two URLs are same-origin only if protocol, host, and port all match. localStorage/sessionStorage are strictly scoped per origin (cookies use slightly different, host-based rules), so a script on one origin generally can't read another origin's data." },
      { question: "How can one open tab find out that another tab just changed a value in localStorage?", answer: "Listen for the `storage` event on `window`. The browser fires it in every *other* same-origin tab or window when localStorage changes, with the key, old value, and new value." },
      { question: "Why doesn't the `storage` event fire in the same tab that made the change?", answer: "It exists so other browsing contexts can react to changes they didn't make. The tab that wrote the value already knows it, so the spec only sends the event to other tabs and windows sharing that storage." },
      { question: "What does `localStorage.getItem(\"missingKey\")` return if that key was never set?", answer: "`null`, not `undefined`. Check for null (or use a falsy check) rather than undefined." },
      { question: "Why can localStorage only store strings, and how do you work around that to store objects?", answer: "The Web Storage API's get/setItem only take and return strings, by design. For structured data, `JSON.stringify()` before saving and `JSON.parse()` after reading." },
      { question: "What happens if you try to write more data than localStorage's quota allows?", answer: "`setItem` throws a `QuotaExceededError` (or similar DOMException) instead of silently failing or truncating. Wrap writes of possibly large values in try/catch." },
      { question: "What do a cookie's `path` and `domain` attributes control?", answer: "`path` limits the cookie to requests whose URL path starts with that value (e.g. `/admin`). `domain` controls which hosts get the cookie; set broadly, it can be shared across subdomains instead of only the exact host that set it." },
      { question: "Why might a 'remember me' login feature use a long-lived cookie rather than a long-lived value in localStorage?", answer: "The server must recognize the user on the very first request of a new visit, before any page JavaScript runs. The browser attaches a cookie to that first request by itself. localStorage is only readable after the page's script runs, which would need an extra round trip to tell the server." },
    ],
    relatedTopics: ["web-security-basics"],
    keywords: ["cookies", "localstorage", "sessionstorage", "browser storage", "web storage"],
  },
  {
    id: "web-accessibility",
    title: "Web Accessibility (a11y)",
    level: "intermediate",
    description:
      "Build sites that people using assistive technology, like screen readers or keyboard-only navigation, can use.",
    explanation: `
People browse in different ways. Some can't see a screen and use software
that reads the page aloud. Some can't use a mouse and navigate only with
a keyboard. Some have low vision and need large, high-contrast text. A
site that needs clear sight and precise mouse clicks fails a lot of
people.

**Accessibility**, often written **a11y** (11 letters between the "a" and
the "y"), means building sites that work with assistive technology, not
just a mouse and monitor. It isn't a feature bolted on later. Mostly it's
doing the basics right:

- use real, semantic HTML elements instead of generic ones styled to look the part
- give every image a meaningful text description (**alt text**)
- make every interactive element reachable and usable with only a keyboard

A big part is **focus management**. As a keyboard user tabs through a
page, the focused element should be clearly visible and move in a
sensible order. Opening a modal dialog should move focus into it and trap
it there, so the user isn't tabbing through content hidden behind it.
  `.trim(),
    analogy:
      "It's like adding ramps and clear signs next to the stairs. Most people barely notice them, but for someone in a wheelchair or who can't read small print, they decide whether they can get in the door at all.",
    examples: [
      {
        title: "Meaningful alt text",
        code: `<!-- Bad: unhelpful or missing -->
<img src="chart.png" alt="image">

<!-- Good: describes the actual content -->
<img src="chart.png" alt="Bar chart showing sales rising 20% from January to March">`,
        explanation:
          "A screen reader reads the alt text in place of the image. 'image' tells a blind user nothing; a real description tells them what the chart shows.",
        walkthrough: [
          { code: 'alt="image"', explanation: "Present, but says nothing. A screen reader user learns nothing about the chart." },
          { code: 'alt="Bar chart showing sales rising 20%..."', explanation: "Describes what the image communicates, so a non-visual user gets the same information as someone glancing at the chart." },
        ],
      },
      {
        title: "Keyboard-reachable custom controls",
        code: `<!-- Not focusable or announced as a button by default -->
<div onclick="submitForm()">Submit</div>

<!-- Reachable by keyboard, announced correctly by screen readers -->
<button onclick="submitForm()">Submit</button>`,
        explanation:
          "To keyboard navigation and screen readers, a div with a click handler is just generic text. A real button is focusable, works with the keyboard, and is announced as a button, all by default.",
      },
    ],
    howItWorks: `
A screen reader doesn't see pixels. It reads the HTML structure (often
through the DOM) and uses each element's role, name, and state to
describe the page aloud or in braille.

Semantic elements have these roles built in: a button announces itself
as "button" and responds to the keyboard automatically. A generic element
styled to look like a button has none of that unless you add it back by
hand.
  `.trim(),
    whyItExists: `
The web is meant for everyone, not only people who see a screen clearly
and use a mouse precisely. In many places it's also a legal requirement
for certain kinds of sites. And accessible practices (clear structure,
enough contrast, keyboard support) make a site better for everyone.
  `.trim(),
    whenToUse: `
Build accessibility into every project from the start. Semantic HTML,
real alt text, and keyboard testing cost little as you build and far more
to retrofit later.
  `.trim(),
    whenNotToUse: `
There's basically no valid reason to skip accessibility on a public site.
The only trade-off is depth: a small personal project may not need a full
audit, but the basics (semantic tags, alt text, keyboard support) still
cost little and help everyone.
  `.trim(),
    commonMistakes: [
      "Styling generic elements to look interactive instead of using real buttons or links, which breaks keyboard and screen-reader support.",
      "Writing unhelpful alt text like 'image' or 'photo1.jpg' instead of describing what the image conveys.",
      "Getting focus wrong in dialogs: not moving focus into a newly opened dialog, or not letting it out when the dialog closes.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Add meaningful alt text to three images on a sample page, describing what each one conveys." },
      { difficulty: "Medium", prompt: "Navigate a page using only the Tab and Enter keys. Note every interactive element you couldn't reach or activate." },
      { difficulty: "Hard", prompt: "Rebuild a custom dropdown made of styled divs with proper semantic elements and keyboard support. Check that it works with Tab, Enter, and Escape." },
    ],
    interviewQuestions: [
      { question: "What does web accessibility mean?", answer: "Building sites so people using assistive technology, such as screen readers or keyboard-only navigation, can perceive, understand, and use them." },
      { question: "Why does alt text matter, and what makes it good?", answer: "A screen reader reads it in place of the image, so it's often the only way a non-sighted user learns what the image conveys. Good alt text describes the image's actual content or purpose; it isn't generic or missing." },
      { question: "Why is using a real <button> element better than a styled <div> for something clickable?", answer: "A real button is focusable, works with the keyboard, and is announced correctly by screen readers, all automatically. A div has none of that unless you rebuild it by hand." },
      { question: "What does ARIA stand for, and what's the 'first rule of ARIA'?", answer: "Accessible Rich Internet Applications: HTML attributes that describe roles, states, and properties to assistive technology. The first rule: if a native HTML element or attribute already gives you the semantics and behavior you need, use it instead of adding ARIA to a generic element. Native elements come with correct behavior; ARIA only adds semantics, not behavior." },
      { question: "What's the difference between `aria-label` and `aria-labelledby`?", answer: "aria-label sets the accessible name directly as a string. aria-labelledby points to the id of another element on the page and uses its text as the name, which is handy when the label is already visible and shouldn't be duplicated." },
      { question: "What does `aria-hidden=\"true\"` do, and what's a common mistake with it?", answer: "It removes an element and its descendants from the accessibility tree, so screen readers skip it entirely. A common mistake is using it on something still visible and focusable: a screen reader user's focus can land on a control that's never announced, which is confusing and effectively broken." },
      { question: "What is a 'landmark region', and why does it matter for accessibility?", answer: "A semantic sectioning element like `<nav>`, `<main>`, `<header>`, or `<aside>` (or an equivalent ARIA landmark role) that marks a major region of the page. Screen reader users often jump between landmarks instead of reading top to bottom, so landmarks help them reach what they want quickly." },
      { question: "What's the difference between `tabindex=\"0\"`, `tabindex=\"-1\"`, and a positive `tabindex` value?", answer: "tabindex=\"0\" puts the element in the natural tab order, matching its DOM position. tabindex=\"-1\" makes it focusable from JavaScript (e.g. after opening a dialog) but skips it when tabbing. A positive value pushes it ahead of the normal order; that's discouraged because the custom order easily drifts out of sync with the layout and is hard to maintain." },
      { question: "A custom dropdown is built from a `<div>` with `tabindex=\"0\"` but no keyboard event handlers. What happens when a keyboard user tabs to it and presses Enter?", answer: "Nothing. tabindex=\"0\" makes the element reachable by Tab, not *activatable*. A native `<button>` responds to Enter/Space automatically; a div needs JavaScript to listen for those keys and run the action. Without that, it's a dead end for keyboard users." },
      { question: "Why is focus trapping necessary in a modal dialog?", answer: "Without it, Tab can move focus out of the dialog onto content underneath that should be unreachable while it's open. Keyboard users end up tabbing through hidden content with no clear way back. Trapping keeps Tab cycling through the dialog's own focusable elements until it closes." },
      { question: "What contrast ratio does WCAG's AA level require for normal text versus large text?", answer: "At least 4.5:1 for normal text and 3:1 for large text (about 18pt/24px regular, or 14pt/18.66px bold, and up). Larger text is easier to read against its background even at lower contrast." },
      { question: "Why might you use a 'visually-hidden' CSS technique instead of `display: none` for some content?", answer: "display: none (and visibility: hidden) hide content from the accessibility tree too, so screen readers skip it. A visually-hidden class (clipping the element to a 1px box off-screen, without display:none) hides it from sighted users but keeps it available to assistive technology. It's used for skip links or extra context meant only for screen readers." },
      { question: "What is a 'skip link', and what problem does it solve?", answer: "A link, usually the first focusable element on the page, that jumps straight to the main content past repeated navigation. Without it, keyboard and screen reader users tab through the same nav links on every page before reaching the content." },
      { question: "Why is removing the default focus outline with `outline: none` a common accessibility trap?", answer: "The outline shows keyboard users which element is active. Removing it without a visible replacement (like a custom box-shadow or border on :focus-visible) leaves them unable to tell where they are, even though everything still technically works." },
      { question: "What does a `<label>` element's `for` attribute do, and why does it matter beyond just sighted mouse users?", answer: "It links the label to a form control by id. Clicking the label text then focuses or activates the input, a bigger target for anyone with limited motor precision. And a screen reader reads the label with the input when it gets focus, instead of announcing an unlabeled field." },
      { question: "What does the `role` attribute do when you're stuck using a non-semantic element for some custom widget?", answer: "It tells assistive technology what kind of control the element is (e.g. role=\"button\", role=\"tablist\") so it's announced correctly. It only adds semantics, not the keyboard behavior or focusability of a real element; you still have to build those yourself." },
      { question: "What is the accessibility tree, and how does it relate to the DOM?", answer: "A separate tree, built from the DOM, that holds each element's accessible role, name, state, and value. It's what screen readers and other assistive technology actually use. Purely presentational elements, or ones hidden with aria-hidden, can be in the DOM but left out of it, and ARIA can change how a node appears there without changing the DOM." },
      { question: "A form shows an invalid input by giving it a red border and nothing else — what's the accessibility problem, and how would you fix it?", answer: "Color alone doesn't reach colorblind users, and screen readers can't perceive a border color at all. Add a text error message linked to the field with `aria-describedby`, and mark the field `aria-invalid=\"true\"` so assistive technology announces the invalid state." },
      { question: "A screen reader announces a form field's error message twice — what's a likely cause?", answer: "The same error text is probably exposed through two mechanisms at once, for example in content referenced by `aria-describedby` and also in an `aria-live` region showing the same message. The user hears it from both." },
      { question: "What's the difference between `aria-live=\"polite\"` and `aria-live=\"assertive\"`?", answer: "polite waits until the screen reader finishes its current announcement, so it doesn't interrupt. assertive interrupts immediately. Save assertive for urgent updates; overusing it is disorienting." },
    ],
    prerequisites: ["html-basics"],
    relatedTopics: ["html-basics", "the-dom"],
    keywords: ["accessibility", "a11y", "screen readers", "alt text", "keyboard navigation", "focus management"],
  },
  {
    id: "web-performance-basics",
    title: "Web Performance Basics",
    level: "intermediate",
    description:
      "What makes a page feel slow, and the basic techniques for making it fast.",
    explanation: `
Most slowness comes from the browser being busy or waiting before it can
show or use something:

- A stylesheet or script that must download and run *before* anything shows is **render-blocking**. The page stays blank while the browser waits.
- Large, unoptimized images take a long time to download, delaying everything that depends on them.
- Lots of JavaScript still has to be parsed and run after downloading, so a page can look finished but not respond to clicks and taps.

A few well-known techniques address these:

- **Lazy loading** waits to fetch something (like an image far down the page) until it's about to be needed.
- **Minification** strips unneeded characters (whitespace, long variable names) from CSS and JavaScript, so less data is sent.
- **Caching** lets the browser reuse a file from an earlier visit instead of downloading it again when it hasn't changed.
  `.trim(),
    analogy:
      "It's like being handed a phone book at a restaurant door when all you wanted was the menu. Render-blocking resources make you wait through unrelated work before you get what you came for.",
    examples: [
      {
        title: "Avoiding render-blocking scripts",
        code: `<!-- Blocks rendering until fully downloaded and run -->
<script src="analytics.js"></script>

<!-- Downloads in the background, runs after parsing finishes -->
<script src="analytics.js" defer></script>`,
        explanation:
          "Without defer, the browser stops parsing the HTML to fetch and run the script right away. With defer, the script downloads in parallel and runs after parsing finishes, so it doesn't delay the visible page.",
        walkthrough: [
          { code: '<script src="analytics.js"></script>', explanation: "The browser pauses parsing here, fetches and runs the script, then continues. Everything after it waits." },
          { code: "defer", explanation: "Fetch the script in the background without pausing parsing, and run it after the HTML is fully parsed." },
        ],
      },
      {
        title: "Lazy loading images",
        code: `<img src="hero.jpg" alt="Product hero image">
<img src="footer-banner.jpg" alt="Seasonal promotion" loading="lazy">`,
        explanation:
          "The hero image loads right away because it's visible immediately. The footer banner is probably far below the first screen, so loading=\"lazy\" tells the browser to fetch it only when the user scrolls near it.",
      },
    ],
    howItWorks: `
Parsing HTML, downloading files, running CSS and JavaScript, and
rendering all compete for the browser's time. Deferring scripts, lazy
loading offscreen images, and minifying files reduce or reschedule that
work: less data over the network, or less waiting before something
useful appears.

Caching works differently. It skips the network entirely for files the
browser already has an unchanged copy of.
  `.trim(),
    whyItExists: `
A slow page costs user attention and, for businesses, measurable
results: people abandon slow pages far more often. As pages have grown
heavier (more images, scripts, and third-party embeds), these techniques
have become necessary to keep pages usable, not optional polish.
  `.trim(),
    whenToUse: `
Use these by default on any real website: defer non-critical scripts,
lazy-load offscreen images, minify production CSS and JavaScript, and set
caching headers on assets that rarely change. Look closer when users
report slowness or when measured load times show a problem.
  `.trim(),
    whenNotToUse: `
Very small or low-traffic internal tools may not need heavy tuning. For
example, setting up a build pipeline just for minification may not pay
off if load time is already unnoticeable. Optimizing before you know
where the time goes can also waste effort on the wrong thing.
  `.trim(),
    commonMistakes: [
      "Loading large, unoptimized images at full resolution when a much smaller version would look the same on screen.",
      "Lazy-loading a critical, above-the-fold image, which delays content the user sees right away.",
      "Expecting minification to fix a problem caused by shipping too much JavaScript in the first place.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Add the loading=\"lazy\" attribute to images below the visible area on a sample page." },
      { difficulty: "Medium", prompt: "Change a blocking <script> tag in a page's head to use defer, then explain how page loading changes." },
      { difficulty: "Hard", prompt: "In your browser's Network panel, measure a real page's load time, find the largest resource slowing it down, and propose one concrete fix." },
    ],
    interviewQuestions: [
      { question: "What does 'render-blocking' mean?", answer: "A resource, like a script or stylesheet, that the browser must fully download (and sometimes run) before it can keep rendering, causing a visible delay." },
      { question: "What is lazy loading, and when is it appropriate?", answer: "Waiting to load a resource, usually an image, until it's about to be needed, such as when it scrolls near the viewport. Use it for offscreen content, not for content visible as soon as the page loads." },
      { question: "How does caching improve web performance?", answer: "The browser reuses a file it already downloaded instead of fetching it again, as long as it hasn't changed. That saves time and bandwidth on repeat visits." },
      { question: "What are the Core Web Vitals, and which three metrics make up the current set?", answer: "Metrics Google uses to measure real-world user experience: Largest Contentful Paint (LCP, loading speed), Interaction to Next Paint (INP, responsiveness), and Cumulative Layout Shift (CLS, visual stability)." },
      { question: "What does Largest Contentful Paint (LCP) measure, and what's considered a good score?", answer: "How long the largest visible content element (often a hero image or big block of text) takes to finish rendering after the page starts loading. 2.5 seconds or less is generally considered good." },
      { question: "What does Cumulative Layout Shift (CLS) measure, and what commonly causes a poor score?", answer: "How much visible content unexpectedly moves during load, weighted by how much of the viewport moved and how far. Common causes: images or embeds with no reserved width/height, content (like an ad or banner) injected above existing content after load, and web fonts swapping in with different metrics than the fallback." },
      { question: "What replaced First Input Delay (FID) as a Core Web Vital, and why?", answer: "Interaction to Next Paint (INP). FID only measured the delay before the *first* interaction began processing, missing problems later on. INP measures responsiveness across every interaction during the page's life, giving a fuller picture." },
      { question: "What are the main stages of the critical rendering path?", answer: "Parse HTML into a DOM, parse CSS into a CSSOM, combine them into a render tree of visible nodes with computed styles, calculate each node's position and size (layout), then paint pixels to the screen." },
      { question: "Why is CSS treated as render-blocking by default?", answer: "The browser waits for the full CSSOM before rendering so it doesn't paint unstyled content and then repaint it when styles arrive. That jarring flash of unstyled content (FOUC) is avoided by holding the first paint until styling is known." },
      { question: "What's the tradeoff between putting a `<link rel=\"stylesheet\">` in the `<head>` versus at the end of `<body>`?", answer: "In the head, rendering waits for the CSS, so first paint is later but the page never appears unstyled. At the end of the body, the browser may briefly paint unstyled content, then reflow everything when the CSS loads. Something shows sooner, but it usually looks worse." },
      { question: "What's the difference between `async` and `defer` on a `<script>` tag?", answer: "Both download without blocking parsing. async runs the script as soon as it downloads, which can interrupt parsing and doesn't guarantee order among scripts. defer waits until the HTML is fully parsed, and deferred scripts always run in document order. That makes defer the safer default for scripts that depend on the DOM or on each other." },
      { question: "Why is reflow (layout) generally more expensive than repaint?", answer: "A repaint redraws pixels whose appearance changed (like a color) without touching geometry. A reflow recalculates the size and position of the changed element *and* possibly every element it affects, which can cascade across much of the page." },
      { question: "What is 'layout thrashing', and what's a common way it happens by accident?", answer: "Code forcing the browser to recalculate layout synchronously many times in a tight loop instead of once. The classic cause is reading a layout property (like `element.offsetHeight`) right after a style change inside a loop: each read forces the browser to flush and recompute layout before answering." },
      { question: "Why can overusing `will-change` hurt performance instead of helping it?", answer: "will-change hints that the browser should promote an element to its own compositing layer ahead of an animation. Using it broadly, or on elements that don't need it, creates many extra layers that use more GPU memory and can slow things down." },
      { question: "When would you still need an Intersection Observer-based lazy-loading approach instead of native `loading=\"lazy\"`?", answer: "When you need more control than the default: lazy-loading something other than images/iframes (e.g. a heavy component), choosing how early loading starts, or supporting older browsers without the loading attribute." },
      { question: "What is code splitting, and how does it help a large JavaScript application load faster?", answer: "It splits one large bundle into smaller chunks loaded on demand, for example per route. A first visit then downloads and parses only the code for the current page, not the whole app." },
      { question: "What does tree shaking remove from a JavaScript bundle?", answer: "Dead code: module exports that are never imported or used. It works by static analysis of import/export statements, so the bundle leaves out library code the app never calls." },
      { question: "What's the difference between `<link rel=\"preload\">`, `rel=\"prefetch\"`, and `rel=\"preconnect\"`?", answer: "preload fetches a resource the *current* page definitely needs, at high priority, before the browser would find it on its own. prefetch fetches something a *future* navigation probably needs, at low priority. preconnect only sets up the connection (DNS, TCP, TLS) to another origin in advance, without fetching a file, to save that time later." },
      { question: "Your page's LCP element is a large hero image loading late. Name two concrete ways to improve it.", answer: "Preload it with `<link rel=\"preload\" as=\"image\">` so the browser fetches it early instead of finding it only when parsing reaches the img tag. And serve a properly sized, modern-format file (e.g. WebP/AVIF) so there's less to download." },
      { question: "Does minifying JavaScript reduce how long the browser takes to execute it?", answer: "Not meaningfully. Minification makes the file smaller (less to download and parse), but the logic runs the same operations, so execution time stays about the same. That's why it can't fix shipping too much JavaScript." },
      { question: "What is `font-display: swap`, and what performance/visual tradeoff does it introduce?", answer: "It shows text right away in a fallback font while the web font downloads, then swaps to the real font, so text is never invisible. The tradeoff: if the two fonts have different metrics (character widths, line height), the swap can shift the layout and hurt CLS." },
      { question: "Why does compressing assets with gzip or Brotli improve load performance, and which one usually compresses better?", answer: "Both shrink the bytes sent for text assets like HTML, CSS, and JS, so they download faster. Brotli usually compresses better than gzip, though it can take a bit longer to compress. That affects build time more than serving an already-compressed file." },
      { question: "How did HTTP/2 multiplexing reduce the value of older performance tricks like bundling many files together or sharding assets across multiple domains?", answer: "HTTP/1.1 allowed only a few parallel requests per connection, so bundling (fewer requests) and domain sharding (more connections) worked around the limit. HTTP/2 sends many requests over one connection at once, removing much of that overhead. Bundling everything into one giant file can now hurt caching without the old payoff." },
      { question: "Using browser DevTools, how would you tell whether a slow page load is bottlenecked by network transfer or by JavaScript execution?", answer: "The Network panel's waterfall shows how long each resource spent downloading versus waiting; large or slow requests point to the network. The Performance panel's main-thread flame chart shows time spent parsing, compiling, and running JavaScript and doing layout/paint; if most time is there, you're CPU-bound." },
      { question: "An `<img>` has no `width`/`height` attributes set. What layout symptom can result once it finishes loading on a slow connection, and how do you prevent it?", answer: "Before it loads, the browser doesn't know its size and reserves no space, so other content fills that area. When the image arrives, everything below jumps to make room, a layout shift that counts against CLS. Set width/height attributes (or CSS `aspect-ratio`) so the browser reserves the space before the image even starts downloading." },
      { question: "What's the Core Web Vitals tradeoff between client-side rendering (CSR) and server-side rendering (SSR)?", answer: "SSR usually gives better LCP/FCP on first load, since the HTML arrives with real content instead of an empty shell waiting for JavaScript to fetch and render data. CSR is often slower on first load for that reason, but can feel faster on later in-app navigations, once the bundle is loaded and only data needs fetching." },
      { question: "What does Time to First Byte (TTFB) measure, and what does a slow TTFB usually indicate?", answer: "The time from sending a request to receiving the first byte of the response. It mostly reflects server-side work (routing, database queries, server-side rendering), not front-end asset delivery. A slow TTFB points to a backend or network-latency problem that minification or lazy loading can't fix." },
      { question: "Mechanically, how does a CDN improve load performance?", answer: "It caches static assets on servers spread out geographically, close to users. Requests are served from a nearby edge location instead of a distant origin server, cutting round-trip time." },
      { question: "A returning visitor loads a page much faster than a first-time visitor loading the exact same assets. What's the likely mechanism, given proper `Cache-Control` headers?", answer: "The browser's disk/memory cache already holds the CSS, JS, and images from the last visit, and Cache-Control headers (e.g. a max-age) say they're still valid. So it uses them from cache without any network request. A first-time visitor has no cache and downloads everything." },
      { question: "What's a common pitfall of giving a file like `app.js` a very long `Cache-Control: max-age`?", answer: "After a new deploy, users with a cached copy keep the old file until the cache expires, possibly running outdated code (or broken code, if the backend changed) for a long time. The standard fix is a content hash in the filename (e.g. app.3f2a1c.js). Each deploy produces a new filename that's fetched fresh, and the long cache is safe because a given filename's content never changes." },
    ],
    prerequisites: ["browser-rendering"],
    relatedTopics: ["browser-rendering", "responsive-design"],
    keywords: ["performance", "lazy loading", "minification", "caching", "render-blocking"],
  },
];
