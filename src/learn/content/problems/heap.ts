import type { Problem } from "../../types/problem";

export const heapProblems: Problem[] = [
  {
    id: "kth-largest-element-in-a-stream",
    title: "Kth Largest Element in a Stream",
    difficulty: "Easy",
    category: "heap",
    description: `
Design a class that keeps track of the *kth largest* element in a
growing collection of numbers, as new numbers keep arriving one at a
time.

The class is constructed with an integer \`k\` and an initial array of
numbers. It supports one operation, \`add(val)\`, which adds \`val\` to the
collection and then returns the kth largest element in the collection
*so far* (with duplicates counted - the kth largest, not the kth
distinct value).

You're guaranteed there will always be at least k numbers in the
collection whenever \`add\` is called.
    `.trim(),
    examples: [
      {
        input: "k = 3, nums = [4, 5, 8, 2]; then add(3), add(5), add(10), add(9), add(4)",
        output: "4, 5, 5, 8, 8",
        explanation: "Starting from [4,5,8,2], the 3 largest are 8,5,4, so the 3rd largest is 4. After add(3), the collection is [4,5,8,2,3] and the 3rd largest is still 4. After add(5) it becomes 5, and so on as more numbers arrive.",
      },
    ],
    constraints: [
      "1 <= k <= 10^4",
      "0 <= nums.length <= 10^4",
      "-10^4 <= nums[i] <= 10^4",
      "At most 10^4 calls to add",
    ],
    hints: [
      "You could re-sort the whole collection on every add() call, but that repeats a lot of work as the stream grows.",
      "You only ever need to know the k *largest* values - the rest of the numbers don't matter at all once you know they're not in the top k.",
      "What if you kept a small collection of exactly the k largest values seen so far, and could instantly tell which one of those k is the smallest?",
    ],
    approachOverview: `
Re-sorting everything on every call wastes time re-examining numbers
that were never going to be in the top k anyway. Instead, keep a
running collection of *only* the k largest values seen so far.

A **min-heap of size k** is perfect for this: it holds the k largest
values, and its top (the minimum of those k) is exactly the kth largest
value overall - because among the top k values, the smallest one is,
by definition, the kth largest. When a new value arrives, add it to the
heap; if that grows the heap past size k, remove the heap's minimum
(it's no longer one of the top k). Whatever remains on top is the
answer.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Sort on Every Call",
        explanation: "Keep all numbers in an array. Every time add() is called, push the new value, sort the whole array, and read off the kth largest by index.",
        code: `class KthLargest {
  constructor(k, nums) {
    this.k = k;
    this.nums = [...nums];
  }

  add(val) {
    this.nums.push(val);
    this.nums.sort((a, b) => b - a);
    return this.nums[this.k - 1];
  }
}`,
        timeComplexity: "O(n log n) per add call, where n is the number of values seen so far",
        spaceComplexity: "O(n) to store every value ever added",
      },
      {
        approach: "Optimal - Min-Heap of Size k",
        explanation: "Maintain a min-heap that only ever holds the k largest values seen so far. Its top is always the smallest of those k values - which is exactly the kth largest overall.",
        code: `class MinHeap {
  constructor() {
    this.data = [];
  }

  size() {
    return this.data.length;
  }

  peek() {
    return this.data[0];
  }

  push(val) {
    this.data.push(val);
    let i = this.data.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i] < this.data[parent]) {
        [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
        i = parent;
      } else break;
    }
  }

  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      let i = 0;
      const n = this.data.length;
      while (true) {
        let smallest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < n && this.data[left] < this.data[smallest]) smallest = left;
        if (right < n && this.data[right] < this.data[smallest]) smallest = right;
        if (smallest === i) break;
        [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
        i = smallest;
      }
    }
    return top;
  }
}

class KthLargest {
  constructor(k, nums) {
    this.k = k;
    this.heap = new MinHeap();
    for (const num of nums) this.add(num);
  }

  add(val) {
    this.heap.push(val);
    if (this.heap.size() > this.k) this.heap.pop();
    return this.heap.peek();
  }
}`,
        timeComplexity: "O(log k) per add call",
        spaceComplexity: "O(k) - the heap never grows past size k",
        walkthrough: [
          { code: "this.heap.push(val);", explanation: "Adds the new value to the running top-k collection." },
          { code: "if (this.heap.size() > this.k) this.heap.pop();", explanation: "If the heap now holds more than k values, the smallest one no longer belongs in the top k, so it's discarded." },
          { code: "return this.heap.peek();", explanation: "The smallest value among the current top k is, by definition, the kth largest value overall." },
        ],
      },
    ],
    relatedProblems: ["kth-largest-element-in-an-array", "find-median-from-data-stream"],
    keywords: ["heap", "priority queue", "min-heap", "stream", "kth largest"],
  },
  {
    id: "last-stone-weight",
    title: "Last Stone Weight",
    difficulty: "Easy",
    category: "heap",
    description: `
You have a collection of stones, each with a positive weight. Repeat the
following process until at most one stone remains:

