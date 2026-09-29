import type { Problem } from "../../types/problem";

export const slidingWindowProblems: Problem[] = [
  {
    id: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    category: "sliding-window",
    description: `
You're given a list of prices, where \`prices[i]\` is the price of a stock
on day \`i\`. You're allowed to buy the stock on exactly one day, and then
sell it on a *later* day.

Find the maximum profit you could make. If no choice of buy/sell days
would make a profit, return \`0\` (you're allowed to simply not trade).
    `.trim(),
    examples: [
      {
        input: "prices = [7, 1, 5, 3, 6, 4]",
        output: "5",
        explanation: "Buy on day 1 (price 1) and sell on day 4 (price 6). Profit = 6 - 1 = 5.",
      },
      {
        input: "prices = [7, 6, 4, 3, 1]",
        output: "0",
        explanation: "Prices only ever go down, so no trade makes a profit — best to not trade at all.",
      },
      {
        input: "prices = [2, 4, 1]",
        output: "2",
        explanation: "Buy on day 0 (price 2) and sell on day 1 (price 4). Profit = 2. Buying on day 2 is too late to sell for a profit.",
      },
    ],
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    hints: [
      "For any day you consider selling, what's the best day you could have bought on before it?",
      "You don't need to re-scan all earlier days for every sell day — what single number about the past would you need to remember as you go?",
      "Keep a running 'lowest price seen so far' as you scan left to right, and compare today's price against it.",
    ],
    approachOverview: `
The brute-force idea is to try every possible pair of a buy day and a
later sell day, compute the profit for each pair, and keep the best one.
That checks every pair, which is a lot of repeated work.

A much faster approach scans the prices once, left to right, while
keeping track of two things: the lowest price seen *so far*, and the best
profit found *so far*. On each day, you first check "if I sold today,
having bought at the cheapest price I've seen, what would my profit be?"
and update the best profit if that's better. Then you update the lowest
price if today's price is even lower. By the end of one pass, you've
considered every valid buy-then-sell pair without ever looking backwards.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Every Buy/Sell Pair",
        explanation: "Try every day as a potential buy day, and every later day as a potential sell day, tracking the best profit seen. Correct, but it re-examines the same days over and over.",
        code: `function maxProfit(prices) {
  let best = 0;

  for (let buy = 0; buy < prices.length; buy++) {
    for (let sell = buy + 1; sell < prices.length; sell++) {
      const profit = prices[sell] - prices[buy];
      if (profit > best) {
        best = profit;
      }
    }
  }

  return best;
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal — Track the Running Minimum",
        explanation: "Walk through the prices once. Keep the lowest price seen so far as the best possible buy point, and at each day check what profit selling today would give against that minimum, updating the best answer as you go.",
        code: `function maxProfit(prices) {
  let minPrice = Infinity;
  let best = 0;

  for (const price of prices) {
    if (price < minPrice) {
      minPrice = price;
    } else if (price - minPrice > best) {
      best = price - minPrice;
    }
  }

  return best;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let minPrice = Infinity;", explanation: "Starts with no valid buy price seen yet, so anything will be lower." },
          { code: "let best = 0;", explanation: "No trade made yet, so the best profit so far is zero." },
          { code: "if (price < minPrice) {", explanation: "If today is the cheapest day seen so far, it becomes the new best place to have bought." },
          { code: "} else if (price - minPrice > best) {", explanation: "Otherwise, check what profit selling today would give if bought at the cheapest price seen — and keep it if it beats the current best." },
          { code: "return best;", explanation: "After one pass, every possible buy-then-sell pair has effectively been considered." },
        ],
      },
    ],
    relatedProblems: ["longest-substring-without-repeating-characters"],
    keywords: ["stock", "max profit", "sliding window", "one pass", "running minimum"],
  },

  {
    id: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    category: "sliding-window",
    description: `
You're given a string. Find the length of the longest substring (a
*contiguous* run of characters, not just any subset) that contains no
repeated characters.
    `.trim(),
    examples: [
      {
        input: 's = "abcabcbb"',
        output: "3",
        explanation: 'The longest run with no repeats is "abc", which has length 3.',
      },
      {
        input: 's = "bbbbb"',
        output: "1",
        explanation: 'Every character repeats immediately, so the best you can do is a single character, "b".',
      },
      {
        input: 's = "pwwkew"',
        output: "3",
        explanation: '"wke" is the longest substring without repeats. Note "pwke" is not a valid answer because it is not contiguous in the original string.',
      },
    ],
    constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols, and spaces."],
    hints: [
      "Think of a window that expands to the right as long as it stays valid, and shrinks from the left the moment it becomes invalid.",
      "How would you instantly check whether the character you're about to add is already inside the current window?",
      "A hash set (or a map from character to its most recent index) lets you both detect repeats instantly and jump the left edge of the window forward efficiently.",
    ],
    approachOverview: `
A brute-force approach would check every possible substring, and for each
one scan it to see if it has repeated characters. That's a lot of
redundant scanning since substrings overlap heavily.

Instead, use a sliding window: keep two pointers, \`left\` and \`right\`,
marking the current substring, plus a set of the characters currently
inside that window. Move \`right\` forward one step at a time, adding
characters to the set. If the character you're adding is already in the
set, that means the window has a duplicate — so shrink the window from
the left, removing characters, until the duplicate is gone. At every
step, the window is duplicate-free, so its length is a candidate answer.
This way each character is added and removed from the window at most
once, giving a single pass overall.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Substring",
        explanation: "Try every start and end position, and for each candidate substring scan it to check whether all characters are unique. Simple, but re-scans overlapping substrings many times.",
        code: `function lengthOfLongestSubstring(s) {
  let best = 0;

  for (let start = 0; start < s.length; start++) {
    const seen = new Set();
    for (let end = start; end < s.length; end++) {
      if (seen.has(s[end])) {
        break;
      }
      seen.add(s[end]);
      best = Math.max(best, end - start + 1);
    }
  }

  return best;
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(min(n, alphabet size))",
      },
      {
        approach: "Optimal — Sliding Window with a Set",
        explanation: "Grow the window by moving the right edge forward. Whenever the incoming character is already inside the window, shrink from the left until it isn't a duplicate anymore, then keep going.",
        code: `function lengthOfLongestSubstring(s) {
  const window = new Set();
  let left = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    while (window.has(s[right])) {
      window.delete(s[left]);
      left++;
    }
    window.add(s[right]);
    best = Math.max(best, right - left + 1);
  }

  return best;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(min(n, alphabet size))",
        walkthrough: [
          { code: "const window = new Set();", explanation: "Holds exactly the characters currently between left and right, with no duplicates." },
          { code: "for (let right = 0; right < s.length; right++) {", explanation: "Grows the window one character at a time from the right." },
          { code: "while (window.has(s[right])) {", explanation: "If the new character is already in the window, the window currently has a duplicate to remove." },
          { code: "window.delete(s[left]); left++;", explanation: "Shrinks from the left, discarding characters, until the duplicate is gone." },
          { code: "window.add(s[right]);", explanation: "Now it's safe to add the new character — the window is duplicate-free again." },
          { code: "best = Math.max(best, right - left + 1);", explanation: "Records the window's length as a candidate for the longest valid substring." },
        ],
      },
    ],
    relatedProblems: ["longest-repeating-character-replacement", "permutation-in-string", "minimum-window-substring", "find-all-anagrams-in-a-string"],
    keywords: ["sliding window", "substring", "unique characters", "two pointers", "hash set"],
  },

  {
    id: "longest-repeating-character-replacement",
    title: "Longest Repeating Character Replacement",
    difficulty: "Medium",
    category: "sliding-window",
    description: `
You're given a string made of uppercase letters and a number \`k\`. You're
allowed to pick up to \`k\` characters anywhere in the string and change
each of them to any other letter you like.

After making at most \`k\` such changes, find the length of the longest
substring that consists of a single repeated letter (like \`"AAAA"\`).
    `.trim(),
    examples: [
      { input: 's = "ABAB", k = 2', output: "4", explanation: 'Change both "B"s to "A" (or both "A"s to "B") to get "AAAA" or "BBBB", length 4.' },
      {
        input: 's = "AABABBA", k = 1',
        output: "4",
        explanation: 'Change the one "B" inside "ABAB" (positions 1-4, "ABAB") to get "AAAA", giving a substring of length 4. The final "A" can\'t be joined without another change.',
      },
      { input: 's = "AAAA", k = 0', output: "4", explanation: "No changes needed or allowed — the whole string is already one repeated letter." },
    ],
    constraints: ["1 <= s.length <= 10^5", "s consists of only uppercase English letters.", "0 <= k <= s.length"],
    hints: [
      "For a candidate window, if you kept the most common letter in it and changed everything else, how many changes would that take?",
      "A window is 'achievable' exactly when (window length) - (count of its most frequent letter) <= k. Try growing a window and shrinking it only when that stops being true.",
      "You don't need the frequency count to be perfectly up to date when shrinking — even a slightly stale 'best frequency seen so far' is enough to let the window only ever grow or stay the same size, never truly shrink the best answer.",
    ],
    approachOverview: `
The brute-force way is to check every substring, and for each one count
how many characters differ from its most frequent letter — that count is
exactly how many replacements it would take. If that count is at most
\`k\`, the substring is achievable, so track the longest one you find.
That means re-counting letter frequencies for overlapping substrings
again and again.

A sliding window does much better. Grow a window from left to right,
keeping a running count of how often each letter appears inside it.
A window of length \`L\` needs \`L - (count of its most frequent letter)\`
replacements to become a single repeated letter, since every character
other than the most common one has to change. As long as that number is
\`<= k\`, the window is valid, so let it keep growing. The moment it isn't
valid, shrink from the left by one. The window's length only ever grows
or holds steady as it slides — it can be shown that it never needs to
shrink below the best length already found, so tracking the maximum
window length seen is enough to get the right answer.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Substring",
        explanation: "For every substring, count how many characters are not the most frequent letter in it — that's the number of replacements needed — and check it against k.",
        code: `function characterReplacement(s, k) {
  let best = 0;

  for (let start = 0; start < s.length; start++) {
    const counts = {};
    let maxCount = 0;

    for (let end = start; end < s.length; end++) {
      counts[s[end]] = (counts[s[end]] || 0) + 1;
      maxCount = Math.max(maxCount, counts[s[end]]);

      const length = end - start + 1;
      const replacementsNeeded = length - maxCount;

      if (replacementsNeeded <= k) {
        best = Math.max(best, length);
      }
    }
  }

  return best;
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(26) — constant, one count per letter",
      },
      {
        approach: "Optimal — Sliding Window with Max Frequency",
        explanation: "Grow the window while tracking letter counts and the highest frequency seen in it. If the window ever needs more than k replacements, shrink it from the left by one. The window's size only ever grows over the whole scan, so its final size is the answer.",
        code: `function characterReplacement(s, k) {
  const counts = {};
  let left = 0;
  let maxCount = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    counts[s[right]] = (counts[s[right]] || 0) + 1;
    maxCount = Math.max(maxCount, counts[s[right]]);

    const windowLength = right - left + 1;
    if (windowLength - maxCount > k) {
      counts[s[left]]--;
      left++;
    }

    best = Math.max(best, right - left + 1);
  }

  return best;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(26) — constant, one count per uppercase letter",
        walkthrough: [
          { code: "counts[s[right]] = (counts[s[right]] || 0) + 1;", explanation: "Adds the new right-edge character to the window's letter counts." },
          { code: "maxCount = Math.max(maxCount, counts[s[right]]);", explanation: "Tracks the highest single-letter frequency seen in any window so far (it's fine if this is slightly stale after a shrink)." },
          { code: "if (windowLength - maxCount > k) {", explanation: "Checks if turning this window into one repeated letter would take more than k changes." },
          { code: "counts[s[left]]--; left++;", explanation: "If it would take too many changes, shrink the window by dropping its leftmost character." },
          { code: "best = Math.max(best, right - left + 1);", explanation: "Records the current window's length as a candidate answer — the window never truly shrinks below the best found." },
        ],
      },
    ],
    relatedProblems: ["longest-substring-without-repeating-characters", "permutation-in-string"],
    keywords: ["sliding window", "character replacement", "max frequency", "string"],
  },

  {
    id: "permutation-in-string",
    title: "Permutation in String",
    difficulty: "Medium",
    category: "sliding-window",
    description: `
You're given two strings, \`s1\` and \`s2\`. Check whether \`s2\` contains a
*permutation* of \`s1\` as a contiguous substring — in other words, whether
some contiguous run of \`s2\` uses exactly the same letters, with exactly
the same counts, as \`s1\`, just possibly in a different order.

Return \`true\` if such a substring exists, and \`false\` otherwise.
    `.trim(),
    examples: [
      {
        input: 's1 = "ab", s2 = "eidbaooo"',
        output: "true",
        explanation: '"ba" is a substring of s2, and it is a rearrangement of "ab".',
      },
      {
        input: 's1 = "ab", s2 = "eidboaoo"',
        output: "false",
        explanation: 'No contiguous substring of s2 has exactly one "a" and one "b".',
      },
      {
        input: 's1 = "adc", s2 = "dcda"',
        output: "true",
        explanation: '"dca" (positions 0-2 of s2) uses the same letters as "adc".',
      },
    ],
    constraints: ["1 <= s1.length, s2.length <= 10^4", "s1 and s2 consist of lowercase English letters."],
    hints: [
      "A permutation of s1 is just any rearrangement of its letters — so you're really looking for any window in s2 of length s1.length whose letter counts exactly match s1's letter counts.",
      "Since every window you check has the same fixed length, you can slide it one step at a time rather than trying every start position from scratch.",
      "When you slide the window by one, only one letter leaves and one enters — update the counts incrementally instead of recounting the whole window each time.",
    ],
    approachOverview: `
Since a permutation just rearranges the same letters, this problem is
really: does \`s2\` contain any contiguous window, the same length as
\`s1\`, whose letter counts exactly match \`s1\`'s letter counts?

The brute-force approach checks every window of that fixed length by
building a fresh count of its letters and comparing it to \`s1\`'s counts —
that recomputation is wasteful since neighboring windows overlap almost
entirely.

A sliding window fixes this: build the letter counts for \`s1\` once, and
for the first window of \`s2\`. Then slide the window one step at a time —
each slide removes exactly one letter (the one falling off the left) and
adds exactly one letter (the one entering on the right), so the counts
can be updated incrementally instead of recomputed. After each slide,
compare the window's counts to \`s1\`'s counts; if they ever match exactly,
a valid permutation has been found.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recount Every Window",
        explanation: "For every possible window of s2 with the same length as s1, build its letter counts from scratch and compare them against s1's counts.",
        code: `function checkInclusion(s1, s2) {
  const need = buildCounts(s1);
  const windowSize = s1.length;

  for (let start = 0; start + windowSize <= s2.length; start++) {
    const have = buildCounts(s2.slice(start, start + windowSize));
    if (sameCounts(need, have)) {
      return true;
    }
  }

  return false;
}

function buildCounts(str) {
  const counts = {};
  for (const ch of str) {
    counts[ch] = (counts[ch] || 0) + 1;
  }
  return counts;
}

function sameCounts(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] || 0) !== (b[key] || 0)) {
      return false;
    }
  }
  return true;
}`,
        timeComplexity: "O(n * m) — n windows, each costing O(m) to build and compare, m = s1.length",
        spaceComplexity: "O(26) per window — constant, one count per lowercase letter",
      },
      {
        approach: "Optimal — Fixed-Size Sliding Window",
        explanation: "Keep one running count array for the current window in s2, updated incrementally as the window slides by one position at a time, and compare it to s1's counts after each slide.",
        code: `function checkInclusion(s1, s2) {
  if (s1.length > s2.length) return false;

  const need = new Array(26).fill(0);
  const have = new Array(26).fill(0);
  const base = "a".charCodeAt(0);

  for (let i = 0; i < s1.length; i++) {
    need[s1.charCodeAt(i) - base]++;
    have[s2.charCodeAt(i) - base]++;
  }

  if (matches(need, have)) return true;

  for (let right = s1.length; right < s2.length; right++) {
    have[s2.charCodeAt(right) - base]++;
    const left = right - s1.length;
    have[s2.charCodeAt(left) - base]--;

    if (matches(need, have)) return true;
  }

  return false;
}

