// Visual query → PostgreSQL SELECT. Validates the whole configuration and returns errors instead
// of SQL when it's incomplete or would be rejected by PostgreSQL. Output is deterministic.

import {
  findColumn,
  findTable,
  newId,
  type Aggregate,
  type ColRef,
  type CondTarget,
  type Condition,
  type ConditionGroup,
  type PgType,
  type Query,
  type QuerySource,
  type Schema,
  type Table,
} from './model';
import { identifierError, keyType, literal, quoteIdent } from './sql';

export interface QueryResult {
  sql: string;
  errors: string[];
}

const NUMERIC_TYPES: PgType[] = ['INTEGER', 'BIGINT', 'SERIAL', 'BIGSERIAL', 'NUMERIC'];
const TEXT_TYPES: PgType[] = ['VARCHAR', 'TEXT'];
const JOIN_SQL = { INNER: 'INNER JOIN', LEFT: 'LEFT JOIN', RIGHT: 'RIGHT JOIN', FULL: 'FULL OUTER JOIN' } as const;

/** Name a source is referred to by in SQL: its alias, or its table name. */
export const sourceName = (schema: Schema, src: QuerySource) => src.alias.trim() || findTable(schema, src.tableId)?.name || '';

/** Joinable without an explicit cast: same base type, or both numeric. */
const comparable = (a: PgType, b: PgType) => keyType(a) === keyType(b) || (NUMERIC_TYPES.includes(a) && NUMERIC_TYPES.includes(b));

/** Join conditions implied by the schema's relationships between `table` and the existing sources. Never guessed from names. */
export function suggestJoinConditions(schema: Schema, sources: QuerySource[], table: Table): QuerySource['on'] {
  const out: QuerySource['on'] = [];
  for (const src of sources) {
    for (const r of schema.relationships) {
      if (r.fromTableId === table.id && r.toTableId === src.tableId) out.push({ id: newId('j'), left: { sourceId: src.id, columnId: r.toColumnId }, rightColumnId: r.fromColumnId });
      else if (r.toTableId === table.id && r.fromTableId === src.tableId) out.push({ id: newId('j'), left: { sourceId: src.id, columnId: r.fromColumnId }, rightColumnId: r.toColumnId });
    }
  }
  return out;
}

export interface ColumnOption {
  value: string;
  label: string;
  ref: ColRef;
}
export const refKey = (r: ColRef) => `${r.sourceId}|${r.columnId}`;

/** Every column of every table in the query, labelled the way SQL will refer to it. */
export function columnOptions(schema: Schema, sources: QuerySource[], qualify = sources.length > 1): ColumnOption[] {
  return sources.flatMap((s) => {
    const t = findTable(schema, s.tableId);
    const name = sourceName(schema, s);
    return (t?.columns ?? []).map((c) => {
      const ref = { sourceId: s.id, columnId: c.id };
      return { value: refKey(ref), label: qualify ? `${name}.${c.name}` : c.name, ref };
    });
  });
}

