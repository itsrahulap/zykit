// Runs one terminal line against the pretend repo. Pure: returns a new repo and the output;
// a command that fails leaves the repo exactly as it was.

import {
  CONFLICT_MARK,
  GitError,
  MAX_FILES,
  MAX_FILE_CHARS,
  addCommit,
  allPaths,
  ancestors,
  changes,
  checkoutFiles,
  filesOf,
  headFiles,
  headId,
  isAncestor,
  isClean,
  lineDiff,
  merge3,
  mergeBase,
  moveHead,
  refsAt,
  resolve,
  visibleCommits,
  type Files,
  type Repo,
} from './repo';

export type LineKind = 'out' | 'err' | 'tip';
export interface OutLine {
  kind: LineKind;
  text: string;
}
type Say = (text: string, kind?: LineKind) => void;

export const HELP = `Commands you can use here:
  git init                     start tracking this folder
  git status                   what changed, what's staged
  git add <file> | .           stage changes for the next commit
  git commit -m "message"      save the staged snapshot (-a stages tracked files, --amend)
  git log [--oneline] [--all]  list commits
  git diff [--staged]          show line changes
  git show [commit]            one commit and its changes
  git branch [name] | -d name  list, create or delete branches
  git switch [-c] <branch>     move to a branch (-c creates it)
  git checkout <branch|commit> older way to switch (or -b to create)
  git restore [--staged] <f>   undo changes to a file
  git merge <branch>           combine another branch into this one (--abort)
  git rebase <branch>          replay your commits on top of another branch
  git reset [--soft|--mixed|--hard] <commit>   move the branch back
  git revert <commit>          new commit that undoes an old one
  git cherry-pick <commit>     copy one commit onto this branch
  git stash [pop|list|drop]    put changes aside for later
  git tag [name] [commit]      label a commit
  git remote add origin <url>  add a pretend remote, then git push / pull / fetch
Files: ls, cat <f>, echo "text" > <f> (>> appends), touch <f>, rm <f>
Other: clear, help. Use ↑ / ↓ for previous commands.`;

/** Split a command line like a shell: quotes group words, > and >> are separate tokens. */
export function tokenize(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let started = false;
  let quote: string | null = null;
  const flush = () => {
    if (started) out.push(cur);
    cur = '';
    started = false;
  };
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      started = true;
    } else if (/\s/.test(ch)) flush();
    else if (ch === '>') {
      flush();
      out.push(line[i + 1] === '>' ? '>>' : '>');
      if (line[i + 1] === '>') i++;
    } else {
      cur += ch;
      started = true;
    }
  }
  if (quote) throw new GitError(`A ${quote} quote isn't closed.`);
  flush();
  return out;
}

export function run(repo: Repo, line: string): { repo: Repo; lines: OutLine[] } {
  const r = structuredClone(repo);
  const lines: OutLine[] = [];
  const say: Say = (text, kind = 'out') => lines.push({ kind, text });
  try {
    const args = tokenize(line.trim());
    if (args.length) exec(r, args, say);
    return { repo: r, lines };
  } catch (e) {
    if (e instanceof GitError) return { repo, lines: [{ kind: 'err', text: e.message }] };
    throw e;
  }
}

function checkPath(path: string | undefined, r: Repo) {
  if (!path) throw new GitError('Name a file, e.g. notes.txt.');
  if (!/^[\w.-]+(\/[\w.-]+)*$/.test(path) || path.split('/').includes('..') || path.length > 100)
    throw new GitError(`'${path}' isn't a file name this playground accepts. Use letters, numbers, dots, dashes and / for folders.`);
  if (!(path in r.working) && Object.keys(r.working).length >= MAX_FILES) throw new GitError(`The playground holds at most ${MAX_FILES} files.`);
  return path;
}

export function writeFile(r: Repo, path: string, content: string) {
  checkPath(path, r);
  if (content.length > MAX_FILE_CHARS) throw new GitError(`Files are limited to ${MAX_FILE_CHARS.toLocaleString('en-US')} characters here.`);
  r.working[path] = content;
}

function exec(r: Repo, args: string[], say: Say) {
  const [cmd, ...rest] = args;
  switch (cmd) {
    case 'help':
      return say(HELP);
    case 'clear':
      return;
    case 'ls': {
      const files = Object.keys(r.working).sort();
      return say(files.length ? files.join('\n') : '(no files yet: try echo "hello" > notes.txt)');
    }
    case 'cat': {
      const p = rest[0];
      if (!p || !(p in r.working)) throw new GitError(`cat: ${p ?? ''}: No such file`);
      return say(r.working[p] || '(empty file)');
    }
    case 'touch':
      if (!rest.length) throw new GitError('touch: name a file, e.g. touch notes.txt');
      for (const p of rest) if (!(p in r.working)) writeFile(r, p, '');
      return;
    case 'rm':
      if (!rest.length) throw new GitError('rm: name a file to delete');
      for (const p of rest) {
        if (!(p in r.working)) throw new GitError(`rm: ${p}: No such file`);
        delete r.working[p];
      }
      return;
    case 'echo': {
      const at = rest.findIndex((t) => t === '>' || t === '>>');
      const text = (at < 0 ? rest : rest.slice(0, at)).join(' ');
      if (at < 0) return say(text);
      const path = rest[at + 1];
      writeFile(r, checkPath(path, r), (rest[at] === '>>' ? (r.working[path] ?? '') : '') + `${text}\n`);
      return;
    }
    case 'git':
      return git(r, rest, say);
    default:
      throw new GitError(`command not found: ${cmd}. This playground knows git plus ls, cat, echo, touch and rm. Type help.`);
  }
}

