import { useDeferredValue, useMemo, useState } from 'react';
import jsonpathQuery from './index';
import { BOOKSTORE, EXAMPLES, MAX_RESULTS } from './features/jsonpath-query';
import { TIMEOUT_MS, useJsonPath } from './hooks/useJsonPath';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton } from '../../shared/ui/tool';
import { ErrorPanel, OpenFileButton } from '../../shared/ui/convert';
import { Select } from '../../shared/ui/Select';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';
import { downloadText } from '../../shared/utils/dom.utils';

const JSON_ID = 'jsonpath-json';
const QUERY_ID = 'jsonpath-query';
/** Matches rendered on screen; copy and download get every returned match. */
const MAX_SHOWN = 300;
const MAX_VALUE_CHARS = 4000;

function show(v: unknown): string {
  const s = JSON.stringify(v, null, 2) ?? 'undefined';
  return s.length > MAX_VALUE_CHARS ? `${s.slice(0, MAX_VALUE_CHARS)}\n…` : s;
}

export default function JsonpathQueryPage() {
  const [json, setJson] = useState('');
  const [query, setQuery] = useState('$');
  const deferredJson = useDeferredValue(json);
  const state = useJsonPath(deferredJson, query);
  const result = state.status === 'done' ? state.result : null;
  const matches = useMemo(() => (result?.ok ? result.matches : []), [result]);

  const output = useMemo(() => (result?.ok ? JSON.stringify(result.matches.map((m) => m.value), null, 2) : ''), [result]);
  const pathsText = useMemo(() => matches.map((m) => m.path).join('\n'), [matches]);
  const download = () => downloadText(output, 'jsonpath-results.json', 'application/json');

  useIncomingText(jsonpathQuery.id, (t) => setJson(t));
  useToolShortcuts({ getOutput: () => output, onDownload: () => output && download() });
  useShareState({ json, query }, (s) => {
    if (s.json !== undefined) setJson(s.json);
    if (s.query !== undefined) setQuery(s.query);
  });

  const status =
    state.status === 'idle'
      ? json.trim()
        ? 'Type a JSONPath query, like $.store.book[*].author'
        : 'Paste JSON and type a JSONPath query, or try the bookstore example.'
      : state.status === 'running'
        ? 'Running…'
        : state.status === 'timeout'
          ? `Stopped after ${TIMEOUT_MS / 1000} s — a match() or search() pattern may be backtracking, or the document is very large.`
          : state.status === 'crash'
            ? state.message
            : result!.ok
              ? `${pluralize(result!.total, 'match', 'matches')}`
              : result!.where === 'json'
                ? `Invalid JSON: ${result!.error.message}`
                : `Invalid query: ${result!.error.message} (column ${result!.error.column})`;

  const loadExample = () => {
    setJson(BOOKSTORE);
    setQuery(EXAMPLES[0].query);
  };

  return (
    <div className="space-y-8">
      <Breadcrumb tool={jsonpathQuery} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="JSONPath">Query JSON with </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={loadExample}>
            Try an example
          </Button>
          <OpenFileButton accept=".json,application/json" onText={(t) => setJson(t)} />
          <Button variant="ghost" disabled={!json} onClick={() => setJson('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={state.status === 'running' ? 'busy' : result?.ok ? 'good' : 'neutral'} />

      <section aria-label="Query" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <label className="block">
          <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">JSONPath query</span>
          <input
            id={QUERY_ID}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-invalid={result && !result.ok && result.where === 'query' ? true : undefined}
            placeholder="$.store.book[?@.price < 10].title"
            className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 pointer-coarse:min-h-11 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Select<string>
            label="Examples"
            placeholder="Load an example…"
            options={EXAMPLES.map((e) => ({ value: e.query, label: e.label }))}
            onChange={(q) => {
              if (!json.trim()) setJson(BOOKSTORE);
              setQuery(q);
            }}
          />
          <p className="min-w-0 text-sm text-slate-500 dark:text-slate-400">
            RFC 9535: <code>$</code> <code>.name</code> <code>['name']</code> <code>*</code> <code>..</code> <code>[0]</code> <code>[-1]</code>{' '}
            <code>[1:5:2]</code> <code>[?@.a &gt; 1 &amp;&amp; @.b == 'x']</code> and <code>length() count() match() search() value()</code>
          </p>
        </div>
      </section>

      {result && !result.ok && result.where === 'query' && <ErrorPanel title="Query error" error={result.error} text={query} inputId={QUERY_ID} />}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          id={JSON_ID}
          label="JSON"
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={20}
          placeholder='{"paste": "your JSON here"}'
          aria-invalid={result && !result.ok && result.where === 'json' ? true : undefined}
          onFileText={(t) => setJson(t)}
        />

        <div className="min-w-0 space-y-6">
          {result && !result.ok && result.where === 'json' && <ErrorPanel error={result.error} text={deferredJson} inputId={JSON_ID} />}

          {result?.ok && (
            <section aria-label="Results" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
                <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Icon name="search" className="h-4 w-4" /> Results
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold normal-case tracking-normal text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {result.total.toLocaleString('en-US')}
                  </span>
                </h2>
                <div className="flex flex-wrap items-center gap-1">
                  <CopyButton text={output} label="Copy values" />
                  <CopyButton text={pathsText} label="Copy paths" />
                  <SendToMenu text={output} kind="json" />
                  <button
                    type="button"
                    onClick={download}
                    disabled={!output}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 pointer-coarse:min-h-11 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Icon name="download" className="h-4 w-4" /> Download .json
                  </button>
                </div>
              </header>
              {matches.length === 0 ? (
                <p className="p-6 text-sm text-slate-600 dark:text-slate-400">No nodes match this query.</p>
              ) : (
                <ol aria-label="Matches" className="max-h-[40rem] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                  {matches.slice(0, MAX_SHOWN).map((m, i) => (
                    <li key={i} className="space-y-2 px-4 py-3 sm:px-6">
                      <p className="break-all font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">{m.path}</p>
                      <CodeBlock className="max-h-60 overflow-y-auto p-3! text-xs!">{show(m.value)}</CodeBlock>
                    </li>
                  ))}
                </ol>
              )}
              {(matches.length > MAX_SHOWN || result.total > MAX_RESULTS) && (
                <p className="border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:px-6 dark:border-slate-800 dark:text-slate-400">
                  Showing the first {Math.min(MAX_SHOWN, matches.length).toLocaleString('en-US')} of {result.total.toLocaleString('en-US')} matches.
                  {result.total > MAX_RESULTS && ` Copy and download include the first ${MAX_RESULTS.toLocaleString('en-US')}.`}
                </p>
              )}
            </section>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Queries follow RFC 9535 and run in your browser; filters are interpreted, never executed as code, and nothing is uploaded. Object key order
        follows JavaScript, so numeric-looking keys come first.
      </p>
    </div>
  );
}
