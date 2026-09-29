import { describe, expect, it } from 'vitest';
import { diffSequences } from '../../../src/tools/diff-checker/features/myers';
import {
  collapse,
  diffTexts,
  diffWords,
  splitLines,
  toSideBySide,
  unifiedDiff,
  type DiffLine,
} from '../../../src/tools/diff-checker/features/diff';

const kinds = (lines: DiffLine[]) => lines.map((l) => `${l.kind === 'equal' ? ' ' : l.kind === 'add' ? '+' : '-'}${l.text}`);

/** Deterministic PRNG so failures are reproducible. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function lcsLength(a: number[], b: number[]) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length];
}

function apply(a: number[], b: number[], runs: { op: number; count: number }[]) {
  const out: number[] = [];
  let i = 0;
  let j = 0;
  for (const r of runs) {
    if (r.op === 0) {
      for (let c = 0; c < r.count; c++) {
        expect(a[i]).toBe(b[j]);
        out.push(a[i++]);
        j++;
      }
    } else if (r.op === -1) i += r.count;
    else for (let c = 0; c < r.count; c++) out.push(b[j++]);
  }
  expect(i).toBe(a.length);
  return out;
}

describe('myers', () => {
  it('handles empty and identical sequences', () => {
    expect(diffSequences([], []).runs).toEqual([]);
    expect(diffSequences([1, 2, 3], [1, 2, 3]).runs).toEqual([{ op: 0, count: 3 }]);
    expect(diffSequences([], [1, 2]).runs).toEqual([{ op: 1, count: 2 }]);
    expect(diffSequences([1, 2], []).runs).toEqual([{ op: -1, count: 2 }]);
  });

  it('produces minimal edit scripts that turn A into B (random)', () => {
    const rand = rng(42);
    for (let t = 0; t < 300; t++) {
      const alphabet = 1 + Math.floor(rand() * 6);
      const a = Array.from({ length: Math.floor(rand() * 40) }, () => Math.floor(rand() * alphabet));
      const b = Array.from({ length: Math.floor(rand() * 40) }, () => Math.floor(rand() * alphabet));
      const { runs, exact } = diffSequences(a, b);
      expect(exact).toBe(true);
      expect(apply(a, b, runs)).toEqual(b);
      const equal = runs.filter((r) => r.op === 0).reduce((s, r) => s + r.count, 0);
      expect(equal).toBe(lcsLength(a, b));
    }
  });

  it('applies correctly on larger random edits', () => {
    const rand = rng(7);
    const a = Array.from({ length: 5000 }, () => Math.floor(rand() * 50));
    const b = [...a];
    for (let e = 0; e < 300; e++) {
      const pos = Math.floor(rand() * b.length);
      if (rand() < 0.5) b.splice(pos, 1);
      else b.splice(pos, 0, Math.floor(rand() * 50));
    }
    const { runs, exact } = diffSequences(a, b);
    expect(exact).toBe(true);
    expect(apply(a, b, runs)).toEqual(b);
  });

  it('falls back to a valid (non-minimal) script when the budget runs out', () => {
    const rand = rng(3);
    const a = Array.from({ length: 3000 }, () => Math.floor(rand() * 1000));
    const b = Array.from({ length: 3000 }, () => Math.floor(rand() * 1000));
    const { runs, exact } = diffSequences(a, b, 10_000);
    expect(exact).toBe(false);
    expect(apply(a, b, runs)).toEqual(b);
  });
});

describe('splitLines', () => {
  it('normalises line endings and reports them', () => {
    expect(splitLines('a\r\nb\r\n')).toEqual({ lines: ['a', 'b'], eol: 'CRLF', trailingNewline: true });
    expect(splitLines('a\nb')).toEqual({ lines: ['a', 'b'], eol: 'LF', trailingNewline: false });
    expect(splitLines('a\r\nb\n').eol).toBe('Mixed');
    expect(splitLines('')).toEqual({ lines: [], eol: 'none', trailingNewline: false });
  });
});

describe('diffTexts', () => {
  it('reports identical text', () => {
    const r = diffTexts('a\nb\n', 'a\nb\n');
    expect(r.identical).toBe(true);
    expect(r.additions + r.removals).toBe(0);
    expect(unifiedDiff(r)).toBe('');
  });

  it('treats CRLF and LF versions as identical', () => {
    const r = diffTexts('a\r\nb\r\n', 'a\nb\n');
    expect(r.identical).toBe(true);
    expect(r.a.eol).toBe('CRLF');
    expect(r.b.eol).toBe('LF');
  });

  it('detects insertions', () => {
    const r = diffTexts('a\nc\n', 'a\nb\nc\n');
    expect(kinds(r.lines)).toEqual([' a', '+b', ' c']);
    expect(r.additions).toBe(1);
    expect(r.removals).toBe(0);
    expect(r.lines[1].bNo).toBe(2);
  });

  it('detects deletions', () => {
    const r = diffTexts('a\nb\nc\n', 'a\nc\n');
    expect(kinds(r.lines)).toEqual([' a', '-b', ' c']);
    expect(r.lines[1].aNo).toBe(2);
  });

  it('detects replacements with removals before additions', () => {
    const r = diffTexts('a\nb\nc\n', 'a\nx\ny\nc\n');
    expect(kinds(r.lines)).toEqual([' a', '-b', '+x', '+y', ' c']);
    expect(toSideBySide(r.lines).map((row) => [row.left?.text, row.right?.text])).toEqual([
      ['a', 'a'],
      ['b', 'x'],
      [undefined, 'y'],
      ['c', 'c'],
    ]);
  });

  it('can ignore surrounding whitespace, all whitespace and case', () => {
    expect(diffTexts('  a  \nb', 'a\nb').identical).toBe(false);
    expect(diffTexts('  a  \nb', 'a\nb', { trim: true }).identical).toBe(true);
    expect(diffTexts('a b c', 'a  bc', { trim: true }).identical).toBe(false);
    expect(diffTexts('a b c', 'a  bc', { ignoreWhitespace: true }).identical).toBe(true);
    expect(diffTexts('Hello', 'hELLO').identical).toBe(false);
    const r = diffTexts('Hello', 'hELLO', { ignoreCase: true });
    expect(r.identical).toBe(true);
    expect(r.lines[0].textB).toBe('hELLO');
  });

  it('treats a missing final newline as a change unless whitespace is ignored', () => {
    const r = diffTexts('a\nb', 'a\nb\n');
    expect(kinds(r.lines)).toEqual([' a', '-b', '+b']);
    expect(unifiedDiff(r)).toBe('--- original\n+++ changed\n@@ -1,2 +1,2 @@\n a\n-b\n\\ No newline at end of file\n+b\n');
    expect(diffTexts('a\nb', 'a\nb\n', { trim: true }).identical).toBe(true);
  });

  it('highlights the changed words inside modified lines', () => {
    const r = diffTexts('const answer = 41;\n', 'const answer = 42;\n');
    const [del, add] = r.lines;
    expect(del.parts).toEqual([
      { text: 'const answer = ', changed: false },
      { text: '41', changed: true },
      { text: ';', changed: false },
    ]);
    expect(add.parts?.filter((p) => p.changed).map((p) => p.text)).toEqual(['42']);
  });

  it('diffs words with options', () => {
    const w = diffWords('The quick fox', 'the quick brown fox', { ignoreCase: true });
    expect(w.a.every((p) => !p.changed)).toBe(true);
    expect(w.b.filter((p) => p.changed).map((p) => p.text).join('')).toBe('brown ');
    const joined = (ps: { text: string }[]) => ps.map((p) => p.text).join('');
    expect(joined(w.a)).toBe('The quick fox');
    expect(joined(w.b)).toBe('the quick brown fox');
  });

  it('reconstructs both texts from a large random diff', () => {
    const rand = rng(99);
    const words = ['alpha', 'beta', 'gamma', 'delta', '', '  indented', 'return x;', '}'];
    const a = Array.from({ length: 2000 }, () => words[Math.floor(rand() * words.length)]);
    const b = [...a];
    for (let e = 0; e < 200; e++) {
      const pos = Math.floor(rand() * b.length);
      const op = rand();
      if (op < 0.33) b.splice(pos, 1);
      else if (op < 0.66) b.splice(pos, 0, `new ${e}`);
      else b[pos] = `${b[pos]} changed`;
    }
    const r = diffTexts(a.join('\n') + '\n', b.join('\n') + '\n');
    expect(r.exact).toBe(true);
    expect(r.lines.filter((l) => l.kind !== 'add').map((l) => l.text)).toEqual(a);
    expect(r.lines.filter((l) => l.kind !== 'del').map((l) => l.textB ?? l.text)).toEqual(b);
    expect(r.additions).toBe(r.lines.filter((l) => l.kind === 'add').length);
  });
});

describe('unifiedDiff', () => {
  it('writes standard hunks with context', () => {
    const r = diffTexts('a\nb\nc\n', 'a\nB\nc\n');
    expect(unifiedDiff(r, { aName: 'a.txt', bName: 'b.txt' })).toBe('--- a.txt\n+++ b.txt\n@@ -1,3 +1,3 @@\n a\n-b\n+B\n c\n');
  });

  it('splits distant changes into separate hunks and merges close ones', () => {
    const a = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`);
    const b = [...a];
    b[1] = 'changed 2';
    b[17] = 'changed 18';
    const out = unifiedDiff(diffTexts(a.join('\n') + '\n', b.join('\n') + '\n'), { context: 2 });
    expect(out.split('\n').filter((l) => l.startsWith('@@'))).toEqual(['@@ -1,4 +1,4 @@', '@@ -16,5 +16,5 @@']);
    const merged = unifiedDiff(diffTexts(a.join('\n') + '\n', b.join('\n') + '\n'), { context: 8 });
    expect(merged.split('\n').filter((l) => l.startsWith('@@'))).toEqual(['@@ -1,20 +1,20 @@']);
  });

  it('uses zero-length ranges for insertions into empty files', () => {
    expect(unifiedDiff(diffTexts('', 'x\ny\n'))).toBe('--- original\n+++ changed\n@@ -0,0 +1,2 @@\n+x\n+y\n');
    expect(unifiedDiff(diffTexts('x\n', ''))).toBe('--- original\n+++ changed\n@@ -1 +0,0 @@\n-x\n');
  });
});

describe('collapse', () => {
  it('hides long unchanged runs but keeps context', () => {
    const changed = Array.from({ length: 20 }, (_, i) => i === 10);
    expect(collapse(changed, 3)).toEqual([
      { type: 'gap', start: 0, end: 7 },
      { type: 'rows', start: 7, end: 14 },
      { type: 'gap', start: 14, end: 20 },
    ]);
  });

  it('leaves short gaps visible', () => {
    const changed = [true, false, false, false, false, false, false, false, true];
    expect(collapse(changed, 3)).toEqual([{ type: 'rows', start: 0, end: 9 }]);
    expect(collapse(changed, 0)).toEqual([
      { type: 'rows', start: 0, end: 1 },
      { type: 'gap', start: 1, end: 8 },
      { type: 'rows', start: 8, end: 9 },
    ]);
  });
});
