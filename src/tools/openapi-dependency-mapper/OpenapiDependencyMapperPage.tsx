import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import openapiDependencyMapper from './index';
import { EMPTY_FILTER, buildDependencyMap, documentTitle, filterMap, toMarkdown, toSummaryJson, type DependencyMap, type MapFilter } from './features/dependency-map';
import { MAX_GRAPH_NODES, NODE_H, NODE_W, edgePath, layoutGraph } from './features/layout';
import { HTTP_METHODS, parseSpec, toJsonText } from '../openapi-designer/features/openapi';
import { sampleDocument } from '../openapi-designer/features/sample';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import type { TextError } from '../../shared/lib/textpos';
import { ErrorPanel, Notices, OpenFileButton, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Badge, Button } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

const PARSE_DELAY_MS = 250;
const inputCls =
  'w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

type Parsed = { ok: true; map: DependencyMap; title: string; warnings: string[] } | { ok: false; error: TextError } | null;

function FilterText({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block min-w-0 flex-1 basis-40">
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <input type="search" className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} autoComplete="off" />
    </label>
  );
}

function RefList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{title}</h4>
      <p className="mt-0.5 break-words text-sm text-slate-800 dark:text-slate-200">{items.length ? items.join(', ') : 'none'}</p>
    </div>
  );
}

function Details({ map, selected }: { map: DependencyMap; selected: string | null }) {
  const name = (k: string) => map.components.find((c) => c.key === k)?.name ?? k;
  const op = map.operations.find((o) => o.key === selected);
  const comp = map.components.find((c) => c.key === selected);
  if (op)
    return (
      <div className="space-y-3">
        <h3 className="break-all font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{op.key}</h3>
        {op.summary && <p className="break-words text-sm text-slate-700 dark:text-slate-300">{op.summary}</p>}
        <RefList title="operationId" items={op.operationId ? [op.operationId] : []} />
        <RefList title="Tags" items={op.tags} />
        <RefList title="Parameters" items={op.parameters.map((p) => `${p.name} (${p.in}${p.required ? ', required' : ''})`)} />
        <RefList title="Request body" items={op.requestRefs.map(name)} />
        {op.responseRefs.map((r) => (
          <RefList key={r.status} title={`Response ${r.status}`} items={r.refs.map(name)} />
        ))}
        <RefList title="All components used" items={op.allRefs.map(name)} />
      </div>
    );
  if (comp)
    return (
      <div className="space-y-3">
        <h3 className="break-all font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{comp.name}</h3>
        <div className="flex flex-wrap gap-2">
          <Badge tone="violet">{comp.section}</Badge>
          {comp.cyclic && <Badge tone="amber">cycle</Badge>}
          {comp.usedBy.length === 0 && <Badge>unused</Badge>}
        </div>
        <RefList title="References" items={comp.refs.map(name)} />
        <RefList title="Referenced by" items={comp.referencedBy.map(name)} />
        <RefList title="Used by operations" items={comp.usedBy} />
      </div>
    );
  return <p className="text-sm text-slate-600 dark:text-slate-400">Select an operation or a component in the graph to see its details.</p>;
}

