import type { Problem } from "../../types/problem";

export const dp2dProblems: Problem[] = [
  {
    id: "unique-paths",
    title: "Unique Paths",
    difficulty: "Medium",
    category: "dp-2d",
    description: `
A robot sits at the top-left corner of an \`m x n\` grid. It can only move
right or down, one cell at a time, and it's trying to reach the
bottom-right corner. Count how many distinct paths it can take.
    `.trim(),
    examples: [
      { input: "m = 3, n = 7", output: "28" },
      { input: "m = 3, n = 2", output: "3", explanation: "Right-Down-Down, Down-Right-Down, and Down-Down-Right." },
    ],
    constraints: ["1 <= m, n <= 100"],
    hints: [
      "How many ways are there to reach a cell, in terms of the cells directly above it and directly to its left?",
      "The number of ways to reach any cell is the sum of the ways to reach the cell above it and the cell to its left.",
    ],
    approachOverview: `
The robot can only arrive at any given cell from one of two places: the
cell directly above it, or the cell directly to its left. So the number
of ways to reach a cell is just the sum of the ways to reach those two
neighbors.

That means you can build up a table of "ways to reach this cell,"
starting from the top-left (1 way: don't move at all) and filling in
each row left to right, top to bottom, using only values you've already
computed.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "From any cell, recursively add the number of paths from moving right and the number of paths from moving down. Correct, but recomputes the same cells many times over.",
        code: `function uniquePaths(m, n) {
  function countFrom(row, col) {
    if (row === m - 1 || col === n - 1) return 1;
    return countFrom(row + 1, col) + countFrom(row, col + 1);
  }
  return countFrom(0, 0);
}`,
        timeComplexity: "O(2^(m+n))",
        spaceComplexity: "O(m + n) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up 2D Table",
        explanation: "Build a grid where each cell holds the number of ways to reach it, filling in the first row and column as 1 (only one way to reach any edge cell), then every other cell as the sum of the cell above and the cell to the left.",
        code: `function uniquePaths(m, n) {
  const table = Array.from({ length: m }, () => new Array(n).fill(1));

  for (let row = 1; row < m; row++) {
    for (let col = 1; col < n; col++) {
      table[row][col] = table[row - 1][col] + table[row][col - 1];
    }
  }

  return table[m - 1][n - 1];
}`,
        timeComplexity: "O(m * n)",
        spaceComplexity: "O(m * n)",
        walkthrough: [
          { code: "const table = Array.from({ length: m }, () => new Array(n).fill(1));", explanation: "Starts every cell at 1, which is already correct for the entire first row and first column." },
          { code: "table[row][col] = table[row - 1][col] + table[row][col - 1];", explanation: "Every other cell's answer is the sum of the ways to reach the cell above it and the cell to its left." },
        ],
      },
    ],
    relatedProblems: ["longest-common-subsequence"],
    keywords: ["dynamic programming", "grid", "unique paths", "2D DP"],
  },

  {
    id: "longest-common-subsequence",
    title: "Longest Common Subsequence",
    difficulty: "Medium",
    category: "dp-2d",
    description: `
You're given two strings. Find the length of their longest **common
subsequence** — the longest sequence of characters that appears in both
strings in the same relative order, but not necessarily touching each
other (you're allowed to skip characters in either string).

For example, \`"ace"\` is a subsequence of \`"abcde"\` because you can
delete \`"b"\` and \`"d"\` and still be left with \`"ace"\` in order.
    `.trim(),
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: "3", explanation: '"ace" is the longest string that is a subsequence of both.' },
      { input: 'text1 = "abc", text2 = "abc"', output: "3" },
      { input: 'text1 = "abc", text2 = "def"', output: "0", explanation: "The two strings share no characters at all." },
    ],
    constraints: ["1 <= text1.length, text2.length <= 1000", "Both strings contain only lowercase English letters"],
    hints: [
      "Compare the strings one character-pair at a time, walking from the front of each (or, equivalently, build a table from the back).",
      "If the current characters of both strings match, they must be part of the answer — the rest of the answer comes from what's left after both.",
      "If they don't match, the best answer either ignores the current character of the first string, or ignores the current character of the second string — take whichever is better.",
    ],
    approachOverview: `
Think of building a table where cell \`(i, j)\` answers: "what is the
longest common subsequence between the first \`i\` characters of
\`text1\` and the first \`j\` characters of \`text2\`?"

If the \`i\`-th character of \`text1\` and the \`j\`-th character of
\`text2\` are the same letter, that letter can always be safely used in
the answer — so the answer for \`(i, j)\` is 1 plus the answer for
\`(i-1, j-1)\` (both strings with that matching character removed).

If they're different letters, the matching character isn't shared at
this position, so the best you can do is whichever is better: dropping
the last character of \`text1\` (answer for \`(i-1, j)\`) or dropping the
last character of \`text2\` (answer for \`(i, j-1)\`).

An empty prefix of either string can never share anything, so the first
row and first column of the table are all 0 — that's your base case.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "Walk both strings from the front. If the current characters match, take that character and recurse on both strings advanced by one. Otherwise, try skipping a character from either string and keep the better result. This revisits the same (i, j) pairs repeatedly.",
        code: `function longestCommonSubsequence(text1, text2) {
  function lcs(i, j) {
    if (i === text1.length || j === text2.length) return 0;
    if (text1[i] === text2[j]) return 1 + lcs(i + 1, j + 1);
    return Math.max(lcs(i + 1, j), lcs(i, j + 1));
  }
  return lcs(0, 0);
}`,
        timeComplexity: "O(2^(m + n))",
        spaceComplexity: "O(m + n) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up 2D Table",
        explanation: "Build a table indexed by (prefix length of text1, prefix length of text2). Row and column 0 start at 0 because an empty prefix shares nothing. Fill the rest left to right, top to bottom: extend the diagonal answer by one on a match, otherwise carry forward the better of the cell above or the cell to the left.",
        code: `function longestCommonSubsequence(text1, text2) {
  const m = text1.length;
  const n = text2.length;
  const table = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
  }

  return table[m][n];
}`,
        timeComplexity: "O(m * n)",
        spaceComplexity: "O(m * n)",
        walkthrough: [
          { code: "const table = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));", explanation: "table[i][j] will mean: the LCS length between the first i characters of text1 and the first j characters of text2. The extra row/column represent empty prefixes." },
          { code: "if (text1[i - 1] === text2[j - 1]) { table[i][j] = table[i - 1][j - 1] + 1; }", explanation: "text1[i-1] and text2[j-1] are the i-th and j-th characters (1-indexed table, 0-indexed strings). A match extends the best answer from one character earlier in both strings." },
          { code: "table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);", explanation: "No match here, so the best answer just ignores one character from either string — whichever leaves the longer subsequence." },
        ],
      },
    ],
    relatedProblems: ["edit-distance", "distinct-subsequences", "unique-paths"],
    keywords: ["dynamic programming", "strings", "subsequence", "2D DP", "LCS"],
  },

  {
    id: "best-time-to-buy-and-sell-stock-with-cooldown",
    title: "Best Time to Buy and Sell Stock with Cooldown",
    difficulty: "Medium",
    category: "dp-2d",
    description: `
