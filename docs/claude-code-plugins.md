# Claude Code plugins used in this project

This project is developed with [Claude Code](https://claude.com/claude-code) (terminal CLI or the VS Code extension) plus a set of plugins. Plugins add **skills** (instructions Claude loads when a task matches), **slash commands**, **agents** and **MCP tools**. None of them change the app or its build; they only affect how Claude works on the code.

The same information is on the site at [`/claude-code`](https://zykit.vercel.app/claude-code), generated from `src/pages/claude-code/plugins.ts`. When you add or remove a plugin, update that file, this doc and `.claude/settings.json`.

| Plugin | Source | Purpose |
|---|---|---|
| [superpowers](#superpowers) | `claude-plugins-official` | Brainstorm → plan → test-first → verify workflow |
| [frontend-design](#frontend-design) | `claude-plugins-official` | Distinctive, intentional UI design |
| [context7](#context7) | `claude-plugins-official` | Up-to-date library documentation |
| [code-review](#code-review) | `claude-plugins-official` | Pull request review |
| [code-simplifier](#code-simplifier) | `claude-plugins-official` | Clean up recently changed code without changing behavior |
| [claude-mem](#claude-mem) | `thedotmack/claude-mem` | Memory across sessions |
| [context-mode](#context-mode) | `mksglu/context-mode` | Keeps large tool output out of the context window |

## Installing

### Automatically (recommended)

The repo's [`.claude/settings.json`](../.claude/settings.json) lists the marketplaces and plugins above. When you open the project in Claude Code and trust the folder, it prompts you to install them. Accept, then reload (VS Code: *Developer: Reload Window*; terminal: restart `claude`).

### Manually

In an interactive Claude Code session:

```text
/plugin marketplace add anthropics/claude-plugins-official
/plugin marketplace add thedotmack/claude-mem
/plugin marketplace add mksglu/context-mode

/plugin install superpowers@claude-plugins-official
/plugin install frontend-design@claude-plugins-official
/plugin install context7@claude-plugins-official
/plugin install code-review@claude-plugins-official
/plugin install code-simplifier@claude-plugins-official
/plugin install claude-mem@thedotmack
/plugin install context-mode@context-mode
```

Or from a shell, with the same arguments: `claude plugin marketplace add …` and `claude plugin install …`. In VS Code without the `claude` CLI on your `PATH`, the extension ships a copy at `~/.vscode/extensions/anthropic.claude-code-<version>/resources/native-binary/claude`.

Check what is installed with `claude plugin list` (or `/plugin`). Disable one with `claude plugin disable <name>`, remove it with `claude plugin uninstall <name>`.

> `claude-mem` and `context-mode` are third-party plugins: they run their own hooks and background processes on your machine. Read their repos before installing.

## Do I need to say anything special?

Mostly no. Skills load automatically when a request matches their description, so you ask normally ("add a tool that converts YAML to JSON") and the relevant skill kicks in. You can also be explicit: name the skill ("use context7", "brainstorm this first") or run its slash command. Type `/` in the chat to browse every command, grouped by plugin.

## The plugins

### superpowers

**Purpose.** A disciplined engineering workflow: clarify the idea, write a plan, implement with tests first, and verify with real command output before claiming something works.

**How to use.** Automatic for feature work. Useful skills you can ask for by name:

| Skill | When |
|---|---|
| `superpowers:brainstorming` | Before building anything new; asks questions and proposes a design |
| `superpowers:writing-plans` / `executing-plans` | Multi-step changes |
| `superpowers:test-driven-development` | New features and bug fixes |
| `superpowers:systematic-debugging` | A failing test or odd behavior |
| `superpowers:verification-before-completion` | Before committing or opening a PR |

**Use cases here.** Adding a new tool (see [adding-a-tool.md](adding-a-tool.md)): brainstorm the UI and limits, plan the `features/` logic, write the Vitest tests in `tests/tools/<tool-id>/` first, then the page and the e2e spec. For a quick one-line fix, say "small change, no planning needed" to skip the ceremony.

### frontend-design

**Purpose.** Guidance for UI that has a clear aesthetic direction (typography, layout, color) instead of templated defaults.

**How to use.** Automatic when building or restyling UI; or say "use frontend-design".

**Use cases here.** Designing a new tool page, the home page cards, empty and error states. Keep it within the existing tokens in `src/styles/index.css` (slate/emerald palette, `primary` colors) and the shared components in `src/shared/ui/`.

### context7

**Purpose.** Fetches current documentation for a library or tool, so answers match the versions we use (React 19, React Router 8, Vite 8, Vitest 5, Tailwind 4, Playwright, oxlint) rather than older training data.

**How to use.** Automatic when you ask about a library; add "use context7" to force it.

**Use cases here.** "How do I configure a worker in Vite 8?", "What changed in React Router 8's `lazy` routes?", "Tailwind 4 custom variant syntax".

### code-review

**Purpose.** Reviews a pull request for bugs and problems, with findings you can act on.

**How to use.** `/code-review:code-review` with a PR number or URL, or "review this PR". Needs the GitHub connector or `gh` CLI signed in for PRs.

**Use cases here.** Before merging, especially changes to parsers in `src/shared/lib/` or tool `features/`, where untrusted file input makes bounds checks matter.

### code-simplifier

**Purpose.** An agent that tidies recently modified code (naming, duplication, structure) while keeping behavior identical.

**How to use.** "Simplify the code I just changed" or "run code-simplifier on src/tools/diff-checker".

**Use cases here.** After a feature lands and tests pass; re-run `npm test` and `npm run lint` afterwards.

### claude-mem

**Purpose.** Records what happens in each session (decisions, fixes, files touched) in a local database and brings relevant history back in later sessions.

**How to use.** Runs in the background. Ask about past work: "how did we fix the CSP issue last time?", "what did we decide about SEO?". Skills include `claude-mem:mem-search`, `claude-mem:timeline-report`, `claude-mem:make-plan` and `claude-mem:do`.

**Use cases here.** Picking work back up after a break; recalling why something was done a certain way. Note that Claude Code also has its own built-in memory, so the two overlap.

### context-mode

**Purpose.** Runs large commands (test runs, builds, logs, big files) in a sandbox and returns only the relevant part, so the conversation doesn't fill up with raw output.

**How to use.** Runs in the background. Commands: `ctx stats` (tokens saved), `ctx doctor` (diagnose), `ctx upgrade`, `ctx purge` (wipes its knowledge base; irreversible).

**Use cases here.** Long Playwright runs (`npm run test:e2e`), build output, searching across `src/` and `tests/`.

## Suggested flow for a change

1. Describe the change; **superpowers** brainstorms and plans, **context7** checks library APIs, **frontend-design** shapes the UI.
2. Implement test-first; run `npm test`, `npm run lint`, `npm run typecheck`, `npm run test:e2e` (**context-mode** keeps the output small).
3. **code-simplifier** tidies the diff; **code-review** reviews the PR.
4. **claude-mem** remembers it for next time.
