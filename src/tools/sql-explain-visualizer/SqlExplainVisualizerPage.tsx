import { useDeferredValue, useMemo, useState } from 'react';
import sqlExplainVisualizer from './index';
import { exclusiveTime, ExplainError, findings, fmtMs, inclusiveTime, label, misestimate, nodeInfo, parseExplain, type Plan, type PlanNode } from './features/sql-explain-visualizer';
import { Notices, OpenFileButton } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';

const SAMPLE = `Sort  (cost=1100.50..1103.00 rows=1000 width=44) (actual time=95.100..120.400 rows=50000 loops=1)
  Sort Key: o.created_at DESC
  Sort Method: external merge  Disk: 2048kB
  ->  Hash Join  (cost=30.50..1050.00 rows=1000 width=44) (actual time=1.200..60.000 rows=50000 loops=1)
        Hash Cond: (o.user_id = u.id)
        ->  Seq Scan on orders o  (cost=0.00..900.00 rows=1000 width=36) (actual time=0.010..40.000 rows=50000 loops=1)
              Filter: (status = 'paid'::text)
              Rows Removed by Filter: 150000
        ->  Hash  (cost=18.00..18.00 rows=1000 width=12) (actual time=1.100..1.100 rows=1000 loops=1)
              ->  Index Only Scan using users_pkey on users u  (cost=0.28..18.00 rows=1000 width=12) (actual time=0.020..0.700 rows=1000 loops=1)
Planning Time: 0.250 ms
Execution Time: 125.000 ms`;

const na = <span className="text-slate-500 dark:text-slate-400">n/a</span>;
const fmtNum = (n: number | undefined) => (n === undefined ? na : n.toLocaleString('en-US'));

function NodeRow({ node, total }: { node: PlanNode; total?: number }) {
  const own = exclusiveTime(node);
  const share = own !== undefined && total ? own / total : undefined;
  const off = misestimate(node);
  const info = nodeInfo(node);
  const head = (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-2">
      <span className="font-semibold text-slate-900 dark:text-slate-100">{label(node)}</span>
      {node.index && <span className="font-mono text-xs text-slate-600 dark:text-slate-400">using {node.index}</span>}
      {share !== undefined && <Badge tone={share >= 0.2 ? 'red' : 'neutral'}>{`${Math.round(share * 100)}% own time`}</Badge>}
      {off !== undefined && off >= 10 && <Badge tone="amber">{`rows ${Math.round(off)}× off`}</Badge>}
      {node.sortSpillsToDisk && <Badge tone="amber">spilled to disk</Badge>}
      {node.neverExecuted && <Badge tone="neutral">never executed</Badge>}
    </span>
  );
  const body = (
    <div className="mt-2 space-y-2 pl-5 text-sm">
      {share !== undefined && (
        <div aria-hidden="true" className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full bg-red-500" style={{ width: `${Math.max(1, Math.round(share * 100))}%` }} />
        </div>
      )}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Estimated rows</dt>
          <dd className="tabular-nums">{fmtNum(node.planRows)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Actual rows × loops</dt>
          <dd className="tabular-nums">
            {node.actualRows === undefined ? na : `${node.actualRows.toLocaleString('en-US')} × ${node.loops ?? 1}`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Cost (startup..total)</dt>
          <dd className="tabular-nums">{node.totalCost === undefined ? na : `${node.startupCost}..${node.totalCost}`}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Time (total / own)</dt>
          <dd className="tabular-nums">{inclusiveTime(node) === undefined ? na : `${fmtMs(inclusiveTime(node)!)} / ${fmtMs(own!)}`}</dd>
        </div>
        {node.rowsRemovedByFilter !== undefined && (
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Removed by filter</dt>
            <dd className="tabular-nums">{node.rowsRemovedByFilter.toLocaleString('en-US')}</dd>
          </div>
        )}
        {(node.sharedHit !== undefined || node.sharedRead !== undefined) && (
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Buffers hit / read</dt>
            <dd className="tabular-nums">
              {node.sharedHit ?? 0} / {node.sharedRead ?? 0}
            </dd>
          </div>
        )}
      </dl>
      {node.details.length > 0 && (
        <ul className="space-y-0.5 font-mono text-xs break-all text-slate-700 dark:text-slate-300">
          {node.details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
      {info && <p className="text-xs text-slate-600 dark:text-slate-400">{info}</p>}
    </div>
  );
  return (
    <li className="py-1">
      <details open className="group">
        <summary className="cursor-pointer list-none pointer-coarse:min-h-11 [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="inline-block w-5 text-slate-500 transition-transform group-open:rotate-90">
            ▸
          </span>
          {head}
        </summary>
        {body}
        {node.children.length > 0 && (
          <ul className="ml-2 border-l border-slate-200 pl-3 dark:border-slate-700">
            {node.children.map((c, i) => (
              <NodeRow key={i} node={c} total={total} />
            ))}
          </ul>
        )}
      </details>
    </li>
  );
}

export default function SqlExplainVisualizerPage() {
  const [input, setInput] = useState('');
  const text = useDeferredValue(input);
  const result = useMemo((): { plan: Plan } | { error: ExplainError } | null => {
    if (!text.trim()) return null;
    try {
      return { plan: parseExplain(text) };
    } catch (e) {
      if (e instanceof ExplainError) return { error: e };
      throw e;
    }
  }, [text]);
  const plan = result && 'plan' in result ? result.plan : null;
  const total = plan ? inclusiveTime(plan.root) : undefined;
  const found = plan ? findings(plan) : [];

  const status = !result
    ? 'Paste EXPLAIN or EXPLAIN ANALYZE output (text or JSON).'
    : 'error' in result
      ? `Couldn’t read the plan: ${result.error.message}${result.error.line ? ` (line ${result.error.line})` : ''}`
      : `${plan!.format === 'json' ? 'JSON' : 'Text'} plan${plan!.analyzed ? ' with ANALYZE' : ' (estimates only)'}${plan!.executionTime !== undefined ? ` · executed in ${fmtMs(plan!.executionTime)}` : ''}${plan!.planningTime !== undefined ? ` · planned in ${fmtMs(plan!.planningTime)}` : ''}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={sqlExplainVisualizer} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="query plans">Read PostgreSQL </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Try an example
          </Button>
          <OpenFileButton accept=".txt,.json,.sql,text/plain,application/json" onText={(t) => setInput(t)} />
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>
      <StatusStrip status={status} tone={plan ? 'good' : 'neutral'} />

      <CodeArea
        label="EXPLAIN output"
        hint="EXPLAIN (ANALYZE, BUFFERS) gives the most detail"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={10}
        placeholder="Seq Scan on users  (cost=0.00..1.04 rows=4 width=36)"
        aria-invalid={result && 'error' in result ? true : undefined}
        onFileText={(t) => setInput(t)}
      />

      {plan && (
        <>
          {found.length > 0 && <Notices items={found.map((f) => f.message)} />}
          {!plan.analyzed && <p className="text-sm text-slate-600 dark:text-slate-400">This plan has estimates only. Run EXPLAIN ANALYZE to see real times and row counts.</p>}
          <section aria-label="Plan tree" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <ul className="text-slate-800 dark:text-slate-200">
              <NodeRow node={plan.root} total={total} />
            </ul>
          </section>
        </>
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400">The plan is read in your browser. Nothing connects to a database or leaves your device.</p>
    </div>
  );
}