You're given the price of a stock on each of \`n\` days. You may buy and
sell as many times as you like, but you can only hold one share at a
time (you must sell before buying again), and after you sell, you must
wait a full day before you're allowed to buy again — a **cooldown**.

Find the maximum total profit you can make.
    `.trim(),
    examples: [
      { input: "prices = [1,2,3,0,2]", output: "3", explanation: "Buy at 1, sell at 2 (profit 1), cooldown, buy at 0, sell at 2 (profit 2). Total: 3." },
      { input: "prices = [1]", output: "0", explanation: "There's no second day to sell on, so the best move is to do nothing." },
    ],
    constraints: ["1 <= prices.length <= 5000", "0 <= prices[i] <= 1000"],
    hints: [
      "On any given day, you're always in exactly one of three situations: currently holding a share, just sold yesterday (so today is a forced cooldown), or free to buy.",
      "Think of the table as indexed by (day, which of those three situations you're in), and figure out how each situation on one day is reached from the situations on the previous day.",
    ],
    approachOverview: `
Instead of tracking single "best profit so far," track three separate
running totals for each day: the best profit if you're currently
**holding** a share, the best profit if you **just sold** today, and the
best profit if you're **resting** (free to buy, not in a forced
cooldown).

Each day's three values only depend on the previous day's three values:
- **holding** today is either the same as yesterday (do nothing), or you bought today using yesterday's resting profit.
- **just sold** today only makes sense if you were holding yesterday, plus today's price.
- **resting** today is the better of resting yesterday, or having just sold yesterday (the cooldown day has passed).

The final answer is the better of "just sold" and "resting" on the very
last day — you'd never want to end while still holding a share.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "At each day, recursively try both choices allowed by the current state (holding or not): do nothing, or buy/sell. Selling jumps two days ahead to account for the cooldown. Correct, but re-explores the same (day, state) pairs over and over.",
        code: `function maxProfit(prices) {
  const n = prices.length;

  function solve(day, holding) {
    if (day >= n) return 0;

    let best = solve(day + 1, holding); // do nothing today

    if (holding) {
      best = Math.max(best, prices[day] + solve(day + 2, false)); // sell, then cooldown tomorrow
    } else {
      best = Math.max(best, -prices[day] + solve(day + 1, true)); // buy
    }

    return best;
  }

  return solve(0, false);
}`,
        timeComplexity: "O(2^n)",
        spaceComplexity: "O(n) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up 2D Table",
        explanation: "Build a table with one row per day and three columns — holding, just sold, and resting — where each day's row is computed purely from the previous day's row.",
        code: `function maxProfit(prices) {
  const n = prices.length;
  if (n === 0) return 0;

  const HOLD = 0, SOLD = 1, REST = 2;
  const table = Array.from({ length: n }, () => new Array(3).fill(0));

  table[0][HOLD] = -prices[0];
  table[0][SOLD] = -Infinity; // can't have sold yet on day 0
  table[0][REST] = 0;

  for (let day = 1; day < n; day++) {
    table[day][HOLD] = Math.max(table[day - 1][HOLD], table[day - 1][REST] - prices[day]);
    table[day][SOLD] = table[day - 1][HOLD] + prices[day];
    table[day][REST] = Math.max(table[day - 1][REST], table[day - 1][SOLD]);
  }

  return Math.max(table[n - 1][SOLD], table[n - 1][REST]);
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) — can be reduced to O(1) by keeping only the previous day's three values",
        walkthrough: [
          { code: "table[day][HOLD] = Math.max(table[day - 1][HOLD], table[day - 1][REST] - prices[day]);", explanation: "You're holding today either because you were already holding (and did nothing), or because you were resting yesterday and just bought today." },
          { code: "table[day][SOLD] = table[day - 1][HOLD] + prices[day];", explanation: "The only way to have 'just sold' today is to have been holding yesterday and sold at today's price." },
          { code: "table[day][REST] = Math.max(table[day - 1][REST], table[day - 1][SOLD]);", explanation: "You're free to buy today either because you were already free yesterday, or because your one-day cooldown from selling yesterday has now ended." },
        ],
      },
    ],
    keywords: ["dynamic programming", "stock", "state machine", "2D DP", "cooldown"],
  },

  {
    id: "coin-change-ii",
    title: "Coin Change II",
    difficulty: "Medium",
    category: "dp-2d",
    description: `
