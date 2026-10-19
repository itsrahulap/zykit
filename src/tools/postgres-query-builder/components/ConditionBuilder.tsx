// Nested AND/OR condition groups for WHERE and HAVING.

import { AGGREGATES, OPERATORS, emptyGroup, newId, type Aggregate, type CondTarget, type Condition, type ConditionGroup, type Operator } from '../features/model';
import { refKey, type ColumnOption } from '../features/query';
import { Choice, IconButton, SmallButton, TextField, inputClass } from './fields';

const MAX_DEPTH = 8;

interface Props {
  group: ConditionGroup;
  columns: ColumnOption[];
  /** HAVING: conditions may test an aggregate such as COUNT(*). */
  aggregates?: boolean;
  onChange: (fn: (g: ConditionGroup) => ConditionGroup, mergeKey?: string) => void;
  label: string;
  depth?: number;
  onRemove?: () => void;
}

export function ConditionBuilder({ group, columns, aggregates, onChange, label, depth = 0, onRemove }: Props) {
  const setChild = (id: string, fn: (c: Condition | ConditionGroup) => Condition | ConditionGroup, mergeKey?: string) =>
    onChange((g) => ({ ...g, children: g.children.map((c) => (c.id === id ? fn(c) : c)) }), mergeKey);
  const remove = (id: string) => onChange((g) => ({ ...g, children: g.children.filter((c) => c.id !== id) }));
  const first = columns[0]?.ref;
  const addCondition = () =>
    onChange((g) => ({
      ...g,
      children: [...g.children, { id: newId('w'), kind: 'cond', target: aggregates ? { kind: 'aggregate', fn: 'COUNT', ref: null } : { kind: 'column', ref: first! }, op: aggregates ? '>' : '=', values: [''] }],
    }));

  return (
    <div className={`space-y-2 ${depth ? 'rounded-xl border-l-4 border-emerald-600/40 bg-slate-50 p-3 dark:bg-slate-900/60' : ''}`} role="group" aria-label={label}>
      <div className="flex flex-wrap items-center gap-2">
        {group.children.length > 1 || depth ? (
          <div role="group" aria-label="Combine conditions with" className="inline-flex rounded-lg bg-slate-100 p-0.5 text-sm dark:bg-slate-800">
            {(['AND', 'OR'] as const).map((op) => (
              <button
                key={op}
                type="button"
                aria-pressed={group.op === op}
                onClick={() => onChange((g) => ({ ...g, op }))}
                className={`rounded-md px-2.5 py-1 font-mono font-semibold pointer-coarse:min-h-11 ${group.op === op ? 'bg-white shadow-sm dark:bg-slate-950' : 'text-slate-500'}`}
              >
                {op}
              </button>
            ))}
          </div>
        ) : null}
        <span className="text-xs text-slate-500">{group.op === 'AND' ? 'All of these must be true' : 'At least one of these must be true'}</span>
        {onRemove && (
          <span className="ml-auto">
            <IconButton label="Remove this group" icon="x" onClick={onRemove} />
          </span>
        )}
      </div>
      {group.children.map((c) =>
        c.kind === 'group' ? (
          <ConditionBuilder
            key={c.id}
            group={c}
            columns={columns}
            aggregates={aggregates}
            label={`${label}, nested group`}
            depth={depth + 1}
            onChange={(fn, k) => setChild(c.id, (x) => fn(x as ConditionGroup), k)}
            onRemove={() => remove(c.id)}
          />
        ) : (
          <ConditionRow key={c.id} cond={c} columns={columns} aggregates={aggregates} onChange={(fn, k) => setChild(c.id, (x) => fn(x as Condition), k)} onRemove={() => remove(c.id)} />
        ),
      )}
      <div className="flex flex-wrap gap-2">
        <SmallButton onClick={addCondition} disabled={!columns.length && !aggregates}>
          + Condition
        </SmallButton>
        {depth < MAX_DEPTH && (
          <SmallButton onClick={() => onChange((g) => ({ ...g, children: [...g.children, emptyGroup(g.op === 'AND' ? 'OR' : 'AND')] }))} disabled={!columns.length && !aggregates}>
            + Group ({group.op === 'AND' ? 'OR' : 'AND'})
          </SmallButton>
        )}
      </div>
    </div>
  );
}

