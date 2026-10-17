// Structured schema and query model. Everything refers to tables and columns by stable id, so
// renaming a table or column never breaks a relationship, join or filter.

export const PG_TYPES = [
  'INTEGER',
  'BIGINT',
  'SERIAL',
  'BIGSERIAL',
  'VARCHAR',
  'TEXT',
  'BOOLEAN',
  'DATE',
  'TIMESTAMP',
  'TIMESTAMPTZ',
  'NUMERIC',
  'UUID',
  'JSONB',
] as const;
export type PgType = (typeof PG_TYPES)[number];

/** Defaults are either a typed literal (serialized safely) or one of a few known expressions. */
export const DEFAULT_EXPRESSIONS = ['CURRENT_TIMESTAMP', 'CURRENT_DATE', 'now()', 'gen_random_uuid()'] as const;
export type DefaultExpression = (typeof DEFAULT_EXPRESSIONS)[number];
export type ColumnDefault = { kind: 'none' } | { kind: 'literal'; value: string } | { kind: 'expression'; value: DefaultExpression };

export interface Column {
  id: string;
  name: string;
  type: PgType;
  /** VARCHAR(length). */
  length?: number;
  /** NUMERIC(precision, scale). */
  precision?: number;
  scale?: number;
  primaryKey: boolean;
  notNull: boolean;
  unique: boolean;
  /** INTEGER/BIGINT GENERATED ALWAYS AS IDENTITY. */
  identity: boolean;
  default: ColumnDefault;
  /** Column CHECK expression, written as-is. */
  check?: string;
}

export interface TableIndex {
  id: string;
  columnIds: string[];
  unique: boolean;
}

export interface Table {
  id: string;
  name: string;
  /** Canvas position. */
  x: number;
  y: number;
  columns: Column[];
  /** Table-level CHECK expressions, written as-is. */
  checks: string[];
  indexes: TableIndex[];
}

export type RelationshipKind = 'one-to-many' | 'one-to-one';
export const ON_DELETE = ['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL'] as const;
export type OnDelete = (typeof ON_DELETE)[number];

/** A foreign key: `fromColumn` (in the child table) references `toColumn` (in the parent table). */
export interface Relationship {
  id: string;
  fromTableId: string;
  fromColumnId: string;
  toTableId: string;
  toColumnId: string;
  kind: RelationshipKind;
  onDelete: OnDelete;
}

export interface Schema {
  tables: Table[];
  relationships: Relationship[];
}

// ---- Query ----

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
export const JOIN_TYPES: JoinType[] = ['INNER', 'LEFT', 'RIGHT', 'FULL'];

export interface ColRef {
  sourceId: string;
  columnId: string;
}

/** One table in the query. The first source is the FROM table; later ones are joins. */
export interface QuerySource {
  id: string;
  tableId: string;
  alias: string;
  join: JoinType;
  /** Join conditions: a column of an earlier source = a column of this source. */
  on: { id: string; left: ColRef; rightColumnId: string }[];
}

export const AGGREGATES = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'] as const;
export type Aggregate = (typeof AGGREGATES)[number];

export type SelectItem =
  | { id: string; kind: 'column'; ref: ColRef; alias: string }
  /** `*` when sourceId is null, otherwise `alias.*`. */
  | { id: string; kind: 'all'; sourceId: string | null }
  /** COUNT(*) when ref is null. */
  | { id: string; kind: 'aggregate'; fn: Aggregate; ref: ColRef | null; alias: string };

export const OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'ILIKE', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL', 'BETWEEN'] as const;
export type Operator = (typeof OPERATORS)[number];

/** Left side of a condition: a column, or (in HAVING) an aggregate over a column / COUNT(*). */
export type CondTarget = { kind: 'column'; ref: ColRef } | { kind: 'aggregate'; fn: Aggregate; ref: ColRef | null };

export interface Condition {
  id: string;
  kind: 'cond';
  target: CondTarget;
  op: Operator;
  /** Raw values typed by the user; IN uses one per entry, BETWEEN uses two. */
  values: string[];
}

export interface ConditionGroup {
  id: string;
  kind: 'group';
  op: 'AND' | 'OR';
  children: (Condition | ConditionGroup)[];
}

export interface OrderItem {
  id: string;
  /** A column, or a select item's alias (for ordering by an aggregate). */
  target: { kind: 'column'; ref: ColRef } | { kind: 'select'; selectId: string };
  dir: 'ASC' | 'DESC';
}

export interface Query {
  distinct: boolean;
  sources: QuerySource[];
  select: SelectItem[];
  where: ConditionGroup;
  groupBy: ColRef[];
  having: ConditionGroup;
  orderBy: OrderItem[];
  /** Raw text from the inputs; validated before use. */
  limit: string;
  offset: string;
}

export interface Project {
  schema: Schema;
  query: Query;
}

// ---- Factories ----

let counter = 0;
/** Unique id, stable for the life of the object (persisted with the project). */
export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const newColumn = (name: string, type: PgType = 'TEXT', extra: Partial<Column> = {}): Column => ({
  id: newId('c'),
  name,
  type,
  primaryKey: false,
  notNull: false,
  unique: false,
  identity: false,
  default: { kind: 'none' },
  ...extra,
});

export const newTable = (name: string, x = 40, y = 40, columns: Column[] = []): Table => ({
  id: newId('t'),
  name,
  x,
  y,
  columns,
  checks: [],
  indexes: [],
});

export const emptyGroup = (op: 'AND' | 'OR' = 'AND'): ConditionGroup => ({ id: newId('g'), kind: 'group', op, children: [] });

export const emptyQuery = (): Query => ({
  distinct: false,
  sources: [],
  select: [],
  where: emptyGroup(),
  groupBy: [],
  having: emptyGroup(),
  orderBy: [],
  limit: '',
  offset: '',
});

export const emptyProject = (): Project => ({ schema: { tables: [], relationships: [] }, query: emptyQuery() });

// ---- Lookups ----

export const findTable = (s: Schema, id: string) => s.tables.find((t) => t.id === id);
export const findColumn = (t: Table | undefined, id: string) => t?.columns.find((c) => c.id === id);

/** The schema table and column a query ColRef points at, if both still exist. */
export function resolveRef(schema: Schema, query: Query, ref: ColRef) {
  const source = query.sources.find((s) => s.id === ref.sourceId);
  const table = source && findTable(schema, source.tableId);
  const column = findColumn(table, ref.columnId);
  return source && table && column ? { source, table, column } : undefined;
}

/** True when the column is the child side of a relationship. */
export const isForeignKey = (s: Schema, tableId: string, columnId: string) =>
  s.relationships.some((r) => r.fromTableId === tableId && r.fromColumnId === columnId);
