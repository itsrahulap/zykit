// Series: Claude Code plugins. Two overview posts plus one post per plugin, built from PLUGINS below.
// To add a plugin post, add an entry to PLUGINS; its post, links and SEO page follow automatically.

import type { BlogPost, BlogSeries, PostBlock } from '../types';

export const claudeCodeSeries: BlogSeries = {
  id: 'claude-code-plugins',
  title: 'Claude Code plugins',
  description: 'What Claude Code plugins are, how they work, and practical guides to seven useful ones.',
};

const DATE = '2026-09-29';
const TAGS = ['Claude Code', 'Plugins', 'AI coding'];

interface Marketplace {
  id: string;
  repo: string;
}

const MARKETPLACES: Record<string, Marketplace> = {
  official: { id: 'claude-plugins-official', repo: 'anthropics/claude-plugins-official' },
  thedotmack: { id: 'thedotmack', repo: 'thedotmack/claude-mem' },
  contextMode: { id: 'context-mode', repo: 'mksglu/context-mode' },
};

interface PluginGuide {
  id: string;
  name: string;
  /** Short phrase used in the post title. */
  tagline: string;
  marketplace: Marketplace;
  official: boolean;
  /** Which building blocks it ships, for the "What's inside" line. */
  parts: string[];
  summary: string;
  whatItDoes: string;
  howItWorks: string;
  howToUse: string;
  commands?: string[];
  prompts: string[];
  useCases: string[];
  whenNotToUse: string;
  caveat?: string;
  onZykit: string;
}

