import { useDeferredValue, useMemo, useState } from 'react';
import jsonToSql from './index';
import { collectColumns, DIALECTS, generateSql, type Dialect } from './features/sql';
import { errorSnippet } from '../../shared/lib/textpos';
import { parseJson } from '../json-formatter/features/json';
import { Checkbox, OpenFileButton } from '../../shared/ui/convert';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { formatBytes, pluralize } from '../../shared/utils/format.utils';
import { downloadText, selectInTextarea } from '../../shared/utils/dom.utils';

const MAX_INPUT_CHARS = 10_000_000;
const MAX_PREVIEW_CHARS = 1_000_000;
const INPUT_ID = 'json-sql-input';

const SAMPLE = `[
  { "id": 1, "name": "Ann O'Neil", "email": "ann@example.com", "active": true, "balance": 120.50, "joined": "2024-01-15T09:30:00Z", "prefs": { "theme": "dark" } },
  { "id": 2, "name": "Bo \\"The Builder\\"", "email": null, "active": false, "balance": 0, "joined": "2024-02-01T14:00:00Z" },
  { "id": 3, "name": "Cy\\nSmith", "active": true, "balance": 99.99, "joined": "2024-03-10T08:15:00Z", "tags": ["vip"] }
]`;

const inputClass =
  'min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-950 dark:text-slate-100';

export default function JsonToSqlPage() {
  const [input, setInput] = useState('');
  const [dialect, setDialect] = useState<Dialect>('postgres');
  const [tableName, setTableName] = useState('my_table');
  const [batchText, setBatchText] = useState('100');
  const [includeCreate, setIncludeCreate] = useState(true);
  const [primaryKey, setPrimaryKey] = useState('');

  const text = useDeferredValue(input);
  const stale = text !== input;
  const tooLarge = text.length > MAX_INPUT_CHARS;
  const parsed = useMemo(() => (text.trim() && !tooLarge ? parseJson(text) : null), [text, tooLarge]);
  const columnNames = useMemo(() => {
    if (!parsed?.ok) return [];
    const c = collectColumns(parsed.value);
    return 'names' in c ? c.names : [];
  }, [parsed]);
  const pk = columnNames.includes(primaryKey) ? primaryKey : '';
  const batchSize = Math.max(1, Number.parseInt(batchText, 10) || 1);
  const result = useMemo(
    () => (parsed?.ok ? generateSql(parsed.value, { dialect, tableName, batchSize, includeCreate, primaryKey: pk }) : null),
    [parsed, dialect, tableName, batchSize, includeCreate, pk],
  );

  const status = tooLarge
    ? 'This input is too large to process here (limit: about 10 MB).'
    : !parsed
      ? 'Paste a JSON array of objects to generate SQL.'
      : !parsed.ok
        ? `Invalid JSON: ${parsed.error.message} (line ${parsed.error.line}, column ${parsed.error.column})`
        : result && !result.ok
          ? result.error
          : result?.ok
            ? `${pluralize(result.rows, 'row')} · ${pluralize(result.columns.length, 'column')} · ${pluralize(result.statements, 'statement')}`
            : '';

  const output = result?.ok ? result.sql : '';
  const preview = output.length > MAX_PREVIEW_CHARS ? output.slice(0, MAX_PREVIEW_CHARS) : output;
  const download = () => downloadText(output, `${(tableName.trim() || 'my_table').replace(/[^\w.-]+/g, '_')}.sql`, 'application/sql');

  useIncomingText(jsonToSql.id, (t) => setInput(t));
  useToolShortcuts({ getOutput: () => output, onDownload: () => output && download() });

  return (
    <div className="space-y-8">
      <Breadcrumb tool={jsonToSql} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="SQL">Turn JSON into </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Try an example
          </Button>
          <OpenFileButton accept=".json,application/json" onText={(t) => setInput(t)} />
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={stale ? 'busy' : result?.ok ? 'good' : 'neutral'} />

      <section
        aria-label="SQL options"
        className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <Select<Dialect> label="Dialect" options={DIALECTS} value={dialect} onChange={setDialect} />
        <label className="inline-flex min-w-0 items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          Table name
          <input type="text" value={tableName} onChange={(e) => setTableName(e.target.value)} spellCheck={false} className={`w-36 ${inputClass}`} />
        </label>
        <label className="inline-flex min-w-0 items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          Rows per INSERT
          <input
            type="number"
            min={1}
            max={10000}
            inputMode="numeric"
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            className={`w-24 ${inputClass}`}
          />
        </label>
        <Select<string>
          label="Primary key"
          options={[{ value: '', label: 'None' }, ...columnNames.map((n) => ({ value: n, label: n }))]}
          value={pk}
          onChange={setPrimaryKey}
          disabled={!columnNames.length}
        />
        <Checkbox label="Include CREATE TABLE" checked={includeCreate} onChange={setIncludeCreate} />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          id={INPUT_ID}
          label="Input JSON"
          hint="array of objects"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={18}
          placeholder='[{"id": 1, "name": "Ann"}]'
          aria-invalid={parsed ? !parsed.ok || (result ? !result.ok : false) : undefined}
          onFileText={(t) => setInput(t)}
        />

        <div className="min-w-0 space-y-6">
          {parsed && !parsed.ok && (
            <Panel eyebrow="Syntax error" icon="warn" className="border-red-200 dark:border-red-900">
              <p className="font-medium text-red-800 dark:text-red-300">{parsed.error.message}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Line {parsed.error.line}, column {parsed.error.column}
              </p>
              <CodeBlock className="mt-4 whitespace-pre! break-normal! overflow-x-auto">{errorSnippet(text, parsed.error)}</CodeBlock>
              <button
                type="button"
                onClick={() => selectInTextarea(INPUT_ID, parsed.error.offset)}
                className="mt-4 text-sm font-semibold text-emerald-700 underline-offset-4 pointer-coarse:min-h-11 hover:underline dark:text-emerald-400"
              >
                Jump to error in input
              </button>
            </Panel>
          )}

          {result && !result.ok && (
            <Panel eyebrow="Can’t convert" icon="warn" className="border-red-200 dark:border-red-900">
              <p className="font-medium text-red-800 dark:text-red-300">{result.error}</p>
            </Panel>
          )}

          {result?.ok && (
            <>
              <section aria-label="SQL output" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                  <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Icon name="database" className="h-4 w-4" /> SQL
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
                  <CodeBlock className="max-h-[36rem] overflow-y-auto">{preview}</CodeBlock>
                  {preview.length < output.length && (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      Showing the first {formatBytes(MAX_PREVIEW_CHARS)} of the output. Copy or download to get all of it.
                    </p>
                  )}
                </div>
              </section>

              {result.warnings.length > 0 && (
                <ul className="space-y-1 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  {result.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}

              <Panel eyebrow="Columns" icon="database">
                <dl className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
                  {result.columns.map((c) => (
                    <div key={c.name} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5">
                      <dt className="min-w-0 break-all font-mono text-slate-700 dark:text-slate-300">{c.name}</dt>
                      <dd className="min-w-0 break-words font-mono text-slate-900 dark:text-slate-100">
                        {c.sqlType}
                        {c.nullable ? '' : ' NOT NULL'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Panel>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Converted in your browser; nothing is uploaded. Identifiers are always quoted and every string is escaped for the chosen dialect.
      </p>
    </div>
  );
}
