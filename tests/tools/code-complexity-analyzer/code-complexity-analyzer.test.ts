import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  analyze,
  DEFAULT_THRESHOLDS,
  exceeds,
  markedSource,
  topFunctions,
  type Language,
} from '../../../src/tools/code-complexity-analyzer/features/code-complexity-analyzer';

const run = (code: string, language: Language = 'ts') => analyze(ts, code, language);
const only = (code: string, language: Language = 'ts') => {
  const { functions } = run(code, language);
  expect(functions).toHaveLength(1);
  return functions[0];
};
const byName = (code: string, language: Language = 'ts') => Object.fromEntries(run(code, language).functions.map((f) => [f.name, f]));

describe('cyclomatic complexity', () => {
  it('is 1 for straight-line code', () => {
    expect(only('function f(a) { return a + 1; }').complexity).toBe(1);
  });

  it('counts if and else if, not else', () => {
    const fn = only('function f(a) { if (a > 1) return 1; else if (a > 0) return 2; else return 3; }');
    expect(fn.complexity).toBe(3);
    expect(fn.decisions.map((d) => d.kind)).toEqual(['if', 'if']);
  });

  it('counts every loop kind', () => {
    const fn = only(`function f(xs) {
      for (let i = 0; i < 3; i++) {}
      for (const k in xs) {}
      for (const x of xs) {}
      while (xs.length) xs.pop();
      do {} while (false);
    }`);
    expect(fn.decisions.map((d) => d.kind)).toEqual(['for', 'for', 'for', 'while', 'do']);
    expect(fn.complexity).toBe(6);
  });

  it('counts case clauses but not default', () => {
    const fn = only('function f(x) { switch (x) { case 1: return "a"; case 2: case 3: return "b"; default: return "c"; } }');
    expect(fn.complexity).toBe(4);
  });

  it('counts &&, ||, ?? and logical assignment, not optional chaining', () => {
    const fn = only('function f(a, b, c) { a &&= b; c ??= a?.x?.y; return (a && b) || (c ?? 0); }');
    expect(fn.decisions.map((d) => d.kind)).toEqual(['&&=', '??=', '&&', '||', '??']);
    expect(fn.complexity).toBe(6);
  });

  it('counts ternaries and catch, not try or finally', () => {
    const fn = only('function f(a) { try { return a ? 1 : a === 0 ? 0 : -1; } catch (e) { throw e; } finally { a = null; } }');
    expect(fn.complexity).toBe(4);
  });

  it('ignores keywords in comments, strings, templates and regexes', () => {
    const fn = only('function f() { // if (x) while (y)\n/* for case && || ?? */ const s = "if && ||"; const t = `case ${"?:"}`; return /a||b/.test(s + t); }');
    expect(fn.complexity).toBe(1);
  });

  it('marks the keyword or operator of each decision point', () => {
    const code = 'const f = (a, b) => {\n  if (a) return b ?? 1;\n  return 0;\n};';
    const fn = only(code);
    expect(fn.decisions.map((d) => [code.slice(d.start, d.end), d.line])).toEqual([
      ['if', 2],
      ['??', 2],
    ]);
    const lines = markedSource(code, fn);
    expect(lines.map((l) => l.number)).toEqual([1, 2, 3, 4]);
    expect(lines[1].parts.filter((p) => p.decision).map((p) => p.text)).toEqual(['if', '??']);
    expect(lines.map((l) => l.parts.map((p) => p.text).join('')).join('\n')).toBe(code);
  });
});

describe('functions', () => {
  it('measures nested and arrow functions separately without adding them to the parent', () => {
    const fns = byName(`function outer(xs) {
      if (xs) {
        const inner = (x) => (x > 0 && x < 9 ? x : 0);
        return xs.map(function (y) { while (y) y--; return y; });
      }
    }`);
    expect(fns.outer.complexity).toBe(2);
    expect(fns.inner.complexity).toBe(3);
    expect(fns.inner.kind).toBe('arrow');
    expect(fns['(anonymous, line 4)'].complexity).toBe(2);
  });

  it('names class methods, getters, setters, constructors and property arrows', () => {
    const fns = byName(`class Cart {
      items: number[] = [];
      constructor(seed?: number[]) { if (seed) this.items = seed; }
      get total() { return this.items.length || 0; }
      set total(v) {}
      add(n: number) { for (const i of this.items) if (i === n) return; }
      onClick = () => this.items.length > 0 ? 1 : 0;
      abstract?(): void;
    }`);
    expect(Object.keys(fns)).toEqual(['Cart.constructor', 'Cart.get total', 'Cart.set total', 'Cart.add', 'Cart.onClick']);
    expect(fns['Cart.constructor'].complexity).toBe(2);
    expect(fns['Cart.get total'].kind).toBe('getter');
    expect(fns['Cart.add'].complexity).toBe(3);
    expect(fns['Cart.onClick'].complexity).toBe(2);
  });

  it('skips overload signatures and names object-literal and assigned functions', () => {
    const fns = byName(`function f(a: string): void;
      function f(a: unknown) {}
      const api = { get(x) { return x || 1; }, put: (y) => y };
      module.exports.run = function () {};`);
    expect(Object.keys(fns)).toEqual(['f', 'get', 'put', 'module.exports.run']);
  });

  it('counts lines from the signature to the closing brace', () => {
    expect(only('\nfunction f() {\n  return 1;\n}\n').lines).toBe(3);
  });

  it('measures nesting like max-depth: else-if stays level, nested functions reset', () => {
    const fns = byName(`function deep(a) {
      if (a) {
        for (;;) {
          try { while (a) { switch (a) { case 1: break; } } } catch {}
        }
      } else if (a === 0) {
        const g = () => { if (a) {} };
      }
    }`);
    expect(fns.deep.maxNesting).toBe(5);
    expect(fns.g.maxNesting).toBe(1);
    expect(only('function f(a) { if (a) {} else if (!a) {} else if (a == 1) {} }').maxNesting).toBe(1);
  });

  it('parses JSX and TSX', () => {
    expect(only('const App = ({ on }) => <div>{on && <b>{on ? "a" : "b"}</b>}</div>;', 'jsx').complexity).toBe(3);
    expect(only('function C<T>(p: { v?: T }) { return <i>{p.v ?? null}</i>; }', 'tsx').complexity).toBe(2);
  });
});

describe('syntax errors', () => {
  it('reports line:column and still analyzes what parsed', () => {
    const result = run('function ok(a) { return a || 1; }\nconst x = ;\nfunction broken() {\n  if (x) {\n');
    expect(result.syntaxErrors.length).toBeGreaterThan(0);
    expect(result.syntaxErrors[0]).toMatchObject({ line: 2, column: 11, message: 'Expression expected.' });
    expect(result.functions.map((f) => [f.name, f.complexity])).toEqual([
      ['ok', 2],
      ['broken', 2],
    ]);
  });

  it('does not throw on garbage', () => {
    expect(() => run('}}}{{{ ))) => ?? && class 123 <<<')).not.toThrow();
    expect(run('').functions).toEqual([]);
  });
});

describe('thresholds and ranking', () => {
  it('flags what exceeds each threshold and sorts the top list', () => {
    const { functions } = run('function a(x) { return x; }\nfunction b(x) { if (x) {} if (x) {} }\nfunction c(x) { if (x) {} }');
    expect(topFunctions(functions).map((f) => f.name)).toEqual(['b', 'c', 'a']);
    expect(exceeds(functions[1], { ...DEFAULT_THRESHOLDS, complexity: 2 })).toEqual({ complexity: true, nesting: false, lines: false });
  });
});
