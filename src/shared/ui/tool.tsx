// Building blocks for text-based tools: breadcrumb, code editor box and copy button.

import { useEffect, useState, type TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router';
import type { ToolDefinition } from '../../tools/types';
import { FavoriteButton } from './FavoriteButton';
import { Icon } from './ui';

/** "All tools / <Tool name>" trail shown at the top of every tool page, with the favorite star. */
export function Breadcrumb({ tool }: { tool: Pick<ToolDefinition, 'name'> & { id?: string } }) {
  const trail = (
    <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-slate-500 dark:text-slate-400">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link to="/" className="hover:text-slate-900 hover:underline dark:hover:text-white">
            All tools
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="font-medium text-slate-900 dark:text-slate-100">
          {tool.name}
        </li>
      </ol>
    </nav>
  );
  if (!tool.id) return trail;
  return (
    <div className="flex items-center justify-between gap-3">
      {trail}
      <FavoriteButton tool={{ id: tool.id, name: tool.name }} />
    </div>
  );
}

/** Monospace textarea for code and text input. Pass `label` for an accessible name. */
export function CodeArea({
  label,
  hint,
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 flex items-baseline justify-between gap-3 text-slate-600 dark:text-slate-400">
        {label}
        {hint && <span className="normal-case tracking-normal font-normal text-slate-500">{hint}</span>}
      </span>
      <textarea
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className={`block w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 font-mono text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 ${className}`}
        {...props}
      />
    </label>
  );
}

/** Read-only monospace output block. Content is always rendered as text. */
export function CodeBlock({ children, className = '' }: { children: string; className?: string }) {
  return (
    <pre
      className={`overflow-x-auto whitespace-pre-wrap break-all rounded-2xl bg-slate-100 p-4 font-mono text-sm leading-relaxed text-slate-800 dark:bg-slate-950 dark:text-slate-300 ${className}`}
    >
      {children}
    </pre>
  );
}

/** Copies `text` to the clipboard and briefly confirms. */
export function CopyButton({ text, label = 'Copy', disabled }: { text: string; label?: string; disabled?: boolean }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => {
    if (state === 'idle') return;
    const t = setTimeout(() => setState('idle'), 1500);
    return () => clearTimeout(t);
  }, [state]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      disabled={disabled || !text}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium pointer-coarse:min-h-11 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <Icon name={state === 'copied' ? 'check' : 'copy'} className="h-4 w-4" />
      <span aria-live="polite">{state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}</span>
    </button>
  );
}

/** Small segmented control (e.g. "Side by side | Unified"). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 text-sm dark:bg-slate-800">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 font-medium pointer-coarse:min-h-10 ${
            value === o.value ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