You're given a list of coin denominations and a target \`amount\`.
Assuming you have an unlimited supply of every coin, count how many
**distinct combinations** of coins add up to exactly \`amount\`.

Order doesn't matter here — using one coin of value 2 and then one of
value 3 counts as the same combination as using a 3 first and then a 2.
    `.trim(),
    examples: [
      { input: "amount = 5, coins = [1,2,5]", output: "4", explanation: "5=5; 2+2+1; 2+1+1+1; 1+1+1+1+1." },
      { input: "amount = 3, coins = [2]", output: "0", explanation: "No combination of 2s can ever total an odd number like 3." },
      { input: "amount = 10, coins = [10]", output: "1" },
    ],
    constraints: ["1 <= coins.length <= 300", "1 <= coins[i] <= 5000", "All coin values are distinct", "0 <= amount <= 5000"],
    hints: [
      "Since order doesn't matter, process coin denominations one type at a time rather than one amount-building step at a time — this avoids counting the same combination twice in different orders.",
      "For each coin type, you either use zero of it, or at least one of it — and 'at least one' can still reuse that same coin type again.",
    ],
    approachOverview: `
Because the order coins are used in doesn't matter, the trick is to
loop over the **coin types** as one dimension of the table and the
**amount** as the other. Cell \`(i, a)\` means: "using only the first
\`i\` coin types, how many combinations make exactly amount \`a\`?"

For each cell, you have two disjoint choices: don't use the \`i\`-th
coin type at all (carry forward the count from one fewer coin type), or
use at least one of it (which reduces the amount by that coin's value,
but — since coins are reusable — you're still allowed to use that same
coin type again, so you look back at the *same* row, smaller amount).
Add those two counts together.

Processing coin types as the outer loop, rather than amounts, is what
guarantees each combination is only counted once — in the order its
coin types happen to appear in the list.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "For each coin type in turn, recursively branch on 'skip this coin type entirely' versus 'use one more of this coin type' (staying on the same type, since coins can repeat). A remaining amount of exactly 0 is one valid combination.",
        code: `function change(amount, coins) {
  function countWays(i, remaining) {
    if (remaining === 0) return 1;
    if (remaining < 0 || i === coins.length) return 0;

    const skipCoin = countWays(i + 1, remaining);
    const useCoin = countWays(i, remaining - coins[i]);
    return skipCoin + useCoin;
  }

  return countWays(0, amount);
}`,
        timeComplexity: "O(2^amount) in the worst case",
        spaceComplexity: "O(amount) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up 2D Table",
        explanation: "Build a table with one row per coin type (plus a row for 'no coins used yet') and one column per amount from 0 to the target. Each cell adds together the 'skip this coin' count and the 'use this coin' count.",
        code: `function change(amount, coins) {
  const n = coins.length;
  const table = Array.from({ length: n + 1 }, () => new Array(amount + 1).fill(0));

  for (let i = 0; i <= n; i++) {
    table[i][0] = 1; // exactly one way to make amount 0: use no coins
  }

  for (let i = 1; i <= n; i++) {
    for (let a = 1; a <= amount; a++) {
      table[i][a] = table[i - 1][a]; // don't use this coin type at all
      if (a - coins[i - 1] >= 0) {
        table[i][a] += table[i][a - coins[i - 1]]; // use at least one of this coin type
      }
    }
  }

  return table[n][amount];
}`,
        timeComplexity: "O(n * amount)",
        spaceComplexity: "O(n * amount)",
        walkthrough: [
          { code: "table[i][0] = 1;", explanation: "There's always exactly one way to make an amount of 0, no matter which coin types are available: use none of them." },
          { code: "table[i][a] = table[i - 1][a];", explanation: "This carries forward the count of combinations that never touch the i-th coin type at all." },
          { code: "table[i][a] += table[i][a - coins[i - 1]];", explanation: "This adds combinations that use at least one coin of the i-th type. Looking at table[i] (not table[i-1]) is what allows that same coin type to be reused." },
        ],
      },
    ],
    relatedProblems: ["target-sum"],
    keywords: ["dynamic programming", "coins", "combinations", "2D DP", "unbounded knapsack"],
  },

  {
    id: "target-sum",
    title: "Target Sum",
    difficulty: "Medium",
    category: "dp-2d",
    description: `
You're given a list of non-negative integers and a target number. You
must place either a \`+\` or a \`-\` sign in front of every number, then
add them all up. Count how many different ways of assigning signs make
the total equal the target.
    `.trim(),
    examples: [
      { input: "nums = [1,1,1,1,1], target = 3", output: "5", explanation: "The five sign assignments that total 3 are: -1+1+1+1+1, +1-1+1+1+1, +1+1-1+1+1, +1+1+1-1+1, +1+1+1+1-1." },
      { input: "nums = [1], target = 1", output: "1", explanation: "Only +1 works." },
    ],
    constraints: ["1 <= nums.length <= 20", "0 <= nums[i] <= 1000", "0 <= sum(nums) <= 1000", "-1000 <= target <= 1000"],
    hints: [
      "Split the numbers into two groups: the ones that end up with a + sign, and the ones that end up with a - sign. What does the target tell you about the sum of the + group?",
      "If P is the sum of the + group and the total sum of all numbers is fixed, then P minus (total - P) must equal the target — which pins down exactly what P has to be.",
      "Once you know what P has to be, the problem becomes: count the subsets of nums that sum to exactly P. That's a table indexed by (how many numbers considered, target subset sum).",
    ],
    approachOverview: `
Assigning signs is the same as splitting the numbers into a "positive
group" (sum \`P\`) and a "negative group" (sum \`total - P\`, where
\`total\` is the sum of all the numbers). Since the overall result must
equal the target, \`P - (total - P) = target\`, which rearranges to
\`P = (total + target) / 2\`.

That turns the problem into ordinary subset counting: how many subsets
of \`nums\` add up to exactly \`P\`? Build a table where cell \`(i, s)\`
means "using only the first \`i\` numbers, how many subsets sum to
\`s\`?" Each number is either left out of the subset (carry forward the
count from one fewer number) or included (add the count for the
remaining sum, using one fewer number, since each number is used at
most once).

If \`(total + target)\` is odd, or the target's absolute value exceeds
the total, no split can possibly work, so the answer is immediately 0.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "Try both a plus and a minus sign for every number, recursively, and count how many complete assignments land exactly on the target.",
        code: `function findTargetSumWays(nums, target) {
  function solve(i, total) {
    if (i === nums.length) return total === target ? 1 : 0;
    return solve(i + 1, total + nums[i]) + solve(i + 1, total - nums[i]);
  }
  return solve(0, 0);
}`,
        timeComplexity: "O(2^n)",
        spaceComplexity: "O(n) — recursion depth",
      },
      {
        approach: "Optimal — Subset-Sum Counting with a 2D Table",
        explanation: "Reduce sign assignment to counting subsets that sum to a specific target value P, then fill a standard subset-sum-count table indexed by (numbers considered, running sum).",
        code: `function findTargetSumWays(nums, target) {
  const total = nums.reduce((sum, x) => sum + x, 0);
  if (Math.abs(target) > total || (total + target) % 2 !== 0) return 0;

  const subsetSum = (total + target) / 2;
  const n = nums.length;
  const table = Array.from({ length: n + 1 }, () => new Array(subsetSum + 1).fill(0));
  table[0][0] = 1;

  for (let i = 1; i <= n; i++) {
    for (let s = 0; s <= subsetSum; s++) {
      table[i][s] = table[i - 1][s]; // leave nums[i - 1] out of the subset
      if (s - nums[i - 1] >= 0) {
        table[i][s] += table[i - 1][s - nums[i - 1]]; // include nums[i - 1] in the subset
      }
    }
  }

  return table[n][subsetSum];
}`,
        timeComplexity: "O(n * (total + target))",
        spaceComplexity: "O(n * (total + target))",
        walkthrough: [
          { code: "const subsetSum = (total + target) / 2;", explanation: "This is the exact sum the 'positive group' must reach for the overall signed total to equal the target." },
          { code: "table[0][0] = 1;", explanation: "With zero numbers considered, there's exactly one subset (the empty one) that sums to 0." },
          { code: "table[i][s] += table[i - 1][s - nums[i - 1]];", explanation: "Counts subsets that do include nums[i-1] — using table[i-1], not table[i], since each number can only be used once here (unlike Coin Change II's reusable coins)." },
        ],
      },
    ],
    relatedProblems: ["coin-change-ii"],
    keywords: ["dynamic programming", "subset sum", "counting", "2D DP", "knapsack"],
  },

  {
    id: "interleaving-string",
    title: "Interleaving String",
    difficulty: "Medium",
    category: "dp-2d",
    description: `
