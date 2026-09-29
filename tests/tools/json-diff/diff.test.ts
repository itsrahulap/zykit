import { describe, expect, it } from 'vitest';
import { parseJson, type JsonNode } from '../../../src/tools/json-formatter/features/json';
import {
  canonicalNumber,
  changesToJson,
  diffJson,
  formatPath,
  jsonPointer,
  parseIgnoreKeys,
  toJsonPatch,
  type DiffOptions,
} from '../../../src/tools/json-diff/features/diff';

const defaults: DiffOptions = { ignoreArrayOrder: false, numericEquality: false, ignoreKeys: [] };

function node(text: string): JsonNode {
  const r = parseJson(text);
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
}

function run(a: string, b: string, options: Partial<DiffOptions> = {}) {
  return diffJson(node(a), node(b), { ...defaults, ...options });
}

function summary(a: string, b: string, options: Partial<DiffOptions> = {}) {
  return run(a, b, options).changes.map((c) => `${c.kind} ${formatPath(c.path)}`);
}

/** Minimal RFC 6902 applier (add/remove/replace) to check generated patches. */
function applyPatch(doc: unknown, patch: { op: string; path: string; value?: unknown }[]): unknown {
  let root = structuredClone(doc);
  for (const { op, path, value } of patch) {
    if (path === '') {
      root = value;
      continue;
    }
    const parts = path.slice(1).split('/').map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));
    const last = parts.pop()!;
    let target = root as Record<string, unknown> | unknown[];
    for (const p of parts) target = (target as Record<string, unknown>)[p] as Record<string, unknown>;
    if (Array.isArray(target)) {
      const i = last === '-' ? target.length : Number(last);
      if (op === 'add') target.splice(i, 0, value);
      else if (op === 'remove') target.splice(i, 1);
      else target[i] = value;
    } else if (op === 'remove') delete target[last];
    else target[last] = value;
  }
  return root;
}

function roundTrip(a: string, b: string, options: Partial<DiffOptions> = {}) {
  const patch = JSON.parse(toJsonPatch(run(a, b, options).tree));
  return applyPatch(JSON.parse(a), patch);
}

describe('diffJson', () => {
  it('finds added, removed and changed keys by path', () => {
    const r = run('{"a":1,"b":{"c":"x","d":true},"gone":null}', '{"a":1,"b":{"c":"y","d":true},"new":[1]}');
    expect(r.changes.map((c) => `${c.kind} ${formatPath(c.path)}`)).toEqual(['changed $.b.c', 'removed $.gone', 'added $.new']);
    expect(r.unchanged).toBe(2);
  });

  it('ignores key order and formatting', () => {
    expect(summary('{"a":1,"b":2}', '{\n  "b": 2,\n  "a": 1\n}')).toEqual([]);
  });

  it('reports nested array paths', () => {
    expect(summary('{"users":[{"name":"a"},{"name":"b"},{"name":"c"}]}', '{"users":[{"name":"a"},{"name":"b"},{"name":"C"}]}')).toEqual([
      'changed $.users[2].name',
    ]);
  });

  it('aligns arrays so an insertion does not cascade', () => {
    expect(summary('[1,2,3,4]', '[1,9,2,3,4]')).toEqual(['added $[1]']);
    expect(summary('[1,2,3,4]', '[1,3,4]')).toEqual(['removed $[1]']);
  });

  it('can ignore array order', () => {
    expect(summary('[1,2,3]', '[3,1,2]')).not.toEqual([]);
    expect(summary('[1,2,3]', '[3,1,2]', { ignoreArrayOrder: true })).toEqual([]);
    expect(summary('[{"a":1},{"b":2}]', '[{"b":2},{"a":1}]', { ignoreArrayOrder: true })).toEqual([]);
    expect(summary('[1,2,2]', '[2,1]', { ignoreArrayOrder: true })).toEqual(['removed $[2]']);
    expect(summary('[{"id":1,"v":1},5]', '[6,{"id":1,"v":2}]', { ignoreArrayOrder: true })).toEqual([
      'changed $[1].v',
      'removed $[1]',
      'added $[0]',
    ]);
  });

  it('compares numbers by text or by value', () => {
    expect(summary('{"n":1}', '{"n":1.0}')).toEqual(['changed $.n']);
    expect(summary('{"n":1}', '{"n":1.0}', { numericEquality: true })).toEqual([]);
    expect(summary('[100, 0.5, 12345678901234567890]', '[1e2, 5E-1, 12345678901234567890.0]', { numericEquality: true })).toEqual([]);
    expect(summary('[12345678901234567890]', '[12345678901234567891]', { numericEquality: true })).toEqual(['changed $[0]']);
  });

  it('compares decoded strings', () => {
    expect(summary('["A"]', '["\\u0041"]')).toEqual([]);
  });

  it('ignores listed keys at any depth', () => {
    expect(summary('{"id":1,"meta":{"updatedAt":1}}', '{"id":1,"meta":{"updatedAt":2}}', { ignoreKeys: ['updatedAt'] })).toEqual([]);
  });

  it('treats type changes as changes', () => {
    expect(summary('{"a":[1]}', '{"a":{"0":1}}')).toEqual(['changed $.a']);
    expect(summary('1', '"1"')).toEqual(['changed $']);
  });

  it('quotes odd keys in paths', () => {
    expect(formatPath(['a b', 0, 'ok', ''])).toBe('$["a b"][0].ok[""]');
  });
});

