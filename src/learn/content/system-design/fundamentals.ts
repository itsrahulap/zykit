import type { Topic } from "../../types/content";

export const systemDesignFundamentalsTopics: Topic[] = [
  {
    id: "what-is-system-design",
    title: "What is System Design?",
    level: "beginner",
    description: "Planning how the different parts of a real software system fit together and work at scale.",
    explanation: `
Writing a single function or a small app is one skill. Deciding how dozens
of services, databases, and servers should work *together* — so that
millions of people can use a product reliably, quickly, and without it
falling over — is a different skill entirely. That's **system design**.

It's less about writing code and more about making decisions: Where should
data live? How do different parts of the system talk to each other? What
happens when one part fails, or when ten times more people show up at
once?
    `.trim(),
    analogy:
      "If writing code is like building a single room, system design is like being the architect of an entire city — deciding where the roads, water pipes, and power lines go so that everything works together, even as the population grows.",
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
System design usually starts with understanding requirements (how many
users, how much data, how fast does it need to respond), then breaks the
problem into components (servers, databases, caches, queues), and decides
how those components connect and what happens when something goes wrong.
It's an iterative process of trade-offs, not a single right answer.
    `.trim(),
    whyItExists: `
A system that works perfectly for 10 users can completely fall apart at 10
million — slow responses, crashes, lost data. System design exists to
think through those problems *before* they happen, and to make deliberate,
informed trade-offs instead of accidental ones.
    `.trim(),
    whenToUse: `
Reach for system-design thinking whenever you're planning something
bigger than a single script — choosing how services, data, and traffic
should be organized before (or while) you build, especially once more
than one person or more than a handful of users will depend on it.
    `.trim(),
    whenNotToUse: `
For a small script, a personal tool, or a prototype nobody else depends
on yet, heavy system design is overkill — you'd spend more time planning
for scale you don't have than actually building. Start simple, and bring
in system design as real constraints (more users, more data, more
reliability needs) show up.
    `.trim(),
    commonMistakes: [
      "Jumping straight to specific technologies before understanding the actual requirements and constraints.",
      "Designing only for the current scale and ignoring how the system would need to change if usage grew 100x.",
      "Assuming there's one 'correct' design instead of a best trade-off given the specific goals.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Pick an app you use daily (e.g. a messaging app) and list 3 questions you'd need to answer to design its backend." },
      { difficulty: "Medium", prompt: "Sketch (in words) the major components you'd expect behind a simple photo-sharing app: what stores the photos, what stores the metadata, what serves requests." },
      { difficulty: "Hard", prompt: "Describe what might break in your sketch above if the app suddenly went from 1,000 to 10,000,000 users." },
    ],
    interviewQuestions: [
      { question: "What is system design, in your own words?", answer: "The process of deciding how the components of a software system (servers, databases, caches, queues, etc.) fit together to meet requirements like scale, speed, and reliability." },
      { question: "Why can't you just \"add more servers\" to fix every scaling problem?", answer: "Because bottlenecks often move to somewhere else — like a single database — that doesn't automatically scale just by adding more application servers." },
      { question: "What's the difference between a functional and a non-functional requirement in system design?", answer: "Functional requirements describe what the system does (e.g. 'users can post a photo'); non-functional requirements describe how well it does it (e.g. 'responses under 200ms', 'handles 1M users')." },
      { question: "What's the difference between vertical scaling and horizontal scaling?", answer: "Vertical scaling means making a single machine more powerful (more CPU, RAM); horizontal scaling means adding more machines and spreading the load across them." },
      { question: "Why is horizontal scaling generally preferred for large-scale systems, despite being more complex?", answer: "A single machine has a hard ceiling on how powerful it can get and becomes a single point of failure, while horizontal scaling has no fixed ceiling and lets the system tolerate individual machines failing." },
      { question: "What are some of the main non-functional requirements a system designer needs to gather before designing a system?", answer: "Things like availability (how often it must be up), latency (how fast it must respond), scalability (how much growth it must handle), consistency (how up-to-date data must be across replicas), and durability (whether data can ever be lost)." },
      { question: "What is a single point of failure, and why does system design try to eliminate them?", answer: "Any single component whose failure takes down the whole system — system design tries to remove them (through redundancy and replication) because a system is only as reliable as its least reliable required component." },
      { question: "Why do system design interviews emphasize trade-offs rather than a single correct answer?", answer: "Because real systems balance competing goals (cost, consistency, latency, complexity) differently depending on their specific requirements, so a good designer explains the reasoning behind a choice rather than reciting one 'correct' architecture." },
      { question: "What is back-of-the-envelope estimation, and why is it a common first step in system design?", answer: "Rough capacity math (expected users, requests per second, storage growth) done early to reveal which parts of a design will actually be under strain, so effort isn't wasted optimizing something that was never going to be a bottleneck." },
      { question: "What's the difference between throughput and latency?", answer: "Latency is how long a single request takes to complete; throughput is how many requests the system can handle in a given period — a system can have high throughput and still feel slow per-request, or vice versa." },
      { question: "Why might a design that works fine for 10,000 users fail at 10 million, even with no bugs?", answer: "Because resources that seemed effectively unlimited at small scale — a single database's connections, disk I/O, a single server's memory — become real bottlenecks once traffic and data volume grow by orders of magnitude." },
      { question: "What is the CAP theorem, and why does it matter when designing a distributed system?", answer: "It states that a distributed system can't simultaneously guarantee Consistency, Availability, and Partition tolerance during a network failure — since partitions are unavoidable in practice, it forces an explicit choice between staying consistent or staying available when the network splits." },
      { question: "What's the difference between designing for a read-heavy workload versus a write-heavy workload?", answer: "Read-heavy systems tend to lean on caching and read replicas to serve the same data to many readers cheaply; write-heavy systems need to focus on how writes are distributed and ordered (sharding, queues) since caching doesn't help data that changes constantly." },
      { question: "Why is it important to clarify assumptions and scope before diving into a system's design?", answer: "Without agreeing on scale, key features, and constraints up front, two people can design very different, equally 'correct' systems for the same vague prompt — clarifying scope focuses effort on the requirements that actually matter." },
      { question: "What does \"availability\" mean in system design, and how is it typically expressed?", answer: "The proportion of time a system is operational and able to serve requests, often expressed as a percentage of uptime (e.g. 99.9%, informally '3 nines') or in terms of allowed downtime per year." },
      { question: "Give an example of a trade-off between consistency and availability.", answer: "A banking system might reject a request during a network partition rather than risk showing a stale balance (favoring consistency), while a social media feed might show slightly outdated data rather than fail entirely (favoring availability)." },
      { question: "Why might adding a cache introduce new problems instead of simply making a system faster?", answer: "A cache can serve stale data if it isn't invalidated correctly, adds an extra component that can fail or get out of sync with the source of truth, and shifts complexity toward cache-invalidation bugs, which are notoriously easy to get wrong." },
      { question: "What's the risk of over-engineering a system design for scale it doesn't actually need yet?", answer: "It burns time and money building and maintaining complexity (extra services, replication, queues) that isn't solving a real current problem, while likely guessing wrong about which future bottlenecks will actually matter." },
    ],
    relatedTopics: ["client-and-server", "scalability"],
    keywords: ["system design", "architecture", "scale", "trade-offs"],
  },
  {
    id: "client-and-server",
    title: "Client and Server",
    level: "beginner",
    description: "The basic relationship between the app you use and the machine that does the real work behind it.",
    explanation: `
When you open an app or website, the thing you're looking at — the
screen, the buttons — is called the **client**. It usually doesn't have
all the data or logic itself; instead, it sends a request over the
internet to a **server**: a computer somewhere else that has the actual
data and does the real processing, then sends a response back.

This split — client asks, server answers — is the foundation almost every
piece of software on the internet is built on.
    `.trim(),
    analogy:
      "It's like ordering food at a restaurant. You (the client) don't cook the meal yourself — you tell the waiter what you want, the kitchen (the server) prepares it, and the waiter brings it back to your table.",
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
          { code: ".then((response) => response.json())", explanation: "Once a response arrives, parses its body as JSON." },
          { code: ".then((user) => console.log(user));", explanation: "Uses the data the server sent back." },
          { code: "// Server receives the request...", explanation: "The server does its own work on its own machine, entirely out of the client's sight." },
        ],
      },
    ],
    howItWorks: `
The client sends a request over the network specifying what it wants. The
server receives that request, does whatever work is needed (looking up
data, running logic), and sends a response back. The client then updates
what the user sees, based on that response.
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
Splitting work this way lets many different clients (phones, browsers,
smart TVs) share the same server and data, without each device needing to
store and manage everything itself. It also lets the server be updated or
scaled independently of the apps that use it.
    `.trim(),
    whenToUse: `
This model applies to essentially any networked application — web apps,
mobile apps, games with online features — any time one program needs data
or processing that lives somewhere else.
    `.trim(),
    whenNotToUse: `
A fully offline tool that never talks to another machine doesn't need a
client-server split at all. And for something genuinely tiny and local,
introducing a whole separate server just adds operational complexity with
no real benefit.
    `.trim(),
    commonMistakes: [
      "Assuming the client can be trusted — a server should always re-check anything important, since clients can be modified by users.",
      "Forgetting that a request/response trip takes real time (network latency), which affects how responsive an app feels.",
      "Putting sensitive logic or secrets in client-side code, where anyone can inspect it.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Open your browser's Network tab and find one request your favorite website sends to its server." },
      { difficulty: "Medium", prompt: "Explain, in your own words, why a weather app needs a server instead of just knowing the weather itself." },
      { difficulty: "Hard", prompt: "Describe what could go wrong if a shopping app trusted the price sent from the client instead of verifying it on the server." },
    ],
    interviewQuestions: [
      { question: "What is the client-server model?", answer: "An architecture where a client sends requests to a server, which processes them and returns a response, rather than the client handling everything itself." },
      { question: "Why shouldn't a server trust data coming from the client?", answer: "Because client-side code and requests can be modified or forged by anyone, so the server must independently validate anything security- or business-critical." },
      { question: "What is latency, in the context of client-server communication?", answer: "The time it takes for a request to travel to the server and for the response to travel back — a key factor in how fast an app feels." },
      { question: "What's the difference between a thin client and a thick (fat) client?", answer: "A thin client does minimal processing and relies on the server for most logic and data (e.g. a basic web page); a thick client handles significant logic and state locally, only talking to the server when it needs data or to persist changes (e.g. a native desktop app)." },
      { question: "Why can many different kinds of clients (web, mobile, smart TV) all share the same server?", answer: "Because the server exposes its data and logic through a shared protocol (like HTTP) rather than a client-specific interface, so any client that speaks that protocol correctly can use it, regardless of what device or platform it runs on." },
      { question: "What is a request-response cycle, and why does understanding it matter for building responsive apps?", answer: "It's the full round trip of a client sending a request and receiving a response — understanding it matters because every cycle takes real time, so an app that triggers many unnecessary cycles (or blocks the UI while waiting on one) will feel slow even if the server itself is fast." },
      { question: "At a conceptual level, how does a client know which physical server to talk to when it makes a request?", answer: "The client resolves a human-readable address (like a domain name) into a network location via DNS, then opens a connection to that location — the client doesn't need to know or care which actual machine ends up handling the request." },
      { question: "How should a well-built client handle a server that's slow to respond?", answer: "It should avoid blocking the whole UI, show appropriate loading/pending state, and set a reasonable timeout rather than waiting indefinitely — treating a slow response as an expected condition to design for, not an edge case." },
      { question: "Why is validating input only on the client side considered a security anti-pattern?", answer: "Because client-side code runs on a device the user fully controls — it can be bypassed, modified, or skipped entirely by sending requests directly, so any validation that matters for security or data integrity must also be enforced on the server." },
      { question: "What's the difference between synchronous and asynchronous client-server communication?", answer: "In a synchronous exchange, the client waits for the server's response before doing anything else; in an asynchronous exchange, the client continues other work and handles the response (or a notification) whenever it eventually arrives." },
      { question: "Can a server ever act as a client? Give an example.", answer: "Yes — when a server needs data or work from another service, it makes its own outgoing request and acts as a client to that service, e.g. a backend server calling a third-party payment API before returning a response to the original client." },
      { question: "Why does moving business logic from the client to the server usually improve security, even at the cost of extra latency?", answer: "Logic that runs on the server is outside the user's control and can't be tampered with or bypassed the way client-side code can, so anything where correctness or trust matters (pricing, permissions, validation) is safer enforced there, even though it means an extra round trip." },
      { question: "What's the difference between latency and bandwidth?", answer: "Latency is the delay before data starts arriving; bandwidth is how much data can be transferred per unit of time once it's flowing — a connection can have low latency but low bandwidth, or vice versa, and each affects performance differently." },
      { question: "Why might a client cache data locally instead of requesting it from the server every time, and what's the trade-off?", answer: "Caching avoids the latency and load cost of repeating identical requests, but risks the client working with stale data if the server-side data changes and the cache isn't invalidated or refreshed appropriately." },
      { question: "What is a network round trip, and why do developers try to minimize how many a page or app makes?", answer: "It's one full request-response exchange between client and server; each one adds latency, so an app that makes many sequential round trips (instead of batching or parallelizing them) ends up feeling noticeably slower than the actual server processing time would suggest." },
      { question: "How does the client-server model differ from a peer-to-peer model?", answer: "In client-server, roles are fixed — clients request, servers respond, and servers are usually centralized; in peer-to-peer, participants act as both client and server to each other, with no required central authority coordinating every exchange." },
      { question: "What role does the server play when multiple clients try to modify the same data at the same time?", answer: "The server acts as the single source of truth that decides how concurrent updates are ordered or reconciled (e.g. via locks, transactions, or conflict resolution rules) — without that central arbiter, clients could overwrite each other's changes inconsistently." },
      { question: "Why do mobile apps often need to handle network failures more gracefully than typical desktop web apps?", answer: "Mobile devices frequently lose or switch connectivity (moving between Wi-Fi and cellular, entering low-signal areas), so a mobile client needs to expect intermittent failures and design for retries, offline states, or queued requests rather than assuming a stable connection." },
    ],
    prerequisites: ["what-is-system-design"],
    relatedTopics: ["http", "rest-apis"],
    keywords: ["client", "server", "request", "response", "latency"],
  },
  {
    id: "http",
    title: "HTTP",
    level: "beginner",
    description: "The common language that lets clients and servers talk to each other over the web.",
    explanation: `
For a client and a server to communicate, they both need to agree on a
shared format for requests and responses — otherwise it's just noise
neither side understands. **HTTP** (HyperText Transfer Protocol) is that
shared language: a set of rules for how a request should be structured,
what kinds of requests exist, and how a server should respond.
    `.trim(),
    analogy:
      "HTTP is like the standard format for a letter: a return address, a recipient address, a subject, and a body. Because everyone agrees on that format, any recipient (server) can read a properly formatted letter (request) — and is expected to write back using that same standard format (a response), rather than replying however they feel like.",
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
          { code: "GET /users/1 HTTP/1.1", explanation: "The method (GET) and path (/users/1) — this request asks to read user #1." },
          { code: "Host: api.example.com", explanation: "A header telling the server which website/host this request is meant for." },
          { code: "HTTP/1.1 200 OK", explanation: "The response's status line — 200 means the request succeeded." },
          { code: '{ "id": 1, "name": "Amara" }', explanation: "The response body — the actual data that was requested." },
        ],
      },
    ],
    howItWorks: `
Every HTTP request has a **method** (what kind of action, like GET or
POST), a **path** (what resource it's about), and optional **headers** and
a **body** (extra data). Every response has a **status code** (like 200
for success or 404 for not found) plus its own headers and body. Both
sides just follow this shared structure.
    `.trim(),
    whyItExists: `
Without a shared protocol, every client and server pair would need its own
custom way of communicating — nothing on the web would be interoperable.
HTTP gives every browser, app, and server a common language, which is why
the web works at all.
    `.trim(),
    whenToUse: `
You're using HTTP any time a browser, app, or script talks to a web
server — which is most of the time a client-server application
communicates at all.
    `.trim(),
    whenNotToUse: `
For very high-frequency, low-latency communication — real-time games,
some financial trading systems — raw HTTP's overhead can be too much;
protocols like WebSockets or dedicated binary protocols fit better there.
    `.trim(),
    commonMistakes: [
      "Confusing HTTP status code categories, e.g. thinking all 4xx codes mean 'server error' (they mean client error; 5xx means server error).",
      "Forgetting that HTTP is stateless by default — the server doesn't automatically remember previous requests unless something (like cookies or tokens) carries that state.",
      "Using the wrong method for the action, e.g. using GET for something that changes data on the server.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List the HTTP methods GET, POST, PUT, and DELETE, and describe what each is typically used for." },
      { difficulty: "Medium", prompt: "Look up what HTTP status codes 200, 301, 404, and 500 mean." },
      { difficulty: "Hard", prompt: "Explain, in your own words, why HTTP being 'stateless' matters for how servers are designed to scale." },
    ],
    interviewQuestions: [
      { question: "What is HTTP?", answer: "A protocol (a set of rules) that defines how clients and servers structure requests and responses when communicating over the web." },
      { question: "What does it mean that HTTP is stateless?", answer: "Each request is handled independently — the server doesn't automatically remember anything about previous requests from the same client unless extra mechanisms (cookies, tokens, sessions) are used." },
      { question: "What's the difference between GET and POST?", answer: "GET requests data without changing anything on the server (and can be cached); POST typically sends data to create or change something on the server." },
      { question: "What does it mean for an HTTP method to be \"idempotent\"? Which common methods are idempotent?", answer: "An idempotent method produces the same end result no matter how many times the identical request is repeated — `GET`, `PUT`, `DELETE`, `HEAD`, and `OPTIONS` are idempotent, while `POST` and `PATCH` generally are not." },
      { question: "What does it mean for an HTTP method to be \"safe\", and how is that different from being idempotent?", answer: "A safe method doesn't change server state at all (it's read-only, like `GET` or `HEAD`); idempotent only requires that repeating the request doesn't change the outcome further — so a method can be idempotent without being safe, like `DELETE`, which changes state on the first call but not on repeats." },
      { question: "Why is PUT considered idempotent but POST is not?", answer: "`PUT` replaces a resource with the exact representation sent, so sending the same `PUT` request twice leaves the resource in the same final state; `POST` typically creates a new resource each time, so repeating it (e.g. resubmitting a form) can create duplicates." },
      { question: "Is DELETE idempotent? Explain with an example.", answer: "Yes — deleting the same resource twice leaves it in the same end state (gone) as deleting it once, even though the second request might return a `404` instead of a success status; the *result* on the server is unchanged, which is what idempotency actually measures." },
      { question: "What's the difference between PATCH and PUT?", answer: "`PUT` is expected to replace an entire resource with the payload sent; `PATCH` applies a partial update, changing only the fields included in the request while leaving the rest untouched." },
      { question: "What are the five broad categories of HTTP status codes?", answer: "1xx (informational, request received and being processed), 2xx (success), 3xx (redirection, further action needed), 4xx (client error), and 5xx (server error)." },
      { question: "What's the difference between a 401 and a 403 status code?", answer: "401 Unauthorized means the request lacks valid authentication (the client isn't identified, or its credentials are missing/invalid); 403 Forbidden means the client is identified but doesn't have permission to access that resource." },
      { question: "What's the difference between a 404 and a 410 status code?", answer: "404 Not Found means the server has no resource at that URL (which could be temporary or permanent); 410 Gone explicitly signals that a resource used to exist there but has been permanently removed, which is a stronger, more specific signal than a plain 404." },
      { question: "What's the difference between a 500 and a 503 status code?", answer: "500 Internal Server Error means something went wrong while processing the request on the server itself (an unhandled error, a bug); 503 Service Unavailable means the server is temporarily unable to handle the request (overloaded, down for maintenance) and implies the client can retry later." },
      { question: "What's the difference between a 301 and a 302 redirect?", answer: "301 Moved Permanently tells the client (and search engines) the resource has permanently moved to a new URL and future requests should go straight there; 302 Found signals a temporary redirect, meaning the client should keep using the original URL for future requests." },
      { question: "Why does it matter whether a redirect is 301 or 302 for things like caching or search engine indexing?", answer: "Browsers and search engines may cache a 301 redirect and transfer the original URL's search ranking to the new one, since it's treated as permanent; a 302 is not cached or trusted the same way, since the original URL is expected to become valid again." },
      { question: "What is the purpose of HTTP headers? Give an example of a request header and a response header.", answer: "Headers carry metadata about a request or response separate from its body — e.g. the request header `Host` tells the server which website the request is for, while the response header `Content-Type` tells the client how to interpret the body." },
      { question: "What's the difference between the Content-Type and Accept headers?", answer: "`Content-Type` (sent by whichever side includes a body) describes the format of the data actually being sent; `Accept` (sent by the client) states which response formats the client is willing to receive, letting the server choose accordingly." },
      { question: "At a high level, how does HTTP caching work, and which headers control it?", answer: "A response can include caching headers like `Cache-Control` (how long a response may be reused, and by whom) so that a client or intermediate proxy can reuse a stored copy of a response instead of re-requesting it, until that cache entry expires or is invalidated." },
      { question: "What's the difference between Cache-Control: no-cache and Cache-Control: no-store?", answer: "`no-cache` allows a response to be stored but requires it to be revalidated with the server before each reuse; `no-store` forbids storing the response at all, which is used for sensitive data that should never be cached anywhere." },
      { question: "What is an ETag, and how does it help avoid re-downloading unchanged data?", answer: "It's a token the server generates that identifies a specific version of a resource; the client can send it back in an `If-None-Match` header on a later request, and if the resource hasn't changed the server replies with a `304 Not Modified` and no body, saving bandwidth." },
      { question: "What's the purpose of the If-None-Match header, and how does the server respond to it?", answer: "It lets the client say 'only send me the full response if the resource's ETag has changed since I last saw this value' — if the ETag still matches, the server returns `304 Not Modified`; if it doesn't, the server returns the current representation with a `200 OK`." },
      { question: "Why is HTTP described as stateless, and what mechanisms let applications build state (like being logged in) on top of it?", answer: "Each HTTP request is handled independently, with no built-in memory of previous requests; applications add state on top using mechanisms like cookies, sessions, or tokens that are sent with every request to identify the client." },
      { question: "At a conceptual level, what changed between HTTP/1.1 and HTTP/2?", answer: "HTTP/1.1 generally needs a separate connection (or queued requests on one) per concurrent request, while HTTP/2 multiplexes many requests and responses over a single connection and compresses headers, reducing overhead and avoiding head-of-line blocking at the connection level." },
      { question: "What problem does HTTP keep-alive solve?", answer: "Without it, a new TCP connection would need to be opened and closed for every single request, which is slow; keep-alive reuses one connection for multiple requests/responses, avoiding that repeated setup cost." },
      { question: "Why is the Host header required, even though the request is already being sent to a specific server's IP address?", answer: "A single IP address (and port) can serve many different websites (virtual hosting), so the server needs the `Host` header to know which specific site or application the request is actually meant for." },
      { question: "Why might a client send a HEAD request instead of a GET?", answer: "`HEAD` returns the same headers a `GET` would, without the body, letting a client check things like whether a resource exists or how large it is, without spending bandwidth downloading the actual content." },
      { question: "What is the OPTIONS method typically used for?", answer: "It asks a server what methods and headers are allowed for a given resource, most commonly used automatically by browsers as a CORS \"preflight\" request before a cross-origin request that isn't considered \"simple\"." },
      { question: "What's the difference between a query parameter and a path parameter in a request URL?", answer: "A path parameter identifies a specific resource as part of the URL's structure (e.g. `/users/42`); a query parameter (e.g. `?sort=name&page=2`) modifies how that resource is fetched, like filtering, sorting, or pagination, without changing which resource is being addressed." },
      { question: "Why is it a mistake to use GET for a request that changes data on the server?", answer: "`GET` is expected to be safe and idempotent, so browsers, proxies, and crawlers may prefetch, cache, or repeat `GET` requests freely — if `GET` has side effects, those tools can trigger unintended changes without the user or developer expecting it." },
      { question: "What is content negotiation in HTTP?", answer: "The process by which a client and server agree on the best representation of a resource to return — e.g. the client's `Accept` header states preferred formats or languages, and the server picks a matching representation to send back." },
      { question: "Why does the 429 status code exist, and how should a well-behaved client respond to it?", answer: "429 Too Many Requests signals that the client has been rate-limited; a well-behaved client should back off and retry later, ideally respecting a `Retry-After` header if the server includes one, rather than immediately retrying and making the problem worse." },
    ],
    prerequisites: ["client-and-server"],
    relatedTopics: ["client-and-server", "rest-apis", "authentication-and-sessions", "websockets"],
    keywords: ["http", "protocol", "status code", "method", "stateless"],
  },
  {
    id: "rest-apis",
    title: "REST APIs",
    level: "beginner",
    description: "A common, predictable way to structure requests so different apps can talk to a server the same way.",
    explanation: `
An API (Application Programming Interface) is simply a way one piece of
software lets another piece of software ask it to do things. But an API
could be organized in a thousand different, inconsistent ways — which
makes it hard to learn and use. **REST** (Representational State Transfer)
is a popular, widely-agreed-upon style for designing APIs so that they're
consistent and predictable across countless different services.

The core idea: everything is a "resource" (like a user, a post, a
product), identified by a URL, and you use standard HTTP methods to act on
it — GET to read, POST to create, PUT/PATCH to update, DELETE to remove.
    `.trim(),
    analogy:
      "REST is like a well-labeled filing cabinet where every drawer follows the same layout convention, and every drawer lets you do the same standard set of things — look inside, add a paper, replace its contents, or remove it. Once you understand one drawer, you instantly know how to work with any other drawer in any cabinet built the same way.",
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
          "Notice the URL identifies *what* you're acting on (a post, or a specific one), and the HTTP method identifies *what action* you're taking.",
        walkthrough: [
          { code: "GET /posts", explanation: "Reads the full list of posts." },
          { code: "GET /posts/42", explanation: "Reads one specific post, identified by its id in the URL." },
          { code: "POST /posts", explanation: "Creates a new post." },
          { code: "PUT /posts/42  /  PATCH /posts/42", explanation: "Replaces post 42 entirely, or partially updates just some of its fields." },
          { code: "DELETE /posts/42", explanation: "Removes post 42." },
        ],
      },
    ],
    howItWorks: `
A REST API exposes resources as URLs and relies on standard HTTP methods
and status codes rather than inventing custom verbs for every action. This
consistency means a developer who's used one REST API can usually guess
how another one works, without reading extensive documentation.
    `.trim(),
    whyItExists: `
Before conventions like REST became common, every API had its own bespoke
rules, making integration slow and error-prone. REST gives teams a shared
set of conventions, which speeds up building and consuming APIs across
completely different companies and codebases.
    `.trim(),
    whenToUse: `
Reach for REST conventions when you're designing a general-purpose API
for resources (users, posts, products) that other developers — possibly
outside your team — will need to learn and use.
    `.trim(),
    whenNotToUse: `
For very specific, action-oriented operations that don't map cleanly to
a resource (like "run this report" or "send this batch job"), forcing a
REST shape can feel awkward — an RPC-style or GraphQL API sometimes fits
better.
    `.trim(),
    commonMistakes: [
      "Using verbs in URLs (`/getUser`) instead of nouns with proper HTTP methods (`GET /user`).",
      "Returning 200 OK for every response, even for errors, instead of using proper status codes.",
      "Designing endpoints that don't map cleanly to a resource, making the API inconsistent and confusing.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Design REST-style endpoints for a 'comments' resource: list, get one, create, update, delete." },
      { difficulty: "Medium", prompt: "Explain why `POST /users/delete/42` is not a RESTful way to delete a user, and rewrite it properly." },
      { difficulty: "Hard", prompt: "Design a small REST API (endpoints + methods + expected status codes) for a simple to-do list app." },
    ],
    interviewQuestions: [
      { question: "What does REST stand for, and what's its core idea?", answer: "Representational State Transfer — the core idea is treating everything as a resource identified by a URL, manipulated using standard HTTP methods." },
      { question: "What makes an API 'RESTful'?", answer: "Using resource-based URLs, standard HTTP methods for actions, standard status codes for outcomes, and being stateless between requests." },
      { question: "What's the difference between PUT and PATCH?", answer: "PUT typically replaces an entire resource; PATCH applies a partial update, changing only the specified fields." },
      { question: "What's the difference between a resource and an endpoint in a REST API?", answer: "A resource is the conceptual thing being represented (e.g. 'a user'); an endpoint is the specific URL through which clients access or act on that resource (e.g. `/users/42`) — one resource can be reachable through more than one endpoint, such as a nested and a top-level route." },
      { question: "Why should REST URLs use nouns for resources rather than verbs for actions?", answer: "The HTTP method already expresses the action (`GET`, `POST`, `PUT`, `DELETE`); putting a verb in the URL too (like `/deleteUser`) duplicates and can conflict with that, and makes the API inconsistent since every developer might phrase actions differently." },
      { question: "What status code should a successful POST that creates a new resource return, and what else is commonly included?", answer: "`201 Created`, typically along with a `Location` header pointing to the URL of the newly created resource, so the client knows where to find or reference it afterward." },
      { question: "What status code fits a successful DELETE that returns no response body?", answer: "`204 No Content` — it confirms success without implying there's any data to read in the response body." },
      { question: "Why is statelessness considered a defining constraint of REST rather than just a nice-to-have?", answer: "REST requires that each request contain everything needed to process it, with no reliance on server-side session state between requests — this is what lets any server instance handle any request, which is essential for horizontal scaling and simple load balancing." },
      { question: "What's the difference between a REST-style API and an RPC-style API?", answer: "REST models everything as resources manipulated through a small, standard set of HTTP methods; RPC exposes specific named actions/procedures directly (e.g. `POST /createUser`, `POST /banUser`), which can be more flexible for arbitrary operations but loses REST's uniform, predictable structure." },
      { question: "What's the difference between REST and GraphQL, and when might GraphQL be a better fit?", answer: "REST exposes fixed endpoints that each return a predetermined shape of data; GraphQL exposes a single endpoint where the client specifies exactly which fields it needs — GraphQL tends to fit better when clients have very different, evolving data needs and over- or under-fetching from REST endpoints becomes a real problem." },
      { question: "What does HATEOAS mean, and why do most real-world 'REST' APIs skip it?", answer: "Hypermedia As The Engine Of Application State — the idea that a response includes links describing what actions or resources are available next, so clients don't need to hardcode URL structures. Most APIs skip it because it adds real implementation complexity for a benefit (loosely coupled clients) that most consumers don't end up needing in practice." },
      { question: "Name a couple of common approaches to versioning a REST API.", answer: "Putting the version in the URL path (e.g. `/v1/users`), or in a request header (e.g. `Accept: application/vnd.myapi.v1+json`) — URL versioning is simpler and more visible, while header versioning keeps URLs stable but is less discoverable." },
      { question: "When is nesting resources in a URL (e.g. /users/1/posts) useful, and when does it become an anti-pattern?", answer: "It's useful when a resource is genuinely scoped to its parent (posts that only make sense in the context of a user); it becomes awkward when nesting goes several levels deep or when the same resource needs to be reached both independently and through a parent, leading to duplicate or inconsistent routes." },
      { question: "How should a REST API represent pagination for a large collection?", answer: "Typically via query parameters (like `?page=2&limit=20` or a cursor-based `?after=<id>`), with metadata in the response (or headers/links) indicating total count or how to fetch the next page, rather than returning the entire collection in one response." },
      { question: "What's the difference between filtering, sorting, and pagination as REST query parameters?", answer: "Filtering narrows down which items in a collection are returned (e.g. `?status=active`); sorting controls the order of the returned items (e.g. `?sort=-createdAt`); pagination controls how many items and which subset are returned at once — the three are typically combined but are conceptually independent." },
      { question: "Why should a REST API generally avoid exposing raw internal database ids or implementation details in its responses?", answer: "It couples clients to internal storage decisions that should be free to change (e.g. switching database or id scheme), and can leak information (like sequential ids revealing record counts) that clients don't need and shouldn't depend on." },
      { question: "Is a REST API required to return JSON? What does the word \"representational\" in REST actually refer to?", answer: "No — REST is format-agnostic; JSON is just the most common convention today. \"Representational\" refers to the idea that clients interact with a representation of a resource's state (in whatever format, JSON, XML, or otherwise), not the resource itself." },
      { question: "How should a REST API communicate a validation error to the client?", answer: "With a `4xx` status code (typically `400 Bad Request` or `422 Unprocessable Entity`) and a response body describing which fields failed validation and why, so the client can surface something actionable rather than a generic failure." },
      { question: "What's an idempotency key, and why might a REST API need one for a POST request?", answer: "A client-generated unique value sent with a request so that if the same request is retried (e.g. after a timeout, without the client knowing whether the first attempt succeeded), the server can recognize the duplicate and avoid performing the action twice — commonly used for things like payments, where POST's natural non-idempotency is dangerous." },
      { question: "Why is caching often easier to reason about in REST than in RPC-based or GraphQL APIs?", answer: "REST's use of GET on stable resource URLs maps naturally onto standard HTTP caching (by URL); RPC and GraphQL typically funnel varied requests through a single endpoint (often via POST), which doesn't get cached the same way by browsers, proxies, or CDNs without extra custom logic." },
      { question: "Why does it help for a REST API's error responses to follow one consistent structure across all endpoints?", answer: "A predictable error shape (e.g. always including a code, message, and optional field-level details) lets client code handle errors generically instead of writing custom parsing per endpoint, and makes API documentation and debugging far more consistent." },
      { question: "Why is over-fetching or under-fetching a common criticism of REST APIs, and how does it come about?", answer: "Because a REST endpoint returns a fixed shape of data, a client that needs only a couple of fields still receives the whole resource (over-fetching), while a client that needs data from multiple resources often has to make several separate requests (under-fetching) — both waste bandwidth or round trips compared to a query that could ask for exactly what's needed." },
      { question: "What does it mean for a REST API to be \"resource-oriented,\" and how does that shape its URL design?", answer: "It means the API is organized around nouns representing things in the domain (users, orders, posts) rather than around actions — which forces URL design toward `/resource` and `/resource/:id` patterns manipulated by standard HTTP methods, instead of an ever-growing list of custom action endpoints." },
      { question: "How would you design an endpoint to update just one field of a resource, and which HTTP method fits best?", answer: "`PATCH /resource/:id` with a body containing only the field(s) to change (e.g. `{ status: \"archived\" }`) — PATCH is the right method because it's defined for partial updates, unlike PUT, which implies replacing the whole resource." },
      { question: "Why is it considered bad practice for an API to always return 200 OK, even for errors?", answer: "It forces every client to parse the response body just to find out whether the request actually succeeded, defeating the purpose of standard status codes, and breaks tooling (like HTTP caches, monitoring, and generic error handling) that relies on the status code reflecting the real outcome." },
    ],
    prerequisites: ["http"],
    relatedTopics: ["http", "client-and-server", "databases"],
    keywords: ["REST", "API", "endpoint", "resource", "CRUD"],
  },
  {
    id: "proxy-and-reverse-proxy",
    title: "Proxy & Reverse Proxy",
    level: "beginner",
    description: "A middle server that sits between a client and the real destination, on behalf of one side or the other.",
    explanation: `
Sometimes a request doesn't go directly from a client to the server that
will actually handle it — instead, it passes through a middle server
first. A **forward proxy** sits in front of clients, forwarding their
requests out on their behalf (often hiding who the client is, or
filtering what they can reach). A **reverse proxy** sits in front of
servers, forwarding incoming requests to whichever backend server should
actually handle them (often hiding how many servers there are, or what
they look like).

The two solve opposite problems, even though the underlying idea — a
middle server relaying requests — is the same.
    `.trim(),
    analogy:
      "A forward proxy is like an assistant who makes calls on your behalf so the person on the other end never sees your number. A reverse proxy is like a company's reception desk — every visitor talks to the same receptionist, who then directs them to whichever employee should actually help, without the visitor ever needing to know who works where.",
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
          { code: '"/images/*": "image-server:5000"', explanation: "Image requests are routed to a separate server entirely." },
          { code: '"/*": "web-server:3000"', explanation: "Everything else falls through to the default web server." },
          { code: "the client only ever talks to one address", explanation: "The client has no idea multiple servers exist behind the scenes." },
        ],
      },
    ],
    howItWorks: `
A reverse proxy receives every incoming request first, inspects it
(usually just the path or domain), and forwards it to whichever backend
server is responsible for handling that kind of request — then relays
the response back to the client as if it had come from the proxy itself.
A forward proxy does the mirror image: it sits in front of clients,
receiving their outgoing requests and forwarding them onward, often
changing or hiding details about the original request.
    `.trim(),
    whyItExists: `
Without a reverse proxy, clients would need to know the exact address of
every individual backend service, and every one of those services would
need to be directly exposed to the internet. A reverse proxy gives
clients one single, stable address to talk to, while everything about how
many servers exist and what they do stays hidden and free to change.
    `.trim(),
    whenToUse: `
Reach for a reverse proxy anytime you have more than one backend service
(or more than one instance of the same service) and want clients to
interact with a single, stable entry point — this is also exactly what a
load balancer is, under the hood: a reverse proxy that distributes
traffic across many identical servers. Reach for a forward proxy when
clients need their outgoing requests filtered, cached, or have their
identity hidden.
    `.trim(),
    whenNotToUse: `
For a single, simple server with no need to route between multiple
backends, a reverse proxy adds an extra network hop with no real benefit
yet — you can always add one later as the system grows.
    `.trim(),
    commonMistakes: [
      "Confusing a forward proxy (works on behalf of clients) with a reverse proxy (works on behalf of servers) — they solve different problems.",
      "Forgetting that a reverse proxy is itself a piece of infrastructure that needs to stay up — if it goes down, so does access to everything behind it.",
      "Exposing internal backend addresses directly instead of routing everything through the proxy, defeating the purpose of hiding the internal architecture.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, the difference between a forward proxy and a reverse proxy." },
      { difficulty: "Medium", prompt: "Sketch (in words) a reverse proxy config that routes /api requests to one server and everything else to another." },
      { difficulty: "Hard", prompt: "Explain how a load balancer and a reverse proxy relate to each other — is a load balancer a kind of reverse proxy, or something separate?" },
    ],
    interviewQuestions: [
      { question: "What's the difference between a forward proxy and a reverse proxy?", answer: "A forward proxy sits in front of clients and forwards their outgoing requests on their behalf; a reverse proxy sits in front of servers and forwards incoming requests to whichever backend should handle them." },
      { question: "Why would you put a reverse proxy in front of multiple backend servers?", answer: "So clients only need to know one address, while the proxy handles routing requests to the correct backend — hiding the internal architecture and making it easier to change." },
      { question: "Is a load balancer a type of reverse proxy?", answer: "Effectively yes — a load balancer is a reverse proxy whose specific job is distributing traffic across multiple identical backend servers." },
      { question: "What are common reasons an organization deploys a forward proxy for its own employees?", answer: "To filter or block access to certain sites, cache frequently requested content to save bandwidth, log outbound traffic for compliance, and hide the internal network's actual IP addresses from the sites employees visit." },
      { question: "How does a reverse proxy help with SSL/TLS termination?", answer: "The proxy handles decrypting incoming HTTPS traffic (and encrypting the response) at one central point, so individual backend servers don't each need to manage certificates and TLS handshakes — simplifying certificate management and offloading that CPU cost from the application servers." },
      { question: "Why might a reverse proxy cache static content before it even reaches the application server?", answer: "Content that rarely changes (images, CSS, JS bundles) can be served directly from the proxy's cache, which is much faster than re-running application logic on the backend for the same unchanged response every time." },
      { question: "What single point of failure risk does adding a reverse proxy introduce, and how is it usually mitigated?", answer: "If there's only one reverse proxy, its failure takes down access to everything behind it, even if the backend servers are fine — this is mitigated by running multiple redundant proxy instances behind something like DNS round-robin or a floating IP." },
      { question: "How does a reverse proxy enable zero-downtime deployments?", answer: "New versions of a service can be started alongside the old ones, and the proxy can gradually shift traffic to the new instances (and stop sending traffic to old ones) without ever exposing clients to an interruption, unlike replacing a single directly-exposed server in place." },
      { question: "What's the difference between a reverse proxy and an API gateway?", answer: "A reverse proxy's core job is routing and forwarding requests to the right backend; an API gateway builds on that with additional API-specific concerns like authentication, rate limiting, request/response transformation, and aggregating multiple backend calls into one client-facing response." },
      { question: "How does a CDN relate to the concept of a reverse proxy?", answer: "A CDN is essentially a globally distributed reverse proxy — it sits in front of an origin server at many geographic edge locations, caching and serving content from whichever location is closest to the requesting client, rather than routing to a fixed set of local backends." },
      { question: "Why does a reverse proxy typically add headers like X-Forwarded-For to the requests it forwards?", answer: "Once a proxy sits in the middle, the backend server would otherwise only see the proxy's own IP address as the request's source — `X-Forwarded-For` preserves the original client's IP so the backend can still do things like logging, rate limiting, or geolocation based on the real client." },
      { question: "What problem does the X-Forwarded-For header solve?", answer: "It solves the loss of the original client's IP address once a request passes through one or more intermediary proxies — without it, the backend would only ever see the last proxy in the chain as the apparent source of every request." },
      { question: "How can a reverse proxy implement rate limiting across an entire fleet of backend servers?", answer: "Because every request passes through the proxy before reaching any backend, the proxy can track request counts per client (by IP, API key, etc.) centrally and reject or throttle requests once a limit is exceeded — without each backend server needing to separately track and coordinate the same counts." },
      { question: "Describe a scenario where a system would use both a forward proxy and a reverse proxy at once.", answer: "A company's internal clients might go through a forward proxy to reach the internet (for filtering and logging outbound traffic), while requests coming into the company's own public-facing service pass through a separate reverse proxy that routes them to the correct internal backend — the two proxies serve entirely different directions of traffic." },
      { question: "Why might a company route its clients' outbound connections through a forward proxy for security reasons?", answer: "It gives the organization a single choke point to inspect, filter, or block risky outbound connections (like requests to known-malicious domains), instead of relying on every individual machine to enforce that policy independently." },
      { question: "What's a potential downside of routing all traffic through a single reverse proxy layer?", answer: "It adds an extra network hop (and thus a small amount of latency) to every request, and if not scaled or made redundant properly, it can become a bottleneck or outage point for the entire system, even when the backends themselves are healthy." },
      { question: "How does a reverse proxy decouple clients from changes in backend infrastructure?", answer: "Clients only ever address the proxy's stable, public endpoint; backend servers can be added, removed, resized, or moved without clients needing to know or change anything, since the proxy is the only thing that needs to be updated with the new routing details." },
      { question: "Why is it important for a reverse proxy itself to be highly available?", answer: "Every request to the system passes through it, so if the proxy goes down, clients lose access to every backend behind it — its availability effectively becomes the ceiling on the availability of the entire system." },
    ],
    prerequisites: ["client-and-server"],
    relatedTopics: ["load-balancing", "api-gateway"],
    keywords: ["proxy", "reverse proxy", "forward proxy", "routing"],
  },
  {
    id: "authentication-and-sessions",
    title: "Authentication & Sessions",
    level: "beginner",
    description: "How a server remembers who you are across multiple requests, even though HTTP itself doesn't.",
    explanation: `
HTTP is stateless — the server doesn't automatically remember anything
about you between one request and the next. But most apps clearly do
remember you: you log in once and stay logged in as you click around.
That memory has to be built on top of HTTP deliberately, and there are
two common ways to do it: **sessions** (the server keeps track of who's
logged in, and gives your browser a small id to prove which session is
yours) and **tokens** (the server gives your browser a self-contained
piece of data that proves who you are, without the server needing to
store anything).
    `.trim(),
    analogy:
      "A session is like getting a wristband at a venue — the venue keeps a list of which wristband numbers were given to which paying customers, and checks your wristband against that list at each door. A token is more like getting a signed, tamper-proof ticket that itself already contains everything needed to prove it's valid — nobody needs to check a list, they just verify the ticket's signature.",
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
          { code: "Set-Cookie: sessionId=abc123", explanation: "The server creates a session record and gives the browser a small id referencing it." },
          { code: "Cookie: sessionId=abc123", explanation: "The browser automatically resends that cookie on every later request." },
          { code: 'Server looks up "abc123"', explanation: "The server checks its own storage to find out which user this session id belongs to." },
        ],
      },
    ],
    howItWorks: `
With sessions, the server stores session data (who's logged in, since
when) in memory or a database, keyed by a random session id, and gives
that id to the browser as a cookie; every later request includes the
cookie, and the server looks up the matching session. With tokens
(commonly JWTs), the server instead signs a small piece of data
containing the user's identity, so it can be verified without a lookup —
the token itself is the proof, as long as its signature checks out.
    `.trim(),
    whyItExists: `
Without some form of authentication and a session/token mechanism, a
server would have no way to distinguish one visitor from another, or
remember that you already proved who you are — every request would need
to include your full credentials again, which is both impractical and
insecure.
    `.trim(),
    whenToUse: `
Use session-based authentication when you want the server to retain full
control — able to instantly revoke access by deleting a session record.
Use token-based authentication when you want to avoid a centralized
lookup on every request, especially across multiple independent
services, at the cost of tokens being harder to revoke early.
    `.trim(),
    whenNotToUse: `
Don't build authentication from scratch for anything beyond a learning
exercise — subtle mistakes here (like weak session ids, or improperly
verifying a token's signature) are a common source of serious security
vulnerabilities; use well-established, audited libraries and frameworks
instead.
    `.trim(),
    commonMistakes: [
      "Storing session ids or tokens somewhere JavaScript can read them (making them vulnerable to theft via XSS) instead of an HttpOnly cookie.",
      "Assuming a token can be instantly revoked the way a session can — a signed token generally stays valid until it expires, unless you build extra revocation logic.",
      "Sending credentials or session identifiers over plain HTTP instead of HTTPS, exposing them to anyone on the network.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, why HTTP being stateless means a server needs a separate mechanism to 'remember' a logged-in user." },
      { difficulty: "Medium", prompt: "Describe the difference between a session id and a token, and one advantage each has over the other." },
      { difficulty: "Hard", prompt: "Explain how a service could quickly revoke a compromised session versus a compromised token, and why one is harder." },
    ],
    interviewQuestions: [
      { question: "Why can't the server just 'remember' a user across requests using HTTP alone?", answer: "HTTP is stateless by design — each request is handled independently, so remembering a user requires an explicit mechanism like a session or token layered on top." },
      { question: "What's the difference between a session and a token?", answer: "A session stores the user's state on the server, identified by an id the client holds; a token holds the user's state itself (signed, so it can be verified), without the server needing to store anything." },
      { question: "Why is a token harder to revoke early than a session?", answer: "A session can be invalidated by simply deleting its record on the server; a signed token is self-contained and remains valid until it expires, unless additional revocation tracking is built." },
      { question: "What's the difference between authentication and authorization?", answer: "Authentication answers 'who are you?' — verifying identity, typically via credentials; authorization answers 'what are you allowed to do?' — deciding what an already-identified user can access or perform." },
      { question: "What is a cookie, and how does the browser know to send it automatically on future requests?", answer: "A small piece of data the server asks the browser to store via a `Set-Cookie` response header; the browser then automatically attaches it to every subsequent request to the same domain (matching the cookie's scope) via the `Cookie` header, without the application needing to attach it manually." },
      { question: "What does the HttpOnly flag on a cookie protect against?", answer: "It prevents JavaScript running on the page from reading the cookie's value, so even if an attacker manages to inject a script (XSS), they can't steal a session id or token stored in an `HttpOnly` cookie directly." },
      { question: "What does the Secure flag on a cookie do?", answer: "It tells the browser to only ever send that cookie over HTTPS connections, preventing it from being exposed in plaintext if a request is ever made over unencrypted HTTP." },
      { question: "What is the SameSite cookie attribute, and what problem does it help prevent?", answer: "It controls whether a cookie is sent along with requests originating from a different site than the one that set it; setting it to `Strict` or `Lax` helps prevent the browser from automatically attaching a user's session cookie to requests forged by a malicious third-party site (CSRF)." },
      { question: "What is CSRF (Cross-Site Request Forgery), and how does SameSite help mitigate it?", answer: "CSRF tricks a logged-in user's browser into sending an unwanted authenticated request to a site they're logged into, by embedding that request on a malicious page — since browsers normally attach cookies automatically regardless of where a request originates. `SameSite` mitigates this by refusing to attach the cookie to requests that originate from another site." },
      { question: "What is XSS (Cross-Site Scripting), and why does it matter for deciding where to store an auth token?", answer: "XSS is an attack where malicious script gets injected into and executed within a trusted page (e.g. via an unescaped user input); it matters for token storage because anything readable by JavaScript — like `localStorage` — can be read and exfiltrated by that injected script, whereas an `HttpOnly` cookie cannot." },
      { question: "Why is storing a JWT in localStorage often discouraged compared to an HttpOnly cookie?", answer: "`localStorage` is fully readable by any JavaScript running on the page, so a successful XSS attack can steal the token directly; an `HttpOnly` cookie is invisible to JavaScript entirely, closing off that particular theft vector (though cookies bring their own CSRF considerations)." },
      { question: "What is a JWT structurally made up of?", answer: "Three base64url-encoded parts separated by dots: a header (describing the algorithm used), a payload (the claims/data, like user id and expiry), and a signature (computed over the header and payload, used to verify they haven't been tampered with)." },
      { question: "Does base64-encoding a JWT's payload make its contents secret? Why or why not?", answer: "No — base64 is just an encoding, not encryption; anyone can decode a JWT's payload and read its contents. The signature only proves the payload hasn't been altered, so a JWT should never be assumed to be confidential, and shouldn't carry sensitive data unless it's also encrypted." },
      { question: "How does a server verify that a JWT hasn't been tampered with?", answer: "It recomputes the signature over the token's header and payload using its own secret (or public key, for asymmetric signing) and checks that it matches the signature attached to the token — any change to the header or payload would produce a different signature and fail verification." },
      { question: "What's the difference between signing a JWT with a symmetric secret (HMAC) versus an asymmetric key pair (RSA/ECDSA)?", answer: "With HMAC, the same secret both signs and verifies the token, so any service that can verify a token could also forge one; with an asymmetric key pair, only the holder of the private key can sign tokens, while any number of services can safely verify using the public key without being able to create valid tokens themselves." },
      { question: "Why might a system use short-lived access tokens paired with longer-lived refresh tokens?", answer: "A short-lived access token limits how long a stolen token remains useful, while the refresh token (kept more securely and used less often) lets the client obtain new access tokens without forcing the user to log in again — balancing security against convenience." },
      { question: "What happens if a refresh token is stolen, and how do systems typically mitigate that risk?", answer: "A stolen refresh token could let an attacker mint new access tokens indefinitely; systems mitigate this with refresh token rotation (issuing a new refresh token on each use and invalidating the old one) and by detecting reuse of an already-rotated token as a signal of theft." },
      { question: "Why do session-based systems scale less trivially across multiple servers than token-based systems, and how is that usually solved?", answer: "A session lives on whichever server created it, so a later request landing on a different server wouldn't find it unless something shares that state — this is usually solved with a shared session store (like Redis) that every server can read from, or by routing a client's requests back to the same server (sticky sessions)." },
      { question: "What is a sticky session, and what problem does it cause for load balancing?", answer: "A load balancer configuration that routes all of a given client's requests to the same backend server, so that server's local, in-memory session data stays available; it undermines even load distribution and means losing that one server disproportionately affects the clients pinned to it." },
      { question: "Why is storing passwords in plain text always wrong, regardless of any other security measures in place?", answer: "If the database is ever compromised (a leak, a misconfigured backup, an insider), every user's actual password is immediately exposed — and since people reuse passwords across services, that single breach can compromise accounts on other sites too." },
      { question: "What is password hashing, and why is a slow, purpose-built algorithm like bcrypt preferred over a fast general-purpose hash like SHA-256?", answer: "Hashing stores a one-way transformation of the password instead of the password itself; bcrypt (and similar algorithms) are deliberately slow and tunable, which makes brute-forcing a huge number of guesses computationally expensive, whereas a fast hash like SHA-256 lets an attacker try billions of guesses per second on stolen hashes." },
      { question: "What is a salt, and what attack does it protect against?", answer: "A salt is random data added to a password before hashing, unique per user; it protects against precomputed rainbow-table attacks and against instantly spotting that two users share the same password, since identical passwords produce different hashes once salted." },
      { question: "Why is sending credentials over plain HTTP a serious vulnerability, even if the password is hashed before storage?", answer: "Hashing protects the password at rest in the database, but if it's transmitted over plain HTTP, anyone able to observe the network traffic (e.g. on shared Wi-Fi) can capture the plaintext password as it's sent, before it's ever hashed on the server." },
      { question: "What is multi-factor authentication (MFA), and why does it improve security beyond a strong password alone?", answer: "MFA requires proving identity with more than one independent factor (something you know, like a password, plus something you have, like a phone, or something you are, like a fingerprint) — so a stolen or guessed password alone isn't enough to gain access, since the attacker would also need the second factor." },
      { question: "What is OAuth, and what problem does it solve that a plain username/password login doesn't?", answer: "OAuth is a protocol for delegated access — it lets a user grant one application limited access to their data on another service without ever sharing their actual password with the first application, solving the problem of third-party apps needing credentials they shouldn't be trusted with." },
      { question: "What's the difference between using OAuth for delegated access and using it for 'Sign in with Google/GitHub'-style login?", answer: "Delegated access uses OAuth to grant a specific scope of permission to act on a resource (like reading a user's calendar); 'Sign in with' login repurposes the same flow purely to confirm identity (via OpenID Connect on top of OAuth), without necessarily requesting access to any other data." },
      { question: "Why is it a mistake to treat a valid JWT signature as proof that a user's access hasn't been revoked?", answer: "A valid signature only proves the token wasn't tampered with and was genuinely issued by the server — it says nothing about whether that user's access has since been revoked, since a self-contained token remains 'valid' by that check until it naturally expires, unless the system does extra work to track revocations." },
      { question: "Describe a realistic scenario where you'd choose token-based auth over session-based auth.", answer: "A system with multiple independent backend services (a microservices architecture, or a public API consumed by many different clients) benefits from tokens because any service holding the public key (or shared secret) can verify a request's identity on its own, without a shared, centralized session store every service must query." },
      { question: "Describe a realistic scenario where you'd choose session-based auth over token-based auth.", answer: "A traditional server-rendered web app with a single backend (or a small, tightly coupled set of services) benefits from sessions because it gets easy, immediate revocation (just delete the session record) and doesn't need to solve token-specific problems like revocation lists or key distribution across services it doesn't actually have." },
      { question: "Why should session ids and tokens be generated using a cryptographically secure random generator rather than something predictable?", answer: "If an id can be guessed or predicted (e.g. generated from a simple counter or a weak random source), an attacker could forge a valid session id or token for another user without ever needing to steal it, defeating the entire mechanism." },
    ],
    prerequisites: ["http", "client-and-server"],
    relatedTopics: ["http", "rest-apis"],
    keywords: ["authentication", "session", "token", "JWT", "cookie", "login"],
  },
];
