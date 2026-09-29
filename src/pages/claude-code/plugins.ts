// Content for the Claude Code section (/claude-code and /claude-code/<plugin-id>): the plugins this site is
// built with. Plain data, shared by the pages and the build step that writes their static HTML
// (scripts/seo-plugin.ts). Keep in sync with docs/claude-code-plugins.md and .claude/settings.json.

import type { IconName } from '../../shared/ui/ui';

export type PartKind = 'skills' | 'commands' | 'agents' | 'hooks' | 'mcp';

export interface Marketplace {
  id: string;
  repo: string;
}

export interface ClaudePlugin {
  id: string;
  name: string;
  /** One line for cards and page titles. */
  tagline: string;
  /** Key into MARKETPLACES. */
  marketplace: string;
  icon: IconName;
  /** Published by Anthropic (claude-plugins-official) or a third party. */
  official: boolean;
  /** Which kinds of plugin parts it ships. */
  parts: PartKind[];
  purpose: string;
  /** How it works under the hood, one paragraph per entry. */
  howItWorks: string[];
  howToUse: string;
  /** Slash commands or keywords it adds, if any. */
  commands?: string[];
  /** Things you can type to Claude that use this plugin. */
  prompts: string[];
  /** Where it helps in this project. */
  useCases: string[];
  whenNotToUse: string;
  caveat?: string;
}

export const CLAUDE_CODE_PATH = '/claude-code';
export const pluginPath = (p: Pick<ClaudePlugin, 'id'>) => `${CLAUDE_CODE_PATH}/${p.id}`;

export const MARKETPLACES: Marketplace[] = [
  { id: 'claude-plugins-official', repo: 'anthropics/claude-plugins-official' },
  { id: 'thedotmack', repo: 'thedotmack/claude-mem' },
  { id: 'context-mode', repo: 'mksglu/context-mode' },
];

/** The building blocks a plugin can contain. */
export const PARTS: { kind: PartKind; name: string; icon: IconName; text: string }[] = [
  {
    kind: 'skills',
    name: 'Skills',
    icon: 'lightbulb',
    text: 'Markdown instructions (SKILL.md). Only each skill’s name and one-line description sit in Claude’s context; when a request matches, Claude loads the full instructions and follows them.',
  },
  {
    kind: 'commands',
    name: 'Slash commands',
    icon: 'code',
    text: 'Prompts you trigger by typing /plugin-name:command. Useful when you want a specific workflow to run on demand.',
  },
  {
    kind: 'agents',
    name: 'Agents',
    icon: 'layers',
    text: 'Specialised subagents with their own instructions and a fresh context. Claude hands them a task and gets back only the result.',
  },
  {
    kind: 'hooks',
    name: 'Hooks',
    icon: 'play',
    text: 'Shell commands Claude Code runs automatically at events such as session start, before or after a tool call, or when Claude stops. They can add context or block an action.',
  },
  {
    kind: 'mcp',
    name: 'MCP servers',
    icon: 'server',
    text: 'Model Context Protocol servers that give Claude new tools, such as searching documentation or a local database. They run as separate processes.',
  },
];

/** From "install" to "Claude uses it", in order. */
export const LIFECYCLE = [
  { step: 'Marketplace', text: 'A marketplace is a Git repo with a .claude-plugin/marketplace.json listing plugins. Adding one only registers the catalog.' },
  { step: 'Install', text: 'Installing copies the plugin into ~/.claude/plugins and marks it enabled in your settings (enabledPlugins).' },
  { step: 'Load', text: 'On the next session start, Claude Code reads each enabled plugin: registers its commands, agents and hooks, starts its MCP servers and lists its skills.' },
  { step: 'Use', text: 'While you work, Claude picks skills and tools that match your request, hooks fire on their events, and you can run commands yourself.' },
];

