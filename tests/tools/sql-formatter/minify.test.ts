import { describe, expect, it } from 'vitest';
import { format } from 'sql-formatter';
import { minifySql, tokenizeSql } from '../../../src/tools/sql-formatter/features/minify';
import { describeFormatError } from '../../../src/tools/sql-formatter/features/options';

describe('tokenizeSql', () => {
  it('round-trips the input exactly', () => {
    const sql = "SELECT a, 'it''s' AS \"x y\" -- c\n/* b */ FROM `t` WHERE [n] = $$ a $$;";
    for (const dialect of ['sql', 'postgresql', 'mysql', 'transactsql']) {
      expect(tokenizeSql(sql, { dialect }).map((t) => t.text).join('')).toBe(sql);
    }
  });

  it('recognises strings with doubled quotes', () => {
    const t = tokenizeSql("'a''b' c");
    expect(t[0]).toEqual({ kind: 'string', text: "'a''b'" });
  });

  it('handles backslash escapes only where the dialect uses them', () => {
    expect(tokenizeSql("'a\\' b'", { dialect: 'mysql' })[0].text).toBe("'a\\' b'");
    expect(tokenizeSql("'a\\' b'", { dialect: 'postgresql' })[0].text).toBe("'a\\'");
    expect(tokenizeSql("E'a\\'b'", { dialect: 'postgresql' })[1].text).toBe("E'a\\'b'".slice(1));
  });

  it('reads dollar-quoted strings in PostgreSQL', () => {
    const t = tokenizeSql("$fn$ it's -- not a comment $fn$ x", { dialect: 'postgresql' });
    expect(t[0]).toEqual({ kind: 'string', text: "$fn$ it's -- not a comment $fn$" });
  });

  it('treats # as a comment only in MySQL-like dialects', () => {
    expect(tokenizeSql('# hi\nx', { dialect: 'mysql' })[0].kind).toBe('line-comment');
    expect(tokenizeSql('a #> b', { dialect: 'postgresql' }).some((t) => t.kind === 'line-comment')).toBe(false);
  });

  it('supports nested block comments in PostgreSQL', () => {
    const t = tokenizeSql('/* a /* b */ c */ x', { dialect: 'postgresql' });
    expect(t[0].text).toBe('/* a /* b */ c */');
    const flat = tokenizeSql('/* a /* b */ c */ x', { dialect: 'mysql' });
    expect(flat[0].text).toBe('/* a /* b */');
  });

  it('treats [..] as an identifier in SQL Server only', () => {
    expect(tokenizeSql('[my col]', { dialect: 'transactsql' })[0]).toEqual({ kind: 'quoted', text: '[my col]' });
    expect(tokenizeSql('a[1]', { dialect: 'postgresql' })[1]).toEqual({ kind: 'punct', text: '[' });
  });

  it('keeps unterminated strings to the end of input', () => {
    expect(tokenizeSql("x = 'abc")).toContainEqual({ kind: 'string', text: "'abc" });
  });
});

describe('minifySql', () => {
  it('collapses whitespace between tokens', () => {
    expect(minifySql('SELECT  a ,\n  b\nFROM   t\nWHERE a = 1 AND b <> 2 ;')).toBe('SELECT a,b FROM t WHERE a=1 AND b<>2;');
  });

  it('never touches whitespace inside strings or quoted identifiers', () => {
    const sql = "SELECT 'a   b\n c' AS \"my   col\", `x  y` FROM t";
    expect(minifySql(sql, { dialect: 'mysql' })).toBe("SELECT 'a   b\n c' AS \"my   col\",`x  y` FROM t");
  });

  it('keeps comments by default and ends line comments with a newline', () => {
    expect(minifySql('SELECT a -- note\n  FROM t /* x */ WHERE b')).toBe('SELECT a -- note\nFROM t /* x */ WHERE b');
  });

  it('strips comments on request but keeps optimizer hints', () => {
    expect(minifySql('SELECT /*+ INDEX(t i) */ a -- note\nFROM t /* x */ WHERE b', { stripComments: true })).toBe(
      'SELECT /*+ INDEX(t i) */ a FROM t WHERE b',
    );
    expect(minifySql('SELECT /*! STRAIGHT_JOIN */ a', { stripComments: true, dialect: 'mysql' })).toBe('SELECT /*! STRAIGHT_JOIN */ a');
  });

  it('does not glue words that were separated only by a comment', () => {
    expect(minifySql('SELECT a/**/FROM t', { stripComments: true })).toBe('SELECT a FROM t');
  });

  it('does not create comments or merged operators', () => {
    expect(minifySql('SELECT 1 - -1, a < = b, 2 / *x')).toBe('SELECT 1- -1,a< =b,2/ *x');
  });

  it('does not strip comment markers that live inside strings', () => {
    expect(minifySql("SELECT '-- not a comment', '/* nor this */'", { stripComments: true })).toBe(
      "SELECT '-- not a comment','/* nor this */'",
    );
  });

  it('keeps prefixes attached to strings and numbers intact', () => {
    expect(minifySql("SELECT N'abc', E'a\\nb', 1.5, .5, t.col", { dialect: 'postgresql' })).toBe("SELECT N'abc',E'a\\nb',1.5,.5,t.col");
    expect(minifySql('SELECT 1 .5')).toBe('SELECT 1 .5');
  });

  it('keeps dollar-quoted bodies byte-for-byte', () => {
    const body = '$$\nBEGIN\n  RETURN 1;  -- one\nEND;\n$$';
    expect(minifySql(`CREATE FUNCTION f() RETURNS int AS ${body} LANGUAGE plpgsql`, { dialect: 'postgresql', stripComments: true })).toBe(
      `CREATE FUNCTION f()RETURNS int AS ${body} LANGUAGE plpgsql`,
    );
  });

  it('joins multiple statements', () => {
    expect(minifySql('SELECT 1;\n\nSELECT 2;')).toBe('SELECT 1;SELECT 2;');
  });

  it('produces SQL the formatter still understands', () => {
    const sql = "SELECT id, name FROM users u JOIN orders o ON o.user_id = u.id WHERE o.total > 100 AND u.name <> 'a  b' ORDER BY id DESC";
    expect(format(minifySql(sql))).toBe(format(sql));
  });

  it('returns an empty string for blank input', () => {
    expect(minifySql('  \n ')).toBe('');
  });
});

describe('describeFormatError', () => {
  it('keeps the summary line and extracts the position', () => {
    try {
      format('SELECT a FROM b WHERE )', { language: 'postgresql' });
      throw new Error('expected a parse error');
    } catch (e) {
      const info = describeFormatError(e);
      expect(info.line).toBe(1);
      expect(info.column).toBe(23);
      expect(info.message).toBe('Parse error at token: )');
      expect(info.message).not.toContain('\n');
    }
  });

  it('handles errors without positions', () => {
    expect(describeFormatError(new Error('Boom.'))).toEqual({ message: 'Boom' });
    expect(describeFormatError('x')).toEqual({ message: 'x' });
  });
});
