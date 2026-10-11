import { useCallback, useEffect, useRef, useState } from 'react';
import qrCodeReader from './index';
import { decodeQrPixels } from './features/decode';
import { analyze, mask } from './features/qr-code-reader';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CopyButton } from '../../shared/ui/tool';
import { Notices } from '../../shared/ui/convert';
import { Button, Icon } from '../../shared/ui/ui';
import { decodeImage } from '../../shared/lib/image';

const MAX_SIDE = 2000;

interface BarcodeDetectorLike {
  detect(source: ImageBitmap): Promise<{ rawValue: string }[]>;
}
type BarcodeDetectorCtor = new (opts: { formats: string[] }) => BarcodeDetectorLike;

interface Result {
  text: string;
  via: string;
  detail: string;
}

/** Decodes with the browser's BarcodeDetector when it exists, otherwise (or when it finds nothing) the built-in decoder. */
async function readBitmap(bitmap: ImageBitmap, canvas: HTMLCanvasElement | null): Promise<Result> {
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const work = document.createElement('canvas');
  work.width = w;
  work.height = h;
  const ctx = work.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Your browser could not create a canvas.');
  ctx.fillStyle = '#fff'; // transparent PNGs would otherwise read as black
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  if (canvas) {
    const t = Math.min(1, 320 / Math.max(w, h));
    canvas.width = Math.round(w * t);
    canvas.height = Math.round(h * t);
    canvas.getContext('2d')?.drawImage(work, 0, 0, canvas.width, canvas.height);
  }
  const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  if (Detector) {
    try {
      const found = await new Detector({ formats: ['qr_code'] }).detect(bitmap);
      if (found[0]?.rawValue) return { text: found[0].rawValue, via: 'browser BarcodeDetector', detail: '' };
    } catch {
      // Unsupported formats or platform errors: fall through to our own decoder.
    }
  }
  const d = decodeQrPixels(ctx.getImageData(0, 0, w, h).data, w, h);
  return { text: d.text, via: 'built-in decoder', detail: `version ${d.version} · level ${d.ecc}${d.corrected ? ` · ${d.corrected} damaged codeword${d.corrected > 1 ? 's' : ''} repaired` : ''}` };
}

export default function QrCodeReaderPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [name, setName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const load = useCallback(async (file: Blob, label: string) => {
    setBusy(true);
    setError(null);
    setResult(null);
    setReveal(false);
    setName(label);
    try {
      const bitmap = await decodeImage(file);
      try {
        setResult(await readBitmap(bitmap, previewRef.current));
      } finally {
        bitmap.close();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this image.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = Array.from(e.clipboardData?.files ?? []).find((x) => x.type.startsWith('image/'));
      if (!f) return;
      e.preventDefault();
      void load(f, 'Pasted image');
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [load]);

  const a = result ? analyze(result.text) : null;
  const status = busy ? 'Reading…' : error ? error : result ? `Decoded with the ${result.via}${result.detail ? ` · ${result.detail}` : ''}` : 'Choose, drop or paste an image with a QR code.';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={qrCodeReader} />
      <Headline accent="codes">Read QR </Headline>
      <StatusStrip status={status} tone={busy ? 'busy' : result ? 'good' : 'neutral'} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <section
          aria-label="Image"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) void load(f, f.name);
          }}
          className={`min-w-0 space-y-4 rounded-3xl border-2 border-dashed p-4 sm:p-6 ${dragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            data-testid="image-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void load(f, f.name);
              e.target.value = '';
            }}
          />
          <div className="flex flex-col items-center gap-3 text-center">
            <Button onClick={() => fileRef.current?.click()}>
              <Icon name="upload" className="h-4 w-4" /> Choose image
            </Button>
            <p className="text-sm text-slate-500 dark:text-slate-400">or drop an image here, or paste one with Ctrl+V.</p>
          </div>
          <canvas ref={previewRef} role="img" aria-label={name ? `Preview of ${name}` : 'Image preview'} className={`mx-auto max-w-full rounded-xl ${name ? '' : 'hidden'}`} />
        </section>

        <section aria-label="Result" className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="eyebrow text-slate-600 dark:text-slate-400">{a ? a.title : 'Result'}</h2>
          {error && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {error} Try a sharper, larger image with the whole code and a light border around it.
            </p>
          )}
          {!a && !error && <p className="text-sm text-slate-500 dark:text-slate-400">The decoded content appears here.</p>}
          {a && result && (
            <>
              <Notices items={a.warnings} />
              {a.kind === 'url' && <p className="text-sm text-slate-600 dark:text-slate-400">Links are never opened for you. Check the address, then copy it if you want to visit it.</p>}
              {a.fields.length > 0 && (
                <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[max-content_minmax(0,1fr)]">
                  {a.fields.map((f) => (
                    <div key={f.label} className="contents">
                      <dt className="font-medium text-slate-700 dark:text-slate-300">{f.label}</dt>
                      <dd className="min-w-0 break-all font-mono text-slate-900 dark:text-slate-100">
                        {f.secret && !reveal ? mask(f.value) : f.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {a.fields.some((f) => f.secret) && (
                <Button variant="secondary" aria-pressed={reveal} onClick={() => setReveal(!reveal)}>
                  {reveal ? 'Hide password' : 'Show password'}
                </Button>
              )}
              {(a.kind !== 'wifi' || reveal) && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Raw content</h3>
                    <CopyButton text={result.text} label="Copy" />
                  </div>
                  <pre data-testid="raw-content" className="overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-slate-100 p-3 font-mono text-xs text-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    {result.text}
                  </pre>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">The image is read in your browser and never uploaded. Wi-Fi passwords stay masked until you show them.</p>
    </div>
  );
}
