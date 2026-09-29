// Per-viewer learning state: topic progress, recent visits, bookmarks and solved problems.

import { useCallback } from 'react';
import type { ProgressStatus, TopicLevel } from '../types/content';
import { createStore } from '../../shared/lib/store';
import { stampReviewed, stampStatus, type Stamps } from '../features/review';

export interface RecentTopic {
  subjectId: string;
  topicId: string;
  visitedAt: number;
}
export interface Bookmark {
  subjectId: string;
  topicId: string;
}

const progressStore = createStore<Record<string, ProgressStatus>>('zykit-learn-progress', {});
const recentStore = createStore<RecentTopic[]>('zykit-learn-recent', []);
const bookmarkStore = createStore<Bookmark[]>('zykit-learn-bookmarks', []);
const solvedStore = createStore<Record<string, boolean>>('zykit-learn-solved', {});
// When each status was set. Kept beside the progress map (whose stored shape is unchanged) so
// older saved progress still loads; topics without a stamp just aren't scheduled for review.
const stampStore = createStore<Stamps>('zykit-learn-progress-dates', {});

// Topic ids are only unique within a subject, so progress is keyed by "subject/topic".
export const topicKey = (subjectId: string, topicId: string) => `${subjectId}/${topicId}`;

export const PROGRESS_LABELS: Record<ProgressStatus, string> = {
  'not-started': 'Not started',
  learning: 'Learning',
  completed: 'Completed',
  'needs-review': 'Needs review',
};

export const LEVEL_LABELS: Record<TopicLevel, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

export function useProgress() {
  const progress = progressStore.use();
  const getStatus = useCallback(
    (subjectId: string, topicId: string): ProgressStatus => progress[topicKey(subjectId, topicId)] ?? 'not-started',
    [progress],
  );
  const setStatus = useCallback((subjectId: string, topicId: string, status: ProgressStatus) => {
    const key = topicKey(subjectId, topicId);
    const next = { ...progressStore.get() };
    if (status === 'not-started') delete next[key];
    else next[key] = status;
    progressStore.set(next);
    stampStore.set(stampStatus(stampStore.get(), key, status, Date.now()));
  }, []);
  /** Percentage (0–100) of the given topics marked completed. */
  const completion = useCallback(
    (subjectId: string, topicIds: string[]) => {
      if (topicIds.length === 0) return 0;
      const done = topicIds.filter((id) => progress[topicKey(subjectId, id)] === 'completed').length;
      return Math.round((done / topicIds.length) * 100);
    },
    [progress],
  );
  return { progress, getStatus, setStatus, completion };
}

/** Records a topic visit: moves an unstarted topic to "learning" and adds it to recent history. */
export function recordVisit(subjectId: string, topicId: string) {
  const key = topicKey(subjectId, topicId);
  if (!progressStore.get()[key]) {
    progressStore.set({ ...progressStore.get(), [key]: 'learning' });
    stampStore.set(stampStatus(stampStore.get(), key, 'learning', Date.now()));
  }
  const rest = recentStore.get().filter((e) => !(e.subjectId === subjectId && e.topicId === topicId));
  recentStore.set([{ subjectId, topicId, visitedAt: Date.now() }, ...rest].slice(0, 10));
}

export const useRecentTopics = () => recentStore.use();

/** Status timestamps, and marking a completed topic as reviewed (restarts its review clock). */
export function useStatusStamps() {
  const stamps = stampStore.use();
  const markReviewed = useCallback((subjectId: string, topicId: string) => {
    stampStore.set(stampReviewed(stampStore.get(), topicKey(subjectId, topicId), Date.now()));
  }, []);
  return { stamps, markReviewed };
}

export function useBookmarks() {
  const bookmarks = bookmarkStore.use();
  const isBookmarked = useCallback(
    (subjectId: string, topicId: string) => bookmarks.some((b) => b.subjectId === subjectId && b.topicId === topicId),
    [bookmarks],
  );
  const toggleBookmark = useCallback((subjectId: string, topicId: string) => {
    const all = bookmarkStore.get();
    const has = all.some((b) => b.subjectId === subjectId && b.topicId === topicId);
    bookmarkStore.set(has ? all.filter((b) => !(b.subjectId === subjectId && b.topicId === topicId)) : [...all, { subjectId, topicId }]);
  }, []);
  return { bookmarks, isBookmarked, toggleBookmark };
}

export function useSolvedProblems() {
  const solved = solvedStore.use();
  const isSolved = useCallback((problemId: string) => Boolean(solved[problemId]), [solved]);
  const toggleSolved = useCallback((problemId: string) => {
    const next = { ...solvedStore.get() };
    if (next[problemId]) delete next[problemId];
    else next[problemId] = true;
    solvedStore.set(next);
  }, []);
  const solvedCount = useCallback((ids: string[]) => ids.filter((id) => solved[id]).length, [solved]);
  return { solved, isSolved, toggleSolved, solvedCount };
}
