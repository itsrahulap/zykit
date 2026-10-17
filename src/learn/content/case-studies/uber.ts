import type { CaseStudy } from "../../types/caseStudy";

export const uberCaseStudy: CaseStudy = {
  id: "uber",
  title: "Uber",
  difficulty: "Hard",
  summary:
    "Design ride-hailing: riders request a trip, get matched with a nearby driver in real time, and both track the trip's location and price live.",
  problemStatement: `
A rider taps a button and, within seconds, is matched with a nearby
available driver who accepts and heads their way. Both watch the car move
live on a map until pickup, and again until drop-off, when a price is
computed and charged.

It sounds like simple matching, but it's three hard, always-running
problems stacked together:

- Finding who is "near" whom among millions of moving points.
- Keeping all those locations fresh in near-real-time.
- Setting a fair price when supply (drivers) and demand (riders) shift by
  the minute.

The data isn't static. Every driver's location changes every few seconds,
whether or not anyone nearby wants a ride. Scanning "all drivers" and
computing each distance falls apart at city scale. The system needs a
"who is near this point" query that stays fast as drivers and update rates
grow.

Matching also isn't just "nearest driver." It must weigh availability,
trip direction, and fairness. And pricing must react to real imbalances (a
stadium letting out, bad weather) fast enough to rebalance the market, not
just report on it afterwards.
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
    "Remember the sustained ~250,000 location updates/second, and that this load is continuous, not tied to trip demand. It happens whether or not anyone nearby wants a ride. So 'keeping the location index fresh' is separate from 'matching a rider,' and the design splits location ingestion from the matching/pricing logic that reads from it, instead of recomputing positions on every match.",
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
Three pipelines run side by side.

**Location ingestion.** Every online driver's app sends a location ping
every few seconds. Pings flow through a load-balanced ingestion tier into a
geospatial index (geohash or quadtree, mostly in memory). The index answers
one question very fast: "which drivers are near point P right now?" This
runs constantly, whether or not any rider nearby wants a match.

**Matching.** When a rider requests a trip, the matching service queries
the index for nearby *available* drivers. It ranks them by distance, ETA,
and availability, and offers the trip to the best one first, falling
through to the next if they decline or time out. Once accepted, both apps
subscribe to live location and status updates (via WebSockets or push
notifications) until pickup, then until the trip ends.

**Pricing.** A background job keeps estimating the supply/demand ratio per
zone (recent ride requests vs. available nearby drivers) and keeps a surge
multiplier per zone. Fare estimates read it at request time; final billing
reads it at trip completion.

All three share the load balancer/app server tier but scale
independently. Ingestion is bound by sustained write throughput, matching
by per-request compute, and pricing by periodic batch work over zone
aggregates.
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
All matching depends on "find drivers near point P." A plain table with
lat/lng columns can't answer it efficiently. A B-tree index on latitude or
longitude alone doesn't find points near each other in *two* dimensions.
Two structures solve this:

- **Geohashing**: encode (lat, lng) into a short string where nearby
  points tend to share a prefix (two points a few hundred meters apart
  often share the first 6-7 characters). Finding nearby drivers becomes a
  prefix or range query, which ordinary indexes (including many key-value
  stores) handle well. Use more or fewer characters to tune precision.
- **Quadtrees**: recursively split the map into four quadrants, and split
  again where driver density is high. Dense areas (city centers) get fine
  cells and sparse areas (rural roads) get coarse ones automatically. A
  query walks down the tree to the relevant cell(s) instead of scanning
  everything.

Both turn a 2D nearest-neighbor problem into something like a key lookup or
small range scan. Both are usually kept mostly in memory, since positions
change every few seconds and rebuilding from disk on each update would be
far too slow. Both work; the choice is about implementation maturity and
how each handles very uneven density, from a downtown core to a rural
highway.
      `.trim(),
    },
    {
      title: "Real-time location updates without overwhelming the system",
      explanation: `
A sustained quarter-million updates per second must be handled as a
stream, not as separate database writes:

- Updates go through a message queue / streaming layer before the index.
  A spike (a big event ending, mass reconnection after an outage) is
  absorbed by the queue instead of overloading the index.
- The index only needs *current* positions. There's no need to keep every
  old ping in the hot path. Old positions are overwritten (or expire via
  TTL), so the index size stays bounded by driver count.
- Updates are batched and applied on a short interval (e.g. every 1-4
  seconds), not on every ping. A little staleness buys much less write
  amplification, and nobody notices a few seconds of lag on a live map.
- Drivers who go offline or lose connection must expire from the index
  (via heartbeat/TTL), so they aren't offered trips they can't take.
      `.trim(),
    },
    {
      title: "Matching: more than just nearest driver",
      explanation: `
Matching to the closest driver by straight-line distance works badly in
practice, so the matching service weighs several factors:

- **ETA, not raw distance.** A driver 500 meters away on the wrong side of
  a highway may take longer than one 1.2 km away with a direct route.
  Ranking uses estimated travel time.
- **Availability and direction.** A driver finishing a drop-off and
  heading roughly the right way may beat an idle driver farther away. This
  improves fleet utilization, not just one match.
- **Sequential offer with fallback.** The trip goes to the best candidate
  first, with a short accept/decline timeout, instead of being broadcast.
  This avoids several drivers converging on one pickup. On decline or
  timeout, it moves to the next candidate.
- **Fairness/anti-starvation.** "Closest always wins" can leave some
  drivers idle while others get every ride. Production systems bias the
  ranking against this, giving up a little per-trip optimality for a
  healthier, more evenly used driver pool.
      `.trim(),
    },
    {
      title: "Surge pricing as a real-time supply/demand signal",
      explanation: `
Surge pricing does two things. It allocates scarce nearby drivers to
whoever needs a ride most urgently right now. Just as important, it pulls
more drivers into a busy area by making it more profitable.

- The city is split into zones (geohash cells or a similar grid). For each
  zone, the pricing engine tracks the ratio of current ride requests to
  available nearby drivers.
- When the ratio crosses a threshold, a multiplier applies to fare
  estimates and final billing for trips starting there. It relaxes as
  demand falls or more drivers arrive (drawn by the price, or simply
  reported idle nearby by the ingestion pipeline).
- It's recomputed often (about every minute or faster) and cheaply, as a
  background aggregate over zone data, not per request. Fare estimates and
  billing just read the zone's current multiplier.
- The trade-off interviewers raise: surge improves availability during
  scarcity (drivers come online when most needed), but riders face price
  swings and it can look unfair in emergencies. Most real systems add caps
  or overrides for that reason.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
The geospatial index strains first, not the trips database. It absorbs a
continuous stream of hundreds of thousands of updates per second while
serving fast nearby-driver queries for every match. The design protects it
by keeping it in memory, batching writes, and treating it as rebuildable
state, not a durable system of record. None of that would suit data that
needs strong durability.

Beyond that, scale by geography. The geospatial index, matching service,
and surge engine can all be partitioned by region/city, since a driver in
one city never matches a rider in another. Each partition's size and load
stay bounded however many cities there are, and a spike in one city (a
major event ending) doesn't affect matching anywhere else.
  `.trim(),
  tradeOffs: [
    {
      decision: "In-memory, eventually-consistent location index vs. a durable, strongly consistent one",
      explanation:
        "Treat driver location as fast-moving, recoverable state: in memory, updated in batches, and allowed to be a few seconds stale, instead of a strongly consistent durable write on every ping. Perfect real-time accuracy isn't needed (a live map is already an approximation), and this gives the throughput for hundreds of thousands of updates per second.",
    },
    {
      decision: "Sequential offer-with-fallback vs. broadcasting a trip request to many nearby drivers",
      explanation:
        "Offer to the best-ranked driver first, with a short timeout before moving to the next. This stops several drivers converging on one pickup and wasting time. The cost is slightly slower matching after a decline. Broadcasting resolves faster on average but wastes more driver attention.",
    },
    {
      decision: "ETA/utilization-aware matching vs. pure nearest-distance matching",
      explanation:
        "Rank by estimated pickup time and fleet utilization, not just straight-line distance. It gives better real-world results and healthier long-run utilization, at the cost of a much more complex ranking computed per match instead of a simple sort by distance.",
    },
    {
      decision: "Dynamic surge pricing vs. fixed pricing with a driver incentive program",
      explanation:
        "Use real-time surge pricing. It reacts to supply/demand imbalances within minutes and pulls drivers to where they're needed. The cost, which most systems soften with caps, is price volatility for riders and a fairness/PR problem in emergencies. Fixed pricing avoids that but reacts to real scarcity far more slowly, if at all.",
    },
  ],
  interviewTips: [
    "Name the geospatial query problem early. 'Find nearby drivers' is the one query a plain relational index can't answer well.",
    "Compare geohashing and quadtrees, even briefly. Interviewers often probe this.",
    "Point out that location ingestion runs continuously, independent of matching demand. Treating them as one pipeline is a common shallow answer.",
    "Raise ETA-aware and utilization-aware matching, not just nearest distance. It shows you think about the marketplace, not just a spatial query.",
    "If surge pricing comes up, discuss both sides (market efficiency vs. rider fairness/PR risk), not just the technical feature.",
    "Say that location data can tolerate staleness while trip/billing records cannot. Naming which parts need which consistency is the judgment interviewers listen for.",
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
