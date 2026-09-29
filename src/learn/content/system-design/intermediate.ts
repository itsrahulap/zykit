import type { Topic } from "../../types/content";

export const systemDesignIntermediateTopics: Topic[] = [
  {
    id: "databases",
    title: "Databases",
    level: "intermediate",
    description: "Where an application's data actually lives, safely, between requests.",
    explanation: `
A running program keeps its variables in memory, but memory disappears the
moment the program stops or restarts — not great for a user's account,
posts, or orders. A **database** is software specifically designed to
store data reliably on disk, retrieve it quickly, and keep it consistent
even when many things are reading and writing at once.

Almost every real application has a database sitting behind its server,
holding the actual persistent data the app depends on.
    `.trim(),
    analogy:
      "If a server is the chef preparing your order, the database is the pantry and fridge — a well-organized place where ingredients (data) are stored so the chef can reliably find and use them, even after the kitchen closes and reopens the next day.",
    examples: [
      {
        title: "A server reading from a database",
        code: `// Simplified example
async function getUser(id) {
  const user = await database.query(
    "SELECT * FROM users WHERE id = ?",
    [id]
  );
  return user;
}`,
        explanation:
          "The server doesn't store user data itself — it asks the database, which is responsible for storing and retrieving it reliably.",
        walkthrough: [
          { code: "async function getUser(id) {", explanation: "Defines a function that will fetch one user from the database." },
          { code: 'database.query("SELECT * FROM users WHERE id = ?", [id])', explanation: "Asks the database for the row matching this id, waiting for the (possibly slow) answer." },
          { code: "return user;", explanation: "Sends the result back to whoever called getUser." },
        ],
      },
    ],
    howItWorks: `
A database organizes data (often into tables, or collections of
documents), and provides a query language or API to read and write that
data. It also manages tricky details automatically — like making sure two
simultaneous writes don't corrupt each other, and that data survives a
crash or restart.
    `.trim(),
    whyItExists: `
Applications need data to persist reliably — surviving crashes, restarts,
and simultaneous use by many users at once. Building that reliability from
scratch for every app would be enormously wasteful; databases exist so
every application can rely on the same well-tested foundation.
    `.trim(),
    whenToUse: `
Use a database anytime data needs to survive beyond a single request or
process — user accounts, orders, posts, anything that must still be there
tomorrow, or on a different server entirely.
    `.trim(),
    whenNotToUse: `
For data that's only ever needed for the lifetime of a single request — a
temporary calculation, a value passed between two functions — a database
is unnecessary overhead. Keep that in memory instead.
    `.trim(),
    commonMistakes: [
      "Storing important data only in server memory, losing it whenever the server restarts.",
      "Not thinking about how a database will scale as data grows into the millions of records.",
      "Trusting user input directly in a database query, which can lead to serious security issues (like SQL injection).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, why a to-do list app needs a database instead of just keeping tasks in the browser's memory." },
      { difficulty: "Medium", prompt: "Describe what data you'd store for a simple blog (e.g. posts, authors, comments) and how those pieces might relate to each other." },
      { difficulty: "Hard", prompt: "Explain what could go wrong if two users tried to buy the last item in stock at the exact same moment, and how a database might prevent it." },
    ],
    interviewQuestions: [
      { question: "Why can't an application just keep all its data in server memory?", answer: "Memory is wiped when a process restarts or crashes, and it doesn't scale across multiple servers — a database provides durable, shared storage instead." },
      { question: "What's the difference between reading and writing data in terms of design concerns?", answer: "Reads are typically far more frequent and easier to scale (e.g. via caching or replicas); writes need stronger guarantees around consistency and conflict handling." },
      { question: "What is data persistence?", answer: "The property of data surviving beyond the lifetime of the process that created it — e.g. still being there after a server restarts." },
      { question: "What does ACID stand for, and why does it matter for a transaction?", answer: "Atomicity, Consistency, Isolation, Durability — a transaction either fully applies or not at all, leaves the data in a valid state, doesn't interfere with other concurrent transactions, and once committed, survives a crash." },
      { question: "Why do multiple statements often need to be grouped into a single transaction, rather than run one at a time?", answer: "If a transfer debits one account and credits another as two separate statements, a crash between them could lose money — wrapping both in one transaction guarantees they either both apply or neither does." },
      { question: "What is a database index, and why isn't every column simply indexed by default?", answer: "An index is a separate, sorted structure that lets the database find matching rows without scanning the whole table — but every index also has to be updated on every write, and takes up its own storage, so indexing everything slows down writes for little read benefit on rarely-queried columns." },
      { question: "Mechanically, why does an index make a lookup fast where scanning the whole table wouldn't?", answer: "Most indexes are a B-tree — a sorted structure the database can binary-search, so finding a match takes roughly `log(n)` steps regardless of table size, instead of a full table scan that checks every one of the `n` rows." },
      { question: "What's the difference between optimistic and pessimistic concurrency control?", answer: "Pessimistic control locks a row upfront so no other transaction can touch it until it's done; optimistic control lets transactions proceed freely and only checks at commit time whether the data changed underneath it, retrying if it did — better when conflicts are rare." },
      { question: "What is a deadlock, and how does a database typically handle it?", answer: "Two transactions each hold a lock the other one needs, so neither can proceed — the database detects this cycle and forcibly aborts one of the transactions (rolling it back) to break the deadlock." },
      { question: "What does normalizing a schema mean, and what's the tradeoff of deliberately denormalizing it?", answer: "Normalizing splits data across tables to avoid storing the same fact twice, keeping it consistent by construction; denormalizing intentionally duplicates data to make reads faster (fewer joins), at the cost of having to keep every copy in sync on writes." },
      { question: "What is the N+1 query problem, and how do you fix it?", answer: "Fetching a list of N records, then running one additional query per record in a loop to get related data — 1 + N queries where one join or batch load would do. Fixed by eager-loading the related data in a single query (a join, or one `WHERE id IN (...)` batch fetch)." },
      { question: "Why can an ORM sometimes hurt performance compared to hand-written SQL?", answer: "An ORM's convenience often hides exactly which queries it's actually running — a chain of object accesses can silently trigger an N+1 query pattern, or fetch far more columns/rows than the code actually needs, and it's easy not to notice until it's slow at scale." },
      { question: "What is connection pooling, and why does it matter?", answer: "Opening a new database connection involves a real cost (a TCP handshake and authentication), so a connection pool keeps a set of already-open connections ready to reuse across requests instead of opening and closing one per request." },
      { question: "What does a query's `EXPLAIN` plan tell you, and when would you reach for it?", answer: "It shows how the database actually intends to execute a query — whether it uses an index or scans the whole table, and in what order it joins tables — and it's the first thing to check when a specific query is unexpectedly slow." },
      { question: "What's the difference between a primary key and a foreign key?", answer: "A primary key uniquely identifies each row within its own table; a foreign key stores another table's primary key to represent a relationship, and the database can enforce that the referenced row actually exists." },
      { question: "What's the difference between OLTP and OLAP databases?", answer: "OLTP (Online Transaction Processing) handles many small, frequent reads and writes, like placing an order; OLAP (Online Analytical Processing) runs fewer but much larger queries that scan huge amounts of historical data for reporting — the two workloads are different enough that they're often served by differently-optimized systems." },
      { question: "Why isn't replication a substitute for backups, even though both involve keeping copies of data?", answer: "A replica mirrors changes as they happen — including a mistaken delete or corruption on the primary, which replicates just as faithfully as any legitimate write. A backup is a separate, point-in-time snapshot you can restore from after the fact, which replication alone doesn't provide." },
      { question: "Scenario: a `products` query filters by `category` and sorts by `price`, and it's slow at 50 million rows despite an index on `category` alone. What's likely happening?", answer: "The index quickly finds the matching rows for that category, but the database still has to sort all of those matches by price separately, often spilling to disk at that volume. A composite index on `(category, price)` would let it return already-sorted results directly — worth confirming by checking whether the query plan shows a separate sort step." },
      { question: "What is a \"dirty read,\" and what prevents it?", answer: "Reading a row that another transaction has changed but not yet committed — meaning it might still be rolled back, so you've read data that never actually existed. Any isolation level stricter than the weakest one (read uncommitted) — read committed and above — prevents it." },
      { question: "What's the difference between a \"non-repeatable read\" and a \"phantom read\"?", answer: "A non-repeatable read is re-reading the same row twice within one transaction and getting different values, because another transaction updated it in between. A phantom read is re-running the same range query twice and getting a different set of rows, because another transaction inserted or deleted rows matching that filter in between." },
      { question: "When would you reach for vertical scaling of a database versus horizontal scaling (replication or sharding)?", answer: "Vertical scaling (a bigger server) is simpler and has no distributed-systems complexity, and works well up to a point — but it has a hard ceiling, cost grows faster than capacity near the top end, and it's still a single point of failure. Horizontal scaling spreads load and risk across multiple machines at the cost of real operational complexity, and is what you reach for once vertical scaling's ceiling or single-server risk becomes the actual constraint." },
      { question: "Scenario: your database's CPU is pegged near 100% during peak hours, mostly from read queries. Name two different fixes and what each costs.", answer: "Adding read replicas spreads read load across more machines, at the cost of replication lag and more operational complexity. Adding a caching layer in front of the database avoids hitting it at all for repeat reads, at the cost of occasionally serving slightly stale data. (Scaling the database vertically is a third option, but only buys you until the next ceiling.)" },
      { question: "Why is directly building a SQL query string from user input dangerous, and what's the standard fix?", answer: "If user input is concatenated straight into a query, an attacker can craft input that changes the query's actual meaning (SQL injection) — for example, ending the intended string early and appending their own clause. The fix is parameterized queries (prepared statements), where user input is always passed as data and can never be interpreted as part of the query's structure." },
      { question: "What is a write-ahead log, and why do databases use one?", answer: "Before actually modifying data on disk, the database first appends the intended change to a durable, sequential log. If it crashes mid-write, it can replay that log on restart to recover to a consistent state, rather than losing or corrupting whatever it was in the middle of doing — it's the mechanism behind the \"D\" (durability) in ACID." },
      { question: "Scenario: you need to add a `NOT NULL` column to a table with 200 million existing rows, with zero downtime allowed. What has to be handled carefully?", answer: "You generally can't add a `NOT NULL` column with no default in one step on a table that size without a long-held lock or table rewrite. The safer path is adding the column as nullable first, backfilling existing rows in small batches to avoid locking the whole table at once, and only adding the `NOT NULL` constraint once every row has a value." },
      { question: "What's the difference between a database-enforced constraint (like a foreign key or unique constraint) and the same rule checked only in application code?", answer: "A database constraint holds no matter what writes the data — a bug, a different service, or a race between two concurrent writes can't violate it. An application-level check can be bypassed by any other path to the same database, and is itself vulnerable to a race condition between the check and the write it's guarding." },
    ],
    prerequisites: ["rest-apis"],
    relatedTopics: ["sql-vs-nosql", "caching", "rest-apis", "database-replication"],
    keywords: ["database", "persistence", "query", "storage"],
  },
  {
    id: "sql-vs-nosql",
    title: "SQL vs NoSQL",
    level: "intermediate",
    description: "Two different philosophies for organizing and storing data, each suited to different problems.",
    explanation: `
Not all databases organize data the same way. **SQL** (Structured Query
Language — the language used to ask these databases for data, and the name
that stuck to the whole category) databases are **relational**: they store
data in strict tables with predefined columns, and are very good at
representing relationships between different kinds of data consistently.
**NoSQL** ("not only SQL") databases take a more flexible approach —
storing data as loose documents, key-value pairs, or other shapes — trading
some structure and consistency guarantees for flexibility and easier
scaling across many machines. Despite the name, most NoSQL databases still
support some form of querying — they just don't use SQL to do it.

Neither is universally "better" — the right choice depends on how
structured your data is and how it needs to scale.
    `.trim(),
    analogy:
      "A SQL database is like a set of strict spreadsheets, each with fixed columns everyone must follow — great for consistency. A NoSQL database is more like a stack of index cards, where each card can have whatever fields make sense for it — great for flexibility.",
    examples: [
      {
        title: "The same data, two different shapes",
        code: `-- SQL: fixed columns, a strict table
-- users(id, name, email)
SELECT * FROM users WHERE id = 1;

// NoSQL (document-style): flexible shape per document
{
  "id": 1,
  "name": "Amara",
  "email": "amara@example.com",
  "preferences": { "theme": "dark" } // easy to add, no schema change needed
}`,
        walkthrough: [
          { code: "-- users(id, name, email)", explanation: "Defines a strict table shape — every row must have exactly these columns." },
          { code: "SELECT * FROM users WHERE id = 1;", explanation: "Reads the row matching id 1 from that fixed table." },
          { code: '{ "id": 1, "name": ..., "preferences": {...} }', explanation: "The same kind of data, stored as a flexible document — new fields can be added without changing every other record." },
        ],
      },
    ],
    howItWorks: `
SQL databases enforce a schema — every row in a table must have the same
columns — and are built around relationships between tables (a user has
many orders, an order has many items). NoSQL databases typically don't
enforce a fixed schema, letting each record's shape vary, and often
sacrifice some cross-record consistency guarantees in exchange for being
easier to spread across many servers.
    `.trim(),
    whyItExists: `
Some data is naturally tabular and relationship-heavy (financial records,
inventory) — a great fit for SQL's structure and guarantees. Other data is
less structured or needs to scale to enormous volume across many servers
(logs, user activity feeds) — where NoSQL's flexibility and scalability
are a better fit.
    `.trim(),
    whenToUse: `
Reach for SQL when your data is naturally tabular and relationships
between records matter a lot (orders belonging to users, items belonging
to orders) and you want strong consistency guarantees. Reach for NoSQL
when your data's shape varies a lot, changes frequently, or needs to
scale out across many machines more easily than a single relational
database can.
    `.trim(),
    whenNotToUse: `
Don't pick NoSQL just because it feels more modern — if your data is
genuinely relational, fighting that in a document store often means
reinventing SQL's features yourself. And don't force rigid SQL tables onto
data that changes shape constantly; frequent schema migrations become
their own maintenance burden.
    `.trim(),
    commonMistakes: [
      "Assuming NoSQL is always 'faster' or 'more modern' — it's a different trade-off, not a strict upgrade.",
      "Using a rigid SQL schema for data that changes shape constantly, causing painful migrations.",
      "Using a NoSQL database for data with many strict relationships, and then re-implementing relational logic manually in application code.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List two examples of data that fit naturally into SQL tables, and two that fit better as flexible NoSQL documents." },
      { difficulty: "Medium", prompt: "Explain, in your own words, what a 'schema' is and why enforcing one has both benefits and costs." },
      { difficulty: "Hard", prompt: "Describe a scenario where you might use both a SQL and a NoSQL database in the same application, and why." },
    ],
    interviewQuestions: [
      { question: "What's the main structural difference between SQL and NoSQL databases?", answer: "SQL databases enforce a fixed schema and organize data into related tables; NoSQL databases typically allow flexible, schema-less structures like documents or key-value pairs." },
      { question: "When would you choose NoSQL over SQL?", answer: "When your data doesn't fit neatly into fixed tables, needs to scale horizontally across many servers, or its structure changes frequently." },
      { question: "Does choosing NoSQL mean giving up data consistency entirely?", answer: "Not entirely — but many NoSQL systems trade some strong consistency guarantees for availability and scalability, following what's sometimes called 'eventual consistency'." },
      { question: "What are the main categories of NoSQL databases, and what's each typically good at?", answer: "Document stores (flexible, nested records, e.g. MongoDB) fit varied per-record shapes; key-value stores (e.g. Redis, DynamoDB) fit simple, extremely fast lookups by a single key; wide-column stores (e.g. Cassandra) fit huge, sparse, write-heavy datasets; graph databases (e.g. Neo4j) fit data defined mainly by its relationships, like a social network." },
      { question: "Scenario: you're building a product catalog where each category has wildly different attributes — a book has an author and ISBN, a TV has screen size and resolution. SQL or NoSQL?", answer: "A NoSQL document store fits naturally: each product document only stores the fields relevant to it. Forcing this into SQL means either a table with dozens of mostly-null columns, or an awkward entity-attribute-value pattern that reinvents flexible storage on top of a rigid one." },
      { question: "Scenario: you're building the ledger for a banking app that must guarantee an account's balance is never double-spent across two concurrent transfers. SQL or NoSQL?", answer: "SQL — this fundamentally requires strong, multi-row ACID transactions, guaranteeing a debit and a credit either both apply or neither does, with no other transaction able to interleave and see a half-applied state. Many NoSQL databases either don't support multi-document transactions at all, or added them later at a real performance cost, because it works against their scaling model." },
      { question: "Why do most NoSQL databases avoid supporting joins, and what does that push you to do instead?", answer: "In a system designed to spread data across many machines, a join might need to pull matching data from several different nodes, which is expensive and works against the model. Instead, NoSQL data is usually denormalized — related data is embedded directly into the document a query actually needs it in, duplicating it rather than joining it at read time." },
      { question: "What's the difference between \"schema-on-write\" and \"schema-on-read,\" and which philosophy does each side favor?", answer: "SQL is schema-on-write: the shape of the data is checked and enforced at insert time. NoSQL is generally schema-on-read: data is stored as-is, and it's up to whatever later reads it to interpret its shape — which pushes validation responsibility onto the application instead of the database." },
      { question: "What does BASE (as a contrast to ACID) stand for, and what philosophy does it represent?", answer: "Basically Available, Soft state, Eventually consistent — the guiding philosophy behind many NoSQL systems: prioritize staying available and responsive over guaranteeing that every read is immediately up to date." },
      { question: "Scenario: you need to store hundreds of millions of IoT sensor readings per day, mostly appended once and rarely updated, queried by device and time range. What fits, and why?", answer: "A wide-column or time-series-oriented NoSQL store: it's built for very high write throughput, naturally partitions by something like device id and time, and this workload doesn't need relational joins across unrelated entities — it needs fast, well-partitioned appends and range scans." },
      { question: "What's a real cost of denormalizing data into a NoSQL document that a SQL-background developer might not expect?", answer: "Because the same fact can be duplicated across many documents (e.g. a username embedded in every post by that user), changing that one fact means updating potentially every document it was copied into, instead of a single row in a single place." },
      { question: "Why can adding an index be a more deliberate, upfront decision in a NoSQL database than it typically is in SQL?", answer: "Many NoSQL databases don't have a general-purpose query planner that automatically optimizes arbitrary ad hoc queries the way SQL databases do. You often need to design indexes around your known access patterns in advance, and a query that doesn't match an existing index can be slow, or even rejected outright at scale." },
      { question: "What does \"polyglot persistence\" mean, and what's a realistic example?", answer: "Using multiple different databases for different parts of one system, rather than forcing a single database to serve every workload — for example, SQL for orders and payments that need strong transactional guarantees, a document store for a flexible content catalog, and an in-memory key-value store like Redis for session data." },
      { question: "Scenario: your document store doesn't support transactions across multiple documents. How do you still guarantee that a related pair of writes always happens together?", answer: "Two common strategies: restructure the data so what must be atomic lives inside a single document (embed instead of reference, since a single-document write is still atomic), or accept the multi-step nature of it and add a compensating-action (saga-style) pattern at the application level that can detect and repair a partially-applied write." },
      { question: "Why is horizontal scaling often easier to achieve with NoSQL databases than with a traditional relational database?", answer: "Many NoSQL databases are designed from the start assuming distribution — the data model actively discourages the cross-node joins and transactions that make distributing a relational database hard, so partitioning data across many machines doesn't fight the model. Relational databases were originally designed assuming a single node, with distribution (sharding, distributed SQL) added on afterward, at real complexity cost." },
      { question: "Common misconception: \"NoSQL databases are always faster than SQL databases.\" Why is this wrong?", answer: "Speed depends on how well the data model and indexing fit the actual query pattern, not on the technology category. A well-indexed SQL query over well-structured relational data can easily outperform a poorly-modeled NoSQL query, and vice versa — it's a different set of trade-offs, not a categorical performance upgrade." },
      { question: "Scenario: your app uses one SQL database for everything, and a new \"notification history\" feature needs to store an ever-growing, rarely-queried-in-detail log of every notification sent, at huge volume. Keep it in the same database?", answer: "Probably not as-is — unbounded, high-volume, append-heavy data competing for the same database's resources can degrade the core transactional workload it's meant to serve. A separate store better suited to the access pattern (append-heavy, rarely joined against core data) — a NoSQL store, a cheaper storage tier, or a dedicated log/analytics system — usually fits better." },
      { question: "What's the practical impact of eventual consistency on a NoSQL-backed app's UI, and how do teams commonly work around it?", answer: "A user's own just-made write might not immediately appear if their next read happens to hit a replica that hasn't caught up yet. Common mitigations are \"read-your-own-writes\" routing (sending a user's reads to the same node they just wrote to) or updating the UI optimistically from the write itself, rather than waiting on a fresh read." },
      { question: "What's the difference between a key-value store and a document store, given both can look like \"a big dictionary\"?", answer: "A key-value store treats the stored value as an opaque blob — the database doesn't understand or let you query its internal structure. A document store parses the value's structure and can query or index individual fields within it." },
      { question: "Why is choosing a good partition key in a NoSQL database often even more consequential than choosing a good index in SQL?", answer: "Most NoSQL databases route directly to a partition based on that key and don't offer an efficient ad hoc query or cross-partition join as a fallback. A bad key choice doesn't just make one query slow and unindexed — it can make an entire access pattern fundamentally expensive or unsupported." },
      { question: "Scenario: a social feature needs to find \"mutual friends of these two users,\" potentially traversing several hops of relationships. What's purpose-built for this, and why would a relational database struggle?", answer: "A graph database is purpose-built for this — it follows direct pointers between connected nodes. A relational database would need repeated self-joins against a friendship table, and the cost of that grows quickly with each additional hop of traversal." },
      { question: "Does using a NoSQL database mean giving up data validation entirely?", answer: "No — validation just moves. Instead of the database enforcing a column's type and shape via schema, the application code (or an optional schema-validation layer some NoSQL databases provide) becomes responsible for ensuring documents have the expected shape." },
      { question: "What's a real downside of SQL's rigid schema for a product that's still evolving rapidly, like an early-stage startup?", answer: "Every new field requires a migration (`ALTER TABLE`), which can be slow or locking on a large table, and requires coordinating the schema change across the whole team before the field can even be used — more upfront friction than a document model, where a new field can simply start appearing in new documents." },
      { question: "What's the conceptual difference between \"get this user's 5 most recent orders\" in SQL versus in a document store?", answer: "In SQL, it's typically a join between `users` and `orders`, filtered, sorted, and limited by the database. In a document store, it's more likely either embedding recent orders directly in the user document, or a separate `orders` collection with a compound index on `(userId, createdAt)` queried directly — with the application, not the database, responsible for relating the two." },
      { question: "How does the CAP theorem relate to why many NoSQL databases default to eventual consistency?", answer: "The CAP theorem says a distributed system can't guarantee perfect consistency and availability at the same time during a network partition — it has to give up one. Many NoSQL databases were built to keep serving requests even when parts of the cluster can't communicate, so they deliberately favor availability and accept eventual consistency as the cost." },
      { question: "Follow-up: does that mean SQL databases can't scale horizontally at all?", answer: "No — modern distributed SQL databases exist that shard and replicate data while preserving relational semantics and stronger consistency. It's historically been harder to build and is still more operationally complex than NoSQL's original model, but \"SQL doesn't scale\" is an oversimplification, not a hard law." },
      { question: "What does it mean for a wide-column NoSQL table to be \"sparse,\" and why is that useful?", answer: "Different rows in the same table can have entirely different sets of populated columns, unlike SQL where every row has every column (even if null). This avoids wasting storage on absent values when most rows only ever populate a small, varying subset of a huge number of possible columns." },
      { question: "Scenario: you need full-text search across product descriptions with typo tolerance and relevance ranking. Is a general-purpose SQL or NoSQL database the right primary tool?", answer: "Neither, really — this is usually better served by a dedicated search engine (like Elasticsearch, itself a specialized document-oriented store) built specifically for tokenizing, ranking, and fuzzy-matching text, used alongside your primary database rather than replacing it." },
      { question: "What's a common trap when migrating an existing relational schema \"as-is\" into a NoSQL document store?", answer: "Translating each SQL table into a separate collection one-for-one, and still trying to join between them at query time, throws away the document model's strengths (no efficient joins) while keeping none of SQL's transactional guarantees. The schema needs to be redesigned around the application's actual query patterns, not a literal table-by-table translation." },
      { question: "Why might a team choose NoSQL specifically for a very write-heavy workload over SQL?", answer: "Many NoSQL databases are architected to spread writes across many nodes with minimal cross-node coordination, giving very high write throughput. A single relational database (before sharding) funnels all writes through one primary, which becomes the bottleneck at very high write volume." },
      { question: "How does handling \"the data's shape changed yesterday\" typically differ between the two systems?", answer: "In SQL, a shape change requires a migration, ideally versioned and run consistently across every environment, before old and new code can reliably talk to the same table. In a document store, application code often just needs to handle both old- and new-shaped documents at once, since existing documents don't retroactively change — schema evolution effectively happens at the read/application layer instead of upfront." },
    ],
    prerequisites: ["databases"],
    relatedTopics: ["databases", "scalability"],
    keywords: ["SQL", "NoSQL", "relational", "schema", "document database"],
  },
  {
    id: "caching",
    title: "Caching",
    level: "intermediate",
    description: "Keeping a copy of frequently-needed data somewhere much faster to access, so you don't redo expensive work every time.",
    explanation: `
Some operations are expensive — a complex database query, a slow
calculation, a request to another service far away. If the same result is
needed again and again, redoing that expensive work every single time is
wasteful. **Caching** means storing a copy of the result somewhere fast
(often in memory) so future requests can just reuse it instead of
recomputing it.
    `.trim(),
    analogy:
      "It's like keeping a jar of pre-made coffee in the fridge instead of brewing a fresh pot every single time someone wants a cup. It's faster to grab an existing cup — you just have to remember to refill the jar occasionally.",
    examples: [
      {
        title: "A simple cache in front of a slow lookup",
        code: `const cache = new Map();

async function getUser(id) {
  if (cache.has(id)) {
    return cache.get(id); // fast — no database call
  }

  const user = await database.query("SELECT * FROM users WHERE id = ?", [id]);
  cache.set(id, user);
  return user;
}`,
        walkthrough: [
          { code: "const cache = new Map();", explanation: "A simple in-memory cache, empty to start." },
          { code: "if (cache.has(id)) { return cache.get(id); }", explanation: "If this id's result is already cached, return it immediately — no database call." },
          { code: 'const user = await database.query(...);', explanation: "Only runs on a cache miss — the expensive lookup." },
          { code: "cache.set(id, user);", explanation: "Stores the result for next time, before returning it." },
        ],
      },
    ],
    howItWorks: `
Before doing expensive work, the system checks the cache first. If the
data is there (a "cache hit"), it's returned immediately. If not (a "cache
miss"), the expensive work runs, and the result is stored in the cache for
next time. Cached data is usually also given an expiration time, so it
doesn't become permanently stale.
    `.trim(),
    diagram: `
Request comes in
       ↓
 Is it in the cache?
   ↓yes            ↓no
return cached    do expensive work
  value             ↓
                store result in cache
                     ↓
                return result
    `.trim(),
    whyItExists: `
Caching dramatically reduces load on slow or expensive resources (like
databases) and makes responses feel instant to users, at the cost of
occasionally serving slightly outdated data — a trade-off that's usually
well worth it for data that doesn't change every second.
    `.trim(),
    whenToUse: `
Reach for caching when the same expensive result is requested repeatedly
and doesn't need to be perfectly fresh every single time — a product
page, a popular search result, a computed report.
    `.trim(),
    whenNotToUse: `
Don't cache data that must always be perfectly up to date and changes
constantly — a live account balance mid-transaction, for instance — or
if you do, keep the cache lifetime extremely short and invalidate it
deliberately whenever the underlying data changes.
    `.trim(),
    commonMistakes: [
      "Caching data that changes frequently without a short enough expiration, leading to users seeing stale information.",
      "Forgetting to invalidate (clear) a cached value when the underlying data changes.",
      "Caching sensitive or user-specific data in a shared cache without properly separating it per user.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, the difference between a 'cache hit' and a 'cache miss'." },
      { difficulty: "Medium", prompt: "Add an expiration time to the cache example above, so cached values are only reused for 60 seconds." },
      { difficulty: "Hard", prompt: "Describe a real scenario where caching stale data could cause a real user-facing problem, and how you'd mitigate it." },
    ],
    interviewQuestions: [
      { question: "What is caching, in simple terms?", answer: "Storing a copy of a result somewhere fast to access, so repeated requests for the same thing don't redo expensive work." },
      { question: "What is cache invalidation, and why is it considered hard?", answer: "It's the process of removing or updating cached data once it's no longer accurate — hard because you must reliably track every place a cached value could become stale." },
      { question: "What's a trade-off caching introduces?", answer: "It can serve slightly outdated ('stale') data for a period of time, in exchange for much faster responses and less load on the underlying system." },
      { question: "What is the cache-aside (lazy-loading) pattern?", answer: "The application checks the cache first; on a miss, it reads from the underlying data source itself, then writes that result into the cache before returning it. The cache only ever holds what's actually been requested, and the application — not the cache — owns the read-through logic." },
      { question: "What is write-through caching, and how does it differ from cache-aside in when data enters the cache?", answer: "In write-through, every write goes to the cache and the underlying store together, as one operation, so the cache is always populated with the latest value the moment it's written. In cache-aside, data only enters the cache reactively, on a later read after a miss — a fresh write doesn't populate the cache by itself." },
      { question: "What is write-back (write-behind) caching, and what risk does it introduce that write-through avoids?", answer: "Write-back writes go to the cache immediately and are acknowledged as done, with the write to the underlying store happening asynchronously afterward. This is faster, but if the cache crashes before that async write completes, the data is lost — a risk write-through avoids by only confirming the write once both are durably updated." },
      { question: "What is \"write-around\" caching, and when would you use it?", answer: "Writes go directly to the underlying store, bypassing the cache entirely; the cache only gets populated later, on a read (like cache-aside). It suits data that's written once and rarely re-read soon after, avoiding filling the cache with values that may never be requested." },
      { question: "What is cache stampede (thundering herd), and give a concrete scenario where it happens.", answer: "When a popular cached key expires or is evicted, many concurrent requests can all miss at once and all hit the underlying data source simultaneously to recompute the same value — for example, a highly-requested product page's cache entry expiring right as a traffic spike hits, sending thousands of simultaneous queries to the database for the exact same row." },
      { question: "Name two mitigations for cache stampede.", answer: "A lock (or \"single-flight\") so only one request recomputes a missing value while others wait for that result instead of duplicating the work; or adding random jitter to TTLs so many entries don't all expire at the exact same instant." },
      { question: "What's the tradeoff in choosing a very short TTL versus a very long one?", answer: "A short TTL keeps data fresher but causes more frequent cache misses, pushing more load back onto the underlying system and reducing the benefit of caching at all. A long TTL maximizes cache hits and load reduction but risks serving stale data for longer after the underlying data changes." },
      { question: "What is \"stale-while-revalidate,\" and what problem does it solve?", answer: "When a cached value expires, the request is still served the (now-stale) cached value immediately, while a background request refreshes it for next time — avoiding making the user's request wait on the slow recompute, at the cost of that one response being slightly outdated." },
      { question: "What is negative caching, and why cache the absence of something?", answer: "Caching the fact that a lookup found nothing (e.g. \"no user with this id\") so repeated requests for that same missing value don't repeatedly hit the expensive underlying system just to be told 'not found' again — useful when misses are frequent, like repeated lookups for invalid or deleted ids." },
      { question: "What's the difference between LRU and LFU eviction policies, and when would LFU beat LRU?", answer: "LRU (Least Recently Used) evicts whatever hasn't been accessed in the longest time; LFU (Least Frequently Used) evicts whatever has been accessed the fewest times overall. LFU can beat LRU when a genuinely popular item is only briefly not accessed (LRU might wrongly evict it for a rarely-used item that happened to be touched more recently)." },
      { question: "What happens if a cache runs out of memory and no eviction policy is deliberately chosen?", answer: "Most cache systems fall back to some default eviction behavior (commonly LRU) rather than simply refusing new writes or crashing — but relying on an undchosen default means you haven't actually reasoned about which data you'd rather keep, which can silently evict something important under memory pressure." },
      { question: "What's the difference between a local (in-process) cache and a distributed cache like Redis, and what does each trade off?", answer: "A local cache lives in one application server's own memory — extremely fast with zero network hop, but only that one server sees it, and it disappears if the process restarts. A distributed cache is a separate shared service every server can read from — consistent across servers, but adds a network round trip and its own operational dependency." },
      { question: "Scenario: 10 app servers each keep their own local in-memory cache. What consistency problem does this create, and how would a distributed cache change it?", answer: "Each server's cache can hold a different, independently-stale version of the same key — a user could get a different answer depending on which server handles their request. A shared distributed cache gives every server the same view of cached data, at the cost of a network call each server must now make instead of a local memory read." },
      { question: "What is cache key design, and why does a poorly designed key silently break caching correctness?", answer: "The cache key must uniquely capture everything that affects the cached result — if two logically different requests (e.g. different filters, different users, different locales) end up mapping to the same key, one request can silently receive another's cached result, which is a correctness bug, not just a performance one." },
      { question: "Scenario: an API endpoint takes query params for pagination and filters. How would you design the cache key, and what happens if you get it wrong?", answer: "The key should encode every param that changes the response — page number, page size, and each filter value, typically normalized into a consistent order. Get it wrong (e.g. keying only on the endpoint path) and a request for page 2 could be served page 1's cached response, or one user's filtered results could leak to another user's differently-filtered request." },
      { question: "Why does adding a cache sometimes make debugging production issues harder?", answer: "A bug can now be intermittent and depend on cache state — the same request can behave differently on a hit versus a miss, or show a problem only after data changed but before the cache caught up, making it harder to reproduce and reason about than a system with one consistent code path." },
      { question: "What is cache warming, and when is it necessary?", answer: "Proactively populating a cache with expected data before real traffic arrives, rather than waiting for organic cache misses to fill it. Useful right after a deploy, cache restart, or expected traffic spike, so the system isn't hit with a wave of cold-cache misses all at once." },
      { question: "Scenario: a freshly deployed, empty distributed cache goes live right as a traffic surge hits. What could go wrong, and how would you prevent it?", answer: "Every request is effectively a cache miss at once, so the full weight of that surge lands directly on the underlying database or service exactly when it's least prepared for it — potentially overwhelming it. Cache warming beforehand, or a gradual traffic ramp-up, avoids sending a cold cache straight into peak load." },
      { question: "What's the difference between invalidating a cache entry and simply letting it expire via TTL?", answer: "Invalidation is an active, immediate removal or update triggered by a known change to the underlying data — the cache is corrected right away. TTL expiration is passive and time-based — the entry might still be served as stale for up to the full TTL window even after the underlying data has already changed, unless invalidation is also used." },
      { question: "Scenario: an e-commerce product's price is updated in the database, but the cache isn't explicitly invalidated. What could go wrong, and for how long?", answer: "Customers could keep seeing (and even purchasing at) the old cached price until the TTL naturally expires — potentially selling at a stale price for the entire TTL window, which is exactly why price-sensitive writes usually pair a short TTL with explicit invalidation on update, rather than relying on TTL alone." },
      { question: "What is \"cache coherence,\" and why is it harder in a multi-server or multi-region setup?", answer: "Cache coherence is the property that every cache holding a copy of the same data agrees with the others. It gets harder across many servers or regions because invalidating one cache doesn't automatically invalidate the others — you need a way (like a pub/sub invalidation broadcast) to propagate the change everywhere a copy might exist, and that propagation itself takes time." },
      { question: "How does application-level caching differ from HTTP/CDN caching in where each sits in the request path?", answer: "CDN/HTTP caching sits in front of the application entirely, often geographically close to the user, and can serve a response without the request ever reaching your servers. Application-level caching sits inside your own infrastructure, avoiding expensive internal work (like a database query) but still requires the request to reach your server first." },
      { question: "Why can caching mask an underlying performance problem rather than truly solving it?", answer: "If a query is slow because of a missing index or a poor data model, caching hides the symptom for cache hits but does nothing to fix the actual slowness — every cache miss (and every uncached path) still pays the full cost, and the problem resurfaces immediately if the cache is cleared, overwhelmed, or bypassed." },
      { question: "What is a lock-based (\"single-flight\") approach to preventing stampede, and how does it work mechanically?", answer: "When a key misses, the first request to notice acquires a lock (or marker) saying \"I'm already recomputing this,\" does the expensive work, then releases the lock and populates the cache. Other concurrent requests for the same key see the lock and either wait for that result or briefly serve a stale value, instead of every one of them independently redoing the same expensive work." },
      { question: "Scenario: a cache uses a 24-hour TTL and is also manually invalidated on writes. What can still go wrong if the invalidation has a race condition with a concurrent read?", answer: "If a read fetches from the (soon-to-be-stale) cache at nearly the same moment a write is invalidating and repopulating it, the read can win the race and re-cache the old value right after invalidation cleared it — leaving stale data cached again for up to the next full TTL window, since nothing else will trigger another invalidation until the next write." },
      { question: "Why is caching a poor fit for data with strict consistency requirements, like a bank balance mid-transaction — and what's an alternative if you must speed up reads there?", answer: "Any cache introduces a window where the cached value can lag the true value, which is unacceptable when a stale read could let someone act on money that isn't really there. A better alternative is optimizing the read path itself (better indexing, a dedicated fast replica kept synchronously consistent) rather than a cache that trades correctness for speed." },
      { question: "What's the relationship between cache hit ratio and total system load, and what does a \"good\" hit ratio depend on?", answer: "Each cache hit is one request the underlying system never has to handle, so a higher hit ratio directly reduces load on it — but what counts as \"good\" depends entirely on the workload's actual repeat-access pattern; a system where nearly every request is for unique data can't have a high hit ratio no matter how the cache is tuned." },
      { question: "Follow-up: your cache's hit ratio unexpectedly drops from 95% to 40%. What would you check?", answer: "Whether the cache was recently cleared or restarted (cold cache), whether TTLs were shortened or a deploy changed cache keys (so old and new requests no longer match existing entries), whether traffic patterns shifted toward less-repeated/unique requests, or whether the cache is evicting entries early due to memory pressure." },
      { question: "What is consistent hashing, and why does a distributed cache often use it when adding or removing nodes?", answer: "Consistent hashing maps both keys and cache nodes onto the same conceptual ring, so each key is owned by the nearest node going around it. Adding or removing a node only reshuffles the keys near that one node, instead of a naive `hash(key) % nodeCount` scheme, where changing the node count remaps almost every key at once and causes a mass cache miss." },
      { question: "Common misconception: \"the cache is just an optimization, it can't be a source of bugs.\" Why is this wrong?", answer: "A cache introduces its own state (what's cached, for how long, under what key) that can diverge from the source of truth — stale reads, a bad cache key causing one user's data to leak into another's response, or a stampede overwhelming the backend are all real, cache-caused bugs, not just missed performance." },
      { question: "Scenario: two concurrent requests both miss the cache for the same key at the same moment, with no stampede protection. Walk through what happens under cache-aside.", answer: "Both requests see a miss, both independently go to the underlying data source and do the full expensive work, and both then write essentially the same result back into the cache — the second write is redundant, but the real cost is that the underlying system took two (or, under heavier concurrency, many more) hits for what should have been one." },
    ],
    prerequisites: ["databases"],
    relatedTopics: ["databases", "load-balancing", "cdn"],
    keywords: ["cache", "cache hit", "cache miss", "invalidation", "TTL"],
  },
  {
    id: "database-replication",
    title: "Database Replication",
    level: "intermediate",
    description: "Keeping multiple copies of the same database in sync, so no single database is a single point of failure.",
    explanation: `
A single database server is a risk: if it goes down, the whole
application loses access to its data. **Replication** means continuously
copying data from one database (the **primary**) to one or more
additional databases (**replicas**), so there's always more than one copy
of the data available.

Replicas are also useful even when nothing has failed — since reads
(fetching data) usually vastly outnumber writes (changing data),
spreading reads across several replicas can handle far more traffic than
one database ever could alone.
    `.trim(),
    analogy:
      "It's like a company keeping backup copies of an important physical ledger in multiple offices, updated continuously as changes come in. If the main office burns down, another office already has an up-to-date copy — and in the meantime, staff in every office can read from their local copy instead of everyone calling the main office.",
    examples: [
      {
        title: "Reads from a replica, writes to the primary",
        code: `// Simplified pattern
async function getUser(id) {
  return replicaDb.query("SELECT * FROM users WHERE id = ?", [id]);
}

async function createUser(data) {
  return primaryDb.query("INSERT INTO users ...", [data]);
  // this change then gets replicated to replicaDb automatically
}`,
        walkthrough: [
          { code: "replicaDb.query(...) inside getUser", explanation: "Reads are sent to a replica, spreading read traffic away from the primary." },
          { code: "primaryDb.query(...) inside createUser", explanation: "Writes must go to the primary, since replicas are read-only copies." },
          { code: "this change then gets replicated", explanation: "The primary pushes the change out to every replica, usually within a short delay." },
        ],
      },
    ],
    howItWorks: `
The primary database records every change it makes (often in a log), and
continuously streams that log of changes to each replica, which applies
the same changes in the same order to stay in sync. Because this
streaming takes a small amount of time, a replica's data is typically
slightly behind the primary's — this delay is called **replication lag**.
    `.trim(),
    whyItExists: `
Replication protects against losing a single database entirely (a
replica can be promoted to take over), and lets read-heavy applications
scale far past what one database server could handle alone by spreading
reads across many replicas.
    `.trim(),
    whenToUse: `
Add replication once a single database is either a reliability risk you
can't accept, or a read bottleneck — most real production databases run
with at least one replica for exactly these reasons.
    `.trim(),
    whenNotToUse: `
For a small, early-stage application with low traffic and where brief
downtime is acceptable, a single database is simpler to operate and
reason about — replication adds real operational complexity (replication
lag, failover logic) that isn't worth it until the risk or the read load
actually justifies it.
    `.trim(),
    commonMistakes: [
      "Reading data immediately after writing it from a replica, and being surprised the just-written data isn't there yet — that's replication lag.",
      "Forgetting that replicas are (usually) read-only, and mistakenly sending writes to one.",
      "Assuming replication alone is a backup strategy — a mistaken delete on the primary replicates to every replica too, just as fast as a legitimate change.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, why spreading reads across replicas helps an application handle more traffic." },
      { difficulty: "Medium", prompt: "Describe what 'replication lag' is and a real scenario where it could cause a confusing bug." },
      { difficulty: "Hard", prompt: "Explain why replication is not a substitute for backups, even though both involve keeping copies of your data." },
    ],
    interviewQuestions: [
      { question: "What is database replication?", answer: "Continuously copying data from a primary database to one or more replica databases, so there's more than one up-to-date copy available." },
      { question: "Why do replicas help with read scalability?", answer: "Because read traffic can be spread across many replicas instead of all hitting a single database, while writes still go to the primary." },
      { question: "What is replication lag?", answer: "The small delay between a change being made on the primary and that same change appearing on a replica, since replication isn't instantaneous." },
      { question: "What's the difference between synchronous and asynchronous replication?", answer: "In synchronous replication, the primary waits for at least one replica to confirm it received the write before telling the client the write succeeded — guaranteeing that confirmed data exists in more than one place. In asynchronous replication, the primary confirms the write immediately and streams it to replicas afterward, which is faster but means a just-confirmed write could still exist only on the primary for a brief window." },
      { question: "What's the tradeoff of synchronous replication — why doesn't every system just always use it, since it avoids lag?", answer: "Every write now has to wait on a round trip to at least one replica before it's acknowledged, adding real latency to every write, and if that replica is slow or unreachable, writes can stall or fail entirely — trading raw write speed and availability for the stronger guarantee that a confirmed write already has a second copy." },
      { question: "What is \"semi-synchronous\" replication, and what problem does it try to solve?", answer: "The primary waits for acknowledgment from at least one replica (not all of them) before confirming a write, then replicates to the rest asynchronously — a middle ground that guarantees a confirmed write survives the primary failing alone, without paying the latency and availability cost of waiting on every replica." },
      { question: "Scenario: a primary crashes with writes that had been confirmed to the client but hadn't yet reached any replica. What happens to that data?", answer: "Under asynchronous replication, that data is simply lost — the client was told the write succeeded, but no replica has it, and there's nothing left to promote with it intact. This is precisely the failure mode synchronous or semi-synchronous replication is designed to prevent." },
      { question: "What is failover, and what's the difference between automatic and manual failover?", answer: "Failover is promoting a replica to take over as the new primary after the original primary fails. Manual failover requires a human to detect the failure and trigger the promotion — slower but deliberate; automatic failover has the system detect and promote on its own — faster recovery, but riskier if the failure detection itself is wrong (e.g. a network blip mistaken for a real outage)." },
      { question: "What is \"split-brain\" in a replicated system, and how does it happen?", answer: "Two nodes each believe they are the legitimate primary at the same time — often because a network partition made the old primary unreachable, a replica was promoted, and then the original primary came back online still thinking it's in charge. Both now accept writes independently, and those writes can conflict or be lost when the partition heals." },
      { question: "How do quorum-based writes help prevent split-brain or ambiguous leadership?", answer: "By requiring a write (or a leadership claim) to be acknowledged by a strict majority of nodes before it's considered valid, it becomes mathematically impossible for two disjoint groups to both reach a majority at the same time — so at most one side of a network partition can ever have a legitimate primary." },
      { question: "What is the \"read-after-write\" (read-your-writes) consistency problem in replicated systems, and how might a system solve it?", answer: "A user writes data, then immediately reads it back — but if that read is routed to a replica that hasn't caught up yet, they see their own change as if it never happened. Common fixes: route a user's reads to the primary for a short window after their own write, or route their reads consistently to the same replica they wrote through." },
      { question: "Scenario: a user updates their profile picture, then immediately reloads the page and sees the old one. What's likely happening, and how would you fix it?", answer: "The reload's read almost certainly hit a replica that hasn't yet received the update — classic replication lag. Fixing it means giving that user a read-your-writes guarantee, e.g. briefly reading from the primary right after their own write, rather than routing every read to whichever replica happens to be available." },
      { question: "What's the difference between single-leader, multi-leader, and leaderless replication topologies?", answer: "Single-leader: one primary accepts all writes, replicas are read-only — simple, no write conflicts, but the primary is a bottleneck and single point of failure for writes. Multi-leader: several nodes each accept writes and replicate to each other — better write availability across regions, but now concurrent writes to the same data on different leaders can conflict. Leaderless: any node can accept a write, and the system uses read/write quorums to stay consistent enough — no single leader bottleneck, but conflict resolution and consistency reasoning become the client/system's job." },
      { question: "What kind of conflict can arise in multi-leader replication that doesn't happen in single-leader?", answer: "Two different leaders can each accept a write to the same record at nearly the same time, each believing theirs is the only update — when the two leaders later replicate to each other, there are now two conflicting versions of the same record and no single, obviously correct order between them." },
      { question: "How is a write conflict typically resolved in a multi-leader or leaderless system?", answer: "Common strategies: last-write-wins (pick whichever write has the later timestamp, accepting that the earlier one is silently discarded), merging the conflicting versions with application-specific logic, or surfacing the conflict for a human or the application to resolve explicitly — there's no universally correct answer, only tradeoffs." },
      { question: "What is \"cascading replication,\" and why might you use it?", answer: "Instead of every replica pulling directly from the primary, some replicas replicate from other replicas instead, forming a chain or tree. This reduces the network and CPU load the primary must spend serving every replica directly, at the cost of extra replication hops (and so extra lag) for replicas further down the chain." },
      { question: "What is log-based (WAL-shipping) replication versus statement-based replication, and what's the tradeoff?", answer: "Log-based replication ships the primary's low-level write-ahead log entries (the exact bytes changed) to replicas, which apply them directly — deterministic and exact, but tied to the specific storage engine/version. Statement-based replication ships the actual SQL statements to re-execute on each replica — more portable and compact, but any statement that isn't perfectly deterministic can produce different results on each replica." },
      { question: "What could go wrong with statement-based replication that log-shipping avoids?", answer: "A statement using something non-deterministic — like `NOW()`, `RAND()`, or an auto-incrementing value computed independently — can execute at a slightly different moment or produce a different value on each replica, silently causing replicas to diverge from the primary even though every replica \"correctly\" ran the same statement." },
      { question: "How would you monitor replication lag in production, and what would you do if it grows unbounded?", answer: "Track lag as a first-class metric (seconds or bytes behind the primary) per replica, and alert past a threshold your application's tolerance allows. Unbounded, growing lag usually means a replica can't keep up with write volume — options include investigating what's slowing that specific replica down, temporarily routing more reads away from it, or adding capacity/replicas to spread the read load it was meant to absorb." },
      { question: "Scenario: replication lag balloons from 200ms to 30 seconds during a traffic spike. What's likely the cause, and what are your options?", answer: "Likely either a spike in write volume that the replica's apply process can't keep up with, or the replica itself being starved of resources (CPU/IO) by a surge of read queries also being routed to it. Options: temporarily reduce read traffic to that replica, scale it up, or investigate whether a batch job or write-heavy event is producing an unusual write burst." },
      { question: "What happens during promotion of a replica to primary, and what risk exists if the old primary comes back online afterward?", answer: "The chosen replica stops applying incoming replication and starts accepting writes directly as the new primary, and other replicas (and the application) are pointed at it. If the old primary comes back and isn't explicitly told it's been demoted, it may still think it's the primary and keep accepting writes independently — the split-brain scenario, with two divergent sets of writes that now need to be reconciled." },
      { question: "Why is automatic failover risky without careful design?", answer: "It has to correctly distinguish a genuine primary failure from a transient network blip — a false positive can trigger an unnecessary promotion and create split-brain once the 'failed' primary reappears — and it has to account for the fact that a promoted replica might not have every write the old primary had confirmed, risking silent data loss right at the moment of failover." },
      { question: "How does replication lag relate to the choice of consistency model?", answer: "Replication lag is the mechanical reason eventual consistency exists at all — an eventually-consistent system is essentially one that accepts replication lag as a normal, expected condition rather than something to eliminate. A system that instead requires strong consistency is, underneath, choosing to wait out (or avoid) that lag on the read path rather than tolerate it." },
      { question: "Scenario: an application always reads from a replica, but a user who just wrote data expects to see it immediately in the same session. What pattern fixes this without going fully synchronous everywhere?", answer: "Read-your-writes routing — send just that user's reads to the primary (or to a replica confirmed caught-up past their write) for a short window after their own write, while every other user's reads continue to go to any replica as normal. This targets the guarantee only where it's actually needed instead of paying its cost globally." },
      { question: "Why does adding more read replicas not help with write scalability?", answer: "Every replica still has to apply every single write to stay in sync — adding replicas multiplies how many places a write must eventually land, not how fast the primary can accept new writes. Only the primary (or a different scaling strategy like sharding) determines write throughput; replicas only help spread out reads." },
      { question: "Why can heavy read traffic against a replica itself worsen replication lag?", answer: "The replica has a fixed amount of CPU, memory, and IO capacity, shared between serving read queries and applying the incoming replication stream. If read load consumes enough of that capacity, the replica falls behind on applying replicated writes — meaning the very read-scaling replicas exist for can, under enough load, undermine how fresh their own data stays." },
      { question: "What's a realistic strategy for deciding how many replicas to run, and why isn't \"more is always better\"?", answer: "Size it to the read throughput you actually need to absorb beyond what the primary alone (or your caching layer) can handle, with some headroom for one replica being down. Every additional replica is another target for the primary to replicate to (more replication overhead) and another moving part to monitor and fail over — replicas you don't need trade operational complexity for capacity you'll never use." },
      { question: "Why can it be risky to promote a replica that was itself lagging at the time the primary failed?", answer: "That replica is missing whatever writes hadn't reached it yet, so promoting it doesn't just risk losing the writes that never reached any replica — it can also silently lose writes that other, more caught-up replicas already had, if the lagging one becomes the new source of truth for the whole system." },
      { question: "What is chain replication, briefly, and what property does it optimize for?", answer: "Replicas are arranged in an ordered chain; writes enter at the head and are passed down the chain, with a write only considered complete once it's reached the tail. It optimizes for strong consistency with clearly defined read/write rules (e.g. reads served from the tail always see fully-replicated data), at the cost of write latency scaling with the chain's length." },
      { question: "Scenario: you need strong, immediate consistency for one critical page (an order confirmation) right after a write, but want general read scaling everywhere else. How would you architect this with replication?", answer: "Route reads for that specific page (or that user's data, for a short window after their write) directly to the primary, while every other, less consistency-sensitive read continues to hit replicas as usual — applying the stronger guarantee narrowly, only where staleness would actually cause a problem." },
      { question: "Follow-up: what's the cost of routing reads to the primary for that one page?", answer: "It adds load to the primary that read scaling via replicas was specifically meant to avoid, and that page's read latency is now tied to the primary's load rather than benefiting from spreading across many replicas — an acceptable, narrow tradeoff only because it's limited to the one page that actually needs it." },
      { question: "Why is monitoring replication lag considered a first-class operational metric rather than an afterthought?", answer: "Lag directly determines how stale the data behind every read replica actually is at any given moment — without visibility into it, a team has no real way to know whether their eventual consistency guarantees are holding at milliseconds or have silently degraded to minutes, which changes what the rest of the system can safely assume about read freshness." },
    ],
    prerequisites: ["databases"],
    relatedTopics: ["databases", "sharding", "consistency-models"],
    keywords: ["replication", "primary", "replica", "replication lag", "read scaling"],
  },
  {
    id: "sharding",
    title: "Database Sharding",
    level: "intermediate",
    description: "Splitting one huge dataset across multiple databases, so no single database has to hold all of it.",
    explanation: `
Replication solves reliability and read scaling by copying the same data
multiple times. But eventually a dataset can grow so large that even
writes — or just the storage itself — outgrow what a single database
server can hold, no matter how good its hardware is. **Sharding** solves
this differently: instead of copying everything, it splits the data
itself into pieces (**shards**), each stored on a separate database,
based on some rule — commonly a **shard key**, like a user id.
    `.trim(),
    analogy:
      "It's like a massive filing system split across multiple filing cabinets by last name — A-M in one cabinet, N-Z in another. Neither cabinet holds everything, but together they hold it all, and each one only has to be big enough for its own share.",
    examples: [
      {
        title: "Routing to the right shard by user id",
        code: `function getShardForUser(userId) {
  const shardCount = 4;
  return userId % shardCount; // simple hash-based routing
}

async function getUser(userId) {
  const shard = getShardForUser(userId);
  return databases[shard].query("SELECT * FROM users WHERE id = ?", [userId]);
}`,
        walkthrough: [
          { code: "userId % shardCount", explanation: "A simple way to consistently map any user id to one of the available shards." },
          { code: "databases[shard].query(...)", explanation: "Only the one database holding this user's data is ever queried." },
        ],
      },
    ],
    howItWorks: `
A shard key determines which shard a given piece of data belongs to —
often computed with a hash function so data spreads out roughly evenly.
Every read or write for a given piece of data goes to exactly the one
shard responsible for it, so each individual database only ever holds
and processes a fraction of the total dataset.
    `.trim(),
    whyItExists: `
Some datasets are simply too large — in size or in write traffic — for
any single database server to handle, no matter how powerful. Sharding
is the way to scale a database horizontally (more machines) rather than
vertically (a bigger machine), the same underlying idea as scalability
generally.
    `.trim(),
    whenToUse: `
Reach for sharding once a dataset's size or write throughput has
genuinely outgrown what a single (even well-replicated) database can
handle — this is usually a late-stage scaling decision, not an early one.
    `.trim(),
    whenNotToUse: `
Don't shard prematurely — it adds real complexity (queries that need
data from multiple shards become much harder, and re-sharding later is
painful) for a scale most applications never actually reach. Exhaust
simpler options first: a bigger server, replication, and caching.
    `.trim(),
    commonMistakes: [
      "Choosing a shard key that leads to uneven distribution — e.g. sharding by signup date when most users signed up recently, overloading one shard.",
      "Writing queries that need to join or aggregate data across multiple shards, which sharding makes much more expensive or awkward.",
      "Sharding before it's actually necessary, taking on real operational complexity for a scale that hasn't been reached yet.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, the difference between sharding and replication." },
      { difficulty: "Medium", prompt: "Describe a bad shard key choice for a table of orders, and why it would cause uneven load." },
      { difficulty: "Hard", prompt: "Explain why a query that needs to count all rows across every shard is more expensive than the same query on an unsharded database." },
    ],
    interviewQuestions: [
      { question: "What is database sharding?", answer: "Splitting a dataset into pieces, each stored on a separate database, based on a shard key, so no single database has to hold all the data." },
      { question: "What's the difference between sharding and replication?", answer: "Replication copies the same data to multiple databases; sharding splits different pieces of data across multiple databases — they solve different scaling problems and are often used together." },
      { question: "What makes a good shard key?", answer: "One that distributes data (and load) roughly evenly across all shards, and that most queries can use directly to route to the right shard without needing data from others." },
      { question: "What's the difference between range-based and hash-based sharding?", answer: "Range-based sharding assigns contiguous ranges of the key (e.g. user ids 1–1000 on shard A, 1001–2000 on shard B) to each shard, which keeps related/sequential data together and makes range queries efficient. Hash-based sharding runs the key through a hash function to pick a shard, spreading data roughly evenly but scattering anything that was sequential or related across unrelated shards." },
      { question: "What's a downside of range-based sharding regarding hotspots — for example, sharding orders by order id or timestamp?", answer: "Whatever range currently holds the newest/most-active data (like the highest order ids, or today's date range) receives essentially all new writes and recent reads, while older ranges on other shards sit comparatively idle — defeating the purpose of spreading load evenly." },
      { question: "Scenario: a table is sharded by `userId % 4`. What happens when you need to add a 5th shard?", answer: "Almost every user's `userId % 5` now maps to a different shard than `userId % 4` did, so nearly the entire dataset needs to be physically moved to match the new formula — a naive modulo scheme makes adding or removing shards enormously disruptive rather than incremental." },
      { question: "What is consistent hashing, and how does it solve the resharding problem above?", answer: "Consistent hashing maps both shard keys and shard nodes onto positions on the same conceptual ring, and each key belongs to the nearest node going around it. Adding or removing a node only reassigns the keys nearest to that one node, rather than remapping almost the entire keyspace the way a plain modulo scheme does." },
      { question: "What is a \"hot shard,\" and give a concrete example of a shard key that would create one?", answer: "A hot shard is one that receives disproportionately more traffic or data than the others, becoming a bottleneck even though the system is nominally \"sharded.\" Example: sharding by `country` when 80% of your users are in a single country — that one shard carries most of the real load no matter how many shards exist." },
      { question: "What is \"directory-based\" sharding, and what's its tradeoff versus computed (hash or range) sharding?", answer: "A directory-based scheme keeps an explicit lookup table mapping each key (or key range) to its shard, rather than computing the mapping with a formula. It's more flexible — individual keys can be moved or rebalanced independently — but that lookup table itself becomes a critical, potentially bottlenecked piece of shared infrastructure that computed schemes avoid." },
      { question: "Why is choosing a shard key one of the hardest, most consequential decisions in a sharded system?", answer: "It simultaneously determines how evenly load spreads across shards, whether your most common queries can be routed to a single shard directly, and how expensive resharding will eventually be — get it wrong and you can face hot shards, constant cross-shard queries, or a painful migration, often all discovered only once real production traffic exposes it." },
      { question: "Why is it hard to change a shard key after a system is already in production?", answer: "Changing the shard key means recomputing which shard every single row belongs to and physically moving the data that changed ownership, all while the system keeps serving live traffic — effectively a full data migration under production load, not a configuration change." },
      { question: "What does \"resharding\" require operationally, and why is it considered risky and expensive?", answer: "It requires moving data between shards according to a new scheme, updating routing so queries find data at its new location, and doing all of this without losing writes or serving inconsistent reads mid-migration — usually via a careful dual-write or gradual-cutover process. It's risky because a mistake can corrupt or lose data across your entire dataset at once, not just one shard." },
      { question: "Why do cross-shard joins become expensive or impossible, and what's the usual workaround?", answer: "A join needs matching rows to be compared against each other, but if they live on different shards (different machines), the database can't just do it locally — it must fetch data from multiple shards and join it in the application or a coordinating layer instead. The usual workaround is denormalizing so related data needed together lives on the same shard, or avoiding true joins in favor of separate queries stitched together by the application." },
      { question: "What is a \"scatter-gather\" query, and why is it slower than a single-shard query?", answer: "A scatter-gather query is sent to every shard (or many shards) in parallel, and the results are collected and combined afterward. It's slower and more resource-intensive than a single-shard query because it multiplies the number of database round trips, and the overall response time is bounded by the slowest shard to respond, not the average." },
      { question: "Scenario: \"how many total orders were placed today\" across 8 shards — what does this actually require, and why is it more expensive than on an unsharded database?", answer: "It requires a scatter-gather query: asking all 8 shards for their own count and summing the results in the application (or a coordinator), rather than one query against one table. It's more expensive because it's now 8 separate queries plus a merge step, and it's only as fast as the slowest shard, whereas an unsharded database answers it with a single local count." },
      { question: "What is a distributed transaction across shards, and why is achieving atomicity harder there than within a single database?", answer: "It's a transaction whose writes span more than one shard (separate databases), needing all of them to either fully commit or fully roll back together. It's harder than a single-database transaction because each shard can independently succeed or fail, and there's no single, shared transaction log to atomically decide the outcome — the shards must explicitly coordinate to agree." },
      { question: "What is two-phase commit (2PC), briefly, and what's its main operational downside?", answer: "A coordinator asks every participating shard to \"prepare\" the transaction (confirming they're able to commit), and only once all of them agree does it tell everyone to actually commit. Its main downside is that if the coordinator crashes after some shards have prepared but before telling them to commit, those shards are left holding locks indefinitely, unable to safely commit or abort on their own." },
      { question: "Why do most sharded systems try to avoid needing cross-shard transactions altogether, rather than solve them with 2PC?", answer: "2PC adds real latency (extra coordination round trips on every transaction) and a real availability risk (a stuck coordinator can block shards indefinitely) — most systems find it far cheaper to design the shard key and data model so that transactions naturally stay within one shard, than to pay 2PC's cost on an ongoing basis." },
      { question: "What's the relationship between sharding and replication — are they mutually exclusive?", answer: "No — they're typically combined: each individual shard is usually also replicated on its own, so sharding solves the \"too much data/write volume for one machine\" problem while replication solves the \"this one machine (per shard) shouldn't be a single point of failure\" problem, independently of each other." },
      { question: "Scenario: a shard holding a very popular user's data on a social app becomes overloaded while other shards sit idle. What's this called, and how might you fix it without resharding everyone?", answer: "This is a hot shard (sometimes called a hotspot or \"celebrity problem\"). A targeted fix is isolating just that one heavily-loaded key onto its own dedicated shard (or splitting its data further, e.g. by content id instead of user id for that one user), rather than re-sharding the entire dataset to fix an issue caused by a small number of outlier keys." },
      { question: "Why can sharding by a monotonically increasing key, like an auto-incrementing id or a timestamp, create a hotspot?", answer: "New rows always have the newest (highest) value of that key, so under range-based sharding they all land in the same 'current' range on the same shard — every new write concentrates on whichever shard currently owns the highest range, no matter how many shards exist in total." },
      { question: "What's a composite shard key, and why might you use one instead of a single field?", answer: "A composite shard key combines more than one field (e.g. `tenantId` + `userId`) to compute shard placement. It's useful when a single field alone would distribute unevenly or wouldn't match your actual query patterns — combining fields can spread load more evenly while still letting related data (like everything for one tenant) stay groupable." },
      { question: "What is geo-sharding, and what benefit does it offer beyond raw scaling?", answer: "Geo-sharding assigns shards by geographic region, so a user's data lives on a shard physically close to them. Beyond distributing load, it reduces latency (data is closer to the user making requests) and can help satisfy data-residency requirements that require certain users' data to stay within a specific country or region." },
      { question: "Scenario: you need to move a single large tenant's data from an overloaded shard to a new, empty shard, without downtime. What does this actually require?", answer: "Typically: start dual-writing that tenant's new changes to both the old and new shard, backfill their existing historical data into the new shard, verify the copies match, then atomically flip routing for that tenant to the new shard and stop writing to the old one — all while the tenant keeps operating normally throughout." },
      { question: "What's the difference between a \"local\" secondary index and a \"global\" secondary index in a sharded system?", answer: "A local secondary index is built and maintained separately within each shard, covering only that shard's own data — cheap to maintain, but a query using it must still scatter-gather across every shard to get a complete answer. A global secondary index spans all shards' data in one structure, letting a query hit it directly without scatter-gather, but it now needs its own separate infrastructure and must stay in sync with writes happening across every shard." },
      { question: "Why is a global secondary index harder to maintain consistently than a local one?", answer: "Every write to any shard now also has to update this shared, cross-shard structure — which lives outside any single shard's transaction, so keeping the index and the underlying sharded data perfectly in sync (especially under concurrent writes and partial failures) is a genuinely harder distributed-consistency problem than a local index, which updates alongside its own shard's data in one place." },
      { question: "What happens to a unique constraint (like a unique email) when a table is sharded by a different key (like user id)?", answer: "The database can no longer enforce that uniqueness by itself, because two rows with the same email could land on two different shards that have no shared knowledge of each other's data. Enforcing it then requires either a separate global index/lookup service dedicated to checking uniqueness, or accepting weaker guarantees (like checking at write time and reconciling rare conflicts after the fact)." },
      { question: "Why is capacity planning for shard count inherently an estimate, and what happens if you pick too few or too many?", answer: "It depends on projected data growth and traffic patterns that are genuinely hard to predict precisely. Too few shards and you'll hit the same scaling wall sharding was meant to solve, sooner than planned; too many shards and you pay unnecessary operational complexity and cross-shard query overhead for capacity you don't yet need — many systems deliberately over-provision logical shards on fewer physical machines up front, so future growth means moving logical shards rather than re-sharding the keyspace." },
      { question: "What's a common mistake teams make by sharding too early?", answer: "Taking on the real complexity of cross-shard queries, harder transactions, and operational overhead before the dataset or write volume has actually outgrown a single well-tuned, replicated database — often when simpler options (better indexing, caching, a bigger server, read replicas) would have bought significant additional headroom first." },
      { question: "Scenario: `country` is used as a shard key, but 80% of your users are in one country. What goes wrong, and what would you do differently?", answer: "One shard ends up carrying roughly 80% of the load while the rest sit comparatively idle — sharding in name only, since the actual bottleneck (that one shard) still exists. A better key would distribute load more evenly, e.g. hashing on user id, or further sub-sharding within that one dominant country rather than treating the whole country as a single unit." },
      { question: "Follow-up: what if you must keep `country` as the shard key for compliance reasons (data residency), despite the imbalance — what other levers do you have?", answer: "You can shard further within that one oversized country (e.g. by a hash of user id, still keeping all its shards within the required region/jurisdiction), give that region proportionally more physical shards than smaller regions get, or add caching/read replicas within that region to absorb load the shard key itself can't rebalance away." },
      { question: "Why does adding an index need to be done identically across every shard, and what happens if that gets out of sync?", answer: "Because each shard is a physically separate database, an index created on one isn't automatically created on the others — if it's applied inconsistently, queries can behave correctly (and fast) on some shards but slowly, or with different query plans, on others, making performance unpredictable depending purely on which shard happens to serve a given request." },
      { question: "How does sharding interact with a database's referential integrity (foreign keys) across shards?", answer: "A foreign key constraint is normally enforced by the database checking that the referenced row exists in the same database — but if the referencing and referenced rows can end up on different shards, there's no single database that can enforce that check anymore, so referential integrity across shards typically has to be maintained by application logic instead of the database itself." },
    ],
    prerequisites: ["databases", "database-replication"],
    relatedTopics: ["database-replication", "consistent-hashing", "scalability"],
    keywords: ["sharding", "shard key", "partitioning", "horizontal scaling"],
  },
  {
    id: "consistency-models",
    title: "Consistency Models",
    level: "intermediate",
    description: "How quickly, and how strictly, every copy of your data has to agree with every other copy.",
    explanation: `
Once data is copied across multiple databases (via replication) or split
across regions, a natural question comes up: if you write a change to
one copy, when — and how reliably — will every other copy reflect that
change? Different systems answer this differently, and that answer is
called their **consistency model**.

**Strong consistency** means every read, everywhere, always sees the
latest write — as if there were really only one copy. **Eventual
consistency** relaxes that: a write might take a moment to reach every
copy, but given enough time (and no new writes), every copy will
eventually agree.
    `.trim(),
    analogy:
      "Strong consistency is like a single shared whiteboard everyone reads from directly — the moment someone writes on it, everyone sees the update immediately. Eventual consistency is like several people taking their own photo of the whiteboard and syncing it later — for a little while, some people's photos might be a version behind, but eventually everyone's photo matches.",
    examples: [
      {
        title: "The same read, two different consistency guarantees",
        code: `// Strong consistency: guaranteed to see the write immediately
await write(userId, { balance: 100 });
const balance1 = await strictRead(userId); // always 100

// Eventual consistency: might briefly see a stale value
await write(userId, { balance: 100 });
const balance2 = await eventualRead(userId); // could still be the old value, briefly`,
        walkthrough: [
          { code: "await write(userId, ...)", explanation: "A change is made to one copy of the data." },
          { code: "strictRead(userId)", explanation: "Guaranteed to reflect that write immediately, no matter which copy answers." },
          { code: "eventualRead(userId)", explanation: "Might be answered by a copy that hasn't received the update yet." },
        ],
      },
    ],
    howItWorks: `
Strong consistency is usually achieved by routing every read through a
single source of truth (or requiring multiple copies to confirm a write
before it's considered done), which costs latency and availability
during network problems. Eventual consistency instead lets a write
settle in on each copy independently, at its own pace, which is faster
and more resilient to failures, at the cost of a short window where
reads can return stale data.
    `.trim(),
    whyItExists: `
There's a real, unavoidable tradeoff between how fast/reliable a system
stays under failures and how strictly up-to-date every read is
guaranteed to be — different applications land in different places on
that tradeoff depending on how much staleness they can tolerate.
    `.trim(),
    whenToUse: `
Choose strong consistency for data where staleness would cause real
harm — an account balance being checked before a withdrawal, an
inventory count during checkout. Choose eventual consistency for data
where a brief delay doesn't matter much — a like count, a follower
count, a search index.
    `.trim(),
    whenNotToUse: `
Don't default to strong consistency everywhere out of caution — it costs
real latency and availability, and most data in most applications
(activity feeds, view counts, recommendations) doesn't actually need it.
    `.trim(),
    commonMistakes: [
      "Assuming all databases are strongly consistent by default — many popular distributed databases default to eventual consistency for performance.",
      "Using eventually-consistent reads for something that genuinely needs strong consistency, like a payment balance.",
      "Treating 'eventual' as if it means 'never' — in a healthy system, eventual consistency typically resolves in milliseconds to seconds, not indefinitely.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Give one example of data where eventual consistency would be perfectly fine, and one where it wouldn't." },
      { difficulty: "Medium", prompt: "Explain, in your own words, why strong consistency tends to cost more latency than eventual consistency." },
      { difficulty: "Hard", prompt: "Describe a real bug that could occur if a signup flow read a user's data eventually-consistently right after writing it." },
    ],
    interviewQuestions: [
      { question: "What's the difference between strong and eventual consistency?", answer: "Strong consistency guarantees every read reflects the latest write immediately; eventual consistency allows a brief delay before all copies agree, trading immediacy for speed and resilience." },
      { question: "Why would a system choose eventual consistency over strong consistency?", answer: "Eventually consistent systems are typically faster and more available, especially during network issues, since they don't need every copy to confirm before a write is considered complete." },
      { question: "Give an example where eventual consistency would be an acceptable trade-off.", answer: "A social media like count or view count — being off by a few for a moment causes no real harm." },
      { question: "What is linearizability, and how is it a stronger guarantee than what people often casually call \"strong consistency\"?", answer: "Linearizability guarantees that every operation appears to take effect atomically at some single instant between when it was called and when it returned, and that all operations across all clients agree on one consistent global ordering — as if there were truly only one copy of the data, updated one operation at a time. It's the strictest, most precisely defined form of strong consistency, not just \"reads see recent writes.\"" },
      { question: "What's the difference between strong consistency and causal consistency?", answer: "Strong consistency requires every operation to be seen in the same real-time order by everyone. Causal consistency only requires that operations which are causally related (one happened because of, or after seeing, another) are seen in that same order by everyone — but operations with no causal relationship to each other can be seen in different orders by different observers, which is cheaper to guarantee." },
      { question: "Give a concrete scenario where causal consistency matters, but plain eventual consistency alone would produce a confusing result.", answer: "A comment reply gets replicated to one reader before the original comment it's replying to does — that reader sees a reply to a comment that, as far as they can tell, doesn't exist yet. Causal consistency prevents this by guaranteeing that if writing the reply causally depended on having seen the original comment, no replica will ever show the reply without also showing the comment it depends on." },
      { question: "What is \"monotonic reads\" as a consistency guarantee, and what bug does it prevent?", answer: "It guarantees that once a client has seen a particular value (or a later one), it will never subsequently see an older value on a later read. It prevents the confusing experience of refreshing a page and having something you'd already seen appear to disappear or revert, because a later read happened to hit a more-lagged replica than an earlier one did." },
      { question: "What is \"read-your-writes\" consistency, and how is it distinct from monotonic reads?", answer: "Read-your-writes specifically guarantees that a client will always see its own prior writes on subsequent reads. Monotonic reads is broader and unrelated to authorship — it guarantees a client never sees time move backward on reads regardless of who made the write, including writes made by other users." },
      { question: "What is \"monotonic writes\" consistency?", answer: "It guarantees that writes from the same client are applied in the order that client issued them, everywhere — so a system never applies a client's second write before its first, which could otherwise leave data in an order the client never intended (e.g. an 'undo' applying before the action it was meant to undo)." },
      { question: "What does quorum-based consistency (R + W > N) mean, and why does that formula guarantee an overlap?", answer: "N is the number of replicas holding a piece of data, W is how many replicas must acknowledge a write for it to succeed, and R is how many replicas a read must consult. If R + W > N, any set of W replicas that accepted a write and any set of R replicas consulted by a read must share at least one replica in common — guaranteeing every read consults at least one replica that has the latest write." },
      { question: "Scenario: N=3 replicas, W=2, R=1. Is this configuration guaranteed to always read the latest write?", answer: "No — R + W = 3, which is not greater than N (3), so there's no guaranteed overlap. A read could consult the one replica that wasn't part of the two that accepted the latest write, returning a stale value." },
      { question: "Scenario: N=3, W=2, R=2. Is this configuration now guaranteed to read the latest write?", answer: "Yes — R + W = 4 > N (3), so any 2 replicas consulted by a read must overlap with at least one of the 2 replicas that accepted the write, meaning the read is guaranteed to see it (or a newer value), at the cost of needing to contact 2 replicas per read instead of 1." },
      { question: "What's the difference between \"sequential consistency\" and \"linearizability\"?", answer: "Both require all clients to agree on one single global ordering of operations. Linearizability additionally requires that ordering to respect real, wall-clock time — if operation A completed before operation B started, A must come first in the agreed order. Sequential consistency drops that real-time requirement: any single global ordering is acceptable as long as everyone agrees on the same one, even if it doesn't match the actual real-time sequence of events." },
      { question: "What is PACELC, and how does it extend the CAP theorem's tradeoff?", answer: "PACELC observes that CAP only describes the tradeoff during a network Partition (Availability vs Consistency), but even with no partition at all (Else), a system still has to trade off Latency vs Consistency — waiting for more replicas to agree always costs some latency. PACELC frames consistency as a tradeoff a system faces essentially all the time, not just during failures." },
      { question: "Explain CAP theorem precisely — what does it actually claim?", answer: "For a distributed system, during a network partition (some nodes can't communicate with others), you must choose between Consistency (every node sees the same, latest data) and Availability (every request gets a response) — you cannot guarantee both at that moment. It says nothing about normal, non-partitioned operation, where both can often be provided together." },
      { question: "Common misconception: \"CAP theorem means a system is either CP or AP, all the time.\" Why is this an oversimplification?", answer: "CAP's tradeoff only actually applies during a partition — outside of one, a well-designed system can be both consistent and available. Many real systems are also tunable per-operation (different requests can ask for different consistency guarantees) rather than being permanently locked into one label, and CAP itself doesn't account for the latency-vs-consistency tradeoff that exists even without a partition (that's what PACELC adds)." },
      { question: "What is a vector clock, and what problem does it solve in a system with no single global clock?", answer: "A vector clock is a small set of per-replica counters attached to each write, incremented by whichever replica made it. Comparing two vector clocks lets the system determine whether one write causally happened-before another, happened-after, or neither (a true conflict) — solving the problem of ordering events across machines that don't share a perfectly synchronized clock." },
      { question: "What is a CRDT (Conflict-free Replicated Data Type), and how does it let replicas merge conflicting writes without coordination?", answer: "A CRDT is a data structure specifically designed so that merging any two independently-updated copies always produces the same, well-defined result, regardless of the order the updates are merged in — for example, a counter that only ever increments can be merged by simply summing each replica's increments. This lets replicas accept writes independently and merge later with no need to coordinate or lock during the write itself." },
      { question: "What is \"read repair\" in a leaderless replicated system, and how does it help move toward consistency?", answer: "When a read consults multiple replicas and notices they disagree, it detects which replica(s) have a stale value and proactively writes the newer value back to them as part of handling that same read. Over time, this quietly nudges lagging replicas back in sync without needing a separate, dedicated repair process." },
      { question: "What is \"tunable consistency\" (as in systems like Cassandra), and why might different requests in the same app choose different levels?", answer: "It lets each individual read or write specify its own required consistency level (e.g. how many replicas must respond) rather than the whole system being locked to one setting. An app might use a strong, higher-quorum read for a payment balance, while using a fast, single-replica read for a low-stakes view counter — matching the guarantee's cost to how much that specific data actually needs it." },
      { question: "Scenario: a shopping cart uses eventual consistency. A user adds an item on their phone, then immediately opens the site on their laptop and doesn't see it. What guarantee is missing, and what would fix this specific flow?", answer: "This is a read-your-writes violation — the laptop's read hit a replica that hadn't yet received the phone's write. Fixing it for this user specifically means routing their reads to a replica known to be caught up on their own writes (or to the primary) for a short window, rather than any arbitrary replica." },
      { question: "Scenario: an inventory count uses eventual consistency across regions. Two customers in different regions both see \"1 in stock\" and both complete checkout. What went wrong, and how would you prevent overselling?", answer: "Each region's replica hadn't yet seen the other's near-simultaneous decrement, so both reads (correctly, for their own stale view) saw availability that no longer existed by the time both writes landed — a classic consequence of accepting concurrent writes under eventual consistency. Preventing it requires either a strongly consistent check specifically for the decrement-and-reserve step (routing it through a single source of truth) or accepting the possibility and handling it after the fact (detecting oversells and resolving them, e.g. refunding or backordering one of the two orders)." },
      { question: "Why is \"eventually consistent\" not the same as \"eventually correct\"? What happens if writes never stop?", answer: "\"Eventually consistent\" only promises that if writes to a piece of data stopped, every replica would converge to the same value given enough time — it says nothing about what that value is being correct in a business sense, and if writes keep arriving continuously, replicas may never actually reach a moment of full agreement, only ever chasing a moving target." },
      { question: "What does \"consistency\" mean specifically in the CAP theorem, and how does it differ from the \"C\" in ACID?", answer: "CAP's consistency specifically means linearizability — every read reflects the most recent write, as if there were one copy. ACID's consistency means something different: that a transaction only ever moves the database from one valid state (satisfying its constraints and invariants) to another valid one — it's about application-level correctness rules, not about how fast replicas agree with each other." },
      { question: "Mechanically, why can a strongly consistent system become unavailable during a network partition?", answer: "Guaranteeing every read sees the latest write typically requires a quorum of replicas to be reachable and in agreement (per the R+W>N logic). If a partition splits the replicas so no side has a majority, the system can't safely confirm a read or write meets that guarantee — so, rather than risk returning stale or conflicting data, it refuses to serve the request at all until the partition heals." },
      { question: "What's the practical latency cost difference between reading from a single node versus reading with a quorum?", answer: "A single-node read is one network round trip and returns as soon as that one node answers. A quorum read must contact multiple replicas and wait for enough of them to respond (and often compare their answers), so its latency is bounded by the slowest of those replicas rather than just one — meaningfully slower, especially if replicas span regions with real network distance between them." },
      { question: "What is causal consistency's relationship to \"happens-before\" ordering?", answer: "Causal consistency is defined directly in terms of the happens-before relation: if operation A happens-before operation B (B read a value A wrote, or they occurred in sequence on the same client), every replica must show A before B. Operations with no happens-before relationship to each other are unconstrained and can be seen in different orders on different replicas without violating the guarantee." },
      { question: "Scenario: a chat app shows a reply before the message it was replying to, on one user's screen. What consistency guarantee failed?", answer: "Causal consistency — the reply causally depends on the original message (it couldn't have been written without it existing first), so any consistency model weaker than causal (like plain eventual consistency with no causal tracking) can let a replica apply or show them out of that dependent order." },
      { question: "Why do many real-world systems mix consistency levels rather than picking one globally?", answer: "Different pieces of data carry very different costs for being briefly stale — a payment balance being wrong is a real, damaging bug, while a view count being off by a few for a second is invisible to anyone. Applying the same, expensive strong-consistency guarantee everywhere wastes latency and availability on data that never needed it; mixing levels spends that cost only where staleness would actually cause harm." },
      { question: "What's a \"stale read,\" precisely, and is it always a bug?", answer: "A stale read is a read that returns a value older than the most recently completed write, because it was served by a replica (or cache) that hadn't yet applied that write. Whether it's a bug depends entirely on the data and use case — it's expected and harmless for an eventually-consistent view counter, but a serious correctness bug for something like an account balance used to authorize a withdrawal." },
      { question: "Follow-up: give one scenario where a stale read is completely fine, and one where it's a serious bug.", answer: "Fine: a follower count on a profile page being a few seconds behind causes no real harm to anyone. Serious: a fraud-detection check reading a stale \"account not yet flagged\" status right after it should have been flagged, letting a fraudulent transaction through it was specifically meant to block." },
      { question: "What does it mean for a consistency model to provide guarantees \"per session\" versus \"global\" guarantees?", answer: "A per-session guarantee (like read-your-writes or monotonic reads) only promises consistency from the point of view of one particular client's own sequence of operations — other clients might still observe a different order relative to each other. A global guarantee (like linearizability) promises one single, agreed ordering that holds for every client simultaneously, which is strictly harder and more expensive to provide." },
      { question: "Why is achieving strict linearizability across multiple geographically distant data centers particularly costly, and what do most geo-distributed systems do instead?", answer: "Linearizability effectively requires coordinating with distant replicas on every operation, and the speed of light puts a real floor under how fast that round trip can be across, say, different continents — often tens to low hundreds of milliseconds, added to every operation. Most geo-distributed systems instead accept a weaker model (causal consistency, or region-local strong consistency with asynchronous cross-region replication) for the vast majority of operations, reserving true global linearizability for the specific few operations that truly can't tolerate anything less." },
    ],
    prerequisites: ["database-replication"],
    relatedTopics: ["cap-theorem", "database-replication", "sharding"],
    keywords: ["consistency", "strong consistency", "eventual consistency", "staleness"],
  },
  {
    id: "rate-limiting",
    title: "Rate Limiting",
    level: "intermediate",
    description: "Deliberately capping how many requests a client can make in a given time window.",
    explanation: `
Without any limit, a single client — whether malicious, buggy, or just
very active — could send an overwhelming number of requests and degrade
the service for everyone else. **Rate limiting** is a deliberate rule
that caps how many requests a given client (by user, API key, or IP
address) can make within a certain time window, rejecting or delaying
requests beyond that.
    `.trim(),
    analogy:
      "It's like a nightclub bouncer who only lets in a certain number of people per minute, no matter how many are waiting outside — not because the club dislikes visitors, but because letting everyone in at once would be a disaster for everyone already inside.",
    examples: [
      {
        title: "A simple fixed-window rate limiter",
        code: `const requestCounts = new Map(); // key: userId, value: { count, windowStart }

function isAllowed(userId, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const entry = requestCounts.get(userId);

  if (!entry || now - entry.windowStart > windowMs) {
    requestCounts.set(userId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= limit) return false; // over the limit
  entry.count++;
  return true;
}`,
        walkthrough: [
          { code: "!entry || now - entry.windowStart > windowMs", explanation: "Starts a fresh counting window if none exists yet, or the previous window has expired." },
          { code: "entry.count >= limit", explanation: "Rejects the request if this window's limit has already been reached." },
          { code: "entry.count++", explanation: "Otherwise, counts this request and allows it through." },
        ],
      },
    ],
    howItWorks: `
Each incoming request is checked against a counter tied to that specific
client, tracked over a time window (fixed windows, like "per minute", or
smoother sliding windows). If the client is under their limit, the
counter increments and the request proceeds; if they're at or over it,
the request is rejected — commonly with an HTTP 429 "Too Many Requests"
response — until the window resets.
    `.trim(),
    whyItExists: `
Rate limiting protects a service from being overwhelmed — whether by a
genuine traffic spike, a buggy client stuck in a retry loop, or a
deliberate abuse attempt — and ensures one client's excessive usage
can't degrade the experience for everyone else.
    `.trim(),
    whenToUse: `
Add rate limiting to any public-facing API, especially ones with
expensive operations (search, sending emails, calling a paid third-party
service) or ones that could be abused (login attempts, password resets).
    `.trim(),
    whenNotToUse: `
Don't rate-limit so aggressively that legitimate, normal usage gets
rejected — limits should be set based on real usage patterns, and it's
often worth returning clear information (like how long until the limit
resets) so well-behaved clients can adapt.
    `.trim(),
    commonMistakes: [
      "Setting limits so low that normal, legitimate usage gets rejected, frustrating real users.",
      "Rate limiting only by IP address, which breaks down for many users sharing one IP (like an office) and is easy to evade with many IPs.",
      "Forgetting to tell the client why their request was rejected and when they can try again, making the limit feel arbitrary and confusing.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, why an API without any rate limit is vulnerable to a single misbehaving client." },
      { difficulty: "Medium", prompt: "Describe the difference between rate-limiting by IP address versus by an authenticated user id, and a downside of each." },
      { difficulty: "Hard", prompt: "Explain why a 'fixed window' rate limiter can allow twice the intended limit right at the boundary between two windows, and how a 'sliding window' avoids that." },
    ],
    interviewQuestions: [
      { question: "What problem does rate limiting solve?", answer: "It prevents a single client from overwhelming a service with too many requests, whether from abuse, bugs, or unexpectedly high legitimate usage." },
      { question: "What HTTP status code typically indicates a rate limit was hit?", answer: "429 Too Many Requests." },
      { question: "What's a weakness of rate limiting purely by IP address?", answer: "Multiple legitimate users can share one IP address (like an office network), and it's relatively easy for an attacker to spread requests across many IPs to evade the limit." },
      { question: "What is the token bucket algorithm, mechanically?", answer: "A bucket holds tokens, refilled at a steady rate up to some maximum capacity; each request consumes one token to proceed, and is rejected (or queued) if the bucket is empty. It naturally allows short bursts up to the bucket's capacity while still enforcing a steady average rate over time via the refill rate." },
      { question: "What does the token bucket's capacity (burst size) control, separately from its refill rate?", answer: "The refill rate controls the long-run average allowed rate; the bucket's capacity controls how large a burst can be spent all at once before the client has to wait for tokens to trickle back in — two independent knobs, one for sustained rate and one for burst tolerance." },
      { question: "What is the leaky bucket algorithm, and how does it differ from token bucket in the traffic pattern it produces?", answer: "Requests enter a queue (the bucket) and are processed (leaked out) at a strictly constant rate, regardless of how bursty the incoming requests were. Unlike token bucket, which lets a burst through immediately up to its capacity, leaky bucket smooths bursts into a steady, constant output rate — good for protecting a downstream system that needs an even load, not just an average one." },
      { question: "Scenario: an API should allow occasional bursts but enforce a steady average rate. Token bucket or leaky bucket, and why?", answer: "Token bucket — its whole design is allowing accumulated capacity to be spent in a burst while still capping the long-run average via the refill rate. Leaky bucket would instead flatten that same burst into a steady trickle, which is the wrong fit if genuine bursts are supposed to be allowed through immediately." },
      { question: "What's the fixed window counter's boundary problem? Walk through it with a concrete example.", answer: "With a 100-requests-per-minute fixed window, a client could send 100 requests in the last second of one window (say, 11:00:59) and another 100 in the first second of the next window (11:01:00) — 200 requests in about 2 seconds, even though each individual window's limit was technically respected. The fixed window doesn't look at any sliding one-minute span, only at aligned clock-minute buckets." },
      { question: "What is the sliding window log algorithm, and why is it the most accurate but least memory-efficient approach?", answer: "It stores a timestamp for every individual request within the current window, and on each new request, counts how many stored timestamps fall within the last window-length of time, discarding older ones. It's precisely accurate because it looks at a true rolling window rather than aligned buckets, but it needs to store a timestamp per request rather than a single counter, which gets memory-expensive at high request volume." },
      { question: "What is the sliding window counter, and how does it approximate the log algorithm cheaply?", answer: "It keeps just two fixed-window counters (the current window and the previous one), and estimates the count within the true sliding window by weighting the previous window's count proportionally to how much of it still overlaps the sliding window — approximating the log's accuracy using only two numbers instead of a full list of timestamps." },
      { question: "Walk through the sliding window counter's formula with a concrete example.", answer: "If we're 25% into the current 1-minute window (15 seconds in), the estimate is: `current window count + previous window count × (1 − 0.25)`, i.e. weighting 75% of the previous window's requests as if they still count toward the present sliding view — a close approximation of the true rolling count without storing every timestamp." },
      { question: "Why is distributed rate limiting harder than single-server rate limiting?", answer: "A single server can just keep a counter in its own memory, but if traffic for the same client is spread across many servers, each server's local counter only sees a fraction of that client's total requests — none of them individually knows the true total, so the limit can be silently multiplied by however many servers happen to handle that client's traffic." },
      { question: "Scenario: an API is rate-limited per-user, but requests are load-balanced across 10 stateless app servers, each keeping counts in local memory. What goes wrong?", answer: "A user's requests get spread roughly evenly across the 10 servers, and each server only counts what it personally saw — so a user could effectively make up to 10× the intended limit by having their requests spread across all 10 servers, none of which individually appears to exceed the per-server share of the limit." },
      { question: "What's the standard fix for distributed rate limiting?", answer: "Move the counter out of any individual server's local memory and into a single shared, fast store (commonly Redis) that every server checks and updates — so the count reflects a client's true total across every server, not just whichever one happened to handle a given request." },
      { question: "Why must the increment-and-check operation in a shared Redis-based rate limiter be atomic, and what race condition happens if it's not?", answer: "If two servers both read the current count, both see it's under the limit, and both then separately increment it, both requests get allowed even though the combined result now exceeds the limit — a classic check-then-act race condition. Making the read-check-increment one atomic operation closes that window entirely." },
      { question: "What Redis feature is commonly used to make this atomic?", answer: "Either Redis's `INCR` (which atomically increments and returns the new value in one operation, so the check can be safely done on the returned value) paired with `EXPIRE` for the window, or a small Lua script executed atomically inside Redis so the whole check-and-increment logic runs as a single indivisible step." },
      { question: "What impact does clock skew have on distributed rate limiting across multiple servers or regions?", answer: "If different servers disagree slightly on the current time, window boundaries can shift depending on which server's clock is used, letting a client's requests straddle what one server considers a fresh window while another still considers it the old one — effectively reopening a small amount of extra allowance. Using a single shared store's own clock (rather than each server's local clock) for window calculations avoids this." },
      { question: "What's the difference between rate limiting and backpressure/load shedding?", answer: "Rate limiting caps how much a specific client is allowed to send, based on a policy decided in advance, independent of the server's current load. Backpressure/load shedding is the server reactively slowing down or rejecting requests based on its own real-time capacity, regardless of which client they're from — a rate limit can still let requests through that overwhelm an already-struggling server if it doesn't happen to reflect actual current load." },
      { question: "Why might you rate limit by API key or user id rather than IP address for an authenticated API, and when would you still also want IP-based limiting?", answer: "An authenticated identity (API key/user id) is stable and specific to one actual client, avoiding the false sharing/evasion problems IP-based limiting has. You'd still also want IP-based limiting in front of authentication itself — for endpoints like login, where there's no user id yet to key off of, and you need to limit unauthenticated abuse before identity is even established." },
      { question: "What should a 429 response ideally include, and why does that matter for well-behaved clients?", answer: "It should tell the client how long to wait before retrying (commonly via a `Retry-After` header) and ideally how much of their quota remains and when it resets. Without this, a well-behaved client has no principled way to know when to retry, and may either hammer the API immediately (making things worse) or back off far more conservatively than necessary." },
      { question: "What is the `Retry-After` header, and how should a client be expected to use it?", answer: "It tells the client, in seconds or as a timestamp, when it's safe to retry the request. A well-behaved client should wait at least that long before retrying rather than retrying immediately or on its own arbitrary schedule, which helps the client recover gracefully without adding to the very overload that triggered the limit." },
      { question: "Scenario: a legitimate client (e.g. a batch job clearing a backlog) gets rate-limited during a real, valid traffic spike. What's a better strategy than a flat hard reject?", answer: "Consider a burst-tolerant algorithm (token bucket) that allows a temporary spike above the steady-state rate, or a separate, higher-throughput tier/queue for known bulk/batch clients — rather than uniformly capping every client at the same rate designed around typical interactive usage, which unfairly penalizes a legitimate, different traffic pattern." },
      { question: "What is a \"leaky bucket as a queue\" implementation, and how does it differ from leaky bucket purely as a rate limiter?", answer: "As a rate limiter, excess requests beyond the bucket's draining rate are simply rejected. Implemented as a queue instead, excess requests are held and processed later at the steady drain rate rather than dropped outright — trading immediate rejection for added latency, useful when a request shouldn't be lost, only delayed." },
      { question: "Why doesn't rate limiting alone fully protect against a DDoS attack distributed across many different IPs or accounts?", answer: "Rate limiting caps each individual client's allowed rate, but if an attack comes from thousands of different IPs or fake accounts, each one can stay comfortably under its own individual limit while the combined total traffic still overwhelms the service — rate limiting bounds per-client abuse, not aggregate volume from many coordinated sources, which needs additional defenses (traffic filtering, anomaly detection, a CDN/DDoS mitigation layer)." },
      { question: "What layers of a system might apply rate limiting, and why might you want it at more than one?", answer: "It can be applied at the client SDK (self-throttling before even sending a request), an API gateway (a single, centralized enforcement point for external traffic), and individual services (protecting a specific expensive operation regardless of how a request arrived). Layering it catches different failure modes — a well-behaved client that self-throttles reduces unnecessary traffic entirely, while gateway and service-level limits protect against clients that don't." },
      { question: "Scenario: login attempts are rate-limited per account to prevent brute-force password guessing. What's a subtlety if you naively lock the account out after N failed attempts?", answer: "An attacker who knows this can deliberately trigger failed logins on a victim's account to lock the real user out of their own account — a denial-of-service against the legitimate user via the very protection meant to help them. Mitigations include increasing delay rather than a hard lockout, rate-limiting by source (IP/device) in addition to account, or requiring an additional verification step instead of fully denying login." },
      { question: "What's the tradeoff between rate limiting enforced on the server versus asking the client to self-throttle?", answer: "Server-side enforcement is authoritative and can't be bypassed by a misbehaving or buggy client, but every rejected request still costs the server some resources to receive and reject. Client-side self-throttling avoids sending excess requests at all, saving that cost, but can't be trusted alone since any client can simply ignore it — in practice, server-side enforcement is the actual guarantee, and client self-throttling is an optimization on top of it." },
      { question: "Why is choosing the rate-limiting window size (1 second vs 1 minute vs 1 hour) a real design decision, not an arbitrary one?", answer: "A shorter window reacts to abuse quickly but allows less flexibility for legitimate bursty usage within it; a longer window smooths out legitimate short bursts but lets a genuinely abusive client sustain a higher instantaneous rate for longer before the limit catches up to them — the right window size depends on what burst pattern is normal for real usage versus what pattern would actually indicate abuse." },
      { question: "What happens to a token bucket's burst allowance if a client is idle for a long period and then suddenly sends a large batch?", answer: "Tokens accumulate up to the bucket's maximum capacity while the client is idle, so the client can then spend that entire accumulated capacity as one large burst the instant it starts sending again — by design, but worth being deliberate about, since a very large bucket capacity paired with long idle periods can allow bursts far larger than the steady-state rate would suggest." },
      { question: "Common misconception: \"rate limiting is only about stopping malicious abuse.\" Why is this incomplete?", answer: "Rate limiting just as often protects a service from its own legitimate clients — a buggy retry loop, a misconfigured cron job, or simply more real, valid usage than a downstream dependency (like a third-party API with its own limits) can handle. Framing it purely as an anti-abuse tool misses that it's also basic operational self-protection against ordinary bugs and success." },
      { question: "Scenario: an internal microservice calls another at a high, bursty rate that occasionally exceeds what the downstream service can handle, causing cascading failures. Is client-imposed rate limiting or something else the better fix?", answer: "Client-side self-throttling helps but relies on every caller cooperating and knowing the right limit in advance. A more robust fix is usually the downstream service itself enforcing its own rate limit or applying backpressure based on its real, current capacity — combined with the caller using a circuit breaker so it stops hammering a struggling downstream service and fails fast instead of piling up cascading retries." },
      { question: "Follow-up: how does rate limiting relate to a circuit breaker — are they solving the same problem?", answer: "Related, but different: rate limiting proactively caps how much traffic is sent based on a policy, regardless of whether the downstream is currently healthy. A circuit breaker reactively detects that a downstream is already failing and stops sending it traffic until it recovers — rate limiting prevents overload from happening, a circuit breaker responds once something is already going wrong." },
      { question: "Why can a sliding window log's memory usage become an operational concern at high request volume, and what does the sliding window counter trade for cheaper memory?", answer: "The log has to retain one timestamp per request within the entire current window, so at very high request rates (e.g. thousands of requests per second per key), that's a genuinely large amount of per-client memory. The sliding window counter trades exactness for just two integers per client (current and previous window counts), accepting a close approximation of the true rolling count instead of a fully precise one, in exchange for dramatically lower memory use." },
    ],
    prerequisites: ["rest-apis"],
    relatedTopics: ["api-gateway", "load-balancing"],
    keywords: ["rate limiting", "throttling", "429", "abuse prevention"],
  },
  {
    id: "microservices-vs-monolith",
    title: "Microservices vs Monolith",
    level: "intermediate",
    description: "Two different ways to structure an application's codebase and deployment — as one unit, or as many independent pieces.",
    explanation: `
Early in a project, it's simplest to build everything — the user system,
the payments, the notifications — as one single application, deployed
and scaled as a single unit. This is a **monolith**. As a system and its
team grow, some organizations split that single application into many
smaller, independently deployable services, each responsible for one
part of the system, communicating over the network — this is a
**microservices** architecture.

Neither is universally correct: a monolith is simpler to build, test,
and deploy; microservices offer independent scaling and deployment, at
the cost of real operational complexity.
    `.trim(),
    analogy:
      "A monolith is like one large, all-purpose kitchen where every dish is prepared by the same staff in the same space. Microservices are like a food court, where each stall specializes in one thing and operates independently — more flexible and easier to scale one popular stall without touching the others, but now you need to coordinate delivery and communication between many separate operations instead of one.",
    examples: [
      {
        title: "The same feature, two different structures",
        code: `// Monolith: one codebase, one deployment
function handleOrder(order) {
  chargePayment(order);   // same process
  updateInventory(order); // same process
  sendConfirmationEmail(order); // same process
}

// Microservices: separate services, communicating over the network
async function handleOrderMicroservices(order) {
  await paymentService.charge(order);       // a network call
  await inventoryService.update(order);     // another service
  await notificationService.notify(order);  // yet another
}`,
        walkthrough: [
          { code: "chargePayment(order); (monolith)", explanation: "A regular function call within the same running process — fast, but tightly coupled." },
          { code: "await paymentService.charge(order); (microservices)", explanation: "A network call to a completely separate, independently deployed service." },
        ],
      },
    ],
    howItWorks: `
In a monolith, every part of the application runs as one process,
sharing memory and typically one database, so calling between parts is
just a regular function call. In microservices, each service is its own
separate process (often with its own database), communicating with
other services over the network — usually via HTTP APIs or message
queues — which introduces network latency, partial failure (one service
can be down while others work), and the need for careful API contracts
between services.
    `.trim(),
    whyItExists: `
As a codebase and a team both grow large, a monolith can become hard to
work on — every change risks affecting unrelated parts, and the whole
thing must be deployed together. Microservices let different teams own,
deploy, and scale their own piece of the system independently, at the
cost of significant added operational complexity.
    `.trim(),
    whenToUse: `
Start with a monolith for most new projects — it's simpler to build,
easier to reason about, and faster to change early on. Consider
splitting into microservices once a team has genuinely grown large
enough that independent teams need to deploy independently, or specific
parts of the system have wildly different scaling needs.
    `.trim(),
    whenNotToUse: `
Don't reach for microservices just because large companies use them —
for a small team or an early-stage product, the operational overhead
(network calls, service discovery, distributed debugging) usually costs
far more than it's worth. Many successful products run as a monolith for
years.
    `.trim(),
    commonMistakes: [
      "Adopting microservices prematurely, taking on distributed-systems complexity before the team or product actually needs it.",
      "Splitting services along lines that don't match how the team is organized, so every feature still requires coordinating across many services anyway.",
      "Forgetting that a network call between microservices can fail in ways a normal function call never could, and not handling those failures.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, the main tradeoff between a monolith and microservices." },
      { difficulty: "Medium", prompt: "Describe a warning sign that a monolith might be becoming difficult for a growing team to work in." },
      { difficulty: "Hard", prompt: "Explain why a single feature (like placing an order) becomes harder to reason about when it's split across three separate microservices instead of one monolith." },
    ],
    interviewQuestions: [
      { question: "What is the main difference between a monolith and microservices?", answer: "A monolith is one deployable application containing all functionality; microservices split functionality into many independently deployable services that communicate over the network." },
      { question: "What's a real cost of microservices that a monolith doesn't have?", answer: "Network calls between services can fail independently, add latency, and require careful handling of partial failures — problems a single in-process monolith never encounters." },
      { question: "Why might a company choose microservices despite the added complexity?", answer: "To let independent teams deploy and scale their own services without coordinating with every other team, and to scale only the specific parts of the system that need it." },
      { question: "What is a \"distributed monolith,\" and how does a team end up with one despite having \"microservices\"?", answer: "It's a system split into separate deployable services that still can't actually be deployed or changed independently — because they share a database, call each other synchronously in tightly-coupled chains, or share versioned libraries that force them to be updated in lockstep. It happens when a team splits the code without splitting the actual coupling, ending up with all of microservices' operational cost and none of its independence benefit." },
      { question: "What are some warning signs that you actually have a distributed monolith rather than true microservices?", answer: "You can't deploy one service without also deploying several others; a single feature routinely requires coordinated changes across many services at once; services share a database or shared mutable state; and a failure or slowdown in one service reliably cascades into failures in several others rather than degrading gracefully." },
      { question: "What does \"each microservice owns its own data\" mean, and why is a shared database across microservices considered an anti-pattern?", answer: "It means each service is the only one allowed to directly read or write its own underlying storage — other services must go through its API, never its database. A shared database re-couples services at the data layer even if their code is separate: one service's schema change can silently break another, and it becomes impossible to reason about which service is actually responsible for a given piece of data's integrity." },
      { question: "Scenario: an orders service and an inventory service share the same underlying database. What problems does this cause?", answer: "Either service can change the shared schema in a way that breaks the other without either team necessarily realizing it, neither can be deployed or scaled independently since both depend on one shared database's availability and schema version, and it becomes unclear whose responsibility it is to maintain data integrity — defeating a core reason to split them into separate services in the first place." },
      { question: "What is Conway's Law, and how does it argue for aligning service boundaries with team boundaries?", answer: "Conway's Law observes that a system's architecture tends to mirror the communication structure of the organization that built it. It argues you should draw service boundaries around how your teams are actually organized (so a service can be owned and changed by one team without needing constant cross-team coordination), rather than drawing boundaries first and hoping teams naturally reorganize around them." },
      { question: "What is a \"bounded context\" (from domain-driven design), and why is it a common way to decide where to draw a microservice boundary?", answer: "A bounded context is a boundary within which a specific business concept (like \"order\" or \"inventory\") has one consistent, well-defined meaning and model — outside that boundary, the same word might mean something subtly different to a different part of the business. It's a natural fit for service boundaries because each bounded context tends to have its own data, its own rules, and can reasonably be owned by one team." },
      { question: "What is the \"monolith-first\" approach, and why do many experienced teams recommend it even when they expect to eventually need microservices?", answer: "It means deliberately starting a new system as a single, well-structured monolith, and only splitting out services once real usage has revealed where the actual boundaries and scaling needs are. It's recommended because the right service boundaries are hard to guess correctly upfront, and a monolith is far cheaper to restructure internally than a set of prematurely-drawn microservice boundaries are to undo." },
      { question: "What is the strangler fig pattern, and how does it let you migrate a monolith to microservices incrementally?", answer: "New functionality (or a piece of existing functionality) is built as a new service that gradually intercepts and takes over a specific responsibility, while the monolith keeps running and handling everything not yet migrated — until, piece by piece, the monolith's remaining responsibilities shrink and it can eventually be retired. It avoids the risk of a single big-bang rewrite by migrating one bounded piece at a time, each independently verifiable." },
      { question: "What is the saga pattern, and what problem does it solve for a \"transaction\" that spans multiple microservices?", answer: "A saga breaks a multi-step business operation that spans several services into a sequence of local transactions, each with a corresponding compensating action that can undo it if a later step fails — since there's no single shared database to wrap the whole thing in one ACID transaction, a saga achieves an equivalent all-or-nothing outcome through explicit forward and backward steps instead." },
      { question: "Scenario: placing an order charges payment, reserves inventory, then schedules shipping, across three services with no shared database. Payment succeeds but inventory reservation fails — walk through how a saga handles this.", answer: "The saga recognizes the failure at the inventory step and triggers the compensating action for every step that already succeeded — in this case, refunding the payment that was already charged — rather than leaving the customer charged for an order that can never actually be fulfilled. The shipping step is simply never reached." },
      { question: "What's the difference between choreography-based and orchestration-based sagas?", answer: "In choreography, each service reacts to events from the others and decides its own next action independently, with no central coordinator — more decoupled, but harder to see the overall flow in one place. In orchestration, a central coordinator explicitly tells each service what to do and in what order, and handles triggering compensations — easier to reason about and observe, but that coordinator becomes a piece of shared logic every service in the saga depends on." },
      { question: "Why does distributed tracing become necessary in microservices in a way it isn't for a monolith?", answer: "In a monolith, a slow or failing request can be diagnosed with a single stack trace or profiler within one process. In microservices, a single user request can fan out across many independent services, each with its own logs, and there's no single process to inspect — distributed tracing stitches together the full cross-service path of one request (with per-hop timing) into one coherent view that would otherwise require manually correlating scattered logs from many different systems." },
      { question: "Scenario: a single user-facing request touches 6 services and is slow. Without distributed tracing, why is this hard to debug?", answer: "Each service only has visibility into its own portion of the work — none of them individually knows how long the other 5 took, or which one was actually the bottleneck. Without a shared trace id linking all 6 services' logs for that one request together, engineers are left manually cross-referencing timestamps across six separate logging systems to even figure out where the time went." },
      { question: "What is a circuit breaker, and why does calling another microservice over the network need one when calling a function within a monolith doesn't?", answer: "A circuit breaker detects that calls to a downstream service are consistently failing or timing out, and starts failing fast (without even attempting the call) for a cooldown period, rather than letting every caller keep waiting on a service that's already struggling. An in-process function call in a monolith either succeeds, throws, or the whole process crashes together — there's no independent \"the other side is down but I'm still up\" state a circuit breaker needs to protect against, because there's no network between them." },
      { question: "Why is versioning API contracts between microservices a much bigger deal than versioning function signatures within a monolith?", answer: "Within a monolith, changing a function's signature and updating every caller happens together, in the same deploy, checked by the same compiler/type system. Across microservices, the caller and the service can be deployed independently and at different times, so a breaking API change can be live in production being called by callers still expecting the old shape — contracts need explicit versioning and backward compatibility, since you can't guarantee every caller upgrades in lockstep." },
      { question: "What is contract testing, and what problem does it solve between independently-deployed services?", answer: "Contract testing verifies that a service's actual API matches what its consumers expect, without needing to spin up every real consumer and provider together to test it. It catches a breaking change to a service's contract before it's deployed, without requiring a full, slow, flaky end-to-end test across every dependent service just to know whether an integration still works." },
      { question: "Why is testing generally harder in a microservices architecture than in a monolith?", answer: "A monolith's tests can exercise a whole business flow in-process, fast and deterministically. In microservices, the same flow spans multiple independently-deployed services communicating over the network, so a true end-to-end test requires standing up several real (or realistically faked) services together, and network-related flakiness and version-mismatch bugs become possible in a way an in-process call never has to account for." },
      { question: "What does \"independent deployability\" actually buy a team, concretely — and what does it cost operationally?", answer: "It lets one team ship a change to their service without waiting for, or coordinating a simultaneous release with, every other team — faster, lower-risk releases scoped to just their own code. It costs real operational overhead: each service needs its own deployment pipeline, monitoring, and on-call ownership, and the team must design every API change to stay compatible with whatever version of every consumer happens to still be running." },
      { question: "Scenario: the payments team wants to deploy a breaking API change. What does true independent deployability require of how they roll this out?", answer: "They can't simply break the old contract in place — they need to either support both the old and new API shape simultaneously for a transition period (versioning), or coordinate the rollout with every known consumer to migrate first, precisely because other services may still be running against the old contract and deploy on their own separate schedule." },
      { question: "What is the \"premature decomposition\" trap, and why does it commonly happen to teams inspired by big tech blog posts?", answer: "It's adopting microservices because a well-known, much larger company uses them successfully, without having that company's actual scale, team size, or specific bottlenecks that justified the decision for them. The blog post shows the payoff, not the years of pain and the specific organizational scale that made the tradeoff worth it for that company at that size." },
      { question: "What's a realistic signal that a monolith has actually grown to the point microservices would help, rather than just \"it feels big\"?", answer: "Independent teams are genuinely blocked from deploying their own changes without coordinating releases with unrelated teams, or specific parts of the system have such different scaling/reliability needs that scaling the whole monolith to satisfy one part wastes significant resources on the rest — a felt sense of size or code sprawl alone isn't the same signal, and can often be fixed by better internal modularity instead." },
      { question: "Why can splitting a monolith along the wrong boundaries make things worse rather than better?", answer: "If a boundary is drawn through the middle of what's actually one cohesive piece of business logic, most real features end up needing coordinated changes across the resulting services anyway — so you now pay for network calls, versioning, and distributed debugging, without actually gaining the independent-deployment benefit the split was supposed to provide." },
      { question: "What operational capabilities does a team typically need in place before microservices become net-positive, that a monolith doesn't require?", answer: "Centralized logging and distributed tracing, service discovery, automated per-service deployment pipelines, monitoring/alerting per service, and generally some form of container orchestration — without this tooling in place, teams end up manually reproducing what a monolith gets essentially for free, one struggling service at a time." },
      { question: "Why does network partial failure require different error-handling thinking than a monolith's function calls?", answer: "A monolith's function calls either complete or the whole process crashes together — there's no state where one part of your own process is unreachable while the rest keeps running. Across a network, one dependency can be slow, timing out, or fully down while everything else stays healthy, so microservices code has to explicitly handle timeouts, retries, and partial degradation as ordinary, expected conditions rather than rare edge cases." },
      { question: "What is a service mesh, and what problems does it solve that would otherwise be re-implemented independently in every microservice?", answer: "A service mesh is an infrastructure layer (typically sidecar proxies alongside each service) that handles cross-cutting network concerns — retries, timeouts, circuit breaking, mutual TLS, load balancing, and observability — centrally and consistently, rather than every individual service reimplementing its own version of this logic in whatever language or framework it happens to use." },
      { question: "Scenario: after splitting into microservices, feature development actually slowed down because most features still touch three or four services at once. What does this suggest about how the boundaries were drawn?", answer: "It suggests the services were split along lines that don't match how the business logic actually varies — the boundaries likely followed a technical layering (e.g. one service per database table) rather than a cohesive business capability, so a single feature's logic ends up spread across several services that all still need to change together, paying microservices' coordination cost with none of its independence benefit." },
      { question: "Why is \"our team is small\" often a stronger argument against microservices than any specific technical concern?", answer: "Microservices' main benefit is letting multiple independent teams work and deploy without stepping on each other — a benefit that doesn't exist if there's really only one team, since that team still has to coordinate across every service they own regardless of how the code is split, while paying the full network, deployment, and observability overhead of the split anyway." },
      { question: "What's the relationship between eventual consistency and microservices — why do cross-service reads often end up eventually consistent even if each service's own database is strongly consistent?", answer: "Each service can be perfectly strongly consistent within its own database, but keeping one service's view of another service's data up to date (e.g. via events or async replication) happens over the network, on its own schedule — so from the perspective of a consumer relying on another service's data, there's inherently a window where that copy can be behind, just as with database replication, but now at the level of whole services instead of database replicas." },
      { question: "Common misconception: \"microservices make a system more reliable.\" Why is this not automatically true?", answer: "Splitting a monolith into many services multiplies the number of independent things that can fail (each service, each network hop between them) — without deliberate resilience patterns (circuit breakers, retries with backoff, graceful degradation), a microservices system can actually be less reliable than a monolith, since a failure in any one of many dependencies can cascade. It becomes more reliable only when the added failure surface is actively engineered around, not as an automatic side effect of the split." },
      { question: "What's a realistic warning sign in a monolith that one specific piece (not the whole system) is a good first candidate to extract into its own service?", answer: "A piece of functionality with genuinely different scaling needs than the rest of the system (e.g. a heavy image-processing job dragging down an otherwise fast API), or one with a clearly separable, stable API boundary and its own data that a specific team could own end-to-end — a good extraction candidate is narrow and well-isolated, not \"let's split everything at once.\"" },
    ],
    prerequisites: ["scalability"],
    relatedTopics: ["api-gateway", "circuit-breaker", "scalability"],
    keywords: ["microservices", "monolith", "architecture", "distributed systems"],
  },
  {
    id: "pub-sub",
    title: "Publish/Subscribe (Pub/Sub)",
    level: "intermediate",
    description: "Letting one event be broadcast to many interested listeners, without the sender needing to know who they are.",
    explanation: `
A queue is great when exactly one worker should handle each piece of
work. But sometimes an event needs to be delivered to every interested
party, not just one — a new order might need to trigger an email, an
inventory update, and an analytics event, all at once.
**Publish/Subscribe** (pub/sub) solves this: a publisher sends a message
to a named **topic**, and every subscriber currently listening to that
topic receives its own copy.
    `.trim(),
    analogy:
      "It's like a radio broadcast. The radio station (publisher) doesn't know or care who's listening — it just broadcasts on its frequency (the topic). Anyone with a radio tuned to that frequency (a subscriber) hears the exact same broadcast, independently of everyone else.",
    examples: [
      {
        title: "One event, multiple independent subscribers",
        code: `// Publisher
eventBus.publish("order.created", { orderId: 42 });

// Subscriber 1
eventBus.subscribe("order.created", (event) => {
  sendConfirmationEmail(event.orderId);
});

// Subscriber 2 — completely independent of subscriber 1
eventBus.subscribe("order.created", (event) => {
  updateAnalytics(event.orderId);
});`,
        walkthrough: [
          { code: 'eventBus.publish("order.created", ...)', explanation: "Announces an event on a named topic, with no idea who (if anyone) is listening." },
          { code: 'eventBus.subscribe("order.created", ...) (first)', explanation: "Registers interest in that topic; runs independently whenever it fires." },
          { code: 'eventBus.subscribe("order.created", ...) (second)', explanation: "A completely separate subscriber, also notified of the exact same event, with no coordination with the first." },
        ],
      },
    ],
    howItWorks: `
A pub/sub system maintains a set of topics, each with zero or more
subscribers. When a publisher sends a message to a topic, the system
delivers a copy of that message to every current subscriber of that
topic, independently — publishers and subscribers never talk to each
other directly, and neither needs to know the other exists.
    `.trim(),
    whyItExists: `
Pub/sub lets you add a brand-new reaction to an existing event (like a
new notification type, or a new analytics hook) without touching the
code that publishes the event at all — the publisher and every
subscriber can be developed, deployed, and scaled completely
independently of each other.
    `.trim(),
    whenToUse: `
Reach for pub/sub whenever one event genuinely needs to trigger multiple
independent reactions, especially across different services or teams,
and especially when new subscribers might be added later without
changing the publisher.
    `.trim(),
    whenNotToUse: `
If exactly one worker should handle each message (like processing a
payment exactly once), a queue is the right tool, not pub/sub, which is
designed for broadcasting to many listeners rather than distributing
work to exactly one.
    `.trim(),
    commonMistakes: [
      "Confusing pub/sub (every subscriber gets every message) with a queue (exactly one worker gets each message) — they solve different problems.",
      "Assuming a subscriber that's offline when a message is published will still receive it later — depending on the system, that message may simply be missed unless durability/replay is explicitly configured.",
      "Publishing overly specific, tightly-coupled event data that assumes exactly which subscribers exist, defeating the purpose of the publisher not needing to know who's listening.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, the difference between a queue and pub/sub." },
      { difficulty: "Medium", prompt: "Describe a real feature (e.g. a new order) and list three independent subscribers that might react to it via pub/sub." },
      { difficulty: "Hard", prompt: "Explain what could go wrong if a subscriber is temporarily down when an important event is published, and how a system might guard against losing that event." },
    ],
    interviewQuestions: [
      { question: "What is publish/subscribe (pub/sub)?", answer: "A messaging pattern where a publisher sends messages to a named topic, and every current subscriber of that topic receives an independent copy, without publisher and subscriber knowing about each other." },
      { question: "What's the key difference between pub/sub and a message queue?", answer: "A queue delivers each message to exactly one consumer; pub/sub delivers each message to every subscriber of that topic." },
      { question: "Why is pub/sub useful for adding new features?", answer: "A new subscriber can be added to react to an existing event without any change to the code that publishes it." },
    ],
    prerequisites: ["queues"],
    relatedTopics: ["queues", "microservices-vs-monolith"],
    keywords: ["pub/sub", "publish subscribe", "topic", "event-driven", "broadcast"],
  },
];
