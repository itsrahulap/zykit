import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { clamp, normaliseBezier, num, type Bezier } from '../features/css';

// Graph space: x 0-1 across, y -0.5 (bottom) to 1.5 (top), so overshoot curves stay visible.
const W = 300;
const H = 300;
const Y_MIN = -0.5;
const Y_MAX = 1.5;
const px = (x: number) => x * W;
const py = (y: number) => ((Y_MAX - y) / (Y_MAX - Y_MIN)) * H;

export function BezierEditor({ value, onChange }: { value: Bezier; onChange: (b: Bezier) => void }) {
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<0 | 1 | null>(null);
  const b = normaliseBezier(value);

  const set = (i: 0 | 1, x: number, y: number) => {
    const n: Bezier = [...b];
    n[i * 2] = clamp(x, 0, 1);
    n[i * 2 + 1] = clamp(y, -2, 3);
    onChange(n);
  };
  const fromPointer = (e: PointerEvent, i: 0 | 1) => {
    const r = svg.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = Y_MAX - ((e.clientY - r.top) / r.height) * (Y_MAX - Y_MIN);
    set(i, Math.round(x * 100) / 100, Math.round(y * 100) / 100);
  };
  const onKey = (e: KeyboardEvent, i: 0 | 1) => {
    const step = e.shiftKey ? 0.1 : 0.01;
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    set(i, Math.round((b[i * 2] + m[0]) * 100) / 100, Math.round((b[i * 2 + 1] + m[1]) * 100) / 100);
  };

  const handle = (i: 0 | 1) => {
    const x = b[i * 2];
    const y = b[i * 2 + 1];
    return (
      <g key={i}>
        <line x1={px(i ? 1 : 0)} y1={py(i ? 1 : 0)} x2={px(x)} y2={py(y)} className="stroke-slate-400 dark:stroke-slate-500" strokeWidth={2} />
        <circle
          cx={px(x)}
          cy={py(y)}
          r={11}
          tabIndex={0}
          role="slider"
          aria-label={`Control point ${i + 1}`}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={x}
          aria-valuetext={`x ${num(x)}, y ${num(y)}`}
          onKeyDown={(e) => onKey(e, i)}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDrag(i);
            fromPointer(e, i);
          }}
          onPointerMove={(e) => drag === i && fromPointer(e, i)}
          onPointerUp={() => setDrag(null)}
          onPointerCancel={() => setDrag(null)}
          style={{ touchAction: 'none', cursor: 'grab' }}
          className="fill-emerald-600 stroke-white stroke-2 outline-none focus:stroke-slate-900 focus:stroke-[3] dark:fill-emerald-400 dark:focus:stroke-white"
        />
      </g>
    );
  };

  return (
    <svg ref={svg} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Easing curve editor" className="aspect-square w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <rect x={0} y={py(1)} width={W} height={py(0) - py(1)} className="fill-white dark:fill-slate-900" />
      <path d={`M0 ${py(0)}L${W} ${py(1)}`} className="stroke-slate-300 dark:stroke-slate-700" strokeDasharray="4 4" fill="none" />
      <path d={`M${px(0)} ${py(0)}C${px(b[0])} ${py(b[1])} ${px(b[2])} ${py(b[3])} ${px(1)} ${py(1)}`} className="stroke-slate-900 dark:stroke-slate-100" strokeWidth={3} fill="none" />
      {handle(0)}
      {handle(1)}
    </svg>
  );
}
