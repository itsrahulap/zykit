import type { CaseStudy } from "../../types/caseStudy";

export const urlShortenerCaseStudy: CaseStudy = {
  id: "url-shortener",
  title: "URL Shortener",
  difficulty: "Easy",
  summary:
    "Turn a long URL into a short code that redirects back to it. The classic first system design question.",
  problemStatement: `
A user pastes a long URL like
\`https://example.com/blog/2026/08/29/a-very-long-post-title-about-something\`
and gets back a short one, like \`https://sho.rt/aZ9k2\`. Anyone who visits
the short link lands on the original URL.

"Generate a short code and redirect" hides real decisions. How do you make
codes that never collide? How fast can a redirect be at scale? What happens
when the same URL is shortened twice?

It's often the first system design question people get. It's small enough
to design fully in 45 minutes, but still covers capacity estimation, data
modeling, caching, and real trade-offs.
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
    "This is a read-heavy system with tiny data, which is exactly what caching is for. Cache the few hot links behind most of the 1,200 redirects/second, and the database barely feels the read load.",
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
The system has two paths with almost nothing in common.

**Write path** (rare): a client POSTs a long URL. The server generates a
unique short code, writes \`{short_code, long_url}\` to the database, and
returns the short URL.

**Read path** (99% of traffic): a client GETs \`/{shortCode}\`. The server
looks it up and responds with an HTTP redirect to the long URL, ideally
straight from the cache without touching the database.

A load balancer fronts a pool of stateless app servers, so any server can
handle either request. The servers share a cache (e.g. Redis) in front of
the database.
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
There are three common ways to make a short code:

- **Hash the long URL** (e.g. MD5, take the first 7 characters,
  base62-encoded). The same URL always gets the same code. But truncating
  a hash means two *different* URLs can collide, so every write needs a
  "does this code exist?" check and a retry with a different slice of the
  hash.
- **Random string** (7 random base62 characters). Easier to reason about,
  but collisions are still possible, just less likely. Every write still
  needs a uniqueness check.
- **A counter, base62-encoded**, which most real systems use. A
  monotonically increasing counter (from a dedicated ID service, or
  pre-allocated ranges given to each app server) is converted to base62
  (0-9, a-z, A-Z). Counter 125 becomes a code like "cb". Uniqueness is
  *guaranteed* by construction, with no collision check. The cost: codes
  are sequential and predictable, which leaks how many URLs exist and
  their order.

Most production systems choose the counter and accept the predictability
as a minor leak.
      `.trim(),
    },
    {
      title: "Making the redirect itself fast",
      explanation: `
Reads outnumber writes 100:1, so performance is all about the read path.
The redirect handler looks up \`short_code\` and responds with a 301 or
302. To keep that fast at 1,200+ QPS:

- Put a cache (Redis or Memcached) in front of the database, keyed by
  \`short_code\`, holding the hottest links.
- The mapping is a pure key-value lookup, so a key-value store or even a
  CDN edge cache can serve most redirects without the origin server.
- Popularity follows a power law: a few links (say, a viral tweet's)
  get most of the clicks. Caches handle this well. Misses stay rare even
  with a modest cache, because the long tail of rarely-clicked links adds
  little traffic.
      `.trim(),
    },
    {
      title: "301 vs 302 redirect, and why it matters here",
      explanation: `
An HTTP 301 ("Moved Permanently") lets the browser cache the redirect and
skip your server on the next visit. A 302 ("Found" / temporary) makes the
browser ask your server every time.

301 cuts server load a lot, since repeat visitors never hit you again.
But you can't count those repeat clicks, and you can't point the link
somewhere new until browser caches expire. 302 keeps you in control of
every click and its count, but you serve every redirect yourself.
      `.trim(),
    },
    {
      title: "Handling custom aliases and expiration",
      explanation: `
A custom alias (\`/my-brand\` instead of a generated code) is a short code
the client supplies. It needs a real uniqueness check against the
database, because two users could ask for the same alias. This is the one
write that can't be collision-free by construction.

Expiration needs no background job scanning the table. Store
\`expires_at\` on each row and check it at read time (an expired link is
"not found"). An occasional cleanup job or TTL-based cache eviction
removes expired rows lazily. The read path doesn't change.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
At the estimated traffic, one well-indexed database and a modest cache can
handle this system. The real risk is a "hot key": one viral link taking a
large share of the 1,200 QPS at once.

The cache absorbs that, since the hot value is just a short string. If app
servers or the cache become the bottleneck, both scale out. Add app
servers behind the load balancer, and shard the cache (and later the
database) by hashing \`short_code\`, so each key always lands on one shard.

Click analytics writes go to a queue and are processed asynchronously, so
a spike in clicks never slows down the redirects.
  `.trim(),
  tradeOffs: [
    {
      decision: "Counter-based ID generation vs. hashing the long URL",
      explanation:
        "Choose the counter. It guarantees uniqueness with no collision check, but codes are sequential and guessable. Hashing avoids that but brings back a collision-retry loop on every write, a worse trade when writes are already the rare path.",
    },
    {
      decision: "301 (permanent) vs. 302 (temporary) redirect",
      explanation:
        "Default to 302, despite the extra load. It keeps click analytics accurate and links changeable, both requirements here. A shortener with no analytics requirement could choose 301 to cut server load.",
    },
    {
      decision: "SQL vs. NoSQL for the urls table",
      explanation:
        "Either works. The access pattern is a key-value lookup with no joins, so the choice barely matters. A key-value store (DynamoDB, Cassandra) fits slightly better and scales out more easily than hand-sharding SQL, but one well-indexed SQL table handles the estimated load too.",
    },
  ],
  interviewTips: [
    "Do the capacity estimation early and out loud. It justifies every later decision (why caching matters, why writes don't).",
    "Name the read:write ratio. It's the number that most shapes this design.",
    "Raise the collision problem before the interviewer does, and compare at least two ID-generation strategies.",
    "Mention 301 vs 302 unprompted. It signals real HTTP knowledge.",
    "Don't over-engineer. You don't need microservices, a queue for every write, or multi-region active-active on day one. Say so, and explain what growth would force them.",
  ],
  relatedTopics: ["caching", "database-replication", "sharding", "load-balancing", "consistent-hashing"],
  keywords: ["url shortener", "tinyurl", "bitly", "base62", "redirect", "system design interview"],
};
