import { describe, expect, it } from 'vitest';
import { addLoopGuards } from '../../src/learn/features/loopGuard';

const G = 'g';
const guard = (code: string) => addLoopGuards(code, G);

describe('addLoopGuards', () => {
  it('guards while, do-while and classic for loops', () => {
    expect(guard('while (true) {}')).toBe('while (g() && (true)) {}');
    expect(guard('do { x++ } while (x < 3);')).toBe('do { x++ } while (g() && (x < 3));');
    expect(guard('for (let i = 0; i < n; i++) f(i)')).toBe('for (let i = 0; g() && ( i < n); i++) f(i)');
    expect(guard('for (;;) {}')).toBe('for (; g();) {}');
    expect(guard('for await (;;) {}')).toBe('for await (; g();) {}');
  });
  it('leaves for-in / for-of, property names, strings, comments and regexes alone', () => {
    for (const code of [
      'for (const x of xs) {}',
      'for (const k in obj) {}',
      'obj.while(1); a?.for(2)',
      'const s = "while (true) {}"',
      'const t = `for (;;) {}`',
      '// while (true) {}',
      '/* for (;;) {} */',
      'const r = /while \\(x\\)/;',
      'const r2 = /[/]while (x)/g',
      'const whileLoop = 1; const forEach = 2',
    ]) {
      expect(guard(code)).toBe(code);
    }
  });
  it('handles nesting and parentheses inside conditions', () => {
    expect(guard('while (f(a, (b))) { for (let i = 0; i < g2(i); i++) {} }')).toBe(
      'while (g() && (f(a, (b)))) { for (let i = 0; g() && ( i < g2(i)); i++) {} }',
    );
    expect(guard('for (let i = 0, j = [1;2].length; i < j; i++) {}')).toBe('for (let i = 0, j = [1;2].length; g() && ( i < j); i++) {}');
  });
  it('keeps line numbers and still divides', () => {
    const code = 'let a = 4 / 2;\nwhile (a > 0)\n  a--;\nconsole.log(a / 1)';
    const out = guard(code);
    expect(out.split('\n')).toHaveLength(4);
    expect(out).toContain('while (g() && (a > 0))');
    expect(out).toContain('a / 1');
  });
  it('produces code that runs and stops an endless loop', () => {
    let calls = 0;
    const g = () => {
      if (++calls > 10_000) throw new Error('loop limit');
      return true;
    };
    const ok = new Function('g', guard('let n = 0; for (let i = 0; i < 5; i++) { n += i } let k = 0; do { k++ } while (k < 3); return n + k;'));
    expect(ok(g)).toBe(13);
    const endless = new Function('g', guard('let i = 0; while (true) { i++ }'));
    expect(() => endless(g)).toThrow('loop limit');
    calls = 0;
    const endlessFor = new Function('g', guard('for (;;) {}'));
    expect(() => endlessFor(g)).toThrow('loop limit');
  });
});
