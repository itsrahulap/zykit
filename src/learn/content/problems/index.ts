import type { Problem, ProblemCategory } from "../../types/problem";
import { problemCategories } from "./categories";
import { arraysHashingProblems } from "./arrays-hashing";
import { twoPointersProblems } from "./two-pointers";
import { slidingWindowProblems } from "./sliding-window";
import { stackProblems } from "./stack";
import { binarySearchProblems } from "./binary-search";
import { linkedListProblems } from "./linked-list";
import { treesProblems } from "./trees";
import { treesBstProblems } from "./trees-bst";
import { triesProblems } from "./tries";
import { heapProblems } from "./heap";
import { backtrackingProblems } from "./backtracking";
import { graphsProblems } from "./graphs";
import { graphsMoreProblems } from "./graphs-more";
import { advancedGraphsProblems } from "./advanced-graphs";
import { dp1dProblems } from "./dp-1d";
import { dp2dProblems } from "./dp-2d";
import { greedyProblems } from "./greedy";
import { intervalsProblems } from "./intervals";
import { mathGeometryProblems } from "./math-geometry";
import { bitManipulationProblems } from "./bit-manipulation";

/** All problems, in category order. */
export const allProblems: Problem[] = [
  ...arraysHashingProblems,
  ...twoPointersProblems,
  ...slidingWindowProblems,
  ...stackProblems,
  ...binarySearchProblems,
  ...linkedListProblems,
  ...treesProblems,
  ...treesBstProblems,
  ...triesProblems,
  ...heapProblems,
  ...backtrackingProblems,
  ...graphsProblems,
  ...graphsMoreProblems,
  ...advancedGraphsProblems,
  ...dp1dProblems,
  ...dp2dProblems,
  ...greedyProblems,
  ...intervalsProblems,
  ...mathGeometryProblems,
  ...bitManipulationProblems,
];

export { problemCategories };

export function getCategory(id: string): ProblemCategory | undefined {
  return problemCategories.find((c) => c.id === id);
}

export function getProblemsByCategory(categoryId: string): Problem[] {
  return allProblems.filter((p) => p.category === categoryId);
}

export function getProblem(categoryId: string, problemId: string): Problem | undefined {
  return allProblems.find((p) => p.category === categoryId && p.id === problemId);
}

export function getProblemCount(categoryId: string): number {
  return getProblemsByCategory(categoryId).length;
}