export function generateQuery(schema: Schema, q: Query): QueryResult {
  const errors: string[] = [];
  if (!q.sources.length) return { sql: '', errors: ['Choose a table to query.'] };

  // Sources, aliases and joins.
  const names = new Set<string>();
  for (const src of q.sources) {
    const t = findTable(schema, src.tableId);
    if (!t) {
      errors.push('A table in the query no longer exists.');
      continue;
    }
    if (src.alias.trim()) {
      const err = identifierError(src.alias.trim(), `The alias for ${t.name}`);
      if (err) errors.push(err);
    }
    const name = sourceName(schema, src);
    if (names.has(name)) errors.push(`"${name}" is used twice in the query; give one of them a different alias.`);
    names.add(name);
  }
  if (errors.length) return { sql: '', errors };

  const multi = q.sources.length > 1;
  const ctx = (ref: ColRef) => {
    const idx = q.sources.findIndex((s) => s.id === ref.sourceId);
    const src = q.sources[idx];
    const table = src && findTable(schema, src.tableId);
    const column = findColumn(table, ref.columnId);
    return src && table && column ? { idx, src, table, column, sql: multi ? `${quoteIdent(sourceName(schema, src))}.${quoteIdent(column.name)}` : quoteIdent(column.name) } : null;
  };

  const fromLines: string[] = [];
  q.sources.forEach((src, i) => {
    const t = findTable(schema, src.tableId)!;
    const tableSql = quoteIdent(t.name) + (src.alias.trim() ? ` AS ${quoteIdent(src.alias.trim())}` : '');
    if (i === 0) {
      fromLines.push(`FROM ${tableSql}`);
      return;
    }
    if (!src.on.length) {
      errors.push(`Add a join condition for ${sourceName(schema, src)}.`);
      return;
    }
    const conds = src.on.map((on) => {
      const left = ctx(on.left);
      const right = ctx({ sourceId: src.id, columnId: on.rightColumnId });
      if (!left || !right) return void errors.push(`A join condition for ${sourceName(schema, src)} uses a column that no longer exists.`);
      if (left.idx >= i) return void errors.push(`The join for ${sourceName(schema, src)} must compare with a table listed before it.`);
      if (!comparable(left.column.type, right.column.type))
        return void errors.push(`Join ${left.sql} = ${right.sql} compares ${left.column.type} with ${right.column.type}.`);
      return `${right.sql} = ${left.sql}`;
    });
    fromLines.push(`${JOIN_SQL[src.join]} ${tableSql}`, `    ON ${conds.join('\n    AND ')}`);
  });

  // Grouping context: aggregates make every plain selected column need GROUP BY (or its table's primary key grouped).
  const hasAggregate = q.select.some((s) => s.kind === 'aggregate');
  const grouping = hasAggregate || q.groupBy.length > 0;
  const grouped = new Set(q.groupBy.map((g) => `${g.sourceId}:${g.columnId}`));
  const pkGrouped = (sourceId: string) => {
    const src = q.sources.find((s) => s.id === sourceId);
    const pk = findTable(schema, src?.tableId ?? '')?.columns.filter((c) => c.primaryKey) ?? [];
    return pk.length > 0 && pk.every((c) => grouped.has(`${sourceId}:${c.id}`));
  };
  const groupOk = (ref: ColRef) => grouped.has(`${ref.sourceId}:${ref.columnId}`) || pkGrouped(ref.sourceId);

  // SELECT list.
  if (!q.select.length) errors.push('Choose at least one column to select, or select all columns.');
  const selectSql: string[] = [];
  const aliasOf = new Map<string, string>();
  const aliases = new Set<string>();
  for (const item of q.select) {
    if (item.kind === 'all') {
      if (grouping && !(item.sourceId ? pkGrouped(item.sourceId) : q.sources.every((s) => pkGrouped(s.id))))
        errors.push('Select specific columns instead of all columns when grouping or using aggregates.');
      const src = item.sourceId ? q.sources.find((s) => s.id === item.sourceId) : null;
      if (item.sourceId && !src) errors.push('An "all columns" item refers to a table that was removed from the query.');
      selectSql.push(src ? `${quoteIdent(sourceName(schema, src))}.*` : '*');
      continue;
    }
    let expr: string;
    if (item.kind === 'column') {
      const c = ctx(item.ref);
      if (!c) {
        errors.push('A selected column no longer exists.');
        continue;
      }
      if (grouping && !groupOk(item.ref)) errors.push(`${c.sql} must be in GROUP BY (or used inside an aggregate).`);
      expr = c.sql;
    } else {
      const res = aggregateSql(item.fn, item.ref, ctx, errors);
      if (!res) continue;
      expr = res;
    }
    const alias = item.alias.trim();
    if (alias) {
      const err = identifierError(alias, 'A column alias');
      if (err) errors.push(err);
      if (aliases.has(alias)) errors.push(`Two selected columns are both named "${alias}".`);
      aliases.add(alias);
      aliasOf.set(item.id, alias);
      expr += ` AS ${quoteIdent(alias)}`;
    }
    selectSql.push(expr);
  }

  // WHERE / GROUP BY / HAVING.
  const where = groupSql(q.where, ctx, errors, false, 0);
  const groupSqlCols = q.groupBy.map((g) => ctx(g)?.sql ?? (errors.push('A GROUP BY column no longer exists.'), ''));
  if (q.having.children.length && !grouping) errors.push('HAVING needs GROUP BY or an aggregate in the select list.');
  const having = groupSql(q.having, ctx, errors, true, 0);

  // ORDER BY.
  const orderSql: string[] = [];
  for (const o of q.orderBy) {
    if (o.target.kind === 'column') {
      const ref = o.target.ref;
      const c = ctx(ref);
      if (!c) {
        errors.push('An ORDER BY column no longer exists.');
        continue;
      }
      if (grouping && !groupOk(ref)) errors.push(`ORDER BY ${c.sql} must also be in GROUP BY.`);
      if (q.distinct && !q.select.some((s) => (s.kind === 'column' && s.ref.sourceId === ref.sourceId && s.ref.columnId === ref.columnId) || (s.kind === 'all' && (!s.sourceId || s.sourceId === ref.sourceId))))
        errors.push(`With DISTINCT, ORDER BY ${c.sql} must also be selected.`);
      orderSql.push(`${c.sql} ${o.dir}`);
    } else {
      const selectId = o.target.selectId;
      const item = q.select.find((s) => s.id === selectId);
      const alias = aliasOf.get(selectId);
      if (!item) errors.push('An ORDER BY item refers to a selected column that was removed.');
      else if (!alias) errors.push('Give the aggregate an alias to sort by it.');
      else orderSql.push(`${quoteIdent(alias)} ${o.dir}`);
    }
  }

  const limit = intClause('LIMIT', q.limit, errors);
  const offset = intClause('OFFSET', q.offset, errors);
  if (errors.length) return { sql: '', errors: [...new Set(errors)] };

  const lines = [`SELECT${q.distinct ? ' DISTINCT' : ''}`, selectSql.map((s) => `    ${s}`).join(',\n'), ...fromLines];
  if (where) lines.push(`WHERE ${where}`);
  if (groupSqlCols.length) lines.push('GROUP BY', groupSqlCols.map((g) => `    ${g}`).join(',\n'));
  if (having) lines.push(`HAVING ${having}`);
  if (orderSql.length) lines.push('ORDER BY', orderSql.map((o) => `    ${o}`).join(',\n'));
  if (limit) lines.push(limit);
  if (offset) lines.push(offset);
  return { sql: lines.join('\n') + ';\n', errors: [] };
}

