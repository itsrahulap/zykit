import { useMemo, useState, type ReactNode } from 'react';
import { collapse, toSideBySide, type Block, type DiffLine } from '../features/diff';
import { ROW_PAGE } from '../config/limits';

export type ViewMode = 'split' | 'unified';

const ROW_TONE = {
  equal: '',
  del: 'bg-red-50 dark:bg-red-950/40',
  add: 'bg-emerald-50 dark:bg-emerald-950/60',
};
const NUM = 'select-none px-2 text-right align-top text-xs leading-6 text-slate-400 tabular-nums dark:text-slate-500';
const MARK = 'select-none text-center align-top font-semibold leading-6';
const TEXT = 'whitespace-pre-wrap break-all px-2 align-top leading-6 text-slate-800 dark:text-slate-200';

function Marker({ kind }: { kind?: DiffLine['kind'] }) {
  if (kind === 'del')
    return (
      <td className={`${MARK} text-red-700 dark:text-red-300`}>
        <span aria-hidden="true">−</span>
        <span className="sr-only">Removed:</span>
      </td>
    );
  if (kind === 'add')
    return (
      <td className={`${MARK} text-emerald-700 dark:text-emerald-300`}>
        <span aria-hidden="true">+</span>
        <span className="sr-only">Added:</span>
      </td>
    );
  return <td className={MARK} />;
}

/** Line text with word-level changes wrapped in <del>/<ins>. Always rendered as text. */
function LineText({ line, side }: { line?: DiffLine; side: 'a' | 'b' }) {
  if (!line) return null;
  const text = side === 'b' && line.kind === 'equal' ? (line.textB ?? line.text) : line.text;
  if (!line.parts || line.kind === 'equal') return <>{text}</>;
  return (
    <>
      {line.parts.map((p, i) =>
        !p.changed ? (
          <span key={i}>{p.text}</span>
        ) : line.kind === 'del' ? (
          <del key={i} className="rounded-sm bg-red-200 no-underline dark:bg-red-800/70">
            {p.text}
          </del>
        ) : (
          <ins key={i} className="rounded-sm bg-emerald-200 no-underline dark:bg-emerald-700/70">
            {p.text}
          </ins>
        ),
      )}
    </>
  );
}

function GapRow({ count, colSpan, onExpand }: { count: number; colSpan: number; onExpand: () => void }) {
  return (
    <tr className="bg-slate-50 dark:bg-slate-800/50">
      <td colSpan={colSpan} className="px-2 py-1">
        <button
          type="button"
          onClick={onExpand}
          className="w-full rounded-lg px-2 py-1 text-left text-xs font-semibold text-emerald-700 hover:bg-slate-100 dark:text-emerald-400 dark:hover:bg-slate-800"
        >
          <span aria-hidden="true">⋯ </span>Show {count.toLocaleString('en-US')} hidden unchanged {count === 1 ? 'line' : 'lines'}
        </button>
      </td>
    </tr>
  );
}

