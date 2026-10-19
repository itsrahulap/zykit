import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a sample from **Load a sample schema…** (e-commerce, blog, clinic or project management), or open **Schema Designer** and use **+ Add table**. Each new table starts with a `BIGINT` identity primary key.',
    'Click a table’s header on the canvas to edit it: rename it, add columns, choose PostgreSQL types, tick **Primary key**, **Not null**, **Unique** or **Identity**, and set defaults, CHECKs and indexes. Drag tables by their header; **Fit**, **+** and **−** (or Ctrl/⌘ + scroll) control the view.',
    'Link tables in **Add a relationship**, or click the dot next to a foreign key column and then the dot next to the column it references. Choose one-to-many or one-to-one and the **ON DELETE** action, then confirm with **Add relationship**. **Create junction table** sets up many-to-many.',
    'In **Visual Query Builder**, choose the first table, join more tables (accepting a suggested **ON** condition or choosing your own), then add columns, aggregates, **WHERE** conditions and groups, **GROUP BY**, **HAVING**, **ORDER BY**, **LIMIT** and **OFFSET**. The SQL updates as you go.',
    'Copy the SQL, use **Download query.sql** / **Download schema.sql**, or **Edit SQL by hand**. **Export JSON** saves the whole project to a file you can **Import JSON** later.',
  ],
  howItWorks:
    'Tables, columns, relationships and query parts are stored as structured data, each with a stable id, so renaming a table or column updates every join, filter and foreign key that uses it. Plain TypeScript code in your browser generates SQL from that data on every change. The same project always gives exactly the same SQL.\n\n' +
    '**Schema SQL** has one `CREATE TABLE` per table, with referenced tables first. Columns get their type (`VARCHAR(n)`, `NUMERIC(p, s)` and so on), `GENERATED ALWAYS AS IDENTITY`, `DEFAULT`, `PRIMARY KEY` or `UNIQUE`, `NOT NULL` and `CHECK`. Composite primary keys, table CHECKs and foreign keys (`CONSTRAINT … FOREIGN KEY … REFERENCES … ON DELETE …`) are written as table constraints.\n\n' +
    'When tables reference each other in a loop, those foreign keys are added afterwards with `ALTER TABLE … ADD CONSTRAINT`. PostgreSQL doesn’t index foreign key columns by itself, so a `CREATE INDEX` is added for each one, unless you turn that off or the column is already indexed.\n\n' +
    '**Query SQL** is a `SELECT` with optional `DISTINCT`, `INNER`, `LEFT`, `RIGHT` or `FULL OUTER JOIN … ON`, `WHERE` with nested `AND` / `OR` groups, `GROUP BY`, `HAVING`, `ORDER BY`, `LIMIT` and `OFFSET`.\n\n' +
    '- Operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `LIKE`, `ILIKE`, `IN`, `NOT IN`, `IS NULL`, `IS NOT NULL` and `BETWEEN`.\n' +
    '- Aggregates: `COUNT`, `SUM`, `AVG`, `MIN` and `MAX`.\n' +
    '- Identifiers are quoted with `"…"` only when needed (capitals, spaces, reserved words such as `user` or `order`).\n' +
    '- Values are written as literals for the column’s type: numbers are checked, text is quoted with doubled `\'`, and dates, timestamps, UUIDs and JSONB are typed, for example `DATE \'2026-01-31\'`.\n\n' +
    'Before showing any SQL, the builder checks the design the way PostgreSQL would. It catches duplicate names or names over PostgreSQL’s 63-byte limit, a foreign key that doesn’t reference a primary key or unique column, mismatched key types, `SET NULL` on a `NOT NULL` column, joins without a condition, selected columns that aren’t grouped, aggregates in `WHERE`, `SUM` on text, `ORDER BY` with `DISTINCT` on an unselected column, and invalid values.\n\n' +
    'Problems are listed in plain words, and no SQL is produced until they are fixed, so the tool never hands you a statement it knows is invalid. **What this query does** describes the finished query in plain sentences built from the same data, not by an AI model.\n\n' +
    'Join suggestions come only from relationships you have defined. Columns with matching names are never joined automatically.',
  limits: [
    'The tool only writes SQL text. It doesn’t connect to a database, run queries, show results, or read an existing database’s schema.',
    'The visual builder makes `SELECT` queries. `INSERT`, `UPDATE`, `DELETE`, subqueries, CTEs, window functions and `UNION` are shown as examples in **SQL Reference** but aren’t built visually.',
    'Supported column types: `INTEGER`, `BIGINT`, `SERIAL`, `BIGSERIAL`, `VARCHAR`, `TEXT`, `BOOLEAN`, `DATE`, `TIMESTAMP`, `TIMESTAMPTZ`, `NUMERIC`, `UUID` and `JSONB`. Defaults are a typed value or one of `CURRENT_TIMESTAMP`, `CURRENT_DATE`, `now()` and `gen_random_uuid()`.',
    'CHECK expressions are written into the SQL as you type them. The builder rejects `;`, comments and unbalanced quotes or brackets, but doesn’t check column names or functions inside them.',
    'Foreign keys are single-column. Join conditions compare one column with another using `=`.',
    'Schema SQL creates tables from scratch; it doesn’t produce migrations between two versions of a schema.',
    'Hand-edited SQL isn’t checked, read back into the visual builder, or saved with the project.',
    'Imported project files can be up to 2 MB, with up to 200 tables of 200 columns each. Undo keeps the last 100 changes for the current visit.',
  ],
  privacy:
    'Everything runs in your browser. Your schema and query are saved in this browser’s local storage for when you come back; nothing is uploaded, and **Reset** clears them. The tool never asks for database hosts, usernames or passwords. Imported JSON files are read on the page and checked field by field before use.',
  faqs: [
    {
      question: 'Does this run my query against a database?',
      answer: 'No. It only writes PostgreSQL SQL. Copy or download it and run it in psql, pgAdmin, DBeaver or your application.',
    },
    {
      question: 'How do I make a many-to-many relationship?',
      answer:
        'Use **Create junction table** under **Many-to-many** and pick the two tables. It adds a table such as `students_courses` with a foreign key to each side (both with `ON DELETE CASCADE`) that together form its primary key. Then join through the junction table in your query.',
    },
    {
      question: 'Why does my query show problems instead of SQL?',
      answer:
        'The builder only shows SQL it can stand behind. A common cause is grouping: once you use `GROUP BY` or an aggregate, every plain selected column must be in `GROUP BY` (grouping by a table’s primary key covers its other columns). Others are a join with no **ON** condition or a value that doesn’t fit the column type. The message says what to change.',
    },
    {
      question: 'Why are some names wrapped in double quotes?',
      answer:
        'PostgreSQL folds unquoted names to lower case and reserves words such as `user`, `order` and `group`. A name with capitals, spaces or a reserved word is quoted so it keeps working, for example `"user"` or `"Order Total"`. Lower-case snake_case names never need quotes.',
    },
    {
      question: 'Is the generated SQL safe to put in my application?',
      answer:
        'Values are escaped correctly, but in application code you should pass user input as query parameters (`$1`, `$2`) instead of writing values into the SQL string. Use the generated SQL as a template and replace the literal values with parameters.',
    },
    {
      question: 'Will joins be guessed from column names?',
      answer: 'No. A join is only suggested from a relationship you defined, and you choose whether to use it. Otherwise you pick the ON columns yourself.',
    },
  ],
};

export default docs;
