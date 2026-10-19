import type { Problem } from "../../types/problem";

export const greedyProblems: Problem[] = [
  {
    id: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Medium",
    category: "greedy",
    description: `
You're given a list of numbers, which may include negatives. Find the
*contiguous* subarray (no skipped elements) with the largest sum, and
return that sum.

The subarray must contain at least one number.
    `.trim(),
    examples: [
      {
        input: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        output: "6",
        explanation: "The subarray [4, -1, 2, 1] adds up to 6, which is the largest sum of any contiguous stretch.",
      },
      {
        input: "nums = [1]",
        output: "1",
        explanation: "The only subarray is [1] itself.",
      },
      {
        input: "nums = [5, 4, -1, 7, 8]",
        output: "23",
        explanation: "The whole array sums to 23, and no smaller stretch beats that.",
      },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    hints: [
      "If your running subarray sum has gone negative, can keeping it ever help what comes after?",
      "A negative running total only drags down what you add next. The greedy move is to drop it and restart from the current number.",
      "Track the best sum seen anywhere, separately from the running sum.",
    ],
    approachOverview: `
Checking every subarray works but repeats a lot of summing.

Scan left to right with a running sum. If the sum ending at the previous
position is negative, it can only hurt anything that continues past it.
So throw that prefix away and start fresh from the current number.

This is **Kadane's algorithm**: one pass, a running sum that resets
whenever its prefix goes negative, and the best running sum seen so far.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Check Every Subarray",
        explanation: "From every starting index, extend the subarray one element at a time and compare its sum to the best so far.",
        code: `function maxSubArray(nums) {
  let best = -Infinity;
  for (let i = 0; i < nums.length; i++) {
    let sum = 0;
    for (let j = i; j < nums.length; j++) {
      sum += nums[j];
      best = Math.max(best, sum);
    }
  }
  return best;
}`,
        timeComplexity: "O(n^2)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal - Kadane's Algorithm",
        explanation: "Keep a running sum for the best subarray ending at the current position. When it turns negative, reset it to 0, since a negative prefix never helps a later sum.",
        code: `function maxSubArray(nums) {
  let best = nums[0];
  let curr = 0;
  for (const num of nums) {
    if (curr < 0) curr = 0;
    curr += num;
    best = Math.max(best, curr);
  }
  return best;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let best = nums[0];", explanation: "Starts the answer at the first element, in case every number is negative." },
          { code: "if (curr < 0) curr = 0;", explanation: "A negative running sum only drags down what comes next, so restart here." },
          { code: "curr += num;", explanation: "Extends the running subarray with the current number." },
          { code: "best = Math.max(best, curr);", explanation: "Records the best sum seen at any point, not just at the end." },
        ],
      },
    ],
    relatedProblems: ["jump-game"],
    keywords: ["maximum subarray", "kadane's algorithm", "greedy"],
  },
  {
    id: "jump-game",
    title: "Jump Game",
    difficulty: "Medium",
    category: "greedy",
    description: `
You start at index 0 of an array of numbers. Each number is the
*maximum* jump length from that index: you can jump forward anywhere
from 1 up to that many steps.

Return whether you can reach the last index.
    `.trim(),
    examples: [
      {
        input: "nums = [2, 3, 1, 1, 4]",
        output: "true",
        explanation: "Jump 1 step from index 0 to index 1, then 3 steps to the last index.",
      },
      {
        input: "nums = [3, 2, 1, 0, 4]",
        output: "false",
        explanation: "No matter how you jump, you always land on index 3, whose value is 0, so you get stuck there and can never reach index 4.",
      },
      {
        input: "nums = [0]",
        output: "true",
        explanation: "You're already standing on the last index.",
      },
    ],
    constraints: ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 10^5"],
    hints: [
      "You don't need every sequence of jumps, just the furthest index you can reach so far.",
      "Scan left to right, updating the furthest reachable index. What if you reach a position beyond it?",
      "If the current index is past the furthest reach, you can never get there, so stop early.",
    ],
    approachOverview: `
Trying every combination of jump lengths explodes quickly. You only need
the furthest index reachable *so far*, not which jumps got you there.

Scan left to right with a running "furthest reach". At each index i:

- If i is beyond the furthest reach, it's unreachable, so return false.
- Otherwise, update the reach to \`max(furthest, i + nums[i])\`.

If the reach ever covers the last index, you're done.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Try Every Jump (Recursion)",
        explanation: "From each index, recursively try every possible jump length and see if any path reaches the end.",
        code: `function canJump(nums) {
  function canReachEnd(pos) {
    if (pos >= nums.length - 1) return true;
    const maxJump = Math.min(nums[pos], nums.length - 1 - pos);
    for (let step = 1; step <= maxJump; step++) {
      if (canReachEnd(pos + step)) return true;
    }
    return false;
  }
  return canReachEnd(0);
}`,
        timeComplexity: "O(2^n) in the worst case, since each position branches into many jump choices",
        spaceComplexity: "O(n) recursion depth",
      },
      {
        approach: "Optimal - Greedy Furthest Reach",
        explanation: "Track the furthest reachable index while scanning left to right. If the current index ever exceeds it, the end is unreachable.",
        code: `function canJump(nums) {
  let furthest = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > furthest) return false;
    furthest = Math.max(furthest, i + nums[i]);
  }
  return true;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let furthest = 0;", explanation: "Only the start is reachable so far." },
          { code: "if (i > furthest) return false;", explanation: "This index is beyond the reach, so it's a dead end." },
          { code: "furthest = Math.max(furthest, i + nums[i]);", explanation: "Extends the reach with the longest jump from this index." },
        ],
      },
    ],
    relatedProblems: ["jump-game-ii", "maximum-subarray"],
    keywords: ["jump game", "greedy", "reachability"],
  },
  {
    id: "jump-game-ii",
    title: "Jump Game II",
    difficulty: "Medium",
    category: "greedy",
    description: `
Same setup as Jump Game: you start at index 0, and each number is the
*maximum* jump length from that index. This time you can always reach
the last index. Return the *minimum* number of jumps to get there.
    `.trim(),
    examples: [
      {
        input: "nums = [2, 3, 1, 1, 4]",
        output: "2",
        explanation: "Jump 1 step from index 0 to index 1, then 3 steps to the last index - 2 jumps total.",
      },
      {
        input: "nums = [2, 3, 0, 1, 4]",
        output: "2",
        explanation: "Jump from index 0 to index 1, then from index 1 to index 4.",
      },
      {
        input: "nums = [1, 1, 1, 1]",
        output: "3",
        explanation: "Each jump can only move 1 step, so it takes 3 jumps to cross 3 gaps.",
      },
    ],
    constraints: ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 1000", "You're guaranteed you can always reach the last index."],
    hints: [
      "Think of the array as 'levels': all positions reachable in exactly k jumps form one level.",
      "Within a level, look at every position to find the furthest the *next* jump could reach.",
      "You only 'use' a jump once you've passed every position reachable with the current jump count.",
    ],
    approachOverview: `
Searching every combination of jumps revisits the same positions over
and over. Instead, think in **levels**, like breadth-first search:

- Level 0 is index 0.
- Level 1 is every index reachable in one jump from level 0.
- Level 2 is every index reachable in one more jump from level 1, and so on.

Scan the current level's range and track the furthest index reachable
from *any* position in it. At the end of the range, you must jump: add 1
to the jump count, and the next range ends at that furthest index.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Try Every Jump (Recursion)",
        explanation: "From each index, recursively try every jump length and keep the path with the fewest jumps.",
        code: `function jump(nums) {
  function minJumpsFrom(pos) {
    if (pos >= nums.length - 1) return 0;
    let best = Infinity;
    const maxJump = Math.min(nums[pos], nums.length - 1 - pos);
    for (let step = 1; step <= maxJump; step++) {
      const rest = minJumpsFrom(pos + step);
      if (rest !== Infinity) best = Math.min(best, 1 + rest);
    }
    return best;
  }
  return minJumpsFrom(0);
}`,
        timeComplexity: "O(2^n) in the worst case, since each position branches into many jump choices",
        spaceComplexity: "O(n) recursion depth",
      },
      {
        approach: "Optimal - Greedy Level-by-Level (BFS-style)",
        explanation: "Scan the current jump's range, tracking the furthest index the next jump could reach. At the end of the range, take another jump.",
        code: `function jump(nums) {
  let jumps = 0;
  let currentEnd = 0;
  let furthest = 0;

  for (let i = 0; i < nums.length - 1; i++) {
    furthest = Math.max(furthest, i + nums[i]);
    if (i === currentEnd) {
      jumps++;
      currentEnd = furthest;
    }
  }
  return jumps;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "furthest = Math.max(furthest, i + nums[i]);", explanation: "Tracks the furthest the next jump could reach." },
          { code: "if (i === currentEnd)", explanation: "Every position reachable with the current jump count has been checked." },
          { code: "jumps++; currentEnd = furthest;", explanation: "Takes one more jump; the range grows to the furthest point found." },
        ],
      },
    ],
    relatedProblems: ["jump-game"],
    keywords: ["jump game ii", "greedy", "bfs levels", "minimum jumps"],
  },
  {
    id: "gas-station",
    title: "Gas Station",
    difficulty: "Medium",
    category: "greedy",
    description: `
Gas stations are arranged in a circle. At station \`i\` you pick up
\`gas[i]\` fuel, and driving to the next station costs \`cost[i]\` fuel.
You start with an empty tank at a station of your choice.

Return the starting station's index that lets you drive the full circle
without the tank going negative. If no start works, return -1. If an
answer exists, it's unique.
    `.trim(),
    examples: [
      {
        input: "gas = [1, 2, 3, 4, 5], cost = [3, 4, 5, 1, 2]",
        output: "3",
        explanation: "Starting at station 3: tank = 4-1=3, then +5-2=6, then +1-3=4, then +2-4=2, then +3-5=0. You never go negative and make it all the way around.",
      },
      {
        input: "gas = [2, 3, 4], cost = [3, 4, 3]",
        output: "-1",
        explanation: "Total gas (9) is less than total cost (10), so no starting point can complete the circuit.",
      },
    ],
    constraints: ["n == gas.length == cost.length", "1 <= n <= 10^5", "0 <= gas[i], cost[i] <= 10^4"],
    hints: [
      "If total gas is less than total cost, no start can work. Rule that out first.",
      "If you start at some station and the tank goes negative at station j, could any station between your start and j have worked instead?",
      "None could. Starting later only gives a smaller-or-equal tank at each point, so you'd still run dry by j. The next candidate start is the station after j.",
    ],
    approachOverview: `
Simulating the loop from every station works but is slow.

First, if total gas is less than total cost, no start works. Otherwise
a solution exists, and one pass finds it.

Walk around once from station 0 with a running tank. When it goes
negative, none of the stations since the current candidate start could
work either: starting later only gives a smaller-or-equal tank at each
point. So move the candidate start to the next station.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Simulate From Every Start",
        explanation: "From every station, simulate a full trip, giving up as soon as the tank goes negative.",
        code: `function canCompleteCircuit(gas, cost) {
  const n = gas.length;
  for (let start = 0; start < n; start++) {
    let tank = 0;
    let steps = 0;
    for (; steps < n; steps++) {
      const i = (start + steps) % n;
      tank += gas[i] - cost[i];
      if (tank < 0) break;
    }
    if (steps === n) return start;
  }
  return -1;
}`,
        timeComplexity: "O(n^2)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal - Greedy One Pass",
        explanation: "Compare total gas to total cost to see if any start works. Find the start by moving the candidate forward each time the running tank goes negative.",
        code: `function canCompleteCircuit(gas, cost) {
  let totalTank = 0;
  let currTank = 0;
  let start = 0;

  for (let i = 0; i < gas.length; i++) {
    const diff = gas[i] - cost[i];
    totalTank += diff;
    currTank += diff;
    if (currTank < 0) {
      start = i + 1;
      currTank = 0;
    }
  }

  return totalTank < 0 ? -1 : start;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "totalTank += diff;", explanation: "Tracks whether any solution can exist." },
          { code: "currTank += diff;", explanation: "Tracks the tank from the current candidate start." },
          { code: "if (currTank < 0) { start = i + 1; currTank = 0; }", explanation: "This start failed, and so did every station since it. Move to the next station and reset the tank." },
          { code: "return totalTank < 0 ? -1 : start;", explanation: "If total gas can't cover total cost, it's impossible. Otherwise the remaining candidate is the answer." },
        ],
      },
    ],
    relatedProblems: [],
    keywords: ["gas station", "greedy", "circular route"],
  },
  {
    id: "hand-of-straights",
    title: "Hand of Straights",
    difficulty: "Medium",
    category: "greedy",
    description: `
You're given a hand of numbered cards and a \`groupSize\`. Return whether
you can split every card into groups of exactly \`groupSize\` *consecutive*
numbers (like 3, 4, 5), using each card once.
    `.trim(),
    examples: [
      {
        input: "hand = [1, 2, 3, 6, 2, 3, 4, 7, 8], groupSize = 3",
        output: "true",
        explanation: "The hand splits into [1,2,3], [2,3,4], and [6,7,8], each a run of 3 consecutive numbers.",
      },
      {
        input: "hand = [1, 2, 3, 4, 5], groupSize = 4",
        output: "false",
        explanation: "5 cards can't be split evenly into groups of 4.",
      },
      {
        input: "hand = [8, 10, 12], groupSize = 3",
        output: "false",
        explanation: "No 3 of these numbers are consecutive, so no valid group can be formed.",
      },
    ],
    constraints: ["1 <= hand.length <= 10^4", "0 <= hand[i] <= 10^9", "1 <= groupSize <= hand.length"],
    hints: [
      "If the number of cards isn't divisible by groupSize, it's impossible.",
      "Look at the smallest card left. It *has* to be the smallest number in its group, since there's no smaller card to go before it.",
      "So start each run at the smallest remaining card and use up groupSize consecutive values from there. Keep a count of each value so you can check and consume quickly.",
    ],
    approachOverview: `
Always look at the smallest card value left. It can only be the *start*
of its run, since no smaller value is left to go before it. That removes
any doubt about which group a card joins, so you can build groups
greedily.

Count the copies of each value. Repeatedly take the smallest value with
a count above zero, and use one card each of that value and the next
\`groupSize - 1\` values. If a needed value is missing, the hand can't be
split.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Sort and Greedily Remove",
        explanation: "Sort the cards. Take the smallest remaining card and remove groupSize consecutive values from the list, searching the array again each time.",
        code: `function isNStraightHand(hand, groupSize) {
  if (hand.length % groupSize !== 0) return false;
  const remaining = [...hand].sort((a, b) => a - b);

  while (remaining.length > 0) {
    const start = remaining[0];
    const used = [];
    for (let need = start; need < start + groupSize; need++) {
      const idx = remaining.indexOf(need);
      if (idx === -1) return false;
      used.push(idx);
    }
    used.sort((a, b) => b - a);
    for (const idx of used) remaining.splice(idx, 1);
  }
  return true;
}`,
        timeComplexity: "O(n^2 / groupSize) due to repeated linear scans and splices",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal - Count Map + Smallest-First Greedy",
        explanation: "Count each value. Start each group at the smallest value with a positive count, and use up groupSize consecutive values from the count map.",
        code: `function isNStraightHand(hand, groupSize) {
  if (hand.length % groupSize !== 0) return false;

  const count = new Map();
  for (const card of hand) count.set(card, (count.get(card) || 0) + 1);

  const sortedValues = [...count.keys()].sort((a, b) => a - b);

  for (const value of sortedValues) {
    const need = count.get(value);
    if (need > 0) {
      for (let v = value; v < value + groupSize; v++) {
        const have = count.get(v) || 0;
        if (have < need) return false;
        count.set(v, have - need);
      }
    }
  }
  return true;
}`,
        timeComplexity: "O(n log n), dominated by sorting the distinct values",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "const sortedValues = [...count.keys()].sort((a, b) => a - b);", explanation: "Processes distinct values from smallest to largest, since the smallest remaining card must start its group." },
          { code: "const need = count.get(value);", explanation: "How many groups must start here. If 0, earlier groups already used up this value." },
          { code: "if (have < need) return false;", explanation: "Not enough copies of this value to complete `need` groups." },
          { code: "count.set(v, have - need);", explanation: "Uses one card of value v for each of the `need` groups starting at `value`." },
        ],
      },
    ],
    relatedProblems: ["merge-triplets-to-form-target-triplet"],
    keywords: ["hand of straights", "greedy", "consecutive groups"],
  },
  {
    id: "merge-triplets-to-form-target-triplet",
    title: "Merge Triplets to Form Target Triplet",
    difficulty: "Medium",
    category: "greedy",
    description: `
You have a list of triplets \`[x, y, z]\` and one target triplet. You can
*merge* any subset of triplets by taking the maximum at each position
(merging \`[2, 5, 3]\` and \`[1, 7, 5]\` gives \`[2, 7, 5]\`).

Return whether some subset, of any size, merges into exactly the target.
    `.trim(),
    examples: [
      {
        input: "triplets = [[2,5,3],[1,8,4],[1,7,5]], target = [2,7,5]",
        output: "true",
        explanation: "Merging [2,5,3] and [1,7,5] gives [max(2,1), max(5,7), max(3,5)] = [2,7,5], which matches the target.",
      },
      {
        input: "triplets = [[3,4,5],[4,5,6]], target = [3,2,5]",
        output: "false",
        explanation: "Every triplet has a value greater than 2 in the second position, so merging can never bring that position down to 2 - merging only ever raises or keeps values, never lowers them.",
      },
      {
        input: "triplets = [[2,5,3],[2,3,4],[1,2,5],[5,2,3]], target = [5,5,5]",
        output: "true",
        explanation: "Merging [2,5,3], [1,2,5], and [5,2,3] gives [max(2,1,5), max(5,2,2), max(3,5,3)] = [5,5,5].",
      },
    ],
    constraints: [
      "1 <= triplets.length <= 10^5",
      "triplets[i].length == target.length == 3",
      "1 <= triplets[i][j], target[j] <= 1000",
    ],
    hints: [
      "Merging takes maximums, so a triplet bigger than the target in any position can never be used. It would overshoot.",
      "Throw out every triplet that exceeds the target in any position. It can only hurt.",
      "Among the triplets left, check that each target position is hit by at least one of them.",
    ],
    approachOverview: `
Merging takes maximums, so it can never *lower* a value. A triplet that
exceeds the target in any position is out: using it would push that
position too high, with no way back down.

So discard every triplet that overshoots anywhere. Among the rest (every
value is <= the target), check that each of the 3 positions is hit
exactly by at least one triplet. If all 3 are covered, merging all the
remaining triplets gives the target.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Try Every Subset",
        explanation: "Merge every subset of triplets and check whether any equals the target.",
        code: `function mergeTriplets(triplets, target) {
  const n = triplets.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    let merged = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        for (let j = 0; j < 3; j++) {
          merged[j] = Math.max(merged[j], triplets[i][j]);
        }
      }
    }
    if (merged[0] === target[0] && merged[1] === target[1] && merged[2] === target[2]) {
      return true;
    }
  }
  return false;
}`,
        timeComplexity: "O(2^n * n) - every subset of n triplets, each taking O(n) to merge",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal - Filter Then Check Coverage",
        explanation: "Discard triplets that overshoot the target anywhere, since merging can't lower a value. Then check each target position is matched by at least one remaining triplet.",
        code: `function mergeTriplets(triplets, target) {
  const achieved = [false, false, false];

  for (const triplet of triplets) {
    if (triplet[0] > target[0] || triplet[1] > target[1] || triplet[2] > target[2]) {
      continue;
    }
    for (let j = 0; j < 3; j++) {
      if (triplet[j] === target[j]) achieved[j] = true;
    }
  }

  return achieved[0] && achieved[1] && achieved[2];
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "if (triplet[0] > target[0] || triplet[1] > target[1] || triplet[2] > target[2]) continue;", explanation: "This triplet would overshoot the target somewhere, so skip it." },
          { code: "if (triplet[j] === target[j]) achieved[j] = true;", explanation: "A remaining triplet matching the target at position j proves that position is reachable." },
          { code: "return achieved[0] && achieved[1] && achieved[2];", explanation: "The target is reachable only if all 3 positions are matched." },
        ],
      },
    ],
    relatedProblems: ["hand-of-straights"],
    keywords: ["merge triplets", "greedy", "elementwise maximum"],
  },
  {
    id: "partition-labels",
    title: "Partition Labels",
    difficulty: "Medium",
    category: "greedy",
    description: `
You're given a string of lowercase letters. Split it into as many
contiguous parts as possible so that each letter appears in *only one*
part. Return the length of each part, in order.
    `.trim(),
    examples: [
      {
        input: 'S = "ababcbacadefegdehijhklij"',
        output: "[9, 7, 8]",
        explanation: 'The parts are "ababcbaca", "defegde", and "hijhklij". Splitting any finer would separate two occurrences of the same letter.',
      },
      {
        input: 'S = "eccbbbbdec"',
        output: "[10]",
        explanation: 'Letter "e" appears at both index 0 and index 8, and other letters overlap with that range too, so the whole string must be one part.',
      },
      {
        input: 'S = "abc"',
        output: "[1, 1, 1]",
        explanation: "No letter repeats, so every character can be its own part.",
      },
    ],
    constraints: ["1 <= S.length <= 500", "S consists of lowercase English letters"],
    hints: [
      "A part must reach at least the *last* occurrence of every letter inside it.",
      "First, record the last index of each letter in the string.",
      "Scan left to right, pushing the current part's end out to the last occurrence of each letter you see. When the scan reaches that end, the part is complete.",
    ],
    approachOverview: `
A part is valid only if it includes the last occurrence of *every*
letter inside it. Cutting it shorter would leave a repeat in a later
part. So first record each letter's last index.

Then scan left to right, extending the current part's end to the last
occurrence of each letter you see. When the scan reaches that end, no
letter inside reappears later. Close the part and start a new one.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Grow and Verify Each Part",
        explanation: "From each start, extend the part until no letter inside it appears later in the string.",
        code: `function partitionLabels(s) {
  const result = [];
  let start = 0;

  while (start < s.length) {
    let end = start;
    let i = start;
    while (i <= end) {
      const lastOccurrence = s.lastIndexOf(s[i]);
      end = Math.max(end, lastOccurrence);
      i++;
    }
    result.push(end - start + 1);
    start = end + 1;
  }
  return result;
}`,
        timeComplexity: "O(n^2) since lastIndexOf rescans the string for every character examined",
        spaceComplexity: "O(1) extra (excluding the output)",
      },
      {
        approach: "Optimal - Precompute Last Occurrences",
        explanation: "Record each letter's last index in one pass. Then scan again, extending the part's end to each letter's last occurrence, and cut a part when the scan reaches that end.",
        code: `function partitionLabels(s) {
  const lastIndex = new Map();
  for (let i = 0; i < s.length; i++) lastIndex.set(s[i], i);

  const result = [];
  let start = 0;
  let end = 0;

  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, lastIndex.get(s[i]));
    if (i === end) {
      result.push(end - start + 1);
      start = i + 1;
    }
  }
  return result;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1) since there are at most 26 lowercase letters",
        walkthrough: [
          { code: "for (let i = 0; i < s.length; i++) lastIndex.set(s[i], i);", explanation: "Records each letter's last index." },
          { code: "end = Math.max(end, lastIndex.get(s[i]));", explanation: "Extends the part to cover this letter's last occurrence." },
          { code: "if (i === end)", explanation: "The scan reached the part's end, so no letter inside reappears later." },
          { code: "result.push(end - start + 1); start = i + 1;", explanation: "Closes the part and starts the next one." },
        ],
      },
    ],
    relatedProblems: [],
    keywords: ["partition labels", "greedy", "intervals within a string"],
  },
  {
    id: "valid-parenthesis-string",
    title: "Valid Parenthesis String",
    difficulty: "Medium",
    category: "greedy",
    description: `
You're given a string of \`'('\`, \`')'\`, and \`'*'\`. Each \`'*'\` is a
wildcard: you choose whether it's \`'('\`, \`')'\`, or an empty string,
separately for each one.

Return whether *some* choice of wildcards makes the string valid: every
open paren has a matching close paren later, properly nested.
    `.trim(),
    examples: [
      { input: 's = "()"', output: "true", explanation: "Already valid with no wildcards involved." },
      {
        input: 's = "(*)"',
        output: "true",
        explanation: 'Treat the "*" as an empty string, leaving "()", which is valid.',
      },
      {
        input: 's = "(*))"',
        output: "true",
        explanation: 'Treat the "*" as "(", giving "(())", which is valid.',
      },
    ],
    constraints: ["1 <= s.length <= 100", "s[i] is '(', ')', or '*'"],
    hints: [
      "Instead of trying every wildcard combination, track the *range* of possible open-paren counts at each point.",
      "A '(' raises both the lowest and highest count, a ')' lowers both, and a '*' widens the range.",
      "If the highest count drops below 0, nothing can recover, so fail. If the lowest count goes negative, clamp it to 0: that path over-closed, but others didn't.",
    ],
    approachOverview: `
Trying every wildcard combination is exponential. Instead of one exact
count of unmatched \`'('\`, track a *range*: the minimum and maximum
unmatched count possible after each character.

Scan left to right:

- \`'('\` raises both bounds.
- \`')'\` lowers both.
- \`'*'\` lowers the low bound (as \`')'\`) and raises the high bound (as \`'('\`).

If the high bound drops below 0, some \`')'\` can't be matched whatever
you choose, so fail. If the low bound drops below 0, clamp it to 0: that
low path is dead, but higher ones may still work. At the end, the string
is valid if the low bound is 0.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Try Every Wildcard Resolution (Recursion)",
        explanation: "At each '*', branch into all 3 choices and recursively check whether any leads to a valid string.",
        code: `function checkValidString(s) {
  function isValid(i, openCount) {
    if (openCount < 0) return false;
    if (i === s.length) return openCount === 0;

    const c = s[i];
    if (c === "(") return isValid(i + 1, openCount + 1);
    if (c === ")") return isValid(i + 1, openCount - 1);
    // '*' — try treating it as '(', ')', or empty
    return (
      isValid(i + 1, openCount + 1) ||
      isValid(i + 1, openCount - 1) ||
      isValid(i + 1, openCount)
    );
  }
  return isValid(0, 0);
}`,
        timeComplexity: "O(3^n) in the worst case, one branch per wildcard interpretation",
        spaceComplexity: "O(n) recursion depth",
      },
      {
        approach: "Optimal - Track Range of Possible Open Counts",
        explanation: "Track the minimum and maximum possible open count as you scan. '(' and ')' shift the range; '*' widens it.",
        code: `function checkValidString(s) {
  let low = 0;
  let high = 0;

  for (const c of s) {
    if (c === "(") {
      low++;
      high++;
    } else if (c === ")") {
      low--;
      high--;
    } else {
      low--;
      high++;
    }

    if (high < 0) return false;
    if (low < 0) low = 0;
  }

  return low === 0;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "low--; high++;", explanation: "A '*' could be ')' (lower) or '(' (higher), so the range widens both ways." },
          { code: "if (high < 0) return false;", explanation: "Even at best, ')' outnumbers '('. No wildcard choice can fix this." },
          { code: "if (low < 0) low = 0;", explanation: "The lowest path over-closed and is dead, but other choices may still work, so clamp instead of failing." },
          { code: "return low === 0;", explanation: "Valid only if some choice matches every open paren by the end." },
        ],
      },
    ],
    relatedProblems: [],
    keywords: ["valid parenthesis string", "greedy", "wildcard", "range tracking"],
  },
];
