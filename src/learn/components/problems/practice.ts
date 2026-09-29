// Pure helpers for the problem bank pages: ordering, filtering, difficulty mix and neighbours.

import type { ProblemDifficulty } from '../../types/problem';

export const DIFFICULTIES: ProblemDifficulty[] = ['Easy', 'Medium', 'Hard'];

export type DifficultyFilter = 'all' | ProblemDifficulty;
export type SolvedFilter = 'all' | 'solved' | 'unsolved';

interface HasDifficulty {
  id: string;
  difficulty: ProblemDifficulty;
}

/** Easy → Medium → Hard, keeping the authored order within each difficulty. */
export function sortByDifficulty<T extends HasDifficulty>(items: readonly T[]): T[] {
  return DIFFICULTIES.flatMap((d) => items.filter((p) => p.difficulty === d));
}

/** How many problems there are of each difficulty. */
export function difficultyMix(items: readonly HasDifficulty[]): Record<ProblemDifficulty, number> {
  const mix: Record<ProblemDifficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
  for (const p of items) mix[p.difficulty] += 1;
  return mix;
}

export function filterProblems<T extends HasDifficulty>(
  items: readonly T[],
  { difficulty, solved }: { difficulty: DifficultyFilter; solved: SolvedFilter },
  isSolved: (id: string) => boolean,
): T[] {
  return items.filter(
    (p) =>
      (difficulty === 'all' || p.difficulty === difficulty) &&
      (solved === 'all' || (solved === 'solved') === isSolved(p.id)),
  );
}

/** Reads a filter value from the URL, falling back to "all" for anything unknown. */
export function parseDifficultyFilter(value: string | null): DifficultyFilter {
  const match = DIFFICULTIES.find((d) => d.toLowerCase() === value?.toLowerCase());
  return match ?? 'all';
}

export function parseSolvedFilter(value: string | null): SolvedFilter {
  return value === 'solved' || value === 'unsolved' ? value : 'all';
}

/** The items before and after `id` in `items`. */
export function adjacent<T extends { id: string }>(items: readonly T[], id: string): { prev?: T; next?: T } {
  const i = items.findIndex((p) => p.id === id);
  return i === -1 ? {} : { prev: items[i - 1], next: items[i + 1] };
}

/** Percentage 0–100, rounded; 0 when there is nothing to count. */
export function percent(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
