import type { Topic } from "../../types/content";

export const systemDesignIntermediateTopics: Topic[] = [
  {
    id: "databases",
    title: "Databases",
    level: "intermediate",
    description: "Where an app's data lives safely between requests.",
    explanation: `
A running program keeps its variables in memory, but memory is wiped when
the program stops or restarts. That's no good for a user's account, posts
or orders.

A **database** is software built to store data reliably on disk, find it
quickly, and keep it consistent while many things read and write at once.
Almost every real app has one behind its server.
    `.trim(),
    analogy:
      "If the server is the chef, the database is the pantry and fridge: an organized place where ingredients (data) are kept, still there when the kitchen reopens the next day.",
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
          "The server doesn't store user data itself. It asks the database, which stores and returns it reliably.",
        walkthrough: [
          { code: "async function getUser(id) {", explanation: "Defines a function that fetches one user from the database." },
          { code: 'database.query("SELECT * FROM users WHERE id = ?", [id])', explanation: "Asks the database for the row with this id and waits for the (possibly slow) answer." },
          { code: "return user;", explanation: "Returns the result to the caller." },
        ],
      },
    ],
    howItWorks: `
A database organizes data (often into tables, or collections of documents)
and gives you a query language or API to read and write it.

It also handles the hard parts for you: two simultaneous writes don't
corrupt each other, and data survives a crash or restart.
    `.trim(),
    whyItExists: `
Apps need data that survives crashes, restarts and many users at once.
Building that from scratch for every app would be a huge waste, so every app
relies on the same well-tested foundation instead.
    `.trim(),
    whenToUse: `
Use a database whenever data must outlive a single request or process: user
accounts, orders, posts, anything that must still be there tomorrow or on
another server.
    `.trim(),
    whenNotToUse: `
For data needed only during one request (a temporary calculation, a value
passed between two functions), a database is unnecessary overhead. Keep it
in memory.
    `.trim(),
    commonMistakes: [
      "Keeping important data only in server memory, so it's lost on every restart.",
      "Not planning how the database will scale once data grows into millions of records.",
      "Putting user input directly into a query, which opens security holes like SQL injection.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain why a to-do list app needs a database instead of keeping tasks in the browser's memory." },
      { difficulty: "Medium", prompt: "Describe the data you'd store for a simple blog (posts, authors, comments) and how the pieces relate." },
      { difficulty: "Hard", prompt: "Explain what could go wrong if two users buy the last item in stock at the same moment, and how a database might prevent it." },
    ],
    interviewQuestions: [
      { question: "Why can't an application just keep all its data in server memory?", answer: "Memory is wiped when a process restarts or crashes, and it isn't shared across servers. A database gives durable, shared storage." },
      { question: "What's the difference between reading and writing data in terms of design concerns?", answer: "Reads are usually far more frequent and easier to scale (with caching or replicas). Writes need stronger guarantees around consistency and conflicts." },
      { question: "What is data persistence?", answer: "Data surviving beyond the process that created it, for example still being there after a server restarts." },
      { question: "What does ACID stand for, and why does it matter for a transaction?", answer: "Atomicity, Consistency, Isolation, Durability. A transaction applies fully or not at all, leaves data valid, doesn't interfere with other concurrent transactions, and survives a crash once committed." },
      { question: "Why do multiple statements often need to be grouped into a single transaction, rather than run one at a time?", answer: "If a transfer debits one account and credits another in two separate statements, a crash between them could lose money. One transaction guarantees both apply or neither does." },
      { question: "What is a database index, and why isn't every column simply indexed by default?", answer: "An index is a separate sorted structure that finds matching rows without scanning the whole table. But every index must be updated on every write and takes its own storage, so indexing everything slows writes for little gain on rarely queried columns." },
      { question: "Mechanically, why does an index make a lookup fast where scanning the whole table wouldn't?", answer: "Most indexes are B-trees, sorted structures the database can binary-search. A match takes roughly `log(n)` steps whatever the table size, instead of a full scan checking all `n` rows." },
      { question: "What's the difference between optimistic and pessimistic concurrency control?", answer: "Pessimistic control locks a row upfront so no other transaction can touch it. Optimistic control lets transactions run freely and checks at commit time whether the data changed, retrying if so. Optimistic is better when conflicts are rare." },
      { question: "What is a deadlock, and how does a database typically handle it?", answer: "Two transactions each hold a lock the other needs, so neither can continue. The database detects the cycle and aborts (rolls back) one of them." },
      { question: "What does normalizing a schema mean, and what's the tradeoff of deliberately denormalizing it?", answer: "Normalizing splits data across tables so each fact is stored once, keeping it consistent by design. Denormalizing duplicates data for faster reads (fewer joins), but every copy must be kept in sync on writes." },
      { question: "What is the N+1 query problem, and how do you fix it?", answer: "Fetching N records, then running one extra query per record in a loop for related data: 1 + N queries where one would do. Fix it by loading the related data in one query (a join, or one `WHERE id IN (...)` batch fetch)." },
      { question: "Why can an ORM sometimes hurt performance compared to hand-written SQL?", answer: "An ORM hides which queries it actually runs. A chain of object accesses can quietly cause an N+1 pattern or fetch far more rows and columns than needed, and you may not notice until it's slow at scale." },
      { question: "What is connection pooling, and why does it matter?", answer: "Opening a database connection costs a TCP handshake and authentication. A pool keeps open connections ready to reuse across requests instead of opening and closing one per request." },
      { question: "What does a query's `EXPLAIN` plan tell you, and when would you reach for it?", answer: "It shows how the database plans to run a query: whether it uses an index or scans the table, and the order it joins tables. Check it first when a query is unexpectedly slow." },
      { question: "What's the difference between a primary key and a foreign key?", answer: "A primary key uniquely identifies each row in its table. A foreign key stores another table's primary key to represent a relationship, and the database can enforce that the referenced row exists." },
      { question: "What's the difference between OLTP and OLAP databases?", answer: "OLTP (Online Transaction Processing) handles many small, frequent reads and writes, like placing an order. OLAP (Online Analytical Processing) runs fewer, much larger queries over lots of historical data for reporting. The workloads differ enough that they're often served by different systems." },
      { question: "Why isn't replication a substitute for backups, even though both involve keeping copies of data?", answer: "A replica copies changes as they happen, including a mistaken delete or corruption on the primary. A backup is a separate point-in-time snapshot you can restore from later, which replication doesn't give you." },
      { question: "Scenario: a `products` query filters by `category` and sorts by `price`, and it's slow at 50 million rows despite an index on `category` alone. What's likely happening?", answer: "The index finds the category's rows quickly, but the database still has to sort all of them by price, often spilling to disk at that volume. A composite index on `(category, price)` returns them already sorted. Confirm by checking whether the query plan shows a separate sort step." },
      { question: "What is a \"dirty read,\" and what prevents it?", answer: "Reading a row another transaction changed but hasn't committed. It might still be rolled back, so you read data that never really existed. Any isolation level above the weakest (read uncommitted), so read committed and up, prevents it." },
      { question: "What's the difference between a \"non-repeatable read\" and a \"phantom read\"?", answer: "A non-repeatable read: reading the same row twice in one transaction and getting different values, because another transaction updated it in between. A phantom read: running the same range query twice and getting a different set of rows, because another transaction inserted or deleted matching rows in between." },
      { question: "When would you reach for vertical scaling of a database versus horizontal scaling (replication or sharding)?", answer: "Vertical scaling (a bigger server) is simpler, with no distributed-systems complexity, and works up to a point. But it has a hard ceiling, cost rises faster than capacity near the top, and it's still a single point of failure. Horizontal scaling spreads load and risk across machines at the cost of real operational complexity. Use it once the vertical ceiling or single-server risk is the actual constraint." },
      { question: "Scenario: your database's CPU is pegged near 100% during peak hours, mostly from read queries. Name two different fixes and what each costs.", answer: "Read replicas spread reads across more machines, at the cost of replication lag and more operations work. A cache in front of the database avoids hitting it for repeat reads, at the cost of sometimes serving slightly stale data. (Scaling vertically is a third option, but only lasts until the next ceiling.)" },
      { question: "Why is directly building a SQL query string from user input dangerous, and what's the standard fix?", answer: "If input is concatenated into a query, an attacker can craft input that changes its meaning (SQL injection), for example by ending the string early and adding their own clause. The fix is parameterized queries (prepared statements): input is always passed as data and can never become part of the query's structure." },
      { question: "What is a write-ahead log, and why do databases use one?", answer: "Before changing data on disk, the database appends the change to a durable, sequential log. If it crashes mid-write, it replays the log on restart to reach a consistent state instead of losing or corrupting data. It's how the \"D\" (durability) in ACID works." },
      { question: "Scenario: you need to add a `NOT NULL` column to a table with 200 million existing rows, with zero downtime allowed. What has to be handled carefully?", answer: "Adding a `NOT NULL` column with no default in one step on a table that size usually means a long lock or a table rewrite. Safer: add the column as nullable, backfill existing rows in small batches so the whole table isn't locked, then add the `NOT NULL` constraint once every row has a value." },
      { question: "What's the difference between a database-enforced constraint (like a foreign key or unique constraint) and the same rule checked only in application code?", answer: "A database constraint holds no matter what writes the data: a bug, another service, or a race between two concurrent writes can't break it. An app-level check can be bypassed by any other path to the database, and has its own race between the check and the write." },
    ],
    prerequisites: ["rest-apis"],
    relatedTopics: ["sql-vs-nosql", "caching", "rest-apis", "database-replication"],
    keywords: ["database", "persistence", "query", "storage"],
  },
  {
    id: "sql-vs-nosql",
    title: "SQL vs NoSQL",
    level: "intermediate",
    description: "Two ways to organize and store data, each suited to different problems.",
    explanation: `
Databases don't all organize data the same way.

- **SQL** databases are **relational**. They store data in strict tables with
  fixed columns and are very good at keeping relationships between data
  consistent. (SQL, Structured Query Language, is the language used to query
  them, and the name stuck to the whole category.)
- **NoSQL** ("not only SQL") databases are more flexible. They store data as
  loose documents, key-value pairs or other shapes, trading some structure
  and consistency for flexibility and easier scaling across many machines.
  Most still support querying, just not with SQL.

Neither is always "better". The right choice depends on how structured your
data is and how it needs to scale.
    `.trim(),
    analogy:
      "A SQL database is like a set of strict spreadsheets with fixed columns: great for consistency. A NoSQL database is like a stack of index cards where each card can have whatever fields it needs: great for flexibility.",
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
          { code: "-- users(id, name, email)", explanation: "Defines a strict table shape: every row must have exactly these columns." },
          { code: "SELECT * FROM users WHERE id = 1;", explanation: "Reads the row with id 1 from that table." },
          { code: '{ "id": 1, "name": ..., "preferences": {...} }', explanation: "The same data as a flexible document. New fields can be added without changing other records." },
        ],
      },
    ],
    howItWorks: `
SQL databases enforce a schema (every row in a table has the same columns)
and are built around relationships between tables: a user has many orders,
an order has many items.

NoSQL databases usually don't enforce a fixed schema, so each record's shape
can vary. They often give up some cross-record consistency to make it easier
to spread data across many servers.
    `.trim(),
    whyItExists: `
Some data is naturally tabular and full of relationships (financial records,
inventory), which suits SQL's structure and guarantees. Other data is less
structured or must scale to huge volumes across many servers (logs, activity
feeds), which suits NoSQL's flexibility.
    `.trim(),
    whenToUse: `
Choose SQL when data is naturally tabular, relationships matter (orders
belong to users, items belong to orders) and you want strong consistency.

Choose NoSQL when the data's shape varies or changes often, or it needs to
scale out across many machines more easily than one relational database can.
    `.trim(),
    whenNotToUse: `
Don't pick NoSQL because it feels more modern. If your data is truly
relational, a document store often means rebuilding SQL's features yourself.

And don't force rigid SQL tables onto data that keeps changing shape: frequent
schema migrations become a maintenance burden.
    `.trim(),
    commonMistakes: [
      "Assuming NoSQL is always 'faster' or 'more modern'. It's a different trade-off, not an upgrade.",
      "Using a rigid SQL schema for data that changes shape constantly, causing painful migrations.",
      "Using NoSQL for data with many strict relationships, then rebuilding relational logic by hand in app code.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List two kinds of data that fit naturally into SQL tables and two that fit better as flexible NoSQL documents." },
      { difficulty: "Medium", prompt: "Explain what a 'schema' is and why enforcing one has both benefits and costs." },
      { difficulty: "Hard", prompt: "Describe a case where you might use both a SQL and a NoSQL database in one app, and why." },
    ],
    interviewQuestions: [
      { question: "What's the main structural difference between SQL and NoSQL databases?", answer: "SQL databases enforce a fixed schema and organize data into related tables. NoSQL databases usually allow flexible, schema-less structures like documents or key-value pairs." },
      { question: "When would you choose NoSQL over SQL?", answer: "When data doesn't fit neatly into fixed tables, needs to scale horizontally across many servers, or changes structure often." },
      { question: "Does choosing NoSQL mean giving up data consistency entirely?", answer: "No. But many NoSQL systems trade some strong consistency for availability and scalability, an approach called 'eventual consistency'." },
      { question: "What are the main categories of NoSQL databases, and what's each typically good at?", answer: "Document stores (e.g. MongoDB) suit flexible, nested records whose shape varies. Key-value stores (e.g. Redis, DynamoDB) suit simple, very fast lookups by one key. Wide-column stores (e.g. Cassandra) suit huge, sparse, write-heavy datasets. Graph databases (e.g. Neo4j) suit data defined mainly by relationships, like a social network." },
      { question: "Scenario: you're building a product catalog where each category has wildly different attributes — a book has an author and ISBN, a TV has screen size and resolution. SQL or NoSQL?", answer: "A NoSQL document store fits: each product stores only its own fields. In SQL you'd need a table with dozens of mostly-null columns, or an awkward entity-attribute-value pattern that rebuilds flexible storage on a rigid one." },
      { question: "Scenario: you're building the ledger for a banking app that must guarantee an account's balance is never double-spent across two concurrent transfers. SQL or NoSQL?", answer: "SQL. This needs strong multi-row ACID transactions: a debit and credit both apply or neither does, and no other transaction can see a half-applied state. Many NoSQL databases don't support multi-document transactions, or added them later at a real performance cost because they work against their scaling model." },
      { question: "Why do most NoSQL databases avoid supporting joins, and what does that push you to do instead?", answer: "When data is spread across many machines, a join may need data from several nodes, which is expensive. So NoSQL data is usually denormalized: related data is embedded in the document the query needs, duplicated rather than joined at read time." },
      { question: "What's the difference between \"schema-on-write\" and \"schema-on-read,\" and which philosophy does each side favor?", answer: "SQL is schema-on-write: the data's shape is checked at insert time. NoSQL is usually schema-on-read: data is stored as-is and whatever reads it must interpret its shape, which moves validation from the database to the app." },
      { question: "What does BASE (as a contrast to ACID) stand for, and what philosophy does it represent?", answer: "Basically Available, Soft state, Eventually consistent. It's the philosophy behind many NoSQL systems: stay available and responsive rather than guarantee every read is up to date." },
      { question: "Scenario: you need to store hundreds of millions of IoT sensor readings per day, mostly appended once and rarely updated, queried by device and time range. What fits, and why?", answer: "A wide-column or time-series NoSQL store. It's built for very high write throughput and partitions naturally by device id and time. The workload needs fast, well-partitioned appends and range scans, not relational joins." },
      { question: "What's a real cost of denormalizing data into a NoSQL document that a SQL-background developer might not expect?", answer: "The same fact can be copied into many documents (e.g. a username in every post by that user). Changing it means updating every copy, not one row in one place." },
      { question: "Why can adding an index be a more deliberate, upfront decision in a NoSQL database than it typically is in SQL?", answer: "Many NoSQL databases lack a general query planner that optimizes any ad hoc query the way SQL does. You often design indexes around known access patterns in advance, and a query that doesn't match an index can be slow, or even rejected at scale." },
      { question: "What does \"polyglot persistence\" mean, and what's a realistic example?", answer: "Using different databases for different parts of one system instead of forcing one database to do everything. For example: SQL for orders and payments that need strong transactions, a document store for a flexible content catalog, and an in-memory key-value store like Redis for sessions." },
      { question: "Scenario: your document store doesn't support transactions across multiple documents. How do you still guarantee that a related pair of writes always happens together?", answer: "Two common options. Restructure so what must be atomic lives in one document (embed instead of reference), since a single-document write is still atomic. Or accept the multiple steps and add a compensating-action (saga-style) pattern in the app that detects and repairs a partly applied write." },
      { question: "Why is horizontal scaling often easier to achieve with NoSQL databases than with a traditional relational database?", answer: "Many NoSQL databases are designed for distribution from the start. Their data model discourages cross-node joins and transactions, so partitioning across machines doesn't fight the model. Relational databases were designed for a single node, with distribution (sharding, distributed SQL) added later at real complexity cost." },
      { question: "Common misconception: \"NoSQL databases are always faster than SQL databases.\" Why is this wrong?", answer: "Speed depends on how well the data model and indexes fit the query pattern, not the category. A well-indexed SQL query on well-structured data can beat a poorly modeled NoSQL query, and vice versa." },
      { question: "Scenario: your app uses one SQL database for everything, and a new \"notification history\" feature needs to store an ever-growing, rarely-queried-in-detail log of every notification sent, at huge volume. Keep it in the same database?", answer: "Probably not as-is. Unbounded, high-volume, append-heavy data competing for the same database can slow the core transactional work. A store suited to that pattern (a NoSQL store, a cheaper storage tier, or a log/analytics system) usually fits better." },
      { question: "What's the practical impact of eventual consistency on a NoSQL-backed app's UI, and how do teams commonly work around it?", answer: "A user's own write may not show up if their next read hits a replica that hasn't caught up. Common fixes: \"read-your-own-writes\" routing (send the user's reads to the node they just wrote to), or update the UI optimistically from the write instead of waiting for a fresh read." },
      { question: "What's the difference between a key-value store and a document store, given both can look like \"a big dictionary\"?", answer: "A key-value store treats the value as an opaque blob: the database can't see or query inside it. A document store understands the value's structure and can query or index individual fields." },
      { question: "Why is choosing a good partition key in a NoSQL database often even more consequential than choosing a good index in SQL?", answer: "Most NoSQL databases route straight to a partition by that key and have no efficient ad hoc query or cross-partition join to fall back on. A bad key doesn't just make one query slow; it can make a whole access pattern expensive or unsupported." },
      { question: "Scenario: a social feature needs to find \"mutual friends of these two users,\" potentially traversing several hops of relationships. What's purpose-built for this, and why would a relational database struggle?", answer: "A graph database, which follows direct pointers between connected nodes. A relational database needs repeated self-joins on a friendship table, and the cost grows quickly with each extra hop." },
      { question: "Does using a NoSQL database mean giving up data validation entirely?", answer: "No, validation just moves. Instead of a schema enforcing types and shape, the app code (or an optional schema-validation layer some NoSQL databases offer) makes sure documents have the expected shape." },
      { question: "What's a real downside of SQL's rigid schema for a product that's still evolving rapidly, like an early-stage startup?", answer: "Every new field needs a migration (`ALTER TABLE`), which can be slow or lock a large table, and the team must coordinate the change before using the field. In a document model, a new field can just start appearing in new documents." },
      { question: "What's the conceptual difference between \"get this user's 5 most recent orders\" in SQL versus in a document store?", answer: "In SQL, it's usually a join between `users` and `orders` that the database filters, sorts and limits. In a document store, you'd either embed recent orders in the user document, or query a separate `orders` collection with a compound index on `(userId, createdAt)`. The app, not the database, relates the two." },
      { question: "How does the CAP theorem relate to why many NoSQL databases default to eventual consistency?", answer: "CAP says a distributed system can't guarantee both perfect consistency and availability during a network partition; it must give one up. Many NoSQL databases were built to keep serving requests when parts of the cluster can't talk, so they favor availability and accept eventual consistency." },
      { question: "Follow-up: does that mean SQL databases can't scale horizontally at all?", answer: "No. Modern distributed SQL databases shard and replicate data while keeping relational semantics and stronger consistency. They've been harder to build and are more complex to run than NoSQL's original model, but \"SQL doesn't scale\" is an oversimplification." },
      { question: "What does it mean for a wide-column NoSQL table to be \"sparse,\" and why is that useful?", answer: "Rows in the same table can have completely different sets of columns, unlike SQL where every row has every column (even if null). This saves storage when most rows use only a small, varying subset of many possible columns." },
      { question: "Scenario: you need full-text search across product descriptions with typo tolerance and relevance ranking. Is a general-purpose SQL or NoSQL database the right primary tool?", answer: "Neither, really. A dedicated search engine (like Elasticsearch, itself a specialized document store) is built for tokenizing, ranking and fuzzy-matching text. Use it alongside your main database, not instead of it." },
      { question: "What's a common trap when migrating an existing relational schema \"as-is\" into a NoSQL document store?", answer: "Turning each SQL table into its own collection and still joining them at query time. You lose the document model's strengths (it has no efficient joins) and keep none of SQL's transactional guarantees. Redesign the schema around the app's real query patterns instead." },
      { question: "Why might a team choose NoSQL specifically for a very write-heavy workload over SQL?", answer: "Many NoSQL databases spread writes across many nodes with little coordination, giving very high write throughput. A single relational database (before sharding) sends all writes through one primary, which becomes the bottleneck." },
      { question: "How does handling \"the data's shape changed yesterday\" typically differ between the two systems?", answer: "In SQL, a shape change needs a migration, ideally versioned and run the same way in every environment, before old and new code can share the table. In a document store, existing documents don't change, so app code often handles both old and new shapes at once. Schema changes happen in the app layer instead of upfront." },
    ],
    prerequisites: ["databases"],
    relatedTopics: ["databases", "scalability"],
    keywords: ["SQL", "NoSQL", "relational", "schema", "document database"],
  },
  {
    id: "caching",
    title: "Caching",
    level: "intermediate",
    description: "Keep a copy of often-needed data somewhere fast, so you don't redo expensive work.",
    explanation: `
Some operations are expensive: a complex database query, a slow
calculation, a call to a faraway service. Redoing that work every time the
same result is needed is wasteful.

**Caching** stores a copy of the result somewhere fast (often memory) so
later requests can reuse it instead of recomputing it.
    `.trim(),
    analogy:
      "It's like keeping a jug of cold brew in the fridge instead of brewing a fresh pot for every cup. Grabbing a cup is faster; you just have to refill the jug now and then.",
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
          { code: "const cache = new Map();", explanation: "A simple in-memory cache, empty at first." },
          { code: "if (cache.has(id)) { return cache.get(id); }", explanation: "If this id is already cached, return it right away with no database call." },
          { code: 'const user = await database.query(...);', explanation: "The expensive lookup. Runs only on a cache miss." },
          { code: "cache.set(id, user);", explanation: "Saves the result for next time, then returns it." },
        ],
      },
    ],
    howItWorks: `
Before doing expensive work, the system checks the cache:

- **Cache hit**: the data is there and is returned immediately.
- **Cache miss**: the expensive work runs and the result is stored in the
  cache for next time.

Cached data usually gets an expiration time so it doesn't stay stale
forever.
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
Caching greatly reduces load on slow or expensive resources (like
databases) and makes responses feel instant. The cost is sometimes serving
slightly outdated data, which is usually fine for data that doesn't change
every second.
    `.trim(),
    whenToUse: `
Use caching when the same expensive result is requested again and again and
doesn't need to be perfectly fresh every time: a product page, a popular
search, a computed report.
    `.trim(),
    whenNotToUse: `
Don't cache data that changes constantly and must always be exact, like a
live account balance mid-transaction. If you must, keep the cache lifetime
very short and invalidate it whenever the underlying data changes.
    `.trim(),
    commonMistakes: [
      "Caching fast-changing data without a short enough expiration, so users see stale information.",
      "Forgetting to invalidate (clear) a cached value when the underlying data changes.",
      "Putting sensitive or user-specific data in a shared cache without keeping it separate per user.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain the difference between a 'cache hit' and a 'cache miss'." },
      { difficulty: "Medium", prompt: "Add an expiration time to the cache example above, so cached values are only reused for 60 seconds." },
      { difficulty: "Hard", prompt: "Describe a real case where stale cached data could cause a user-facing problem, and how you'd reduce the risk." },
    ],
    interviewQuestions: [
      { question: "What is caching, in simple terms?", answer: "Storing a copy of a result somewhere fast, so repeated requests don't redo expensive work." },
      { question: "What is cache invalidation, and why is it considered hard?", answer: "Removing or updating cached data once it's no longer accurate. It's hard because you must reliably track every way a cached value can become stale." },
      { question: "What's a trade-off caching introduces?", answer: "It can serve slightly outdated ('stale') data for a while, in exchange for much faster responses and less load on the underlying system." },
      { question: "What is the cache-aside (lazy-loading) pattern?", answer: "The app checks the cache first. On a miss, it reads from the data source itself, writes the result into the cache, then returns it. The cache only holds what's been requested, and the app (not the cache) owns this logic." },
      { question: "What is write-through caching, and how does it differ from cache-aside in when data enters the cache?", answer: "In write-through, every write updates the cache and the underlying store together in one operation, so the cache always has the latest value. In cache-aside, data only enters the cache on a later read after a miss; a write alone doesn't populate it." },
      { question: "What is write-back (write-behind) caching, and what risk does it introduce that write-through avoids?", answer: "Writes go to the cache and are confirmed right away; the write to the underlying store happens later, asynchronously. It's faster, but if the cache crashes before that write finishes, the data is lost. Write-through avoids this by confirming only once both are durably updated." },
      { question: "What is \"write-around\" caching, and when would you use it?", answer: "Writes go straight to the underlying store and skip the cache; the cache fills later on reads (like cache-aside). It suits data written once and rarely re-read soon after, so the cache doesn't fill with values nobody requests." },
      { question: "What is cache stampede (thundering herd), and give a concrete scenario where it happens.", answer: "When a popular key expires or is evicted, many concurrent requests miss at once and all hit the data source to recompute the same value. For example, a busy product page's entry expires just as a traffic spike hits, sending thousands of identical queries for the same row to the database." },
      { question: "Name two mitigations for cache stampede.", answer: "A lock (\"single-flight\") so only one request recomputes a missing value while others wait for its result. Or random jitter on TTLs so many entries don't expire at the same instant." },
      { question: "What's the tradeoff in choosing a very short TTL versus a very long one?", answer: "A short TTL keeps data fresher but causes more misses, pushing load back onto the underlying system and shrinking caching's benefit. A long TTL maximizes hits and load reduction but serves stale data for longer after the data changes." },
      { question: "What is \"stale-while-revalidate,\" and what problem does it solve?", answer: "When a cached value expires, the request still gets the stale value immediately while a background request refreshes it. The user doesn't wait on the slow recompute; the cost is that one response is slightly outdated." },
      { question: "What is negative caching, and why cache the absence of something?", answer: "Caching the fact that a lookup found nothing (e.g. \"no user with this id\"), so repeated requests for the same missing value don't keep hitting the expensive system just to hear 'not found'. Useful when misses are frequent, like repeated lookups of invalid or deleted ids." },
      { question: "What's the difference between LRU and LFU eviction policies, and when would LFU beat LRU?", answer: "LRU (Least Recently Used) evicts what hasn't been accessed for the longest time. LFU (Least Frequently Used) evicts what has been accessed the fewest times overall. LFU wins when a truly popular item goes briefly unused: LRU might evict it in favor of a rarely used item that was touched more recently." },
      { question: "What happens if a cache runs out of memory and no eviction policy is deliberately chosen?", answer: "Most caches fall back to a default eviction policy (often LRU) rather than refusing writes or crashing. But relying on an unchosen default means you never decided which data to keep, and something important can be silently evicted under memory pressure." },
      { question: "What's the difference between a local (in-process) cache and a distributed cache like Redis, and what does each trade off?", answer: "A local cache lives in one server's memory: very fast with no network hop, but only that server sees it and it's lost on restart. A distributed cache is a separate shared service all servers use: consistent across servers, but it adds a network round trip and another dependency to run." },
      { question: "Scenario: 10 app servers each keep their own local in-memory cache. What consistency problem does this create, and how would a distributed cache change it?", answer: "Each server can hold a different, separately stale version of the same key, so a user's answer depends on which server handles the request. A shared distributed cache gives every server the same view, at the cost of a network call instead of a local memory read." },
      { question: "What is cache key design, and why does a poorly designed key silently break caching correctness?", answer: "The key must capture everything that affects the result. If two logically different requests (different filters, users or locales) map to the same key, one can silently get the other's result. That's a correctness bug, not just a performance one." },
      { question: "Scenario: an API endpoint takes query params for pagination and filters. How would you design the cache key, and what happens if you get it wrong?", answer: "Include every param that changes the response (page number, page size, each filter value), normalized into a consistent order. Get it wrong (e.g. key only on the path) and a page 2 request could get page 1's cached response, or one user's filtered results could leak into another user's request." },
      { question: "Why does adding a cache sometimes make debugging production issues harder?", answer: "Bugs can become intermittent and depend on cache state. The same request can behave differently on a hit versus a miss, or fail only after data changed but before the cache caught up, which is harder to reproduce than one consistent code path." },
      { question: "What is cache warming, and when is it necessary?", answer: "Filling a cache with expected data before real traffic arrives, instead of waiting for misses to fill it. Useful after a deploy, a cache restart or before an expected traffic spike, so the system isn't hit by a wave of cold-cache misses." },
      { question: "Scenario: a freshly deployed, empty distributed cache goes live right as a traffic surge hits. What could go wrong, and how would you prevent it?", answer: "Every request misses at once, so the whole surge lands on the database or service just when it's least ready, possibly overwhelming it. Warm the cache beforehand, or ramp traffic up gradually, so a cold cache doesn't meet peak load." },
      { question: "What's the difference between invalidating a cache entry and simply letting it expire via TTL?", answer: "Invalidation is an immediate removal or update triggered by a known data change, so the cache is corrected right away. TTL expiry is passive and time-based: unless you also invalidate, the entry can be served stale for up to the full TTL after the data changes." },
      { question: "Scenario: an e-commerce product's price is updated in the database, but the cache isn't explicitly invalidated. What could go wrong, and for how long?", answer: "Customers can keep seeing (and buying at) the old price until the TTL expires, possibly for the whole TTL window. That's why price-sensitive writes usually pair a short TTL with explicit invalidation on update instead of relying on TTL alone." },
      { question: "What is \"cache coherence,\" and why is it harder in a multi-server or multi-region setup?", answer: "Cache coherence means every cache holding a copy of the same data agrees. Across many servers or regions, invalidating one cache doesn't invalidate the others, so you need a way to spread the change everywhere (like a pub/sub invalidation broadcast), and that takes time." },
      { question: "How does application-level caching differ from HTTP/CDN caching in where each sits in the request path?", answer: "CDN/HTTP caching sits in front of the app, often close to the user, and can answer without the request reaching your servers. App-level caching sits inside your infrastructure: it skips expensive internal work (like a database query), but the request still has to reach your server." },
      { question: "Why can caching mask an underlying performance problem rather than truly solving it?", answer: "If a query is slow because of a missing index or poor data model, caching hides it only for hits. Every miss and every uncached path still pays the full cost, and the problem returns as soon as the cache is cleared, overwhelmed or bypassed." },
      { question: "What is a lock-based (\"single-flight\") approach to preventing stampede, and how does it work mechanically?", answer: "On a miss, the first request takes a lock (or marker) saying \"I'm recomputing this\", does the work, fills the cache and releases the lock. Other requests for the same key see the lock and wait for that result, or briefly serve a stale value, instead of each redoing the work." },
      { question: "Scenario: a cache uses a 24-hour TTL and is also manually invalidated on writes. What can still go wrong if the invalidation has a race condition with a concurrent read?", answer: "A read can fetch the old value at nearly the same moment a write invalidates the cache, then win the race and re-cache the old value right after the invalidation. That stale value then stays for up to the full 24-hour TTL, because nothing triggers another invalidation until the next write." },
      { question: "Why is caching a poor fit for data with strict consistency requirements, like a bank balance mid-transaction — and what's an alternative if you must speed up reads there?", answer: "Any cache can lag the true value, which is unacceptable when a stale read could let someone spend money that isn't there. Instead, speed up the read path itself (better indexes, a fast replica kept synchronously consistent) rather than trading correctness for speed." },
      { question: "What's the relationship between cache hit ratio and total system load, and what does a \"good\" hit ratio depend on?", answer: "Each hit is a request the underlying system never handles, so a higher hit ratio directly cuts its load. What's \"good\" depends on how often the workload repeats requests: if nearly every request is for unique data, no tuning gives a high hit ratio." },
      { question: "Follow-up: your cache's hit ratio unexpectedly drops from 95% to 40%. What would you check?", answer: "Whether the cache was cleared or restarted (cold cache). Whether TTLs were shortened or a deploy changed cache keys, so requests no longer match existing entries. Whether traffic shifted toward unique requests. Whether memory pressure is evicting entries early." },
      { question: "What is consistent hashing, and why does a distributed cache often use it when adding or removing nodes?", answer: "Consistent hashing places keys and cache nodes on the same ring; each key belongs to the next node around it. Adding or removing a node only moves the keys near that node. With naive `hash(key) % nodeCount`, changing the node count remaps almost every key and causes a mass cache miss." },
      { question: "Common misconception: \"the cache is just an optimization, it can't be a source of bugs.\" Why is this wrong?", answer: "A cache has its own state (what's cached, for how long, under what key) that can drift from the source of truth. Stale reads, a bad key leaking one user's data to another, or a stampede overwhelming the backend are real cache-caused bugs, not just lost performance." },
      { question: "Scenario: two concurrent requests both miss the cache for the same key at the same moment, with no stampede protection. Walk through what happens under cache-aside.", answer: "Both see a miss, both go to the data source and do the full expensive work, and both write nearly the same result into the cache. The second write is redundant, but the real cost is that the underlying system took two hits (or many more under heavy concurrency) for what should have been one." },
    ],
    prerequisites: ["databases"],
    relatedTopics: ["databases", "load-balancing", "cdn"],
    keywords: ["cache", "cache hit", "cache miss", "invalidation", "TTL"],
  },
  {
    id: "database-replication",
    title: "Database Replication",
    level: "intermediate",
    description: "Keep several copies of a database in sync, so no single database is a point of failure.",
    explanation: `
A single database server is a risk: if it goes down, the app loses its data.
**Replication** continuously copies data from one database (the **primary**)
to one or more others (**replicas**), so there's always more than one copy.

Replicas help even when nothing fails. Reads usually far outnumber writes,
so spreading reads across several replicas handles much more traffic than
one database could.
    `.trim(),
    analogy:
      "It's like a company keeping copies of an important ledger in several offices, updated as changes come in. If the main office burns down, another office already has an up-to-date copy. Meanwhile, staff in every office read their local copy instead of all calling the main office.",
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
          { code: "replicaDb.query(...) inside getUser", explanation: "Reads go to a replica, taking read traffic off the primary." },
          { code: "primaryDb.query(...) inside createUser", explanation: "Writes must go to the primary, because replicas are read-only copies." },
          { code: "this change then gets replicated", explanation: "The primary sends the change to every replica, usually after a short delay." },
        ],
      },
    ],
    howItWorks: `
The primary records every change (often in a log) and streams that log to
each replica, which applies the same changes in the same order.

Streaming takes a little time, so a replica is usually slightly behind the
primary. This delay is called **replication lag**.
    `.trim(),
    whyItExists: `
Replication protects you from losing your only database (a replica can be
promoted to take over). It also lets read-heavy apps scale far beyond one
server by spreading reads across many replicas.
    `.trim(),
    whenToUse: `
Add replication once a single database is a reliability risk you can't
accept, or a read bottleneck. Most production databases run at least one
replica for these reasons.
    `.trim(),
    whenNotToUse: `
For a small, early-stage app with low traffic, where brief downtime is
acceptable, one database is simpler to run and reason about. Replication
adds real complexity (replication lag, failover logic) that isn't worth it
until the risk or read load justifies it.
    `.trim(),
    commonMistakes: [
      "Reading from a replica right after writing and being surprised the new data isn't there yet. That's replication lag.",
      "Forgetting that replicas are (usually) read-only and sending writes to one.",
      "Treating replication as a backup. A mistaken delete on the primary reaches every replica just as fast as a real change.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain why spreading reads across replicas helps an app handle more traffic." },
      { difficulty: "Medium", prompt: "Describe what 'replication lag' is and a real case where it could cause a confusing bug." },
      { difficulty: "Hard", prompt: "Explain why replication is not a substitute for backups, even though both keep copies of your data." },
    ],
    interviewQuestions: [
      { question: "What is database replication?", answer: "Continuously copying data from a primary database to one or more replicas, so there's more than one up-to-date copy." },
      { question: "Why do replicas help with read scalability?", answer: "Reads can be spread across many replicas instead of all hitting one database, while writes still go to the primary." },
      { question: "What is replication lag?", answer: "The short delay between a change on the primary and that change appearing on a replica, since replication isn't instant." },
      { question: "What's the difference between synchronous and asynchronous replication?", answer: "In synchronous replication, the primary waits for at least one replica to confirm the write before telling the client it succeeded, so confirmed data exists in more than one place. In asynchronous replication, the primary confirms immediately and streams to replicas afterward. That's faster, but a just-confirmed write may briefly exist only on the primary." },
      { question: "What's the tradeoff of synchronous replication — why doesn't every system just always use it, since it avoids lag?", answer: "Every write waits for a round trip to at least one replica, adding latency. If that replica is slow or unreachable, writes can stall or fail. You trade write speed and availability for the guarantee that a confirmed write already has a second copy." },
      { question: "What is \"semi-synchronous\" replication, and what problem does it try to solve?", answer: "The primary waits for at least one replica (not all) to acknowledge before confirming, then replicates to the rest asynchronously. A confirmed write survives the primary failing alone, without the latency and availability cost of waiting on every replica." },
      { question: "Scenario: a primary crashes with writes that had been confirmed to the client but hadn't yet reached any replica. What happens to that data?", answer: "With asynchronous replication, it's lost. The client was told the write succeeded, but no replica has it, so nothing can be promoted with it. This is exactly the failure synchronous or semi-synchronous replication prevents." },
      { question: "What is failover, and what's the difference between automatic and manual failover?", answer: "Failover is promoting a replica to be the new primary after the primary fails. Manual failover needs a human to spot the failure and trigger it: slower but deliberate. Automatic failover detects and promotes on its own: faster, but risky if detection is wrong (e.g. a network blip mistaken for an outage)." },
      { question: "What is \"split-brain\" in a replicated system, and how does it happen?", answer: "Two nodes both believe they're the primary. Often a network partition makes the old primary unreachable, a replica is promoted, then the old primary comes back still thinking it's in charge. Both accept writes independently, and those writes can conflict or be lost when the partition heals." },
      { question: "How do quorum-based writes help prevent split-brain or ambiguous leadership?", answer: "A write (or leadership claim) is valid only once a strict majority of nodes acknowledge it. Two separate groups can't both have a majority, so at most one side of a partition can have a legitimate primary." },
      { question: "What is the \"read-after-write\" (read-your-writes) consistency problem in replicated systems, and how might a system solve it?", answer: "A user writes data and immediately reads it back, but the read hits a replica that hasn't caught up, so their change seems missing. Common fixes: send that user's reads to the primary for a short time after their write, or always route their reads to the replica they wrote through." },
      { question: "Scenario: a user updates their profile picture, then immediately reloads the page and sees the old one. What's likely happening, and how would you fix it?", answer: "The reload almost certainly read from a replica that hasn't received the update yet: classic replication lag. Give that user a read-your-writes guarantee, e.g. read from the primary briefly after their own write, instead of sending every read to any available replica." },
      { question: "What's the difference between single-leader, multi-leader, and leaderless replication topologies?", answer: "Single-leader: one primary takes all writes and replicas are read-only. Simple, with no write conflicts, but the primary is a write bottleneck and single point of failure. Multi-leader: several nodes accept writes and replicate to each other. Better write availability across regions, but concurrent writes to the same data on different leaders can conflict. Leaderless: any node accepts writes and read/write quorums keep things consistent enough. No leader bottleneck, but conflict resolution and consistency become the client's or system's job." },
      { question: "What kind of conflict can arise in multi-leader replication that doesn't happen in single-leader?", answer: "Two leaders can each accept a write to the same record at nearly the same time. When they replicate to each other, there are two conflicting versions and no obviously correct order between them." },
      { question: "How is a write conflict typically resolved in a multi-leader or leaderless system?", answer: "Common strategies: last-write-wins (keep the later timestamp and silently drop the other), merging the versions with app-specific logic, or surfacing the conflict for a human or the app to resolve. There's no universally right answer, only tradeoffs." },
      { question: "What is \"cascading replication,\" and why might you use it?", answer: "Some replicas copy from other replicas instead of the primary, forming a chain or tree. This reduces the network and CPU load on the primary, at the cost of extra hops (and lag) for replicas further down." },
      { question: "What is log-based (WAL-shipping) replication versus statement-based replication, and what's the tradeoff?", answer: "Log-based replication ships the primary's low-level write-ahead log entries (the exact bytes changed), which replicas apply directly. It's exact and deterministic but tied to the storage engine and version. Statement-based replication ships the SQL statements for each replica to re-run. It's more portable and compact, but any non-deterministic statement can give different results on each replica." },
      { question: "What could go wrong with statement-based replication that log-shipping avoids?", answer: "A statement using something non-deterministic (like `NOW()`, `RAND()`, or an auto-increment value computed separately) can produce a different value on each replica. Replicas silently drift from the primary even though each \"correctly\" ran the same statement." },
      { question: "How would you monitor replication lag in production, and what would you do if it grows unbounded?", answer: "Track lag per replica as a key metric (seconds or bytes behind the primary) and alert past the threshold your app can tolerate. Lag that keeps growing usually means a replica can't keep up with writes. Find what's slowing that replica, route reads away from it for a while, or add capacity or replicas to spread the read load." },
      { question: "Scenario: replication lag balloons from 200ms to 30 seconds during a traffic spike. What's likely the cause, and what are your options?", answer: "Likely a write spike the replica can't apply fast enough, or the replica starved of CPU/IO by a surge of read queries. Options: cut read traffic to that replica for a while, scale it up, or check whether a batch job or write-heavy event caused an unusual burst." },
      { question: "What happens during promotion of a replica to primary, and what risk exists if the old primary comes back online afterward?", answer: "The chosen replica stops applying replication and starts accepting writes, and other replicas and the app are pointed at it. If the old primary returns without being told it was demoted, it may keep accepting writes: split-brain, with two diverging sets of writes to reconcile." },
      { question: "Why is automatic failover risky without careful design?", answer: "It must tell a real primary failure from a brief network blip; a false positive can cause an unneeded promotion and split-brain when the 'failed' primary returns. And a promoted replica may be missing writes the old primary confirmed, risking silent data loss during failover." },
      { question: "How does replication lag relate to the choice of consistency model?", answer: "Replication lag is the mechanical reason eventual consistency exists: an eventually consistent system accepts lag as normal. A strongly consistent system chooses to wait out or avoid that lag on the read path instead." },
      { question: "Scenario: an application always reads from a replica, but a user who just wrote data expects to see it immediately in the same session. What pattern fixes this without going fully synchronous everywhere?", answer: "Read-your-writes routing. Send just that user's reads to the primary (or a replica confirmed to be past their write) for a short time after their write, while everyone else keeps reading from any replica. You pay for the guarantee only where it's needed." },
      { question: "Why does adding more read replicas not help with write scalability?", answer: "Every replica must apply every write to stay in sync. More replicas means more places each write must land, not faster writes on the primary. Write throughput depends on the primary (or another strategy like sharding); replicas only spread reads." },
      { question: "Why can heavy read traffic against a replica itself worsen replication lag?", answer: "A replica's CPU, memory and IO are shared between serving reads and applying replicated writes. If reads use enough of that capacity, it falls behind on writes, so the read scaling replicas exist for can, under heavy load, make their data staler." },
      { question: "What's a realistic strategy for deciding how many replicas to run, and why isn't \"more is always better\"?", answer: "Size for the read throughput you need beyond what the primary (or cache) handles, plus headroom for one replica being down. Each extra replica adds replication work for the primary and another part to monitor and fail over, so unneeded replicas add complexity for capacity you won't use." },
      { question: "Why can it be risky to promote a replica that was itself lagging at the time the primary failed?", answer: "It's missing writes that hadn't reached it yet. Promoting it can lose not only writes no replica had, but also writes that more caught-up replicas already had, once it becomes the new source of truth." },
      { question: "What is chain replication, briefly, and what property does it optimize for?", answer: "Replicas form an ordered chain: writes enter at the head and pass down, and a write is complete only once it reaches the tail. It optimizes for strong consistency with clear rules (e.g. reads from the tail always see fully replicated data), at the cost of write latency growing with chain length." },
      { question: "Scenario: you need strong, immediate consistency for one critical page (an order confirmation) right after a write, but want general read scaling everywhere else. How would you architect this with replication?", answer: "Send reads for that page (or that user's data, briefly after their write) to the primary, and keep every other read on replicas. Apply the stronger guarantee only where staleness would cause a real problem." },
      { question: "Follow-up: what's the cost of routing reads to the primary for that one page?", answer: "It adds load to the primary, which replicas were meant to avoid, and that page's latency now depends on the primary's load. It's an acceptable tradeoff only because it's limited to the one page that needs it." },
      { question: "Why is monitoring replication lag considered a first-class operational metric rather than an afterthought?", answer: "Lag decides how stale every replica read is. Without it, a team can't tell whether eventual consistency is holding at milliseconds or has quietly slipped to minutes, which changes what the rest of the system can safely assume." },
    ],
    prerequisites: ["databases"],
    relatedTopics: ["databases", "sharding", "consistency-models"],
    keywords: ["replication", "primary", "replica", "replication lag", "read scaling"],
  },
  {
    id: "sharding",
    title: "Database Sharding",
    level: "intermediate",
    description: "Split one huge dataset across several databases, so no single database holds all of it.",
    explanation: `
Replication copies the same data many times, which helps reliability and
read scaling. But a dataset can grow so large that its writes, or just its
storage, outgrow any single server, however good the hardware.

**Sharding** splits the data itself into pieces (**shards**), each on a
separate database. A rule decides where each piece goes, usually a
**shard key** such as a user id.
    `.trim(),
    analogy:
      "It's like splitting a huge filing system across cabinets by last name: A-M in one, N-Z in another. Neither holds everything, but together they hold it all, and each only needs room for its share.",
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
          { code: "userId % shardCount", explanation: "A simple way to map any user id to the same shard every time." },
          { code: "databases[shard].query(...)", explanation: "Only the database holding this user's data is queried." },
        ],
      },
    ],
    howItWorks: `
The shard key decides which shard a piece of data belongs to, often through
a hash function so data spreads roughly evenly.

Every read or write for that data goes to its one shard, so each database
only holds and processes a fraction of the total.
    `.trim(),
    whyItExists: `
Some datasets are too large, in size or write traffic, for any single
server. Sharding scales a database horizontally (more machines) instead of
vertically (a bigger machine), the same idea as scalability in general.
    `.trim(),
    whenToUse: `
Shard once a dataset's size or write throughput has truly outgrown a single
(even well-replicated) database. It's usually a late-stage scaling decision.
    `.trim(),
    whenNotToUse: `
Don't shard too early. It adds real complexity: queries that need data from
several shards get much harder, and re-sharding later is painful. Most apps
never reach that scale.

Try simpler options first: a bigger server, replication and caching.
    `.trim(),
    commonMistakes: [
      "Choosing a shard key that spreads data unevenly, e.g. sharding by signup date when most users signed up recently, overloading one shard.",
      "Writing queries that join or aggregate across many shards, which sharding makes much more expensive or awkward.",
      "Sharding before it's needed, taking on real operational complexity for scale you haven't reached.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain the difference between sharding and replication." },
      { difficulty: "Medium", prompt: "Describe a bad shard key for a table of orders, and why it would cause uneven load." },
      { difficulty: "Hard", prompt: "Explain why counting all rows across every shard costs more than the same query on an unsharded database." },
    ],
    interviewQuestions: [
      { question: "What is database sharding?", answer: "Splitting a dataset into pieces, each on a separate database, based on a shard key, so no single database holds all the data." },
      { question: "What's the difference between sharding and replication?", answer: "Replication copies the same data to several databases. Sharding splits different pieces of data across several databases. They solve different scaling problems and are often used together." },
      { question: "What makes a good shard key?", answer: "One that spreads data and load roughly evenly across shards, and that most queries can use to go straight to the right shard without needing others." },
      { question: "What's the difference between range-based and hash-based sharding?", answer: "Range-based sharding gives each shard a continuous range of the key (e.g. user ids 1–1000 on shard A, 1001–2000 on shard B). Related or sequential data stays together and range queries are efficient. Hash-based sharding hashes the key to pick a shard, spreading data roughly evenly but scattering sequential or related data across unrelated shards." },
      { question: "What's a downside of range-based sharding regarding hotspots — for example, sharding orders by order id or timestamp?", answer: "The range holding the newest data (the highest order ids, or today's dates) gets nearly all new writes and recent reads, while older ranges on other shards sit mostly idle. That defeats the point of spreading load." },
      { question: "Scenario: a table is sharded by `userId % 4`. What happens when you need to add a 5th shard?", answer: "For almost every user, `userId % 5` points to a different shard than `userId % 4` did, so nearly all data must be moved. A naive modulo scheme makes adding or removing shards hugely disruptive instead of incremental." },
      { question: "What is consistent hashing, and how does it solve the resharding problem above?", answer: "Consistent hashing places keys and shard nodes on the same ring; each key belongs to the next node around it. Adding or removing a node only reassigns the keys near that node, instead of remapping almost every key like plain modulo." },
      { question: "What is a \"hot shard,\" and give a concrete example of a shard key that would create one?", answer: "A shard that gets far more traffic or data than the others and becomes a bottleneck, even though the system is \"sharded\". Example: sharding by `country` when 80% of users are in one country. That shard carries most of the load however many shards exist." },
      { question: "What is \"directory-based\" sharding, and what's its tradeoff versus computed (hash or range) sharding?", answer: "A directory keeps an explicit lookup table from each key (or range) to its shard instead of computing it. It's more flexible, since individual keys can be moved independently, but the lookup table becomes critical shared infrastructure and a possible bottleneck that computed schemes avoid." },
      { question: "Why is choosing a shard key one of the hardest, most consequential decisions in a sharded system?", answer: "It decides how evenly load spreads, whether common queries can go to a single shard, and how costly resharding will be. Get it wrong and you face hot shards, constant cross-shard queries or a painful migration, often found only once real traffic hits." },
      { question: "Why is it hard to change a shard key after a system is already in production?", answer: "You must recompute the shard for every row and move the data that changes owner, while serving live traffic. It's a full data migration under production load, not a config change." },
      { question: "What does \"resharding\" require operationally, and why is it considered risky and expensive?", answer: "Moving data between shards under a new scheme, updating routing so queries find it, and doing it without losing writes or serving inconsistent reads mid-migration, usually with careful dual writes or a gradual cutover. A mistake can corrupt or lose data across the whole dataset, not just one shard." },
      { question: "Why do cross-shard joins become expensive or impossible, and what's the usual workaround?", answer: "A join compares matching rows, but if they live on different machines the database can't do it locally. Data must be fetched from several shards and joined in the app or a coordinating layer. The usual workaround is denormalizing so data needed together lives on the same shard, or replacing joins with separate queries the app stitches together." },
      { question: "What is a \"scatter-gather\" query, and why is it slower than a single-shard query?", answer: "A query sent to every shard (or many) in parallel, with results combined afterward. It multiplies database round trips, and total response time depends on the slowest shard, not the average." },
      { question: "Scenario: \"how many total orders were placed today\" across 8 shards — what does this actually require, and why is it more expensive than on an unsharded database?", answer: "A scatter-gather: ask all 8 shards for their count and sum the results in the app (or a coordinator). That's 8 queries plus a merge, only as fast as the slowest shard, where an unsharded database does one local count." },
      { question: "What is a distributed transaction across shards, and why is achieving atomicity harder there than within a single database?", answer: "A transaction whose writes span several shards (separate databases), which must all commit or all roll back. Each shard can succeed or fail on its own and there's no shared transaction log to decide the outcome, so the shards must explicitly coordinate to agree." },
      { question: "What is two-phase commit (2PC), briefly, and what's its main operational downside?", answer: "A coordinator asks every shard to \"prepare\" (confirm it can commit), and only when all agree tells them to commit. The main downside: if the coordinator crashes after some shards prepared but before telling them to commit, those shards hold locks indefinitely and can't safely commit or abort on their own." },
      { question: "Why do most sharded systems try to avoid needing cross-shard transactions altogether, rather than solve them with 2PC?", answer: "2PC adds latency (extra coordination round trips on every transaction) and availability risk (a stuck coordinator can block shards indefinitely). It's usually much cheaper to design the shard key and data model so transactions stay within one shard." },
      { question: "What's the relationship between sharding and replication — are they mutually exclusive?", answer: "No, they're usually combined. Each shard is typically replicated too. Sharding solves \"too much data or write volume for one machine\"; replication solves \"each shard's machine shouldn't be a single point of failure\"." },
      { question: "Scenario: a shard holding a very popular user's data on a social app becomes overloaded while other shards sit idle. What's this called, and how might you fix it without resharding everyone?", answer: "A hot shard (also called a hotspot or the \"celebrity problem\"). A targeted fix is moving that one heavy key to its own dedicated shard, or splitting its data further (e.g. by content id instead of user id for that user), instead of resharding everything for a few outlier keys." },
      { question: "Why can sharding by a monotonically increasing key, like an auto-incrementing id or a timestamp, create a hotspot?", answer: "New rows always have the highest key value, so under range-based sharding they all land in the current range on one shard. Every new write hits that shard, however many shards exist." },
      { question: "What's a composite shard key, and why might you use one instead of a single field?", answer: "A shard key built from several fields (e.g. `tenantId` + `userId`). Useful when one field alone would spread data unevenly or not match your queries. Combining fields can spread load more evenly while keeping related data (like everything for one tenant) groupable." },
      { question: "What is geo-sharding, and what benefit does it offer beyond raw scaling?", answer: "Assigning shards by region, so a user's data lives on a shard near them. Besides spreading load, it lowers latency and can help meet data-residency rules that require some users' data to stay in a specific country or region." },
      { question: "Scenario: you need to move a single large tenant's data from an overloaded shard to a new, empty shard, without downtime. What does this actually require?", answer: "Typically: dual-write the tenant's new changes to both old and new shards, backfill their existing data into the new shard, verify the copies match, then atomically switch the tenant's routing to the new shard and stop writing to the old one. The tenant keeps working normally throughout." },
      { question: "What's the difference between a \"local\" secondary index and a \"global\" secondary index in a sharded system?", answer: "A local index lives inside each shard and covers only that shard's data. It's cheap to maintain, but a query using it must still scatter-gather across all shards. A global index covers all shards in one structure, so a query can use it directly, but it needs its own infrastructure and must stay in sync with writes on every shard." },
      { question: "Why is a global secondary index harder to maintain consistently than a local one?", answer: "Every write on any shard must also update this shared structure, which sits outside any single shard's transaction. Keeping it exactly in sync under concurrent writes and partial failures is a hard distributed-consistency problem. A local index just updates alongside its own shard's data." },
      { question: "What happens to a unique constraint (like a unique email) when a table is sharded by a different key (like user id)?", answer: "The database can no longer enforce it alone: two rows with the same email could land on different shards that know nothing of each other. You need a separate global index or lookup service to check uniqueness, or weaker guarantees (check at write time and reconcile rare conflicts afterward)." },
      { question: "Why is capacity planning for shard count inherently an estimate, and what happens if you pick too few or too many?", answer: "It depends on data growth and traffic that are hard to predict. Too few shards and you hit the scaling wall sooner than planned. Too many and you pay extra complexity and cross-shard overhead for capacity you don't need yet. Many systems create many logical shards on fewer physical machines up front, so growth means moving logical shards instead of re-sharding the keyspace." },
      { question: "What's a common mistake teams make by sharding too early?", answer: "Taking on cross-shard queries, harder transactions and operational overhead before the data or write volume has outgrown a single well-tuned, replicated database. Simpler options (better indexes, caching, a bigger server, read replicas) often would have bought plenty of headroom first." },
      { question: "Scenario: `country` is used as a shard key, but 80% of your users are in one country. What goes wrong, and what would you do differently?", answer: "One shard carries about 80% of the load while the rest sit mostly idle, so the bottleneck is still there. Use a key that spreads load more evenly, e.g. a hash of user id, or sub-shard within the dominant country instead of treating it as one unit." },
      { question: "Follow-up: what if you must keep `country` as the shard key for compliance reasons (data residency), despite the imbalance — what other levers do you have?", answer: "Shard further within that country (e.g. by a hash of user id, keeping all its shards in the required region), give that region more physical shards than smaller regions, or add caching and read replicas in that region to absorb load the shard key can't rebalance." },
      { question: "Why does adding an index need to be done identically across every shard, and what happens if that gets out of sync?", answer: "Each shard is a separate database, so an index created on one isn't created on the others. If indexes differ, the same query can be fast on some shards and slow (or use a different plan) on others, so performance depends on which shard serves the request." },
      { question: "How does sharding interact with a database's referential integrity (foreign keys) across shards?", answer: "A foreign key is enforced by checking the referenced row exists in the same database. If the two rows can be on different shards, no single database can check it, so cross-shard referential integrity usually has to be handled by app logic." },
    ],
    prerequisites: ["databases", "database-replication"],
    relatedTopics: ["database-replication", "consistent-hashing", "scalability"],
    keywords: ["sharding", "shard key", "partitioning", "horizontal scaling"],
  },
  {
    id: "consistency-models",
    title: "Consistency Models",
    level: "intermediate",
    description: "How quickly and how strictly every copy of your data must agree.",
    explanation: `
Once data is copied across databases (replication) or regions, a question
comes up: after you change one copy, when will every other copy show it,
and how reliably? A system's answer is its **consistency model**.

- **Strong consistency**: every read, everywhere, always sees the latest
  write, as if there were only one copy.
- **Eventual consistency**: a write may take a moment to reach every copy,
  but given enough time (and no new writes), all copies agree.
    `.trim(),
    analogy:
      "Strong consistency is like one shared whiteboard everyone reads directly: the moment someone writes, everyone sees it. Eventual consistency is like everyone taking their own photo of the whiteboard and syncing later: for a while some photos are a version behind, but eventually they all match.",
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
          { code: "await write(userId, ...)", explanation: "Changes one copy of the data." },
          { code: "strictRead(userId)", explanation: "Always reflects that write immediately, whichever copy answers." },
          { code: "eventualRead(userId)", explanation: "Might be answered by a copy that hasn't received the update yet." },
        ],
      },
    ],
    howItWorks: `
Strong consistency usually routes every read through one source of truth,
or requires several copies to confirm a write before it counts. That costs
latency, and availability during network problems.

Eventual consistency lets each copy apply a write at its own pace. That's
faster and more resilient to failures, but there's a short window where
reads can return stale data.
    `.trim(),
    whyItExists: `
There's an unavoidable tradeoff between how fast and reliable a system
stays under failures and how up to date every read is guaranteed to be.
Each app picks its spot based on how much staleness it can tolerate.
    `.trim(),
    whenToUse: `
Use strong consistency where staleness causes real harm: an account balance
checked before a withdrawal, an inventory count at checkout.

Use eventual consistency where a short delay doesn't matter: a like count, a
follower count, a search index.
    `.trim(),
    whenNotToUse: `
Don't default to strong consistency everywhere "to be safe". It costs real
latency and availability, and most data (activity feeds, view counts,
recommendations) doesn't need it.
    `.trim(),
    commonMistakes: [
      "Assuming all databases are strongly consistent by default. Many popular distributed databases default to eventual consistency for performance.",
      "Using eventually consistent reads for something that truly needs strong consistency, like a payment balance.",
      "Treating 'eventual' as 'never'. In a healthy system it usually resolves in milliseconds to seconds.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Give one example of data where eventual consistency is fine, and one where it isn't." },
      { difficulty: "Medium", prompt: "Explain why strong consistency tends to cost more latency than eventual consistency." },
      { difficulty: "Hard", prompt: "Describe a real bug that could happen if a signup flow read a user's data with eventual consistency right after writing it." },
    ],
    interviewQuestions: [
      { question: "What's the difference between strong and eventual consistency?", answer: "Strong consistency guarantees every read sees the latest write immediately. Eventual consistency allows a short delay before all copies agree, trading immediacy for speed and resilience." },
      { question: "Why would a system choose eventual consistency over strong consistency?", answer: "It's usually faster and more available, especially during network issues, because a write doesn't need every copy to confirm before it's complete." },
      { question: "Give an example where eventual consistency would be an acceptable trade-off.", answer: "A like or view count on social media. Being off by a few for a moment harms nobody." },
      { question: "What is linearizability, and how is it a stronger guarantee than what people often casually call \"strong consistency\"?", answer: "Every operation appears to happen atomically at a single instant between its call and its return, and all clients agree on one global order, as if there were one copy updated one operation at a time. It's the strictest, most precisely defined form of strong consistency, not just \"reads see recent writes\"." },
      { question: "What's the difference between strong consistency and causal consistency?", answer: "Strong consistency requires everyone to see every operation in the same real-time order. Causal consistency only requires that causally related operations (one happened because of, or after seeing, another) appear in the same order to everyone. Unrelated operations can appear in different orders to different observers, which is cheaper to guarantee." },
      { question: "Give a concrete scenario where causal consistency matters, but plain eventual consistency alone would produce a confusing result.", answer: "A reply reaches a reader's replica before the comment it replies to, so they see a reply to a comment that doesn't seem to exist. Causal consistency prevents this: since the reply depended on seeing the original, no replica shows the reply without the original." },
      { question: "What is \"monotonic reads\" as a consistency guarantee, and what bug does it prevent?", answer: "Once a client has seen a value (or a later one), it never sees an older value afterward. It prevents refreshing a page and seeing something you already saw disappear or revert because a later read hit a more lagged replica." },
      { question: "What is \"read-your-writes\" consistency, and how is it distinct from monotonic reads?", answer: "Read-your-writes guarantees a client always sees its own earlier writes. Monotonic reads is broader and not about authorship: a client never sees time go backward on reads, whoever made the write, including other users." },
      { question: "What is \"monotonic writes\" consistency?", answer: "Writes from one client are applied everywhere in the order that client sent them. A client's second write is never applied before its first, which could otherwise leave data in an unintended order (e.g. an 'undo' applied before the action it undoes)." },
      { question: "What does quorum-based consistency (R + W > N) mean, and why does that formula guarantee an overlap?", answer: "N is the number of replicas holding the data, W is how many must acknowledge a write, and R is how many a read consults. If R + W > N, any W replicas that accepted a write and any R replicas a read consults share at least one replica, so every read reaches at least one replica with the latest write." },
      { question: "Scenario: N=3 replicas, W=2, R=1. Is this configuration guaranteed to always read the latest write?", answer: "No. R + W = 3, which isn't greater than N (3), so there's no guaranteed overlap. A read could hit the one replica that wasn't among the two that accepted the write and return a stale value." },
      { question: "Scenario: N=3, W=2, R=2. Is this configuration now guaranteed to read the latest write?", answer: "Yes. R + W = 4 > N (3), so any 2 replicas a read consults overlap with at least one of the 2 that accepted the write. The read sees it (or something newer), at the cost of contacting 2 replicas per read instead of 1." },
      { question: "What's the difference between \"sequential consistency\" and \"linearizability\"?", answer: "Both require all clients to agree on one global order of operations. Linearizability also requires that order to respect real time: if A finished before B started, A comes first. Sequential consistency drops that rule; any single order is fine as long as everyone agrees on it, even if it doesn't match real time." },
      { question: "What is PACELC, and how does it extend the CAP theorem's tradeoff?", answer: "CAP only covers the tradeoff during a network Partition (Availability vs Consistency). PACELC adds that Else, with no partition, a system still trades Latency vs Consistency, because waiting for more replicas to agree always costs latency. So consistency is a tradeoff almost all the time, not just during failures." },
      { question: "Explain CAP theorem precisely — what does it actually claim?", answer: "In a distributed system, during a network partition (some nodes can't reach others), you must choose between Consistency (every node sees the same latest data) and Availability (every request gets a response). You can't guarantee both at that moment. It says nothing about normal operation, where both are often possible." },
      { question: "Common misconception: \"CAP theorem means a system is either CP or AP, all the time.\" Why is this an oversimplification?", answer: "CAP's tradeoff applies only during a partition; otherwise a well-designed system can be both consistent and available. Many systems are tunable per operation instead of locked to one label. And CAP ignores the latency-vs-consistency tradeoff that exists even without a partition (which PACELC adds)." },
      { question: "What is a vector clock, and what problem does it solve in a system with no single global clock?", answer: "A small set of per-replica counters attached to each write, incremented by the replica that made it. Comparing two vector clocks shows whether one write happened before the other, after it, or neither (a true conflict). It orders events across machines without perfectly synced clocks." },
      { question: "What is a CRDT (Conflict-free Replicated Data Type), and how does it let replicas merge conflicting writes without coordination?", answer: "A data structure designed so merging any two independently updated copies always gives the same result, whatever the merge order. For example, an increment-only counter merges by summing each replica's increments. Replicas accept writes independently and merge later, with no locking or coordination during the write." },
      { question: "What is \"read repair\" in a leaderless replicated system, and how does it help move toward consistency?", answer: "When a read consults several replicas and they disagree, it finds the stale ones and writes the newer value back to them as part of that read. Over time this brings lagging replicas back in sync without a separate repair process." },
      { question: "What is \"tunable consistency\" (as in systems like Cassandra), and why might different requests in the same app choose different levels?", answer: "Each read or write sets its own consistency level (e.g. how many replicas must respond) instead of one system-wide setting. An app might use a strong, higher-quorum read for a payment balance and a fast single-replica read for a view counter, paying for the guarantee only where the data needs it." },
      { question: "Scenario: a shopping cart uses eventual consistency. A user adds an item on their phone, then immediately opens the site on their laptop and doesn't see it. What guarantee is missing, and what would fix this specific flow?", answer: "Read-your-writes. The laptop's read hit a replica that hadn't received the phone's write. Fix it by routing this user's reads, for a short time, to a replica known to have their writes (or to the primary) instead of any replica." },
      { question: "Scenario: an inventory count uses eventual consistency across regions. Two customers in different regions both see \"1 in stock\" and both complete checkout. What went wrong, and how would you prevent overselling?", answer: "Neither region's replica had seen the other's near-simultaneous decrement, so both saw stock that no longer existed once both writes landed. That's a classic result of concurrent writes under eventual consistency. Prevent it with a strongly consistent check for the decrement-and-reserve step (through a single source of truth), or accept it and handle oversells afterward (e.g. refund or backorder one order)." },
      { question: "Why is \"eventually consistent\" not the same as \"eventually correct\"? What happens if writes never stop?", answer: "It only promises that if writes stopped, every replica would eventually converge to the same value. It says nothing about that value being correct for the business. And if writes never stop, replicas may never fully agree, always chasing a moving target." },
      { question: "What does \"consistency\" mean specifically in the CAP theorem, and how does it differ from the \"C\" in ACID?", answer: "In CAP it means linearizability: every read sees the latest write, as if there were one copy. In ACID it means a transaction only moves the database from one valid state (meeting its constraints and invariants) to another. That's about correctness rules, not how fast replicas agree." },
      { question: "Mechanically, why can a strongly consistent system become unavailable during a network partition?", answer: "Guaranteeing reads see the latest write usually needs a quorum of reachable, agreeing replicas (the R+W>N logic). If a partition leaves no side with a majority, the system can't safely confirm the guarantee, so it refuses requests until the partition heals rather than return stale or conflicting data." },
      { question: "What's the practical latency cost difference between reading from a single node versus reading with a quorum?", answer: "A single-node read is one round trip and returns when that node answers. A quorum read contacts several replicas and waits for enough to respond (often comparing answers), so it's bounded by the slowest of them. That's noticeably slower, especially when replicas are in distant regions." },
      { question: "What is causal consistency's relationship to \"happens-before\" ordering?", answer: "It's defined by it. If A happens-before B (B read a value A wrote, or they ran in sequence on the same client), every replica must show A before B. Operations with no happens-before link can appear in any order on different replicas." },
      { question: "Scenario: a chat app shows a reply before the message it was replying to, on one user's screen. What consistency guarantee failed?", answer: "Causal consistency. The reply depends on the original message existing, so any weaker model (like plain eventual consistency without causal tracking) can let a replica show them out of order." },
      { question: "Why do many real-world systems mix consistency levels rather than picking one globally?", answer: "Staleness costs very different amounts for different data. A wrong payment balance is a damaging bug; a view count off by a few for a second is invisible. Strong consistency everywhere wastes latency and availability on data that doesn't need it, so systems pay for it only where staleness causes harm." },
      { question: "What's a \"stale read,\" precisely, and is it always a bug?", answer: "A read that returns a value older than the latest completed write, because a replica (or cache) hadn't applied that write yet. Whether it's a bug depends on the data: harmless for an eventually consistent view counter, serious for an account balance used to approve a withdrawal." },
      { question: "Follow-up: give one scenario where a stale read is completely fine, and one where it's a serious bug.", answer: "Fine: a profile's follower count a few seconds behind. Serious: a fraud check reading a stale \"not flagged\" status just after the account should have been flagged, letting through the very transaction it was meant to block." },
      { question: "What does it mean for a consistency model to provide guarantees \"per session\" versus \"global\" guarantees?", answer: "A per-session guarantee (like read-your-writes or monotonic reads) holds only from one client's view of its own operations; other clients may see a different order. A global guarantee (like linearizability) gives one agreed order for every client at once, which is harder and more expensive." },
      { question: "Why is achieving strict linearizability across multiple geographically distant data centers particularly costly, and what do most geo-distributed systems do instead?", answer: "It needs coordination with distant replicas on every operation, and the speed of light sets a floor on that round trip across continents, often tens to low hundreds of milliseconds per operation. Most geo-distributed systems use a weaker model for most operations (causal consistency, or strong consistency within a region plus async cross-region replication) and keep global linearizability for the few operations that truly need it." },
    ],
    prerequisites: ["database-replication"],
    relatedTopics: ["cap-theorem", "database-replication", "sharding"],
    keywords: ["consistency", "strong consistency", "eventual consistency", "staleness"],
  },
  {
    id: "rate-limiting",
    title: "Rate Limiting",
    level: "intermediate",
    description: "Cap how many requests a client can make in a set time window.",
    explanation: `
Without a limit, one client (malicious, buggy or just very active) could
send so many requests that the service slows down for everyone.

**Rate limiting** caps how many requests a client (by user, API key or IP
address) can make in a time window. Requests over the cap are rejected or
delayed.
    `.trim(),
    analogy:
      "It's like a nightclub bouncer who lets in only so many people per minute, however long the line. Not because the club dislikes visitors, but because letting everyone in at once would be a disaster for those already inside.",
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
          { code: "!entry || now - entry.windowStart > windowMs", explanation: "Starts a new counting window if there isn't one yet or the last one has expired." },
          { code: "entry.count >= limit", explanation: "Rejects the request if this window's limit is already reached." },
          { code: "entry.count++", explanation: "Otherwise counts this request and lets it through." },
        ],
      },
    ],
    howItWorks: `
Each request is checked against a counter for that client over a time
window: fixed windows (like "per minute") or smoother sliding windows.

If the client is under the limit, the counter goes up and the request
proceeds. At or over the limit, the request is rejected, usually with HTTP
429 "Too Many Requests", until the window resets.
    `.trim(),
    whyItExists: `
Rate limiting stops a service from being overwhelmed, whether by a real
traffic spike, a buggy client stuck in a retry loop, or deliberate abuse. It
also stops one client's heavy use from hurting everyone else.
    `.trim(),
    whenToUse: `
Add rate limiting to any public API, especially for expensive operations
(search, sending emails, calling a paid third-party service) or ones open
to abuse (login attempts, password resets).
    `.trim(),
    whenNotToUse: `
Don't set limits so tight that normal use gets rejected. Base them on real
usage, and tell clients clearly how long until the limit resets so
well-behaved ones can adapt.
    `.trim(),
    commonMistakes: [
      "Setting limits so low that normal use gets rejected, frustrating real users.",
      "Limiting only by IP address. That fails when many users share one IP (like an office) and is easy to dodge with many IPs.",
      "Not telling the client why the request was rejected and when to retry, so the limit feels arbitrary.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain why an API with no rate limit is vulnerable to a single misbehaving client." },
      { difficulty: "Medium", prompt: "Describe the difference between rate limiting by IP address and by authenticated user id, and a downside of each." },
      { difficulty: "Hard", prompt: "Explain why a 'fixed window' rate limiter can allow twice the intended limit at the boundary between two windows, and how a 'sliding window' avoids that." },
    ],
    interviewQuestions: [
      { question: "What problem does rate limiting solve?", answer: "It stops one client from overwhelming a service with too many requests, whether from abuse, bugs or unexpectedly heavy legitimate use." },
      { question: "What HTTP status code typically indicates a rate limit was hit?", answer: "429 Too Many Requests." },
      { question: "What's a weakness of rate limiting purely by IP address?", answer: "Many legitimate users can share one IP (like an office network), and an attacker can fairly easily spread requests across many IPs to dodge the limit." },
      { question: "What is the token bucket algorithm, mechanically?", answer: "A bucket holds tokens and is refilled at a steady rate up to a maximum capacity. Each request uses one token; if the bucket is empty, the request is rejected (or queued). It allows short bursts up to the capacity while the refill rate enforces a steady average." },
      { question: "What does the token bucket's capacity (burst size) control, separately from its refill rate?", answer: "The refill rate sets the long-run average rate. The capacity sets how big a burst can be spent at once before the client must wait for tokens to come back. One knob for sustained rate, one for burst tolerance." },
      { question: "What is the leaky bucket algorithm, and how does it differ from token bucket in the traffic pattern it produces?", answer: "Requests enter a queue (the bucket) and are processed (leak out) at a strictly constant rate, however bursty the input. Token bucket lets a burst through immediately up to its capacity; leaky bucket smooths bursts into a steady output. That suits a downstream system that needs even load, not just a fair average." },
      { question: "Scenario: an API should allow occasional bursts but enforce a steady average rate. Token bucket or leaky bucket, and why?", answer: "Token bucket. It's designed to let saved-up capacity be spent in a burst while the refill rate caps the long-run average. Leaky bucket would flatten that burst into a steady trickle, the wrong fit when real bursts should go through immediately." },
      { question: "What's the fixed window counter's boundary problem? Walk through it with a concrete example.", answer: "With 100 requests per minute, a client could send 100 in the last second of one window (11:00:59) and 100 more in the first second of the next (11:01:00): 200 requests in about 2 seconds, while each window's limit is technically respected. Fixed windows only look at aligned clock-minute buckets, not any rolling one-minute span." },
      { question: "What is the sliding window log algorithm, and why is it the most accurate but least memory-efficient approach?", answer: "It stores a timestamp for every request in the current window. On each new request, it drops timestamps older than the window and counts the rest. It's exact because it uses a true rolling window, but storing one timestamp per request instead of a single counter gets expensive at high volume." },
      { question: "What is the sliding window counter, and how does it approximate the log algorithm cheaply?", answer: "It keeps only two fixed-window counters (current and previous) and estimates the rolling count by weighting the previous window's count by how much of it still overlaps the sliding window. Close to the log's accuracy with two numbers instead of a list of timestamps." },
      { question: "Walk through the sliding window counter's formula with a concrete example.", answer: "If we're 25% into the current 1-minute window (15 seconds in), the estimate is `current window count + previous window count × (1 − 0.25)`. That counts 75% of the previous window's requests toward the present rolling view, a close approximation without storing every timestamp." },
      { question: "Why is distributed rate limiting harder than single-server rate limiting?", answer: "One server can keep a counter in memory. But if a client's traffic is spread across many servers, each local counter sees only part of it and none knows the true total, so the effective limit is quietly multiplied by the number of servers handling that client." },
      { question: "Scenario: an API is rate-limited per-user, but requests are load-balanced across 10 stateless app servers, each keeping counts in local memory. What goes wrong?", answer: "The user's requests spread roughly evenly across the 10 servers, and each only counts what it saw. The user can effectively make up to 10× the intended limit without any one server seeing them go over." },
      { question: "What's the standard fix for distributed rate limiting?", answer: "Move the counter out of each server's memory into one shared, fast store (commonly Redis) that every server checks and updates, so the count reflects the client's true total." },
      { question: "Why must the increment-and-check operation in a shared Redis-based rate limiter be atomic, and what race condition happens if it's not?", answer: "If two servers both read the count, both see it under the limit, and both increment, both requests are allowed even though the total is now over the limit. That's a classic check-then-act race. Making read-check-increment one atomic operation closes it." },
      { question: "What Redis feature is commonly used to make this atomic?", answer: "Either `INCR` (atomically increments and returns the new value, so you check the returned value) together with `EXPIRE` for the window, or a small Lua script that Redis runs atomically so the whole check-and-increment is one indivisible step." },
      { question: "What impact does clock skew have on distributed rate limiting across multiple servers or regions?", answer: "If servers disagree slightly on the time, window boundaries shift depending on whose clock is used. A client's requests can fall into what one server sees as a new window while another sees the old one, giving a little extra allowance. Use the shared store's own clock for window math instead of each server's local clock." },
      { question: "What's the difference between rate limiting and backpressure/load shedding?", answer: "Rate limiting caps how much a given client may send, by a policy set in advance, regardless of current server load. Backpressure/load shedding is the server slowing or rejecting requests based on its own real-time capacity, whichever client they're from. A rate limit can still let through traffic that overwhelms an already struggling server." },
      { question: "Why might you rate limit by API key or user id rather than IP address for an authenticated API, and when would you still also want IP-based limiting?", answer: "An API key or user id is stable and tied to one real client, avoiding IP sharing and evasion problems. You still want IP-based limits in front of authentication, e.g. on login, where there's no user id yet and you must limit unauthenticated abuse." },
      { question: "What should a 429 response ideally include, and why does that matter for well-behaved clients?", answer: "How long to wait before retrying (usually a `Retry-After` header), and ideally how much quota remains and when it resets. Without it, a client can't know when to retry: it may hammer the API right away (making things worse) or back off far longer than needed." },
      { question: "What is the `Retry-After` header, and how should a client be expected to use it?", answer: "It tells the client, in seconds or as a timestamp, when it's safe to retry. A well-behaved client waits at least that long instead of retrying immediately or on its own schedule, so it recovers without adding to the overload." },
      { question: "Scenario: a legitimate client (e.g. a batch job clearing a backlog) gets rate-limited during a real, valid traffic spike. What's a better strategy than a flat hard reject?", answer: "Use a burst-tolerant algorithm (token bucket) that allows a temporary spike above the steady rate, or give known bulk/batch clients a separate higher-throughput tier or queue. Capping every client at a rate designed for interactive use unfairly penalizes a different but legitimate traffic pattern." },
      { question: "What is a \"leaky bucket as a queue\" implementation, and how does it differ from leaky bucket purely as a rate limiter?", answer: "As a rate limiter, requests beyond the drain rate are rejected. As a queue, they're held and processed later at the drain rate instead of dropped. You trade rejection for added latency, useful when a request should be delayed, not lost." },
      { question: "Why doesn't rate limiting alone fully protect against a DDoS attack distributed across many different IPs or accounts?", answer: "It caps each client's rate, but an attack from thousands of IPs or fake accounts can keep each one under its limit while the total still overwhelms the service. Rate limiting bounds per-client abuse, not total volume from many coordinated sources, which needs other defenses (traffic filtering, anomaly detection, a CDN/DDoS mitigation layer)." },
      { question: "What layers of a system might apply rate limiting, and why might you want it at more than one?", answer: "The client SDK (self-throttling before sending), an API gateway (one central enforcement point for external traffic), and individual services (protecting a specific expensive operation however the request arrived). Layers catch different problems: well-behaved clients that self-throttle avoid wasted traffic, while gateway and service limits protect against clients that don't." },
      { question: "Scenario: login attempts are rate-limited per account to prevent brute-force password guessing. What's a subtlety if you naively lock the account out after N failed attempts?", answer: "An attacker can deliberately fail logins on a victim's account to lock the real user out: a denial of service using the very protection meant to help them. Mitigations: increasing delays instead of a hard lockout, also limiting by source (IP/device), or requiring an extra verification step instead of blocking login." },
      { question: "What's the tradeoff between rate limiting enforced on the server versus asking the client to self-throttle?", answer: "Server-side enforcement is authoritative and can't be bypassed, but each rejected request still costs the server something to receive and reject. Client self-throttling avoids sending extra requests at all, but any client can ignore it. In practice the server is the real guarantee and client throttling is an optimization on top." },
      { question: "Why is choosing the rate-limiting window size (1 second vs 1 minute vs 1 hour) a real design decision, not an arbitrary one?", answer: "A short window reacts to abuse quickly but leaves less room for legitimate bursts. A long window absorbs short bursts but lets an abusive client keep a higher instant rate for longer before the limit catches up. Pick it based on what bursts are normal for real users versus what signals abuse." },
      { question: "What happens to a token bucket's burst allowance if a client is idle for a long period and then suddenly sends a large batch?", answer: "Tokens build up to the bucket's capacity while the client is idle, so it can spend all of them in one large burst as soon as it starts again. That's by design, but be deliberate: a very large capacity plus long idle periods can allow bursts far beyond the steady rate." },
      { question: "Common misconception: \"rate limiting is only about stopping malicious abuse.\" Why is this incomplete?", answer: "It just as often protects a service from its own legitimate clients: a buggy retry loop, a misconfigured cron job, or simply more real usage than a downstream dependency (like a third-party API with its own limits) can handle. It's basic self-protection against ordinary bugs and success, not only an anti-abuse tool." },
      { question: "Scenario: an internal microservice calls another at a high, bursty rate that occasionally exceeds what the downstream service can handle, causing cascading failures. Is client-imposed rate limiting or something else the better fix?", answer: "Client self-throttling helps but relies on every caller cooperating and knowing the right limit. A sturdier fix is usually the downstream service enforcing its own rate limit or applying backpressure based on its real current capacity, plus a circuit breaker in the caller so it fails fast instead of piling on retries." },
      { question: "Follow-up: how does rate limiting relate to a circuit breaker — are they solving the same problem?", answer: "Related but different. Rate limiting proactively caps traffic by policy, whether or not the downstream is healthy. A circuit breaker reacts when a downstream is already failing and stops sending it traffic until it recovers. One prevents overload; the other responds once something is wrong." },
      { question: "Why can a sliding window log's memory usage become an operational concern at high request volume, and what does the sliding window counter trade for cheaper memory?", answer: "The log keeps one timestamp per request for the whole window, so at high rates (e.g. thousands of requests per second per key) that's a lot of memory per client. The sliding window counter uses just two integers per client (current and previous counts), giving up exactness for a close approximation and far less memory." },
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
