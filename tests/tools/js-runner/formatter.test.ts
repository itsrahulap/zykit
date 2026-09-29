import { describe, expect, it } from 'vitest';
import { createFormatter } from '../../../src/tools/js-runner/features/formatter';

const { inspect, formatArgs } = createFormatter();

describe('inspect', () => {
  it('formats primitives', () => {
    expect(inspect('hi')).toBe("'hi'");
    expect(inspect("it's\n")).toBe("'it\\'s\\n'");
    expect(inspect(42)).toBe('42');
    expect(inspect(-0)).toBe('-0');
    expect(inspect(NaN)).toBe('NaN');
    expect(inspect(-Infinity)).toBe('-Infinity');
    expect(inspect(10n)).toBe('10n');
    expect(inspect(true)).toBe('true');
    expect(inspect(undefined)).toBe('undefined');
    expect(inspect(null)).toBe('null');
    expect(inspect(Symbol('s'))).toBe('Symbol(s)');
  });

  it('formats functions and classes', () => {
    function named() {}
    expect(inspect(named)).toBe('[Function: named]');
    expect(inspect(() => 1)).toBe('[Function (anonymous)]');
    expect(inspect(async function go() {})).toBe('[AsyncFunction: go]');
    class Foo {}
    expect(inspect(Foo)).toBe('[class Foo]');
  });

  it('formats arrays, objects, nesting and quoting', () => {
    expect(inspect([1, 'a', [2]])).toBe("[ 1, 'a', [ 2 ] ]");
    expect(inspect([])).toBe('[]');
    expect(inspect({})).toBe('{}');
    expect(inspect({ a: 1, 'b-c': 'x', [Symbol('k')]: 2 })).toBe("{ a: 1, 'b-c': 'x', [Symbol(k)]: 2 }");
    // eslint-disable-next-line no-sparse-arrays
    expect(inspect([1, , 3])).toBe('[ 1, <1 empty item>, 3 ]');
  });

  it('shows class names and null prototypes', () => {
    class Point {
      x = 1;
      y = 2;
    }
    expect(inspect(new Point())).toBe('Point { x: 1, y: 2 }');
    const bare = Object.create(null);
    bare.a = 1;
    expect(inspect(bare)).toBe('[Object: null prototype] { a: 1 }');
  });

  it('does not call getters', () => {
    let called = false;
    const o = {
      get g() {
        called = true;
        return 1;
      },
    };
    expect(inspect(o)).toBe('{ g: [Getter] }');
    expect(called).toBe(false);
  });

  it('formats Map, Set, Date, RegExp, typed arrays and boxed values', () => {
    expect(inspect(new Map<unknown, unknown>([['a', 1], [2, { b: true }]]))).toBe("Map(2) { 'a' => 1, 2 => { b: true } }");
    expect(inspect(new Set([1, 2]))).toBe('Set(2) { 1, 2 }');
    expect(inspect(new Date(0))).toBe('1970-01-01T00:00:00.000Z');
    expect(inspect(new Date(NaN))).toBe('Invalid Date');
    expect(inspect(/a+b/gi)).toBe('/a+b/gi');
    expect(inspect(new Uint8Array([1, 2, 3]))).toBe('Uint8Array(3) [ 1, 2, 3 ]');
    expect(inspect(new ArrayBuffer(8))).toBe('ArrayBuffer { byteLength: 8 }');
    expect(inspect(Object(3))).toBe('[Number: 3]');
    expect(inspect(Promise.resolve(1))).toBe('Promise { <state hidden> }');
  });

  it('marks circular references', () => {
    const a: Record<string, unknown> = { name: 'a' };
    a.self = a;
    a.list = [a];
    expect(inspect(a)).toBe("{ name: 'a', self: [Circular], list: [ [Circular] ] }");
  });

  it('limits depth', () => {
    const deep = { l1: { l2: { l3: { l4: { l5: { l6: 1 } } } } } };
    expect(inspect(deep)).toContain('l5: [Object]');
    expect(inspect([[[[[[1]]]]]])).toContain('[Array]');
  });

  it('truncates long collections', () => {
    const arr = Array.from({ length: 150 }, (_, i) => i);
    const out = inspect(arr);
    expect(out).toContain('... 50 more items');
    expect(out).toContain('99');
    expect(out).not.toMatch(/\b100\b/);
    const obj = Object.fromEntries(Array.from({ length: 101 }, (_, i) => ['k' + i, i]));
    expect(inspect(obj)).toContain('... 1 more item');
  });

  it('breaks long collections onto several lines', () => {
    const out = inspect({ first: 'a'.repeat(30), second: 'b'.repeat(30), third: [1, 2] });
    expect(out).toBe(`{\n  first: '${'a'.repeat(30)}',\n  second: '${'b'.repeat(30)}',\n  third: [ 1, 2 ]\n}`);
  });

  it('prints errors with their stack at top level and briefly when nested', () => {
    const e = new TypeError('bad');
    const top = inspect(e);
    expect(top.startsWith('TypeError: bad')).toBe(true);
    expect(top).toContain('\n');
    expect(inspect({ e })).toBe('{ e: [TypeError: bad] }');
    const noStack = new Error('x');
    noStack.stack = '    at somewhere';
    expect(inspect(noStack)).toBe('Error: x\n    at somewhere');
  });

  it('survives hostile objects', () => {
    const p = new Proxy({}, { ownKeys: () => { throw new Error('nope'); } });
    expect(() => inspect(p)).not.toThrow();
    // Very wide and deep structures stay bounded
    const wide = Array.from({ length: 100 }, () => Array.from({ length: 100 }, () => Array.from({ length: 100 }, () => [1])));
    expect(inspect(wide).length).toBeLessThan(200_000);
  });
});

describe('formatArgs', () => {
  it('prints top-level strings raw and joins with spaces', () => {
    expect(formatArgs(['a', 1, 'b', { c: 'd' }])).toBe("a 1 b { c: 'd' }");
    expect(formatArgs([])).toBe('');
    expect(formatArgs([undefined])).toBe('undefined');
  });

  it('supports printf-style directives', () => {
    expect(formatArgs(['%s is %d years', 'Ada', 36.6])).toBe('Ada is 36.6 years');
    expect(formatArgs(['%i|%f', 42.9, '3.5abc'])).toBe('42|3.5');
    expect(formatArgs(['%o', { a: [1] }])).toBe('{ a: [ 1 ] }');
    expect(formatArgs(['%j', { a: 1 }])).toBe('{"a":1}');
    expect(formatArgs(['100%% %c styled', 'color: red'])).toBe('100%  styled');
    expect(formatArgs(['%s and %s', 'one'])).toBe('one and %s');
    expect(formatArgs(['%d', 5n])).toBe('5n');
    expect(formatArgs(['x %s', 'y', 'extra', 2])).toBe('x y extra 2');
    const circ: Record<string, unknown> = {};
    circ.c = circ;
    expect(formatArgs(['%j', circ])).toBe('[Circular]');
  });
});
