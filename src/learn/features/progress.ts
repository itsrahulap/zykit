// Pure helpers for progress summaries and topic filters (unit-tested).

import type { ProgressStatus, TopicLevel } from '../types/content';

export type StatusFilter = 'all' | 'not-started' | 'in-progress' | 'completed';

export const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'not-started', label: 'Not started' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

/** "In progress" covers topics being learned and ones flagged for review. */
export function matchesFilter(status: ProgressStatus, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'in-progress') return status === 'learning' || status === 'needs-review';
  return status === filter;
}

export type StatusCounts = Record<ProgressStatus, number>;

export function countStatuses(statuses: ProgressStatus[]): StatusCounts {
  const counts: StatusCounts = { 'not-started': 0, learning: 0, completed: 0, 'needs-review': 0 };
  for (const s of statuses) counts[s]++;
  return counts;
}

export const LEVEL_ORDER: TopicLevel[] = ['beginner', 'intermediate', 'advanced'];

export function levelSpread(topics: { level: TopicLevel }[]): Record<TopicLevel, number> {
  const spread: Record<TopicLevel, number> = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const t of topics) spread[t.level]++;
  return spread;
}

/** Where "Start"/"Continue" should go: the first topic (in level order) that isn't completed. */
export function nextTopic<T extends { id: string; level: TopicLevel }>(topics: T[], statusOf: (id: string) => ProgressStatus): T | undefined {
  const ordered = LEVEL_ORDER.flatMap((l) => topics.filter((t) => t.level === l));
  return ordered.find((t) => statusOf(t.id) !== 'completed');
}

/** Splits a "subject/topic" progress key. */
export function splitTopicKey(key: string): { subjectId: string; topicId: string } {
  const i = key.indexOf('/');
  return { subjectId: key.slice(0, i), topicId: key.slice(i + 1) };
}
