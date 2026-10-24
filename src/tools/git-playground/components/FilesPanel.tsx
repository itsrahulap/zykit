// The folder's files with their git state, an editor, and buttons that run the matching command
// in the terminal (so learners see the real command for every click).

import { useState } from 'react';
import { changes, headFiles, type Repo } from '../features/repo';
import { Badge } from '../../../shared/ui/ui';

type Tone = Parameters<typeof Badge>[0]['tone'];

function fileState(repo: Repo, path: string): { label: string; tone: Tone; stageable: boolean } {
  if (repo.merging?.conflicts.includes(path)) return { label: 'Conflict', tone: 'red', stageable: true };
  const c = changes(repo);
  if (c.untracked.includes(path)) return { label: 'New, not tracked', tone: 'amber', stageable: true };
  const unstaged = c.unstaged.find((x) => x.path === path);
  if (unstaged) return { label: unstaged.kind === 'deleted' ? 'Deleted, not staged' : 'Changed, not staged', tone: 'amber', stageable: true };
  const staged = c.staged.find((x) => x.path === path);
  if (staged) return { label: `Staged (${staged.kind})`, tone: 'green', stageable: false };
  return { label: 'Committed', tone: 'neutral', stageable: false };
}

const inputClass =
  'block w-full rounded-lg border border-field-edge bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 pointer-coarse:min-h-11 dark:bg-slate-900 dark:text-slate-100';
const smallButton =
  'rounded-lg px-2.5 py-1 text-sm font-medium ring-1 ring-inset ring-field-edge text-slate-700 hover:bg-slate-50 disabled:opacity-50 pointer-coarse:min-h-11 dark:text-slate-200 dark:hover:bg-slate-800';

interface Props {
  repo: Repo;
  onRun: (line: string) => void;
  onSave: (path: string, content: string) => string | null;
}

export function FilesPanel({ repo, onRun, onSave }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const paths = [...new Set([...Object.keys(repo.working), ...Object.keys(repo.index), ...Object.keys(headFiles(repo))])].sort();

  const edit = (p: string) => {
    setOpen(open === p ? null : p);
    setDraft(repo.working[p] ?? '');
    setError('');
  };
  const save = () => {
    if (!open) return;
    const problem = onSave(open, draft.endsWith('\n') || !draft ? draft : `${draft}\n`);
    setError(problem ?? '');
  };
  const quote = (p: string) => (/^[\w./-]+$/.test(p) ? p : `"${p}"`);

  return (
    <section aria-labelledby="gp-files" className="min-w-0 space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="gp-files" className="font-semibold text-slate-900 dark:text-white">
          Files
        </h2>
        <p className="text-xs text-slate-500">Buttons run the real command in the terminal, so you can see it.</p>
      </div>
      {!paths.length && <p className="text-sm text-slate-500">No files yet. Create one below, or type echo "hello" &gt; notes.txt.</p>}
      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {paths.map((p) => {
          const s = fileState(repo, p);
          const exists = p in repo.working;
          return (
            <li key={p} className="py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-slate-900 dark:text-slate-100">{p}</span>
                <Badge tone={s.tone}>{s.label}</Badge>
                {exists && (
                  <button type="button" className={smallButton} aria-expanded={open === p} onClick={() => edit(p)}>
                    {open === p ? 'Close' : 'Edit'}
                  </button>
                )}
                {s.stageable && repo.initialized && (
                  <button type="button" className={smallButton} onClick={() => onRun(`git add ${quote(p)}`)}>
                    Stage
                  </button>
                )}
              </div>
              {open === p && exists && (
                <div className="mt-2 space-y-2">
                  <label htmlFor="gp-editor" className="sr-only">
                    Contents of {p}
                  </label>
                  <textarea
                    id="gp-editor"
                    rows={6}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    spellCheck={false}
                    className={`${inputClass} font-mono`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={smallButton} onClick={save} disabled={draft === repo.working[p] || `${draft}\n` === repo.working[p]}>
                      Save file
                    </button>
                    <button type="button" className={smallButton} onClick={() => onRun(`rm ${quote(p)}`)}>
                      Delete file
                    </button>
                  </div>
                  {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          onRun(`touch ${quote(newName.trim())}`);
          setNewName('');
        }}
      >
        <div className="min-w-40 flex-1">
          <label htmlFor="gp-new-file" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            New file
          </label>
          <input id="gp-new-file" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. login.js" maxLength={100} className={`${inputClass} font-mono`} />
        </div>
        <button type="submit" className={smallButton} disabled={!newName.trim()}>
          Create
        </button>
      </form>
    </section>
  );
}
