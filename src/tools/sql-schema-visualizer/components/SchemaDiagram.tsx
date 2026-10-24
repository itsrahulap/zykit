// Interactive ER diagram: pan (drag or arrow keys), zoom (buttons, +/−, Ctrl/⌘+wheel), fit, and
// search that highlights matching tables plus the tables they're linked to. The table list beside
// it is the keyboard and screen-reader way to pick a table; the SVG itself is a picture.

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { connectedTables, DIAGRAM_METRICS, type Diagram } from '../features/diagram';
import { tableLabel, type ParsedSchema } from '../features/parser';
import { Icon } from '../../../shared/ui/ui';

const M = DIAGRAM_METRICS;
const MIN_SCALE = 0.1;
const MAX_SCALE = 2.5;
const iconButton =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 ring-1 ring-inset ring-field-edge hover:bg-slate-100 pointer-coarse:min-h-11 pointer-coarse:min-w-11 dark:text-slate-300 dark:hover:bg-slate-800';

export function SchemaDiagram({ schema, diagram }: { schema: ParsedSchema; diagram: Diagram }) {
  const box = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const searchId = useId();
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  const fit = () => {
    const el = box.current;
    if (!el) return;
    const pad = 24;
    const scale = Math.min(1.25, Math.max(MIN_SCALE, Math.min((el.clientWidth - pad * 2) / Math.max(1, diagram.width + 64), (el.clientHeight - pad * 2) / Math.max(1, diagram.height))));
    setView({ scale, x: pad, y: pad });
  };
  // Refit whenever the set of tables changes (new input), not on every keystroke that keeps it.
  const shapeKey = diagram.tables.map((t) => `${t.table.id}:${t.x},${t.y}`).join('|');
  useEffect(() => {
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapeKey]);

  const zoomBy = (factor: number, px?: number, py?: number) => {
    const el = box.current;
    const cx = px ?? (el ? el.clientWidth / 2 : 0);
    const cy = py ?? (el ? el.clientHeight / 2 : 0);
    setView((v) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
      return { scale, x: cx - ((cx - v.x) * scale) / v.scale, y: cy - ((cy - v.y) * scale) / v.scale };
    });
  };

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // Ctrl/⌘ + wheel zooms around the pointer; a plain wheel keeps scrolling the page.
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const centerOn = (id: string) => {
    const el = box.current;
    const t = diagram.tables.find((s) => s.table.id === id);
    if (!el || !t) return;
    setView((v) => ({ ...v, x: el.clientWidth / 2 - (t.x + t.w / 2) * v.scale, y: el.clientHeight / 2 - (t.y + Math.min(t.h, 200) / 2) * v.scale }));
  };

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? new Set(diagram.tables.filter((t) => t.label.toLowerCase().includes(q) || t.table.name.toLowerCase().includes(q)).map((t) => t.table.id)) : null;
  }, [query, diagram]);
  const seeds = matches ?? (selected ? new Set([selected]) : null);
  const lit = seeds ? connectedTables(schema, seeds) : null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = 48;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) setView((v) => ({ ...v, x: v.x + moves[e.key][0], y: v.y + moves[e.key][1] }));
    else if (e.key === '+' || e.key === '=') zoomBy(1.2);
    else if (e.key === '-' || e.key === '_') zoomBy(1 / 1.2);
    else if (e.key === '0') fit();
    else return;
    e.preventDefault();
  };

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, origX: view.x, origY: view.y, moved: false };
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    setView((v) => ({ ...v, x: d.origX + dx, y: d.origY + dy }));
  };
  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved) return;
    // A click without dragging selects the table under the pointer, or clears the selection.
    const id = (e.target as Element).closest('[data-table]')?.getAttribute('data-table') ?? null;
    setSelected((s) => (s === id ? null : id));
  };

  const pick = (id: string) => {
    setQuery('');
    setSelected((s) => (s === id ? null : id));
    centerOn(id);
  };

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1 basis-40">
            <label htmlFor={searchId} className="eyebrow mb-1 block text-slate-600 dark:text-slate-400">
              Find table
            </label>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. orders"
              autoComplete="off"
              className="w-full rounded-xl border border-field-edge bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 pointer-coarse:min-h-11 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex gap-1">
            <button type="button" aria-label="Zoom out" className={iconButton} onClick={() => zoomBy(1 / 1.2)}>
              <Icon name="minus" className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Zoom in" className={iconButton} onClick={() => zoomBy(1.2)}>
              <Icon name="plus" className="h-4 w-4" />
            </button>
            <button type="button" className={`${iconButton} w-auto! px-3 text-sm font-medium`} onClick={fit}>
              Fit
            </button>
          </div>
        </div>
        <p id={hintId} className="text-xs text-slate-500 dark:text-slate-400">
          Drag or use the arrow keys to pan, + and − to zoom, 0 to fit. Ctrl/⌘ + scroll zooms too.
          {matches && ` ${matches.size} matching ${matches.size === 1 ? 'table' : 'tables'}.`}
        </p>
        <div
          ref={box}
          tabIndex={0}
          role="region"
          aria-label="ER diagram"
          aria-describedby={hintId}
          onKeyDown={onKeyDown}
          className="relative h-[26rem] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:h-[34rem] dark:border-slate-800 dark:bg-slate-950"
        >
          <svg
            role="img"
            aria-label={`Diagram of ${diagram.tables.length} tables and ${diagram.edges.length} foreign keys`}
            className="h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            <defs>
              <marker id="sv-fk-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" className="fill-slate-500 dark:fill-slate-400" />
              </marker>
            </defs>
            <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
              {diagram.edges.map((e) => {
                const on = !lit || (lit.has(e.fk.fromTable) && lit.has(e.fk.toTable) && (seeds!.has(e.fk.fromTable) || seeds!.has(e.fk.toTable)));
                return (
                  <path
                    key={e.fk.id}
                    d={e.d}
                    fill="none"
                    strokeWidth={on && lit ? 2.5 : 1.5}
                    markerEnd="url(#sv-fk-arrow)"
                    className={on ? (lit ? 'stroke-emerald-600 dark:stroke-emerald-400' : 'stroke-slate-500 dark:stroke-slate-400') : 'stroke-slate-300 opacity-40 dark:stroke-slate-700'}
                  />
                );
              })}
              {diagram.tables.map((t) => {
                const dim = lit && !lit.has(t.table.id);
                const strong = seeds?.has(t.table.id);
                return (
                  <g key={t.table.id} data-table={t.table.id} className={`cursor-pointer ${dim ? 'opacity-25' : ''}`}>
                    <title>{t.label}</title>
                    <rect
                      x={t.x}
                      y={t.y}
                      width={t.w}
                      height={t.h}
                      rx={10}
                      strokeWidth={strong ? 3 : 1}
                      className={`fill-white dark:fill-slate-900 ${strong ? 'stroke-emerald-500' : 'stroke-slate-300 dark:stroke-slate-700'}`}
                    />
                    <path
                      d={`M ${t.x} ${t.y + M.header} V ${t.y + 10} Q ${t.x} ${t.y} ${t.x + 10} ${t.y} H ${t.x + t.w - 10} Q ${t.x + t.w} ${t.y} ${t.x + t.w} ${t.y + 10} V ${t.y + M.header} Z`}
                      className="fill-emerald-700 dark:fill-emerald-800"
                    />
                    <text x={t.x + 12} y={t.y + M.header / 2 + 5} className="fill-white text-[13px] font-bold">
                      {t.label}
                    </text>
                    {t.rows.map((r, i) => {
                      const y = t.y + M.header + i * M.row + M.row / 2 + 4;
                      return (
                        <g key={r.column.name}>
                          <title>{`${r.column.name} ${r.column.type}${r.column.notNull ? ' NOT NULL' : ''}${r.column.default ? ` DEFAULT ${r.column.default}` : ''}`}</title>
                          {r.markers.length > 0 && (
                            <text x={t.x + 8} y={y} className="fill-amber-700 text-[9px] font-bold dark:fill-amber-400">
                              {r.markers.join(' ')}
                            </text>
                          )}
                          <text x={t.x + 34} y={y} className={`fill-slate-900 text-xs dark:fill-slate-100 ${r.column.primaryKey ? 'font-bold' : ''}`}>
                            {r.name}
                          </text>
                          <text x={t.x + t.w - 10} y={y} textAnchor="end" className="fill-slate-500 font-mono text-[11px] dark:fill-slate-400">
                            {r.type}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
      <nav aria-label="Tables" className="min-w-0">
        <h3 className="eyebrow mb-2 text-slate-600 dark:text-slate-400">Tables</h3>
        <ul className="max-h-[34rem] space-y-1 overflow-y-auto pr-1">
          {diagram.tables.map((t) => (
            <li key={t.table.id}>
              <button
                type="button"
                aria-pressed={selected === t.table.id}
                onClick={() => pick(t.table.id)}
                className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-sm pointer-coarse:min-h-11 ${
                  selected === t.table.id || matches?.has(t.table.id)
                    ? 'bg-emerald-50 font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span className="min-w-0 truncate">{tableLabel(t.table)}</span>
                <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                  {t.table.columns.length}
                  <span className="sr-only"> columns</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