const PLUGINS: PluginGuide[] = [
  {
    id: 'superpowers',
    name: 'superpowers',
    tagline: 'a brainstorm, plan, test-first workflow for Claude',
    marketplace: MARKETPLACES.official,
    official: true,
    parts: ['skills', 'slash commands', 'hooks'],
    summary: 'superpowers teaches Claude a disciplined engineering process: clarify the idea, plan, build test-first and verify before claiming done. Here is how it works and how to use it.',
    whatItDoes:
      'Left alone, an AI assistant tends to jump straight into code. superpowers adds the habits of a careful senior engineer: ask what you actually want, write a plan, write a failing test before the fix, find the root cause of a bug instead of guessing, and run the checks before saying something works.',
    howItWorks:
      'superpowers is mostly a library of **skills**, each a `SKILL.md` file with a short description of when it applies:\n\n- `brainstorming`: questions and a proposed design before any creative work\n- `writing-plans` and `executing-plans`: a step-by-step plan, then working through it\n- `test-driven-development`: red, green, refactor\n- `systematic-debugging`: reproduce, isolate, then fix\n- `verification-before-completion`: run the commands and read the output before claiming success\n\nA **session-start hook** adds a short instruction telling Claude to check for a matching skill before acting. When your request matches a description, Claude loads that skill’s full text and follows it.',
    howToUse:
      'It kicks in on its own for feature work and bugs. To steer it, name a step ("brainstorm this first", "debug this systematically"). For a tiny change, say so and it will skip the ceremony.',
    prompts: ['Brainstorm a CSV to JSON converter before we build it', 'This test started failing after the upgrade, debug it systematically', 'Small change, no planning needed: rename the Submit button to Save'],
    useCases: [
      'New features, where a few clarifying questions save a rewrite',
      'Bugs that have resisted a quick fix',
      'Anything you are about to commit or open a pull request for',
    ],
    whenNotToUse: 'One-line fixes and quick questions. The brainstorm and plan steps cost more time than they save there, so tell Claude to skip them.',
    onZykit: 'Every new tool starts with a brainstorm of the UI and limits, then Vitest tests in `tests/tools/<tool-id>/` before the page is written.',
  },
  {
    id: 'frontend-design',
    name: 'frontend-design',
    tagline: 'distinctive UI instead of generic defaults',
    marketplace: MARKETPLACES.official,
    official: true,
    parts: ['skills'],
    summary: 'frontend-design gives Claude design guidance so the interfaces it builds have a clear direction instead of looking templated. What it does and when to use it.',
    whatItDoes:
      'AI-generated UI often looks the same: centered hero, three cards, purple gradient. frontend-design pushes Claude to choose an aesthetic direction on purpose (typography, color, layout, motion) and carry it through.',
    howItWorks:
      'It is a single **skill**. When you ask Claude to build or restyle an interface, the skill’s guidance loads and shapes the code Claude writes. It doesn’t add tools, run commands or change anything else.',
    howToUse: 'It applies automatically to UI work. Mention it by name ("use frontend-design") to be sure it is used, and tell Claude about any design system it must stay within.',
    prompts: ['Redesign the pricing page, use frontend-design', 'Design an empty state for the search results', 'Make the settings page feel less generic, keep our colors'],
    useCases: ['New pages and landing pages', 'Empty, loading and error states', 'Giving a prototype a real visual identity'],
    whenNotToUse: 'Logic-only changes, or when a design must match an existing component or Figma file exactly.',
    onZykit: 'Used for tool pages and the Learn section, constrained to the slate and emerald tokens in `src/styles/index.css`.',
  },
  {
    id: 'context7',
    name: 'context7',
    tagline: 'current library docs inside Claude',
    marketplace: MARKETPLACES.official,
    official: true,
    parts: ['MCP server'],
    summary: 'context7 lets Claude look up current documentation for the libraries you use, so answers match your versions instead of old training data.',
    whatItDoes:
      'Libraries change faster than a model’s training data. context7 gives Claude a way to fetch the current docs for a library before answering, so config options and APIs match the version you actually have.',
    howItWorks:
      'The plugin adds an **MCP server** with two tools:\n\n- `resolve-library-id` turns a name like "vite" into a Context7 library id\n- `query-docs` fetches the sections of that library’s docs relevant to your question\n\nThe server’s instructions tell Claude to use it whenever you ask about a library, framework, SDK or CLI. Only the matching snippets enter the conversation.',
    howToUse: 'Ask library questions normally. Add "use context7" to make sure it looks things up rather than answering from memory.',
    prompts: ['How do I configure a web worker in Vite? use context7', 'What changed in React Router’s lazy routes in the latest version?', 'Show me the Tailwind 4 syntax for a custom variant'],
    useCases: ['Configuration questions for build tools', 'Upgrading to a new major version of a dependency', 'Newer libraries the model barely knows'],
    whenNotToUse: 'Questions about your own code, general programming concepts, or debugging business logic. There are no library docs to look up there.',
    caveat: 'Your query is sent to the Context7 service over the network. Don’t paste private code or secrets into library questions.',
    onZykit: 'Handy for Vite 8, React Router 8, Vitest 5 and Tailwind 4, which are all newer than most training data.',
  },
  {
    id: 'code-review',
    name: 'code-review',
    tagline: 'automated pull request review',
    marketplace: MARKETPLACES.official,
    official: true,
    parts: ['slash commands', 'agents'],
    summary: 'code-review runs several review passes over a pull request and returns only the findings worth acting on. How it works and how to run it.',
    whatItDoes: 'It reviews a pull request the way a thorough colleague would: looking for bugs, checking the change against the project’s conventions, and reading the history of the code it touches.',
    howItWorks:
      'It is a **slash command** that reads the pull request diff and runs several review passes in parallel, each in its own **agent** with a fresh context. Each finding is scored for confidence and weak ones are dropped, so you get a short list rather than a wall of nitpicks. It uses the GitHub CLI (`gh`) to read the pull request and can post the review as a comment.',
    howToUse: 'Run the command with a pull request number or URL, or just ask Claude to review a PR. The `gh` CLI (or the GitHub connector) needs to be signed in.',
    commands: ['/code-review:code-review'],
    prompts: ['/code-review:code-review 42', 'Review this PR before I merge it'],
    useCases: ['A second opinion before merging', 'Code that parses untrusted input, where one missed bounds check matters', 'Large pull requests that are hard to review in one sitting'],
    whenNotToUse: 'Local changes with no pull request yet. Ask Claude to review the diff directly instead.',
    onZykit: 'Most useful on the binary parsers in `src/shared/lib/` and tool `features/`, which read files from users.',
  },
  {
    id: 'code-simplifier',
    name: 'code-simplifier',
    tagline: 'tidy code without changing behavior',
    marketplace: MARKETPLACES.official,
    official: true,
    parts: ['agents'],
    summary: 'code-simplifier is an agent that cleans up recently changed code, improving naming and structure while keeping behavior identical.',
    whatItDoes: 'Once a change works, it is often messier than it needs to be. code-simplifier goes over the code you just changed and tidies it: clearer names, less duplication, simpler structure, consistent with the code around it.',
    howItWorks:
      'The plugin adds a **code-simplifier agent**. When you ask for a cleanup, Claude starts it as a subagent with its own context. It reads the recently modified code, rewrites it, and reports back. Because it runs separately, all its file reading stays out of your main conversation.',
    howToUse: 'Ask for it after the change works and tests pass, then run your tests and linter again to confirm nothing changed.',
    prompts: ['Simplify the code I just changed', 'Run code-simplifier on src/checkout', 'Clean up this feature before I open the PR'],
    useCases: ['Tidying a feature before review', 'Removing duplication introduced during a fix', 'Making AI-written code read like the rest of the codebase'],
    whenNotToUse: 'Code that doesn’t work yet. Fix it first: simplifying broken code can hide the bug.',
    onZykit: 'Run after a tool lands, followed by `npm test` and `npm run lint`.',
  },
  {
    id: 'claude-mem',
    name: 'claude-mem',
    tagline: 'memory that carries across sessions',
    marketplace: MARKETPLACES.thedotmack,
    official: false,
    parts: ['skills', 'hooks', 'MCP server'],
    summary: 'claude-mem records what happens in your Claude Code sessions and brings the relevant history back later. How it captures memory and how to search it.',
    whatItDoes: 'Each new Claude Code session starts fresh. claude-mem remembers what happened before (decisions, fixes, files touched) so you can pick up where you left off and ask about past work.',
    howItWorks:
      '**Hooks** watch the session: they capture your prompts and Claude’s tool use, and a local background worker turns them into short "observations" stored in a database on your machine.\n\nAt the next session start, a hook injects a summary of recent relevant work. Its **MCP tools** (`search`, `timeline`, `get_observations`) let Claude look further back when you ask.',
    howToUse: 'It runs in the background. Ask about past work in plain words. Skills such as `mem-search`, `timeline-report`, `make-plan` and `do` are there when you want them.',
    prompts: ['How did we fix the login redirect last time?', 'What did we decide about caching last week?', 'Give me a timeline report of this project'],
    useCases: ['Picking work back up after a break', 'Recalling why something was built a certain way', 'Long-running projects with many sessions'],
    whenNotToUse: 'Facts every contributor needs. Put those in the repo (a `CLAUDE.md`, docs or code comments) where everyone can see them, not in your personal memory.',
    caveat: 'Third-party code that runs hooks and a background process on your machine. Claude Code also has built-in memory, so with claude-mem you run two memory systems.',
    onZykit: 'Useful for recalling past decisions, such as why the site ships a strict Content Security Policy.',
  },
  {
    id: 'context-mode',
    name: 'context-mode',
    tagline: 'keep big outputs out of the context window',
    marketplace: MARKETPLACES.contextMode,
    official: false,
    parts: ['skills', 'hooks', 'MCP server'],
    summary: 'context-mode runs large commands in a sandbox and returns only the relevant part, so long logs and test runs don’t fill up Claude’s context window.',
    whatItDoes:
      'Every line a command prints goes into the conversation and uses up context. A single long test run can crowd out everything else. context-mode keeps the raw output aside and gives Claude only what it needs.',
    howItWorks:
      'Its **MCP server** adds tools such as `ctx_execute` and `ctx_batch_execute`. They run commands or code in a subprocess, index the full output in a local full-text search database, and return only what Claude prints or searches for.\n\n**Hooks** before tool calls nudge Claude toward these tools when an output would be large, and a session-start hook explains the rules. `ctx_search` can pull snippets back out of the index later.',
    howToUse: 'It runs in the background. Type one of its keywords to check on it.',
    commands: ['ctx stats', 'ctx doctor', 'ctx upgrade', 'ctx purge'],
    prompts: ['Run the whole test suite and tell me what failed', 'Summarise the errors in this build log', 'ctx stats'],
    useCases: ['Long test runs and build output', 'Searching large codebases or log files', 'Long sessions that would otherwise hit the context limit'],
    whenNotToUse: 'Short outputs and file edits, where plain commands and the normal editing tools are simpler.',
    caveat: 'Third-party code that runs hooks and a background process on your machine. `ctx purge` permanently wipes its knowledge base.',
    onZykit: 'Keeps Playwright runs (`npm run test:e2e`) and builds that write hundreds of pages from flooding the conversation.',
  },
];

