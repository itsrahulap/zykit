import { useMemo, useState } from 'react';
import placeholderImage from './index';
import {
  autoFontSize, buildSvg, contrastRatio, defaultText, MAX_BATCH, MAX_SIDE, normalizeColor, parseSide, parseSizes, svgDataUri, type SvgOptions,
} from './features/placeholder-image';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Icon } from '../../shared/ui/ui';
import { useShareState } from '../../shared/hooks/useShareState';
import { encodeCanvas } from '../../shared/lib/image';
import { createZip } from '../../shared/lib/zip';
import { downloadBlob } from '../../shared/utils/dom.utils';

type Format = 'png' | 'jpeg' | 'webp' | 'svg';
const FORMATS: Format[] = ['png', 'jpeg', 'webp', 'svg'];
const MIME: Record<Format, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' };
const EXT: Record<Format, string> = { png: 'png', jpeg: 'jpg', webp: 'webp', svg: 'svg' };

const inputClass =
  'block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 aria-invalid:border-red-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
const card = 'space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const btn =
  'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium pointer-coarse:min-h-11 disabled:cursor-not-allowed disabled:opacity-50';
const eyebrow = 'eyebrow mb-2 block text-slate-600 dark:text-slate-400';

async function render(o: SvgOptions, format: Format): Promise<Blob> {
  if (format === 'svg') return new Blob([buildSvg(o)], { type: MIME.svg });
  const canvas = document.createElement('canvas');
  canvas.width = o.w;
  canvas.height = o.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('The browser could not create a drawing surface. Try a smaller size.');
  ctx.fillStyle = o.bg;
  ctx.fillRect(0, 0, o.w, o.h);
  if (o.text) {
    ctx.fillStyle = o.fg;
    ctx.font = `600 ${o.fontSize}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(o.text, o.w / 2, o.h / 2);
  }
  return encodeCanvas(canvas, MIME[format], 0.92);
}

function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const valid = normalizeColor(value);
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={eyebrow}>{label}</label>
      <div className="flex gap-2">
        <input type="color" aria-label={`${label} picker`} value={valid ?? '#000000'} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 pointer-coarse:h-11 dark:border-slate-800 dark:bg-slate-950" />
        <input id={id} value={value} spellCheck={false} autoComplete="off" aria-invalid={!valid || undefined} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      </div>
    </div>
  );
}

export default function PlaceholderImagePage() {
  const [wText, setW] = useState('800');
  const [hText, setH] = useState('600');
  const [bgText, setBg] = useState('#cbd5e1');
  const [fgText, setFg] = useState('#334155');
  const [text, setText] = useState('');
  const [autoSize, setAutoSize] = useState(true);
  const [sizeText, setSizeText] = useState('48');
  const [format, setFormat] = useState<Format>('png');
  const [batch, setBatch] = useState('1200x630, 400x300, 150');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useShareState(
    { w: wText, h: hText, bg: bgText, fg: fgText, text, fmt: format },
    (s) => {
      if (s.w !== undefined) setW(s.w);
      if (s.h !== undefined) setH(s.h);
      if (s.bg !== undefined) setBg(s.bg);
      if (s.fg !== undefined) setFg(s.fg);
      if (s.text !== undefined) setText(s.text);
      if (s.fmt && FORMATS.includes(s.fmt)) setFormat(s.fmt);
    },
    { fmt: FORMATS },
  );

  const w = parseSide(wText);
  const h = parseSide(hText);
  const bg = normalizeColor(bgText);
  const fg = normalizeColor(fgText);
  const label = text || (w && h ? defaultText({ w, h }) : '');
  const fontSize = autoSize ? (w && h ? autoFontSize(w, h, label) : 16) : Math.max(1, Math.min(2000, Number(sizeText) || 16));
  const opts: SvgOptions | null = w && h && bg && fg ? { w, h, bg, fg, text: label, fontSize } : null;
  const svg = useMemo(() => (opts ? buildSvg(opts) : ''), [opts?.w, opts?.h, opts?.bg, opts?.fg, opts?.text, opts?.fontSize]); // eslint-disable-line react-hooks/exhaustive-deps
  const contrast = bg && fg ? contrastRatio(bg, fg) : null;
  const { sizes, invalid } = useMemo(() => parseSizes(batch), [batch]);

  const run = async (job: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await job();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const download = () => opts && run(async () => downloadBlob(await render(opts, format), `placeholder-${opts.w}x${opts.h}.${EXT[format]}`));

  const downloadZip = () =>
    bg && fg &&
    run(async () => {
      const entries = [];
      for (const s of sizes) {
        const t = text || defaultText(s);
        const blob = await render({ ...s, bg, fg, text: t, fontSize: autoSize ? autoFontSize(s.w, s.h, t) : fontSize }, format);
        entries.push({ name: `placeholder-${s.w}x${s.h}.${EXT[format]}`, data: new Uint8Array(await blob.arrayBuffer()) });
      }
      downloadBlob(new Blob([createZip(entries) as Uint8Array<ArrayBuffer>], { type: 'application/zip' }), 'placeholders.zip');
    });

  const status = !w || !h
    ? `Width and height must be whole numbers from 1 to ${MAX_SIDE}.`
    : !bg || !fg
      ? 'Colours must be hex like #cbd5e1 or #abc.'
      : `${w}×${h} ${format.toUpperCase()}${w * h > 16_000_000 && format !== 'svg' ? ' (very large: some browsers may fail to encode it)' : ''}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={placeholderImage} />
      <Headline accent="placeholder">Make a </Headline>
      <StatusStrip status={status} tone={opts ? 'good' : 'neutral'} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Settings" className={card}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label htmlFor="pi-w" className={eyebrow}>Width (px)</label>
              <input id="pi-w" value={wText} inputMode="numeric" autoComplete="off" aria-invalid={!w || undefined} onChange={(e) => setW(e.target.value)} className={inputClass} />
            </div>
            <div className="min-w-0">
              <label htmlFor="pi-h" className={eyebrow}>Height (px)</label>
              <input id="pi-h" value={hText} inputMode="numeric" autoComplete="off" aria-invalid={!h || undefined} onChange={(e) => setH(e.target.value)} className={inputClass} />
            </div>
            <ColorField id="pi-bg" label="Background colour" value={bgText} onChange={setBg} />
            <ColorField id="pi-fg" label="Text colour" value={fgText} onChange={setFg} />
          </div>
          {contrast !== null && contrast < 4.5 && (
            <p role="status" className="flex gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <Icon name="warn" className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0">Low contrast ({contrast.toFixed(1)}:1). The text may be hard to read; WCAG recommends at least 4.5:1.</span>
            </p>
          )}
          <div className="min-w-0">
            <label htmlFor="pi-text" className={eyebrow}>Text</label>
            <input id="pi-text" value={text} placeholder={w && h ? defaultText({ w, h }) : 'W×H'} autoComplete="off" onChange={(e) => setText(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700 pointer-coarse:min-h-11 dark:text-slate-300">
              <input type="checkbox" checked={autoSize} onChange={(e) => setAutoSize(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
              Auto font size{autoSize && ` (${fontSize}px)`}
            </label>
            {!autoSize && (
              <div className="w-28">
                <label htmlFor="pi-fs" className={eyebrow}>Font size (px)</label>
                <input id="pi-fs" value={sizeText} inputMode="numeric" onChange={(e) => setSizeText(e.target.value)} className={inputClass} />
              </div>
            )}
          </div>
          <Segmented<Format> label="Format" value={format} onChange={setFormat} options={FORMATS.map((f) => ({ value: f, label: f === 'jpeg' ? 'JPEG' : f.toUpperCase() }))} />
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={!opts || busy} onClick={download} className={`${btn} bg-primary text-primary-ink ring-1 ring-inset ring-primary-edge`}>
              <Icon name="download" className="h-4 w-4" /> Download {format.toUpperCase()}
            </button>
            <CopyButton text={svg ? svgDataUri(svg) : ''} label="Copy SVG data URI" disabled={!svg} />
          </div>
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </section>

        <section aria-label="Preview" className={card}>
          <h2 className="eyebrow text-slate-600 dark:text-slate-400">Preview</h2>
          <div className="flex justify-center overflow-hidden rounded-2xl bg-slate-100 p-2 dark:bg-slate-800">
            {svg ? <img src={svgDataUri(svg)} alt={`Placeholder image ${w}×${h}`} className="h-auto max-h-96 max-w-full" style={{ aspectRatio: `${w} / ${h}` }} /> : <p className="p-8 text-sm text-slate-500">Fix the highlighted fields to see a preview.</p>}
          </div>
          {svg && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="eyebrow text-slate-600 dark:text-slate-400">SVG</h2>
                <CopyButton text={svg} label="Copy SVG" />
              </div>
              <CodeBlock label="SVG source">{svg}</CodeBlock>
            </div>
          )}
        </section>
      </div>

      <section aria-label="Batch" className={card}>
        <h2 className="eyebrow text-slate-600 dark:text-slate-400">Batch to ZIP</h2>
        <div className="min-w-0">
          <label htmlFor="pi-batch" className={eyebrow}>Sizes (e.g. 1200x630, 400x300, 150 for a square)</label>
          <textarea id="pi-batch" rows={3} value={batch} spellCheck={false} onChange={(e) => setBatch(e.target.value)} className={`${inputClass} resize-y`} />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Uses the colours, text and format above (the default text is each image’s own size).
          {invalid.length > 0 && <span className="block text-red-600 dark:text-red-400">Ignored: {invalid.join(', ')}</span>}
          {sizes.length > MAX_BATCH && <span className="block text-red-600 dark:text-red-400">At most {MAX_BATCH} sizes per ZIP.</span>}
        </p>
        <button type="button" disabled={busy || !bg || !fg || !sizes.length || sizes.length > MAX_BATCH} onClick={downloadZip} className={`${btn} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`}>
          <Icon name="download" className="h-4 w-4" /> Download ZIP ({sizes.length})
        </button>
      </section>
    </div>
  );
}
