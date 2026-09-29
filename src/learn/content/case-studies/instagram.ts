import type { CaseStudy } from "../../types/caseStudy";

export const instagramCaseStudy: CaseStudy = {
  id: "instagram",
  title: "Instagram",
  difficulty: "Hard",
  summary:
    "Design a photo-sharing social network: users post images, follow other users, and see a personalized feed of posts from the people they follow.",
  problemStatement: `
A user opens the app and sees a scrolling feed of photos and videos from
accounts they follow, roughly newest first. They can post their own photo,
which their followers should see appear in their feeds soon after. They can
like and comment on posts, and follow or unfollow other accounts at any
time. That's the product in one sentence — but two things make it a genuinely
hard system to build at scale rather than a CRUD app with an image field.

First, the read side: a feed isn't a simple database query. "Show me the
newest posts from everyone I follow" means joining across a follower graph
that, for a popular account, can have tens of millions of edges, and doing
it fast enough that opening the app never feels slow. Second, the write
side: photos and videos are large binary blobs that need to be stored
durably, resized into several resolutions, and served from wherever in the
world the viewer happens to be — none of which a relational database is
built to do well.

The interesting design work is almost entirely about these two things: how
a feed gets assembled cheaply for a billion users, and how media gets stored
and delivered cheaply and fast. Everything else — likes, comments, follows —
is comparatively simple data modeling once those two problems are solved.
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
    "Two numbers dominate the design: a 100:1 read:write ratio on the feed, and a follower distribution so skewed that the average fan-out (~150) is meaningless for the accounts that actually matter (some have 50 million followers). The first pushes toward precomputing feeds instead of computing them from scratch on every read; the second means that precomputing everything for every account is itself a trap, and celebrity accounts need a different strategy than everyone else.",
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
The write path for a new post does two separate things: it stores the
media, and it fans the post out to followers' feeds. Media is uploaded to
object storage first (with a background job producing a few resized
variants — thumbnail, feed-size, full-res); the post's metadata row is
written pointing at those URLs; and a fan-out worker, running
asynchronously off a queue, pushes the new \`post_id\` into the precomputed
\`feed_items\` list for every follower. None of this blocks the uploader —
the API returns as soon as the post and media are durably stored, and
fan-out happens in the background within a few seconds.

The read path is designed to be almost embarrassingly simple: opening the
feed is a single lookup into \`feed_items\` for the caller's \`user_id\`,
returning a list of \`post_id\`s already in the right order, followed by a
batch fetch of those posts' metadata (usually served from cache). No
follower-graph traversal happens at read time at all — that work was
already done at write time. This is the fundamental trade at the heart of
the whole system: pay a small, asynchronous cost per follower on every
write, in exchange for an O(1) lookup on every read, on a system where
reads outnumber writes 100:1.

A CDN sits in front of all media, so the vast majority of image/video bytes
never touch the application's own infrastructure at all; app servers behind
a load balancer handle metadata reads/writes and feed lookups, backed by a
cache layer for hot posts and profiles, a sharded metadata store, and a
message queue that decouples "a post was created" from "every follower's
feed was updated."
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
There are two fundamentally different ways to answer "what posts should
this user see?":

- **Fan-out on write** (push): when a post is created, immediately write
  its id into every follower's precomputed feed list. Reading the feed is
  then a single cheap lookup. This is the right default because reads
  outnumber writes ~100:1 here — it moves the expensive work to the rare
  side of that ratio.
- **Fan-out on read** (pull): store nothing precomputed; when a user opens
  their feed, query the follows table for who they follow and merge the
  most recent posts from each of them on the fly. This avoids ever doing
  wasted work for posts nobody looks at, but makes every single feed open
  an expensive multi-way merge across however many accounts the user
  follows.

Pure fan-out on write breaks down for celebrity accounts: a post from an
account with 50 million followers would trigger 50 million feed writes at
once, overwhelming the fan-out workers and the feed store. The practical
answer real systems converge on is a **hybrid**: fan out on write for
ordinary accounts, but for accounts above a follower-count threshold, skip
the fan-out and instead merge their posts into a follower's feed at read
time (since a follower only follows a handful of celebrities at most, this
per-read merge is cheap even though the celebrity's follower count is
huge). This flips the cost from "one huge write, once" to "one small merge,
on every read," which is exactly the shape that scales for the skewed
follower distribution described in the capacity estimates above.
      `.trim(),
    },
    {
      title: "Storing and delivering media at scale",
      explanation: `
Photos and videos are large, immutable once uploaded, and read far more
often than they're written — a different profile than the metadata store
entirely, so they get a different piece of infrastructure:

- Media bytes go into **object storage** (e.g. S3), never into the
  relational/wide-column metadata store, which stays small and fast because
  it only ever holds pointers (URLs), not blobs.
- On upload, a background job produces multiple resolutions (thumbnail,
  feed-width, full-screen) so the client can request the size it actually
  needs rather than always downloading the original.
- A **CDN** caches media at edge locations close to viewers. Because the
  same photo is viewed by potentially every one of a user's followers, and
  media is immutable, cache hit rates are extremely high — this is one of
  the most cache-friendly workloads in the whole system, more so even than
  the feed itself.
- Uploads themselves (the write path for media) are comparatively rare and
  can tolerate more latency than reads, so heavier processing (transcoding,
  content moderation scanning) happens asynchronously after the initial
  upload is acknowledged, rather than blocking the user's "post" action on
  it.
      `.trim(),
    },
    {
      title: "The follower graph and the celebrity problem",
      explanation: `
Storing "who follows whom" is conceptually simple — a table of
(\`follower_id\`, \`followee_id\`) pairs — but the *shape* of that graph is
what makes this system hard. The distribution is extremely skewed: the
overwhelming majority of accounts have a small, roughly-bounded follower
count, while a tiny number of accounts have tens of millions.

This skew shows up everywhere in the design, not just in feed fan-out:

- Displaying someone's follower *count* is easy (a denormalized counter);
  displaying their follower *list* for a celebrity is itself a large
  paginated query that needs its own caching strategy.
- Rate limiting and abuse detection need to treat "a celebrity account's
  activity" and "a normal account's activity" as different traffic
  profiles, since a celebrity posting once generates orders of magnitude
  more downstream work than an average user's post.
- Any design decision that's "fine on average" (like the ~150 followers/post
  fan-out estimate) has to be explicitly re-checked against the worst case
  the graph actually contains, not just the mean.
      `.trim(),
    },
    {
      title: "Likes and comments without hammering the database",
      explanation: `
A like is logically a single row insert, but a popular post can receive
thousands of likes within seconds of being posted — hammering the
\`posts\` row's \`like_count\` with that many concurrent updates would create
serious write contention on a single row.

- Likes/comments are written to their own tables (append-only, no update
  contention on existing rows) rather than mutating the post row directly.
- The visible \`like_count\` on a post is a denormalized counter updated
  asynchronously — often via a queue that batches increments — rather than
  computed with \`COUNT(*)\` on every read or incremented synchronously on
  every single like. A count that lags the true value by a second or two is
  an acceptable trade for not serializing every like through one hot row.
- Comments are paginated and typically only the most recent few are
  fetched with a post by default, with older comments loaded on demand,
  since most viewers never scroll past the first handful.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
The first thing to break at scale isn't the database in the abstract — it's
any single hot spot inside it: a celebrity's follower list, a viral post's
like counter, or the fan-out queue backing up behind one enormous post. The
hybrid fan-out strategy, denormalized async counters, and CDN-fronted media
each exist specifically to remove one of those hot spots before it becomes
a single point of contention.

Beyond that, the metadata store scales by sharding — typically by
\`user_id\`, so a given user's posts, follow edges, and feed items tend to
live together and most queries hit one shard — while app servers, fan-out
workers, and cache nodes all scale horizontally behind their respective
layers. Multi-region replication of both media (already solved by the CDN)
and the metadata store becomes necessary once the user base is
geographically distributed, trading a small amount of write latency and
eventual consistency for reads that are fast everywhere in the world.
  `.trim(),
  tradeOffs: [
    {
      decision: "Fan-out on write vs. fan-out on read for feed generation",
      explanation:
        "Fan-out on write was chosen for the general case because reads outnumber writes ~100:1, so precomputing feeds at write time makes the overwhelmingly common operation (reading a feed) nearly free. The cost is wasted work for posts that are never viewed, and a genuine problem for celebrity accounts, which is why the real design hybridizes: read-time merging for accounts above a follower-count threshold.",
    },
    {
      decision: "Strong consistency vs. eventual consistency for feeds and counters",
      explanation:
        "Eventual consistency was chosen everywhere it's tolerable: a like count lagging by a couple of seconds, or a new post taking a few seconds to reach every follower's feed, is invisible to users in practice. This buys much higher write throughput and availability than a design that synchronously updated every follower's feed and every counter on every write.",
    },
    {
      decision: "Object storage + CDN vs. storing media in the primary database",
      explanation:
        "Media lives in object storage behind a CDN, never in the metadata database, even though it would be simpler to have one system of record. This keeps the metadata store small enough to be fast and easy to shard/replicate, at the cost of operating two separate storage systems and keeping URLs consistent between them.",
    },
    {
      decision: "Synchronous vs. asynchronous fan-out and counter updates",
      explanation:
        "Fan-out and counter increments are pushed onto a queue and processed asynchronously rather than done inline with the user-facing request, so posting or liking something returns instantly. The cost is a short window where the system is inconsistent (a post not yet in every feed, a count not yet incremented) — acceptable here because nothing in the product depends on that window being zero.",
    },
  ],
  interviewTips: [
    "Lead with the 100:1-ish read:write ratio — it's the single number that justifies precomputing feeds instead of computing them live.",
    "Bring up the celebrity/hot-user problem yourself before the interviewer prompts you — it's the detail that separates a naive fan-out-on-write answer from a strong one.",
    "Separate media storage from metadata storage explicitly; conflating them (e.g. storing images as blobs in the same database as posts) is a common beginner mistake to call out and avoid.",
    "Say out loud why counters (likes, follower counts) are denormalized and asynchronous rather than computed live — it shows you understand write contention on hot rows.",
    "Don't try to design ranking/ML-based feed relevance in depth unless asked — mention it exists as a layer on top of the chronological fan-out design, then move on.",
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
