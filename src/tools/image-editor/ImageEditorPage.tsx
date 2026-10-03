import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import imageEditor from './index';
import { CropOverlay } from './CropOverlay';
import { clampRect, fitAspect } from './features/crop';
import { createHistory, pushState, redo, undo, type History } from './features/history';
import {
  ASPECTS,
  finalSize,
  flipCrop,
  INITIAL_STATE,
  isUnedited,
  lockedSide,
  orientedSize,
  rotateCrop,
  turnedRotate,
  type Adjust,
  type AspectId,
  type EditState,
  type Rect,
} from './features/image-editor';
import { EditorClient } from './features/editorClient';
import { detectEncodableTypes, isLossy, MIME_LABEL, renameFile } from '../../shared/lib/image';
import { downloadBlob } from '../../shared/lib/imageClient';
import { FilePickerButton, ImageDropZone, MetadataNote, NumberField, RangeField } from '../../shared/ui/ImageBatch';
import { usePageFileIntake } from '../../shared/hooks/useImageBatch';
import { Checkbox } from '../../shared/ui/convert';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';

type Tab = 'crop' | 'transform' | 'adjust' | 'effects';
const PREVIEW_SIDE = 1400;

const ADJUSTMENTS: { key: keyof Adjust; label: string }[] = [
  { key: 'exposure', label: 'Exposure' },
  { key: 'brightness', label: 'Brightness' },
  { key: 'contrast', label: 'Contrast' },
  { key: 'saturation', label: 'Saturation' },
  { key: 'vibrance', label: 'Vibrance' },
  { key: 'temperature', label: 'Temperature' },
  { key: 'tint', label: 'Tint' },
];

const message = (e: unknown) => (e instanceof Error ? e.message : 'This image could not be edited.');

