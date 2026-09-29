// Dialect list and error-message helpers for the SQL formatter page.

export const DIALECTS = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'transactsql', label: 'SQL Server (T-SQL)' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'redshift', label: 'Amazon Redshift' },
  { value: 'plsql', label: 'Oracle PL/SQL' },
  { value: 'db2', label: 'IBM Db2' },
  { value: 'db2i', label: 'IBM Db2 for i' },
  { value: 'spark', label: 'Spark SQL' },
  { value: 'hive', label: 'Apache Hive' },
  { value: 'trino', label: 'Trino / Presto' },
  { value: 'duckdb', label: 'DuckDB' },
  { value: 'clickhouse', label: 'ClickHouse' },
  { value: 'tidb', label: 'TiDB' },
  { value: 'singlestoredb', label: 'SingleStoreDB' },
  { value: 'n1ql', label: 'Couchbase N1QL' },
] as const;

export type Dialect = (typeof DIALECTS)[number]['value'];

export interface FormatErrorInfo {
  message: string;
  line?: number;
  column?: number;
}

/**
 * sql-formatter throws errors whose message starts with a one-line summary followed by a long
 * grammar dump. Keep the summary and pull out the position.
 */
export function describeFormatError(err: unknown): FormatErrorInfo {
  const raw = err instanceof Error ? err.message : String(err);
  const first = raw.split('\n')[0].trim();
  const pos = /at line (\d+) column (\d+)/.exec(raw);
  const message = first.replace(/\s*at line \d+ column \d+\.?$/, '').replace(/[.:]$/, '') || 'Could not parse this SQL';
  return pos ? { message, line: Number(pos[1]), column: Number(pos[2]) } : { message };
}

/** Character offset of a 1-based line/column in `text` (clamped to the text). */
export function offsetOf(text: string, line: number, column: number): number {
  let offset = 0;
  for (let l = 1; l < line; l++) {
    const nl = text.indexOf('\n', offset);
    if (nl === -1) return text.length;
    offset = nl + 1;
  }
  return Math.min(text.length, offset + Math.max(0, column - 1));
}
