import type { Topic } from "../../types/content";

export const webFundamentalsBeginnerTopics: Topic[] = [
  {
    id: "how-the-web-works",
    title: "How the Web Works",
    level: "beginner",
    description:
      "What happens, step by step, between typing a web address and seeing the page.",
    explanation: `
You type an address, press enter, and a page appears. It feels instant,
but it's a chain of hand-offs between machines you never see.

**1. Look up.** The address you typed is a human-friendly name, not a
location a computer can connect to. A lookup step turns the name into the
numeric address of a specific machine.

**2. Request.** Your browser sends that machine a message: "please send me
the page at this address." The machine is a **server**, a computer that
listens for these requests all day.

**3. Respond.** The server sends back a response. It might be a file on
disk, or something it builds on the spot from a database. Usually it's a
document that describes the page's content and structure.

**4. Render.** Your browser reads the document, fetches any extra files it
mentions (images, styles, code), and paints everything on screen.

Look up, request, respond, render: that's how the web works. Later topics
look at each step in detail.
  `.trim(),
    analogy:
      "It's like mailing a letter to a company when you only know its name. A directory looks up the street address, the letter travels there, someone writes a reply, and the reply travels back to your mailbox.",
    examples: [
      {
        title: "The trip a request takes",
        code: `1. You type: example.com
2. Browser looks up which server "example.com" points to
3. Browser sends: "GET / please"
4. Server sends back: an HTML document
5. Browser reads the document and displays it`,
        explanation:
          "The whole round trip in plain steps. No protocol names yet, just the shape of the conversation.",
        walkthrough: [
          { code: "You type: example.com", explanation: "You give the browser a readable name, not a machine address." },
          { code: "Browser looks up which server...", explanation: "A lookup turns the name into the server's actual location." },
          { code: 'Browser sends: "GET / please"', explanation: "The browser asks the server for a page, here the homepage." },
          { code: "Server sends back: an HTML document", explanation: "The server replies with the page's content and structure." },
          { code: "Browser reads the document and displays it", explanation: "The browser turns the document into the page you see." },
        ],
      },
      {
        title: "A page is rarely just one file",
        code: `index.html          <- the page structure
  ├── styles.css     <- fetched separately, for appearance
  ├── logo.png       <- fetched separately, an image
  └── app.js         <- fetched separately, for behavior`,
        explanation:
          "The first document almost always references more files. The browser spots those references and fetches each one, so one page usually means several requests.",
      },
    ],
    howItWorks: `
The process rests on three systems working together:

- a naming system that maps readable addresses to machine locations
- a network that carries messages between any two connected computers
- a shared format that browser and server both use to ask for and describe a page

Your operating system and browser handle the actual networking. At this
level, what matters is the sequence: look up, request, respond, render.
  `.trim(),
    diagram: `
[ You ]  --type address-->  [ Browser ]
                                 |
                          1. look up server
                                 |
                                 v
                          [ Naming lookup ]
                                 |
                          2. send request
                                 v
                            [  Server  ]
                                 |
                          3. send response
                                 v
                          [ Browser renders ]
                                 |
                                 v
                          [   Page shown   ]
  `.trim(),
    whyItExists: `
The web was built to connect *any* browser to *any* server, run by
different people on different machines anywhere in the world. Splitting
the job into separate steps (naming, requesting, responding, rendering)
let each piece be built and improved on its own.

That's why typing an address into any browser works, no matter who built
the browser or runs the server.
  `.trim(),
    whenToUse: `
Use this model when a site is slow or broken and you need to find
*where* the problem is. Is the lookup failing, is the server not
responding, or is the page failing to render?

Every deeper web topic (HTTP, DNS, rendering, caching) is a closer look at
one step of this journey.
  `.trim(),
    whenNotToUse: `
Everyday tasks like writing HTML or styling a button live entirely in the
"render" step, so you don't need the whole chain for them. The model helps
most when something crosses between browser and server, or goes wrong.
  `.trim(),
    commonMistakes: [
      "Thinking the address you type is the server's location, not a name that gets looked up.",
      "Assuming a webpage is one file, when it's usually a document plus many separately fetched files.",
      "Believing the page 'just appears', when the browser builds it step by step after the response arrives.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In your own words, list the four main steps between typing an address and seeing a page." },
      { difficulty: "Medium", prompt: "Open your browser's developer tools, go to the Network panel, and reload a page. Count how many files were fetched to build it." },
      { difficulty: "Hard", prompt: "For each of the four steps (lookup, request, response, render), explain what might go wrong and how the symptom would look to a user." },
    ],
    interviewQuestions: [
      { question: "At a high level, what happens between typing a URL and seeing a page?", answer: "The browser looks up which server owns the address (DNS), opens a connection and sends a request, gets back a response with the page's content, and renders it on screen." },
      { question: "Is a webpage usually a single file?", answer: "No. The first HTML document usually references other files (stylesheets, images, scripts). The browser finds them while parsing and fetches each one separately, often many at once." },
      { question: "Why does the web need a naming lookup step at all?", answer: "People use readable names like `example.com`, but computers need a numeric IP address to open a connection. DNS translates one into the other." },
      { question: "What is DNS, and what does it actually return?", answer: "DNS (Domain Name System) is the web's naming lookup. Given a domain name, it returns the IP address of a server for that domain, which the browser then connects to." },
      { question: "Why is looking up the same domain often faster the second time?", answer: "Browsers, operating systems, and network resolvers cache DNS answers for a set time (the TTL). A repeat lookup can come from cache instead of doing the full lookup again." },
      { question: "What's the difference between a domain name and an IP address?", answer: "A domain name is a readable label like `example.com`. An IP address is the numeric address of the machine the browser actually connects to. DNS maps one to the other." },
      { question: "What role does a port number play in a request, and what are the default ports for HTTP and HTTPS?", answer: "One machine can run many services, and the port says which one should handle the connection. HTTP defaults to port 80 and HTTPS to port 443, so you don't need to type them in a URL." },
      { question: "What's the difference between HTTP and HTTPS?", answer: "HTTPS is HTTP over an encrypted connection (TLS). The requests and responses are the same, but anyone intercepting the traffic can't read or tamper with it." },
      { question: "What does it mean for HTTP to be a request/response protocol?", answer: "The browser (client) always starts by sending a request, and the server replies with a response. The server never pushes a page to a browser that didn't ask for it." },
      { question: "What do the main HTTP status code categories mean?", answer: "2xx means success. 3xx means redirect to another location. 4xx means the client's request was invalid or unauthorized (like 404 Not Found). 5xx means the server failed while handling a valid request." },
      { question: "What happens when a server responds with a redirect?", answer: "The server sends a 3xx status code and a `Location` header with a different URL. The browser automatically requests that URL instead of rendering the redirect response." },
      { question: "Why might a website use a CDN, and how does that change which server you actually talk to?", answer: "A CDN (content delivery network) serves cached copies of a site's files from servers close to the visitor. DNS for the domain points to a nearby CDN server instead of the site's single origin server, which cuts latency." },
      { question: "What's the difference between latency and bandwidth?", answer: "Latency is how long one piece of data takes to make the round trip. Bandwidth is how much data can move per second once the connection is flowing. A high-bandwidth connection can still feel slow if latency is high." },
      { question: "Why can a page technically finish loading but still show a blank screen for a while?", answer: "Getting the response is only one step. The browser still has to parse the HTML, fetch referenced files, compute layout, and paint pixels. A slow render step can delay the visible page long after the network work is done." },
      { question: "What's the difference between a client and a server in this model?", answer: "The client (usually a browser) sends requests and renders what comes back. The server listens for requests and decides what to send. The same machine can play either role in different contexts." },
      { question: "How would the symptoms differ between a DNS failure, a server being down, and a rendering failure?", answer: "A DNS failure shows an error before any connection is tried, often 'server not found.' A down server shows a connection error after the lookup succeeds. A rendering failure can show a blank or broken page even though the request completed normally." },
      { question: "Why is the very first request to a site often slower than later ones?", answer: "The first request pays for the DNS lookup, opening a TCP connection, and (for HTTPS) a TLS handshake. Later requests skip all of that if the browser reuses the same connection." },
    ],
    relatedTopics: ["html-basics", "browser-rendering"],
    keywords: ["web", "internet", "request", "response", "server", "browser", "how the web works"],
  },
  {
    id: "html-basics",
    title: "HTML Basics",
    level: "beginner",
    description:
      "The language that describes what's on a page and how it's structured, not how it looks.",
    explanation: `
Before a page can be styled or made interactive, something has to say
*what's on it*: a heading, a paragraph, a picture, a link. That
description is written in **HTML** (HyperText Markup Language).

HTML doesn't handle colors, fonts, or spacing; that's CSS's job. HTML
only says what each piece of content *is* and how the pieces relate: this
is the main heading, this is a list, this text links to another page.

You write HTML with **tags**: short instructions in angle brackets, like
\`<p>\` for a paragraph. Most tags come in pairs, an opening tag and a
closing tag with content between them. Together they form an
**element**. Tags can also carry **attributes**, extra details such as
which image file an image tag should show.

Choosing tags that match the content's *meaning* (a heading tag for a
heading, a button tag for a button) instead of generic tags is called
**semantic HTML**. It lets screen readers, search engines, and other
tools understand your page, not just display it.
  `.trim(),
    analogy:
      "HTML is like a document's labeled outline ('this is the title,' 'this is a bullet list,' 'this is a footnote'), written before anyone picks a font or color.",
    examples: [
      {
        title: "A minimal page",
        code: `<!DOCTYPE html>
<html>
  <head>
    <title>My Page</title>
  </head>
  <body>
    <h1>Welcome</h1>
    <p>This is a paragraph of text.</p>
  </body>
</html>`,
        explanation:
          "Every HTML page has this shape: a declaration of the document type, a head with page metadata, and a body with the visible content.",
        walkthrough: [
          { code: "<!DOCTYPE html>", explanation: "Tells the browser to render this as modern HTML." },
          { code: "<html> ... </html>", explanation: "Wraps the whole page. Everything goes inside this element." },
          { code: "<head> <title>My Page</title> </head>", explanation: "Holds information about the page, like the title in the browser tab, not visible content." },
          { code: "<body> ... </body>", explanation: "Holds everything the user sees on the page." },
          { code: "<h1>Welcome</h1>", explanation: "A heading element. It marks this text as the page's main heading, not just large text." },
          { code: "<p>This is a paragraph of text.</p>", explanation: "A paragraph element wrapping a block of text." },
        ],
      },
      {
        title: "Attributes and semantic elements",
        code: `<img src="cat.jpg" alt="A sleeping orange cat">

<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
</nav>

<button type="submit">Send</button>`,
        explanation:
          "src and alt are attributes that give the image tag extra detail. nav and button are semantic elements: they tell the browser and assistive tools what role the content plays, not just how it looks.",
      },
    ],
    howItWorks: `
The browser reads the HTML tags from top to bottom and builds a tree from
them. Each element becomes a node, nested inside the element that
contains it.

The browser renders from that tree, and JavaScript can change it later.
The HTML text is just the starting blueprint.
  `.trim(),
    whyItExists: `
HTML separates *what content is* from *how it looks* and *how it
behaves*. With one simple language for structure and meaning, browsers,
search engines, screen readers, and other tools can all read any page the
same way, whoever built it and however it's styled.
  `.trim(),
    whenToUse: `
Every webpage needs HTML; it's the one layer that's never optional. Use
the semantically correct tag whenever one exists: a button for a
clickable action, a heading tag for a real heading, a list for a real
list. Don't style a generic element to look the part.
  `.trim(),
    whenNotToUse: `
Don't use HTML to control appearance (that's CSS) or behavior (that's
JavaScript). Adding tags just to force a visual effect produces
confusing, hard-to-maintain markup.
  `.trim(),
    commonMistakes: [
      "Styling a generic element to look like a button instead of using a real button element, which breaks keyboard and screen-reader support.",
      "Forgetting to close tags, so the browser misreads how content is nested.",
      "Treating an image's alt attribute as optional decoration instead of a real description that screen readers use.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a minimal HTML page with a title, one heading, and one paragraph." },
      { difficulty: "Medium", prompt: "Build a simple page with a navigation bar (nav), a list of three items, and an image with meaningful alt text." },
      { difficulty: "Hard", prompt: "Take a page built only from generic div elements and rewrite it with semantic tags (header, nav, main, button, footer) where they fit. Explain each change." },
    ],
    interviewQuestions: [
      { question: "What is HTML responsible for, and what is it not responsible for?", answer: "HTML describes the structure and meaning of content: headings, paragraphs, links, images. Visual styling is CSS's job, and interactive behavior is JavaScript's." },
      { question: "What's the difference between a tag, an element, and an attribute?", answer: "A tag is the bracketed instruction, like `<p>` or `</p>`. An element is the opening tag, its content, and its closing tag together. An attribute is extra information inside an opening tag, such as `src` or `href`, that tells the browser more about the element." },
      { question: "What is semantic HTML, and why does it matter?", answer: "Semantic HTML uses tags that describe what content *is* (`<nav>` for navigation, `<button>` for a clickable action) instead of generic tags styled to look the part. Screen readers, search engines, and browsers use that meaning to decide how to present or announce the content." },
      { question: "What does the `<!DOCTYPE html>` declaration do, and what happens if it's missing?", answer: "It tells the browser to use the modern HTML standard. Without it, some browsers fall back to `quirks mode`, an older, less consistent mode kept for backward compatibility. That can subtly change things like how box sizing is calculated." },
      { question: "What's the difference between the `<head>` and `<body>` of a document?", answer: "The `<head>` holds information about the page (title, linked stylesheets, metadata) and isn't shown as content. The `<body>` holds everything the user sees." },
      { question: "Why does the `alt` attribute on an `<img>` matter, beyond being read aloud by screen readers?", answer: "It's shown in place of the image if the file fails to load. Search engines also use it to understand the image, since they can't 'see' the pixels." },
      { question: "What is a void element, and why don't tags like `<img>` or `<br>` have closing tags?", answer: "A void element can never have content or children, so HTML doesn't need or allow a closing tag. `<img src=\"cat.jpg\">` is complete on its own; there's nothing to wrap." },
      { question: "If you forget to close a `<p>` tag before opening another one, does the browser throw an error?", answer: "No. HTML parsers are deliberately forgiving and follow a defined error-recovery algorithm. Some elements, like `<p>`, close automatically when an incompatible tag appears. The page still renders, just maybe not with the structure you meant." },
      { question: "Given `<ul><li>A<li>B</ul>` with no closing `</li>` tags, how many list items does the browser actually render?", answer: "Two. The parser's error-recovery rules close an `<li>` as soon as another `<li>` starts, so the missing closing tags are inferred. No items are merged or dropped." },
      { question: "Why is a `<div>` with a click handler a worse choice than an actual `<button>` for a clickable action?", answer: "A `<button>` comes with keyboard support for free: you can reach it with Tab, activate it with Enter or Space, and screen readers announce it as a button. A plain `<div>` has none of that; you'd have to rebuild focus, keyboard activation, and the accessible role yourself." },
      { question: "What's the difference between an element's `id` and its `class` attribute?", answer: "An `id` identifies one unique element on the page. A `class` is reused across many elements that share a role or style. `id` is also used for in-page links (`#section`) and is usually the fastest way to look up an element." },
      { question: "What happens if two elements on a page share the same `id`?", answer: "The HTML is invalid, but the browser still renders it. `document.getElementById` and CSS `#id` selectors match only the first one and silently ignore the duplicate, so the bug is easy to miss." },
      { question: "What's the difference between a block-level element and an inline element?", answer: "A block-level element, like `<p>` or `<div>`, starts on its own line and takes the full available width by default. An inline element, like `<span>` or `<a>`, flows within the text and is only as wide as its content. CSS's `display` property can override this for any element." },
      { question: "Why does heading order (`<h1>` through `<h6>`) matter, beyond making text bigger?", answer: "Screen reader users jump between headings to navigate a page, the way sighted users scan section titles. Skipping levels, or using headings just for their font size, breaks that navigation." },
      { question: "What does the default `type` of a `<button>` inside a `<form>` do, and why does it surprise people?", answer: "A `<button>` with no type defaults to `type=\"submit\"`, so clicking it submits the form and reloads or navigates the page. If you just want the button to run some JavaScript, set `type=\"button\"` explicitly." },
      { question: "What's the difference between hiding content with an HTML comment versus hiding it with CSS?", answer: "Content inside an HTML comment (`<!-- ... -->`) is never parsed into the page; it doesn't exist as an element. Content hidden with CSS is still a real element, just not shown (and, depending on the technique, may still affect screen readers or layout)." },
      { question: "You need a piece of text that, when clicked, takes the user to a different page. Should you use `<a>` or `<button>`?", answer: "`<a href=\"...\">`. Anchors are for navigation: they update the URL, support right-click and open-in-new-tab, and are announced as links. `<button>` triggers an action on the current page, like submitting a form or opening a modal, and has no navigation behavior." },
      { question: "Why does the browser build a tree out of HTML tags instead of just keeping the raw text around?", answer: "A tree shows exactly which elements are nested inside which. That lets the browser (and later JavaScript) work out layout, apply styles based on structure, and target single elements. None of that works on a flat string of text." },
      { question: "What's wrong with writing an entire page's content using only `<div>` and `<span>` elements?", answer: "It renders fine, but the page loses all semantic meaning. Screen readers can't find headings, landmarks, or buttons, search engines can't tell what's important, and other developers lose the hints that tags like `<nav>` or `<h1>` give." },
    ],
    relatedTopics: ["how-the-web-works", "css-basics", "the-dom"],
    keywords: ["html", "tags", "elements", "attributes", "semantic html", "markup"],
  },
  {
    id: "css-basics",
    title: "CSS Basics",
    level: "beginner",
    description:
      "The language that controls how a page looks, kept separate from what the page contains.",
    explanation: `
HTML says what's on a page: a heading, a paragraph, an image. It says
nothing about the heading's color, the text size, or the space around the
image. That's the job of **CSS** (Cascading Style Sheets).

Keeping style separate from structure means the same HTML can look
completely different with different styles. It also means one set of
rules can be reused across many pages, so you don't repeat "make this
text blue" everywhere.

CSS is made of **rules**. A **selector** says *which* elements a rule
applies to, and one or more **properties** with values say *what* to
change. A property might be \`color\`, \`font-size\`, or \`margin\`; the
value is the setting, like \`blue\` or \`16px\`.

Often several rules apply to the same element. A general rule might style
all paragraphs while a more specific one targets a single paragraph. The
way the browser decides which value wins is called the **cascade**, and
it's where CSS gets its name.
  `.trim(),
    analogy:
      "If HTML is a document's labeled outline, CSS is the style guide applied on top ('make all headings blue, add space between paragraphs') without changing a word of the content.",
    examples: [
      {
        title: "A basic rule",
        code: `p {
  color: darkslategray;
  font-size: 16px;
  line-height: 1.5;
}`,
        explanation:
          "This rule targets every paragraph on the page and sets its text color, font size, and line spacing.",
        walkthrough: [
          { code: "p {", explanation: "The selector: this rule applies to every <p> element." },
          { code: "color: darkslategray;", explanation: "A property (color) and a value (darkslategray) that set the text color." },
          { code: "font-size: 16px;", explanation: "Sets the text size." },
          { code: "line-height: 1.5;", explanation: "Sets the vertical space between lines in the paragraph." },
        ],
      },
      {
        title: "The cascade in action",
        code: `p { color: black; }
.highlight { color: orange; }
#intro { color: red; }`,
        explanation:
          "If a paragraph has both class=\"highlight\" and id=\"intro\", all three rules apply. CSS settles the conflict by specificity and order. Here the id selector wins, so the paragraph is red, not orange or black.",
      },
    ],
    howItWorks: `
The browser reads all the CSS that applies, whether from a stylesheet
file, a style tag, or inline on an element. It matches each rule's
selector against the page's elements.

For each element, it gathers every matching rule and picks the final
value for each property. Roughly: more specific selectors win, and when
specificity ties, the later rule wins.
  `.trim(),
    whyItExists: `
CSS keeps appearance out of content. Before it, changing a site's look
meant editing styling scattered across every page. Now one stylesheet can
restyle a whole site, and the same content can look different in
different contexts, like print versus screen.
  `.trim(),
    whenToUse: `
Use CSS for anything about *how* a page looks or is arranged: colors,
spacing, fonts, sizing, positioning, and layout. When a look should be
consistent across elements or pages, use a shared stylesheet instead of
one-off inline styles.
  `.trim(),
    whenNotToUse: `
CSS doesn't describe what content is (that's HTML) or add new behavior in
response to user actions (that's JavaScript). It can handle small
interactive touches like hover effects on its own.
  `.trim(),
    commonMistakes: [
      "Wondering why a style 'isn't applying' when a more specific rule elsewhere is overriding it.",
      "Overusing inline styles instead of a shared stylesheet, so one visual change is hard to apply everywhere.",
      "Forgetting that order matters when specificity is equal: the later rule wins.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a CSS rule that makes all h1 elements on a page green and centered." },
      { difficulty: "Medium", prompt: "Write three rules that all apply to the same element (by tag, class, and id) and predict which value wins for a shared property." },
      { difficulty: "Hard", prompt: "Given a small HTML page with conflicting styles, trace the cascade by hand to find the final color of a specific element." },
    ],
    interviewQuestions: [
      { question: "What problem does CSS solve that HTML alone doesn't?", answer: "HTML describes structure and content, but nothing about appearance. CSS controls how that content looks — color, size, spacing, layout — and keeping it separate means the same content can be restyled, or reused across pages, without touching the markup." },
      { question: "What is a CSS selector?", answer: "The part of a CSS rule that determines which elements the rule's properties apply to — it can match by tag name, class, id, attribute, or relationship to other elements." },
      { question: "What is 'the cascade' in CSS?", answer: "The set of tie-breaking rules the browser uses when multiple CSS rules could apply to the same element and property — resolved primarily by specificity, and then by which rule appears later in source order when specificity ties." },
      { question: "How is specificity calculated, at a high level?", answer: "Roughly in this order of weight: inline styles beat everything, then id selectors, then class/attribute/pseudo-class selectors, then plain tag selectors. A rule with a higher-weighted selector wins regardless of where it appears in the stylesheet." },
      { question: "Given `p { color: black; } .highlight { color: orange; } #intro { color: red; }` applied to a paragraph with `class=\"highlight\" id=\"intro\"`, what color renders, and why?", answer: "Red. All three selectors match, but id selectors outweigh class selectors, which outweigh tag selectors, regardless of the order the rules were written in — specificity, not position, decides this one." },
      { question: "If two CSS rules have exactly equal specificity, which one wins?", answer: "Whichever rule appears later in the source — later stylesheets, or later rules within the same stylesheet, override earlier ones when specificity is tied. This is the part of 'the cascade' that depends purely on order." },
      { question: "How do inline styles, a `<style>` block, and an external stylesheet differ in how they affect the cascade?", answer: "All three can define the same properties, but an inline `style` attribute on an element outweighs any selector-based rule, no matter how specific, because it isn't competing on selector specificity at all — it's tied directly to that one element." },
      { question: "What does `!important` do, and why is it generally discouraged?", answer: "It forces a declaration to win the cascade regardless of specificity or source order, overriding almost everything else. It's discouraged because once one `!important` is fighting another, there's no normal cascade logic left to reason about — you have to search the whole codebase to know what actually wins." },
      { question: "What is the CSS box model?", answer: "Every element is rendered as a box made of four layered regions: the content itself, padding around the content, a border around the padding, and margin outside the border — and an element's rendered size is the sum of all four unless `box-sizing` changes how that's calculated." },
      { question: "What's the difference between `box-sizing: content-box` and `box-sizing: border-box`?", answer: "With `content-box` (the default), a `width` you set applies only to the content area, so padding and border add extra pixels on top of it. With `border-box`, the `width` you set already includes padding and border, so the element's final rendered width matches the value you wrote." },
      { question: "Why should an `id` selector generally be avoided for general-purpose styling, separate from the fact that it's very specific?", answer: "An `id` is meant to be unique per page, so a rule written against one only ever targets a single element — it can't be reused elsewhere without duplicating the rule, and its high specificity makes it harder to override later if you need to." },
      { question: "What's the difference between `nav a` and `nav > a` as selectors?", answer: "`nav a` matches any `<a>` nested anywhere inside a `<nav>`, no matter how deeply. `nav > a` only matches an `<a>` that is a *direct* child of `<nav>`, ignoring one nested inside another element in between." },
      { question: "Do all CSS properties inherit from a parent element to its children?", answer: "No. Text-related properties like `color` and `font-family` inherit by default, so setting them on a container affects text inside it. Box-model properties like `margin`, `padding`, and `border` do not inherit — each element needs them set explicitly, or it renders with none." },
      { question: "Given `div { color: red; } div p { color: blue; }` and `<div><p>Text</p></div>`, what color does the text render, and why?", answer: "Blue. Both rules match the paragraph — one by matching `div` (and inheriting to its child) and one by directly targeting `p` inside a `div` — but `div p` is a more specific selector (two type selectors vs. one), so it wins the cascade." },
      { question: "You change a CSS property on an element but nothing visibly happens — what are the likely mechanisms?", answer: "Either a more specific (or later, equally specific) rule elsewhere is overriding it, the property doesn't apply to that element's `display` type (like `vertical-align` on a block element), or the stylesheet change hasn't actually loaded — for example due to caching or a wrong file path." },
      { question: "What's a pseudo-class, like `:hover` or `:first-child`, and how is it different from a regular selector?", answer: "A regular selector matches based on an element's static properties — its tag, class, or id. A pseudo-class matches based on a state or position that can change or depend on context, like being currently hovered, being the first child of its parent, or being a form field that's currently invalid." },
      { question: "A `<link rel=\"stylesheet\">` is in the page, but none of its styles seem to apply — what would you check?", answer: "Whether the `href` path actually resolves (a typo or wrong relative path is the most common cause), whether the file is being served with a CSS-compatible response, whether a browser cache is serving a stale/empty version, and whether the rules inside it are simply being overridden by more specific rules loaded elsewhere." },
      { question: "Why is a shared stylesheet generally better than inline styles for keeping a site's typography consistent?", answer: "A shared stylesheet defines a rule once — say, `p { font-size: 16px; }` — and every paragraph on every page that loads it picks up that value automatically. With inline styles, the same value has to be repeated on every single element, so keeping them consistent means finding and updating every occurrence by hand." },
    ],
    relatedTopics: ["html-basics", "browser-rendering", "css-layout"],
    keywords: ["css", "styling", "selectors", "properties", "cascade", "specificity"],
  },
  {
    id: "the-dom",
    title: "The DOM",
    level: "beginner",
    description:
      "The live, in-memory version of a page's structure that a browser builds and that JavaScript can read and change.",
    explanation: `
The HTML you write is just text in a file — it's the *starting
instructions* for a page, not the page itself while it's running. The
moment a browser loads that HTML, it reads through it and builds a
completely separate, living representation of the page in memory: a tree
of objects, one for each element, each one knowing its content,
attributes, and which elements are nested inside which.

That in-memory tree is called the **DOM** — the Document Object Model.
It's what the browser actually uses to draw the page on screen, and
crucially, it's what JavaScript reaches into when it wants to change
something after the page has loaded: add a new item to a list, change a
heading's text, remove an element entirely.

This distinction matters: editing the original HTML file does nothing to
a page that's already open in a browser. But changing the DOM does —
because the DOM, not the original file, is the thing currently being
rendered. Open a browser's developer tools and inspect an element, and
you're looking at the live DOM, which may no longer match the HTML that
was first sent down.
  `.trim(),
    analogy:
      "The original HTML file is like a printed recipe. The DOM is the actual dish being cooked in the kitchen right now — you can still add a pinch of salt or swap an ingredient mid-cook, and none of that touches the printed recipe sitting on the counter.",
    examples: [
      {
        title: "HTML source vs. the live DOM",
        code: `<!-- original HTML file -->
<ul id="list">
  <li>Apples</li>
</ul>

// JavaScript, run after the page loads
document.getElementById("list").innerHTML += "<li>Bananas</li>";`,
        explanation:
          "The HTML file only ever had one list item. After this script runs, the live DOM has two — but if you viewed the file's raw source again, it would still only show one, because the file itself never changed.",
        walkthrough: [
          { code: '<ul id="list"> <li>Apples</li> </ul>', explanation: "The original HTML — one list with one item, as written in the file." },
          { code: 'document.getElementById("list")', explanation: "Finds the corresponding live element in the DOM tree, not in the file." },
          { code: '.innerHTML += "<li>Bananas</li>"', explanation: "Adds a new list item to that live element. This changes what's on screen immediately." },
        ],
      },
      {
        title: "Reading and changing an element",
        code: `const heading = document.querySelector("h1");
console.log(heading.textContent); // reads the current text
heading.textContent = "New Title"; // changes it live`,
        explanation:
          "querySelector finds a node in the DOM tree. From there, JavaScript can both read its current state and assign new values, and the visible page updates right away.",
      },
    ],
    howItWorks: `
As the browser parses HTML, for every tag it encounters it creates a
corresponding node object and attaches it to a tree, nested according to
how the tags were nested in the source. Each node has properties (its
tag name, attributes, text, children) and methods JavaScript can call to
read or change them. Because the DOM is just a set of objects in memory,
any change to it — adding a node, deleting one, changing text — is
reflected on screen essentially immediately, without needing to reload
anything.
  `.trim(),
    diagram: `
HTML source (text)
      |
      | browser parses it
      v
   DOM tree (live objects in memory)
      |
      |<--- JavaScript reads/writes here
      v
  Rendered page on screen
  `.trim(),
    whyItExists: `
The DOM exists because pages needed a way to change *after* they finish
loading, without the browser having to re-fetch and re-parse the whole
HTML file from scratch for every small update. Representing the page as
a tree of live, addressable objects gives JavaScript a structured,
efficient way to inspect and modify exactly the parts of a page that
need to change.
  `.trim(),
    whenToUse: `
Any time JavaScript needs to read what's currently on a page or change it
— show a new element, hide something, update text after fetching data —
it does so through the DOM, not by editing HTML files.
  `.trim(),
    whenNotToUse: `
For content that never needs to change after the page loads, there's no
need to manipulate the DOM with JavaScript at all — plain HTML and CSS
are simpler and faster. Heavy, frequent DOM manipulation for large,
fast-changing interfaces is also often better handled through a framework
that manages DOM updates efficiently, rather than doing it all by hand.
  `.trim(),
    commonMistakes: [
      "Confusing 'view page source' (the original HTML sent by the server) with the live DOM shown in developer tools inspector — they can differ after scripts run.",
      "Assuming editing the HTML file will change a page that's already open in a browser tab.",
      "Repeatedly querying the DOM for the same element inside a loop instead of looking it up once and reusing the reference.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use document.querySelector to select an element on a page and log its text content to the console." },
      { difficulty: "Medium", prompt: "Write a script that adds a new paragraph element to the page after it has already loaded, then explain why 'view page source' wouldn't show it." },
      { difficulty: "Hard", prompt: "Explain, in your own words, the difference between the DOM and HTML, and describe one situation where confusing the two would cause a debugging mistake." },
    ],
    interviewQuestions: [
      { question: "What is the DOM?", answer: "The Document Object Model — a live, in-memory tree of objects representing a page's current structure, built by the browser from the HTML and used both for rendering and for JavaScript to read or change the page." },
      { question: "How is the DOM different from the original HTML source?", answer: "The HTML source is static text describing the page's starting state. The DOM is a live, in-memory representation built from that text, and it can be changed after the page loads through JavaScript without the underlying HTML file itself ever changing." },
      { question: "Why can JavaScript change what's on screen without reloading the page?", answer: "Because it modifies the live DOM tree directly — adding, removing, or editing node objects in memory — and the browser re-renders based on the current state of that tree, not by re-reading the original HTML file." },
      { question: "What's the difference between `textContent` and `innerHTML`, and why does it matter for security?", answer: "`textContent` treats whatever you assign to it as plain text, escaping any markup so it displays literally. `innerHTML` parses the assigned string as HTML and creates real elements from it — which means inserting untrusted user input through `innerHTML` can let attacker-supplied `<script>` or event-handler markup run, a class of bug known as XSS." },
      { question: "What's the difference between `document.getElementById`, `document.querySelector`, and `document.querySelectorAll`?", answer: "`getElementById` looks up a single element by its `id` directly, without evaluating a CSS selector, and is the fastest of the three. `querySelector` accepts any CSS selector and returns the first matching element. `querySelectorAll` also accepts a CSS selector but returns *all* matches, as a NodeList, rather than just the first." },
      { question: "Is the NodeList returned by `querySelectorAll` live or static? What about `getElementsByClassName`?", answer: "`querySelectorAll` returns a static snapshot — if elements matching that selector are added to the DOM afterward, the NodeList you already have won't include them. `getElementsByClassName` (and `getElementsByTagName`) return a live HTMLCollection that automatically reflects later additions or removals matching the query." },
      { question: "What's the difference between a DOM 'node' and an 'element'?", answer: "Node is the general category — it includes element nodes, but also text nodes (the actual text between tags) and comment nodes. An element is specifically a node created from an HTML tag, like a `<div>` or `<p>`; not every node in the tree is an element." },
      { question: "How would you move from a child element to its parent, and to its next sibling, in the DOM?", answer: "`element.parentElement` (or `parentNode`) gives the containing element. `element.nextElementSibling` and `previousElementSibling` move across to adjacent elements at the same level, skipping over any text or comment nodes in between." },
      { question: "What's the difference between `element.children` and `element.childNodes`?", answer: "`children` returns only the child *elements*, skipping text and comment nodes. `childNodes` returns every child node, including whitespace-only text nodes created by the line breaks and indentation in your source HTML — which is why `childNodes.length` is often surprisingly larger than expected." },
      { question: "How do you create a brand-new element and add it to the page with JavaScript?", answer: "`document.createElement(\"li\")` creates a detached element that isn't part of the page yet, then `parent.appendChild(newElement)` (or `insertBefore` for a specific position) attaches it into the live DOM tree, at which point the browser renders it." },
      { question: "What actually happens when you set `element.innerHTML = \"\"`?", answer: "The browser destroys every existing descendant node of that element — including any event listeners attached directly to them — and replaces them with nothing, since an empty string parses to no content at all." },
      { question: "What is event bubbling?", answer: "When an event fires on an element, it doesn't just run handlers on that exact element — it then propagates upward, triggering matching handlers on each ancestor in turn, all the way up to the document, unless something stops it along the way." },
      { question: "What is event delegation, and why does bubbling make it possible?", answer: "Instead of attaching a separate click handler to every item in a list, you attach one handler to their shared parent and inspect `event.target` inside it to figure out which item was actually clicked. This works because a click on any descendant bubbles up and also triggers the parent's handler." },
      { question: "Given `<div id=\"outer\"><button id=\"btn\">Click</button></div>` with click listeners on both `#outer` and `#btn`, and no `stopPropagation` anywhere, what order do the handlers run in when the button is clicked?", answer: "The `#btn` handler runs first, then the `#outer` handler — bubbling-phase handlers fire from the actual target outward to its ancestors, not the other way around." },
      { question: "What's the difference between `event.stopPropagation()` and `event.preventDefault()`?", answer: "`stopPropagation()` stops the event from continuing to bubble up (or capture down) to other handlers, but doesn't affect the browser's default behavior for that event. `preventDefault()` cancels the browser's default action, like following a link or submitting a form, but doesn't stop the event from still reaching other handlers." },
      { question: "Why does repeatedly calling `document.querySelector` for the same element inside a loop hurt performance?", answer: "Each call makes the browser search through (part of) the DOM tree again to find a match. If the element doesn't change between iterations, looking it up once outside the loop and reusing that reference avoids paying that search cost on every single iteration." },
      { question: "What's the difference between `appendChild` and `append`?", answer: "`appendChild` accepts exactly one `Node` and returns that node. `append` (newer) can accept multiple arguments, including plain strings as well as nodes, and returns `undefined` — it's more flexible but not usable everywhere `appendChild`'s return value is needed." },
      { question: "A `<script>` at the top of `<head>` runs `document.querySelector(\"#footer\")` and gets `null`, even though `<div id=\"footer\">` clearly exists further down in the `<body>`. Why?", answer: "The browser parses HTML top to bottom, building the DOM incrementally, and a script placed in `<head>` executes before the parser has even reached the `<body>` — so the `#footer` element simply doesn't exist in the DOM yet at the moment the script runs." },
      { question: "How does adding `defer` to a `<script>` tag relate to that problem?", answer: "`defer` tells the browser to keep parsing the HTML and building the DOM without waiting for the script, then run the script only after parsing is complete — so by the time it executes, every element defined in the HTML is already present in the DOM." },
      { question: "What is a `DocumentFragment`, and why use one before inserting many nodes into the DOM?", answer: "It's a lightweight container that lives outside the visible DOM tree — you can build a batch of nodes inside it first, then append the whole fragment in a single operation. That means the browser only has to update the live page once, instead of once per node." },
      { question: "You need to render 100 new list items from fetched data — why is calling `list.appendChild(item)` 100 times in a loop, directly on the live list, less efficient than building the items off-DOM first and inserting them all at once?", answer: "Each `appendChild` call on an element that's already part of the rendered page can trigger the browser to recompute layout and repaint, since the visible page just changed. Building the nodes in memory (or in a `DocumentFragment`) first and inserting them in one call means the browser only has to do that layout/paint work once instead of up to 100 times." },
      { question: "Why is toggling a CSS class with `classList.add`/`classList.remove` often preferred over setting `element.style` properties directly?", answer: "`classList` keeps the actual visual values in CSS, where they belong and can be reused, and lets you flip a whole group of related style changes on or off with one call. Setting `element.style` directly hardcodes specific property values into JavaScript, one at a time, which is harder to keep consistent and mixes styling concerns into your logic." },
    ],
    prerequisites: ["html-basics"],
    relatedTopics: ["html-basics", "browser-rendering"],
    keywords: ["dom", "document object model", "javascript", "tree", "nodes"],
  },
  {
    id: "browser-rendering",
    title: "Browser Rendering",
    level: "beginner",
    description:
      "The step-by-step process a browser follows to turn HTML and CSS into the pixels you actually see on screen.",
    explanation: `
Once a browser has an HTML document and its associated CSS, it still
has real work to do before anything appears on screen. It has to figure
out what each element is, what it should look like, where exactly it
belongs, and finally draw all of that in the right place. This whole
sequence is called **rendering**.

It roughly happens in four stages. First, the browser reads through the
HTML and builds that live tree of elements — the DOM. At the same time,
it reads through the CSS and figures out which style rules apply to
which elements. Combining those two produces a tree of exactly which
elements will actually be visible and what styles apply to each — this
combined structure is often called the **render tree**.

Next, the browser works out **layout**: the exact size and position of
every visible element on the page, in pixels — how wide is this box, how
tall, where does it sit relative to everything around it. Finally comes
**paint**: the browser actually fills in pixels — colors, text, images,
borders — according to the layout it just calculated, and the picture
appears on screen.

Any time something changes later — new content arrives, CSS is
modified, the window is resized — the browser may need to redo some or
all of these steps to keep the screen accurate.
  `.trim(),
    analogy:
      "It's like building a stage set: first you decide which props are actually going to be used (render tree), then you measure exactly where each one goes on the floor (layout), then stagehands actually place and paint everything into position (paint) so the audience sees the finished scene.",
    examples: [
      {
        title: "The stages, named",
        code: `HTML  ──┐
        ├──> Render Tree ──> Layout ──> Paint ──> Pixels on screen
CSS   ──┘`,
        explanation:
          "HTML and CSS are combined into a render tree of visible elements and their styles, then the browser computes sizes and positions (layout), then it fills in the actual pixels (paint).",
        walkthrough: [
          { code: "HTML + CSS", explanation: "The two starting inputs — structure/content and appearance rules." },
          { code: "Render Tree", explanation: "Only the elements that will actually be visible, combined with the styles that apply to each." },
          { code: "Layout", explanation: "The browser calculates the exact size and position, in pixels, of every visible element." },
          { code: "Paint", explanation: "The browser draws colors, text, images, and borders according to that layout." },
          { code: "Pixels on screen", explanation: "The final, visible result the user actually sees." },
        ],
      },
      {
        title: "A change that triggers re-rendering",
        code: `// This changes an element's width — the browser
// must recalculate layout for anything nearby,
// then repaint the affected area.
box.style.width = "400px";`,
        explanation:
          "Not every change is equally expensive. Changing something that affects size or position (like width) forces the browser to redo layout, while changing something purely visual (like color) can sometimes skip straight to repainting.",
      },
    ],
    howItWorks: `
The browser doesn't wait for the entire HTML file to download before it
starts working — it begins parsing HTML as it streams in, building the
DOM incrementally. CSS is parsed similarly, and once enough of both is
available, the browser can start constructing the render tree and
calculating layout. Elements that CSS explicitly hides (like
\`display: none\`) are excluded from the render tree entirely, since they
never need a layout or paint step at all.
  `.trim(),
    diagram: `
Parse HTML  --> DOM tree      \\
                                >--> Render Tree --> Layout --> Paint
Parse CSS   --> Style rules   /
  `.trim(),
    whyItExists: `
Splitting rendering into distinct stages lets the browser be efficient
about what it redoes when something changes. If only colors change,
there's no need to recompute every element's size and position; if only
one element's size changes, there's no need to repaint the entire
screen. This staged pipeline is what keeps pages feeling responsive
even as content updates constantly.
  `.trim(),
    whenToUse: `
Understanding this pipeline matters once you start caring about *why* a
page feels slow or janky, especially when animating or updating the page
frequently — knowing that some changes are cheap (paint-only) and others
are expensive (trigger layout) shapes how you write both CSS and
JavaScript for a smooth experience.
  `.trim(),
    whenNotToUse: `
For basic page-building — writing HTML and CSS for a mostly static page —
you don't need to think about the rendering pipeline directly; the
browser handles it automatically. This mental model earns its keep
mainly during performance work.
  `.trim(),
    commonMistakes: [
      "Assuming every CSS change is equally cheap, when changes affecting size or position force a more expensive layout recalculation.",
      "Thinking the whole page re-renders from scratch on every small update, rather than the browser recomputing only what actually changed.",
      "Forgetting that elements hidden with display: none are skipped entirely during rendering, unlike elements merely made invisible in other ways.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List the four main stages of the rendering pipeline in order, in your own words." },
      { difficulty: "Medium", prompt: "Explain why changing an element's color is typically cheaper for the browser than changing its width." },
      { difficulty: "Hard", prompt: "Using your browser's developer tools performance panel, record a page interaction and identify a 'layout' or 'paint' step in the recorded timeline." },
    ],
    interviewQuestions: [
      { question: "What are the main stages of browser rendering?", answer: "Parsing HTML and CSS to build a render tree of the elements that will actually be visible along with their matched styles, computing layout — the exact size and position of each visible element — and then painting the actual pixels for colors, text, images, and borders." },
      { question: "What is the render tree?", answer: "A tree combining the DOM with the CSS rules that match each node, containing only the elements that will actually be rendered visually — elements excluded from display, like ones set to `display: none`, don't get a node in it at all." },
      { question: "Why does changing an element's width potentially cost more than changing its color?", answer: "Width affects that element's size, which can shift the position and size of surrounding elements too, so the browser has to redo layout for the affected part of the page before it can repaint. Color only affects how a box is painted, not its geometry, so the browser can often skip layout and jump straight to repainting." },
      { question: "What's the difference between 'layout' (also called reflow) and 'paint' (also called repaint)?", answer: "Layout is the step where the browser calculates the exact size and position, in pixels, of every visible element. Paint is the separate step after that, where the browser actually fills in pixels — colors, text, borders, images — based on the geometry layout already produced. A change can trigger both, just paint, or in some cases neither." },
      { question: "What is compositing, and how does it let some changes skip both layout and paint?", answer: "The browser can render certain elements onto separate layers that the GPU can move, scale, or fade independently of the rest of the page. If a change only affects one of these composited layers — like sliding it or changing its transparency — the browser can update it by recombining layers on the GPU, without recalculating layout or repainting pixels at all." },
      { question: "Why are `transform` and `opacity` recommended for animations over animating `top`/`left` or `width`/`height`?", answer: "`transform` and `opacity` can typically be handled entirely by compositing, skipping layout and paint. Animating `top`/`left` or `width`/`height` changes an element's actual geometry, forcing layout (and usually paint) to rerun on every single animation frame, which is far more expensive and more likely to drop frames." },
      { question: "What's the difference between `display: none` and `visibility: hidden`, in terms of rendering?", answer: "`display: none` removes the element from the render tree entirely — it has no box, takes up no space, and never reaches layout or paint. `visibility: hidden` keeps the element in the render tree and layout still reserves its space, it's just not painted, so surrounding elements don't shift into the gap it leaves behind." },
      { question: "How is `opacity: 0` different from `visibility: hidden`, even though both make something invisible?", answer: "Both skip painting the element visibly, but an `opacity: 0` element is still fully present and interactive — it can still be clicked, focused, and tabbed to. A `visibility: hidden` element is also removed from the accessibility tree and cannot be focused or clicked, even though, like `opacity: 0`, it still occupies its layout space." },
      { question: "What is the Critical Rendering Path, and why does it matter for perceived load speed?", answer: "It's the sequence of steps — parsing HTML into a DOM, parsing CSS into matched styles, building the render tree, running layout, then painting — that has to complete before any pixels appear on screen. Anything that delays an early step in that chain (a slow stylesheet, a blocking script) delays every step after it, directly affecting how long a user stares at a blank screen." },
      { question: "Why is CSS treated as render-blocking by default?", answer: "The browser can't safely paint elements whose final appearance and layout it doesn't know yet — a stylesheet could change any element's size, position, or visibility. So by default, it holds off building the render tree and painting until it has parsed all the CSS it currently knows about, to avoid painting a page that then has to be redrawn a moment later." },
      { question: "Why can a `<script>` tag without `defer` or `async` block HTML parsing?", answer: "The browser has to assume a synchronous script might use `document.write` or otherwise depend on or modify the DOM as it exists at that exact point, so it pauses parsing the rest of the HTML, fetches and runs the script fully, and only then resumes building the DOM from where it left off." },
      { question: "What is 'layout thrashing,' and how does it happen?", answer: "It's when code repeatedly forces the browser to recalculate layout synchronously, over and over, inside a loop — typically by reading a layout-dependent property (like `offsetHeight`) right after writing a style change, which forces the browser to flush pending layout work immediately to give an up-to-date answer, instead of batching it once per frame as usual." },
      { question: "A loop reads `element.offsetWidth` and then sets `element.style.width` for each of 50 elements — why is this slow, and how would you fix it?", answer: "Reading `offsetWidth` forces the browser to make sure layout is current before answering, and the style write right after it invalidates layout again — so alternating reads and writes across 50 elements can force roughly 50 separate forced layout recalculations. Reading all the needed values first, then writing all the style changes afterward, lets the browser batch it into a single layout pass." },
      { question: "Does a reflow ever affect elements other than the one that changed?", answer: "Yes. Layout is a tree-wide computation — changing one element's size can push its siblings into new positions, change its parent's size if the parent sizes to its content, or ripple further depending on the layout mode in use (normal flow, flexbox, grid), so the browser may need to recompute layout well beyond just the element that changed." },
      { question: "After layout recalculates, does the browser have to repaint the entire page?", answer: "No — paint invalidation is generally limited to the regions or layers actually affected by the change, not the whole viewport. Modern browsers track which areas became 'dirty' and only repaint those, which is part of why isolating frequently-changing content to its own composited layer can help performance." },
      { question: "Is every DOM node represented in the render tree?", answer: "No. Nodes that never produce visible output — like `<head>`, `<script>`, `<meta>` — and any element explicitly set to `display: none` are excluded, since the render tree only needs to contain what will actually need a box on screen." },
      { question: "Why does the browser start rendering before the entire HTML file has finished downloading?", answer: "The HTML parser is incremental — it builds the DOM as bytes stream in rather than waiting for the whole document, so the browser can start constructing the render tree and painting an initial view of the page as soon as enough content and CSS have arrived, rather than leaving the user staring at a blank screen the whole time." },
      { question: "Why does splitting rendering into separate stages (render tree, layout, paint) make the browser more efficient at handling later changes?", answer: "Because each stage only has to rerun when something relevant to it changes. A pure color change can skip layout entirely and go straight to paint; a change confined to a composited layer's transform can skip both layout and paint. Collapsing everything into one step would mean every change, however small, forced the full pipeline to rerun." },
      { question: "A page animates an element's `margin-left` in one place and `transform: translateX()` in another, both moving it the same distance — which is likely to feel smoother, and why?", answer: "The `transform: translateX()` version, because it can typically run entirely on the compositor, skipping layout and paint on every frame. Animating `margin-left` changes the element's actual position in the layout, forcing a layout recalculation (and usually a repaint) on every single frame of the animation." },
      { question: "What's the more precise, spec-adjacent name for what's often casually called 'reflow,' and what's the equivalent for 'repaint'?", answer: "'Reflow' corresponds to the layout stage — recalculating size and position. 'Repaint' corresponds to the paint stage — filling in pixels based on the layout already computed. The casual and formal names refer to the same two stages; 'reflow'/'repaint' just describe them as things that happen *again* in response to a change, after the initial layout/paint." },
    ],
    prerequisites: ["html-basics", "css-basics", "the-dom"],
    relatedTopics: ["the-dom", "css-basics", "web-performance-basics"],
    keywords: ["rendering", "render tree", "layout", "paint", "reflow", "rendering pipeline"],
  },
];