export const PLUGINS: ClaudePlugin[] = [
  {
    id: 'superpowers',
    name: 'superpowers',
    tagline: 'Brainstorm, plan, build test-first, verify',
    marketplace: 'claude-plugins-official',
    icon: 'sparkle',
    official: true,
    parts: ['skills', 'commands', 'hooks'],
    purpose:
      'A disciplined engineering workflow: clarify the idea, write a plan, implement test-first, and verify with real command output before calling anything done.',
    howItWorks: [
      'superpowers is a library of skills: brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, verification-before-completion and more. Each is a SKILL.md file with a description of when it applies.',
      'A session-start hook injects a short "using superpowers" instruction telling Claude to check for a matching skill before acting. When your request matches a description, Claude loads that skill and follows its steps, for example asking clarifying questions and proposing a design before writing code.',
    ],
    howToUse:
      'Automatic for feature work. Ask for a skill by name when you want a specific step. For quick edits, say so, and it skips the planning ceremony.',
    prompts: ['Brainstorm a YAML to JSON tool before we build it', 'Debug why the diff checker e2e test fails', 'Small change, no planning needed: fix the button label'],
    useCases: [
      'Adding a new tool: design the UI and limits, then write Vitest tests in tests/tools/<tool-id>/ before the page',
      'Chasing a failing test with a root-cause process instead of guesses',
      'Checking lint, typecheck and tests actually pass before a commit',
    ],
    whenNotToUse: 'One-line fixes and quick questions, where brainstorming and planning cost more time than they save.',
  },
  {
    id: 'frontend-design',
    name: 'frontend-design',
    tagline: 'Distinctive, intentional UI design',
    marketplace: 'claude-plugins-official',
    icon: 'layers',
    official: true,
    parts: ['skills'],
    purpose: 'Guidance for UI with a clear aesthetic direction (typography, layout, color, motion) instead of templated defaults.',
    howItWorks: [
      'A single skill. When you ask Claude to build or restyle an interface, it loads the skill’s design guidance: pick a clear direction, choose type and color deliberately, and avoid generic layouts.',
      'It only shapes how Claude writes the UI code; it doesn’t add tools or run anything.',
    ],
    howToUse: 'Automatic when building or restyling UI. Say "use frontend-design" to force it.',
    prompts: ['Redesign the home page tool cards', 'Design the empty state for the hash generator'],
    useCases: ['New tool pages and Learn pages', 'Empty, loading and error states', 'Staying within the slate/emerald tokens in src/styles/index.css'],
    whenNotToUse: 'Logic-only changes, or when you need to match an existing component exactly.',
  },
  {
    id: 'context7',
    name: 'context7',
    tagline: 'Up-to-date library documentation',
    marketplace: 'claude-plugins-official',
    icon: 'book',
    official: true,
    parts: ['mcp'],
    purpose:
      'Fetches current documentation for a library or tool, so answers match the versions this site uses (React 19, React Router 8, Vite 8, Vitest 5, Tailwind 4, Playwright) rather than older training data.',
    howItWorks: [
      'context7 is an MCP server with two tools: resolve-library-id turns a name like "vite" into a Context7 library id, and query-docs fetches the relevant sections of that library’s current docs.',
      'Its server instructions tell Claude to use it whenever you ask about a library, framework or CLI. The docs come from the Context7 service over the network, and only the matching snippets enter the conversation.',
    ],
    howToUse: 'Automatic when you ask about a library. Add "use context7" to force it.',
    prompts: ['How do I configure an ES module worker in Vite 8? use context7', "What changed in React Router 8's lazy routes?"],
    useCases: ['Config and API questions for the build tools', 'Upgrading a dependency to a new major version'],
    whenNotToUse: 'Questions about this project’s own code, general programming concepts, or debugging business logic.',
    caveat: 'Your library query is sent to the Context7 service. Don’t paste private code into it.',
  },
  {
    id: 'code-review',
    name: 'code-review',
    tagline: 'Pull request review',
    marketplace: 'claude-plugins-official',
    icon: 'search',
    official: true,
    parts: ['commands', 'agents'],
    purpose: 'Reviews a pull request for bugs and problems, with findings you can act on.',
    howItWorks: [
      'A slash command that reads the pull request diff and runs several review passes in parallel (bugs, project conventions, history of the changed code), each in its own agent.',
      'Findings are scored for confidence and low-confidence ones are dropped, so what you get back is a short list worth acting on. It uses the GitHub CLI to read the PR and can post the review as a comment.',
    ],
    howToUse: 'Run the slash command with a PR number or URL, or ask "review this PR". Needs the gh CLI or GitHub connector signed in.',
    commands: ['/code-review:code-review'],
    prompts: ['Review PR #12', 'Review this PR before I merge'],
    useCases: ['Parsers in src/shared/lib/ and tool features/, where untrusted file input makes bounds checks matter', 'A second opinion before merging to main'],
    whenNotToUse: 'Uncommitted local changes with no PR yet; ask Claude to review the diff directly instead.',
  },
  {
    id: 'code-simplifier',
    name: 'code-simplifier',
    tagline: 'Tidy changed code without changing behavior',
    marketplace: 'claude-plugins-official',
    icon: 'code',
    official: true,
    parts: ['agents'],
    purpose: 'An agent that tidies recently changed code (naming, duplication, structure) while keeping behavior identical.',
    howItWorks: [
      'The plugin adds a code-simplifier agent. When you ask for a cleanup, Claude starts it as a subagent with its own context; it looks at recently modified code, rewrites it for clarity and consistency with the surrounding code, and reports back.',
      'Because it runs in a separate context, its file reading doesn’t crowd your main conversation.',
    ],
    howToUse: 'Ask for it after a change works. Re-run npm test and npm run lint afterwards.',
    prompts: ['Simplify the code I just changed', 'Run code-simplifier on src/tools/diff-checker'],
    useCases: ['Cleaning up after a feature lands and tests pass', 'Reducing duplication between tools before moving code to src/shared/'],
    whenNotToUse: 'Code that isn’t working yet. Fix it first; simplifying broken code hides the bug.',
  },
  {
    id: 'claude-mem',
    name: 'claude-mem',
    tagline: 'Memory across sessions',
    marketplace: 'thedotmack',
    icon: 'bookmark',
    official: false,
    parts: ['skills', 'hooks', 'mcp'],
    purpose: 'Records what happens in each session (decisions, fixes, files touched) in a local database and brings relevant history back in later sessions.',
    howItWorks: [
      'Hooks watch the session: they capture your prompts and Claude’s tool use, and a local background worker turns them into short "observations" stored in a database on your machine.',
      'At the next session start, a hook injects a summary of recent relevant work. Its MCP tools (search, timeline, get_observations) let Claude look further back when you ask about past work.',
    ],
    howToUse: 'Runs in the background. Ask about past work in plain words; skills include mem-search, timeline-report, make-plan and do.',
    prompts: ['How did we fix the CSP issue last time?', 'What did we decide about SEO?'],
    useCases: ['Picking work back up after a break', 'Recalling why something was built a certain way'],
    whenNotToUse: 'Facts that belong in the repo (CLAUDE.md, docs, code comments), where every contributor can see them.',
    caveat: 'Third-party code that runs hooks and a background process. Overlaps with Claude Code’s built-in memory, so you run two memory systems.',
  },
  {
    id: 'context-mode',
    name: 'context-mode',
    tagline: 'Keeps large output out of the context window',
    marketplace: 'context-mode',
    icon: 'chart',
    official: false,
    parts: ['skills', 'hooks', 'mcp'],
    purpose:
      'Runs large commands (test runs, builds, logs, big files) in a sandbox and returns only the relevant part, so the conversation doesn’t fill up with raw output.',
    howItWorks: [
      'Its MCP server adds tools such as ctx_execute and ctx_batch_execute. They run commands or code in a subprocess, index the full output in a local full-text search database, and return only what Claude prints or searches for.',
      'Hooks before tool calls nudge Claude toward these tools when an output would be large, and a session-start hook explains the routing rules. ctx_search can later pull snippets back out of the index.',
    ],
    howToUse: 'Runs in the background. Type one of its keywords to check on it.',
    commands: ['ctx stats', 'ctx doctor', 'ctx upgrade', 'ctx purge'],
    prompts: ['Run the e2e suite and tell me what failed', 'ctx stats'],
    useCases: ['Long Playwright runs (npm run test:e2e)', 'Build output and searches across src/ and tests/'],
    whenNotToUse: 'Short outputs and file edits; plain commands and the normal edit tools are simpler.',
    caveat: 'Third-party code that runs hooks and a background process. "ctx purge" permanently wipes its knowledge base.',
  },
];

