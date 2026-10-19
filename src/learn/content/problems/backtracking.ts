import type { Problem } from "../../types/problem";

export const backtrackingProblems: Problem[] = [
  {
    id: "subsets",
    title: "Subsets",
    difficulty: "Medium",
    category: "backtracking",
    description: `
Given a list of distinct numbers, return every possible subset - including
the empty subset and the full list.

The order of numbers within a subset, and the order of subsets, don't
matter.
    `.trim(),
    examples: [
      {
        input: "nums = [1, 2, 3]",
        output: "[[], [1], [2], [1,2], [3], [1,3], [2,3], [1,2,3]]",
        explanation: "There are 2^3 = 8 ways to include or exclude each of the three numbers.",
      },
      {
        input: "nums = [0]",
        output: "[[], [0]]",
        explanation: "A single number has exactly two subsets: empty, and itself.",
      },
    ],
    constraints: ["1 <= nums.length <= 10", "-10 <= nums[i] <= 10", "All numbers in nums are unique."],
    hints: [
      "Each number is either in a subset or not. If you decide that for every number in order, how many decision sequences are there?",
      "Build a subset one number at a time. At each number, either add it or skip it. What if you explore both choices for every number?",
      "After fully exploring 'include', remove the number before trying 'skip' - otherwise the skip branch still contains it.",
    ],
    approachOverview: `
Each number is either included or excluded, so try both for every
number.

The brute-force way lists all 2^n combinations of in/out decisions (one
per number). Each combination describes exactly one subset.

A more natural way builds one subset at a time. Include a number and move
on to the next. After exploring every path that starts with "included",
undo that choice and explore every path with "excluded". Trying a choice,
exploring what follows, then undoing it is the core of **backtracking** -
and it visits every subset exactly once.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Bitmask Enumeration",
        explanation: "Each subset is a sequence of n include/exclude decisions - exactly what an n-bit binary number represents. Loop through every integer from 0 to 2^n - 1: if bit i is 1, include nums[i].",
        code: `function subsets(nums) {
  const n = nums.length;
  const result = [];

  for (let mask = 0; mask < (1 << n); mask++) {
    const subset = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        subset.push(nums[i]);
      }
    }
    result.push(subset);
  }

  return result;
}`,
        timeComplexity: "O(2^n * n)",
        spaceComplexity: "O(2^n * n)",
      },
      {
        approach: "Optimal — Backtracking (Choose / Explore / Un-choose)",
        explanation: "Build one subset at a time in a running list. At each number, first include it (push, recurse, pop), then skip it (just recurse). When you reach the end of the list, the subset is complete - save a copy.",
        code: `function subsets(nums) {
  const result = [];
  const current = [];

  function backtrack(index) {
    if (index === nums.length) {
      result.push([...current]);
      return;
    }

    // Choice 1: include nums[index]
    current.push(nums[index]);
    backtrack(index + 1);
    current.pop(); // undo the choice

    // Choice 2: skip nums[index]
    backtrack(index + 1);
  }

  backtrack(0);
  return result;
}`,
        timeComplexity: "O(2^n * n)",
        spaceComplexity: "O(n) auxiliary (recursion depth), plus O(2^n * n) for the output",
        walkthrough: [
          {
            code: "if (index === nums.length) { result.push([...current]); return; }",
            explanation: "Base case: every number has been decided, so the subset is complete - save a copy.",
          },
          {
            code: "current.push(nums[index]); backtrack(index + 1); current.pop();",
            explanation: "Include this number: add it, explore what follows, then remove it to restore the array.",
          },
          {
            code: "backtrack(index + 1);",
            explanation: "Skip this number: move to the next index without adding it - the \"excluded\" branch.",
          },
        ],
      },
    ],
    relatedProblems: ["subsets-ii", "permutations", "combination-sum"],
    keywords: ["subsets", "power set", "backtracking", "bitmask"],
  },
  {
    id: "combination-sum",
    title: "Combination Sum",
    difficulty: "Medium",
    category: "backtracking",
    description: `
Given a list of distinct positive numbers (candidates) and a target, find
every unique combination of candidates that adds up exactly to the target.

You can use a candidate any number of times. Combinations with the same
numbers used the same number of times are the same, whatever the order,
so list each one only once.
    `.trim(),
    examples: [
      {
        input: "candidates = [2, 3, 6, 7], target = 7",
        output: "[[2, 2, 3], [7]]",
        explanation: "2 + 2 + 3 = 7, using the 2 twice. And 7 by itself also works.",
      },
      {
        input: "candidates = [2, 3, 5], target = 8",
        output: "[[2, 2, 2, 2], [2, 3, 3], [3, 5]]",
        explanation: "Three different ways to reach 8 using repeats of 2 and/or 3.",
      },
      {
        input: "candidates = [2], target = 1",
        output: "[]",
        explanation: "No combination of 2s can ever add up to 1.",
      },
    ],
    constraints: [
      "1 <= candidates.length <= 30",
      "2 <= candidates[i] <= 40",
      "All elements of candidates are distinct.",
      "1 <= target <= 40",
    ],
    hints: [
      "At each step, choose which candidate to add next. Repeats are allowed, so the same candidate can be chosen again.",
      "To avoid building the same combination twice (like [2,3] and [3,2]), only pick candidates from the one you last used onward, never an earlier one.",
      "Track the remaining target. At exactly zero, you've found a combination. Below zero, the path can't work - stop.",
    ],
    approachOverview: `
