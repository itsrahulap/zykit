// Converts the parsed schema into a PostgreSQL Query Builder project, using that tool's own model
// and project format, so "Open in Query Builder" needs no changes there. The Query Builder's model
// is narrower (13 types, single-column relationships), so every lossy step is listed in `notes`.

import { DEFAULT_EXPRESSIONS, emptyQuery, newId, type Column, type ColumnDefault, type OnDelete, type PgType, type Project, type Relationship, type Table, type TableIndex } from '../../postgres-query-builder/features/model';
import { exportProject, importProject } from '../../postgres-query-builder/features/project';
import { DIAGRAM_METRICS, layoutDiagram } from './diagram';
import { tableLabel, type ParsedSchema } from './parser';

/** The Query Builder's own localStorage key, imported so a rename there can't silently break the hand-off. */
export { STORAGE_KEY as QUERY_BUILDER_STORAGE_KEY } from '../../postgres-query-builder/hooks/useProject';
export const QUERY_BUILDER_PATH = '/tools/postgres-query-builder';
// Mirrors the Query Builder's import limits and card geometry, so the project loads and cards don't overlap.
const MAX_TABLES = 200;
const MAX_COLUMNS = 200;
const CARD = { ...DIAGRAM_METRICS, header: 40, row: 28, padBottom: 8, fixedWidth: 264 };

const TYPES: Record<string, PgType> = {
  int: 'INTEGER',
  integer: 'INTEGER',
  int4: 'INTEGER',
  bigint: 'BIGINT',
  int8: 'BIGINT',
  serial: 'SERIAL',
  serial4: 'SERIAL',
  bigserial: 'BIGSERIAL',
  serial8: 'BIGSERIAL',
  varchar: 'VARCHAR',
  'character varying': 'VARCHAR',
  text: 'TEXT',
  boolean: 'BOOLEAN',
  bool: 'BOOLEAN',
  date: 'DATE',
  timestamp: 'TIMESTAMP',
  'timestamp without time zone': 'TIMESTAMP',
  timestamptz: 'TIMESTAMPTZ',
  'timestamp with time zone': 'TIMESTAMPTZ',
  numeric: 'NUMERIC',
  decimal: 'NUMERIC',
  uuid: 'UUID',
  jsonb: 'JSONB',
};

/** Maps a written type onto the Query Builder's list; `exact` is false when information is lost. */
export function mapType(written: string): { type: PgType; length?: number; precision?: number; scale?: number; exact: boolean } {
  const m = /^([a-z0-9_ ]+?)\s*(?:\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?\))?\s*((?:with|without) time zone)?$/.exec(written.toLowerCase().trim());
  const base = m ? (m[4] ? `${m[1]} ${m[4]}` : m[1]) : '';
  const type = TYPES[base];
  if (!m || !type) return { type: 'TEXT', exact: false };
  const a = m[2] === undefined ? undefined : Number(m[2]);
  const b = m[3] === undefined ? undefined : Number(m[3]);
  if (type === 'VARCHAR') return { type, length: a, exact: b === undefined };
  if (type === 'NUMERIC') return { type, precision: a, scale: b, exact: true };
  return { type, exact: a === undefined };
}

function mapDefault(written: string | undefined): ColumnDefault | null {
  if (written === undefined) return { kind: 'none' };
  const d = written.trim();
  const expression = DEFAULT_EXPRESSIONS.find((e) => e.toLowerCase() === d.toLowerCase());
  if (expression) return { kind: 'expression', value: expression };
  const str = /^'((?:[^']|'')*)'(?:::[a-z ]+)?$/i.exec(d);
  if (str) return { kind: 'literal', value: str[1].replace(/''/g, "'") };
  if (/^-?\d+(?:\.\d+)?$/.test(d) || /^(?:true|false)$/i.test(d)) return { kind: 'literal', value: d };
  if (/^null$/i.test(d)) return { kind: 'none' };
  return null;
}

const ON_DELETE_MAP: Record<string, OnDelete> = { 'no action': 'NO ACTION', restrict: 'RESTRICT', cascade: 'CASCADE', 'set null': 'SET NULL' };

export type QueryBuilderExport = { ok: true; project: Project; json: string; notes: string[] } | { ok: false; error: string };

const examples = (list: string[]) => `${list.slice(0, 3).join(', ')}${list.length > 3 ? `, and ${list.length - 3} more` : ''}`;

