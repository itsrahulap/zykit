import { useMemo, useState } from 'react';
import codeComplexityAnalyzer from './index';
import {
  ANALYZE_TIMEOUT_MS,
  DEFAULT_THRESHOLDS,
  exceeds,
  languageFromFileName,
  MAX_INPUT,
  topFunctions,
  type FunctionMetrics,
  type Language,
  type Thresholds,
} from './features/code-complexity-analyzer';
import { MarkedSource } from './components/MarkedSource';
import { useComplexity } from './hooks/useComplexity';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useOverflow } from '../../shared/hooks/useOverflow';
import { OpenFileButton } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Select, type SelectOption } from '../../shared/ui/Select';
import { Breadcrumb, CodeArea } from '../../shared/ui/tool';
import { Badge, Button, Card, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

const INPUT =
  'w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-900 dark:text-slate-100';

const LANGUAGES: SelectOption<Language>[] = [
  { value: 'tsx', label: 'TypeScript + JSX (.tsx)' },
  { value: 'ts', label: 'TypeScript (.ts)' },
  { value: 'jsx', label: 'JavaScript + JSX (.jsx)' },
  { value: 'js', label: 'JavaScript (.js)' },
];

const CODE_FILES = '.js,.jsx,.mjs,.cjs,.ts,.tsx,.mts,.cts,text/javascript,text/typescript';

const SAMPLE = `export function shippingCost(order: Order, region?: Region): number {
  if (!order.items.length) return 0;
  let total = 0;
  for (const item of order.items) {
    if (item.digital) continue;
    switch (item.size) {
      case 'small':
        total += region?.rates.small ?? 4;
        break;
      case 'large':
        total += item.fragile && !item.insured ? 25 : 15;
        break;
      default:
        total += 8;
    }
  }
  try {
    return order.express || order.priority ? total * 2 : total;
  } catch (error) {
    return total;
  }
}

class Cart {
  items: Item[] = [];
  get count() {
    return this.items.length;
  }
  add = (item: Item) => {
    if (this.items.some((existing) => existing.id === item.id)) return;
    this.items.push(item);
  };
}
`;

const THRESHOLD_FIELDS: { key: keyof Thresholds; label: string }[] = [
  { key: 'complexity', label: 'Complexity above' },
  { key: 'nesting', label: 'Nesting above' },
  { key: 'lines', label: 'Lines above' },
];

const overList = (fn: FunctionMetrics, thresholds: Thresholds) =>
  Object.entries(exceeds(fn, thresholds))
    .filter(([, over]) => over)
    .map(([metric]) => metric);

function FunctionTable({
  label,
  functions,
  thresholds,
  selected,
  onSelect,
}: {
  label: string;
  functions: FunctionMetrics[];
  thresholds: Thresholds;
  selected: FunctionMetrics | undefined;
  onSelect: (fn: FunctionMetrics) => void;
}) {
  const [ref, overflowing] = useOverflow<HTMLDivElement>(functions);
  const over = (bad: boolean) => (bad ? 'font-semibold text-red-700 dark:text-red-400' : '');
  return (
    <div ref={ref} role="region" aria-label={label} tabIndex={overflowing ? 0 : undefined} className="max-h-[32rem] overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-slate-600 dark:text-slate-400">
          <tr>
            <th scope="col" className="py-2 pr-3 font-medium">Function</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Line</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Complexity</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Nesting</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Lines</th>
            <th scope="col" className="py-2 font-medium">Over threshold</th>
          </tr>
        </thead>
        <tbody>
          {functions.map((fn) => {
            const exceeded = exceeds(fn, thresholds);
            const overNames = overList(fn, thresholds);
            return (
              <tr key={fn.start} className="border-t border-slate-100 text-slate-800 dark:border-slate-800 dark:text-slate-200">
                <td className="py-1.5 pr-3">
                  <button
                    type="button"
                    aria-pressed={selected?.start === fn.start}
                    onClick={() => onSelect(fn)}
                    className="rounded-lg px-1 py-0.5 text-left font-mono text-emerald-700 underline-offset-2 hover:underline aria-pressed:bg-emerald-50 pointer-coarse:min-h-11 dark:text-emerald-400 dark:aria-pressed:bg-emerald-950"
                  >
                    {fn.name}
                  </button>
                  <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">{fn.kind}</span>
                </td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{fn.startLine}</td>
                <td className={`py-1.5 pr-3 text-right tabular-nums ${over(exceeded.complexity)}`}>{fn.complexity}</td>
                <td className={`py-1.5 pr-3 text-right tabular-nums ${over(exceeded.nesting)}`}>{fn.maxNesting}</td>
                <td className={`py-1.5 pr-3 text-right tabular-nums ${over(exceeded.lines)}`}>{fn.lines}</td>
                <td className="py-1.5">{overNames.length ? <Badge tone="red">{overNames.join(', ')}</Badge> : <span className="text-slate-500">—</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function CodeComplexityAnalyzerPage() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<Language>('tsx');
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [selectedStart, setSelectedStart] = useState<number | null>(null);

  const tooLarge = code.length > MAX_INPUT;
  const state = useComplexity(tooLarge ? '' : code, language);
  const analysis = state.status === 'done' ? state.analysis : null;
  const functions = useMemo(() => analysis?.functions ?? [], [analysis]);
  const top = useMemo(() => topFunctions(functions), [functions]);
  const selected = functions.find((fn) => fn.start === selectedStart) ?? top[0];
  const overCount = functions.filter((fn) => overList(fn, thresholds).length > 0).length;

  useIncomingText(codeComplexityAnalyzer.id, (text) => setCode(text));

  const syntaxCount = analysis ? analysis.syntaxErrors.length + analysis.moreSyntaxErrors : 0;
  const status = tooLarge
    ? `The code is too long (limit: ${MAX_INPUT.toLocaleString('en-US')} characters).`
    : state.status === 'idle'
      ? 'Paste JavaScript or TypeScript to start.'
      : state.status === 'loading'
        ? 'Loading the TypeScript parser…'
        : state.status === 'running'
          ? 'Analyzing…'
          : state.status === 'timeout'
            ? `Stopped after ${ANALYZE_TIMEOUT_MS / 1000} s. The input may be too large or deeply nested.`
            : state.status === 'error'
              ? state.error
              : `${pluralize(functions.length, 'function')}, ${overCount} over a threshold${syntaxCount ? `, ${pluralize(syntaxCount, 'syntax error')}` : ''}.`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={codeComplexityAnalyzer} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="functions">Find the most complex </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => { setCode(SAMPLE); setLanguage('tsx'); }}>
            Try an example
          </Button>
          <OpenFileButton
            accept={CODE_FILES}
            onText={(text, file) => {
              setCode(text);
              setLanguage((current) => languageFromFileName(file.name) ?? current);
            }}
          />
          <Button variant="ghost" disabled={!code} onClick={() => setCode('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={state.status === 'loading' || state.status === 'running' ? 'busy' : analysis ? 'good' : 'neutral'} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <CodeArea
          label="Code"
          hint="JavaScript or TypeScript"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onFileText={(text, file) => {
            setCode(text);
            setLanguage((current) => languageFromFileName(file.name) ?? current);
          }}
          rows={14}
          placeholder="function example(a) { if (a) return 1; return 0; }"
        />
        <section aria-label="Options" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <Select label="Language" options={LANGUAGES} value={language} onChange={setLanguage} />
          {THRESHOLD_FIELDS.map(({ key, label }) => (
            <label key={key} className="block">
              <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">{label}</span>
              <input
                type="number"
                min={0}
                max={9999}
                inputMode="numeric"
                className={INPUT}
                value={thresholds[key]}
                onChange={(e) => {
                  const value = e.target.valueAsNumber;
                  setThresholds((current) => ({ ...current, [key]: Number.isFinite(value) ? Math.max(0, Math.floor(value)) : DEFAULT_THRESHOLDS[key] }));
                }}
              />
            </label>
          ))}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Complexity = 1 + each <code>if</code>, <code>?:</code>, <code>case</code>, loop, <code>catch</code>, <code>&&</code>, <code>||</code>, <code>??</code> and{' '}
            <code>&&=</code> <code>||=</code> <code>??=</code>. Not counted: <code>else</code>, <code>default</code>, <code>?.</code>.
          </p>
        </section>
      </div>

      {analysis && analysis.syntaxErrors.length > 0 && (
        <section
          aria-label="Syntax errors"
          className="space-y-2 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <h2 className="font-semibold">Syntax errors (the rest of the code was still analyzed)</h2>
          <ul className="space-y-1 font-mono">
            {analysis.syntaxErrors.map((error, i) => (
              <li key={i} className="break-words">
                {error.line}:{error.column} {error.message}
              </li>
            ))}
          </ul>
          {analysis.moreSyntaxErrors > 0 && <p>…and {analysis.moreSyntaxErrors} more.</p>}
        </section>
      )}

      {analysis && functions.length === 0 && (
        <p className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          No functions found. Top-level code outside functions isn't measured.
        </p>
      )}

      {functions.length > 0 && (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Top 10" subtitle="Highest complexity first, then deepest nesting, then most lines. Pick one to see its source.">
              <FunctionTable label="Top 10 functions" functions={top} thresholds={thresholds} selected={selected} onSelect={(fn) => setSelectedStart(fn.start)} />
            </Card>
            {selected && (
              <Card
                title={<span className="break-all font-mono">{selected.name}</span>}
                subtitle={`Lines ${selected.startLine}–${selected.endLine} · complexity ${selected.complexity} · nesting ${selected.maxNesting} · ${pluralize(selected.decisions.length, 'decision point')} marked`}
              >
                {/* The analyzed text, not the live input: offsets must match while a newer edit is analyzed. */}
                <MarkedSource code={state.status === 'done' ? state.code : code} fn={selected} />
              </Card>
            )}
          </div>
          <Card title="All functions" subtitle={`${pluralize(functions.length, 'function')} in source order. Nested functions are measured on their own.`}>
            <FunctionTable label="All functions" functions={functions} thresholds={thresholds} selected={selected} onSelect={(fn) => setSelectedStart(fn.start)} />
          </Card>
        </>
      )}
    </div>
  );
}
