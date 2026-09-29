import { describe, expect, it } from 'vitest';
import { countStatuses, levelSpread, matchesFilter, nextTopic, splitTopicKey } from '../../src/learn/features/progress';
import type { ProgressStatus } from '../../src/learn/types/content';

describe('progress helpers', () => {
  it('filters by status, treating needs-review as in progress', () => {
    expect(matchesFilter('learning', 'in-progress')).toBe(true);
    expect(matchesFilter('needs-review', 'in-progress')).toBe(true);
    expect(matchesFilter('completed', 'in-progress')).toBe(false);
    expect(matchesFilter('not-started', 'not-started')).toBe(true);
    expect(matchesFilter('completed', 'all')).toBe(true);
  });

  it('counts statuses and levels', () => {
    expect(countStatuses(['completed', 'completed', 'learning'])).toEqual({ 'not-started': 0, learning: 1, completed: 2, 'needs-review': 0 });
    expect(levelSpread([{ level: 'beginner' }, { level: 'advanced' }, { level: 'beginner' }])).toEqual({ beginner: 2, intermediate: 0, advanced: 1 });
  });

  it('picks the first unfinished topic in level order', () => {
    const topics = [
      { id: 'adv', level: 'advanced' as const },
      { id: 'b1', level: 'beginner' as const },
      { id: 'b2', level: 'beginner' as const },
    ];
    const status: Record<string, ProgressStatus> = { b1: 'completed' };
    expect(nextTopic(topics, (id) => status[id] ?? 'not-started')?.id).toBe('b2');
    expect(nextTopic(topics, () => 'completed')).toBeUndefined();
  });

  it('splits progress keys on the first slash', () => {
    expect(splitTopicKey('web-fundamentals/http')).toEqual({ subjectId: 'web-fundamentals', topicId: 'http' });
  });
});
