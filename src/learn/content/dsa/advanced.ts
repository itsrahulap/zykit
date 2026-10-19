import type { Topic } from "../../types/content";

export const dsaAdvancedTopics: Topic[] = [
  {
    id: "sorting",
    title: "Sorting",
    level: "advanced",
    description: "Putting a list in order, and why the approach matters a lot at scale.",
    explanation: `
Putting a list in order (numbers ascending, names alphabetical) seems
simple, but there are many ways to do it, and they scale differently.
Simple approaches are easy to follow but slow badly on large lists
(O(n²)). Smarter ones stay efficient on huge data (O(n log n)).

Sorting also teaches patterns you'll use everywhere: comparing, swapping,
and splitting problems into smaller pieces.
    `.trim(),
    analogy:
      "Think of sorting a messy hand of cards. You could compare neighboring cards and swap any out of order, pass after pass, until nothing moves: simple but slow with many cards, like bubble sort. Or split the hand in half, sort each half, and merge them in order: much faster for a big hand, like merge sort.",
    examples: [
      {
        title: "Bubble sort (simple, but O(n²))",
        code: `function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; // swap
      }
    }
  }
  return arr;
}`,
        explanation:
          "Bubble sort keeps swapping neighboring items that are out of order. It's easy to follow, but the nested loops make it O(n²), slow for large arrays.",
        walkthrough: [
          { code: "for (let i = 0; i < arr.length; i++) {", explanation: "One full pass for every item, part of what makes this O(n²)." },
          { code: "for (let j = 0; j < arr.length - i - 1; j++) {", explanation: "Each pass compares every pair of neighbors, stopping a little earlier as sorted items settle at the end." },
          { code: "if (arr[j] > arr[j + 1]) {", explanation: "Checks whether two neighbors are out of order." },
          { code: "[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];", explanation: "Swaps them, moving the larger value one step toward the end." },
        ],
      },
      {
        title: "Using the built-in sort",
        code: `const numbers = [5, 2, 9, 1];
numbers.sort((a, b) => a - b); // [1, 2, 5, 9]`,
        explanation:
          "In real code, use the built-in `.sort()`. It uses an efficient algorithm internally (commonly a variant of merge sort or timsort).",
      },
    ],
    howItWorks: `
Simple algorithms like bubble sort compare neighbors and swap them if
they're out of order, over many passes: O(n²). Faster ones like merge
sort use "divide and conquer": split the list in half, sort each half
recursively, then merge the sorted halves.

The \`log n\` in O(n log n) comes from the same halving as binary search.
Halving a list of size n over and over takes about log₂(n) rounds to reach
single items. Merge sort has log n levels of splitting and does O(n)
merging work per level: O(n log n) overall.
    `.trim(),
    diagram: `
Merge sort:
[5, 2, 9, 1]
   ↓ split
[5, 2]     [9, 1]
   ↓ split     ↓ split
[5] [2]     [9] [1]
   ↓ merge     ↓ merge
 [2, 5]     [1, 9]
        ↓ merge
   [1, 2, 5, 9]
    `.trim(),
    whyItExists: `
Sorted data enables faster algorithms like binary search, and many real
systems (search results, leaderboards, logs) show data in order. Sorting
also teaches techniques you'll reuse: comparing, swapping and divide and
conquer.
    `.trim(),
    whenToUse: `
Sort when presentation order matters (leaderboards, search results,
alphabetical lists), or to prepare data for a faster algorithm like
binary search, which only works on sorted data.
    `.trim(),
    whenNotToUse: `
Don't sort data you'll scan only once for a single value; a linear search
is cheaper. In production code, don't hand-write a sort: the built-in
\`.sort()\` is well tested and usually faster.
    `.trim(),
    commonMistakes: [
      "Writing your own sort in production code instead of using the built-in, well-tested `.sort()`.",
      "Forgetting that JavaScript's default `.sort()` compares items as strings unless you pass a comparator: `[10, 2, 1].sort()` gives `[1, 10, 2]`.",
      "Assuming all sorts perform the same. An O(n²) algorithm can be dramatically slower past a few thousand items.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Implement bubble sort and test it on a small array of numbers." },
      { difficulty: "Medium", prompt: "Implement merge sort with recursion: split the array in half and merge the sorted halves." },
      { difficulty: "Hard", prompt: "Implement quicksort, and explain in your own words how it picks a 'pivot' to divide the array." },
    ],
    interviewQuestions: [
      { question: "What is the time complexity of bubble sort, and why?", answer: "O(n²). Its nested loops compare and swap pairs over many full passes of the array." },
      { question: "How does merge sort achieve O(n log n)?", answer: "It splits the array in half recursively (log n levels) and merges the sorted halves in linear time at each level." },
      { question: "Why would you use the built-in `.sort()` instead of writing your own?", answer: "Built-in sorts are heavily optimized and tested. Writing your own is for learning the algorithms, not for production." },
      { question: "How does insertion sort work, and what's its best-case and worst-case complexity?", answer: "It grows a sorted region at the front one item at a time, shifting larger elements right to make room for each new item. Best case O(n) on sorted input (one comparison each, no shifting). Worst case O(n²) on reverse-sorted input (each item shifts all the way to the front)." },
      { question: "How does selection sort work, and why is it always O(n²) even on sorted input?", answer: "It scans the whole unsorted part for the minimum and swaps it into place. It never checks whether the array is already ordered, so every pass scans everything remaining: O(n²) comparisons whatever the input." },
      { question: "Selection sort and insertion sort are both O(n²) on average — what's the practical difference between them?", answer: "Selection sort is *not adaptive*: same number of comparisons however sorted the input is. Insertion sort *is adaptive*: on nearly sorted input it approaches O(n). Selection sort does make fewer swaps (at most one per pass, O(n) total), which helps when writes are expensive." },
      { question: "What's the space complexity of bubble sort, insertion sort, and selection sort?", answer: "All O(1) extra space. They sort in place with a few fixed variables (loop counters and a swap temp)." },
      { question: "Is merge sort stable? Why or why not?", answer: "Yes, if implemented correctly. When two elements are equal during a merge, a stable version takes the one from the left (earlier) subarray first, keeping their original order." },
      { question: "Why does merge sort need O(n) extra space instead of sorting in place?", answer: "Merging two sorted subarrays usually means writing the result somewhere other than the inputs you're still reading, or you'd overwrite values not yet compared. Practical versions use an auxiliary array the size of the input: O(n) extra space." },
      { question: "Does merge sort's runtime change based on whether the input is already sorted?", answer: "No. It's O(n log n) in best, average and worst case. It always halves at every level and always does a full O(n) merge per level, so unlike insertion sort it doesn't speed up on sorted input." },
      { question: "Walk through how quicksort's partition step works.", answer: "Pick a pivot, then rearrange the subarray so smaller elements go to its left and larger ones to its right. The pivot lands in its final sorted position. Then partition the left and right sub-ranges (excluding the pivot) recursively." },
      { question: "Quicksort is usually described as O(n log n) average but O(n²) worst case — why the gap?", answer: "If partitions split roughly in half, there are log n levels with O(n) work each: O(n log n). If a partition is badly unbalanced, removing just one element and leaving n-1 on one side, there are n levels instead, each still O(n): O(n²)." },
      { question: "What input causes quicksort's worst case, and why?", answer: "A sorted (or reverse-sorted) array when the pivot is always the first or last element. Every partition puts all remaining elements on one side, so each call shrinks the range by only one: n nested calls of O(n) work, O(n²)." },
      { question: "How do real-world quicksort implementations avoid the O(n²) worst case?", answer: "They pick a random pivot or use median-of-three (the median of the first, middle and last elements), which makes consistently unbalanced partitions very unlikely, even on sorted or adversarial input. Some (introsort) also switch to heapsort if recursion gets too deep, guaranteeing O(n log n) worst case." },
      { question: "Is quicksort stable?", answer: "Not in its usual in-place form. Partitioning swaps elements past each other, which can reorder equal elements. It can be made stable only with extra space, which gives up its in-place advantage." },
      { question: "How does quicksort's space usage compare to merge sort's?", answer: "Quicksort partitions in place, so its extra space is the call stack: O(log n) on average, up to O(n) with unbalanced recursion. Merge sort always needs an O(n) auxiliary array." },
      { question: "If quicksort and merge sort are both O(n log n) on average, why is quicksort often faster in practice?", answer: "Quicksort works in place on contiguous memory, so it has better cache locality and smaller constant factors. Merge sort keeps copying into an auxiliary array. Same Big O, but each step is cheaper for quicksort on typical hardware." },
      { question: "What does it mean for a sort to be 'stable'?", answer: "Equal elements keep their original relative order in the output." },
      { question: "Why does sort stability actually matter in practice?", answer: "It lets you sort by several keys in separate passes. Sort people by name, then stable-sort by department: within each department, people stay in name order, because the second sort never reorders equal departments." },
      { question: "Which common sorting algorithms are stable, and which aren't?", answer: "Stable: bubble sort, insertion sort, merge sort, counting sort, radix sort and Timsort. Not stable (in standard form): selection sort, quicksort and heapsort, which swap elements in ways that can reorder equal values." },
      { question: "How can you make an inherently unstable sort behave in a stable way?", answer: "Attach each element's original index and compare (value, index) pairs. Ties are broken by index, so the original order is kept without changing the algorithm." },
      { question: "Why is Ω(n log n) considered a hard lower bound for comparison-based sorting?", answer: "Model the sort as a binary decision tree: each internal node is one comparison, each leaf one of the n! possible orderings. Telling all n! apart needs at least log₂(n!) levels, and by Stirling's approximation log₂(n!) is Θ(n log n). So no comparison-only sort can beat that in the worst case." },
      { question: "How does counting sort achieve O(n+k), and how does it get around the Ω(n log n) limit?", answer: "It never compares elements. It counts each distinct value (from a known range of size k), turns the counts into prefix sums to get each value's final position, then places elements directly: O(n+k). The Ω(n log n) limit only applies to sorts that learn order from comparisons; counting sort uses the values as array indices." },
      { question: "When would counting sort be a poor choice, even though it's O(n+k)?", answer: "When k is much larger than n, e.g. 100 numbers ranging from 0 to 10 billion. The counting array would need billions of slots, far slower and hungrier than an O(n log n) sort. It also only works directly on non-negative integers (or values easily mapped to a small integer range)." },
      { question: "How does radix sort work, and what's its time complexity?", answer: "It sorts digit by digit, usually least significant first, using a stable sort (usually counting sort) for each digit. Because each pass is stable, later passes never undo earlier ordering. It's O(d(n+k)), where d is the number of digits and k is the base (e.g. 10 for decimal)." },
      { question: "Counting sort and radix sort run faster than Ω(n log n) — doesn't that contradict the comparison-sort lower bound?", answer: "No. That bound only covers sorts that learn order purely from pairwise comparisons. Counting and radix sort exploit the keys being integers in a known, bounded range and place elements by index instead." },
      { question: "In practice, when would you reach for quicksort over merge sort, or vice versa?", answer: "Quicksort for fast average performance with low memory, when you don't need stability or a worst-case guarantee. Merge sort when you need stability (multi-key sorting), a guaranteed O(n log n) worst case (e.g. latency-sensitive systems), or are sorting linked lists or on-disk data, where its sequential access fits better than quicksort's random-access partitioning." },
      { question: "How do you sort a dataset too large to fit in memory?", answer: "External merge sort. Split the data into chunks that fit in memory, sort each and write it to disk as a sorted 'run'. Then merge the runs with a small in-memory buffer per run (a k-way merge), reading and writing sequentially. It works because merging only needs sequential access, which disk I/O handles well." },
      { question: "If you know your data is already nearly sorted, which sort should you pick, and why?", answer: "An adaptive sort: insertion sort (near O(n) when few elements are out of place) or a hybrid like Timsort, which finds existing sorted runs and merges them. Avoid non-adaptive ones like standard quicksort or selection sort, which do the same work regardless." },
      { question: "How do you sort a list of records by multiple keys, like last name then first name?", answer: "Either run a stable sort several times, from the least significant key to the most significant (each pass keeps the previous order for ties). Or write one comparator that compares the primary key and falls back to the secondary key only on ties, then sort once." },
      { question: "What is Timsort, and why do languages like Python and Java use it as their default sort?", answer: "A hybrid that finds existing ascending or descending runs, uses insertion sort to sort or extend short runs, and merges runs with merge sort's logic. It combines merge sort's O(n log n) worst case and stability with insertion sort's speed on small or ordered data, which suits the partially sorted data real programs sort." },
      { question: "Trace one full pass of bubble sort over `[5, 1, 4, 2, 8]`. What does the array look like afterward?", answer: "`[1, 4, 2, 5, 8]`. Compare (5,1) → swap → `[1,5,4,2,8]`; (5,4) → swap → `[1,4,5,2,8]`; (5,2) → swap → `[1,4,2,5,8]`; (5,8) → no swap. One pass doesn't fully sort the array, but the largest unsorted element (8 here) is now in its final position at the end." },
      { question: "Trace Lomuto partitioning on `[4, 6, 2, 8, 5]` using the last element (5) as the pivot. Where does the pivot end up, and what are the two partitions?", answer: "The pivot (5) ends at index 2: `[4, 2, 5, 8, 6]`. 4 < 5, so it stays left of the boundary; 6 isn't, so skip; 2 < 5, so it's swapped next to 4; 8 isn't. Finally the pivot is swapped in right after the last smaller element. Left partition: `[4, 2]` (both < 5); right: `[8, 6]` (both > 5)." },
      { question: "A Lomuto partition implementation loops `for (let j = low; j <= high; j++)` where `arr[high]` is the pivot — what's the bug, and what does it cause?", answer: "The loop should stop before `high` (`j < high`), since `arr[high]` is the pivot and shouldn't be partitioned. With `j <= high`, the pivot is compared with itself, which can throw off the boundary index for the final swap, putting the pivot in the wrong place or counting it twice in a partition." },
      { question: "A recursive quicksort implementation calls `quicksort(arr, low, high)` on both sides but passes the same `low, high` bounds unchanged after partitioning instead of `(low, p-1)` and `(p+1, high)` — what happens?", answer: "The range never shrinks, so the same partition repeats forever: infinite recursion, which crashes with a stack overflow rather than hanging. Always recurse on the sub-ranges either side of the pivot's final index, excluding the pivot." },
      { question: "In a merge sort implementation, what happens if you forget to copy over the remaining elements after one of the two subarrays is exhausted during the merge step?", answer: "The leftover elements in the other subarray never reach the result, so the output is too short and silently loses data. It's easy to miss because it doesn't show up on every input." },
      { question: "What is heapsort, and how does it compare to quicksort and merge sort?", answer: "Heapsort builds a max-heap from the array (O(n)), then repeatedly swaps the root (the current maximum) with the last unsorted element and sifts the new root down (O(log n) per extraction, n extractions). That's O(n log n) in the best, average *and* worst case. Like quicksort it sorts in place with O(1) extra space, but it has no O(n²) worst case. Trade-offs: it's not stable, and its scattered heap-index memory access usually makes it slower in practice than quicksort, though it shares merge sort's worst-case guarantee." },
    ],
    prerequisites: ["recursion", "arrays", "binary-search"],
    relatedTopics: ["big-o", "arrays", "recursion", "binary-search"],
    keywords: ["sorting", "bubble sort", "merge sort", "quicksort", "divide and conquer"],
  },
];
