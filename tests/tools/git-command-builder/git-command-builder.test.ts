import { describe, expect, it } from 'vitest';
import { buildRecipe, commitError, errorsFor, initialValues, quote, RECIPES, refNameError, render, type Shell } from '../../../src/tools/git-command-builder/features/git-command-builder';

const recipe = (id: string) => RECIPES.find((r) => r.id === id)!;
const cmds = (id: string, over: Record<string, string> = {}, shell: Shell = 'posix') => {
  const r = recipe(id);
  const b = buildRecipe(r, { ...initialValues(r), ...over });
  if (!b) throw new Error(JSON.stringify(errorsFor(r, { ...initialValues(r), ...over })));
  return { ...b, text: b.commands.map((c) => render(c, shell)).join('\n') };
};

describe('validation', () => {
  it('follows git ref-name rules', () => {
    for (const ok of ['main', 'feature/login', 'v1.2.0', 'fix-123', 'user/a.b']) expect(refNameError(ok), ok).toBeNull();
    for (const bad of ['', 'a b', 'a..b', 'a~1', 'a^', 'a:b', 'a?', 'a*', 'a[', 'a\\b', '-x', '/a', 'a/', 'a//b', 'a.', 'a.lock', '.a', 'a/.b', '@', 'a@{1}']) expect(refNameError(bad), bad).not.toBeNull();
  });
  it('accepts hashes and refs as commits', () => {
    for (const ok of ['a1b2', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 'HEAD', 'HEAD~2', 'HEAD^', 'main~1^2', 'origin/main', 'v1.0']) expect(commitError(ok), ok).toBeNull();
    for (const bad of ['', 'a b', 'x..y', '-rf']) expect(commitError(bad), bad).not.toBeNull();
  });
  it('every recipe builds from its initial values', () => {
    for (const r of RECIPES) expect(errorsFor(r, initialValues(r)), r.id).toEqual({});
  });
  it('blocks invalid input and missing required fields', () => {
    const r = recipe('branch-create');
    expect(buildRecipe(r, { name: 'bad name', from: '' })).toBeNull();
    expect(errorsFor(r, { name: '', from: '' })).toEqual({ name: 'Required.' });
  });
});

describe('quoting', () => {
  it('leaves plain words alone and quotes the rest', () => {
    expect(quote('feature/login', 'posix')).toBe('feature/login');
    expect(quote('HEAD~1', 'posix')).toBe('HEAD~1');
    expect(quote('HEAD^', 'posix')).toBe("'HEAD^'");
    expect(quote("it's done", 'posix')).toBe(`'it'\\''s done'`);
    expect(quote("it's done", 'powershell')).toBe("'it''s done'");
    expect(quote('a,b', 'powershell')).toBe("'a,b'");
    expect(quote('$HOME `x`', 'posix')).toBe("'$HOME `x`'");
    expect(quote('~/x', 'posix')).toBe("'~/x'");
  });
});

describe('recipes', () => {
  it('builds commands with explanations for every part', () => {
    for (const r of RECIPES) {
      const b = buildRecipe(r, initialValues(r))!;
      expect(b.commands.length, r.id).toBeGreaterThan(0);
      for (const c of b.commands) {
        expect(c[0].arg).toBe('git');
        for (const part of c) expect(part.explain.length, `${r.id} ${part.arg}`).toBeGreaterThan(3);
      }
    }
  });
  it('produces the expected commands', () => {
    expect(cmds('branch-create', { name: 'feat/x', from: 'main' }).text).toBe('git switch -c feat/x main');
    expect(cmds('commit', { message: "Fix user's login" }).text).toBe(`git commit -m 'Fix user'\\''s login'`);
    expect(cmds('commit', { message: "Fix user's login" }, 'powershell').text).toBe("git commit -m 'Fix user''s login'");
    expect(cmds('undo-commit', { count: '2' }).text).toBe('git reset --soft HEAD~2');
    expect(cmds('branch-rename', { old: 'a', new: 'b' }).text).toBe('git branch -m a b\ngit push -u origin b\ngit push origin --delete a');
    expect(cmds('log', { count: '5', graph: '', path: 'src/my file.ts' }).text).toBe("git log --oneline -n5 -- 'src/my file.ts'");
    expect(cmds('clean').text).toBe('git clean -n -d');
  });
  it('classifies risk and offers safer options for destructive commands', () => {
    expect(cmds('status').risk).toBe('read');
    expect(cmds('push').risk).toBe('read');
    expect(cmds('push', { force: 'true' }).text).toBe('git push -u --force-with-lease origin feature/login');
    expect(cmds('push', { force: 'true' }).risk).toBe('destructive');
    expect(cmds('clean', { force: 'true' }).risk).toBe('destructive');
    expect(cmds('rebase').risk).toBe('history');
    for (const r of RECIPES) {
      for (const flags of [{}, Object.fromEntries(r.fields.filter((f) => f.kind === 'flag').map((f) => [f.id, 'true']))]) {
        const b = buildRecipe(r, { ...initialValues(r), ...flags })!;
        if (b.risk === 'destructive') expect(b.safer ?? b.warning, r.id).toBeTruthy();
      }
    }
  });
  it('separates paths with -- so a path can’t be read as an option', () => {
    expect(cmds('discard', { path: '-rf' }).text).toBe('git restore -- -rf');
  });
});
