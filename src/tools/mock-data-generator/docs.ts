import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Edit the **Schema**: give each field a name and pick a type, such as **Full name**, **Email**, **UUID v4**, **Integer (range)** or **One of a list**. Use **Add field**, the arrows and the remove button to shape it; **Reset schema** restores the starting fields.',
    'Fill in any options a type needs, such as **Min** and **Max**, **From** and **To** dates, **Values (comma separated)** or a **Pattern**.',
    'Under **Output options**, set the number of **Rows** and choose a **Format**: **JSON**, **JSON Lines**, **CSV** or **SQL** (with a **SQL dialect** and **Table** name).',
    'Keep the **Seed** to get the same data again, or click **New seed** for different data.',
    'Copy or download the result, or open it in another tool with **Send to…**.',
  ],
  howItWorks:
    'Every value comes from a seeded random generator (sfc32, seeded by hashing the **Seed** text), so the same schema, row count and seed always give exactly the same rows. Names, cities and companies are combined from small built-in lists: 82 first names, 75 last names and 48 cities in 31 countries. Within a row, name, email and username are built from the same person, and city and country belong together.\n\n' +
    'Test-safe values are used where it matters: emails use `example.com`, `example.org`, `example.net`, `mail.test` or `inbox.test`, URLs use similar reserved domains, phone numbers use the fictional `555-01xx` range, and IPv6 addresses use the documentation prefix `2001:db8::/32`. **Custom pattern** replaces `#` with a digit, `?` with a capital letter and `*` with either, and `\\` makes the next character literal. Dates are picked from the whole range in UTC; **ISO date-time** values look like `2024-05-17T08:21:43Z`.\n\n' +
    'JSON keeps numbers and booleans typed, CSV is RFC 4180 with a header row, and SQL is a `CREATE TABLE` plus `INSERT` statements in batches of 500 rows, built by the same generator as the JSON to SQL tool. The schema is checked first: empty or duplicate names, a minimum above the maximum, or dates not written as `YYYY-MM-DD` are listed, and no data is produced until they are fixed. Everything runs in your browser.',
  limits: [
    'At most 10,000 rows; larger numbers are capped.',
    '**Decimal (range)** supports 0 to 10 decimal places, and **Integer (range)** needs a range within JavaScript’s safe integers.',
    'The name, city and company lists are small and mostly English, so values repeat in large data sets.',
    'IPv4 addresses are random values from `1.x.x.x` to `223.x.x.x`, not a reserved test range, so some may belong to real hosts.',
    'Values come from a reproducible generator, not a secure one, so don’t use the UUIDs or patterns as secrets or real identifiers.',
    'Fields can’t reference each other beyond the built-in name/email/username and city/country links, and there are no nested objects or arrays.',
  ],
  privacy:
    'Data is generated entirely in your browser and nothing is uploaded or stored. The **Share** button copies a link with your schema, row count, seed and output options in its `#` fragment, which browsers don’t send to servers; whoever opens it gets the same data. **Send to…** passes the output to another tool through this tab’s session storage, and it is removed as soon as that tool reads it.',
  faqs: [
    {
      question: 'Can I get the same data again?',
      answer:
        'Yes. The output depends only on the schema, the row count and the **Seed**, so keeping the seed, or sharing the link, reproduces it exactly. Click **New seed** for a different data set.',
    },
    {
      question: 'Are the emails and phone numbers real?',
      answer:
        'No. Emails and URLs only use reserved domains such as `example.com` and `.test`, and phone numbers use the `555-01xx` range kept for fiction, so nothing reaches a real person.',
    },
    {
      question: 'How do I make IDs like `ORD-1234-AB`?',
      answer:
        'Choose **Custom pattern** and type `ORD-####-??`. Each `#` becomes a digit and each `?` a capital letter; `*` gives a letter or digit, and `\\#` keeps a literal `#`.',
    },
    {
      question: 'Which SQL databases are supported?',
      answer:
        'PostgreSQL, MySQL, SQLite and SQL Server. The output creates the table and inserts the rows in batches of 500, using the **Table** name you enter (or `mock_data`).',
    },
  ],
};

export default docs;