- Pick up the two *heaviest* stones (call their weights \`x\` and \`y\`, with \`x <= y\`).
- Smash them together. If they're equal weight, both stones are destroyed. Otherwise, the lighter stone is destroyed and the heavier one loses \`x\` from its weight, leaving a new stone of weight \`y - x\`.

Return the weight of the single stone left at the end, or \`0\` if every
stone was destroyed.
    `.trim(),
    examples: [
      {
        input: "stones = [2, 7, 4, 1, 8, 1]",
        output: "1",
        explanation: "Smash 8 & 7 -> 1 remains, leaving [2,4,1,1,1]. Smash 4 & 2 -> 2 remains, leaving [2,1,1,1]. Smash 2 & 1 -> 1 remains, leaving [1,1,1]. Smash 1 & 1 -> both destroyed, leaving [1]. Final answer: 1.",
      },
      {
        input: "stones = [1]",
        output: "1",
        explanation: "Only one stone exists to begin with, so nothing gets smashed.",
      },
    ],
    constraints: ["1 <= stones.length <= 30", "1 <= stones[i] <= 1000"],
    hints: [
      "At every step you only care about the two heaviest stones - everything else is irrelevant until its turn comes.",
      "Repeatedly finding the two largest values in an array by scanning is wasteful. What structure gives you fast access to the current largest value?",
      "A max-heap lets you pop the two heaviest stones, combine them, and push the result back in, all in logarithmic time.",
    ],
    approachOverview: `
The process only ever touches the two *heaviest* stones at each step, so
you need repeated fast access to "what's currently the largest value in
this collection" - which is exactly what a **max-heap** provides.

Push every stone's weight onto a max-heap. Then repeatedly pop the two
largest values, and if they aren't equal, push the difference back onto
the heap. Stop when the heap has one or zero stones left.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Re-sort Each Round",
        explanation: "Sort the stones every time, smash the two largest, put the result back, and repeat until at most one stone remains.",
        code: `function lastStoneWeight(stones) {
  const arr = [...stones];

  while (arr.length > 1) {
    arr.sort((a, b) => a - b);
    const y = arr.pop();
    const x = arr.pop();
    if (y !== x) arr.push(y - x);
  }

  return arr.length > 0 ? arr[0] : 0;
}`,
        timeComplexity: "O(n^2 log n) - up to n rounds, each re-sorting the remaining stones",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal - Max-Heap",
        explanation: "Push all stones onto a max-heap. Repeatedly pop the two heaviest, and if a stone remains after the smash, push it back in.",
        code: `class MaxHeap {
  constructor() {
    this.data = [];
  }

  size() {
    return this.data.length;
  }

  push(val) {
    this.data.push(val);
    let i = this.data.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i] > this.data[parent]) {
        [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
        i = parent;
      } else break;
    }
  }

  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      let i = 0;
      const n = this.data.length;
      while (true) {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < n && this.data[left] > this.data[largest]) largest = left;
        if (right < n && this.data[right] > this.data[largest]) largest = right;
        if (largest === i) break;
        [this.data[i], this.data[largest]] = [this.data[largest], this.data[i]];
        i = largest;
      }
    }
    return top;
  }
}

function lastStoneWeight(stones) {
  const heap = new MaxHeap();
  for (const s of stones) heap.push(s);

  while (heap.size() > 1) {
    const y = heap.pop();
    const x = heap.pop();
    if (y !== x) heap.push(y - x);
  }

  return heap.size() > 0 ? heap.pop() : 0;
}`,
        timeComplexity: "O(n log n) - n stones pushed initially, then O(log n) per pop/push over roughly n rounds",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "const y = heap.pop();\n    const x = heap.pop();", explanation: "Pops the two currently-heaviest stones in one O(log n) step each." },
          { code: "if (y !== x) heap.push(y - x);", explanation: "If the stones weren't equal, the leftover weight goes back into the heap to be smashed again later." },
          { code: "return heap.size() > 0 ? heap.pop() : 0;", explanation: "Once at most one stone remains, that's the answer (or 0 if everything was destroyed)." },
        ],
      },
    ],
    relatedProblems: ["k-closest-points-to-origin", "task-scheduler"],
    keywords: ["heap", "priority queue", "max-heap", "simulation"],
  },
  {
    id: "k-closest-points-to-origin",
    title: "K Closest Points to Origin",
    difficulty: "Medium",
    category: "heap",
    description: `
