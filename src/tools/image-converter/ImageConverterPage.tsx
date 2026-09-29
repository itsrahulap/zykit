import { useEffect, useState } from 'react';
import imageConverter from './index';
import { convertedName, convertJob, DEFAULT_SETTINGS, READABLE, type ConvertSettings, type OutputFormat } from './features/convert';
import { detectEncodableTypes, isLossy, MIME_EXT, MIME_LABEL, supportsAlpha } from '../../shared/lib/image';
import { BatchList, BatchToolbar, FilePickerButton, ImageDropZone, MetadataNote, RangeField } from '../../shared/ui/ImageBatch';
import { useImageBatch, usePageFileIntake } from '../../shared/hooks/useImageBatch';
import { Checkbox, OptionsCard } from '../../shared/ui/convert';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';

const ACCEPT = 'image/*,.heic,.heif,.avif,.ico,.cur,.bmp,.svg,.jxl';

export default function ImageConverterPage() {
  const [s, setS] = useState<ConvertSettings>(DEFAULT_SETTINGS);
  const [encodable, setEncodable] = useState<string[]>(['image/png', 'image/jpeg']);
  useEffect(() => void detectEncodableTypes().then(setEncodable), []);
  const set = (p: Partial<ConvertSettings>) => setS((prev) => ({ ...prev, ...p }));

  const job = convertJob(s);
  const batch = useImageBatch({ key: JSON.stringify(job), makeJob: () => convertJob(s), outputName: (file, type) => convertedName(file.name, type) });
  usePageFileIntake(batch.addFiles);

  const done = batch.items.filter((i) => i.status === 'done').length;
  const label = MIME_LABEL[s.format];
  const status = !batch.items.length
    ? 'Ready when you are. Drop, paste or choose images.'
    : batch.busy
      ? `Converting to ${label}… ${done} of ${batch.items.length} done.`
      : `Done. ${done} of ${batch.items.length} converted to ${label}.`;

  const formats = (['image/png', 'image/jpeg', 'image/webp', 'image/avif'] as OutputFormat[])
    .filter((f) => encodable.includes(f))
    .map((f) => ({ value: f, label: MIME_LABEL[f] }));

  return (
    <div className="space-y-8">
      <Breadcrumb tool={imageConverter} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="format">Convert images to any </Headline>
        <FilePickerButton onFiles={batch.addFiles} accept={ACCEPT} />
      </div>
      <StatusStrip status={status} tone={batch.busy ? 'busy' : batch.items.length ? 'good' : 'neutral'} />
      {batch.error && <ErrorAlert message={batch.error} onDismiss={batch.dismissError} />}

      <OptionsCard label="Conversion settings">
        <Segmented<OutputFormat> label="Convert to" options={formats} value={s.format} onChange={(format) => set({ format })} />
        <RangeField label="Quality" min={1} max={100} value={s.quality} disabled={!isLossy(s.format)} onChange={(quality) => set({ quality })} />
        <label className={`inline-flex items-center gap-2 text-sm text-slate-600 pointer-coarse:min-h-11 dark:text-slate-400 ${job.background ? '' : 'opacity-60'}`}>
          Background
          <input
            type="color"
            value={s.background}
            onChange={(e) => set({ background: e.target.value })}
            className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        {supportsAlpha(s.format) && <Checkbox label="Fill transparent areas with the background" checked={s.flatten} onChange={(flatten) => set({ flatten })} />}
        <p className="w-full text-xs text-slate-500 dark:text-slate-400">
          {s.format === 'image/jpeg' ? 'JPEG has no transparency, so transparent pixels are filled with the background colour. ' : ''}
          This browser can write {formats.map((f) => f.label).join(', ')}
          {encodable.includes('image/avif') ? '' : ' (not AVIF)'}.
        </p>
      </OptionsCard>

      {batch.items.length === 0 ? (
        <ImageDropZone onFiles={batch.addFiles} accept={ACCEPT} hint="Many at once · up to 50 MB each · or paste" />
      ) : (
        <div className="space-y-4">
          <BatchToolbar items={batch.items} zipName={`converted-${MIME_EXT[s.format]}.zip`} onClear={batch.clear} onAdd={batch.addFiles} />
          <BatchList items={batch.items} onRemove={batch.remove} />
        </div>
      )}

      <MetadataNote />
      <Panel eyebrow="Supported formats" icon="info">
        <ul className="list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
          <li>
            <strong>Reads</strong> {READABLE}. If this browser can&rsquo;t decode a file, it&rsquo;s flagged in the list. Safari opens HEIC photos from iPhones;
            Chrome and Firefox don&rsquo;t.
          </li>
          <li>
            <strong>Writes</strong> whatever your browser&rsquo;s encoder supports: PNG and JPEG everywhere, WebP in most browsers, AVIF in recent Chrome and Firefox.
          </li>
          <li>Animated GIFs and WebPs are converted from their first frame. Colours are converted to sRGB.</li>
          <li>Conversion happens on your device. Nothing is uploaded.</li>
        </ul>
      </Panel>
    </div>
  );
}

