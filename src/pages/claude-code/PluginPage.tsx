// /claude-code/<plugin-id> — one plugin in depth: purpose, how it works, install, usage and use cases.

import { Link, useParams } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { IconTile } from '../../shared/ui/page';
import { Badge, Icon } from '../../shared/ui/ui';
import { NotFoundPage } from '../NotFoundPage';
import { ClaudeCodeBreadcrumb, InstallCommands, PartBadges, Section, card, inlineCode } from './components';
import { PLUGINS, getPlugin, marketplaceFor, pluginInstallCommands, pluginMeta, pluginPath, type ClaudePlugin } from './plugins';

function MissingPlugin() {
  useDocumentMeta({ title: 'Not found', noindex: true });
  return <NotFoundPage />;
}

function Plugin({ plugin }: { plugin: ClaudePlugin }) {
  useDocumentMeta(pluginMeta(plugin));
  const market = marketplaceFor(plugin);
  const i = PLUGINS.indexOf(plugin);
  const prev = PLUGINS[i - 1];
  const next = PLUGINS[i + 1];

  return (
    <article className="space-y-12">
      <header className="space-y-5">
        <ClaudeCodeBreadcrumb current={plugin.name} />
        <div className="flex flex-wrap items-center gap-4">
          <IconTile icon={plugin.icon} size="lg" />
          <Badge tone={plugin.official ? 'green' : 'amber'}>{plugin.official ? 'Official Anthropic plugin' : 'Third-party plugin'}</Badge>
        </div>
        <h1 className="font-mono text-4xl font-bold tracking-tight break-words text-slate-900 sm:text-5xl dark:text-white">{plugin.name}</h1>
        <p className="text-xl font-medium text-slate-700 dark:text-slate-300">{plugin.tagline}</p>
        <p className="max-w-3xl text-lg text-slate-600 dark:text-slate-400">{plugin.purpose}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <PartBadges parts={plugin.parts} />
          <span>
            Source:{' '}
            <a href={`https://github.com/${market.repo}`} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-slate-900 dark:hover:text-white">
              {market.repo}
            </a>
          </span>
        </div>
      </header>

      <Section id="how" title="How it works">
        <div className="max-w-3xl space-y-4 text-slate-700 dark:text-slate-300">
          {plugin.howItWorks.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section id="install" title="Install">
          <div className={card}>
            <InstallCommands commands={(prefix) => pluginInstallCommands(plugin, prefix)} />
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              Already added the <code className={inlineCode}>{plugin.marketplace}</code> marketplace? Skip the first line. Reload the VS Code window or
              restart <code className={inlineCode}>claude</code> afterwards.
            </p>
          </div>
        </Section>

        <Section id="use" title="How to use">
          <div className={`${card} space-y-5`}>
            <p className="text-slate-700 dark:text-slate-300">{plugin.howToUse}</p>
            {plugin.commands && (
              <div>
                <p className="eyebrow mb-2 text-slate-500">Commands</p>
                <ul className="flex flex-wrap gap-1.5">
                  {plugin.commands.map((c) => (
                    <li key={c}>
                      <code className={inlineCode}>{c}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="eyebrow mb-2 text-slate-500">Try saying</p>
              <ul className="space-y-1.5">
                {plugin.prompts.map((p) => (
                  <li key={p} className="rounded-xl bg-primary-soft px-3 py-2 text-primary-ink dark:bg-slate-800 dark:text-slate-200">
                    “{p}”
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section id="use-cases" title="Use cases in this project">
          <ul className="space-y-2 text-slate-700 dark:text-slate-300">
            {plugin.useCases.map((u) => (
              <li key={u} className="flex gap-2">
                <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="not" title="When not to use it">
          <p className="text-slate-700 dark:text-slate-300">{plugin.whenNotToUse}</p>
          {plugin.caveat && (
            <p className="mt-4 flex gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <Icon name="warn" className="mt-0.5 h-4 w-4 shrink-0" />
              {plugin.caveat}
            </p>
          )}
        </Section>
      </div>

      <nav aria-label="Other plugins" className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between dark:border-slate-800">
        {prev ? (
          <Link to={pluginPath(prev)} className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            <Icon name="chevron-left" className="h-4 w-4" /> {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={pluginPath(next)} className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            {next.name} <Icon name="chevron-right" className="h-4 w-4" />
          </Link>
        ) : (
          <Link to="/claude-code#plugins" className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            All plugins <Icon name="chevron-right" className="h-4 w-4" />
          </Link>
        )}
      </nav>
    </article>
  );
}

export default function PluginPage() {
  const { pluginId = '' } = useParams();
  const plugin = getPlugin(pluginId);
  return plugin ? <Plugin plugin={plugin} /> : <MissingPlugin />;
}
