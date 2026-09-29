import { describe, expect, it } from 'vitest';
import { parseJson } from '../../../src/tools/json-formatter/features/json';
import { generateTypes, pascalCase, propertyKey, singularize, type TypegenOptions } from '../../../src/tools/json-to-typescript/features/typegen';

const defaults: TypegenOptions = { rootName: 'Root', style: 'interface', exported: true, readonly: false };

function gen(json: string, options: Partial<TypegenOptions> = {}) {
  const r = parseJson(json);
  if (!r.ok) throw new Error(r.error.message);
  return generateTypes(r.value, { ...defaults, ...options });
}

describe('generateTypes', () => {
  it('types a flat object', () => {
    expect(gen('{"id":1,"name":"Ann","active":true,"note":null}').code).toBe(
      'export interface Root {\n  id: number;\n  name: string;\n  active: boolean;\n  note: null;\n}\n',
    );
  });

  it('supports type aliases, no export and readonly', () => {
    expect(gen('{"tags":["a"]}', { style: 'type', exported: false, readonly: true }).code).toBe(
      'type Root = {\n  readonly tags: readonly string[];\n};\n',
    );
  });

  it('merges array items, marking missing keys optional and nulls as unions', () => {
    const { code } = gen('{"users":[{"id":1,"email":"a@x"},{"id":2,"email":null,"age":30}]}');
    expect(code).toBe(
      'export interface Root {\n  users: User[];\n}\n\nexport interface User {\n  id: number;\n  email: string | null;\n  age?: number;\n}\n',
    );
  });

  it('builds union arrays for mixed items and unknown[] for empty arrays', () => {
    const { code } = gen('{"mixed":[1,"a",null],"none":[],"nested":[[1],[2,"x"]]}');
    expect(code).toContain('mixed: (string | number | null)[];');
    expect(code).toContain('none: unknown[];');
    expect(code).toContain('nested: (string | number)[][];');
  });

  it('dedupes identical nested shapes into one named type', () => {
    const { code, declarations } = gen('{"billing":{"street":"a","zip":"1"},"shipping":{"zip":"2","street":"b"}}');
    expect(declarations).toBe(2);
    expect(code).toContain('billing: Billing;');
    expect(code).toContain('shipping: Billing;');
  });

  it('gives distinct shapes with the same key distinct names', () => {
    const { code } = gen('{"a":{"item":{"x":1}},"b":{"item":{"y":1}}}');
    expect(code).toContain('export interface Item {');
    expect(code).toContain('export interface Item2 {');
  });

  it('quotes keys that are not identifiers', () => {
    const { code } = gen('{"first-name":"a","2fa":true,"ok_key":1,"a b":null,"quote\\"d":0}');
    expect(code).toContain('"first-name": string;');
    expect(code).toContain('"2fa": boolean;');
    expect(code).toContain('ok_key: number;');
    expect(code).toContain('"a b": null;');
    expect(code).toContain('"quote\\"d": number;');
  });

  it('handles array and primitive roots', () => {
    expect(gen('[{"id":1}]', { rootName: 'users' }).code).toBe('export type Users = User[];\n\nexport interface User {\n  id: number;\n}\n');
    expect(gen('[{"id":1}]').code).toContain('export type Root = RootItem[];');
    expect(gen('"x"').code).toBe('export type Root = string;\n');
    expect(gen('[]').code).toBe('export type Root = unknown[];\n');
    expect(gen('{}').code).toBe('export type Root = Record<string, unknown>;\n');
  });

  it('merges objects with null in arrays into a nullable union', () => {
    expect(gen('{"items":[{"a":1},null]}').code).toContain('items: (Item | null)[];');
  });

  it('flags ISO date strings', () => {
    expect(gen('{"at":"2024-05-01T10:00:00Z"}').hasDates).toBe(true);
    expect(gen('{"at":"yesterday"}').hasDates).toBe(false);
  });

  it('avoids shadowing global names', () => {
    expect(gen('{"date":{"d":1}}').code).toContain('date: DateType;');
  });

  it('bounds very deep nesting with unknown', () => {
    const deep = '['.repeat(400) + ']'.repeat(400);
    expect(gen(deep).code).toContain('unknown');
  });
});

describe('naming helpers', () => {
  it('pascal-cases keys', () => {
    expect(pascalCase('user_profile')).toBe('UserProfile');
    expect(pascalCase('user-profile')).toBe('UserProfile');
    expect(pascalCase('userProfile')).toBe('UserProfile');
    expect(pascalCase('123')).toBe('T123');
    expect(pascalCase('!!')).toBe('Type');
  });

  it('singularizes common plurals', () => {
    expect(singularize('users')).toBe('user');
    expect(singularize('categories')).toBe('category');
    expect(singularize('addresses')).toBe('address');
    expect(singularize('boxes')).toBe('box');
    expect(singularize('people')).toBe('person');
    expect(singularize('status')).toBe('status');
    expect(singularize('data')).toBe('data');
    expect(singularize('orderItems')).toBe('orderItem');
  });

  it('quotes property keys only when needed', () => {
    expect(propertyKey('abc')).toBe('abc');
    expect(propertyKey('$x_1')).toBe('$x_1');
    expect(propertyKey('a-b')).toBe('"a-b"');
    expect(propertyKey('')).toBe('""');
  });
});
