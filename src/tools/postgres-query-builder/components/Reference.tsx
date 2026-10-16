// SQL Reference tab: short, copyable PostgreSQL examples, including the statements the visual
// builder doesn't generate (INSERT, UPDATE, DELETE, subqueries, CTEs).

import { CodeBlock, CopyButton } from '../../../shared/ui/tool';

const EXAMPLES: { title: string; note: string; sql: string }[] = [
  {
    title: 'Select with a filter and sort',
    note: 'WHERE filters rows before anything else; ORDER BY sorts the result; LIMIT caps how many rows come back.',
    sql: "SELECT id, name, email\nFROM users\nWHERE email ILIKE '%@example.com'\nORDER BY name ASC\nLIMIT 20;",
  },
  {
    title: 'INNER vs LEFT JOIN',
    note: 'INNER JOIN keeps only users with at least one order. LEFT JOIN keeps every user; order columns are NULL for users without orders.',
    sql: 'SELECT u.name, o.id AS order_id\nFROM users AS u\nINNER JOIN orders AS o\n    ON o.user_id = u.id;\n\nSELECT u.name, o.id AS order_id\nFROM users AS u\nLEFT JOIN orders AS o\n    ON o.user_id = u.id;',
  },
  {
    title: 'Group and filter groups',
    note: 'GROUP BY makes one row per group. HAVING filters groups after aggregation; WHERE cannot use COUNT/SUM.',
    sql: 'SELECT u.id, u.name, COUNT(o.id) AS order_count\nFROM users AS u\nLEFT JOIN orders AS o\n    ON o.user_id = u.id\nGROUP BY u.id\nHAVING COUNT(o.id) >= 3\nORDER BY order_count DESC;',
  },
  {
    title: 'IN, BETWEEN and NULL checks',
    note: 'Use IS NULL, never = NULL: comparing with NULL is never true. BETWEEN includes both ends.',
    sql: "SELECT *\nFROM orders\nWHERE status IN ('pending', 'paid')\n    AND created_at BETWEEN TIMESTAMPTZ '2026-01-01' AND TIMESTAMPTZ '2026-01-31 23:59:59'\n    AND shipped_at IS NULL;",
  },
  {
    title: 'Insert rows',
    note: 'Identity and defaulted columns can be left out. RETURNING gives back the generated id without a second query.',
    sql: "INSERT INTO users (name, email)\nVALUES ('Ada Lovelace', 'ada@example.com'),\n       ('Alan Turing', 'alan@example.com')\nRETURNING id;",
  },
  {
    title: 'Insert or update (upsert)',
    note: 'ON CONFLICT needs a unique constraint or primary key on the conflict column.',
    sql: "INSERT INTO users (name, email)\nVALUES ('Ada', 'ada@example.com')\nON CONFLICT (email) DO UPDATE\n    SET name = EXCLUDED.name;",
  },
  {
    title: 'Update rows',
    note: 'Always include a WHERE clause; without one every row in the table changes. Run it inside a transaction to check first.',
    sql: "BEGIN;\n\nUPDATE orders\nSET status = 'cancelled'\nWHERE status = 'pending'\n    AND created_at < now() - INTERVAL '30 days';\n\n-- Check the row count, then COMMIT; or ROLLBACK;",
  },
  {
    title: 'Delete rows',
    note: 'Foreign keys decide what happens to child rows: ON DELETE CASCADE removes them, the default (NO ACTION) blocks the delete.',
    sql: 'DELETE FROM order_items\nWHERE order_id = 42;',
  },
  {
    title: 'Subquery and EXISTS',
    note: 'EXISTS stops at the first match and handles NULLs safely, unlike NOT IN with a nullable column.',
    sql: 'SELECT u.name\nFROM users AS u\nWHERE NOT EXISTS (\n    SELECT 1\n    FROM orders AS o\n    WHERE o.user_id = u.id\n);',
  },
  {
    title: 'Common table expression (WITH)',
    note: 'A CTE names an intermediate result so a long query reads top to bottom.',
    sql: 'WITH totals AS (\n    SELECT order_id, SUM(quantity * unit_price) AS total\n    FROM order_items\n    GROUP BY order_id\n)\nSELECT o.id, t.total\nFROM orders AS o\nJOIN totals AS t\n    ON t.order_id = o.id\nORDER BY t.total DESC;',
  },
];

export function Reference() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-600/40 bg-emerald-50/60 p-4 text-sm dark:bg-emerald-950/20">
        <p className="font-semibold">Use parameters in application code</p>
        <p className="mt-1 text-slate-700 dark:text-slate-300">
          The values in generated SQL are written as literals so you can read and test it. In an application, pass user input as parameters (
          <code>WHERE email = $1</code> with node-postgres, psycopg, JDBC and so on) instead of building SQL strings. That is what prevents SQL injection.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {EXAMPLES.map((ex) => (
          <article key={ex.title} className="min-w-0 space-y-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">{ex.title}</h3>
              <CopyButton text={ex.sql} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{ex.note}</p>
            <CodeBlock label={`${ex.title} example`}>{ex.sql}</CodeBlock>
          </article>
        ))}
      </div>
    </div>
  );
}
