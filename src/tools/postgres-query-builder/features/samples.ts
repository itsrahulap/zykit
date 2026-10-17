// Ready-made example schemas with a starter query each. Fresh ids every time one is loaded.

import { emptyGroup, emptyQuery, newColumn as col, newId, newTable, type Column, type OnDelete, type Project, type Relationship, type RelationshipKind, type Table } from './model';

const id = (extra: Partial<Column> = {}) => col('id', 'BIGINT', { primaryKey: true, identity: true, ...extra });
const createdAt = () => col('created_at', 'TIMESTAMPTZ', { notNull: true, default: { kind: 'expression', value: 'CURRENT_TIMESTAMP' } });
const fk = (name: string, notNull = true) => col(name, 'BIGINT', { notNull });
const varchar = (name: string, length = 255, extra: Partial<Column> = {}) => col(name, 'VARCHAR', { length, notNull: true, ...extra });

function rel(child: Table, childCol: string, parent: Table, onDelete: OnDelete = 'NO ACTION', kind: RelationshipKind = 'one-to-many'): Relationship {
  return {
    id: newId('r'),
    fromTableId: child.id,
    fromColumnId: child.columns.find((c) => c.name === childCol)!.id,
    toTableId: parent.id,
    toColumnId: parent.columns.find((c) => c.primaryKey)!.id,
    kind,
    onDelete,
  };
}
const c = (t: Table, name: string) => t.columns.find((x) => x.name === name)!.id;

function ecommerce(): Project {
  const users = newTable('users', 40, 40, [id(), varchar('name'), varchar('email', 255, { unique: true }), createdAt()]);
  const products = newTable('products', 40, 300, [
    id(),
    varchar('name'),
    col('price', 'NUMERIC', { precision: 10, scale: 2, notNull: true, check: 'price >= 0' }),
    col('stock', 'INTEGER', { notNull: true, default: { kind: 'literal', value: '0' } }),
  ]);
  const orders = newTable('orders', 380, 40, [id(), fk('user_id'), varchar('status', 20, { default: { kind: 'literal', value: 'pending' } }), createdAt()]);
  const items = newTable('order_items', 380, 300, [
    col('order_id', 'BIGINT', { primaryKey: true }),
    col('product_id', 'BIGINT', { primaryKey: true }),
    col('quantity', 'INTEGER', { notNull: true, check: 'quantity > 0' }),
    col('unit_price', 'NUMERIC', { precision: 10, scale: 2, notNull: true }),
  ]);
  const schema = {
    tables: [users, products, orders, items],
    relationships: [rel(orders, 'user_id', users), rel(items, 'order_id', orders, 'CASCADE'), rel(items, 'product_id', products)],
  };
  const u = { id: newId('s'), tableId: users.id, alias: 'u', join: 'INNER' as const, on: [] };
  const o = { id: newId('s'), tableId: orders.id, alias: 'o', join: 'LEFT' as const, on: [{ id: newId('j'), left: { sourceId: u.id, columnId: c(users, 'id') }, rightColumnId: c(orders, 'user_id') }] };
  const count = { id: newId('i'), kind: 'aggregate' as const, fn: 'COUNT' as const, ref: { sourceId: o.id, columnId: c(orders, 'id') }, alias: 'order_count' };
  return {
    schema,
    query: {
      ...emptyQuery(),
      sources: [u, o],
      select: [{ id: newId('i'), kind: 'column', ref: { sourceId: u.id, columnId: c(users, 'name') }, alias: '' }, count],
      groupBy: [{ sourceId: u.id, columnId: c(users, 'id') }],
      orderBy: [{ id: newId('o'), target: { kind: 'select', selectId: count.id }, dir: 'DESC' }],
      limit: '10',
    },
  };
}

function blog(): Project {
  const users = newTable('users', 40, 40, [id(), varchar('username', 50, { unique: true }), varchar('email', 255, { unique: true }), createdAt()]);
  const categories = newTable('categories', 40, 300, [id(), varchar('name', 100, { unique: true })]);
  const posts = newTable('posts', 380, 40, [
    id(),
    fk('author_id'),
    fk('category_id', false),
    varchar('title', 200),
    col('body', 'TEXT', { notNull: true }),
    col('published', 'BOOLEAN', { notNull: true, default: { kind: 'literal', value: 'false' } }),
    col('published_at', 'TIMESTAMPTZ'),
  ]);
  const comments = newTable('comments', 720, 40, [id(), fk('post_id'), fk('author_id'), col('body', 'TEXT', { notNull: true }), createdAt()]);
  const schema = {
    tables: [users, categories, posts, comments],
    relationships: [rel(posts, 'author_id', users), rel(posts, 'category_id', categories, 'SET NULL'), rel(comments, 'post_id', posts, 'CASCADE'), rel(comments, 'author_id', users)],
  };
  const p = { id: newId('s'), tableId: posts.id, alias: 'p', join: 'INNER' as const, on: [] };
  const u = { id: newId('s'), tableId: users.id, alias: 'u', join: 'INNER' as const, on: [{ id: newId('j'), left: { sourceId: p.id, columnId: c(posts, 'author_id') }, rightColumnId: c(users, 'id') }] };
  const where = emptyGroup();
  where.children.push({ id: newId('w'), kind: 'cond', target: { kind: 'column', ref: { sourceId: p.id, columnId: c(posts, 'published') } }, op: '=', values: ['true'] });
  return {
    schema,
    query: {
      ...emptyQuery(),
      sources: [p, u],
      select: [
        { id: newId('i'), kind: 'column', ref: { sourceId: p.id, columnId: c(posts, 'title') }, alias: '' },
        { id: newId('i'), kind: 'column', ref: { sourceId: u.id, columnId: c(users, 'username') }, alias: 'author' },
        { id: newId('i'), kind: 'column', ref: { sourceId: p.id, columnId: c(posts, 'published_at') }, alias: '' },
      ],
      where,
      orderBy: [{ id: newId('o'), target: { kind: 'column', ref: { sourceId: p.id, columnId: c(posts, 'published_at') } }, dir: 'DESC' }],
      limit: '20',
    },
  };
}