Build a combination one number at a time, deciding which candidate to add
next. Repeats are allowed, so you can add the same one again. To avoid
the same combination in a different order, only move forward through the
candidates, never back.

The straightforward version tries every candidate at every step, stopping
when the total matches the target (a valid combination) or exceeds it (a
dead end). After trying a candidate, remove it before trying the next -
the choose/explore/un-choose pattern of backtracking.

Sorting the candidates first makes it faster. Once adding a candidate
would overshoot the target, every later (bigger) candidate would too, so
you can stop that step instead of checking each one.
    `.trim(),
    solutions: [
      {
        approach: "Backtracking — Try Every Candidate",
        explanation: "At each step, loop over candidates from the current index onward. Add one, recurse with the same index (so it can be reused) and a smaller remaining target, then remove it. Stop a path when the remaining target hits zero (success) or goes negative (dead end).",
        code: `function combinationSum(candidates, target) {
  const result = [];
  const current = [];

  function backtrack(start, remaining) {
    if (remaining === 0) {
      result.push([...current]);
      return;
    }
    if (remaining < 0) {
      return;
    }

    for (let i = start; i < candidates.length; i++) {
      current.push(candidates[i]);
      backtrack(i, remaining - candidates[i]); // i, not i + 1: reuse allowed
      current.pop();
    }
  }

  backtrack(0, target);
  return result;
}`,
        timeComplexity: "O(2^target) in the worst case",
        spaceComplexity: "O(target / min(candidates)) recursion depth, plus output storage",
        walkthrough: [
          {
            code: "if (remaining === 0) { result.push([...current]); return; }",
            explanation: "The combination adds up exactly to the target - save a copy.",
          },
          {
            code: "if (remaining < 0) { return; }",
            explanation: "This path overshot the target and can never work, so stop.",
          },
          {
            code: "backtrack(i, remaining - candidates[i]);",
            explanation: "Passing i (not i + 1) lets candidates[i] be reused in the same combination.",
          },
        ],
      },
      {
        approach: "Optimal — Sort and Prune",
        explanation: "Sort the candidates first. At each step, once a candidate would push the total past the target, stop - every later candidate is at least as large, so none of them can work.",
        code: `function combinationSum(candidates, target) {
  const sorted = [...candidates].sort((a, b) => a - b);
  const result = [];
  const current = [];

  function backtrack(start, remaining) {
    if (remaining === 0) {
      result.push([...current]);
      return;
    }

    for (let i = start; i < sorted.length; i++) {
      if (sorted[i] > remaining) break; // every candidate after this is even bigger

      current.push(sorted[i]);
      backtrack(i, remaining - sorted[i]);
      current.pop();
    }
  }

  backtrack(0, target);
  return result;
}`,
        timeComplexity: "O(2^target) worst case, but far fewer branches explored in practice",
        spaceComplexity: "O(target / min(candidates)) recursion depth, plus a sorted copy of the input",
      },
    ],
    relatedProblems: ["combination-sum-ii", "subsets"],
    keywords: ["combination sum", "backtracking", "pruning", "unlimited reuse"],
  },
  {
    id: "permutations",
    title: "Permutations",
    difficulty: "Medium",
    category: "backtracking",
    description: `
Given a list of distinct numbers, return every possible ordering
(permutation), using each number exactly once per ordering.
    `.trim(),
    examples: [
      {
        input: "nums = [1, 2, 3]",
        output: "[[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]",
        explanation: "There are 3! = 6 ways to arrange three distinct numbers.",
      },
      {
        input: "nums = [0, 1]",
        output: "[[0,1], [1,0]]",
        explanation: "Two numbers can be arranged in 2! = 2 ways.",
      },
    ],
    constraints: ["1 <= nums.length <= 6", "All numbers in nums are unique."],
    hints: [
      "At each position, you can place any number not yet used in this arrangement.",
      "Track which numbers are already placed, so you don't place one twice.",
      "After exploring every arrangement with a number in a spot, mark it unused again before trying a different number there.",
    ],
    approachOverview: `
Build one arrangement a position at a time. At each position, try every
number not already used in this arrangement, then fill the next position.
When every position is filled, you have one permutation.

Track "used" with an array of booleans. Before placing a number, check it
isn't used; after exploring what follows, mark it unused before trying the
next candidate. It's the same try/explore/undo rhythm, applied to
positions instead of include/exclude decisions.

