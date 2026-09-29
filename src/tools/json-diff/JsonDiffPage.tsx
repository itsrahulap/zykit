import { useDeferredValue, useMemo, useState } from 'react';
import jsonDiff from './index';
import { changesToJson, diffJson, formatPath, parseIgnoreKeys, preview, toJsonPatch, type Change, type DiffNode, type DiffResult } from './features/diff';
import { errorSnippet } from '../../shared/lib/textpos';
import { parseJson, type ParseResult } from '../json-formatter/features/json';
import { Checkbox } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

type View = 'tree' | 'list';
type Expand = 'auto' | 'all' | 'none';

const MAX_INPUT_CHARS = 5_000_000;
const MAX_LIST = 1000;
const MAX_CHILDREN = 300;

const SAMPLE_A = `{
  "name": "Zykit",
  "version": "1.0.0",
  "private": true,
  "users": [
    { "id": 1, "name": "Ann", "roles": ["admin"] },
    { "id": 2, "name": "Bo", "roles": [] },
    { "id": 3, "name": "Cy", "roles": ["dev"] }
  ],
  "limits": { "rate": 100, "burst": 1.0 },
  "legacy": "remove me"
}`;
const SAMPLE_B = `{
  "name": "Zykit",
  "version": "1.1.0",
  "private": true,
  "users": [
    { "id": 1, "name": "Ann", "roles": ["admin", "owner"] },
    { "id": 2, "name": "Bo", "roles": [] },
    { "id": 3, "name": "Cyrus", "roles": ["dev"] }
  ],
  "limits": { "rate": 100, "burst": 1 },
  "region": "eu"
}`;

const STATUS_STYLE = {
  added: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
  removed: 'bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-200',
  changed: 'bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
};
const MARK = { added: '+', removed: '−', changed: '~' };

function SideError({ side, text, parsed }: { side: string; text: string; parsed: ParseResult }) {
  if (parsed.ok) return null;
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950/40">
      <p className="font-medium text-red-800 dark:text-red-300">
        {side}: {parsed.error.message} (line {parsed.error.line}, column {parsed.error.column})
      </p>
      <CodeBlock className="mt-3 whitespace-pre! break-normal! overflow-x-auto bg-white! dark:bg-slate-950!">{errorSnippet(text, parsed.error)}</CodeBlock>
    </div>
  );
}

function ChangeValue({ change }: { change: Change }) {
  if (change.kind === 'changed') {
    return (
      <span className="break-all">
        <span className="text-red-700 line-through decoration-red-400/60 dark:text-red-300">{preview(change.from)}</span>
        <span className="px-1.5 text-slate-500" aria-label="changed to">
          →
        </span>
        <span className="text-emerald-700 dark:text-emerald-300">{preview(change.to)}</span>
      </span>
    );
  }
  return <span className="break-all">{preview(change.value)}</span>;
}

function ChangeList({ changes }: { changes: Change[] }) {
  if (!changes.length) return <p className="p-2 text-sm text-slate-600 dark:text-slate-400">No differences.</p>;
  return (
    <>
      <ul aria-label="Changes" className="divide-y divide-slate-100 font-mono text-sm dark:divide-slate-800">
        {changes.slice(0, MAX_LIST).map((c, i) => (
          <li key={i} className="flex min-w-0 flex-col gap-1 py-2 sm:flex-row sm:gap-3">
            <span className={`inline-flex shrink-0 items-start gap-2 rounded-md px-1.5 ${STATUS_STYLE[c.kind]}`}>
              <span aria-hidden="true">{MARK[c.kind]}</span>
              <span className="sr-only">{c.kind}</span>
              <span className="break-all">{formatPath(c.path)}</span>
            </span>
            <span className="min-w-0 text-slate-700 dark:text-slate-300">
              <ChangeValue change={c} />
            </span>
          </li>
        ))}
      </ul>
      {changes.length > MAX_LIST && (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Showing the first {MAX_LIST.toLocaleString('en-US')} of {changes.length.toLocaleString('en-US')} changes. Copy the result to get all of them.
        </p>
      )}
    </>
  );
}

function hasChange(n: DiffNode) {
  return n.status === 'object' || n.status === 'array' ? n.changed : n.status !== 'same';
}

