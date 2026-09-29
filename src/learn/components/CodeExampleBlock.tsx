// A lesson's code example: title, code with copy button, explanation and "line by line"
// walkthrough. JavaScript/TypeScript examples also get an inline playground: most run in the
// JS Runner's isolated worker; ones that need a browser page (document, alert, storage…) run in
// a sandboxed iframe (see public/sandbox/dom.html). Other languages are display-only.

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import type { CodeExample } from '../types/content';
import type { ProblemExample } from '../types/problem';
import { ConsoleOutput } from '../../tools/js-runner/components/ConsoleOutput';
import { formatTime, entriesToText, type ConsoleEntry } from '../../tools/js-runner/features/transcript';
import { useJsRunner, type RunState } from '../../tools/js-runner/hooks/useJsRunner';
import { CodeArea, CopyButton } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { codeToRun, languageLabel, playgroundPlan, type PlaygroundPlan } from '../features/playground';
import { SANDBOX_URL } from '../features/domSandbox';
import { useDomSandbox } from '../hooks/useDomSandbox';
import { InlineText } from './RichText';

export interface CodeExampleBlockProps {
  example: CodeExample;
  /** For DSA problem solutions: examples to auto-run against the solution's function. */
  testCases?: ProblemExample[];
}

const TIME_LIMIT_MS = 5000;

const smallButton =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium pointer-coarse:min-h-11 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800';

