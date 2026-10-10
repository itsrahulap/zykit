import { describe, expect, it } from 'vitest';
import { jsonTextToToml, parseToml, tomlToJson } from '../../../src/tools/toml-json/features/toml';

const j = (s: string) => JSON.parse(JSON.stringify(parseToml(s).value)) as unknown;
const err = (s: string) => {
  const r = tomlToJson(s, 2);
  if (r.ok) throw new Error('expected error');
  return r.error;
};

describe('parseToml', () => {
  it('parses scalars, tables and comments', () => {
    expect(j('# hi\na = 1 # c\nb = "x"\nc = true\n[t]\nd = 1.5\n[t.u]\ne = false')).toEqual({ a: 1, b: 'x', c: true, t: { d: 1.5, u: { e: false } } });
  });
  it('handles all integer forms and floats', () => {
    expect(j('a=0xDEAD_beef\nb=0o755\nc=0b1101\nd=1_000\ne=-17\nf=+3.14\ng=5e+2\nh=6.626e-34\ni=-0.0')).toMatchObject({ a: 0xdeadbeef, b: 493, c: 13, d: 1000, e: -17, f: 3.14, g: 500, h: 6.626e-34 });
  });
  it('handles inf and nan with a warning', () => {
    const r = parseToml('a=inf\nb=-inf\nc=nan');
    expect(r.value.a).toBe(Infinity);
    expect(r.value.b).toBe(-Infinity);
    expect(r.value.c).toBeNaN();
    expect(r.warnings).toHaveLength(1);
  });
  it('handles string kinds', () => {
    const v = j('a="tab\\t\\u00e9\\U0001F600"\nb=\'C:\\x\'\nc="""\nl1\nl2 \\\n   joined"""\nd=\'\'\'\nraw \\n\'\'\'\ne="""q"""""');
    expect(v).toEqual({ a: 'tab\té😀', b: 'C:\\x', c: 'l1\nl2 joined', d: 'raw \\n', e: 'q""' });
  });
  it('handles dotted keys and quoted keys', () => {
    expect(j('a.b.c = 1\na.b.d = 2\n"x y".z = 3\n[q]\n\'k.k\' = 4')).toEqual({ a: { b: { c: 1, d: 2 } }, 'x y': { z: 3 }, q: { 'k.k': 4 } });
  });
  it('handles arrays, inline tables and array tables', () => {
    const v = j('a=[1,\n 2, # c\n [3, "x"],]\nb={x=1, y={z=2}}\n[[p]]\nn=1\n[p.sub]\nm=2\n[[p]]\nn=2');
    expect(v).toEqual({ a: [1, 2, [3, 'x']], b: { x: 1, y: { z: 2 } }, p: [{ n: 1, sub: { m: 2 } }, { n: 2 }] });
  });
  it('keeps dates and times as text', () => {
    expect(j('a=1979-05-27T07:32:00Z\nb=1979-05-27 07:32:00.5-08:00\nc=1979-05-27\nd=07:32:00\ne=1979-05-27T07:32:00')).toEqual({
      a: '1979-05-27T07:32:00Z',
      b: '1979-05-27 07:32:00.5-08:00',
      c: '1979-05-27',
      d: '07:32:00',
      e: '1979-05-27T07:32:00',
    });
  });
  it('allows super table defined after sub table', () => {
    expect(j('[a.b]\nx=1\n[a]\ny=2')).toEqual({ a: { b: { x: 1 }, y: 2 } });
  });
  it('does not pollute prototypes', () => {
    parseToml('__proto__.x = 1');
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });
});

describe('errors with line and column', () => {
  it.each([
    ['a = 1\na = 2', 'Duplicate', 2, 1],
    ['a = ', 'value', 1, 5],
    ['a = "x', 'Unterminated', 1, 5],
    ['a = 01', 'Invalid', 1, 5],
    ['a = 1 b = 2', 'new line', 1, 7],
    ['[a]\n[a]', 'already defined', 2, 2],
    ['a = [1, 2', 'array', 1, 10],
    ['a = {x=1,}', 'Trailing', 1, 10],
    ['a = "\\q"', 'escape', 1, 6],
    ['a = 2021-13-01', 'date', 1, 5],
    ['a = 9223372036854775808', '64 bits', 1, 5],
    ['a = 1\n[[a]]', 'array of tables|not an extendable', 2, 3],
  ])('%j', (src, msg, line, column) => {
    const e = err(src);
    expect(e.message).toMatch(new RegExp(msg));
    expect([e.line, e.column]).toEqual([line, column]);
  });
  it('rejects redefining inline tables and dotted tables via headers', () => {
    expect(err('a={x=1}\n[a]').message).toMatch(/extendable/);
    expect(err('a.b=1\n[a]').message).toMatch(/extendable/);
    expect(err('a=[1]\n[[a]]').message).toMatch(/static array/);
  });
});

describe('tomlToJson / jsonTextToToml', () => {
  it('formats JSON with the chosen indent', () => {
    const r = tomlToJson('a=1', 'min');
    expect(r.ok && r.output).toBe('{"a":1}');
  });
  it('writes TOML and reads it back', () => {
    const obj = { name: 'x "q"', n: 3, f: 1.5, ok: true, list: [1, 2], mixed: [[1], ['a']], 'odd key': 1, t: { a: 1, deep: { b: 'c' } }, arr: [{ i: 1 }, { i: 2, s: { z: 1 } }], e: {} };
    const r = jsonTextToToml(JSON.stringify(obj));
    if (!r.ok) throw new Error('x');
    expect(j(r.output)).toEqual(obj);
  });
  it('drops null with a warning and needs an object root', () => {
    const r = jsonTextToToml('{"a":null,"b":[1,null]}');
    expect(r.ok && r.output).toBe('b = [1]\n');
    expect(r.ok && r.warnings).toHaveLength(1);
    expect(jsonTextToToml('[1]').ok).toBe(false);
    const bad = jsonTextToToml('{"a":');
    expect(bad.ok).toBe(false);
  });
});
