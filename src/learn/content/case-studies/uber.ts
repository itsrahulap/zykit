import type { CaseStudy } from "../../types/caseStudy";

export const uberCaseStudy: CaseStudy = {
  id: "uber",
  title: "Uber",
  difficulty: "Hard",
  summary:
    "Design a ride-hailing system: riders request a trip, nearby drivers get matched to them in real time, and both sides track the trip's location and price live.",
  problemStatement: `
A rider opens the app, taps a button, and within seconds should be matched
with a nearby available driver who accepts the trip and starts heading
their way. Both the rider and driver then watch the car's location update
live on a map until the trip starts, and again until it ends, at which
point a price is computed and charged. Framed this way it sounds like a
straightforward matching problem, but it's really three hard, continuously
running problems stacked on top of each other: figuring out who is "near"
whom out of millions of moving points, keeping every one of those points'
locations fresh in near-real-time, and deciding a fair price in a market
where supply (drivers) and demand (riders) shift by the minute.

The core difficulty is that this isn't a lookup against mostly-static
data — every driver's location is changing every few seconds, all the
time, whether or not anyone is currently looking for a match near them.
A design that works by scanning "all drivers" and computing distance to
each one falls apart almost immediately at city scale; the system needs a
way to answer "who is near this point" that stays fast as the number of
drivers and their update frequency both grow. On top of that, matching
isn't just "nearest driver" — it has to account for driver availability,
trip direction, and fairness, and pricing has to respond to real supply and
demand imbalances (a stadium letting out, bad weather) fast enough to
actually rebalance the market, not just report on it after the fact.
  `.trim(),
  requirements: {
    functional: [
      "A rider can request a trip from a pickup location to a destination and get matched with a nearby available driver.",
      "A driver can see nearby ride requests and accept or decline them.",
      "Both rider and driver can see the other's live location on a map for the duration of the match/trip.",
      "The system computes an estimated time of arrival (ETA) for pickup and for the trip itself.",
      "The system computes a price for the trip, which can rise during periods of high demand relative to available drivers (surge pricing).",
      "A completed trip is billed to the rider and paid out to the driver.",
    ],
    nonFunctional: [
      "Matching must happen in a few seconds — a rider waiting a long time for a match is a failed experience even if a driver is eventually found.",
      "The system must ingest continuous location updates from every active driver (potentially every few seconds each) without falling behind.",
      "Availability matters more than perfect consistency for location data — a driver's position being a few seconds stale is normal and acceptable.",
      "The system must work correctly at wildly different densities: dense urban cores with thousands of nearby drivers, and sparse areas with only a handful.",
      "Pricing and matching decisions need to be computed fast enough to feel real-time, using data that is itself constantly changing underneath the calculation.",
    ],
  },
  capacityEstimation: [
    {
      label: "Active drivers online at peak (major city set)",
      value: "~1 million globally",
      note: "A reasonable order-of-magnitude assumption for a large ride-hailing platform's peak concurrent driver-online count across all served cities.",
    },
    {
      label: "Location updates per second",
      value: "~250,000 updates/sec",
      note: "Assume each of 1 million online drivers pushes a location update every ~4 seconds: 1,000,000 / 4 — this is a sustained, continuous write load, not a bursty one.",
    },
    {
      label: "Trip requests per day",
      value: "~15 million",
      note: "A reasonable order-of-magnitude assumption for daily completed/attempted trip requests across a large global platform.",
    },
    {
      label: "Matching requests per second (average)",
      value: "~175/sec",
      note: "15 million / 86,400 seconds in a day — but with sharp geographic and time-of-day spikes (rush hour, a big event ending) far above the daily average.",
    },
    {
      label: "Geospatial index size",
      value: "~1 million live points, constantly moving",
      note: "The index of 'where is every online driver right now' has a bounded size (bounded by concurrent driver count) but a very high mutation rate — every entry changes every few seconds, which is a very different profile than a normal index built over mostly-static data.",
    },
  ],
  capacityNotes:
    "The two numbers worth holding onto are the sustained ~250,000 location updates/second and the fact that this write load is continuous, not proportional to trip demand — it happens whether or not anyone is currently requesting a ride nearby. That decouples 'keeping the location index fresh' from 'matching a rider,' which is exactly why the design below splits location ingestion from the matching/pricing logic that reads from it, rather than recomputing driver positions from scratch on every match request.",
  apiDesign: [
    { method: "POST", path: "/api/v1/drivers/{driverId}/location", description: "Body: { lat, lng, heading, timestamp }. High-frequency location ping from the driver app." },
    { method: "POST", path: "/api/v1/trips/request", description: "Body: { pickupLocation, destination }. Initiates matching; returns a trip request id." },
    { method: "GET", path: "/api/v1/trips/{tripId}/status", description: "Returns current match status: searching, matched (with driver info/ETA), in progress, completed." },
    { method: "POST", path: "/api/v1/trips/{tripId}/accept", description: "Driver accepts an offered trip request." },
    { method: "POST", path: "/api/v1/trips/{tripId}/decline", description: "Driver declines; system offers the trip to the next nearest available driver." },
    { method: "GET", path: "/api/v1/trips/{tripId}/eta", description: "Returns a live-updated ETA for pickup or destination arrival." },
    { method: "GET", path: "/api/v1/pricing/estimate", description: "Query by pickup/destination; returns a fare estimate including any current surge multiplier." },
    { method: "POST", path: "/api/v1/trips/{tripId}/complete", description: "Ends the trip, finalizes distance/time, and triggers fare calculation and payment." },
  ],
  dataModel: `
The data splits into two very different shapes: relational-ish trip and
user records, and a specialized geospatial structure for "where is
everyone right now" that behaves nothing like a normal table:

- **drivers**: \`driver_id\`, \`status\` (online / on-trip / offline),
  \`vehicle_info\`, \`rating\`.
- **driver_locations** (a geospatial index, not a plain table — see the
  deep dive below): \`driver_id\` -> \`(lat, lng, heading, updated_at)\`,
  organized so that "find drivers near point P" is a fast query rather
  than a full scan. This structure is rebuilt/updated continuously and is
  treated as near-real-time cache-like state rather than a durable system
  of record — losing a few seconds of it is recoverable the moment the
  next location ping arrives.
- **trips**: \`trip_id\`, \`rider_id\`, \`driver_id\`, \`pickup_location\`,
  \`destination\`, \`status\`, \`requested_at\`, \`started_at\`,
  \`completed_at\`, \`fare\`.
- **trip_events** (append-only): \`trip_id\`, \`event_type\` (requested,
  matched, driver_arrived, started, completed), \`timestamp\` — used both
  for the live status the apps poll/subscribe to and for after-the-fact
  analytics, without needing to mutate the \`trips\` row itself for every
  state change.
- **surge_zones** (derived, short-lived): a geohash-keyed or H3-cell-keyed
  map of current supply/demand ratio and the resulting price multiplier
  per zone, recomputed on a short interval (e.g. every minute) rather than
  stored as a durable historical record beyond what's needed for billing
  a specific trip.

Deliberately, driver location is *not* modeled as a normal foreign-keyed,
durably-persisted column the way \`fare\` or \`rider_id\` are — it changes
too fast and matters too briefly for that to be the right tool.
  `.trim(),
  highLevelDesign: `
Two independent, always-running pipelines exist side by side. The first is
**location ingestion**: every online driver's app pushes a location ping
every few seconds; these pings flow through a load-balanced ingestion tier
into a geospatial index (built on geohashing or a quadtree, kept largely
in memory for speed) that is continuously updated and answers one question
extremely fast: "which drivers are near point P right now?" This pipeline
runs constantly, independent of whether any rider is currently requesting
a match nearby.

The second is **matching**: when a rider requests a trip, the matching
service queries the geospatial index for nearby *available* drivers,
ranks candidates by a combination of distance, ETA, and driver
availability, and offers the trip to the best candidate first — falling
through to the next-best if they decline or time out. Once accepted, the
trip transitions into an active state where both apps subscribe to live
location and status updates (via WebSockets or push notifications) for the
driver until pickup, and then for the trip itself until completion.

Pricing runs as a third, semi-independent process: a background job
continuously estimates the supply/demand ratio per geographic zone
(recent ride requests vs. currently available nearby drivers) and
maintains a surge multiplier per zone, which the fare-estimation and
final-billing steps read at request time and at trip-completion time
respectively. All three pipelines sit behind the same load balancer/app
server tier but scale independently — location ingestion is bound by
sustained write throughput, matching by per-request compute, and pricing
by periodic batch computation over zone-level aggregates.
  `.trim(),
  highLevelDiagram: `
  Driver App                                        Rider App
 (location ping                                    (trip request,
  every few sec)                                    live tracking)
        │                                                  │
        ▼                                                  ▼
 ┌───────────────┐                                 ┌───────────────┐
 │  Load Balancer │                                 │ Load Balancer  │
 └───────┬───────┘                                 └───────┬───────┘
         ▼                                                  ▼
 ┌────────────────┐                                ┌─────────────────┐
 │ Location        │                                │  Matching       │
 │ Ingestion Service│ ───── updates ─────▶          │  Service        │
 └───────┬────────┘                                └───────┬─────────┘
         ▼                                                  │ query nearby
 ┌────────────────┐                                         ▼
 │ Geospatial Index │◀───────────────────────────── (geohash / quadtree)
 │ (in-memory,      │
 │  quadtree/geohash)│
 └────────────────┘
         ▲
         │ zone aggregates
 ┌────────────────┐          ┌────────────────┐
 │ Surge Pricing   │─────────▶│  Trips DB       │
 │ Engine (batch)  │         │ (trip records,  │
 └────────────────┘          │  fares, events) │
                              └────────────────┘
  `,
  deepDives: [
    {
      title: "Geospatial indexing: quadtrees and geohashing",
      explanation: `
"Find drivers near point P" is the query the entire matching system
depends on, and a plain database table with lat/lng columns cannot answer
it efficiently — a normal B-tree index on latitude or longitude alone
doesn't help find points that are near each other in *two* dimensions at
once. Two structures solve this in practice:

- **Geohashing**: encode (lat, lng) into a short string where nearby
  points tend to share a prefix (e.g. two points a few hundred meters
  apart often share the first 6-7 characters of their geohash). Finding
  "nearby" drivers becomes a prefix match/range query, which ordinary
  indexes (including many key-value stores) handle well, and the
  precision is tunable simply by using more or fewer characters of the
  hash.
- **Quadtrees**: recursively divide the map into four quadrants, and
  divide again wherever driver density is high, so that dense areas
  (city centers) get finer-grained cells and sparse areas (rural roads)
  get coarse ones automatically. A nearby-driver query walks down the tree
  to the relevant cell(s) rather than scanning the whole space.

Both approaches turn a 2D "nearest neighbor" problem into something closer
to a fast key lookup or small range scan, and both are commonly kept
substantially in memory, since driver positions change every few seconds
and re-deriving the index from a cold on-disk structure on every update
would be far too slow. The practical choice between them is less about
correctness (both work) and more about implementation/operational
maturity and how naturally each handles wildly uneven density between a
downtown core and a rural highway.
      `.trim(),
    },
    {
      title: "Real-time location updates without overwhelming the system",
      explanation: `
A quarter-million location updates per second, sustained, is a workload
that has to be treated as a stream, not as a series of independent
database writes:

- Updates flow through a message queue / streaming layer before landing
  in the geospatial index, so a momentary spike (a big event ending, mass
  reconnection after an outage) is absorbed by the queue rather than
  directly overloading the index itself.
- The index only ever needs to reflect *current* position — there is no
  product need to durably retain every historical ping forever in the
  hot path. Old positions are overwritten in place (or expired via TTL),
  keeping the index's size bounded by driver count rather than growing
  unboundedly with time.
- Updates are batched and applied to the index on a short interval (e.g.
  every 1-4 seconds) rather than synchronously on every single ping,
  trading a small amount of positional staleness for dramatically less
  write amplification against the index — riders and drivers cannot
  perceive a few seconds of positional lag on a live map anyway.
- Drivers who go offline or lose connectivity need their entries expired
  out of the index (via a heartbeat/TTL mechanism) so stale, no-longer-
  available drivers don't get offered trips they can no longer take.
      `.trim(),
    },
    {
      title: "Matching: more than just nearest driver",
      explanation: `
Naively matching a rider to the single closest driver by straight-line
distance produces bad outcomes in practice, so the matching service
weighs several factors together:

- **ETA, not raw distance** — a driver 500 meters away on the wrong side
  of a highway may have a longer real pickup time than one 1.2 km away
  with a direct route; ranking uses estimated travel time, not geometric
  distance.
- **Driver availability and direction** — a driver already en route to
  drop off another passenger heading roughly the requested direction may
  be a better match than an idle driver farther away, since it improves
  overall fleet utilization rather than just optimizing one match in
  isolation.
- **Sequential offer with fallback** — the system typically offers a trip
  to its best candidate first (with a short accept/decline timeout)
  rather than broadcasting to many drivers at once, to avoid the wasted
  work and confusion of multiple drivers converging on one pickup; on a
  decline or timeout, the offer cascades to the next-ranked candidate.
- **Fairness/anti-starvation** — a purely greedy "closest wins every time"
  policy can leave some drivers idle indefinitely while others get every
  ride; production systems bias the ranking to avoid this, trading a
  small amount of per-trip optimality for a healthier, more evenly
  utilized driver pool over time.
      `.trim(),
    },
    {
      title: "Surge pricing as a real-time supply/demand signal",
      explanation: `
Surge pricing exists to do two things at once: allocate a temporarily
scarce resource (available nearby drivers) toward whoever values a ride
most urgently right now, and — just as importantly — pull more drivers
into a high-demand area by making it more profitable to be there.

- The city is partitioned into zones (geohash cells or a similar grid),
  and for each zone the pricing engine continuously tracks a ratio of
  current ride requests to currently available nearby drivers.
- When that ratio crosses a threshold, a price multiplier is applied to
  fare estimates and final billing for trips starting in that zone, and
  the multiplier relaxes back down as either demand falls or more drivers
  arrive (drawn in by the higher price, or from the ingestion pipeline
  simply reporting more idle drivers nearby).
- This has to be recomputed frequently (on the order of every minute or
  faster) and cheaply, since it's a background aggregate over zone-level
  data, not something computed per-request from scratch — the fare
  estimate and final billing steps just read the current multiplier for
  the relevant zone rather than recomputing supply/demand themselves.
- The trade this raises constantly in interviews: surge pricing genuinely
  improves availability during scarcity (more drivers get incentivized
  to be online exactly when they're needed most) at the real cost of
  rider-facing price volatility and the perception of unfairness during
  emergencies — most real systems add caps or overrides for exactly that
  reason.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
The first thing to strain under load isn't the trips database — it's the
geospatial index, because it has to absorb a continuous, non-bursty stream
of hundreds of thousands of updates per second while simultaneously
serving low-latency nearby-driver queries for every match attempt. The
design defends this specifically by keeping the index in memory, batching
writes into it, and treating it as recoverable/rebuildable state rather
than a durable system of record — none of which would be appropriate for
data that actually needed strong durability guarantees.

Beyond that, the natural scaling axis is geography: the geospatial index,
matching service, and surge-pricing engine can all be partitioned by
region/city, since a driver in one city is never a candidate match for a
rider in another — this keeps each partition's data size and query load
bounded regardless of how many total cities the platform serves, and lets
a demand spike in one city (a major event ending) be absorbed without
affecting matching performance anywhere else.
  `.trim(),
  tradeOffs: [
    {
      decision: "In-memory, eventually-consistent location index vs. a durable, strongly consistent one",
      explanation:
        "Driver location is treated as fast-moving, recoverable state — held in memory, updated in batches, and allowed to be a few seconds stale — rather than written through a strongly consistent durable store on every ping. This trades perfect real-time accuracy (never needed here, since a live map is already an approximation to the human eye) for the write throughput needed to sustain hundreds of thousands of updates per second.",
    },
    {
      decision: "Sequential offer-with-fallback vs. broadcasting a trip request to many nearby drivers",
      explanation:
        "Offering to one best-ranked driver at a time, with a short timeout before cascading to the next, was chosen to avoid multiple drivers converging on the same pickup and the wasted driver time/confusion that causes. The cost is slightly higher matching latency in the case of a decline, versus a broadcast approach that resolves faster on average but wastes more total driver attention.",
    },
    {
      decision: "ETA/utilization-aware matching vs. pure nearest-distance matching",
      explanation:
        "Ranking candidates by estimated pickup time and fleet-utilization factors (not just straight-line distance) produces better real-world outcomes and healthier long-run driver utilization, at the cost of a meaningfully more complex ranking function that has to be computed per match rather than a simple sorted-by-distance query.",
    },
    {
      decision: "Dynamic surge pricing vs. fixed pricing with a driver incentive program",
      explanation:
        "Real-time surge pricing was chosen because it responds to supply/demand imbalances within minutes and directly pulls drivers toward the areas that need them most. The cost, which most real systems mitigate with caps, is rider-facing price volatility and a fairness/PR problem during emergencies or disasters — a fixed-price model avoids that but responds to genuine scarcity far more slowly, if at all.",
    },
  ],
  interviewTips: [
    "Open by naming the geospatial query problem explicitly — 'find nearby drivers' is the one query a plain relational index cannot answer well, and naming that early signals real system design instinct.",
    "Compare geohashing and quadtrees explicitly, even briefly — interviewers commonly probe this deep dive specifically.",
    "Point out that location ingestion runs continuously and independently of matching demand — treating them as one pipeline is a common shallow-answer mistake.",
    "Bring up ETA-aware and utilization-aware matching, not just nearest-distance — it shows you're thinking about the marketplace, not just a spatial query.",
    "If surge pricing comes up, discuss both sides of the trade-off (market efficiency vs. rider fairness/PR risk) rather than presenting it as a purely technical feature.",
    "Don't skip the fact that location data can tolerate staleness/inconsistency while trip/billing records cannot — naming which parts of the system need which consistency guarantee is exactly the kind of judgment call interviewers are listening for.",
  ],
  relatedTopics: [
    "consistent-hashing",
    "caching",
    "queues",
    "pub-sub",
    "consistency-models",
    "sharding",
    "load-balancing",
    "websockets",
  ],
  keywords: [
    "uber",
    "ride-hailing",
    "geospatial indexing",
    "quadtree",
    "geohashing",
    "surge pricing",
    "real-time matching",
    "system design interview",
  ],
};
