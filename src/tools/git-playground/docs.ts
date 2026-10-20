import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Challenge** (8 guided exercises) or **Free play** for an empty folder.',
    'Type git commands in the terminal and press Enter, or click a common command under it. ↑ and ↓ bring back earlier commands; type **help** to see every supported command.',
    'Create and edit files with `echo "text" > file.txt`, or with **Edit**, **Save file** and **Create** in the **Files** panel. **Stage** runs `git add` for you.',
    'Watch the **Commit graph**: each dot is a commit, the ringed dot is HEAD, and labels show branches, tags and origin/* branches. Click a dot to see its message and files.',
    'Stuck? Use **Show a hint** or **Show solution**. **Start over** resets the current challenge or free play.',
  ],
  howItWorks:
    'The repository is a small model of git written for this page. Commits are full snapshots of the files, branches and tags are labels that point at commits, and the staging area is the snapshot the next commit will save, just like real git. Each command you type is parsed and applied to that model, and the graph redraws from it.\n\n' +
    'Supported: `init`, `status`, `add`, `rm`, `commit` (`-m`, `-a`, `--amend`), `log`, `diff`, `show`, `branch`, `switch`, `checkout`, `restore`, `merge` (fast-forward, merge commits and conflicts with `--abort`), `rebase`, `reset` (`--soft`, `--mixed`, `--hard`), `revert`, `cherry-pick`, `stash`, `tag`, and a pretend remote with `remote add`, `push`, `pull` and `fetch`. References such as `HEAD~1`, `main^`, tags, `origin/main` and short commit ids work.\n\n' +
    'Git refuses the same things here as it does for real: switching branches when it would overwrite your changes, deleting an unmerged branch with `-d`, committing files that still have conflict markers, or pushing when the remote has commits you lack. If a command fails, nothing changes.',
  limits: [
    'It is a simulation, not real git: there is no real `.git` folder, network or config, and `clone` is not available.',
    'Merges compare whole files. Two branches changing different lines of the same file still conflict here, where real git would merge them.',
    'A `rebase`, `revert`, `cherry-pick` or `stash pop` that would conflict is cancelled with an explanation instead of stopping halfway. Only `merge` lets you resolve conflicts by hand.',
    'Interactive commands (`rebase -i`, `add -p`) and commit editors are not supported; give messages with `-m`.',
    'The pretend remote only changes when you push to it, so `fetch` and `pull` never bring in other people\'s work.',
    'Up to 50 files of 20,000 characters each. The repository resets when you reload the page.',
  ],
  privacy:
    'Everything runs in this page and nothing is sent anywhere, including when you "push". Only the list of challenges you have solved is saved in this browser.',
  faqs: [
    {
      question: 'Can I break anything by experimenting here?',
      answer: 'No. The repository only exists in this page. **Start over** or a reload gives you a fresh one, so try `reset --hard`, force pushes and deleting branches freely.',
    },
    {
      question: 'What is the difference between staged and committed?',
      answer:
        'Staging (`git add`) chooses which changes go into the next commit. Committing (`git commit`) saves those staged changes as a permanent snapshot. The **Files** panel shows each file as new, changed, staged or committed.',
    },
    {
      question: 'Should I use merge or rebase?',
      answer:
        'Merge keeps history exactly as it happened and adds a merge commit. Rebase copies your commits on top of the other branch for a straight line, but gives them new ids, so don\'t rebase commits other people already have. Try both in the challenges and compare the graphs.',
    },
    {
      question: 'How do I undo a commit?',
      answer:
        'If you haven\'t pushed it, `git reset --soft HEAD~1` undoes the commit and keeps the changes staged. If it is already pushed, use `git revert <commit>`, which adds a new commit that undoes it without rewriting history.',
    },
    {
      question: 'Why does a commit get a new id after rebase or cherry-pick?',
      answer: 'A commit id depends on its parent. Placing the same change on a different parent makes a new commit, so the id changes and the old commit remains where it was.',
    },
  ],
};

export default docs;