You're given a list of points on a 2-D plane, each written as \`[x, y]\`,
and a number \`k\`. Find the \`k\` points that are closest to the origin
\`(0, 0)\`, using ordinary straight-line (Euclidean) distance.

Return those k points in any order - as long as the set of points is
correct, the order doesn't matter.
    `.trim(),
    examples: [
      {
        input: "points = [[1,3],[-2,2]], k = 1",
        output: "[[-2,2]]",
        explanation: "Distance of (1,3) from the origin is sqrt(1+9) = sqrt(10) ~ 3.16. Distance of (-2,2) is sqrt(4+4) = sqrt(8) ~ 2.83, which is smaller, so it's the closer point.",
      },
      {
        input: "points = [[3,3],[5,-1],[-2,4]], k = 2",
        output: "[[3,3],[-2,4]]",
        explanation: "Squared distances are 18, 26, and 20. The two smallest belong to (3,3) and (-2,4).",
      },
    ],
    constraints: ["1 <= k <= points.length <= 10^4", "-10^4 <= x[i], y[i] <= 10^4"],
    hints: [
      "You don't actually need the real distance - comparing squared distances gives the same ordering and skips the square root.",
      "Sorting every point by distance and taking the first k works, but you're paying to fully order points you don't even need ranked past position k.",
      "A max-heap of size k lets you keep only the k closest points seen so far, discarding the current farthest one whenever a closer point shows up.",
    ],
    approachOverview: `
Since you only need the k *closest* points, not a full ranking of every
point, sorting everything is more work than necessary. Comparing squared
distances (skipping the square root, which doesn't change the ordering)
already saves some work either way.

The efficient approach keeps a **max-heap of size k**, ordered by
distance. For each point, add it to the heap; once the heap grows past
size k, remove the point with the *largest* distance - it's now
guaranteed not to be among the k closest. Whatever remains in the heap
at the end is the answer.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Sort All Points",
        explanation: "Compute every point's squared distance from the origin, sort all points by that distance, and take the first k.",
        code: `function kClosest(points, k) {
  const sorted = [...points].sort((a, b) => {
    const distA = a[0] * a[0] + a[1] * a[1];
    const distB = b[0] * b[0] + b[1] * b[1];
    return distA - distB;
  });
  return sorted.slice(0, k);
}`,
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n) for the sorted copy",
      },
      {
        approach: "Optimal - Max-Heap of Size k",
        explanation: "Keep a max-heap (ordered by distance) that never grows past size k. Adding a new point that makes the heap too big evicts the currently-farthest point.",
        code: `class MaxHeap {
  constructor(compare) {
    this.data = [];
    this.compare = compare; // compare(a, b) > 0 means a should end up above b
  }

  size() {
    return this.data.length;
  }

  push(val) {
    this.data.push(val);
    let i = this.data.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(this.data[i], this.data[parent]) > 0) {
        [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
        i = parent;
      } else break;
    }
  }

  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      let i = 0;
      const n = this.data.length;
      while (true) {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < n && this.compare(this.data[left], this.data[largest]) > 0) largest = left;
        if (right < n && this.compare(this.data[right], this.data[largest]) > 0) largest = right;
        if (largest === i) break;
        [this.data[i], this.data[largest]] = [this.data[largest], this.data[i]];
        i = largest;
      }
    }
    return top;
  }
}

function kClosest(points, k) {
  const heap = new MaxHeap((a, b) => a.dist - b.dist);

  for (const point of points) {
    const dist = point[0] * point[0] + point[1] * point[1];
    heap.push({ point, dist });
    if (heap.size() > k) heap.pop();
  }

  const result = [];
  while (heap.size() > 0) result.push(heap.pop().point);
  return result;
}`,
        timeComplexity: "O(n log k) - each of the n points does an O(log k) heap operation",
        spaceComplexity: "O(k) - the heap never holds more than k points",
        walkthrough: [
          { code: "const dist = point[0] * point[0] + point[1] * point[1];", explanation: "Uses squared distance, which ranks points the same way as true distance but avoids computing a square root." },
          { code: "heap.push({ point, dist });", explanation: "Adds the point to the running top-k-closest collection." },
          { code: "if (heap.size() > k) heap.pop();", explanation: "If the heap now holds more than k points, the currently-farthest one is evicted - it can't be among the k closest." },
        ],
      },
    ],
    relatedProblems: ["last-stone-weight", "kth-largest-element-in-an-array"],
    keywords: ["heap", "priority queue", "max-heap", "distance", "top k"],
  },
  {
    id: "kth-largest-element-in-an-array",
    title: "Kth Largest Element in an Array",
    difficulty: "Medium",
    category: "heap",
    description: `
