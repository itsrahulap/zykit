import { useMemo, useRef, useState, type ReactNode } from 'react';
import urlParser from './index';
import { defaultPort, hostToUnicode, paramRows, parseUrl, pathSegments, rebuild, safeDecode, type ParamRow } from './features/url';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { DropZone } from '../../shared/ui/DropZone';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CopyButton } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

const INPUT =
  'w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-900 dark:text-slate-100';

const SAMPLE = 'https://user:s3cret@münchen.example:8443/shop/items/%F0%9F%8D%95?q=pizza&tag=hot&tag=cheap&note=a%20b#reviews';

const SMALL_BTN =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 pointer-coarse:min-h-11 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800';

function Value({ text, display }: { text: string; display?: ReactNode }) {
  if (!text) return <span className="text-slate-500 dark:text-slate-400">(none)</span>;
  return (
    <span className="inline-flex max-w-full flex-wrap items-center justify-end gap-1">
      <span className="break-all font-mono text-sm">{display ?? text}</span>
      <CopyButton text={text} />
    </span>
  );
}

export default function UrlParserPage() {
  const [input, setInput] = useState('');
  const [base, setBase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [edits, setEdits] = useState<{ href: string; rows: ParamRow[] } | null>(null);
  const nextId = useRef(1_000_000);

  const parsed = useMemo(() => (input.trim() ? parseUrl(input, base) : null), [input, base]);
  const url = parsed?.ok ? parsed.url : null;
  const rows = useMemo(() => (url ? (edits && edits.href === url.href ? edits.rows : paramRows(url)) : []), [url, edits]);
  const rebuilt = url ? rebuild(url, rows) : '';

  useIncomingText(urlParser.id, (t) => setInput(t.trim()));
  useShareState({ input, base }, (r) => {
    if (r.input !== undefined) setInput(r.input);
    if (r.base !== undefined) setBase(r.base);
  });
  useToolShortcuts({ getOutput: () => rebuilt });

  const setRows = (next: ParamRow[]) => url && setEdits({ href: url.href, rows: next });
  const updateRow = (id: number, patch: Partial<ParamRow>) => setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const status = !parsed
    ? 'Paste a URL to break it into parts.'
    : !parsed.ok
      ? parsed.error
      : `Valid ${url!.protocol.replace(':', '').toUpperCase()} URL${parsed.relative ? ' (resolved against the base)' : ''} · ${pluralize(rows.length, 'query parameter')}`;

  const unicodeHost = url ? hostToUnicode(url.hostname) : '';
  const segs = url ? pathSegments(url) : [];
  const dp = url ? defaultPort(url.protocol) : undefined;

  const passwordCell = !url ? null : url.password ? (
    <span className="inline-flex max-w-full flex-wrap items-center justify-end gap-1">
      <span className="break-all font-mono text-sm" data-testid="password">
        {showPassword ? safeDecode(url.password) : '•'.repeat(8)}
      </span>
      <button type="button" className={SMALL_BTN} aria-pressed={showPassword} onClick={() => setShowPassword((v) => !v)}>
        {showPassword ? 'Hide' : 'Show'}
      </button>
      <CopyButton text={safeDecode(url.password)} />
    </span>
  ) : (
    <Value text="" />
  );
  const portCell = !url ? null : url.port ? (
    <Value text={url.port} />
  ) : dp ? (
    <span className="text-sm">
      <span className="font-mono">{dp}</span> <span className="text-slate-500 dark:text-slate-400">(default)</span>
    </span>
  ) : (
    <Value text="" />
  );

  return (
    <div className="space-y-8">
      <Breadcrumb tool={urlParser} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="apart">Take any URL </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Try an example
          </Button>
          <Button variant="ghost" disabled={!input && !base} onClick={() => (setInput(''), setBase(''))}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={parsed?.ok ? 'good' : 'neutral'} />

      <section aria-label="Input" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <DropZone onText={(t) => setInput(t.trim())}>
          <label className="block">
            <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">URL</span>
            <input
              type="text"
              inputMode="url"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://example.com/path?key=value#section"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-invalid={parsed ? !parsed.ok : undefined}
              className={INPUT}
            />
          </label>
        </DropZone>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-600 dark:text-slate-400">Base URL (optional, for relative URLs)</span>
          <input
            type="text"
            inputMode="url"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            placeholder="https://example.com/docs/"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className={INPUT}
          />
        </label>
        {parsed && !parsed.ok && (
          <p
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          >
            {parsed.error}
          </p>
        )}
      </section>

      {url && (
        <>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Panel eyebrow="Parts" icon="link" className="min-w-0">
              <DetailRows
                rows={[
                  ['Full URL', <Value key="Full URL" text={url.href} />],
                  ['Origin', <Value key="Origin" text={url.origin === 'null' ? '' : url.origin} />],
                  ['Protocol', <Value key="Protocol" text={url.protocol} />],
                  ['Username', <Value key="Username" text={safeDecode(url.username)} />],
                  ['Password', passwordCell],
                  ['Host', <Value key="Host" text={url.host} />],
                  ['Hostname', <Value key="Hostname" text={url.hostname} />],
                  ...(unicodeHost !== url.hostname
                    ? ([['Hostname (Unicode)', <Value key="Hostname (Unicode)" text={unicodeHost} />]] as [string, ReactNode][])
                    : []),
                  ['Port', portCell],
                  ['Path', <Value key="Path" text={url.pathname} />],
                  ['Query', <Value key="Query" text={url.search} />],
                  ['Hash', <Value key="Hash" text={url.hash} display={url.hash ? `#${safeDecode(url.hash.slice(1))}` : undefined} />],
                ]}
              />
            </Panel>

            <Panel eyebrow="Path segments" icon="layers" className="min-w-0">
              {segs.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">The path is just “/”.</p>
              ) : (
                <ol aria-label="Path segments" className="space-y-2">
                  {segs.map((s, i) => (
                    <li key={i} className="flex items-baseline gap-3 text-sm">
                      <span className="w-6 shrink-0 text-right text-slate-500">{i + 1}</span>
                      <span className="min-w-0 break-all font-mono text-slate-900 dark:text-slate-100">
                        {s || <span className="text-slate-500 dark:text-slate-400">(empty — trailing slash)</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>

          <section
            aria-label="Query parameters"
            className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Icon name="grid" className="h-4 w-4" /> Query parameters
              </h2>
              <button type="button" className={SMALL_BTN} onClick={() => setRows([...rows, { id: nextId.current++, key: '', value: '' }])}>
                + Add parameter
              </button>
            </header>
            <div className="space-y-3 p-6">
              {rows.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No query parameters.</p>}
              {rows.map((r, i) => (
                <div key={r.id} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_2fr_auto]">
                  <input
                    aria-label={`Key ${i + 1}`}
                    value={r.key}
                    onChange={(e) => updateRow(r.id, { key: e.target.value })}
                    placeholder="key"
                    spellCheck={false}
                    className={`${INPUT} col-span-1`}
                  />
                  <input
                    aria-label={`Value ${i + 1}`}
                    value={r.value}
                    onChange={(e) => updateRow(r.id, { value: e.target.value })}
                    placeholder="value"
                    spellCheck={false}
                    className={`${INPUT} col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto`}
                  />
                  <button
                    type="button"
                    aria-label={`Remove parameter ${i + 1}`}
                    onClick={() => setRows(rows.filter((x) => x.id !== r.id))}
                    className="col-start-2 row-start-1 inline-flex items-center justify-center rounded-lg px-2.5 text-slate-500 pointer-coarse:min-h-11 pointer-coarse:min-w-11 hover:bg-slate-100 hover:text-red-700 sm:col-start-auto dark:hover:bg-slate-800 dark:hover:text-red-300"
                  >
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="eyebrow text-slate-600 dark:text-slate-400">Rebuilt URL</span>
                <div className="flex flex-wrap items-center gap-1">
                  <CopyButton text={rebuilt} />
                  <SendToMenu text={rebuilt} kind="url" />
                  <button type="button" className={SMALL_BTN} disabled={rebuilt === url.href} onClick={() => setInput(rebuilt)}>
                    Use as input
                  </button>
                </div>
              </div>
              <p
                data-testid="rebuilt-url"
                className="break-all rounded-2xl bg-slate-100 p-4 font-mono text-sm text-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                {rebuilt}
              </p>
            </div>
          </section>
        </>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Parsed with your browser&rsquo;s URL API, exactly as <code>fetch</code> and links would see it. International host names are shown in their
        punycode (ASCII) form as well as Unicode. Nothing is requested or uploaded.
      </p>
    </div>
  );
}