function DiffTable<R>({
  rows,
  changed,
  context,
  collapsed,
  cols,
  minWidth,
  head,
  renderRow,
}: {
  rows: R[];
  changed: boolean[];
  context: number;
  collapsed: boolean;
  /** Width class per column; empty string lets the column share the remaining space. */
  cols: string[];
  minWidth: string;
  head: ReactNode;
  renderRow: (row: R, index: number) => ReactNode;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [limit, setLimit] = useState(ROW_PAGE);
  const blocks = useMemo<Block[]>(
    () => (collapsed ? collapse(changed, context) : [{ type: 'rows', start: 0, end: rows.length }]),
    [collapsed, changed, context, rows.length],
  );

  const colSpan = cols.length;
  const body: ReactNode[] = [];
  let shown = 0;
  let truncated = false;
  for (const b of blocks) {
    if (shown >= limit) {
      truncated = true;
      break;
    }
    if (b.type === 'gap' && !expanded.has(b.start)) {
      body.push(
        <GapRow key={`gap-${b.start}`} count={b.end - b.start} colSpan={colSpan} onExpand={() => setExpanded((s) => new Set(s).add(b.start))} />,
      );
      continue;
    }
    const end = Math.min(b.end, b.start + (limit - shown));
    for (let i = b.start; i < end; i++) body.push(renderRow(rows[i], i));
    shown += end - b.start;
    if (end < b.end) truncated = true;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className={`w-full table-fixed border-collapse font-mono text-sm ${minWidth}`}>
          <caption className="sr-only">Differences between the original and changed text</caption>
          <colgroup>
            {cols.map((c, i) => (
              <col key={i} className={c} />
            ))}
          </colgroup>
          <thead className="sr-only">{head}</thead>
          <tbody>{body}</tbody>
        </table>
      </div>
      {truncated && (
        <div className="border-t border-slate-100 p-3 text-center dark:border-slate-800">
          <button
            type="button"
            onClick={() => setLimit((l) => l + ROW_PAGE)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-slate-100 dark:text-emerald-400 dark:hover:bg-slate-800"
          >
            Show more lines
          </button>
        </div>
      )}
    </>
  );
}

export function DiffView({ lines, mode, collapsed, context }: { lines: DiffLine[]; mode: ViewMode; collapsed: boolean; context: number }) {
  const sbs = useMemo(() => (mode === 'split' ? toSideBySide(lines) : []), [lines, mode]);
  const sbsChanged = useMemo(() => sbs.map((r) => r.left?.kind !== 'equal' || r.right?.kind !== 'equal'), [sbs]);
  const changed = useMemo(() => lines.map((l) => l.kind !== 'equal'), [lines]);

  if (mode === 'split') {
    return (
      <DiffTable
        key="split"
        rows={sbs}
        changed={sbsChanged}
        context={context}
        collapsed={collapsed}
        cols={['w-12', 'w-6', '', 'w-12', 'w-6', '']}
        minWidth="min-w-[36rem]"
        head={
          <tr>
            <th scope="col">Original line number</th>
            <th scope="col">Change</th>
            <th scope="col">Original</th>
            <th scope="col">Changed line number</th>
            <th scope="col">Change</th>
            <th scope="col">Changed</th>
          </tr>
        }
        renderRow={(r, i) => {
          const lk = r.left?.kind === 'equal' ? undefined : r.left?.kind;
          const rk = r.right?.kind === 'equal' ? undefined : r.right?.kind;
          return (
            <tr key={i}>
              <td className={`${NUM} ${lk ? ROW_TONE[lk] : ''}`}>{r.left?.aNo}</td>
              {r.left ? <Marker kind={lk} /> : <td className={`${MARK} bg-slate-50 dark:bg-slate-800/40`} />}
              <td className={`${TEXT} border-r border-slate-200 dark:border-slate-800 ${lk ? ROW_TONE[lk] : r.left ? '' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                <LineText line={r.left} side="a" />
              </td>
              <td className={`${NUM} ${rk ? ROW_TONE[rk] : ''}`}>{r.right?.bNo}</td>
              {r.right ? <Marker kind={rk} /> : <td className={`${MARK} bg-slate-50 dark:bg-slate-800/40`} />}
              <td className={`${TEXT} ${rk ? ROW_TONE[rk] : r.right ? '' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                <LineText line={r.right} side="b" />
              </td>
            </tr>
          );
        }}
      />
    );
  }

  return (
    <DiffTable
      key="unified"
      rows={lines}
      changed={changed}
      context={context}
      collapsed={collapsed}
      cols={['w-12', 'w-12', 'w-6', '']}
      minWidth="min-w-[20rem]"
      head={
        <tr>
          <th scope="col">Original line number</th>
          <th scope="col">Changed line number</th>
          <th scope="col">Change</th>
          <th scope="col">Text</th>
        </tr>
      }
      renderRow={(l, i) => (
        <tr key={i} className={ROW_TONE[l.kind]}>
          <td className={NUM}>{l.aNo}</td>
          <td className={NUM}>{l.bNo}</td>
          <Marker kind={l.kind} />
          <td className={TEXT}>
            <LineText line={l} side={l.kind === 'add' ? 'b' : 'a'} />
          </td>
        </tr>
      )}
    />
  );
}
