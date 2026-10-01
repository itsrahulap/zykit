import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Press **Add CSV files** or drop one or more CSV/TSV files on the page. You can also use **Paste CSV**, give it a **Table name** and press **Add table**, or try **Load sample data** for a small customers and orders pair.',
    'Check the **Tables** sidebar for each table’s name, row count and column types. Click a table or column name to insert it into the query.',
    'Write SQL in the **SQL query** box, or pick one from **Examples**, then press **Run** or Ctrl/⌘ + Enter. **Cancel** stops a query that takes too long.',
    'Browse the **Results** table, then use **Export CSV** or **Export JSON** to download the result.',
  ],
  howItWorks:
    'Each file becomes a table in an in-memory SQLite database. It runs as WebAssembly (sql.js) in a background worker, so long queries don’t freeze the page. Table names come from the file name, lowercased with other characters turned into `_` (`Sales 2024.csv` becomes `sales_2024`). Names that start with a digit get a `t_` prefix, and a repeated name gets `_2`, `_3`…\n\n' +
    'The file is read with the same RFC 4180 CSV parser as the CSV ↔ JSON tool. It handles quoted fields with delimiters, `""` and line breaks inside them, and ignores a leading byte-order mark. The delimiter is detected from comma, semicolon, tab and pipe; `.tsv` and `.tab` files always use tab. The first row is always the header. Blank column names become `column_1`, `column_2`…, and repeated names get `_2`, `_3`….\n\n' +
    'Each column’s type is chosen from up to 1,000 non-empty values. If all are whole numbers that fit exactly in a JavaScript number, it’s `INTEGER`. If all are decimal or exponent numbers, it’s `REAL`. Anything else makes it `TEXT`. Empty cells in number columns are stored as `NULL`. **Import every column as TEXT (no type detection)** turns this off.\n\n' +
    'You can use any SQL that SQLite supports, including joins, `GROUP BY`, `WITH`, window functions, views, and `CREATE TABLE … AS`, `INSERT`, `UPDATE` and `DELETE`. Several statements separated by `;` run in order, and the last one that returns rows is shown. Errors are SQLite’s own messages, such as `no such table: nope`.',
  limits: [
    'Up to 200 MB of CSV text in total across all tables.',
    'The results table shows the first 1,000 rows. Exports include up to 500,000 rows of the last result.',
    'Queries are stopped after 30 seconds. Stopping or cancelling a query reloads the tables from the original files, so changes made by queries are lost. Changing **Import every column as TEXT** reloads them the same way.',
    'Rows with more fields than the header lose the extra fields (a notice gives the count). Missing fields become `NULL`. Up to 3 CSV parse problems, such as an unclosed quote, are listed per file.',
    'Type detection only looks at the first 1,000 non-empty values. A later value that doesn’t fit the type is stored as text. Numbers use the dot as decimal separator, and dates stay `TEXT`.',
    'The database lives only in this tab. Reloading or leaving the page discards it, and there is no way to download the database itself.',
    'The worker needs WebAssembly. If the browser blocks it, the tool shows an error instead of running.',
  ],
  privacy:
    'Files are read and queried inside your browser. The SQLite engine and its WebAssembly file load from this site, and the site’s security policy blocks requests to other servers, so your data is never uploaded. Nothing is saved: the tables live in memory and are gone when you close or reload the tab. There is no share link. CSV sent here from another tool with **Send to…** is passed through this tab’s session storage, removed as soon as it is read, and added as a table.',
  faqs: [
    {
      question: 'Which SQL dialect does it use?',
      answer:
        'SQLite, compiled to WebAssembly (sql.js). Anything SQLite supports works, including `JOIN`, `GROUP BY`, `WITH RECURSIVE`, window functions and the built-in date and string functions. Tables use SQLite’s `INTEGER`, `REAL` and `TEXT` types.',
    },
    {
      question: 'How do I join two CSV files?',
      answer:
        'Add both files. Each becomes its own table, named after the file. Then write a normal `JOIN`, for example `SELECT * FROM orders o JOIN customers c ON c.id = o.customer_id`. With two tables loaded, **Examples** suggests a join on a likely key, such as a shared column name or `customer_id` = `id`.',
    },
    {
      question: 'Why is my number column typed as TEXT?',
      answer:
        'At least one of the first 1,000 non-empty values isn’t a plain number, for example `1,200`, `12%` or `N/A`. Whole numbers too large to store exactly also make a column `REAL` or `TEXT` rather than `INTEGER`. You can still convert values in SQL with `CAST(col AS REAL)`.',
    },
    {
      question: 'Can I change the data with INSERT, UPDATE or DELETE?',
      answer:
        'Yes, and the **Tables** sidebar updates after statements that may change tables. The changes only exist in this tab’s in-memory database. They are lost if a query is cancelled or times out, if you change the TEXT import option, or if you reload the page. Export a result to keep it.',
    },
    {
      question: 'Why does the result say it shows only part of the rows?',
      answer:
        'Only the first 1,000 rows are drawn on the page. The row count is still the full total, and **Export CSV** or **Export JSON** includes up to 500,000 rows.',
    },
  ],
};

export default docs;
