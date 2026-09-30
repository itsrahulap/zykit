import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import metaTagInspector from './index';
import { Previews } from './components/Previews';
import { analyze, SAMPLE_HTML, type Analysis, type Level, type LengthCheck } from './features/analyze';
import { parseHtml } from './features/extract';
import { Notices, OpenFileButton } from '../../shared/ui/convert';
import { DropZone } from '../../shared/ui/DropZone';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea, CodeBlock } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';

const MAX_CHARS = 5_000_000;
const INDENT = ['pl-0', 'pl-3', 'pl-6', 'pl-9', 'pl-12', 'pl-15'];

const LEVELS: { level: Level; label: string; icon: 'x' | 'warn' | 'info' | 'check'; colour: string }[] = [
  { level: 'error', label: 'Errors', icon: 'x', colour: 'text-red-600 dark:text-red-400' },
  { level: 'warning', label: 'Warnings', icon: 'warn', colour: 'text-amber-600 dark:text-amber-400' },
  { level: 'info', label: 'Suggestions', icon: 'info', colour: 'text-sky-600 dark:text-sky-400' },
  { level: 'good', label: 'Passed', icon: 'check', colour: 'text-emerald-600 dark:text-emerald-400' },
];

const Mono = ({ children }: { children: ReactNode }) => <span className="font-mono text-sm break-all">{children}</span>;
const None = () => <span className="text-slate-500 dark:text-slate-400">Not set</span>;

function LengthValue({ c }: { c: LengthCheck }) {
  if (!c.value) return <None key="n" />;
  const tone = c.state === 'ok' ? 'green' : 'amber';
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="break-words">{c.value}</span>
      <Badge tone={tone}>
        {c.length} chars · {c.state === 'ok' ? 'good' : c.state === 'short' ? `short (min ${c.min})` : `long (max ${c.max})`}
      </Badge>
    </span>
  );
}