function matches(a, b) {
  for (let i = 0; i < 26; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}`,
        timeComplexity: "O(n + m) — n = s2.length, m = s1.length, since the letter comparison is a constant 26 slots",
        spaceComplexity: "O(26) — constant, two fixed-size count arrays",
        walkthrough: [
          { code: "for (let i = 0; i < s1.length; i++) { need[...]++; have[...]++; }", explanation: "Builds the target counts for s1 once, and the counts for the very first window of s2 of the same length." },
          { code: "if (matches(need, have)) return true;", explanation: "Checks the first window immediately, before sliding at all." },
          { code: "have[s2.charCodeAt(right) - base]++;", explanation: "Slides the window forward by including the new character on the right." },
          { code: "have[s2.charCodeAt(left) - base]--;", explanation: "And removing the character that just fell off the left, keeping the window a fixed size." },
          { code: "if (matches(need, have)) return true;", explanation: "Compares the updated window counts to s1's counts after every slide." },
        ],
      },
    ],
    relatedProblems: ["longest-substring-without-repeating-characters", "find-all-anagrams-in-a-string", "minimum-window-substring"],
    keywords: ["sliding window", "anagram", "permutation", "fixed window", "letter counts"],
  },

  {
    id: "find-all-anagrams-in-a-string",
    title: "Find All Anagrams in a String",
    difficulty: "Medium",
    category: "sliding-window",
    description: `
You're given a string \`s\` and a shorter pattern string \`p\`. Find every
starting index in \`s\` where a substring begins that is an *anagram* of
\`p\` — meaning it uses exactly the same letters, with exactly the same
counts, just possibly in a different order.

Return all such starting indices, in any order.
    `.trim(),
    examples: [
      {
        input: 's = "cbaebabacd", p = "abc"',
        output: "[0, 6]",
        explanation: 'The substring starting at index 0 is "cba" (an anagram of "abc"), and the one starting at index 6 is "bac" (also an anagram).',
      },
      {
        input: 's = "abab", p = "ab"',
        output: "[0, 1, 2]",
        explanation: 'Substrings "ab" (index 0), "ba" (index 1), and "ab" (index 2) are all anagrams of "ab".',
      },
      { input: 's = "af", p = "be"', output: "[]", explanation: "No substring of s of length 2 uses the same letters as \"be\"." },
    ],
    constraints: ["1 <= s.length, p.length <= 3 * 10^4", "s and p consist of lowercase English letters."],
    hints: [
      "This is the same underlying question as checking whether one string contains a permutation of another — except here you need every match, not just whether one exists.",
      "Every window you'll ever check has the same fixed length, p.length — slide it across s one step at a time instead of rebuilding it from scratch.",
      "Keep a running letter-count for the current window, updating it by one letter in and one letter out on each slide, and compare it to p's letter-count after every slide.",
    ],
    approachOverview: `
This is essentially "Permutation in String," but instead of stopping at
the first match, every matching starting index needs to be collected.

Build the letter counts for \`p\` once, and the counts for the first
window of \`s\` (of the same length as \`p\`). Slide that window across
\`s\` one character at a time: each slide adds the new character on the
right and removes the one falling off the left, so the counts update in
constant time rather than being recomputed. After every slide (including
the very first window), compare the window's counts to \`p\`'s counts —
whenever they match exactly, the window's starting index is an anagram
match, so record it.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recount Every Window",
        explanation: "For every window of s the same length as p, build its letter counts from scratch and compare them to p's counts, collecting every start index that matches.",
        code: `function findAnagrams(s, p) {
  const result = [];
  const need = buildCounts(p);
  const windowSize = p.length;

  for (let start = 0; start + windowSize <= s.length; start++) {
    const have = buildCounts(s.slice(start, start + windowSize));
    if (sameCounts(need, have)) {
      result.push(start);
    }
  }

  return result;
}

function buildCounts(str) {
  const counts = {};
  for (const ch of str) {
    counts[ch] = (counts[ch] || 0) + 1;
  }
  return counts;
}

function sameCounts(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] || 0) !== (b[key] || 0)) return false;
  }
  return true;
}`,
        timeComplexity: "O(n * m) — n windows, each costing O(m) to build and compare, m = p.length",
        spaceComplexity: "O(26) per window comparison",
      },
      {
        approach: "Optimal — Fixed-Size Sliding Window",
        explanation: "Maintain one running count array for the current window, updated by adding and removing a single letter as the window slides, and check it against p's counts after each slide.",
        code: `function findAnagrams(s, p) {
  const result = [];
  if (p.length > s.length) return result;

  const need = new Array(26).fill(0);
  const have = new Array(26).fill(0);
  const base = "a".charCodeAt(0);

  for (let i = 0; i < p.length; i++) {
    need[p.charCodeAt(i) - base]++;
    have[s.charCodeAt(i) - base]++;
  }

  if (matches(need, have)) result.push(0);

  for (let right = p.length; right < s.length; right++) {
    have[s.charCodeAt(right) - base]++;
    const left = right - p.length;
    have[s.charCodeAt(left) - base]--;

    if (matches(need, have)) {
      result.push(left + 1);
    }
  }

  return result;
}

