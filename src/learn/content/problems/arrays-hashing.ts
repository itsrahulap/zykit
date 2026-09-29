import type { Problem } from "../../types/problem";

export const arraysHashingProblems: Problem[] = [
  {
    id: "contains-duplicate",
    title: "Contains Duplicate",
    difficulty: "Easy",
    category: "arrays-hashing",
    description: `
You're given a list of numbers. Figure out if any number shows up more
than once anywhere in the list.

Return *true* if at least one value repeats, and *false* if every
number in the list is unique.
    `.trim(),
    examples: [
      { input: "nums = [1, 2, 3, 1]", output: "true", explanation: "The value 1 appears twice - once at index 0 and again at index 3." },
      { input: "nums = [1, 2, 3, 4]", output: "false", explanation: "Every number appears exactly once." },
      { input: "nums = [1, 1, 1, 3, 3, 4, 3, 2, 4, 2]", output: "true", explanation: "Several values (1, 3, 4, 2) each repeat." },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    hints: [
      "The direct approach is to compare every number against every other number - but that gets slow fast. Is there a way to check 'have I seen this before' without rescanning the whole list each time?",
      "Sorting the list first puts equal values right next to each other, so you only need to compare each number to its neighbor.",
      "A hash set lets you record every value you've seen and check membership in a single step, so you never need to look back through the earlier part of the list.",
    ],
    approachOverview: `
The most obvious approach is to compare each number against every other
number in the list, which works but does a lot of repeated comparisons.

A better idea is to sort the list first - once sorted, any duplicate
values end up sitting right next to each other, so a single pass
checking neighbors is enough to catch a repeat.

The fastest approach skips sorting altogether: walk through the list
once, keeping a hash set of every value seen so far. Before adding a
new number, check whether it's already in the set - if it is, you've
found your duplicate immediately.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Check Every Pair",
        explanation: "Compare every number against every number that comes after it. If any pair matches, there's a duplicate. It's simple to reason about, but it looks at every possible pair, so it gets slow as the list grows.",
        code: `function containsDuplicate(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] === nums[j]) {
        return true;
      }
    }
  }
  return false;
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "for (let i = 0; i < nums.length; i++) {", explanation: "Picks a number to compare." },
          { code: "for (let j = i + 1; j < nums.length; j++) {", explanation: "Compares it against every number that comes after it, so each pair is only checked once." },
          { code: "if (nums[i] === nums[j]) return true;", explanation: "As soon as any two numbers match, we know there's a duplicate." },
        ],
      },
      {
        approach: "Better - Sort First",
        explanation: "Sort a copy of the list. Once it's sorted, any two equal values are guaranteed to end up next to each other, so a single pass comparing each element to its neighbor is enough to find a duplicate.",
        code: `function containsDuplicate(nums) {
  const sorted = [...nums].sort((a, b) => a - b);

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1]) {
      return true;
    }
  }

  return false;
}`,
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal - Hash Set",
        explanation: "Walk through the list once. For each number, check whether it's already in a hash set of numbers you've seen so far. If it is, you've found a duplicate immediately; if not, add it and keep going.",
        code: `function containsDuplicate(nums) {
  const seen = new Set();

  for (const num of nums) {
    if (seen.has(num)) {
      return true;
    }
    seen.add(num);
  }

  return false;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "const seen = new Set();", explanation: "Will hold every distinct number encountered so far." },
          { code: "if (seen.has(num)) return true;", explanation: "Checks instantly whether this exact value has already appeared earlier in the list." },
          { code: "seen.add(num);", explanation: "Otherwise, remember it before moving on to the next number." },
        ],
      },
    ],
    relatedProblems: ["majority-element", "valid-anagram"],
    keywords: ["contains duplicate", "hash set", "array", "sorting"],
  },
  {
    id: "valid-anagram",
    title: "Valid Anagram",
    difficulty: "Easy",
    category: "arrays-hashing",
    description: `
You're given two strings. Determine whether the second string is an
*anagram* of the first - meaning it's made of exactly the same letters,
with exactly the same counts, just possibly in a different order.

Return *true* if they're anagrams of each other, and *false* otherwise.
    `.trim(),
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true", explanation: "Both strings contain the same seven letters with the same counts, just rearranged." },
      { input: 's = "rat", t = "car"', output: "false", explanation: "The letters don't match - \"car\" has a c, and \"rat\" doesn't." },
      { input: 's = "a", t = "ab"', output: "false", explanation: "Different lengths can never be anagrams of each other." },
    ],
    constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
    hints: [
      "If two strings are anagrams, what would happen if you rearranged both of their letters into alphabetical order?",
      "Comparing sorted versions of the strings works, but sorting costs time. Is there a way to compare letter counts directly instead?",
      "Count how many times each letter appears in one string, then subtract those counts while scanning the other string. If every count lands back at zero, the strings are anagrams.",
    ],
    approachOverview: `
Two strings are anagrams exactly when they contain the same letters the
same number of times. One straightforward way to check that is to
rearrange (sort) both strings alphabetically - if they're anagrams, the
sorted versions will be identical, character for character.

A faster way avoids sorting entirely: count how many times each letter
appears in the first string, then walk through the second string
subtracting from those counts as you go. If every count lands back at
exactly zero by the end, the strings are anagrams.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Sort and Compare",
        explanation: "If two strings are anagrams, sorting each one's letters alphabetically must produce the exact same string. So sort both strings and compare the results directly.",
        code: `function isAnagram(s, t) {
  if (s.length !== t.length) {
    return false;
  }

  const sSorted = s.split("").sort().join("");
  const tSorted = t.split("").sort().join("");

  return sSorted === tSorted;
}`,
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal - Character Count",
        explanation: "Count how often each letter appears in `s` using a hash map. Then scan through `t`, decreasing the count for each letter it contains. If `t` ever asks for a letter that isn't available, or in a different amount, the strings aren't anagrams.",
        code: `function isAnagram(s, t) {
  if (s.length !== t.length) {
    return false;
  }

  const counts = new Map();

  for (const ch of s) {
    counts.set(ch, (counts.get(ch) || 0) + 1);
  }

  for (const ch of t) {
    if (!counts.has(ch) || counts.get(ch) === 0) {
      return false;
    }
    counts.set(ch, counts.get(ch) - 1);
  }

  return true;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1) - at most 26 lowercase letters, so the map's size is bounded by a constant",
        walkthrough: [
          { code: "for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);", explanation: "Builds a tally of how many times each letter appears in the first string." },
          { code: "if (!counts.has(ch) || counts.get(ch) === 0) return false;", explanation: "If the second string ever needs a letter that's missing, or needs it more times than the first string had it, they can't be anagrams." },
          { code: "counts.set(ch, counts.get(ch) - 1);", explanation: "'Uses up' one occurrence of that letter from the tally." },
          { code: "return true;", explanation: "If we get through all of t without any mismatch, every letter matched up exactly." },
        ],
      },
    ],
    relatedProblems: ["group-anagrams", "contains-duplicate"],
    keywords: ["anagram", "hash map", "sorting", "string"],
  },
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "arrays-hashing",
    description: `
You're given a list of numbers and a target number. Find two *different*
numbers in the list that add up exactly to the target, and return their
positions (indexes) in the list.

You can assume there's always exactly one valid pair, and you can't use
the same element twice.
    `.trim(),
    examples: [
      { input: "nums = [2, 7, 11, 15], target = 9", output: "[0, 1]", explanation: "nums[0] + nums[1] = 2 + 7 = 9." },
      { input: "nums = [3, 2, 4], target = 6", output: "[1, 2]", explanation: "nums[1] + nums[2] = 2 + 4 = 6." },
      { input: "nums = [3, 3], target = 6", output: "[0, 1]" },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i], target <= 10^9",
      "Exactly one valid answer exists.",
    ],
    hints: [
      "For each number, what's the one specific value you'd need to find somewhere else in the list?",
      "Checking every pair works, but it means comparing each number against every other number - is there a faster way to check 'have I seen this value before'?",
      "A hash table (a plain object or a Map) lets you check 'have I seen X' in one step instead of scanning the whole list again.",
    ],
    approachOverview: `
The most direct way to solve this is to check every possible pair of
numbers and see if any pair adds up to the target. That works, but it
means comparing each number against every other number - a lot of
repeated work.

A faster way: as you walk through the list once, ask "what number would
I need to see, together with the one I'm looking at right now, to reach
the target?" If you've already seen that number, you're done. A hash
table lets you check "have I seen this value already" instantly, turning
the problem into a single pass through the list.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Check Every Pair",
        explanation: "Try every pair of numbers and check if they add up to the target. It's the most obvious solution, but it looks at every pair, so it does far more work than necessary as the list grows.",
        code: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "for (let i = 0; i < nums.length; i++) {", explanation: "Picks a first number." },
          { code: "for (let j = i + 1; j < nums.length; j++) {", explanation: "Pairs it with every number after it, so no pair is checked twice." },
          { code: "if (nums[i] + nums[j] === target) {", explanation: "Checks whether this specific pair adds up to the target." },
          { code: "return [i, j];", explanation: "Returns immediately once a valid pair is found." },
        ],
      },
      {
        approach: "Optimal - Hash Map",
        explanation: "Walk through the list once. For each number, check whether the value needed to complete the pair (`target - currentNumber`) has already been seen. A `Map` lets you check that instantly, while remembering every number's position as you go.",
        code: `function twoSum(nums, target) {
  const seen = new Map(); // value -> index

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }

  return [];
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "const seen = new Map();", explanation: "Will remember every number already looked at, and its index." },
          { code: "const complement = target - nums[i];", explanation: "Calculates the exact value that would complete a pair with the current number." },
          { code: "if (seen.has(complement)) {", explanation: "Checks instantly whether that needed value already appeared earlier in the list." },
          { code: "return [seen.get(complement), i];", explanation: "If it has, we're done - return both positions." },
          { code: "seen.set(nums[i], i);", explanation: "Otherwise, remember this number's position before moving to the next one." },
        ],
      },
    ],
    relatedProblems: ["group-anagrams", "contains-duplicate"],
    keywords: ["two sum", "hash map", "complement", "array"],
  },
  {
    id: "group-anagrams",
    title: "Group Anagrams",
    difficulty: "Medium",
    category: "arrays-hashing",
    description: `
You're given a list of strings. Group together every string that's an
anagram of another - meaning they contain exactly the same letters,
just in a different order.

Return the groups as a list of lists. Each input string must end up in
exactly one group, but the groups themselves can come back in any
order, and the strings within a group can be in any order too.
    `.trim(),
    examples: [
      {
        input: 'strs = ["eat", "tea", "tan", "ate", "nat", "bat"]',
        output: '[["eat","tea","ate"], ["tan","nat"], ["bat"]]',
        explanation: '"eat", "tea", and "ate" all use the same three letters. "tan" and "nat" share another set of letters. "bat" doesn\'t match anything else, so it sits alone in its own group.',
      },
      { input: 'strs = [""]', output: '[[""]]', explanation: "A single empty string just forms its own group." },
      { input: 'strs = ["a"]', output: '[["a"]]' },
    ],
    constraints: [
      "1 <= strs.length <= 10^4",
      "0 <= strs[i].length <= 100",
      "strs[i] consists of lowercase English letters.",
    ],
    hints: [
      "Two strings belong in the same group exactly when they're anagrams of each other - how did you check that for just two strings?",
      "Comparing every string against every other string works, but it's a lot of repeated comparisons. Is there a single 'signature' you could compute for a string so that all of its anagrams share that exact signature?",
      "Sorting a string's letters alphabetically gives you such a signature: two strings are anagrams if and only if their sorted forms are identical. Group strings by that sorted form.",
    ],
    approachOverview: `
A direct way to solve this is to go through the strings one at a time,
and for each one, check it against every group formed so far to see if
it belongs there (using the same kind of anagram check you'd use for
two strings). That works, but comparing each new string against every
existing group adds up as the list grows.

A cleaner approach relies on the fact that anagrams, once their letters
are sorted alphabetically, turn into the exact same string. That sorted
string acts as a signature - every anagram of a word shares the same
signature. Using a hash map from signature to the list of original
strings that share it, the whole list can be grouped in a single pass.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Compare Against Existing Groups",
        explanation: "For each string, check it against the first string of every group formed so far. If it's an anagram of that group's representative, add it there; otherwise, start a new group. Checking whether two strings are anagrams is done with a simple letter-count comparison.",
        code: `function groupAnagrams(strs) {
  const groups = [];

  for (const str of strs) {
    let placed = false;

    for (const group of groups) {
      if (isAnagramOf(str, group[0])) {
        group.push(str);
        placed = true;
        break;
      }
    }

    if (!placed) {
      groups.push([str]);
    }
  }

  return groups;
}

function isAnagramOf(a, b) {
  if (a.length !== b.length) return false;

  const counts = {};
  for (const ch of a) counts[ch] = (counts[ch] || 0) + 1;

  for (const ch of b) {
    if (!counts[ch]) return false;
    counts[ch]--;
  }

  return true;
}`,
        timeComplexity: "O(n² · k), where n is the number of strings and k is their max length",
        spaceComplexity: "O(n · k)",
      },
      {
        approach: "Optimal - Sorted String as Hash Key",
        explanation: "For every string, sort its letters alphabetically to build a signature key - anagrams always produce the same key. Use a hash map from that key to the list of original strings sharing it, then return all the map's values as the groups.",
        code: `function groupAnagrams(strs) {
  const groups = new Map();

  for (const str of strs) {
    const key = str.split("").sort().join("");

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(str);
  }

  return Array.from(groups.values());
}`,
        timeComplexity: "O(n · k log k), where n is the number of strings and k is their max length",
        spaceComplexity: "O(n · k)",
        walkthrough: [
          { code: 'const key = str.split("").sort().join("");', explanation: "Turns the string into its sorted-letters signature - every anagram of this string produces this exact same key." },
          { code: "if (!groups.has(key)) groups.set(key, []);", explanation: "The first time a signature is seen, starts a fresh group for it." },
          { code: "groups.get(key).push(str);", explanation: "Adds the original (unsorted) string into its signature's group." },
          { code: "return Array.from(groups.values());", explanation: "The map's values are exactly the groups we need, one per distinct signature." },
        ],
      },
    ],
    relatedProblems: ["valid-anagram", "two-sum"],
    keywords: ["group anagrams", "hash map", "sorting", "signature"],
  },
  {
    id: "top-k-frequent-elements",
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    category: "arrays-hashing",
    description: `
You're given a list of numbers and a number *k*. Find the *k* numbers
that occur most often in the list.

Return them as a list, in any order. You can assume there's always
exactly one valid answer for which values make up the top *k* most
frequent ones.
    `.trim(),
    examples: [
      { input: "nums = [1,1,1,2,2,3], k = 2", output: "[1, 2]", explanation: "1 appears 3 times and 2 appears 2 times - both occur more often than 3, which appears only once." },
      { input: "nums = [1], k = 1", output: "[1]" },
      { input: "nums = [4,4,4,6,6,7], k = 2", output: "[4, 6]", explanation: "4 appears 3 times, 6 appears 2 times - both more often than 7." },
    ],
    constraints: ["1 <= nums.length <= 10^5", "k is always valid: 1 <= k <= number of distinct values in nums."],
    hints: [
      "First figure out how often each number occurs - a hash map is a natural fit for that.",
      "Once you have the counts, sorting all of them by frequency and taking the top k works, but full sorting does more work than you really need.",
      "A frequency can never be higher than the length of the list. What if, instead of sorting, you placed each number into a 'bucket' labeled with its frequency, then read the buckets off from highest frequency down?",
    ],
    approachOverview: `
No matter the approach, the first thing you need is a count of how
often each number appears - a hash map handles that in one pass.

From there, the simplest next step is to sort the numbers by their
frequency and take the top k. That's correct, but full sorting is more
work than this problem actually needs.

A faster approach takes advantage of one fact: a frequency can never be
larger than the length of the list. That means you can create an array
of "buckets," where the bucket at index f holds every number that
occurs exactly f times. Filling the buckets takes one pass; reading
them off from the highest index down, until you've collected k
numbers, gives the answer without ever fully sorting anything.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Sort by Frequency",
        explanation: "Count how often each number occurs using a hash map, then sort those counts from highest to lowest and take the first k numbers.",
        code: `function topKFrequent(nums, k) {
  const counts = new Map();
  for (const num of nums) {
    counts.set(num, (counts.get(num) || 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return sorted.slice(0, k).map((entry) => entry[0]);
}`,
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal - Bucket Sort",
        explanation: "Count how often each number occurs, same as before. Then, instead of sorting, create an array of buckets indexed by frequency - bucket[3] holds every number that appears exactly 3 times, and so on. Reading the buckets from the highest frequency down and collecting numbers gives the top k without any sorting.",
        code: `function topKFrequent(nums, k) {
  const counts = new Map();
  for (const num of nums) {
    counts.set(num, (counts.get(num) || 0) + 1);
  }

  // buckets[freq] = list of numbers that occur exactly "freq" times
  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const [num, freq] of counts.entries()) {
    buckets[freq].push(num);
  }

  const result = [];
  for (let freq = buckets.length - 1; freq >= 1 && result.length < k; freq--) {
    for (const num of buckets[freq]) {
      result.push(num);
      if (result.length === k) break;
    }
  }

  return result;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "const buckets = Array.from({ length: nums.length + 1 }, () => []);", explanation: "Creates one bucket per possible frequency, from 0 up to the length of the list (a number can't occur more times than the list is long)." },
          { code: "buckets[freq].push(num);", explanation: "Drops each distinct number into the bucket matching how many times it occurred." },
          { code: "for (let freq = buckets.length - 1; freq >= 1 && result.length < k; freq--) {", explanation: "Walks the buckets starting from the highest possible frequency, since those hold the most frequent numbers." },
          { code: "for (const num of buckets[freq]) { result.push(num); ... }", explanation: "Collects numbers out of each bucket until exactly k numbers have been gathered." },
        ],
      },
    ],
    relatedProblems: ["group-anagrams", "subarray-sum-equals-k"],
    keywords: ["top k frequent", "bucket sort", "hash map", "frequency"],
  },
  {
    id: "product-of-array-except-self",
    title: "Product of Array Except Self",
    difficulty: "Medium",
    category: "arrays-hashing",
    description: `
You're given a list of numbers. Build a new list where each position
holds the product of *all* the other numbers in the original list -
everything except the number that sits at that position.

You need to do this without using division anywhere (even though
"total product divided by nums[i]" is a tempting shortcut, it breaks
down whenever the list contains a zero).
    `.trim(),
    examples: [
      { input: "nums = [1, 2, 3, 4]", output: "[24, 12, 8, 6]", explanation: "For index 0: 2*3*4 = 24. For index 1: 1*3*4 = 12. And so on for each position." },
      { input: "nums = [-1, 1, 0, -3, 3]", output: "[0, 0, 9, 0, 0]", explanation: "Every position except index 2 includes the 0 from the list in its product, so it comes out to 0. Index 2 excludes that 0, leaving -1 * 1 * -3 * 3 = 9." },
    ],
    constraints: [
      "2 <= nums.length <= 10^5",
      "The product of any prefix or suffix of nums fits in a standard integer range.",
      "You may not use the division operator.",
    ],
    hints: [
      "For a given position, its answer is 'everything to the left of it, multiplied together' times 'everything to the right of it, multiplied together'.",
      "You could compute, for every position, the running product of everything before it in a single left-to-right pass. Where would the 'everything after it' part come from?",
      "Run the same idea again, but from the right-hand side this time, multiplying the running product into what you already have from the left-to-right pass. Two passes, no division.",
    ],
    approachOverview: `
The direct way to think about this problem: the answer at each position
is the product of everything to its left, times the product of
everything to its right. A brute-force solution recomputes that whole
product from scratch for every single position, which means redoing a
lot of the same multiplication over and over.

The efficient version reuses work across positions instead of
recomputing it. In one left-to-right pass, store at each position the
running product of everything that came before it. Then, in a second
right-to-left pass, multiply in the running product of everything that
comes after it. By the end, every position holds exactly the product
of all the other numbers, and division never enters the picture.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Recompute Each Product",
        explanation: "For every position, loop through the entire list again and multiply together every number except the one at that position.",
        code: `function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);

  for (let i = 0; i < n; i++) {
    let product = 1;
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        product *= nums[j];
      }
    }
    result[i] = product;
  }

  return result;
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1) extra space, beyond the output array",
      },
      {
        approach: "Optimal - Prefix and Suffix Products",
        explanation: "In one left-to-right pass, fill the output array with the running product of everything before each position. Then, in a right-to-left pass, multiply in the running product of everything after each position. Combining both gives, for every index, the product of all the other numbers.",
        code: `function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);

  let prefix = 1;
  for (let i = 0; i < n; i++) {
    result[i] = prefix;
    prefix *= nums[i];
  }

  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
  }

  return result;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1) extra space, beyond the output array",
        walkthrough: [
          { code: "let prefix = 1; for (let i = 0; i < n; i++) { result[i] = prefix; prefix *= nums[i]; }", explanation: "Before touching nums[i], result[i] is set to the running product of everything strictly to its left. Only after that does nums[i] get folded into the running product for the next position." },
          { code: "let suffix = 1; for (let i = n - 1; i >= 0; i--) { result[i] *= suffix; suffix *= nums[i]; }", explanation: "Same idea from the right: multiplies into each position the running product of everything strictly to its right, again updating the running product only after using it." },
          { code: "return result;", explanation: "Each position now holds (product of everything left of it) times (product of everything right of it) - exactly the product of every other number." },
        ],
      },
    ],
    relatedProblems: ["subarray-sum-equals-k", "top-k-frequent-elements"],
    keywords: ["product except self", "prefix sum", "suffix product", "array"],
  },
  {
    id: "valid-sudoku",
    title: "Valid Sudoku",
    difficulty: "Medium",
    category: "arrays-hashing",
    description: `
You're given a 9x9 Sudoku board, partially filled in. Each cell either
holds a digit from 1 to 9, or is empty (shown as a "." character).

Determine whether the numbers currently placed on the board follow
Sudoku's placement rules. You are **not** solving or completing the
puzzle - only checking that what's already there doesn't break any
rule:

- No row may contain the same digit more than once.
- No column may contain the same digit more than once.
- No single 3x3 box (the board splits evenly into a 3x3 grid of these) may contain the same digit more than once.

Empty cells are ignored entirely - they never count as a conflict with
anything.
    `.trim(),
    examples: [
      {
        input: "A 9x9 board where every filled row, column, and 3x3 box has no repeated digit",
        output: "true",
      },
      {
        input: "The same board, except the top-left 3x3 box now has two cells both containing '8'",
        output: "false",
        explanation: "Two 8s inside the same 3x3 box violates the box rule, even though the rows and columns are otherwise fine.",
      },
      {
        input: "A board where row 0 contains the digit '3' twice",
        output: "false",
        explanation: "A repeated digit in the same row is a direct violation, regardless of what the columns or boxes look like.",
      },
    ],
    constraints: ["The board is always exactly 9x9.", "Each cell holds a digit '1'-'9' or the character '.'."],
    hints: [
      "You need to check three different kinds of groups - rows, columns, and 3x3 boxes. Start by getting just 'does this one row have a duplicate?' working.",
      "You could check all the rows, then all the columns, then all the boxes, as three separate sweeps over the board - that's correct, but it visits every cell three times.",
      "Every cell belongs to exactly one row, one column, and one box, all at the same time. What if you tracked what's been seen in all three, for every cell, during a single sweep over the board?",
    ],
    approachOverview: `
A natural first attempt is to check each rule separately: sweep across
every row checking for duplicates, then sweep down every column, then
check each of the nine 3x3 boxes. Each sweep uses a set to catch
repeated digits. It's correct, but it looks at the whole board three
separate times.

Since every cell belongs to exactly one row, one column, and one box
all at once, you can fold every check into a single pass. Keep a small
set for each row, each column, and each box (nine of each). Visit each
filled cell exactly once, and check whether its digit already exists in
that cell's row-set, column-set, or box-set - if it does, the board is
invalid. Otherwise, record the digit in all three sets and move on.

The trick that makes box-tracking work is a small formula: for a cell
at row r and column c, its box index is
"Math.floor(r / 3) * 3 + Math.floor(c / 3)" - it maps every cell to one
of the nine boxes, numbered left-to-right, top-to-bottom.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Three Separate Sweeps",
        explanation: "Check the board three times: once sweeping every row for duplicates, once sweeping every column, and once sweeping every 3x3 box. Each sweep uses a fresh set per group to spot a repeated digit.",
        code: `function isValidSudoku(board) {
  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Set();
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val === ".") continue;
      if (seen.has(val)) return false;
      seen.add(val);
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Set();
    for (let r = 0; r < 9; r++) {
      const val = board[r][c];
      if (val === ".") continue;
      if (seen.has(val)) return false;
      seen.add(val);
    }
  }

  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const val = board[boxRow * 3 + i][boxCol * 3 + j];
          if (val === ".") continue;
          if (seen.has(val)) return false;
          seen.add(val);
        }
      }
    }
  }

  return true;
}`,
        timeComplexity: "O(1) - the board is always a fixed 9x9 grid, so the work is bounded by a constant (it visits all 81 cells three separate times)",
        spaceComplexity: "O(1) - each set holds at most 9 digits",
      },
      {
        approach: "Optimal - Single Pass With Row, Column, and Box Sets",
        explanation: "Keep one set per row, one per column, and one per 3x3 box. Sweep the board exactly once - for each filled cell, check its digit against that cell's row, column, and box sets before adding it to all three.",
        code: `function isValidSudoku(board) {
  const rows = Array.from({ length: 9 }, () => new Set());
  const cols = Array.from({ length: 9 }, () => new Set());
  const boxes = Array.from({ length: 9 }, () => new Set());

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val === ".") continue;

      const boxIndex = Math.floor(r / 3) * 3 + Math.floor(c / 3);

      if (rows[r].has(val) || cols[c].has(val) || boxes[boxIndex].has(val)) {
        return false;
      }

      rows[r].add(val);
      cols[c].add(val);
      boxes[boxIndex].add(val);
    }
  }

  return true;
}`,
        timeComplexity: "O(1) - the board is always a fixed 9x9 grid, and this version visits each of the 81 cells only once",
        spaceComplexity: "O(1) - 27 sets total, each holding at most 9 digits",
        walkthrough: [
          { code: "const rows = ...; const cols = ...; const boxes = ...;", explanation: "Sets up one empty tracking set per row, per column, and per 3x3 box - 27 sets in total." },
          { code: "const boxIndex = Math.floor(r / 3) * 3 + Math.floor(c / 3);", explanation: "Maps any (row, column) position to one of the nine boxes, numbered left-to-right and top-to-bottom." },
          { code: "if (rows[r].has(val) || cols[c].has(val) || boxes[boxIndex].has(val)) return false;", explanation: "Checks all three rules for this cell at once - if this digit is already recorded in its row, column, or box, the board is invalid." },
          { code: "rows[r].add(val); cols[c].add(val); boxes[boxIndex].add(val);", explanation: "Records the digit in all three relevant sets before moving to the next cell." },
        ],
      },
    ],
    relatedProblems: ["contains-duplicate", "group-anagrams"],
    keywords: ["valid sudoku", "hash set", "matrix", "board validation"],
  },
  {
    id: "longest-consecutive-sequence",
    title: "Longest Consecutive Sequence",
    difficulty: "Medium",
    category: "arrays-hashing",
    description: `
You're given an unsorted list of integers. Find the length of the
longest run of *consecutive* integers that all appear somewhere in the
list - the numbers don't need to sit next to each other in the list
itself, only be consecutive in value (like 3, 4, 5, 6).

Your solution needs to run in O(n) time, so sorting the list (which
takes longer than that) is a reasonable first attempt, but not the
intended final answer.
    `.trim(),
    examples: [
      { input: "nums = [100, 4, 200, 1, 3, 2]", output: "4", explanation: "The numbers 1, 2, 3, 4 are all present and form a run of consecutive values - the longest one available." },
      { input: "nums = [0, 3, 7, 2, 5, 8, 4, 6, 0, 1]", output: "9", explanation: "0 through 8 are all present (0 shows up twice, which doesn't extend the run), giving a run of length 9." },
      { input: "nums = []", output: "0" },
    ],
    constraints: ["0 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    hints: [
      "Sorting first makes it easy to spot consecutive runs, but sorting alone already costs more time than the problem is really asking for.",
      "For a given number to be the *start* of a run, what would have to be true about the number just below it?",
      "Put every number in a hash set first. Then only start counting a run from numbers where 'one less' isn't in the set - that guarantees you never recount the same run twice, keeping the whole thing to one real pass.",
    ],
    approachOverview: `
A reasonable first idea is to sort the list - once sorted, consecutive
values sit right next to each other, so a single pass counting streaks
gives you the answer. It's correct, but sorting itself already costs
more than the O(n) the problem is really asking for.

The key insight for a faster solution: put every number into a hash set
for instant lookups, then only start counting a sequence from numbers
that are the *start* of one - meaning "number minus 1" is not in the
set. Every other number gets picked up later as part of some run
starting from its true beginning, so across the whole algorithm, each
number only ever gets counted once, even though there's a loop nested
inside the main loop.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Sort and Scan",
        explanation: "Remove duplicates and sort what's left. Then walk through once, tracking how long the current streak of consecutive values is, and remembering the longest streak seen.",
        code: `function longestConsecutive(nums) {
  if (nums.length === 0) return 0;

  const sorted = [...new Set(nums)].sort((a, b) => a - b);

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      current++;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }

  return longest;
}`,
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal - Hash Set, Start From Sequence Beginnings",
        explanation: "Put every number into a hash set. Then, for each number that's the start of a sequence (meaning one less than it is not in the set), count forward - checking if the next value, and the one after that, and so on, are in the set - to find that sequence's length.",
        code: `function longestConsecutive(nums) {
  const numSet = new Set(nums);
  let longest = 0;

  for (const num of numSet) {
    // Only start counting from the beginning of a sequence
    if (!numSet.has(num - 1)) {
      let length = 1;
      while (numSet.has(num + length)) {
        length++;
      }
      longest = Math.max(longest, length);
    }
  }

  return longest;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "const numSet = new Set(nums);", explanation: "Lets us check 'is this value present?' in a single step, for any number." },
          { code: "if (!numSet.has(num - 1)) {", explanation: "Skips numbers that are in the middle or end of a run - only the true start of a sequence (where one less doesn't exist) is worth counting from." },
          { code: "while (numSet.has(num + length)) { length++; }", explanation: "Walks forward from the sequence's start, extending the count for as long as the next consecutive value keeps showing up." },
          { code: "longest = Math.max(longest, length);", explanation: "Keeps track of the longest run found across every sequence start." },
        ],
      },
    ],
    relatedProblems: ["contains-duplicate", "subarray-sum-equals-k"],
    keywords: ["longest consecutive sequence", "hash set", "array", "sequence"],
  },
  {
    id: "majority-element",
    title: "Majority Element",
    difficulty: "Easy",
    category: "arrays-hashing",
    description: `
You're given a list of numbers where one particular value shows up more
than half the time (strictly more than n/2 times, where n is the
length of the list). Find and return that value.

You can assume such a value always exists in the input.
    `.trim(),
    examples: [
      { input: "nums = [3, 2, 3]", output: "3", explanation: "3 appears twice out of three elements - more than half." },
      { input: "nums = [2, 2, 1, 1, 1, 2, 2]", output: "2", explanation: "2 appears 4 times out of 7, which is more than half." },
      { input: "nums = [1]", output: "1" },
    ],
    constraints: ["1 <= nums.length <= 5 * 10^4", "A majority element (appearing more than n/2 times) always exists."],
    hints: [
      "Counting how often each value appears with a hash map, and checking as you go whether any count has crossed n/2, will get you the answer.",
      "Because the majority element appears *more than half* the time, think of it like a tug-of-war: every time you see it, pull one way, and every time you see anything else, pull the other way.",
      "Keep a running 'candidate' value and a counter. If the counter ever hits zero, throw away the current candidate and start fresh with whatever number comes next - the true majority element can never fully get cancelled out this way.",
    ],
    approachOverview: `
The straightforward approach is to count how often each number appears
using a hash map, and return the one whose count passes n/2.

There's a cleverer approach, known as the Boyer-Moore voting idea, that
needs no extra memory at all. Think of it as a tug-of-war: keep a
"candidate" and a counter starting at zero. Walk through the list - if
the counter is zero, adopt the current number as the new candidate.
Then add 1 to the counter if the current number matches the candidate,
or subtract 1 if it doesn't. Because the true majority element
outnumbers everything else put together, it can never be fully
cancelled out by the time you reach the end, so whatever candidate
remains is the answer.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Count With a Hash Map",
        explanation: "Count how many times each number appears using a hash map. As soon as any number's count passes n/2, return it.",
        code: `function majorityElement(nums) {
  const counts = new Map();
  const majorityThreshold = Math.floor(nums.length / 2);

  for (const num of nums) {
    counts.set(num, (counts.get(num) || 0) + 1);
    if (counts.get(num) > majorityThreshold) {
      return num;
    }
  }
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal - Boyer-Moore Voting",
        explanation: "Keep a running candidate and a counter, both starting empty. For each number: if the counter is zero, make this number the new candidate. Then increase the counter if the number matches the candidate, or decrease it otherwise. The majority element, by definition, can never be fully cancelled out, so it's guaranteed to be the candidate left standing at the end.",
        code: `function majorityElement(nums) {
  let candidate = null;
  let count = 0;

  for (const num of nums) {
    if (count === 0) {
      candidate = num;
    }
    count += num === candidate ? 1 : -1;
  }

  return candidate;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let candidate = null; let count = 0;", explanation: "Starts with no candidate and an empty counter." },
          { code: "if (count === 0) { candidate = num; }", explanation: "Whenever the counter drops to zero (including at the very start), the current number becomes the new candidate to track." },
          { code: "count += num === candidate ? 1 : -1;", explanation: "Strengthens the count if this number agrees with the candidate, or weakens it if it doesn't - like votes for and against." },
          { code: "return candidate;", explanation: "Because the majority element outnumbers all other values combined, it always survives as the final candidate, even though it might get swapped out temporarily along the way." },
        ],
      },
    ],
    relatedProblems: ["contains-duplicate", "top-k-frequent-elements"],
    keywords: ["majority element", "boyer-moore voting", "hash map", "array"],
  },
  {
    id: "subarray-sum-equals-k",
    title: "Subarray Sum Equals K",
    difficulty: "Medium",
    category: "arrays-hashing",
    description: `
You're given a list of numbers (which can include negatives) and a
target number k. Count how many *contiguous* stretches of the list
(subarrays) add up exactly to k.

A subarray has to be made of elements that sit next to each other in
the original list - you can't skip around and pick elements from
scattered positions.
    `.trim(),
    examples: [
      { input: "nums = [1, 1, 1], k = 2", output: "2", explanation: "The subarray made of the first two elements, and the subarray made of the last two elements, both sum to 2." },
      { input: "nums = [1, 2, 3], k = 3", output: "2", explanation: "The subarrays [1, 2] and [3] both sum to 3." },
      { input: "nums = [1, -1, 0], k = 0", output: "3", explanation: "[1, -1], [0], and [1, -1, 0] all sum to 0." },
    ],
    constraints: ["1 <= nums.length <= 2 * 10^4", "-1000 <= nums[i] <= 1000", "-10^7 <= k <= 10^7"],
    hints: [
      "Checking every possible subarray and adding up its elements works, but recomputing each subarray's sum from scratch is wasteful.",
      "If you track the running total from the start of the list up to each position (a 'prefix sum'), the sum of any subarray is just one prefix sum minus another, earlier one.",
      "For each position, you want to know how many earlier positions had a running total equal to 'current running total minus k'. A hash map that counts how many times each running total has occurred lets you answer that instantly.",
    ],
    approachOverview: `
The brute-force way is to check every possible subarray directly,
adding up its elements and comparing the sum to k. It works, but it
recomputes a lot of the same sums over and over as the window slides.

The faster approach relies on prefix sums: the sum of any subarray
between two positions is just the running total up to the later
position minus the running total up to the earlier one. So, while
scanning the list and keeping a running total, you can ask at every
step: "has the running total minus k shown up as a running total
before?" A hash map counting how many times each running total has
occurred answers that in one step, turning the whole problem into a
single pass through the list.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Check Every Subarray",
        explanation: "For every starting position, extend the subarray one element at a time, keeping a running sum, and count it whenever that running sum equals k.",
        code: `function subarraySum(nums, k) {
  let count = 0;

  for (let start = 0; start < nums.length; start++) {
    let sum = 0;
    for (let end = start; end < nums.length; end++) {
      sum += nums[end];
      if (sum === k) {
        count++;
      }
    }
  }

  return count;
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal - Prefix Sum + Hash Map",
        explanation: "Keep a running total as you scan the list, and a hash map counting how many times each running total value has occurred so far (starting with a running total of 0 having occurred once, to correctly handle subarrays starting at index 0). At each step, the number of subarrays ending here that sum to k equals how many times (current running total minus k) has appeared before.",
        code: `function subarraySum(nums, k) {
  const prefixCounts = new Map();
  prefixCounts.set(0, 1); // an empty prefix sums to 0

  let sum = 0;
  let count = 0;

  for (const num of nums) {
    sum += num;

    const needed = sum - k;
    if (prefixCounts.has(needed)) {
      count += prefixCounts.get(needed);
    }

    prefixCounts.set(sum, (prefixCounts.get(sum) || 0) + 1);
  }

  return count;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "prefixCounts.set(0, 1);", explanation: "Seeds the map with 'a running total of 0 has occurred once' - this represents the empty prefix before the list even starts, and lets subarrays beginning at index 0 be counted correctly." },
          { code: "sum += num;", explanation: "Keeps a running total of everything seen so far, updated as each number is visited." },
          { code: "const needed = sum - k;", explanation: "Figures out what an earlier running total would have needed to be for the subarray between that point and here to sum to exactly k." },
          { code: "if (prefixCounts.has(needed)) { count += prefixCounts.get(needed); }", explanation: "Adds in however many earlier positions had exactly that running total - each one marks a valid subarray ending at the current position." },
          { code: "prefixCounts.set(sum, (prefixCounts.get(sum) || 0) + 1);", explanation: "Records the current running total, so later positions can find it if they need it." },
        ],
      },
    ],
    relatedProblems: ["longest-consecutive-sequence", "top-k-frequent-elements"],
    keywords: ["subarray sum", "prefix sum", "hash map", "running total"],
  },
];
