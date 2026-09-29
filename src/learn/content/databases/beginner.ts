import type { Topic } from "../../types/content";

export const databasesBeginnerTopics: Topic[] = [
  {
    id: "what-is-a-database",
    title: "What is a Database?",
    level: "beginner",
    description: "A system that stores your data in an organized shape you can search, filter, and change directly — not just a file you save data into.",
    explanation: `
Imagine you kept all your app's data in a giant text file — every user on
one line, every order on another. To find "all orders placed by Amara
last week," you'd have to open the file and read through every single
line yourself, by hand, every time.

A **database** is software built specifically to avoid that. It stores
your data broken up into organized, labeled structures (most commonly
**tables**, which look a lot like spreadsheets), and it comes with its
own language for asking questions of that data — "give me every order
from Amara, sorted by date" — without you ever having to manually scan
anything. The database does the searching, and it does it fast, even
across millions of records.

This is the hands-on side of databases: you don't just store data
somewhere for safekeeping, you *query* it directly, using a language
built for exactly that purpose.
    `.trim(),
    analogy:
      "A pile of receipts shoved in a shoebox technically 'stores' your spending data, but finding anything means digging through the whole box. A database is like a well-organized filing cabinet with labeled folders, an index at the front, and a clerk who can hand you exactly the folder you ask for in seconds.",
    examples: [
      {
        title: "Asking a database a question directly",
        code: `SELECT name, email
FROM users
WHERE signed_up_at > '2026-01-01';`,
        language: "sql",
        explanation: "This is a real query, not pseudocode. It asks the database directly for every user who signed up after a certain date — the database handles the searching.",
        walkthrough: [
          { code: "SELECT name, email", explanation: "Says which pieces of information you want back — just the name and email, not everything." },
          { code: "FROM users", explanation: "Tells the database which table to look in." },
          { code: "WHERE signed_up_at > '2026-01-01';", explanation: "Narrows the results down to only the rows that match this condition." },
        ],
      },
      {
        title: "A database holds many related tables",
        code: `-- A single small database might contain:
users        (people who use the app)
orders       (purchases people have made)
products     (items available to buy)
reviews      (feedback people left on products)`,
        explanation: "A real database usually isn't just one table — it's a whole collection of related tables that together represent your application's data.",
      },
    ],
    howItWorks: `
A database runs as its own piece of software (like PostgreSQL, MySQL, or
SQLite), usually separate from your application code. Your application
connects to it over a connection, sends it a query written in **SQL**
(Structured Query Language), and the database figures out the fastest
way to find and return exactly the data that was asked for.

Because the database itself understands the structure of the data (which
columns exist, what type each one is, how tables relate to each other),
it can search, filter, sort, and combine data far more efficiently than
your own application code scanning through everything manually.
    `.trim(),
    whyItExists: `
Applications need to store data that outlives a single run of the
program, that many users can read and write at once, and that can be
searched in flexible ways nobody fully predicted up front. Plain files
struggle with all three: they're slow to search, they get corrupted
easily under concurrent writes, and answering a new kind of question
usually means writing brand-new, one-off code. Databases exist to solve
storage, search, and safe concurrent access all at once, with a standard
query language instead of custom code for every question.
    `.trim(),
    whenToUse: `
Reach for a database as soon as your application has data that needs to
persist between runs, that multiple people or processes might read or
write at the same time, or that you'll need to search and filter in
ways you can't fully predict today.
    `.trim(),
    whenNotToUse: `
For truly tiny, single-user, throwaway scripts — a quick one-off
calculation, a config file that never changes — a plain file or an
in-memory variable is simpler and a database is unnecessary overhead.
    `.trim(),
    commonMistakes: [
      "Thinking a database is just 'a place files are stored' rather than a system you actively query.",
      "Assuming you need to write custom search code, when the database can already do filtering and sorting for you.",
      "Confusing a spreadsheet file with a database — a spreadsheet has no query language and no safe way for multiple people to write at once.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List three questions you might want to ask about data in a to-do list app (e.g. 'show me all incomplete tasks'). For each, name which pieces of data you'd need." },
      { difficulty: "Medium", prompt: "Explain, in your own words, why searching a large text file by hand is slower than asking a database the same question." },
      { difficulty: "Hard", prompt: "Sketch (in words) what tables a simple blog application would need, and what kind of question you'd ask each one." },
    ],
    interviewQuestions: [
      { question: "What is a database, in plain terms?", answer: "Software that stores data in an organized, structured way and provides a query language to search, filter, and modify that data directly, rather than requiring you to scan through it manually." },
      { question: "Why not just store application data in a plain text file?", answer: "Plain files don't offer fast searching (you'd scan the whole file for every question), don't safely handle multiple simultaneous writers (two processes writing at once can corrupt the file), and require brand-new custom code for every new kind of question — a database solves all three by understanding the data's structure and providing a shared query language." },
      { question: "What's the difference between a database and a spreadsheet file like Excel?", answer: "A spreadsheet is a single file with no query language and no safe way for multiple people to write to it at the same time — 'querying' it means manually filtering or scrolling. A database is a running piece of software that understands the structure of the data and lets many clients read and write concurrently through a standard query language like SQL." },
      { question: "What does it mean to *query* a database, as opposed to just reading data from it?", answer: "Querying means describing *what* result you want — 'every order from Amara, sorted by date' — and letting the database figure out *how* to find it, rather than your own code opening the data and manually looping through it to find matches." },
      { question: "Why can a database search millions of rows faster than application code scanning them one by one?", answer: "The database understands the data's structure (types, relationships) and can use techniques like indexes to jump toward matching rows instead of checking every one; application code manually looping through raw data has no such shortcut unless it reimplements one itself." },
      { question: "What is SQL, and why does it matter that so many different databases understand it?", answer: "SQL (Structured Query Language) is a standardized language for describing what data you want or how you want to change it. Because most relational databases understand it (with minor dialect differences), the skills and even much of the query code transfer across products like PostgreSQL, MySQL, and SQLite." },
      { question: "You're building a to-do list app. What kind of data belongs in a database rather than just in application variables?", answer: "Anything that needs to survive after the app closes and be found again later — the tasks themselves, their completed/incomplete status, due dates — because a database persists data between runs and lets you query it later ('show me all incomplete tasks'), which a variable in memory can't do." },
      { question: "A teammate says a small app can just keep all its data in an in-memory array instead of a database. What breaks first as that app grows?", answer: "The data disappears the moment the process restarts, two requests modifying the array at the same time can race and corrupt it, and any new kind of question about the data means writing new manual search code instead of just asking for it — exactly the three problems databases exist to solve." },
      { question: "What does it mean that a database usually runs as its own separate piece of software from your application?", answer: "Your application connects to the database over a connection (often a network connection, even if it's on the same machine) and sends it queries; the database process itself owns the data files and is responsible for storing, searching, and protecting them, independent of any one application process's lifecycle." },
      { question: "Why does a plain file struggle when two processes try to write to it at the same time, but a database generally doesn't?", answer: "A plain file has no built-in coordination — two simultaneous writes can interleave and corrupt the file's contents. A database manages concurrent access internally (locking, isolation) so simultaneous writers are handled safely instead of stepping on each other." },
      { question: "Is a database the same thing as a table?", answer: "No — a table is one organized structure for one kind of record (like `users`); a database is the overall system (and often a specific named collection of many related tables, like `users`, `orders`, and `products`) that stores and lets you query all of them together." },
      { question: "What's the practical risk of writing your own ad-hoc 'search' logic over a JSON file instead of reaching for a real database?", answer: "You end up slowly reimplementing what a database already does well — filtering, sorting, safe concurrent writes — but without years of engineering behind it, so it tends to be slower, more bug-prone, and harder to extend as new questions come up." },
      { question: "When would a plain file or an in-memory variable actually be the right choice over a database?", answer: "For a genuinely tiny, single-user, throwaway script — a quick calculation or a config file nobody else reads or writes concurrently — a database is unnecessary overhead; it earns its keep once data needs to persist, be shared, or be queried flexibly." },
    ],
    relatedTopics: ["tables-rows-columns", "basic-sql-queries"],
    keywords: ["database", "SQL", "data storage", "query"],
  },
  {
    id: "tables-rows-columns",
    title: "Tables, Rows & Columns",
    level: "beginner",
    description: "The basic grid shape — like a spreadsheet — that relational databases use to organize data.",
    explanation: `
Once you know a database stores organized data, the next question is:
organized *how*? In a **relational database**, data is organized into
**tables**, and each table looks a lot like a spreadsheet.

Each table has **columns**, which define what pieces of information are
tracked (like \`name\`, \`email\`, \`age\`) and what type of data each one
holds. Each table also has **rows**, where every row is one individual
record — one specific user, one specific order, one specific product.
Every row in a table has a value for every column (or is explicitly left
empty).

A table named \`users\` with columns \`id\`, \`name\`, and \`email\` might have
one row per actual person who signed up.
    `.trim(),
    analogy:
      "Think of a table like a class attendance sheet. The columns are the headers across the top — name, student ID, grade — and each row underneath is one specific student's information filled into those same columns.",
    examples: [
      {
        title: "A users table",
        code: `CREATE TABLE users (
  id INTEGER,
  name TEXT,
  email TEXT,
  age INTEGER
);`,
        language: "sql",
        explanation: "This defines the shape of the table: every row stored here will have exactly these four columns, each holding a specific kind of value.",
        walkthrough: [
          { code: "CREATE TABLE users (", explanation: "Starts the definition of a new table named users." },
          { code: "id INTEGER,", explanation: "A column named id that will always hold a whole number." },
          { code: "name TEXT,", explanation: "A column named name that will hold text." },
          { code: "email TEXT,", explanation: "A column named email, also text." },
          { code: "age INTEGER", explanation: "A column named age, another whole number." },
          { code: ");", explanation: "Closes the table definition." },
        ],
      },
      {
        title: "What the data actually looks like",
        code: `id | name    | email               | age
---+---------+---------------------+----
1  | Amara   | amara@example.com   | 29
2  | Kenji   | kenji@example.com   | 34
3  | Priya   | priya@example.com   | 41`,
        explanation: "Each row is one complete record, and every row lines up under the same set of columns defined by the table.",
      },
    ],
    howItWorks: `
When a table is created, you (or whoever designed the schema) decide its
columns up front: their names and the type of value each will hold (text,
integer, date, and so on). From then on, every row added to that table
must fit that same shape — one value per column, of the right type.

The database stores rows efficiently on disk and keeps track of the
table's structure (called its **schema**) so it always knows what a row
is supposed to look like.
    `.trim(),
    whyItExists: `
Giving every row in a table the exact same shape is what lets the
database reason about the data reliably — it always knows, for the
\`users\` table, that column 3 is an email and should be treated as text,
without checking each row individually. That consistency is also what
makes fast searching and predictable querying possible.
    `.trim(),
    whenToUse: `
Reach for the rows-and-columns model whenever your data is naturally
made of many similar records that share the same fields — users, orders,
products, log entries. That covers the vast majority of application
data.
    `.trim(),
    whenNotToUse: `
If your data is wildly irregular — every record has a completely
different, unpredictable set of fields — forcing it into fixed columns
can be awkward, and a more flexible, document-style structure (as used
in some NoSQL databases) may fit better.
    `.trim(),
    commonMistakes: [
      "Confusing a column with a row — a column is a field shared across all records, a row is one specific record.",
      "Trying to store multiple unrelated pieces of information crammed into a single column instead of splitting them into their own columns.",
      "Assuming every row must physically look identical in the raw file — the database, not the disk layout, guarantees the row shape.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Design the columns for a 'books' table in a personal library app. List each column name and what kind of value it holds." },
      { difficulty: "Medium", prompt: "Write out (as a small text table) three example rows that would fit your 'books' table from the previous exercise." },
      { difficulty: "Hard", prompt: "Explain why storing 'first name and last name' as one combined column is usually a worse design than two separate columns." },
    ],
    interviewQuestions: [
      { question: "What is the difference between a row and a column in a database table?", answer: "A column defines one field shared by every record in the table (like email); a row is one individual record with a value for each column." },
      { question: "What is a table's schema?", answer: "The definition of a table's structure — its columns, and the type of data each column holds." },
      { question: "Why does every row in a table need to follow the same set of columns?", answer: "So the database can reliably interpret and search every row the same way, which is what makes fast, predictable queries possible." },
      { question: "What does it mean for a column to hold `NULL`, versus an empty string or the number 0?", answer: "`NULL` means 'no value, unknown, or not applicable' — it is a distinct marker, not the same as an empty string (a real, zero-length text value) or 0 (a real number). Comparisons and calculations treat `NULL` specially instead of as 'nothing at all'." },
      { question: "Why would you mark a column `NOT NULL`?", answer: "So the database itself rejects any row that doesn't supply a real value for that column, guaranteeing every row always has an actual value there instead of relying on application code to remember to set it." },
      { question: "If a column has no `NOT NULL` constraint, what happens if an INSERT statement omits it?", answer: "The database stores `NULL` there (or the column's `DEFAULT` value, if one is defined) instead of raising an error." },
      { question: "What's the difference between a column's `DEFAULT` value and simply allowing `NULL`?", answer: "`DEFAULT` supplies a real, concrete value automatically when none is given, so the column still ends up holding actual data. Allowing `NULL` instead permits 'no value' to be stored explicitly. A column can have neither, either, or — less commonly — both configured." },
      { question: "Why is storing money as an integer number of cents safer than storing it as a floating-point number of dollars?", answer: "Binary floating-point numbers can't represent many decimal fractions exactly, so arithmetic like 0.10 + 0.20 can silently produce a value that isn't exactly 0.30. Integers avoid this entirely, since a whole number of cents has no fractional part to round incorrectly." },
      { question: "Why does declaring `age` as `INTEGER` instead of `TEXT` matter, beyond just being 'a number'?", answer: "It lets the database enforce that only valid numeric values are stored, compare and sort values numerically rather than character-by-character, and use numeric operations like `age + 1` directly without first converting anything." },
      { question: "What would go wrong if `age` were stored as `TEXT` instead of `INTEGER`?", answer: "Sorting and comparisons would happen character-by-character instead of numerically, so the text '9' would sort after '10' and '80' (because '1' comes before '9' as a character), and arithmetic like `age + 1` wouldn't reliably work without converting the value first." },
      { question: "What breaks if you cram multiple unrelated pieces of information into one column, like a single text value holding a name, age, and city together?", answer: "Nothing stops you at the database level since it's just text, but you lose the ability to filter, sort, or update any one piece of that information independently — every query needing just the age or just the city would first have to parse the combined value back apart." },
      { question: "Why is splitting 'first name' and 'last name' into two separate columns usually better than one combined column?", answer: "It lets you sort, search, and format by either part independently — for example, alphabetizing by last name — without parsing a combined string every time, which gets error-prone with names that have multiple parts, prefixes, or suffixes." },
      { question: "Can you add a new column to a table that already has rows in it? What happens to those existing rows for the new column?", answer: "Yes, using `ALTER TABLE ... ADD COLUMN`. Existing rows get `NULL` (or the column's `DEFAULT` value, if one is specified) in the new column, since there's no way to know retroactively what value they should have had." },
      { question: "Why can't two rows in the same table have a different set of columns?", answer: "Because the table's schema fixes the set of columns once for the whole table — every row is a record in that structure, so the database, and every query written against it, can rely on a given column always meaning the same thing for every row." },
      { question: "What's a practical downside of making too many columns on a table nullable 'just in case'?", answer: "It becomes ambiguous whether a `NULL` means 'this genuinely doesn't apply' or 'nobody ever set this,' and every query touching that column has to account for `NULL` possibly showing up, adding complexity and bugs throughout the application." },
      { question: "Give an example where `NULL` in a column is the correct design choice rather than a mistake.", answer: "A `middle_name` column being `NULL` for someone with no middle name is legitimate — it genuinely doesn't apply — unlike, say, an `email` column marked `NOT NULL` being left empty by accident, which should never be allowed to happen." },
      { question: "Does `WHERE middle_name = ''` match rows where `middle_name` was never set (is `NULL`)?", answer: "No. An empty string is a real, zero-length value and is not equal to `NULL` — a row where `middle_name` is `NULL` won't match `= ''`, and in fact it wouldn't match `= NULL` either; finding it requires `IS NULL`." },
      { question: "What does it mean that a table's schema is decided 'up front,' and who typically decides it?", answer: "Before any data is inserted, whoever designs the table chooses its columns, names, and types via `CREATE TABLE`. From then on every row added must conform to that shape, though the schema can still be changed later with commands like `ALTER TABLE`." },
      { question: "Why might a flexible, document-style structure fit better than fixed columns for some data?", answer: "When records are naturally irregular — each one might have a completely different, unpredictable set of fields — forcing them all into the same fixed columns leads to lots of unused `NULL` columns or awkward workarounds; a document model lets each record carry only the fields it actually needs." },
      { question: "In `CREATE TABLE users (id INTEGER, name TEXT, email TEXT, age INTEGER);`, does the order the columns are declared in matter for storing or querying data?", answer: "Not semantically — every clause (`SELECT`, `WHERE`, `SET`, and so on) can refer to columns by name, so declaration order is mostly a readability choice. It does matter, though, for statements like `INSERT ... VALUES` that supply values positionally with no explicit column list." },
      { question: "Are `age = NULL` and `age = 0` the same thing for a row?", answer: "No. `0` is an actual, known value — the age is genuinely zero — while `NULL` means the age is unknown or was never recorded. Treating them as interchangeable would incorrectly imply you know something you don't." },
      { question: "Why does the database, rather than the raw disk layout, guarantee that every row matches the declared columns?", answer: "Rows are stored internally however the engine finds efficient — variable-length encoding, compression, and other storage tricks — so no two rows need to occupy identical physical bytes. The guarantee that every row conceptually has a value for every column comes from the schema the engine enforces, not from the file layout." },
      { question: "What's the risk of designing a `tags` column that holds a comma-separated list of values?", answer: "You can't easily filter for 'rows containing tag X' with a simple, index-friendly condition, can't guarantee uniqueness or consistent formatting within the string, and any query working with individual tags first has to split the string apart — a related table (or an array/JSON type, if supported) is a better fit." },
      { question: "Why does storing a date in a proper `DATE` or `TIMESTAMP` type matter, rather than storing it as `TEXT`?", answer: "A real date type lets the database validate that the value is an actual calendar date, compare and range-filter dates correctly regardless of formatting, and use date-specific operations like extracting the year. With a plain `TEXT` column, correctness depends entirely on consistent formatting, and nothing stops an invalid value like '13/45/2026' from being stored." },
      { question: "Does every database have a native `BOOLEAN` type?", answer: "No — some databases, like SQLite, have no distinct boolean storage type and represent true/false as the integers 1 and 0 instead. The value still behaves like a boolean in queries, but the underlying representation can differ by database." },
      { question: "What is a `CHECK` constraint, and how does it relate to schema design?", answer: "A rule attached to a column or table that the database enforces on every insert or update, beyond just type and nullability — for example, `CHECK (age >= 0)` rejects any row that would set a negative age, letting a basic business rule live in the schema itself instead of relying on every piece of application code to remember to validate it." },
    ],
    prerequisites: ["what-is-a-database"],
    relatedTopics: ["what-is-a-database", "primary-and-foreign-keys", "basic-sql-queries"],
    keywords: ["table", "row", "column", "schema", "relational database"],
  },
  {
    id: "primary-and-foreign-keys",
    title: "Primary Keys & Foreign Keys",
    level: "beginner",
    description: "How a database uniquely identifies one specific row, and how rows in different tables point to each other.",
    explanation: `
If a table has two customers both named "Sam Lee," how does the database
tell them apart? It needs some column whose value is guaranteed to be
unique for every single row — no two rows ever share it. That column is
the table's **primary key**, most commonly an auto-generated \`id\` number.

Once every row can be uniquely identified, tables can *reference* each
other. Say an \`orders\` table needs to record which user placed each
order. Instead of copying that user's whole name and email into every
order row, the \`orders\` table just stores the user's \`id\` in a column
like \`user_id\`. That column is called a **foreign key** — it "points to"
a primary key in another table, linking the two rows together without
duplicating data.
    `.trim(),
    analogy:
      "A primary key is like a person's unique student ID number — no two students share one, even if their names are identical. A foreign key is like writing that student ID on a library book's checkout card instead of writing out the student's full name and address every time — it just points back to the one record that already has all the details.",
    examples: [
      {
        title: "A primary key",
        code: `CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  email TEXT
);`,
        language: "sql",
        explanation: "Marking id as the PRIMARY KEY tells the database this column uniquely identifies each row, and it will enforce that no two rows share the same id.",
        walkthrough: [
          { code: "CREATE TABLE users (", explanation: "Begins the users table definition." },
          { code: "id INTEGER PRIMARY KEY,", explanation: "This column uniquely identifies each row; the database rejects any attempt to insert a duplicate id." },
          { code: "name TEXT,", explanation: "A regular column, not required to be unique." },
          { code: "email TEXT", explanation: "Another regular column." },
          { code: ");", explanation: "Closes the definition." },
        ],
      },
      {
        title: "A foreign key linking two tables",
        code: `CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total_cents INTEGER
);

-- orders table:
-- id | user_id | total_cents
-- 1  | 2       | 4599
-- 2  | 2       | 1200
-- 3  | 3       | 800`,
        language: "sql",
        explanation: "Each order row stores just the id of the user who placed it. Orders 1 and 2 both belong to the user with id 2, without repeating that user's name or email in every row.",
      },
    ],
    howItWorks: `
A primary key is enforced by the database itself: it refuses to let you
insert (or update) a row that would create a duplicate value in that
column. Most tables use a simple auto-incrementing integer id for this,
since it's guaranteed unique and never changes.

A foreign key is just a regular column whose values are expected to
match a primary key value in another table. Many databases can enforce
this too — refusing to insert an order with a user_id that doesn't
actually exist in the users table — which keeps the two tables
consistent with each other.
    `.trim(),
    whyItExists: `
Without a reliable way to uniquely identify a row, you couldn't safely
update or delete "this one specific record" — you'd risk accidentally
matching several rows that look similar. And without foreign keys,
you'd be forced to copy full details (name, email, address) into every
related table, which wastes space and creates a mess the moment any of
that copied data changes.
    `.trim(),
    whenToUse: `
Give every table a primary key, essentially always — it's the foundation
for updating, deleting, and linking specific rows. Use a foreign key any
time one table's rows naturally "belong to" or reference a row in
another table, like an order belonging to a user.
    `.trim(),
    whenNotToUse: `
There's rarely a reason to skip a primary key on a real table. Foreign
keys can be left out for small, throwaway, or purely denormalized
datasets where you've deliberately decided the tables don't need to stay
in sync with each other.
    `.trim(),
    commonMistakes: [
      "Using a naturally occurring value like an email address as the primary key, then having it break when a user changes their email.",
      "Forgetting to add a foreign key column, and instead duplicating a related row's full details everywhere it's needed.",
      "Assuming a foreign key column automatically keeps data in sync on its own — it only links rows; your queries still have to join them together to see combined data.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain why an auto-incrementing id is usually a better primary key choice than a person's name." },
      { difficulty: "Medium", prompt: "Design a 'comments' table that belongs to both a 'posts' table and a 'users' table (who wrote the comment, and on which post). Name the foreign key columns you'd add." },
      { difficulty: "Hard", prompt: "Describe what could go wrong in your database if you inserted a comment with a user_id that doesn't correspond to any real user." },
    ],
    interviewQuestions: [
      { question: "What is a primary key?", answer: "A column (or set of columns) whose value uniquely identifies each row in a table, enforced by the database to never have duplicates." },
      { question: "What is a foreign key?", answer: "A column in one table that stores the primary key value of a row in another table, creating a link between the two without duplicating data." },
      { question: "Why use a generated id instead of a real-world value like an email as a primary key?", answer: "Real-world values can change over time (like an email being updated), which breaks anything referencing it; a generated id never changes." },
      { question: "What is a composite primary key?", answer: "A primary key made of more than one column together, where the combination of values must be unique across rows even though no single column alone is. For example, an `order_items` table could use `(order_id, product_id)` as its primary key, so one specific product can appear only once per order." },
      { question: "When would you reach for a composite primary key instead of a single auto-incrementing id column?", answer: "When a row is naturally and entirely defined by the combination of two or more foreign keys and nothing else needs to identify it — the classic case is a join table linking two other tables, like `order_items` linking `orders` and `products`, where 'this order plus this product' is inherently what the row represents." },
      { question: "Must a foreign key always reference the other table's primary key specifically?", answer: "No — a foreign key can reference any column in the other table that's guaranteed unique (typically enforced with a `UNIQUE` constraint), though referencing the primary key is by far the most common and simplest case." },
      { question: "What is referential integrity, in plain terms?", answer: "The guarantee that every foreign key value in a table corresponds to a real, existing row in the table it references — no order can point at a `user_id` that doesn't exist, keeping related tables consistent with each other." },
      { question: "If a foreign key constraint is enforced, what happens when you try to insert a row whose foreign key value doesn't exist in the referenced table?", answer: "The database rejects the insert with a constraint violation error, rather than silently storing a row that points at a nonexistent record." },
      { question: "What does `ON DELETE CASCADE` do on a foreign key?", answer: "When the referenced row (say, a user) is deleted, the database automatically deletes every row that references it (that user's orders) as well, instead of leaving them pointing at nothing." },
      { question: "What does `ON DELETE SET NULL` do, and what does it require of the foreign key column?", answer: "When the referenced row is deleted, referencing rows have their foreign key column set to `NULL` instead of being deleted themselves. This requires the foreign key column to allow `NULL`, since that's the value it will be set to." },
      { question: "What does `ON DELETE RESTRICT` (or the default `NO ACTION` in many databases) do?", answer: "It blocks the delete entirely — the database refuses to delete the referenced row as long as any other row still references it, forcing you to deal with those references first." },
      { question: "Running `DELETE FROM users WHERE id = 1;` fails with a foreign key constraint violation. What's the most likely cause?", answer: "Some row in another table (like `orders`) still has a foreign key pointing at that user, and the foreign key's delete behavior is `RESTRICT`/`NO ACTION` (a common default) rather than `CASCADE` or `SET NULL`, so the database refuses to leave that reference dangling." },
      { question: "Between `ON DELETE CASCADE` and `ON DELETE RESTRICT`, which is generally the safer default, and why?", answer: "`RESTRICT` is generally safer as a default because it forces a deliberate decision about what to do with dependent rows, rather than silently deleting a potentially large, unintended chain of related data. `CASCADE` is powerful but can remove far more than expected if the relationship chain is deep." },
      { question: "Can a primary key column contain `NULL`?", answer: "No. A primary key implies both uniqueness and `NOT NULL` — a `NULL` value couldn't reliably identify a specific row, and `NULL` isn't even considered equal to another `NULL`, so databases disallow it in primary key columns." },
      { question: "Can a foreign key column contain `NULL`, and what does that mean?", answer: "Yes, as long as the column isn't also marked `NOT NULL`. A `NULL` foreign key typically means 'this row doesn't currently reference anything' — for example, an order with no assigned sales rep — representing an optional relationship rather than a broken one." },
      { question: "What is the difference between a natural key and a surrogate key?", answer: "A natural key is a real-world attribute that's already unique to the row, like a national ID number or an email address. A surrogate key is an artificial value the database generates purely to identify the row, like an auto-incrementing id, with no meaning outside the database." },
      { question: "What's a downside of using a natural key like an email as a primary key, beyond the fact that emails can change?", answer: "Natural keys are often longer or more complex than a simple integer, which makes them slower to index and join on, and using them elsewhere as foreign keys propagates that same complexity into every referencing table." },
      { question: "Can a table have more than one column, or combination of columns, that could each serve as a unique identifier? What are those called?", answer: "Yes — any column or combination that's unique is a candidate key. A table picks exactly one candidate key to be its actual primary key, but other candidate keys can still be enforced with `UNIQUE` constraints." },
      { question: "What's the difference between a `UNIQUE` constraint and a `PRIMARY KEY` constraint?", answer: "Both enforce uniqueness, but a table can have only one primary key while it can have several `UNIQUE` constraints on different columns. A `UNIQUE` column, unlike a primary key, is generally still allowed to contain `NULL` (commonly even more than one, in most databases, since `NULL` is never considered equal to another `NULL`)." },
      { question: "What happens if you try to insert a row whose primary key value already exists in the table?", answer: "The database rejects the insert with a uniqueness violation error — it never silently overwrites or duplicates an existing row." },
      { question: "Design a `comments` table that belongs to both a `posts` table and a `users` table. What foreign key columns would it need?", answer: "Two foreign key columns — `post_id INTEGER REFERENCES posts(id)` for which post the comment is on, and `user_id INTEGER REFERENCES users(id)` for who wrote it — alongside its own primary key, `id`." },
      { question: "What is a self-referencing foreign key? Give an example.", answer: "A foreign key column in a table that references the primary key of that same table — for example, an `employees` table with `manager_id INTEGER REFERENCES employees(id)`, where a manager is just another row in the same table." },
      { question: "Given `orders(id PK, user_id FK -> users.id ON DELETE CASCADE)`, what happens to a user's orders if that user's row is deleted?", answer: "Every order whose `user_id` points at that user is automatically deleted along with it, because of the `ON DELETE CASCADE` behavior." },
      { question: "Given `orders(id PK, assigned_rep_id FK -> employees.id ON DELETE SET NULL)`, what happens to an order if the employee assigned to it is deleted?", answer: "The order row isn't deleted — its `assigned_rep_id` column is automatically set to `NULL`, leaving the order in place but now unassigned." },
      { question: "Does adding a foreign key column automatically combine that table's data with the referenced table's data in query results?", answer: "No — a foreign key only creates, and optionally enforces, the link between rows. Actually seeing combined data from both tables in one result set still requires writing an explicit `JOIN`." },
      { question: "Why does inserting an order with a `user_id` that doesn't correspond to any real user cause problems, even without an actively enforced foreign key constraint?", answer: "Any later query that joins orders to users to show who placed the order finds nothing for that row, reports can silently undercount or drop it, and there's no way to tell later whether it's a data entry mistake or an intentionally orphaned record — referential integrity exists precisely to prevent this ambiguity." },
      { question: "In a composite primary key like `(order_id, product_id)`, does the order the two columns are listed in change what's enforced?", answer: "The uniqueness guarantee itself doesn't depend on the listed order — the combination is what must be unique either way — though the column order can affect which queries make efficient use of the underlying index built to enforce it." },
      { question: "Is it valid, from the database's point of view, to create a table with no primary key at all?", answer: "Yes, most databases allow it, but it's rarely a good idea — without a primary key there's no guaranteed way to reliably target, update, or delete one specific row, and other tables can't establish clean foreign key relationships to it." },
      { question: "What's the practical difference between a column that's `NOT NULL` and `UNIQUE` versus that same column being declared `PRIMARY KEY`?", answer: "Functionally, `NOT NULL` plus `UNIQUE` enforces the same two things a primary key does. The difference is that a table can have only one primary key, signaling the main identifier other tables should reference, while it can have multiple independent `NOT NULL` and `UNIQUE` columns alongside it." },
      { question: "If `orders` has `ON DELETE CASCADE` back to `users`, and `order_items` has `ON DELETE CASCADE` back to `orders`, what happens when a single user row is deleted?", answer: "Deleting the user cascades to delete all of that user's orders, and each of those deletions in turn cascades to delete all of that order's order_items — a single delete can ripple through multiple linked tables when `CASCADE` is chained across relationships, which is exactly why `RESTRICT` is often preferred as a default." },
    ],
    prerequisites: ["tables-rows-columns"],
    relatedTopics: ["tables-rows-columns", "basic-sql-queries", "joins", "normalization"],
    keywords: ["primary key", "foreign key", "unique identifier", "relationships"],
  },
  {
    id: "basic-sql-queries",
    title: "Basic SQL Queries",
    level: "beginner",
    description: "The four core commands — SELECT, INSERT, UPDATE, DELETE — used to read and change data in a database.",
    explanation: `
Once data lives in tables, you need a way to actually read it and change
it. **SQL** (Structured Query Language) is the language almost every
relational database understands, and it's built around four core
operations, often remembered by the acronym **CRUD** (Create, Read,
Update, Delete):

- \`SELECT\` — read existing rows
- \`INSERT\` — add a new row
- \`UPDATE\` — change values in existing rows
- \`DELETE\` — remove rows

These four commands, combined with ways to filter which rows they apply
to, cover the overwhelming majority of everyday database work.
    `.trim(),
    analogy:
      "Think of a table as a shared notebook. SELECT is reading a page without touching it. INSERT is writing a brand-new entry on a fresh line. UPDATE is crossing out part of an existing entry and writing a correction. DELETE is tearing an entry out entirely.",
    examples: [
      {
        title: "All four operations on a users table",
        code: `-- Read every user
SELECT * FROM users;

-- Add a new user
INSERT INTO users (name, email) VALUES ('Amara', 'amara@example.com');

-- Change an existing user's email
UPDATE users SET email = 'amara@newmail.com' WHERE id = 1;

-- Remove a user
DELETE FROM users WHERE id = 1;`,
        language: "sql",
        explanation: "Each statement is a complete command on its own — SQL statements are typically written one operation at a time, ending in a semicolon.",
        walkthrough: [
          { code: "SELECT * FROM users;", explanation: "Asks for every column of every row in the users table. The * means 'all columns'." },
          { code: "INSERT INTO users (name, email) VALUES ('Amara', 'amara@example.com');", explanation: "Adds one new row, setting the name and email columns to the given values." },
          { code: "UPDATE users SET email = 'amara@newmail.com' WHERE id = 1;", explanation: "Finds the row where id equals 1, and changes only its email column." },
          { code: "DELETE FROM users WHERE id = 1;", explanation: "Removes the row where id equals 1 entirely." },
        ],
      },
      {
        title: "Selecting specific columns",
        code: `SELECT name, email FROM users;

UPDATE users SET age = age + 1 WHERE id = 3;`,
        language: "sql",
        explanation: "SELECT doesn't have to grab every column — you can list exactly the ones you need. UPDATE can also compute a new value based on the current one, like incrementing age by 1.",
      },
    ],
    howItWorks: `
When you send a SQL statement to the database, it gets parsed and turned
into a plan for how to carry it out: which table to touch, which rows
match any given condition, and what to do with them. \`SELECT\` never
changes data — it only reads and returns it. \`INSERT\`, \`UPDATE\`, and
\`DELETE\` all modify the table's actual contents, and each one, without a
\`WHERE\` clause narrowing things down, applies to *every* row in the
table — which is why forgetting a WHERE clause on UPDATE or DELETE is one
of the most dangerous mistakes in SQL.
    `.trim(),
    whyItExists: `
SQL exists so that reading and changing data doesn't require custom
code for every situation. Instead of writing a program to loop through
files searching for matches, you describe *what* you want ("all users
older than 30") and the database figures out *how* to get it, using one
shared, standardized language across virtually every relational
database.
    `.trim(),
    whenToUse: `
Use SELECT any time you need to read data. Use INSERT when new data is
created (a new signup, a new order). Use UPDATE when existing data
changes (an address update, a status change). Use DELETE when data
should be permanently removed.
    `.trim(),
    whenNotToUse: `
For truly bulk, one-time data loads (millions of rows at once) many
databases offer faster specialized bulk-loading tools instead of
individual INSERT statements. And for data you might need to recover
later, consider a "soft delete" (marking a row as inactive) instead of
an actual DELETE.
    `.trim(),
    commonMistakes: [
      "Running an UPDATE or DELETE without a WHERE clause, which applies the change to every single row in the table.",
      "Forgetting that SELECT * pulls every column, even ones you don't need, which wastes bandwidth on large tables.",
      "Assuming INSERT requires listing every column — columns with defaults or that allow empty values can often be omitted.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a SELECT statement that retrieves the name and email of every row in a users table." },
      { difficulty: "Medium", prompt: "Write an INSERT statement adding a new product with a name and a price to a products table, and an UPDATE statement that changes that product's price." },
      { difficulty: "Hard", prompt: "Explain, step by step, what would happen if you ran `DELETE FROM users;` with no WHERE clause, and why that's dangerous." },
    ],
    interviewQuestions: [
      { question: "What do the four basic SQL commands SELECT, INSERT, UPDATE, and DELETE each do?", answer: "SELECT reads rows, INSERT adds a new row, UPDATE modifies values in existing rows, and DELETE removes rows." },
      { question: "What happens if you run an UPDATE statement with no WHERE clause?", answer: "It applies the change to every row in the table, not just one — which is a common and dangerous mistake." },
      { question: "Does SELECT ever modify the underlying data?", answer: "No — SELECT only reads and returns data; it never changes what's stored." },
      { question: "How do you insert multiple new rows using a single INSERT statement?", answer: "List multiple parenthesized value groups after `VALUES`, separated by commas — for example, `INSERT INTO products (name, price_cents) VALUES ('Pen', 150), ('Notebook', 300), ('Eraser', 50);` inserts three rows in one statement." },
      { question: "Why is a single multi-row INSERT generally more efficient than the same number of single-row INSERT statements?", answer: "It sends and parses one statement instead of many, letting the database batch the work internally — fewer round trips between application and database, and often fewer repeated internal bookkeeping steps like index updates — which matters a lot when inserting many rows." },
      { question: "What does adding `RETURNING *` (or specific columns) to an INSERT statement do?", answer: "It hands back the actual row as it ended up stored — including any values the database generated itself, like an auto-incremented id or a default timestamp — in the same round trip as the insert, without a separate SELECT afterward." },
      { question: "Why is RETURNING especially useful after an INSERT that relies on an auto-generated primary key?", answer: "The application doesn't know that generated id ahead of time. Without RETURNING, a second query would be needed to look the new row back up, and you'd need some other unique detail to find it by; RETURNING hands the id back immediately as part of the insert itself." },
      { question: "Is RETURNING part of every SQL database's basic dialect?", answer: "No — support for it varies by database. Whether, and how, RETURNING is available depends on which specific database you're using, so it's worth checking that database's own documentation rather than assuming it works identically everywhere." },
      { question: "Can RETURNING be used with UPDATE and DELETE statements too, not just INSERT?", answer: "Where supported, yes — an UPDATE with RETURNING hands back a row's new values after the change, and a DELETE with RETURNING hands back the values of the row as they were right before it was removed." },
      { question: "Running `INSERT INTO users (name) VALUES ('Amara');` fails, and `email` is declared NOT NULL with no default. Why?", answer: "Omitting a column from an INSERT's column list is only allowed if that column has a DEFAULT value or otherwise permits NULL. Neither is true for email here, so the database refuses to leave it without a value and rejects the insert." },
      { question: "If you supply an explicit column list in an INSERT, like `INSERT INTO users (email, name) VALUES ('a@x.com', 'Amara');`, does the order of those columns need to match the table's declared column order?", answer: "No — when you supply an explicit column list, each value is matched to a column by position within that list, not the table's original declared order, so listing email before name works fine even if the table itself declares name first. Omitting the column list entirely, though, does require the VALUES to line up with the table's actual declared column order." },
      { question: "What's the difference between `UPDATE products SET price_cents = 500` and `UPDATE products SET price_cents = price_cents + 100`?", answer: "The first sets every matching row's price_cents to the exact same fixed value, 500. The second computes a new value relative to each row's current value, adding 100 to whatever it already was, so different rows end up with different results depending on their starting price." },
      { question: "If an UPDATE or DELETE's WHERE clause matches zero rows, is that an error?", answer: "No — the statement completes successfully having changed zero rows. Most databases report back a rows-affected count of 0 rather than raising an error, since matching no rows isn't inherently invalid." },
      { question: "What's the difference between `DELETE FROM orders;` with no WHERE and `TRUNCATE TABLE orders;`?", answer: "Both remove every row, but DELETE removes rows one at a time as a filterable operation (and can be given a WHERE clause), while TRUNCATE is a more specialized operation that resets the whole table at once — often faster, but it can't be limited with a WHERE clause and can interact differently with things like auto-increment counters depending on the database." },
      { question: "Can a SELECT return a computed value that isn't stored as an actual column?", answer: "Yes — SELECT can include expressions, not just raw column names. `SELECT price_cents * quantity AS line_total FROM order_items;` computes a new value per row on the fly and labels it with the alias line_total." },
      { question: "What does `AS` do in a statement like `SELECT price_cents * quantity AS line_total`?", answer: "It gives a computed expression, or even a plain column, an alias — a name to use for that value in the returned results — which is especially useful for expressions that wouldn't otherwise have a meaningful column name." },
      { question: "What's the difference between `INSERT INTO ... VALUES (...)` and `INSERT INTO ... SELECT ...`?", answer: "VALUES inserts one or more literal rows written out directly. INSERT INTO ... SELECT instead inserts whatever rows a SELECT query produces, which is useful for copying or transforming data already in the database into another table without pulling it out to the application first." },
      { question: "If a multi-row INSERT includes one row that violates a constraint, like a duplicate primary key, what typically happens to the other, valid rows in that statement?", answer: "In most databases the entire statement fails and none of the rows are inserted — the statement is treated as one atomic operation, not independent per-row inserts, so a single bad row rolls the whole batch back rather than leaving partial results." },
      { question: "Could `UPDATE users SET status = 'active' WHERE last_login > '2026-01-01';` ever match more than one row?", answer: "Yes, easily. WHERE only guarantees a single row when filtering on a column known to be unique, like a primary key. Filtering on a non-unique column like last_login can match any number of rows, all of which get updated." },
      { question: "After running an UPDATE or DELETE, how do you find out how many rows were actually affected?", answer: "Most database drivers or clients report a rows-affected count alongside the statement's result. Checking that count is a common way to confirm a targeted UPDATE or DELETE actually hit the row you expected, rather than silently matching zero." },
      { question: "Why might using `SELECT *` in application code be riskier than listing exact column names?", answer: "If the table's columns change later — one added, removed, or reordered — code relying on SELECT * can silently start receiving different data than expected. Naming exact columns keeps the query's contract stable regardless of later schema changes, and avoids fetching data the application doesn't need." },
      { question: "Is `WHERE id = 1` guaranteed to behave the same as `WHERE id = '1'` if id is an INTEGER column?", answer: "Many databases implicitly convert the string '1' to compare it against the integer column and still match, but relying on that conversion is poor practice — some databases are stricter about it, and it can silently defeat index usage in others — so it's better to match the literal's type to the column's declared type." },
      { question: "Explain what happens, step by step, if you run `DELETE FROM users;` with no WHERE clause.", answer: "The database interprets having no WHERE clause as no filter at all, so it deletes every single row currently in the users table, not just one or a few, with no built-in way to select 'the one I meant' afterward — which is why this is one of the most dangerous mistakes possible in SQL." },
      { question: "You want to update a row and immediately see its new value, like an updated_at timestamp the database sets automatically. What's the advantage of `UPDATE ... RETURNING updated_at` over a separate SELECT afterward?", answer: "RETURNING gets you the row's actual post-update value in the same round trip and same atomic operation. A separate follow-up SELECT is an extra query, and in theory another process could change or delete the row in the gap between the two, so RETURNING avoids that race entirely." },
      { question: "Write a single statement that inserts three new products, each with a name and price_cents.", answer: "`INSERT INTO products (name, price_cents) VALUES ('Pen', 150), ('Notebook', 300), ('Folder', 220);` — one INSERT, three comma-separated value groups, all committed together." },
      { question: "Why do INSERT, UPDATE, and DELETE each count as a single atomic operation, even when they affect many rows at once?", answer: "The database guarantees either the entire statement's effect on every matching row takes hold, or none of it does. There's no in-between state where only some of the intended rows changed and the statement failed partway, which is what makes a rows-affected count of 0 or the full expected count a safe way to reason about a statement's outcome." },
      { question: "A developer runs `UPDATE orders SET status = 'shipped' WHERE order_date = '2026-01-01';` intending to update one specific order, but several rows change. What went wrong?", answer: "They filtered on order_date, a column that isn't guaranteed unique — multiple orders can share the same date — so WHERE matched every order placed that day instead of the single one intended. Filtering by a unique identifier like the order's id would have targeted exactly one row." },
    ],
    prerequisites: ["tables-rows-columns"],
    relatedTopics: ["tables-rows-columns", "filtering-and-sorting", "transactions-and-acid"],
    keywords: ["SQL", "SELECT", "INSERT", "UPDATE", "DELETE", "CRUD"],
  },
  {
    id: "filtering-and-sorting",
    title: "Filtering & Sorting",
    level: "beginner",
    description: "Narrowing a query down to the rows you actually want with WHERE, and controlling the order results come back in with ORDER BY.",
    explanation: `
\`SELECT * FROM orders\` gives you every single order — but most of the
time you want something more specific: only orders from this month,
only the five most expensive ones, only users whose name starts with
"A." That's what filtering and sorting are for.

The \`WHERE\` clause narrows a query down to only the rows that match a
condition you specify. The \`ORDER BY\` clause controls what order the
matching rows come back in — ascending or descending, by any column you
choose. They're often used together: filter down to the rows you care
about, then sort them in a useful order.
    `.trim(),
    analogy:
      "WHERE is like sifting a basket of laundry down to just the socks. ORDER BY is then lining those socks up from smallest to biggest before you look at them. You can do either alone, or both together.",
    examples: [
      {
        title: "Filtering with WHERE",
        code: `SELECT name, total_cents
FROM orders
WHERE total_cents > 5000;`,
        language: "sql",
        explanation: "Only returns orders whose total is more than 5000 cents ($50) — every other row is left out entirely.",
        walkthrough: [
          { code: "SELECT name, total_cents", explanation: "Choose which columns to return." },
          { code: "FROM orders", explanation: "Choose which table to read from." },
          { code: "WHERE total_cents > 5000;", explanation: "Keep only the rows where this condition is true; every non-matching row is excluded from the results." },
        ],
      },
      {
        title: "Combining filtering, sorting, and limiting",
        code: `SELECT name, total_cents
FROM orders
WHERE total_cents > 5000
ORDER BY total_cents DESC
LIMIT 3;`,
        language: "sql",
        explanation: "Finds orders over $50, sorts the matching ones from highest total to lowest (DESC means descending), then keeps only the top 3.",
      },
    ],
    howItWorks: `
The database evaluates the \`WHERE\` condition against every row's actual
values, keeping only the rows where it comes out true. Conditions can be
combined with \`AND\` and \`OR\` for more complex logic. \`ORDER BY\` then
takes the surviving rows and sorts them by one or more columns —
\`ASC\` (ascending, the default) or \`DESC\` (descending). \`LIMIT\` can cap
how many of the sorted results actually get returned.

Under the hood, without help from an index (a topic on its own), the
database typically has to look at every row in the table to check the
WHERE condition — how that lookup can be sped up is exactly what indexes
are for.
    `.trim(),
    whyItExists: `
Real applications almost never want "everything, in whatever order the
database happens to store it in." Filtering and sorting exist so that
the database itself can do the narrowing and ordering work, instead of
your application code fetching every row and doing that filtering and
sorting itself in memory — which would be both slower and far more code
to write.
    `.trim(),
    whenToUse: `
Use WHERE any time you only want a subset of a table's rows. Use ORDER
BY whenever the order results are presented in matters — recent-first
activity feeds, cheapest-first product listings, alphabetical name
lists.
    `.trim(),
    whenNotToUse: `
If you genuinely need every row and the order truly doesn't matter (for
instance, feeding all rows into a batch job that processes them in any
order), skipping WHERE and ORDER BY avoids unnecessary work for the
database.
    `.trim(),
    commonMistakes: [
      "Forgetting that ORDER BY without DESC defaults to ascending order, which can look 'backwards' for things like dates when you want most-recent-first.",
      "Filtering in application code after fetching all rows, instead of letting WHERE do it inside the database — much slower on large tables.",
      "Assuming rows come back in a particular order automatically — without ORDER BY, the order isn't guaranteed at all.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a query that selects all products from a products table with a price less than 20." },
      { difficulty: "Medium", prompt: "Write a query that returns the 5 most recently created rows from an orders table, assuming it has a created_at column." },
      { difficulty: "Hard", prompt: "Write a query combining WHERE and ORDER BY to find the 3 cheapest in-stock products, assuming a products table with price and in_stock columns." },
    ],
    interviewQuestions: [
      { question: "What does the WHERE clause do?", answer: "It filters which rows a query applies to, keeping only rows where the given condition evaluates to true." },
      { question: "What does ORDER BY control, and what's the default direction?", answer: "It controls the order results are returned in, by one or more columns; the default direction is ascending (ASC) unless DESC is specified." },
      { question: "If you don't use ORDER BY, is the order of returned rows guaranteed?", answer: "No — without an explicit ORDER BY, the database doesn't guarantee any particular row order." },
      { question: "What does `WHERE age = NULL` actually do, and why doesn't it match rows where age is NULL?", answer: "It matches nothing, ever. Comparing anything to NULL with `=` (or any comparison operator) doesn't evaluate to true or false — it evaluates to unknown, because NULL represents an unknown value and you can't know whether an unknown value equals anything. Finding NULL rows requires `WHERE age IS NULL` instead." },
      { question: "What are the three possible outcomes of evaluating a WHERE condition?", answer: "True, false, and unknown — unknown is typically produced whenever NULL is involved in a comparison. WHERE only keeps rows where the condition evaluates to true; both false and unknown rows are excluded from the results." },
      { question: "Given a table where some rows have age as NULL, what does `WHERE age > 20` return for those rows, and what about `WHERE NOT (age > 20)`?", answer: "Neither includes them. `age > 20` evaluates to unknown for a NULL age, not false, and negating unknown with NOT still produces unknown, not true. Both queries silently exclude those rows rather than treating an unknown age as passing either check." },
      { question: "Why is `WHERE column <> 5` on a column containing some NULL values likely to exclude more rows than expected?", answer: "Rows where that column is NULL don't satisfy `<>` any more than they'd satisfy `=` — comparing NULL with anything yields unknown, not true — so NULL rows are silently dropped from both an equals-5 and a not-equals-5 result, even though intuitively a 'not equals' filter might seem like it should catch them." },
      { question: "What's a dangerous trap with `WHERE column NOT IN (list)` if that list can contain a NULL value?", answer: "If even one element of the IN list is NULL, NOT IN can end up matching zero rows at all for the entire query. NOT IN is effectively a chain of `<>` comparisons ANDed together, and comparing against NULL produces unknown for that one comparison, which poisons the whole chain to unknown — excluded — rather than true." },
      { question: "Does AND bind more tightly than OR in a WHERE clause, and why does that matter?", answer: "Yes. AND is evaluated before OR when there are no parentheses, so `WHERE a = 1 OR b = 2 AND c = 3` is actually interpreted as `WHERE a = 1 OR (b = 2 AND c = 3)`, not `WHERE (a = 1 OR b = 2) AND c = 3`. Relying on this precedence instead of writing explicit parentheses is an easy way to introduce a subtly wrong filter." },
      { question: "Is the range in `WHERE price BETWEEN 10 AND 20` inclusive or exclusive of 10 and 20?", answer: "Inclusive on both ends — BETWEEN is equivalent to `price >= 10 AND price <= 20`, so rows with price exactly 10 or exactly 20 are included." },
      { question: "What do `%` and `_` mean inside a LIKE pattern?", answer: "`%` matches any sequence of zero or more characters, and `_` matches exactly one character, so `LIKE 'A%'` matches anything starting with A, while `LIKE 'A_'` matches exactly two characters starting with A." },
      { question: "Is LIKE guaranteed to be case-sensitive?", answer: "Not universally — it depends on the specific database and sometimes the column's collation. For example, PostgreSQL's LIKE is case-sensitive by default (with a separate case-insensitive ILIKE), while some other databases are case-insensitive by default for standard text, so this shouldn't be assumed to behave the same everywhere." },
      { question: "When ordering by two columns, like `ORDER BY last_name ASC, age DESC`, how does the second column affect the sort?", answer: "Rows are primarily sorted by last_name ascending. Only when two or more rows share the same last_name does age descending get used to break that tie — the second column never overrides the first, it only resolves ties within it." },
      { question: "Given the rows Kenji/34, Amara/29, and Amara/41, what order does `ORDER BY name ASC, age DESC` return them in?", answer: "Amara/41, then Amara/29, then Kenji/34. Rows are sorted by name alphabetically first (Amara before Kenji), and since both Amara rows tie on name, age DESC breaks the tie so the older Amara comes first." },
      { question: "Can each column listed in an ORDER BY clause have its own independent ASC/DESC direction?", answer: "Yes — direction is specified per column, so `ORDER BY total_cents DESC, created_at ASC` sorts primarily by highest total first, and only uses created_at (oldest first) to break ties among equal totals." },
      { question: "What does `LIMIT 5` do to a query's results?", answer: "It caps the number of rows returned to at most 5, discarding any additional matching (and, if present, sorted) rows beyond that count." },
      { question: "What does `OFFSET 10` do when combined with `LIMIT 5`?", answer: "It skips the first 10 matching, sorted rows, then returns up to the next 5 after that — the classic pattern for fetching a later page of results." },
      { question: "Why is it risky to use LIMIT/OFFSET for pagination without an ORDER BY clause?", answer: "Without ORDER BY, the database doesn't guarantee any particular row order between queries, so which rows land on 'page 1' versus 'page 2' isn't reliably consistent — the same row could appear on multiple pages, or never appear at all, especially if rows are also being inserted or deleted between requests." },
      { question: "What happens if OFFSET is larger than the total number of matching rows?", answer: "The query simply returns zero rows. It's not an error — it just means there's nothing left after skipping that many." },
      { question: "In terms of logical order of evaluation, does WHERE run before or after ORDER BY?", answer: "WHERE runs first, filtering down to the matching rows. Only those surviving rows get sorted by ORDER BY, and only after that does LIMIT, if present, truncate the final sorted list — filtering, then sorting, then capping." },
      { question: "Where do NULL values end up when sorting a column with ORDER BY — always first, or always last?", answer: "It's not universal — different databases default to different placement for NULLs (some put them first in ascending order, others last), so if the exact position matters, check the specific database's default or specify it explicitly, since many support NULLS FIRST or NULLS LAST." },
      { question: "Write a query that finds the 3 cheapest in-stock products from a products table with price and in_stock columns.", answer: "`SELECT * FROM products WHERE in_stock = true ORDER BY price ASC LIMIT 3;` — filters down to in-stock products, sorts the survivors from cheapest to most expensive, then keeps only the first three." },
      { question: "A query with `WHERE total_cents > 5000 ORDER BY total_cents DESC LIMIT 3` returns only 1 row. Is that a bug?", answer: "Not necessarily. LIMIT only caps the maximum rows returned. If WHERE matched only 1 row in total, that's all there is to sort and return, regardless of LIMIT 3 asking for up to three." },
      { question: "How would you get the rows ranked 2nd and 3rd by price, skipping the single cheapest, using LIMIT and OFFSET?", answer: "`ORDER BY price ASC LIMIT 2 OFFSET 1` — sort cheapest first, skip the first row with OFFSET 1, then take the next two." },
      { question: "Why does filtering with WHERE inside the database scale better than fetching every row and filtering in application code?", answer: "The database can potentially use structures like indexes to jump straight to matching rows and never has to transfer non-matching rows over the network at all. Filtering in application code means every row, matching or not, has to be fetched, sent over the connection, and then discarded, which wastes both database and network work as the table grows." },
      { question: "Without any index, how does the database evaluate a condition like `WHERE total_cents > 5000`?", answer: "It generally performs a full table scan, checking the condition against every single row one by one, since there's no shortcut structure telling it which rows might qualify without looking. Indexes exist specifically to avoid this by letting the database narrow down candidate rows faster." },
      { question: "What's the difference between what WHERE excludes and what LIMIT excludes?", answer: "WHERE excludes rows based on whether they satisfy a condition — a row is kept or thrown out on its own merits. LIMIT excludes rows purely based on position in the already filtered and sorted result set, regardless of their content, purely to cap how many come back." },
      { question: "A developer expects `ORDER BY created_at DESC LIMIT 5 OFFSET 5` to always return a stable 'page 2' that never overlaps page 1, even as new orders keep being inserted. What can go wrong?", answer: "If new rows are inserted between the two requests, every existing row can shift down one position in the DESC ordering, which can cause the same row to reappear on both pages, or a row to be skipped entirely. LIMIT/OFFSET pagination is based on position, not a stable per-row marker, so it isn't safe against concurrent inserts or deletes affecting the exact ordering column being used." },
    ],
    prerequisites: ["basic-sql-queries"],
    relatedTopics: ["basic-sql-queries", "indexes", "aggregation"],
    keywords: ["WHERE", "ORDER BY", "filtering", "sorting", "LIMIT"],
  },
];