You're given three strings, \`s1\`, \`s2\`, and \`s3\`. Determine whether
\`s3\` can be formed by interleaving the characters of \`s1\` and \`s2\`
— shuffling them together — while keeping each string's own characters
in their original left-to-right order.

Think of it like riffle-shuffling two decks of cards: the cards from
each deck stay in their own order, but cards from the two decks can end
up mixed together in the result.
    `.trim(),
    examples: [
      { input: 's1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"', output: "true" },
      { input: 's1 = "aabcc", s2 = "dbbca", s3 = "aadbbbaccc"', output: "false" },
      { input: 's1 = "", s2 = "", s3 = ""', output: "true" },
    ],
    constraints: ["0 <= s1.length, s2.length <= 100", "0 <= s3.length <= 200", "All three strings contain only lowercase English letters"],
    hints: [
      "If s3's length doesn't equal s1's length plus s2's length, it's impossible right away.",
      "Think of building s3 one character at a time. At each step, that next character of s3 either had to come from wherever you are in s1, or from wherever you are in s2.",
      "A cell (i, j) in the table can ask: can the first i+j characters of s3 be formed using exactly the first i characters of s1 and the first j characters of s2?",
    ],
    approachOverview: `
Build a table where cell \`(i, j)\` means: "can the first \`i +j\`
characters of \`s3\` be assembled from exactly the first \`i\`
characters of \`s1\` and the first \`j\` characters of \`s2\`?" Since
every character of \`s3\` must come from one of the two strings, the
position in \`s3\` you're up to is always exactly \`i + j\` — you never
need to track it separately.

Cell \`(i, j)\` is true if either: the cell above it, \`(i-1, j)\`, was
true **and** the next character of \`s1\` matches the next character
needed in \`s3\`; or the cell to its left, \`(i, j-1)\`, was true **and**
the next character of \`s2\` matches. If neither path works, this cell is
false.

The base case \`(0, 0)\` is true (two empty prefixes trivially match an
empty result so far), and the answer you want is the bottom-right
corner, \`(len(s1), len(s2))\`.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "At each step, track how far into s1 and s2 you are (their sum tells you how far into s3 you are). Try consuming the next character from s1 if it matches, or from s2 if it matches, and recurse. This revisits the same (i, j) pair through many different paths.",
        code: `function isInterleave(s1, s2, s3) {
  if (s1.length + s2.length !== s3.length) return false;

  function solve(i, j) {
    const k = i + j;
    if (i === s1.length && j === s2.length) return true;

    let ok = false;
    if (i < s1.length && s1[i] === s3[k]) ok = solve(i + 1, j);
    if (!ok && j < s2.length && s2[j] === s3[k]) ok = solve(i, j + 1);
    return ok;
  }

  return solve(0, 0);
}`,
        timeComplexity: "O(2^(m + n)) in the worst case",
        spaceComplexity: "O(m + n) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up 2D Table",
        explanation: "Build a boolean table over (prefix length of s1, prefix length of s2), filling it in from the top-left base case using only cells already computed.",
        code: `function isInterleave(s1, s2, s3) {
  const m = s1.length;
  const n = s2.length;
  if (m + n !== s3.length) return false;

  const table = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  table[0][0] = true;

  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i === 0 && j === 0) continue;

      const k = i + j - 1; // index into s3 of the character just placed
      let ok = false;
      if (i > 0 && table[i - 1][j] && s1[i - 1] === s3[k]) ok = true;
      if (!ok && j > 0 && table[i][j - 1] && s2[j - 1] === s3[k]) ok = true;
      table[i][j] = ok;
    }
  }

  return table[m][n];
}`,
        timeComplexity: "O(m * n)",
        spaceComplexity: "O(m * n)",
        walkthrough: [
          { code: "const k = i + j - 1;", explanation: "Since every character consumed comes from either s1 or s2, the number of s3 characters placed so far is always i + j — so the character we're about to check is s3[i + j - 1]." },
          { code: "if (i > 0 && table[i - 1][j] && s1[i - 1] === s3[k]) ok = true;", explanation: "This path says: if the state one character back in s1 was reachable, and s1's next character matches, this cell is reachable too." },
          { code: "if (!ok && j > 0 && table[i][j - 1] && s2[j - 1] === s3[k]) ok = true;", explanation: "Same idea but pulling the next character from s2 instead." },
        ],
      },
    ],
    relatedProblems: ["longest-common-subsequence", "edit-distance"],
    keywords: ["dynamic programming", "strings", "interleaving", "2D DP"],
  },

  {
    id: "longest-increasing-path-in-a-matrix",
    title: "Longest Increasing Path in a Matrix",
    difficulty: "Hard",
    category: "dp-2d",
    description: `
