import { describe, expect, it } from 'vitest';
import { diffCounts, diffEnv, entropy, maskValue, parseEnv, secretHint, toExample } from '../../../src/tools/env-diff/features/env-diff';

const val = (text: string, key: string) => parseEnv(text).values.get(key)?.value;

describe('parseEnv (dotenv rules)', () => {
  it('reads basic assignments, comments and export', () => {
    const p = parseEnv('# comment\n\nBASIC=basic\nexport EXPORTED=yes\n  SPACED = value  \nEMPTY=\nCOLON: yaml-ish\n');
    expect(Object.fromEntries([...p.values].map(([k, e]) => [k, e.value]))).toEqual({
      BASIC: 'basic',
      EXPORTED: 'yes',
      SPACED: 'value',
      EMPTY: '',
      COLON: 'yaml-ish',
    });
    expect(p.values.get('EXPORTED')!.exported).toBe(true);
    expect(p.issues).toEqual([]);
  });

  it('handles quotes, escapes and inline comments', () => {
    const text = [
      `SINGLE='single \\n quoted' # comment`,
      `DOUBLE="double \\n quoted \\"x\\""`,
      'BACKTICK=`back "and" \'tick\'`',
      'INLINE=value # a comment',
      'HASH_IN_QUOTES="a # b"',
      `EQUALS=a=b=c`,
      `TRIM="  keep spaces  "`,
    ].join('\n');
    expect(val(text, 'SINGLE')).toBe('single \\n quoted');
    expect(val(text, 'DOUBLE')).toBe('double \n quoted "x"');
    expect(val(text, 'BACKTICK')).toBe(`back "and" 'tick'`);
    expect(val(text, 'INLINE')).toBe('value');
    expect(val(text, 'HASH_IN_QUOTES')).toBe('a # b');
    expect(val(text, 'EQUALS')).toBe('a=b=c');
    expect(val(text, 'TRIM')).toBe('  keep spaces  ');
  });

  it('reads multiline quoted values', () => {
    const text = 'KEY="-----BEGIN KEY-----\nabc\n-----END KEY-----"\nNEXT=1\nSQ=\'a\nb\'';
    const p = parseEnv(text);
    expect(p.values.get('KEY')).toMatchObject({ value: '-----BEGIN KEY-----\nabc\n-----END KEY-----', line: 1, endLine: 3 });
    expect(p.values.get('NEXT')!.line).toBe(4);
    expect(p.values.get('SQ')!.value).toBe('a\nb');
  });

  it('finds ${VAR} references without expanding them', () => {
    const p = parseEnv('A=${HOME}/x\nB="$USER-${PORT:-80}"\nC=\'${NOPE}\'\nD=\\$ESCAPED');
    expect(p.values.get('A')).toMatchObject({ value: '${HOME}/x', refs: ['HOME'] });
    expect(p.values.get('B')!.refs).toEqual(['USER', 'PORT']);
    expect(p.values.get('C')!.refs).toEqual([]);
    expect(p.values.get('D')!.refs).toEqual([]);
  });

  it('reports syntax errors and duplicates', () => {
    const p = parseEnv('GOOD=1\nnot an assignment\n1BAD=x\nGOOD=2\nAFTER="x" junk\nPW=abc#123\nOPEN="never closed\nNEXT=1');
    expect(p.issues.map((i) => [i.line, i.severity])).toEqual([
      [2, 'error'],
      [3, 'error'],
      [5, 'error'],
      [6, 'warning'],
      [7, 'error'],
    ]);
    expect(p.values.get('GOOD')!.value).toBe('2');
    expect(p.duplicates).toEqual([{ key: 'GOOD', lines: [1, 4] }]);
    expect(p.values.get('PW')!.value).toBe('abc');
  });

  it('handles CRLF and a BOM', () => {
    expect(val('﻿A=1\r\nB=2\r\n', 'B')).toBe('2');
    expect(val('﻿A=1\r\nB=2\r\n', 'A')).toBe('1');
  });
});

describe('diffEnv', () => {
  it('classifies keys', () => {
    const a = parseEnv('SAME=1\nCHANGED=a\nMISSING=x\n');
    const b = parseEnv('SAME=1\nCHANGED=b\nEXTRA=y\n');
    const rows = diffEnv(a, b);
    expect(rows.map((r) => [r.key, r.status])).toEqual([
      ['SAME', 'same'],
      ['CHANGED', 'changed'],
      ['MISSING', 'missing'],
      ['EXTRA', 'extra'],
    ]);
    expect(diffCounts(rows)).toEqual({ missing: 1, extra: 1, changed: 1, same: 1 });
  });
});

describe('secrets', () => {
  it('flags secret-looking names and values', () => {
    expect(secretHint('DB_PASSWORD', 'x')).toBeTruthy();
    expect(secretHint('GITHUB_TOKEN', 'x')).toBeTruthy();
    expect(secretHint('STRIPE', 'sk_live_abc123')).toBeTruthy();
    expect(secretHint('DATABASE_URL', 'postgres://user:hunter2@db/app')).toBeTruthy();
    expect(secretHint('RANDOM', 'q8Zr2LmX0pVt7KfN3sYw9HbJ')).toBeTruthy();
    expect(secretHint('PORT', '3000')).toBeNull();
    expect(secretHint('NODE_ENV', 'production')).toBeNull();
    expect(secretHint('SITE_URL', 'https://example.com/some/long/path')).toBeNull();
  });

  it('computes entropy', () => {
    expect(entropy('aaaa')).toBe(0);
    expect(entropy('abcd')).toBe(2);
  });

  it('masks values', () => {
    expect(maskValue('')).toBe('(empty)');
    expect(maskValue('ab')).toBe('••••');
    expect(maskValue('x'.repeat(100))).toBe('•'.repeat(12));
  });
});

describe('toExample', () => {
  it('removes values and keeps comments', () => {
    const text = '# Database\nexport DB_URL="postgres://u:p@h/db"\n\nKEY="multi\nline"\nPORT=3000 # web\n';
    expect(toExample(text)).toBe('# Database\nexport DB_URL=\n\nKEY=\nPORT=\n');
    expect(toExample('')).toBe('');
  });
});
