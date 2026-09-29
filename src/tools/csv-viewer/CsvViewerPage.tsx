import { useDeferredValue, useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import csvViewer from './index';
import { useCsvTable } from './hooks/useCsvTable';
import { viewRows, type ColumnInfo, type Table } from './features/table';
import { DELIMITER_LABELS, writeCsv, type CsvDelimiter } from '../../shared/lib/csv';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea } from '../../shared/ui/tool';
import { Select } from '../../shared/ui/Select';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { Checkbox, Notices, OpenFileButton, OptionsCard } from '../../shared/ui/convert';
import { downloadText } from '../../shared/utils/dom.utils';
import { formatBytes } from '../../shared/utils/format.utils';

const ROW_H = 36;
const VIEW_H = 560;
const OVERSCAN = 10;
/** Pasted/opened text above this size isn't mirrored into the textarea (it would be slow). */
const MAX_TEXTAREA_CHARS = 1_000_000;
const MAX_FILE_BYTES = 200 * 1024 * 1024;

function makeSample(): string {
  const cities = ['Lisbon', 'Porto', 'Berlin', 'Paris', 'Oslo', 'Rome', 'Madrid', 'Vienna'];
  const lines = ['id,name,city,signed_up,active,score'];
  for (let i = 1; i <= 2000; i++) {
    const day = String((i % 28) + 1).padStart(2, '0');
    const month = String((i % 12) + 1).padStart(2, '0');
    lines.push(`${i},User ${i},${cities[i % cities.length]},2024-${month}-${day},${i % 3 === 0 ? 'false' : 'true'},${i % 7 === 0 ? '' : ((i * 37) % 1000) / 10}`);
  }
  return lines.join('\n');
}

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 4 });
const count = (n: number, one: string) => `${fmt(n)} ${n === 1 ? one : `${one}s`}`;

function statRows(c: ColumnInfo): [string, string][] {
  const rows: [string, string][] = [
    ['Type', c.type],
    ['Values', fmt(c.count - c.empty)],
    ['Empty', fmt(c.empty)],
    ['Unique', fmt(c.unique)],
  ];
  if (c.type === 'number' && c.min !== undefined) rows.push(['Min', fmt(c.min)], ['Max', fmt(c.max ?? 0)], ['Mean', fmt(c.mean ?? 0)]);
  if (c.minText !== undefined) rows.push(['First (A→Z)', c.minText], ['Last (A→Z)', c.maxText ?? '']);
  return rows;
}

type Sort = { column: number; dir: 'asc' | 'desc' } | null;

