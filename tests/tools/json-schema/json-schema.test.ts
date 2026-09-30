import { describe, expect, it } from 'vitest';
import { detectDraft, FORMATS, inferSchema, isMultiple, validate, type Draft } from '../../../src/tools/json-schema/features/json-schema';

// A representative subset of the official JSON-Schema-Test-Suite, in its format.
interface Group {
  description: string;
  schema: unknown;
  tests: [data: unknown, valid: boolean][];
  draft?: Draft;
  assertFormat?: boolean;
}

const SUITE: Group[] = [
  { description: 'boolean schema true', schema: true, tests: [[1, true], [{ a: 1 }, true]] },
  { description: 'boolean schema false', schema: false, tests: [[1, false], [null, false]] },
  { description: 'integer type', schema: { type: 'integer' }, tests: [[1, true], [1.0, true], [1.1, false], ['1', false], [null, false]] },
  { description: 'number type', schema: { type: 'number' }, tests: [[1, true], [1.5, true], ['1', false]] },
  { description: 'multiple types', schema: { type: ['integer', 'string'] }, tests: [[1, true], ['x', true], [1.5, false], [{}, false]] },
  { description: 'null type', schema: { type: 'null' }, tests: [[null, true], [0, false], ['', false]] },
  { description: 'array/object types', schema: { type: 'object' }, tests: [[{}, true], [[], false], [null, false]] },
  { description: 'enum', schema: { enum: [1, 'a', [1], { b: 2 }, null] }, tests: [[1, true], ['a', true], [[1], true], [{ b: 2 }, true], [null, true], [{ b: 3 }, false], [true, false]] },
  { description: 'enum with false does not match 0', schema: { enum: [false] }, tests: [[false, true], [0, false]] },
  { description: 'const', schema: { const: { a: [1, 2] } }, tests: [[{ a: [1, 2] }, true], [{ a: [2, 1] }, false]] },
  { description: 'const 1 matches 1.0', schema: { const: 1 }, tests: [[1.0, true], [true, false]] },
  { description: 'multipleOf', schema: { multipleOf: 2 }, tests: [[10, true], [7, false], ['foo', true]] },
  { description: 'multipleOf small float', schema: { multipleOf: 0.0001 }, tests: [[0.0075, true], [0.00751, false]] },
  { description: 'multipleOf 0.01', schema: { multipleOf: 0.01 }, tests: [[19.99, true], [0.3, true], [0.301, false]] },
  { description: 'multipleOf overflow', schema: { type: 'integer', multipleOf: 0.123456789 }, tests: [[1e308, false]] },
  { description: 'maximum', schema: { maximum: 3 }, tests: [[3, true], [3.5, false], ['x', true]] },
  { description: 'exclusiveMaximum', schema: { exclusiveMaximum: 3 }, tests: [[2.9, true], [3, false]] },
  { description: 'minimum / exclusiveMinimum', schema: { minimum: 1, exclusiveMinimum: 1.1 }, tests: [[1.2, true], [1.1, false], [0, false]] },
  { description: 'maxLength counts code points', schema: { maxLength: 2 }, tests: [['ab', true], ['abc', false], ['💩💩', true], [100, true]] },
  { description: 'minLength counts code points', schema: { minLength: 2 }, tests: [['a', false], ['💩', false], ['ab', true]] },
  { description: 'pattern', schema: { pattern: '^a*$' }, tests: [['aaa', true], ['abc', false], [true, true]] },
  { description: 'pattern is not anchored', schema: { pattern: 'a+' }, tests: [['xxaayy', true]] },
  { description: 'pattern with unicode property', schema: { pattern: '^\\p{Letter}+$' }, tests: [['héllo', true], ['123', false]] },
  { description: 'items (2020-12)', schema: { items: { type: 'integer' } }, tests: [[[1, 2, 3], true], [[1, 'x'], false], [{ 0: 'x' }, true]] },
  { description: 'prefixItems + items false', schema: { prefixItems: [{ type: 'integer' }, { type: 'string' }], items: false }, tests: [[[1, 'a'], true], [[1], true], [[1, 'a', 2], false], [['a', 1], false]] },
  { description: 'prefixItems + items schema', schema: { prefixItems: [{}], items: { type: 'integer' } }, tests: [[['x', 1, 2], true], [['x', 'y'], false]] },
  { description: 'items array + additionalItems (draft-07)', draft: 'draft-07', schema: { items: [{}, {}], additionalItems: { type: 'integer' } }, tests: [[[null, null, 1], true], [[null, null, 'x'], false], [[null], true]] },
  { description: 'additionalItems ignored without items array (draft-07)', draft: 'draft-07', schema: { items: {}, additionalItems: false }, tests: [[[1, 2, 3], true]] },
  { description: 'minItems / maxItems', schema: { minItems: 1, maxItems: 2 }, tests: [[[1], true], [[], false], [[1, 2, 3], false]] },
  { description: 'contains', schema: { contains: { minimum: 5 } }, tests: [[[3, 4, 5], true], [[2, 3], false], [[], false], ['x', true]] },
  { description: 'minContains / maxContains', schema: { contains: { const: 1 }, minContains: 2, maxContains: 3 }, tests: [[[1, 1], true], [[1], false], [[1, 1, 1, 1], false]] },
  { description: 'minContains 0', schema: { contains: { const: 1 }, minContains: 0 }, tests: [[[], true], [[2], true]] },
  { description: 'maxContains ignored in draft-07', draft: 'draft-07', schema: { contains: { const: 1 }, maxContains: 1 }, tests: [[[1, 1], true]] },
  { description: 'uniqueItems', schema: { uniqueItems: true }, tests: [[[1, 2], true], [[1, 1], false], [[1, 1.0], false], [[{ a: 1, b: 2 }, { b: 2, a: 1 }], false], [[1, true], true], [[0, false], true], [[[1], [true]], true], [[{}, []], true]] },
  { description: 'properties', schema: { properties: { foo: { type: 'integer' }, bar: { type: 'string' } } }, tests: [[{ foo: 1, bar: 'b' }, true], [{ foo: 'x' }, false], [{}, true], [[], true]] },
  { description: 'properties with escaped names', schema: { properties: { 'foo\nbar': { type: 'number' }, 'foo"bar': { type: 'number' } } }, tests: [[{ 'foo\nbar': 1, 'foo"bar': 1 }, true], [{ 'foo\nbar': '1' }, false]] },
  { description: '__proto__ property', schema: { required: ['__proto__'] }, tests: [[JSON.parse('{"__proto__": 1}'), true], [{}, false]] },
  { description: 'patternProperties', schema: { patternProperties: { 'f.*o': { type: 'integer' } } }, tests: [[{ foo: 1, foooooo: 2 }, true], [{ foo: 'bar' }, false]] },
  { description: 'additionalProperties false', schema: { properties: { foo: {} }, patternProperties: { '^v': {} }, additionalProperties: false }, tests: [[{ foo: 1, vroom: 2 }, true], [{ foo: 1, bar: 2 }, false]] },
  { description: 'additionalProperties schema', schema: { properties: { foo: {} }, additionalProperties: { type: 'boolean' } }, tests: [[{ foo: 1, bar: true }, true], [{ foo: 1, bar: 1 }, false]] },
  { description: 'propertyNames', schema: { propertyNames: { maxLength: 3 } }, tests: [[{ f: 1, foo: 1 }, true], [{ fooo: 1 }, false], [{}, true]] },
  { description: 'propertyNames false', schema: { propertyNames: false }, tests: [[{}, true], [{ a: 1 }, false]] },
  { description: 'required', schema: { required: ['foo'] }, tests: [[{ foo: 1 }, true], [{ bar: 1 }, false], ['foo', true]] },
  { description: 'dependentRequired', schema: { dependentRequired: { bar: ['foo'] } }, tests: [[{}, true], [{ foo: 1 }, true], [{ bar: 1 }, false], [{ foo: 1, bar: 1 }, true]] },
  { description: 'dependentSchemas', schema: { dependentSchemas: { bar: { properties: { foo: { type: 'integer' } } } } }, tests: [[{ bar: 1, foo: 1 }, true], [{ bar: 1, foo: 'x' }, false], [{ foo: 'x' }, true]] },
  { description: 'dependencies (draft-07)', draft: 'draft-07', schema: { dependencies: { bar: ['foo'], baz: { required: ['qux'] } } }, tests: [[{ bar: 1, foo: 1 }, true], [{ bar: 1 }, false], [{ baz: 1 }, false], [{ baz: 1, qux: 1 }, true]] },
  { description: 'min/maxProperties', schema: { minProperties: 1, maxProperties: 2 }, tests: [[{ a: 1 }, true], [{}, false], [{ a: 1, b: 2, c: 3 }, false]] },
  { description: 'allOf', schema: { allOf: [{ properties: { bar: { type: 'integer' } }, required: ['bar'] }, { required: ['foo'] }] }, tests: [[{ foo: 'b', bar: 2 }, true], [{ foo: 'b' }, false], [{ bar: 2 }, false]] },
  { description: 'anyOf', schema: { anyOf: [{ type: 'integer' }, { minimum: 2 }] }, tests: [[1, true], [2.5, true], [3, true], [1.5, false]] },
  { description: 'oneOf', schema: { oneOf: [{ type: 'integer' }, { minimum: 2 }] }, tests: [[1, true], [2.5, true], [3, false], [1.5, false]] },
  { description: 'oneOf with boolean schemas', schema: { oneOf: [true, false, false] }, tests: [['x', true]] },
  { description: 'not', schema: { not: { type: 'integer' } }, tests: [['foo', true], [1, false]] },
  { description: 'if/then/else', schema: { if: { exclusiveMaximum: 0 }, then: { minimum: -10 }, else: { multipleOf: 2 } }, tests: [[-1, true], [-100, false], [4, true], [3, false]] },
  { description: 'if without then/else', schema: { if: { const: 0 } }, tests: [[0, true], [1, true]] },
  { description: '$ref to root (recursive)', schema: { properties: { foo: { $ref: '#' } }, additionalProperties: false }, tests: [[{ foo: false }, true], [{ foo: { foo: false } }, true], [{ bar: false }, false], [{ foo: { bar: false } }, false]] },
  { description: '$ref to $defs', schema: { $defs: { a: { type: 'integer' } }, properties: { x: { $ref: '#/$defs/a' } } }, tests: [[{ x: 1 }, true], [{ x: 'a' }, false]] },
  { description: '$ref with escaped pointer', schema: { $defs: { 'tilde~field': { type: 'integer' }, 'slash/field': { type: 'integer' }, 'percent%field': { type: 'integer' } }, properties: { t: { $ref: '#/$defs/tilde~0field' }, s: { $ref: '#/$defs/slash~1field' }, p: { $ref: '#/$defs/percent%25field' } } }, tests: [[{ t: 1, s: 1, p: 1 }, true], [{ t: 'x' }, false], [{ s: 'x' }, false], [{ p: 'x' }, false]] },
  { description: '$ref siblings apply in 2020-12', schema: { $defs: { a: { type: 'integer' } }, $ref: '#/$defs/a', maximum: 5 }, tests: [[3, true], [10, false]] },
  { description: '$ref siblings ignored in draft-07', draft: 'draft-07', schema: { definitions: { a: { type: 'integer' } }, allOf: [{ $ref: '#/definitions/a', maximum: 5 }] }, tests: [[10, true], ['x', false]] },
  { description: 'recursive tree via $defs', schema: { $ref: '#/$defs/node', $defs: { node: { type: 'object', properties: { value: { type: 'number' }, children: { type: 'array', items: { $ref: '#/$defs/node' } } }, required: ['value'] } } }, tests: [[{ value: 1, children: [{ value: 2, children: [] }] }, true], [{ value: 1, children: [{ children: [] }] }, false]] },
  { description: '$anchor', schema: { $ref: '#foo', $defs: { A: { $anchor: 'foo', type: 'integer' } } }, tests: [[1, true], ['a', false]] },
  { description: '$id-based ref', schema: { $id: 'http://example.com/root.json', $defs: { A: { $id: 'nested.json', type: 'integer' } }, properties: { x: { $ref: 'nested.json' }, y: { $ref: 'http://example.com/nested.json' } } }, tests: [[{ x: 1, y: 2 }, true], [{ x: 'a' }, false], [{ y: 'a' }, false]] },
  { description: 'draft-07 #anchor $id', draft: 'draft-07', schema: { allOf: [{ $ref: '#foo' }], definitions: { A: { $id: '#foo', type: 'integer' } } }, tests: [[1, true], ['a', false]] },
  { description: 'format is an annotation by default', schema: { format: 'email' }, tests: [['nope', true]] },
  { description: 'format email', assertFormat: true, schema: { format: 'email' }, tests: [['joe.bloggs@example.com', true], ['2962', false], ['te~st@example.com', true], ['.test@example.com', false], ['test.@example.com', false], ['te..st@example.com', false], ['joe@[127.0.0.1]', true], [12, true]] },
  { description: 'format date', assertFormat: true, schema: { format: 'date' }, tests: [['1963-06-19', true], ['2020-02-29', true], ['2021-02-29', false], ['1998-13-01', false], ['06/19/1963', false], ['1963-6-19', false]] },
  { description: 'format date-time', assertFormat: true, schema: { format: 'date-time' }, tests: [['1963-06-19T08:30:06.283185Z', true], ['1963-06-19t08:30:06z', true], ['1998-12-31T23:59:60Z', true], ['1998-12-31T23:58:60Z', false], ['1963-06-19T08:30:06', false], ['1963-06-19 08:30:06Z', false], ['1990-12-31T15:59:60-08:00', true]] },
  { description: 'format ipv4', assertFormat: true, schema: { format: 'ipv4' }, tests: [['192.168.0.1', true], ['127.0.0.0.1', false], ['256.256.256.256', false], ['087.10.0.1', false], ['1', false]] },
  { description: 'format ipv6', assertFormat: true, schema: { format: 'ipv6' }, tests: [['::1', true], ['::', true], ['12345::', false], ['1:1:1:1:1:1:1:1:1', false], ['::ffff:192.168.0.1', true], ['1::2::3', false], ['fe80::a%eth1', false], ['1:2:3:4:5:6:7:8', true]] },
  { description: 'format uuid', assertFormat: true, schema: { format: 'uuid' }, tests: [['2EB8AA08-AA98-11EA-B4AA-73B441D16380', true], ['2eb8aa08-aa98-11ea-b4aa-73b441d1638', false], ['2eb8aa08aa9811eab4aa73b441d16380', false]] },
  { description: 'format uri', assertFormat: true, schema: { format: 'uri' }, tests: [['http://foo.bar/?baz=qux#quux', true], ['urn:isbn:0451450523', true], ['//foo.bar/?baz=qux#quux', false], ['http:// shouldfail.com', false], ['http://a/%zz', false]] },
  { description: 'unknown format ignored', assertFormat: true, schema: { format: 'hostname-ish' }, tests: [['anything', true]] },
];

