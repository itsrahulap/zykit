// /claude-code — what Claude Code plugins are, how they work, and the ones this site is built with.

import { Link } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { Headline, IconTile } from '../../shared/ui/page';
import { Badge, Icon } from '../../shared/ui/ui';
import { InstallCommands, PartBadges, Section, card, inlineCode } from './components';
import { FLOW, LIFECYCLE, PARTS, PLUGINS, claudeCodeMeta, installCommands, pluginPath, type ClaudePlugin } from './plugins';

function PluginCard({ plugin }: { plugin: ClaudePlugin }) {
  return (
    <Link
      to={pluginPath(plugin)}
      className={`${card} flex h-full flex-col transition-shadow hover:border-primary-edge hover:shadow-lg hover:shadow-slate-900/5 motion-reduce:transition-none`}
    >
      <span className="flex items-start justify-between gap-3">
        <IconTile icon={plugin.icon} size="lg" />
        <Badge tone={plugin.official ? 'green' : 'amber'}>{plugin.official ? 'Official' : 'Third party'}</Badge>
      </span>
      <span className="mt-5 font-mono text-xl font-bold tracking-tight text-slate-900 dark:text-white">{plugin.name}</span>
      <span className="mt-1 font-medium text-slate-700 dark:text-slate-300">{plugin.tagline}</span>
      <span className="mt-3 flex-1 text-sm text-slate-600 dark:text-slate-400">{plugin.purpose}</span>
      <span className="mt-4">
        <PartBadges parts={plugin.parts} />
      </span>
      <span className="mt-6 inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
        How it works <Icon name="arrow" className="h-4 w-4" />
      </span>
    </Link>
  );
}

export default function ClaudeCodePage() {
  useDocumentMeta(claudeCodeMeta());
  return (
    <div className="space-y-14">
      <section className="space-y-5">
        <p className="eyebrow flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <Icon name="puzzle" className="h-4 w-4" /> How this site is built
        </p>
        <Headline accent="Claude Code">Built with </Headline>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Zykit is developed with Claude Code, Anthropic’s AI coding assistant, in the terminal and in VS Code, extended with {PLUGINS.length}{' '}
          plugins. This section explains what plugins are, how they work, and how to install and use each one.
        </p>
        <p className="max-w-2xl text-slate-600 dark:text-slate-400">
          Plugins change how Claude works on the code. They don’t change the site: every tool still runs entirely in your browser.
        </p>
      </section>

      <Section id="what" title="What is a plugin?">
        <p className="max-w-3xl text-slate-700 dark:text-slate-300">
          A plugin is a folder, usually published in a Git repo, that bundles any mix of five building blocks. Installing one adds all of its
          parts to Claude Code at once.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PARTS.map((p) => (
            <li key={p.kind} className={`${card} !p-5`}>
              <IconTile icon={p.icon} />
              <p className="mt-4 font-bold text-slate-900 dark:text-white">{p.name}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{p.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="how" title="How it works">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LIFECYCLE.map((l, i) => (
            <li key={l.step} className={card}>
              <span className="eyebrow text-slate-500">Step {i + 1}</span>
              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{l.step}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{l.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="install" title="Install">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={card}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Automatically</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              The repo’s <code className={inlineCode}>.claude/settings.json</code> lists every marketplace and plugin below. Open the project in
              Claude Code, trust the folder and accept the install prompt, then reload the VS Code window or restart{' '}
              <code className={inlineCode}>claude</code>.
            </p>
            <h3 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">Manage</h3>
            <ul className="mt-2 space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>
                <code className={inlineCode}>/plugin</code> opens the plugin manager in Claude Code
              </li>
              <li>
                <code className={inlineCode}>claude plugin list</code> shows what is installed
              </li>
              <li>
                <code className={inlineCode}>claude plugin disable &lt;name&gt;</code> turns one off
              </li>
              <li>
                <code className={inlineCode}>claude plugin uninstall &lt;name&gt;</code> removes it
              </li>
            </ul>
          </div>
          <div className={card}>
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Manually, all at once</h3>
            <InstallCommands commands={installCommands} />
          </div>
        </div>
      </Section>

      <Section id="use" title="How to use them">
        <div className={`${card} flex gap-4`}>
          <Icon name="lightbulb" className="mt-1 h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-3 text-slate-600 dark:text-slate-400">
            <p className="text-lg font-bold text-slate-900 dark:text-white">Do I need to say anything special?</p>
            <p>
              Mostly no. Skills load on their own when a request matches their description, hooks run on their events, and MCP tools are picked
              when they fit. You ask normally: “add a tool that converts YAML to JSON”.
            </p>
            <p>
              To be explicit, name the plugin (“use context7”, “brainstorm this first”) or run its slash command. Type{' '}
              <code className={inlineCode}>/</code> in the chat to browse every command, grouped by plugin.
            </p>
          </div>
        </div>
      </Section>

      <Section id="plugins" title={`The ${PLUGINS.length} plugins`}>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLUGINS.map((p) => (
            <li key={p.id}>
              <PluginCard plugin={p} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="flow" title="How they fit together">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((f, i) => (
            <li key={f.step} className={card}>
              <span className="eyebrow text-slate-500">Step {i + 1}</span>
              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{f.step}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.text}</p>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
