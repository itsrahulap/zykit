import { describe, expect, test } from 'vitest';
import {
  loadSchema,
  exportSchema,
  emptyNode,
  addProperty,
  removeProperty,
  updateProperty,
  moveProperty,
  type PropertyNode,
} from '../../../src/tools/json-schema/features/schema-builder';

// ---------------------------------------------------------------------------
// loadSchema → builder model

describe('loadSchema', () => {
  test('returns null for non-object schemas', () => {
    expect(loadSchema(null)).toBeNull();
    expect(loadSchema('string')).toBeNull();
    expect(loadSchema(42)).toBeNull();
    expect(loadSchema([])).toBeNull();
  });

  test('returns null when composition keywords are present', () => {
    expect(loadSchema({ allOf: [] })).toBeNull();
    expect(loadSchema({ anyOf: [] })).toBeNull();
    expect(loadSchema({ oneOf: [] })).toBeNull();
    expect(loadSchema({ $ref: '#/$defs/foo' })).toBeNull();
    expect(loadSchema({ not: {} })).toBeNull();
    expect(loadSchema({ if: {}, then: {} })).toBeNull();
    expect(loadSchema({ $defs: {} })).toBeNull();
  });

  test('loads a simple object schema', () => {
    const schema = {
      type: 'object',
      description: 'A user',
      properties: {
        id: { type: 'integer', minimum: 1 },
        name: { type: 'string', minLength: 1 },
      },
      required: ['id'],
      additionalProperties: false,
    };
    const result = loadSchema(schema);
    expect(result).not.toBeNull();
    const root = result!.root;
    expect(root.type).toBe('object');
    expect(root.description).toBe('A user');
    expect(root.additionalProperties).toBe(false);
    expect(root.properties).toHaveLength(2);

    const id = root.properties[0];
    expect(id.name).toBe('id');
    expect(id.type).toBe('integer');
    expect(id.minimum).toBe('1');
    expect(id.required).toBe(true);

    const name = root.properties[1];
    expect(name.name).toBe('name');
    expect(name.type).toBe('string');
    expect(name.minLength).toBe('1');
    expect(name.required).toBe(false);
  });

  test('loads string constraints', () => {
    const schema = { type: 'string', minLength: 2, maxLength: 10, pattern: '^[A-Z]', format: 'email' };
    const result = loadSchema(schema);
    expect(result).not.toBeNull();
    const root = result!.root;
    expect(root.type).toBe('string');
    expect(root.minLength).toBe('2');
    expect(root.maxLength).toBe('10');
    expect(root.pattern).toBe('^[A-Z]');
    expect(root.format).toBe('email');
  });

  test('loads number constraints', () => {
    const schema = { type: 'number', minimum: 0, maximum: 100, exclusiveMinimum: -1, multipleOf: 5 };
    const result = loadSchema(schema);
    expect(result).not.toBeNull();
    const root = result!.root;
    expect(root.minimum).toBe('0');
    expect(root.maximum).toBe('100');
    expect(root.exclusiveMinimum).toBe('-1');
    expect(root.multipleOf).toBe('5');
  });

  test('loads nullable from type array', () => {
    const result = loadSchema({ type: ['string', 'null'] });
    expect(result).not.toBeNull();
    expect(result!.root.type).toBe('string');
    expect(result!.root.nullable).toBe(true);
  });

  test('loads array schema with items', () => {
    const schema = { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 5, uniqueItems: true };
    const result = loadSchema(schema);
    expect(result).not.toBeNull();
    const root = result!.root;
    expect(root.type).toBe('array');
    expect(root.items).not.toBeNull();
    expect(root.items!.type).toBe('string');
    expect(root.minItems).toBe('1');
    expect(root.maxItems).toBe('5');
    expect(root.uniqueItems).toBe(true);
  });

  test('loads enum values', () => {
    const schema = { type: 'string', enum: ['a', 'b', 'c'] };
    const result = loadSchema(schema);
    expect(result!.root.enumValues).toBe('"a"\n"b"\n"c"');
  });

  test('loads const', () => {
    const schema = { type: 'string', const: 'admin' };
    const result = loadSchema(schema);
    expect(result!.root.constValue).toBe('"admin"');
  });

  test('tracks unsupported root keys', () => {
    const schema = { type: 'string', 'x-custom': 'value', deprecated: true };
    const result = loadSchema(schema);
    expect(result!.unsupportedRootKeys).toContain('x-custom');
    expect(result!.unsupportedRootKeys).toContain('deprecated');
  });

  test('tracks unsupported property keys in unsupportedKeys', () => {
    const schema = {
      type: 'object',
      properties: { name: { type: 'string', writeOnly: true } },
    };
    const result = loadSchema(schema);
    expect(result!.root.properties[0].unsupportedKeys).toContain('writeOnly');
  });

  test('loads nested object', () => {
    const schema = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: { city: { type: 'string' } },
          required: ['city'],
        },
      },
    };
    const result = loadSchema(schema);
    const address = result!.root.properties[0];
    expect(address.type).toBe('object');
    expect(address.properties[0].name).toBe('city');
    expect(address.properties[0].required).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// exportSchema → JSON schema round-trip

describe('exportSchema', () => {
  test('exports a simple object schema', () => {
    const root = emptyNode('', 'object');
    root.description = 'Test';
    root.additionalProperties = false;
    const child = emptyNode('id', 'integer');
    child.required = true;
    child.minimum = '1';
    root.properties = [child];

    const out = exportSchema(root);
    expect(out.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(out.type).toBe('object');
    expect(out.description).toBe('Test');
    expect(out.additionalProperties).toBe(false);
    expect(out.required).toEqual(['id']);
    const props = out.properties as Record<string, unknown>;
    expect(props['id']).toMatchObject({ type: 'integer', minimum: 1 });
  });

  test('exports nullable as type array', () => {
    const root = emptyNode('', 'string');
    root.nullable = true;
    const out = exportSchema(root);
    expect(out.type).toEqual(['string', 'null']);
  });

  test('does not emit empty string constraints', () => {
    const root = emptyNode('', 'string');
    // all constraint strings are '' by default
    const out = exportSchema(root);
    expect(out.minLength).toBeUndefined();
    expect(out.maxLength).toBeUndefined();
    expect(out.pattern).toBeUndefined();
    expect(out.format).toBeUndefined();
  });

  test('exports enum values parsed from newline-separated JSON', () => {
    const root = emptyNode('', 'string');
    root.enumValues = '"red"\n"green"\n"blue"';
    const out = exportSchema(root);
    expect(out.enum).toEqual(['red', 'green', 'blue']);
  });

  test('skips malformed enum lines without throwing', () => {
    const root = emptyNode('', 'string');
    root.enumValues = '"ok"\nnot-json\n42';
    const out = exportSchema(root);
    expect(out.enum).toEqual(['ok', 42]);
  });

  test('exports const', () => {
    const root = emptyNode('', 'string');
    root.constValue = '"admin"';
    const out = exportSchema(root);
    expect(out.const).toBe('admin');
  });

  test('exports array items', () => {
    const root = emptyNode('', 'array');
    root.items = emptyNode('', 'integer');
    root.minItems = '1';
    root.uniqueItems = true;
    const out = exportSchema(root);
    expect((out.items as Record<string, unknown>).type).toBe('integer');
    expect(out.minItems).toBe(1);
    expect(out.uniqueItems).toBe(true);
  });

  test('round-trips: loadSchema → exportSchema gives back the same structure', () => {
    const original = {
      type: 'object',
      description: 'A user',
      properties: {
        id: { type: 'integer', minimum: 1 },
        name: { type: 'string', minLength: 1 },
      },
      required: ['id'],
      additionalProperties: false,
    };
    const loaded = loadSchema(original);
    expect(loaded).not.toBeNull();
    const exported = exportSchema(loaded!.root);
    expect(exported.type).toBe('object');
    expect(exported.description).toBe('A user');
    expect(exported.additionalProperties).toBe(false);
    expect(exported.required).toEqual(['id']);
  });
});

// ---------------------------------------------------------------------------
// Tree mutation helpers

describe('addProperty', () => {
  test('appends a new empty node', () => {
    const props: PropertyNode[] = [];
    const next = addProperty(props);
    expect(next).toHaveLength(1);
    expect(next[0].name).toBe('');
    expect(next[0].type).toBe('string');
  });

  test('does not mutate the original array', () => {
    const props: PropertyNode[] = [emptyNode('a')];
    const next = addProperty(props);
    expect(props).toHaveLength(1);
    expect(next).toHaveLength(2);
  });
});

describe('removeProperty', () => {
  test('removes by id', () => {
    const a = emptyNode('a');
    const b = emptyNode('b');
    expect(removeProperty([a, b], a.id)).toEqual([b]);
  });

  test('is a no-op for unknown id', () => {
    const a = emptyNode('a');
    expect(removeProperty([a], 'nonexistent')).toEqual([a]);
  });
});

describe('updateProperty', () => {
  test('applies patch to matching node', () => {
    const a = emptyNode('a');
    const next = updateProperty([a], a.id, { name: 'b', required: true });
    expect(next[0].name).toBe('b');
    expect(next[0].required).toBe(true);
  });

  test('does not modify other nodes', () => {
    const a = emptyNode('a');
    const b = emptyNode('b');
    const next = updateProperty([a, b], a.id, { name: 'c' });
    expect(next[1].name).toBe('b');
  });
});

describe('moveProperty', () => {
  test('moves up', () => {
    const a = emptyNode('a');
    const b = emptyNode('b');
    const next = moveProperty([a, b], b.id, 'up');
    expect(next[0].name).toBe('b');
    expect(next[1].name).toBe('a');
  });

  test('moves down', () => {
    const a = emptyNode('a');
    const b = emptyNode('b');
    const next = moveProperty([a, b], a.id, 'down');
    expect(next[0].name).toBe('b');
    expect(next[1].name).toBe('a');
  });

  test('no-op when already at boundary', () => {
    const a = emptyNode('a');
    const b = emptyNode('b');
    expect(moveProperty([a, b], a.id, 'up')).toEqual([a, b]);
    expect(moveProperty([a, b], b.id, 'down')).toEqual([a, b]);
  });
});