describe('JSON-Schema-Test-Suite subset', () => {
  for (const g of SUITE) {
    describe(g.description, () => {
      it.each(g.tests.map(([data, valid], i) => [i, data, valid] as const))('#%i', (_i, data, valid) => {
        const r = validate(g.schema, data, { draft: g.draft ?? '2020-12', assertFormat: g.assertFormat });
        expect(r.valid, JSON.stringify(r.errors)).toBe(valid);
      });
    });
  }
});

describe('error details', () => {
  it('reports instance path, schema path and a message', () => {
    const schema = {
      type: 'object',
      properties: { user: { type: 'object', properties: { age: { type: 'integer', minimum: 0 }, 'a/b': { type: 'string' } }, required: ['name'] } },
    };
    const r = validate(schema, { user: { age: -1, 'a/b': 1 } });
    expect(r.valid).toBe(false);
    expect(r.errors).toEqual([
      { instancePath: '/user', schemaPath: '#/properties/user/required', keyword: 'required', message: 'Missing required property "name"' },
      { instancePath: '/user/age', schemaPath: '#/properties/user/properties/age/minimum', keyword: 'minimum', message: 'Must be ≥ 0' },
      { instancePath: '/user/a~1b', schemaPath: '#/properties/user/properties/a~1b/type', keyword: 'type', message: 'Expected type "string" but got integer' },
    ]);
  });

  it('points at the resolved $ref target', () => {
    const r = validate({ $defs: { n: { type: 'number' } }, items: { $ref: '#/$defs/n' } }, [1, 'x']);
    expect(r.errors[0]).toMatchObject({ instancePath: '/1', schemaPath: '#/$defs/n/type' });
  });

  it('says remote refs are not fetched', () => {
    const r = validate({ $ref: 'https://example.com/other.json' }, 1);
    expect(r.valid).toBe(false);
    expect(r.errors[0].message).toMatch(/remote schemas aren’t fetched/);
  });

  it('stops $ref loops', () => {
    const r = validate({ $defs: { a: { $ref: '#/$defs/b' }, b: { $ref: '#/$defs/a' } }, $ref: '#/$defs/a' }, 1);
    expect(r.valid).toBe(false);
    expect(r.errors[0].message).toMatch(/too deep/);
  });

  it('caps the error list', () => {
    const r = validate({ items: { type: 'string' } }, Array.from({ length: 30 }, (_, i) => i), { maxErrors: 10 });
    expect(r.errors).toHaveLength(10);
    expect(r.truncated).toBe(true);
  });

  it('reports invalid patterns', () => {
    expect(validate({ pattern: '(' }, 'x').errors[0].message).toMatch(/isn’t a valid regular expression/);
    expect(validate({ pattern: '^[\\w-]+$' }, 'a-b').valid).toBe(true); // falls back to non-unicode mode
  });

  it('detects the draft', () => {
    expect(detectDraft({ $schema: 'http://json-schema.org/draft-07/schema#' }).draft).toBe('draft-07');
    expect(detectDraft({ $schema: 'http://json-schema.org/draft-04/schema#' })).toMatchObject({ draft: 'draft-07', notice: expect.any(String) });
    expect(detectDraft({}).draft).toBe('2020-12');
    expect(validate({ $schema: 'http://json-schema.org/draft-07/schema#', items: [{ type: 'string' }] }, [1]).draft).toBe('draft-07');
    expect(validate({ unevaluatedProperties: false }, {}).notices[0]).toMatch(/unevaluatedProperties/);
  });

  it('checks multipleOf with decimals', () => {
    expect(isMultiple(4.5, 1.5)).toBe(true);
    expect(isMultiple(1e-7 * 3, 1e-7)).toBe(true);
    expect(isMultiple(10, 3)).toBe(false);
    expect(FORMATS.date('2000-02-29')).toBe(true);
  });
});

