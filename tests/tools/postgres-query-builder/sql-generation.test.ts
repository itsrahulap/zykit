import { describe, expect, it } from 'vitest';
import { generateDdl, validateSchema } from '../../../src/tools/postgres-query-builder/features/ddl';
import { explainQuery } from '../../../src/tools/postgres-query-builder/features/explain';
import { emptyGroup, emptyQuery, newColumn as col, newTable, type Query, type QuerySource, type Relationship, type Schema, type Table } from '../../../src/tools/postgres-query-builder/features/model';
import { exportProject, importProject, junctionTable, pruneProject } from '../../../src/tools/postgres-query-builder/features/project';
import { generateQuery, suggestJoinConditions } from '../../../src/tools/postgres-query-builder/features/query';
import { SAMPLES } from '../../../src/tools/postgres-query-builder/features/samples';
import { expressionError, literal, quoteIdent } from '../../../src/tools/postgres-query-builder/features/sql';

const cid = (t: Table, name: string) => t.columns.find((c) => c.name === name)!.id;
const fk = (child: Table, childCol: string, parent: Table, parentCol = 'id', extra: Partial<Relationship> = {}): Relationship => ({
  id: `r_${child.name}_${childCol}`,
  fromTableId: child.id,
  fromColumnId: cid(child, childCol),
  toTableId: parent.id,
  toColumnId: cid(parent, parentCol),
  kind: 'one-to-many',
  onDelete: 'NO ACTION',
  ...extra,
});
const src = (t: Table, sid: string, alias = '', extra: Partial<QuerySource> = {}): QuerySource => ({ id: sid, tableId: t.id, alias, join: 'INNER', on: [], ...extra });

function shop() {
  const users = newTable('users', 0, 0, [
    col('id', 'BIGINT', { primaryKey: true, identity: true }),
    col('name', 'VARCHAR', { length: 255, notNull: true }),
    col('email', 'VARCHAR', { length: 255, notNull: true, unique: true }),
    col('created_at', 'TIMESTAMPTZ', { default: { kind: 'expression', value: 'CURRENT_TIMESTAMP' } }),
  ]);
  const orders = newTable('orders', 0, 0, [col('id', 'BIGINT', { primaryKey: true, identity: true }), col('user_id', 'BIGINT', { notNull: true }), col('total', 'NUMERIC', { precision: 10, scale: 2 })]);
  const schema: Schema = { tables: [orders, users], relationships: [fk(orders, 'user_id', users)] };
  return { users, orders, schema };
}

describe('identifier quoting and literals', () => {
  it('leaves plain names bare and quotes reserved, mixed-case and unusual names', () => {
    expect(quoteIdent('users')).toBe('users');
    expect(quoteIdent('user')).toBe('"user"');
    expect(quoteIdent('order')).toBe('"order"');
    expect(quoteIdent('Users')).toBe('"Users"');
    expect(quoteIdent('first name')).toBe('"first name"');
    expect(quoteIdent('say "hi"')).toBe('"say ""hi"""');
    expect(quoteIdent('2fa')).toBe('"2fa"');
  });

  it('serializes values by column type and rejects ones that do not fit', () => {
    expect(literal("O'Brien", 'TEXT')).toEqual({ ok: true, sql: "'O''Brien'" });
    expect(literal('42', 'INTEGER')).toEqual({ ok: true, sql: '42' });
    expect(literal('4.2', 'INTEGER').ok).toBe(false);
    expect(literal('19.99', 'NUMERIC')).toEqual({ ok: true, sql: '19.99' });
    expect(literal('TRUE', 'BOOLEAN')).toEqual({ ok: true, sql: 'TRUE' });
    expect(literal('yes', 'BOOLEAN').ok).toBe(false);
    expect(literal('2026-01-31', 'DATE')).toEqual({ ok: true, sql: "DATE '2026-01-31'" });
    expect(literal('31/01/2026', 'DATE').ok).toBe(false);
    expect(literal('2026-01-31 10:30', 'TIMESTAMPTZ')).toEqual({ ok: true, sql: "TIMESTAMPTZ '2026-01-31 10:30'" });
    expect(literal('{"a":1}', 'JSONB')).toEqual({ ok: true, sql: `'{"a":1}'::jsonb` });
    expect(literal('{a:1}', 'JSONB').ok).toBe(false);
    expect(literal('not-a-uuid', 'UUID').ok).toBe(false);
    expect(literal("1'; DROP TABLE users; --", 'INTEGER').ok).toBe(false);
  });

  it('rejects CHECK expressions that could end the statement', () => {
    expect(expressionError('price >= 0')).toBeNull();
    expect(expressionError("status IN ('a;b')")).toBeNull();
    expect(expressionError('1 = 1); DROP TABLE x; --')).not.toBeNull();
    expect(expressionError('(a > 1')).not.toBeNull();
  });
});

