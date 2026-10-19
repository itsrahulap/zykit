import type { Problem } from "../../types/problem";

export const twoPointersProblems: Problem[] = [
  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    category: "two-pointers",
    description: `
Given a string, check whether it reads the same forwards and backwards.

Only letters and digits count. Ignore punctuation, spaces and symbols,
and treat uppercase and lowercase as the same letter.
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
      "You don't need to build a cleaned-up string first. Can you compare characters from the two ends of the original string?",
      "Use one pointer at the front and one at the back. Walk them toward each other, skipping any character that isn't a letter or digit.",
      "When both pointers are on letters or digits, compare them ignoring case. If they ever differ, stop.",
    ],
    approachOverview: `
The simplest way is to build a cleaned-up string (letters and digits
only, lowercase) and check whether it equals its reverse. This works, but
it allocates new strings just to compare them.

A leaner way builds nothing new. Put one pointer at the start and one at
the end, and walk them toward each other, skipping any character that
isn't a letter or digit. When both are on "real" characters, compare
them ignoring case. Any mismatch means it isn't a palindrome. If the
pointers meet without a mismatch, it is.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Clean, Then Compare to Reverse",
        explanation:
          "Build a new string of only the lowercased letters and digits, then compare it to its reverse. Easy to follow, but it does extra work building and reversing a second string.",
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
          "Walk one pointer in from each end, skipping any character that isn't a letter or digit. Compare their characters (ignoring case) as they close in on the middle. No extra string is built.",
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
Given a list of numbers sorted in increasing order and a target, find two
*different* numbers that add up to the target and return their positions.

Unlike the usual Two Sum, positions start at 1, not 0. There is always
exactly one valid pair, and you can't use the same element twice. Since
the list is sorted, solve it using only constant extra space.
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
      "The list is sorted. If your current pair's sum is too big, which number should you change to make it smaller?",
      "The hash-map trick from unsorted Two Sum works, but costs extra memory. The sorted order lets you avoid that.",
      "Start one pointer at the smallest number and one at the largest. Move the left pointer forward when the sum is too small, and the right pointer back when it's too big.",
    ],
    approachOverview: `
Because the list is sorted, moving the left pointer forward can only
increase the sum, and moving the right pointer back can only decrease it.
So you always know which pointer to move and never need to backtrack.

Start with pointers at the first and last numbers:

- Sum too small: move the left pointer forward (to a bigger number).
- Sum too big: move the right pointer back (to a smaller number).
- Sum matches: you're done.

This takes one pass and no extra memory beyond the two pointers.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Pair",
        explanation:
          "Try every pair and check whether it sums to the target. Correct, but it ignores the sorted order.",
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
          "Walk the list once. For each number, check a Map to see if the value that completes the pair was already seen. Faster than brute force, but it ignores the sorted order and uses O(n) extra memory.",
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
          "Use the sorted order directly. Start a pointer at each end. Move the left one forward if the sum is too small, or the right one back if it's too big.",
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
Given a list of integers, find every unique set of three numbers (a
triplet) that adds up to zero.

Order within a triplet doesn't matter. Don't return the same triplet of
values twice, even if it appears at different positions.
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
      "This is like Two Sum, but you also pick a *first* number, and you must not report the same triplet twice.",
      "Sort the array first. Equal values end up together, so duplicates are easy to skip, and you can use a two-pointer scan for the other two numbers.",
      "Fix one number at a time. Then use two pointers, one just after it and one at the end, to find pairs that bring the total to zero. Skip repeated values as the pointers move.",
    ],
    approachOverview: `
The direct approach checks every group of three and keeps those that sum
to zero, using a set to skip duplicates. That wastes a lot of
comparisons.

A better approach sorts the array first. Then treat each number as the
"first" of a triplet, and use two pointers on the rest (one right after
it, one at the end) to find a pair that brings the total to zero. Since
the array is sorted, you know which pointer to move when the total is
too big or too small. Duplicates sit next to each other, so they're easy
to skip.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Triplet",
        explanation:
          "Check every group of three. When one sums to zero, record it, using the sorted triplet as a key so duplicates aren't reported twice.",
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
          "Sort the array. Fix each number in turn as the first element, and use two pointers on the rest to find a pair summing to its negative. Skip duplicate values at every level so no triplet repeats.",
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
You're given the heights of a row of vertical lines, spaced one unit
apart. Any two lines, with the ground between them, form a container.
Its height is the shorter of the two lines (water spills over the shorter
side), and its width is the distance between them.

