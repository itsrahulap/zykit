import { useMemo, useState } from 'react';
import imageBase64 from './index';
import { decodeInput, downloadName, encodeImage, MAX_ENCODE_BYTES, snippet, type Encoded, type SnippetKind } from './features/base64-image';
import { Base64Error } from '../../shared/lib/base64';
import { sniffImageType } from '../../shared/lib/image';
import { FilePickerButton, ImageDropZone } from '../../shared/ui/ImageBatch';
import { useObjectUrl, usePageFileIntake } from '../../shared/hooks/useImageBatch';
import { downloadBlob } from '../../shared/lib/imageClient';
import { MAX_PREVIEW_CHARS, Notices } from '../../shared/ui/convert';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Tabs } from '../../shared/ui/Tabs';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { downloadText } from '../../shared/utils/dom.utils';
import { formatBytes, formatDimensions } from '../../shared/utils/format.utils';

type Direction = 'encode' | 'decode';

function Preview({ url, alt }: { url: string; alt: string }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  return (
    <figure className="space-y-2">
      <div className="checkerboard flex min-h-40 items-center justify-center overflow-hidden rounded-2xl p-4">
        <img src={url} alt={alt} onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} className="block max-h-80 w-auto max-w-full object-contain" />
      </div>
      {size && <figcaption className="text-center text-xs text-slate-500 dark:text-slate-400">{formatDimensions(size.w, size.h)} px</figcaption>}
    </figure>
  );
}

