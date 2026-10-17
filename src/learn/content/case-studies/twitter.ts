import type { CaseStudy } from "../../types/caseStudy";

export const twitterCaseStudy: CaseStudy = {
  id: "twitter",
  title: "Twitter / X",
  difficulty: "Hard",
  summary:
    "Design a microblogging platform where users post short messages ('tweets'), follow others, and see a timeline of tweets from people they follow.",
  problemStatement: `
A user posts a short message. Their followers should see it in their home
timeline shortly after, mixed with tweets from everyone else they follow,
newest first. Users can also reply, retweet, and like.

This sounds like a photo-sharing feed, and much of the machinery is the
same. But Twitter is dominated by one thing: **extreme, sudden fan-out**.

Some accounts have around a hundred million followers. One tweet from them
must reach all those timelines within seconds, often during a live event
when millions are refreshing at once. A design that works for a user with
300 followers falls over for an account with 100 million. Here the extreme
outliers *are* the design problem, not an edge case.

Content is also public and quickly loses relevance. Trending topics and
search-by-recency matter more than in a photo feed, which adds a real-time
counting problem alongside timeline fan-out.
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
    "The averages (~50:1 read:write, ~6,000 tweets/second) fit a conventional fan-out-on-write feed. The outlier decides the architecture: one tweet may need to reach 100+ million timelines. Any design that fans every tweet out to every follower (sync, or async without limits) will sometimes face tens of millions of writes within seconds of one tweet, and must be built to survive that.",
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
**Write path.** A new tweet is saved, and a fan-out step pushes it into
followers' precomputed timelines through a queue. Posting returns without
waiting for fan-out.

The key difference is huge accounts. Instead of queueing tens of millions
of timeline writes, the system sees the author is above a follower-count
threshold, skips fan-out-on-write, and marks the tweet for read-time
merging.

**Read path.** A timeline load reads \`timeline_items\` for fanned-out
tweets. It also fetches the latest tweets from the few celebrity accounts
the user follows (only a handful, so this is cheap) and interleaves both by
timestamp. This hybrid keeps both the average case (one lookup) and the
worst case (one tweet from a huge account) manageable.

**Trends.** A separate real-time pipeline handles trending topics. A
stream processor extracts hashtags/keywords and keeps rolling counts over
sliding windows. It's independent of timeline serving, so trend load never
slows a timeline read.

Everything sits behind a load balancer and stateless app servers, backed
by a cache for hot tweets/timelines, a sharded metadata store, object
storage + CDN for media, and a message queue. The queue decouples "a tweet
was posted" from its side effects: fan-out, counters, trend ingestion, and
search indexing.
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
This is the central problem of the design, the same trade-off any feed
faces, only sharper:

- **Fan-out on write**: on posting, push the tweet id into every
  follower's \`timeline_items\` list. Reads become one lookup, which suits
  the common case since reads outnumber writes.
- **Fan-out on read**: precompute nothing; merge tweets from followed
  accounts at read time. No wasted work on unseen tweets, but every
  timeline load is an expensive multi-account merge.
- **Hybrid (what real systems use)**: fan out on write for most accounts.
  For accounts above a follower-count threshold (the "celebrity" tier),
  skip fan-out and merge their tweets at read time. Each user follows
  only a few celebrities, so this merge stays cheap however many
  followers a celebrity has.

The threshold is a tuning knob. Too low, and too many accounts get the
costlier read-time path. Too high, and fan-out workers choke on tens of
millions of writes from one tweet. It's set empirically from the real
follower-count distribution.
      `.trim(),
    },
    {
      title: "Trending topics as a streaming aggregation problem",
      explanation: `
You can't compute trends by scanning the tweets table. At thousands of
tweets per second, a query on the raw firehose would never keep up. And
"trending" means a moving window (hot *right now*, not all-time).

- Tweets go onto a stream (the fan-out queue or a dedicated one). A
  stream processor keeps rolling counts per hashtag/keyword, for example
  over the last 5, 15, and 60 minutes, dropping old data as the window
  slides.
- Exact counts don't matter for "what's trending." When there are very
  many distinct terms, approximate structures (e.g. count-min sketches)
  trade a small, bounded error for far less memory than exact per-term
  counters.
- The pipeline periodically writes only the current top-N terms into a
  small, heavily cached result. The \`/trends\` endpoint reads that, never
  the streaming layer, so computing and serving trends scale
  independently.
      `.trim(),
    },
    {
      title: "Retweets and replies without duplicating content",
      explanation: `
A retweet must appear in the retweeter's timeline and profile. Copying the
original text for every retweet would waste space and make edits/deletes
inconsistent across copies.

- A retweet is a thin row: \`retweet_of\` pointing at the original
  \`tweet_id\`, plus its own \`tweet_id\`, \`author_id\` (the retweeter), and
  \`created_at\`. Rendering it fetches the original by that pointer,
  usually a cache hit since retweeted tweets are popular.
- If the original is deleted, the retweet is either hidden ("this tweet
  was deleted") or cascade-deleted, depending on product policy. No copy
  of the text needs cleaning up, because none was made.
- Replies are ordinary tweets with an \`in_reply_to\` pointer. Walking that
  chain rebuilds a thread, with no separate "conversation" table.
      `.trim(),
    },
    {
      title: "Search over a constantly growing, mostly-recent corpus",
      explanation: `
Tweet search is unusual: most searches care about recent tweets, and the
corpus grows by thousands of documents every second.

- Tweets are indexed asynchronously (off the same event stream as fan-out
  and trends) into a dedicated search index (e.g. an inverted-index engine
  like Elasticsearch). Search never queries the metadata store, because
  full-text search and fast key lookups need very different data
  structures.
- Indexes are time-partitioned (e.g. one shard set per day or week). A
  recent-first query touches only the newest shards. Old shards move to
  cheaper storage or are dropped under a retention policy, away from the
  hot path.
- Users don't notice a tweet becoming searchable a few seconds late, so
  indexing runs asynchronously instead of slowing down posting.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
The design is built around one failure mode: a burst. One huge account
tweets, or a live event has millions posting and refreshing at once.
Hybrid fan-out turns "100 million writes in a few seconds" into "a cheap
read-time merge, repeated many times." Without it, the fan-out queue and
workers would fail first, and worst.

Beyond that, the usual playbook applies:

- Shard the metadata store (by \`user_id\` or \`tweet_id\`) so most queries
  hit one shard.
- Scale app servers, cache nodes, and fan-out/indexing/trend workers
  horizontally and independently.
- Replicate across regions so timeline reads and fan-out stay fast for
  users far from any one data center, accepting eventual consistency
  across regions.
  `.trim(),
  tradeOffs: [
    {
      decision: "Hybrid fan-out vs. pure fan-out-on-write for all accounts",
      explanation:
        "Use a hybrid: fan-out-on-write for ordinary accounts (cheap reads, the common case) and read-time merging above a follower-count threshold. Pure fan-out-on-write is simpler but not viable. One tweet from a 100-million-follower account would cause a write storm that overwhelms the fan-out layer.",
    },
    {
      decision: "Exact counters vs. approximate counting for trending topics",
      explanation:
        "Use approximate structures (e.g. count-min sketches) once there are many distinct terms. They accept a small, bounded error for far less memory than an exact count per hashtag/keyword. That's an easy trade, since 'trending' is a fuzzy top-N idea, not an exact ranking.",
    },
    {
      decision: "Synchronous vs. asynchronous fan-out, indexing, and counters",
      explanation:
        "Run fan-out, search indexing, and counter updates asynchronously off a message queue, so tweeting stays fast however much work it triggers. The cost is a short window (usually seconds) before a tweet reaches every timeline, the trend counters, and the search index. That's fine because nothing requires the window to be zero.",
    },
    {
      decision: "Storing retweets as pointers vs. duplicating the original tweet's content",
      explanation:
        "Store retweets as pointers to the original, not copies. Storage stays flat however often something is retweeted, and edits/deletes stay consistent everywhere. The cost is an extra lookup (usually a cache hit) to render a retweet.",
    },
  ],
  interviewTips: [
    "Name the celebrity/hot-user problem early. It separates a strong answer from a generic 'feed system' one, and interviewers expect it for Twitter.",
    "Present the fan-out threshold as a tunable, empirically set number, not a constant. It shows you see it as a real operational knob.",
    "Treat trending topics as a separate streaming subsystem, not a query on the tweets table. Mixing them up is a common mistake.",
    "Mention that retweets and replies are pointers, not copies. It signals good data-modeling instinct.",
    "If time allows, note that search and fan-out both tolerate a few seconds of lag, and use that to justify making them asynchronous.",
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
