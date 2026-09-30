import { describe, expect, it } from 'vitest';
import {
  coerce,
  columnNames,
  createTableSql,
  exampleQueries,
  inferType,
  inferTypes,
  joinColumns,
  mayChangeSchema,
  quoteIdent,
  resultToCsv,
  resultToJson,
  tableNameFromFile,
  type TableSchema,
} from '../../../src/tools/csv-sql/features/csv-sql';

const table = (name: string, cols: [string, 'INTEGER' | 'REAL' | 'TEXT'][]): TableSchema => ({
  name,
  columns: cols.map(([n, type]) => ({ name: n, type })),
  rowCount: 1,
  source: `${name}.csv`,
});

describe('table and column names', () => {
  it('sanitises file names into unique table names', () => {
    expect(tableNameFromFile('Sales 2024.csv')).toBe('sales_2024');
    expect(tableNameFromFile('2024-report.tsv')).toBe('t_2024_report');
    expect(tableNameFromFile('Café.csv')).toBe('cafe');
    expect(tableNameFromFile('???.csv')).toBe('data');
    expect(tableNameFromFile('sqlite_master.csv')).toBe('t_sqlite_master');
    expect(tableNameFromFile('orders.csv', ['Orders', 'orders_2'])).toBe('orders_3');
  });
  it('names blank and duplicate columns', () => {
    expect(columnNames([' id ', '', 'Name', 'name', 'id'])).toEqual(['id', 'column_2', 'Name', 'name_2', 'id_2']);
  });
  it('quotes identifiers', () => {
    expect(quoteIdent('a "b"')).toBe('"a ""b"""');
    expect(createTableSql('t', [{ name: 'x', type: 'INTEGER' }])).toBe('CREATE TABLE "t" ("x" INTEGER)');
  });
});

describe('type inference', () => {
  it('picks INTEGER, REAL or TEXT from the values', () => {
    expect(inferType(['1', '-2', '', '+3'])).toBe('INTEGER');
    expect(inferType(['1', '2.5', '1e3'])).toBe('REAL');
    expect(inferType(['1', 'x'])).toBe('TEXT');
    expect(inferType(['', ' '])).toBe('TEXT');
    expect(inferType(['99999999999999999999'])).toBe('REAL');
    expect(inferType(['1', '2', 'x'], 2)).toBe('INTEGER');
  });
  it('infers per column and honours "all TEXT"', () => {
    const rows = [
      ['1', 'a', '1.5'],
      ['2', 'b', ''],
    ];
    expect(inferTypes(rows, 3)).toEqual(['INTEGER', 'TEXT', 'REAL']);
    expect(inferTypes(rows, 3, true)).toEqual(['TEXT', 'TEXT', 'TEXT']);
  });
  it('coerces values for insertion', () => {
    expect(coerce('42', 'INTEGER')).toBe(42);
    expect(coerce(' ', 'INTEGER')).toBeNull();
    expect(coerce(undefined, 'TEXT')).toBeNull();
    expect(coerce('', 'TEXT')).toBe('');
    expect(coerce('n/a', 'REAL')).toBe('n/a');
    expect(coerce('2.50', 'REAL')).toBe(2.5);
  });
});

describe('example queries', () => {
  const customers = table('customers', [
    ['id', 'INTEGER'],
    ['city', 'TEXT'],
  ]);
  const orders = table('orders', [
    ['order_id', 'INTEGER'],
    ['customer_id', 'INTEGER'],
    ['price', 'REAL'],
  ]);
  it('finds join keys', () => {
    expect(joinColumns(customers, orders)).toEqual(['id', 'customer_id']);
    expect(joinColumns(orders, customers)).toEqual(['customer_id', 'id']);
    expect(joinColumns(table('a', [['x', 'TEXT']]), table('b', [['y', 'TEXT']]))).toBeNull();
  });
  it('includes GROUP BY and JOIN examples', () => {
    const sqls = exampleQueries([customers, orders]).map((e) => e.sql);
    expect(sqls.some((s) => s.includes('GROUP BY city'))).toBe(true);
    expect(sqls.some((s) => s.includes('JOIN orders AS b ON b.customer_id = a.id'))).toBe(true);
    expect(exampleQueries([])).toHaveLength(1);
  });
});

describe('export', () => {
  it('writes CSV and JSON', () => {
    expect(resultToCsv(['a', 'b'], [[1, null], ['x,y', 'z']]).split(/\r?\n/).filter(Boolean)).toEqual(['a,b', '1,', '"x,y",z']);
    expect(JSON.parse(resultToJson(['n', 'n'], [[1, 2]]))).toEqual([{ n: 1, n_2: 2 }]);
  });
  it('spots statements that change tables', () => {
    expect(mayChangeSchema('SELECT 1; -- drop')).toBe(false);
    expect(mayChangeSchema('with x as (select 1) select * from x')).toBe(false);
    expect(mayChangeSchema('CREATE TABLE t AS SELECT 1')).toBe(true);
    expect(mayChangeSchema('SELECT 1; DELETE FROM t')).toBe(true);
  });
});
