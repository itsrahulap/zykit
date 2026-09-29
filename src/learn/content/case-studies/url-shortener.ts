import type { CaseStudy } from "../../types/caseStudy";

export const urlShortenerCaseStudy: CaseStudy = {
  id: "url-shortener",
  title: "URL Shortener",
  difficulty: "Easy",
  summary:
    "Turn a long URL into a short code that redirects back to it — the classic first system design interview question.",
  problemStatement: `
Someone pastes a long URL like
\`https://example.com/blog/2026/08/29/a-very-long-post-title-about-something\`
into your service, and gets back something short, like \`https://sho.rt/aZ9k2\`.
Later, anyone who visits that short link should land on the original long
URL. That's the whole product from a user's point of view — but "generate a
short code and redirect" hides a surprising number of real decisions: how do
you generate codes that don't collide, how fast can a redirect happen at
scale, and what happens when the same URL is shortened twice?

This is usually the first system design question anyone gets asked, because
it's small enough to fully design in 45 minutes but still touches
capacity estimation, data modeling, caching, and a couple of genuine
trade-offs — the same skills bigger designs need.
  `.trim(),
  requirements: {
    functional: [
      "Given a long URL, generate a unique short code and return a short URL built from it.",
      "Given a short URL, redirect the visitor to the original long URL.",
      "Optionally let a user pick a custom alias instead of an auto-generated code.",
      "Optionally let a user set an expiration date after which the short link stops working.",
      "Track basic analytics: how many times each short link was visited.",
    ],
    nonFunctional: [
      "Redirects must be very low latency — every extra millisecond is felt by every link click.",
      "The system is heavily read-skewed: far more redirects happen than new links get created.",
      "High availability for redirects matters more than strong consistency — a slightly stale click count is fine, a broken redirect is not.",
      "Short codes must not collide: two different long URLs must never resolve from the same code.",
    ],
  },
  capacityEstimation: [
    {
      label: "New URLs shortened per day",
      value: "~1 million",
      note: "A reasonable assumption for a moderately popular service — stated as an assumption up front, not derived from anything.",
    },
    {
      label: "Read:write ratio",
      value: "100:1",
      note: "Link shortening happens once; a popular link gets clicked far more than once. This ratio is what pushes the design toward aggressive caching on the read path.",
    },
    {
      label: "Redirects per day",
      value: "~100 million",
      note: "1 million writes/day * 100:1 ratio.",
    },
    {
      label: "Redirects per second (average)",
      value: "~1,200 QPS",
      note: "100 million / 86,400 seconds in a day, rounded.",
    },
    {
      label: "Storage growth per year",
      value: "~150 GB/year",
      note: "1M URLs/day * 365 days * ~400 bytes/row (long URL + short code + metadata) ≈ 146 GB — small enough that storage itself is never the bottleneck; read throughput is.",
    },
  ],
  capacityNotes:
    "The numbers all point the same direction: this is a read-heavy system where the data itself is tiny. That combination is exactly what caching is built for — cache the small number of hot links that account for most of the 1,200 redirects/second, and the origin database barely feels the read load at all.",
  apiDesign: [
    { method: "POST", path: "/api/v1/shorten", description: "Body: { longUrl, customAlias?, expiresAt? }. Returns the short URL." },
    { method: "GET", path: "/{shortCode}", description: "Looks up shortCode and responds with an HTTP redirect to the long URL." },
    { method: "GET", path: "/api/v1/urls/{shortCode}/stats", description: "Returns click count and creation date for a short code." },
    { method: "DELETE", path: "/api/v1/urls/{shortCode}", description: "Deactivates a short link before its natural expiration." },
  ],
  dataModel: `
A single table carries almost the whole system:

- **urls**: \`short_code\` (primary key, e.g. "aZ9k2"), \`long_url\`, \`created_at\`,
  \`expires_at\` (nullable), \`user_id\` (nullable, for who created it).
- **click_events** (optional, for analytics): \`short_code\`, \`timestamp\`,
  \`referrer\`, \`user_agent\` — written asynchronously so logging clicks never
  slows down the redirect itself.

Notice what's *not* here: no foreign keys tying \`urls\` to anything else,
no joins needed to serve a redirect. A redirect is a single lookup by
primary key, which is exactly what makes this workload so cache-friendly.
  `.trim(),
  highLevelDesign: `
Two paths through the system, and they have almost nothing in common:

**Write path** (rare): a client POSTs a long URL. The server generates a
unique short code, writes \`{short_code, long_url}\` to the database, and
returns the short URL.

**Read path** (99% of traffic): a client GETs \`/{shortCode}\`. The server
looks up \`shortCode\`, and if found, responds with an HTTP redirect to the
long URL — ideally without ever touching the database, because the answer
was already sitting in a cache.

A load balancer sits in front of a pool of stateless application servers,
so any server can handle either kind of request; the servers share a cache
layer (e.g. Redis) in front of the database, plus the database itself.
  `.trim(),
  highLevelDiagram: `
                      ┌───────────────┐
   Client  ────────▶  │ Load Balancer │
                      └───────┬───────┘
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
            ┌─────────┐ ┌─────────┐ ┌─────────┐
            │  App    │ │  App    │ │  App    │   (stateless,
            │ Server  │ │ Server  │ │ Server  │    horizontally scaled)
            └────┬────┘ └────┬────┘ └────┬────┘
                 │            │            │
                 └────────────┼────────────┘
                               ▼
                       ┌───────────────┐
        cache hit ◀──  │  Cache (Redis) │
                       └───────┬───────┘
                               │ cache miss
                               ▼
                       ┌───────────────┐
                       │   Database     │
                       │ (short_code ->│
                       │   long_url)    │
                       └───────────────┘
  `,
  deepDives: [
    {
      title: "Generating short codes without collisions",
      explanation: `
There are three common ways to turn a long URL into a short code, and they
trade off differently:

- **Hash the long URL** (e.g. MD5, then take the first 7 characters,
  base62-encoded). Simple, and the same long URL always produces the same
  code — but truncating a hash means two *different* URLs can collide on
  the same short prefix, so every write still needs a "does this code
  already exist?" check, and a retry-with-a-different-slice-of-the-hash
  loop on collision.
- **Random string generation** (pick 7 random base62 characters). Simpler
  to reason about, but has the same collision problem as truncated hashing
  — just less likely, not impossible — and still needs a uniqueness check
  per write.
- **A counter, base62-encoded** — the approach most real systems actually
  use. A single monotonically increasing counter (e.g. from a dedicated ID
  generator service, or pre-allocated ranges handed out to each app server)
  is converted to base62 (0-9, a-z, A-Z). Counter 125 becomes a short code
  like "cb". This *guarantees* uniqueness by construction — no collision
  check needed at all — at the cost of short codes being predictable and
  sequential, which leaks how many URLs exist and in what order they were
  created.

Most production systems pick counter-based generation for the guaranteed
uniqueness and skip the collision-retry loop entirely, accepting the
predictability as a minor, acceptable leak.
      `.trim(),
    },
    {
      title: "Making the redirect itself fast",
      explanation: `
Because reads outnumber writes 100:1, the entire performance story of this
system is about the read path. The redirect handler does one thing: look up
\`short_code\` and respond with a 301 or 302. To make that lookup fast at
1,200+ QPS:

- Put a cache (Redis or Memcached) in front of the database, keyed by
  \`short_code\`, holding the hottest links.
- Because the mapping is nearly a pure key-value lookup with no relational
  structure, a key-value store or even a CDN edge cache can serve most
  redirects without the origin server being involved at all.
- Popularity follows a power-law distribution — a small fraction of links
  (a viral tweet's link, say) account for a large fraction of the clicks —
  which is exactly the pattern a cache is good at absorbing: cache misses
  stay rare even with a modest cache size, because the "long tail" of
  rarely-clicked links contributes little total traffic.
      `.trim(),
    },
    {
      title: "301 vs 302 redirect, and why it matters here",
      explanation: `
An HTTP 301 ("Moved Permanently") tells the visitor's browser it's safe to
cache the redirect and skip your server entirely on the next visit to that
same short link. A 302 ("Found" / temporary) tells the browser to check
with your server every single time.

That single status code is a real trade-off: 301 reduces load on your
servers dramatically (repeat visitors never hit you again for that link),
but it also means you lose the ability to count those cached-away repeat
clicks in your analytics, and you can't redirect a link somewhere new later
without waiting for browser caches to expire. 302 keeps you in full control
of every click and its accounting, at the cost of serving every single
redirect yourself, forever.
      `.trim(),
    },
    {
      title: "Handling custom aliases and expiration",
      explanation: `
A custom alias (a user asking for \`/my-brand\` instead of an auto-generated
code) is just a short code supplied by the client instead of generated by
the server — but now a uniqueness check against the database genuinely is
required, since two different users could ask for the same alias. This is
the one write-path operation that can't be made collision-free by
construction the way counter-based generation can.

Expiration is handled without a background job scanning the whole table:
store \`expires_at\` alongside each row, check it at read time (an expired
link is treated as "not found"), and let an occasional cleanup job or
TTL-based cache eviction reclaim expired rows lazily rather than on a strict
schedule — nothing about the read path needs to change to support this.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
At the traffic levels estimated above, a single well-indexed database and a
modest cache tier can genuinely handle this system — the real bottleneck
this design has to defend against is a "hot key": one link going viral and
receiving a disproportionate share of the 1,200 QPS all at once.

A cache absorbs that automatically as long as the hot key's value fits in
cache, which it always does here (it's just a short string). If the app
servers or the cache itself become the bottleneck instead of the database,
both are stateless/shardable: add more app server instances behind the load
balancer, and shard the cache (and, eventually, the database) by hashing
\`short_code\`, so any given key deterministically lands on one shard and
the system scales horizontally rather than needing a bigger single machine.
For click analytics specifically, writes are moved off the hot path
entirely — pushed onto a queue and processed asynchronously — so a spike in
clicks never risks slowing down the redirect that produced them.
  `.trim(),
  tradeOffs: [
    {
      decision: "Counter-based ID generation vs. hashing the long URL",
      explanation:
        "Counter-based generation was chosen: it guarantees uniqueness with no collision-check loop on every write, at the cost of short codes being sequential and therefore predictable/guessable. Hashing avoids that predictability but reintroduces a collision-retry loop on every single write — a worse trade for a system whose writes are already the rare, non-bottleneck path.",
    },
    {
      decision: "301 (permanent) vs. 302 (temporary) redirect",
      explanation:
        "302 was chosen for the default case, despite the extra server load, because it keeps click analytics accurate and keeps every link changeable after creation — both explicit product requirements here. A link-shortening product with no analytics requirement would reasonably choose 301 instead to minimize server load.",
    },
    {
      decision: "SQL vs. NoSQL for the urls table",
      explanation:
        "Either works, because the access pattern is a pure key-value lookup with no joins — this is one of the rare cases where the choice barely matters. A key-value store (DynamoDB, Cassandra) is a slightly more natural fit and scales horizontally with less operational effort than sharding a relational database by hand, but a single well-indexed SQL table comfortably handles the estimated load too.",
    },
  ],
  interviewTips: [
    "Do the capacity estimation early and out loud — it's what justifies every later decision (why caching matters, why writes aren't a concern).",
    "Name the read:write ratio explicitly; it's the single number that most shapes this design.",
    "Bring up the collision problem before the interviewer does, and compare at least two ID-generation strategies.",
    "Mention 301 vs 302 unprompted — it's a small detail that signals real HTTP knowledge.",
    "Don't over-engineer: this system does not need microservices, a message queue for every write, or multi-region active-active from day one. Say so, and explain what growth would actually force those additions.",
  ],
  relatedTopics: ["caching", "database-replication", "sharding", "load-balancing", "consistent-hashing"],
  keywords: ["url shortener", "tinyurl", "bitly", "base62", "redirect", "system design interview"],
};
