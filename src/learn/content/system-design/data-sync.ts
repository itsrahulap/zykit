import type { Topic } from "../../types/content";

export const systemDesignDataSyncTopics: Topic[] = [
  {
    id: "change-data-capture",
    title: "Change Data Capture (CDC)",
    level: "intermediate",
    description: "Stream every insert, update and delete out of a database into search indexes, caches, warehouses and queues.",
    explanation: `
Your main database holds the truth, but other systems need a copy: a search
index, a cache, an analytics warehouse, another service's database. Each time
a row changes, those copies need to hear about it.

**Change Data Capture (CDC)** means detecting the changes in one database and
sending them to other systems. Engineers usually try a few approaches in
order:

1. **Polling**: every few seconds, ask the table "what changed since last
   time?" using an \`updated_at\` column or an increasing id.
2. **Triggers**: have the database copy each change into a separate change
   table as it happens.
3. **Dual writes**: have the application write to the database *and* to the
   other system.
4. **Log-based CDC**: read the database's own replication log (PostgreSQL's
   WAL, MySQL's binlog, MongoDB's oplog), which already records every
   committed change in order.

Log-based CDC is where most teams end up, because it sees every insert,
update and delete, in commit order, without extra queries against the tables.
    `.trim(),
    analogy:
      "Polling is walking through a warehouse every hour to see which shelves look different: you miss things that were moved and moved back, and you can't see what was thrown away. Log-based CDC is reading the warehouse's delivery and removal logbook, where every change was written down in order the moment it happened.",
    examples: [
      {
        title: "Polling with an updated_at cursor, and its bugs",
        language: "sql",
        code: `-- Runs every 30 seconds. :last_seen is saved after each batch.
SELECT id, name, price, updated_at
FROM products
WHERE updated_at > :last_seen
ORDER BY updated_at
LIMIT 1000;

-- Then: last_seen = max(updated_at) from the batch.`,
        explanation:
          "Bug 1: if 1,500 rows share the same updated_at, the batch stops at 1,000 and the next query (updated_at > last_seen) skips the other 500. Bug 2: in PostgreSQL, now() is the transaction start time, so a long transaction can commit a row with an updated_at older than a value you already moved past, and it is never picked up. Bug 3: a hard DELETE leaves no row to find. Safer polling uses a keyset cursor on (updated_at, id), re-reads a small overlap window, uses soft deletes, and makes the sink idempotent so re-reads are harmless.",
        walkthrough: [
          { code: "WHERE updated_at > :last_seen", explanation: "Only fetches rows whose timestamp is after the last one processed. Rows that commit late with an older timestamp fall behind the cursor and are missed." },
          { code: "ORDER BY updated_at LIMIT 1000", explanation: "Reads in timestamp order, in pages. Ties on updated_at at the page boundary get skipped because the next query uses a strict greater-than." },
          { code: "last_seen = max(updated_at)", explanation: "Moves the cursor forward. Deleted rows never appear in any result, so the downstream copy keeps them forever." },
        ],
      },
      {
        title: "PostgreSQL logical replication setup for CDC",
        language: "sql",
        code: `-- postgresql.conf (requires a restart)
wal_level = logical
max_replication_slots = 10
max_wal_senders = 10
-- PostgreSQL 13+: cap how much WAL a stuck slot can hold
max_slot_wal_keep_size = '50GB'

-- Choose which tables to publish
CREATE PUBLICATION orders_pub FOR TABLE orders, order_items;

-- Optional: include all old column values in UPDATE/DELETE events
-- (by default only the primary key of the old row is logged)
ALTER TABLE orders REPLICA IDENTITY FULL;

-- A slot remembers how far the consumer has read
SELECT pg_create_logical_replication_slot('orders_cdc', 'pgoutput');

-- Watch it: an inactive slot with a growing lag retains WAL on disk
SELECT slot_name, active, confirmed_flush_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
FROM pg_replication_slots;`,
        explanation:
          "pgoutput is the built-in logical decoding plugin (PostgreSQL 10+); wal2json is a third-party alternative that emits JSON. A CDC tool such as Debezium connects with the slot and publication names, takes an initial snapshot, then streams changes from the slot and reports back the LSN it has processed.",
      },
      {
        title: "An idempotent sink for at-least-once change events",
        language: "typescript",
        code: `type ChangeEvent = {
  op: "c" | "u" | "d" | "r"; // create, update, delete, snapshot read (Debezium style)
  before: Product | null;
  after: Product | null;
  sourcePosition: bigint; // e.g. the LSN of the change
};

async function applyChange(event: ChangeEvent): Promise<void> {
  if (event.op === "d") {
    const id = event.before!.id;
    // Deleting a row that is already gone is a no-op, so replays are safe
    await search.deleteDocument("products", id);
    return;
  }

  const row = event.after!;
  // Upsert keyed by primary key; skip events older than what we already applied
  await sinkDb.query(
    "INSERT INTO products_copy (id, name, price, source_position) " +
    "VALUES ($1, $2, $3, $4) " +
    "ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, " +
    "source_position = EXCLUDED.source_position " +
    "WHERE products_copy.source_position < EXCLUDED.source_position",
    [row.id, row.name, row.price, event.sourcePosition],
  );
}`,
        explanation:
          "CDC pipelines deliver at least once: after a crash the consumer resumes from its last saved offset and sees some events again. Upserting by primary key makes a repeat harmless, and the source_position guard stops an old, replayed event from overwriting a newer value.",
      },
    ],
    howItWorks: `
**Polling.** A job queries the source table on a schedule for rows with
\`updated_at\` (or an auto-increment id) greater than a saved cursor. It is
easy to build and needs no special database access. The problems:

- **Hard deletes are invisible.** A deleted row can't be selected.
- **Timestamp ties** at a page boundary are skipped with a strict \`>\`.
- **Commit order is not timestamp order.** A transaction can set
  \`updated_at\` (or take an id from a sequence) early and commit late, after
  the cursor has already moved past that value. Clock skew across app
  servers makes this worse.
- **Intermediate states are lost.** Two updates between polls look like one.
- **Load and latency.** Each poll is a query against the primary, and changes
  arrive up to one poll interval late.

**Triggers.** An \`AFTER INSERT/UPDATE/DELETE\` trigger writes each change into
a change table that a job reads. This catches deletes and every change, but
it adds a write to every transaction on the source, makes the change table a
hot spot, and puts sync logic inside the database where it is hard to test
and version.

**Dual writes.** The app writes to the database and then to Kafka, the search
index or the cache. The two writes are not atomic: if the process crashes or
the second call fails after the first commits, the systems disagree. If two
requests update the same row, their second writes can arrive in the opposite
order, leaving the copy with the older value.

**Log-based CDC.** Every serious database already writes each committed change
to a log for crash recovery and replication. CDC reads that log as a
replication client:

- **PostgreSQL**: set \`wal_level = logical\`. A **publication** chooses
  tables, a **replication slot** tracks the consumer's position (an **LSN**,
  log sequence number) and keeps the WAL it still needs, and an output plugin
  (\`pgoutput\` built in, or \`wal2json\`) turns WAL records into row changes.
- **MySQL**: read the **binlog** with \`binlog_format = ROW\` (and usually
  \`binlog_row_image = FULL\`), resuming from a binlog file and position or a
  GTID set.
- **MongoDB**: open a **change stream** (built on the oplog; needs a replica
  set or sharded cluster) and resume with its **resume token**.

**Debezium** is the common open-source tool for this. It usually runs as a
Kafka Connect source connector, writes one Kafka topic per table, keys each
message by the row's primary key, and stores its source position as a Kafka
Connect offset. Each event carries \`before\`, \`after\`, \`op\` and source
metadata.

**Practical concerns:**

- **Snapshot, then stream.** A new consumer first reads the existing rows
  (a snapshot), then streams changes from the log position recorded at the
  snapshot start, so nothing falls in the gap.
- **Resuming.** The consumer saves its position (LSN, binlog position, resume
  token) and continues from there after a restart.
- **Retained logs.** A PostgreSQL slot holds WAL until the consumer confirms
  it. If the consumer stops, WAL piles up and can fill the disk of the
  primary. Monitor slot lag, drop abandoned slots and set
  \`max_slot_wal_keep_size\`. MySQL and MongoDB have the opposite risk: if the
  consumer is down longer than binlog or oplog retention, its position is
  gone and it must re-snapshot.
- **Ordering.** The log is in commit order. Keep per-key order downstream by
  partitioning on the primary key; there is no global order across
  partitions.
- **Delivery.** Expect at-least-once delivery. Make the sink idempotent with
  upserts by primary key.
- **Deletes.** Debezium emits a delete event and then, by default, a
  **tombstone** (same key, null value) so Kafka log compaction can remove
  the key.
- **Schema changes.** Adding a column is usually fine; renaming or changing
  types can break consumers. Use a schema registry or versioned contracts,
  and roll out changes so old and new consumers both work.
- **Backfills.** To resync a table without stopping the stream, use an
  incremental snapshot (Debezium supports these via a signal) or a separate
  backfill that writes through the same idempotent upsert.
    `.trim(),
    diagram: `
POLLING                                   LOG-BASED CDC

 App ──writes──▶ ┌──────────┐              App ──writes──▶ ┌──────────┐
                 │ orders   │                              │ orders   │
                 │ table    │                              │ table    │
                 └────▲─────┘                              └────┬─────┘
                      │ SELECT ... WHERE                        │ every commit is
                      │ updated_at > cursor                     │ appended to the log
                      │ (every N seconds)                       ▼
                 ┌────┴─────┐                         ┌───────────────────┐
                 │ poller   │                         │ WAL / binlog /    │
                 └────┬─────┘                         │ oplog             │
                      │                               └────────┬──────────┘
                      ▼                                        │ read as a
                 ┌──────────┐                                  │ replication client
                 │ sink     │                         ┌────────▼──────────┐
                 └──────────┘                         │ Debezium / CDC    │
                                                      │ (saves LSN/offset)│
 - misses hard deletes                                └────────┬──────────┘
 - misses late commits / ties                                  ▼
 - extra queries on primary                           Kafka topic (key = PK)
 - latency = poll interval                                     │
                                                    ┌──────────┼──────────┐
                                                    ▼          ▼          ▼
                                                 search      cache    warehouse

                                    - every insert/update/delete, in commit order
                                    - low load: reads a log the DB writes anyway
                                    - must watch slot lag / log retention
    `.trim(),
    whyItExists: `
Modern systems keep the same data in several places, each good at one job:
the database for transactions, a search engine for text search, a cache for
fast reads, a warehouse for analytics. Keeping them in sync from application
code is fragile (dual writes), and polling is lossy. The database's log is
already a complete, ordered record of every change, so CDC reuses it instead
of reinventing change tracking.
    `.trim(),
    whenToUse: `
- Keeping a search index, cache or read model in sync with a primary database.
- Feeding a data warehouse or lake with changes instead of nightly full dumps.
- Migrating to a new database with little downtime: snapshot, stream changes,
  then switch over.
- Publishing domain events reliably, together with the transactional outbox.
- Auditing every change to sensitive tables.
    `.trim(),
    whenNotToUse: `
- One small table that changes rarely and tolerates minutes of delay:
  polling with a correct cursor and soft deletes may be enough.
- When you can't get replication privileges or log access (some managed
  databases restrict it) and can't change that.
- Raw row changes are not a good public API between teams. Exposing your
  table layout couples other services to your schema; publish deliberate
  events (for example through an outbox) instead.
- If you only need a one-off copy, a dump and restore is simpler.
    `.trim(),
    commonMistakes: [
      "Polling on updated_at with a strict > and LIMIT, which skips rows sharing a timestamp and rows that commit after the cursor has moved past their timestamp.",
      "Leaving a PostgreSQL replication slot behind after a consumer is removed or stops, so the primary keeps WAL until its disk fills up.",
      "Writing a sink that does plain INSERTs, so replayed events after a restart create duplicates or fail.",
      "Ignoring deletes: the sink handles only creates and updates, so deleted rows live forever in the search index or cache.",
      "Assuming a global order across a multi-partition topic. Order is guaranteed only per partition, so key messages by primary key.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List three kinds of changes that a polling job using `WHERE updated_at > :cursor` can miss, and explain why each is missed." },
      { difficulty: "Medium", prompt: "Write the PostgreSQL settings and SQL to publish an `orders` table for logical replication, create a slot, and a query that shows how much WAL each slot is retaining." },
      { difficulty: "Hard", prompt: "Design a pipeline that keeps an Elasticsearch index in sync with a 500-million-row products table. Cover the initial load, switching to streaming without a gap, handling deletes, consumer restarts, and a full reindex later without stopping updates." },
    ],
    interviewQuestions: [
      { question: "What is change data capture?", answer: "Detecting changes (inserts, updates, deletes) in a source database and delivering them to other systems, such as a search index, cache, warehouse or message queue, so they stay in sync." },
      { question: "Why does polling on an `updated_at` column miss hard deletes?", answer: "A deleted row no longer exists, so no query can select it. Polling needs soft deletes (a `deleted_at` column) or a separate mechanism to see deletions." },
      { question: "How can polling miss a row even though it was inserted with a correct timestamp?", answer: "The timestamp or sequence id is assigned before commit. A long transaction can commit after the poller already advanced past that value, so the row lands behind the cursor. Ties at a page boundary with a strict `>` are also skipped." },
      { question: "Why are dual writes from the application unsafe?", answer: "The two writes aren't atomic. A crash or failure between them leaves the systems disagreeing, and concurrent requests can apply their second writes in a different order than the database commits, leaving the copy stale." },
      { question: "What does log-based CDC read in PostgreSQL, MySQL and MongoDB?", answer: "PostgreSQL's write-ahead log through logical decoding (a publication plus a replication slot, using pgoutput or wal2json). MySQL's row-based binlog. MongoDB's oplog, usually through change streams." },
      { question: "What is a PostgreSQL replication slot, and what's the operational risk?", answer: "It records how far a consumer has confirmed reading (its LSN) and makes the server keep all WAL after that point. If the consumer stops or is abandoned, WAL accumulates and can fill the primary's disk. Monitor slot lag, drop unused slots, and cap it with `max_slot_wal_keep_size` (PostgreSQL 13+)." },
      { question: "How does a CDC pipeline start on a table that already has data?", answer: "It records the current log position, takes a consistent snapshot of existing rows, then streams changes from the recorded position. Events from the overlap are harmless if the sink is idempotent." },
      { question: "CDC is usually at-least-once. What does that mean for the sink?", answer: "After a restart the consumer resumes from its last committed offset and may replay events. The sink must be idempotent: upsert by primary key, treat delete-of-missing as a no-op, and ideally ignore events older than the version already applied." },
      { question: "How do you preserve ordering when CDC events go through Kafka?", answer: "Use the row's primary key as the message key so all changes to a row go to the same partition, which is ordered. There is no ordering across partitions, so consumers must not depend on cross-row order." },
      { question: "Senior: when would you not expose raw CDC events of your tables to other teams?", answer: "Raw row events leak your internal schema; any column rename becomes a breaking change for consumers. For cross-service integration, publish explicit domain events via a transactional outbox (which CDC can relay) and keep raw table CDC for your own derived stores like search and analytics." },
    ],
    prerequisites: ["databases", "database-replication", "queues"],
    relatedTopics: [
      "transactional-outbox-and-inbox",
      "event-streaming",
      "message-delivery-semantics",
      "idempotency",
      "search-and-inverted-index",
      "data-warehouses-and-olap",
      "caching",
      "postgresql-deep-dive",
    ],
    keywords: [
      "cdc",
      "change data capture",
      "debezium",
      "wal",
      "binlog",
      "oplog",
      "change streams",
      "polling",
      "logical replication",
      "logical decoding",
      "replication slot",
      "pgoutput",
      "wal2json",
      "kafka connect",
      "outbox",
      "dual writes",
    ],
  },
  {
    id: "transactional-outbox-and-inbox",
    title: "Transactional Outbox and Inbox",
    level: "intermediate",
    description: "Publish events reliably by saving them in the same transaction as your data, and dedupe them on the consumer side.",
    explanation: `
A service often needs to do two things when something happens: save to its
database and tell other services (for example, "order placed" to Kafka). Doing
both directly is a **dual write**, and it breaks when one succeeds and the
other fails: an order without an event, or an event for an order that was
rolled back.

The **transactional outbox** fixes this. In the same database transaction
that saves the order, you also insert a row into an \`outbox\` table
describing the event. Either both are saved or neither is. A separate
**relay** then reads the outbox and publishes the events, retrying until the
broker accepts them.

Because the relay can retry, a consumer may receive the same event twice.
The **inbox** pattern handles that: the consumer records each processed
event id in an \`inbox\` table, in the same transaction as its own changes,
and skips ids it has already seen.
    `.trim(),
    analogy:
      "Instead of handing a letter to the courier while you're still writing the receipt (and maybe forgetting one), you put the letter in an outbox tray at the same moment you file the receipt. A mail clerk empties the tray and keeps trying until each letter is delivered. The recipient keeps a list of letter numbers already opened, so a duplicate gets thrown away.",
    examples: [
      {
        title: "Writing the business row and the outbox row in one transaction",
        language: "sql",
        code: `CREATE TABLE outbox (
  id             uuid PRIMARY KEY,
  aggregate_type text        NOT NULL,  -- e.g. 'order'
  aggregate_id   text        NOT NULL,  -- e.g. the order id (used as message key)
  event_type     text        NOT NULL,  -- e.g. 'OrderPlaced'
  payload        jsonb       NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

BEGIN;
INSERT INTO orders (id, customer_id, total) VALUES ('o-42', 'c-7', 99.00);
INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload)
VALUES (gen_random_uuid(), 'order', 'o-42', 'OrderPlaced',
        '{"orderId":"o-42","customerId":"c-7","total":99.00}');
COMMIT;`,
        explanation:
          "Both inserts commit together or not at all, so there is never an order without its event or an event for an order that doesn't exist. Publishing happens later, outside the transaction.",
        walkthrough: [
          { code: "CREATE TABLE outbox (...)", explanation: "A plain table in the same database as the business data. It holds events waiting to be published." },
          { code: "BEGIN;", explanation: "Starts one local transaction, so no distributed coordination is needed." },
          { code: "INSERT INTO orders ...", explanation: "The normal business write." },
          { code: "INSERT INTO outbox ...", explanation: "Records the event to publish, with a unique id consumers can use to dedupe." },
          { code: "COMMIT;", explanation: "Makes both rows visible at once. If anything failed before this, both are rolled back." },
        ],
      },
      {
        title: "A polling relay and an inbox-based consumer",
        language: "typescript",
        code: `// Relay: publish unsent outbox rows, oldest first.
async function relayOnce(): Promise<void> {
  await db.transaction(async (tx) => {
    // SKIP LOCKED lets several relay instances share the work without double-claiming rows
    const rows = await tx.query(
      "SELECT * FROM outbox WHERE published_at IS NULL " +
      "ORDER BY created_at, id LIMIT 100 FOR UPDATE SKIP LOCKED",
    );
    for (const row of rows) {
      await broker.publish("orders", { key: row.aggregate_id, id: row.id, payload: row.payload });
    }
    // If we crash before this commit, the rows are published again: at-least-once
    await tx.query("UPDATE outbox SET published_at = now() WHERE id = ANY($1)", [rows.map((r) => r.id)]);
  });
}

// Consumer: the inbox insert and the side effect share one transaction.
async function handleOrderPlaced(message: { id: string; payload: OrderPlaced }): Promise<void> {
  await db.transaction(async (tx) => {
    const inserted = await tx.query(
      "INSERT INTO inbox (message_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING message_id",
      [message.id],
    );
    if (inserted.length === 0) return; // already processed: skip the duplicate
    await tx.query("INSERT INTO invoices (order_id, amount) VALUES ($1, $2)", [
      message.payload.orderId,
      message.payload.total,
    ]);
  });
}`,
        explanation:
          "The relay may publish a row twice (crash after publish, before marking it sent), so the consumer dedupes by event id. Ordering the outbox by created_at is a best effort in a multi-writer database; per-aggregate ordering is preserved by using the aggregate id as the message key. A CDC-based relay (Debezium reading the outbox table from the WAL) avoids the polling query and publishes in commit order.",
      },
    ],
    howItWorks: `
**Write side (outbox).**

1. In one local transaction, write the business change and an outbox row
   with a unique event id, the aggregate id, the event type and the payload.
2. A **relay** moves outbox rows to the broker. Two common ways:
   - **Polling relay**: query unpublished rows in order, publish, then mark
     them published (or delete them). \`FOR UPDATE SKIP LOCKED\` lets several
     relay instances share the work. Simple, but adds load and latency, and
     ordering by \`created_at\` or id can still differ from commit order.
   - **CDC relay**: a log-based CDC tool (see change-data-capture) reads
     inserts into the outbox table from the WAL or binlog, so events come out
     in commit order with no polling query. Debezium ships an outbox event
     router transform that routes each row to a topic based on its aggregate
     type and uses the aggregate id as the message key.
3. The relay retries until the broker acknowledges, so delivery is
   **at-least-once**.

**Read side (inbox).** The consumer stores each processed event id in an
\`inbox\` table with a unique constraint, in the same transaction as the
changes it makes. A duplicate fails the insert (or \`ON CONFLICT DO NOTHING\`
returns nothing) and is skipped. Together the two give effectively-once
processing: at-least-once delivery plus idempotent handling.

**Ordering.** Use the aggregate id as the message key, so all events for one
order land in the same partition, in order. If a consumer must also reject
out-of-order events, include a per-aggregate version number in the payload.

**Cleanup.** Outbox and inbox tables grow forever unless trimmed. Delete
outbox rows once published (with CDC you can delete right after insert in the
same transaction, since the insert is already in the log), or purge by age
in batches. Keep inbox ids at least as long as the broker could redeliver a
message, then purge old ones; partitioning by date makes this cheap.
    `.trim(),
    diagram: `
           ONE LOCAL TRANSACTION
   ┌───────────────────────────────────┐
   │  INSERT orders  (o-42)            │
   │  INSERT outbox  (evt-1, o-42, ..) │
   └───────────────┬───────────────────┘
                   │ COMMIT (both or neither)
                   ▼
           ┌───────────────┐   poll unpublished rows
           │ outbox table  │◀──────────────┐
           └───────┬───────┘               │
                   │ or read inserts       │
                   │ from WAL (CDC)        │
                   ▼                       │
           ┌───────────────┐               │
           │    relay      │───────────────┘
           └───────┬───────┘
                   │ publish, retry until acked (at-least-once)
                   ▼
           ┌───────────────┐   key = aggregate id (per-order ordering)
           │ broker topic  │
           └───────┬───────┘
                   ▼
   ┌───────────────────────────────────┐
   │ consumer: ONE LOCAL TRANSACTION   │
   │  INSERT inbox (evt-1) -- dup? skip│
   │  INSERT invoices ...              │
   └───────────────────────────────────┘
    `.trim(),
    whyItExists: `
A database and a message broker can't share one ordinary transaction, and
distributed transactions (two-phase commit) are slow, poorly supported by
brokers, and couple the systems' availability. The outbox turns "write to two
systems" into "write to one database", which is atomic, and then delivers
from there with retries. The inbox makes those retries safe.
    `.trim(),
    whenToUse: `
- A service must update its database and publish an event, and losing or
  inventing an event is unacceptable (orders, payments, inventory).
- Choreographed workflows and sagas, where each step reacts to the previous
  step's event.
- Any consumer whose side effect is not naturally idempotent (sending an
  email, charging a card, incrementing a counter) needs an inbox or similar
  dedupe.
    `.trim(),
    whenNotToUse: `
- Fire-and-forget notifications where an occasional lost event is fine
  (a metrics ping, a cache warm-up hint).
- When the consumer's operation is already naturally idempotent (an upsert
  of the full state by key), an inbox table adds little.
- When there's no local transaction to join (the write goes to a store
  without transactions); you need another approach, such as making the event
  log itself the source of truth.
    `.trim(),
    commonMistakes: [
      "Writing the outbox row in a separate transaction from the business change, which brings back the dual-write problem.",
      "Assuming the relay delivers exactly once. A crash between publishing and marking the row as sent republishes it, so consumers must dedupe.",
      "Recording the inbox id in a different transaction from the consumer's side effect, so a crash between them either loses the work or repeats it.",
      "Never cleaning up the outbox and inbox tables, letting them grow until the polling query and indexes slow down.",
      "Publishing all events without a message key, so events for the same aggregate land on different partitions and are processed out of order.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Describe two failure scenarios where saving an order and then publishing an event directly to Kafka leaves the systems inconsistent, and how the outbox prevents each." },
      { difficulty: "Medium", prompt: "Design outbox and inbox table schemas, including keys, indexes and a cleanup plan, for a service that writes 1,000 events per second." },
      { difficulty: "Hard", prompt: "Compare a polling relay with a CDC relay (Debezium reading the outbox table) for ordering guarantees, latency, database load and operational risk. Which would you pick for a payments service, and why?" },
    ],
    interviewQuestions: [
      { question: "What problem does the transactional outbox solve?", answer: "The dual-write problem: a service needs to update its database and publish a message, but the two can't be made atomic directly. Writing the event to an outbox table in the same transaction makes them atomic." },
      { question: "How does the outbox row get to the message broker?", answer: "A relay reads unpublished outbox rows and publishes them, either by polling the table or by reading the inserts from the database log with CDC, retrying until the broker acknowledges." },
      { question: "What delivery guarantee does the outbox give, and why?", answer: "At-least-once. The relay can crash after publishing but before recording that it did, so it publishes again on restart." },
      { question: "What is the inbox pattern?", answer: "The consumer stores each processed message id in a table with a unique constraint, in the same transaction as its side effects. A duplicate message conflicts on insert and is skipped." },
      { question: "Why must the inbox insert be in the same transaction as the consumer's work?", answer: "If they're separate, a crash between them either marks the message done without doing the work (lost) or does the work without marking it (repeated on redelivery)." },
      { question: "How do you preserve ordering of events for one entity?", answer: "Use the aggregate id as the message key so all its events go to one ordered partition. A CDC relay also emits rows in commit order. For extra safety include a per-aggregate version so consumers can detect gaps or stale events." },
      { question: "Why might a polling relay publish events in a different order than they committed?", answer: "Ordering by created_at or a sequence id reflects when the value was assigned, not when the transaction committed. A transaction that started earlier can commit later, so its row appears after rows the relay has already published." },
      { question: "Why not use a distributed transaction (two-phase commit) between the database and the broker instead?", answer: "Many brokers don't support it, it holds locks across systems, and a stalled coordinator blocks both. It also couples availability: the write fails whenever the broker is down. The outbox needs only a local transaction and tolerates broker outages." },
      { question: "How do you keep outbox and inbox tables from growing forever?", answer: "Delete or archive outbox rows after they're published (with CDC they can be deleted right away, since the insert is already captured in the log). Keep inbox ids for longer than the maximum redelivery window, then purge in batches or drop old date partitions." },
      { question: "Senior: when would you choose a CDC relay over a polling relay?", answer: "When you need commit-order delivery, low latency or high throughput without polling load on the primary. The cost is running CDC infrastructure (for example Debezium on Kafka Connect) and monitoring replication slots or binlog retention. A polling relay is fine at modest volume and is easier to run." },
    ],
    prerequisites: ["databases", "queues", "idempotency"],
    relatedTopics: [
      "change-data-capture",
      "distributed-transactions",
      "message-delivery-semantics",
      "event-streaming",
      "pub-sub",
      "idempotency",
      "transactions-and-acid",
      "background-jobs",
    ],
    keywords: [
      "outbox",
      "transactional outbox",
      "inbox",
      "dual writes",
      "deduplication",
      "cdc",
      "debezium",
      "wal",
      "binlog",
      "polling",
      "logical replication",
      "at-least-once",
      "saga",
      "skip locked",
    ],
  },
];