const slugFor = (p: PluginGuide) => `${p.id}-claude-code-plugin`;
export const OVERVIEW_SLUG = 'claude-code-plugins-explained';
export const INSTALL_SLUG = 'install-and-manage-claude-code-plugins';

const installBlock = (p: PluginGuide): PostBlock => ({
  type: 'commands',
  chat: [`/plugin marketplace add ${p.marketplace.repo}`, `/plugin install ${p.id}@${p.marketplace.id}`],
  shell: [`claude plugin marketplace add ${p.marketplace.repo}`, `claude plugin install ${p.id}@${p.marketplace.id}`],
});

function pluginPost(p: PluginGuide): BlogPost {
  return {
    slug: slugFor(p),
    title: `${p.name}: ${p.tagline}`,
    summary: p.summary,
    date: DATE,
    tags: [...TAGS, p.name],
    series: claudeCodeSeries.id,
    intro: `${p.whatItDoes}\n\n**What’s inside:** ${p.parts.join(', ')}. **Published by:** ${p.official ? 'Anthropic, in the official marketplace' : `a third party, \`${p.marketplace.repo}\``}.`,
    sections: [
      { heading: 'How it works', blocks: [{ type: 'text', text: p.howItWorks }] },
      {
        heading: 'Install',
        blocks: [
          installBlock(p),
          {
            type: 'text',
            text: `Skip the first line if you already added the \`${p.marketplace.id}\` marketplace. Reload the VS Code window or restart \`claude\` afterwards. New to plugins? See the install guide in this series.`,
          },
        ],
      },
      {
        heading: 'How to use it',
        blocks: [
          { type: 'text', text: p.howToUse },
          ...(p.commands ? [{ type: 'text', text: p.commands.map((c) => `- \`${c}\``).join('\n') } as PostBlock] : []),
          { type: 'prompts', items: p.prompts },
        ],
      },
      { heading: 'Good use cases', blocks: [{ type: 'text', text: p.useCases.map((u) => `- ${u}`).join('\n') }] },
      {
        heading: 'When not to use it',
        blocks: [{ type: 'text', text: p.whenNotToUse }, ...(p.caveat ? [{ type: 'callout', tone: 'warn', title: 'Worth knowing', text: p.caveat } as PostBlock] : [])],
      },
      { heading: 'How we use it on Zykit', blocks: [{ type: 'callout', tone: 'info', text: p.onZykit }] },
    ],
  };
}

