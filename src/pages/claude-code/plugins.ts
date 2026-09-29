// Content for /claude-code: the Claude Code plugins this site is built with. Plain data, shared by the
// page (ClaudeCodePage.tsx) and the build step that writes its static HTML (scripts/seo-plugin.ts).
// Keep in sync with docs/claude-code-plugins.md and .claude/settings.json.

import type { IconName } from '../../shared/ui/ui';

export interface Marketplace {
  id: string;
  repo: string;
}

export interface ClaudePlugin {
  id: string;
  name: string;
  /** Key into MARKETPLACES. */
  marketplace: string;
  icon: IconName;
  /** Published by Anthropic (claude-plugins-official) or a third party. */
  official: boolean;
  purpose: string;
  howToUse: string;
  /** Things you can type to Claude that use this plugin. */
  prompts: string[];
  /** Where it helps in this project. */
  useCases: string[];
  /** Slash commands or keywords it adds, if any. */
  commands?: string[];
  caveat?: string;
}

export const CLAUDE_CODE_PATH = '/claude-code';

export const MARKETPLACES: Marketplace[] = [
  { id: 'claude-plugins-official', repo: 'anthropics/claude-plugins-official' },
  { id: 'thedotmack', repo: 'thedotmack/claude-mem' },
  { id: 'context-mode', repo: 'mksglu/context-mode' },
];

export const PLUGINS: ClaudePlugin[] = [
  {
    id: 'superpowers',
    name: 'superpowers',
    marketplace: 'claude-plugins-official',
    icon: 'sparkle',
    official: true,
    purpose:
      'A disciplined engineering workflow: clarify the idea, write a plan, implement test-first, and verify with real command output before calling anything done.',
    howToUse:
      'Automatic for feature work. Ask for a skill by name when you want a specific step: brainstorming, writing-plans, test-driven-development, systematic-debugging or verification-before-completion.',
    prompts: ['Brainstorm a YAML to JSON tool before we build it', 'Debug why the diff checker e2e test fails', 'Small change, no planning needed: fix the button label'],
    useCases: [
      'Adding a new tool: design the UI and limits, then write Vitest tests in tests/tools/<tool-id>/ before the page',
      'Chasing a failing test with a root-cause process instead of guesses',
      'Checking lint, typecheck and tests actually pass before a commit',
    ],
  },
  {
    id: 'frontend-design',
    name: 'frontend-design',
    marketplace: 'claude-plugins-official',
    icon: 'layers',
    official: true,
    purpose: 'Guidance for UI with a clear aesthetic direction (typography, layout, color) instead of templated defaults.',
    howToUse: 'Automatic when building or restyling UI. Say "use frontend-design" to force it.',
    prompts: ['Redesign the home page tool cards', 'Design the empty state for the hash generator'],
    useCases: ['New tool pages and Learn pages', 'Empty, loading and error states', 'Staying within the slate/emerald tokens in src/styles/index.css'],
  },
  {
    id: 'context7',
    name: 'context7',
    marketplace: 'claude-plugins-official',
    icon: 'book',
    official: true,
    purpose:
      'Fetches current documentation for a library or tool, so answers match the versions this site uses (React 19, React Router 8, Vite 8, Vitest 5, Tailwind 4, Playwright) rather than older training data.',
    howToUse: 'Automatic when you ask about a library. Add "use context7" to force it.',
    prompts: ['How do I configure an ES module worker in Vite 8? use context7', "What changed in React Router 8's lazy routes?"],
    useCases: ['Config and API questions for the build tools', 'Upgrading a dependency to a new major version'],
  },
  {
    id: 'code-review',
    name: 'code-review',
    marketplace: 'claude-plugins-official',
    icon: 'search',
    official: true,
    purpose: 'Reviews a pull request for bugs and problems, with findings you can act on.',
    howToUse: 'Run the slash command with a PR number or URL, or ask "review this PR". Needs the GitHub connector or the gh CLI signed in.',
    commands: ['/code-review:code-review'],
    prompts: ['Review PR #12', 'Review this PR before I merge'],
    useCases: ['Parsers in src/shared/lib/ and tool features/, where untrusted file input makes bounds checks matter', 'A second opinion before merging to main'],
  },
  {
    id: 'code-simplifier',
    name: 'code-simplifier',
    marketplace: 'claude-plugins-official',
    icon: 'code',
    official: true,
    purpose: 'An agent that tidies recently changed code (naming, duplication, structure) while keeping behavior identical.',
    howToUse: 'Ask for it after a change works. Re-run npm test and npm run lint afterwards.',
    prompts: ['Simplify the code I just changed', 'Run code-simplifier on src/tools/diff-checker'],
    useCases: ['Cleaning up after a feature lands and tests pass', 'Reducing duplication between tools before moving code to src/shared/'],
  },
  {
    id: 'claude-mem',
    name: 'claude-mem',
    marketplace: 'thedotmack',
    icon: 'bookmark',
    official: false,
    purpose: 'Records what happens in each session (decisions, fixes, files touched) in a local database and brings relevant history back in later sessions.',
    howToUse: 'Runs in the background. Ask about past work in plain words; skills include mem-search, timeline-report, make-plan and do.',
    prompts: ['How did we fix the CSP issue last time?', 'What did we decide about SEO?'],
    useCases: ['Picking work back up after a break', 'Recalling why something was built a certain way'],
    caveat: 'Overlaps with Claude Code’s built-in memory, so you run two memory systems.',
  },
  {
    id: 'context-mode',
    name: 'context-mode',
    marketplace: 'context-mode',
    icon: 'chart',
    official: false,
    purpose:
      'Runs large commands (test runs, builds, logs, big files) in a sandbox and returns only the relevant part, so the conversation doesn’t fill up with raw output.',
    howToUse: 'Runs in the background. Type one of its keywords to check on it.',
    commands: ['ctx stats', 'ctx doctor', 'ctx upgrade', 'ctx purge'],
    prompts: ['Run the e2e suite and tell me what failed', 'ctx stats'],
    useCases: ['Long Playwright runs (npm run test:e2e)', 'Build output and searches across src/ and tests/'],
    caveat: '"ctx purge" permanently wipes its knowledge base.',
  },
];

export const FLOW = [
  { step: 'Plan', text: 'Describe the change. superpowers brainstorms and plans, context7 checks library APIs, frontend-design shapes the UI.' },
  { step: 'Build', text: 'Implement test-first and run npm test, lint, typecheck and test:e2e. context-mode keeps the output small.' },
  { step: 'Review', text: 'code-simplifier tidies the diff and code-review reviews the pull request.' },
  { step: 'Remember', text: 'claude-mem keeps what was decided for the next session.' },
];

export const marketplaceFor = (p: ClaudePlugin) => MARKETPLACES.find((m) => m.id === p.marketplace)!;

export const installCommands = (prefix: '/plugin' | 'claude plugin') => [
  ...MARKETPLACES.map((m) => `${prefix} marketplace add ${m.repo}`),
  ...PLUGINS.map((p) => `${prefix} install ${p.id}@${p.marketplace}`),
];

export const claudeCodeMeta = () => ({
  title: 'Built with Claude Code: plugins, setup and use cases',
  description: `The ${PLUGINS.length} Claude Code plugins used to build this site: what each one is for, how to install it, how to use it and where it helps.`,
});
