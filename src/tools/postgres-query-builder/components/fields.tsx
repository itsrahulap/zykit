// Small form controls shared by the editors in this tool.

import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../../../shared/ui/ui';

export const inputClass =
  'block w-full rounded-lg border border-field-edge bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 pointer-coarse:min-h-11 dark:bg-slate-900 dark:text-slate-100';

export function TextField({ label, hideLabel, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hideLabel?: boolean }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400'}>
        {label}
      </label>
      <input id={id} spellCheck={false} autoComplete="off" className={inputClass} {...props} />
    </div>
  );
}

/** Compact native select for dense rows; the house Select always shows its label inline. */
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
  hideLabel = true,
  className = '',
}: {
  label: string;
  value: T | '';
  options: readonly { value: T; label: string }[] | readonly T[];
  onChange: (v: T) => void;
  hideLabel?: boolean;
  className?: string;
}) {
  const id = useId();
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400'}>
        {label}
      </label>
      <select id={id} className={inputClass} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {value === '' && <option value="">Choose…</option>}
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Check({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`inline-flex items-center gap-1.5 text-sm ${disabled ? 'opacity-50' : ''}`}>
      <input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/** Icon-only button with an accessible name. */
export function IconButton({ label, icon, onClick, disabled }: { label: string; icon: 'x' | 'copy' | 'chevron-left' | 'chevron-right'; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 pointer-coarse:h-11 pointer-coarse:w-11 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      <Icon name={icon} className="h-4 w-4" />
    </button>
  );
}

export function SmallButton({ children, onClick, disabled, tone = 'default' }: { children: ReactNode; onClick: () => void; disabled?: boolean; tone?: 'default' | 'danger' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium ring-1 ring-inset disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-11 ${
        tone === 'danger'
          ? 'text-red-700 ring-red-200 hover:bg-red-50 dark:text-red-400 dark:ring-red-900 dark:hover:bg-red-950'
          : 'text-slate-700 ring-field-edge hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

export function Problems({ items, title = 'Fix these to generate SQL' }: { items: string[]; title?: string }) {
  if (!items.length) return null;
  return (
    <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      <p className="flex items-center gap-1.5 font-semibold">
        <Icon name="warn" className="h-4 w-4" /> {title}
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-6">
        {items.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
