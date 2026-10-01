import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste one or more queries into **Input SQL**, drop a `.sql` file on it or use **Open file**. **Try an example** loads a sample query.',
    'Choose the **Dialect** that matches your database (PostgreSQL by default), so its syntax, quoting and comments are recognised.',
    'With **Format**, pick the **Keywords** and **Identifiers** case, the **Indent**, **Blank lines between queries**, whether lines break before or after `AND` / `OR`, and **Dense operators**.',
    'Switch **Action** to **Minify** to put the query on as few characters as possible, optionally with **Remove comments (optimizer hints are kept)**.',
    'Copy the result, use **Download .sql** or **Send to…** another tool. If formatting fails, **Jump to error in input** selects the reported position.',
  ],
  howItWorks:
    '**Format** uses the open-source sql-formatter library, which parses the query with the grammar of the selected dialect and prints it again with consistent line breaks and indentation. The **Keywords** case is also applied to data types and function names. The library is loaded the first time you open the page, and formatting runs on the page in your browser as you type.\n\n' +
    '**Minify** uses a small tokenizer of its own that recognises string literals, quoted identifiers (`"…"`, backticks, and `[…]` in Standard SQL, SQL Server and SQLite), dollar-quoted strings, and line and block comments, following the selected dialect’s rules (for example `#` comments in MySQL, nested block comments in PostgreSQL). Whitespace is only removed between tokens, and a space is kept where removing it could merge two words or operators, so the meaning of the query doesn’t change.',
  limits: [
    'Input can be up to 5,000,000 characters (about 5 MB).',
    'Formatting needs SQL the selected dialect’s grammar understands. Unsupported or invalid syntax, or a wrong dialect, gives a parse error with line and column; **Minify** works on any text.',
    'Formatting doesn’t validate the query against a database: unknown tables, columns or functions aren’t reported.',
    'Optimizer hints written as `/*+ … */` or `/*! … */` are always kept when minifying. Other comments are kept unless you remove them.',
    'Identifier case changes only affect unquoted identifiers; string literals and quoted identifiers are kept exactly as written.',
  ],
  privacy:
    'Your SQL is formatted in your browser and never uploaded or stored. The **Share** button (Copy share link) puts the SQL and the options in the link’s `#` fragment, which browsers don’t send to servers; links are limited in size, so long scripts show *Too large to share*. SQL sent here or from here with **Send to…** passes through this tab’s session storage and is removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Which SQL dialects are supported?',
      answer:
        'Standard SQL, PostgreSQL, MySQL, MariaDB, SQLite, SQL Server (T-SQL), BigQuery, Snowflake, Amazon Redshift, Oracle PL/SQL, IBM Db2 and Db2 for i, Spark SQL, Apache Hive, Trino / Presto, DuckDB, ClickHouse, TiDB, SingleStoreDB and Couchbase N1QL.',
    },
    {
      question: 'Why do I get a parse error for valid SQL?',
      answer:
        'Usually the selected **Dialect** doesn’t match the query, for example SQL Server `[brackets]` with PostgreSQL selected, or a vendor-specific statement the formatter’s grammar doesn’t cover. Try the matching dialect, or use **Minify**, which doesn’t need to understand the query.',
    },
    {
      question: 'Will formatting change what my query does?',
      answer:
        'It only changes whitespace and the letter case of keywords (and identifiers, if you choose). Unquoted identifiers are case-insensitive in most databases but not all, so keep **Identifiers** on **Preserve** if case matters to you. Strings and quoted identifiers are never changed.',
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
