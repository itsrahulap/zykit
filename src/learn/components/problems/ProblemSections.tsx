// Pieces of the single-problem page: examples, progressive hints and the solution tabs.

import { useState, type ReactNode } from 'react';
import type { Problem, ProblemExample } from '../../types/problem';
import { Tabs } from '../../../shared/ui/Tabs';
import { Badge, Button, Icon, type IconName } from '../../../shared/ui/ui';
import { InlineText, RichText } from '../RichText';
import { CodeExampleBlock } from '../CodeExampleBlock';
import { Link } from 'react-router';
import { buildAutoRunHarness } from '../../features/autoRunHarness';
import { looksLikeTypeScript, playgroundPlan } from '../../features/playground';
import { sendText } from '../../../shared/lib/handoff';

export function Section({ id, title, icon, children }: { id: string; title: string; icon?: IconName; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id} className="flex scroll-mt-24 items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {icon && <Icon name={icon} className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Examples({ examples }: { examples: ProblemExample[] }) {
  return (
    <ol className="grid gap-4">
      {examples.map((ex, i) => (
        <li key={i} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950">
          <p className="eyebrow mb-3 text-slate-500 dark:text-slate-400">Example {i + 1}</p>
          <dl className="grid gap-2 font-mono text-sm">
            <div className="grid gap-1 sm:grid-cols-[5rem_1fr]">
              <dt className="text-slate-500 dark:text-slate-400">Input</dt>
              <dd className="min-w-0 whitespace-pre-wrap break-words text-slate-900 dark:text-slate-100">{ex.input}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[5rem_1fr]">
              <dt className="text-slate-500 dark:text-slate-400">Output</dt>
              <dd className="min-w-0 whitespace-pre-wrap break-words font-semibold text-emerald-800 dark:text-emerald-300">{ex.output}</dd>
            </div>
          </dl>
          {ex.explanation && (
            <p className="mt-3 border-t border-slate-200 pt-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
              <InlineText text={ex.explanation} />
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Hints revealed one at a time. Remount (key) per problem to start hidden again. */
export function Hints({ hints }: { hints: string[] }) {
  const [shown, setShown] = useState(0);
  return (
    <div className="space-y-3">
      {shown > 0 && (
        <ol className="space-y-3" aria-live="polite">
          {hints.slice(0, shown).map((hint, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-amber-950">{i + 1}</span>
              <p className="min-w-0 text-amber-950 dark:text-amber-100">
                <span className="sr-only">Hint {i + 1}: </span>
                <InlineText text={hint} />
              </p>
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {shown < hints.length ? (
          <Button variant="secondary" onClick={() => setShown((n) => n + 1)} className="pointer-coarse:min-h-11">
            <Icon name="lightbulb" className="h-4 w-4" /> Show hint {shown + 1} of {hints.length}
          </Button>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">That&rsquo;s every hint. Try it before you peek at the solutions.</p>
        )}
        {shown > 0 && (
          <Button variant="ghost" onClick={() => setShown(0)} className="pointer-coarse:min-h-11">
            Hide hints
          </Button>
        )}
      </div>
    </div>
  );
}

/** One tab per approach, brute force → optimal. Remount (key) per problem to reset the tab. */
export function Solutions({ problem }: { problem: Problem }) {
  const tabs = problem.solutions.map((s, i) => ({ id: `solution-${i + 1}`, label: `${i + 1}. ${s.approach}` }));
  const [active, setActive] = useState(tabs[0]?.id ?? 'solution-1');
  const index = Math.max(0, tabs.findIndex((t) => t.id === active));
  const solution = problem.solutions[index];
  if (!solution) return null;
  const last = index === problem.solutions.length - 1 && problem.solutions.length > 1;
  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="px-4 sm:px-6">
        <Tabs label="Solution approaches" tabs={tabs} active={tabs[index].id} onChange={setActive} />
      </div>
      <div role="tabpanel" id={`panel-${tabs[index].id}`} aria-labelledby={`tab-${tabs[index].id}`} tabIndex={0} className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="mr-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{solution.approach}</h3>
          {last && <Badge tone="green">Optimal</Badge>}
          {index === 0 && problem.solutions.length > 1 && <Badge>Starting point</Badge>}
        </div>
        <dl className="flex flex-wrap gap-2 text-sm">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
            <dt className="text-slate-500 dark:text-slate-400">Time</dt>
            <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100">{solution.timeComplexity}</dd>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
            <dt className="text-slate-500 dark:text-slate-400">Space</dt>
            <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100">{solution.spaceComplexity}</dd>
          </div>
        </dl>
        <RichText text={solution.explanation} />
        <CodeExampleBlock
          key={`${problem.id}-${index}`}
          example={{ code: solution.code, walkthrough: solution.walkthrough }}
          testCases={problem.examples}
        />
        <OpenInJsRunner code={solution.code} examples={problem.examples} />
      </div>
    </div>
  );
}

/** Sends the solution, plus calls for each example, to the full JS Runner tool. */
function OpenInJsRunner({ code, examples }: { code: string; examples: ProblemExample[] }) {
  if (playgroundPlan({ code })?.target !== 'worker') return null;
  return (
    <Link
      to="/tools/js-runner"
      onClick={() => sendText({ to: 'js-runner', text: code + buildAutoRunHarness(code, examples), from: 'learn', kind: 'code', lang: looksLikeTypeScript(code) ? 'ts' : 'js' })}
      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 pointer-coarse:min-h-11 dark:text-emerald-400 dark:ring-slate-700 dark:hover:bg-slate-800"
    >
      <Icon name="play" className="h-4 w-4" /> Open in JS Runner
    </Link>
  );
}
