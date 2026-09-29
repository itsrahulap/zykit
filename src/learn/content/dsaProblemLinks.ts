
export const dsaTopicToProblemCategories: Record<string, string[]> = {
  "big-o": [],
  arrays: ["arrays-hashing", "two-pointers"],
  strings: ["sliding-window"],
  "linked-lists": ["linked-list"],
  stack: ["stack"],
  queue: ["graphs"],
  "hash-tables": ["arrays-hashing"],
  recursion: ["backtracking", "dp-1d"],
  "binary-search": ["binary-search"],
  sorting: ["intervals", "greedy"],
};

/** Problem categories that best let you practice a given DSA concept topic. */
export function getProblemCategoriesForTopic(topicId: string): string[] {
  return dsaTopicToProblemCategories[topicId] ?? [];
}

/** DSA concept topic ids that teach the idea behind a given problem category. */
export function getDsaTopicsForProblemCategory(categoryId: string): string[] {
  return Object.entries(dsaTopicToProblemCategories)
    .filter(([, categories]) => categories.includes(categoryId))
    .map(([topicId]) => topicId);
}
