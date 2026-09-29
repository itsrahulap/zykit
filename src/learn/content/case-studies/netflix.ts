import type { CaseStudy } from "../../types/caseStudy";

export const netflixCaseStudy: CaseStudy = {
  id: "netflix",
  title: "Netflix",
  difficulty: "Hard",
  summary:
    "Design a subscription video-streaming service: a fixed, licensed catalog watched by tens of millions of people simultaneously, on every device, with playback that resumes exactly where you left off.",
  problemStatement: `
A subscriber opens the app on their TV, picks a show, and it starts playing
within a second or two, at whatever quality their home connection supports,
with subtitles and the right audio track available. Later that day they open
the same show on their phone on the train, and it resumes from the exact
second they stopped watching on the TV. Millions of other subscribers are
doing the same thing, worldwide, at the same time, especially in the hours
right after dinner in every timezone.

This looks similar to a general video platform, but the shape of the problem
is different in an important way: the catalog is small and mostly fixed
(thousands to tens of thousands of titles, prepared carefully in advance),
not billions of user-generated uploads arriving continuously. That changes
the hard problems — instead of "how do we transcode an endless stream of
arbitrary uploads fast," it becomes "how do we prepare a known catalog
exhaustively well, and get it to an enormous, simultaneous, globally
distributed audience with rock-solid playback quality," plus a genuinely hard
personalization problem: with a catalog too large for anyone to browse
title by title, what should this specific person see first?

So three problems sit at the center of the design: encoding each title into
every format any device might need, delivering that encoded content to
millions of concurrent viewers without the network becoming the bottleneck,
and figuring out, per user, what to recommend and exactly which second to
resume from — all while treating brief network hiccups as normal rather than
exceptional.
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
    "The numbers point toward a catalog small enough to be pre-encoded exhaustively and pushed almost entirely to the edge, but a concurrent audience and bandwidth demand large enough that origin infrastructure could never serve it directly. That split — encode thoroughly and rarely, serve constantly and from everywhere — is what justifies building (or contracting) a dedicated content-delivery network rather than relying on general-purpose cloud bandwidth, and why playback-position updates are handled as a high-volume async stream rather than a per-event transaction.",
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
New content goes through a controlled **ingest and encoding pipeline**: a
studio-quality source file is submitted, and an encoding pipeline produces
every resolution/bitrate/codec/audio/subtitle combination the catalog needs
to support, ahead of any viewer requesting it. Because the catalog is small
and known in advance (unlike a firehose of user uploads), this work can
afford to be thorough — encoding a title dozens of ways to squeeze out
quality-per-bit at every target bitrate — since it happens once per title,
not once per upload from millions of users.

Once encoded, content is pushed proactively to a **globally distributed edge
delivery network** — servers placed as close as possible to where
subscribers actually watch, in many cases inside ISP networks themselves —
so that the overwhelming majority of playback traffic never has to travel
back to Netflix's own data centers at all. A viewer's player fetches a
manifest listing available quality/audio/subtitle options, then streams
segments from the nearest edge server, continuously adjusting quality based
on measured throughput, exactly as adaptive bitrate streaming works for any
video platform.

Two more systems sit alongside playback: a **personalization/recommendation
pipeline** that consumes viewing behavior to precompute what each profile
should see, refreshed on a schedule rather than live per request, and a
lightweight, high-throughput **playback-position service** that absorbs a
constant stream of "where is this viewer right now" updates so that
resuming on another device works, without that bookkeeping ever adding
latency to the actual video stream.
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
Because the catalog is small relative to a user-generated platform and known
well in advance of release, the encoding pipeline can afford to do far more
work per title than a system ingesting millions of arbitrary uploads ever
could.

- Each title is encoded into **many resolution/bitrate pairs**, and often
  multiple **codecs** (older, widely-compatible codecs for older devices;
  newer, more efficient codecs for devices that support them), because
  "one size fits all" would either waste bandwidth on capable devices or
  fail entirely on constrained ones.
- Encoding parameters are frequently **tuned per title**, not just per
  resolution — a fast-motion action scene and a static dialogue scene
  compress very differently, so higher-effort pipelines analyze content and
  adjust bitrate allocation accordingly to get the best quality per bit,
  something worth doing only because each title is encoded once and watched
  an enormous number of times afterward.
- Subtitles and multiple audio tracks are prepared and packaged alongside
  the video variants, and the manifest exposes all of them so a player can
  switch languages/captions without re-fetching the whole stream.
- Because this all happens **before** a title becomes available to watch,
  none of this work sits on the playback critical path — a slow, careful
  encoding job is fine here in a way it would not be fine if it blocked a
  user's request.

This is the mirror image of a user-generated video platform's transcoding
pipeline: same underlying problem (produce many playable variants), but a
much smaller, more predictable input volume justifies spending far more
computation per title.
      `.trim(),
    },
    {
      title: "Edge caching and a purpose-built delivery network",
      explanation: `
Streaming at this concurrency and bandwidth is fundamentally a delivery
problem, and general-purpose cloud infrastructure or even a standard
third-party CDN can struggle to absorb it cheaply and reliably at global
scale — which is why large streaming services build (or deeply invest in)
their own edge delivery infrastructure.

- Appliances are placed as close to viewers as possible, in many cases
  physically inside **ISP networks**, so that popular content is served
  without ever traversing the wider internet backbone at all.
- Because the catalog is small and known, it's feasible to **proactively
  push** the entire catalog (or the popular fraction of it, region by
  region) to edge nodes ahead of demand, rather than relying purely on
  reactive cache-fill after a first request — a meaningfully different
  strategy than an unpredictable, ever-growing catalog of user uploads would
  allow.
- Regional demand is predictable (evening peak hours, a new season
  releasing) which lets the system pre-warm capacity and pre-position
  content ahead of expected spikes rather than reacting to them.
- A cache miss at the edge falls back toward origin storage, but this path
  is deliberately rare — the entire architecture is built so that it's the
  exception, not the common case.

The lesson generalizes beyond streaming video: when you can predict what
will be requested and from where, moving from reactive caching to proactive
placement is often the difference between a system that merely survives
peak load and one that never notices it.
      `.trim(),
    },
    {
      title: "Personalization and recommendations at scale",
      explanation: `
With a catalog far too large to browse exhaustively, what appears first on a
subscriber's home page has an outsized effect on what they actually watch —
and computing a good, personalized ranking for hundreds of millions of
profiles on every page load is both expensive and unnecessary to do live.

- Viewing behavior (what was watched, how much of it, what was skipped,
  what was watched right after) is captured as an **event stream**, the same
  kind of pipeline that feeds view counts and analytics on any video
  platform.
- Recommendation models are trained and **candidate lists are precomputed**
  offline or in near-real-time batches per profile, not calculated fresh on
  every request — the home page endpoint becomes a fast lookup of an
  already-ranked list rather than a live machine-learning inference call
  blocking a page load.
- Different rows on the home page (genres, "because you watched X",
  trending) often come from **different specialized models**, merged and
  ordered by a lighter-weight ranking layer at request time — heavy
  computation happens offline, cheap composition happens online.
- Recommendations don't need to be perfectly fresh — a model trained on
  yesterday's viewing behavior is still useful today — so staleness on the
  order of hours is an acceptable, deliberate trade.

This mirrors the view-count problem on general video platforms: relaxing
freshness requirements on a signal that doesn't need to be real-time buys a
large reduction in the computation that has to happen on the hot request
path.
      `.trim(),
    },
    {
      title: "Resumable playback across devices",
      explanation: `
A subscriber pausing a show on their TV and resuming on their phone needs
their exact position remembered — but capturing that position accurately
without slowing playback down requires treating it as a very different kind
of write than, say, a purchase.

- The player periodically reports **progress events** (e.g. every few
  seconds) to a lightweight, dedicated position-tracking service, sent
  asynchronously so a slow or failed report never stalls the video itself.
- That service is backed by a **fast key-value store**, keyed by
  \`(profile_id, title_id)\`, optimized for extremely frequent small writes
  and infrequent reads (a lookup happens once, when the user opens
  "continue watching" or resumes a title) — the opposite access pattern from
  the catalog's \`titles\` table.
- Writes can be **batched or throttled** client-side (report every few
  seconds rather than every frame) and **overwritten** rather than appended
  — only the latest position matters, so there's no need to retain a full
  history of every progress update, which keeps the store small regardless
  of total watch time.
- A brief inconsistency (resuming a couple of seconds earlier or later than
  the exact stopping point) is a fully acceptable trade for not making every
  few seconds of playback wait on a confirmed, durable write.

This is a clean example of picking the right storage system for an access
pattern rather than reusing whatever database already holds the "important"
data — position tracking is high-volume and low-stakes-per-write, and
deserves infrastructure built for exactly that.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
The first constraint this design runs into is never compute — it's bandwidth
and edge capacity during predictable peaks (evenings, a hit release,
regional events). The mitigation is largely proactive rather than reactive:
predict where and when demand will spike and pre-position content and
capacity ahead of it, rather than only reacting to load as it arrives. A
title that unexpectedly becomes a global phenomenon still stresses the
system the way any unexpected spike does, and is handled the same way a
viral video is on a general platform — rapid cache-warming and, if needed,
graceful bitrate degradation for some viewers rather than buffering for all
of them.

Beyond bandwidth, the playback-position and recommendation pipelines scale
horizontally by partitioning by user/profile — there's no natural dependency
between one profile's data and another's, so both can be sharded and scaled
independently of the video-delivery path entirely. The one piece that
doesn't parallelize as cleanly is the encoding pipeline for a single very
large title (a long feature film in the highest quality tiers), but because
encoding happens well ahead of release, that latency is absorbed long before
any viewer is waiting on it.
  `.trim(),
  tradeOffs: [
    {
      decision: "Exhaustive per-title encoding vs. a smaller, one-size-fits-most set of formats",
      explanation:
        "The catalog is encoded into many resolution/bitrate/codec combinations, sometimes with per-title tuning, at the cost of significant upfront compute and storage per title. This is affordable because the catalog is small and each title is watched an enormous number of times afterward — the same investment wouldn't make sense for a platform where most uploads are watched only a handful of times.",
    },
    {
      decision: "Proactive edge content placement vs. reactive cache-fill on first request",
      explanation:
        "Popular and predictably-in-demand content is pushed to edge nodes ahead of viewers requesting it, trading operational complexity (deciding what to pre-position, where, and when) for avoiding cold-cache misses during predictable peak demand. A purely reactive cache would be simpler to operate but would let the very first wave of a peak (e.g. a new season's release) hit origin before the cache warms up.",
    },
    {
      decision: "Precomputed, periodically-refreshed recommendations vs. live per-request ranking",
      explanation:
        "Recommendation candidates are computed offline/in batches and served as a fast lookup, at the cost of being minutes-to-hours stale rather than reflecting the very latest viewing session instantly. Live ranking would be maximally fresh but would put expensive model inference on the critical path of loading the home page for every user, which doesn't scale to hundreds of millions of page loads.",
    },
    {
      decision: "Asynchronous, overwrite-only playback position tracking vs. a durable, transactional history",
      explanation:
        "Playback position is reported asynchronously and only the latest value is kept, accepting a few seconds of possible drift in exchange for extremely cheap, high-frequency writes. A fully durable, transactional log of every position update would never lose data but would add write latency and storage cost with no real user-facing benefit, since only the most recent position is ever read.",
    },
  ],
  interviewTips: [
    "Distinguish this problem from a general video platform early: a small, known, pre-licensed catalog changes what's worth optimizing (exhaustive per-title encoding, proactive edge placement) versus an unbounded stream of user uploads.",
    "Lead with the CDN/edge delivery story — it's the part of this design that most defines it, and mentioning ISP-embedded edge servers signals real depth.",
    "Explain why recommendations are precomputed rather than calculated live, and quantify why live ranking wouldn't scale to the request volume.",
    "Treat playback-position tracking as its own small, focused sub-system with its own storage choice, rather than folding it into general user data.",
    "Bring up predictable peak-hour traffic patterns (regional evenings, big releases) and proactive pre-warming as a scaling strategy, not just reactive autoscaling.",
  ],
  relatedTopics: ["cdn", "caching", "load-balancing", "sharding", "consistency-models", "scalability", "queues"],
  keywords: ["netflix", "video streaming", "adaptive bitrate", "cdn", "edge caching", "recommendations", "system design interview"],
};
