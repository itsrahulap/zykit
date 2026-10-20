import { useRef, useState } from 'react';
import gitPlayground from './index';
import { CommitGraph } from './components/CommitGraph';
import { FilesPanel } from './components/FilesPanel';
import { Terminal, type Entry } from './components/Terminal';
import { CHALLENGES, setupRepo } from './features/challenges';
import { run, writeFile } from './features/commands';
import { GitError, emptyRepo, type Repo } from './features/repo';
import { Headline } from '../../shared/ui/page';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';

type Mode = 'challenges' | 'free';
const SOLVED_KEY = 'zykit-git-playground-solved';

function loadSolved(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(SOLVED_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

const promptFor = (r: Repo) => `~/playground${r.initialized ? ` (${r.head.kind === 'branch' ? r.head.name : r.head.id})` : ''} $`;

export default function GitPlaygroundPage() {
  const nextId = useRef(1);
  const [mode, setMode] = useState<Mode>('challenges');
  const [index, setIndex] = useState(0);
  const [repo, setRepo] = useState<Repo>(() => setupRepo(CHALLENGES[0]));
  const [entries, setEntries] = useState<Entry[]>(() => [{ id: 0, lines: [{ kind: 'tip', text: `Challenge: ${CHALLENGES[0].goal}` }] }]);
  const [hints, setHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [solved, setSolved] = useState<string[]>(loadSolved);
  const [justSolved, setJustSolved] = useState(false);
  const challenge = CHALLENGES[index];

  const start = (m: Mode, i = index) => {
    setMode(m);
    setIndex(i);
    setHints(0);
    setShowSolution(false);
    setJustSolved(false);
    if (m === 'free') {
      setRepo(emptyRepo());
      setEntries([{ id: nextId.current++, lines: [{ kind: 'tip', text: 'Free play: an empty folder. Start with git init, or type help to see every command.' }] }]);
    } else {
      setRepo(setupRepo(CHALLENGES[i]));
      setEntries([{ id: nextId.current++, lines: [{ kind: 'tip', text: `Challenge: ${CHALLENGES[i].goal}` }] }]);
    }
  };

  const markSolved = (next: Repo) => {
    if (mode !== 'challenges' || justSolved || !challenge.check(next)) return [];
    setJustSolved(true);
    const list = [...new Set([...solved, challenge.id])];
    setSolved(list);
    try {
      localStorage.setItem(SOLVED_KEY, JSON.stringify(list));
    } catch {
      // Progress just isn't remembered when storage is blocked.
    }
    return [{ kind: 'tip' as const, text: `Challenge complete: ${challenge.title}! ${index < CHALLENGES.length - 1 ? 'Press "Next challenge" when you are ready.' : 'You finished every challenge.'}` }];
  };

  const runLine = (line: string) => {
    if (line.trim() === 'clear') return setEntries([]);
    const res = run(repo, line);
    setRepo(res.repo);
    const win = markSolved(res.repo);
    setEntries((e) => [...e, { id: nextId.current++, prompt: promptFor(repo), cmd: line, lines: [...res.lines, ...win] }].slice(-200));
  };

  const saveFile = (path: string, content: string) => {
    const next = structuredClone(repo);
    try {
      writeFile(next, path, content);
    } catch (e) {
      if (e instanceof GitError) return e.message;
      throw e;
    }
    setRepo(next);
    const win = markSolved(next);
    setEntries((e) => [...e, { id: nextId.current++, lines: [{ kind: 'tip', text: `Saved ${path} in the editor. git status will show it as changed.` }, ...win] }]);
    return null;
  };

  return (
    <div className="space-y-8">
      <Breadcrumb tool={gitPlayground} />
      <div className="space-y-3">
        <Headline accent="safely">Practise git </Headline>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">
          A pretend repository that lives in this page. Type real git commands, edit files, and watch commits and branches move on the graph. Nothing touches a real repo,
          so experiment freely.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Mode"
          value={mode}
          onChange={(m) => start(m, m === 'challenges' ? index : 0)}
          options={[
            { value: 'challenges', label: `Challenges (${solved.length}/${CHALLENGES.length} done)` },
            { value: 'free', label: 'Free play' },
          ]}
        />
        <Button variant="secondary" onClick={() => start(mode)}>
          Start over
        </Button>
      </div>

      {mode === 'challenges' && (
        <section aria-labelledby="gp-challenge" className="space-y-3 rounded-2xl border border-emerald-600/40 bg-emerald-50/60 p-4 dark:bg-emerald-950/20">
          <ol className="flex flex-wrap gap-1.5" aria-label="Challenges">
            {CHALLENGES.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => start('challenges', i)}
                  aria-current={i === index ? 'step' : undefined}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset pointer-coarse:min-h-11 ${
                    i === index ? 'bg-emerald-700 text-white ring-emerald-700' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'
                  }`}
                >
                  {solved.includes(c.id) && <Icon name="check" className="h-3.5 w-3.5" />}
                  {i + 1}. {c.title}
                </button>
              </li>
            ))}
          </ol>
          <div>
            <h2 id="gp-challenge" className="font-semibold text-slate-900 dark:text-white">
              Challenge {index + 1} of {CHALLENGES.length}: {challenge.title}
            </h2>
            <p className="mt-1 text-slate-700 dark:text-slate-300">{challenge.goal}</p>
          </div>
          {justSolved && (
            <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-emerald-700 p-3 text-white">
              <Icon name="check" className="h-5 w-5" />
              <span className="flex-1 font-semibold">Solved! Nice work.</span>
              {index < CHALLENGES.length - 1 && (
                <button type="button" onClick={() => start('challenges', index + 1)} className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-emerald-800 pointer-coarse:min-h-11">
                  Next challenge →
                </button>
              )}
            </div>
          )}
          {hints > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {challenge.hints.slice(0, hints).map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
          {showSolution && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">One way to solve it. Click a command to run it:</p>
              <ol className="space-y-1">
                {challenge.solution.map((s, i) => (
                  <li key={i}>
                    <button type="button" onClick={() => runLine(s)} className="rounded-md bg-slate-900 px-2 py-1 text-left font-mono text-xs text-slate-100 hover:bg-slate-800 pointer-coarse:min-h-11">
                      $ {s}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={hints >= challenge.hints.length} onClick={() => setHints((h) => h + 1)}>
              {hints ? 'Another hint' : 'Show a hint'}
            </Button>
            <Button variant="ghost" onClick={() => setShowSolution((s) => !s)}>
              {showSolution ? 'Hide solution' : 'Show solution'}
            </Button>
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Terminal entries={entries} prompt={promptFor(repo)} onRun={runLine} />
        <div className="min-w-0 space-y-6">
          <CommitGraph repo={repo} />
          <FilesPanel repo={repo} onRun={runLine} onSave={saveFile} />
        </div>
      </div>
    </div>
  );
}
