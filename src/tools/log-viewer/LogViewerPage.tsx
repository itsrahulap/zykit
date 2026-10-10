import { useDeferredValue, useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import logViewer from './index';
import { detectFields, filterLog, LEVELS, levelCounts, parseLog, parseTime, prettyEntry, toNdjson, type Level } from './features/log';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { OpenFileButton } from '../../shared/ui/convert';
import { DropZone } from '../../shared/ui/DropZone';
import { downloadText } from '../../shared/utils/dom.utils';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { formatBytes, pluralize } from '../../shared/utils/format.utils';

const ROW_H = 32;
const VIEW_H = 480;
const OVERSCAN = 10;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_TEXTAREA_CHARS = 1_000_000;

const LEVEL_STYLE: Record<Level, string> = {
  trace: 'text-slate-500 dark:text-slate-400',
  debug: 'text-slate-600 dark:text-slate-300',
  info: 'text-sky-700 dark:text-sky-300',
  warn: 'text-amber-700 dark:text-amber-300',
  error: 'text-red-700 dark:text-red-300',
  fatal: 'font-bold text-red-800 dark:text-red-200',
  other: 'text-slate-500 dark:text-slate-400',
};

function makeSample(): string {
  const lines: string[] = [];
  const t0 = Date.parse('2025-03-01T10:00:00Z');
  for (let i = 0; i < 300; i++) {
    const level = i % 50 === 0 ? 'error' : i % 9 === 0 ? 'warn' : i % 4 === 0 ? 'debug' : 'info';
    lines.push(JSON.stringify({ time: new Date(t0 + i * 1500).toISOString(), level, msg: level === 'error' ? 'request failed' : 'handled request', user: { id: i % 5 }, path: `/api/items/${i}`, ms: (i * 37) % 400 }));
  }
  lines.splice(3, 0, '2025-03-01T10:00:04Z WARN legacy line from plain text', '    at stack frame one');
  return lines.join('\n');
}

const input = 'w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-900 dark:text-slate-100';

export default function LogViewerPage() {
  const [source, setSource] = useState('');
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [levels, setLevels] = useState<Set<Level>>(() => new Set());
  const [text, setText] = useState('');
  const [fields, setFields] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const [top, setTop] = useState(0);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const dSource = useDeferredValue(source);
  // shortcut: parsed on the main thread (file cap 50 MB); move to a worker if bigger logs matter.
  const entries = useMemo(() => parseLog(dSource), [dSource]);
  const counts = useMemo(() => levelCounts(entries), [entries]);
  const fieldInfo = useMemo(() => detectFields(entries), [entries]);
  const dText = useDeferredValue(text);
  const dFields = useDeferredValue(fields);
  const indices = useMemo(
    () => filterLog(entries, { levels, text: dText, fields: dFields, from: from ? parseTime(from) : null, to: to ? parseTime(to) : null }),
    [entries, levels, dText, dFields, from, to],
  );

  const reset = () => {
    setLevels(new Set());
    setText('');
    setFields('');
    setFrom('');
    setTo('');
    setOpen(null);
    setTop(0);
  };
  const openText = (t: string, f: File) => {
    setFile({ name: f.name, size: f.size });
    reset();
    setSource(t);
  };
  useIncomingText(logViewer.id, (t) => setSource(t));

  const toggle = (l: Level) =>
    setLevels((s) => {
      const n = new Set(s);
      if (n.has(l)) n.delete(l);
      else n.add(l);
      return n;
    });
  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget.scrollTop;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setTop(t));
  };
  const exportView = () => downloadText(toNdjson(entries, indices), `${(file?.name ?? 'logs').replace(/\.[^.]+$/, '')}-filtered.ndjson`, 'application/x-ndjson');

  const start = Math.max(0, Math.floor(top / ROW_H) - OVERSCAN);
  const end = Math.min(indices.length, Math.ceil((top + VIEW_H) / ROW_H) + OVERSCAN);
  const opened = open !== null ? entries[open] : null;
  const status = !entries.length
    ? 'Open or paste a log file (JSON Lines or plain text) to view it.'
    : `${indices.length === entries.length ? pluralize(entries.length, 'entry', 'entries') : `${indices.length} of ${pluralize(entries.length, 'entry', 'entries')}`} · ${pluralize(fieldInfo.length, 'field')} detected`;
  const big = source.length > MAX_TEXTAREA_CHARS;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={logViewer} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="made searchable">Log files, </Headline>
        <div className="flex flex-wrap gap-3">
          <OpenFileButton accept=".log,.ndjson,.jsonl,.txt,application/x-ndjson,text/plain" onText={openText} maxBytes={MAX_FILE_BYTES} />
          <Button variant="secondary" onClick={() => { setFile(null); reset(); setSource(makeSample()); }}>
            Try an example
          </Button>
          <Button variant="ghost" disabled={!source} onClick={() => { setSource(''); setFile(null); reset(); }}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={entries.length ? 'good' : 'neutral'} />

      <DropZone onText={openText} maxBytes={MAX_FILE_BYTES}>
        {big ? (
          <p className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Icon name="file" className="h-4 w-4 shrink-0" />
            <span className="truncate">{file ? `${file.name} · ${formatBytes(file.size)}` : `Pasted text · ${formatBytes(source.length)}`}</span>
          </p>
        ) : (
          <CodeArea
            label="Log input"
            hint={file ? `${file.name} · ${formatBytes(file.size)}` : 'Paste here, or open a file'}
            value={source}
            onChange={(e) => {
              setFile(null);
              setSource(e.target.value);
            }}
            rows={entries.length ? 4 : 10}
            placeholder={'{"time":"2025-01-01T10:00:00Z","level":"info","msg":"hello"}\n2025-01-01T10:00:01Z ERROR something failed'}
          />
        )}
      </DropZone>

      {entries.length > 0 && (
        <>
          <section aria-label="Filters" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <div role="group" aria-label="Levels" className="flex flex-wrap gap-2">
              {LEVELS.filter((l) => counts[l] > 0).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={levels.has(l)}
                  onClick={() => toggle(l)}
                  className={`rounded-full border px-3 py-1 text-sm pointer-coarse:min-h-11 ${levels.has(l) ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' : 'border-slate-300 dark:border-slate-700'} ${LEVEL_STYLE[l]}`}
                >
                  {l} <span className="tabular-nums">{counts[l].toLocaleString('en-US')}</span>
                </button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="min-w-0 text-sm text-slate-600 dark:text-slate-400">
                Contains text
                <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="timeout" className={`mt-1 ${input}`} />
              </label>
              <label className="min-w-0 text-sm text-slate-600 dark:text-slate-400">
                Field filters (field=value, space separated)
                <input type="text" value={fields} onChange={(e) => setFields(e.target.value)} placeholder="user.id=3 path=/api" className={`mt-1 ${input}`} />
              </label>
              <label className="min-w-0 text-sm text-slate-600 dark:text-slate-400">
                From (your local time)
                <input type="datetime-local" step="1" value={from} onChange={(e) => setFrom(e.target.value)} className={`mt-1 ${input}`} />
              </label>
              <label className="min-w-0 text-sm text-slate-600 dark:text-slate-400">
                To (your local time)
                <input type="datetime-local" step="1" value={to} onChange={(e) => setTo(e.target.value)} className={`mt-1 ${input}`} />
              </label>
            </div>
            {fieldInfo.length > 0 && (
              <p className="text-xs break-words text-slate-500 dark:text-slate-400">
                Detected fields: {fieldInfo.map((f) => f.name).join(', ')}
              </p>
            )}
            <Button variant="secondary" onClick={exportView} disabled={!indices.length}>
              <Icon name="download" className="h-4 w-4" /> Export filtered NDJSON
            </Button>
          </section>

          <div role="region" aria-label="Log entries" tabIndex={0} onScroll={onScroll} className="overflow-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" style={{ maxHeight: VIEW_H }}>
            <div style={{ height: indices.length * ROW_H, minWidth: '36rem' }} className="relative">
              {indices.slice(start, end).map((k, n) => {
                const e = entries[k];
                return (
                  <button
                    key={k}
                    type="button"
                    aria-expanded={open === k}
                    aria-controls="log-detail"
                    onClick={() => setOpen(open === k ? null : k)}
                    style={{ position: 'absolute', left: 0, top: (start + n) * ROW_H, height: ROW_H }}
                    className={`flex w-full items-center gap-3 border-b border-slate-100 px-3 text-left font-mono text-xs pointer-coarse:min-h-11 hover:bg-emerald-50/60 dark:border-slate-800 dark:hover:bg-emerald-950/40 ${open === k ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''}`}
                  >
                    <span className="w-10 shrink-0 text-right text-slate-500">{k + 1}</span>
                    <span className="w-44 shrink-0 truncate text-slate-500 dark:text-slate-400">{e.timeText}</span>
                    <span className={`w-12 shrink-0 uppercase ${LEVEL_STYLE[e.level]}`}>{e.level}</span>
                    <span className="min-w-0 flex-1 truncate text-slate-800 dark:text-slate-200">{e.message.split('\n')[0] || e.raw}</span>
                  </button>
                );
              })}
            </div>
            {indices.length === 0 && <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No entries match the filters.</p>}
          </div>

          {opened && (
            <div id="log-detail">
              <Panel eyebrow={`Entry ${opened.i + 1}${opened.fields ? ' · JSON' : ' · text'}`} icon="braces">
                <div className="mb-3 flex justify-end">
                  <CopyButton text={prettyEntry(opened)} />
                </div>
                <CodeBlock label="Entry" className="max-h-96 overflow-y-auto">{prettyEntry(opened)}</CodeBlock>
              </Panel>
            </div>
          )}
        </>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Logs are read in your browser and never uploaded. Lines starting with &ldquo;{'{'}&rdquo; are read as JSON; other lines as an ISO timestamp
        followed by an optional level. Only the rows on screen are drawn.
      </p>
    </div>
  );
}