function matches(a, b) {
  for (let i = 0; i < 26; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}`,
        timeComplexity: "O(n + m) — n = s.length, m = p.length, comparisons are a constant 26 slots",
        spaceComplexity: "O(26) — constant, two fixed-size count arrays",
        walkthrough: [
          { code: "for (let i = 0; i < p.length; i++) { need[...]++; have[...]++; }", explanation: "Builds p's target counts once, and the counts for the first window of s." },
          { code: "if (matches(need, have)) result.push(0);", explanation: "The very first window starts at index 0, so it's checked before any sliding happens." },
          { code: "have[s.charCodeAt(right) - base]++;", explanation: "Slides forward by including the new right-edge character." },
          { code: "have[s.charCodeAt(left) - base]--;", explanation: "And excluding the character that just fell off the left edge." },
          { code: "if (matches(need, have)) { result.push(left + 1); }", explanation: "The new window now starts at left + 1 — record it if its counts match p's." },
        ],
      },
    ],
    relatedProblems: ["permutation-in-string", "longest-substring-without-repeating-characters", "minimum-window-substring"],
    keywords: ["sliding window", "anagram", "fixed window", "letter counts", "string"],
  },

  {
    id: "minimum-window-substring",
    title: "Minimum Window Substring",
    difficulty: "Hard",
    category: "sliding-window",
    description: `
You're given two strings, \`s\` and \`t\`. Find the *shortest* contiguous
substring of \`s\` that contains every character in \`t\`, including
matching each character's count (if \`t\` has two \`"a"\`s, the substring
must contain at least two \`"a"\`s too).

Return that shortest substring. If no such substring exists, return an
empty string. If multiple shortest substrings tie, returning any one of
them is fine.
    `.trim(),
    examples: [
      {
        input: 's = "ADOBECODEBANC", t = "ABC"',
        output: '"BANC"',
        explanation: '"BANC" contains one A, one B, and one C — the minimum-length window in s that covers all of "ABC".',
      },
      { input: 's = "a", t = "a"', output: '"a"', explanation: "The whole string already matches exactly." },
      { input: 's = "a", t = "aa"', output: '""', explanation: "t needs two a's, but s only has one, so no valid window exists." },
    ],
    constraints: [
      "1 <= s.length, t.length <= 10^5",
      "s and t consist of English letters (upper and/or lower case).",
      "There is guaranteed to be at least one valid answer, or the correct result is an empty string.",
    ],
    hints: [
      "Think of a window that grows until it satisfies every required character, and then shrinks as much as possible while staying valid.",
      "Track how many of each required character the window currently has, plus a single running counter for 'how many distinct required characters are fully satisfied right now' — that avoids rescanning all counts on every step.",
      "Once the window is valid, greedily shrink from the left (recording the window if it's the best so far) until it stops being valid, then go back to growing from the right.",
    ],
    approachOverview: `
The brute-force approach checks every possible substring of \`s\`, and for
each one verifies whether it contains enough of every character required
by \`t\`. That means re-scanning overlapping substrings again and again,
and doing a full comparison against \`t\`'s requirements each time.

A sliding window is far more efficient. Keep a count of how many of each
character \`t\` requires, and a matching count for what the current window
actually has. Grow the window from the right, and every time a character
reaches exactly the count \`t\` needs for it, mark one more requirement as
"satisfied." Once *all* requirements are satisfied, the window is valid —
at that point, try shrinking it from the left as far as possible (each
shrink might record a new best answer) until it becomes invalid again
(a requirement drops below what's needed). Then resume growing from the
right. Tracking a single "how many requirements are satisfied" counter,
rather than re-checking every character's count each time, keeps each
step of the process fast — every character is added to and removed from
the window at most once overall.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Substring",
        explanation: "For every possible start and end position, build the substring's character counts and check whether it covers every requirement of t, tracking the shortest one that works.",
        code: `function minWindow(s, t) {
  if (t.length > s.length) return "";

  const need = buildCounts(t);
  let best = "";

  for (let start = 0; start < s.length; start++) {
    const have = {};
    for (let end = start; end < s.length; end++) {
      have[s[end]] = (have[s[end]] || 0) + 1;

      if (covers(need, have)) {
        const candidate = s.slice(start, end + 1);
        if (best === "" || candidate.length < best.length) {
          best = candidate;
        }
        break; // no need to extend this start further once it's valid
      }
    }
  }

  return best;
}

function buildCounts(str) {
  const counts = {};
  for (const ch of str) counts[ch] = (counts[ch] || 0) + 1;
  return counts;
}

function covers(need, have) {
  for (const ch in need) {
    if ((have[ch] || 0) < need[ch]) return false;
  }
  return true;
}`,
        timeComplexity: "O(n² * k) — n² substrings in the worst case, k = distinct characters in t for each coverage check",
        spaceComplexity: "O(k) for the character count maps",
      },
      {
        approach: "Optimal — Sliding Window with a Satisfied-Count",
        explanation: "Grow the window until every character requirement from t is met, tracked with a single counter instead of rechecking all counts. Then shrink from the left as far as possible, recording the best window at each valid point, before growing again.",
        code: `function minWindow(s, t) {
  if (t.length > s.length) return "";

  const need = {};
  for (const ch of t) need[ch] = (need[ch] || 0) + 1;
  const required = Object.keys(need).length;

  const have = {};
  let satisfied = 0;
  let left = 0;
  let bestLen = Infinity;
  let bestStart = 0;

  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    have[ch] = (have[ch] || 0) + 1;

    if (need[ch] !== undefined && have[ch] === need[ch]) {
      satisfied++;
    }

    while (satisfied === required) {
      if (right - left + 1 < bestLen) {
        bestLen = right - left + 1;
        bestStart = left;
      }

      const leftChar = s[left];
      have[leftChar]--;
      if (need[leftChar] !== undefined && have[leftChar] < need[leftChar]) {
        satisfied--;
      }
      left++;
    }
  }

  return bestLen === Infinity ? "" : s.slice(bestStart, bestStart + bestLen);
}`,
        timeComplexity: "O(n + m) — n = s.length, m = t.length; each index enters and leaves the window at most once",
        spaceComplexity: "O(k) — k = distinct characters in t",
        walkthrough: [
          { code: "for (const ch of t) need[ch] = (need[ch] || 0) + 1;", explanation: "Records exactly how many of each character t requires." },
          { code: "const required = Object.keys(need).length;", explanation: "Counts how many distinct characters need to be fully satisfied for the window to be valid." },
          { code: "if (need[ch] !== undefined && have[ch] === need[ch]) { satisfied++; }", explanation: "The moment a character's count in the window exactly reaches what's needed, one more requirement becomes satisfied." },
          { code: "while (satisfied === required) {", explanation: "Once every requirement is met, the window is valid — try to shrink it as much as possible." },
          { code: "if (right - left + 1 < bestLen) { bestLen = ...; bestStart = left; }", explanation: "Every time the window is valid, it's a candidate for the shortest window found so far." },
          { code: "have[leftChar]--; if (... have[leftChar] < need[leftChar]) satisfied--;", explanation: "Removing the leftmost character might drop a requirement below what's needed, which ends the shrinking phase." },
        ],
      },
    ],
    relatedProblems: ["longest-substring-without-repeating-characters", "permutation-in-string", "find-all-anagrams-in-a-string"],
    keywords: ["sliding window", "substring", "minimum window", "two pointers", "hard"],
  },

  {
    id: "sliding-window-maximum",
    title: "Sliding Window Maximum",
    difficulty: "Hard",
    category: "sliding-window",
    description: `
