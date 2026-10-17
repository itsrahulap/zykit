import type { Topic } from "../../types/content";

export const backendBeginnerTopics: Topic[] = [
  {
    id: "what-is-backend",
    title: "What is Backend Development?",
    level: "beginner",
    description: "The part of an app that runs on a server, not in the browser. It handles the logic, data and rules users should never see or control.",
    explanation: `
On a shopping site, much of what you see runs in your browser: buttons
animate, forms check your input, pages update. But some things can't
safely happen on your device: charging your card, checking real stock,
or checking your password. These must happen somewhere the user can't
see or tamper with, and that can reach a shared database.

That place is a **server**: another computer, usually in a data center,
that the browser sends requests to over the internet. The code running
there is the **backend**. The code running in the user's browser is the
**frontend**.

A backend usually does a few jobs:

- Stores and reads data, usually in a database.
- Applies business logic ("can this user cancel this order?").
- Talks to other systems, like payment providers or email services.
- Decides what to send back to the caller.
    `.trim(),
    analogy:
      "Think of a restaurant. The dining room (menu, table, the person taking your order) is the frontend: what you see and use. The kitchen is the backend: where the food is made, the fridge (database) is opened, and decisions about substitutions or sold-out items are made. You never walk into the kitchen; you send a request through a waiter and wait for a response.",
    examples: [
      {
        title: "A frontend action that needs a backend",
        code: `// In the browser (frontend): the user clicks "Place Order"
button.addEventListener("click", async () => {
  const response = await fetch("https://api.shop.com/orders", {
    method: "POST",
    body: JSON.stringify({ itemId: 42, quantity: 2 }),
  });
  const result = await response.json();
  showConfirmation(result);
});`,
        explanation: "The browser can't safely check stock or charge a card itself, so it sends a request to a server and waits for an answer.",
        walkthrough: [
          { code: 'fetch("https://api.shop.com/orders", { ... })', explanation: "The frontend sends a request over the network to a server whose internals it doesn't control." },
          { code: "method: \"POST\"", explanation: "Tells the server to create something (an order), not just fetch data." },
          { code: "const result = await response.json();", explanation: "The frontend waits for the backend's reply before showing the user anything." },
        ],
      },
      {
        title: "What the backend does with that request",
        code: `// On the server (backend): receiving that same request
app.post("/orders", async (req, res) => {
  const { itemId, quantity } = req.body;
  const item = await db.items.findById(itemId);

  if (item.stock < quantity) {
    return res.status(400).json({ error: "Not enough stock" });
  }

  const order = await db.orders.create({ itemId, quantity });
  res.status(201).json(order);
});`,
        explanation: "This code never runs on the user's device. It runs on the server, where it can be trusted to check real, shared, current data before deciding what happens.",
      },
    ],
    howItWorks: `
A backend is a program like any other, but it waits for incoming
requests instead of being opened by a user. When a request arrives, it
does some work (reads a database, runs a calculation, calls another
service) and sends a reply. It runs all the time and serves many users,
often at once.
    `.trim(),
    whyItExists: `
Code on a user's device can't be trusted: anyone with browser developer
tools can inspect, change or skip it. Backends keep sensitive logic,
shared data and trust checks on a server the business controls (owns or
rents), not in every user's hands.
    `.trim(),
    whenToUse: `
Put logic on a backend when the app needs to store data beyond one
visit, enforce a rule users can't bypass, keep a secret (like an API key
or password hash), or let many users see the same shared state.
    `.trim(),
    whenNotToUse: `
Purely visual behavior doesn't need a server round trip: animating a
menu, checking a field isn't empty before submit, or remembering a UI
preference for one session. Sending these to the backend when nothing
shared or sensitive is involved just adds network delay.
    `.trim(),
    commonMistakes: [
      "Assuming a rule is enforced because the frontend JavaScript checks it. A user can bypass frontend code entirely.",
      "Thinking 'backend' means one technology. It's a role a program plays, not a language or framework.",
      "Putting secrets (API keys, database passwords) in frontend code, where anyone can see them, instead of on the server.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List three things a shopping app's backend needs to do that its frontend cannot safely do alone." },
      { difficulty: "Medium", prompt: "Explain, in your own words, why checking a discount code's validity should happen on the backend rather than in the browser." },
      { difficulty: "Hard", prompt: "Describe what could go wrong if a banking app calculated your account balance entirely in frontend JavaScript instead of on a backend." },
    ],
    interviewQuestions: [
      { question: "What is backend development?", answer: "Building the part of an app that runs on a server: business logic, data storage and talking to other systems. The frontend, by contrast, runs in the user's browser." },
      { question: "Why can't sensitive business logic be trusted to run only in the browser?", answer: "Browser code runs on the user's own device, where dev tools can inspect, change or skip it. Anything that must be trusted, kept secret or checked against real shared data has to run on a server the business controls." },
      { question: "Give an example of something that must happen on a backend, and explain why.", answer: "Charging a payment. It needs a secret API key for the payment provider and the real, current price and total. None of that can be safely given to, or checked by, code on the customer's device." },
      { question: "What's the core difference between a frontend and a backend in terms of where the code executes and who controls that environment?", answer: "Frontend code runs on the user's device, which the user (or anyone with dev tools) fully controls. Backend code runs on a server the business owns or rents, so only the business can inspect or change it." },
      { question: "Why does checking whether an item is \"in stock\" need to happen on a backend rather than in the browser?", answer: "Stock is shared data that changes as other people buy. A browser only has the data it was last given, so only a backend talking to the live, shared database can give a trustworthy answer." },
      { question: "Using the restaurant analogy, why does a customer never walk into the kitchen themselves?", answer: "The kitchen is the backend, where the real work happens on shared resources like the fridge (the database). Letting customers control it directly would destroy consistency and trust, so requests go through a waiter (the network request) instead." },
      { question: "Why is it incorrect to say \"backend\" refers to one specific language or framework?", answer: "Backend is a role a program plays (handling requests, applying business logic, managing shared data), not a technology. Node.js, Python, Java, Go and many other stacks can fill it." },
      { question: "A backend trusts a `role: \"admin\"` value sent by the frontend in the request body to decide access. What's wrong with this?", answer: "Users can edit anything the frontend sends, so trusting a client-supplied role lets anyone make themselves admin. The backend must look up the user's real role from its own trusted data, like a session or database record." },
      { question: "Why does validating a form field in frontend JavaScript still have value even though it isn't a real security measure?", answer: "It gives the user instant feedback without a network round trip. But the backend must repeat the same check, because the frontend check can be bypassed." },
      { question: "What risk does hardcoding a database password directly into frontend source code create?", answer: "Frontend code runs in every user's browser, where dev tools show the full source. A secret there is visible to anyone who looks, so the password is effectively public." },
      { question: "If two users try to buy the last unit of an item at the same moment, why must the stock check happen on a shared backend rather than in each user's own browser?", answer: "Each browser only has its own, possibly stale, view of stock. Only a backend using one shared, authoritative database can see both attempts and let just one succeed." },
      { question: "What does it mean for a backend to \"enforce a rule the user shouldn't be able to bypass,\" and why can't that same rule live only in frontend code?", answer: "The rule is checked somewhere the user can't tamper with or skip. Frontend code runs fully under the user's control, so a check there can be disabled, edited, or skipped by calling the backend directly." },
      { question: "Why does a backend typically need access to a shared database, while a purely frontend app usually doesn't?", answer: "A backend serves many users who all see and change the same data (orders, inventory, accounts). A frontend only shows and collects data for one user, and gets that data from the backend." },
      { question: "Name a UI behavior that doesn't need a backend round trip, and explain what makes it safe to keep client-side only.", answer: "Animating a menu, or checking a text field isn't empty before submit. These only affect the current user's screen, touch no shared data, and risk nothing if done in the browser." },
      { question: "Why is \"the frontend already validated this\" never a safe assumption for backend code to make?", answer: "A request can reach the backend without going through your frontend at all, via curl, Postman or a modified app. So the backend must validate anything it can't afford to get wrong." },
      { question: "Beyond \"it's more secure,\" why must charging a credit card run on a backend rather than in the browser?", answer: "It needs a secret merchant API key that users must never see, and it must use the real, server-checked order total, not whatever amount the browser sends." },
      { question: "What's the practical consequence of a backend being the one thing every user's frontend talks to, rather than each user running their own private copy of the logic?", answer: "There's one place enforcing the rules and one shared source of truth, so all users see consistent results. A fix or rule change on the backend applies to everyone at once, without updating any user's device." },
      { question: "Why might a backend also be described as running on \"a server,\" and is that a specific machine?", answer: "\"Server\" is a role (always listening for and answering requests), not specific hardware. It can be a physical machine, a virtual machine or a container, as long as it runs the backend and is reachable over the network." },
    ],
    relatedTopics: ["servers-and-web-frameworks", "request-response-lifecycle"],
    keywords: ["backend", "server-side", "frontend vs backend", "client-server"],
  },
  {
    id: "servers-and-web-frameworks",
    title: "Servers & Web Frameworks",
    level: "beginner",
    description: "What a web framework like Express does for you, compared with the repetitive plumbing you'd otherwise write by hand.",
    explanation: `
A web server has one core job: listen for connections, read each
request, and send back a response. Node.js can do this with its built-in
\`http\` module. But used directly, *everything* is your job: working out
the URL and HTTP method, parsing the request body, and handling errors
so one bad request doesn't crash the server.

A **web framework** is a library that already solves this plumbing.
Express is the most common one for Node.js. It lets you say "when a GET
request comes in for /users, run this function" and handles the request
parsing, so you can focus on what your app does.
    `.trim(),
    analogy:
      "Writing a server with raw Node.js is like building a house by mining your own ore to forge nails. A framework like Express is a stocked hardware store: the nails, screws and pre-cut lumber already exist, so you spend your time designing the house.",
    examples: [
      {
        title: "Raw Node.js — doing everything yourself",
        code: `const http = require("http");

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/hello") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello!");
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(3000);`,
        explanation: "You must check the method and URL, set status codes and headers, and handle every unmatched path yourself.",
        walkthrough: [
          { code: "http.createServer((req, res) => {...})", explanation: "Creates a raw server. Every request goes through this one function, whatever its URL or method." },
          { code: 'if (req.method === "GET" && req.url === "/hello")', explanation: "You check the method and path yourself. There's no built-in routing." },
          { code: 'res.writeHead(200, { "Content-Type": "text/plain" });', explanation: "You set the status code and headers by hand for every response." },
        ],
      },
      {
        title: "The same server with Express",
        code: `const express = require("express");
const app = express();

app.get("/hello", (req, res) => {
  res.send("Hello!");
});

app.listen(3000);`,
        explanation: "Express matches the method and path for you, defaults to a 200 status and sensible headers, and returns a 404 for anything unmatched.",
      },
    ],
    howItWorks: `
Express is built on top of Node's \`http\` module; it doesn't replace it.
When a request arrives, Express finds the registered route whose method
and path match. It then calls your function with \`req\` and \`res\` objects
that have helper methods like \`res.json()\` and \`res.status()\`.
    `.trim(),
    whyItExists: `
Almost every backend needs the same scaffolding: routing, body parsing,
consistent headers and error handling. Writing it from scratch each time
is repetitive and error-prone. Frameworks solve it once, and make code
across projects look familiar.
    `.trim(),
    whenToUse: `
Use a web framework for almost any real backend, even a small one, so
you don't hand-roll routing and error handling. It's the default unless
you have a specific reason not to.
    `.trim(),
    whenNotToUse: `
For a tiny script that answers one fixed request (like a health check
with no other logic), a full framework can be overkill. Node's \`http\`
module or a minimal library may be enough.
    `.trim(),
    commonMistakes: [
      "Thinking a framework replaces Node.js. It's built on top of it.",
      "Assuming Express is the only option. Fastify, Koa and NestJS solve the same problem with different trade-offs.",
      "Forgetting that a framework still runs your code. It organizes things, but you still write the business logic.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a raw Node.js `http` server that responds with \"pong\" to any request." },
      { difficulty: "Medium", prompt: "Rewrite that same server using Express, and add a second route that returns JSON." },
      { difficulty: "Hard", prompt: "List three things Express does automatically that you'd otherwise write by hand in raw Node.js." },
    ],
    interviewQuestions: [
      { question: "What problem does a web framework solve?", answer: "It handles the repetitive low-level plumbing of a server (routing, parsing request data, response helpers, error handling), so developers can focus on app logic instead of rebuilding it each project." },
      { question: "Is Express a replacement for Node.js?", answer: "No. Express is a library on top of Node's built-in `http` module. It simplifies raw requests and responses, but Node still creates the server and handles connections." },
      { question: "Name one thing you'd have to write manually with raw Node.js that a framework provides out of the box.", answer: "Routing requests by method and path. In raw Node you check `req.method` and `req.url` with if-statements; a framework lets you write `app.get(\"/path\", handler)`." },
      { question: "What does `app.listen(3000)` in Express correspond to under the hood in raw Node.js?", answer: "It uses the same mechanism as `http.createServer(...).listen(3000)`. Express builds its app on Node's http server rather than replacing it." },
      { question: "Why does raw `http.createServer` funnel every request through a single callback function, and what problem does that create as an app grows?", answer: "Node's http module is low-level: it gives you one entry point and you branch on method and URL yourself. As endpoints grow, that one function fills with if-statements and gets hard to read and maintain." },
      { question: "In raw Node.js, what happens to a request for a URL you never explicitly checked with an if-statement?", answer: "It falls into whatever `else` branch you wrote, if any. If you didn't handle it, the response may hang, because Node has no automatic \"not found\" behavior." },
      { question: "Compare `res.send(\"Hello!\")` in Express to what you'd write manually with raw `http` to send the same response.", answer: "With raw `http` you call `res.writeHead(200, { \"Content-Type\": \"text/plain\" })` then `res.end(\"Hello!\")`. `res.send()` picks a sensible status and content type and ends the response for you." },
      { question: "Why is it wrong to think of Express and Node.js as two competing ways to build a server?", answer: "Express uses Node's own `http` module internally, so using Express still means using Node. You're only choosing between Node's low-level API and Express's higher-level layer." },
      { question: "Where do the `req` and `res` objects in an Express handler actually come from?", answer: "From Node's `http` module. Express wraps and extends them with helpers like `res.json()` and `res.status()`; it doesn't replace them." },
      { question: "Name two other Node.js web frameworks besides Express, and what does having multiple options tell you about framework choice?", answer: "Fastify and Koa (also NestJS). Having several shows there's no single \"correct\" choice: each makes different trade-offs (performance, structure, minimalism) while solving the same routing and request-handling problem." },
      { question: "A raw Node http server needs a 10th route added by hand. What specifically gets harder as each new `if` branch is added?", answer: "The single handler grows with every route. It gets harder to see which condition matches which URL, easier to get check order wrong, and harder for several developers to work on routes without editing the same function." },
      { question: "Why does Express automatically respond with 404 to an unmatched route, when raw `http.createServer` does not do this automatically?", answer: "\"No route matched\" is so common that Express handles it once, in its routing system, so no project has to write that catch-all by hand." },
      { question: "What does it mean that \"a framework still runs your own code\"? What decisions does it not make for you?", answer: "The framework handles structure (matching requests to handlers, formatting responses), but it doesn't know what your app should do. The business logic in each handler (what to fetch, compute, or enforce) is still yours." },
      { question: "When would using raw Node's http module instead of a framework actually make sense?", answer: "For something tiny and fixed, like one health-check endpoint with no other logic. A full framework's routing and middleware is more overhead than a few lines of raw Node." },
      { question: "If you removed the `else` branch from a raw Node http server that checks `req.method === \"GET\" && req.url === \"/hello\"`, what would happen to an unmatched request?", answer: "No response would be written or ended, so the client would hang indefinitely. Node sends no default response, unlike a framework's built-in 404." },
      { question: "Why do frameworks provide convenience methods like `res.json()` instead of just handing you Node's raw response object?", answer: "Sending JSON by hand means setting `Content-Type`, calling `JSON.stringify`, and ending the response in the right order every time. `res.json()` does it in one call, so you can't forget a step." },
      { question: "What's a concrete cost of pulling in a full framework for a project that only ever needs one fixed health-check endpoint?", answer: "You add a dependency (plus its own dependencies) to install, update and trust, along with some startup overhead and unused features, when a few lines of raw Node would do the job." },
      { question: "Why is raw Node http described as \"mining your own ore to forge nails\" compared to a framework?", answer: "With raw Node, even basic pieces everyone needs (routing, headers, error fallbacks) must be built from scratch. A framework supplies them so you can focus on the app." },
      { question: "If you swapped Express for Fastify in a project, what would change, and what would stay solved either way?", answer: "The API for defining routes and middleware would change, since each framework has its own syntax. The core problem (routing requests without hand-rolled plumbing) stays solved either way." },
      { question: "What's the risk of a team writing its own ad hoc routing and parsing logic instead of adopting an existing, widely used framework?", answer: "They'd re-solve problems (routing, error handling, header parsing) that established frameworks have already battle-tested. That costs time better spent on features and likely brings edge-case bugs those frameworks fixed long ago." },
    ],
    prerequisites: ["what-is-backend"],
    relatedTopics: ["what-is-backend", "routing", "middleware"],
    keywords: ["express", "node.js", "http module", "web framework"],
  },
  {
    id: "routing",
    title: "Routing",
    level: "beginner",
    description: "How a server decides which code handles a given URL and HTTP method.",
    explanation: `
A backend does many things: list users, create orders, delete comments.
Every request arrives with a **path** (like \`/users\` or \`/orders/42\`)
and a **method** (GET, POST, PUT, DELETE...). Together they say what the
caller wants, and the server uses them to pick which function runs.

That mapping from "method + path" to a handler function is **routing**.
Each single mapping (like "GET /users runs this function") is a
**route**.
    `.trim(),
    analogy:
      "A router is like the directory board in an office lobby: you say who you want to see and why (a delivery or a meeting), and it tells you which floor and room to go to. Without it, you'd knock on every door in the building.",
    examples: [
      {
        title: "Basic routes by method and path",
        code: `app.get("/users", (req, res) => {
  res.json(allUsers);
});

app.post("/users", (req, res) => {
  const newUser = createUser(req.body);
  res.status(201).json(newUser);
});

app.delete("/users/:id", (req, res) => {
  deleteUser(req.params.id);
  res.status(204).end();
});`,
        explanation: "The same path, /users, does different things depending on the HTTP method. Routing tells them apart.",
        walkthrough: [
          { code: 'app.get("/users", ...)', explanation: "Registers a route: when a GET request arrives for /users, call this function." },
          { code: 'app.post("/users", ...)', explanation: "Same path, different method: this route creates a user instead of listing them." },
          { code: 'app.delete("/users/:id", ...)', explanation: "The :id part is a route parameter. It matches any value in that position, like /users/42, and is available as req.params.id." },
        ],
      },
      {
        title: "Route parameters and query strings",
        code: `// GET /products/17?color=red
app.get("/products/:id", (req, res) => {
  const productId = req.params.id;   // "17"
  const color = req.query.color;     // "red"
  res.json(findProduct(productId, color));
});`,
        explanation: "Route parameters (:id) capture parts of the path. Query strings (?color=red) carry optional extras after a question mark.",
      },
    ],
    howItWorks: `
When a request arrives, the framework checks your routes in the order
you defined them, comparing each one's method and path pattern. At the
first match, it runs that handler and stops looking (unless the handler
passes control on). If nothing matches, it sends a default "not found"
response.
    `.trim(),
    whyItExists: `
Without routing, one giant function would check the method and path
with endless if-statements. Routing lets you declare clearly which code
handles which request, so the codebase stays easy to navigate as it
grows to dozens or hundreds of endpoints.
    `.trim(),
    whenToUse: `
Every endpoint needs a route. Whenever a client should reach some server
logic through a specific URL and method, define a route for it.
    `.trim(),
    whenNotToUse: `
Logic not triggered by a request doesn't need a route. A scheduled job
or internal helper isn't called by URL.
    `.trim(),
    commonMistakes: [
      "Defining a general route (like /users/:id) before a specific one (like /users/me). The general one matches first and swallows requests meant for the specific one.",
      "Forgetting that the same path can mean different things for different HTTP methods.",
      "Confusing route parameters (part of the path, like :id) with query strings (the ?key=value part after the path).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a route that responds to a GET request at /ping with the text \"pong\"." },
      { difficulty: "Medium", prompt: "Write a route /articles/:slug that reads the slug from the URL and returns it in a JSON response." },
      { difficulty: "Hard", prompt: "Explain why putting app.get(\"/users/:id\") before app.get(\"/users/me\") causes a bug, and show how to fix the order." },
    ],
    interviewQuestions: [
      { question: "What is routing in a web server?", answer: "The mechanism that maps an incoming request's method and URL path to the specific function that should handle it." },
      { question: "What's the difference between a route parameter and a query string?", answer: "A route parameter is a named part of the path itself, like `:id` in `/users/:id`, while a query string is optional key-value data appended after a question mark, like `?sort=asc`." },
      { question: "What typically happens if no route matches an incoming request?", answer: "The framework falls back to a default handler, usually responding with a 404 Not Found status." },
      { question: "Why does the exact same URL path behave completely differently depending on the HTTP method used?", answer: "A route is method *and* path together. `GET /users` and `POST /users` are two separate routes that share a path, each with its own handler." },
      { question: "Given `app.get(\"/users/:id\", handler1)` registered before `app.get(\"/users/me\", handler2)`, which handler runs for a GET request to `/users/me`, and why?", answer: "`handler1` runs. `:id` matches any value there, including the text \"me\". The framework checks routes in registration order and stops at the first match, so the general pattern wins even though `/users/me` was meant for `handler2`." },
      { question: "How would you fix the ordering bug from the previous question so `/users/me` reaches the correct handler?", answer: "Register the specific route, `app.get(\"/users/me\", handler2)`, before the general `app.get(\"/users/:id\", handler1)`, so the exact match is checked first." },
      { question: "In `app.get(\"/users/:id\", ...)`, what does `req.params.id` contain for a request to `/users/42`?", answer: "The string `\"42\"`. Route parameters are strings taken from the URL; they aren't converted to numbers or other types." },
      { question: "For a request to `/products/17?color=red`, what does `req.query` contain, and how does that differ from `req.params`?", answer: "`req.query` is `{ color: \"red\" }`, the data after the `?`, usually optional filters. `req.params` is `{ id: \"17\" }`, captured from the path pattern. Params usually identify the resource and are required; query strings are usually optional refinements." },
      { question: "Why does a framework generally stop looking for further route matches once it finds the first one that matches?", answer: "A request should be handled once. Running it through every matching route would be wasteful and ambiguous, so the framework runs the first match and treats the request as handled." },
      { question: "Why does it matter that a route to delete a resource uses the DELETE method rather than just reusing GET for everything?", answer: "Routing uses the method as well as the path, so DELETE lets one URL safely support several operations. It also lets tools, caches and other developers see what a request does without reading its body." },
      { question: "A route is defined as `app.post(\"/users\", ...)`, but a client sends a GET request to `/users` and no other route matches. What happens?", answer: "The method doesn't match, so no route matches. The request falls through to the framework's default \"not found\" behavior, usually a 404." },
      { question: "Why is it a mistake to think of a route path as matching regardless of HTTP method?", answer: "A route always pairs a method with a path pattern. A path alone isn't a full route, so `/users` registered only for GET won't match a POST to that path." },
      { question: "Why does the order in which routes are registered matter, if the framework is just checking each one against the request?", answer: "The framework stops at the first match, not the best match. A general pattern registered earlier can catch requests meant for a specific one registered later, so order acts as priority." },
      { question: "A team registers `app.get(\"/articles/:slug\", handler1)` before `app.get(\"/articles/featured\", handler2)`. What bug will `/articles/featured` hit?", answer: "Requests to `/articles/featured` are always caught by the `:slug` route, since `:slug` matches the text \"featured\" like any other value. `handler2` never runs." },
      { question: "What general rule of thumb avoids the \"general route matches before specific route\" bug?", answer: "Register specific, literal routes before general, parameterized ones that could match the same requests." },
      { question: "Can a single path like `/users` have more than one route registered against it?", answer: "Yes. A route is method plus path, so `/users` can have separate GET, POST, DELETE (and other) routes, each with its own handler." },
      { question: "Why can a route parameter like `:id` match values you didn't expect, such as non-numeric text where you assumed a number, and what problem can that cause?", answer: "A route parameter captures whatever text is in that URL segment, with no type or format check. `/users/:id` matches `/users/abc` as readily as `/users/42`, so the handler must validate or convert the value, or it may crash or misbehave." },
      { question: "What's the difference in purpose between a route parameter and a query string, beyond syntax — when would you reach for one over the other?", answer: "A route parameter usually identifies which resource you're working on, so it's part of the path's identity (`/orders/42`). A query string usually adds optional modifiers, like sorting or filtering, that don't change which resource it is (`/orders?status=shipped`)." },
      { question: "Is there a meaningful difference between `/users/:id` and `/users?id=42` achieving something similar?", answer: "Yes. By convention, `/users/:id` says \"this URL is one specific user\", while `/users?id=42` reads as \"list users, filtered by id\". The intent differs even if the data returned overlaps." },
      { question: "Why does a framework need a \"no routes matched\" fallback at all, rather than assuming a route always exists?", answer: "Clients can request any path: typos, old URLs, malicious probes. A server can't guarantee a route exists for every request, so it needs defined behavior when nothing matches." },
      { question: "Walk through what happens, in order, when a `DELETE /users/42` request arrives.", answer: "The framework checks routes in the order defined, comparing each method and path pattern with `DELETE` and `/users/42`. When it reaches a match like `app.delete(\"/users/:id\", ...)`, it runs that handler with `req.params.id` set to `\"42\"` and stops looking." },
      { question: "If two routes are registered for the exact same method and path — `app.get(\"/x\", a)` then `app.get(\"/x\", b)` — which one runs, and why might this be a bug?", answer: "Handler `a` runs, because it was registered first and the framework stops at the first match. `b` is dead code for that path, which is almost always a mistake." },
      { question: "Why is routing described as replacing \"one giant function with endless if-statements\"? What would that alternative look like, and why is it harder to maintain?", answer: "Without routing, one handler would check `method === \"GET\" && url === \"/users\"`, then `method === \"POST\" && url === \"/users\"`, and so on for every endpoint. With dozens of endpoints, that function becomes long, hard to navigate, and prone to ordering and typo bugs. Separate routes keep each endpoint's logic isolated and easy to find." },
      { question: "Why doesn't routing logic apply to a scheduled background job, even though that job also runs backend code?", answer: "Routing maps an incoming HTTP request's method and path to a handler. A background job isn't triggered by a request or URL, so there's nothing to match. It's called directly on a timer or trigger, like any function." },
      { question: "How is routing conceptually similar to a JavaScript `switch` statement, and how is it different?", answer: "Both pick one branch from several by matching an incoming value. But a `switch` usually matches one exact value, while routing matches two things at once (method and path pattern), and path patterns can include parameters that match many values." },
    ],
    prerequisites: ["servers-and-web-frameworks"],
    relatedTopics: ["servers-and-web-frameworks", "middleware", "request-response-lifecycle"],
    keywords: ["routing", "route parameters", "http methods", "endpoints"],
  },
  {
    id: "middleware",
    title: "Middleware",
    level: "beginner",
    description: "Small functions that run before a request reaches its route handler. Each one can inspect, change or stop the request.",
    explanation: `
Some work must happen on *every* (or almost every) request, whatever the
route: logging it, checking the user is logged in, parsing the raw body.
Repeating that in every handler is tedious and error-prone.

**Middleware** are functions that sit between the incoming request and
its route handler. Each one can look at the request, do some work, and
then either pass control to the next function or stop the chain (for
example, rejecting an unauthenticated request before it reaches the
route).
    `.trim(),
    analogy:
      "Think of airport security between the entrance and your gate: one checkpoint checks your ticket, another scans your bag, another checks your ID. Each one waves you on or stops you if something's wrong. Your route handler is the gate; middleware is everything you pass through to get there.",
    examples: [
      {
        title: "A simple logging middleware",
        code: `function logger(req, res, next) {
  console.log(\`\${req.method} \${req.url}\`);
  next(); // pass control to the next function in line
}

app.use(logger);

app.get("/users", (req, res) => {
  res.json(allUsers);
});`,
        explanation: "logger runs before every route in this app, because it's registered with app.use() instead of tied to one path.",
        walkthrough: [
          { code: "function logger(req, res, next) {", explanation: "Middleware receives req and res, like a route handler, plus a third argument: next." },
          { code: "console.log(`${req.method} ${req.url}`);", explanation: "Does its one job (recording the request) without knowing what happens after it." },
          { code: "next();", explanation: "Hands control to the next function in the chain. Without this line, the request hangs forever." },
        ],
      },
      {
        title: "Middleware that can stop the chain",
        code: `function requireAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

app.get("/orders", requireAuth, (req, res) => {
  res.json(getOrdersFor(req.user));
});`,
        explanation: "requireAuth is attached to this one route only. If the check fails, it sends a response and never calls next(), so the route handler never runs.",
      },
    ],
    howItWorks: `
Middleware runs in the order it's registered, forming a chain. Each
function receives \`(req, res, next)\`: the same request and response as a
route handler, plus a \`next\` function.

Calling \`next()\` moves on to the next middleware, or to the matching
route handler at the end of the chain. *Not* calling \`next()\` (for
example, because you called \`res.send()\`) stops the chain, so nothing
after it runs for that request.
    `.trim(),
    diagram: `
Request
   │
   ▼
[logger]  → calls next()
   │
   ▼
[requireAuth]  → calls next() OR sends 401 and stops
   │
   ▼
[route handler]  → sends the final response
    `.trim(),
    whyItExists: `
Middleware lets you write cross-cutting behavior once (logging, auth
checks, body parsing, response compression) and apply it to many routes,
instead of copy-pasting it into every handler.
    `.trim(),
    whenToUse: `
Use middleware for anything that should happen the same way across many
routes: auth checks, request logging, parsing JSON bodies, or rejecting
malformed requests before they reach your business logic.
    `.trim(),
    whenNotToUse: `
Logic specific to one route, and unlikely to be reused, is usually
simpler to write inside that route's handler.
    `.trim(),
    commonMistakes: [
      "Forgetting to call `next()`, which leaves the request hanging with no response.",
      "Calling `next()` *after* sending a response, which causes confusing \"headers already sent\" errors.",
      "Registering middleware in the wrong order, such as putting a route before the auth middleware meant to protect it.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a middleware function that logs the current timestamp for every request." },
      { difficulty: "Medium", prompt: "Write a middleware function that rejects any request missing an `x-api-key` header with a 401 response." },
      { difficulty: "Hard", prompt: "Explain what happens if a middleware function neither calls `next()` nor sends a response, and why that's a bug." },
    ],
    interviewQuestions: [
      { question: "What is middleware in a web framework?", answer: "A function that runs between an incoming request and its route handler. It can inspect, change, or stop the request before it continues down the chain." },
      { question: "What does calling `next()` do?", answer: "It passes control to the next middleware in the chain, or to the matching route handler if none are left." },
      { question: "Give an example of something commonly implemented as middleware.", answer: "Authentication checks, request logging, and parsing the request body." },
      { question: "What three parameters does an Express middleware function typically receive, and what is each one for?", answer: "`req` (the incoming request, to read), `res` (the outgoing response, to write or send), and `next` (a function that hands control to whatever comes next in the chain)." },
      { question: "What happens to a request if a middleware function never calls `next()` and never sends a response?", answer: "It hangs. Nothing later in the chain runs, and with no response sent, the client waits until it times out." },
      { question: "Why does forgetting to call `next()` \"hang\" the request instead of causing an immediate visible error?", answer: "Express only knows a middleware is done when it calls `next()` or sends a response. If neither happens, Express keeps waiting, since doing nothing looks the same as slow work." },
      { question: "Given `app.use(logger)` registered before `app.get(\"/users\", handler)`, in what order do `logger` and `handler` run for a request to `/users`, and why?", answer: "`logger` runs first, then `handler`. Middleware registered with `app.use()` runs before the matched route, and `logger` must call `next()` for `handler` to run at all." },
      { question: "What's the difference between middleware registered with `app.use(middleware)` and middleware attached to just one route, like `app.get(\"/orders\", requireAuth, handler)`?", answer: "`app.use(middleware)` runs for every request that reaches it, whatever the path. Middleware passed as an extra argument to a route only runs for that route." },
      { question: "In `requireAuth`, if `req.headers.authorization` is missing, the function calls `res.status(401).json(...)` without calling `next()`. Does the route handler run?", answer: "No. `next()` is never called, so the chain stops at `requireAuth` and only the 401 response is sent." },
      { question: "Why is `return res.status(401).json(...)` written with a `return` in front of it, rather than calling it on its own line?", answer: "The `return` stops the function there. Without it, execution could reach a later `next()` call, so the request would both get a response and continue down the chain, causing errors." },
      { question: "What would you expect if a middleware function called both `next()` and `res.send()` for the same request?", answer: "The first response really sends. Then, because `next()` let the chain continue, a later attempt to respond throws a \"headers already sent\" error, since a request can only be answered once." },
      { question: "Why does the order in which middleware is registered matter, using an auth-check-before-route example?", answer: "Middleware runs in registration order, so an auth check must be registered before the route it protects. If it came after, the route handler would already have run and responded." },
      { question: "A developer registers `app.get(\"/admin\", handler)` before the `requireAuth` middleware meant to protect it. What's the consequence?", answer: "`requireAuth` never runs for `/admin`, because the route already matched, ran and responded. The protection is bypassed completely." },
      { question: "Why is repeating an authentication check inside every route handler worse practice than extracting it into one middleware function?", answer: "Every route must remember to include the check correctly, and one missed or wrong copy is a security hole. One shared middleware keeps the logic in one place, fixed once and applied consistently." },
      { question: "What is the airport security analogy illustrating about how middleware functions relate to each other and the final route handler?", answer: "Each checkpoint (middleware) either waves you on or stops you, and you only reach the gate (route handler) after passing every checkpoint in order. Middleware is an ordered chain where each link can pass control on or end things early." },
      { question: "If `app.use(logger)` is registered with no path argument, which requests does it run for?", answer: "All of them. `app.use()` without a path applies to every request that reaches that point in the chain, whatever route it matches." },
      { question: "Can a middleware function modify the `req` object before passing it on? Give an example of why that's useful.", answer: "Yes. Middleware can attach properties to `req` for later code. For example, `requireAuth` can set `req.user` after checking credentials, so the handler can use `req.user` without re-checking." },
      { question: "With middleware order `[express.json(), logger, requireAuth, routeHandler]`, why must `express.json()` run before anything that reads `req.body`?", answer: "`req.body` doesn't exist until something reads and parses the raw body. `express.json()` does that, so anything using `req.body`, including `requireAuth` or the handler, must run after it." },
      { question: "What's the difference between middleware meant to run on every request versus middleware scoped to one route or group of routes?", answer: "Global middleware (top-level `app.use()`) runs for all requests. Scoped middleware is passed to specific routes (or `app.use()` on a path or router) and only runs for requests going there." },
      { question: "Why choose to write logic as middleware rather than calling a regular helper function at the top of each route handler?", answer: "Middleware is registered once and applies automatically to every route it's attached to. A helper only works if every developer remembers to call it in every relevant handler." },
      { question: "What does it mean for middleware to \"short-circuit\" the request? Give an example.", answer: "The middleware ends the request itself instead of passing it on. For example, `requireAuth` sends a 401 and doesn't call `next()`, so the route handler and any later middleware never run." },
      { question: "Is the route handler itself technically also a kind of middleware in Express?", answer: "Effectively, yes. It has the same `(req, res, next)` shape and sits at the end of the same chain. It's usually called last and ends the chain by sending a response instead of calling `next()`." },
      { question: "If two middleware functions are both registered with `app.use()` and the first calls `next()`, does the second get its own fresh chance to act, or does it just see the first one's finished response?", answer: "It gets its own chance to act on the same `req` and `res`. Calling `next()` doesn't finalize anything; it just hands control on, so the second middleware can still inspect or change things before a response is sent." },
      { question: "Why write a validation check like \"reject requests missing a required header\" as middleware instead of repeating it at the start of every relevant route handler?", answer: "As middleware, the check is written once and attached to as many routes as needed (or globally). A new route only needs the existing middleware attached, not a rewritten check." },
      { question: "What real problem would occur if `requireAuth` accidentally called `next()` even when authentication failed?", answer: "The chain would continue to the route handler despite missing or invalid credentials, bypassing the auth check and exposing protected routes." },
      { question: "Does calling `next()` inside a middleware function execute the next function immediately and synchronously, and why does this matter?", answer: "Yes. `next()` is an ordinary function call, so the next middleware starts running right away. If that function does async work (like a database call), its code after that point runs later, when the work finishes. This matters when reasoning about order in chains that mix sync and async middleware." },
      { question: "How would you write a middleware function that only logs requests to paths starting with `/api`, while still being registered globally with `app.use()`?", answer: "Inside the middleware, check `req.path.startsWith(\"/api\")` (or similar) before logging, and always call `next()` whatever the result. One global function can then act on only some requests." },
      { question: "Why is `app.use(express.json())` still considered middleware even though it doesn't reject or check anything?", answer: "Middleware doesn't have to check or reject anything. What defines it is sitting in the request chain and calling `next()`. `express.json()` transforms the request (parsing the body into `req.body`) instead of checking it, but it has the same shape and role." },
    ],
    prerequisites: ["routing"],
    relatedTopics: ["routing", "request-response-lifecycle", "error-handling-apis"],
    keywords: ["middleware", "next()", "request chain", "app.use"],
  },
  {
    id: "request-response-lifecycle",
    title: "Request/Response Lifecycle",
    level: "beginner",
    description: "The full journey of a request, from arriving at your server to the response being sent back.",
    explanation: `
Every backend interaction has the same shape: something asks (a
**request**) and the server answers (a **response**). In between,
several steps happen in a predictable order.

Knowing that sequence, the **request/response lifecycle**, helps you
decide where logging and auth checks belong, and why a response
sometimes never arrives.
    `.trim(),
    analogy:
      "A drive-through: your car pulls up (a request arrives), you pass the ordering speaker and payment window (middleware), your order reaches the kitchen (the route handler), the food is made (business logic runs), and it's handed to you at the pickup window (the response is sent). If any step fails, you never reach the end.",
    examples: [
      {
        title: "Tracing one request through the whole lifecycle",
        code: `app.use(express.json());          // 1. parse the request body
app.use(logger);                  // 2. log the request

app.get("/products/:id", (req, res) => {  // 3. matched route runs
  const product = findProduct(req.params.id); // 4. business logic
  if (!product) {
    return res.status(404).json({ error: "Not found" }); // 5a. response
  }
  res.json(product);             // 5b. response
});`,
        explanation: "Every request to this server goes through the same numbered stages, even though the data differs each time.",
        walkthrough: [
          { code: "app.use(express.json());", explanation: "Stage 1: the raw body arrives as bytes and is parsed into a JavaScript object before anything else uses it." },
          { code: "app.use(logger);", explanation: "Stage 2: cross-cutting middleware runs; here it just records the request." },
          { code: 'app.get("/products/:id", (req, res) => {', explanation: "Stage 3: the framework matched this request to one route handler by method and path." },
          { code: "const product = findProduct(req.params.id);", explanation: "Stage 4: the business logic, the reason this endpoint exists, runs here." },
          { code: "res.json(product);", explanation: "Stage 5: a response is built and sent, ending the lifecycle for this request." },
        ],
      },
      {
        title: "A request that ends early",
        code: `app.use((req, res, next) => {
  if (isBlocked(req.ip)) {
    return res.status(403).send("Forbidden"); // lifecycle ends here
  }
  next();
});

app.get("/data", (req, res) => {
  res.json(getData()); // never reached for blocked IPs
});`,
        explanation: "The lifecycle doesn't always reach the route handler. Any middleware can send a response and end it early.",
      },
    ],
    howItWorks: `
A request usually goes through these steps:

- It arrives at the server.
- The framework parses headers and the body.
- Global middleware runs, in order.
- The framework matches a route by method and path.
- Route-specific middleware runs.
- The route handler runs the app logic, often with a database call.
- A response is built with a status code, headers and a body.
- The response is sent back over the network, closing the request.

Once a response is sent, nothing more can be sent for that request.
    `.trim(),
    diagram: `
Client
  │  request
  ▼
[Parsing] → [Global middleware] → [Route matching]
                                        │
                                        ▼
                              [Route-specific middleware]
                                        │
                                        ▼
                                 [Route handler]
                                        │
                                        ▼
                                 [Build response]
                                        │
                                        ▼
Client ◄──────────────── response ─────┘
    `.trim(),
    whyItExists: `
A fixed lifecycle gives every developer a shared picture of where each
piece of code runs relative to the rest. That's essential for debugging
(why did this request never get logged?) and for deciding where new
logic belongs.
    `.trim(),
    whenToUse: `
Use it when deciding where new logic belongs (global middleware, one
route, or inside the handler) or when debugging an unexpected request.
    `.trim(),
    whenNotToUse: `
You don't "use" the lifecycle directly; every request already runs
through it. It applies to any HTTP backend, though very different
systems (like a raw TCP server with no framework) may be structured
differently.
    `.trim(),
    commonMistakes: [
      "Sending a second response after one was already sent, which causes a runtime error.",
      "Not noticing that earlier middleware or a handler already ended the lifecycle, so later code never runs.",
      "Putting expensive, request-specific work in global middleware, so it runs on every request, even ones that don't need it.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List, in order, the stages a GET request goes through in an Express app with one logging middleware and one route." },
      { difficulty: "Medium", prompt: "Write a small Express app where middleware blocks requests without a specific header. Trace what happens to a blocked request and an allowed one." },
      { difficulty: "Hard", prompt: "Explain what error you'd expect if a route handler calls `res.json()` twice for the same request, and why." },
    ],
    interviewQuestions: [
      { question: "What is the request/response lifecycle?", answer: "The ordered steps a request goes through from arriving at a server to a response being sent: parsing, middleware, routing, the handler, and the final response." },
      { question: "Can the lifecycle end before reaching the route handler?", answer: "Yes. Any middleware can send a response itself and not call `next()`, ending the lifecycle early." },
      { question: "What happens if code tries to send a response after one has already been sent for the same request?", answer: "It typically causes a runtime error, since a single request can only be answered with one response." },
      { question: "List, in order, the main stages a request passes through in a typical Express app, from arrival to response.", answer: "Arrival, parsing (headers and body), global middleware, route matching, route-specific middleware, the route handler running the app logic, building the response (status, headers, body), and sending it back over the network." },
      { question: "Why does body-parsing like `express.json()` need to run before any middleware or handler that reads `req.body`?", answer: "`req.body` only exists after something reads and parses the raw bytes. Anything registered before the parser sees `req.body` as undefined." },
      { question: "A global middleware checks `isBlocked(req.ip)` and returns a 403 without calling `next()`. What happens to that request's route handler?", answer: "It never runs. `next()` was never called, so the lifecycle ends at that middleware and the route handler is skipped for blocked requests." },
      { question: "Why is understanding the lifecycle useful for debugging \"why did this request never get logged\"?", answer: "If logging middleware comes after something that can short-circuit the request (like an early auth check or blocklist), rejected requests never reach the logger. Knowing the fixed order tells you exactly which stages a request passed through." },
      { question: "Where should logic that applies to every request go versus logic for just one route — early in the chain, or inside a specific handler?", answer: "Logic for every (or nearly every) request goes in global middleware registered early, before routing picks a handler. Logic for one endpoint goes in that route's handler or route-specific middleware, so other requests don't pay for it." },
      { question: "Why can a single request only ever receive one response, and what would break if that weren't true?", answer: "HTTP expects one status line, one set of headers and one body per request. A second response would write conflicting data to a connection the client already treats as answered, so frameworks throw an error instead of allowing it." },
      { question: "In the drive-through analogy, what corresponds to \"the food gets made,\" and what corresponds to \"the pickup window\"?", answer: "\"The food gets made\" is the route handler running its business logic. \"The pickup window\" is the final response being built and sent, ending the lifecycle." },
      { question: "A route handler calls `res.json(product)`, and later in the same function unconditionally also calls `res.status(404).json({...})`. What bug results?", answer: "The first call already sent a response, so the second throws a \"headers already sent\" error. Fix it by returning after the first response or making the second call conditional, so only one runs." },
      { question: "Why does putting expensive, request-specific work in global middleware hurt performance even for requests that don't need it?", answer: "Global middleware runs on every request that passes through it, whether or not the request needs the work. An expensive step there adds latency to requests that never needed it." },
      { question: "With `app.use(express.json())`, then `app.use(logger)`, then a route, where does malformed JSON in the request body most likely cause a failure?", answer: "At the `express.json()` stage, before `logger` or the handler run. The parser fails on the malformed JSON and usually triggers an error response, ending the lifecycle early." },
      { question: "Give an example where a request not reaching the route handler is the intended, correct behavior.", answer: "Middleware rejecting an unauthenticated request with a 401 before a protected route. Ending early is the desired outcome here, not a bug." },
      { question: "What determines whether route-specific middleware runs before or after global middleware for a given request?", answer: "Global middleware is registered at the app level and runs first, because routing hasn't happened yet. Route-specific middleware only runs once the framework has matched the request to that route." },
      { question: "Why does the lifecycle model apply to essentially every HTTP-based backend, regardless of framework or language?", answer: "HTTP is request in, response out. Any server built on it, in any language or framework, must receive a request, process it, and send exactly one response. Middleware and routing are details layered on that shape." },
      { question: "To add authentication to just one route without affecting others, at which stage would you add that logic?", answer: "As route-specific middleware attached only to that route (or a group of routes), not global middleware, so other routes aren't affected." },
      { question: "From the client's point of view, can it tell whether a response came from an early short-circuiting middleware or the full lifecycle completing normally?", answer: "Not from the response shape alone: either way it gets a status code, headers and a body. Only the response's content (and knowing the API) shows whether it's a rejection partway through or the handler's real result." },
      { question: "Why is \"building the response\" treated as a distinct stage from the route handler having already computed a result?", answer: "Computing a result (like fetching a product) and turning it into an HTTP response (status code, headers, serialized body) are different jobs. Having data doesn't finish the handler's work; it still has to decide how that data becomes a proper response." },
      { question: "Two middleware functions and the route handler all set the same header. Which value does the client actually receive, and why?", answer: "The last call wins, because setting a header overwrites the previous value. The route handler runs after the earlier middleware, so its value usually takes effect, unless middleware registered after the handler (unusual) overwrites it again." },
    ],
    prerequisites: ["middleware"],
    relatedTopics: ["routing", "middleware", "error-handling-apis"],
    keywords: ["request lifecycle", "response cycle", "http flow"],
  },
  {
    id: "nodejs-runtime",
    title: "How Node.js Works",
    level: "beginner",
    description: "The runtime that lets JavaScript run outside a browser, and the single-threaded, event-driven model behind it.",
    explanation: `
JavaScript was built to run in a browser, reacting to clicks and typing.
**Node.js** is a runtime that lets it run elsewhere, such as on a server
handling HTTP requests. It pairs Chrome's **V8** engine (which turns
JavaScript into fast machine instructions) with features a browser
doesn't have, like reading files and opening network connections.

What surprises people: Node runs your JavaScript on a **single thread**,
one line at a time. It stays fast because most backend work (reading
files, querying databases, waiting on the network) is *waiting*, not
computing. Node hands the waiting off, does other work, and returns to
your code when the result is ready.

That loop (run code, hand off anything that waits, run whatever is ready
next) is the **event loop**.
    `.trim(),
    analogy:
      "Node.js is like one waiter serving a whole restaurant. Instead of standing at one table until the kitchen finishes, the waiter takes the order, moves to the next table, and comes back when each dish is ready. One waiter serves far more tables this way, as long as no single task (like arguing with a customer for twenty minutes) hogs their attention.",
    examples: [
      {
        title: "Blocking vs. non-blocking file reads",
        code: `const fs = require("fs");

// Blocking: nothing else runs until this finishes
const data = fs.readFileSync("large-file.txt");
console.log("done reading");

// Non-blocking: Node moves on immediately, and runs
// this callback later, once the file is ready
fs.readFile("large-file.txt", (err, data) => {
  console.log("done reading");
});
console.log("this logs first, before the read finishes");`,
        explanation: "The sync version freezes the single thread until the disk read finishes. The async version hands the read off, keeps running other code, and returns when the result is ready.",
        walkthrough: [
          { code: "fs.readFileSync(...)", explanation: "Blocks: the whole process waits here and can do nothing else until the file is read." },
          { code: "fs.readFile(..., callback)", explanation: "Starts the read and returns at once, so the rest of the program continues." },
          { code: '"this logs first..."', explanation: "Shows the non-blocking call didn't wait: the next line runs before the callback." },
        ],
      },
      {
        title: "Why this matters for a server",
        code: `app.get("/report", (req, res) => {
  // While this database query is pending, Node is
  // free to handle other incoming requests on the
  // same single thread.
  db.query("SELECT * FROM big_table", (err, rows) => {
    res.json(rows);
  });
});`,
        explanation: "A slow database query for one user doesn't stop the server from answering other users meanwhile. The thread isn't sitting idle waiting for it.",
      },
    ],
    howItWorks: `
Node runs your JavaScript on one main thread. When your code does
something that waits (reading a file, querying a database, making an
HTTP request), Node doesn't wait on the main thread. It hands the work
to the operating system or to a background thread pool called *libuv*,
and keeps running the next JavaScript.

When the background work finishes, its callback (or promise) goes into a
queue. The **event loop** keeps checking: "is the main thread free, and
is a finished callback waiting?" When both are true, it runs that
callback.

That's how one Node process can have thousands of database queries or
file reads "in flight" at once, while only running one line of your
JavaScript at any instant.
    `.trim(),
    diagram: `
 Your code            Background (libuv / OS)
 ─────────            ───────────────────────
 fs.readFile() ──────▶  reading disk...
    │
    ▼
 (keeps running
  other requests)
                        disk read finishes
                              │
                              ▼
 callback queued ◀────────────
    │
    ▼
 event loop runs it
 once the thread is free
    `.trim(),
    whyItExists: `
Older server designs often gave each connection its own thread. That
works but gets expensive: thousands of connections mean thousands of
threads, each with memory and scheduling overhead. Node handles huge
numbers of *I/O-bound* connections (network and disk work, not heavy
computation) on one thread by never letting it sit idle.
    `.trim(),
    whenToUse: `
Node fits backends that mostly wait on I/O: REST APIs, real-time apps
(chat, live dashboards), and services that mostly move data between a
client and a database or another service.
    `.trim(),
    whenNotToUse: `
Node struggles with CPU-heavy work (image or video processing, large
in-memory computation, hashing huge payloads), because it occupies the
single thread and blocks everything else. Offload that work to worker
threads, a separate service, or a language built for multi-threaded
computation.
    `.trim(),
    commonMistakes: [
      "Running a long, synchronous, CPU-heavy loop in a request handler, which freezes the server for every other user until it ends.",
      "Assuming Node is multi-threaded because it handles many requests at once. Only the waiting happens concurrently, not your JavaScript.",
      "Using a sync file method (like `readFileSync`) in a production request handler, blocking every other request while it runs.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain in one sentence why fs.readFile lets other code run sooner than fs.readFileSync." },
      { difficulty: "Medium", prompt: "Write a snippet with three console.log calls (one before, one inside a setTimeout callback, one after) and predict the order they print." },
      { difficulty: "Hard", prompt: "Explain why one expensive synchronous loop (like sorting a huge array) in a request handler slows responses for every other concurrent user, even though Node handles many requests." },
    ],
    interviewQuestions: [
      { question: "Is Node.js single-threaded or multi-threaded?", answer: "Your JavaScript runs on one main thread, but Node hands I/O work (file access, network calls) to the operating system or a background thread pool, so it can handle many things concurrently." },
      { question: "What is the event loop?", answer: "The mechanism that keeps checking whether the main thread is free and whether background work has finished, and runs the matching callback when both are true." },
      { question: "Why is a CPU-heavy operation bad for Node.js performance?", answer: "It occupies the single main thread, so nothing else (including other users' responses) runs until it finishes. I/O work, by contrast, is handed off while it waits." },
      { question: "What is V8, and what job does it do inside Node.js?", answer: "V8 is Chrome's JavaScript engine. In Node it parses and runs your JavaScript as fast machine instructions. Node pairs it with APIs a browser doesn't need, like filesystem and networking." },
      { question: "What does libuv do, and why does Node need it if JavaScript runs on a single thread?", answer: "libuv provides Node's event loop and a thread pool for work the OS can't do asynchronously on its own (like some filesystem calls). It lets Node hand off waiting work without blocking the JavaScript thread, then tells that thread when the work is done." },
      { question: "Between `fs.readFileSync(...)` followed by a `console.log`, and `fs.readFile(..., callback)` followed by the same `console.log`, which logs first relative to the file finishing?", answer: "With `readFileSync`, the log runs only after the whole file is read, because the call blocks. With `readFile`, the log runs immediately, before the read finishes, because the call returns right away and the callback runs later." },
      { question: "Why doesn't a slow database query for one user necessarily block the server from responding to other users at the same time?", answer: "The query is handed to the database (and the background/OS layer waiting on it), not run on Node's main thread. The thread stays free for other requests while it waits." },
      { question: "A request handler runs a synchronous loop sorting a 10-million-item array. What happens to every other concurrent request while it runs?", answer: "They all stall. The main thread is busy with the loop, so it can't process the event loop's queue or any other JavaScript until the loop ends." },
      { question: "Why is it misleading to say \"Node.js is multi-threaded because it can handle many requests concurrently\"?", answer: "The concurrency comes from handing I/O waiting elsewhere, not from running your JavaScript on several threads. Your code still runs one line at a time; only the waiting happens in parallel." },
      { question: "What actually happens, mechanically, when your code calls an asynchronous function like `fs.readFile`?", answer: "Node starts the operation, hands it to the OS or a background thread pool (via libuv), and returns control so the next line runs. When the work finishes, its callback is queued and the event loop runs it once the main thread is free." },
      { question: "Why does Node.js tend to perform well for REST APIs and real-time apps, but poorly for heavy image or video processing done directly in a request handler?", answer: "REST APIs and real-time apps mostly wait on network or database I/O, which Node handles without blocking the thread. Image and video processing is CPU-bound and occupies the thread, blocking everything else while it runs." },
      { question: "What would you reach for instead of doing CPU-heavy work directly in a Node.js request handler?", answer: "Worker threads, a separate service or process for the computation, or a language built for multi-threaded computation. That keeps the main thread free for other requests." },
      { question: "One endpoint calls `JSON.parse` on a huge synchronous payload directly in its handler, and the whole server feels sluggish. Why could one endpoint slow down unrelated requests?", answer: "`JSON.parse` on a large payload runs synchronously on the main thread. While it parses, the event loop can't do anything else, so every other request, even to different endpoints, waits." },
      { question: "Why does the event loop need to check both \"is the main thread free\" and \"is there a finished callback waiting,\" rather than running callbacks the instant their background work completes?", answer: "The main thread runs one thing at a time, so a finished callback can't interrupt running code. It waits in a queue until the thread is free, and then the event loop picks it up." },
      { question: "Compare a traditional thread-per-connection server design to Node's single-thread-plus-event-loop design. What cost does Node avoid at scale?", answer: "Thread-per-connection adds memory and OS scheduling overhead for every open connection, which gets expensive at thousands of connections. Node handles many connections on one thread by never leaving it idle on I/O, avoiding the cost of creating and scheduling huge numbers of threads." },
      { question: "Why is `fs.readFileSync` considered dangerous inside a production server's request handler, but safe in a one-off setup script?", answer: "In a request handler, blocking the single thread stalls every other request the process is serving. In a one-off script nothing else depends on that thread, so a brief block costs nothing." },
      { question: "If Node hands off waiting for I/O elsewhere, what part of the code still has to run entirely on the single main thread with no way around it?", answer: "Your own JavaScript logic: every computation, loop and synchronous call runs on the main thread. Only the waiting on external operations (disk, network, database) is handed off." },
      { question: "Three `console.log` calls: one before `setTimeout(fn, 0)`, one inside `fn`, and one right after the `setTimeout` call. What order do they print in?", answer: "First log, then third, then the one inside the callback. `setTimeout` always defers its callback until at least the current synchronous code finishes, even with a 0ms delay." },
      { question: "Why does Node.js pairing V8 with extra APIs matter — what could JavaScript not do inside a browser that Node needed to add?", answer: "For security, browser JavaScript is sandboxed: no direct filesystem access and no opening arbitrary server sockets. Node adds APIs like `fs` and `net`/`http` on top of V8 so the same language can do server work a browser never allows." },
      { question: "What's the relationship between \"waiting\" and \"computing\" in explaining why Node stays responsive under many concurrent connections despite being single-threaded?", answer: "Most backend work per request is waiting (on disk, network or a database), not computing. Node never lets the thread idle during that wait, so it does other requests' computing meanwhile. Many requests seem to progress at once, though computation still happens one step at a time." },
    ],
    prerequisites: ["servers-and-web-frameworks"],
    relatedTopics: ["servers-and-web-frameworks", "request-response-lifecycle", "background-jobs"],
    keywords: ["Node.js", "event loop", "non-blocking I/O", "V8", "single-threaded", "libuv", "runtime"],
  },
  {
    id: "project-structure",
    title: "Backend Project Structure",
    level: "beginner",
    description: "The folder layout that keeps routes, business logic and data access apart as a backend grows.",
    explanation: `
A backend with two or three routes fits in one file. Add validation,
error handling, a database and a dozen endpoints, and that file grows to
hundreds of lines mixing three concerns: parsing HTTP requests, deciding
what should happen, and talking to the database.

**Project structure** splits those concerns into folders, so each piece
of code has one job and a predictable home. A common layout:

- \`routes/\`: which URLs exist.
- \`controllers/\`: turn a request into a plain function call and a response.
- \`services/\`: the business logic.
- \`models/\`: talking to the database.
    `.trim(),
    analogy:
      "Think of a restaurant: the host (routes) decides which table a guest goes to, the server (controller) takes the order and carries it back, the chef (service) cooks from the recipe, and the pantry (model) holds the ingredients. One overworked person could do it all, but splitting the roles lets the kitchen serve more than a few tables without chaos.",
    examples: [
      {
        title: "Before: everything in one file",
        code: `// server.js — every concern tangled together
app.post("/users", async (req, res) => {
  if (!req.body.email || !req.body.email.includes("@")) {
    return res.status(400).json({ error: "invalid email" });
  }
  const existing = await db.query("SELECT * FROM users WHERE email = $1", [req.body.email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: "email taken" });
  }
  const result = await db.query(
    "INSERT INTO users (email) VALUES ($1) RETURNING *",
    [req.body.email]
  );
  res.status(201).json(result.rows[0]);
});`,
        explanation: "Validation, business rules and raw SQL are crammed into the route. Fine for one endpoint, unmanageable for fifty.",
      },
      {
        title: "After: split across layers",
        code: `// routes/users.js
router.post("/users", usersController.create);

// controllers/usersController.js
async function create(req, res) {
  const user = await usersService.createUser(req.body.email);
  res.status(201).json(user);
}

// services/usersService.js
async function createUser(email) {
  if (!email.includes("@")) throw new ValidationError("invalid email");
  if (await usersModel.findByEmail(email)) throw new ConflictError("email taken");
  return usersModel.insert(email);
}

// models/usersModel.js
function findByEmail(email) {
  return db.query("SELECT * FROM users WHERE email = $1", [email]);
}`,
        explanation: "Each file now has one job. The route maps a URL to a controller, the controller only translates HTTP in and out, the service holds the rule ('emails must be unique'), and the model is the only place that knows SQL.",
        walkthrough: [
          { code: "routes/users.js", explanation: "Declares which URL and method trigger this behavior and hands off at once. No logic here." },
          { code: "controllers/usersController.js", explanation: "Reads what it needs from the request, calls the service, and shapes the HTTP response. No business rules or SQL." },
          { code: "services/usersService.js", explanation: "Makes the decisions ('is this email valid and unique?'). Reusable anywhere, not tied to HTTP." },
          { code: "models/usersModel.js", explanation: "The only file that knows how a user is stored. If you swapped databases, only this layer would change." },
        ],
      },
      {
        title: "The full folder tree, and how it actually gets run",
        code: `my-api/
├── package.json          # scripts.dev = "node src/server.js"
├── src/
│   ├── server.js          # entry point: starts the app, calls app.listen()
│   ├── app.js             # creates the Express app, wires up middleware + routes
│   ├── routes/
│   │   └── users.js
│   ├── controllers/
│   │   └── usersController.js
│   ├── services/
│   │   └── usersService.js
│   ├── models/
│   │   └── usersModel.js
│   └── config/
│       └── db.js          # database connection setup
└── .env                   # DATABASE_URL, PORT, etc.

# Run it with:
$ npm run dev`,
        explanation: "server.js is the one file that actually runs. Everything else (app.js and the folders below) is code that server.js requires, directly or indirectly. npm run dev is a package.json shortcut for node src/server.js, so nobody has to remember the entry-file path.",
      },
    ],
    howItWorks: `
A request flows down through the layers and the response flows back up.
The route matches a URL to a controller. The controller takes what it
needs from the request and calls a service. The service applies business
rules and calls a model for data. The model is the only layer that knows
how data is stored.

Each layer only talks to the one directly below it. That's why you can
change one layer (like swapping databases) without rewriting the others.
    `.trim(),
    diagram: `
Route  →  Controller  →  Service  →  Model  →  Database
(URL)     (HTTP in/out)  (business    (data
                          rules)       access)
    `.trim(),
    whyItExists: `
Without structure, HTTP handling, business rules and database queries
get tangled in the same functions. The code becomes:

- Hard to test: you can't test a rule without faking a whole HTTP request.
- Hard to change: a database swap touches every route.
- Hard to navigate: there's no predictable place for each kind of logic.
    `.trim(),
    whenToUse: `
Use a layered structure once a project has more than a handful of
endpoints, or once the same logic (like "is this email taken?") is needed
in more than one place.
    `.trim(),
    whenNotToUse: `
For a tiny prototype, quick script, or two or three endpoints, four
folders are often pure overhead. One tidy file is easier to follow than
five nearly empty ones. Add structure when you feel the pain, not before.
    `.trim(),
    commonMistakes: [
      "Putting raw database queries in route handlers or controllers, defeating the point of a data-access layer.",
      "Letting controllers grow their own business logic instead of using a service, so the same rule is duplicated across controllers.",
      "Using the full layered structure for a two-endpoint prototype, adding indirection before there's real complexity.",
      "Not knowing which file is the entry point, and guessing how to start the app instead of checking package.json's scripts.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Which layer (route, controller, service or model) should hold a function that checks whether a discount code has expired? Why?" },
      { difficulty: "Medium", prompt: "Take a route handler that queries a database and formats a JSON response, and split it into a controller and a model function." },
      { difficulty: "Hard", prompt: "Explain the trade-off between a full layered structure and a single file for a 3-endpoint prototype, and describe the signal that it's time to split it up." },
    ],
    interviewQuestions: [
      { question: "Why split a backend project into routes, controllers, services, and models instead of one file?", answer: "To separate concerns: each layer has one job and a predictable place, so the code is easier to test, change and navigate as it grows." },
      { question: "What's the difference between a controller and a service?", answer: "A controller turns an HTTP request into a plain function call and shapes the response. A service holds the business logic, independent of HTTP." },
      { question: "How does a command like `npm run dev` know which file to actually run?", answer: "It's a shortcut in the `scripts` section of `package.json` that points at the real entry file: the one that calls `app.listen()` and starts the server." },
      { question: "Which single layer should be the only one that knows actual SQL or database queries directly, and why does that matter?", answer: "The model layer. With database access in one layer, a change in storage or queries only touches that layer, instead of scattered queries across routes, controllers and services." },
      { question: "A controller function directly runs `db.query(...)` itself instead of calling a service. What problem does this create if the team later switches databases?", answer: "Database-specific code is now spread across every controller that queries directly. Switching databases means finding and rewriting all of them, not just the model layer." },
      { question: "Why is it bad practice for the same business rule, like \"email must be unique,\" to be duplicated inside multiple controllers?", answer: "When the rule changes or gets a bug fix, every copy must be found and updated. Missing one makes endpoints that should enforce the same rule behave differently." },
      { question: "What does it mean for each layer to \"only talk to the one directly below it,\" and why does that make swapping a layer out easier?", answer: "Routes only call controllers, controllers only call services, and services only call models; no layer skips a level. So replacing one layer (like changing databases in the model) doesn't ripple upward, because the layers above depend only on its interface, not its internals." },
      { question: "What's the difference between `server.js` and `app.js` in the example project structure?", answer: "`app.js` creates the Express app and wires up middleware and routes. `server.js` is the entry point that imports `app.js` and calls `app.listen()`. Keeping them apart lets you import and test the app without starting a live server." },
      { question: "A new developer isn't sure which file is a project's real entry point. Where should they look?", answer: "In the `scripts` section of `package.json`, at the script that runs the app (usually `dev` or `start`). It names the entry file directly, so nobody has to guess." },
      { question: "Why does testing a business rule get harder when that rule lives directly inside a route handler mixed with HTTP-specific code?", answer: "You'd have to fake a whole HTTP request and response to test a rule that has nothing to do with HTTP. Moving the rule into a plain service function lets you test it with ordinary calls and inputs." },
      { question: "A two-endpoint prototype adopts the full routes/controllers/services/models structure from day one. What's the likely downside?", answer: "With so little logic, the structure only adds indirection (jumping between four or five nearly empty files) with no real complexity to justify it. One tidy file would be easier to follow." },
      { question: "What signal tells a team it's time to move from a single-file backend to a layered structure?", answer: "When the same logic is needed in more than one place, or the file has grown so unrelated concerns (HTTP handling, business rules, database queries) are hard to tell apart or navigate." },
      { question: "Why does the route layer contain no logic in the layered example, and why keep it that thin?", answer: "Its one job is mapping URLs and methods to controllers. Keeping it thin means you can scan which endpoints exist at a glance, without business logic in the way." },
      { question: "If `usersService.createUser` throws a `ValidationError` and the controller doesn't catch it, what happens to the request?", answer: "The error propagates uncaught. Depending on the error-handling setup, that usually means an unhandled rejection or a generic 500 instead of the intended specific error. So controllers (or error-handling middleware) usually need to catch expected service errors and translate them." },
      { question: "What can a service function do that a model function specifically should not, and vice versa?", answer: "A service applies business rules (like checking an email is taken before creating a user). A model only reads and writes data. A model making business decisions, or a service writing raw SQL, blurs the boundary the layers exist to keep." },
      { question: "Why is `usersService.createUser` described as \"reusable from anywhere, not tied to HTTP\"? What does that buy you?", answer: "It takes plain arguments and returns plain results instead of using `req` or `res`. So a controller, background job, CLI script or test can call it wherever the same rule is needed, without any HTTP machinery." },
      { question: "What does the model layer being \"the only file that knows how a user is actually stored\" imply about switching from PostgreSQL to MongoDB, or adding caching?", answer: "The change stays inside the model layer. Services and controllers don't change, because they rely only on the model's function signatures (like `findByEmail`), not how they're implemented." },
      { question: "A service throws an error because a requested resource doesn't exist. Whose job is it to turn that into an HTTP 404 — the service or the controller?", answer: "The controller's. The service shouldn't know about HTTP status codes, since it should be reusable outside HTTP. The controller translates a business outcome (\"not found\") into the right HTTP response." },
      { question: "Why might a small internal tool or one-off script deliberately not adopt this layered structure at all?", answer: "With little reused logic and only a few operations, maintaining separate route, controller, service and model files costs more than it gives. One simple file is faster to write and easier to follow for something small and short-lived." },
      { question: "What's the practical risk of not knowing your project's real entry point when debugging unexpected behavior?", answer: "You might edit or reason about a file that never runs, or start the app in a way that skips config or middleware the real entry point sets up. The results won't match what you changed." },
    ],
    prerequisites: ["routing", "middleware"],
    relatedTopics: ["routing", "middleware", "dependency-injection", "npm-and-packages"],
    keywords: ["project structure", "MVC", "layered architecture", "separation of concerns", "controllers", "services", "models"],
  },
  {
    id: "npm-and-packages",
    title: "npm & Package Management",
    level: "beginner",
    description: "How Node.js projects declare, install and lock their dependencies with npm and package.json.",
    explanation: `
Almost no backend is written from scratch. A project uses a web
framework, a database driver, a validation library, and dozens of
packages those depend on. **npm** (Node Package Manager) installs and
manages all of it.

Every Node project has a \`package.json\` file that lists:

- Its name.
- **dependencies**: code needed to run in production, like a web framework.
- **devDependencies**: tools only needed while developing, like a test runner.
- \`scripts\`: shortcuts like \`npm run dev\`.

\`npm install\` reads that file, downloads everything listed (plus what
*those* packages depend on), and puts it in a \`node_modules\` folder.
    `.trim(),
    analogy:
      "package.json is your project's shopping list: 'we need this framework, this validator, and this test tool only while building.' node_modules is the stocked pantry you get from that list. The lock file is the receipt, recording the exact brand and size of everything, so the next trip buys exactly the same items.",
    examples: [
      {
        title: "A minimal package.json",
        code: `{
  "name": "my-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "node server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.19.0",
    "pg": "^8.11.0"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}`,
        explanation: "express and pg are needed to run the app in production. jest is only used for development and testing, so it's kept separate.",
        walkthrough: [
          { code: '"scripts": { "dev": "node server.js" }', explanation: "Defines a shortcut: npm run dev is the same as typing node server.js." },
          { code: '"dependencies": { "express": "^4.19.0" }', explanation: "The ^ lets npm install newer compatible versions (any 4.x.x), never a breaking major version." },
          { code: '"devDependencies": { "jest": "^29.7.0" }', explanation: "Installed locally for development, but skipped when installing only production dependencies for deployment." },
        ],
      },
      {
        title: "Common npm commands",
        code: `npm install              # install everything listed in package.json
npm install express      # add express as a dependency
npm install -D jest      # add jest as a devDependency
npm run dev              # run the "dev" script
npx some-cli-tool        # run a package's command without installing it globally`,
        explanation: "npm install with no arguments sets up a project you just cloned. With a package name, it adds that package and updates package.json for you.",
      },
    ],
    howItWorks: `
\`npm install <package>\` looks up the package (and every package *it*
depends on) in the public npm registry, downloads them into
\`node_modules\`, and adds an entry to \`package.json\`.

It also writes the exact resolved version of every package, direct and
transitive, into \`package-lock.json\`. That lock file makes installs
reproducible. Without it, two developers running \`npm install\` weeks
apart could get different versions of the same "^4.19.0" dependency as
new compatible releases come out.
    `.trim(),
    whyItExists: `
Before package managers, reusing code meant downloading and copying
files by hand, with no easy way to track versions or get updates. npm
standardizes declaring what a project needs, finding existing packages,
and installing everything (transitive dependencies included)
reproducibly.
    `.trim(),
    whenToUse: `
Every real Node.js project uses npm. Even with one dependency,
package.json documents what the project needs and scripts standardize
how to run it.
    `.trim(),
    whenNotToUse: `
The real question is when to skip adding a dependency. A package for
something trivial you could write in a few lines (like checking if a
number is even) is one more thing to update and trust, for little gain.
    `.trim(),
    commonMistakes: [
      "Committing node_modules to git instead of adding it to .gitignore and letting npm install rebuild it from package.json.",
      "Hand-editing package-lock.json, which npm manages and expects to match actual installs.",
      "Installing a test or build tool as a regular dependency instead of a devDependency, bloating what ships to production.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain the difference between dependencies and devDependencies in package.json." },
      { difficulty: "Medium", prompt: "A package.json has express under dependencies and jest under devDependencies. Name the command that installs only what's needed to run the app in production." },
      { difficulty: "Hard", prompt: "Explain how two developers without a package-lock.json could get different versions of the same dependency, and how committing that file prevents it." },
    ],
    interviewQuestions: [
      { question: "What is package.json?", answer: "A file describing a Node.js project: its name, dependencies and devDependencies, and shortcut commands under scripts." },
      { question: "What's the difference between dependencies and devDependencies?", answer: "dependencies are needed for the app to run in production; devDependencies are only needed while developing, like test runners or build tools." },
      { question: "What is package-lock.json for?", answer: "It records the exact resolved version of every installed package, direct and transitive, so future installs are reproducible instead of drifting as new compatible versions come out." },
      { question: "Why shouldn't `node_modules` be committed to version control, given that `npm install` can regenerate it?", answer: "It can be fully rebuilt from `package.json` (and `package-lock.json`) on any machine. Committing it bloats the repo with a huge derived folder that adds no information." },
      { question: "What does the caret (`^`) in `\"express\": \"^4.19.0\"` allow npm to install, and what does it forbid?", answer: "It allows any backward-compatible version under semantic versioning: any `4.x.x` at or above `4.19.0`. It forbids a new major version like `5.0.0`, which may have breaking changes." },
      { question: "Two developers run `npm install` weeks apart on a project with only `\"express\": \"^4.19.0\"` in package.json and no lock file. Why might they get different versions?", answer: "The caret range allows any compatible `4.x.x`, and new releases can be published between the two installs. Without a lock file pinning the version, each install takes the newest match at that moment." },
      { question: "How does committing package-lock.json solve the problem in the previous scenario?", answer: "The lock file records the exact versions resolved at install time, including every transitive dependency. When it's committed, `npm install` reuses those pinned versions instead of re-resolving the caret ranges." },
      { question: "Why is hand-editing package-lock.json considered a mistake, even though it's just a text file?", answer: "Its entries (exact versions, integrity hashes, the dependency tree) must stay consistent with each other and with package.json. npm manages it automatically, and manual edits can easily put it out of sync with what's installed or with package.json." },
      { question: "What does `npm install express` do differently from `npm install` with no arguments?", answer: "`npm install` alone installs everything already in package.json. `npm install express` also adds `express` as a new entry under dependencies, then installs it." },
      { question: "What does the `-D` flag do in `npm install -D jest`, and why does it matter which category a package ends up in?", answer: "`-D` installs the package as a devDependency. It matters because production-only installs (for deployment) skip devDependencies, so the wrong category changes what ships." },
      { question: "`jest` is accidentally installed as a regular dependency instead of a devDependency. What's the practical consequence in production?", answer: "A production install meant to skip devDependencies still pulls in `jest` and everything it depends on, bloating the deployed `node_modules` with a test tool the app never uses." },
      { question: "What does `npx some-cli-tool` let you do that installing the package first and then running it does not?", answer: "It runs the package's command directly (downloading it temporarily if needed) without adding it to the project or installing it globally. Handy for one-off or rarely used command-line tools." },
      { question: "What's the difference between what's read from package.json's scripts section and what running `node server.js` directly does?", answer: "A script like `\"dev\": \"node server.js\"` is just a named alias. `npm run dev` runs that exact command, so it behaves the same as typing it, under a shorter, standard name." },
      { question: "Why does npm need to resolve and download transitive dependencies, not just the ones listed directly in package.json?", answer: "Most packages depend on other packages. If npm only installed what your package.json lists, those packages would be missing code they need and would fail." },
      { question: "If dependencies includes express and devDependencies includes jest, what command installs only what's needed to run the app in production?", answer: "`npm install --omit=dev` (or the older `npm install --production`). It skips devDependencies and installs only regular dependencies." },
      { question: "Why does npm exist — what problem did developers have before package managers when reusing someone else's code?", answer: "Reusing code meant finding, downloading and copying files by hand, with no standard way to track versions, get updates, or include a dependency's own dependencies. npm standardizes declaring, finding and installing packages (and their transitive dependencies) reproducibly." },
      { question: "You clone a teammate's project and run `npm install`, but there's also a `.env` file needed with a `DATABASE_URL`. Why isn't `npm install` alone enough to run the app?", answer: "`npm install` only installs the code dependencies in package.json. It knows nothing about environment config like database connection strings, which are kept out of the package and version control (often in a gitignored `.env`) and must be set up separately." },
      { question: "What's the risk of adding a dependency for something trivial you could write yourself in a few lines, from a package-management point of view?", answer: "Every dependency must be trusted and kept updated, and it grows your install size and dependency tree. For something as small as checking if a number is even, that ongoing cost outweighs the tiny effort saved." },
      { question: "Why is package.json's scripts section useful even for a solo developer working alone?", answer: "It records exactly how to run, test or build the project, so you don't have to remember the underlying command, even months later." },
      { question: "What's recorded in package.json versus package-lock.json — are they redundant with each other?", answer: "package.json records the version ranges the developer chose for direct dependencies (like `^4.19.0`). package-lock.json records the exact version installed for every package in the tree, direct and transitive. They serve different purposes and aren't redundant." },
    ],
    prerequisites: ["servers-and-web-frameworks"],
    relatedTopics: ["servers-and-web-frameworks", "project-structure", "deployment-and-cicd"],
    keywords: ["npm", "package.json", "package-lock.json", "node_modules", "dependencies", "devDependencies", "semver"],
  },
];
