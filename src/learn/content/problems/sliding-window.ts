import type { Problem } from "../../types/problem";

export const slidingWindowProblems: Problem[] = [
  {
    id: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    category: "sliding-window",
    description: `
\`prices[i]\` is a stock's price on day \`i\`. You can buy on one day and
sell on a *later* day.

Find the maximum profit. If no trade makes a profit, return \`0\` (you
can choose not to trade).
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
      "For any sell day, what's the best day you could have bought before it?",
      "You don't need to re-scan earlier days for each sell day. What one number about the past should you remember?",
      "Keep a running 'lowest price so far' as you scan left to right, and compare today's price to it.",
    ],
    approachOverview: `
Brute force tries every buy day with every later sell day and keeps the
best profit. That repeats a lot of work.

A faster way scans once, tracking the lowest price *so far* and the best
profit *so far*. Each day, check the profit if you sold today after
buying at the lowest price, and keep it if it's better. Then update the
lowest price if today is lower.

One pass covers every valid buy-then-sell pair without looking back.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Every Buy/Sell Pair",
        explanation: "Try every buy day with every later sell day, tracking the best profit. Correct, but it checks the same days over and over.",
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
        explanation: "Walk the prices once. Keep the lowest price so far as the buy point, and each day check the profit from selling today, updating the best answer.",
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
          { code: "let minPrice = Infinity;", explanation: "No buy price seen yet, so any price will be lower." },
          { code: "let best = 0;", explanation: "No trade yet, so the best profit is zero." },
          { code: "if (price < minPrice) {", explanation: "If today is the cheapest day so far, it becomes the new best buy day." },
          { code: "} else if (price - minPrice > best) {", explanation: "Otherwise, check the profit from selling today at the lowest buy price, and keep it if it's the best." },
          { code: "return best;", explanation: "One pass has covered every buy-then-sell pair." },
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
Given a string, find the length of the longest substring (a
*contiguous* run of characters) with no repeated characters.
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
      "Picture a window that grows to the right while it's valid, and shrinks from the left as soon as it isn't.",
      "How can you instantly check whether the next character is already in the window?",
      "A hash set (or a map from character to its latest index) detects repeats instantly and lets you move the left edge forward efficiently.",
    ],
    approachOverview: `
Brute force checks every substring for repeats. Substrings overlap
heavily, so that's a lot of repeated scanning.

Use a sliding window instead. Pointers \`left\` and \`right\` mark the
current substring, and a set holds its characters. Move \`right\`
forward one step at a time, adding characters to the set.

If the new character is already in the set, shrink from the left until
the duplicate is gone. The window is then duplicate-free, so its length
is a candidate answer. Each character enters and leaves the window at
most once, so it's a single pass.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Substring",
        explanation: "Try every start position and extend until a character repeats. Simple, but re-scans overlapping substrings many times.",
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
        explanation: "Move the right edge forward. If the new character is already in the window, shrink from the left until it isn't, then continue.",
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
          { code: "const window = new Set();", explanation: "Holds the characters between left and right, with no duplicates." },
          { code: "for (let right = 0; right < s.length; right++) {", explanation: "Grows the window one character at a time from the right." },
          { code: "while (window.has(s[right])) {", explanation: "The new character is already in the window, so there's a duplicate to remove." },
          { code: "window.delete(s[left]); left++;", explanation: "Shrinks from the left until the duplicate is gone." },
          { code: "window.add(s[right]);", explanation: "Now the new character can be added safely." },
          { code: "best = Math.max(best, right - left + 1);", explanation: "Records the window's length as a candidate answer." },
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
You're given a string of uppercase letters and a number \`k\`. You can
change up to \`k\` characters to any other letter.

Find the length of the longest substring of one repeated letter (like
\`"AAAA"\`) you can get with at most \`k\` changes.
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
      "If you kept a window's most common letter and changed everything else, how many changes would that take?",
      "A window works when (window length) - (count of its most frequent letter) <= k. Grow the window and shrink it only when that fails.",
      "The frequency count doesn't need to be exact when shrinking. A slightly stale 'best frequency so far' still works, because the window never shrinks below the best answer.",
    ],
    approachOverview: `
Brute force checks every substring and counts how many characters differ
from its most frequent letter. That's the number of replacements needed;
if it's at most \`k\`, the substring works. But it re-counts overlapping
substrings again and again.

A sliding window does better. Grow it left to right, counting each
letter inside. A window of length \`L\` needs
\`L - (count of its most frequent letter)\` replacements, since every
other character must change.

While that's \`<= k\`, keep growing. When it isn't, shrink from the left
by one. The window never needs to shrink below the best length found,
so tracking the largest window seen gives the right answer.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Substring",
        explanation: "For every substring, count the characters that aren't its most frequent letter (the replacements needed) and check that against k.",
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
        explanation: "Grow the window, tracking letter counts and the highest frequency. If it needs more than k replacements, shrink it from the left by one. The window never shrinks overall, so its final size is the answer.",
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
          { code: "counts[s[right]] = (counts[s[right]] || 0) + 1;", explanation: "Adds the new right-edge character to the letter counts." },
          { code: "maxCount = Math.max(maxCount, counts[s[right]]);", explanation: "Tracks the highest single-letter frequency seen so far (it can be slightly stale after a shrink)." },
          { code: "if (windowLength - maxCount > k) {", explanation: "Checks whether this window would need more than k changes." },
          { code: "counts[s[left]]--; left++;", explanation: "If so, drop the leftmost character." },
          { code: "best = Math.max(best, right - left + 1);", explanation: "Records the window's length as a candidate. The window never shrinks below the best found." },
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
Given strings \`s1\` and \`s2\`, check whether \`s2\` contains a
*permutation* of \`s1\` as a contiguous substring: a run with exactly
the same letters and counts as \`s1\`, in any order.

Return \`true\` if it does, and \`false\` otherwise.
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
      "A permutation is any rearrangement of s1's letters. So look for a window in s2 of length s1.length whose letter counts match s1's.",
      "Every window has the same fixed length, so slide it one step at a time instead of starting from scratch at each position.",
      "Each slide moves one letter out and one in. Update the counts instead of recounting the whole window.",
    ],
    approachOverview: `
A permutation just rearranges letters, so the question is: does \`s2\`
have a window, the length of \`s1\`, with the same letter counts as
\`s1\`?

Brute force builds fresh counts for every window and compares them.
That's wasteful, since neighboring windows overlap almost entirely.

A sliding window fixes this. Count \`s1\`'s letters once, and the first
window of \`s2\`. Each slide removes one letter on the left and adds one
on the right, so you update the counts instead of recomputing them.
After each slide, compare to \`s1\`'s counts; a match means you found a
permutation.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recount Every Window",
        explanation: "For every window of s2 the length of s1, build its letter counts from scratch and compare them to s1's counts.",
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
        explanation: "Keep one count array for the current window in s2, update it as the window slides, and compare it to s1's counts after each slide.",
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
          { code: "for (let i = 0; i < s1.length; i++) { need[...]++; have[...]++; }", explanation: "Builds s1's target counts and the counts for s2's first window of the same length." },
          { code: "if (matches(need, have)) return true;", explanation: "Checks the first window before sliding." },
          { code: "have[s2.charCodeAt(right) - base]++;", explanation: "Slides forward by adding the new character on the right." },
          { code: "have[s2.charCodeAt(left) - base]--;", explanation: "Removes the character that fell off the left, keeping the window size fixed." },
          { code: "if (matches(need, have)) return true;", explanation: "Compares the window's counts to s1's after every slide." },
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
Given a string \`s\` and a shorter pattern \`p\`, find every index in
\`s\` where an *anagram* of \`p\` starts. An anagram has exactly the same
letters and counts, in any order.

Return the starting indices in any order.
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
      "This is like checking whether one string contains a permutation of another, but you need every match, not just one.",
      "Every window has the same length, p.length. Slide it across s one step at a time instead of rebuilding it.",
      "Keep letter counts for the current window, updating one letter in and one out per slide, and compare to p's counts after each slide.",
    ],
    approachOverview: `
This is "Permutation in String," but you collect every matching start
index instead of stopping at the first.

Count \`p\`'s letters once, and the first window of \`s\` (same length as
\`p\`). Slide the window one character at a time: add the new character
on the right and remove the one on the left, so counts update in
constant time.

After every slide (and for the first window), compare counts with
\`p\`'s. If they match, record the window's start index.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recount Every Window",
        explanation: "For every window of s the length of p, build its letter counts from scratch, compare to p's, and collect each matching start index.",
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
        explanation: "Keep one count array for the window, add and remove one letter per slide, and compare it to p's counts after each slide.",
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
          { code: "for (let i = 0; i < p.length; i++) { need[...]++; have[...]++; }", explanation: "Builds p's target counts and the counts for the first window of s." },
          { code: "if (matches(need, have)) result.push(0);", explanation: "The first window starts at index 0, so it's checked before sliding." },
          { code: "have[s.charCodeAt(right) - base]++;", explanation: "Slides forward by adding the new right-edge character." },
          { code: "have[s.charCodeAt(left) - base]--;", explanation: "Removes the character that fell off the left edge." },
          { code: "if (matches(need, have)) { result.push(left + 1); }", explanation: "The window now starts at left + 1. Record it if its counts match p's." },
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
Given strings \`s\` and \`t\`, find the *shortest* contiguous substring
of \`s\` that contains every character of \`t\`, with counts (if \`t\` has
two \`"a"\`s, the substring needs at least two).

Return that substring, or an empty string if none exists. If several
tie, return any one.
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
      "Picture a window that grows until it has every required character, then shrinks as much as it can while staying valid.",
      "Track how many of each required character the window has, plus one counter for 'how many distinct required characters are fully met'. That avoids rescanning all counts each step.",
      "Once valid, shrink from the left (recording the window if it's the best so far) until it isn't valid, then grow from the right again.",
    ],
    approachOverview: `
Brute force checks every substring of \`s\` against \`t\`'s
requirements. That re-scans overlapping substrings and does a full
comparison each time.

A sliding window is far faster. Count what \`t\` requires and what the
window has. Grow the window from the right. When a character's count
reaches exactly what \`t\` needs, one more requirement is "satisfied."

Once *all* requirements are satisfied, the window is valid. Shrink it
from the left as far as possible, recording each new best, until a
requirement drops below what's needed. Then grow from the right again.

The single "satisfied" counter avoids rechecking every count, and each
character enters and leaves the window at most once.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Substring",
        explanation: "For every start and end position, build the substring's counts and check whether it covers t, tracking the shortest that works.",
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
        explanation: "Grow the window until every requirement from t is met, tracked with one counter. Then shrink from the left as far as possible, recording the best valid window, before growing again.",
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
          { code: "for (const ch of t) need[ch] = (need[ch] || 0) + 1;", explanation: "Records how many of each character t requires." },
          { code: "const required = Object.keys(need).length;", explanation: "How many distinct characters must be satisfied for a valid window." },
          { code: "if (need[ch] !== undefined && have[ch] === need[ch]) { satisfied++; }", explanation: "When a character's count reaches exactly what's needed, one more requirement is satisfied." },
          { code: "while (satisfied === required) {", explanation: "Every requirement is met, so the window is valid. Shrink it as much as possible." },
          { code: "if (right - left + 1 < bestLen) { bestLen = ...; bestStart = left; }", explanation: "Each valid window is a candidate for the shortest." },
          { code: "have[leftChar]--; if (... have[leftChar] < need[leftChar]) satisfied--;", explanation: "Removing the leftmost character may drop a requirement below what's needed, which ends the shrinking." },
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
You're given a list of numbers and a window size \`k\`. A window of size
\`k\` starts at the beginning and slides right one step at a time to the
end.

Return the maximum value in each window position, in order.
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
      "Recomputing each window's max works, but repeats many comparisons between neighboring windows.",
      "Which numbers could still be the max of a *future* window? A number smaller than a more recent one in the window never can be.",
      "Keep a deque of candidate indices in decreasing order of value. The front is the current max; drop indices from the back when a bigger number arrives.",
    ],
    approachOverview: `
The direct approach scans all \`k\` elements of every window for the
max. It's correct, but each element is compared again in every window
it's part of.

The key insight: if an older number is smaller than a newer one in the
window, it can *never* be the max of a future window. The newer, larger
number stays in the window at least as long. So the older one can be
dropped.

Keep a deque (a list you can add to or remove from at both ends) of
*indices*, with values decreasing from front to back:

- When a new number arrives, pop indices from the back whose values are smaller, then add the new index.
- Remove the front index if it has slid out of the window.
- The front now holds the current window's max.

Each index is added and removed at most once, so it's a single pass.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Scan Every Window",
        explanation: "For each window, check all k elements to find the maximum.",
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
        explanation: "Keep a deque of indices with values decreasing from front to back, so the front is the window's max. Drop smaller values from the back before adding a new one, and drop the front once it leaves the window.",
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
          { code: "while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) { deque.pop(); }", explanation: "Drops smaller candidates from the back. Once a bigger number arrives, they can never be a window's max." },
          { code: "deque.push(i);", explanation: "Adds the new index; values stay decreasing from front to back." },
          { code: "if (deque[0] <= i - k) { deque.shift(); }", explanation: "Drops the front index if it has slid out of the window on the left." },
          { code: "if (i >= k - 1) { result.push(nums[deque[0]]); }", explanation: "Once the window reaches size k, the front of the deque holds its maximum." },
        ],
      },
    ],
    relatedProblems: ["minimum-window-substring"],
    keywords: ["sliding window", "monotonic deque", "maximum", "hard", "two pointers"],
  },
];
