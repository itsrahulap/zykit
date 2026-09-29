import { describe, expect, it } from 'vitest';
import { dueForReview, stampReviewed, stampStatus } from '../../src/learn/features/review';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 8, 29);

describe('status stamps', () => {
  it('records when a status was set and clears it for not started', () => {
    const s = stampStatus({}, 'js/closures', 'completed', NOW);
    expect(s).toEqual({ 'js/closures': { at: NOW } });
    expect(stampStatus(s, 'js/closures', 'not-started', NOW)).toEqual({});
    expect(stampStatus(stampReviewed(s, 'js/closures', NOW), 'js/closures', 'learning', NOW + 1)).toEqual({ 'js/closures': { at: NOW + 1 } });
  });

  it('counts reviews', () => {
    const once = stampReviewed({ k: { at: 0 } }, 'k', NOW);
    expect(once).toEqual({ k: { at: NOW, reviews: 1 } });
    expect(stampReviewed(once, 'k', NOW + 5).k).toEqual({ at: NOW + 5, reviews: 2 });
  });
});

describe('due for review', () => {
  it('lists flagged topics first, then completed ones past their interval, oldest first', () => {
    const progress = {
      'a/flagged': 'needs-review',
      'a/fresh': 'completed',
      'a/week': 'completed',
      'a/old': 'completed',
      'a/reviewed': 'completed',
      'a/reviewed-long-ago': 'completed',
      'a/learning': 'learning',
      'a/legacy': 'completed', // saved before timestamps existed
    } as const;
    const stamps = {
      'a/flagged': { at: NOW - 2 * DAY },
      'a/fresh': { at: NOW - 3 * DAY },
      'a/week': { at: NOW - 7 * DAY },
      'a/old': { at: NOW - 40 * DAY },
      'a/reviewed': { at: NOW - 10 * DAY, reviews: 1 },
      'a/reviewed-long-ago': { at: NOW - 31 * DAY, reviews: 1 },
      'a/learning': { at: NOW - 90 * DAY },
    };
    expect(dueForReview(progress, stamps, NOW)).toEqual([
      { key: 'a/flagged', reason: 'needs-review', days: 2 },
      { key: 'a/old', reason: 'spaced', days: 40 },
      { key: 'a/reviewed-long-ago', reason: 'spaced', days: 31 },
      { key: 'a/week', reason: 'spaced', days: 7 },
    ]);
  });

  it('includes flagged topics without a stamp', () => {
    expect(dueForReview({ k: 'needs-review' }, {}, NOW)).toEqual([{ key: 'k', reason: 'needs-review', days: undefined }]);
  });
});
