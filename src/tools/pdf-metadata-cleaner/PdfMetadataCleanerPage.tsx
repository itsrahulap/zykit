import { useRef, useState } from 'react';
import pdfMetadataCleaner from './index';
import { usePdfMetaWorker } from './hooks/usePdfMetaWorker';
import {
  cleanName,
  DEFAULT_OPTIONS,
  isPdfFile,
  MAX_FILE_BYTES,
  MAX_FILES,
  MAX_TOTAL_BYTES,
  type CleanOptions,
  type FlagKind,
  type PdfMetaReport,
} from './features/pdf-metadata-cleaner';
import { usePageFileIntake } from '../../shared/hooks/useImageBatch';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeBlock } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { Checkbox, Notices, OptionsCard } from '../../shared/ui/convert';
import { createZip } from '../../shared/lib/zip';
import { downloadBlob } from '../../shared/utils/dom.utils';
import { formatBytes, pluralize } from '../../shared/utils/format.utils';

interface Cleaned {
  bytes: Uint8Array;
  name: string;
  after: PdfMetaReport;
  left: string[];
}

interface PdfFile {
  id: string;
  name: string;
  size: number;
  status: 'opening' | 'ready' | 'error';
  error?: string;
  encrypted?: boolean;
  report?: PdfMetaReport;
  result?: Cleaned;
}

type Tone = 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'violet';
const KIND: Record<FlagKind | 'custom', { label: string; tone: Tone }> = {
  person: { label: 'Person', tone: 'amber' },
  software: { label: 'Software', tone: 'blue' },
  ai: { label: 'AI tool', tone: 'red' },
  date: { label: 'Date', tone: 'neutral' },
  id: { label: 'ID', tone: 'violet' },
  text: { label: 'Text', tone: 'neutral' },
  custom: { label: 'Custom', tone: 'violet' },
};

const when = (iso: string) => iso.replace('T', ' ').replace(/Z$/, ' UTC');
const iconButton =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 pointer-coarse:h-11 pointer-coarse:w-11 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white';

let fileSeq = 0;