export const FLOW = [
  { step: 'Plan', text: 'Describe the change. superpowers brainstorms and plans, context7 checks library APIs, frontend-design shapes the UI.' },
  { step: 'Build', text: 'Implement test-first and run npm test, lint, typecheck and test:e2e. context-mode keeps the output small.' },
  { step: 'Review', text: 'code-simplifier tidies the diff and code-review reviews the pull request.' },
  { step: 'Remember', text: 'claude-mem keeps what was decided for the next session.' },
];

export const getPlugin = (id: string) => PLUGINS.find((p) => p.id === id);
export const marketplaceFor = (p: ClaudePlugin) => MARKETPLACES.find((m) => m.id === p.marketplace)!;

export type CommandPrefix = '/plugin' | 'claude plugin';

export const installCommands = (prefix: CommandPrefix) => [
  ...MARKETPLACES.map((m) => `${prefix} marketplace add ${m.repo}`),
  ...PLUGINS.map((p) => `${prefix} install ${p.id}@${p.marketplace}`),
];

export const pluginInstallCommands = (p: ClaudePlugin, prefix: CommandPrefix) => [
  `${prefix} marketplace add ${marketplaceFor(p).repo}`,
  `${prefix} install ${p.id}@${p.marketplace}`,
];

// Titles exclude the " · Zykit" suffix; useDocumentMeta and the build step add it.
export const claudeCodeMeta = () => ({
  title: 'Claude Code plugins: what they are, install and use',
  description: `How Claude Code plugins work (skills, commands, agents, hooks, MCP servers) and the ${PLUGINS.length} plugins used to build this site: how to install, use and get the most from each.`,
});

export const pluginMeta = (p: ClaudePlugin) => ({
  title: `${p.name}: ${p.tagline} · Claude Code plugin`,
  description: `${p.purpose} How it works, how to install it and how to use it.`,
});
