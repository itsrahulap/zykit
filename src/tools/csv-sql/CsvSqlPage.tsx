import { useEffect, useMemo, useRef, useState, type DragEvent, type UIEvent } from 'react';
import csvSql from './index';
import { useSqlDb } from './hooks/useSqlDb';
import { displayValue, exampleQueries, MAX_DISPLAY_ROWS, SAMPLE_CUSTOMERS, SAMPLE_ORDERS, type SqlValue, type TableSchema } from './features/csv-sql';
import type { QueryResult } from './workers/sql.protocol';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea } from '../../shared/ui/tool';
import { Select } from '../../shared/ui/Select';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { Checkbox, Notices } from '../../shared/ui/convert';
import { Panel } from '../../shared/ui/Panel';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { downloadText } from '../../shared/utils/dom.utils';
import { formatBytes } from '../../shared/utils/format.utils';

const ROW_H = 36;
const VIEW_H = 480;
const OVERSCAN = 10;
const fmt = (n: number) => n.toLocaleString('en-US');
const pluralize = (n: number, one: string) => `${fmt(n)} ${n === 1 ? one : `${one}s`}`;
const smallButton =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium pointer-coarse:min-h-11 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800';

function SchemaSidebar({ tables, onDrop, onInsert }: { tables: TableSchema[]; onDrop: (name: string) => void; onInsert: (text: string) => void }) {
  return (
    <Panel eyebrow="Tables" icon="database" className="min-w-0 sm:p-6!">
      {tables.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No tables yet. Add a CSV or TSV file, paste one, or load the sample data.</p>
      ) : (
        <ul className="space-y-4" aria-label="Loaded tables">
          {tables.map((t) => (
            <li key={t.name} className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onInsert(t.name)}
                  title="Insert the table name into the query"
                  className="min-w-0 break-all text-left font-mono text-sm font-semibold text-slate-900 pointer-coarse:min-h-11 hover:text-emerald-700 dark:text-slate-100 dark:hover:text-emerald-400"
                >
                  {t.name}
                </button>
                <button
                  type="button"
                  onClick={() => onDrop(t.name)}
                  aria-label={`Remove table ${t.name}`}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 pointer-coarse:h-11 pointer-coarse:w-11 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <Icon name="x" className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pluralize(t.rowCount, 'row')} · {pluralize(t.columns.length, 'column')}
                {t.source && <span className="break-all"> · {t.source}</span>}
              </p>
              <ul className="mt-2 space-y-0.5 border-l border-slate-200 pl-3 dark:border-slate-800">
                {t.columns.map((c) => (
                  <li key={c.name} className="flex items-baseline justify-between gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => onInsert(/^[A-Za-z_][A-Za-z0-9_]*$/.test(c.name) ? c.name : `"${c.name.replace(/"/g, '""')}"`)}
                      className="min-w-0 break-all text-left font-mono text-slate-700 pointer-coarse:min-h-11 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
                    >
                      {c.name}
                    </button>
                    <span className="shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400">{c.type}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ResultTable({ result }: { result: QueryResult }) {
  const [scrollTop, setScrollTop] = useState(0);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setScrollTop(top));
  };
  const { rows, columns } = result;
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const end = Math.min(rows.length, Math.ceil((scrollTop + VIEW_H) / ROW_H) + OVERSCAN);
  const numeric = useMemo(() => columns.map((_, c) => rows.slice(0, 50).some((r) => typeof r[c] === 'number')), [columns, rows]);
  const cell = (v: SqlValue, c: number) => (
    <td
      key={c}
      title={typeof v === 'string' && v.length > 40 ? v : undefined}
      className={`max-w-[24rem] overflow-hidden border-b border-slate-100 px-3 text-ellipsis whitespace-nowrap dark:border-slate-800 ${
        v === null ? 'text-slate-400 italic dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
      } ${numeric[c] ? 'text-right tabular-nums' : ''}`}
    >
      {displayValue(v)}
    </td>
  );
  return (
    <div
      onScroll={onScroll}
      role="region"
      aria-label="Query results"
      tabIndex={0}
      className="relative overflow-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      style={{ maxHeight: VIEW_H + 44 }}
    >
      <table className="border-separate border-spacing-0 text-sm" style={{ minWidth: '100%' }} aria-rowcount={rows.length + 1}>
        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950">
          <tr>
            <th scope="col" className="border-b border-slate-200 px-2 py-2 text-right font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
              #
            </th>
            {columns.map((c, i) => (
              <th key={i} scope="col" className="border-b border-slate-200 px-3 py-2 text-left font-semibold whitespace-nowrap text-slate-900 dark:border-slate-800 dark:text-slate-100">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {start > 0 && (
            <tr aria-hidden="true" style={{ height: start * ROW_H }}>
              <td colSpan={columns.length + 1} />
            </tr>
          )}
          {rows.slice(start, end).map((r, k) => (
            <tr key={start + k} aria-rowindex={start + k + 2} style={{ height: ROW_H }} className="odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-900/40">
              <td className="border-b border-slate-100 px-2 text-right font-mono text-xs text-slate-500 dark:border-slate-800">{start + k + 1}</td>
              {r.map(cell)}
            </tr>
          ))}
          {end < rows.length && (
            <tr aria-hidden="true" style={{ height: (rows.length - end) * ROW_H }}>
              <td colSpan={columns.length + 1} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function CsvSqlPage() {
  const [allText, setAllText] = useState(false);
  const db = useSqlDb(allText);
  const [sql, setSql] = useState('');
  const [paste, setPaste] = useState('');
  const [pasteName, setPasteName] = useState('pasted');
  const [showPaste, setShowPaste] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const suggested = useRef(false);
  const depth = useRef(0);
  const examples = useMemo(() => exampleQueries(db.tables), [db.tables]);
  const busy = db.busy !== null;

  // Suggest a first query once there's a table and the editor is empty.
  useEffect(() => {
    if (suggested.current || !db.tables.length) return;
    suggested.current = true;
    if (!sql) setSql(examples[0].sql);
  }, [db.tables.length, examples, sql]);

  useIncomingText(csvSql.id, (text) => void db.add([{ data: text, source: 'pasted.csv' }]));

  const run = () => {
    if (db.busy || !sql.trim()) return;
    void db.run(sql);
  };
  useToolShortcuts({ onRun: run });

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length) void db.add(list.map((f) => ({ data: f, source: f.name })));
  };

  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
  const dropBind = {
    onDragEnter: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      setDragging(true);
    },
    onDragOver: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (!depth.current) setDragging(false);
    },
    onDrop: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
  };

  const insert = (text: string) => {
    const el = document.getElementById('sql-editor') as HTMLTextAreaElement | null;
    if (!el) return setSql((s) => s + text);
    const { selectionStart: a, selectionEnd: b } = el;
    const next = sql.slice(0, a) + text + sql.slice(b);
    setSql(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + text.length, a + text.length);
    });
  };

  const exportAs = async (format: 'csv' | 'json') => {
    const text = await db.exportResult(format);
    if (text !== null) downloadText(text, `query-result.${format}`, format === 'csv' ? 'text/csv' : 'application/json');
  };

  const r = db.result;
  const status =
    db.busy === 'loading'
      ? 'Loading tables…'
      : db.busy === 'query'
        ? 'Running query…'
        : r
          ? `${pluralize(r.total, 'row')}${r.changes ? `, ${pluralize(r.changes, 'row')} changed` : ''} in ${r.ms < 10 ? r.ms.toFixed(1) : Math.round(r.ms)} ms`
          : db.tables.length
            ? `${pluralize(db.tables.length, 'table')} loaded. Write a query and press Run.`
            : 'Add a CSV file to start.';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={csvSql} />
      <div className="space-y-3">
        <Headline accent="SQL">Query CSV with </Headline>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">
          Load CSV or TSV files as tables in an in-browser SQLite database, then filter, join and aggregate them with SQL. The files never leave this tab.
        </p>
      </div>
      <StatusStrip status={status} tone={busy ? 'busy' : r ? 'good' : 'neutral'} />

      <section
        aria-label="Add data"
        {...dropBind}
        data-dragging={dragging || undefined}
        className="relative rounded-3xl border border-dashed border-slate-300 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".csv,.tsv,.tab,.txt,text/csv,text/tab-separated-values,text/plain"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            data-testid="file-input"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <Button onClick={() => fileInput.current?.click()} disabled={busy}>
            <Icon name="upload" className="h-4 w-4" /> Add CSV files
          </Button>
          <Button variant="secondary" onClick={() => setShowPaste((v) => !v)} aria-expanded={showPaste}>
            Paste CSV
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() =>
              void db.add([
                { data: SAMPLE_CUSTOMERS, source: 'customers.csv' },
                { data: SAMPLE_ORDERS, source: 'orders.csv' },
              ])
            }
          >
            Load sample data
          </Button>
          <span className="text-sm text-slate-500 dark:text-slate-400">or drop files here · up to {formatBytes(200 * 1024 * 1024)} in total</span>
        </div>
        <div className="mt-3">
          <Checkbox label="Import every column as TEXT (no type detection)" checked={allText} onChange={setAllText} />
        </div>
        {showPaste && (
          <div className="mt-4 space-y-3">
            <CodeArea label="CSV text" value={paste} onChange={(e) => setPaste(e.target.value)} rows={6} placeholder={'id,name\n1,Ada'} />
            <div className="flex flex-wrap items-end gap-3">
              <label className="block min-w-0">
                <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Table name</span>
                <input
                  value={pasteName}
                  onChange={(e) => setPasteName(e.target.value)}
                  className="w-48 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>
              <Button
                variant="secondary"
                disabled={!paste.trim() || busy}
                onClick={() => {
                  void db.add([{ data: paste, source: pasteName.trim() || 'pasted' }]);
                  setPaste('');
                  setShowPaste(false);
                }}
              >
                Add table
              </Button>
            </div>
          </div>
        )}
        {dragging && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-emerald-500 bg-emerald-50/90 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200"
          >
            <Icon name="upload" className="h-5 w-5" /> Drop CSV files to add them as tables
          </div>
        )}
      </section>

      <Notices items={db.notices} />

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <SchemaSidebar tables={db.tables} onDrop={(n) => void db.drop(n)} onInsert={insert} />
        <div className="min-w-0 space-y-4">
          <section aria-label="Query" className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <CodeArea
              id="sql-editor"
              label="SQL query"
              hint="Ctrl/⌘ + Enter runs it"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={8}
              placeholder="SELECT * FROM my_table LIMIT 100;"
            />
            <div className="flex flex-wrap items-center gap-3">
              {db.busy === 'query' ? (
                <Button variant="secondary" onClick={() => void db.cancel()}>
                  <Icon name="stop" className="h-4 w-4" /> Cancel
                </Button>
              ) : (
                <Button onClick={run} disabled={!sql.trim() || busy}>
                  <Icon name="play" className="h-4 w-4" /> Run
                </Button>
              )}
              <Select label="Examples" placeholder="Insert an example…" options={examples.map((e, i) => ({ value: i, label: e.label }))} onChange={(i) => setSql(examples[i].sql)} />
            </div>
          </section>

          {db.error && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
              <Icon name="warn" className="h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Error</p>
                <p className="mt-0.5 font-mono break-words" data-testid="sql-error">
                  {db.error}
                </p>
              </div>
              <button type="button" onClick={db.dismissError} className="rounded p-0.5 pointer-coarse:min-h-11 hover:bg-red-100 dark:hover:bg-red-900" aria-label="Dismiss error">
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
          )}

          {r && (
            <section aria-label="Results" aria-busy={busy} className={`min-w-0 space-y-3 ${busy ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="eyebrow flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Icon name="grid" className="h-4 w-4" /> Results
                  <Badge tone="green">{pluralize(r.total, 'row')}</Badge>
                  <Badge>{r.ms < 10 ? r.ms.toFixed(1) : fmt(Math.round(r.ms))} ms</Badge>
                </h2>
                <div className="flex flex-wrap items-center gap-1">
                  <button type="button" className={smallButton} disabled={!r.columns.length || busy} onClick={() => void exportAs('csv')}>
                    <Icon name="download" className="h-4 w-4" /> Export CSV
                  </button>
                  <button type="button" className={smallButton} disabled={!r.columns.length || busy} onClick={() => void exportAs('json')}>
                    <Icon name="download" className="h-4 w-4" /> Export JSON
                  </button>
                </div>
              </div>
              {r.columns.length ? (
                <>
                  <ResultTable result={r} />
                  {(r.total > r.rows.length || r.kept < r.total) && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Showing the first {fmt(Math.min(MAX_DISPLAY_ROWS, r.rows.length))} of {fmt(r.total)} rows.{' '}
                      {r.kept < r.total ? `Export includes the first ${fmt(r.kept)} rows.` : 'Export includes all of them.'}
                    </p>
                  )}
                </>
              ) : (
                <p className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {pluralize(r.statements, 'statement')} ran{r.changes ? `, ${pluralize(r.changes, 'row')} changed` : ''}. Nothing to show.
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
