import { useRef, useState, type DragEvent } from 'react';
import pdfTools from './index';
import { usePdfWorker } from './hooks/usePdfWorker';
import {
  baseName,
  everyPage,
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES,
  moveItem,
  normRotation,
  outputNames,
  pageSizeLabel,
  parseRanges,
  splitName,
} from './features/pdf-tools';
import type { PdfInfo } from './features/pdf-ops';
import type { OutputSpec } from './workers/pdf.protocol';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';
import { Select } from '../../shared/ui/Select';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { Checkbox } from '../../shared/ui/convert';
import { downloadBlob } from '../../shared/utils/dom.utils';
import { formatBytes } from '../../shared/utils/format.utils';

interface EditPage {
  /** Original 0-based page index. */
  index: number;
  /** Extra rotation applied on output. */
  rotate: number;
}

interface PdfFile {
  id: string;
  name: string;
  size: number;
  status: 'opening' | 'ready' | 'error';
  error?: string;
  encrypted?: boolean;
  info?: PdfInfo;
  /** Current page arrangement (order, rotation; deleted pages are gone). */
  pages: EditPage[];
}

type Mode = 'merge' | 'split' | 'pages';
type Busy = { label: string; done: number; total: number } | null;

const count = (n: number, one: string) => `${n.toLocaleString('en-US')} ${n === 1 ? one : `${one}s`}`;
const iconButton =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 pointer-coarse:h-11 pointer-coarse:w-11 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white';
const toolbarButton =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium pointer-coarse:min-h-11 text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800';

let fileSeq = 0;
const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');

