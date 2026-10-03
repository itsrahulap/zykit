import { useId, type ReactNode } from 'react';
import { CodeBlock, CopyButton } from '../../../shared/ui/tool';

const FIELD =
  'rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-900 dark:text-slate-100';

export function Slider({ label, value, min, max, step = 1, unit = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <label className="flex min-w-0 items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
      <span className="w-28 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-emerald-600 pointer-coarse:min-h-11"
      />
      <span className="w-16 shrink-0 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
        {value}
        {unit}
      </span>
    </label>
  );
}

export function NumField({ label, value, onChange, step = 1, min, max, width = 'w-24' }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; width?: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      {label}
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
        className={`${width} ${FIELD}`}
      />
    </label>
  );
}

export function ColorField({ label, color, alpha, onColor, onAlpha }: { label: string; color: string; alpha?: number; onColor: (c: string) => void; onAlpha?: (a: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
      <label className="inline-flex items-center gap-2">
        {label}
        <input type="color" value={color} onChange={(e) => onColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-field-edge bg-white p-0.5 pointer-coarse:h-11 dark:bg-slate-900" />
      </label>
      {onAlpha && alpha !== undefined && (
        <label className="inline-flex items-center gap-2">
          Opacity
          <input type="range" aria-label={`${label} opacity`} min={0} max={1} step={0.01} value={alpha} onChange={(e) => onAlpha(Number(e.target.value))} className="w-20 accent-emerald-600 pointer-coarse:min-h-11" />
          <span className="w-10 font-mono tabular-nums text-slate-900 dark:text-slate-100">{alpha}</span>
        </label>
      )}
    </div>
  );
}

export function Checkbox2({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700 pointer-coarse:min-h-11 dark:text-slate-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-emerald-600 dark:border-slate-600" />
      {label}
    </label>
  );
}

export function Output({ title = 'CSS', css, tailwind }: { title?: string; css: string; tailwind?: string }) {
  const id = useId();
  return (
    <div className="space-y-4" aria-labelledby={id} role="group">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 id={id} className="eyebrow text-slate-600 dark:text-slate-400">
            {title}
          </h3>
          <CopyButton text={css} label="Copy CSS" />
        </div>
        <CodeBlock label={title}>{css}</CodeBlock>
      </div>
      {tailwind && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="eyebrow text-slate-600 dark:text-slate-400">Tailwind arbitrary value</h3>
            <CopyButton text={tailwind} label="Copy Tailwind" />
          </div>
          <CodeBlock label="Tailwind class">{tailwind}</CodeBlock>
        </div>
      )}
    </div>
  );
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <legend className="eyebrow px-1 text-slate-600 dark:text-slate-400">{title}</legend>
      {children}
    </fieldset>
  );
}
