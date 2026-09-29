import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import sqlFormatter from './index';
import { minifySql } from './features/minify';
import { DIALECTS, describeFormatError, type Dialect, type FormatErrorInfo } from './features/options';
import { offsetOf } from '../../shared/lib/textpos';
import { Checkbox, OpenFileButton } from '../../shared/ui/convert';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { formatBytes, pluralize } from '../../shared/utils/format.utils';
import { downloadText, selectInTextarea } from '../../shared/utils/dom.utils';

type Action = 'format' | 'minify';
type Case = 'preserve' | 'upper' | 'lower';
type IndentChoice = '2' | '4' | 'tab';
type LogicalNewline = 'before' | 'after';
type FormatFn = typeof import('sql-formatter').format;

const INPUT_ID = 'sql-input';
const MAX_INPUT_CHARS = 5_000_000;

const SAMPLE = `-- Monthly revenue per active customer
select c.id, c.name, date_trunc('month', o.created_at) as order_month, sum(o.total) as revenue, count(*) filter (where o.status = 'refunded') as refunds
from customers c join orders o on o.customer_id = c.id
where c.active = true and o.created_at >= now() - interval '1 year' or c.vip = true
group by c.id, c.name, order_month having sum(o.total) > 1000 order by revenue desc limit 50;
update customers set last_seen = now() where id in (select customer_id from sessions where started_at > now() - interval '1 day');`;

const CASES: { value: Case; label: string }[] = [
  { value: 'preserve', label: 'Preserve' },
  { value: 'upper', label: 'UPPER' },
  { value: 'lower', label: 'lower' },
];
const CASE_VALUES = CASES.map((c) => c.value);

// The formatter is ~200 KB, so it is fetched only when this page opens.
let formatterPromise: Promise<FormatFn> | null = null;
const loadFormatter = () => (formatterPromise ??= import('sql-formatter').then((m) => m.format));


