// Project JSON export/import and schema helpers. Imported JSON is untrusted: only known fields
// of the right types are copied into fresh objects, with size limits.

import {
  AGGREGATES,
  DEFAULT_EXPRESSIONS,
  JOIN_TYPES,
  ON_DELETE,
  OPERATORS,
  PG_TYPES,
  emptyQuery,
  findColumn,
  findTable,
  newColumn,
  newId,
  newTable,
  type ColRef,
  type Column,
  type ColumnDefault,
  type CondTarget,
  type Condition,
  type ConditionGroup,
  type OrderItem,
  type Project,
  type Query,
  type QuerySource,
  type Relationship,
  type Schema,
  type SelectItem,
  type Table,
} from './model';
import { keyType } from './sql';

export const PROJECT_FORMAT = 'zykit-postgres-query-builder';
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const LIMITS = { tables: 200, columns: 200, relationships: 1000, items: 500, depth: 8 };

export const exportProject = (p: Project) => JSON.stringify({ format: PROJECT_FORMAT, version: 1, ...p }, null, 2);

class ImportError extends Error {}
const fail = (msg: string): never => {
  throw new ImportError(msg);
};
const obj = (v: unknown, what: string) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : fail(`${what} must be an object.`));
const arr = (v: unknown, what: string, max: number) => (Array.isArray(v) ? (v.length <= max ? v : fail(`Too many ${what} (max ${max}).`)) : fail(`${what} must be a list.`));
const str = (v: unknown, what: string, max = 200) => (typeof v === 'string' && v.length <= max ? v : fail(`${what} must be text of at most ${max} characters.`));
const id = (v: unknown) => (typeof v === 'string' && /^[\w-]{1,64}$/.test(v) ? v : fail('An id is missing or invalid.'));
const bool = (v: unknown) => v === true;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const oneOf = <T extends string>(v: unknown, list: readonly T[], what: string): T => (list.includes(v as T) ? (v as T) : fail(`${what} has an unknown value.`));

function readDefault(v: unknown): ColumnDefault {
  const d = v === undefined ? { kind: 'none' } : obj(v, 'A column default');
  if (d.kind === 'literal') return { kind: 'literal', value: str(d.value, 'A default value', 1000) };
  if (d.kind === 'expression') return { kind: 'expression', value: oneOf(d.value, DEFAULT_EXPRESSIONS, 'A default expression') };
  return { kind: 'none' };
}

function readColumn(v: unknown): Column {
  const c = obj(v, 'A column');
  const out: Column = {
    id: id(c.id),
    name: str(c.name, 'A column name'),
    type: oneOf(c.type, PG_TYPES, 'A column type'),
    primaryKey: bool(c.primaryKey),
    notNull: bool(c.notNull),
    unique: bool(c.unique),
    identity: bool(c.identity),
    default: readDefault(c.default),
  };
  const length = num(c.length);
  if (length !== undefined) out.length = length;
  const precision = num(c.precision);
  if (precision !== undefined) out.precision = precision;
  const scale = num(c.scale);
  if (scale !== undefined) out.scale = scale;
  if (c.check !== undefined) out.check = str(c.check, 'A CHECK expression', 1000);
  return out;
}

function readTable(v: unknown): Table {
  const t = obj(v, 'A table');
  return {
    id: id(t.id),
    name: str(t.name, 'A table name'),
    x: num(t.x) ?? 40,
    y: num(t.y) ?? 40,
    columns: arr(t.columns, 'columns', LIMITS.columns).map(readColumn),
    checks: arr(t.checks ?? [], 'checks', 50).map((c) => str(c, 'A CHECK expression', 1000)),
    indexes: arr(t.indexes ?? [], 'indexes', 100).map((x) => {
      const ix = obj(x, 'An index');
      return { id: id(ix.id), unique: bool(ix.unique), columnIds: arr(ix.columnIds, 'index columns', 32).map(id) };
    }),
  };
}

function readRelationship(v: unknown): Relationship {
  const r = obj(v, 'A relationship');
  return {
    id: id(r.id),
    fromTableId: id(r.fromTableId),
    fromColumnId: id(r.fromColumnId),
    toTableId: id(r.toTableId),
    toColumnId: id(r.toColumnId),
    kind: oneOf(r.kind, ['one-to-many', 'one-to-one'] as const, 'A relationship kind'),
    onDelete: oneOf(r.onDelete, ON_DELETE, 'ON DELETE'),
  };
}

