import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import jsRunner from './index';
import { ConsoleOutput } from './components/ConsoleOutput';
import { compileTypeScript, describeCompileError, type CompileResult } from './features/compile';
import { EXAMPLES, type Language } from './features/examples';
import { entriesToText, formatTime } from './features/transcript';
import { useJsRunner, type RunState } from './hooks/useJsRunner';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';

const STORAGE_KEY = 'zykit-js-runner';
const LIMITS = [5, 10, 30, 60];

interface Saved {
  code: string;
  language: Language;
  limit: number;
}

function loadSaved(): Saved {
  const fallback: Saved = { code: EXAMPLES[0].code, language: 'js', limit: 10 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const v = JSON.parse(raw) as Partial<Saved>;
    return {
      code: typeof v.code === 'string' ? v.code : fallback.code,
      language: v.language === 'ts' ? 'ts' : 'js',
      limit: typeof v.limit === 'number' && LIMITS.includes(v.limit) ? v.limit : 10,
    };
  } catch {
    return fallback;
  }
}

function statusText(run: RunState, count: number): string {
  const took = run.ms !== null ? formatTime(run.ms) : '';
  switch (run.status) {
    case 'idle':
      return 'Ready. Press Run or Ctrl/⌘ + Enter.';
    case 'compiling':
      return 'Compiling TypeScript…';
    case 'running':
      return 'Running…';
    case 'waiting':
      return `Main code ${run.mainFailed ? 'threw an error' : 'finished'} in ${took}. Waiting for timers… press Stop to end.`;
    case 'finished':
      return run.mainFailed ? `Finished with an uncaught error after ${took}.` : `Finished. Ran in ${took}.`;
    case 'failed':
      return count ? 'Could not run the code. See the console for details.' : 'Could not run the code.';
    case 'stopped':
      return 'Stopped.';
    case 'timeout':
      return `Stopped after ${run.limitMs / 1000} s (time limit).`;
    case 'truncated':
      return 'Output truncated. The run was stopped.';
  }
}

const selectClass =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100';

