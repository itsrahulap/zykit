import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import jsonTreeViewer from './index';
import { parseJson, type JsonNode, type ParseResult } from '../json-formatter/features/json';
import {
  ancestors,
  childCount,
  expandToDepth,
  findPath,
  flatten,
  isContainer,
  jsAccess,
  jsonPath,
  jsonPointer,
  nodeType,
  parsePath,
  scalarText,
  searchTree,
  STRING_PREVIEW,
  truncate,
  valueText,
  type Frame,
  type NodeType,
  type SearchIn,
} from './features/json-tree-viewer';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { ErrorPanel, Notices, OpenFileButton, OptionsCard } from '../../shared/ui/convert';
import { useMediaQuery } from '../../shared/hooks/useMediaQuery';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { formatBytes } from '../../shared/utils/format.utils';

const MAX_FILE_BYTES = 100 * 1024 * 1024;
/** Above this many characters the parse runs in a worker. */
const SYNC_LIMIT = 1_000_000;
const INPUT_ID = 'json-tree-input';
const VIEW_PX = 700;
const MAX_SHOWN_STRING = 100_000;

const SAMPLE = `{"name":"toolstack","version":3,"id":12345678901234567890,"tags":["json","tree",null,true],"author":{"name":"Ada","emails":["ada@example.com"]},"notes":"${'Long text. '.repeat(30)}"}`;

