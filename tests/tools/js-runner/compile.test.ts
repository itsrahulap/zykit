import { describe, expect, it } from 'vitest';
import { compileTypeScript, describeCompileError } from '../../../src/tools/js-runner/features/compile';

describe('compileTypeScript', () => {
  it('strips types and keeps every line in place', async () => {
    const ts = [
      'interface User {',
      '  name: string;',
      '}',
      'type Id = string | number;',
      'enum Color { Red, Green }',
      'function id<T>(x: T): T {',
      '  return x;',
      '}',
      'const u = { name: "a" } as User;',
      'throw new Error(String(id<Id>(1)) + u.name + Color.Red);',
    ].join('\n');
    const r = await compileTypeScript(ts);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const lines = r.code.split('\n');
    expect(lines.length).toBe(10);
    expect(lines[5]).toBe('function id(x) {');
    expect(lines[9]).toContain('throw new Error');
    expect(r.code).not.toContain('interface');
    expect(r.code).not.toContain(': string');
  });

  it('leaves modern syntax alone (no ES transforms)', async () => {
    const r = await compileTypeScript('class A { #x: number = 1; get x() { return this.#x ?? 0; } }');
    expect(r.ok && r.code).toContain('#x = 1');
    expect(r.ok && r.code).toContain('??');
  });

  it('reports syntax errors with line and column', async () => {
    const r = await compileTypeScript('const a = 1;\nlet b: = 2;');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.line).toBe(2);
    expect(r.column).toBeGreaterThan(0);
    expect(r.message).toBe('Unexpected token');
    expect(describeCompileError(r)).toBe(`TypeScript syntax error: Unexpected token (line 2:${r.column})`);
  });
});