const COUNT_ALL = '*';

function ConditionRow({
  cond,
  columns,
  aggregates,
  onChange,
  onRemove,
}: {
  cond: Condition;
  columns: ColumnOption[];
  aggregates?: boolean;
  onChange: (fn: (c: Condition) => Condition, mergeKey?: string) => void;
  onRemove: () => void;
}) {
  const t = cond.target;
  const setTarget = (target: CondTarget) => onChange((c) => ({ ...c, target }));
  const setOp = (op: Operator) => onChange((c) => ({ ...c, op, values: op === 'BETWEEN' ? [c.values[0] ?? '', c.values[1] ?? ''] : op.startsWith('IS') ? [] : c.values.length ? c.values : [''] }));
  const setValue = (i: number, v: string) => onChange((c) => ({ ...c, values: c.values.map((x, j) => (j === i ? v : x)) }), `${cond.id}:v${i}`);
  const colChoice = columns.map(({ value, label }) => ({ value, label }));
  const refOf = (key: string) => columns.find((c) => c.value === key)?.ref ?? null;

  return (
    <div className="flex flex-wrap items-end gap-2">
      {aggregates && (
        <Choice<'column' | Aggregate>
          label="Function"
          value={t.kind === 'aggregate' ? t.fn : 'column'}
          options={[{ value: 'column', label: '(column)' }, ...AGGREGATES.map((a) => ({ value: a, label: a }))]}
          onChange={(fn) => {
            const ref = t.ref ?? columns[0]?.ref ?? null;
            if (fn === 'column') {
              if (ref) setTarget({ kind: 'column', ref });
            } else setTarget({ kind: 'aggregate', fn, ref: fn === 'COUNT' ? t.ref : ref });
          }}
        />
      )}
      <Choice
        label="Column"
        className="min-w-36 flex-1"
        value={t.ref ? refKey(t.ref) : t.kind === 'aggregate' ? COUNT_ALL : ''}
        options={t.kind === 'aggregate' && t.fn === 'COUNT' ? [{ value: COUNT_ALL, label: '* (all rows)' }, ...colChoice] : colChoice}
        onChange={(key) => {
          const ref = key === COUNT_ALL ? null : refOf(key);
          if (t.kind === 'aggregate') setTarget({ ...t, ref });
          else if (ref) setTarget({ kind: 'column', ref });
        }}
      />
      <Choice label="Operator" value={cond.op} options={OPERATORS} onChange={setOp} />
      {cond.op === 'IN' || cond.op === 'NOT IN' ? (
        <div className="min-w-40 flex-1">
          <label className="sr-only" htmlFor={`${cond.id}-in`}>
            Values, one per line
          </label>
          <textarea
            id={`${cond.id}-in`}
            rows={2}
            className={`${inputClass} font-mono`}
            placeholder="One value per line"
            value={cond.values.join('\n')}
            onChange={(e) => {
              const values = e.target.value.split('\n').slice(0, 500);
              onChange((c) => ({ ...c, values }), `${cond.id}:in`);
            }}
          />
        </div>
      ) : (
        cond.values.map((v, i) => (
          <TextField key={i} label={cond.op === 'BETWEEN' ? (i ? 'To' : 'From') : 'Value'} hideLabel className="min-w-28 flex-1 font-mono" value={v} maxLength={1000} placeholder={cond.op === 'BETWEEN' ? (i ? 'to' : 'from') : cond.op.includes('LIKE') ? '%text%' : 'value'} onChange={(e) => setValue(i, e.target.value)} />
        ))
      )}
      <IconButton label="Remove condition" icon="x" onClick={onRemove} />
    </div>
  );
}
