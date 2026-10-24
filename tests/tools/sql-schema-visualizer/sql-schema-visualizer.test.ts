import { describe, expect, it } from 'vitest';
import { diagramToSvg, layoutDiagram, toMermaid } from '../../../src/tools/sql-schema-visualizer/features/diagram';
import { MAX_INPUT_CHARS, parseSchema, suggestRelationships, tableLabel } from '../../../src/tools/sql-schema-visualizer/features/parser';
import { mapType, toQueryBuilderProject } from '../../../src/tools/sql-schema-visualizer/features/queryBuilder';
import { importProject } from '../../../src/tools/postgres-query-builder/features/project';

const table = (s: ReturnType<typeof parseSchema>, name: string) => s.tables.find((t) => tableLabel(t) === name)!;

describe('parseSchema', () => {
  it('reads common DDL: types, column constraints and inline references', () => {
    const s = parseSchema(`
      CREATE TABLE IF NOT EXISTS users (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        email character varying(255) NOT NULL UNIQUE,
        price numeric(10, 2) DEFAULT 0 CHECK (price >= 0),
        tags text[],
        created timestamp with time zone NOT NULL DEFAULT now()
      );
      CREATE TABLE posts (id serial PRIMARY KEY, author_id bigint REFERENCES users ON DELETE CASCADE);`);
    expect(s.error).toBeUndefined();
    expect(s.issues).toEqual([]);
    const users = table(s, 'users');
    expect(users.columns.map((c) => [c.name, c.type])).toEqual([
      ['id', 'bigint'],
      ['email', 'character varying(255)'],
      ['price', 'numeric(10, 2)'],
      ['tags', 'text[]'],
      ['created', 'timestamp with time zone'],
    ]);
    expect(users.columns[0]).toMatchObject({ primaryKey: true, identity: true, notNull: true });
    expect(users.columns[1]).toMatchObject({ notNull: true, unique: true });
    expect(users.columns[2]).toMatchObject({ default: '0', check: 'price >= 0' });
    expect(users.columns[4].default).toBe('now()');
    expect(s.foreignKeys).toEqual([expect.objectContaining({ fromColumns: ['author_id'], toTable: users.id, toColumns: ['id'], onDelete: 'cascade' })]);
  });

  it('handles quoted and schema-qualified identifiers', () => {
    const s = parseSchema(`CREATE TABLE app."Order Items" ("Line ""No""" int PRIMARY KEY, Note TEXT);
      CREATE TABLE app.refs (id int, item int REFERENCES app."Order Items" ("Line ""No"""));`);
    const t = table(s, 'app.Order Items');
    expect(t.schema).toBe('app');
    expect(t.columns.map((c) => c.name)).toEqual(['Line "No"', 'note']);
    expect(s.foreignKeys[0].toColumns).toEqual(['Line "No"']);
  });

  it('reads composite primary and foreign keys with constraint names', () => {
    const s = parseSchema(`
      CREATE TABLE a (x int, y int, CONSTRAINT a_pk PRIMARY KEY (x, y));
      CREATE TABLE b (x int, y int, CONSTRAINT b_a_fk FOREIGN KEY (x, y) REFERENCES a (x, y) ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED, UNIQUE (x, y));`);
    expect(s.issues).toEqual([]);
    expect(table(s, 'a').primaryKey).toEqual(['x', 'y']);
    expect(table(s, 'b').uniques).toEqual([['x', 'y']]);
    expect(s.foreignKeys).toEqual([expect.objectContaining({ name: 'b_a_fk', fromColumns: ['x', 'y'], toColumns: ['x', 'y'] })]);
  });

  it('parses multiple statements, ALTER TABLE foreign keys and CREATE INDEX', () => {
    const s = parseSchema(`CREATE TABLE p (id int);
CREATE TABLE c (id int, p_id int);
ALTER TABLE ONLY p ADD CONSTRAINT p_pkey PRIMARY KEY (id);
ALTER TABLE c ADD FOREIGN KEY (p_id) REFERENCES p, ADD COLUMN note text NOT NULL;
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS c_idx ON c USING btree (p_id DESC, lower(note));`);
    expect(s.issues).toEqual([]);
    expect(table(s, 'p').primaryKey).toEqual(['id']);
    expect(table(s, 'c').columns.map((c) => c.name)).toEqual(['id', 'p_id', 'note']);
    expect(s.foreignKeys).toEqual([expect.objectContaining({ fromColumns: ['p_id'], toColumns: ['id'] })]);
    expect(table(s, 'c').indexes).toEqual([{ name: 'c_idx', unique: true, columns: ['p_id', 'lower(note)'] }]);
  });

  it('ignores semicolons inside comments, strings and dollar quotes', () => {
    const s = parseSchema(`-- a comment; CREATE TABLE nope (x int);
/* block; /* nested; */ still comment */
CREATE TABLE t (
  a text DEFAULT 'x; y''s',
  b text DEFAULT E'it\\'s; ok',
  c text DEFAULT $tag$ ; $$ ; $tag$
);`);
    expect(s.issues).toEqual([]);
    expect(s.tables.map((t) => t.name)).toEqual(['t']);
    expect(s.tables[0].columns.map((c) => c.default)).toEqual(["'x; y''s'", "E'it\\'s; ok'", '$tag$ ; $$ ; $tag$']);
  });

  it('reports unsupported statements and options with line numbers instead of guessing', () => {
    const s = parseSchema(`CREATE EXTENSION pgcrypto;
CREATE TABLE t (
  id int PRIMARY KEY,
  r int4range,
  EXCLUDE USING gist (r WITH &&)
);
ALTER TABLE t DROP COLUMN r;
CREATE VIEW v AS SELECT 1;`);
    expect(s.issues.map((i) => [i.line, i.message.split(' ').slice(0, 3).join(' ')])).toEqual([
      [1, "CREATE EXTENSION isn't"],
      [5, "EXCLUDE isn't supported"],
      [7, 'ALTER TABLE …'],
      [8, "CREATE VIEW isn't"],
    ]);
    expect(table(s, 't').columns.map((c) => c.name)).toEqual(['id', 'r']);
  });

  it('reports a foreign key to an unknown table and draws nothing', () => {
    const s = parseSchema('CREATE TABLE a (\n  b_id int REFERENCES b (id)\n);');
    expect(s.foreignKeys).toEqual([]);
    expect(s.issues).toEqual([expect.objectContaining({ line: 2, message: expect.stringContaining('"b"') })]);
  });

  it('fails with a position on unterminated strings and caps the input', () => {
    expect(parseSchema("CREATE TABLE t (\n a text DEFAULT 'oops\n);").error).toMatchObject({ line: 2, column: 17 });
    expect(parseSchema('x'.repeat(MAX_INPUT_CHARS + 1)).error?.message).toMatch(/longer than/);
  });

  it('labels name-based suggestions separately from foreign keys', () => {
    const s = parseSchema('CREATE TABLE categories (id int PRIMARY KEY); CREATE TABLE items (id int PRIMARY KEY, category_id int, owner_id int);');
    expect(s.foreignKeys).toEqual([]);
    expect(suggestRelationships(s)).toEqual([{ fromTable: table(s, 'items').id, fromColumn: 'category_id', toTable: table(s, 'categories').id, toColumn: 'id' }]);
  });
});