export function toQueryBuilderProject(s: ParsedSchema): QueryBuilderExport {
  if (!s.tables.length) return { ok: false, error: 'There are no tables to open.' };
  if (s.tables.length > MAX_TABLES) return { ok: false, error: `The Query Builder holds up to ${MAX_TABLES} tables; this schema has ${s.tables.length}.` };
  const wide = s.tables.find((t) => t.columns.length > MAX_COLUMNS);
  if (wide) return { ok: false, error: `"${tableLabel(wide)}" has more than ${MAX_COLUMNS} columns, which the Query Builder can’t hold.` };

  const layout = new Map(layoutDiagram(s, CARD).tables.map((shape) => [shape.table.id, shape]));
  const retyped: string[] = [];
  const droppedDefaults: string[] = [];
  const skipped: string[] = [];
  const tableIds = new Map<string, string>();
  const columnIds = new Map<string, string>();
  const colKey = (tableId: string, name: string) => `${tableId}\u0000${name}`;
  const usedNames = new Set<string>();

  const tables = s.tables.map((t): Table => {
    const id = newId('t');
    tableIds.set(t.id, id);
    // The Query Builder has no schemas: keep the bare name and make clashes unique.
    let name = t.name;
    for (let i = 2; usedNames.has(name); i++) name = `${t.name}_${i}`;
    usedNames.add(name);
    const columns = t.columns.map((c): Column => {
      const mapped = mapType(c.type);
      if (!mapped.exact) retyped.push(`${tableLabel(t)}.${c.name}: ${c.type} → ${mapped.type}`);
      const def = mapDefault(c.default);
      if (!def) droppedDefaults.push(`${tableLabel(t)}.${c.name}`);
      const col: Column = {
        id: newId('c'),
        name: c.name,
        type: mapped.type,
        primaryKey: c.primaryKey,
        notNull: c.notNull,
        unique: c.unique,
        identity: c.identity && (mapped.type === 'INTEGER' || mapped.type === 'BIGINT'),
        default: def ?? { kind: 'none' },
      };
      if (mapped.length !== undefined) col.length = mapped.length;
      if (mapped.precision !== undefined) col.precision = mapped.precision;
      if (mapped.scale !== undefined) col.scale = mapped.scale;
      if (c.check && c.check.length <= 1000) col.check = c.check;
      columnIds.set(colKey(t.id, c.name), col.id);
      return col;
    });
    const indexes = [...t.indexes, ...t.uniques.filter((u) => u.length > 1).map((columns) => ({ columns, unique: true }))].flatMap((ix): TableIndex[] => {
      const ids = ix.columns.map((n) => columnIds.get(colKey(t.id, n)));
      if (ids.some((x) => !x)) {
        skipped.push(`expression index on ${tableLabel(t)}`);
        return [];
      }
      return [{ id: newId('x'), unique: ix.unique, columnIds: ids as string[] }];
    });
    const shape = layout.get(t.id)!;
    return { id, name, x: shape.x + 40, y: shape.y + 40, columns, checks: t.checks.filter((c) => c.length <= 1000), indexes };
  });

  const relationships = s.foreignKeys.flatMap((fk): Relationship[] => {
    const child = s.tables.find((t) => t.id === fk.fromTable)!;
    if (fk.fromColumns.length !== 1) {
      skipped.push(`composite foreign key ${tableLabel(child)}(${fk.fromColumns.join(', ')})`);
      return [];
    }
    const column = child.columns.find((c) => c.name === fk.fromColumns[0])!;
    const onDelete = ON_DELETE_MAP[fk.onDelete ?? 'no action'];
    if (!onDelete) skipped.push(`ON DELETE ${fk.onDelete!.toUpperCase()} on ${tableLabel(child)}.${column.name} (kept as NO ACTION)`);
    const oneToOne = column.unique || (column.primaryKey && child.primaryKey.length === 1);
    return [
      {
        id: newId('r'),
        fromTableId: tableIds.get(fk.fromTable)!,
        fromColumnId: columnIds.get(colKey(fk.fromTable, column.name))!,
        toTableId: tableIds.get(fk.toTable)!,
        toColumnId: columnIds.get(colKey(fk.toTable, fk.toColumns[0]))!,
        kind: oneToOne ? 'one-to-one' : 'one-to-many',
        onDelete: onDelete ?? 'NO ACTION',
      },
    ];
  });

  const project: Project = { schema: { tables, relationships }, query: emptyQuery() };
  const json = exportProject(project);
  // Same validation the Query Builder runs when it loads a project, so a bad hand-off fails here instead.
  const check = importProject(json);
  if (!check.ok) return { ok: false, error: `The schema can’t be opened in the Query Builder: ${check.error}` };

  const notes: string[] = [];
  if (retyped.length) notes.push(`Types the Query Builder doesn’t have were mapped: ${examples(retyped)}.`);
  if (droppedDefaults.length) notes.push(`Defaults it can’t represent were dropped: ${examples(droppedDefaults)}.`);
  if (skipped.length) notes.push(`Not carried over: ${examples(skipped)}.`);
  if (s.tables.some((t) => t.schema && t.schema !== 'public')) notes.push('The Query Builder has no schemas, so tables keep only their bare names.');
  return { ok: true, project, json, notes };
}
