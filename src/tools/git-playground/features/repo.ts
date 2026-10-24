// The pretend repository: commits are full file snapshots, branches and tags are pointers,
// and the index (staging area) is the snapshot the next commit will record, like real git.

export type Files = Record<string, string>;

export interface Commit {
  id: string;
  message: string;
  parents: string[];
  files: Files;
  /** Creation order; used for log order and graph columns. */
  seq: number;
}

export type Head = { kind: 'branch'; name: string } | { kind: 'detached'; id: string };

export interface StashEntry {
  message: string;
  base: string | null;
  working: Files;
}

export interface Repo {
  initialized: boolean;
  commits: Record<string, Commit>;
  /** A branch with no commits yet (right after `git init`) has no entry. */
  branches: Record<string, string>;
  tags: Record<string, string>;
  remote: { name: string; url: string; branches: Record<string, string> } | null;
  head: Head;
  working: Files;
  index: Files;
  stash: StashEntry[];
  /** Set while a merge stops on conflicts. */
  merging: { theirs: string; label: string; conflicts: string[] } | null;
  seq: number;
}

export const MAX_FILES = 50;
export const MAX_FILE_CHARS = 20_000;
export const CONFLICT_MARK = '<<<<<<<';

export class GitError extends Error {}

export const emptyRepo = (): Repo => ({
  initialized: false,
  commits: {},
  branches: {},
  tags: {},
  remote: null,
  head: { kind: 'branch', name: 'main' },
  working: {},
  index: {},
  stash: [],
  merging: null,
  seq: 0,
});

export const headId = (r: Repo): string | null => (r.head.kind === 'branch' ? (r.branches[r.head.name] ?? null) : r.head.id);
export const filesOf = (r: Repo, id: string | null): Files => (id ? r.commits[id].files : {});
export const headFiles = (r: Repo) => filesOf(r, headId(r));
export const allPaths = (...sets: Files[]) => [...new Set(sets.flatMap((s) => Object.keys(s)))].sort();

export interface Change {
  path: string;
  kind: 'new file' | 'modified' | 'deleted';
}

/** What `git status` reports: staged (index vs HEAD), unstaged (working vs index) and untracked files. */
export function changes(r: Repo) {
  const head = headFiles(r);
  const staged: Change[] = [];
  const unstaged: Change[] = [];
  const untracked: string[] = [];
  for (const path of allPaths(head, r.index, r.working)) {
    const h = head[path];
    const i = r.index[path];
    const w = r.working[path];
    if (i !== h) staged.push({ path, kind: h === undefined ? 'new file' : i === undefined ? 'deleted' : 'modified' });
    if (i === undefined) {
      if (w !== undefined) untracked.push(path);
    } else if (w !== i) unstaged.push({ path, kind: w === undefined ? 'deleted' : 'modified' });
  }
  return { staged, unstaged, untracked };
}

export const isClean = (r: Repo) => {
  const c = changes(r);
  return !c.staged.length && !c.unstaged.length;
};

export function ancestors(r: Repo, id: string | null): Set<string> {
  const seen = new Set<string>();
  const stack = id ? [id] : [];
  while (stack.length) {
    const c = stack.pop()!;
    if (seen.has(c)) continue;
    seen.add(c);
    stack.push(...r.commits[c].parents);
  }
  return seen;
}

/** True when `a` is `b` or one of its ancestors. */
export const isAncestor = (r: Repo, a: string, b: string) => ancestors(r, b).has(a);

/** The newest common ancestor (good enough for the histories a playground builds). */
export function mergeBase(r: Repo, a: string, b: string): string | null {
  const ofA = ancestors(r, a);
  let best: Commit | null = null;
  for (const id of ancestors(r, b)) if (ofA.has(id) && (!best || r.commits[id].seq > best.seq)) best = r.commits[id];
  return best?.id ?? null;
}

function hashOf(seed: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, '0').slice(0, 7);
}

/** Create a commit (ids are short, stable hashes) and return its id. Doesn't move any ref. */
export function addCommit(r: Repo, message: string, parents: string[], files: Files): string {
  r.seq += 1;
  let id = hashOf(`${r.seq}|${message}|${parents.join(',')}`);
  for (let salt = 0; r.commits[id]; salt++) id = hashOf(`${r.seq}|${message}|${salt}`);
  r.commits[id] = { id, message, parents, files: { ...files }, seq: r.seq };
  return id;
}

/** Move the current branch (or the detached HEAD) to `id`. */
export function moveHead(r: Repo, id: string) {
  if (r.head.kind === 'branch') r.branches[r.head.name] = id;
  else r.head = { kind: 'detached', id };
}