const sameFiles = (a: Files, b: Files) => allPaths(a, b).every((p) => a[p] === b[p]);
const short = (r: Repo, id: string) => `${id} ${r.commits[id].message}`;
const branchName = (r: Repo) => (r.head.kind === 'branch' ? r.head.name : null);
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** Set index and working tree to `files`, keeping untracked files in place (like git). */
function setSnapshot(r: Repo, files: Files) {
  const untracked = changes(r).untracked;
  const keep = Object.fromEntries(untracked.filter((p) => !(p in files)).map((p) => [p, r.working[p]]));
  r.index = { ...files };
  r.working = { ...files, ...keep };
}

function requireRepo(r: Repo) {
  if (!r.initialized) throw new GitError('fatal: not a git repository. Run git init first.');
}
function notMerging(r: Repo) {
  if (r.merging) throw new GitError("You're in the middle of a merge. Finish it (git add + git commit) or cancel it (git merge --abort) first.");
}
function requireCommit(r: Repo) {
  const id = headId(r);
  if (!id) throw new GitError('There are no commits yet. Make one first: git add . then git commit -m "First commit".');
  return id;
}

function git(r: Repo, args: string[], say: Say) {
  const [sub, ...a] = args;
  if (!sub || sub === 'help' || sub === '--help') return say(HELP);
  if (sub === '--version') return say('git version 2.47.0 (playground)');
  if (sub === 'init') {
    if (r.initialized) return say('Reinitialized existing Git repository in /playground/.git/');
    r.initialized = true;
    say('Initialized empty Git repository in /playground/.git/');
    return say('Git now tracks this folder. Create files, then git add and git commit them.', 'tip');
  }
  if (sub === 'clone') throw new GitError('Cloning needs the network, and this playground is offline. Use git init, then git remote add origin <url> to practise pushing.');
  requireRepo(r);
  const handler = COMMANDS[sub];
  if (!handler) throw new GitError(`git: '${sub}' isn't a git command this playground supports. Type help to see the list.`);
  handler(r, a, say);
}

