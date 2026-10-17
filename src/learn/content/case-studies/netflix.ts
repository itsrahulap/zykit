import type { CaseStudy } from "../../types/caseStudy";

export const netflixCaseStudy: CaseStudy = {
  id: "netflix",
  title: "Netflix",
  difficulty: "Hard",
  summary:
    "Design a subscription streaming service: a fixed, licensed catalog watched by tens of millions at once, on any device, resuming exactly where you left off.",
  problemStatement: `
A subscriber picks a show on their TV. It starts within a second or two, at
the quality their connection supports, with subtitles and the right audio
track. Later, on their phone on the train, it resumes from the exact second
they stopped. Millions of others do the same worldwide at the same time,
especially in the evening in every timezone.

This looks like a general video platform, but with one key difference. The
catalog is small and mostly fixed (thousands to tens of thousands of titles,
prepared in advance), not billions of user uploads arriving nonstop.

So the hard problem isn't "transcode endless uploads fast." It's "prepare a
known catalog thoroughly, and deliver it to a huge, simultaneous, global
audience with rock-solid playback." Personalization is hard too: with a
catalog too big to browse, what should this person see first?

Three problems sit at the center:

- Encoding each title into every format any device might need.
- Delivering it to millions of concurrent viewers without the network
  becoming the bottleneck.
- Working out, per user, what to recommend and which second to resume
  from.

Throughout, brief network hiccups are treated as normal, not exceptional.
  `.trim(),
  requirements: {
    functional: [
      "A subscriber can browse a personalized home page of recommended titles and search the catalog.",
      "A subscriber can play any title, with playback adapting automatically to their current network conditions.",
      "Playback position is tracked per user per title, so watching can resume from the same point on a different device.",
      "Subtitles and multiple audio tracks are available and switchable during playback.",
      "New titles are encoded into all required formats/qualities before becoming available for streaming.",
      "The system supports many simultaneous streams per household/account, up to a plan limit.",
    ],
    nonFunctional: [
      "Playback must start almost instantly and never noticeably buffer, even under variable and international network conditions.",
      "Traffic is extremely bursty around predictable peak hours (evenings) in each region, and around specific high-profile title releases.",
      "The system must serve tens of millions of concurrent streams globally without a single origin data center absorbing that bandwidth directly.",
      "Personalization/recommendation quality directly drives engagement and must be computed for every user without slowing page loads.",
      "Playback-position tracking can tolerate brief staleness (a few seconds of resume-point drift) in exchange for not adding latency to every second of playback.",
      "The catalog itself changes relatively slowly (licensing/production timelines), unlike a firehose of user uploads.",
    ],
  },
  capacityEstimation: [
    {
      label: "Subscribers",
      value: "~250 million",
      note: "A reasonable order-of-magnitude assumption for a large global streaming service, used to anchor concurrency and bandwidth numbers below.",
    },
    {
      label: "Peak concurrent streams",
      value: "~15-20 million",
      note: "Not all subscribers watch at once, but usage clusters heavily around regional evening peak hours across many timezones, so peak concurrency is a large fraction of total subscribers, not an even 1/86,400th of daily views.",
    },
    {
      label: "Peak aggregate bandwidth",
      value: "Multiple hundreds of Tbps",
      note: "~15-20 million concurrent streams * an average bitrate in the low single-digit Mbps (varies by device/quality) — this is the number that makes a single origin architecture a non-starter.",
    },
    {
      label: "Catalog size",
      value: "~10,000-20,000 titles",
      note: "Small compared to a user-generated platform — licensed/produced content, curated and finite, which is what makes exhaustive pre-encoding of every title feasible.",
    },
    {
      label: "Encoded storage per title",
      value: "Tens of GB to low hundreds of GB per title",
      note: "Each title is encoded into many resolution/bitrate/codec/device combinations — the multiplier from source file to fully-encoded catalog entry is large, but the total catalog is still small enough to fully replicate to edge caches.",
    },
    {
      label: "Playback events per second",
      value: "Millions/second across all concurrent streams",
      note: "Every few seconds, each of ~15-20 million concurrent streams reports playback progress/position — enough volume that this must be handled as a high-throughput, asynchronous stream rather than a synchronous write per event.",
    },
  ],
  capacityNotes:
    "The catalog is small enough to pre-encode fully and push almost entirely to the edge. The audience and bandwidth are too large for origin to ever serve directly. That split (encode thoroughly and rarely, serve constantly from everywhere) justifies building or contracting a dedicated CDN instead of general cloud bandwidth. It's also why playback-position updates are a high-volume async stream, not a transaction per event.",
  apiDesign: [
    { method: "GET", path: "/api/v1/home", description: "Returns the personalized home page: rows of recommended/curated title lists for the current user." },
    { method: "GET", path: "/api/v1/search?q=", description: "Searches the catalog by title, actor, or genre." },
    { method: "GET", path: "/api/v1/titles/{titleId}/manifest", description: "Returns the adaptive-bitrate manifest for a title, including available audio/subtitle tracks." },
    { method: "GET", path: "/api/v1/titles/{titleId}/playback-position", description: "Returns the last saved playback position for the current user/profile on this title." },
    { method: "POST", path: "/api/v1/titles/{titleId}/playback-position", description: "Reports current playback progress; accepted as a fire-and-forget, asynchronously processed event." },
    { method: "GET", path: "/api/v1/profiles/{profileId}/continue-watching", description: "Returns titles the profile has partially watched, ordered by recency." },
    { method: "POST", path: "/api/v1/admin/titles/{titleId}/encode", description: "Internal: triggers the encoding pipeline for a newly ingested title across all target formats." },
  ],
  dataModel: `
- **titles**: \`title_id\`, \`name\`, \`type\` (movie/series/episode), \`genre\`,
  \`metadata\` (cast, description, release date). Small, read constantly,
  cached almost everywhere.
- **title_variants**: \`title_id\`, \`resolution\`, \`bitrate\`, \`codec\`,
  \`audio_track\`, \`subtitle_track\`, \`storage_path\` — one row per encoded
  output, exactly analogous to a general video platform's variant table, but
  produced by a controlled ingest pipeline rather than arbitrary user
  uploads.
- **viewing_history / playback_position**: keyed by \`(profile_id,
  title_id)\`, storing \`position_seconds\` and \`updated_at\` — written very
  frequently (every few seconds during playback) and read once per
  "continue watching" lookup, which is why it's backed by a fast key-value
  store rather than the same database as titles, and why writes are batched/
  asynchronous rather than a transaction per update.
- **profiles**: multiple profiles per account, each with its own viewing
  history and recommendations — personalization is scoped to the profile,
  not the billing account.
- **recommendation candidates** (precomputed, per profile): a ranked list of
  title ids refreshed periodically by an offline job, so loading the home
  page is a fast lookup of already-computed results, not a live ranking
  computation per request.

Splitting playback-position tracking into its own fast, high-write store —
separate from the relatively static \`titles\` metadata — mirrors the same
principle as separating video bytes from metadata: two wildly different
access patterns (rare, small, read-heavy vs. constant, tiny, write-heavy)
should never share one storage system.
  `.trim(),
  highLevelDesign: `
New content goes through a controlled **ingest and encoding pipeline**. A
studio-quality source file comes in, and the pipeline produces every
resolution/bitrate/codec/audio/subtitle combination needed, before any
viewer asks for it. The catalog is small and known, so this can be
thorough: a title is encoded dozens of ways to get the best quality per bit
at each target bitrate. It happens once per title, not once per upload.

Encoded content is pushed proactively to a **global edge delivery
network**, with servers as close to subscribers as possible, often inside
ISP networks. Most playback traffic never reaches Netflix's own data
centers. The player fetches a manifest of quality/audio/subtitle options,
then streams segments from the nearest edge server, adjusting quality to
measured throughput (standard adaptive bitrate streaming).

Two more systems sit alongside playback:

- A **personalization/recommendation pipeline** uses viewing behavior to
  precompute what each profile should see, refreshed on a schedule, not
  per request.
- A lightweight, high-throughput **playback-position service** absorbs a
  constant stream of "where is this viewer now" updates. This makes
  cross-device resume work without adding latency to the video stream.
  `.trim(),
  highLevelDiagram: `
   Ingest (rare, thorough)                  Playback (huge, constant)
   ┌───────────┐                            ┌────────┐
   │  Studio    │                           │ Client │
   │  Source     │                          │(any     │
   │  File       │                          │ device)│
   └─────┬─────┘                            └───┬────┘
         │                                        │ manifest + segments
         ▼                                        ▼
   ┌─────────────┐                        ┌───────────────┐
   │  Encoding    │                       │  Edge / CDN    │◀── nearly all
   │  Pipeline    │                       │  (near viewer, │    requests
   │ (many        │                       │  often inside  │    served here
   │  formats)    │                       │  ISP networks) │
   └─────┬───────┘                        └───────┬────────┘
         │ push proactively                       │ rare cache miss
         ▼                                         ▼
   ┌─────────────┐                        ┌───────────────┐
   │  Origin Blob │────────────────────▶  │ (fallback path)│
   │  Storage     │                       └───────────────┘
   └─────────────┘

   ┌─────────────────────┐        ┌───────────────────────────┐
   │ Playback-Position     │       │ Recommendation Pipeline    │
   │ Service (async,       │       │ (offline, precomputes home │
   │ high write volume)    │       │ page rows per profile)     │
   └─────────────────────┘        └───────────────────────────┘
  `,
  deepDives: [
    {
      title: "Encoding a fixed catalog exhaustively for every device",
      explanation: `
The catalog is small and known well before release, so the pipeline can do
far more work per title than a platform ingesting millions of uploads.

- Each title is encoded into **many resolution/bitrate pairs**, often in
  several **codecs**: older, widely compatible ones for older devices and
  newer, more efficient ones where supported. One size would waste
  bandwidth on capable devices or fail on constrained ones.
- Encoding is often **tuned per title**, not just per resolution. A
  fast action scene and a static dialogue scene compress very differently,
  so the pipeline analyzes content and allocates bitrate for the best
  quality per bit. That's worth it only because each title is encoded once
  and watched enormously often.
- Subtitles and audio tracks are packaged with the video variants. The
  manifest lists them all, so the player can switch languages/captions
  without re-fetching the stream.
- All of this happens **before** a title goes live, so none of it is on
  the playback path. A slow, careful encoding job is fine here.

It's the same problem as user-generated transcoding (make many playable
variants), but the smaller, predictable input justifies far more compute
per title.
      `.trim(),
    },
    {
      title: "Edge caching and a purpose-built delivery network",
      explanation: `
At this concurrency and bandwidth, streaming is a delivery problem. General
cloud infrastructure, or even a standard third-party CDN, can struggle to
handle it cheaply and reliably worldwide. That's why large streaming
services build (or heavily invest in) their own edge delivery.

- Appliances sit as close to viewers as possible, often inside **ISP
  networks**, so popular content never crosses the wider internet
  backbone.
- The catalog is small and known, so it's feasible to **proactively push**
  all of it (or the popular part, region by region) to edge nodes before
  demand, instead of only filling caches after a first request. An
  unpredictable, growing catalog of user uploads wouldn't allow this.
- Regional demand is predictable (evening peaks, a new season), so the
  system pre-warms capacity and pre-positions content before spikes.
- An edge miss falls back toward origin, but the architecture makes this
  rare.

The lesson applies beyond video: when you can predict what will be
requested and where, proactive placement instead of reactive caching is
often the difference between surviving peak load and not noticing it.
      `.trim(),
    },
    {
      title: "Personalization and recommendations at scale",
      explanation: `
With a catalog too big to browse, what appears first on the home page
strongly shapes what people watch. Ranking live for hundreds of millions of
profiles on every page load would be expensive and unnecessary.

- Viewing behavior (what was watched, how much, what was skipped, what came
  next) is captured as an **event stream**, like the pipeline behind view
  counts on any video platform.
- Models are trained and **candidate lists are precomputed** per profile,
  offline or in near-real-time batches. The home page endpoint becomes a
  fast lookup of a ranked list, not a live ML call blocking the page.
- Different home page rows (genres, "because you watched X", trending)
  often come from **different specialized models**, merged and ordered by a
  lightweight ranking layer at request time. Heavy work happens offline;
  cheap composition happens online.
- Recommendations don't need to be perfectly fresh. A model trained on
  yesterday's viewing is still useful today, so hours of staleness is a
  deliberate, acceptable trade.

As with view counts on video platforms, relaxing freshness for a signal
that needn't be real-time removes a lot of work from the hot request path.
      `.trim(),
    },
    {
      title: "Resumable playback across devices",
      explanation: `
Pausing on the TV and resuming on the phone needs the exact position
remembered. Capturing it without slowing playback means treating it as a
very different kind of write than, say, a purchase.

- The player reports **progress events** every few seconds to a small,
  dedicated position service. Reports are async, so a slow or failed one
  never stalls the video.
- The service uses a **fast key-value store** keyed by
  \`(profile_id, title_id)\`, built for very frequent small writes and rare
  reads (one lookup when the user opens "continue watching" or resumes).
  That's the opposite of the \`titles\` table's access pattern.
- Writes are **batched or throttled** on the client (every few seconds,
  not every frame) and **overwritten**, not appended. Only the latest
  position matters, so the store stays small however much people watch.
- Resuming a couple of seconds off is a fine trade for not making playback
  wait on a confirmed, durable write every few seconds.

This shows picking storage for the access pattern instead of reusing the
database with the "important" data. Position tracking is high-volume and
low-stakes per write, and deserves infrastructure built for that.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
The first limit is bandwidth and edge capacity during predictable peaks
(evenings, a hit release, regional events), not compute. The fix is mostly
proactive: predict where and when demand will spike, and pre-position
content and capacity before it arrives.

A title that unexpectedly goes global is handled like a viral video:
fast cache-warming and, if needed, lowering bitrate for some viewers
instead of buffering for everyone.

The playback-position and recommendation pipelines partition by
user/profile. One profile's data doesn't depend on another's, so both
shard and scale independently of video delivery.

The encoding of one very large title (a long film at the highest quality
tiers) doesn't parallelize as cleanly. But encoding happens well before
release, so no viewer waits on it.
  `.trim(),
  tradeOffs: [
    {
      decision: "Exhaustive per-title encoding vs. a smaller, one-size-fits-most set of formats",
      explanation:
        "Encode the catalog into many resolution/bitrate/codec combinations, sometimes tuned per title, at a real upfront cost in compute and storage. It's affordable because the catalog is small and each title is watched enormously often. It wouldn't make sense where most uploads get only a handful of views.",
    },
    {
      decision: "Proactive edge content placement vs. reactive cache-fill on first request",
      explanation:
        "Push popular and predictably demanded content to edge nodes before viewers ask. This adds operational work (what to pre-position, where, and when) but avoids cold-cache misses at predictable peaks. A purely reactive cache is simpler, but the first wave of a peak (e.g. a new season's release) would hit origin before the cache warms.",
    },
    {
      decision: "Precomputed, periodically-refreshed recommendations vs. live per-request ranking",
      explanation:
        "Compute recommendation candidates offline or in batches and serve them as a fast lookup. They're minutes to hours stale instead of reflecting the latest session. Live ranking is fresher but puts expensive model inference on every home page load, which doesn't scale to hundreds of millions of loads.",
    },
    {
      decision: "Asynchronous, overwrite-only playback position tracking vs. a durable, transactional history",
      explanation:
        "Report position asynchronously and keep only the latest value, accepting a few seconds of drift for very cheap, high-frequency writes. A durable, transactional log of every update would never lose data, but adds write latency and storage cost with no user benefit, since only the latest position is ever read.",
    },
  ],
  interviewTips: [
    "Set this apart from a general video platform early. A small, known, licensed catalog changes what's worth optimizing (exhaustive per-title encoding, proactive edge placement) compared to endless user uploads.",
    "Lead with CDN/edge delivery. It defines this design, and mentioning ISP-embedded edge servers shows real depth.",
    "Explain why recommendations are precomputed, and quantify why live ranking wouldn't scale to the request volume.",
    "Treat playback-position tracking as its own small subsystem with its own storage choice, not part of general user data.",
    "Raise predictable peak-hour patterns (regional evenings, big releases) and proactive pre-warming as a scaling strategy, not just reactive autoscaling.",
  ],
  relatedTopics: ["cdn", "caching", "load-balancing", "sharding", "consistency-models", "scalability", "queues"],
  keywords: ["netflix", "video streaming", "adaptive bitrate", "cdn", "edge caching", "recommendations", "system design interview"],
};