const TYPE_STYLE: Record<NodeType, string> = {
  object: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  array: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  string: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  number: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  boolean: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  null: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const fieldClass =
  'rounded-xl border border-field-edge bg-white px-3 py-1.5 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-900 dark:text-slate-100';

export default function JsonTreeViewerPage() {
  const uid = useId();
  const [input, setInput] = useState('');
  const [big, setBig] = useState<{ name: string; text: string } | null>(null);
  const deferred = useDeferredValue(input);
  const text = big ? big.text : deferred;
  const sync = text.length <= SYNC_LIMIT;

  const syncResult = useMemo(() => (sync && text.trim() ? parseJson(text) : null), [text, sync]);
  const [asyncResult, setAsyncResult] = useState<{ for: string; res: ParseResult } | null>(null);
  useEffect(() => {
    if (sync || !text.trim()) return;
    const w = new Worker(new URL('./tree.worker.ts', import.meta.url), { type: 'module' });
    const fail = (message: string) => setAsyncResult({ for: text, res: { ok: false, error: { message, line: 1, column: 1, offset: 0 } } });
    w.onmessage = (e: MessageEvent<ParseResult>) => {
      setAsyncResult({ for: text, res: e.data });
      w.terminate();
    };
    w.onerror = () => fail('The file could not be parsed (it may be too large for this browser).');
    w.postMessage(text);
    return () => w.terminate();
  }, [text, sync]);
  const parsing = !sync && !!text.trim() && asyncResult?.for !== text;
  const result = sync ? syncResult : asyncResult?.for === text ? asyncResult.res : null;
  const root = result?.ok ? result.value : null;

  // Expansion: explicit set (per root) plus, right after a search, every match's ancestors.
  const [ex, setEx] = useState<{ root: JsonNode; set: Set<JsonNode> } | null>(null);
  const [autoExpand, setAutoExpand] = useState(true);
  const [query, setQuery] = useState('');
  const q = useDeferredValue(query);
  const [matchIdx, setMatchIdx] = useState(0);
  const [fullStrings, setFullStrings] = useState<Set<JsonNode>>(() => new Set());
  const [activeNode, setActiveNode] = useState<JsonNode | null>(null);
  const [message, setMessage] = useState('');
  const [depth, setDepth] = useState(2);
  const [searchIn, setSearchIn] = useState<SearchIn>('both');
  const [goTo, setGoTo] = useState('');
  const [goError, setGoError] = useState('');
  useIncomingText(jsonTreeViewer.id, (t) => {
    setBig(null);
    setInput(t);
  });
  const reveal = useRef(false);
  const viewRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const coarse = useMediaQuery('(pointer: coarse)');
  const ROW = coarse ? 44 : 28;

  const search = useMemo(() => (root ? searchTree(root, q, undefined, searchIn) : { matches: [] as Frame[], truncated: false }), [root, q, searchIn]);
  const matches = search.matches;
  const cur = matches.length ? matchIdx % matches.length : -1;
  const matchSet = useMemo(() => new Set(matches.map((m) => m.node)), [matches]);

  const base = useMemo(() => (root ? (ex && ex.root === root ? ex.set : new Set<JsonNode>([root])) : new Set<JsonNode>()), [root, ex]);
  const expanded = useMemo(() => {
    if (!autoExpand || !matches.length) return base;
    const s = new Set(base);
    for (const m of matches) for (const a of ancestors(m)) s.add(a);
    return s;
  }, [base, autoExpand, matches]);
  const commit = (set: Set<JsonNode>) => {
    if (!root) return;
    setEx({ root, set });
    setAutoExpand(false);
  };

  const { rows, truncated } = useMemo(() => (root ? flatten(root, expanded) : { rows: [] as Frame[], truncated: false }), [root, expanded]);

  const rowHeight = (f: Frame) => {
    if (f.node.type === 'string' && fullStrings.has(f.node)) return Math.min(12, Math.ceil(scalarText(f.node).length / 50)) * 20 + ROW;
    return ROW;
  };
  const offsets = useMemo(() => {
    const o = new Float64Array(rows.length + 1);
    for (let i = 0; i < rows.length; i++) {
      const f = rows[i];
      const long = f.node.type === 'string' && fullStrings.has(f.node);
      o[i + 1] = o[i] + (long ? Math.min(12, Math.ceil(scalarText(f.node).length / 50)) * 20 + ROW : ROW);
    }
    return o;
  }, [rows, fullStrings, ROW]);

  // First visible row by binary search.
  let lo = 0;
  let hi = rows.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid + 1] <= scrollTop) lo = mid + 1;
    else hi = mid;
  }
  const first = Math.max(0, lo - 5);
  let last = first;
  while (last < rows.length && offsets[last] < scrollTop + VIEW_PX) last++;
  last = Math.min(rows.length, last + 5);

  const found = activeNode ? rows.findIndex((f) => f.node === activeNode) : -1;
  const activeIdx = found;
  const activeRow = activeIdx >= 0 ? rows[activeIdx] : null;

  // Jump to the first match when the results change (state adjusted during render, scrolling in the effect below).
  const [seenMatches, setSeenMatches] = useState(matches);
  if (seenMatches !== matches) {
    setSeenMatches(matches);
    if (matches.length) {
      setMatchIdx(0);
      setActiveNode(matches[0].node);
    }
  }
  useEffect(() => {
    if (matches.length) reveal.current = true;
  }, [matches]);

  useEffect(() => {
    if (!reveal.current || activeIdx < 0 || !viewRef.current) return;
    reveal.current = false;
    const el = viewRef.current;
    const top = offsets[activeIdx];
    const bottom = offsets[activeIdx + 1];
    if (top < el.scrollTop) el.scrollTop = top;
    else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight;
  });

  const go = (i: number) => {
    reveal.current = true;
    const f = rows[Math.max(0, Math.min(rows.length - 1, i))];
    if (f) setActiveNode(f.node);
  };
  const stepMatch = (dir: 1 | -1) => {
    if (!matches.length) return;
    const i = (cur + dir + matches.length) % matches.length;
    const f = matches[i];
    const set = new Set(expanded);
    for (const a of ancestors(f)) set.add(a);
    commit(set);
    setMatchIdx(i);
    reveal.current = true;
    setActiveNode(f.node);
  };

  const goToPath = () => {
    if (!root) return;
    let found: Frame | string;
    try {
      found = findPath(root, parsePath(goTo));
    } catch (e) {
      found = (e as Error).message;
    }
    if (typeof found === 'string') return setGoError(found);
    setGoError('');
    const set = new Set(expanded);
    for (const a of ancestors(found)) set.add(a);
    commit(set);
    reveal.current = true;
    setActiveNode(found.node);
  };

  const toggle = (n: JsonNode) => {
    const set = new Set(expanded);
    if (!set.delete(n)) set.add(n);
    commit(set);
  };
  const copy = async (what: string, get: () => string) => {
    try {
      await navigator.clipboard.writeText(get());
      setMessage(`Copied ${what}.`);
    } catch {
      setMessage(`Couldn’t copy ${what}.`);
    }
  };
  const select = (f: Frame) => {
    setActiveNode(f.node);
    void copy('path', () => jsonPath(f));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!rows.length || e.ctrlKey || e.metaKey || e.altKey) return;
    const i = activeIdx < 0 ? 0 : activeIdx;
    const f = rows[i];
    const handled = (fn: () => void) => {
      e.preventDefault();
      fn();
    };
    switch (e.key) {
      case 'ArrowDown': return handled(() => go(activeIdx < 0 ? 0 : i + 1));
      case 'ArrowUp': return handled(() => go(i - 1));
      case 'PageDown': return handled(() => go(i + 10));
      case 'PageUp': return handled(() => go(i - 10));
      case 'Home': return handled(() => go(0));
      case 'End': return handled(() => go(rows.length - 1));
      case 'ArrowRight':
        return handled(() => {
          if (!isContainer(f.node) || childCount(f.node) === 0) return;
          if (!expanded.has(f.node)) toggle(f.node);
          else go(i + 1);
        });
      case 'ArrowLeft':
        return handled(() => {
          if (isContainer(f.node) && expanded.has(f.node)) toggle(f.node);
          else if (f.parent) {
            reveal.current = true;
            setActiveNode(f.parent.node);
          }
        });
      case 'Enter':
      case ' ':
        return handled(() => select(f));
    }
  };

  const openText = (t: string, file: File) => {
    setMessage('');
    setActiveNode(null);
    if (t.length > SYNC_LIMIT) {
      setInput('');
      setBig({ name: file.name, text: t });
    } else {
      setBig(null);
      setInput(t);
    }
  };
  const clear = () => {
    setInput('');
    setBig(null);
    setQuery('');
    setMessage('');
    setActiveNode(null);
  };

  const stats = result?.ok ? result.stats : null;
  const status = parsing
    ? 'Parsing…'
    : !text.trim()
      ? 'Paste JSON or open a file to explore it as a tree.'
      : result?.ok
        ? `Parsed: ${stats!.keys.toLocaleString()} keys, ${stats!.maxDepth.toLocaleString()} levels deep.`
        : result
          ? `Invalid JSON: ${result.error.message}${big ? '' : ` (line ${result.error.line}, column ${result.error.column})`}`
          : 'Paste JSON or open a file to explore it as a tree.';
  const notices: string[] = [];
  if (stats?.bigNumbers) notices.push(`${stats.bigNumbers} number${stats.bigNumbers === 1 ? ' has' : 's have'} more than 15 digits. They are shown exactly as written; other tools may round them.`);
  if (truncated) notices.push('Only the first 1,000,000 rows are shown. Collapse some nodes to see the rest.');
  if (search.truncated) notices.push('Showing the first 10,000 matches. Narrow the search to see others.');

  return (
    <div className="space-y-8">
      <Breadcrumb tool={jsonTreeViewer} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="at a glance">Big JSON, </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => { setBig(null); setInput(SAMPLE); }}>
            Try an example
          </Button>
          <OpenFileButton accept=".json,application/json,text/plain" maxBytes={MAX_FILE_BYTES} onText={openText} />
          <Button variant="ghost" disabled={!input && !big} onClick={clear}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={parsing ? 'busy' : result?.ok ? 'good' : 'neutral'} />

      {big ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Loaded <strong className="break-all">{big.name}</strong> ({formatBytes(big.text.length)}). Large files aren’t shown in a text box. Use Clear to start over.
        </p>
      ) : (
        <CodeArea
          id={INPUT_ID}
          label="Input JSON"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setActiveNode(null);
          }}
          rows={8}
          placeholder='{"hello": ["world", 1, true, null]}'
          aria-invalid={result ? !result.ok : undefined}
          onFileText={openText}
          maxFileBytes={MAX_FILE_BYTES}
        />
      )}

      {result && !result.ok && <ErrorPanel error={result.error} text={text} inputId={big ? undefined : INPUT_ID} fieldId={big ? undefined : INPUT_ID} title="JSON error" />}
      <Notices items={notices} />

      {root && (
        <section aria-label="Tree" className="min-w-0 space-y-4">
          <OptionsCard label="Tree controls">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor={`${uid}-depth`} className="text-sm text-slate-700 dark:text-slate-300">
                Depth
              </label>
              <input
                id={`${uid}-depth`}
                type="number"
                min={1}
                max={100}
                value={depth}
                onChange={(e) => setDepth(Math.max(1, Math.min(100, Math.floor(Number(e.target.value)) || 1)))}
                className={`${fieldClass} w-20`}
              />
              <Button variant="secondary" onClick={() => commit(expandToDepth(root, depth))}>
                Expand to depth
              </Button>
              <Button variant="secondary" onClick={() => commit(new Set())}>
                Collapse all
              </Button>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <label htmlFor={`${uid}-search`} className="text-sm text-slate-700 dark:text-slate-300">
                Search
              </label>
              <input
                id={`${uid}-search`}
                type="search"
                value={query}
                placeholder="keys or values"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setAutoExpand(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    stepMatch(e.shiftKey ? -1 : 1);
                  }
                }}
                className={`${fieldClass} w-44 max-w-full`}
              />
              <Button variant="secondary" disabled={!matches.length} onClick={() => stepMatch(-1)} aria-label="Previous match">
                Prev
              </Button>
              <Button variant="secondary" disabled={!matches.length} onClick={() => stepMatch(1)} aria-label="Next match">
                Next
              </Button>
              <Segmented<SearchIn>
                label="Match in"
                options={[
                  { value: 'both', label: 'Both' },
                  { value: 'keys', label: 'Keys' },
                  { value: 'values', label: 'Values' },
                ]}
                value={searchIn}
                onChange={(v) => {
                  setSearchIn(v);
                  setAutoExpand(true);
                }}
              />
              <span role="status" className="text-sm text-slate-600 dark:text-slate-400">
                {!q ? '' : matches.length ? `${cur + 1} of ${matches.length.toLocaleString()}${search.truncated ? '+' : ''}` : 'No matches'}
              </span>
            </div>
            <form
              className="flex min-w-0 flex-wrap items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                goToPath();
              }}
            >
              <label htmlFor={`${uid}-goto`} className="text-sm text-slate-700 dark:text-slate-300">
                Go to path
              </label>
              <input
                id={`${uid}-goto`}
                value={goTo}
                placeholder="$.a[0], /a/0 or data?.a?.[0]"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={goError ? true : undefined}
                aria-describedby={goError ? `${uid}-goto-error` : undefined}
                onChange={(e) => setGoTo(e.target.value)}
                className={`${fieldClass} w-64 max-w-full font-mono`}
              />
              <Button type="submit" variant="secondary" disabled={!goTo.trim()}>
                Go
              </Button>
              {goError && (
                <span id={`${uid}-goto-error`} role="alert" className="text-sm text-red-700 dark:text-red-400">
                  {goError}
                </span>
              )}
            </form>
          </OptionsCard>

          <div
            ref={viewRef}
            role="tree"
            aria-label="JSON tree"
            tabIndex={0}
            aria-activedescendant={activeIdx >= 0 ? `${uid}-r${activeIdx}` : undefined}
            onKeyDown={onKeyDown}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            className="h-[28rem] overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="relative" style={{ height: offsets[rows.length] }}>
              {rows.slice(first, last).map((f, k) => {
                const i = first + k;
                const n = f.node;
                const type = nodeType(n);
                const container = isContainer(n);
                const isOpen = container && expanded.has(n);
                const long = n.type === 'string' && fullStrings.has(n);
                const isActive = i === activeIdx;
                const isMatch = matchSet.has(n);
                const isCur = cur >= 0 && matches[cur].node === n;
                return (
                  <div
                    key={i}
                    id={`${uid}-r${i}`}
                    role="treeitem"
                    aria-level={f.depth + 1}
                    aria-expanded={container ? isOpen : undefined}
                    aria-selected={isActive}
                    onClick={() => select(f)}
                    style={{ position: 'absolute', top: offsets[i], height: rowHeight(f), left: 0, right: 0, paddingLeft: 8 + Math.min(f.depth, 14) * 12 }}
                    className={`flex cursor-pointer items-start gap-1.5 overflow-hidden pr-2 pt-1 font-mono text-[13px] ${
                      isCur ? 'bg-amber-200 dark:bg-amber-900/60' : isMatch ? 'bg-amber-100 dark:bg-amber-950/60' : isActive ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    } ${isActive ? 'outline outline-2 -outline-offset-2 outline-emerald-500' : ''}`}
                  >
                    <span
                      aria-hidden="true"
                      className="w-4 shrink-0 select-none text-center text-slate-500"
                      onClick={(e) => {
                        if (!container) return;
                        e.stopPropagation();
                        setActiveNode(n);
                        toggle(n);
                      }}
                    >
                      {container && childCount(n) > 0 ? (isOpen ? '▾' : '▸') : ''}
                    </span>
                    <span className="min-w-0 flex-1 break-all">
                      {f.key !== null && (
                        <>
                          <span className={typeof f.key === 'number' ? 'text-slate-500 dark:text-slate-400' : 'text-sky-700 dark:text-sky-300'}>{f.key}</span>
                          <span className="text-slate-500">: </span>
                        </>
                      )}
                      {container ? (
                        <span className="text-slate-500 dark:text-slate-400">
                          {n.type === 'object' ? `{${childCount(n)}}` : `[${childCount(n)}]`} {childCount(n) === 1 ? (n.type === 'object' ? 'key' : 'item') : n.type === 'object' ? 'keys' : 'items'}
                        </span>
                      ) : n.type === 'string' ? (
                        <StringValue node={n} full={long} onToggle={() => setFullStrings((s) => { const c = new Set(s); if (!c.delete(n)) c.add(n); return c; })} />
                      ) : (
                        <span className={type === 'number' ? 'text-amber-700 dark:text-amber-300' : 'text-rose-700 dark:text-rose-300'}>{scalarText(n)}</span>
                      )}
                    </span>
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 text-[11px] font-sans font-semibold ${TYPE_STYLE[type]}`}>{type}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
            {activeRow ? (
              <dl className="space-y-2">
                {(
                  [
                    ['JSONPath', jsonPath(activeRow)],
                    ['JSON Pointer', jsonPointer(activeRow)],
                    ['JavaScript', jsAccess(activeRow)],
                  ] as const
                ).map(([name, value]) => (
                  <div key={name} className="flex min-w-0 flex-wrap items-center gap-2">
                    <dt className="eyebrow w-28 shrink-0 text-slate-600 dark:text-slate-400">{name}</dt>
                    <dd className="min-w-0 flex-1 break-all font-mono text-slate-800 dark:text-slate-200" data-testid={name === 'JSONPath' ? 'path' : undefined}>
                      {value || '(root: empty pointer)'}
                    </dd>
                    <Button variant="secondary" onClick={() => copy(name, () => value)} aria-label={`Copy ${name}`}>
                      Copy
                    </Button>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-slate-600 dark:text-slate-400">Select a node (click it, or use the arrow keys) to see its path.</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" disabled={!activeRow} onClick={() => activeRow && copy('value', () => valueText(activeRow.node))}>
                Copy value
              </Button>
              <span role="status" className="text-slate-600 dark:text-slate-400">
                {message}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function StringValue({ node, full, onToggle }: { node: Extract<JsonNode, { type: 'string' }>; full: boolean; onToggle: () => void }) {
  const s = scalarText(node);
  const shown = truncate(s, full ? MAX_SHOWN_STRING : STRING_PREVIEW);
  return (
    <span className={`text-emerald-700 dark:text-emerald-300 ${full ? 'block max-h-full overflow-y-auto whitespace-pre-wrap' : ''}`}>
      &quot;{shown.text}
      {shown.cut && !full ? '…' : ''}&quot;
      {s.length > STRING_PREVIEW && (
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="ml-2 font-sans text-xs font-semibold text-emerald-700 underline pointer-coarse:min-h-11 dark:text-emerald-400"
        >
          {full ? 'Show less' : `Show all (${s.length.toLocaleString()} chars)`}
        </button>
      )}
    </span>
  );
}
