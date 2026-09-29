import { describe, expect, it } from 'vitest';
import { buildAutoRunHarness, findAssignmentEquals, parseLeadingLiteral, splitTopLevel } from '../../src/learn/features/autoRunHarness';

describe('splitTopLevel', () => {
  it('splits only outside brackets and strings', () => {
    expect(splitTopLevel('nums = [1, 2, 3], target = 4', ',')).toEqual(['nums = [1, 2, 3]', ' target = 4']);
    expect(splitTopLevel('s = "a,b", k = {x: 1, y: 2}', ',')).toEqual(['s = "a,b"', ' k = {x: 1, y: 2}']);
    expect(splitTopLevel('s = "a\\",b"', ',')).toEqual(['s = "a\\",b"']);
  });
});

describe('findAssignmentEquals', () => {
  it('finds = but not comparisons or arrows', () => {
    expect(findAssignmentEquals('x = 1')).toBe(2);
    expect(findAssignmentEquals('a == b')).toBe(-1);
    expect(findAssignmentEquals('a === b')).toBe(-1);
    expect(findAssignmentEquals('a != b')).toBe(-1);
    expect(findAssignmentEquals('a <= b >= c')).toBe(-1);
    expect(findAssignmentEquals('(x) => x')).toBe(-1);
  });
});

describe('parseLeadingLiteral', () => {
  it('reads the literal and drops annotations', () => {
    expect(parseLeadingLiteral(' 11 (binary: 1011)')).toBe('11');
    expect(parseLeadingLiteral('[[1, 2], [3]] extra')).toBe('[[1, 2], [3]]');
    expect(parseLeadingLiteral('"a]b" rest')).toBe('"a]b"');
    expect(parseLeadingLiteral('{a: "}"}')).toBe('{a: "}"}');
    expect(parseLeadingLiteral('true')).toBe('true');
    expect(parseLeadingLiteral('')).toBe('');
    expect(parseLeadingLiteral('[1, 2')).toBe('');
    expect(parseLeadingLiteral('"open')).toBe('');
  });
});

describe('buildAutoRunHarness', () => {
  const src = 'function twoSum(nums, target) {\n  return [0, 1];\n}';

  it('is empty without test cases or a named function', () => {
    expect(buildAutoRunHarness(src)).toBe('');
    expect(buildAutoRunHarness(src, [])).toBe('');
    expect(buildAutoRunHarness('const f = (a) => a', [{ input: 'a = 1', output: '1' }])).toBe('');
  });

  it('calls the first function with each example', () => {
    const h = buildAutoRunHarness(src, [
      { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]' },
      { input: 'nums = [3, 3], target = 6', output: '[0, 1]' },
    ]);
    expect(h.startsWith('\n\n')).toBe(true);
    const lines = h.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('JSON.stringify(twoSum([2, 7, 11, 15], 9))');
    expect(lines[0]).toContain('"(expected [0, 1])"');
    expect(lines[0]).toContain('"Example 1: twoSum(nums = [2, 7, 11, 15], target = 9) →"');
    expect(lines[1]).toContain('twoSum([3, 3], 6)');
    expect(lines[0]).toMatch(/^try \{ console\.log\(.*\} catch \(e\) \{ console\.error\("Example 1 threw:"/);
  });

  it('skips examples it cannot parse and keeps the rest', () => {
    const h = buildAutoRunHarness(src, [
      { input: '["LRUCache", "put"], [[2], [1, 1]] then', output: 'x' },
      { input: 'nums = [1, 2', output: 'x' },
      { input: 'n = 5 (five)', output: '120' },
    ]);
    const lines = h.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('twoSum(5)');
    expect(lines[1]).toContain('Example 3');
  });

  it('uses at most five examples', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ input: `n = ${i}`, output: String(i) }));
    expect(buildAutoRunHarness(src, many).trim().split('\n')).toHaveLength(5);
  });

  it('produces code that runs', () => {
    const code = 'function add(a, b) { return a + b; }' + buildAutoRunHarness('function add(a, b) {}', [{ input: 'a = 2, b = 3', output: '5' }]);
    const logs: unknown[][] = [];
    new Function('console', code)({ log: (...a: unknown[]) => logs.push(a), error: () => {} });
    expect(logs).toEqual([['Example 1: add(a = 2, b = 3) →', '5', '(expected 5)']]);
  });
});
