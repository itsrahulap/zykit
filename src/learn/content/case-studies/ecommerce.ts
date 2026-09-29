import type { CaseStudy } from "../../types/caseStudy";

export const ecommerceCaseStudy: CaseStudy = {
  id: "ecommerce",
  title: "E-commerce Platform",
  difficulty: "Hard",
  summary:
    "Design an online storefront: browse and search a catalog, hold items in a cart, and check out reliably — without overselling inventory or charging a customer twice.",
  problemStatement: `
A shopper searches for a product, filters by size and price, adds a couple
of items to their cart, and checks out with a saved card. From the outside
this looks like a straightforward CRUD app — list products, add to cart,
place order — but the moment there's more than one shopper and more than one
unit of inventory, several genuinely hard problems appear at once.

Two shoppers can try to buy the last unit of the same product at the same
instant — only one of them should actually get it, and the other needs a
clear "out of stock" rather than a confirmed order that can never be
fulfilled. A shopper's payment can be charged successfully but the
confirmation response can get lost on the way back to their browser — if
they retry, they must not be charged twice. A cart persists across sessions
and devices, catalog search has to stay fast and relevant over millions of
products with constantly changing inventory and prices, and once an order is
placed, it has to move through a real-world fulfillment pipeline (payment
capture, warehouse picking, shipping, delivery) where any step can fail and
needs to be retried or compensated for, not silently ignored.

So underneath "browse, cart, checkout" are four separate hard problems: a
search/catalog system that scales and stays fresh, an inventory system that
never oversells under concurrent demand, a payment flow that's safe to retry
without double-charging, and an order-fulfillment workflow that tracks a
long-running, multi-step process reliably.
  `.trim(),
  requirements: {
    functional: [
      "Users can browse and search a product catalog, filtering by category, price, and attributes.",
      "Users can add/remove items from a persistent shopping cart that survives across sessions and devices.",
      "Users can check out: providing a shipping address, selecting a payment method, and placing an order.",
      "The system reserves and decrements inventory correctly so the same unit is never sold to two different orders.",
      "Payments are processed reliably: a retried checkout request must never result in a duplicate charge.",
      "Orders progress through a fulfillment workflow (payment captured, packed, shipped, delivered) that the customer can track.",
    ],
    nonFunctional: [
      "Product browsing/search is heavily read-dominated and must stay fast even as the catalog and traffic grow.",
      "Inventory updates must be strongly consistent at the moment of purchase — overselling is a hard business failure, not an acceptable edge case.",
      "Payment operations must be idempotent — network retries are expected and must never double-charge a customer.",
      "The system must handle large, predictable traffic spikes (flash sales, holiday shopping) without falling over.",
      "Order and payment data requires durability and auditability — this data can't be silently lost or become inconsistent.",
      "Cart contents can tolerate brief staleness (eventual consistency) since a cart isn't a financial commitment until checkout.",
    ],
  },
  capacityEstimation: [
    {
      label: "Product catalog size",
      value: "~50-100 million SKUs",
      note: "A large multi-seller marketplace catalog; the number that determines whether search needs a dedicated index (it does, well before this size) rather than database queries.",
    },
    {
      label: "Daily active shoppers",
      value: "~20-50 million",
      note: "An assumption for a large platform, used to derive browsing and checkout load below.",
    },
    {
      label: "Search/browse requests per second (average)",
      value: "~10,000-20,000 QPS",
      note: "Each active shopper generates many page views/searches per session (browsing, filtering, comparing) — the read path dominates traffic by a wide margin over checkout traffic.",
    },
    {
      label: "Orders per day",
      value: "~1-2 million",
      note: "Only a fraction of browsing sessions convert to a completed purchase — orders/day is far smaller than search/browse QPS, which is exactly what makes read-path scaling (catalog/search) and write-path correctness (inventory/payment) two separable concerns.",
    },
    {
      label: "Peak traffic multiplier during flash sales",
      value: "10-50x normal peak",
      note: "Flash sales and major shopping events concentrate enormous demand into short windows, especially against a small number of heavily-discounted SKUs — this is the scenario that most stresses inventory consistency and checkout throughput simultaneously.",
    },
    {
      label: "Payment transactions per second at peak",
      value: "Low thousands/second",
      note: "Even at 1-2 million orders/day, checkout is comparatively rare relative to browsing — but each one requires strict correctness (no double charge, no overselling), so this smaller number gets a disproportionate share of design attention.",
    },
  ],
  capacityNotes:
    "The gap between enormous, read-heavy browse/search traffic and comparatively small but correctness-critical checkout traffic is the central fact shaping this design: it argues for a catalog/search stack optimized purely for fast, scalable reads (heavy caching, a dedicated search index, eventual consistency for things like 'in stock' badges), while the inventory-decrement-and-payment path at checkout is treated as a small but strict, strongly-consistent, idempotent critical section that the rest of the system is built to protect rather than to optimize for throughput above all else.",
  apiDesign: [
    { method: "GET", path: "/api/v1/products/search?q=&filters=", description: "Full-text/faceted search over the catalog, returning ranked, paginated results." },
    { method: "GET", path: "/api/v1/products/{productId}", description: "Returns product details, price, and current stock status." },
    { method: "POST", path: "/api/v1/cart/items", description: "Body: { productId, quantity }. Adds an item to the current user's cart." },
    { method: "GET", path: "/api/v1/cart", description: "Returns the current cart contents for the logged-in user or session." },
    { method: "POST", path: "/api/v1/checkout", description: "Body: { cartId, shippingAddress, paymentMethodId, idempotencyKey }. Places an order; safe to retry with the same idempotencyKey." },
    { method: "GET", path: "/api/v1/orders/{orderId}", description: "Returns order status and fulfillment progress." },
    { method: "POST", path: "/api/v1/orders/{orderId}/cancel", description: "Cancels an order if it hasn't yet shipped, triggering inventory release and payment reversal as needed." },
    { method: "POST", path: "/api/v1/webhooks/payment-provider", description: "Receives asynchronous payment confirmation/failure events from the external payment processor." },
  ],
  dataModel: `
Several stores, each shaped for a very different access pattern:

- **products** (catalog): \`product_id\`, \`title\`, \`description\`,
  \`price\`, \`attributes\`, \`category_id\` — read enormously often, updated
  comparatively rarely, and mirrored into a dedicated **search index**
  (inverted index over title/description/attributes) rather than queried
  directly for search, since relational queries don't scale to full-text/
  faceted search over tens of millions of rows.
- **inventory**: \`product_id\` (or \`sku_id\`), \`available_quantity\`,
  \`reserved_quantity\` — deliberately kept separate from the (larger,
  slower-changing) \`products\` table, because inventory is updated far more
  often and needs strict, low-latency, strongly-consistent read-then-write
  operations at checkout time.
- **carts** / **cart_items**: keyed by user or session id, holding
  \`product_id\`/\`quantity\` pairs — a cart is not a financial commitment,
  so this data can tolerate eventual consistency and even live in a fast
  key-value store rather than the primary relational database.
- **orders**: \`order_id\`, \`user_id\`, \`status\` (created / paid /
  packed / shipped / delivered / cancelled), \`total\`, \`created_at\` — the
  durable, auditable record of a completed checkout, written once and then
  transitioned through statuses by the fulfillment workflow.
- **order_items**: line items per order, each capturing the price *at the
  time of purchase* (not a live reference to the current product price) so
  that a later price change never retroactively changes a past order's
  total.
- **payments**: \`payment_id\`, \`order_id\`, \`idempotency_key\`, \`status\`,
  \`provider_reference\` — the \`idempotency_key\` is unique-constrained, so a
  retried checkout request with the same key can never create a second
  payment row, even under concurrent retries.

Splitting \`inventory\` from \`products\`, and recording line-item prices as a
snapshot rather than a live reference, are both deliberate: they isolate the
one piece of data (stock count) that needs strict, low-latency consistency
from the much larger, more cacheable catalog, and they make an order's
total immutable and auditable regardless of later catalog changes.
  `.trim(),
  highLevelDesign: `
Browsing and search sit almost entirely on the **read path**: product pages
and search results are served from a heavily cached read layer and a
dedicated search index kept in sync with the catalog via an asynchronous
pipeline, so the enormous volume of browsing traffic never touches the
transactional database that has to stay strictly correct for orders and
inventory. "In stock" badges shown while browsing are allowed to be
approximate — the authoritative check happens once, at checkout.

Checkout is the **narrow, strict path**: when a shopper places an order, the
service must atomically confirm inventory is available and reserve it,
charge (or authorize) payment through an external payment processor, and
create a durable order record — and it must do all of this idempotently, so
that a client's network retry of the exact same checkout request never
double-reserves inventory or double-charges the card. This path deliberately
favors correctness and consistency over raw throughput, unlike the browse
path, which favors throughput and caches aggressively.

Once an order exists, it's handed off to an asynchronous **fulfillment
workflow**: a sequence of steps (capture payment, notify the warehouse, pack,
ship, deliver) each of which can fail independently and needs its own retry
or compensating action (e.g. releasing reserved inventory and refunding a
payment if packing fails) rather than the customer-facing checkout request
staying open and waiting for physical fulfillment to complete. A message
queue between checkout and fulfillment decouples "the order was accepted"
from "the order was physically completed," which is what keeps checkout
itself fast.
  `.trim(),
  highLevelDiagram: `
   Browse / Search (huge, cached)         Checkout (small, strict)
   ┌────────┐                             ┌────────┐
   │ Client │                             │ Client │
   └───┬────┘                             └───┬────┘
       │ search / product requests            │ POST /checkout (idempotencyKey)
       ▼                                        ▼
 ┌───────────┐  cache hit   ┌───────────┐ ┌───────────────┐
 │  Cache /   │◀────────────│  App       │ │  Checkout      │
 │  CDN       │             │  Servers   │ │  Service       │
 └─────┬─────┘              └─────┬─────┘ └───────┬────────┘
       │ miss                     │ index sync      │ reserve + charge
       ▼                           ▼                 ▼
 ┌───────────┐            ┌───────────────┐  ┌───────────────┐
 │  Search    │◀───────── │   Product     │  │  Inventory DB  │
 │  Index     │   async   │   Catalog DB  │  │ (strong        │
 └───────────┘            └───────────────┘  │  consistency)  │
                                              └───────┬────────┘
                                                       │ order created
                                                       ▼
                                              ┌───────────────┐
                                              │  Orders DB /   │
                                              │  Queue         │
                                              └───────┬────────┘
                                                       ▼
                                              ┌───────────────┐
                                              │  Fulfillment   │
                                              │  Workflow      │
                                              │ (pack/ship/    │
                                              │  deliver)      │
                                              └───────────────┘
  `,
  deepDives: [
    {
      title: "Product catalog and search at scale",
      explanation: `
Tens of millions of products, each with attributes shoppers want to filter
and sort by (price, size, rating, brand), is a workload relational
databases aren't built to serve directly at low latency, especially once
free-text search and faceted filtering enter the picture.

- The catalog's source of truth stays in a regular database, but product
  data is **mirrored asynchronously into a dedicated search index**
  (an inverted index over text fields plus facet fields for filters), which
  is what actually serves search and filtered-browse requests.
- Because the index is a copy, it's **eventually consistent** with the
  source catalog — a price change or new listing might take a short delay
  to appear in search results, which is an acceptable trade for search
  performance.
- **Caching** sits in front of both the index and individual product-detail
  lookups, since a small fraction of products (best-sellers, currently
  discounted items) account for a disproportionate share of page views —
  the same power-law pattern that makes caching effective for any
  high-traffic read path.
- "In stock" indicators shown during browsing are read from a cached,
  possibly slightly-stale view of inventory — deliberately, since showing
  a shopper an approximate stock signal while browsing is fine as long as
  the *authoritative* check happens at the moment of checkout, not before.

Treating search/catalog reads as a separate, eventually-consistent, heavily
cached system — distinct from the strict, low-latency inventory checks at
checkout — is what lets the huge browse-traffic volume scale without
requiring every product page view to hit a strongly consistent database.
      `.trim(),
    },
    {
      title: "Inventory consistency under concurrent orders",
      explanation: `
When stock for a product is low, two shoppers can attempt to buy the same
unit within milliseconds of each other. Whichever design choice is made
here directly determines whether the business oversells (an unfulfillable
order) or falsely rejects an order (lost sale on stock that was actually
available).

- The safest approach: at checkout, **decrement inventory inside the same
  transaction** that confirms the order can proceed, using an atomic
  conditional update (e.g. "decrement quantity by 1 where quantity > 0," and
  check whether the update actually affected a row) rather than a
  read-then-write from the application that leaves a window for a race
  condition between two concurrent requests.
- A common two-phase pattern: **reserve** inventory (decrement
  \`available_quantity\`, increment \`reserved_quantity\`) as soon as checkout
  begins, then convert the reservation to a permanent decrement once payment
  is confirmed — and automatically **release the reservation** back to
  available stock if payment fails or the reservation times out (e.g. a
  shopper abandons checkout mid-flow), so inventory doesn't get silently
  locked up forever by abandoned carts.
- Under very high contention on a single hot SKU (a flash sale on one
  popular item), even atomic per-row updates can become a bottleneck simply
  from lock contention on that one row — mitigated by techniques like
  sharding a large stock count across multiple counter rows, or queueing
  purchase attempts for that SKU rather than letting them all race the
  database simultaneously.
- This is the one place in the whole system where strict, immediate
  consistency is non-negotiable — unlike the cart or search index, an
  inventory count being briefly wrong at the moment of purchase directly
  causes a business failure (overselling), not just a minor UX inconvenience.

The inventory table is intentionally the most tightly-controlled piece of
data in the system for exactly this reason — everything else in the design
is built to keep traffic away from it except at the one moment it actually
matters.
      `.trim(),
    },
    {
      title: "Shopping cart state",
      explanation: `
A cart looks like a small feature but has a distinct correctness profile
from everything else in the system: unlike an order, it isn't a financial
commitment, so it can be treated far more loosely.

- Cart contents are stored keyed by **user id (or a session id for guests)**
  in a fast key-value store, separate from the strict relational data used
  for orders and inventory.
- Because a cart isn't binding until checkout, its consistency requirements
  are much looser: it's fine for a cart update from one tab to take a moment
  to appear in another, and it's fine for a product's price or availability
  to have changed since it was added to the cart — the checkout step is
  where those are re-validated against current, authoritative data.
- Merging a **guest cart into a logged-in user's cart** after login is a
  common edge case worth naming explicitly: the straightforward approach is
  to union the two item lists (summing quantities for items in both) rather
  than silently discarding one.
- Carts are commonly given a **TTL** or periodic cleanup for abandoned,
  long-inactive sessions, since an ever-growing table of carts that were
  never checked out has no lasting value and shouldn't be retained
  indefinitely.

The general principle: not all state in the system deserves the same
consistency/durability guarantees, and treating the cart with the same
strictness as an order would add cost and complexity for a part of the
system where it buys nothing.
      `.trim(),
    },
    {
      title: "Payment processing and idempotency",
      explanation: `
A checkout request can fail to return a response to the client even after
the payment succeeded on the backend — the client's connection can drop
right after the charge goes through. If the client (or its retry logic)
simply resubmits the same checkout request, the system must guarantee the
customer is not charged twice.

- The client generates a unique **idempotency key** per checkout attempt
  (not per retry — the same key is reused across retries of the *same*
  logical checkout) and sends it with the request.
- The server enforces a **unique constraint on that key** in the payments
  table: the first request with a given key performs the charge and records
  the result; any subsequent request with the *same* key returns the
  already-recorded result instead of charging again, even if two retries
  arrive concurrently.
- Because payment providers are external systems, the actual charge
  confirmation is often **asynchronous** (a webhook callback), so the order
  is initially created in a "pending payment" state and only transitions to
  "paid" once the provider confirms — the checkout response to the customer
  doesn't have to block on that round trip.
- The same idempotency-key pattern extends naturally to **inventory
  reservation** — a retried checkout request should also not reserve the
  same inventory a second time — so the whole checkout operation is designed
  to be safely retryable as a unit, not just the payment charge in
  isolation.

Idempotency here isn't an optimization; it's the property that makes
retrying safe at all in a distributed system where "did that request
actually succeed?" can genuinely be unknown to the client.
      `.trim(),
    },
    {
      title: "Order fulfillment as a workflow",
      explanation: `
Once an order is placed, it doesn't complete in one step — payment capture,
warehouse notification, packing, shipping, and delivery each happen at
different times, through different systems, any of which can fail
independently.

- The order moves through a small set of well-defined **statuses** (created
  → paid → packed → shipped → delivered, plus cancelled/refunded branches),
  and each transition is triggered by an event, often delivered via a
  **queue**, rather than one long-running process holding everything
  together synchronously.
- Decoupling checkout from fulfillment through a queue means the
  customer-facing checkout request can return quickly once the order is
  durably created and payment is authorized — the customer isn't kept
  waiting on warehouse or shipping-carrier systems that may be slow or
  temporarily unavailable.
- Each step needs a **compensating action** if a later step fails: if
  packing discovers a listed item is actually missing from the warehouse
  (a stock-data mismatch), the system must release the payment authorization
  or issue a refund and restore the customer's order status accordingly,
  rather than leaving the order stuck in limbo.
- Retrying a failed step must be **safe to repeat** (idempotent) for the
  same reason payment processing needs it — a warehouse notification
  service that gets the "pack this order" message twice due to a retry
  should not cause two packing attempts.

This turns fulfillment into a long-running, multi-step, partially-failable
process — closer to a workflow engine's job than a single request/response
operation — which is a very different design problem from the fast,
synchronous checkout step that kicks it off.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
Under normal traffic, the browse/search path is the highest-volume part of
the system but also the easiest to scale — it's read-heavy, cacheable, and
tolerant of eventual consistency, so adding cache capacity, search index
replicas, and CDN coverage absorbs growth in browsing traffic without
touching the strict transactional core at all. The place this design
actually breaks first is the inventory/checkout path during a concentrated
spike — a flash sale on a small number of heavily-discounted, limited-stock
items creates intense write contention on a handful of hot inventory rows,
which is a fundamentally different problem from scaling read throughput and
doesn't get solved by adding more app servers.

Mitigations for that hot-row contention include sharding a single SKU's
stock count across multiple partial-count rows (summed at read time),
queueing purchase attempts for the hottest items so the database sees a
controlled, serialized stream of decrements rather than an uncontrolled
stampede, and pre-provisioning extra capacity ahead of known sale events
rather than relying purely on reactive autoscaling. Fulfillment scales
differently again — horizontally, by adding more workers consuming from the
order queue — since each order's fulfillment workflow is independent of
every other order's.
  `.trim(),
  tradeOffs: [
    {
      decision: "Strict, strongly-consistent inventory decrement vs. eventually-consistent stock counts",
      explanation:
        "Inventory decrements at checkout are strongly consistent (an atomic conditional update, or a reserve-then-confirm two-phase flow), at the cost of being the one part of the system that can become a contention bottleneck under concentrated demand. An eventually-consistent stock count would scale more easily but risks overselling, which is a direct business and customer-trust failure this design treats as unacceptable.",
    },
    {
      decision: "Idempotency keys for checkout vs. relying on the client to avoid duplicate submissions",
      explanation:
        "The server enforces idempotency via a unique key rather than trusting clients not to double-submit, at the cost of extra bookkeeping (storing and checking keys, deciding how long to retain them). Relying on client-side prevention alone is simpler but fails exactly in the scenario that matters most — a genuine network failure where the client legitimately doesn't know if its request succeeded and must retry.",
    },
    {
      decision: "Asynchronous, queue-driven fulfillment vs. a single synchronous order-placement transaction",
      explanation:
        "Fulfillment is modeled as an asynchronous, multi-step workflow decoupled from checkout by a queue, trading immediate end-to-end completion (the customer doesn't know the order is 'shipped' the instant they check out — nobody could) for a checkout request that stays fast and doesn't fail or hang because a downstream warehouse or shipping system is slow. A single synchronous transaction spanning payment, warehouse, and shipping would be simpler to reason about but would make checkout only as reliable and fast as the slowest system in that chain.",
    },
    {
      decision: "Separate, eventually-consistent search index vs. querying the catalog database directly",
      explanation:
        "Search and faceted browsing are served from a dedicated, asynchronously-updated index rather than the catalog's source-of-truth database, accepting a short delay before catalog changes appear in search results in exchange for search performance and flexibility (full-text, facets, ranking) that a relational database isn't built to provide at this scale. Querying the catalog database directly would keep search perfectly fresh but wouldn't scale to the read volume or query complexity this system needs.",
    },
  ],
  interviewTips: [
    "Split the system out loud into a huge, cacheable read path (browse/search) and a small, strict write path (checkout/inventory/payment) — this framing does most of the work of organizing the rest of the design.",
    "Bring up the concurrent-purchase-of-last-item race condition unprompted, and describe the atomic-decrement or reserve-then-confirm pattern that prevents overselling.",
    "Explain idempotency keys concretely — what triggers a retry, what key the client sends, and what the server does differently the second time.",
    "Treat order fulfillment as an asynchronous workflow with compensating actions on failure, not a single transaction — interviewers often probe what happens when a later step (e.g. warehouse packing) fails.",
    "Call out that line-item prices are snapshotted at order time, not referenced live from the catalog — a small detail that signals real e-commerce domain knowledge.",
    "Mention flash-sale/hot-SKU contention as the design's real breaking point, distinct from general traffic growth, and how it's mitigated (sharded counters, queueing, pre-provisioning).",
  ],
  relatedTopics: ["idempotency", "queues", "caching", "database-replication", "sharding", "consistency-models", "cap-theorem", "rate-limiting"],
  keywords: ["e-commerce", "inventory management", "idempotency", "payment processing", "order fulfillment", "search indexing", "system design interview"],
};
