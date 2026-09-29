// /claude-code — the Claude Code plugins this site is built with: purpose, install, usage and use cases.

import { useState } from 'react';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { Headline, IconTile } from '../../shared/ui/page';
import { CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Badge, Icon } from '../../shared/ui/ui';
import { FLOW, PLUGINS, claudeCodeMeta, installCommands, marketplaceFor, type ClaudePlugin } from './plugins';

const sectionTitle = 'eyebrow mb-5 border-b border-slate-200 pb-3 text-slate-600 dark:border-slate-800 dark:text-slate-400';
const card = 'rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-slate-900';
const inlineCode = 'rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-slate-800';

function PluginCard({ plugin }: { plugin: ClaudePlugin }) {
  const market = marketplaceFor(plugin);
  return (
    <article id={plugin.id} className={`${card} flex h-full scroll-mt-6 flex-col`}>
      <div className="flex items-start justify-between gap-3">
        <IconTile icon={plugin.icon} size="lg" />
        <Badge tone={plugin.official ? 'green' : 'amber'}>{plugin.official ? 'Official' : 'Third party'}</Badge>
      </div>
      <h3 className="mt-5 font-mono text-xl font-bold tracking-tight text-slate-900 dark:text-white">{plugin.name}</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        from{' '}
        <a href={`https://github.com/${market.repo}`} className="underline underline-offset-2 hover:text-slate-900 dark:hover:text-white" rel="noreferrer" target="_blank">
          {market.repo}
        </a>
      </p>

      <dl className="mt-5 space-y-4 text-sm text-slate-700 dark:text-slate-300">
        <div>
          <dt className="eyebrow mb-1 text-slate-500">Purpose</dt>
          <dd>{plugin.purpose}</dd>
        </div>
        <div>
          <dt className="eyebrow mb-1 text-slate-500">How to use</dt>
          <dd>{plugin.howToUse}</dd>
          {plugin.commands && (
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {plugin.commands.map((c) => (
                <code key={c} className={inlineCode}>
                  {c}
                </code>
              ))}
            </dd>
          )}
        </div>
        <div>
          <dt className="eyebrow mb-1 text-slate-500">Try saying</dt>
          {plugin.prompts.map((p) => (
            <dd key={p} className="mt-1.5 rounded-xl bg-primary-soft px-3 py-2 text-primary-ink dark:bg-slate-800 dark:text-slate-200">
              “{p}”
            </dd>
          ))}
        </div>
        <div>
          <dt className="eyebrow mb-1 text-slate-500">Use cases here</dt>
          <dd>
            <ul className="space-y-1">
              {plugin.useCases.map((u) => (
                <li key={u} className="flex gap-2">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{u}</span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      {plugin.caveat && (
        <p className="mt-5 flex gap-2 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
          {plugin.caveat}
        </p>
      )}
    </article>
  );
}

function InstallSection() {
  const [mode, setMode] = useState<'/plugin' | 'claude plugin'>('/plugin');
  const commands = installCommands(mode).join('\n');
  return (
    <section aria-labelledby="install" className="space-y-6">
      <h2 id="install" className={sectionTitle}>
        Install
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Automatically</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            The repo’s <code className={inlineCode}>.claude/settings.json</code> lists every marketplace and plugin below. Open the project in
            Claude Code (terminal or VS Code), trust the folder and accept the install prompt, then reload the window or restart{' '}
            <code className={inlineCode}>claude</code>.
          </p>
          <h3 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">Manage</h3>
          <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-400">
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Manually</h3>
            <Segmented
              label="Where you run the commands"
              value={mode}
              onChange={setMode}
              options={[
                { value: '/plugin', label: 'In Claude Code' },
                { value: 'claude plugin', label: 'In a shell' },
              ]}
            />
          </div>
          <CodeBlock className="mt-4">{commands}</CodeBlock>
          <div className="mt-3 flex justify-end">
            <CopyButton text={commands} label="Copy commands" />
          </div>
        </div>
      </div>
    </section>
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
          Zykit is developed with Claude Code and {PLUGINS.length} plugins. Plugins add skills, slash commands, agents and tools that change how
          Claude works on the code. They don’t change the site itself: every tool still runs entirely in your browser.
        </p>
        <nav aria-label="Plugins" className="flex flex-wrap gap-2 text-sm">
          {PLUGINS.map((p) => (
            <a key={p.id} href={`#${p.id}`} className="rounded-xl bg-primary px-3 py-1.5 font-mono text-primary-ink hover:bg-primary-hover">
              {p.name}
            </a>
          ))}
        </nav>
      </section>

      <section aria-labelledby="special" className={`${card} flex gap-4`}>
        <Icon name="lightbulb" className="mt-1 h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div>
          <h2 id="special" className="text-lg font-bold text-slate-900 dark:text-white">
            Do I need to say anything special?
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Mostly no. Skills load on their own when a request matches, so you ask normally. To be explicit, name the plugin (“use context7”,
            “brainstorm this first”) or run its slash command. Type <code className={inlineCode}>/</code> in the chat to browse every command,
            grouped by plugin.
          </p>
        </div>
      </section>

      <InstallSection />

      <section aria-labelledby="plugins">
        <h2 id="plugins" className={sectionTitle}>
          The plugins
        </h2>
        <ul className="grid gap-6 md:grid-cols-2">
          {PLUGINS.map((p) => (
            <li key={p.id}>
              <PluginCard plugin={p} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="flow">
        <h2 id="flow" className={sectionTitle}>
          How they fit together
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((f, i) => (
            <li key={f.step} className={card}>
              <span className="eyebrow text-slate-500">Step {i + 1}</span>
              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{f.step}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
