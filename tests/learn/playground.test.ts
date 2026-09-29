import { transform } from 'sucrase';
import { describe, expect, it } from 'vitest';
import { subjects } from '../../src/learn/content/index';
import { codeToRun, isScriptSnippet, looksLikeTypeScript, needsDomSandbox, playgroundPlan, stripComments } from '../../src/learn/features/playground';

const parses = (code: string) => {
  try {
    new Function('return async () => {\n' + code + '\n}');
    return true;
  } catch {
    return false;
  }
};
const parsesAsTs = (code: string) => {
  try {
    return parses(transform(code, { transforms: ['typescript'], disableESTransforms: true }).code);
  } catch {
    return false;
  }
};

const examples = subjects.flatMap((s) =>
  s.topics.flatMap((t) => t.examples.map((e) => ({ where: `${s.id}/${t.id}: ${e.title ?? ''}`, ...e }))),
);
const unlabelled = examples.filter((e) => !e.language || e.language === 'javascript');

describe('needsDomSandbox', () => {
  it('detects browser-page globals', () => {
    expect(needsDomSandbox('document.querySelector("h1")')).toBe(true);
    expect(needsDomSandbox('alert("hi")')).toBe(true);
    expect(needsDomSandbox('localStorage.setItem("a", "1")')).toBe(true);
    expect(needsDomSandbox('window.addEventListener("load", f)')).toBe(true);
    expect(needsDomSandbox('const el: HTMLElement = x')).toBe(true);
  });
  it('ignores plain code, comments and property access', () => {
    expect(needsDomSandbox('console.log(1 + 2)')).toBe(false);
    expect(needsDomSandbox('// runs in the browser window\nconsole.log(1)')).toBe(false);
    expect(needsDomSandbox('/* document */ const x = 1')).toBe(false);
    expect(needsDomSandbox('user.location = "Paris"; state.history.push(1)')).toBe(false);
    expect(needsDomSandbox('const documents = []; const windowSize = 3')).toBe(false);
  });
  it('keeps // inside strings', () => {
    expect(stripComments('fetch("https://x.dev") // go')).toBe('fetch("https://x.dev") \n');
  });
});

describe('looksLikeTypeScript', () => {
  it('spots annotations, interfaces, generics and casts', () => {
    expect(looksLikeTypeScript('let n: number = 1')).toBe(true);
    expect(looksLikeTypeScript('interface User { name: string }')).toBe(true);
    expect(looksLikeTypeScript('type Id = string | number')).toBe(true);
    expect(looksLikeTypeScript('function first<T>(xs: T[]) { return xs[0] }')).toBe(true);
    expect(looksLikeTypeScript('const x = y as const')).toBe(true);
  });
  it('leaves plain JavaScript alone', () => {
    expect(looksLikeTypeScript('const user = { name: "Ada", age: 36 };\nconsole.log(user.name)')).toBe(false);
    expect(looksLikeTypeScript('const label = "type: string";')).toBe(false);
    expect(looksLikeTypeScript('switch (x) { case 1: break }')).toBe(false);
  });
  it('flags every lesson example that only parses as TypeScript', () => {
    const tsOnly = unlabelled.filter((e) => !parses(e.code) && parsesAsTs(e.code));
    expect(tsOnly.length).toBeGreaterThan(10);
    expect(tsOnly.filter((e) => !looksLikeTypeScript(e.code)).map((e) => e.where)).toEqual([]);
  });
});

describe('isScriptSnippet', () => {
  it('rejects HTML, CSS, JSON, tables, trees, shell and HTTP', () => {
    expect(isScriptSnippet('<!DOCTYPE html>\n<html></html>')).toBe(false);
    expect(isScriptSnippet('p {\n  color: red;\n}')).toBe(false);
    expect(isScriptSnippet('.toolbar {\n  display: flex;\n}')).toBe(false);
    expect(isScriptSnippet('{\n  "name": "x"\n}')).toBe(false);
    expect(isScriptSnippet('id | name | email\n---+------')).toBe(false);
    expect(isScriptSnippet('my-api/\n├── package.json')).toBe(false);
    expect(isScriptSnippet('npm install express')).toBe(false);
    expect(isScriptSnippet('GET /users/1 HTTP/1.1\nHost: x')).toBe(false);
    expect(isScriptSnippet('# ADR-1: Title')).toBe(false);
    expect(isScriptSnippet('// only comments\n// here')).toBe(false);
    expect(isScriptSnippet('DATABASE_URL=postgres://x')).toBe(false);
    expect(isScriptSnippet('export function add(a, b) { return a + b }')).toBe(false);
  });
  it('accepts JavaScript and TypeScript', () => {
    expect(isScriptSnippet('// a comment\nconst x = 1;\nx')).toBe(true);
    expect(isScriptSnippet('interface Task {\n  title: string;\n  done: boolean;\n}')).toBe(true);
    expect(isScriptSnippet('[1, 2, 3].map((n) => n * 2)')).toBe(true);
    expect(isScriptSnippet('if (a || b) {\n  run();\n}')).toBe(true);
    expect(isScriptSnippet('type Status = "a" | "b" | "c";')).toBe(true);
  });
  it('never hides Run for a lesson example that parses as JS or TS', () => {
    const runnable = unlabelled.filter((e) => (parses(e.code) || parsesAsTs(e.code)) && stripComments(e.code).trim() !== '' && !/^\s*(import|export)\b/m.test(e.code) && !/^(GET|POST|PUT|PATCH|DELETE)\s/m.test(e.code));
    expect(runnable.length).toBeGreaterThan(150);
    expect(runnable.filter((e) => !isScriptSnippet(e.code)).map((e) => e.where)).toEqual([]);
  });
  it('hides Run for most lesson examples that are not code', () => {
    const notCode = unlabelled.filter((e) => !parses(e.code) && !parsesAsTs(e.code));
    const stillRunnable = notCode.filter((e) => isScriptSnippet(e.code));
    expect(stillRunnable.length).toBeLessThanOrEqual(Math.ceil(notCode.length * 0.25));
  });
});

describe('playgroundPlan', () => {
  it('is display-only for other languages', () => {
    expect(playgroundPlan({ code: 'print(1)', language: 'python' })).toBeNull();
    expect(playgroundPlan({ code: 'SELECT 1', language: 'sql' })).toBeNull();
    expect(playgroundPlan({ code: 'a: 1', language: 'yaml' })).toBeNull();
  });
  it('picks the worker or the DOM sandbox', () => {
    expect(playgroundPlan({ code: 'console.log(1)' })).toEqual({ target: 'worker', language: 'js' });
    expect(playgroundPlan({ code: 'console.log(1)', language: 'javascript' })).toEqual({ target: 'worker', language: 'js' });
    expect(playgroundPlan({ code: 'document.title = "x"' })).toEqual({ target: 'dom', language: 'js' });
    expect(playgroundPlan({ code: 'const el: HTMLElement = document.body' })).toEqual({ target: 'dom', language: 'ts' });
  });
});

describe('codeToRun', () => {
  it('uses the harness when test cases parse, else the implicit log', () => {
    const src = 'function add(a, b) {\n  return a + b;\n}';
    expect(codeToRun(src, [{ input: 'a = 1, b = 2', output: '3' }])).toContain('add(1, 2)');
    expect(codeToRun('add(1, 2)')).toBe('console.log(add(1, 2));');
    expect(codeToRun('const x = 1', [])).toBe('const x = 1');
  });
});