function EncodePanel() {
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array; mime: string; label: string } | null>(null);
  const [encoded, setEncoded] = useState<Encoded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<SnippetKind>('data-uri');
  const blob = useMemo(() => (file ? new Blob([file.bytes as BlobPart], { type: file.mime }) : null), [file]);
  const url = useObjectUrl(blob);

  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError(null);
    if (f.size > MAX_ENCODE_BYTES) {
      setError(`This file is ${formatBytes(f.size)}. Images up to ${formatBytes(MAX_ENCODE_BYTES)} can be encoded.`);
      return;
    }
    const bytes = new Uint8Array(await f.arrayBuffer());
    const type = sniffImageType(bytes);
    if (!type) {
      setError(`${f.name} doesn't look like an image (PNG, JPEG, GIF, WebP, AVIF, SVG, ICO, BMP…).`);
      return;
    }
    try {
      setEncoded(encodeImage(bytes, type.mime));
      setFile({ name: f.name, bytes, mime: type.mime, label: type.label });
    } catch (e) {
      setError(e instanceof Base64Error ? e.message : 'Could not encode this file.');
    }
  };
  usePageFileIntake(onFiles);

  const text = encoded && file ? snippet(kind, encoded, file.name.replace(/\.[^.]+$/, '')) : '';
  const preview = text.length > MAX_PREVIEW_CHARS ? `${text.slice(0, MAX_PREVIEW_CHARS)}…` : text;

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
      {!file || !encoded || !url ? (
        <ImageDropZone onFiles={onFiles} multiple={false} hint={`Any image up to ${formatBytes(MAX_ENCODE_BYTES)} · or paste`} />
      ) : (
        <>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Panel eyebrow="Image" icon="image">
              <Preview url={url} alt={`Preview of ${file.name}`} />
              <div className="mt-4">
                <DetailRows
                  rows={[
                    ['File', <span key="name" className="break-all">{file.name}</span>],
                    ['Type', file.label],
                    ['Image size', formatBytes(file.bytes.length)],
                    ['Base64 size', formatBytes(encoded.base64.length)],
                    ['Overhead', `+${(encoded.overhead * 100).toFixed(1)}%`],
                  ]}
                />
              </div>
              <div className="mt-4">
                <FilePickerButton onFiles={onFiles} multiple={false} label="Choose another" variant="secondary" />
              </div>
            </Panel>
            <section aria-label="Output" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
                <Segmented<SnippetKind>
                  label="Output as"
                  options={[
                    { value: 'data-uri', label: 'Data URI' },
                    { value: 'base64', label: 'Base64' },
                    { value: 'css', label: 'CSS' },
                    { value: 'html', label: 'HTML' },
                  ]}
                  value={kind}
                  onChange={setKind}
                />
                <div className="flex flex-wrap items-center gap-1">
                  <CopyButton text={text} />
                  <button
                    type="button"
                    onClick={() => downloadText(text, `${file.name.replace(/\.[^.]+$/, '') || 'image'}.${kind === 'css' ? 'css' : kind === 'html' ? 'html' : 'txt'}`, 'text/plain')}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 pointer-coarse:min-h-11 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Icon name="download" className="h-4 w-4" /> Download
                  </button>
                </div>
              </header>
              <div className="p-4">
                <CodeBlock className="max-h-96 overflow-y-auto">{preview}</CodeBlock>
                {encoded.base64.length > 32 * 1024 && (
                  <p className="mt-3 text-sm text-amber-800 dark:text-amber-300">
                    This is a large data URI ({formatBytes(text.length)}). Inlining images this big slows page loads; a separate file is usually better above a few KB.
                  </p>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function DecodePanel() {
  const [text, setText] = useState('');
  const result = useMemo(() => {
    if (!text.trim()) return null;
    try {
      return { ok: true as const, d: decodeInput(text) };
    } catch (e) {
      return { ok: false as const, message: e instanceof Base64Error ? e.message : 'This is not valid Base64.' };
    }
  }, [text]);
  const blob = useMemo(
    () => (result?.ok ? new Blob([result.d.bytes as BlobPart], { type: result.d.detected?.mime ?? 'application/octet-stream' }) : null),
    [result],
  );
  const url = useObjectUrl(result?.ok && result.d.detected ? blob : null);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <CodeArea
        label="Base64 or data URI"
        hint="CSS url(…) and <img> tags work too"
        rows={14}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="data:image/png;base64,iVBORw0KGgo…"
      />
      <div className="min-w-0 space-y-4">
        {!result && <p className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">Paste Base64 to see the image.</p>}
        {result && !result.ok && (
          <p role="alert" className="flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
            <Icon name="warn" className="h-5 w-5 shrink-0" /> {result.message}
          </p>
        )}
        {result?.ok && (
          <>
            <Notices items={result.d.warnings} />
            <Panel eyebrow="Decoded image" icon="image">
              {url && <Preview url={url} alt="Decoded image preview" />}
              <div className="mt-4">
                <DetailRows
                  rows={[
                    ['Detected type', result.d.detected ? result.d.detected.label : 'Unknown'],
                    ['Declared type', result.d.declared ?? '—'],
                    ['Size', formatBytes(result.d.bytes.length)],
                  ]}
                />
              </div>
              <Button className="mt-4 pointer-coarse:min-h-11" onClick={() => blob && downloadBlob(blob, downloadName(result.d))}>
                <Icon name="download" className="h-4 w-4" /> Download {downloadName(result.d)}
              </Button>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

export default function ImageBase64Page() {
  const [dir, setDir] = useState<Direction>('encode');
  return (
    <div className="space-y-8">
      <Breadcrumb tool={imageBase64} />
      <Headline accent="Base64">Images to and from </Headline>
      <StatusStrip status={dir === 'encode' ? 'Drop, paste or choose an image to encode.' : 'Paste Base64 or a data URI to decode it.'} />
      <Tabs<Direction>
        label="Direction"
        tabs={[
          { id: 'encode', label: 'Image → Base64' },
          { id: 'decode', label: 'Base64 → Image' },
        ]}
        active={dir}
        onChange={setDir}
      />
      <div role="tabpanel" id={`panel-${dir}`} aria-labelledby={`tab-${dir}`}>
        {dir === 'encode' ? <EncodePanel /> : <DecodePanel />}
      </div>
      <Panel eyebrow="Good to know" icon="info">
        <ul className="list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
          <li>Base64 makes data about a third bigger (4 characters for every 3 bytes), and inlined images can&rsquo;t be cached separately. Inline only small icons.</li>
          <li>The type is detected from the file&rsquo;s bytes (its &ldquo;magic number&rdquo;), not its name, and mismatches with a data URI&rsquo;s declared type are flagged.</li>
          <li>Decoded SVGs are previewed as images, so any scripts inside them can&rsquo;t run. Everything stays on your device.</li>
        </ul>
      </Panel>
    </div>
  );
}
