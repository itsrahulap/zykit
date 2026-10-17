import type { Problem } from "../../types/problem";

export const heapProblems: Problem[] = [
  {
    id: "kth-largest-element-in-a-stream",
    title: "Kth Largest Element in a Stream",
    difficulty: "Easy",
    category: "heap",
    description: `
Design a class that tracks the *kth largest* element in a collection of
numbers that arrive one at a time.

The constructor takes an integer \`k\` and an initial array of numbers.
\`add(val)\` adds \`val\` and returns the kth largest element *so far*.
Duplicates count: it's the kth largest, not the kth distinct value.

There will always be at least k numbers when \`add\` is called.
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
      "Re-sorting on every add() call repeats a lot of work as the stream grows.",
      "You only need the k *largest* values. Numbers outside the top k don't matter.",
      "What if you kept only the k largest values so far, and could instantly see the smallest of them?",
    ],
    approachOverview: `
Re-sorting on every call re-examines numbers that will never be in the
top k. Instead, keep *only* the k largest values seen so far.

A **min-heap of size k** fits this well. It holds the k largest values,
and its top (the smallest of those k) is the kth largest overall. When a
value arrives, add it. If the heap grows past size k, remove its minimum,
which is no longer in the top k. The top is the answer.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Sort on Every Call",
        explanation: "Keep all numbers in an array. On each add(), push the value, sort the array, and read the kth largest by index.",
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
        explanation: "Keep a min-heap of only the k largest values so far. Its top, the smallest of those k, is the kth largest overall.",
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
          { code: "if (this.heap.size() > this.k) this.heap.pop();", explanation: "If the heap holds more than k values, the smallest is no longer in the top k, so discard it." },
          { code: "return this.heap.peek();", explanation: "The smallest of the top k is the kth largest overall." },
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
You have stones, each with a positive weight. Repeat until at most one
stone remains:

- Pick up the two *heaviest* stones (call their weights \`x\` and \`y\`, with \`x <= y\`).
- Smash them together. If they weigh the same, both are destroyed. Otherwise, the lighter one is destroyed and the heavier one becomes weight \`y - x\`.

Return the weight of the last stone, or \`0\` if none are left.
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
      "At each step you only care about the two heaviest stones.",
      "Scanning for the two largest values every time is wasteful. What structure gives fast access to the current largest value?",
      "A max-heap lets you pop the two heaviest stones and push the result back, all in logarithmic time.",
    ],
    approachOverview: `
Each step only uses the two *heaviest* stones, so you need fast access
to the current largest value. A **max-heap** gives you that.

Push every weight onto a max-heap. Repeatedly pop the two largest, and
if they differ, push the difference back. Stop when one or zero stones
are left.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Re-sort Each Round",
        explanation: "Sort the stones each round, smash the two largest, put the result back, and repeat until at most one remains.",
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
          { code: "if (y !== x) heap.push(y - x);", explanation: "If the stones weren't equal, the leftover weight goes back into the heap." },
          { code: "return heap.size() > 0 ? heap.pop() : 0;", explanation: "The last stone is the answer, or 0 if none are left." },
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
Given a list of 2-D points, each written as \`[x, y]\`, and a number
\`k\`, return the \`k\` points closest to the origin \`(0, 0)\` by
straight-line (Euclidean) distance.

Return them in any order.
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
      "You don't need the real distance. Squared distances give the same order without a square root.",
      "Sorting all points and taking the first k works, but you pay to rank points you don't need.",
      "A max-heap of size k keeps only the k closest points so far, dropping the farthest when a closer one shows up.",
    ],
    approachOverview: `
You only need the k *closest* points, not a full ranking, so sorting
everything is more work than needed. Either way, compare squared
distances: skipping the square root doesn't change the order.

The efficient approach keeps a **max-heap of size k**, ordered by
distance. Add each point. When the heap grows past k, remove the point
with the *largest* distance, since it can't be among the k closest. The
heap holds the answer at the end.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Sort All Points",
        explanation: "Sort all points by squared distance from the origin and take the first k.",
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
        explanation: "Keep a max-heap, ordered by distance, of at most k points. When a new point makes it too big, evict the farthest point.",
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
          { code: "const dist = point[0] * point[0] + point[1] * point[1];", explanation: "Squared distance ranks points the same as true distance, without a square root." },
          { code: "heap.push({ point, dist });", explanation: "Adds the point to the running top-k-closest collection." },
          { code: "if (heap.size() > k) heap.pop();", explanation: "If the heap holds more than k points, evict the farthest. It can't be among the k closest." },
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
Given an unsorted list of numbers and an integer \`k\`, find the \`k\`th
largest value: the value at position \`k\` if the list were sorted from
largest to smallest. Duplicates count as separate entries.
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
      "Sorting works, but does more than needed. You only care about one position in the sorted order.",
      "A min-heap holding only the k largest values so far has the answer on top after every number is processed.",
      "Faster on average: quicksort's partition step can zero in on the kth position without fully sorting.",
    ],
    approachOverview: `
Fully sorting (O(n log n)) is more than needed, since you only want one
position in the sorted order.

A **min-heap of size k** keeps only the k largest values so far. Its top
(the smallest of them) is the kth largest overall. This is the same idea
used to track the kth largest element in a stream.

**Quickselect**, built on quicksort's partition step, finds the answer in
average O(n) time. Partition around a pivot so larger values end up on
one side, then recurse only into the side that holds the kth largest
position, never both.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Sort",
        explanation: "Sort from largest to smallest and read the value at index k - 1.",
        code: `function findKthLargest(nums, k) {
  const sorted = [...nums].sort((a, b) => b - a);
  return sorted[k - 1];
}`,
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n) for the sorted copy",
      },
      {
        approach: "Min-Heap of Size k",
        explanation: "Push each number onto a min-heap, popping the smallest whenever it grows past size k. The top at the end is the kth largest.",
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
        explanation: "Reuse quicksort's partition step, but recurse only into the side that contains the target position, never both. On average this takes linear time.",
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
          { code: "const targetIndex = n - k;", explanation: "Converts 'kth largest' to an index in ascending order: the kth largest is the (n-k)th smallest." },
          { code: "const finalPivotIndex = partition(left, right, pivotIndex);", explanation: "Moves smaller values left of the pivot and larger values right, then returns the pivot's final index." },
          { code: "if (finalPivotIndex === targetIndex) return nums[finalPivotIndex];", explanation: "If the pivot landed on the target index, its value is the answer." },
          { code: "if (finalPivotIndex < targetIndex) return quickselect(finalPivotIndex + 1, right); ...", explanation: "Otherwise, search only the side that can contain the target index. Unlike a full sort, the other side is dropped." },
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
You're given a list of tasks, each labeled with an uppercase letter, and
a cooldown \`n\`. A letter that appears several times must run that many
times.

The CPU runs one task per time unit, in any order. The *same* letter
can't run again until at least \`n\` other time units have passed. The
CPU can sit idle if nothing else can run. Return the minimum number of
time units to finish every task.
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
      "The task that appears the *most* shapes the schedule, since it needs the most cooldown gaps.",
      "Try greedy scheduling: each time unit, run the eligible task with the most occurrences left. A max-heap tracks this efficiently.",
      "Shortcut: the most frequent task creates a fixed number of 'slots' between its repeats. You can compute directly whether other tasks (and idle time) fill those slots or overflow them.",
    ],
    approachOverview: `
The most frequent task is the bottleneck. It forces gaps of at least
\`n\` between its repeats, and everything else must fit in those gaps (or
the CPU idles).

One option is a **greedy simulation with a max-heap**. Each time unit,
run the eligible task (not cooling down) with the most instances left.
Tasks in cooldown wait in a separate queue until they're eligible again.

A faster **counting argument** skips the simulation. Let \`maxFreq\` be
the highest count of any task, and \`numMax\` the number of tasks with
that count. Picture the most frequent task's repeats as dividers, each
followed by an \`n\`-wide gap. That creates
\`(maxFreq - 1) * (n + 1) + numMax\` "slots" to fill with other tasks or
idle time. The answer is the larger of that slot count and the total
number of tasks, since you can't go faster than one time unit per task.
    `.trim(),
    solutions: [
      {
        approach: "Greedy Simulation - Max-Heap + Cooldown Queue",
        explanation: "Count each task letter. Each tick, run the most frequent eligible task (from a max-heap), then put it in a cooldown queue until n more ticks pass.",
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
          { code: "const remaining = heap.pop() - 1;", explanation: "Runs the most frequent eligible task this tick, using up one occurrence." },
          { code: "if (remaining > 0) cooldownQueue.push([remaining, time + n]);", explanation: "If the task has occurrences left, it goes on cooldown for n ticks." },
          { code: "if (cooldownQueue.length > 0 && cooldownQueue[0][1] === time) {\n      heap.push(cooldownQueue.shift()[0]);\n    }", explanation: "When a task's cooldown ends, it becomes eligible again." },
        ],
      },
      {
        approach: "Optimal - Counting Formula",
        explanation: "Find the highest task frequency and how many tasks share it. That gives the minimum slots needed around the most frequent task's repeats. Compare it to running every task back-to-back.",
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
          { code: "const maxFreq = Math.max(...counts);", explanation: "The most frequent task sets the schedule's minimum shape, since it needs the most cooldown gaps." },
          { code: "const numMax = counts.filter((c) => c === maxFreq).length;", explanation: "Counts how many tasks tie for the highest frequency. They share the last round of slots." },
          { code: "const slots = (maxFreq - 1) * (n + 1) + numMax;", explanation: "(maxFreq - 1) full cycles of 'one run + n cooldown slots', plus one final run per tied-for-max task." },
          { code: "return Math.max(tasks.length, slots);", explanation: "If other tasks fill every gap with no idling, the answer is just the total task count." },
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
      "Give every tweet a timestamp (an increasing counter works) so tweets from different users can be compared.",
      "You only need the 10 most recent tweets, not every followed user's tweets fully sorted.",
      "This is like merging several sorted lists (each user's tweets are already in time order) and taking the first 10. A heap is built for that.",
    ],
    approachOverview: `
Give each tweet a timestamp from an increasing counter, so any two
tweets can be compared. Store each user's tweets in their own list in
posting order, which is already time-sorted.

A news feed is then a **merge of several sorted lists** (the user's own
plus one per followee), keeping only the top 10. Instead of combining
every tweet, a **max-heap** holds one "frontier" tweet per user. Pop the
most recent tweet, then push that user's next-most-recent tweet in its
place. Repeat 10 times. This only looks at a few tweets from each list.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Collect All and Sort",
        explanation: "Gather every tweet from the user and their followees into one array, sort by timestamp, and take the 10 most recent.",
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
        explanation: "Each user's tweets are already in time order. Keep one 'current' tweet per relevant user in a max-heap. After popping a user's tweet, push their next one. Stop at 10 tweets.",
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
          { code: "heap.push({ time: list[idx][0], tweetId: list[idx][1], uid, idx });", explanation: "Seeds the heap with each relevant user's most recent tweet, not their whole history." },
          { code: "const top = heap.pop();\n      result.push(top.tweetId);", explanation: "The top is always the most recent of the tracked 'frontier' tweets." },
          { code: "if (top.idx > 0) { ... heap.push({ ... newIdx }); }", explanation: "That user's next-most-recent tweet takes the popped tweet's place in the heap." },
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
Design a class that takes numbers one at a time and can report the
*median* of all numbers so far.

The median is the middle value of a sorted list. With an odd count, it's
the middle value. With an even count, it's the average of the two middle
values.

\`addNum(num)\` adds a number, and \`findMedian()\` returns the median of
every number added so far.
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
      "A sorted array works, but inserting into its middle means shifting many elements.",
      "You only ask about the middle, not the full order. What if you kept the smaller half and the larger half separately?",
      "A max-heap for the smaller half and a min-heap for the larger half each expose the value nearest the middle. Keep them the same size (or off by one) as numbers arrive.",
    ],
    approachOverview: `
A sorted array works, but inserting into the middle means shifting
elements. And you never need the whole array sorted, only what's *near
the middle*.

Split the stream into two halves:

- A **max-heap** holds the smaller half. Its top is the number just below the middle.
- A **min-heap** holds the larger half. Its top is the number just above the middle.

Keep the heaps balanced in size (equal, or the max-heap one larger), and
the median can always be read from their tops.

Each new number goes into the half it belongs to, then the heaps are
rebalanced if needed.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Sorted Array with Insertion",
        explanation: "Keep all numbers in a sorted array. addNum finds the insertion point and splices the number in. findMedian reads the middle position(s).",
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
        explanation: "Split the stream across a max-heap (smaller half) and a min-heap (larger half), kept balanced in size. Read the median from their tops.",
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
          { code: "if (this.lowerHalf.size() === 0 || num <= this.lowerHalf.peek()) { this.lowerHalf.push(num); } else { this.upperHalf.push(num); }", explanation: "Puts the number in the small half if it's not bigger than that half's largest value, otherwise in the large half." },
          { code: "if (this.lowerHalf.size() > this.upperHalf.size() + 1) { this.upperHalf.push(this.lowerHalf.pop()); }", explanation: "If the small half grew too large, its biggest value moves to the large half." },
          { code: "else if (this.upperHalf.size() > this.lowerHalf.size()) { this.lowerHalf.push(this.upperHalf.pop()); }", explanation: "If the large half outgrows the small half, its smallest value moves over." },
          { code: "if (this.lowerHalf.size() === this.upperHalf.size()) { return (this.lowerHalf.peek() + this.upperHalf.peek()) / 2; }\n    return this.lowerHalf.peek();", explanation: "Equal halves: average the two tops. Otherwise the lower half (kept one larger) has the middle value on top." },
        ],
      },
    ],
    relatedProblems: ["kth-largest-element-in-a-stream", "design-twitter"],
    keywords: ["heap", "priority queue", "two heaps", "median", "design", "stream"],
  },
];
