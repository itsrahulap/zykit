import { useEffect, useRef, useState } from 'react';
import imagesToPdf from './index';
import { useBuildWorker } from './hooks/useBuildWorker';
import {
  classifyImage,
  DEFAULT_LAYOUT,
  EMPTY_METADATA,
  MAX_IMAGES,
  MAX_TOTAL_BYTES,
  moveItem,
  normRotation,
  outputName,
  type BuildItem,
  type ConvertFormat,
  type ImageKind,
  type LayoutOptions,
  type Metadata,
  type Rotation,
} from './features/images-to-pdf';
import { usePageFileIntake } from '../../shared/hooks/useImageBatch';
import { MAX_IMAGE_BYTES, decodeImage } from '../../shared/lib/image';
import { ImageClient } from '../../shared/lib/imageClient';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { OptionsCard } from '../../shared/ui/convert';
import { downloadBlob } from '../../shared/utils/dom.utils';
import { formatBytes, pluralize } from '../../shared/utils/format.utils';

interface Item {
  id: number;
  file: File;
  kind: ImageKind;
  /** User rotation, clockwise. */
  rotation: Rotation;
  url: string;
}

type Busy = { label: string; done: number; total: number } | null;

const iconButton =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 pointer-coarse:h-11 pointer-coarse:w-11 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white';
const field =
  'w-full rounded-xl border border-field-edge bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 dark:bg-slate-900 dark:text-slate-100';

let seq = 0;

