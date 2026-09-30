// Building blocks for text-based tools: breadcrumb, code editor box and copy button.

import { useEffect, useId, useState, type TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router';
import type { ToolDefinition } from '../../tools/types';
import { DropZone } from './DropZone';
import { FavoriteButton } from './FavoriteButton';
import { ShareButton } from './ShareButton';
import { useCurrentTool } from './toolContext';
import { scrollRegionProps, useOverflow } from '../hooks/useOverflow';
import { Icon } from './ui';

/** "All tools / <Tool name>" trail shown at the top of every tool page, with the favorite star. */
export function Breadcrumb({ tool }: { tool: Pick<ToolDefinition, 'name'> & { id?: string } }) {
  const ctx = useCurrentTool();
  const trail = (
    <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-slate-500 dark:text-slate-400">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link to="/" className="inline-flex items-center hover:text-slate-900 hover:underline pointer-coarse:min-h-11 dark:hover:text-white">
            All tools
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li id={tool.id ? `crumb-${tool.id}` : undefined} aria-current="page" className="font-medium text-slate-900 dark:text-slate-100">
          {tool.name}
        </li>
      </ol>
    </nav>
  );
  if (!tool.id) return trail;
  return (
    <div className="flex items-center justify-between gap-3">
      {trail}
      <div className="flex shrink-0 items-center gap-1">
        {ctx?.tool.id === tool.id && ctx.tool.shareable && <ShareButton />}
        <FavoriteButton tool={{ id: tool.id, name: tool.name }} describedBy={`crumb-${tool.id}`} />
      </div>
    </div>
  );
}

/**
 * Monospace textarea for code and text input. Pass `label` for an accessible name, and
 * `onFileText` to accept a dropped text file (with a drop state and size cap). `hint` is shown
 * next to the label and linked to the field with aria-describedby (a description, not part of the name).
 */
export function CodeArea({
  label,
  hint,
  className = '',
  onFileText,
  maxFileBytes,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  onFileText?: (text: string, file: File) => void;
  maxFileBytes?: number;
}) {
  const autoId = useId();
  const id = props.id ?? `${autoId}-field`;
  const hintId = `${id}-hint`;
  const describedBy = [props['aria-describedby'], hint && hintId].filter(Boolean).join(' ') || undefined;
  const field = (
    <div>
      <div className="eyebrow mb-2 flex items-baseline justify-between gap-3 text-slate-600 dark:text-slate-400">
        <label htmlFor={id}>{label}</label>
        {hint && (
          <span id={hintId} className="normal-case tracking-normal font-normal text-slate-500 dark:text-slate-400">
            {hint}
          </span>
        )}
      </div>
      <textarea
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className={`block w-full resize-y rounded-2xl border border-field-edge bg-white p-4 font-mono text-sm leading-relaxed text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-900 dark:text-slate-100 ${className}`}
        {...props}
        id={id}
        aria-describedby={describedBy}
      />
    </div>
  );
  if (!onFileText || props.readOnly || props.disabled) return field;
  return (
    <DropZone onText={onFileText} maxBytes={maxFileBytes}>
      {field}
    </DropZone>
  );
}

/**
 * Read-only monospace output block. Content is always rendered as text. When it overflows it
 * becomes a focusable, named region (`label`, default "Code") so keyboard users can scroll it.
 */
export function CodeBlock({ children, className = '', label = 'Code' }: { children: string; className?: string; label?: string }) {
  const [ref, overflowing] = useOverflow<HTMLPreElement>([children]);
  return (
    <pre
      ref={ref}
      {...scrollRegionProps(overflowing, label)}
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
          className={`rounded-lg px-3 py-1.5 font-medium pointer-coarse:min-h-11 ${
            value === o.value ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
