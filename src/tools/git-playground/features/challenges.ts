// Guided exercises. Each one builds its starting repo by running real playground commands,
// and checks the goal against the repo after every command the learner runs.

import { run } from './commands';
import { CONFLICT_MARK, ancestors, emptyRepo, headFiles, headId, isAncestor, type Repo } from './repo';

export interface Challenge {
  id: string;
  title: string;
  goal: string;
  setup: string[];
  hints: string[];
  solution: string[];
  check: (r: Repo) => boolean;
}

const onBranch = (r: Repo, name: string) => r.head.kind === 'branch' && r.head.name === name;
const headMessage = (r: Repo) => {
  const id = headId(r);
  return id ? r.commits[id].message : '';
};

export const CHALLENGES: Challenge[] = [
  {
    id: 'first-commit',
    title: 'Your first commit',
    goal: 'Turn this folder into a git repository and save README.md in your first commit.',
    setup: ['echo "# My project" > README.md'],
    hints: ['Start tracking the folder with git init.', 'Stage the file: git add README.md', 'Save it: git commit -m "First commit"'],
    solution: ['git init', 'git add README.md', 'git commit -m "First commit"'],
    check: (r) => r.initialized && 'README.md' in headFiles(r),
  },
  {
    id: 'branch-merge',
    title: 'Branch and merge',
    goal: 'Create a branch called feature, commit a new file on it, then merge feature back into main.',
    setup: ['git init', 'echo "# Shop" > README.md', 'git add .', 'git commit -m "Initial commit"'],
    hints: ['git switch -c feature creates the branch and moves you onto it.', 'Make a file, then git add and git commit it.', 'Go back with git switch main, then git merge feature.'],
    solution: ['git switch -c feature', 'echo "cart" > cart.txt', 'git add cart.txt', 'git commit -m "Add cart"', 'git switch main', 'git merge feature'],
    check: (r) => {
      const f = r.branches.feature;
      const m = r.branches.main;
      return !!f && !!m && r.commits[f].seq > 1 && isAncestor(r, f, m) && onBranch(r, 'main');
    },
  },
  {
    id: 'undo-commit',
    title: 'Undo a commit, keep the work',
    goal: 'The last commit, "Too early", was made by mistake. Undo it, but keep its change ("line 2") in app.txt.',
    setup: ['git init', 'echo "line 1" > app.txt', 'git add .', 'git commit -m "Add app"', 'echo "line 2" >> app.txt', 'git commit -am "Too early"'],
    hints: ['git reset moves the branch back. HEAD~1 means "one commit before HEAD".', '--soft keeps the changes staged; plain git reset keeps them unstaged. Avoid --hard here.'],
    solution: ['git reset --soft HEAD~1'],
    check: (r) => headMessage(r) === 'Add app' && (r.working['app.txt'] ?? '').includes('line 2'),
  },
  {
    id: 'merge-conflict',
    title: 'Fix a merge conflict',
    goal: 'Merge feature into main. Both branches changed settings.txt, so resolve the conflict and finish the merge.',
    setup: [
      'git init',
      'echo "color = blue" > settings.txt',
      'git add .',
      'git commit -m "Add settings"',
      'git switch -c feature',
      'echo "color = green" > settings.txt',
      'git commit -am "Use green"',
      'git switch main',
      'echo "color = red" > settings.txt',
      'git commit -am "Use red"',
    ],
    hints: [
      'Run git merge feature and read the CONFLICT message.',
      'Open settings.txt in the Files panel (or use echo) and keep one line, without the <<<<<<< ======= >>>>>>> markers.',
      'Then git add settings.txt and git commit -m "Merge feature".',
    ],
    solution: ['git merge feature', 'echo "color = green" > settings.txt', 'git add settings.txt', 'git commit -m "Merge feature"'],
    check: (r) => {
      const id = headId(r);
      return onBranch(r, 'main') && !r.merging && !!id && r.commits[id].parents.length === 2 && !Object.values(headFiles(r)).some((f) => f.includes(CONFLICT_MARK));
    },
  },
  {
    id: 'rebase',
    title: 'Rebase for a straight history',
    goal: "You're on feature, and main has a new commit since you branched. Rebase feature onto main so the history is one straight line (no merge commit).",
    setup: [
      'git init',
      'echo "# Site" > README.md',
      'git add .',
      'git commit -m "Initial commit"',
      'git switch -c feature',
      'echo "login form" > login.txt',
      'git add .',
      'git commit -m "Add login"',
      'git switch main',
      'echo "how to run" > docs.txt',
      'git add .',
      'git commit -m "Add docs"',
      'git switch feature',
    ],
    hints: ['Stay on feature and run git rebase main.', 'Watch the graph: your "Add login" commit gets a new id on top of main.'],
    solution: ['git rebase main'],
    check: (r) => {
      const f = r.branches.feature;
      const m = r.branches.main;
      return onBranch(r, 'feature') && !!f && !!m && isAncestor(r, m, f) && f !== m && ![...ancestors(r, f)].some((id) => r.commits[id].parents.length > 1);
    },
  },
  {
    id: 'stash',
    title: 'Put work aside with stash',
    goal: 'You have unfinished edits to app.txt on main, but must commit a quick fix on the hotfix branch first. Stash your work, commit any fix on hotfix, come back to main and get your work back.',
    setup: ['git init', 'echo "v1" > app.txt', 'git add .', 'git commit -m "Add app"', 'git branch hotfix', 'echo "half-finished work" >> app.txt'],
    hints: ['git stash saves your edits and cleans the files.', 'git switch hotfix, then make, add and commit a fix.', 'git switch main, then git stash pop.'],
    solution: ['git stash', 'git switch hotfix', 'echo "patched" > fix.txt', 'git add fix.txt', 'git commit -m "Fix crash"', 'git switch main', 'git stash pop'],
    check: (r) =>
      onBranch(r, 'main') && !r.stash.length && (r.working['app.txt'] ?? '').includes('half-finished') && !!r.branches.hotfix && r.commits[r.branches.hotfix].seq > 1,
  },
  {
    id: 'revert',
    title: 'Undo a pushed commit safely',
    goal: 'The commit "Turn on debug mode" is already pushed, so others may have it. Undo it without rewriting history, and keep the later "Improve app" commit.',
    setup: [
      'git init',
      'echo "app v1" > app.txt',
      'git add .',
      'git commit -m "Add app"',
      'echo "debug = true" > debug.txt',
      'git add .',
      'git commit -m "Turn on debug mode"',
      'echo "app v2" >> app.txt',
      'git commit -am "Improve app"',
      'git remote add origin https://example.com/team/app.git',
      'git push -u origin main',
    ],
    hints: ['git log --oneline shows the commit ids.', 'git revert <id> adds a new commit that undoes that one. HEAD~1 also works here.'],
    solution: ['git revert HEAD~1'],
    check: (r) => headMessage(r) === 'Revert "Turn on debug mode"' && !('debug.txt' in headFiles(r)) && (headFiles(r)['app.txt'] ?? '').includes('app v2'),
  },
  {
    id: 'cherry-pick',
    title: 'Copy one commit with cherry-pick',
    goal: 'The experiment branch has one useful commit, "Fix typo in greeting", plus unfinished work. Copy only the typo fix onto main.',
    setup: [
      'git init',
      'echo "Helo" > greeting.txt',
      'git add .',
      'git commit -m "Add greeting"',
      'git switch -c experiment',
      'echo "draft" > wip.txt',
      'git add .',
      'git commit -m "WIP experiment"',
      'echo "Hello" > greeting.txt',
      'git commit -am "Fix typo in greeting"',
      'git switch main',
    ],
    hints: ['git log --oneline --all shows every commit with its id.', 'On main, run git cherry-pick <id of the typo fix> (experiment also works: it points at that commit).'],
    solution: ['git cherry-pick experiment'],
    check: (r) => onBranch(r, 'main') && headFiles(r)['greeting.txt'] === 'Hello\n' && !('wip.txt' in headFiles(r)),
  },
];

/** Build a challenge's starting repo by running its setup commands. */
export function setupRepo(challenge: Challenge): Repo {
  let repo = emptyRepo();
  for (const line of challenge.setup) {
    const res = run(repo, line);
    const failed = res.lines.find((l) => l.kind === 'err');
    if (failed) throw new Error(`Challenge ${challenge.id} setup failed at "${line}": ${failed.text}`);
    repo = res.repo;
  }
  return repo;
}