function TagTable({ entries }: { entries: [string, string][] }) {
  if (!entries.length) return <p className="text-sm text-slate-500 dark:text-slate-400">None found.</p>;
  return (
    <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[minmax(0,12rem)_1fr]">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-mono break-all text-slate-600 dark:text-slate-400">{k}</dt>
          <dd className="mb-2 break-all text-slate-900 sm:mb-0 dark:text-slate-100">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Checklist({ a }: { a: Analysis }) {
  return (
    <Panel eyebrow="Checklist" icon="check">
      <div className="space-y-5">
        {LEVELS.map(({ level, label, icon, colour }) => {
          const items = a.checks.filter((c) => c.level === level);
          if (!items.length) return null;
          return (
            <div key={level}>
              <h3 className={`mb-2 text-sm font-semibold ${colour}`}>
                {label} ({items.length})
              </h3>
              <ul className="space-y-1.5">
                {items.map((c, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <Icon name={icon} className={`mt-0.5 h-4 w-4 shrink-0 ${colour}`} />
                    <span className="min-w-0 break-words">
                      <span className="font-semibold">{c.area}:</span> {c.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export default function MetaTagInspectorPage() {
  const [html, setHtml] = useState('');
  const [fileName, setFileName] = useState('');
  const [notice, setNotice] = useState('');
  const deferred = useDeferredValue(html);
  const a = useMemo(() => (deferred.trim() ? analyze(parseHtml(deferred.slice(0, MAX_CHARS))) : null), [deferred]);

  const onFile = async (f: File) => {
    setNotice(f.size > MAX_CHARS ? 'The file is larger than 5 MB; only the start is analysed.' : '');
    setFileName(f.name);
    setHtml(await f.slice(0, MAX_CHARS).text());
  };

  const counts = a ? { e: a.checks.filter((c) => c.level === 'error').length, w: a.checks.filter((c) => c.level === 'warning').length } : null;
  const status = !counts
    ? "Paste a page's HTML source to check its tags."
    : `${counts.e} error${counts.e === 1 ? '' : 's'}, ${counts.w} warning${counts.w === 1 ? '' : 's'}.`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={metaTagInspector} />
      <Headline accent="tags">Check your meta </Headline>
      <StatusStrip status={status} tone={counts && !counts.e ? 'good' : 'neutral'} />

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <DropZone onFile={onFile}>
          <CodeArea
            label="Page HTML"
            hint="The page is never loaded or run"
            rows={8}
            value={html}
            onChange={(e) => {
              setFileName('');
              setHtml(e.target.value);
            }}
            placeholder={'<!doctype html>\n<html lang="en">\n<head>…'}
            className="break-all"
          />
        </DropZone>
        <div className="flex flex-wrap gap-3">
          <OpenFileButton accept=".html,.htm,.xhtml,text/html" onFile={onFile} />
          <Button variant="secondary" className="pointer-coarse:min-h-11" onClick={() => setHtml(SAMPLE_HTML)}>
            Load sample
          </Button>
          <Button variant="ghost" className="pointer-coarse:min-h-11" disabled={!html} onClick={() => setHtml('')}>
            Clear
          </Button>
        </div>
        {fileName && <p className="text-sm break-all text-slate-600 dark:text-slate-400">{fileName}</p>}
        {notice && <Notices items={[notice]} />}
        <details className="text-sm text-slate-600 dark:text-slate-400">
          <summary className="cursor-pointer font-semibold text-slate-700 pointer-coarse:min-h-11 dark:text-slate-300">How do I get a page's HTML?</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              In the browser: View Source (<kbd>Ctrl</kbd>+<kbd>U</kbd>, or <kbd>⌥</kbd>+<kbd>⌘</kbd>+<kbd>U</kbd> on a Mac), select all and copy.
            </li>
            <li>
              In a terminal: <code className="font-mono break-all">curl -sL https://example.com</code>, or save it with <code className="font-mono break-all">curl -sL https://example.com -o page.html</code> and use Open file.
            </li>
            <li>For pages that add tags with JavaScript, copy the rendered DOM: DevTools → Elements → right-click &lt;html&gt; → Copy → Copy outerHTML.</li>
          </ul>
          <p className="mt-2">This site can't fetch other websites (its security policy blocks it), which also means nothing you paste leaves your browser.</p>
        </details>
      </section>

      {a && (
        <>
          <Checklist a={a} />
          <Panel eyebrow="Previews" icon="image">
            <Previews a={a} />
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Approximate; each platform crops and truncates a little differently. Images are not fetched.</p>
          </Panel>
          <Panel eyebrow="Basics" icon="search">
            <DetailRows
              rows={[
                ['Title', <LengthValue key="t" c={a.title} />],
                ['Description', <LengthValue key="d" c={a.description} />],
                ['Canonical', a.canonical ? <Mono key="c">{a.canonical}</Mono> : <None key="n" />],
                ['Robots', a.robots ?? <None key="n" />],
                ['Googlebot', a.googlebot ?? <None key="n" />],
                ['Viewport', a.viewport ? <Mono key="v">{a.viewport}</Mono> : <None key="n" />],
                ['Charset', a.charset ?? <None key="n" />],
                ['Language', a.lang ?? <None key="n" />],
                ['H1 headings', String(a.h1Count)],
              ]}
            />
          </Panel>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel eyebrow="Open Graph" icon="globe" className="min-w-0">
              <TagTable entries={Object.entries(a.og)} />
            </Panel>
            <Panel eyebrow="X / Twitter" icon="globe" className="min-w-0">
              <TagTable entries={Object.entries(a.twitter)} />
            </Panel>
          </div>
          {(a.hreflang.length > 0 || a.icons.length > 0) && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel eyebrow="hreflang alternates" icon="globe" className="min-w-0">
                <TagTable entries={a.hreflang.map((h) => [h.lang, h.href])} />
              </Panel>
              <Panel eyebrow="Icons" icon="image" className="min-w-0">
                <TagTable entries={a.icons.map((i) => [`${i.rel}${i.sizes ? ` ${i.sizes}` : ''}`, i.href])} />
              </Panel>
            </div>
          )}
          {a.jsonLd.length > 0 && (
            <Panel eyebrow={`Structured data (${a.jsonLd.length})`} icon="braces">
              <div className="space-y-4">
                {a.jsonLd.map((b) => (
                  <div key={b.index} className="min-w-0">
                    <p className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Block {b.index + 1}
                      {b.types.map((t) => (
                        <Badge key={t} tone="violet">
                          {t}
                        </Badge>
                      ))}
                      {b.error && <Badge tone="red">Invalid JSON</Badge>}
                    </p>
                    {b.error ? <p className="text-sm break-words text-red-700 dark:text-red-300">{b.error}</p> : <CodeBlock className="max-h-80 overflow-y-auto">{b.pretty ?? ''}</CodeBlock>}
                  </div>
                ))}
              </div>
            </Panel>
          )}
          <Panel eyebrow="Headings outline" icon="text">
            {a.headings.length ? (
              <ol className="space-y-1 text-sm">
                {a.headings.map((h, i) => (
                  <li key={i} className={`flex min-w-0 gap-2 text-slate-700 dark:text-slate-300 ${INDENT[Math.min(h.level - 1, 5)]}`}>
                    <span className="shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400">h{h.level}</span>
                    <span className="min-w-0 break-words">{h.text || <em className="text-slate-500 dark:text-slate-400">(empty)</em>}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No headings.</p>
            )}
          </Panel>
        </>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">The HTML is parsed in your browser without running scripts or loading resources.</p>
    </div>
  );
}