A neat trick skips the tracker: keep the numbers in one array, swap each
candidate further down into the current position, recurse, then swap
back. Everything before the current position is locked in; everything
from it onward is still available - so no separate "used" structure is
needed.
    `.trim(),
    solutions: [
      {
        approach: "Backtracking — Track Used Numbers",
        explanation: "Build the arrangement in an array, with a boolean array marking placed numbers. At each position, try every unused number: mark it used, place it, recurse, then remove it and unmark it.",
        code: `function permute(nums) {
  const result = [];
  const current = [];
  const used = new Array(nums.length).fill(false);

  function backtrack() {
    if (current.length === nums.length) {
      result.push([...current]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;

      used[i] = true;
      current.push(nums[i]);

      backtrack();

      current.pop();
      used[i] = false;
    }
  }

  backtrack();
  return result;
}`,
        timeComplexity: "O(n * n!)",
        spaceComplexity: "O(n) auxiliary (used array + recursion + current array), plus O(n * n!) output",
        walkthrough: [
          {
            code: "if (current.length === nums.length) { result.push([...current]); return; }",
            explanation: "Every position is filled, so the arrangement is complete - save a copy.",
          },
          {
            code: "if (used[i]) continue;",
            explanation: "Skip numbers already placed in this arrangement.",
          },
          {
            code: "used[i] = true; current.push(nums[i]); backtrack();",
            explanation: "Place this number, mark it used, and explore every arrangement from here.",
          },
          {
            code: "current.pop(); used[i] = false;",
            explanation: "Undo the placement so the next candidate can be tried here.",
          },
        ],
      },
      {
        approach: "Optimal — In-Place Swapping",
        explanation: "Skip the \"used\" tracker: everything before the current position is locked in, and everything from it onward is still available. To try a candidate, swap it into place, recurse on the next position, then swap back - no extra array needed.",
        code: `function permute(nums) {
  const result = [];

  function backtrack(start) {
    if (start === nums.length) {
      result.push([...nums]);
      return;
    }

    for (let i = start; i < nums.length; i++) {
      [nums[start], nums[i]] = [nums[i], nums[start]];

      backtrack(start + 1);

      [nums[start], nums[i]] = [nums[i], nums[start]]; // swap back
    }
  }

  backtrack(0);
  return result;
}`,
        timeComplexity: "O(n * n!)",
        spaceComplexity: "O(n) recursion depth only (no separate tracker), plus O(n * n!) output",
      },
    ],
    relatedProblems: ["subsets", "n-queens"],
    keywords: ["permutations", "backtracking", "swap", "arrangements"],
  },
  {
    id: "subsets-ii",
    title: "Subsets II",
    difficulty: "Medium",
    category: "backtracking",
    description: `
Given a list of numbers that may contain repeats, return every possible
subset (including the empty one and the full list). The answer must not
contain two identical subsets (same values, same counts).
    `.trim(),
    examples: [
      {
        input: "nums = [1, 2, 2]",
        output: "[[], [1], [2], [1,2], [2,2], [1,2,2]]",
        explanation: "Without de-duplication you'd also get a second [1,2] and a second [2] (from picking either of the two 2s) - those repeats are left out.",
      },
      {
        input: "nums = [4, 4, 4, 1]",
        output: "[[], [1], [4], [4,1], [4,4], [4,4,1], [4,4,4], [4,4,4,1]]",
        explanation: "The three 4s are indistinguishable, so a subset is defined only by how many 4s it contains (0-3), not which ones.",
      },
    ],
    constraints: ["1 <= nums.length <= 10", "-10 <= nums[i] <= 10"],
    hints: [
      "With the plain include/exclude search, equal values produce the same subset more than once.",
      "You could generate everything and remove repeats afterward - but that wastes work building subsets you'll discard.",
      "Cleaner: sort the list so equal values are neighbors. When choosing the next number at a step, skip a value equal to the one just before it at that step - this skips the duplicate branch before exploring it.",
    ],
    approachOverview: `
This is the plain subsets search, except duplicate values can reach the
same subset by two paths - choosing "the first 2" or "the second 2" gives
an identical subset.

The brute-force fix runs the normal search and filters duplicates
afterward, for example by turning each subset into a sorted string key
and keeping only the first subset per key.

A more direct fix never generates duplicates. Sort the input so equal
values are neighbors. When choosing what to include next at a step, skip
a value equal to the one you just decided *not* to include at that step.
This one rule stops the search from re-exploring a branch it has already
covered.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Generate Then De-duplicate",
        explanation: "Run the plain include/exclude backtracking, ignoring duplicates. This produces repeats of subsets reached through different equal values. Afterward, key each subset on its sorted, comma-joined values and keep one copy per key.",
        code: `function subsetsWithDup(nums) {
  const all = [];
  const current = [];

  function backtrack(index) {
    if (index === nums.length) {
      all.push([...current]);
      return;
    }
    current.push(nums[index]);
    backtrack(index + 1);
    current.pop();
    backtrack(index + 1);
  }

  backtrack(0);

  const seen = new Set();
  const result = [];
  for (const subset of all) {
    const key = [...subset].sort((a, b) => a - b).join(",");
    if (!seen.has(key)) {
      seen.add(key);
      result.push(subset);
    }
  }

  return result;
}`,
        timeComplexity: "O(2^n * n) to generate every subset, plus O(2^n * n) to key and de-duplicate them",
        spaceComplexity: "O(2^n * n) for the raw subsets and the de-duplication set",
      },
      {
        approach: "Optimal — Sort and Skip Duplicate Branches",
        explanation: "Sort the input, then build subsets by choosing which index to include next. Skip a value equal to the previous element at the same step - its branch is already covered by the first occurrence.",
        code: `function subsetsWithDup(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const result = [];
  const current = [];

  function backtrack(start) {
    result.push([...current]);

    for (let i = start; i < sorted.length; i++) {
      if (i > start && sorted[i] === sorted[i - 1]) continue; // skip duplicate at this level

      current.push(sorted[i]);
      backtrack(i + 1);
      current.pop();
    }
  }

  backtrack(0);
  return result;
}`,
        timeComplexity: "O(2^n * n)",
        spaceComplexity: "O(n) auxiliary (recursion + current array), plus O(2^n * n) output",
        walkthrough: [
          {
            code: "result.push([...current]);",
            explanation: "Every set of choices so far is a valid subset, so it's recorded on entering the call - not only at the end.",
          },
          {
            code: "if (i > start && sorted[i] === sorted[i - 1]) continue;",
            explanation: "Only the first of a repeated value is tried at this step; a later equal value would rebuild the same subsets.",
          },
          {
            code: "current.push(sorted[i]); backtrack(i + 1); current.pop();",
            explanation: "Includes this value, explores what follows, then removes it before trying the next distinct value.",
          },
        ],
      },
    ],
    relatedProblems: ["subsets", "combination-sum-ii"],
    keywords: ["subsets", "duplicates", "backtracking", "sorting"],
  },
  {
    id: "combination-sum-ii",
    title: "Combination Sum II",
    difficulty: "Medium",
    category: "backtracking",
    description: `
Given a list of numbers (which may repeat) and a target, find every
unique combination from the list that adds up exactly to the target.

Each number can be used only as many times as it appears (if 5 appears
twice, a combination may use two 5s, not three). The answer must not
contain the same combination twice.
    `.trim(),
    examples: [
      {
        input: "candidates = [10, 1, 2, 7, 6, 1, 5], target = 8",
        output: "[[1,1,6], [1,2,5], [1,7], [2,6]]",
        explanation: "The two 1s in the input let [1,1,6] use both of them, but each combination is only listed once even though there are two different 1s to pick from.",
      },
      {
        input: "candidates = [2, 5, 2, 1, 2], target = 5",
        output: "[[1,2,2], [5]]",
        explanation: "There are three 2s available, so [1,2,2] can use two of them - but it's still only listed once.",
      },
    ],
    constraints: ["1 <= candidates.length <= 100", "1 <= candidates[i] <= 50", "1 <= target <= 30"],
    hints: [
      "Each position can be used once, so after using a candidate, the next pick comes from a later position.",
      "Sorting groups equal values together, so you can tell \"using 1 a second time\" apart from \"starting a new combination with a 1 that skips the first 1.\"",
      "If you skip a value at a step, skip every later equal value at that step too - it would only rebuild a combination the first one already covers.",
    ],
    approachOverview: `
This is like Combination Sum, except each position can be used only once,
and repeated values need care so no combination appears twice.

"Use each position once" is easy: after using candidates[i], the next
pick comes from i + 1 onward.

Duplicate values are trickier. The brute-force fix searches freely and
removes repeat combinations afterward, as in Subsets II. The cleaner fix
sorts the candidates, and when you skip a value at a step, also skips any
later equal value at that step - so no two branches build the same
combination.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Backtrack Then De-duplicate",
        explanation: "Move forward through the unsorted list, using each position at most once, and collect every combination that sums to the target. Duplicate values can build the same combination more than once, so afterward key each result on its sorted, comma-joined values to remove repeats.",
        code: `function combinationSum2(candidates, target) {
  const all = [];
  const current = [];

  function backtrack(start, remaining) {
    if (remaining === 0) {
      all.push([...current]);
      return;
    }
    if (remaining < 0) return;

    for (let i = start; i < candidates.length; i++) {
      current.push(candidates[i]);
      backtrack(i + 1, remaining - candidates[i]);
      current.pop();
    }
  }

  backtrack(0, target);

  const seen = new Set();
  const result = [];
  for (const combo of all) {
    const key = [...combo].sort((a, b) => a - b).join(",");
    if (!seen.has(key)) {
      seen.add(key);
      result.push(combo);
    }
  }

  return result;
}`,
        timeComplexity: "O(2^n * n) to generate combinations, plus O(2^n * n) to key and de-duplicate them",
        spaceComplexity: "O(2^n * n) for the raw combinations and the de-duplication set",
      },
      {
        approach: "Optimal — Sort and Skip Duplicate Branches",
        explanation: "Sort the candidates so equal values are neighbors. Move forward through the list (never reusing a position), and at each step skip a candidate equal to the one before it - trying only the first equal value covers every combination with that value. Stop a branch when the remaining target hits zero or a candidate would overshoot it.",
        code: `function combinationSum2(candidates, target) {
  const sorted = [...candidates].sort((a, b) => a - b);
  const result = [];
  const current = [];

  function backtrack(start, remaining) {
    if (remaining === 0) {
      result.push([...current]);
      return;
    }

    for (let i = start; i < sorted.length; i++) {
      if (sorted[i] > remaining) break; // sorted, so nothing further can work either

      if (i > start && sorted[i] === sorted[i - 1]) continue; // skip duplicate at this level

      current.push(sorted[i]);
      backtrack(i + 1, remaining - sorted[i]); // i + 1: this position can't be reused
      current.pop();
    }
  }

  backtrack(0, target);
  return result;
}`,
        timeComplexity: "O(2^n) worst case",
        spaceComplexity: "O(n) recursion depth, plus a sorted copy of the input",
        walkthrough: [
          {
            code: "if (sorted[i] > remaining) break;",
            explanation: "The array is sorted, so once a candidate is too big, every later one is too - stop this step.",
          },
          {
            code: "if (i > start && sorted[i] === sorted[i - 1]) continue;",
            explanation: "Skips a value equal to one already tried at this step, so no combination is built twice.",
          },
          {
            code: "backtrack(i + 1, remaining - sorted[i]);",
            explanation: "Uses i + 1, not i, so this position is never reused.",
          },
        ],
      },
    ],
    relatedProblems: ["combination-sum", "subsets-ii"],
    keywords: ["combination sum", "duplicates", "backtracking", "sorting"],
  },
  {
    id: "word-search",
    title: "Word Search",
    difficulty: "Medium",
    category: "backtracking",
    description: `
Given a grid of letters and a word, decide whether the word can be traced
by moving between adjacent cells (up, down, left or right - not
diagonally), using each cell at most once.

Return *true* if some path spells the word, and *false* otherwise.
    `.trim(),
    examples: [
      {
        input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"',
        output: "true",
        explanation: "Starting at the top-left A, you can trace A -> B -> C -> C -> E -> D moving through adjacent cells without reusing any of them.",
      },
      {
        input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"',
        output: "true",
        explanation: "Starting from the S in the middle row, you can trace S -> E -> E down the right side of the grid.",
      },
      {
        input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"',
        output: "false",
        explanation: "Tracing A -> B -> C reaches a C, but the only B adjacent to that C is the one already used at the start - and a cell can't be reused.",
      },
    ],
    constraints: ["1 <= board.length, board[i].length <= 6", "1 <= word.length <= 15", "board and word consist only of English letters."],
    hints: [
      "Try every cell as a starting point for the first letter.",
      "The next letter must be in one of the up to four neighbors - and in a cell not already used on this path.",
      "At a dead end (no neighbor matches the next letter), back up: free the last cell and try a different neighbor from the step before.",
    ],
    approachOverview: `
The word could start anywhere, so try every cell. From a cell matching
the first letter, look for a neighbor matching the second letter, then
for the third among *its* neighbors, and so on.

Remember which cells are on the current path so none is reused. At a dead
end - no unused neighbor matches the next letter - back up: free the last
cell and try a different neighbor from the step before. That's
backtracking: commit to a cell, explore what follows, and undo the choice
when it stops working.

You can track used cells with a separate grid of true/false flags. A
leaner way overwrites a used cell's letter with a placeholder while
exploring from it, then restores the letter when backing out. A
placeholder never matches a real letter, so it blocks reuse with no extra
memory.
    `.trim(),
    solutions: [
      {
        approach: "Backtracking — Separate Visited Grid",
        explanation: "Start the search from every cell. If the cell's letter matches the next letter needed, mark it visited and recursively check whether the rest of the word can be traced from an unvisited neighbor. Un-mark the cell before returning so other paths can use it.",
        code: `function exist(board, word) {
  const rows = board.length;
  const cols = board[0].length;
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));

  function search(row, col, index) {
    if (index === word.length) return true;
    if (
      row < 0 || row >= rows ||
      col < 0 || col >= cols ||
      visited[row][col] ||
      board[row][col] !== word[index]
    ) {
      return false;
    }

    visited[row][col] = true;

    const found =
      search(row + 1, col, index + 1) ||
      search(row - 1, col, index + 1) ||
      search(row, col + 1, index + 1) ||
      search(row, col - 1, index + 1);

    visited[row][col] = false; // undo, whether or not it worked out

    return found;
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (search(row, col, 0)) return true;
    }
  }

  return false;
}`,
        timeComplexity: "O(rows * cols * 4^L), where L is the word's length",
        spaceComplexity: "O(rows * cols) for the visited grid, plus O(L) recursion depth",
        walkthrough: [
          {
            code: "if (index === word.length) return true;",
            explanation: "Every letter has been matched along this path - success.",
          },
          {
            code: "visited[row][col] || board[row][col] !== word[index]",
            explanation: "Stops if this cell is already on the path or its letter doesn't match the one needed.",
          },
          {
            code: "visited[row][col] = true; /* ...explore... */ visited[row][col] = false;",
            explanation: "Marks the cell used while exploring its neighbors, then frees it - success or not - so other paths can use it.",
          },
        ],
      },
      {
        approach: "Optimal — Mark In-Place Instead of a Visited Grid",
        explanation: "Skip the visited grid. While exploring from a cell, overwrite its letter with a sentinel character (one that never appears in the word), then restore it. This saves the rows x cols grid, at the cost of briefly changing the board during the search.",
        code: `function exist(board, word) {
  const rows = board.length;
  const cols = board[0].length;

  function search(row, col, index) {
    if (index === word.length) return true;
    if (
      row < 0 || row >= rows ||
      col < 0 || col >= cols ||
      board[row][col] !== word[index]
    ) {
      return false;
    }

    const original = board[row][col];
    board[row][col] = "#"; // sentinel: can never match a real letter

    const found =
      search(row + 1, col, index + 1) ||
      search(row - 1, col, index + 1) ||
      search(row, col + 1, index + 1) ||
      search(row, col - 1, index + 1);

    board[row][col] = original; // restore before returning

    return found;
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (search(row, col, 0)) return true;
    }
  }

  return false;
}`,
        timeComplexity: "O(rows * cols * 4^L)",
        spaceComplexity: "O(L) recursion depth only - no visited grid, since the board itself is restored after use",
      },
    ],
    relatedProblems: ["palindrome-partitioning", "n-queens"],
    keywords: ["word search", "grid", "backtracking", "dfs", "matrix"],
  },
  {
    id: "palindrome-partitioning",
    title: "Palindrome Partitioning",
    difficulty: "Medium",
    category: "backtracking",
    description: `