You're given an unsorted list of numbers and an integer \`k\`. Find the
\`k\`th largest value in the list - that's the value that would land in
position \`k\` if the list were sorted from largest to smallest (counting
duplicates as separate entries, not just distinct values).
    `.trim(),
    examples: [
      {
        input: "nums = [3,2,1,5,6,4], k = 2",
        output: "5",
        explanation: "Sorted descending: [6,5,4,3,2,1]. The 2nd entry is 5.",
      },
      {
        input: "nums = [3,2,3,1,2,4,5,5,6], k = 4",
        output: "4",
        explanation: "Sorted descending: [6,5,5,4,3,3,2,2,1]. The 4th entry is 4.",
      },
    ],
    constraints: ["1 <= k <= nums.length <= 10^4", "-10^4 <= nums[i] <= 10^4"],
    hints: [
      "Fully sorting the array works, but does more work than needed - you only care about one position in the sorted order, not the whole ordering.",
      "A min-heap that only ever holds the k largest values seen so far will have the answer sitting right on top once every number's been processed.",
      "There's an even faster average-case trick: the partitioning step from quicksort can be used to zero in on the kth position directly, without ever fully sorting.",
    ],
    approachOverview: `
Fully sorting the array (O(n log n)) is more work than the question
asks for, since you only need one specific position in that sorted
order, not the whole thing.

A **min-heap of size k** narrows this down: keep only the k largest
values seen so far, and the top of the heap (the smallest among them) is
the kth largest overall - the same idea used to track the kth largest
element in a live stream.

Going further, **quickselect** (built on quicksort's partition step) can
find the answer in average O(n) time: partition the array around a
pivot so everything larger ends up on one side, and recurse into only
the side that must contain the kth largest position - never both sides.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Sort",
        explanation: "Sort the array from largest to smallest, and read off the value at index k - 1.",
        code: `function findKthLargest(nums, k) {
  const sorted = [...nums].sort((a, b) => b - a);
  return sorted[k - 1];
}`,
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n) for the sorted copy",
      },
      {
        approach: "Min-Heap of Size k",
        explanation: "Push every number onto a min-heap, popping the smallest whenever the heap grows past size k. What's left on top at the end is the kth largest.",
        code: `class MinHeap {
  constructor() {
    this.data = [];
  }

  size() {
    return this.data.length;
  }

  peek() {
    return this.data[0];
  }

  push(val) {
    this.data.push(val);
    let i = this.data.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i] < this.data[parent]) {
        [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
        i = parent;
      } else break;
    }
  }

  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      let i = 0;
      const n = this.data.length;
      while (true) {
        let smallest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < n && this.data[left] < this.data[smallest]) smallest = left;
        if (right < n && this.data[right] < this.data[smallest]) smallest = right;
        if (smallest === i) break;
        [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
        i = smallest;
      }
    }
    return top;
  }
}

function findKthLargest(nums, k) {
  const heap = new MinHeap();
  for (const num of nums) {
    heap.push(num);
    if (heap.size() > k) heap.pop();
  }
  return heap.peek();
}`,
        timeComplexity: "O(n log k)",
        spaceComplexity: "O(k)",
      },
      {
        approach: "Optimal (Average Case) - Quickselect",
        explanation: "Reuse quicksort's partition step, but only recurse into the one side that must contain the target position - never both. On average this finds the answer in linear time.",
        code: `function findKthLargest(nums, k) {
  const n = nums.length;
  const targetIndex = n - k; // index the answer would sit at if nums were sorted ascending

  function partition(left, right, pivotIndex) {
    const pivotValue = nums[pivotIndex];
    [nums[pivotIndex], nums[right]] = [nums[right], nums[pivotIndex]];
    let storeIndex = left;
    for (let i = left; i < right; i++) {
      if (nums[i] < pivotValue) {
        [nums[i], nums[storeIndex]] = [nums[storeIndex], nums[i]];
        storeIndex++;
      }
    }
    [nums[storeIndex], nums[right]] = [nums[right], nums[storeIndex]];
    return storeIndex;
  }

  function quickselect(left, right) {
    if (left === right) return nums[left];

    const pivotIndex = left + Math.floor(Math.random() * (right - left + 1));
    const finalPivotIndex = partition(left, right, pivotIndex);

    if (finalPivotIndex === targetIndex) return nums[finalPivotIndex];
    if (finalPivotIndex < targetIndex) return quickselect(finalPivotIndex + 1, right);
    return quickselect(left, finalPivotIndex - 1);
  }

  return quickselect(0, n - 1);
}`,
        timeComplexity: "O(n) average case, O(n^2) worst case (mitigated in practice by the random pivot)",
        spaceComplexity: "O(1) extra (partitions in place), O(log n) average recursion depth",
        walkthrough: [
          { code: "const targetIndex = n - k;", explanation: "Converts 'kth largest' into 'what index would this land at in ascending sorted order' - the kth largest is the (n-k)th smallest." },
          { code: "const finalPivotIndex = partition(left, right, pivotIndex);", explanation: "Rearranges the segment so everything smaller than the pivot ends up to its left, everything larger to its right, and returns the pivot's final resting index." },
          { code: "if (finalPivotIndex === targetIndex) return nums[finalPivotIndex];", explanation: "If the pivot landed exactly on the target index, its value is the answer - no more work needed." },
          { code: "if (finalPivotIndex < targetIndex) return quickselect(finalPivotIndex + 1, right); ...", explanation: "Otherwise, only the half of the array that could still contain the target index is searched further - the other half is discarded entirely, unlike a full sort." },
        ],
      },
    ],
    relatedProblems: ["kth-largest-element-in-a-stream", "k-closest-points-to-origin"],
    keywords: ["heap", "priority queue", "quickselect", "partition", "kth largest"],
  },
  {
    id: "task-scheduler",
    title: "Task Scheduler",
    difficulty: "Medium",
    category: "heap",
    description: `