function PageTile({
  number,
  original,
  size,
  rotation,
  selected,
  onToggle,
  onMove,
  first,
  last,
  dragProps,
}: {
  number: number;
  original: number;
  size: { width: number; height: number };
  rotation: number;
  selected: boolean;
  onToggle: () => void;
  onMove: (delta: number) => void;
  first: boolean;
  last: boolean;
  dragProps: Record<string, unknown>;
}) {
  const turned = rotation % 180 !== 0;
  const w = turned ? size.height : size.width;
  const h = turned ? size.width : size.height;
  const scale = 88 / Math.max(w, h);
  return (
    <li
      {...dragProps}
      className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl border p-2 ${
        selected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={`Page ${number}${original !== number ? ` (originally ${original})` : ''}, ${pageSizeLabel(w, h)}${rotation ? `, rotated ${rotation}°` : ''}`}
        className="flex h-24 w-full cursor-pointer items-center justify-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <span
          className="relative flex items-center justify-center rounded-sm bg-white text-lg font-semibold text-slate-700 shadow ring-1 ring-slate-300 dark:bg-slate-100 dark:text-slate-800"
          style={{ width: Math.max(24, w * scale), height: Math.max(24, h * scale) }}
        >
          {number}
          {selected && <Icon name="check" className="absolute top-0.5 right-0.5 h-3.5 w-3.5 text-emerald-600" />}
        </span>
      </button>
      <span className="text-center text-xs text-slate-500 dark:text-slate-400">
        {pageSizeLabel(w, h).replace(/ (portrait|landscape)$/, '')}
        {rotation ? ` · ${rotation}°` : ''}
      </span>
      <span className="flex gap-0.5">
        <button type="button" className={iconButton} disabled={first} onClick={() => onMove(-1)} aria-label={`Move page ${number} earlier`}>
          <Icon name="chevron-left" className="h-4 w-4" />
        </button>
        <button type="button" className={iconButton} disabled={last} onClick={() => onMove(1)} aria-label={`Move page ${number} later`}>
          <Icon name="chevron-right" className="h-4 w-4" />
        </button>
      </span>
    </li>
  );
}

export default function PdfToolsPage() {
  const send = usePdfWorker();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [mode, setMode] = useState<Mode>('merge');
  const [removeMetadata, setRemoveMetadata] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragFile, setDragFile] = useState<number | null>(null);
  const [dragPage, setDragPage] = useState<number | null>(null);
  const [splitMode, setSplitMode] = useState<'every' | 'ranges'>('every');
  const [ranges, setRanges] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const input = useRef<HTMLInputElement>(null);
  const depth = useRef(0);

  const ready = files.filter((f) => f.status === 'ready');
  const active = ready.find((f) => f.id === activeId) ?? ready[0];
  const totalPages = ready.reduce((n, f) => n + f.pages.length, 0);

  const update = (id: string, patch: Partial<PdfFile> | ((f: PdfFile) => Partial<PdfFile>)) =>
    setFiles((list) => list.map((f) => (f.id === id ? { ...f, ...(typeof patch === 'function' ? patch(f) : patch) } : f)));

  const addFiles = async (list: FileList | File[]) => {
    setError(null);
    setDone(null);
    const used = files.reduce((n, f) => n + f.size, 0);
    let budget = MAX_TOTAL_BYTES - used;
    const skipped: string[] = [];
    const accepted: { file: File; id: string }[] = [];
    for (const file of Array.from(list)) {
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      if (!isPdf) skipped.push(`${file.name} isn't a PDF.`);
      else if (file.size > MAX_FILE_BYTES) skipped.push(`${file.name} is ${formatBytes(file.size)}; the limit is ${formatBytes(MAX_FILE_BYTES)} per file.`);
      else if (file.size > budget) skipped.push(`${file.name} would take the total over ${formatBytes(MAX_TOTAL_BYTES)}.`);
      else {
        budget -= file.size;
        accepted.push({ file, id: `f${++fileSeq}` });
      }
    }
    if (skipped.length) setError(skipped.join(' '));
    if (!accepted.length) return;
    setFiles((prev) => [...prev, ...accepted.map(({ file, id }) => ({ id, name: file.name, size: file.size, status: 'opening' as const, pages: [] }))]);
    for (const { file, id } of accepted) {
      const bytes = await file.arrayBuffer();
      const res = await send({ type: 'open', fileId: id, bytes }, undefined, [bytes]);
      if (res.type === 'opened') update(id, { status: 'ready', info: res.info, pages: res.info.pages.map((_, index) => ({ index, rotate: 0 })) });
      else if (res.type === 'error') update(id, { status: 'error', error: res.message, encrypted: res.code === 'encrypted' });
    }
  };

  const removeFile = (id: string) => {
    setFiles((list) => list.filter((f) => f.id !== id));
    void send({ type: 'close', fileId: id });
    if (activeId === id) setSelected(new Set());
  };

  const build = async (label: string, outputs: OutputSpec[], zipName: string) => {
    setError(null);
    setDone(null);
    const total = outputs.reduce((n, o) => n + o.pages.length, 0);
    setBusy({ label, done: 0, total });
    const res = await send({ type: 'build', outputs, zipName, removeMetadata }, (d, t) => setBusy({ label, done: d, total: t }));
    setBusy(null);
    if (res.type === 'built') {
      downloadBlob(new Blob([res.bytes as Uint8Array<ArrayBuffer>], { type: res.mime }), res.name);
      setDone(`Saved ${res.name} (${formatBytes(res.bytes.length)}).`);
    } else if (res.type === 'error') setError(res.message);
  };

  const refs = (f: PdfFile, pages = f.pages) => pages.map((p) => ({ file: f.id, index: p.index, rotate: p.rotate }));

  const splitGroups = ((): { groups: number[][] | null; error: string | null } => {
    if (!active) return { groups: null, error: null };
    if (splitMode === 'every') return { groups: everyPage(active.pages.length), error: null };
    if (!ranges.trim()) return { groups: null, error: null };
    try {
      return { groups: parseRanges(ranges, active.pages.length), error: null };
    } catch (err) {
      return { groups: null, error: err instanceof Error ? err.message : String(err) };
    }
  })();

  const runSplit = () => {
    if (!active || !splitGroups.groups) return;
    const base = baseName(active.name);
    const outputs = splitGroups.groups.map((g) => ({ name: splitName(base, g), pages: refs(active, g.map((i) => active.pages[i])) }));
    void build('Splitting', outputs, outputNames.splitZip(base));
  };

  const runMerge = () => {
    const outputs = [{ name: outputNames.merge(ready.map((f) => baseName(f.name))), pages: ready.flatMap((f) => refs(f)) }];
    void build('Merging', outputs, 'merged.zip');
  };

  // Pages mode helpers: selection is by position in the current arrangement.
  const setActive = (id: string) => {
    setActiveId(id);
    setSelected(new Set());
  };
  const editPages = (fn: (pages: EditPage[]) => EditPage[]) => active && update(active.id, (f) => ({ pages: fn(f.pages) }));
  const targets = (): number[] => (selected.size ? [...selected].sort((a, b) => a - b) : active ? active.pages.map((_, i) => i) : []);
  const rotate = (deg: number) => {
    const t = new Set(targets());
    editPages((pages) => pages.map((p, i) => (t.has(i) ? { ...p, rotate: normRotation(p.rotate + deg) } : p)));
  };
  const deleteSelected = () => {
    if (!active || !selected.size) return;
    if (selected.size >= active.pages.length) return setError("A PDF needs at least one page; deselect a page to keep it.");
    editPages((pages) => pages.filter((_, i) => !selected.has(i)));
    setSelected(new Set());
  };
  const movePage = (from: number, to: number) => {
    editPages((pages) => moveItem(pages, from, to));
    setSelected(new Set());
  };
  const extractSelected = () => {
    if (!active || !selected.size) return;
    const positions = [...selected].sort((a, b) => a - b);
    void build('Extracting', [{ name: outputNames.extract(baseName(active.name), positions), pages: refs(active, positions.map((i) => active.pages[i])) }], 'pages.zip');
  };
  const saveEdited = () => active && void build('Saving', [{ name: outputNames.edited(baseName(active.name)), pages: refs(active) }], 'edited.zip');
  const resetPages = () => {
    if (!active?.info) return;
    update(active.id, { pages: active.info.pages.map((_, index) => ({ index, rotate: 0 })) });
    setSelected(new Set());
  };

  const zoneBind = {
    onDragEnter: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      setDragging(true);
    },
    onDragOver: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (!depth.current) setDragging(false);
    },
    onDrop: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setDragging(false);
      void addFiles(e.dataTransfer.files);
    },
  };

  const status = busy
    ? `${busy.label}… ${busy.done} of ${count(busy.total, 'page')}`
    : done
      ? done
      : ready.length
        ? `${count(ready.length, 'PDF')}, ${count(totalPages, 'page')}.`
        : files.some((f) => f.status === 'opening')
          ? 'Opening…'
          : 'Add PDF files to start.';

  const opening = files.some((f) => f.status === 'opening');
  const disabled = !!busy || opening;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={pdfTools} />
      <div className="space-y-3">
        <Headline accent="PDFs">Merge & split </Headline>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">
          Combine PDFs, split them by page or range, extract, delete, reorder and rotate pages. Everything runs in this tab; nothing is uploaded.
        </p>
      </div>
      <StatusStrip status={status} tone={busy || opening ? 'busy' : done ? 'good' : 'neutral'} />

      {busy && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label={busy.label} aria-valuemin={0} aria-valuemax={busy.total} aria-valuenow={busy.done}>
          <div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${busy.total ? (busy.done / busy.total) * 100 : 0}%` }} />
        </div>
      )}

      <section
        aria-label="Add PDFs"
        {...zoneBind}
        className="relative flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center sm:p-8 dark:border-slate-700 dark:bg-slate-900"
      >
        <input
          ref={input}
          type="file"
          multiple
          accept="application/pdf,.pdf"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="file-input"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <Button onClick={() => input.current?.click()} disabled={!!busy}>
          <Icon name="upload" className="h-4 w-4" /> Add PDF files
        </Button>
        <p className="text-sm text-slate-500 dark:text-slate-400">or drop them here · up to {formatBytes(MAX_FILE_BYTES)} each</p>
        {dragging && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-emerald-500 bg-emerald-50/90 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200"
          >
            <Icon name="upload" className="h-5 w-5" /> Drop PDFs to add them
          </div>
        )}
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

      {files.length > 0 && (
        <section aria-label="Files" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="file" className="h-4 w-4" /> Files <span className="normal-case tracking-normal font-normal">(merge order; drag or use the arrows)</span>
            </h2>
            <Checkbox label="Remove metadata (title, author, producer, dates…)" checked={removeMetadata} onChange={setRemoveMetadata} />
          </header>
          <ol className="divide-y divide-slate-100 dark:divide-slate-800" aria-label="PDF files">
            {files.map((f, i) => (
              <li
                key={f.id}
                draggable={!busy}
                onDragStart={(e) => {
                  setDragFile(i);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', f.name);
                }}
                onDragOver={(e) => dragFile !== null && e.preventDefault()}
                onDrop={(e) => {
                  if (dragFile === null) return;
                  e.preventDefault();
                  e.stopPropagation();
                  setFiles((list) => moveItem(list, dragFile, i));
                  setDragFile(null);
                }}
                onDragEnd={() => setDragFile(null)}
                className={`flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 ${dragFile === i ? 'opacity-50' : ''}`}
              >
                <span aria-hidden="true" className="cursor-grab text-slate-400 select-none">
                  ⋮⋮
                </span>
                <span className="w-6 shrink-0 text-right font-mono text-sm text-slate-500">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="break-all font-medium text-slate-900 dark:text-slate-100">{f.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatBytes(f.size)}
                    {f.status === 'ready' && ` · ${count(f.pages.length, 'page')}`}
                    {f.status === 'ready' && f.info && f.pages.length !== f.info.pageCount && ` (of ${f.info.pageCount})`}
                    {f.status === 'opening' && ' · opening…'}
                  </p>
                  {f.status === 'error' && (
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-400">
                      <Badge tone="red">{f.encrypted ? 'Encrypted' : 'Unreadable'}</Badge> <span className="min-w-0">{f.error}</span>
                    </p>
                  )}
                </div>
                <span className="flex items-center gap-0.5">
                  <button type="button" className={iconButton} disabled={i === 0 || !!busy} onClick={() => setFiles((l) => moveItem(l, i, i - 1))} aria-label={`Move ${f.name} up`}>
                    <Icon name="chevron-left" className="h-4 w-4 rotate-90" />
                  </button>
                  <button type="button" className={iconButton} disabled={i === files.length - 1 || !!busy} onClick={() => setFiles((l) => moveItem(l, i, i + 1))} aria-label={`Move ${f.name} down`}>
                    <Icon name="chevron-right" className="h-4 w-4 rotate-90" />
                  </button>
                  <button type="button" className={iconButton} disabled={!!busy} onClick={() => removeFile(f.id)} aria-label={`Remove ${f.name}`}>
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {ready.length > 0 && (
        <section aria-label="Operations" className="space-y-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <Segmented
            label="Operation"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'merge', label: 'Merge' },
              { value: 'split', label: 'Split' },
              { value: 'pages', label: 'Pages' },
            ]}
          />

          {mode !== 'merge' && ready.length > 1 && active && (
            <Select label="File" value={active.id} options={ready.map((f) => ({ value: f.id, label: f.name }))} onChange={setActive} />
          )}

          {mode === 'merge' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Joins {count(ready.length, 'file')} ({count(totalPages, 'page')}) in the order above, with any page edits from the Pages tab.
              </p>
              <Button onClick={runMerge} disabled={disabled || ready.length < 2}>
                <Icon name="layers" className="h-4 w-4" /> Merge into one PDF
              </Button>
              {ready.length < 2 && <p className="text-sm text-slate-500 dark:text-slate-400">Add at least two PDFs to merge.</p>}
            </div>
          )}

          {mode === 'split' && active && (
            <div className="space-y-4">
              <Segmented
                label="Split by"
                value={splitMode}
                onChange={setSplitMode}
                options={[
                  { value: 'every', label: 'Every page' },
                  { value: 'ranges', label: 'Page ranges' },
                ]}
              />
              {splitMode === 'ranges' && (
                <label className="block max-w-md">
                  <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Ranges (one file each)</span>
                  <input
                    value={ranges}
                    onChange={(e) => setRanges(e.target.value)}
                    placeholder="1-3, 5, 8-"
                    aria-invalid={!!splitGroups.error}
                    aria-describedby="range-help"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <span id="range-help" className={`mt-1 block text-sm ${splitGroups.error ? 'text-red-700 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {splitGroups.error ?? `Pages 1–${active.pages.length}. "8-" means page 8 to the end.`}
                  </span>
                </label>
              )}
              {splitGroups.groups && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {count(splitGroups.groups.length, 'file')}:{' '}
                  <span className="break-all font-mono text-xs">
                    {splitGroups.groups
                      .slice(0, 4)
                      .map((g) => splitName(baseName(active.name), g))
                      .join(', ')}
                    {splitGroups.groups.length > 4 ? ', …' : ''}
                  </span>
                  {splitGroups.groups.length > 1 ? ' in a ZIP' : ''}
                </p>
              )}
              <Button onClick={runSplit} disabled={disabled || !splitGroups.groups}>
                <Icon name="grid" className="h-4 w-4" /> {splitGroups.groups && splitGroups.groups.length > 1 ? 'Split to ZIP' : 'Split'}
              </Button>
            </div>
          )}

          {mode === 'pages' && active && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Select pages by clicking them. Rotation applies to the selected pages, or to all pages when none are selected. Drag tiles or use the arrows to reorder.
              </p>
              <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Page actions">
                <button type="button" className={toolbarButton} onClick={() => setSelected(new Set(active.pages.map((_, i) => i)))}>
                  Select all
                </button>
                <button type="button" className={toolbarButton} disabled={!selected.size} onClick={() => setSelected(new Set())}>
                  Clear selection
                </button>
                <button type="button" className={toolbarButton} disabled={disabled} onClick={() => rotate(-90)}>
                  Rotate left
                </button>
                <button type="button" className={toolbarButton} disabled={disabled} onClick={() => rotate(90)}>
                  Rotate right
                </button>
                <button type="button" className={toolbarButton} disabled={disabled} onClick={() => rotate(180)}>
                  Rotate 180°
                </button>
                <button type="button" className={toolbarButton} disabled={disabled || !selected.size} onClick={deleteSelected}>
                  Delete selected
                </button>
                <button type="button" className={toolbarButton} onClick={resetPages} disabled={disabled}>
                  Reset
                </button>
              </div>
              <ol className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3" aria-label={`Pages of ${active.name}`}>
                {active.pages.map((p, i) => {
                  const info = active.info?.pages[p.index] ?? { width: 612, height: 792, rotation: 0 };
                  return (
                    <PageTile
                      key={`${p.index}`}
                      number={i + 1}
                      original={p.index + 1}
                      size={info}
                      rotation={normRotation(info.rotation + p.rotate)}
                      selected={selected.has(i)}
                      first={i === 0}
                      last={i === active.pages.length - 1}
                      onToggle={() =>
                        setSelected((s) => {
                          const n = new Set(s);
                          if (n.has(i)) n.delete(i);
                          else n.add(i);
                          return n;
                        })
                      }
                      onMove={(d) => movePage(i, i + d)}
                      dragProps={{
                        draggable: !busy,
                        onDragStart: (e: DragEvent) => {
                          setDragPage(i);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', String(i + 1));
                        },
                        onDragOver: (e: DragEvent) => dragPage !== null && e.preventDefault(),
                        onDrop: (e: DragEvent) => {
                          if (dragPage === null) return;
                          e.preventDefault();
                          movePage(dragPage, i);
                          setDragPage(null);
                        },
                        onDragEnd: () => setDragPage(null),
                      }}
                    />
                  );
                })}
              </ol>
              <div className="flex flex-wrap gap-3">
                <Button onClick={saveEdited} disabled={disabled}>
                  <Icon name="download" className="h-4 w-4" /> Save edited PDF
                </Button>
                <Button variant="secondary" onClick={extractSelected} disabled={disabled || !selected.size}>
                  Extract {selected.size ? count(selected.size, 'page') : 'selected pages'}
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
