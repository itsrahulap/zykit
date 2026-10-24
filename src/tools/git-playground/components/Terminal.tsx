// The command line: scrolling output, a prompt showing the current branch, ↑/↓ history and
// one-click buttons for common commands.

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { OutLine } from '../features/commands';

export interface Entry {
  id: number;
  prompt?: string;
  cmd?: string;
  lines: OutLine[];
}

const QUICK = ['git status', 'git add .', 'git commit -m ""', 'git log --oneline --all', 'git branch', 'git switch -c ', 'help'];

const LINE_STYLE: Record<OutLine['kind'], string> = {
  out: 'text-slate-200',
  err: 'text-red-300',
  tip: 'text-emerald-300',
};

export function Terminal({ entries, prompt, onRun }: { entries: Entry[]; prompt: string; onRun: (line: string) => void }) {
  const [value, setValue] = useState('');
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [entries]);

  const submit = () => {
    const line = value.trim();
    if (!line) return;
    history.current = [...history.current.filter((h) => h !== line), line].slice(-100);
    cursor.current = -1;
    setValue('');
    onRun(line);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') return submit();
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const h = history.current;
    if (!h.length) return;
    cursor.current = e.key === 'ArrowUp' ? (cursor.current < 0 ? h.length - 1 : Math.max(0, cursor.current - 1)) : cursor.current < 0 ? -1 : cursor.current + 1;
    if (cursor.current >= h.length) cursor.current = -1;
    setValue(cursor.current < 0 ? '' : h[cursor.current]);
  };

  const quick = (cmd: string) => {
    setValue(cmd);
    requestAnimationFrame(() => {
      const el = input.current;
      if (!el) return;
      el.focus();
      // Put the cursor inside the quotes of a commit message.
      const at = cmd.endsWith('""') ? cmd.length - 1 : cmd.length;
      el.setSelectionRange(at, at);
    });
  };

  return (
    <section aria-labelledby="gp-terminal" className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-slate-950 shadow-sm ring-1 ring-slate-800">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-red-400/80" />
          <span className="h-3 w-3 rounded-full bg-amber-400/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        </span>
        <h2 id="gp-terminal" className="ml-2 font-mono text-xs text-slate-400">
          Terminal: pretend repo, nothing leaves your browser
        </h2>
      </div>
      <div
        ref={log}
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
        tabIndex={0}
        className="h-[22rem] overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed lg:h-[30rem]"
        onClick={() => window.getSelection()?.isCollapsed && input.current?.focus()}
      >
        {entries.map((e) => (
          <div key={e.id} className="mb-2">
            {e.cmd !== undefined && (
              <p className="whitespace-pre-wrap break-all text-slate-100">
                <span className="text-sky-300">{e.prompt}</span> {e.cmd}
              </p>
            )}
            {e.lines.map((l, i) => (
              <p key={i} className={`whitespace-pre-wrap break-words ${LINE_STYLE[l.kind]}`}>
                {l.kind === 'tip' ? `› ${l.text}` : l.text}
              </p>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-slate-800 px-4 py-2">
        <label htmlFor="gp-input" className="shrink-0 font-mono text-[13px] text-sky-300">
          {prompt}
        </label>
        <input
          ref={input}
          id="gp-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder="type a command, e.g. git status"
          aria-label="Command"
          maxLength={500}
          className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none pointer-coarse:min-h-11"
        />
        <button type="button" onClick={submit} className="rounded-lg bg-emerald-600 px-3 py-1 text-sm font-semibold text-white hover:bg-emerald-500 pointer-coarse:min-h-11">
          Run
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 border-t border-slate-800 px-4 py-2.5" role="group" aria-label="Insert a common command">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => quick(q)}
            className="rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-slate-200 hover:bg-slate-700 pointer-coarse:min-h-11"
          >
            {q.trim()}
          </button>
        ))}
      </div>
    </section>
  );
}
