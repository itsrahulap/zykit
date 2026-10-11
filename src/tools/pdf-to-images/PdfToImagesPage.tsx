import { useRef, useState } from 'react';
import pdfToImages from './index';
import { imageName, MAX_FILE_BYTES, MIME, renderScale, selectedPages, type ImageFormat } from './features/pdf-to-images';
import { baseName } from '../pdf-tools/features/pdf-tools';
import { createZip } from '../../shared/lib/zip';
import { FilePickerButton } from '../../shared/ui/ImageBatch';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';
import { Button } from '../../shared/ui/ui';
import { downloadBlob } from '../../shared/utils/dom.utils';
import { formatBytes } from '../../shared/utils/format.utils';

type Pdfjs = typeof import('pdfjs-dist');
type Doc = Awaited<ReturnType<Pdfjs['getDocument']>['promise']>;
interface Output {
  name: string;
  blob: Blob;
  url: string;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const card = 'rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const DPI = [72, 150, 200, 300].map((d) => ({ value: d, label: `${d} DPI` }));

let pdfjs: Promise<Pdfjs> | null = null;
function loadPdfjs() {
  // shortcut: pdf.js renders on the main thread (its parser runs in its own worker); move rendering to OffscreenCanvas if big PDFs feel slow.
  pdfjs ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    return lib;
  });
  return pdfjs;
}

export default function PdfToImagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [pages, setPages] = useState('');
  const [format, setFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState(90);
  const [dpi, setDpi] = useState(150);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const cancel = useRef(false);

  const clearOutputs = () => {
    outputs.forEach((o) => URL.revokeObjectURL(o.url));
    setOutputs([]);
  };

  const open = async (f: File, pw?: string) => {
    setError('');
    clearOutputs();
    if (f.size > MAX_FILE_BYTES) return setError('The PDF is larger than 200 MB.');
    try {
      const lib = await loadPdfjs();
      // useWasm off: the site's security policy doesn't allow WebAssembly here (JPEG 2000 / JBIG2 images may not render).
      const d = await lib.getDocument({ data: new Uint8Array(await f.arrayBuffer()), password: pw, useWasm: false }).promise;
      await doc?.loadingTask.destroy();
      setDoc(d);
      setFile(f);
      setNeedsPassword(false);
    } catch (e) {
      const name = (e as { name?: string }).name;
      if (name === 'PasswordException') {
        setFile(f);
        setNeedsPassword(true);
        if (pw) setError('That password is incorrect.');
      } else setError('This file could not be opened as a PDF.');
    }
  };

  const convert = async () => {
    if (!doc || !file) return;
    let list: number[];
    try {
      list = selectedPages(pages, doc.numPages);
    } catch (e) {
      return setError((e as Error).message);
    }
    setError('');
    clearOutputs();
    cancel.current = false;
    const made: Output[] = [];
    setProgress({ done: 0, total: list.length });
    for (const i of list) {
      if (cancel.current) break;
      const page = await doc.getPage(i + 1);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: renderScale(base.width, base.height, dpi) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      // JPEG has no transparency, so paint white first.
      if (format === 'jpeg') {
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      await page.render({ canvas, viewport }).promise;
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, MIME[format], quality / 100));
      page.cleanup();
      if (!blob) {
        setError(`Your browser couldn't encode ${format.toUpperCase()}. Try PNG.`);
        break;
      }
      made.push({ name: imageName(baseName(file.name), i, doc.numPages, format), blob, url: URL.createObjectURL(blob) });
      setOutputs([...made]);
      setProgress({ done: made.length, total: list.length });
    }
    setProgress(null);
  };

  const downloadAll = async () => {
    const zip = createZip(await Promise.all(outputs.map(async (o) => ({ name: o.name, data: new Uint8Array(await o.blob.arrayBuffer()) }))));
    downloadBlob(new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' }), `${baseName(file!.name)}-images.zip`);
  };

  const busy = progress !== null;
  return (
    <div className="space-y-8">
      <Breadcrumb tool={pdfToImages} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="images">PDF pages to </Headline>
        <FilePickerButton onFiles={([f]) => f && open(f)} multiple={false} accept="application/pdf,.pdf" label="Choose a PDF" />
      </div>
      <StatusStrip
        status={
          busy ? `Rendering page ${progress.done + 1} of ${progress.total}…` : doc && file ? `${file.name}: ${doc.numPages} page${doc.numPages === 1 ? '' : 's'}` : 'Choose a PDF. It never leaves your device.'
        }
        tone={busy ? 'busy' : outputs.length ? 'good' : 'neutral'}
      />
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      {needsPassword && file && (
        <form
          className={`flex flex-wrap items-end gap-3 ${card}`}
          onSubmit={(e) => {
            e.preventDefault();
            void open(file, password);
          }}
        >
          <label className="block min-w-0 flex-1">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">This PDF is password-protected</span>
            <input type="password" autoComplete="off" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <Button type="submit">Open</Button>
        </form>
      )}

      {doc && (
        <section aria-label="Options" className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${card}`}>
          <label className="block min-w-0">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Pages (empty = all)</span>
            <input className={inputCls} placeholder="e.g. 1-3, 5" value={pages} onChange={(e) => setPages(e.target.value)} />
          </label>
          <Segmented
            label="Format"
            options={[
              { value: 'png', label: 'PNG' },
              { value: 'jpeg', label: 'JPG' },
              { value: 'webp', label: 'WebP' },
            ]}
            value={format}
            onChange={setFormat}
          />
          <Select label="Resolution" options={DPI} value={dpi} onChange={setDpi} />
          {format !== 'png' && (
            <label className="block min-w-0">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Quality: {quality}%</span>
              <input type="range" min={40} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-emerald-600" />
            </label>
          )}
          <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4">
            <Button onClick={convert} disabled={busy}>
              Convert to {format === 'jpeg' ? 'JPG' : format.toUpperCase()}
            </Button>
            {busy && (
              <Button variant="secondary" onClick={() => (cancel.current = true)}>
                Cancel
              </Button>
            )}
            {outputs.length > 1 && !busy && (
              <Button variant="secondary" onClick={downloadAll}>
                Download all ({outputs.length}) as ZIP
              </Button>
            )}
          </div>
        </section>
      )}

      {outputs.length > 0 && (
        <ul aria-label="Images" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {outputs.map((o) => (
            <li key={o.name} className={`space-y-2 ${card}`}>
              <img src={o.url} alt={o.name} className="checkerboard w-full rounded-xl border border-slate-200 dark:border-slate-800" />
              <p className="truncate text-sm text-slate-700 dark:text-slate-300">{o.name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{formatBytes(o.blob.size)}</p>
              <Button variant="secondary" onClick={() => downloadBlob(o.blob, o.name)}>
                Download
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