You're given a grid of integers. Starting from any cell, you can move
to an adjacent cell (up, down, left, or right — no diagonals) as long
as its value is strictly greater than the value you're leaving. Find
the length of the longest such strictly increasing path anywhere in the
grid, counting the number of cells visited.
    `.trim(),
    examples: [
      { input: "matrix = [[9,9,4],[6,6,8],[2,1,1]]", output: "4", explanation: "The path 1 -> 2 -> 6 -> 9 (bottom row up to top-left) has length 4, and nothing longer exists." },
      { input: "matrix = [[3,4,5],[3,2,6],[2,2,1]]", output: "4", explanation: "The path 3 -> 4 -> 5 -> 6 has length 4." },
    ],
    constraints: ["1 <= rows, cols <= 200", "0 <= matrix[i][j] <= 2^31 - 1"],
    hints: [
      "Because the path must be strictly increasing, you can never revisit a cell — there's no need for a 'visited' set like you'd need in a plain graph search.",
      "Define, for each individual cell, 'the length of the longest increasing path that starts here.' How does that value relate to the same value at its increasing neighbors?",
      "The answer for a cell only ever depends on the answers for its increasing neighbors, so once you compute a cell's answer, you can cache it and never recompute it.",
    ],
    approachOverview: `
Define \`dp[r][c]\` as: "the length of the longest strictly increasing
path that starts at cell \`(r, c)\`." That value is 1 (just the cell
itself) plus the best \`dp\` value among its neighbors that hold a
larger number — or just 1 if no neighbor is larger.

This is naturally a depth-first search from each cell, but the same
cell gets visited over and over as the starting point of many different
searches. Since strictly-increasing paths can't loop back on
themselves, \`dp[r][c]\` never depends on itself, so it's safe to cache
each cell's answer the first time it's computed and reuse it instantly
every other time it's needed — turning an exponential search into one
pass over every cell.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — DFS Without Memoization",
        explanation: "From every cell, depth-first search outward through strictly larger neighbors, tracking the longest chain found. Correct, but the same cell can be re-explored from scratch many, many times as part of different searches.",
        code: `function longestIncreasingPath(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function dfs(r, c) {
    let best = 1;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && matrix[nr][nc] > matrix[r][c]) {
        best = Math.max(best, 1 + dfs(nr, nc));
      }
    }
    return best;
  }

  let answer = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      answer = Math.max(answer, dfs(r, c));
    }
  }
  return answer;
}`,
        timeComplexity: "Exponential in the worst case — the same cells get re-explored repeatedly",
        spaceComplexity: "O(rows * cols) — worst-case recursion depth",
      },
      {
        approach: "Optimal — DFS with a 2D Memo Table",
        explanation: "Same depth-first search, but cache each cell's answer in a table the first time it's computed. Every later request for that cell returns instantly instead of re-searching.",
        code: `function longestIncreasingPath(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const cache = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function dfs(r, c) {
    if (cache[r][c] !== 0) return cache[r][c];

    let best = 1;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && matrix[nr][nc] > matrix[r][c]) {
        best = Math.max(best, 1 + dfs(nr, nc));
      }
    }

    cache[r][c] = best;
    return best;
  }

  let answer = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      answer = Math.max(answer, dfs(r, c));
    }
  }
  return answer;
}`,
        timeComplexity: "O(rows * cols)",
        spaceComplexity: "O(rows * cols) — for the cache and the recursion stack",
        walkthrough: [
          { code: "if (cache[r][c] !== 0) return cache[r][c];", explanation: "Every cell's longest path has length at least 1, so 0 safely means 'not computed yet' — this line makes repeated lookups for the same cell instant." },
          { code: "if (... && matrix[nr][nc] > matrix[r][c]) { best = Math.max(best, 1 + dfs(nr, nc)); }", explanation: "Only neighbors with a strictly greater value can extend the path, which is exactly what guarantees this recursion can never cycle back on itself." },
          { code: "cache[r][c] = best;", explanation: "Once (r, c)'s answer is known, it's stored — it will never need to be recomputed by any other starting cell's search that passes through it." },
        ],
      },
    ],
    relatedProblems: ["unique-paths"],
    keywords: ["dynamic programming", "matrix", "DFS", "memoization", "2D DP"],
  },

  {
    id: "distinct-subsequences",
    title: "Distinct Subsequences",
    difficulty: "Hard",
    category: "dp-2d",
    description: `
