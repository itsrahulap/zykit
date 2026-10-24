import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { EXAMPLES } from '../../../src/tools/typescript-type-explorer/features/examples';
import { createTypeAnalyzer, LIB_FILE_NAMES, MAX_CODE_CHARS } from '../../../src/tools/typescript-type-explorer/features/typescript-type-explorer';

const libDir = dirname(createRequire(import.meta.url).resolve('typescript/lib/lib.es5.d.ts'));
const libFiles = Object.fromEntries(LIB_FILE_NAMES.map((name) => [name, readFileSync(join(libDir, name), 'utf8')]));
const analyze = createTypeAnalyzer(ts, libFiles);

const typesOf = (code: string) => Object.fromEntries(analyze(code).declarations.map((d) => [d.name, d.type]));
const exampleTypes = (id: string) => typesOf(EXAMPLES.find((e) => e.id === id)!.code);

describe('TypeScript Type Explorer', () => {
  it('bundles the whole /// <reference lib> chain of es2015', () => {
    for (const text of Object.values(libFiles)) {
      for (const [, lib] of text.matchAll(/<reference lib="([^"]+)"/g)) expect(LIB_FILE_NAMES).toContain(`lib.${lib}.d.ts`);
    }
  });

  it.each(EXAMPLES.filter((e) => e.id !== 'error').map((e) => [e.id, e] as const))('example %s compiles cleanly', (_id, example) => {
    const { diagnostics, declarations } = analyze(example.code);
    expect(diagnostics).toEqual([]);
    const names = declarations.map((d) => d.name);
    for (const name of example.lookAt) expect(names).toContain(name);
  });

  it('resolves the built-in utility types', () => {
    expect(typesOf("type A = Pick<{ a: 1; b: 2 }, 'a'>;").A).toBe('{ a: 1; }');
    expect(exampleTypes('utility-shape')).toMatchObject({
      Draft: '{ id?: number | undefined; name?: string | undefined; email?: string | undefined; }',
      Complete: '{ id: number; name: string; email: string; }',
      Frozen: '{ readonly id: number; readonly name: string; readonly email?: string | undefined; }',
      Preview: '{ id: number; name: string; }',
      WithoutEmail: '{ id: number; name: string; }',
      Scores: '{ math: number; art: number; }',
    });
    expect(exampleTypes('utility-union')).toMatchObject({ WithoutA: '"b" | "c"', OnlyFns: '() => void', Present: 'string' });
    expect(exampleTypes('utility-function')).toMatchObject({
      Result: '{ name: string; age: number; }',
      Args: '[name: string, age: number]',
      Loaded: 'number',
      Instance: 'Point',
    });
  });

  it('resolves keyof, typeof, indexed access and unions', () => {
    expect(exampleTypes('keyof')).toMatchObject({ UserKey: '"id" | "name" | "email"', name: 'string' });
    expect(exampleTypes('typeof')).toMatchObject({ Config: '{ port: number; host: string; }', FrozenConfig: '{ readonly port: 8080; readonly host: "localhost"; }' });
    expect(exampleTypes('indexed-access')).toMatchObject({ Id: 'number', IdOrName: 'string | number', Role: '"admin" | "editor"' });
    expect(exampleTypes('unions-intersections')).toMatchObject({ BothKeys: '"age" | "name"', Impossible: 'never' });
  });

  it('resolves generics, conditional, mapped and template literal types', () => {
    expect(exampleTypes('generics')).toMatchObject({ picked: '"hello" | "hi"', firstId: 'number | undefined' });
    expect(exampleTypes('conditional')).toMatchObject({ Distributed: '"yes" | "no"', NotDistributed: '"no"', Item: 'string', Unwrapped: 'boolean' });
    expect(exampleTypes('mapped')).toMatchObject({
      Mutable: '{ id: number; title: string; done: boolean; }',
      Getters: '{ readonly getId: () => number; getTitle: () => string; getDone?: (() => boolean | undefined) | undefined; }',
      OnlyStrings: '{ title: string; }',
    });
    expect(exampleTypes('template-literal')).toMatchObject({ Event: '"user:created" | "user:deleted" | "post:created" | "post:deleted"', Shout: '"HELLO"' });
  });

  it('reports errors at their line:column', () => {
    const { diagnostics } = analyze(EXAMPLES.find((e) => e.id === 'error')!.code);
    expect(diagnostics).toEqual([{ line: 6, column: 29, code: 2322, category: 'error', message: "Type 'number' is not assignable to type 'string'." }]);
    expect(analyze('const x: number = ;\n').diagnostics[0]).toMatchObject({ line: 1, column: 19, category: 'error' });
  });

  it('never resolves imports from outside the program', () => {
    expect(analyze("import { x } from 'left-pad';\n").diagnostics[0]).toMatchObject({ line: 1, code: 2307 });
  });

  it('refuses code over the size cap', () => {
    expect(() => analyze('x'.repeat(MAX_CODE_CHARS + 1))).toThrow(RangeError);
  });
});
