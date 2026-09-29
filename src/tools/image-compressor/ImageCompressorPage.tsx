import { useEffect, useState } from 'react';
import imageCompressor from './index';
import { compressedName, compressJob, DEFAULT_SETTINGS, pickOutput, type CompressFormat, type CompressSettings } from './features/compress';
import { detectEncodableTypes, MIME_LABEL } from '../../shared/lib/image';
import { BatchList, BatchToolbar, CompareView, FilePickerButton, ImageDropZone, MetadataNote, NumberField, RangeField } from '../../shared/ui/ImageBatch';
import { useImageBatch, useObjectUrl, usePageFileIntake } from '../../shared/hooks/useImageBatch';
import { Checkbox, OptionsCard } from '../../shared/ui/convert';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb } from '../../shared/ui/tool';
import { formatBytes } from '../../shared/utils/format.utils';

export default function ImageCompressorPage() {
  const [settings, setSettings] = useState<CompressSettings>(DEFAULT_SETTINGS);
  const [keepOriginal, setKeepOriginal] = useState(true);
  const [encodable, setEncodable] = useState<string[]>(['image/png', 'image/jpeg']);
  const [selectedId, setSelectedId] = useState<number>();
  useEffect(() => void detectEncodableTypes().then(setEncodable), []);

  const set = <K extends keyof CompressSettings>(k: K, v: CompressSettings[K]) => setSettings((s) => ({ ...s, [k]: v }));
  const batch = useImageBatch({
    key: JSON.stringify(settings),
    makeJob: async (file) => compressJob(file.type, settings, await detectEncodableTypes()),
    outputName: (file, type) => compressedName(file.name, type),
  });
  usePageFileIntake(batch.addFiles);

  const done = batch.items.filter((i) => i.result && i.status === 'done');
  const selected = done.find((i) => i.id === selectedId) ?? done[0];
  const beforeUrl = useObjectUrl(selected?.file);

  const choice = (item: (typeof done)[number]) =>
    pickOutput(
      item.file,
      { size: item.result!.blob.size, type: item.result!.type, name: item.result!.name, resized: item.result!.width !== item.result!.srcWidth },
      keepOriginal,
    );
  const zipFiles = done.map((i) => (choice(i) === 'original' ? { name: i.file.name, blob: i.file as Blob } : { name: i.result!.name, blob: i.result!.blob }));

  const saved = done.reduce((s, i) => s + i.file.size, 0) - zipFiles.reduce((s, f) => s + f.blob.size, 0);
  const status = !batch.items.length
    ? 'Ready when you are. Drop, paste or choose images.'
    : batch.busy
      ? `Compressing… ${done.length} of ${batch.items.length} done.`
      : saved > 0
        ? `Done. You saved ${formatBytes(saved)}.`
        : 'Done. These images were already well compressed.';

  const formats: { value: CompressFormat; label: string }[] = [
    { value: 'auto', label: 'Auto (keep JPEG/WebP)' },
    { value: 'image/jpeg', label: 'JPEG' },
    ...(encodable.includes('image/webp') ? [{ value: 'image/webp' as const, label: 'WebP' }] : []),
    ...(encodable.includes('image/avif') ? [{ value: 'image/avif' as const, label: 'AVIF' }] : []),
  ];

  return (
    <div className="space-y-8">
      <Breadcrumb tool={imageCompressor} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="lighter">Make your images </Headline>
        <FilePickerButton onFiles={batch.addFiles} />
      </div>
      <StatusStrip status={status} tone={batch.busy ? 'busy' : batch.items.length ? 'good' : 'neutral'} />
      {batch.error && <ErrorAlert message={batch.error} onDismiss={batch.dismissError} />}

      <OptionsCard label="Compression settings">
        <Select label="Format" options={formats} value={settings.format} onChange={(v) => set('format', v)} />
        <RangeField label="Quality" min={1} max={100} value={settings.quality} onChange={(v) => set('quality', v)} />
        <div className="flex flex-wrap items-center gap-3">
          <NumberField label="Max width" value={settings.maxWidth} placeholder="any" onChange={(v) => set('maxWidth', v || '')} />
          <NumberField label="Max height" value={settings.maxHeight} placeholder="any" onChange={(v) => set('maxHeight', v || '')} />
        </div>
        <Checkbox label="Keep the original if compressing makes it bigger" checked={keepOriginal} onChange={setKeepOriginal} />
        {!encodable.includes('image/avif') && <p className="w-full text-xs text-slate-500 dark:text-slate-400">AVIF isn&rsquo;t offered because this browser can&rsquo;t encode it.</p>}
      </OptionsCard>

      {batch.items.length === 0 ? (
        <ImageDropZone onFiles={batch.addFiles} hint="JPEG, PNG, WebP, AVIF and more · many at once · up to 50 MB each · or paste" />
      ) : (
        <div className="space-y-4">
          <BatchToolbar items={batch.items} files={zipFiles} zipName="compressed-images.zip" onClear={batch.clear} onAdd={batch.addFiles} />
          <BatchList
            items={batch.items}
            onRemove={batch.remove}
            selectedId={selected?.id}
            onSelect={setSelectedId}
            extra={(item) =>
              item.result && item.status === 'done' && choice(item) === 'original' ? (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Already smaller than this setting produces; the ZIP keeps the original.</p>
              ) : null
            }
          />
          {selected?.result && beforeUrl && (
            <CompareView
              beforeUrl={beforeUrl}
              afterUrl={selected.result.url}
              beforeLabel={`Original ${selected.file.name}`}
              afterLabel={`Compressed ${selected.result.name} (${MIME_LABEL[selected.result.type] ?? ''}, ${formatBytes(selected.result.blob.size)})`}
            />
          )}
        </div>
      )}

      <MetadataNote />
      <Panel eyebrow="How it works" icon="info">
        <ul className="list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
          <li>Each image is decoded, optionally scaled down to fit the max width and height, and re-encoded by your browser at the quality you choose.</li>
          <li>Quality 70–80 is usually indistinguishable from the original for photos. WebP and AVIF are typically 25–50% smaller than JPEG at the same quality.</li>
          <li>PNG is lossless, so &ldquo;Auto&rdquo; converts PNG, GIF and BMP to WebP. Pick JPEG for the widest compatibility.</li>
          <li>Everything happens on your device. Your images are never uploaded.</li>
        </ul>
      </Panel>
    </div>
  );
}
