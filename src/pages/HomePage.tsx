import { Link } from 'react-router';
import { SITE } from '../config/site';
import { Headline, IconTile } from '../shared/ui/page';
import { Icon } from '../shared/ui/ui';
import { TOOLS, toolPath } from '../tools/registry';
import type { ToolDefinition } from '../tools/types';

function ToolCard({ tool }: { tool: ToolDefinition }) {
  const soon = tool.status === 'coming-soon';
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <IconTile icon={tool.icon} size="lg" />
        {tool.status !== 'available' && (
          <span className="eyebrow rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {soon ? 'Coming soon' : 'Beta'}
          </span>
        )}
      </div>
      <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">{tool.name}</h3>
      <p className="mt-1 font-medium text-slate-700 dark:text-slate-300">{tool.tagline}</p>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{tool.description}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
        {tool.tags.map((t) => (
          <li key={t} className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {t}
          </li>
        ))}
      </ul>
      {!soon && (
        <span className="mt-6 inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
          Open tool <Icon name="arrow" className="h-4 w-4" />
        </span>
      )}
    </>
  );
  const cls = 'flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-slate-900';
  return soon ? (
    <div className={`${cls} opacity-70`}>{body}</div>
  ) : (
    <Link
      to={toolPath(tool)}
      className={`${cls} transition-shadow hover:border-primary-edge hover:shadow-lg hover:shadow-slate-900/5 motion-reduce:transition-none`}
    >
      {body}
    </Link>
  );
}

export function HomePage() {
  const categories = [...new Set(TOOLS.map((t) => t.category))];
  return (
    <div className="space-y-14">
      <section className="space-y-5">
        <p className="eyebrow text-emerald-700 dark:text-emerald-400">{SITE.tagline}</p>
        <Headline accent="device">Useful tools that stay on your </Headline>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Every tool here runs entirely in your browser. Your files are never uploaded, stored or seen by anyone else.
        </p>
        <ul className="flex flex-wrap gap-2 text-sm text-slate-700 dark:text-slate-300">
          {['No uploads', 'No accounts', 'No tracking', 'Works offline once loaded'].map((p) => (
            <li key={p} className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-primary-ink">
              <Icon name="check" className="h-4 w-4" /> {p}
            </li>
          ))}
        </ul>
      </section>

      {categories.map((cat) => (
        <section key={cat} aria-labelledby={`cat-${cat}`}>
          <h2 id={`cat-${cat}`} className="eyebrow mb-5 border-b border-slate-200 pb-3 text-slate-600 dark:border-slate-800 dark:text-slate-400">
            {cat}
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.filter((t) => t.category === cat).map((t) => (
              <li key={t.id}>
                <ToolCard tool={t} />
              </li>
            ))}
            <li>
              <div className="flex h-full min-h-60 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700">
                <Icon name="grid" className="h-6 w-6" />
                <p className="mt-3 font-semibold text-slate-700 dark:text-slate-300">More tools on the way</p>
                <p className="mt-1 text-sm">New tools are added here as they&rsquo;re built.</p>
              </div>
            </li>
          </ul>
        </section>
      ))}
    </div>
  );
}
