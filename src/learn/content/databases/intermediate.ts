import type { Topic } from "../../types/content";

export const databasesIntermediateTopics: Topic[] = [
  {
    id: "joins",
    title: "Joins",
    level: "intermediate",
    description: "Combine matching rows from two or more tables into one result, using the foreign keys that link them.",
    explanation: `
You split data across tables on purpose: \`users\` and \`orders\`, linked by
a \`user_id\` foreign key. But some questions span both, like "show each
order with the name of the person who placed it." Neither table has both
pieces.

A **join** answers that. It combines rows from two tables on a matching
column (usually a foreign key matching a primary key), as if the tables
were glued side by side wherever they match.

The two most common kinds:

- **INNER JOIN** returns only rows with a match in both tables.
- **LEFT JOIN** returns every row from the left (first) table, with empty
values where the right table has no match.
    `.trim(),
    analogy:
      "Picture two spreadsheets: employees with a department ID, and department IDs with names. A join is a coworker who hands you one combined sheet where each employee row also shows the department name, matched by that shared ID.",
    examples: [
      {
        title: "INNER JOIN — only matching rows",
        code: `SELECT orders.id, orders.total_cents, users.name
FROM orders
INNER JOIN users ON orders.user_id = users.id;`,
        language: "sql",
        explanation: "Returns one row per order, but only for orders whose user_id matches a real user. An order with a broken or missing user_id is left out.",
        walkthrough: [
          { code: "SELECT orders.id, orders.total_cents, users.name", explanation: "Pulls columns from both tables, which works because they're joined." },
          { code: "FROM orders", explanation: "Starts from the orders table." },
          { code: "INNER JOIN users ON orders.user_id = users.id;", explanation: "For each order, finds the user whose id matches orders.user_id and adds that user's columns. Orders with no matching user are dropped." },
        ],
      },
      {
        title: "LEFT JOIN — keep unmatched rows too",
        code: `SELECT users.name, orders.id AS order_id
FROM users
LEFT JOIN orders ON orders.user_id = users.id;`,
        language: "sql",
        explanation: "Returns every user, even those with no orders. For them, order_id comes back as empty (NULL) instead of the row disappearing.",
      },
    ],
    howItWorks: `
For each row in the first table, the database finds rows in the second
table where the \`ON ...\` condition is true, and outputs one combined row
per match.

- \`INNER JOIN\`: a first-table row with no matches adds nothing.
- \`LEFT JOIN\`: a left-table row with no matches still appears once, with
the second table's columns empty.

The database often uses an index on the joined column to find matches
fast, instead of comparing every row with every other row.
    `.trim(),
    whyItExists: `
Normalization splits data into separate, non-duplicated tables. That would
be nearly useless if you couldn't bring related pieces back together for
one question. Joins make normalized design practical to query.
    `.trim(),
    whenToUse: `
Use a join when the answer needs data from two or more related tables: an
order with the customer's name, a blog post with its author, a product with
its category. Use LEFT JOIN to keep first-table rows that have no match
(like all users, including those with zero orders).
    `.trim(),
    whenNotToUse: `
If you only need data from one table, a join just adds complexity and
cost. Joining very large tables without a supporting index can be slow;
sometimes it's better to add an index or rethink the schema.
    `.trim(),
    commonMistakes: [
      "Forgetting the ON condition, which creates a 'cross join': every row of the first table paired with every row of the second, a combinatorial explosion.",
      "Using INNER JOIN when you wanted to keep unmatched rows, silently losing data (like customers with no orders vanishing).",
      "Not qualifying column names (id instead of orders.id) when both tables share a column name, causing ambiguity errors.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write an INNER JOIN between products and categories (products has a category_id foreign key) to list each product with its category name." },
      { difficulty: "Medium", prompt: "Write a LEFT JOIN listing every category with its products, including categories with zero products." },
      { difficulty: "Hard", prompt: "Explain what you'd get from joining two tables with an always-true ON condition (e.g. ON 1 = 1), and why that's usually a mistake." },
    ],
    interviewQuestions: [
      { question: "What's the difference between an INNER JOIN and a LEFT JOIN?", answer: "INNER JOIN returns only rows with a match in both tables. LEFT JOIN returns every row from the left table, with empty values where the right side has no match." },
      { question: "Why are joins necessary if data is split across normalized tables?", answer: "Normalization deliberately avoids duplicating data across tables. Joins recombine that related data when a query needs both." },
      { question: "What happens if you write a join without an ON condition?", answer: "You get a cross join: every row of the first table paired with every row of the second. That's almost never what you want." },
    ],
    prerequisites: ["primary-and-foreign-keys", "basic-sql-queries"],
    relatedTopics: ["primary-and-foreign-keys", "normalization", "aggregation"],
    keywords: ["JOIN", "INNER JOIN", "LEFT JOIN", "relational data"],
  },
  {
    id: "aggregation",
    title: "Aggregation",
    level: "intermediate",
    description: "Turn many rows into a summary value, like a count, total, or average.",
    explanation: `
Sometimes you want a summary, not the rows: "How many orders?" "Total
revenue?" "Average order value per customer?" These are **aggregation**
questions: turning many rows into one or a few numbers.

SQL's aggregate functions \`COUNT\`, \`SUM\`, \`AVG\`, \`MIN\`, and \`MAX\` do
this. On their own, they summarize a whole table into one row. With
\`GROUP BY\`, they summarize *per group*: one row per distinct value in a
column, like "revenue per customer" instead of one grand total.
    `.trim(),
    analogy:
      "If orders are a pile of receipts, aggregation is adding them all up on a calculator. GROUP BY is sorting the receipts into piles by customer first, then totaling each pile, so you get one total per customer.",
    examples: [
      {
        title: "A single summary value",
        code: `SELECT COUNT(*) AS total_orders, SUM(total_cents) AS revenue_cents
FROM orders;`,
        language: "sql",
        explanation: "Collapses the whole orders table into one row: how many orders exist, and their combined total.",
        walkthrough: [
          { code: "SELECT COUNT(*) AS total_orders,", explanation: "Counts the rows and labels the result total_orders." },
          { code: "SUM(total_cents) AS revenue_cents", explanation: "Adds up the total_cents column across every row." },
          { code: "FROM orders;", explanation: "Both aggregate functions run over every row of the orders table." },
        ],
      },
      {
        title: "Summarizing per group",
        code: `SELECT user_id, COUNT(*) AS order_count, SUM(total_cents) AS revenue_cents
FROM orders
GROUP BY user_id;`,
        language: "sql",
        explanation: "Instead of one grand total, this gives one row per user_id, each with that user's order count and revenue.",
      },
    ],
    howItWorks: `
Without \`GROUP BY\`, an aggregate function folds every row that passes
\`WHERE\` into one result. With \`GROUP BY <column>\`, the database first
buckets rows by that column's value, then runs the function in each
bucket, giving one row per bucket.

\`HAVING\` then filters *the group results* (for example, "only customers
with more than 5 orders"). That's different from \`WHERE\`, which filters
individual rows *before* grouping.
    `.trim(),
    whyItExists: `
Individual rows are too detailed for most decisions; nobody reads a
million orders to understand revenue. Aggregation lets the database
summarize efficiently and correctly, instead of every app pulling raw rows
and totaling them in its own code.
    `.trim(),
    whenToUse: `
Use aggregation whenever you need a count, total, average, minimum, or
maximum: dashboards, reports, "top N by revenue" features, or any "how
many," "how much," or "on average" question.
    `.trim(),
    whenNotToUse: `
If you need the rows themselves, use a plain SELECT with WHERE and ORDER
BY. Aggregating very large tables on every request without caching can be
slow; some apps precompute and store summaries instead.
    `.trim(),
    commonMistakes: [
      "Selecting a column that's neither aggregated nor grouped alongside an aggregate. Most databases reject it or behave unpredictably.",
      "Filtering on an aggregate with WHERE (like WHERE COUNT(*) > 5) instead of HAVING.",
      "Forgetting that COUNT(*) counts all rows, including those with empty values, while COUNT(column_name) skips rows where that column is empty.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a query returning the total row count and average price from a products table." },
      { difficulty: "Medium", prompt: "Using GROUP BY, show the number of orders per user_id in an orders table." },
      { difficulty: "Hard", prompt: "Add a HAVING clause to the previous query so it only shows users with more than 3 orders." },
    ],
    interviewQuestions: [
      { question: "What does GROUP BY do?", answer: "It buckets rows by one or more columns' values and runs aggregate functions in each bucket, giving one result row per group." },
      { question: "What's the difference between WHERE and HAVING?", answer: "WHERE filters individual rows before grouping. HAVING filters the group results after aggregation." },
      { question: "What's the difference between COUNT(*) and COUNT(column_name)?", answer: "COUNT(*) counts every row, empty values or not. COUNT(column_name) counts only rows where that column has a value." },
    ],
    prerequisites: ["basic-sql-queries", "filtering-and-sorting"],
    relatedTopics: ["filtering-and-sorting", "joins", "indexes"],
    keywords: ["aggregation", "GROUP BY", "COUNT", "SUM", "AVG", "HAVING"],
  },
  {
    id: "indexes",
    title: "Indexes",
    level: "intermediate",
    description: "A lookup structure that lets the database jump to matching rows instead of scanning the whole table.",
    explanation: `
Say \`users\` has 10 million rows and you run
\`SELECT * FROM users WHERE email = 'amara@example.com'\`. With no shortcut,
the database checks every row's email until it finds a match or reaches
the end. That's slow, and it gets slower as the table grows.

An **index** fixes this. It's a separate, ordered structure, like the
index at the back of a textbook, that maps a column's values to the rows
that hold them. With an index on \`email\`, the database jumps almost
straight to the matching row.
    `.trim(),
    analogy:
      "Without an index, finding a topic in a book means flipping through every page. With the index at the back, you look the topic up alphabetically and it tells you which page to turn to.",
    examples: [
      {
        title: "Before: scanning every row",
        code: `-- No index on email.
-- The database checks every row's email, one at a time,
-- until it finds (or rules out) a match.
SELECT * FROM users WHERE email = 'amara@example.com';`,
        language: "sql",
        explanation: "With millions of rows and no index, this query's cost grows with the table's size. This is a 'full table scan.'",
      },
      {
        title: "After: creating an index",
        code: `CREATE INDEX idx_users_email ON users (email);

-- Same query as before, now much faster:
SELECT * FROM users WHERE email = 'amara@example.com';`,
        language: "sql",
        explanation: "With the index in place, the same query jumps almost directly to the matching row instead of checking every row.",
        walkthrough: [
          { code: "CREATE INDEX idx_users_email ON users (email);", explanation: "Builds an ordered lookup structure mapping email values to row locations." },
          { code: "SELECT * FROM users WHERE email = 'amara@example.com';", explanation: "The database sees it can use idx_users_email to jump to matching rows instead of scanning the table." },
        ],
      },
    ],
    howItWorks: `
Most indexes are built as a **B-tree** — a sorted, tree-shaped structure
that finds a value in a few steps. It's like finding a word in a
dictionary by repeatedly splitting the search space in half, instead of
reading from the start.

The tradeoff: indexes aren't free. Every insert, update, or delete must
also update every index on the table, which slows writes. Indexes also use
extra disk space. So databases don't index every column automatically;
you choose, usually for columns often searched or joined on.
    `.trim(),
    whyItExists: `
Without indexes, any query that filters or joins on a real condition would
scan the whole table, and query time would grow linearly (or worse) with
data size. Indexes trade a little storage and slightly slower writes for
much faster reads on the columns that matter.
    `.trim(),
    whenToUse: `
Index columns often used in WHERE, JOIN, or ORDER BY, especially on large
tables. Foreign key columns are strong candidates, since they're joined on
often.
    `.trim(),
    whenNotToUse: `
Skip indexes on columns that are rarely searched or that change on almost
every write (each index update adds write cost). Skip them on very small
tables too: scanning a few hundred rows is already fast.
    `.trim(),
    commonMistakes: [
      "Indexing every column 'just in case,' which slows every write without speeding up reads that don't use those columns.",
      "Expecting an index to help a query that doesn't filter, join, or sort on that column.",
      "Forgetting that foreign key columns often need an index too, since joins on them are common.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In your own words, explain why a full table scan slows down as a table grows, but an indexed lookup barely does." },
      { difficulty: "Medium", prompt: "Write a CREATE INDEX statement for the status column of an orders table that's often filtered by status." },
      { difficulty: "Hard", prompt: "Describe a scenario where adding an index would hurt overall performance instead of helping." },
    ],
    interviewQuestions: [
      { question: "What is a database index?", answer: "A separate, ordered lookup structure for a column that lets the database jump to matching rows instead of scanning the whole table." },
      { question: "What's the tradeoff of adding an index?", answer: "Faster reads on that column, but extra disk space and slower writes, since every insert, update, or delete must update the index too." },
      { question: "What data structure do most database indexes use internally?", answer: "A B-tree. It keeps data sorted in a tree shape, so finding a value takes relatively few steps." },
    ],
    prerequisites: ["filtering-and-sorting"],
    relatedTopics: ["filtering-and-sorting", "joins", "query-optimization"],
    keywords: ["index", "B-tree", "full table scan", "performance"],
  },
  {
    id: "normalization",
    title: "Normalization",
    level: "intermediate",
    description: "Organize tables so each fact is stored in exactly one place, not copied everywhere it's needed.",
    explanation: `
Imagine an \`orders\` table that stores the customer's name and email on
every order, instead of a \`user_id\`. If the customer changes their email,
you must update *every order they've ever placed*. Miss one, and your data
disagrees with itself.

**Normalization** restructures tables so each fact is stored once, and
everything else references it (usually with a foreign key) instead of
copying it. Orders are still linked to customer info; that info just lives
in one authoritative place.
    `.trim(),
    analogy:
      "Storing a customer's email on every order is like writing a friend's phone number on every letter you send them. Normalization is writing it once in your address book and pointing there everywhere else. Update it once, and every reference is correct.",
    examples: [
      {
        title: "Before: duplicated data",
        code: `-- orders table (not normalized)
id | customer_name | customer_email      | total_cents
1  | Amara Musa     | amara@example.com  | 4599
2  | Amara Musa     | amara@example.com  | 1200
3  | Amara Musa     | amara@example.com  | 800

-- Amara's email is repeated on every single order.
-- Changing it means updating all 3 rows, and it's easy to miss one.`,
        explanation: "The customer's name and email are copied into every order. Changing her email means finding and fixing every one of these rows.",
      },
      {
        title: "After: normalized into two tables",
        code: `-- users table
id | name        | email
2  | Amara Musa  | amara@example.com

-- orders table (normalized)
id | user_id | total_cents
1  | 2       | 4599
2  | 2       | 1200
3  | 2       | 800

-- Amara's email now lives in exactly one row.
-- Updating it there instantly applies everywhere it's referenced.`,
        explanation: "Amara's details now live in one row. Each order references her by user_id, so updating her email changes one row, and every order shows the correct value through a join.",
      },
    ],
    howItWorks: `
Normalization is usually described in stages called **normal forms**.
Each fixes a specific kind of duplication or inconsistency, such as a
column holding several values at once, or non-key columns depending on
only part of a multi-column key.

In everyday design, you mostly apply one idea: if a fact could change and
would need updating in more than one row, move it to its own table and
reference it with a foreign key.
    `.trim(),
    whyItExists: `
Duplicated data drifts apart. A fact stored in ten places will eventually
disagree with itself when someone updates nine and misses one.
Normalization gives each fact one authoritative home, so there's never a
question of "which copy is correct."
    `.trim(),
    whenToUse: `
Normalize when information belongs to one entity (a customer's email, a
product's price) and may change over time. Keeping it in one place makes
updates safe. This is the default for most relational schema design.
    `.trim(),
    whenNotToUse: `
Heavily normalized data needs more joins to reassemble, which can slow
read-heavy systems. Sometimes some duplication (**denormalization**) is
accepted for speed. For example, storing a product's name on a historical
order line item keeps old receipts showing the name at purchase time, even
if the product is renamed later.
    `.trim(),
    commonMistakes: [
      "Storing a repeated value (like a customer's address) on every related row instead of referencing one source table.",
      "Over-normalizing every detail, so simple queries need long chains of joins.",
      "Thinking normalization just means 'more tables'. The goal is removing duplicated, update-prone facts, not adding tables.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain what could go wrong if a shipping address were copied onto every order a customer places, instead of stored once." },
      { difficulty: "Medium", prompt: "An 'employees' table repeats the department name and manager on every row. Redesign it as two normalized tables." },
      { difficulty: "Hard", prompt: "Describe a realistic case where deliberately keeping some duplicated data (denormalization) is a reasonable tradeoff." },
    ],
    interviewQuestions: [
      { question: "What problem does normalization solve?", answer: "It stops the same fact being copied across many rows, where the copies could drift out of sync." },
      { question: "What's the tradeoff of a highly normalized schema?", answer: "Reassembling related data needs more joins, adding query complexity and cost compared with some duplication." },
      { question: "What is denormalization?", answer: "Deliberately duplicating some data, accepting the inconsistency risk, for faster reads or simpler queries." },
    ],
    prerequisites: ["primary-and-foreign-keys", "joins"],
    relatedTopics: ["primary-and-foreign-keys", "joins", "nosql-data-modeling"],
    keywords: ["normalization", "denormalization", "data duplication", "schema design"],
  },
  {
    id: "constraints",
    title: "Constraints",
    level: "intermediate",
    description: "Rules on a table's columns that the database enforces, so invalid data can't be saved.",
    explanation: `
Primary and foreign keys are two kinds of a broader idea: a
**constraint**, a rule on a column (or set of columns) that no row may
break. Beyond keys, the common ones are:

- \`NOT NULL\`: the column can never be empty.
- \`UNIQUE\`: no two rows may share the same value.
- \`DEFAULT\`: fill in a value automatically when none is given.
- \`CHECK\`: a custom condition the value must meet, like "price must be
greater than zero."

The point is the same for all of them: instead of trusting every piece of
app code, forever, to validate, the database enforces the rule itself, no
matter what code writes to it.
    `.trim(),
    analogy:
      "Constraints are like the slots on a vending machine tray. A can won't fit sideways, not because someone checked, but because the slot is shaped that way. App-level validation is more like a sign asking people to load cans upright: helpful, but easy to ignore.",
    examples: [
      {
        title: "The four common non-key constraints",
        code: `CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  in_stock BOOLEAN NOT NULL DEFAULT true
);`,
        language: "sql",
        explanation: "Four rules the database always enforces: no two products share a sku, name and price_cents can't be empty, price_cents must be positive, and in_stock defaults to true when not given.",
        walkthrough: [
          { code: "sku TEXT UNIQUE NOT NULL", explanation: "Two constraints on one column: it must have a value, and no other row may have the same value." },
          { code: "price_cents INTEGER NOT NULL CHECK (price_cents > 0)", explanation: "CHECK enforces a custom condition. Here a price like 0 or -500 can never be saved, whatever the app sends." },
          { code: "in_stock BOOLEAN NOT NULL DEFAULT true", explanation: "If an INSERT leaves out in_stock, the database fills in true." },
        ],
      },
      {
        title: "What happens when a constraint is violated",
        code: `INSERT INTO products (sku, name, price_cents)
VALUES ('SKU-1', 'Desk Lamp', -500);
-- ERROR: new row violates check constraint "products_price_cents_check"`,
        language: "sql",
        explanation: "The insert never happens. The database rejects the whole statement as soon as any constraint fails, instead of saving a partly valid row.",
      },
    ],
    howItWorks: `
Constraints are checked whenever a row is inserted or updated, before the
change is committed. If any constraint fails, the whole statement is
rejected and nothing is written. There's no "half-valid" row.

That makes constraints the last line of defense. Even if app validation
has a bug, gets bypassed, or another app (or a future developer) writes to
the table without knowing the rules, the database still refuses invalid
data.
    `.trim(),
    whyItExists: `
If only app code validates data, every place that writes to a table (every
service, script, and future feature) must remember and correctly repeat
the same rules. Constraints put the rule in the one place all writers pass
through: the database, where it can't be forgotten or bypassed.
    `.trim(),
    whenToUse: `
Add a constraint for any rule that must always hold: a price that's never
negative, an email that must be unique, a status that's never blank. Keep
app-level validation too (for friendlier, earlier error messages), but the
constraint is what guarantees the rule.
    `.trim(),
    whenNotToUse: `
Constraints can't handle validation that needs context the database
doesn't have, like "this discount code only works for accounts created in
the last 30 days." They also can't give friendly, specific form error
messages. Put that logic in app-level validation.
    `.trim(),
    commonMistakes: [
      "Validating only in app code and assuming that's enough, when another script, migration, or service writing to the table can bypass it.",
      "Adding a UNIQUE constraint to a table that already has duplicates. It fails until you clean them up.",
      "Forgetting that a failed constraint rejects the whole statement, not just the bad column, so the other changes in that INSERT or UPDATE are rejected too.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a CREATE TABLE for a coupons table whose code column must be unique and not null." },
      { difficulty: "Medium", prompt: "Add a CHECK constraint to a reservations table so party_size is always greater than 0." },
      { difficulty: "Hard", prompt: "Explain why app-only validation of 'email must be unique' can still let duplicate emails in, and how a UNIQUE constraint prevents that whatever the app does." },
    ],
    interviewQuestions: [
      { question: "What is a database constraint?", answer: "A rule on a column or set of columns that the database enforces, rejecting any row that breaks it." },
      { question: "What's the difference between NOT NULL and CHECK?", answer: "NOT NULL only requires a value. CHECK requires the value to meet a custom condition, like being greater than zero." },
      { question: "Why add a database constraint if the application already validates the same rule?", answer: "App validation can be bypassed, buggy, or missing in other code that writes to the same table. The constraint guarantees the rule holds whatever writes to the database." },
    ],
    prerequisites: ["primary-and-foreign-keys"],
    relatedTopics: ["primary-and-foreign-keys", "basic-sql-queries", "normalization"],
    keywords: ["constraints", "NOT NULL", "UNIQUE", "CHECK", "DEFAULT", "data integrity"],
  },
  {
    id: "transactions-and-acid",
    title: "Transactions & ACID",
    level: "intermediate",
    description: "Group several operations into one all-or-nothing unit, so a failure never leaves data half-changed.",
    explanation: `
A money transfer is two operations: subtract $100 from Account A, then add
$100 to Account B. If the database crashes or the connection drops between
them, $100 just vanishes.

A **transaction** groups operations into one all-or-nothing unit. Either
every operation succeeds and is saved, or if anything fails, everything is
rolled back as if it never happened. There's no half-applied state.

Transaction guarantees are summed up as **ACID**:

- **Atomicity**: all or nothing.
- **Consistency**: data always follows the rules you've defined, like
foreign keys.
- **Isolation**: transactions running at the same time don't see each
other's half-finished work.
- **Durability**: once confirmed, a transaction survives even a crash
right afterward.
    `.trim(),
    analogy:
      "A transaction is like sealing several steps in one envelope: either the whole envelope is delivered as sealed, or it's never sent. Nobody gets half an envelope.",
    examples: [
      {
        title: "A money transfer as a transaction",
        code: `BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

COMMIT;`,
        language: "sql",
        explanation: "Both updates sit between BEGIN and COMMIT. If anything fails before COMMIT, the database rolls it all back and Account 1's balance is restored.",
        walkthrough: [
          { code: "BEGIN;", explanation: "Starts a transaction. Nothing inside is permanent yet." },
          { code: "UPDATE accounts SET balance = balance - 100 WHERE id = 1;", explanation: "Subtracts from the first account. Not permanent yet; only visible inside this transaction." },
          { code: "UPDATE accounts SET balance = balance + 100 WHERE id = 2;", explanation: "Adds to the second account." },
          { code: "COMMIT;", explanation: "Makes both changes permanent together. If this line is never reached, neither change is kept." },
        ],
      },
      {
        title: "Rolling back on purpose",
        code: `BEGIN;

UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 42;
-- Suppose application code checks the new quantity and finds it went negative:
ROLLBACK;`,
        language: "sql",
        explanation: "ROLLBACK undoes every change since BEGIN, as if the transaction never happened. Useful when app logic spots a problem partway through.",
      },
    ],
    howItWorks: `
Inside a transaction, the database tracks every change but doesn't make it
visible or permanent to anyone else yet. \`COMMIT\` makes all the changes
permanent at once. \`ROLLBACK\` discards them all, restoring the data to how
it was before \`BEGIN\`.

For isolation, the database controls how much (and when) one
transaction's in-progress changes are visible to others running at the
same time, so two simultaneous transfers don't corrupt each other's math.
    `.trim(),
    whyItExists: `
Many real operations are several steps that only make sense together.
Without transactions, a crash, network drop, or bug partway through could
leave data in a state no correct sequence would produce: money debited but
never credited, or an order marked paid with no payment recorded.
Transactions make "partly done" impossible.
    `.trim(),
    whenToUse: `
Use a transaction whenever several statements must succeed or fail
together to keep data correct: money transfers, placing an order that also
reduces inventory, creating a user account along with its settings row.
    `.trim(),
    whenNotToUse: `
A single statement doesn't need an explicit transaction; most databases
already treat each statement as its own transaction. Also avoid keeping a
transaction open for long (e.g. across a slow external API call), since it
can block other transactions.
    `.trim(),
    commonMistakes: [
      "Forgetting to COMMIT, so the changes are eventually rolled back or lost.",
      "Doing slow, unrelated work (like calling an external API) inside an open transaction, blocking other operations waiting on the same rows.",
      "Assuming a crash mid-transaction leaves partial changes. Properly used transactions guarantee it doesn't.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In your own words, explain what would go wrong with a money transfer that isn't in a transaction if the app crashed halfway." },
      { difficulty: "Medium", prompt: "Write a transaction that inserts an order row and reduces a product's stock quantity, so both happen or neither does." },
      { difficulty: "Hard", prompt: "Explain each of the four ACID properties in your own words, using the money transfer example for each." },
    ],
    interviewQuestions: [
      { question: "What does a database transaction guarantee?", answer: "A group of operations either all succeed and become permanent, or, if any part fails, none take effect. There's no partly applied state." },
      { question: "What does the 'A' in ACID stand for, and what does it mean?", answer: "Atomicity: the transaction's operations form one indivisible unit. Either all apply or none do." },
      { question: "What is the difference between COMMIT and ROLLBACK?", answer: "COMMIT makes every change in the transaction permanent. ROLLBACK discards every change since the transaction began, as if it never happened." },
    ],
    prerequisites: ["basic-sql-queries"],
    relatedTopics: ["basic-sql-queries", "connection-pooling"],
    keywords: ["transaction", "ACID", "atomicity", "commit", "rollback"],
  },
  {
    id: "orms",
    title: "ORMs",
    level: "intermediate",
    description: "A library that lets your code work with database rows as objects and writes the SQL for you.",
    explanation: `
Raw SQL strings in app code work, but they get repetitive and error-prone:
building queries by joining strings, mapping columns back into objects by
hand, and retyping the same SELECT/INSERT/UPDATE patterns.

An **ORM** (Object-Relational Mapper) bridges that gap. You work with rows
as regular objects in your language (create a \`User\`, set its properties,
call \`.save()\`), and the ORM turns those actions into SQL. You say *what*
you want in the language you already use; the ORM generates the *how* in
SQL.
    `.trim(),
    analogy:
      "An ORM is like a translator at a meeting. You speak your language (app code), the translator (the ORM) turns your requests into the language the database understands (SQL), then translates the reply back.",
    examples: [
      {
        title: "Raw SQL vs. an ORM (JavaScript, using a Prisma-style ORM)",
        code: `// Raw SQL
const result = await db.query(
  "SELECT * FROM users WHERE id = $1",
  [userId]
);
const user = result.rows[0];

// With an ORM
const user = await prisma.user.findUnique({
  where: { id: userId },
});`,
        explanation: "Both fetch the same row. The ORM version reads like normal app code and returns a ready-to-use object, with the SQL generated for you.",
        walkthrough: [
          { code: 'const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);', explanation: "Sends a raw SQL string, passing userId as a parameter." },
          { code: "const user = result.rows[0];", explanation: "Pulls the first row out of the raw result by hand." },
          { code: "const user = await prisma.user.findUnique({ where: { id: userId } });", explanation: "The ORM builds the same SQL and returns the row as a plain object." },
        ],
      },
      {
        title: "Creating and updating a row through an ORM",
        code: `const user = await prisma.user.create({
  data: { name: "Amara", email: "amara@example.com" },
});

await prisma.user.update({
  where: { id: user.id },
  data: { email: "amara@newmail.com" },
});`,
        explanation: "The same as an INSERT then an UPDATE, written as method calls instead of SQL strings.",
      },
    ],
    howItWorks: `
An ORM maps your language's classes or object shapes to the database's
tables and columns. When you call a method like \`.create()\` or
\`.findUnique()\`, it builds the SQL, sends it, and turns the returned rows
into objects shaped like your app's data.

Most ORMs also handle migrations (versioned scripts that change the
schema over time) and connection management. Many let you "drop down" to
raw SQL for the rare query that's awkward in the ORM's API.
    `.trim(),
    whyItExists: `
Hand-writing SQL for every operation in a large app means lots of
repetitive string-building, manual type conversion, and more room for
mistakes (like leaving a query open to SQL injection). ORMs remove the
repetition, keep you in one language most of the time, and give safer
defaults (like automatically parameterizing values).
    `.trim(),
    whenToUse: `
ORMs fit most everyday app code: simple CRUD, standard relationships,
typical filtering. There, the productivity and safety gains outweigh the
cost of the abstraction.
    `.trim(),
    whenNotToUse: `
For complex, performance-critical queries (heavy aggregations, deeply
nested joins, database-specific features), ORM-generated SQL can be slow
or awkward. Raw SQL, which most ORMs allow as an escape hatch, is often
clearer and faster.
    `.trim(),
    commonMistakes: [
      "Assuming an ORM writes efficient SQL. It can generate slow queries (like fetching related rows one at a time in a loop) as easily as hand-written code.",
      "Never learning the underlying SQL, which makes slow or wrong queries much harder to debug.",
      "Fighting the ORM to force an awkward query through it instead of using raw SQL for that one case.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In your own words, explain what an ORM does between your app code and the database." },
      { difficulty: "Medium", prompt: "Write the raw SQL equivalent of an ORM call that finds all orders where total_cents is greater than 1000." },
      { difficulty: "Hard", prompt: "Describe a scenario where raw SQL is a better choice than an ORM's query builder." },
    ],
    interviewQuestions: [
      { question: "What is an ORM?", answer: "A library that lets you work with database rows as objects in your language, turning those object operations into SQL." },
      { question: "What's a downside of relying entirely on an ORM?", answer: "It can generate inefficient SQL for complex queries, and developers who never learn SQL struggle to debug or tune slow queries." },
      { question: "Do ORMs prevent you from writing raw SQL when needed?", answer: "No. Most ORMs have an escape hatch for running raw SQL when their query API doesn't fit." },
    ],
    prerequisites: ["basic-sql-queries"],
    relatedTopics: ["basic-sql-queries", "database-migrations", "connection-pooling"],
    keywords: ["ORM", "object-relational mapper", "Prisma", "abstraction"],
  },
  {
    id: "postgresql-deep-dive",
    title: "PostgreSQL in Depth",
    level: "intermediate",
    description: "PostgreSQL features beyond standard SQL: richer data types, auto-incrementing ids, and the psql client.",
    explanation: `
SELECT, JOIN, and WHERE are standard SQL that works, with minor syntax
differences, across most relational databases. **PostgreSQL** ("Postgres")
is one of the most widely used databases, and it adds its own extensions:

- richer column types like **JSONB** (structured, queryable JSON stored in
an efficient binary form) and arrays
- auto-incrementing id columns
- \`psql\`, an interactive command-line client for talking to a database
directly
    `.trim(),
    analogy:
      "Standard SQL is like standard English, understood everywhere. Postgres features are a rich regional vocabulary: more expressive with someone who knows it, meaningless to a database that only speaks the standard dialect.",
    examples: [
      {
        title: "Postgres-specific column types",
        code: `CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);`,
        language: "sql",
        explanation: "SERIAL gives an auto-incrementing integer id, TEXT[] stores a list of strings in one column, JSONB holds a flexible structured document, and TIMESTAMPTZ is a timezone-aware timestamp defaulting to now.",
        walkthrough: [
          { code: "id SERIAL PRIMARY KEY", explanation: "Postgres creates a hidden sequence that generates the next integer id for each new row." },
          { code: "tags TEXT[]", explanation: "An array column, so a simple list of strings needs no separate 'tags' table." },
          { code: "metadata JSONB", explanation: "Stores arbitrary structured data (not fixed columns) in an efficient binary form that can still be indexed and queried." },
        ],
      },
      {
        title: "Querying inside a JSONB column",
        code: `SELECT name, metadata->>'color' AS color
FROM products
WHERE metadata->>'in_stock' = 'true';`,
        language: "sql",
        explanation: "-> extracts a nested value as JSON; ->> extracts it as plain text. ->> is used here because the color is compared and shown as ordinary text.",
      },
    ],
    howItWorks: `
\`JSONB\` isn't stored as the text you typed. Postgres parses it into a
decomposed binary format up front. That enables indexing (a GIN index can
index the keys/values inside a JSONB column) and fast operators like \`->\`
and \`->>\`, at the cost of a little overhead on write.

The \`psql\` client connects straight to a database
(\`psql -h host -U user -d dbname\`). Commands like \`\\dt\` list tables and
\`\\d products\` shows a table's columns, handy for inspecting data or
debugging without writing a script.
    `.trim(),
    whyItExists: `
Projects often mix strict relational data (a user's id and email) with
flexible, per-row data (a product's optional custom attributes). JSONB lets
Postgres handle both, so you don't need a separate document database just
for the flexible parts.
    `.trim(),
    whenToUse: `
Use JSONB for a few truly flexible or sparse fields: custom attributes, a
webhook payload, per-user settings. Use psql to inspect data, run ad-hoc
queries, or debug against a database during development.
    `.trim(),
    whenNotToUse: `
Don't store your whole schema as JSONB just because it's flexible. You
lose the enforcement, clarity, and full indexing support of real columns
and foreign keys. If a field has a known, stable shape and you query or
join on it often, make it a real column.
    `.trim(),
    commonMistakes: [
      "Using -> (which returns JSON) when you wanted plain text from ->>, causing confusing type-mismatch errors in comparisons.",
      "Using a JSONB column to avoid designing a proper related table, out of laziness rather than real need for flexibility.",
      "Assuming SERIAL ids have no gaps. Deleted rows leave permanent gaps, since the sequence never goes backward.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a CREATE TABLE for an 'events' table with a SERIAL id and a JSONB 'payload' column." },
      { difficulty: "Medium", prompt: "Write a query selecting rows whose JSONB 'settings' column has a nested key 'theme' equal to 'dark'." },
      { difficulty: "Hard", prompt: "Describe one case where you'd choose a JSONB column over a proper related table, and one where you'd choose the related table." },
    ],
    interviewQuestions: [
      { question: "What's the difference between JSON and JSONB in PostgreSQL?", answer: "JSON is stored as the exact text you inserted. JSONB is parsed into a decomposed binary form: slightly slower to write, but it supports indexing and faster queries." },
      { question: "What does a SERIAL column do?", answer: "It creates an auto-incrementing integer column, backed by a hidden sequence that generates each new row's id." },
      { question: "When would you reach for a JSONB column instead of normalizing into another table?", answer: "When the data's shape really varies or is sparse per row, and you don't query or join on it much. Otherwise a related table usually fits better." },
    ],
    prerequisites: ["basic-sql-queries", "tables-rows-columns"],
    relatedTopics: ["basic-sql-queries", "indexes", "normalization"],
    keywords: ["PostgreSQL", "Postgres", "JSONB", "psql", "SERIAL", "arrays", "TIMESTAMPTZ"],
  },
  {
    id: "subqueries-and-ctes",
    title: "Subqueries & CTEs",
    level: "intermediate",
    description: "Nest one query in another, or name a step with WITH, to split a complex question into readable pieces.",
    explanation: `
Some questions need more than one flat query. "Find users with more than
3 orders" needs a middle step: find the user ids with more than 3 orders,
then look up those users.

- A **subquery** is a query nested inside another, in a \`WHERE\`, \`FROM\`,
or \`SELECT\` clause.
- A **CTE** (Common Table Expression), written with \`WITH\`, does the same
but names the middle step so you can use it like a temporary table. This
often makes multi-step queries much easier to read.
    `.trim(),
    analogy:
      "A subquery is scratch work in the margin before answering the real question. A CTE is the same scratch work with a clear label ('Step 1: frequent buyers'), so later readers, including future you, don't have to unpick a nested block.",
    examples: [
      {
        title: "A subquery in WHERE",
        code: `SELECT name FROM users
WHERE id IN (
  SELECT user_id FROM orders
  GROUP BY user_id
  HAVING COUNT(*) > 3
);`,
        language: "sql",
        explanation: "The inner query finds every user_id with more than 3 orders. The outer query then finds the users with those ids.",
        walkthrough: [
          { code: "SELECT user_id FROM orders GROUP BY user_id HAVING COUNT(*) > 3", explanation: "Runs first (conceptually) and returns the user ids that meet the condition." },
          { code: "WHERE id IN (...)", explanation: "The outer query keeps only users whose id is in that list." },
        ],
      },
      {
        title: "The same query, using a CTE",
        code: `WITH frequent_buyers AS (
  SELECT user_id FROM orders
  GROUP BY user_id
  HAVING COUNT(*) > 3
)
SELECT users.name
FROM users
JOIN frequent_buyers ON frequent_buyers.user_id = users.id;`,
        language: "sql",
        explanation: "WITH names the middle result frequent_buyers, and the rest of the query joins against it like a real table. Often easier to follow than a nested subquery once there's more than one step.",
      },
    ],
    howItWorks: `
Conceptually, the database runs the inner subquery (or each CTE) first to
get a middle result, then runs the outer query against it.

Postgres treats a CTE mostly as a named, temporary result you can select
from or join. For hierarchical data (like a tree of comment replies), it
also supports \`WITH RECURSIVE\`, which repeats a query against its own
previous results until nothing new is found.
    `.trim(),
    whyItExists: `
Many real questions ("customers who bought X but never Y," "the
best-selling product in each category") can't be one flat SELECT.
Subqueries and CTEs let you build the answer in stages inside one query,
without extra round trips or hand-managed temporary tables.
    `.trim(),
    whenToUse: `
Use a CTE when a query has several logical steps and naming them makes it
easier to read. Use an inline subquery for a small, self-contained filter
that doesn't need a name.
    `.trim(),
    whenNotToUse: `
If a plain JOIN or simple aggregation already answers the question, a
subquery or CTE just adds indirection. Subqueries nested several levels
deep get hard to read and optimize; pull a level out into a named CTE or
rethink the query.
    `.trim(),
    commonMistakes: [
      "Writing a correlated subquery (one that uses a column from the outer query) that effectively reruns once per outer row, which is very slow on large tables.",
      "Assuming a CTE is always computed once and cached. This differs across databases and versions, so it isn't a guaranteed free optimization.",
      "Nesting several layers of subqueries instead of naming steps with CTEs, making the query hard for others (or future you) to follow.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Rewrite a subquery that uses = into one that uses IN, to find orders placed by a customer looked up by email." },
      { difficulty: "Medium", prompt: "Write a CTE that computes the average order total, then select all orders above that average." },
      { difficulty: "Hard", prompt: "Explain the difference between a correlated and a non-correlated subquery, with an example of each, and why the correlated one is usually slower." },
    ],
    interviewQuestions: [
      { question: "What is a CTE and why use one instead of a plain subquery?", answer: "A WITH clause that names a middle query result. It mainly makes multi-step queries easier to read by labeling each stage instead of nesting subqueries." },
      { question: "What is a correlated subquery?", answer: "A subquery that uses a column from its outer query, so it conceptually reruns once per outer row." },
      { question: "Can a single query define more than one CTE?", answer: "Yes. List several CTEs in one WITH clause, separated by commas; later ones can reference earlier ones." },
    ],
    prerequisites: ["joins", "aggregation"],
    relatedTopics: ["joins", "aggregation", "basic-sql-queries"],
    keywords: ["subquery", "CTE", "WITH clause", "correlated subquery", "nested query"],
  },
  {
    id: "pagination",
    title: "Pagination",
    level: "intermediate",
    description: "Return a large result in smaller pages, using LIMIT/OFFSET or keyset pagination.",
    explanation: `
An endpoint like \`GET /products\` might match thousands of rows. Sending
them all at once wastes bandwidth, memory, and rendering time on data
almost nobody scrolls to. **Pagination** returns one smaller page at a
time, plus a way to fetch the next.

- \`LIMIT\`/\`OFFSET\` skips some rows and takes the next batch. It's easy to
reason about ("page 3, 20 per page") but slows down the deeper you go,
because the database still walks past every skipped row.
- **Keyset pagination** ("everything after id 340") filters on a column's
value instead of counting rows, so it stays fast at any depth.
    `.trim(),
    analogy:
      "OFFSET/LIMIT is like opening a phone book at page 1 every time someone asks for page 50: you still count past pages 1 to 49. Keyset pagination is a bookmark, so the next request opens straight to where you left off.",
    examples: [
      {
        title: "OFFSET/LIMIT pagination",
        code: `-- Page 3, 20 rows per page
SELECT * FROM products
ORDER BY id
LIMIT 20 OFFSET 40;`,
        language: "sql",
        explanation: "Skips the first 40 rows (pages 1 and 2), then returns the next 20: page 3.",
        walkthrough: [
          { code: "ORDER BY id", explanation: "Gives pages a stable order. Without it, pages can show duplicate or missing rows, since order isn't guaranteed between requests." },
          { code: "LIMIT 20", explanation: "Caps how many rows this page returns." },
          { code: "OFFSET 40", explanation: "Skips the rows on earlier pages." },
        ],
      },
      {
        title: "Keyset pagination",
        code: `SELECT * FROM products
WHERE id > 340
ORDER BY id
LIMIT 20;`,
        language: "sql",
        explanation: "Instead of counting past rows with OFFSET, this jumps to rows after the last id on the previous page (340). With an index on id, the database finds that point instantly, however deep you are.",
      },
    ],
    howItWorks: `
With \`OFFSET\`/\`LIMIT\`, the database still generates (or at least counts
through) every row up to the offset, then throws most of them away. The
deeper the page, the more wasted work.

Keyset pagination uses a \`WHERE\` condition on an indexed, ordered column
(like \`id\` or \`created_at\`) to jump straight to the starting point. Page
5,000 costs about the same as page 1.
    `.trim(),
    whyItExists: `
Most of a large result is never looked at. Pagination saves list endpoints
and UIs from loading, sending, and rendering every matching row at once,
which wastes work in the database, the network, and the browser.
    `.trim(),
    whenToUse: `
Use OFFSET/LIMIT for small to moderate results, or when users need to jump
to any page number. Use keyset pagination for large, fast-growing tables,
infinite-scroll feeds, or any API where deep-page speed matters.
    `.trim(),
    whenNotToUse: `
If the result easily fits in one response (a settings list, a few
categories), skip pagination and return everything.
    `.trim(),
    commonMistakes: [
      "Paginating without ORDER BY, so rows shift between pages (appearing twice or never) when data changes between requests.",
      "Using large OFFSETs on a growing table and expecting steady speed. OFFSET's cost grows with page depth.",
      "Using keyset pagination on a column that isn't unique or indexed. It can be as slow as OFFSET, or skip/duplicate rows when values tie.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write an OFFSET/LIMIT query for page 2 of a products table, 10 rows per page." },
      { difficulty: "Medium", prompt: "Convert that query to keyset pagination, given the last product id on page 1." },
      { difficulty: "Hard", prompt: "Explain why OFFSET 100000 LIMIT 20 is slow on a large table, and why a keyset query at the same depth isn't." },
    ],
    interviewQuestions: [
      { question: "What's the difference between OFFSET/LIMIT and keyset pagination?", answer: "OFFSET/LIMIT skips a number of rows before returning a page, so it slows down at deeper pages. Keyset pagination filters on an indexed column's value and stays fast at any depth." },
      { question: "Why does pagination need a stable ORDER BY?", answer: "Without it, row order isn't guaranteed between requests, so pages can show duplicate or missing rows if the data or query plan changes." },
      { question: "Why is deep OFFSET pagination slow on large tables?", answer: "The database still walks through (or counts) every skipped row before returning the page, even though none of them are returned." },
    ],
    prerequisites: ["filtering-and-sorting", "indexes"],
    relatedTopics: ["filtering-and-sorting", "indexes", "query-optimization"],
    keywords: ["pagination", "OFFSET", "LIMIT", "keyset pagination", "cursor pagination", "infinite scroll"],
  },
];
