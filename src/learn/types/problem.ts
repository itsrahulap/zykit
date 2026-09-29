// Types for the DSA Problems bank — a large set of solved practice problems,
// organized by pattern/category, distinct from the concept-teaching Topic
// model in content.ts. A Topic teaches an idea; a Problem is a worked
// exercise applying one or more ideas, with multiple solution approaches.

export type ProblemDifficulty = "Easy" | "Medium" | "Hard";

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

/** One line of code (or small chunk) paired with a plain-language explanation. */
export interface ProblemWalkthroughStep {
  code: string;
  explanation: string;
}

export interface ProblemSolution {
  /** Short label, e.g. "Brute Force", "Two Pointers", "Optimal — Hash Map". */
  approach: string;
  /** Plain-language explanation of the idea, before the code. */
  explanation: string;
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
  /** Optional line-by-line breakdown of this solution's code. */
  walkthrough?: ProblemWalkthroughStep[];
}

export interface Problem {
  id: string;
  title: string;
  difficulty: ProblemDifficulty;
  /** Category id this problem belongs to (see categories.ts). */
  category: string;
  /** Plain-language problem statement. Explain the task before naming any pattern. */
  description: string;
  examples: ProblemExample[];
  constraints?: string[];
  /** Progressive hints, revealed one at a time in the UI. */
  hints?: string[];
  /** How to think about solving it, before diving into code. */
  approachOverview: string;
  /** At least two approaches, ordered simplest/brute-force to optimal. */
  solutions: ProblemSolution[];
  /** Related problem ids, resolved within the same category. */
  relatedProblems?: string[];
  keywords?: string[];
}

export interface ProblemCategory {
  id: string;
  title: string;
  /** One-line description of the pattern this category covers. */
  description: string;
}
