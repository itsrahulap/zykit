import type { Problem } from "../../types/problem";

export const backtrackingProblems: Problem[] = [
  {
    id: "subsets",
    title: "Subsets",
    difficulty: "Medium",
    category: "backtracking",
    description: `
You're given a list of numbers where every number is different from every
other number in the list. Your task is to list out every possible group
you could form by picking any subset of these numbers - including the
empty group (picking nothing at all) and the full list itself (picking
everything).

The order of the numbers within a group, and the order the groups appear
in your answer, don't matter.
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
      "Every number in the list has exactly two possible fates: it's either in a given subset, or it isn't. If you had to decide that for every number in order, how many total decision sequences are there?",
      "Think of building a subset one number at a time. At each number, you have a choice: add it to the subset you're building, or skip it. What happens if you explore both choices for every number?",
      "After exploring one choice all the way (say, including a number), you need to remove it again before trying the other choice (skipping it) - otherwise your 'skip' attempt still has that number sitting in it.",
    ],
    approachOverview: `
The most direct way to see every subset is to literally try, for each
number, both of its two fates - included or excluded - and see where
each combination of choices leads.

One brute-force way to do this is to line up all 2^n combinations of
yes/no decisions (for n numbers, one "in or out" decision per number)
and read them off directly - each combination of decisions describes
exactly one subset.

A more natural way to explore the same set of choices is to build one
subset at a time: pick a number, decide to include it, and move on to
the next number. Once you've explored every path that starts with
"included", undo that choice (remove the number) and explore every path
that starts with "excluded" instead. Trying a choice, exploring
everything that follows from it, and then undoing it to try the next
choice is the core idea behind **backtracking** - and it naturally
visits every subset exactly once.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Bitmask Enumeration",
        explanation: "Every subset corresponds to a unique sequence of \"include\" / \"exclude\" decisions, one per number - and a sequence of n yes/no decisions is exactly what an n-bit binary number represents. Walk through every integer from 0 to 2^n - 1, and use its binary digits as instructions: if bit i is 1, include nums[i] in this subset.",
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
        explanation: "Build one subset at a time with a running list. At each number, first try including it (push it onto the current subset, recurse on the rest, then pop it back off), then try skipping it (just recurse on the rest, without ever adding it). Every time you reach the end of the list, the current running subset is complete - record a copy of it.",
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
            explanation: "Base case: we've made a decision for every number, so the subset currently being built is complete - save a copy of it.",
          },
          {
            code: "current.push(nums[index]); backtrack(index + 1); current.pop();",
            explanation: "Try including this number: add it, explore everything that follows, then remove it again so the array is back to how it was before this branch.",
          },
          {
            code: "backtrack(index + 1);",
            explanation: "Try skipping this number: move to the next index without ever having added it - this is the \"excluded\" branch.",
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
You're given a list of distinct positive numbers (called candidates) and
a target number. Find every unique combination of candidates that adds
up exactly to the target.

You're allowed to use the same candidate as many times as you like in
one combination - there's no limit on repeats. Two combinations count as
the same if they use the same numbers the same number of times,
regardless of order, so don't list a combination more than once.
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
      "At each step, you're choosing which candidate to add next to the combination you're building - and since repeats are allowed, that same candidate can be chosen again right after.",
      "To avoid ever building the same combination twice (like [2,3] and [3,2]), only allow yourself to pick candidates starting from the one you most recently used onward, never going back to an earlier one.",
      "Track the amount still needed (the remaining target). If it ever hits exactly zero, you've found a valid combination. If it drops below zero, that path can't work - stop exploring it.",
    ],
    approachOverview: `
Think of building a combination one number at a time, always deciding
"which candidate do I add next?" Since repeats are allowed, after adding
a candidate you're allowed to add that exact same one again - but to
avoid producing the same combination in a different order, you only
move forward through the candidate list, never backward.

A straightforward version of this explores every candidate at every
step, only stopping once the running total exactly matches the target
(a valid combination) or exceeds it (a dead end that gets abandoned).
After trying a candidate, you "un-add" it - remove it from the running
combination - before trying the next one, which is exactly the
choose/explore/un-choose pattern of backtracking.

You can make the same search noticeably faster with one extra trick:
sort the candidates first. Once they're in order, as soon as adding the
next candidate would already overshoot the target, every candidate
after it (being even bigger) would overshoot too - so you can stop
trying candidates at that step entirely, instead of checking each one
individually.
    `.trim(),
    solutions: [
      {
        approach: "Backtracking — Try Every Candidate",
        explanation: "At every step, loop over all candidates starting from the current index onward (allowing the current index to repeat). Add a candidate to the running combination, recurse with that same starting index (since it can be reused) and a smaller remaining target, then remove it before trying the next candidate. Stop a path as soon as the remaining target hits zero (success) or goes negative (dead end).",
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
            explanation: "The running combination adds up exactly to the target - save a copy of it.",
          },
          {
            code: "if (remaining < 0) { return; }",
            explanation: "We've added too much on this path - it can never work, so stop exploring it.",
          },
          {
            code: "backtrack(i, remaining - candidates[i]);",
            explanation: "Passes i (not i + 1) as the next starting point, which is exactly what allows candidates[i] to be reused later in the same combination.",
          },
        ],
      },
      {
        approach: "Optimal — Sort and Prune",
        explanation: "Sort the candidates first. Then, at each step, skip any candidate that would already push the running total past the target - and since the list is sorted, every candidate after it is at least as large, so you can stop checking that branch entirely instead of testing each one and discovering it fails.",
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
You're given a list of numbers, all different from each other. List out
every possible way to reorder them - every distinct arrangement
(permutation) of all the numbers, using each number exactly once per
arrangement.
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
      "At each position in the arrangement you're building, you can place any number that hasn't been used yet in this arrangement so far.",
      "You'll need to remember which numbers are already \"placed\" in the arrangement you're currently building, so you don't place the same number twice.",
      "Once you finish exploring every arrangement that starts with a given number in a given spot, you need to free that number back up (mark it unused) before trying a different number in that spot.",
    ],
    approachOverview: `
Build one arrangement at a time, one position at a time. At each
position, try placing every number that hasn't already been used
earlier in this same arrangement, then move on to fill the next
position. When every position is filled, you've completed one full
permutation.

The natural way to track "already used" is a small tracker (an array of
booleans) alongside the arrangement you're building. Before placing a
number, check it isn't already used; after exploring everything that
follows from placing it, mark it unused again before trying the next
candidate for that position - the same try/explore/undo rhythm as
before, just applied to positions in an arrangement instead of yes/no
inclusion decisions.

There's also a neat trick that avoids the tracker altogether: keep the
numbers in a single array, and instead of asking "which unused number
goes here", swap the number currently in this position with each
candidate further down the array, recurse, and then swap back.
Everything before the current position is "locked in", and everything
from the current position onward is still "up for grabs" - so you never
need a separate structure to remember what's used.
    `.trim(),
    solutions: [
      {
        approach: "Backtracking — Track Used Numbers",
        explanation: "Build the current arrangement in an array, alongside a parallel boolean array marking which numbers are already placed. At each position, try every number that isn't marked used: mark it used, place it, recurse into the next position, then unmark it and remove it before trying the next candidate.",
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
            explanation: "Once every position is filled, the arrangement is complete - save a copy of it.",
          },
          {
            code: "if (used[i]) continue;",
            explanation: "Skip any number that's already placed somewhere earlier in this arrangement.",
          },
          {
            code: "used[i] = true; current.push(nums[i]); backtrack();",
            explanation: "Place this number, mark it used, and explore every arrangement that continues from here.",
          },
          {
            code: "current.pop(); used[i] = false;",
            explanation: "Undo the placement so the next candidate for this position can be tried with a clean slate.",
          },
        ],
      },
      {
        approach: "Optimal — In-Place Swapping",
        explanation: "Instead of a separate \"used\" tracker, treat everything before the current position as locked in and everything from the current position onward as the pool of numbers still available. To try a candidate for the current position, swap it into place, recurse on the next position, then swap back to undo it - freeing up that spot for the next candidate without needing any extra bookkeeping array.",
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
You're given a list of numbers that might contain repeats - the same
value could appear more than once. List out every possible subset
(including the empty one and the full list), but this time make sure
your answer never contains two subsets that look the same (same values,
same counts), even though the input has duplicate values.
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
      "If you try every include/exclude decision the same way as when values were all unique, you'll end up generating the exact same subset more than once whenever two equal values are both candidates at the same point.",
      "One fix is to just generate everything (duplicates included) and then throw away repeats afterward - but that means doing extra work building subsets you're only going to discard.",
      "A cleaner fix: first sort the list so equal values sit next to each other. Then, at any point where you're deciding which number to include next, skip a value if it's the same as the one you already skipped right before it at that same step - that skips the duplicate branch before you ever explore it.",
    ],
    approachOverview: `
This is the same include/exclude exploration as the plain subsets
problem, except that duplicate values in the input can make the search
visit the exact same subset from two different paths - for example,
choosing "the first 2" versus "the second 2" produces an
identical-looking subset either way.

A brute-force fix is to run the ordinary subset search exactly as
before, letting it produce duplicate subsets, and then filter the
results afterward - for instance by turning each subset into a sorted,
stringified key and only keeping the first subset seen for each key.

A more direct fix avoids ever generating the duplicate in the first
place: sort the input so identical values become neighbors, and while
deciding what to include next at a given step, skip over a value if
it's identical to the value you just decided *not* to include at that
same step. That one rule prevents the search from ever re-exploring a
branch it's effectively already covered.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Generate Then De-duplicate",
        explanation: "Run the same include/exclude backtracking as ordinary subsets, without worrying about duplicate values at all. This produces every subset, including repeats of the same subset reached through different combinations of equal values. Afterward, collapse duplicates by keying each subset on its sorted, comma-joined values and keeping only one copy per key.",
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
        explanation: "Sort the input first, then build subsets by deciding, at each index, whether to include it or move past it - but skip an \"include\" choice when this value is identical to the previous element in the sorted array at this same step, since that would explore a branch already fully covered by the first occurrence.",
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
            explanation: "Every prefix of decisions made so far is itself a valid subset, so it's recorded the moment we enter this call - not just at the very end.",
          },
          {
            code: "if (i > start && sorted[i] === sorted[i - 1]) continue;",
            explanation: "At this step, only the first occurrence of a repeated value is tried as a fresh choice; a later, equal value would just rebuild subsets already reachable through the first one.",
          },
          {
            code: "current.push(sorted[i]); backtrack(i + 1); current.pop();",
            explanation: "Includes this value, explores everything that can follow it, then removes it before trying the next distinct value at this step.",
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
You're given a list of numbers (which may include repeated values) and a
target number. Find every unique combination of numbers from the list
that adds up exactly to the target.

This time, each number can only be used as many times as it appears in
the list (for example, if 5 shows up twice in the input, a combination
may use two 5s, but not three) - and even though the input can have
duplicate values, your answer must not contain the same combination more
than once.
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
      "Since each value can only be used as many times as it appears, once you use a candidate you should move on to a later position for the next pick, rather than being allowed to reuse the same position.",
      "Sorting the candidates first groups equal values together, which makes it possible to tell apart \"using the value 1 for the second time in this combination\" from \"starting a brand-new combination with the value 1 that skips over the first 1 entirely.\"",
      "At any given step, if you decide not to include a particular value, don't include any later, equal value at that same step either - that second one would only rebuild a combination you could already build by including the first.",
    ],
    approachOverview: `
