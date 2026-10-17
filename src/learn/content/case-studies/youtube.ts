import type { CaseStudy } from "../../types/caseStudy";

export const youtubeCaseStudy: CaseStudy = {
  id: "youtube",
  title: "YouTube",
  difficulty: "Hard",
  summary:
    "Design a video platform where anyone can upload a video and anyone can watch it instantly, at the quality their connection supports.",
  problemStatement: `
Someone uploads a video from their phone. Minutes later, millions of people
worldwide, on fast fiber and shaky mobile data, need to watch it. Playback
should start almost instantly, without stuttering, and without YouTube's own
servers streaming every byte to every viewer. Upload once, watch anywhere,
on any device and network.

Storing a video file is a solved problem. The hard part is that a raw upload
is usually a poor fit for playback: a huge, unoptimized format encoded for
one screen size and network speed. A viewer on a slow train and one on home
fiber need different versions of the file, and neither should wait for it to
be prepared on the fly.

So the system has two very different jobs:

- A **write-side pipeline** that turns a raw upload into many playable
  variants.
- A **read-side delivery problem**: getting the variant that fits a
  viewer's device and network, from somewhere close to them, fast.

Search, comments, recommendations, and view counts sit on top of that core.
  `.trim(),
  requirements: {
    functional: [
      "A user can upload a video file, along with a title, description, and thumbnail.",
      "Uploaded videos are processed into multiple resolutions/bitrates so playback can adapt to the viewer's connection.",
      "Any user can watch a video, with playback starting quickly and adjusting quality automatically as network conditions change.",
      "Users can search for videos and browse a feed of recommended/related videos.",
      "Viewers can like, comment on, and share videos; creators can see view counts and basic analytics.",
    ],
    nonFunctional: [
      "The system is extremely read-heavy: a given video is watched vastly more times than it's uploaded.",
      "Playback must start within a second or two and adapt smoothly, worldwide, including on low-bandwidth connections.",
      "Upload-to-processing is not latency-sensitive the way playback is — a video being available a few minutes after upload rather than instantly is acceptable.",
      "The system must scale to a catalog and viewership far too large for any single data center to serve from local disk.",
      "Storage and bandwidth costs dominate the economics, so both must be used efficiently (avoid re-encoding or re-storing more than necessary).",
      "Eventual consistency is fine for view counts and recommendations; strong consistency is not worth the cost there.",
    ],
  },
  capacityEstimation: [
    {
      label: "Videos uploaded per day",
      value: "~500,000",
      note: "An assumption for a large-scale video platform, stated up front to anchor everything else.",
    },
    {
      label: "Views per day",
      value: "~5 billion",
      note: "A read:write ratio in the thousands-to-one range is typical for video platforms — a small fraction of uploads (the popular ones) account for almost all of the views.",
    },
    {
      label: "Peak read throughput",
      value: "~60,000+ requests/second",
      note: "5 billion views / 86,400 seconds ≈ 58,000 average; real traffic is bursty around peak regional hours, so provisioning targets several times the average.",
    },
    {
      label: "Raw storage added per day",
      value: "~50-100 TB/day (pre-transcoding)",
      note: "500,000 uploads/day * an average raw file size in the low hundreds of MB, before any transcoded variants are added on top.",
    },
    {
      label: "Storage multiplier from transcoding",
      value: "~3-5x the raw upload size",
      note: "Each video is re-encoded into multiple resolutions (240p through 4K) and multiple codecs, and every variant is kept — the processed footprint is several times larger than the original upload.",
    },
    {
      label: "Bandwidth to serve views",
      value: "Many hundreds of Tbps in aggregate, globally",
      note: "5 billion views/day * an average bitrate-and-duration-weighted size per view — the number that makes it obvious a single origin can never serve this directly; it has to be pushed to a CDN close to viewers.",
    },
  ],
  capacityNotes:
    "Uploads are rare and can be handled asynchronously. Views are enormous, global, and bandwidth-heavy. So the design splits into two separate concerns: an offline, horizontally scalable transcoding pipeline for writes, and CDN-first, cache-everywhere delivery for reads. One system can't do both well.",
  apiDesign: [
    { method: "POST", path: "/api/v1/videos/upload-init", description: "Starts an upload session and returns pre-signed URLs/an upload target for chunked upload of the raw file." },
    { method: "PUT", path: "/api/v1/videos/upload/{uploadId}/chunk/{n}", description: "Uploads one chunk of the raw video file; supports resuming a failed upload." },
    { method: "POST", path: "/api/v1/videos/{videoId}/publish", description: "Marks metadata (title, description, thumbnail, visibility) and triggers the transcoding pipeline." },
    { method: "GET", path: "/api/v1/videos/{videoId}/manifest", description: "Returns the adaptive-bitrate manifest (list of available resolutions/segments) for a player to start streaming." },
    { method: "GET", path: "/api/v1/videos/{videoId}", description: "Returns video metadata: title, description, view count, uploader, related video ids." },
    { method: "GET", path: "/api/v1/search?q=", description: "Full-text search over video titles/descriptions/tags, returning ranked results." },
    { method: "POST", path: "/api/v1/videos/{videoId}/view", description: "Fire-and-forget event recording a view, processed asynchronously for counters and recommendations." },
    { method: "GET", path: "/api/v1/feed/recommended", description: "Returns a personalized list of recommended video ids for the current user." },
  ],
  dataModel: `
A handful of clearly separated stores, each shaped for how it's actually
accessed:

- **videos** (metadata, relational or document store): \`video_id\`,
  \`uploader_id\`, \`title\`, \`description\`, \`status\` (uploading /
  processing / ready / failed), \`duration\`, \`created_at\`. Small rows, read
  extremely often, so this is the table most aggressively cached.
- **video_variants**: \`video_id\`, \`resolution\`, \`bitrate\`, \`codec\`,
  \`storage_path\` (pointer into blob storage / CDN origin) — one row per
  transcoded output. The manifest endpoint is essentially "list the variants
  for this video_id."
- **Blob storage** (not a relational table at all): the actual video segment
  files live in an object store (like S3), addressed by path, not queried
  relationally. This is deliberate — video bytes never belong in a database.
- **view_counts**: a counter per \`video_id\`, updated asynchronously and
  approximately (batched increments) rather than with a strongly consistent
  transaction per view — an exact count isn't worth serializing every viewer
  through.
- **comments**, **likes**: straightforward relational tables keyed by
  \`video_id\`, paginated for read, since a popular video's comment list can
  be enormous.

The metadata/counts/comments layer and the actual video bytes are
intentionally two different systems with two different scaling stories —
mixing them would force the metadata database to also absorb the enormous
bandwidth of serving video, which it's not built for.
  `.trim(),
  highLevelDesign: `
**Write path.** The client uploads the raw file in chunks, so a flaky
connection can resume instead of restarting. When the upload completes, the
file lands in blob storage and an event goes onto a queue.

Transcoding workers pick it up. Each worker (or set of parallel workers, one
per output) re-encodes the source into several resolutions and bitrates,
makes a thumbnail, writes each output to blob storage, and updates
\`video_variants\` as each finishes. The video becomes "ready" once enough
variants exist. The lowest resolution can go live before the rest are done.

**Read path.** This is almost fully decoupled from the write path. The
player fetches a small manifest listing the quality levels and where their
segments live. It then requests **segments** (a few seconds of video each)
one at a time, picking the next quality level based on measured download
speed. This is adaptive bitrate streaming.

Segment requests hit a CDN first. Only cache misses reach origin blob
storage. Popular videos have huge, overlapping audiences, so the CDN absorbs
most traffic.

Metadata, search, comments, recommendations, and view counting are
separate, independently scaled services behind an API gateway. Each has
storage suited to its access pattern: a search index for search, a
cache-backed metadata store for video info, and an async pipeline for view
counts and recommendation signals. No single shared database tries to serve
every query.
  `.trim(),
  highLevelDiagram: `
   Upload (rare)                          Playback (huge scale)
   ┌────────┐                             ┌────────┐
   │ Client │                             │ Client │
   └───┬────┘                             │(player)│
       │ chunked upload                   └───┬────┘
       ▼                                       │ manifest + segment requests
 ┌───────────┐                                 ▼
 │  Upload   │                          ┌──────────────┐
 │  Service  │                          │     CDN      │◀── cache hit (~most requests)
 └─────┬─────┘                          └──────┬───────┘
       │ raw file                              │ cache miss
       ▼                                        ▼
 ┌───────────┐        ┌───────────┐     ┌───────────────┐
 │   Blob    │◀───────│  Queue    │     │  Origin / Blob │
 │  Storage  │  event │(transcode │     │    Storage     │
 │  (raw)    │        │  jobs)    │     │ (all variants) │
 └───────────┘        └─────┬─────┘     └───────────────┘
                             ▼
                    ┌─────────────────┐
                    │  Transcoding     │
                    │  Worker Fleet    │──writes──▶ Blob Storage (variants)
                    └─────────────────┘             + video_variants table

                    ┌──────────────────────────────────┐
                    │  Metadata / Search / Recs / Views  │
                    │   (separate services, own stores)  │
                    └──────────────────────────────────┘
  `,
  deepDives: [
    {
      title: "The upload and transcoding pipeline",
      explanation: `
A video isn't "ready" when the upload finishes. It must be converted into a
streaming-friendly form, the most compute-heavy part of the system.

- The upload happens in **chunks**. A large file resumes where it left off
  after a dropped connection, and the service can start on data before the
  whole file arrives.
- The finished upload triggers a **job on a queue** instead of inline
  processing. Transcoding takes far longer than an HTTP request should
  block, so it must be async.
- **Transcoding workers** pull jobs and produce several outputs per video:
  resolutions from 240p up to 4K, often in several codecs, each split into
  small segments (a few seconds each) for adaptive streaming.
- Work is **parallelized per output**. The 480p worker doesn't wait for the
  1080p one, which keeps processing latency down as upload volume grows.
- The pipeline is idempotent and resumable. If a worker crashes mid-way,
  the job retries without corrupting or duplicating finished outputs. The
  video becomes "ready" only once a minimum set of variants exists.

The pipeline is off the user's request path. Its latency budget is minutes,
not milliseconds, so it can afford expensive work the playback path never
could.
      `.trim(),
    },
    {
      title: "Adaptive bitrate streaming and CDN distribution",
      explanation: `
One fixed quality for everyone either wastes bandwidth on fast connections
or stalls slow ones. Adaptive bitrate streaming (behind protocols like
HLS/DASH) fixes this by never sending the video as one file.

- Each video is encoded at several bitrates/resolutions and cut into short
  aligned segments (often a few seconds each). The player can switch
  quality at a segment boundary without a visible restart.
- A **manifest file** lists the quality levels and where their segments
  live. The player downloads it first, then requests segments one at a
  time, measuring its download speed and choosing each next segment's
  quality.
- Segment traffic, most of the system's bandwidth, is served from a
  **CDN**: edge servers near viewers that cache popular segments, so
  repeat requests never go back to origin.
- Popularity follows a power law, like a URL shortener's hot links but far
  bigger. A few videos get a huge share of views, so CDN hit rates stay
  very high even with a cache much smaller than the catalog.

Without a CDN, every segment request would hit origin, which would need
hundreds of Tbps globally. That's neither affordable nor sensible when most
traffic is the same popular content requested again and again by nearby
viewers.
      `.trim(),
    },
    {
      title: "View counts and recommendation data at scale",
      explanation: `
A view counter looks like a simple increment. But at billions of views a
day, one database row per video would become a huge write hotspot, and an
exact count isn't worth that cost.

- View events are **fire-and-forget messages on a queue**, not synchronous
  writes, so recording a view never slows playback.
- A stream processor **batches and aggregates** events (e.g. sums
  increments per video over short windows) before writing rollups. A
  little staleness buys a huge cut in writes to any single row.
- The same event stream feeds **recommendations**. What a user watched,
  for how long, and what came next are exactly the signals a model needs.
  View counts and model training share one event log instead of
  duplicating collection.
- Recommendations are served from a **precomputed** per-user or per-video
  candidate list, refreshed by an offline or near-real-time job. Ranking
  live on every page load would be far too slow at this scale.

Relaxing consistency here (counts and recommendations seconds to minutes
stale) cuts load a lot, and users don't notice.
      `.trim(),
    },
    {
      title: "Storage tiering and cost management",
      explanation: `
Treating a video watched once like one watched a billion times wastes money
at this scale.

- **Hot videos** (new, trending, or always popular) stay cached at CDN
  edges and may use faster storage tiers at origin.
- **Cold videos** (old, rarely watched) can live on cheaper, slower
  storage. For a few views a year, a CDN miss plus a slightly slower origin
  fetch is fine.
- Encoding every video in every resolution/codec up front is wasteful if
  most are only watched at 480p on mobile. Some designs transcode low
  resolutions eagerly (cheap, always useful) and defer very high ones until
  first requested, or re-encode cold content with cheaper/older codecs to
  reclaim storage.

The principle runs through the whole design: don't pay the same for rare
access as for common access. Work out which bucket content is in, and let
storage tier, cache placement, and even encoding effort follow.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
What breaks first is raw bandwidth, not the origin database. Serving video
bytes costs the most and moves the most data, so the CDN's cache hit rate is
the most important number in the system. If hit rate drops (say, a long,
even tail instead of a few big hits), origin bandwidth and cost spike.

The transcoding pipeline scales by adding workers behind the queue. It's
fully parallel across videos and even across resolutions of one video, so
it degrades gracefully: jobs wait longer instead of the system falling
over.

Metadata, search, and recommendations scale independently, each with the
usual playbook: read replicas and caching for metadata, sharding for the
search index, more consumers for the event stream.

The hard case is a sudden spike on one video that goes viral in minutes.
That's a cache-warming and origin-overload problem more than a capacity one.
It's usually handled by detecting fast popularity growth and pre-warming CDN
edges before the full spike arrives.
  `.trim(),
  tradeOffs: [
    {
      decision: "Asynchronous transcoding pipeline vs. processing on upload",
      explanation:
        "Transcode asynchronously on a queue, not during the upload request. Videos take minutes to become watchable, but uploads stay fast and don't hold an HTTP connection open while encoding runs. A synchronous approach is simpler to reason about, but can't scale separately from upload traffic and keeps users waiting far too long.",
    },
    {
      decision: "CDN-first delivery vs. serving from origin storage directly",
      explanation:
        "Push almost all playback through a CDN. The cost is a more complex delivery pipeline (cache invalidation, edge placement, cache-miss handling) and the CDN's real price. Serving from origin is simpler but can't sustain video-scale bandwidth, and every viewer's latency would depend on their distance from one origin region.",
    },
    {
      decision: "Eventually consistent view counts vs. exact, strongly consistent counts",
      explanation:
        "Aggregate view counts asynchronously and let them be briefly stale, avoiding write contention on one counter under billions of daily increments. An exact, strongly consistent count would need serialized writes, a severe bottleneck at this load, for a guarantee users don't need.",
    },
    {
      decision: "Storing every transcoded variant vs. transcoding on demand",
      explanation:
        "Pre-transcode into several resolutions so playback never waits on encoding. The cost is several times the raw storage, including rarely requested variants. On-demand transcoding saves storage but adds unacceptable latency to the first request for a quality level, and repeats the same expensive work for each popular video's first viewer at each resolution.",
    },
  ],
  interviewTips: [
    "Split the problem early into upload/transcoding (write path) and streaming/delivery (read path). They have almost nothing in common, and interviewers want to see you notice.",
    "Raise adaptive bitrate streaming and CDN caching before being asked. They're the two ideas that most define this system.",
    "Justify eventual consistency for view counts and recommendations. Say why exactness isn't worth the cost.",
    "Mention that transcoding must be async and idempotent, and that a video can go live before every resolution is done.",
    "If time allows, discuss storage tiering (hot vs. cold content). It shows you think about cost, not just correctness.",
    "Don't spend the whole interview on recommendations. They matter, but they're a much smaller design surface than upload/transcode/stream.",
  ],
  relatedTopics: ["cdn", "caching", "queues", "load-balancing", "sharding", "consistency-models", "scalability"],
  keywords: ["youtube", "video streaming", "adaptive bitrate", "transcoding", "cdn", "system design interview", "video upload pipeline"],
};
