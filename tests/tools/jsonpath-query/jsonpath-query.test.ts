import { describe, expect, it } from 'vitest';
import { evaluate, iRegexpToJs, normalizedPath, parseQuery } from '../../../src/tools/jsonpath-query/features/jsonpath';
import { BOOKSTORE, EXAMPLES, runQuery } from '../../../src/tools/jsonpath-query/features/jsonpath-query';

const store = JSON.parse(BOOKSTORE) as unknown;
const values = (q: string, doc: unknown = store) => evaluate(q, doc).map((m) => m.value);
const paths = (q: string, doc: unknown = store) => evaluate(q, doc).map((m) => m.path);

describe('RFC 9535 Table 2 (bookstore)', () => {
  it('runs the overview examples', () => {
    expect(values('$.store.book[*].author')).toEqual(['Nigel Rees', 'Evelyn Waugh', 'Herman Melville', 'J. R. R. Tolkien']);
    expect(values('$..author')).toEqual(['Nigel Rees', 'Evelyn Waugh', 'Herman Melville', 'J. R. R. Tolkien']);
    expect(paths('$.store.*')).toEqual(["$['store']['book']", "$['store']['bicycle']"]);
    expect(values('$.store..price')).toEqual([8.95, 12.99, 8.99, 22.99, 399]);
    expect(paths('$..book[2]')).toEqual(["$['store']['book'][2]"]);
    expect(values('$..book[2].author')).toEqual(['Herman Melville']);
    expect(values('$..book[2].publisher')).toEqual([]);
    expect(paths('$..book[-1]')).toEqual(["$['store']['book'][3]"]);
    expect(paths('$..book[0,1]')).toEqual(["$['store']['book'][0]", "$['store']['book'][1]"]);
    expect(paths('$..book[:2]')).toEqual(["$['store']['book'][0]", "$['store']['book'][1]"]);
    expect(paths('$..book[?@.isbn]')).toEqual(["$['store']['book'][2]", "$['store']['book'][3]"]);
    expect(paths('$..book[?@.price<10]')).toEqual(["$['store']['book'][0]", "$['store']['book'][2]"]);
    expect(values('$..*')).toHaveLength(27);
  });

  it('every built-in example parses and runs', () => {
    for (const ex of EXAMPLES) {
      const r = runQuery(BOOKSTORE, ex.query);
      expect(r.ok, ex.query).toBe(true);
      if (r.ok) expect(r.total, ex.query).toBeGreaterThan(0);
    }
  });
});

describe('selectors', () => {
  it('name selector (§2.3.1.3)', () => {
    const doc = { o: { 'j j': { 'k.k': 3 } }, "'": { '@': 2 } };
    expect(values("$.o['j j']", doc)).toEqual([{ 'k.k': 3 }]);
    expect(values("$.o['j j']['k.k']", doc)).toEqual([3]);
    expect(values('$.o["j j"]["k.k"]', doc)).toEqual([3]);
    expect(values('$["\'"]["@"]', doc)).toEqual([2]);
    expect(values("$['\\u0061']", { a: 1 })).toEqual([1]);
    expect(values("$['\\ud83d\\ude00']", { '😀': 1 })).toEqual([1]);
    expect(values('$.日本', { 日本: 1 })).toEqual([1]);
  });

  it('wildcard (§2.3.2.3)', () => {
    const doc = { o: { j: 1, k: 2 }, a: [5, 3] };
    expect(values('$[*]', doc)).toEqual([{ j: 1, k: 2 }, [5, 3]]);
    expect(values('$.o[*]', doc)).toEqual([1, 2]);
    expect(values('$.o[*, *]', doc)).toEqual([1, 2, 1, 2]);
    expect(values('$.a[*]', doc)).toEqual([5, 3]);
  });

  it('index (§2.3.3.3)', () => {
    expect(values('$[1]', ['a', 'b'])).toEqual(['b']);
    expect(values('$[-2]', ['a', 'b'])).toEqual(['a']);
    expect(values('$[2]', ['a', 'b'])).toEqual([]);
    expect(values('$[0]', { 0: 'x' })).toEqual([]);
  });

  it('array slice (§2.3.4.3)', () => {
    const doc = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    expect(values('$[1:3]', doc)).toEqual(['b', 'c']);
    expect(values('$[5:]', doc)).toEqual(['f', 'g']);
    expect(values('$[1:5:2]', doc)).toEqual(['b', 'd']);
    expect(values('$[5:1:-2]', doc)).toEqual(['f', 'd']);
    expect(values('$[::-1]', doc)).toEqual(['g', 'f', 'e', 'd', 'c', 'b', 'a']);
    expect(values('$[::0]', doc)).toEqual([]);
    expect(values('$[-100:100]', doc)).toHaveLength(7);
    expect(values('$[ 1 : 3 : 1 ]', doc)).toEqual(['b', 'c']);
  });

  it('descendant segment (Table 16)', () => {
    const doc = { o: { j: 1, k: 2 }, a: [5, 3, [{ j: 4 }, { k: 6 }]] };
    expect(evaluate('$..j', doc)).toEqual([
      { path: "$['o']['j']", value: 1 },
      { path: "$['a'][2][0]['j']", value: 4 },
    ]);
    expect(values('$..[0]', doc)).toEqual([5, { j: 4 }]);
    expect(paths('$..[*]', doc)).toEqual([
      "$['o']",
      "$['a']",
      "$['o']['j']",
      "$['o']['k']",
      "$['a'][0]",
      "$['a'][1]",
      "$['a'][2]",
      "$['a'][2][0]",
      "$['a'][2][1]",
      "$['a'][2][0]['j']",
      "$['a'][2][1]['k']",
    ]);
    expect(paths('$..*', doc)).toEqual(paths('$..[*]', doc));
    expect(values('$..o', doc)).toEqual([{ j: 1, k: 2 }]);
    expect(values('$.o..[*, *]', doc)).toEqual([1, 2, 1, 2]);
    expect(values('$.a..[0, 1]', doc)).toEqual([5, 3, { j: 4 }, { k: 6 }]);
  });

  it('null semantics (Table 17)', () => {
    const doc = { a: null, b: [null], c: [{}], null: 1 };
    expect(values('$.a', doc)).toEqual([null]);
    expect(values('$.a[0]', doc)).toEqual([]);
    expect(values('$.a.d', doc)).toEqual([]);
    expect(values('$.b[0]', doc)).toEqual([null]);
    expect(values('$.b[*]', doc)).toEqual([null]);
    expect(values('$.b[?@]', doc)).toEqual([null]);
    expect(values('$.b[?@==null]', doc)).toEqual([null]);
    expect(values('$.c[?@.d==null]', doc)).toEqual([]);
    expect(values('$.null', doc)).toEqual([1]);
  });
});