export default function SqlFormatterPage() {
  const [input, setInput] = useState('');
  const [action, setAction] = useState<Action>('format');
  const [dialect, setDialect] = useState<Dialect>('postgresql');
  const [keywordCase, setKeywordCase] = useState<Case>('upper');
  const [identifierCase, setIdentifierCase] = useState<Case>('preserve');
  const [indent, setIndent] = useState<IndentChoice>('2');
  const [linesBetween, setLinesBetween] = useState(1);
  const [dense, setDense] = useState(false);
  const [logicalNewline, setLogicalNewline] = useState<LogicalNewline>('before');
  const [stripComments, setStripComments] = useState(false);
  const [format, setFormat] = useState<FormatFn | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let alive = true;
    loadFormatter().then(
      (fn) => alive && setFormat(() => fn),
      () => alive && setLoadError('The formatter could not be loaded. Check your connection and reload the page.'),
    );
    return () => {
      alive = false;
    };
  }, []);

  const text = useDeferredValue(input);
  const stale = text !== input;
  const tooLarge = text.length > MAX_INPUT_CHARS;

  const result = useMemo((): { output: string } | { error: FormatErrorInfo } | null => {
    if (!text.trim() || tooLarge) return null;
    if (action === 'minify') return { output: minifySql(text, { dialect, stripComments }) };
    if (!format) return null;
    try {
      return {
        output: format(text, {
          language: dialect,
          keywordCase,
          identifierCase,
          dataTypeCase: keywordCase,
          functionCase: keywordCase,
          tabWidth: indent === '4' ? 4 : 2,
          useTabs: indent === 'tab',
          linesBetweenQueries: linesBetween,
          denseOperators: dense,
          logicalOperatorNewline: logicalNewline,
        }),
      };
    } catch (e) {
      return { error: describeFormatError(e) };
    }
  }, [text, tooLarge, action, dialect, stripComments, format, keywordCase, identifierCase, indent, linesBetween, dense, logicalNewline]);

  const output = result && 'output' in result ? result.output : '';
  const error = result && 'error' in result ? result.error : null;
  const dialectLabel = DIALECTS.find((d) => d.value === dialect)?.label ?? dialect;

  const download = () => downloadText(output, action === 'minify' ? 'minified.sql' : 'formatted.sql', 'application/sql');

  useIncomingText(sqlFormatter.id, (t) => setInput(t));
  useToolShortcuts({ getOutput: () => output, onDownload: () => output && download() });
  useShareState(
    { input, action, dialect, keywordCase, identifierCase, indent, linesBetween, dense, logicalNewline, stripComments },
    (s) => {
      if (s.input !== undefined) setInput(s.input);
      if (s.action) setAction(s.action);
      if (s.dialect) setDialect(s.dialect);
      if (s.keywordCase) setKeywordCase(s.keywordCase);
      if (s.identifierCase) setIdentifierCase(s.identifierCase);
      if (s.indent) setIndent(s.indent);
      if (s.linesBetween !== undefined) setLinesBetween(s.linesBetween);
      if (s.dense !== undefined) setDense(s.dense);
      if (s.logicalNewline) setLogicalNewline(s.logicalNewline);
      if (s.stripComments !== undefined) setStripComments(s.stripComments);
    },
    {
      action: ['format', 'minify'],
      dialect: DIALECTS.map((d) => d.value),
      keywordCase: CASE_VALUES,
      identifierCase: CASE_VALUES,
      indent: ['2', '4', 'tab'],
      linesBetween: [0, 1, 2, 3],
      logicalNewline: ['before', 'after'],
    },
  );

  const status = loadError
    ? loadError
    : tooLarge
      ? 'This input is too large to format here (limit: about 5 MB).'
      : !text.trim()
        ? 'Paste SQL to format or minify it.'
        : error
          ? `Could not parse as ${dialectLabel}: ${error.message}${error.line ? ` (line ${error.line}, column ${error.column})` : ''}`
          : !result
            ? 'Loading the formatter…'
            : `${action === 'minify' ? 'Minified' : 'Formatted'} · ${pluralize(output.split('\n').length, 'line')} · ${formatBytes(new TextEncoder().encode(output).length)}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={sqlFormatter} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="readable">Make SQL </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Try an example
          </Button>
          <OpenFileButton accept=".sql,.txt,application/sql" onText={(t) => setInput(t)} />
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={stale || (!result && text.trim() && !tooLarge && !loadError) ? 'busy' : output ? 'good' : 'neutral'} />

      <section
        aria-label="Formatting options"
        className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <Segmented<Action>
          label="Action"
          options={[
            { value: 'format', label: 'Format' },
            { value: 'minify', label: 'Minify' },
          ]}
          value={action}
          onChange={setAction}
        />
        <Select<Dialect> label="Dialect" options={[...DIALECTS]} value={dialect} onChange={setDialect} />
        {action === 'format' ? (
          <>
            <Select<Case> label="Keywords" options={CASES} value={keywordCase} onChange={setKeywordCase} />
            <Select<Case> label="Identifiers" options={CASES} value={identifierCase} onChange={setIdentifierCase} />
            <Segmented<IndentChoice>
              label="Indent"
              options={[
                { value: '2', label: '2 spaces' },
                { value: '4', label: '4 spaces' },
                { value: 'tab', label: 'Tab' },
              ]}
              value={indent}
              onChange={setIndent}
            />
            <Select<number>
              label="Blank lines between queries"
              options={[0, 1, 2, 3].map((n) => ({ value: n, label: String(n) }))}
              value={linesBetween}
              onChange={setLinesBetween}
            />
            <div className="inline-flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span aria-hidden="true">AND / OR</span>
              <Segmented<LogicalNewline>
                label="Line break around AND / OR"
                options={[
                  { value: 'before', label: 'Break before' },
                  { value: 'after', label: 'Break after' },
                ]}
                value={logicalNewline}
                onChange={setLogicalNewline}
              />
            </div>
            <Checkbox
              label={
                <>
                  Dense operators (<code>a=b</code>)
                </>
              }
              checked={dense}
              onChange={setDense}
            />
          </>
        ) : (
          <Checkbox label="Remove comments (optimizer hints are kept)" checked={stripComments} onChange={setStripComments} />
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          id={INPUT_ID}
          label="Input SQL"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={18}
          placeholder="SELECT * FROM users WHERE id = 1;"
          aria-invalid={error ? true : undefined}
          onFileText={(t) => setInput(t)}
        />

        <div className="min-w-0 space-y-6">
          {error && (
            <Panel eyebrow="Could not format" icon="warn" className="border-red-200 dark:border-red-900">
              <p role="alert" className="font-medium break-words text-red-800 dark:text-red-300">
                {error.message}
              </p>
              {error.line !== undefined && error.column !== undefined && (
                <>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Line {error.line}, column {error.column}
                  </p>
                  <button
                    type="button"
                    onClick={() => selectInTextarea(INPUT_ID, offsetOf(text, error.line!, error.column!))}
                    className="mt-4 text-sm font-semibold text-emerald-700 underline-offset-4 pointer-coarse:min-h-11 hover:underline dark:text-emerald-400"
                  >
                    Jump to error in input
                  </button>
                </>
              )}
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                Check the dialect ({dialectLabel}) matches your database, or use Minify, which doesn&rsquo;t need to understand the query.
              </p>
            </Panel>
          )}

          {output && (
            <section aria-label="Output" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Icon name="database" className="h-4 w-4" /> {action === 'minify' ? 'Minified' : 'Formatted'}
                </h2>
                <div className="flex flex-wrap items-center gap-1">
                  <CopyButton text={output} />
                  <SendToMenu text={output} kind="sql" />
                  <button
                    type="button"
                    onClick={download}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 pointer-coarse:min-h-11 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Icon name="download" className="h-4 w-4" /> Download .sql
                  </button>
                </div>
              </header>
              <div className="p-4">
                <CodeBlock className="max-h-[36rem] overflow-y-auto">{output}</CodeBlock>
              </div>
            </section>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Your SQL is formatted in your browser and never uploaded. String literals and quoted identifiers are kept exactly as written.
      </p>
    </div>
  );
}
