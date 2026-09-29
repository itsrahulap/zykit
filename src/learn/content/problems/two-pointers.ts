import type { Problem } from "../../types/problem";

export const twoPointersProblems: Problem[] = [
  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    category: "two-pointers",
    description: `
You're given a string. Ignoring case, and ignoring any character that
isn't a letter or a digit, figure out whether the string reads the same
forwards as it does backwards.

So punctuation, spaces, and symbols don't count at all — only letters and
digits matter, and uppercase and lowercase letters are treated as the
same letter.
    `.trim(),
    examples: [
      {
        input: `s = "A man, a plan, a canal: Panama"`,
        output: "true",
        explanation:
          "Stripping out everything except letters and digits, and lowercasing, gives \"amanaplanacanalpanama\", which reads the same both ways.",
      },
      {
        input: `s = "race a car"`,
        output: "false",
        explanation: 'Cleaned up, this is "raceacar" — reversed it\'s "racaecar", which is different.',
      },
      {
        input: `s = ".,"`,
        output: "true",
        explanation:
          "There are no letters or digits at all here, so after cleaning it up there's nothing left — and an empty string trivially reads the same both ways.",
      },
    ],
    constraints: ["1 <= s.length <= 2 * 10^5", "s consists only of printable ASCII characters."],
    hints: [
      "You don't have to build a brand-new cleaned-up string before checking anything — could you compare characters directly from the two ends of the original string?",
      "Use two pointers, one starting at the front and one at the back, and walk them toward each other, skipping over any character that isn't a letter or digit.",
      "When both pointers are sitting on letters/digits, compare them case-insensitively — if they ever disagree, you can stop immediately.",
    ],
    approachOverview: `
The most straightforward way to solve this is to build a cleaned-up
version of the string (letters and digits only, all lowercase), and then
check whether that cleaned string equals its own reverse. This works,
but it means allocating a whole new string just to compare it against
another new string.

A leaner way: skip building anything new. Keep one pointer at the start
of the original string and one at the end, and walk them toward each
other. At each step, skip past any character that isn't a letter or
digit. Once both pointers are sitting on "real" characters, compare them
(ignoring case) — if they ever don't match, the string isn't a
palindrome. If the pointers meet without ever disagreeing, it is.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Clean, Then Compare to Reverse",
        explanation:
          "Build a new string containing only the lowercased letters and digits from the input, then compare that string to its own reverse. Simple to reason about, but it does extra work building and reversing a second string.",
        code: `function isPalindrome(s) {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const reversed = cleaned.split("").reverse().join("");
  return cleaned === reversed;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal — Two Pointers",
        explanation:
          "Walk one pointer in from the left and one in from the right, skipping over any character that isn't a letter or digit. Compare the two pointers' characters (case-insensitively) as they close in on the middle. No extra string is ever built.",
        code: `function isPalindrome(s) {
  const isAlnum = (c) => /[a-z0-9]/i.test(c);
  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    while (left < right && !isAlnum(s[left])) left++;
    while (left < right && !isAlnum(s[right])) right--;

    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }

    left++;
    right--;
  }

  return true;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let left = 0; let right = s.length - 1;", explanation: "One pointer starts at the front, one at the back." },
          {
            code: "while (left < right && !isAlnum(s[left])) left++;",
            explanation: "Slides the left pointer forward past any character that isn't a letter or digit.",
          },
          {
            code: "while (left < right && !isAlnum(s[right])) right--;",
            explanation: "Does the same for the right pointer, sliding it backward.",
          },
          {
            code: "if (s[left].toLowerCase() !== s[right].toLowerCase()) {",
            explanation: "Once both pointers land on real characters, compares them ignoring case.",
          },
          { code: "left++; right--;", explanation: "If they matched, moves both pointers one step closer to the middle." },
        ],
      },
    ],
    relatedProblems: ["two-sum-ii-input-array-is-sorted"],
    keywords: ["palindrome", "two pointers", "string", "alphanumeric"],
  },
  {
    id: "two-sum-ii-input-array-is-sorted",
    title: "Two Sum II - Input Array Is Sorted",
    difficulty: "Medium",
    category: "two-pointers",
    description: `
You're given a list of numbers that is already sorted in increasing
order, and a target number. Find two *different* numbers in the list
that add up exactly to the target, and return their positions.

There's a small twist compared to the usual Two Sum: positions here are
counted starting from 1, not 0. You can assume there's always exactly
one valid pair, you can't reuse the same element twice, and — since the
list is already sorted — you should be able to solve this using only a
constant amount of extra space.
    `.trim(),
    examples: [
      {
        input: "numbers = [2, 7, 11, 15], target = 9",
        output: "[1, 2]",
        explanation: "numbers[0] + numbers[1] = 2 + 7 = 9, and using 1-based positions that's [1, 2].",
      },
      {
        input: "numbers = [2, 3, 4], target = 6",
        output: "[1, 3]",
        explanation: "2 + 4 = 6, which are positions 1 and 3.",
      },
      {
        input: "numbers = [-1, 0], target = -1",
        output: "[1, 2]",
      },
    ],
    constraints: [
      "2 <= numbers.length <= 3 * 10^4",
      "-1000 <= numbers[i] <= 1000",
      "numbers is sorted in non-decreasing order.",
      "Exactly one valid answer exists.",
    ],
    hints: [
      "Since the list is sorted, if the sum of your current pair is too big, which of the two numbers should you change to make the sum smaller?",
      "You could reuse the hash-map trick from the unsorted Two Sum problem, but that costs extra memory — the sorted order gives you a way to avoid that entirely.",
      "Start with one pointer at the smallest number and one at the largest. Move the smaller-value pointer forward when the sum is too small, and the larger-value pointer backward when the sum is too big.",
    ],
    approachOverview: `
Because the list is sorted, you get a useful guarantee: moving the left
pointer forward can only increase the sum, and moving the right pointer
backward can only decrease it. That means you never have to backtrack —
you always know exactly which pointer to move next.

Start with one pointer at the very first number and one at the very
last. If their sum is too small, the only way to increase it is to move
the left pointer forward (to a bigger number). If it's too big, move the
right pointer backward (to a smaller number). If it matches, you're
done. This finds the answer in a single pass, using no extra memory
beyond the two pointers.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Pair",
        explanation:
          "Try every possible pair of positions and check whether they sum to the target. Correct, but it doesn't use the fact that the list is sorted at all.",
        code: `function twoSum(numbers, target) {
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      if (numbers[i] + numbers[j] === target) {
        return [i + 1, j + 1];
      }
    }
  }
  return [];
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Hash Map",
        explanation:
          "Walk through the list once, and for each number check whether the value needed to complete the pair has already been seen, using a Map for instant lookups. This ignores the sorted order and uses O(n) extra memory, but it's faster than the brute force.",
        code: `function twoSum(numbers, target) {
  const seen = new Map(); // value -> index

  for (let i = 0; i < numbers.length; i++) {
    const complement = target - numbers[i];
    if (seen.has(complement)) {
      return [seen.get(complement) + 1, i + 1];
    }
    seen.set(numbers[i], i);
  }

  return [];
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal — Two Pointers",
        explanation:
          "Take advantage of the sorted order directly. Start one pointer at each end of the list, and move whichever pointer will move the sum in the right direction: forward from the left if the sum is too small, backward from the right if it's too big.",
        code: `function twoSum(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) {
      return [left + 1, right + 1];
    } else if (sum < target) {
      left++;
    } else {
      right--;
    }
  }

  return [];
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let left = 0; let right = numbers.length - 1;", explanation: "Start at the smallest and the largest number." },
          { code: "const sum = numbers[left] + numbers[right];", explanation: "Checks the sum of the current pair." },
          { code: "if (sum === target) { return [left + 1, right + 1]; }", explanation: "Found it — return the 1-based positions." },
          {
            code: "} else if (sum < target) { left++; }",
            explanation: "Sum is too small, so move to a bigger number by advancing the left pointer.",
          },
          { code: "} else { right--; }", explanation: "Sum is too big, so move to a smaller number by pulling the right pointer back." },
        ],
      },
    ],
    relatedProblems: ["valid-palindrome", "3sum"],
    keywords: ["two sum", "sorted array", "two pointers", "constant space"],
  },
  {
    id: "3sum",
    title: "3Sum",
    difficulty: "Medium",
    category: "two-pointers",
    description: `
You're given a list of integers. Find every unique set of three numbers
in the list (a triplet) that adds up to zero.

The order of numbers within a triplet doesn't matter, but you shouldn't
return the same triplet of values more than once — even if it shows up
using different positions in the list.
    `.trim(),
    examples: [
      {
        input: "nums = [-1, 0, 1, 2, -1, -4]",
        output: "[[-1, -1, 2], [-1, 0, 1]]",
        explanation: "These are the only two distinct sets of three values from the list that sum to zero.",
      },
      {
        input: "nums = [0, 1, 1]",
        output: "[]",
        explanation: "No three numbers here add up to zero.",
      },
      {
        input: "nums = [0, 0, 0]",
        output: "[[0, 0, 0]]",
        explanation: "The only triplet available happens to sum to zero.",
      },
    ],
    constraints: ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
    hints: [
      "This is a lot like Two Sum, except you have to also pick a *first* number, and you need to avoid reporting the same triplet more than once.",
      "Try sorting the array first. Sorting groups equal values together, which makes it easy to skip duplicates, and it also unlocks a two-pointer scan for the remaining two numbers.",
      "Fix one number at a time, then use two pointers — one from just after it, one from the end of the array — to find pairs that bring the total to zero, skipping over repeated values as the pointers move.",
    ],
    approachOverview: `
A direct approach is to check every possible group of three numbers and
keep the ones that sum to zero, using a set to avoid reporting
duplicates — but that looks at every triplet, which is a lot of wasted
comparisons.

A much better approach: first sort the array. Then, for each number
(treating it as the "first" number of a triplet), use two pointers on
the rest of the sorted array — one starting right after it, one at the
very end — to find a pair that, together with the fixed number, sums to
zero. Because the array is sorted, you know exactly which pointer to
move if the running total is too big or too small, and duplicate values
sit right next to each other, so they're easy to skip.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Triplet",
        explanation:
          "Look at every possible group of three numbers, and whenever one sums to zero, record it (using a canonical, sorted form of the triplet as a key so duplicates aren't reported twice).",
        code: `function threeSum(nums) {
  const result = [];
  const seen = new Set();
  const n = nums.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        if (nums[i] + nums[j] + nums[k] === 0) {
          const triplet = [nums[i], nums[j], nums[k]].sort((a, b) => a - b);
          const key = triplet.join(",");
          if (!seen.has(key)) {
            seen.add(key);
            result.push(triplet);
          }
        }
      }
    }
  }

  return result;
}`,
        timeComplexity: "O(n³)",
        spaceComplexity: "O(n) for the results and de-duplication set",
      },
      {
        approach: "Optimal — Sort + Two Pointers",
        explanation:
          "Sort the array first. Then fix each number in turn as the first element of a triplet, and use two pointers on the remainder of the array to find a pair summing to its negative. Skip over duplicate values at every level so no triplet is reported twice.",
        code: `function threeSum(nums) {
  const result = [];
  nums.sort((a, b) => a - b);
  const n = nums.length;

  for (let i = 0; i < n - 2; i++) {
    if (nums[i] > 0) break; // smallest remaining number is positive, no way to reach zero
    if (i > 0 && nums[i] === nums[i - 1]) continue; // skip duplicate "first" numbers

    let left = i + 1;
    let right = n - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        left++;
        right--;
        while (left < right && nums[left] === nums[left - 1]) left++;
        while (left < right && nums[right] === nums[right + 1]) right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }

  return result;
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(log n) to O(n), depending on the sort's internal space (not counting the output)",
        walkthrough: [
          { code: "nums.sort((a, b) => a - b);", explanation: "Sorting groups equal values together and enables the two-pointer scan." },
          { code: "if (nums[i] > 0) break;", explanation: "If the smallest remaining number is already positive, no triplet from here on can sum to zero." },
          { code: "if (i > 0 && nums[i] === nums[i - 1]) continue;", explanation: "Skips re-using the same 'first' number twice in a row." },
          { code: "let left = i + 1; let right = n - 1;", explanation: "Two pointers scan the rest of the sorted array for a pair." },
          { code: "if (sum === 0) { result.push(...); left++; right--; }", explanation: "Found a triplet — record it, then move both pointers inward." },
          {
            code: "while (left < right && nums[left] === nums[left - 1]) left++;",
            explanation: "Skips duplicate values for the second number so the same triplet isn't found again.",
          },
          {
            code: "} else if (sum < 0) { left++; } else { right--; }",
            explanation: "Otherwise, adjusts whichever pointer moves the sum toward zero.",
          },
        ],
      },
    ],
    relatedProblems: ["two-sum-ii-input-array-is-sorted", "container-with-most-water"],
    keywords: ["3sum", "triplets", "two pointers", "sorting", "duplicates"],
  },
  {
    id: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: "Medium",
    category: "two-pointers",
    description: `
You're given the heights of a row of vertical lines, evenly spaced one
unit apart. Pick any two of these lines — together with the ground
between them — to form a container. The container's walls are as tall as
the shorter of your two chosen lines (water would spill over the
shorter side), and its width is the distance between them.

Find the two lines that create the container able to hold the most
water, and return that amount.
    `.trim(),
    examples: [
      {
        input: "height = [1, 8, 6, 2, 5, 4, 8, 3, 7]",
        output: "49",
        explanation:
          "Picking the lines of height 8 (index 1) and height 7 (index 8) gives a width of 7 and a wall height of min(8, 7) = 7, for an area of 49 — the best possible.",
      },
      {
        input: "height = [1, 1]",
        output: "1",
        explanation: "There's only one pair to choose, giving min(1, 1) * 1 = 1.",
      },
      {
        input: "height = [4, 3, 2, 1, 4]",
        output: "16",
        explanation: "The two outer lines, both height 4, give min(4, 4) * 4 = 16.",
      },
    ],
    constraints: ["2 <= height.length <= 10^5", "0 <= height[i] <= 10^4"],
    hints: [
      "The amount of water two lines can hold depends on the *shorter* of the two, and how far apart they are — moving the taller line inward can never help.",
      "Start with the widest possible container: one pointer at the very first line, one at the very last.",
      "At each step, move the pointer sitting on the shorter line inward. Moving the taller one can only ever shrink or maintain the area, since the shorter line still caps the height either way.",
    ],
    approachOverview: `
The direct approach checks every possible pair of lines and keeps track
of the best area — correct, but it repeats a lot of comparisons.

A faster approach uses two pointers starting at the two ends of the
list, which gives the widest possible container to start. At each step,
compute the area, then move whichever pointer is on the shorter line
inward. Moving the taller line can never produce a better result: the
width only shrinks, and the shorter line still limits the height either
way. Moving the shorter line is the only move that has any chance of
finding a taller wall and a bigger area, so this pass through the list
once is enough.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Pair",
        explanation: "Compute the area for every possible pair of lines, and keep track of the largest one seen.",
        code: `function maxArea(height) {
  let best = 0;
  for (let i = 0; i < height.length; i++) {
    for (let j = i + 1; j < height.length; j++) {
      const area = Math.min(height[i], height[j]) * (j - i);
      best = Math.max(best, area);
    }
  }
  return best;
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal — Two Pointers",
        explanation:
          "Start with one pointer at each end, the widest container possible. At each step, record the area, then move whichever pointer sits on the shorter line inward — that's the only move that could possibly improve things.",
        code: `function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let best = 0;

  while (left < right) {
    const width = right - left;
    const shortest = Math.min(height[left], height[right]);
    best = Math.max(best, shortest * width);

    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return best;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let left = 0; let right = height.length - 1;", explanation: "Start at the widest possible container." },
          { code: "const shortest = Math.min(height[left], height[right]);", explanation: "The shorter of the two chosen lines caps how much water can sit between them." },
          { code: "best = Math.max(best, shortest * width);", explanation: "Tracks the best area seen so far." },
          {
            code: "if (height[left] < height[right]) { left++; } else { right--; }",
            explanation: "Moves the pointer on the shorter line inward — the only move that could possibly find a bigger container.",
          },
        ],
      },
    ],
    relatedProblems: ["3sum", "trapping-rain-water"],
    keywords: ["container with most water", "two pointers", "greedy", "array"],
  },
  {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    category: "two-pointers",
    description: `
You're given an elevation map, represented as a list of bar heights (each
bar has width 1, standing right next to the next one). Imagine it rains —
figure out how many total units of water end up trapped between the
bars.

Water can only sit above a bar if there's something tall enough on both
its left and its right to hold it in; otherwise it just runs off.
    `.trim(),
    examples: [
      {
        input: "height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]",
        output: "6",
        explanation: "Water pools above the low spots wherever there are taller bars on both sides; adding up the water trapped at every position gives 6 total units.",
      },
      {
        input: "height = [4, 2, 0, 3, 2, 5]",
        output: "9",
      },
      {
        input: "height = [1, 2, 3]",
        output: "0",
        explanation: "The elevation only ever rises, so there's never a wall on both sides of a low spot — nothing gets trapped.",
      },
    ],
    constraints: ["1 <= height.length <= 2 * 10^5", "0 <= height[i] <= 10^5"],
    hints: [
      "The water sitting above any one position is limited by the shorter of the tallest bar to its left and the tallest bar to its right.",
      "You could precompute, for every position, the tallest bar to its left and the tallest bar to its right in two separate passes, then combine them — but that costs extra memory.",
      "Two pointers moving inward from both ends can track a running 'tallest so far' on each side as they go, letting you compute the trapped water at each position without ever storing full left/right arrays.",
    ],
    approachOverview: `
The amount of water that can sit above any single bar is determined by
the *shorter* of the tallest bar to its left and the tallest bar to its
right — whichever side is shorter is where the water would spill out
first. A direct approach recomputes those two values by scanning outward
from every position, which repeats a lot of work.

A better approach precomputes the tallest-bar-so-far from the left and
from the right in two passes, storing them in two arrays, and then
combines them in a third pass — fast, but it uses extra memory
proportional to the input.

The optimal approach avoids storing those arrays at all. Walk two
pointers inward from both ends, keeping a running "tallest seen so far"
for each side. At every step, you always know for certain that the
*smaller* of the two running maximums is the true limiting wall for
whichever pointer is behind, which is enough information to compute
that position's trapped water immediately and move that pointer inward.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Scan Left and Right From Every Bar",
        explanation:
          "For each position, scan all the way left to find the tallest bar so far, and all the way right to find the tallest bar so far, then use the shorter of the two to work out how much water sits there.",
        code: `function trap(height) {
  let total = 0;
  const n = height.length;

  for (let i = 0; i < n; i++) {
    let leftMax = 0;
    for (let l = 0; l <= i; l++) leftMax = Math.max(leftMax, height[l]);

    let rightMax = 0;
    for (let r = i; r < n; r++) rightMax = Math.max(rightMax, height[r]);

    total += Math.min(leftMax, rightMax) - height[i];
  }

  return total;
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Better — Precomputed Left/Right Max Arrays",
        explanation:
          "Precompute, in one left-to-right pass, the tallest bar seen so far up to each position, and in one right-to-left pass, the tallest bar seen so far from each position onward. Then a final pass combines them.",
        code: `function trap(height) {
  const n = height.length;
  if (n === 0) return 0;

  const leftMax = new Array(n);
  leftMax[0] = height[0];
  for (let i = 1; i < n; i++) {
    leftMax[i] = Math.max(leftMax[i - 1], height[i]);
  }

  const rightMax = new Array(n);
  rightMax[n - 1] = height[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    rightMax[i] = Math.max(rightMax[i + 1], height[i]);
  }

  let total = 0;
  for (let i = 0; i < n; i++) {
    total += Math.min(leftMax[i], rightMax[i]) - height[i];
  }

  return total;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal — Two Pointers",
        explanation:
          "Walk two pointers inward from both ends, tracking a running maximum height seen on each side. Whichever side currently has the smaller running maximum is the one you can safely resolve next — its running maximum is guaranteed to be the true limiting wall for that position.",
        code: `function trap(height) {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let total = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      leftMax = Math.max(leftMax, height[left]);
      total += leftMax - height[left];
      left++;
    } else {
      rightMax = Math.max(rightMax, height[right]);
      total += rightMax - height[right];
      right--;
    }
  }

  return total;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let leftMax = 0; let rightMax = 0;", explanation: "Track the tallest bar seen so far from each side, updated as the pointers move." },
          {
            code: "if (height[left] < height[right]) {",
            explanation: "Whichever side is currently shorter is the one whose running max is guaranteed correct for that position.",
          },
          { code: "leftMax = Math.max(leftMax, height[left]);", explanation: "Updates the left side's running tallest wall." },
          { code: "total += leftMax - height[left];", explanation: "Adds the water trapped above this bar (zero if this bar is itself the new tallest)." },
          { code: "left++;", explanation: "Moves that side's pointer inward, since its position has now been fully resolved." },
        ],
      },
    ],
    relatedProblems: ["container-with-most-water"],
    keywords: ["trapping rain water", "two pointers", "prefix max", "array"],
  },
  {
    id: "sort-colors",
    title: "Sort Colors",
    difficulty: "Medium",
    category: "two-pointers",
    description: `
You're given an array that contains only the values 0, 1, and 2 (think of
them as three colors — say, red, white, and blue). Rearrange the array
in place so that all the 0s come first, then all the 1s, then all the
2s.

Try to do this without calling a general-purpose sort function, and
ideally in a single pass through the array.
    `.trim(),
    examples: [
      { input: "nums = [2, 0, 2, 1, 1, 0]", output: "[0, 0, 1, 1, 2, 2]" },
      { input: "nums = [2, 0, 1]", output: "[0, 1, 2]" },
      { input: "nums = [0]", output: "[0]", explanation: "A single element is already sorted; there's nothing to rearrange." },
    ],
    constraints: ["1 <= nums.length <= 300", "nums[i] is 0, 1, or 2."],
    hints: [
      "With only three distinct values in play, is there a way to group them without falling back on a general-purpose sort?",
      "You could count how many 0s, 1s, and 2s there are, then overwrite the array in a second pass — but can it be done in one single pass instead?",
      "Keep three pointers: one marking the next open spot for a 0 (from the front), one marking the next open spot for a 2 (from the back), and one that scans through the array, swapping elements into place as it goes.",
    ],
    approachOverview: `
Since there are only three distinct values, sorting the array with a
general-purpose comparison sort works, but it's more machinery than the
problem actually needs and doesn't take advantage of there being just
three possible values.

The optimal approach (often called the Dutch National Flag algorithm)
uses three pointers: one tracking the next place a 0 should go (growing
from the front), one tracking the next place a 2 should go (growing from
the back), and one that scans through the array from left to right.
Whenever the scanning pointer sees a 0, it swaps it toward the front;
whenever it sees a 2, it swaps it toward the back; 1s are left where the
scan finds them, since they belong in the middle. This sorts the whole
array in a single pass, in place.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Built-in Sort",
        explanation:
          "Just hand the array to a general-purpose comparison sort. It's correct and simple, but it doesn't take advantage of the fact that there are only three possible values.",
        code: `function sortColors(nums) {
  nums.sort((a, b) => a - b);
}`,
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(log n) (typical sort implementation's internal stack space)",
      },
      {
        approach: "Optimal — Dutch National Flag (Three Pointers)",
        explanation:
          "Keep three pointers: `low` marks the next spot for a 0, `high` marks the next spot for a 2 (from the back), and `mid` scans through the array. Swap 0s toward `low` and 2s toward `high`; when a 1 is seen, just move past it.",
        code: `function sortColors(nums) {
  let low = 0;
  let mid = 0;
  let high = nums.length - 1;

  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
      // mid isn't advanced here — the value swapped in from the back
      // still needs to be checked
    }
  }
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let low = 0; let mid = 0; let high = nums.length - 1;", explanation: "low/mid grow from the front, high grows from the back; mid is the scanner." },
          {
            code: "if (nums[mid] === 0) { swap(low, mid); low++; mid++; }",
            explanation: "A 0 is swapped into the 0-region, and both pointers move forward since everything up to `mid` is now settled.",
          },
          { code: "} else if (nums[mid] === 1) { mid++; }", explanation: "A 1 already belongs in the middle region, so just move past it." },
          {
            code: "} else { swap(mid, high); high--; }",
            explanation: "A 2 is swapped toward the back. `mid` stays put, because the value just swapped in from `high` hasn't been checked yet.",
          },
        ],
      },
    ],
    relatedProblems: ["container-with-most-water"],
    keywords: ["sort colors", "dutch national flag", "three pointers", "in-place sort"],
  },
];