export default function ImagesToPdfPage() {
  const send = useBuildWorker();
  const [items, setItems] = useState<Item[]>([]);
  const [layout, setLayout] = useState<LayoutOptions>(DEFAULT_LAYOUT);
  const [format, setFormat] = useState<ConvertFormat>('jpeg');
  const [quality, setQuality] = useState(85);
  const [meta, setMeta] = useState<Metadata>(EMPTY_METADATA);
  const [name, setName] = useState('images.pdf');
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const urls = useRef(new Set<string>());
  const client = useRef<ImageClient | null>(null);

  useEffect(() => {
    const set = urls.current;
    return () => {
      set.forEach((u) => URL.revokeObjectURL(u));
      client.current?.cancel();
    };
  }, []);

  const addFiles = async (list: File[]) => {
    setError(null);
    setDone(null);
    setChecking(true);
    let budget = MAX_TOTAL_BYTES - items.reduce((n, i) => n + i.file.size, 0);
    let slots = MAX_IMAGES - items.length;
    const skipped: string[] = [];
    const added: Item[] = [];
    for (const file of list) {
      if (file.size > MAX_IMAGE_BYTES) {
        skipped.push(`${file.name} is ${formatBytes(file.size)}; the limit is ${formatBytes(MAX_IMAGE_BYTES)} per image.`);
        continue;
      }
      if (file.size > budget) {
        skipped.push(`${file.name} would take the total over ${formatBytes(MAX_TOTAL_BYTES)}.`);
        continue;
      }
      if (slots <= 0) {
        skipped.push(`${file.name} was skipped; the limit is ${MAX_IMAGES} images.`);
        continue;
      }
      const kind = classifyImage(new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer()));
      if (!kind) {
        skipped.push(`${file.name} isn't an image this tool can read.`);
        continue;
      }
      if (kind.mode === 'convert') {
        try {
          (await decodeImage(file)).close();
        } catch (err) {
          skipped.push(`${file.name}: ${err instanceof Error ? err.message : "couldn't be decoded."}`);
          continue;
        }
      }
      budget -= file.size;
      slots--;
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      added.push({ id: ++seq, file, kind, rotation: 0, url });
    }
    if (skipped.length) setError(skipped.join(' '));
    if (added.length) setItems((prev) => [...prev, ...added]);
    setChecking(false);
  };
  usePageFileIntake((fs) => void addFiles(fs), !busy);

  const remove = (id: number) =>
    setItems((list) => {
      const gone = list.find((i) => i.id === id);
      if (gone) {
        URL.revokeObjectURL(gone.url);
        urls.current.delete(gone.url);
      }
      return list.filter((i) => i.id !== id);
    });
  const rotate = (id: number, deg: number) => setItems((list) => list.map((i) => (i.id === id ? { ...i, rotation: normRotation(i.rotation + deg) } : i)));
  const set = <K extends keyof LayoutOptions>(k: K, v: LayoutOptions[K]) => setLayout((l) => ({ ...l, [k]: v }));

  const build = async () => {
    setError(null);
    setDone(null);
    const total = items.length * 2;
    const prepared: BuildItem[] = [];
    client.current ??= new ImageClient();
    try {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        setBusy({ label: `Preparing image ${i + 1} of ${items.length}`, done: i, total });
        let bytes: Uint8Array;
        let kind: BuildItem['kind'];
        let base: Rotation = 0;
        if (it.kind.mode === 'convert') {
          const type = format === 'png' ? 'image/png' : 'image/jpeg';
          const r = await client.current.run(it.file, { resize: { mode: 'none' }, type, quality: quality / 100, background: '#ffffff' });
          bytes = new Uint8Array(await r.blob.arrayBuffer());
          kind = format;
        } else {
          bytes = new Uint8Array(await it.file.arrayBuffer());
          kind = it.kind.mode;
          base = it.kind.baseRotation;
        }
        prepared.push({ bytes, kind, rotation: normRotation(base + it.rotation) });
      }
      const wire = prepared.map((p) => ({ bytes: p.bytes.buffer as ArrayBuffer, kind: p.kind, rotation: p.rotation }));
      const res = await send({ type: 'build', items: wire, layout, meta }, (d) => setBusy({ label: `Adding page ${d} of ${items.length}`, done: items.length + d, total }), wire.map((w) => w.bytes));
      if (res.type === 'built') {
        const file = outputName(name);
        downloadBlob(new Blob([res.bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }), file);
        setDone(`Saved ${file} (${pluralize(items.length, 'page')}, ${formatBytes(res.bytes.length)}).`);
      } else if (res.type === 'error') setError(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The PDF couldn't be created.");
    } finally {
      setBusy(null);
    }
  };

  const status = busy ? `${busy.label}…` : done ?? (checking ? 'Reading images…' : items.length ? `${pluralize(items.length, 'image')}, ${pluralize(items.length, 'page')}.` : 'Add images to start.');
  const converted = items.some((i) => i.kind.mode === 'convert');
  const disabled = !!busy || checking;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={imagesToPdf} />
      <div className="space-y-3">
        <Headline accent="a PDF">Images to </Headline>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">
          Turn photos or scans into one PDF. JPEG and PNG go in untouched; WebP, AVIF, GIF and others are converted first. Everything runs in this tab; nothing is uploaded.
        </p>
      </div>
      <StatusStrip status={status} tone={busy || checking ? 'busy' : done ? 'good' : 'neutral'} />

      {busy && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label="Creating PDF" aria-valuemin={0} aria-valuemax={busy.total} aria-valuenow={busy.done}>
          <div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${busy.total ? (busy.done / busy.total) * 100 : 0}%` }} />
        </div>
      )}

      <section aria-label="Add images" className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center sm:p-8 dark:border-slate-700 dark:bg-slate-900">
        <input
          ref={input}
          type="file"
          multiple
          accept="image/*,.heic,.heif,.avif"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="file-input"
          onChange={(e) => {
            if (e.target.files) void addFiles(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
        <Button onClick={() => input.current?.click()} disabled={disabled}>
          <Icon name="upload" className="h-4 w-4" /> Add images
        </Button>
        <p className="text-sm text-slate-500 dark:text-slate-400">or drop or paste them here · up to {MAX_IMAGES} images, {formatBytes(MAX_IMAGE_BYTES)} each</p>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          <Icon name="warn" className="h-5 w-5 shrink-0" />
          <p className="min-w-0 flex-1 break-words">{error}</p>
          <button type="button" onClick={() => setError(null)} className="rounded p-0.5 pointer-coarse:min-h-11 hover:bg-red-100 dark:hover:bg-red-900" aria-label="Dismiss error">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
      )}

      {items.length > 0 && (
        <section aria-label="Pages" className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="eyebrow text-slate-600 dark:text-slate-400">
            Pages <span className="normal-case tracking-normal font-normal">(drag or use the arrows to reorder)</span>
          </h2>
          <ol aria-label="Page order" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((it, i) => (
              <li
                key={it.id}
                draggable={!busy}
                onDragStart={(e) => {
                  setDragFrom(i);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', it.file.name);
                }}
                onDragOver={(e) => dragFrom !== null && e.preventDefault()}
                onDrop={(e) => {
                  if (dragFrom === null) return;
                  e.preventDefault();
                  setItems((l) => moveItem(l, dragFrom, i));
                  setDragFrom(null);
                }}
                onDragEnd={() => setDragFrom(null)}
                className={`flex min-w-0 flex-col gap-2 rounded-2xl border border-slate-200 p-2 dark:border-slate-800 ${dragFrom === i ? 'opacity-50' : ''}`}
              >
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  <img src={it.url} alt="" draggable={false} className="h-full w-full object-contain transition-transform" style={{ transform: `rotate(${it.rotation}deg)` }} />
                </div>
                <p className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-mono">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate" title={it.file.name}>{it.file.name}</span>
                  <Badge tone={it.kind.mode === 'convert' ? 'amber' : 'neutral'}>{it.kind.label}</Badge>
                </p>
                <div className="flex items-center justify-between gap-0.5">
                  <button type="button" className={iconButton} disabled={i === 0 || !!busy} onClick={() => setItems((l) => moveItem(l, i, i - 1))} aria-label={`Move ${it.file.name} earlier`}>
                    <Icon name="chevron-left" className="h-4 w-4" />
                  </button>
                  <button type="button" className={iconButton} disabled={i === items.length - 1 || !!busy} onClick={() => setItems((l) => moveItem(l, i, i + 1))} aria-label={`Move ${it.file.name} later`}>
                    <Icon name="chevron-right" className="h-4 w-4" />
                  </button>
                  <button type="button" className={iconButton} disabled={!!busy} onClick={() => rotate(it.id, -90)} aria-label={`Rotate ${it.file.name} left`}>
                    <Icon name="swap" className="h-4 w-4 -scale-x-100" />
                  </button>
                  <button type="button" className={iconButton} disabled={!!busy} onClick={() => rotate(it.id, 90)} aria-label={`Rotate ${it.file.name} right`}>
                    <Icon name="swap" className="h-4 w-4" />
                  </button>
                  <button type="button" className={iconButton} disabled={!!busy} onClick={() => remove(it.id)} aria-label={`Remove ${it.file.name}`}>
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {items.length > 0 && (
        <>
          <OptionsCard label="Page layout">
            <Segmented label="Page size" value={layout.size} onChange={(v) => set('size', v)} options={[{ value: 'a4', label: 'A4' }, { value: 'letter', label: 'Letter' }, { value: 'legal', label: 'Legal' }, { value: 'fit', label: 'Fit to image' }]} />
            {layout.size !== 'fit' && (
              <>
                <Segmented label="Orientation" value={layout.orientation} onChange={(v) => set('orientation', v)} options={[{ value: 'auto', label: 'Auto' }, { value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} />
                <Segmented label="Image fit" value={layout.fit} onChange={(v) => set('fit', v)} options={[{ value: 'contain', label: 'Fit inside' }, { value: 'cover', label: 'Fill page' }]} />
              </>
            )}
            <Segmented label="Margins" value={layout.margin} onChange={(v) => set('margin', v)} options={[{ value: 'none', label: 'None' }, { value: 'small', label: '10 mm' }, { value: 'medium', label: '20 mm' }, { value: 'large', label: '30 mm' }]} />
          </OptionsCard>

          {converted && (
            <OptionsCard label="Converted images">
              <Segmented label="Convert to" value={format} onChange={setFormat} options={[{ value: 'jpeg', label: 'JPEG' }, { value: 'png', label: 'PNG (lossless)' }]} />
              {format === 'jpeg' && (
                <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  Quality {quality}
                  <input type="range" min={50} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="accent-emerald-600 pointer-coarse:min-h-11" />
                </label>
              )}
            </OptionsCard>
          )}

          <details className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <summary className="cursor-pointer rounded-3xl px-4 py-4 text-sm font-medium text-slate-800 pointer-coarse:min-h-11 sm:px-6 dark:text-slate-200">Document info (optional, empty by default)</summary>
            <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 sm:px-6 sm:pb-6">
              {(['title', 'author', 'subject', 'keywords'] as const).map((k) => (
                <label key={k} className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="capitalize">{k}</span>
                  <input type="text" value={meta[k]} onChange={(e) => setMeta((m) => ({ ...m, [k]: e.target.value }))} className={field} autoComplete="off" />
                </label>
              ))}
            </div>
          </details>

          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1 space-y-1 text-sm font-medium text-slate-700 sm:max-w-xs dark:text-slate-300">
              File name
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={field} autoComplete="off" spellCheck={false} />
            </label>
            <Button onClick={() => void build()} disabled={disabled}>
              <Icon name="download" className="h-4 w-4" /> Create PDF
            </Button>
            <Button variant="ghost" onClick={() => items.forEach((i) => remove(i.id))} disabled={disabled}>
              Clear all
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
