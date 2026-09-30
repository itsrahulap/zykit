import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import cronBuilder from './index';
import {
  builderToField,
  DAY_NAMES,
  describeCron,
  FIELD_DEFS,
  FIELD_ORDER_5,
  FIELD_ORDER_6,
  fieldToBuilder,
  formatRun,
  MONTH_NAMES,
  nextRuns,
  parseCron,
  PRESETS,
  setField,
  splitFields,
  type BuilderMode,
  type BuilderState,
  type FieldDef,
  type FieldName,
} from './features/cron';
import { useShareState } from '../../shared/hooks/useShareState';
import { Checkbox } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CopyButton, Segmented } from '../../shared/ui/tool';
import { Icon } from '../../shared/ui/ui';

const card = 'min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const eyebrow = 'eyebrow mb-3 flex items-center gap-2 text-slate-600 dark:text-slate-400';

function timeZones(): string[] {
  let list: string[] = [];
  try {
    list = Intl.supportedValuesOf?.('timeZone') ?? [];
  } catch {
    list = [];
  }
  return [...new Set(['UTC', localZone(), ...list])];
}
function localZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function valueLabel(def: FieldDef, v: number): string {
  if (def.name === 'month') return MONTH_NAMES[v - 1].slice(0, 3);
  if (def.name === 'dow') return DAY_NAMES[v].slice(0, 3);
  return String(v);
}

/**
 * The "specific values" picker: one Tab stop for the whole grid (roving tabIndex), with the arrow keys,
 * Home and End moving between values and Space/Enter toggling. 60 minutes no longer means 60 Tab stops.
 */
