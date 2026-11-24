import type { Topic } from "../../types/content";

export const systemDesignProductionTopics: Topic[] = [
  {
    id: "bloom-filters-and-probabilistic-structures",
    title: "Bloom Filters and Probabilistic Data Structures",
    level: "advanced",
    description: "Tiny, fast structures that answer 'have I seen this?' or 'how many?' approximately, trading a small, known error for huge memory savings.",
    explanation: `
Some questions are expensive to answer exactly at scale. "Is this username
taken?", "How many unique visitors did we have today?", "Which search
terms are trending right now?" An exact answer means storing every item,
which can take gigabytes.

**Probabilistic data structures** give an answer that is *almost* right,
with an error rate you choose up front, using a tiny fraction of the
memory. The main ones:

- **Bloom filter**: "Is X in the set?" Answers **definitely not** or
  **probably yes**. It never gives a false negative, but can give a false
  positive.
- **Counting Bloom filter**: a Bloom filter that also supports deletion.
- **HyperLogLog (HLL)**: "How many *distinct* items have I seen?" Counts
  billions of unique values in about 12 KB with roughly 1% error.
- **Count-Min Sketch**: "How often has X appeared?" Gives a frequency
  estimate that can be too high but never too low.

The key idea for a senior engineer: these structures move a cost (disk
reads, network calls, memory) from "always" to "rarely", and the error is
**one-sided and bounded**, so you can design around it.
    `.trim(),
    analogy:
      "A Bloom filter is like a bouncer with a short list of features instead of photos: 'tall, red hat, glasses'. If you don't match, you definitely aren't on the list. If you do match, you're probably on it, but someone else in a red hat and glasses could slip through, so the bouncer double-checks the real list only for matches.",
    examples: [
      {
        title: "A minimal Bloom filter in TypeScript",
        language: "typescript",
        code: `class BloomFilter {
  private bits: Uint8Array;

  constructor(private sizeInBits: number, private hashCount: number) {
    this.bits = new Uint8Array(Math.ceil(sizeInBits / 8));
  }

  // Double hashing: derive k positions from two base hashes (Kirsch-Mitzenmacher).
  private positions(item: string): number[] {
    const hashA = fnv1a(item);
    const hashB = fnv1a(item + "#salt") | 1; // odd, so steps cover the table
    const result: number[] = [];
    for (let i = 0; i < this.hashCount; i++) {
      result.push(Math.abs((hashA + i * hashB) % this.sizeInBits));
    }
    return result;
  }

  add(item: string): void {
    for (const position of this.positions(item)) {
      this.bits[position >> 3] |= 1 << (position & 7);
    }
  }

  mightContain(item: string): boolean {
    return this.positions(item).every(
      (position) => (this.bits[position >> 3] & (1 << (position & 7))) !== 0,
    );
  }
}

function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}`,
        explanation:
          "Adding sets k bits. Checking reads the same k bits: if any is 0 the item was never added; if all are 1 it probably was.",
        walkthrough: [
          { code: "this.bits = new Uint8Array(...)", explanation: "The whole filter is just an array of bits, all starting at 0." },
          { code: "private positions(item)", explanation: "Turns one item into k bit positions using two hashes combined k ways." },
          { code: "add(item)", explanation: "Sets every one of the item's k bits to 1." },
          { code: "mightContain(item)", explanation: "Returns false if any bit is 0 (definitely absent), true if all are 1 (probably present)." },
        ],
      },
      {
        title: "Sizing a Bloom filter",
        language: "typescript",
        code: `// n = expected items, p = target false-positive rate
function bloomSize(n: number, p: number) {
  const bits = Math.ceil((-n * Math.log(p)) / (Math.LN2 * Math.LN2));
  const hashes = Math.round((bits / n) * Math.LN2);
  return { bits, megabytes: bits / 8 / 1024 / 1024, hashes };
}

bloomSize(100_000_000, 0.01);
// => ~958.5 million bits (~114 MB), 7 hash functions
// About 9.6 bits per item for 1%, ~14.4 bits for 0.1%.`,
        explanation:
          "Each 10x drop in false-positive rate costs about 4.8 more bits per item. Storing 100M 32-byte keys exactly would take over 3 GB.",
      },
      {
        title: "HyperLogLog and Count-Min Sketch in Redis",
        language: "bash",
        code: `# Unique visitors per day: ~12 KB per key, ~0.81% standard error
PFADD visitors:2026-11-24 user:42 user:99 user:42
PFCOUNT visitors:2026-11-24            # => 2
PFMERGE visitors:week visitors:2026-11-24 visitors:2026-11-23

# Count-Min Sketch (RedisBloom module): top search terms
CMS.INITBYPROB searches 0.001 0.01     # error 0.1% of total, 99% confidence
CMS.INCRBY searches "pizza" 1
CMS.QUERY searches "pizza"`,
        explanation:
          "HLL sketches merge losslessly, so you can count per day and union into weeks without re-reading raw data.",
      },
    ],
    howItWorks: `
**Bloom filter.** A bit array of size **m** and **k** hash functions. To
add an item, hash it k times and set those k bits. To query, check the
same k bits. A 0 anywhere proves absence. All 1s could be a coincidence:
other items may have set those bits. After inserting **n** items:

- False-positive rate: **p ≈ (1 − e^(−kn/m))^k**
- Best number of hashes: **k = (m/n) · ln 2**
- Bits needed for a target p: **m = −n · ln p / (ln 2)²**, about
  **1.44 · log2(1/p)** bits per item.

You can't delete from a plain Bloom filter: clearing a bit might erase
another item that shares it. If you insert more than n items, p climbs
fast, so size for peak, or use a **scalable Bloom filter** that adds new
layers as it fills.

**Counting Bloom filter.** Replace each bit with a small counter (often 4
bits). Add increments k counters; delete decrements them. It costs ~4x
the memory and counters can overflow. Deleting an item that was never
added corrupts the filter, so only delete what you know you inserted.
**Cuckoo filters** are a common alternative that support deletion with
less overhead.

**HyperLogLog.** Hash each item to a uniform bit string. A run of r
leading zeros is roughly a 1-in-2^r event, so the longest run you've seen
hints at how many distinct items exist. One estimate is noisy, so HLL
splits the hash into **m registers** (using the first bits to pick a
register), keeps the max run per register, and combines them with a
harmonic mean. Standard error is about **1.04 / √m**. Redis uses 16,384
registers (~12 KB), giving ~0.81%. Two HLLs merge by taking the max of
each register, which makes them ideal for distributed counting.

**Count-Min Sketch.** A grid of **d** rows × **w** columns of counters,
one hash function per row. To increment X, add 1 to one counter in each
row. To estimate X, take the **minimum** across rows. Collisions only add,
so the estimate is never too low. With w = ⌈e/ε⌉ and d = ⌈ln(1/δ)⌉, the
overestimate is at most ε × (total count) with probability 1 − δ. Pair it
with a small heap to track **top-k** heavy hitters.
    `.trim(),
    diagram: `
Bloom filter, m = 16 bits, k = 3

add("cat")  -> h1=2, h2=7, h3=11
add("dog")  -> h1=4, h2=7, h3=14

index: 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15
bits:  0 0 1 0 1 0 0 1 0 0 0  1  0  0  1  0

query("cow") -> 2, 4, 14  all 1  -> "probably yes"  (false positive!)
query("eel") -> 2, 5, 11  bit 5 = 0 -> "definitely no"
    `.trim(),
    whyItExists: `
At scale, the expensive part is usually not computing but *looking*: a
disk seek, a network call, a full scan. If most lookups are for things
that don't exist, a small in-memory filter that rules them out saves
almost all of that work. Likewise, exact distinct counts and frequency
tables grow with the data, while sketches stay a fixed size and can be
merged across machines.
    `.trim(),
    whenToUse: `
- **LSM-tree databases** (Cassandra, RocksDB, HBase, LevelDB) keep a
  Bloom filter per SSTable so reads skip files that can't hold the key.
- **CDNs and caches**: Akamai described using a Bloom filter to avoid
  caching "one-hit wonders", only storing an object on its second request.
- **Pre-checks before expensive lookups**: username availability, "already
  crawled this URL?", "has this user seen this recommendation?", malicious
  URL lists.
- **Analytics**: HLL for unique users / IPs / devices per time bucket;
  Count-Min Sketch for heavy hitters, trending topics, or per-key rate
  estimates in network devices.
- **Distributed joins**: send a Bloom filter of one side's keys to filter
  the other side before shuffling.
    `.trim(),
    whenNotToUse: `
- When you need an exact answer (billing, balances, permissions). Use a
  real set, a database index, or an exact count.
- When the set is small. A hash set of a few thousand items is simple and
  exact.
- When false positives are dangerous and there's no cheap exact check
  behind the filter. A Bloom filter is a fast "no", not a proof of "yes".
- When you must list or delete members. Bloom filters and HLL can't
  enumerate what's inside. Use a counting/cuckoo filter or the real data.
    `.trim(),
    commonMistakes: [
      "Treating a Bloom filter 'yes' as authoritative instead of confirming against the real store.",
      "Sizing for today's item count, then inserting 5x more. The false-positive rate rises sharply once the filter is overfilled.",
      "Deleting from a plain Bloom filter by clearing bits, which creates false negatives for other items.",
      "Using correlated or weak hash functions, which makes the real error rate much worse than the formula predicts.",
      "Expecting Count-Min Sketch to be accurate for rare items. Its error is relative to the total count, so low-frequency estimates are mostly noise.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain why a Bloom filter can return false positives but never false negatives." },
      { difficulty: "Medium", prompt: "You expect 50 million keys and want a 0.1% false-positive rate. Compute the number of bits and hash functions, and the memory in MB." },
      { difficulty: "Hard", prompt: "Design daily, weekly and monthly unique-visitor counts for 500M events/day across 200 servers without storing raw user IDs centrally. Explain how merging works and what the error is." },
    ],
    interviewQuestions: [
      { question: "What does a Bloom filter guarantee?", answer: "No false negatives: if it says an item is absent, it is absent. A 'present' answer may be a false positive with a tunable probability." },
      { question: "How do you choose the size and number of hash functions?", answer: "For n items and target rate p: m = −n·ln p / (ln 2)² bits and k = (m/n)·ln 2 hashes. That is about 9.6 bits per item for 1% and 7 hashes." },
      { question: "Why can't you delete from a standard Bloom filter?", answer: "Bits are shared between items. Clearing one item's bits can clear bits another item relies on, creating false negatives. Use a counting Bloom filter or a cuckoo filter if you need deletes." },
      { question: "How do LSM-tree databases use Bloom filters?", answer: "Each immutable SSTable has a filter over its keys. A point read checks filters first and only reads SSTables that might contain the key, cutting disk I/O for missing keys dramatically." },
      { question: "How does HyperLogLog estimate cardinality?", answer: "It hashes items, uses some bits to choose a register, and records the longest run of leading zeros per register. Long runs are rare, so they indicate many distinct items. A harmonic mean across registers gives the estimate, with error about 1.04/√m." },
      { question: "Why is HyperLogLog good for distributed systems?", answer: "Sketches are small and fixed-size, and two sketches merge by taking the per-register max. Each node counts locally; you union results without double counting and without moving raw data." },
      { question: "What does a Count-Min Sketch overestimate, and why?", answer: "Frequencies. Hash collisions add other items' counts into a cell, never subtract, so each row's counter is at least the true count. Taking the minimum across rows limits the overestimate to about ε times the total." },
      { question: "Your Bloom filter's false-positive rate in production is 8% instead of the designed 1%. What happened?", answer: "Most likely it is overfilled (more items than it was sized for) or the hash functions are poor or correlated. Check the actual insert count against n and the fill ratio of set bits; resize or move to a scalable filter." },
      { question: "How would you find the top 100 trending hashtags in a high-volume stream with limited memory?", answer: "Use a Count-Min Sketch per time window for frequency estimates plus a min-heap of size 100 for current candidates. Update the heap when an item's estimate beats the smallest. Rotate or decay windows for 'trending'. Accept small overestimates for popular items." },
      { question: "When would you pick a cuckoo filter over a Bloom filter?", answer: "When you need deletion, or a very low false-positive rate where cuckoo filters can use less space. Bloom filters remain simpler, insert never fails, and they handle unions with a bitwise OR." },
    ],
    prerequisites: ["databases", "caching"],
    relatedTopics: ["storage-engines", "caching", "cdn", "stream-and-batch-processing", "data-warehouses-and-olap", "search-and-inverted-index"],
    keywords: ["bloom filter", "false positive", "counting bloom filter", "cuckoo filter", "hyperloglog", "HLL", "count-min sketch", "cardinality", "heavy hitters", "sketch", "SSTable"],
  },
  {
    id: "geospatial-indexing",
    title: "Geospatial Indexing",
    level: "advanced",
    description: "Finding things near a point fast, using geohash, quadtrees and S2/H3 cells instead of scanning every location.",
    explanation: `
"Show drivers within 2 km of me" sounds simple. But a database index on
latitude, or on longitude, only narrows one dimension. Filtering
**lat BETWEEN a AND b AND lng BETWEEN c AND d** with two separate indexes
still touches a huge strip of the map.

**Geospatial indexing** turns 2D positions into something a normal index
can search quickly. The common approaches:

- **Geohash**: encodes a point as a short string. Nearby points usually
  share a prefix, so a prefix search finds neighbours.
- **Quadtree**: splits the map into four squares, and splits busy squares
  again, so dense cities get small cells and oceans get big ones.
- **S2 (Google) and H3 (Uber)**: hierarchical cell systems over the whole
  globe. Each cell has a 64-bit ID at a chosen resolution.

All of them share one idea: **bucket the world into cells, index by cell,
then filter precisely by real distance.**
    `.trim(),
    analogy:
      "It's like postal codes. To find pizza places near you, you don't measure the distance to every pizza place on Earth; you look in your postal code and the ones next to it, then check exact distances on that short list.",
    examples: [
      {
        title: "Nearby search with a geohash prefix",
        language: "typescript",
        code: `// Drivers table indexed on geohash6 (cells about 1.2 km x 0.6 km)
async function findNearbyDrivers(lat: number, lng: number, radiusMeters: number) {
  const center = geohash.encode(lat, lng, 6);
  // The query point may sit near an edge, so always include all 8 neighbours.
  const cells = [center, ...geohash.neighbors(center)];

  const candidates = await db.query(
    "SELECT id, lat, lng FROM drivers WHERE geohash6 = ANY($1)",
    [cells],
  );

  return candidates
    .map((driver) => ({ ...driver, distance: haversineMeters(lat, lng, driver.lat, driver.lng) }))
    .filter((driver) => driver.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);
}`,
        explanation:
          "Two phases: a coarse cell lookup using an ordinary index, then an exact distance filter. The 3x3 block covers any radius smaller than one cell.",
        walkthrough: [
          { code: "const center = geohash.encode(lat, lng, 6);", explanation: "Turns the user's location into a 6-character cell ID." },
          { code: "const cells = [center, ...geohash.neighbors(center)];", explanation: "Adds the 8 surrounding cells so drivers just across a border aren't missed." },
          { code: "WHERE geohash6 = ANY($1)", explanation: "A fast index lookup for 9 cell IDs instead of scanning every driver." },
          { code: ".filter((driver) => driver.distance <= radiusMeters)", explanation: "Exact distance check removes cell-corner candidates that are actually too far." },
        ],
      },
      {
        title: "Redis GEO for live positions",
        language: "bash",
        code: `GEOADD drivers:sf -122.4194 37.7749 driver:17
GEOADD drivers:sf -122.4090 37.7835 driver:42
GEOSEARCH drivers:sf FROMLONLAT -122.4150 37.7800 BYRADIUS 2 km ASC COUNT 10 WITHDIST`,
        explanation:
          "Redis stores a 52-bit geohash-style score in a sorted set and does the neighbour-cell search for you. Good for fast-changing positions held in memory.",
      },
      {
        title: "PostGIS for durable, complex queries",
        language: "sql",
        code: `CREATE INDEX places_geo_idx ON places USING GIST (location);

SELECT id, name, ST_Distance(location, ST_MakePoint(-122.415, 37.78)::geography) AS meters
FROM places
WHERE ST_DWithin(location, ST_MakePoint(-122.415, 37.78)::geography, 2000)
ORDER BY location <-> ST_MakePoint(-122.415, 37.78)::geography
LIMIT 20;`,
        explanation:
          "A GiST index (an R-tree style structure) supports radius, polygon and nearest-neighbour queries on stored places.",
      },
    ],
    howItWorks: `
**Geohash.** Alternately bisect longitude and latitude, writing a 1 if the
point is in the upper half and 0 otherwise. Interleave the bits and encode
5 bits per base-32 character. Longer strings mean smaller cells: 5 chars ≈
4.9 km × 4.9 km, 6 chars ≈ 1.2 km × 0.6 km, 7 chars ≈ 153 m × 153 m. The
bits follow a **Z-order curve**, so a prefix is a rectangle and points in
one rectangle are contiguous in a sorted index.

**The boundary problem.** Two points a metre apart can sit on either side
of a cell edge and share no prefix at all (worst case: across the equator
or the prime meridian). That's why you always query the cell **plus its
neighbours**, then filter by real distance. Cell size must be chosen so the
search radius fits inside that 3×3 block.

**Quadtree.** Start with one square for the whole map. When a node holds
more than a set number of points, split it into four children. Density
adapts automatically: Manhattan may be 18 levels deep while the Pacific is
one node. Good for in-memory indexes of fairly static points (businesses).
Updating moving objects means removing and reinserting, and rebalancing
splits and merges.

**S2.** Projects the sphere onto the six faces of a cube, then divides
each face with a quadtree ordered along a **Hilbert curve** (better locality
than Z-order). 31 levels (0 to 30); a cell ID is a 64-bit integer, and a
region can be covered by a small set of cells of mixed levels, each one a
contiguous range of IDs. Used by Google, MongoDB's 2dsphere index and
others.

**H3.** Uber's hexagonal grid with 16 resolutions (0–15). Hexagons have six
neighbours all at the same distance, which makes **k-ring** searches
("everything within k hops") and smoothing (surge pricing, demand heatmaps)
uniform. Children don't nest perfectly inside parents, and each resolution
has 12 pentagons, which code must tolerate.

**At scale.** Shard by a coarse cell (city or S2 level ~6–10) so a query
touches one or a few shards. For moving drivers, keep latest positions in
memory (Redis or an in-house service), update every few seconds, and
expire stale entries. Hot cells (an airport, a stadium) need finer cells or
splitting.
    `.trim(),
    diagram: `
Geohash 3x3 neighbour search          Quadtree adapts to density

+------+------+------+               +-----------+-----+-----+
| 9q8y | 9q8z | 9q9p |               |           | . . | .   |
+------+------+------+               |   empty   +--+--+-----+
| 9q8v | 9q8y*| 9q9n |               |  (1 node) |..|..| .   |
+------+------+------+               |           +--+--+-----+
| 9q8t | 9q8w | 9q9j |               |           |  .  |     |
+------+------+------+               +-----------+-----+-----+
* = user's cell (labels illustrative). Points near an edge can live
  in a neighbour with a totally different prefix.
    `.trim(),
    whyItExists: `
B-tree indexes sort one dimension. Location is two dimensions on a sphere,
and the questions people ask ("near me", "inside this zone", "k nearest")
need both at once. Mapping 2D cells to 1D IDs lets ordinary sorted indexes,
key-value stores and sharding schemes handle spatial queries, which is
what ride-hailing, delivery, maps, dating and local search all need.
    `.trim(),
    whenToUse: `
- **Proximity search**: nearby drivers, restaurants, stores, friends.
- **Matching and dispatch**: find the k nearest available couriers.
- **Geofencing**: is this point inside a delivery zone or airport polygon?
  (Cover the polygon with cells, then do an exact point-in-polygon test.)
- **Aggregation**: demand heatmaps and surge zones keyed by H3 cell.
- **Sharding** location data so each query hits few partitions.
    `.trim(),
    whenNotToUse: `
- A few thousand points: just compute distances in memory, or use PostGIS
  and let it handle the index.
- Region-level filters (country, city) where a normal column is enough.
- Routing or travel-time questions. "Nearest by straight line" is not
  "nearest by road"; you need a road graph and an ETA service for that.
    `.trim(),
    commonMistakes: [
      "Searching only the user's own cell and missing results just across the boundary.",
      "Picking a cell size smaller than the search radius, so even the 3x3 neighbour block doesn't cover it.",
      "Treating latitude and longitude as flat x/y and using Euclidean distance. A degree of longitude shrinks toward the poles; use haversine or a geography type.",
      "Writing every GPS ping to the primary database. Keep live positions in memory and persist trips or samples asynchronously.",
      "Ignoring hot cells: one airport cell can hold thousands of drivers and become a hot shard.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain why two points 10 metres apart can have completely different geohashes." },
      { difficulty: "Medium", prompt: "Design the 'restaurants within 5 km' query for 50 million restaurants that rarely move. Choose an index, a cell size and a sharding key." },
      { difficulty: "Hard", prompt: "Design the driver-location service for a ride-hailing app: 1 million active drivers sending a position every 4 seconds, and riders requesting the 10 nearest drivers. Cover write path, index, sharding, hot cells and staleness." },
    ],
    interviewQuestions: [
      { question: "Why can't a regular B-tree on latitude and longitude answer 'nearby' queries efficiently?", answer: "It sorts by one column, so a range on latitude returns a whole horizontal band of the world that then has to be filtered by longitude. Spatial indexes cover both dimensions at once." },
      { question: "What is a geohash?", answer: "A base-32 string made by interleaving bits from repeated halving of longitude and latitude. Each extra character shrinks the cell; shared prefixes usually mean nearby points." },
      { question: "What is the geohash boundary problem and how do you handle it?", answer: "Nearby points on opposite sides of a cell edge can have unrelated prefixes. Query the target cell plus its 8 neighbours, then filter candidates by exact distance." },
      { question: "When would you use a quadtree over a fixed grid?", answer: "When density varies a lot. A quadtree subdivides only busy areas, keeping the number of points per cell roughly bounded, whereas a fixed grid has huge cells in cities or millions of empty cells elsewhere." },
      { question: "What advantages do H3 hexagons have?", answer: "Every neighbour of a hexagon is equidistant from its centre and shares an edge, so k-ring searches and spatial smoothing are uniform. Squares have edge and corner neighbours at different distances." },
      { question: "What does S2 do differently from geohash?", answer: "It works on the sphere by projecting onto a cube and orders cells with a Hilbert curve, giving better locality and less distortion. Regions are covered by a set of mixed-level cells, each mapping to a contiguous range of 64-bit IDs." },
      { question: "How would you store rapidly changing driver locations?", answer: "In memory, keyed by cell (for example Redis GEO or a sharded in-house service), overwriting the latest position and expiring stale drivers with a TTL. Stream raw pings to a log for analytics instead of writing each to the primary database." },
      { question: "How do you shard geospatial data?", answer: "By a coarse cell ID or by city/region, so most queries hit one shard. Watch for skew: dense cities need more shards, and queries near a shard boundary must fan out to neighbours." },
      { question: "How do you answer 'k nearest' when you don't know the radius?", answer: "Start with a small ring of cells and expand ring by ring (or level by level) until you have at least k candidates and the next ring can't contain anything closer than the current k-th result. Then sort by exact distance." },
      { question: "Straight-line nearest isn't always best for dispatch. How would you improve matching?", answer: "Use the spatial index only to get a candidate set, then rank by ETA from a routing service, factoring in road network, direction of travel and traffic. Batch matching across many riders can beat greedy nearest-driver assignment." },
    ],
    prerequisites: ["databases", "sharding"],
    relatedTopics: ["sharding", "caching", "hot-keys-and-thundering-herd", "search-and-inverted-index", "consistent-hashing"],
    keywords: ["geohash", "quadtree", "S2", "H3", "hexagon", "proximity search", "nearby", "PostGIS", "Redis GEO", "haversine", "Z-order", "Hilbert curve", "ride-hailing"],
  },
  {
    id: "hot-keys-and-thundering-herd",
    title: "Hot Keys and Thundering Herd",
    level: "advanced",
    description: "Handling the one key everyone wants at once: hot partitions, cache stampedes, request coalescing and key splitting.",
    explanation: `
Sharding and caching assume load spreads evenly across keys. Real traffic
doesn't. A celebrity posts, a product goes viral, a match ends, and one
key suddenly gets thousands of times more traffic than the rest.

Two related failure modes follow:

- **Hot key / hot partition**: one key (or one shard holding it) gets far
  more traffic than a single node can handle, even though the cluster as
  a whole has spare capacity. Adding more shards doesn't help, because
  the key lives on one of them.
- **Thundering herd / cache stampede**: a popular cache entry expires (or
  a cache restarts), and thousands of requests miss at the same moment.
  All of them hit the database to rebuild the same value, and the
  database falls over.

The fixes come in a few families: **coalesce** duplicate work
(single-flight), **refresh early** so popular entries never fully expire,
**spread** hot keys across nodes (salting, replication, local caches), and
**smooth timing** with jitter.
    `.trim(),
    analogy:
      "A bakery sells out of its famous bread at noon. If 200 customers each run to the kitchen to bake a new loaf, the kitchen jams. Better: one baker bakes while everyone else waits for that loaf, and the baker starts the next batch a little before the shelf empties.",
    examples: [
      {
        title: "Single-flight: one rebuild per key, everyone shares the result",
        language: "typescript",
        code: `const inFlight = new Map<string, Promise<unknown>>();

async function getWithSingleFlight<T>(key: string, load: () => Promise<T>): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== undefined) return cached;

  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>; // join the rebuild already running

  const rebuild = load()
    .then(async (value) => {
      await cache.set(key, value, { ttlSeconds: 300 });
      return value;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, rebuild);
  return rebuild;
}`,
        explanation:
          "Coalesces concurrent misses within one process (like Go's singleflight). Across many servers you still get one rebuild per server, which is usually fine; use a short distributed lock if it isn't.",
        walkthrough: [
          { code: "const inFlight = new Map<string, Promise<unknown>>();", explanation: "Tracks rebuilds currently running, keyed by cache key." },
          { code: "if (existing) return existing as Promise<T>;", explanation: "If someone is already loading this key, wait for their result instead of hitting the database again." },
          { code: "const rebuild = load().then(...)", explanation: "The first caller loads the value and writes it to the cache." },
          { code: ".finally(() => inFlight.delete(key));", explanation: "Clears the entry on success or failure so the next miss can retry." },
        ],
      },
      {
        title: "Probabilistic early expiration (XFetch)",
        language: "typescript",
        code: `// entry = { value, expiresAt, recomputeMs }  (recomputeMs: how long the last rebuild took)
function shouldRefreshEarly(entry: CacheEntry, beta = 1.0): boolean {
  // -Math.log(random) is a positive, exponentially distributed number.
  // Requests near expiry, for expensive values, are more likely to refresh.
  const earlyByMs = -entry.recomputeMs * beta * Math.log(Math.random());
  return Date.now() + earlyByMs >= entry.expiresAt;
}`,
        explanation:
          "Each reader independently rolls the dice. As expiry approaches, one request (usually) refreshes the value in the background before it actually expires, so there is never a moment when everyone misses.",
      },
      {
        title: "Key salting for a hot write counter",
        language: "typescript",
        code: `const SPLITS = 16;

// Writes spread over 16 keys, likely on different shards
function incrementLikes(postId: string) {
  const shard = Math.floor(Math.random() * SPLITS);
  return store.incr("likes:" + postId + ":" + shard);
}

// Reads gather and sum (cache the sum briefly for hot posts)
async function getLikes(postId: string) {
  const keys = Array.from({ length: SPLITS }, (_, i) => "likes:" + postId + ":" + i);
  const counts = await store.mget(keys);
  return counts.reduce((sum, count) => sum + Number(count ?? 0), 0);
}`,
        explanation:
          "Splitting turns one hot key into N cooler ones. Writes get cheaper, reads get more expensive, so only split keys you know are hot.",
      },
    ],
    howItWorks: `
**Detecting hot keys.** You can't fix what you can't see. Sample requests
per key at the proxy or client, keep top-k with a Count-Min Sketch, and
alert on per-shard skew (one node at 90% CPU while others idle). Redis
offers **--hotkeys** (with an LFU eviction policy) and many managed stores
publish per-partition metrics.

**Read-hot keys.**
- **Local (in-process) cache** with a short TTL (1–5 s). Thousands of app
  servers each hold a copy, so the shared cache sees one request per
  server per TTL instead of every user request.
- **Replicate the key**: store copies as key#1..key#N on different nodes
  and read a random one. Writes must update all copies.
- **CDN or edge caching** for public content.

**Write-hot keys.**
- **Salting / splitting**: write to key#random(N) and aggregate on read.
- **Buffer and batch**: accumulate increments in memory or a queue and
  flush every second, turning 10,000 writes into one.
- **Isolate** known hot entities on dedicated partitions.

**Cache stampede.**
- **Request coalescing (single-flight)**: within a process, only one
  caller rebuilds a key; others await the same promise. Across processes,
  a short-TTL lock (SET key NX PX) lets one server rebuild while others
  serve stale data or wait briefly.
- **Stale-while-revalidate**: keep serving the old value past its soft
  TTL while one request refreshes it in the background. Requires a hard
  TTL longer than the soft one.
- **Probabilistic early expiration (XFetch)**: each read refreshes early
  with a probability that rises as expiry nears.
- **TTL jitter**: add ±10–20% randomness so keys written together don't
  expire together.
- **Warm caches** before cutover after a deploy or cache-cluster restart.

**Thundering herd beyond caches.** The same pattern hits when a service
recovers and every client retries at once, or when cron jobs all fire at
:00. Fix with exponential backoff **with jitter**, retry budgets, and
spreading scheduled work.
    `.trim(),
    diagram: `
Without coalescing                    With single-flight

1000 requests --miss--> DB x1000      1000 requests --miss--> 1 loader --> DB x1
                                                     999 wait <---- shared result

Hot partition                         Salted key

likes:42 -> shard 3 (100% CPU)        likes:42:0  -> shard 1
           shards 1,2,4 idle          likes:42:1  -> shard 4
                                      ...
                                      likes:42:15 -> shard 2   (sum on read)
    `.trim(),
    whyItExists: `
Popularity follows a power law: a small number of keys get most of the
traffic, and the extremes arrive suddenly. Horizontal scaling helps only
when load spreads across keys. Hot-key and stampede techniques handle the
cases where it doesn't, which are exactly the moments (launches, viral
events, outages) when failure is most visible.
    `.trim(),
    whenToUse: `
- Social feeds, celebrity profiles, viral posts, live-event scoreboards.
- Flash sales and ticket drops on a single product or event.
- Any expensive cached value (a homepage, a config blob) read by every
  request.
- Global counters: likes, views, inventory.
- After deploys or cache restarts, when many keys are cold at once.
    `.trim(),
    whenNotToUse: `
- Don't salt every key "just in case". It multiplies read cost and adds
  complexity. Detect hot keys first, then treat those.
- Local caches are wrong for data that must be immediately consistent
  (balances, permissions just revoked) unless you can accept TTL-long
  staleness.
- Probabilistic early refresh matters for expensive or very popular
  entries; for cheap, cold keys plain TTLs are fine.
    `.trim(),
    commonMistakes: [
      "Adding shards to fix a hot key. The key still lives on one shard; you need to split, replicate or cache it.",
      "Setting the same TTL on keys populated together, so they all expire in the same second.",
      "Implementing single-flight but not clearing the in-flight entry on failure, so one error poisons the key until restart.",
      "Retrying without jitter after an outage, so recovering services are knocked over again by synchronized retries.",
      "Using a distributed lock for rebuilds without a timeout, so a crashed holder blocks the key forever.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain the difference between a hot key and a cache stampede, with one example of each." },
      { difficulty: "Medium", prompt: "A homepage payload takes 2 seconds to build and is read 50,000 times per second. Design caching so that expiry never causes a database spike." },
      { difficulty: "Hard", prompt: "Design the like counter for posts where a celebrity post can receive 200,000 likes per second. Cover write path, read path, consistency of the displayed count and how you detect which posts need special handling." },
    ],
    interviewQuestions: [
      { question: "What is a hot key?", answer: "A single key receiving disproportionate traffic, so the node or partition holding it is overloaded even though the rest of the cluster has spare capacity." },
      { question: "What is a cache stampede?", answer: "When a popular cache entry expires or the cache is cold, many concurrent requests miss at once and all hit the backing store to recompute the same value, often overloading it." },
      { question: "What is request coalescing (single-flight)?", answer: "Deduplicating concurrent requests for the same key so only one does the expensive work and the others wait for and share its result." },
      { question: "Why add jitter to TTLs?", answer: "Entries written at the same time with the same TTL expire at the same time, creating periodic stampedes. Random jitter spreads expirations out." },
      { question: "How does probabilistic early expiration work?", answer: "Each read refreshes the value early with a probability that rises as expiry approaches and as recompute cost grows (XFetch: refresh if now − recomputeTime·β·ln(rand) ≥ expiry). Usually one request refreshes before expiry, so there's no mass miss." },
      { question: "How do you handle a key that is hot for reads?", answer: "Cache it close to the caller: in-process caches with short TTLs, replicate it as several keys on different nodes and read one at random, or put it behind a CDN. Choose based on how stale it can be." },
      { question: "How do you handle a key that is hot for writes?", answer: "Split it into N sub-keys and aggregate on read, or buffer increments and flush in batches. Both trade read cost or freshness for write throughput." },
      { question: "What is stale-while-revalidate and what's its trade-off?", answer: "Serve the expired value while one request refreshes it in the background. Latency and backend load stay flat, at the cost of serving slightly stale data for a short window." },
      { question: "How would you detect hot keys in production?", answer: "Sample per-key request counts at clients or proxies, track top-k with a sketch, and watch per-shard CPU, QPS and latency skew. Alert when one shard diverges, and feed detected keys into automatic local caching or splitting." },
      { question: "A cache cluster restarts and the database immediately saturates. How do you prevent this next time?", answer: "Warm the cache before taking traffic, restart nodes gradually, use request coalescing and serve-stale on misses, rate-limit or shed load to the database, and have clients retry with exponential backoff and jitter. Consider a replicated cache so one node's loss doesn't empty everything." },
    ],
    prerequisites: ["caching", "sharding"],
    relatedTopics: ["caching", "cache-eviction-policies", "sharding", "consistent-hashing", "timeouts-retries-and-backoff", "backpressure-and-load-shedding", "bloom-filters-and-probabilistic-structures", "distributed-locks-and-fencing"],
    keywords: ["hot key", "hot partition", "celebrity problem", "thundering herd", "cache stampede", "dogpile", "single-flight", "request coalescing", "XFetch", "early expiration", "stale-while-revalidate", "key salting", "TTL jitter"],
  },
  {
    id: "backpressure-and-load-shedding",
    title: "Backpressure and Load Shedding",
    level: "advanced",
    description: "Keeping a system healthy when demand exceeds capacity: slowing producers, bounding queues, rejecting early and degrading gracefully.",
    explanation: `
Every system has a maximum throughput. When more work arrives than it can
finish, the excess has to go somewhere. If you don't decide where, it goes
into **unbounded queues and memory**, latency climbs for everyone, timeouts
fire, clients retry, load grows further, and the system collapses. This is
**congestive collapse** or a **retry storm**.

There are only a few honest options when demand exceeds capacity:

- **Backpressure**: tell the producer to slow down ("not now"), so the
  pressure moves upstream instead of piling up inside.
- **Load shedding**: reject some work quickly (HTTP 429/503) so the work
  you accept still finishes on time.
- **Prioritization**: when you must drop something, drop the least
  important work first.
- **Graceful degradation**: do a cheaper version of the work (skip
  recommendations, serve cached results).
- **Bulkheads**: isolate resources so one overloaded dependency can't
  consume everything.
- **Admission control**: decide at the door whether a request can be
  served in time, before spending anything on it.

The pro mindset: **overload is a normal operating condition**, not an
edge case. Design what happens at 2x capacity before it happens.
    `.trim(),
    analogy:
      "A popular restaurant with a full kitchen doesn't seat everyone and let food take three hours. The host keeps a short waiting list, tells new arrivals 'we're full, try at 9', offers a simpler menu when slammed, and keeps a separate counter for takeaway so dine-in chaos doesn't block it.",
    examples: [
      {
        title: "Bounded concurrency with fast rejection",
        language: "typescript",
        code: `const MAX_IN_FLIGHT = 200;   // from load testing: past this, latency explodes
const MAX_WAITING = 100;     // short queue absorbs bursts, not sustained overload
let inFlight = 0;
const waiting: Array<() => void> = [];

async function admit<T>(handler: () => Promise<T>): Promise<T> {
  if (inFlight >= MAX_IN_FLIGHT) {
    if (waiting.length >= MAX_WAITING) {
      throw new AppError(AppErrorCode.Overloaded, "Server busy, retry later"); // -> 503 + Retry-After
    }
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  inFlight++;
  try {
    return await handler();
  } finally {
    inFlight--;
    waiting.shift()?.();
  }
}`,
        explanation:
          "A bounded queue in front of bounded concurrency. Under overload, extra requests fail in microseconds instead of timing out after 30 seconds and holding memory.",
        walkthrough: [
          { code: "const MAX_IN_FLIGHT = 200;", explanation: "The most requests worked on at once; chosen from measurement, not guesswork." },
          { code: "if (waiting.length >= MAX_WAITING) { throw ... }", explanation: "If even the waiting line is full, reject immediately so the client can back off or go elsewhere." },
          { code: "await new Promise<void>((resolve) => waiting.push(resolve));", explanation: "Otherwise wait in a short, bounded line for a free slot." },
          { code: "finally { inFlight--; waiting.shift()?.(); }", explanation: "When a request finishes, free the slot and wake the next waiter." },
        ],
      },
      {
        title: "Priority-based shedding",
        language: "typescript",
        code: `type Priority = "critical" | "default" | "sheddable";

// Shed lower tiers first as utilization climbs.
function shouldShed(priority: Priority, utilization: number): boolean {
  if (priority === "sheddable") return utilization > 0.7; // prefetch, analytics, batch
  if (priority === "default") return utilization > 0.9;   // normal user reads
  return utilization > 0.98;                              // checkout, login
}`,
        explanation:
          "Callers tag requests (often via a header set at the edge). Under pressure, background and prefetch traffic disappears first, protecting the actions users and the business care about most.",
      },
      {
        title: "Pull-based backpressure in a stream consumer",
        language: "typescript",
        code: `// Node streams: write() returns false when the buffer is full.
for await (const record of sourceStream) {
  const ok = destinationStream.write(transform(record));
  if (!ok) {
    await once(destinationStream, "drain"); // stop reading until the consumer catches up
  }
}`,
        explanation:
          "The reader only pulls more when the writer has room. Kafka consumers, Reactive Streams (request(n)) and TCP flow control all use the same idea.",
      },
    ],
    howItWorks: `
**Why unbounded queues are dangerous.** Little's Law says **L = λ × W**:
items in the system = arrival rate × time in system. If arrivals exceed
service rate, the queue grows without limit, so wait time grows without
limit. Requests then wait longer than their callers' timeouts, so the
server does work nobody is waiting for. Throughput of *useful* work drops
toward zero even though the server is 100% busy.

**Backpressure** propagates "slow down" upstream. In-process: bounded
channels and blocking writes. Between services: pull-based consumption
(Kafka consumers fetch at their own pace), credit-based flow (gRPC/HTTP/2
flow-control windows, Reactive Streams request(n)), or explicit signals
(429 with Retry-After). Backpressure only works if the producer *can* slow
down; user traffic usually can't, so at the edge you shed instead.

**Load shedding.** Reject cheaply and early: at the load balancer or the
first middleware, before parsing bodies or calling databases. Signals for
"overloaded": in-flight count, queue length, **queueing delay** (CoDel
style: drop when requests have waited longer than a target), CPU, or
latency over SLO. Return 503/429 with **Retry-After** so clients back off.
Also drop requests whose deadline has already passed (deadline
propagation): finishing them wastes capacity.

**Adaptive concurrency limits.** Instead of a hard-coded limit, measure
latency and adjust the limit like TCP congestion control (AIMD, or
gradient-based limiters such as Netflix's concurrency-limits library).

**Prioritization.** Tag traffic by importance (critical, default,
sheddable, batch) and shed from the bottom. Serve queues **LIFO under
overload** in some systems, since the newest request's caller is most
likely still waiting.

**Bulkheads.** Separate thread pools, connection pools or whole instances
per dependency or per tenant. If the recommendations service hangs, only
its pool fills; checkout keeps its own capacity. Cell-based architecture is
the bulkhead idea at infrastructure scale.

**Graceful degradation.** Pre-plan cheaper modes: static fallback, cached
or stale results, disabling expensive features via flags, lower-quality
media, fewer search results. Combine with circuit breakers so you stop
calling a failing dependency.

**Retry discipline.** Retries multiply load exactly when the system is
weakest. Use **retry budgets** (e.g. retries ≤ 10% of requests),
exponential backoff with jitter, and retry at one layer only.
    `.trim(),
    diagram: `
Throughput vs offered load

useful  |          ______________  with shedding (plateaus)
work    |        /
        |       /\\
        |      /  \\
        |     /    \\____  without shedding (collapse)
        |____/__________\\______________
             capacity          offered load ->

Request path with admission control

client -> [edge: rate limit] -> [admission: shed by priority]
            -> [bounded queue] -> [worker pool] -> [bulkhead pools per dependency]
    `.trim(),
    whyItExists: `
Overload is guaranteed eventually: traffic spikes, a slow dependency, a
bad deploy that halves capacity, a retry storm after a blip. A system with
no explicit overload behaviour fails badly and slowly, and often stays
down after the trigger is gone (a **metastable failure**). Explicit limits
turn "everything is down" into "some requests got a fast error", which is
far easier to recover from.
    `.trim(),
    whenToUse: `
- Every service that takes traffic it doesn't control: put bounds on
  concurrency, queue sizes and timeouts.
- Data pipelines where producers can outpace consumers.
- Multi-tenant platforms (per-tenant limits and bulkheads).
- Systems with a clear importance ranking among requests (checkout vs
  browsing, user requests vs batch jobs).
    `.trim(),
    whenNotToUse: `
- Don't shed work that can't be retried and must not be lost (an accepted
  payment). Accept it durably (write to a log or queue) and process it
  later instead.
- Don't add elaborate priority tiers to a small internal tool; a simple
  concurrency limit and timeout is enough.
- Backpressure doesn't help when the producer can't slow down (end users,
  sensors). There you need shedding, sampling or buffering to durable
  storage.
    `.trim(),
    commonMistakes: [
      "Using unbounded queues and thread pools, so overload shows up as memory exhaustion and multi-minute latency instead of fast errors.",
      "Shedding too late, after parsing, authenticating and querying, so rejected requests still consume most of the cost.",
      "Retrying at every layer (client, gateway, service, mesh), multiplying load 3x–27x during an incident.",
      "Setting limits from guesses instead of load tests, so they are either never hit or hit at normal traffic.",
      "Having one shared connection pool for all dependencies, so one slow downstream starves everything (no bulkheads).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain why an unbounded queue makes latency worse under sustained overload, using Little's Law." },
      { difficulty: "Medium", prompt: "An API serves checkout, product browsing, and a recommendations widget from the same fleet. Design priority classes and shedding thresholds, and describe what each user sees at 150% load." },
      { difficulty: "Hard", prompt: "After a 30-second database blip, your service stays overloaded for an hour even though the database recovered. Explain the metastable failure and design changes (retries, queues, shedding, deadlines) that would let it recover on its own." },
    ],
    interviewQuestions: [
      { question: "What is backpressure?", answer: "A mechanism for a slow consumer to signal producers to slow down, so excess work stays at the source instead of piling up in memory along the pipeline." },
      { question: "What is load shedding?", answer: "Deliberately rejecting some requests quickly when the system is at capacity, so the requests it does accept still meet their latency targets." },
      { question: "Why are bounded queues important?", answer: "Bounded queues cap memory and waiting time. With an unbounded queue, sustained overload grows latency without limit until every request times out, so the server does only wasted work." },
      { question: "What is a bulkhead?", answer: "Isolating resources (thread pools, connections, instances) per dependency or tenant so one slow or overloaded part can't consume capacity needed by the others." },
      { question: "What status code and headers should a shed request return?", answer: "Usually 503 (server overloaded) or 429 (client over its quota), with Retry-After so well-behaved clients back off instead of retrying immediately." },
      { question: "How do you decide what to shed first?", answer: "Classify requests by business importance and by whether they can be retried, then shed from the least important tier: prefetch and analytics first, normal reads next, critical writes like checkout last." },
      { question: "What is admission control and where should it happen?", answer: "Deciding whether to accept a request before spending resources on it, based on current load, priority and whether it can finish within its deadline. Do it as early and cheaply as possible, ideally at the edge or first middleware." },
      { question: "Why is deadline propagation useful under overload?", answer: "Each request carries its remaining time budget. Downstream services drop requests that can't finish in time instead of doing work whose caller has already given up, freeing capacity for live requests." },
      { question: "What is a metastable failure, and how do retries cause it?", answer: "A state where the system stays overloaded after the original trigger is gone, sustained by its own feedback loop. Retries add load when it's weakest, timeouts trigger more retries, and queues fill with stale work. Retry budgets, jittered backoff, bounded queues and shedding break the loop." },
      { question: "Static concurrency limits vs adaptive limits: trade-offs?", answer: "Static limits are simple and predictable but go stale as code, hardware and dependencies change. Adaptive limits (AIMD or latency-gradient based) track real capacity automatically but are harder to reason about and can oscillate, so they need sane floors and ceilings." },
    ],
    prerequisites: ["queues", "rate-limiting", "circuit-breaker"],
    relatedTopics: ["rate-limiting", "circuit-breaker", "queues", "timeouts-retries-and-backoff", "hot-keys-and-thundering-herd", "multi-region-and-disaster-recovery", "availability-and-slas", "event-streaming"],
    keywords: ["backpressure", "load shedding", "bounded queue", "admission control", "bulkhead", "graceful degradation", "prioritization", "Little's Law", "retry storm", "metastable failure", "CoDel", "adaptive concurrency", "deadline propagation"],
  },
  {
    id: "multi-region-and-disaster-recovery",
    title: "Multi-Region and Disaster Recovery",
    level: "advanced",
    description: "Surviving the loss of a data centre or a whole region: RPO/RTO, backups, active-passive vs active-active, failover, cells and game days.",
    explanation: `
Servers fail, so you run several. But a whole **data centre** or **cloud
region** can fail too: power, network cuts, a bad config pushed everywhere,
a cloud provider incident. Data can also be lost without any outage: a
buggy migration, an accidental DELETE, ransomware.

**Disaster recovery (DR)** is the plan for getting back to a working state
after those events. Two numbers frame every DR decision:

- **RPO (Recovery Point Objective)**: how much data you can afford to
  lose, measured in time. RPO of 5 minutes means losing at most the last
  5 minutes of writes.
- **RTO (Recovery Time Objective)**: how long you can be down. RTO of 1
  hour means service must be back within an hour.

Lower RPO and RTO cost more: more replicas, more regions, more
complexity. The job is to pick targets **per system** based on business
impact, then design the cheapest architecture that meets them, and
**prove it with regular drills**. An untested DR plan is a hope, not a
plan.
    `.trim(),
    analogy:
      "RPO is how many pages of your essay you'd lose if your laptop died: autosave every minute means one minute of work. RTO is how long until you're writing again: a spare laptop on the desk is minutes, ordering a new one is days. Backups in the same bag as the laptop don't help if the bag is stolen.",
    examples: [
      {
        title: "Choosing a DR tier per system",
        language: "text",
        code: `System              RPO        RTO        Strategy
------------------  ---------  ---------  ---------------------------------------
Payments ledger     ~0         < 5 min    Multi-region, synchronous/consensus writes
Product catalog     5 min      30 min     Warm standby, async replication
Search index        rebuild    4 h        Rebuild from source of truth + snapshots
Analytics warehouse 24 h       24 h       Daily backups to another region
Internal wiki       24 h       72 h       Backup and restore`,
        explanation:
          "Not everything needs active-active. Tiering by business impact keeps cost proportional to risk.",
      },
      {
        title: "DNS-based failover with health checks (Route 53 style)",
        language: "yaml",
        code: `# Primary record answers while its health check passes.
- name: api.example.com
  type: A
  set_identifier: primary-us-east-1
  failover: PRIMARY
  alias_target: alb-us-east-1
  health_check: api-us-east-1-deep-health   # checks DB writes, not just "200 OK"
# Secondary takes over when the primary is unhealthy.
- name: api.example.com
  type: A
  set_identifier: secondary-us-west-2
  failover: SECONDARY
  alias_target: alb-us-west-2
# Keep TTLs low (e.g. 60 s) so clients move quickly; some resolvers cache longer anyway.`,
        explanation:
          "Traffic failover is the easy half. The hard half is making sure the secondary's data is current and that the old primary stops accepting writes.",
        walkthrough: [
          { code: "failover: PRIMARY", explanation: "This region gets all traffic while it is healthy." },
          { code: "health_check: api-us-east-1-deep-health", explanation: "A check that exercises real dependencies, so a region with a dead database counts as unhealthy." },
          { code: "failover: SECONDARY", explanation: "DNS answers with this region only when the primary's check fails." },
          { code: "# Keep TTLs low", explanation: "Clients cache DNS answers; a long TTL delays failover." },
        ],
      },
      {
        title: "Cell-based routing",
        language: "typescript",
        code: `// A thin, highly reliable router maps each customer to one cell.
// Each cell is a full, independent copy of the stack with its own data.
function cellFor(customerId: string): string {
  const pinned = cellAssignments.get(customerId); // explicit overrides, migrations
  if (pinned) return pinned;
  return CELLS[hash(customerId) % CELLS.length];
}`,
        explanation:
          "A bad deploy or poison request takes down one cell (a fraction of customers), not everyone. Deploy to cells one at a time.",
      },
    ],
    howItWorks: `
**Backups.** The baseline for every system, even multi-region ones,
because replication faithfully copies mistakes (a dropped table replicates
in milliseconds).
- **Full + incremental** backups, plus **point-in-time recovery** from
  write-ahead logs or binlogs.
- **3-2-1 rule**: 3 copies, 2 different media/services, 1 off-site (another
  region or account). Add an **immutable** or logically air-gapped copy
  against ransomware and compromised credentials.
- **Test restores** regularly. Restore time for 20 TB is your real RTO for
  that path, and it's often hours.

**DR strategies**, in rising cost and falling RPO/RTO:
1. **Backup and restore**: rebuild infrastructure and restore data in
   another region. RPO hours, RTO hours to days.
2. **Pilot light**: data replicated continuously, core infrastructure
   provisioned but scaled to zero. Scale up on failover.
3. **Warm standby**: a smaller full copy running and receiving replicated
   data. Scale up and switch traffic. Minutes.
4. **Active-active (multi-site)**: every region serves live traffic.
   Failover is just shifting traffic. Seconds to minutes.

**Active-passive** is simpler: one region takes writes, others replicate
asynchronously. The catch: async replication means an unplanned failover
loses whatever hadn't replicated (RPO > 0), and you must **fence** the old
primary so it can't keep accepting writes (split brain).

**Active-active** means each region accepts traffic. For reads it's easy.
For writes you need one of:
- **Partition ownership**: each user/tenant is "homed" in one region, so
  writes for a given key go to one place.
- **Synchronous consensus across regions** (Spanner, CockroachDB): RPO ≈ 0,
  but every write pays cross-region latency (tens of ms or more).
- **Multi-leader with conflict resolution** (last-writer-wins, CRDTs):
  low latency, but you must accept and resolve conflicts.

**Failover mechanics.** Detect (health checks with sensible thresholds to
avoid flapping), decide (automatic for fast RTO, human-confirmed for
risky data paths), promote the replica, fence the old primary, shift
traffic (DNS, anycast, global load balancer), then **fail back** later
with the same care. Make sure the standby has capacity: if every customer
in Europe fails over to one other region, can it take 2x load? Cloud
capacity in the target region may be scarce during a regional incident, so
some teams pre-provision.

**Data residency.** Laws such as GDPR and sector rules can require some
data to stay within a jurisdiction. That constrains where replicas and
backups may live, and can force per-region data stores with only
anonymised or aggregated data crossing borders.

**Cell-based architecture.** Split the system into many identical,
independent **cells**, each serving a subset of customers with its own
compute and data. A thin routing layer maps customers to cells. Failures,
bad deploys and noisy tenants are contained to one cell (smaller **blast
radius**), and you scale by adding cells. The router must be extremely
simple and reliable, since it's shared.

**Chaos engineering and game days.** Deliberately inject failures in a
controlled way to verify the system and the team respond as designed.
Netflix's **Chaos Monkey** randomly terminates instances; **game days**
are scheduled exercises, such as failing over a region, with clear abort
criteria and a small blast radius to start.
    `.trim(),
    diagram: `
Active-passive                          Active-active (users homed per region)

  users                                   EU users          US users
    |                                        |                  |
    v                                        v                  v
+----------+   async repl   +----------+  +----------+      +----------+
| Region A | -------------> | Region B |  | Region A | <--> | Region B |
| primary  |                | standby  |  | home: EU |repl. | home: US |
+----------+                +----------+  +----------+      +----------+
RPO = replication lag                     each region writes its own users;
RTO = detect + promote + DNS              on failure, the other region takes over

Backups (separate account, immutable) ---> restore anywhere
    `.trim(),
    whyItExists: `
Single-region systems are exposed to events no amount of in-region
redundancy fixes, and data loss from human error or attack is a far more
common "disaster" than a region going dark. DR planning turns these from
existential risks into rehearsed procedures with known costs, and it's
often a contractual or regulatory requirement.
    `.trim(),
    whenToUse: `
- Every production system needs backups with tested restores and a
  written RPO/RTO, even if the answer is "24 hours is fine".
- Warm standby or active-passive when downtime is costly but some data
  loss on a rare regional failure is tolerable.
- Active-active when you need near-zero RTO, global low latency, or both,
  and can afford the data-model work.
- Cells for large multi-tenant SaaS where one tenant or deploy must not
  take down everyone.
    `.trim(),
    whenNotToUse: `
- Don't go active-active for a small product whose users tolerate an hour
  of downtime per year. The complexity often causes more outages than it
  prevents.
- Multi-region isn't a substitute for backups: replication copies
  corruption and deletes.
- Synchronous cross-region writes are wrong for latency-sensitive paths
  that don't need RPO 0; the latency is paid on every write.
    `.trim(),
    commonMistakes: [
      "Never testing restores, then discovering during an incident that backups are incomplete, corrupt or take days to restore.",
      "Keeping backups in the same account and region as production, so one compromised credential or regional outage takes both.",
      "Failing over without fencing the old primary, leading to split brain and two divergent copies of the data.",
      "Shallow health checks that return 200 while the database behind them is down, so failover never triggers (or triggers on harmless blips).",
      "Forgetting shared dependencies: DNS, identity provider, secrets store, CI/CD or a control plane that only exists in the failed region.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Define RPO and RTO and give an example system where RPO matters more than RTO." },
      { difficulty: "Medium", prompt: "A Postgres primary in one region replicates asynchronously to another. Write the step-by-step runbook for an unplanned regional failover, including fencing and how you measure data lost." },
      { difficulty: "Hard", prompt: "Design an active-active architecture for a global SaaS app with EU data-residency requirements, a 1-minute RTO and near-zero RPO for billing data. Explain data placement, write routing, conflict handling and how you'd run a game day." },
    ],
    interviewQuestions: [
      { question: "What are RPO and RTO?", answer: "RPO is the maximum acceptable data loss measured in time; RTO is the maximum acceptable time to restore service. They drive the choice of backup and replication strategy." },
      { question: "Why do you still need backups if data is replicated to another region?", answer: "Replication copies everything, including accidental deletes, bad migrations and ransomware encryption. Backups with point-in-time recovery let you go back to before the mistake." },
      { question: "What is the 3-2-1 backup rule?", answer: "Keep at least three copies of data, on two different kinds of storage or services, with one copy off-site. Modern practice adds an immutable or isolated copy." },
      { question: "Compare backup-and-restore, pilot light, warm standby and active-active.", answer: "In order of cost and speed: rebuild from backups (hours+), keep data replicated with minimal idle infrastructure (tens of minutes), run a scaled-down live copy (minutes), and serve from all regions at once (seconds)." },
      { question: "What is RPO for an unplanned failover with asynchronous replication?", answer: "Roughly the replication lag at the time of failure: any writes acknowledged by the primary but not yet replicated are lost unless the old primary is recovered later." },
      { question: "What is split brain, and how do you prevent it during failover?", answer: "Two nodes both believe they're the primary and accept writes, causing divergence. Prevent it by fencing the old primary (revoke its access, STONITH, fencing tokens) and using a consensus-based or single authoritative failover decision." },
      { question: "How do you handle writes in an active-active setup?", answer: "Either home each key or tenant in one region so writes for it go to one place, use cross-region consensus (higher latency, RPO 0), or accept concurrent writes with multi-leader replication and resolve conflicts with LWW or CRDTs." },
      { question: "What is cell-based architecture and what does it buy you?", answer: "The system is split into independent, identical cells, each serving a subset of customers with its own resources. It limits blast radius of failures and bad deploys, and scales by adding cells. The cost is a routing layer and cross-cell operations." },
      { question: "How does data residency affect DR design?", answer: "It limits where primary data, replicas and backups may live. You may need DR within the same jurisdiction (two EU regions), per-region data stores and routing, and controls to keep personal data from replicating elsewhere." },
      { question: "How would you build confidence that a regional failover actually works?", answer: "Run it regularly as a game day: start in staging, then fail over real production traffic for a subset in a quiet window, with abort criteria. Measure actual RTO and RPO, verify capacity and hidden single-region dependencies, and fix gaps. Some teams make failover routine by moving traffic between regions weekly." },
    ],
    prerequisites: ["database-replication", "consistency-models", "load-balancing"],
    relatedTopics: ["availability-and-slas", "database-replication", "consistency-models", "cap-theorem", "conflict-resolution-and-crdts", "consensus-and-leader-election", "distributed-locks-and-fencing", "dns", "deployment-strategies", "object-storage", "backpressure-and-load-shedding"],
    keywords: ["disaster recovery", "DR", "RPO", "RTO", "backup", "point-in-time recovery", "3-2-1", "active-passive", "active-active", "failover", "failback", "pilot light", "warm standby", "split brain", "data residency", "GDPR", "cell-based architecture", "blast radius", "chaos engineering", "game day", "Chaos Monkey"],
  },
  {
    id: "data-warehouses-and-olap",
    title: "Data Warehouses and OLAP",
    level: "advanced",
    description: "Systems built for analytics over huge datasets: OLTP vs OLAP, columnar storage, ETL vs ELT, lakes, lakehouses and star schemas.",
    explanation: `
The database behind your app answers questions like "get order 123" or
"insert this payment" thousands of times a second. That's **OLTP**
(Online Transaction Processing): many small reads and writes touching a
few rows each.

Analysts and dashboards ask different questions: "revenue by country by
week for the last two years", "which features do retained users use?".
These scan **billions of rows** but only a few columns, and run far less
often. That's **OLAP** (Online Analytical Processing).

Running OLAP queries on your OLTP database is slow and dangerous: one big
report can starve production traffic. So companies copy data into a
**data warehouse** (Snowflake, BigQuery, Redshift, ClickHouse and others)
designed for analytics: **columnar storage**, heavy compression, and
massively parallel scans.

Around the warehouse you'll hear about:
- **ETL vs ELT**: transform data before loading it, or load raw data and
  transform it inside the warehouse.
- **Data lakes**: cheap object storage holding raw files of any shape.
- **Lakehouses**: lakes plus table formats (Delta Lake, Apache Iceberg,
  Apache Hudi) that add transactions and schemas.
- **Star schema**: the classic way to model analytics data as facts and
  dimensions.
    `.trim(),
    analogy:
      "OLTP is a shop's till: fast, one sale at a time. OLAP is the accountant at year's end with every receipt, adding up columns. You wouldn't let the accountant work at the till during the lunch rush, so you give them a photocopy of the receipts in their own office, sorted the way they like.",
    examples: [
      {
        title: "Row vs columnar layout",
        language: "text",
        code: `Table: orders(order_id, date, country, amount)

Row store (OLTP): each row's values stored together
  [1, 2026-11-01, IN, 40] [2, 2026-11-01, US, 25] [3, 2026-11-02, IN, 60]

Column store (OLAP): each column's values stored together
  order_id: [1, 2, 3]
  date:     [2026-11-01, 2026-11-01, 2026-11-02]
  country:  [IN, US, IN]
  amount:   [40, 25, 60]

SELECT country, SUM(amount) FROM orders GROUP BY country;
  -> column store reads only 'country' and 'amount', skipping everything else`,
        explanation:
          "With 100 columns, a query touching 2 reads about 2% of the data in a column store. Similar values side by side also compress far better.",
        walkthrough: [
          { code: "Row store (OLTP)", explanation: "A whole order is in one place, which is ideal for reading or updating one order." },
          { code: "Column store (OLAP)", explanation: "All values of one column are together, which is ideal for scanning a column across millions of rows." },
          { code: "SELECT country, SUM(amount) ...", explanation: "Only the two needed columns are read from disk; the rest are never touched." },
        ],
      },
      {
        title: "A star schema and a typical query",
        language: "sql",
        code: `-- Fact table: one row per event, mostly foreign keys and numbers
CREATE TABLE fact_sales (
  date_key     INT,      -- -> dim_date
  product_key  INT,      -- -> dim_product
  customer_key INT,      -- -> dim_customer
  quantity     INT,
  revenue      DECIMAL(12, 2)
)
PARTITION BY date_key;   -- syntax varies by warehouse

-- Dimension tables: descriptive attributes, wide and comparatively small
-- dim_date(date_key, date, week, month, quarter, year, is_holiday)
-- dim_product(product_key, name, category, brand)
-- dim_customer(customer_key, country, segment, signup_date)

SELECT d.month, p.category, SUM(f.revenue) AS revenue
FROM fact_sales f
JOIN dim_date d     ON f.date_key = d.date_key
JOIN dim_product p  ON f.product_key = p.product_key
WHERE d.year = 2026
GROUP BY d.month, p.category;`,
        explanation:
          "The date filter lets the engine skip whole partitions (partition pruning), and only a handful of columns are scanned.",
      },
      {
        title: "ELT with SQL models (dbt style)",
        language: "sql",
        code: `-- models/daily_revenue.sql : raw data is already loaded; transform in the warehouse
SELECT
  DATE(created_at)        AS order_date,
  country,
  SUM(amount_cents) / 100 AS revenue
FROM {{ ref('raw_orders') }}
WHERE status = 'paid'
GROUP BY 1, 2`,
        explanation:
          "In ELT, transformations are versioned SQL run by the warehouse's own compute. Raw data stays available, so you can rebuild models when logic changes.",
      },
    ],
    howItWorks: `
**Why columnar is fast for analytics.**
- **Less I/O**: read only the columns a query uses.
- **Compression**: a column holds one type with many repeats, so
  dictionary, run-length and delta encoding often shrink data several-fold
  or more, meaning even less I/O.
- **Vectorized execution**: process batches of column values in tight
  loops that use CPU caches and SIMD well.
- **Zone maps / min-max stats**: per-block min and max values let the
  engine skip blocks that can't match a filter.
- The cost: single-row inserts and updates are expensive (a row's values
  are spread over many column files), so warehouses prefer **bulk loads**
  and append-heavy workloads.

**Massively parallel processing (MPP).** Data is split across many nodes
or files; each scans its part, and partial aggregates are combined. Many
modern warehouses **separate storage and compute**: data sits in object
storage, and compute clusters scale (or pause) independently.

**Partitioning and clustering.** Most analytics filters on time, so
tables are partitioned by date. A query for "last 7 days" reads 7
partitions instead of years. Clustering/sort keys inside partitions
(e.g. by customer_id) make other filters prune well too. Too many tiny
partitions hurt: small files mean overhead per file.

**Getting data in.**
- **ETL** (Extract, Transform, Load): clean and reshape in a separate
  system, then load. Traditional when warehouse compute was expensive;
  still useful for removing sensitive fields before data lands.
- **ELT**: load raw data first, transform with SQL inside the warehouse.
  Common today because warehouse compute is elastic and raw data stays
  available for reprocessing.
- **CDC (change data capture)** streams row changes from the OLTP
  database's log into the warehouse, avoiding heavy nightly extracts.

**Lake and lakehouse.** A **data lake** stores raw files (JSON, CSV,
Parquet) in object storage cheaply, with schema applied on read. Without
discipline it becomes a "data swamp". **Open table formats** (Iceberg,
Delta Lake, Hudi) add a metadata layer over Parquet files: ACID commits,
schema evolution, time travel and efficient upserts, so many engines
(Spark, Trino, Flink, warehouses) can share one copy of the data. That
combination is called a **lakehouse**.

**Modelling.** A **star schema** has a central **fact table** (events or
transactions with numeric measures) surrounded by **dimension tables**
(who, what, where, when). A **snowflake schema** normalises dimensions
further. Dimensions that change over time (a customer moves country) use
**slowly changing dimension** techniques, for example Type 2: add a new
row with validity dates so history stays correct.
    `.trim(),
    diagram: `
OLTP DBs --CDC/extract--> [ Object storage: raw zone ] --transform--> [ curated tables ]
SaaS APIs --------------> [  (data lake, Parquet)    ]                (Iceberg/Delta or
Event stream -----------> [                          ]                 warehouse tables)
                                                                            |
                                                         BI dashboards, ad-hoc SQL, ML

Star schema
                 dim_date
                    |
   dim_product -- fact_sales -- dim_customer
                    |
                dim_store
    `.trim(),
    whyItExists: `
Transactional databases are optimised to touch a few rows quickly and
safely. Analytical questions touch most rows but few columns, and
combine data from many systems. Using one engine for both makes each
worse. A separate analytics store lets the business query everything it
knows without endangering production.
    `.trim(),
    whenToUse: `
- Business reporting, dashboards and ad-hoc analysis over months or years
  of data.
- Combining data from many sources (app databases, payments provider,
  CRM, events) into one place.
- Feature generation and training data for ML.
- High-volume event analytics (ClickHouse, Druid, Pinot are popular for
  real-time, user-facing analytics).
    `.trim(),
    whenNotToUse: `
- Serving your app's transactional reads and writes: warehouses have
  higher per-query latency and poor single-row update performance.
- Small data. If everything fits in one Postgres instance and reports run
  in seconds, a read replica may be all you need.
- Strictly real-time decisions in the request path. Most warehouse
  pipelines have minutes-to-hours of lag; use a stream processor or an
  OLTP store for that.
    `.trim(),
    commonMistakes: [
      "Running heavy analytics queries directly on the production primary database.",
      "Using SELECT * in a columnar warehouse, which throws away the main benefit and inflates scan costs.",
      "Not partitioning by date (or filtering on the partition column), so every query scans all history.",
      "Producing millions of tiny files in a lake, which kills query planning and scan performance; compact them.",
      "Overwriting dimension attributes in place, so historical reports silently change (e.g. last year's sales move to a customer's new country).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain why a columnar database is faster than a row database for 'average order value per country' but slower for 'update order 42'." },
      { difficulty: "Medium", prompt: "Design a star schema for a ride-hailing company's trip analytics. Name the fact table, its grain, the measures and at least four dimensions." },
      { difficulty: "Hard", prompt: "Design a pipeline that keeps a warehouse within 5 minutes of a 2 TB Postgres OLTP database, handles schema changes, supports reprocessing after a bug in transformation logic, and removes personal data for deleted users." },
    ],
    interviewQuestions: [
      { question: "What's the difference between OLTP and OLAP?", answer: "OLTP handles many small, concurrent transactions touching few rows, with low latency. OLAP runs fewer, large queries that scan and aggregate many rows across few columns." },
      { question: "Why is columnar storage good for analytics?", answer: "Queries read only the columns they need, columns of one type compress very well, and engines can process column batches with vectorized execution. Together this cuts I/O and CPU per row dramatically." },
      { question: "What is a star schema?", answer: "A central fact table of measurable events (sales, trips) with foreign keys to surrounding dimension tables that describe them (date, product, customer). It's simple to query and works well with columnar engines." },
      { question: "ETL vs ELT?", answer: "ETL transforms data before loading it into the warehouse; ELT loads raw data first and transforms it inside the warehouse with SQL. ELT is common now because warehouse compute is elastic and keeping raw data enables reprocessing." },
      { question: "What is partition pruning?", answer: "When a query filters on the partition column (usually date), the engine skips partitions that can't match, reading only relevant data. Without that filter, it scans everything." },
      { question: "Data lake vs data warehouse?", answer: "A lake stores raw files of any format cheaply in object storage, with schema on read. A warehouse stores structured, modelled tables optimized for SQL, with schema on write. Lakes are flexible and cheap; warehouses are easier to query reliably." },
      { question: "What is a lakehouse?", answer: "Lake storage (Parquet on object storage) plus an open table format like Iceberg, Delta Lake or Hudi that adds ACID transactions, schema evolution and time travel, so warehouse-style workloads can run directly on the lake with many engines." },
      { question: "How do you keep a warehouse in sync with an OLTP database without hurting it?", answer: "Use change data capture from the database's replication log (for example Debezium into Kafka), apply changes as merges in the warehouse, and avoid large repeated full-table extracts against the primary." },
      { question: "What is a slowly changing dimension Type 2?", answer: "When a dimension attribute changes, you insert a new row with a new surrogate key and validity dates instead of overwriting. Facts point to the version valid at the time, so historical reports stay accurate." },
      { question: "Your warehouse bill doubled and dashboards got slower. How do you investigate?", answer: "Find the most expensive queries by bytes scanned or credits used. Look for full scans missing partition filters, SELECT *, poorly clustered tables, repeated recomputation that could be materialized, and tiny-file problems. Add partition/cluster keys, incremental models and aggregate tables, and set per-team quotas." },
    ],
    prerequisites: ["databases", "sql-vs-nosql"],
    relatedTopics: ["databases", "storage-engines", "object-storage", "stream-and-batch-processing", "event-streaming", "sharding", "bloom-filters-and-probabilistic-structures", "database-replication"],
    keywords: ["data warehouse", "OLAP", "OLTP", "columnar storage", "column store", "Parquet", "ETL", "ELT", "CDC", "data lake", "lakehouse", "Iceberg", "Delta Lake", "Hudi", "star schema", "snowflake schema", "fact table", "dimension table", "partition pruning", "slowly changing dimension", "Snowflake", "BigQuery", "Redshift", "ClickHouse"],
  },
  {
    id: "service-mesh-and-sidecars",
    title: "Service Mesh and Sidecars",
    level: "advanced",
    description: "Moving retries, timeouts, mTLS and telemetry out of application code into proxies next to every service, and what that costs.",
    explanation: `
With microservices, every service talks to many others over the network.
Each of those calls needs the same things: service discovery, load
balancing, timeouts, retries, encryption, authentication, metrics and
tracing. Writing that into every service, in every language, is
repetitive and inconsistent.

A **service mesh** moves this networking logic out of the application and
into a **proxy** that runs next to each service instance, usually as a
**sidecar** container. The app talks plain HTTP to localhost; the proxy
handles the hard parts and talks to other proxies.

A mesh has two halves:
- **Data plane**: the proxies (often **Envoy**) that every request flows
  through.
- **Control plane**: a central component (for example Istio's istiod)
  that tells every proxy what routes, policies and certificates to use.

**Context: containers and Kubernetes.** A **container** packages an app
with its dependencies into an isolated process. **Kubernetes** runs
containers across a cluster. Its smallest unit is a **pod**: one or more
containers that share a network namespace (same IP and localhost). That
shared localhost is what makes the sidecar pattern work: a proxy container
in the same pod can intercept all of the app container's traffic.
    `.trim(),
    analogy:
      "Every office worker gets a personal assistant who handles all their phone calls: looks up numbers, redials if the line is busy, verifies who's on the other end, and logs every call. The workers just say who they want to talk to. Head office (the control plane) sends all assistants the same rulebook.",
    examples: [
      {
        title: "Kubernetes pod with an app and a sidecar proxy",
        language: "yaml",
        code: `apiVersion: v1
kind: Pod
metadata:
  name: orders-7c9f
  labels:
    app: orders
spec:
  containers:
    - name: orders            # your service: listens on 8080, calls others in plain HTTP
      image: registry.example.com/orders:1.42.0
      ports:
        - containerPort: 8080
    - name: istio-proxy       # injected automatically by the mesh
      image: istio/proxyv2     # Envoy-based proxy
# Both containers share one network namespace (same IP, same localhost).
# iptables rules (set by an init container or CNI plugin) redirect all
# inbound and outbound traffic through the proxy.`,
        explanation:
          "In practice you don't write the sidecar yourself: labelling a namespace for injection makes the mesh add it to every pod.",
        walkthrough: [
          { code: "kind: Pod", explanation: "A pod is Kubernetes' unit of scheduling: containers that run together on one node." },
          { code: "- name: orders", explanation: "The application container, unaware of TLS or retries." },
          { code: "- name: istio-proxy", explanation: "The sidecar proxy that handles networking concerns for the app." },
          { code: "# iptables rules ... redirect all ... traffic", explanation: "Traffic is transparently routed through the proxy, so the app needs no code changes." },
        ],
      },
      {
        title: "Timeouts and retries declared at the mesh (Istio)",
        language: "yaml",
        code: `apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: payments
spec:
  hosts:
    - payments
  http:
    - timeout: 3s                  # total budget for the call, including retries
      retries:
        attempts: 2
        perTryTimeout: 1s
        retryOn: connect-failure,refused-stream,unavailable,503
      route:
        - destination:
            host: payments
            subset: v1
          weight: 90
        - destination:
            host: payments
            subset: v2              # canary: 10% of traffic
          weight: 10`,
        explanation:
          "One config file changes behaviour for every caller of payments, in any language. Only retry idempotent operations, and don't also retry in the app.",
      },
      {
        title: "Enforcing mutual TLS mesh-wide",
        language: "yaml",
        code: `apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT   # reject plaintext; every workload proves its identity with a cert`,
        explanation:
          "The control plane issues short-lived certificates to each workload (SPIFFE-style identities) and rotates them automatically.",
      },
    ],
    howItWorks: `
**Traffic interception.** When a pod starts, iptables rules (set up by an
init container or a CNI plugin) redirect its inbound and outbound TCP
traffic to the sidecar. The app calls http://payments:8080 as usual; the
outbound proxy resolves the destination, picks an endpoint, applies
policies and sends the request to the inbound proxy of the target pod,
which forwards it to the target app on localhost.

**Control plane.** Watches the cluster (services, endpoints, config
objects like VirtualService) and pushes configuration to every proxy.
Envoy receives this via the **xDS** APIs (listeners, routes, clusters,
endpoints, secrets). The control plane is not in the request path: if it
goes down, proxies keep running with their last config, but changes and
certificate rotation stop.

**What the data plane gives you:**
- **mTLS**: both sides present certificates, so traffic is encrypted and
  each service has a verifiable identity. Authorization policies can then
  say "only orders may call payments".
- **Resilience**: timeouts, retries with budgets, outlier detection
  (eject endpoints returning errors), circuit breaking via connection and
  request limits.
- **Traffic management**: weighted routing for canaries, header-based
  routing, mirroring, fault injection for testing.
- **Observability**: uniform golden-signal metrics (rate, errors,
  latency) per service pair, access logs, and trace spans. Note: the app
  must still **propagate trace headers** from inbound to outbound calls,
  or traces break into fragments.

**Costs.**
- **Latency**: two extra proxy hops per call (outbound and inbound),
  typically around a millisecond or less each at the median, more at the
  tail and with heavy filters. It adds up across deep call chains.
- **Resources**: a proxy per pod uses CPU and memory; across thousands of
  pods this is significant.
- **Operational complexity**: another critical system to upgrade, debug
  and understand. Misconfigured retries or timeouts are now invisible from
  the application code.
- **Startup ordering**: the app may start before its proxy is ready, or
  the proxy may exit before the app finishes a job. Kubernetes added
  native sidecar containers (introduced in 1.28) to manage this
  lifecycle.

**Alternatives and newer designs.** **Proxyless** gRPC uses the same xDS
config inside the client library. **Sidecarless** meshes move work to a
per-node component: Istio's **ambient mode** uses a per-node ztunnel for
mTLS and L4, with optional waypoint proxies for L7; **Cilium** uses eBPF in
the kernel plus per-node Envoy. **Linkerd** keeps sidecars but uses its own
lightweight Rust proxy instead of Envoy.
    `.trim(),
    diagram: `
                    +-------------------------------+
                    |  Control plane (e.g. istiod)  |
                    |  config, service discovery,   |
                    |  certificates (CA)            |
                    +---------------+---------------+
                          xDS config | certs
            +------------------------+------------------------+
            v                                                 v
+-----------------------+                       +-----------------------+
| Pod: orders           |                       | Pod: payments         |
|  [app] -> [sidecar] --+==== mTLS, retries ===>+-> [sidecar] -> [app]  |
+-----------------------+   metrics, traces     +-----------------------+
            data plane: every request passes through two proxies
    `.trim(),
    whyItExists: `
In a large microservice estate, consistent security and reliability can't
depend on every team implementing them correctly in every language.
Libraries (like Netflix's Hystrix/Ribbon era) solved it per language and
needed every service upgraded for each change. A mesh makes these
cross-cutting concerns a platform feature: configured centrally, applied
uniformly, changed without redeploying applications.
    `.trim(),
    whenToUse: `
- Many services in several languages, where consistent mTLS, retries and
  telemetry are hard to achieve through libraries.
- Zero-trust or compliance requirements to encrypt and authenticate all
  service-to-service traffic.
- Frequent canary and progressive deployments needing fine-grained
  traffic splitting.
- A platform team exists to own and operate the mesh.
    `.trim(),
    whenNotToUse: `
- A monolith or a handful of services: a load balancer, a shared client
  library and TLS at the ingress are far simpler.
- Very latency-sensitive paths where extra hops matter, unless you
  measure and accept the overhead (or use proxyless/sidecarless modes).
- Teams without capacity to run it. A mesh you don't understand turns
  outages into mysteries.
- To fix poor service design. Chatty, deeply nested calls stay slow; a
  mesh just makes them observable.
    `.trim(),
    commonMistakes: [
      "Configuring retries in both the mesh and the application, multiplying attempts and amplifying load during incidents.",
      "Retrying non-idempotent requests (POST /payments) at the mesh layer without idempotency keys.",
      "Assuming the mesh gives full distributed tracing automatically; the app must still forward trace context headers.",
      "Rolling out STRICT mTLS everywhere at once, breaking callers that aren't in the mesh yet; use permissive mode during migration.",
      "Ignoring sidecar resource requests and limits, so proxies are throttled or evicted and look like application failures.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain the difference between the control plane and the data plane in a service mesh, and what keeps working if the control plane goes down." },
      { difficulty: "Medium", prompt: "Service A calls B, which calls C. Each layer (app client, mesh, gateway) retries 3 times. Calculate the worst-case number of calls to C from one user request, and propose a better retry policy." },
      { difficulty: "Hard", prompt: "Your company has 300 services in 4 languages and must encrypt and authorize all internal traffic within 6 months. Compare a sidecar mesh, a sidecarless mesh and shared client libraries on latency, cost, rollout risk and operational burden, and recommend a migration plan." },
    ],
    interviewQuestions: [
      { question: "What is a sidecar?", answer: "A helper container deployed alongside the application container in the same pod, sharing its network namespace, that adds functionality such as proxying, without changing application code." },
      { question: "What is a service mesh?", answer: "An infrastructure layer of proxies handling service-to-service communication (discovery, load balancing, retries, timeouts, mTLS, telemetry), configured by a central control plane." },
      { question: "What's the difference between the control plane and the data plane?", answer: "The data plane is the proxies that every request passes through. The control plane computes and distributes their configuration and certificates. The control plane is off the request path." },
      { question: "What is a Kubernetes pod and why does it matter for sidecars?", answer: "A pod is the smallest deployable unit: one or more containers scheduled together sharing network and optionally storage. Shared localhost and IP let a sidecar proxy transparently intercept the app's traffic." },
      { question: "What does mTLS give you inside a cluster?", answer: "Encryption in transit plus mutual authentication: each workload proves its identity with a certificate, enabling identity-based authorization policies instead of trusting network location." },
      { question: "Why put retries and timeouts in the mesh instead of the application?", answer: "Consistency across languages and teams, central changes without redeploys, and uniform metrics. The trade-off is that the mesh doesn't know which operations are safe to retry, so policies must be per route and coordinated with app-level logic." },
      { question: "What are the main costs of a sidecar mesh?", answer: "Extra latency from two proxy hops per call, CPU and memory for a proxy in every pod, more moving parts to upgrade and debug, and lifecycle issues like startup and shutdown ordering." },
      { question: "How do retries interact across layers, and how do you prevent retry storms?", answer: "Retries multiply: 3 attempts at each of 3 layers can produce 27 calls downstream. Retry at one layer only, use per-try timeouts within an overall deadline, set retry budgets, add jittered backoff, and only retry idempotent or explicitly safe failures." },
      { question: "What is a sidecarless or ambient mesh?", answer: "A design that removes per-pod proxies, moving L4 functions like mTLS to a shared per-node component (Istio ztunnel, or eBPF in Cilium) and running L7 proxies only where needed. It reduces resource overhead and lifecycle issues, at the cost of a shared component per node." },
      { question: "When would you advise against adopting a service mesh?", answer: "With few services, a single language where a good client library suffices, no platform team to operate it, or strict latency budgets. Start with simpler tools (ingress TLS, shared libraries, observability agents) and adopt a mesh when the cross-language consistency problem is real." },
    ],
    prerequisites: ["microservices-vs-monolith", "proxy-and-reverse-proxy", "load-balancing"],
    relatedTopics: ["microservices-vs-monolith", "proxy-and-reverse-proxy", "api-gateway", "service-discovery", "load-balancing", "circuit-breaker", "timeouts-retries-and-backoff", "monitoring-and-observability", "security-in-system-design", "deployment-strategies", "api-styles-graphql-grpc"],
    keywords: ["service mesh", "sidecar", "Envoy", "Istio", "Linkerd", "Cilium", "ambient mesh", "control plane", "data plane", "xDS", "mTLS", "zero trust", "SPIFFE", "Kubernetes", "pod", "container", "retries", "timeouts", "outlier detection", "canary"],
  },
];
