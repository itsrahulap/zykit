// The interactive SVG canvas. Labels are rendered as React text children of <text>, so imported
// content is never parsed as markup. Pointer events cover mouse, pen and touch alike.

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { moveItem, type Selection } from '../features/diagram';
import {
  KIND_LABELS,
  KIND_STYLE,
  LIMITS,
  NODE_HEIGHT,
  NODE_WIDTH,
  edgeLine,
  nodeShape,
  nodeTextLayout,
  wrapLabel,
  zoomAt,
  type Diagram,
  type View,
} from '../features/model';
import { estimateTextWidth } from '../features/svgExport';

type Item = NonNullable<Selection>;

interface Drag {
  pointerId: number;
  mode: 'move' | 'pan' | 'resize';
  item: Item | null;
  startX: number;
  startY: number;
  base: Diagram;
  startView: View;
  moved: boolean;
}

const KEY_STEP = 10;
const KEY_STEP_LARGE = 50;
const DRAG_THRESHOLD = 4;

export function DiagramCanvas({
  diagram,
  view,
  selection,
  connectFrom,
  onViewChange,
  onSizeChange,
  onSelect,
  onPick,
  onMove,
  onResize,
  onDelete,
}: {
  diagram: Diagram;
  view: View;
  selection: Selection;
  connectFrom: string | null;
  onViewChange: (v: View) => void;
  onSizeChange: (width: number, height: number) => void;
  onSelect: (s: Selection) => void;
  /** A tap or Enter on an item (or null for the background) without dragging. */
  onPick: (s: Selection) => void;
  /** `done` is false while dragging (preview) and true on release (one undo step from `base`). */
  onMove: (base: Diagram, next: Diagram, done: boolean) => void;
  onResize: (base: Diagram, groupId: string, width: number, height: number, done: boolean) => void;
  onDelete: (s: Item) => void;
}) {
  const regionRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const el = regionRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => onSizeChange(entry.contentRect.width, entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, [onSizeChange]);

  // Ctrl/⌘ + wheel (and trackpad pinch) zooms at the pointer; a plain wheel keeps scrolling the page.
  // React's onWheel is passive, so preventDefault needs a native listener.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      onViewChange(zoomAt(viewRef.current, Math.exp(-e.deltaY * 0.002), e.clientX - rect.left, e.clientY - rect.top));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onViewChange]);

  const start = (e: PointerEvent, mode: Drag['mode'], item: Item | null) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    svgRef.current?.setPointerCapture(e.pointerId);
    drag.current = { pointerId: e.pointerId, mode, item, startX: e.clientX, startY: e.clientY, base: diagram, startView: view, moved: false };
  };

  const deltas = (e: PointerEvent, d: Drag) => {
    const sx = e.clientX - d.startX;
    const sy = e.clientY - d.startY;
    if (Math.hypot(sx, sy) > DRAG_THRESHOLD) d.moved = true;
    return { sx, sy, dx: Math.round(sx / d.startView.zoom), dy: Math.round(sy / d.startView.zoom) };
  };

  const update = (e: PointerEvent, done: boolean) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const { sx, sy, dx, dy } = deltas(e, d);
    if (done) drag.current = null;
    if (!d.moved) {
      if (done) onPick(d.item);
      return;
    }
    if (d.mode === 'pan') onViewChange({ ...d.startView, x: d.startView.x + sx, y: d.startView.y + sy });
    else if (d.mode === 'move' && d.item) onMove(d.base, moveItem(d.base, d.item, dx, dy), done);
    else if (d.mode === 'resize' && d.item) {
      const g = d.base.groups.find((x) => x.id === d.item!.id);
      if (g) onResize(d.base, g.id, g.width + dx, g.height + dy, done);
    }
  };

  const itemKeys = (e: KeyboardEvent, item: Item) => {
    const step = e.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const arrows: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (arrows[e.key]) {
      e.preventDefault();
      e.stopPropagation();
      onMove(diagram, moveItem(diagram, item, ...arrows[e.key]), true);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      e.stopPropagation();
      onDelete(item);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onPick(item);
    }
  };

  // Arrow keys on the canvas itself pan it, so keyboard users can reach every part of a large diagram.
  const regionKeys = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    const pans: Record<string, [number, number]> = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] };
    if (pans[e.key]) {
      e.preventDefault();
      onViewChange({ ...view, x: view.x + pans[e.key][0], y: view.y + pans[e.key][1] });
    } else if (e.key === 'Escape') onSelect(null);
  };

  const isSelected = (type: Item['type'], id: string) => selection?.type === type && selection.id === id;
  const nodesById = new Map(diagram.nodes.map((n) => [n.id, n]));

  return (
    <div
      ref={regionRef}
      tabIndex={0}
      role="region"
      aria-label="Diagram canvas. Tab to a node or group; arrow keys move it, Delete removes it. Arrow keys on the empty canvas pan."
      onKeyDown={regionKeys}
      className="relative h-[28rem] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:border-slate-800 dark:bg-slate-950"
    >
      <svg
        ref={svgRef}
        className="block h-full w-full touch-none select-none text-slate-500 dark:text-slate-400"
        onPointerDown={(e) => start(e, 'pan', null)}
        onPointerMove={(e) => update(e, false)}
        onPointerUp={(e) => update(e, true)}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <defs>
          <marker id="adb-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10Z" fill="currentColor" />
          </marker>
        </defs>
        <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
          {diagram.groups.map((g) => {
            const selected = isSelected('group', g.id);
            return (
              <g
                key={g.id}
                tabIndex={0}
                role="button"
                aria-label={`Group: ${g.label || 'untitled'}`}
                aria-pressed={selected}
                data-group-id={g.id}
                className="cursor-move focus:outline-none"
                onPointerDown={(e) => start(e, 'move', { type: 'group', id: g.id })}
                onFocus={() => onSelect({ type: 'group', id: g.id })}
                onKeyDown={(e) => itemKeys(e, { type: 'group', id: g.id })}
              >
                <rect
                  x={g.x}
                  y={g.y}
                  width={g.width}
                  height={g.height}
                  rx={16}
                  strokeDasharray="6 4"
                  strokeWidth={selected ? 3 : 1.5}
                  className={`fill-white/60 dark:fill-slate-900/60 ${selected ? 'stroke-emerald-600 dark:stroke-emerald-400' : 'stroke-slate-400 dark:stroke-slate-600'}`}
                />
                <text x={g.x + 12} y={g.y + 20} fontSize={13} fontWeight={600} className="fill-slate-700 dark:fill-slate-300">
                  {g.label}
                </text>
                {selected && (
                  <rect
                    aria-hidden="true"
                    x={g.x + g.width - 14}
                    y={g.y + g.height - 14}
                    width={18}
                    height={18}
                    rx={4}
                    className="cursor-nwse-resize fill-emerald-600 dark:fill-emerald-400"
                    onPointerDown={(e) => start(e, 'resize', { type: 'group', id: g.id })}
                  />
                )}
              </g>
            );
          })}

          {diagram.edges.map((edge) => {
            const from = nodesById.get(edge.from);
            const to = nodesById.get(edge.to);
            if (!from || !to) return null;
            const { start: a, end: b, mid } = edgeLine(from, to);
            const selected = isSelected('edge', edge.id);
            const labelWidth = estimateTextWidth(edge.label) + 10;
            return (
              <g key={edge.id} data-edge-id={edge.id} className="cursor-pointer" onPointerDown={(e) => start(e, 'move', { type: 'edge', id: edge.id })}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={14} />
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  strokeWidth={selected ? 3 : 1.5}
                  markerEnd="url(#adb-arrow)"
                  className={selected ? 'stroke-emerald-600 dark:stroke-emerald-400' : 'stroke-current'}
                />
                {edge.label && (
                  <>
                    <rect x={mid.x - labelWidth / 2} y={mid.y - 10} width={labelWidth} height={20} rx={6} className="fill-white stroke-slate-300 dark:fill-slate-900 dark:stroke-slate-700" />
                    <text x={mid.x} y={mid.y + 4} fontSize={12} textAnchor="middle" className="fill-slate-700 dark:fill-slate-300">
                      {edge.label}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {diagram.nodes.map((n) => {
            const shape = nodeShape(n.kind);
            const lines = wrapLabel(n.label);
            const layout = nodeTextLayout(lines.length);
            const selected = isSelected('node', n.id);
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                tabIndex={0}
                role="button"
                aria-label={`${KIND_LABELS[n.kind]}: ${n.label || 'untitled'}`}
                aria-pressed={selected}
                data-node-id={n.id}
                className="cursor-grab focus:outline-none"
                onPointerDown={(e) => start(e, 'move', { type: 'node', id: n.id })}
                onFocus={() => onSelect({ type: 'node', id: n.id })}
                onKeyDown={(e) => itemKeys(e, { type: 'node', id: n.id })}
              >
                {(selected || connectFrom === n.id) && (
                  <rect
                    x={-6}
                    y={-6}
                    width={NODE_WIDTH + 12}
                    height={NODE_HEIGHT + 12}
                    rx={10}
                    fill="none"
                    strokeWidth={2.5}
                    strokeDasharray={connectFrom === n.id ? '4 3' : undefined}
                    className="stroke-emerald-600 dark:stroke-emerald-400"
                  />
                )}
                <path d={shape.d} strokeWidth={1.5} strokeDasharray={shape.dashed ? '5 3' : undefined} className={KIND_STYLE[n.kind].className} />
                <text x={NODE_WIDTH / 2} y={layout.captionY} fontSize={9} letterSpacing={1} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400">
                  {KIND_LABELS[n.kind].toUpperCase()}
                </text>
                {lines.map((line, i) => (
                  <text key={i} x={NODE_WIDTH / 2} y={layout.lineY(i)} fontSize={13} fontWeight={600} textAnchor="middle" className="fill-slate-900 dark:fill-slate-100">
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </g>
      </svg>
      {!diagram.nodes.length && !diagram.groups.length && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Empty canvas. Add a node or load a sample (up to {LIMITS.nodes} nodes).
        </p>
      )}
    </div>
  );
}
