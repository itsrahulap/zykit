import type { SqlValue, TableSchema } from '../features/csv-sql';

export interface TableSource {
  /** Table name (already sanitised and unique). */
  name: string;
  /** A file (read in the worker) or pasted text. */
  data: File | string;
  /** File name or "pasted", shown in the sidebar. */
  source: string;
  /** Force a delimiter (TSV files); otherwise detected. */
  tab?: boolean;
}

export type SqlRequest =
  | { id: number; type: 'load'; tables: TableSource[]; allText: boolean }
  | { id: number; type: 'drop'; name: string }
  | { id: number; type: 'query'; sql: string }
  | { id: number; type: 'export'; format: 'csv' | 'json' };

export interface QueryResult {
  columns: string[];
  /** First MAX_DISPLAY_ROWS rows. */
  rows: SqlValue[][];
  /** Rows the last statement returned (may exceed what's kept). */
  total: number;
  /** Rows kept for export. */
  kept: number;
  /** Rows changed by INSERT/UPDATE/DELETE statements. */
  changes: number;
  statements: number;
  ms: number;
}

export type SqlResponse =
  | { id: number; type: 'loaded'; tables: TableSchema[]; notices: string[] }
  | { id: number; type: 'result'; result: QueryResult; tables?: TableSchema[] }
  | { id: number; type: 'exported'; text: string }
  | { id: number; type: 'error'; message: string; tables?: TableSchema[] };