You're given two strings, \`s\` and \`t\`. Count how many distinct ways
you can pick out a subsequence of \`s\` (deleting some characters,
keeping the rest in order) so that it spells out \`t\` exactly.

Two ways are different if they delete different characters from
\`s\`, even if the leftover letters look the same.
    `.trim(),
    examples: [
      { input: 's = "rabbbit", t = "rabbit"', output: "3", explanation: "There are 3 ways to delete two of the three b's from s to spell out rabbit." },
      { input: 's = "babgbag", t = "bag"', output: "5" },
    ],
    constraints: ["1 <= s.length, t.length <= 1000", "Both strings contain only English letters"],
    hints: [
      "Think of matching t against s from the front. At each point, ask: how many ways are there to match the first j characters of t using only the first i characters of s?",
      "For each character of s, you can either skip it entirely, or — if it matches the character of t you currently need — use it to satisfy that match.",
      "Matching an empty t is always possible in exactly one way, no matter how much of s you have left: delete everything.",
    ],
    approachOverview: `
Build a table where cell \`(i, j)\` means: "using only the first \`i\`
characters of \`s\`, how many distinct ways are there to spell out the
first \`j\` characters of \`t\`?"

The \`i\`-th character of \`s\` can always be skipped (deleted), which
alone contributes as many ways as \`(i-1, j)\` already found. On top of
that, if the \`i\`-th character of \`s\` happens to equal the \`j\`-th
character of \`t\`, it can *also* be used to match that character,
contributing however many ways \`(i-1, j-1)\` found. Add both
possibilities together — they're two genuinely different sets of
deletions, so they don't overlap.

The base case: matching an empty \`t\` (column 0) is always possible in
exactly one way for any prefix of \`s\` — delete everything.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "Walk s and t from the front together. At each step, always try skipping the current character of s; additionally, if it matches the current character of t, try consuming both. Sum the ways found down each branch.",
        code: `function numDistinct(s, t) {
  function solve(i, j) {
    if (j === t.length) return 1;
    if (i === s.length) return 0;

    let ways = solve(i + 1, j); // skip s[i]
    if (s[i] === t[j]) {
      ways += solve(i + 1, j + 1); // use s[i] to match t[j]
    }
    return ways;
  }

  return solve(0, 0);
}`,
        timeComplexity: "O(2^m), where m is the length of s",
        spaceComplexity: "O(m) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up 2D Table",
        explanation: "Build a table over (prefix length of s, prefix length of t), seeding column 0 with 1 (an empty t is always matched exactly one way), then filling every other cell as 'skip' plus, when characters match, 'use.'",
        code: `function numDistinct(s, t) {
  const m = s.length;
  const n = t.length;
  const table = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    table[i][0] = 1; // empty t is always formed exactly one way: delete everything
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      table[i][j] = table[i - 1][j]; // skip s[i - 1]
      if (s[i - 1] === t[j - 1]) {
        table[i][j] += table[i - 1][j - 1]; // also use s[i - 1] to match t[j - 1]
      }
    }
  }

  return table[m][n];
}`,
        timeComplexity: "O(m * n)",
        spaceComplexity: "O(m * n)",
        walkthrough: [
          { code: "table[i][0] = 1;", explanation: "No matter how much of s you have available, there's exactly one way to match an empty t: delete every character." },
          { code: "table[i][j] = table[i - 1][j];", explanation: "This counts every way that simply doesn't use s's i-th character at all." },
          { code: "table[i][j] += table[i - 1][j - 1];", explanation: "Added only when s[i-1] equals t[j-1] — this counts ways that use s's i-th character to satisfy t's j-th character." },
        ],
      },
    ],
    relatedProblems: ["longest-common-subsequence", "edit-distance"],
    keywords: ["dynamic programming", "strings", "counting", "subsequence", "2D DP"],
  },

  {
    id: "edit-distance",
    title: "Edit Distance",
    difficulty: "Hard",
    category: "dp-2d",
    description: `
You're given two words. Find the minimum number of single-character
edits needed to turn the first word into the second one. The allowed
edits are: insert a character, delete a character, or replace one
character with another.
    `.trim(),
    examples: [
      { input: 'word1 = "horse", word2 = "ros"', output: "3", explanation: "horse -> rorse (replace 'h' with 'r') -> rose (delete 'r') -> ros (delete 'e')." },
      { input: 'word1 = "intention", word2 = "execution"', output: "5" },
    ],
    constraints: ["0 <= word1.length, word2.length <= 500", "Both words contain only lowercase English letters"],
    hints: [
      "Think of the table cell (i, j) as: the minimum edits to turn the first i characters of word1 into the first j characters of word2.",
      "If the current characters already match, no edit is needed at this position at all — the answer is whatever the answer was one character back in both words.",
      "If they don't match, try all three edits and take the cheapest: insert (borrow the answer for one fewer character of word2), delete (borrow the answer for one fewer character of word1), or replace (borrow the answer for one fewer character of both).",
    ],
    approachOverview: `
Build a table where cell \`(i, j)\` means: "the minimum number of edits
to turn the first \`i\` characters of \`word1\` into the first \`j\`
characters of \`word2\`."

If those two characters already match, this position costs nothing —
the answer is exactly the answer for one character back in both words,
\`(i-1, j-1)\`. If they don't match, one edit must happen here, and it's
worth 1 plus the cheapest of the three options: delete word1's
character (\`(i-1, j)\`), insert a character to match word2's
(\`(i, j-1)\`), or replace word1's character with word2's
(\`(i-1, j-1)\`).

The base cases handle turning a string into an empty one (or vice
versa): turning the first \`i\` characters of \`word1\` into nothing
takes \`i\` deletions, and turning nothing into the first \`j\`
characters of \`word2\` takes \`j\` insertions.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "Walk both words from the front. If the current characters match, move both forward for free. Otherwise, try all three edit types and recurse, taking whichever leads to fewer total edits.",
        code: `function minDistance(word1, word2) {
  function solve(i, j) {
    if (i === word1.length) return word2.length - j;
    if (j === word2.length) return word1.length - i;
    if (word1[i] === word2[j]) return solve(i + 1, j + 1);

    const insert = 1 + solve(i, j + 1);
    const remove = 1 + solve(i + 1, j);
    const replace = 1 + solve(i + 1, j + 1);
    return Math.min(insert, remove, replace);
  }

  return solve(0, 0);
}`,
        timeComplexity: "O(3^(m + n)) in the worst case",
        spaceComplexity: "O(m + n) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up 2D Table",
        explanation: "Build a table over (prefix length of word1, prefix length of word2). Seed row 0 and column 0 with the all-insert / all-delete base cases, then fill the rest using the match/no-match rule.",
        code: `function minDistance(word1, word2) {
  const m = word1.length;
  const n = word2.length;
  const table = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) table[i][0] = i; // delete all i characters of word1
  for (let j = 0; j <= n; j++) table[0][j] = j; // insert all j characters of word2

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        table[i][j] = table[i - 1][j - 1];
      } else {
        table[i][j] = 1 + Math.min(
          table[i - 1][j],     // delete
          table[i][j - 1],     // insert
          table[i - 1][j - 1]  // replace
        );
      }
    }
  }

  return table[m][n];
}`,
        timeComplexity: "O(m * n)",
        spaceComplexity: "O(m * n)",
        walkthrough: [
          { code: "for (let i = 0; i <= m; i++) table[i][0] = i;", explanation: "Turning any prefix of word1 into an empty string takes exactly one deletion per character." },
          { code: "if (word1[i - 1] === word2[j - 1]) { table[i][j] = table[i - 1][j - 1]; }", explanation: "A matching character costs nothing — you inherit the answer from one character back in both words." },
          { code: "table[i][j] = 1 + Math.min(table[i - 1][j], table[i][j - 1], table[i - 1][j - 1]);", explanation: "A mismatch always costs exactly one edit here; the three options correspond to delete, insert, and replace respectively." },
        ],
      },
    ],
    relatedProblems: ["longest-common-subsequence", "distinct-subsequences"],
    keywords: ["dynamic programming", "strings", "edit distance", "levenshtein", "2D DP"],
  },

  {
    id: "burst-balloons",
    title: "Burst Balloons",
    difficulty: "Hard",
    category: "dp-2d",
    description: `
