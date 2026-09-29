import type { Problem } from "../../types/problem";

export const binarySearchProblems: Problem[] = [
  {
    id: "binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    category: "binary-search",
    description: `
You're given a list of numbers that's already sorted from smallest to
largest, with no duplicate values anywhere in it. You're also given a
target number.

Find the index (position) of the target inside the list. If the target
doesn't appear in the list at all, say so.
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
      "Checking every element one at a time works, but the list being sorted is a big clue that you can do better.",
      "Since the list is sorted, comparing the target to the middle element tells you which half it could possibly be hiding in — you can throw the other half away entirely.",
      "Keep narrowing a left/right range until it's empty, updating the boundaries based on how the middle element compares to the target.",
    ],
    approachOverview: `
The simplest approach is to walk through the list one element at a time
until you find the target (or run out of list). That works, but it
completely ignores the fact that the list is sorted.

Because the list is sorted, you can look at the middle element and
compare it to the target. If the middle element *is* the target, you're
done. If the target is smaller than the middle, it can only be
somewhere to the left of the middle — so the entire right half,
including the middle itself, can be thrown away. If the target is
bigger, the same logic applies to the right half. Repeating this halves
the search space every round, which is dramatically faster than
checking one element at a time.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Linear Scan",
        explanation:
          "Walk through the list from left to right, comparing each element to the target. This is correct but never takes advantage of the list being sorted.",
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
          "Keep a left and right boundary around the range that could still contain the target. Look at the middle element of that range each time, and shrink the range based on whether the target is smaller or bigger than it.",
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
Imagine a list of distinct numbers sorted from smallest to largest, and
then someone chops off the front chunk and moves it to the back — for
example [0, 1, 2, 4, 5, 6, 7] becoming [4, 5, 6, 7, 0, 1, 2]. That's a
"rotated" sorted list: it's still built out of a sorted list, it just no
longer starts at the smallest value.

You're given a list that's been rotated this way, along with a target
number. Find the index of the target, or report that it isn't there.
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
      "A plain binary search assumes the whole range is sorted, which isn't true here — but at least one of the two halves of any range you pick is always a normal sorted run.",
      "Compare the middle element to the endpoints of the current range: whichever half satisfies left <= mid (or mid <= right) is the sorted half.",
      "Once you know which half is sorted, a quick range check tells you whether the target could be hiding in it. If not, it must be in the other half.",
    ],
    approachOverview: `
Scanning every element still finds the target, but it throws away the
fact that the list is still made of two sorted pieces — it's just that
one piece got moved to the end.

At any point during a binary search on this list, look at the middle
element. One of the two halves (from the left boundary to the middle,
or from the middle to the right boundary) is always a normal, fully
sorted run, and you can tell which one just by comparing its two
endpoints. Once you know which half is sorted, checking whether the
target falls inside that half's value range is a plain comparison. If it
does, search that half; if it doesn't, the target must be in the other
half, so search there instead. Either way, half the list is thrown away
each round, exactly like ordinary binary search.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Linear Scan",
        explanation:
          "Check every element until the target turns up. The rotation doesn't matter at all here — a full scan finds it, just slowly.",
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
          "Run a binary search, but at each step first figure out which half of the current range is a normal sorted run, then use that half's value range to decide whether the target could be in it.",
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
            explanation: "Checks whether the left-to-mid half is a normal, non-rotated sorted run.",
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
            explanation: "Same idea, mirrored: if the right half is the sorted one and the target fits its range, search there instead.",
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
Take the same idea as a rotated sorted list — a list of distinct numbers
sorted smallest to largest, then rotated so it no longer starts at its
smallest value (for example [3, 4, 5, 1, 2] instead of [1, 2, 3, 4, 5]).

This time, instead of searching for a specific target, find the
smallest number in the list.
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
      "The smallest element is the one place where a bigger number is immediately followed by a smaller one — unless the list wasn't really rotated, in which case the first element is already the smallest.",
      "Compare the middle element to the last element of the current range: if the middle is bigger, the smallest value must be somewhere to its right.",
      "If the middle is smaller than or equal to the last element, the range from the middle onward is already increasing normally, so the smallest value is the middle itself or something to its left.",
    ],
    approachOverview: `
Scanning the whole list while tracking the smallest value seen works,
but it ignores that the list is made of two sorted runs glued together.

Binary search still applies here, just with a different comparison than
usual. At each step, compare the middle element to the *last* element
of the current range. If the middle is greater than the last element,
that means the rotation point — and the smallest value — must be
somewhere to the right of the middle, so the middle and everything left
of it can be discarded. If the middle is less than or equal to the last
element, the range from the middle onward is already sorted normally,
meaning the smallest value is either the middle itself or something to
its left, so the right side of the range can be discarded instead.
Narrowing the range this way converges on the single smallest element.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Linear Scan",
        explanation: "Walk through the whole list, keeping track of the smallest value seen so far. Correct, but ignores the sorted structure.",
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
          "Narrow a left/right range by comparing the middle element to the last element of the range: that comparison tells you which side the smallest value must be on.",
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
            explanation: "The middle being bigger than the range's last element means the smallest value is strictly to the right.",
          },
          {
            code: "else right = mid;",
            explanation: "Otherwise the middle could itself be the smallest so far, so it's kept as a candidate rather than discarded.",
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
You're given a grid of numbers with two useful properties: every row is
sorted left to right, and the first number in each row is bigger than
the last number in the row directly above it.

That second property means that if you read the grid row by row, left
to right and top to bottom, the numbers come out in one long,
uninterrupted sorted sequence — the grid is really just a single sorted
list arranged into rows.

Given the grid and a target number, decide whether the target appears
anywhere in it.
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
      "Since each row is sorted and the rows chain together into one big sorted sequence, you don't have to search row by row — you can binary search across the whole grid at once.",
      "Give every cell a single 'flattened' index from 0 to (rows * cols - 1), and convert that index back to a row and column using division and remainder.",
      "Once you can compare the value at a flattened index to the target, the rest is a completely ordinary binary search.",
    ],
    approachOverview: `
A straightforward approach is to check every cell directly, or to first
narrow down which row could contain the target and then search within
that row. Both work, but neither uses the full picture: the whole grid,
read row by row, is one sorted sequence of \`m * n\` numbers.

The faster approach treats the grid as if it were a single flattened
sorted array, without ever actually building one. Any index \`i\` from
\`0\` to \`m * n - 1\` maps to row \`Math.floor(i / n)\` and column
\`i % n\`. With that mapping in hand, you can binary search over the
range \`[0, m*n - 1]\` exactly like a normal sorted array, translating
each candidate index into a row/column lookup as you go.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Scan Every Cell",
        explanation: "Check every cell in the grid one at a time until the target turns up. Simple, but ignores that the rows are sorted and chained together.",
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
          "Binary search over the range [0, m*n - 1] as though the grid were one long sorted array, converting each candidate index back into a row and column to look up its value.",
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
            explanation: "Converts a flattened index back into its row (whole number of rows completed) and column (leftover offset).",
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
return. She picks one eating speed \`k\` (bananas per hour) and uses
that same speed for every hour of the day.

Each hour, she chooses one pile and eats up to \`k\` bananas from it. If
that pile has fewer than \`k\` bananas left, she finishes it off and
simply doesn't eat any faster that hour — she doesn't move on to
another pile until the next hour.

Find the smallest whole-number eating speed \`k\` that lets Koko finish
every pile within \`h\` hours.
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
      "The direct question is 'what's the smallest valid speed', but it's easier to flip it around: for any single given speed, can you quickly check whether it's fast enough?",
      "As the speed goes up, the total hours needed only ever goes down (or stays the same) — it never goes up. That kind of monotonic relationship is exactly what binary search needs.",
      "Binary search over the possible speeds themselves, from 1 up to the largest pile, using the hours-needed check to decide which half of the speed range to keep.",
    ],
    approachOverview: `