You're given a list of tasks, each labeled with an uppercase letter (the
same letter can appear multiple times, meaning that task needs to run
that many times total), and a cooldown number \`n\`.

The CPU can run one task per time unit, in any order you choose, but the
*same* task letter can't run again until at least \`n\` other time units
have passed since its last run - the CPU can sit idle during that wait
if there's nothing else eligible to run. Find the minimum total number
of time units needed to finish every task.
    `.trim(),
    examples: [
      {
        input: 'tasks = ["A","A","A","B","B","B"], n = 2',
        output: "8",
        explanation: 'One valid order is A -> B -> idle -> A -> B -> idle -> A -> B, which takes 8 time units. Any A must wait 2 units after the previous A, and the same for B.',
      },
      {
        input: 'tasks = ["A","A","A","B","B","B"], n = 0',
        output: "6",
        explanation: "With no cooldown at all, the tasks can just run back-to-back in any order, taking exactly as long as there are tasks.",
      },
    ],
    constraints: ["1 <= tasks.length <= 10^4", "tasks[i] is an uppercase English letter", "0 <= n <= 100"],
    hints: [
      "The task letter that appears the *most* is the one that ends up dictating the overall schedule's shape, since it needs the most cooldown gaps.",
      "Try scheduling greedily: at every time unit, run whichever eligible task currently has the most occurrences left. A max-heap tracks that efficiently.",
      "There's also a shortcut: the most frequent task creates a fixed number of 'slots' between its repeats, and you can compute directly whether other tasks (and idle time) fill those slots or overflow past them.",
    ],
    approachOverview: `
The task that occurs most often is the bottleneck: it forces gaps of at
least \`n\` between its own repeats, and everything else has to fit around
those gaps (or the schedule idles if nothing fits).

One way to build a valid schedule is a **greedy simulation with a
max-heap**: at each time unit, run whichever eligible task (one that
isn't still cooling down) currently has the most instances left, tracking
tasks in cooldown in a separate queue until they become eligible again.

A faster **counting argument** skips the simulation entirely. Let
\`maxFreq\` be the highest count any single task has, and \`numMax\` be how
many different tasks share that highest count. Picture the most frequent
task's repeats as dividers, each followed by an \`n\`-wide gap: that
creates \`(maxFreq - 1) * (n + 1) + numMax\` "slots" that must be filled by
other tasks or idle time. The answer is whichever is larger: that slot
count, or simply the total number of tasks (since you can never finish
faster than one time unit per task).
    `.trim(),
    solutions: [
      {
        approach: "Greedy Simulation - Max-Heap + Cooldown Queue",
        explanation: "Count how many times each task letter appears. At every time tick, run the most frequent eligible task (tracked in a max-heap), and put it in a cooldown queue until n more ticks have passed, at which point it becomes eligible again.",
        code: `class MaxHeap {
  constructor() {
    this.data = [];
  }

  size() {
    return this.data.length;
  }

  push(val) {
    this.data.push(val);
    let i = this.data.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i] > this.data[parent]) {
        [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
        i = parent;
      } else break;
    }
  }

  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      let i = 0;
      const n = this.data.length;
      while (true) {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < n && this.data[left] > this.data[largest]) largest = left;
        if (right < n && this.data[right] > this.data[largest]) largest = right;
        if (largest === i) break;
        [this.data[i], this.data[largest]] = [this.data[largest], this.data[i]];
        i = largest;
      }
    }
    return top;
  }
}

function leastInterval(tasks, n) {
  const counts = new Map();
  for (const t of tasks) counts.set(t, (counts.get(t) || 0) + 1);

  const heap = new MaxHeap();
  for (const c of counts.values()) heap.push(c);

  let time = 0;
  const cooldownQueue = []; // entries: [remainingCount, timeItBecomesEligibleAgain]

  while (heap.size() > 0 || cooldownQueue.length > 0) {
    time++;

    if (heap.size() > 0) {
      const remaining = heap.pop() - 1;
      if (remaining > 0) cooldownQueue.push([remaining, time + n]);
    }

    if (cooldownQueue.length > 0 && cooldownQueue[0][1] === time) {
      heap.push(cooldownQueue.shift()[0]);
    }
  }

  return time;
}`,
        timeComplexity: "O(n) - at most 26 task types, so heap operations are O(log 26) = O(1); the number of ticks simulated is bounded by the final answer",
        spaceComplexity: "O(1) - at most 26 entries across the heap and cooldown queue",
        walkthrough: [
          { code: "const remaining = heap.pop() - 1;", explanation: "Runs the currently-most-frequent eligible task for this time tick, using up one of its occurrences." },
          { code: "if (remaining > 0) cooldownQueue.push([remaining, time + n]);", explanation: "If that task still has occurrences left, it goes on cooldown, becoming eligible again n ticks later." },
          { code: "if (cooldownQueue.length > 0 && cooldownQueue[0][1] === time) {\n      heap.push(cooldownQueue.shift()[0]);\n    }", explanation: "Once a task's cooldown has fully elapsed, it re-enters the pool of eligible tasks." },
        ],
      },
      {
        approach: "Optimal - Counting Formula",
        explanation: "Find the task with the highest frequency and how many tasks tie for that frequency. That determines the minimum number of slots needed around the most frequent task's repeats; compare that to simply running every task back-to-back.",
        code: `function leastInterval(tasks, n) {
  const counts = new Array(26).fill(0);
  for (const t of tasks) counts[t.charCodeAt(0) - 65]++;

  const maxFreq = Math.max(...counts);
  const numMax = counts.filter((c) => c === maxFreq).length;

  const slots = (maxFreq - 1) * (n + 1) + numMax;
  return Math.max(tasks.length, slots);
}`,
        timeComplexity: "O(n) - one pass to count task frequencies (26 letters is treated as constant)",
        spaceComplexity: "O(1) - a fixed 26-entry count array",
        walkthrough: [
          { code: "const maxFreq = Math.max(...counts);", explanation: "The most frequent task determines the schedule's minimum shape, since it needs the most cooldown gaps." },
          { code: "const numMax = counts.filter((c) => c === maxFreq).length;", explanation: "Counts how many different tasks tie for that highest frequency - they can share the last round of slots evenly." },
          { code: "const slots = (maxFreq - 1) * (n + 1) + numMax;", explanation: "Pictures (maxFreq - 1) full cycles of 'one run + n cooldown slots', plus one final run for each tied-for-max task." },
          { code: "return Math.max(tasks.length, slots);", explanation: "If there are enough other tasks to fill every gap with no idling, the true answer is just the total task count instead." },
        ],
      },
    ],
    relatedProblems: ["last-stone-weight", "design-twitter"],
    keywords: ["heap", "priority queue", "greedy", "counting", "scheduling"],
  },
  {
    id: "design-twitter",
    title: "Design Twitter",
    difficulty: "Medium",
    category: "heap",
    description: `
Design a simplified version of Twitter with these operations:

- \`postTweet(userId, tweetId)\` - a user posts a new tweet.
- \`follow(followerId, followeeId)\` - one user starts following another.
- \`unfollow(followerId, followeeId)\` - one user stops following another.
- \`getNewsFeed(userId)\` - return the ids of the 10 most recent tweets in that user's feed. The feed includes the user's own tweets plus tweets from everyone they follow, ordered most recent first.
    `.trim(),
    examples: [
      {
        input: "postTweet(1, 5); getNewsFeed(1)",
        output: "[5]",
        explanation: "User 1's feed contains only their own tweet.",
      },
      {
        input: "follow(1, 2); postTweet(2, 6); getNewsFeed(1)",
        output: "[6, 5]",
        explanation: "User 1 now follows user 2, so user 2's tweet (6) appears too, ahead of user 1's older tweet (5) since it's more recent.",
      },
      {
        input: "unfollow(1, 2); getNewsFeed(1)",
        output: "[5]",
        explanation: "After unfollowing user 2, their tweets drop out of user 1's feed again.",
      },
    ],
    constraints: [
      "1 <= userId, followerId, followeeId <= 500",
      "0 <= tweetId <= 10^4",
      "All tweetId values are unique",
      "At most 3 * 10^4 calls total across all four operations",
    ],
    hints: [
      "Give every tweet a timestamp (just an ever-increasing counter works) so tweets from different users can be compared for recency.",
      "You only ever need the top 10 most recent tweets - you don't need every followed user's tweets fully sorted together.",
      "This is a lot like merging several already-sorted lists (each user's own tweets are naturally in time order) and taking the front 10 - a job a heap is built for.",
    ],
    approachOverview: `
Give every posted tweet a timestamp using a simple ever-increasing
counter, so any two tweets can be compared for recency regardless of who
posted them. Store each user's tweets in their own list, in the order
they were posted (which is automatically time-sorted).

Building a full news feed is then a **merge of several sorted lists**
(the user's own list, plus one list per followee) - keeping only the
top 10. Rather than combining every tweet from every relevant user, a
**max-heap** only needs to hold one "frontier" tweet per relevant user at
a time: pop the most recent tweet overall, then push that same user's
next-most-recent tweet to take its place, repeating 10 times. This finds
the top 10 without ever looking at more than a small number of tweets
from any one list.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Collect All and Sort",
        explanation: "Gather every tweet from the user and everyone they follow into one array, sort all of it by timestamp, and take the 10 most recent.",
        code: `class Twitter {
  constructor() {
    this.timestamp = 0;
    this.tweets = new Map(); // userId -> [[timestamp, tweetId], ...]
    this.followees = new Map(); // userId -> Set of followeeIds
  }

  postTweet(userId, tweetId) {
    if (!this.tweets.has(userId)) this.tweets.set(userId, []);
    this.tweets.get(userId).push([this.timestamp++, tweetId]);
  }

  follow(followerId, followeeId) {
    if (followerId === followeeId) return;
    if (!this.followees.has(followerId)) this.followees.set(followerId, new Set());
    this.followees.get(followerId).add(followeeId);
  }

  unfollow(followerId, followeeId) {
    if (this.followees.has(followerId)) {
      this.followees.get(followerId).delete(followeeId);
    }
  }

  getNewsFeed(userId) {
    const relevant = new Set([userId, ...(this.followees.get(userId) || [])]);
    let all = [];
    for (const uid of relevant) {
      const list = this.tweets.get(uid);
      if (list) all = all.concat(list);
    }
    all.sort((a, b) => b[0] - a[0]);
    return all.slice(0, 10).map((entry) => entry[1]);
  }
}`,
        timeComplexity: "O(1) for postTweet/follow/unfollow; O(T log T) for getNewsFeed, where T is the total number of tweets from the user and their followees",
        spaceComplexity: "O(T) total tweets stored, plus O(T) per getNewsFeed call",
      },
      {
        approach: "Optimal - Heap Merge of Per-User Tweet Lists",
        explanation: "Each user's tweets are already stored in time order. Instead of combining every tweet, keep just one 'current' tweet per relevant user in a max-heap, always pulling in that same user's next tweet after popping their most recent one - stopping once 10 tweets are collected.",
        code: `class MaxHeap {
  constructor(compare) {
    this.data = [];
    this.compare = compare;
  }

  size() {
    return this.data.length;
  }

  push(val) {
    this.data.push(val);
    let i = this.data.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(this.data[i], this.data[parent]) > 0) {
        [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
        i = parent;
      } else break;
    }
  }

  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      let i = 0;
      const n = this.data.length;
      while (true) {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < n && this.compare(this.data[left], this.data[largest]) > 0) largest = left;
        if (right < n && this.compare(this.data[right], this.data[largest]) > 0) largest = right;
        if (largest === i) break;
        [this.data[i], this.data[largest]] = [this.data[largest], this.data[i]];
        i = largest;
      }
    }
    return top;
  }
}

