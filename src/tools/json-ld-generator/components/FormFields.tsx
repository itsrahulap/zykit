import { useId } from 'react';
import { validateValue, splitValues } from '../features/validate';
import type { Field, Level, ListDef } from '../features/schemas';
import { Badge, Button, Icon } from '../../../shared/ui/ui';

const INPUT =
  'block w-full rounded-xl border border-field-edge bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 aria-[invalid=true]:border-red-500 dark:bg-slate-900 dark:text-slate-100';

const LEVEL_BADGE: Record<Level, { text: string; tone: 'amber' | 'blue' | 'neutral' }> = {
  required: { text: 'Required', tone: 'amber' },
  recommended: { text: 'Recommended', tone: 'blue' },
  optional: { text: 'Optional', tone: 'neutral' },
};

export const NATIVE_SELECT = INPUT;

export function FieldInput({ f, value, onChange, level }: { f: Field; value: string; onChange: (v: string) => void; level: Level }) {
  const id = useId();
  const parts = value.trim() ? splitValues(f.kind, value) : [];
  const err = f.kind === 'select' ? null : parts.map((p) => validateValue(f.kind, p)).find(Boolean) ?? null;
  const badge = LEVEL_BADGE[level];
  const note = [f.help, err && `Check this: ${err}`].filter(Boolean);
  const multi = f.kind === 'textarea' || f.kind === 'urls' || f.kind === 'lines';
  return (
    <div className="min-w-0">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {f.label}
        </label>
        <Badge tone={badge.tone}>{f.when && level === 'required' ? 'Required if used' : badge.text}</Badge>
      </div>
      {f.kind === 'select' || f.kind === 'bool' ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT} dark:[color-scheme:dark]`}>
          <option value="">Not set</option>
          {(f.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : multi ? (
        <textarea id={id} rows={f.kind === 'textarea' ? 3 : 3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} aria-invalid={!!err} aria-describedby={note.length ? `${id}-n` : undefined} className={`${INPUT} resize-y`} />
      ) : (
        <input id={id} type="text" inputMode={f.kind === 'number' || f.kind === 'price' ? 'decimal' : undefined} value={value} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} aria-invalid={!!err} aria-describedby={note.length ? `${id}-n` : undefined} className={INPUT} />
      )}
      {note.length > 0 && (
        <p id={`${id}-n`} className={`mt-1 text-xs ${err ? 'text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
          {note.join(' ')}
        </p>
      )}
    </div>
  );
}

export function ListEditor({
  def,
  items,
  onChange,
  levelOf,
}: {
  def: ListDef;
  items: Record<string, string>[];
  onChange: (items: Record<string, string>[]) => void;
  levelOf: (f: ListDef) => Level;
}) {
  const badge = LEVEL_BADGE[levelOf(def)];
  const shown = items.length ? items : [{}];
  return (
    <fieldset className="min-w-0 space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {def.label} <Badge tone={badge.tone}>{badge.text}</Badge>
      </legend>
      {shown.map((it, i) => (
        <div key={i} className="space-y-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {def.itemLabel} {i + 1}
            </h4>
            <Button variant="ghost" aria-label={`Remove ${def.itemLabel.toLowerCase()} ${i + 1}`} disabled={shown.length <= 1 && !Object.values(it).some(Boolean)} onClick={() => onChange(shown.filter((_, j) => j !== i))}>
              <Icon name="x" className="h-4 w-4" />
            </Button>
          </div>
          {def.fields.map((f) => (
            <FieldInput key={f.key} f={{ ...f, label: `${def.itemLabel} ${i + 1} ${f.label.toLowerCase()}` }} level={f.exceptLast && i === shown.length - 1 ? 'optional' : f.level} value={it[f.key] ?? ''} onChange={(v) => onChange(shown.map((x, j) => (j === i ? { ...x, [f.key]: v } : x)))} />
          ))}
        </div>
      ))}
      <Button variant="secondary" disabled={shown.length >= 50} onClick={() => onChange([...shown, {}])}>
        Add {def.itemLabel.toLowerCase()}
      </Button>
    </fieldset>
  );
}
