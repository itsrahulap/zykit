import { useDeferredValue, useMemo, useState } from 'react';
import urlCleaner from './index';
import { cleanLines, cleanText, DEFAULT_GROUPS, GROUPS, parseNameList, type CleanOptions, type CleanResult } from './features/clean';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Checkbox, OpenFileButton } from '../../shared/ui/convert';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

type Mode = 'lines' | 'text';

const SAMPLE = `https://www.example.com/article?id=42&utm_source=newsletter&utm_medium=email&utm_campaign=spring&fbclid=IwAR0abc123#comments
https://www.google.com/url?q=https://shop.example.org/item?color=blue%26gclid%3DCj0KCQ&sa=D
https://youtu.be/dQw4w9WgXcQ?si=Ab12Cd34Ef56&t=42
https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=9f8e7d6c5b4a
https://t.co/AbCdEf1234`;

const inputClass =
  'block w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-500 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-950 dark:text-slate-100';

function ResultRow({ r }: { r: CleanResult }) {
  const changed = r.ok && r.output !== r.input;
  return (
    <li className="min-w-0 space-y-2 py-3">
      {!r.ok ? (
        <p className="break-all text-sm text-red-800 dark:text-red-300">
          {r.error} <span className="font-mono">{r.input}</span>
        </p>
      ) : (
        <>
          <div className="flex min-w-0 items-start justify-between gap-2">
            <p className="min-w-0 break-all font-mono text-sm text-slate-900 dark:text-slate-100">{r.output}</p>
            <CopyButton text={r.output} />
          </div>
          {changed ? (
            <div className="flex flex-wrap gap-1.5" aria-label="Removed parameters">
              {r.unwrapped.map((h) => (
                <span key={h} className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900">
                  unwrapped {h} redirect
                </span>
              ))}
              {r.removed.map((p, i) => (
                <span
                  key={`${p.key}-${i}`}
                  title={p.group}
                  className="max-w-full break-all rounded-full bg-red-50 px-2 py-0.5 font-mono text-xs text-red-800 line-through ring-1 ring-inset ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900"
                >
                  {p.key}
                  {p.value ? `=${p.value.length > 40 ? `${p.value.slice(0, 40)}…` : p.value}` : ''}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">Already clean.</p>
          )}
          {r.notes.map((n) => (
            <p key={n} className="flex gap-1.5 text-xs text-amber-800 dark:text-amber-300">
              <Icon name="info" className="h-3.5 w-3.5 shrink-0" /> {n}
            </p>
          ))}
        </>
      )}
    </li>
  );
}

export default function UrlCleanerPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('lines');
  const [groups, setGroups] = useState<string[]>(DEFAULT_GROUPS);
  const [extra, setExtra] = useState('');
  const [keep, setKeep] = useState('');
  const [unwrap, setUnwrap] = useState(true);

  const text = useDeferredValue(input);
  const opts: CleanOptions = useMemo(() => ({ groups, extraStrip: parseNameList(extra), keep: parseNameList(keep), unwrap }), [groups, extra, keep, unwrap]);
  const { output, results } = useMemo(() => {
    if (!text.trim()) return { output: '', results: [] as CleanResult[] };
    if (mode === 'text') {
      const r = cleanText(text, opts);
      return { output: r.text, results: r.results };
    }
    const r = cleanLines(text, opts);
    return { output: r.map((x) => (x.ok ? x.output : x.input)).join('\n'), results: r };
  }, [text, mode, opts]);

  const removedCount = results.reduce((n, r) => n + r.removed.length, 0);
  const changedCount = results.filter((r) => r.ok && r.output !== r.input).length;
  const invalid = results.filter((r) => !r.ok).length;
  const status = !text.trim()
    ? 'Paste links to strip tracking parameters.'
    : !results.length
      ? 'No http(s) links found in the text.'
      : `${pluralize(changedCount, 'link')} cleaned of ${results.length} · ${pluralize(removedCount, 'parameter')} removed${invalid ? ` · ${invalid} invalid` : ''}`;

  useIncomingText(urlCleaner.id, (t) => setInput(t));
  useToolShortcuts({ getOutput: () => output });

  const toggle = (id: string, on: boolean) => setGroups((g) => (on ? [...g, id] : g.filter((x) => x !== id)));

  return (
    <div className="space-y-8">
      <Breadcrumb tool={urlCleaner} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="clean">Share links </Headline>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setMode('lines');
              setInput(SAMPLE);
            }}
          >
            Try an example
          </Button>
          <OpenFileButton accept=".txt,.csv,.md,.html,.log,text/*" onText={(t) => setInput(t)} />
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={input !== text ? 'busy' : changedCount ? 'good' : 'neutral'} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <Segmented<Mode>
            label="Input type"
            options={[
              { value: 'lines', label: 'One URL per line' },
              { value: 'text', label: 'Find links in text' },
            ]}
            value={mode}
            onChange={setMode}
          />
          <CodeArea
            label={mode === 'lines' ? 'URLs' : 'Text with links'}
            hint={mode === 'lines' ? 'one per line' : 'links are cleaned in place'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
            placeholder={mode === 'lines' ? 'https://example.com/page?utm_source=…' : 'Paste an email, chat message or document…'}
            onFileText={(t) => setInput(t)}
          />

          <section aria-label="Parameters to remove" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="shield" className="h-4 w-4" /> Remove
            </h2>
            <ul className="space-y-3">
              {GROUPS.map((g) => (
                <li key={g.id}>
                  <Checkbox label={g.label} checked={groups.includes(g.id)} onChange={(v) => toggle(g.id, v)} />
                  <p className="ml-6 text-xs text-slate-500 dark:text-slate-400">{g.description}</p>
                </li>
              ))}
            </ul>
            <Checkbox label="Unwrap redirect links (Google, Facebook, Instagram, Reddit, YouTube, LinkedIn…)" checked={unwrap} onChange={setUnwrap} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Also remove</span>
                <input className={inputClass} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="ref, source, aff_*" spellCheck={false} autoCapitalize="off" />
              </label>
              <label className="block min-w-0">
                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Always keep</span>
                <input className={inputClass} value={keep} onChange={(e) => setKeep(e.target.value)} placeholder="utm_campaign" spellCheck={false} autoCapitalize="off" />
              </label>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Separate names with commas or spaces. End a name with * to match a prefix.</p>
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <section aria-label="Output" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
              <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Icon name="check" className="h-4 w-4" /> {mode === 'lines' ? 'Clean URLs' : 'Clean text'}
              </h2>
              <div className="flex flex-wrap items-center gap-1">
                <CopyButton text={output} label="Copy all" />
                <SendToMenu text={output} kind={mode === 'lines' ? 'url' : 'text'} />
              </div>
            </header>
            <div className="p-4">
              {output ? <CodeBlock className="max-h-[28rem] overflow-y-auto">{output}</CodeBlock> : <p className="p-2 text-sm text-slate-500 dark:text-slate-400">Clean links appear here.</p>}
            </div>
          </section>

          {results.length > 0 && (
            <section aria-label="Changes" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="eyebrow mb-2 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Icon name="diff" className="h-4 w-4" /> What was removed
              </h2>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.slice(0, 500).map((r, i) => (
                  <ResultRow key={i} r={r} />
                ))}
              </ul>
              {results.length > 500 && <p className="pt-3 text-sm text-slate-500 dark:text-slate-400">Showing the first 500 links. Copy all gets every one.</p>}
            </section>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Links are cleaned in your browser and never requested, so shortened links (t.co, bit.ly…) can&rsquo;t be expanded. Parameters that aren&rsquo;t
        tracking are kept exactly as written.
      </p>
    </div>
  );
}