/** Resolve HEAD, branches, tags, origin/<branch>, hash prefixes, and ~n / ^n suffixes. */
export function resolve(r: Repo, spec: string): string {
  const m = /^(.*?)((?:[~^]\d*)*)$/.exec(spec)!;
  const base = m[1];
  let id: string | null | undefined;
  if (base === 'HEAD' || base === '@') {
    id = headId(r);
    if (!id) throw new GitError(`'${spec}' doesn't point to a commit yet: there are no commits.`);
  } else {
    id = r.branches[base] ?? r.tags[base];
    if (!id && r.remote && base.startsWith(`${r.remote.name}/`)) id = r.remote.branches[base.slice(r.remote.name.length + 1)];
    if (!id && /^[0-9a-f]{4,7}$/.test(base)) {
      const hits = Object.keys(r.commits).filter((c) => c.startsWith(base));
      if (hits.length > 1) throw new GitError(`short hash '${base}' is ambiguous.`);
      id = hits[0];
    }
  }
  if (!id) throw new GitError(`'${spec}' is not a branch, tag or commit here.`);
  for (const [, op, n] of m[2].matchAll(/([~^])(\d*)/g)) {
    const count = n === '' ? 1 : Number(n);
    if (op === '~') {
      for (let i = 0; i < count; i++) {
        id = r.commits[id!].parents[0];
        if (!id) throw new GitError(`'${spec}' goes back further than the first commit.`);
      }
    } else {
      id = count === 0 ? id : r.commits[id!].parents[count - 1];
      if (!id) throw new GitError(`'${spec}': that commit has no parent ${count}.`);
    }
  }
  return id!;
}

const withNewline = (s: string) => (s && !s.endsWith('\n') ? `${s}\n` : s);

/**
 * Three-way merge of whole files: a file changed on only one side takes that side; a file changed
 * differently on both sides gets conflict markers.
 * shortcut: whole-file granularity (git merges line by line, so edits to different lines of one
 * file conflict here but not in git); upgrade to a diff3 line merge if that confuses learners.
 */
export function merge3(base: Files, ours: Files, theirs: Files, oursLabel: string, theirsLabel: string) {
  const files: Files = {};
  const conflicts: string[] = [];
  for (const p of allPaths(base, ours, theirs)) {
    const b = base[p];
    const o = ours[p];
    const t = theirs[p];
    const pick = o === t || t === b ? o : o === b ? t : null;
    if (pick !== null) {
      if (pick !== undefined) files[p] = pick;
      continue;
    }
    conflicts.push(p);
    files[p] = `${CONFLICT_MARK} ${oursLabel}\n${withNewline(o ?? '')}=======\n${withNewline(t ?? '')}>>>>>>> ${theirsLabel}\n`;
  }
  return { files, conflicts };
}

/** Line diff (LCS) for `git diff` / `git show`. Files are small, so O(n·m) is fine. */
export function lineDiff(a: string, b: string): string[] {
  const x = a ? a.replace(/\n$/, '').split('\n') : [];
  const y = b ? b.replace(/\n$/, '').split('\n') : [];
  const lcs = Array.from({ length: x.length + 1 }, () => new Array<number>(y.length + 1).fill(0));
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--) lcs[i][j] = x[i] === y[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) {
      out.push(`  ${x[i++]}`);
      j++;
    } else if (j < y.length && (i === x.length || lcs[i][j + 1] >= lcs[i + 1][j])) out.push(`+ ${y[j++]}`);
    else out.push(`- ${x[i++]}`);
  }
  return out;
}

/**
 * Swap the checked-out snapshot to `target`, carrying uncommitted changes over like git does,
 * and refusing when a change would be overwritten.
 */
export function checkoutFiles(r: Repo, target: Files) {
  const head = headFiles(r);
  const changed = allPaths(head, r.index, r.working).filter((p) => r.working[p] !== head[p] || r.index[p] !== head[p]);
  const blocked = changed.filter((p) => target[p] !== head[p]);
  if (blocked.length)
    throw new GitError(`Your local changes to ${blocked.join(', ')} would be overwritten. Commit them, or save them with \`git stash\`, first.`);
  const index: Files = { ...target };
  const working: Files = { ...target };
  for (const p of changed) {
    if (r.index[p] === undefined) delete index[p];
    else index[p] = r.index[p];
    if (r.working[p] === undefined) delete working[p];
    else working[p] = r.working[p];
  }
  r.index = index;
  r.working = working;
}

/** Commits reachable from any ref, oldest first (what the graph and `log --all` show). */
export function visibleCommits(r: Repo): Commit[] {
  const tips = [headId(r), ...Object.values(r.branches), ...Object.values(r.tags), ...Object.values(r.remote?.branches ?? {}), r.merging?.theirs ?? null];
  const seen = new Set<string>();
  for (const t of tips) for (const id of ancestors(r, t)) seen.add(id);
  return [...seen].map((id) => r.commits[id]).sort((a, b) => a.seq - b.seq);
}

/** Ref labels pointing at a commit, git-log style: HEAD -> main, origin/main, tag: v1. */
export function refsAt(r: Repo, id: string) {
  const out: { label: string; kind: 'head' | 'branch' | 'remote' | 'tag' }[] = [];
  if (r.head.kind === 'detached' && r.head.id === id) out.push({ label: 'HEAD', kind: 'head' });
  for (const [name, at] of Object.entries(r.branches))
    if (at === id) out.push({ label: r.head.kind === 'branch' && r.head.name === name ? `HEAD -> ${name}` : name, kind: 'branch' });
  for (const [name, at] of Object.entries(r.remote?.branches ?? {})) if (at === id) out.push({ label: `${r.remote!.name}/${name}`, kind: 'remote' });
  for (const [name, at] of Object.entries(r.tags)) if (at === id) out.push({ label: `tag: ${name}`, kind: 'tag' });
  return out;
}