describe('filters (Table 12)', () => {
  const doc = {
    a: [3, 5, 1, 2, 4, 6, { b: 'j' }, { b: 'k' }, { b: {} }, { b: 'kilo' }],
    o: { p: 1, q: 2, r: 3, s: 5, t: { u: 6 } },
    e: 'f',
  };
  const cases: [string, string[]][] = [
    ["$.a[?@.b == 'kilo']", ["$['a'][9]"]],
    ["$.a[?(@.b == 'kilo')]", ["$['a'][9]"]],
    ['$.a[?@>3.5]', ["$['a'][1]", "$['a'][4]", "$['a'][5]"]],
    ['$.a[?@.b]', ["$['a'][6]", "$['a'][7]", "$['a'][8]", "$['a'][9]"]],
    ['$[?@.*]', ["$['a']", "$['o']"]],
    ['$[?@[?@.b]]', ["$['a']"]],
    ['$.o[?@<3, ?@<3]', ["$['o']['p']", "$['o']['q']", "$['o']['p']", "$['o']['q']"]],
    ['$.a[?@<2 || @.b == "k"]', ["$['a'][2]", "$['a'][7]"]],
    ['$.a[?match(@.b, "[jk]")]', ["$['a'][6]", "$['a'][7]"]],
    ['$.a[?search(@.b, "[jk]")]', ["$['a'][6]", "$['a'][7]", "$['a'][9]"]],
    ['$.o[?@>1 && @<4]', ["$['o']['q']", "$['o']['r']"]],
    ['$.o[?@.u || @.x]', ["$['o']['t']"]],
    ['$.a[?@.b == $.x]', ["$['a'][0]", "$['a'][1]", "$['a'][2]", "$['a'][3]", "$['a'][4]", "$['a'][5]"]],
    ['$.a[?@ == @]', Array.from({ length: 10 }, (_, i) => `$['a'][${i}]`)],
    ['$.a[?!@.b]', Array.from({ length: 6 }, (_, i) => `$['a'][${i}]`)],
    ['$.a[?!(@ > 2)]', ["$['a'][2]", "$['a'][3]", "$['a'][6]", "$['a'][7]", "$['a'][8]", "$['a'][9]"]],
  ];
  it.each(cases)('%s', (q, expected) => {
    expect(paths(q, doc)).toEqual(expected);
  });

  it('functions', () => {
    expect(values('$[?length(@) == 3]', ['abc', '😀😀😀', [1, 2, 3], { a: 1, b: 2, c: 3 }, 3])).toHaveLength(4);
    expect(values('$[?count(@.*) == 1]', [{ a: 1 }, [2], [], 'x'])).toEqual([{ a: 1 }, [2]]);
    expect(values('$[?value(@..c) == 1]', [{ c: 1 }, { a: { c: 1 } }, { c: 1, d: { c: 1 } }])).toEqual([{ c: 1 }, { a: { c: 1 } }]);
    expect(values("$[?match(@, 'a.c')]", ['abc', 'a\nc', 'xabc'])).toEqual(['abc']);
    expect(values("$[?search(@, 'b')]", ['abc', 'xyz'])).toEqual(['abc']);
    expect(values("$[?match(@, '(')]", ['('])).toEqual([]); // invalid regex → false
    expect(iRegexpToJs('a.[.]\\.')).toBe('a[^\\n\\r][.]\\.');
  });
});

