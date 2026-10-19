// Schema → PostgreSQL DDL. Validates first and returns errors instead of SQL when the schema
// can't produce a valid script. Tables are created in dependency order; foreign keys between
// tables that reference each other in a cycle are added afterwards with ALTER TABLE.

import { findColumn, findTable, type Column, type Relationship, type Schema, type Table } from './model';
import { expressionError, identifierError, keyType, literal, quoteIdent, typeSql } from './sql';

export interface DdlOptions {
  /** PostgreSQL doesn't index foreign key columns automatically; add CREATE INDEX for them. */
  indexForeignKeys: boolean;
}

export interface DdlResult {
  sql: string;
  errors: string[];
}

/** Truncate a generated constraint/index name to 63 bytes, as PostgreSQL would. */
function objectName(name: string): string {
  const bytes = new TextEncoder().encode(name);
  if (bytes.length <= 63) return name;
  let out = name;
  while (new TextEncoder().encode(out).length > 63) out = out.slice(0, -1);
  return out;
}

const DATE_TYPES = ['DATE', 'TIMESTAMP', 'TIMESTAMPTZ'];

function columnErrors(t: Table, c: Column): string[] {
  const where = `${t.name || 'Table'}.${c.name || 'column'}`;
  const e: string[] = [];
  const nameErr = identifierError(c.name, `A column in ${t.name || 'a table'}`);
  if (nameErr) e.push(nameErr);
  if (c.type === 'VARCHAR' && c.length !== undefined && !(Number.isInteger(c.length) && c.length >= 1 && c.length <= 10485760))
    e.push(`${where}: VARCHAR length must be a whole number from 1 to 10485760.`);
  if (c.type === 'NUMERIC' && c.precision !== undefined) {
    if (!(Number.isInteger(c.precision) && c.precision >= 1 && c.precision <= 1000)) e.push(`${where}: NUMERIC precision must be 1 to 1000.`);
    if (c.scale !== undefined && !(Number.isInteger(c.scale) && c.scale >= 0 && c.scale <= c.precision)) e.push(`${where}: NUMERIC scale must be 0 to the precision.`);
  }
  if (c.identity && c.type !== 'INTEGER' && c.type !== 'BIGINT') e.push(`${where}: identity columns must be INTEGER or BIGINT.`);
  if ((c.identity || c.type === 'SERIAL' || c.type === 'BIGSERIAL') && c.default.kind !== 'none')
    e.push(`${where}: an auto-numbered column can't also have a default.`);
  if (c.default.kind === 'literal') {
    const lit = literal(c.default.value, c.type);
    if (!lit.ok) e.push(`${where}: default ${lit.error}`);
  }
  if (c.default.kind === 'expression') {
    const v = c.default.value;
    const ok = v === 'gen_random_uuid()' ? c.type === 'UUID' : DATE_TYPES.includes(c.type);
    if (!ok) e.push(`${where}: ${v} can't be the default of a ${c.type} column.`);
  }
  if (c.check) {
    const err = expressionError(c.check);
    if (err) e.push(`${where}: ${err}`);
  }
  return e;
}

/** Problems that would make the schema's DDL invalid. Empty when it's fine. */
export function validateSchema(s: Schema): string[] {
  const errors: string[] = [];
  if (!s.tables.length) return ['Add a table to generate CREATE TABLE statements.'];
  const tableNames = new Set<string>();
  for (const t of s.tables) {
    const err = identifierError(t.name, 'A table');
    if (err) errors.push(err);
    if (tableNames.has(t.name)) errors.push(`Two tables are named "${t.name}".`);
    tableNames.add(t.name);
    if (!t.columns.length) errors.push(`Table ${t.name || '(unnamed)'} has no columns.`);
    const colNames = new Set<string>();
    for (const c of t.columns) {
      if (colNames.has(c.name)) errors.push(`Table ${t.name} has two columns named "${c.name}".`);
      colNames.add(c.name);
      errors.push(...columnErrors(t, c));
    }
    for (const check of t.checks) {
      const err = expressionError(check);
      if (err) errors.push(`${t.name}: ${err}`);
    }
    for (const ix of t.indexes) {
      if (!ix.columnIds.length) errors.push(`${t.name}: an index has no columns.`);
      if (ix.columnIds.some((id) => !findColumn(t, id))) errors.push(`${t.name}: an index uses a column that no longer exists.`);
    }
  }
  for (const r of s.relationships) errors.push(...relationshipErrors(s, r));
  return errors;
}

/** Why a relationship can't become a foreign key, if it can't. */
export function relationshipErrors(s: Schema, r: Relationship): string[] {
  const child = findTable(s, r.fromTableId);
  const parent = findTable(s, r.toTableId);
  const fc = findColumn(child, r.fromColumnId);
  const pc = findColumn(parent, r.toColumnId);
  if (!child || !parent || !fc || !pc) return ['A relationship points at a table or column that no longer exists.'];
  const label = `${child.name}.${fc.name} → ${parent.name}.${pc.name}`;
  const e: string[] = [];
  if (child.id === parent.id && fc.id === pc.id) e.push(`${label}: a column can't reference itself.`);
  if (keyType(fc.type) !== keyType(pc.type)) e.push(`${label}: types don't match (${fc.type} vs ${pc.type}).`);
  const parentPk = parent.columns.filter((c) => c.primaryKey);
  const referencedIsKey = pc.unique || (pc.primaryKey && parentPk.length === 1);
  if (!referencedIsKey) e.push(`${label}: the referenced column must be the primary key or UNIQUE.`);
  if (r.onDelete === 'SET NULL' && (fc.notNull || fc.primaryKey)) e.push(`${label}: ON DELETE SET NULL needs a nullable column.`);
  return e;
}

