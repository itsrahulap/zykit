import { describe, expect, it } from 'vitest';
import { diffCounts, diffEnv, entropy, envReport, maskValue, normalizeEnv, parseEnv, secretHint, toExample } from '../../../src/tools/env-diff/features/env-diff';

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
    // Only the style warnings: spaces around "=" and mixed export.
    expect(p.issues.map((i) => i.severity)).toEqual(['warning', 'warning']);
    expect(p.issues.map((i) => i.message).join(' ')).toMatch(/spaces around.*export/);
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

describe('lint warnings', () => {
  const warn = (t: string) => parseEnv(t).issues.map((i) => i.message).join('\n');
  it('flags spaces around =, double assignments and mixed export', () => {
    expect(warn('A = 1')).toMatch(/spaces around/);
    expect(warn('A=1')).not.toMatch(/spaces around/);
    expect(warn('A=')).toBe('');
    expect(warn('A=B=C')).toMatch(/Two assignments/);
    expect(warn('A="B=C"')).not.toMatch(/Two assignments/);
    expect(warn('export A=1\nB=2')).toMatch(/export/);
    expect(warn('export A=1\nexport B=2')).toBe('');
  });
});

describe('normalizeEnv', () => {
  const tricky = [
    '# top comment',
    'export PLAIN=abc',
    'SPACED=hello world',
    "SINGLE='literal $HOME'",
    'DOUBLE="tab\\there \\"q\\" \\\\ back"',
    'REF=${SITE_URL}/api',
    'DOLLAR="cost \\$5 it\'s"',
    'MULTI="line1\nline2"',
    'EMPTY=',
    'DUP=1',
    'BAD LINE',
    'DUP=2',
    'HASH="a#b"',
  ].join('\n');
  it('keeps every final value and comments, drops duplicates and invalid lines', () => {
    const p = parseEnv(tricky);
    const n = normalizeEnv(p, tricky);
    expect(n.safe).toBe(true);
    expect(n.dropped).toBe(1);
    expect(n.text).toContain('# top comment');
    expect(n.text).not.toContain('BAD LINE');
    expect(n.text).toContain('DUP=2');
    expect(n.text).not.toContain('DUP=1');
    const back = parseEnv(n.text);
    for (const [k, e] of p.values) expect(back.values.get(k)?.value, k).toBe(e.value);
    expect(back.values.get('DOUBLE')!.value).toBe('tab\there "q" \\ back');
    expect(back.values.get('MULTI')!.value).toBe('line1\nline2');
    expect(back.values.get('REF')!.refs).toEqual(['SITE_URL']);
    expect(back.values.get('SINGLE')!.refs).toEqual([]);
    expect(back.values.get('DOLLAR')!.refs).toEqual([]);
    expect(back.values.get('PLAIN')!.exported).toBe(true);
  });
  it('sorts keys and drops comments when asked', () => {
    const n = normalizeEnv(parseEnv('B=2\n# c\nA=1'), 'B=2\n# c\nA=1', true);
    expect(n.text).toBe('A=1\nB=2\n');
  });
});

describe('envReport', () => {
  it('masks values and respects keys-only mode', () => {
    const a = parseEnv('KEY=secret-a\nONLY_A=x');
    const b = parseEnv('KEY=secret-b\nONLY_B=y');
    const rows = diffEnv(a, b);
    const full = envReport(a, b, rows, false);
    expect(full).not.toMatch(/secret-a|secret-b/);
    expect(full).toMatch(/changed KEY/);
    expect(full).toMatch(/missing ONLY_A/);
    const keys = envReport(a, b, rows, true);
    expect(keys).not.toMatch(/changed|•/);
    expect(keys).toMatch(/extra +ONLY_B/);
  });
});
