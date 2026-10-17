import type { Problem } from "../../types/problem";

export const binarySearchProblems: Problem[] = [
  {
    id: "binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    category: "binary-search",
    description: `
You're given a list of numbers sorted from smallest to largest, with no
duplicates, and a target number.

Find the target's index in the list. If it isn't there, say so.
    `.trim(),
    examples: [
      {
        input: "nums = [-1, 0, 3, 5, 9, 12], target = 9",
        output: "4",
        explanation: "9 sits at index 4 in the list.",
      },
      {
        input: "nums = [-1, 0, 3, 5, 9, 12], target = 2",
        output: "-1",
        explanation: "2 doesn't appear anywhere in the list, so there's no valid index to return.",
      },
      {
        input: "nums = [5], target = 5",
        output: "0",
        explanation: "A single-element list where that one element is the target.",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10^4",
      "-10^4 < nums[i], target < 10^4",
      "All the integers in nums are unique.",
      "nums is sorted in ascending order.",
    ],
    hints: [
      "Checking every element works, but the list being sorted is a clue that you can do better.",
      "Compare the target to the middle element. That tells you which half it could be in, so you can drop the other half.",
      "Narrow a left/right range until it's empty, moving the boundaries based on how the middle compares to the target.",
    ],
    approachOverview: `
The simplest approach checks each element until it finds the target.
That works, but it ignores that the list is sorted.

Instead, compare the target to the middle element:

- If they're equal, you're done.
- If the target is smaller, it can only be to the left, so drop the right half (including the middle).
- If the target is bigger, drop the left half instead.

Each round halves the search space, which is far faster than checking
one element at a time.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Linear Scan",
        explanation:
          "Compare each element to the target, left to right. Correct, but it doesn't use the sorted order.",
        code: `function search(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
  }
  return -1;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal — Binary Search",
        explanation:
          "Keep left and right boundaries around the range that could still hold the target. Check the middle element and shrink the range based on whether the target is smaller or bigger.",
        code: `function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}`,
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let left = 0; let right = nums.length - 1;", explanation: "Start with boundaries covering the whole list." },
          { code: "const mid = Math.floor((left + right) / 2);", explanation: "Look at the middle of the current range." },
          { code: "if (nums[mid] === target) return mid;", explanation: "Found it — return the index immediately." },
          {
            code: "else if (nums[mid] < target) left = mid + 1;",
            explanation: "The target must be to the right, so drop the entire left half, including mid.",
          },
          {
            code: "else right = mid - 1;",
            explanation: "Otherwise the target must be to the left, so drop the entire right half, including mid.",
          },
        ],
      },
    ],
    relatedProblems: ["search-in-rotated-sorted-array", "find-minimum-in-rotated-sorted-array", "search-a-2d-matrix"],
    keywords: ["binary search", "sorted array", "divide and conquer"],
  },

  {
    id: "search-in-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    difficulty: "Medium",
    category: "binary-search",
    description: `
Take a sorted list of distinct numbers and move a chunk from the front
to the back. For example, [0, 1, 2, 4, 5, 6, 7] becomes
[4, 5, 6, 7, 0, 1, 2]. This is a "rotated" sorted list: it no longer
starts at the smallest value.

Given a rotated list and a target, find the target's index, or report
that it isn't there.
    `.trim(),
    examples: [
      { input: "nums = [4, 5, 6, 7, 0, 1, 2], target = 0", output: "4", explanation: "0 sits at index 4." },
      {
        input: "nums = [4, 5, 6, 7, 0, 1, 2], target = 3",
        output: "-1",
        explanation: "3 never appears anywhere in this particular rotated list.",
      },
      {
        input: "nums = [1], target = 0",
        output: "-1",
        explanation: "The list has one element and it isn't the target.",
      },
    ],
    constraints: [
      "1 <= nums.length <= 5000",
      "-10^4 <= nums[i] <= 10^4",
      "All values of nums are unique.",
      "nums is an ascending list that has been rotated at some unknown pivot.",
      "-10^4 <= target <= 10^4",
    ],
    hints: [
      "Plain binary search assumes the whole range is sorted, which isn't true here. But at least one half of any range is always a normal sorted run.",
      "Compare the middle element to the range's endpoints: whichever half satisfies left <= mid (or mid <= right) is the sorted half.",
      "Once you know the sorted half, a range check tells you whether the target could be in it. If not, it's in the other half.",
    ],
    approachOverview: `
Scanning every element works, but it ignores that the list is two
sorted pieces, one moved to the end.

During binary search, look at the middle element. One half (left to
middle, or middle to right) is always fully sorted. Compare its two
endpoints to tell which.

Then check whether the target falls inside the sorted half's value
range. If it does, search that half; if not, search the other one.
Either way, half the list is dropped each round, like ordinary binary
search.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Linear Scan",
        explanation:
          "Check every element until the target turns up. The rotation doesn't matter; a full scan finds it, just slowly.",
        code: `function search(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
  }
  return -1;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal — Modified Binary Search",
        explanation:
          "Run a binary search. At each step, find which half is sorted, then use its value range to decide whether the target could be in it.",
        code: `function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) return mid;

    if (nums[left] <= nums[mid]) {
      // Left half is a normal sorted run.
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } else {
      // Right half is a normal sorted run.
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }

  return -1;
}`,
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          {
            code: "if (nums[left] <= nums[mid]) {",
            explanation: "Checks whether the left-to-mid half is sorted (not rotated).",
          },
          {
            code: "if (nums[left] <= target && target < nums[mid]) right = mid - 1;",
            explanation: "If the left half is sorted and the target's value fits inside its range, search there.",
          },
          {
            code: "else left = mid + 1;",
            explanation: "Otherwise the target can't be in the sorted left half, so it must be in the right half.",
          },
          {
            code: "if (nums[mid] < target && target <= nums[right]) left = mid + 1;",
            explanation: "The mirror case: if the right half is sorted and the target fits its range, search there.",
          },
        ],
      },
    ],
    relatedProblems: ["binary-search", "find-minimum-in-rotated-sorted-array"],
    keywords: ["rotated sorted array", "modified binary search", "pivot"],
  },

  {
    id: "find-minimum-in-rotated-sorted-array",
    title: "Find Minimum in Rotated Sorted Array",
    difficulty: "Medium",
    category: "binary-search",
    description: `
You're given a rotated sorted list of distinct numbers: sorted smallest
to largest, then rotated so it no longer starts at its smallest value
(for example [3, 4, 5, 1, 2] instead of [1, 2, 3, 4, 5]).

Find the smallest number in the list.
    `.trim(),
    examples: [
      {
        input: "nums = [3, 4, 5, 1, 2]",
        output: "1",
        explanation: "The original sorted order was [1, 2, 3, 4, 5]; it's been rotated so it now starts at 3.",
      },
      { input: "nums = [4, 5, 6, 7, 0, 1, 2]", output: "0", explanation: "The smallest value, 0, sits partway through the list." },
      {
        input: "nums = [11, 13, 15, 17]",
        output: "11",
        explanation: "This list happens not to look rotated at all, so its smallest value is simply the first element.",
      },
    ],
    constraints: [
      "1 <= nums.length <= 5000",
      "-5000 <= nums[i] <= 5000",
      "All the integers of nums are unique.",
      "nums was originally sorted in ascending order and then rotated between 1 and n times.",
    ],
    hints: [
      "The smallest element is where a bigger number is followed by a smaller one. If the list isn't really rotated, the first element is the smallest.",
      "Compare the middle element to the last element of the range. If the middle is bigger, the smallest value is to its right.",
      "If the middle is less than or equal to the last element, the range from the middle on is sorted, so the smallest value is the middle or to its left.",
    ],
    approachOverview: `
Scanning the list for the smallest value works, but it ignores that the
list is two sorted runs glued together.

Binary search still works with a different comparison. Compare the
middle element to the *last* element of the range:

- If the middle is greater, the rotation point (and the smallest value) is to the right. Drop the middle and everything left of it.
- Otherwise, the range from the middle on is sorted, so the smallest value is the middle or to its left. Drop the right side.

The range narrows down to the smallest element.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Linear Scan",
        explanation: "Walk the list, tracking the smallest value so far. Correct, but ignores the sorted structure.",
        code: `function findMin(nums) {
  let min = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < min) min = nums[i];
  }
  return min;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal — Binary Search",
        explanation:
          "Narrow a left/right range by comparing the middle element to the range's last element, which tells you which side the smallest value is on.",
        code: `function findMin(nums) {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] > nums[right]) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return nums[left];
}`,
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "while (left < right) {", explanation: "Keeps narrowing until left and right meet at the single smallest element." },
          {
            code: "if (nums[mid] > nums[right]) left = mid + 1;",
            explanation: "If the middle is bigger than the range's last element, the smallest value is strictly to the right.",
          },
          {
            code: "else right = mid;",
            explanation: "Otherwise the middle could be the smallest, so it stays in the range.",
          },
          { code: "return nums[left];", explanation: "When left and right meet, that position holds the smallest element." },
        ],
      },
    ],
    relatedProblems: ["binary-search", "search-in-rotated-sorted-array"],
    keywords: ["rotated sorted array", "minimum", "binary search"],
  },

  {
    id: "search-a-2d-matrix",
    title: "Search a 2D Matrix",
    difficulty: "Medium",
    category: "binary-search",
    description: `
You're given a grid of numbers where:

- Every row is sorted left to right.
- The first number in each row is bigger than the last number in the row above.

So reading the grid row by row gives one sorted sequence. The grid is
really a single sorted list split into rows.

Given the grid and a target, decide whether the target appears in it.
    `.trim(),
    examples: [
      {
        input: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3",
        output: "true",
        explanation: "3 appears in the first row.",
      },
      {
        input: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13",
        output: "false",
        explanation: "13 falls between 11 and 16 in the second row, so it doesn't appear anywhere in the grid.",
      },
      { input: "matrix = [[1]], target = 1", output: "true", explanation: "A 1x1 grid whose only value is the target." },
    ],
    constraints: [
      "m == matrix.length",
      "n == matrix[i].length",
      "1 <= m, n <= 100",
      "-10^4 <= matrix[i][j], target <= 10^4",
    ],
    hints: [
      "The rows chain into one sorted sequence, so you can binary search the whole grid at once instead of row by row.",
      "Give each cell a 'flattened' index from 0 to (rows * cols - 1). Convert it back to a row and column with division and remainder.",
      "Once you can read the value at a flattened index, the rest is an ordinary binary search.",
    ],
    approachOverview: `
You could check every cell, or find the right row first and then search
it. Both work, but miss the bigger picture: read row by row, the grid
is one sorted sequence of \`m * n\` numbers.

The faster way treats the grid as one flattened sorted array, without
building it. Index \`i\` from \`0\` to \`m * n - 1\` maps to row
\`Math.floor(i / n)\` and column \`i % n\`. Binary search over
\`[0, m*n - 1]\` like a normal sorted array, converting each index to a
row and column as you go.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Scan Every Cell",
        explanation: "Check every cell until the target turns up. Simple, but ignores that the rows are sorted and chained together.",
        code: `function searchMatrix(matrix, target) {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === target) return true;
    }
  }
  return false;
}`,
        timeComplexity: "O(m * n)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal — Binary Search Over a Flattened Index",
        explanation:
          "Binary search over [0, m*n - 1] as if the grid were one sorted array, converting each index to a row and column to read its value.",
        code: `function searchMatrix(matrix, target) {
  const m = matrix.length;
  const n = matrix[0].length;
  let left = 0;
  let right = m * n - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const value = matrix[Math.floor(mid / n)][mid % n];

    if (value === target) {
      return true;
    } else if (value < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return false;
}`,
        timeComplexity: "O(log(m * n))",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let right = m * n - 1;", explanation: "Treats the grid as a single sorted array of m * n values, indexed 0 through m*n - 1." },
          {
            code: "const value = matrix[Math.floor(mid / n)][mid % n];",
            explanation: "Converts a flattened index into its row (full rows before it) and column (the remainder).",
          },
          {
            code: "if (value === target) return true;",
            explanation: "From here it's an ordinary binary search comparison against the target.",
          },
        ],
      },
    ],
    relatedProblems: ["binary-search"],
    keywords: ["matrix", "2D binary search", "flattened index"],
  },

  {
    id: "koko-eating-bananas",
    title: "Koko Eating Bananas",
    difficulty: "Medium",
    category: "binary-search",
    description: `
Koko has several piles of bananas and \`h\` hours before the guards
return. She picks one eating speed \`k\` (bananas per hour) and keeps
it all day.

Each hour, she eats up to \`k\` bananas from one pile. If the pile has
fewer than \`k\` left, she finishes it and waits until the next hour to
start another pile.

Find the smallest whole-number speed \`k\` that lets her finish every
pile within \`h\` hours.
    `.trim(),
    examples: [
      {
        input: "piles = [3, 6, 7, 11], h = 8",
        output: "4",
        explanation:
          "At speed 4, the hours needed are ceil(3/4) + ceil(6/4) + ceil(7/4) + ceil(11/4) = 1 + 2 + 2 + 3 = 8, which just fits. Any slower speed would take more than 8 hours.",
      },
      {
        input: "piles = [30, 11, 23, 4, 20], h = 5",
        output: "30",
        explanation: "With only 5 hours for 5 piles, Koko gets exactly one hour per pile, so she must be fast enough to clear the biggest pile, 30, in a single hour.",
      },
      {
        input: "piles = [30, 11, 23, 4, 20], h = 6",
        output: "23",
        explanation: "At speed 23 the hours needed add up to exactly 6; speed 22 would need 7 hours, which is too slow.",
      },
    ],
    constraints: ["1 <= piles.length <= 10^4", "piles.length <= h <= 10^9", "1 <= piles[i] <= 10^9"],
    hints: [
      "Flip the question: for a given speed, can you quickly check whether it's fast enough?",
      "As speed goes up, the hours needed never go up. This one-way (monotonic) relationship is exactly what binary search needs.",
      "Binary search over the speeds, from 1 to the largest pile, using the hours-needed check to decide which half to keep.",
    ],
    approachOverview: `
The direct way tries every speed from 1 and stops at the first one that
finishes in time. It's correct, but there can be as many speeds as the
biggest pile, which is slow.

The key point: eating faster never takes longer. So every speed is
either "too slow" (more than \`h\` hours) or "fast enough" (at most
\`h\` hours), and all the "too slow" speeds come first.

When a yes/no question has a clean boundary like this, you can binary
search over the possible answers (here, speeds) instead of an array, to
find the smallest speed that's "fast enough."
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Try Every Speed",
        explanation:
          "Starting at speed 1, check the hours needed and stop at the first speed that fits within h hours.",
        code: `function minEatingSpeed(piles, h) {
  const hoursNeeded = (speed) => {
    let hours = 0;
    for (const pile of piles) {
      hours += Math.ceil(pile / speed);
    }
    return hours;
  };

  let speed = 1;
  while (hoursNeeded(speed) > h) {
    speed++;
  }
  return speed;
}`,
        timeComplexity: "O(n * max(piles))",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal — Binary Search on the Answer",
        explanation:
          "Binary search over speeds from 1 to the largest pile. If a speed fits within h hours, try slower; otherwise try faster.",
        code: `function minEatingSpeed(piles, h) {
  const hoursNeeded = (speed) => {
    let hours = 0;
    for (const pile of piles) {
      hours += Math.ceil(pile / speed);
    }
    return hours;
  };

  let low = 1;
  let high = Math.max(...piles);

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    if (hoursNeeded(mid) <= h) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  return low;
}`,
        timeComplexity: "O(n * log(max(piles)))",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let low = 1; let high = Math.max(...piles);", explanation: "The answer is between 1 banana per hour and the biggest pile in one hour." },
          {
            code: "if (hoursNeeded(mid) <= h) high = mid;",
            explanation: "Fast enough, so keep it as a candidate and look for something slower that still works.",
          },
          {
            code: "else low = mid + 1;",
            explanation: "Too slow, so rule out this speed and everything slower.",
          },
          { code: "return low;", explanation: "When low and high meet, that's the smallest speed that's fast enough." },
        ],
      },
    ],
    relatedProblems: ["binary-search"],
    keywords: ["binary search on the answer", "koko eating bananas", "monotonic function"],
  },

  {
    id: "time-based-key-value-store",
    title: "Time Based Key-Value Store",
    difficulty: "Medium",
    category: "binary-search",
    description: `
Design a key-value store where each value is tagged with a timestamp
instead of being overwritten. It supports two operations:

- \`set(key, value, timestamp)\`: store \`value\` for \`key\` at \`timestamp\`. Timestamps for the same key always strictly increase across \`set\` calls.
- \`get(key, timestamp)\`: return the value stored for \`key\` at the largest timestamp less than or equal to \`timestamp\`. If nothing was set for that key at or before that time, return an empty string.
    `.trim(),
    examples: [
      {
        input: `set("foo", "bar", 1), then get("foo", 1)`,
        output: `"bar"`,
        explanation: `"bar" was stored for "foo" at exactly timestamp 1.`,
      },
      {
        input: `get("foo", 3) (right after the set above, with nothing new set in between)`,
        output: `"bar"`,
        explanation: "Nothing was set between timestamps 1 and 3, so the most recent value at or before timestamp 3 is still \"bar\".",
      },
      {
        input: `set("foo", "bar2", 4), then get("foo", 4) and get("foo", 5)`,
        output: `"bar2" for both`,
        explanation: `Timestamp 4 introduces a newer value, and it remains the answer for any query timestamp of 4 or later, until something even newer is set.`,
      },
    ],
    constraints: [
      "1 <= key.length, value.length <= 100",
      "key and value consist of lowercase English letters and digits.",
      "1 <= timestamp <= 10^7",
      "All the timestamps passed to set for the same key are strictly increasing.",
      "At most 2 * 10^5 calls total will be made to set and get.",
    ],
    hints: [
      "For each key, store (timestamp, value) pairs in the order they're set. Timestamps only increase per key, so the list is already sorted.",
      "A get call asks: 'in this sorted list, what's the rightmost timestamp less than or equal to mine?'",
      "That's a binary search for a boundary, not an exact match. Track the best candidate as the range narrows.",
    ],
    approachOverview: `
The simplest approach stores each key's (timestamp, value) pairs in a
list and, on \`get\`, scans it for the latest timestamp that doesn't
exceed the query. Timestamps per key always increase, so the list is
sorted for free.

Because it's sorted, \`get\` doesn't need to check every entry. It's
asking "what's the rightmost timestamp <= this value?", a binary search
for a boundary rather than an exact match.

Narrow a left/right range as usual. When an entry's timestamp is <= the
target, save its value as the best answer so far and keep searching
right for a better one.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Scan Backwards",
        explanation:
          "Keep each key's (timestamp, value) pairs in order. On get, scan backwards from the newest entry until one is at or before the query timestamp.",
        code: `class TimeMap {
  constructor() {
    this.store = new Map();
  }

  set(key, value, timestamp) {
    if (!this.store.has(key)) this.store.set(key, []);
    this.store.get(key).push([timestamp, value]);
  }

  get(key, timestamp) {
    const entries = this.store.get(key);
    if (!entries) return "";

    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i][0] <= timestamp) {
        return entries[i][1];
      }
    }
    return "";
  }
}`,
        timeComplexity: "set: O(1). get: O(n) in the worst case, where n is the number of values stored for that key.",
        spaceComplexity: "O(n) total across all set calls.",
      },
      {
        approach: "Optimal — Binary Search",
        explanation:
          "Binary search the key's sorted (timestamp, value) pairs for the rightmost timestamp <= the query, tracking the best match so far.",
        code: `class TimeMap {
  constructor() {
    this.store = new Map();
  }

  set(key, value, timestamp) {
    if (!this.store.has(key)) this.store.set(key, []);
    this.store.get(key).push([timestamp, value]);
  }

  get(key, timestamp) {
    const entries = this.store.get(key);
    if (!entries) return "";

    let left = 0;
    let right = entries.length - 1;
    let result = "";

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      if (entries[mid][0] <= timestamp) {
        result = entries[mid][1];
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return result;
  }
}`,
        timeComplexity: "set: O(1). get: O(log n), where n is the number of values stored for that key.",
        spaceComplexity: "O(n) total across all set calls.",
        walkthrough: [
          {
            code: "if (entries[mid][0] <= timestamp) {",
            explanation: "This entry is at or before the query timestamp, so it's a candidate.",
          },
          {
            code: "result = entries[mid][1]; left = mid + 1;",
            explanation: "Saves this value as the best so far, then searches right for a more recent match.",
          },
          {
            code: "else right = mid - 1;",
            explanation: "This timestamp is too late, so it and everything after it are out. Search the left side.",
          },
          { code: "return result;", explanation: "Returns the last matching value found once the range is empty." },
        ],
      },
    ],
    relatedProblems: ["binary-search"],
    keywords: ["design", "binary search", "timestamp", "key-value store"],
  },

  {
    id: "median-of-two-sorted-arrays",
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    category: "binary-search",
    description: `
You're given two sorted lists of numbers. They can have different
lengths, and either can be empty. Find the median (middle value) of the
two lists combined.

If the combined length is odd, the median is the middle value. If it's
even, the median is the average of the two middle values.

Don't look at every element: aim for \`O(log(min(m, n)))\` time, where
\`m\` and \`n\` are the list lengths.
    `.trim(),
    examples: [
      {
        input: "nums1 = [1, 3], nums2 = [2]",
        output: "2",
        explanation: "Merged, the combined sorted list is [1, 2, 3], and its single middle value is 2.",
      },
      {
        input: "nums1 = [1, 2], nums2 = [3, 4]",
        output: "2.5",
        explanation: "Merged, the combined list is [1, 2, 3, 4]; the two middle values are 2 and 3, and their average is 2.5.",
      },
      {
        input: "nums1 = [], nums2 = [1]",
        output: "1",
        explanation: "One list is empty, so the combined list is just [1], whose median is 1.",
      },
    ],
    constraints: [
      "nums1.length == m",
      "nums2.length == n",
      "0 <= m <= 1000",
      "0 <= n <= 1000",
      "1 <= m + n <= 2000",
      "-10^6 <= nums1[i], nums2[i] <= 10^6",
    ],
    hints: [
      "Merging both lists and reading the middle works, but it looks at every element. Can you find the median without building the merged list?",
      "The median splits the combined list into left and right halves of (almost) equal size. Find where that split falls in each original list instead of merging.",
      "Binary search on how many elements of the *shorter* list go in the left half; arithmetic then fixes how many come from the other list. Adjust until every element left of the split is <= every element right of it.",
    ],
    approachOverview: `
The direct approach merges both lists, like the merge step of merge
sort, and reads the middle value (or values). It's easy to follow but
looks at every element, so it can't beat \`O(m + n)\`.

The faster approach never merges. The merged list would split into a
left half and a right half at the median. Binary search for *where that
split falls* in the shorter array; call it \`i\`. The left half always
has the same total size, so the split \`j\` in the other array is just
\`j = halfway point - i\`.

The split is correct when every value just left of the line (in both
arrays) is <= every value just right of it. If not, move \`i\` up or
down and try again. Once it's correct, read the median from the (at
most) four values at the boundary.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Merge, Then Read the Middle",
        explanation:
          "Merge the two lists as merge sort does, then take the middle element (or average the two middle ones). Easy to follow, but it always looks at every element.",
        code: `function findMedianSortedArrays(nums1, nums2) {
  const merged = [];
  let i = 0;
  let j = 0;

  while (i < nums1.length && j < nums2.length) {
    if (nums1[i] <= nums2[j]) {
      merged.push(nums1[i++]);
    } else {
      merged.push(nums2[j++]);
    }
  }
  while (i < nums1.length) merged.push(nums1[i++]);
  while (j < nums2.length) merged.push(nums2[j++]);

  const n = merged.length;
  const mid = Math.floor(n / 2);

  if (n % 2 === 1) {
    return merged[mid];
  }
  return (merged[mid - 1] + merged[mid]) / 2;
}`,
        timeComplexity: "O(m + n)",
        spaceComplexity: "O(m + n)",
      },
      {
        approach: "Optimal — Binary Search on the Partition",
        explanation:
          "Binary search the shorter array for the split that divides both arrays into valid left and right halves, then read the median from the boundary values.",
        code: `function findMedianSortedArrays(nums1, nums2) {
  // Always binary search over the shorter array.
  if (nums1.length > nums2.length) {
    return findMedianSortedArrays(nums2, nums1);
  }

  const m = nums1.length;
  const n = nums2.length;
  const half = Math.floor((m + n + 1) / 2);

  let low = 0;
  let high = m;

  while (low <= high) {
    const i = Math.floor((low + high) / 2); // elements of nums1 in the left half
    const j = half - i; // elements of nums2 in the left half

    const left1 = i === 0 ? -Infinity : nums1[i - 1];
    const right1 = i === m ? Infinity : nums1[i];
    const left2 = j === 0 ? -Infinity : nums2[j - 1];
    const right2 = j === n ? Infinity : nums2[j];

    if (left1 <= right2 && left2 <= right1) {
      if ((m + n) % 2 === 1) {
        return Math.max(left1, left2);
      }
      return (Math.max(left1, left2) + Math.min(right1, right2)) / 2;
    } else if (left1 > right2) {
      high = i - 1;
    } else {
      low = i + 1;
    }
  }

  return -1; // unreachable for valid, sorted inputs
}`,
        timeComplexity: "O(log(min(m, n)))",
        spaceComplexity: "O(1)",
        walkthrough: [
          {
            code: "if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);",
            explanation: "Always searches the shorter array, which keeps the runtime at O(log(min(m, n))).",
          },
          {
            code: "const half = Math.floor((m + n + 1) / 2);",
            explanation: "How many elements belong in the combined left half, from both arrays together.",
          },
          {
            code: "const i = Math.floor((low + high) / 2); const j = half - i;",
            explanation: "Guesses a split i in the shorter array, then sets j in the other so the left half has exactly `half` elements.",
          },
          {
            code: "const left1 = i === 0 ? -Infinity : nums1[i - 1];",
            explanation: "nums1's last value in the left half, or -Infinity if nums1 adds nothing to the left half.",
          },
          {
            code: "if (left1 <= right2 && left2 <= right1) {",
            explanation: "The split is valid when every left value is <= every right value, across both arrays.",
          },
          {
            code: "return (Math.max(left1, left2) + Math.min(right1, right2)) / 2;",
            explanation: "With a valid split, the median is at the boundary: the larger 'left' value and the smaller 'right' value.",
          },
          {
            code: "else if (left1 > right2) { high = i - 1; } else { low = i + 1; }",
            explanation: "If the split isn't valid, move i left or right and try again.",
          },
        ],
      },
    ],
    relatedProblems: ["binary-search"],
    keywords: ["median", "binary search", "partition", "two sorted arrays", "hard"],
  },
];
