// Small labelled form controls used across the designer's editors.

import type { ReactNode } from 'react';
import { Icon } from '../../../shared/ui/ui';

export const inputCls =
  'w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
export const smallLabel = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400';

export function TextField({
  label,
  value,
  onChange,
  mono,
  className = 'min-w-0 flex-1 basis-40',
}: {
  label: string;
  value: unknown;
  onChange: (v: string) => void;
  mono?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={smallLabel}>{label}</span>
      <input
        className={`${inputCls} ${mono ? 'font-mono' : ''}`}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoComplete="off"
      />
    </label>
  );
}

export function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700 pointer-coarse:h-11 pointer-coarse:w-11 dark:text-slate-400 dark:hover:bg-red-950 dark:hover:text-red-300"
    >
      <Icon name="x" className="h-4 w-4" />
    </button>
  );
}

export function AddButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-11 dark:text-emerald-400 dark:hover:bg-emerald-950"
    >
      <Icon name="plus" className="h-4 w-4" /> {children}
    </button>
  );
}

/** A labelled text input plus an "Add" button, for creating keyed entries (paths, statuses, schemas). */
export function AddKeyRow({
  label,
  value,
  onChange,
  onAdd,
  error,
  button,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  error: string | null;
  button: string;
}) {
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!error && value.trim()) onAdd();
      }}
    >
      <TextField label={label} value={value} onChange={onChange} mono />
      <button
        type="submit"
        disabled={!!error || !value.trim()}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-11 dark:text-emerald-400 dark:ring-emerald-900 dark:hover:bg-emerald-950"
      >
        <Icon name="plus" className="h-4 w-4" /> {button}
      </button>
      {error && value.trim() && <p className="basis-full text-sm text-red-700 dark:text-red-400">{error}</p>}
    </form>
  );
}
