import { describe, expect, it } from 'vitest';
import { buildTable, detectType, headerNames, viewRows, type ViewOptions } from '../../../src/tools/csv-viewer/features/table';

const csv = 'name,age,joined,active\nAnn,30,2024-01-05,true\nbob,9,2023-12-31,false\nCara,,2024-02-01,yes\nDan,100,2022-06-15,no\n';
const base: ViewOptions = { global: '', columnFilters: {}, searchColumns: [0, 1, 2, 3], sort: null };

describe('buildTable', () => {
  it('detects column types and stats', () => {
    const t = buildTable(csv, { delimiter: 'auto', header: true });
    expect(t.headers).toEqual(['name', 'age', 'joined', 'active']);
    expect(t.columns.map((c) => c.type)).toEqual(['text', 'number', 'date', 'boolean']);
    expect(t.columns[1]).toMatchObject({ count: 4, empty: 1, unique: 3, min: 9, max: 100 });
    expect(t.columns[1].mean).toBeCloseTo(139 / 3);
    expect(t.columns[2]).toMatchObject({ minText: '2022-06-15', maxText: '2024-02-01' });
  });

  it('pads ragged rows and names columns without a header', () => {
    const t = buildTable('a;b;c\n1', { delimiter: 'auto', header: false });
    expect(t.delimiter).toBe(';');
    expect(t.headers).toEqual(['Column 1', 'Column 2', 'Column 3']);
    expect(t.rows[1]).toEqual(['1', '', '']);
  });

  it('makes header names distinct', () => {
    expect(headerNames(['a', 'a', ''], 4)).toEqual(['a', 'a (2)', 'Column 3', 'Column 4']);
  });

  it('handles 100k rows quickly', () => {
    const text = 'id,value,label\n' + Array.from({ length: 100_000 }, (_, i) => `${i},${(i * 7) % 1000},"item ${i}"`).join('\n');
    const t0 = performance.now();
    const t = buildTable(text, { delimiter: 'auto', header: true });
    const rows = viewRows(t.rows, t.columns, { ...base, searchColumns: [0, 1, 2], global: '99', sort: { column: 1, dir: 'desc' } });
    expect(t.rows.length).toBe(100_000);
    expect(rows.length).toBeGreaterThan(0);
    expect(performance.now() - t0).toBeLessThan(4000);
  });
});

describe('detectType', () => {
  it('classifies values', () => {
    expect(detectType(['1', '-2.5', '', '1e3'])).toBe('number');
    expect(detectType(['', ' '])).toBe('empty');
    expect(detectType(['1', 'x'])).toBe('text');
    expect(detectType(['2024-01-01T10:00:00Z'])).toBe('date');
  });
});

describe('viewRows', () => {
  const t = buildTable(csv, { delimiter: 'auto', header: true });
  it('sorts numbers numerically with empties last', () => {
    const r = viewRows(t.rows, t.columns, { ...base, sort: { column: 1, dir: 'asc' } });
    expect(r.map((i) => t.rows[i][0])).toEqual(['bob', 'Ann', 'Dan', 'Cara']);
    const d = viewRows(t.rows, t.columns, { ...base, sort: { column: 1, dir: 'desc' } });
    expect(d.map((i) => t.rows[i][0])).toEqual(['Dan', 'Ann', 'bob', 'Cara']);
  });
  it('sorts text case-insensitively', () => {
    const r = viewRows(t.rows, t.columns, { ...base, sort: { column: 0, dir: 'asc' } });
    expect(r.map((i) => t.rows[i][0])).toEqual(['Ann', 'bob', 'Cara', 'Dan']);
  });
  it('filters globally and per column', () => {
    expect(viewRows(t.rows, t.columns, { ...base, global: 'BOB' })).toEqual([1]);
    expect(viewRows(t.rows, t.columns, { ...base, global: '2024', columnFilters: { 3: 'e' } })).toEqual([0, 2]);
    expect(viewRows(t.rows, t.columns, { ...base, global: 'ann', searchColumns: [1] })).toEqual([]);
  });
});
