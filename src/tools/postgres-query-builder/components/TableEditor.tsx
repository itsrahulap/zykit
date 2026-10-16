// Form editor for one table: name, columns with types and constraints, CHECKs and indexes.

import { DEFAULT_EXPRESSIONS, PG_TYPES, isForeignKey, newColumn, newId, type Column, type ColumnDefault, type Schema, type Table } from '../features/model';
import { Check, Choice, IconButton, SmallButton, TextField } from './fields';

interface Props {
  schema: Schema;
  table: Table;
  onChange: (fn: (t: Table) => Table, mergeKey?: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

type DefaultKind = 'none' | 'literal' | (typeof DEFAULT_EXPRESSIONS)[number];

export function TableEditor({ schema, table, onChange, onDuplicate, onDelete }: Props) {
  const setCol = (id: string, patch: Partial<Column>, mergeKey?: string) =>
    onChange((t) => ({ ...t, columns: t.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)) }), mergeKey);
  const moveCol = (i: number, d: number) =>
    onChange((t) => {
      const cols = [...t.columns];
      [cols[i], cols[i + d]] = [cols[i + d], cols[i]];
      return { ...t, columns: cols };
    });
  const removeCol = (c: Column) => {
    if (isForeignKey(schema, table.id, c.id) || schema.relationships.some((r) => r.toTableId === table.id && r.toColumnId === c.id)) {
      if (!window.confirm(`Column "${c.name}" is part of a relationship. Delete it and the relationship?`)) return;
    }
    onChange((t) => ({ ...t, columns: t.columns.filter((x) => x.id !== c.id) }));
  };
  const addCol = () => onChange((t) => ({ ...t, columns: [...t.columns, newColumn(nextName(t), 'TEXT')] }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <TextField
          label="Table name"
          className="min-w-48 flex-1"
          value={table.name}
          maxLength={200}
          onChange={(e) => {
            const name = e.target.value;
            onChange((t) => ({ ...t, name }), `${table.id}:name`);
          }}
        />
        <SmallButton onClick={onDuplicate}>Duplicate</SmallButton>
        <SmallButton tone="danger" onClick={onDelete}>
          Delete table
        </SmallButton>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Columns</h4>
        {!table.columns.length && <p className="text-sm text-slate-500">This table has no columns yet.</p>}
        {table.columns.map((c, i) => (
          <fieldset key={c.id} className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <legend className="sr-only">Column {c.name || i + 1}</legend>
            <div className="flex flex-wrap items-end gap-2">
              <TextField
                label="Column name"
                className="min-w-36 flex-1"
                value={c.name}
                maxLength={200}
                onChange={(e) => setCol(c.id, { name: e.target.value }, `${c.id}:name`)}
              />
              <Choice
                label="Type"
                hideLabel={false}
                value={c.type}
                options={PG_TYPES}
                onChange={(type) => setCol(c.id, { type, ...(type === 'VARCHAR' && !c.length ? { length: 255 } : {}), ...(!['INTEGER', 'BIGINT'].includes(type) ? { identity: false } : {}) })}
              />
              {c.type === 'VARCHAR' && <NumField label="Length" value={c.length} onChange={(length) => setCol(c.id, { length })} />}
              {c.type === 'NUMERIC' && (
                <>
                  <NumField label="Precision" value={c.precision} onChange={(precision) => setCol(c.id, { precision })} />
                  <NumField label="Scale" value={c.scale} onChange={(scale) => setCol(c.id, { scale })} />
                </>
              )}
              <div className="flex">
                <IconButton label={`Move ${c.name} up`} icon="chevron-left" disabled={i === 0} onClick={() => moveCol(i, -1)} />
                <IconButton label={`Move ${c.name} down`} icon="chevron-right" disabled={i === table.columns.length - 1} onClick={() => moveCol(i, 1)} />
                <IconButton label={`Delete column ${c.name}`} icon="x" onClick={() => removeCol(c)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Check label="Primary key" checked={c.primaryKey} onChange={(primaryKey) => setCol(c.id, { primaryKey })} />
              <Check label="Not null" checked={c.notNull || c.primaryKey} disabled={c.primaryKey} onChange={(notNull) => setCol(c.id, { notNull })} />
              <Check label="Unique" checked={c.unique} onChange={(unique) => setCol(c.id, { unique })} />
              {(c.type === 'INTEGER' || c.type === 'BIGINT') && (
                <Check label="Identity (auto-number)" checked={c.identity} onChange={(identity) => setCol(c.id, { identity })} />
              )}
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <Choice<DefaultKind>
                label="Default"
                hideLabel={false}
                value={c.default.kind === 'expression' ? c.default.value : c.default.kind}
                options={[{ value: 'none', label: 'No default' }, { value: 'literal', label: 'A value…' }, ...DEFAULT_EXPRESSIONS.map((e) => ({ value: e, label: e }))]}
                onChange={(k) => setCol(c.id, { default: toDefault(k) })}
              />
              {c.default.kind === 'literal' && (
                <TextField
                  label="Default value"
                  className="min-w-32 flex-1"
                  value={c.default.value}
                  maxLength={1000}
                  placeholder={c.type === 'BOOLEAN' ? 'true or false' : 'value'}
                  onChange={(e) => setCol(c.id, { default: { kind: 'literal', value: e.target.value } }, `${c.id}:default`)}
                />
              )}
              <TextField
                label="CHECK (optional)"
                className="min-w-40 flex-1 font-mono"
                value={c.check ?? ''}
                maxLength={1000}
                placeholder={`${c.name || 'column'} > 0`}
                onChange={(e) => setCol(c.id, { check: e.target.value || undefined }, `${c.id}:check`)}
              />
            </div>
          </fieldset>
        ))}
        <SmallButton onClick={addCol}>+ Add column</SmallButton>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Table CHECK constraints</h4>
        <p className="text-xs text-slate-500">Written into the SQL as you type them, e.g. <code>start_date &lt;= end_date</code>.</p>
        {table.checks.map((chk, i) => (
          <div key={i} className="flex items-end gap-2">
            <TextField
              label={`Check ${i + 1}`}
              hideLabel
              className="flex-1 font-mono"
              value={chk}
              maxLength={1000}
              onChange={(e) => {
                const v = e.target.value;
                onChange((t) => ({ ...t, checks: t.checks.map((x, j) => (j === i ? v : x)) }), `${table.id}:check${i}`);
              }}
            />
            <IconButton label={`Remove check ${i + 1}`} icon="x" onClick={() => onChange((t) => ({ ...t, checks: t.checks.filter((_, j) => j !== i) }))} />
          </div>
        ))}
        <SmallButton onClick={() => onChange((t) => ({ ...t, checks: [...t.checks, ''] }))}>+ Add CHECK</SmallButton>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Indexes</h4>
        {table.indexes.map((ix) => (
          <div key={ix.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-200 p-2 dark:border-slate-800">
            {table.columns.map((c) => (
              <Check
                key={c.id}
                label={c.name || '(unnamed)'}
                checked={ix.columnIds.includes(c.id)}
                onChange={(on) =>
                  onChange((t) => ({
                    ...t,
                    // Keep table column order so the generated index is predictable.
                    indexes: t.indexes.map((x) => (x.id === ix.id ? { ...x, columnIds: t.columns.map((tc) => tc.id).filter((cid) => (cid === c.id ? on : x.columnIds.includes(cid))) } : x)),
                  }))
                }
              />
            ))}
            <Check label="Unique index" checked={ix.unique} onChange={(unique) => onChange((t) => ({ ...t, indexes: t.indexes.map((x) => (x.id === ix.id ? { ...x, unique } : x)) }))} />
            <IconButton label="Remove index" icon="x" onClick={() => onChange((t) => ({ ...t, indexes: t.indexes.filter((x) => x.id !== ix.id) }))} />
          </div>
        ))}
        <SmallButton disabled={!table.columns.length} onClick={() => onChange((t) => ({ ...t, indexes: [...t.indexes, { id: newId('x'), columnIds: [t.columns[0].id], unique: false }] }))}>
          + Add index
        </SmallButton>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number | undefined) => void }) {
  return (
    <TextField
      label={label}
      className="w-24"
      inputMode="numeric"
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value.trim();
        onChange(v === '' || !/^\d{1,9}$/.test(v) ? undefined : Number(v));
      }}
    />
  );
}

const toDefault = (k: DefaultKind): ColumnDefault => (k === 'none' ? { kind: 'none' } : k === 'literal' ? { kind: 'literal', value: '' } : { kind: 'expression', value: k });

function nextName(t: Table) {
  for (let i = t.columns.length + 1; ; i++) if (!t.columns.some((c) => c.name === `column_${i}`)) return `column_${i}`;
}
