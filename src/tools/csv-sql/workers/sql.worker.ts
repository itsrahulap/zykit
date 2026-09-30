// SQLite (sql.js, WebAssembly) in a dedicated worker. This worker's script is served with its
// own CSP that adds 'wasm-unsafe-eval' (see vercel.json); the page's policy never has it.
// The .wasm is a same-origin asset, and nothing here performs other network requests.

import initSqlJs, { type Database, type SqlValue as RawValue } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { parseCsv, stripBom } from '../../../shared/lib/csv';
import {
  coerce,
  columnNames,
  createTableSql,
  inferTypes,
  mayChangeSchema,
  MAX_DISPLAY_ROWS,
  MAX_EXPORT_ROWS,
  quoteIdent,
  resultToCsv,
  resultToJson,
  type ColumnSchema,
  type SqlType,
  type SqlValue,
  type TableSchema,
} from '../features/csv-sql';
import type { QueryResult, SqlRequest, SqlResponse, TableSource } from './sql.protocol';

interface WorkerScope {
  postMessage(message: SqlResponse): void;
  onmessage: ((event: MessageEvent<SqlRequest>) => void) | null;
}
const ctx = self as unknown as WorkerScope;

let dbPromise: Promise<Database> | null = null;
const sources = new Map<string, string>();
let last: { columns: string[]; rows: SqlValue[][] } | null = null;

function db(): Promise<Database> {
  dbPromise ??= initSqlJs({ locateFile: () => wasmUrl }).then((SQL) => new SQL.Database());
  return dbPromise;
}

const toValue = (v: RawValue): SqlValue => (v instanceof Uint8Array ? `[BLOB ${v.length} bytes]` : v);

function schema(d: Database): TableSchema[] {
  const res = d.exec("SELECT name FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' ORDER BY rowid");
  const names = (res[0]?.values ?? []).map((r) => String(r[0]));
  return names.map((name) => {
    const cols = d.exec(`PRAGMA table_info(${quoteIdent(name)})`)[0]?.values ?? [];
    const columns: ColumnSchema[] = cols.map((c) => ({ name: String(c[1]), type: (String(c[2] || 'TEXT').toUpperCase() as SqlType) }));
    const count = Number(d.exec(`SELECT COUNT(*) FROM ${quoteIdent(name)}`)[0]?.values[0]?.[0] ?? 0);
    return { name, columns, rowCount: count, source: sources.get(name.toLowerCase()) ?? '' };
  });
}

async function loadTable(d: Database, t: TableSource, allText: boolean, notices: string[]) {
  const raw = typeof t.data === 'string' ? t.data : await t.data.text();
  const text = stripBom(raw);
  if (text.slice(0, 8192).includes('\u0000')) throw new Error(`${t.source} doesn't look like a CSV file (it contains binary data).`);
  const parsed = parseCsv(text, { delimiter: t.tab ? '\t' : 'auto' });
  const [header, ...rows] = parsed.rows;
  if (!header) throw new Error(`${t.source} is empty.`);
  const names = columnNames(header);
  const types = inferTypes(rows, names.length, allText);
  const columns = names.map((name, i) => ({ name, type: types[i] }));
  d.run(`DROP TABLE IF EXISTS ${quoteIdent(t.name)}`);
  d.run(createTableSql(t.name, columns));
  const stmt = d.prepare(`INSERT INTO ${quoteIdent(t.name)} VALUES (${columns.map(() => '?').join(', ')})`);
  let extra = 0;
  d.run('BEGIN');
  try {
    for (const r of rows) {
      if (r.length > columns.length) extra++;
      stmt.run(columns.map((c, i) => coerce(r[i], c.type)));
    }
    d.run('COMMIT');
  } catch (err) {
    d.run('ROLLBACK');
    throw err;
  } finally {
    stmt.free();
  }
  sources.set(t.name.toLowerCase(), t.source);
  if (extra) notices.push(`${t.source}: ${extra.toLocaleString('en-US')} rows had more fields than the header; the extra fields were dropped.`);
  for (const issue of parsed.issues.slice(0, 3)) notices.push(`${t.source}, line ${issue.line}: ${issue.message}`);
}

function runQuery(d: Database, sql: string): QueryResult {
  const t0 = performance.now();
  let columns: string[] = [];
  let rows: SqlValue[][] = [];
  let total = 0;
  let statements = 0;
  let changes = 0;
  for (const stmt of d.iterateStatements(sql)) {
    statements++;
    try {
      const cols = stmt.getColumnNames();
      if (cols.length) {
        columns = cols;
        rows = [];
        total = 0;
        while (stmt.step()) {
          total++;
          if (rows.length < MAX_EXPORT_ROWS) rows.push(stmt.get().map(toValue));
        }
      } else {
        while (stmt.step());
        changes += d.getRowsModified();
      }
    } finally {
      stmt.free();
    }
  }
  const ms = performance.now() - t0;
  last = { columns, rows };
  return { columns, rows: rows.slice(0, MAX_DISPLAY_ROWS), total, kept: rows.length, changes, statements, ms };
}

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

ctx.onmessage = async (event: MessageEvent<SqlRequest>) => {
  const req = event.data;
  const { id } = req;
  let d: Database;
  try {
    d = await db();
  } catch {
    ctx.postMessage({ id, type: 'error', message: "The SQL engine couldn't start in this browser (WebAssembly is unavailable or blocked)." });
    return;
  }
  try {
    if (req.type === 'load') {
      const notices: string[] = [];
      for (const t of req.tables) await loadTable(d, t, req.allText, notices);
      ctx.postMessage({ id, type: 'loaded', tables: schema(d), notices });
    } else if (req.type === 'drop') {
      d.run(`DROP TABLE IF EXISTS ${quoteIdent(req.name)}`);
      sources.delete(req.name.toLowerCase());
      ctx.postMessage({ id, type: 'loaded', tables: schema(d), notices: [] });
    } else if (req.type === 'query') {
      const result = runQuery(d, req.sql);
      ctx.postMessage({ id, type: 'result', result, tables: mayChangeSchema(req.sql) ? schema(d) : undefined });
    } else if (req.type === 'export') {
      if (!last) throw new Error('Run a query first.');
      const text = req.format === 'csv' ? resultToCsv(last.columns, last.rows) : resultToJson(last.columns, last.rows);
      ctx.postMessage({ id, type: 'exported', text });
    }
  } catch (err) {
    const tables = req.type === 'query' && mayChangeSchema(req.sql) ? schema(d) : undefined;
    ctx.postMessage({ id, type: 'error', message: message(err), tables });
  }
};
