import { describe, expect, it } from 'vitest';
import {
  adjacent,
  difficultyMix,
  filterProblems,
  parseDifficultyFilter,
  parseSolvedFilter,
  percent,
  sortByDifficulty,
} from '../../src/learn/components/problems/practice';
import { caseStudySections, methodTone } from '../../src/learn/components/case-studies/sections';
import type { CaseStudy } from '../../src/learn/types/caseStudy';
import { caseStudies, getProblemsInCategory, problemCategories } from '../../src/learn/data';

const items = [
  { id: 'a', difficulty: 'Hard' as const },
  { id: 'b', difficulty: 'Easy' as const },
  { id: 'c', difficulty: 'Medium' as const },
  { id: 'd', difficulty: 'Easy' as const },
];

describe('problem helpers', () => {
  it('sorts Easy → Medium → Hard, keeping authored order within a difficulty', () => {
    expect(sortByDifficulty(items).map((p) => p.id)).toEqual(['b', 'd', 'c', 'a']);
  });

  it('counts the difficulty mix', () => {
    expect(difficultyMix(items)).toEqual({ Easy: 2, Medium: 1, Hard: 1 });
    expect(difficultyMix([])).toEqual({ Easy: 0, Medium: 0, Hard: 0 });
  });

  it('filters by difficulty and solved state', () => {
    const solved = new Set(['b', 'a']);
    const isSolved = (id: string) => solved.has(id);
    expect(filterProblems(items, { difficulty: 'all', solved: 'all' }, isSolved)).toHaveLength(4);
    expect(filterProblems(items, { difficulty: 'Easy', solved: 'all' }, isSolved).map((p) => p.id)).toEqual(['b', 'd']);
    expect(filterProblems(items, { difficulty: 'Easy', solved: 'unsolved' }, isSolved).map((p) => p.id)).toEqual(['d']);
    expect(filterProblems(items, { difficulty: 'all', solved: 'solved' }, isSolved).map((p) => p.id)).toEqual(['a', 'b']);
    expect(filterProblems(items, { difficulty: 'Medium', solved: 'solved' }, isSolved)).toEqual([]);
  });

  it('parses URL filter values leniently', () => {
    expect(parseDifficultyFilter('easy')).toBe('Easy');
    expect(parseDifficultyFilter('HARD')).toBe('Hard');
    expect(parseDifficultyFilter('extreme')).toBe('all');
    expect(parseDifficultyFilter(null)).toBe('all');
    expect(parseSolvedFilter('solved')).toBe('solved');
    expect(parseSolvedFilter('unsolved')).toBe('unsolved');
    expect(parseSolvedFilter('maybe')).toBe('all');
  });

  it('finds neighbours', () => {
    expect(adjacent(items, 'a')).toEqual({ prev: undefined, next: items[1] });
    expect(adjacent(items, 'd')).toEqual({ prev: items[2], next: undefined });
    expect(adjacent(items, 'zzz')).toEqual({});
  });

  it('computes percentages', () => {
    expect(percent(0, 0)).toBe(0);
    expect(percent(1, 3)).toBe(33);
    expect(percent(3, 3)).toBe(100);
  });

  it('every category has problems in the catalog', () => {
    for (const c of problemCategories) expect(getProblemsInCategory(c.id).length).toBeGreaterThan(0);
  });
});

describe('case study helpers', () => {
  const base: CaseStudy = {
    id: 'x',
    title: 'X',
    difficulty: 'Easy',
    summary: 's',
    problemStatement: 'p',
    requirements: { functional: ['f'], nonFunctional: [] },
    capacityEstimation: [],
    highLevelDesign: 'h',
    deepDives: [],
    bottlenecksAndScaling: 'b',
    tradeOffs: [{ decision: 'd', explanation: 'e' }],
  };

  it('lists only the sections a case study has, in page order', () => {
    expect(caseStudySections(base).map((s) => s.id)).toEqual(['problem', 'requirements', 'high-level-design', 'scaling', 'trade-offs']);
    const full = { ...base, apiDesign: [{ method: 'GET', path: '/', description: '' }], dataModel: 'd', interviewTips: ['t'], relatedTopics: ['caching'] };
    expect(caseStudySections(full).map((s) => s.id)).toEqual([
      'problem',
      'requirements',
      'api',
      'data-model',
      'high-level-design',
      'scaling',
      'trade-offs',
      'interview-tips',
      'related',
    ]);
    expect(caseStudySections(full, false).map((s) => s.id)).not.toContain('related');
  });

  it('colours HTTP methods', () => {
    expect(methodTone('get')).toBe('blue');
    expect(methodTone('POST')).toBe('green');
    expect(methodTone('DELETE')).toBe('red');
    expect(methodTone('OPTIONS')).toBe('neutral');
  });

  it('case study ids are unique', () => {
    expect(new Set(caseStudies.map((c) => c.id)).size).toBe(caseStudies.length);
  });
});
