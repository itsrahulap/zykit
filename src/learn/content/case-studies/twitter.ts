import type { CaseStudy } from "../../types/caseStudy";

export const twitterCaseStudy: CaseStudy = {
  id: "twitter",
  title: "Twitter / X",
  difficulty: "Hard",
  summary:
    "Design a microblogging platform: users post short messages ('tweets'), follow other users, and see a timeline of tweets from the people they follow.",
  problemStatement: `
A user types a short message and posts it. Anyone who follows them should
see it show up in their home timeline shortly after, mixed in with tweets
from everyone else they follow, newest first. Users can also reply, retweet,
and like. On paper this sounds almost identical to a photo-sharing feed —
and a lot of the underlying machinery genuinely is the same — but Twitter's
specific shape of problem is dominated by one thing: **extreme, sudden
fan-out**.

Some accounts have on the order of a hundred million followers, and a
single tweet from one of them needs to reach all of those followers'
timelines within seconds, often during a live event when millions of people
are refreshing at once. A design that works fine for a user with 300
followers falls over completely if applied naively to a tweet from an
account with 100 million — so unlike many systems where "the architecture
handles the 99th percentile fine," here the extreme outlier accounts *are*
the design problem, not an edge case bolted on afterward.

The other Twitter-specific wrinkle is that content is public and
short-lived in relevance — trending topics and search-by-recency matter in
a way they don't for a photo feed, which pulls a real-time
aggregation/counting problem into the design alongside the timeline-fan-out
problem.
  `.trim(),
  requirements: {
    functional: [
      "A user can post a short text message (a tweet), optionally with media attached.",
      "A user can follow and unfollow other users.",
      "A user can view a home timeline: tweets from followed accounts, newest-first.",
      "A user can reply to, retweet, and like a tweet.",
      "A user can view a specific user's profile timeline (their own tweets).",
      "The system surfaces currently trending topics/hashtags across all users.",
    ],
    nonFunctional: [
      "Timeline reads must be low latency and available even under very high concurrent load (e.g. during a live event).",
      "The system is read-heavy overall, but write fan-out for a single tweet from a huge account can itself be a massive burst of work.",
      "Eventual consistency is acceptable for timelines and counts — a tweet appearing in a follower's timeline a few seconds late, or a like count that's briefly stale, is fine.",
      "The follower graph is extremely skewed: most accounts have a small number of followers, a small number of accounts have tens or hundreds of millions.",
      "Tweets are effectively immutable once posted (aside from deletion), simplifying caching.",
    ],
  },
  capacityEstimation: [
    {
      label: "Daily active users",
      value: "~250 million",
      note: "A reasonable order-of-magnitude assumption for a large microblogging platform, stated as a starting assumption.",
    },
    {
      label: "Tweets posted per day",
      value: "~500 million",
      note: "Assume each active user posts an average of 2 tweets/day: 250M * 2.",
    },
    {
      label: "Tweets posted per second (average)",
      value: "~6,000 TPS",
      note: "500 million / 86,400 seconds in a day, rounded — with spikes several times higher during major live events.",
    },
    {
      label: "Timeline reads per day",
      value: "~25 billion",
      note: "Assume each active user refreshes/loads their timeline ~100 times/day (a much higher-frequency habit than posting): 250M * 100.",
    },
    {
      label: "Read:write ratio",
      value: "~50:1",
      note: "25 billion timeline reads vs. 500 million tweets — heavily read-skewed, though less extreme than a pure content-consumption product, since replying/retweeting/liking also generate meaningful write volume.",
    },
    {
      label: "Worst-case single-tweet fan-out",
      value: "~100+ million writes",
      note: "A tweet from the platform's largest accounts (~100M+ followers) would need to reach that many timelines if fanned out naively on write — this single number is why celebrity accounts can't be treated the same as ordinary ones.",
    },
  ],
  capacityNotes:
    "The average numbers (~50:1 read:write, ~6,000 tweets/second) describe a system a fairly conventional fan-out-on-write feed architecture could handle. The outlier number — a single tweet potentially needing to reach 100+ million timelines — is the one that actually determines the architecture: any design that fans every tweet out to every follower synchronously (or even asynchronously, without limits) will occasionally need to perform tens of millions of writes in the seconds after one tweet is posted, and has to be built to survive that specifically.",
  apiDesign: [
    { method: "POST", path: "/api/v1/tweets", description: "Body: { text, mediaIds? }. Creates a tweet and triggers timeline fan-out." },
    { method: "GET", path: "/api/v1/timeline/home", description: "Returns the caller's home timeline, paginated, newest-first." },
    { method: "GET", path: "/api/v1/users/{userId}/tweets", description: "Returns a user's own tweet timeline (profile view)." },
    { method: "POST", path: "/api/v1/users/{userId}/follow", description: "Follow a user; unfollow via DELETE on the same path." },
    { method: "POST", path: "/api/v1/tweets/{tweetId}/retweet", description: "Retweets a tweet onto the caller's own timeline." },
    { method: "POST", path: "/api/v1/tweets/{tweetId}/like", description: "Likes a tweet (idempotent)." },
    { method: "GET", path: "/api/v1/trends", description: "Returns currently trending hashtags/topics, typically region-scoped." },
    { method: "GET", path: "/api/v1/search/tweets", description: "Full-text/recency search over public tweets." },
  ],
  dataModel: `
As with most feed-shaped products, metadata and the follower graph are kept
separate from anything resembling large binary content, and counters are
denormalized to avoid hot-row contention:

- **users**: \`user_id\`, \`username\`, \`bio\`, \`follower_count\` (denormalized,
  updated asynchronously), \`created_at\`.
- **tweets**: \`tweet_id\`, \`author_id\`, \`text\`, \`media_urls\` (pointers into
  object storage, if any), \`created_at\`, \`retweet_of\` (nullable, if this
  row is a retweet), \`like_count\` / \`retweet_count\` (denormalized
  counters).
- **follows**: \`follower_id\`, \`followee_id\` — the follower graph edge list,
  indexed both directions (who does X follow, who follows X), exactly as
  in a photo-feed design, and just as skewed.
- **timeline_items** (precomputed per-user timeline, in a wide-column or
  key-value store): \`user_id\` -> a time-ordered list of \`tweet_id\`s,
  capped to a recent window. This is the fan-out-on-write target and is
  the reason a normal user's timeline read is a single lookup.
- **likes** / **retweets**: append-only tables keyed on (\`tweet_id\`,
  \`user_id\`), used both to make the actions idempotent and to drive the
  asynchronous counter updates.

Trending topics are deliberately *not* backed by a table at all in the
usual sense — they're computed by a separate streaming aggregation
pipeline (see the deep dive below) that counts hashtag/keyword occurrences
over a sliding time window and writes only the current top-N into a small,
heavily cached result.
  `.trim(),
  highLevelDesign: `
The write path starts the same way a photo-feed's does: a new tweet is
persisted, and a fan-out step pushes it into followers' precomputed
timelines asynchronously via a queue, so posting returns immediately
without waiting for fan-out to finish. The difference that shapes the rest
of the design is what happens when the author has an enormous follower
count: instead of enqueueing tens of millions of individual timeline
writes, the system detects the account is above a follower-count threshold
and skips fan-out-on-write for it entirely, marking the tweet for
read-time merging instead.

The read path for a normal user's timeline is a lookup into
\`timeline_items\` for the recently-fanned-out tweets, merged at read time
with a small additional step: check the short list of celebrity accounts
the user follows, fetch their few most recent tweets directly (there are
never more than a handful of celebrities in any one user's follow list, so
this merge is cheap), and interleave the two by timestamp before returning
the page. This hybrid is what makes both the average case (single lookup)
and the worst case (one tweet from one huge account) tractable at the same
time.

Trending topics run on an entirely separate real-time pipeline: tweets
flow through a stream processor that extracts hashtags/keywords and
maintains rolling counts over sliding windows, independent of the
timeline-serving path, so a spike in trend-computation load can never
slow down a timeline read. Everything sits behind a load balancer and
stateless app servers, backed by a cache for hot tweets/timelines, a
sharded metadata store, object storage + CDN for media, and a message
queue decoupling "a tweet was posted" from all of its downstream side
effects (fan-out, counters, trend ingestion, search indexing).
  `.trim(),
  highLevelDiagram: `
                         ┌───────────────┐
    Client  ───────────▶ │ Load Balancer │
                         └───────┬───────┘
                                 ▼
                          ┌─────────────┐
                          │ App Servers  │
                          │ (tweet CRUD, │
                          │ timeline read)│
                          └──────┬───────┘
                                 │
             ┌───────────────────┼────────────────────┐
             ▼                   ▼                    ▼
      ┌───────────┐      ┌──────────────┐     ┌───────────────┐
      │   Cache   │      │  Metadata DB │     │ Message Queue  │
      │  (Redis)  │      │  (sharded)   │     │ (tweet events) │
      └───────────┘      └──────────────┘     └───────┬───────┘
                                                        │
                          ┌─────────────────────────────┼─────────────────────┐
                          ▼                             ▼                     ▼
                  ┌───────────────┐           ┌──────────────────┐   ┌───────────────┐
                  │ Fan-out Workers│           │ Trend Aggregator  │   │ Search Indexer │
                  │ (normal users) │           │ (streaming counts)│   │                │
                  └───────┬───────┘           └────────┬─────────┘   └───────────────┘
                          ▼                             ▼
                  ┌────────────────┐           ┌────────────────┐
                  │ timeline_items │           │  Trends Cache   │
                  │  (per user)    │           │   (top-N)       │
                  └────────────────┘           └────────────────┘
  `,
  deepDives: [
    {
      title: "Timeline fan-out and the celebrity problem",
      explanation: `
This is the central problem in the whole design, and the reasoning mirrors
(and sharpens) the same trade-off any feed product faces:

- **Fan-out on write**: on posting, push the tweet id into every
  follower's precomputed \`timeline_items\` list. Reads become a single
  lookup — great for the common case, since reads outnumber writes here
  too.
- **Fan-out on read**: store nothing precomputed; merge tweets from
  followed accounts at read time. Avoids ever wasting work on tweets no
  one views, but makes every timeline load an expensive multi-account
  merge.
- **Hybrid (what real systems use)**: fan out on write for the vast
  majority of accounts, but for accounts above a follower-count threshold
  (the "celebrity" tier), skip fan-out entirely and merge their tweets in
  at read time instead. Because any single user follows only a small,
  bounded number of celebrities regardless of how many followers those
  celebrities have, this merge stays cheap no matter how large the
  celebrity's own follower count grows.

The threshold itself is a tuning knob, not a fixed law: set it too low and
too many accounts get the more-expensive read-time treatment; set it too
high and fan-out workers periodically choke on tens of millions of writes
triggered by one tweet. The number is chosen empirically, based on the
actual follower-count distribution observed in production.
      `.trim(),
    },
    {
      title: "Trending topics as a streaming aggregation problem",
      explanation: `
Trending topics can't be computed by scanning the tweets table — at
thousands of tweets per second, any query touching the raw firehose
directly would never keep up, and "trending" implies a moving time window
(what's hot *right now*, not all-time).

- Tweets are published onto a stream (the same message queue backbone used
  for fan-out, or a dedicated one), and a stream-processing layer
  maintains rolling, windowed counts per hashtag/keyword — for example,
  counts over the last 5, 15, and 60 minutes, decaying older data out
  automatically as the window slides.
- Because exact counts down to the last tweet don't matter for "what's
  trending," approximate counting structures (e.g. count-min sketches) are
  a reasonable choice when the cardinality of distinct terms is very high,
  trading a small, bounded counting error for dramatically less memory
  than exact per-term counters.
- The pipeline periodically writes just the current top-N terms into a
  small, heavily cached result set — the actual \`/trends\` endpoint never
  touches the streaming layer directly, it just reads that small
  precomputed answer, so trend computation and trend serving scale
  completely independently of each other.
      `.trim(),
    },
    {
      title: "Retweets and replies without duplicating content",
      explanation: `
A retweet needs to appear in the retweeting user's own timeline and
profile, but storing a full copy of the original tweet's text for every
retweet would both waste space and make edits/deletes of the original
inconsistent across copies.

- A retweet is stored as a thin row: \`retweet_of\` pointing at the
  original \`tweet_id\`, with its own \`tweet_id\`, \`author_id\` (the
  retweeter), and \`created_at\`. Rendering it means fetching the original
  tweet's content by that pointer — usually a cache hit, since retweeted
  tweets are by definition popular and therefore hot.
- If the original tweet is deleted, the retweet row can either be hidden
  (show "this tweet was deleted") or cascade-deleted, depending on product
  policy — either way, no separate copy of the text needs to be found and
  cleaned up, because none was ever made.
- Replies are modeled similarly to ordinary tweets but with a
  \`in_reply_to\` pointer, letting a conversation thread be reconstructed
  by walking that pointer chain, without needing a dedicated
  "conversation" table.
      `.trim(),
    },
    {
      title: "Search over a constantly growing, mostly-recent corpus",
      explanation: `
Tweet search has an unusual access pattern compared to typical full-text
search: most searches care about recent tweets far more than old ones, and
the corpus grows by thousands of new documents every second.

- Tweets are indexed asynchronously (off the same event stream used for
  fan-out and trends) into a dedicated search index (e.g. an inverted-index
  engine like Elasticsearch), never queried directly against the primary
  metadata store, since full-text search and low-latency key lookups want
  very different underlying data structures.
- Indexes are typically time-partitioned (e.g. one shard set per day or
  week), so a recency-biased query only needs to touch the most recent
  shards, and old shards can be moved to cheaper, slower storage or dropped
  entirely under a retention policy without touching the hot path.
- As with fan-out, indexing tolerates a short lag (a tweet becoming
  searchable a few seconds after being posted is invisible to users),
  which is what allows it to happen asynchronously off the write path
  rather than adding latency to posting a tweet.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
The single failure mode this design is built around is a burst: one
enormous account tweeting, or a live event causing millions of users to
post and refresh simultaneously. The hybrid fan-out strategy exists purely
to convert "100 million writes in a few seconds" into "a cheap read-time
merge, repeated many times" — without it, the fan-out queue and workers
would be the first and most catastrophic thing to fall over.

Past that, scaling follows the familiar playbook: shard the metadata store
(typically by \`user_id\` or \`tweet_id\`) so most queries hit one shard;
scale app servers, cache nodes, and fan-out/indexing/trend workers
independently and horizontally behind their own layers; and replicate
across regions so that both the read-heavy timeline path and the
write-heavy fan-out path stay fast for users far from any single data
center, accepting eventual consistency across regions as the cost of that
latency win.
  `.trim(),
  tradeOffs: [
    {
      decision: "Hybrid fan-out vs. pure fan-out-on-write for all accounts",
      explanation:
        "A hybrid was chosen: fan-out-on-write for ordinary accounts (cheap reads, the common case), but read-time merging for accounts above a follower-count threshold. Pure fan-out-on-write is simpler to reason about but is not viable here — a single tweet from a 100-million-follower account would otherwise trigger a write storm large enough to overwhelm the fan-out layer.",
    },
    {
      decision: "Exact counters vs. approximate counting for trending topics",
      explanation:
        "Approximate structures (e.g. count-min sketches) were favored for trend counting once term cardinality gets large, accepting a small, bounded counting error in exchange for far less memory than tracking an exact count per distinct hashtag/keyword — an easy trade since 'trending' is inherently a fuzzy, top-N concept, not an exact ranking that needs to be precise to the last tweet.",
    },
    {
      decision: "Synchronous vs. asynchronous fan-out, indexing, and counters",
      explanation:
        "All of fan-out, search indexing, and counter updates happen asynchronously off a message queue rather than inline with posting a tweet, so the act of tweeting stays fast regardless of how much downstream work it triggers. The cost is a short window (typically seconds) where a tweet exists but hasn't yet reached every follower's timeline, the trend counters, or the search index — acceptable because nothing in the product requires that window to be zero.",
    },
    {
      decision: "Storing retweets as pointers vs. duplicating the original tweet's content",
      explanation:
        "Retweets store only a pointer to the original tweet rather than a copy of its text, keeping storage flat regardless of how many times something is retweeted and keeping edits/deletes of the original consistent everywhere it's referenced. The cost is that rendering a retweet always requires an extra lookup (usually a cache hit) rather than being a single self-contained row.",
    },
  ],
  interviewTips: [
    "Open by naming the celebrity/hot-user problem explicitly — it's the detail that distinguishes a strong answer from a generic 'feed system' answer, and Twitter is the canonical example interviewers expect it for.",
    "Justify the fan-out threshold as a tunable, empirically-set number, not a fixed constant — it shows you understand it's a real operational knob.",
    "Treat trending topics as a separate streaming/aggregation subsystem, not a query against the tweets table — conflating the two is a common mistake.",
    "Mention that retweets/replies are pointers, not copies, when discussing the data model — it's a small detail that signals real data-modeling instinct.",
    "If time allows, note that search and fan-out both tolerate a few seconds of lag, and use that explicitly to justify making them asynchronous.",
  ],
  relatedTopics: [
    "caching",
    "queues",
    "pub-sub",
    "sharding",
    "consistency-models",
    "database-replication",
    "load-balancing",
    "rate-limiting",
  ],
  keywords: [
    "twitter",
    "x",
    "microblogging",
    "fan-out on write",
    "fan-out on read",
    "celebrity problem",
    "trending topics",
    "system design interview",
  ],
};