export default function OpenapiDependencyMapperPage() {
  const [input, setInput] = useState('');
  const [lastParsed, setParsed] = useState<Parsed>(null);
  const [filter, setFilter] = useState<MapFilter>(EMPTY_FILTER);
  const [selected, setSelected] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'json'>('markdown');
  const inputId = useId();
  const arrowId = `${useId()}-arrow`;

  useIncomingText(openapiDependencyMapper.id, (text) => setInput(text));

  useEffect(() => {
    if (!input.trim()) return;
    let live = true;
    const timer = setTimeout(() => {
      parseSpec(input).then(
        (r) => {
          if (!live) return;
          setParsed(r.ok ? { ok: true, map: buildDependencyMap(r.doc), title: documentTitle(r.doc), warnings: r.warnings } : r);
          setSelected(null);
        },
        (err: unknown) => live && setParsed({ ok: false, error: { message: err instanceof Error ? err.message : 'Couldn’t read the document.', line: 1, column: 1, offset: 0 } }),
      );
    }, PARSE_DELAY_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [input]);

  // Cleared input shows nothing, without waiting for (or dispatching) a parse.
  const parsed = input.trim() ? lastParsed : null;
  const map = parsed?.ok ? parsed.map : null;
  const view = useMemo(() => (map ? filterMap(map, filter) : null), [map, filter]);
  const nodeCount = view ? view.operations.length + view.components.length : 0;
  const graph = useMemo(() => (view && nodeCount > 0 && nodeCount <= MAX_GRAPH_NODES ? layoutGraph(view.operations, view.components) : null), [view, nodeCount]);
  const exported = useMemo(() => (map && parsed?.ok ? (exportFormat === 'markdown' ? toMarkdown(map, parsed.title) : toSummaryJson(map)) : ''), [map, parsed, exportFormat]);

  const highlighted = useMemo(() => {
    if (!selected || !map) return null;
    const op = map.operations.find((o) => o.key === selected);
    const comp = map.components.find((c) => c.key === selected);
    return new Set([selected, ...(op?.allRefs ?? []), ...(comp ? [...comp.refs, ...comp.referencedBy, ...comp.usedBy] : [])]);
  }, [selected, map]);

  const status = !parsed
    ? 'Paste an OpenAPI 3.0 or 3.1 document to map it.'
    : !parsed.ok
      ? 'The document couldn’t be read.'
      : `${pluralize(parsed.map.operations.length, 'operation')} · ${pluralize(parsed.map.components.length, 'component')} · ${pluralize(parsed.map.unresolved.length, 'unresolved $ref')}`;

  const problems = map
    ? [
        ...(parsed?.ok ? parsed.warnings : []),
        ...map.notices,
        ...map.unresolved.slice(0, 20).map((r) => `Unresolved $ref "${r.ref}" at ${r.at}.`),
        ...(map.unresolved.length > 20 ? [`…and ${map.unresolved.length - 20} more unresolved $refs.`] : []),
        ...map.remote.slice(0, 20).map((r) => `External $ref "${r.ref}" at ${r.at} was not fetched.`),
        ...(map.remote.length > 20 ? [`…and ${map.remote.length - 20} more external $refs.`] : []),
        ...map.unsupported,
      ]
    : [];

  const nodeKeyDown = (e: KeyboardEvent, key: string) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    setSelected(key);
  };

  return (
    <div className="space-y-8">
      <Breadcrumb tool={openapiDependencyMapper} />
      <Headline accent="schemas">Map operations to </Headline>
      <StatusStrip status={status} tone={map ? 'good' : 'neutral'} />

      <section aria-label="Input" className="space-y-3">
        <CodeArea
          id={inputId}
          label="OpenAPI document (JSON or YAML)"
          hint="Remote $refs are never fetched"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFileText={(text) => setInput(text)}
          rows={10}
        />
        <div className="flex flex-wrap items-center gap-2">
          <OpenFileButton accept=".json,.yaml,.yml,application/json,application/yaml,text/yaml" onText={(text) => setInput(text)} />
          <Button variant="secondary" onClick={() => setInput(toJsonText(sampleDocument()))}>
            Try an example
          </Button>
          {input && (
            <Button variant="ghost" onClick={() => setInput('')}>
              Clear
            </Button>
          )}
        </div>
        {parsed && !parsed.ok && <ErrorPanel error={parsed.error} text={input} inputId={inputId} title="Couldn’t read the document" />}
        <Notices items={problems} />
      </section>

      {map && view && (
        <>
          <OptionsCard label="Filters">
            <div className="w-full sm:w-auto">
              <Select label="Tag" options={[{ value: '', label: 'All tags' }, ...map.tags.map((t) => ({ value: t, label: t }))]} value={filter.tag} onChange={(tag) => setFilter({ ...filter, tag })} />
            </div>
            <div className="w-full sm:w-auto">
              <Select
                label="Method"
                options={[{ value: '', label: 'All methods' }, ...HTTP_METHODS.map((m) => ({ value: m, label: m.toUpperCase() }))]}
                value={filter.method}
                onChange={(method) => setFilter({ ...filter, method })}
              />
            </div>
            <FilterText label="Path or operationId" value={filter.path} onChange={(path) => setFilter({ ...filter, path })} />
            <FilterText label="Schema name" value={filter.schema} onChange={(schema) => setFilter({ ...filter, schema })} />
          </OptionsCard>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section aria-label="Dependency graph" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p aria-live="polite" className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                Showing {pluralize(view.operations.length, 'operation')} and {pluralize(view.components.length, 'component')}.
              </p>
              {!graph ? (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {nodeCount === 0
                    ? 'Nothing matches the filters.'
                    : `Too many nodes to draw (more than ${MAX_GRAPH_NODES}). Narrow it down with the filters, or use the export below.`}
                </p>
              ) : (
                <div role="region" aria-label="Graph (scrollable)" tabIndex={0} className="max-h-[36rem] overflow-auto rounded-2xl bg-slate-50 dark:bg-slate-950">
                  <svg width={graph.width} height={graph.height} viewBox={`0 0 ${graph.width} ${graph.height}`} className="block text-slate-500 dark:text-slate-400">
                    <defs>
                      <marker id={arrowId} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
                      </marker>
                    </defs>
                    {graph.edges.map((e) => {
                      const a = graph.nodes.find((n) => n.key === e.from)!;
                      const b = graph.nodes.find((n) => n.key === e.to)!;
                      const on = !highlighted || (highlighted.has(e.from) && highlighted.has(e.to));
                      return <path key={`${e.from}>${e.to}`} d={edgePath(a, b)} fill="none" stroke="currentColor" strokeWidth={on && highlighted ? 2 : 1} opacity={on ? 0.8 : 0.15} markerEnd={`url(#${arrowId})`} />;
                    })}
                    {graph.nodes.map((n) => {
                      const isOp = n.kind === 'operation';
                      const dim = highlighted && !highlighted.has(n.key);
                      const label = n.label.length > 30 ? `${n.label.slice(0, 29)}…` : n.label;
                      return (
                        <g
                          key={n.key}
                          role="button"
                          tabIndex={0}
                          aria-label={`${isOp ? 'Operation' : 'Component'} ${n.label}`}
                          aria-pressed={selected === n.key}
                          onClick={() => setSelected(n.key)}
                          onKeyDown={(e) => nodeKeyDown(e, n.key)}
                          opacity={dim ? 0.35 : 1}
                          className="cursor-pointer focus:outline-none [&:focus-visible>rect]:stroke-emerald-500 [&:focus-visible>rect]:stroke-[3]"
                        >
                          <title>{n.label}</title>
                          <rect
                            x={n.x}
                            y={n.y}
                            width={NODE_W}
                            height={NODE_H}
                            rx={10}
                            strokeWidth={selected === n.key ? 2.5 : 1}
                            className={
                              isOp
                                ? 'fill-sky-50 stroke-sky-600 dark:fill-sky-950 dark:stroke-sky-400'
                                : 'fill-violet-50 stroke-violet-600 dark:fill-violet-950 dark:stroke-violet-400'
                            }
                          />
                          <text x={n.x + 10} y={n.y + NODE_H / 2} dominantBaseline="central" className="fill-slate-900 font-mono text-xs dark:fill-slate-100">
                            {label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </section>

            <section aria-label="Details" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="eyebrow mb-3 text-slate-600 dark:text-slate-400">Details</h2>
              <div aria-live="polite">
                <Details map={map} selected={selected} />
              </div>
            </section>
          </div>

          <div className="space-y-3">
            <Segmented
              label="Export format"
              options={[
                { value: 'markdown', label: 'Markdown' },
                { value: 'json', label: 'JSON' },
              ]}
              value={exportFormat}
              onChange={setExportFormat}
            />
            <OutputPanel
              title="Summary"
              text={exported}
              fileName={exportFormat === 'markdown' ? 'api-dependencies.md' : 'api-dependencies.json'}
              mime={exportFormat === 'markdown' ? 'text/markdown' : 'application/json'}
              kind={exportFormat === 'markdown' ? 'markdown' : 'json'}
            />
          </div>
        </>
      )}
    </div>
  );
}
