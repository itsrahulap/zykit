import type { Topic } from "../../types/content";

export const systemDesignIntermediatePatternsTopics: Topic[] = [
  {
    id: "api-styles-graphql-grpc",
    title: "REST vs GraphQL vs gRPC",
    level: "intermediate",
    description: "Three common API styles, what each optimizes for, and when each fits.",
    explanation: `
An API style is the set of conventions a client and server agree on for asking
for data and sending changes. Three styles dominate today:

- **REST** models data as **resources** with URLs (/users/42) and uses HTTP
  methods (GET, POST, PUT, DELETE) to act on them. Responses are usually JSON.
- **GraphQL** exposes **one endpoint** and a typed schema. The client sends a
  query describing exactly which fields it wants, and gets back exactly that
  shape.
- **gRPC** is a **remote procedure call** framework. You define services and
  messages in a .proto file, generate client and server code, and call remote
  methods as if they were local functions. Messages are encoded with
  **Protocol Buffers** (a compact binary format) and sent over **HTTP/2**.

None of them is "the best". REST is the simple default for public web APIs,
GraphQL shines when many different clients need different slices of data, and
gRPC is a strong fit for fast, typed service-to-service calls.
    `.trim(),
    analogy:
      "REST is a restaurant with a fixed menu: each dish (endpoint) comes as the kitchen plates it. GraphQL is a build-your-own bowl counter: you list exactly the ingredients you want and get one bowl. gRPC is a walkie-talkie between two kitchens that share a codebook: messages are short, coded and fast, but you need the codebook to understand them.",
    examples: [
      {
        title: "The same request in three styles",
        code: `# REST: two round trips, and you get every field the server chooses
GET /users/42
GET /users/42/orders?limit=3

# GraphQL: one round trip, exactly the fields you ask for
POST /graphql
{
  user(id: 42) {
    name
    orders(last: 3) { id total }
  }
}

// gRPC: a typed method defined in a .proto file
service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc WatchOrders (WatchOrdersRequest) returns (stream Order); // server streaming
}

message GetUserRequest { int64 id = 1; }
message User {
  int64 id = 1;
  string name = 2;
}`,
        explanation:
          "REST spreads data across resource URLs. GraphQL lets the client shape one response. gRPC defines methods and messages up front; the numbers (= 1, = 2) are field tags used in the binary encoding.",
        walkthrough: [
          { code: "GET /users/42", explanation: "REST: fetch the user resource. The server decides which fields come back." },
          { code: "user(id: 42) { name orders(last: 3) { id total } }", explanation: "GraphQL: one query names exactly the fields needed, including nested orders." },
          { code: "rpc GetUser (GetUserRequest) returns (User);", explanation: "gRPC: a remote method with typed input and output, compiled into client and server code." },
          { code: "returns (stream Order)", explanation: "gRPC can stream many messages over one call, which REST and plain GraphQL queries don't do natively." },
        ],
      },
    ],
    howItWorks: `
**REST** leans on HTTP itself: methods carry meaning (GET is safe, PUT and
DELETE are idempotent), status codes report outcomes, and GET responses can be
cached by browsers, CDNs and proxies using standard headers.

**GraphQL** servers parse each query, validate it against the schema, and run
a **resolver** function per field. Because a query can nest (users, then each
user's orders, then each order's items), naive resolvers cause the N+1 query
problem; batching tools like DataLoader collect lookups into one query. Most
queries are sent as POST to a single URL, so standard HTTP caching doesn't
apply without extra work (persisted queries, client-side normalized caches).

**gRPC** compiles a .proto contract into stubs in many languages. Requests are
Protocol Buffers: binary, smaller and faster to parse than JSON, with fields
identified by number so old and new versions can coexist if you never reuse a
field number. HTTP/2 multiplexes many calls over one connection and enables
four call types: **unary**, **server streaming**, **client streaming** and
**bidirectional streaming**. Browsers can't speak native gRPC directly; they
need **gRPC-Web** plus a proxy, which is why gRPC is mostly used between
backend services.
    `.trim(),
    diagram: `
              REST               GraphQL               gRPC
Transport     HTTP/1.1 or 2      HTTP (usually POST)   HTTP/2
Payload       JSON (usually)     JSON                  Protobuf (binary)
Contract      OpenAPI (optional) Schema (required)     .proto (required)
Endpoints     many URLs          one URL               methods on services
Caching       HTTP caches work   needs extra work      app-level only
Streaming     no (use SSE/WS)    subscriptions         4 built-in modes
Browser use   native             native                needs gRPC-Web proxy
Best fit      public APIs        many varied clients   internal services
    `.trim(),
    whyItExists: `
REST became popular because it reuses the web's existing machinery: URLs,
methods, status codes and caches. As apps grew, mobile clients suffered from
**over-fetching** (getting fields they don't need) and **under-fetching**
(needing several round trips), which GraphQL was built to fix. Inside large
backends, thousands of services calling each other needed lower overhead,
strict contracts and streaming, which is what gRPC provides.
    `.trim(),
    whenToUse: `
- **REST**: public APIs, simple CRUD, anything that benefits from HTTP caching
  and from being easy to call with curl.
- **GraphQL**: a product with several clients (web, iOS, Android) that each
  need different views of the same data, or a gateway that stitches together
  many backend services.
- **gRPC**: internal service-to-service calls where latency, payload size,
  strict typing and streaming matter, especially across many languages.
    `.trim(),
    whenNotToUse: `
Don't adopt GraphQL for a small API with one client; you take on schema
design, resolver performance and query-cost limits for little gain. Don't
expose gRPC directly to browsers or third parties who expect JSON over HTTP.
Don't force REST onto workflows that are really actions or streams (for
example, live updates), where RPC or a realtime channel fits better.
    `.trim(),
    commonMistakes: [
      "Adopting GraphQL without batching (DataLoader), so one nested query fires hundreds of database queries.",
      "Leaving a public GraphQL endpoint without depth or cost limits, so one deeply nested query can overload the server.",
      "Reusing or renumbering protobuf field numbers, which silently corrupts data for clients on the old schema.",
      "Assuming gRPC works in the browser like fetch does, without planning for gRPC-Web and a proxy.",
      "Treating REST as 'JSON over HTTP' and ignoring status codes, idempotent methods and cache headers.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "For a mobile profile screen that shows a user's name, avatar and last three orders, count the REST calls you'd need versus GraphQL queries." },
      { difficulty: "Medium", prompt: "Write a .proto file for a chat service with a unary SendMessage method and a server-streaming Subscribe method. Explain how you'd add a new field later without breaking old clients." },
      { difficulty: "Hard", prompt: "Design the API layer for a company with a public developer API, a web app, two mobile apps and 40 internal microservices. Which style do you use where, and why?" },
    ],
    interviewQuestions: [
      { question: "What problem does GraphQL solve that REST struggles with?", answer: "Over-fetching and under-fetching. A REST endpoint returns a fixed shape, so clients either get unused fields or need several round trips. GraphQL lets the client ask for exactly the fields it needs, across related objects, in one request." },
      { question: "What makes gRPC faster than typical REST + JSON?", answer: "Protocol Buffers are a compact binary encoding that is smaller and cheaper to parse than JSON, and HTTP/2 multiplexes many concurrent calls over one long-lived connection with header compression. Generated stubs also remove hand-written serialization code." },
      { question: "What are gRPC's four call types?", answer: "Unary (one request, one response), server streaming (one request, a stream of responses), client streaming (a stream of requests, one response) and bidirectional streaming (both sides stream independently over one call)." },
      { question: "Why is caching harder with GraphQL than with REST?", answer: "REST GET requests have stable URLs, so browsers and CDNs can cache them with standard headers. GraphQL usually sends varied queries as POST to one URL, so HTTP caches can't key on them. Teams use persisted queries (sent as GET with a hash) or client-side normalized caches instead." },
      { question: "What is the N+1 problem in GraphQL and how is it fixed?", answer: "Resolving a list of N items, then running one more query per item for a nested field: 1 + N queries. The usual fix is a batching loader (like DataLoader) that collects all the keys requested during one tick and loads them in a single query." },
      { question: "How do you evolve a protobuf schema without breaking clients?", answer: "Add new fields with new field numbers; old readers ignore unknown fields. Never change a field's number or type, and when removing a field, mark its number (and name) as reserved so it can't be reused." },
      { question: "Can a browser call a gRPC service directly?", answer: "Not with native gRPC, because browsers don't expose the low-level HTTP/2 control (such as trailers) it needs. You use gRPC-Web, which needs a proxy (such as Envoy) or server support to translate, or expose a REST/JSON gateway instead." },
      { question: "How would you protect a public GraphQL API from expensive queries?", answer: "Limit query depth and compute a cost score per query, reject anything above a budget, rate-limit by cost rather than request count, add timeouts, and for first-party clients allow only persisted (pre-registered) queries." },
      { question: "How does versioning typically differ across the three styles?", answer: "REST often versions the URL or a header (/v2/users). GraphQL usually avoids versions: you add fields and deprecate old ones in the schema. gRPC relies on protobuf's backward-compatible field rules, with a new package or service name only for breaking changes." },
      { question: "A team wants to use gRPC everywhere, including the public API. What would you advise?", answer: "Use gRPC internally where it shines, but expose REST/JSON (or GraphQL) publicly. Third parties expect plain HTTP tools, browsers need gRPC-Web, and debugging binary payloads is harder. A gateway can translate REST to gRPC (for example, gRPC-Gateway or Envoy transcoding) so you keep one contract." },
    ],
    prerequisites: ["http", "rest-apis"],
    relatedTopics: ["rest-apis", "api-gateway", "realtime-communication", "service-mesh-and-sidecars", "microservices-vs-monolith"],
    keywords: ["graphql", "grpc", "protobuf", "protocol buffers", "http/2", "rpc", "over-fetching", "dataloader", "streaming"],
  },
  {
    id: "realtime-communication",
    title: "Realtime Communication Patterns",
    level: "intermediate",
    description: "Short polling, long polling, SSE, WebSockets and webhooks: how servers push updates.",
    explanation: `
Plain HTTP is **request-response**: the client asks, the server answers. But
many features need the server to tell someone about a change as it happens: a
new chat message, a finished payment, a live score.

There are five common ways to get "push"-like behavior:

- **Short polling**: the client asks "anything new?" every few seconds.
- **Long polling**: the client asks, and the server holds the request open
  until there's news (or a timeout), then the client asks again.
- **Server-Sent Events (SSE)**: one long-lived HTTP response that the server
  keeps writing events into. Server to client only.
- **WebSockets**: a persistent, two-way connection where either side can send
  messages at any time.
- **Webhooks**: server-to-server push. When something happens, one server
  makes an HTTP POST to a URL another server registered in advance.
    `.trim(),
    analogy:
      "Short polling is a kid asking 'are we there yet?' every minute. Long polling is asking once and the driver answering only when you arrive. SSE is a radio broadcast you tune into. A WebSocket is a phone call where both people can talk. A webhook is leaving your number so the shop calls you when your order is ready.",
    examples: [
      {
        title: "Server-Sent Events in the browser",
        code: `// Browser: built-in EventSource API, reconnects automatically
const events = new EventSource("/api/orders/123/events");

events.addEventListener("status", (event) => {
  const update = JSON.parse(event.data);
  showStatus(update.status);
});

// Server response (Content-Type: text/event-stream), written over time:
// id: 17
// event: status
// data: {"status":"shipped"}
//
// (a blank line ends each event)`,
        explanation:
          "SSE is just a long HTTP response in a simple text format. If the connection drops, the browser reconnects and sends a Last-Event-ID header so the server can resume.",
        walkthrough: [
          { code: 'new EventSource("/api/orders/123/events")', explanation: "Opens one long-lived GET request that the server keeps streaming into." },
          { code: 'events.addEventListener("status", ...)', explanation: "Runs the handler for each event the server sends with the name 'status'." },
          { code: "JSON.parse(event.data)", explanation: "SSE carries text, so structured data is usually sent as JSON." },
          { code: "id: 17", explanation: "Event ids let the browser tell the server where to resume after a reconnect." },
        ],
      },
      {
        title: "Verifying a webhook signature",
        code: `import crypto from "node:crypto";

function isValidWebhook(rawBody, signatureHeader, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  // Constant-time compare avoids leaking the signature through timing.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}`,
        explanation:
          "Anyone can POST to a public webhook URL, so receivers check an HMAC signature computed with a shared secret over the raw request body. Real providers usually also sign a timestamp to block replays.",
      },
    ],
    howItWorks: `
**Short polling** is ordinary requests on a timer. Simple, but most responses
are empty, and updates arrive up to one interval late.

**Long polling** keeps a request open on the server until data is ready or a
timeout (often 20-60 seconds) passes. The client immediately reissues the
request. Latency is low, but each waiting client ties up a connection, and
messages can be missed between requests unless the client sends a cursor.

**SSE** uses one HTTP response with Content-Type text/event-stream. It works
through most proxies, reconnects automatically, and resumes with
Last-Event-ID. It is text-only and one-way. On HTTP/1.1, browsers allow only
about six connections per domain, so many open tabs can exhaust them; HTTP/2
multiplexing removes that limit.

**WebSockets** start as an HTTP request with an Upgrade header; the server
answers 101 Switching Protocols and the TCP connection becomes a full-duplex
message channel. Servers must hold one connection per client, so scaling means
sticky routing, a pub/sub backbone to fan messages out across servers, and
handling reconnects.

**Webhooks** are plain HTTP POSTs between servers. The sender must retry on
failure (so receivers must handle duplicates), and receivers must verify
signatures and respond quickly, doing slow work asynchronously.
    `.trim(),
    diagram: `
               Direction        Latency     Server cost         Best for
Short polling  client pulls     interval    many empty reqs     rare updates, simplicity
Long polling   client pulls     low         1 held req/client   fallback when WS/SSE blocked
SSE            server -> client low         1 open conn/client  feeds, notifications, progress
WebSockets     both ways        lowest      1 open conn/client  chat, games, collaboration
Webhooks       server -> server event-driven 1 POST per event   integrations (payments, CI)

Long polling timeline:
Client ---- GET /updates?after=41 ---->  Server (holds request...)
Client <--- 200 [event 42] ------------  (event arrives)
Client ---- GET /updates?after=42 ---->  (immediately asks again)
    `.trim(),
    whyItExists: `
HTTP was designed for documents, not live updates. Polling was the first
workaround; long polling (used by early web chat) cut wasted requests; SSE and
WebSockets were standardized to give browsers proper streaming channels.
Webhooks exist because servers in different companies need to notify each
other without anyone keeping a connection open.
    `.trim(),
    whenToUse: `
- **Short polling**: data changes rarely and a delay of seconds is fine
  (checking an export job every 10 seconds).
- **Long polling**: you need near-realtime but WebSockets or SSE are blocked.
- **SSE**: one-way server updates to browsers: notifications, live dashboards,
  streaming LLM output, progress bars.
- **WebSockets**: frequent two-way messages with low latency: chat, multiplayer
  games, collaborative editors.
- **Webhooks**: telling another system about events (payment succeeded, build
  finished).
    `.trim(),
    whenNotToUse: `
Don't reach for WebSockets when the client only listens; SSE is simpler and
works with normal HTTP infrastructure. Don't poll every second for data that
changes hourly. Don't use webhooks when the receiver can't expose a public
HTTPS endpoint (for example, a browser or a device behind NAT); use polling or
a persistent connection instead.
    `.trim(),
    commonMistakes: [
      "Using WebSockets for one-way updates and then rebuilding reconnection and resume logic that SSE gives for free.",
      "Running WebSocket servers behind a load balancer without a pub/sub layer, so a message published on server A never reaches users connected to server B.",
      "Not verifying webhook signatures, letting anyone forge 'payment succeeded' events.",
      "Doing slow work inside a webhook handler, so the sender times out and retries, creating duplicates.",
      "Reconnecting all clients at once after a server restart without jittered backoff, causing a thundering herd.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "For each feature, pick a pattern and justify it: a stock ticker, a chat app, a nightly report status, a Stripe payment notification." },
      { difficulty: "Medium", prompt: "Design how a chat service with 10 WebSocket servers delivers a message from a user on server 3 to a user on server 7." },
      { difficulty: "Hard", prompt: "Design a webhook delivery system for a SaaS product: retries, ordering, signing, replay protection, and what happens when a customer's endpoint is down for a day." },
    ],
    interviewQuestions: [
      { question: "What's the difference between short polling and long polling?", answer: "Short polling sends requests on a fixed interval and usually gets empty responses. Long polling sends a request that the server holds open until there's data or a timeout, then the client reconnects. Long polling gives lower latency with fewer wasted requests." },
      { question: "When would you choose SSE over WebSockets?", answer: "When updates only flow from server to client. SSE runs over plain HTTP, works with existing proxies and auth, and has built-in reconnection with Last-Event-ID. WebSockets are worth it when the client also sends frequent messages." },
      { question: "How does a WebSocket connection get established?", answer: "The client sends an HTTP GET with Upgrade: websocket and a Sec-WebSocket-Key header. The server replies 101 Switching Protocols with a derived Sec-WebSocket-Accept, and from then on the TCP connection carries WebSocket frames in both directions." },
      { question: "What is a webhook and what must a receiver do?", answer: "An HTTP callback: when an event happens, the provider POSTs to a URL you registered. The receiver should verify the signature, respond 2xx quickly, process the work asynchronously, and deduplicate by event id because providers retry." },
      { question: "Why are WebSockets harder to scale than regular HTTP?", answer: "Each client holds a long-lived connection to one server, so servers are stateful. You need enough file descriptors and memory per connection, load balancers that support long connections, a pub/sub layer to route messages between servers, and graceful handling of reconnect storms during deploys." },
      { question: "How do you avoid missing events when a client reconnects?", answer: "Give every event a monotonically increasing id or offset, have the client send the last id it saw on reconnect (Last-Event-ID for SSE, a cursor for others), and keep a short replay buffer or log on the server to resend what was missed." },
      { question: "What limit can bite SSE on HTTP/1.1?", answer: "Browsers cap concurrent HTTP/1.1 connections per domain at about six. Each SSE stream holds one open, so several tabs can starve other requests. Serving over HTTP/2, which multiplexes streams on one connection, avoids this." },
      { question: "How would you make webhook delivery reliable as a provider?", answer: "Store each event durably, deliver from a queue with exponential backoff and jitter over hours or days, sign every payload with a timestamp, include an event id for deduplication, disable or alert on endpoints that keep failing, and offer an API to list or replay missed events." },
      { question: "A deploy restarts 50 WebSocket servers holding 2 million connections. What goes wrong and how do you mitigate it?", answer: "All clients reconnect at once and overload auth, the load balancer and the new servers (a thundering herd). Mitigate with rolling restarts that drain connections gradually, client reconnects with randomized exponential backoff, and connection admission limits on servers." },
    ],
    prerequisites: ["http", "client-and-server"],
    relatedTopics: ["websockets", "pub-sub", "load-balancing", "hot-keys-and-thundering-herd", "api-styles-graphql-grpc", "message-delivery-semantics"],
    keywords: ["polling", "long polling", "sse", "server-sent events", "eventsource", "websockets", "webhooks", "push", "realtime"],
  },
  {
    id: "cache-eviction-policies",
    title: "Cache Eviction, Write Policies and Invalidation",
    level: "intermediate",
    description: "How caches decide what to drop, how writes reach them, and how to keep them fresh.",
    explanation: `
A cache is small and fast; the data behind it is big and slow. That raises
three questions every cache design must answer:

1. **What do we throw out when the cache is full?** That's the **eviction
   policy**: LRU, LFU, FIFO, or expiry by **TTL**.
2. **How do reads and writes flow between app, cache and database?** That's
   the **caching pattern**: cache-aside, read-through, write-through,
   write-back or write-around.
3. **How do we stop serving stale data after the source changes?** That's
   **invalidation**.

Getting these right decides whether the cache actually helps (high hit rate,
fresh enough data) or quietly serves wrong answers.
    `.trim(),
    analogy:
      "Your desk holds only a few books; the library holds all of them. LRU means returning the book you haven't opened longest. LFU means returning the one you open least often. TTL means every book goes back after two weeks no matter what. Invalidation is the librarian telling you a new edition is out, so the copy on your desk is wrong.",
    examples: [
      {
        title: "An LRU cache in a few lines",
        code: `// A JS Map remembers insertion order, so the first key is the oldest.
class LruCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.entries = new Map();
  }

  get(key) {
    if (!this.entries.has(key)) return undefined;
    const value = this.entries.get(key);
    this.entries.delete(key);      // move to the "most recent" end
    this.entries.set(key, value);
    return value;
  }

  set(key, value) {
    this.entries.delete(key);
    this.entries.set(key, value);
    if (this.entries.size > this.capacity) {
      const oldestKey = this.entries.keys().next().value;
      this.entries.delete(oldestKey); // evict least recently used
    }
  }
}`,
        explanation:
          "Every access moves a key to the end, so the front is always the least recently used. Classic implementations use a hash map plus a doubly linked list for the same O(1) behavior.",
        walkthrough: [
          { code: "this.entries = new Map();", explanation: "A Map keeps keys in insertion order, which doubles as recency order." },
          { code: "this.entries.delete(key); this.entries.set(key, value);", explanation: "Re-inserting a key on access moves it to the most-recent end." },
          { code: "this.entries.keys().next().value", explanation: "The first key is the one touched longest ago." },
          { code: "this.entries.delete(oldestKey);", explanation: "When over capacity, drop that least recently used entry." },
        ],
      },
      {
        title: "Cache-aside read and write",
        code: `async function getProduct(id) {
  const cached = await cache.get("product:" + id);
  if (cached) return JSON.parse(cached);           // hit

  const product = await db.findProduct(id);        // miss: load from source
  await cache.set("product:" + id, JSON.stringify(product), { ttlSeconds: 300 });
  return product;
}

async function updateProduct(id, changes) {
  await db.updateProduct(id, changes);             // 1. write the source of truth
  await cache.delete("product:" + id);             // 2. invalidate, don't update
}`,
        explanation:
          "The app owns the logic. On writes, deleting the key (instead of writing the new value) avoids two concurrent writers leaving an older value in the cache; the TTL is a safety net for any invalidation that's missed.",
      },
    ],
    howItWorks: `
**Eviction policies**

- **LRU (least recently used)**: evict what was touched longest ago. Good
  default for workloads where recent items are likely reused.
- **LFU (least frequently used)**: evict what's accessed least often. Keeps
  long-term popular items, but needs counters that decay so yesterday's hit
  doesn't stay forever.
- **FIFO**: evict the oldest inserted item, regardless of use. Simple, usually
  a worse hit rate.
- **TTL**: each entry expires after a set time. Not really about space; it
  bounds staleness. Usually combined with LRU or LFU.

Real systems approximate: Redis samples a few keys and evicts the best
candidate instead of keeping an exact LRU list, and its default policy,
noeviction, rejects writes when memory is full, so set one explicitly
(allkeys-lru, allkeys-lfu, volatile-ttl and others).

**Read/write patterns**

- **Cache-aside (lazy loading)**: the app checks the cache, and on a miss reads
  the database and fills the cache. Most common.
- **Read-through**: the cache library itself loads from the database on a miss.
- **Write-through**: writes go to the cache and the database synchronously.
  Cache stays warm and consistent; writes are slower.
- **Write-back (write-behind)**: writes go to the cache and are flushed to the
  database later, in batches. Very fast writes, but data is lost if the cache
  dies before flushing.
- **Write-around**: writes go only to the database; the cache fills on later
  reads. Avoids filling the cache with data that's written but rarely read.

**Invalidation strategies**: TTL expiry, explicit delete on write,
event-driven invalidation (listen to database change events and delete keys),
and **versioned keys** (product:42:v7) so a new version simply uses a new key.
    `.trim(),
    diagram: `
Cache-aside read                 Write-through           Write-back
App -> Cache (miss)              App -> Cache            App -> Cache  (ack)
App -> DB                              Cache -> DB (sync)        ...later...
App -> Cache (fill)              ack after both          Cache -> DB (batch flush)

Write-around                     Invalidation on write
App -> DB                        App -> DB (update)
(cache untouched; next           App -> Cache (delete key)
 read misses and fills)          next read reloads fresh value
    `.trim(),
    whyItExists: `
Memory is limited and expensive compared to disk, so a cache can hold only a
fraction of the data. Eviction policies keep the most useful fraction. And
because the cache is a copy, every design has to choose where to trade write
speed, durability and freshness, which is what the write patterns and
invalidation strategies encode.
    `.trim(),
    whenToUse: `
- **LRU** as a default; **LFU** when a stable set of popular items should
  survive bursts of one-off reads (a scan shouldn't flush the hot set).
- **Cache-aside** for general read-heavy data; **write-through** when reads
  right after writes must hit the cache; **write-back** for very write-heavy
  data that can tolerate some loss (counters, metrics); **write-around** for
  data written once and rarely read soon after (logs, uploads).
- **Short TTLs** when you can't reliably invalidate; **explicit
  invalidation** when staleness is visible to users.
    `.trim(),
    whenNotToUse: `
Avoid write-back for data you can't afford to lose (payments, orders) unless
the cache itself is durable and replicated. Don't cache data that must be
strongly consistent on every read, such as an account balance used to approve
a withdrawal. And don't pick LFU for workloads where popularity shifts quickly
unless its counters decay.
    `.trim(),
    commonMistakes: [
      "Updating the cache on write instead of deleting it, so two racing writers can leave the older value cached indefinitely.",
      "Leaving Redis on its default noeviction policy, so writes start failing when memory fills up.",
      "Using no TTL at all, so any missed invalidation means stale data forever.",
      "Giving every key the same TTL, so many keys expire together and stampede the database.",
      "Choosing write-back for critical data without understanding that a cache crash loses unflushed writes.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "With capacity 3, trace an LRU cache through accesses A, B, C, A, D, B, E. Which key is evicted at each step?" },
      { difficulty: "Medium", prompt: "Implement an LFU cache with O(1) get and set. Explain how you break ties between keys with the same frequency." },
      { difficulty: "Hard", prompt: "A product page cache sometimes shows an old price for hours after an update. List every way that can happen with cache-aside, and design an invalidation scheme that fixes it." },
    ],
    interviewQuestions: [
      { question: "What's the difference between LRU and LFU?", answer: "LRU evicts the item accessed longest ago; LFU evicts the item accessed least often. LRU adapts quickly to changing patterns; LFU protects consistently popular items but can hold stale favorites unless frequency counts decay." },
      { question: "How do you build an LRU cache with O(1) get and put?", answer: "A hash map from key to node in a doubly linked list ordered by recency. On access, move the node to the head; on insert past capacity, remove the tail node and its map entry. Both operations are O(1)." },
      { question: "Explain cache-aside.", answer: "The application checks the cache first. On a miss it reads the database, stores the result in the cache (usually with a TTL), and returns it. On writes it updates the database and deletes the cache key. The cache holds only data that's actually requested." },
      { question: "Write-through vs write-back?", answer: "Write-through writes to the cache and database synchronously, so the cache is always current but writes are slower. Write-back acknowledges after writing the cache and flushes to the database later, giving fast writes at the risk of losing data if the cache fails before flushing." },
      { question: "When is write-around a good choice?", answer: "When data is written but unlikely to be read soon, such as logs or bulk imports. Writing only to the database keeps those writes from evicting genuinely hot entries." },
      { question: "Why delete the cache key on update instead of setting the new value?", answer: "With two concurrent writers, the cache sets can land in a different order than the database writes, leaving an older value cached. Deleting makes the next read load the current value. A small race still exists (a slow reader can refill with stale data), so keep a TTL as a backstop." },
      { question: "What is cache stampede and how do you prevent it?", answer: "Many requests miss the same key at once (often right after it expires) and all hit the database. Prevent it with request coalescing or a lock so one request refills, jittered TTLs, and serving stale data while refreshing in the background." },
      { question: "How does Redis implement LRU?", answer: "Approximately: instead of maintaining a full recency list, it samples a small number of keys (configurable with maxmemory-samples) and evicts the best candidate among them. Its LFU mode uses a small probabilistic counter that decays over time." },
      { question: "How would you invalidate a cache across many services when a row changes?", answer: "Publish change events, ideally from the database's change log via CDC so no write path is missed, and have a consumer delete the affected keys. Combine with TTLs as a safety net, and use versioned keys for objects where you can bump a version on every change." },
      { question: "Is a perfectly consistent cache possible?", answer: "Not cheaply. Without coordinating the database write and the cache update in one transaction, there are always windows where they disagree. In practice you bound staleness (TTLs, prompt invalidation) and skip the cache for reads that truly must be current." },
    ],
    prerequisites: ["caching"],
    relatedTopics: ["caching", "cdn", "hot-keys-and-thundering-herd", "consistency-models", "event-streaming"],
    keywords: ["lru", "lfu", "fifo", "ttl", "eviction", "cache-aside", "read-through", "write-through", "write-back", "write-behind", "write-around", "invalidation", "redis"],
  },
  {
    id: "message-delivery-semantics",
    title: "Message Delivery Semantics",
    level: "intermediate",
    description: "At-most-once, at-least-once and effectively-once delivery, and how to build reliable consumers.",
    explanation: `
When one service sends a message to another through a queue or broker,
something can fail at every step: the network, the broker, or the consumer
halfway through its work. **Delivery semantics** describe what you're
guaranteed when that happens:

- **At-most-once**: each message is delivered zero or one times. Failures can
  lose messages, but never duplicate them.
- **At-least-once**: each message is delivered one or more times. Nothing is
  lost, but duplicates happen.
- **Exactly-once**: each message affects the system exactly one time. True
  exactly-once delivery over an unreliable network isn't possible in general,
  so what systems really offer is **effectively-once processing**:
  at-least-once delivery plus consumers that make duplicates harmless.

Most production systems choose at-least-once and design **idempotent
consumers**.
    `.trim(),
    analogy:
      "At-most-once is dropping a postcard in the mailbox: it'll probably arrive, and if it doesn't, nobody resends it. At-least-once is a courier who keeps redelivering until you sign, even if you already signed and the receipt got lost. Effectively-once is you checking the parcel's tracking number and refusing a second copy of something you already received.",
    examples: [
      {
        title: "An idempotent consumer with deduplication",
        code: `async function handlePaymentMessage(message) {
  await db.transaction(async (tx) => {
    // The unique constraint on message_id makes a duplicate insert fail.
    const inserted = await tx.insertIgnoreDuplicate("processed_messages", {
      message_id: message.id,
    });
    if (!inserted) return; // already processed: skip side effects

    await tx.update("accounts", { id: message.accountId }, {
      balance: tx.raw("balance + ?", [message.amount]),
    });
  });

  // Acknowledge only after the work is committed.
  await message.ack();
}`,
        explanation:
          "The dedup record and the business change commit in one transaction, so either both happen or neither does. If the consumer crashes before ack, the broker redelivers, and the duplicate is skipped.",
        walkthrough: [
          { code: "db.transaction(async (tx) => {", explanation: "Groups the dedup record and the business update so they commit together." },
          { code: 'tx.insertIgnoreDuplicate("processed_messages", { message_id })', explanation: "Records that this message was handled; a unique key rejects repeats." },
          { code: "if (!inserted) return;", explanation: "A redelivered duplicate stops here without changing the balance again." },
          { code: "await message.ack();", explanation: "Ack after commit: a crash before this point means redelivery, not loss." },
        ],
      },
    ],
    howItWorks: `
**Acknowledgements decide the semantics.** A consumer receives a message,
does work, and acks it so the broker stops tracking it.

- Ack **before** processing: a crash mid-work loses the message. At-most-once.
- Ack **after** processing: a crash after the work but before the ack causes
  redelivery. At-least-once.

Brokers implement this differently. SQS hides a received message for a
**visibility timeout**; if it isn't deleted in time, it reappears. Kafka
consumers **commit offsets**; committing after processing gives at-least-once.
Producers face the same choice: retrying a send whose ack was lost can publish
a duplicate (Kafka's idempotent producer removes those per partition).

**Effectively-once** comes from making processing idempotent:

- Natural idempotency: "set status = shipped" is safe to repeat; "add $10"
  isn't.
- A **dedup table** keyed by message id, written in the same transaction as
  the side effect.
- Kafka **transactions** can atomically write outputs and commit input
  offsets, giving exactly-once for read-process-write pipelines that stay
  inside Kafka. External side effects (emails, API calls) still need
  idempotency.

**Ordering**: most systems guarantee order only within a partition (Kafka) or
message group (SQS FIFO). Retries and parallel consumers can reorder messages,
so consumers that care should check versions or sequence numbers.

**Dead-letter queues (DLQs)**: after a set number of failed attempts, a
message moves to a separate queue so one "poison" message doesn't block or
endlessly retry. Someone must monitor and replay or discard the DLQ.
    `.trim(),
    diagram: `
At-least-once (ack after work)
Broker --msg #7--> Consumer: process OK --ack--X (crash before ack)
Broker --msg #7--> Consumer: dedup table says "seen #7" -> skip -> ack

Retry and dead-letter flow
Queue --> Consumer --fail--> retry 1 --fail--> retry 2 --fail--> retry 3
                                                                   |
                                                             Dead-letter queue
                                                             (alert, inspect, replay)
    `.trim(),
    whyItExists: `
Networks and processes fail, and a sender can't tell "the message was lost"
from "the message arrived but the reply was lost". So any system must choose
between possibly losing messages and possibly duplicating them. Delivery
semantics make that choice explicit so consumers can be designed for it.
    `.trim(),
    whenToUse: `
- **At-least-once + idempotent consumers**: the default for anything that
  matters: orders, payments, emails, inventory.
- **At-most-once**: high-volume data where loss is acceptable and duplicates
  would be misleading or wasteful, such as some metrics or telemetry.
- **Broker-level exactly-once** (Kafka transactions): stream processing jobs
  that read from and write to Kafka.
- **DLQs**: any consumer that can hit messages it can't process.
    `.trim(),
    whenNotToUse: `
Don't pay for broker transactions when an idempotent consumer would do; they
add latency and complexity and still don't cover external side effects. Don't
promise global ordering across a high-throughput topic; it forces a single
partition and caps throughput. Order per key (per user, per order) is usually
what's actually needed.
    `.trim(),
    commonMistakes: [
      "Believing the broker's 'exactly-once' label covers side effects like sending email or charging a card.",
      "Acknowledging a message before the work is committed, silently turning at-least-once into at-most-once.",
      "Writing the dedup record and the side effect in separate transactions, so a crash between them breaks idempotency.",
      "Setting a visibility timeout shorter than processing time, so messages are redelivered while still being worked on.",
      "Adding a DLQ but never alerting on or draining it, so failed messages pile up unnoticed.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "For each, pick at-most-once or at-least-once: page-view analytics, password-reset emails, shipping-label creation. Explain the cost of each failure mode." },
      { difficulty: "Medium", prompt: "Make a consumer that sends a welcome email idempotent, given the email provider has no idempotency key support." },
      { difficulty: "Hard", prompt: "Design an order pipeline where events for the same order must be applied in order, while different orders are processed in parallel across 20 consumers." },
    ],
    interviewQuestions: [
      { question: "Define at-most-once, at-least-once and exactly-once.", answer: "At-most-once: delivered zero or one times, possible loss. At-least-once: delivered one or more times, possible duplicates. Exactly-once: the effect happens once. In practice that means at-least-once delivery plus idempotent or transactional processing." },
      { question: "Why is true exactly-once delivery impossible in general?", answer: "A sender can't distinguish a lost message from a lost acknowledgement. To avoid loss it must retry, which risks duplicates; to avoid duplicates it must not retry, which risks loss. Only the receiver can collapse duplicates by remembering what it has processed." },
      { question: "How does ack timing determine semantics?", answer: "Acking before processing gives at-most-once, because a crash after the ack loses the work. Acking after processing gives at-least-once, because a crash before the ack causes redelivery of work already done." },
      { question: "What makes a consumer idempotent?", answer: "Processing the same message twice has the same effect as once. Either the operation is naturally idempotent (setting a value, upserting by key) or the consumer records processed message ids and skips repeats, atomically with the side effect." },
      { question: "What is a dead-letter queue for?", answer: "Holding messages that failed processing a set number of times, so a poison message stops blocking the queue or retrying forever. It needs monitoring, and a way to inspect, fix and replay messages." },
      { question: "What ordering guarantees does Kafka give?", answer: "Order within a partition only. Messages with the same key go to the same partition, so per-key order holds as long as each partition is processed by one consumer at a time. There's no order across partitions." },
      { question: "How does an SQS visibility timeout relate to duplicates?", answer: "A received message is hidden for the visibility timeout. If the consumer doesn't delete it in time, because it crashed or was too slow, the message becomes visible and is delivered again. Set the timeout above worst-case processing time, or extend it while working." },
      { question: "What does Kafka's exactly-once support actually cover?", answer: "Idempotent producers prevent duplicate writes from retries, and transactions atomically commit output records and consumer offsets. That gives exactly-once for read-process-write within Kafka. Effects outside Kafka (a database write, an HTTP call) still need idempotency or an outbox pattern." },
      { question: "How long should you keep dedup records?", answer: "At least as long as duplicates can arrive: the broker's maximum redelivery window plus producer retry windows, often hours to days. Keep them with a TTL or partition them by time so the table doesn't grow forever." },
      { question: "Retries are reordering your per-order events. How do you fix it?", answer: "Partition by order id so one consumer handles an order sequentially, and don't skip ahead past a failing message for that key (park the key or block its partition). Also include a version or sequence number and have the consumer ignore events older than the stored version." },
    ],
    prerequisites: ["queues", "pub-sub", "idempotency"],
    relatedTopics: ["queues", "pub-sub", "idempotency", "event-streaming", "distributed-transactions", "timeouts-retries-and-backoff"],
    keywords: ["at-most-once", "at-least-once", "exactly-once", "effectively-once", "ack", "acknowledgement", "deduplication", "idempotent consumer", "dead-letter queue", "dlq", "ordering", "kafka", "sqs"],
  },
  {
    id: "timeouts-retries-and-backoff",
    title: "Timeouts, Retries and Backoff",
    level: "intermediate",
    description: "How to retry failed calls safely without turning a small outage into a big one.",
    explanation: `
Any call over a network can fail or hang. Three tools handle that:

- A **timeout** caps how long you wait for a response, so a stuck dependency
  can't hold your threads, connections and users forever.
- A **retry** tries again after a failure, which fixes many brief, transient
  errors.
- **Backoff** spaces retries out, usually doubling the wait each time
  (exponential backoff), with **jitter** (randomness) so clients don't all
  retry at the same instant.

Used carelessly, retries make outages worse: every client hammering a
struggling service multiplies its load. That's a **retry storm**. **Retry
budgets** and careful choice of which errors to retry keep them in check.
    `.trim(),
    analogy:
      "If a shop's phone line is busy, calling back every second just keeps the line jammed for everyone. Waiting a bit longer each time, at slightly random times, gives the shop room to recover. And if they said 'we don't sell that' (a permanent no), calling back won't help at all.",
    examples: [
      {
        title: "Retry with exponential backoff and full jitter",
        code: `async function callWithRetry(operation, options = {}) {
  const maxAttempts = options.maxAttempts ?? 4;
  const baseDelayMs = options.baseDelayMs ?? 100;
  const maxDelayMs = options.maxDelayMs ?? 5000;

  for (let attempt = 1; ; attempt++) {
    try {
      return await operation({ timeoutMs: 2000 });
    } catch (error) {
      if (!isRetryable(error) || attempt >= maxAttempts) throw error;

      const cap = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const delayMs = Math.random() * cap; // "full jitter"
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function isRetryable(error) {
  if (error.isTimeout || error.isConnectionError) return true;
  return [429, 502, 503, 504].includes(error.status);
}`,
        explanation:
          "Each attempt has its own timeout. The wait ceiling doubles per attempt up to a cap, and the actual wait is random below it, which spreads retries out. Only transient errors are retried.",
        walkthrough: [
          { code: "return await operation({ timeoutMs: 2000 });", explanation: "Every attempt is bounded by a timeout, so a hung call becomes a fast failure." },
          { code: "if (!isRetryable(error) || attempt >= maxAttempts) throw error;", explanation: "Give up on permanent errors immediately, and on transient ones after a few tries." },
          { code: "Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)", explanation: "Exponential growth: 200ms, 400ms, 800ms... capped at 5 seconds." },
          { code: "Math.random() * cap", explanation: "Jitter: a random wait between 0 and the cap, so clients don't retry in sync." },
        ],
      },
    ],
    howItWorks: `
**Timeouts** come in layers: connect timeout, per-attempt timeout, and an
overall **deadline** for the whole operation including retries. Set them from
measured latency (for example, a bit above the dependency's p99), not
defaults, which are often very long or infinite. Pass the remaining deadline
downstream (gRPC does this natively) so deep services stop working on requests
the caller has already abandoned.

**Which errors are retryable?**

- Usually yes: connection resets, timeouts, 502, 503, 504, and 429 (after the
  Retry-After the server sent).
- Usually no: 400, 401, 403, 404, 409, 422. The same request will fail again.
- Careful with 500 and timeouts on **non-idempotent** operations: the first
  attempt may have succeeded. Only retry if the operation is idempotent or
  carries an idempotency key.

**Exponential backoff with jitter**: without jitter, all clients that failed
at the same moment retry at the same moments, causing synchronized spikes.
"Full jitter" (a random wait between 0 and the exponential cap) spreads them
evenly.

**Retry storms and amplification**: if each layer of a 4-deep call chain
retries 3 times (4 attempts), one user request can become 4^4 = 256 calls at
the bottom. Fix it by retrying at one layer only (usually closest to the
failure or at the edge), and by using a **retry budget**: retries may add at
most a fixed fraction (say 10%) on top of normal traffic. When the budget is
spent, fail fast. Pair this with a **circuit breaker** that stops calls to a
dependency that's clearly down.
    `.trim(),
    diagram: `
Backoff with full jitter (base 100ms, cap 5s)
attempt 1 fails -> wait random(0, 200ms)
attempt 2 fails -> wait random(0, 400ms)
attempt 3 fails -> wait random(0, 800ms)
attempt 4 fails -> give up (or circuit breaker opens)

Retry amplification (4 attempts at every layer)
User -> API (x4) -> Orders (x4) -> Inventory (x4) -> DB (x4)
1 request ---------------------------------------> up to 256 DB calls
    `.trim(),
    whyItExists: `
Most network failures are brief: a dropped packet, a restarting instance, a
momentary overload. Retrying hides them from users. But failure is also
contagious: slow dependencies exhaust callers' resources, and naive retries
pile load onto services that are already struggling. Timeouts, backoff and
budgets let you get the benefit of retries without the cascade.
    `.trim(),
    whenToUse: `
Set timeouts on every network call, always. Retry idempotent operations (or
those with idempotency keys) on transient errors, with exponential backoff and
jitter. Use a retry budget or circuit breaker anywhere many clients call a
shared dependency.
    `.trim(),
    whenNotToUse: `
Don't retry validation, auth or not-found errors. Don't retry non-idempotent
writes (charging a card, sending a message) without an idempotency key. Don't
retry at every layer of a deep call chain. And don't retry when the user is
better served by a fast failure and a clear message, for example when the
overall deadline is nearly spent.
    `.trim(),
    commonMistakes: [
      "Relying on default timeouts, which in many HTTP clients are very long or unlimited.",
      "Retrying immediately in a tight loop with no backoff, hammering the struggling service.",
      "Using exponential backoff without jitter, so all clients retry in synchronized waves.",
      "Retrying at every layer of a call chain, multiplying load during an outage.",
      "Retrying a timed-out payment request that actually succeeded, charging the customer twice.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Classify each as retryable or not and explain: 503, 400, connection reset, 401, 429 with Retry-After: 30, 404." },
      { difficulty: "Medium", prompt: "A service's p99 latency is 300ms and the user-facing deadline is 2s. Choose per-attempt timeouts, retry count and backoff, and justify them." },
      { difficulty: "Hard", prompt: "Design a client library used by 200 services that prevents retry storms. Cover budgets, deadline propagation, idempotency and observability." },
    ],
    interviewQuestions: [
      { question: "Why should every network call have a timeout?", answer: "Without one, a hung dependency holds the caller's threads, connections and memory indefinitely. Requests pile up until the caller fails too. A timeout turns a hang into a fast, handleable error." },
      { question: "What is exponential backoff?", answer: "Increasing the wait between retries multiplicatively, usually doubling, up to a maximum. It gives a failing service progressively more room to recover instead of a constant stream of retries." },
      { question: "Why add jitter?", answer: "Clients that failed together would otherwise retry together, creating synchronized load spikes. Randomizing each wait spreads retries over time; full jitter picks a random value between zero and the backoff cap." },
      { question: "Which HTTP errors are typically retryable?", answer: "Transient ones: 429 (respecting Retry-After), 502, 503, 504, plus connection errors and timeouts if the operation is idempotent. Client errors like 400, 401, 403, 404 and 422 will fail the same way again." },
      { question: "What's the danger in retrying a timed-out request?", answer: "A timeout doesn't mean the server didn't do the work, only that you didn't hear back. Retrying a non-idempotent operation can apply it twice. Use idempotency keys so the server recognizes the retry." },
      { question: "What is a retry storm?", answer: "When a dependency slows down, every client retries, multiplying traffic on the already-struggling service and preventing recovery. Retries at multiple layers multiply it further." },
      { question: "What is a retry budget?", answer: "A cap on retries as a fraction of normal requests, for example retries may be at most 10% of calls in a time window. During a widespread outage the budget runs out and clients fail fast instead of multiplying load." },
      { question: "What is deadline propagation?", answer: "Passing the remaining time budget along with each request so downstream services know when the caller will give up. They can skip or abort work that can't finish in time instead of wasting resources on an abandoned request." },
      { question: "How do retries and circuit breakers work together?", answer: "Retries handle short, isolated failures. A circuit breaker tracks the failure rate and, when it's high, stops calls for a cool-down period. Retries then fail fast instead of piling on, and the breaker probes later to see if the dependency recovered." },
      { question: "In a 5-service call chain, where should retries live?", answer: "Ideally at one layer, typically the one nearest the failing dependency or at the edge, not at every hop, because attempts multiply per layer. Combine with an end-to-end deadline so retries stop when the user's request can no longer succeed." },
    ],
    prerequisites: ["http", "idempotency"],
    relatedTopics: ["circuit-breaker", "idempotency", "rate-limiting", "backpressure-and-load-shedding", "hot-keys-and-thundering-herd", "message-delivery-semantics"],
    keywords: ["timeout", "retry", "exponential backoff", "jitter", "retry budget", "retry storm", "deadline", "retryable errors", "retry-after"],
  },
  {
    id: "unique-id-generation",
    title: "Unique ID Generation",
    level: "intermediate",
    description: "Generating unique IDs across many machines: UUIDs, Snowflake, ULID and ticket servers.",
    explanation: `
Every record needs an ID. On one database, an **auto-increment** column does
the job. Once writes are spread across many servers, shards or regions, you
need IDs that are unique without every insert asking one central counter.

Common options:

- **UUID v4**: 122 random bits. Unique in practice, no coordination, but
  random order.
- **UUID v7**: starts with a millisecond timestamp, then random bits, so IDs
  sort roughly by creation time.
- **Snowflake** (from Twitter): a 64-bit integer made of a timestamp, a
  machine id and a per-machine sequence number.
- **ULID**: 128 bits, a 48-bit millisecond timestamp plus 80 random bits,
  written as 26 sortable characters.
- **Ticket servers**: a central service hands out numbers, often in blocks.

The trade-offs are size, sortability, coordination, and how much the ID leaks
(like creation time or volume).
    `.trim(),
    analogy:
      "A deli's ticket dispenser works great for one counter. With 100 counters, you either give each counter its own prefix (counter 7 hands out 7-001, 7-002...), or let everyone pick a random 30-digit number and trust that two people will never pick the same one.",
    examples: [
      {
        title: "A simplified Snowflake generator",
        code: `const CUSTOM_EPOCH_MS = 1288834974657n; // Twitter's original epoch
let lastTimestampMs = -1n;
let sequence = 0n;

function nextId(machineId /* 0..1023 */) {
  let now = BigInt(Date.now());

  if (now < lastTimestampMs) {
    throw new Error("Clock moved backwards; refusing to generate IDs");
  }
  if (now === lastTimestampMs) {
    sequence = (sequence + 1n) & 4095n;           // 12-bit sequence
    if (sequence === 0n) {                         // 4096 used this ms
      while (now <= lastTimestampMs) now = BigInt(Date.now());
    }
  } else {
    sequence = 0n;
  }
  lastTimestampMs = now;

  return ((now - CUSTOM_EPOCH_MS) << 22n)          // 41-bit timestamp
       | (BigInt(machineId) << 12n)                // 10-bit machine id
       | sequence;                                 // 12-bit sequence
}`,
        explanation:
          "Uniqueness comes from the layout: two machines differ in machine id, and two IDs from one machine in the same millisecond differ in sequence. BigInt is used because the result doesn't fit in a JS number safely.",
        walkthrough: [
          { code: "if (now < lastTimestampMs) throw ...", explanation: "If the clock jumps back, new IDs could collide with old ones, so stop (or wait) instead." },
          { code: "sequence = (sequence + 1n) & 4095n;", explanation: "Within one millisecond, a 12-bit counter allows 4096 IDs per machine." },
          { code: "while (now <= lastTimestampMs) now = ...", explanation: "If the counter wraps, wait for the next millisecond." },
          { code: "((now - CUSTOM_EPOCH_MS) << 22n) | (machineId << 12n) | sequence", explanation: "Pack time, machine and sequence into one 64-bit integer. Time is in the high bits, so IDs sort by time." },
        ],
      },
    ],
    howItWorks: `
**Auto-increment** is simple and compact, but it's one counter in one
database: a bottleneck and single point of failure for writes, awkward across
shards, and it leaks business volume (order 10,500 tells competitors how many
orders you have).

**UUID v4** needs no coordination. The chance of a collision is negligible at
any realistic scale, assuming a good random source. But 128 bits is big, and
random values inserted into a B-tree index land on random pages, causing page
splits and poor cache locality as the table grows.

**UUID v7** (standardized in RFC 9562, 2024) puts a 48-bit Unix millisecond
timestamp first, so new IDs are mostly appended to the end of the index. It
keeps the UUID format and needs no coordination. **ULID** solves the same
problem in a different encoding.

**Snowflake** layout (64 bits): 1 unused sign bit, 41 bits of milliseconds
since a custom epoch (about 69 years), 10 bits of machine id, 12 bits of
sequence. It fits in a BIGINT and sorts by time. Costs: machine ids must be
assigned uniquely (via config or a coordinator like ZooKeeper), and it
depends on clocks.

**Ticket servers**: a dedicated database hands out numbers. Flickr ran two
MySQL servers, one producing odd and one even numbers, for redundancy. A
common optimization is handing each app server a **block** (say 1,000 IDs) at
a time so most IDs need no network call.

**Sortability and clock skew**: time-based IDs are only roughly ordered
across machines, because clocks differ by milliseconds or more. Never rely on
them for strict global ordering. If a machine's clock jumps backwards (an NTP
correction), a naive generator can issue duplicates; it should wait or refuse
until time catches up.
    `.trim(),
    diagram: `
Snowflake ID (64 bits)
| 0 | 41 bits: ms since epoch | 10 bits: machine | 12 bits: sequence |
  ^ sign bit (unused)            1024 machines      4096 IDs/ms/machine

UUID v7 (128 bits)
| 48 bits: Unix ms | 4: version | 12: random | 2: variant | 62: random |

Option          Size     Sortable   Coordination        Leaks
Auto-increment  64 bit   yes        one DB              counts
UUID v4         128 bit  no         none                nothing
UUID v7 / ULID  128 bit  ~by time   none                creation time
Snowflake       64 bit   ~by time   machine-id setup    time, machine
Ticket server   64 bit   yes        central service     counts
    `.trim(),
    whyItExists: `
Distributed systems write from many places at once. Asking one central
counter for every ID adds latency and a single point of failure, while purely
random IDs hurt database performance and can't be sorted. These schemes are
different balances of uniqueness, ordering, size and independence.
    `.trim(),
    whenToUse: `
- **Auto-increment**: a single database that isn't going to be sharded soon,
  for internal IDs that aren't exposed publicly.
- **UUID v7 or ULID**: a good modern default for distributed inserts into
  B-tree indexed tables.
- **UUID v4**: when IDs must reveal nothing, including creation time.
- **Snowflake**: very high throughput where a compact 64-bit, time-sortable
  integer matters (feeds, messages, events).
- **Ticket server with blocks**: when you need dense, mostly sequential
  numbers (invoice numbers) across services.
    `.trim(),
    whenNotToUse: `
Don't expose sequential IDs in public URLs if guessing neighbors is a risk;
always enforce authorization anyway. Don't use UUID v4 as the clustered
primary key of a huge, write-heavy table if you can use a time-ordered ID.
Don't use time-based IDs as a strict ordering of events across machines.
    `.trim(),
    commonMistakes: [
      "Treating time-based IDs from different machines as a precise global order, ignoring clock skew.",
      "Ignoring backward clock jumps in a Snowflake-style generator, producing duplicate IDs.",
      "Assigning the same machine id to two instances (for example, cloned containers), causing collisions.",
      "Sending 64-bit IDs to JavaScript as JSON numbers, which lose precision above 2^53; send them as strings.",
      "Relying on unguessable IDs as the only access control instead of checking permissions.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List three problems with using a single database's auto-increment for IDs in a sharded system." },
      { difficulty: "Medium", prompt: "How many IDs per second can a Snowflake deployment with 1024 machines generate at most? When does the 41-bit timestamp run out if the epoch is set to today?" },
      { difficulty: "Hard", prompt: "Design ID generation for a multi-region chat app where message IDs must be unique, roughly time-ordered within a conversation, and generated without cross-region calls." },
    ],
    interviewQuestions: [
      { question: "Why doesn't auto-increment work well in distributed systems?", answer: "It relies on one counter in one database, so every insert depends on that node: a bottleneck and single point of failure. Separate shards would produce overlapping values, and sequential IDs leak volume and are easy to enumerate." },
      { question: "What's the downside of UUID v4 as a primary key?", answer: "It's 128 bits (larger indexes), and it's random, so inserts land on random B-tree pages, causing page splits, fragmentation and poor cache locality. Time-ordered IDs like UUID v7 append near the end of the index instead." },
      { question: "What's the difference between UUID v4 and v7?", answer: "v4 is almost entirely random (122 random bits). v7 starts with a 48-bit Unix millisecond timestamp followed by random bits, so values sort roughly by creation time while still needing no coordination." },
      { question: "Describe the Snowflake ID layout.", answer: "64 bits: 1 unused sign bit, 41 bits of milliseconds since a custom epoch (about 69 years), 10 bits of machine id (1024 machines), and 12 bits of sequence (4096 IDs per millisecond per machine)." },
      { question: "What happens if the clock goes backwards on a Snowflake generator?", answer: "It could generate a timestamp it already used, and with the sequence reset, duplicate IDs. Generators detect this and either wait until the clock passes the last timestamp or refuse to generate and raise an error." },
      { question: "What is a ULID?", answer: "A 128-bit ID with a 48-bit millisecond timestamp and 80 random bits, encoded as 26 characters in Crockford Base32. It sorts lexicographically by time and needs no coordination." },
      { question: "What is a ticket server, and how do you avoid it being a bottleneck?", answer: "A central service (often a database) that hands out increasing numbers. To scale it, hand out blocks of IDs to each client so most IDs are generated locally, and run more than one server with interleaved ranges (Flickr used odd/even) for availability." },
      { question: "Are time-sortable IDs globally ordered?", answer: "Only roughly. Each machine's clock differs, so an ID from machine A can be larger than a later one from machine B. They're great for index locality and approximate ordering, not for strict causal order." },
      { question: "Why might you avoid exposing time-based IDs publicly?", answer: "They reveal when something was created, and Snowflake-style IDs also reveal the machine and per-millisecond volume. If that's sensitive, use random IDs externally (or a separate public ID) and keep the sortable ID internal." },
      { question: "Your frontend shows wrong IDs that differ in the last few digits. Why?", answer: "64-bit integer IDs were sent as JSON numbers, and JavaScript numbers are doubles that represent integers exactly only up to 2^53 - 1. Larger IDs get rounded. Serialize them as strings." },
    ],
    prerequisites: ["databases", "sharding"],
    relatedTopics: ["sharding", "databases", "storage-engines", "consensus-and-leader-election", "multi-region-and-disaster-recovery"],
    keywords: ["uuid", "uuid v4", "uuid v7", "snowflake", "ulid", "auto-increment", "ticket server", "id generation", "clock skew", "sortable ids"],
  },
  {
    id: "search-and-inverted-index",
    title: "Search and the Inverted Index",
    level: "intermediate",
    description: "How full-text search engines find and rank documents fast, and how to keep them in sync.",
    explanation: `
A database is great at "find the row with id 42" or "orders where status =
shipped". It's bad at "find products whose description mentions wireless
noise-cancelling headphones", especially with typos, plurals and ranking by
relevance. A LIKE '%headphones%' query has to scan every row.

Search engines solve this with an **inverted index**: instead of mapping each
document to its words, they map each **word to the list of documents** that
contain it. Finding documents for a query becomes a few fast lookups.

Then they **rank** results using scoring formulas like **TF-IDF** or **BM25**,
which favor documents where query words appear often, and words that are rare
across the collection.

Systems like Elasticsearch and OpenSearch (built on the Lucene library) wrap
this in a distributed service. Usually they're a **secondary** store, kept in
sync with the main database.
    `.trim(),
    analogy:
      "An inverted index is the index at the back of a textbook. Instead of reading every page to find 'photosynthesis', you look up the word and get the page numbers directly.",
    examples: [
      {
        title: "Building a tiny inverted index",
        code: `const documents = {
  1: "Wireless headphones with noise cancelling",
  2: "Wired headphones for studio use",
  3: "Wireless charger",
};

function tokenize(text) {
  return text.toLowerCase().split(/\\W+/).filter(Boolean);
}

const invertedIndex = new Map(); // term -> Set of document ids
for (const [id, text] of Object.entries(documents)) {
  for (const term of tokenize(text)) {
    if (!invertedIndex.has(term)) invertedIndex.set(term, new Set());
    invertedIndex.get(term).add(Number(id));
  }
}

// Query "wireless headphones": intersect the posting lists (AND)
const wireless = invertedIndex.get("wireless");   // {1, 3}
const headphones = invertedIndex.get("headphones"); // {1, 2}
const matches = [...wireless].filter((id) => headphones.has(id)); // [1]`,
        explanation:
          "Each term maps to a posting list of documents. A multi-word query is a set intersection (AND) or union (OR) of small lists, never a scan of all documents.",
        walkthrough: [
          { code: "text.toLowerCase().split(/\\W+/)", explanation: "Tokenization: lowercase and split text into terms. Real analyzers also handle stemming, stop words and synonyms." },
          { code: "invertedIndex.get(term).add(Number(id))", explanation: "Add this document to the term's posting list." },
          { code: 'invertedIndex.get("wireless")', explanation: "A lookup returns every document containing the term, without scanning text." },
          { code: "[...wireless].filter((id) => headphones.has(id))", explanation: "Intersecting posting lists finds documents with both terms." },
        ],
      },
    ],
    howItWorks: `
**1. Analysis (tokenization).** Text is run through an **analyzer**: split
into tokens, lowercased, and optionally stemmed ("running" -> "run"), with stop
words removed and synonyms added. The **same analyzer** must run on queries,
or "Running" in a query won't match "run" in the index.

**2. Inverted index.** For each term, store a **posting list**: the document
ids containing it, often with term frequency and positions (for phrase
queries). Lists are sorted and compressed so intersections are fast.

**3. Ranking.**
- **TF-IDF**: term frequency (how often the term appears in this document)
  times inverse document frequency (rarer terms across the collection count
  more). "the" is everywhere and worth little; "noise-cancelling" is rare and
  worth a lot.
- **BM25**, the default in Lucene-based engines, refines this: repeated terms
  give diminishing returns (saturation), and scores are normalized by document
  length so long documents don't win just by being long.

**4. Distributed architecture (Elasticsearch-style).** An index is split into
**shards**, each a self-contained Lucene index, with **replica** shards for
availability and read throughput. A query goes to a coordinating node, fans
out to one copy of every shard, each shard returns its top results, and the
coordinator merges them (then fetches the full documents). Writes become
searchable after a periodic **refresh** (1 second by default), so search is
**near-real-time**. Lucene writes immutable **segments** and merges them in
the background; deletes are marked and cleaned up during merges.

**5. Keeping the index in sync.** The database stays the source of truth.
Writing to both the database and the search engine from app code (**dual
writes**) drifts when one write fails. Better: **change data capture (CDC)**,
where a tool such as Debezium reads the
database's replication log and streams changes through a queue such as Kafka
to an indexer. Or use the **outbox pattern**. Keep a way to **reindex** from
scratch, since mappings and analyzers change.
    `.trim(),
    diagram: `
Inverted index
term          posting list (doc ids)
"wireless" -> [1, 3]
"headphones" -> [1, 2]
"charger"  -> [3]

Sync and query path
App --write--> Primary DB --replication log--> CDC (e.g. Debezium) --> Kafka --> Indexer
                                                                                  |
User --search--> Search API --> Coordinator node --> Shard 1 (top 10) -----------+
                                       |          --> Shard 2 (top 10)           |
                                       |          --> Shard 3 (top 10)      index writes
                                       <-- merge to global top 10, fetch docs
    `.trim(),
    whyItExists: `
Users expect search that's fast, forgiving of word forms and typos, and
ranked by relevance. Relational indexes (B-trees) match exact values or
prefixes, not words inside text, and have no notion of relevance. Inverted
indexes and scoring functions were built precisely for this.
    `.trim(),
    whenToUse: `
Use a search engine for full-text search over product catalogs, documents,
logs, help articles or messages; for faceted filtering ("brand: Sony, price
under $200") combined with text; and for autocomplete and fuzzy matching.
    `.trim(),
    whenNotToUse: `
Don't use a search engine as your primary database: it's eventually
consistent with your writes and not built for transactions. For small datasets
or simple needs, your database's built-in full-text search (PostgreSQL
tsvector, MySQL FULLTEXT) may be enough and avoids running a second system.
For exact lookups by key, a normal index is simpler and faster.
    `.trim(),
    commonMistakes: [
      "Writing to the database and the search index separately in app code, so the two silently drift apart on partial failures.",
      "Using different analyzers at index time and query time, so obvious matches are missed.",
      "Choosing a shard count without planning; in Elasticsearch the primary shard count is fixed at index creation, and changing it means reindexing (or the split/shrink APIs).",
      "Expecting a document to be searchable immediately after writing it, ignoring the refresh interval.",
      "Using deep pagination (page 10,000) with from/size, which forces every shard to collect and sort huge result sets.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Build the inverted index by hand for three short sentences, then answer the query 'quick AND fox'." },
      { difficulty: "Medium", prompt: "Explain why BM25 ranks a short product title containing 'headphones' once above a 5,000-word review containing it three times." },
      { difficulty: "Hard", prompt: "Design search for an e-commerce site with 50 million products: indexing pipeline, sync from PostgreSQL, shard sizing, reindexing with zero downtime, and handling of price updates every few seconds." },
    ],
    interviewQuestions: [
      { question: "What is an inverted index?", answer: "A map from each term to the list of documents (and often positions) containing it. Queries look up terms and combine their posting lists instead of scanning every document." },
      { question: "Why is LIKE '%word%' slow in a relational database?", answer: "A leading wildcard can't use a B-tree index, which is ordered by the value's prefix, so the database scans every row. It also has no stemming, typo tolerance or relevance ranking." },
      { question: "What does tokenization or analysis do?", answer: "Converts raw text into searchable terms: splitting into tokens, lowercasing, removing stop words, stemming and adding synonyms. Queries must use the same analysis as indexing so terms match." },
      { question: "Explain TF-IDF in one sentence.", answer: "A term scores higher in a document the more often it appears there (term frequency) and the rarer it is across all documents (inverse document frequency)." },
      { question: "How does BM25 improve on TF-IDF?", answer: "It saturates term frequency, so the tenth occurrence adds much less than the first, and normalizes by document length relative to the average, so long documents don't win just by containing more words." },
      { question: "How does a distributed search query execute?", answer: "A coordinating node sends the query to one copy (primary or replica) of every shard. Each shard returns its top-k ids and scores, the coordinator merges them into a global top-k, then fetches the full documents for just those results." },
      { question: "Why is Elasticsearch called near-real-time?", answer: "New writes go to an in-memory buffer and become searchable only when a refresh creates a new segment, every second by default. So there's a short delay between indexing and visibility." },
      { question: "How do you keep a search index in sync with the primary database?", answer: "Prefer change data capture: stream the database's change log (for example, with Debezium into Kafka) to an indexer, so every committed change is captured in order. Or use a transactional outbox. Avoid dual writes from app code, which drift when one side fails." },
      { question: "How do you change an index's mapping without downtime?", answer: "Create a new index with the new mapping, backfill it from the source of truth while also applying live changes, then atomically switch an alias from the old index to the new one, and delete the old index later." },
      { question: "Why is deep pagination expensive and what's the alternative?", answer: "To serve results 10,000-10,010, every shard must find and sort its top 10,010, and the coordinator merges all of them. Use cursor-style pagination (search_after with a sort key) or a point-in-time view instead of large offsets." },
    ],
    prerequisites: ["databases"],
    relatedTopics: ["databases", "sharding", "database-replication", "event-streaming", "storage-engines", "bloom-filters-and-probabilistic-structures"],
    keywords: ["search", "full-text search", "inverted index", "posting list", "tokenization", "analyzer", "tf-idf", "bm25", "elasticsearch", "opensearch", "lucene", "cdc", "debezium"],
  },
  {
    id: "service-discovery",
    title: "Service Discovery",
    level: "intermediate",
    description: "How services find healthy instances of each other when IPs change constantly.",
    explanation: `
In a modern backend, services run as many instances that come and go:
autoscaling adds them, deploys replace them, crashes remove them. Their IP
addresses change all the time. Hard-coding "orders service is at 10.0.3.17"
doesn't work.

**Service discovery** answers "where are the healthy instances of service X
right now?" It has three parts:

- A **service registry**: a database of available instances and their
  addresses (Consul, etcd, ZooKeeper, Eureka, or Kubernetes' own API).
- **Registration**: instances (or the platform) add themselves when they start
  and are removed when they stop or fail.
- **Health checks**: so unhealthy instances are taken out of rotation.

There are two styles: **client-side discovery**, where the caller queries the
registry and picks an instance, and **server-side discovery**, where the
caller talks to a stable address (a load balancer or proxy) that does the
lookup for it.
    `.trim(),
    analogy:
      "Service discovery is a hotel's front desk. Guests change rooms all the time, so instead of memorizing room numbers you ask the desk 'where's Ms. Lee?' Client-side discovery is getting the room number and walking there yourself; server-side discovery is the desk transferring your call.",
    examples: [
      {
        title: "Kubernetes: a stable DNS name for changing pods",
        code: `apiVersion: v1
kind: Service
metadata:
  name: orders
  namespace: shop
spec:
  selector:
    app: orders          # any pod with this label is a backend
  ports:
    - port: 80
      targetPort: 8080
---
# Other pods call it by name; DNS resolves to the Service's virtual IP,
# and traffic is spread across Ready pods matching the selector:
#   http://orders.shop.svc.cluster.local
#   http://orders            (from inside the same namespace)`,
        explanation:
          "Kubernetes is a built-in registry. The Service gets a stable name and virtual IP, and only pods passing their readiness probe receive traffic. This is server-side discovery from the caller's point of view.",
        walkthrough: [
          { code: "kind: Service", explanation: "Declares a stable network identity in front of a changing set of pods." },
          { code: "selector: app: orders", explanation: "Membership is dynamic: any running pod with this label is included." },
          { code: "targetPort: 8080", explanation: "Requests to port 80 on the Service are forwarded to port 8080 on a pod." },
          { code: "orders.shop.svc.cluster.local", explanation: "The cluster DNS name callers use instead of any pod IP." },
        ],
      },
      {
        title: "Client-side discovery (pseudo-code)",
        code: `async function callOrders(path) {
  // Registry returns only instances passing health checks.
  const instances = await registry.getHealthyInstances("orders"); // cached, refreshed via watch
  if (instances.length === 0) throw new Error("No healthy orders instances");

  const instance = pickRoundRobin(instances); // client does the load balancing
  return http.get("http://" + instance.host + ":" + instance.port + path);
}`,
        explanation:
          "The caller asks the registry (for example, Consul) and balances load itself. No extra network hop, but every client needs this logic, in every language.",
      },
    ],
    howItWorks: `
**Registration** happens in one of two ways:

- **Self-registration**: the instance calls the registry on startup and sends
  heartbeats; if they stop, its entry expires.
- **Third-party registration**: the platform (Kubernetes, a Consul agent,
  ECS) watches instances and registers them. Application code stays unaware.

**Health checks** keep the registry honest. A registry or agent probes an
HTTP endpoint, TCP port or script, or expects heartbeats. Kubernetes separates
**liveness** probes (restart the container if it fails) from **readiness**
probes (stop sending traffic until it passes). Readiness should reflect
whether the instance can serve now; liveness should only fail if a restart
would actually help.

**Client-side discovery**: the client queries the registry (usually caching
results and watching for changes) and load-balances itself. Fewer hops and
smarter balancing, but discovery logic must exist in every client library.
Netflix's Eureka with the Ribbon client is the classic example.

**Server-side discovery**: the client calls a stable address; a load balancer,
proxy or the platform resolves instances. Kubernetes Services, AWS load
balancers and service meshes work this way. Clients stay simple; you add a hop
and a component to operate.

**DNS-based discovery** (Consul's DNS interface, Kubernetes DNS) is universal
because every language can resolve names. But DNS answers are cached (by TTL,
and sometimes by runtimes for longer than the TTL), so changes propagate
slowly, and DNS has no notion of load or health beyond what the server
filters.

**Registries need strong consistency**, so Consul and etcd use the Raft
consensus algorithm across 3 or 5 servers; etcd is also where Kubernetes
stores its cluster state.
    `.trim(),
    diagram: `
Client-side discovery                   Server-side discovery

Client --1. lookup "orders"--> Registry   Client --request--> Load balancer / proxy
Client <--[10.0.1.4, 10.0.2.9]--          (stable address)        |
Client --2. request--> 10.0.2.9                       lookup ---> Registry
                                                         |
                                          LB --forward--> 10.0.2.9

Registration and health
Instance --register + heartbeat--> Registry <--probe /health-- Health checker
                                     (Raft cluster: 3 or 5 nodes)
    `.trim(),
    whyItExists: `
Static configuration breaks as soon as instances become ephemeral. Without
discovery, every scale-up, deploy or crash would need someone to update
config files, and traffic would be sent to dead instances in the meantime.
    `.trim(),
    whenToUse: `
Any system with more than a handful of services, autoscaling, or frequent
deploys needs some form of discovery. On Kubernetes, use its built-in Services
and DNS first. Outside Kubernetes, or across clusters and VMs, a registry like
Consul fits. Choose client-side discovery when you need smart client load
balancing and control every client; server-side when clients are diverse or
should stay simple.
    `.trim(),
    whenNotToUse: `
A small system with a few long-lived servers can use a load balancer with a
fixed DNS name. Don't run a separate Consul cluster inside Kubernetes just for
discovery the platform already provides, unless you need cross-cluster or
cross-platform discovery.
    `.trim(),
    commonMistakes: [
      "Making the readiness or liveness check depend on downstream services, so one database blip marks every instance unhealthy at once.",
      "Treating liveness and readiness as the same check, causing restart loops for instances that were only temporarily busy.",
      "Ignoring client-side DNS caching, so callers keep using IPs of instances that no longer exist.",
      "Running a registry as a single node, making discovery itself a single point of failure.",
      "Not draining connections on shutdown, so in-flight requests fail during every deploy before the registry catches up.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain the difference between a Kubernetes liveness probe and a readiness probe, with an example where only one should fail." },
      { difficulty: "Medium", prompt: "Compare client-side and server-side discovery for a company with services in Go, Java, Python and Node.js. Which would you choose and why?" },
      { difficulty: "Hard", prompt: "Design discovery for services spread across two Kubernetes clusters and a fleet of legacy VMs, including how health is checked and how failover works." },
    ],
    interviewQuestions: [
      { question: "What problem does service discovery solve?", answer: "Finding the current network locations of healthy instances of a service when instances are created, moved and destroyed dynamically, so callers don't depend on hard-coded addresses." },
      { question: "Client-side vs server-side discovery?", answer: "Client-side: the caller queries the registry and chooses an instance itself. Fewer hops and smarter balancing, but logic in every client. Server-side: the caller hits a stable load balancer or proxy that resolves and routes. Simpler clients, at the cost of an extra hop and component." },
      { question: "What is a service registry, and give examples?", answer: "A database of available service instances and their addresses, usually with health status. Examples: Consul, etcd, ZooKeeper, Netflix Eureka, and the Kubernetes API (Endpoints/EndpointSlices)." },
      { question: "Self-registration vs third-party registration?", answer: "With self-registration, each instance registers and heartbeats itself. With third-party registration, a platform or agent watches instances and registers them, so application code stays unaware of the registry." },
      { question: "How does service discovery work in Kubernetes?", answer: "A Service selects pods by label and gets a stable virtual IP and a DNS name like name.namespace.svc.cluster.local. The control plane tracks Ready pods in EndpointSlices, and kube-proxy (or a CNI equivalent) routes traffic to them. Headless Services return pod IPs directly via DNS." },
      { question: "What's the difference between liveness and readiness probes?", answer: "Liveness asks 'is this process stuck and in need of a restart?' Readiness asks 'should this instance receive traffic right now?' A starting or temporarily overloaded instance should fail readiness, not liveness." },
      { question: "What are the downsides of DNS-based discovery?", answer: "Caching: clients and runtimes may hold stale records past the TTL, so traffic keeps going to dead instances. DNS also doesn't carry load information, and clients often pin to one resolved IP for long-lived connections." },
      { question: "Why do Consul and etcd use consensus?", answer: "The registry must give a consistent view and survive node failures. Raft replicates the data across a majority of servers, so a 3-node cluster tolerates 1 failure and a 5-node cluster tolerates 2." },
      { question: "Why shouldn't a health check call the database?", answer: "If the database has a brief issue, every instance fails its check at once and gets pulled from rotation (or restarted), turning a partial degradation into a full outage. Health checks should mostly reflect the instance itself; handle dependency failures with timeouts and circuit breakers." },
      { question: "How does a service mesh change discovery?", answer: "A sidecar proxy next to each instance gets endpoint lists from the mesh's control plane and does load balancing, retries and mTLS. The application calls a simple name; discovery becomes client-side in the proxy but invisible to app code." },
    ],
    prerequisites: ["load-balancing", "microservices-vs-monolith"],
    relatedTopics: ["load-balancing", "service-mesh-and-sidecars", "dns", "api-gateway", "consensus-and-leader-election", "gossip-and-failure-detection"],
    keywords: ["service discovery", "service registry", "consul", "etcd", "zookeeper", "eureka", "kubernetes dns", "health check", "liveness", "readiness", "client-side discovery", "server-side discovery"],
  },
  {
    id: "deployment-strategies",
    title: "Deployment Strategies",
    level: "intermediate",
    description: "Rolling, blue-green, canary, feature flags and safe database migrations.",
    explanation: `
Shipping new code is one of the most common causes of outages. A
**deployment strategy** decides how new versions replace old ones so that
users see no downtime and a bad release can be caught and reversed quickly.

- **Rolling**: replace instances a few at a time.
- **Blue-green**: run the new version as a complete second environment, then
  switch all traffic at once.
- **Canary**: send a small slice of traffic to the new version, watch
  metrics, then grow it gradually.
- **Feature flags**: ship code turned off, and enable it at runtime for chosen
  users, separating **deploy** from **release**.
- **Dark launches**: run new code paths on real traffic without showing the
  results to users.

Databases need extra care, because code can be rolled back in seconds but
data changes often can't. The **expand/contract** pattern makes schema changes
safe for zero-downtime deploys.
    `.trim(),
    analogy:
      "A rolling deploy is renovating a hotel one floor at a time while guests stay. Blue-green is building an identical hotel next door and moving everyone over at once, keeping the old one ready. A canary is letting a few guests try the new wing first and watching for complaints.",
    examples: [
      {
        title: "Rolling update settings in Kubernetes",
        code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: checkout
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2         # up to 12 pods may exist during the rollout
      maxUnavailable: 0   # never drop below 10 ready pods
  template:
    spec:
      containers:
        - name: checkout
          image: registry.example.com/checkout:1.8.0
          readinessProbe:
            httpGet: { path: /ready, port: 8080 }`,
        explanation:
          "Kubernetes starts new pods, waits for readiness, then removes old ones, a couple at a time. Old and new versions serve traffic together during the rollout, so they must be compatible.",
        walkthrough: [
          { code: "type: RollingUpdate", explanation: "Replace pods gradually instead of all at once." },
          { code: "maxSurge: 2", explanation: "Allow two extra pods above the desired count while new ones start." },
          { code: "maxUnavailable: 0", explanation: "Keep full serving capacity throughout the rollout." },
          { code: "readinessProbe", explanation: "A new pod only gets traffic, and the rollout only proceeds, once it reports ready." },
        ],
      },
      {
        title: "Expand/contract: renaming a column safely",
        code: `-- Goal: rename users.fullname -> users.display_name with zero downtime

-- 1. EXPAND (deploy A): add the new column; old code ignores it
ALTER TABLE users ADD COLUMN display_name TEXT;

-- 2. Deploy code that WRITES BOTH columns, still reads fullname
-- 3. Backfill existing rows in small batches
UPDATE users SET display_name = fullname
WHERE display_name IS NULL AND id BETWEEN 1 AND 10000;   -- repeat per batch

-- 4. Deploy code that READS display_name (still writes both)
-- 5. Deploy code that stops writing fullname

-- 6. CONTRACT (only after no running code uses it)
ALTER TABLE users DROP COLUMN fullname;`,
        explanation:
          "Every step is backward compatible with the version running before it, so any single deploy can be rolled back. The destructive step happens last, once nothing depends on the old column.",
      },
    ],
    howItWorks: `
**Rolling** needs no extra infrastructure beyond some spare capacity, but old
and new versions run side by side, and rolling back is another rolling deploy.

**Blue-green** keeps two full environments. "Green" gets the new version and is
tested; then the router or DNS switches traffic from "blue". Rollback is
switching back, which is fast. Costs: double capacity during the switch, and
both versions must work with the same database.

**Canary** routes a small percentage (1%, then 5%, 25%, 100%) to the new
version, comparing error rates, latency and business metrics against the
baseline. Automated canary analysis can halt and roll back without a human.
Needs traffic-splitting (load balancer weights or a service mesh) and good
metrics.

**Feature flags** wrap new behavior in a runtime check. Code deploys dark, and
the flag turns it on for staff, a percentage of users, or a region. If
something breaks, you flip the flag off instead of redeploying. Flags are
technical debt: remove them once a feature is fully launched.

**Dark launches** (or shadow traffic) send real requests to the new code path
but discard or only log its results, testing performance and correctness
under real load without user impact. Watch out for side effects: a shadowed
"send email" call must not actually send.

**Rollbacks** must be fast and rehearsed. They're only safe if the previous
version still works with the current data, which is why schema changes follow
**expand/contract** (also called parallel change): add new structures, migrate
and dual-write, switch reads, then remove the old structures in a later
release.
    `.trim(),
    diagram: `
Rolling:     [v1 v1 v1 v1] -> [v2 v1 v1 v1] -> [v2 v2 v1 v1] -> [v2 v2 v2 v2]

Blue-green:  Router --100%--> Blue (v1)        Router --100%--> Green (v2)
                              Green (v2) idle   =>               Blue (v1) standby

Canary:      Router --95%--> v1 fleet
                    --5%---> v2 canary   (compare errors/latency; grow or roll back)

Expand/contract timeline
 add column -> write both -> backfill -> read new -> stop writing old -> drop old
 |<------------ every step compatible with the previous deploy ------------>|
    `.trim(),
    whyItExists: `
Big-bang deploys with downtime windows don't fit services that must always be
up and ship many times a day. Most incidents follow a change, so strategies
that limit how many users see a bad change, and how long it takes to undo it,
directly reduce the impact of mistakes.
    `.trim(),
    whenToUse: `
- **Rolling**: the default for stateless services with backward-compatible
  changes.
- **Blue-green**: when you need instant cutover and instant rollback, and can
  afford double capacity briefly.
- **Canary**: high-traffic, high-risk services where you have good metrics to
  compare.
- **Feature flags**: risky features, gradual rollouts to user segments,
  experiments, and kill switches.
- **Expand/contract**: any schema change on a database used by live code.
    `.trim(),
    whenNotToUse: `
Canaries are weak on very low-traffic services: 5% of a few requests per
minute won't give a meaningful signal. Blue-green doesn't save you from
incompatible database changes, because both colors share the data. Feature
flags are overkill for trivial changes and harmful when left in code for
years.
    `.trim(),
    commonMistakes: [
      "Running a destructive migration (drop or rename a column) in the same release as the code change, making rollback impossible.",
      "Assuming old and new versions never run together; during rolling or canary deploys they always do.",
      "Running a canary without comparing it against a baseline, so a doubled error rate goes unnoticed.",
      "Leaving feature flags in the code long after launch, creating untested combinations and dead branches.",
      "Shadowing traffic to code with side effects, sending real emails or charges from the 'dark' path.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Compare rolling and blue-green deploys on rollback speed, infrastructure cost and version overlap." },
      { difficulty: "Medium", prompt: "Plan a zero-downtime migration that splits a single 'address' text column into street, city and postal_code columns, listing every deploy step." },
      { difficulty: "Hard", prompt: "Design an automated canary pipeline: which metrics you compare, how you decide statistically to proceed or roll back, and how it handles low-traffic hours." },
    ],
    interviewQuestions: [
      { question: "What's a rolling deployment?", answer: "Replacing instances of the old version with the new one in small batches, waiting for each batch to become healthy before continuing. No extra environment is needed, but both versions serve traffic during the rollout." },
      { question: "Blue-green vs canary?", answer: "Blue-green switches all traffic from the old environment to a fully deployed new one at once, with instant switch-back. Canary shifts traffic gradually, starting with a small percentage, and watches metrics to limit how many users a bad version affects." },
      { question: "What's the difference between deploying and releasing?", answer: "Deploying puts new code into production; releasing exposes the behavior to users. Feature flags separate them, so code can be deployed off and turned on later, for some users, without another deploy." },
      { question: "What is a dark launch?", answer: "Running a new code path in production on real traffic without users seeing its output, for example shadowing requests to a new service and comparing results. It tests performance and correctness safely, as long as side effects are suppressed." },
      { question: "Why must old and new versions be compatible during a deploy?", answer: "Rolling and canary deploys run both at once, and rollbacks bring the old version back. Both must read and write the same data and API formats, or requests fail depending on which instance handles them." },
      { question: "Explain expand/contract migrations.", answer: "Make schema changes in backward-compatible steps: expand (add new columns/tables), dual-write, backfill, switch reads, stop writing old, then contract (remove old structures) in a later release. Each step is safe to roll back." },
      { question: "What metrics would you watch during a canary?", answer: "Error rate and latency percentiles versus the baseline, saturation (CPU, memory), and business metrics like checkout success or sign-ups, since some bugs return 200 but do the wrong thing." },
      { question: "What are the risks of feature flags?", answer: "Combinatorial complexity (many flags make untested combinations), stale flags as tech debt, flag-service dependency on the request path, and inconsistent behavior if flag evaluation differs between services. Mitigate by removing flags after launch and caching evaluations with safe defaults." },
      { question: "Why can't blue-green alone make a schema change safe?", answer: "Both environments share the database. If green's migration drops or renames something blue needs, switching back to blue breaks. You still need backward-compatible, expand/contract migrations." },
      { question: "A deploy is at 30% canary and errors spike. Walk through the response.", answer: "Stop the rollout and shift traffic back to the stable version (automatically, ideally). Confirm the metrics recover. Check whether the canary wrote incompatible data that needs repair, then investigate from logs and traces before trying again." },
    ],
    prerequisites: ["load-balancing", "databases"],
    relatedTopics: ["load-balancing", "monitoring-and-observability", "service-mesh-and-sidecars", "stateless-vs-stateful-services", "availability-and-slas", "multi-region-and-disaster-recovery"],
    keywords: ["deployment", "rolling deploy", "blue-green", "canary", "feature flags", "dark launch", "shadow traffic", "rollback", "expand contract", "parallel change", "zero downtime", "migration"],
  },
  {
    id: "security-in-system-design",
    title: "Security in System Design",
    level: "intermediate",
    description: "Authentication, authorization, OAuth/OIDC, JWTs, TLS, encryption, secrets and common attacks.",
    explanation: `
Security in system design is about deciding, at the architecture level, who
can do what, how data is protected, and where attackers can get in.

Key building blocks:

- **Authentication (authN)**: proving who someone is (password, passkey,
  SSO).
- **Authorization (authZ)**: deciding what that identity may do (roles,
  permissions, ownership checks).
- **OAuth 2.0**: a framework for granting an app limited access to resources
  without sharing a password. **OpenID Connect (OIDC)** adds a standard
  identity layer on top for login.
- **Tokens** like **JWTs** carry signed claims so services can verify a caller
  without a database lookup.
- **TLS** encrypts data in transit; **mTLS** also authenticates the client.
  **Encryption at rest** protects stored data.
- **Secrets management** keeps keys and passwords out of code.
- **Least privilege**: every user, service and key gets only the access it
  needs.
    `.trim(),
    analogy:
      "Authentication is showing your ID at a hotel's front desk. Authorization is your key card opening your room and the gym, but not other rooms. An OAuth access token is a valet key: it lets someone drive your car but not open the trunk, and it can be revoked without changing your house keys.",
    examples: [
      {
        title: "Verifying a JWT and checking authorization",
        code: `import { jwtVerify, createRemoteJWKSet } from "jose";

const issuerKeys = createRemoteJWKSet(new URL("https://auth.example.com/.well-known/jwks.json"));

async function handleDeleteInvoice(request) {
  const token = request.headers.authorization?.replace("Bearer ", "");
  if (!token) return { status: 401 };

  // authN: signature, expiry, issuer and audience are all checked.
  const { payload } = await jwtVerify(token, issuerKeys, {
    issuer: "https://auth.example.com",
    audience: "billing-api",
    algorithms: ["RS256"],          // never accept "none" or unexpected algorithms
  });

  // authZ: the token says who you are; we still check what you may do.
  const invoice = await db.findInvoice(request.params.id);
  if (!invoice) return { status: 404 };
  if (invoice.accountId !== payload.account_id) return { status: 403 };

  await db.deleteInvoice(invoice.id);
  return { status: 204 };
}`,
        explanation:
          "Verifying the token proves identity. Checking that this invoice belongs to the caller's account is authorization; skipping it is the classic broken-object-level-authorization bug.",
        walkthrough: [
          { code: "if (!token) return { status: 401 };", explanation: "No credentials means unauthenticated: 401." },
          { code: "jwtVerify(token, issuerKeys, { issuer, audience, algorithms })", explanation: "Check the signature with the issuer's public keys, plus expiry, issuer, intended audience and allowed algorithm." },
          { code: "invoice.accountId !== payload.account_id", explanation: "Authorization: a valid user may still not own this resource." },
          { code: "return { status: 403 };", explanation: "Authenticated but not allowed: 403." },
        ],
      },
      {
        title: "OAuth 2.0 Authorization Code flow with PKCE (simplified)",
        code: `1. App creates random code_verifier, sends SHA-256 hash as code_challenge
   GET https://auth.example.com/authorize?response_type=code
       &client_id=app123&redirect_uri=https://app.example.com/callback
       &scope=openid%20profile&state=xyz&code_challenge=...&code_challenge_method=S256

2. User logs in and consents at the authorization server
3. Browser redirected to https://app.example.com/callback?code=AUTH_CODE&state=xyz
4. App checks state, then exchanges the code (back channel):
   POST /token  grant_type=authorization_code&code=AUTH_CODE&code_verifier=...
5. Response: access_token (+ refresh_token, + id_token with OIDC)`,
        explanation:
          "The short-lived code is useless without the code_verifier only the app knows, so an intercepted code can't be redeemed. The state parameter protects against CSRF on the callback.",
      },
    ],
    howItWorks: `
**OAuth 2.0 flows (grants)**

- **Authorization Code + PKCE**: for web apps, SPAs and mobile apps acting on
  behalf of a user. The recommended default. The older Implicit flow is
  deprecated.
- **Client Credentials**: service-to-service, no user involved.
- **Device Authorization**: TVs and CLIs without a convenient browser.
- **Refresh tokens**: exchange for new short-lived access tokens without
  re-login.

**OIDC** adds an **ID token** (a JWT describing the authenticated user), a
userinfo endpoint and standard discovery. OAuth alone is about access, not
login.

**JWT trade-offs**: a JWT is signed (not encrypted by default), so anyone can
read its claims. Services verify it locally, which scales well. But it can't
be revoked before it expires without extra machinery (a denylist or checking
a session store), so keep access tokens short-lived (minutes) and use refresh
tokens. Pin the expected algorithm and validate exp, iss and aud. Server-side
sessions with an opaque ID are easier to revoke and are often the better
choice for a single web app.

**TLS and mTLS**: TLS encrypts traffic and authenticates the server by
certificate. **mTLS** makes both sides present certificates, which is common
for service-to-service traffic in zero-trust networks and service meshes.

**Encryption at rest**: disk or database encryption protects against stolen
media or snapshots. **Envelope encryption** is standard: data is encrypted
with a data key, and the data key is encrypted with a master key held in a
KMS or HSM, so rotating or revoking the master key doesn't require
re-encrypting everything.

**Secrets management**: store secrets in a vault or cloud secrets manager,
inject at runtime, rotate regularly, prefer short-lived dynamic credentials,
and never commit them to git or bake them into images.

**Least privilege and defense in depth**: scoped IAM roles per service,
network segmentation, separate credentials per environment, and audit logs.

**Common attack surfaces**

- **Injection** (SQL, command, template): untrusted input interpreted as code.
  Use parameterized queries and avoid shelling out with user input.
- **SSRF**: the server is tricked into fetching an attacker-chosen URL, such
  as internal services or the cloud metadata endpoint (169.254.169.254) to
  steal credentials. Allowlist destinations, block private address ranges
  (after DNS resolution), and use IMDSv2 on AWS.
- **DDoS**: floods of traffic. Absorb at the edge (CDN, anycast, cloud DDoS
  protection), rate-limit, and autoscale with caps.
- **Broken authorization**: the most common API flaw; check ownership on every
  object access.
    `.trim(),
    diagram: `
Request path with security controls
Client --TLS--> CDN / WAF / DDoS protection --> API gateway (authN: verify token, rate limit)
                                                   |
                                                   v
                                      Service A --mTLS--> Service B   (authZ in each service)
                                         |                    |
                                  Secrets manager       Database (encrypted at rest,
                                  (short-lived creds)    least-privilege DB user)

Envelope encryption
plaintext --(data key)--> ciphertext        data key --(KMS master key)--> encrypted data key
store: ciphertext + encrypted data key       master key never leaves the KMS
    `.trim(),
    whyItExists: `
Every networked system is attacked constantly and automatically. Security
retrofitted after launch is expensive and leaky; decisions like where tokens
are verified, how services authenticate each other and where secrets live are
architectural, and hard to change later.
    `.trim(),
    whenToUse: `
Always. Specifically: OIDC for user login via an identity provider; OAuth
Authorization Code + PKCE for apps acting for users; Client Credentials or
mTLS for service-to-service; TLS everywhere, including internal traffic;
envelope encryption for sensitive data at rest; a secrets manager from the
first deploy.
    `.trim(),
    whenNotToUse: `
Don't build your own crypto, password hashing or token format; use vetted
libraries and standard protocols. Don't use JWTs as long-lived sessions you
need to revoke instantly; server-side sessions fit better. Don't use OAuth
just to log users into your own single app if a simple, secure session login
does the job.
    `.trim(),
    commonMistakes: [
      "Confusing authentication with authorization: verifying the token but never checking that the user owns the resource.",
      "Storing sensitive data in JWT claims, forgetting that JWTs are readable by anyone (signed, not encrypted).",
      "Accepting whatever algorithm the JWT header claims, including 'none', instead of pinning the expected one.",
      "Committing secrets to git or baking them into container images.",
      "Fetching user-supplied URLs server-side without SSRF protections, exposing internal services and cloud metadata.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "For each, say whether it's authN or authZ: logging in with a passkey, checking an admin role, verifying a JWT signature, ensuring a user can only view their own orders." },
      { difficulty: "Medium", prompt: "Design token handling for a SPA and its API: which OAuth flow, where tokens are stored, token lifetimes, and how logout and revocation work." },
      { difficulty: "Hard", prompt: "Threat-model a 'fetch a preview image from this URL' feature. List the SSRF vectors (including redirects and DNS rebinding) and design the defenses." },
    ],
    interviewQuestions: [
      { question: "What's the difference between authentication and authorization?", answer: "Authentication verifies who the caller is. Authorization decides what that authenticated caller is allowed to do. A request can be authenticated (no 401) and still forbidden (403)." },
      { question: "What's the difference between OAuth 2.0 and OpenID Connect?", answer: "OAuth 2.0 is for delegated authorization: getting an access token to call an API. OIDC is an identity layer on top that adds an ID token and standard claims so the app learns who the user is, i.e. login." },
      { question: "Which OAuth flow should a SPA or mobile app use, and why PKCE?", answer: "Authorization Code with PKCE. Public clients can't keep a client secret, so PKCE binds the authorization code to a random verifier only the app holds; an intercepted code can't be exchanged without it. The Implicit flow is deprecated." },
      { question: "What are the pros and cons of JWTs?", answer: "Pros: self-contained, verifiable locally without a database call, good for distributed services. Cons: hard to revoke before expiry, claims are readable, tokens can grow large, and misconfigured validation (algorithm, audience) is a common vulnerability. Keep them short-lived." },
      { question: "How do you revoke a JWT?", answer: "You can't make an issued JWT invalid by itself. Options: short expiry plus refresh tokens that you can revoke server-side, a denylist of token ids (jti) checked on each request, or rotating signing keys for mass revocation." },
      { question: "What is mTLS and when is it used?", answer: "Mutual TLS: both client and server present and verify certificates, so each side authenticates the other and traffic is encrypted. It's common for service-to-service communication, often automated by a service mesh." },
      { question: "What is envelope encryption?", answer: "Encrypting data with a data encryption key, then encrypting that key with a master key held in a KMS or HSM. The master key never leaves the KMS, and rotating it only requires re-encrypting the small data keys." },
      { question: "What is SSRF and how do you prevent it?", answer: "Server-Side Request Forgery: tricking a server into making requests to attacker-chosen destinations, such as internal admin APIs or cloud metadata endpoints. Prevent it with destination allowlists, blocking private and link-local IPs after DNS resolution (re-checking on redirects), network egress controls, and IMDSv2." },
      { question: "How do you design for DDoS resilience?", answer: "Absorb volumetric attacks at the edge with a CDN or cloud DDoS service and anycast, filter with a WAF, rate-limit per client and per endpoint, cache aggressively, and protect expensive endpoints. Autoscale, but with limits, so an attack doesn't become a huge bill." },
      { question: "What does least privilege look like for a microservice?", answer: "Its own identity and credentials, an IAM role allowing only the specific actions and resources it needs, a database user restricted to its own tables, network policies allowing only required callers, and short-lived credentials from a secrets manager." },
    ],
    prerequisites: ["authentication-and-sessions", "http"],
    relatedTopics: ["authentication-and-sessions", "api-gateway", "rate-limiting", "service-mesh-and-sidecars", "cdn", "proxy-and-reverse-proxy"],
    keywords: ["security", "authentication", "authorization", "authn", "authz", "oauth", "oidc", "openid connect", "pkce", "jwt", "tls", "mtls", "encryption at rest", "envelope encryption", "kms", "secrets management", "least privilege", "sql injection", "ssrf", "ddos"],
  },
];
