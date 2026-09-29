import { useDeferredValue, useMemo, useState } from 'react';
import curlConverter from './index';
import { parseCurl, type HttpRequest } from './features/curl';
import { parseFetch, toCurl } from './features/fetch';
import { credentialHeaders, generate, type Target } from './features/generate';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';

type Direction = 'to-code' | 'to-curl';

const TARGETS: { value: Target; label: string }[] = [
  { value: 'fetch', label: 'JavaScript fetch' },
  { value: 'node', label: 'Node.js fetch' },
  { value: 'axios', label: 'axios' },
  { value: 'python', label: 'Python requests' },
];

const CURL_SAMPLE = `curl 'https://api.example.com/v1/orders?limit=10' \\
  -X POST \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer <your-token>' \\
  --data-raw '{"product":"coffee","quantity":2,"gift":false}' \\
  --compressed`;

const FETCH_SAMPLE = `const response = await fetch('https://api.example.com/v1/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer <your-token>',
  },
  body: JSON.stringify({ product: "coffee", quantity: 2, note: "it's a gift" }),
});`;

interface Converted {
  request?: HttpRequest;
  output?: string;
  error?: string;
  warnings: string[];
  notes: string[];
}

function convert(direction: Direction, text: string, target: Target): Converted {
  if (direction === 'to-code') {
    const r = parseCurl(text);
    if (!r.request) return { error: r.error, warnings: r.warnings, notes: r.notes };
    const g = generate(r.request, target);
    return { request: r.request, output: g.code, warnings: r.warnings, notes: [...r.notes, ...g.notes] };
  }
  const r = parseFetch(text);
  if (!r.request) return { error: r.error, warnings: r.warnings, notes: [] };
  return { request: r.request, output: toCurl(r.request), warnings: r.warnings, notes: [] };
}

function NoteList({ title, items, tone }: { title: string; items: string[]; tone: 'amber' | 'slate' }) {
  const box =
    tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
      : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300';
  return (
    <section aria-label={title} className={`rounded-2xl border p-4 text-sm ${box}`}>
      <h2 className="eyebrow mb-2 flex items-center gap-2">
        <Icon name={tone === 'amber' ? 'warn' : 'info'} className="h-4 w-4" /> {title}
      </h2>
      <ul className="list-disc space-y-1 pl-5 break-words">
        {items.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
    </section>
  );
}

export default function CurlConverterPage() {
  const [direction, setDirection] = useState<Direction>('to-code');
  const [inputs, setInputs] = useState<Record<Direction, string>>({ 'to-code': '', 'to-curl': '' });
  const [target, setTarget] = useState<Target>('fetch');

  const input = inputs[direction];
  const setInput = (v: string) => setInputs((prev) => ({ ...prev, [direction]: v }));
  const text = useDeferredValue(input);
  const stale = text !== input;

  const result = useMemo(() => (text.trim() ? convert(direction, text, target) : null), [direction, text, target]);
  const secrets = result?.request ? credentialHeaders(result.request) : [];
  const toCode = direction === 'to-code';
  const targetLabel = TARGETS.find((t) => t.value === target)!.label;

  const status = !result
    ? toCode
      ? 'Paste a cURL command to turn it into code.'
      : 'Paste a fetch() call to turn it into a cURL command.'
    : result.error
      ? `Could not convert: ${result.error}`
      : `${result.request!.method} ${result.request!.url.length > 60 ? result.request!.url.slice(0, 57) + '…' : result.request!.url} → ${toCode ? targetLabel : 'cURL'}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={curlConverter} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="code">Turn cURL into </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(toCode ? CURL_SAMPLE : FETCH_SAMPLE)}>
            Try an example
          </Button>
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={stale ? 'busy' : result && !result.error ? 'good' : 'neutral'} />

      <section
        aria-label="Conversion options"
        className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <Segmented<Direction>
          label="Direction"
          options={[
            { value: 'to-code', label: 'cURL → code' },
            { value: 'to-curl', label: 'fetch → cURL' },
          ]}
          value={direction}
          onChange={setDirection}
        />
        {toCode && <Segmented<Target> label="Language" options={TARGETS} value={target} onChange={setTarget} />}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          label={toCode ? 'cURL command' : 'fetch() code'}
          hint={toCode ? 'bash, zsh or Windows cmd' : 'literal values only, nothing is run'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={16}
          placeholder={toCode ? "curl -H 'Accept: application/json' https://api.example.com" : "fetch('https://api.example.com', { method: 'POST' })"}
          aria-invalid={result?.error ? true : undefined}
        />

        <div className="min-w-0 space-y-6">
          {result?.error && (
            <div role="alert" className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
              <Icon name="warn" className="h-5 w-5 shrink-0" />
              <p className="min-w-0 break-words font-medium">{result.error}</p>
            </div>
          )}

          {result?.output && (
            <section aria-label="Output" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Icon name="code" className="h-4 w-4" /> {toCode ? targetLabel : 'cURL'}
                </h2>
                <CopyButton text={result.output} />
              </header>
              <div className="p-4">
                <CodeBlock className="max-h-[36rem] overflow-y-auto">{result.output}</CodeBlock>
              </div>
            </section>
          )}

          {secrets.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <Icon name="key" className="h-5 w-5 shrink-0" />
              <p className="min-w-0 break-words">
                <strong>Contains credentials</strong> ({secrets.join(', ')}). They stay in your browser, but remove or rotate them before sharing
                this code.
              </p>
            </div>
          )}

          {result && result.warnings.length > 0 && <NoteList title="Warnings" items={result.warnings} tone="amber" />}
          {result && result.notes.length > 0 && <NoteList title="Notes" items={result.notes} tone="slate" />}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Conversion happens in your browser. The request is never sent, and pasted code is parsed, not run.
      </p>
    </div>
  );
}
