import type { Problem } from "../../types/problem";

export const dp1dProblems: Problem[] = [
  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "Easy",
    category: "dp-1d",
    description: `
You're climbing a staircase with \`n\` steps. On each move, you can go up
either 1 step or 2 steps. Count how many distinct ways there are to reach
the top.
    `.trim(),
    examples: [
      { input: "n = 2", output: "2", explanation: "1 step + 1 step, or 2 steps." },
      { input: "n = 3", output: "3", explanation: "1+1+1, 1+2, or 2+1." },
    ],
    constraints: ["1 <= n <= 45"],
    hints: [
      "To reach step n, what was your very last move — 1 step or 2 steps? Where were you right before that move?",
      "The number of ways to reach step n is the number of ways to reach step n-1, plus the number of ways to reach step n-2.",
    ],
    approachOverview: `
Think about the very last move you'd take to land exactly on step n: it
was either a 1-step move from step n-1, or a 2-step move from step n-2.
So the number of ways to reach step n is simply the number of ways to
reach step n-1 plus the number of ways to reach step n-2 — the same
pattern as the Fibonacci sequence.

Naively recomputing this recursively re-does the same smaller subproblems
over and over. Building the answer up from the smallest steps, and
reusing each result once it's computed, avoids all that repeated work.
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
        explanation: "Since each step only ever needs the previous two results, there's no need to store the whole history — just keep the last two values and slide them forward.",
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
          { code: "const current = prev1 + prev2;", explanation: "The ways to reach the current step is the sum of the ways to reach the two steps before it." },
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
You're given an array \`cost\` where \`cost[i]\` is the price you pay to
step *off* of stair \`i\`. Once you pay that cost, you can move either 1
or 2 steps forward. You're allowed to start standing on step \`0\` or step
\`1\` for free, and the "top" is one step past the last stair in the
array. Find the minimum total cost to reach the top.
    `.trim(),
    examples: [
      { input: "cost = [10, 15, 20]", output: "15", explanation: "Start on step 1 (free), pay 15 to jump 2 steps straight to the top." },
      { input: "cost = [1, 100, 1, 1, 1, 100, 1, 1, 100, 1]", output: "6", explanation: "Start on step 0, then hop over every expensive step, paying 1 six times." },
    ],
    constraints: ["2 <= cost.length <= 1000", "0 <= cost[i] <= 999"],
    hints: [
      "This is the same shape as Climbing Stairs, but instead of counting paths you're minimizing a cost.",
      "Define minCost(i) as the cheapest total cost to reach the top starting from step i. From step i you either pay cost[i] and jump 1 step, or pay cost[i] and jump 2 steps — take whichever is cheaper.",
      "The answer is the cheaper of starting at step 0 or starting at step 1, since both are free starting points.",
    ],
    approachOverview: `
Picture standing on some step \`i\`. From there you must pay \`cost[i]\`
no matter which way you jump, and then you land either on step \`i+1\` or
step \`i+2\`. So the cheapest way to finish *from* step \`i\` is
\`cost[i]\` plus whichever of "finish from i+1" or "finish from i+2" is
cheaper. That's a recursive relationship, just like Climbing Stairs, but
minimizing instead of counting.

Since "finish from the top" and "finish from one past the top" both cost
0 (you're already there), you can build the answer up from the end of the
array backward — or equivalently, build up from the front by asking "what's
the cheapest way to arrive at step i", and finish by taking the smaller of
arriving at the last two steps (since either one is one hop from the top).
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Plain Recursion",
        explanation: "Recurse on 'cheapest cost to finish starting from step i': pay cost[i], then take the cheaper of jumping 1 or 2 steps. Correct, but re-explores the same steps over and over.",
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
        explanation: "Walk forward and track the cheapest cost to *arrive* at each step, using only the previous two results. The top is one hop past the last step, so the answer is the smaller of the costs to arrive at the last two steps.",
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
You're a burglar planning to rob houses along a street. Each house holds
some amount of cash, given as an array \`nums\`. Every house is wired to
a security system connected to its immediate neighbors — if you rob two
houses that are next to each other, the alarm goes off. Figure out the
maximum amount of money you can steal without ever robbing two adjacent
houses.
    `.trim(),
    examples: [
      { input: "nums = [1, 2, 3, 1]", output: "4", explanation: "Rob house 0 (1) and house 2 (3): 1 + 3 = 4." },
      { input: "nums = [2, 7, 9, 3, 1]", output: "12", explanation: "Rob houses 0, 2, and 4: 2 + 9 + 1 = 12." },
    ],
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 400"],
    hints: [
      "For each house, you have exactly two choices: skip it, or rob it (which forces you to skip the one right before it).",
      "Define best(i) as the most money you can get from the first i+1 houses. best(i) = max(best(i-1), best(i-2) + nums[i]) — either you don't rob house i (so you're stuck with whatever best(i-1) was), or you do rob it (adding nums[i] to whatever best(i-2) was, since i-1 is now off-limits).",
    ],
    approachOverview: `
At each house, you make a binary decision: rob it, or don't. If you skip
house \`i\`, your best total is whatever you could already get from the
first \`i\` houses. If you rob house \`i\`, you collect \`nums[i]\` but you
must not have robbed house \`i-1\`, so you add it to the best total from
the first \`i-1\` houses. Since you don't know in advance which choice is
better, take whichever of the two gives more money.

That gives a clean recurrence: the best total through house \`i\` is
\`max(best through i-1, best through i-2 + nums[i])\`. Just like Climbing
Stairs, each step only needs the previous two results, so you can sweep
through the array once, carrying only two running values forward.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Plain Recursion",
        explanation: "At each house, recursively try both 'skip it' and 'rob it', and take the better outcome. Correct, but explores overlapping subproblems exponentially many times.",
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
        explanation: "Sweep left to right, tracking the best total using only the last two houses' results — no need to store the whole array of results.",
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
Same setup as before — you're robbing houses without ever hitting two
adjacent ones — except now the houses are arranged in a circle: the
first house and the last house count as neighbors too. Given the cash
in each house as \`nums\`, find the maximum you can steal.
    `.trim(),
    examples: [
      { input: "nums = [2, 3, 2]", output: "3", explanation: "Robbing houses 0 and 2 isn't allowed since they're adjacent in the circle, so the best is just house 1 (3)." },
      { input: "nums = [1, 2, 3, 1]", output: "4", explanation: "Rob houses 0 and 2: 1 + 3 = 4. House 3 can't join house 0 since they're now neighbors." },
      { input: "nums = [1, 2, 3]", output: "3", explanation: "All three houses touch each other in a circle of 3, so only one house can be robbed." },
    ],
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 1000"],
    hints: [
      "The only thing the circle changes is the relationship between the very first and very last house — everywhere else, it's plain House Robber.",
      "Any valid plan either leaves the first house alone, or leaves the last house alone (it can never rob both, since they're adjacent). So try both scenarios separately and take the better one.",
    ],
    approachOverview: `
The circular wrap-around only matters because of one pair: house 0 and
the last house. Any robbery plan either skips house 0 entirely, or skips
the last house entirely — it's never allowed to include both.

So break the circle into two straight-line versions of the same problem:
one that considers every house except the last, and one that considers
every house except the first. Solve each with the ordinary House Robber
approach, and take whichever total is bigger. The one edge case to
handle separately is a single house, since a street of one house has no
neighbors to conflict with.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Two Linear Recursions",
        explanation: "Recursively solve plain (non-circular) House Robber on the range that excludes the last house, and again on the range that excludes the first house, then take the max of the two.",
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
        explanation: "Run the O(n) two-variable House Robber sweep on the slice that drops the last house, then again on the slice that drops the first house, and return the larger result.",
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
          { code: "if (n === 1) return nums[0];", explanation: "A single house has no neighbor to conflict with, so just take it — the two slices below would otherwise both end up empty." },
          { code: "robLine(nums.slice(0, n - 1))", explanation: "Solve the plain, non-circular problem on every house except the last." },
          { code: "robLine(nums.slice(1))", explanation: "Solve the plain, non-circular problem on every house except the first." },
          { code: "return Math.max(excludeLast, excludeFirst);", explanation: "Exactly one of these two plans could ever include both circle-adjacent ends, so this covers every valid possibility." },
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
Given a string \`s\`, find the longest contiguous substring of \`s\` that
reads the same forwards and backwards. If there are multiple longest
palindromic substrings, returning any one of them is fine.
    `.trim(),
    examples: [
      { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also a valid answer — both have length 3.' },
      { input: 's = "cbbd"', output: '"bb"', explanation: 'The longest palindrome is "bb"; single letters like "c" or "d" are shorter.' },
      { input: 's = "a"', output: '"a"' },
    ],
    constraints: ["1 <= s.length <= 1000", "s consists of only lowercase English letters"],
    hints: [
      "Every single character is trivially a palindrome of length 1 — that's your starting point.",
      "Instead of checking every substring from scratch, think of a palindrome as growing outward from its center. If s[i-1..i+1] is a palindrome, that tells you something useful about whether s[i-2..i+2] is too.",
      "A palindrome can be centered on a single letter (odd length) or between two letters (even length) — you need to check both kinds of centers.",
    ],
    approachOverview: `
A palindrome is defined by its center: everything mirrors outward from
the middle. That means instead of checking every one of the roughly
n²/2 substrings independently, you can pick every possible center — each
single character (for odd-length palindromes) and every gap between two
characters (for even-length palindromes) — and grow outward from it as
far as the mirroring holds.

For each of the \`2n - 1\` centers, expanding outward stops the moment the
two sides stop matching, so the whole scan stays quadratic instead of
cubic. Track the longest palindrome seen as you go.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Substring",
        explanation: "Generate every possible substring, check whether each one is a palindrome by comparing it to its own reverse, and keep the longest one found.",
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
        explanation: "Treat every character (and every gap between two characters) as a potential center of a palindrome, and grow outward from it while both sides keep matching. Track the widest palindrome found across all centers.",
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
          { code: "while (... && s[left] === s[right]) { left--; right++; }", explanation: "Grows outward one character at a time as long as both sides still mirror each other." },
          { code: "const length = right - left - 1;", explanation: "The loop always overshoots by one step before stopping, so the true palindrome length is right - left - 1." },
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
Given a string \`s\`, count how many substrings of it are palindromes.
Substrings that appear at different positions count separately, even if
the text is identical — for example, in \`"aaa"\` the two separate "a"s
at index 0 and index 1 are each counted.
    `.trim(),
    examples: [
      { input: 's = "abc"', output: "3", explanation: '"a", "b", and "c" are each a palindrome on their own; no longer substring is.' },
      { input: 's = "aaa"', output: "6", explanation: 'Three single "a"s, two "aa"s (positions 0-1 and 1-2), and one "aaa".' },
    ],
    constraints: ["1 <= s.length <= 1000", "s consists of lowercase English letters"],
    hints: [
      "This is nearly identical to finding the longest palindromic substring — the only difference is you're tallying every palindrome you find instead of just remembering the longest.",
      "Every possible palindrome has a center — either a single character or a gap between two characters. Expanding outward from each center and counting every step that still mirrors covers every palindromic substring exactly once.",
    ],
    approachOverview: `
Just like the longest-palindrome version of this problem, every
palindromic substring is defined by its center and how far it stretches
outward from that center. If you check all \`2n - 1\` possible centers
(one for each character, plus one for each gap between adjacent
characters) and, for each one, expand outward for as long as both sides
keep matching, then every single step of that expansion corresponds to
exactly one distinct palindromic substring.

So rather than tracking the longest one, simply add 1 to a running count
every time the expansion successfully matches — that count, once every
center has been tried, is the total number of palindromic substrings.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Substring",
        explanation: "Generate every substring and test each one for being a palindrome, counting up the ones that pass.",
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
        explanation: "Try every possible center (each character, and each gap between two characters) and expand outward while both sides mirror, counting one palindrome for every successful step of the expansion.",
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
          { code: "expand(i, i);", explanation: "Counts every odd-length palindrome centered exactly on character i, including the single character itself." },
          { code: "expand(i, i + 1);", explanation: "Counts every even-length palindrome centered between characters i and i+1." },
          { code: "count++;", explanation: "Each time the two sides still match during expansion, that span is one more valid palindromic substring." },
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
A message made only of capital letters A through Z was encoded by
mapping each letter to a number: A -> "1", B -> "2", ..., Z -> "26". You're
given the resulting digit string \`s\`. Because there's no separator
between the encoded numbers, a run of digits can sometimes be split back
into letters in more than one way (for example "11" could be "AA" or
"K"). Count how many different ways \`s\` could have been decoded back
into letters. A string with a "0" in a position that can't be part of a
valid two-digit code (like a leading "0", or "0" on its own) contributes
no valid decodings.
    `.trim(),
    examples: [
      { input: 's = "12"', output: "2", explanation: '"AB" (1, 2) or "L" (12).' },
      { input: 's = "226"', output: "3", explanation: '"BZ" (2, 26), "VF" (22, 6), or "BBF" (2, 2, 6).' },
      { input: 's = "06"', output: "0", explanation: 'A leading "0" can\'t stand alone as a letter and "06" isn\'t a valid two-digit code, so there\'s no valid decoding at all.' },
    ],
    constraints: ["1 <= s.length <= 100", "s consists of digits only, and may contain leading zeros"],
    hints: [
      "At any position, ask: could the digit right there be read as its own letter? Could it be paired with the digit before it to form a valid two-letter code (10 through 26)?",
      "Define ways(i) as the number of ways to decode the first i characters of the string. ways(i) picks up a contribution from ways(i-1) if s[i-1] is a valid single digit (non-zero), and a contribution from ways(i-2) if s[i-2..i-1] forms a valid two-digit code between 10 and 26.",
      "Watch out for zeros: '0' alone is never a valid letter, and a two-digit chunk starting with '0' (like '05') is never valid either.",
    ],
    approachOverview: `
Walk through the string one position at a time and ask: how many ways
are there to decode everything up through here? The last "chunk" of any
valid decoding is either a single digit or a pair of digits, so the count
at position \`i\` is built from smaller counts you've already computed:
if the single digit right before position \`i\` is a valid letter code (1
through 9), add in the count from one position earlier; if the *pair* of
digits right before position \`i\` forms a valid letter code (10 through
26), add in the count from two positions earlier.

This is the same "build up from smaller answers" shape as Climbing
Stairs, just with extra validity checks on which contributions are
allowed at each step, because of the zero-digit edge cases.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Plain Recursion",
        explanation: "From each position, try consuming one digit and try consuming two digits (when valid), and recurse on what's left. Correct, but re-explores the same positions repeatedly.",
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
        explanation: "Build the count of decodings for each prefix from the smallest prefix upward, reusing the two previously computed counts instead of recursing.",
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
          { code: "dp[0] = 1; dp[1] = 1;", explanation: "There's exactly one way to decode nothing, and exactly one way to decode a single, already-confirmed-non-zero first digit." },
          { code: "if (oneDigit >= 1) dp[i] += dp[i - 1];", explanation: "If the digit right before position i can stand alone as a letter, every way of decoding up to i-1 extends into a way of decoding up to i." },
          { code: "if (twoDigit >= 10 && twoDigit <= 26) dp[i] += dp[i - 2];", explanation: "If the last two digits form a valid two-letter code, every way of decoding up to i-2 extends by reading those two digits together." },
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
You're given an array of coin denominations \`coins\` (you have an
unlimited supply of each) and a target amount of money \`amount\`. Find
the fewest number of coins needed to make up exactly that amount. If it's
impossible to make that amount with the given coins, return \`-1\`.
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
      "For a target amount, try using each coin as the 'last' coin you add. Whichever coin you pick, you still need to solve the exact same problem for the smaller remaining amount.",
      "Define fewest(a) as the minimum coins needed to make amount a. fewest(a) = 1 + min over every coin c (with c <= a) of fewest(a - c). If no coin can be used (a is 0, that's the base case; otherwise if every option is impossible), handle it accordingly.",
      "Build up the answer starting from amount 0, since fewest(0) = 0 is a solid base case, and every larger amount depends only on smaller amounts already solved.",
    ],
    approachOverview: `
Think about the last coin used in an optimal solution for amount \`a\`.
Whatever that coin's value \`c\` is, the rest of the solution is just an
optimal solution for the smaller amount \`a - c\`. Since you don't know
in advance which coin was used last, try all of them and take whichever
choice leads to the fewest total coins.

That gives the recurrence \`fewest(a) = 1 + min(fewest(a - c))\` over
every coin \`c\` that fits within \`a\`, with \`fewest(0) = 0\` as the base
case. Computing this bottom-up — from amount 0 up to the target — means
every smaller amount is already solved by the time you need it, avoiding
the repeated work that plain recursion would do.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Plain Recursion",
        explanation: "For each amount, try every coin as the last one used and recurse on the remainder, keeping the option that uses the fewest coins. Correct, but the same amounts get recomputed many times over.",
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
        explanation: "Compute the fewest coins needed for every amount from 0 up to the target, reusing the already-solved smaller amounts instead of recursing.",
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
          { code: "const dp = new Array(amount + 1).fill(amount + 1);", explanation: "amount + 1 coins can never actually be needed for any valid amount, so it's a safe stand-in for 'not yet possible'." },
          { code: "dp[0] = 0;", explanation: "Making an amount of 0 always takes exactly 0 coins." },
          { code: "dp[a] = Math.min(dp[a], dp[a - coin] + 1);", explanation: "If this coin were the last one used, the total is 1 plus however many coins it took to make the rest of the amount." },
          { code: "return dp[amount] > amount ? -1 : dp[amount];", explanation: "If dp[amount] never dropped below the impossible placeholder, no combination of coins could reach it." },
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
Given an array of integers \`nums\` (which may include negative numbers
and zeros), find the contiguous subarray that has the largest product,
and return that product.
    `.trim(),
    examples: [
      { input: "nums = [2, 3, -2, 4]", output: "6", explanation: "The subarray [2, 3] has product 6, which beats any subarray that includes the -2." },
      { input: "nums = [-2, 0, -1]", output: "0", explanation: "Any subarray touching the 0 gives a product of 0, and no other subarray beats that (the lone -2 or -1 are both negative)." },
      { input: "nums = [-2, 3, -4]", output: "24", explanation: "The whole array multiplies to (-2) * 3 * (-4) = 24 — the two negatives cancel out." },
    ],
    constraints: ["1 <= nums.length <= 2 * 10^4", "-10 <= nums[i] <= 10"],
    hints: [
      "With sums, a running 'best subarray ending here' works fine because adding a number never flips the sign of your running total's usefulness. With products, it does — a negative number can turn your smallest (most negative) running product into your largest.",
      "At each position, track both the maximum *and* minimum product of a subarray ending there. A new negative number can turn the running minimum into the new maximum.",
      "At each element, the new running maximum is the best of: the element alone, element * previous max, or element * previous min.",
    ],
    approachOverview: `
With a maximum *sum* subarray, you'd only ever need to track the best sum
ending at each position, because adding a number never makes a good
running sum suddenly bad. Products break that assumption: multiplying by
a negative number flips signs, so the smallest (most negative) running
product can suddenly become the largest once you multiply it by another
negative.

So at every position, track two running values instead of one: the
maximum product of a subarray ending there, and the minimum. When you
move to the next number, the new maximum is the best of "start fresh with
just this number," "extend the previous max," or "extend the previous
min" (in case this number is negative and flips it into something big).
Do the same for the new minimum, and keep a separate running answer that
records the largest maximum seen at any position.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Subarray",
        explanation: "Compute the product of every contiguous subarray directly and keep track of the largest one seen.",
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
        explanation: "Sweep through once, carrying forward both the max and min product ending at the current position, since a negative number can turn the running min into the new max.",
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
          { code: "if (num < 0) { [maxEndingHere, minEndingHere] = [minEndingHere, maxEndingHere]; }", explanation: "Multiplying by a negative number turns the biggest product into the smallest and vice versa, so swap them before applying the multiplication." },
          { code: "maxEndingHere = Math.max(num, maxEndingHere * num);", explanation: "The best product ending here either restarts fresh at this number, or extends the previous best product." },
          { code: "minEndingHere = Math.min(num, minEndingHere * num);", explanation: "Tracks the worst (most negative) product ending here too, since it might become useful one step later." },
          { code: "best = Math.max(best, maxEndingHere);", explanation: "Records the best product seen at any position, not just the one ending at the very last index." },
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
Given a string \`s\` and a list of words \`wordDict\`, determine whether
\`s\` can be split into a sequence of one or more words that all appear
in \`wordDict\`. The same word from the dictionary can be reused as many
times as needed.
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
      "Think of it as: can I chop off some valid dictionary word from the front, and then successfully break the rest of the string the same way?",
      "Define canBreak(i) as whether the substring starting at index i can be fully broken into dictionary words. It's true if there's some dictionary word matching s starting at i, such that canBreak(i + word.length) is also true.",
      "There's a natural base case: the empty remainder (the end of the string) can always be trivially 'broken' — there's nothing left to break.",
    ],
    approachOverview: `
Ask the question one position at a time: starting from index \`i\`, can
the rest of the string be broken into dictionary words? That's true
exactly when some dictionary word matches the string starting right at
\`i\`, and the remainder *after* that word can also be broken — which is
the exact same question, just starting further along.

That gives a clean recursive definition, with the empty remainder (past
the end of the string) as the trivially true base case. Plain recursion
re-asks the same "can this suffix be broken?" question many times through
different paths, so caching each answer — or building them up from the
end of the string backward — avoids the repeated work.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Plain Recursion",
        explanation: "From each starting position, try every dictionary word that matches there, and recurse on whatever's left. Correct, but the same starting positions get re-explored repeatedly through different word choices.",
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
        explanation: "Work backward from the end of the string. dp[i] records whether the suffix starting at i can be broken into dictionary words, built from the already-solved dp values for positions after it.",
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
          { code: "dp[n] = true;", explanation: "The empty suffix past the end of the string needs nothing further, so it's always breakable." },
          { code: "for (let i = n - 1; i >= 0; i--)", explanation: "Fills the dp array from the end of the string backward, so every dp[i + word.length] it needs is already known." },
          { code: "if (s.startsWith(word, i) && dp[i + word.length])", explanation: "The suffix starting at i is breakable if some word matches right there, and whatever comes after that word is also breakable." },
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
Given an integer array \`nums\`, find the length of the longest strictly
increasing subsequence — a sequence of numbers picked from \`nums\` in
their original left-to-right order (skipping any you like), where each
number is strictly greater than the one before it.
    `.trim(),
    examples: [
      { input: "nums = [10, 9, 2, 5, 3, 7, 101, 18]", output: "4", explanation: "One such subsequence is [2, 3, 7, 101]; another is [2, 3, 7, 18]." },
      { input: "nums = [0, 1, 0, 3, 2, 3]", output: "4", explanation: "[0, 1, 2, 3] is a valid increasing subsequence of length 4." },
      { input: "nums = [7, 7, 7, 7]", output: "1", explanation: "Since it must be strictly increasing, repeats can't extend a subsequence past length 1." },
    ],
    constraints: ["1 <= nums.length <= 2500", "-10^4 <= nums[i] <= 10^4"],
    hints: [
      "For every number, ask: what's the longest increasing subsequence that ends exactly at this number? That depends only on earlier numbers that are smaller than it.",
      "Define longest(i) as the length of the longest increasing subsequence ending at index i. longest(i) = 1 + max(longest(j)) over every j < i where nums[j] < nums[i] (or just 1, if no such j exists).",
      "For a faster approach: maintain a growing list representing the smallest possible 'tail' value for an increasing subsequence of each length seen so far, and binary-search it for where each new number fits.",
    ],
    approachOverview: `
For every index \`i\`, ask: if the subsequence has to end exactly at
\`nums[i]\`, how long can it be? That's 1 (just \`nums[i]\` by itself) plus
the best of all the "ends here" answers for earlier, smaller numbers that
could feed into it. Computing that for every index and taking the overall
best gives the answer, but comparing every index against every earlier
index costs O(n^2).

There's a faster way that avoids ever needing to know which specific
number extends which subsequence. Keep a running list, "tails," where
\`tails[k]\` is the smallest possible last value of any increasing
subsequence of length \`k + 1\` seen so far. For each new number, find the
first spot in "tails" it can replace (the first tail value that's not
smaller than it) using binary search, since "tails" stays sorted — either
it extends the list (a new longest length found) or it replaces an entry
with a smaller, more promising tail value for that length. The final
length of "tails" is the answer.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Plain Recursion",
        explanation: "For every starting index, recursively try including or skipping each later number (only including ones that keep the sequence increasing), and take the longest result found.",
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
        explanation: "For each index, compute the longest increasing subsequence ending exactly there, by checking every earlier index with a smaller value.",
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
        explanation: "Maintain the smallest possible tail value for an increasing subsequence of each length seen so far, and use binary search to find where each new number fits in — either extending the longest subsequence found, or improving a shorter one's tail.",
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
          { code: "else { tails[low] = num; }", explanation: "Otherwise, num replaces a tail value at the length it would fit, giving future numbers a smaller (more extendable) value to build on. This never changes the true tails length, only makes it more useful." },
          { code: "return tails.length;", explanation: "The length of 'tails' always equals the length of the longest increasing subsequence found so far." },
        ],
      },
    ],
    relatedProblems: [],
    keywords: ["dynamic programming", "longest increasing subsequence", "binary search", "patience sorting"],
  },
];
