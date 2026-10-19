import type { Problem } from "../../types/problem";

export const dp1dProblems: Problem[] = [
  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "Easy",
    category: "dp-1d",
    description: `
You're climbing a staircase with \`n\` steps. Each move goes up 1 or 2
steps. Count the distinct ways to reach the top.
    `.trim(),
    examples: [
      { input: "n = 2", output: "2", explanation: "1 step + 1 step, or 2 steps." },
      { input: "n = 3", output: "3", explanation: "1+1+1, 1+2, or 2+1." },
    ],
    constraints: ["1 <= n <= 45"],
    hints: [
      "To reach step n, what was your very last move — 1 step or 2 steps? Where were you right before that move?",
      "The ways to reach step n equal the ways to reach step n-1 plus the ways to reach step n-2.",
    ],
    approachOverview: `
Your last move onto step n was either 1 step from n-1 or 2 steps from
n-2. So the ways to reach step n are the ways to reach n-1 plus the ways
to reach n-2, the same pattern as the Fibonacci sequence.

Plain recursion solves the same smaller subproblems again and again.
Building up from the smallest steps and reusing each result avoids that.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Plain Recursion",
        explanation: "Directly recurse: the ways to reach n is ways(n-1) + ways(n-2). Correct, but recomputes the same subproblems exponentially many times.",
        code: `function climbStairs(n) {
  if (n <= 2) return n;
  return climbStairs(n - 1) + climbStairs(n - 2);
}`,
        timeComplexity: "O(2^n)",
        spaceComplexity: "O(n) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up with Two Variables",
        explanation: "Each step only needs the previous two results, so keep just the last two values and slide them forward.",
        code: `function climbStairs(n) {
  if (n <= 2) return n;

  let prev2 = 1;
  let prev1 = 2;

  for (let i = 3; i <= n; i++) {
    const current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }

  return prev1;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let prev2 = 1; let prev1 = 2;", explanation: "Starts with the base cases: 1 way to reach step 1, 2 ways to reach step 2." },
          { code: "const current = prev1 + prev2;", explanation: "The ways to reach this step are the sum of the ways to reach the two steps before it." },
          { code: "prev2 = prev1; prev1 = current;", explanation: "Slides the window forward by one step." },
        ],
      },
    ],
    relatedProblems: ["min-cost-climbing-stairs", "house-robber"],
    keywords: ["dynamic programming", "fibonacci", "climbing stairs", "memoization"],
  },

  {
    id: "min-cost-climbing-stairs",
    title: "Min Cost Climbing Stairs",
    difficulty: "Easy",
    category: "dp-1d",
    description: `
\`cost[i]\` is the price to step *off* stair \`i\`. After paying, you move
1 or 2 steps forward. You can start on step \`0\` or step \`1\` for free.
The "top" is one step past the last stair. Find the minimum total cost
to reach the top.
    `.trim(),
    examples: [
      { input: "cost = [10, 15, 20]", output: "15", explanation: "Start on step 1 (free), pay 15 to jump 2 steps straight to the top." },
      { input: "cost = [1, 100, 1, 1, 1, 100, 1, 1, 100, 1]", output: "6", explanation: "Start on step 0, then hop over every expensive step, paying 1 six times." },
    ],
    constraints: ["2 <= cost.length <= 1000", "0 <= cost[i] <= 999"],
    hints: [
      "This has the same shape as Climbing Stairs, but you minimize a cost instead of counting paths.",
      "Let minCost(i) be the cheapest cost to reach the top from step i. From step i you pay cost[i], then jump 1 or 2 steps. Take whichever is cheaper.",
      "The answer is the cheaper of starting at step 0 or step 1, since both are free.",
    ],
    approachOverview: `
From step \`i\` you always pay \`cost[i]\`, then land on step \`i+1\` or
\`i+2\`. So the cheapest way to finish *from* step \`i\` is \`cost[i]\`
plus the cheaper of "finish from i+1" and "finish from i+2". It's the
same recursion as Climbing Stairs, but minimizing instead of counting.

Finishing from the top (or past it) costs 0, so you can build the answer
backward from the end. Or build forward by asking "what's the cheapest
way to arrive at step i?", and take the smaller of arriving at the last
two steps, since both are one hop from the top.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Plain Recursion",
        explanation: "Recurse on 'cheapest cost to finish from step i': pay cost[i], then take the cheaper of jumping 1 or 2 steps. Correct, but re-explores the same steps repeatedly.",
        code: `function minCostClimbingStairs(cost) {
  const n = cost.length;

  function finishFrom(i) {
    if (i >= n) return 0;
    return cost[i] + Math.min(finishFrom(i + 1), finishFrom(i + 2));
  }

  return Math.min(finishFrom(0), finishFrom(1));
}`,
        timeComplexity: "O(2^n)",
        spaceComplexity: "O(n) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up with Two Variables",
        explanation: "Walk forward, tracking the cheapest cost to *arrive* at each step from the previous two results. The top is one hop past the last step, so the answer is the cheaper way to arrive from the last two steps.",
        code: `function minCostClimbingStairs(cost) {
  const n = cost.length;

  // Cheapest cost to arrive at step 0 or step 1 is 0 (both are free starts).
  let prev2 = 0;
  let prev1 = 0;

  for (let i = 2; i <= n; i++) {
    const current = Math.min(
      prev1 + cost[i - 1],
      prev2 + cost[i - 2]
    );
    prev2 = prev1;
    prev1 = current;
  }

  return prev1;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let prev2 = 0; let prev1 = 0;", explanation: "Arriving at step 0 and step 1 both cost 0, since either can be a free starting point." },
          { code: "prev1 + cost[i - 1]", explanation: "Cost of arriving at step i by paying to step off of step i-1." },
          { code: "prev2 + cost[i - 2]", explanation: "Cost of arriving at step i by paying to step off of step i-2, a 2-step hop." },
          { code: "return prev1;", explanation: "After the loop reaches i = n (the top), prev1 holds the cheapest cost to get there." },
        ],
      },
    ],
    relatedProblems: ["climbing-stairs", "house-robber"],
    keywords: ["dynamic programming", "climbing stairs", "minimum cost", "tabulation"],
  },

  {
    id: "house-robber",
    title: "House Robber",
    difficulty: "Medium",
    category: "dp-1d",
    description: `
You're robbing houses along a street. \`nums\` holds the cash in each
house. Robbing two adjacent houses sets off the alarm. Find the most
money you can steal without robbing two adjacent houses.
    `.trim(),
    examples: [
      { input: "nums = [1, 2, 3, 1]", output: "4", explanation: "Rob house 0 (1) and house 2 (3): 1 + 3 = 4." },
      { input: "nums = [2, 7, 9, 3, 1]", output: "12", explanation: "Rob houses 0, 2, and 4: 2 + 9 + 1 = 12." },
    ],
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 400"],
    hints: [
      "For each house you have two choices: skip it, or rob it (and skip the one before it).",
      "Let best(i) be the most money from the first i+1 houses. best(i) = max(best(i-1), best(i-2) + nums[i]). Either skip house i (keep best(i-1)), or rob it (add nums[i] to best(i-2), since i-1 is off-limits).",
    ],
    approachOverview: `
At each house, you either rob it or don't. If you skip house \`i\`, your
best total is the best from the first \`i\` houses. If you rob it, you
collect \`nums[i]\` but can't have robbed house \`i-1\`, so add it to the
best from the first \`i-1\` houses. Take whichever gives more.

So the best total through house \`i\` is
\`max(best through i-1, best through i-2 + nums[i])\`. As in Climbing
Stairs, each step only needs the previous two results, so one sweep with
two running values is enough.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Plain Recursion",
        explanation: "At each house, recursively try 'skip it' and 'rob it' and take the better result. Correct, but solves overlapping subproblems exponentially many times.",
        code: `function rob(nums) {
  function best(i) {
    if (i < 0) return 0;
    const skip = best(i - 1);
    const take = best(i - 2) + nums[i];
    return Math.max(skip, take);
  }

  return best(nums.length - 1);
}`,
        timeComplexity: "O(2^n)",
        spaceComplexity: "O(n) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up with Two Variables",
        explanation: "Sweep left to right, tracking the best total with only the last two houses' results instead of a full array.",
        code: `function rob(nums) {
  let prev2 = 0; // best total through two houses ago
  let prev1 = 0; // best total through the previous house

  for (const money of nums) {
    const current = Math.max(prev1, prev2 + money);
    prev2 = prev1;
    prev1 = current;
  }

  return prev1;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let prev2 = 0; let prev1 = 0;", explanation: "Before any houses, the best possible total is 0." },
          { code: "const current = Math.max(prev1, prev2 + money);", explanation: "Either skip this house (keep prev1's total) or rob it (add its money to the total from two houses back)." },
          { code: "prev2 = prev1; prev1 = current;", explanation: "Slides the window forward by one house." },
        ],
      },
    ],
    relatedProblems: ["house-robber-ii", "climbing-stairs"],
    keywords: ["dynamic programming", "house robber", "non-adjacent", "tabulation"],
  },

  {
    id: "house-robber-ii",
    title: "House Robber II",
    difficulty: "Medium",
    category: "dp-1d",
    description: `
Same as House Robber (no two adjacent houses), but the houses form a
circle, so the first and last houses are neighbors too. Given the cash
in each house as \`nums\`, find the most you can steal.
    `.trim(),
    examples: [
      { input: "nums = [2, 3, 2]", output: "3", explanation: "Robbing houses 0 and 2 isn't allowed since they're adjacent in the circle, so the best is just house 1 (3)." },
      { input: "nums = [1, 2, 3, 1]", output: "4", explanation: "Rob houses 0 and 2: 1 + 3 = 4. House 3 can't join house 0 since they're now neighbors." },
      { input: "nums = [1, 2, 3]", output: "3", explanation: "All three houses touch each other in a circle of 3, so only one house can be robbed." },
    ],
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 1000"],
    hints: [
      "The circle only links the first and last house. Everywhere else, it's plain House Robber.",
      "A valid plan skips the first house or skips the last house (it can't rob both, since they're adjacent). Try both cases and take the better one.",
    ],
    approachOverview: `
The circle only matters for one pair: house 0 and the last house. Any
plan skips house 0 or skips the last house. It can never include both.

So split the circle into two straight-line problems: every house except
the last, and every house except the first. Solve each with ordinary
House Robber and take the bigger total. Handle a single house
separately, since it has no neighbors to conflict with.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Two Linear Recursions",
        explanation: "Recursively solve plain House Robber without the last house, then without the first house, and take the larger result.",
        code: `function rob(nums) {
  const n = nums.length;
  if (n === 1) return nums[0];

  function bestInRange(start, end) {
    function best(i) {
      if (i < start) return 0;
      const skip = best(i - 1);
      const take = best(i - 2) + nums[i];
      return Math.max(skip, take);
    }
    return best(end);
  }

  const excludeLast = bestInRange(0, n - 2);
  const excludeFirst = bestInRange(1, n - 1);
  return Math.max(excludeLast, excludeFirst);
}`,
        timeComplexity: "O(2^n)",
        spaceComplexity: "O(n) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up Twice",
        explanation: "Run the O(n) two-variable House Robber sweep without the last house, then without the first house, and return the larger result.",
        code: `function rob(nums) {
  const n = nums.length;
  if (n === 1) return nums[0];

  function robLine(houses) {
    let prev2 = 0;
    let prev1 = 0;
    for (const money of houses) {
      const current = Math.max(prev1, prev2 + money);
      prev2 = prev1;
      prev1 = current;
    }
    return prev1;
  }

  const excludeLast = robLine(nums.slice(0, n - 1));
  const excludeFirst = robLine(nums.slice(1));
  return Math.max(excludeLast, excludeFirst);
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) — for the two slices",
        walkthrough: [
          { code: "if (n === 1) return nums[0];", explanation: "A single house has no neighbor, so take it. Otherwise both slices below would be empty." },
          { code: "robLine(nums.slice(0, n - 1))", explanation: "Solves the non-circular problem on every house except the last." },
          { code: "robLine(nums.slice(1))", explanation: "Solves the non-circular problem on every house except the first." },
          { code: "return Math.max(excludeLast, excludeFirst);", explanation: "Every valid plan leaves out the first or the last house, so these two cases cover every possibility." },
        ],
      },
    ],
    relatedProblems: ["house-robber", "climbing-stairs"],
    keywords: ["dynamic programming", "house robber", "circular array", "tabulation"],
  },

  {
    id: "longest-palindromic-substring",
    title: "Longest Palindromic Substring",
    difficulty: "Medium",
    category: "dp-1d",
    description: `
Given a string \`s\`, return its longest contiguous substring that reads
the same forwards and backwards. If several are tied, return any one.
    `.trim(),
    examples: [
      { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also a valid answer — both have length 3.' },
      { input: 's = "cbbd"', output: '"bb"', explanation: 'The longest palindrome is "bb"; single letters like "c" or "d" are shorter.' },
      { input: 's = "a"', output: '"a"' },
    ],
    constraints: ["1 <= s.length <= 1000", "s consists of only lowercase English letters"],
    hints: [
      "Every single character is a palindrome of length 1. Start there.",
      "Instead of checking every substring from scratch, grow a palindrome outward from its center. If s[i-1..i+1] is a palindrome, that helps tell whether s[i-2..i+2] is too.",
      "A palindrome can be centered on a letter (odd length) or between two letters (even length). Check both kinds of centers.",
    ],
    approachOverview: `
A palindrome mirrors outward from its center. So instead of checking all
~n²/2 substrings separately, try every possible center and grow outward
while the mirroring holds:

- Each character, for odd-length palindromes.
- Each gap between two characters, for even-length palindromes.

For each of the \`2n - 1\` centers, expansion stops as soon as the sides
differ, so the scan is quadratic instead of cubic. Track the longest
palindrome as you go.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Substring",
        explanation: "Check every substring by comparing characters from both ends inward, and keep the longest palindrome.",
        code: `function longestPalindrome(s) {
  function isPalindrome(str) {
    let left = 0;
    let right = str.length - 1;
    while (left < right) {
      if (str[left] !== str[right]) return false;
      left++;
      right--;
    }
    return true;
  }

  let longest = "";
  for (let i = 0; i < s.length; i++) {
    for (let j = i; j < s.length; j++) {
      const candidate = s.slice(i, j + 1);
      if (candidate.length > longest.length && isPalindrome(candidate)) {
        longest = candidate;
      }
    }
  }
  return longest;
}`,
        timeComplexity: "O(n^3) — O(n^2) substrings, each checked in O(n)",
        spaceComplexity: "O(1) extra, ignoring the substrings themselves",
      },
      {
        approach: "Optimal — Expand Around Center",
        explanation: "Treat every character, and every gap between two characters, as a possible center. Grow outward while both sides match, and track the widest palindrome found.",
        code: `function longestPalindrome(s) {
  let start = 0;
  let maxLength = 1;

  function expand(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    // left/right overshot by one step; the real palindrome is (left+1 .. right-1)
    const length = right - left - 1;
    if (length > maxLength) {
      maxLength = length;
      start = left + 1;
    }
  }

  for (let i = 0; i < s.length; i++) {
    expand(i, i);       // odd-length palindromes centered on i
    expand(i, i + 1);   // even-length palindromes centered between i and i+1
  }

  return s.slice(start, start + maxLength);
}`,
        timeComplexity: "O(n^2)",
        spaceComplexity: "O(1) extra",
        walkthrough: [
          { code: "expand(i, i);", explanation: "Tries an odd-length palindrome whose exact middle is character i." },
          { code: "expand(i, i + 1);", explanation: "Tries an even-length palindrome whose middle sits between i and i+1." },
          { code: "while (... && s[left] === s[right]) { left--; right++; }", explanation: "Grows outward one character at a time while both sides still match." },
          { code: "const length = right - left - 1;", explanation: "The loop overshoots by one step on each side, so the true length is right - left - 1." },
        ],
      },
    ],
    relatedProblems: ["palindromic-substrings"],
    keywords: ["dynamic programming", "palindrome", "expand around center", "strings"],
  },

  {
    id: "palindromic-substrings",
    title: "Palindromic Substrings",
    difficulty: "Medium",
    category: "dp-1d",
    description: `
Given a string \`s\`, count how many of its substrings are palindromes.
Substrings at different positions count separately, even if the text is
the same. For example, in \`"aaa"\` the "a" at index 0 and the "a" at
index 1 each count.
    `.trim(),
    examples: [
      { input: 's = "abc"', output: "3", explanation: '"a", "b", and "c" are each a palindrome on their own; no longer substring is.' },
      { input: 's = "aaa"', output: "6", explanation: 'Three single "a"s, two "aa"s (positions 0-1 and 1-2), and one "aaa".' },
    ],
    constraints: ["1 <= s.length <= 1000", "s consists of lowercase English letters"],
    hints: [
      "This is nearly the same as finding the longest palindromic substring, except you count every palindrome instead of keeping the longest.",
      "Every palindrome has a center: a character or a gap between two characters. Expanding from each center and counting each step that still matches covers every palindromic substring once.",
    ],
    approachOverview: `
As in the longest-palindrome problem, each palindromic substring is
defined by its center and how far it stretches. Check all \`2n - 1\`
centers (each character and each gap between adjacent characters), and
expand while both sides match. Each step of an expansion is exactly one
distinct palindromic substring.

So instead of tracking the longest, add 1 to a count on every successful
match. After trying every center, the count is the answer.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Substring",
        explanation: "Test every substring and count the palindromes.",
        code: `function countSubstrings(s) {
  function isPalindrome(str) {
    let left = 0;
    let right = str.length - 1;
    while (left < right) {
      if (str[left] !== str[right]) return false;
      left++;
      right--;
    }
    return true;
  }

  let count = 0;
  for (let i = 0; i < s.length; i++) {
    for (let j = i; j < s.length; j++) {
      if (isPalindrome(s.slice(i, j + 1))) count++;
    }
  }
  return count;
}`,
        timeComplexity: "O(n^3) — O(n^2) substrings, each checked in O(n)",
        spaceComplexity: "O(1) extra, ignoring the substrings themselves",
      },
      {
        approach: "Optimal — Expand Around Center",
        explanation: "Try every center (each character and each gap between two characters) and expand while both sides match, counting one palindrome per successful step.",
        code: `function countSubstrings(s) {
  let count = 0;

  function expand(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      count++;
      left--;
      right++;
    }
  }

  for (let i = 0; i < s.length; i++) {
    expand(i, i);       // odd-length palindromes centered on i
    expand(i, i + 1);   // even-length palindromes centered between i and i+1
  }

  return count;
}`,
        timeComplexity: "O(n^2)",
        spaceComplexity: "O(1) extra",
        walkthrough: [
          { code: "expand(i, i);", explanation: "Counts every odd-length palindrome centered on character i, including the character itself." },
          { code: "expand(i, i + 1);", explanation: "Counts every even-length palindrome centered between characters i and i+1." },
          { code: "count++;", explanation: "Each time both sides still match, that span is one more palindromic substring." },
        ],
      },
    ],
    relatedProblems: ["longest-palindromic-substring"],
    keywords: ["dynamic programming", "palindrome", "expand around center", "strings", "counting"],
  },

  {
    id: "decode-ways",
    title: "Decode Ways",
    difficulty: "Medium",
    category: "dp-1d",
    description: `
A message of capital letters was encoded as numbers: A -> "1",
B -> "2", ..., Z -> "26". You're given the digit string \`s\`.

There are no separators, so digits can sometimes be split into letters
in more than one way ("11" could be "AA" or "K"). Count the ways \`s\`
can be decoded.

A "0" that can't be part of a valid two-digit code (like a leading "0",
or a "0" on its own) gives no valid decodings.
    `.trim(),
    examples: [
      { input: 's = "12"', output: "2", explanation: '"AB" (1, 2) or "L" (12).' },
      { input: 's = "226"', output: "3", explanation: '"BZ" (2, 26), "VF" (22, 6), or "BBF" (2, 2, 6).' },
      { input: 's = "06"', output: "0", explanation: 'A leading "0" can\'t stand alone as a letter and "06" isn\'t a valid two-digit code, so there\'s no valid decoding at all.' },
    ],
    constraints: ["1 <= s.length <= 100", "s consists of digits only, and may contain leading zeros"],
    hints: [
      "At each position, ask: can this digit be its own letter? Can it pair with the digit before it to form a valid code (10 through 26)?",
      "Let ways(i) be the number of ways to decode the first i characters. Add ways(i-1) if s[i-1] is a valid single digit (non-zero). Add ways(i-2) if s[i-2..i-1] is a valid code between 10 and 26.",
      "Watch out for zeros: '0' alone is never a letter, and a two-digit chunk starting with '0' (like '05') is never valid.",
    ],
    approachOverview: `
Walk the string and ask at each position: how many ways can everything
up to here be decoded? The last "chunk" of a decoding is one digit or
two, so the count at position \`i\` comes from earlier counts:

- If the digit just before \`i\` is a valid code (1 through 9), add the count from one position earlier.
- If the *pair* of digits just before \`i\` is a valid code (10 through 26), add the count from two positions earlier.

It's the same "build up from smaller answers" shape as Climbing Stairs,
with extra validity checks for the zero-digit edge cases.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Plain Recursion",
        explanation: "From each position, try taking one digit and (when valid) two digits, and recurse on the rest. Correct, but re-explores the same positions repeatedly.",
        code: `function numDecodings(s) {
  const n = s.length;

  function ways(i) {
    if (i === n) return 1; // successfully consumed the whole string
    if (s[i] === "0") return 0; // no valid code starts with 0

    let total = ways(i + 1); // consume one digit

    if (i + 1 < n) {
      const twoDigit = Number(s.slice(i, i + 2));
      if (twoDigit >= 10 && twoDigit <= 26) {
        total += ways(i + 2); // consume two digits
      }
    }

    return total;
  }

  return ways(0);
}`,
        timeComplexity: "O(2^n)",
        spaceComplexity: "O(n) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up Tabulation",
        explanation: "Count the decodings of each prefix from smallest to largest, reusing the previous two counts instead of recursing.",
        code: `function numDecodings(s) {
  const n = s.length;
  if (s[0] === "0") return 0;

  // dp[i] = number of ways to decode the first i characters of s
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1; // empty prefix: exactly one way (decode nothing)
  dp[1] = 1; // first character is guaranteed non-zero by the check above

  for (let i = 2; i <= n; i++) {
    const oneDigit = Number(s[i - 1]);
    if (oneDigit >= 1) {
      dp[i] += dp[i - 1];
    }

    const twoDigit = Number(s.slice(i - 2, i));
    if (twoDigit >= 10 && twoDigit <= 26) {
      dp[i] += dp[i - 2];
    }
  }

  return dp[n];
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) for the dp array (can be reduced to O(1) with two variables)",
        walkthrough: [
          { code: "dp[0] = 1; dp[1] = 1;", explanation: "There's one way to decode nothing, and one way to decode a first digit already confirmed non-zero." },
          { code: "if (oneDigit >= 1) dp[i] += dp[i - 1];", explanation: "If the digit before position i can be its own letter, every decoding up to i-1 extends to i." },
          { code: "if (twoDigit >= 10 && twoDigit <= 26) dp[i] += dp[i - 2];", explanation: "If the last two digits form a valid code, every decoding up to i-2 extends by reading them together." },
        ],
      },
    ],
    relatedProblems: ["climbing-stairs"],
    keywords: ["dynamic programming", "decode ways", "strings", "tabulation"],
  },

  {
    id: "coin-change",
    title: "Coin Change",
    difficulty: "Medium",
    category: "dp-1d",
    description: `
Given coin values \`coins\` (unlimited supply of each) and a target
\`amount\`, return the fewest coins that add up to exactly that amount.
If it can't be done, return \`-1\`.
    `.trim(),
    examples: [
      { input: "coins = [1, 2, 5], amount = 11", output: "3", explanation: "11 = 5 + 5 + 1, using 3 coins." },
      { input: "coins = [2], amount = 3", output: "-1", explanation: "You can only ever make even amounts with 2-value coins." },
      { input: "coins = [1], amount = 0", output: "0", explanation: "Zero coins are needed to make an amount of 0." },
    ],
    constraints: [
      "1 <= coins.length <= 12",
      "1 <= coins[i] <= 2^31 - 1",
      "0 <= amount <= 10^4",
    ],
    hints: [
      "Try each coin as the 'last' coin added. Whichever you pick, the rest is the same problem for a smaller amount.",
      "Let fewest(a) be the minimum coins for amount a. fewest(a) = 1 + min of fewest(a - c) over every coin c <= a. Amount 0 is the base case. If every option is impossible, handle that case.",
      "Build up from amount 0, since fewest(0) = 0, and every larger amount depends only on smaller ones already solved.",
    ],
    approachOverview: `
Consider the last coin \`c\` in an optimal solution for amount \`a\`. The
rest is an optimal solution for \`a - c\`. You don't know which coin came
last, so try them all and keep the fewest total.

That gives \`fewest(a) = 1 + min(fewest(a - c))\` over every coin \`c\`
that fits in \`a\`, with \`fewest(0) = 0\` as the base case. Computing it
bottom-up, from 0 to the target, means smaller amounts are solved before
you need them, avoiding the repeated work of plain recursion.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Plain Recursion",
        explanation: "Try every coin as the last one, recurse on the remainder, and keep the option with the fewest coins. Correct, but recomputes the same amounts many times.",
        code: `function coinChange(coins, amount) {
  function fewest(remaining) {
    if (remaining === 0) return 0;
    if (remaining < 0) return Infinity;

    let best = Infinity;
    for (const coin of coins) {
      const result = fewest(remaining - coin);
      if (result + 1 < best) best = result + 1;
    }
    return best;
  }

  const answer = fewest(amount);
  return answer === Infinity ? -1 : answer;
}`,
        timeComplexity: "O(coins.length ^ amount)",
        spaceComplexity: "O(amount) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up Tabulation",
        explanation: "Compute the fewest coins for every amount from 0 to the target, reusing smaller amounts already solved.",
        code: `function coinChange(coins, amount) {
  // dp[a] = fewest coins to make amount a; amount+1 stands in for "impossible"
  const dp = new Array(amount + 1).fill(amount + 1);
  dp[0] = 0;

  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (coin <= a) {
        dp[a] = Math.min(dp[a], dp[a - coin] + 1);
      }
    }
  }

  return dp[amount] > amount ? -1 : dp[amount];
}`,
        timeComplexity: "O(amount * coins.length)",
        spaceComplexity: "O(amount)",
        walkthrough: [
          { code: "const dp = new Array(amount + 1).fill(amount + 1);", explanation: "No valid amount ever needs amount + 1 coins, so it's a safe stand-in for 'not yet possible'." },
          { code: "dp[0] = 0;", explanation: "An amount of 0 takes 0 coins." },
          { code: "dp[a] = Math.min(dp[a], dp[a - coin] + 1);", explanation: "If this coin is the last one, the total is 1 plus the coins needed for the rest." },
          { code: "return dp[amount] > amount ? -1 : dp[amount];", explanation: "If dp[amount] is still the placeholder, no combination of coins reaches it." },
        ],
      },
    ],
    relatedProblems: [],
    keywords: ["dynamic programming", "coin change", "unbounded knapsack", "tabulation"],
  },

  {
    id: "maximum-product-subarray",
    title: "Maximum Product Subarray",
    difficulty: "Medium",
    category: "dp-1d",
    description: `
