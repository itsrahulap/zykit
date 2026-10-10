import { useEffect, useRef, useState } from 'react';
import imageDiff from './index';
import { compare, type CompareRequest, type CompareResult } from './features/compare';
import { sameSize, type Align } from './features/diff';
import type { Req, Res } from './diff.worker';
import { AppError } from '../../shared/lib/errors';
import { decodeImage, encodeCanvas, makeCanvas } from '../../shared/lib/image';
import { downloadBlob, isImageFile } from '../../shared/lib/imageClient';
import { usePageFileIntake } from '../../shared/hooks/useImageBatch';
import { FilePickerButton, ImageDropZone, RangeField } from '../../shared/ui/ImageBatch';
import { Checkbox, OptionsCard } from '../../shared/ui/convert';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';

type Mode = 'side' | 'slider' | 'onion' | 'diff' | 'blink';
interface Loaded { id: number; name: string; bitmap: ImageBitmap }
type Slot = 'a' | 'b';

const card = 'space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';

/** Worker when OffscreenCanvas is available, else the main thread. */
let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { ok: (r: CompareResult) => void; fail: (e: Error) => void }>();
function runCompare(req: CompareRequest): Promise<CompareResult> {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return new Promise((r) => setTimeout(() => r(compare(req)), 0));
  worker ??= (() => {
    const w = new Worker(new URL('./diff.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<Res>) => {
      const p = pending.get(e.data.id);
      pending.delete(e.data.id);
      if (e.data.ok) p?.ok(e.data.result);
      else p?.fail(new Error(e.data.error));
    };
    return w;
  })();
  const id = nextId++;
  return new Promise((ok, fail) => {
    pending.set(id, { ok, fail });
    worker!.postMessage({ id, ...req } satisfies Req);
  });
}

function PixelCanvas({ data, width, height, label, className = '', style }: { data: Uint8ClampedArray<ArrayBuffer>; width: number; height: number; label: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    ref.current?.getContext('2d')?.putImageData(new ImageData(data, width, height), 0, 0);
  }, [data, width, height]);
  return <canvas ref={ref} width={width} height={height} role="img" aria-label={label} className={`block h-auto w-full max-w-full ${className}`} style={style} />;
}

