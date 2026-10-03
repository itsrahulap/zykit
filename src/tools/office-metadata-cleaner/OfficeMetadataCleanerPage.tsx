import { useRef, useState } from 'react';
import officeMetadataCleaner from './index';
import {
  ACCEPT,
  cleanName,
  cleanOffice,
  DEFAULT_OPTIONS,
  FORMAT_LABEL,
  inspectOffice,
  isOfficeFile,
  MAX_FILE_BYTES,
  MAX_FILES,
  MAX_TOTAL_BYTES,
  OfficeError,
  type FieldKind,
  type OfficeOptions,
  type OfficeReport,
} from './features/office-metadata-cleaner';
import { usePageFileIntake } from '../../shared/hooks/useImageBatch';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { Checkbox, Notices, OptionsCard } from '../../shared/ui/convert';
import { createZip } from '../../shared/lib/zip';
import { downloadBlob } from '../../shared/utils/dom.utils';
import { formatBytes, pluralize } from '../../shared/utils/format.utils';

interface Cleaned {
  bytes: Uint8Array;
  name: string;
  after: OfficeReport;
  left: string[];
}

interface OfficeFile {
  id: string;
  name: string;
  size: number;
  status: 'opening' | 'ready' | 'error';
  error?: string;
  encrypted?: boolean;
  report?: OfficeReport;
  result?: Cleaned;
}

type Tone = 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'violet';
const KIND: Record<FieldKind, { label: string; tone: Tone }> = {
  person: { label: 'Person', tone: 'amber' },
  software: { label: 'Software', tone: 'blue' },
  date: { label: 'Date', tone: 'neutral' },
  text: { label: 'Text', tone: 'neutral' },
};

const iconButton =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 pointer-coarse:h-11 pointer-coarse:w-11 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white';

let fileSeq = 0;

function warnings(r: OfficeReport): string[] {
  const w: string[] = [];
  if (r.trackedChanges) w.push(`Has ${pluralize(r.trackedChanges, 'tracked change')}. Deleted text is still in the file; accept or reject the changes in your Office app to remove it.`);
  if (r.hiddenItems.length) w.push(`Hidden content stays in the file: ${r.hiddenItems.join('; ')}.`);
  if (r.hasMacros) w.push('Contains macros (VBA). They are kept and can include names or paths.');
  if (r.externalLinks) w.push(`Links to ${pluralize(r.externalLinks, 'external workbook')}, which can reveal file paths.`);
  if (r.printerSettings) w.push('Includes printer settings, which can name a printer or computer. They are kept.');
  return w;
}