A *palindrome* reads the same forwards and backwards, like "aba" or
"racecar" (a single letter always is one). Given a string, find every way
to split it into consecutive pieces where every piece is a palindrome.
    `.trim(),
    examples: [
      {
        input: 's = "aab"',
        output: '[["a","a","b"], ["aa","b"]]',
        explanation: 'Splitting into "a","a","b" works because each piece reads the same both ways. Splitting into "aa","b" also works. Splitting into "a","ab" does not, because "ab" isn\'t a palindrome.',
      },
      {
        input: 's = "a"',
        output: '[["a"]]',
        explanation: "A single letter is always a palindrome by itself, and there's only one piece possible.",
      },
    ],
    constraints: ["1 <= s.length <= 16", "s consists only of lowercase English letters."],
    hints: [
      "Choose where the first piece ends. If it's a palindrome, the rest is the same problem on what's left.",
      "At each cut point, check that the piece is a palindrome before committing - if not, move to the next cut.",
      "The same substring gets checked many times across partitions. Precomputing every check once saves a lot of repeated work.",
    ],
    approachOverview: `
Build a partition one piece at a time. From the current position, try
every length for the next piece. If that substring is a palindrome, take
it and recurse on the rest. Reaching the end of the string means every
piece was a palindrome, so the path is a valid partition.