type Ctx = (ref: ColRef) => { sql: string; column: { type: PgType; name: string } } | null;

function aggregateSql(fn: Aggregate, ref: ColRef | null, ctx: Ctx, errors: string[]): string | null {
  if (!ref) {
    if (fn !== 'COUNT') return (errors.push(`${fn} needs a column.`), null);
    return 'COUNT(*)';
  }
  const c = ctx(ref);
  if (!c) return (errors.push(`A column used in ${fn} no longer exists.`), null);
  if ((fn === 'SUM' || fn === 'AVG') && !NUMERIC_TYPES.includes(c.column.type)) errors.push(`${fn}(${c.sql}) needs a numeric column, not ${c.column.type}.`);
  return `${fn}(${c.sql})`;
}

function intClause(kw: string, raw: string, errors: string[]): string {
  const v = raw.trim();
  if (!v) return '';
  if (!/^\d+$/.test(v)) return (errors.push(`${kw} must be a whole number of 0 or more.`), '');
  return `${kw} ${Number(v)}`;
}

/** The type values are compared against for a condition's left side. */
function targetSql(t: CondTarget, ctx: Ctx, errors: string[], allowAggregate: boolean): { sql: string; type: PgType } | null {
  if (t.kind === 'column') {
    const c = ctx(t.ref);
    return c ? { sql: c.sql, type: c.column.type } : (errors.push('A condition uses a column that no longer exists.'), null);
  }
  if (!allowAggregate) return (errors.push('Aggregates belong in HAVING, not WHERE.'), null);
  const sql = aggregateSql(t.fn, t.ref, ctx, errors);
  if (!sql) return null;
  const base = t.ref ? ctx(t.ref)?.column.type : undefined;
  const type: PgType = t.fn === 'COUNT' ? 'BIGINT' : t.fn === 'SUM' || t.fn === 'AVG' ? 'NUMERIC' : (base ?? 'NUMERIC');
  return { sql, type };
}

function conditionSql(c: Condition, ctx: Ctx, errors: string[], allowAggregate: boolean): string | null {
  const left = targetSql(c.target, ctx, errors, allowAggregate);
  if (!left) return null;
  if (c.op === 'IS NULL' || c.op === 'IS NOT NULL') return `${left.sql} ${c.op}`;
  const pattern = c.op === 'LIKE' || c.op === 'ILIKE';
  if (pattern && !TEXT_TYPES.includes(left.type)) return (errors.push(`${c.op} needs a text column; ${left.sql} is ${left.type}.`), null);
  // Patterns keep their spaces exactly as typed; other values are trimmed.
  const values = pattern ? c.values.filter((v) => v !== '') : c.values.map((v) => v.trim()).filter(Boolean);
  const need = c.op === 'BETWEEN' ? 2 : c.op === 'IN' || c.op === 'NOT IN' ? -1 : 1;
  if ((need === -1 && values.length === 0) || (need > 0 && values.length !== need))
    return (errors.push(need === 2 ? `BETWEEN on ${left.sql} needs two values.` : `${left.sql} ${c.op} needs ${need === -1 ? 'at least one value' : 'a value'}.`), null);
  const lits = values.map((v) => {
    const l = literal(v, left.type, pattern);
    if (!l.ok) errors.push(`${left.sql}: ${l.error}`);
    return l.ok ? l.sql : '';
  });
  if (c.op === 'BETWEEN') return `${left.sql} BETWEEN ${lits[0]} AND ${lits[1]}`;
  if (c.op === 'IN' || c.op === 'NOT IN') return `${left.sql} ${c.op} (${lits.join(', ')})`;
  return `${left.sql} ${c.op} ${lits[0]}`;
}

/** Top-level groups are written one condition per line; nested groups go in parentheses. */
function groupSql(g: ConditionGroup, ctx: Ctx, errors: string[], allowAggregate: boolean, depth: number): string {
  const parts = g.children
    .map((ch) => (ch.kind === 'group' ? groupSql(ch, ctx, errors, allowAggregate, depth + 1) : conditionSql(ch, ctx, errors, allowAggregate)))
    .filter((p): p is string => Boolean(p));
  if (!parts.length) return '';
  if (depth === 0) return parts.join(`\n    ${g.op} `);
  return parts.length === 1 ? parts[0] : `(${parts.join(` ${g.op} `)})`;
}
