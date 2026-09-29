import type { Topic } from "../../types/content";

export const webFundamentalsIntermediateTopics: Topic[] = [
  {
    id: "css-layout",
    title: "CSS Layout (Flexbox & Grid)",
    level: "intermediate",
    description:
      "Two modern CSS tools for arranging elements on a page without relying on old workarounds like floats.",
    explanation: `
Arranging elements side by side, centering something both vertically and
horizontally, or making a set of boxes evenly sized used to be
genuinely difficult in CSS. Developers reached for tools that were never
actually designed for layout — most famously the \`float\` property,
originally meant for wrapping text around an image — and bent them into
shapes they weren't built for, with lots of fragile side effects.

CSS eventually got two tools actually designed for arranging elements.
**Flexbox** handles layout along a single direction — a row or a column
— and is great for things like navigation bars, toolbars, or centering
a handful of items. **Grid** handles two-dimensional layout — rows *and*
columns at once — and is great for things like a page's overall layout,
image galleries, or dashboards with defined regions.

Both work the same basic way: you turn on the layout mode on a
**container** element, and its direct children automatically become
items that get arranged according to rules you set — how they're
spaced, aligned, sized, and ordered — instead of you calculating pixel
positions by hand.
  `.trim(),
    analogy:
      "Flexbox is like arranging books along a single shelf — you can space them out or squeeze them together, but it's one line at a time. Grid is like arranging books in a bookcase with defined rows and columns, where you can also decide a single book spans multiple slots.",
    examples: [
      {
        title: "Flexbox: a simple row layout",
        code: `.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}`,
        explanation:
          "Turning on flex layout makes the toolbar's children line up in a row automatically. justify-content spaces them across the main axis, and align-items centers them on the cross axis, with no manual positioning needed.",
        walkthrough: [
          { code: "display: flex;", explanation: "Turns this element into a flex container — its direct children become flex items, arranged in a row by default." },
          { code: "justify-content: space-between;", explanation: "Spreads the items so the first touches the left edge, the last touches the right edge, and space is distributed evenly between them." },
          { code: "align-items: center;", explanation: "Centers the items along the opposite axis — vertically, in a row layout — even if they have different heights." },
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
          "This defines a page layout with a fixed-width sidebar column and a flexible content column, plus rows for a header, body, and footer, then places specific elements into specific cells of that grid.",
      },
    ],
    howItWorks: `
When you set \`display: flex\` or \`display: grid\` on an element, the
browser's layout engine switches from the normal block-by-block flow to
one of these specialized layout algorithms for that element's children.
Flexbox calculates how much space each item needs along a single axis
and distributes any remaining or missing space according to your rules.
Grid instead builds an explicit two-dimensional grid of rows and
columns first, then places each child into a cell (or a span of cells)
within it.
  `.trim(),
    whyItExists: `
Flexbox and Grid exist because older layout tools were never designed
for arranging general page content — they were repurposed for the job
and required workarounds (clearing floats, fixed pixel widths,
absolute positioning tricks) that broke easily as content changed.
These two systems were purpose-built for layout, making common patterns
like equal-height columns or centered content something you can express
directly, instead of hacking around.
  `.trim(),
    whenToUse: `
Reach for Flexbox when arranging items in a single row or column — a
nav bar, a button group, centering one thing inside another. Reach for
Grid when you need to control both rows and columns at once — an
overall page layout, a photo gallery, or any layout where content needs
to align across both dimensions.
  `.trim(),
    whenNotToUse: `
For simple in-line text flow — a paragraph, a sentence with a link in it
— you don't need either; normal document flow already handles that.
Overusing Grid for a layout that's really only ever one row or column
also adds unnecessary complexity where Flexbox would be simpler.
  `.trim(),
    commonMistakes: [
      "Reaching for float-based layout out of habit instead of Flexbox or Grid for new work.",
      "Confusing Flexbox's single-axis model with Grid's two-axis model and trying to force complex two-dimensional layouts out of Flexbox alone.",
      "Forgetting that flex/grid properties (like justify-content) go on the container, while sizing properties for individual items (like flex-grow) go on the children.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use Flexbox to horizontally center three boxes inside a container, with even spacing between them." },
      { difficulty: "Medium", prompt: "Build a page layout with a header, a fixed-width sidebar, and a flexible main content area using CSS Grid." },
      { difficulty: "Hard", prompt: "Recreate a layout that was originally built with floats using Flexbox or Grid instead, and explain what workaround(s) you were able to remove." },
    ],
    interviewQuestions: [
      { question: "What's the core difference between Flexbox and Grid?", answer: "Flexbox arranges items along a single axis (a row or a column). Grid arranges items across two axes (rows and columns) at once." },
      { question: "What CSS property turns an element into a flex or grid container?", answer: "display: flex for Flexbox, or display: grid for Grid, applied to the parent element whose children should be arranged." },
      { question: "Why were floats historically used for layout, and what was the problem?", answer: "Floats were originally designed for wrapping text around images, not for full-page layout, so using them for layout required extra workarounds like manually clearing floats to avoid broken, collapsing containers." },
      { question: "In Flexbox, what are the 'main axis' and 'cross axis', and how do justify-content and align-items relate to them?", answer: "The main axis runs in the direction set by flex-direction (row by default), and the cross axis runs perpendicular to it. justify-content aligns items along the main axis, while align-items aligns them along the cross axis." },
      { question: "If you switch `flex-direction` from `row` to `column`, what happens to the meaning of `justify-content` and `align-items`?", answer: "The main axis rotates to vertical, so justify-content now controls vertical spacing (top-to-bottom) and align-items now controls horizontal alignment — the two properties swap which physical direction they affect, because they're always defined relative to the main/cross axis, not to 'horizontal'/'vertical' directly." },
      { question: "What does the shorthand `flex: 1` expand to, and what does each part control?", answer: "It expands to `flex-grow: 1; flex-shrink: 1; flex-basis: 0%`. flex-grow lets the item grow to fill available space, flex-shrink lets it shrink if space is tight, and a flex-basis of 0% means its initial size before growing is treated as zero, so available space is distributed purely by the grow ratio." },
      { question: "What's the difference between `align-items` and `align-content` in Flexbox?", answer: "align-items aligns individual items along the cross axis within their line. align-content aligns entire lines of items along the cross axis when there's extra space and the container has multiple lines (via flex-wrap: wrap) — it has no visible effect on a single-line flex container." },
      { question: "Why might `justify-content: center` appear to do nothing on a flex container?", answer: "If the items have flex-grow set to fill all available space (e.g. flex: 1 on every item), there's no leftover space left on the main axis for justify-content to distribute, so it has nothing visible to do." },
      { question: "What's the difference between the `fr` unit in Grid and using percentages for column widths?", answer: "`fr` distributes the space that remains *after* fixed-size tracks (like px values or content-sized tracks) are subtracted, while percentages are always a fraction of the container's total size regardless of other tracks — which can cause overflow if fixed-size columns and percentages are combined and together exceed 100%." },
      { question: "Given `grid-template-columns: repeat(3, 1fr);` and one item with `grid-column: span 2`, what happens?", answer: "That item occupies two of the three equal-width columns in whatever row it's placed in, and the remaining items flow into the leftover single-column space, wrapping to new rows as needed via Grid's auto-placement." },
      { question: "What does `grid-template-areas` do, and why is it useful?", answer: "It lets you name regions of the grid as a visual ASCII-like map of strings, then place children into those named regions with `grid-area`, instead of tracking numeric row/column line numbers — making the overall layout structure much easier to read at a glance." },
      { question: "What's the difference between `justify-content` and `justify-items`/`justify-self` in Grid?", answer: "justify-content distributes the grid's tracks as a whole within the container (when tracks don't fill the container). justify-items/justify-self instead align an individual item *within its own cell* along the inline (row) axis, independent of how the tracks themselves are distributed." },
      { question: "How are absolutely positioned children treated inside a flex or grid container?", answer: "An absolutely positioned child is taken out of normal layout flow entirely — it doesn't participate in the flex or grid algorithm, doesn't get placed into a cell or take up main-axis space, and is instead positioned relative to its containing block as usual." },
      { question: "You set `align-items: center` on an outer flex container, but its content still isn't vertically centered — what's a likely cause?", answer: "align-items centers items *within the height the container actually has*. If the outer container's height is only as tall as its content (no explicit height, and it isn't itself being stretched by a parent), there's no extra vertical space to center within, so centering has no visible effect." },
      { question: "What is `flex-basis`, and how does it interact with `flex-grow` and `flex-shrink`?", answer: "flex-basis sets an item's initial main-axis size before any growing or shrinking is applied. flex-grow and flex-shrink then distribute any remaining or missing space (compared to that basis) among items according to their grow/shrink factors." },
      { question: "When would you use `flex-shrink: 0` on a flex item?", answer: "When you want that item to keep its natural size and never shrink even if the container runs out of space — for example, keeping an icon or a fixed-width sidebar from being squeezed as other flexible items compete for room." },
      { question: "Given `.item1 { flex: 1 }` and `.item2 { flex: 2 }` inside the same flex container, how is extra space divided between them?", answer: "The extra space is split proportionally to the grow factors — item2 receives twice as much of the leftover space as item1, so with equal starting size item2 ends up roughly twice as wide (or tall, in a column layout)." },
      { question: "Why does adding `min-width: 0` (or `min-height: 0`) to a flex item sometimes fix an overflow or truncation bug?", answer: "Flex items default to `min-width: auto`, which prevents them from shrinking smaller than their content's natural (min-content) size — so long unbroken text or a wide child can force the item to overflow its container even with flex-shrink set. Explicitly setting min-width: 0 removes that floor, letting the item shrink further so text-overflow/ellipsis and wrapping can actually take effect." },
      { question: "What's the difference between the explicit and implicit grid in CSS Grid?", answer: "The explicit grid is made of the tracks you define with grid-template-columns/grid-template-rows. If items are placed outside that defined area (through auto-placement or explicit line numbers beyond it), the browser creates implicit tracks to hold them, sized by grid-auto-rows/grid-auto-columns (auto by default)." },
      { question: "What does `grid-auto-flow: dense` change about item placement?", answer: "By default, Grid's auto-placement never backtracks — once it moves past a gap too small for an item, that gap stays empty. `dense` instead allows the algorithm to backfill earlier gaps with later items that fit, packing the grid more tightly at the cost of possibly placing items out of their source order visually." },
      { question: "When would you use `repeat(auto-fit, minmax(200px, 1fr))` instead of a fixed `repeat(4, 1fr)`?", answer: "auto-fit with minmax lets the number of columns respond to available space automatically — as many 200px-or-wider columns as fit are created and they stretch to fill any leftover space — giving a responsive grid without writing separate media queries for each screen width." },
      { question: "In a 900px-wide container with `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));`, how many columns are created?", answer: "Four columns of 225px each. The browser fits as many 200px-minimum tracks as possible (four fit in 900px, since a fifth would need at least 1000px), then stretches them equally with the fr unit to fill the remaining space." },
      { question: "What does the `order` property do, and what's an important limitation of it?", answer: "It changes the *visual* order in which flex or grid items are painted, independent of their order in the HTML. It does not change the underlying DOM order, so keyboard tab order and screen reader reading order still follow the original markup — meaning `order` can visually reorder content in a way that no longer matches how it's read or tabbed through." },
      { question: "What's the difference between `gap` and using margins to space out flex or grid items?", answer: "gap applies space only *between* items, not around the outer edges of the container, and it doesn't require any special handling for the first/last item (unlike margins, which need something like :first-child/:last-child overrides to avoid extra space at the container's edges)." },
      { question: "Why can a flex or grid item respond to `z-index` even without `position: relative` or `position: absolute` set on it?", answer: "Flex and grid items form a stacking context based on their order/z-index even while `position: static`, unlike ordinary block-flow elements, where z-index is ignored entirely unless the element has a position value other than static." },
      { question: "Why do flex items with different content heights end up the same height inside a row by default?", answer: "align-items defaults to `stretch`, which stretches every item to fill the container's cross-axis size unless the item has its own explicit height or align-self override — giving equal-height columns automatically, something float-based layouts couldn't do without extra hacks." },
      { question: "What happens to flex items when the container has `flex-wrap: nowrap` (the default) and they don't all fit on one line?", answer: "The items shrink (per their flex-shrink factor) to try to fit on the single line; if they can't shrink enough, they overflow the container rather than wrapping onto a new line, since wrapping is disabled." },
      { question: "What problem does CSS Grid's `subgrid` value solve?", answer: "Without it, a nested grid defines its own independent tracks, so its rows/columns can't align with the parent grid's tracks. `subgrid` lets a nested grid item adopt its parent's track sizing directly, so content inside it lines up with the outer grid instead of needing manually matched sizes." },
      { question: "Why can forcing a two-dimensional layout out of Flexbox alone become awkward?", answer: "Flexbox only manages one axis at a time — wrapped items form new lines, but items in different lines don't align with each other across that second axis the way Grid's explicit rows and columns do, so replicating true row/column alignment (like a calendar or dashboard grid) requires extra wrapper elements or fixed widths that Grid handles natively." },
      { question: "In Grid, what determines which cell an item lands in if you don't set `grid-column`/`grid-row` on it?", answer: "Grid's auto-placement algorithm places it into the next available cell, moving through the grid according to `grid-auto-flow` (row-by-row by default, or column-by-column with `grid-auto-flow: column`), creating implicit tracks if it runs out of explicitly defined ones." },
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
      "Designing a single page so it still looks and works well on a huge range of screen sizes, from phones to large monitors.",
    explanation: `
A page built to look right on a large desktop monitor often looks
broken on a phone — text too small to read, content overflowing the
screen, layouts that assume far more horizontal space than actually
exists. Since the same page can be viewed on a huge range of screen
sizes, from a small phone to a wide desktop display, it needs a way to
adapt.

**Responsive design** is the practice of building a page so its layout
and styling adjust based on the size (and other characteristics) of the
screen viewing it, rather than assuming one fixed size. The main tool
for this in CSS is the **media query** — a rule that says "only apply
these styles when the screen matches some condition," most commonly a
minimum or maximum width.

A closely related idea is **mobile-first** design: writing your base
styles for the smallest, simplest screen first, then using media
queries to *add* complexity and rearrange things as more screen space
becomes available — rather than designing for desktop first and
patching things down for smaller screens as an afterthought. Starting
small tends to produce simpler, more resilient CSS.
  `.trim(),
    analogy:
      "It's like writing a letter that reformats itself depending on the size of paper it's printed on — one column and large text on a small card, multiple columns and smaller text on a full sheet — without changing a single word of the actual content.",
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
          "By default (small screens), items stack vertically. Once the screen is at least 768px wide, the media query kicks in and switches the layout to a horizontal row.",
        walkthrough: [
          { code: "flex-direction: column;", explanation: "The default, mobile-first layout: items stack in a single vertical column, which fits a narrow screen." },
          { code: "@media (min-width: 768px) {", explanation: "This block of styles only applies once the viewport is at least 768 pixels wide." },
          { code: "flex-direction: row;", explanation: "On wider screens, the same items now arrange in a horizontal row instead, taking advantage of the extra space." },
        ],
      },
      {
        title: "A responsive viewport setup",
        code: `<meta name="viewport" content="width=device-width, initial-scale=1">`,
        explanation:
          "Without this tag in the HTML head, mobile browsers often render the page at a wide desktop size and then shrink it to fit, making text tiny. This tag tells the browser to use the device's actual width as the page's width from the start.",
      },
    ],
    howItWorks: `
The browser continuously knows the current width (and other
characteristics) of its viewport — the visible area of the page. Media
queries are evaluated against that viewport, and any CSS rules inside a
matching media query are applied on top of (or in place of) the base
styles. As the browser window or device orientation changes, the
browser re-evaluates these queries and updates the applied styles
immediately, without a page reload.
  `.trim(),
    whyItExists: `
Responsive design became essential once people started browsing the web
on a huge variety of devices with wildly different screen sizes, rather
than mostly one kind of desktop monitor. Building and maintaining
entirely separate pages for "mobile" and "desktop" was expensive and
error-prone; a single page that adapts itself via CSS is far easier to
maintain and keeps content consistent everywhere.
  `.trim(),
    whenToUse: `
Use responsive techniques for essentially any public-facing page today,
since you rarely control what device or window size someone will use to
view it. Mobile-first is especially valuable when a page's content and
priorities genuinely differ by available space, not just its visual
size.
  `.trim(),
    whenNotToUse: `
An internal tool used exclusively on one known, fixed-size screen (like
a kiosk display) may not need full responsive treatment. Even then,
it's rarely harmful to have it, so responsive design is close to a
default best practice for anything reachable from a general web
browser.
  `.trim(),
    commonMistakes: [
      "Forgetting the viewport meta tag, which causes mobile browsers to render the page at a shrunk-down desktop width.",
      "Designing desktop-first and only reluctantly patching things for mobile, leading to bloated CSS with lots of overrides.",
      "Testing responsiveness only by resizing a desktop browser window instead of checking on actual or emulated mobile devices too.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Add a media query that changes a page's background color once the screen is narrower than 500px." },
      { difficulty: "Medium", prompt: "Build a mobile-first navigation bar that stacks links vertically by default and switches to a horizontal row above 768px." },
      { difficulty: "Hard", prompt: "Take an existing desktop-only layout and convert it to mobile-first responsive CSS, listing each media query you added and why." },
    ],
    interviewQuestions: [
      { question: "What is a media query?", answer: "A CSS rule that applies a block of styles only when the viewport matches some condition, most commonly a minimum or maximum width." },
      { question: "What does 'mobile-first' mean in responsive design?", answer: "Writing base CSS for the smallest screen first, then using media queries to add complexity and rearrange the layout as more screen space becomes available, rather than starting from a desktop layout and shrinking it down." },
      { question: "Why is the viewport meta tag important for responsive design?", answer: "Without it, many mobile browsers render the page at a wide, desktop-like width and scale it down, making text and layout appear too small; the tag makes the browser use the device's actual width." },
      { question: "What's the difference between a `min-width` and a `max-width` media query, and which fits a mobile-first approach?", answer: "A min-width query applies its styles once the viewport is at least that wide, layering enhancements on top of a base style — this fits mobile-first, since the base (unqueried) styles target the smallest screens and min-width queries add complexity as space increases. A max-width query instead applies once the viewport is at most that wide, which is the pattern used in a desktop-first approach that shrinks things down." },
      { question: "If two media queries both match the current viewport and set different values for the same property, which one wins?", answer: "Ordinary CSS cascade rules apply: with equal specificity, whichever rule appears later in the source order wins, regardless of which media query's condition is 'more specific' about screen size — so query order in the stylesheet matters, not just which range is narrower." },
      { question: "Why are relative units like `rem`, `em`, `%`, and `vw`/`vh` generally preferred over fixed `px` in responsive design?", answer: "They scale relative to something else — the root font size, a parent's size, or the viewport — so text and spacing adjust automatically as the user's font-size preference or screen size changes, whereas px values stay fixed regardless of context." },
      { question: "What's the difference between `rem` and `em`, and what's a common gotcha with `em`?", answer: "rem is always relative to the root (`html`) element's font size, so it stays consistent no matter where it's used. em is relative to the *current* element's own font size, which means nested elements using em for font-size can compound — each level multiplying the previous one — leading to unexpectedly large or small text deep in a nested structure." },
      { question: "What is a 'breakpoint' in responsive design, and how should you choose one?", answer: "It's the viewport width at which a media query changes the layout. Good practice is to base breakpoints on where your own content actually starts to look cramped or awkward, rather than targeting specific popular device widths, since device sizes vary constantly and content-based breakpoints stay relevant regardless." },
      { question: "What do `max-width: 100%` and `height: auto` do for images in a responsive layout?", answer: "max-width: 100% keeps an image from ever rendering wider than its container, shrinking it down on narrow screens instead of overflowing. height: auto then preserves the image's aspect ratio as its width changes, so it doesn't get stretched or squashed." },
      { question: "An image has `width: 100%` but still overflows its container on a narrow screen — what's a likely cause?", answer: "The image's parent container itself may not actually be narrow — for example, it could have a fixed min-width, or `box-sizing` isn't set to border-box and padding is pushing its content box wider than intended — so the image is correctly filling 100% of a container that's already too wide." },
      { question: "What's the practical difference between using `srcset`/`sizes` versus just scaling one large image down with CSS?", answer: "srcset lets the browser choose and download a differently-sized image file suited to the actual display size and device pixel ratio, so a phone downloads a genuinely smaller file. CSS-only scaling still downloads the single full-size image regardless of screen size, wasting bandwidth on smaller devices." },
      { question: "What's the difference between 'responsive' (fluid) design and 'adaptive' design?", answer: "Responsive design uses fluid, relative-unit layouts and media queries that adjust continuously across a wide range of sizes. Adaptive design instead serves a small number of fixed, discrete layouts targeted at specific known breakpoints, switching between them rather than flowing continuously." },
      { question: "How does `box-sizing: border-box` help make responsive layouts more predictable?", answer: "By default, padding and border are added *on top of* a specified width, so a `width: 50%` element with padding can end up wider than 50%. border-box makes width/height include padding and border, so percentage-based and fluid widths behave the way they visually appear to." },
      { question: "If content is hidden at a certain breakpoint with `display: none`, does that mean its resources (like an image) were never downloaded?", answer: "Not necessarily — unless the resource itself is conditionally loaded (e.g. via a `<picture>` element with media conditions, or lazy loading), the browser may still fetch an `<img>` referenced inside a hidden element, since CSS display rules don't stop the HTML parser from requesting resources it finds." },
      { question: "What's the difference between a media query and a container query?", answer: "A media query responds to the size of the entire viewport. A container query (`@container`, with `container-type` set on an ancestor) responds instead to the size of a specific containing element, letting a component adapt based on the space it's actually given, regardless of overall screen size — useful for components reused in different-width contexts." },
      { question: "Given `.card-wrapper { container-type: inline-size; }` and a container query targeting it, what does the query actually measure?", answer: "It measures the inline-size (width, in a standard horizontal writing mode) of `.card-wrapper` itself, not the viewport — so a `.card` inside a narrow sidebar and the same `.card` inside a wide main column can render differently even though the browser window size hasn't changed." },
      { question: "Why can testing responsiveness only by resizing a desktop browser window miss real problems?", answer: "It doesn't reveal issues specific to actual mobile conditions — touch target sizes that are fine for a mouse cursor but too small for a finger, real device pixel ratios affecting image sharpness, slower network conditions, or mobile-specific browser chrome/viewport quirks that a resized desktop window doesn't reproduce." },
      { question: "What does the CSS `clamp()` function do, and how is it commonly used in responsive typography?", answer: "clamp(min, preferred, max) picks the preferred value but constrains it to never go below min or above max. For type sizing, this is often used like `font-size: clamp(1rem, 2vw + 0.5rem, 2rem)`, letting the size scale fluidly with the viewport while guaranteeing it never becomes unreadably small or excessively large." },
      { question: "A fixed-position header overlaps the top of the page content differently across screen sizes — how would you handle this responsively?", answer: "Reserve space for the header's actual height with padding or margin on the content below it (often recalculated per breakpoint if the header's height changes responsively), or use `scroll-margin-top` on anchor targets so jumping to an anchor doesn't tuck content underneath the fixed header." },
      { question: "Even with relative units, media queries, and container queries in place, why is testing on real or emulated mobile devices still worth doing?", answer: "Emulation and relative units address layout sizing, but real devices surface things CSS alone can't simulate reliably — actual touch interaction and target sizes, real network latency, on-screen keyboard behavior, and browser-specific rendering quirks that differ from a desktop dev tools simulation." },
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
      "Different ways a website can save small pieces of data directly in the user's browser, so it's still there the next time they visit.",
    explanation: `
Normally, everything a page knows about disappears the moment you
close the tab or navigate away — variables in JavaScript, form input
that hasn't been submitted, anything held only in memory. Sometimes a
site needs to remember something *across* visits or page loads: that
you're logged in, that you prefer dark mode, that you had three items
in a cart.

Browsers give websites a few different tools for this, and picking
between them comes down to how long the data should last and who needs
to see it. **Cookies** are small pieces of data that get automatically
sent along with every request to a server, which makes them the classic
way a server keeps track of a logged-in session. **localStorage** saves
data only in the browser, with no automatic connection to the server,
and it sticks around indefinitely until something explicitly clears it.
**sessionStorage** works just like localStorage, but it's wiped out as
soon as that specific browser tab is closed.

None of these are a full database — they're all meant for relatively
small amounts of data, stored on the one device and browser someone
happens to be using.
  `.trim(),
    analogy:
      "A cookie is like a stamped hand at a venue — you show it every time you walk up to a counter (the server) so they recognize you. localStorage is like a locker you keep at home that stays packed until you empty it yourself. sessionStorage is like a locker at the venue itself — once you leave for the night, it's cleared out.",
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
          "Both use the same simple key-value API, but localStorage data survives closing the browser entirely, while sessionStorage data disappears once that tab is closed.",
        walkthrough: [
          { code: 'localStorage.setItem("theme", "dark");', explanation: "Saves a value under the key 'theme'. This will still be there tomorrow, even after the browser restarts." },
          { code: 'sessionStorage.setItem("draftText", "Hello, world");', explanation: "Saves a value scoped to this one tab's current session. Closing this tab erases it." },
          { code: 'localStorage.getItem("theme")', explanation: "Reads a previously stored value back out, returning null if that key was never set." },
        ],
      },
      {
        title: "A basic cookie",
        code: `document.cookie = "sessionId=abc123; max-age=3600";`,
        explanation:
          "Unlike localStorage or sessionStorage, this cookie is automatically attached to every future request this browser makes to the same site, which is what lets a server recognize a returning user without any extra JavaScript on the server's end.",
      },
    ],
    howItWorks: `
Cookies are stored by the browser and automatically included in the
headers of every request sent to the domain that set them, which is
exactly what lets a server recognize the same visitor across multiple
requests. localStorage and sessionStorage, by contrast, are pure
browser-side storage — nothing about them is sent to a server
automatically; JavaScript has to explicitly read them and send their
contents if a server needs to know about them. All three are scoped per
origin, meaning one website generally can't read another website's
stored data.
  `.trim(),
    whyItExists: `
These tools exist because different problems need different lifetimes
and different visibility. A login session needs the server to
recognize you on every request, which is exactly what cookies were
built for. A saved preference or draft only needs to live in the
browser and doesn't need to burden every single network request with
extra data, which is what localStorage and sessionStorage are for
instead.
  `.trim(),
    whenToUse: `
Use cookies when the server itself needs to know the stored value on
every request, like an authentication session. Use localStorage for
settings or data that should persist across visits but only matter to
the browser, like a saved theme preference. Use sessionStorage for
short-lived, per-tab data that shouldn't outlive the current visit,
like an in-progress multi-step form.
  `.trim(),
    whenNotToUse: `
None of these are appropriate for large amounts of data or anything
sensitive that truly needs strong protection — they're all readable
from the browser's storage/dev tools by anyone with access to that
device. For sensitive data or data that must be reliably shared across
devices, that belongs on the server, in an actual database.
  `.trim(),
    commonMistakes: [
      "Storing sensitive information like passwords directly in localStorage, where it's easily readable by anyone with device or script access.",
      "Expecting sessionStorage data to persist after closing the tab, when it's specifically designed not to.",
      "Overloading cookies with large amounts of data, which slows down every single request since cookies are sent with each one automatically.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use localStorage to save a user's chosen theme, and load it back when the page reopens." },
      { difficulty: "Medium", prompt: "Build a simple multi-step form that saves progress in sessionStorage, and confirm the progress disappears after closing the tab." },
      { difficulty: "Hard", prompt: "Explain, with a concrete scenario, why an authentication session is typically implemented using cookies rather than localStorage." },
    ],
    interviewQuestions: [
      { question: "What's the key difference between cookies and localStorage?", answer: "Cookies are automatically sent with every request to the server that set them, making them suited for server-side session tracking. localStorage stays entirely in the browser and is never sent automatically." },
      { question: "What's the difference between localStorage and sessionStorage?", answer: "They share the same API, but localStorage persists indefinitely until explicitly cleared, while sessionStorage is cleared automatically once its specific tab is closed." },
      { question: "Why shouldn't sensitive data be stored in localStorage?", answer: "localStorage is plain, unencrypted browser storage readable by any script running on that page or anyone with access to the browser's dev tools, so it offers no real protection for sensitive values." },
      { question: "What are the typical size limits for localStorage/sessionStorage versus a single cookie?", answer: "localStorage and sessionStorage typically allow around 5-10MB per origin (varies by browser), while a single cookie is limited to roughly 4KB, and browsers also cap the total number of cookies allowed per domain." },
      { question: "Is the localStorage/sessionStorage API synchronous or asynchronous, and why does that matter?", answer: "It's synchronous — every read and write blocks the calling JavaScript thread until it completes. For small amounts of data this is unnoticeable, but storing or retrieving large values can briefly block the main thread and make the page feel unresponsive, which is one reason it's meant for small data only." },
      { question: "When would you reach for IndexedDB instead of localStorage?", answer: "When you need to store significantly more data, structured/queryable data (not just string key-value pairs), or want asynchronous access that doesn't block the main thread — IndexedDB supports indexes, transactions, and much larger storage quotas, at the cost of a considerably more complex API." },
      { question: "If a site is open in two different browser tabs, do they share the same localStorage data? What about sessionStorage?", answer: "localStorage is shared across every tab and window for the same origin — a write in one tab is immediately visible to the others. sessionStorage is scoped to that one specific tab/window, so each tab has its own independent sessionStorage even for the same site." },
      { question: "Does duplicating an existing browser tab preserve its sessionStorage, and does opening a fresh tab to the same URL do the same?", answer: "Duplicating a tab actually copies its sessionStorage into the new tab, since browsers treat it as continuing the same browsing context. Opening a brand-new tab and navigating to the same URL does not — that tab starts with empty sessionStorage, since it's a new top-level browsing context." },
      { question: "If a user clears their browser's cookies, does that also clear localStorage?", answer: "Not necessarily — cookies and localStorage are separate storage mechanisms, and a browser's 'clear cookies' option may or may not also clear other site data depending on the exact setting chosen ('cookies only' versus 'all site data'), so code shouldn't assume clearing one implies the other was cleared too." },
      { question: "What does the `HttpOnly` flag on a cookie do, and why does it matter for security?", answer: "It prevents the cookie from being read or written via `document.cookie` in JavaScript — only the browser's HTTP layer can access it. This blocks a common XSS attack path where injected script tries to steal a session cookie, since the malicious script simply can't see it." },
      { question: "What do the `Secure` and `SameSite` cookie attributes protect against?", answer: "Secure ensures the cookie is only ever sent over HTTPS connections, protecting it from being exposed on an unencrypted network. SameSite restricts whether the cookie is sent along with cross-site requests, which helps mitigate CSRF attacks that rely on a browser automatically attaching cookies to requests triggered from another site." },
      { question: "Why is an auth token often stored in a cookie rather than localStorage, from a security standpoint?", answer: "A cookie can be marked HttpOnly, making it invisible to JavaScript and therefore immune to being stolen via an XSS attack that injects malicious script. Anything in localStorage is always readable by any script running on the page, so an XSS vulnerability anywhere on the site can exfiltrate a token stored there directly." },
      { question: "What does 'same-origin' mean in the context of storage scoping?", answer: "Two URLs are same-origin only if their protocol, host, and port all match exactly. Storage (cookies have slightly different, host-based rules, but localStorage/sessionStorage strictly) is scoped per origin, so a script on one origin generally cannot read another origin's stored data." },
      { question: "How can one open tab find out that another tab just changed a value in localStorage?", answer: "By listening for the `storage` event on `window` — the browser fires it in every *other* same-origin tab/window when localStorage changes, passing along the key, old value, and new value." },
      { question: "Why doesn't the `storage` event fire in the same tab that made the change?", answer: "It's designed specifically to let other browsing contexts react to a change they didn't make themselves — the tab that performed the write already knows the new value directly, so firing the event there too would be redundant; the spec only dispatches it to other tabs/windows sharing that storage." },
      { question: "What does `localStorage.getItem(\"missingKey\")` return if that key was never set?", answer: "It returns `null`, not `undefined` — so checking for a missing key should compare against null (or use a falsy check), not assume JavaScript's usual undefined for absent properties." },
      { question: "Why can localStorage only store strings, and how do you work around that to store objects?", answer: "The Web Storage API's get/setItem methods only accept and return strings by design. To store structured data, you serialize it with `JSON.stringify()` before saving and parse it back with `JSON.parse()` after reading, converting to/from a string representation each time." },
      { question: "What happens if you try to write more data than localStorage's quota allows?", answer: "The browser throws a `QuotaExceededError` (or similar DOMException) from `setItem`, rather than silently failing or truncating the data — so code writing potentially large values should wrap the call in a try/catch to handle that case gracefully." },
      { question: "What do a cookie's `path` and `domain` attributes control?", answer: "`path` restricts the cookie to being sent only for requests whose URL path starts with that value (e.g. limiting it to `/admin`). `domain` controls which hosts the cookie is sent to — set broadly enough, it can be shared across subdomains of the same site rather than being scoped to just the exact host that set it." },
      { question: "Why might a 'remember me' login feature use a long-lived cookie rather than a long-lived value in localStorage?", answer: "The server needs to recognize the returning user automatically on the very first request of a new visit, before any of the page's JavaScript has even run — a cookie is attached to that initial request by the browser itself, while localStorage is only accessible after the page's script executes and would require an extra round-trip to inform the server." },
    ],
    relatedTopics: ["web-security-basics"],
    keywords: ["cookies", "localstorage", "sessionstorage", "browser storage", "web storage"],
  },
  {
    id: "web-accessibility",
    title: "Web Accessibility (a11y)",
    level: "intermediate",
    description:
      "Designing and building a site so people using assistive technology, like screen readers or keyboard-only navigation, can actually use it.",
    explanation: `
Not everyone browses the web the same way. Some people can't see a
screen at all and rely on software that reads the page aloud. Some
people can't use a mouse and navigate entirely with a keyboard. Some
people have low vision and need large, high-contrast text. A site that
only works if you can see a screen clearly and click precisely with a
mouse simply doesn't work for a meaningful number of people.

**Accessibility**, often abbreviated **a11y** (the 11 stands for the
number of letters skipped between the "a" and the "y"), is the practice
of building sites that work for people using assistive technology, not
just a typical mouse-and-monitor setup. This isn't a separate feature
bolted on afterward — it's mostly about doing the basics correctly: using
real, semantic HTML elements instead of generic ones styled to look the
part, giving every image a meaningful text description (**alt text**)
for people who can't see it, and making sure every interactive element
can be reached and operated using only a keyboard.

A big piece of this is **focus management** — making sure that as a
keyboard user tabs through a page, the currently focused element is
clearly visible, follows a sensible order, and that opening things like
a modal dialog moves focus into it (and traps it there) so a keyboard
user isn't left tabbing through content hidden behind it.
  `.trim(),
    analogy:
      "It's like designing a building with ramps and clear signage alongside stairs — most people might not notice they're there, but for someone using a wheelchair or who can't read small print, they're the difference between being able to get in the door at all.",
    examples: [
      {
        title: "Meaningful alt text",
        code: `<!-- Bad: unhelpful or missing -->
<img src="chart.png" alt="image">

<!-- Good: describes the actual content -->
<img src="chart.png" alt="Bar chart showing sales rising 20% from January to March">`,
        explanation:
          "A screen reader announces the alt text in place of the image. 'image' tells a blind user nothing useful, while a real description lets them understand what the chart actually shows.",
        walkthrough: [
          { code: 'alt="image"', explanation: "Technically present, but conveys no actual information — a screen reader user learns nothing about the chart's content." },
          { code: 'alt="Bar chart showing sales rising 20%..."', explanation: "Describes what the image actually communicates, giving a non-visual user equivalent information to a sighted user glancing at the chart." },
        ],
      },
      {
        title: "Keyboard-reachable custom controls",
        code: `<!-- Not focusable or announced as a button by default -->
<div onclick="submitForm()">Submit</div>

<!-- Reachable by keyboard, announced correctly by screen readers -->
<button onclick="submitForm()">Submit</button>`,
        explanation:
          "A div with a click handler is invisible to keyboard navigation and screen readers by default — it's just a generic block of text as far as assistive technology is concerned. A real button element is automatically focusable, triggerable with the keyboard, and announced as a button.",
      },
    ],
    howItWorks: `
Assistive technology, like a screen reader, doesn't see rendered pixels
— it reads the underlying HTML structure (often via the DOM) and uses
each element's role, name, and state to describe the page out loud or
via braille output. Semantic elements come with these roles already
built in (a button announces itself as "button" and responds to
keyboard activation automatically); generic elements styled to merely
look like a button carry none of that information unless it's added
back manually.
  `.trim(),
    whyItExists: `
Accessibility work exists because the web is meant to be usable by
everyone, not only people who can see a screen clearly and operate a
mouse precisely. Beyond that, in many places it's also a legal
requirement for certain kinds of sites. Practically, accessible
practices — clear structure, sufficient contrast, keyboard support —
also tend to make a site better for everyone, not just people using
assistive technology.
  `.trim(),
    whenToUse: `
Accessibility considerations belong in every project from the start,
not bolted on at the end — using semantic HTML, writing real alt text,
and testing keyboard navigation cost very little when done as you
build, and cost far more to retrofit later.
  `.trim(),
    whenNotToUse: `
There's essentially no valid case for skipping accessibility on a
public-facing site. The only reasonable trade-off is depth: a small
personal project might not warrant a full accessibility audit, but even
then, the basics (semantic tags, alt text, keyboard support) cost
little and help everyone.
  `.trim(),
    commonMistakes: [
      "Using generic elements styled to look interactive instead of real buttons or links, breaking keyboard and screen-reader support.",
      "Writing unhelpful alt text like 'image' or 'photo1.jpg' instead of describing what the image actually conveys.",
      "Trapping keyboard focus nowhere (or everywhere) — forgetting to move focus into a newly opened dialog, or forgetting to let focus escape it when it closes.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Add meaningful alt text to three images on a sample page, describing what each one actually conveys." },
      { difficulty: "Medium", prompt: "Take a page and try navigating it using only the Tab and Enter keys. Note every interactive element you couldn't reach or activate." },
      { difficulty: "Hard", prompt: "Rebuild a custom dropdown menu made of styled divs using proper semantic elements and keyboard support, and verify it works with Tab, Enter, and Escape." },
    ],
    interviewQuestions: [
      { question: "What does web accessibility mean?", answer: "Designing and building sites so people using assistive technology, such as screen readers or keyboard-only navigation, can perceive, understand, and use them." },
      { question: "Why does alt text matter, and what makes it good?", answer: "It's what a screen reader announces in place of an image, so it matters because it's often the only way a non-sighted user learns what the image conveys. Good alt text describes the actual content or purpose of the image rather than being generic or missing." },
      { question: "Why is using a real <button> element better than a styled <div> for something clickable?", answer: "A real button is automatically focusable, keyboard-activatable, and announced correctly by screen readers, while a div carries none of that behavior unless it's manually reimplemented." },
      { question: "What does ARIA stand for, and what's the 'first rule of ARIA'?", answer: "ARIA stands for Accessible Rich Internet Applications — a set of HTML attributes that describe roles, states, and properties to assistive technology. The first rule of ARIA is: if a native HTML element or attribute already provides the semantics and behavior you need, use that instead of recreating it with ARIA on a generic element, since native elements come with correct behavior built in and ARIA alone only adds semantics, not behavior." },
      { question: "What's the difference between `aria-label` and `aria-labelledby`?", answer: "aria-label provides an accessible name directly as a string value on the attribute itself. aria-labelledby instead points to the id of another element already on the page, and its text content is used as the accessible name — useful when the label text is already visible elsewhere and shouldn't be duplicated." },
      { question: "What does `aria-hidden=\"true\"` do, and what's a common mistake with it?", answer: "It removes an element (and its descendants) from the accessibility tree, so screen readers skip over it entirely as if it didn't exist. A common mistake is applying it to an element that's still visually visible and focusable — a screen reader user's focus can land on a control that's been hidden from being announced, which is confusing and effectively broken." },
      { question: "What is a 'landmark region', and why does it matter for accessibility?", answer: "It's a semantic sectioning element like `<nav>`, `<main>`, `<header>`, or `<aside>` (or an equivalent ARIA landmark role) that marks a major region of the page. Screen reader users commonly navigate by jumping directly between landmarks instead of reading the whole page top to bottom, so their presence lets a user quickly get to the content they actually want." },
      { question: "What's the difference between `tabindex=\"0\"`, `tabindex=\"-1\"`, and a positive `tabindex` value?", answer: "tabindex=\"0\" inserts the element into the natural tab order at the point matching the DOM. tabindex=\"-1\" makes it programmatically focusable (via JavaScript, e.g. after opening a dialog) but skips it in normal Tab-key navigation. A positive value forces it earlier in tab order than 0, which is generally discouraged since it creates a custom order that's easy to get out of sync with the visual layout and hard to maintain." },
      { question: "A custom dropdown is built from a `<div>` with `tabindex=\"0\"` but no keyboard event handlers. What happens when a keyboard user tabs to it and presses Enter?", answer: "Nothing — tabindex=\"0\" only makes the element reachable by Tab, it doesn't make it *activatable*. A native `<button>` responds to Enter/Space automatically, but a plain div requires JavaScript to explicitly listen for those key presses and trigger the equivalent action; without that, the div is a dead end for keyboard users." },
      { question: "Why is focus trapping necessary in a modal dialog?", answer: "Without it, Tab can move focus out of the visible dialog and onto content underneath it that's supposed to be inaccessible while the modal is open — a keyboard user ends up tabbing through hidden page content they can't see, with no clear way back into the dialog. Trapping keeps Tab cycling only among the dialog's own focusable elements until it's closed." },
      { question: "What contrast ratio does WCAG's AA level require for normal text versus large text?", answer: "At least 4.5:1 for normal-sized text, and a lower 3:1 for large text (roughly 18pt/24px regular weight or 14pt/18.66px bold and larger), since larger text is inherently easier to distinguish from its background even at lower contrast." },
      { question: "Why might you use a 'visually-hidden' CSS technique instead of `display: none` for some content?", answer: "display: none (and visibility: hidden) removes content from the accessibility tree as well as visually, so a screen reader skips it too. A visually-hidden class (clipping the element to a 1px box, off-screen, without display:none) keeps it available to assistive technology while hiding it from sighted users — used for things like skip links or extra context meant only for screen readers." },
      { question: "What is a 'skip link', and what problem does it solve?", answer: "It's a link, usually the first focusable element on the page, that jumps straight to the main content, bypassing repeated navigation menus. Without it, a keyboard or screen reader user has to tab through the same nav links on every single page before reaching the actual content." },
      { question: "Why is removing the default focus outline with `outline: none` a common accessibility trap?", answer: "The focus outline is how a keyboard user sees which element is currently active. Removing it without providing any visible replacement style (like a custom box-shadow or border on :focus-visible) leaves keyboard users with no way to tell where they are on the page, even though the interaction still technically works." },
      { question: "What does a `<label>` element's `for` attribute do, and why does it matter beyond just sighted mouse users?", answer: "It associates the label with a specific form control by id, which does two things: clicking anywhere on the label text also focuses/activates the input (a bigger, easier click target for anyone with limited motor precision), and a screen reader announces the label text together with the input when it receives focus, rather than announcing an unlabeled field." },
      { question: "What does the `role` attribute do when you're stuck using a non-semantic element for some custom widget?", answer: "It tells assistive technology what kind of control the element represents (e.g. role=\"button\", role=\"tablist\"), so it's announced correctly. It only communicates semantics, though — it doesn't add any of the native keyboard behavior or focusability a real element would have, so those still need to be implemented manually alongside it." },
      { question: "What is the accessibility tree, and how does it relate to the DOM?", answer: "It's a separate tree, derived from the DOM, that represents each element's accessible role, name, state, and value — the actual structure assistive technology like screen readers consumes. Elements or attributes that are purely presentational (or explicitly hidden via aria-hidden) can be present in the DOM but omitted from the accessibility tree, and semantics added via ARIA can change how a node appears there without changing the DOM at all." },
      { question: "A form shows an invalid input by giving it a red border and nothing else — what's the accessibility problem, and how would you fix it?", answer: "Color alone doesn't convey the error to colorblind users or anyone using a screen reader, which can't perceive a border color change at all. A fix pairs the visual indicator with a text error message associated to the field via `aria-describedby`, and marks the field with `aria-invalid=\"true\"` so assistive technology announces the invalid state explicitly." },
      { question: "A screen reader announces a form field's error message twice — what's a likely cause?", answer: "The same error text is probably exposed to assistive technology through two separate mechanisms at once — for example, it's both visually rendered inside content referenced by `aria-describedby` and also announced separately via an `aria-live` region updating with the same message, so the user hears it announced from both paths." },
      { question: "What's the difference between `aria-live=\"polite\"` and `aria-live=\"assertive\"`?", answer: "polite waits until the screen reader finishes whatever it's currently announcing before reading the update, so it doesn't interrupt the user. assertive interrupts immediately, regardless of what's being read — reserved for urgent updates, since overusing it is disorienting." },
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
      "What actually makes a page feel slow to use, and the basic techniques for making it feel fast.",
    explanation: `
A page can feel slow for a few very concrete reasons, and most of them
come down to the browser being kept busy or waiting before it can show
or use something. A big stylesheet or script that has to fully download
and run *before* the browser can display anything is called
**render-blocking** — the page sits blank while the browser waits on
it. Large, unoptimized images can take a long time to download,
delaying everything on the page that depends on them. And a large
amount of JavaScript, even after it's downloaded, still takes time for
the browser to parse and run, which can leave a page looking finished
but unresponsive to clicks and taps.

There are a handful of well-established techniques for addressing
each of these. **Lazy loading** means not fetching something (like an
image far down the page) until it's actually about to be needed,
instead of loading everything up front. **Minification** strips
unnecessary characters (whitespace, long variable names) out of CSS and
JavaScript files before they're sent, so there's less data to transfer.
And **caching** lets a browser reuse a file it already downloaded on a
previous visit, instead of re-downloading something that hasn't
changed.
  `.trim(),
    analogy:
      "It's like being handed a phone book at the door before you're allowed into a restaurant, when all you needed was the menu. Render-blocking resources make you wait through unrelated work before you get the one thing you actually came for.",
    examples: [
      {
        title: "Avoiding render-blocking scripts",
        code: `<!-- Blocks rendering until fully downloaded and run -->
<script src="analytics.js"></script>

<!-- Downloads in the background, runs after parsing finishes -->
<script src="analytics.js" defer></script>`,
        explanation:
          "Without defer, the browser stops parsing the rest of the HTML to fetch and run the script immediately. With defer, the script downloads in parallel and only runs once the page has finished parsing, so it no longer delays the visible page.",
        walkthrough: [
          { code: '<script src="analytics.js"></script>', explanation: "The browser pauses HTML parsing here, fetches the script, and runs it before continuing — delaying everything after it on the page." },
          { code: "defer", explanation: "Tells the browser to fetch this script in the background without pausing parsing, and to run it only after the HTML is fully parsed." },
        ],
      },
      {
        title: "Lazy loading images",
        code: `<img src="hero.jpg" alt="Product hero image">
<img src="footer-banner.jpg" alt="Seasonal promotion" loading="lazy">`,
        explanation:
          "The hero image loads immediately since it's visible right away. The footer banner, likely far below the visible area when the page first loads, is marked loading=\"lazy\" so the browser only fetches it once the user scrolls close to it.",
      },
    ],
    howItWorks: `
The browser can only do so much at once: parsing HTML, downloading
files, parsing and running CSS and JavaScript, and rendering the result
all compete for its attention. Techniques like deferring scripts,
lazily loading offscreen images, and minifying files all work by
reducing or rescheduling that competing work — either by shrinking how
much data has to move over the network, or by making the browser wait
less before it can show something useful. Caching works differently: it
avoids the network entirely for files the browser recognizes it already
has an unchanged copy of.
  `.trim(),
    whyItExists: `
Performance work exists because a slow page directly costs user
attention and, for businesses, real measurable outcomes — people
abandon slow-loading pages far more readily than fast ones. As the
average webpage has grown heavier over time (more images, more
scripts, more third-party embeds), these techniques became necessary
just to keep pages usable rather than optional polish.
  `.trim(),
    whenToUse: `
Apply these techniques by default on any real-world website: defer
non-critical scripts, lazy-load offscreen images, minify production CSS
and JavaScript, and set caching headers on assets that don't change
often. Pay closer attention to performance whenever users report a page
feeling slow, or whenever measuring actual load times reveals a
problem.
  `.trim(),
    whenNotToUse: `
Extremely small or low-traffic internal tools may not need aggressive
performance tuning — the cost of, say, setting up a whole build
pipeline for minification might outweigh the benefit if load time is
already imperceptible. Optimizing prematurely, before knowing where
real time is actually being spent, can also waste effort on the wrong
thing.
  `.trim(),
    commonMistakes: [
      "Loading large, unoptimized images at full resolution when a much smaller version would look identical on screen.",
      "Marking a critical, above-the-fold image as lazy-loaded, delaying content the user sees immediately.",
      "Assuming minification alone fixes a performance problem caused by simply shipping too much JavaScript in the first place.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Add the loading=\"lazy\" attribute to images that appear below the visible area on a sample page." },
      { difficulty: "Medium", prompt: "Take a page with a blocking <script> tag in the head and change it to use defer, then explain the difference in page load behavior." },
      { difficulty: "Hard", prompt: "Using your browser's Network panel, measure a real page's load time, identify the largest resource slowing it down, and propose one concrete fix." },
    ],
    interviewQuestions: [
      { question: "What does 'render-blocking' mean?", answer: "A resource, like a script or stylesheet, that the browser must fully download (and sometimes run) before it can continue rendering the page, causing a visible delay." },
      { question: "What is lazy loading, and when is it appropriate?", answer: "Deferring the loading of a resource, commonly an image, until it's actually about to be needed, such as when it scrolls near the visible viewport. It's appropriate for offscreen content, but not for content visible immediately on page load." },
      { question: "How does caching improve web performance?", answer: "It lets a browser reuse a previously downloaded file instead of re-fetching it from the network, as long as the file hasn't changed, saving both time and bandwidth on repeat visits." },
      { question: "What are the Core Web Vitals, and which three metrics make up the current set?", answer: "They're a specific set of metrics Google uses to measure real-world user experience: Largest Contentful Paint (LCP, loading speed), Interaction to Next Paint (INP, responsiveness), and Cumulative Layout Shift (CLS, visual stability)." },
      { question: "What does Largest Contentful Paint (LCP) measure, and what's considered a good score?", answer: "It measures how long it takes for the largest visible content element (often a hero image or a large block of text) to finish rendering after the page starts loading. A score of 2.5 seconds or less is generally considered good." },
      { question: "What does Cumulative Layout Shift (CLS) measure, and what commonly causes a poor score?", answer: "It measures how much visible content unexpectedly shifts position during page load, weighted by how much of the viewport moved and how far. Common causes include images or embeds without reserved width/height, content (like an ad or banner) injected above existing content after load, and web fonts swapping in with different metrics than their fallback." },
      { question: "What replaced First Input Delay (FID) as a Core Web Vital, and why?", answer: "Interaction to Next Paint (INP) replaced it. FID only measured the delay before the *first* interaction started being processed, missing responsiveness problems later in a page's life. INP instead measures responsiveness across every interaction throughout the page's lifecycle, giving a more complete picture." },
      { question: "What are the main stages of the critical rendering path?", answer: "The browser parses HTML into a DOM, parses CSS into a CSSOM, combines the two into a render tree of only the visible nodes with their computed styles, calculates each node's position and size (layout), and finally paints pixels to the screen." },
      { question: "Why is CSS treated as render-blocking by default?", answer: "The browser deliberately waits for the full CSSOM to be built before rendering anything, to avoid painting unstyled content and then immediately repainting it once styles arrive — a jarring flash of unstyled content (FOUC) that blocking avoids by holding off the first paint until styling is known." },
      { question: "What's the tradeoff between putting a `<link rel=\"stylesheet\">` in the `<head>` versus at the end of `<body>`?", answer: "In the head, the browser blocks rendering until the CSS is loaded, delaying first paint but guaranteeing the page never appears unstyled. At the end of the body, the browser may paint unstyled content briefly before the stylesheet loads and reflows everything, which usually looks worse even though something technically appears on screen sooner." },
      { question: "What's the difference between `async` and `defer` on a `<script>` tag?", answer: "Both let the script download without blocking HTML parsing. async runs the script the instant it finishes downloading, which can interrupt parsing and doesn't guarantee execution order relative to other scripts. defer instead waits until the HTML is fully parsed, and multiple deferred scripts always run in their original document order — making defer the safer default for scripts that depend on the DOM or on each other." },
      { question: "Why is reflow (layout) generally more expensive than repaint?", answer: "A repaint just redraws pixels that changed appearance (like a color) without affecting geometry. A reflow recalculates the position and size of the changed element *and* potentially every element affected by that change, which can cascade through large parts of the page, making it considerably more computationally expensive." },
      { question: "What is 'layout thrashing', and what's a common way it happens by accident?", answer: "It's when code repeatedly forces the browser to synchronously recalculate layout many times in a tight loop, rather than once. A classic cause is reading a layout-dependent property (like `element.offsetHeight`) immediately after writing a style change, inside a loop — each read forces the browser to flush and recompute layout before it can answer, over and over." },
      { question: "Why can overusing `will-change` hurt performance instead of helping it?", answer: "will-change is a hint that tells the browser to preemptively promote an element onto its own compositing layer in anticipation of an animation. Applying it broadly or to elements that don't actually need it creates many extra layers, consuming more GPU memory and potentially slowing things down rather than speeding them up." },
      { question: "When would you still need an Intersection Observer-based lazy-loading approach instead of native `loading=\"lazy\"`?", answer: "When you need more control than the browser default gives you — like lazy-loading something other than images/iframes (e.g. a heavy component), customizing how far in advance loading starts, or supporting older browsers that don't implement the loading attribute." },
      { question: "What is code splitting, and how does it help a large JavaScript application load faster?", answer: "It breaks a single large JavaScript bundle into smaller chunks that are loaded on demand — for example, per route — so a user's first visit only downloads and parses the code needed for the page they're actually viewing, instead of the entire application upfront." },
      { question: "What does tree shaking remove from a JavaScript bundle?", answer: "Dead code — exports from a module that are never actually imported or used anywhere in the final application — based on static analysis of import/export statements, so the shipped bundle doesn't include library code the app never calls." },
      { question: "What's the difference between `<link rel=\"preload\">`, `rel=\"prefetch\"`, and `rel=\"preconnect\"`?", answer: "preload tells the browser to fetch a resource it will definitely need for the *current* page, with high priority, sooner than it would discover it naturally. prefetch fetches something likely needed for a *future* navigation, at low priority. preconnect just establishes the network connection (DNS, TCP, TLS) to another origin ahead of time, without fetching a specific file, to save that setup time once a request to it is actually made." },
      { question: "Your page's LCP element is a large hero image loading late. Name two concrete ways to improve it.", answer: "Preload the image with `<link rel=\"preload\" as=\"image\">` so the browser fetches it earlier instead of discovering it only after parsing reaches the img tag, and serve it as an appropriately sized, modern-format (e.g. WebP/AVIF) file so there's simply less data to download before it can render." },
      { question: "Does minifying JavaScript reduce how long the browser takes to execute it?", answer: "Not meaningfully — minification shrinks file size (less to download and parse), but the actual logic still runs the same number of operations, so execution time stays roughly the same. This is why shipping too much JavaScript in the first place can't be fixed by minification alone." },
      { question: "What is `font-display: swap`, and what performance/visual tradeoff does it introduce?", answer: "It tells the browser to render text immediately in a fallback font while a custom web font is still downloading, then swap to the real font once it arrives, avoiding invisible text during the wait. The tradeoff is that if the fallback and web font have different metrics (character widths, line height), the swap itself can cause a visible layout shift, hurting CLS." },
      { question: "Why does compressing assets with gzip or Brotli improve load performance, and which one usually compresses better?", answer: "Both reduce the number of bytes that actually travel over the network for text-based assets like HTML, CSS, and JS, so they download faster. Brotli generally achieves a better compression ratio than gzip for the same content, though it can take slightly longer to compress, which matters more for build time than for the already-compressed file being served." },
      { question: "How did HTTP/2 multiplexing reduce the value of older performance tricks like bundling many files together or sharding assets across multiple domains?", answer: "HTTP/1.1 could only send a limited number of requests in parallel per connection, so bundling files (fewer requests) and domain sharding (more parallel connections) worked around that limit. HTTP/2 multiplexes many requests over a single connection simultaneously, removing much of that per-request overhead, so aggressively bundling everything into one giant file can actually hurt caching efficiency without the payoff it used to have." },
      { question: "Using browser DevTools, how would you tell whether a slow page load is bottlenecked by network transfer or by JavaScript execution?", answer: "The Network panel's waterfall shows how long each resource actually spent downloading versus waiting, which points to a network bottleneck if requests are large or slow. The Performance panel's main-thread flame chart instead shows time spent parsing/executing/compiling JavaScript and running layout/paint, which points to a CPU-bound bottleneck if that's where the time is concentrated." },
      { question: "An `<img>` has no `width`/`height` attributes set. What layout symptom can result once it finishes loading on a slow connection, and how do you prevent it?", answer: "Before the image loads, the browser doesn't know its dimensions and reserves no space for it, so surrounding content occupies that area temporarily; once the image arrives, everything below it jumps to make room — a layout shift counted against CLS. Setting explicit width/height attributes (or a CSS `aspect-ratio`) lets the browser reserve the correct space upfront, before the image has even started downloading." },
      { question: "What's the Core Web Vitals tradeoff between client-side rendering (CSR) and server-side rendering (SSR)?", answer: "SSR typically produces better LCP/FCP on first load, since the browser receives HTML with real content already in it rather than an empty shell waiting on JavaScript to fetch and render data. CSR often has a slower first load for that reason, but can feel faster on subsequent in-app navigations once the JavaScript bundle is already loaded and only data needs fetching." },
      { question: "What does Time to First Byte (TTFB) measure, and what does a slow TTFB usually indicate?", answer: "It measures the time from a request being sent until the first byte of the response arrives, which mostly reflects server-side work — routing, database queries, server-side rendering — rather than front-end asset delivery. A slow TTFB points to a backend or network-latency problem, not something fixable with front-end techniques like minification or lazy loading." },
      { question: "Mechanically, how does a CDN improve load performance?", answer: "It caches copies of static assets on servers geographically distributed closer to users, so a request is served from a nearby edge location instead of traveling all the way to a single origin server — reducing the network latency (round-trip time) involved in fetching the resource." },
      { question: "A returning visitor loads a page much faster than a first-time visitor loading the exact same assets. What's the likely mechanism, given proper `Cache-Control` headers?", answer: "The browser's disk/memory cache already holds a copy of assets like CSS, JS, and images from the previous visit, and Cache-Control headers (e.g. a max-age) tell it those files are still valid, so it reuses them straight from cache instead of re-requesting them from the network at all — the first-time visitor has no such cache and must download everything." },
      { question: "What's a common pitfall of giving a file like `app.js` a very long `Cache-Control: max-age`?", answer: "After deploying a new version, users with a cached copy keep using the stale old file until the cache expires, potentially running outdated (or broken, if it no longer matches a changed backend) code for a long time. The standard fix is to include a content hash in the filename (e.g. app.3f2a1c.js), so a new deploy produces a new filename and is fetched fresh immediately, while the long cache lifetime remains safe since a given filename's content never changes." },
    ],
    prerequisites: ["browser-rendering"],
    relatedTopics: ["browser-rendering", "responsive-design"],
    keywords: ["performance", "lazy loading", "minification", "caching", "render-blocking"],
  },
];
