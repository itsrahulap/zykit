import { describe, expect, it } from 'vitest';
import { detectDelimiter, parseCsv, quoteField, writeCsv } from '../../src/shared/lib/csv';

const rows = (text: string, o = {}) => parseCsv(text, o).rows;

describe('parseCsv', () => {
  it('parses simple records with LF and CRLF', () => {
    expect(rows('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
    expect(rows('a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
    expect(rows('a,b\r1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('handles quoted fields, escaped quotes and embedded newlines', () => {
    expect(rows('"a,1","say ""hi""","line\nbreak"\nx,y,z')).toEqual([
      ['a,1', 'say "hi"', 'line\nbreak'],
      ['x', 'y', 'z'],
    ]);
    expect(rows('"",x')).toEqual([['', 'x']]);
  });

  it('keeps empty fields, including a trailing one', () => {
    expect(rows('a,,c,\n,,,')).toEqual([['a', '', 'c', ''], ['', '', '', '']]);
  });

  it('strips a BOM', () => {
    expect(rows('﻿name\nx')).toEqual([['name'], ['x']]);
  });

  it('skips empty lines by default, keeps them when asked', () => {
    expect(rows('a\n\nb\n')).toEqual([['a'], ['b']]);
    expect(rows('a\n\nb', { skipEmptyLines: false })).toEqual([['a'], [''], ['b']]);
  });

  it('trims unquoted values but not quoted content', () => {
    expect(rows('  a , " b " ,c  ', { trim: true })).toEqual([['a', ' b ', 'c']]);
    expect(rows(' a ,b')).toEqual([[' a ', 'b']]);
  });

  it('reports an unterminated quote and trailing junk', () => {
    const r = parseCsv('a,"b\nc');
    expect(r.rows).toEqual([['a', 'b\nc']]);
    expect(r.issues[0]).toMatchObject({ line: 1 });
    const r2 = parseCsv('"a"x,b');
    expect(r2.rows).toEqual([['ax', 'b']]);
    expect(r2.issues).toHaveLength(1);
  });

  it('counts lines across quoted newlines for issues', () => {
    const r = parseCsv('"a\nb",c\n"d"e');
    expect(r.issues[0].line).toBe(3);
  });

  it('auto-detects the delimiter', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a\tb\n1\t2')).toBe('\t');
    expect(detectDelimiter('a|b\n1|2')).toBe('|');
    expect(detectDelimiter('"x;y",b\n1,2')).toBe(',');
    expect(detectDelimiter('single')).toBe(',');
    expect(parseCsv('a;b\n1;2').delimiter).toBe(';');
    expect(rows('a;b', { delimiter: ',' })).toEqual([['a;b']]);
  });

  it('respects maxRows', () => {
    const r = parseCsv('1\n2\n3', { maxRows: 2 });
    expect(r.rows).toEqual([['1'], ['2']]);
    expect(r.truncated).toBe(true);
  });

  it('parses a large input quickly', () => {
    const line = 'id,"name, quoted",3.14,true\n';
    const text = line.repeat(200_000);
    const t = performance.now();
    const r = parseCsv(text);
    expect(r.rows.length).toBe(200_000);
    expect(performance.now() - t).toBeLessThan(3000);
  });
});

describe('writeCsv', () => {
  it('quotes only when needed', () => {
    expect(quoteField('plain')).toBe('plain');
    expect(quoteField('a,b')).toBe('"a,b"');
    expect(quoteField('say "hi"')).toBe('"say ""hi"""');
    expect(quoteField('x\ny')).toBe('"x\ny"');
    expect(quoteField(' pad')).toBe('" pad"');
    expect(quoteField('a;b', ';')).toBe('"a;b"');
    expect(quoteField('a;b', ',')).toBe('a;b');
    expect(quoteField('x', ',', true)).toBe('"x"');
  });

  it('round-trips through parseCsv', () => {
    const data = [['a', 'b,c', 'd"e'], ['multi\nline', '', ' x ']];
    for (const delimiter of [',', ';', '\t', '|'] as const) {
      const text = writeCsv(data, { delimiter, newline: '\r\n' });
      expect(parseCsv(text, { delimiter }).rows).toEqual(data);
    }
  });
});
