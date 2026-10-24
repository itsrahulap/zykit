# Git Playground

## Purpose

An in-browser git simulator for learning: a terminal that accepts real git commands, a file panel, a live commit graph and eight guided challenges. Nothing is real git and nothing leaves the page. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `GitPlaygroundPage.tsx` | Mode switch (challenges / free play), challenge card with hints, solution and solved state (`localStorage`), wires terminal, graph and files |
| `components/Terminal.tsx` | Output log (`role="log"`), prompt with current branch, ↑/↓ history, quick-command buttons |
| `components/CommitGraph.tsx` | SVG graph from `layoutGraph`, ref labels, HEAD ring, keyboard-selectable commits with details |
| `components/FilesPanel.tsx` | File list with git state badges, editor, Stage / Delete / Create buttons that run the matching command |
| `features/repo.ts` | Repo model (snapshot commits, branches, tags, remote, index, working tree, stash, merge state), `resolve` refs, `merge3`, `lineDiff`, `checkoutFiles`, `changes` |
| `features/commands.ts` | `tokenize` and `run`: shell commands (`ls`, `cat`, `echo >`, `touch`, `rm`) and all git subcommands |
| `features/graph.ts` | `layoutGraph`: column per commit in creation order, lane per branch line |
| `features/challenges.ts` | `CHALLENGES` (setup script, goal check, hints, solution) and `setupRepo` |

## Core Logic

`run(repo, line)` clones the repo with `structuredClone`, executes the command and returns the new repo plus output lines; a `GitError` returns the original repo unchanged, so failed commands never half-apply. Commits store full file snapshots and get a short FNV-1a hash of sequence, message and parents. `checkoutFiles` carries uncommitted changes across a switch and refuses when a changed path differs in the target, like git. Merges, rebases, reverts, cherry-picks and stash pops all use `merge3` (whole-file three-way merge); only `merge` keeps conflict state (`repo.merging`) for manual resolution, the others abort. Challenges build their start state by running their own setup commands through `run`, and the unit tests run every challenge's solution to prove it passes `check`.

## Limits

- Whole-file merge granularity (no line-level diff3).
- 50 files, 20,000 characters per file; terminal keeps the last 200 entries; command input 500 characters.
- No persistence of the repo; only solved challenge ids are stored.

## Tests

- Unit: `tests/tools/git-playground/git-playground.test.ts` (tokenizer, status/add/commit, failed commands don't mutate, fast-forward and three-way merges, conflict markers and resolution, reset modes, overwrite protection on switch, rejected push, every challenge's setup and solution, graph lanes). `npm test -- git-playground`
- E2E: `e2e/git-playground.spec.ts` (first challenge solved by typing, Files panel staging and graph, free play, no network, 320 px layout). `npm run test:e2e -- git-playground`

## Known Gaps

- No line-level merge, interactive rebase or `add -p`.
- The pretend remote never receives other people's commits, so `pull` only matters after rewriting local history.
