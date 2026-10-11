import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import signaturePad from './index';
import {
  CANVAS_H,
  CANVAS_W,
  FONT_STACKS,
  addPoint,
  padBounds,
  strokeBounds,
  strokePaths,
  strokesToSvg,
  typedBounds,
  typedToSvg,
  type Bounds,
  type Stroke,
} from './features/signature-pad';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CopyButton, Segmented } from '../../shared/ui/tool';
import { Checkbox, OptionsCard } from '../../shared/ui/convert';
import { Button, Icon } from '../../shared/ui/ui';
import { downloadBlob, downloadText } from '../../shared/utils/dom.utils';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const toolbarBtn =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium pointer-coarse:min-h-11 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800';
const colorCls = 'h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white pointer-coarse:h-11 dark:border-slate-700 dark:bg-slate-950';
const SCALE = 2; // PNG pixels per drawing unit
const PAD = 8;

type Mode = 'draw' | 'type';

function paint(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of strokes)
    for (const p of strokePaths(s)) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = p.w;
      ctx.stroke(new Path2D(p.d));
    }
}

function measureTyped(text: string, css: string, size: number) {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return null;
  ctx.font = `${size}px ${css}`;
  const m = ctx.measureText(text);
  return { width: m.width, ascent: m.actualBoundingBoxAscent || size * 0.8, descent: m.actualBoundingBoxDescent || size * 0.3 };
}

function toPng(box: Bounds, draw: (ctx: CanvasRenderingContext2D) => void): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(box.w * SCALE));
  canvas.height = Math.max(1, Math.ceil(box.h * SCALE));
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  ctx.scale(SCALE, SCALE);
  ctx.translate(-box.x, -box.y);
  draw(ctx); // no background fill: the PNG stays transparent
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