The simple version re-checks each substring from scratch by comparing
characters from both ends inward. That works, but the same substring is
often checked many times.

A faster version precomputes "is s[i..j] a palindrome" for every i and j.
s[i..j] is a palindrome exactly when s[i] equals s[j] *and* s[i+1..j-1] is
also a palindrome. With that table, each check during the search is an
instant lookup.
    `.trim(),
    solutions: [
      {
        approach: "Backtracking — Check Each Cut Directly",
        explanation: "From a given position, try every end point for the next piece. Check each piece from both ends inward; if it's a palindrome, add it, recurse from right after it, then remove it before trying the next end point.",
        code: `function partition(s) {
  const result = [];
  const current = [];

  function isPalindrome(start, end) {
    while (start < end) {
      if (s[start] !== s[end]) return false;
      start++;
      end--;
    }
    return true;
  }

  function backtrack(start) {
    if (start === s.length) {
      result.push([...current]);
      return;
    }

    for (let end = start; end < s.length; end++) {
      if (isPalindrome(start, end)) {
        current.push(s.slice(start, end + 1));
        backtrack(end + 1);
        current.pop();
      }
    }
  }

  backtrack(0);
  return result;
}`,
        timeComplexity: "O(n * 2^n)",
        spaceComplexity: "O(n) recursion depth, plus output storage",
        walkthrough: [
          {
            code: "if (start === s.length) { result.push([...current]); return; }",
            explanation: "Reaching the end means every piece was a palindrome - the partition is complete.",
          },
          {
            code: "if (isPalindrome(start, end)) {",
            explanation: "Only takes a piece once it's confirmed to be a palindrome.",
          },
          {
            code: "current.push(s.slice(start, end + 1)); backtrack(end + 1); current.pop();",
            explanation: "Adds the piece, explores every partition of the rest, then removes it to try a different length.",
          },
        ],
      },
      {
        approach: "Optimal — Precompute Palindromes with a DP Table",
        explanation: "Before searching, build a table isPalindrome[i][j] for whether s[i..j] is a palindrome, filling shorter substrings first. s[i..j] is a palindrome exactly when s[i] === s[j] and the substring inside is also a palindrome (or too short to need checking). During the search, each check is a table lookup instead of an O(n) scan.",
        code: `function partition(s) {
  const n = s.length;
  const isPalindrome = Array.from({ length: n }, () => new Array(n).fill(false));

  for (let end = 0; end < n; end++) {
    for (let start = end; start >= 0; start--) {
      if (s[start] === s[end] && (end - start <= 2 || isPalindrome[start + 1][end - 1])) {
        isPalindrome[start][end] = true;
      }
    }
  }

  const result = [];
  const current = [];

  function backtrack(start) {
    if (start === n) {
      result.push([...current]);
      return;
    }

    for (let end = start; end < n; end++) {
      if (isPalindrome[start][end]) {
        current.push(s.slice(start, end + 1));
        backtrack(end + 1);
        current.pop();
      }
    }
  }

  backtrack(0);
  return result;
}`,
        timeComplexity: "O(n^2) to precompute the table, plus O(n * 2^n) to generate all partitions - the partition count is unavoidable, but each palindrome check is now O(1) instead of O(n)",
        spaceComplexity: "O(n^2) for the DP table, plus O(n) recursion depth",
      },
    ],
    relatedProblems: ["word-search", "subsets"],
    keywords: ["palindrome partitioning", "backtracking", "dynamic programming", "strings"],
  },
  {
    id: "letter-combinations-phone-number",
    title: "Letter Combinations of a Phone Number",
    difficulty: "Medium",
    category: "backtracking",
    description: `