const readRef = (v: unknown): ColRef => {
  const r = obj(v, 'A column reference');
  return { sourceId: id(r.sourceId), columnId: id(r.columnId) };
};

function readTarget(v: unknown): CondTarget {
  const t = obj(v, 'A condition target');
  if (t.kind === 'aggregate') return { kind: 'aggregate', fn: oneOf(t.fn, AGGREGATES, 'An aggregate'), ref: t.ref === null ? null : readRef(t.ref) };
  return { kind: 'column', ref: readRef(t.ref) };
}

function readGroup(v: unknown, depth = 0): ConditionGroup {
  if (depth > LIMITS.depth) fail('Conditions are nested too deeply.');
  const g = obj(v, 'A condition group');
  return {
    id: id(g.id),
    kind: 'group',
    op: oneOf(g.op, ['AND', 'OR'] as const, 'A condition group'),
    children: arr(g.children, 'conditions', LIMITS.items).map((ch): Condition | ConditionGroup => {
      const c = obj(ch, 'A condition');
      if (c.kind === 'group') return readGroup(c, depth + 1);
      return { id: id(c.id), kind: 'cond', target: readTarget(c.target), op: oneOf(c.op, OPERATORS, 'An operator'), values: arr(c.values, 'values', LIMITS.items).map((x) => str(x, 'A value', 1000)) };
    }),
  };
}

function readSelect(v: unknown): SelectItem {
  const s = obj(v, 'A selected column');
  if (s.kind === 'all') return { id: id(s.id), kind: 'all', sourceId: s.sourceId === null ? null : id(s.sourceId) };
  if (s.kind === 'aggregate') return { id: id(s.id), kind: 'aggregate', fn: oneOf(s.fn, AGGREGATES, 'An aggregate'), ref: s.ref === null ? null : readRef(s.ref), alias: str(s.alias ?? '', 'An alias') };
  return { id: id(s.id), kind: 'column', ref: readRef(s.ref), alias: str(s.alias ?? '', 'An alias') };
}

function readQuery(v: unknown): Query {
  if (v === undefined) return emptyQuery();
  const q = obj(v, 'The query');
  return {
    distinct: bool(q.distinct),
    sources: arr(q.sources, 'query tables', 50).map((x): QuerySource => {
      const s = obj(x, 'A query table');
      return {
        id: id(s.id),
        tableId: id(s.tableId),
        alias: str(s.alias ?? '', 'An alias'),
        join: oneOf(s.join ?? 'INNER', JOIN_TYPES, 'A join type'),
        on: arr(s.on ?? [], 'join conditions', 20).map((o) => {
          const on = obj(o, 'A join condition');
          return { id: id(on.id), left: readRef(on.left), rightColumnId: id(on.rightColumnId) };
        }),
      };
    }),
    select: arr(q.select, 'selected columns', LIMITS.items).map(readSelect),
    where: readGroup(q.where),
    groupBy: arr(q.groupBy ?? [], 'GROUP BY columns', LIMITS.items).map(readRef),
    having: readGroup(q.having),
    orderBy: arr(q.orderBy ?? [], 'ORDER BY items', LIMITS.items).map((x): OrderItem => {
      const o = obj(x, 'An ORDER BY item');
      const t = obj(o.target, 'An ORDER BY target');
      return { id: id(o.id), dir: oneOf(o.dir, ['ASC', 'DESC'] as const, 'A sort direction'), target: t.kind === 'select' ? { kind: 'select', selectId: id(t.selectId) } : { kind: 'column', ref: readRef(t.ref) } };
    }),
    limit: str(q.limit ?? '', 'LIMIT', 20),
    offset: str(q.offset ?? '', 'OFFSET', 20),
  };
}

export type ImportResult = { ok: true; project: Project } | { ok: false; error: string };

export function importProject(text: string): ImportResult {
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) return { ok: false, error: 'The file is larger than 2 MB.' };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
  try {
    const root = obj(data, 'The file');
    if (root.format !== PROJECT_FORMAT) fail('This is not a PostgreSQL Query Builder project file.');
    const schemaRaw = obj(root.schema, 'The schema');
    const schema: Schema = {
      tables: arr(schemaRaw.tables, 'tables', LIMITS.tables).map(readTable),
      relationships: arr(schemaRaw.relationships ?? [], 'relationships', LIMITS.relationships).map(readRelationship),
    };
    return { ok: true, project: { schema, query: readQuery(root.query) } };
  } catch (e) {
    if (e instanceof ImportError) return { ok: false, error: e.message };
    throw e;
  }
}

