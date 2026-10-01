import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste a JSON array of objects (or a single object) into **Input JSON**, drop a file on it, or use **Open file**. **Try an example** loads a sample.',
    'Choose the **Dialect**: **PostgreSQL**, **MySQL**, **SQLite** or **SQL Server**, and set the **Table name** (`schema.table` works too).',
    'Set **Rows per INSERT**, optionally pick a **Primary key** column, and untick **Include CREATE TABLE** if you only want the inserts.',
    'Check the inferred types in the **Columns** panel and any warnings, then copy the SQL, use **Download .sql**, or send it to another tool.',
  ],
  howItWorks:
    'The JSON is read with the same strict parser as the JSON Formatter, which keeps numbers exactly as written. Each object is a row, and the columns are every key that appears, in the order first seen. A row without a key gets `NULL` there. Nested objects and arrays are not flattened; they are stored as JSON text.\n\n' +
    'Each column’s type comes from all of its values. Whole numbers become `INTEGER`/`INT`, `BIGINT` or an exact `NUMERIC`/`DECIMAL` depending on their range. Decimals become `NUMERIC(p, s)`/`DECIMAL(p, s)` sized to the widest value, and exponent numbers a floating-point type. Strings that are ISO dates (`2024-01-15`) become `DATE`, and date-times become `TIMESTAMP`, `TIMESTAMPTZ` when they have an offset, `DATETIME`, `DATETIME2` or `DATETIMEOFFSET`, depending on the dialect. Other strings become `VARCHAR(n)` (16, 32, 64, 128 or 255) or `TEXT`, objects and arrays `JSONB`/`JSON`, and booleans `BOOLEAN`, `BIT` or `INTEGER`. A column with mixed kinds of values is stored as text. SQLite gets its own simpler types. Columns with a value in every row are marked `NOT NULL`.\n\n' +
    'Every identifier is quoted with the quote character doubled: double quotes for PostgreSQL and SQLite, backticks for MySQL and `[name]` for SQL Server, and every string is escaped for the chosen dialect. MySQL gets backslash escapes, SQL Server `N\'…\'` literals, and NUL characters are written as `char(0)` or `NCHAR(0)` (or removed for PostgreSQL). Numbers are written exactly as they appear in the JSON. Booleans are `TRUE`/`FALSE`, or `1`/`0` for SQLite and SQL Server. For MySQL, date-times with an offset are converted to UTC because `DATETIME` has no time zone. Conversion runs in the page as you type.',
  limits: [
    'Input is limited to about 10 MB (10 million characters); opened or dropped files to 10 MB. Only the first 1 MB of SQL is shown on screen; copy or download to get all of it.',
    'Rows per INSERT are capped at 10,000 for PostgreSQL and MySQL, 500 for SQLite and 1,000 for SQL Server, with a warning when your number is higher.',
    'Only `CREATE TABLE` and `INSERT` are generated: no indexes, foreign keys, upserts or `DROP TABLE`.',
    'The input must be an array of objects or a single object. An item that isn’t an object, such as a number or an array, is reported as an error.',
    'Dates are only recognised in ISO form (`YYYY-MM-DD`, optionally with a time). Nested objects aren’t split into separate columns or tables.',
    'If an object has a key twice, the last value is used. An empty key becomes a column named `column`.',
    'The MySQL output assumes the default `sql_mode`. It won’t load correctly with `NO_BACKSLASH_ESCAPES`.',
  ],
  privacy:
    'SQL is generated entirely in your browser; your JSON is never uploaded or stored, and there is no share link. If you use **Send to…** to open the SQL in another tool, or receive JSON from one, it is handed over through this tab’s session storage and removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Is the generated SQL safe from injection?',
      answer:
        'Every value is turned into a literal by the tool rather than pasted in. Identifiers are always quoted with the quote character doubled, strings are escaped for the chosen dialect, and numbers are only ever valid JSON number text. Hostile keys, table names and values stay inside their literals.',
    },
    {
      question: 'How are nested objects and arrays stored?',
      answer:
        'As JSON text in a single column, typed `JSONB` in PostgreSQL, `JSON` in MySQL, `TEXT` in SQLite and `NVARCHAR(MAX)` in SQL Server. They are not flattened into extra columns.',
    },
    {
      question: 'Why is a column TEXT instead of a number?',
      answer:
        'The column holds more than one kind of value, for example numbers in some rows and strings in others, so it’s stored as text to keep every value. Values that are `null` or missing don’t count. They only make the column nullable.',
    },
    {
      question: 'Are big numbers and decimals kept exactly?',
      answer:
        'Yes. Numbers are written exactly as in the JSON, so long IDs and amounts like `120.50` aren’t rounded. Integers beyond 64 bits get an exact `NUMERIC`/`DECIMAL` type where the dialect allows it.',
    },
    {
      question: 'What does the Primary key option check?',
      answer:
        'The chosen column is marked `PRIMARY KEY` in the `CREATE TABLE`. You get a warning if it’s missing or null in some rows or has duplicate values. For text keys, SQL Server and MySQL get a bounded type such as `NVARCHAR(450)` or `VARCHAR(768)` so the key can be indexed.',
    },
  ],
};

export default docs;
