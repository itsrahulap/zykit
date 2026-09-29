// Compact tool cards (icon, name, tagline) for related-tool and "Try it in a tool" lists.

import { Link } from 'react-router';
import { IconTile } from '../shared/ui/page';
import { toolPath } from './registry';
import type { ToolDefinition } from './types';

export const toolCardClass =
  'flex h-full items-start gap-4 rounded-3xl border border-slate-200 bg-white p-5 transition-shadow hover:border-primary-edge hover:shadow-lg hover:shadow-slate-900/5 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900';

/** Compact tool cards: icon, name, tagline. */
export function ToolCardGrid({ tools }: { tools: ToolDefinition[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((t) => (
        <li key={t.id}>
          <Link to={toolPath(t)} className={toolCardClass}>
            <IconTile icon={t.icon} />
            <span className="min-w-0">
              <span className="block font-semibold text-slate-900 dark:text-white">{t.name}</span>
              <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">{t.tagline}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
