// Spaced review: topics flagged "needs review", plus completed topics whose completion (or last
// review) is old enough — 7 days after completing, then every 30 days. Pure, unit-tested.

import type { ProgressStatus } from '../types/content';

/** When a topic's status was last set (ms since epoch) and how many times it's been reviewed since. */
export interface StatusStamp {
  at: number;
  reviews?: number;
}
export type Stamps = Record<string, StatusStamp>;

const DAY = 24 * 60 * 60 * 1000;
export const FIRST_REVIEW_DAYS = 7;
export const LATER_REVIEW_DAYS = 30;

/** Stamps after setting `status` on `key`: a fresh timestamp, or none for "not started". */
export function stampStatus(stamps: Stamps, key: string, status: ProgressStatus, now: number): Stamps {
  const next = { ...stamps };
  if (status === 'not-started') delete next[key];
  else next[key] = { at: now };
  return next;
}

/** Stamps after reviewing a completed topic: restarts its clock with a longer interval. */
export function stampReviewed(stamps: Stamps, key: string, now: number): Stamps {
  return { ...stamps, [key]: { at: now, reviews: (stamps[key]?.reviews ?? 0) + 1 } };
}

export interface DueItem {
  key: string;
  reason: 'needs-review' | 'spaced';
  /** Whole days since the status was set or last reviewed (undefined if never recorded). */
  days?: number;
}

/**
 * Topics due for review, flagged ones first, then the longest-waiting completed ones.
 * Progress saved before timestamps existed has no stamp; such completed topics aren't due.
 */
export function dueForReview(progress: Record<string, ProgressStatus>, stamps: Stamps, now: number): DueItem[] {
  const flagged: DueItem[] = [];
  const spaced: (DueItem & { age: number })[] = [];
  for (const [key, status] of Object.entries(progress)) {
    const stamp = stamps[key];
    const age = stamp && Number.isFinite(stamp.at) ? now - stamp.at : undefined;
    const days = age === undefined ? undefined : Math.max(0, Math.floor(age / DAY));
    if (status === 'needs-review') flagged.push({ key, reason: 'needs-review', days });
    else if (status === 'completed' && age !== undefined) {
      const interval = (stamp.reviews ?? 0) > 0 ? LATER_REVIEW_DAYS : FIRST_REVIEW_DAYS;
      if (age >= interval * DAY) spaced.push({ key, reason: 'spaced', days, age });
    }
  }
  spaced.sort((a, b) => b.age - a.age);
  return [...flagged, ...spaced.map(({ key, reason, days }) => ({ key, reason, days }))];
}