class Twitter {
  constructor() {
    this.timestamp = 0;
    this.tweets = new Map(); // userId -> [[timestamp, tweetId], ...], oldest first
    this.followees = new Map(); // userId -> Set of followeeIds
  }

  postTweet(userId, tweetId) {
    if (!this.tweets.has(userId)) this.tweets.set(userId, []);
    this.tweets.get(userId).push([this.timestamp++, tweetId]);
  }

  follow(followerId, followeeId) {
    if (followerId === followeeId) return;
    if (!this.followees.has(followerId)) this.followees.set(followerId, new Set());
    this.followees.get(followerId).add(followeeId);
  }

  unfollow(followerId, followeeId) {
    if (this.followees.has(followerId)) {
      this.followees.get(followerId).delete(followeeId);
    }
  }

  getNewsFeed(userId) {
    const relevant = [userId, ...(this.followees.get(userId) || [])];
    const heap = new MaxHeap((a, b) => a.time - b.time);

    for (const uid of relevant) {
      const list = this.tweets.get(uid);
      if (list && list.length > 0) {
        const idx = list.length - 1;
        heap.push({ time: list[idx][0], tweetId: list[idx][1], uid, idx });
      }
    }

    const result = [];
    while (result.length < 10 && heap.size() > 0) {
      const top = heap.pop();
      result.push(top.tweetId);

      if (top.idx > 0) {
        const list = this.tweets.get(top.uid);
        const newIdx = top.idx - 1;
        heap.push({ time: list[newIdx][0], tweetId: list[newIdx][1], uid: top.uid, idx: newIdx });
      }
    }

    return result;
  }
}`,
        timeComplexity: "O(1) for postTweet/follow/unfollow; O((F + 10) log F) for getNewsFeed, where F is how many users are followed",
        spaceComplexity: "O(T) total tweets stored, plus O(F) per getNewsFeed call for the heap",
        walkthrough: [
          { code: "heap.push({ time: list[idx][0], tweetId: list[idx][1], uid, idx });", explanation: "Seeds the heap with just each relevant user's single most recent tweet - not their whole history." },
          { code: "const top = heap.pop();\n      result.push(top.tweetId);", explanation: "The heap's top is always the most recent tweet among all the 'frontier' tweets currently being tracked." },
          { code: "if (top.idx > 0) { ... heap.push({ ... newIdx }); }", explanation: "Once a user's tweet is consumed, their next-most-recent tweet takes its place in the heap, keeping that user's list represented." },
        ],
      },
    ],
    relatedProblems: ["task-scheduler", "find-median-from-data-stream"],
    keywords: ["heap", "priority queue", "design", "merge k sorted lists", "social feed"],
  },
  {
    id: "find-median-from-data-stream",
    title: "Find Median from Data Stream",
    difficulty: "Hard",
    category: "heap",
    description: `
