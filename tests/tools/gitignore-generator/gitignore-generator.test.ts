import { describe, expect, it } from 'vitest';
import { GROUPS, merge, parseRules, searchTemplates, templateById, TEMPLATES, testPath, testPaths } from '../../../src/tools/gitignore-generator/features/gitignore-generator';

const ignored = (rules: string, path: string, ic = false) => testPath(parseRules(rules, ic), path)!.ignored;

describe('templates', () => {
  it('has ~60+ unique templates in known groups', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(60);
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
    for (const t of TEMPLATES) {
      expect(GROUPS).toContain(t.group);
      expect(t.body.length).toBeGreaterThan(5);
    }
  });
  it('every pattern compiles', () => {
    for (const t of TEMPLATES) {
      const rules = parseRules(t.body);
      const patterns = t.body.split('\n').filter((l) => l.trim() && !l.startsWith('#')).length;
      expect(rules.length, t.id).toBe(patterns);
    }
  });
  it('searches by name, id and group', () => {
    expect(searchTemplates('next').map((t) => t.id)).toContain('nextjs');
    expect(searchTemplates('editors ide').length).toBeGreaterThan(3);
    expect(searchTemplates('zzzz')).toEqual([]);
    expect(templateById('node')?.name).toBe('Node.js');
  });
});

describe('merge', () => {
  it('adds section headers, dedupes patterns and appends custom lines', () => {
    const r = merge(['node', 'angular', 'node'], 'secret.txt\nnode_modules/');
    expect(r.text).toContain('# === Node.js ===');
    expect(r.text).toContain('# === Angular ===');
    expect(r.text.match(/^node_modules\/$/gm)).toHaveLength(1);
    expect(r.text).toContain('# === Custom ===\nsecret.txt');
    expect(r.duplicates).toBeGreaterThanOrEqual(3);
    expect(r.text.endsWith('\n')).toBe(true);
  });
  it('returns empty text for nothing and skips unknown ids', () => {
    expect(merge([]).text).toBe('');
    expect(merge(['nope']).text).toBe('');
  });
});

describe('matcher: basics', () => {
  it('matches names at any depth and ignores comments and blanks', () => {
    expect(ignored('# c\n\n*.log', 'a/b/x.log')).toBe(true);
    expect(ignored('*.log', 'a/b/x.txt')).toBe(false);
    expect(ignored('# *.log', 'x.log')).toBe(false);
  });
  it('anchors patterns with a slash', () => {
    expect(ignored('/build', 'build')).toBe(true);
    expect(ignored('/build', 'src/build')).toBe(false);
    expect(ignored('doc/frotz', 'doc/frotz')).toBe(true);
    expect(ignored('doc/frotz', 'a/doc/frotz')).toBe(false);
  });
  it('trailing slash matches directories only', () => {
    expect(ignored('build/', 'build/')).toBe(true);
    expect(ignored('build/', 'build')).toBe(false);
    expect(ignored('build/', 'build/out.js')).toBe(true);
    expect(ignored('build/', 'src/build/out.js')).toBe(true);
  });
  it('* and ? do not cross slashes', () => {
    expect(ignored('doc/*.txt', 'doc/a.txt')).toBe(true);
    expect(ignored('doc/*.txt', 'doc/sub/a.txt')).toBe(false);
    expect(ignored('a?c', 'abc')).toBe(true);
    expect(ignored('a?c', 'a/c')).toBe(false);
  });
  it('supports bracket classes', () => {
    expect(ignored('file[0-9].txt', 'file7.txt')).toBe(true);
    expect(ignored('file[0-9].txt', 'filex.txt')).toBe(false);
    expect(ignored('file[!0-9].txt', 'filex.txt')).toBe(true);
    expect(ignored('f[[:digit:]]', 'f3')).toBe(true);
    expect(ignored('a[b', 'a[b')).toBe(true);
  });
  it('supports escapes', () => {
    expect(ignored('\\#file', '#file')).toBe(true);
    expect(ignored('\\!important', '!important')).toBe(true);
    expect(ignored('a\\*b', 'a*b')).toBe(true);
    expect(ignored('a\\*b', 'axb')).toBe(false);
    expect(ignored('foo  ', 'foo')).toBe(true);
    expect(parseRules('foo\\ ')[0].re.test('foo ')).toBe(true);
  });
  it('can ignore case', () => {
    expect(ignored('README.md', 'readme.md')).toBe(false);
    expect(ignored('README.md', 'readme.md', true)).toBe(true);
  });
});

