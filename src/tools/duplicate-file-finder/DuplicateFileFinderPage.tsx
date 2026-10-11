import { useCallback, useEffect, useRef, useState } from 'react';
import duplicateFileFinder from './index';
import {
  groupDuplicates,
  MAX_FILE_BYTES,
  MAX_FILES,
  MAX_TOTAL_BYTES,
  pickCandidates,
  toCsv,
  toJson,
  totalWasted,
  type DupGroup,
  type Entry,
} from './features/duplicate-file-finder';
import type { HashResponse } from './workers/hash.protocol';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { downloadText } from '../../shared/utils/dom.utils';
import { formatBytes, pluralize } from '../../shared/utils/format.utils';

interface Item extends Entry {
  file: File;
}
type Busy = { label: string; done: number; total: number } | null;

let seq = 0;

/** Walks dropped folders. Entries must be read synchronously from the event, before any await. */
async function readDropped(dt: DataTransfer): Promise<{ path: string; file: File }[]> {
  const roots = Array.from(dt.items, (i) => i.webkitGetAsEntry?.() ?? null);
  const out: { path: string; file: File }[] = [];
  const walk = async (e: FileSystemEntry): Promise<void> => {
    if (out.length >= MAX_FILES) return;
    if (e.isFile) {
      const file = await new Promise<File>((res, rej) => (e as FileSystemFileEntry).file(res, rej));
      out.push({ path: e.fullPath.replace(/^\//, ''), file });
    } else if (e.isDirectory) {
      const reader = (e as FileSystemDirectoryEntry).createReader();
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
        if (!batch.length) break;
        for (const child of batch) await walk(child);
      }
    }
  };
  for (const r of roots) if (r) await walk(r);
  return out;
}

export default function DuplicateFileFinderPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [groups, setGroups] = useState<DupGroup[] | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const worker = useRef<Worker | null>(null);
  const files = useRef<HTMLInputElement>(null);
  const folder = useRef<HTMLInputElement>(null);

  useEffect(() => () => worker.current?.terminate(), []);
  useEffect(() => {
    folder.current?.setAttribute('webkitdirectory', '');
  }, []);

  const add = useCallback((list: { path: string; file: File }[]) => {
    setGroups(null);
    setNotes([]);
    setError(null);
    setItems((prev) => {
      const seen = new Set(prev.map((i) => i.path));
      const next = [...prev];
      for (const { path, file } of list) {
        if (next.length >= MAX_FILES) {
          setError(`Only the first ${MAX_FILES.toLocaleString()} files are kept.`);
          break;
        }
        if (!seen.has(path)) {
          seen.add(path);
          next.push({ id: ++seq, path, size: file.size, file });
        }
      }
      return next;
    });
  }, []);
  const addPicked = (fl: FileList | null, relative: boolean) => {
    if (fl) add(Array.from(fl, (file) => ({ path: relative && file.webkitRelativePath ? file.webkitRelativePath : file.name, file })));
  };

  const cancel = () => {
    worker.current?.terminate();
    worker.current = null;
    setBusy(null);
    setNotes(['Scan cancelled.']);
  };

  const scan = () => {
    setError(null);
    setGroups(null);
    const c = pickCandidates(items);
    const info: string[] = [];
    if (c.empty) info.push(`${pluralize(c.empty, 'empty file')} ignored (empty files are all identical).`);
    if (c.tooLarge.length) info.push(`${pluralize(c.tooLarge.length, 'file')} over ${formatBytes(MAX_FILE_BYTES)} not compared.`);
    if (c.overBudget.length) info.push(`${pluralize(c.overBudget.length, 'file')} not compared: the ${formatBytes(MAX_TOTAL_BYTES)} total limit was reached.`);
    setNotes(info);
    if (!c.toHash.length) return setGroups([]);
    const total = c.toHash.reduce((n, e) => n + e.size, 0);
    const byId = new Map(items.map((i) => [i.id, i]));
    const hashes = new Map<number, string>();
    let done = 0;
    let read = 0;
    const w = new Worker(new URL('./workers/hash.worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    setBusy({ label: `Hashing ${pluralize(c.toHash.length, 'candidate file')}`, done: 0, total });
    w.onmessage = (e: MessageEvent<HashResponse>) => {
      const m = e.data;
      if (m.type === 'done') {
        w.terminate();
        worker.current = null;
        setGroups(groupDuplicates(c.toHash, hashes));
        setBusy(null);
        return;
      }
      if (m.type === 'hash') hashes.set(m.id, m.hash);
      else setNotes((n) => [...n, m.message]);
      read += m.bytes;
      done += 1;
      setBusy({ label: `Hashed ${done} of ${c.toHash.length} files`, done: read, total });
    };
    w.onerror = (e) => {
      e.preventDefault();
      w.terminate();
      worker.current = null;
      setBusy(null);
      setError('The hashing worker stopped unexpectedly (the files may be too large for this device).');
    };
    w.postMessage({ files: c.toHash.map((e) => ({ id: e.id, file: byId.get(e.id)!.file })) });
  };

  const clear = () => {
    setItems([]);
    setGroups(null);
    setNotes([]);
    setError(null);
  };

  const wasted = groups ? totalWasted(groups) : 0;
  const totalSize = items.reduce((n, i) => n + i.size, 0);
  const status = busy
    ? `${busy.label}…`
    : groups
      ? groups.length
        ? `${pluralize(groups.length, 'duplicate group')}: ${formatBytes(wasted)} could be freed.`
        : 'No duplicates found.'
      : items.length
        ? `${pluralize(items.length, 'file')} (${formatBytes(totalSize)}) ready to scan.`
        : 'Add files or a folder to start.';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={duplicateFileFinder} />
      <div className="space-y-3">
        <Headline accent="files">Find duplicate </Headline>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">
          Files with the same size are compared by SHA-256 hash, so identical content is found whatever the file names are. Everything runs in this tab; nothing is uploaded.
        </p>
      </div>
      <StatusStrip status={status} tone={busy ? 'busy' : groups?.length ? 'good' : 'neutral'} />

      {busy && (
        <div className="space-y-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label="Hashing files" aria-valuemin={0} aria-valuemax={busy.total} aria-valuenow={busy.done}>
            <div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${busy.total ? (busy.done / busy.total) * 100 : 0}%` }} />
          </div>
          <Button variant="secondary" onClick={cancel}>
            <Icon name="stop" className="h-4 w-4" /> Cancel
          </Button>
        </div>
      )}

      <section
        aria-label="Add files"
        data-dragging={dragging || undefined}
        onDragOver={(e) => {
          if (Array.from(e.dataTransfer.types).includes('Files')) {
            e.preventDefault();
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (busy) return;
          void readDropped(e.dataTransfer).then(add, () => setError("Couldn't read the dropped items."));
        }}
        className={`flex flex-col items-center gap-3 rounded-3xl border border-dashed bg-white p-6 text-center sm:p-8 dark:bg-slate-900 ${dragging ? 'border-emerald-500' : 'border-slate-300 dark:border-slate-700'}`}
      >
        <input ref={files} type="file" multiple className="sr-only" tabIndex={-1} aria-hidden="true" data-testid="file-input" onChange={(e) => {
            addPicked(e.target.files, false);
            e.target.value = '';
          }} />
        <input ref={folder} type="file" multiple className="sr-only" tabIndex={-1} aria-hidden="true" data-testid="folder-input" onChange={(e) => {
            addPicked(e.target.files, true);
            e.target.value = '';
          }} />
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => files.current?.click()} disabled={!!busy}>
            <Icon name="upload" className="h-4 w-4" /> Add files
          </Button>
          <Button variant="secondary" onClick={() => folder.current?.click()} disabled={!!busy}>
            <Icon name="upload" className="h-4 w-4" /> Add folder
          </Button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          or drop files or folders here · up to {MAX_FILES.toLocaleString()} files, {formatBytes(MAX_FILE_BYTES)} each
        </p>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          <Icon name="warn" className="h-5 w-5 shrink-0" />
          <p className="min-w-0 flex-1 break-words">{error}</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={scan} disabled={!!busy || items.length < 2}>
            <Icon name="search" className="h-4 w-4" /> Find duplicates
          </Button>
          <Button variant="ghost" onClick={clear} disabled={!!busy}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {pluralize(items.length, 'file')} · {formatBytes(totalSize)}
          </span>
        </div>
      )}

      {notes.length > 0 && (
        <ul role="status" className="space-y-1 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {notes.map((n) => (
            <li key={n} className="break-words">
              {n}
            </li>
          ))}
        </ul>
      )}

      {groups && groups.length > 0 && (
        <section aria-label="Duplicate groups" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">
              {pluralize(groups.length, 'group')} · {formatBytes(wasted)} wasted
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => downloadText(toCsv(groups), 'duplicates.csv', 'text/csv')}>
                <Icon name="download" className="h-4 w-4" /> CSV report
              </Button>
              <Button variant="secondary" onClick={() => downloadText(toJson(groups), 'duplicates.json', 'application/json')}>
                <Icon name="download" className="h-4 w-4" /> JSON report
              </Button>
            </div>
          </div>
          <ul className="space-y-3">
            {groups.map((g) => (
              <li key={g.hash + g.size} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone="green">{g.paths.length} copies</Badge>
                  <span className="text-slate-700 dark:text-slate-300">{formatBytes(g.size)} each · {formatBytes(g.wasted)} wasted</span>
                  <code className="min-w-0 break-all text-xs text-slate-500 dark:text-slate-400">{g.hash.slice(0, 16)}…</code>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-800 dark:text-slate-200">
                  {g.paths.map((p) => (
                    <li key={p} className="break-all">
                      {p}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Browsers can&rsquo;t delete or move your files, so this tool only reports. Use the list or the CSV to remove the extra copies yourself in your file manager. Keep one
        copy of each group.
      </p>
    </div>
  );
}
