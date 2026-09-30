import { useDeferredValue, useMemo, useState } from 'react';
import jsonToTypescript from './index';
import { generateTypes } from './features/typegen';
import { errorSnippet } from '../../shared/lib/textpos';
import { parseJson } from '../json-formatter/features/json';
import { Checkbox, OpenFileButton } from '../../shared/ui/convert';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';
import { downloadText, selectInTextarea } from '../../shared/utils/dom.utils';

type Style = 'interface' | 'type';

const MAX_INPUT_CHARS = 5_000_000;
const INPUT_ID = 'json-ts-input';

const SAMPLE = `{
  "id": 42,
  "name": "Zykit",
  "createdAt": "2024-05-01T10:00:00Z",
  "owner": { "login": "you", "site-url": null },
  "users": [
    { "id": 1, "email": "ann@example.com", "roles": ["admin"] },
    { "id": 2, "email": null, "roles": [], "nickname": "bo" }
  ],
  "billing": { "street": "1 Main St", "zip": "10001" },
  "shipping": { "street": "2 Side St", "zip": "10002" },
  "scores": [1, 2.5, "n/a"],
  "tags": []
}`;

export default function JsonToTypescriptPage() {
  const [input, setInput] = useState('');
  const [style, setStyle] = useState<Style>('interface');
  const [rootName, setRootName] = useState('Root');
  const [exported, setExported] = useState(true);
  const [readonly, setReadonly] = useState(false);

  const text = useDeferredValue(input);
  const stale = text !== input;
  const tooLarge = text.length > MAX_INPUT_CHARS;
  const parsed = useMemo(() => (text.trim() && !tooLarge ? parseJson(text) : null), [text, tooLarge]);
  const result = useMemo(
    () => (parsed?.ok ? generateTypes(parsed.value, { rootName, style, exported, readonly }) : null),
    [parsed, rootName, style, exported, readonly],
  );

  const code = result?.code ?? '';
  const download = () => downloadText(code, 'types.ts', 'text/plain');

  useIncomingText(jsonToTypescript.id, (t) => setInput(t));
  useToolShortcuts({ getOutput: () => code, onDownload: () => code && download() });
  useShareState(
    { input, style, rootName, exported, readonly },
    (s) => {
      if (s.input !== undefined) setInput(s.input);
      if (s.style) setStyle(s.style);
      if (s.rootName !== undefined) setRootName(s.rootName);
      if (s.exported !== undefined) setExported(s.exported);
      if (s.readonly !== undefined) setReadonly(s.readonly);
    },
    { style: ['interface', 'type'] },
  );

  const status = tooLarge
    ? 'This input is too large to process here (limit: about 5 MB).'
    : !parsed
      ? 'Paste JSON to generate TypeScript types.'
      : parsed.ok
        ? `Generated ${pluralize(result?.declarations ?? 0, 'type')}`
        : `Invalid JSON: ${parsed.error.message} (line ${parsed.error.line}, column ${parsed.error.column})`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={jsonToTypescript} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="TypeScript">Turn JSON into </Headline>
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

      <StatusStrip status={status} tone={stale ? 'busy' : parsed?.ok ? 'good' : 'neutral'} />

      <section
        aria-label="Type options"
        className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <Segmented<Style>
          label="Declaration style"
          options={[
            { value: 'interface', label: 'interface' },
            { value: 'type', label: 'type alias' },
          ]}
          value={style}
          onChange={setStyle}
        />
        <label className="inline-flex min-w-0 items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          Root name
          <input
            type="text"
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            spellCheck={false}
            className="w-32 min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <Checkbox label="export" checked={exported} onChange={setExported} />
        <Checkbox label="readonly" checked={readonly} onChange={setReadonly} />
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

          {result && (
            <>
              <section aria-label="TypeScript output" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                  <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Icon name="code" className="h-4 w-4" /> TypeScript
                  </h2>
                  <div className="flex flex-wrap items-center gap-1">
                    <CopyButton text={result.code} />
                    <SendToMenu text={result.code} kind="code" lang="ts" />
                    <button
                      type="button"
                      onClick={download}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 pointer-coarse:min-h-11 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Icon name="download" className="h-4 w-4" /> Download .ts
                    </button>
                  </div>
                </header>
                <div className="p-4">
                  <CodeBlock className="max-h-[36rem] overflow-y-auto">{result.code}</CodeBlock>
                </div>
              </section>
              {result.hasDates && (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  Some values look like dates. JSON has no date type, so they&rsquo;re typed as <code>string</code> — convert them with{' '}
                  <code>new Date(value)</code> after parsing if you need <code>Date</code> objects.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Types are inferred from the sample data in your browser; nothing is uploaded. Keys missing from some array items become optional,
        and identical object shapes share one named type.
      </p>
    </div>
  );
}