function clinic(): Project {
  const patients = newTable('patients', 40, 40, [id(), varchar('full_name', 200), col('date_of_birth', 'DATE', { notNull: true }), col('phone', 'VARCHAR', { length: 30 })]);
  const doctors = newTable('doctors', 40, 300, [id(), varchar('full_name', 200), varchar('specialty', 100)]);
  const appointments = newTable('appointments', 380, 120, [
    id(),
    fk('patient_id'),
    fk('doctor_id'),
    col('starts_at', 'TIMESTAMPTZ', { notNull: true }),
    varchar('status', 20, { default: { kind: 'literal', value: 'scheduled' } }),
  ]);
  appointments.checks.push("status IN ('scheduled', 'completed', 'cancelled')");
  const schema = { tables: [patients, doctors, appointments], relationships: [rel(appointments, 'patient_id', patients), rel(appointments, 'doctor_id', doctors)] };
  const a = { id: newId('s'), tableId: appointments.id, alias: 'a', join: 'INNER' as const, on: [] };
  const p = { id: newId('s'), tableId: patients.id, alias: 'p', join: 'INNER' as const, on: [{ id: newId('j'), left: { sourceId: a.id, columnId: c(appointments, 'patient_id') }, rightColumnId: c(patients, 'id') }] };
  const d = { id: newId('s'), tableId: doctors.id, alias: 'd', join: 'INNER' as const, on: [{ id: newId('j'), left: { sourceId: a.id, columnId: c(appointments, 'doctor_id') }, rightColumnId: c(doctors, 'id') }] };
  const where = emptyGroup();
  where.children.push({
    id: newId('w'),
    kind: 'cond',
    target: { kind: 'column', ref: { sourceId: a.id, columnId: c(appointments, 'starts_at') } },
    op: 'BETWEEN',
    values: ['2026-01-01 00:00', '2026-01-31 23:59'],
  });
  return {
    schema,
    query: {
      ...emptyQuery(),
      sources: [a, p, d],
      select: [
        { id: newId('i'), kind: 'column', ref: { sourceId: a.id, columnId: c(appointments, 'starts_at') }, alias: '' },
        { id: newId('i'), kind: 'column', ref: { sourceId: p.id, columnId: c(patients, 'full_name') }, alias: 'patient' },
        { id: newId('i'), kind: 'column', ref: { sourceId: d.id, columnId: c(doctors, 'full_name') }, alias: 'doctor' },
      ],
      where,
      orderBy: [{ id: newId('o'), target: { kind: 'column', ref: { sourceId: a.id, columnId: c(appointments, 'starts_at') } }, dir: 'ASC' }],
    },
  };
}

function projects(): Project {
  const users = newTable('users', 40, 40, [id(), varchar('name'), varchar('email', 255, { unique: true })]);
  const proj = newTable('projects', 380, 40, [id(), fk('owner_id'), varchar('name', 150), createdAt()]);
  const tasks = newTable('tasks', 380, 300, [
    col('id', 'UUID', { primaryKey: true, default: { kind: 'expression', value: 'gen_random_uuid()' } }),
    fk('project_id'),
    fk('assignee_id', false),
    varchar('title', 200),
    col('done', 'BOOLEAN', { notNull: true, default: { kind: 'literal', value: 'false' } }),
    col('due_date', 'DATE'),
  ]);
  const schema = {
    tables: [users, proj, tasks],
    relationships: [rel(proj, 'owner_id', users), rel(tasks, 'project_id', proj, 'CASCADE'), rel(tasks, 'assignee_id', users, 'SET NULL')],
  };
  const p = { id: newId('s'), tableId: proj.id, alias: 'p', join: 'INNER' as const, on: [] };
  const t = { id: newId('s'), tableId: tasks.id, alias: 't', join: 'INNER' as const, on: [{ id: newId('j'), left: { sourceId: p.id, columnId: c(proj, 'id') }, rightColumnId: c(tasks, 'project_id') }] };
  const where = emptyGroup();
  where.children.push({ id: newId('w'), kind: 'cond', target: { kind: 'column', ref: { sourceId: t.id, columnId: c(tasks, 'done') } }, op: '=', values: ['false'] });
  const open = { id: newId('i'), kind: 'aggregate' as const, fn: 'COUNT' as const, ref: null, alias: 'open_tasks' };
  return {
    schema,
    query: {
      ...emptyQuery(),
      sources: [p, t],
      select: [{ id: newId('i'), kind: 'column', ref: { sourceId: p.id, columnId: c(proj, 'name') }, alias: 'project' }, open],
      where,
      groupBy: [{ sourceId: p.id, columnId: c(proj, 'id') }],
      orderBy: [{ id: newId('o'), target: { kind: 'select', selectId: open.id }, dir: 'DESC' }],
    },
  };
}

export const SAMPLES = [
  { id: 'ecommerce', label: 'E-commerce (users, products, orders, order items)', build: ecommerce },
  { id: 'blog', label: 'Blog (users, posts, comments, categories)', build: blog },
  { id: 'clinic', label: 'Clinic (patients, doctors, appointments)', build: clinic },
  { id: 'projects', label: 'Project management (users, projects, tasks)', build: projects },
] as const;