export default function JsRunnerPage() {
  const [initial] = useState(loadSaved);
  const [code, setCode] = useState(initial.code);
  const [language, setLanguage] = useState<Language>(initial.language);
  const [limit, setLimit] = useState(initial.limit);
  const [timestamps, setTimestamps] = useState(false);
  const [showCompiled, setShowCompiled] = useState(false);
  const [compiled, setCompiled] = useState<CompileResult | null>(null);
  const { entries, run, start, stop, clear } = useJsRunner();
  const escaped = useRef(false);

  const busy = run.status === 'compiling' || run.status === 'running' || run.status === 'waiting';

  // Per-viewer convenience only; failures (private mode, blocked storage) are ignored.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, language, limit } satisfies Saved));
    } catch {
      /* ignore */
    }
  }, [code, language, limit]);

  // Compiled JS preview (TypeScript only), debounced.
  const previewing = showCompiled && language === 'ts';
  useEffect(() => {
    if (!previewing) return;
    let live = true;
    const t = setTimeout(() => {
      compileTypeScript(code).then(
        (r) => live && setCompiled(r),
        () => live && setCompiled({ ok: false, message: 'Could not load the TypeScript compiler.', line: null, column: null }),
      );
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [code, previewing]);

  const consoleRef = useRef<HTMLElement>(null);
  const runNow = () => {
    void start(code, language, limit * 1000);
    // The console sits below the editor; bring it into view without jumping if it's already visible.
    consoleRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      runNow();
      return;
    }
    if (e.key === 'Escape') {
      escaped.current = true; // the next Tab moves focus instead of indenting
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && !escaped.current) {
      e.preventDefault();
      const el = e.currentTarget;
      // execCommand keeps the browser's undo history; fall back to a direct edit.
      if (!document.execCommand('insertText', false, '  ')) {
        el.setRangeText('  ', el.selectionStart, el.selectionEnd, 'end');
        setCode(el.value);
      }
      return;
    }
    escaped.current = false;
  };

  const loadExample = (id: string) => {
    const ex = EXAMPLES.find((x) => x.id === id);
    if (!ex) return;
    setCode(ex.code);
    setLanguage(ex.language);
  };

  const transcript = entriesToText(entries);

  return (
    <div className="space-y-8">
      <Breadcrumb tool={jsRunner} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Headline accent="browser">Run code right in your </Headline>
        <p className="max-w-md text-slate-600 dark:text-slate-400">
          JavaScript or TypeScript, executed in an isolated worker on your device. Nothing is uploaded.
        </p>
      </div>

      <StatusStrip status={statusText(run, entries.length)} tone={busy ? 'busy' : run.status === 'finished' && !run.mainFailed ? 'good' : 'neutral'} />

      <div className="grid gap-6">
        <section aria-label="Editor" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Segmented<Language>
              label="Language"
              options={[
                { value: 'js', label: 'JavaScript' },
                { value: 'ts', label: 'TypeScript' },
              ]}
              value={language}
              onChange={setLanguage}
            />
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>Example</span>
              <select
                className={selectClass}
                value=""
                onChange={(e) => loadExample(e.target.value)}
              >
                <option value="" disabled>
                  Load an example…
                </option>
                {EXAMPLES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <CodeArea
            label={language === 'ts' ? 'TypeScript code' : 'JavaScript code'}
            hint="Tab indents · Esc then Tab leaves · Ctrl/⌘+Enter runs"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => (escaped.current = false)}
            rows={18}
            className="min-h-64 whitespace-pre-wrap break-words"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {busy ? (
              <Button onClick={stop}>
                <Icon name="stop" className="h-4 w-4" /> Stop
              </Button>
            ) : (
              <Button onClick={runNow}>
                <Icon name="play" className="h-4 w-4" /> Run
              </Button>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>Time limit</span>
              <select className={selectClass} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                {LIMITS.map((s) => (
                  <option key={s} value={s}>
                    {s} s
                  </option>
                ))}
              </select>
            </label>
            {language === 'ts' && (
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={showCompiled}
                  onChange={(e) => setShowCompiled(e.target.checked)}
                  className="h-4 w-4 accent-emerald-600"
                />
                Show compiled JS
              </label>
            )}
          </div>
        </section>

        <section ref={consoleRef} aria-label="Console" className="flex min-w-0 flex-col rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-6 dark:border-slate-800">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="code" className="h-4 w-4" /> Console
              {run.ms !== null && (
                <span className="normal-case tracking-normal font-normal text-slate-500">· Ran in {formatTime(run.ms)}</span>
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-1">
              <label className="flex items-center gap-1.5 px-2 text-sm text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={timestamps} onChange={(e) => setTimestamps(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                Timestamps
              </label>
              <CopyButton text={transcript} label="Copy output" />
              <button
                type="button"
                onClick={clear}
                disabled={entries.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Icon name="x" className="h-4 w-4" /> Clear output
              </button>
            </div>
          </header>
          <div
            role="region"
            aria-label="Console output"
            tabIndex={0}
            className="max-h-[32rem] min-h-40 flex-1 overflow-auto rounded-b-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            <ConsoleOutput entries={entries} timestamps={timestamps} />
          </div>
        </section>
      </div>

      {previewing && (
        <Panel eyebrow="Compiled JavaScript" icon="code">
          {compiled === null ? (
            <p className="text-sm text-slate-500">Compiling…</p>
          ) : compiled.ok ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">Types are stripped; every line stays where it was.</p>
                <CopyButton text={compiled.code} label="Copy JS" />
              </div>
              <CodeBlock>{compiled.code}</CodeBlock>
            </>
          ) : (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {describeCompileError(compiled)}
            </p>
          )}
        </Panel>
      )}

      <Panel eyebrow="How your code runs" icon="shield">
        <ul className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2 dark:text-slate-300">
          <li className="flex gap-2">
            <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Code runs in a fresh, isolated Web Worker on your device. It can't read or change this page, and nothing is uploaded.
          </li>
          <li className="flex gap-2">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Network requests to other sites are blocked, as are eval and new Function. Modules and npm packages aren't available.
          </li>
          <li className="flex gap-2">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            There is no DOM: document, window and alert don't exist in a worker. Use console.log, console.table and friends.
          </li>
          <li className="flex gap-2">
            <Icon name="stop" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Top-level await works. A run ends when your code and any timers it started are done, when you press Stop, or at the
            time limit. Infinite loops can always be stopped.
          </li>
        </ul>
      </Panel>
    </div>
  );
}
