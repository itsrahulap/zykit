import { useId, useState } from 'react';
import gitCommandBuilder from './index';
import { buildRecipe, errorsFor, initialValues, quote, RECIPES, render, RISK_LABEL, type Field, type Risk, type Shell } from './features/git-command-builder';
import { Checkbox } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Badge, Icon } from '../../shared/ui/ui';

const card = 'rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const input =
  'w-full rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 aria-[invalid=true]:border-red-500 dark:bg-slate-950 dark:text-slate-100';
const RISK_TONE: Record<Risk, 'green' | 'blue' | 'amber' | 'red'> = { read: 'green', files: 'blue', history: 'amber', destructive: 'red' };

function TextField({ field, value, error, onChange }: { field: Field; value: string; error?: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {field.label}
        {field.optional && <span className="font-normal text-slate-500 dark:text-slate-400"> (optional)</span>}
      </label>
      <input
        id={id}
        className={input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={field.kind === 'text'}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={error || field.hint ? `${id}-note` : undefined}
      />
      {(error || field.hint) && (
        <p id={`${id}-note`} className={`text-xs ${error ? 'text-red-700 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
          {error ?? field.hint}
        </p>
      )}
    </div>
  );
}

export default function GitCommandBuilderPage() {
  const [recipeId, setRecipeId] = useState(RECIPES[0].id);
  const [shell, setShell] = useState<Shell>('posix');
  const recipe = RECIPES.find((r) => r.id === recipeId)!;
  // Values per recipe, so switching tasks and back keeps what you typed.
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const v = values[recipe.id] ?? initialValues(recipe);
  const set = (id: string, x: string) => setValues((all) => ({ ...all, [recipe.id]: { ...v, [id]: x } }));
  const errors = errorsFor(recipe, v);
  const built = buildRecipe(recipe, v);
  const all = built ? built.commands.map((c) => render(c, shell)).join('\n') : '';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={gitCommandBuilder} />
      <div className="space-y-3">
        <Headline accent="git commands">Build safe </Headline>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">Pick a task, fill in the blanks, and read what each part does before you run it. Nothing runs here.</p>
      </div>
      <StatusStrip status={built ? `${RISK_LABEL[built.risk]}: ${built.effect}` : 'Fix the highlighted fields to see the command.'} tone={built ? 'good' : 'neutral'} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-label="Task" className={`min-w-0 space-y-5 ${card}`}>
          <Select label="Task" options={RECIPES.map((r) => ({ value: r.id, label: `${r.area}: ${r.title}` }))} value={recipe.id} onChange={setRecipeId} />
          <Segmented<Shell>
            label="Shell"
            options={[
              { value: 'posix', label: 'Bash / zsh' },
              { value: 'powershell', label: 'PowerShell' },
            ]}
            value={shell}
            onChange={setShell}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {recipe.fields.map((field) =>
              field.kind === 'flag' ? (
                <div key={`${recipe.id}-${field.id}`} className="sm:col-span-2">
                  <Checkbox label={field.label} checked={v[field.id] === 'true'} onChange={(c) => set(field.id, c ? 'true' : '')} />
                </div>
              ) : (
                <TextField key={`${recipe.id}-${field.id}`} field={field} value={v[field.id] ?? ''} error={errors[field.id]} onChange={(x) => set(field.id, x)} />
              ),
            )}
          </div>
        </section>

        <section aria-label="Command" aria-live="polite" className={`min-w-0 space-y-5 ${card}`}>
          {!built ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">The command appears here once every required field is valid.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone={RISK_TONE[built.risk]}>{RISK_LABEL[built.risk]}</Badge>
                <CopyButton text={all} />
              </div>
              <CodeBlock label="Commands">{all}</CodeBlock>
              <p className="text-sm text-slate-700 dark:text-slate-300">{built.effect}</p>
              {built.warning && (
                <p role="note" className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <Icon name="warn" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0">{built.warning}</span>
                </p>
              )}
              {built.safer && (
                <div>
                  <h2 className="eyebrow mb-2 text-slate-600 dark:text-slate-400">Safer alternatives</h2>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                    {built.safer.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h2 className="eyebrow mb-2 text-slate-600 dark:text-slate-400">What each part does</h2>
                {built.commands.map((cmd, i) => (
                  <dl key={i} aria-label={`Command ${i + 1} parts`} className="mb-3 divide-y divide-slate-100 text-sm dark:divide-slate-800">
                    {cmd.map((part, j) => (
                      <div key={j} className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:gap-3">
                        <dt className="shrink-0 break-all font-mono text-slate-900 sm:w-40 dark:text-slate-100">{quote(part.arg, shell)}</dt>
                        <dd className="min-w-0 text-slate-600 dark:text-slate-400">{part.explain}</dd>
                      </div>
                    ))}
                  </dl>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Commands are built in your browser and never run. Quoting follows {shell === 'posix' ? 'POSIX shells (bash, zsh)' : 'PowerShell'}; cmd.exe quotes differently.
      </p>
    </div>
  );
}