function ValueGrid({
  label,
  values,
  selected,
  format,
  onToggle,
}: {
  label: string;
  values: number[];
  selected: number[];
  format: (v: number) => string;
  onToggle: (v: number, on: boolean) => void;
}) {
  const [focusIndex, setFocusIndex] = useState(() => Math.max(0, values.indexOf(selected[0])));
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.min(focusIndex, values.length - 1);
  const move = (i: number) => {
    const next = (i + values.length) % values.length;
    setFocusIndex(next);
    buttons.current[next]?.focus();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (step) move(i + step);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(values.length - 1);
    else return;
    e.preventDefault();
  };
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {values.map((v, i) => {
        const on = selected.includes(v);
        return (
          <button
            key={v}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            aria-pressed={on}
            tabIndex={i === current ? 0 : -1}
            onFocus={() => setFocusIndex(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => onToggle(v, on)}
            className={`min-w-10 rounded-lg px-2 py-1.5 font-mono text-sm pointer-coarse:min-h-11 pointer-coarse:min-w-11 ${
              on
                ? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-950'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {format(v)}
          </button>
        );
      })}
    </div>
  );
}

function FieldBuilder({ def, text, onChange }: { def: FieldDef; text: string; onChange: (text: string) => void }) {
  const state = fieldToBuilder(text, def);
  const max = def.name === 'dow' ? 6 : def.max;
  const values = Array.from({ length: max - def.min + 1 }, (_, i) => def.min + i);
  const options = values.map((v) => ({ value: v, label: valueLabel(def, v) }));
  const update = (patch: Partial<BuilderState>) => onChange(builderToField({ ...state, ...patch }, def));
  const setMode = (mode: BuilderMode) => {
    if (mode === 'specific') update({ mode, values: state.values.length ? state.values : [def.min] });
    else if (mode === 'step') update({ mode, step: state.step > 1 ? state.step : 2 });
    else update({ mode });
  };
  const unit = def.label.toLowerCase();

  return (
    <div className="space-y-4">
      <Segmented<BuilderMode>
        label={`${def.label} mode`}
        options={[
          { value: 'every', label: 'Every' },
          { value: 'specific', label: 'Specific' },
          { value: 'range', label: 'Range' },
          { value: 'step', label: 'Step' },
        ]}
        value={state.mode}
        onChange={setMode}
      />
      {state.mode === 'every' && <p className="text-sm text-slate-600 dark:text-slate-400">Runs every {unit} (<code>*</code>).</p>}
      {state.mode === 'custom' && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <code className="break-all">{text}</code> can&rsquo;t be shown in the builder. Edit it in the expression, or pick a mode above to replace it.
        </p>
      )}
      {state.mode === 'specific' && (
        <ValueGrid
          label={`${def.label} values`}
          values={values}
          selected={state.values}
          format={(v) => valueLabel(def, v)}
          onToggle={(v, on) => update({ values: on ? state.values.filter((x) => x !== v) : [...state.values, v].sort((a, b) => a - b) })}
        />
      )}
      {state.mode === 'range' && (
        <div className="flex flex-wrap items-center gap-3">
          <Select<number> label="From" options={options} value={state.from} onChange={(from) => update({ from })} />
          <Select<number> label="Through" options={options} value={state.to} onChange={(to) => update({ to })} />
        </div>
      )}
      {state.mode === 'step' && (
        <div className="flex flex-wrap items-center gap-3">
          <Select<number>
            label="Every"
            options={Array.from({ length: max - def.min }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
            value={state.step}
            onChange={(step) => update({ step })}
          />
          <Select<number> label="Starting at" options={options} value={state.start} onChange={(start) => update({ start })} />
        </div>
      )}
    </div>
  );
}

export default function CronBuilderPage() {
  const [expression, setExpression] = useState('30 9 * * 1-5');
  const [tz, setTz] = useState(localZone);
  const [field, setFieldTab] = useState<FieldName>('minute');
  const zones = useMemo(() => timeZones(), []);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useShareState(
    { expression, tz, field },
    (r) => {
      if (r.expression !== undefined) setExpression(r.expression);
      if (r.tz !== undefined) setTz(r.tz);
      if (r.field !== undefined) setFieldTab(r.field);
    },
    { tz: zones, field: FIELD_ORDER_6 },
  );

  const parsed = useMemo(() => parseCron(expression), [expression]);
  const cron = parsed.ok && 'cron' in parsed ? parsed.cron : null;
  const reboot = parsed.ok && 'reboot' in parsed;
  const errors = parsed.ok ? [] : parsed.errors;
  const description = cron ? describeCron(cron) : reboot ? 'At system startup' : '';
  const runs = useMemo(() => (cron ? nextRuns(cron, new Date(now), tz, 10) : null), [cron, tz, now]);

  const fieldTexts = splitFields(expression);
  const hasSeconds = fieldTexts ? 'second' in fieldTexts : false;
  const order = hasSeconds ? FIELD_ORDER_6 : FIELD_ORDER_5;
  const activeField = order.includes(field) ? field : 'minute';

  const toggleSeconds = (on: boolean) => {
    if (!fieldTexts) return;
    const five = FIELD_ORDER_5.map((n) => fieldTexts[n]).join(' ');
    setExpression(on ? `0 ${five}` : five);
  };

  const status = reboot
    ? '@reboot runs once when the cron daemon starts; it has no schedule.'
    : cron
      ? description
      : errors.length === 1
        ? errors[0].message
        : `${errors.length} fields have errors.`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={cronBuilder} />
      <Headline accent="plain English">Cron, in </Headline>
      <StatusStrip status={status} tone={cron ? 'good' : 'neutral'} />

      <section aria-label="Expression" className={card}>
        <label htmlFor="cron-expression" className={eyebrow}>
          <Icon name="clock" className="h-4 w-4" /> Cron expression
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="cron-expression"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-invalid={errors.length > 0}
            aria-describedby="cron-description"
            className="min-w-0 flex-1 basis-60 rounded-2xl border border-field-edge bg-white px-4 py-3 font-mono text-lg text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-950 dark:text-slate-100"
          />
          <CopyButton text={expression.trim()} />
        </div>
        {fieldTexts && (
          <ol aria-label="Fields" className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {order.map((n) => {
              const err = errors.find((e) => e.field === n);
              return (
                <li key={n} className={`min-w-0 rounded-xl px-2 py-2 text-center ${err ? 'bg-red-50 dark:bg-red-950/50' : 'bg-slate-50 dark:bg-slate-950'}`}>
                  <span className={`block truncate font-mono text-sm ${err ? 'text-red-800 dark:text-red-300' : 'text-slate-900 dark:text-slate-100'}`}>{fieldTexts[n]}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{FIELD_DEFS[n].label}</span>
                </li>
              );
            })}
          </ol>
        )}
        <p id="cron-description" className="mt-4 text-lg font-semibold text-slate-900 dark:text-white" data-testid="cron-description">
          {description || '—'}
        </p>
        {errors.length > 0 && (
          <ul role="alert" className="mt-3 space-y-1 text-sm text-red-800 dark:text-red-300">
            {errors.map((e) => (
              <li key={e.field + e.message} className="flex gap-2 break-words">
                <Icon name="warn" className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="min-w-0">
                  {e.field !== 'expression' && <strong>{FIELD_DEFS[e.field].label}: </strong>}
                  {e.message}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Checkbox label="Include seconds (6 fields)" checked={hasSeconds} onChange={toggleSeconds} />
          <Select<string>
            label="Presets"
            placeholder="Choose a preset…"
            options={[...PRESETS.map((p) => ({ value: p.expression, label: p.label })), { value: '@daily', label: '@daily' }, { value: '@weekly', label: '@weekly' }, { value: '@monthly', label: '@monthly' }]}
            onChange={setExpression}
          />
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-label="Builder" className={card}>
          <h2 className={eyebrow}>
            <Icon name="layers" className="h-4 w-4" /> Builder
          </h2>
          {fieldTexts ? (
            <div className="space-y-5">
              <Segmented<FieldName>
                label="Field"
                options={order.map((n) => ({ value: n, label: FIELD_DEFS[n].label }))}
                value={activeField}
                onChange={setFieldTab}
              />
              <FieldBuilder
                key={activeField}
                def={FIELD_DEFS[activeField]}
                text={fieldTexts[activeField] ?? '*'}
                onChange={(t) => setExpression(setField(expression, activeField, t))}
              />
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">Enter 5 or 6 fields (or a macro like @daily) to use the builder.</p>
          )}
        </section>

        <section aria-label="Next runs" className={card}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="play" className="h-4 w-4" /> Next 10 runs
            </h2>
            <Select<string> label="Time zone" options={zones.map((z) => ({ value: z, label: z }))} value={tz} onChange={setTz} />
          </div>
          {runs ? (
            <>
              {runs.runs.length > 0 && (
                <ol className="space-y-1 font-mono text-sm text-slate-800 dark:text-slate-200">
                  {runs.runs.map((r, i) => (
                    <li key={r.getTime()} className="flex gap-3 rounded-lg px-2 py-1 odd:bg-slate-50 dark:odd:bg-slate-950">
                      <span className="w-6 shrink-0 text-right text-slate-500 dark:text-slate-400">{i + 1}</span>
                      <span className="min-w-0 break-words">{formatRun(r, tz, cron?.hasSeconds ?? false)}</span>
                    </li>
                  ))}
                </ol>
              )}
              {!runs.complete && (
                <p className="mt-3 text-sm text-amber-800 dark:text-amber-300">
                  {runs.runs.length ? 'Only these runs' : 'No runs'} in the next 8 years. Check the day and month fields (for example, 30 February never happens).
                </p>
              )}
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                Times are wall-clock times in {tz}. A time skipped when clocks go forward doesn&rsquo;t run; a time repeated when clocks go back runs once.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">{reboot ? '@reboot has no run times.' : 'Fix the expression to see run times.'}</p>
          )}
        </section>
      </div>

      <section aria-label="How cron reads days" className={card}>
        <h2 className={eyebrow}>
          <Icon name="info" className="h-4 w-4" /> Day-of-month and day-of-week
        </h2>
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <p>
            If both day fields are restricted (neither is <code>*</code> or <code>?</code>), classic cron runs on days that match <strong>either</strong> field.{' '}
            <code>0 0 13 * 5</code> runs on every 13th <em>and</em> every Friday, not only on Friday the 13th.
          </p>
          <p>
            Syntax: <code>*</code> any, <code>5</code> value, <code>1-5</code> range, <code>*/15</code> step, <code>1,15</code> list, <code>JAN</code>–<code>DEC</code>,{' '}
            <code>SUN</code>–<code>SAT</code> (0 and 7 are Sunday). Day-of-month also accepts <code>L</code> (last day), <code>L-2</code>, <code>LW</code> and{' '}
            <code>15W</code> (nearest weekday); day-of-week accepts <code>5L</code> (last Friday) and <code>1#2</code> (second Monday). A leading 6th field is
            seconds; a 7th (year) field is not supported.
          </p>
        </div>
      </section>
    </div>
  );
}
