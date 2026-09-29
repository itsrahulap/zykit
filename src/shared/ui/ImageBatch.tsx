// Shared UI for the image tools: file picker and drop zone, sliders and number inputs, per-file
// results with sizes, "Download all (ZIP)" and a before/after comparison.

import { useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import type { BatchItem } from '../hooks/useImageBatch';
import { downloadZip, savedPercent } from '../lib/imageClient';
import { formatBytes, formatDimensions } from '../utils/format.utils';
import { Segmented } from './tool';
import { Button, Icon } from './ui';

/** Hidden file input + button. */
export function FilePickerButton({
  onFiles,
  multiple = true,
  accept = 'image/*',
  label = 'Choose images',
  variant = 'primary',
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  label?: string;
  variant?: 'primary' | 'secondary';
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
      <Button variant={variant} onClick={() => input.current?.click()} className="pointer-coarse:min-h-11">
        <Icon name="upload" className="h-4 w-4" /> {label}
      </Button>
    </>
  );
}

/** Drop zone card. The whole page also accepts drops and pastes via usePageFileIntake. */
export function ImageDropZone({
  onFiles,
  multiple = true,
  accept = 'image/*',
  title = multiple ? 'Drop images here' : 'Drop an image here',
  hint,
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  title?: string;
  hint: string;
}) {
  const [dragging, setDragging] = useState(false);
  const hintId = useId();
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={() => setDragging(false)}
      className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-colors sm:py-16 ${
        dragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
      }`}
    >
      <div className="mb-4 rounded-2xl bg-primary p-3 text-primary-ink">
        <Icon name="upload" className="h-7 w-7" />
      </div>
      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p id={hintId} className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {hint}
      </p>
      <div className="mt-5">
        <FilePickerButton onFiles={onFiles} multiple={multiple} accept={accept} label={multiple ? 'Select images' : 'Select image'} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- notes, controls */

export function MetadataNote() {
  return (
    <p className="flex gap-2 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
      <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Re-encoding removes metadata such as EXIF and GPS. To strip metadata without re-encoding (no quality loss), use{' '}
        <Link to="/tools/clean-image" className="font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400">
          Clean Image
        </Link>
        .
      </span>
    </p>
  );
}

export function RangeField({
  label,
  value,
  min,
  max,
  onChange,
  disabled,
  suffix = '',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  suffix?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-1 basis-56 items-center gap-3 text-sm text-slate-600 dark:text-slate-400 ${disabled ? 'opacity-50' : ''}`}>
      <span className="shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-emerald-600 pointer-coarse:min-h-11"
      />
      <span className="w-12 shrink-0 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
        {value}
        {suffix}
      </span>
    </label>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  min = 1,
  max = 16384,
  width = 'w-24',
}: {
  label: string;
  value: number | '';
  onChange: (v: number | '') => void;
  placeholder?: string;
  min?: number;
  max?: number;
  width?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') return onChange('');
          const n = Math.round(Number(v));
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(0, n)));
        }}
        className={`${width} rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100`}
      />
    </label>
  );
}

/* ---------------------------------------------------------------- results */