The direct way is to try every possible speed starting from 1 and stop
at the first one that finishes in time. That's correct, but the number
of possible speeds can be as large as the biggest pile, which is slow.

The key observation is that "hours needed" only ever decreases as speed
increases — eating faster never takes longer. That means every possible
speed falls into one of two groups: "too slow" (needs more than \`h\`
hours) or "fast enough" (needs at most \`h\` hours), with every "too
slow" speed below every "fast enough" one. Whenever a yes/no question
has this kind of clean boundary, you can binary search directly over the
candidate answers — here, the possible speeds — instead of over an
array, narrowing in on the smallest speed that's "fast enough."
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Try Every Speed",
        explanation:
          "Starting from speed 1, check how many hours that speed would need, and stop at the first speed that fits within h hours.",
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
          "Binary search over possible speeds, from 1 to the largest pile. At each candidate speed, check the hours needed; if it fits within h hours, try a slower speed, otherwise try a faster one.",
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
          { code: "let low = 1; let high = Math.max(...piles);", explanation: "The answer must be somewhere between eating 1 banana per hour and eating the biggest pile in one hour." },
          {
            code: "if (hoursNeeded(mid) <= h) high = mid;",
            explanation: "This speed is fast enough — it's a valid candidate, so keep it and try to find something even slower that still works.",
          },
          {
            code: "else low = mid + 1;",
            explanation: "This speed is too slow — rule it (and everything slower than it) out.",
          },
          { code: "return low;", explanation: "Once low and high meet, that's the smallest speed that's fast enough." },
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
Design a small key-value store where every stored value is tagged with a
timestamp instead of simply being overwritten.

It needs to support two operations:

- \`set(key, value, timestamp)\` — store \`value\` for \`key\`, tagged
  with \`timestamp\`. Timestamps for the same key are guaranteed to
  strictly increase across successive \`set\` calls.
- \`get(key, timestamp)\` — return whichever value was stored for
  \`key\` at the largest timestamp that is less than or equal to the
  given \`timestamp\`. If no such value exists (nothing was set for
  that key at or before that time), return an empty string.
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
      "Store, for each key, the list of (timestamp, value) pairs in the order they were set — since timestamps only ever increase per key, this list is automatically sorted by timestamp, no extra sorting needed.",
      "A get call is really asking: 'in this sorted list of timestamps, what's the rightmost one that's less than or equal to my target timestamp?'",
      "That's a binary search for a boundary, not for an exact match — track the best candidate found so far as the search range narrows.",
    ],
    approachOverview: `
The simplest approach is to store every (timestamp, value) pair for a
key in a list, and on \`get\`, scan that list to find the latest
timestamp that doesn't exceed the query. Because \`set\` calls for a
given key always arrive with strictly increasing timestamps, this list
comes out naturally sorted — there's never a need to sort it yourself.

Since the list is already sorted by timestamp, a \`get\` doesn't need
to look at every entry. It's really asking "what's the rightmost
timestamp that is <= this value?", which is a binary search for a
boundary rather than a search for an exact match. Narrow a left/right
range as usual, and whenever an entry's timestamp qualifies (is <= the
target), remember its value as the best answer so far and keep
searching further right to see if there's an even better one.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Scan Backwards",
        explanation:
          "Keep each key's (timestamp, value) pairs in the order they were set, then on get, scan from the most recent entry backwards until one has a timestamp at or before the query.",
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
          "Binary search the sorted list of (timestamp, value) pairs for a key, looking for the rightmost timestamp that's less than or equal to the query, tracking the best match found so far as the range narrows.",
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
            explanation: "This entry qualifies as \"at or before\" the query timestamp, so it's a candidate answer.",
          },
          {
            code: "result = entries[mid][1]; left = mid + 1;",
            explanation: "Remembers this value as the best answer so far, then keeps searching to the right for an even more recent qualifying entry.",
          },
          {
            code: "else right = mid - 1;",
            explanation: "This entry's timestamp is too late — it and everything after it can't be the answer, so search only the left side.",
          },
          { code: "return result;", explanation: "Whatever the last qualifying entry's value was, once the range is exhausted." },
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
You're given two separate lists of numbers, each already sorted from
smallest to largest (they can be different lengths, and either one can
even be empty). If you merged them into one single sorted list, find
the median — the middle value — of that combined list.

If the combined list has an odd number of elements, the median is the
single middle value. If it has an even number of elements, the median is
the average of the two middle values.

Do this without needing to look at every element one at a time — the
goal is to run in \`O(log(min(m, n)))\` time, where \`m\` and \`n\` are
the lengths of the two lists.
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
      "Merging both lists into one sorted list and reading off the middle works, but it looks at every element — can the median be found without ever building the full merged list?",
      "The median splits the combined list into a left half and a right half of equal (or almost equal) size. Instead of merging, try to directly find where that split falls within each of the two original lists.",
      "Binary search on how many elements of the *shorter* list go into the left half; the number needed from the other list is then fixed by simple arithmetic. Keep adjusting the split until every element just left of it is <= every element just right of it.",
    ],
    approachOverview: `
The direct approach is to merge both sorted lists into one, the same
way the merge step of merge sort works, and then read off the middle
value (or values) of the result. This is easy to reason about, but it
looks at every element, so it can never be faster than \`O(m + n)\`.

The faster approach never actually merges anything. The full merged
list would have a "left half" and a "right half" split right at the
median. Instead of building that list, binary search for *where that
split line falls* inside the shorter of the two arrays — call that
position \`i\`. Because the combined left half always needs the same
total number of elements, the matching split point \`j\` in the other
array is then just arithmetic: \`j = halfway point - i\`. A split is
correct once every value just left of the line, in both arrays, is <=
every value just right of the line, in both arrays; if it isn't, binary
search nudges \`i\` up or down and tries again. Once the correct split
is found, the median can be read directly off the (at most) four values
sitting right at the boundary — no merging required.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Merge, Then Read the Middle",
        explanation:
          "Merge the two sorted lists into one sorted list the same way merge sort does, then look at the middle element (or average the two middle elements). Correct and easy to follow, but it always looks at every element.",
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
          "Binary search over the shorter array for the split point that divides both arrays combined into a valid left half and right half, then read the median directly off the values at that boundary.",
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
            explanation: "Always binary searches over the shorter array — this is what keeps the runtime at O(log(min(m, n))).",
          },
          {
            code: "const half = Math.floor((m + n + 1) / 2);",
            explanation: "The number of elements that belong in the combined left half, however they end up split between the two arrays.",
          },
          {
            code: "const i = Math.floor((low + high) / 2); const j = half - i;",
            explanation: "Guesses a split point i in the shorter array, then derives the matching split point j in the other array so the left half always has exactly `half` elements total.",
          },
          {
            code: "const left1 = i === 0 ? -Infinity : nums1[i - 1];",
            explanation: "The last value just inside the left half from nums1 — or -Infinity if nums1 contributes nothing to the left half at this split.",
          },
          {
            code: "if (left1 <= right2 && left2 <= right1) {",
            explanation: "Checks that this split is valid: every value on the left side is <= every value on the right side, across both arrays.",
          },
          {
            code: "return (Math.max(left1, left2) + Math.min(right1, right2)) / 2;",
            explanation: "Once the split is valid, the median sits right at the boundary — the larger of the two 'left' values and the smaller of the two 'right' values.",
          },
          {
            code: "else if (left1 > right2) { high = i - 1; } else { low = i + 1; }",
            explanation: "If the split isn't valid yet, this shifts i left or right and tries again.",
          },
        ],
      },
    ],
    relatedProblems: ["binary-search"],
    keywords: ["median", "binary search", "partition", "two sorted arrays", "hard"],
  },
];
