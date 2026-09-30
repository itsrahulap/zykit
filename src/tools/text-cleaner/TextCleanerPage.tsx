import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import textCleaner from './index';
import { cleanText, defaultSteps, STEP_LABELS, type Step, type StepOptions } from './features/clean';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { sanitizeShare } from '../../shared/lib/share';
import { Checkbox, OpenFileButton, OutputPanel } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

const SAMPLE = `  banana
apple
   Cherry   pie

apple
Banana
item10
item2
​zero-width here
`;

const textInput =
  'min-w-0 rounded-lg border border-field-edge bg-white px-2.5 py-1.5 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-950 dark:text-slate-100';
const iconButton =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 pointer-coarse:h-11 pointer-coarse:w-11 dark:text-slate-400 dark:hover:bg-slate-800';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="inline-flex min-w-0 items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      {label}
      {children}
    </label>
  );
}

function StepOptionsView({ step, set }: { step: Step; set: (options: object) => void }) {
  switch (step.id) {
    case 'trim':
      return (
        <Segmented<StepOptions['trim']['mode']>
          label="Trim which side"
          options={[
            { value: 'both', label: 'Both ends' },
            { value: 'start', label: 'Start' },
            { value: 'end', label: 'End' },
          ]}
          value={step.options.mode}
          onChange={(mode) => set({ mode })}
        />
      );
    case 'dedupe':
      return (
        <>
          <Checkbox label="Ignore case" checked={step.options.ignoreCase} onChange={(ignoreCase) => set({ ignoreCase })} />
          <Segmented<'first' | 'last'>
            label="Keep which duplicate"
            options={[
              { value: 'first', label: 'Keep first' },
              { value: 'last', label: 'Keep last' },
            ]}
            value={step.options.keep}
            onChange={(keep) => set({ keep })}
          />
        </>
      );
    case 'filter':
      return (
        <>
          <Segmented<'containing' | 'not-containing'>
            label="Filter mode"
            options={[
              { value: 'containing', label: 'Keep lines containing' },
              { value: 'not-containing', label: 'Remove lines containing' },
            ]}
            value={step.options.mode}
            onChange={(mode) => set({ mode })}
          />
          <input aria-label="Filter text" placeholder="text" value={step.options.text} onChange={(e) => set({ text: e.target.value })} className={`${textInput} w-40`} />
          <Checkbox label="Ignore case" checked={step.options.ignoreCase} onChange={(ignoreCase) => set({ ignoreCase })} />
        </>
      );
    case 'sort':
      return (
        <>
          <Select<StepOptions['sort']['order']>
            label="Order"
            options={[
              { value: 'az', label: 'A → Z' },
              { value: 'za', label: 'Z → A' },
              { value: 'natural', label: 'Natural (numbers by value)' },
              { value: 'length', label: 'By length' },
              { value: 'random', label: 'Random' },
            ]}
            value={step.options.order}
            onChange={(order) => set({ order })}
          />
          {step.options.order !== 'random' && step.options.order !== 'length' && (
            <Checkbox label="Ignore case" checked={step.options.ignoreCase} onChange={(ignoreCase) => set({ ignoreCase })} />
          )}
          {step.options.order === 'random' && (
            <button type="button" className="text-sm font-semibold text-emerald-700 pointer-coarse:min-h-11 hover:underline dark:text-emerald-400" onClick={() => set({ seed: step.options.seed + 1 })}>
              Shuffle again
            </button>
          )}
        </>
      );
    case 'tabs':
      return (
        <>
          <Segmented<StepOptions['tabs']['direction']>
            label="Tab direction"
            options={[
              { value: 'tabs-to-spaces', label: 'Tabs → spaces' },
              { value: 'spaces-to-tabs', label: 'Leading spaces → tabs' },
            ]}
            value={step.options.direction}
            onChange={(direction) => set({ direction })}
          />
          <Select<number>
            label="Tab width"
            options={[2, 4, 8].map((n) => ({ value: n, label: String(n) }))}
            value={step.options.width}
            onChange={(width) => set({ width })}
          />
        </>
      );
    case 'affix':
      return (
        <>
          <Field label="Prefix">
            <input value={step.options.prefix} onChange={(e) => set({ prefix: e.target.value })} className={`${textInput} w-28`} />
          </Field>
          <Field label="Suffix">
            <input value={step.options.suffix} onChange={(e) => set({ suffix: e.target.value })} className={`${textInput} w-28`} />
          </Field>
        </>
      );
    case 'number':
      return (
        <>
          <Field label="Start at">
            <input
              type="number"
              value={step.options.start}
              onChange={(e) => set({ start: e.target.value === '' ? 1 : Number(e.target.value) })}
              className={`${textInput} w-20`}
            />
          </Field>
          <Field label="Separator">
            <input value={step.options.separator} onChange={(e) => set({ separator: e.target.value })} className={`${textInput} w-16 font-mono`} />
          </Field>
          <Checkbox label="Pad with zeros" checked={step.options.pad} onChange={(pad) => set({ pad })} />
        </>
      );
    case 'lineEndings':
      return (
        <Segmented<'lf' | 'crlf'>
          label="Line ending"
          options={[
            { value: 'lf', label: 'LF (Unix, macOS)' },
            { value: 'crlf', label: 'CRLF (Windows)' },
          ]}
          value={step.options.to}
          onChange={(to) => set({ to })}
        />
      );
    default:
      return null;
  }
}

