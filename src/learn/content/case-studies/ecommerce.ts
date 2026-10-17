import type { CaseStudy } from "../../types/caseStudy";

export const ecommerceCaseStudy: CaseStudy = {
  id: "ecommerce",
  title: "E-commerce Platform",
  difficulty: "Hard",
  summary:
    "Design an online store: browse and search a catalog, keep items in a cart, and check out reliably without overselling stock or charging twice.",
  problemStatement: `
A shopper searches for a product, filters by size and price, adds items to
their cart, and checks out with a saved card. It looks like a simple CRUD
app. But with more than one shopper and more than one unit of stock, hard
problems appear:

- Two shoppers try to buy the last unit at the same instant. Only one
  should get it; the other needs a clear "out of stock," not a confirmed
  order that can't be fulfilled.
- A payment succeeds but the confirmation is lost on the way back to the
  browser. If the shopper retries, they must not be charged twice.
- The cart persists across sessions and devices.
- Search must stay fast and relevant over millions of products whose stock
  and prices keep changing.
- A placed order moves through real-world fulfillment (payment capture,
  warehouse picking, shipping, delivery). Any step can fail and must be
  retried or compensated, not ignored.

So "browse, cart, checkout" hides four hard problems: a catalog/search
system that scales and stays fresh, inventory that never oversells under
concurrent demand, payment that's safe to retry without double-charging,
and a reliable workflow for long-running, multi-step fulfillment.
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
    "The key fact: browse/search traffic is enormous and read-heavy, while checkout traffic is small but must be correct. So the catalog/search stack is optimized for fast, scalable reads (heavy caching, a dedicated search index, eventual consistency for things like 'in stock' badges). The inventory-and-payment path at checkout is a small, strict, strongly consistent, idempotent critical section that the rest of the system protects, rather than optimizing it for throughput.",
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
**Browse and search (read path).** Product pages and search results come
from a heavily cached read layer and a dedicated search index, synced from
the catalog asynchronously. Browsing traffic never touches the
transactional database that must stay correct for orders and inventory.
"In stock" badges while browsing can be approximate; the authoritative
check happens once, at checkout.

**Checkout (narrow, strict path).** When a shopper places an order, the
service must:

- Atomically confirm inventory is available and reserve it.
- Charge (or authorize) payment through an external processor.
- Create a durable order record.

All of it must be idempotent, so a network retry of the same checkout
never double-reserves stock or double-charges the card. This path favors
correctness over throughput; the browse path favors throughput and caches
aggressively.

**Fulfillment (async workflow).** Once an order exists, it's handed to a
workflow of steps (capture payment, notify the warehouse, pack, ship,
deliver). Each can fail independently and needs its own retry or
compensating action (e.g. release reserved stock and refund if packing
fails). The checkout request doesn't wait for physical fulfillment. A
message queue between checkout and fulfillment separates "order accepted"
from "order completed," which keeps checkout fast.
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
Tens of millions of products, each filterable and sortable by price, size,
rating, and brand, is more than a relational database can serve directly
at low latency, especially with free-text search and faceted filters.

- The catalog's source of truth stays in a regular database. Product data
  is **mirrored asynchronously into a dedicated search index** (an inverted
  index over text fields plus facet fields), which serves search and
  filtered browsing.
- The index is a copy, so it's **eventually consistent**. A price change
  or new listing may take a moment to show in search, an acceptable trade
  for performance.
- **Caching** sits in front of the index and product-detail lookups. A few
  products (best-sellers, current deals) get most page views, the usual
  power-law pattern.
- "In stock" indicators while browsing come from a cached, possibly
  slightly stale view of inventory. That's fine as long as the
  *authoritative* check happens at checkout.

Keeping search/catalog reads as a separate, eventually consistent, heavily
cached system lets browse traffic scale without every page view hitting a
strongly consistent database.
      `.trim(),
    },
    {
      title: "Inventory consistency under concurrent orders",
      explanation: `
When stock is low, two shoppers can try to buy the same unit within
milliseconds. The design here decides whether the business oversells (an
unfulfillable order) or wrongly rejects an order (a lost sale on stock
that was available).

- Safest: at checkout, **decrement inventory in the same transaction**
  that confirms the order, using an atomic conditional update (e.g.
  "decrement quantity by 1 where quantity > 0," then check that a row was
  affected). An application-level read-then-write leaves a race window
  between two concurrent requests.
- A common two-phase pattern: **reserve** stock (decrement
  \`available_quantity\`, increment \`reserved_quantity\`) when checkout
  starts, and make it permanent once payment is confirmed. If payment
  fails or the reservation times out (e.g. the shopper abandons checkout),
  **release the reservation** automatically, so abandoned carts don't lock
  up stock forever.
- With very high contention on one hot SKU (a flash sale), even atomic
  per-row updates bottleneck on lock contention for that row. Mitigate by
  sharding the stock count across several counter rows, or queueing
  purchase attempts for that SKU instead of letting them all race the
  database.
- This is the one place where strict, immediate consistency is
  non-negotiable. Unlike the cart or search index, a wrong inventory count
  at purchase time causes a business failure (overselling), not a minor UX
  issue.

That's why the inventory table is the most tightly controlled data in the
system. The rest of the design keeps traffic away from it except at the
one moment it matters.
      `.trim(),
    },
    {
      title: "Shopping cart state",
      explanation: `
A cart isn't a financial commitment like an order, so it can be handled
much more loosely.

- Carts are stored by **user id (or session id for guests)** in a fast
  key-value store, separate from the strict relational data for orders
  and inventory.
- Consistency can be loose. A cart update in one tab can take a moment to
  show in another, and a price or availability can change after an item
  is added. Checkout re-validates both against current, authoritative
  data.
- Merging a **guest cart into a logged-in user's cart** after login is a
  common edge case. The simple approach: union both item lists (summing
  quantities for items in both) instead of silently dropping one.
- Abandoned, long-inactive carts usually get a **TTL** or periodic
  cleanup, since carts never checked out have no lasting value.

Not all state needs the same consistency and durability. Treating the cart
as strictly as an order would add cost and complexity for no benefit.
      `.trim(),
    },
    {
      title: "Payment processing and idempotency",
      explanation: `
A payment can succeed on the backend while the client never gets the
response, for example if the connection drops right after the charge. If
the client (or its retry logic) resubmits the same checkout, the customer
must not be charged twice.

- The client generates a unique **idempotency key** per checkout attempt
  and sends it with the request. The same key is reused for every retry of
  the *same* checkout.
- The server enforces a **unique constraint on that key** in the payments
  table. The first request with a key charges and records the result. Any
  later request with the *same* key gets the recorded result instead of a
  second charge, even if two retries arrive at once.
- Payment providers are external, so charge confirmation is often
  **asynchronous** (a webhook). The order starts as "pending payment" and
  becomes "paid" when the provider confirms. The checkout response doesn't
  wait for that round trip.
- The same key also covers **inventory reservation**, so a retried
  checkout doesn't reserve the same stock twice. The whole checkout is
  safely retryable as a unit, not just the charge.

Idempotency isn't an optimization. It's what makes retrying safe at all
when the client can't know whether a request succeeded.
      `.trim(),
    },
    {
      title: "Order fulfillment as a workflow",
      explanation: `
An order doesn't complete in one step. Payment capture, warehouse
notification, packing, shipping, and delivery happen at different times, in
different systems, and any can fail independently.

- The order moves through well-defined **statuses** (created → paid →
  packed → shipped → delivered, plus cancelled/refunded branches). Each
  transition is triggered by an event, often via a **queue**, not one
  long-running synchronous process.
- With a queue between them, checkout returns as soon as the order is
  durably created and payment is authorized. The customer doesn't wait on
  warehouse or carrier systems that may be slow or down.
- Each step needs a **compensating action** if a later step fails. If
  packing finds an item missing from the warehouse (a stock-data
  mismatch), the system releases the payment authorization or refunds,
  and updates the order status, instead of leaving it stuck.
- Retried steps must be **safe to repeat** (idempotent), just like
  payments. A warehouse service that gets "pack this order" twice because
  of a retry must not pack it twice.

So fulfillment is a long-running, multi-step process where parts can fail,
closer to a workflow engine's job than a single request/response. That's a
very different problem from the fast, synchronous checkout that starts it.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
Browse/search has the most traffic but is the easiest to scale. It's
read-heavy, cacheable, and tolerates eventual consistency, so more cache,
search index replicas, and CDN coverage absorb growth without touching the
transactional core.

What breaks first is inventory/checkout during a concentrated spike. A
flash sale on a few heavily discounted, limited-stock items causes intense
write contention on a handful of hot inventory rows. More app servers don't
fix that. Mitigations:

- Shard one SKU's stock count across several partial-count rows (summed at
  read time).
- Queue purchase attempts for the hottest items, so the database sees a
  controlled, serialized stream of decrements instead of a stampede.
- Pre-provision capacity before known sale events instead of relying only
  on reactive autoscaling.

Fulfillment scales horizontally by adding workers on the order queue,
since each order's workflow is independent.
  `.trim(),
  tradeOffs: [
    {
      decision: "Strict, strongly-consistent inventory decrement vs. eventually-consistent stock counts",
      explanation:
        "Make inventory decrements at checkout strongly consistent (an atomic conditional update, or a reserve-then-confirm two-phase flow). The cost: this is the one part that can bottleneck under concentrated demand. An eventually consistent count scales more easily but risks overselling, a business and customer-trust failure this design won't accept.",
    },
    {
      decision: "Idempotency keys for checkout vs. relying on the client to avoid duplicate submissions",
      explanation:
        "Enforce idempotency on the server with a unique key instead of trusting clients not to double-submit. The cost is extra bookkeeping (storing and checking keys, deciding how long to keep them). Client-side prevention alone is simpler but fails exactly when it matters: a real network failure where the client doesn't know if its request succeeded and must retry.",
    },
    {
      decision: "Asynchronous, queue-driven fulfillment vs. a single synchronous order-placement transaction",
      explanation:
        "Model fulfillment as an async, multi-step workflow behind a queue. The order isn't 'shipped' the instant the customer checks out (it never could be), but checkout stays fast and doesn't fail or hang when a warehouse or shipping system is slow. One synchronous transaction across payment, warehouse, and shipping is simpler to reason about, but makes checkout only as reliable and fast as the slowest system in the chain.",
    },
    {
      decision: "Separate, eventually-consistent search index vs. querying the catalog database directly",
      explanation:
        "Serve search and faceted browsing from a dedicated, asynchronously updated index, not the catalog database. Catalog changes take a moment to appear in search, but you get performance and features (full-text, facets, ranking) a relational database can't provide at this scale. Querying the catalog directly keeps search perfectly fresh but can't handle the read volume or query complexity.",
    },
  ],
  interviewTips: [
    "Split the system early into a huge, cacheable read path (browse/search) and a small, strict write path (checkout/inventory/payment). This framing organizes the rest of the design.",
    "Raise the last-item race condition unprompted, and describe the atomic-decrement or reserve-then-confirm pattern that prevents overselling.",
    "Explain idempotency keys concretely: what triggers a retry, what key the client sends, and what the server does differently the second time.",
    "Treat fulfillment as an async workflow with compensating actions, not a single transaction. Interviewers often ask what happens when a later step (e.g. warehouse packing) fails.",
    "Point out that line-item prices are snapshotted at order time, not read live from the catalog. It signals real e-commerce knowledge.",
    "Name flash-sale/hot-SKU contention as the real breaking point, distinct from general traffic growth, and how to mitigate it (sharded counters, queueing, pre-provisioning).",
  ],
  relatedTopics: ["idempotency", "queues", "caching", "database-replication", "sharding", "consistency-models", "cap-theorem", "rate-limiting"],
  keywords: ["e-commerce", "inventory management", "idempotency", "payment processing", "order fulfillment", "search indexing", "system design interview"],
};