describe('JSON Patch', () => {
  it('escapes pointers', () => {
    expect(jsonPointer(['a/b', 'c~d', 3])).toBe('/a~1b/c~0d/3');
  });

  it('produces patches that transform left into right', () => {
    const cases: [string, string][] = [
      ['{"a":1,"b":{"c":"x"},"gone":null}', '{"a":2,"b":{"c":"x","d":[1]},"new":true}'],
      ['[1,2,3,4]', '[1,9,2,4,5]'],
      ['[1,2,3]', '[]'],
      ['[]', '[{"x":1},2]'],
      ['{"users":[{"n":"a"},{"n":"b"}]}', '{"users":[{"n":"b"},{"n":"c"},{"n":"a"}]}'],
      ['1', '{"a":1}'],
      ['{"a/b":{"~":1}}', '{"a/b":{"~":2}}'],
    ];
    for (const [a, b] of cases) expect(roundTrip(a, b), `${a} → ${b}`).toEqual(JSON.parse(b));
  });

  it('with ignored array order, yields an equivalent document', () => {
    const out = roundTrip('[3,{"id":1,"v":1},5]', '[6,{"id":1,"v":2},3]', { ignoreArrayOrder: true }) as unknown[];
    expect(out).toHaveLength(3);
    expect(out).toEqual(expect.arrayContaining([6, { id: 1, v: 2 }, 3]));
  });

  it('keeps big numbers exact in values', () => {
    expect(toJsonPatch(run('{"a":1}', '{"a":12345678901234567890}').tree)).toContain('"value": 12345678901234567890');
  });

  it('is empty for equal documents', () => {
    expect(toJsonPatch(run('{"a":[1]}', '{"a":[1]}').tree)).toBe('[]');
  });
});

describe('helpers', () => {
  it('canonicalises numbers exactly', () => {
    expect(canonicalNumber('1')).toBe(canonicalNumber('1.0'));
    expect(canonicalNumber('100')).toBe(canonicalNumber('1e2'));
    expect(canonicalNumber('-0.50')).toBe(canonicalNumber('-5e-1'));
    expect(canonicalNumber('0')).toBe(canonicalNumber('0.000'));
    expect(canonicalNumber('1')).not.toBe(canonicalNumber('10'));
  });

  it('parses ignore-key lists', () => {
    expect(parseIgnoreKeys(' id, updatedAt ,,x ')).toEqual(['id', 'updatedAt', 'x']);
  });

  it('summarises changes as JSON', () => {
    const json = JSON.parse(changesToJson(run('{"a":1,"b":2}', '{"a":3,"c":4}').changes));
    expect(json).toEqual([
      { type: 'changed', path: '$.a', from: 1, to: 3 },
      { type: 'removed', path: '$.b', value: 2 },
      { type: 'added', path: '$.c', value: 4 },
    ]);
  });
});