On a phone keypad, each digit from 2 to 9 has a few letters (2 -> abc,
3 -> def, and so on). Given a string of digits, return every letter
combination the digits could represent - one letter per digit, in order.

If the input is empty, return no combinations.
    `.trim(),
    examples: [
      {
        input: 'digits = "23"',
        output: '["ad","ae","af","bd","be","bf","cd","ce","cf"]',
        explanation: "2 maps to a/b/c and 3 maps to d/e/f, so every pairing of one letter from each gives 3 x 3 = 9 combinations.",
      },
      {
        input: 'digits = ""',
        output: "[]",
        explanation: "No digits means no combinations at all.",
      },
      {
        input: 'digits = "2"',
        output: '["a","b","c"]',
        explanation: "A single digit just gives its own letters, one per combination.",
      },
    ],
    constraints: ["0 <= digits.length <= 4", 'Each character of digits is between "2" and "9".'],
    hints: [
      "Each digit adds one of its 3 or 4 letters, so the combinations pair every choice for the first digit with every choice for the second, and so on.",
      "You could build level by level: start with an empty combination, and for each digit, extend every combination so far with each of its letters.",
      "Or build one combination at a time: pick a letter for this digit, move to the next, and when every digit has a letter, record it - then back up and try the next letter for the last digit.",
    ],
    approachOverview: `