export function CodeExampleBlock({ example, testCases }: CodeExampleBlockProps) {
  const plan = useMemo(() => playgroundPlan(example), [example]);
  const label = useMemo(() => languageLabel(example), [example]);
  // null: closed; otherwise whether to run as soon as the playground opens.
  const [open, setOpen] = useState<null | { autoRun: boolean }>(null);

  return (
    <div className="min-w-0 space-y-3">
      {example.title && (
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          <InlineText text={example.title} />
        </h3>
      )}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-1.5 sm:px-4 dark:border-slate-800">
          <span className="eyebrow text-slate-500 dark:text-slate-400">{label}</span>
          <div className="flex flex-wrap items-center gap-1">
            {plan && !open && (
              <>
                <button type="button" className={smallButton} onClick={() => setOpen({ autoRun: true })}>
                  <Icon name="play" className="h-4 w-4" /> Run
                </button>
                <button type="button" className={smallButton} onClick={() => setOpen({ autoRun: false })}>
                  <Icon name="code" className="h-4 w-4" /> Edit &amp; run
                </button>
              </>
            )}
            {!open && <CopyButton text={example.code} label="Copy code" />}
          </div>
        </div>
        {open && plan ? (
          <Playground code={example.code} plan={plan} testCases={testCases} autoRun={open.autoRun} onClose={() => setOpen(null)} />
        ) : (
          <pre
            tabIndex={0}
            aria-label={`${label} code${example.title ? `: ${example.title}` : ''}`}
            className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40 sm:text-sm dark:text-slate-300"
          >
            <code>{example.code}</code>
          </pre>
        )}
      </div>

      {example.explanation && (
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
          <InlineText text={example.explanation} />
        </p>
      )}

      {example.walkthrough && example.walkthrough.length > 0 && (
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="eyebrow mb-3 text-slate-500 dark:text-slate-400">Line by line</p>
          <ol className="space-y-3">
            {example.walkthrough.map((step, i) => (
              <li key={i} className="grid gap-1.5 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:gap-4">
                <code className="block max-w-full self-start overflow-x-auto whitespace-pre rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  {step.code}
                </code>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  <InlineText text={step.explanation} />
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

interface Runner {
  entries: ConsoleEntry[];
  run: RunState;
  start: (code: string, language: 'js' | 'ts', limitMs: number) => void | Promise<void>;
  stop: () => void;
  clear: () => void;
}

interface PlaygroundProps {
  code: string;
  plan: PlaygroundPlan;
  testCases?: ProblemExample[];
  autoRun: boolean;
  onClose: () => void;
}

function Playground(props: PlaygroundProps) {
  return props.plan.target === 'dom' ? <DomPlayground {...props} /> : <WorkerPlayground {...props} />;
}

function WorkerPlayground(props: PlaygroundProps) {
  const runner = useJsRunner();
  return <PlaygroundShell {...props} runner={runner} />;
}

function DomPlayground(props: PlaygroundProps) {
  const sandbox = useDomSandbox();
  const { frameKey, frameRef, reset } = sandbox;
  return (
    <PlaygroundShell
      {...props}
      runner={sandbox}
      onReset={reset}
      page={<SandboxFrame frameKey={frameKey} frameRef={frameRef} />}
    />
  );
}

function SandboxFrame({ frameKey, frameRef }: { frameKey: number | null; frameRef: RefObject<HTMLIFrameElement | null> }) {
  return (
    <div className="border-t border-slate-200 dark:border-slate-800">
      <p className="eyebrow flex items-center gap-2 px-3 pt-3 text-slate-500 sm:px-4 dark:text-slate-400">
        <Icon name="globe" className="h-3.5 w-3.5" /> Sandbox page
      </p>
      <div className="p-3 sm:px-4">
        {frameKey === null ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            A small sample page (a heading, a paragraph, a list and a button) appears here when the code runs.
          </p>
        ) : (
          <iframe
            key={frameKey}
            ref={frameRef}
            src={SANDBOX_URL}
            title="Sandbox page for this example"
            sandbox="allow-scripts allow-modals"
            referrerPolicy="no-referrer"
            className="block h-40 w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
          />
        )}
      </div>
    </div>
  );
}

function statusText(run: RunState, hasTests: boolean): string {
  const took = run.ms !== null ? formatTime(run.ms) : '';
  switch (run.status) {
    case 'idle':
      return hasTests ? 'Press Run to try this solution on the examples above.' : 'Edit the code, then press Run (or Ctrl/⌘ + Enter).';
    case 'compiling':
      return 'Compiling TypeScript…';
    case 'running':
      return 'Running…';
    case 'waiting':
      return 'Waiting for timers… press Stop to end.';
    case 'finished':
      return run.mainFailed ? `Finished with an error after ${took}.` : `Finished in ${took}.`;
    case 'failed':
      return 'Could not run the code.';
    case 'stopped':
      return 'Stopped.';
    case 'timeout':
      return `Stopped after ${run.limitMs / 1000} s (time limit).`;
    case 'truncated':
      return 'Output truncated. The run was stopped.';
  }
}

function PlaygroundShell({
  code,
  plan,
  testCases,
  autoRun,
  onClose,
  runner,
  onReset,
  page,
}: PlaygroundProps & { runner: Runner; onReset?: () => void; page?: React.ReactNode }) {
  const [source, setSource] = useState(code);
  const { entries, run, start, stop, clear } = runner;
  const escaped = useRef(false);
  const started = useRef(false);
  const busy = run.status === 'compiling' || run.status === 'running' || run.status === 'waiting';

  const runNow = (src = source) => void start(codeToRun(src, testCases), plan.language, TIME_LIMIT_MS);

  // "Run" opens the playground and runs straight away (once).
  useEffect(() => {
    if (!autoRun || started.current) return;
    started.current = true;
    void start(codeToRun(code, testCases), plan.language, TIME_LIMIT_MS);
  }, [autoRun, code, testCases, plan.language, start]);

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
      if (!document.execCommand('insertText', false, '  ')) {
        el.setRangeText('  ', el.selectionStart, el.selectionEnd, 'end');
        setSource(el.value);
      }
      return;
    }
    escaped.current = false;
  };

  const reset = () => {
    if (busy) stop();
    if (onReset) onReset();
    else clear();
    setSource(code);
  };

  return (
    <div className="bg-white dark:bg-slate-900">
      <div className="p-3 sm:p-4">
        <CodeArea
          label="Edit the code"
          hint="Ctrl/⌘ + Enter runs"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => (escaped.current = false)}
          rows={Math.min(18, Math.max(5, source.split('\n').length + 1))}
          className="text-[13px] sm:text-sm"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {busy ? (
            <Button onClick={stop} className="px-3! py-2! text-sm!">
              <Icon name="stop" className="h-4 w-4" /> Stop
            </Button>
          ) : (
            <Button onClick={() => runNow()} className="px-3! py-2! text-sm!">
              <Icon name="play" className="h-4 w-4" /> Run
            </Button>
          )}
          <Button variant="secondary" onClick={reset} disabled={source === code && run.status === 'idle'} className="px-3! py-2! text-sm!">
            <Icon name="swap" className="h-4 w-4" /> Reset
          </Button>
          <CopyButton text={source} label="Copy code" />
          <button type="button" className={`${smallButton} ml-auto`} onClick={onClose}>
            <Icon name="x" className="h-4 w-4" /> Close
          </button>
        </div>
        <p aria-live="polite" className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          {statusText(run, Boolean(testCases?.length))}
          {plan.target === 'dom' && run.status === 'idle' && ' Runs in a sandboxed sample page with no network access.'}
        </p>
      </div>

      <section aria-label="Example output" className="border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 px-3 pt-2 sm:px-4">
          <h4 className="eyebrow flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Icon name="code" className="h-3.5 w-3.5" /> Console
          </h4>
          <CopyButton text={entriesToText(entries)} label="Copy output" />
        </div>
        <div role="region" aria-label="Console output" tabIndex={0} className="max-h-72 min-h-16 overflow-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40">
          <ConsoleOutput entries={entries} timestamps={false} />
        </div>
      </section>
      {page}
    </div>
  );
}