function DataTable({
  table,
  indices,
  visible,
  sort,
  onSort,
  filters,
  onFilter,
}: {
  table: Table;
  indices: number[];
  visible: number[];
  sort: Sort;
  onSort: (c: number) => void;
  filters: Record<number, string>;
  onFilter: (c: number, v: string) => void;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [copied, setCopied] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  useEffect(() => {
    if (copied === null) return;
    const t = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setScrollTop(top));
  };

  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const end = Math.min(indices.length, Math.ceil((scrollTop + VIEW_H) / ROW_H) + OVERSCAN);
  const slice = indices.slice(start, end);
  const numWidth = `${Math.max(3, String(table.rows.length).length) + 2}ch`;

  const copyRow = async (r: number) => {
    try {
      await navigator.clipboard.writeText(writeCsv([visible.map((c) => table.rows[r][c] ?? '')], { delimiter: table.delimiter }));
      setCopied(r);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div
      ref={box}
      onScroll={onScroll}
      role="region"
      aria-label="Data table"
      tabIndex={0}
      className="relative overflow-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      style={{ maxHeight: VIEW_H + 90 }}
    >
      <table className="table-fixed border-separate border-spacing-0 text-sm" style={{ minWidth: '100%' }} aria-rowcount={indices.length + 1}>
        <colgroup>
          <col style={{ width: numWidth }} />
          <col style={{ width: '3rem' }} />
          {visible.map((c) => (
            <col key={c} style={{ width: `${table.columns[c].width + 3}ch` }} />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950">
          <tr>
            <th scope="col" className="border-b border-slate-200 px-2 py-2 text-right font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
              #
            </th>
            <th scope="col" className="border-b border-slate-200 dark:border-slate-800">
              <span className="sr-only">Copy</span>
            </th>
            {visible.map((c) => {
              const col = table.columns[c];
              const dir = sort?.column === c ? sort.dir : null;
              return (
                <th
                  key={c}
                  scope="col"
                  aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}
                  className="border-b border-slate-200 p-0 text-left dark:border-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => onSort(c)}
                    title={`Sort by ${col.name}`}
                    className="flex w-full items-center gap-1 px-3 pt-2 pb-1 text-left font-semibold text-slate-900 pointer-coarse:min-h-11 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="truncate">{col.name}</span>
                    <span aria-hidden="true" className="shrink-0 text-emerald-600 dark:text-emerald-400">
                      {dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : ''}
                    </span>
                  </button>
                  <span className="block px-3 pb-1 text-xs font-normal text-slate-500 dark:text-slate-400">{col.type}</span>
                </th>
              );
            })}
          </tr>
          <tr>
            <td className="border-b border-slate-200 dark:border-slate-800" />
            <td className="border-b border-slate-200 dark:border-slate-800" />
            {visible.map((c) => (
              <td key={c} className="border-b border-slate-200 px-1.5 py-1.5 dark:border-slate-800">
                <input
                  type="search"
                  aria-label={`Filter ${table.columns[c].name}`}
                  placeholder="Filter…"
                  value={filters[c] ?? ''}
                  onChange={(e) => onFilter(c, e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {start > 0 && (
            <tr aria-hidden="true" style={{ height: start * ROW_H }}>
              <td colSpan={visible.length + 2} />
            </tr>
          )}
          {slice.map((r, k) => (
            <tr key={r} aria-rowindex={start + k + 2} style={{ height: ROW_H }} className="odd:bg-white even:bg-slate-50/60 hover:bg-emerald-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-900/40 dark:hover:bg-emerald-950/40">
              <td className="border-b border-slate-100 px-2 text-right font-mono text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">{r + 1}</td>
              <td className="border-b border-slate-100 text-center dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => copyRow(r)}
                  aria-label={`Copy row ${r + 1}`}
                  title="Copy row"
                  className="inline-flex h-7 w-7 pointer-coarse:h-9 pointer-coarse:w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                  <Icon name={copied === r ? 'check' : 'copy'} className="h-3.5 w-3.5" />
                </button>
              </td>
              {visible.map((c) => {
                const v = table.rows[r][c] ?? '';
                return (
                  <td
                    key={c}
                    title={v.length > table.columns[c].width ? v : undefined}
                    className={`overflow-hidden border-b border-slate-100 px-3 text-ellipsis whitespace-nowrap text-slate-800 dark:border-slate-800 dark:text-slate-200 ${
                      table.columns[c].type === 'number' ? 'text-right tabular-nums' : ''
                    }`}
                  >
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
          {end < indices.length && (
            <tr aria-hidden="true" style={{ height: (indices.length - end) * ROW_H }}>
              <td colSpan={visible.length + 2} />
            </tr>
          )}
        </tbody>
      </table>
      {indices.length === 0 && <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No rows match the filters.</p>}
    </div>
  );
}

export default function CsvViewerPage() {
  const [source, setSource] = useState('');
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [delimiter, setDelimiter] = useState<CsvDelimiter | 'auto'>('auto');
  const [header, setHeader] = useState(true);
  const [global, setGlobal] = useState('');
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [sort, setSort] = useState<Sort>(null);
  const [hidden, setHidden] = useState<Set<number>>(() => new Set());
  const [statColumn, setStatColumn] = useState(0);
  const [readError, setReadError] = useState<string | null>(null);

  const { table, busy, error } = useCsvTable(source, delimiter, header);

  // Column-dependent state is reset whenever a new table arrives.
  const [tableSeen, setTableSeen] = useState<Table | null>(null);
  if (table !== tableSeen) {
    setTableSeen(table);
    setFilters({});
    setSort(null);
    setHidden(new Set());
    setStatColumn(0);
  }

  const dGlobal = useDeferredValue(global);
  const dFilters = useDeferredValue(filters);
  const visible = useMemo(() => (table ? table.headers.map((_, i) => i).filter((i) => !hidden.has(i)) : []), [table, hidden]);
  const indices = useMemo(
    () => (table ? viewRows(table.rows, table.columns, { global: dGlobal, columnFilters: dFilters, searchColumns: visible, sort }) : []),
    [table, dGlobal, dFilters, visible, sort],
  );
  const filtering = dGlobal !== global || dFilters !== filters;

  const openFile = (f: File) => {
    setReadError(null);
    if (f.size > MAX_FILE_BYTES) {
      setReadError(`${f.name} is ${formatBytes(f.size)}; the limit is ${formatBytes(MAX_FILE_BYTES)}.`);
      return;
    }
    f.text().then(
      (t) => {
        setFile({ name: f.name, size: f.size });
        if (/\.tsv$/i.test(f.name)) setDelimiter('\t');
        setSource(t);
      },
      () => setReadError(`Couldn't read ${f.name}.`),
    );
  };

  const onSort = (c: number) =>
    setSort((s) => (s?.column !== c ? { column: c, dir: 'asc' } : s.dir === 'asc' ? { column: c, dir: 'desc' } : null));

  const exportView = () => {
    if (!table) return;
    const rows = [visible.map((c) => table.headers[c]), ...indices.map((r) => visible.map((c) => table.rows[r][c] ?? ''))];
    const name = (file?.name ?? 'table.csv').replace(/\.[^.]+$/, '');
    const tsv = table.delimiter === '\t';
    downloadText(writeCsv(rows, { delimiter: table.delimiter }), `${name}-filtered.${tsv ? 'tsv' : 'csv'}`, tsv ? 'text/tab-separated-values' : 'text/csv');
  };

  const status = error
    ? error
    : busy
      ? 'Parsing…'
      : !table
        ? 'Open or paste a CSV or TSV file to view it as a table.'
        : `${indices.length === table.rows.length ? count(table.rows.length, 'row') : `${fmt(indices.length)} of ${count(table.rows.length, 'row')}`} · ${count(table.headers.length, 'column')} · ${DELIMITER_LABELS[table.delimiter].toLowerCase()}-separated`;

  const bigSource = source.length > MAX_TEXTAREA_CHARS;
  const notices = [
    ...(readError ? [readError] : []),
    ...(table?.truncated ? ['Only the first 1,000,000 rows are shown.'] : []),
    ...(table?.issues.slice(0, 3).map((i) => `Line ${i.line}: ${i.message}`) ?? []),
  ];
  const stat = table?.columns[statColumn];

  return (
    <div className="space-y-8">
      <Breadcrumb tool={csvViewer} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="at a glance">Big CSV files, </Headline>
        <div className="flex flex-wrap gap-3">
          <OpenFileButton accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" onFile={openFile} />
          <Button
            variant="secondary"
            onClick={() => {
              setFile(null);
              setSource(makeSample());
            }}
          >
            Try an example
          </Button>
          <Button
            variant="ghost"
            disabled={!source}
            onClick={() => {
              setSource('');
              setFile(null);
              setGlobal('');
            }}
          >
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={busy || filtering ? 'busy' : table ? 'good' : 'neutral'} />

      <Notices items={notices} />

      {bigSource ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <p className="flex min-w-0 items-center gap-2">
            <Icon name="file" className="h-4 w-4 shrink-0" />
            <span className="truncate">{file ? `${file.name} · ${formatBytes(file.size)}` : `Pasted text · ${formatBytes(source.length)}`}</span>
          </p>
        </div>
      ) : (
        <CodeArea
          label="CSV input"
          hint={file ? `${file.name} · ${formatBytes(file.size)}` : 'Paste here, or open a file'}
          value={source}
          onChange={(e) => {
            setFile(null);
            setSource(e.target.value);
          }}
          rows={table ? 4 : 10}
          placeholder={'name,age\nAnn,30\nBob,25'}
        />
      )}

      {table && (
        <>
          <OptionsCard label="Table options">
            <Select<CsvDelimiter | 'auto'>
              label="Delimiter"
              options={[
                { value: 'auto', label: 'Detect' },
                ...(Object.keys(DELIMITER_LABELS) as CsvDelimiter[]).map((d) => ({ value: d, label: DELIMITER_LABELS[d] })),
              ]}
              value={delimiter}
              onChange={setDelimiter}
            />
            <Checkbox label="First row is a header" checked={header} onChange={setHeader} />
            <label className="flex min-w-0 flex-1 basis-56 items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Icon name="search" className="h-4 w-4 shrink-0" />
              <span className="sr-only">Search all columns</span>
              <input
                type="search"
                value={global}
                onChange={(e) => setGlobal(e.target.value)}
                placeholder="Search all columns…"
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <Button variant="secondary" onClick={exportView} disabled={!indices.length || !visible.length}>
              <Icon name="download" className="h-4 w-4" /> Export view
            </Button>
          </OptionsCard>

          <details className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800 pointer-coarse:min-h-11 dark:text-slate-200">
              Columns ({visible.length} of {table.headers.length} shown)
            </summary>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {table.headers.map((h, i) => (
                <Checkbox
                  key={i}
                  label={h}
                  checked={!hidden.has(i)}
                  onChange={(on) =>
                    setHidden((prev) => {
                      const next = new Set(prev);
                      if (on) next.delete(i);
                      else next.add(i);
                      return next;
                    })
                  }
                />
              ))}
            </div>
          </details>

          <DataTable
            table={table}
            indices={indices}
            visible={visible}
            sort={sort}
            onSort={onSort}
            filters={filters}
            onFilter={(c, v) => setFilters((f) => ({ ...f, [c]: v }))}
          />

          {stat && (
            <Panel eyebrow="Column stats" icon="chart">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Select<number>
                  label="Column"
                  options={table.headers.map((h, i) => ({ value: i, label: h }))}
                  value={statColumn}
                  onChange={setStatColumn}
                />
                <Badge tone={stat.type === 'number' ? 'blue' : stat.type === 'text' ? 'neutral' : 'green'}>{stat.type}</Badge>
              </div>
              <DetailRows rows={statRows(stat)} />
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Stats cover every row, not just the filtered view.</p>
            </Panel>
          )}
        </>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Files are parsed in a background worker in your browser and never uploaded. Only the rows on screen are drawn, so tables with hundreds of
        thousands of rows stay responsive.
      </p>
    </div>
  );
}
