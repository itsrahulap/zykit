# Git Command Builder

## Purpose

Builds git commands from small forms (inspect, branches, commits, remotes, stash, merge and rebase, tags, undo, cleanup), explains every argument, labels the risk, and suggests safer alternatives for destructive commands. Nothing is executed. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `GitCommandBuilderPage.tsx` | Task picker, shell switch, form (one value set per recipe), command card with risk badge, parts list, warnings and safer alternatives |
| `features/git-command-builder.ts` | `RECIPES`, validation (`refNameError`, `commitError`, `fieldError`), `quote` / `render`, `buildRecipe` |

## Core Logic

Each `Recipe` declares its `fields` and a `build(values)` that returns `Built`: one or more commands as `Part[]` (argument plus explanation), a `Risk` (`read`, `files`, `history`, `destructive`), an effect sentence, and optional `warning` / `safer`. `buildRecipe` validates first and returns `null` if any field is invalid, so a command is never shown for bad input. Branch and tag names follow `git check-ref-format`; commits are 4–40 hex digits or a ref with `~n` / `^n` suffixes. Paths always come after `--`, so a path like `-rf` can't be read as an option.

`quote` leaves plain words (`[A-Za-z0-9_+=:./-]`, `~` not first) unquoted and single-quotes everything else: POSIX escapes `'` as `'\''`, PowerShell doubles it. `^` (a glob in zsh), a leading `~`, `,` (PowerShell arrays), `@`, `{`, `$` and spaces are always quoted.

## Limits

- A fixed set of common tasks, not every git option. Commands are built for git 2.23+ (`git switch` / `git restore`).
- Quoting covers POSIX shells and PowerShell, not cmd.exe.
- The tool doesn't know your repository: it can't check that a branch or commit exists.

## Tests

- Unit: `tests/tools/git-command-builder/git-command-builder.test.ts` (ref-name and commit rules, every recipe builds from its defaults and explains every part, exact commands, quoting per shell, risk levels, destructive recipes always carry a warning or safer option, `--` before paths). `npm test -- git-command-builder`
- E2E: `e2e/git-command-builder.spec.ts`. `npm run test:e2e -- git-command-builder`

## Known Gaps

- No interactive rebase, bisect, worktree or submodule recipes.
- Values aren't kept in share links.
