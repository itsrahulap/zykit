// User docs for Git Command Builder, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Task**, such as “Undo my last commit but keep the changes” or “Rename a branch everywhere”.',
    'Choose your **Shell** (Bash / zsh or PowerShell) so quotes come out right.',
    'Fill in the fields. Invalid branch names or commits are flagged next to the field, and no command is shown until everything is valid.',
    'Check the risk badge, read **What each part does** and any warning or safer alternative, then copy the command and run it in your terminal.',
  ],
  howItWorks:
    'Each task is a small recipe: it takes your values and assembles the git command one argument at a time, with a one-line explanation for each. Branch and tag names are checked against git’s own naming rules, and commits must be a hash (4–40 hex digits) or a name like `main` or `HEAD~2`. File paths always come after `--`, so a file named like an option is still treated as a file.\n\n' +
    'Every command gets one of four labels: **Read-only** (nothing changes), **Changes working files**, **Rewrites history** (commits are added, replaced or moved) and **Destructive** (work can be lost). Destructive commands come with a warning and safer alternatives, such as `--force-with-lease` instead of `--force`, a dry run before `git clean -f`, or stashing before `git reset --hard`.\n\n' +
    'Arguments with spaces or special characters are wrapped in single quotes for the chosen shell. Characters like `^` are quoted too, because zsh would otherwise treat them as a file pattern.',
  limits: [
    'It covers common everyday tasks, not every git command and option. Interactive rebase, bisect, worktrees and submodules aren’t included.',
    'Commands use `git switch` and `git restore`, which need git 2.23 or newer.',
    'The tool can’t see your repository, so it can’t check that a branch or commit exists, or that you have uncommitted work.',
    'Quoting is written for Bash, zsh and other POSIX shells, and for PowerShell. Windows cmd.exe quotes differently.',
  ],
  privacy: 'Everything happens in your browser. Nothing is run, uploaded or stored, and the tool never connects to your repository.',
  faqs: [
    {
      question: 'Is --force-with-lease really safer than --force?',
      answer:
        'Yes. It only overwrites the remote branch if it still points where your last fetch saw it. If someone else pushed in the meantime, the push is refused instead of deleting their commits.',
    },
    {
      question: 'Can I get back a branch I deleted?',
      answer:
        'Usually, for about 90 days. Use the “Recover a deleted branch” task: `git reflog` lists recent commits, and `git branch <name> <hash>` recreates the branch at the right one.',
    },
    {
      question: 'What is the difference between reset and revert?',
      answer:
        '`git reset` moves your branch back and removes commits from it, which rewrites history. `git revert` adds a new commit that undoes an old one, so it’s safe for commits you already pushed.',
    },
    {
      question: 'Why does the tool run git clean as a dry run by default?',
      answer:
        '`git clean -f` deletes files git doesn’t track, and they can’t be recovered. `-n` lists what would go first, so you can check before ticking **Really delete**.',
    },
  ],
};

export default docs;
