// Git command recipes: each one turns a few validated form values into commands, a part-by-part
// explanation and a risk level. Pure data and functions; nothing is ever run.

export type Risk = 'read' | 'files' | 'history' | 'destructive';
export type Shell = 'posix' | 'powershell';
export type FieldKind = 'branch' | 'commit' | 'remote' | 'text' | 'path' | 'flag';

export interface Field {
  id: string;
  label: string;
  kind: FieldKind;
  /** Pre-filled value (flags use 'true' / ''). */
  initial: string;
  optional?: boolean;
  hint?: string;
}

/** One argument and what it does. */
export interface Part {
  arg: string;
  explain: string;
}

export interface Built {
  commands: Part[][];
  risk: Risk;
  effect: string;
  warning?: string;
  safer?: string[];
}

export interface Recipe {
  id: string;
  area: string;
  title: string;
  fields: Field[];
  build: (v: Record<string, string>) => Built;
}

export const RISK_LABEL: Record<Risk, string> = {
  read: 'Read-only',
  files: 'Changes working files',
  history: 'Rewrites history',
  destructive: 'Destructive',
};

// ---------- validation ----------

/** Git's ref-name rules (git check-ref-format), for branch and tag names. Returns an error or null. */
export function refNameError(name: string): string | null {
  if (!name) return 'Required.';
  // Git forbids control characters in ref names, so matching them is the point.
  // oxlint-disable-next-line no-control-regex
  if (/[\s~^:?*[\\\x00-\x1f\x7f]/.test(name)) return 'No spaces or ~ ^ : ? * [ \\ characters.';
  if (name.includes('..')) return 'Can’t contain “..”.';
  if (name.includes('@{')) return 'Can’t contain “@{”.';
  if (name === '@') return 'Can’t be just “@”.';
  if (name.startsWith('-')) return 'Can’t start with “-”.';
  if (name.startsWith('/') || name.endsWith('/') || name.includes('//')) return 'No leading, trailing or double “/”.';
  if (name.endsWith('.') || name.endsWith('.lock')) return 'Can’t end with “.” or “.lock”.';
  if (name.split('/').some((c) => c.startsWith('.'))) return 'No part may start with “.”.';
  return null;
}

/** A commit: a hash (4–40 hex digits) or a ref, optionally followed by ~n / ^n. */
export function commitError(v: string): string | null {
  if (!v) return 'Required.';
  if (/^[0-9a-f]{4,40}$/i.test(v)) return null;
  const m = /^(.+?)((?:[~^]\d*)*)$/.exec(v)!;
  return m[1] === 'HEAD' || !refNameError(m[1]) ? null : 'Use a commit hash, a branch or tag name, or something like HEAD~1.';
}

export function fieldError(f: Field, v: string): string | null {
  if (f.kind === 'flag') return null;
  if (!v.trim()) return f.optional ? null : 'Required.';
  if (f.kind === 'branch') return refNameError(v);
  if (f.kind === 'commit') return commitError(v);
  if (f.kind === 'remote') return /^[A-Za-z0-9][\w.-]*$/.test(v) ? null : 'Letters, digits, “.”, “_” and “-” only.';
  if (/[\r\n]/.test(v) && f.kind === 'path') return 'One path, on one line.';
  return null;
}

// ---------- quoting ----------

/**
 * Quotes an argument for the chosen shell, leaving plain words alone. `^` (a glob in zsh), a leading
 * `~` (home directory), `,` (an array in PowerShell), `@`, `{` and spaces always get quotes.
 */
export function quote(arg: string, shell: Shell): string {
  if (/^[A-Za-z0-9_+=:./-][A-Za-z0-9_+=:./~-]*$/.test(arg)) return arg;
  return shell === 'powershell' ? `'${arg.replace(/'/g, "''")}'` : `'${arg.replace(/'/g, `'\\''`)}'`;
}

export const render = (cmd: Part[], shell: Shell) => cmd.map((p) => quote(p.arg, shell)).join(' ');

// ---------- recipes ----------

const git = (explain = 'Runs git'): Part => ({ arg: 'git', explain });
const p = (arg: string, explain: string): Part => ({ arg, explain });
const on = (v: string) => v === 'true';
const f = (id: string, label: string, kind: FieldKind, initial = '', extra: Partial<Field> = {}): Field => ({ id, label, kind, initial, ...extra });

export const RECIPES: Recipe[] = [
  // ---- Inspect
  {
    id: 'status',
    area: 'Inspect',
    title: 'See what changed',
    fields: [f('short', 'Short format', 'flag', 'true')],
    build: (v) => ({
      commands: [[git(), p('status', 'Shows staged, unstaged and untracked files'), ...(on(v.short) ? [p('--short', 'One line per file (XY codes)'), p('--branch', 'Plus the branch and how far it is ahead or behind')] : [])]],
      risk: 'read',
      effect: 'Prints the state of your working tree. Nothing changes.',
    }),
  },
  {
    id: 'log',
    area: 'Inspect',
    title: 'View history',
    fields: [f('count', 'How many commits', 'text', '20', { optional: true }), f('graph', 'Show branch graph', 'flag', 'true'), f('path', 'Only commits touching this path', 'path', '', { optional: true })],
    build: (v) => {
      const n = /^\d+$/.test(v.count) ? v.count : '';
      return {
        commands: [
          [
            git(),
            p('log', 'Lists commits, newest first'),
            p('--oneline', 'One line per commit: short hash and subject'),
            ...(on(v.graph) ? [p('--graph', 'Draws the branch and merge lines'), p('--decorate', 'Shows branch and tag names')] : []),
            ...(n ? [p(`-n${n}`, `Stops after ${n} commits`)] : []),
            ...(v.path ? [p('--', 'Everything after this is a path, not an option or branch'), p(v.path, 'Only commits that changed this path')] : []),
          ],
        ],
        risk: 'read',
        effect: 'Prints history. Nothing changes.',
      };
    },
  },
  {
    id: 'diff',
    area: 'Inspect',
    title: 'Show line changes',
    fields: [f('staged', 'Staged changes (what the next commit will contain)', 'flag'), f('path', 'Only this path', 'path', '', { optional: true })],
    build: (v) => ({
      commands: [[git(), p('diff', 'Shows line-by-line changes'), ...(on(v.staged) ? [p('--staged', 'Compares the staging area with the last commit')] : []), ...(v.path ? [p('--', 'Paths follow'), p(v.path, 'Limits the diff to this path')] : [])]],
      risk: 'read',
      effect: on(v.staged) ? 'Prints what is staged for the next commit.' : 'Prints changes you haven’t staged yet.',
    }),
  },
  // ---- Branches
  {
    id: 'branch-create',
    area: 'Branches',
    title: 'Create a branch and switch to it',
    fields: [f('name', 'New branch', 'branch', 'feature/login'), f('from', 'Start from', 'commit', 'main', { optional: true, hint: 'Empty = where you are now.' })],
    build: (v) => ({
      commands: [[git(), p('switch', 'Changes the current branch'), p('-c', 'Creates the branch first'), p(v.name, 'The new branch name'), ...(v.from ? [p(v.from, 'Where the new branch starts')] : [])]],
      risk: 'files',
      effect: 'Creates the branch and checks it out. Uncommitted changes come along with you.',
    }),
  },
  {
    id: 'branch-switch',
    area: 'Branches',
    title: 'Switch branch',
    fields: [f('name', 'Branch', 'branch', 'main')],
    build: (v) => ({
      commands: [[git(), p('switch', 'Changes the current branch'), p(v.name, 'The branch to switch to')]],
      risk: 'files',
      effect: 'Updates your files to that branch. Git refuses if uncommitted changes would be overwritten.',
    }),
  },
  {
    id: 'branch-rename',
    area: 'Branches',
    title: 'Rename a branch everywhere',
    fields: [f('old', 'Current name', 'branch', 'feature/old'), f('new', 'New name', 'branch', 'feature/new'), f('remote', 'Remote', 'remote', 'origin'), f('everywhere', 'Also rename it on the remote', 'flag', 'true')],
    build: (v) => {
      const commands: Part[][] = [[git(), p('branch', 'Manages branches'), p('-m', 'Moves (renames) a branch'), p(v.old, 'The old name'), p(v.new, 'The new name')]];
      if (on(v.everywhere)) {
        commands.push(
          [git(), p('push', 'Uploads to a remote'), p('-u', 'Sets the new remote branch as upstream'), p(v.remote, 'The remote'), p(v.new, 'Creates the branch there under its new name')],
          [git(), p('push', 'Uploads to a remote'), p(v.remote, 'The remote'), p('--delete', 'Deletes a remote branch'), p(v.old, 'The old name on the remote')],
        );
      }
      return {
        commands,
        risk: on(v.everywhere) ? 'destructive' : 'history',
        effect: on(v.everywhere) ? 'Renames the branch locally, pushes it under the new name and deletes the old remote branch.' : 'Renames the branch in your repository only.',
        warning: on(v.everywhere) ? 'Teammates with the old branch checked out must rename theirs, and open pull requests on the old name may close.' : undefined,
      };
    },
  },
  {
    id: 'branch-delete',
    area: 'Branches',
    title: 'Delete a branch',
    fields: [f('name', 'Branch', 'branch', 'feature/done'), f('force', 'Even if it isn’t merged', 'flag')],
    build: (v) => ({
      commands: [[git(), p('branch', 'Manages branches'), on(v.force) ? p('-D', 'Deletes even if its commits aren’t merged anywhere') : p('-d', 'Deletes only if it is fully merged'), p(v.name, 'The branch to delete')]],
      risk: on(v.force) ? 'destructive' : 'history',
      effect: 'Removes the branch name. Its commits stay recoverable through the reflog for about 90 days.',
      warning: on(v.force) ? 'Unmerged commits on this branch will no longer be reachable by name.' : undefined,
      safer: on(v.force) ? ['git branch -d <branch> refuses if the branch isn’t merged, so you can check first.', 'Note the last commit (git rev-parse <branch>) so you can recreate it with git branch <branch> <hash>.'] : undefined,
    }),
  },
  // ---- Commits
  {
    id: 'commit',
    area: 'Commits',
    title: 'Commit changes',
    fields: [f('message', 'Message', 'text', 'Fix login redirect'), f('all', 'Include all tracked, modified files', 'flag')],
    build: (v) => ({
      commands: [[git(), p('commit', 'Records a new commit'), ...(on(v.all) ? [p('-a', 'Stages every modified tracked file first (not new files)')] : []), p('-m', 'Uses the next argument as the message'), p(v.message, 'The commit message')]],
      risk: 'history',
      effect: 'Adds a new commit on the current branch. Nothing existing is rewritten.',
    }),
  },
  {
    id: 'amend',
    area: 'Commits',
    title: 'Fix the last commit message',
    fields: [f('message', 'New message', 'text', 'Fix login redirect')],
    build: (v) => ({
      commands: [[git(), p('commit', 'Records a commit'), p('--amend', 'Replaces the last commit instead of adding one'), p('-m', 'New message follows'), p(v.message, 'The new message')]],
      risk: 'history',
      effect: 'Replaces the last commit with a new one (new hash). Anything staged is included too.',
      warning: 'If you already pushed the commit, pushing again needs --force-with-lease and affects anyone who pulled it.',
    }),
  },
  // ---- Remotes
  {
    id: 'push',
    area: 'Remotes',
    title: 'Push a branch',
    fields: [f('remote', 'Remote', 'remote', 'origin'), f('branch', 'Branch', 'branch', 'feature/login'), f('upstream', 'Set as upstream (first push)', 'flag', 'true'), f('force', 'Overwrite the remote branch', 'flag')],
    build: (v) => ({
      commands: [
        [
          git(),
          p('push', 'Uploads commits to a remote'),
          ...(on(v.upstream) ? [p('-u', 'Remembers this remote branch, so later git push / git pull need no arguments')] : []),
          ...(on(v.force) ? [p('--force-with-lease', 'Overwrites the remote branch, but only if nobody pushed to it since you last fetched')] : []),
          p(v.remote, 'The remote'),
          p(v.branch, 'The branch to push'),
        ],
      ],
      risk: on(v.force) ? 'destructive' : 'read',
      effect: on(v.force) ? 'Replaces the remote branch with yours. Commits only on the remote are dropped from it.' : 'Uploads new commits. Git refuses if the remote has commits you don’t have.',
      warning: on(v.force) ? 'Never force-push a shared branch such as main without telling the team.' : undefined,
      safer: on(v.force) ? ['Plain --force ignores what others pushed; --force-with-lease (used here) refuses in that case.', 'git pull --rebase first, then push without force.'] : undefined,
    }),
  },
  {
    id: 'pull',
    area: 'Remotes',
    title: 'Update from the remote',
    fields: [f('rebase', 'Rebase my commits on top (no merge commit)', 'flag', 'true')],
    build: (v) => ({
      commands: [[git(), p('pull', 'Fetches and integrates the upstream branch'), on(v.rebase) ? p('--rebase', 'Replays your local commits on top of the remote ones') : p('--no-rebase', 'Merges the remote changes in with a merge commit if needed')]],
      risk: on(v.rebase) ? 'history' : 'files',
      effect: on(v.rebase) ? 'Gets new commits and moves your unpushed commits on top of them (they get new hashes).' : 'Gets new commits and merges them into your branch.',
    }),
  },
  {
    id: 'fetch',
    area: 'Remotes',
    title: 'Fetch and clean up remote branches',
    fields: [f('remote', 'Remote', 'remote', 'origin')],
    build: (v) => ({
      commands: [[git(), p('fetch', 'Downloads commits and branches without changing your files'), p('--prune', 'Forgets remote-tracking branches deleted on the remote'), p(v.remote, 'The remote')]],
      risk: 'read',
      effect: 'Updates origin/* branches only. Your own branches and files don’t change.',
    }),
  },
  // ---- Stash
  {
    id: 'stash',
    area: 'Stash',
    title: 'Put changes aside',
    fields: [f('message', 'Note', 'text', 'work in progress', { optional: true }), f('untracked', 'Include new (untracked) files', 'flag', 'true')],
    build: (v) => ({
      commands: [[git(), p('stash', 'Saves changes and cleans the working tree'), p('push', 'Creates a new stash entry'), ...(on(v.untracked) ? [p('-u', 'Also stashes untracked files')] : []), ...(v.message ? [p('-m', 'Note follows'), p(v.message, 'Helps you find it in git stash list')] : [])]],
      risk: 'files',
      effect: 'Your changes move into the stash and the files go back to the last commit. Bring them back with git stash pop.',
    }),
  },
  {
    id: 'stash-pop',
    area: 'Stash',
    title: 'Bring stashed changes back',
    fields: [f('keep', 'Keep the stash entry (apply instead of pop)', 'flag')],
    build: (v) => ({
      commands: [[git(), p('stash', 'Works with stashed changes'), on(v.keep) ? p('apply', 'Applies the newest stash and keeps it') : p('pop', 'Applies the newest stash and removes it if it applied cleanly')]],
      risk: 'files',
      effect: 'Re-applies the most recent stash to your files. Conflicts are marked like a merge.',
    }),
  },
  // ---- Merge and rebase
  {
    id: 'merge',
    area: 'Merge & rebase',
    title: 'Merge a branch into the current one',
    fields: [f('branch', 'Branch to merge', 'branch', 'feature/login'), f('noff', 'Always create a merge commit', 'flag', 'true')],
    build: (v) => ({
      commands: [[git(), p('merge', 'Joins another branch’s history into this one'), ...(on(v.noff) ? [p('--no-ff', 'Creates a merge commit even when a fast-forward is possible')] : []), p(v.branch, 'The branch to merge in')]],
      risk: 'history',
      effect: 'Adds the branch’s commits (and maybe a merge commit) to the current branch. Existing commits are not rewritten.',
      safer: ['If conflicts get messy: git merge --abort returns to where you started.'],
    }),
  },
  {
    id: 'rebase',
    area: 'Merge & rebase',
    title: 'Rebase onto another branch',
    fields: [f('onto', 'Onto', 'branch', 'main')],
    build: (v) => ({
      commands: [[git(), p('rebase', 'Replays your commits on a new base'), p(v.onto, 'The branch to rebuild on top of')]],
      risk: 'history',
      effect: 'Your branch’s commits are recreated on top of the target, with new hashes.',
      warning: 'Don’t rebase commits other people already pulled. Pushing afterwards needs --force-with-lease.',
      safer: ['git rebase --abort returns to where you started.', 'Merging instead keeps the original commits.'],
    }),
  },
  {
    id: 'cherry-pick',
    area: 'Merge & rebase',
    title: 'Copy one commit onto this branch',
    fields: [f('commit', 'Commit', 'commit', 'a1b2c3d'), f('x', 'Note the original hash in the message', 'flag', 'true')],
    build: (v) => ({
      commands: [[git(), p('cherry-pick', 'Applies the changes of an existing commit as a new commit'), ...(on(v.x) ? [p('-x', 'Adds “(cherry picked from commit …)” to the message')] : []), p(v.commit, 'The commit to copy')]],
      risk: 'history',
      effect: 'Adds a new commit with the same changes. The original stays where it is.',
    }),
  },
  // ---- Tags
  {
    id: 'tag',
    area: 'Tags',
    title: 'Tag a release',
    fields: [f('name', 'Tag', 'branch', 'v1.2.0'), f('message', 'Message', 'text', 'Release 1.2.0'), f('remote', 'Push to remote', 'remote', 'origin', { optional: true })],
    build: (v) => {
      const commands: Part[][] = [[git(), p('tag', 'Creates a tag'), p('-a', 'Annotated: stores a message, author and date'), p(v.name, 'The tag name'), p('-m', 'Message follows'), p(v.message, 'The tag message')]];
      if (v.remote) commands.push([git(), p('push', 'Uploads to a remote'), p(v.remote, 'The remote'), p(v.name, 'Pushes just this tag')]);
      return { commands, risk: 'history', effect: 'Marks the current commit with a permanent name.' };
    },
  },
  // ---- Undo
  {
    id: 'undo-commit',
    area: 'Undo',
    title: 'Undo my last commit but keep the changes',
    fields: [f('count', 'Commits to undo', 'text', '1')],
    build: (v) => {
      const n = /^[1-9]\d*$/.test(v.count) ? v.count : '1';
      return {
        commands: [[git(), p('reset', 'Moves the current branch to another commit'), p('--soft', 'Keeps all changes staged'), p(`HEAD~${n}`, `${n} commit${n === '1' ? '' : 's'} before the current one`)]],
        risk: 'history',
        effect: `The last ${n === '1' ? 'commit is' : `${n} commits are`} removed from the branch; the changes stay staged, ready to commit again.`,
        warning: 'If those commits were pushed, use git revert instead so others aren’t affected.',
      };
    },
  },
  {
    id: 'revert',
    area: 'Undo',
    title: 'Undo a pushed commit safely',
    fields: [f('commit', 'Commit', 'commit', 'a1b2c3d')],
    build: (v) => ({
      commands: [[git(), p('revert', 'Creates a new commit that undoes another'), p(v.commit, 'The commit to undo')]],
      risk: 'history',
      effect: 'Adds a commit with the opposite changes. History isn’t rewritten, so it’s safe on shared branches.',
    }),
  },
  {
    id: 'unstage',
    area: 'Undo',
    title: 'Unstage a file',
    fields: [f('path', 'File', 'path', 'src/app.ts')],
    build: (v) => ({
      commands: [[git(), p('restore', 'Restores files'), p('--staged', 'Only the staging area; your edits stay'), p('--', 'Paths follow'), p(v.path, 'The file to unstage')]],
      risk: 'files',
      effect: 'The file is no longer staged. Your edits to it are kept.',
    }),
  },
  {
    id: 'discard',
    area: 'Undo',
    title: 'Throw away changes to a file',
    fields: [f('path', 'File', 'path', 'src/app.ts')],
    build: (v) => ({
      commands: [[git(), p('restore', 'Restores files from the staging area / last commit'), p('--', 'Paths follow'), p(v.path, 'The file to reset')]],
      risk: 'destructive',
      effect: 'Unstaged edits to this file are lost. They can’t be recovered with git.',
      safer: ['git stash push -- <file> keeps a copy you can bring back.', 'git diff -- <file> shows what you’d lose.'],
    }),
  },
  {
    id: 'reset-hard',
    area: 'Undo',
    title: 'Reset the branch to a commit, discarding everything',
    fields: [f('commit', 'Reset to', 'commit', 'origin/main')],
    build: (v) => ({
      commands: [[git(), p('reset', 'Moves the current branch'), p('--hard', 'Also overwrites the staging area and your files'), p(v.commit, 'Where the branch should point')]],
      risk: 'destructive',
      effect: 'All uncommitted changes are lost, and commits after the target leave the branch.',
      warning: 'Uncommitted work is gone for good. Committed work can still be found with git reflog for a while.',
      safer: ['git stash push -u first, so your changes can come back.', 'git reset --soft keeps your changes staged.', 'git branch backup-before-reset makes a bookmark first.'],
    }),
  },
  {
    id: 'recover-branch',
    area: 'Undo',
    title: 'Recover a deleted branch',
    fields: [f('name', 'Branch name to recreate', 'branch', 'feature/login'), f('commit', 'Its last commit (from the reflog)', 'commit', 'a1b2c3d')],
    build: (v) => ({
      commands: [
        [git(), p('reflog', 'Lists where HEAD has been, including commits on deleted branches'), p('-n30', 'The last 30 entries; find the branch’s last commit')],
        [git(), p('branch', 'Creates a branch'), p(v.name, 'The name to recreate'), p(v.commit, 'The commit it should point to')],
      ],
      risk: 'read',
      effect: 'Run the first command, find the commit, then the second recreates the branch there. Nothing is deleted.',
    }),
  },
  // ---- Cleanup
  {
    id: 'clean',
    area: 'Cleanup',
    title: 'Remove untracked files',
    fields: [f('dirs', 'Directories too', 'flag', 'true'), f('ignored', 'Ignored files too (build output, node_modules…)', 'flag'), f('force', 'Really delete (not a dry run)', 'flag')],
    build: (v) => ({
      commands: [
        [
          git(),
          p('clean', 'Deletes files git doesn’t track'),
          on(v.force) ? p('-f', 'Actually deletes (git requires this)') : p('-n', 'Dry run: only lists what would be deleted'),
          ...(on(v.dirs) ? [p('-d', 'Includes untracked directories')] : []),
          ...(on(v.ignored) ? [p('-x', 'Includes files matched by .gitignore')] : []),
        ],
      ],
      risk: on(v.force) ? 'destructive' : 'read',
      effect: on(v.force) ? 'Untracked files are deleted from disk. They aren’t in git, so they can’t be recovered.' : 'Lists the files that would be deleted. Nothing changes.',
      safer: on(v.force) ? ['Run it with -n (untick “Really delete”) first and read the list.', 'git clean -i asks about each file.'] : undefined,
    }),
  },
];

export const AREAS = [...new Set(RECIPES.map((r) => r.area))];

export function initialValues(r: Recipe): Record<string, string> {
  return Object.fromEntries(r.fields.map((x) => [x.id, x.initial]));
}

/** Validation errors by field id; empty when the recipe can be built. */
export function errorsFor(r: Recipe, v: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const x of r.fields) {
    const e = fieldError(x, (v[x.id] ?? '').trim());
    if (e) out[x.id] = e;
  }
  return out;
}

export function buildRecipe(r: Recipe, v: Record<string, string>): Built | null {
  if (Object.keys(errorsFor(r, v)).length) return null;
  const trimmed = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, r.fields.find((y) => y.id === k)?.kind === 'text' ? x : x.trim()]));
  return r.build(trimmed);
}