function Fields({ rows }: { rows: { key: string; value: string; kind: FlagKind | 'custom' }[] }) {
  return (
    <dl className="divide-y divide-slate-100 dark:divide-slate-800">
      {rows.map((r, i) => (
        <div key={`${r.key}${i}`} className="grid gap-x-4 gap-y-1 py-2 sm:grid-cols-[11rem_1fr]">
          <dt className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span className="min-w-0 break-all">{r.key}</span>
            <Badge tone={KIND[r.kind].tone}>{KIND[r.kind].label}</Badge>
          </dt>
          <dd className="min-w-0 break-words font-mono text-sm text-slate-900 dark:text-slate-100">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function BeforeAfter({ before, after }: { before: PdfMetaReport; after: PdfMetaReport }) {
  const rows: [string, string, string][] = [
    ['Info dictionary', pluralize(before.info.length, 'field'), pluralize(after.info.length, 'field')],
    ['XMP metadata', before.xmp.present ? `${formatBytes(before.xmp.chars)}` : 'none', after.xmp.present ? `${formatBytes(after.xmp.chars)}` : 'none'],
    ['Document ID', before.documentId ? 'present' : 'none', after.documentId ? 'present' : 'none'],
    ['Application data', String(before.privateData), String(after.privateData)],
    ['Pages', String(before.pageCount), String(after.pageCount)],
  ];
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Metadata before and after cleaning</caption>
      <thead>
        <tr className="text-slate-500 dark:text-slate-400">
          <th scope="col" className="py-1 font-medium">Item</th>
          <th scope="col" className="py-1 font-medium">Before</th>
          <th scope="col" className="py-1 font-medium">After</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map(([k, b, a]) => (
          <tr key={k}>
            <th scope="row" className="py-1.5 pr-3 font-medium text-slate-700 dark:text-slate-300">{k}</th>
            <td className="py-1.5 pr-3 break-words text-slate-900 dark:text-slate-100">{b}</td>
            <td className="py-1.5 break-words text-slate-900 dark:text-slate-100">{a}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function warnings(r: PdfMetaReport): string[] {
  const w: string[] = [];
  if (r.embeddedFiles || r.fileAttachments) w.push(`Contains ${pluralize(r.embeddedFiles || r.fileAttachments, 'embedded file')}. Attachments are kept and can carry their own metadata.`);
  if (r.javascript) w.push(`Contains JavaScript (${r.javascript}). It is kept; review the file before sharing it.`);
  if (r.hasForm) w.push(`Has a form (${pluralize(r.formFields, 'field')}). Field values are kept and can contain personal data.`);
  if (r.extraXmpStreams) w.push(`${pluralize(r.extraXmpStreams, 'image or object')} carry their own XMP metadata.`);
  return w;
}

function FileCard({ f, onRemove, disabled }: { f: PdfFile; onRemove: () => void; disabled: boolean }) {
  const r = f.report;
  return (
    <li className="space-y-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="break-all font-medium text-slate-900 dark:text-slate-100">{f.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {formatBytes(f.size)}
            {r && ` · ${pluralize(r.pageCount, 'page')}${r.version ? ` · PDF ${r.version}` : ''}`}
            {f.status === 'opening' && ' · opening…'}
          </p>
        </div>
        {f.result && <Badge tone={f.result.left.length ? 'red' : 'green'}>{f.result.left.length ? 'Not fully removed' : 'Verified clean'}</Badge>}
        <button type="button" className={iconButton} disabled={disabled} onClick={onRemove} aria-label={`Remove ${f.name}`}>
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>

      {f.status === 'error' && (
        <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          <Icon name="warn" className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="min-w-0 break-words">
            <strong>{f.encrypted ? 'Encrypted PDF. ' : 'Unreadable. '}</strong>
            {f.error}
          </p>
        </div>
      )}

      {r && (
        <>
          {!r.hasIdentifying && (
            <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <Icon name="check" className="h-4 w-4" /> No Info dictionary, XMP or document ID found. Nothing to remove.
            </p>
          )}
          {r.generators.some((g) => g.ai) && (
            <p role="status" className="rounded-xl bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950/50 dark:text-red-200">
              Names an AI tool: {r.generators.filter((g) => g.ai).map((g) => g.value).join(', ')}
            </p>
          )}
          <Notices items={warnings(r)} />
          {r.info.length > 0 && (
            <section aria-label={`Info dictionary of ${f.name}`}>
              <h4 className="eyebrow mb-1 text-slate-600 dark:text-slate-400">Info dictionary</h4>
              <Fields rows={r.info.map((x) => ({ key: x.key, value: x.iso ? `${when(x.iso)}  (${x.value})` : x.value, kind: x.kind }))} />
            </section>
          )}
          {r.xmp.present && (
            <details className="rounded-2xl border border-slate-200 dark:border-slate-800">
              <summary className="cursor-pointer rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 pointer-coarse:min-h-11 dark:text-slate-200">
                XMP metadata ({formatBytes(r.xmp.chars)}, {pluralize(r.xmp.fields.length, 'field')})
              </summary>
              <div className="space-y-3 px-4 pb-4">
                {r.xmp.fields.length > 0 && <Fields rows={r.xmp.fields} />}
                <CodeBlock label={`XMP of ${f.name}`} className="max-h-96 overflow-auto whitespace-pre! break-normal!">{r.xmp.pretty}</CodeBlock>
                {r.xmp.truncated && <p className="text-sm text-slate-500 dark:text-slate-400">Showing the first part only. All of it is removed.</p>}
              </div>
            </details>
          )}
          {r.documentId && (
            <section aria-label={`Document ID of ${f.name}`}>
              <h4 className="eyebrow mb-1 text-slate-600 dark:text-slate-400">Document ID</h4>
              <Fields rows={r.documentId.map((id, i) => ({ key: i === 0 ? 'Permanent' : 'Changing', value: id, kind: 'id' as const }))} />
            </section>
          )}
        </>
      )}

      {f.result && r && (
        <section aria-label={`Result for ${f.name}`} className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <BeforeAfter before={r} after={f.result.after} />
          {f.result.left.length > 0 && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              Still present in the output: {f.result.left.join(', ')}.
            </p>
          )}
          <Button variant="secondary" onClick={() => downloadBlob(new Blob([f.result!.bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }), f.result!.name)}>
            <Icon name="download" className="h-4 w-4" /> Download {f.result.name}
          </Button>
        </section>
      )}
    </li>
  );
}

export default function PdfMetadataCleanerPage() {
  const send = usePdfMetaWorker();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [options, setOptions] = useState<CleanOptions>(DEFAULT_OPTIONS);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const ready = files.filter((f) => f.status === 'ready');
  const opening = files.some((f) => f.status === 'opening');
  const disabled = !!busy || opening;
  const cleaned = ready.filter((f) => f.result);

  const update = (id: string, patch: Partial<PdfFile>) => setFiles((list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const setOption = (patch: Partial<CleanOptions>) => {
    setOptions((o) => ({ ...o, ...patch }));
    setFiles((list) => list.map((f) => ({ ...f, result: undefined })));
    setDone(null);
  };

  const addFiles = async (list: File[]) => {
    setError(null);
    setDone(null);
    let budget = MAX_TOTAL_BYTES - files.reduce((n, f) => n + f.size, 0);
    let slots = MAX_FILES - files.length;
    const skipped: string[] = [];
    const accepted: { file: File; id: string }[] = [];
    for (const file of list) {
      if (!isPdfFile(file)) skipped.push(`${file.name} isn't a PDF.`);
      else if (file.size > MAX_FILE_BYTES) skipped.push(`${file.name} is ${formatBytes(file.size)}; the limit is ${formatBytes(MAX_FILE_BYTES)} per file.`);
      else if (file.size > budget) skipped.push(`${file.name} would take the total over ${formatBytes(MAX_TOTAL_BYTES)}.`);
      else if (slots <= 0) skipped.push(`${file.name} was skipped; the limit is ${MAX_FILES} files.`);
      else {
        budget -= file.size;
        slots--;
        accepted.push({ file, id: `p${++fileSeq}` });
      }
    }
    if (skipped.length) setError(skipped.join(' '));
    if (!accepted.length) return;
    setFiles((prev) => [...prev, ...accepted.map(({ file, id }) => ({ id, name: file.name, size: file.size, status: 'opening' as const }))]);
    for (const { file, id } of accepted) {
      const bytes = await file.arrayBuffer();
      const res = await send({ type: 'inspect', fileId: id, bytes }, [bytes]);
      if (res.type === 'inspected') update(id, { status: 'ready', report: res.report });
      else if (res.type === 'error') update(id, { status: 'error', error: res.message, encrypted: res.code === 'encrypted' });
    }
  };
  usePageFileIntake((fs) => void addFiles(fs), !busy);

  const removeFile = (id: string) => {
    setFiles((list) => list.filter((f) => f.id !== id));
    void send({ type: 'close', fileId: id });
  };

  const clean = async () => {
    setError(null);
    setDone(null);
    let n = 0;
    for (const f of ready) {
      setBusy(`Cleaning ${f.name} (${++n} of ${ready.length})`);
      const res = await send({ type: 'clean', fileId: f.id, options });
      if (res.type === 'cleaned') update(f.id, { result: { bytes: res.bytes, name: cleanName(f.name), after: res.after, left: res.left } });
      else if (res.type === 'error') setError(`${f.name}: ${res.message}`);
    }
    setBusy(null);
    setDone(`Cleaned ${pluralize(n, 'file')}. Check the before and after, then download.`);
  };

  const downloadAll = () => {
    const zip = createZip(cleaned.map((f) => ({ name: f.result!.name, data: f.result!.bytes })));
    downloadBlob(new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' }), 'cleaned-pdfs.zip');
  };

  const status = busy ?? done ?? (opening ? 'Reading…' : ready.length ? `${pluralize(ready.length, 'PDF')} ready.` : 'Add PDF files to start.');
  const noneSelected = !options.info && !options.xmp && !options.documentId && !options.privateData;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={pdfMetadataCleaner} />
      <div className="space-y-3">
        <Headline accent="metadata">Clean PDF </Headline>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">
          See the author, software, dates and XMP hidden in a PDF, then remove them without touching the pages. Everything runs in this tab; nothing is uploaded.
        </p>
      </div>
      <StatusStrip status={status} tone={busy || opening ? 'busy' : done ? 'good' : 'neutral'} />

      <section aria-label="Add PDFs" className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center sm:p-8 dark:border-slate-700 dark:bg-slate-900">
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
            if (e.target.files) void addFiles(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
        <Button onClick={() => input.current?.click()} disabled={!!busy}>
          <Icon name="upload" className="h-4 w-4" /> Add PDF files
        </Button>
        <p className="text-sm text-slate-500 dark:text-slate-400">or drop or paste them here · up to {formatBytes(MAX_FILE_BYTES)} each</p>
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
          <ul aria-label="PDF files" className="divide-y divide-slate-100 dark:divide-slate-800">
            {files.map((f) => (
              <FileCard key={f.id} f={f} onRemove={() => removeFile(f.id)} disabled={!!busy} />
            ))}
          </ul>
        </section>
      )}

      {ready.length > 0 && (
        <>
          <OptionsCard label="What to remove">
            <Checkbox label="Info dictionary (title, author, producer, dates…)" checked={options.info} onChange={(v) => setOption({ info: v })} />
            <Checkbox label="XMP metadata" checked={options.xmp} onChange={(v) => setOption({ xmp: v })} />
            <Checkbox label="Application data (PieceInfo)" checked={options.privateData} onChange={(v) => setOption({ privateData: v })} />
            <Checkbox label="Document ID" checked={options.documentId} onChange={(v) => setOption({ documentId: v })} />
          </OptionsCard>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void clean()} disabled={disabled || noneSelected}>
              <Icon name="shield" className="h-4 w-4" /> Clean {pluralize(ready.length, 'PDF')}
            </Button>
            {cleaned.length > 1 && (
              <Button variant="secondary" onClick={downloadAll} disabled={!!busy}>
                <Icon name="download" className="h-4 w-4" /> Download all as ZIP
              </Button>
            )}
            {noneSelected && <p className="text-sm text-slate-500 dark:text-slate-400">Choose something to remove.</p>}
          </div>
        </>
      )}
    </div>
  );
}
