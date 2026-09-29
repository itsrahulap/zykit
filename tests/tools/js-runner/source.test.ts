import { describe, expect, it } from 'vitest';
import { FAKE_URL, runInFakeWorker } from './fakeWorker';
import {
  buildWorkerSource,
  findModuleSyntax,
  formatScriptError,
  mapLocations,
  toUserLine,
} from '../../../src/tools/js-runner/features/source';

describe('buildWorkerSource', () => {
  it('places the user code right after lineOffset lines', () => {
    const b = buildWorkerSource('first\nsecond');
    const lines = b.source.split('\n');
    expect(lines[b.lineOffset]).toBe('first');
    expect(lines[b.lineOffset + 1]).toBe('second');
    expect(b.userLines).toBe(2);
  });

  it('maps a syntax error line back to the user code', () => {
    const w = runInFakeWorker('const a = 1;\nconst b = 2;\nconst = 3;\n');
    const e = w.syntaxError as Error;
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('SyntaxError');
    // Node puts "file:LINE" on the first stack line for vm syntax errors
    const lineno = Number(/:(\d+)\n/.exec(String(e.stack))![1]);
    expect(toUserLine(lineno, w.built.lineOffset, w.built.userLines)).toBe(3);
  });
});

describe('mapLocations', () => {
  const url = FAKE_URL;
  it('rewrites V8 and Firefox frames and drops runtime frames', () => {
    const stack = [
      'Error: x',
      `    at f (${url}:12:5)`,
      `    at ${url}:14:1`,
      `    at emit (${url}:3:10)`,
      `    at async ${url}:13:2`,
      `f@${url}:12:5`,
      `@${url}:40:1`,
    ].join('\n');
    expect(mapLocations(stack, url, 10, 5)).toBe(
      ['Error: x', '    at f (line 2:5)', '    at line 4:1', '    at async line 3:2', 'f@line 2:5'].join('\n'),
    );
  });

  it('leaves unrelated text untouched', () => {
    expect(mapLocations('hello', FAKE_URL, 10, 5)).toBe('hello');
  });
});

describe('formatScriptError', () => {
  it('strips "Uncaught" and adds the user line', () => {
    expect(formatScriptError("Uncaught SyntaxError: Unexpected token '}'", 13, 4, 10, 5)).toBe(
      "SyntaxError: Unexpected token '}' (line 3:4)",
    );
  });
  it('clamps errors reported in the wrapper to the last user line', () => {
    expect(formatScriptError('SyntaxError: Unexpected end of input', 16, 1, 10, 5)).toBe(
      'SyntaxError: Unexpected end of input (line 5)',
    );
  });
  it('handles missing details', () => {
    expect(formatScriptError('', 0, 0, 10, 5)).toBe('The code could not be started (unknown error).');
  });
});

describe('findModuleSyntax', () => {
  it('finds static import and export statements', () => {
    expect(findModuleSyntax("import x from 'y';")).toEqual({ line: 1, keyword: 'import' });
    expect(findModuleSyntax("const a = 1;\n  import { b } from 'c'")).toEqual({ line: 2, keyword: 'import' });
    expect(findModuleSyntax("import 'side-effect';")).toEqual({ line: 1, keyword: 'import' });
    expect(findModuleSyntax("import * as ns from 'ns'")).toEqual({ line: 1, keyword: 'import' });
    expect(findModuleSyntax('export const a = 1;')).toEqual({ line: 1, keyword: 'export' });
    expect(findModuleSyntax('export default 1')).toEqual({ line: 1, keyword: 'export' });
  });
  it('ignores dynamic import, import.meta, comments and strings', () => {
    expect(findModuleSyntax("const m = await import('x');")).toBeNull();
    expect(findModuleSyntax('// import x from "y"\n/* export const z */')).toBeNull();
    expect(findModuleSyntax("const s = `\nimport x from 'y'\n`;")).toBeNull();
    expect(findModuleSyntax('const important = 1; exported();')).toBeNull();
  });
});