const COMMANDS: Record<string, (r: Repo, a: string[], say: Say) => void> = {
  config: (_r, _a, say) => say('Saved. (The playground doesn\'t need your name or email.)', 'tip'),

  status(r, _a, say) {
    const c = changes(r);
    say(r.head.kind === 'branch' ? `On branch ${r.head.name}` : `HEAD detached at ${r.head.id}`);
    const b = branchName(r);
    const local = headId(r);
    const remoteTip = b && r.remote?.branches[b];
    if (remoteTip && local) {
      const mine = ancestors(r, local);
      const theirs = ancestors(r, remoteTip);
      const ahead = [...mine].filter((id) => !theirs.has(id)).length;
      const behind = [...theirs].filter((id) => !mine.has(id)).length;
      const name = `'${r.remote!.name}/${b}'`;
      say(
        ahead && behind
          ? `Your branch and ${name} have diverged (${ahead} and ${behind} different commits).`
          : ahead
            ? `Your branch is ahead of ${name} by ${plural(ahead, 'commit')}.`
            : behind
              ? `Your branch is behind ${name} by ${plural(behind, 'commit')}.`
              : `Your branch is up to date with ${name}.`,
      );
    }
    if (!local) say('\nNo commits yet');
    if (r.merging) {
      say(`\nYou have unmerged paths (merging ${r.merging.label}).`);
      if (r.merging.conflicts.length) say(r.merging.conflicts.map((p) => `        both modified:   ${p}`).join('\n'), 'err');
    }
    if (c.staged.length) say(`\nChanges to be committed:\n${c.staged.map((x) => `        ${`${x.kind}:`.padEnd(12)}${x.path}`).join('\n')}`);
    if (c.unstaged.length) say(`\nChanges not staged for commit:\n${c.unstaged.map((x) => `        ${`${x.kind}:`.padEnd(12)}${x.path}`).join('\n')}`);
    if (c.untracked.length) say(`\nUntracked files:\n${c.untracked.map((p) => `        ${p}`).join('\n')}`);
    if (!c.staged.length && !c.unstaged.length && !c.untracked.length && !r.merging) say('\nnothing to commit, working tree clean');
    if (r.merging) say('Edit each conflicted file, remove the <<<<<<< ======= >>>>>>> lines, git add it, then git commit.', 'tip');
    else if (c.unstaged.length || c.untracked.length) say('Red files are changed but not staged. Use git add <file> (or git add .) to stage them.', 'tip');
    else if (c.staged.length) say('Staged changes are ready. Save them with git commit -m "message".', 'tip');
  },

  add(r, a, say) {
    if (!a.length) throw new GitError('Nothing specified, nothing added. Try git add . to stage everything.');
    const all = a.some((p) => p === '.' || p === '-A' || p === '--all');
    const paths = all ? allPaths(r.working, r.index) : a;
    for (const p of paths) {
      if (p in r.working) r.index[p] = r.working[p];
      else if (p in r.index) delete r.index[p];
      else throw new GitError(`fatal: pathspec '${p}' did not match any files`);
      if (r.merging) r.merging.conflicts = r.merging.conflicts.filter((c) => c !== p);
    }
    say(r.merging && !r.merging.conflicts.length ? 'All conflicts are staged. Finish the merge with git commit.' : 'Staged: these changes will go into your next commit.', 'tip');
  },

  rm(r, a, say) {
    const cached = a.includes('--cached');
    const paths = a.filter((p) => !p.startsWith('-'));
    if (!paths.length) throw new GitError('Name a file: git rm <file>');
    for (const p of paths) {
      if (!(p in r.index)) throw new GitError(`fatal: pathspec '${p}' did not match any tracked files`);
      delete r.index[p];
      if (!cached) delete r.working[p];
      say(`rm '${p}'`);
    }
    say(cached ? 'Git stops tracking the file but keeps it on disk.' : 'The file is deleted and the deletion is staged.', 'tip');
  },

  commit(r, a, say) {
    let message: string | undefined;
    let all = false;
    let amend = false;
    for (let i = 0; i < a.length; i++) {
      const t = a[i];
      if (t === '-m' || t === '--message') message = a[++i];
      else if (t === '-a' || t === '--all') all = true;
      else if (t === '-am') {
        all = true;
        message = a[++i];
      } else if (t === '--amend') amend = true;
      else if (t !== '--no-edit') throw new GitError(`Unknown option '${t}'. Use git commit -m "message".`);
    }
    if (message === undefined && !amend) throw new GitError('Add a message with -m, e.g. git commit -m "Add login page". (This playground has no text editor.)');
    if (message !== undefined && !message.trim()) throw new GitError('Aborting commit due to empty commit message.');
    if (all)
      for (const p of allPaths(r.index, headFiles(r))) {
        if (p in r.working) r.index[p] = r.working[p];
        else delete r.index[p];
      }
    const marked = Object.keys(r.index).filter((p) => r.index[p].includes(CONFLICT_MARK));
    if (marked.length) throw new GitError(`${marked.join(', ')} still has conflict markers (<<<<<<<). Edit the file, remove them, then git add it.`);
    if (r.merging?.conflicts.length) throw new GitError(`Fix and git add the conflicted files first: ${r.merging.conflicts.join(', ')}.`);
    const head = headId(r);
    let parents: string[];
    if (amend) {
      if (!head) throw new GitError('There is no commit to amend yet.');
      parents = r.commits[head].parents;
      message ??= r.commits[head].message;
    } else {
      if (!r.merging && sameFiles(r.index, headFiles(r))) {
        const c = changes(r);
        throw new GitError(
          c.unstaged.length || c.untracked.length ? 'Nothing is staged, so there is nothing to commit. Stage changes first with git add.' : 'nothing to commit, working tree clean',
        );
      }
      parents = [...(head ? [head] : []), ...(r.merging ? [r.merging.theirs] : [])];
    }
    const id = addCommit(r, message!, parents, r.index);
    moveHead(r, id);
    const changed = allPaths(filesOf(r, parents[0] ?? null), r.index).filter((p) => filesOf(r, parents[0] ?? null)[p] !== r.index[p]).length;
    say(`[${branchName(r) ?? 'detached HEAD'}${parents.length ? '' : ' (root-commit)'} ${id}] ${message}\n ${plural(changed, 'file')} changed`);
    say(
      r.merging
        ? 'Merge finished: this commit has two parents.'
        : amend
          ? 'The last commit was replaced with a new one (new id). Avoid amending commits you already pushed.'
          : 'Saved a snapshot. The branch label moved to the new commit.',
      'tip',
    );
    r.merging = null;
  },

  log(r, a, say) {
    let max = Infinity;
    for (let i = 0; i < a.length; i++) {
      if (a[i] === '-n') max = Number(a[++i]);
      else if (/^-\d+$/.test(a[i])) max = Number(a[i].slice(1));
    }
    const oneline = a.includes('--oneline');
    let list = a.includes('--all') ? visibleCommits(r) : [...ancestors(r, headId(r))].map((id) => r.commits[id]);
    if (!list.length) throw new GitError(`fatal: your current branch '${branchName(r) ?? 'HEAD'}' does not have any commits yet`);
    list = list.sort((x, y) => y.seq - x.seq).slice(0, Number.isFinite(max) ? max : undefined);
    for (const c of list) {
      const refs = refsAt(r, c.id).map((x) => x.label);
      const decor = refs.length ? ` (${refs.join(', ')})` : '';
      say(oneline ? `${c.id}${decor} ${c.message}` : `commit ${c.id}${decor}${c.parents.length > 1 ? `\nMerge: ${c.parents.join(' ')}` : ''}\n\n    ${c.message}\n`);
    }
  },

  branch(r, a, say) {
    const flags = a.filter((t) => t.startsWith('-'));
    const names = a.filter((t) => !t.startsWith('-'));
    if (flags.some((f) => f === '-d' || f === '-D' || f === '--delete')) {
      const force = flags.includes('-D');
      if (!names.length) throw new GitError('Name the branch to delete: git branch -d <name>');
      for (const n of names) {
        const id = r.branches[n];
        if (!id) throw new GitError(`error: branch '${n}' not found.`);
        if (branchName(r) === n) throw new GitError(`Cannot delete branch '${n}' because you're on it. Switch to another branch first.`);
        const head = headId(r);
        if (!force && (!head || !isAncestor(r, id, head)))
          throw new GitError(`The branch '${n}' is not fully merged. Use git branch -D ${n} to delete it anyway (its commits disappear from the graph).`);
        delete r.branches[n];
        say(`Deleted branch ${n} (was ${id}).`);
      }
      return;
    }
    if (flags.some((f) => f === '-m' || f === '-M')) {
      const [from, to] = names.length === 2 ? names : [branchName(r), names[0]];
      if (!from || !to) throw new GitError('Rename with git branch -m <old> <new> (or just <new> for the current branch).');
      validBranchName(to);
      if (r.branches[to]) throw new GitError(`fatal: a branch named '${to}' already exists`);
      if (r.branches[from]) {
        r.branches[to] = r.branches[from];
        delete r.branches[from];
      } else if (branchName(r) !== from) throw new GitError(`error: branch '${from}' not found.`);
      if (branchName(r) === from) r.head = { kind: 'branch', name: to };
      return;
    }
    if (!names.length) {
      const list = Object.keys(r.branches).sort();
      const current = branchName(r);
      if (current && !list.includes(current)) list.unshift(current);
      for (const n of list) say(`${n === current ? '*' : ' '} ${n}`);
      if (flags.includes('-a') || flags.includes('--all')) for (const n of Object.keys(r.remote?.branches ?? {}).sort()) say(`  remotes/${r.remote!.name}/${n}`);
      return;
    }
    createBranch(r, names[0], names[1]);
    say(`A branch is a movable label on a commit. Switch to it with git switch ${names[0]}.`, 'tip');
  },

  switch(r, a, say) {
    const create = a.find((t) => t === '-c' || t === '-C' || t === '--create');
    const names = a.filter((t) => !t.startsWith('-'));
    if (!names.length) throw new GitError('Name a branch: git switch <branch> (or git switch -c <new-branch>).');
    notMerging(r);
    if (create) {
      createBranch(r, names[0], names[1]);
      return switchBranch(r, names[0], say, true);
    }
    if (!r.branches[names[0]] && r.remote?.branches[names[0]]) {
      r.branches[names[0]] = r.remote.branches[names[0]];
      say(`branch '${names[0]}' set up to track '${r.remote.name}/${names[0]}'.`);
    }
    if (!r.branches[names[0]] && branchName(r) !== names[0])
      throw new GitError(`fatal: invalid reference: ${names[0]}. To create it: git switch -c ${names[0]}`);
    switchBranch(r, names[0], say, false);
  },

  checkout(r, a, say) {
    if (a[0] === '-b' || a[0] === '-B') {
      if (!a[1]) throw new GitError('Name the new branch: git checkout -b <name>');
      notMerging(r);
      createBranch(r, a[1], a[2]);
      return switchBranch(r, a[1], say, true);
    }
    const dash = a.indexOf('--');
    if (dash >= 0) return restoreFiles(r, a.slice(dash + 1), false, say);
    const target = a[0];
    if (!target) throw new GitError('Name a branch or commit: git checkout <branch>');
    notMerging(r);
    if (r.branches[target] || branchName(r) === target) return switchBranch(r, target, say, false);
    let id: string | null = null;
    try {
      id = resolve(r, target);
    } catch (e) {
      if (!(e instanceof GitError) || !(target in r.index)) throw e;
    }
    if (!id) return restoreFiles(r, [target], false, say);
    checkoutFiles(r, filesOf(r, id));
    r.head = { kind: 'detached', id };
    say(`HEAD is now at ${short(r, id)}`);
    say("Detached HEAD: you're looking at a commit, not a branch. New commits here belong to no branch; use git switch -c <name> to keep them.", 'tip');
  },

  restore(r, a, say) {
    const staged = a.includes('--staged') || a.includes('-S');
    restoreFiles(r, a.filter((t) => !t.startsWith('-')), staged, say);
  },

  merge(r, a, say) {
    if (a.includes('--abort')) {
      if (!r.merging) throw new GitError('There is no merge to abort.');
      r.merging = null;
      setSnapshot(r, headFiles(r));
      return say('Merge cancelled. Your files are back to how they were before the merge.', 'tip');
    }
    const target = a.find((t) => !t.startsWith('-'));
    if (!target) throw new GitError('Name the branch to merge: git merge <branch>');
    notMerging(r);
    mergeInto(r, resolve(r, target), target, a.includes('--no-ff'), say);
  },

  rebase(r, a, say) {
    if (a.some((t) => t === '--continue' || t === '--abort' || t === '--skip'))
      throw new GitError('This playground applies a rebase in one step, so there is nothing to continue or abort.');
    const target = a.find((t) => !t.startsWith('-'));
    if (!target) throw new GitError('Name the branch to rebase onto: git rebase <branch>');
    notMerging(r);
    const head = requireCommit(r);
    if (!isClean(r)) throw new GitError('Commit or stash your changes before rebasing.');
    const up = resolve(r, target);
    if (isAncestor(r, up, head)) return say('Current branch is up to date.');
    if (isAncestor(r, head, up)) {
      moveHead(r, up);
      setSnapshot(r, filesOf(r, up));
      return say(`Fast-forwarded ${branchName(r) ?? 'HEAD'} to ${target}.`);
    }
    const upstream = ancestors(r, up);
    const replay = [...ancestors(r, head)]
      .filter((id) => !upstream.has(id))
      .map((id) => r.commits[id])
      .filter((c) => c.parents.length === 1)
      .sort((x, y) => x.seq - y.seq);
    let tip = up;
    for (const c of replay) {
      const res = merge3(filesOf(r, c.parents[0]), filesOf(r, tip), c.files, 'HEAD', c.id);
      if (res.conflicts.length)
        throw new GitError(
          `Rebase stopped: replaying "${c.message}" conflicts in ${res.conflicts.join(', ')}, so the playground undid the rebase. Try git merge ${target} instead, which lets you fix conflicts by hand.`,
        );
      if (!sameFiles(res.files, filesOf(r, tip))) tip = addCommit(r, c.message, [tip], res.files);
    }
    moveHead(r, tip);
    setSnapshot(r, filesOf(r, tip));
    say(`Successfully rebased and updated ${branchName(r) ? `refs/heads/${branchName(r)}` : 'HEAD'}.`);
    say(`Your ${plural(replay.length, 'commit')} were copied on top of ${target} with new ids, so the history is a straight line. Don't rebase commits others already pulled.`, 'tip');
  },

  reset(r, a, say) {
    const mode = a.includes('--hard') ? 'hard' : a.includes('--soft') ? 'soft' : 'mixed';
    const positional = a.filter((t) => !t.startsWith('-'));
    const spec = positional[0] ?? 'HEAD';
    if (positional.length && !a.some((t) => t.startsWith('--')) && (spec in r.index || spec in headFiles(r)) && !r.branches[spec] && !r.tags[spec])
      return restoreFiles(r, positional, true, say);
    requireCommit(r);
    if (mode === 'soft' && r.merging) throw new GitError('Cannot do a soft reset in the middle of a merge. Use git merge --abort.');
    const target = resolve(r, spec);
    moveHead(r, target);
    r.merging = null;
    if (mode === 'soft') return say('The branch moved back. Changes from the undone commits are staged, ready to commit again.', 'tip');
    if (mode === 'mixed') {
      r.index = { ...filesOf(r, target) };
      const unstaged = changes(r).unstaged.map((c) => `M\t${c.path}`);
      if (unstaged.length) say(`Unstaged changes after reset:\n${unstaged.join('\n')}`);
      return say('The branch moved back. Your files keep the changes, but nothing is staged.', 'tip');
    }
    setSnapshot(r, filesOf(r, target));
    say(`HEAD is now at ${short(r, target)}`);
    say('Hard reset: the branch moved back and uncommitted changes to tracked files were thrown away.', 'tip');
  },

  revert(r, a, say) {
    const spec = a.find((t) => !t.startsWith('-'));
    if (!spec) throw new GitError('Name the commit to undo: git revert <commit>');
    notMerging(r);
    const head = requireCommit(r);
    if (!isClean(r)) throw new GitError('Commit or stash your changes before reverting.');
    const c = r.commits[resolve(r, spec)];
    if (c.parents.length > 1) throw new GitError("Reverting a merge commit isn't supported in this playground.");
    const res = merge3(c.files, headFiles(r), filesOf(r, c.parents[0] ?? null), 'HEAD', `parent of ${c.id}`);
    if (res.conflicts.length) throw new GitError(`Revert would conflict in ${res.conflicts.join(', ')}: later commits changed the same files. Nothing was changed.`);
    if (sameFiles(res.files, headFiles(r))) throw new GitError('Nothing to revert: those changes are already gone.');
    const id = addCommit(r, `Revert "${c.message}"`, [head], res.files);
    moveHead(r, id);
    setSnapshot(r, res.files);
    say(`[${branchName(r) ?? 'detached HEAD'} ${id}] Revert "${c.message}"`);
    say('Revert adds a new commit that undoes the old one, so history is never rewritten. Safe on shared branches.', 'tip');
  },

  'cherry-pick'(r, a, say) {
    const spec = a.find((t) => !t.startsWith('-'));
    if (!spec) throw new GitError('Name the commit to copy: git cherry-pick <commit>');
    notMerging(r);
    const head = requireCommit(r);
    if (!isClean(r)) throw new GitError('Commit or stash your changes before cherry-picking.');
    const c = r.commits[resolve(r, spec)];
    if (c.parents.length > 1) throw new GitError("Cherry-picking a merge commit isn't supported in this playground.");
    const res = merge3(filesOf(r, c.parents[0] ?? null), headFiles(r), c.files, 'HEAD', c.id);
    if (res.conflicts.length) throw new GitError(`Cherry-pick would conflict in ${res.conflicts.join(', ')}. Nothing was changed.`);
    if (sameFiles(res.files, headFiles(r))) throw new GitError('Nothing to do: those changes are already on this branch.');
    const id = addCommit(r, c.message, [head], res.files);
    moveHead(r, id);
    setSnapshot(r, res.files);
    say(`[${branchName(r) ?? 'detached HEAD'} ${id}] ${c.message}`);
    say(`Copied the changes from ${c.id} as a new commit with a new id. The original stays where it was.`, 'tip');
  },

  stash(r, a, say) {
    const sub = a[0] && !a[0].startsWith('-') ? a[0] : 'push';
    const n = Number(/^stash@\{(\d+)\}$/.exec(a[1] ?? '')?.[1] ?? a[1] ?? 0);
    if (sub === 'list') return r.stash.forEach((s, i) => say(`stash@{${i}}: ${s.message}`));
    if (sub === 'clear') {
      r.stash = [];
      return;
    }
    if (sub === 'push' || sub === 'save') {
      notMerging(r);
      const head = requireCommit(r);
      if (isClean(r)) return say('No local changes to save');
      const m = a.indexOf('-m');
      const message = `${m >= 0 && a[m + 1] ? 'On' : 'WIP on'} ${branchName(r) ?? '(no branch)'}: ${m >= 0 && a[m + 1] ? a[m + 1] : short(r, head)}`;
      const tracked = allPaths(r.index, headFiles(r));
      r.stash.unshift({ message, base: head, working: Object.fromEntries(tracked.filter((p) => p in r.working).map((p) => [p, r.working[p]])) });
      setSnapshot(r, headFiles(r));
      say(`Saved working directory and index state ${message}`);
      return say('Your changes are put aside and the files are clean again. Bring them back with git stash pop.', 'tip');
    }
    const entry = r.stash[n];
    if (sub === 'drop') {
      if (!entry) throw new GitError(`stash@{${n}} doesn't exist.`);
      r.stash.splice(n, 1);
      return say(`Dropped stash@{${n}}`);
    }
    if (sub === 'show') {
      if (!entry) throw new GitError(`stash@{${n}} doesn't exist.`);
      const base = filesOf(r, entry.base);
      return say(allPaths(base, entry.working).filter((p) => base[p] !== entry.working[p]).join('\n') || '(no changes)');
    }
    if (sub === 'pop' || sub === 'apply') {
      if (!entry) throw new GitError('No stash entries found.');
      if (!isClean(r)) throw new GitError('Commit or stash your current changes before applying a stash.');
      const res = merge3(filesOf(r, entry.base), headFiles(r), entry.working, 'Updated upstream', 'Stashed changes');
      if (res.conflicts.length) throw new GitError(`Applying the stash would conflict in ${res.conflicts.join(', ')}. Nothing was changed.`);
      const untracked = Object.fromEntries(changes(r).untracked.map((p) => [p, r.working[p]]));
      r.working = { ...res.files, ...untracked };
      if (sub === 'pop') r.stash.splice(n, 1);
      say(sub === 'pop' ? `Restored and dropped stash@{${n}}` : `Applied stash@{${n}} (it is still in the list)`);
      return say('Your saved changes are back in the files (not staged).', 'tip');
    }
    throw new GitError(`Unknown stash command '${sub}'. Try git stash, git stash pop or git stash list.`);
  },

  tag(r, a, say) {
    const names = a.filter((t, i) => !t.startsWith('-') && a[i - 1] !== '-m');
    if (a.includes('-d')) {
      if (!r.tags[names[0]]) throw new GitError(`error: tag '${names[0] ?? ''}' not found.`);
      delete r.tags[names[0]];
      return say(`Deleted tag '${names[0]}'`);
    }
    if (!names.length) return Object.keys(r.tags).sort().forEach((t) => say(t));
    if (r.tags[names[0]]) throw new GitError(`fatal: tag '${names[0]}' already exists`);
    if (!/^[A-Za-z0-9._-]+$/.test(names[0])) throw new GitError('Tag names can use letters, numbers, dots, dashes and underscores.');
    r.tags[names[0]] = resolve(r, names[1] ?? 'HEAD');
    say('A tag is a label that never moves, handy for releases like v1.0.', 'tip');
  },

  diff(r, a, say) {
    const staged = a.includes('--staged') || a.includes('--cached');
    const positional = a.filter((t) => !t.startsWith('-'));
    let from: Files;
    let to: Files;
    let only: string[] = [];
    const refs = positional.filter((p) => !(p in r.working) && !(p in r.index));
    if (refs.length) {
      from = filesOf(r, resolve(r, refs[0]));
      to = refs[1] ? filesOf(r, resolve(r, refs[1])) : r.working;
    } else if (staged) {
      from = headFiles(r);
      to = r.index;
    } else {
      from = r.index;
      to = Object.fromEntries(Object.keys(r.index).filter((p) => p in r.working).map((p) => [p, r.working[p]]));
      for (const p of Object.keys(r.index)) if (!(p in r.working)) delete to[p];
    }
    only = positional.filter((p) => !refs.includes(p));
    const out = diffText(from, to, only);
    if (out) say(out);
    else say(staged ? 'Nothing is staged.' : 'No unstaged changes. (Try git diff --staged for staged ones.)', 'tip');
  },

  show(r, a, say) {
    const c = r.commits[resolve(r, a.find((t) => !t.startsWith('-')) ?? 'HEAD')];
    const refs = refsAt(r, c.id).map((x) => x.label);
    say(`commit ${c.id}${refs.length ? ` (${refs.join(', ')})` : ''}${c.parents.length > 1 ? `\nMerge: ${c.parents.join(' ')}` : ''}\n\n    ${c.message}`);
    const out = diffText(filesOf(r, c.parents[0] ?? null), c.files, []);
    if (out) say(out);
  },

  remote(r, a, say) {
    if (!a.length || a[0] === '-v') {
      if (r.remote) say(a[0] === '-v' ? `${r.remote.name}\t${r.remote.url} (fetch)\n${r.remote.name}\t${r.remote.url} (push)` : r.remote.name);
      return;
    }
    if (a[0] === 'add') {
      if (!a[1] || !a[2]) throw new GitError('Use git remote add origin https://example.com/me/project.git');
      if (r.remote) throw new GitError(`error: remote ${r.remote.name} already exists.`);
      r.remote = { name: a[1], url: a[2], branches: {} };
      return say("Remote added. It's pretend: nothing is ever sent over the network.", 'tip');
    }
    if (a[0] === 'remove' || a[0] === 'rm') {
      if (!r.remote || r.remote.name !== a[1]) throw new GitError(`error: No such remote: '${a[1] ?? ''}'`);
      r.remote = null;
      return;
    }
    throw new GitError('Try git remote add origin <url>, git remote -v or git remote remove origin.');
  },

  push(r, a, say) {
    if (!r.remote) throw new GitError('No remote yet. Add a pretend one with: git remote add origin https://example.com/me/project.git');
    const force = a.includes('--force') || a.includes('-f');
    const [remoteName = r.remote.name, branch = branchName(r)] = a.filter((t) => !t.startsWith('-'));
    if (remoteName !== r.remote.name) throw new GitError(`fatal: '${remoteName}' does not appear to be a git repository`);
    if (!branch) throw new GitError("You're in detached HEAD. Switch to a branch before pushing.");
    const local = r.branches[branch];
    if (!local) throw new GitError(`error: src refspec ${branch} does not match any (make a commit on it first)`);
    const theirs = r.remote.branches[branch];
    if (theirs === local) return say('Everything up-to-date');
    if (theirs && !isAncestor(r, theirs, local) && !force)
      throw new GitError(
        `! [rejected] ${branch} -> ${branch} (non-fast-forward)\nThe remote has commits you don't have. Run git pull first. (--force would overwrite them, which can delete other people's work.)`,
      );
    r.remote.branches[branch] = local;
    say(`To ${r.remote.url}\n   ${theirs ? `${theirs}..${local}` : '* [new branch]'}  ${branch} -> ${branch}`);
    say(`The remote's ${branch} now matches yours (shown as ${r.remote.name}/${branch} on the graph).`, 'tip');
  },

  fetch(r, _a, say) {
    if (!r.remote) throw new GitError('No remote yet. Add one with git remote add origin <url>.');
    say('Already up to date.');
  },

  pull(r, _a, say) {
    if (!r.remote) throw new GitError('No remote yet. Add one with git remote add origin <url>.');
    notMerging(r);
    const branch = branchName(r);
    const theirs = branch && r.remote.branches[branch];
    if (!theirs) throw new GitError(`There is no '${branch ?? 'HEAD'}' on ${r.remote.name} yet. Push it first: git push -u ${r.remote.name} ${branch ?? 'main'}`);
    mergeInto(r, theirs, `${r.remote.name}/${branch}`, false, say);
  },
};