Design a class that processes a stream of numbers arriving one at a
time, and can report the *median* of all numbers seen so far at any
point.

The median is the middle value of a sorted list - if there's an odd
number of values, it's the single middle one; if there's an even number,
it's the average of the two middle ones.

The class supports two operations: \`addNum(num)\`, which adds a number to
the stream, and \`findMedian()\`, which returns the median of every number
added so far.
    `.trim(),
    examples: [
      {
        input: "addNum(1); addNum(2); findMedian()",
        output: "1.5",
        explanation: "The numbers so far are [1,2]. With an even count, the median is the average of both middle values: (1+2)/2 = 1.5.",
      },
      {
        input: "addNum(3); findMedian()",
        output: "2",
        explanation: "The numbers so far are [1,2,3]. With an odd count, the median is the single middle value, which is 2.",
      },
    ],
    constraints: ["-10^5 <= num <= 10^5", "At most 5 * 10^4 calls total to addNum and findMedian"],
    hints: [
      "Keeping the stream in a sorted array works, but inserting a new number into the middle of a sorted array means shifting a lot of elements.",
      "You don't need the whole stream fully sorted - you only ever ask about the middle. What if you only kept the smaller half and the larger half separately?",
      "A max-heap for the smaller half and a min-heap for the larger half each expose exactly the value nearest the middle from their side - keep the two halves the same size (or off by one) as numbers arrive.",
    ],
    approachOverview: `
Keeping every number in a fully sorted array works, but inserting into
the middle of a sorted array requires shifting elements - and you never
actually need the whole array sorted, just always know what's *near
the middle*.

The trick is to split the stream into two halves: a **max-heap** holding
the smaller half of the numbers (so its top is the largest of the small
half - the number just below the middle), and a **min-heap** holding the
larger half (so its top is the smallest of the large half - the number
just above the middle). Keeping the two heaps balanced in size (equal, or
the max-heap one larger) means the median is always readable directly
from their tops, with no need to look at anything else.

Every new number goes into whichever half it belongs to, and then the
heaps are rebalanced by size if needed.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Sorted Array with Insertion",
        explanation: "Keep all numbers in a sorted array. Each addNum finds the correct insertion point and splices the number in; findMedian just reads the middle position(s) directly.",
        code: `class MedianFinder {
  constructor() {
    this.sorted = [];
  }

  addNum(num) {
    let lo = 0;
    let hi = this.sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.sorted[mid] < num) lo = mid + 1;
      else hi = mid;
    }
    this.sorted.splice(lo, 0, num);
  }

  findMedian() {
    const n = this.sorted.length;
    const mid = n >> 1;
    if (n % 2 === 1) return this.sorted[mid];
    return (this.sorted[mid - 1] + this.sorted[mid]) / 2;
  }
}`,
        timeComplexity: "O(n) per addNum (binary search is O(log n), but splice's shift is O(n)); O(1) per findMedian",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal - Two Heaps",
        explanation: "Split the stream across a max-heap (the smaller half) and a min-heap (the larger half), always kept balanced in size. The median is then read straight off their tops.",
        code: `class Heap {
  constructor(compare) {
    this.data = [];
    this.compare = compare; // negative means a belongs above b
  }

  size() {
    return this.data.length;
  }

  peek() {
    return this.data[0];
  }

  push(val) {
    this.data.push(val);
    let i = this.data.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(this.data[i], this.data[parent]) < 0) {
        [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
        i = parent;
      } else break;
    }
  }

  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      let i = 0;
      const n = this.data.length;
      while (true) {
        let best = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < n && this.compare(this.data[left], this.data[best]) < 0) best = left;
        if (right < n && this.compare(this.data[right], this.data[best]) < 0) best = right;
        if (best === i) break;
        [this.data[i], this.data[best]] = [this.data[best], this.data[i]];
        i = best;
      }
    }
    return top;
  }
}