/** A many-to-many link between two tables: a junction table with one foreign key to each, both forming its primary key. */
export function junctionTable(s: Schema, aId: string, bId: string): { table: Table; relationships: Relationship[] } | { error: string } {
  const a = findTable(s, aId);
  const b = findTable(s, bId);
  if (!a || !b) return { error: 'Pick two tables.' };
  if (a.id === b.id) return { error: 'Pick two different tables.' };
  const pkA = a.columns.filter((c) => c.primaryKey);
  const pkB = b.columns.filter((c) => c.primaryKey);
  if (pkA.length !== 1 || pkB.length !== 1) return { error: 'Both tables need a single-column primary key.' };
  const colA = newColumn(`${a.name}_id`, keyType(pkA[0].type), { primaryKey: true });
  const colB = newColumn(`${b.name}_id`, keyType(pkB[0].type), { primaryKey: true });
  if (colA.name === colB.name) colB.name = `${b.name}_id_2`;
  const table = newTable(`${a.name}_${b.name}`, Math.round((a.x + b.x) / 2), Math.max(a.y, b.y) + 260, [colA, colB]);
  const rel = (from: Column, to: Table, pk: Column): Relationship => ({
    id: newId('r'),
    fromTableId: table.id,
    fromColumnId: from.id,
    toTableId: to.id,
    toColumnId: pk.id,
    kind: 'one-to-many',
    onDelete: 'CASCADE',
  });
  return { table, relationships: [rel(colA, a, pkA[0]), rel(colB, b, pkB[0])] };
}

/** Removing a table or column also removes relationships and query parts that point at it. */
export function pruneProject(p: Project): Project {
  const { schema, query } = p;
  const colExists = (tableId: string, columnId: string) => findTable(schema, tableId)?.columns.some((c) => c.id === columnId) ?? false;
  const relationships = schema.relationships.filter((r) => colExists(r.fromTableId, r.fromColumnId) && colExists(r.toTableId, r.toColumnId));
  const tables = schema.tables.map((t) => ({ ...t, indexes: t.indexes.filter((ix) => ix.columnIds.every((c) => colExists(t.id, c))) }));
  const kept = query.sources.filter((s) => findTable(schema, s.tableId));
  const refOk = (r: ColRef | null) => {
    if (!r) return true;
    const s = kept.find((x) => x.id === r.sourceId);
    return !!s && colExists(s.tableId, r.columnId);
  };
  const sources = kept.map((s) => ({ ...s, on: s.on.filter((o) => refOk(o.left) && colExists(s.tableId, o.rightColumnId)) }));
  const select = query.select.filter((i) => (i.kind === 'all' ? i.sourceId === null || kept.some((s) => s.id === i.sourceId) : refOk(i.ref)));
  const group = (g: ConditionGroup): ConditionGroup => ({
    ...g,
    children: g.children.filter((c) => c.kind === 'group' || refOk(c.target.ref)).map((c) => (c.kind === 'group' ? group(c) : c)),
  });
  const orderBy = query.orderBy.filter((o) => (o.target.kind === 'column' ? refOk(o.target.ref) : select.some((i) => i.id === (o.target as { selectId: string }).selectId)));
  return {
    schema: { tables, relationships },
    query: { ...query, sources, select, where: group(query.where), groupBy: query.groupBy.filter(refOk), having: group(query.having), orderBy },
  };
}

export type RelationshipDraft = Omit<Relationship, 'id'>;

export const emptyDraft = (): RelationshipDraft => ({ fromTableId: '', fromColumnId: '', toTableId: '', toColumnId: '', kind: 'one-to-many', onDelete: 'NO ACTION' });

/** From two clicked columns, guess which is the referenced (parent) side: a key column. The user still confirms. */
export function draftFromConnect(s: Schema, a: { tableId: string; columnId: string }, b: { tableId: string; columnId: string }): RelationshipDraft {
  const isKey = (p: typeof a) => {
    const c = findColumn(findTable(s, p.tableId), p.columnId);
    return !!c && (c.primaryKey || c.unique);
  };
  const [child, parent] = isKey(a) && !isKey(b) ? [b, a] : [a, b];
  return { ...emptyDraft(), fromTableId: child.tableId, fromColumnId: child.columnId, toTableId: parent.tableId, toColumnId: parent.columnId };
}
