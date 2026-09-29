import { describe, expect, it } from 'vitest';
import { withImplicitLog } from '../../src/learn/features/implicitLog';

describe('withImplicitLog', () => {
  it('logs a trailing bare expression', () => {
    expect(withImplicitLog('const a = 2;\na * 3')).toBe('const a = 2;\nconsole.log(a * 3);');
    expect(withImplicitLog('sum(2, 3);')).toBe('console.log(sum(2, 3));');
  });
  it('keeps indentation and drops a trailing comment', () => {
    expect(withImplicitLog('  total // → 6')).toBe('  console.log(total);');
  });
  it('skips trailing blank and comment lines', () => {
    expect(withImplicitLog('x\n\n// done\n/* end */\n')).toBe('console.log(x);\n\n// done\n/* end */\n');
  });
  it('leaves declarations, blocks, assignments and console calls alone', () => {
    for (const src of [
      'const x = 1',
      'let y',
      'function f() {}',
      'async function g() {}',
      'class A {}',
      'if (x) run()',
      'return 1',
      'throw new Error("x")',
      'x = 5',
      'total += 1',
      'console.log(1)',
      'f(() => {\n  go();\n})',
      '}',
      '',
      '// only a comment',
    ]) {
      expect(withImplicitLog(src)).toBe(src);
    }
  });
  it('treats comparisons and arrows as expressions, not assignments', () => {
    expect(withImplicitLog('a === b')).toBe('console.log(a === b);');
    expect(withImplicitLog('a !== b')).toBe('console.log(a !== b);');
    expect(withImplicitLog('a <= b')).toBe('console.log(a <= b);');
    expect(withImplicitLog('[1, 2].map((n) => n * 2)')).toBe('console.log([1, 2].map((n) => n * 2));');
    expect(withImplicitLog('nums.map((n) => n * 2)')).toBe('console.log(nums.map((n) => n * 2));');
  });
  it('does not treat // inside a string as a comment', () => {
    expect(withImplicitLog('fetchUrl("https://example.com")')).toBe('console.log(fetchUrl("https://example.com"));');
  });
  it('leaves a line that continues the previous one alone', () => {
    const chain = 'const out = items\n  .filter(Boolean)\n  .map(String)';
    expect(withImplicitLog(chain)).toBe(chain);
    const args = 'call(\n  a,\n  b\n)';
    expect(withImplicitLog(args)).toBe(args);
    const sum = 'const t = a +\n  b';
    expect(withImplicitLog(sum)).toBe(sum);
    const tpl = 'const s = `line one\nline two`';
    expect(withImplicitLog(tpl)).toBe(tpl);
  });
  it('leaves several statements on one line alone', () => {
    expect(withImplicitLog('a(); b()')).toBe('a(); b()');
  });
  it('supports top-level await expressions', () => {
    expect(withImplicitLog('await load()')).toBe('console.log(await load());');
  });
});
