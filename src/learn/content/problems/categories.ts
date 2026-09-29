import type { ProblemCategory } from "../../types/problem";

// Ordered roughly beginner -> advanced, matching how the patterns build on
// each other (arrays/hashing first, advanced graphs and 2-D DP last).
export const problemCategories: ProblemCategory[] = [
  { id: "arrays-hashing", title: "Arrays & Hashing", description: "Using arrays and hash tables to track, count, and look up values fast." },
  { id: "two-pointers", title: "Two Pointers", description: "Walking two positions through a sequence at once, often from both ends inward." },
  { id: "sliding-window", title: "Sliding Window", description: "Growing and shrinking a window over a sequence to track a running condition." },
  { id: "stack", title: "Stack", description: "Using last-in-first-out order to match, undo, or track nested structure." },
  { id: "binary-search", title: "Binary Search", description: "Cutting a sorted (or sorted-like) search space in half, repeatedly." },
  { id: "linked-list", title: "Linked List", description: "Rewiring pointers between nodes instead of shifting array elements." },
  { id: "trees", title: "Trees", description: "Traversing and reasoning about hierarchical, branching structures." },
  { id: "tries", title: "Tries", description: "A tree specialized for storing and searching sequences, like words." },
  { id: "heap", title: "Heap / Priority Queue", description: "Always having fast access to the smallest or largest remaining item." },
  { id: "backtracking", title: "Backtracking", description: "Exploring choices one at a time, undoing ones that don't pan out." },
  { id: "graphs", title: "Graphs", description: "Modeling and traversing networks of connected nodes." },
  { id: "advanced-graphs", title: "Advanced Graphs", description: "Shortest paths, minimum spanning trees, and topological ordering." },
  { id: "dp-1d", title: "1-D Dynamic Programming", description: "Building up an answer from smaller subproblems along one dimension." },
  { id: "dp-2d", title: "2-D Dynamic Programming", description: "The same idea as 1-D DP, tracked across two dimensions at once." },
  { id: "greedy", title: "Greedy", description: "Making the locally best choice at each step and trusting it works out." },
  { id: "intervals", title: "Intervals", description: "Comparing and merging ranges that may overlap." },
  { id: "math-geometry", title: "Math & Geometry", description: "Problems that lean on numeric reasoning or 2D grid geometry." },
  { id: "bit-manipulation", title: "Bit Manipulation", description: "Working with the individual binary bits inside a number." },
];