Given an integer array \`nums\` (which may include negatives and zeros),
return the largest product of any contiguous subarray.
    `.trim(),
    examples: [
      { input: "nums = [2, 3, -2, 4]", output: "6", explanation: "The subarray [2, 3] has product 6, which beats any subarray that includes the -2." },
      { input: "nums = [-2, 0, -1]", output: "0", explanation: "Any subarray touching the 0 gives a product of 0, and no other subarray beats that (the lone -2 or -1 are both negative)." },
      { input: "nums = [-2, 3, -4]", output: "24", explanation: "The whole array multiplies to (-2) * 3 * (-4) = 24 — the two negatives cancel out." },
    ],
    constraints: ["1 <= nums.length <= 2 * 10^4", "-10 <= nums[i] <= 10"],
    hints: [
      "With sums, tracking the 'best subarray ending here' works. With products it doesn't: a negative number can turn your smallest (most negative) running product into the largest.",
      "At each position, track both the maximum *and* minimum product ending there. A negative number can turn the minimum into the new maximum.",
      "At each element, the new running maximum is the best of: the element alone, element * previous max, or element * previous min.",
    ],
    approachOverview: `
For a maximum *sum* subarray, you only track the best sum ending at each
position. Products break this: multiplying by a negative flips the sign,
so the smallest (most negative) product can become the largest after
another negative.

So track two values at each position: the maximum and the minimum
product ending there. For the next number, the new maximum is the best
of:

- Starting fresh with just this number.
- Extending the previous max.
- Extending the previous min (in case this number is negative and flips it).

Do the same for the new minimum, and keep the largest maximum seen at any
position as the answer.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Subarray",
        explanation: "Compute the product of every contiguous subarray and keep the largest.",
        code: `function maxProduct(nums) {
  let best = nums[0];

  for (let i = 0; i < nums.length; i++) {
    let product = 1;
    for (let j = i; j < nums.length; j++) {
      product *= nums[j];
      if (product > best) best = product;
    }
  }

  return best;
}`,
        timeComplexity: "O(n^2)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal — Track Running Max and Min",
        explanation: "Sweep once, carrying both the max and min product ending at each position, since a negative number can turn the min into the new max.",
        code: `function maxProduct(nums) {
  let maxEndingHere = nums[0];
  let minEndingHere = nums[0];
  let best = nums[0];

  for (let i = 1; i < nums.length; i++) {
    const num = nums[i];

    if (num < 0) {
      // A negative number swaps the roles of the running max and min.
      [maxEndingHere, minEndingHere] = [minEndingHere, maxEndingHere];
    }

    maxEndingHere = Math.max(num, maxEndingHere * num);
    minEndingHere = Math.min(num, minEndingHere * num);

    best = Math.max(best, maxEndingHere);
  }

  return best;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "if (num < 0) { [maxEndingHere, minEndingHere] = [minEndingHere, maxEndingHere]; }", explanation: "Multiplying by a negative turns the biggest product into the smallest and vice versa, so swap them first." },
          { code: "maxEndingHere = Math.max(num, maxEndingHere * num);", explanation: "The best product ending here either restarts at this number or extends the previous best." },
          { code: "minEndingHere = Math.min(num, minEndingHere * num);", explanation: "Also tracks the most negative product ending here, since it may become useful a step later." },
          { code: "best = Math.max(best, maxEndingHere);", explanation: "Records the best product at any position, not just at the last index." },
        ],
      },
    ],
    relatedProblems: [],
    keywords: ["dynamic programming", "subarray", "product", "kadane's algorithm"],
  },

  {
    id: "word-break",
    title: "Word Break",
    difficulty: "Medium",
    category: "dp-1d",
    description: `
Given a string \`s\` and a list of words \`wordDict\`, return whether \`s\`
can be split into one or more words from \`wordDict\`. Words can be
reused any number of times.
    `.trim(),
    examples: [
      { input: 's = "leetcode", wordDict = ["leet", "code"]', output: "true", explanation: '"leetcode" splits into "leet" + "code".' },
      { input: 's = "applepenapple", wordDict = ["apple", "pen"]', output: "true", explanation: '"applepenapple" splits into "apple" + "pen" + "apple", reusing "apple".' },
      { input: 's = "catsandog", wordDict = ["cats", "dog", "sand", "and", "cat"]', output: "false", explanation: 'No combination of the given words covers the whole string cleanly — "catsandog" always leaves a leftover chunk like "og" that isn\'t a word.' },
    ],
    constraints: [
      "1 <= s.length <= 300",
      "1 <= wordDict.length <= 1000",
      "s and every word in wordDict consist of lowercase English letters",
    ],
    hints: [
      "Can you chop a dictionary word off the front, then break the rest the same way?",
      "Let canBreak(i) be whether the substring from index i can be fully split into dictionary words. It's true if some word matches s at i and canBreak(i + word.length) is also true.",
      "Base case: the empty remainder (the end of the string) is always breakable, since nothing is left.",
    ],
    approachOverview: `
Ask at each index \`i\`: can the rest of the string be split into
dictionary words? Yes, if some word matches at \`i\` and the remainder
*after* it can also be split. That's the same question, further along.

The base case is the empty remainder past the end, which is always true.
Plain recursion asks "can this suffix be split?" many times through
different paths. Caching each answer, or building them backward from the
end, avoids the repeated work.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Plain Recursion",
        explanation: "From each position, try every dictionary word that matches there and recurse on the rest. Correct, but the same positions are re-explored through different word choices.",
        code: `function wordBreak(s, wordDict) {
  const words = new Set(wordDict);

  function canBreak(start) {
    if (start === s.length) return true;

    for (const word of words) {
      if (s.startsWith(word, start) && canBreak(start + word.length)) {
        return true;
      }
    }
    return false;
  }

  return canBreak(0);
}`,
        timeComplexity: "O(2^n * m) — exponential branching, m = average word length for the startsWith checks",
        spaceComplexity: "O(n) — recursion depth",
      },
      {
        approach: "Optimal — Bottom-Up Tabulation",
        explanation: "Work backward from the end. dp[i] records whether the suffix from i can be split into dictionary words, using dp values already solved for later positions.",
        code: `function wordBreak(s, wordDict) {
  const words = new Set(wordDict);
  const n = s.length;

  // dp[i] = can the suffix s[i..n) be broken into dictionary words?
  const dp = new Array(n + 1).fill(false);
  dp[n] = true; // the empty suffix is trivially breakable

  for (let i = n - 1; i >= 0; i--) {
    for (const word of words) {
      if (s.startsWith(word, i) && dp[i + word.length]) {
        dp[i] = true;
        break;
      }
    }
  }

  return dp[0];
}`,
        timeComplexity: "O(n * w * m) — n positions, w dictionary words, m average word length for matching",
        spaceComplexity: "O(n + w) — the dp array plus the word set",
        walkthrough: [
          { code: "dp[n] = true;", explanation: "The empty suffix past the end needs nothing more, so it's always breakable." },
          { code: "for (let i = n - 1; i >= 0; i--)", explanation: "Fills dp from the end backward, so every dp[i + word.length] it needs is already known." },
          { code: "if (s.startsWith(word, i) && dp[i + word.length])", explanation: "The suffix from i is breakable if a word matches there and the rest after it is breakable." },
        ],
      },
    ],
    relatedProblems: [],
    keywords: ["dynamic programming", "word break", "strings", "tabulation"],
  },

  {
    id: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence",
    difficulty: "Medium",
    category: "dp-1d",
    description: `
Given an integer array \`nums\`, return the length of the longest strictly
increasing subsequence. A subsequence keeps the original left-to-right
order but can skip numbers. Each number must be strictly greater than the
one before it.
    `.trim(),
    examples: [
      { input: "nums = [10, 9, 2, 5, 3, 7, 101, 18]", output: "4", explanation: "One such subsequence is [2, 3, 7, 101]; another is [2, 3, 7, 18]." },
      { input: "nums = [0, 1, 0, 3, 2, 3]", output: "4", explanation: "[0, 1, 2, 3] is a valid increasing subsequence of length 4." },
      { input: "nums = [7, 7, 7, 7]", output: "1", explanation: "Since it must be strictly increasing, repeats can't extend a subsequence past length 1." },
    ],
    constraints: ["1 <= nums.length <= 2500", "-10^4 <= nums[i] <= 10^4"],
    hints: [
      "For each number, what's the longest increasing subsequence ending exactly there? It depends only on earlier, smaller numbers.",
      "Let longest(i) be the length of the longest increasing subsequence ending at index i. longest(i) = 1 + max(longest(j)) over every j < i where nums[j] < nums[i] (or 1 if no such j exists).",
      "Faster: keep a list of the smallest possible 'tail' value for an increasing subsequence of each length, and binary-search it for where each new number fits.",
    ],
    approachOverview: `
For each index \`i\`, ask: how long can a subsequence ending exactly at
\`nums[i]\` be? It's 1 (\`nums[i]\` alone) plus the best "ends here" answer
among earlier, smaller numbers. The best over all indexes is the answer,
but comparing every index with every earlier one costs O(n^2).

A faster way doesn't track which number extends which subsequence. Keep
a list, "tails", where \`tails[k]\` is the smallest last value of any
increasing subsequence of length \`k + 1\` so far. "tails" stays sorted,
so binary-search it for the first value not smaller than the new number.
The number either extends the list (a new longest length) or replaces
that entry with a smaller, more promising tail. The final length of
"tails" is the answer.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Plain Recursion",
        explanation: "Recursively try including or skipping each number (including only ones that keep the sequence increasing), and keep the longest result.",
        code: `function lengthOfLIS(nums) {
  function longestFrom(i, prevValue) {
    let best = 0;
    for (let j = i; j < nums.length; j++) {
      if (nums[j] > prevValue) {
        best = Math.max(best, 1 + longestFrom(j + 1, nums[j]));
      }
    }
    return best;
  }

  return longestFrom(0, -Infinity);
}`,
        timeComplexity: "O(2^n)",
        spaceComplexity: "O(n) — recursion depth",
      },
      {
        approach: "Better — Bottom-Up DP",
        explanation: "For each index, compute the longest increasing subsequence ending there by checking every earlier index with a smaller value.",
        code: `function lengthOfLIS(nums) {
  const n = nums.length;
  const dp = new Array(n).fill(1); // every number alone is a subsequence of length 1

  let best = 1;
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    best = Math.max(best, dp[i]);
  }

  return best;
}`,
        timeComplexity: "O(n^2)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal — Binary Search on Tails",
        explanation: "Keep the smallest possible tail value for an increasing subsequence of each length. Binary-search where each new number fits: it either extends the longest subsequence or improves a shorter one's tail.",
        code: `function lengthOfLIS(nums) {
  const tails = [];

  for (const num of nums) {
    let low = 0;
    let high = tails.length;

    // Binary search for the first tail value >= num
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (tails[mid] < num) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    if (low === tails.length) {
      tails.push(num); // num extends the longest subsequence found so far
    } else {
      tails[low] = num; // num gives a smaller, more promising tail for this length
    }
  }

  return tails.length;
}`,
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "let low = 0; let high = tails.length;", explanation: "Binary-searches the sorted 'tails' array for the leftmost position where num could sit." },
          { code: "if (tails[mid] < num) { low = mid + 1; } else { high = mid; }", explanation: "Standard binary search for the first tail value that is not smaller than num." },
          { code: "if (low === tails.length) { tails.push(num); }", explanation: "If num is bigger than every current tail, it extends the longest subsequence found so far by one." },
          { code: "else { tails[low] = num; }", explanation: "Otherwise, num replaces the tail at the length where it fits, giving later numbers a smaller value to build on. The length of tails doesn't change." },
          { code: "return tails.length;", explanation: "The length of 'tails' equals the length of the longest increasing subsequence so far." },
        ],
      },
    ],
    relatedProblems: [],
    keywords: ["dynamic programming", "longest increasing subsequence", "binary search", "patience sorting"],
  },
];