You're given a list of numbers and a window size \`k\`. Imagine a window
of size \`k\` that starts at the beginning of the list and slides one step
to the right at a time, all the way to the end.

For every position of that window, find the maximum value inside it, and
return the list of all those maximums, in order.
    `.trim(),
    examples: [
      {
        input: "nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3",
        output: "[3, 3, 5, 5, 6, 7]",
        explanation: "The first window [1,3,-1] has max 3, the next [3,-1,-3] has max 3, then [-1,-3,5] has max 5, and so on.",
      },
      { input: "nums = [1], k = 1", output: "[1]", explanation: "Only one window, containing the single element." },
      {
        input: "nums = [9, 11], k = 2",
        output: "[11]",
        explanation: "Only one window fits (size 2 over a list of length 2), and its maximum is 11.",
      },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "1 <= k <= nums.length"],
    hints: [
      "Recomputing the max of the whole window every time it slides works, but it repeats a lot of comparisons between consecutive windows.",
      "Think about which numbers in the current window could still possibly become the maximum of some *future* window — a number that's smaller than a more-recent number in the window can never be the max again, no matter how far the window slides.",
      "Keep a structure (a deque) of candidate indices in decreasing order of their values — the front is always the current window's max, and you can drop indices from the back whenever a bigger number arrives.",
    ],
    approachOverview: `
The direct approach is: for every window position, look at all \`k\`
elements inside it and find the maximum. That's correct, but it repeats
a huge amount of comparison work, since each element gets re-compared in
every window it belongs to.

The key insight for the fast approach: once a number in the window is
smaller than some more-recent number also in the window, that older,
smaller number can *never* become the maximum of any future window — the
more recent, larger number will always still be in the window (or the
window will have moved past both). So it can be safely thrown away.

This suggests keeping a deque (a list you can add/remove from both ends)
of *indices*, kept in an order where their corresponding values are
strictly decreasing from front to back. When a new number comes in from
the right, remove indices from the back of the deque whose values are
smaller than the new number (they'll never matter again), then add the
new index. Also remove the front index if it has slid outside the
current window. After each such update, the value at the front of the
deque is exactly the maximum of the current window. Every index is added
and removed from the deque at most once, so the whole scan is a single
pass.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Scan Every Window",
        explanation: "For each window position, look at all k elements inside it directly to find the maximum.",
        code: `function maxSlidingWindow(nums, k) {
  const result = [];

  for (let start = 0; start + k <= nums.length; start++) {
    let windowMax = -Infinity;
    for (let i = start; i < start + k; i++) {
      windowMax = Math.max(windowMax, nums[i]);
    }
    result.push(windowMax);
  }

  return result;
}`,
        timeComplexity: "O(n * k)",
        spaceComplexity: "O(1) extra, aside from the output list",
      },
      {
        approach: "Optimal — Monotonic Decreasing Deque",
        explanation: "Keep a deque of indices whose values are strictly decreasing from front to back. The front index is always the current window's maximum. Drop smaller values from the back before adding a new one, and drop the front once it slides out of the window.",
        code: `function maxSlidingWindow(nums, k) {
  const deque = []; // stores indices, values decreasing front to back
  const result = [];

  for (let i = 0; i < nums.length; i++) {
    // Remove indices from the back whose values can't beat the new number
    while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
      deque.pop();
    }
    deque.push(i);

    // Remove the front index if it has fallen out of the window
    if (deque[0] <= i - k) {
      deque.shift();
    }

    // Once the first full window is formed, record its maximum
    if (i >= k - 1) {
      result.push(nums[deque[0]]);
    }
  }

  return result;
}`,
        timeComplexity: "O(n) — each index is pushed and popped from the deque at most once",
        spaceComplexity: "O(k) for the deque",
        walkthrough: [
          { code: "while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) { deque.pop(); }", explanation: "Discards any recent-but-smaller candidates from the back — they can never be a window's max once a bigger number has arrived." },
          { code: "deque.push(i);", explanation: "Adds the new index; the deque's values stay strictly decreasing from front to back." },
          { code: "if (deque[0] <= i - k) { deque.shift(); }", explanation: "Drops the front index if it's no longer inside the current window (too far to the left)." },
          { code: "if (i >= k - 1) { result.push(nums[deque[0]]); }", explanation: "Once the window has grown to full size k, the front of the deque holds the current window's maximum." },
        ],
      },
    ],
    relatedProblems: ["minimum-window-substring"],
    keywords: ["sliding window", "monotonic deque", "maximum", "hard", "two pointers"],
  },
];
