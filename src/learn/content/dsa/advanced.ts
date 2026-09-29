import type { Topic } from "../../types/content";

export const dsaAdvancedTopics: Topic[] = [
  {
    id: "sorting",
    title: "Sorting",
    level: "advanced",
    description: "Arranging a list of items into order — and why different approaches to it matter a lot at scale.",
    explanation: `
Putting a list into order (numbers ascending, names alphabetical) seems
simple, but there are many different ways to do it — and they don't all
scale the same way. Some simple approaches are easy to understand but slow
down badly on large lists (O(n²)); smarter approaches stay efficient even
with huge amounts of data (O(n log n)).

Understanding a few core sorting strategies teaches patterns — comparing,
swapping, dividing problems into smaller pieces — that show up constantly
elsewhere in programming.
    `.trim(),
    analogy:
      "Imagine sorting a messy hand of playing cards. You could repeatedly compare each pair of neighboring cards and swap them if they're out of order, making pass after pass until nothing needs swapping (simple, but slow with many cards — like bubble sort), or split the hand in half, sort each half, and merge them back together in order (more clever, and much faster for a big hand — like merge sort).",
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
          "Bubble sort repeatedly swaps adjacent out-of-order items. It's easy to understand, but the nested loops make it O(n²) — slow for large arrays.",
        walkthrough: [
          { code: "for (let i = 0; i < arr.length; i++) {", explanation: "Runs one full pass over the array for every item — part of what makes this O(n²)." },
          { code: "for (let j = 0; j < arr.length - i - 1; j++) {", explanation: "Within each pass, compares every pair of neighbors, shrinking slightly as sorted items settle at the end." },
          { code: "if (arr[j] > arr[j + 1]) {", explanation: "Checks whether two neighbors are out of order." },
          { code: "[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];", explanation: "Swaps them so the larger value moves one step closer to the end." },
        ],
      },
      {
        title: "Using the built-in sort",
        code: `const numbers = [5, 2, 9, 1];
numbers.sort((a, b) => a - b); // [1, 2, 5, 9]`,
        explanation:
          "In real code, you'd almost always use the built-in `.sort()`, which uses an efficient algorithm internally (commonly a variant of merge sort or timsort).",
      },
    ],
    howItWorks: `
Most simple sorting algorithms (like bubble sort) repeatedly compare
neighboring items and swap them if they're in the wrong order, needing
many passes over the data — O(n²). Faster algorithms (like merge sort) use
a "divide and conquer" strategy: split the list in half, sort each half
recursively, then merge the two sorted halves back together.

The \`log n\` in O(n log n) comes from the same halving idea used in binary
search: splitting a list of size n in half, then in half again, and so on,
only takes about log₂(n) rounds before you're down to single items. Merge
sort does that splitting (log n levels), and then spends O(n) work merging
everything back together at each level — giving O(n log n) overall.
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
Sorted data unlocks faster algorithms elsewhere — like binary search — and
many real systems (search results, leaderboards, logs) need to display
data in order. Studying sorting algorithms also teaches transferable
techniques: comparison, swapping, and divide-and-conquer thinking.
    `.trim(),
    whenToUse: `
Reach for sorting whenever the order you present data in matters —
leaderboards, search results, alphabetized lists — or as groundwork for a
faster algorithm downstream, like binary search, which needs sorted data
to work at all.
    `.trim(),
    whenNotToUse: `
Don't sort data you're only going to scan once looking for a single
value — a plain linear search is cheaper in that case. And in production
code, don't hand-write a sort algorithm at all; the built-in \`.sort()\` is
well-tested and normally faster than anything you'd write by hand.
    `.trim(),
    commonMistakes: [
      "Reimplementing your own sort in production code instead of using the built-in, well-tested `.sort()`.",
      "Forgetting that JavaScript's default `.sort()` compares items as strings unless you provide a comparator function — `[10, 2, 1].sort()` gives `[1, 10, 2]` without one.",
      "Assuming all sorting algorithms perform the same — an O(n²) algorithm can be dramatically slower once data grows past a few thousand items.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Implement bubble sort and test it on a small array of numbers." },
      { difficulty: "Medium", prompt: "Implement merge sort using recursion, splitting an array in half and merging sorted halves." },
      { difficulty: "Hard", prompt: "Implement quicksort, and explain in your own words how it picks a 'pivot' to divide the array." },
    ],
    interviewQuestions: [
      { question: "What is the time complexity of bubble sort, and why?", answer: "O(n²) — it uses nested loops, comparing and swapping pairs of elements repeatedly across multiple full passes over the array." },
      { question: "How does merge sort achieve O(n log n)?", answer: "By recursively splitting the array in half (log n levels of splitting) and merging sorted halves in linear time at each level." },
      { question: "Why would you use the built-in `.sort()` instead of writing your own?", answer: "Built-in implementations are heavily optimized and tested; writing your own is mainly useful for learning the underlying algorithms, not for production use." },
      { question: "How does insertion sort work, and what's its best-case and worst-case complexity?", answer: "It builds a sorted region at the front of the array one item at a time, shifting larger elements right until it finds the new item's spot. Best case is O(n) on an already-sorted array (each item only needs one comparison, no shifting); worst case is O(n²) on a reverse-sorted array (each new item shifts all the way to the front)." },
      { question: "How does selection sort work, and why is it always O(n²) even on sorted input?", answer: "It repeatedly scans the entire unsorted portion to find the minimum and swaps it into place. It doesn't check whether the array is already ordered — it always does a full scan of the remaining unsorted elements on every pass — so it makes O(n²) comparisons regardless of input order." },
      { question: "Selection sort and insertion sort are both O(n²) on average — what's the practical difference between them?", answer: "Selection sort is *not adaptive*: it always makes the same number of comparisons no matter how sorted the input already is. Insertion sort *is adaptive*: on a nearly-sorted array it approaches O(n) because each new element needs little or no shifting. Selection sort does make fewer swaps though (at most one per pass, O(n) total), which matters when writes are expensive." },
      { question: "What's the space complexity of bubble sort, insertion sort, and selection sort?", answer: "All three are O(1) extra space — they sort in place, only needing a fixed number of temporary variables (loop counters and a swap temp), regardless of array size." },
      { question: "Is merge sort stable? Why or why not?", answer: "Yes, when implemented correctly. During the merge step, when two elements compare equal, a stable implementation always takes the one from the left (earlier) subarray first, which preserves their original relative order." },
      { question: "Why does merge sort need O(n) extra space instead of sorting in place?", answer: "Merging two already-sorted subarrays into one sorted array generally requires writing the result somewhere other than over the inputs you're still reading from — otherwise you'd overwrite values you haven't compared yet. Practical merge implementations use an auxiliary array sized to the input, giving O(n) extra space." },
      { question: "Does merge sort's runtime change based on whether the input is already sorted?", answer: "No — merge sort is O(n log n) in the best, average, and worst case. It always splits the array in half at every level and always does a full O(n) merge pass at each level, regardless of the existing order, so it doesn't get faster on sorted input the way insertion sort does." },
      { question: "Walk through how quicksort's partition step works.", answer: "Pick a pivot value, then rearrange the subarray so every element less than the pivot ends up to its left and every element greater ends up to its right, placing the pivot in its final sorted position in the process. Then recursively apply the same partitioning to the left and right sub-ranges (which no longer include the pivot)." },
      { question: "Quicksort is usually described as O(n log n) average but O(n²) worst case — why the gap?", answer: "If each partition splits the array roughly in half, you get log n levels of recursion with O(n) partition work per level, giving O(n log n). But if a partition is badly unbalanced — removing only one element and leaving n-1 on one side — you get n levels of recursion instead of log n, each still doing O(n) work, giving O(n²)." },
      { question: "What input causes quicksort's worst case, and why?", answer: "A sorted (or reverse-sorted) array combined with always choosing the first or last element as the pivot. Each partition then puts every remaining element on one side and none on the other, so the recursion only shrinks by one element per call — n nested calls of O(n) work each, giving O(n²)." },
      { question: "How do real-world quicksort implementations avoid the O(n²) worst case?", answer: "By picking the pivot randomly, or using median-of-three (the median of the first, middle, and last elements), which makes an adversarial or already-sorted input very unlikely to trigger consistently unbalanced partitions. Some implementations (introsort) also switch to heapsort if recursion depth grows too large, guaranteeing O(n log n) worst case." },
      { question: "Is quicksort stable?", answer: "Not in its typical in-place implementation. Partitioning swaps elements past each other to move them to the correct side of the pivot, which can change the relative order of equal elements. It can be made stable, but only by using extra space to write results in order — which gives up quicksort's in-place advantage." },
      { question: "How does quicksort's space usage compare to merge sort's?", answer: "Quicksort partitions in place, so its extra space is just the recursion call stack — O(log n) on average for balanced partitions, though it can grow to O(n) in the worst case of unbalanced recursion. Merge sort always needs an O(n) auxiliary array for merging, regardless of how balanced the recursion is." },
      { question: "If quicksort and merge sort are both O(n log n) on average, why is quicksort often faster in practice?", answer: "Quicksort partitions in place over contiguous memory, giving it better cache locality and smaller constant factors than merge sort, which repeatedly allocates and copies into an auxiliary array. The asymptotic complexity is the same, but the actual work per comparison/swap is cheaper for quicksort on typical hardware." },
      { question: "What does it mean for a sort to be 'stable'?", answer: "Elements that compare equal keep their original relative order in the output. If two items have the same sort key, a stable sort never swaps their relative positions." },
      { question: "Why does sort stability actually matter in practice?", answer: "It lets you sort by multiple keys in separate passes. For example, if you first sort a list of people by name, then stable-sort the result by department, people within each department stay in alphabetical order by name — because the department sort never disturbs the relative order of equal-department entries." },
      { question: "Which common sorting algorithms are stable, and which aren't?", answer: "Stable: bubble sort, insertion sort, merge sort, counting sort, radix sort, and Timsort. Not stable (in their standard implementations): selection sort, quicksort, and heapsort — all of them swap elements in ways that can reorder equal values." },
      { question: "How can you make an inherently unstable sort behave in a stable way?", answer: "Attach each element's original index and compare on (value, index) pairs instead of value alone. Ties on value are then broken by index, which preserves the original relative order without changing the underlying algorithm." },
      { question: "Why is Ω(n log n) considered a hard lower bound for comparison-based sorting?", answer: "Any comparison-based sort can be modeled as a binary decision tree where each leaf represents one of the n! possible orderings of the input, and each internal node is one comparison. To distinguish all n! outcomes, the tree needs at least log₂(n!) levels, and by Stirling's approximation log₂(n!) is Θ(n log n) — so no algorithm that only learns information via pairwise comparisons can beat that in the worst case." },
      { question: "How does counting sort achieve O(n+k), and how does it get around the Ω(n log n) limit?", answer: "It doesn't compare elements at all — it counts how many times each distinct value (from a known range of size k) occurs, turns those counts into prefix sums to know each value's final position, then places elements directly. That takes O(n+k) time. It isn't bound by Ω(n log n) because that limit only applies to sorts that must extract all their ordering information from comparisons; counting sort uses the values themselves as array indices instead." },
      { question: "When would counting sort be a poor choice, even though it's O(n+k)?", answer: "When the key range k is much larger than n — e.g., sorting 100 numbers that range from 0 to 10 billion. The counting array would need billions of slots, making it far slower and more memory-hungry than an O(n log n) comparison sort. It also only works directly on non-negative integers (or values easily mapped to a small integer range)." },
      { question: "How does radix sort work, and what's its time complexity?", answer: "It sorts numbers digit by digit, typically from least significant to most significant, using a stable sort (usually counting sort) as a subroutine for each digit position. Sorting the least significant digit first and using a stable sort at each step means later passes never undo the ordering established by earlier ones. Its complexity is O(d(n+k)), where d is the number of digits and k is the base (e.g., 10 for decimal digits)." },
      { question: "Counting sort and radix sort run faster than Ω(n log n) — doesn't that contradict the comparison-sort lower bound?", answer: "No, because the Ω(n log n) bound only applies to algorithms that determine order purely through pairwise comparisons. Counting and radix sort exploit extra structure in the keys — that they're integers within a known, bounded range — to place elements directly by index instead of comparing them, so the bound simply doesn't apply to them." },
      { question: "In practice, when would you reach for quicksort over merge sort, or vice versa?", answer: "Quicksort when you want good average performance with low memory overhead and don't need stability or a worst-case guarantee — it sorts in place and tends to be fast in practice. Merge sort when you need stability (multi-key sorting), a guaranteed O(n log n) worst case regardless of input (e.g., latency-sensitive systems), or when sorting data like linked lists or on-disk data where merge sort's sequential access pattern fits better than quicksort's random-access partitioning." },
      { question: "How do you sort a dataset too large to fit in memory?", answer: "Use external merge sort: split the data into chunks that do fit in memory, sort each chunk in place and write it to disk as a sorted 'run', then repeatedly merge the sorted runs using a small in-memory buffer per run (a k-way merge), reading and writing sequentially. This works well because merge sort only ever needs sequential access to its inputs, which disk I/O is good at." },
      { question: "If you know your data is already nearly sorted, which sort should you pick, and why?", answer: "An adaptive sort — plain insertion sort (which approaches O(n) when few elements are out of place) or a hybrid like Timsort, which detects existing sorted runs and merges them instead of re-sorting from scratch. Avoid non-adaptive algorithms like standard quicksort or selection sort, which do the same amount of work regardless of how sorted the input already is." },
      { question: "How do you sort a list of records by multiple keys, like last name then first name?", answer: "Two common approaches: run a stable sort multiple times, starting with the least significant key and ending with the most significant (each pass preserves the ordering the previous pass established for ties); or write a single comparator that compares the primary key first and only falls back to the secondary key when the primary keys are equal, then sort once." },
      { question: "What is Timsort, and why do languages like Python and Java use it as their default sort?", answer: "Timsort is a hybrid algorithm that scans the input for existing ascending or descending runs, uses insertion sort to sort or extend short runs, and merges runs together using merge sort's merging logic. It combines merge sort's guaranteed O(n log n) worst case and stability with insertion sort's efficiency on small or already-ordered data, which makes it fast on the partially-sorted, real-world data these languages' sort functions actually see." },
      { question: "Trace one full pass of bubble sort over `[5, 1, 4, 2, 8]`. What does the array look like afterward?", answer: "`[1, 4, 2, 5, 8]`. Step by step: compare (5,1) → swap → `[1,5,4,2,8]`; compare (5,4) → swap → `[1,4,5,2,8]`; compare (5,2) → swap → `[1,4,2,5,8]`; compare (5,8) → no swap. One pass doesn't fully sort the array, but it does guarantee the largest untouched element (8 here) has bubbled to its correct end position." },
      { question: "Trace Lomuto partitioning on `[4, 6, 2, 8, 5]` using the last element (5) as the pivot. Where does the pivot end up, and what are the two partitions?", answer: "The pivot (5) ends up at index 2, giving `[4, 2, 5, 8, 6]`. Walking through: 4 < 5 so it stays left of the boundary; 6 is not < 5 so it's skipped; 2 < 5 so it's swapped next to 4; 8 is not < 5. Finally the pivot is swapped into place right after the last element found to be smaller than it. Left partition: `[4, 2]` (both < 5); right partition: `[8, 6]` (both > 5)." },
      { question: "A Lomuto partition implementation loops `for (let j = low; j <= high; j++)` where `arr[high]` is the pivot — what's the bug, and what does it cause?", answer: "The loop should stop before `high` (`j < high`), since `arr[high]` is the pivot itself and shouldn't be compared against or counted among the elements being partitioned. Looping through it as `j <= high` compares the pivot to itself and can throw off the boundary index used for the final pivot swap, placing the pivot in the wrong position or including it twice in a partition." },
      { question: "A recursive quicksort implementation calls `quicksort(arr, low, high)` on both sides but passes the same `low, high` bounds unchanged after partitioning instead of `(low, p-1)` and `(p+1, high)` — what happens?", answer: "The recursive calls never shrink the range they operate on, so the same partition keeps being computed and recursed into forever — infinite recursion, which crashes with a stack overflow instead of an infinite loop that hangs. The fix is to always recurse into the sub-ranges on either side of the pivot's final index, excluding the pivot itself." },
      { question: "In a merge sort implementation, what happens if you forget to copy over the remaining elements after one of the two subarrays is exhausted during the merge step?", answer: "Whichever elements were left in the not-yet-exhausted subarray never get copied into the result, so the merged output is shorter than it should be and silently drops data — a bug that's easy to miss because it only shows up when the two subarrays end up different lengths after merging, not on every input." },
      { question: "What is heapsort, and how does it compare to quicksort and merge sort?", answer: "Heapsort builds a max-heap from the array (O(n)), then repeatedly swaps the root — the current maximum — with the last unsorted element and sifts the new root down to restore the heap property (O(log n) per extraction, n extractions), giving O(n log n) in the best, average, *and* worst case. It sorts in place with O(1) extra space, like quicksort, but unlike quicksort it has no O(n²) worst case. The trade-off: it's not stable, and its scattered heap-index memory access pattern tends to make it slower in practice than quicksort despite the same asymptotic guarantee that merge sort also provides." },
    ],
    prerequisites: ["recursion", "arrays", "binary-search"],
    relatedTopics: ["big-o", "arrays", "recursion", "binary-search"],
    keywords: ["sorting", "bubble sort", "merge sort", "quicksort", "divide and conquer"],
  },
];
