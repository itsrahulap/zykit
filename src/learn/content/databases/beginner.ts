import type { Topic } from "../../types/content";

export const databasesBeginnerTopics: Topic[] = [
  {
    id: "what-is-a-database",
    title: "What is a Database?",
    level: "beginner",
    description: "Software that stores data in an organized shape you can search, filter, and change directly.",
    explanation: `
Imagine keeping all your app's data in one big text file. To find "all
orders Amara placed last week," you'd have to read every line yourself,
every time.

A **database** is software that avoids this. It stores data in organized,
labeled structures (usually **tables**, which look like spreadsheets). It
also has its own language for asking questions, like "give me every order
from Amara, sorted by date." The database does the searching for you, and
fast, even across millions of records.

So you don't just store data in a database. You *query* it.
    `.trim(),
    analogy:
      "A shoebox of receipts 'stores' your spending, but finding anything means digging through the whole box. A database is a filing cabinet with labeled folders, an index at the front, and a clerk who hands you the folder you ask for in seconds.",
    examples: [
      {
        title: "Asking a database a question directly",
        code: `SELECT name, email
FROM users
WHERE signed_up_at > '2026-01-01';`,
        language: "sql",
        explanation: "A real query, not pseudocode. It asks for every user who signed up after a date, and the database does the searching.",
        walkthrough: [
          { code: "SELECT name, email", explanation: "Which information you want back: just the name and email." },
          { code: "FROM users", explanation: "Tells the database which table to look in." },
          { code: "WHERE signed_up_at > '2026-01-01';", explanation: "Keeps only the rows that match this condition." },
        ],
      },
      {
        title: "A database holds many related tables",
        code: `-- A single small database might contain:
users        (people who use the app)
orders       (purchases people have made)
products     (items available to buy)
reviews      (feedback people left on products)`,
        explanation: "A real database is usually a collection of related tables that together hold your app's data.",
      },
    ],
    howItWorks: `
A database runs as its own program (like PostgreSQL, MySQL, or SQLite),
usually separate from your app. Your app connects to it and sends a query
written in **SQL** (Structured Query Language). The database works out the
fastest way to find and return the data you asked for.

The database knows the data's structure: which columns exist, their types,
and how tables relate. So it can search, filter, sort, and combine data far
faster than your own code scanning everything.
    `.trim(),
    whyItExists: `
Apps need data that:

- outlives a single run of the program
- many users can read and write at once
- can be searched in ways nobody predicted up front

Plain files struggle with all three. They're slow to search, concurrent
writes can corrupt them, and each new question needs new one-off code. A
database solves storage, search, and safe concurrent access together, with
one standard query language.
    `.trim(),
    whenToUse: `
Use a database once your data must persist between runs, may be read or
written by several people or processes at once, or needs searching in ways
you can't fully predict.
    `.trim(),
    whenNotToUse: `
For tiny, single-user, throwaway scripts (a quick calculation, a config
file that never changes), a plain file or in-memory variable is simpler. A
database there is unnecessary overhead.
    `.trim(),
    commonMistakes: [
      "Thinking a database is just 'a place files are stored' instead of a system you query.",
      "Writing custom search code when the database can already filter and sort for you.",
      "Treating a spreadsheet file as a database. A spreadsheet has no query language and no safe way for several people to write at once.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List three questions you might ask about data in a to-do list app (e.g. 'show me all incomplete tasks'). For each, name the data you'd need." },
      { difficulty: "Medium", prompt: "In your own words, explain why searching a large text file by hand is slower than asking a database." },
      { difficulty: "Hard", prompt: "Describe the tables a simple blog app would need, and a question you'd ask each one." },
    ],
    interviewQuestions: [
      { question: "What is a database, in plain terms?", answer: "Software that stores data in an organized structure and gives you a query language to search, filter, and change it directly, instead of scanning it by hand." },
      { question: "Why not just store application data in a plain text file?", answer: "Plain files are slow to search (you scan the whole file every time), can be corrupted when two processes write at once, and need new custom code for every new question. A database solves all three by understanding the data's structure and offering a shared query language." },
      { question: "What's the difference between a database and a spreadsheet file like Excel?", answer: "A spreadsheet is a single file with no query language and no safe way for several people to write at once. 'Querying' it means filtering or scrolling by hand. A database is running software that understands the data's structure and lets many clients read and write at once through a standard language like SQL." },
      { question: "What does it mean to *query* a database, as opposed to just reading data from it?", answer: "You describe *what* you want ('every order from Amara, sorted by date') and the database works out *how* to find it. Your code doesn't loop through the data looking for matches." },
      { question: "Why can a database search millions of rows faster than application code scanning them one by one?", answer: "The database knows the data's structure (types, relationships) and can use indexes to jump to matching rows instead of checking each one. Code looping over raw data has no such shortcut unless it builds one itself." },
      { question: "What is SQL, and why does it matter that so many different databases understand it?", answer: "SQL (Structured Query Language) is a standard language for saying what data you want or how to change it. Most relational databases understand it (with small dialect differences), so your skills and much of your query code carry over between PostgreSQL, MySQL, and SQLite." },
      { question: "You're building a to-do list app. What kind of data belongs in a database rather than just in application variables?", answer: "Anything that must survive after the app closes and be found later: the tasks, their completed status, due dates. A database keeps data between runs and lets you query it ('show me all incomplete tasks'). An in-memory variable can't." },
      { question: "A teammate says a small app can just keep all its data in an in-memory array instead of a database. What breaks first as that app grows?", answer: "The data vanishes when the process restarts. Two requests changing the array at once can race and corrupt it. And every new question needs new search code. These are exactly the three problems databases solve." },
      { question: "What does it mean that a database usually runs as its own separate piece of software from your application?", answer: "Your app connects to the database (often over a network connection, even on the same machine) and sends queries. The database process owns the data files and stores, searches, and protects them, independent of any one app process's lifecycle." },
      { question: "Why does a plain file struggle when two processes try to write to it at the same time, but a database generally doesn't?", answer: "A plain file has no coordination, so two writes at once can interleave and corrupt it. A database manages concurrent access internally (locking, isolation), so simultaneous writers don't step on each other." },
      { question: "Is a database the same thing as a table?", answer: "No. A table holds one kind of record (like `users`). A database is the whole system, often a named collection of related tables like `users`, `orders`, and `products`, that you can query together." },
      { question: "What's the practical risk of writing your own ad-hoc 'search' logic over a JSON file instead of reaching for a real database?", answer: "You slowly rebuild what a database already does well (filtering, sorting, safe concurrent writes) without years of engineering behind it. The result is usually slower, buggier, and harder to extend." },
      { question: "When would a plain file or an in-memory variable actually be the right choice over a database?", answer: "For a tiny, single-user, throwaway script, like a quick calculation or a config file nobody else writes to. A database earns its keep once data must persist, be shared, or be queried flexibly." },
    ],
    relatedTopics: ["tables-rows-columns", "basic-sql-queries"],
    keywords: ["database", "SQL", "data storage", "query"],
  },
  {
    id: "tables-rows-columns",
    title: "Tables, Rows & Columns",
    level: "beginner",
    description: "The spreadsheet-like grid that relational databases use to organize data.",
    explanation: `
In a **relational database**, data lives in **tables**, and each table
looks like a spreadsheet.

- **Columns** define what information is tracked (like \`name\`, \`email\`,
\`age\`) and what type of data each holds.
- **Rows** are individual records: one user, one order, one product.

Every row has a value for every column (or the value is explicitly left
empty). A \`users\` table with columns \`id\`, \`name\`, and \`email\` might have
one row per person who signed up.
    `.trim(),
    analogy:
      "A table is like a class attendance sheet. The columns are the headers across the top (name, student ID, grade), and each row is one student's details filled into those columns.",
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
        explanation: "This defines the table's shape: every row will have exactly these four columns, each holding a specific kind of value.",
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
        explanation: "Each row is one complete record, lined up under the same columns the table defines.",
      },
    ],
    howItWorks: `
When a table is created, its designer picks the columns up front: their
names and the type of value each holds (text, integer, date, and so on).
After that, every row must fit that shape: one value per column, of the
right type.

The database stores rows efficiently on disk and tracks the table's
structure (its **schema**), so it always knows what a row should look
like.
    `.trim(),
    whyItExists: `
Giving every row the same shape lets the database reason about data
reliably. It always knows that, in \`users\`, column 3 is an email and is
text, without checking each row. That consistency is what makes fast,
predictable queries possible.
    `.trim(),
    whenToUse: `
Use rows and columns when your data is many similar records with the same
fields: users, orders, products, log entries. That covers most app data.
    `.trim(),
    whenNotToUse: `
If every record has a different, unpredictable set of fields, fixed columns
get awkward. A flexible, document-style structure (used by some NoSQL
databases) may fit better.
    `.trim(),
    commonMistakes: [
      "Mixing up columns and rows. A column is a field shared by all records; a row is one record.",
      "Cramming several unrelated pieces of information into one column instead of giving each its own column.",
      "Assuming every row must look identical in the raw file. The database, not the disk layout, guarantees the row shape.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Design the columns for a 'books' table in a personal library app. List each column name and the kind of value it holds." },
      { difficulty: "Medium", prompt: "Write three example rows (as a small text table) that fit your 'books' table from the previous exercise." },
      { difficulty: "Hard", prompt: "Explain why one combined 'first name and last name' column is usually worse than two separate columns." },
    ],
    interviewQuestions: [
      { question: "What is the difference between a row and a column in a database table?", answer: "A column is one field shared by every record (like email). A row is one record, with a value for each column." },
      { question: "What is a table's schema?", answer: "The definition of a table's structure: its columns and the type of data each holds." },
      { question: "Why does every row in a table need to follow the same set of columns?", answer: "So the database can read and search every row the same way. That's what makes queries fast and predictable." },
      { question: "What does it mean for a column to hold `NULL`, versus an empty string or the number 0?", answer: "`NULL` means 'no value, unknown, or not applicable'. It's a distinct marker, not an empty string (a real, zero-length text value) or 0 (a real number). Comparisons and calculations treat `NULL` specially." },
      { question: "Why would you mark a column `NOT NULL`?", answer: "So the database rejects any row without a real value there. Every row is guaranteed a value, instead of relying on app code to remember to set it." },
      { question: "If a column has no `NOT NULL` constraint, what happens if an INSERT statement omits it?", answer: "The database stores `NULL` there (or the column's `DEFAULT` value, if one is defined). No error is raised." },
      { question: "What's the difference between a column's `DEFAULT` value and simply allowing `NULL`?", answer: "`DEFAULT` fills in a real value automatically when none is given, so the column still holds actual data. Allowing `NULL` lets 'no value' be stored. A column can have neither, either, or (less commonly) both." },
      { question: "Why is storing money as an integer number of cents safer than storing it as a floating-point number of dollars?", answer: "Binary floating point can't represent many decimal fractions exactly, so 0.10 + 0.20 may not be exactly 0.30. A whole number of cents has no fraction to round wrongly." },
      { question: "Why does declaring `age` as `INTEGER` instead of `TEXT` matter, beyond just being 'a number'?", answer: "The database can then reject non-numeric values, compare and sort numerically instead of character by character, and run math like `age + 1` without converting first." },
      { question: "What would go wrong if `age` were stored as `TEXT` instead of `INTEGER`?", answer: "Sorting would go character by character, so '9' sorts after '10' and '80' (because '1' comes before '9'). Math like `age + 1` wouldn't work reliably without converting first." },
      { question: "What breaks if you cram multiple unrelated pieces of information into one column, like a single text value holding a name, age, and city together?", answer: "The database allows it (it's just text), but you can no longer filter, sort, or update one piece on its own. Any query that needs just the age or city must first parse the value apart." },
      { question: "Why is splitting 'first name' and 'last name' into two separate columns usually better than one combined column?", answer: "You can sort, search, and format by either part (say, alphabetize by last name) without parsing a combined string. Parsing gets error-prone with multi-part names, prefixes, or suffixes." },
      { question: "Can you add a new column to a table that already has rows in it? What happens to those existing rows for the new column?", answer: "Yes, with `ALTER TABLE ... ADD COLUMN`. Existing rows get `NULL` (or the column's `DEFAULT`, if set), since there's no way to know what value they should have had." },
      { question: "Why can't two rows in the same table have a different set of columns?", answer: "The schema fixes the columns for the whole table. So the database and every query can rely on a column meaning the same thing in every row." },
      { question: "What's a practical downside of making too many columns on a table nullable 'just in case'?", answer: "A `NULL` becomes ambiguous: 'doesn't apply' or 'nobody set it'? Every query on that column must also handle `NULL`, adding complexity and bugs across the app." },
      { question: "Give an example where `NULL` in a column is the correct design choice rather than a mistake.", answer: "`middle_name` being `NULL` for someone with no middle name is fine; it really doesn't apply. Compare an `email` column that should be `NOT NULL` and is left empty by accident, which should never be allowed." },
      { question: "Does `WHERE middle_name = ''` match rows where `middle_name` was never set (is `NULL`)?", answer: "No. An empty string is a real, zero-length value, not `NULL`. A `NULL` row won't match `= ''`, or even `= NULL`. You need `IS NULL`." },
      { question: "What does it mean that a table's schema is decided 'up front,' and who typically decides it?", answer: "Before any data goes in, the table's designer chooses its columns, names, and types with `CREATE TABLE`. Every row must then fit that shape, though the schema can still change later with commands like `ALTER TABLE`." },
      { question: "Why might a flexible, document-style structure fit better than fixed columns for some data?", answer: "When each record has a different, unpredictable set of fields, fixed columns lead to lots of unused `NULL` columns or awkward workarounds. A document model lets each record carry only the fields it needs." },
      { question: "In `CREATE TABLE users (id INTEGER, name TEXT, email TEXT, age INTEGER);`, does the order the columns are declared in matter for storing or querying data?", answer: "Not for meaning. Every clause (`SELECT`, `WHERE`, `SET`, and so on) refers to columns by name, so order is mostly about readability. It does matter for `INSERT ... VALUES` with no column list, which matches values by position." },
      { question: "Are `age = NULL` and `age = 0` the same thing for a row?", answer: "No. `0` is a known value: the age really is zero. `NULL` means the age is unknown or never recorded. Treating them as the same implies you know something you don't." },
      { question: "Why does the database, rather than the raw disk layout, guarantee that every row matches the declared columns?", answer: "The engine stores rows however is efficient (variable-length encoding, compression, and so on), so rows don't need identical bytes on disk. The guarantee that every row has a value for every column comes from the schema the engine enforces." },
      { question: "What's the risk of designing a `tags` column that holds a comma-separated list of values?", answer: "You can't easily filter for 'rows with tag X' using a simple, index-friendly condition. You can't enforce uniqueness or consistent formatting inside the string. Every query has to split it apart first. Use a related table (or an array/JSON type, if supported) instead." },
      { question: "Why does storing a date in a proper `DATE` or `TIMESTAMP` type matter, rather than storing it as `TEXT`?", answer: "A real date type lets the database check that the value is a real calendar date, compare and range-filter dates correctly regardless of format, and use date functions like extracting the year. With `TEXT`, correctness depends on consistent formatting, and nothing stops an invalid value like '13/45/2026'." },
      { question: "Does every database have a native `BOOLEAN` type?", answer: "No. SQLite, for example, has no separate boolean storage type and stores true/false as the integers 1 and 0. It still acts like a boolean in queries, but the storage differs by database." },
      { question: "What is a `CHECK` constraint, and how does it relate to schema design?", answer: "A rule on a column or table that the database enforces on every insert or update, beyond type and nullability. For example, `CHECK (age >= 0)` rejects negative ages. This puts a basic business rule in the schema instead of relying on all app code to validate it." },
    ],
    prerequisites: ["what-is-a-database"],
    relatedTopics: ["what-is-a-database", "primary-and-foreign-keys", "basic-sql-queries"],
    keywords: ["table", "row", "column", "schema", "relational database"],
  },
  {
    id: "primary-and-foreign-keys",
    title: "Primary Keys & Foreign Keys",
    level: "beginner",
    description: "How a database identifies one exact row, and how rows in different tables point to each other.",
    explanation: `
If two customers are both named "Sam Lee," how does the database tell them
apart? It needs a column whose value is unique for every row. That column
is the **primary key**, usually an auto-generated \`id\` number.

Once every row has a unique id, tables can *reference* each other. An
\`orders\` table doesn't copy the user's name and email into every order. It
stores the user's \`id\` in a column like \`user_id\`. That column is a
**foreign key**: it points to a primary key in another table, linking the
rows without duplicating data.
    `.trim(),
    analogy:
      "A primary key is like a student ID number: no two students share one, even with the same name. A foreign key is like writing that ID on a library checkout card instead of the student's full name and address. It points back to the one record that has all the details.",
    examples: [
      {
        title: "A primary key",
        code: `CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  email TEXT
);`,
        language: "sql",
        explanation: "PRIMARY KEY tells the database that id uniquely identifies each row. It won't allow two rows with the same id.",
        walkthrough: [
          { code: "CREATE TABLE users (", explanation: "Begins the users table definition." },
          { code: "id INTEGER PRIMARY KEY,", explanation: "Uniquely identifies each row. Inserting a duplicate id is rejected." },
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
        explanation: "Each order stores only the id of the user who placed it. Orders 1 and 2 both belong to user 2, without repeating that user's name or email.",
      },
    ],
    howItWorks: `
The database enforces a primary key itself. It refuses any insert or
update that would duplicate a value in that column. Most tables use an
auto-incrementing integer id, since it's unique and never changes.

A foreign key is a regular column whose values should match a primary key
in another table. Many databases enforce this too, refusing an order whose
user_id doesn't exist in users. That keeps the two tables consistent.
    `.trim(),
    whyItExists: `
Without a unique id, you couldn't safely update or delete "this one
record." You might match several similar rows by accident.

Without foreign keys, you'd copy full details (name, email, address) into
every related table. That wastes space and becomes a mess as soon as the
copied data changes.
    `.trim(),
    whenToUse: `
Give almost every table a primary key. It's the basis for updating,
deleting, and linking specific rows. Add a foreign key whenever a row
"belongs to" or references a row in another table, like an order belonging
to a user.
    `.trim(),
    whenNotToUse: `
There's rarely a reason to skip a primary key on a real table. You can
skip foreign keys for small, throwaway, or deliberately denormalized
datasets where the tables don't need to stay in sync.
    `.trim(),
    commonMistakes: [
      "Using a real-world value like an email as the primary key, which breaks when a user changes their email.",
      "Skipping the foreign key column and copying a related row's full details everywhere instead.",
      "Thinking a foreign key keeps data in sync on its own. It only links rows; queries still need a join to show combined data.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain why an auto-incrementing id is usually a better primary key than a person's name." },
      { difficulty: "Medium", prompt: "Design a 'comments' table that belongs to both a 'posts' table and a 'users' table (who wrote it, and on which post). Name the foreign key columns you'd add." },
      { difficulty: "Hard", prompt: "Describe what could go wrong if you inserted a comment whose user_id doesn't match any real user." },
    ],
    interviewQuestions: [
      { question: "What is a primary key?", answer: "A column (or set of columns) whose value uniquely identifies each row in a table, enforced by the database to never have duplicates." },
      { question: "What is a foreign key?", answer: "A column in one table that stores the primary key value of a row in another table, creating a link between the two without duplicating data." },
      { question: "Why use a generated id instead of a real-world value like an email as a primary key?", answer: "Real-world values can change over time (like an email being updated), which breaks anything referencing it; a generated id never changes." },
      { question: "What is a composite primary key?", answer: "A primary key made of several columns together. The combination must be unique, even though no single column is. For example, `order_items` could use `(order_id, product_id)`, so a product appears only once per order." },
      { question: "When would you reach for a composite primary key instead of a single auto-incrementing id column?", answer: "When a row is fully defined by a combination of foreign keys and nothing else needs to identify it. The classic case is a join table, like `order_items` linking `orders` and `products`, where 'this order plus this product' is the row." },
      { question: "Must a foreign key always reference the other table's primary key specifically?", answer: "No. It can reference any column that's guaranteed unique (usually via a `UNIQUE` constraint). Referencing the primary key is just the most common and simplest case." },
      { question: "What is referential integrity, in plain terms?", answer: "The guarantee that every foreign key value matches a real row in the table it references. No order can point at a `user_id` that doesn't exist." },
      { question: "If a foreign key constraint is enforced, what happens when you try to insert a row whose foreign key value doesn't exist in the referenced table?", answer: "The database rejects the insert with a constraint violation error. It won't store a row pointing at a missing record." },
      { question: "What does `ON DELETE CASCADE` do on a foreign key?", answer: "When the referenced row (say, a user) is deleted, the database also deletes every row that references it (that user's orders), instead of leaving them pointing at nothing." },
      { question: "What does `ON DELETE SET NULL` do, and what does it require of the foreign key column?", answer: "When the referenced row is deleted, referencing rows keep existing but their foreign key is set to `NULL`. The foreign key column must therefore allow `NULL`." },
      { question: "What does `ON DELETE RESTRICT` (or the default `NO ACTION` in many databases) do?", answer: "It blocks the delete. The database won't delete the referenced row while any other row still references it, so you must deal with those references first." },
      { question: "Running `DELETE FROM users WHERE id = 1;` fails with a foreign key constraint violation. What's the most likely cause?", answer: "A row in another table (like `orders`) still points at that user, and the foreign key uses `RESTRICT`/`NO ACTION` (a common default) rather than `CASCADE` or `SET NULL`. The database refuses to leave the reference dangling." },
      { question: "Between `ON DELETE CASCADE` and `ON DELETE RESTRICT`, which is generally the safer default, and why?", answer: "`RESTRICT`. It forces you to decide what happens to dependent rows, instead of silently deleting a possibly large chain of related data. `CASCADE` is powerful but can remove far more than expected when relationships run deep." },
      { question: "Can a primary key column contain `NULL`?", answer: "No. A primary key means both unique and `NOT NULL`. A `NULL` can't reliably identify a row, and one `NULL` isn't even equal to another." },
      { question: "Can a foreign key column contain `NULL`, and what does that mean?", answer: "Yes, unless it's also marked `NOT NULL`. A `NULL` foreign key usually means 'no reference right now', like an order with no assigned sales rep. It's an optional relationship, not a broken one." },
      { question: "What is the difference between a natural key and a surrogate key?", answer: "A natural key is a real-world value already unique to the row, like a national ID or email. A surrogate key is an artificial value the database generates just to identify the row, like an auto-incrementing id, with no meaning outside the database." },
      { question: "What's a downside of using a natural key like an email as a primary key, beyond the fact that emails can change?", answer: "Natural keys are often longer or more complex than an integer, so they're slower to index and join on. That cost spreads to every table that uses them as a foreign key." },
      { question: "Can a table have more than one column, or combination of columns, that could each serve as a unique identifier? What are those called?", answer: "Yes. Each is a candidate key. The table picks one as its primary key; the others can still be enforced with `UNIQUE` constraints." },
      { question: "What's the difference between a `UNIQUE` constraint and a `PRIMARY KEY` constraint?", answer: "Both enforce uniqueness, but a table has only one primary key and can have many `UNIQUE` constraints. Unlike a primary key, a `UNIQUE` column can usually hold `NULL`, often more than once in most databases, since `NULL` never equals another `NULL`." },
      { question: "What happens if you try to insert a row whose primary key value already exists in the table?", answer: "The database rejects it with a uniqueness violation error. It never silently overwrites or duplicates the existing row." },
      { question: "Design a `comments` table that belongs to both a `posts` table and a `users` table. What foreign key columns would it need?", answer: "Two foreign keys: `post_id INTEGER REFERENCES posts(id)` for the post, and `user_id INTEGER REFERENCES users(id)` for the author, plus its own primary key, `id`." },
      { question: "What is a self-referencing foreign key? Give an example.", answer: "A foreign key that references the primary key of its own table. For example, `employees` with `manager_id INTEGER REFERENCES employees(id)`, where a manager is just another employee row." },
      { question: "Given `orders(id PK, user_id FK -> users.id ON DELETE CASCADE)`, what happens to a user's orders if that user's row is deleted?", answer: "All orders whose `user_id` points at that user are deleted too, because of `ON DELETE CASCADE`." },
      { question: "Given `orders(id PK, assigned_rep_id FK -> employees.id ON DELETE SET NULL)`, what happens to an order if the employee assigned to it is deleted?", answer: "The order stays, but its `assigned_rep_id` is set to `NULL`, so it's now unassigned." },
      { question: "Does adding a foreign key column automatically combine that table's data with the referenced table's data in query results?", answer: "No. A foreign key only creates (and optionally enforces) the link. To see data from both tables in one result, you still write a `JOIN`." },
      { question: "Why does inserting an order with a `user_id` that doesn't correspond to any real user cause problems, even without an actively enforced foreign key constraint?", answer: "Queries joining orders to users find nothing for that row, reports can silently undercount it, and later nobody can tell whether it's a typo or an intentionally orphaned record. Referential integrity exists to prevent exactly this." },
      { question: "In a composite primary key like `(order_id, product_id)`, does the order the two columns are listed in change what's enforced?", answer: "No. The combination must be unique either way. But column order can affect which queries can use the underlying index efficiently." },
      { question: "Is it valid, from the database's point of view, to create a table with no primary key at all?", answer: "Most databases allow it, but it's rarely wise. Without one, there's no guaranteed way to target, update, or delete one specific row, and other tables can't cleanly reference it." },
      { question: "What's the practical difference between a column that's `NOT NULL` and `UNIQUE` versus that same column being declared `PRIMARY KEY`?", answer: "`NOT NULL` plus `UNIQUE` enforces the same two rules as a primary key. But a table has only one primary key, marking the main identifier other tables should reference, while it can have many `NOT NULL` `UNIQUE` columns." },
      { question: "If `orders` has `ON DELETE CASCADE` back to `users`, and `order_items` has `ON DELETE CASCADE` back to `orders`, what happens when a single user row is deleted?", answer: "The user's orders are deleted, and each of those deletes removes that order's order_items. One delete can ripple through several tables when `CASCADE` is chained, which is why `RESTRICT` is often the preferred default." },
    ],
    prerequisites: ["tables-rows-columns"],
    relatedTopics: ["tables-rows-columns", "basic-sql-queries", "joins", "normalization"],
    keywords: ["primary key", "foreign key", "unique identifier", "relationships"],
  },
  {
    id: "basic-sql-queries",
    title: "Basic SQL Queries",
    level: "beginner",
    description: "The four core commands (SELECT, INSERT, UPDATE, DELETE) for reading and changing data.",
    explanation: `
**SQL** (Structured Query Language) is the language almost every
relational database understands. It's built around four core operations,
known as **CRUD** (Create, Read, Update, Delete):

- \`SELECT\`: read existing rows
- \`INSERT\`: add a new row
- \`UPDATE\`: change values in existing rows
- \`DELETE\`: remove rows

These four, plus ways to filter which rows they touch, cover most everyday
database work.
    `.trim(),
    analogy:
      "Think of a table as a shared notebook. SELECT is reading a page. INSERT is writing a new entry on a fresh line. UPDATE is crossing out part of an entry and writing a correction. DELETE is tearing an entry out.",
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
        explanation: "Each statement is a complete command, usually one operation at a time, ending in a semicolon.",
        walkthrough: [
          { code: "SELECT * FROM users;", explanation: "Gets every column of every row in users. The * means 'all columns'." },
          { code: "INSERT INTO users (name, email) VALUES ('Amara', 'amara@example.com');", explanation: "Adds one row with the given name and email." },
          { code: "UPDATE users SET email = 'amara@newmail.com' WHERE id = 1;", explanation: "Finds the row with id 1 and changes only its email." },
          { code: "DELETE FROM users WHERE id = 1;", explanation: "Removes the row with id 1." },
        ],
      },
      {
        title: "Selecting specific columns",
        code: `SELECT name, email FROM users;

UPDATE users SET age = age + 1 WHERE id = 3;`,
        language: "sql",
        explanation: "SELECT can list just the columns you need. UPDATE can compute a new value from the current one, like adding 1 to age.",
      },
    ],
    howItWorks: `
The database parses each SQL statement into a plan: which table to touch,
which rows match, and what to do with them.

\`SELECT\` only reads; it never changes data. \`INSERT\`, \`UPDATE\`, and
\`DELETE\` change the table. Without a \`WHERE\` clause, UPDATE and DELETE
apply to *every* row, which is why forgetting WHERE is one of the most
dangerous mistakes in SQL.
    `.trim(),
    whyItExists: `
SQL means you don't write custom code for every read or change. You
describe *what* you want ("all users older than 30") and the database works
out *how* to get it. The same standard language works across almost every
relational database.
    `.trim(),
    whenToUse: `
- SELECT: whenever you need to read data.
- INSERT: when new data is created (a signup, an order).
- UPDATE: when existing data changes (a new address, a status change).
- DELETE: when data should be removed for good.
    `.trim(),
    whenNotToUse: `
For huge one-time loads (millions of rows), many databases offer faster
bulk-loading tools than individual INSERTs. For data you might need to
recover, consider a "soft delete" (marking a row inactive) instead of a
real DELETE.
    `.trim(),
    commonMistakes: [
      "Running UPDATE or DELETE without a WHERE clause, which changes every row in the table.",
      "Forgetting that SELECT * fetches every column, even unneeded ones, wasting bandwidth on large tables.",
      "Thinking INSERT must list every column. Columns with defaults or that allow empty values can often be left out.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a SELECT that gets the name and email of every row in a users table." },
      { difficulty: "Medium", prompt: "Write an INSERT that adds a product with a name and price to a products table, then an UPDATE that changes its price." },
      { difficulty: "Hard", prompt: "Explain step by step what happens if you run `DELETE FROM users;` with no WHERE clause, and why that's dangerous." },
    ],
    interviewQuestions: [
      { question: "What do the four basic SQL commands SELECT, INSERT, UPDATE, and DELETE each do?", answer: "SELECT reads rows, INSERT adds a new row, UPDATE modifies values in existing rows, and DELETE removes rows." },
      { question: "What happens if you run an UPDATE statement with no WHERE clause?", answer: "It applies the change to every row in the table, not just one — which is a common and dangerous mistake." },
      { question: "Does SELECT ever modify the underlying data?", answer: "No — SELECT only reads and returns data; it never changes what's stored." },
      { question: "How do you insert multiple new rows using a single INSERT statement?", answer: "List several value groups after `VALUES`, separated by commas. For example, `INSERT INTO products (name, price_cents) VALUES ('Pen', 150), ('Notebook', 300), ('Eraser', 50);` inserts three rows." },
      { question: "Why is a single multi-row INSERT generally more efficient than the same number of single-row INSERT statements?", answer: "One statement is sent and parsed instead of many, so the database can batch the work. That means fewer round trips and often less repeated bookkeeping like index updates, which matters when inserting many rows." },
      { question: "What does adding `RETURNING *` (or specific columns) to an INSERT statement do?", answer: "It returns the row as stored, including values the database generated (like an auto-incremented id or default timestamp), in the same round trip. No separate SELECT needed." },
      { question: "Why is RETURNING especially useful after an INSERT that relies on an auto-generated primary key?", answer: "Your app doesn't know the generated id in advance. Without RETURNING, you'd need a second query and some other unique detail to find the new row. RETURNING gives you the id right away." },
      { question: "Is RETURNING part of every SQL database's basic dialect?", answer: "No. Support varies by database, so check your database's documentation instead of assuming it works the same everywhere." },
      { question: "Can RETURNING be used with UPDATE and DELETE statements too, not just INSERT?", answer: "Yes, where supported. UPDATE ... RETURNING gives the row's new values; DELETE ... RETURNING gives the row's values just before it was removed." },
      { question: "Running `INSERT INTO users (name) VALUES ('Amara');` fails, and `email` is declared NOT NULL with no default. Why?", answer: "You can leave a column out of an INSERT only if it has a DEFAULT or allows NULL. email has neither, so the insert is rejected." },
      { question: "If you supply an explicit column list in an INSERT, like `INSERT INTO users (email, name) VALUES ('a@x.com', 'Amara');`, does the order of those columns need to match the table's declared column order?", answer: "No. With a column list, values match columns by position in that list, so email before name is fine. Without a column list, VALUES must follow the table's declared column order." },
      { question: "What's the difference between `UPDATE products SET price_cents = 500` and `UPDATE products SET price_cents = price_cents + 100`?", answer: "The first sets every matching row to exactly 500. The second adds 100 to each row's current price, so results differ by starting price." },
      { question: "If an UPDATE or DELETE's WHERE clause matches zero rows, is that an error?", answer: "No. The statement succeeds and changes zero rows. Most databases report a rows-affected count of 0." },
      { question: "What's the difference between `DELETE FROM orders;` with no WHERE and `TRUNCATE TABLE orders;`?", answer: "Both remove every row. DELETE removes rows one by one and accepts a WHERE clause. TRUNCATE resets the whole table at once: often faster, but it can't take a WHERE clause and may treat things like auto-increment counters differently depending on the database." },
      { question: "Can a SELECT return a computed value that isn't stored as an actual column?", answer: "Yes. SELECT can include expressions. `SELECT price_cents * quantity AS line_total FROM order_items;` computes a value per row and names it line_total." },
      { question: "What does `AS` do in a statement like `SELECT price_cents * quantity AS line_total`?", answer: "It gives an expression (or column) an alias: the name used for it in the results. Handy for expressions that would otherwise have no meaningful name." },
      { question: "What's the difference between `INSERT INTO ... VALUES (...)` and `INSERT INTO ... SELECT ...`?", answer: "VALUES inserts rows you write out literally. INSERT INTO ... SELECT inserts whatever rows a query returns, which is useful for copying or transforming data between tables without pulling it into the app." },
      { question: "If a multi-row INSERT includes one row that violates a constraint, like a duplicate primary key, what typically happens to the other, valid rows in that statement?", answer: "In most databases the whole statement fails and no rows are inserted. The statement is atomic, so one bad row rolls back the batch instead of leaving partial results." },
      { question: "Could `UPDATE users SET status = 'active' WHERE last_login > '2026-01-01';` ever match more than one row?", answer: "Yes, easily. WHERE only guarantees one row when filtering on a unique column like a primary key. A non-unique column like last_login can match any number of rows, and all get updated." },
      { question: "After running an UPDATE or DELETE, how do you find out how many rows were actually affected?", answer: "Most drivers and clients report a rows-affected count with the result. Checking it confirms the statement hit the row you expected and didn't silently match zero." },
      { question: "Why might using `SELECT *` in application code be riskier than listing exact column names?", answer: "If columns are later added, removed, or reordered, code using SELECT * can silently get different data. Naming columns keeps the query stable through schema changes and avoids fetching data you don't need." },
      { question: "Is `WHERE id = 1` guaranteed to behave the same as `WHERE id = '1'` if id is an INTEGER column?", answer: "Many databases convert '1' to a number and still match, but don't rely on it. Some databases are stricter, and in others the conversion can silently stop an index being used. Match the literal's type to the column's type." },
      { question: "Explain what happens, step by step, if you run `DELETE FROM users;` with no WHERE clause.", answer: "No WHERE means no filter, so the database deletes every row in users, not just the one you meant. There's no built-in way to pick out 'the one I meant' afterward, which makes this one of the most dangerous SQL mistakes." },
      { question: "You want to update a row and immediately see its new value, like an updated_at timestamp the database sets automatically. What's the advantage of `UPDATE ... RETURNING updated_at` over a separate SELECT afterward?", answer: "RETURNING gives the post-update value in the same round trip and the same atomic operation. A follow-up SELECT is an extra query, and another process could change or delete the row in between. RETURNING avoids that race." },
      { question: "Write a single statement that inserts three new products, each with a name and price_cents.", answer: "`INSERT INTO products (name, price_cents) VALUES ('Pen', 150), ('Notebook', 300), ('Folder', 220);`: one INSERT, three value groups, committed together." },
      { question: "Why do INSERT, UPDATE, and DELETE each count as a single atomic operation, even when they affect many rows at once?", answer: "The database guarantees the statement either takes effect on every matching row or on none. It never fails partway with only some rows changed. That's why the rows-affected count (0 or the full expected count) is a safe way to judge the outcome." },
      { question: "A developer runs `UPDATE orders SET status = 'shipped' WHERE order_date = '2026-01-01';` intending to update one specific order, but several rows change. What went wrong?", answer: "order_date isn't unique; many orders can share a date. So WHERE matched every order from that day. Filtering by the order's id would have hit exactly one row." },
    ],
    prerequisites: ["tables-rows-columns"],
    relatedTopics: ["tables-rows-columns", "filtering-and-sorting", "transactions-and-acid"],
    keywords: ["SQL", "SELECT", "INSERT", "UPDATE", "DELETE", "CRUD"],
  },
  {
    id: "filtering-and-sorting",
    title: "Filtering & Sorting",
    level: "beginner",
    description: "Pick the rows you want with WHERE, and set the order they come back in with ORDER BY.",
    explanation: `
\`SELECT * FROM orders\` returns every order. Usually you want something
narrower: orders from this month, the five most expensive, users whose name
starts with "A."

- \`WHERE\` keeps only the rows that match a condition.
- \`ORDER BY\` sorts the results by any column, ascending or descending.

They're often used together: filter to the rows you care about, then sort
them.
    `.trim(),
    analogy:
      "WHERE is sorting a laundry basket down to just the socks. ORDER BY is lining those socks up from smallest to biggest. You can do either alone, or both.",
    examples: [
      {
        title: "Filtering with WHERE",
        code: `SELECT name, total_cents
FROM orders
WHERE total_cents > 5000;`,
        language: "sql",
        explanation: "Returns only orders over 5000 cents ($50). Every other row is left out.",
        walkthrough: [
          { code: "SELECT name, total_cents", explanation: "Choose which columns to return." },
          { code: "FROM orders", explanation: "Choose which table to read from." },
          { code: "WHERE total_cents > 5000;", explanation: "Keep only rows where this condition is true." },
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
        explanation: "Finds orders over $50, sorts them from highest total to lowest (DESC means descending), then keeps the top 3.",
      },
    ],
    howItWorks: `
The database checks the \`WHERE\` condition against each row and keeps the
rows where it's true. You can combine conditions with \`AND\` and \`OR\`.
\`ORDER BY\` sorts the remaining rows by one or more columns, \`ASC\`
(ascending, the default) or \`DESC\` (descending). \`LIMIT\` caps how many
sorted rows come back.

Without an index (a topic of its own), the database usually has to check
every row against WHERE. Indexes exist to speed up exactly that lookup.
    `.trim(),
    whyItExists: `
Apps rarely want "everything, in whatever order it's stored." Filtering and
sorting let the database do that work, instead of your code fetching every
row and filtering and sorting in memory, which is slower and more code.
    `.trim(),
    whenToUse: `
Use WHERE whenever you want only some rows. Use ORDER BY whenever order
matters: recent-first feeds, cheapest-first product lists, alphabetical
names.
    `.trim(),
    whenNotToUse: `
If you need every row and order doesn't matter (say, a batch job that
processes rows in any order), skip WHERE and ORDER BY to save the database
work.
    `.trim(),
    commonMistakes: [
      "Forgetting ORDER BY defaults to ascending, which looks 'backwards' for dates when you want newest first.",
      "Fetching all rows and filtering in app code instead of using WHERE. Much slower on large tables.",
      "Assuming rows come back in some order automatically. Without ORDER BY, no order is guaranteed.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a query that selects all products with a price less than 20 from a products table." },
      { difficulty: "Medium", prompt: "Write a query that returns the 5 most recently created rows from an orders table with a created_at column." },
      { difficulty: "Hard", prompt: "Using WHERE and ORDER BY, find the 3 cheapest in-stock products in a products table with price and in_stock columns." },
    ],
    interviewQuestions: [
      { question: "What does the WHERE clause do?", answer: "It filters which rows a query applies to, keeping only rows where the given condition evaluates to true." },
      { question: "What does ORDER BY control, and what's the default direction?", answer: "It controls the order results are returned in, by one or more columns; the default direction is ascending (ASC) unless DESC is specified." },
      { question: "If you don't use ORDER BY, is the order of returned rows guaranteed?", answer: "No — without an explicit ORDER BY, the database doesn't guarantee any particular row order." },
      { question: "What does `WHERE age = NULL` actually do, and why doesn't it match rows where age is NULL?", answer: "It never matches anything. Comparing to NULL with `=` (or any comparison) gives unknown, not true or false, because you can't know whether an unknown value equals something. Use `WHERE age IS NULL` instead." },
      { question: "What are the three possible outcomes of evaluating a WHERE condition?", answer: "True, false, and unknown. Unknown usually comes from comparisons involving NULL. WHERE keeps only true rows; false and unknown rows are excluded." },
      { question: "Given a table where some rows have age as NULL, what does `WHERE age > 20` return for those rows, and what about `WHERE NOT (age > 20)`?", answer: "Neither returns them. `age > 20` is unknown for a NULL age, and NOT unknown is still unknown. Both queries silently drop those rows." },
      { question: "Why is `WHERE column <> 5` on a column containing some NULL values likely to exclude more rows than expected?", answer: "A NULL compared with anything gives unknown, so NULL rows fail `<>` just as they fail `=`. They're dropped from both the equals-5 and not-equals-5 results, even though 'not equals' seems like it should include them." },
      { question: "What's a dangerous trap with `WHERE column NOT IN (list)` if that list can contain a NULL value?", answer: "If any item in the list is NULL, NOT IN can match zero rows for the whole query. NOT IN is a chain of `<>` checks joined by AND, and the NULL comparison makes the whole chain unknown, so every row is excluded." },
      { question: "Does AND bind more tightly than OR in a WHERE clause, and why does that matter?", answer: "Yes. Without parentheses AND runs first, so `WHERE a = 1 OR b = 2 AND c = 3` means `WHERE a = 1 OR (b = 2 AND c = 3)`, not `WHERE (a = 1 OR b = 2) AND c = 3`. Write explicit parentheses to avoid subtly wrong filters." },
      { question: "Is the range in `WHERE price BETWEEN 10 AND 20` inclusive or exclusive of 10 and 20?", answer: "Inclusive on both ends. BETWEEN equals `price >= 10 AND price <= 20`, so prices of exactly 10 or 20 are included." },
      { question: "What do `%` and `_` mean inside a LIKE pattern?", answer: "`%` matches zero or more characters; `_` matches exactly one. So `LIKE 'A%'` matches anything starting with A, and `LIKE 'A_'` matches exactly two characters starting with A." },
      { question: "Is LIKE guaranteed to be case-sensitive?", answer: "No. It depends on the database and sometimes the column's collation. PostgreSQL's LIKE is case-sensitive by default (ILIKE is the case-insensitive version), while some other databases are case-insensitive by default. Don't assume it's the same everywhere." },
      { question: "When ordering by two columns, like `ORDER BY last_name ASC, age DESC`, how does the second column affect the sort?", answer: "Rows sort by last_name ascending first. age descending only breaks ties between rows with the same last_name. The second column never overrides the first." },
      { question: "Given the rows Kenji/34, Amara/29, and Amara/41, what order does `ORDER BY name ASC, age DESC` return them in?", answer: "Amara/41, Amara/29, Kenji/34. Names sort alphabetically first; the two Amaras tie, so age DESC puts the older one first." },
      { question: "Can each column listed in an ORDER BY clause have its own independent ASC/DESC direction?", answer: "Yes, direction is per column. `ORDER BY total_cents DESC, created_at ASC` sorts by highest total first, then by oldest created_at to break ties." },
      { question: "What does `LIMIT 5` do to a query's results?", answer: "It returns at most 5 rows and drops the rest." },
      { question: "What does `OFFSET 10` do when combined with `LIMIT 5`?", answer: "It skips the first 10 sorted rows and returns up to the next 5. This is the classic way to fetch a later page." },
      { question: "Why is it risky to use LIMIT/OFFSET for pagination without an ORDER BY clause?", answer: "Without ORDER BY, row order isn't guaranteed between queries, so pages aren't consistent. A row could show up on several pages or never, especially if rows are inserted or deleted between requests." },
      { question: "What happens if OFFSET is larger than the total number of matching rows?", answer: "The query returns zero rows. It's not an error; there's just nothing left after skipping." },
      { question: "In terms of logical order of evaluation, does WHERE run before or after ORDER BY?", answer: "WHERE runs first and filters rows. ORDER BY sorts what's left. Then LIMIT, if present, cuts the sorted list: filter, sort, cap." },
      { question: "Where do NULL values end up when sorting a column with ORDER BY — always first, or always last?", answer: "Neither; it depends on the database. Some put NULLs first in ascending order, others last. If position matters, check the default or set it explicitly with NULLS FIRST or NULLS LAST, which many databases support." },
      { question: "Write a query that finds the 3 cheapest in-stock products from a products table with price and in_stock columns.", answer: "`SELECT * FROM products WHERE in_stock = true ORDER BY price ASC LIMIT 3;`: keep in-stock products, sort cheapest first, take the first three." },
      { question: "A query with `WHERE total_cents > 5000 ORDER BY total_cents DESC LIMIT 3` returns only 1 row. Is that a bug?", answer: "Not necessarily. LIMIT only sets a maximum. If WHERE matched just 1 row, that's all there is to return." },
      { question: "How would you get the rows ranked 2nd and 3rd by price, skipping the single cheapest, using LIMIT and OFFSET?", answer: "`ORDER BY price ASC LIMIT 2 OFFSET 1`: sort cheapest first, skip one row, take the next two." },
      { question: "Why does filtering with WHERE inside the database scale better than fetching every row and filtering in application code?", answer: "The database can use indexes to jump to matching rows and never sends non-matching rows over the network. Filtering in app code means fetching, sending, and discarding every non-matching row, which wastes more database and network work as the table grows." },
      { question: "Without any index, how does the database evaluate a condition like `WHERE total_cents > 5000`?", answer: "Usually with a full table scan, checking every row one by one, since nothing tells it which rows might match. Indexes exist to avoid this." },
      { question: "What's the difference between what WHERE excludes and what LIMIT excludes?", answer: "WHERE drops rows that fail a condition, based on each row's content. LIMIT drops rows based only on their position in the filtered, sorted results, just to cap the count." },
      { question: "A developer expects `ORDER BY created_at DESC LIMIT 5 OFFSET 5` to always return a stable 'page 2' that never overlaps page 1, even as new orders keep being inserted. What can go wrong?", answer: "If new rows arrive between requests, existing rows shift down in the DESC order. The same row can then show up on both pages, or a row can be skipped. LIMIT/OFFSET works by position, not a stable per-row marker, so it isn't safe against concurrent inserts or deletes." },
    ],
    prerequisites: ["basic-sql-queries"],
    relatedTopics: ["basic-sql-queries", "indexes", "aggregation"],
    keywords: ["WHERE", "ORDER BY", "filtering", "sorting", "LIMIT"],
  },
];
