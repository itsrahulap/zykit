// The schema canvas: table cards you can drag, relationship lines between columns, pan/zoom/fit,
// and "connect" buttons on columns to propose a relationship. Every action here also has a form
// equivalent (table editor, relationship panel), so the canvas is never the only way in.

import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { isForeignKey, type Schema, type Table } from '../features/model';
import { Button, Icon } from '../../../shared/ui/ui';

export const CARD_W = 240;
const HEADER_H = 40;
const ROW_H = 28;
const cardHeight = (t: Table) => HEADER_H + Math.max(1, t.columns.length) * ROW_H + 8;

interface Props {
  schema: Schema;
  selectedTableId: string | null;
  selectedRelationshipId: string | null;
  onSelectTable: (id: string | null) => void;
  onSelectRelationship: (id: string) => void;
  /** Live move during a drag; `done` once the drag ends. */
  onMove: (tableId: string, x: number, y: number, done: boolean) => void;
  onConnect: (a: { tableId: string; columnId: string }, b: { tableId: string; columnId: string }) => void;
}

export function SchemaCanvas({ schema, selectedTableId, selectedRelationshipId, onSelectTable, onSelectRelationship, onMove, onConnect }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [pending, setPending] = useState<{ tableId: string; columnId: string } | null>(null);
  const drag = useRef<{ kind: 'pan' | 'card'; id?: string; startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  const fit = () => {
    const el = box.current;
    if (!el || !schema.tables.length) return setView({ x: 0, y: 0, scale: 1 });
    const minX = Math.min(...schema.tables.map((t) => t.x));
    const minY = Math.min(...schema.tables.map((t) => t.y));
    const maxX = Math.max(...schema.tables.map((t) => t.x + CARD_W));
    const maxY = Math.max(...schema.tables.map((t) => t.y + cardHeight(t)));
    const pad = 24;
    const scale = Math.min(1.25, Math.max(0.3, Math.min((el.clientWidth - pad * 2) / (maxX - minX), (el.clientHeight - pad * 2) / (maxY - minY))));
    setView({ scale, x: pad - minX * scale, y: pad - minY * scale });
  };

  // Fit once when a schema first appears (e.g. after loading a sample).
  const tableCount = schema.tables.length;
  const fitted = useRef(false);
  useEffect(() => {
    if (tableCount && !fitted.current) {
      fitted.current = true;
      fit();
    }
    if (!tableCount) fitted.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableCount]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // Ctrl/⌘ + wheel zooms around the pointer; plain wheel scrolls the page as usual.
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setView((v) => {
        const scale = Math.min(2, Math.max(0.3, v.scale * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
        return { scale, x: px - ((px - v.x) * scale) / v.scale, y: py - ((py - v.y) * scale) / v.scale };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPending(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending]);

  const zoom = (f: number) => setView((v) => ({ ...v, scale: Math.min(2, Math.max(0.3, v.scale * f)) }));

  const down = (e: RPointerEvent, kind: 'pan' | 'card', table?: Table) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { kind, id: table?.id, startX: e.clientX, startY: e.clientY, origX: kind === 'pan' ? view.x : table!.x, origY: kind === 'pan' ? view.y : table!.y, moved: false };
  };
  const move = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    if (!d.moved) return;
    if (d.kind === 'pan') setView((v) => ({ ...v, x: d.origX + dx, y: d.origY + dy }));
    else onMove(d.id!, Math.round(d.origX + dx / view.scale), Math.round(d.origY + dy / view.scale), false);
  };
  const up = (e: RPointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.kind === 'card' && d.moved) onMove(d.id!, Math.round(d.origX + (e.clientX - d.startX) / view.scale), Math.round(d.origY + (e.clientY - d.startY) / view.scale), true);
    if (!d.moved) onSelectTable(d.kind === 'card' ? d.id! : null);
  };

  const connect = (tableId: string, columnId: string) => {
    if (!pending) return setPending({ tableId, columnId });
    if (pending.tableId === tableId && pending.columnId === columnId) return setPending(null);
    onConnect(pending, { tableId, columnId });
    setPending(null);
  };

  const anchor = (t: Table, columnId: string, side: 'left' | 'right') => {
    const idx = Math.max(0, t.columns.findIndex((c) => c.id === columnId));
    return { x: side === 'left' ? t.x : t.x + CARD_W, y: t.y + HEADER_H + idx * ROW_H + ROW_H / 2 };
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
          {pending
            ? 'Now click the connect button on the column it should reference (Esc to cancel).'
            : 'Drag tables by their header. Drag the background to pan; Ctrl/⌘ + scroll to zoom.'}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={() => zoom(1 / 1.2)} aria-label="Zoom out">
            <Icon name="minus" className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-mono text-xs text-slate-500">{Math.round(view.scale * 100)}%</span>
          <Button variant="ghost" onClick={() => zoom(1.2)} aria-label="Zoom in">
            +
          </Button>
          <Button variant="secondary" onClick={fit}>
            Fit
          </Button>
        </div>
      </div>
      <div
        ref={box}
        role="region"
        aria-label="Schema canvas"
        className="relative h-[28rem] touch-none overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle,_rgb(148_163_184/0.35)_1px,_transparent_1px)] [background-size:20px_20px] select-none lg:h-[36rem] dark:border-slate-800"
        onPointerDown={(e) => e.target === e.currentTarget && down(e, 'pan')}
        onPointerMove={move}
        onPointerUp={up}
      >
        {!schema.tables.length && (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-slate-500">No tables yet. Add a table or load a sample schema to get started.</p>
        )}
        <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width="1" height="1" aria-hidden="true">
            {schema.relationships.map((r) => {
              const child = schema.tables.find((t) => t.id === r.fromTableId);
              const parent = schema.tables.find((t) => t.id === r.toTableId);
              if (!child || !parent) return null;
              const rightward = parent.x >= child.x + CARD_W / 2;
              const a = anchor(child, r.fromColumnId, rightward ? 'right' : 'left');
              const b = anchor(parent, r.toColumnId, child.id === parent.id ? 'right' : rightward ? 'left' : 'right');
              const bend = child.id === parent.id ? 60 : Math.max(40, Math.abs(b.x - a.x) / 2);
              const ax = a.x + (rightward || child.id === parent.id ? bend : -bend);
              const bx = b.x + (child.id === parent.id ? bend : rightward ? -bend : bend);
              const active = r.id === selectedRelationshipId;
              return (
                <g key={r.id} className={active ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500'}>
                  <path d={`M ${a.x} ${a.y} C ${ax} ${a.y}, ${bx} ${b.y}, ${b.x} ${b.y}`} fill="none" stroke="currentColor" strokeWidth={active ? 3 : 2} />
                  <path
                    d={`M ${a.x} ${a.y} C ${ax} ${a.y}, ${bx} ${b.y}, ${b.x} ${b.y}`}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                    className="pointer-events-auto cursor-pointer"
                    onClick={() => onSelectRelationship(r.id)}
                  >
                    <title>Select this relationship</title>
                  </path>
                  <text x={a.x + (rightward ? 6 : -14)} y={a.y - 6} fontSize="12" fill="currentColor">
                    {r.kind === 'one-to-one' ? '1' : 'N'}
                  </text>
                  <text x={b.x + (rightward && child.id !== parent.id ? -14 : 6)} y={b.y - 6} fontSize="12" fill="currentColor">
                    1
                  </text>
                </g>
              );
            })}
          </svg>
          {schema.tables.map((t) => (
            <div
              key={t.id}
              className={`absolute rounded-xl border bg-white shadow-sm dark:bg-slate-900 ${t.id === selectedTableId ? 'border-emerald-600 ring-2 ring-emerald-600/30' : 'border-slate-300 dark:border-slate-700'}`}
              style={{ left: t.x, top: t.y, width: CARD_W, minHeight: cardHeight(t) }}
            >
              <button
                type="button"
                className="flex h-10 w-full cursor-grab items-center gap-2 rounded-t-xl bg-primary-soft px-3 text-left font-mono text-sm font-semibold text-slate-900 active:cursor-grabbing dark:bg-slate-800 dark:text-white"
                aria-label={`Table ${t.name || '(unnamed)'}. Click to edit; arrow keys move it.`}
                onPointerDown={(e) => down(e, 'card', t)}
                onPointerMove={move}
                onPointerUp={up}
                onKeyDown={(e) => {
                  const step = e.shiftKey ? 80 : 20;
                  const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
                  if (d) {
                    e.preventDefault();
                    onMove(t.id, t.x + d[0], t.y + d[1], true);
                  } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTable(t.id);
                  }
                }}
              >
                <Icon name="database" className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                <span className="truncate">{t.name || '(unnamed)'}</span>
              </button>
              <ul className="py-1">
                {!t.columns.length && <li className="px-3 text-xs leading-7 text-slate-500">No columns</li>}
                {t.columns.map((c) => {
                  const fk = isForeignKey(schema, t.id, c.id);
                  const isPending = pending?.tableId === t.id && pending.columnId === c.id;
                  return (
                    <li key={c.id} className="flex items-center gap-1.5 px-3 font-mono text-xs" style={{ height: ROW_H }}>
                      <span className="flex w-12 shrink-0 gap-0.5">
                        {c.primaryKey && <Badge title="Primary key">PK</Badge>}
                        {fk && <Badge title="Foreign key">FK</Badge>}
                        {c.unique && !c.primaryKey && <Badge title="Unique">UQ</Badge>}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-slate-900 dark:text-slate-100">{c.name || '(unnamed)'}</span>
                      <span className="shrink-0 text-slate-500" title={c.notNull || c.primaryKey ? 'NOT NULL' : 'Nullable'}>
                        {c.type.toLowerCase()}
                        {c.notNull || c.primaryKey ? '' : '?'}
                      </span>
                      <button
                        type="button"
                        aria-label={`${isPending ? 'Cancel connecting' : 'Connect'} ${t.name}.${c.name}`}
                        aria-pressed={isPending}
                        className={`ml-1 h-5 w-5 shrink-0 rounded-full border ${isPending ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400 hover:border-emerald-600 dark:border-slate-500'}`}
                        onClick={() => connect(t.id, c.id)}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Badge({ children, title }: { children: string; title: string }) {
  return (
    <abbr title={title} className="rounded bg-slate-100 px-1 text-[10px] font-bold text-slate-700 no-underline dark:bg-slate-800 dark:text-slate-300">
      {children}
    </abbr>
  );
}