describe('comparisons (Table 11)', () => {
  const doc = { obj: { x: 'y' }, arr: [2, 3] };
  const cases: [string, boolean][] = [
    ['$.absent1 == $.absent2', true],
    ['$.absent1 <= $.absent2', true],
    ["$.absent == 'g'", false],
    ['$.absent1 != $.absent2', false],
    ["$.absent != 'g'", true],
    ['1 <= 2', true],
    ['1 > 2', false],
    ["13 == '13'", false],
    ["'a' <= 'b'", true],
    ["'a' > 'b'", false],
    ['$.obj == $.arr', false],
    ['$.obj != $.arr', true],
    ['$.obj == $.obj', true],
    ['$.obj != $.obj', false],
    ['$.arr == $.arr', true],
    ['$.arr != $.arr', false],
    ['$.obj == 17', false],
    ['$.obj != 17', true],
    ['$.obj <= $.arr', false],
    ['$.obj < $.arr', false],
    ['$.obj <= $.obj', true],
    ['$.arr <= $.arr', true],
    ['1 <= $.arr', false],
    ['1 >= $.arr', false],
    ['1 > $.arr', false],
    ['1 < $.arr', false],
    ['true <= true', true],
    ['true > true', false],
    ['1 == 1.0', true],
    ['1e2 == 100', true],
    ["'\u{10000}' > '￿'", true],
  ];
  it.each(cases)('%s → %s', (expr, result) => {
    expect(evaluate(`$[?${expr}]`, doc)).toHaveLength(result ? 2 : 0);
  });
});

describe('well-typedness and syntax errors', () => {
  const ok = ['$[?length(@) < 3]', '$[?count(@.*) == 1]', "$[?match(@.timezone, 'Europe/.*')]", '$[?value(@..color) == "red"]', '$', '$ .a', '$[ ?@.a ]'];
  it.each(ok)('accepts %s', (q) => expect(() => parseQuery(q)).not.toThrow());

  const bad: [string, RegExp, number][] = [
    ['$[?length(@.*) < 3]', /single value/, 10],
    ['$[?count(1) == 1]', /query/, 9],
    ["$[?match(@.timezone, 'Europe/.*') == true]", /can’t be compared/, 3],
    ['$[?value(@..color)]', /returns a value/, 3],
    ['$[?foo(@.a)]', /Unknown function/, 3],
    ['$[?@.* == 1]', /singular/, 3],
    ['$[?true]', /literal/, 3],
    ['$[?@.a == 1 == 2]', /chained/, 11],
    ['$[?@.a = 1]', /'=='/, 7],
    ['$.a[', /selector/, 4],
    ['$[01]', /leading zeros/, 2],
    ['$[-0]', /-0/, 2],
    ['$[9007199254740992]', /out of range/, 2],
    ['$[a]', /quoted/, 2],
    ["$['a'", /Unclosed/, 1],
    ["$['a' 'b']", /Expected ',' or '\]'/, 6],
    ["$['\\x']", /Invalid escape/, 3],
    ["$['\\ud800']", /surrogate/, 3],
    ['$.1a', /digit/, 2],
    ['a.b', /start with '\$'/, 0],
    [' $', /whitespace/, 0],
    ['$.a ', /whitespace at the end/, 3],
    ['$..', /after '\.\.'/, 3],
    ['$[?(@.a]', /Expected '\)'/, 7],
    ['$[?@.a && ]', /filter expression|Unexpected/, 10],
    ['$[?length(@, @)]', /takes 1 argument/, 13],
  ];
  it.each(bad)('rejects %s', (q, msg, offset) => {
    const r = runQuery('{}', q);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.where).toBe('query');
      expect(r.error.message).toMatch(msg);
      expect(r.error.offset).toBe(offset);
    }
  });

  it('reports JSON errors with a position', () => {
    const r = runQuery('{"a": }', '$.a');
    expect(r).toMatchObject({ ok: false, where: 'json', error: { line: 1, column: 7 } });
  });
});

describe('normalized paths (Table 18)', () => {
  it('escapes names', () => {
    expect(normalizedPath(['a'])).toBe("$['a']");
    expect(normalizedPath([1])).toBe('$[1]');
    expect(normalizedPath(['\u000b'])).toBe("$['\\u000b']");
    expect(normalizedPath(["it's", 'back\\slash', 'line\n'])).toBe("$['it\\'s']['back\\\\slash']['line\\n']");
    expect(paths('$[-3]', [1, 2, 3, 4])).toEqual(['$[1]']);
    expect(paths('$.a.b[1:2]', { a: { b: [0, 1, 2] } })).toEqual(["$['a']['b'][1]"]);
  });
});
