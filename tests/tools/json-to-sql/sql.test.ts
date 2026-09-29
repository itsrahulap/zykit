import { describe, expect, it } from 'vitest';
import { parseJson } from '../../../src/tools/json-formatter/features/json';
import { generateSql, quoteIdent, quoteString, quoteTable, type Dialect, type SqlOptions } from '../../../src/tools/json-to-sql/features/sql';

const defaults: SqlOptions = { dialect: 'postgres', tableName: 'items', batchSize: 100, includeCreate: true, primaryKey: '' };
const ALL: Dialect[] = ['postgres', 'mysql', 'sqlite', 'sqlserver'];

function sql(json: string, options: Partial<SqlOptions> = {}) {
  const r = parseJson(json);
  if (!r.ok) throw new Error(r.error.message);
  const out = generateSql(r.value, { ...defaults, ...options });
  if (!out.ok) throw new Error(out.error);
  return out;
}

/**
 * Tokenises a string literal the way each engine does and returns its value, checking that the
 * literal ends exactly where expected (so nothing after it could be read as SQL).
 */
function readLiteral(lit: string, dialect: Dialect): string {
  let i = 0;
  let out = '';
  const readOne = () => {
    if (dialect === 'sqlserver') {
      expect(lit.slice(i, i + 2)).toBe("N'");
      i += 2;
    } else {
      expect(lit[i]).toBe("'");
      i++;
    }
    for (;;) {
      if (i >= lit.length) throw new Error(`unterminated: ${lit}`);
      const c = lit[i];
      if (dialect === 'mysql' && c === '\\') {
        const e = lit[i + 1];
        out += ({ '0': '\0', n: '\n', r: '\r', Z: '\x1a', '\\': '\\', "'": "'", '"': '"', t: '\t', b: '\b' } as Record<string, string>)[e] ?? e;
        i += 2;
      } else if (dialect === 'sqlserver' && c === '\\' && (lit[i + 1] === '\n' || lit.slice(i + 1, i + 3) === '\r\n')) {
        throw new Error('backslash-newline would be a line continuation in SQL Server');
      } else if (c === "'") {
        if (lit[i + 1] === "'") {
          out += "'";
          i += 2;
        } else {
          i++;
          return;
        }
      } else {
        out += c;
        i++;
      }
    }
  };
  readOne();
  for (;;) {
    const rest = lit.slice(i);
    if (!rest) return out;
    const joiner = dialect === 'sqlite' ? / \|\| (char\(0\) \|\| )?/y : / \+ (NCHAR\(0\) \+ )?/y;
    const m = joiner.exec(rest);
    if (!m) throw new Error(`unexpected tail: ${rest}`);
    if (m[1]) out += '\0';
    i += m[0].length;
    readOne();
  }
}

const NASTY = [
  "O'Reilly",
  "''",
  "'; DROP TABLE users; --",
  'back\\slash',
  'trailing\\',
  "\\'",
  'line\nbreak',
  'crlf\r\nend',
  'slash before newline\\\nnext',
  'tab\there',
  'nul\0byte',
  'ctrl-z\x1a',
  'unicode: Zürich 日本 😀',
  'quotes "double" `back` [bracket]',
  '  ',
  '',
];

describe('quoteString', () => {
  for (const dialect of ALL) {
    it(`round-trips hostile strings for ${dialect}`, () => {
      for (const s of NASTY) {
        const lit = quoteString(s, dialect);
        const expected = dialect === 'postgres' ? s.replace(/\0/g, '') : s;
        expect(readLiteral(lit, dialect), JSON.stringify(s)).toBe(expected);
      }
    });
  }

  it('uses dialect-specific forms', () => {
    expect(quoteString("it's", 'postgres')).toBe("'it''s'");
    expect(quoteString('a\\b', 'postgres')).toBe("'a\\b'");
    expect(quoteString("it's", 'mysql')).toBe("'it\\'s'");
    expect(quoteString('a\\b\n', 'mysql')).toBe("'a\\\\b\\n'");
    expect(quoteString('a\0b', 'mysql')).toBe("'a\\0b'");
    expect(quoteString('a\0b', 'sqlite')).toBe("'a' || char(0) || 'b'");
    expect(quoteString('é', 'sqlserver')).toBe("N'é'");
    expect(quoteString('a\0b', 'sqlserver')).toBe("N'a' + NCHAR(0) + N'b'");
    expect(quoteString('x\\\ny', 'sqlserver')).toBe("N'x\\' + N'\ny'");
  });

  it('reports dropped NULs for PostgreSQL', () => {
    let dropped = false;
    expect(quoteString('a\0b', 'postgres', () => (dropped = true))).toBe("'ab'");
    expect(dropped).toBe(true);
  });

  it('replaces lone surrogates', () => {
    expect(quoteString('a\ud800b', 'postgres')).toBe("'a�b'");
    expect(quoteString('😀', 'postgres')).toBe("'😀'");
  });
});

