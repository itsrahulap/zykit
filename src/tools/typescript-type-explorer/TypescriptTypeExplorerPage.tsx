import { useState } from 'react';
import typescriptTypeExplorer from './index';
import { EXAMPLES } from './features/examples';
import type { Analysis } from './features/typescript-type-explorer';
import { useTypeCheck, type TypeCheckState } from './hooks/useTypeCheck';
import { useShareState } from '../../shared/hooks/useShareState';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeArea } from '../../shared/ui/tool';
import { Badge, Button, Card } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

const EXAMPLE_IDS = EXAMPLES.map((e) => e.id);
const EXAMPLE_OPTIONS = EXAMPLES.map((e) => ({ value: e.id, label: e.title }));

function statusText(state: TypeCheckState): string {
  switch (state.status) {
    case 'loading':
      return 'Loading the TypeScript compiler…';
    case 'running':
      return 'Checking…';
    case 'timeout':
      return 'The check took too long and was stopped. Simplify the types and try again.';
    case 'error':
      return state.message;
    case 'done': {
      const errors = state.analysis.diagnostics.filter((d) => d.category === 'error').length;
      const types = pluralize(state.analysis.declarations.length, 'type');
      return errors ? `${pluralize(errors, 'error')} · ${types} resolved` : `No errors · ${types} resolved`;
    }
  }
}

/** Renders `code` spans in an explanation as <code>; everything stays text. */
function Explanation({ text }: { text: string }) {
  return (
    <p className="text-slate-700 dark:text-slate-300">
      {text.split('`').map((part, i) =>
        i % 2 ? (
          <code key={i} className="rounded bg-slate-100 px-1 font-mono text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </p>
  );
}

function Results({ analysis, lookAt }: { analysis: Analysis; lookAt: string[] }) {
  return (
    <>
      <Card title="Diagnostics" subtitle="Errors from the compiler, as line:column">
        {analysis.diagnostics.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">No errors.</p>
        ) : (
          <ul className="space-y-3">
            {analysis.diagnostics.map((d, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-2 text-sm">
                <Badge tone={d.category === 'error' ? 'red' : 'amber'}>
                  {d.line}:{d.column}
                </Badge>
                <span className="min-w-0 break-words font-mono text-slate-800 dark:text-slate-200">
                  {d.message} <span className="text-slate-500 dark:text-slate-400">(TS{d.code})</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Resolved types" subtitle="Every top-level type alias, variable and function, as the compiler sees it">
        {analysis.declarations.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">Declare a type alias or a const to see its type.</p>
        ) : (
          <div tabIndex={0} role="region" aria-label="Resolved types" className="overflow-x-auto rounded-2xl">
            <dl className="space-y-3">
              {analysis.declarations.map((d) => (
                <div key={`${d.kind}-${d.name}-${d.line}`} className={`rounded-2xl p-3 ${lookAt.includes(d.name) ? 'bg-emerald-50 dark:bg-emerald-950/50' : 'bg-slate-50 dark:bg-slate-950'}`}>
                  <dt className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{d.name}</span>
                    <Badge>{d.kind}</Badge>
                    <span className="text-slate-500 dark:text-slate-400">line {d.line}</span>
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words font-mono text-sm text-slate-800 dark:text-slate-300">{d.type}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Card>
    </>
  );
}

export default function TypescriptTypeExplorerPage() {
  const [exampleId, setExampleId] = useState(EXAMPLES[0].id);
  const [code, setCode] = useState(EXAMPLES[0].code);
  const example = EXAMPLES.find((e) => e.id === exampleId) ?? EXAMPLES[0];
  const { state, version, lastAnalysis } = useTypeCheck(code);

  useShareState({ example: exampleId, code }, (restored) => {
    if (restored.example) setExampleId(restored.example);
    if (restored.code !== undefined) setCode(restored.code);
  }, { example: EXAMPLE_IDS });

  const chooseExample = (id: string) => {
    setExampleId(id);
    setCode(EXAMPLES.find((e) => e.id === id)?.code ?? '');
  };

  const busy = state.status === 'loading' || state.status === 'running';
  const tone = busy ? 'busy' : state.status === 'done' && !state.analysis.diagnostics.length ? 'good' : 'neutral';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={typescriptTypeExplorer} />
      <Headline accent="compiler">Explore TypeScript types with the real </Headline>
      <StatusStrip status={statusText(state)} tone={tone} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-80">
          <Select label="Example" options={EXAMPLE_OPTIONS} value={exampleId} onChange={chooseExample} />
        </div>
        <Button variant="secondary" onClick={() => setCode(example.code)} disabled={code === example.code}>
          Reset example
        </Button>
        {version && <Badge tone="blue">TypeScript {version}</Badge>}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <Card title={example.title}>
            <div className="space-y-3">
              <Explanation text={example.explanation} />
              <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                Look at:
                {example.lookAt.map((name) => (
                  <code key={name} className="rounded bg-emerald-50 px-1.5 font-mono text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {name}
                  </code>
                ))}
              </p>
            </div>
          </Card>
          <CodeArea label="TypeScript code" hint="Edit it: types update as you type" value={code} onChange={(e) => setCode(e.target.value)} rows={18} />
        </div>
        <div className="min-w-0 space-y-6">
          {lastAnalysis && (state.status === 'done' || state.status === 'running') ? (
            <Results analysis={lastAnalysis} lookAt={example.lookAt} />
          ) : (
            <Card title="Compiler output">
              <p className="text-slate-600 dark:text-slate-400">
                {state.status === 'loading' ? 'Loading the TypeScript compiler… (about 1 MB, downloaded once)' : statusText(state)}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