class MedianFinder {
  constructor() {
    this.lowerHalf = new Heap((a, b) => b - a); // max-heap: smaller half of the numbers
    this.upperHalf = new Heap((a, b) => a - b); // min-heap: larger half of the numbers
  }

  addNum(num) {
    if (this.lowerHalf.size() === 0 || num <= this.lowerHalf.peek()) {
      this.lowerHalf.push(num);
    } else {
      this.upperHalf.push(num);
    }

    // Rebalance so lowerHalf has either the same count as upperHalf, or exactly one more.
    if (this.lowerHalf.size() > this.upperHalf.size() + 1) {
      this.upperHalf.push(this.lowerHalf.pop());
    } else if (this.upperHalf.size() > this.lowerHalf.size()) {
      this.lowerHalf.push(this.upperHalf.pop());
    }
  }

  findMedian() {
    if (this.lowerHalf.size() === this.upperHalf.size()) {
      return (this.lowerHalf.peek() + this.upperHalf.peek()) / 2;
    }
    return this.lowerHalf.peek();
  }
}`,
        timeComplexity: "O(log n) per addNum; O(1) per findMedian",
        spaceComplexity: "O(n) total across both heaps",
        walkthrough: [
          { code: "if (this.lowerHalf.size() === 0 || num <= this.lowerHalf.peek()) { this.lowerHalf.push(num); } else { this.upperHalf.push(num); }", explanation: "Routes the new number to whichever half it logically belongs in - the small half if it's not bigger than that half's current largest value." },
          { code: "if (this.lowerHalf.size() > this.upperHalf.size() + 1) { this.upperHalf.push(this.lowerHalf.pop()); }", explanation: "If the small half grew too large, its biggest value is handed over to the large half to restore balance." },
          { code: "else if (this.upperHalf.size() > this.lowerHalf.size()) { this.lowerHalf.push(this.upperHalf.pop()); }", explanation: "Symmetrically, if the large half ever outgrows the small half, its smallest value moves over instead." },
          { code: "if (this.lowerHalf.size() === this.upperHalf.size()) { return (this.lowerHalf.peek() + this.upperHalf.peek()) / 2; }\n    return this.lowerHalf.peek();", explanation: "Equal-size halves average their two middle values; otherwise the (deliberately larger) lower half's top is the single middle value." },
        ],
      },
    ],
    relatedProblems: ["kth-largest-element-in-a-stream", "design-twitter"],
    keywords: ["heap", "priority queue", "two heaps", "median", "design", "stream"],
  },
];
