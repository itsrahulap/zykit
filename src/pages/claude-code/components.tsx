// Building blocks shared by the Claude Code overview and plugin pages.

import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Icon } from '../../shared/ui/ui';
import { CLAUDE_CODE_PATH, PARTS, type CommandPrefix, type PartKind } from './plugins';

export const sectionTitle = 'eyebrow mb-5 border-b border-slate-200 pb-3 text-slate-600 dark:border-slate-800 dark:text-slate-400';
export const card = 'rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-slate-900';
export const inlineCode = 'rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-slate-800';

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className={sectionTitle}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Commands with a toggle between typing them in Claude Code (/plugin) and in a shell (claude plugin). */
export function InstallCommands({ commands }: { commands: (prefix: CommandPrefix) => string[] }) {
  const [prefix, setPrefix] = useState<CommandPrefix>('/plugin');
  const text = commands(prefix).join('\n');
  return (
    <div>
      <Segmented
        label="Where you run the commands"
        value={prefix}
        onChange={setPrefix}
        options={[
          { value: '/plugin', label: 'In Claude Code' },
          { value: 'claude plugin', label: 'In a shell' },
        ]}
      />
      <CodeBlock className="mt-4">{text}</CodeBlock>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {prefix === '/plugin' ? 'Type these in the Claude Code chat, one at a time.' : 'Run these in a terminal where the claude CLI is installed.'}
        </p>
        <CopyButton text={text} label="Copy" />
      </div>
    </div>
  );
}

export function PartBadges({ parts }: { parts: PartKind[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="What it contains">
      {PARTS.filter((p) => parts.includes(p.kind)).map((p) => (
        <li key={p.kind} className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <Icon name={p.icon} className="h-3.5 w-3.5" />
          {p.name}
        </li>
      ))}
    </ul>
  );
}

export function ClaudeCodeBreadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to={CLAUDE_CODE_PATH} className="hover:text-slate-900 hover:underline dark:hover:text-white">
            Claude Code
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="font-mono text-slate-700 dark:text-slate-300">
          {current}
        </li>
      </ol>
    </nav>
  );
}
