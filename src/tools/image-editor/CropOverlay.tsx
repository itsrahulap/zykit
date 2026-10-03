import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { arrowDelta, dragHandle, HANDLES, moveRect, type Handle } from './features/crop';
import type { Rect } from './features/image-editor';

const HANDLE_LABEL: Record<Handle, string> = {
  nw: 'top left',
  n: 'top',
  ne: 'top right',
  e: 'right',
  se: 'bottom right',
  s: 'bottom',
  sw: 'bottom left',
  w: 'left',
};
const HANDLE_POS: Record<Handle, { left: string; top: string; cursor: string }> = {
  nw: { left: '0%', top: '0%', cursor: 'nwse-resize' },
  n: { left: '50%', top: '0%', cursor: 'ns-resize' },
  ne: { left: '100%', top: '0%', cursor: 'nesw-resize' },
  e: { left: '100%', top: '50%', cursor: 'ew-resize' },
  se: { left: '100%', top: '100%', cursor: 'nwse-resize' },
  s: { left: '50%', top: '100%', cursor: 'ns-resize' },
  sw: { left: '0%', top: '100%', cursor: 'nesw-resize' },
  w: { left: '0%', top: '50%', cursor: 'ew-resize' },
};

/** Crop rectangle drawn over the preview: drag the box or a handle, or use the arrow keys (Shift = 10 px). */
export function CropOverlay({
  width,
  height,
  rect,
  ratio,
  onChange,
}: {
  /** Size of the image being cropped, in pixels. */
  width: number;
  height: number;
  rect: Rect;
  ratio: number | null;
  onChange: (r: Rect, group: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ start: Rect; x: number; y: number; handle: Handle | 'move' } | null>(null);

  const scale = () => (root.current ? width / root.current.getBoundingClientRect().width : 1);
  const apply = (start: Rect, handle: Handle | 'move', dx: number, dy: number) =>
    handle === 'move' ? moveRect(start, dx, dy, width, height) : dragHandle(start, handle, dx, dy, width, height, ratio);

  const down = (handle: Handle | 'move') => (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { start: rect, x: e.clientX, y: e.clientY, handle };
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const k = scale();
    onChange(apply(d.start, d.handle, (e.clientX - d.x) * k, (e.clientY - d.y) * k), 'crop-drag');
  };
  const up = () => {
    drag.current = null;
  };
  const key = (handle: Handle | 'move') => (e: KeyboardEvent) => {
    const d = arrowDelta(e.key, e.shiftKey ? 10 : 1);
    if (!d) return;
    e.preventDefault();
    e.stopPropagation();
    onChange(apply(rect, handle, d.dx, d.dy), `crop-key-${handle}`);
  };

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
  return (
    <div ref={root} className="absolute inset-0 touch-none overflow-hidden select-none">
      <div
        role="group"
        tabIndex={0}
        aria-label={`Crop area, ${rect.w} by ${rect.h} pixels at ${rect.x}, ${rect.y}. Arrow keys move it, Shift moves by 10.`}
        onPointerDown={down('move')}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key('move')}
        className="absolute cursor-move shadow-[0_0_0_9999px_rgba(15,23,42,0.55)] outline-2 outline-white focus-visible:outline-emerald-400"
        style={{ left: pct(rect.x, width), top: pct(rect.y, height), width: pct(rect.w, width), height: pct(rect.h, height), outlineStyle: 'solid' }}
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-60">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="border border-white/40" />
          ))}
        </span>
        {HANDLES.map((h) => (
          <button
            key={h}
            type="button"
            aria-label={`Resize crop from the ${HANDLE_LABEL[h]}`}
            onPointerDown={down(h)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onKeyDown={key(h)}
            className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center pointer-coarse:h-11 pointer-coarse:w-11"
            style={{ left: HANDLE_POS[h].left, top: HANDLE_POS[h].top, cursor: HANDLE_POS[h].cursor }}
          >
            <span className="h-3 w-3 rounded-sm border-2 border-slate-900 bg-white" />
          </button>
        ))}
      </div>
    </div>
  );
}