export default function ImageDiffPage() {
  const [imgs, setImgs] = useState<{ a?: Loaded; b?: Loaded }>({});
  const [tolerance, setTolerance] = useState(10);
  const [ignoreAA, setIgnoreAA] = useState(false);
  const [align, setAlign] = useState<Align>('topleft');
  const [mode, setMode] = useState<Mode>('diff');
  const [pos, setPos] = useState(50);
  const [opacity, setOpacity] = useState(50);
  const [showB, setShowB] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<{ key: string; r: CompareResult } | null>(null);
  const ids = useRef(1);
  const { a, b } = imgs;
  const key = a && b ? `${a.id}|${b.id}|${tolerance}|${ignoreAA}|${align}` : '';

  const load = async (files: File[], slot: Slot) => {
    const file = files.find(isImageFile);
    if (!file) return files.length && setError('That is not an image file.');
    try {
      const bitmap = await decodeImage(file);
      setError(null);
      setImgs((s) => ({ ...s, [slot]: { id: ids.current++, name: file.name || 'pasted image', bitmap } }));
    } catch (e) {
      setError(e instanceof AppError ? e.message : 'This image could not be read.');
    }
  };
  // Pasted or dropped anywhere: two files fill A and B; one fills the first empty slot (else B).
  usePageFileIntake((files) => {
    if (files.length >= 2) {
      void load([files[0]], 'a');
      void load([files[1]], 'b');
    } else void load(files, !imgs.a ? 'a' : 'b');
  });

  useEffect(() => {
    if (!a || !b) return;
    let live = true;
    runCompare({ a: a.bitmap, b: b.bitmap, align, tolerance, ignoreAntiAlias: ignoreAA })
      .then((r) => live && setOut({ key, r }))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [a, b, align, tolerance, ignoreAA, key]);

  useEffect(() => {
    if (!playing || mode !== 'blink') return;
    const t = setInterval(() => setShowB((s) => !s), 700);
    return () => clearInterval(t);
  }, [playing, mode]);

  const r = out && out.key === key ? out.r : null;
  const busy = !!key && !r;
  const mismatch = a && b && !sameSize(a.bitmap, b.bitmap);
  const status = !a || !b ? 'Add two images to compare.' : busy ? 'Comparing…' : r!.changed ? `${r!.changed.toLocaleString('en-US')} pixels differ (${r!.percent.toFixed(2)}%).` : 'No visible differences.';

  const exportPng = async () => {
    if (!r) return;
    const c = makeCanvas(r.width, r.height);
    (c.getContext('2d') as CanvasRenderingContext2D).putImageData(new ImageData(r.diff, r.width, r.height), 0, 0);
    downloadBlob(await encodeCanvas(c, 'image/png'), 'image-diff.png');
  };

  const slot = (s: Slot, l?: Loaded) =>
    l ? (
      <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
        <p className="min-w-0 text-sm text-slate-700 dark:text-slate-300">
          <strong>Image {s.toUpperCase()}</strong> <span className="break-all">{l.name}</span> · {l.bitmap.width} × {l.bitmap.height} px
        </p>
        <FilePickerButton onFiles={(f) => void load(f, s)} multiple={false} label="Replace" variant="secondary" />
      </div>
    ) : (
      <ImageDropZone onFiles={(f) => void load(f, s)} multiple={false} title={`Image ${s.toUpperCase()}`} hint="Drop, paste or choose an image" />
    );

  const dims = r ? { width: r.width, height: r.height } : { width: 1, height: 1 };
  const A = r && <PixelCanvas data={r.a} {...dims} label="Image A" />;
  const B = r && <PixelCanvas data={r.b} {...dims} label="Image B" />;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={imageDiff} />
      <Headline accent="differences">Spot the </Headline>
      <StatusStrip status={status} tone={busy ? 'busy' : r?.changed ? 'neutral' : r ? 'good' : 'neutral'} />
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="grid gap-4 md:grid-cols-2">
        {slot('a', a)}
        {slot('b', b)}
      </div>

      {a && b && (
        <OptionsCard label="Comparison settings">
          {mismatch && (
            <div className="flex w-full flex-col gap-2">
              <p role="status" className="text-sm text-amber-700 dark:text-amber-400">
                The sizes differ ({a.bitmap.width} × {a.bitmap.height} vs {b.bitmap.width} × {b.bitmap.height}). Choose how to line them up.
              </p>
              <Segmented
                label="Align images"
                options={[
                  { value: 'topleft', label: 'Align top-left' },
                  { value: 'scale', label: 'Scale B to A' },
                ]}
                value={align}
                onChange={setAlign}
              />
            </div>
          )}
          <RangeField label="Tolerance" min={0} max={255} value={tolerance} onChange={setTolerance} />
          <Checkbox label="Ignore anti-aliasing" checked={ignoreAA} onChange={setIgnoreAA} />
        </OptionsCard>
      )}

      {r && (
        <section aria-label="Comparison" className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented
              label="View"
              options={[
                { value: 'diff', label: 'Difference' },
                { value: 'side', label: 'Side by side' },
                { value: 'slider', label: 'Slider' },
                { value: 'onion', label: 'Onion skin' },
                { value: 'blink', label: 'Blink' },
              ]}
              value={mode}
              onChange={setMode}
            />
            <Button variant="secondary" className="!px-3 !py-2 !text-sm pointer-coarse:min-h-11" onClick={exportPng}>
              <Icon name="download" className="h-4 w-4" /> Download diff PNG
            </Button>
          </div>

          <div className="checkerboard relative mx-auto w-full max-w-full overflow-hidden rounded-2xl" style={{ maxWidth: r.width }}>
            {mode === 'diff' && <PixelCanvas data={r.diff} {...dims} label="Difference heatmap" />}
            {mode === 'side' && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {A}
                {B}
              </div>
            )}
            {mode === 'slider' && (
              <>
                {A}
                <PixelCanvas data={r.b} {...dims} label="Image B (left of divider)" className="absolute inset-0 !h-full" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
                <div aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]" style={{ left: `${pos}%` }} />
              </>
            )}
            {mode === 'onion' && (
              <>
                {A}
                <PixelCanvas data={r.b} {...dims} label="Image B overlay" className="absolute inset-0 !h-full" style={{ opacity: opacity / 100 }} />
              </>
            )}
            {mode === 'blink' && (showB ? B : A)}
          </div>

          {mode === 'slider' && (
            <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
              <span className="shrink-0">Divider (B left, A right)</span>
              <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="min-w-0 flex-1 accent-emerald-600 pointer-coarse:min-h-11" />
            </label>
          )}
          {mode === 'onion' && <RangeField label="Opacity of B" min={0} max={100} value={opacity} onChange={setOpacity} suffix="%" />}
          {mode === 'blink' && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" className="!px-3 !py-2 !text-sm pointer-coarse:min-h-11" aria-pressed={playing} onClick={() => setPlaying((p) => !p)}>
                {playing ? 'Stop blinking' : 'Start blinking'}
              </Button>
              <Button variant="secondary" className="!px-3 !py-2 !text-sm pointer-coarse:min-h-11" onClick={() => setShowB((s) => !s)}>
                Switch
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">Showing image {showB ? 'B' : 'A'}</span>
            </div>
          )}
          {mode === 'diff' && <p className="text-xs text-slate-500 dark:text-slate-400">Red: changed. Yellow: anti-aliasing ignored. Grey: unchanged.</p>}

          <dl aria-label="Statistics" className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {(
              [
                ['Compared size', `${r.width} × ${r.height} px`],
                ['Changed pixels', `${r.changed.toLocaleString('en-US')} of ${r.total.toLocaleString('en-US')} (${r.percent.toFixed(2)}%)`],
                ['Bounding box', r.bbox ? `x ${r.bbox.x}, y ${r.bbox.y}, ${r.bbox.width} × ${r.bbox.height} px` : 'none'],
                ...(ignoreAA ? [['Anti-aliasing ignored', `${r.skippedAntiAlias.toLocaleString('en-US')} pixels`]] : []),
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                <dd className="min-w-0 font-mono break-words text-slate-900 dark:text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
