import { describe, expect, it } from 'vitest';
import { parseJson, type JsonNode } from '../../../src/tools/json-formatter/features/json';
import {
  ancestors,
  childCount,
  expandToDepth,
  findPath,
  flatten,
  jsAccess,
  jsonPath,
  jsonPointer,
  parsePath,
  nodeType,
  searchTree,
  truncate,
  valueText,
} from '../../../src/tools/json-tree-viewer/features/json-tree-viewer';

const root = (text: string): JsonNode => {
  const r = parseJson(text);
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
};
const DOC = '{"a":[{"b":1},"x"],"my key":{"it\'s":null},"n":12345678901234567890}';

describe('flatten and expansion', () => {
  it('shows only the root when collapsed and children when expanded', () => {
    const r = root(DOC);
    expect(flatten(r, new Set()).rows).toHaveLength(1);
    expect(flatten(r, new Set([r])).rows.map((f) => f.key)).toEqual([null, 'a', 'my key', 'n']);
  });
  it('expands to a depth', () => {
    const r = root(DOC);
    expect(flatten(r, expandToDepth(r, 1)).rows).toHaveLength(4);
    expect(flatten(r, expandToDepth(r, 2)).rows).toHaveLength(7); // + a[0], a[1] and "it's"
    expect(flatten(r, expandToDepth(r, 9)).rows).toHaveLength(8);
  });
  it('caps rows', () => {
    const r = root('[1,2,3,4,5]');
    const { rows, truncated } = flatten(r, new Set([r]), 3);
    expect(rows).toHaveLength(3);
    expect(truncated).toBe(true);
  });
  it('handles very deep documents without recursion', () => {
    const r = root('['.repeat(50000) + ']'.repeat(50000));
    expect(flatten(r, expandToDepth(r, 100000)).rows).toHaveLength(50000);
  });
});

describe('jsonPath', () => {
  it('builds dotted, indexed and quoted paths', () => {
    const r = root(DOC);
    const rows = flatten(r, expandToDepth(r, 9)).rows;
    const paths = rows.map(jsonPath);
    expect(paths).toContain('$');
    expect(paths).toContain('$.a[0].b');
    expect(paths).toContain("$['my key']");
    expect(paths).toContain("$['my key']['it\\'s']");
    expect(paths).toContain('$.n');
  });
});

describe('types, counts and values', () => {
  it('classifies nodes', () => {
    const r = root('[{}, [], "s", 1, true, null]');
    if (r.type !== 'array') throw new Error();
    expect(r.items.map(nodeType)).toEqual(['object', 'array', 'string', 'number', 'boolean', 'null']);
    expect(childCount(r)).toBe(6);
  });
  it('copies decoded strings, exact numbers and formatted containers', () => {
    const r = root('{"s":"a\\nb \\u00fc","n":12345678901234567890,"o":{"x":1}}');
    if (r.type !== 'object') throw new Error();
    const [s, n, o] = r.entries.map((e) => e.value);
    expect(valueText(s)).toBe('a\nb ü');
    expect(valueText(n)).toBe('12345678901234567890');
    expect(valueText(o)).toBe('{\n  "x": 1\n}');
  });
  it('truncates without splitting surrogate pairs', () => {
    expect(truncate('abcdef', 3)).toEqual({ text: 'abc', cut: true });
    expect(truncate('abc', 3)).toEqual({ text: 'abc', cut: false });
    expect(truncate('ab😀', 3)).toEqual({ text: 'ab', cut: true });
  });
});

