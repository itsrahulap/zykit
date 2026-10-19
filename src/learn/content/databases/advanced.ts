import type { Topic } from "../../types/content";

export const databasesAdvancedTopics: Topic[] = [
  {
    id: "database-migrations",
    title: "Database Migrations",
    level: "advanced",
    description: "Small, versioned scripts that change a schema over time, so every environment gets the same structure in the same order.",
    explanation: `
A live app's schema keeps changing: new columns, new tables, renames.
Doing this by hand (logging into production and typing \`ALTER TABLE\`) is
risky. It's easy to forget a step, apply changes in the wrong order, or
let your development database drift from production.

A **migration** is a small script describing one schema change, like "add
a \`phone_number\` column to \`users\`." It's saved as a file, checked into
version control with your code, and numbered or timestamped so migrations
always run in a known order. A migration tool tracks which migrations a
database has already applied, so it only runs the new ones.
    `.trim(),
    analogy:
      "Editing a live schema by hand is like renovating a house without writing down what you changed; nobody can reproduce it. Migrations are numbered blueprints: 1 adds the garage, 2 adds a window. Any house (your laptop, staging, production) built from them in order ends up identical.",
    examples: [
      {
        title: "A migration file adding a column",
        code: `-- migrations/0007_add_phone_number_to_users.sql

ALTER TABLE users
ADD COLUMN phone_number TEXT;`,
        language: "sql",
        explanation: "One file, one schema change. The filename encodes the order (0007), so the tool runs it after 0006 and before 0008.",
        walkthrough: [
          { code: "-- migrations/0007_add_phone_number_to_users.sql", explanation: "The filename records the order and intent: migration number 7." },
          { code: "ALTER TABLE users", explanation: "Changes the existing users table." },
          { code: "ADD COLUMN phone_number TEXT;", explanation: "The one change this migration makes: a new column." },
        ],
      },
      {
        title: "A migration with an explicit rollback (using an ORM's migration tool, conceptually)",
        code: `// migrations/0008_create_reviews_table.js
exports.up = function (schema) {
  schema.createTable("reviews", (t) => {
    t.integer("id").primaryKey();
    t.integer("product_id").references("products.id");
    t.text("body");
  });
};

exports.down = function (schema) {
  schema.dropTable("reviews");
};`,
        explanation: "Many migration tools pair each change (up) with its exact opposite (down), so a migration can be cleanly rolled back.",
      },
      {
        title: "The same idea with Alembic (SQLAlchemy's migration tool)",
        code: `# migrations/versions/a1b2c3_add_phone_number.py

def upgrade():
    op.add_column("users", sa.Column("phone_number", sa.String()))

def downgrade():
    op.drop_column("users", "phone_number")`,
        language: "python",
        explanation: "Alembic is the migration tool most often paired with SQLAlchemy/FastAPI. upgrade() and downgrade() are the same up/down pair as the JavaScript example, in Python. Running `alembic upgrade head` applies every migration not yet recorded, in order.",
      },
    ],
    howItWorks: `
A migration tool keeps a small table in the database (often called
\`schema_migrations\`) listing which migration files have run. Each time
you run the tool, it compares that list with the files that exist and
applies only the missing ones, in order.

Because migrations are files in version control, every developer and
every environment (development, staging, production) runs the same
sequence and gets an identical schema, instead of drifting apart through
manual changes.
    `.trim(),
    whyItExists: `
Manual schema changes only work for one person on one database. Once
there are several developers, several environments, or schema changes
that must ship with code, changes need to be recorded, ordered, and
re-runnable. That's what migrations provide.
    `.trim(),
    whenToUse: `
Use migrations for nearly every schema change in any app with more than
one environment or contributor: adding columns, creating tables, changing
constraints, backfilling data as part of a schema change.
    `.trim(),
    whenNotToUse: `
For a throwaway local prototype with one developer and no shared
environments, formal migration files may not be worth it yet. Adopt them
as soon as the project is shared or deployed anywhere.
    `.trim(),
    commonMistakes: [
      "Editing a migration that's already been applied elsewhere instead of writing a new one. Environments that ran the old version fall out of sync.",
      "Changing the production schema directly to 'fix it quickly,' bypassing migrations and drifting from what the migration history says.",
      "Changing both schema and large amounts of data in one long-running migration, which can lock the table for a long time in production.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a migration that adds a boolean is_active column, defaulting to true, to a users table." },
      { difficulty: "Medium", prompt: "Write a migration that creates a tags table and a join table linking tags to posts (many-to-many)." },
      { difficulty: "Hard", prompt: "Explain why editing an already-applied migration, instead of writing a new one, can make a team's databases drift out of sync." },
    ],
    interviewQuestions: [
      { question: "What is a database migration?", answer: "A versioned script describing one schema change, saved as a file and run in a known order, so it applies the same way in every environment." },
      { question: "What do the `up` (or `upgrade`) and `down` (or `downgrade`) parts of a migration represent?", answer: "`up`/`upgrade` applies the change. `down`/`downgrade` should be its exact opposite, so the same file can apply the change and cleanly undo it." },
      { question: "How does a migration tool decide which migrations still need to run, and in what order?", answer: "It keeps a table in the database (often `schema_migrations`) listing applied migrations, compares it with the files that exist, and runs only the unapplied ones in filename order." },
      { question: "Why shouldn't you edit an already-applied migration file instead of writing a new one?", answer: "Environments that already ran the original never see the edit, so their schema silently drifts from any environment that runs the edited file fresh." },
      { question: "Concretely, what breaks when a team edits an applied migration instead of adding a new one?", answer: "A developer whose database already applied it keeps the old schema forever, while anyone migrating from scratch gets the edited version. The tracking table can't notice, because it records *that* a migration ran, not *what* it contains." },
      { question: "Why is a down migration risky specifically when the up migration dropped a column or table?", answer: "Down can recreate the empty structure but can't bring back its data. It looks like a clean rollback, but the data is already gone for good." },
      { question: "What does 'zero-downtime migration' mean, and why can an ordinary schema change threaten uptime?", answer: "It means the running code and the schema are never incompatible, even for a moment. Renaming or dropping a column the live code still reads can break every request the instant it runs." },
      { question: "Describe the 'expand-contract' pattern for renaming a column without downtime.", answer: "*Expand*: add the new column (nullable), have the app write to both old and new columns, and backfill existing rows. Once every app instance reads the new column, *contract*: drop the old column in a later, separate migration." },
      { question: "Why can adding a `NOT NULL` column with no default be riskier than adding a nullable one?", answer: "Every existing row needs a value the instant the constraint applies. With no default there's nothing to put there, so the statement is rejected (or, where the engine must backfill every row, it can hold a long lock while rewriting the table). A nullable column just stores `NULL` for existing rows." },
      { question: "Why does a plain `CREATE INDEX` risk blocking writes on a large production table, and what's Postgres's alternative?", answer: "A normal index build takes a lock that blocks writes for the whole build. `CREATE INDEX CONCURRENTLY` avoids that exclusive lock, but takes longer and needs two passes over the table." },
      { question: "Why can't `CREATE INDEX CONCURRENTLY` run inside the same transaction as other migration statements?", answer: "Postgres requires it to run outside a transaction block, because it uses several transactions internally to build the index safely. The migration tool must run it as a separate, non-transactional step." },
      { question: "What's the danger of renaming a column in one atomic migration during a rolling deploy?", answer: "During the rollout, old and new app instances run side by side. The old ones still expect the original name, so they all start failing the instant the rename runs." },
      { question: "What is a 'backward-compatible' migration, and why does it matter for rolling deploys?", answer: "One that keeps the schema working for both the code running now and the code being deployed, so neither breaks while both are live." },
      { question: "Why do migration tools enforce a strict run order instead of letting migrations run in any order?", answer: "Later migrations assume earlier ones ran; adding a foreign key assumes the referenced table exists. Running them out of order can fail or corrupt the schema." },
      { question: "What happens when two developers on separate branches each create a migration numbered `0012`?", answer: "A naming collision: after merging, it's unclear which runs first. Teams fix it by hand during merge/review, or avoid it with timestamp-based filenames instead of small sequential numbers." },
      { question: "Why do many teams prefer timestamp-based migration filenames over small sequential integers?", answer: "Two developers are very unlikely to create migrations in the same millisecond, but both picking the next small number (say `0012`) happens easily." },
      { question: "What's the difference between a schema migration and a data migration, and why is mixing them risky?", answer: "A schema migration changes structure (tables/columns); a data migration changes or backfills row values. Doing both in one step (add a column, then update millions of rows) risks one long statement holding a lock the whole time. Better: a fast schema change, then a batched backfill off the critical path." },
      { question: "Why batch a large backfill into many small updates instead of one large `UPDATE`?", answer: "One huge update can hold locks and write lots of transaction log at once, and must restart from scratch if interrupted. Batches keep transactions small, release locks in between, and keep progress if interrupted." },
      { question: "What does it mean for a migration to run inside a transaction, and why doesn't every database support that fully for schema changes?", answer: "In a transaction, a failure partway rolls everything back instead of leaving the schema half-changed. Postgres supports this for most DDL, but some databases (e.g. MySQL) commit DDL statements as they run, so a mid-migration failure can leave the schema partly applied." },
      { question: "If a migration fails partway through on a database without transactional DDL, what state is left, and what has to happen next?", answer: "Statements before the failure are committed and the rest never ran, so the schema matches neither the old nor the new version. Someone must diagnose and fix it by hand (often with a corrective migration), since re-running the file may fail again on the part that already succeeded." },
      { question: "Why do teams sometimes 'squash' old migrations into one baseline file, and what's lost by doing so?", answer: "A long history is slow to replay from scratch (e.g. for a fresh test database) and cluttered. Squashing merges it into one current-schema file, but loses the step-by-step record of how the schema evolved." },
      { question: "What's the risk of applying an autogenerated migration without reviewing it first?", answer: "Autogeneration diffs the ORM's models against the database and guesses the change. It can miss things it can't detect or generate something unsafe at production scale. Always review the generated SQL before running it." },
      { question: "Why might autogeneration turn a column rename into 'drop old column, add new column' instead of an actual rename?", answer: "It usually compares schemas by name and can't tell that a removed field and an added field are the same column. The drop+add it generates would delete that column's data if applied as-is." },
      { question: "Why run migrations as part of CI/CD instead of manually per environment?", answer: "Every environment (a fresh CI database, staging, production) then applies migrations the same way, in the same automated step as the deploy. Relying on someone to remember causes exactly the drift migrations exist to prevent." },
      { question: "Should a migration that adds a column run before or after deploying code that reads it? What about one dropping a column old code still reads?", answer: "Add a column *before* deploying the code that needs it, so it already exists. Drop a column only *after* every instance runs code that no longer reads it. Reversing either order breaks a rolling deploy." },
      { question: "What's a seed/fixture script, and why is it usually kept separate from schema migrations?", answer: "It inserts default or sample data (an initial admin user, reference lookup rows). It's kept separate because it fills data for a particular environment, rather than describing a structural change every environment must apply." },
      { question: "Why is it good practice for a migration to be safe to re-run, even though the tool already tracks what's applied?", answer: "It protects against edge cases like the tracking table getting out of sync or a manual retry, so re-running doesn't error or corrupt the schema. For example, guard table creation with `CREATE TABLE IF NOT EXISTS`." },
      { question: "What does `alembic upgrade head` actually do?", answer: "It applies every migration not yet recorded as run, in order, up to the latest one ('head') in the chain." },
      { question: "How does Alembic typically chain migrations together, and how does that differ from relying on a filename's number?", answer: "Each migration records the revision id of the one before it, forming a linked chain. Order doesn't depend on filename numbers, so it stays correct even when branches merge migrations out of numeric sequence." },
      { question: "Why does `op.drop_column` in a downgrade function lose data, and when is that an acceptable tradeoff?", answer: "Dropping a column deletes every value in it. That's fine for a rollback right after a failed deploy, before the column holds meaningful data, but not once it's in real use." },
      { question: "What's the difference between rolling back a migration and writing a new migration that reverses an earlier one?", answer: "Rolling back runs that migration's down script and un-marks it as applied. A new forward migration adds a new step and keeps history moving one way. Many teams prefer the latter once a migration has reached production, since no environment then needs to support rollbacks." },
      { question: "How would you change a large, actively-written-to table's column type without significant downtime?", answer: "Expand-contract: add a new column of the target type, write to both, backfill existing rows in batches, switch reads to the new column, then drop the old one in a later migration. Avoid a single blocking conversion that rewrites the whole table." },
      { question: "Why test a migration's down/rollback path, not just its up path?", answer: "An untested down migration may not restore the old schema, or may just error. You'd only find out during a real rollback under pressure, when you can least afford it." },
    ],
    prerequisites: ["orms"],
    relatedTopics: ["orms", "normalization"],
    keywords: ["migration", "schema change", "version control", "schema_migrations"],
  },
  {
    id: "query-optimization",
    title: "Query Optimization",
    level: "advanced",
    description: "Read the database's plan for a query to find out why it's slow and how to speed it up.",
    explanation: `
Guessing why a query is slow rarely works. You need to see what the
database is doing. Most databases explain their plan before (or while)
running a query, usually with an \`EXPLAIN\` command. It shows whether
they scan every row, whether they use an index, and the estimated cost of
each step.

**Query optimization** means reading that plan, spotting the expensive
parts (often a full table scan where an index would help, or a badly
ordered join), and fixing them. Usually that's adding an index, rewriting
the query, or sometimes restructuring the schema.
    `.trim(),
    analogy:
      "EXPLAIN is like asking a delivery driver for their route before they leave. If they say 'I'll drive past every house in the city checking addresses,' you know why it's slow, and you can hand them a map (an index).",
    examples: [
      {
        title: "Reading a query plan",
        code: `EXPLAIN SELECT * FROM orders WHERE customer_email = 'amara@example.com';

-- Output might show:
-- Seq Scan on orders  (cost=0.00..18334.00 rows=1 width=72)
--   Filter: (customer_email = 'amara@example.com'::text)`,
        language: "sql",
        explanation: "'Seq Scan' means a sequential (full table) scan: the database checks every row. On a large table, that's the part to fix.",
        walkthrough: [
          { code: "EXPLAIN SELECT * FROM orders WHERE customer_email = 'amara@example.com';", explanation: "Asks the database how it would run this query, without necessarily running it." },
          { code: "Seq Scan on orders  (cost=0.00..18334.00 rows=1 width=72)", explanation: "The plan is to scan the whole orders table. The estimated cost (18334) is high for finding one row." },
          { code: "Filter: (customer_email = 'amara@example.com'::text)", explanation: "It checks this condition against every row it scans." },
        ],
      },
      {
        title: "After adding an index",
        code: `CREATE INDEX idx_orders_customer_email ON orders (customer_email);

EXPLAIN SELECT * FROM orders WHERE customer_email = 'amara@example.com';

-- Output might now show:
-- Index Scan using idx_orders_customer_email on orders
--   (cost=0.42..8.44 rows=1 width=72)`,
        language: "sql",
        explanation: "With the index, the plan switches to an 'Index Scan' at a far lower estimated cost. The database jumps to matching rows instead of checking every one.",
      },
    ],
    howItWorks: `
Before running a query, the **query planner** considers several ways to
run it (scan the whole table, use this or that index, join in one order or
another). It estimates each one's cost and picks the cheapest, using
statistics it keeps about the data (like row counts, or how many distinct
values a column has).

\`EXPLAIN\` shows the chosen plan. \`EXPLAIN ANALYZE\` also runs the query and
shows the real measured cost. Common fixes:

- add a missing index
- rewrite the query to avoid something that blocks index use (like
wrapping an indexed column in a function)
- restructure an inefficient join
    `.trim(),
    whyItExists: `
The planner is sophisticated but works from statistics and heuristics. It
can choose badly, or a query can be written so it can't use an index it
otherwise would. Seeing the actual plan turns "this query is slow" from
guesswork into an evidence-based problem you can solve.
    `.trim(),
    whenToUse: `
Optimize when a query is measurably slow, or before shipping a new query
against a table you expect to grow. Checking the plan early can catch a
missing index before it hits production.
    `.trim(),
    whenNotToUse: `
Don't optimize a query that's already fast and touches little data;
premature optimization adds complexity for nothing. Focus on queries
measured to be slow or that run very often.
    `.trim(),
    commonMistakes: [
      "Adding an index without checking that the planner uses it. Sometimes the fix is rewriting the query, not adding an index.",
      "Optimizing on a guess instead of reading the EXPLAIN output, and fixing the wrong thing.",
      "Testing only on a small local database, where a full table scan is fast enough to hide a problem that appears at production scale.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain what a 'Seq Scan' in a query plan tells you about how the database runs that query." },
      { difficulty: "Medium", prompt: "A slow query filters on an unindexed column. Describe the steps you'd take to diagnose and fix it." },
      { difficulty: "Hard", prompt: "Explain why wrapping an indexed column in a function in a WHERE clause (e.g. LOWER(email) = ...) can stop the database using that column's index." },
    ],
    interviewQuestions: [
      { question: "What does the `EXPLAIN` command show you?", answer: "The plan the database will use for a query: whether it scans the whole table or uses an index, the order it joins tables, and the estimated cost of each step." },
      { question: "What's the difference between `EXPLAIN` and `EXPLAIN ANALYZE`?", answer: "`EXPLAIN` shows the plan and estimated costs without running the query. `EXPLAIN ANALYZE` runs it and adds the real row counts and timings." },
      { question: "Name one common fix for a slow query doing a full table scan.", answer: "Add an index on the column used in the `WHERE` clause or join condition, so the database can look up matching rows directly." },
      { question: "What's the difference between a `Seq Scan` and an `Index Scan` in a query plan?", answer: "A `Seq Scan` reads every row in order and checks each one. An `Index Scan` uses an index to jump straight to matching rows and skips the rest." },
      { question: "Why might the planner choose a `Seq Scan` even when an index exists on the filtered column?", answer: "If the table is small, or the filter matches a large share of rows, scanning directly can be cheaper than many random-access index lookups. An index only pays off when it narrows the result a lot." },
      { question: "What do the two numbers in a cost estimate like `cost=0.42..8.44` mean?", answer: "The first is the estimated *startup cost* (work before the first row can be returned). The second is the estimated *total cost* to return every row of that step." },
      { question: "What does the `rows=` estimate in an EXPLAIN plan represent, and where does it come from?", answer: "The planner's guess at how many rows the step returns, based on table statistics like row count and distinct values per column. It isn't an actual count." },
      { question: "Why can EXPLAIN ANALYZE show a very different 'actual rows' than the plan's estimated 'rows', and why does that matter?", answer: "The statistics are stale or the data is unusually distributed, so the cost estimates (and the chosen plan) may rest on a badly wrong guess. A big gap is a strong signal to re-run `ANALYZE` on the table." },
      { question: "What is an `Index Only Scan`, and how does it differ from a regular `Index Scan`?", answer: "A regular index scan finds entries in the index, then fetches the row from the table (the 'heap') for any column not in the index. An index-only scan answers from the index alone and skips that fetch." },
      { question: "What's a 'covering index', and why does it enable an index-only scan?", answer: "An index containing every column the query needs, not just the filtered one. Since nothing outside the index must be read, the database can skip the table's rows entirely." },
      { question: "Why does an index scan in Postgres often still need to fetch the row from the table, whereas MySQL's InnoDB frequently doesn't for primary-key lookups?", answer: "Postgres stores table data as an unordered heap with indexes pointing into it, so most index scans need a separate heap fetch. InnoDB clusters row data around the primary key, so a primary-key lookup already has the row." },
      { question: "What is a `Bitmap Heap Scan`/`Bitmap Index Scan` pair, and when does the planner use it instead of a plain index scan?", answer: "The bitmap index scan builds an in-memory map of which pages hold matching rows; the bitmap heap scan then visits just those pages in physical order. The planner prefers it when enough rows match that a plain index scan would cause too much random I/O." },
      { question: "Why does wrapping an indexed column in a function (e.g. `LOWER(email) = ...`) typically prevent the planner from using an index on that column?", answer: "A standard index stores raw column values, not function results. The planner can't match `LOWER(email)` against an index on plain `email`, so it checks every row." },
      { question: "Instead of wrapping the column in `LOWER()`, how would you index a case-insensitive lookup so the planner can still use it?", answer: "Create an expression (functional) index on the exact expression the query uses, e.g. `CREATE INDEX ON users (LOWER(email))`, so the index stores the lowercased values being filtered." },
      { question: "Why does a leading wildcard in `LIKE '%something'` prevent a standard B-tree index from helping?", answer: "A B-tree is ordered from the start of the value, so it can jump to a known prefix. A pattern that can match anywhere gives it no starting point, so every entry must be checked." },
      { question: "In a composite index on `(a, b)`, why can a query filtering only on `b` fail to use that index efficiently?", answer: "The index is ordered by `a` first, and by `b` only within each `a`. Without a condition on `a`, there's no way to find where matching `b` values are, so the whole index must be scanned." },
      { question: "Why does column order matter when creating a composite index meant to speed up a query filtering on multiple columns?", answer: "An index can only be searched efficiently from its leading column(s). Putting the most selective, most-filtered column first narrows the search fastest; the wrong order can make the index little better than a full scan." },
      { question: "What role does the `ANALYZE` command play in query planning (as distinct from `EXPLAIN ANALYZE`)?", answer: "`ANALYZE` recomputes the table statistics (row counts, distinct-value estimates, data distribution) the planner uses to estimate costs. Without it, statistics go stale and plans get worse." },
      { question: "What happens to query plans if a table's statistics are stale, for example right after a large bulk load, and how do you fix it?", answer: "The planner keeps costing plans from old row counts and distributions, and may pick a plan wrong for the table's new size or shape. Run `ANALYZE` (many databases also do this automatically on a schedule) to refresh the statistics." },
      { question: "At a high level, what's the difference between a nested loop join, a hash join, and a merge join?", answer: "Nested loop: for each row of one input, look up matches in the other (cheap when one side is small or well-indexed). Hash join: build an in-memory hash table from one side and probe it with the other (good for larger unsorted inputs). Merge join: walk both inputs together in sorted order (good when both are already sorted on the join key)." },
      { question: "Why does join order matter for a multi-table query, and who decides it?", answer: "Different orders can hugely change how many intermediate rows are produced. The planner picks the order from estimated costs, unless there are so many tables that it falls back to heuristics instead of costing every ordering." },
      { question: "Given a tiny 4-row `orders` table with no `WHERE` clause at all, what would `EXPLAIN SELECT * FROM orders;` show, even with an index on `id`?", answer: "A `Seq Scan on orders`. With no filter, every row is returned anyway, so reading the table directly is at least as cheap as using an index, without the overhead. The index doesn't change that." },
      { question: "Debugging: a query has run fine in production for months and suddenly gets slow, with no change to the query text or schema. What's the first thing to check?", answer: "Whether the table's size or data distribution changed enough that the old plan (e.g. an index scan) is no longer cheapest, or the statistics went stale. Re-run `EXPLAIN ANALYZE` to see if the plan changed, and check when statistics were last updated." },
      { question: "Debugging: EXPLAIN shows the query is already using an index, but it's still slow. What's a likely reason?", answer: "The index matches many rows (low selectivity), so it barely narrows the work. Or the query needs columns outside the index and pays for a heap fetch on every matched row." },
      { question: "Why might adding an index make a table's writes slower, and how is that a tradeoff against faster reads?", answer: "Every insert, update, or delete must also update each index, so more indexes mean more work per write. Indexes trade some write throughput for faster reads on the columns they cover." },
      { question: "What's the practical effect of having too many indexes on a heavily written-to table?", answer: "Writes slow down because each one updates every index, and many of those indexes may barely be used. Review a table's indexes periodically against the real queries." },
      { question: "What's the difference between the 'cost' units shown by EXPLAIN and actual wall-clock time?", answer: "Cost is an abstract unit for comparing plans (roughly based on disk-page fetches and per-row work), not milliseconds. Only `EXPLAIN ANALYZE`'s actual timings show real elapsed time." },
      { question: "What is a correlated subquery, and why can it be much slower than an equivalent join?", answer: "A subquery that uses a column from the outer query, so it reruns once per outer row. A join lets the planner process both tables together in one pass instead." },
      { question: "What does `EXPLAIN (ANALYZE, BUFFERS)` add over plain `EXPLAIN ANALYZE`, and why is that useful?", answer: "It shows how many data pages each step read from cache versus disk. That helps tell a step slowed by real disk I/O from one slow for another reason." },
      { question: "Why can two queries that return the same result set produce different EXPLAIN plans and different performance?", answer: "The planner works from the query's structure, not its intent. A rewrite (a join instead of a subquery, a different clause order, an extra redundant condition) can open up or rule out plan choices, even with identical results." },
      { question: "Why can a query that performs well in local testing turn out to be slow in production despite identical query text?", answer: "A small local dataset makes a full table scan fast enough to hide a missing index. The planner may also pick different plans at different sizes; a plan fine for thousands of rows can be wrong for millions." },
    ],
    prerequisites: ["indexes", "joins"],
    relatedTopics: ["indexes", "joins", "connection-pooling"],
    keywords: ["EXPLAIN", "query plan", "query optimization", "seq scan", "index scan"],
  },
  {
    id: "connection-pooling",
    title: "Connection Pooling",
    level: "advanced",
    description: "Keep a small set of open database connections to reuse, instead of opening a new one for every request.",
    explanation: `
Opening a database connection isn't free. It needs a network handshake,
authentication, and setup on both sides, often tens of milliseconds. If a
web server opens and closes a connection for every request, it pays that
cost over and over. A traffic burst can also open so many connections that
the database is overwhelmed (every database has a hard limit on
simultaneous connections).

**Connection pooling** keeps a fixed-size set of open connections, a
**pool**, ready to go. Your code borrows a connection, uses it, and
returns it to the pool, instead of opening and closing a new one each
time.
    `.trim(),
    analogy:
      "A new connection per request is like renting a brand-new car (paperwork and all) for each errand, then scrapping it. A pool is a car-sharing fleet already fueled and ready: check one out, use it, return it for the next person.",
    examples: [
      {
        title: "Without pooling — a new connection per request",
        code: `// Conceptual, not real code:
app.get("/user/:id", async (req, res) => {
  const connection = await openNewDatabaseConnection(); // slow, every time
  const user = await connection.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
  await connection.close();
  res.json(user);
});`,
        explanation: "Every request pays the full cost of opening and closing a connection, even under heavy traffic.",
      },
      {
        title: "With a connection pool",
        code: `const pool = createConnectionPool({ min: 2, max: 10 });

app.get("/user/:id", async (req, res) => {
  const connection = await pool.acquire(); // reuses an existing connection
  try {
    const user = await connection.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
    res.json(user);
  } finally {
    pool.release(connection); // returns it for the next request to use
  }
});`,
        explanation: "The pool keeps 2 to 10 connections open. Each request borrows one, uses it, and gives it back, with no repeated setup cost.",
        walkthrough: [
          { code: "const pool = createConnectionPool({ min: 2, max: 10 });", explanation: "Keeps at least 2 connections open and never more than 10." },
          { code: "const connection = await pool.acquire();", explanation: "Borrows an open connection (or opens a new one if none are free and the pool is under its max)." },
          { code: "const user = await connection.query(...)", explanation: "Runs the query on the borrowed connection, like any direct connection." },
          { code: "pool.release(connection);", explanation: "Returns the connection instead of closing it, so the next request can reuse it right away." },
        ],
      },
    ],
    howItWorks: `
The pool keeps between a configured minimum and maximum number of open
connections. When code borrows one, the pool hands over an idle
connection, or opens a new one if none are free and it's under the max.
If it's at the max and all are busy, the request waits until one is
returned. When done, code "releases" the connection back to the pool
instead of closing it.

This caps how many connections the database sees at once (protecting it
from overload) and avoids paying setup cost for every unit of work.
    `.trim(),
    whyItExists: `
Databases limit simultaneous connections, and opening one is relatively
expensive. Without pooling, an app under real traffic either pays the
setup cost constantly or risks hitting the connection limit in a spike,
so new requests fail outright.
    `.trim(),
    whenToUse: `
Use pooling in almost any app server that talks to a database and handles
more than one request at a time. It's standard in production web apps,
and most drivers and ORMs build it in or support it.
    `.trim(),
    whenNotToUse: `
A short-lived script that opens one connection, does its work, and exits
doesn't need a pool. Pooling pays off under repeated, concurrent access.
    `.trim(),
    commonMistakes: [
      "Forgetting to release a borrowed connection. The pool eventually runs dry and every later request waits forever.",
      "Setting the pool's max above the database's connection limit, especially with many app instances that each have their own pool.",
      "Thinking pooling makes queries faster. It removes connection setup overhead; a slow query stays slow.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In your own words, explain why opening a new database connection for every web request is wasteful." },
      { difficulty: "Medium", prompt: "Describe what happens to a database if 500 app server instances each open their own pool with a max of 20 connections." },
      { difficulty: "Hard", prompt: "Describe a bug where forgetting to release a connection eventually makes every request hang." },
    ],
    interviewQuestions: [
      { question: "What problem does connection pooling solve?", answer: "It avoids opening and closing a connection for every request, and caps how many simultaneous connections the database must handle." },
      { question: "What happens when all connections in a pool are in use and a new request needs one?", answer: "The request waits until a connection is released, or, if the pool is under its max, a new connection is opened for it." },
      { question: "Why can't you just set a connection pool's maximum size arbitrarily high?", answer: "The database has a hard limit on simultaneous connections. Exceeding it, especially with many app instances each running a pool, can overwhelm it or make it reject connections." },
      { question: "Why is opening a database connection expensive in the first place?", answer: "It needs a network round trip, a TLS/authentication handshake, and setup on both sides: often tens of milliseconds that have nothing to do with your query." },
      { question: "Besides the client's cost, why does the database itself pay a real cost per open connection?", answer: "Most databases run a dedicated backend process or thread per connection, holding memory and other resources as long as it's open, busy or not." },
      { question: "What's the difference between a pool's `min` and `max` settings?", answer: "`min` is how many connections the pool keeps open even when idle. `max` is the ceiling it never exceeds, whatever the demand." },
      { question: "Why keep a nonzero `min` of idle connections rather than letting the pool shrink to zero when idle?", answer: "So the next request doesn't pay full setup cost. A warm, open connection is ready right away." },
      { question: "What's a common cause of pool exhaustion that isn't simply too much traffic?", answer: "Code that borrows a connection and never releases it: a bug, an unhandled exception that skips the release, or a missing `finally` block. It quietly shrinks the pool's usable capacity over time." },
      { question: "Walk through how one leaked (never-released) connection eventually stalls every request, even under otherwise normal load.", answer: "Each leak permanently removes one connection from the pool. If the bug fires repeatedly, eventually every connection is checked out forever, and every new request waits for a connection that never comes back." },
      { question: "What is connection pool starvation caused by a single long-running query or transaction?", answer: "One request holds its connection for a long time (a slow query, or a transaction left open waiting on something). Especially in a small pool, every other request waits behind it, even though nothing leaked." },
      { question: "Why can a burst of reconnects after a brief outage or app restart overwhelm a database even with pooling in place?", answer: "If many app instances start or reconnect at once and each fills its pool to its minimum right away, the database gets a sudden spike of connection attempts instead of the gradual load pooling is meant to give." },
      { question: "What's a commonly cited starting guideline for sizing a connection pool, and why is 'bigger is always better' wrong?", answer: "A common rule of thumb sizes the pool relative to the database's CPU cores; small pools on roughly that order tend to perform best. Past a point, more connections just compete for the same CPU and I/O, so throughput flattens or drops." },
      { question: "Why might increasing a pool's max size from 10 to 100 make overall throughput worse instead of better?", answer: "Beyond what the database's CPU and disks can handle at once, extra connections just compete for the same resources, adding context-switching and lock contention instead of real work." },
      { question: "What's the difference between a connection pool built into the application/ORM and an external pooler like PgBouncer running as its own service?", answer: "A client-side pool is per app instance, so its `max` multiplies by the number of instances. An external pooler is one shared layer in front of the database, letting many app-side connections share far fewer real database connections." },
      { question: "Why might you run an external pooler in front of a database even when your app already has its own client-side pool?", answer: "It caps the total connections the database sees across all app instances, instead of each instance's pool adding to the total. This matters once you run many instances." },
      { question: "What's the practical difference between 'session pooling', 'transaction pooling', and 'statement pooling' modes in a tool like PgBouncer?", answer: "Session pooling gives a client one database connection for its whole session. Transaction pooling returns the connection as soon as each transaction commits, so many more clients can share connections. Statement pooling releases it after every statement: the most sharing, but the fewest supported features." },
      { question: "Why can transaction-mode pooling break features like session-level prepared statements or advisory locks?", answer: "Those features rely on the same physical connection persisting across statements. In transaction mode, the client may get a *different* connection for its next transaction, so any state left on the previous one is gone." },
      { question: "Why does deploying many application server instances, each with its own pool, multiply the effective connection count the database sees?", answer: "Each instance opens up to its own max independently, so the database faces the sum of all the maximums, not one shared ceiling." },
      { question: "What's a connection health check or validation query, and why does a pool need one?", answer: "A trivial query (or protocol-level check) the pool runs before handing out a connection, to confirm it's alive. Without it, a connection that silently died (network blip, database restart) could be given to a request that then fails." },
      { question: "Why is serverless/lambda-style compute a notoriously bad fit for pooling directly against the database, and what's the usual fix?", answer: "Each short-lived function instance can create its own pool, so at scale huge numbers of instances open connections and quickly exceed the database's limit. The usual fix is a shared external pooler between the functions and the database." },
      { question: "What's the difference between an idle timeout on a pooled connection and the pool's overall max size?", answer: "The idle timeout sets how long an unused connection stays open before the pool closes it, letting the pool shrink toward `min` when quiet. `max` is a hard ceiling on open connections at any time." },
      { question: "Why doesn't pooling make a slow query run faster?", answer: "Pooling only removes connection open/close overhead. Running the query itself (the query, indexes, table size) is unchanged." },
      { question: "Compare a connection pool to a thread pool conceptually — where does the analogy hold, and where does it break down?", answer: "Both reuse a limited, expensive-to-create resource instead of making one per unit of work. But a thread is generic compute, while a connection is *stateful*: an authenticated session to one database. Handing connections around carelessly (mid-transaction, wrong session state) can cause bugs a thread never would." },
      { question: "Scenario: a service acquires one connection from a pool sized to 1, then tries to acquire a second connection before releasing the first. What happens?", answer: "The second `acquire()` waits forever, because the only connection is the one this request already holds. It's a classic pool self-deadlock: the pool is too small for code that needs two connections at once." },
      { question: "Why should you generally avoid holding a pooled connection open across a slow, non-database operation in the middle of a request (e.g. an external HTTP call)?", answer: "The connection sits idle but checked out for the whole slow operation, unavailable to every other request. A scarce shared resource is tied up for work unrelated to the database." },
      { question: "What's the effect of pointing multiple read replicas at entirely separate pools versus one shared pool?", answer: "Separate pools let you size and track each replica's load independently, but with uneven traffic one pool can run dry while another sits idle. A shared pool balances load but adds routing complexity to know which replica a connection belongs to." },
      { question: "Debugging: requests are timing out with pool-exhaustion errors, but overall traffic hasn't increased. What would you check first?", answer: "Whether something holds connections longer than before: a slow query, a leak from unhandled errors, or a code change that acquires earlier or releases later. Don't assume the pool is just too small." },
      { question: "Why might reducing a pool's max size sometimes increase throughput on an already-overloaded database?", answer: "Too many concurrent connections can spend more time on contention and context-switching than real work. Lower concurrency lets each query finish faster, raising overall throughput despite less parallelism." },
      { question: "What's the tradeoff of setting a very short idle timeout on pooled connections?", answer: "It frees resources quickly when quiet, but a traffic burst right after faces a wave of new connection setup, since the pool already shrank toward its minimum." },
      { question: "Why does pooling matter more for a long-running application server than for a short-lived script?", answer: "A script that opens one connection and exits pays setup once anyway. Pooling pays off under repeated, concurrent access, which is what a long-running server sees." },
    ],
    prerequisites: ["transactions-and-acid"],
    relatedTopics: ["transactions-and-acid", "query-optimization"],
    keywords: ["connection pool", "database connections", "concurrency", "resource limits"],
  },
  {
    id: "nosql-data-modeling",
    title: "NoSQL Data Modeling",
    level: "advanced",
    description: "Shape documents around how they'll be read, often embedding related data instead of splitting it across tables.",
    explanation: `
Relational design (normalization) starts from the data's structure and
removes duplication, relying on joins to reassemble it. **Document
databases** (like MongoDB) flip this. There's no cheap, universal join
across collections, so you shape each document around how it will be read.
It's normal, even encouraged, to **embed** related data inside one
document instead of **referencing** a separate one.

The key question: is this related data usually read with its parent?

- If yes, embed it (nest it in the same document) to avoid extra lookups.
- If it's large, changes independently, or is shared by many parents,
reference it (store just an id, like a foreign key).
    `.trim(),
    analogy:
      "A normalized schema is a filing cabinet where each fact lives in one folder, and you cross-reference folders for the full picture. A document database hands someone a ready-made packet with everything stapled together: faster to hand over, but if a stapled-in fact changes, you may have to redo several packets.",
    examples: [
      {
        title: "Embedding — a blog post with its comments",
        code: `// A single document in a "posts" collection
{
  "_id": "post_123",
  "title": "Why We Chose Postgres",
  "body": "...",
  "comments": [
    { "author": "Kenji", "text": "Great write-up!" },
    { "author": "Priya", "text": "Curious about your indexing strategy." }
  ]
}`,
        explanation: "Comments are almost always read with their post and rarely queried alone, so embedding them avoids a second lookup.",
        walkthrough: [
          { code: '"_id": "post_123",', explanation: "The document's unique id, like a primary key." },
          { code: '"title": "Why We Chose Postgres",', explanation: "A regular top-level field." },
          { code: '"comments": [', explanation: "Comments are nested inside the post as an array." },
          { code: '{ "author": "Kenji", "text": "Great write-up!" }', explanation: "Each comment is embedded inline, not stored in a separate collection referenced by id." },
        ],
      },
      {
        title: "Referencing — a post and its author",
        code: `// posts collection
{ "_id": "post_123", "title": "Why We Chose Postgres", "author_id": "user_45" }

// users collection
{ "_id": "user_45", "name": "Amara Musa", "bio": "Backend engineer..." }`,
        explanation: "An author is shared by many posts and has a full profile that changes on its own schedule. Referencing by id, instead of embedding the user into every post, avoids duplicating and re-syncing the profile everywhere.",
      },
    ],
    howItWorks: `
Document databases usually can't join across collections efficiently the
way relational databases can. Fetching a document cheaply returns only its
own fields. Embedded data comes along for free; referenced data needs a
follow-up query (or, in some databases, a more limited join-like
operation).

So modeling weighs that against the cost of duplication. Embedding trades
some duplicated, harder-to-update data for fewer, faster reads.
Referencing trades an extra lookup for a single source of truth, closer to
a normalized relational table.
    `.trim(),
    whyItExists: `
Some data is almost always "read all together" (a post and its comments,
a cart and its line items). Forcing it into a fully normalized,
multi-table design adds join overhead to avoid duplication that may barely
matter if the embedded data rarely changes on its own. Document modeling
lets the data's shape follow how it's actually read.
    `.trim(),
    whenToUse: `
Embed related data when it's almost always read with its parent, doesn't
grow without limit, and is rarely queried or updated on its own: comments
on a post, line items on an order, an address on a profile. Reference by
id when the data is large, shared by many parents, updated independently,
or often queried on its own.
    `.trim(),
    whenNotToUse: `
Don't embed data that grows without limit (like comments on a very
popular post, which can bloat a document or hit size limits), or data that
must be updated across many parent documents at once. Those belong in a
separate, referenced collection.
    `.trim(),
    commonMistakes: [
      "Embedding a list that can grow forever (like comments on a viral post), until the document hits a size limit or loads slowly.",
      "Carrying relational normalization habits into a document database, ending up with too many references and losing the performance documents offer.",
      "Embedding data shared by many parents (like product details inside every order containing it), then updating it in many places when it changes.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "For a shopping cart with line items, decide whether to embed the line items in the cart document or reference them, and explain why." },
      { difficulty: "Medium", prompt: "Design a document shape for a 'product review' in an e-commerce app, deciding whether the reviewer's profile should be embedded or referenced." },
      { difficulty: "Hard", prompt: "Describe a realistic case where embedding seemed convenient at first but caused problems as the app grew, and how you'd redesign it." },
    ],
    interviewQuestions: [
      { question: "What's the difference between embedding and referencing in document database design?", answer: "Embedding nests related data inside the parent document, so one read fetches both. Referencing stores just an id pointing to a separate document, which costs an extra lookup." },
      { question: "Why is NoSQL document modeling often described as designing around access patterns rather than around normalization?", answer: "Without cheap joins across collections, the right shape depends on how the data is read together, not on removing duplication as relational normalization does." },
      { question: "What's a risk of embedding an unbounded list inside a document?", answer: "The document keeps growing until it's slow to load or hits the database's maximum document size." },
      { question: "What does 'design for your queries first' mean in document modeling, and how does that differ from a relational approach?", answer: "Start from how the data will be read and shape the document around that. Relational design starts from the data's structure, normalizes it, and relies on joins to build whatever shape each query needs." },
      { question: "What's the 'extended reference' pattern, and what problem does it solve?", answer: "Storing a few duplicated fields (e.g. a customer's name) from a referenced document next to its id. Common reads then skip the extra lookup for fields that are needed constantly and rarely change." },
      { question: "Why is a duplicated field in an extended reference a deliberate tradeoff rather than a mistake?", answer: "It accepts the cost of syncing the copy (only when the source changes) to skip an extra lookup on every read. Worth it when reads far outnumber updates to that field." },
      { question: "How would you model a many-to-many relationship, like articles and tags, in a document database?", answer: "Store an array of tag ids (or names) on each article. You don't need arrays on both sides, only the direction you query from. A separate `tags` collection can hold tag details if needed." },
      { question: "What is the 'bucket pattern', and what kind of data does it fit?", answer: "Grouping many small time-stamped readings (like sensor data) into one document per time period (e.g. one per hour, holding an array of that hour's readings) instead of one document per reading." },
      { question: "Why does the bucket pattern reduce overhead compared to one document per reading?", answer: "Fewer, larger documents mean fewer reads and writes and less per-document storage overhead than many tiny documents." },
      { question: "Why does a document size limit (e.g. MongoDB's 16MB per document) shape modeling decisions?", answer: "It caps anything embedded. If an embedded list or nested structure could realistically grow past the limit, reference that data separately instead." },
      { question: "Why can updating a single fact that's duplicated across many parent documents become expensive or error-prone?", answer: "Every document holding a copy must be found and updated, instead of changing one row in one place. Miss one and it silently goes stale." },
      { question: "What's a 'polymorphic' document pattern, and when is it useful?", answer: "Storing different kinds of items (a video, an article, an image) in one collection, with shared common fields plus type-specific ones. Useful when the app queries them together as one feed far more often than it needs their differences." },
      { question: "Why do document databases typically still support secondary indexes even though they don't support cheap arbitrary joins?", answer: "Indexes speed up searching one collection by a field other than its id. That's unrelated to joins; you still need fast lookups within a collection even if you avoid joining across collections." },
      { question: "What's the practical effect of embedding data that's frequently updated independently of its parent, like a product's live inventory count embedded in every historical order line item?", answer: "Every change would require updating every document holding a copy. For a fast-changing shared value like stock count, that's a sign to reference it, not embed it." },
      { question: "Why is embedding often described as trading read performance for write/update complexity, and referencing the reverse?", answer: "Embedding gets everything in one read, but updates to shared data must reach every copy. Referencing keeps one easy-to-update source of truth, but every read of the related data costs an extra lookup." },
      { question: "What does 'atomic update' mean for a single document, and why does that favor embedding data you need to update consistently together?", answer: "Most document databases make an update to one document all-or-nothing. Data embedded in one document gets that guarantee for free. Updating two referenced documents consistently needs extra coordination (like a transaction) that isn't automatic." },
      { question: "Why might a shopping cart's line items be a good candidate for embedding, but a product's own catalog details a bad one to embed inside every cart referencing it?", answer: "Line items belong to one cart and are read and written with it, so embedding is safe. A product's price and description are shared by every cart and order that references it and change on their own, so embedded copies would need updating everywhere." },
      { question: "What's the risk of denormalizing a frequently-changing field, like a current stock count, into many documents that reference the same product?", answer: "Every copy must be updated whenever the count changes. If even one update is missed or late, that document shows a wrong stock count." },
      { question: "How does a document database's lack of foreign key constraints change how you enforce referential integrity between referenced documents?", answer: "Nothing in the database stops you storing an id that points at a missing (or later deleted) document. Keeping references valid becomes the app's job." },
      { question: "Why can schema flexibility be both an advantage and a risk in a document database?", answer: "You can change a document's shape without a formal migration, which helps fast iteration. But nothing stops documents in one collection from drifting into inconsistent shapes if the app isn't careful." },
      { question: "What's a practical problem caused by documents in the same collection having drifted into different shapes over time?", answer: "Code reading the collection must handle several shapes for the same kind of document (a missing old field, a renamed field, a changed nested structure) instead of assuming one structure." },
      { question: "Compare a document database's modeling approach to a plain key-value store's — what extra structure does a document format give you?", answer: "A key-value store's value is an opaque blob the database can't look inside. A document is structured, so the database can query, index, and update individual fields without the app loading and parsing the whole thing." },
      { question: "How does a wide-column store's modeling approach differ from a document database's for the same 'posts and comments' example?", answer: "A wide-column store usually has one table per query it must serve, duplicating data into purpose-built tables (e.g. one keyed for 'comments by post', another for 'comments by author'), rather than one flexible document read a few ways." },
      { question: "Why does sharding in a NoSQL database depend heavily on choosing a good partition/shard key, and how does that connect to access-pattern-driven modeling?", answer: "Data is spread across nodes by that key, so a query that doesn't filter on it may have to check every shard instead of one. The same 'design around how it's queried' principle behind embed-vs-reference also drives the shard key choice." },
      { question: "What's the risk of choosing a partition/shard key that doesn't match your most common query pattern?", answer: "Your most frequent query scatter-gathers across every shard instead of hitting one, losing the scalability a well-chosen key should give." },
      { question: "Scenario: a social app embeds a `likes` array of user ids directly inside each post document. What happens as a post goes viral, and how would you redesign it?", answer: "The array grows without limit, so the post gets slower to load and update and may approach the document size limit. Move likes to a separate `likes` collection (one small document per like, referencing the post id) so the post stops growing." },
      { question: "After redesigning likes into a separate collection, how do you still cheaply show a '142 likes' count without counting that collection on every read?", answer: "Keep a denormalized counter on the post, incremented atomically on each like. This hybrid embeds just the summary and references the detailed records." },
      { question: "In a database that offers only eventual consistency across replicas, why can a denormalized duplicate field briefly show stale data after its source is updated?", answer: "A change isn't guaranteed to reach every replica at the same instant. A read from a replica that hasn't caught up can briefly see the old value." },
      { question: "What's the single biggest mindset shift a relational-schema-experienced developer has to make when modeling for a document database?", answer: "Stop asking 'what's the cleanest, duplication-free way to represent this?' and start with 'how will this be read, and what must sit right next to it to avoid an extra lookup?'" },
    ],
    prerequisites: ["normalization"],
    relatedTopics: ["normalization", "joins"],
    keywords: ["NoSQL", "document database", "embedding", "referencing", "MongoDB", "denormalization"],
  },
  {
    id: "window-functions",
    title: "Window Functions",
    level: "advanced",
    description: "Calculate across related rows, like a running total or a rank, without collapsing them as GROUP BY does.",
    explanation: `
Aggregation collapses rows into one summary per group: one row per
customer, one per category. Sometimes you want to keep every row but add a
value computed *from* its group: "each order plus the customer's running
total so far," or "each product's price plus its rank in its category."

A **window function** does this with \`OVER (...)\`, optionally using
\`PARTITION BY\` (which rows form a group) and \`ORDER BY\` (their order
within the group). Unlike \`GROUP BY\`, it doesn't merge rows. Every row
stays, with an extra computed column.
    `.trim(),
    analogy:
      "GROUP BY hands a customer one combined receipt total. A window function hands back every line item, each with a running total (or a rank against everything else they bought) printed on it. Nothing is merged away; each line just gains context.",
    examples: [
      {
        title: "Ranking within a partition",
        code: `SELECT name, category, price,
  RANK() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank
FROM products;`,
        language: "sql",
        explanation: "Every product row is kept, and each also shows its price rank within its category, highest first.",
        walkthrough: [
          { code: "PARTITION BY category", explanation: "Defines the 'window' each rank is computed in. Counting restarts for each category instead of running across the whole table." },
          { code: "ORDER BY price DESC", explanation: "Sets the order RANK() counts through within each partition." },
          { code: "RANK() OVER (...)", explanation: "Computes the current row's rank in that partition and order, while still returning every product, not just the top one per category." },
        ],
      },
      {
        title: "A running total",
        code: `SELECT id, amount,
  SUM(amount) OVER (ORDER BY id) AS running_total
FROM payments;`,
        language: "sql",
        explanation: "Each row shows its amount plus the cumulative sum of every row up to and including it, in id order. No GROUP BY, no rows merged.",
      },
    ],
    howItWorks: `
For each output row, the database finds its "window": the rows that
belong with it (from \`PARTITION BY\`), in the order from \`ORDER BY\`. It
computes the function (\`RANK\`, \`SUM\`, \`ROW_NUMBER\`, \`LAG\`/\`LEAD\`, and
others) over that window.

The original row is still returned as-is, with the result as an extra
column. That's the core difference from \`GROUP BY\`, which discards the
individual rows and returns one row per group.
    `.trim(),
    whyItExists: `
Before window functions, "rank within category" or "running total" needed
a self-join or a correlated subquery per row. That's verbose and slow at
scale, because related rows are reprocessed for every output row instead
of computed in one pass.
    `.trim(),
    whenToUse: `
Use window functions for leaderboards and rankings, running totals or
moving averages, comparing a row with the previous or next one
(\`LAG\`/\`LEAD\`), and "top N rows per group" queries.
    `.trim(),
    whenNotToUse: `
If you want one summary row per group and don't need the individual rows,
plain \`GROUP BY\` is simpler and says exactly that.
    `.trim(),
    commonMistakes: [
      "Leaving out PARTITION BY, so the rank or total runs across the whole table instead of restarting per group.",
      "Mixing up RANK (gaps after ties), DENSE_RANK (no gaps after ties), and ROW_NUMBER (always unique and sequential, ties broken arbitrarily).",
      "Filtering on a window function's result in WHERE. That's not allowed, because WHERE runs before window functions are computed.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use ROW_NUMBER() to number each customer's orders in the order they were placed." },
      { difficulty: "Medium", prompt: "Show each employee's salary with their salary rank within their department." },
      { difficulty: "Hard", prompt: "Explain why WHERE price_rank = 1 fails right after a window function that computes price_rank, and rewrite the query with a CTE so it works." },
    ],
    interviewQuestions: [
      { question: "What's the fundamental difference between GROUP BY and a window function?", answer: "GROUP BY collapses rows into one summary row per group. A window function keeps every row and still computes a value using the row's group as context." },
      { question: "What's the difference between RANK, DENSE_RANK, and ROW_NUMBER?", answer: "RANK leaves gaps after a tie (1, 1, 3), DENSE_RANK doesn't (1, 1, 2), and ROW_NUMBER always gives a unique sequential number, ties or not." },
      { question: "Why can't you filter directly on a window function's result in a WHERE clause?", answer: "WHERE runs before window functions, so the value doesn't exist yet. Compute it in a subquery or CTE and filter in the outer query." },
      { question: "What does PARTITION BY control, and what happens if you omit it entirely?", answer: "It sets which rows form one group for the calculation. Without it, the whole result is one partition, so the function runs across every row instead of restarting per group." },
      { question: "What does ORDER BY inside an OVER(...) clause do for a running-total-style SUM, that's different from its role in RANK?", answer: "For RANK it sets the ranking order. For an aggregate like SUM it sets the order rows accumulate in, which, with the default frame, turns a plain sum into a *running* total up to the current row." },
      { question: "Given `payments(id, amount)` = (1,100), (2,50), (3,200), what does `SELECT id, amount, SUM(amount) OVER (ORDER BY id) AS running_total FROM payments;` output, row by row?", answer: "id 1: 100, id 2: 150, id 3: 350. With ORDER BY and no explicit frame, each total adds up every row from the start of the partition through the current row, in id order." },
      { question: "What is a window function's 'frame', and how does it differ from its partition?", answer: "The partition is the whole group a row belongs to. The frame is the subset of rows *within* it (e.g. 'from the start to the current row') that the function computes over for that row. One partition has many frames as you move from row to row." },
      { question: "What's the default frame for an aggregate window function when ORDER BY is given but no explicit ROWS/RANGE clause is specified?", answer: "`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`: everything from the start of the partition through the current row (and, with RANGE, any rows tied with it on the ORDER BY value)." },
      { question: "Given `products(name, category, price)` = (Alpha, Electronics, 300), (Beta, Electronics, 300), (Gamma, Electronics, 100), (Delta, Furniture, 500), what does `RANK() OVER (PARTITION BY category ORDER BY price DESC)` give each row, versus DENSE_RANK and ROW_NUMBER?", answer: "Electronics: Alpha and Beta tie for top price. RANK gives both 1 and Gamma 3 (skipping 2). DENSE_RANK gives them 1 and Gamma 2 (no gap). ROW_NUMBER gives Alpha/Beta 1 and 2 in arbitrary tie-broken order, and Gamma 3. Furniture is its own partition, so Delta gets 1 in all three." },
      { question: "Why do RANK and DENSE_RANK produce identical results when there are no ties in the ORDER BY column, but diverge as soon as a tie appears?", answer: "Without ties, each row just gets the next number either way. Only a tie makes RANK skip ahead (to account for the tied rows), while DENSE_RANK keeps counting without a gap." },
      { question: "What does LAG() return for the very first row in its partition, by default, and why?", answer: "NULL. The first row has no previous row, and LAG returns NULL in that case unless you give a default." },
      { question: "Given `stock_prices(day, price)` = (1,10), (2,12), (3,9), what does `LAG(price) OVER (ORDER BY day)` output for each row?", answer: "day 1: NULL, day 2: 10, day 3: 12. Each row shows the previous day's price; the first has none." },
      { question: "How would you make LAG() return 0 instead of NULL for the first row?", answer: "Pass a default as the third argument: `LAG(price, 1, 0)` means one row back, defaulting to 0 when there's no such row." },
      { question: "What's the difference between LAG/LEAD and FIRST_VALUE/LAST_VALUE?", answer: "LAG/LEAD look a fixed number of rows before or after the current row. FIRST_VALUE/LAST_VALUE return the value from the first or last row of the current frame, however far away." },
      { question: "Why does LAST_VALUE often unexpectedly return the current row's own value instead of the actual last row in the partition?", answer: "With the default frame (up to the current row), the last row *of the frame* is the current row. To get the true last row of the partition, widen the frame, e.g. `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`." },
      { question: "What is `ROWS BETWEEN n PRECEDING AND CURRENT ROW` used for, and how does it differ from the default frame?", answer: "It computes over a fixed sliding window of the previous `n` rows plus the current one (handy for moving averages), instead of the default ever-growing window from the start of the partition." },
      { question: "Given `sales(day, amount)` = (1,10), (2,20), (3,30), what does `SUM(amount) OVER (ORDER BY day ROWS BETWEEN 1 PRECEDING AND CURRENT ROW)` output?", answer: "day 1: 10 (no previous row, so just itself), day 2: 30 (10+20), day 3: 50 (20+30). A 2-row moving sum, not a running total." },
      { question: "What's the difference between a ROWS frame and a RANGE frame when there are duplicate ORDER BY values?", answer: "ROWS counts physical rows, ignoring ties. RANGE includes every row sharing the boundary row's ORDER BY value, so tied rows can be pulled into the frame together, even beyond the row count you'd expect." },
      { question: "How would you get the top 2 highest-priced products per category using a window function?", answer: "Compute `ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn` in a CTE or subquery, then filter the outer query with `WHERE rn <= 2`." },
      { question: "Why do you need a subquery or CTE to actually filter to 'top N per group', rather than adding a WHERE or LIMIT directly?", answer: "WHERE runs before the window function exists, and LIMIT caps the whole result rather than each group. Both need the rank to already be a column, which only a wrapping subquery or CTE gives you." },
      { question: "How could you use ROW_NUMBER() to remove exact duplicate rows from a table, keeping just one copy of each?", answer: "Partition by the columns that define a duplicate, number rows in each partition with ROW_NUMBER(), and delete (or exclude in a query) every row numbered above 1." },
      { question: "Can you use one window function's result as an argument to another window function in the same SELECT list without a subquery?", answer: "No. Window functions are computed at the same late stage, so one can't see another's output. Compute the first in a subquery or CTE, then use that column in an outer window function." },
      { question: "Where do window functions fit in SQL's logical order of query processing, relative to WHERE, GROUP BY/HAVING, and the final SELECT list?", answer: "After WHERE, GROUP BY, and HAVING (so they see filtered, grouped rows), but before the SELECT list's ordinary expressions and before ORDER BY/DISTINCT. That's why WHERE can't use their results, but ORDER BY can." },
      { question: "Why can an aggregate window function like SUM() OVER(...) appear in the same query as a plain GROUP BY aggregate, and what would that combination be useful for?", answer: "They run at different stages, so they can coexist. For example, group to get per-department totals while a window function compares each row against a separate window, like each employee's salary against the department average, in one query." },
      { question: "What's the performance concern with computing a window function's PARTITION BY/ORDER BY over a very large, unindexed column?", answer: "The database usually needs rows sorted by the partition and order columns. Without a supporting index, it may sort the whole result from scratch, which gets expensive as rows grow." },
      { question: "How does a window function's performance generally compare to an equivalent correlated subquery computing the same per-row value, and why?", answer: "A window function usually runs in one pass over partitioned, sorted data. A correlated subquery reruns its inner query for every outer row, usually doing far more repeated work." },
      { question: "What does NTILE(4) OVER (ORDER BY score) compute, conceptually?", answer: "It splits the ordered rows into 4 roughly equal buckets and labels each row with its bucket (1 to 4). Useful for quartiles and similar equal-sized groups." },
      { question: "Debugging: a query with `RANK() OVER (PARTITION BY department ORDER BY salary DESC)` returns rank 1 for every single row. What's the most likely mistake?", answer: "The ORDER BY inside OVER(...) is missing or not applied. With no ordering, every row in a partition ties with every other, so RANK() gives them all 1." },
      { question: "Why is it a mistake to assume window functions always run slower than writing the same logic as a self-join?", answer: "A window function usually runs in one pass over data partitioned and sorted once. A self-join rescans and rematches the table against itself, which is usually much more expensive." },
      { question: "What can a window function do that a plain aggregate function used without OVER() fundamentally cannot?", answer: "Keep every row in the output while computing a value from its group, instead of collapsing the group into one row." },
    ],
    prerequisites: ["aggregation", "subqueries-and-ctes"],
    relatedTopics: ["aggregation", "subqueries-and-ctes", "joins"],
    keywords: ["window function", "OVER", "PARTITION BY", "RANK", "ROW_NUMBER", "running total", "LAG", "LEAD"],
  },
  {
    id: "upsert-and-conflicts",
    title: "Upsert & Conflict Handling",
    level: "advanced",
    description: "Insert a row, or update it if it already exists, in one atomic statement.",
    explanation: `
Sometimes you don't know whether a row exists yet, like when syncing a
record from another system or incrementing a page-view counter that may
not have started. A \`SELECT\` to check, then an \`INSERT\` or \`UPDATE\`,
isn't safe. Two requests at once can both see "doesn't exist" and both
insert, causing a duplicate-key error or one update silently overwriting
the other.

An **upsert** (\`INSERT ... ON CONFLICT\` in Postgres, \`MERGE\` in standard
SQL and SQL Server) does the check and the write as one atomic operation,
removing that race.
    `.trim(),
    analogy:
      "It's a hotel desk that creates or updates a guest's reservation in one motion, instead of an agent looking the guest up, stepping away, and someone double-booking the room before the agent acts on what they saw.",
    examples: [
      {
        title: "Insert, or update the existing row on conflict",
        code: `INSERT INTO page_views (page_id, views)
VALUES ('home', 1)
ON CONFLICT (page_id)
DO UPDATE SET views = page_views.views + 1;`,
        language: "sql",
        explanation: "If no 'home' row exists, it's inserted with 1 view. If one exists, its views are incremented instead, atomically, with no gap for a race.",
        walkthrough: [
          { code: "INSERT INTO page_views (page_id, views) VALUES ('home', 1)", explanation: "Tries a normal insert, as if no row for this page_id existed." },
          { code: "ON CONFLICT (page_id)", explanation: "Names the unique constraint (on page_id) to watch. If the insert would break it, the fallback runs instead of an error." },
          { code: "DO UPDATE SET views = page_views.views + 1", explanation: "Updates the existing row. page_views.views means the value already in the table, not the attempted new row." },
        ],
      },
      {
        title: "Ignore instead of update",
        code: `INSERT INTO users (email, name)
VALUES ('a@example.com', 'Alice')
ON CONFLICT (email) DO NOTHING;`,
        language: "sql",
        explanation: "If a user with this email exists, the statement does nothing instead of erroring or overwriting. Useful for safe, repeatable deduplication.",
      },
    ],
    howItWorks: `
The database tries the insert. If it would break a unique constraint or
primary key named in \`ON CONFLICT\`, it runs the fallback (\`DO UPDATE\` or
\`DO NOTHING\`) on the existing row instead of raising an error, all as one
atomic operation.

Because it's atomic, no other transaction can slip a conflicting write in
between "check" and "write." A separate SELECT-then-INSERT in app code
can't guarantee that.
    `.trim(),
    whyItExists: `
It removes the race in "check, then act" logic in app code, and saves the
extra round trip of a SELECT before deciding to INSERT or UPDATE.
    `.trim(),
    whenToUse: `
Use an upsert when syncing external data that may already exist,
maintaining counters, building "create or update settings" endpoints, or
deduplicating on a unique column like email.
    `.trim(),
    whenNotToUse: `
When insert and update should trigger different app behavior (like a
"welcome" email only on real creation), an upsert hides which branch ran
unless you inspect what it returned. Separate insert and update logic can
be clearer.
    `.trim(),
    commonMistakes: [
      "Naming a column in ON CONFLICT that has no real unique constraint or primary key. Postgres needs an actual constraint to detect the conflict.",
      "Forgetting that DO UPDATE must use the table name (like page_views.views) to mean the existing row's value, not the attempted new one.",
      "Keeping SELECT-then-INSERT/UPDATE app logic where there's real concurrency, and hitting rare but real races an upsert would avoid.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write an upsert that inserts a product by sku, or increments its stock count if the sku exists." },
      { difficulty: "Medium", prompt: "Write an upsert with ON CONFLICT DO NOTHING that safely deduplicates email signups." },
      { difficulty: "Hard", prompt: "Step by step, show how two simultaneous requests using SELECT-then-INSERT (no upsert) could both succeed and create two rows despite an intended uniqueness rule." },
    ],
    interviewQuestions: [
      { question: "What problem does an upsert solve that a SELECT followed by INSERT or UPDATE doesn't?", answer: "It removes the race between checking whether a row exists and writing it, by making check-and-write one atomic operation." },
      { question: "What must the column(s) named in ON CONFLICT correspond to?", answer: "A real unique constraint or unique index on the table, not just columns that happen to be unique in practice." },
      { question: "What's the difference between ON CONFLICT DO NOTHING and DO UPDATE?", answer: "DO NOTHING silently skips the write on a conflict. DO UPDATE changes fields on the existing conflicting row." },
      { question: "Walk through how two concurrent SELECT-then-INSERT sequences can both 'see' no existing row and both attempt to insert.", answer: "Both run their SELECT at nearly the same moment, before either inserts, so both correctly see no row and both INSERT. The check was right when it ran but stale by the time of the write." },
      { question: "Why doesn't wrapping the SELECT-then-INSERT in a transaction at the default READ COMMITTED isolation level fix that race on its own?", answer: "READ COMMITTED only makes each statement see data committed as of when *it* runs. A second transaction's SELECT can still run (and see nothing) before the first one's INSERT commits, so both can insert." },
      { question: "Why does making the check-and-write a single atomic upsert statement close the race regardless of isolation level?", answer: "There's no gap between check and write for another transaction to slip into. The database detects the conflict and applies the fallback as one operation, so a second concurrent attempt finds the row and takes the DO UPDATE/DO NOTHING path instead of inserting." },
      { question: "What is the `EXCLUDED` pseudo-table in Postgres's INSERT ... ON CONFLICT DO UPDATE, and what does it refer to?", answer: "The row proposed for insertion: the new values from VALUES that hit the conflict. DO UPDATE can use it to refer to the attempted new data, separate from the existing row." },
      { question: "In `DO UPDATE SET views = page_views.views + 1`, why reference the table name (`page_views.views`) rather than `EXCLUDED.views`?", answer: "`page_views.views` is the value already in the existing row. `EXCLUDED.views` is the attempted new value (here, the literal 1), so `EXCLUDED.views + 1` would ignore the row's current count." },
      { question: "What does the standard SQL / SQL Server MERGE statement do, and how does it compare to Postgres's INSERT ... ON CONFLICT?", answer: "MERGE matches a set of source rows against a target table, with different actions for matched and unmatched rows in one statement (typically update if matched, insert if not). ON CONFLICT is a narrower, insert-first version for rows hitting a specific unique constraint." },
      { question: "What's one thing MERGE can express that a single ON CONFLICT clause typically can't?", answer: "MERGE can act on target rows missing from the source (e.g. delete them) and process many source rows against the target in one statement. ON CONFLICT only reacts to conflicts from the rows you're inserting." },
      { question: "How would you make an ON CONFLICT DO UPDATE conditional, and how does that differ from DO NOTHING?", answer: "Add a WHERE after the SET list: `DO UPDATE SET ... WHERE <condition>`. The update applies only when the condition holds. DO NOTHING never touches the row; a false WHERE still recognizes the conflict but changes nothing." },
      { question: "Why can ON CONFLICT target a specific named constraint instead of listing columns directly, and when would you need that?", answer: "Use `ON CONFLICT ON CONSTRAINT constraint_name` when the uniqueness isn't a simple column list (e.g. a rule defined with an expression), or to say exactly which of several unique constraints you mean." },
      { question: "Can ON CONFLICT target a partial unique index (one defined with its own WHERE clause)? What has to match?", answer: "Yes, but the target must match both the indexed columns/expression and the index's WHERE condition. A row outside the partial index's condition can't conflict with it." },
      { question: "How would you find out, after running an upsert, whether it actually inserted a new row or updated an existing one?", answer: "Add a RETURNING clause with something that differs between paths (like `xmax = 0` in Postgres, true only for a fresh insert), or use the value change itself if it's distinguishable." },
      { question: "Why is an upsert alone not enough when insert and update are supposed to trigger genuinely different application behavior, like sending a welcome email only on true creation?", answer: "The statement doesn't tell your code which path it took. Inspect what it returned (e.g. with RETURNING) to branch correctly, instead of assuming it always means 'created'." },
      { question: "What's a gotcha with auto-incrementing primary keys and an upsert that hits a conflict and ends up doing nothing?", answer: "The sequence value generated for the attempted insert is still used up even though no row was created, leaving a permanent gap. Harmless, but surprising the first time." },
      { question: "Why does that sequence-gap behavior happen — why doesn't the database 'give the number back' when the conflicting insert doesn't go through?", answer: "Sequences hand out values without blocking or coordinating with other transactions. Taking a value back depending on a later step would need exactly the locking sequences avoid. Gaps are the price of that speed." },
      { question: "What does 'idempotent write' mean, and how does DO NOTHING support writing idempotent sync code?", answer: "An idempotent write can be applied many times with the same result as once. DO NOTHING makes re-inserting the same row (say, retrying a sync job after a partial failure) a no-op instead of an error." },
      { question: "How would you write a single statement that upserts many rows at once from a bulk import, rather than one row at a time?", answer: "Use a multi-row VALUES list (or `INSERT ... SELECT ...` from a staging table) with one ON CONFLICT clause. Conflicts are handled per row, but it's one statement instead of one round trip per row." },
      { question: "Why is INSERT ... ON CONFLICT generally faster than the equivalent SELECT-then-INSERT/UPDATE application logic, even ignoring the race condition it fixes?", answer: "It's one round trip instead of two or more. A separate SELECT and a conditional INSERT or UPDATE each pay their own network and query-planning overhead." },
      { question: "Scenario: importing 10,000 rows with ON CONFLICT (email) DO NOTHING, the table's row count only grows by 9,000. What happened to the other 1,000, and is it a bug?", answer: "Not a bug. Those 1,000 emails already existed, and DO NOTHING skipped them, exactly as designed for safe, repeatable deduplication." },
      { question: "Debugging: an upsert meant to catch duplicate emails inserted a new row for what looks like the same email, just different casing, instead of updating the existing one. What's the likely explanation?", answer: "The unique constraint is on the raw `email` column, and values differing in case aren't equal to it. You'd need a case-insensitive unique index (e.g. `UNIQUE (LOWER(email))`) with a matching ON CONFLICT target." },
      { question: "Why must the column(s)/expression named in ON CONFLICT match an existing unique constraint or index precisely?", answer: "Postgres needs to know exactly which constraint violation to catch and redirect to the fallback. It can't infer that from columns that happen to be unique without a declared constraint or index." },
      { question: "What error does Postgres raise if you write ON CONFLICT (col) but no unique constraint or index exists on that exact column?", answer: "An error at query time (something like 'there is no unique or exclusion constraint matching the ON CONFLICT specification'). It doesn't silently fall back to a plain insert." },
      { question: "How does MySQL's INSERT IGNORE differ in behavior from Postgres's ON CONFLICT DO NOTHING?", answer: "INSERT IGNORE suppresses a broader set of errors, not only duplicate keys but also things like some data-truncation or not-null violations, turning them into warnings. ON CONFLICT DO NOTHING only handles a conflict with the declared or inferred constraint." },
      { question: "Can ON CONFLICT DO NOTHING be written without naming a specific column or constraint at all — what does it apply to then?", answer: "Yes. Without a target, it skips a row that conflicts with any unique or exclusion constraint. Other violations, such as NOT NULL or CHECK, still raise an error. DO UPDATE requires an explicit target, because it must know which existing row to update." },
      { question: "What isolation-related guarantee is a SELECT ... FOR UPDATE followed by INSERT/UPDATE inside a transaction also trying to achieve, and why is an upsert usually simpler?", answer: "It locks the possibly conflicting row so no other transaction can act on it between check and write. An upsert gives the same race-free result without reasoning about explicit locks, lock ordering, or holding a transaction open across the whole sequence." },
      { question: "Why would separate, explicit INSERT and UPDATE logic still be preferable over an upsert in some cases, despite the upsert being safer against races?", answer: "When insert and update need different behavior (different validation, or side effects like a welcome email), two explicit paths keep the branching obvious, instead of hiding it in one statement whose outcome must be inferred from its return value." },
    ],
    prerequisites: ["transactions-and-acid"],
    relatedTopics: ["transactions-and-acid", "basic-sql-queries"],
    keywords: ["upsert", "ON CONFLICT", "MERGE", "race condition", "atomic", "idempotent write"],
  },
];