This is like the earlier combination-sum problem, except each position
in the input can only contribute once instead of unlimited times, and
repeated values in the input need special handling so you don't end up
with the same combination twice.

Handling "use each position once" is straightforward: once you use
candidates[i], the next pick has to come from position i + 1 onward,
never i again.

The trickier part is the duplicate values. A brute-force fix is to
search without worrying about duplicates and then remove repeat
combinations from the results afterward, the same de-duplication trick
used for Subsets II. The cleaner fix is to sort the candidates first,
then, whenever you decide to skip a value at a given step, also skip any
later value at that same step that's identical to it - so you never
explore two branches that would build the exact same combination.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Backtrack Then De-duplicate",
        explanation: "Move forward through the (unsorted) list one position at a time, using each position at most once, and collect every combination that sums exactly to the target. Because the input can hold duplicate values at different positions, the same combination can be built more than once - so afterward, collapse duplicates by keying each result on its sorted, comma-joined values.",
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
        explanation: "Sort the candidates so equal values sit next to each other. Move forward through the list one position at a time (never revisiting a used position), and at each step skip over a candidate if it's equal to the one right before it at this same step - only the first equal value gets tried, which is enough to cover every combination that uses that value. Stop a branch as soon as the remaining target hits zero or a candidate would overshoot it.",
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
            explanation: "Since the array is sorted, once one candidate is too big, every candidate after it is too, so we stop trying candidates at this step entirely.",
          },
          {
            code: "if (i > start && sorted[i] === sorted[i - 1]) continue;",
            explanation: "Skips a value that's identical to one already tried at this same step, so the same combination never gets built twice.",
          },
          {
            code: "backtrack(i + 1, remaining - sorted[i]);",
            explanation: "Moves on using i + 1, not i, so this exact position in the list is never reused.",
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
You're given a grid of letters and a target word. Determine whether the
word can be traced out by moving from cell to adjacent cell (up, down,
left, or right - not diagonally), where each cell in the grid can be
used at most once while tracing out that particular word.

Return *true* if some path through the grid spells the word letter by
letter, and *false* if no such path exists.
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
      "The word has to start somewhere, so try every cell in the grid as a possible starting point for the first letter.",
      "From wherever you are, the next letter of the word has to be found in one of the up-to-four neighboring cells - and it has to be a cell you haven't already used on this particular path.",
      "If a path reaches a dead end (no matching neighbor for the next letter), you need to back up: free the last cell you used, and try a different neighbor from the step before.",
    ],
    approachOverview: `
Since the word could start at any position on the grid, try every cell
as a possible starting point. From a starting cell that matches the
word's first letter, look at its neighbors for one that matches the
second letter, then from there look for the third letter among *its*
neighbors, and so on.

Along the way, you need to remember which cells are already part of the
path so far, so the search never reuses one. If a path runs into a dead
end - no unused neighbor matches the next letter needed - back up:
un-mark the most recently used cell as available again, and try a
different neighbor from the step before. That backing-up step is
exactly what makes this backtracking: you commit to a cell, explore
everything that follows, and undo the commitment the moment it stops
paying off.

One way to track "already used" is a separate grid of true/false flags.
A slightly leaner way skips the extra grid entirely: temporarily
overwrite a used cell's letter with a placeholder character while
exploring from it, then restore the original letter once you back up out
of that cell - since a placeholder can never match a real letter, it
naturally blocks reuse without needing any extra memory.
    `.trim(),
    solutions: [
      {
        approach: "Backtracking — Separate Visited Grid",
        explanation: "Try starting the search from every cell. At each step, if the current cell's letter matches the letter the word needs at this point, mark the cell visited and recursively check whether the rest of the word can be traced from one of its unvisited neighbors. If a neighbor doesn't pan out, un-mark the current cell before returning, so a different starting path can reuse it.",
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
            explanation: "Every letter of the word has been matched along this path - success.",
          },
          {
            code: "visited[row][col] || board[row][col] !== word[index]",
            explanation: "Bails out if this cell is already used on the current path, or its letter doesn't match the letter the word needs right now.",
          },
          {
            code: "visited[row][col] = true; /* ...explore... */ visited[row][col] = false;",
            explanation: "Marks the cell used before exploring its neighbors, then frees it again once that exploration is done - whether it succeeded or not - so other paths can still use it.",
          },
        ],
      },
      {
        approach: "Optimal — Mark In-Place Instead of a Visited Grid",
        explanation: "Skip the separate visited grid. Instead, temporarily overwrite a cell's letter with a sentinel character (one that can never appear in the word) while exploring from it, then restore the original letter afterward. This saves the extra rows x cols grid, at the cost of briefly mutating the board during the search.",
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
You're given a string. A *palindrome* is a string that reads the same
forwards and backwards, like "aba" or "racecar" (or even a single
letter, which is always a palindrome). Split (partition) the string into
pieces, placed in order, such that every single piece is a palindrome -
and find every distinct way of splitting it that works.
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
      "Think of choosing where the first piece ends. Once you've decided the first piece is a palindrome, the rest of the problem is just \"partition what's left the same way.\"",
      "For each possible cut point, you need to check whether the piece up to that point is actually a palindrome before committing to it - if it isn't, that cut doesn't lead anywhere and you move to the next one.",
      "You'll end up checking whether the same substring is a palindrome more than once across different partitions - precomputing all of those checks up front, once each, can save a lot of repeated work.",
    ],
    approachOverview: `
Build a partition one piece at a time. At the current starting point in
the string, try every possible length for the next piece; if the
substring of that length starting here is a palindrome, commit to it as
the next piece and recurse on everything after it. When you reach the
end of the string, every piece chosen along the way was a palindrome, so
the whole path is a valid partition.

A straightforward version of this re-checks "is this substring a
palindrome" from scratch every single time it's needed, by comparing
characters from both ends inward. That works, but the same substring
often gets checked more than once across different partitions being
explored.

A faster version precomputes the answer to "is s[i..j] a palindrome" for
every possible i and j up front, using the fact that s[i..j] is a
palindrome exactly when s[i] equals s[j] *and* everything strictly
between them (s[i+1..j-1]) is also a palindrome. Once that table exists,
checking any substring during the search is an instant lookup instead of
a fresh scan.
    `.trim(),
    solutions: [
      {
        approach: "Backtracking — Check Each Cut Directly",
        explanation: "Starting from a given position, try every possible end point for the next piece. For each candidate piece, scan it from both ends inward to check it's a palindrome; if it is, add it to the current partition, recurse starting right after it, and then remove it before trying a longer (or shorter) next piece.",
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
            explanation: "Reaching the end of the string means every piece chosen so far was a palindrome - the current partition is complete.",
          },
          {
            code: "if (isPalindrome(start, end)) {",
            explanation: "Only commits to a candidate piece once it's confirmed to read the same forwards and backwards.",
          },
          {
            code: "current.push(s.slice(start, end + 1)); backtrack(end + 1); current.pop();",
            explanation: "Adds the piece, explores every partition of what remains after it, then removes it to try a different length for this piece.",
          },
        ],
      },
      {
        approach: "Optimal — Precompute Palindromes with a DP Table",
        explanation: "Before searching, build a table isPalindrome[i][j] that says whether s[i..j] is a palindrome, filling it in for shorter substrings first: s[i..j] is a palindrome exactly when s[i] === s[j] and the substring strictly inside them is also a palindrome (or is short enough not to need checking). During the backtracking search, every palindrome check then becomes a single table lookup instead of an O(n) scan.",
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
        timeComplexity: "O(n^2) to precompute the table, plus O(n * 2^n) to generate all partitions - the number of partitions is unavoidable, but each palindrome check during the search is now O(1) instead of O(n)",
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
On an old phone keypad, each digit from 2 to 9 is printed with a few
letters on it (2 -> abc, 3 -> def, and so on, the same layout as a
physical telephone keypad). Given a string of digits, return every
possible letter combination that the digits could represent - one letter
chosen per digit, in order.

If the input is empty, there are no combinations to return.
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
      "Each digit contributes one letter to the final combination, chosen from that digit's 3 or 4 possible letters - so the total combinations come from pairing every choice for the first digit with every choice for the second, and so on.",
      "You could build this up level by level: start with an empty combination, and for each digit, extend every combination built so far with every letter that digit allows.",
      "Alternatively, build one combination at a time: pick a letter for the current digit, move to the next digit, and once you've picked a letter for every digit, you have one complete combination - then back up and try the next letter for the last digit you touched.",
    ],
    approachOverview: `
Each digit in the input contributes exactly one letter to the final
string, chosen from that digit's handful of possible letters. The full
answer is every way of picking one letter per digit, in order.

One way to build this is level by level: start with a list containing
just the empty string, and for each digit in turn, replace that list
with a new one where every existing partial combination has been
extended by every letter that digit allows. After processing every
digit, the list holds every complete combination.

A more memory-efficient way builds one combination at a time instead of
keeping a whole intermediate list alive at every step: pick a letter for
the current digit, move on to the next digit, and once every digit has a
letter, record the finished combination. Then back up - try the next
letter for the digit you most recently picked - which is the same
choose/explore/undo rhythm you've seen in every other backtracking
problem, just working through digits instead of array positions.
    `.trim(),
    solutions: [
      {
        approach: "Iterative — Build Up Combinations Level by Level",
        explanation: "Keep a running list of partial combinations, starting with just the empty string. For each digit, build a brand-new list by taking every partial combination built so far and appending every letter that digit maps to. After the last digit, the list holds every full combination.",
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
        explanation: "Build a single combination in a running string as you move digit by digit. At each digit, try every letter it maps to: append the letter, recurse into the next digit, then remove the letter before trying the next one. Record the running string once every digit has been given a letter.",
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
            explanation: "Every digit has been given a letter, so the running string is one complete, finished combination.",
          },
          {
            code: "current += letter;",
            explanation: "Tries this letter for the current digit by appending it to the combination being built.",
          },
          {
            code: "backtrack(index + 1);",
            explanation: "Moves on to give the next digit a letter, exploring everything that follows from this choice.",
          },
          {
            code: "current = current.slice(0, -1);",
            explanation: "Removes the letter just tried so the next candidate letter for this same digit starts from a clean combination.",
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
On an n x n chessboard, place n queens so that no two queens attack each
other - meaning no two queens share the same row, the same column, or
the same diagonal.

Return every distinct way to place the queens that satisfies this rule.
Each solution should describe one full board: for every row, show which
column (if any) holds a queen, using "Q" for a queen and "." for an
empty square.
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
      "Since no two queens can share a row, you can place exactly one queen per row - so the problem becomes \"which column, in each row, in turn.\"",
      "As you place a queen in a row, you need to know which columns are already taken, and which diagonals are already taken, by queens placed in earlier rows.",
      "Two cells share a diagonal if the difference of their (row, column) values is the same, or if the sum of their (row, column) values is the same - tracking those two quantities as you go lets you check a diagonal conflict instantly instead of scanning the whole board.",
    ],
    approachOverview: `
Since no two queens can ever share a row, you can decide the placement
one row at a time: for row 0, choose a column; for row 1, choose a
column that doesn't conflict with row 0's queen; and so on. Once every
row has a queen placed without conflicts, you have one complete, valid
solution.

A straightforward way to check "does this column conflict with an
earlier queen" is to look back at every queen already placed in previous
rows and compare columns and diagonals directly - simple to write, but
it re-scans all previously placed queens on every single attempt.

A faster way keeps three running trackers as you go: which columns
already have a queen, and which of the two diagonal directions already
have a queen (a cell's "diagonal identity" in one direction is row minus
column, and in the other direction it's row plus column - two cells on
the same diagonal always share one of these two values). Checking a
candidate column against these trackers is then a single lookup instead
of a scan, and un-placing a queen is just removing its column and
diagonals from the trackers again before trying the next column.
    `.trim(),
    solutions: [
      {
        approach: "Backtracking — Scan Previously Placed Queens",
        explanation: "Place queens row by row. For each row, try every column; before committing, check every queen already placed in earlier rows to make sure none of them shares this column or either diagonal. If a column is safe, place the queen there, recurse into the next row, then remove it and try the next column.",
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
            explanation: "Checks whether an earlier queen shares this column, or sits on one of the two diagonals through this cell (equal row/column differences means same diagonal).",
          },
          {
            code: "queenCol[row] = col; backtrack(row + 1); queenCol[row] = -1;",
            explanation: "Commits to this column for the current row, explores every arrangement of the remaining rows, then clears the row's placement to try the next column.",
          },
        ],
      },
      {
        approach: "Optimal — Track Columns and Diagonals with Sets",
        explanation: "Instead of re-scanning earlier queens on every check, maintain three sets as you go: used columns, used \"row minus column\" diagonals, and used \"row plus column\" diagonals. Placing or removing a queen just adds or deletes one entry from each of the three sets, and checking whether a column is safe becomes three constant-time lookups instead of a scan back through every earlier row.",
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
