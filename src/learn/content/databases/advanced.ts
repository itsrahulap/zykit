import type { Topic } from "../../types/content";

export const databasesAdvancedTopics: Topic[] = [
  {
    id: "database-migrations",
    title: "Database Migrations",
    level: "advanced",
    description: "Small, versioned scripts that change a database's schema over time, so every environment ends up with the same structure in the same order.",
    explanation: `
Once an application is live, its schema rarely stays frozen — you'll add
a column, create a new table, rename something. Doing that by hand
(logging into production and typing \`ALTER TABLE\` yourself) is risky:
it's easy to forget a step, apply changes in the wrong order, or have
your development database drift out of sync with what's actually running
in production.

A **migration** is a small script that describes one specific schema
change — "add a \`phone_number\` column to \`users\`" — saved as a file,
checked into version control alongside your application code, and
numbered or timestamped so migrations always run in a known, repeatable
order. A migration tool keeps track of which migrations have already
been applied to a given database, so running it again only applies the
new ones.
    `.trim(),
    analogy:
      "Manually editing a live schema is like renovating a house without ever writing down what you changed — nobody else can reliably reproduce it. Migrations are like a numbered set of renovation blueprints: blueprint 1 adds the garage, blueprint 2 adds a window, and any house (any environment — your laptop, staging, production) built by following the blueprints in order ends up identical.",
    examples: [
      {
        title: "A migration file adding a column",
        code: `-- migrations/0007_add_phone_number_to_users.sql

ALTER TABLE users
ADD COLUMN phone_number TEXT;`,
        language: "sql",
        explanation: "This one file describes exactly one schema change. Its filename encodes an order (0007), so a migration tool knows it should run after migration 0006 and before 0008.",
        walkthrough: [
          { code: "-- migrations/0007_add_phone_number_to_users.sql", explanation: "The filename itself records the migration's order and intent — this is migration number 7." },
          { code: "ALTER TABLE users", explanation: "Targets the existing users table rather than creating a new one." },
          { code: "ADD COLUMN phone_number TEXT;", explanation: "The single schema change this migration makes — adding one new column." },
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
        explanation: "Many migration tools pair each change (up) with its exact opposite (down), so a migration can be undone cleanly if it needs to be rolled back.",
      },
      {
        title: "The same idea with Alembic (SQLAlchemy's migration tool)",
        code: `# migrations/versions/a1b2c3_add_phone_number.py

def upgrade():
    op.add_column("users", sa.Column("phone_number", sa.String()))

def downgrade():
    op.drop_column("users", "phone_number")`,
        language: "python",
        explanation: "Alembic is the migration tool most commonly paired with SQLAlchemy/FastAPI — upgrade() and downgrade() are exactly the up/down pair from the JavaScript example, just Python syntax; running `alembic upgrade head` applies every migration not yet recorded, in order.",
      },
    ],
    howItWorks: `
A migration tool keeps a small table inside the database itself (often
literally called \`schema_migrations\`) recording which migration files
have already been run. When you run the tool, it compares that record
against the migration files that exist, and applies only the ones not
yet marked as applied — in order.

Because migrations are just files, they travel with your codebase
through version control: every developer, and every environment
(development, staging, production), can run the exact same sequence of
migrations and end up with an identical schema, instead of drifting
apart from manual changes.
    `.trim(),
    whyItExists: `
Manual schema changes don't scale past a single person working on a
single database. The moment there's more than one developer, more than
one environment, or a need to deploy schema changes alongside code
changes in a repeatable way, you need changes to be recorded, ordered,
and re-runnable — which is exactly what migrations provide.
    `.trim(),
    whenToUse: `
Use migrations for essentially every schema change on any application
with more than one environment or more than one contributor — adding
columns, creating tables, changing constraints, backfilling data as part
of a schema change.
    `.trim(),
    whenNotToUse: `
For a true one-off, throwaway local prototype with a single developer
and no shared environments, the overhead of formal migration files may
not be worth it yet — though it's worth adopting them as soon as the
project is shared with anyone else or deployed anywhere.
    `.trim(),
    commonMistakes: [
      "Editing a migration file after it's already been applied elsewhere, instead of writing a new migration — this leaves environments that already ran the old version out of sync.",
      "Making a schema change directly against production to 'fix it quickly,' bypassing migrations entirely and causing drift from what the migration history says the schema should be.",
      "Writing a migration that changes both schema and large amounts of data in one long-running step, risking locking the table for a long time in production.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a migration that adds a boolean is_active column, defaulting to true, to a users table." },
      { difficulty: "Medium", prompt: "Write a migration that creates a new tags table and a join table linking tags to posts (a many-to-many relationship)." },
      { difficulty: "Hard", prompt: "Explain why editing an already-applied migration file, instead of writing a new one, can cause a team's databases to drift out of sync with each other." },
    ],
    interviewQuestions: [
      { question: "What is a database migration?", answer: "A versioned script describing one specific schema change, saved as a file and tracked in a known order, so it can be applied consistently and repeatably across every environment." },
      { question: "What do the `up` (or `upgrade`) and `down` (or `downgrade`) parts of a migration represent?", answer: "`up`/`upgrade` applies the change going forward; `down`/`downgrade` is meant to be its exact opposite, so the same migration file can both apply the change and cleanly undo it later." },
      { question: "How does a migration tool decide which migrations still need to run, and in what order?", answer: "It keeps a table inside the database (often literally `schema_migrations`) recording which migration files have already been applied, compares that against the files that exist, and runs only the unapplied ones in filename order." },
      { question: "Why shouldn't you edit an already-applied migration file instead of writing a new one?", answer: "Environments that already ran the original version won't see the edit, so their schema silently drifts out of sync with any environment that runs the edited file fresh." },
      { question: "Concretely, what breaks when a team edits an applied migration instead of adding a new one?", answer: "A developer whose database already recorded that migration as applied keeps the old schema forever, while anyone running migrations from scratch gets the edited version — and the migration tracking table can't detect this, since it only records *that* a migration ran, not *what* it currently contains." },
      { question: "Why is a down migration risky specifically when the up migration dropped a column or table?", answer: "The down migration can recreate the empty structure, but it can't recover the data that existed in it — running down after an up that dropped something looks like a clean rollback while the data itself is already permanently gone." },
      { question: "What does 'zero-downtime migration' mean, and why can an ordinary schema change threaten uptime?", answer: "It means never having a moment where the running application code and the current schema are incompatible with each other; a change like renaming or dropping a column the live code still reads can break every request the instant it runs." },
      { question: "Describe the 'expand-contract' pattern for renaming a column without downtime.", answer: "*Expand*: add the new column (nullable) and have the app write to both old and new columns, then backfill existing rows into the new one; once every app instance is confirmed reading the new column, *contract*: drop the old column in a later, separate migration." },
      { question: "Why can adding a `NOT NULL` column with no default be riskier than adding a nullable one?", answer: "The database needs a value for every existing row the instant the constraint takes effect; with no default supplied there's nothing to put there, so the statement is rejected outright (or, where the engine must backfill every row to satisfy it, can hold a long lock rewriting the whole table), while a nullable column simply stores `NULL` for existing rows untouched." },
      { question: "Why does a plain `CREATE INDEX` risk blocking writes on a large production table, and what's Postgres's alternative?", answer: "Building the index normally takes a lock that blocks writes to the table for the whole build; `CREATE INDEX CONCURRENTLY` builds it without that exclusive lock, at the cost of taking longer and needing two passes over the table." },
      { question: "Why can't `CREATE INDEX CONCURRENTLY` run inside the same transaction as other migration statements?", answer: "Postgres requires it to run outside a transaction block, since it internally uses multiple transactions to build the index safely — a migration tool has to run it as its own separate, non-transactional step." },
      { question: "What's the danger of renaming a column in one atomic migration during a rolling deploy?", answer: "While old and new application instances run side by side during the rollout, the old instances still expect the original column name — the instant the rename runs, every one of them starts failing." },
      { question: "What is a 'backward-compatible' migration, and why does it matter for rolling deploys?", answer: "One that leaves the schema working for both the code currently running and the code about to be deployed at the same time, so neither the outgoing nor incoming instances break during the window both are live." },
      { question: "Why do migration tools enforce a strict run order instead of letting migrations run in any order?", answer: "Later migrations routinely assume earlier ones already ran — a migration adding a foreign key assumes the referenced table already exists — so applying them out of order can fail or corrupt the schema." },
      { question: "What happens when two developers on separate branches each create a migration numbered `0012`?", answer: "A naming collision that makes it ambiguous which one should run first once the branches merge — teams either resolve it manually at merge/review time or avoid it by using timestamp-based filenames instead of small sequential integers." },
      { question: "Why do many teams prefer timestamp-based migration filenames over small sequential integers?", answer: "Two developers working in parallel are very unlikely to create a migration in the same millisecond, while two people independently picking the next small integer (e.g. both choosing `0012`) collide easily." },
      { question: "What's the difference between a schema migration and a data migration, and why is mixing them risky?", answer: "A schema migration changes structure (tables/columns); a data migration changes or backfills the actual row values. Mixing both in one migration — e.g. adding a column, then updating millions of rows in the same step — risks one long-running statement holding a lock for its entire duration, instead of a fast schema change followed by a batched backfill off the critical path." },
      { question: "Why batch a large backfill into many small updates instead of one large `UPDATE`?", answer: "A single huge update can hold locks and generate a large amount of transaction log in one go and, if interrupted partway, has to restart from scratch; batching keeps each transaction small, releases locks between batches, and preserves progress if it's interrupted." },
      { question: "What does it mean for a migration to run inside a transaction, and why doesn't every database support that fully for schema changes?", answer: "Wrapping a migration's statements in a transaction means a failure partway rolls back the whole thing cleanly instead of leaving the schema half-changed; Postgres supports this for most DDL, but some databases (e.g. MySQL) implicitly commit DDL statements as they run, so a mid-migration failure there can leave the schema partially applied." },
      { question: "If a migration fails partway through on a database without transactional DDL, what state is left, and what has to happen next?", answer: "Some statements before the failure point are already committed while the rest never ran, leaving a schema that matches neither the old nor the new version — it has to be diagnosed and fixed manually (often with a corrective migration), since simply re-running the same file may error again on the part that already succeeded." },
      { question: "Why do teams sometimes 'squash' old migrations into one baseline file, and what's lost by doing so?", answer: "A long migration history becomes slow to replay from scratch (e.g. building a fresh test database) and cluttered; squashing consolidates it into one current-schema file, at the cost of destroying the fine-grained history of exactly how the schema evolved, one change at a time." },
      { question: "What's the risk of applying an autogenerated migration without reviewing it first?", answer: "Autogeneration diffs the ORM's model definitions against the database and infers the change, but it can miss what it can't detect or generate something unsafe for production scale — reviewing the actual generated SQL before running it is essential." },
      { question: "Why might autogeneration turn a column rename into 'drop old column, add new column' instead of an actual rename?", answer: "It typically diffs the old and new schema by name and has no way to know a dropped field and an added field were meant to be the same column rather than two unrelated changes — generating the drop+add it can detect would delete that column's existing data if applied as-is." },
      { question: "Why run migrations as part of CI/CD instead of manually per environment?", answer: "It guarantees every environment — a fresh CI database, staging, production — applies migrations consistently in the same automated step as the code deploy, instead of depending on someone remembering to run them by hand, which is exactly the drift migrations exist to prevent." },
      { question: "Should a migration that adds a column run before or after deploying code that reads it? What about one dropping a column old code still reads?", answer: "Adding a column a new code version needs should run *before* that code deploys, so the column already exists; dropping a column old code still reads should run only *after* every instance is confirmed to be on code that no longer needs it — reversing either order is what breaks a rolling deploy." },
      { question: "What's a seed/fixture script, and why is it usually kept separate from schema migrations?", answer: "It inserts default or sample data (an initial admin user, reference lookup rows); it's kept separate because it's about populating data for a particular environment, not describing a structural change every environment must apply identically." },
      { question: "Why is it good practice for a migration to be safe to re-run, even though the tool already tracks what's applied?", answer: "It guards against edge cases like the tracking table getting out of sync or a migration being manually re-attempted, so a retry doesn't error out or corrupt the schema — e.g. guarding a table creation with `CREATE TABLE IF NOT EXISTS`." },
      { question: "What does `alembic upgrade head` actually do?", answer: "It applies every migration not yet recorded as run, in order, up through the most recent one ('head') in the migration chain." },
      { question: "How does Alembic typically chain migrations together, and how does that differ from relying on a filename's number?", answer: "Each migration records the revision id of the one before it, forming a linked chain, rather than depending purely on a filename's sequential number — so ordering stays correct even when migrations are merged from different branches out of numeric sequence." },
      { question: "Why does `op.drop_column` in a downgrade function lose data, and when is that an acceptable tradeoff?", answer: "Dropping the column deletes every value stored in it for every row; that's acceptable when a rollback happens shortly after a failed deploy, before the column has been meaningfully populated — not once it's been in real use." },
      { question: "What's the difference between rolling back a migration and writing a new migration that reverses an earlier one?", answer: "Rolling back runs the recorded down script for that specific migration and un-marks it as applied; writing a new forward migration instead applies a brand-new step and keeps the history moving in one direction — many teams prefer the latter once a migration has already reached production, since it avoids requiring every environment to support running rollbacks." },
      { question: "How would you change a large, actively-written-to table's column type without significant downtime?", answer: "Use the expand-contract approach: add a new column of the target type, dual-write to both, backfill existing rows in batches, switch reads over to the new column, then drop the old column in a later migration — instead of a single blocking type-conversion statement that rewrites the whole table at once." },
      { question: "Why test a migration's down/rollback path, not just its up path?", answer: "An untested down migration might not actually restore the previous schema, or might error outright — a problem that only becomes visible during a real rollback under pressure, exactly when you can least afford it to fail." },
    ],
    prerequisites: ["orms"],
    relatedTopics: ["orms", "normalization"],
    keywords: ["migration", "schema change", "version control", "schema_migrations"],
  },
  {
    id: "query-optimization",
    title: "Query Optimization",
    level: "advanced",
    description: "Reading what a database actually plans to do to execute a query, and using that to figure out why it's slow and how to speed it up.",
    explanation: `
When a query is slow, guessing why rarely works well — you need to see
what the database is actually doing. Every database has a way to ask it
to explain its plan before (or while) running a query, usually via an
\`EXPLAIN\` command. This shows you things like whether it's scanning
every row in a table, whether it's using an index, and roughly how much
work each step is estimated to cost.

**Query optimization** is the practice of reading that plan, spotting
the expensive parts (often a full table scan where an index lookup
would help, or a poorly ordered join), and fixing them — usually by
adding an index, rewriting the query, or occasionally restructuring the
schema.
    `.trim(),
    analogy:
      "Running EXPLAIN on a slow query is like asking a delivery driver to describe their planned route before they leave. If they say 'I'll drive past every house in the city checking addresses one by one,' you immediately know why the delivery is slow, and you can fix it — hand them a map (an index) instead.",
    examples: [
      {
        title: "Reading a query plan",
        code: `EXPLAIN SELECT * FROM orders WHERE customer_email = 'amara@example.com';

-- Output might show:
-- Seq Scan on orders  (cost=0.00..18334.00 rows=1 width=72)
--   Filter: (customer_email = 'amara@example.com'::text)`,
        language: "sql",
        explanation: "'Seq Scan' means a sequential (full table) scan — the database is checking every row. On a large table, that's the expensive part to fix.",
        walkthrough: [
          { code: "EXPLAIN SELECT * FROM orders WHERE customer_email = 'amara@example.com';", explanation: "Asks the database to describe how it would execute this query, without necessarily running it." },
          { code: "Seq Scan on orders  (cost=0.00..18334.00 rows=1 width=72)", explanation: "Says the database plans to sequentially scan the whole orders table — the estimated cost (18334) is high for finding just one row." },
          { code: "Filter: (customer_email = 'amara@example.com'::text)", explanation: "Confirms it's checking this condition against every row it scans, one at a time." },
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
        explanation: "After the index exists, the plan switches to an 'Index Scan' with a dramatically lower estimated cost — the database jumps to matching rows instead of checking every one.",
      },
    ],
    howItWorks: `
Before running a query, the database's query planner considers multiple
possible ways to execute it (scan the whole table, use this index, use
that index, join in this order versus that order), estimates the cost of
each, and picks the plan it believes will be cheapest, based on
statistics it keeps about the data (like how many rows a table has, or
how many distinct values a column contains).

\`EXPLAIN\` reveals that chosen plan (and often, with a variant like
\`EXPLAIN ANALYZE\`, the plan's actual measured cost after really running
it). Common fixes once you spot a problem: add a missing index, rewrite
a query to avoid an operation that blocks index use (like wrapping an
indexed column in a function), or restructure an inefficient join.
    `.trim(),
    whyItExists: `
Query optimization exists because a database's planner, while
sophisticated, works from statistics and heuristics — it can make a
poor choice, or a query can be written in a way that prevents it from
using an index it otherwise could. Being able to see and reason about
the actual execution plan is what turns "this query is slow" from a
guessing game into a solvable, evidence-based problem.
    `.trim(),
    whenToUse: `
Reach for query optimization whenever a specific query is measurably
slow, or before shipping a new query against a table you expect to grow
large — checking the plan early can catch a missing index before it
becomes a production problem.
    `.trim(),
    whenNotToUse: `
Don't spend time optimizing a query that already runs fast and only
touches a small amount of data — premature optimization adds complexity
for no real benefit. Focus effort on queries that are actually measured
to be slow or that run extremely often.
    `.trim(),
    commonMistakes: [
      "Adding an index without checking whether the query planner actually uses it — sometimes the fix requires rewriting the query, not just adding an index.",
      "Optimizing based on a guess instead of actually reading the EXPLAIN output, and fixing the wrong thing.",
      "Testing query performance only on a small local database, where a full table scan is fast enough to hide a problem that will appear at production scale.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain what a 'Seq Scan' in a query plan tells you about how the database is executing that query." },
      { difficulty: "Medium", prompt: "Given a slow query filtering on an unindexed column, describe the steps you'd take to diagnose and fix it." },
      { difficulty: "Hard", prompt: "Explain why wrapping an indexed column in a function inside a WHERE clause (e.g. LOWER(email) = ...) can prevent the database from using that column's index." },
    ],
    interviewQuestions: [
      { question: "What does the `EXPLAIN` command show you?", answer: "The execution plan the database intends to use for a query — whether it scans the whole table or uses an index, in what order it joins tables, and the estimated cost of each step." },
      { question: "What's the difference between `EXPLAIN` and `EXPLAIN ANALYZE`?", answer: "`EXPLAIN` shows the planned strategy and estimated costs without running the query; `EXPLAIN ANALYZE` actually executes it and reports the real, measured row counts and timings alongside the plan." },
      { question: "Name one common fix for a slow query doing a full table scan.", answer: "Adding an index on the column used in the `WHERE` clause or join condition, so the database can look up matching rows directly instead of checking every row." },
      { question: "What's the difference between a `Seq Scan` and an `Index Scan` in a query plan?", answer: "A `Seq Scan` reads every row in the table in order and checks each against the filter; an `Index Scan` uses an index to jump straight to the rows that match, without touching the rest." },
      { question: "Why might the planner choose a `Seq Scan` even when an index exists on the filtered column?", answer: "If the table is small, or the filter matches a large fraction of its rows, scanning it directly can be estimated as cheaper than the overhead of random-access index lookups — an index only pays off when it narrows the result down a lot." },
      { question: "What do the two numbers in a cost estimate like `cost=0.42..8.44` mean?", answer: "The first is the estimated *startup cost* — the work needed before the first row can be returned — and the second is the estimated *total cost* to return every row of that step." },
      { question: "What does the `rows=` estimate in an EXPLAIN plan represent, and where does it come from?", answer: "The planner's guess at how many rows that step will return, derived from statistics it keeps about the table — like how many rows it has and how many distinct values a column contains — not an actual count." },
      { question: "Why can EXPLAIN ANALYZE show a very different 'actual rows' than the plan's estimated 'rows', and why does that matter?", answer: "It means the planner's statistics are stale or the data's distribution is unusual, so its cost estimates (and therefore its choice of plan) may be based on a badly wrong guess — a large gap between estimated and actual rows is a strong signal to re-run `ANALYZE` on the table." },
      { question: "What is an `Index Only Scan`, and how does it differ from a regular `Index Scan`?", answer: "A regular index scan finds matching entries in the index, then still has to fetch the actual row from the table (the 'heap') for any column not stored in the index; an index-only scan can answer the query using just the index's own data, skipping that extra fetch." },
      { question: "What's a 'covering index', and why does it enable an index-only scan?", answer: "An index that includes every column the query needs, not just the one it filters on — because nothing outside the index has to be read, the database can skip visiting the table's actual rows entirely." },
      { question: "Why does an index scan in Postgres often still need to fetch the row from the table, whereas MySQL's InnoDB frequently doesn't for primary-key lookups?", answer: "Postgres stores table data as an unordered heap with indexes pointing into it, so most index scans require a separate fetch from the heap; InnoDB physically clusters row data around the primary key, so a primary-key index lookup already has the row data attached." },
      { question: "What is a `Bitmap Heap Scan`/`Bitmap Index Scan` pair, and when does the planner use it instead of a plain index scan?", answer: "The bitmap index scan builds an in-memory map of which pages contain matching rows, then the bitmap heap scan visits just those pages in physical order; the planner favors this when a query matches enough rows that jumping around row-by-row via a plain index scan would mean too much random I/O." },
      { question: "Why does wrapping an indexed column in a function (e.g. `LOWER(email) = ...`) typically prevent the planner from using an index on that column?", answer: "A standard index stores the column's raw values, not the result of applying a function to them, so the planner can't match `LOWER(email)` against an index built on plain `email` — it has to fall back to checking every row." },
      { question: "Instead of wrapping the column in `LOWER()`, how would you index a case-insensitive lookup so the planner can still use it?", answer: "Create a functional/expression index on the exact expression used in the query, e.g. `CREATE INDEX ON users (LOWER(email))`, so the index stores the lowercased values the query is actually filtering on." },
      { question: "Why does a leading wildcard in `LIKE '%something'` prevent a standard B-tree index from helping?", answer: "A B-tree index is ordered by the column's value from the start, so it can quickly jump to entries matching a known prefix; a pattern that can match anywhere in the string gives it no fixed starting point to jump to, so it still has to check every entry." },
      { question: "In a composite index on `(a, b)`, why can a query filtering only on `b` fail to use that index efficiently?", answer: "A composite index is ordered first by `a` and only by `b` within each value of `a`, so without a condition on `a` there's no way to narrow down where matching `b` values live — the database would have to scan the whole index anyway." },
      { question: "Why does column order matter when creating a composite index meant to speed up a query filtering on multiple columns?", answer: "The index can only be searched efficiently starting from its leading column(s); putting the most selective, most-often-filtered condition first lets the database narrow the search fastest, while the wrong order can leave the index barely more useful than a full scan." },
      { question: "What role does the `ANALYZE` command play in query planning (as distinct from `EXPLAIN ANALYZE`)?", answer: "`ANALYZE` recomputes and stores the table statistics — row counts, distinct value estimates, data distribution — that the planner relies on to estimate costs; without it, those statistics grow stale and the planner's choices get worse." },
      { question: "What happens to query plans if a table's statistics are stale, for example right after a large bulk load, and how do you fix it?", answer: "The planner keeps costing plans based on the old row counts and distributions, which can lead it to a plan that's wrong for the table's new size or shape — running `ANALYZE` (many databases also do this automatically on a schedule) refreshes the statistics so it can plan accurately again." },
      { question: "At a high level, what's the difference between a nested loop join, a hash join, and a merge join?", answer: "A nested loop join scans one input and, for each row, looks up matches in the other (cheap when one side is small or well-indexed); a hash join builds an in-memory hash table from one side and probes it with the other (good for larger unsorted inputs); a merge join walks both inputs in sorted order together (good when both are already sorted on the join key)." },
      { question: "Why does join order matter for a multi-table query, and who decides it?", answer: "Joining tables in a different order can hugely change how many intermediate rows have to be produced and processed along the way; the query planner decides the order itself based on estimated costs, unless the number of tables is large enough that it falls back to heuristics instead of exhaustively costing every ordering." },
      { question: "Given a tiny 4-row `orders` table with no `WHERE` clause at all, what would `EXPLAIN SELECT * FROM orders;` show, even with an index on `id`?", answer: "A `Seq Scan on orders` — with no filter, every row must be returned anyway, so scanning the table directly is at least as cheap as consulting an index, and avoids the overhead of doing so; the existence of an index doesn't change this." },
      { question: "Debugging: a query has run fine in production for months and suddenly gets slow, with no change to the query text or schema. What's the first thing to check?", answer: "Whether the table's size or data distribution has changed enough that the previous plan (e.g. index scan) is no longer the cheapest one, or its statistics have gone stale — re-run `EXPLAIN ANALYZE` to see whether the plan itself has changed, and check when statistics were last updated." },
      { question: "Debugging: EXPLAIN shows the query is already using an index, but it's still slow. What's a likely reason?", answer: "The index scan is still matching a large number of rows (low selectivity), so it's not actually narrowing the work much, or the query needs columns outside the index and is paying for a heap fetch on every matched row." },
      { question: "Why might adding an index make a table's writes slower, and how is that a tradeoff against faster reads?", answer: "Every insert, update, or delete has to keep each index on the table in sync as well as the table itself, so more indexes mean more work per write — indexes trade some write throughput for faster reads on the columns they cover." },
      { question: "What's the practical effect of having too many indexes on a heavily written-to table?", answer: "Write throughput degrades because every write has to update every one of those indexes, and many of them may barely be used by actual queries — a table's index set generally needs periodic review against what's really being queried." },
      { question: "What's the difference between the 'cost' units shown by EXPLAIN and actual wall-clock time?", answer: "Cost is an abstract, internal unit the planner uses to compare plans against each other (roughly calibrated to disk-page fetches and per-row processing), not a prediction of milliseconds — only `EXPLAIN ANALYZE`'s actual timings tell you real elapsed time." },
      { question: "What is a correlated subquery, and why can it be much slower than an equivalent join?", answer: "A subquery that references a column from the outer query, so it has to be re-evaluated once per outer row; a join, by contrast, lets the planner process the two tables together in a single pass instead of repeating a lookup for every row." },
      { question: "What does `EXPLAIN (ANALYZE, BUFFERS)` add over plain `EXPLAIN ANALYZE`, and why is that useful?", answer: "It reports how many data pages were read from cache versus read from disk for each step, which helps distinguish a step that's slow because of genuine disk I/O from one that's slow for some other reason entirely." },
      { question: "Why can two queries that return the same result set produce different EXPLAIN plans and different performance?", answer: "The planner works from the query's structure, not its intent — a rewritten version (a join instead of a subquery, a different clause order, an added redundant condition) can open up or shut off plan choices the original phrasing didn't, even though the final rows returned are identical." },
      { question: "Why can a query that performs well in local testing turn out to be slow in production despite identical query text?", answer: "A small local dataset can make a full table scan fast enough to hide a missing index entirely, and the planner may even choose different plans at different table sizes — a plan that's fine for thousands of rows can be the wrong one at millions." },
    ],
    prerequisites: ["indexes", "joins"],
    relatedTopics: ["indexes", "joins", "connection-pooling"],
    keywords: ["EXPLAIN", "query plan", "query optimization", "seq scan", "index scan"],
  },
  {
    id: "connection-pooling",
    title: "Connection Pooling",
    level: "advanced",
    description: "Keeping a small set of already-open database connections ready to reuse, instead of opening (and closing) a brand-new one for every request.",
    explanation: `
Opening a connection to a database isn't free — it involves a network
handshake, authentication, and setup work on both the application side
and the database side, taking real time (often tens of milliseconds).
If a web server opens a fresh connection for every single incoming
request and closes it when done, that overhead gets paid over and over,
and a sudden burst of traffic can open so many connections at once that
the database itself becomes overwhelmed (every database has a hard
limit on how many connections it can handle at once).

**Connection pooling** solves this by keeping a fixed-size set of
already-open connections — a **pool** — ready to go. When application
code needs to talk to the database, it borrows a connection from the
pool, uses it, and returns it to the pool when finished, rather than
opening and closing a new one each time.
    `.trim(),
    analogy:
      "Opening a new connection per request is like renting a brand-new car from scratch (paperwork and all) every time you need to run one errand, then scrapping it afterward. Connection pooling is like a car-sharing service with a small fleet of cars already fueled and ready — you check one out, use it, and return it for the next person, instead of building a new car every time.",
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
        explanation: "Every single request pays the full cost of opening and later closing a connection, even under heavy, repeated traffic.",
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
        explanation: "The pool keeps between 2 and 10 connections open and ready. Each request borrows one, uses it, and gives it back — no repeated connection setup cost.",
        walkthrough: [
          { code: "const pool = createConnectionPool({ min: 2, max: 10 });", explanation: "Sets up a pool that keeps at least 2 connections open, and never opens more than 10 at once." },
          { code: "const connection = await pool.acquire();", explanation: "Borrows an already-open connection from the pool (or opens a new one if none are free and the pool hasn't hit its max)." },
          { code: "const user = await connection.query(...)", explanation: "Uses the borrowed connection to run the query, same as any direct connection would." },
          { code: "pool.release(connection);", explanation: "Returns the connection to the pool instead of closing it, so the next request can reuse it immediately." },
        ],
      },
    ],
    howItWorks: `
The pool maintains a set of open connections, somewhere between a
configured minimum and maximum count. When code asks to "borrow" a
connection, the pool hands over one that's currently idle (or opens a
new one if under the max and none are free); if the pool is already at
its max and all connections are busy, the request waits until one is
returned. When code finishes, it "releases" the connection back to the
pool rather than closing it, making it available for the next borrower.

This caps the total number of connections the database ever sees at
once (protecting it from being overwhelmed), while avoiding the repeated
setup cost of opening a brand-new connection for every single unit of
work.
    `.trim(),
    whyItExists: `
Databases have a hard limit on simultaneous connections, and opening a
connection is comparatively expensive. Without pooling, an application
under real traffic would either pay that connection-setup cost
constantly or risk exhausting the database's connection limit entirely
during a traffic spike, causing new requests to fail outright.
    `.trim(),
    whenToUse: `
Use connection pooling in essentially any application server that
talks to a database and handles more than one request at a time — it's
standard practice in production web applications, and most database
drivers and ORMs either build it in or support it directly.
    `.trim(),
    whenNotToUse: `
A short-lived script that opens one connection, does its work, and exits
doesn't need a pool — the overhead of one connection isn't worth
managing a whole pool for. Pooling earns its keep specifically under
repeated, concurrent access.
    `.trim(),
    commonMistakes: [
      "Forgetting to release a borrowed connection back to the pool, which eventually exhausts the pool and makes every subsequent request wait forever.",
      "Setting the pool's max size larger than the database's actual maximum connection limit, especially when running many application server instances that each have their own pool.",
      "Assuming pooling makes individual queries faster — it removes connection setup overhead, but a slow query is still just as slow.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, why opening a brand-new database connection for every single web request is wasteful." },
      { difficulty: "Medium", prompt: "Describe what would happen to a database if 500 application server instances each opened their own pool with a max of 20 connections." },
      { difficulty: "Hard", prompt: "Explain a bug scenario where forgetting to release a connection back to the pool would eventually cause every request to hang." },
    ],
    interviewQuestions: [
      { question: "What problem does connection pooling solve?", answer: "It avoids paying the cost of opening and closing a database connection for every single request, and caps the total number of simultaneous connections the database ever has to handle." },
      { question: "What happens when all connections in a pool are in use and a new request needs one?", answer: "The request waits until a connection is released back to the pool, or — if the pool is under its configured maximum — a new connection is opened for it." },
      { question: "Why can't you just set a connection pool's maximum size arbitrarily high?", answer: "The database itself has a hard limit on simultaneous connections, and exceeding it — especially with many application instances each running their own pool — can overwhelm or start rejecting connections outright." },
      { question: "Why is opening a database connection expensive in the first place?", answer: "It involves a network round trip, a TLS/authentication handshake, and setup work on both sides — real time, often tens of milliseconds, that has nothing to do with the actual query you wanted to run." },
      { question: "Besides the client's cost, why does the database itself pay a real cost per open connection?", answer: "Most databases spin up a dedicated backend process or thread per connection, holding onto memory and other resources for as long as that connection stays open, whether or not it's actively doing anything." },
      { question: "What's the difference between a pool's `min` and `max` settings?", answer: "`min` is the smallest number of connections the pool keeps open and ready even when idle; `max` is the ceiling it will never open more connections beyond, no matter how much demand there is." },
      { question: "Why keep a nonzero `min` of idle connections rather than letting the pool shrink to zero when idle?", answer: "So the very next request doesn't have to pay the full connection-setup cost from scratch — a warm, already-open connection is ready to hand out immediately." },
      { question: "What's a common cause of pool exhaustion that isn't simply too much traffic?", answer: "Application code that borrows a connection and never releases it back — a bug, an unhandled exception that skips the release step, or a forgotten `finally` block — which quietly shrinks the pool's usable capacity over time." },
      { question: "Walk through how one leaked (never-released) connection eventually stalls every request, even under otherwise normal load.", answer: "Each leak permanently removes one connection from the pool's available supply; repeat it enough times (or even just enough for one bug to fire repeatedly) and eventually every connection is 'checked out' forever, so every new request waits indefinitely for a connection that's never coming back." },
      { question: "What is connection pool starvation caused by a single long-running query or transaction?", answer: "One request holds its borrowed connection for an unusually long time (a slow query, a transaction left open waiting on something else), which — especially in a small pool — can leave every other request waiting behind it even though nothing is actually leaked." },
      { question: "Why can a burst of reconnects after a brief outage or app restart overwhelm a database even with pooling in place?", answer: "If many application instances all start up or reconnect at once, each trying to fill its pool back up to its configured minimum immediately, the database can face a sudden spike of new connection attempts all at once, rather than the gradual load pooling is meant to smooth out." },
      { question: "What's a commonly cited starting guideline for sizing a connection pool, and why is 'bigger is always better' wrong?", answer: "A frequently cited rule of thumb sizes the pool relative to the number of CPU cores the database has available (small pools, roughly on that order, tend to perform best) — because past a certain point, more concurrent connections just means more contention for the same limited CPU and I/O, so throughput plateaus or actually drops rather than increasing." },
      { question: "Why might increasing a pool's max size from 10 to 100 make overall throughput worse instead of better?", answer: "Beyond what the database's CPU and disks can actually process concurrently, more open connections just means more queries competing for the same fixed resources at once, adding context-switching and lock-contention overhead instead of doing more real work." },
      { question: "What's the difference between a connection pool built into the application/ORM and an external pooler like PgBouncer running as its own service?", answer: "A client-side pool is per-application-instance, so its `max` multiplies by however many instances you run; an external pooler sits between all of them and the database as one shared layer, letting many app-side connections share a much smaller number of actual database connections." },
      { question: "Why might you run an external pooler in front of a database even when your app already has its own client-side pool?", answer: "It caps the total connections the database sees across every application instance combined, rather than each instance's pool independently adding to the total — important once you're running many instances, each with its own pool." },
      { question: "What's the practical difference between 'session pooling', 'transaction pooling', and 'statement pooling' modes in a tool like PgBouncer?", answer: "Session pooling assigns one database connection to a client for its whole session; transaction pooling hands the connection back to the pool the instant each transaction commits, letting far more clients share the same database connections; statement pooling releases it after every single statement, sharing connections even more aggressively but supporting the least." },
      { question: "Why can transaction-mode pooling break features like session-level prepared statements or advisory locks?", answer: "Those features are tied to one specific physical database connection persisting across statements; in transaction mode, a client can be handed a *different* underlying connection for its next transaction, so anything that depended on state left on the previous one is no longer there." },
      { question: "Why does deploying many application server instances, each with its own pool, multiply the effective connection count the database sees?", answer: "Every instance opens up to its own configured max, independently of the others, so the database ends up facing the sum of all of their maximums at once rather than one shared ceiling." },
      { question: "What's a connection health check or validation query, and why does a pool need one?", answer: "A trivial query (or protocol-level check) the pool runs before handing a connection out, confirming it's still actually alive; without it, a connection that silently died (a network blip, a database restart) could be handed to a request that would then fail using it." },
      { question: "Why is serverless/lambda-style compute a notoriously bad fit for pooling directly against the database, and what's the usual fix?", answer: "Each short-lived function instance can spin up its own pool, and at scale that means huge numbers of instances all opening connections independently, quickly exceeding the database's connection limit; the usual fix is putting a shared external pooler between the functions and the database instead of pooling per-instance." },
      { question: "What's the difference between an idle timeout on a pooled connection and the pool's overall max size?", answer: "The idle timeout controls how long an unused connection is kept open before the pool closes it (letting the pool shrink back toward `min` during quiet periods); `max` is a hard ceiling on how many connections can ever be open at once, regardless of idle time." },
      { question: "Why doesn't pooling make a slow query run faster?", answer: "Pooling only removes the overhead of opening and closing a connection — it hands the query a ready-made connection, but everything about executing that query afterward (the query itself, indexes, table size) is unaffected." },
      { question: "Compare a connection pool to a thread pool conceptually — where does the analogy hold, and where does it break down?", answer: "Both reuse a limited, expensive-to-create resource instead of creating and destroying it per unit of work; it breaks down in that a thread pool reuses generic compute, while a connection pool reuses a *stateful* resource — an authenticated session tied to one specific database — which is why handing the wrong connection around carelessly (mid-transaction, wrong session state) can cause real bugs a thread never would." },
      { question: "Scenario: a service acquires one connection from a pool sized to 1, then tries to acquire a second connection before releasing the first. What happens?", answer: "The second `acquire()` waits forever for a connection that will never become free, because the only connection is the one this same request is already holding and hasn't released — a classic pool self-deadlock caused by a pool sized too small for code that needs more than one connection at once." },
      { question: "Why should you generally avoid holding a pooled connection open across a slow, non-database operation in the middle of a request (e.g. an external HTTP call)?", answer: "The connection sits idle but checked out for the entire duration of that unrelated slow operation, unavailable to every other request — tying up a scarce, shared resource for work that has nothing to do with the database." },
      { question: "What's the effect of pointing multiple read replicas at entirely separate pools versus one shared pool?", answer: "Separate pools per replica let you size and reason about each replica's load independently, but if traffic is uneven, one replica's pool can be exhausted while another sits underused — a shared pool balances load across replicas but adds routing complexity to know which replica a given borrowed connection belongs to." },
      { question: "Debugging: requests are timing out with pool-exhaustion errors, but overall traffic hasn't increased. What would you check first?", answer: "Whether something is holding connections longer than usual — a slow query, a connection leak from unhandled errors, or a change in code that acquires a connection earlier and releases it later than before — rather than assuming the pool is simply undersized for the traffic." },
      { question: "Why might reducing a pool's max size sometimes increase throughput on an already-overloaded database?", answer: "Too many concurrent connections competing for the same limited CPU and I/O can spend more time on contention and context-switching than on real work; capping concurrency lower can let each connection's query actually finish faster, improving overall throughput despite less parallelism." },
      { question: "What's the tradeoff of setting a very short idle timeout on pooled connections?", answer: "It frees up resources quickly during quiet periods, but a burst of traffic right after can face a wave of fresh connection setup cost all at once, since the pool had already closed down toward its minimum instead of keeping connections warm." },
      { question: "Why does pooling matter more for a long-running application server than for a short-lived script?", answer: "A script that opens one connection, does its work, and exits pays the connection-setup cost exactly once regardless; pooling earns its keep specifically under repeated, concurrent access, which is what a long-running server handling many requests actually faces." },
    ],
    prerequisites: ["transactions-and-acid"],
    relatedTopics: ["transactions-and-acid", "query-optimization"],
    keywords: ["connection pool", "database connections", "concurrency", "resource limits"],
  },
  {
    id: "nosql-data-modeling",
    title: "NoSQL Data Modeling",
    level: "advanced",
    description: "Designing the shape of a document to match how it'll actually be read, often by embedding related data together instead of splitting it across normalized tables.",
    explanation: `
Relational design (as covered by normalization) starts from the data's
structure and works to eliminate duplication, trusting joins to
reassemble related pieces when needed. **Document databases** (like
MongoDB) flip that emphasis: since there's no cheap, universal join
across collections, you design a document's *shape* around how it will
actually be read, and it's normal — even encouraged — to **embed**
related data directly inside a single document rather than **reference**
it in a separate one.

The central design question in NoSQL modeling is: will this related
data usually be read together with its parent? If yes, embedding it
(nesting it directly inside the same document) avoids extra lookups. If
the related data is large, changes independently, or is shared across
many parents, referencing it (storing just an id, similar to a foreign
key) is usually the better call.
    `.trim(),
    analogy:
      "A normalized relational schema is like a well-organized filing cabinet where every fact lives in exactly one folder, and you cross-reference folders when you need the full picture. A document database is more like handing someone a single ready-made report that already has everything they'll need to read stapled together in one packet — faster to hand over, but if a stapled-in fact needs updating, you may have to redo several packets.",
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
        explanation: "Comments are almost always read alongside their post, and rarely need to be queried independently, so embedding them directly avoids a second lookup entirely.",
        walkthrough: [
          { code: '"_id": "post_123",', explanation: "The document's unique identifier, similar in role to a primary key." },
          { code: '"title": "Why We Chose Postgres",', explanation: "A regular top-level field on the document." },
          { code: '"comments": [', explanation: "Comments live nested directly inside the post document, as an array." },
          { code: '{ "author": "Kenji", "text": "Great write-up!" }', explanation: "Each comment is embedded inline, rather than stored in a separate collection referenced by an id." },
        ],
      },
      {
        title: "Referencing — a post and its author",
        code: `// posts collection
{ "_id": "post_123", "title": "Why We Chose Postgres", "author_id": "user_45" }

// users collection
{ "_id": "user_45", "name": "Amara Musa", "bio": "Backend engineer..." }`,
        explanation: "An author is shared across many posts and has a full independent profile that changes on its own schedule, so referencing them by id (rather than embedding the full user document into every post) avoids duplicating and re-syncing their profile everywhere they've posted.",
      },
    ],
    howItWorks: `
Because document databases typically don't support efficient joins
across collections the way relational databases do, a query for "this
document" only cheaply returns exactly that document's own fields —
anything embedded comes along for free, but anything referenced by id
requires a separate follow-up query (or, in some databases, a more
limited join-like operation) to resolve.

Modeling decisions come down to weighing that against the relational
downsides of duplication: embedding trades some duplicated or
harder-to-update data for fewer, faster reads; referencing trades an
extra lookup for a single source of truth, closer to how a normalized
relational table would represent the same relationship.
    `.trim(),
    whyItExists: `
Some access patterns are overwhelmingly "read this whole thing together
every time" (a post and its comments, a shopping cart and its line
items), and forcing that data through a strict, fully normalized,
multi-table design adds join overhead for a benefit (avoiding
duplication) that may barely matter if the embedded data rarely changes
independently. NoSQL document modeling exists to let the data's shape
follow its actual read pattern instead of a fixed normalization rule.
    `.trim(),
    whenToUse: `
Embed related data when it's almost always read together with its
parent, doesn't grow unbounded, and doesn't need to be queried or
updated independently very often — comments on a post, line items on an
order, an address on a user profile. Reference (by id) when the related
data is large, shared across many parents, updated independently, or
queried on its own frequently.
    `.trim(),
    whenNotToUse: `
Avoid embedding data that grows without bound (like an ever-growing
list of comments on a very popular post, which can make a single
document unwieldy or hit size limits) or that needs to be updated
independently of its parent across many documents at once — that's a
sign it should be a separate, referenced collection instead.
    `.trim(),
    commonMistakes: [
      "Embedding a list that can grow indefinitely (like comments on a viral post), eventually hitting a document size limit or making the document slow to load.",
      "Automatically applying relational-style normalization habits to a document database, ending up with excessive references and losing the performance benefit documents are meant to offer.",
      "Embedding data that's shared across many parent documents (like a product's details inside every order that contains it), then having to update it in many places when it changes.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "For a shopping cart with line items, decide whether you'd embed the line items directly in the cart document or reference them separately, and explain why." },
      { difficulty: "Medium", prompt: "Design a document shape for a 'product review' in an e-commerce app, deciding whether the reviewer's profile info should be embedded or referenced." },
      { difficulty: "Hard", prompt: "Describe a realistic scenario where embedding data seemed convenient at first but caused problems as the app grew, and explain how you'd redesign it." },
    ],
    interviewQuestions: [
      { question: "What's the difference between embedding and referencing in document database design?", answer: "Embedding nests related data directly inside a parent document so it's fetched together in one read; referencing stores just an id pointing to a separate document, requiring an extra lookup to retrieve the related data." },
      { question: "Why is NoSQL document modeling often described as designing around access patterns rather than around normalization?", answer: "Without cheap universal joins across collections, the right document shape depends on how the data will actually be read together, not on eliminating duplication the way relational normalization does." },
      { question: "What's a risk of embedding an unbounded list inside a document?", answer: "The document can keep growing indefinitely, eventually becoming slow to load or hitting the database's maximum document size limit." },
      { question: "What does 'design for your queries first' mean in document modeling, and how does that differ from a relational approach?", answer: "It means starting from how the data will actually be read and shaping the document around that; relational design instead starts from the data's own structure and normalizes it, trusting joins at query time to reassemble whatever shape a particular query needs." },
      { question: "What's the 'extended reference' pattern, and what problem does it solve?", answer: "Storing a small set of duplicated fields (e.g. a customer's name) from a referenced document right alongside its id, so common reads don't need the extra lookup for fields that are needed constantly and rarely change." },
      { question: "Why is a duplicated field in an extended reference a deliberate tradeoff rather than a mistake?", answer: "It knowingly accepts the update cost of keeping that duplicate in sync (only when the source field actually changes) in exchange for skipping an extra lookup on every single read — worthwhile exactly when reads vastly outnumber updates to that field." },
      { question: "How would you model a many-to-many relationship, like articles and tags, in a document database?", answer: "Store an array of tag ids (or names) directly on each article document; a shared array on both sides isn't needed — you only need the direction you'll actually query from, and a separate `tags` collection can hold each tag's own details if it needs any." },
      { question: "What is the 'bucket pattern', and what kind of data does it fit?", answer: "Grouping many small, related time-stamped readings (like sensor data) into one document per time period (e.g. one document per hour, containing an array of that hour's readings) instead of one document per individual reading." },
      { question: "Why does the bucket pattern reduce overhead compared to one document per reading?", answer: "Fewer, larger documents mean fewer separate reads/writes and less per-document storage overhead than an equally large number of tiny individual documents would carry." },
      { question: "Why does a document size limit (e.g. MongoDB's 16MB per document) shape modeling decisions?", answer: "It puts a hard ceiling on anything embedded — a document design has to be sure an embedded list or nested structure can't realistically grow past that limit, or it needs to reference that data separately instead." },
      { question: "Why can updating a single fact that's duplicated across many parent documents become expensive or error-prone?", answer: "Every document holding that duplicated copy has to be found and updated individually to keep them consistent, instead of changing one row in one place — miss one and it silently goes stale." },
      { question: "What's a 'polymorphic' document pattern, and when is it useful?", answer: "Storing different kinds of related items (a video, an article, an image) in one collection, each document sharing common fields but carrying its own type-specific fields — useful when the app queries them together as one feed or listing far more often than it needs their type-specific differences." },
      { question: "Why do document databases typically still support secondary indexes even though they don't support cheap arbitrary joins?", answer: "An index lets a single collection be searched efficiently by a field other than its id, which is unrelated to joining across collections — you still need fast lookup within one collection even when you've deliberately avoided needing to join across several." },
      { question: "What's the practical effect of embedding data that's frequently updated independently of its parent, like a product's live inventory count embedded in every historical order line item?", answer: "Every time that value changes, every document that embedded a copy of it would need updating too — for a fast-changing shared value like stock count, that's usually a sign it should be referenced, not embedded." },
      { question: "Why is embedding often described as trading read performance for write/update complexity, and referencing the reverse?", answer: "Embedding gets everything in one read but means an update to shared data has to reach every copy; referencing keeps one source of truth that's simple to update, but every read of the related data costs an extra lookup." },
      { question: "What does 'atomic update' mean for a single document, and why does that favor embedding data you need to update consistently together?", answer: "Most document databases guarantee a single document's own update is all-or-nothing; data embedded together in one document gets that same atomic guarantee for free, while updating two separate referenced documents consistently together needs extra coordination (like a transaction) the database doesn't give you automatically." },
      { question: "Why might a shopping cart's line items be a good candidate for embedding, but a product's own catalog details a bad one to embed inside every cart referencing it?", answer: "Line items are read and written together with their cart and belong to it alone, so embedding them is safe; a product's price and description are shared across every cart (and every order) that references it and change on their own schedule, so embedding a copy everywhere would mean updating it in many places every time it changes." },
      { question: "What's the risk of denormalizing a frequently-changing field, like a current stock count, into many documents that reference the same product?", answer: "Every one of those copies needs updating whenever the real count changes, and if even one update is missed or arrives late, that document is left showing a stock count that's already wrong." },
      { question: "How does a document database's lack of foreign key constraints change how you enforce referential integrity between referenced documents?", answer: "Nothing at the database level stops you from storing an id that points at a document which doesn't exist (or later gets deleted) — keeping references valid becomes the application's responsibility rather than something the database rejects automatically." },
      { question: "Why can schema flexibility be both an advantage and a risk in a document database?", answer: "It lets you evolve a document's shape without a formal migration step, which is convenient during fast iteration, but nothing stops different documents in the same collection from silently drifting into inconsistent shapes over time if the application isn't careful." },
      { question: "What's a practical problem caused by documents in the same collection having drifted into different shapes over time?", answer: "Code reading that collection has to handle multiple possible shapes for the same kind of document (a missing old field, a renamed field, a changed nested structure), instead of being able to assume one consistent structure for every document." },
      { question: "Compare a document database's modeling approach to a plain key-value store's — what extra structure does a document format give you?", answer: "A key-value store's value is an opaque blob the database can't see inside; a document format is structured enough that the database can query, index, and update individual fields inside it directly, without the application first having to load and parse the whole blob itself." },
      { question: "How does a wide-column store's modeling approach differ from a document database's for the same 'posts and comments' example?", answer: "A wide-column store is typically modeled with one table designed per specific query it needs to serve, denormalizing the same data into multiple purpose-built tables (e.g. one keyed for 'comments by post' and another for 'comments by author'), rather than one flexible document shape read a few different ways." },
      { question: "Why does sharding in a NoSQL database depend heavily on choosing a good partition/shard key, and how does that connect to access-pattern-driven modeling?", answer: "Data is physically distributed across nodes by that key, so a query that doesn't include it in its filter may have to fan out and check every shard instead of going straight to one — the same 'design around how it's actually queried' principle that drives embedding-vs-referencing decisions also drives the choice of shard key." },
      { question: "What's the risk of choosing a partition/shard key that doesn't match your most common query pattern?", answer: "Your most frequent query ends up scatter-gathering across every shard instead of hitting just one, giving up exactly the scalability advantage sharding on a well-chosen key was supposed to provide." },
      { question: "Scenario: a social app embeds a `likes` array of user ids directly inside each post document. What happens as a post goes viral, and how would you redesign it?", answer: "The array keeps growing without bound and the post document itself gets slower to load and update, potentially approaching the database's document size limit; redesigning it as a separate `likes` collection (one small document per like, referencing the post's id) removes that growth from the post document entirely." },
      { question: "After redesigning likes into a separate collection, how do you still cheaply show a '142 likes' count without counting that collection on every read?", answer: "Keep a denormalized counter field on the post document itself, incremented atomically each time a like is added — a hybrid that embeds just the summary while referencing the actual detailed records." },
      { question: "In a database that offers only eventual consistency across replicas, why can a denormalized duplicate field briefly show stale data after its source is updated?", answer: "A write to the source document and the propagation of that change to a replica holding the duplicate aren't guaranteed to be visible everywhere at the same instant, so a read hitting a replica that hasn't caught up yet can briefly see the old value." },
      { question: "What's the single biggest mindset shift a relational-schema-experienced developer has to make when modeling for a document database?", answer: "Instead of asking 'what's the cleanest, most duplication-free way to represent this data,' the first question becomes 'how will this be read, and what does it need sitting right next to it to avoid an extra lookup.'" },
    ],
    prerequisites: ["normalization"],
    relatedTopics: ["normalization", "joins"],
    keywords: ["NoSQL", "document database", "embedding", "referencing", "MongoDB", "denormalization"],
  },
  {
    id: "window-functions",
    title: "Window Functions",
    level: "advanced",
    description: "Calculations across a set of related rows — like a running total or a rank — without collapsing them into a single row the way GROUP BY does.",
    explanation: `
Aggregation answers "one summary value per group" by collapsing rows
together — one row per customer, one row per category. But sometimes
you want a per-row value that's still calculated *using* its group as
context, while keeping every original row: "each order, plus that
customer's running total so far," or "each product's price, plus its
rank within its category."

A **window function** does exactly this, using \`OVER (...)\`, optionally
with \`PARTITION BY\` (which rows count as a group) and \`ORDER BY\` (their
order within that group). Unlike \`GROUP BY\`, it doesn't merge rows —
every original row stays in the output, just with an extra computed
column alongside it.
    `.trim(),
    analogy:
      "GROUP BY is like handing a customer one combined receipt total. A window function is like handing back every individual line item, but with a running total (or a rank against everything else they bought) printed on each line — nothing gets merged away, each line just gets extra context.",
    examples: [
      {
        title: "Ranking within a partition",
        code: `SELECT name, category, price,
  RANK() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank
FROM products;`,
        language: "sql",
        explanation: "Every product row is kept, but each one now also shows where its price ranks within its own category, highest first.",
        walkthrough: [
          { code: "PARTITION BY category", explanation: "Defines the 'window' of rows each ranking is computed within — restarting the count for every new category, instead of ranking across the whole table." },
          { code: "ORDER BY price DESC", explanation: "Decides the order within each partition that RANK() counts through." },
          { code: "RANK() OVER (...)", explanation: "Computes the rank for the current row using that partition and order, while still returning every row from products, not just the top one per category." },
        ],
      },
      {
        title: "A running total",
        code: `SELECT id, amount,
  SUM(amount) OVER (ORDER BY id) AS running_total
FROM payments;`,
        language: "sql",
        explanation: "Each row shows its own amount plus the cumulative sum of every row up to and including it, ordered by id — no GROUP BY, and no rows merged together.",
      },
    ],
    howItWorks: `
For each output row, the database determines its "window" — the other
rows that belong with it, from \`PARTITION BY\`, in the order given by
\`ORDER BY\` — and computes the function (\`RANK\`, \`SUM\`, \`ROW_NUMBER\`,
\`LAG\`/\`LEAD\`, and others) over that window. Critically, the original
row is still returned as-is; the window function's result is just an
extra column added alongside it, which is the core difference from
\`GROUP BY\`, which discards the individual rows entirely in favor of one
row per group.
    `.trim(),
    whyItExists: `
Without window functions, something like "rank within category" or "a
running total" required a self-join or a correlated subquery per row —
verbose to write and slow at scale, since the database effectively has
to reprocess related rows for every single output row by hand instead
of computing it in one pass.
    `.trim(),
    whenToUse: `
Reach for a window function for leaderboards and rankings, running
totals or moving averages, comparing a row to the previous or next one
(\`LAG\`/\`LEAD\`), or "top N rows per group" queries.
    `.trim(),
    whenNotToUse: `
If you genuinely want one summarized row per group, with the individual
rows discarded, plain \`GROUP BY\` aggregation is simpler and says exactly
that — a window function that keeps every row is the wrong tool when you
don't actually need every row.
    `.trim(),
    commonMistakes: [
      "Forgetting PARTITION BY entirely, which computes the ranking or total across the whole table instead of restarting it per group.",
      "Confusing RANK (leaves gaps in the numbering after ties), DENSE_RANK (no gaps after ties), and ROW_NUMBER (always a unique sequential number, ties broken arbitrarily).",
      "Trying to filter directly on a window function's result in a WHERE clause, which isn't allowed — WHERE is evaluated before window functions are computed.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a query using ROW_NUMBER() to number each customer's orders in the order they were placed." },
      { difficulty: "Medium", prompt: "Write a query that shows each employee's salary along with their salary rank within their own department." },
      { difficulty: "Hard", prompt: "Explain why WHERE price_rank = 1 fails directly after a window function that computes price_rank, and rewrite the query using a CTE so it works." },
    ],
    interviewQuestions: [
      { question: "What's the fundamental difference between GROUP BY and a window function?", answer: "GROUP BY collapses rows into a single summary row per group; a window function keeps every original row while still computing a value using that row's group as context." },
      { question: "What's the difference between RANK, DENSE_RANK, and ROW_NUMBER?", answer: "RANK leaves gaps in the numbering after a tie (e.g. 1, 1, 3), DENSE_RANK doesn't leave gaps (1, 1, 2), and ROW_NUMBER always assigns a unique sequential number regardless of ties." },
      { question: "Why can't you filter directly on a window function's result in a WHERE clause?", answer: "WHERE is evaluated before window functions are computed, so the value doesn't exist yet at that stage — you need to compute it in a subquery or CTE and filter in the outer query instead." },
      { question: "What does PARTITION BY control, and what happens if you omit it entirely?", answer: "It defines which rows count as one group for the window function's calculation; omitting it treats the entire result set as a single partition, so the function runs across every row rather than restarting per group." },
      { question: "What does ORDER BY inside an OVER(...) clause do for a running-total-style SUM, that's different from its role in RANK?", answer: "For RANK it decides the ranking order itself; for an aggregate like SUM it instead defines the order rows accumulate in, which — combined with the default frame — is what turns a plain sum into a *running* total up to the current row." },
      { question: "Given `payments(id, amount)` = (1,100), (2,50), (3,200), what does `SELECT id, amount, SUM(amount) OVER (ORDER BY id) AS running_total FROM payments;` output, row by row?", answer: "id 1: 100, id 2: 150, id 3: 350 — with ORDER BY present and no explicit frame, each row's total accumulates every row from the start of the partition through the current row, in id order." },
      { question: "What is a window function's 'frame', and how does it differ from its partition?", answer: "The partition is the whole group a row belongs to; the frame is the specific subset of rows *within* that partition (e.g. 'from the start up to the current row') that the function actually computes over for that row — a single partition can contain many different frames as you move row to row." },
      { question: "What's the default frame for an aggregate window function when ORDER BY is given but no explicit ROWS/RANGE clause is specified?", answer: "`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` — everything from the start of the partition through the current row (and, with RANGE, through any other rows tied with it on the ORDER BY value)." },
      { question: "Given `products(name, category, price)` = (Alpha, Electronics, 300), (Beta, Electronics, 300), (Gamma, Electronics, 100), (Delta, Furniture, 500), what does `RANK() OVER (PARTITION BY category ORDER BY price DESC)` give each row, versus DENSE_RANK and ROW_NUMBER?", answer: "Electronics: Alpha and Beta tie for the top price, so RANK gives both 1 and Gamma 3 (skipping 2); DENSE_RANK gives Alpha and Beta 1 and Gamma 2 (no gap); ROW_NUMBER gives Alpha/Beta 1 and 2 in some arbitrary tie-broken order and Gamma 3. Furniture is its own partition, so Delta gets 1 in all three." },
      { question: "Why do RANK and DENSE_RANK produce identical results when there are no ties in the ORDER BY column, but diverge as soon as a tie appears?", answer: "With no ties, every row moves to the next number in sequence either way; a tie is the only thing that makes RANK skip ahead (to account for the tied rows) while DENSE_RANK keeps counting without a gap." },
      { question: "What does LAG() return for the very first row in its partition, by default, and why?", answer: "NULL — there's no preceding row to look back to for the first row, and LAG's value when there's nothing there is NULL unless you supply your own default." },
      { question: "Given `stock_prices(day, price)` = (1,10), (2,12), (3,9), what does `LAG(price) OVER (ORDER BY day)` output for each row?", answer: "day 1: NULL, day 2: 10, day 3: 12 — each row shows the price from the immediately preceding day in the ordering, with nothing available for the first." },
      { question: "How would you make LAG() return 0 instead of NULL for the first row?", answer: "Pass a default as its third argument: `LAG(price, 1, 0)` — offset of 1 row back, defaulting to 0 when there is no such row." },
      { question: "What's the difference between LAG/LEAD and FIRST_VALUE/LAST_VALUE?", answer: "LAG/LEAD look a fixed number of rows before or after the current row; FIRST_VALUE/LAST_VALUE instead return the value from the first or last row of the current frame, regardless of how many rows away that is." },
      { question: "Why does LAST_VALUE often unexpectedly return the current row's own value instead of the actual last row in the partition?", answer: "With the default frame (up through the current row), the 'last' row *of that frame* is always the current row itself — getting the true last row of the whole partition requires explicitly widening the frame, e.g. to `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`." },
      { question: "What is `ROWS BETWEEN n PRECEDING AND CURRENT ROW` used for, and how does it differ from the default frame?", answer: "It computes over a fixed-size sliding window of the last `n` rows plus the current one (useful for a moving average), rather than the default frame's ever-growing window from the start of the partition through the current row." },
      { question: "Given `sales(day, amount)` = (1,10), (2,20), (3,30), what does `SUM(amount) OVER (ORDER BY day ROWS BETWEEN 1 PRECEDING AND CURRENT ROW)` output?", answer: "day 1: 10 (no preceding row available, so just itself), day 2: 30 (10+20), day 3: 50 (20+30) — a 2-row moving sum instead of a running total of everything so far." },
      { question: "What's the difference between a ROWS frame and a RANGE frame when there are duplicate ORDER BY values?", answer: "ROWS counts a literal number of physical rows regardless of ties; RANGE instead includes every row that shares the same ORDER BY value as the boundary row, so rows tied with the current row's value can be pulled into the frame together even if that's more than the fixed row count you'd expect." },
      { question: "How would you get the top 2 highest-priced products per category using a window function?", answer: "Compute `ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn` in a CTE or subquery, then filter the outer query for `WHERE rn <= 2`." },
      { question: "Why do you need a subquery or CTE to actually filter to 'top N per group', rather than adding a WHERE or LIMIT directly?", answer: "The window function's result isn't available yet at the point WHERE is evaluated, and LIMIT caps the whole result set's row count rather than restarting per group — both need the ranked value to already exist as a column, which only a subquery or CTE around the window function provides." },
      { question: "How could you use ROW_NUMBER() to remove exact duplicate rows from a table, keeping just one copy of each?", answer: "Partition by the columns that define a 'duplicate', number the rows within each partition with ROW_NUMBER(), and delete (or exclude, in a query) every row where that number is greater than 1." },
      { question: "Can you use one window function's result as an argument to another window function in the same SELECT list without a subquery?", answer: "No — window functions are computed at the same late stage of query processing, so one can't yet see another's output; nesting them requires computing the first in a subquery or CTE and referencing that column from an outer window function." },
      { question: "Where do window functions fit in SQL's logical order of query processing, relative to WHERE, GROUP BY/HAVING, and the final SELECT list?", answer: "After WHERE, GROUP BY, and HAVING have already run (so they operate on the already-filtered, already-grouped rows), but before the final SELECT list's ordinary expressions and before ORDER BY/DISTINCT — which is exactly why WHERE can't reference their results, and ORDER BY can." },
      { question: "Why can an aggregate window function like SUM() OVER(...) appear in the same query as a plain GROUP BY aggregate, and what would that combination be useful for?", answer: "They operate at different stages and can coexist — e.g. grouping to compute a per-department total while a window function alongside it compares each individual row (not just the group) against a separate window, like each employee's salary against the department average, in one query." },
      { question: "What's the performance concern with computing a window function's PARTITION BY/ORDER BY over a very large, unindexed column?", answer: "The database typically needs the rows sorted by the partition and order columns to compute the window efficiently; without a supporting index it may need to sort the whole result set from scratch, which gets expensive as the row count grows." },
      { question: "How does a window function's performance generally compare to an equivalent correlated subquery computing the same per-row value, and why?", answer: "A window function is typically computed in one pass over data already partitioned/sorted; a correlated subquery re-evaluates its inner query once per outer row, which usually does much more repeated work for the same result." },
      { question: "What does NTILE(4) OVER (ORDER BY score) compute, conceptually?", answer: "It divides the ordered rows into 4 roughly equal-sized buckets and labels each row with which bucket (1 through 4) it falls into — useful for quartiles or similar equal-sized groupings." },
      { question: "Debugging: a query with `RANK() OVER (PARTITION BY department ORDER BY salary DESC)` returns rank 1 for every single row. What's the most likely mistake?", answer: "The ORDER BY clause is missing or not actually being applied inside the OVER(...) — without an ordering, every row within a partition is treated as tied with every other, so RANK() assigns 1 to all of them." },
      { question: "Why is it a mistake to assume window functions always run slower than writing the same logic as a self-join?", answer: "A window function is typically computed in a single pass over data the database has already partitioned and sorted once; a self-join re-scans and re-matches the table against itself, which is usually far more expensive for the same per-row result." },
      { question: "What can a window function do that a plain aggregate function used without OVER() fundamentally cannot?", answer: "Keep every individual row in the output while still computing a value from its group, instead of collapsing the group down into a single summarized row." },
    ],
    prerequisites: ["aggregation", "subqueries-and-ctes"],
    relatedTopics: ["aggregation", "subqueries-and-ctes", "joins"],
    keywords: ["window function", "OVER", "PARTITION BY", "RANK", "ROW_NUMBER", "running total", "LAG", "LEAD"],
  },
  {
    id: "upsert-and-conflicts",
    title: "Upsert & Conflict Handling",
    level: "advanced",
    description: "Inserting a row, or updating it instead if it already exists, in a single atomic statement.",
    explanation: `
Sometimes you don't know in advance whether a row already exists — like
syncing a record from an external system, or incrementing a page-view
counter that may or may not have started yet. Doing a \`SELECT\` to check,
then an \`INSERT\` or \`UPDATE\` depending on the result, isn't safe: two
requests running at the same time could both see "it doesn't exist yet"
and both try to insert, causing a duplicate-key error or one update
silently overwriting the other.

An **upsert** (\`INSERT ... ON CONFLICT\` in Postgres, \`MERGE\` in
standard SQL and SQL Server) does the check-and-write as a single
atomic database operation, removing that race condition entirely.
    `.trim(),
    analogy:
      "It's like a hotel front desk that either creates a new reservation or updates the existing one for that guest in one motion — rather than an agent looking the guest up, stepping away, and someone else double-booking the same room in the gap before the agent comes back to act on what they saw.",
    examples: [
      {
        title: "Insert, or update the existing row on conflict",
        code: `INSERT INTO page_views (page_id, views)
VALUES ('home', 1)
ON CONFLICT (page_id)
DO UPDATE SET views = page_views.views + 1;`,
        language: "sql",
        explanation: "If no row exists for 'home' yet, it's inserted with 1 view; if one already exists, its views column is incremented instead — atomically, with no gap for a race condition.",
        walkthrough: [
          { code: "INSERT INTO page_views (page_id, views) VALUES ('home', 1)", explanation: "Attempts a normal insert, as if no row for this page_id existed yet." },
          { code: "ON CONFLICT (page_id)", explanation: "Names the unique constraint (here, on page_id) to watch for — if the insert would violate it, run the fallback instead of raising an error." },
          { code: "DO UPDATE SET views = page_views.views + 1", explanation: "Runs against the existing row instead — page_views.views here refers to the value already in the table, not the attempted new row." },
        ],
      },
      {
        title: "Ignore instead of update",
        code: `INSERT INTO users (email, name)
VALUES ('a@example.com', 'Alice')
ON CONFLICT (email) DO NOTHING;`,
        language: "sql",
        explanation: "If a user with this email already exists, the statement simply does nothing instead of erroring or overwriting the existing row — useful for safe, repeatable deduplication.",
      },
    ],
    howItWorks: `
The database attempts the insert as normal. If it would violate a
unique constraint or primary key named in \`ON CONFLICT\`, instead of
raising an error, it runs the specified fallback (\`DO UPDATE\` or
\`DO NOTHING\`) against the conflicting existing row — all as one atomic
operation. Because it's atomic, no other transaction can slip a
conflicting write in between "checking" and "writing," which is exactly
what a separate SELECT-then-INSERT in application code can't guarantee.
    `.trim(),
    whyItExists: `
It exists to remove the race condition inherent in "check, then act"
logic written in application code, and to avoid the extra round trip of
a separate SELECT before deciding whether to INSERT or UPDATE.
    `.trim(),
    whenToUse: `
Reach for an upsert when syncing external data that may or may not
already exist, maintaining counters, building "create or update
settings" endpoints, or deduplicating on a unique column like an email
address.
    `.trim(),
    whenNotToUse: `
When insert and update should trigger genuinely different application
behavior — like sending a "welcome" email only on true creation — an
upsert makes it harder to tell which branch actually happened unless you
inspect what the statement returned; explicit, separate insert and
update logic can be clearer there.
    `.trim(),
    commonMistakes: [
      "Naming a column in ON CONFLICT that isn't backed by an actual unique constraint or primary key — Postgres requires a real constraint to detect the conflict against.",
      "Forgetting that DO UPDATE must reference the table name (like page_views.views) to mean 'the existing row's value,' not the newly attempted one.",
      "Continuing to use separate SELECT-then-INSERT/UPDATE application logic in a case with real concurrency, and hitting rare but genuine race conditions an upsert would have avoided.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write an upsert that inserts a product by sku, or increments its stock count if that sku already exists." },
      { difficulty: "Medium", prompt: "Write an upsert using ON CONFLICT DO NOTHING to safely deduplicate email signups." },
      { difficulty: "Hard", prompt: "Walk through, step by step, how two simultaneous requests using separate SELECT-then-INSERT logic (without an upsert) could both succeed and create two rows despite an intended uniqueness rule." },
    ],
    interviewQuestions: [
      { question: "What problem does an upsert solve that a SELECT followed by INSERT or UPDATE doesn't?", answer: "It removes the race condition between checking whether a row exists and writing to it, by making the whole check-and-write a single atomic database operation." },
      { question: "What must the column(s) named in ON CONFLICT correspond to?", answer: "An actual unique constraint or unique index on the target table — not just any column, or any combination that merely happens to be unique in practice." },
      { question: "What's the difference between ON CONFLICT DO NOTHING and DO UPDATE?", answer: "DO NOTHING silently skips the write when a conflict occurs; DO UPDATE instead overwrites fields on the existing conflicting row." },
      { question: "Walk through how two concurrent SELECT-then-INSERT sequences can both 'see' no existing row and both attempt to insert.", answer: "Both transactions run their SELECT at nearly the same moment, before either has inserted anything, so both correctly see zero matching rows and both proceed to INSERT — the check was accurate at the instant it ran, but stale by the time the write actually happens." },
      { question: "Why doesn't wrapping the SELECT-then-INSERT in a transaction at the default READ COMMITTED isolation level fix that race on its own?", answer: "READ COMMITTED only guarantees each individual statement sees committed data as of when *it* runs — it doesn't stop a second transaction's SELECT from also running (and also seeing nothing) before the first transaction's INSERT has committed, so both can still proceed to insert." },
      { question: "Why does making the check-and-write a single atomic upsert statement close the race regardless of isolation level?", answer: "There's no longer a gap in time between 'check' and 'write' for another transaction to slip into — the database evaluates the conflict and applies the fallback as one indivisible operation, so a second concurrent attempt simply finds the row already there and takes the DO UPDATE/DO NOTHING path instead of also inserting." },
      { question: "What is the `EXCLUDED` pseudo-table in Postgres's INSERT ... ON CONFLICT DO UPDATE, and what does it refer to?", answer: "It represents the row that was proposed for insertion — the new values from the VALUES clause that hit the conflict — letting the DO UPDATE clause reference the attempted new data separately from the existing row already in the table." },
      { question: "In `DO UPDATE SET views = page_views.views + 1`, why reference the table name (`page_views.views`) rather than `EXCLUDED.views`?", answer: "`page_views.views` means the value already stored in the existing row; `EXCLUDED.views` would instead mean the value from the attempted new insert (here, the literal 1) — using `EXCLUDED.views + 1` would ignore the row's actual current count entirely." },
      { question: "What does the standard SQL / SQL Server MERGE statement do, and how does it compare to Postgres's INSERT ... ON CONFLICT?", answer: "MERGE matches a source set of rows against a target table and lets you specify different actions for matched versus unmatched rows in one statement (typically update-if-matched, insert-if-not); ON CONFLICT is a narrower, insert-first version of the same idea, specifically for a single row hitting a specific unique constraint." },
      { question: "What's one thing MERGE can express that a single ON CONFLICT clause typically can't?", answer: "MERGE can also act on rows present in the target but missing from the source (e.g. deleting them), and can process many source rows against the target in one statement — ON CONFLICT only ever reacts to a conflict from the row(s) you're actively inserting." },
      { question: "How would you make an ON CONFLICT DO UPDATE conditional, and how does that differ from DO NOTHING?", answer: "Add a WHERE clause after the SET list — `DO UPDATE SET ... WHERE <condition>` — so the update only applies when the condition holds; unlike DO NOTHING, which never touches the row at all, a false WHERE here still recognizes the conflict, it just declines to change anything for it." },
      { question: "Why can ON CONFLICT target a specific named constraint instead of listing columns directly, and when would you need that?", answer: "`ON CONFLICT ON CONSTRAINT constraint_name` is needed when the uniqueness you care about isn't a simple column list — e.g. a uniqueness rule defined with an expression, or when you want to be explicit about exactly which of several unique constraints you mean." },
      { question: "Can ON CONFLICT target a partial unique index (one defined with its own WHERE clause)? What has to match?", answer: "Yes, but the conflict target has to match both the indexed columns/expression and that index's own WHERE condition exactly — a row that wouldn't be covered by the partial index's condition can't trigger a conflict against it." },
      { question: "How would you find out, after running an upsert, whether it actually inserted a new row or updated an existing one?", answer: "Add a RETURNING clause with a column whose value differs between the two paths (like `xmax = 0` in Postgres, which is true only for a freshly inserted row), or track it via the value change itself if that's distinguishable." },
      { question: "Why is an upsert alone not enough when insert and update are supposed to trigger genuinely different application behavior, like sending a welcome email only on true creation?", answer: "The single statement doesn't inherently tell the calling code which path it took — you'd need to inspect what it returned (e.g. via RETURNING) to branch application logic correctly, rather than assuming the upsert always means 'created'." },
      { question: "What's a gotcha with auto-incrementing primary keys and an upsert that hits a conflict and ends up doing nothing?", answer: "The sequence value generated for the attempted insert's id is still consumed even though that row was never actually created, leaving a permanent gap in the sequence — harmless, but often surprising the first time it's noticed." },
      { question: "Why does that sequence-gap behavior happen — why doesn't the database 'give the number back' when the conflicting insert doesn't go through?", answer: "Sequences are designed to hand out values without ever blocking or coordinating with other concurrent transactions, so taking a value back based on whether a later step succeeded would require exactly the kind of locking sequences are built to avoid — gaps are an accepted tradeoff for that speed." },
      { question: "What does 'idempotent write' mean, and how does DO NOTHING support writing idempotent sync code?", answer: "An idempotent write can be safely applied more than once without changing the outcome beyond the first time; DO NOTHING makes re-inserting the same row (say, retrying a sync job after a partial failure) a no-op instead of an error, so the same operation can be safely repeated." },
      { question: "How would you write a single statement that upserts many rows at once from a bulk import, rather than one row at a time?", answer: "Use a multi-row VALUES list (or `INSERT ... SELECT ...` from a staging table) with a single ON CONFLICT clause — the conflict handling applies per row, but it's all one statement instead of one round trip per row." },
      { question: "Why is INSERT ... ON CONFLICT generally faster than the equivalent SELECT-then-INSERT/UPDATE application logic, even ignoring the race condition it fixes?", answer: "It's a single round trip to the database instead of two or more — a separate SELECT, and then a conditional INSERT or UPDATE, each pay their own network and query-planning overhead that one statement avoids." },
      { question: "Scenario: importing 10,000 rows with ON CONFLICT (email) DO NOTHING, the table's row count only grows by 9,000. What happened to the other 1,000, and is it a bug?", answer: "Not a bug — 1,000 of those emails already existed in the table, and DO NOTHING silently skipped writing them, exactly as designed for safe, repeatable deduplication." },
      { question: "Debugging: an upsert meant to catch duplicate emails inserted a new row for what looks like the same email, just different casing, instead of updating the existing one. What's the likely explanation?", answer: "The unique constraint is on the raw `email` column, and the two values differ in case, so they're not equal as far as that constraint is concerned; catching that would need a case-insensitive unique index (e.g. `UNIQUE (LOWER(email))`) with a matching ON CONFLICT target." },
      { question: "Why must the column(s)/expression named in ON CONFLICT match an existing unique constraint or index precisely?", answer: "Postgres needs to know exactly which constraint's violation to intercept and redirect into the fallback clause — it can't guess from 'any columns that happen to be unique together' without an actual declared constraint or index backing that combination." },
      { question: "What error does Postgres raise if you write ON CONFLICT (col) but no unique constraint or index exists on that exact column?", answer: "It raises an error at query time (something like 'there is no unique or exclusion constraint matching the ON CONFLICT specification') rather than silently falling back to a plain insert." },
      { question: "How does MySQL's INSERT IGNORE differ in behavior from Postgres's ON CONFLICT DO NOTHING?", answer: "INSERT IGNORE suppresses a broader class of errors — not just duplicate-key conflicts, but also things like certain data-truncation or not-null violations, converting them to warnings — while ON CONFLICT DO NOTHING specifically targets a conflict against the declared or inferred constraint and nothing else." },
      { question: "Can ON CONFLICT DO NOTHING be written without naming a specific column or constraint at all — what does it apply to then?", answer: "Yes — without an explicit target, it applies to any constraint violation that would otherwise have made the insert fail; DO UPDATE, by contrast, requires an explicit target because it needs to know exactly which existing row's columns to update." },
      { question: "What isolation-related guarantee is a SELECT ... FOR UPDATE followed by INSERT/UPDATE inside a transaction also trying to achieve, and why is an upsert usually simpler?", answer: "It's trying to lock the potentially-conflicting row so no other transaction can act on it in between the check and the write — the same race-free guarantee an upsert gives for free, without needing to reason about explicit locking, lock ordering, or holding a transaction open across the whole check-and-write sequence." },
      { question: "Why would separate, explicit INSERT and UPDATE logic still be preferable over an upsert in some cases, despite the upsert being safer against races?", answer: "When insert and update genuinely need to trigger different application behavior — different validation, different side effects like a welcome email — writing them as two explicit paths keeps that branching obvious in the code, instead of burying it inside a single statement whose outcome has to be inferred from what it returned." },
    ],
    prerequisites: ["transactions-and-acid"],
    relatedTopics: ["transactions-and-acid", "basic-sql-queries"],
    keywords: ["upsert", "ON CONFLICT", "MERGE", "race condition", "atomic", "idempotent write"],
  },
];
