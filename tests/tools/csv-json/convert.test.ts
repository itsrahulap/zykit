import { describe, expect, it } from 'vitest';
import { inferCell, jsonToRows, rowsToJson, uniqueHeaders } from '../../../src/tools/csv-json/features/convert';
import { parseCsv, writeCsv } from '../../../src/shared/lib/csv';

const opts = { header: true, shape: 'objects' as const, inferTypes: true, emptyAsNull: false };

describe('inferCell', () => {
  it('infers numbers, booleans and null', () => {
    expect(inferCell('42', true, false)).toBe(42);
    expect(inferCell('-3.5e2', true, false)).toBe(-350);
    expect(inferCell('true', true, false)).toBe(true);
    expect(inferCell('FALSE', true, false)).toBe(false);
    expect(inferCell('null', true, false)).toBe(null);
    expect(inferCell('', true, true)).toBe(null);
    expect(inferCell('', true, false)).toBe('');
  });
  it('keeps things that are not safely numbers as strings', () => {
    expect(inferCell('007', true, false)).toBe('007');
    expect(inferCell('12345678901234567890', true, false)).toBe('12345678901234567890');
    expect(inferCell('1,5', true, false)).toBe('1,5');
    expect(inferCell(' 1', true, false)).toBe(' 1');
    expect(inferCell('42', false, false)).toBe('42');
  });
});

describe('rowsToJson', () => {
  it('makes objects from a header row, with unique names', () => {
    const r = rowsToJson(parseCsv('id,name,name,\n1,Ann,A,x\n2,Bob').rows, opts);
    expect(r.columns).toEqual(['id', 'name', 'name_2', 'column_4']);
    expect(r.value).toEqual([
      { id: 1, name: 'Ann', name_2: 'A', column_4: 'x' },
      { id: 2, name: 'Bob', name_2: '', column_4: '' },
    ]);
    expect(r.raggedRows).toBe(1);
  });
  it('makes arrays, with or without a header', () => {
    const rows = parseCsv('a,b\n1,').rows;
    expect(rowsToJson(rows, { ...opts, shape: 'arrays', emptyAsNull: true }).value).toEqual([['a', 'b'], [1, null]]);
    expect(rowsToJson(rows, { ...opts, header: false }).value).toEqual([
      { column_1: 'a', column_2: 'b' },
      { column_1: 1, column_2: '' },
    ]);
  });
  it('dedupes against generated names too', () => {
    expect(uniqueHeaders(['a', 'a', 'a_2'])).toEqual(['a', 'a_2', 'a_2_2']);
  });
});

describe('jsonToRows', () => {
  it('unions keys and flattens nested objects', () => {
    const rows = jsonToRows([{ id: 1, user: { name: 'A', geo: { c: 'X' } }, tags: ['x'] }, { id: 2, extra: null }], { flatten: true, header: true });
    expect(rows).toEqual([
      ['id', 'user.name', 'user.geo.c', 'tags', 'extra'],
      ['1', 'A', 'X', '["x"]', ''],
      ['2', '', '', '', ''],
    ]);
  });
  it('stringifies nested objects when not flattening', () => {
    expect(jsonToRows([{ a: { b: 1 } }], { flatten: false, header: true })).toEqual([['a'], ['{"b":1}']]);
  });
  it('accepts arrays of arrays, primitives and a single object', () => {
    expect(jsonToRows([[1, 'a'], [true, null]], { flatten: true, header: true })).toEqual([['1', 'a'], ['true', '']]);
    expect(jsonToRows([1, 2], { flatten: true, header: true })).toEqual([['value'], ['1'], ['2']]);
    expect(jsonToRows({ a: 1 }, { flatten: true, header: false })).toEqual([['1']]);
    expect(() => jsonToRows(5, { flatten: true, header: true })).toThrow(/Expected a JSON array/);
  });
  it('round-trips with quoting', () => {
    const data = [{ a: 'x,y', b: 'say "hi"', c: 'multi\nline' }];
    const csv = writeCsv(jsonToRows(data, { flatten: true, header: true }));
    expect(rowsToJson(parseCsv(csv).rows, { ...opts, inferTypes: false }).value).toEqual(data);
  });
});
