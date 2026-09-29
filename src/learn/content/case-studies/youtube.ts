import type { CaseStudy } from "../../types/caseStudy";

export const youtubeCaseStudy: CaseStudy = {
  id: "youtube",
  title: "YouTube",
  difficulty: "Hard",
  summary:
    "Design a video platform where anyone can upload a video and anyone else can watch it instantly, at whatever quality their connection supports.",
  problemStatement: `
Someone uploads a video file from their phone. Minutes later, millions of
people across the world — on fast fiber connections and on shaky mobile data
— need to be able to watch that video, starting almost instantly, without it
stuttering, and without YouTube's own servers being the ones streaming every
single byte to every single viewer. That's the product: upload once, watch
anywhere, on any device, on any network.

The hard part isn't storing a video file — that's a solved problem. The hard
part is that a raw uploaded file is usually a poor fit for playback: it might
be a huge, unoptimized format, encoded for one specific screen size and
network speed. A viewer on a slow train connection and a viewer on a home
fiber line watching the same video need genuinely different versions of that
file, and neither should have to wait for it to be prepared for them
individually, in real time.

So the system actually being designed has two very different jobs bolted
together: a **write-side pipeline** that takes a raw upload and turns it into
many playable variants, and a **read-side delivery problem** — getting
whichever variant fits a viewer's device and network, from somewhere close to
that viewer, fast. Everything else (search, comments, recommendations, view
counts) sits on top of that core.
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
    "Every number here says the same thing from a different angle: uploads are rare and can be handled asynchronously, but views are enormous, globally distributed, and bandwidth-dominated. That combination pushes the design toward two clearly separated concerns — an offline, horizontally-scalable transcoding pipeline for the write side, and a CDN-first, cache-everywhere delivery strategy for the read side — rather than one system trying to do both well.",
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
The **write path** starts when a client uploads a raw file in chunks (so a
flaky connection can resume instead of restarting). Once the upload
completes, the raw file lands in blob storage and an event is dropped onto a
queue, which a fleet of transcoding workers picks up. Each worker (or set of
parallel workers, one per output) re-encodes the source into multiple
resolutions and bitrates, generates a thumbnail, and writes each output back
to blob storage, updating the \`video_variants\` table as each one finishes.
The video's status flips to "ready" once enough variants exist to start
serving it — the video doesn't need every resolution done before the lowest
one can go live.

The **read path** is almost entirely decoupled from all of that. A viewer's
player first fetches a small manifest listing available quality levels and
where their segments live, then requests video **segments** (a few seconds of
video each) one at a time, adjusting which quality level it asks for next
based on measured download speed — this is adaptive bitrate streaming. Those
segment requests hit a CDN first; only a cache miss ever reaches the origin
blob storage, and because popular videos are watched by huge, overlapping
audiences, the CDN absorbs the overwhelming majority of traffic.

Everything else — metadata, search, comments, recommendations, view counting
— is layered on top as separate, independently scaled services behind an API
gateway, each reading from its own storage tuned to its own access pattern
(a search index for search, a cache-backed metadata store for video info, an
async pipeline for view counts and recommendation signals) rather than one
shared database trying to serve every kind of query well.
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
A video isn't "ready" the instant a file finishes uploading — it has to be
converted into a form built for streaming, and that conversion is the most
compute-heavy part of the whole system.

- The raw upload happens in **chunks**, so a large file can resume from where
  it left off after a dropped connection instead of starting over, and so the
  service can start acting on data before the entire file has arrived.
- Once uploaded, the raw file triggers a **job on a queue** rather than being
  processed inline — transcoding a video can take far longer than an HTTP
  request should ever block for, so it has to be asynchronous by design.
- A fleet of **transcoding workers** pulls jobs off the queue and produces
  several outputs per video: multiple resolutions (240p up to 4K) and often
  multiple codecs, each split into small segments (a few seconds each) for
  adaptive streaming.
- Work can be **parallelized per output** — one worker producing 480p doesn't
  need to wait for another producing 1080p — which is what lets a large
  video fleet keep processing latency down even as upload volume grows.
- The pipeline is idempotent and resumable: if a worker crashes partway
  through a resolution, the job can be retried without corrupting or
  duplicating already-completed outputs, and the video's status only flips
  to "ready" once a minimum viable set of variants exists.

This pipeline is entirely off the request/response path a user experiences —
its latency budget is minutes, not milliseconds, which is exactly why it can
afford to do expensive, thorough work that the playback path never could.
      `.trim(),
    },
    {
      title: "Adaptive bitrate streaming and CDN distribution",
      explanation: `
Sending one fixed-quality video to every viewer would mean either wasting
bandwidth on viewers who could handle more, or stalling out viewers on weak
connections who can't handle what was sent. Adaptive bitrate streaming (the
approach behind protocols like HLS/DASH) solves this by never sending "the
video" as one file at all.

- Each video is encoded at several bitrates/resolutions and chopped into
  short segments (commonly a few seconds each), all aligned so a player can
  switch between quality levels at a segment boundary without a visible
  restart.
- A **manifest file** lists the available quality levels and where their
  segments live; the player downloads that first, then requests segments one
  at a time, continuously measuring its own download speed and choosing the
  next segment's quality level accordingly.
- All of that segment traffic — the overwhelming majority of the system's
  total bandwidth — is served from a **CDN**: edge servers geographically
  close to viewers, caching popular segments so repeated requests for the
  same popular video never have to travel back to origin storage at all.
- Popularity follows a power-law distribution, just like a URL shortener's
  hot links but at a vastly larger scale: a small number of videos account
  for a huge share of total views, which is precisely the pattern that makes
  CDN caching so effective here — cache hit rates stay very high even with a
  cache far smaller than the entire catalog.

Without a CDN in front of this, every viewer's segment requests would hit
origin storage directly, and origin bandwidth would need to scale to
hundreds of Tbps globally — which is neither affordable nor physically
sensible when most of that traffic is the same popular content being
requested over and over from nearby viewers.
      `.trim(),
    },
    {
      title: "View counts and recommendation data at scale",
      explanation: `
A "views" counter looks like it should be a simple increment, but at billions
of views a day, incrementing one row in a database per view would make that
row an enormous point of write contention, and an exactly-correct count
isn't actually worth what that would cost.

- View events are emitted as **fire-and-forget messages onto a queue**
  rather than synchronous writes, so recording a view never adds latency to
  playback.
- A stream-processing layer **batches and aggregates** those events (e.g. sum
  view increments per video over short windows) before writing rollups to
  the counts store, trading a small amount of staleness for a massive
  reduction in write volume against any single row.
- The same event stream feeds **recommendations**: what a user watched, for
  how long, and what they watched next are exactly the signals a
  recommendation model needs, so the pipeline that updates view counts and
  the pipeline that trains/updates recommendation models draw from the same
  underlying event log rather than duplicating collection logic.
- Recommendations themselves are typically served from a **precomputed**
  per-user or per-video candidate list, refreshed periodically by an offline
  or near-real-time job, rather than computed from scratch on every page
  load — computing a personalized ranking live for every request at this
  scale would be far too slow.

This is a case where relaxing consistency (counts and recommendations that
are seconds-to-minutes stale) buys a large, necessary reduction in system
load, and users genuinely don't notice or care about the staleness.
      `.trim(),
    },
    {
      title: "Storage tiering and cost management",
      explanation: `
Not every video gets watched the same amount, and treating a video watched
once and a video watched a billion times identically wastes money at this
scale.

- **Hot videos** (recently uploaded, currently trending, or perpetually
  popular) are kept aggressively cached at CDN edges and possibly served from
  faster storage tiers at origin.
- **Cold videos** (old, rarely watched) can live on cheaper, slower storage
  tiers — the origin doesn't need to serve them fast because almost nobody
  is requesting them, and a CDN cache miss followed by a slightly slower
  origin fetch is an acceptable trade for videos with a handful of views a
  year.
- Encoding every video into every resolution/codec combination up front is
  wasteful if most of them will only ever be watched at 480p on mobile;
  some designs transcode lower resolutions eagerly (cheap, always useful) and
  defer very high resolutions until first requested, or re-encode with
  cheaper/older codecs for cold content to reclaim storage.

The underlying principle is the same one that shows up everywhere in this
design: don't pay the same cost for rare access as for common access — detect
which bucket a piece of content falls into, and let storage tier, cache
placement, and even encoding effort follow that.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
The first thing to break at real scale is never the origin database — it's
raw bandwidth: however good the transcoding pipeline is, serving video bytes
to viewers is what actually costs the most and moves the most data, so the
CDN's cache hit rate is the single most important number in the whole
system. A drop in hit rate (a catalog with a very long, evenly-distributed
tail rather than a few breakout hits) directly translates into origin
bandwidth and cost spiking.

Beyond that, the transcoding pipeline scales by adding more worker capacity
behind the queue — it's embarrassingly parallel across videos and even across
resolutions of the same video, so it degrades gracefully under load (jobs
queue up and take longer to start, rather than the system falling over).
Metadata, search, and recommendation services scale independently of both of
those, each by the usual playbook for their own storage (read replicas and
caching for metadata, sharding for a search index, more consumers for the
event stream). The one piece that genuinely resists easy scaling is a
sudden, unexpected spike on a single video (something goes viral in minutes)
— that's a cache-warming and origin-overload problem more than a
capacity-planning one, and is usually handled by detecting rapid
popularity growth and proactively pre-warming CDN edges before the full
spike arrives.
  `.trim(),
  tradeOffs: [
    {
      decision: "Asynchronous transcoding pipeline vs. processing on upload",
      explanation:
        "Transcoding is done asynchronously on a queue rather than synchronously during the upload request, trading a delay of minutes before a video is watchable for an upload path that stays fast and doesn't hold an HTTP connection open for as long as encoding takes. A synchronous approach would make uploads simpler to reason about, but couldn't scale independently of upload traffic and would leave users waiting on a request for far longer than is reasonable.",
    },
    {
      decision: "CDN-first delivery vs. serving from origin storage directly",
      explanation:
        "Almost all playback traffic is pushed through a CDN, at the cost of a more complex delivery pipeline (cache invalidation, edge placement, cache-miss handling) and real financial cost for the CDN itself. The alternative — serving from origin — is simpler but cannot physically sustain the bandwidth video platforms require, and would put every viewer's latency at the mercy of their distance from a single origin region.",
    },
    {
      decision: "Eventually consistent view counts vs. exact, strongly consistent counts",
      explanation:
        "View counts are aggregated asynchronously and allowed to be briefly stale, in exchange for avoiding write contention on a single counter under billions of daily increments. A strongly consistent exact count would be correct at every instant but would require serializing writes in a way that becomes a severe bottleneck under this load, for a guarantee users don't actually need.",
    },
    {
      decision: "Storing every transcoded variant vs. transcoding on demand",
      explanation:
        "Pre-transcoding into multiple resolutions ahead of time means playback never waits on encoding, at the cost of several times the storage footprint of the raw uploads, including variants that may rarely be requested. On-demand transcoding would save storage but would add unacceptable latency to a viewer's first request for a quality level, and would repeat the same expensive CPU work for every popular video's first viewer at any given resolution.",
    },
  ],
  interviewTips: [
    "Split the problem out loud into upload/transcoding (write path) and streaming/delivery (read path) early — they have almost nothing in common and interviewers want to see you recognize that.",
    "Bring up adaptive bitrate streaming and CDN caching before being asked; they're the two ideas that most define this system.",
    "Justify eventual consistency for view counts and recommendations explicitly — say why exactness isn't worth the cost, don't just assume it.",
    "Mention that transcoding must be asynchronous and idempotent, and that a video can go live before every resolution finishes processing.",
    "If time allows, discuss storage tiering (hot vs. cold content) — it shows you're thinking about cost, not just correctness.",
    "Don't spend the whole interview on recommendations — it's a real part of the system but a much smaller design surface than upload/transcode/stream.",
  ],
  relatedTopics: ["cdn", "caching", "queues", "load-balancing", "sharding", "consistency-models", "scalability"],
  keywords: ["youtube", "video streaming", "adaptive bitrate", "transcoding", "cdn", "system design interview", "video upload pipeline"],
};