Return the most water any container can hold.
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
      "The water two lines hold depends on the *shorter* line and the distance between them. Moving the taller line inward never helps.",
      "Start with the widest container: one pointer at the first line, one at the last.",
      "At each step, move the pointer on the shorter line inward. Moving the taller one can't increase the area, since the shorter line still caps the height.",
    ],
    approachOverview: `
The direct approach checks every pair of lines and keeps the best area.
It's correct but repeats a lot of work.

A faster approach starts two pointers at the ends, the widest container.
At each step, compute the area, then move the pointer on the shorter line
inward. Moving the taller line can't help: the width shrinks and the
shorter line still limits the height. Only moving the shorter line can
find a taller wall and a bigger area, so one pass is enough.
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
          "Start with a pointer at each end, the widest container. At each step, record the area, then move the pointer on the shorter line inward. That's the only move that can improve the area.",
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
You're given an elevation map as a list of bar heights. Each bar has
width 1 and sits right next to the next. After it rains, how many units
of water are trapped between the bars?

Water can only sit above a bar if something tall enough is on both its
left and right to hold it in. Otherwise it runs off.
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
      "The water above a position is limited by the shorter of the tallest bar to its left and the tallest bar to its right.",
      "You could precompute the tallest bar to the left and right of every position in two passes, then combine them. But that costs extra memory.",
      "Two pointers moving inward from both ends can track a running 'tallest so far' on each side. That lets you compute each position's water without storing full left/right arrays.",
    ],
    approachOverview: `
The water above a bar depends on the *shorter* of the tallest bar to its
left and the tallest bar to its right, since water spills out over the
shorter side first. The direct approach rescans outward from every
position to find these, which repeats a lot of work.

A better approach precomputes the tallest bar so far from the left and
from the right in two passes, stores them in two arrays, and combines
them in a third pass. It's fast but uses O(n) extra memory.

The optimal approach skips the arrays. Walk two pointers inward from both
ends, keeping a running "tallest so far" for each side. The *smaller* of
the two running maximums is always the true limiting wall for the pointer
on that side. So you can compute that position's water right away and
move that pointer inward.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Scan Left and Right From Every Bar",
        explanation:
          "For each position, scan left and right to find the tallest bar on each side. The shorter of the two sets how much water sits there.",
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
          "One left-to-right pass records the tallest bar up to each position. One right-to-left pass records the tallest bar from each position onward. A final pass combines them.",
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
          "Walk two pointers inward from both ends, tracking the maximum height seen on each side. Resolve the side with the smaller running maximum next: that maximum is guaranteed to be the true limiting wall for its position.",
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
You're given an array of only 0s, 1s and 2s (think of them as three
colors: red, white and blue). Rearrange it in place so all 0s come
first, then all 1s, then all 2s.

Try not to use a general-purpose sort, and ideally use a single pass.
    `.trim(),
    examples: [
      { input: "nums = [2, 0, 2, 1, 1, 0]", output: "[0, 0, 1, 1, 2, 2]" },
      { input: "nums = [2, 0, 1]", output: "[0, 1, 2]" },
      { input: "nums = [0]", output: "[0]", explanation: "A single element is already sorted; there's nothing to rearrange." },
    ],
    constraints: ["1 <= nums.length <= 300", "nums[i] is 0, 1, or 2."],
    hints: [
      "With only three distinct values, can you group them without a general-purpose sort?",
      "You could count the 0s, 1s and 2s, then overwrite the array in a second pass. Can you do it in one pass?",
      "Keep three pointers: the next spot for a 0 (from the front), the next spot for a 2 (from the back), and a scanner that swaps elements into place as it goes.",
    ],
    approachOverview: `
A general-purpose comparison sort works, but it's more than the problem
needs and ignores that there are only three possible values.

The optimal approach, the Dutch National Flag algorithm, uses three
pointers: the next place for a 0 (growing from the front), the next place
for a 2 (growing from the back), and a scanner moving left to right.

- When the scanner sees a 0, swap it toward the front.
- When it sees a 2, swap it toward the back.
- Leave 1s where they are, since they belong in the middle.

This sorts the array in place in a single pass.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Built-in Sort",
        explanation:
          "Use a general-purpose comparison sort. Correct and simple, but it ignores that there are only three possible values.",
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