function validBranchName(name: string) {
  if (!/^[A-Za-z0-9._/-]+$/.test(name) || name.startsWith('-') || name.includes('..') || name.endsWith('/'))
    throw new GitError(`'${name}' is not a valid branch name. Use letters, numbers, dashes, dots and slashes (like feature/login).`);
}

function createBranch(r: Repo, name: string, start?: string) {
  validBranchName(name);
  if (r.branches[name] || branchName(r) === name) throw new GitError(`fatal: a branch named '${name}' already exists`);
  if (!start) requireCommit(r);
  r.branches[name] = resolve(r, start ?? 'HEAD');
}

function switchBranch(r: Repo, name: string, say: Say, created: boolean) {
  if (branchName(r) === name && !created) return say(`Already on '${name}'`);
  checkoutFiles(r, filesOf(r, r.branches[name] ?? null));
  r.head = { kind: 'branch', name };
  say(created ? `Switched to a new branch '${name}'` : `Switched to branch '${name}'`);
  say(created ? 'New commits will move this branch, not the one you came from.' : 'Your files now show this branch. New commits go on it.', 'tip');
}

function restoreFiles(r: Repo, paths: string[], staged: boolean, say: Say) {
  if (!paths.length) throw new GitError('Name a file: git restore <file> (or --staged <file> to unstage it).');
  const head = headFiles(r);
  const list = paths.includes('.') ? allPaths(staged ? r.index : r.working, staged ? head : r.index) : paths;
  for (const p of list) {
    const from = staged ? head : r.index;
    const to = staged ? r.index : r.working;
    if (!(p in from) && !(p in to)) throw new GitError(`error: pathspec '${p}' did not match any file known to git`);
    if (!staged && !(p in from)) continue;
    if (p in from) to[p] = from[p];
    else delete to[p];
  }
  say(staged ? 'Unstaged. The file keeps your edits, but they will not be in the next commit.' : 'The file is back to its last staged or committed version. Your edits were discarded.', 'tip');
}

