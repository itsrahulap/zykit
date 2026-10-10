import { useDeferredValue, useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import harViewer from './index';
import { useHar } from './hooks/useHar';
import { PHASES, viewRows, type Group, type HarRow, type Phase, type Sort, type SortKey } from './features/har';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeBlock } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { Notices, OpenFileButton } from '../../shared/ui/convert';
import { DropZone } from '../../shared/ui/DropZone';
import { formatBytes, pluralize } from '../../shared/utils/format.utils';

const ROW_H = 36;
const VIEW_H = 480;
const OVERSCAN = 8;
const MAX_FILE_BYTES = 200 * 1024 * 1024;

const PHASE_COLOR: Record<Phase, string> = {
  blocked: 'bg-slate-400',
  dns: 'bg-teal-500',
  connect: 'bg-amber-500',
  ssl: 'bg-purple-500',
  send: 'bg-sky-400',
  wait: 'bg-emerald-500',
  receive: 'bg-blue-600',
};

const ms = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`);

function makeSample(): string {
  const t0 = Date.parse('2025-03-01T10:00:00Z');
  const defs: [string, string, number, string, number, number, number][] = [
    ['GET', 'https://example.com/', 200, 'text/html', 18_400, 0, 180],
    ['GET', 'https://example.com/app.css', 200, 'text/css', 9_200, 200, 90],
    ['GET', 'https://example.com/app.js', 200, 'application/javascript', 142_000, 200, 420],
    ['GET', 'https://cdn.example.net/logo.png', 200, 'image/png', 30_100, 310, 150],
    ['GET', 'https://cdn.example.net/font.woff2', 200, 'font/woff2', 21_000, 320, 210],
    ['GET', 'https://api.example.com/user?id=7&expand=teams', 200, 'application/json', 1_200, 640, 260],
    ['POST', 'https://api.example.com/events', 204, 'application/json', 0, 900, 75],
    ['GET', 'https://api.example.com/missing', 404, 'application/json', 90, 910, 120],
    ['GET', 'https://stats.example.org/pixel.gif', 200, 'image/gif', 43, 950, 1400],
  ];
  const entries = defs.map(([method, url, status, mime, size, at, time]) => ({
    startedDateTime: new Date(t0 + at).toISOString(),
    time,
    request: {
      method,
      url,
      headers: [{ name: 'Accept', value: '*/*' }],
      queryString: [...new URL(url).searchParams].map(([name, value]) => ({ name, value })),
      ...(method === 'POST' ? { postData: { mimeType: 'application/json', text: '{"event":"open"}' } } : {}),
    },
    response: {
      status,
      headers: [{ name: 'Content-Type', value: mime }],
      content: { size, mimeType: mime, ...(mime.includes('json') && size ? { text: '{"ok":true,"teams":["a","b"]}' } : {}) },
      bodySize: size,
    },
    timings: { blocked: 5, dns: 10, connect: 25, ssl: 15, send: 1, wait: Math.round(time * 0.6), receive: Math.round(time * 0.3) },
  }));
  return JSON.stringify({ log: { version: '1.2', creator: { name: 'Zykit sample', version: '1' }, entries } });
}

function GroupTable({ title, rows }: { title: string; rows: Group[] }) {
  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
        {rows.map((g) => (
          <li key={g.name} className="flex items-baseline justify-between gap-3 py-1.5">
            <span className="min-w-0 truncate text-slate-800 dark:text-slate-200">{g.name}</span>
            <span className="shrink-0 text-slate-500 tabular-nums dark:text-slate-400">
              {g.count} · {formatBytes(g.size)} · {ms(g.time)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const HEADS: [SortKey, string, string][] = [
  ['i', '#', '3.5rem'],
  ['method', 'Method', '5rem'],
  ['url', 'URL', '20rem'],
  ['status', 'Status', '4.5rem'],
  ['type', 'Type', '4.5rem'],
  ['size', 'Size', '5.5rem'],
  ['time', 'Time', '5.5rem'],
];

function statusTone(s: number): 'green' | 'blue' | 'neutral' {
  return s >= 400 || s === 0 ? 'neutral' : s >= 300 ? 'blue' : 'green';
}

function Table({ rows, indices, sort, onSort, selected, onSelect, span }: { rows: HarRow[]; indices: number[]; sort: Sort | null; onSort: (k: SortKey) => void; selected: number | null; onSelect: (i: number) => void; span: number }) {
  const [top, setTop] = useState(0);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget.scrollTop;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setTop(t));
  };
  const start = Math.max(0, Math.floor(top / ROW_H) - OVERSCAN);
  const end = Math.min(indices.length, Math.ceil((top + VIEW_H) / ROW_H) + OVERSCAN);
  const total = Math.max(span, 1);
  return (
    <div
      role="region"
      aria-label="Requests"
      tabIndex={0}
      onScroll={onScroll}
      className="overflow-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      style={{ maxHeight: VIEW_H + 44 }}
    >
      <table className="table-fixed border-separate border-spacing-0 text-sm" style={{ minWidth: '100%', width: '62rem' }} aria-rowcount={indices.length + 1}>
        <colgroup>
          {HEADS.map(([k, , w]) => (
            <col key={k} style={{ width: w }} />
          ))}
          <col />
        </colgroup>
        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950">
          <tr>
            {HEADS.map(([k, label]) => {
              const dir = sort?.key === k ? sort.dir : null;
              return (
                <th key={k} scope="col" aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'} className="border-b border-slate-200 p-0 text-left dark:border-slate-800">
                  <button type="button" onClick={() => onSort(k)} className="flex w-full items-center gap-1 px-3 py-2.5 text-left font-semibold text-slate-900 pointer-coarse:min-h-11 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800">
                    {label}
                    <span aria-hidden="true" className="text-emerald-600 dark:text-emerald-400">
                      {dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : ''}
                    </span>
                  </button>
                </th>
              );
            })}
            <th scope="col" className="border-b border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
              Waterfall
            </th>
          </tr>
        </thead>
        <tbody>
          {start > 0 && (
            <tr aria-hidden="true" style={{ height: start * ROW_H }}>
              <td colSpan={8} />
            </tr>
          )}
          {indices.slice(start, end).map((k, n) => {
            const r = rows[k];
            let at = r.start;
            return (
              <tr key={r.i} aria-rowindex={start + n + 2} aria-selected={selected === r.i} style={{ height: ROW_H }} className={selected === r.i ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-900/40'}>
                <td className="border-b border-slate-100 px-3 text-right font-mono text-xs text-slate-500 dark:border-slate-800">{r.i + 1}</td>
                <td className="border-b border-slate-100 px-3 font-mono text-xs dark:border-slate-800">{r.method}</td>
                <td className="overflow-hidden border-b border-slate-100 p-0 dark:border-slate-800">
                  <button type="button" onClick={() => onSelect(r.i)} title={r.url} className="block w-full truncate px-3 text-left text-emerald-700 pointer-coarse:min-h-11 hover:underline dark:text-emerald-400">
                    {r.url}
                  </button>
                </td>
                <td className="border-b border-slate-100 px-3 dark:border-slate-800">
                  <Badge tone={statusTone(r.status)}>{r.status || 'failed'}</Badge>
                </td>
                <td className="border-b border-slate-100 px-3 dark:border-slate-800">{r.type}</td>
                <td className="border-b border-slate-100 px-3 text-right tabular-nums dark:border-slate-800">{formatBytes(r.size)}</td>
                <td className="border-b border-slate-100 px-3 text-right tabular-nums dark:border-slate-800">{ms(r.time)}</td>
                <td className="border-b border-slate-100 px-3 dark:border-slate-800">
                  <div className="relative h-3" role="img" aria-label={`Starts at ${ms(r.start)}, takes ${ms(r.time)}`}>
                    {PHASES.map((p) => {
                      const w = r.phases[p];
                      const left = at;
                      at += w;
                      return w > 0 ? <span key={p} title={`${p} ${ms(w)}`} className={`absolute inset-y-0 ${PHASE_COLOR[p]}`} style={{ left: `${(left / total) * 100}%`, width: `max(2px, ${(w / total) * 100}%)` }} /> : null;
                    })}
                  </div>
                </td>
              </tr>
            );
          })}
          {end < indices.length && (
            <tr aria-hidden="true" style={{ height: (indices.length - end) * ROW_H }}>
              <td colSpan={8} />
            </tr>
          )}
        </tbody>
      </table>
      {indices.length === 0 && <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No requests match the filter.</p>}
    </div>
  );
}

function Pairs({ title, items }: { title: string; items: [string, string][] }) {
  if (!items.length) return null;
  return (
    <section className="min-w-0">
      <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {title} ({items.length})
      </h3>
      <dl className="divide-y divide-slate-100 font-mono text-xs dark:divide-slate-800">
        {items.map(([k, v], n) => (
          <div key={n} className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:gap-3">
            <dt className="shrink-0 font-semibold text-slate-700 sm:w-48 dark:text-slate-300">{k}</dt>
            <dd className="min-w-0 break-all text-slate-600 dark:text-slate-400">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function HarViewerPage() {
  const har = useHar();
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<Sort | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const dFilter = useDeferredValue(filter);
  const { rows, summary } = har;
  const indices = useMemo(() => (rows ? viewRows(rows, dFilter, sort) : []), [rows, dFilter, sort]);

  const load = (src: { file?: File; text?: string }, name: string, size: number) => {
    setFileError(null);
    if (size > MAX_FILE_BYTES) return setFileError(`${name} is ${formatBytes(size)}; HAR files up to 200 MB can be opened here.`);
    setFile({ name, size });
    setSelected(null);
    setFilter('');
    setSort(null);
    har.load(src);
  };
  const onFile = (f: File) => load({ file: f }, f.name, f.size);
  const select = (i: number) => {
    setSelected(i);
    har.open(i);
  };
  const onSort = (key: SortKey) => setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null));
  const row = selected !== null && rows ? rows[selected] : null;
  const detail = har.detail && har.detail.index === selected ? har.detail.data : null;

  const status = fileError ?? har.error ?? (har.busy ? 'Reading…' : !rows ? 'Open a .har file to inspect its requests.' : `${indices.length === rows.length ? pluralize(rows.length, 'request') : `${indices.length} of ${pluralize(rows.length, 'request')}`} · ${formatBytes(summary?.size ?? 0)} transferred`);

  return (
    <div className="space-y-8">
      <Breadcrumb tool={harViewer} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="at a glance">Network recordings, </Headline>
        <div className="flex flex-wrap gap-3">
          <OpenFileButton accept=".har,.json,application/json" onFile={onFile} />
          <Button variant="secondary" onClick={() => { const t = makeSample(); load({ text: t }, 'sample.har', t.length); }}>
            Try an example
          </Button>
          <Button variant="ghost" disabled={!file} onClick={() => { setFile(null); setSelected(null); har.load(null); }}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <Notices items={['HAR files can contain cookies, authorization headers, tokens and request bodies. This file stays in your browser and is never uploaded, but think twice before sharing a HAR with anyone.']} />

      <StatusStrip status={status} tone={har.busy ? 'busy' : rows ? 'good' : 'neutral'} />

      <DropZone onFile={onFile} label="Drop a .har file to open it">
        {!rows && (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
            Drop a HAR file here, or use Open file. Export one from your browser&rsquo;s DevTools Network tab (&ldquo;Save all as HAR&rdquo;).
          </p>
        )}
        {rows && summary && (
          <div className="space-y-6">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Icon name="search" className="h-4 w-4 shrink-0" />
              <span className="sr-only">Filter requests</span>
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by URL, method, status or type…"
                className="w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <Table rows={rows} indices={indices} sort={sort} onSort={onSort} selected={selected} onSelect={select} span={summary.span} />
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              {PHASES.map((p) => (
                <span key={p} className="inline-flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-sm ${PHASE_COLOR[p]}`} /> {p}
                </span>
              ))}
            </p>
          </div>
        )}
      </DropZone>

      {row && (
        <Panel eyebrow={`Request ${row.i + 1}`} icon="info">
          <div className="space-y-6">
            <DetailRows rows={[['URL', row.url], ['Method', row.method], ['Status', row.status || 'failed'], ['Type', row.type], ['Size', formatBytes(row.size)], ['Total time', ms(row.time)], ...PHASES.filter((p) => row.phases[p] > 0).map((p): [string, string] => [p, ms(row.phases[p])])]} />
            {!detail && <p className="text-sm text-slate-500 dark:text-slate-400">Loading details…</p>}
            {detail && (
              <>
                <Pairs title="Query string" items={detail.query} />
                <Pairs title="Request headers" items={detail.requestHeaders} />
                <Pairs title="Response headers" items={detail.responseHeaders} />
                {detail.postData && (
                  <section className="min-w-0">
                    <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Post data ({detail.postData.mimeType || 'unknown type'})</h3>
                    <CodeBlock label="Post data">{detail.postData.text || '(empty)'}</CodeBlock>
                  </section>
                )}
                {detail.preview && (
                  <section className="min-w-0">
                    <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Response preview</h3>
                    {detail.preview.text && <CodeBlock label="Response preview" className="max-h-96 overflow-y-auto">{detail.preview.text}</CodeBlock>}
                    {detail.preview.note && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{detail.preview.note}</p>}
                  </section>
                )}
              </>
            )}
          </div>
        </Panel>
      )}

      {summary && (
        <Panel eyebrow="Summary" icon="chart">
          <DetailRows rows={[['Requests', String(summary.requests)], ['Transferred', formatBytes(summary.size)], ['Total span', ms(summary.span)], ['Failed (4xx, 5xx, no status)', String(summary.failed)]]} />
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="min-w-0">
              <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Slowest 10</h3>
              <ol className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
                {summary.slowest.map((r) => (
                  <li key={r.i} className="flex items-baseline justify-between gap-3 py-1.5">
                    <button type="button" onClick={() => select(r.i)} title={r.url} className="min-w-0 truncate text-left text-emerald-700 pointer-coarse:min-h-11 hover:underline dark:text-emerald-400">
                      {r.method} {r.url}
                    </button>
                    <span className="shrink-0 text-slate-500 tabular-nums dark:text-slate-400">{ms(r.time)}</span>
                  </li>
                ))}
              </ol>
            </div>
            <GroupTable title="By domain (top 10)" rows={summary.byDomain} />
            <GroupTable title="By type" rows={summary.byType} />
          </div>
        </Panel>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        The file is parsed in a background worker in your browser. Only the rows on screen are drawn, and response bodies are shown as text only.
      </p>
    </div>
  );
}
