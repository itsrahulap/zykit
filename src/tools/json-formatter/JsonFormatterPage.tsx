import { useDeferredValue, useMemo, useState } from 'react';
import jsonFormatter from './index';
import { errorSnippet, formatJson, parseJson, utf8Length, type Indent } from './features/json';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { formatBytes, pluralize } from '../../shared/utils/format.utils';

type Action = 'format' | 'minify' | 'validate';
type IndentChoice = '2' | '4' | 'tab';

/** Inputs larger than this are refused (the page would struggle to show them anyway). */
const MAX_INPUT_CHARS = 20_000_000;
/** Output longer than this is truncated on screen; copy and download still get all of it. */
const MAX_PREVIEW_CHARS = 1_000_000;
const INPUT_ID = 'json-input';

const SAMPLE = `{"name":"Zykit","private":true,"version":"1.0.0","id":12345678901234567890,
"tools":[{"id":"json-formatter","tags":["JSON","Validate"]},{"id":"diff-checker","tags":["Diff"]}],
"author":{"name":"You","city":"Z\\u00fcrich"}}`;

function download(text: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function goTo(offset: number) {
  const el = document.getElementById(INPUT_ID) as HTMLTextAreaElement | null;
  if (!el) return;
  el.focus();
  el.setSelectionRange(offset, Math.min(offset + 1, el.value.length));
}

export default function JsonFormatterPage() {
  const [input, setInput] = useState('');
  const [action, setAction] = useState<Action>('format');
  const [indentChoice, setIndentChoice] = useState<IndentChoice>('2');
  const [sortKeys, setSortKeys] = useState(false);

  // Parsing runs on a deferred copy so typing stays responsive on big documents.
  const text = useDeferredValue(input);
  const stale = text !== input;
  const tooLarge = text.length > MAX_INPUT_CHARS;
  const parsed = useMemo(() => (text.trim() && !tooLarge ? parseJson(text) : null), [text, tooLarge]);

  const indent: Indent = indentChoice === 'tab' ? 'tab' : indentChoice === '4' ? 4 : 2;
  const output = useMemo(() => {
    if (!parsed?.ok || action === 'validate') return '';
    return formatJson(parsed.value, { indent: action === 'minify' ? null : indent, sortKeys });
  }, [parsed, action, indent, sortKeys]);

  const status = tooLarge
    ? 'This input is too large to process here (limit: about 20 MB).'
    : !parsed
      ? 'Paste JSON to format, minify or validate it.'
      : parsed.ok
        ? `Valid JSON · ${pluralize(parsed.stats.keys, 'key')} · depth ${parsed.stats.maxDepth}`
        : `Invalid JSON: ${parsed.error.message} (line ${parsed.error.line}, column ${parsed.error.column})`;

  const preview = output.length > MAX_PREVIEW_CHARS ? output.slice(0, MAX_PREVIEW_CHARS) : output;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={jsonFormatter} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="readable">Make JSON </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Try an example
          </Button>
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={stale ? 'busy' : parsed?.ok ? 'good' : 'neutral'} />

      <section aria-label="Formatting options" className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <Segmented<Action>
          label="Action"
          options={[
            { value: 'format', label: 'Format' },
            { value: 'minify', label: 'Minify' },
            { value: 'validate', label: 'Validate' },
          ]}
          value={action}
          onChange={setAction}
        />
        {action === 'format' && (
          <Segmented<IndentChoice>
            label="Indent"
            options={[
              { value: '2', label: '2 spaces' },
              { value: '4', label: '4 spaces' },
              { value: 'tab', label: 'Tab' },
            ]}
            value={indentChoice}
            onChange={setIndentChoice}
          />
        )}
        {action !== 'validate' && (
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-emerald-600 dark:border-slate-600"
            />
            Sort keys (recursively)
          </label>
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          id={INPUT_ID}
          label="Input JSON"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={18}
          placeholder='{"paste": "your JSON here"}'
          aria-invalid={parsed ? !parsed.ok : undefined}
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
                onClick={() => goTo(parsed.error.offset)}
                className="mt-4 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
              >
                Jump to error in input
              </button>
            </Panel>
          )}

          {parsed?.ok && (
            <>
              {action === 'validate' ? (
                <div className="flex items-center gap-3 rounded-3xl bg-primary p-6 text-primary-ink">
                  <Icon name="check" className="h-7 w-7 shrink-0" />
                  <p className="text-lg font-semibold">This is valid JSON.</p>
                </div>
              ) : (
                <section aria-label="Output" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Icon name="braces" className="h-4 w-4" /> {action === 'minify' ? 'Minified' : 'Formatted'}
                    </h2>
                    <div className="flex flex-wrap items-center gap-1">
                      <CopyButton text={output} />
                      <button
                        type="button"
                        onClick={() => download(output, action === 'minify' ? 'minified.json' : 'formatted.json')}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Icon name="download" className="h-4 w-4" /> Download .json
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
              )}

              {(parsed.stats.bigNumbers > 0 || parsed.stats.duplicateKeys.length > 0) && (
                <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  {parsed.stats.bigNumbers > 0 && (
                    <p>
                      {pluralize(parsed.stats.bigNumbers, 'number has', 'numbers have')} more digits than JavaScript can store exactly. They are kept
                      exactly as written here, but <code>JSON.parse</code> in other tools may round them.
                    </p>
                  )}
                  {parsed.stats.duplicateKeys.length > 0 && (
                    <p>
                      Duplicate keys in the same object: {parsed.stats.duplicateKeys.map((k) => JSON.stringify(k)).join(', ')}. Most parsers keep
                      only the last value.
                    </p>
                  )}
                </div>
              )}

              <Panel eyebrow="Stats" icon="info">
                <DetailRows
                  rows={[
                    ['Input size', formatBytes(utf8Length(text))],
                    ...(action !== 'validate' ? ([['Output size', formatBytes(utf8Length(output))]] as [string, string][]) : []),
                    ['Keys', parsed.stats.keys.toLocaleString('en-US')],
                    ['Max depth', parsed.stats.maxDepth.toLocaleString('en-US')],
                  ]}
                />
              </Panel>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Your JSON is parsed in your browser and never uploaded. Numbers and string escapes are kept exactly as written, so large IDs don&rsquo;t get
        rounded.
      </p>
    </div>
  );
}