const TEXT_FILES = '.txt,.csv,.tsv,.md,.log,.json,.xml,.html,.yaml,.yml,text/*';

function restoreSteps(json: string): Step[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw)) return null;
  const defaults = defaultSteps();
  const out: Step[] = [];
  for (const item of raw as unknown[]) {
    if (!item || typeof item !== 'object') continue;
    const { id, enabled, options } = item as Record<string, unknown>;
    const base = defaults.find((d) => d.id === id);
    if (!base || out.some((d) => d.id === id)) continue;
    const opts = options && typeof options === 'object' && !Array.isArray(options) ? sanitizeShare(options as Record<string, unknown>, base.options) : {};
    out.push({ ...base, enabled: typeof enabled === 'boolean' ? enabled : base.enabled, options: { ...base.options, ...opts } } as Step);
  }
  return [...out, ...defaults.filter((d) => !out.some((o) => o.id === d.id))];
}

export default function TextCleanerPage() {
  const [input, setInput] = useState('');
  const [steps, setSteps] = useState<Step[]>(defaultSteps);
  const text = useDeferredValue(input);
  const result = useMemo(() => cleanText(text, steps), [text, steps]);

  useIncomingText(textCleaner.id, (t) => setInput(t));
  useShareState({ input, steps: JSON.stringify(steps) }, (r) => {
    if (r.input !== undefined) setInput(r.input);
    const restored = r.steps !== undefined && restoreSteps(r.steps);
    if (restored) setSteps(restored);
  });

  const update = (i: number, patch: Partial<Step>) => setSteps((s) => s.map((st, j) => (j === i ? ({ ...st, ...patch } as Step) : st)));
  const move = (i: number, d: -1 | 1) =>
    setSteps((s) => {
      const next = [...s];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });

  const removed = result.linesBefore - result.linesAfter;
  const status = !input
    ? 'Paste text, then switch cleaning steps on or off.'
    : `${pluralize(result.linesBefore, 'line')} → ${pluralize(result.linesAfter, 'line')}${removed > 0 ? ` · ${removed} removed` : ''}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={textCleaner} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="tidy">Make text </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Try an example
          </Button>
          <OpenFileButton accept={TEXT_FILES} onText={(t) => setInput(t)} />
          <Button variant="ghost" onClick={() => setSteps(defaultSteps())}>
            Reset steps
          </Button>
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={text !== input ? 'busy' : input ? 'good' : 'neutral'} />

      <section aria-label="Cleaning steps" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="eyebrow mb-3 flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Icon name="layers" className="h-4 w-4" /> Steps, applied top to bottom
        </h2>
        <ol className="divide-y divide-slate-100 dark:divide-slate-800">
          {steps.map((step, i) => (
            <li key={step.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
              <span className="w-5 shrink-0 text-right font-mono text-xs text-slate-500 dark:text-slate-400">{i + 1}</span>
              <span className="min-w-0 flex-1 basis-52">
                <Checkbox label={STEP_LABELS[step.id]} checked={step.enabled} onChange={(enabled) => update(i, { enabled })} />
              </span>
              {step.enabled && (
                <span className="flex min-w-0 basis-full flex-wrap items-center gap-x-4 gap-y-2 pl-9 sm:basis-auto sm:pl-0">
                  <StepOptionsView step={step} set={(options) => update(i, { options: { ...step.options, ...options } } as Partial<Step>)} />
                </span>
              )}
              <span className="ml-auto flex shrink-0 gap-1">
                <button type="button" className={iconButton} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move “${STEP_LABELS[step.id]}” up`}>
                  <Icon name="chevron-left" className="h-4 w-4 rotate-90" />
                </button>
                <button
                  type="button"
                  className={iconButton}
                  disabled={i === steps.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Move “${STEP_LABELS[step.id]}” down`}
                >
                  <Icon name="chevron-right" className="h-4 w-4 rotate-90" />
                </button>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea label="Input text" value={input} onChange={(e) => setInput(e.target.value)} rows={16} placeholder="Paste text here" onFileText={(t) => setInput(t)} />
        <div className="min-w-0 space-y-3">
          <OutputPanel title="Cleaned" icon="text" text={result.output} fileName="cleaned.txt" mime="text/plain" busy={text !== input} />
          <dl aria-label="Stats" className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {[
              ['Lines before', result.linesBefore],
              ['Lines after', result.linesAfter],
              ['Lines removed', Math.max(0, removed)],
              ['Characters', `${result.charsBefore} → ${result.charsAfter}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
                <dt className="text-xs text-slate-500 dark:text-slate-400">{k}</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">Your text is processed in your browser and never uploaded.</p>
    </div>
  );
}