function TreeNode({ label, node, expand }: { label: string; node: DiffNode; expand: Expand }) {
  const container = node.status === 'object' || node.status === 'array';
  const [open, setOpen] = useState(expand === 'all' || (expand === 'auto' && container && node.changed));
  const [limit, setLimit] = useState(MAX_CHILDREN);

  if (!container) {
    const cls = node.status === 'same' ? 'text-slate-700 dark:text-slate-300' : STATUS_STYLE[node.status];
    return (
      <li className={`rounded-md px-1.5 py-0.5 ${cls}`}>
        {node.status !== 'same' && (
          <>
            <span aria-hidden="true">{MARK[node.status]} </span>
            <span className="sr-only">{node.status} </span>
          </>
        )}
        <span className="text-slate-500 dark:text-slate-400">{label}: </span>
        <span className="break-all">
          {node.status === 'changed' ? (
            <>
              <span className="line-through decoration-red-400/60">{preview(node.a)}</span> → {preview(node.b)}
            </>
          ) : node.status === 'added' ? (
            preview(node.b)
          ) : (
            preview(node.a)
          )}
        </span>
      </li>
    );
  }

  const children =
    node.status === 'object'
      ? node.children.map((c) => ({ label: /^[A-Za-z_$][\w$]*$/.test(c.key) ? c.key : JSON.stringify(c.key), node: c.node }))
      : node.children.map((c) => ({ label: `[${c.bIndex ?? c.aIndex}]`, node: c.node }));
  const changedCount = children.filter((c) => hasChange(c.node)).length;
  const [openBr, closeBr] = node.status === 'object' ? ['{', '}'] : ['[', ']'];

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left pointer-coarse:min-h-11 hover:bg-slate-100 dark:hover:bg-slate-800 ${
          node.changed ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
        }`}
      >
        <Icon name="chevron-right" className={`h-3.5 w-3.5 shrink-0 transition-transform motion-reduce:transition-none ${open ? 'rotate-90' : ''}`} />
        <span className="break-all">
          {label}: {openBr}
          {open ? '' : ` ${children.length} ${closeBr}`}
        </span>
        {changedCount > 0 && <span className="rounded bg-amber-100 px-1 text-xs font-medium text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">{changedCount} changed</span>}
      </button>
      {open && (
        <ul className="ml-3 border-l border-slate-200 pl-3 dark:border-slate-700">
          {children.slice(0, limit).map((c, i) => (
            <TreeNode key={i} label={c.label} node={c.node} expand={expand} />
          ))}
          {children.length > limit && (
            <li>
              <button
                type="button"
                onClick={() => setLimit(limit + MAX_CHILDREN)}
                className="px-1.5 text-sm font-semibold text-emerald-700 pointer-coarse:min-h-11 hover:underline dark:text-emerald-400"
              >
                Show {Math.min(MAX_CHILDREN, children.length - limit)} more
              </button>
            </li>
          )}
          <li className="px-1.5 text-slate-500" aria-hidden="true">
            {closeBr}
          </li>
        </ul>
      )}
    </li>
  );
}

function DiffTree({ result }: { result: DiffResult }) {
  const [expand, setExpand] = useState<Expand>('auto');
  const [generation, setGeneration] = useState(0);
  const reset = (e: Expand) => {
    setExpand(e);
    setGeneration(generation + 1);
  };
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1">
        <button type="button" onClick={() => reset('all')} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 pointer-coarse:min-h-11 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          Expand all
        </button>
        <button type="button" onClick={() => reset('none')} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 pointer-coarse:min-h-11 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          Collapse all
        </button>
        <button type="button" onClick={() => reset('auto')} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 pointer-coarse:min-h-11 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          Show changes
        </button>
      </div>
      <ul aria-label="Diff tree" className="overflow-x-auto font-mono text-sm leading-relaxed">
        <TreeNode key={generation} label="$" node={result.tree} expand={expand} />
      </ul>
    </div>
  );
}

export default function JsonDiffPage() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [view, setView] = useState<View>('tree');
  const [ignoreArrayOrder, setIgnoreArrayOrder] = useState(false);
  const [numericEquality, setNumericEquality] = useState(false);
  const [ignoreKeysText, setIgnoreKeysText] = useState('');

  const a = useDeferredValue(left);
  const b = useDeferredValue(right);
  const stale = a !== left || b !== right;
  const tooLarge = a.length > MAX_INPUT_CHARS || b.length > MAX_INPUT_CHARS;
  const pa = useMemo(() => (a.trim() && !tooLarge ? parseJson(a) : null), [a, tooLarge]);
  const pb = useMemo(() => (b.trim() && !tooLarge ? parseJson(b) : null), [b, tooLarge]);
  const ignoreKeys = useMemo(() => parseIgnoreKeys(ignoreKeysText), [ignoreKeysText]);

  const outcome = useMemo(() => {
    if (!pa?.ok || !pb?.ok) return null;
    try {
      return { result: diffJson(pa.value, pb.value, { ignoreArrayOrder, numericEquality, ignoreKeys }) };
    } catch {
      return { error: 'These documents are nested too deeply to compare here.' };
    }
  }, [pa, pb, ignoreArrayOrder, numericEquality, ignoreKeys]);
  const result = outcome?.result ?? null;
  const patch = useMemo(() => (result ? toJsonPatch(result.tree) : ''), [result]);
  const summaryJson = useMemo(() => (result ? changesToJson(result.changes) : ''), [result]);

  const counts = result
    ? {
        added: result.changes.filter((c) => c.kind === 'added').length,
        removed: result.changes.filter((c) => c.kind === 'removed').length,
        changed: result.changes.filter((c) => c.kind === 'changed').length,
      }
    : null;

  const status = tooLarge
    ? 'One of the inputs is too large to process here (limit: about 5 MB each).'
    : pa && !pa.ok
      ? `Left JSON is invalid (line ${pa.error.line}, column ${pa.error.column})`
      : pb && !pb.ok
        ? `Right JSON is invalid (line ${pb.error.line}, column ${pb.error.column})`
        : outcome?.error
          ? outcome.error
          : result
            ? result.changes.length
              ? `${pluralize(result.changes.length, 'difference')} found`
              : 'The documents are equivalent'
            : 'Paste two JSON documents to compare them.';

  const swap = () => {
    setLeft(right);
    setRight(left);
  };

  return (
    <div className="space-y-8">
      <Breadcrumb tool={jsonDiff} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="changed">See what </Headline>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setLeft(SAMPLE_A);
              setRight(SAMPLE_B);
            }}
          >
            Try an example
          </Button>
          <Button variant="ghost" disabled={!left && !right} onClick={swap}>
            <Icon name="swap" className="h-4 w-4" /> Swap sides
          </Button>
          <Button
            variant="ghost"
            disabled={!left && !right}
            onClick={() => {
              setLeft('');
              setRight('');
            }}
          >
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={stale ? 'busy' : result ? 'good' : 'neutral'} />

      <section
        aria-label="Diff options"
        className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <Checkbox label="Ignore array order" checked={ignoreArrayOrder} onChange={setIgnoreArrayOrder} />
        <Checkbox label="Compare numbers by value (1 = 1.0)" checked={numericEquality} onChange={setNumericEquality} />
        <label className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          Ignore keys
          <input
            type="text"
            value={ignoreKeysText}
            onChange={(e) => setIgnoreKeysText(e.target.value)}
            placeholder="updatedAt, etag"
            spellCheck={false}
            className="w-48 min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-slate-900 placeholder:text-slate-400 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-3">
          <CodeArea label="Left JSON" hint="original" value={left} onChange={(e) => setLeft(e.target.value)} rows={14} placeholder='{"a": 1}' aria-invalid={pa ? !pa.ok : undefined} />
          {pa && <SideError side="Left" text={a} parsed={pa} />}
        </div>
        <div className="min-w-0 space-y-3">
          <CodeArea label="Right JSON" hint="changed" value={right} onChange={(e) => setRight(e.target.value)} rows={14} placeholder='{"a": 2}' aria-invalid={pb ? !pb.ok : undefined} />
          {pb && <SideError side="Right" text={b} parsed={pb} />}
        </div>
      </div>

      {result && counts && (
        <section aria-label="Differences" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green">{counts.added} added</Badge>
              <Badge tone="red">{counts.removed} removed</Badge>
              <Badge tone="amber">{counts.changed} changed</Badge>
              <Badge>{result.unchanged.toLocaleString('en-US')} unchanged</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented<View>
                label="View"
                options={[
                  { value: 'tree', label: 'Tree' },
                  { value: 'list', label: 'List' },
                ]}
                value={view}
                onChange={setView}
              />
              <CopyButton text={summaryJson} label="Copy as JSON" />
              <CopyButton text={patch} label="Copy JSON Patch" />
            </div>
          </header>
          <div className="p-4 sm:p-6">{view === 'tree' ? <DiffTree result={result} /> : <ChangeList changes={result.changes} />}</div>
        </section>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Both documents are compared in your browser and never uploaded. Key order and whitespace never count as differences; big numbers are compared
        exactly.
      </p>
    </div>
  );
}