Each digit adds exactly one of its letters, so the answer is every way
to pick one letter per digit, in order.

One way builds level by level: start with a list holding the empty
string. For each digit, replace the list with every partial combination
extended by each of that digit's letters. After the last digit, the list
holds every combination.

A more memory-efficient way builds one combination at a time instead of
keeping a whole intermediate list. Pick a letter for the current digit,
move to the next, and record the combination once every digit has a
letter. Then back up and try the next letter for the last digit - the
same choose/explore/undo rhythm, working through digits instead of array
positions.
    `.trim(),
    solutions: [
      {
        approach: "Iterative — Build Up Combinations Level by Level",
        explanation: "Keep a list of partial combinations, starting with the empty string. For each digit, build a new list by appending each of its letters to every partial combination. After the last digit, the list holds every combination.",
        code: `function letterCombinations(digits) {
  if (digits.length === 0) return [];

  const digitToLetters = {
    "2": "abc", "3": "def", "4": "ghi", "5": "jkl",
    "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz",
  };

  let combinations = [""];

  for (const digit of digits) {
    const letters = digitToLetters[digit];
    const next = [];

    for (const combo of combinations) {
      for (const letter of letters) {
        next.push(combo + letter);
      }
    }

    combinations = next;
  }

  return combinations;
}`,
        timeComplexity: "O(n * 4^n), where n is the number of digits",
        spaceComplexity: "O(n * 4^n) for the intermediate and final combination lists",
      },
      {
        approach: "Optimal — Backtracking, One Combination at a Time",
        explanation: "Build one combination in a running string, digit by digit. At each digit, try each of its letters: append it, recurse into the next digit, then remove it. Record the string once every digit has a letter.",
        code: `function letterCombinations(digits) {
  if (digits.length === 0) return [];

  const digitToLetters = {
    "2": "abc", "3": "def", "4": "ghi", "5": "jkl",
    "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz",
  };

  const result = [];
  let current = "";

  function backtrack(index) {
    if (index === digits.length) {
      result.push(current);
      return;
    }

    const letters = digitToLetters[digits[index]];
    for (const letter of letters) {
      current += letter;
      backtrack(index + 1);
      current = current.slice(0, -1); // undo
    }
  }

  backtrack(0);
  return result;
}`,
        timeComplexity: "O(n * 4^n)",
        spaceComplexity: "O(n) auxiliary (recursion depth + the running string), plus output storage",
        walkthrough: [
          {
            code: "if (index === digits.length) { result.push(current); return; }",
            explanation: "Every digit has a letter, so the string is one complete combination.",
          },
          {
            code: "current += letter;",
            explanation: "Tries this letter for the current digit.",
          },
          {
            code: "backtrack(index + 1);",
            explanation: "Moves to the next digit, exploring everything that follows from this choice.",
          },
          {
            code: "current = current.slice(0, -1);",
            explanation: "Removes the letter so the next letter for this digit can be tried.",
          },
        ],
      },
    ],
    relatedProblems: ["subsets", "permutations"],
    keywords: ["letter combinations", "phone number", "backtracking", "keypad"],
  },
  {
    id: "n-queens",
    title: "N-Queens",
    difficulty: "Hard",
    category: "backtracking",
    description: `
Place n queens on an n x n chessboard so that no two attack each other -
no two share a row, column or diagonal.

