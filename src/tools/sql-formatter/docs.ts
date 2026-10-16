import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste one or more queries into **Input SQL**, drop a `.sql` file on it or use **Open file**. **Try an example** loads a sample query.',
    'Choose the **Dialect** that matches your database (PostgreSQL by default), so its syntax, quoting and comments are recognised.',
    'With **Format**, pick the **Keywords** and **Identifiers** case, the **Indent**, **Blank lines between queries**, whether lines break before or after `AND` / `OR`, and **Dense operators**.',
    'Switch **Action** to **Minify** to make the query as short as possible, optionally with **Remove comments (optimizer hints are kept)**.',
    'Copy the result, use **Download .sql** or **Send to…** another tool. If formatting fails, **Jump to error in input** selects the reported position.',
  ],
  howItWorks:
    '**Format** uses the open-source sql-formatter library. It parses the query with the selected dialect’s grammar and prints it again with consistent line breaks and indentation. The **Keywords** case also applies to data types and function names. The library loads the first time you open the page, and formatting runs in your browser as you type.\n\n' +
    '**Minify** uses its own small tokenizer, following the selected dialect’s rules (for example `#` comments in MySQL, nested block comments in PostgreSQL). It recognises:\n\n' +
    '- string literals and dollar-quoted strings\n' +
    '- quoted identifiers (`"…"`, backticks, and `[…]` in Standard SQL, SQL Server and SQLite)\n' +
    '- line and block comments\n\n' +
    'Whitespace is only removed between tokens. A space is kept wherever removing it could merge two words or operators, so the query’s meaning doesn’t change.',
  limits: [
    'Input can be up to 5,000,000 characters (about 5 MB).',
    'Formatting needs SQL the selected dialect’s grammar understands. Unsupported or invalid syntax, or a wrong dialect, gives a parse error with line and column; **Minify** works on any text.',
    'Formatting doesn’t validate the query against a database: unknown tables, columns or functions aren’t reported.',
    'Optimizer hints written as `/*+ … */` or `/*! … */` are always kept when minifying. Other comments are kept unless you remove them.',
    'Identifier case changes only affect unquoted identifiers; string literals and quoted identifiers are kept exactly as written.',
  ],
  privacy:
    'Your SQL is formatted in your browser and never uploaded or stored. The **Share** button (Copy share link) puts the SQL and options in the link’s `#` fragment, which browsers don’t send to servers. Links have a size limit, so long scripts show *Too large to share*. SQL sent here or from here with **Send to…** passes through this tab’s session storage and is removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Which SQL dialects are supported?',
      answer:
        'Standard SQL, PostgreSQL, MySQL, MariaDB, SQLite, SQL Server (T-SQL), BigQuery, Snowflake, Amazon Redshift, Oracle PL/SQL, IBM Db2 and Db2 for i, Spark SQL, Apache Hive, Trino / Presto, DuckDB, ClickHouse, TiDB, SingleStoreDB and Couchbase N1QL.',
    },
    {
      question: 'Why do I get a parse error for valid SQL?',
      answer:
        'Usually the selected **Dialect** doesn’t match the query (for example SQL Server `[brackets]` with PostgreSQL selected), or the formatter’s grammar doesn’t cover a vendor-specific statement. Try the matching dialect, or use **Minify**, which doesn’t need to understand the query.',
    },
    {
      question: 'Will formatting change what my query does?',
      answer:
        'It only changes whitespace and the letter case of keywords (and identifiers, if you choose). Unquoted identifiers are case-insensitive in most databases but not all, so keep **Identifiers** on **Preserve** if case matters. Strings and quoted identifiers are never changed.',
    },
    {
      question: 'Can it format several statements at once?',
      answer: 'Yes. Statements separated by `;` are formatted one after another, with the number of **Blank lines between queries** you choose.',
    },
    {
      question: 'Does minifying remove comments?',
      answer:
        'Only if you tick **Remove comments (optimizer hints are kept)**. Kept `--` comments end with a line break so they don’t swallow the rest of the query.',
    },
  ],
};

export default docs;
