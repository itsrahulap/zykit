import type { Problem } from "../../types/problem";

export const greedyProblems: Problem[] = [
  {
    id: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Medium",
    category: "greedy",
    description: `
You're given a list of numbers, which may include negatives. Find the
*contiguous* stretch of numbers (a subarray - no skipping elements)
whose sum is the largest possible, and return that sum.

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
      "If you're extending a running subarray sum and it's gone negative, would keeping it around ever help the sum of anything that comes after?",
      "A negative running total only drags down whatever you add to it next - so the greedy move is to drop it and restart from the current number.",
      "Track the best sum seen anywhere, separately from the running sum you're building.",
    ],
    approachOverview: `
Checking every possible subarray works but repeats a huge amount of
summing. The key insight is about the running sum as you scan left to
right: if the sum of the subarray ending at the previous position is
negative, it can only hurt any subarray that continues past it - so
the greedy choice is to throw that prefix away and start fresh from the
current number.

This is **Kadane's algorithm**: walk through the array once, keeping a
running sum that resets to the current element whenever it would
otherwise drop below the current element's own value, and track the
best running sum seen at any point.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Check Every Subarray",
        explanation: "For every starting index, extend the subarray one element at a time and track the running sum, comparing against the best seen so far.",
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
        explanation: "Keep a running sum that represents the best subarray ending at the current position. Whenever that running sum turns negative, reset it to 0 (drop the prefix), since a negative prefix can never help a future sum.",
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
          { code: "let best = nums[0];", explanation: "Start the answer at the first element in case every number is negative." },
          { code: "if (curr < 0) curr = 0;", explanation: "A negative running sum only drags down what comes next, so drop it and restart from here." },
          { code: "curr += num;", explanation: "Extend the running subarray to include the current number." },
          { code: "best = Math.max(best, curr);", explanation: "Record the best sum seen at any point, not just the final one." },
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
You start at index 0 of an array of numbers. The number at each index
tells you the *maximum* number of steps you're allowed to jump forward
from that index (you can jump anywhere from 1 up to that many steps, or
stay put by not jumping at all if you don't need to).

Determine whether you can reach the last index of the array, starting
from index 0.
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
      "You don't need to track every possible sequence of jumps - just the furthest index you could possibly reach so far.",
      "Scan left to right, updating the furthest reachable index as you go. What happens if you reach a position beyond what's currently reachable?",
      "If the current index is ever further than the furthest reach you've built up, you can never get there, so you can stop early.",
    ],
    approachOverview: `
Trying every combination of jump lengths explodes combinatorially.
Instead, notice that all you actually need to know at any position is
the single furthest index reachable *so far* from everything to its
left - not which specific jumps got you there.

Greedily scan left to right, keeping a running "furthest reach". At
each index i, if i is beyond the furthest reach, you could never have
gotten here, so it's unreachable and the whole thing fails. Otherwise,
update the furthest reach to \`max(furthest, i + nums[i])\`. If the
furthest reach ever covers the last index, you're done.
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
        explanation: "Track the furthest index reachable so far while scanning left to right. If the current index ever exceeds that reach, the end is unreachable.",
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
          { code: "let furthest = 0;", explanation: "Nothing but the start is reachable yet." },
          { code: "if (i > furthest) return false;", explanation: "If this index is beyond everything reachable so far, it's a dead end." },
          { code: "furthest = Math.max(furthest, i + nums[i]);", explanation: "Extend the reach using the best jump available from this index." },
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
Same setup as before: you start at index 0 of an array, and the number
at each index is the *maximum* number of steps you can jump forward
from there. This time, it's guaranteed you can always reach the last
index - your job is to find the *minimum* number of jumps needed to
get there.
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
      "Think of the array as a series of 'levels' - all the positions reachable using exactly k jumps form one level.",
      "Within the current level, you don't need to jump immediately - you can look ahead at every position in the level to find the furthest the *next* jump could reach.",
      "You only need to actually 'use' a jump when you've exhausted every position reachable at the current jump count.",
    ],
    approachOverview: `
You could search every combination of jumps and take the shortest path,
but that revisits the same positions over and over. Instead, think in
terms of **levels**, like a breadth-first search: level 0 is just index
0; level 1 is every index reachable in one jump from level 0; level 2
is every index reachable in one more jump from anywhere in level 1; and
so on.

Greedily scan through the current level's range, and while doing so,
track the furthest index reachable from *any* position in it. When you
reach the end of the current level's range, you're forced to take
another jump - so increment the jump count and the level's range
becomes "up to that furthest index".
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Try Every Jump (Recursion)",
        explanation: "From each index, recursively try every possible jump length and take the path that reaches the end in the fewest jumps.",
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
        explanation: "Scan through the current jump's reachable range, tracking the furthest index the next jump could reach. When the scan hits the end of the current range, commit to another jump.",
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
          { code: "furthest = Math.max(furthest, i + nums[i]);", explanation: "While inside the current jump's range, track the furthest the next jump could reach." },
          { code: "if (i === currentEnd)", explanation: "We've used up everything reachable with the current number of jumps." },
          { code: "jumps++; currentEnd = furthest;", explanation: "Commit to one more jump, and the reachable range grows to the furthest point found." },
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
There are several gas stations arranged in a circle. At station \`i\`,
you can pick up \`gas[i]\` amount of fuel, and it costs \`cost[i]\` fuel to
drive from station \`i\` to the next station. You start with an empty
tank at whichever station you choose.

Determine the index of the station you should start at so that you can
complete the entire circuit (visiting every station and returning to
the start) without your tank ever going negative. If it's impossible
from any starting station, return -1. You're guaranteed that if an
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
      "If the total gas across all stations is less than the total cost, no start can possibly work - rule that out first.",
      "If you start driving from some station and your tank goes negative at station j, could any station between your start and j have worked instead?",
      "None of them could - if the tank was still non-negative just before reaching j from any of those starts, adding station j's deficit would drop it below zero regardless of where you started counting from. So the next candidate start is the station right after j.",
    ],
    approachOverview: `
Trying every possible starting station and simulating the whole loop
for each one works but is slow. There's a greedy shortcut: if the total
gas available across the whole circuit is less than the total cost,
it's impossible no matter where you start, so check that first.

Otherwise, a solution is guaranteed to exist, and you can find it in
one pass. Walk around once from station 0, keeping a running tank
total. Whenever the running total goes negative at some station, none
of the stations you've passed through since your current candidate
start could have worked either (starting a bit later only ever means a
smaller-or-equal running total up to any point) - so the failure
"resets" your candidate start to the very next station.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Simulate From Every Start",
        explanation: "Try starting at every station, and simulate a full trip around the circuit, giving up as soon as the tank goes negative.",
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
        explanation: "Check feasibility using the total gas vs total cost, then find the start by resetting the candidate start every time the running tank dips negative.",
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
          { code: "totalTank += diff;", explanation: "Tracks whether a solution can exist at all, across the whole circuit." },
          { code: "currTank += diff;", explanation: "Tracks the running tank from the current candidate start." },
          { code: "if (currTank < 0) { start = i + 1; currTank = 0; }", explanation: "This candidate start failed, and so did every station since it - move the candidate to the next station and start counting fresh." },
          { code: "return totalTank < 0 ? -1 : start;", explanation: "If total gas can't cover total cost it's impossible overall; otherwise the surviving candidate start is the answer." },
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
You're given a hand of cards, each with a number on it, and a group
size \`groupSize\`. Determine whether the hand can be split entirely into
groups of exactly \`groupSize\` cards each, where every group's numbers
are *consecutive* (like 3, 4, 5), using every card exactly once.
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
      "If the total number of cards isn't divisible by groupSize, it's immediately impossible.",
      "Think about the smallest-numbered card still left in your hand. Whatever group it ends up in, it *has* to be the smallest number in that group - there's no smaller card left to pair it with below it.",
      "So greedily start a run at the smallest remaining card each time, and consume groupSize consecutive values starting there. Use a count of how many of each card value you have, so you can check availability and consume quickly.",
    ],
    approachOverview: `
The trick is to always look at the smallest card value still remaining
in the hand. That card can only ever be the *start* of a consecutive
run in whatever group it belongs to - since no smaller value exists in
the hand to place before it. This removes any ambiguity about which
group a card should join, so you can build groups greedily.

Count how many copies of each value you hold. Repeatedly take the
smallest value with a remaining count greater than zero, and consume
one card each of that value and the next \`groupSize - 1\` consecutive
values. If at any point a needed consecutive value isn't available,
the hand can't be split.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Sort and Greedily Remove",
        explanation: "Sort the cards. Repeatedly take the smallest remaining card and try to remove groupSize consecutive values from the sorted list, re-searching the array each time.",
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
        explanation: "Count each value's frequency. Always start a new group at the smallest value with a positive count, and consume groupSize consecutive values from the count map.",
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
          { code: "const sortedValues = [...count.keys()].sort((a, b) => a - b);", explanation: "Process distinct values from smallest to largest, since the smallest remaining card must start its group." },
          { code: "const need = count.get(value);", explanation: "How many groups still need to start here - if it's 0, this value was already fully consumed by earlier groups." },
          { code: "if (have < need) return false;", explanation: "Not enough copies of the next consecutive value to complete `need` groups, so it's impossible." },
          { code: "count.set(v, have - need);", explanation: "Consume one card of value v for each of the `need` groups being built starting at `value`." },
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
You have a list of triplets, where each triplet is 3 numbers
\`[x, y, z]\`, and you're given one target triplet. You can pick any
subset of your triplets and *merge* them: merging combines triplets by
taking the maximum of each position across all the triplets you picked
(so merging \`[2, 5, 3]\` and \`[1, 7, 5]\` gives \`[2, 7, 5]\`).

Determine whether it's possible to choose some triplets (you can use as
many or as few as you like, in any order) so that merging them produces
exactly the target triplet.
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
      "Merging only ever takes maximums, so a triplet with any position bigger than the target's corresponding position can never be used - including it would overshoot.",
      "Throw out every triplet that has a value exceeding the target in any position - it can only hurt, never help.",
      "Among the triplets left, check whether each target position is actually achieved by at least one of them.",
    ],
    approachOverview: `
Since merging only takes maximums, it can never *lower* a value - so
any triplet with a position that exceeds the target in that same
position is immediately disqualified, because using it would push that
position above the target with no way to bring it back down.

That means the greedy filter is simple: discard every triplet that
overshoots the target anywhere. Among the triplets that remain (every
value in every position is <= the target), check whether, for each of
the 3 positions, at least one surviving triplet actually hits the
target's value there. If all 3 positions are covered, merging all the
surviving triplets together reproduces the target.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Try Every Subset",
        explanation: "Try every possible subset of triplets, merge each subset, and check if any subset's merge equals the target.",
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
        explanation: "Discard any triplet that overshoots the target in some position, since merging can never lower a value. Then check whether each target position is matched by at least one surviving triplet.",
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
          { code: "if (triplet[0] > target[0] || triplet[1] > target[1] || triplet[2] > target[2]) continue;", explanation: "This triplet would overshoot the target somewhere if used, so it's disqualified entirely." },
          { code: "if (triplet[j] === target[j]) achieved[j] = true;", explanation: "A surviving triplet that exactly matches the target in position j proves that position is reachable." },
          { code: "return achieved[0] && achieved[1] && achieved[2];", explanation: "The target is reachable only if every one of its 3 positions is matched by some surviving triplet." },
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
You're given a string made of lowercase letters. Split it into as many
contiguous parts as possible so that each letter appears in *only one*
part (every occurrence of a letter must stay within the same part).
Return the length of each part, in order.
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
      "For a part to be valid, it must extend at least as far as the *last* occurrence of every letter that appears inside it.",
      "First, record the last index at which each letter appears anywhere in the string.",
      "Scan left to right, growing the end of the current part to cover the last occurrence of every letter you've seen so far in it. When your scan position finally catches up to that end, the part is complete.",
    ],
    approachOverview: `
A part is only valid once it stretches far enough to include the very
last occurrence of *every* letter that shows up inside it - cutting it
any shorter would strand a repeat of one of those letters in a later
part. So first record, for every letter, the index of its last
occurrence in the string.

Then greedily grow a window from left to right: as you extend the
window's end, keep expanding it to the last occurrence of each new
letter encountered. Once your current scan position reaches that end,
you know no letter inside the window reappears later, so the window
is a complete, valid part - close it and start a new one.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Grow and Verify Each Part",
        explanation: "For each starting position, keep extending the candidate part until no letter inside it appears again later in the string.",
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
        explanation: "Record each letter's last index up front in one pass. Then scan once, growing the current part's end to the last occurrence of every letter seen, and cutting a part whenever the scan catches up to that end.",
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
          { code: "for (let i = 0; i < s.length; i++) lastIndex.set(s[i], i);", explanation: "One pass records the last index at which each letter appears anywhere." },
          { code: "end = Math.max(end, lastIndex.get(s[i]));", explanation: "Grow the current part's boundary to cover the last occurrence of the letter just seen." },
          { code: "if (i === end)", explanation: "The scan has caught up to the furthest boundary required so far - no letter inside the part reappears later." },
          { code: "result.push(end - start + 1); start = i + 1;", explanation: "Close off the current part and start the next one right after it." },
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
You're given a string containing only three kinds of characters:
\`'('\`, \`')'\`, and \`'*'\`. Each \`'*'\` is a wildcard that can be treated as
*either* \`'('\`, or \`')'\`, or an empty string (nothing at all) - you
choose, independently for each \`'*'\`.

Determine whether there's *some* way to resolve all the wildcards so
that the resulting string is a valid parentheses string (every open
paren has a matching close paren later, properly nested).
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
      "Instead of trying every combination of wildcard meanings, track the *range* of possible open-paren counts you could have at each point.",
      "A '(' raises both the lowest and highest possible count; a ')' lowers both; a '*' widens the range, since it could be either.",
      "If the highest possible count ever drops below 0, no combination of choices can recover, so fail immediately - and if the lowest possible count ever goes negative, clamp it to 0 (that particular low path over-closed, but others didn't).",
    ],
    approachOverview: `
Trying every combination of wildcard meanings is exponential. Instead
of tracking one exact count of unmatched open parens, track a *range*
of possible counts: the minimum and maximum number of unmatched \`'('\`
you could have after processing each character, given every valid
choice made so far for the wildcards seen.

Scanning left to right: \`'('\` increases both the low and high bound;
\`')'\` decreases both; \`'*'\` decreases the low bound (treat it as \`')'\`)
and increases the high bound (treat it as \`'('\`). If the high bound ever
drops below 0, some \`')'\` had nothing to match no matter what - fail
immediately. If the low bound drops below 0, clamp it to 0, since a
count can't really be negative - it just means not every path down that
low is still viable, but higher paths might be. At the end, it's valid
if the low bound can reach exactly 0.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Try Every Wildcard Resolution (Recursion)",
        explanation: "At each '*', branch into all 3 possible interpretations and recursively check if any full resolution produces a valid string.",
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
        explanation: "Instead of one open-paren count, track the minimum and maximum possible open count as you scan, widening the range for '*' and narrowing it for '(' and ')'.",
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
          { code: "low--; high++;", explanation: "A '*' could be ')' (lowering the count) or '(' (raising it), so the range widens on both ends." },
          { code: "if (high < 0) return false;", explanation: "Even in the best-case interpretation, unmatched ')' outnumber '(' - no wildcard choice can fix this." },
          { code: "if (low < 0) low = 0;", explanation: "The worst-case interpretation over-closed, but that just means that particular path is no longer viable - other choices might still work, so clamp rather than fail." },
          { code: "return low === 0;", explanation: "Valid only if there's some interpretation where every open paren is exactly matched by the end." },
        ],
      },
    ],
    relatedProblems: [],
    keywords: ["valid parenthesis string", "greedy", "wildcard", "range tracking"],
  },
];
