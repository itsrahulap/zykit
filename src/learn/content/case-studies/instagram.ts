import type { CaseStudy } from "../../types/caseStudy";

export const instagramCaseStudy: CaseStudy = {
  id: "instagram",
  title: "Instagram",
  difficulty: "Hard",
  summary:
    "Design a photo-sharing network where users post images, follow others, and see a feed of posts from people they follow.",
  problemStatement: `
A user opens the app and scrolls a feed of photos and videos from accounts
they follow, roughly newest first. Their own posts should show up in
followers' feeds soon after. They can like, comment, and follow or unfollow
accounts at any time.

Two things make this hard at scale, not just a CRUD app with an image
field:

- **The read side.** "Show me the newest posts from everyone I follow"
  means joining across a follower graph that can have tens of millions of
  edges for a popular account. And opening the app must never feel slow.
- **The write side.** Photos and videos are large blobs. They must be
  stored durably, resized into several resolutions, and served wherever
  the viewer is. A relational database is bad at all of this.

The real design work is how to build a feed cheaply for a billion users,
and how to store and deliver media cheaply and fast. Likes, comments, and
follows are simple data modeling once those are solved.
  `.trim(),
  requirements: {
    functional: [
      "A user can upload a photo or short video, optionally with a caption, and it becomes visible to their followers.",
      "A user can follow and unfollow other users.",
      "A user can view a home feed: posts from accounts they follow, ordered roughly by recency (or ranked relevance).",
      "A user can like and comment on a post.",
      "A user can view another user's profile and their grid of past posts.",
      "The system supports celebrity/high-follower accounts (tens of millions of followers) without falling over.",
    ],
    nonFunctional: [
      "Feed reads must be fast — sub-second, since they happen constantly and are the core loop of the app.",
      "The system is extremely read-heavy: feed views vastly outnumber posts created.",
      "High availability matters more than strong consistency: a like count that's a few seconds stale, or a post that takes a moment to reach every follower's feed, is acceptable.",
      "Media storage and delivery must scale to billions of images/videos and serve them with low latency worldwide.",
      "The follower graph is highly skewed — most users have a handful of followers, a tiny number have tens of millions.",
    ],
  },
  capacityEstimation: [
    {
      label: "Daily active users",
      value: "~500 million",
      note: "A reasonable order-of-magnitude assumption for a large-scale photo-sharing app, stated up front.",
    },
    {
      label: "Posts created per day",
      value: "~50 million",
      note: "Assume each active user posts roughly once every 10 days on average: 500M / 10.",
    },
    {
      label: "Feed reads per day",
      value: "~5 billion",
      note: "Assume each active user opens/refreshes their feed ~10 times a day: 500M * 10.",
    },
    {
      label: "Read:write ratio",
      value: "~100:1",
      note: "5 billion feed reads vs. 50 million posts — the same order of magnitude as most social feed products, and the number that most shapes this design toward caching and precomputed feeds.",
    },
    {
      label: "Media storage growth per year",
      value: "~18 PB/year",
      note: "50M posts/day * 365 days * ~1 MB average (mix of compressed photos and short video thumbnails) ≈ 18 PB/year — this is the number that rules out storing media in a regular database.",
    },
    {
      label: "Feed fan-out writes per post (average)",
      value: "~150 per post",
      note: "Assume an average of ~150 followers per account; a fan-out-on-write design would write this post into ~150 feed inboxes. Celebrity accounts blow this average up by orders of magnitude, which is exactly the case the design has to special-case.",
    },
  ],
  capacityNotes:
    "Two numbers dominate: a 100:1 read:write ratio on the feed, and a follower distribution so skewed that the average fan-out (~150) means nothing for the accounts that matter (some have 50 million followers). The first pushes toward precomputing feeds. The second means precomputing for every account is a trap, so celebrity accounts need a different strategy.",
  apiDesign: [
    { method: "POST", path: "/api/v1/posts", description: "Body: multipart image/video + caption. Uploads media, creates a post, and triggers feed fan-out." },
    { method: "GET", path: "/api/v1/feed", description: "Returns the caller's home feed: a page of posts from followed accounts, newest-first or ranked." },
    { method: "POST", path: "/api/v1/users/{userId}/follow", description: "Follow a user; unfollow via DELETE on the same path." },
    { method: "GET", path: "/api/v1/users/{userId}/posts", description: "Returns a user's profile grid of past posts, paginated." },
    { method: "POST", path: "/api/v1/posts/{postId}/like", description: "Like a post (idempotent — liking twice has no additional effect)." },
    { method: "POST", path: "/api/v1/posts/{postId}/comments", description: "Body: { text }. Adds a comment to a post." },
    { method: "GET", path: "/api/v1/posts/{postId}", description: "Returns a single post's metadata, media URLs, like count, and recent comments." },
  ],
  dataModel: `
The data splits cleanly into metadata (relational-ish, needs indexes and
counts) and media (large binary blobs, needs object storage, not a
database):

- **users**: \`user_id\`, \`username\`, \`bio\`, \`created_at\`.
- **posts**: \`post_id\`, \`user_id\` (author), \`media_url\` (pointer into
  object storage, not the bytes themselves), \`caption\`, \`created_at\`,
  \`like_count\` (denormalized counter, updated asynchronously rather than by
  counting rows on every read).
- **follows**: \`follower_id\`, \`followee_id\`, \`created_at\` — the edge list
  of the follower graph, indexed on both columns since the system needs to
  answer "who does X follow" (for fan-out on write) and "who follows X" (to
  know who to fan out *to*) equally often.
- **likes**: \`post_id\`, \`user_id\`, \`created_at\` — composite key on
  (\`post_id\`, \`user_id\`) both to make "did this user like this post"
  idempotent and to avoid double-counting.
- **feed_items** (per-user precomputed feed, in a key-value or wide-column
  store): \`user_id\` -> a sorted list of \`post_id\`s, capped to the most
  recent few hundred. This table is the whole point of the fan-out design
  below — it exists purely so a feed read is a single lookup, not a
  fan-in query across the follows table at read time.

Media itself never lives in any of these tables — every row that references
a photo or video stores a URL into object storage (e.g. S3) sitting behind
a CDN, keeping the metadata store small and fast regardless of how much
media volume grows.
  `.trim(),
  highLevelDesign: `
**Write path.** A new post does two things: store the media, and fan the
post out to followers' feeds.

- Media goes to object storage first. A background job makes resized
  variants (thumbnail, feed-size, full-res).
- The post's metadata row is written, pointing at those URLs.
- A fan-out worker reads from a queue and pushes the new \`post_id\` into
  every follower's precomputed \`feed_items\` list.

The API returns as soon as the post and media are durably stored. Fan-out
finishes in the background within a few seconds.

**Read path.** Opening the feed is one lookup into \`feed_items\` for the
caller's \`user_id\`, which returns \`post_id\`s already in order. Then a
batch fetch gets those posts' metadata, usually from cache. No
follower-graph traversal happens at read time.

That's the core trade: pay a small async cost per follower on every write
to get an O(1) lookup on every read, when reads outnumber writes 100:1.

A CDN fronts all media, so most image/video bytes never touch the app's
own servers. App servers behind a load balancer handle metadata and feed
lookups. They're backed by a cache for hot posts and profiles, a sharded
metadata store, and a message queue that decouples "a post was created"
from "every follower's feed was updated."
  `.trim(),
  highLevelDiagram: `
                         ┌───────────────┐
    Client  ───────────▶ │ Load Balancer │
                         └───────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                          ▼
             ┌─────────────┐           ┌───────────────┐
             │ App Servers │           │  Media Upload  │
             │ (feed read, │           │    Service     │
             │  posts CRUD)│           └───────┬────────┘
             └──────┬──────┘                   │
                    │                          ▼
                    │                  ┌───────────────┐
                    │                  │ Object Storage │
                    │                  │  (S3) + CDN    │
                    │                  └───────────────┘
                    │
        ┌───────────┼─────────────────┐
        ▼           ▼                 ▼
  ┌───────────┐ ┌──────────┐   ┌──────────────┐
  │   Cache   │ │ Metadata │   │ Message Queue │
  │  (Redis)  │ │   DB     │   │ (fan-out jobs)│
  └───────────┘ │(sharded) │   └───────┬───────┘
                └──────────┘           │
                                       ▼
                              ┌─────────────────┐
                              │  Fan-out Workers │
                              │ write feed_items │
                              │  per follower    │
                              └─────────────────┘
  `,
  deepDives: [
    {
      title: "Feed generation: fan-out on write vs. fan-out on read",
      explanation: `
There are two ways to answer "what posts should this user see?":

- **Fan-out on write** (push): when a post is created, write its id into
  every follower's precomputed feed. Reading the feed is one cheap lookup.
  This is the right default because reads outnumber writes ~100:1, so it
  moves the expensive work to the rare side.
- **Fan-out on read** (pull): precompute nothing. When a user opens their
  feed, look up who they follow and merge their recent posts on the fly.
  No wasted work for unseen posts, but every feed open is an expensive
  multi-way merge.

Pure fan-out on write breaks for celebrities. A post from an account with
50 million followers would trigger 50 million feed writes at once,
overwhelming the workers and the feed store.

Real systems use a **hybrid**. Fan out on write for ordinary accounts. For
accounts above a follower-count threshold, skip fan-out and merge their
posts into the feed at read time. A user follows only a handful of
celebrities, so this merge is cheap. The cost flips from "one huge write,
once" to "one small merge per read," which suits the skewed follower
distribution.
      `.trim(),
    },
    {
      title: "Storing and delivering media at scale",
      explanation: `
Photos and videos are large, immutable, and read far more than written.
That's a different profile from metadata, so they get different
infrastructure:

- Media bytes go into **object storage** (e.g. S3), never the metadata
  store. The metadata store stays small and fast because it holds only
  URLs, not blobs.
- On upload, a background job makes several resolutions (thumbnail,
  feed-width, full-screen), so the client downloads only the size it
  needs.
- A **CDN** caches media at edge locations near viewers. The same photo is
  seen by many followers and never changes, so hit rates are very high,
  even higher than for the feed.
- Uploads are rare and can tolerate more latency. Heavier processing
  (transcoding, content moderation) runs asynchronously after the upload
  is acknowledged, so it never blocks "post".
      `.trim(),
    },
    {
      title: "The follower graph and the celebrity problem",
      explanation: `
Storing "who follows whom" is simple: a table of (\`follower_id\`,
\`followee_id\`) pairs. The hard part is the graph's *shape*. Most accounts
have a small follower count, while a tiny number have tens of millions.

This skew shows up everywhere, not just in fan-out:

- A follower *count* is easy (a denormalized counter). A celebrity's
  follower *list* is a large paginated query that needs its own caching.
- Rate limiting and abuse detection must treat celebrity and normal
  accounts as different traffic profiles. One celebrity post creates
  orders of magnitude more downstream work.
- Anything "fine on average" (like the ~150 followers/post fan-out
  estimate) must be re-checked against the worst case, not just the mean.
      `.trim(),
    },
    {
      title: "Likes and comments without hammering the database",
      explanation: `
A like is one row insert, but a popular post can get thousands of likes
within seconds. That many concurrent updates to the post's \`like_count\`
would cause serious write contention on one row.

- Likes and comments go into their own append-only tables instead of
  updating the post row.
- The visible \`like_count\` is a denormalized counter updated
  asynchronously, often through a queue that batches increments. It isn't
  computed with \`COUNT(*)\` on every read or incremented on every like. A
  count that lags by a second or two is worth not funnelling every like
  through one hot row.
- Comments are paginated. Only the newest few load with a post; older ones
  load on demand, since most viewers never scroll past the first handful.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
What breaks first is not "the database" but hot spots inside it: a
celebrity's follower list, a viral post's like counter, or the fan-out
queue backing up behind one huge post. Hybrid fan-out, async counters, and
CDN-fronted media each remove one of these hot spots.

Beyond that, the metadata store shards by \`user_id\`, so a user's posts,
follow edges, and feed items live together and most queries hit one
shard. App servers, fan-out workers, and cache nodes all scale
horizontally.

Once users are spread worldwide, the metadata store needs multi-region
replication (the CDN already covers media). That trades a little write
latency and eventual consistency for fast reads everywhere.
  `.trim(),
  tradeOffs: [
    {
      decision: "Fan-out on write vs. fan-out on read for feed generation",
      explanation:
        "Use fan-out on write for most accounts. Reads outnumber writes ~100:1, so precomputing feeds makes the common operation (reading a feed) nearly free. The cost is wasted work for unseen posts and a real problem for celebrities, so the design is a hybrid: read-time merging for accounts above a follower-count threshold.",
    },
    {
      decision: "Strong consistency vs. eventual consistency for feeds and counters",
      explanation:
        "Use eventual consistency wherever it's tolerable. Users don't notice a like count lagging a couple of seconds, or a post taking a few seconds to reach every feed. This gives much higher write throughput and availability than updating every feed and counter synchronously.",
    },
    {
      decision: "Object storage + CDN vs. storing media in the primary database",
      explanation:
        "Keep media in object storage behind a CDN, never in the metadata database, even though one system of record would be simpler. The metadata store stays small, fast, and easy to shard and replicate. The cost is running two storage systems and keeping URLs consistent between them.",
    },
    {
      decision: "Synchronous vs. asynchronous fan-out and counter updates",
      explanation:
        "Push fan-out and counter increments onto a queue instead of doing them inline, so posting or liking returns instantly. The cost is a short window of inconsistency (a post not yet in every feed, a count not yet updated). That's fine here because nothing depends on that window being zero.",
    },
  ],
  interviewTips: [
    "Lead with the ~100:1 read:write ratio. It's the number that justifies precomputing feeds.",
    "Raise the celebrity/hot-user problem before the interviewer does. It separates a naive fan-out-on-write answer from a strong one.",
    "Separate media storage from metadata storage. Storing images as blobs in the posts database is a common beginner mistake.",
    "Explain why counters (likes, follower counts) are denormalized and async. It shows you understand write contention on hot rows.",
    "Don't design ML feed ranking in depth unless asked. Mention it as a layer on top of chronological fan-out, then move on.",
  ],
  relatedTopics: [
    "caching",
    "cdn",
    "sharding",
    "queues",
    "pub-sub",
    "consistency-models",
    "database-replication",
    "load-balancing",
  ],
  keywords: [
    "instagram",
    "social feed",
    "fan-out on write",
    "fan-out on read",
    "news feed",
    "cdn",
    "system design interview",
    "photo sharing",
  ],
};