You have a row of balloons, each with a number painted on it. Bursting
a balloon earns you coins equal to the product of the numbers on its
current left neighbor, itself, and its current right neighbor — "current"
meaning at the moment you burst it, after any other balloons around it
have already been burst and removed. If a burst balloon has no neighbor
on one side (because it's at the edge of the row, or its neighbor is
already gone), treat that missing side as a \`1\`.

Burst every balloon, in whatever order you choose, to maximize the
total coins collected.
    `.trim(),
    examples: [
      { input: "nums = [3,1,5,8]", output: "167", explanation: "Bursting in the order 1, 5, 3, 8 earns 3*1*5 + 3*5*8 + 1*3*8 + 1*8*1 = 15 + 120 + 24 + 8 = 167." },
      { input: "nums = [1,5]", output: "10", explanation: "Burst either balloon first: 1*1*5 + 1*5*1, or 1*5*1 + 1*1*1 — the best ordering gives 10." },
    ],
    constraints: ["1 <= nums.length <= 300", "0 <= nums[i] <= 100"],
    hints: [
      "Trying to decide which balloon to burst first is a trap — after it's gone, the neighbors of every other balloon can change, so the subproblem you're left with doesn't shrink cleanly.",
      "Instead, for any range of balloons, think about which one is burst LAST within that range. When it's the last one left in the range, its neighbors at that moment are exactly the balloons just outside the range's two ends — which never change.",
      "That reframing lets you define the table over ranges: dp[left][right] = the most coins obtainable from bursting everything strictly between two fixed boundary balloons.",
    ],
    approachOverview: `
Thinking about which balloon to burst *first* is awkward, because
bursting it changes who's adjacent to everything else. Instead, think
about which balloon in a range is burst *last*.

Pad the row with a \`1\` balloon at each end (so every real balloon
always has a neighbor to multiply against). Define \`dp[left][right]\`
as the most coins obtainable from bursting every balloon strictly
between positions \`left\` and \`right\` (both of which stay un-burst,
acting as fixed boundary markers).

If balloon \`k\` (somewhere strictly between \`left\` and \`right\`) is
the last one burst in that range, then at the moment it bursts,
everything else in the range is already gone — so its neighbors are
exactly \`left\` and \`right\` themselves. That gives:
\`nums[left] * nums[k] * nums[right] + dp[left][k] + dp[k][right]\`,
where the two \`dp\` terms cover bursting everything on either side of
\`k\` (which happened before \`k\`, in some order that doesn't matter).
Try every possible \`k\` and keep the best.

Fill the table by increasing range width, since wider ranges depend on
narrower ones. The final answer is \`dp[0][n+1]\` across the padded
array (or equivalently, the range spanning every real balloon).
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion Over Bursting Order",
        explanation: "Directly simulate the problem: at each step, try bursting each remaining balloon next (using its actual current neighbors), remove it, and recurse on what's left. This explores every possible bursting order.",
        code: `function maxCoins(nums) {
  function solve(balloons) {
    if (balloons.length === 0) return 0;

    let best = 0;
    for (let i = 0; i < balloons.length; i++) {
      const left = i > 0 ? balloons[i - 1] : 1;
      const right = i < balloons.length - 1 ? balloons[i + 1] : 1;
      const gained = left * balloons[i] * right;

      const remaining = balloons.slice(0, i).concat(balloons.slice(i + 1));
      best = Math.max(best, gained + solve(remaining));
    }
    return best;
  }

  return solve(nums);
}`,
        timeComplexity: "O(n!) in the worst case — every possible bursting order is tried",
        spaceComplexity: "O(n^2) — each recursive call copies a shorter array",
      },
      {
        approach: "Optimal — Interval DP: Which Balloon Bursts Last?",
        explanation: "Pad the array with 1s at both ends, then build a table over (left boundary, right boundary) by increasing range width, trying every choice of 'last balloon burst' within each range.",
        code: `function maxCoins(nums) {
  const balloons = [1, ...nums, 1];
  const n = balloons.length;
  const table = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let length = 2; length < n; length++) {
    for (let left = 0; left + length < n; left++) {
      const right = left + length;
      for (let k = left + 1; k < right; k++) {
        const coins = balloons[left] * balloons[k] * balloons[right] + table[left][k] + table[k][right];
        table[left][right] = Math.max(table[left][right], coins);
      }
    }
  }

  return table[0][n - 1];
}`,
        timeComplexity: "O(n^3)",
        spaceComplexity: "O(n^2)",
        walkthrough: [
          { code: "const balloons = [1, ...nums, 1];", explanation: "Padding both ends with 1 means every real balloon always has a well-defined neighbor to multiply against, including at the true edges of the row." },
          { code: "for (let length = 2; length < n; length++) {", explanation: "Ranges are processed from narrowest to widest, since dp[left][right] is only built from strictly narrower ranges nested inside it." },
          { code: "const coins = balloons[left] * balloons[k] * balloons[right] + table[left][k] + table[k][right];", explanation: "If k is the last balloon burst between left and right, its neighbors at that moment are exactly left and right — everything else in between is already gone." },
        ],
      },
    ],
    keywords: ["dynamic programming", "interval DP", "balloons", "2D DP"],
  },

  {
    id: "regular-expression-matching",
    title: "Regular Expression Matching",
    difficulty: "Hard",
    category: "dp-2d",
    description: `
