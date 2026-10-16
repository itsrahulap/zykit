// Visual SELECT builder: tables and joins, selected columns and aggregates, WHERE, GROUP BY,
// HAVING, ORDER BY, LIMIT/OFFSET. Join conditions are only suggested from defined relationships,
// and the user confirms each suggestion.

import { useState } from 'react';
import { AGGREGATES, JOIN_TYPES, findColumn, findTable, newId, type Aggregate, type ConditionGroup, type JoinType, type Query, type QuerySource, type Schema, type SelectItem } from '../features/model';
import { columnOptions, refKey, sourceName, suggestJoinConditions } from '../features/query';
import { ConditionBuilder } from './ConditionBuilder';
import { Check, Choice, IconButton, Section, SmallButton, TextField } from './fields';

const JOIN_LABELS: Record<JoinType, string> = { INNER: 'INNER JOIN', LEFT: 'LEFT JOIN', RIGHT: 'RIGHT JOIN', FULL: 'FULL OUTER JOIN' };

interface Props {
  schema: Schema;
  query: Query;
  onChange: (fn: (q: Query) => Query, mergeKey?: string) => void;
}

export function QueryBuilder({ schema, query, onChange }: Props) {
  const [adding, setAdding] = useState<{ tableId: string; suggestions: QuerySource['on'] } | null>(null);
  const columns = columnOptions(schema, query.sources);
  const refOf = (key: string) => columns.find((c) => c.value === key)?.ref;
  const setSource = (id: string, patch: Partial<QuerySource>, mergeKey?: string) => onChange((q) => ({ ...q, sources: q.sources.map((s) => (s.id === id ? { ...s, ...patch } : s)) }), mergeKey);
  const setItem = (id: string, fn: (i: SelectItem) => SelectItem, mergeKey?: string) => onChange((q) => ({ ...q, select: q.select.map((i) => (i.id === id ? fn(i) : i)) }), mergeKey);

  if (!schema.tables.length) {
    return <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">Add tables in the Schema Designer (or load a sample) to start building a query.</p>;
  }

  const addSource = (tableId: string, on: QuerySource['on']) => {
    const t = findTable(schema, tableId)!;
    const taken = new Set(query.sources.map((s) => sourceName(schema, s)));
    // A second copy of the same table (a self-join) needs its own alias.
    let alias = '';
    if (taken.has(t.name)) for (let i = 2; !alias; i++) if (!taken.has(`${t.name}_${i}`)) alias = `${t.name}_${i}`;
    const src: QuerySource = { id: newId('s'), tableId, alias, join: 'INNER', on };
    onChange((q) => ({ ...q, sources: [...q.sources, src], select: q.sources.length ? q.select : [{ id: newId('i'), kind: 'all', sourceId: null }] }));
    setAdding(null);
  };
  const pick = (tableId: string) => {
    if (!query.sources.length) return addSource(tableId, []);
    setAdding({ tableId, suggestions: suggestJoinConditions(schema, query.sources, findTable(schema, tableId)!) });
  };
  const describeOn = (src: QuerySource | null, tableId: string, on: QuerySource['on'][number]) => {
    const left = query.sources.find((s) => s.id === on.left.sourceId)!;
    const lc = findColumn(findTable(schema, left.tableId), on.left.columnId);
    const t = findTable(schema, tableId);
    return `${sourceName(schema, left)}.${lc?.name} = ${src ? sourceName(schema, src) : t?.name}.${findColumn(t, on.rightColumnId)?.name}`;
  };

  return (
    <div className="space-y-4">
      <Section title="1. Tables and joins">
        {query.sources.map((s, i) => {
          const t = findTable(schema, s.tableId);
          const earlier = columnOptions(schema, query.sources.slice(0, i), true);
          const own = (t?.columns ?? []).map((c) => ({ value: c.id, label: `${sourceName(schema, s)}.${c.name}` }));
          return (
            <div key={s.id} className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex flex-wrap items-end gap-2">
                {i === 0 ? (
                  <span className="pb-2 font-mono text-sm font-semibold">FROM</span>
                ) : (
                  <Choice label="Join type" value={s.join} options={JOIN_TYPES.map((j) => ({ value: j, label: JOIN_LABELS[j] }))} onChange={(join) => setSource(s.id, { join })} />
                )}
                <span className="pb-2 font-mono text-sm">{t?.name}</span>
                <TextField label={`Alias for ${t?.name}`} className="w-32" placeholder="alias" value={s.alias} maxLength={63} onChange={(e) => setSource(s.id, { alias: e.target.value }, `${s.id}:alias`)} />
                <span className="ml-auto">
                  <IconButton
                    label={`Remove ${t?.name} from the query`}
                    icon="x"
                    onClick={() => onChange((q) => ({ ...q, sources: q.sources.filter((x) => x.id !== s.id).map((x, j) => (j === 0 ? { ...x, on: [] } : x)) }))}
                  />
                </span>
              </div>
              {i > 0 && (
                <div className="space-y-2 pl-2">
                  {!s.on.length && <p className="text-sm text-amber-700 dark:text-amber-400">Add a join condition (ON).</p>}
                  {s.on.map((on) => (
                    <div key={on.id} className="flex flex-wrap items-end gap-2">
                      <span className="pb-2 font-mono text-xs">ON</span>
                      <Choice label="Earlier table column" className="min-w-36 flex-1" value={refKey(on.left)} options={earlier.map(({ value, label }) => ({ value, label }))} onChange={(k) => setSource(s.id, { on: s.on.map((o) => (o.id === on.id ? { ...o, left: refOf(k)! } : o)) })} />
                      <span className="pb-2 font-mono">=</span>
                      <Choice label={`${t?.name} column`} className="min-w-36 flex-1" value={on.rightColumnId} options={own} onChange={(rightColumnId) => setSource(s.id, { on: s.on.map((o) => (o.id === on.id ? { ...o, rightColumnId } : o)) })} />
                      <IconButton label="Remove join condition" icon="x" onClick={() => setSource(s.id, { on: s.on.filter((o) => o.id !== on.id) })} />
                    </div>
                  ))}
                  <SmallButton
                    disabled={!earlier.length || !own.length}
                    onClick={() => setSource(s.id, { on: [...s.on, { id: newId('j'), left: earlier[0].ref, rightColumnId: own[0].value }] })}
                  >
                    + ON condition
                  </SmallButton>
                </div>
              )}
            </div>
          );
        })}

        {adding ? (
          <div className="space-y-2 rounded-xl border border-emerald-600/50 bg-emerald-50/50 p-3 dark:bg-emerald-950/20" role="region" aria-label="Join suggestion">
            <p className="text-sm font-medium">Join {findTable(schema, adding.tableId)?.name}</p>
            {adding.suggestions.length ? (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-400">From the relationships in your schema:</p>
                <ul className="space-y-1">
                  {adding.suggestions.map((on) => (
                    <li key={on.id} className="flex flex-wrap items-center gap-2">
                      <code className="font-mono text-sm">{describeOn(null, adding.tableId, on)}</code>
                      <SmallButton onClick={() => addSource(adding.tableId, [on])}>Use this join</SmallButton>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">No relationship links this table to the query yet. You can add it and choose the ON columns yourself.</p>
            )}
            <div className="flex gap-2">
              <SmallButton onClick={() => addSource(adding.tableId, [])}>Add without a condition</SmallButton>
              <SmallButton onClick={() => setAdding(null)}>Cancel</SmallButton>
            </div>
          </div>
        ) : (
          <Choice
            label={query.sources.length ? 'Join another table' : 'Query table'}
            hideLabel={false}
            className="max-w-xs"
            value=""
            options={schema.tables.map((t) => ({ value: t.id, label: t.name || '(unnamed)' }))}
            onChange={pick}
          />
        )}
      </Section>

      {query.sources.length > 0 && (
        <>
          <Section title="2. Columns" action={<Check label="DISTINCT (remove duplicate rows)" checked={query.distinct} onChange={(distinct) => onChange((q) => ({ ...q, distinct }))} />}>
            {!query.select.length && <p className="text-sm text-amber-700 dark:text-amber-400">Choose at least one column.</p>}
            {query.select.map((item) => (
              <div key={item.id} className="flex flex-wrap items-end gap-2">
                {item.kind === 'all' ? (
                  <Choice
                    label="All columns of"
                    className="min-w-36 flex-1"
                    value={item.sourceId ?? '*'}
                    options={[{ value: '*', label: '* (every table)' }, ...query.sources.map((s) => ({ value: s.id, label: `${sourceName(schema, s)}.*` }))]}
                    onChange={(v) => setItem(item.id, () => ({ ...item, sourceId: v === '*' ? null : v }))}
                  />
                ) : (
                  <>
                    {item.kind === 'aggregate' && (
                      <Choice<Aggregate> label="Aggregate" value={item.fn} options={AGGREGATES} onChange={(fn) => setItem(item.id, () => ({ ...item, fn, ref: fn === 'COUNT' ? item.ref : (item.ref ?? columns[0]?.ref ?? null) }))} />
                    )}
                    <Choice
                      label="Column"
                      className="min-w-36 flex-1"
                      value={item.ref ? refKey(item.ref) : '*'}
                      options={item.kind === 'aggregate' && item.fn === 'COUNT' ? [{ value: '*', label: '* (all rows)' }, ...columns] : columns}
                      onChange={(k) => setItem(item.id, () => (item.kind === 'aggregate' ? { ...item, ref: k === '*' ? null : refOf(k)! } : { ...item, ref: refOf(k)! }))}
                    />
                    <TextField label="Alias (AS)" hideLabel className="w-36" placeholder="AS alias" value={item.alias} maxLength={63} onChange={(e) => setItem(item.id, () => ({ ...item, alias: e.target.value }), `${item.id}:alias`)} />
                  </>
                )}
                <IconButton label="Remove column" icon="x" onClick={() => onChange((q) => ({ ...q, select: q.select.filter((x) => x.id !== item.id) }))} />
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <SmallButton onClick={() => onChange((q) => ({ ...q, select: [...q.select, { id: newId('i'), kind: 'column', ref: columns[0].ref, alias: '' }] }))} disabled={!columns.length}>
                + Column
              </SmallButton>
              <SmallButton onClick={() => onChange((q) => ({ ...q, select: [...q.select, { id: newId('i'), kind: 'aggregate', fn: 'COUNT', ref: null, alias: '' }] }))}>+ Aggregate</SmallButton>
              <SmallButton onClick={() => onChange((q) => ({ ...q, select: [...q.select, { id: newId('i'), kind: 'all', sourceId: null }] }))}>+ All columns (*)</SmallButton>
            </div>
          </Section>

          <Section title="3. Filter rows (WHERE)">
            <ConditionBuilder label="WHERE conditions" group={query.where} columns={columns} onChange={(fn, k) => onChange((q) => ({ ...q, where: fn(q.where) }), k)} />
          </Section>

          <Section title="4. Group (GROUP BY) and filter groups (HAVING)">
            {query.groupBy.map((r, i) => (
              <div key={`${refKey(r)}-${i}`} className="flex items-end gap-2">
                <Choice label="Group by column" className="min-w-36 flex-1" value={refKey(r)} options={columns} onChange={(k) => onChange((q) => ({ ...q, groupBy: q.groupBy.map((x, j) => (j === i ? refOf(k)! : x)) }))} />
                <IconButton label="Remove grouping column" icon="x" onClick={() => onChange((q) => ({ ...q, groupBy: q.groupBy.filter((_, j) => j !== i) }))} />
              </div>
            ))}
            <SmallButton
              disabled={!columns.length}
              onClick={() => onChange((q) => ({ ...q, groupBy: [...q.groupBy, (columns.find((c) => !q.groupBy.some((g) => refKey(g) === c.value)) ?? columns[0]).ref] }))}
            >
              + GROUP BY column
            </SmallButton>
            {(query.groupBy.length > 0 || query.having.children.length > 0) && (
              <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                <h4 className="text-sm font-semibold">HAVING</h4>
                <ConditionBuilder label="HAVING conditions" aggregates group={query.having} columns={columns} onChange={(fn, k) => onChange((q) => ({ ...q, having: fn(q.having) as ConditionGroup }), k)} />
              </div>
            )}
          </Section>

          <Section title="5. Sort and page (ORDER BY, LIMIT, OFFSET)">
            {query.orderBy.map((o) => {
              const aliased = query.select.filter((i) => i.kind !== 'all' && i.alias.trim());
              const options = [...columns, ...aliased.map((i) => ({ value: `select:${i.id}`, label: `${(i as { alias: string }).alias} (alias)` }))];
              return (
                <div key={o.id} className="flex flex-wrap items-end gap-2">
                  <Choice
                    label="Sort by"
                    className="min-w-36 flex-1"
                    value={o.target.kind === 'select' ? `select:${o.target.selectId}` : refKey(o.target.ref)}
                    options={options}
                    onChange={(k) =>
                      onChange((q) => ({
                        ...q,
                        orderBy: q.orderBy.map((x) => (x.id === o.id ? { ...x, target: k.startsWith('select:') ? { kind: 'select', selectId: k.slice(7) } : { kind: 'column', ref: refOf(k)! } } : x)),
                      }))
                    }
                  />
                  <Choice
                    label="Direction"
                    value={o.dir}
                    options={[
                      { value: 'ASC', label: 'Ascending' },
                      { value: 'DESC', label: 'Descending' },
                    ]}
                    onChange={(dir) => onChange((q) => ({ ...q, orderBy: q.orderBy.map((x) => (x.id === o.id ? { ...x, dir } : x)) }))}
                  />
                  <IconButton label="Remove sort" icon="x" onClick={() => onChange((q) => ({ ...q, orderBy: q.orderBy.filter((x) => x.id !== o.id) }))} />
                </div>
              );
            })}
            <SmallButton disabled={!columns.length} onClick={() => onChange((q) => ({ ...q, orderBy: [...q.orderBy, { id: newId('o'), target: { kind: 'column', ref: columns[0].ref }, dir: 'ASC' }] }))}>
              + ORDER BY
            </SmallButton>
            <div className="flex flex-wrap gap-3">
              <TextField label="LIMIT" className="w-32" inputMode="numeric" placeholder="no limit" value={query.limit} maxLength={20} onChange={(e) => onChange((q) => ({ ...q, limit: e.target.value }), 'limit')} />
              <TextField label="OFFSET" className="w-32" inputMode="numeric" placeholder="0" value={query.offset} maxLength={20} onChange={(e) => onChange((q) => ({ ...q, offset: e.target.value }), 'offset')} />
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