export function SizeChange({ before, after }: { before: number; after: number }) {
  const pct = savedPercent(before, after);
  return (
    <span className="whitespace-nowrap">
      {formatBytes(before)} → <strong className="font-semibold text-slate-900 dark:text-slate-100">{formatBytes(after)}</strong>{' '}
      <span className={pct > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>
        ({pct > 0 ? `−${pct}` : `+${Math.abs(pct)}`}%)
      </span>
    </span>
  );
}

/** One row per file with thumbnail, dimensions, sizes, status and download. */
export function BatchList({
  items,
  onRemove,
  selectedId,
  onSelect,
  extra,
}: {
  items: BatchItem[];
  onRemove: (id: number) => void;
  selectedId?: number;
  onSelect?: (id: number) => void;
  extra?: (item: BatchItem) => ReactNode;
}) {
  return (
    <ul className="divide-y divide-slate-100 rounded-3xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900" aria-label="Files">
      {items.map((item) => {
        const r = item.result;
        const selected = selectedId === item.id;
        return (
          <li key={item.id} className={`flex flex-wrap items-center gap-3 p-3 sm:gap-4 sm:p-4 ${selected ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''}`}>
            <div className="checkerboard flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl">
              {r ? <img src={r.url} alt="" className="max-h-full max-w-full object-contain" /> : <Icon name="image" className="h-6 w-6 text-slate-400" />}
            </div>
            <div className="min-w-0 flex-1 basis-40 text-sm">
              <p className="truncate font-medium text-slate-900 dark:text-slate-100" title={item.file.name}>
                {item.file.name}
              </p>
              <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                {item.status === 'error' ? (
                  <span role="alert" className="text-red-700 dark:text-red-400">
                    {item.error}
                  </span>
                ) : r ? (
                  <>
                    <SizeChange before={item.file.size} after={r.blob.size} />
                    <span className="block text-xs text-slate-500 sm:inline sm:pl-2">
                      {formatDimensions(r.srcWidth, r.srcHeight)} → {formatDimensions(r.width, r.height)} px
                    </span>
                  </>
                ) : (
                  <span>{formatBytes(item.file.size)}</span>
                )}
                {(item.status === 'working' || item.status === 'queued') && (
                  <span className="pl-2 text-emerald-700 dark:text-emerald-400">{item.status === 'working' ? 'Processing…' : 'Waiting…'}</span>
                )}
              </p>
              {extra?.(item)}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {onSelect && r && (
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(item.id)}
                  className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 pointer-coarse:min-h-11 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Compare
                </button>
              )}
              {r && (
                <a
                  href={r.url}
                  download={r.name}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 pointer-coarse:min-h-11 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                >
                  <Icon name="download" className="h-4 w-4" /> <span className="sr-only sm:not-sr-only">Download</span>
                  <span className="sr-only"> {r.name}</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.file.name}`}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 pointer-coarse:min-h-11 pointer-coarse:min-w-11 dark:hover:bg-slate-800"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Totals + "Download all (ZIP)" + "Clear". */
export function BatchToolbar({
  items,
  zipName,
  onClear,
  onAdd,
  files,
}: {
  items: BatchItem[];
  zipName: string;
  onClear: () => void;
  onAdd: (files: File[]) => void;
  /** Files to put in the ZIP; defaults to every finished result. */
  files?: { name: string; blob: Blob }[];
}) {
  const done = items.filter((i) => i.result && i.status !== 'error');
  const zipFiles = files ?? done.map((i) => ({ name: i.result!.name, blob: i.result!.blob }));
  const before = done.reduce((s, i) => s + i.file.size, 0);
  const after = zipFiles.reduce((s, f) => s + f.blob.size, 0);
  const [zipping, setZipping] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {done.length} of {items.length} ready{done.length > 0 && <> · <SizeChange before={before} after={after} /></>}
      </p>
      <div className="flex flex-wrap gap-2">
        <FilePickerButton onFiles={onAdd} label="Add images" variant="secondary" />
        <Button variant="secondary" onClick={onClear} className="pointer-coarse:min-h-11">
          Clear
        </Button>
        {zipFiles.length > 1 && (
          <Button
            disabled={zipping}
            className="pointer-coarse:min-h-11"
            onClick={async () => {
              setZipping(true);
              try {
                await downloadZip(zipFiles, zipName);
              } finally {
                setZipping(false);
              }
            }}
          >
            <Icon name="download" className="h-4 w-4" /> Download all (ZIP)
          </Button>
        )}
      </div>
    </div>
  );
}

/** Before/after comparison: a draggable divider or two images side by side. */
export function CompareView({ beforeUrl, afterUrl, beforeLabel, afterLabel }: { beforeUrl: string; afterUrl: string; beforeLabel: string; afterLabel: string }) {
  const [mode, setMode] = useState<'slider' | 'side'>('slider');
  const [pos, setPos] = useState(50);
  return (
    <section aria-label="Compare" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Icon name="diff" className="h-4 w-4" /> Before / after
        </h2>
        <Segmented
          label="Comparison view"
          options={[
            { value: 'slider', label: 'Slider' },
            { value: 'side', label: 'Side by side' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>
      {mode === 'slider' ? (
        <div>
          <div className="checkerboard relative mx-auto w-fit max-w-full overflow-hidden rounded-2xl">
            <img src={afterUrl} alt={afterLabel} className="block max-h-[32rem] w-auto max-w-full select-none" draggable={false} />
            <img
              src={beforeUrl}
              alt={beforeLabel}
              className="absolute inset-0 block h-full w-full select-none"
              style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
              draggable={false}
            />
            <div aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]" style={{ left: `${pos}%` }} />
            <span className="absolute left-2 top-2 rounded-md bg-slate-900/70 px-2 py-0.5 text-xs text-white">Before</span>
            <span className="absolute right-2 top-2 rounded-md bg-slate-900/70 px-2 py-0.5 text-xs text-white">After</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-label="Divider position"
            className="mt-3 w-full accent-emerald-600 pointer-coarse:min-h-11"
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            [beforeUrl, beforeLabel, 'Before'],
            [afterUrl, afterLabel, 'After'],
          ].map(([url, alt, cap]) => (
            <figure key={cap} className="min-w-0">
              <div className="checkerboard flex justify-center overflow-hidden rounded-2xl">
                <img src={url} alt={alt} className="block max-h-[28rem] w-auto max-w-full object-contain" />
              </div>
              <figcaption className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">{cap}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}

