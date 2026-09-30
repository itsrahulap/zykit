import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FIELDS,
  DEFAULT_SCHEMA,
  FIELD_TYPES,
  formatData,
  fromPattern,
  generateData,
  MAX_ROWS,
  toCsv,
  toJson,
  toJsonLines,
  toSql,
  validateField,
  validateSchema,
  type Field,
} from '../../../src/tools/mock-data-generator/features/mock-data-generator';
import { seededRng } from '../../../src/tools/lorem-ipsum/features/lorem-ipsum';
import { parseCsv } from '../../../src/shared/lib/csv';

const allTypes: Field[] = FIELD_TYPES.map((t) => ({ name: t.value, type: t.value, ...DEFAULT_FIELDS[t.value] }));

describe('generateData', () => {
  it('is deterministic for a seed', () => {
    const a = generateData(allTypes, 50, 'seed-1');
    expect(generateData(allTypes, 50, 'seed-1')).toEqual(a);
    expect(generateData(allTypes, 50, 'seed-2')).not.toEqual(a);
    expect(a.columns).toEqual(allTypes.map((f) => f.name));
    expect(a.rows).toHaveLength(50);
  });

  it('produces well-formed values for every type', () => {
    const { rows, columns } = generateData(allTypes, 300, 'shapes');
    const col = (name: string) => rows.map((r) => r[columns.indexOf(name)]);
    expect(col('sequence')).toEqual(Array.from({ length: 300 }, (_, i) => i + 1));
    for (const v of col('uuid')) expect(v).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    for (const v of col('email')) expect(v).toMatch(/^[a-z0-9._]+@(example\.(com|org|net)|[a-z]+\.test)$/);
    for (const v of col('phone')) expect(v).toMatch(/^\+1-\d{3}-555-01\d\d$/);
    for (const v of col('url')) expect(v).toMatch(/^https:\/\/[a-z.]*(example\.(com|org|net)|[a-z]+\.test)\//);
    for (const v of col('ipv4')) {
      const parts = String(v).split('.').map(Number);
      expect(parts).toHaveLength(4);
      expect(parts.every((p) => p >= 0 && p <= 255)).toBe(true);
    }
    for (const v of col('ipv6')) expect(v).toMatch(/^2001:db8(:[0-9a-f]{1,4}){6}$/);
    for (const v of col('integer')) expect(Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 100).toBe(true);
    for (const v of col('float')) {
      expect(typeof v).toBe('number');
      expect(v as number).toBeGreaterThanOrEqual(0);
      expect(v as number).toBeLessThanOrEqual(1000);
      expect(String(v)).toMatch(/^\d+(\.\d{1,2})?$/);
    }
    for (const v of col('boolean')) expect(typeof v).toBe('boolean');
    for (const v of col('date')) expect(v >= '2020-01-01' && v <= '2025-12-31').toBe(true);
    for (const v of col('datetime')) expect(v).toMatch(/^2024-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
    for (const v of col('enum')) expect(['active', 'pending', 'disabled']).toContain(v);
    for (const v of col('pattern')) expect(v).toMatch(/^ORD-\d{4}-[A-Z]{2}$/);
    for (const v of col('postcode')) expect(v).toMatch(/^\d{5}$/);
    for (const v of col('sentence')) expect(v).toMatch(/^[A-Z][a-z ]+\.$/);
  });

  it('keeps name, email and username consistent within a row', () => {
    const d = generateData(
      [
        { name: 'first', type: 'firstName' },
        { name: 'last', type: 'lastName' },
        { name: 'full', type: 'fullName' },
        { name: 'email', type: 'email' },
      ],
      100,
      'people',
    );
    for (const [first, last, full, email] of d.rows) {
      expect(full).toBe(`${first} ${last}`);
      expect(String(email).startsWith(String(first).toLowerCase().slice(0, 1))).toBe(true);
    }
  });

  it('caps the row count', () => {
    expect(generateData(DEFAULT_SCHEMA, 99_999, 'x').rows).toHaveLength(MAX_ROWS);
    expect(generateData(DEFAULT_SCHEMA, -1, 'x').rows).toHaveLength(0);
  });

  it('handles 10,000 rows quickly', () => {
    const t = performance.now();
    const d = generateData(DEFAULT_SCHEMA, MAX_ROWS, 'big');
    toJson(d);
    toCsv(d);
    expect(performance.now() - t).toBeLessThan(2000);
  });
});

describe('patterns', () => {
  it('fills #, ? and * and honours escapes', () => {
    const rng = seededRng('p');
    expect(fromPattern(rng, 'AB-##\\#-??-**')).toMatch(/^AB-\d\d#-[A-Z]{2}-[A-Z0-9]{2}$/);
    expect(fromPattern(rng, 'literal')).toBe('literal');
  });
});

describe('validation', () => {
  it('flags bad options', () => {
    expect(validateField({ name: '', type: 'uuid' })).toMatch(/name/);
    expect(validateField({ name: 'n', type: 'integer', min: 5, max: 1 })).toMatch(/larger/);
    expect(validateField({ name: 'n', type: 'integer', min: 1.2, max: 1.8 })).toMatch(/whole/);
    expect(validateField({ name: 'd', type: 'date', from: '2024-02-30', to: '2024-03-01' })).toMatch(/YYYY/);
    expect(validateField({ name: 'd', type: 'date', from: '2024-03-02', to: '2024-03-01' })).toMatch(/after/);
    expect(validateField({ name: 'e', type: 'enum', values: ' , ' })).toMatch(/value/);
    expect(validateField({ name: 'p', type: 'pattern', pattern: '' })).toMatch(/pattern/);
    expect(validateField({ name: 'ok', type: 'float', min: 0, max: 1, decimals: 3 })).toBeNull();
  });
  it('flags duplicate names and empty schemas', () => {
    expect(validateSchema([])).toEqual(['Add at least one field.']);
    expect(validateSchema([{ name: 'a', type: 'uuid' }, { name: 'a', type: 'uuid' }])).toEqual(['Duplicate field name "a".']);
    expect(validateSchema(DEFAULT_SCHEMA)).toEqual([]);
  });
});

describe('output formats', () => {
  const d = generateData(
    [
      { name: 'id', type: 'sequence', min: 10, step: 5 },
      { name: 'label', type: 'enum', values: 'a "quoted", value; x' },
      { name: 'ok', type: 'boolean' },
    ],
    3,
    'fmt',
  );

  it('writes JSON and JSON Lines with typed values', () => {
    const arr = JSON.parse(toJson(d));
    expect(arr.map((r: { id: number }) => r.id)).toEqual([10, 15, 20]);
    expect(typeof arr[0].ok).toBe('boolean');
    const lines = toJsonLines(d).split('\n');
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[2]).id).toBe(20);
  });

  it('writes RFC 4180 CSV with a header', () => {
    const csv = toCsv(d);
    const parsed = parseCsv(csv);
    expect(parsed.rows[0]).toEqual(['id', 'label', 'ok']);
    expect(parsed.rows).toHaveLength(4);
    expect(csv).toContain('"a ""quoted"""');
  });

  it('writes SQL through the JSON to SQL generator', () => {
    const sql = toSql(d, 'postgres', 'people');
    expect(sql).toContain('CREATE TABLE "people"');
    expect(sql).toMatch(/INSERT INTO "people" \("id", "label", "ok"\)/);
    expect(sql).toContain('(10, ');
    expect(toSql(d, 'mysql', '')).toContain('`mock_data`');
    expect(formatData({ columns: ['a'], rows: [] }, 'sql', { dialect: 'postgres', table: 't' })).toBe('');
  });
});
