import type { Topic } from "../../types/content";

export const systemDesignFundamentalsTopics: Topic[] = [
  {
    id: "what-is-system-design",
    title: "What is System Design?",
    level: "beginner",
    description: "Planning how the parts of a software system fit together and work at scale.",
    explanation: `
Writing a small app is one skill. Deciding how dozens of services,
databases, and servers work *together*, so millions of people can use a
product reliably and quickly, is another. That's **system design**.

It's more about decisions than code: Where should data live? How do the
parts talk to each other? What happens when one part fails, or when ten
times more people show up?
    `.trim(),
    analogy:
      "If writing code is building a single room, system design is planning a whole city: where the roads, pipes, and power lines go so everything keeps working as the population grows.",
    examples: [
      {
        title: "Questions system design answers",
        code: `// Not code you'd run — these are the kinds of questions system design asks:

// - Should this data live in one database or be split across several?
// - What happens if this server crashes right now?
// - How do we serve 10 million users instead of 10 thousand?
// - Should two services talk directly, or through a queue?`,
      },
    ],
    howItWorks: `
First, understand the requirements: how many users, how much data, how
fast it must respond. Then break the problem into components (servers,
databases, caches, queues) and decide how they connect and what happens
when one fails.

It's a repeated process of trade-offs, not a single right answer.
    `.trim(),
    whyItExists: `
A system that works for 10 users can fall apart at 10 million: slow
responses, crashes, lost data. System design lets you think through those
problems *before* they happen and make trade-offs on purpose, not by
accident.
    `.trim(),
    whenToUse: `
Use it whenever you plan something bigger than a single script: deciding
how services, data, and traffic are organized before or while you build.
It matters most once more than one person, or more than a handful of
users, depend on it.
    `.trim(),
    whenNotToUse: `
For a small script, a personal tool, or a prototype nobody depends on
yet, heavy design is overkill. You'd spend more time planning for scale
you don't have than building. Start simple and add design as real needs
(more users, more data, more reliability) show up.
    `.trim(),
    commonMistakes: [
      "Picking technologies before understanding the requirements and constraints.",
      "Designing only for today's scale and ignoring what would change if usage grew 100x.",
      "Assuming there's one 'correct' design instead of the best trade-off for the goals.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Pick an app you use daily (e.g. a messaging app) and list 3 questions you'd need to answer to design its backend." },
      { difficulty: "Medium", prompt: "Sketch (in words) the major components you'd expect behind a simple photo-sharing app: what stores the photos, what stores the metadata, what serves requests." },
      { difficulty: "Hard", prompt: "Describe what might break in your sketch above if the app suddenly went from 1,000 to 10,000,000 users." },
    ],
    interviewQuestions: [
      { question: "What is system design, in your own words?", answer: "Deciding how a system's parts (servers, databases, caches, queues) fit together to meet needs like scale, speed, and reliability." },
      { question: "Why can't you just \"add more servers\" to fix every scaling problem?", answer: "The bottleneck often moves somewhere else, like a single database, which doesn't scale just because you added application servers." },
      { question: "What's the difference between a functional and a non-functional requirement in system design?", answer: "Functional requirements say what the system does ('users can post a photo'). Non-functional requirements say how well it does it ('responses under 200ms', 'handles 1M users')." },
      { question: "What's the difference between vertical scaling and horizontal scaling?", answer: "Vertical scaling makes one machine more powerful (more CPU, RAM). Horizontal scaling adds more machines and spreads the load across them." },
      { question: "Why is horizontal scaling generally preferred for large-scale systems, despite being more complex?", answer: "One machine has a hard ceiling and is a single point of failure. Horizontal scaling has no fixed ceiling and survives individual machines failing." },
      { question: "What are some of the main non-functional requirements a system designer needs to gather before designing a system?", answer: "Availability (how often it must be up), latency (how fast it must respond), scalability (how much growth it must handle), consistency (how up to date replicas must be), and durability (whether data can ever be lost)." },
      { question: "What is a single point of failure, and why does system design try to eliminate them?", answer: "A single component whose failure takes down the whole system. Designs remove them with redundancy and replication, because a system is only as reliable as its weakest required part." },
      { question: "Why do system design interviews emphasize trade-offs rather than a single correct answer?", answer: "Real systems balance competing goals (cost, consistency, latency, complexity) differently for different requirements. A good designer explains the reasoning behind a choice instead of reciting one 'correct' architecture." },
      { question: "What is back-of-the-envelope estimation, and why is it a common first step in system design?", answer: "Rough early math on users, requests per second, and storage growth. It shows which parts will be under strain, so you don't waste effort optimizing something that was never a bottleneck." },
      { question: "What's the difference between throughput and latency?", answer: "Latency is how long one request takes. Throughput is how many requests the system handles in a given time. A system can have high throughput and still feel slow per request, or the reverse." },
      { question: "Why might a design that works fine for 10,000 users fail at 10 million, even with no bugs?", answer: "Resources that seem unlimited at small scale (database connections, disk I/O, a server's memory) become real bottlenecks when traffic and data grow by orders of magnitude." },
      { question: "What is the CAP theorem, and why does it matter when designing a distributed system?", answer: "A distributed system can't guarantee Consistency, Availability, and Partition tolerance all at once during a network failure. Partitions happen in practice, so you must choose: stay consistent or stay available when the network splits." },
      { question: "What's the difference between designing for a read-heavy workload versus a write-heavy workload?", answer: "Read-heavy systems use caching and read replicas to serve the same data to many readers cheaply. Write-heavy systems focus on how writes are spread and ordered (sharding, queues), since caching doesn't help data that changes constantly." },
      { question: "Why is it important to clarify assumptions and scope before diving into a system's design?", answer: "Without agreeing on scale, key features, and constraints, two people can design very different, equally 'correct' systems for the same vague prompt. Clear scope focuses effort on what matters." },
      { question: "What does \"availability\" mean in system design, and how is it typically expressed?", answer: "The share of time a system is up and serving requests. It's usually a percentage of uptime (e.g. 99.9%, informally '3 nines') or allowed downtime per year." },
      { question: "Give an example of a trade-off between consistency and availability.", answer: "A bank might reject a request during a network partition rather than show a stale balance (consistency). A social feed might show slightly old data rather than fail (availability)." },
      { question: "Why might adding a cache introduce new problems instead of simply making a system faster?", answer: "A cache can serve stale data if not invalidated correctly. It's another part that can fail or drift from the source of truth, and cache-invalidation bugs are notoriously easy to get wrong." },
      { question: "What's the risk of over-engineering a system design for scale it doesn't actually need yet?", answer: "You spend time and money on complexity (extra services, replication, queues) that solves no current problem, and you'll likely guess wrong about which future bottlenecks matter." },
    ],
    relatedTopics: ["client-and-server", "scalability"],
    keywords: ["system design", "architecture", "scale", "trade-offs"],
  },
  {
    id: "client-and-server",
    title: "Client and Server",
    level: "beginner",
    description: "How the app you use relates to the machine that does the work behind it.",
    explanation: `
The app or website you see, with its screen and buttons, is the
**client**. It usually doesn't hold the data or logic itself. It sends a
request over the internet to a **server**, a computer elsewhere that has
the data, does the processing, and sends a response back.

Client asks, server answers. Almost all software on the internet is built
on this split.
    `.trim(),
    analogy:
      "It's like ordering at a restaurant. You (the client) don't cook. You tell the waiter what you want, the kitchen (the server) makes it, and the waiter brings it to your table.",
    examples: [
      {
        title: "A basic client-server exchange",
        code: `// Client (browser) sends a request:
fetch("https://api.example.com/users/1")
  .then((response) => response.json())
  .then((user) => console.log(user));

// Server receives the request, looks up the data,
// and sends back something like:
// { "id": 1, "name": "Amara" }`,
        walkthrough: [
          { code: 'fetch("https://api.example.com/users/1")', explanation: "The client sends a request asking for user #1." },
          { code: ".then((response) => response.json())", explanation: "When the response arrives, parses its body as JSON." },
          { code: ".then((user) => console.log(user));", explanation: "Uses the data the server sent back." },
          { code: "// Server receives the request...", explanation: "The server does its work on its own machine, out of the client's sight." },
        ],
      },
    ],
    howItWorks: `
The client sends a request over the network saying what it wants. The
server does the work (looking up data, running logic) and sends a
response. The client then updates the screen based on that response.
    `.trim(),
    diagram: `
Client (app/browser)
       │  sends a request
       ▼
     Server
       │  processes it, sends a response
       ▼
Client (app/browser) — updates the screen
    `.trim(),
    whyItExists: `
Many clients (phones, browsers, smart TVs) can share one server and its
data, so no device has to store and manage everything itself. The server
can also be updated or scaled separately from the apps that use it.
    `.trim(),
    whenToUse: `
It applies to almost any networked app (web apps, mobile apps, online
games): any time one program needs data or processing that lives
somewhere else.
    `.trim(),
    whenNotToUse: `
A fully offline tool that never talks to another machine doesn't need
it. For something tiny and local, a separate server just adds
operational work with no real benefit.
    `.trim(),
    commonMistakes: [
      "Trusting the client. Users can modify clients, so the server should always re-check anything important.",
      "Forgetting that each request/response trip takes real time (network latency), which affects how responsive an app feels.",
      "Putting sensitive logic or secrets in client-side code, where anyone can inspect it.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Open your browser's Network tab and find one request your favorite website sends to its server." },
      { difficulty: "Medium", prompt: "Explain in your own words why a weather app needs a server instead of just knowing the weather itself." },
      { difficulty: "Hard", prompt: "Describe what could go wrong if a shopping app trusted the price sent by the client instead of checking it on the server." },
    ],
    interviewQuestions: [
      { question: "What is the client-server model?", answer: "A client sends requests to a server, which processes them and returns a response, instead of the client doing everything itself." },
      { question: "Why shouldn't a server trust data coming from the client?", answer: "Anyone can modify or forge client code and requests, so the server must validate anything that matters for security or business rules." },
      { question: "What is latency, in the context of client-server communication?", answer: "The time for a request to reach the server and the response to come back. It's a key factor in how fast an app feels." },
      { question: "What's the difference between a thin client and a thick (fat) client?", answer: "A thin client does little processing and relies on the server for most logic and data (e.g. a basic web page). A thick client keeps much of the logic and state locally and only calls the server to fetch or save data (e.g. a native desktop app)." },
      { question: "Why can many different kinds of clients (web, mobile, smart TV) all share the same server?", answer: "The server exposes its data and logic through a shared protocol like HTTP, not a client-specific interface. Any client that speaks that protocol can use it, whatever device it runs on." },
      { question: "What is a request-response cycle, and why does understanding it matter for building responsive apps?", answer: "It's the full round trip of sending a request and getting a response. Every cycle takes real time, so an app that makes many unneeded cycles, or blocks the UI while waiting, feels slow even with a fast server." },
      { question: "At a conceptual level, how does a client know which physical server to talk to when it makes a request?", answer: "It resolves a human-readable address (like a domain name) to a network location via DNS, then connects to it. The client doesn't need to know which actual machine handles the request." },
      { question: "How should a well-built client handle a server that's slow to respond?", answer: "Don't block the whole UI, show a loading state, and set a reasonable timeout instead of waiting forever. Treat slow responses as normal, not an edge case." },
      { question: "Why is validating input only on the client side considered a security anti-pattern?", answer: "Client code runs on a device the user controls. It can be bypassed or skipped by sending requests directly, so any validation that matters for security or data integrity must also run on the server." },
      { question: "What's the difference between synchronous and asynchronous client-server communication?", answer: "Synchronous: the client waits for the response before doing anything else. Asynchronous: the client keeps working and handles the response (or a notification) when it arrives." },
      { question: "Can a server ever act as a client? Give an example.", answer: "Yes. When a server needs another service, it sends its own request and acts as that service's client, e.g. a backend calling a third-party payment API before replying to the original client." },
      { question: "Why does moving business logic from the client to the server usually improve security, even at the cost of extra latency?", answer: "Server-side logic is outside the user's control and can't be tampered with or bypassed. Anything where correctness or trust matters (pricing, permissions, validation) is safer there, even if it costs an extra round trip." },
      { question: "What's the difference between latency and bandwidth?", answer: "Latency is the delay before data starts arriving. Bandwidth is how much data can flow per unit of time. A connection can have low latency but low bandwidth, or the reverse, and each affects performance differently." },
      { question: "Why might a client cache data locally instead of requesting it from the server every time, and what's the trade-off?", answer: "Caching avoids the latency and load of repeating the same request. The risk is stale data if the server's data changes and the cache isn't refreshed." },
      { question: "What is a network round trip, and why do developers try to minimize how many a page or app makes?", answer: "One full request-response exchange. Each adds latency, so an app making many round trips one after another (instead of batching or running them in parallel) feels much slower than the server's actual processing time." },
      { question: "How does the client-server model differ from a peer-to-peer model?", answer: "In client-server, roles are fixed: clients request, servers respond, and servers are usually central. In peer-to-peer, each participant acts as both client and server, with no central authority required." },
      { question: "What role does the server play when multiple clients try to modify the same data at the same time?", answer: "It's the single source of truth that orders or reconciles concurrent updates (via locks, transactions, or conflict rules). Without it, clients could overwrite each other's changes inconsistently." },
      { question: "Why do mobile apps often need to handle network failures more gracefully than typical desktop web apps?", answer: "Mobile devices often lose or switch connectivity (Wi-Fi to cellular, low-signal areas). A mobile client should expect drops and plan for retries, offline states, or queued requests instead of assuming a stable connection." },
    ],
    prerequisites: ["what-is-system-design"],
    relatedTopics: ["http", "rest-apis"],
    keywords: ["client", "server", "request", "response", "latency"],
  },
  {
    id: "http",
    title: "HTTP",
    level: "beginner",
    description: "The shared language clients and servers use to talk over the web.",
    explanation: `
A client and server must agree on a format for requests and responses,
or neither understands the other. **HTTP** (HyperText Transfer Protocol)
is that shared language. It sets how a request is structured, what kinds
of requests exist, and how a server should respond.
    `.trim(),
    analogy:
      "HTTP is like the standard format for a letter: return address, recipient, subject, body. Because everyone agrees on it, any recipient (server) can read a well-formed letter (request) and is expected to reply in the same format (a response).",
    examples: [
      {
        title: "A basic HTTP request/response",
        code: `GET /users/1 HTTP/1.1
Host: api.example.com

// Server responds:
HTTP/1.1 200 OK
Content-Type: application/json

{ "id": 1, "name": "Amara" }`,
        explanation:
          "`GET /users/1` asks for user #1. The server replies with a status code (`200 OK` means success) and the requested data.",
        walkthrough: [
          { code: "GET /users/1 HTTP/1.1", explanation: "The method (GET) and path (/users/1). This request asks to read user #1." },
          { code: "Host: api.example.com", explanation: "A header telling the server which website this request is for." },
          { code: "HTTP/1.1 200 OK", explanation: "The response's status line. 200 means success." },
          { code: '{ "id": 1, "name": "Amara" }', explanation: "The response body: the data that was requested." },
        ],
      },
    ],
    howItWorks: `
Every request has a **method** (the action, like GET or POST), a **path**
(the resource it's about), and optional **headers** and **body** (extra
data).

Every response has a **status code** (like 200 for success or 404 for not
found) plus its own headers and body.
    `.trim(),
    whyItExists: `
Without a shared protocol, every client and server pair would need its
own custom way to talk, and nothing on the web would work together. HTTP
gives every browser, app, and server a common language.
    `.trim(),
    whenToUse: `
You use HTTP any time a browser, app, or script talks to a web server,
which covers most client-server communication.
    `.trim(),
    whenNotToUse: `
For very frequent, low-latency messages (real-time games, some trading
systems), HTTP's overhead can be too much. WebSockets or dedicated binary
protocols fit better there.
    `.trim(),
    commonMistakes: [
      "Mixing up status code groups, e.g. thinking 4xx means 'server error'. 4xx is a client error; 5xx is a server error.",
      "Forgetting HTTP is stateless by default. The server doesn't remember earlier requests unless something (like cookies or tokens) carries that state.",
      "Using the wrong method, e.g. GET for something that changes data on the server.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List the HTTP methods GET, POST, PUT, and DELETE, and describe what each is usually used for." },
      { difficulty: "Medium", prompt: "Look up what HTTP status codes 200, 301, 404, and 500 mean." },
      { difficulty: "Hard", prompt: "Explain in your own words why HTTP being 'stateless' matters for how servers scale." },
    ],
    interviewQuestions: [
      { question: "What is HTTP?", answer: "A protocol (a set of rules) for how clients and servers structure requests and responses on the web." },
      { question: "What does it mean that HTTP is stateless?", answer: "Each request is handled on its own. The server doesn't remember earlier requests from the same client unless something extra (cookies, tokens, sessions) is used." },
      { question: "What's the difference between GET and POST?", answer: "GET reads data without changing anything on the server, and can be cached. POST usually sends data to create or change something." },
      { question: "What does it mean for an HTTP method to be \"idempotent\"? Which common methods are idempotent?", answer: "Repeating the same request gives the same end result. `GET`, `PUT`, `DELETE`, `HEAD`, and `OPTIONS` are idempotent; `POST` and `PATCH` generally are not." },
      { question: "What does it mean for an HTTP method to be \"safe\", and how is that different from being idempotent?", answer: "A safe method doesn't change server state at all (read-only, like `GET` or `HEAD`). Idempotent only means repeats don't change the outcome further. So `DELETE` is idempotent but not safe: it changes state on the first call, not on repeats." },
      { question: "Why is PUT considered idempotent but POST is not?", answer: "`PUT` replaces a resource with exactly what you send, so sending it twice leaves the same final state. `POST` usually creates a new resource each time, so repeating it (e.g. resubmitting a form) can create duplicates." },
      { question: "Is DELETE idempotent? Explain with an example.", answer: "Yes. Deleting a resource twice leaves it in the same state (gone) as deleting it once. The second call may return `404` instead of success, but the *result* on the server is the same, and that's what idempotency measures." },
      { question: "What's the difference between PATCH and PUT?", answer: "`PUT` replaces the whole resource with the payload. `PATCH` is a partial update: it changes only the fields you send and leaves the rest alone." },
      { question: "What are the five broad categories of HTTP status codes?", answer: "1xx (informational, request received and being processed), 2xx (success), 3xx (redirection, further action needed), 4xx (client error), and 5xx (server error)." },
      { question: "What's the difference between a 401 and a 403 status code?", answer: "401 Unauthorized: the request lacks valid authentication (credentials missing or invalid). 403 Forbidden: the client is identified but isn't allowed to access that resource." },
      { question: "What's the difference between a 404 and a 410 status code?", answer: "404 Not Found: nothing is at that URL, possibly temporarily. 410 Gone: something used to be there and was permanently removed, a stronger and more specific signal." },
      { question: "What's the difference between a 500 and a 503 status code?", answer: "500 Internal Server Error: something broke while the server handled the request (an unhandled error, a bug). 503 Service Unavailable: the server is temporarily unable to respond (overloaded, maintenance), so the client can retry later." },
      { question: "What's the difference between a 301 and a 302 redirect?", answer: "301 Moved Permanently: the resource has a new URL for good, and future requests (and search engines) should go there. 302 Found: a temporary redirect, so the client should keep using the original URL." },
      { question: "Why does it matter whether a redirect is 301 or 302 for things like caching or search engine indexing?", answer: "Because a 301 is permanent, browsers and search engines may cache it and move the old URL's search ranking to the new one. A 302 isn't treated that way, since the original URL is expected to work again." },
      { question: "What is the purpose of HTTP headers? Give an example of a request header and a response header.", answer: "Headers carry metadata separate from the body. The request header `Host` tells the server which website the request is for; the response header `Content-Type` tells the client how to read the body." },
      { question: "What's the difference between the Content-Type and Accept headers?", answer: "`Content-Type` (sent by whichever side includes a body) describes the format of the data being sent. `Accept` (sent by the client) lists the response formats it will take, so the server can choose." },
      { question: "At a high level, how does HTTP caching work, and which headers control it?", answer: "A response can include headers like `Cache-Control` (how long it may be reused, and by whom). A client or proxy can then reuse a stored copy instead of asking again, until it expires or is invalidated." },
      { question: "What's the difference between Cache-Control: no-cache and Cache-Control: no-store?", answer: "`no-cache` allows storing a response but requires checking with the server before each reuse. `no-store` forbids storing it at all, for sensitive data that should never be cached." },
      { question: "What is an ETag, and how does it help avoid re-downloading unchanged data?", answer: "A token the server gives to one version of a resource. The client sends it back later in `If-None-Match`; if nothing changed, the server replies `304 Not Modified` with no body, saving bandwidth." },
      { question: "What's the purpose of the If-None-Match header, and how does the server respond to it?", answer: "It tells the server 'send the full response only if the ETag changed since this value'. If the ETag still matches, the server returns `304 Not Modified`; otherwise it returns the current version with `200 OK`." },
      { question: "Why is HTTP described as stateless, and what mechanisms let applications build state (like being logged in) on top of it?", answer: "Each request is handled on its own, with no built-in memory of earlier ones. Apps add state with cookies, sessions, or tokens sent on every request to identify the client." },
      { question: "At a conceptual level, what changed between HTTP/1.1 and HTTP/2?", answer: "HTTP/1.1 generally needs a separate connection per concurrent request, or queues requests on one. HTTP/2 multiplexes many requests and responses over one connection and compresses headers, cutting overhead and avoiding head-of-line blocking at the connection level." },
      { question: "What problem does HTTP keep-alive solve?", answer: "Without it, a new TCP connection would be opened and closed for every request, which is slow. Keep-alive reuses one connection for many requests and responses." },
      { question: "Why is the Host header required, even though the request is already being sent to a specific server's IP address?", answer: "One IP address (and port) can serve many websites (virtual hosting). The server needs `Host` to know which site the request is for." },
      { question: "Why might a client send a HEAD request instead of a GET?", answer: "`HEAD` returns the same headers as `GET` but no body. A client can check whether a resource exists or how large it is without downloading it." },
      { question: "What is the OPTIONS method typically used for?", answer: "It asks the server which methods and headers a resource allows. Browsers most often send it automatically as a CORS \"preflight\" before a cross-origin request that isn't \"simple\"." },
      { question: "What's the difference between a query parameter and a path parameter in a request URL?", answer: "A path parameter identifies a resource as part of the URL (e.g. `/users/42`). A query parameter (e.g. `?sort=name&page=2`) changes how it's fetched (filtering, sorting, pagination) without changing which resource it is." },
      { question: "Why is it a mistake to use GET for a request that changes data on the server?", answer: "`GET` is expected to be safe and idempotent, so browsers, proxies, and crawlers may prefetch, cache, or repeat it freely. If `GET` has side effects, those tools can trigger changes nobody intended." },
      { question: "What is content negotiation in HTTP?", answer: "How a client and server agree on the best representation to return. For example, the client's `Accept` header lists preferred formats or languages, and the server picks a match." },
      { question: "Why does the 429 status code exist, and how should a well-behaved client respond to it?", answer: "429 Too Many Requests means the client is rate-limited. A good client backs off and retries later, respecting a `Retry-After` header if present, instead of retrying at once and making things worse." },
    ],
    prerequisites: ["client-and-server"],
    relatedTopics: ["client-and-server", "rest-apis", "authentication-and-sessions", "websockets"],
    keywords: ["http", "protocol", "status code", "method", "stateless"],
  },
  {
    id: "rest-apis",
    title: "REST APIs",
    level: "beginner",
    description: "A common, predictable way to design APIs so any app can talk to a server the same way.",
    explanation: `
An API (Application Programming Interface) is how one piece of software
lets another ask it to do things. APIs can be organized in endless
inconsistent ways, which makes them hard to learn. **REST**
(Representational State Transfer) is a widely used style that keeps APIs
consistent and predictable.

The core idea: everything is a "resource" (a user, a post, a product)
with its own URL. You act on it with standard HTTP methods: GET to read,
POST to create, PUT/PATCH to update, DELETE to remove.
    `.trim(),
    analogy:
      "REST is like a filing cabinet where every drawer has the same layout and supports the same actions: look inside, add a paper, replace the contents, or remove it. Learn one drawer and you know how to use any drawer in any cabinet built the same way.",
    examples: [
      {
        title: "REST-style endpoints for a 'posts' resource",
        code: `GET    /posts       // get all posts
GET    /posts/42    // get one specific post
POST   /posts       // create a new post
PUT    /posts/42    // replace post 42 entirely
PATCH  /posts/42    // partially update post 42
DELETE /posts/42    // delete post 42`,
        explanation:
          "The URL says *what* you're acting on (posts, or one post), and the HTTP method says *what action* you're taking.",
        walkthrough: [
          { code: "GET /posts", explanation: "Reads the full list of posts." },
          { code: "GET /posts/42", explanation: "Reads one post, identified by the id in the URL." },
          { code: "POST /posts", explanation: "Creates a new post." },
          { code: "PUT /posts/42  /  PATCH /posts/42", explanation: "Replaces post 42 entirely, or updates only some of its fields." },
          { code: "DELETE /posts/42", explanation: "Removes post 42." },
        ],
      },
    ],
    howItWorks: `
A REST API exposes resources as URLs and uses standard HTTP methods and
status codes instead of custom verbs for every action. If you've used one
REST API, you can usually guess how another works without much reading.
    `.trim(),
    whyItExists: `
Before conventions like REST, every API had its own rules, so integrating
was slow and error-prone. REST gives everyone shared conventions, which
speeds up building and using APIs across companies and codebases.
    `.trim(),
    whenToUse: `
Use REST for a general-purpose API around resources (users, posts,
products) that other developers, possibly outside your team, need to
learn and use.
    `.trim(),
    whenNotToUse: `
For action-style operations that don't map to a resource (like "run this
report" or "send this batch job"), a REST shape can feel forced. An
RPC-style or GraphQL API sometimes fits better.
    `.trim(),
    commonMistakes: [
      "Using verbs in URLs (`/getUser`) instead of nouns with proper HTTP methods (`GET /user`).",
      "Returning 200 OK for every response, even errors, instead of proper status codes.",
      "Designing endpoints that don't map to a resource, making the API inconsistent and confusing.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Design REST-style endpoints for a 'comments' resource: list, get one, create, update, delete." },
      { difficulty: "Medium", prompt: "Explain why `POST /users/delete/42` is not a RESTful way to delete a user, and rewrite it properly." },
      { difficulty: "Hard", prompt: "Design a small REST API (endpoints + methods + expected status codes) for a simple to-do list app." },
    ],
    interviewQuestions: [
      { question: "What does REST stand for, and what's its core idea?", answer: "Representational State Transfer. Everything is a resource with a URL, and you act on it with standard HTTP methods." },
      { question: "What makes an API 'RESTful'?", answer: "Resource-based URLs, standard HTTP methods for actions, standard status codes for outcomes, and no state kept between requests." },
      { question: "What's the difference between PUT and PATCH?", answer: "PUT usually replaces the whole resource; PATCH changes only the fields you send." },
      { question: "What's the difference between a resource and an endpoint in a REST API?", answer: "A resource is the thing being represented (e.g. 'a user'). An endpoint is the URL clients use to reach it (e.g. `/users/42`). One resource can have more than one endpoint, such as a nested and a top-level route." },
      { question: "Why should REST URLs use nouns for resources rather than verbs for actions?", answer: "The HTTP method already states the action (`GET`, `POST`, `PUT`, `DELETE`). A verb in the URL (like `/deleteUser`) duplicates or conflicts with it, and makes the API inconsistent since everyone phrases actions differently." },
      { question: "What status code should a successful POST that creates a new resource return, and what else is commonly included?", answer: "`201 Created`, usually with a `Location` header giving the new resource's URL so the client can find it later." },
      { question: "What status code fits a successful DELETE that returns no response body?", answer: "`204 No Content`. It confirms success and signals there's no body to read." },
      { question: "Why is statelessness considered a defining constraint of REST rather than just a nice-to-have?", answer: "Each request must carry everything needed to process it, with no server-side session state between requests. That lets any server instance handle any request, which is key to horizontal scaling and simple load balancing." },
      { question: "What's the difference between a REST-style API and an RPC-style API?", answer: "REST models everything as resources acted on with a small set of standard HTTP methods. RPC exposes named actions directly (e.g. `POST /createUser`, `POST /banUser`), which is more flexible for arbitrary operations but loses REST's uniform structure." },
      { question: "What's the difference between REST and GraphQL, and when might GraphQL be a better fit?", answer: "REST has fixed endpoints that each return a set data shape. GraphQL has one endpoint where the client asks for exactly the fields it needs. GraphQL fits better when clients have very different, changing data needs and over- or under-fetching becomes a real problem." },
      { question: "What does HATEOAS mean, and why do most real-world 'REST' APIs skip it?", answer: "Hypermedia As The Engine Of Application State: responses include links to the next available actions or resources, so clients don't hardcode URLs. Most APIs skip it because it adds real complexity for a benefit (loosely coupled clients) few consumers need." },
      { question: "Name a couple of common approaches to versioning a REST API.", answer: "In the URL path (e.g. `/v1/users`) or in a request header (e.g. `Accept: application/vnd.myapi.v1+json`). URL versioning is simpler and more visible; header versioning keeps URLs stable but is harder to discover." },
      { question: "When is nesting resources in a URL (e.g. /users/1/posts) useful, and when does it become an anti-pattern?", answer: "It's useful when a resource truly belongs to its parent (posts that only make sense under a user). It gets awkward when nesting goes several levels deep, or the same resource must be reached both on its own and through a parent, causing duplicate or inconsistent routes." },
      { question: "How should a REST API represent pagination for a large collection?", answer: "With query parameters (like `?page=2&limit=20` or cursor-based `?after=<id>`), plus metadata in the response (or headers/links) giving the total or how to get the next page. Don't return the whole collection at once." },
      { question: "What's the difference between filtering, sorting, and pagination as REST query parameters?", answer: "Filtering picks which items are returned (e.g. `?status=active`). Sorting sets their order (e.g. `?sort=-createdAt`). Pagination sets how many and which slice come back. They're often combined but independent." },
      { question: "Why should a REST API generally avoid exposing raw internal database ids or implementation details in its responses?", answer: "It ties clients to storage choices that should be free to change (like the database or id scheme), and can leak information (sequential ids reveal record counts) clients shouldn't depend on." },
      { question: "Is a REST API required to return JSON? What does the word \"representational\" in REST actually refer to?", answer: "No. REST doesn't require a format; JSON is just the most common today. \"Representational\" means clients work with a representation of a resource's state (JSON, XML, or anything else), not the resource itself." },
      { question: "How should a REST API communicate a validation error to the client?", answer: "With a `4xx` status (usually `400 Bad Request` or `422 Unprocessable Entity`) and a body saying which fields failed and why, so the client can show something useful instead of a generic failure." },
      { question: "What's an idempotency key, and why might a REST API need one for a POST request?", answer: "A unique value the client sends with a request. If the request is retried (e.g. after a timeout, when the client can't tell whether the first try worked), the server spots the duplicate and doesn't do the action twice. It's common for payments, where POST not being idempotent is dangerous." },
      { question: "Why is caching often easier to reason about in REST than in RPC-based or GraphQL APIs?", answer: "REST uses GET on stable resource URLs, which fits standard HTTP caching by URL. RPC and GraphQL usually send varied requests through one endpoint (often via POST), which browsers, proxies, and CDNs don't cache the same way without custom logic." },
      { question: "Why does it help for a REST API's error responses to follow one consistent structure across all endpoints?", answer: "A predictable error shape (e.g. always a code, message, and optional field details) lets clients handle errors in one place instead of per endpoint, and makes docs and debugging more consistent." },
      { question: "Why is over-fetching or under-fetching a common criticism of REST APIs, and how does it come about?", answer: "REST endpoints return a fixed data shape. A client needing two fields still gets the whole resource (over-fetching), and a client needing several resources often makes several requests (under-fetching). Both waste bandwidth or round trips compared to asking for exactly what's needed." },
      { question: "What does it mean for a REST API to be \"resource-oriented,\" and how does that shape its URL design?", answer: "The API is built around nouns from the domain (users, orders, posts), not actions. URLs follow `/resource` and `/resource/:id`, acted on with standard HTTP methods, instead of a growing list of custom action endpoints." },
      { question: "How would you design an endpoint to update just one field of a resource, and which HTTP method fits best?", answer: "`PATCH /resource/:id` with a body holding only the fields to change (e.g. `{ status: \"archived\" }`). PATCH is meant for partial updates; PUT implies replacing the whole resource." },
      { question: "Why is it considered bad practice for an API to always return 200 OK, even for errors?", answer: "Every client must parse the body just to learn whether the request worked, which defeats status codes. It also breaks tools (HTTP caches, monitoring, generic error handling) that rely on the status code matching the real outcome." },
    ],
    prerequisites: ["http"],
    relatedTopics: ["http", "client-and-server", "databases"],
    keywords: ["REST", "API", "endpoint", "resource", "CRUD"],
  },
  {
    id: "proxy-and-reverse-proxy",
    title: "Proxy & Reverse Proxy",
    level: "beginner",
    description: "A middle server between a client and the real destination, working for one side or the other.",
    explanation: `
Sometimes a request passes through a middle server before reaching the
server that handles it.

- A **forward proxy** sits in front of clients and sends their requests out for them, often hiding who the client is or filtering what they can reach.
- A **reverse proxy** sits in front of servers and passes incoming requests to the right backend, often hiding how many servers there are or what they look like.

Same idea (a middle server relaying requests), opposite problems.
    `.trim(),
    analogy:
      "A forward proxy is like an assistant who makes calls for you, so the other person never sees your number. A reverse proxy is like a company's reception desk: every visitor talks to the same receptionist, who sends them to the right employee, so visitors never need to know who works where.",
    examples: [
      {
        title: "A reverse proxy routing to different backends",
        code: `// Simplified reverse proxy config
routes: {
  "/api/*": "backend-server:4000",
  "/images/*": "image-server:5000",
  "/*": "web-server:3000",
}
// A request to /api/users is forwarded to backend-server,
// while a request to /home.html goes to web-server —
// the client only ever talks to one address.`,
        walkthrough: [
          { code: '"/api/*": "backend-server:4000"', explanation: "Any request whose path starts with /api goes to the backend server." },
          { code: '"/images/*": "image-server:5000"', explanation: "Image requests go to a separate server." },
          { code: '"/*": "web-server:3000"', explanation: "Everything else falls through to the default web server." },
          { code: "the client only ever talks to one address", explanation: "The client never knows several servers exist behind it." },
        ],
      },
    ],
    howItWorks: `
A reverse proxy receives every incoming request first and looks at it
(usually just the path or domain). It forwards the request to the backend
responsible for it, then relays the response back as if it came from the
proxy.

A forward proxy is the mirror image. It sits in front of clients, takes
their outgoing requests, and sends them on, often changing or hiding
details of the original request.
    `.trim(),
    whyItExists: `
Without a reverse proxy, clients would need the exact address of every
backend service, and each service would be exposed to the internet. A
reverse proxy gives clients one stable address, while the number and
role of servers behind it stay hidden and free to change.
    `.trim(),
    whenToUse: `
Use a reverse proxy when you have more than one backend service (or more
than one instance of a service) and want one stable entry point. A load
balancer is exactly this: a reverse proxy that spreads traffic across
identical servers.

Use a forward proxy when clients' outgoing requests need filtering,
caching, or their identity hidden.
    `.trim(),
    whenNotToUse: `
For a single simple server with nothing to route between, a reverse
proxy adds an extra network hop with no real benefit yet. You can add
one later as the system grows.
    `.trim(),
    commonMistakes: [
      "Confusing a forward proxy (works for clients) with a reverse proxy (works for servers). They solve different problems.",
      "Forgetting the reverse proxy itself must stay up. If it goes down, so does access to everything behind it.",
      "Exposing backend addresses directly instead of routing everything through the proxy, which defeats hiding the internal architecture.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain in your own words the difference between a forward proxy and a reverse proxy." },
      { difficulty: "Medium", prompt: "Sketch (in words) a reverse proxy config that routes /api requests to one server and everything else to another." },
      { difficulty: "Hard", prompt: "Explain how a load balancer and a reverse proxy relate. Is a load balancer a kind of reverse proxy, or something separate?" },
    ],
    interviewQuestions: [
      { question: "What's the difference between a forward proxy and a reverse proxy?", answer: "A forward proxy sits in front of clients and sends their outgoing requests for them. A reverse proxy sits in front of servers and passes incoming requests to the right backend." },
      { question: "Why would you put a reverse proxy in front of multiple backend servers?", answer: "Clients need only one address, and the proxy routes each request to the right backend. The internal setup stays hidden and easy to change." },
      { question: "Is a load balancer a type of reverse proxy?", answer: "Effectively yes: it's a reverse proxy whose job is spreading traffic across identical backend servers." },
      { question: "What are common reasons an organization deploys a forward proxy for its own employees?", answer: "To block certain sites, cache popular content to save bandwidth, log outbound traffic for compliance, and hide internal IP addresses from the sites employees visit." },
      { question: "How does a reverse proxy help with SSL/TLS termination?", answer: "The proxy decrypts incoming HTTPS (and encrypts responses) in one place, so backends don't each manage certificates and TLS handshakes. That simplifies certificate management and takes the CPU cost off the app servers." },
      { question: "Why might a reverse proxy cache static content before it even reaches the application server?", answer: "Rarely changing content (images, CSS, JS bundles) can be served from the proxy's cache, which is much faster than running backend logic for the same response every time." },
      { question: "What single point of failure risk does adding a reverse proxy introduce, and how is it usually mitigated?", answer: "With only one proxy, its failure cuts off everything behind it even if backends are fine. The fix is several redundant proxies behind something like DNS round-robin or a floating IP." },
      { question: "How does a reverse proxy enable zero-downtime deployments?", answer: "Start the new version alongside the old one, and have the proxy gradually shift traffic to it and away from the old one. Clients never see an interruption, unlike replacing a single exposed server in place." },
      { question: "What's the difference between a reverse proxy and an API gateway?", answer: "A reverse proxy routes requests to the right backend. An API gateway adds API concerns on top: authentication, rate limiting, request/response transformation, and combining several backend calls into one response." },
      { question: "How does a CDN relate to the concept of a reverse proxy?", answer: "A CDN is a globally distributed reverse proxy. It sits in front of an origin server at many edge locations and caches and serves content from the one closest to the client." },
      { question: "Why does a reverse proxy typically add headers like X-Forwarded-For to the requests it forwards?", answer: "Behind a proxy, the backend sees only the proxy's IP as the source. `X-Forwarded-For` keeps the original client's IP so the backend can still log, rate-limit, or geolocate by the real client." },
      { question: "What problem does the X-Forwarded-For header solve?", answer: "Losing the original client's IP after a request passes through one or more proxies. Without it, the backend sees only the last proxy in the chain as the source of every request." },
      { question: "How can a reverse proxy implement rate limiting across an entire fleet of backend servers?", answer: "Every request passes through the proxy first, so it can count requests per client (by IP, API key, etc.) in one place and reject or throttle over the limit. Backends don't need to track and share counts themselves." },
      { question: "Describe a scenario where a system would use both a forward proxy and a reverse proxy at once.", answer: "A company's staff reach the internet through a forward proxy (filtering and logging outbound traffic), while requests to the company's public service go through a separate reverse proxy to the right internal backend. The two handle opposite directions of traffic." },
      { question: "Why might a company route its clients' outbound connections through a forward proxy for security reasons?", answer: "It gives one choke point to inspect, filter, or block risky outbound connections (like known-malicious domains), instead of relying on every machine to enforce the policy." },
      { question: "What's a potential downside of routing all traffic through a single reverse proxy layer?", answer: "Every request gets an extra network hop and a little latency. If it isn't scaled or made redundant, it can become a bottleneck or outage point for the whole system even when backends are healthy." },
      { question: "How does a reverse proxy decouple clients from changes in backend infrastructure?", answer: "Clients only use the proxy's stable public endpoint. Backends can be added, removed, resized, or moved without clients changing anything; only the proxy's routing needs updating." },
      { question: "Why is it important for a reverse proxy itself to be highly available?", answer: "Every request passes through it, so if it goes down, every backend behind it is unreachable. Its availability caps the availability of the whole system." },
    ],
    prerequisites: ["client-and-server"],
    relatedTopics: ["load-balancing", "api-gateway"],
    keywords: ["proxy", "reverse proxy", "forward proxy", "routing"],
  },
  {
    id: "authentication-and-sessions",
    title: "Authentication & Sessions",
    level: "beginner",
    description: "How a server remembers who you are across requests, even though HTTP doesn't.",
    explanation: `
HTTP is stateless: the server doesn't remember you between requests. Yet
apps do remember you. You log in once and stay logged in. That memory is
built on top of HTTP, usually in one of two ways:

- **Sessions**: the server tracks who's logged in and gives your browser a small id that points to your session.
- **Tokens**: the server gives your browser a self-contained piece of data that proves who you are, so the server stores nothing.
    `.trim(),
    analogy:
      "A session is like a wristband at a venue: the venue keeps a list of which wristband went to which customer and checks yours against it at each door. A token is like a signed, tamper-proof ticket that carries everything needed to prove it's valid. Nobody checks a list; they just verify the signature.",
    examples: [
      {
        title: "A simple session-based login flow",
        code: `// 1. User logs in with correct credentials
POST /login  { username: "amara", password: "..." }

// 2. Server creates a session record and sends back a cookie
Set-Cookie: sessionId=abc123; HttpOnly

// 3. Every later request automatically includes that cookie
GET /dashboard
Cookie: sessionId=abc123

// 4. Server looks up "abc123" in its session store to know who's asking`,
        walkthrough: [
          { code: "POST /login { username, password }", explanation: "The client sends credentials once, to prove identity." },
          { code: "Set-Cookie: sessionId=abc123", explanation: "The server creates a session record and gives the browser a small id pointing to it." },
          { code: "Cookie: sessionId=abc123", explanation: "The browser automatically resends that cookie on every later request." },
          { code: 'Server looks up "abc123"', explanation: "The server checks its storage to see which user owns this session id." },
        ],
      },
    ],
    howItWorks: `
With sessions, the server stores session data (who's logged in, since
when) in memory or a database under a random session id, and gives that
id to the browser as a cookie. Each later request sends the cookie, and
the server looks up the session.

With tokens (commonly JWTs), the server signs a small piece of data
holding the user's identity. It can be verified without a lookup: the
token is the proof, as long as its signature checks out.
    `.trim(),
    whyItExists: `
Without it, a server couldn't tell visitors apart or remember that you
already proved who you are. Every request would need your full
credentials again, which is impractical and insecure.
    `.trim(),
    whenToUse: `
Use sessions when you want the server in full control, able to revoke
access instantly by deleting a session record.

Use tokens to avoid a central lookup on every request, especially across
several independent services. The cost: tokens are harder to revoke
early.
    `.trim(),
    whenNotToUse: `
Don't build authentication from scratch outside a learning exercise.
Subtle mistakes (weak session ids, wrong token signature checks) are a
common cause of serious security holes. Use well-established, audited
libraries and frameworks instead.
    `.trim(),
    commonMistakes: [
      "Storing session ids or tokens where JavaScript can read them (open to theft via XSS) instead of in an HttpOnly cookie.",
      "Assuming a token can be revoked instantly like a session. A signed token generally stays valid until it expires unless you build extra revocation logic.",
      "Sending credentials or session ids over plain HTTP instead of HTTPS, exposing them to anyone on the network.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain in your own words why HTTP being stateless means a server needs a separate way to 'remember' a logged-in user." },
      { difficulty: "Medium", prompt: "Describe the difference between a session id and a token, and one advantage each has over the other." },
      { difficulty: "Hard", prompt: "Explain how a service could quickly revoke a compromised session versus a compromised token, and why one is harder." },
    ],
    interviewQuestions: [
      { question: "Why can't the server just 'remember' a user across requests using HTTP alone?", answer: "HTTP is stateless by design: each request is handled on its own. Remembering a user needs a mechanism like a session or token on top." },
      { question: "What's the difference between a session and a token?", answer: "A session keeps the user's state on the server, found by an id the client holds. A token carries the user's state itself (signed, so it can be verified), and the server stores nothing." },
      { question: "Why is a token harder to revoke early than a session?", answer: "You revoke a session by deleting its record on the server. A signed token is self-contained and stays valid until it expires, unless you build extra revocation tracking." },
      { question: "What's the difference between authentication and authorization?", answer: "Authentication answers 'who are you?' by verifying identity, usually with credentials. Authorization answers 'what are you allowed to do?' for a user already identified." },
      { question: "What is a cookie, and how does the browser know to send it automatically on future requests?", answer: "A small piece of data the server asks the browser to store via a `Set-Cookie` header. The browser then attaches it to every later request to the same domain (within the cookie's scope) in the `Cookie` header, without app code doing it." },
      { question: "What does the HttpOnly flag on a cookie protect against?", answer: "It stops page JavaScript from reading the cookie. Even if an attacker injects a script (XSS), they can't directly steal a session id or token stored in an `HttpOnly` cookie." },
      { question: "What does the Secure flag on a cookie do?", answer: "The browser only sends that cookie over HTTPS, so it's never exposed in plaintext over unencrypted HTTP." },
      { question: "What is the SameSite cookie attribute, and what problem does it help prevent?", answer: "It controls whether a cookie is sent with requests that come from a different site than the one that set it. `Strict` or `Lax` stops the browser from attaching a user's session cookie to requests forged by a malicious site (CSRF)." },
      { question: "What is CSRF (Cross-Site Request Forgery), and how does SameSite help mitigate it?", answer: "CSRF tricks a logged-in user's browser into sending an unwanted authenticated request, embedded on a malicious page. It works because browsers normally attach cookies no matter where a request starts. `SameSite` blocks the cookie on requests that come from another site." },
      { question: "What is XSS (Cross-Site Scripting), and why does it matter for deciding where to store an auth token?", answer: "XSS injects malicious script into a trusted page (e.g. via unescaped user input) and runs it there. Anything JavaScript can read, like `localStorage`, that script can steal; an `HttpOnly` cookie it cannot." },
      { question: "Why is storing a JWT in localStorage often discouraged compared to an HttpOnly cookie?", answer: "Any script on the page can read `localStorage`, so a successful XSS attack can steal the token. An `HttpOnly` cookie is invisible to JavaScript, closing that route (though cookies bring their own CSRF concerns)." },
      { question: "What is a JWT structurally made up of?", answer: "Three base64url-encoded parts separated by dots: a header (the algorithm used), a payload (the claims, like user id and expiry), and a signature (computed over header and payload to detect tampering)." },
      { question: "Does base64-encoding a JWT's payload make its contents secret? Why or why not?", answer: "No. base64 is an encoding, not encryption, so anyone can decode and read the payload. The signature only proves it wasn't altered. Never treat a JWT as confidential or put sensitive data in it unless it's also encrypted." },
      { question: "How does a server verify that a JWT hasn't been tampered with?", answer: "It recomputes the signature over the header and payload with its secret (or the public key, for asymmetric signing) and checks it matches the token's signature. Any change to header or payload gives a different signature and fails." },
      { question: "What's the difference between signing a JWT with a symmetric secret (HMAC) versus an asymmetric key pair (RSA/ECDSA)?", answer: "With HMAC, one secret both signs and verifies, so any service that can verify a token could also forge one. With a key pair, only the private-key holder can sign, while any number of services verify with the public key and can't create tokens." },
      { question: "Why might a system use short-lived access tokens paired with longer-lived refresh tokens?", answer: "A short-lived access token limits how long a stolen one is useful. The refresh token (kept more securely, used less often) gets new access tokens without making the user log in again. It balances security and convenience." },
      { question: "What happens if a refresh token is stolen, and how do systems typically mitigate that risk?", answer: "An attacker could keep minting new access tokens. Systems use refresh token rotation (a new refresh token on each use, the old one invalidated) and treat reuse of an already-rotated token as a sign of theft." },
      { question: "Why do session-based systems scale less trivially across multiple servers than token-based systems, and how is that usually solved?", answer: "A session lives on the server that created it, so a request landing on another server won't find it unless state is shared. The usual fixes are a shared session store (like Redis) every server reads, or routing a client back to the same server (sticky sessions)." },
      { question: "What is a sticky session, and what problem does it cause for load balancing?", answer: "A load balancer setting that sends all of a client's requests to the same backend, so its in-memory session stays available. It weakens even load spreading, and losing that server hits all clients pinned to it." },
      { question: "Why is storing passwords in plain text always wrong, regardless of any other security measures in place?", answer: "If the database is ever exposed (a leak, a misconfigured backup, an insider), every real password is revealed. Since people reuse passwords, one breach can compromise their accounts on other sites too." },
      { question: "What is password hashing, and why is a slow, purpose-built algorithm like bcrypt preferred over a fast general-purpose hash like SHA-256?", answer: "Hashing stores a one-way transformation of the password, not the password. bcrypt and similar algorithms are deliberately slow and tunable, making mass guessing expensive. A fast hash like SHA-256 lets an attacker try billions of guesses per second on stolen hashes." },
      { question: "What is a salt, and what attack does it protect against?", answer: "Random data, unique per user, added to a password before hashing. It defeats precomputed rainbow-table attacks and hides when two users share a password, since the same password gives different hashes once salted." },
      { question: "Why is sending credentials over plain HTTP a serious vulnerability, even if the password is hashed before storage?", answer: "Hashing protects the password at rest in the database. Over plain HTTP, anyone watching the network (e.g. on shared Wi-Fi) can capture the plaintext password in transit, before the server ever hashes it." },
      { question: "What is multi-factor authentication (MFA), and why does it improve security beyond a strong password alone?", answer: "MFA requires more than one independent factor: something you know (a password) plus something you have (a phone) or something you are (a fingerprint). A stolen or guessed password alone isn't enough without the second factor." },
      { question: "What is OAuth, and what problem does it solve that a plain username/password login doesn't?", answer: "A protocol for delegated access. A user grants one app limited access to their data on another service without giving that app their password, so third-party apps never hold credentials they shouldn't be trusted with." },
      { question: "What's the difference between using OAuth for delegated access and using it for 'Sign in with Google/GitHub'-style login?", answer: "Delegated access grants a specific scope of permission on a resource (like reading a user's calendar). 'Sign in with' login reuses the same flow only to confirm identity (via OpenID Connect on top of OAuth), without necessarily requesting access to other data." },
      { question: "Why is it a mistake to treat a valid JWT signature as proof that a user's access hasn't been revoked?", answer: "A valid signature only proves the token is untampered and was issued by the server. It says nothing about revocation: a self-contained token passes that check until it expires, unless the system tracks revocations separately." },
      { question: "Describe a realistic scenario where you'd choose token-based auth over session-based auth.", answer: "Several independent backend services (microservices, or a public API used by many clients). Any service with the public key (or shared secret) can verify identity on its own, with no central session store every service must query." },
      { question: "Describe a realistic scenario where you'd choose session-based auth over token-based auth.", answer: "A traditional server-rendered web app with one backend (or a few tightly coupled services). Sessions give easy, immediate revocation (delete the record) and avoid token problems like revocation lists or key distribution across services it doesn't have." },
      { question: "Why should session ids and tokens be generated using a cryptographically secure random generator rather than something predictable?", answer: "If an id can be guessed (e.g. from a counter or weak random source), an attacker can forge a valid session id or token for another user without stealing anything, defeating the whole mechanism." },
    ],
    prerequisites: ["http", "client-and-server"],
    relatedTopics: ["http", "rest-apis"],
    keywords: ["authentication", "session", "token", "JWT", "cookie", "login"],
  },
];