describe('identifiers', () => {
  it('quotes and doubles the quote character', () => {
    expect(quoteIdent('a"b', 'postgres')).toBe('"a""b"');
    expect(quoteIdent('a`b', 'mysql')).toBe('`a``b`');
    expect(quoteIdent('a]b', 'sqlserver')).toBe('[a]]b]');
    expect(quoteIdent('a"b', 'sqlite')).toBe('"a""b"');
    expect(quoteIdent('x"; DROP TABLE t; --', 'postgres')).toBe('"x""; DROP TABLE t; --"');
  });

  it('splits schema-qualified table names', () => {
    expect(quoteTable('public.users', 'postgres')).toBe('"public"."users"');
    expect(quoteTable('dbo.users', 'sqlserver')).toBe('[dbo].[users]');
    expect(quoteTable('a..b', 'postgres')).toBe('"a..b"');
  });
});

describe('generateSql', () => {
  const rows = '[{"id":1,"name":"Ann","active":true,"score":9.5,"at":"2024-05-01T10:00:00Z"},{"id":2,"name":null,"active":false,"score":7,"tags":["a"]}]';

  it('builds CREATE TABLE and a batched INSERT for PostgreSQL', () => {
    expect(sql(rows, { primaryKey: 'id' }).sql).toBe(
      [
        'CREATE TABLE "items" (',
        '  "id" INTEGER PRIMARY KEY,',
        '  "name" VARCHAR(16),',
        '  "active" BOOLEAN NOT NULL,',
        '  "score" NUMERIC(2, 1) NOT NULL,',
        '  "at" TIMESTAMPTZ,',
        '  "tags" JSONB',
        ');',
        '',
        'INSERT INTO "items" ("id", "name", "active", "score", "at", "tags") VALUES',
        "  (1, 'Ann', TRUE, 9.5, '2024-05-01T10:00:00Z', NULL),",
        '  (2, NULL, FALSE, 7, NULL, \'["a"]\');',
        '',
      ].join('\n'),
    );
  });

  it('adapts types and literals per dialect', () => {
    const my = sql(rows, { dialect: 'mysql' });
    expect(my.sql).toContain('`id` INT NOT NULL');
    expect(my.sql).toContain('`score` DECIMAL(2, 1) NOT NULL');
    expect(my.sql).toContain('`at` DATETIME');
    expect(my.sql).toContain("(1, 'Ann', TRUE, 9.5, '2024-05-01 10:00:00', NULL)");
    expect(my.warnings.join(' ')).toMatch(/converted to UTC/);

    const lite = sql(rows, { dialect: 'sqlite' });
    expect(lite.sql).toContain('"active" INTEGER NOT NULL');
    expect(lite.sql).toContain('"score" REAL NOT NULL');
    expect(lite.sql).toContain("(1, 'Ann', 1, 9.5, '2024-05-01T10:00:00Z', NULL)");

    const ms = sql(rows, { dialect: 'sqlserver' });
    expect(ms.sql).toContain('[active] BIT NOT NULL');
    expect(ms.sql).toContain('[at] DATETIMEOFFSET');
    expect(ms.sql).toContain('[tags] NVARCHAR(MAX)');
    expect(ms.sql).toContain("(1, N'Ann', 1, 9.5, N'2024-05-01T10:00:00Z', NULL)");
  });

  it('infers integer sizes and exact big numbers', () => {
    expect(sql('[{"n":2147483647}]').columns[0].sqlType).toBe('INTEGER');
    expect(sql('[{"n":2147483648}]').columns[0].sqlType).toBe('BIGINT');
    const big = sql('[{"n":123456789012345678901234567890}]');
    expect(big.columns[0].sqlType).toBe('NUMERIC(30, 0)');
    expect(big.sql).toContain('(123456789012345678901234567890)');
    expect(sql('[{"n":1e5}]').columns[0].sqlType).toBe('DOUBLE PRECISION');
  });

  it('infers dates, varchar sizes and text', () => {
    expect(sql('[{"d":"2024-01-31"}]').columns[0].sqlType).toBe('DATE');
    expect(sql('[{"d":"2024-01-31 10:00:00"}]').columns[0].sqlType).toBe('TIMESTAMP');
    expect(sql(`[{"s":"${'x'.repeat(40)}"}]`).columns[0].sqlType).toBe('VARCHAR(64)');
    expect(sql(`[{"s":"${'x'.repeat(300)}"}]`).columns[0].sqlType).toBe('TEXT');
    expect(sql(`[{"s":"${'x'.repeat(300)}"}]`, { dialect: 'sqlserver' }).columns[0].sqlType).toBe('NVARCHAR(MAX)');
    expect(sql('[{"s":null}]').columns[0].sqlType).toBe('TEXT');
  });

  it('stores mixed types as text', () => {
    const r = sql('[{"v":1},{"v":"a"},{"v":true}]');
    expect(r.columns[0].kind).toBe('mixed');
    expect(r.sql).toContain("('1'),\n  ('a'),\n  ('true');");
  });

  it('unions keys across rows and fills missing values with NULL', () => {
    const r = sql('[{"a":1},{"b":2}]', { includeCreate: false });
    expect(r.sql).toBe('INSERT INTO "items" ("a", "b") VALUES\n  (1, NULL),\n  (NULL, 2);\n');
  });

  it('batches rows per INSERT', () => {
    const r = sql('[{"a":1},{"a":2},{"a":3}]', { batchSize: 2, includeCreate: false });
    expect(r.statements).toBe(2);
    expect(sql('[{"a":1},{"a":2}]', { batchSize: 1, includeCreate: false }).sql).toBe(
      'INSERT INTO "items" ("a") VALUES (1);\n\nINSERT INTO "items" ("a") VALUES (2);\n',
    );
  });

  it('caps SQL Server batches at 1000 rows', () => {
    const many = JSON.stringify(Array.from({ length: 1500 }, (_, i) => ({ i })));
    const r = sql(many, { dialect: 'sqlserver', batchSize: 5000, includeCreate: false });
    expect(r.statements).toBe(2);
    expect(r.warnings.join(' ')).toMatch(/at most 1000/);
  });

  it('accepts a single object', () => {
    expect(sql('{"a":"x"}', { includeCreate: false }).sql).toBe('INSERT INTO "items" ("a") VALUES\n  (\'x\');\n');
  });

  it('escapes hostile keys, table names and values', () => {
    const r = sql('[{"a\\"b":"x\');DROP TABLE t;--"}]', { tableName: 'my"table' });
    expect(r.sql).toContain('CREATE TABLE "my""table"');
    expect(r.sql).toContain('"a""b"');
    expect(r.sql).toContain("('x'');DROP TABLE t;--')");
  });

  it('warns about bad primary keys and widens text keys', () => {
    expect(sql('[{"id":1},{"id":1}]', { primaryKey: 'id' }).warnings.join(' ')).toMatch(/duplicate/);
    expect(sql('[{"id":1},{}]', { primaryKey: 'id' }).warnings.join(' ')).toMatch(/missing or null/);
    expect(sql(`[{"k":"${'x'.repeat(300)}"}]`, { dialect: 'mysql', primaryKey: 'k' }).columns[0].sqlType).toBe('VARCHAR(768)');
  });

  it('rejects non-object rows', () => {
    const r = parseJson('[{"a":1}, 5]');
    if (!r.ok) throw new Error();
    expect(generateSql(r.value, defaults)).toEqual({ ok: false, error: 'Item 2 is a number, not an object.' });
    const s = parseJson('"x"');
    if (!s.ok) throw new Error();
    expect(generateSql(s.value, defaults).ok).toBe(false);
  });
});
