import { useEffect, useState } from 'react';
import imageResizer from './index';
import { DEFAULT_SETTINGS, lockedSide, PRESETS, resizedName, resizeJob, resizeSpec, type ResizeMode, type ResizeSettings } from './features/resize';
import { detectEncodableTypes, isLossy, type FitMode } from '../../shared/lib/image';
import {
  BatchList,
  BatchToolbar,
  FilePickerButton,
  ImageDropZone,
  MetadataNote,
  NumberField,
  RangeField,
  useImageBatch,
  usePageFileIntake,
} from '../../shared/ui/ImageBatch';
import { Checkbox, OptionsCard } from '../../shared/ui/convert';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';

export default function ImageResizerPage() {
  const [s, setS] = useState<ResizeSettings>(DEFAULT_SETTINGS);
  const [encodable, setEncodable] = useState<string[]>(['image/png', 'image/jpeg']);
  useEffect(() => void detectEncodableTypes().then(setEncodable), []);
  const set = (p: Partial<ResizeSettings>) => setS((prev) => ({ ...prev, ...p }));

  const batch = useImageBatch({
    key: JSON.stringify([resizeSpec(s), s.format, s.quality]),
    makeJob: async (file) => resizeJob(file.type, s, await detectEncodableTypes()),
    outputName: (file, type, r) => resizedName(file.name, type, r.width, r.height),
  });
  usePageFileIntake(batch.addFiles);

  // With the lock on, show the other side computed from the first image.
  const first = batch.items.find((i) => i.result)?.result;
  const shownWidth = s.lock && s.driver === 'height' ? (first && s.height ? lockedSide(s.height, first.srcHeight, first.srcWidth) : '') : s.width;
  const shownHeight = s.lock && s.driver === 'width' ? (first && s.width ? lockedSide(s.width, first.srcWidth, first.srcHeight) : '') : s.height;

  const done = batch.items.filter((i) => i.status === 'done').length;
  const status = !batch.items.length
    ? 'Ready when you are. Drop, paste or choose images.'
    : batch.busy
      ? `Resizing… ${done} of ${batch.items.length} done.`
      : `Done. ${done} of ${batch.items.length} resized.`;

  const outType = s.format === 'same' ? null : s.format;
  const formats = [
    { value: 'same' as const, label: 'Same as input' },
    { value: 'image/png' as const, label: 'PNG' },
    { value: 'image/jpeg' as const, label: 'JPEG' },
    ...(encodable.includes('image/webp') ? [{ value: 'image/webp' as const, label: 'WebP' }] : []),
    ...(encodable.includes('image/avif') ? [{ value: 'image/avif' as const, label: 'AVIF' }] : []),
  ];

  return (
    <div className="space-y-8">
      <Breadcrumb tool={imageResizer} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="size">Resize images to any </Headline>
        <FilePickerButton onFiles={batch.addFiles} />
      </div>
      <StatusStrip status={status} tone={batch.busy ? 'busy' : batch.items.length ? 'good' : 'neutral'} />
      {batch.error && <ErrorAlert message={batch.error} onDismiss={batch.dismissError} />}

      <section aria-label="Resize settings" className="space-y-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented<ResizeMode>
            label="Resize by"
            options={[
              { value: 'pixels', label: 'Pixels' },
              { value: 'percent', label: 'Percentage' },
              { value: 'box', label: 'Fit to a box' },
            ]}
            value={s.mode}
            onChange={(mode) => set({ mode })}
          />
          <Select
            label="Preset"
            placeholder="Choose…"
            options={PRESETS.map((p, i) => ({ value: i, label: `${p.label} · ${p.width}×${p.height}` }))}
            onChange={(i) => set({ mode: 'box', boxWidth: PRESETS[i].width, boxHeight: PRESETS[i].height })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {s.mode === 'pixels' && (
            <>
              <NumberField label="Width" value={shownWidth} placeholder="auto" onChange={(v) => set({ width: v || '', driver: 'width' })} />
              <NumberField label="Height" value={shownHeight} placeholder="auto" onChange={(v) => set({ height: v || '', driver: 'height' })} />
              <Checkbox
                label="Lock aspect ratio"
                checked={s.lock}
                onChange={(lock) => set(lock ? { lock } : { lock, width: shownWidth || '', height: shownHeight || '' })}
              />
            </>
          )}
          {s.mode === 'percent' && <RangeField label="Scale" min={1} max={200} suffix="%" value={s.percent} onChange={(percent) => set({ percent })} />}
          {s.mode === 'box' && (
            <>
              <NumberField label="Width" value={s.boxWidth} onChange={(v) => set({ boxWidth: v || 1 })} />
              <NumberField label="Height" value={s.boxHeight} onChange={(v) => set({ boxHeight: v || 1 })} />
              <Segmented<FitMode>
                label="Fit"
                options={[
                  { value: 'contain', label: 'Fit inside' },
                  { value: 'cover', label: 'Cover (crop)' },
                  { value: 'fill', label: 'Stretch' },
                ]}
                value={s.fit}
                onChange={(fit) => set({ fit })}
              />
            </>
          )}
        </div>
      </section>

      <OptionsCard label="Output settings">
        <Select label="Format" options={formats} value={s.format} onChange={(format) => set({ format })} />
        <RangeField label="Quality" min={1} max={100} value={s.quality} disabled={outType ? !isLossy(outType) : false} onChange={(quality) => set({ quality })} />
      </OptionsCard>

      {batch.items.length === 0 ? (
        <ImageDropZone onFiles={batch.addFiles} hint="JPEG, PNG, WebP and more · many at once · up to 50 MB each · or paste" />
      ) : (
        <div className="space-y-4">
          <BatchToolbar items={batch.items} zipName="resized-images.zip" onClear={batch.clear} onAdd={batch.addFiles} />
          <BatchList items={batch.items} onRemove={batch.remove} />
        </div>
      )}

      <MetadataNote />
      <Panel eyebrow="How it works" icon="info">
        <ul className="list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
          <li>
            <strong>Pixels</strong> sets an exact width and/or height; with the lock on, the other side follows each image&rsquo;s own aspect ratio.
          </li>
          <li>
            <strong>Fit inside</strong> scales the image to fit the box, <strong>Cover</strong> fills the box and crops the centre, <strong>Stretch</strong> ignores the
            aspect ratio.
          </li>
          <li>Downscaling uses the browser&rsquo;s high-quality resampler (or repeated halving) so edges stay smooth instead of jagged.</li>
          <li>&ldquo;Same as input&rdquo; keeps PNG, JPEG, WebP and AVIF; formats a browser can&rsquo;t write (GIF, BMP, ICO) become PNG. Your images never leave your device.</li>
        </ul>
      </Panel>
    </div>
  );
}
