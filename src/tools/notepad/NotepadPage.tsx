import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import notepad from './index';
import {
  fileName,
  initialState,
  newNote,
  parseStored,
  reducer,
  searchNotes,
  serialize,
  sortNotes,
  STORAGE_KEY,
  titleFromFile,
  type Note,
} from './features/store';
import { countText, previewHtml } from '../markdown-editor/features/markdown';
import { loadRenderer, type Renderer } from '../markdown-editor/features/sanitize';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { createZip, uniqueNames, ZIP_MAX_BYTES } from '../../shared/lib/zip';
import { readTextFile, TextFileError } from '../../shared/lib/textFile';
import { downloadBlob, downloadText } from '../../shared/utils/dom.utils';
import { pluralize } from '../../shared/utils/format.utils';

const card = 'rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const inputClass =
  'w-full rounded-xl border border-field-edge bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 pointer-coarse:min-h-11 dark:bg-slate-950 dark:text-slate-100';
const SAVE_DELAY = 400;
const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function NotepadPage() {
  const [state, dispatch] = useReducer(reducer, undefined, () => parseStored(readStorage()) ?? initialState(crypto.randomUUID(), Date.now()));
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(false);
  const [renderer, setRenderer] = useState<Renderer | null>(null);
  const [rendererError, setRendererError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fmt, setFmt] = useState<'txt' | 'md'>('md');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const lastSaved = useRef<string | null>(readStorage());
  const fileRef = useRef<HTMLInputElement>(null);

  const note = state.notes.find((n) => n.id === state.activeId) ?? state.notes[0];
  const visible = useMemo(() => sortNotes(searchNotes(state.notes, query)), [state.notes, query]);
  const counts = useMemo(() => countText(note.body), [note.body]);

  // Debounced autosave. Skips the write when another tab just handed us exactly this value.
  useEffect(() => {
    const t = setTimeout(() => {
      const json = serialize(state);
      if (json === lastSaved.current) return;
      try {
        localStorage.setItem(STORAGE_KEY, json);
        lastSaved.current = json;
        setSaveError(null);
      } catch (e) {
        const quota = e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');
        setSaveError(
          quota
            ? 'Browser storage is full, so your latest changes are not saved. Export your notes or delete some to free space.'
            : 'Your notes cannot be saved because browser storage is blocked. Export them to keep a copy.',
        );
      }
    }, SAVE_DELAY);
    return () => clearTimeout(t);
  }, [state]);

  // Cross-tab sync: another tab saved, so adopt its notes.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY && e.key !== null) return;
      const next = parseStored(e.newValue);
      if (!next) return;
      lastSaved.current = e.newValue;
      dispatch({ type: 'replace', state: next });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // The Markdown renderer (marked + DOMPurify) loads only when the preview is first opened.
  useEffect(() => {
    if (!preview || renderer) return;
    let live = true;
    loadRenderer().then(
      (r) => live && setRenderer(r),
      () => live && setRendererError(true),
    );
    return () => {
      live = false;
    };
  }, [preview, renderer]);
  const html = useMemo(() => (preview && renderer ? previewHtml(renderer.render(note.body).html) : ''), [preview, renderer, note.body]);

  const edit = (patch: Partial<Pick<Note, 'title' | 'body'>>) => dispatch({ type: 'edit', id: note.id, patch, now: Date.now() });
  const select = (id: string) => {
    setConfirmDelete(false);
    dispatch({ type: 'select', id });
  };

  const exportOne = () => downloadText(note.body, fileName(note.title, fmt), fmt === 'md' ? 'text/markdown' : 'text/plain');
  const exportAll = () => {
    const names = uniqueNames(state.notes.map((n) => fileName(n.title, fmt)));
    const enc = new TextEncoder();
    const entries = state.notes.map((n, i) => ({ name: names[i], data: enc.encode(n.body), date: new Date(n.updated) }));
    if (entries.reduce((sum, e) => sum + e.data.length, 0) > ZIP_MAX_BYTES) return setNotice('Your notes are too large for one .zip. Export them one at a time.');
    downloadBlob(new Blob([createZip(entries) as BlobPart], { type: 'application/zip' }), 'notes.zip');
    setNotice(`Exported ${pluralize(entries.length, 'note')} as notes.zip.`);
  };
  const importFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const imported: Note[] = [];
    const failed: string[] = [];
    for (const f of Array.from(files)) {
      try {
        imported.push(newNote(crypto.randomUUID(), Date.now(), titleFromFile(f.name), await readTextFile(f)));
      } catch (e) {
        failed.push(e instanceof TextFileError ? e.message : `Couldn't read ${f.name}.`);
      }
    }
    if (imported.length) dispatch({ type: 'import', notes: imported });
    setNotice([imported.length ? `Imported ${pluralize(imported.length, 'note')}.` : '', ...failed].filter(Boolean).join(' '));
    if (fileRef.current) fileRef.current.value = '';
  };

  const status = saveError ?? (notice || `${pluralize(counts.words, 'word')} · ${pluralize(counts.chars, 'character')} · Edited ${when.format(note.updated)}`);

  return (
    <div className="space-y-8">
      <Breadcrumb tool={notepad} />
      <Headline accent="notes">Quick </Headline>
      <StatusStrip status={status} tone={saveError ? 'busy' : 'neutral'} />
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        Your notes live only in this browser, on this device. They are not uploaded or backed up, and clearing site data deletes them. Use Export to keep a copy.
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <section aria-label="Notes" className={`${card} min-w-0 space-y-3`}>
          <Button className="w-full" onClick={() => dispatch({ type: 'create', id: crypto.randomUUID(), now: Date.now() })}>
            New note
          </Button>
          <label className="block">
            <span className="eyebrow mb-1 block text-slate-600 dark:text-slate-400">Search notes</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title or text" autoComplete="off" className={inputClass} />
          </label>
          <ul className="max-h-64 space-y-1 overflow-y-auto lg:max-h-[28rem]">
            {visible.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  aria-current={n.id === note.id}
                  onClick={() => select(n.id)}
                  className={`block w-full rounded-xl px-3 py-2 text-left pointer-coarse:min-h-11 ${n.id === note.id ? 'bg-emerald-50 dark:bg-emerald-950' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {n.pinned && <span className="sr-only">Pinned: </span>}
                    {n.pinned && <Icon name="bookmark" className="mr-1 inline h-3.5 w-3.5" />}
                    {n.title || 'Untitled note'}
                  </span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{n.body.replace(/\s+/g, ' ').slice(0, 60) || 'Empty'}</span>
                </button>
              </li>
            ))}
            {!visible.length && <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No notes match.</li>}
          </ul>
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <Segmented<'txt' | 'md'>
              label="Export format"
              options={[
                { value: 'md', label: '.md' },
                { value: 'txt', label: '.txt' },
              ]}
              value={fmt}
              onChange={setFmt}
            />
            <Button variant="secondary" onClick={exportAll}>
              <Icon name="download" className="h-4 w-4" /> All (.zip)
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" className="h-4 w-4" /> Import
            </Button>
            <input ref={fileRef} type="file" multiple accept=".txt,.md,.markdown,text/plain,text/markdown" aria-label="Import notes" className="sr-only" onChange={(e) => void importFiles(e.target.files)} />
          </div>
        </section>

        <section aria-label="Editor" className={`${card} min-w-0 space-y-4`}>
          <label className="block">
            <span className="eyebrow mb-1 block text-slate-600 dark:text-slate-400">Title</span>
            <input type="text" value={note.title} onChange={(e) => edit({ title: e.target.value })} maxLength={200} autoComplete="off" className={inputClass} />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented<'edit' | 'preview'> label="View" options={[{ value: 'edit', label: 'Edit' }, { value: 'preview', label: 'Markdown preview' }]} value={preview ? 'preview' : 'edit'} onChange={(v) => setPreview(v === 'preview')} />
            <Button variant="secondary" aria-pressed={note.pinned} onClick={() => dispatch({ type: 'pin', id: note.id })}>
              {note.pinned ? 'Unpin' : 'Pin'}
            </Button>
            <Button variant="secondary" onClick={exportOne}>
              Export note
            </Button>
            <CopyButton text={note.body} label="Copy text" disabled={!note.body} />
            {confirmDelete ? (
              <span role="group" aria-label="Confirm delete" className="flex items-center gap-2">
                <span className="text-sm text-slate-700 dark:text-slate-300">Delete this note?</span>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setConfirmDelete(false);
                    dispatch({ type: 'delete', id: note.id, fallbackId: crypto.randomUUID(), now: Date.now() });
                  }}
                >
                  Yes, delete
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </span>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
          </div>
          {preview ? (
            rendererError ? (
              <p role="alert" className="text-sm text-red-700 dark:text-red-400">The Markdown renderer failed to load. Reload the page to try again.</p>
            ) : renderer ? (
              <div className="md-preview min-h-64" data-testid="note-preview" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading the Markdown renderer…</p>
            )
          ) : (
            <label className="block">
              <span className="sr-only">Note text</span>
              <textarea
                value={note.body}
                onChange={(e) => edit({ body: e.target.value })}
                rows={16}
                spellCheck
                placeholder="Start typing…"
                className={`${inputClass} min-h-64 resize-y font-mono text-sm`}
              />
            </label>
          )}
        </section>
      </div>
    </div>
  );
}