describe('searchTree', () => {
  it('matches keys and values case-insensitively in document order', () => {
    const r = root('{"Name":"Ada","pets":[{"name":"Rex"},"NAMEless"],"age":3}');
    const { matches } = searchTree(r, 'name');
    expect(matches.map(jsonPath)).toEqual(['$.Name', '$.pets[0].name', '$.pets[1]']);
  });
  it('searches number and literal text, and escaped strings by their decoded text', () => {
    const r = root('{"a":12345,"b":true,"c":"x\\ty"}');
    expect(searchTree(r, '234').matches.map(jsonPath)).toEqual(['$.a']);
    expect(searchTree(r, 'true').matches.map(jsonPath)).toEqual(['$.b']);
    expect(searchTree(r, 'x\ty').matches.map(jsonPath)).toEqual(['$.c']);
  });
  it('returns the ancestors so the page can expand to a match', () => {
    const r = root('{"a":{"b":{"c":"needle"}}}');
    const [m] = searchTree(r, 'needle').matches;
    expect(ancestors(m)).toHaveLength(3);
    const expanded = new Set(ancestors(m));
    expect(flatten(r, expanded).rows.some((f) => f.node === m.node)).toBe(true);
  });
  it('caps matches and ignores an empty query', () => {
    const r = root('["a","a","a"]');
    expect(searchTree(r, 'a', 2)).toMatchObject({ truncated: true });
    expect(searchTree(r, 'a', 2).matches).toHaveLength(2);
    expect(searchTree(r, '').matches).toEqual([]);
  });
});

describe('path formats and go-to-path', () => {
  const doc = '{"users":[{"first name":"Ada","a/b~c":1,"ünï":2,"it\'s":3,"q\\"x":4}],"":{"e":true},"dup":1,"dup":2}';
  const root = (parseJson(doc) as { ok: true; value: JsonNode }).value;
  const at = (path: (string | number)[]) => {
    const f = findPath(root, path);
    if (typeof f === 'string') throw new Error(f);
    return f;
  };

  it('writes JSONPath, JSON Pointer and optional chaining with escaping', () => {
    const f = at(['users', 0, 'first name']);
    expect(jsonPath(f)).toBe("$.users[0]['first name']");
    expect(jsonPointer(f)).toBe('/users/0/first name');
    expect(jsAccess(f)).toBe('data?.users?.[0]?.["first name"]');
    expect(jsonPointer(at(['users', 0, 'a/b~c']))).toBe('/users/0/a~1b~0c');
    expect(jsAccess(at(['users', 0, 'q"x']))).toBe('data?.users?.[0]?.["q\\"x"]');
    expect(jsonPointer(at([]))).toBe('');
    expect(jsonPointer(at(['', 'e']))).toBe('//e');
  });

  it('round-trips every node through all three formats', () => {
    const keys: (string | number)[][] = [['users'], ['users', 0], ['users', 0, 'first name'], ['users', 0, 'a/b~c'], ['users', 0, 'ünï'], ['users', 0, "it's"], ['users', 0, 'q"x'], ['', 'e'], ['dup']];
    for (const k of keys) {
      const f = at(k);
      for (const p of [jsonPath(f), jsonPointer(f), jsAccess(f)]) {
        if (!p) continue;
        const back = findPath(root, parsePath(p));
        expect(typeof back === 'string' ? back : back.node, p).toBe(f.node);
      }
    }
  });

  it('resolves duplicate keys to the last one and reports missing keys', () => {
    expect(valueText(at(['dup']).node)).toBe('2');
    expect(findPath(root, ['users', 5])).toMatch(/has no item \[5\]/);
    expect(findPath(root, ['nope'])).toMatch(/has no key “nope”/);
    expect(typeof findPath(root, parsePath('/users/0'))).toBe('object');
  });

  it('rejects malformed paths', () => {
    expect(() => parsePath('')).toThrow();
    expect(() => parsePath('$..a')).toThrow();
    expect(() => parsePath("$['open")).toThrow(/never closed/);
    expect(() => parsePath('$[x]')).toThrow();
    expect(() => parsePath('1abc')).toThrow();
  });

  it('limits search to keys or values', () => {
    const r = (parseJson('{"ada":"x","b":"ada"}') as { ok: true; value: JsonNode }).value;
    expect(searchTree(r, 'ada', undefined, 'keys').matches.map((m) => m.key)).toEqual(['ada']);
    expect(searchTree(r, 'ada', undefined, 'values').matches.map((m) => m.key)).toEqual(['b']);
    expect(searchTree(r, 'ada').matches).toHaveLength(2);
  });
});