function BeforeAfter({ before, after }: { before: OfficeReport; after: OfficeReport }) {
  const rows: [string, string, string][] = [
    ['Properties', String(before.fields.length), String(after.fields.length)],
    ['Custom properties', String(before.custom.length), String(after.custom.length)],
    ['Comment and revision authors', before.reviewers.join(', ') || 'none', after.reviewers.join(', ') || 'none'],
    ['Thumbnail', before.thumbnail ? formatBytes(before.thumbnail.bytes) : 'none', after.thumbnail ? formatBytes(after.thumbnail.bytes) : 'none'],
    ['Comments', String(before.comments), String(after.comments)],
    ['Tracked changes', String(before.trackedChanges), String(after.trackedChanges)],
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

function FileCard({ f, onRemove, disabled }: { f: OfficeFile; onRemove: () => void; disabled: boolean }) {
  const r = f.report;
  const nothing = r && !r.fields.length && !r.custom.length && !r.reviewers.length && !r.thumbnail;
  return (
    <li className="space-y-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="break-all font-medium text-slate-900 dark:text-slate-100">{f.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {formatBytes(f.size)}
            {r && ` · ${FORMAT_LABEL[r.format]} (.${r.format}) · ${pluralize(r.parts, 'part')}`}
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
            <strong>{f.encrypted ? 'Protected or old format. ' : 'Not opened. '}</strong>
            {f.error}
          </p>
        </div>
      )}

      {r && (
        <>
          {nothing && (
            <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <Icon name="check" className="h-4 w-4" /> No author, company, custom properties or thumbnail found.
            </p>
          )}
          <Notices items={warnings(r)} />
          {r.fields.length > 0 && (
            <section aria-label={`Properties of ${f.name}`}>
              <h4 className="eyebrow mb-1 text-slate-600 dark:text-slate-400">Document properties</h4>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                {r.fields.map((x, i) => (
                  <div key={`${x.part}${x.key}${i}`} className="grid gap-x-4 gap-y-1 py-2 sm:grid-cols-[12rem_1fr]">
                    <dt className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <span className="min-w-0 break-words">{x.label}</span>
                      <Badge tone={KIND[x.kind].tone}>{KIND[x.kind].label}</Badge>
                    </dt>
                    <dd className="min-w-0 break-words font-mono text-sm text-slate-900 dark:text-slate-100">{x.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {r.custom.length > 0 && (
            <section aria-label={`Custom properties of ${f.name}`}>
              <h4 className="eyebrow mb-1 text-slate-600 dark:text-slate-400">Custom properties</h4>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                {r.custom.map((c, i) => (
                  <div key={`${c.name}${i}`} className="grid gap-x-4 gap-y-1 py-2 sm:grid-cols-[12rem_1fr]">
                    <dt className="min-w-0 break-words text-sm font-medium text-slate-700 dark:text-slate-300">{c.name || '(unnamed)'}</dt>
                    <dd className="min-w-0 break-words font-mono text-sm text-slate-900 dark:text-slate-100">{c.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {(r.reviewers.length > 0 || r.comments > 0 || r.thumbnail) && (
            <ul aria-label={`Other findings in ${f.name}`} className="flex flex-wrap gap-2">
              {r.comments > 0 && <li><Badge tone="amber">{pluralize(r.comments, 'comment')}</Badge></li>}
              {r.reviewers.map((p) => (
                <li key={p}><Badge tone="amber">Reviewer: {p}</Badge></li>
              ))}
              {r.thumbnail && <li><Badge tone="violet">Thumbnail preview ({formatBytes(r.thumbnail.bytes)})</Badge></li>}
            </ul>
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
          <Button variant="secondary" onClick={() => downloadBlob(new Blob([f.result!.bytes as Uint8Array<ArrayBuffer>]), f.result!.name)}>
            <Icon name="download" className="h-4 w-4" /> Download {f.result.name}
          </Button>
        </section>
      )}
    </li>
  );
}

export default function OfficeMetadataCleanerPage() {
  const [files, setFiles] = useState<OfficeFile[]>([]);
  const [options, setOptions] = useState<OfficeOptions>(DEFAULT_OPTIONS);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const bytes = useRef(new Map<string, Uint8Array>());

  const ready = files.filter((f) => f.status === 'ready');
  const opening = files.some((f) => f.status === 'opening');
  const disabled = !!busy || opening;
  const cleaned = ready.filter((f) => f.result);
  const noneSelected = !Object.values(options).some(Boolean);

  const update = (id: string, patch: Partial<OfficeFile>) => setFiles((list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const setOption = (patch: Partial<OfficeOptions>) => {
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
      if (!isOfficeFile(file)) skipped.push(`${file.name} isn't a .docx, .xlsx, .pptx, .odt, .ods or .odp file.`);
      else if (file.size > MAX_FILE_BYTES) skipped.push(`${file.name} is ${formatBytes(file.size)}; the limit is ${formatBytes(MAX_FILE_BYTES)} per file.`);
      else if (file.size > budget) skipped.push(`${file.name} would take the total over ${formatBytes(MAX_TOTAL_BYTES)}.`);
      else if (slots <= 0) skipped.push(`${file.name} was skipped; the limit is ${MAX_FILES} files.`);
      else {
        budget -= file.size;
        slots--;
        accepted.push({ file, id: `o${++fileSeq}` });
      }
    }
    if (skipped.length) setError(skipped.join(' '));
    if (!accepted.length) return;
    setFiles((prev) => [...prev, ...accepted.map(({ file, id }) => ({ id, name: file.name, size: file.size, status: 'opening' as const }))]);
    for (const { file, id } of accepted) {
      try {
        const data = new Uint8Array(await file.arrayBuffer());
        const report = await inspectOffice(data);
        bytes.current.set(id, data);
        update(id, { status: 'ready', report });
      } catch (err) {
        const known = err instanceof OfficeError;
        update(id, { status: 'error', error: known ? err.message : "This file couldn't be read. It may be damaged.", encrypted: known && err.code === 'encrypted' });
      }
    }
  };
  usePageFileIntake((fs) => void addFiles(fs), !busy);

  const removeFile = (id: string) => {
    setFiles((list) => list.filter((f) => f.id !== id));
    bytes.current.delete(id);
  };

  const clean = async () => {
    setError(null);
    setDone(null);
    let n = 0;
    for (const f of ready) {
      setBusy(`Cleaning ${f.name} (${++n} of ${ready.length})`);
      await new Promise((r) => setTimeout(r, 0));
      try {
        const res = await cleanOffice(bytes.current.get(f.id)!, options);
        update(f.id, { result: { bytes: res.bytes, name: cleanName(f.name), after: res.after, left: res.left } });
      } catch (err) {
        setError(`${f.name}: ${err instanceof OfficeError ? err.message : "couldn't be rewritten."}`);
      }
    }
    setBusy(null);
    setDone(`Cleaned ${pluralize(n, 'file')}. Check the before and after, then download.`);
  };

  const downloadAll = () => {
    const zip = createZip(cleaned.map((f) => ({ name: f.result!.name, data: f.result!.bytes })));
    downloadBlob(new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' }), 'cleaned-documents.zip');
  };

  const status = busy ?? done ?? (opening ? 'Reading…' : ready.length ? `${pluralize(ready.length, 'document')} ready.` : 'Add Office documents to start.');

  return (
    <div className="space-y-8">
      <Breadcrumb tool={officeMetadataCleaner} />
      <div className="space-y-3">
        <Headline accent="documents">Clean Office </Headline>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">
          See the author, company, revision history and custom properties inside Word, Excel, PowerPoint and OpenDocument files, then blank them. Everything runs in this tab; nothing is uploaded.
        </p>
      </div>
      <StatusStrip status={status} tone={busy || opening ? 'busy' : done ? 'good' : 'neutral'} />

      <section aria-label="Add documents" className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center sm:p-8 dark:border-slate-700 dark:bg-slate-900">
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT}
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
          <Icon name="upload" className="h-4 w-4" /> Add documents
        </Button>
        <p className="text-sm text-slate-500 dark:text-slate-400">.docx .xlsx .pptx .odt .ods .odp · or drop or paste them here · up to {formatBytes(MAX_FILE_BYTES)} each</p>
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
          <ul aria-label="Documents" className="divide-y divide-slate-100 dark:divide-slate-800">
            {files.map((f) => (
              <FileCard key={f.id} f={f} onRemove={() => removeFile(f.id)} disabled={!!busy} />
            ))}
          </ul>
        </section>
      )}

      {ready.length > 0 && (
        <>
          <OptionsCard label="What to remove">
            <Checkbox label="Authors (creator, last modified by)" checked={options.authors} onChange={(v) => setOption({ authors: v })} />
            <Checkbox label="Dates, revision and editing time" checked={options.dates} onChange={(v) => setOption({ dates: v })} />
            <Checkbox label="Company and manager" checked={options.company} onChange={(v) => setOption({ company: v })} />
            <Checkbox label="Application and template" checked={options.application} onChange={(v) => setOption({ application: v })} />
            <Checkbox label="Custom properties" checked={options.custom} onChange={(v) => setOption({ custom: v })} />
            <Checkbox label="Thumbnail preview" checked={options.thumbnail} onChange={(v) => setOption({ thumbnail: v })} />
            <Checkbox label="Comment and tracked-change authors" checked={options.reviewers} onChange={(v) => setOption({ reviewers: v })} />
            <Checkbox label="Title, subject, keywords, comments" checked={options.details} onChange={(v) => setOption({ details: v })} />
          </OptionsCard>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void clean()} disabled={disabled || noneSelected}>
              <Icon name="shield" className="h-4 w-4" /> Clean {pluralize(ready.length, 'document')}
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