describe('matcher: **', () => {
  it('leading, middle and trailing **', () => {
    expect(ignored('**/foo', 'foo')).toBe(true);
    expect(ignored('**/foo', 'a/b/foo')).toBe(true);
    expect(ignored('abc/**', 'abc/x/y')).toBe(true);
    expect(ignored('abc/**', 'abc')).toBe(false);
    expect(ignored('a/**/b', 'a/b')).toBe(true);
    expect(ignored('a/**/b', 'a/x/y/b')).toBe(true);
    expect(ignored('a/**/b', 'x/a/b')).toBe(false);
  });
  it('** inside a name acts like *', () => {
    expect(ignored('a**b', 'axxb')).toBe(true);
    expect(ignored('a**b', 'a/b')).toBe(false);
  });
});

describe('matcher: negation and precedence', () => {
  it('last match wins and ! re-includes', () => {
    const rules = '*.log\n!keep.log';
    expect(ignored(rules, 'a.log')).toBe(true);
    expect(ignored(rules, 'keep.log')).toBe(false);
    expect(ignored('!keep.log\n*.log', 'keep.log')).toBe(true);
  });
  it('reports the deciding rule and line', () => {
    const r = testPath(parseRules('# c\n*.log\n!keep.log'), 'keep.log')!;
    expect(r.ignored).toBe(false);
    expect(r.rule).toMatchObject({ line: 3, negated: true, text: '!keep.log' });
    const i = testPath(parseRules('# c\n*.log'), 'x.log')!;
    expect(i.rule?.line).toBe(2);
    expect(testPath(parseRules('*.log'), 'x.txt')!.rule).toBeNull();
  });
  it('cannot re-include a file whose parent directory is excluded', () => {
    const rules = 'build/\n!build/keep.txt';
    const r = testPath(parseRules(rules), 'build/keep.txt')!;
    expect(r.ignored).toBe(true);
    expect(r.parent).toBe('build');
    expect(r.rule?.text).toBe('build/');
  });
  it('can re-include when the directory itself is not excluded', () => {
    const rules = 'build/*\n!build/keep.txt';
    expect(ignored(rules, 'build/keep.txt')).toBe(false);
    expect(ignored(rules, 'build/other.txt')).toBe(true);
    // but build/*  then !build/sub/ then sub/file works through the directory
    expect(ignored('/*\n!/src/\n!/src/**', 'src/a/b.ts')).toBe(false);
    expect(ignored('/*\n!/src/\n!/src/**', 'lib/a.ts')).toBe(true);
  });
  it('the real .vscode pattern keeps settings.json', () => {
    const rules = '.vscode/*\n!.vscode/settings.json';
    expect(ignored(rules, '.vscode/settings.json')).toBe(false);
    expect(ignored(rules, '.vscode/other.json')).toBe(true);
  });
});

describe('testPaths', () => {
  it('normalises paths, skips blanks and handles ./ and backslashes', () => {
    const out = testPaths('*.log\nbuild/', './a.log\n\n  \nbuild\\x.js\nbuild/\nsrc/', false);
    expect(out.map((r) => [r.path, r.ignored, r.isDir])).toEqual([
      ['a.log', true, false],
      ['build/x.js', true, false],
      ['build', true, true],
      ['src', false, true],
    ]);
  });
  it('works on a merged output', () => {
    const text = merge(['node', 'env', 'vscode']).text;
    const res = testPaths(text, 'node_modules/a/b.js\n.env\n.env.example\n.vscode/settings.json\nsrc/main.ts');
    expect(res.map((r) => r.ignored)).toEqual([true, true, false, false, false]);
  });
});