const overview: BlogPost = {
  slug: OVERVIEW_SLUG,
  title: 'Claude Code plugins explained: skills, commands, agents, hooks and MCP',
  summary: 'What a Claude Code plugin is, the five building blocks inside one, and how a plugin gets from a GitHub repo into your coding session.',
  date: DATE,
  tags: TAGS,
  series: claudeCodeSeries.id,
  intro:
    'Claude Code is Anthropic’s AI coding assistant. It runs in your terminal, in VS Code and JetBrains, and on the web. Out of the box it can read your code, run commands and make changes. **Plugins** let you extend it: teach it a workflow, give it new tools, or have it react automatically to events.\n\nThis post explains what a plugin actually is and how it works. The rest of the series covers installing plugins and seven that are worth knowing.',
  sections: [
    {
      heading: 'What is a plugin?',
      blocks: [
        {
          type: 'text',
          text: 'A plugin is a folder, usually published in a Git repo, that bundles any mix of five building blocks. Installing a plugin adds all of its parts to Claude Code at once, and disabling it removes them again.',
        },
      ],
    },
    {
      heading: 'The five building blocks',
      blocks: [
        {
          type: 'cards',
          items: [
            { title: 'Skills', text: 'Markdown instructions (`SKILL.md`). Only each skill’s name and one-line description sit in Claude’s context; when a request matches, Claude loads the full instructions and follows them.' },
            { title: 'Slash commands', text: 'Prompts you trigger yourself by typing `/plugin-name:command`, for workflows you want on demand.' },
            { title: 'Agents', text: 'Specialised subagents with their own instructions and a fresh context. Claude hands them a task and gets back only the result.' },
            { title: 'Hooks', text: 'Shell commands Claude Code runs at events such as session start, before or after a tool call, or when Claude stops. They can add context or block an action.' },
            { title: 'MCP servers', text: 'Model Context Protocol servers that give Claude new tools, such as searching documentation or a database. They run as separate processes.' },
          ],
        },
        {
          type: 'text',
          text: 'Skills are the most common part. Because only their descriptions are loaded up front, you can install many skills without filling Claude’s context; the full text loads only when it is needed.',
        },
      ],
    },
    {
      heading: 'What a plugin looks like',
      blocks: [
        {
          type: 'code',
          caption: 'A plugin folder. Every part except the manifest is optional.',
          code: 'my-plugin/\n├── .claude-plugin/\n│   └── plugin.json       name, version, description\n├── skills/\n│   └── my-skill/\n│       └── SKILL.md      description + instructions\n├── commands/             slash commands (Markdown)\n├── agents/               subagents (Markdown)\n├── hooks/\n│   └── hooks.json        event → shell command\n└── .mcp.json             MCP servers to start',
        },
        { type: 'text', text: 'You can scaffold your own with `claude plugin init my-plugin` and check it with `claude plugin validate <path>`.' },
      ],
    },
    {
      heading: 'From GitHub to your session',
      blocks: [
        {
          type: 'steps',
          items: [
            { title: 'Marketplace', text: 'A marketplace is a Git repo with a `.claude-plugin/marketplace.json` listing plugins. Adding one only registers the catalog.' },
            { title: 'Install', text: 'Installing copies the plugin into `~/.claude/plugins` and marks it enabled in your settings (`enabledPlugins`).' },
            { title: 'Load', text: 'At the next session start Claude Code reads each enabled plugin: it registers commands, agents and hooks, starts MCP servers and lists skills.' },
            { title: 'Use', text: 'As you work, Claude picks the skills and tools that match your request, hooks fire on their events, and you can run commands yourself.' },
          ],
        },
        {
          type: 'text',
          text: 'Anthropic runs the official marketplace, `anthropics/claude-plugins-official`. Anyone can publish their own marketplace from a GitHub repo, which is how third-party plugins are distributed.',
        },
      ],
    },
    {
      heading: 'Do you need to say anything special?',
      blocks: [
        {
          type: 'text',
          text: 'Mostly no. Skills load when a request matches their description, hooks run on their events, and MCP tools are used when they fit. You ask normally, for example "add a dark mode toggle", and the relevant plugin kicks in.\n\nTo be explicit, name the plugin or skill ("use context7", "brainstorm this first") or run its slash command. Type `/` in the chat to browse every command, grouped by plugin. `claude plugin details <name>` lists everything a plugin contains and roughly how much context it costs.',
        },
      ],
    },
    {
      heading: 'Can you trust a plugin?',
      blocks: [
        {
          type: 'callout',
          tone: 'warn',
          text: 'Hooks and MCP servers run code on your machine with your permissions. Plugins from the official marketplace are published by Anthropic; for third-party plugins, read the repo before installing, as you would with any dependency.',
        },
      ],
    },
    { heading: 'Next in this series', blocks: [{ type: 'posts', slugs: [INSTALL_SLUG, ...PLUGINS.map(slugFor)] }] },
  ],
};