function mergeInto(r: Repo, theirs: string, label: string, noFastForward: boolean, say: Say) {
  const head = headId(r);
  if (!head) {
    checkoutFiles(r, filesOf(r, theirs));
    moveHead(r, theirs);
    return say(`Fast-forward to ${label}`);
  }
  if (isAncestor(r, theirs, head)) return say('Already up to date.');
  if (isAncestor(r, head, theirs) && !noFastForward) {
    checkoutFiles(r, filesOf(r, theirs));
    moveHead(r, theirs);
    say(`Updating ${head}..${theirs}\nFast-forward`);
    return say(`Fast-forward: this branch had no new commits of its own, so git just moved its label up to ${label}. No merge commit needed.`, 'tip');
  }
  if (!isClean(r)) throw new GitError('Commit or stash your changes before merging.');
  const res = merge3(filesOf(r, mergeBase(r, head, theirs)), headFiles(r), filesOf(r, theirs), 'HEAD', label);
  if (res.conflicts.length) {
    const ours = headFiles(r);
    setSnapshot(r, res.files);
    for (const p of res.conflicts) {
      if (p in ours) r.index[p] = ours[p];
      else delete r.index[p];
    }
    r.merging = { theirs, label, conflicts: res.conflicts };
    for (const p of res.conflicts) say(`CONFLICT (content): Merge conflict in ${p}`, 'err');
    say('Automatic merge failed; fix conflicts and then commit the result.', 'err');
    return say(
      'Both branches changed the same file. Open it, keep the lines you want and delete the <<<<<<<, ======= and >>>>>>> markers. Then git add the file and git commit.',
      'tip',
    );
  }
  const id = addCommit(r, `Merge ${label.includes('/') ? 'remote-tracking branch' : 'branch'} '${label}'${branchName(r) && branchName(r) !== 'main' ? ` into ${branchName(r)}` : ''}`, [head, theirs], res.files);
  moveHead(r, id);
  setSnapshot(r, res.files);
  say("Merge made by the 'ort' strategy.");
  say(`Created a merge commit with two parents: this branch and ${label}.`, 'tip');
}

function diffText(from: Files, to: Files, only: string[]) {
  const out: string[] = [];
  for (const p of allPaths(from, to)) {
    if ((only.length && !only.includes(p)) || from[p] === to[p]) continue;
    out.push(`diff --git a/${p} b/${p}${from[p] === undefined ? '\nnew file' : to[p] === undefined ? '\ndeleted file' : ''}`);
    out.push(...lineDiff(from[p] ?? '', to[p] ?? '').slice(0, 200));
  }
  return out.join('\n');
}