Return every distinct placement. Each solution is one full board, with
each row written using "Q" for a queen and "." for an empty square.
    `.trim(),
    examples: [
      {
        input: "n = 4",
        output: '[[".Q..","...Q","Q...","..Q."], ["..Q.","Q...","...Q",".Q.."]]',
        explanation: "There are exactly two ways to place 4 non-attacking queens on a 4x4 board. In the first, the queens sit at row 0 col 1, row 1 col 3, row 2 col 0, and row 3 col 2.",
      },
      {
        input: "n = 1",
        output: '[["Q"]]',
        explanation: "A single queen on a 1x1 board never conflicts with anything.",
      },
    ],
    constraints: ["1 <= n <= 9"],
    hints: [
      "No two queens can share a row, so place exactly one per row - the question becomes \"which column in each row.\"",
      "When placing a queen, you need to know which columns and diagonals earlier queens already use.",
      "Two cells share a diagonal if their row - column values match, or their row + column values match. Tracking both lets you check diagonals instantly instead of scanning the board.",
    ],
    approachOverview: `
No two queens can share a row, so place them one row at a time: choose a
column for row 0, then a non-conflicting column for row 1, and so on.
When every row has a queen with no conflicts, you have one solution.

The simple conflict check compares the candidate with every queen in
earlier rows (columns and diagonals). It's easy to write, but re-scans all
earlier queens on every attempt.

A faster way keeps three trackers: used columns and the two used diagonal
directions. One diagonal is identified by row minus column, the other by
row plus column - two cells on the same diagonal share one of these
values. Checking a column is then a lookup instead of a scan, and
removing a queen just removes its column and diagonals from the trackers.
    `.trim(),
    solutions: [
      {
        approach: "Backtracking — Scan Previously Placed Queens",
        explanation: "Place queens row by row. For each row, try every column, checking that no queen in an earlier row shares the column or either diagonal. If it's safe, place the queen, recurse into the next row, then remove it and try the next column.",
        code: `function solveNQueens(n) {
  const result = [];
  const queenCol = new Array(n).fill(-1); // queenCol[row] = column of the queen in that row

  function isSafe(row, col) {
    for (let prevRow = 0; prevRow < row; prevRow++) {
      const prevCol = queenCol[prevRow];
      const sameCol = prevCol === col;
      const sameDiagonal = Math.abs(prevRow - row) === Math.abs(prevCol - col);
      if (sameCol || sameDiagonal) return false;
    }
    return true;
  }

  function buildBoard() {
    return queenCol.map((col) => ".".repeat(col) + "Q" + ".".repeat(n - col - 1));
  }

  function backtrack(row) {
    if (row === n) {
      result.push(buildBoard());
      return;
    }

    for (let col = 0; col < n; col++) {
      if (isSafe(row, col)) {
        queenCol[row] = col;
        backtrack(row + 1);
        queenCol[row] = -1; // undo
      }
    }
  }

  backtrack(0);
  return result;
}`,
        timeComplexity: "O(n! * n) - roughly n! branching once pruning kicks in, times O(n) per safety scan",
        spaceComplexity: "O(n) for the queenCol array and recursion depth (output is separate)",
        walkthrough: [
          {
            code: "const sameCol = prevCol === col; const sameDiagonal = Math.abs(prevRow - row) === Math.abs(prevCol - col);",
            explanation: "Checks whether an earlier queen shares this column or a diagonal (equal row and column differences mean same diagonal).",
          },
          {
            code: "queenCol[row] = col; backtrack(row + 1); queenCol[row] = -1;",
            explanation: "Places the queen in this column, explores the remaining rows, then clears it to try the next column.",
          },
        ],
      },
      {
        approach: "Optimal — Track Columns and Diagonals with Sets",
        explanation: "Instead of re-scanning earlier queens, keep three sets: used columns, used \"row minus column\" diagonals, and used \"row plus column\" diagonals. Placing or removing a queen adds or deletes one entry in each set, and checking a column is three constant-time lookups.",
        code: `function solveNQueens(n) {
  const result = [];
  const queenCol = new Array(n).fill(-1);
  const usedCols = new Set();
  const usedDiag1 = new Set(); // row - col
  const usedDiag2 = new Set(); // row + col

  function buildBoard() {
    return queenCol.map((col) => ".".repeat(col) + "Q" + ".".repeat(n - col - 1));
  }

  function backtrack(row) {
    if (row === n) {
      result.push(buildBoard());
      return;
    }

    for (let col = 0; col < n; col++) {
      const d1 = row - col;
      const d2 = row + col;
      if (usedCols.has(col) || usedDiag1.has(d1) || usedDiag2.has(d2)) continue;

      queenCol[row] = col;
      usedCols.add(col);
      usedDiag1.add(d1);
      usedDiag2.add(d2);

      backtrack(row + 1);

      usedCols.delete(col);
      usedDiag1.delete(d1);
      usedDiag2.delete(d2);
    }
  }

  backtrack(0);
  return result;
}`,
        timeComplexity: "O(n!) - each placement check is now O(1) instead of O(n)",
        spaceComplexity: "O(n) for the tracking sets and recursion depth (output is separate)",
      },
    ],
    relatedProblems: ["word-search", "permutations"],
    keywords: ["n-queens", "backtracking", "chessboard", "constraint satisfaction"],
  },
];