export default function ImageEditorPage() {
  const client = useRef<EditorClient | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const gen = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [history, setHistory] = useState<History<EditState>>(() => createHistory(INITIAL_STATE));
  const [tab, setTab] = useState<Tab>('crop');
  const [aspect, setAspect] = useState<AspectId>('free');
  const [swap, setSwap] = useState(false);
  const [lock, setLock] = useState(true);
  const [showBefore, setShowBefore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [encodable, setEncodable] = useState<string[]>(['image/png', 'image/jpeg']);
  const [type, setType] = useState('image/png');
  const [quality, setQuality] = useState(90);

  useEffect(() => void detectEncodableTypes().then(setEncodable), []);
  useEffect(() => {
    client.current = new EditorClient();
    return () => client.current?.dispose();
  }, []);

  const state = history.present;
  const commit = useCallback((next: EditState, group: string | null = null) => setHistory((h) => pushState(h, next, group)), []);

  const oriented = size ? orientedSize(size.width, size.height, state.rotate, state.angle) : null;
  const out = size ? finalSize(size.width, size.height, state) : null;
  const cropping = tab === 'crop' && !showBefore;
  const previewState = useMemo<EditState>(
    () => (showBefore ? INITIAL_STATE : cropping ? { ...state, crop: null, resize: null } : state),
    [showBefore, cropping, state],
  );
  const ratioBase = ASPECTS.find((a) => a.value === aspect)!.ratio;
  const ratio = ratioBase === null ? null : swap ? 1 / ratioBase : ratioBase;

  const load = (files: File[]) => {
    const f = files.find((x) => x.type.startsWith('image/') || /\.(avif|heic|heif|ico|svg|bmp|webp)$/i.test(x.name));
    if (!f) {
      if (files.length) setError("That doesn't look like an image file.");
      return;
    }
    setError(null);
    setBusy(true);
    client.current!.load(f).then(
      (s) => {
        setFile(f);
        setSize(s);
        setHistory(createHistory(INITIAL_STATE));
        setAspect('free');
        setShowBefore(false);
        setNotice('');
        setType(f.type === 'image/jpeg' ? 'image/jpeg' : 'image/png');
        setBusy(false);
      },
      (e) => {
        setError(message(e));
        setBusy(false);
      },
    );
  };
  usePageFileIntake(load);

  // Draw the preview. Newer requests replace older ones, and stale results are dropped.
  useEffect(() => {
    if (!size || !file) return;
    const g = ++gen.current;
    client.current!
      .preview(previewState, PREVIEW_SIDE)
      .then((bitmap) => {
        if (!bitmap) return;
        const c = canvas.current;
        if (g !== gen.current || !c) return bitmap.close();
        c.width = bitmap.width;
        c.height = bitmap.height;
        c.getContext('2d')!.drawImage(bitmap, 0, 0);
        bitmap.close();
      })
      .catch((e) => g === gen.current && setError(message(e)));
  }, [previewState, size, file]);

  // Ctrl/⌘+Z and Ctrl/⌘+Shift+Z (or Y).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const t = e.target as HTMLElement;
      if (t instanceof HTMLInputElement && t.type !== 'range') return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) setHistory(undo);
      else if ((k === 'z' && e.shiftKey) || k === 'y') setHistory(redo);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ------------------------------------------------------------ edits */

  const setAdjust = (patch: Partial<Adjust>, group: string) => commit({ ...state, adjust: { ...state.adjust, ...patch } }, group);

  const rotateBy = (dir: 'cw' | 'ccw') => {
    if (!oriented) return;
    const crop = state.crop && state.angle === 0 ? rotateCrop(state.crop, oriented.width, oriented.height, dir) : null;
    commit({ ...state, rotate: turnedRotate(state, dir), crop, resize: state.resize && { width: state.resize.height, height: state.resize.width } });
  };
  const flip = (axis: 'h' | 'v') => {
    if (!oriented) return;
    const crop = state.crop && state.angle === 0 ? flipCrop(state.crop, oriented.width, oriented.height, axis) : null;
    commit({ ...state, flipH: axis === 'h' ? !state.flipH : state.flipH, flipV: axis === 'v' ? !state.flipV : state.flipV, crop });
  };
  const straighten = (angle: number) => commit({ ...state, angle, crop: null, resize: null }, 'angle');

  const cropRect: Rect | null = oriented ? (state.crop ?? { x: 0, y: 0, w: oriented.width, h: oriented.height }) : null;
  const setCrop = (r: Rect, group: string) => {
    if (!oriented) return;
    const full = r.x === 0 && r.y === 0 && r.w === oriented.width && r.h === oriented.height;
    commit({ ...state, crop: full ? null : r, resize: null }, group);
  };
  const pickAspect = (id: AspectId) => {
    setAspect(id);
    setSwap(false);
    const r = ASPECTS.find((a) => a.value === id)!.ratio;
    if (r !== null && oriented && cropRect) setCrop(fitAspect(cropRect, r, oriented.width, oriented.height), 'crop-aspect');
  };
  const swapAspect = () => {
    if (!oriented || !cropRect || ratioBase === null) return;
    setSwap(!swap);
    setCrop(fitAspect(cropRect, swap ? ratioBase : 1 / ratioBase, oriented.width, oriented.height), 'crop-aspect');
  };
  const cropField = (k: keyof Rect) => (v: number | '') => {
    if (v === '' || !oriented || !cropRect) return;
    let next = { ...cropRect, [k]: v };
    if (ratio !== null && k === 'w') next = { ...next, h: Math.round(v / ratio) };
    if (ratio !== null && k === 'h') next = { ...next, w: Math.round(v * ratio) };
    setCrop(clampRect(next, oriented.width, oriented.height), `crop-${k}`);
  };

  const base = size ? finalSize(size.width, size.height, { ...state, resize: null }) : null;
  const shown = state.resize ?? base;
  const setResize = (side: 'width' | 'height', v: number | '') => {
    if (v === '' || !base) return;
    const n = Math.max(1, Math.min(16384, v));
    const other = lock ? lockedSide(n, side === 'width' ? base.width : base.height, side === 'width' ? base.height : base.width) : (state.resize ?? base)[side === 'width' ? 'height' : 'width'];
    commit({ ...state, resize: side === 'width' ? { width: n, height: other } : { width: other, height: n } }, `resize-${side}`);
  };

  const download = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const r = await client.current!.export(state, type, quality / 100);
      downloadBlob(r.blob, renameFile(file.name, type, '-edited'));
      setNotice(`Saved ${r.width} × ${r.height} ${MIME_LABEL[type] ?? ''} (${(r.blob.size / 1024).toFixed(r.blob.size < 10240 ? 1 : 0)} KB).`);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };

  const formats = [
    { value: 'image/png', label: 'PNG' },
    { value: 'image/jpeg', label: 'JPEG' },
    ...(encodable.includes('image/webp') ? [{ value: 'image/webp', label: 'WebP' }] : []),
  ];
  const edited = !isUnedited(state);
  const status = !file
    ? busy
      ? 'Opening the image…'
      : 'Ready when you are. Drop, paste or choose an image.'
    : busy
      ? 'Working…'
      : notice || `${size!.width} × ${size!.height} → ${out!.width} × ${out!.height} px${edited ? '' : ' (no edits yet)'}`;

  const tabs: { value: Tab; label: string }[] = [
    { value: 'crop', label: 'Crop' },
    { value: 'transform', label: 'Rotate & resize' },
    { value: 'adjust', label: 'Adjust' },
    { value: 'effects', label: 'Effects' },
  ];

  return (
    <div className="space-y-8">
      <Breadcrumb tool={imageEditor} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="image">Edit an </Headline>
        <FilePickerButton onFiles={load} multiple={false} label={file ? 'Open another image' : 'Choose an image'} />
      </div>
      <StatusStrip status={status} tone={busy ? 'busy' : file ? 'good' : 'neutral'} />
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {!file || !size || !oriented || !out || !cropRect ? (
        <ImageDropZone onFiles={load} multiple={false} hint="JPEG, PNG, WebP and more · up to 50 MB · or paste an image" />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <section aria-label="Preview" className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => setHistory(undo)} disabled={!history.past.length} aria-label="Undo">
                <Icon name="arrow" className="h-4 w-4 rotate-180" /> Undo
              </Button>
              <Button variant="secondary" onClick={() => setHistory(redo)} disabled={!history.future.length} aria-label="Redo">
                Redo <Icon name="arrow" className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => commit(INITIAL_STATE)} disabled={!edited}>
                Reset all
              </Button>
              <Button variant={showBefore ? 'primary' : 'secondary'} aria-pressed={showBefore} onClick={() => setShowBefore((v) => !v)}>
                <Icon name="diff" className="h-4 w-4" /> {showBefore ? 'Showing original' : 'Show original'}
              </Button>
            </div>
            <div className="checkerboard flex justify-center overflow-hidden rounded-3xl border border-slate-200 p-2 dark:border-slate-800">
              <div className="relative w-fit max-w-full">
                <canvas
                  ref={canvas}
                  role="img"
                  aria-label={showBefore ? 'Original image' : 'Edited image preview'}
                  className="block h-auto max-h-[70vh] w-auto max-w-full"
                />
                {cropping && <CropOverlay width={oriented.width} height={oriented.height} rect={cropRect} ratio={ratio} onChange={setCrop} />}
              </div>
            </div>
          </section>

          <div className="min-w-0 space-y-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <Segmented<Tab> label="Editing tool" options={tabs} value={tab} onChange={setTab} />

            {tab === 'crop' && (
              <section aria-label="Crop" className="space-y-4">
                <Segmented<AspectId> label="Aspect ratio" options={ASPECTS.map((a) => ({ value: a.value, label: a.label }))} value={aspect} onChange={pickAspect} />
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="secondary" onClick={swapAspect} disabled={ratioBase === null || ratioBase === 1}>
                    Swap orientation
                  </Button>
                  <Button variant="ghost" onClick={() => commit({ ...state, crop: null, resize: null })} disabled={!state.crop}>
                    Clear crop
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <NumberField label="X" min={0} max={oriented.width} width="w-20" value={cropRect.x} onChange={cropField('x')} />
                  <NumberField label="Y" min={0} max={oriented.height} width="w-20" value={cropRect.y} onChange={cropField('y')} />
                  <NumberField label="Width" max={oriented.width} width="w-20" value={cropRect.w} onChange={cropField('w')} />
                  <NumberField label="Height" max={oriented.height} width="w-20" value={cropRect.h} onChange={cropField('h')} />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Drag the box or its handles, or focus them and use the arrow keys (Shift moves 10 pixels).
                </p>
              </section>
            )}

            {tab === 'transform' && (
              <section aria-label="Rotate and resize" className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => rotateBy('ccw')}>
                    Rotate left
                  </Button>
                  <Button variant="secondary" onClick={() => rotateBy('cw')}>
                    Rotate right
                  </Button>
                  <Button variant="secondary" aria-pressed={state.flipH} onClick={() => flip('h')}>
                    Flip horizontal
                  </Button>
                  <Button variant="secondary" aria-pressed={state.flipV} onClick={() => flip('v')}>
                    Flip vertical
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <RangeField label="Straighten" min={-45} max={45} suffix="°" value={Math.round(state.angle)} onChange={straighten} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Straightening or rotating by an angle clears the crop; the canvas grows to hold the turned image.</p>
                <div className="flex flex-wrap items-center gap-3">
                  <NumberField label="Width" value={shown!.width} onChange={(v) => setResize('width', v)} />
                  <NumberField label="Height" value={shown!.height} onChange={(v) => setResize('height', v)} />
                  <Checkbox label="Lock aspect ratio" checked={lock} onChange={setLock} />
                  <Button variant="ghost" disabled={!state.resize} onClick={() => commit({ ...state, resize: null })}>
                    Reset size
                  </Button>
                </div>
              </section>
            )}

            {tab === 'adjust' && (
              <section aria-label="Adjust" className="space-y-1">
                {ADJUSTMENTS.map(({ key, label }) => (
                  <RangeField key={key} label={label} min={-100} max={100} value={state.adjust[key] as number} onChange={(v) => setAdjust({ [key]: v }, `adj-${key}`)} />
                ))}
                <Button
                  variant="ghost"
                  disabled={ADJUSTMENTS.every(({ key }) => state.adjust[key] === 0)}
                  onClick={() => setAdjust(Object.fromEntries(ADJUSTMENTS.map(({ key }) => [key, 0])), 'adj-reset')}
                >
                  Reset adjustments
                </Button>
              </section>
            )}

            {tab === 'effects' && (
              <section aria-label="Effects" className="space-y-3">
                <RangeField label="Sharpen" min={0} max={100} value={state.adjust.sharpen} onChange={(v) => setAdjust({ sharpen: v }, 'adj-sharpen')} />
                <RangeField label="Blur" min={0} max={10} suffix=" px" value={state.adjust.blur} onChange={(v) => setAdjust({ blur: v }, 'adj-blur')} />
                <Segmented<'0' | '1' | '2'>
                  label="Denoise"
                  options={[
                    { value: '0', label: 'Off' },
                    { value: '1', label: 'Light' },
                    { value: '2', label: 'Strong' },
                  ]}
                  value={String(state.adjust.denoise) as '0' | '1' | '2'}
                  onChange={(v) => setAdjust({ denoise: Number(v) as 0 | 1 | 2 }, 'adj-denoise')}
                />
                <RangeField label="Sepia" min={0} max={100} value={state.adjust.sepia} onChange={(v) => setAdjust({ sepia: v }, 'adj-sepia')} />
                <Checkbox label="Black and white" checked={state.adjust.grayscale} onChange={(v) => setAdjust({ grayscale: v }, 'adj-gray')} />
                <Button
                  variant="ghost"
                  disabled={!(state.adjust.sharpen || state.adjust.blur || state.adjust.denoise || state.adjust.sepia || state.adjust.grayscale)}
                  onClick={() => setAdjust({ sharpen: 0, blur: 0, denoise: 0, sepia: 0, grayscale: false }, 'adj-reset-fx')}
                >
                  Reset effects
                </Button>
              </section>
            )}

            <section aria-label="Export" className="space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
              <h2 className="eyebrow text-slate-600 dark:text-slate-400">Export</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <Select label="Format" options={formats} value={type} onChange={setType} />
                <RangeField label="Quality" min={1} max={100} value={quality} disabled={!isLossy(type)} onChange={setQuality} />
              </div>
              <Button onClick={download} disabled={busy} className="w-full justify-center">
                <Icon name="download" className="h-4 w-4" /> Download {out.width} × {out.height} {MIME_LABEL[type]}
              </Button>
            </section>
          </div>
        </div>
      )}

      <MetadataNote />
      <Panel eyebrow="How it works" icon="info">
        <ul className="list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
          <li>Your original is never changed. Each edit is a setting applied to it in a fixed order: rotate, flip and straighten, then crop, resize and finally colour and detail.</li>
          <li>Undo and redo step through your edits (Ctrl/⌘+Z, Ctrl/⌘+Shift+Z). <strong>Show original</strong> toggles the unedited picture.</li>
          <li>The preview is a reduced copy; export re-renders from the full-size original. Pixel work runs in a background worker when the browser supports it.</li>
          <li>Exporting writes a new file without EXIF or GPS metadata. Your image never leaves your device.</li>
        </ul>
      </Panel>
    </div>
  );
}
