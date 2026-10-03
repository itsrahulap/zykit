import { useEffect, useMemo, useState } from 'react';
import kubernetesYamlChecker from './index';
import { check, MAX_INPUT_CHARS, SAMPLE, type CheckResult, type Finding, type Severity } from './features/kubernetes-yaml-checker';
import { OpenFileButton } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

type Filter = 'all' | Severity;
const TONE = { error: 'red', warning: 'amber', info: 'blue' } as const;
const LABEL = { error: 'Error', warning: 'Warning', info: 'Tip' } as const;

function FindingCard({ f }: { f: Finding }) {
  return (
    <li className="min-w-0 space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={TONE[f.severity]}>{LABEL[f.severity]}</Badge>
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 break-all">{f.resource}</span>
      </div>
      <h3 className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{f.title}</h3>
      <p className="break-words text-sm text-slate-700 dark:text-slate-300">{f.explain}</p>
      {f.fix && (
        <div>
          <div className="flex items-center justify-between">
            <span className="eyebrow text-slate-600 dark:text-slate-400">Suggested fix</span>
            <CopyButton text={f.fix} />
          </div>
          <CodeBlock label={`Fix for ${f.title}`}>{f.fix}</CodeBlock>
        </div>
      )}
    </li>
  );
}

export default function KubernetesYamlCheckerPage() {
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [result, setResult] = useState<{ for: string; value: CheckResult } | null>(null);

  useEffect(() => {
    if (!input.trim()) return;
    let live = true;
    const timer = setTimeout(() => void check(input).then((value) => live && setResult({ for: input, value })), 200);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [input]);

  useIncomingText(kubernetesYamlChecker.id, (t) => setInput(t));
  useShareState({ input, filter }, (s) => {
    if (s.input !== undefined) setInput(s.input);
    if (s.filter) setFilter(s.filter);
  }, { filter: ['all', 'error', 'warning', 'info'] });

  const current = useMemo(() => (result && result.for === input ? result.value : null), [result, input]);
  const shown = current ? current.findings.filter((f) => filter === 'all' || f.severity === filter) : [];
  const stale = !!input.trim() && !current;
  const status = !input.trim()
    ? 'Paste Kubernetes YAML to check it.'
    : current?.error
      ? current.error
      : current
        ? `${pluralize(current.resources.length, 'resource')}: ${pluralize(current.counts.error, 'error')}, ${pluralize(current.counts.warning, 'warning')}, ${pluralize(current.counts.info, 'tip')}.`
        : 'Checking…';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={kubernetesYamlChecker} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="manifests">Check Kubernetes </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Example
          </Button>
          <OpenFileButton accept=".yml,.yaml,.txt,text/plain" onText={(t) => setInput(t)} />
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>
      <StatusStrip status={status} tone={stale ? 'busy' : current && !current.error ? (current.counts.error ? 'neutral' : 'good') : 'neutral'} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          label="Kubernetes YAML"
          hint="multi-document (---) supported"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={22}
          maxLength={MAX_INPUT_CHARS + 1}
          placeholder={'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web'}
          onFileText={(t) => setInput(t)}
        />
        <div className="min-w-0 space-y-6">
          {current && current.resources.length > 0 && (
            <section aria-label="Resources" className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="eyebrow mb-3 text-slate-600 dark:text-slate-400">Resources</h2>
              <div role="region" aria-label="Resource table" tabIndex={0} className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-600 dark:text-slate-400">
                      <th scope="col" className="py-1 pr-3 font-medium">Kind</th>
                      <th scope="col" className="py-1 pr-3 font-medium">Name</th>
                      <th scope="col" className="py-1 pr-3 font-medium">Namespace</th>
                      <th scope="col" className="py-1 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.resources.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 align-top text-slate-800 dark:border-slate-800 dark:text-slate-200">
                        <td className="py-1.5 pr-3 whitespace-nowrap">{r.kind}</td>
                        <td className="py-1.5 pr-3 font-mono text-xs">{r.name}</td>
                        <td className="py-1.5 pr-3 font-mono text-xs">{r.namespace}</td>
                        <td className="py-1.5 text-xs text-slate-600 dark:text-slate-400">{r.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {current && current.findings.length > 0 && (
            <section aria-label="Findings" className="space-y-3">
              <Segmented<Filter>
                label="Show findings"
                options={[
                  { value: 'all', label: `All (${current.findings.length})` },
                  { value: 'error', label: `Errors (${current.counts.error})` },
                  { value: 'warning', label: `Warnings (${current.counts.warning})` },
                  { value: 'info', label: `Tips (${current.counts.info})` },
                ]}
                value={filter}
                onChange={setFilter}
              />
              <ul className="space-y-3">
                {shown.map((f, i) => (
                  <FindingCard key={`${f.id}${f.resource}${i}`} f={f} />
                ))}
              </ul>
            </section>
          )}
          {current && !current.error && current.resources.length > 0 && current.findings.length === 0 && (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">No problems found.</p>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Checking runs in your browser; nothing is uploaded. This is a linter for common mistakes, not a replacement for <code>kubectl apply --dry-run=server</code>.
      </p>
    </div>
  );
}