describe('inferSchema', () => {
  it('infers nested objects and merges array items', () => {
    const sample = {
      id: 1,
      name: 'Ada',
      score: 9.5,
      email: 'ada@example.com',
      tags: ['a', 'b'],
      friends: [
        { id: 2, nick: 'b' },
        { id: 3.5, since: '2020-01-01' },
      ],
      empty: [],
      mixed: [1, 'x', null],
      nothing: null,
    };
    const schema = inferSchema(sample);
    expect(schema).toEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        score: { type: 'number' },
        email: { type: 'string', format: 'email' },
        tags: { type: 'array', items: { type: 'string' } },
        friends: {
          type: 'array',
          items: {
            type: 'object',
            properties: { id: { type: 'number' }, nick: { type: 'string' }, since: { type: 'string', format: 'date' } },
            required: ['id'],
          },
        },
        empty: { type: 'array' },
        mixed: { type: 'array', items: { type: ['integer', 'string', 'null'] } },
        nothing: { type: 'null' },
      },
      required: ['id', 'name', 'score', 'email', 'tags', 'friends', 'empty', 'mixed', 'nothing'],
    });
    expect(validate(schema, sample, { assertFormat: true }).valid).toBe(true);
  });

  it('uses anyOf for mixed structured types and supports draft-07', () => {
    const s = inferSchema([{ a: 1 }, [1]], 'draft-07');
    expect(s.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(s.items).toEqual({ anyOf: [{ type: 'object', properties: { a: { type: 'integer' } }, required: ['a'] }, { type: 'array', items: { type: 'integer' } }] });
  });
});