export default function SignaturePadPage() {
  const [mode, setMode] = useState<Mode>('draw');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState('#0f172a');
  const [width, setWidth] = useState(3);
  const [trim, setTrim] = useState(true);
  const [text, setText] = useState('');
  const [fontKey, setFontKey] = useState(FONT_STACKS[0].value);
  const [size, setSize] = useState(64);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef<Stroke | null>(null);

  const css = (FONT_STACKS.find((f) => f.value === fontKey) ?? FONT_STACKS[0]).css;

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(16, CANVAS_H * 0.75);
    ctx.lineTo(CANVAS_W - 16, CANVAS_H * 0.75);
    ctx.stroke();
    ctx.restore();
    paint(ctx, live.current ? [...strokes, live.current] : strokes);
  }, [strokes]);
  useEffect(() => {
    if (mode === 'draw') redraw();
  }, [mode, redraw]);

  const at = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) * CANVAS_W) / rect.width, y: ((e.clientY - rect.top) * CANVAS_H) / rect.height, p: e.pointerType === 'pen' ? e.pressure : 0.5 };
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    live.current = { pts: [at(e)], color, width };
    redraw();
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = live.current;
    if (!s) return;
    const events = typeof e.nativeEvent.getCoalescedEvents === 'function' ? e.nativeEvent.getCoalescedEvents() : [];
    const rect = e.currentTarget.getBoundingClientRect();
    for (const ev of events.length ? events : [e.nativeEvent]) {
      addPoint(s.pts, { x: ((ev.clientX - rect.left) * CANVAS_W) / rect.width, y: ((ev.clientY - rect.top) * CANVAS_H) / rect.height, p: e.pointerType === 'pen' ? ev.pressure : 0.5 });
    }
    redraw();
  };
  const onUp = () => {
    const s = live.current;
    live.current = null;
    if (s) setStrokes((all) => [...all, s]);
  };

  const typed = mode === 'type' && text.trim() ? measureTyped(text, css, size) : null;
  const drawBox = useMemo((): Bounds | null => {
    if (!strokes.length) return null;
    const b = strokeBounds(strokes);
    return trim && b ? padBounds(b, PAD, { w: CANVAS_W, h: CANVAS_H }) : { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H };
  }, [strokes, trim]);
  const typedBox = typed ? typedBounds(typed, PAD + size * 0.1) : null;
  const box = mode === 'draw' ? drawBox : typedBox;
  const svg = !box ? '' : mode === 'draw' ? strokesToSvg(strokes, box) : typedToSvg(text, { css, size, color }, box);
  const ready = Boolean(box);

  const downloadPng = async () => {
    if (!box) return;
    const blob = await toPng(box, (ctx) => {
      if (mode === 'draw') paint(ctx, strokes);
      else {
        ctx.font = `${size}px ${css}`;
        ctx.fillStyle = color;
        ctx.fillText(text, 0, 0);
      }
    });
    if (blob) downloadBlob(blob, 'signature.png');
  };

  const status = ready
    ? mode === 'draw'
      ? `${strokes.length} stroke${strokes.length === 1 ? '' : 's'} · exports ${Math.ceil(box!.w * SCALE)}×${Math.ceil(box!.h * SCALE)} px${trim ? ' (trimmed)' : ''}`
      : `Typed signature · exports ${Math.ceil(box!.w * SCALE)}×${Math.ceil(box!.h * SCALE)} px`
    : mode === 'draw'
      ? 'Draw your signature in the box.'
      : 'Type your name to preview it.';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={signaturePad} />
      <Headline accent="signature">Sign your </Headline>
      <StatusStrip status={status} tone={ready ? 'good' : 'neutral'} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="min-w-0 space-y-6">
          <section aria-label="Signature" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <Segmented<Mode>
              label="Mode"
              options={[
                { value: 'draw', label: 'Draw' },
                { value: 'type', label: 'Type' },
              ]}
              value={mode}
              onChange={setMode}
            />
            {mode === 'draw' ? (
              <>
                <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-slate-600">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_W * SCALE}
                    height={CANVAS_H * SCALE}
                    role="img"
                    aria-label="Signature drawing area. Drawing needs a mouse, finger or pen; to sign with the keyboard switch to Type mode."
                    data-testid="signature-canvas"
                    className="block h-auto w-full cursor-crosshair"
                    style={{ touchAction: 'none', aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" disabled={!strokes.length} onClick={() => setStrokes((s) => s.slice(0, -1))}>
                    Undo
                  </Button>
                  <Button variant="secondary" disabled={!strokes.length} onClick={() => setStrokes([])}>
                    Clear
                  </Button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pen pressure changes the line width when your device reports it. Prefer the keyboard? Use Type mode.</p>
              </>
            ) : (
              <>
                <label className="block min-w-0">
                  <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Your name</span>
                  <input className={inputCls} value={text} maxLength={60} onChange={(e) => setText(e.target.value)} autoComplete="off" spellCheck={false} />
                </label>
                <Segmented<string> label="Style" options={FONT_STACKS.map((f) => ({ value: f.value, label: f.label }))} value={fontKey} onChange={setFontKey} />
                <div
                  data-testid="typed-preview"
                  aria-label="Typed signature preview"
                  className="flex min-h-32 items-center overflow-x-auto rounded-2xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-600"
                  style={{ fontFamily: css, fontSize: size, color, whiteSpace: 'nowrap' }}
                >
                  {text}
                </div>
              </>
            )}
          </section>

          <OptionsCard label="Pen">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className={colorCls} />
              Colour
            </label>
            {mode === 'draw' ? (
              <>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  Pen width
                  <input type="range" min={1} max={12} step={0.5} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-32 pointer-coarse:h-11" />
                  <span className="w-8 tabular-nums">{width}</span>
                </label>
                <Checkbox label="Trim whitespace" checked={trim} onChange={setTrim} />
              </>
            ) : (
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                Size (px)
                <input type="number" min={24} max={160} step={4} value={size} onChange={(e) => setSize(Math.max(24, Math.min(160, Math.floor(Number(e.target.value)) || 24)))} className={`${inputCls} w-24`} />
              </label>
            )}
          </OptionsCard>
        </div>

        <section aria-label="Export" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="image" className="h-4 w-4" /> Export
            </h2>
            <div className="flex flex-wrap items-center gap-1">
              <button type="button" className={toolbarBtn} disabled={!ready} onClick={() => void downloadPng()}>
                <Icon name="download" className="h-4 w-4" /> PNG
              </button>
              <button type="button" className={toolbarBtn} disabled={!ready} onClick={() => downloadText(svg, 'signature.svg', 'image/svg+xml')}>
                <Icon name="download" className="h-4 w-4" /> SVG
              </button>
              <CopyButton text={svg} label="Copy SVG" disabled={!ready} />
            </div>
          </header>
          <p className="p-4 text-sm text-slate-600 sm:p-6 dark:text-slate-400">
            The PNG has a transparent background. The SVG of a typed signature uses the same system font, so it looks right only where that font is installed; use PNG to keep the exact look.
          </p>
        </section>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">Your signature is drawn and exported in your browser and is never uploaded or stored.</p>
    </div>
  );
}