const install: BlogPost = {
  slug: INSTALL_SLUG,
  title: 'How to install, update and remove Claude Code plugins',
  summary: 'A practical guide to marketplaces, installing plugins in the terminal or VS Code, scopes, updates, sharing plugins with your team, and fixing common errors.',
  date: DATE,
  tags: TAGS,
  series: claudeCodeSeries.id,
  intro: 'Installing a plugin takes two commands: add the marketplace it lives in, then install it. This guide covers those, plus managing plugins afterwards and the errors you are likely to hit.',
  sections: [
    {
      heading: 'Two places to run the commands',
      blocks: [
        {
          type: 'text',
          text: '- **In the Claude Code chat**: type `/plugin …`. This works in the terminal and in the VS Code extension. `/plugin` on its own opens an interactive manager.\n- **In a shell**: run `claude plugin …`. This needs the `claude` CLI on your `PATH`.\n\nBoth take the same arguments. The examples below show both; pick whichever you have.',
        },
      ],
    },
    {
      heading: '1. Add a marketplace',
      blocks: [
        { type: 'text', text: 'A marketplace is a catalog of plugins in a Git repo. Add it by its GitHub `owner/repo`:' },
        { type: 'commands', chat: ['/plugin marketplace add anthropics/claude-plugins-official'], shell: ['claude plugin marketplace add anthropics/claude-plugins-official'] },
        { type: 'text', text: 'List the ones you have with `claude plugin marketplace list`, and refresh their catalogs with `claude plugin marketplace update`.' },
      ],
    },
    {
      heading: '2. Install a plugin',
      blocks: [
        { type: 'text', text: 'Install by `name@marketplace`:' },
        { type: 'commands', chat: ['/plugin install context7@claude-plugins-official'], shell: ['claude plugin install context7@claude-plugins-official'] },
        {
          type: 'text',
          text: 'Plugins install for your user by default, so they apply in every project. Choose another scope with `--scope`:\n\n- `user`: you, in every project (default)\n- `project`: everyone working in this repo, saved in `.claude/settings.json`\n- `local`: you, in this repo only',
        },
      ],
    },
    {
      heading: '3. Reload',
      blocks: [{ type: 'text', text: 'Plugins load when a session starts. Restart `claude` in the terminal, or in VS Code run **Developer: Reload Window** from the command palette.' }],
    },
    {
      heading: 'Manage installed plugins',
      blocks: [
        {
          type: 'code',
          code: 'claude plugin list                 # what is installed and enabled\nclaude plugin details <name>       # its skills, commands, agents, hooks and context cost\nclaude plugin disable <name>       # turn it off without removing it\nclaude plugin enable <name>        # turn it back on\nclaude plugin update <name>        # update to the latest version (restart to apply)\nclaude plugin uninstall <name>     # remove it',
        },
      ],
    },
    {
      heading: 'Share plugins with your team',
      blocks: [
        {
          type: 'text',
          text: 'Commit a `.claude/settings.json` that lists the marketplaces and plugins. When a teammate opens the repo in Claude Code and trusts the folder, they are prompted to install them.',
        },
        {
          type: 'code',
          caption: '.claude/settings.json',
          code: '{\n  "extraKnownMarketplaces": {\n    "claude-plugins-official": {\n      "source": { "source": "github", "repo": "anthropics/claude-plugins-official" }\n    }\n  },\n  "enabledPlugins": {\n    "context7@claude-plugins-official": true,\n    "superpowers@claude-plugins-official": true\n  }\n}',
        },
      ],
    },
    {
      heading: 'Troubleshooting',
      blocks: [
        {
          type: 'cards',
          items: [
            {
              title: 'Plugin "x" not found in marketplace',
              text: 'The marketplace isn’t added yet, or its catalog is stale. Run `claude plugin marketplace add <owner/repo>`, or `claude plugin marketplace update <name>` if it is already added.',
            },
            {
              title: 'command not found: claude',
              text: 'The CLI isn’t on your `PATH`. Use `/plugin` in the chat instead, or install the CLI. The VS Code extension also ships a copy of `claude` inside its extension folder.',
            },
            { title: 'Installed, but nothing changed', text: 'Plugins load at session start. Restart `claude` or reload the VS Code window, then check `claude plugin list` shows it as enabled.' },
          ],
        },
      ],
    },
    { heading: 'Plugins worth installing', blocks: [{ type: 'posts', slugs: PLUGINS.map(slugFor) }] },
  ],
};

export const claudeCodePosts: BlogPost[] = [overview, install, ...PLUGINS.map(pluginPost)];