describe('diagram', () => {
  it('lays out tables without overlapping boxes, parents left of children', () => {
    const ddl = Array.from({ length: 30 }, (_, i) => `CREATE TABLE t${i} (id int PRIMARY KEY${i ? `, parent_id int REFERENCES t${Math.floor(i / 3)}` : ''}, a_rather_long_column_name varchar(200));`).join('\n');
    const s = parseSchema(ddl);
    const d = layoutDiagram(s);
    expect(d.tables).toHaveLength(30);
    for (const a of d.tables)
      for (const b of d.tables) {
        if (a === b) continue;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${a.label} overlaps ${b.label}`).toBe(false);
      }
    const pos = new Map(d.tables.map((t) => [t.table.id, t]));
    for (const fk of s.foreignKeys) expect(pos.get(fk.toTable)!.x).toBeLessThan(pos.get(fk.fromTable)!.x);
    expect(d.edges).toHaveLength(29);
  });

  it('survives foreign key cycles and self references', () => {
    const s = parseSchema('CREATE TABLE a (id int PRIMARY KEY, b_id int, parent int REFERENCES a); CREATE TABLE b (id int PRIMARY KEY, a_id int REFERENCES a); ALTER TABLE a ADD FOREIGN KEY (b_id) REFERENCES b;');
    const d = layoutDiagram(s);
    expect(d.tables).toHaveLength(2);
    expect(d.edges).toHaveLength(3);
  });

  it('escapes user text in the SVG export', () => {
    const svg = diagramToSvg(layoutDiagram(parseSchema('CREATE TABLE "<script>&" ("a""<b>" int);'))).text;
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;&amp;');
    expect(svg).toContain('a&quot;&lt;b&gt;');
  });
});

describe('toMermaid', () => {
  it('writes entities, keys and relationships', () => {
    const s = parseSchema('CREATE TABLE users (id int PRIMARY KEY, email text UNIQUE); CREATE TABLE posts (id int PRIMARY KEY, user_id int NOT NULL, CONSTRAINT posts_user FOREIGN KEY (user_id) REFERENCES users (id));');
    expect(toMermaid(s).text).toBe(`erDiagram
  users {
    int id PK
    text email UK
  }
  posts {
    int id PK
    int user_id FK
  }
  users ||--o{ posts : "posts_user"
`);
  });

  it('escapes names that Mermaid does not allow and keeps types valid', () => {
    const s = parseSchema('CREATE TABLE "my table" ("first name" varchar(10), "1st" numeric(10, 2), "say ""hi""" timestamp with time zone); CREATE TABLE my_table (id int);');
    const m = toMermaid(s);
    expect(m.text).toContain('  my_table {');
    expect(m.text).toContain('  my_table_2 {');
    expect(m.text).toContain('    varchar(10) first_name "first name"');
    expect(m.text).toContain('    numeric(10__2) _1st "1st"');
    expect(m.text).toContain('    timestamp_with_time_zone say__hi_ "say #quot;hi#quot;"');
    expect(m.renamed).toBe(5);
    for (const line of m.text.split('\n').filter((l) => l.startsWith('    '))) expect(line).toMatch(/^ {4}[A-Za-z_][\w()[\]-]* [A-Za-z_][\w-]*( (PK|FK|UK)(, (PK|FK|UK))*)?( "[^"]*")?$/);
  });
});

describe('Query Builder hand-off', () => {
  it('produces a project the Query Builder imports, with notes for lossy parts', () => {
    const s = parseSchema(`CREATE TABLE users (id bigint PRIMARY KEY, name varchar(80) NOT NULL DEFAULT 'anon', score real, made timestamptz DEFAULT now());
      CREATE TABLE pairs (a bigint, b bigint, PRIMARY KEY (a, b), FOREIGN KEY (a) REFERENCES users);
      CREATE TABLE multi (x int, y int, FOREIGN KEY (x, y) REFERENCES pairs (a, b));`);
    const res = toQueryBuilderProject(s);
    if (!res.ok) throw new Error(res.error);
    const imported = importProject(res.json);
    expect(imported.ok).toBe(true);
    const users = res.project.schema.tables.find((t) => t.name === 'users')!;
    expect(users.columns.map((c) => [c.name, c.type])).toEqual([
      ['id', 'BIGINT'],
      ['name', 'VARCHAR'],
      ['score', 'TEXT'],
      ['made', 'TIMESTAMPTZ'],
    ]);
    expect(users.columns[1]).toMatchObject({ length: 80, default: { kind: 'literal', value: 'anon' } });
    expect(users.columns[3].default).toEqual({ kind: 'expression', value: 'now()' });
    expect(res.project.schema.relationships).toHaveLength(1);
    expect(res.notes.join(' ')).toMatch(/score: real → TEXT/);
    expect(res.notes.join(' ')).toMatch(/composite foreign key multi\(x, y\)/);
  });

  it('maps type spellings', () => {
    expect(mapType('numeric(12, 4)')).toEqual({ type: 'NUMERIC', precision: 12, scale: 4, exact: true });
    expect(mapType('timestamp(3) with time zone')).toMatchObject({ type: 'TIMESTAMPTZ', exact: false });
    expect(mapType('int[]')).toMatchObject({ type: 'TEXT', exact: false });
  });
});
