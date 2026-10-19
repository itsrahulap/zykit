import type { Problem } from "../../types/problem";

export const dp2dProblems: Problem[] = [
  {
    id: "unique-paths",
    title: "Unique Paths",
    difficulty: "Medium",
    category: "dp-2d",
    description: `
A robot starts at the top-left corner of an \`m x n\` grid and moves only
right or down, one cell at a time. Count the distinct paths to the
bottom-right corner.
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
The robot can only reach a cell from the cell above or the cell to the
left. So the ways to reach a cell are the sum of the ways to reach those
two.

Build a table of "ways to reach this cell", starting at the top-left (1
way: don't move) and filling rows left to right, top to bottom, using only
values already computed.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "From any cell, recursively add the paths from moving right and from moving down. Correct, but recomputes the same cells many times.",
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
        explanation: "Build a grid of ways to reach each cell. The first row and column are 1 (one way to reach each), and every other cell is the sum of the cell above and the cell to the left.",
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
          { code: "const table = Array.from({ length: m }, () => new Array(n).fill(1));", explanation: "Starts every cell at 1, already correct for the first row and column." },
          { code: "table[row][col] = table[row - 1][col] + table[row][col - 1];", explanation: "Every other cell is the sum of the cell above and the cell to the left." },
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
Given two strings, find the length of their longest **common
subsequence** — the longest sequence of characters that appears in both
in the same order, though not necessarily next to each other.

For example, \`"ace"\` is a subsequence of \`"abcde"\`: delete \`"b"\` and
\`"d"\` and \`"ace"\` is left, in order.
    `.trim(),
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: "3", explanation: '"ace" is the longest string that is a subsequence of both.' },
      { input: 'text1 = "abc", text2 = "abc"', output: "3" },
      { input: 'text1 = "abc", text2 = "def"', output: "0", explanation: "The two strings share no characters at all." },
    ],
    constraints: ["1 <= text1.length, text2.length <= 1000", "Both strings contain only lowercase English letters"],
    hints: [
      "Compare the strings one pair of characters at a time from the front (or build a table from the back).",
      "If the current characters match, use them — the rest of the answer comes from what's left after both.",
      "If they don't match, skip the current character of one string or the other — take whichever gives more.",
    ],
    approachOverview: `
Build a table where cell \`(i, j)\` is the longest common subsequence of
the first \`i\` characters of \`text1\` and the first \`j\` characters of
\`text2\`.

- If the \`i\`-th character of \`text1\` equals the \`j\`-th of \`text2\`, it can safely be used, so \`(i, j)\` is 1 plus \`(i-1, j-1)\`.
- Otherwise, take the better of dropping the last character of \`text1\` (\`(i-1, j)\`) or of \`text2\` (\`(i, j-1)\`).

An empty prefix shares nothing, so the first row and column are all 0 —
the base case.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "Walk both strings from the front. On a match, take the character and advance both. Otherwise, try skipping a character from either string and keep the better result. This revisits the same (i, j) pairs many times.",
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
        explanation: "Build a table indexed by (prefix length of text1, prefix length of text2). Row and column 0 are 0, since an empty prefix shares nothing. Fill the rest left to right, top to bottom: on a match, add one to the diagonal; otherwise take the better of the cell above or to the left.",
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
          { code: "const table = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));", explanation: "table[i][j] is the LCS length of the first i characters of text1 and the first j of text2. The extra row and column are empty prefixes." },
          { code: "if (text1[i - 1] === text2[j - 1]) { table[i][j] = table[i - 1][j - 1] + 1; }", explanation: "text1[i-1] and text2[j-1] are the i-th and j-th characters (1-indexed table, 0-indexed strings). A match extends the answer from one character earlier in both." },
          { code: "table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);", explanation: "No match, so skip one character from either string — whichever leaves the longer subsequence." },
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
Given a stock's price on each of \`n\` days, find the maximum total profit.
You can buy and sell as many times as you like, but:

- You can hold only one share at a time (sell before buying again).
- After selling, you must wait a full day before buying again — a **cooldown**.
    `.trim(),
    examples: [
      { input: "prices = [1,2,3,0,2]", output: "3", explanation: "Buy at 1, sell at 2 (profit 1), cooldown, buy at 0, sell at 2 (profit 2). Total: 3." },
      { input: "prices = [1]", output: "0", explanation: "There's no second day to sell on, so the best move is to do nothing." },
    ],
    constraints: ["1 <= prices.length <= 5000", "0 <= prices[i] <= 1000"],
    hints: [
      "Each day you're in one of three states: holding a share, just sold (so the next day is a forced cooldown), or free to buy.",
      "Index the table by (day, state), and work out how each state is reached from the previous day's states.",
    ],
    approachOverview: `
Instead of one "best profit so far", track three per day: the best profit
if you're **holding** a share, if you **just sold** today, and if you're
**resting** (free to buy, not in cooldown).

Each day's values depend only on the previous day's:
- **holding**: the same as yesterday (do nothing), or buy today using yesterday's resting profit.
- **just sold**: yesterday's holding profit plus today's price.
- **resting**: the better of resting yesterday or just sold yesterday (the cooldown has passed).

The answer is the better of "just sold" and "resting" on the last day —
you never want to end holding a share.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "Each day, recursively try both choices for the current state (holding or not): do nothing, or buy/sell. Selling jumps two days ahead for the cooldown. Correct, but re-explores the same (day, state) pairs again and again.",
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
        explanation: "Build a table with one row per day and three columns — holding, just sold, resting. Each row is computed only from the previous one.",
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
          { code: "table[day][HOLD] = Math.max(table[day - 1][HOLD], table[day - 1][REST] - prices[day]);", explanation: "You're holding today if you already held (and did nothing), or rested yesterday and bought today." },
          { code: "table[day][SOLD] = table[day - 1][HOLD] + prices[day];", explanation: "To have just sold today, you held yesterday and sold at today's price." },
          { code: "table[day][REST] = Math.max(table[day - 1][REST], table[day - 1][SOLD]);", explanation: "You're free to buy today if you were free yesterday, or your cooldown from yesterday's sale has ended." },
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
Given coin denominations and a target \`amount\`, with unlimited coins of
each kind, count the **distinct combinations** that add up to exactly
\`amount\`.

Order doesn't matter — 2 then 3 is the same combination as 3 then 2.
    `.trim(),
    examples: [
      { input: "amount = 5, coins = [1,2,5]", output: "4", explanation: "5=5; 2+2+1; 2+1+1+1; 1+1+1+1+1." },
      { input: "amount = 3, coins = [2]", output: "0", explanation: "No combination of 2s can ever total an odd number like 3." },
      { input: "amount = 10, coins = [10]", output: "1" },
    ],
    constraints: ["1 <= coins.length <= 300", "1 <= coins[i] <= 5000", "All coin values are distinct", "0 <= amount <= 5000"],
    hints: [
      "Order doesn't matter, so process one coin type at a time — this avoids counting the same combination twice in different orders.",
      "For each coin type, use none of it or at least one — and 'at least one' can reuse that coin type again.",
    ],
    approachOverview: `
Since order doesn't matter, use **coin types** as one dimension of the
table and the **amount** as the other. Cell \`(i, a)\` is the number of
combinations that make amount \`a\` using only the first \`i\` coin types.

Each cell adds two separate cases:

- Don't use the \`i\`-th coin type: the count from one fewer coin type.
- Use at least one: subtract the coin's value. Coins are reusable, so look at the *same* row at the smaller amount.

Looping over coin types on the outside (not amounts) ensures each
combination is counted once — in the order its coin types appear in the
list.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "For each coin type, recursively branch on 'skip this coin type' versus 'use one more of it' (staying on the same type, since coins repeat). A remaining amount of exactly 0 is one valid combination.",
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
        explanation: "Build a table with one row per coin type (plus a row for 'no coins yet') and one column per amount from 0 to the target. Each cell adds the 'skip this coin' and 'use this coin' counts.",
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
          { code: "table[i][0] = 1;", explanation: "There's always exactly one way to make 0: use no coins." },
          { code: "table[i][a] = table[i - 1][a];", explanation: "Carries forward the combinations that don't use the i-th coin type." },
          { code: "table[i][a] += table[i][a - coins[i - 1]];", explanation: "Adds combinations using at least one i-th coin. Reading table[i] (not table[i-1]) lets the same coin type be reused." },
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
Given a list of non-negative integers and a target, put a \`+\` or \`-\`
sign in front of every number and add them up. Count the sign assignments
whose total equals the target.
    `.trim(),
    examples: [
      { input: "nums = [1,1,1,1,1], target = 3", output: "5", explanation: "The five sign assignments that total 3 are: -1+1+1+1+1, +1-1+1+1+1, +1+1-1+1+1, +1+1+1-1+1, +1+1+1+1-1." },
      { input: "nums = [1], target = 1", output: "1", explanation: "Only +1 works." },
    ],
    constraints: ["1 <= nums.length <= 20", "0 <= nums[i] <= 1000", "0 <= sum(nums) <= 1000", "-1000 <= target <= 1000"],
    hints: [
      "Split the numbers into a + group and a - group. What does the target tell you about the + group's sum?",
      "If P is the + group's sum and the total is fixed, then P - (total - P) must equal the target — which fixes P.",
      "Now count the subsets of nums that sum to exactly P: a table indexed by (numbers considered, subset sum).",
    ],
    approachOverview: `
Assigning signs splits the numbers into a positive group (sum \`P\`) and a
negative group (sum \`total - P\`, where \`total\` is the sum of all
numbers). The result must equal the target, so \`P - (total - P) = target\`,
which gives \`P = (total + target) / 2\`.

Now it's plain subset counting: how many subsets of \`nums\` sum to \`P\`?
Cell \`(i, s)\` is the number of subsets of the first \`i\` numbers that sum
to \`s\`. Each number is either left out (the count with one fewer number)
or included (the count for the remaining sum with one fewer number, since
each number is used at most once).

If \`(total + target)\` is odd, or the target's absolute value exceeds the
total, no split works, so the answer is 0.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "Recursively try + and - for every number, and count the assignments that hit the target.",
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
        explanation: "Turn sign assignment into counting subsets that sum to P, then fill a standard subset-sum count table indexed by (numbers considered, running sum).",
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
          { code: "const subsetSum = (total + target) / 2;", explanation: "The sum the positive group must reach for the signed total to equal the target." },
          { code: "table[0][0] = 1;", explanation: "With no numbers, exactly one subset (the empty one) sums to 0." },
          { code: "table[i][s] += table[i - 1][s - nums[i - 1]];", explanation: "Counts subsets that include nums[i-1] — reading table[i-1], not table[i], because each number is used once (unlike Coin Change II's reusable coins)." },
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
Given three strings \`s1\`, \`s2\` and \`s3\`, decide whether \`s3\` can be
formed by interleaving \`s1\` and \`s2\`, keeping each string's characters
in their original order.

It's like riffle-shuffling two decks of cards: each deck keeps its own
order, but the two decks get mixed together.
    `.trim(),
    examples: [
      { input: 's1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"', output: "true" },
      { input: 's1 = "aabcc", s2 = "dbbca", s3 = "aadbbbaccc"', output: "false" },
      { input: 's1 = "", s2 = "", s3 = ""', output: "true" },
    ],
    constraints: ["0 <= s1.length, s2.length <= 100", "0 <= s3.length <= 200", "All three strings contain only lowercase English letters"],
    hints: [
      "If s3's length isn't s1's length plus s2's length, it's impossible.",
      "Build s3 one character at a time. Each next character comes from your current spot in s1 or in s2.",
      "Cell (i, j) asks: can the first i+j characters of s3 be formed from the first i characters of s1 and the first j of s2?",
    ],
    approachOverview: `
Cell \`(i, j)\` answers: can the first \`i + j\` characters of \`s3\` be
built from the first \`i\` characters of \`s1\` and the first \`j\` of
\`s2\`? Every character of \`s3\` comes from one of the two strings, so the
position in \`s3\` is always \`i + j\` — no need to track it separately.

Cell \`(i, j)\` is true if either:

- \`(i-1, j)\` is true **and** the next character of \`s1\` matches the next one needed in \`s3\`, or
- \`(i, j-1)\` is true **and** the next character of \`s2\` matches.

The base case \`(0, 0)\` is true (empty prefixes match an empty result),
and the answer is the bottom-right corner, \`(len(s1), len(s2))\`.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "Track how far into s1 and s2 you are (their sum is your position in s3). Take the next character from s1 or s2 if it matches, and recurse. This reaches the same (i, j) pair through many paths.",
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
        explanation: "Build a boolean table over (prefix length of s1, prefix length of s2), filling it from the top-left base case using cells already computed.",
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
          { code: "const k = i + j - 1;", explanation: "Every character comes from s1 or s2, so i + j characters of s3 are placed — the one to check is s3[i + j - 1]." },
          { code: "if (i > 0 && table[i - 1][j] && s1[i - 1] === s3[k]) ok = true;", explanation: "If the state one character back in s1 was reachable and s1's next character matches, this cell is reachable." },
          { code: "if (!ok && j > 0 && table[i][j - 1] && s2[j - 1] === s3[k]) ok = true;", explanation: "The same, taking the next character from s2." },
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
Given a grid of integers, you can move from a cell to an adjacent one (up,
down, left or right — no diagonals) if its value is strictly greater.
Find the length, in cells, of the longest strictly increasing path,
starting anywhere.
    `.trim(),
    examples: [
      { input: "matrix = [[9,9,4],[6,6,8],[2,1,1]]", output: "4", explanation: "The path 1 -> 2 -> 6 -> 9 (bottom row up to top-left) has length 4, and nothing longer exists." },
      { input: "matrix = [[3,4,5],[3,2,6],[2,2,1]]", output: "4", explanation: "The path 3 -> 4 -> 5 -> 6 has length 4." },
    ],
    constraints: ["1 <= rows, cols <= 200", "0 <= matrix[i][j] <= 2^31 - 1"],
    hints: [
      "The path is strictly increasing, so it can never revisit a cell — no 'visited' set needed.",
      "For each cell, define 'the longest increasing path starting here.' How does it relate to the same value at its larger neighbors?",
      "A cell's answer depends only on its larger neighbors, so once computed, cache it and never recompute it.",
    ],
    approachOverview: `
Let \`dp[r][c]\` be the length of the longest strictly increasing path
starting at \`(r, c)\`. It's 1 (the cell itself) plus the best \`dp\` among
neighbors with a larger number — or just 1 if none is larger.

This is a depth-first search from each cell, but the same cells get
visited by many searches. Increasing paths can't loop, so \`dp[r][c]\`
never depends on itself. That makes it safe to cache each answer the
first time and reuse it — turning an exponential search into one pass
over every cell.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — DFS Without Memoization",
        explanation: "From every cell, depth-first search through strictly larger neighbors, tracking the longest chain. Correct, but the same cell is re-explored from scratch by many searches.",
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
        explanation: "The same depth-first search, but cache each cell's answer the first time. Later requests return instantly instead of re-searching.",
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
          { code: "if (cache[r][c] !== 0) return cache[r][c];", explanation: "Every path has length at least 1, so 0 safely means 'not computed yet' — repeated lookups are instant." },
          { code: "if (... && matrix[nr][nc] > matrix[r][c]) { best = Math.max(best, 1 + dfs(nr, nc)); }", explanation: "Only strictly greater neighbors extend the path, which guarantees the recursion never cycles." },
          { code: "cache[r][c] = best;", explanation: "Stores (r, c)'s answer so no other search through it recomputes it." },
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
Given strings \`s\` and \`t\`, count the distinct subsequences of \`s\`
(delete some characters, keep the rest in order) that spell \`t\` exactly.

Two ways differ if they delete different characters from \`s\`, even if
the remaining letters look the same.
    `.trim(),
    examples: [
      { input: 's = "rabbbit", t = "rabbit"', output: "3", explanation: "There are 3 ways to delete two of the three b's from s to spell out rabbit." },
      { input: 's = "babgbag", t = "bag"', output: "5" },
    ],
    constraints: ["1 <= s.length, t.length <= 1000", "Both strings contain only English letters"],
    hints: [
      "Match t against s from the front. Ask: how many ways can the first i characters of s match the first j characters of t?",
      "Each character of s can be skipped, or — if it matches the character of t you need — used for that match.",
      "An empty t always matches in exactly one way, however much of s is left: delete everything.",
    ],
    approachOverview: `
Cell \`(i, j)\` is the number of ways the first \`i\` characters of \`s\`
can spell the first \`j\` characters of \`t\`.

The \`i\`-th character of \`s\` can always be skipped, giving the ways in
\`(i-1, j)\`. If it also equals the \`j\`-th character of \`t\`, it can be
used to match it, adding the ways in \`(i-1, j-1)\`. The two sets of
deletions are different, so they don't overlap — just add them.

Base case: an empty \`t\` (column 0) matches any prefix of \`s\` in exactly
one way — delete everything.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "Walk s and t together from the front. Always try skipping the current character of s; if it matches the current character of t, also try using both. Sum the ways from each branch.",
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
        explanation: "Build a table over (prefix length of s, prefix length of t). Column 0 is 1 (an empty t matches one way); every other cell is 'skip' plus, when characters match, 'use.'",
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
          { code: "table[i][0] = 1;", explanation: "However much of s is available, there's one way to match an empty t: delete every character." },
          { code: "table[i][j] = table[i - 1][j];", explanation: "Counts the ways that don't use s's i-th character." },
          { code: "table[i][j] += table[i - 1][j - 1];", explanation: "Only when s[i-1] equals t[j-1]: counts ways that use s's i-th character for t's j-th." },
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
Given two words, find the minimum number of single-character edits to
turn the first into the second. Allowed edits: insert, delete, or replace
a character.
    `.trim(),
    examples: [
      { input: 'word1 = "horse", word2 = "ros"', output: "3", explanation: "horse -> rorse (replace 'h' with 'r') -> rose (delete 'r') -> ros (delete 'e')." },
      { input: 'word1 = "intention", word2 = "execution"', output: "5" },
    ],
    constraints: ["0 <= word1.length, word2.length <= 500", "Both words contain only lowercase English letters"],
    hints: [
      "Let cell (i, j) be the minimum edits to turn the first i characters of word1 into the first j of word2.",
      "If the current characters match, no edit is needed — use the answer from one character back in both words.",
      "If not, take the cheapest of: insert (one fewer character of word2), delete (one fewer of word1), or replace (one fewer of both).",
    ],
    approachOverview: `
Cell \`(i, j)\` is the minimum edits to turn the first \`i\` characters of
\`word1\` into the first \`j\` characters of \`word2\`.

If the two characters match, this position is free: the answer is
\`(i-1, j-1)\`. Otherwise one edit happens here, costing 1 plus the
cheapest of:

- delete word1's character: \`(i-1, j)\`
- insert word2's character: \`(i, j-1)\`
- replace word1's character with word2's: \`(i-1, j-1)\`

Base cases: turning the first \`i\` characters of \`word1\` into nothing
takes \`i\` deletions, and turning nothing into the first \`j\` characters
of \`word2\` takes \`j\` insertions.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "Walk both words from the front. If the characters match, advance both for free. Otherwise, try all three edits and keep the one with fewer total edits.",
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
        explanation: "Build a table over (prefix length of word1, prefix length of word2). Fill row 0 and column 0 with the all-insert / all-delete base cases, then the rest with the match/no-match rule.",
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
          { code: "for (let i = 0; i <= m; i++) table[i][0] = i;", explanation: "Turning a prefix of word1 into an empty string takes one deletion per character." },
          { code: "if (word1[i - 1] === word2[j - 1]) { table[i][j] = table[i - 1][j - 1]; }", explanation: "A match costs nothing — reuse the answer from one character back in both words." },
          { code: "table[i][j] = 1 + Math.min(table[i - 1][j], table[i][j - 1], table[i - 1][j - 1]);", explanation: "A mismatch costs one edit; the three options are delete, insert and replace." },
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
You have a row of numbered balloons. Bursting one earns the product of
its number and its current left and right neighbors' numbers — "current"
meaning after any already-burst balloons are removed. A missing neighbor
(at the edge of the row) counts as \`1\`.

Burst every balloon, in any order, to maximize the total coins.
    `.trim(),
    examples: [
      { input: "nums = [3,1,5,8]", output: "167", explanation: "Bursting in the order 1, 5, 3, 8 earns 3*1*5 + 3*5*8 + 1*3*8 + 1*8*1 = 15 + 120 + 24 + 8 = 167." },
      { input: "nums = [1,5]", output: "10", explanation: "Burst either balloon first: 1*1*5 + 1*5*1, or 1*5*1 + 1*1*1 — the best ordering gives 10." },
    ],
    constraints: ["1 <= nums.length <= 300", "0 <= nums[i] <= 100"],
    hints: [
      "Choosing which balloon to burst first is a trap — afterward, other balloons' neighbors change, so the subproblem doesn't shrink cleanly.",
      "Instead, for a range of balloons, ask which one is burst LAST. At that moment its neighbors are the balloons just outside the range — which never change.",
      "That lets you define the table over ranges: dp[left][right] = the most coins from bursting everything strictly between two fixed boundary balloons.",
    ],
    approachOverview: `
Choosing which balloon to burst *first* is awkward, because it changes
everyone else's neighbors. Instead, ask which balloon in a range is
burst *last*.

Pad the row with a \`1\` balloon at each end, so every real balloon has
neighbors. Let \`dp[left][right]\` be the most coins from bursting every
balloon strictly between \`left\` and \`right\` (which stay unburst as
fixed boundaries).

If balloon \`k\` is the last burst in that range, everything else in the
range is gone by then, so its neighbors are \`left\` and \`right\`. That
gives \`nums[left] * nums[k] * nums[right] + dp[left][k] + dp[k][right]\`,
where the two \`dp\` terms cover bursting each side of \`k\` first (in any
order). Try every \`k\` and keep the best.

Fill the table by increasing range width, since wider ranges depend on
narrower ones. The answer is \`dp[0][n+1]\` over the padded array — the
range spanning every real balloon.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion Over Bursting Order",
        explanation: "Simulate directly: try bursting each remaining balloon next (with its current neighbors), remove it, and recurse on the rest. This explores every bursting order.",
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
        explanation: "Pad the array with 1s at both ends, then fill a table over (left boundary, right boundary) by increasing range width, trying every 'last balloon burst' in each range.",
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
          { code: "const balloons = [1, ...nums, 1];", explanation: "Padding with 1s gives every real balloon a neighbor to multiply by, even at the edges." },
          { code: "for (let length = 2; length < n; length++) {", explanation: "Processes ranges from narrowest to widest, since dp[left][right] is built from narrower ranges inside it." },
          { code: "const coins = balloons[left] * balloons[k] * balloons[right] + table[left][k] + table[k][right];", explanation: "If k is burst last between left and right, everything between is gone, so its neighbors are left and right." },
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
Implement a simple pattern matcher. Given a string \`s\` and a pattern
\`p\`, the pattern may contain two special symbols:

- \`.\` matches any single character.
- \`*\` matches zero or more of the character just before it in the pattern.

Decide whether the pattern matches the **entire** string \`s\`, not just
part of it.
    `.trim(),
    examples: [
      { input: 's = "aa", p = "a"', output: "false", explanation: "The pattern only accounts for one character, but s has two." },
      { input: 's = "aa", p = "a*"', output: "true", explanation: "'a*' means zero or more a's, which covers \"aa\"." },
      { input: 's = "ab", p = ".*"', output: "true", explanation: "'.' matches any character, and '*' lets it repeat as many times as needed." },
      { input: 's = "aab", p = "c*a*b"', output: "true", explanation: "'c*' matches zero c's, 'a*' matches both a's, and 'b' matches the final letter." },
    ],
    constraints: ["1 <= s.length <= 20", "1 <= p.length <= 20", "p is a valid pattern, and every '*' has a character (or '.') immediately before it"],
    hints: [
      "Build a table over (how much of s used, how much of p used). A pattern token not followed by '*' must match the next character of s exactly (or be a '.').",
      "A token followed by '*' gives two options: treat 'x*' as matching zero characters (skip it), or, if s's current character matches x, use it and stay on 'x*' for more repeats.",
      "Patterns like 'a*b*c*' can match an empty string, so fill row 0 (empty s) with the zero-occurrence rule before the rest of the table.",
    ],
    approachOverview: `
Cell \`(i, j)\` answers: do the first \`i\` characters of \`s\` match the
first \`j\` tokens of \`p\`?

If the \`j\`-th token is *not* followed by \`*\`, it must match the current
character of \`s\` directly (a \`.\` or the same letter). So \`(i, j)\` is
true only if \`(i-1, j-1)\` is true **and** the character matches.

If it *is* followed by \`*\` (the token is really "x*"), either option
makes the cell true:

- Use zero \`x\`s: skip both pattern characters, giving \`(i, j-2)\`.
- If \`x\` matches the current character of \`s\`, use one more \`x\` and stay on "x*", giving \`(i-1, j)\`.

An empty pattern matches only an empty string, but patterns made of "x*"
tokens can match an empty string too — so row 0 needs its own
zero-occurrence pass before the rest of the table.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recursion",
        explanation: "Walk s and p from the front. If the next token is followed by '*', branch into 'skip it' versus 'use one matching character and stay on it.' Otherwise, require a direct match and advance both.",
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
        explanation: "Build a boolean table over (prefix length of s, prefix length of p). Fill row 0's zero-occurrence patterns first, then the rest with the direct-match or star rule.",
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
          { code: "if (p[j - 1] === '*' && j >= 2) { table[0][j] = table[0][j - 2]; }", explanation: "An empty s only matches a pattern made of zero-occurrence 'x*' tokens, so this fills row 0 before the main loop." },
          { code: "table[i][j] = table[i][j - 2];", explanation: "The 'zero occurrences' option — drops the whole 'x*' pair from the pattern." },
          { code: "table[i][j] = table[i][j] || table[i - 1][j];", explanation: "The 'one more occurrence' option — only when the element before the star matches s's current character — staying on column j since 'x*' can repeat." },
        ],
      },
    ],
    relatedProblems: ["interleaving-string"],
    keywords: ["dynamic programming", "strings", "regex", "pattern matching", "2D DP"],
  },
];