describe('CREATE TABLE generation', () => {
  it('generates the users example and creates parents before children', () => {
    const { schema } = shop();
    const { sql, errors } = generateDdl(schema);
    expect(errors).toEqual([]);
    expect(sql).toContain(
      'CREATE TABLE users (\n    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n    name VARCHAR(255) NOT NULL,\n    email VARCHAR(255) UNIQUE NOT NULL,\n    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP\n);',
    );
    expect(sql.indexOf('CREATE TABLE users')).toBeLessThan(sql.indexOf('CREATE TABLE orders'));
    expect(sql).toContain('CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id)');
    expect(sql).toContain('CREATE INDEX orders_user_id_idx ON orders (user_id);');
    expect(sql).toContain('total NUMERIC(10, 2)');
  });

  it('is deterministic', () => {
    const { schema } = shop();
    expect(generateDdl(schema).sql).toBe(generateDdl(schema).sql);
  });

  it('adds foreign keys between mutually referencing tables with ALTER TABLE', () => {
    const a = newTable('employees', 0, 0, [col('id', 'BIGINT', { primaryKey: true }), col('dept_id', 'BIGINT')]);
    const b = newTable('departments', 0, 0, [col('id', 'BIGINT', { primaryKey: true }), col('manager_id', 'BIGINT')]);
    const { sql, errors } = generateDdl({ tables: [a, b], relationships: [fk(a, 'dept_id', b), fk(b, 'manager_id', a)] });
    expect(errors).toEqual([]);
    expect(sql).toContain('ALTER TABLE');
    expect(sql.match(/FOREIGN KEY/g)).toHaveLength(2);
    expect(sql.indexOf('ALTER TABLE')).toBeGreaterThan(sql.lastIndexOf('CREATE TABLE'));
  });

  it('keeps self-references inline, quotes reserved names and handles composite keys, one-to-one and ON DELETE', () => {
    const user = newTable('user', 0, 0, [col('id', 'BIGINT', { primaryKey: true }), col('manager_id', 'BIGINT')]);
    const profile = newTable('profile', 0, 0, [col('id', 'BIGINT', { primaryKey: true }), col('user_id', 'BIGINT', { notNull: true })]);
    const link = newTable('order', 0, 0, [col('a', 'INTEGER', { primaryKey: true }), col('b', 'INTEGER', { primaryKey: true })]);
    link.checks.push('a <> b');
    const { sql, errors } = generateDdl({
      tables: [user, profile, link],
      relationships: [fk(user, 'manager_id', user, 'id', { onDelete: 'SET NULL' }), fk(profile, 'user_id', user, 'id', { kind: 'one-to-one', onDelete: 'CASCADE' })],
    });
    expect(errors).toEqual([]);
    expect(sql).toContain('CREATE TABLE "user"');
    expect(sql).toContain('REFERENCES "user" (id) ON DELETE SET NULL');
    expect(sql).not.toMatch(/ALTER TABLE/);
    expect(sql).toContain('user_id BIGINT UNIQUE NOT NULL');
    expect(sql).toContain('ON DELETE CASCADE');
    expect(sql).toContain('CREATE TABLE "order" (\n    a INTEGER,\n    b INTEGER,\n    PRIMARY KEY (a, b),\n    CHECK (a <> b)\n);');
  });

  it('reports invalid schemas instead of generating SQL', () => {
    expect(validateSchema({ tables: [], relationships: [] })).toEqual(['Add a table to generate CREATE TABLE statements.']);
    const t = newTable('t', 0, 0, [col('id', 'INTEGER', { primaryKey: true }), col('id', 'TEXT'), col('n', 'TEXT', { identity: true }), col('d', 'DATE', { default: { kind: 'literal', value: 'soon' } })]);
    const res = generateDdl({ tables: [t, newTable('t')], relationships: [] });
    expect(res.sql).toBe('');
    expect(res.errors.join('\n')).toMatch(/two columns named "id"/);
    expect(res.errors.join('\n')).toMatch(/identity columns must be INTEGER or BIGINT/);
    expect(res.errors.join('\n')).toMatch(/not a date/);
    expect(res.errors.join('\n')).toMatch(/Two tables are named "t"/);
    expect(res.errors.join('\n')).toMatch(/has no columns/);
  });

  it('rejects foreign keys to non-unique columns, mismatched types and SET NULL on NOT NULL', () => {
    const p = newTable('p', 0, 0, [col('id', 'BIGINT', { primaryKey: true }), col('code', 'TEXT')]);
    const c = newTable('c', 0, 0, [col('id', 'BIGINT', { primaryKey: true }), col('p_code', 'TEXT'), col('p_id', 'TEXT'), col('p_ref', 'BIGINT', { notNull: true })]);
    const errors = validateSchema({
      tables: [p, c],
      relationships: [fk(c, 'p_code', p, 'code'), fk(c, 'p_id', p, 'id'), fk(c, 'p_ref', p, 'id', { onDelete: 'SET NULL' })],
    }).join('\n');
    expect(errors).toMatch(/must be the primary key or UNIQUE/);
    expect(errors).toMatch(/types don't match/);
    expect(errors).toMatch(/SET NULL needs a nullable column/);
  });
});

describe('SELECT generation', () => {
  it('builds a join with aggregates, grouping, HAVING, sorting and paging', () => {
    const { users, orders, schema } = shop();
    const u = src(users, 's1', 'u');
    const o = src(orders, 's2', 'o', { join: 'LEFT', on: suggestJoinConditions(schema, [u], orders) });
    const having = emptyGroup();
    having.children.push({ id: 'h1', kind: 'cond', target: { kind: 'aggregate', fn: 'COUNT', ref: { sourceId: 's2', columnId: cid(orders, 'id') } }, op: '>=', values: ['3'] });
    const q: Query = {
      ...emptyQuery(),
      sources: [u, o],
      select: [
        { id: 'a', kind: 'column', ref: { sourceId: 's1', columnId: cid(users, 'name') }, alias: '' },
        { id: 'b', kind: 'aggregate', fn: 'COUNT', ref: { sourceId: 's2', columnId: cid(orders, 'id') }, alias: 'order count' },
      ],
      groupBy: [{ sourceId: 's1', columnId: cid(users, 'id') }],
      having,
      orderBy: [{ id: 'o1', target: { kind: 'select', selectId: 'b' }, dir: 'DESC' }],
      limit: '10',
      offset: '20',
    };
    const { sql, errors } = generateQuery(schema, q);
    expect(errors).toEqual([]);
    expect(sql).toBe(
      'SELECT\n    u.name,\n    COUNT(o.id) AS "order count"\nFROM users AS u\nLEFT JOIN orders AS o\n    ON o.user_id = u.id\nGROUP BY\n    u.id\nHAVING COUNT(o.id) >= 3\nORDER BY\n    "order count" DESC\nLIMIT 10\nOFFSET 20;\n',
    );
    expect(explainQuery(schema, q).join(' ')).toMatch(/at most 10 rows, after skipping the first 20/);
  });

  it('writes nested AND/OR groups and every operator form', () => {
    const { users, schema } = shop();
    const ref = (name: string) => ({ kind: 'column' as const, ref: { sourceId: 's', columnId: cid(users, name) } });
    const where = emptyGroup('AND');
    const inner = emptyGroup('OR');
    inner.children.push({ id: 'c3', kind: 'cond', target: ref('name'), op: 'ILIKE', values: ['%ann%'] }, { id: 'c4', kind: 'cond', target: ref('email'), op: 'IS NULL', values: [] });
    where.children.push(
      { id: 'c1', kind: 'cond', target: ref('id'), op: 'IN', values: ['1', '2', '3'] },
      { id: 'c2', kind: 'cond', target: ref('created_at'), op: 'BETWEEN', values: ['2026-01-01', '2026-02-01'] },
      inner,
    );
    const { sql, errors } = generateQuery(schema, { ...emptyQuery(), distinct: true, sources: [src(users, 's')], select: [{ id: 'x', kind: 'all', sourceId: null }], where });
    expect(errors).toEqual([]);
    expect(sql).toBe(
      "SELECT DISTINCT\n    *\nFROM users\nWHERE id IN (1, 2, 3)\n    AND created_at BETWEEN TIMESTAMPTZ '2026-01-01' AND TIMESTAMPTZ '2026-02-01'\n    AND (name ILIKE '%ann%' OR email IS NULL);\n",
    );
  });

  it('reports incomplete or invalid configurations instead of SQL', () => {
    const { users, orders, schema } = shop();
    const base = { ...emptyQuery(), sources: [src(users, 's1'), src(orders, 's2')] };
    const errs = (q: Query) => generateQuery(schema, q).errors.join('\n');
    expect(generateQuery(schema, emptyQuery()).errors).toEqual(['Choose a table to query.']);
    expect(errs(base)).toMatch(/Add a join condition/);
    expect(errs({ ...emptyQuery(), sources: [src(users, 's1')] })).toMatch(/Choose at least one column/);

    const one = { ...emptyQuery(), sources: [src(users, 's1')] };
    const name = { id: 'n', kind: 'column' as const, ref: { sourceId: 's1', columnId: cid(users, 'name') }, alias: '' };
    const count = { id: 'c', kind: 'aggregate' as const, fn: 'COUNT' as const, ref: null, alias: '' };
    expect(errs({ ...one, select: [name, count] })).toMatch(/must be in GROUP BY/);
    expect(errs({ ...one, select: [{ id: 's', kind: 'aggregate', fn: 'SUM', ref: name.ref, alias: '' }] })).toMatch(/SUM\(name\) needs a numeric column/);
    expect(errs({ ...one, select: [name], limit: '-1' })).toMatch(/LIMIT must be a whole number/);

    const where = emptyGroup();
    where.children.push({ id: 'w', kind: 'cond', target: { kind: 'column', ref: { sourceId: 's1', columnId: cid(users, 'id') } }, op: '=', values: ["1 OR 1=1"] });
    expect(errs({ ...one, select: [name], where })).toMatch(/not a whole number/);
    const between = emptyGroup();
    between.children.push({ id: 'w', kind: 'cond', target: { kind: 'column', ref: { sourceId: 's1', columnId: cid(users, 'id') } }, op: 'BETWEEN', values: ['1'] });
    expect(errs({ ...one, select: [name], where: between })).toMatch(/BETWEEN on id needs two values/);
    const like = emptyGroup();
    like.children.push({ id: 'w', kind: 'cond', target: { kind: 'column', ref: { sourceId: 's1', columnId: cid(users, 'id') } }, op: 'LIKE', values: ['1%'] });
    expect(errs({ ...one, select: [name], where: like })).toMatch(/LIKE needs a text column/);
    expect(errs({ ...one, distinct: true, select: [name], orderBy: [{ id: 'o', target: { kind: 'column', ref: { sourceId: 's1', columnId: cid(users, 'email') } }, dir: 'ASC' }] })).toMatch(
      /With DISTINCT, ORDER BY email must also be selected/,
    );
    expect(errs({ ...emptyQuery(), sources: [src(users, 's1', 'x'), src(orders, 's2', 'x', { on: [{ id: 'j', left: { sourceId: 's1', columnId: cid(users, 'id') }, rightColumnId: cid(orders, 'user_id') }] })], select: [name] })).toMatch(/used twice/);
  });

  it('suggests join conditions only from defined relationships', () => {
    const { users, orders } = shop();
    const noRel: Schema = { tables: [users, orders], relationships: [] };
    expect(suggestJoinConditions(noRel, [src(users, 's1')], orders)).toEqual([]);
  });
});

describe('samples, import and helpers', () => {
  it('every sample generates DDL and its starter query without errors', () => {
    for (const s of SAMPLES) {
      const { schema, query } = s.build();
      expect(generateDdl(schema).errors, s.id).toEqual([]);
      expect(generateQuery(schema, query).errors, s.id).toEqual([]);
    }
  });

  it('round-trips a project through JSON and rejects untrusted input', () => {
    const p = SAMPLES[0].build();
    const back = importProject(exportProject(p));
    expect(back.ok && generateQuery(back.project.schema, back.project.query).sql).toBe(generateQuery(p.schema, p.query).sql);
    expect(importProject('not json')).toEqual({ ok: false, error: 'The file is not valid JSON.' });
    expect(importProject('{"format":"other"}').ok).toBe(false);
    const evil = JSON.parse(exportProject(p));
    evil.schema.tables[0].columns[0].type = 'TEXT); DROP TABLE x; --';
    expect(importProject(JSON.stringify(evil))).toEqual({ ok: false, error: 'A column type has an unknown value.' });
    evil.schema.tables[0].columns[0].type = 'TEXT';
    evil.schema.tables[0].id = '../../etc';
    expect(importProject(JSON.stringify(evil)).ok).toBe(false);
  });

  it('creates junction tables and prunes references to removed columns', () => {
    const { users, orders, schema } = shop();
    const j = junctionTable(schema, users.id, orders.id);
    expect('table' in j && j.table.columns.map((c) => `${c.name}:${c.type}:${c.primaryKey}`)).toEqual(['users_id:BIGINT:true', 'orders_id:BIGINT:true']);
    if ('table' in j) expect(generateDdl({ tables: [...schema.tables, j.table], relationships: [...schema.relationships, ...j.relationships] }).errors).toEqual([]);
    const withoutUserId = { ...schema, tables: schema.tables.map((t) => (t.id === orders.id ? { ...t, columns: t.columns.filter((c) => c.name !== 'user_id') } : t)) };
    expect(pruneProject({ schema: withoutUserId, query: emptyQuery() }).schema.relationships).toEqual([]);

    // Query parts that used the removed column go too, so the query stays editable.
    const u = src(users, 'su', 'u');
    const o = src(orders, 'so', 'o', { on: [{ id: 'j1', left: { sourceId: 'su', columnId: cid(users, 'id') }, rightColumnId: cid(orders, 'user_id') }] });
    const userIdRef = { sourceId: 'so', columnId: cid(orders, 'user_id') };
    const query = {
      ...emptyQuery(),
      sources: [u, o],
      select: [
        { id: 'i1', kind: 'column' as const, ref: userIdRef, alias: '' },
        { id: 'i2', kind: 'column' as const, ref: { sourceId: 'su', columnId: cid(users, 'name') }, alias: '' },
      ],
      groupBy: [userIdRef],
      orderBy: [{ id: 'o1', target: { kind: 'select' as const, selectId: 'i1' }, dir: 'ASC' as const }],
    };
    query.where.children.push({ id: 'w1', kind: 'cond', target: { kind: 'column', ref: userIdRef }, op: 'IS NULL', values: [] });
    const pruned = pruneProject({ schema: withoutUserId, query }).query;
    expect([pruned.sources[1].on, pruned.select.map((i) => i.id), pruned.groupBy, pruned.orderBy, pruned.where.children]).toEqual([[], ['i2'], [], [], []]);
  });
});