function columnSql(c: Column, forceUnique: boolean, singlePk: boolean): string {
  const parts = [quoteIdent(c.name), typeSql(c)];
  if (c.identity) parts.push('GENERATED ALWAYS AS IDENTITY');
  if (c.default.kind === 'literal') {
    const lit = literal(c.default.value, c.type);
    if (lit.ok) parts.push(`DEFAULT ${lit.sql}`);
  }
  if (c.default.kind === 'expression') parts.push(`DEFAULT ${c.default.value}`);
  if (c.primaryKey && singlePk) parts.push('PRIMARY KEY');
  else {
    if (c.unique || forceUnique) parts.push('UNIQUE');
    if (c.notNull) parts.push('NOT NULL');
  }
  if (c.check) parts.push(`CHECK (${c.check.trim()})`);
  return parts.join(' ');
}

function foreignKeySql(s: Schema, r: Relationship): { name: string; clause: string } {
  const child = findTable(s, r.fromTableId)!;
  const parent = findTable(s, r.toTableId)!;
  const fc = findColumn(child, r.fromColumnId)!;
  const pc = findColumn(parent, r.toColumnId)!;
  const name = objectName(`${child.name}_${fc.name}_fkey`);
  const onDelete = r.onDelete === 'NO ACTION' ? '' : ` ON DELETE ${r.onDelete}`;
  return {
    name,
    clause: `CONSTRAINT ${quoteIdent(name)} FOREIGN KEY (${quoteIdent(fc.name)}) REFERENCES ${quoteIdent(parent.name)} (${quoteIdent(pc.name)})${onDelete}`,
  };
}

/** Tables in creation order: parents before children (self-references don't count). Cycles keep their original order. */
export function creationOrder(s: Schema): Table[] {
  const remaining = new Set(s.tables.map((t) => t.id));
  const order: Table[] = [];
  const deps = (t: Table) => s.relationships.filter((r) => r.fromTableId === t.id && r.toTableId !== t.id).map((r) => r.toTableId);
  let progressed = true;
  while (remaining.size && progressed) {
    progressed = false;
    for (const t of s.tables) {
      if (remaining.has(t.id) && deps(t).every((d) => !remaining.has(d))) {
        order.push(t);
        remaining.delete(t.id);
        progressed = true;
      }
    }
  }
  return [...order, ...s.tables.filter((t) => remaining.has(t.id))];
}

export function generateDdl(s: Schema, opts: DdlOptions = { indexForeignKeys: true }): DdlResult {
  const errors = validateSchema(s);
  if (errors.length) return { sql: '', errors };

  const created = new Set<string>();
  const statements: string[] = [];
  const deferred: string[] = [];
  const indexes: string[] = [];

  for (const t of creationOrder(s)) {
    const pk = t.columns.filter((c) => c.primaryKey);
    const oneToOne = new Set(s.relationships.filter((r) => r.fromTableId === t.id && r.kind === 'one-to-one').map((r) => r.fromColumnId));
    // One-to-one foreign keys need UNIQUE so each parent row has at most one child.
    const lines = t.columns.map((c) => '    ' + columnSql(c, oneToOne.has(c.id) && !c.unique && !(c.primaryKey && pk.length === 1), pk.length === 1));
    if (pk.length > 1) lines.push(`    PRIMARY KEY (${pk.map((c) => quoteIdent(c.name)).join(', ')})`);
    for (const check of t.checks) lines.push(`    CHECK (${check.trim()})`);
    for (const r of s.relationships.filter((x) => x.fromTableId === t.id)) {
      const fk = foreignKeySql(s, r);
      if (r.toTableId === t.id || created.has(r.toTableId)) lines.push(`    ${fk.clause}`);
      else deferred.push(`ALTER TABLE ${quoteIdent(t.name)}\n    ADD ${fk.clause};`);
    }
    statements.push(`CREATE TABLE ${quoteIdent(t.name)} (\n${lines.join(',\n')}\n);`);
    created.add(t.id);

    const indexed = new Set(t.indexes.map((ix) => ix.columnIds[0]));
    for (const ix of t.indexes) {
      const cols = ix.columnIds.map((id) => findColumn(t, id)!);
      const name = objectName(`${t.name}_${cols.map((c) => c.name).join('_')}_${ix.unique ? 'key' : 'idx'}`);
      indexes.push(`CREATE ${ix.unique ? 'UNIQUE ' : ''}INDEX ${quoteIdent(name)} ON ${quoteIdent(t.name)} (${cols.map((c) => quoteIdent(c.name)).join(', ')});`);
    }
    if (opts.indexForeignKeys) {
      for (const r of s.relationships.filter((x) => x.fromTableId === t.id)) {
        const c = findColumn(t, r.fromColumnId)!;
        const alreadyIndexed = c.unique || r.kind === 'one-to-one' || (c.primaryKey && pk[0]?.id === c.id) || indexed.has(c.id);
        if (alreadyIndexed) continue;
        indexed.add(c.id);
        const name = objectName(`${t.name}_${c.name}_idx`);
        indexes.push(`CREATE INDEX ${quoteIdent(name)} ON ${quoteIdent(t.name)} (${quoteIdent(c.name)});`);
      }
    }
  }

  const out = [...statements];
  if (deferred.length) out.push('-- These tables reference each other, so their foreign keys are added once all tables exist.', ...deferred);
  if (indexes.length) out.push(...indexes);
  return { sql: out.join('\n\n') + '\n', errors: [] };
}