Implement a simplified pattern matcher. You're given a string \`s\` and
a pattern \`p\` that may contain two special symbols:

- \`.\` matches any single character.
- \`*\` matches zero or more occurrences of whatever character came right before it in the pattern.

Determine whether the pattern matches the **entire** string \`s\` (not
just part of it).
    `.trim(),
    examples: [
      { input: 's = "aa", p = "a"', output: "false", explanation: "The pattern only accounts for one character, but s has two." },
      { input: 's = "aa", p = "a*"', output: "true", explanation: "'a*' means zero or more a's, which covers \"aa\"." },
      { input: 's = "ab", p = ".*"', output: "true", explanation: "'.' matches any character, and '*' lets it repeat as many times as needed." },
      { input: 's = "aab", p = "c*a*b"', output: "true", explanation: "'c*' matches zero c's, 'a*' matches both a's, and 'b' matches the final letter." },
    ],
    constraints: ["1 <= s.length <= 20", "1 <= p.length <= 20", "p is a valid pattern, and every '*' has a character (or '.') immediately before it"],
    hints: [
      "Build a table over (how much of s consumed, how much of p consumed). Whenever the next pattern token isn't followed by a '*', it must match the next character of s exactly (or be a '.').",
      "Whenever the next pattern token IS followed by a '*', you have two independent options: treat that whole 'x*' as matching zero characters (skip it), or, if the current character of s matches x, consume one character of s and stay on the same 'x*' in case more repeats are needed.",
      "Patterns like 'a*b*c*' can match an empty string, so don't forget to fill in row 0 (empty s) using the zero-occurrence rule before filling the rest of the table.",
    ],
    approachOverview: `
Build a table where cell \`(i, j)\` means: "does the first \`i\`
characters of \`s\` match the first \`j\` tokens of \`p\`?"

Look at the \`j\`-th pattern token. If it's *not* followed by a \`*\`,
it must match the current character of \`s\` directly (matching if it's
a \`.\`, or the exact same letter) — so \`(i, j)\` is true only if
\`(i-1, j-1)\` was true **and** that character matches.

If it *is* followed by a \`*\` (so the pattern token is really "x*" for
some \`x\`), there are two independent ways to satisfy it: use zero
occurrences of \`x\` (skip both pattern characters, giving \`(i, j-2)\`),
or, if \`x\` matches the current character of \`s\`, use one more
occurrence of \`x\` and stay on this same "x*" for the rest of \`s\`
(giving \`(i-1, j)\`). Either possibility makes the cell true.

An empty pattern only matches an empty string, and patterns full of
"x*" tokens can match an empty string too — so row 0 needs its own
zero-occurrence pass before the rest of the table is filled in.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "Walk s and p from the front. If the next pattern token is followed by a '*', branch into 'skip it entirely' versus 'consume one matching character and stay on it.' Otherwise, require a direct character match and advance both.",
        code: `function isMatch(s, p) {
  function solve(i, j) {
    if (j === p.length) return i === s.length;

    const firstMatch = i < s.length && (p[j] === '.' || p[j] === s[i]);

    if (j + 1 < p.length && p[j + 1] === '*') {
      return solve(i, j + 2) || (firstMatch && solve(i + 1, j));
    }

    return firstMatch && solve(i + 1, j + 1);
  }

  return solve(0, 0);
}`,
        timeComplexity: "O(2^(m + n)) in the worst case",
        spaceComplexity: "O(m + n) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up 2D Table",
        explanation: "Build a boolean table over (prefix length of s, prefix length of p). Handle row 0's zero-occurrence patterns first, then fill the rest using the direct-match rule or the star rule.",
        code: `function isMatch(s, p) {
  const m = s.length;
  const n = p.length;
  const table = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  table[0][0] = true;

  // patterns like a*, a*b*, a*b*c* can match an empty string
  for (let j = 1; j <= n; j++) {
    if (p[j - 1] === '*' && j >= 2) {
      table[0][j] = table[0][j - 2];
    }
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j - 1] === '*') {
        table[i][j] = table[i][j - 2]; // zero occurrences of the element before '*'

        const prev = p[j - 2];
        if (prev === '.' || prev === s[i - 1]) {
          table[i][j] = table[i][j] || table[i - 1][j]; // one more occurrence, stay on this "x*"
        }
      } else if (p[j - 1] === '.' || p[j - 1] === s[i - 1]) {
        table[i][j] = table[i - 1][j - 1];
      }
    }
  }

  return table[m][n];
}`,
        timeComplexity: "O(m * n)",
        spaceComplexity: "O(m * n)",
        walkthrough: [
          { code: "if (p[j - 1] === '*' && j >= 2) { table[0][j] = table[0][j - 2]; }", explanation: "An empty s can only match a pattern made entirely of zero-occurrence 'x*' tokens, so this fills in row 0 before the main loop needs it." },
          { code: "table[i][j] = table[i][j - 2];", explanation: "This is the 'use zero occurrences of the element before the star' option — it simply drops that whole 'x*' pair from the pattern." },
          { code: "table[i][j] = table[i][j] || table[i - 1][j];", explanation: "This is the 'use one more occurrence' option — only valid when the element before the star matches the current character of s — and it deliberately stays on column j since 'x*' can repeat." },
        ],
      },
    ],
    relatedProblems: ["interleaving-string"],
    keywords: ["dynamic programming", "strings", "regex", "pattern matching", "2D DP"],
  },
];
